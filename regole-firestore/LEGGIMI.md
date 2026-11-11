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
| `regole-corrette-30ott26.rules` | Lo stesso testo con le **due correzioni**. È stato il testo pubblicato in console **dal 30/10/2026 fino alla pubblicazione delle regole dei residui** (verificata il 07/11/2026). ⚠️ **Non è più il punto di ripristino**: non contiene il blocco `residui`, quindi reincollandolo oggi si romperebbe «📤 Pubblica i residui» e il riquadro dei residui in Fogli ore. Resta come storico. |
| `regole-residui-03nov26.rules` | ✅ **È IL TESTO PUBBLICATO IN CONSOLE**, verificato il **07/11/2026**: Christian ha incollato qui il testo in vigore e risulta **identico a questo file carattere per carattere** (96 righe, 5.028 byte). È quindi il **punto di ripristino** da usare oggi. È il file `regole-corrette-30ott26.rules` **più** il blocco `residui`, senza il quale «📤 Pubblica i residui» di Dipendenti falliva con un errore di permessi. |
| `test-regole.mjs` | **60** controlli automatici: 39 di prima (12 tentativi di abuso respinti + 27 operazioni normali), **12 sui residui** e **9 sul ripristino del backup JSON** (`R1`…`R9`, aggiunti con la **rev 16** dell'11/11/2026). |

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


## I residui del tetto annuo (03/11/2026)

L'app **Dipendenti** calcola quante ore restano a ciascuno del proprio **tetto annuo** e, con un
pulsante (mai da sola), scrive **un documento per operatore** nella collection **`residui`**:

- **doc-id** = l'`uid` dell'operatore in Fogli ore;
- dentro **solo numeri**: `tetto`, `usate`, `restano`, `periodo`, `anno`, `aggiornato`;
- **nessun nome, nessun dato personale**: il documento è già il proprio.

È l'**unica scrittura** che Dipendenti fa fuori dal proprio documento. `users` e `timesheets`
restano in sola lettura.

**Chi può fare cosa** (blocco `residui` del file nuovo):

| | legge | scrive |
|---|---|---|
| l'operatore | **solo il proprio** | no |
| l'amministrazione (`spazioireos@gmail.com`) | tutti | sì |
| un `viewer` | solo gli operatori che gli sono stati assegnati | no |
| un `editor` | no | no |

**Come si pubblica** (lo fa Christian, Claude non ha accesso alla console):

1. console Firebase → progetto `spazio-ireos-foglio-ore` → Firestore Database → **Regole**;
2. incollare **tutto** il contenuto di `regole-residui-03nov26.rules` al posto di quello attuale;
3. **Pubblica**.

**Stato delle prove all'11/11/2026** (emulatore ufficiale, `npm run prova-residui`):

- con `regole-residui-03nov26.rules`: **60 su 60** coerenti con l'atteso.

🔐 **Che cosa dicono i nove controlli nuovi (`R1`…`R9`), e perché contano.** La **rev 16** di
Fogli ore ha aggiunto il **ripristino del backup JSON**, che scrive come **admin** nelle sei
collection del backup. L'emulatore ha misurato che cosa le regole in vigore gli lasciano fare
davvero:

| | esito |
|---|---|
| riscrivere un documento `users` che **esiste** | **permesso** (`update`) |
| 🔴 **ricreare un documento `users` CANCELLATO** | **NEGATO**: il `create` su `users` è solo per sé stessi, nemmeno l'admin può farlo |
| riscrivere `timesheets`, `lightsheets`, `svccaps`, `caps`, `locks` | **permesso** |
| un `worker` o un `viewer` che prova a usare il ripristino sui dati di altri | **negato** |

⚠️ **Conseguenza dichiarata, e scritta anche nella conferma a video**: il ripristino recupera
tutto, **tranne** gli utenti il cui documento è stato cancellato. Quella persona deve
**registrarsi di nuovo**, e poi il ripristino le rimette ruolo e dati. **Le regole non sono state
toccate** per aggirare la cosa: si è scelto di dirla.

**Lo storico delle prove precedenti:**
- al 03/11/2026, con `regole-residui-03nov26.rules`: **51 su 51**;
- con `regole-corrette-30ott26.rules` (quelle **oggi in vigore**): 47 su 51 — falliscono i 4
  controlli che richiedono di **poter** leggere o scrivere i residui (A1, A7, A8, A9), perché
  quella collection lì non esiste ancora. I 12 controlli che devono essere **negati** passano
  già adesso. È la prova che il blocco nuovo serve e che non rompe niente di quello che c'era.
