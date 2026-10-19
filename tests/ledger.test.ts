import { describe, expect, test } from 'claude-code/testing'

const usage = { input_tokens: 1, output_tokens: 1 }

async function runTurn($: any, on: any, modelText: string | null) {
  const written: Record<string, string> = {}
  const toasts: { text?: string; timeoutMs?: number }[] = []

  on('ui.toast', (_$: any, e: { text?: string; timeoutMs?: number }) => {
    toasts.push({ text: e.text, timeoutMs: e.timeoutMs })
    return { value: undefined }
  })
  on('session.start', ($: any, e: any) => ({ cwd: e.cwd }))
  on('prompt.submit', ($: any, e: any) => ({ text: e.text }))
  on('turn.start', () => ({ turnId: 't1' }))
  on('tool.call', () => ({ result: 'ok' }))
  on('turn.complete', () => ({ text: '' }))
  on('session.cwd', () => ({ value: '/work' }))
  on('clock.now', () => ({ value: Date.UTC(2026, 9, 8, 9, 41) }))
  on('fs.exists', () => ({ value: false }))
  on('fs.write', (_$: any, e: any) => {
    written[e.path] = e.text
    return { value: undefined }
  })
  on('model.complete', () =>
    modelText === null
      ? { value: { isAnswered: false, reason: 'empty-reply', usage } }
      : { value: { isAnswered: true, text: modelText, usage } },
  )

  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' } as any)
  await $.prompt.submit({ text: 'Correggi il calcolo dell\'IVA in app.py' } as any)
  await $.prompt.submit({ text: '<task-notification>done</task-notification>' } as any)
  await $.turn.start({ turnId: 't1' } as any)
  await $.tool.call({
    tool: 'Edit',
    file_path: '/work/src/app.py',
    old_string: 'iva = x * 0.2',
    new_string: 'iva = x * 0.22',
  } as any)
  await $.tool.call({ tool: 'Write', file_path: '/tmp/scratch.py', content: 'x = 1' + String.fromCharCode(10) } as any)
  await $.turn.complete({ reason: 'answer', answer: 'Ho portato l\'aliquota al 22%.', durationMs: 1 } as any)

  return { changelog: written['/work/CHANGELOG.md'] ?? '', toasts }
}

describe('ledger', () => {
  test('scrive richiesta, perché e cosa è cambiato', async ($, on) => {
    const { changelog: text, toasts } = await runTurn(
      $,
      on,
      '{"why": "The VAT rate was wrong.", "files": {"src/app.py": "Rate changed from 0.2 to 0.22."}}',
    )

    expect(toasts).toEqual([{ text: 'CHANGELOG.md updated (1 file)', timeoutMs: 10000 }])
    expect(text).toContain('Generated automatically by the ledger mod')
    expect(text).toContain('`src/app.py`: modified (1 edit,')
    expect(text).toContain('**Request:** Correggi il calcolo dell\'IVA')
    expect(text).toContain('**Why:** The VAT rate was wrong.')
    expect(text).toContain('What changed: Rate changed from 0.2 to 0.22.')
    expect(text).not.toContain('task-notification')
    expect(text).not.toContain('scratch.py')
  })

  test('senza risposta del modello scrive comunque file e richiesta', async ($, on) => {
    const { changelog: text, toasts } = await runTurn($, on, null)

    expect(toasts).toEqual([{ text: 'CHANGELOG.md updated (1 file)', timeoutMs: 10000 }])
    expect(text).toContain('`src/app.py`: modified (1 edit,')
    expect(text).toContain('**Request:** Correggi il calcolo dell\'IVA')
    expect(text).not.toContain('What changed')
  })
})
