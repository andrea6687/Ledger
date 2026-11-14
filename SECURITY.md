# Security Policy

🇮🇹 Italiano più sotto.

## Reporting a vulnerability

Please **don't open a public issue** for security problems.

Use GitHub's private reporting instead: go to the [Security tab](https://github.com/andrea6687/Ledger/security) and choose **Report a vulnerability**. You'll get an answer as soon as possible, usually within a week.

Examples of what to report:

- a way for a path in an Edit or Write to make Ledger write `LEDGER.md` or `.gitignore` outside the session's working directory;
- a way for the text of a request, a reply or a file snippet to make Ledger write something other than today's section;
- the model call sending more than the documented pieces, or running while `USE_MODEL` is `false`.

With `USE_MODEL` left at `true`, one turn that changed files sends your request (cut at 800 characters), Claude's final reply (cut at 1,500 characters), and up to 3 snippets of about 240 characters per file, for at most 12 files. The call uses the session credentials. See [the model call](README.md#model-call).

## Supported versions

Only the latest version on the `main` branch is supported. That version is the `version` field in [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) (0.2.1 at the moment).

## What Ledger writes

Ledger writes `LEDGER.md` in the session's working directory. In a git repository it may add a `LEDGER.md` line to the root `.gitignore`, or create that file when it is missing. It does not remove a `CHANGELOG.md` left by older versions.

You can read [`hooks/register.ts`](hooks/register.ts) before installing. To send nothing to the model, set `USE_MODEL = false` at the top of that file.

---

## Italiano

Per i problemi di sicurezza **non aprire una issue pubblica**: usa la [scheda Security](https://github.com/andrea6687/Ledger/security) → **Report a vulnerability**, che è privata.

È supportata solo l'ultima versione su `main` (il campo `version` in `.claude-plugin/plugin.json`, ora 0.2.1). Con `USE_MODEL` a `true` un turno con modifiche invia al modello della sessione la richiesta (800 caratteri), la risposta finale (1.500) e fino a 3 frammenti di circa 240 caratteri per file, per al massimo 12 file. Con `USE_MODEL = false` non parte nessuna chiamata. Ledger scrive `LEDGER.md` nella cartella di lavoro e, in un repository git, può aggiungere una riga `LEDGER.md` al `.gitignore`. Il codice è in `hooks/register.ts`: puoi leggerlo prima di installarlo.
