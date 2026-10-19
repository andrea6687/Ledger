import { describe, expect, test } from 'claude-code/testing'

const usage = { input_tokens: 1, output_tokens: 1 }

const norm = (p: string): string =>
  p.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, letter: string) => `${letter.toUpperCase()}:`)

// Il runner, su Linux, antepone la propria cwd a un percorso `C:/…`, che non tratta come assoluto.
const fromRunner = (p: string): string => {
  const n = norm(p)
  const at = n.search(/\/[A-Za-z]:\//)

  return at === -1 ? n : n.slice(at + 1)
}

type Harness = {
  cwd?: string
  present?: string[]
  disk?: Record<string, string>
  replies?: (string | null)[]
  git?: boolean
  blockGitignore?: boolean
}

async function setup($: any, on: any, harness: Harness = {}) {
  const cwd = harness.cwd ?? '/work'
  const disk: Record<string, string> = {}

  for (const [path, text] of Object.entries(harness.disk ?? {})) disk[norm(path)] = text

  const root = norm(cwd).replace(/\/+$/, '')
  const present = new Set((harness.present ?? [`${root}/src/app.py`]).map(norm))

  if (harness.git) present.add(`${root}/.git`)
  const replies = [...(harness.replies ?? [])]
  const toasts: { text?: string; timeoutMs?: number }[] = []

  on('ui.toast', (_$: any, e: { text?: string; timeoutMs?: number }) => {
    toasts.push({ text: e.text, timeoutMs: e.timeoutMs })
    return { value: undefined }
  })
  on('session.start', (_$: any, e: any) => ({ cwd: e.cwd }))
  on('prompt.submit', (_$: any, e: any) => ({ text: e.text }))
  on('turn.start', () => ({ turnId: 't1' }))
  on('tool.call', () => ({ result: 'ok' }))
  on('turn.complete', () => ({ text: '' }))
  on('session.cwd', () => ({ value: cwd }))
  on('clock.now', () => ({ value: Date.UTC(2026, 9, 8, 9, 41) }))
  on('fs.exists', (_$: any, e: { path: string }) => ({
    value: present.has(fromRunner(e.path)) || Object.prototype.hasOwnProperty.call(disk, fromRunner(e.path)),
  }))
  on('fs.read', (_$: any, e: { path: string }) => ({ value: disk[fromRunner(e.path)] ?? '' }))
  on('fs.write', (_$: any, e: { path: string; text: string }) => {
    const path = fromRunner(e.path)

    if (harness.blockGitignore && path.endsWith('/.gitignore')) return { deny: 'blocked' }

    disk[path] = e.text
    return { value: undefined }
  })
  on('model.complete', () => {
    const modelText = replies.shift() ?? null

    return modelText === null
      ? { value: { isAnswered: false, reason: 'empty-reply', usage } }
      : { value: { isAnswered: true, text: modelText, usage } }
  })

  await $.session.start({ surface: 'terminal', isInteractive: true, cwd } as any)

  return {
    disk,
    present,
    toasts,
    ledger: () => disk[`${norm(cwd).replace(/\/+$/, '')}/LEDGER.md`] ?? '',
  }
}

async function edit($: any, file: string, before = 'iva = x * 0.2', after = 'iva = x * 0.22') {
  await $.tool.call({ tool: 'Edit', file_path: file, old_string: before, new_string: after } as any)
}

describe('ledger', () => {
  test('scrive richiesta, perché e cosa è cambiato', async ($, on) => {
    const { ledger, toasts } = await setup($, on, {
      replies: ['{"why": "The VAT rate was wrong.", "files": {"src/app.py": "Rate changed from 0.2 to 0.22."}}'],
    })

    await $.prompt.submit({ text: 'Correggi il calcolo dell\'IVA in app.py' } as any)
    await $.prompt.submit({ text: '<task-notification>done</task-notification>' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.tool.call({ tool: 'Write', file_path: '/tmp/scratch.py', content: 'x = 1\n' } as any)
    await $.turn.complete({ reason: 'answer', answer: 'Ho portato l\'aliquota al 22%.', durationMs: 1 } as any)

    const text = ledger()

    expect(toasts).toEqual([{ text: 'LEDGER.md updated (1 file)', timeoutMs: 10000 }])
    expect(text).toContain('Generated automatically by the ledger mod: one section for each day')
    expect(text).toContain('## 2026-10-08')
    expect(text).not.toContain('09:41')
    expect(text).toContain('`src/app.py`: modified (1 edit,')
    expect(text).toContain('**Requests:**\n- Correggi il calcolo dell\'IVA')
    expect(text).toContain('**Why:** The VAT rate was wrong.')
    expect(text).toContain('What changed: Rate changed from 0.2 to 0.22.')
    expect(text).not.toContain('task-notification')
    expect(text).not.toContain('scratch.py')
  })

  test('senza risposta del modello scrive comunque file e richiesta', async ($, on) => {
    const { ledger, toasts } = await setup($, on, { replies: [null] })

    await $.prompt.submit({ text: 'Correggi il calcolo dell\'IVA in app.py' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ho portato l\'aliquota al 22%.', durationMs: 1 } as any)

    const text = ledger()

    expect(toasts).toEqual([{ text: 'LEDGER.md updated (1 file)', timeoutMs: 10000 }])
    expect(text).toContain('`src/app.py`: modified (1 edit,')
    expect(text).toContain('**Requests:**\n- Correggi il calcolo dell\'IVA')
    expect(text).not.toContain('What changed')
  })

  test('due turni nello stesso giorno aggiornano la sezione', async ($, on) => {
    const { ledger } = await setup($, on, {
      present: ['/work/src/app.py', '/work/tests/app.test.py'],
      replies: [
        '{"why": "The VAT rate was wrong.", "files": {"src/app.py": "Rate was 0.2."}}',
        '{"why": "The VAT rate is covered.", "files": {"src/app.py": "Rate changed from 0.2 to 0.22.", "tests/app.test.py": "Added a VAT test."}}',
        '{"why": "The VAT rate is covered.", "files": {"src/app.py": "Rate changed from 0.2 to 0.22."}}',
      ],
    })

    await $.prompt.submit({ text: 'Correggi il calcolo dell\'IVA in app.py' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Fatto.', durationMs: 1 } as any)

    await $.prompt.submit({ text: 'Aggiungi i test' } as any)
    await $.turn.start({ turnId: 't2' } as any)
    await edit($, '/work/src/app.py', 'iva = x * 0.22', 'iva = x * 0.22')
    await edit($, '/work/tests/app.test.py', 'pass', 'def test_iva():\n    assert True')
    await $.turn.complete({ reason: 'answer', answer: 'Test aggiunti.', durationMs: 1 } as any)

    const once = ledger()

    expect(once).toBe(`# Ledger

Generated automatically by the ledger mod: one section for each day in which Claude modified files.

## 2026-10-08

**Requests:**
- Correggi il calcolo dell'IVA in app.py
- Aggiungi i test

**Why:** The VAT rate is covered.

- \`src/app.py\`: modified (1 edit, +1 −1)
  - What changed: Rate changed from 0.2 to 0.22.
- \`tests/app.test.py\`: modified (1 edit, +2 −1)
  - What changed: Added a VAT test.
`)
    expect(once).not.toContain('Rate was 0.2.')
    expect(once.split('## 2026-10-08').length - 1).toBe(1)

    await $.prompt.submit({ text: 'Aggiungi i test' } as any)
    await $.turn.start({ turnId: 't3' } as any)
    await edit($, '/work/src/app.py', 'iva = x * 0.22', 'iva = x * 0.22')
    await $.turn.complete({ reason: 'answer', answer: 'Ancora i test.', durationMs: 1 } as any)

    expect(ledger()).toBe(once)
    expect(ledger().split('Aggiungi i test').length - 1).toBe(1)
  })

  test('le sezioni dei giorni precedenti restano intatte', async ($, on) => {
    const yesterday = `# Ledger

Generated automatically by the ledger mod: one section for each day in which Claude modified files.

## 2026-10-07

**Requests:**
- Ieri

- \`src/old.py\`: modified (1 edit, +1 −0)
  - What changed: Left alone.
`
    const { ledger } = await setup($, on, {
      disk: { '/work/LEDGER.md': yesterday },
      replies: ['{"why": "Today only.", "files": {"src/app.py": "Touched today."}}'],
    })

    await $.prompt.submit({ text: 'Oggi' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)

    const text = ledger()

    expect(text.startsWith(yesterday.trimEnd())).toBe(true)
    expect(text).toContain('What changed: Left alone.')
    expect(text).toContain('## 2026-10-08')
    expect(text).toContain('What changed: Touched today.')
    expect(text.split('## 2026-10-07').length - 1).toBe(1)
  })

  test('ignora i file che non sono più su disco e li toglie dalla sezione di oggi', async ($, on) => {
    const { ledger, present } = await setup($, on, {
      present: ['/work/src/app.py', '/work/src/temp.py'],
      replies: [
        '{"why": "Both files.", "files": {"src/app.py": "Kept.", "src/temp.py": "Temporary."}}',
        '{"why": "Temp is gone.", "files": {"src/app.py": "Still here."}}',
      ],
    })

    await $.prompt.submit({ text: 'Crea due file' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await edit($, '/work/src/temp.py')
    await $.turn.complete({ reason: 'answer', answer: 'Fatto.', durationMs: 1 } as any)
    expect(ledger()).toContain('`src/temp.py`')

    present.delete('/work/src/temp.py')
    await $.prompt.submit({ text: 'Tieni solo app.py' } as any)
    await $.turn.start({ turnId: 't2' } as any)
    await edit($, '/work/src/app.py')
    await edit($, '/work/src/gone.py')
    await $.turn.complete({ reason: 'answer', answer: 'Pulito.', durationMs: 1 } as any)

    const text = ledger()

    expect(text).toContain('What changed: Still here.')
    expect(text).not.toContain('temp.py')
    expect(text).not.toContain('gone.py')
    expect(text).not.toContain('Temporary.')
  })

  test('normalizza i percorsi Windows e scarta gli assoluti esterni', async ($, on) => {
    const { ledger } = await setup($, on, {
      cwd: 'c:\\work',
      present: ['C:/work/src/app.py', 'C:/other/nope.py', 'D:/outside/x.py'],
      replies: ['{"why": "Path fix.", "files": {"src/app.py": "Drive letter folded."}}'],
    })

    await $.prompt.submit({ text: 'Sistema i percorsi' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, 'C:\\work\\src\\app.py')
    await edit($, 'C:\\other\\nope.py')
    await edit($, 'D:\\outside\\x.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)

    const text = ledger()

    expect(text).toContain('`src/app.py`: modified (1 edit,')
    expect(text).toContain('What changed: Drive letter folded.')
    expect(text).not.toContain('nope.py')
    expect(text).not.toContain('outside')
    expect(text).not.toContain('C:')
    expect(text).not.toContain('D:')
  })

  test('una notifica non eredita la richiesta e non aggiunge una voce vuota', async ($, on) => {
    const { ledger } = await setup($, on, {
      present: ['/work/src/app.py', '/work/src/next.py'],
      replies: [
        '{"why": "Parser.", "files": {"src/app.py": "Parser fixed."}}',
        '{"why": "Next file.", "files": {"src/next.py": "Follow-up edit."}}',
        '{"why": "Notification turn.", "files": {"src/app.py": "Parser fixed."}}',
      ],
    })

    await $.prompt.submit({ text: 'Fix the parser' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.prompt.submit({ text: ' \t<task-notification>\n<task-id>abc</task-id>\n</task-notification>' } as any)
    await $.turn.complete({ reason: 'answer', answer: 'Notifica.', durationMs: 1 } as any)

    const cleared = ledger()

    expect(cleared).toContain('`src/app.py`')
    expect(cleared).not.toContain('Fix the parser')
    expect(cleared).not.toContain('task-notification')
    expect(cleared).not.toContain('task-id')
    expect(cleared).not.toContain('**Requests:**')

    await $.prompt.submit({ text: 'Add the next file' } as any)
    await $.turn.start({ turnId: 't2' } as any)
    await edit($, '/work/src/next.py')
    await $.turn.complete({ reason: 'answer', answer: 'Fatto.', durationMs: 1 } as any)

    await $.prompt.submit({ text: '\n<task-notification><task-id>def</task-id></task-notification>' } as any)
    await $.turn.start({ turnId: 't3' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ancora.', durationMs: 1 } as any)

    const text = ledger()

    expect(text).toContain('- Add the next file')
    expect(text).toContain('`src/next.py`')
    expect(text).not.toContain('Fix the parser')
    expect(text).not.toContain('task-notification')
    expect(text).not.toContain('task-id')
    expect(text).not.toMatch(/^- \s*$/m)
    expect(text.split('Add the next file').length - 1).toBe(1)
  })

  test('crea il .gitignore con LEDGER.md', async ($, on) => {
    const { disk } = await setup($, on, {
      git: true,
      replies: [
        '{"why": "First.", "files": {"src/app.py": "First."}}',
        '{"why": "Second.", "files": {"src/app.py": "Second."}}',
      ],
    })

    await $.prompt.submit({ text: 'Primo' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)
    await $.prompt.submit({ text: 'Secondo' } as any)
    await $.turn.start({ turnId: 't2' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)

    expect(disk['/work/.gitignore']).toBe('LEDGER.md\n')
  })

  test('non tocca il .gitignore se LEDGER.md o /LEDGER.md c’è già', async ($, on) => {
    const { disk } = await setup($, on, {
      git: true,
      disk: { '/work/.gitignore': 'dist\nLEDGER.md\n' },
      replies: [
        '{"why": "A.", "files": {"src/app.py": "A."}}',
        '{"why": "B.", "files": {"src/app.py": "B."}}',
        '{"why": "C.", "files": {"src/app.py": "C."}}',
      ],
    })

    await $.prompt.submit({ text: 'Uno' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)
    expect(disk['/work/.gitignore']).toBe('dist\nLEDGER.md\n')

    disk['/work/.gitignore'] = 'foo\n/LEDGER.md\n'
    await $.prompt.submit({ text: 'Due' } as any)
    await $.turn.start({ turnId: 't2' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)
    expect(disk['/work/.gitignore']).toBe('foo\n/LEDGER.md\n')

    disk['/work/.gitignore'] = 'LEDGER.md'
    await $.prompt.submit({ text: 'Tre' } as any)
    await $.turn.start({ turnId: 't3' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)
    expect(disk['/work/.gitignore']).toBe('LEDGER.md')
  })

  test('aggiunge LEDGER.md in fondo se manca l’a capo finale', async ($, on) => {
    const { disk } = await setup($, on, {
      git: true,
      disk: { '/work/.gitignore': 'keep me' },
      replies: [
        '{"why": "A.", "files": {"src/app.py": "A."}}',
        '{"why": "B.", "files": {"src/app.py": "B."}}',
      ],
    })

    await $.prompt.submit({ text: 'Uno' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)
    expect(disk['/work/.gitignore']).toBe('keep me\nLEDGER.md\n')

    disk['/work/.gitignore'] = 'keep\r\nme'
    await $.prompt.submit({ text: 'Due' } as any)
    await $.turn.start({ turnId: 't2' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)
    expect(disk['/work/.gitignore']).toBe('keep\r\nme\r\nLEDGER.md\r\n')
  })

  test('senza .git non crea il .gitignore', async ($, on) => {
    const { disk, ledger } = await setup($, on, {
      replies: ['{"why": "A.", "files": {"src/app.py": "A."}}'],
    })

    await $.prompt.submit({ text: 'Uno' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)

    expect(ledger()).toContain('`src/app.py`')
    expect(disk['/work/.gitignore']).toBeUndefined()
  })

  test('un .gitignore non scrivibile non blocca il turno', async ($, on) => {
    const { ledger, toasts } = await setup($, on, {
      git: true,
      blockGitignore: true,
      replies: ['{"why": "A.", "files": {"src/app.py": "A."}}'],
    })

    await $.prompt.submit({ text: 'Uno' } as any)
    await $.turn.start({ turnId: 't1' } as any)
    await edit($, '/work/src/app.py')
    await $.turn.complete({ reason: 'answer', answer: 'Ok.', durationMs: 1 } as any)

    expect(ledger()).toContain('`src/app.py`')
    expect(toasts).toEqual([{ text: 'LEDGER.md updated (1 file)', timeoutMs: 10000 }])
  })
})
