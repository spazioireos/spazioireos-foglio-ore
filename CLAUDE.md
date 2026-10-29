# Istruzioni per Claude — app "Fogli ore" (la usano gli ESTERNI)

Qui i **collaboratori esterni compilano le proprie ore**. ⚠️ **È un'app multi-utente in uso da
altre persone: massima prudenza.** Non è nel menù della pagina integrata come sezione di lavoro,
c'è solo una scorciatoia per aprirla.

- **Unico file**: `index.html` (~412 KB), JavaScript con **template string** (NON JSX/Babel).
- **Dati**: Firebase progetto `spazio-ireos-foglio-ore`, **condiviso con l'app Dipendenti**
  (collection diverse, ma stesso login e stesse regole di sicurezza). Registrazione **aperta**,
  con **ruoli**: admin / worker / editor / viewer / disabled. Admin: `spazioireos@gmail.com`.
- **Collection**: `users`, `timesheets`, `lightsheets`, `svccaps`, `caps`, `locks`.
  - `users`: doc-id = uid; campi `cognome`, `nome`, `name` ("COGNOME NOME"), `role`.
  - `timesheets`: doc-id `<uid>__<anno>_<mese>_<serviceIdx>` (mese 1-12, serviceIdx 0-19 →
    **più documenti per mese, da sommare**). Campi `workerUid`, `year`, `month`, `days`.
  - `days` = mappa giorno → entry con fasce `t1f/t1t`…`t4f/t4t`, `iF/iT`, `iF2/iT2`, più
    `absence`, `perm`, `spole`, `pausa`, `nonImp` (questi quattro NON sono ore lavorate).
- ⚠️ **Due trappole già verificate**:
  1. **Le ore non sono memorizzate**: si calcolano dagli orari "HH:MM". Nel database ci sono
     **formati storici** (`900` = 09:00, `130` = 01:30, `14.30`, `14h30`, `9`): un parser
     che accetta solo `HH:MM` conta MENO ore del vero.
  2. **Un'assenza è scritta su TUTTI i servizi** dello stesso giorno: va contata **una volta
     sola** per giorno, altrimenti risulta moltiplicata.
- **Codici assenza**: `FERIE`, `MALATTIA`, `MALATTIA FIGLIO`, `PERM. ELETTORALE`,
  `PERM. LUTTO`, `ALTRO AUTORIZ.` → quel giorno vale **0 ore**.
- **Operatori "light"** (`lightsheets`): NON stanno in `timesheets`, non hanno dettaglio
  giornaliero né assenze. Per loro il confronto con altre app non è possibile.
- **Numero di revisione**: targhetta `.revtag` fissa in **basso a destra** (l'alto a destra è
  occupato dai pulsanti Esci/Home), `pointer-events:none` così non blocca nulla.
  **Attuale: rev 1 · 29ott26.**
- **Verifica prima del commit**: estrarre il blocco `<script>` inline e passarlo a
  `node --check`. Attenzione a non rompere apici/backtick nelle template string.
- **Non toccare senza richiesta esplicita**: ruoli e permessi, autenticazione, il blocco mensile
  (`locks`), i massimali (`svccaps`/`caps`), gli operatori light, nulla che riguardi i dati
  degli esterni.

## Regole di lavoro (valgono sempre)

1. **Le modifiche a questa app le fa Claude**, lavorando direttamente su questo repository.
   Decisione di Christian del 29/10/2026. NON usare altre chat per generare un `index.html`
   da caricare a mano.
2. **MAI caricare con "Add files via upload" un file preso dal computer**: sostituisce il file
   e cancella le aggiunte fatte qui. Se proprio serve, scaricare PRIMA la versione aggiornata
   da GitHub ("Download raw file"), modificare quella, poi ricaricarla.
3. **Lavorare sempre sul ramo `claude/integrated-app-feasibility-8d1wg0`**, mai direttamente su
   `main`. Si porta su `main` SOLO quando Christian lo chiede esplicitamente ("porta su main").
4. **Prima di committare: verificare che il codice compili** (vedi sotto, cambia per app).
   Non fidarsi dei test: il 28/10 un errore sul percorso dei dati era passato ai test ed è stato
   trovato solo rileggendo il codice.
5. **A ogni revisione: incrementare il numero di revisione mostrato nell'app** (vedi sotto).
   Serve a Christian per capire se sta guardando la versione aggiornata e non una copia in cache.
6. **Claude non viene avvisato dei caricamenti di Christian**: all'inizio di ogni sessione,
   verificare se il ramo è rimasto indietro rispetto a `main` e, se sì, riallinearlo PRIMA di
   lavorare. Non unire mai un ramo che non contiene tutto `main`: cancellerebbe lavoro di Christian.
7. **La pagina integrata** (`integrata/index.html` nel repo `rendicontazione-usoint`) apre i LINK
   LIVE delle app: quando si modifica questa app NON va aggiornata, si aggiorna da sé.
8. Rispondere in italiano, senza narrare i passaggi; chiedere il nulla osta (Nu*) prima di costruire.

