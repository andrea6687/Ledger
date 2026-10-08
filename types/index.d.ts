export type ChangedFile = {
  /** Percorso del file, relativo alla cartella di lavoro quando possibile. */
  file: string
  /** true se il file non esisteva prima di questo turno. */
  created: boolean
  /** Numero di Edit/Write fatti sul file in questo turno. */
  edits: number
  /** Righe aggiunte e rimosse (conteggio approssimato). */
  added: number
  removed: number
  /** Frammenti troncati dei cambiamenti (max 3), usati per descriverli. */
  snippets: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'ledger': {
      pending: ChangedFile[]
      /** La richiesta dell'utente che ha dato origine ai cambiamenti del turno. */
      request: string
    }
  }
}
