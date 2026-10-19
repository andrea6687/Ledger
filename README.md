[Italiano](README.it.md)

# Ledger

A Claude Code mod (terminal and desktop app). At the end of every turn in which Claude creates or modifies files with Edit or Write, it updates that local day's section in `LEDGER.md`, in the session's working directory:

```
## 2026-10-08

**Requests:**
- Correggi il calcolo dell'IVA in app.py

**Why:** The VAT rate in use was wrong.

- `src/app.py`: modified (2 edits, +14 −3)
  - What changed: Rate changed from 0.2 to 0.22.
- `README.md`: created (1 edit, +20 −0)
  - What changed: Added the installation section.
```

- **Requests**: the day's prompts, in a short list, without duplicates (each truncated to 200 characters).
- **Why** and **What changed**: short English sentences written by a model (Haiku) from the request, Claude's final reply, and truncated snippets of the changes.

## Model call

To write the why and the what, the mod makes **one Haiku call per turn with changes**, using the session credentials (token use is minimal, but not zero). The call includes your request, Claude's final reply, and up to 3 snippets of about 240 characters per file. If the project contains sensitive data, set `USE_MODEL = false` at the top of `hooks/register.ts`: the ledger will report only the request, the files, and the line counts, without sending anything to the model.

If the call fails or the model does not reply with valid JSON, today's section is updated anyway, without the "Why" and "What changed" lines.

## Notes

- One section per local day (`## YYYY-MM-DD`). A later turn on the same day updates that section: the sentence for a file already listed is replaced with the latest, a new file is added at the end, and the day's requests stay a short list without duplicates. Earlier days are left unchanged.
- Files outside the working directory, files that no longer exist on disk, and task notifications are ignored.
- If `LEDGER.md` does not exist it is created with a header, and the file does not record its own changes.
- In a git repository, Ledger adds a `LEDGER.md` line to the root `.gitignore`, creating that file when it is missing. If `LEDGER.md` is already tracked, remove it from the index by hand with `git rm --cached LEDGER.md`.
- `CHANGELOG.md` files that earlier versions wrote in a project's root are not removed; delete them by hand.
- Only successful Edit/Write calls are counted; changes made by Bash commands (`sed`, `mv`, ...) do not appear.
- Line counts are approximate and the date is the machine's local date.
- The model's sentences are a summary and can be inaccurate: the file is a documentation aid, not a source of truth.

## Installation

### A) From GitHub (recommended)

From a Claude Code terminal:

```
/plugin install ledger --marketplace andrea6687/ledger
```

Answer `y` to add the marketplace and choose the **user** scope. From then on the mod works in every session, in the terminal and in the Code tab of Claude Desktop.

### B) From a local folder

1. Copy the folder to `~/.claude/mods/ledger`.
2. In `~/.claude/settings.json` add:

```json
{
  "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/ledger" }
}
```

3. Restart Claude Code or Claude Desktop (quit it completely, then open it again) and open a new session.

For a quick terminal-only try, without installing anything:

```
claude --plugin-dir ./ledger
```

### Verification

Have Claude modify a file: at the end of the turn, today's section in `LEDGER.md` in the project folder is updated.

## License

MIT, see `LICENSE`.
