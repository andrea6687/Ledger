import { describe, expect, test } from 'claude-code/testing'

const usage = { input_tokens: 1, output_tokens: 1 }

async function runTurn($: any, on: any, modelText: string | null) {
  const written: Record<string, string> = {}

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
  await $.turn.start({ turnId: 't1' } as any)
  await $.tool.call({
    tool: 'Edit',
    file_path: '/work/src/app.py',
    old_string: 'iva = x * 0.2',
    new_string: 'iva = x * 0.22',
  } as any)
  await $.turn.complete({ reason: 'answer', answer: 'Ho portato l\'aliquota al 22%.', durationMs: 1 } as any)

  return written['/work/CHANGELOG.md'] ?? ''
}

describe('ledger', () => {
  test('scrive richiesta, perché e cosa è cambiato', async ($, on) => {
    const text = await runTurn(
      $,
      on,
      '{"perche": "L\'aliquota IVA era sbagliata.", "file": {"src/app.py": "Aliquota portata da 0.2 a 0.22."}}',
    )

    expect(text).toContain('src/app.py')
    expect(text).toContain('modificato')
    expect(text).toContain('**Richiesta:** Correggi il calcolo dell\'IVA')
    expect(text).toContain('**Perché:** L\'aliquota IVA era sbagliata.')
    expect(text).toContain('Cosa è cambiato: Aliquota portata da 0.2 a 0.22.')
  })

  test('senza risposta del modello scrive comunque file e richiesta', async ($, on) => {
    const text = await runTurn($, on, null)

    expect(text).toContain('src/app.py')
    expect(text).toContain('**Richiesta:** Correggi il calcolo dell\'IVA')
    expect(text).not.toContain('Cosa è cambiato')
  })
})
