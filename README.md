# Ledger

🇮🇹 [Versione italiana](README.it.md)

**A daily section in `LEDGER.md` for the files Claude creates or edits.**

A Claude Code mod, for the terminal and the desktop app. At the end of every turn in which Claude creates or modifies files with Edit or Write, it updates that local day's section in `LEDGER.md`, in the session's working directory:

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

- **Requests**: the day's prompts, in a short list, without duplicates. Each one is cut at 200 characters.
- **Why** and **What changed**: short English sentences written by a model (Haiku) from the request, Claude's final reply, and truncated snippets of the changes.

## Quick install

### From GitHub (recommended)

From a Claude Code terminal:

```
/plugin install ledger --marketplace andrea6687/ledger
```

Answer `y` to add the marketplace and choose the **user** scope. From then on the mod works in every session, in the terminal and in the Code tab of Claude Desktop.

### From a local folder

1. Copy this folder to `~/.claude/mods/ledger`.
2. In `~/.claude/settings.json` add:

```json
{
  "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/ledger" }
}
```

3. Restart Claude Code or Claude Desktop (quit it completely, then open it again) and open a new session.

For a quick terminal-only try, without installing anything, run this from `~/.claude/mods` (the parent of the copied folder):

```
claude --plugin-dir ./ledger
```

The folder you pass is this plugin. It contains [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) and [`hooks/hooks.json`](hooks/hooks.json).

### Verification

Have Claude modify a file. At the end of the turn, today's section in `LEDGER.md` in the project folder is updated, and a toast says `LEDGER.md updated (1 file)` (or `files`). The toast stays for 10 seconds.

## Model call

To write the why and the what, the mod makes **one Haiku call per turn with changes**, using the session credentials. Token use is minimal, but not zero. The call includes your request (cut at 800 characters), Claude's final reply (cut at 1,500 characters), and up to 3 snippets of about 240 characters per file, for at most 12 files.

If the project contains sensitive data, set `USE_MODEL = false` at the top of [`hooks/register.ts`](hooks/register.ts). The ledger then reports only the request, the files, and the line counts, and sends nothing to the model.

If the call fails, or the model does not reply with valid JSON, today's section is updated anyway, without the "Why" and "What changed" lines.

## Notes

- One section per local day (`## YYYY-MM-DD`). A later turn on the same day updates that section: the sentence for a file already listed is replaced with the latest, a new file is added at the end, and the day's requests stay a short list without duplicates. Earlier days are left unchanged.
- If more than 12 files change in one turn, the section still lists all of them. The model only sees the first 12, so a later file may have no "What changed" line.
- Files outside the working directory, files that no longer exist on disk, and task notifications are ignored. A file that disappears is also removed from today's section.
- If `LEDGER.md` does not exist it is created with the header `# Ledger` and the line `Generated automatically by the ledger mod: one section for each day in which Claude modified files.` The file does not record its own changes.
- In a git repository, Ledger adds a `LEDGER.md` line to the root `.gitignore`, and creates that file when it is missing. A line that is already `LEDGER.md` or `/LEDGER.md` is left as it is. If `.gitignore` cannot be written, the turn still finishes and `LEDGER.md` is still updated. If `LEDGER.md` is already tracked, remove it from the index by hand with `git rm --cached LEDGER.md`.
- `CHANGELOG.md` files that earlier versions wrote in a project's root are not removed. Delete them by hand.
- Only successful Edit and Write calls are counted. Changes made by Bash commands (`sed`, `mv`, ...) do not appear.
- Line counts are approximate, and the date is the machine's local date.
- The model's sentences are a summary and can be inaccurate. The file is a documentation aid, not a source of truth.

## Development

The mod is the TypeScript in `hooks/`. The version in [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) is 0.2.1.

```
hooks/register.ts                 records Edit and Write, and writes today's section
hooks/hooks.json                  loads the mod
.claude-plugin/plugin.json        name, version, description
.claude-plugin/marketplace.json   marketplace entry
types/index.d.ts                  shape of a changed file
tests/ledger.test.ts              automated tests
```

The tests use `claude-code/testing`. This repository has no `package.json` and no test script of its own. To contribute, read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Andrea Sportello

---

If Ledger saved you from reconstructing a day's changes, a ⭐ on the repository helps other people find it. Bugs and ideas are welcome in the [issues](https://github.com/andrea6687/Ledger/issues).
