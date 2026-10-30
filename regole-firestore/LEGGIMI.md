# Regole di sicurezza Firestore — progetto `spazio-ireos-foglio-ore`

Qui stanno le **regole di accesso al database** del progetto Firebase condiviso dalle app
**Fogli ore** (la usano i collaboratori esterni) e **Report Ore mensile / Dipendenti**, insieme
alla **prova automatica** che le verifica.

Le regole NON stanno nel codice dell'app: vivono nella console Firebase
(`spazio-ireos-foglio-ore` → Firestore Database → Regole). Questa cartella ne tiene una copia
versionata, perché la console non è un archivio e perché una regola sbagliata è il punto in cui
si perdono o si espongono i dati di tutti.

## File

| File | Che cos'è |
|---|---|
| `regole-pubblicate-30ott26.rules` | Il testo in vigore **fino al** 30/10/2026, prima della correzione. Resta come storico. ⚠️ Contiene le due falle descritte sotto: **non reincollarlo in console**. |
| `regole-corrette-30ott26.rules` | Lo stesso testo con le **due correzioni**. **È il testo pubblicato in console il 30/10/2026** (verificato leggendo la linguetta Regole della console) ed è quindi il **punto di ripristino** da usare se una modifica futura rompe qualcosa. |
| `test-regole.mjs` | 39 controlli automatici: 12 tentativi di abuso che devono essere respinti, 27 operazioni normali che devono continuare a funzionare. |

## Le due falle trovate — e chiuse — il 30/10/2026

> **Stato: RISOLTE.** Il testo corretto è stato pubblicato in console da Christian il
> 30/10/2026; la verifica è stata fatta rileggendo le regole in vigore nella console
> (righe `allow create` del blocco `users` e `allow write` del blocco `timesheets`).

1. **Scrittura (e quindi lettura) sui fogli ore di chiunque.** Nel blocco `timesheets` la riga
   `allow write: if request.resource.data.workerUid == request.auth.uid;` non vincolava il
   **nome del documento**: un operatore poteva scrivere nel foglio ore di un collega. Due
   conseguenze provate: sovrascrivendolo ne cancellava le ore; scrivendoci in modalità `merge`
   solo il proprio `workerUid` ne otteneva poi la **lettura integrale**.
   Corretta aggiungendo `&& docId.matches(request.auth.uid + "__.*")`, che riporta la regola a
   "solo i propri documenti" — cioè a quanto la prima regola del blocco già consente, perciò non
   toglie nulla al funzionamento normale.
2. **Auto-promozione ad amministratore.** Nel blocco `users` la riga
   `allow read, create: if request.auth.uid == userId;` permetteva a chiunque si registrasse di
   creare il proprio documento utente **con il ruolo che voleva**, compreso `admin` — e da lì
   leggere e scrivere i fogli ore di tutti. La registrazione è aperta e la configurazione
   Firebase è pubblica dentro `index.html`, quindi era sfruttabile senza conoscere password.
   Corretta separando `read` da `create` e ammettendo in creazione **solo** il ruolo `worker`
   (o `admin` per la sola mail `spazioireos@gmail.com`): è esattamente ciò che l'app scrive già
   da sé alla registrazione.

## Falle note NON chiuse (scelta di Christian, 30/10/2026)

- **Il blocco del mese (`locks`) non è imposto dal database**, solo dall'app: chi scavalcasse
  l'interfaccia potrebbe modificare un mese chiuso.
- **Il ruolo `disabled` non è imposto dal database**, solo dall'app.
- **`lightsheets`**: la condizione `resource == null` permette a qualunque utente autenticato di
  *creare* un documento light con un `editorUid` qualsiasi (non di leggere o modificare quelli
  altrui). Toccarla rischia di rompere la lettura dei documenti non ancora esistenti.

## Come rilanciare la prova

Serve Node e Java (l'emulatore Firestore è un programma Java). Dentro questa cartella:

```
npm install
npm run prova-corrette      # atteso: 39 coerenti, 0 NON coerenti
npm run prova-pubblicate    # atteso: 35 coerenti, 4 NON coerenti (le falle del 30/10/2026)
```

"FALLITO" nell'elenco significa *esito diverso da quello atteso*: nelle righe `A...` vuol dire
che un abuso **è riuscito**; nelle righe `N...` che un'operazione legittima **è stata bloccata**.

## Esito registrato il 30/10/2026 (emulatore, dati finti)

- `regole-pubblicate-30ott26.rules` → **35/39**: i 4 attacchi A1-A4 riescono.
- `regole-corrette-30ott26.rules` → **39/39**: i 12 abusi respinti, le 27 operazioni normali
  tutte funzionanti (compresa la lettura di `users` e `timesheets` da parte dell'admin, che
  serve all'app Dipendenti per l'avviso di confronto con i Fogli ore).

## Limiti della verifica

Il test prova **le regole**, non l'app: gira sull'emulatore ufficiale Firestore con dati e uid
finti. Non fa girare `index.html` contro l'emulatore. Il comportamento delle app con le nuove
regole va confermato con un giro a mano (admin che apre un foglio ore; un operatore che compila
il proprio).

## Quando si modificano le regole

Aggiungere i nuovi controlli a `test-regole.mjs` **senza togliere quelli esistenti** (punto 10.8
di `CLAUDE.md`), rilanciare entrambe le prove, salvare il nuovo testo qui con la data, e solo
dopo pubblicare in console.
