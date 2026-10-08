# Ledger

Mod per Claude Code (terminale e app desktop). A fine di ogni turno in cui Claude crea o modifica file con Edit o Write, appende un blocco a `CHANGELOG.md` nella cartella di lavoro della sessione:

```
## 2026-10-08 09:41

**Richiesta:** Correggi il calcolo dell'IVA in app.py

**Perché:** L'aliquota IVA usata era sbagliata.

- `src/app.py`: modificato (2 interventi, +14 −3)
  - Cosa è cambiato: Aliquota portata da 0.2 a 0.22.
- `README.md`: creato (1 intervento, +20 −0)
  - Cosa è cambiato: Aggiunta la sezione di installazione.
```

- **Richiesta**: il tuo prompt, riportato com'è (accorciato a 200 caratteri).
- **Perché** e **Cosa è cambiato**: frasi brevi in italiano scritte da un modello (Haiku) a partire dalla richiesta, dalla risposta finale di Claude e da frammenti troncati delle modifiche.

## Chiamata al modello

Per scrivere il perché e il cosa, il mod fa **una chiamata a Haiku per turno con modifiche**, con le credenziali della sessione (consumo di token minimo, ma non zero). Alla chiamata vanno la tua richiesta, la risposta finale di Claude e fino a 3 frammenti di circa 240 caratteri per file. Se il progetto contiene dati sensibili, imposta `USE_MODEL = false` all'inizio di `hooks/register.ts`: il changelog riporterà solo richiesta, file e conteggi di righe, senza inviare nulla al modello.

Se la chiamata fallisce o il modello non risponde in JSON valido, il blocco viene scritto lo stesso, senza le righe "Perché" e "Cosa è cambiato".

## Note

- Se `CHANGELOG.md` non esiste viene creato con un'intestazione, e il file non registra le proprie modifiche.
- Conta solo gli Edit/Write andati a buon fine; le modifiche fatte da comandi Bash (`sed`, `mv`, ...) non compaiono.
- I conteggi di righe sono approssimati e l'orario è quello locale della macchina.
- Le frasi del modello sono un riassunto e possono essere imprecise: il file è un'aiuto alla documentazione, non una fonte di verità.

## Installazione

### A) Da GitHub (consigliata)

Da un terminale Claude Code:

```
/plugin install ledger --marketplace andrea6687/ledger
```

Rispondi `y` per aggiungere il marketplace e scegli lo scope **user**. Da quel momento il mod funziona in ogni sessione, nel terminale e nella tab Code di Claude Desktop.

### B) Da cartella locale

1. Copia la cartella in `~/.claude/mods/ledger`.
2. In `~/.claude/settings.json` aggiungi:

```json
{
  "env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/ledger" }
}
```

3. Riavvia Claude Code o Claude Desktop (chiudilo del tutto, poi riaprilo) e apri una nuova sessione.

Per una prova veloce solo da terminale, senza installare nulla:

```
claude --plugin-dir ./ledger
```

### Verifica

Fai fare a Claude una modifica a un file: a fine turno trovi un nuovo blocco in `CHANGELOG.md` nella cartella del progetto.

## Licenza

MIT, vedi `LICENSE`.
