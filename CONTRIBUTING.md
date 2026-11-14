# Contributing

🇮🇹 Italiano più sotto.

Thanks for helping! Bug reports are the most useful contribution: Ledger runs inside Claude Code, and every session is a little different.

## Reporting a bug

Open an [issue](https://github.com/andrea6687/Ledger/issues/new/choose) with the bug template and include:

- where it runs (Claude Code terminal, or the Code tab of Claude Desktop);
- how you installed it (marketplace `andrea6687/ledger`, the folder `~/.claude/mods/ledger`, or `claude --plugin-dir`);
- the Ledger version from [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json);
- whether `USE_MODEL` at the top of [`hooks/register.ts`](hooks/register.ts) is `true` or `false`;
- what you expected in `LEDGER.md` and what the file shows.

Before posting, remove private prompts, file contents and secrets.

## Suggesting an idea

Open an issue with the idea template and explain the problem you want to solve, not only the solution.

## Sending code

1. Open an issue first for anything bigger than a small fix, so we can agree on the approach.
2. The behavior lives in [`hooks/register.ts`](hooks/register.ts). The fields of a changed file are in [`types/index.d.ts`](types/index.d.ts). [`hooks/hooks.json`](hooks/hooks.json) loads the module.
3. Add or update a test in [`tests/ledger.test.ts`](tests/ledger.test.ts) for every behavior you change. The tests import `claude-code/testing`. This repository has no `package.json` and no test script: say in the pull request what you ran.
4. Text written into `LEDGER.md`, and the toast, stay in English. Requests stay in the language of the prompt.
5. Keep the model call as it is: one Haiku call per turn with changes, limited to the request, the final reply and the truncated snippets. `USE_MODEL = false` must still send nothing.
6. Update both READMEs ([`README.md`](README.md) and [`README.it.md`](README.it.md)) if the behavior changes.

## Scope

In scope: the daily `LEDGER.md` section for files Claude created or edited with Edit or Write.
Out of scope: recording shell commands, sending more of a project than the documented snippets, or treating `LEDGER.md` as a source of truth.

---

## Italiano

Grazie per l'aiuto! Le segnalazioni di problemi sono il contributo più utile: Ledger gira dentro Claude Code, e ogni sessione è un po' diversa.

- **Problema:** apri una [issue](https://github.com/andrea6687/Ledger/issues/new/choose) con il modello "bug" indicando dove gira (terminale o tab Code), come lo hai installato, la versione in `.claude-plugin/plugin.json`, se `USE_MODEL` è `true` o `false`, cosa ti aspettavi in `LEDGER.md` e cosa c'è scritto. Togli prompt, contenuti di file e segreti.
- **Idea:** apri una issue con il modello "idea" e spiega il problema da risolvere.
- **Codice:** per modifiche non piccole apri prima una issue. Il comportamento sta in `hooks/register.ts`. Aggiungi un test in `tests/ledger.test.ts` per ogni comportamento che cambi e scrivi nella pull request cosa hai eseguito. Il testo in `LEDGER.md` e l'avviso restano in inglese. `USE_MODEL = false` non deve inviare nulla. Aggiorna entrambi i README se cambia il comportamento.
- **Fuori tema:** registrare i comandi di shell, inviare più dati del progetto dei frammenti documentati, o trattare `LEDGER.md` come fonte di verità.
