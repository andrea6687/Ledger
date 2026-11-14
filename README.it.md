# Ledger

🇬🇧 [English version](README.md)

**Una sezione al giorno in `LEDGER.md` per i file che Claude crea o modifica.**

Mod per Claude Code, nel terminale e nell'app desktop. A fine di ogni turno in cui Claude crea o modifica file con Edit o Write, aggiorna la sezione di quel giorno locale in `LEDGER.md`, nella cartella di lavoro della sessione:

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

- **Requests**: i prompt del giorno, in una lista breve, senza duplicati. Ciascuno è accorciato a 200 caratteri.
- **Why** e **What changed**: frasi brevi in inglese scritte da un modello (Haiku) a partire dalla richiesta, dalla risposta finale di Claude e da frammenti troncati delle modifiche.

## Installazione rapida

### Da GitHub (consigliata)

Da un terminale Claude Code:

```
/plugin install ledger --marketplace andrea6687/ledger
```

Rispondi `y` per aggiungere il marketplace e scegli lo scope **user**. Da quel momento il mod funziona in ogni sessione, nel terminale e nella tab Code di Claude Desktop.

### Da cartella locale

1. Copia questa cartella in `~/.claude/mods/ledger`.
2. In `~/.claude/settings.json` aggiungi:

```json
{
  "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/ledger" }
}
```

3. Riavvia Claude Code o Claude Desktop (chiudilo del tutto, poi riaprilo) e apri una nuova sessione.

Per una prova veloce solo da terminale, senza installare nulla, lancia il comando da `~/.claude/mods` (la cartella che contiene la copia):

```
claude --plugin-dir ./ledger
```

La cartella che indichi è questo plugin. Contiene [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) e [`hooks/hooks.json`](hooks/hooks.json).

### Verifica

Fai fare a Claude una modifica a un file. A fine turno la sezione di oggi in `LEDGER.md` nella cartella del progetto è aggiornata, e compare un avviso `LEDGER.md updated (1 file)` (oppure `files`). L'avviso resta 10 secondi.

## Chiamata al modello

Per scrivere il perché e il cosa, il mod fa **una chiamata a Haiku per turno con modifiche**, con le credenziali della sessione. Il consumo di token è minimo, ma non è zero. Alla chiamata vanno la tua richiesta (accorciata a 800 caratteri), la risposta finale di Claude (accorciata a 1.500 caratteri) e fino a 3 frammenti di circa 240 caratteri per file, per al massimo 12 file.

Se il progetto contiene dati sensibili, imposta `USE_MODEL = false` all'inizio di [`hooks/register.ts`](hooks/register.ts). Il ledger riporterà solo la richiesta, i file e i conteggi di righe, e non invia nulla al modello.

Se la chiamata fallisce o il modello non risponde in JSON valido, la sezione di oggi viene aggiornata lo stesso, senza le righe "Why" e "What changed".

## Note

- Una sezione per giorno locale (`## AAAA-MM-GG`). Un turno successivo nello stesso giorno aggiorna quella sezione: la frase di un file già elencato è sostituita con l'ultima, un file nuovo si aggiunge in fondo, e le richieste del giorno restano una lista breve senza duplicati. I giorni precedenti restano intatti.
- Se in un turno cambiano più di 12 file, la sezione li elenca tutti. Il modello vede solo i primi 12, quindi un file successivo può restare senza la riga "What changed".
- I file fuori dalla cartella di lavoro, i file che non esistono più su disco e le notifiche vengono ignorati. Un file che sparisce viene tolto anche dalla sezione di oggi.
- Se `LEDGER.md` non esiste viene creato con l'intestazione `# Ledger` e la riga `Generated automatically by the ledger mod: one section for each day in which Claude modified files.` Il file non registra le proprie modifiche.
- In un repository git, Ledger aggiunge una riga `LEDGER.md` al `.gitignore` nella radice, e lo crea se manca. Una riga che è già `LEDGER.md` o `/LEDGER.md` resta com'è. Se `.gitignore` non si può scrivere, il turno finisce comunque e `LEDGER.md` viene aggiornato. Se `LEDGER.md` è già tracciato, va tolto dall'indice a mano con `git rm --cached LEDGER.md`.
- I `CHANGELOG.md` generati dalle versioni precedenti nella radice dei progetti non vengono rimossi: vanno cancellati a mano.
- Conta solo gli Edit e i Write andati a buon fine. Le modifiche fatte da comandi Bash (`sed`, `mv`, ...) non compaiono.
- I conteggi di righe sono approssimati e la data è quella locale della macchina.
- Le frasi del modello sono un riassunto e possono essere imprecise. Il file è un aiuto alla documentazione, non una fonte di verità.

## Sviluppo

Il mod è il TypeScript in `hooks/`. La versione in [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) è 0.2.1.

```
hooks/register.ts                 registra Edit e Write e scrive la sezione di oggi
hooks/hooks.json                  carica il mod
.claude-plugin/plugin.json        nome, versione, descrizione
.claude-plugin/marketplace.json   voce del marketplace
types/index.d.ts                  forma di un file modificato
tests/ledger.test.ts              test automatici
```

I test usano `claude-code/testing`. In questo repository non c'è un `package.json` né uno script di test. Per contribuire leggi [CONTRIBUTING.md](CONTRIBUTING.md).

## Licenza

[MIT](LICENSE) © Andrea Sportello

---

Se Ledger ti ha evitato di ricostruire le modifiche di un giorno, una ⭐ al repository aiuta altre persone a trovarlo. Problemi e idee sono benvenuti nelle [issue](https://github.com/andrea6687/Ledger/issues).
