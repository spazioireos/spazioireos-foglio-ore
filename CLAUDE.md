# Istruzioni per Claude — app "Fogli ore" (la usano gli ESTERNI)

Qui i **collaboratori esterni compilano le proprie ore**. ⚠️ **È un'app multi-utente in uso da
altre persone: massima prudenza.** Non è nel menù della pagina integrata come sezione di lavoro,
c'è solo una scorciatoia per aprirla.

- **Unico file**: `index.html` (**443 KB**, misurato l'11/11/2026, rev 16), JavaScript con **template string** (NON JSX/Babel).
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
  **Attuale: rev 16 · 11nov26.**
- 💾 **IL BACKUP È DIVENTATO UNA COPIA COMPLETA, E ORA SI PUÒ RIMETTERE DENTRO** (rev 16,
  11/11/2026, tre risposte di Christian all'elenco del collaudo generale: punti **1** «aggiungi»,
  **2** «aggiungi» e **5** «SÌ»).
  - 🔴 **1 — il backup non era una copia completa.** La riga 3986 faceva
    `const backup={exportDate, users, timesheets, caps, locks}`: **mancavano `svccaps`** (i
    massimali per servizio, cioè il sistema **in uso dalla rev 6**) **e `lightsheets`** (tutti gli
    operatori light e le loro ore), e dentro c'era invece **`caps`**, il sistema vecchio e fermo
    dalla rev 6. Il PROMEMORIA a video chiama quel file «la tua copia di sicurezza indipendente da
    Firebase»: per **due collection su sei non lo era**. ⚠️ **PREESISTENTE**: riga identica nelle
    copie congelate rev 9 e rev 11.
    - Ora il backup porta **tutte e sei** le collection. ⚠️ **`caps` resta dentro**: è il sistema
      vecchio, ma i massimali già creati sono dati veri e non si buttano.
    - ⚠️ **`residui` NON c'è, di proposito**: lo scrive l'app **Dipendenti** con *📤 Pubblica i
      residui* e si rifà da sola; qui è di sola lettura. È scritto nel commento del codice.
    - ⚠️ Se la lettura di `svccaps` o di `lightsheets` **non riesce**, il backup **non viene
      prodotto** e l'app lo dice: un file incompleto che si chiama «copia di sicurezza» sarebbe
      peggio di nessun file.
  - 🆕 **2 — il RIPRISTINO, che non esisteva.** Il §10.1 chiede «Backup (esporta JSON) **e Import**
    presenti in ogni app fin dalla ver1»: qui c'erano **0** `input[type=file]`, **0** `FileReader`
    e nessuna funzione di ripristino (misurato), quindi il backup si poteva solo produrre e un
    recupero richiedeva la console Firebase. Ora, accanto ai due pulsanti che c'erano, c'è
    **«📂 Ripristina backup JSON»** (`importJSON` apre la casella del file nascosta
    `#fo-imp-file`, `importJSONFile` fa il lavoro).
    - 🔑 **PRIMA validare, POI — solo se valido — sovrascrivere** (§10.1). Funzioni nuove
      **`foDocBuono(x)`** (un documento è un oggetto con un `id` stringa non vuota e senza `/`) e
      **`foBackupControlla(d)`**, che guarda **dentro**: ogni collection presente deve essere un
      **elenco** di documenti buoni, e almeno una delle sei deve esserci. Al primo guasto l'app
      elenca i motivi e dice «**NON ho toccato niente: i dati di adesso sono rimasti come
      erano.**»
    - 🔢 **Lo schema** (punto 5): costante **`FO_SCHEMA = 1`** scritta nel file come `__schema`,
      con `__app` e `__rev`. Al ripristino: se **manca** (backup fatto prima della rev 16) l'app
      **avvisa** e chiede conferma; se **non è un numero** o è **più alto** di quello dell'app
      **rifiuta**. ⚠️ Si incrementa **solo quando cambia la forma dei dati**, non a ogni revisione.
      ⚠️ Il nome del file diceva «- ver1 -» **scritto a mano**: ora porta il numero di schema.
    - ✋ **DUE conferme**, non una: la prima elenca quanti documenti per collection, dice che i
      documenti del file **riscrivono** quelli con lo stesso nome, che quelli che nel file **non
      ci sono restano dove sono** (il ripristino non cancella niente) e che **tornano anche i
      RUOLI** di quel giorno; la seconda ricorda di fare un **📥 Backup JSON di adesso**, perché
      è l'unico modo per tornare indietro.
    - 🔐 **UN LIMITE VERO, MISURATO CON L'EMULATORE UFFICIALE E DICHIARATO NELLA CONFERMA**: le
      regole in vigore danno all'admin `read, update, delete` su `users`, ma **non `create`**
      (il `create` è solo per sé stessi). Quindi **un utente CANCELLATO non si può ricreare dal
      ripristino**: deve registrarsi di nuovo, e poi il ripristino gli rimette ruolo e dati.
      Tutto il resto (`timesheets`, `lightsheets`, `svccaps`, `caps`, `locks`) l'admin lo
      riscrive. **Nove controlli nuovi** nel test delle regole (`R1`…`R9`), che ora fa **60 su
      60**. ⚠️ **Le regole NON sono state toccate**: le pubblica Christian in console.
    - 📣 **L'esito non mente**: scrive quanti documenti sono stati rimessi; se qualche blocco
      fallisce dice «**Ripristino FINITO A META'**», elenca che cosa non è entrato e perché può
      essere (linea caduta o regole di sicurezza), e **non dice «completato»**. Poi ricarica la
      pagina per rileggere tutto dal database.
    - ⚠️ **Scritture a blocchi di 400** con `db.batch()`, perché un batch Firestore ne porta al
      massimo 500.
    - ⚠️ **Diciture nuove, scritte da Claude**, su autorizzazione esplicita di Christian.
  - **Provato in esecuzione** (`rev16fo.cjs`, **33 controlli su 33**, zero errori di pagina): il
    confronto diretto con la **rev 15**, che non portava `svccaps` né `lightsheets` né lo schema e
    non aveva **nessuna** casella file; il backup della rev 16 con tutte e sei le collection, i
    due operatori light e il massimale per servizio dentro; **sette** file malfatti (non JSON, un
    oggetto qualunque, un elenco nudo, `users` che non è un elenco, documenti senza `id`, un
    backup di un'altra app, schema **99**) tutti **rifiutati** con il database **identico**; un
    backup **vero** che rimette davvero i due light e il massimale in un database svuotato;
    **annullando** il database resta vuoto; un backup **senza schema** che avvisa; e con la
    scrittura caduta l'esito che dice «**FINITO A META'**» e **non** «completato».
  - 📐 **Grafica misurata** (`rev16fo-graf.cjs`, **22 controlli su 22**, a 390 · 768 · 1280 ·
    1700px): con il pulsante in più la **larghezza di pagina è identica** alla rev 15, la pagina
    **non scorre di lato** a 390px, le scritte sotto i 12,5px fuori dalla tabella restano **ZERO**
    e il pulsante nuovo è alto **31px** con la scritta a **13px**, come i due che c'erano.
  - **Batteria rieseguita sulla rev 16, ZERO falliti**: `mxfo-A` **25/0** · `B` **26/0** ·
    `C` **20/0** · `D` **30/0** · `E` **41/0** · `F` **20/0** · `G-piccole` (zero scritte piccole)
    · `H` **10/0** · `I` **10/0** · `J` **16/0** · `K` **5/0** · `L` **4/0** · `M` **12/0** ·
    `fix-b1` **13/0** · `fix-b36` **9/0** · `g9-fo-salva` **12/0** · `sc-fo-rev14` **38/0** ·
    `sc-fo-rev14b` **6/0** · `rev15fo` **34/0** · `rev15fo-graf` **18/0** · `rev16fo` **33/0** ·
    `cf1` **8/0** · `cf2` **41/0** · `cf4` **29/0** · `cf5` **28/0** · `cf7` **15/0** ·
    `cf8` **13/0** · `cf9` **6/0** · `cf10` **12/0** · `cf11` **3/0** · `cf12` **8/0** ·
    regole Firestore **60/60**.
    ⚠️ In **tre** script le attese erano invecchiate e sono state **aggiornate, non aggirate**: la
    targhetta scritta a mano in `rev15fo` (ora si legge dal file dell'app), e i due controlli di
    `cf1` e `cf5` che **documentavano i difetti chiusi oggi** (nessun import, nessun numero di
    schema): ora pretendono il contrario.
    ⚠️ **`lock8`/`lock8b` NON sono stati rieseguiti**: girano su una **copia congelata** della
    rev 8 (cartella `fo8/`), quindi non direbbero niente sulla rev 16. Il blocco del mese è
    coperto da `mxfo-D` e `mxfo-J` sul file di oggi.

- 🔴 **COLLAUDO GENERALE DEL 11/11/2026 — DUE DIFETTI GRAVI E PREESISTENTI SULLA SICUREZZA DEI
  DATI, TROVATI E NON CORRETTI** (servono le decisioni di Christian). Il resto della rev 15 ha
  retto: **509 controlli superati, zero errori di pagina**, batteria storica **349/0** senza
  nessuna attesa invecchiata, grafica confermata a **390 · 768 · 1280 · 1700px** (tabella del
  mese **906px**, **zero** scritte sotto i 12,5px fuori dalla griglia), bande non sovrapposte
  anche **ridimensionando a caldo**, assenza su 4 servizi contata **una volta sola**, formati
  orari storici **20,00** e **22,50**.
  1. 🔴 **IL BACKUP JSON NON È UNA COPIA COMPLETA.** Riga **3986**:
     `const backup={exportDate, users, timesheets, caps, locks}`. **Mancano `svccaps`** (i
     massimali per servizio, cioè il sistema **BUONO** in uso dalla rev 6) **e `lightsheets`**
     (tutti gli operatori light e le loro ore). Dentro c'è invece **`caps`**, il sistema
     **vecchio e fermo dalla rev 6**. Il PROMEMORIA a video chiama quel file «la tua copia di
     sicurezza indipendente da Firebase»: per **due collection su sei non lo è**.
     ⚠️ **PREESISTENTE**: riga identica nelle copie congelate rev 9 e rev 11.
     ✅ **CHIUSO dalla rev 16** (Christian: «aggiungi»): vedi la scheda 💾 qui sopra.
  2. 🔴 **NON ESISTE NESSUN IMPORT.** Misurato: **0** `input[type=file]`, **0** `FileReader`,
     nessuna funzione di ripristino. Il §10.1 chiede «Backup (esporta JSON) **e Import** presenti
     in ogni app fin dalla ver1». Il backup si può solo produrre, mai rimettere dentro:
     un ripristino richiede la console Firebase. ⚠️ **PREESISTENTE** e **mai dichiarato qui**.
     ✅ **CHIUSO dalla rev 16** (Christian: «aggiungi»): vedi la scheda 💾 qui sopra.
  3. 🟠 **Il backup non porta il numero di versione dello schema** (c'è solo `exportDate`); il
     `- ver1 -` nel nome del file è scritto a mano e non cambia mai.
     ✅ **CHIUSO dalla rev 16** (Christian: «SÌ»): `FO_SCHEMA = 1` dentro il file, e il nome del
     file porta quel numero.
  4. 🟠 **28 messaggi d'errore mostrano ancora il testo tecnico inglese di Firebase**
     (`alert("Errore…"+e.message)`), quasi tutti nei percorsi **admin**: `delServizio`,
     `delWorker`, `toggleMonthLock`, `saveSvcCap`, `exportJSON`, `addLightOp` e altri. La rev 14
     ne aveva corretto **uno solo** (riga 625), e il `CLAUDE.md` lo dice: la classe di difetto
     resta aperta negli altri 28.
     🚫 **DECISIONE DI CHRISTIAN DELL'11/11/2026: «non serve».** Non tradurli e **non
     riproporlo.**
  5. 🟡 **Aprire un mese mai compilato SCRIVE nel database** (`timesheets/<uid>__<anno>_<mese>_<n>`
     con `days:{}`), per la sola navigazione.
  6. 🟡 **La banda rossa è una sola**: se si perdono prima le ore e poi un'assenza, il messaggio
     che dice di premere 💾 per le ore **sparisce**, pur restando vero. È la conseguenza del
     progetto a banda unica della rev 15.
  7. 🟡 Questo file diceva «~412 KB»: il file è **433 KB** (443.879 byte). Corretto qui sotto.
  ⚠️ Allora **niente di tutto questo era stato corretto**: erano difetti preesistenti che
  toccano il percorso dei dati, e il §10.3 chiede il suo via libera. **Christian ha risposto
  lo stesso giorno**: i punti **1**, **2** e **3** sono chiusi dalla **rev 16**, il punto **4**
  è una sua decisione di **non toccare**, e i punti **5**, **6** e **7** restano aperti.

- 🗣️ **TRE RISPOSTE DI CHRISTIAN, TUTTE SULLE SCRITTE CHE MANCAVANO** (rev 15, 10/11/2026,
  punti **13** «Cambiala», **14** «Richiedi al primo accesso» e **15** «Aggiungi» dell'elenco
  consegnato dopo il collaudo delle interconnessioni). **Nessun calcolo e nessun dato toccato.**
  - 🚩 **13 — la banda dice QUALE cosa non è stata salvata.** Diceva «**ORE NON SALVATE**»
    anche quando si perdeva un'**ASSENZA**, e indicava il 💾, che però l'assenza **non la rimette**:
    va riscelta dalla tendina. La rev 12 l'aveva riusata di proposito, ma per quel caso la frase
    era sbagliata. Ora **`bandaSalvataggio(mostra, tipo)`** ha un secondo parametro **facoltativo**
    e con `tipo==="assenza"` scrive: «⚠️ **ASSENZA NON SALVATA** — il collegamento è caduto. Il
    💾 Salva non la rimette: quando torna la linea **riscegli l'assenza dalla tendina**.»
    Lo passano i **tre** punti dell'assenza (`applyAbsGiornata`, `window.onAbs`, `window.onAbsU`).
    ⚠️ **Il testo delle ORE è rimasto IDENTICO, carattere per carattere** (misurato), e anche
    l'avviso a comparsa della rev 12 non è stato toccato.
    ⚠️ **Dicitura nuova, scritta da Claude**, su autorizzazione esplicita di Christian.
  - ℹ️ **15 — «NON HAI PERSO NIENTE» quando cade la LETTURA.** Era l'effetto collaterale della
    rev 12 misurato e allora **non** corretto: se cade anche la lettura, dopo un'assenza fallita
    la rev 12 butta dalla cache le chiavi toccate, `loadTS` torna a leggere, la lettura fallisce e
    **tutto il mese si svuota a video** (misurato: «Totale ore 20,00» → **0,00**, 186 caselle su
    186 vuote). Nessun dato era perso, ma **nessuna scritta lo spiegava**.
    Ora c'è una **seconda banda, `#banda-lett`**, **blu** (`#1D5F8A`) e non rossa, perché non è un
    guasto dei dati: sta **sopra** quella rossa, così se cadono scrittura e lettura insieme
    **si vedono tutte e due**. La mostra il `catch` di **`loadTS`**, e sparisce da sé al primo
    documento riletto con successo. ⚠️ **Dicitura nuova, scritta da Claude.**
    🐞 **UNA TRAPPOLA TROVATA DALLA MISURA, NON DAL CODICE**: la prima stesura metteva la banda
    blu a **`bottom:54px` fisso**, e a **390px le due bande si SOVRAPPONEVANO** (misurato: sul
    telefono la rossa va a capo e diventa alta **77px**, non 54). Ora **`bandeImpila()`** misura
    l'altezza vera della rossa e sposta la blu di conseguenza, e si richiama anche al
    **ridimensionamento** della finestra. **Misurato dopo**: a 390px rossa 923-1000 e blu
    827-923, a 1500px rossa 955-1000 e blu 910-955 — **nessuna sovrapposizione**.
  - 👤 **14 — il nome chiesto al primo accesso.** Gli account **«battezzati con la mail»**
    (registrazione caduta a metà: account in Auth **senza** documento `users`, poi battezzato dal
    ramo di riserva con la **propria mail**) erano un difetto **preesistente** rimasto aperto
    dalla rev 11. Ora, al primo accesso, l'app **glielo chiede**: funzioni nuove
    **`nomeDaSistemare(dd,u)`** (vero se `name` manca, è uguale alla mail o contiene una
    «@») e **`chiediNomeCognome(u)`** (riquadro `#chiedi-nome` con **Cognome** e **Nome**), e la
    scrittura è un `set(…,{merge:true})` di `cognome`, `nome` e `name` in **STAMPATELLO**.
    - ⚠️ **L'ADMIN è escluso di proposito**: il suo documento può legittimamente avere la mail
      come nome e non va disturbato a ogni accesso. **Non togliere questa esclusione.**
    - ⚠️ **Se la scrittura non riesce**, il riquadro lo dice con la frase della rev 14
      («Non c'è collegamento: riprova quando torna la linea.») e compare «**Lo faccio dopo**»:
      nessuno resta fuori dall'app per colpa della linea, e la domanda torna al prossimo accesso.
    - ⚠️ **Diciture nuove, scritte da Claude**, su autorizzazione esplicita di Christian.
  - **Provato in esecuzione** (`rev15fo.cjs`, **34 controlli su 34**, zero errori di pagina):
    la banda dell'assenza col testo nuovo e **senza** «ORE NON SALVATE»; la banda delle ore
    **identica** a prima; la banda blu che compare con la lettura caduta, che **non** fa comparire
    quella rossa e che **sparisce da sé** quando la linea torna; il riquadro del nome che compare
    col nome uguale alla mail e **non** compare con un nome vero; «ROSSI MARIO» scritto nel
    database con `role` e `email` **intatti**; la testata che passa da «Ciao operatore@prova.it» a
    «**Ciao MARIO**»; l'admin non disturbato; e il percorso con la scrittura caduta.
  - 📐 **GRAFICA MISURATA** (`rev15fo-graf.cjs`, **18 controlli su 18**, a 390 e 1500px): con
    **tutte e due le bande accese** la pagina **non scorre di lato** e la **tabella del mese resta
    906px** a 390px, identica; **zero** scritte sotto i 12,5px fuori dalla tabella; le bande sono
    a **14px**; il riquadro del nome sta dentro lo schermo (362px su 390) e la sua casella e il
    suo pulsante sono **41px**, comodi da dito come vuole il §10.6.
  - **Batteria rieseguita, tutta superata**: `mxfo-A` 25 · `B` 26 · `C` 20 · `D` 30 · `E` 41 ·
    `F` 20 · `G-piccole` (zero scritte piccole) · `H` 10 · `I` 10 · `J` 16 · `K` 5 · `L` 4 ·
    `M` 12 · `fix-b1` 13 · `fix-b36` 9 · `g9-fo-salva` 12 · `sc-fo-rev14` 38 · `sc-fo-rev14b` 6,
    **zero falliti**.
    ⚠️ In cinque script le **attese erano invecchiate** e sono state **aggiornate, non aggirate**:
    la targhetta scritta a mano; la banda dell'assenza, che ora dice «ASSENZA NON SALVATA»; il
    controllo che pretendeva che il 💾 **rimettesse** l'assenza (dalla rev 12 **non** la rimette,
    ed è proprio ciò che la rev 15 ora dice — verificato che **riscegliendola** si salva su tutti
    i servizi); due controlli di `mxfo-H` che **documentavano il difetto chiuso dalla rev 12**; e
    un controllo che cercava «MALATTIA» in **tutto** il database, mentre il seme ne ha già una sul
    giorno 8 (ora guarda solo il giorno 15, libero).
    ⚠️ **`lock8`/`lock8b` NON sono stati rieseguiti**: girano su una **copia congelata** della rev 8
    (cartella `fo8/`), quindi non direbbero niente sulla rev 15. Il blocco del mese è coperto da
    `mxfo-D` e `mxfo-J` sul file di oggi.

- ⏱️ **L'ATTESA DELLA rev 13 SCADEVA, E IL DIFETTO TORNAVA PEGGIORATO** (rev 14, 09/11/2026,
  tre difetti **trovati dal SECONDO collaudo**, di cui **uno nella correzione stessa della rev 13**).
  - 🔴 **Il difetto grave era mio.** La rev 13 faceva aspettare `onAuthStateChanged`
    **50 giri da 100 ms, cioe' 5 secondi**. Con una linea piu' lenta l'attesa **scadeva mentre la
    bandierina era ancora alzata**, il codice proseguiva nel ramo di riserva e il difetto **B6
    tornava per intero, peggiorato**. **Misurato**: sicuro a 4,5 s, **guasto a 5,5 s e a 6 s** —
    **due** scritture su `users`, la seconda con `name` uguale alla **mail** che **vinceva nel
    database**, e la testata diceva di nuovo «Ciao lenti@prova.it! 👋».
    E poiche' quel ramo usava `set()` **senza `{merge:true}`**, i campi **`cognome` e `nome`
    venivano CANCELLATI** dal documento.
  - **Le due correzioni**: il tetto dell'attesa passa da **50 a 600 giri** (60 s) — la bandierina
    viene abbassata **sempre**, sia dopo la scrittura vera sia nel `catch`, quindi il ciclo
    finisce da se' e il tetto e' solo un salvagente; e il `set` del ramo di riserva ha ora
    **`{merge:true}`**, cosi' non puo' piu' cancellare niente.
    **Misurato dopo**: con la scrittura rallentata a **3 · 4,5 · 5,5 · 7 · 12 secondi**, in tutti e
    cinque i casi **una sola scrittura**, `name:"LENTI LUCA"`, `cognome`/`nome` intatti, testata
    «Ciao LUCA!» e zero errori di pagina.
  - 🟠 **Un messaggio tecnico in inglese arrivava all'operatore esterno**: se la scrittura
    cadeva, il riquadro dell'errore mostrava «Failed to get document because the client is
    offline.». Ora per quel caso dice «**Non c'è collegamento: riprova quando torna la linea.**»
    ⚠️ **Dicitura nuova, scritta da Claude** (prima c'era il testo di Firebase, non una
    dicitura scelta da Christian). ⚠️ Difetto **preesistente**, verificato identico nella rev 11.
  - 👁️ **Il blocco della rev 13 aveva dimenticato la schermata di ACCESSO.** Il perimetro
    dichiarato erano le tre schermate interne; misurate **3** scritte a 12px in accesso
    («Foglio ore elettronico», «Email», «Password») e **5** in registrazione (anche «Cognome» e
    «Nome»), a 390 **e** a 1500px, identiche nella rev 11. Aggiunta una regola per
    `#app-login .logo p`, `.sub`, `label`, `.lbl`, con la stessa esclusione `:not(.tbl-wrap *)`.
    **Misurato: da 3 e 5 a ZERO**, a entrambe le larghezze, senza scorrimento laterale.
  - ✅ **NON REGRESSIONE, misurata**: i formati orari storici danno ancora **20,00**; l'assenza si
    salva su **tutti** i servizi del giorno; col collegamento caduto la banda della rev 12 compare,
    l'avviso nomina l'assenza, **nel database non viene scritto niente** (verificato sul giorno 15,
    che nel seme e' libero) e tornata la linea l'assenza si salva e **la banda sparisce**.
    **Zero errori di pagina.**
  - 🟠 **DUE COSE SEGNALATE A CHRISTIAN E NON TOCCATE** (servono una sua decisione):
    1. **La banda rossa dice «ORE NON SALVATE» anche quando si perde un'ASSENZA**, e indica il
       💾, che però non rimette l'assenza: va riscelta dalla tendina. L'avviso a comparsa lo
       dice giusto; e' la **banda** che resta generica, perche' la rev 12 l'ha riusata di proposito
       da quella della rev 10. ⚠️ E' una **dicitura scritta da Claude**, non di Christian: si può
       differenziare, ma serve il suo via.
    2. **Gli account «battezzati con la mail»**: chi si registra e la scrittura cade a meta'
       resta con l'account in Auth **senza** documento `users`, e al primo accesso buono il ramo di
       riserva lo chiama con la **propria mail**, per sempre. ⚠️ Difetto **PREESISTENTE**
       (identico nella rev 11): la rev 13 aveva chiuso la **corsa** fra le due scritture, non il
       percorso «scrittura fallita». Il `{merge:true}` della rev 14 impedisce almeno di
       cancellargli cognome e nome. Per sistemare quegli account serve decidere **cosa farne**.
  - 🟠 **Un effetto collaterale di F1 misurato e NON corretto**: se cade anche la **lettura**,
    dopo un'assenza fallita la rev 12 butta dalla cache le chiavi toccate, `loadTS` torna a
    leggere, la lettura fallisce e **tutto il mese si svuota a video** (misurato: «Totale ore
    20,00» → **0,00**, 186 caselle su 186 vuote). **Nessun dato e' perso** — ricaricando a linea
    buona torna tutto, e il database resta intatto — ma nessuna scritta lo spiega.
    ⚠️ Misurato **in simulazione**: con Firestore vero e la persistenza locale attiva la lettura
    sarebbe servita dalla cache e il mese non si svuoterebbe. **Non verificabile da qui.**

- 🧾 **IL NOME AL POSTO DELLA MAIL, E LE ULTIME SCRITTE PICCOLE** (rev 13, 09/11/2026, difetti
  **B3** e **B6** del collaudo generale, corretti su richiesta di Christian).
  - **B6 — dopo la registrazione la testata mostrava la mail.** `createUserWithEmailAndPassword`
    fa scattare **`onAuthStateChanged` PRIMA** che il documento utente vero sia stato scritto: la
    parte `else` non lo trovava e ne creava uno con **`name: u.email`**, che un attimo dopo
    veniva sovrascritto. **Due scritture in corsa**, e per tutta la prima sessione si leggeva
    «Ciao mario@prova.it! 👋». ⚠️ **Con Firebase vero l'ordine non è garantito**: poteva restare
    la mail **anche nel database**.
    **Correzione**: la bandierina **`registrazioneInCorso`** (alzata prima di creare l'utente,
    abbassata dopo la scrittura vera **e nel `catch`**); se è alzata, `onAuthStateChanged`
    **aspetta** il documento vero invece di inventarne uno.
    **Misurato**: **una sola scrittura** `set users/…`, la testata dice «Ciao VIOLA! 👋» e nel
    database `name:"VERDI VIOLA"`.
  - **B3 — le ultime tre scritte sotto i 12,5px fuori dalla tabella del mese**: `.svc-tab .sn`
    (**9px**, il nome del servizio sotto la linguetta, 20 occorrenze), `.svc-tab` (**12px**) e la
    riga a **11,5px** in fondo al riquadro «🎯 Le ore che ti restano quest'anno». Il blocco della
    rev 4/rev 10 non le vedeva perché sono **regole di classe** e una misura **non intera**.
    ⚠️ Le regole originali non sono state toccate: si aggiunge solo la misura minima, con la
    stessa esclusione `:not(.tbl-wrap *)`.
    **Misurato**: da 3 a **0** scritte piccole a 390 e a 1500px, e la **tabella del mese resta
    906px** sul telefono, identica.
  - **Provato in esecuzione** (`fix-b36.cjs`, **9 controlli su 9**, zero errori di pagina).

- 🔴 **ANCHE L'ASSENZA, ORA, NON SI PERDE PIÙ IN SILENZIO** (rev 12, 09/11/2026, difetto trovato
  dal collaudo generale e corretto su richiesta di Christian: «correggi anzitutto 1 e 2»).
  - **È lo stesso difetto chiuso nella rev 10 per le ORE, rimasto aperto per le ASSENZE**, perché
    queste **non passano da `saveTS`**: `applyAbsGiornata` scrive con un `db.batch()` e il
    `batch.commit()` era **nudo**.
  - **Che cosa succedeva, misurato**: con il collegamento caduto l'eccezione usciva da
    `applyAbsGiornata`, quindi **`renderWorker()` non veniva mai eseguito**; la **banda rossa non
    compariva** (non esisteva nemmeno nel DOM), la tendina **continuava a mostrare «FERIE»** come
    se fosse salvata, e **ricaricando l'assenza era sparita**. ⚠️ Fogli ore **non tiene copia
    locale**: quell'assenza era persa, e l'operatore non aveva modo di accorgersene.
  - **La correzione**: il `commit` sta dentro un `try/catch`. Il batch è **atomico**, quindi se
    fallisce nel database **non è cambiato niente**: si buttano dalla cache le chiavi toccate
    (`toccate[]`), così `loadTS` torna a leggere dal database e la pagina **dice la verità**;
    compare la **banda rossa** della rev 10 e un **avviso** dice «⚠️ L'assenza NON è stata
    salvata: il collegamento è caduto. Riprova quando torna la linea.»
    ⚠️ **Dicitura nuova, scritta da Claude.**
  - **`window.onAbs` e `window.onAbsU`** chiamano ora `applyAbsGiornata` dentro un `try/catch`:
    **qualunque cosa succeda la pagina si ridisegna**, perché era proprio il ridisegno saltato a
    rendere invisibile il guasto.
  - ⚠️ **Niente altro è stato toccato**: la banda, il suo testo, `saveTS` e il salvataggio
    automatico ogni 600 ms restano identici.
  - **Provato in esecuzione** (`fix-b1.cjs`, **13 controlli su 13**, zero errori di pagina): col
    database sano l'assenza si salva **su tutti i servizi** del giorno e nessuna banda compare;
    col collegamento caduto compaiono **banda e avviso**, nel database **non viene scritto
    niente**, e la tendina **non mostra più l'assenza**; tornata la linea l'assenza si salva e
    **la banda sparisce**; togliere un'assenza continua a toglierla da tutti i servizi.

- 📐 **COMPATTAZIONE: PIU' ROBA A SCHERMO, STESSI COLORI E STESSE ALTEZZE** (rev 11, 08/11/2026,
  richiesta di Christian: «REVISIONE GRAFICA COMPLESSIVA DEL GESTIONALE — l'interfaccia attuale
  presenta spaziature eccessive»). Intervento **di solo CSS**: un blocco nuovo in fondo al
  `<style>`, **nessuna riga di JavaScript, nessun attributo HTML, nessuna classe nuova**.
  - 🔑 **TRE SCELTE DI CHRISTIAN, prese con una domanda PRIMA di costruire**, perché la sua
    richiesta conteneva due contraddizioni interne:
    1. **niente verde**: la codifica a colori per provenienza del dato (giallo manuale / verde
       parametro / azzurro formula / bianco incerto) **non è ottenibile dal solo CSS**, perché
       «parametro preassegnato» e «compilazione manuale» nel DOM sono **la stessa casella**:
       servirebbe un contrassegno nel JavaScript, che il suo stesso vincolo vietava. **Rimandata**
       (sua risposta: «Parte 2 hai fatto bene a non fare»);
    2. **i colori già scelti da lui vincono sempre**: qui **nessun colore è stato toccato**;
    3. **le altezze NON si riducono**: la sua richiesta chiedeva di abbassare anche caselle,
       tendine e pulsanti, ma il §10.6 dice il contrario; **vale il §10.6**, si stringono solo
       gli SPAZI.
  - ⚠️ **Il verde non si può fare senza toccare il codice**: non riproporlo come se bastasse il
    CSS. Se un giorno lo si vorrà davvero, serve il suo permesso per **un solo contrassegno** sulle
    caselle precompilate da un parametro.
  - **Che cosa si stringe**: `.screen`, `.logo`, `.card`, `.field`, `.topbar`, `.controls`,
    `.svc-tabs`, `.svc-input`, `.tabs-admin`, `.admin-list`, `.wk-card`, `.sum-tbl`, i quadri
    admin, più le spaziature scritte in riga (qui **senza** spazio dopo i due punti, perché sono
    template string scritte a mano, non React).
  - 🔴 **DUE TRAPPOLE TROVATE E CHIUSE, tutte e due misurate:**
    1. **`:not(.tbl-wrap *)` NON bastava.** Il **FOGLIO UNICO** ha `<table class="tbl">` dentro un
       `div` **senza** `.tbl-wrap`: l'esclusione storica non lo proteggeva. Il blocco nuovo usa
       **`:not(.tbl *)`**, che protegge **entrambe** le tabelle del mese.
    2. **La prima stesura ALZAVA i cartelloni sul telefono**, da 131 a **144px**: la regola
       `.homecard:not(.tbl *)` ha specificità più alta di quella della rev 3 e la batteva dentro
       la sua media query. Corretta ripetendola sotto i 900px: ora **131 → 126px**.
  - ⚠️ **Una regola TOLTA di proposito**: stringere `[style*="padding:0 14px 14px"]`, il
    contenitore della tabella del foglio unico, faceva **crescere la tabella da 1252 a 1256px**
    (è `width:100%` e si prendeva lo spazio liberato). Guadagno nullo, regola violata: tolta.
  - **Misurato in esecuzione** a 390 · 768 · 1280 · 1680px: Pannello admin **da −5,2% a −8,1%**,
    elenco servizi −2%, foglio del mese −0,4%/−1,2% (è quasi tutto tabella, e la tabella non si
    tocca).
  - ✅ **NON cambiati**: larghezza di pagina identica; **tabella del mese 1009 / 1252 / 1652px →
    identiche**; scritte sotto i 12,5px identiche (73 nel foglio, dentro la griglia); bersagli
    identici. **Zero errori di pagina.**
  - ⚠️ **I pulsanti NON sono stati stretti**: in quest'app non esiste nessun `min-height` e
    `.btn-s` è già a ~27px; toccarne il padding lo porterebbe ancora più sotto il bersaglio da
    dito. ⚠️ Dove serviva, le regole sono ripetute con **`.admin-mode`** davanti: quel tema ha
    specificità più alta e vale per i ruoli **admin e viewer**.
- 🔴 **«✓ SALVATO!» NON È PIÙ UNA BUGIA** (rev 10, 07/11/2026, trovato con l'audit generale
  chiesto da Christian e corretto con il suo Nu\*). **È il difetto più grave trovato nel
  gestionale**, ed era **preesistente**.
  - **Che cosa succedeva, provato in esecuzione**: con il collegamento caduto, il salvataggio
    automatico (ogni 600 ms dopo una cella) **falliva in silenzio** e il pulsante 💾 diceva
    **«✓ Salvato!»**. Nel database il dato non arrivava (verificato: restava il valore vecchio),
    a video la casella mostrava quello nuovo. ⚠️ **Fogli ore non tiene nessuna copia nel
    browser**: chiudendo la pagina quelle ore erano **perse**.
  - **La causa era una riga**: `saveTS` finiva con `try{await db…set(p)}catch(e){console.error(e)}`.
    L'errore veniva **ingoiato**, quindi il `catch` di `manualSave`/`manualSaveU` — che mostra
    già «Errore!» — **non poteva mai scattare**.
  - **Come è stato corretto, nel modo meno invasivo**: `saveTS` **non lancia** (i 19 punti che la
    chiamano senza `await` restano identici), ma ora **torna `true`/`false`**. `manualSave` e
    `manualSaveU` controllano quel valore e, se è `false`, entrano nel **ramo «Errore!» che
    c'era già**: due righe aggiunte in tutto.
  - **Nuova banda rossa `#banda-salv`**, creata da `bandaSalvataggio(mostra)` e attaccata al
    `body` la prima volta che serve: «⚠️ **ORE NON SALVATE** — il collegamento è caduto. Non
    chiudere la pagina: quando torna la linea premi 💾 Salva.» con la ✕ per chiuderla. **Sparisce
    da sé** al primo salvataggio riuscito. ⚠️ **Dicitura nuova, scritta da Claude**: prima non
    c'era nessun avviso. Serve perché il salvataggio automatico non ha un pulsante da colorare.
  - **Provato in esecuzione** (`g9-fo-salva.cjs`, **12 controlli su 12**, zero errori di pagina,
    con una finta Firebase che rifiuta le scritture): col guasto il database non riceve niente,
    la banda compare col testo giusto, il pulsante dice **«Errore!»** (prima diceva «Salvato!»);
    col database sano il pulsante dice «✓ Salvato!», il dato arriva davvero e **la banda
    sparisce**.
  - ⚠️ **Resta vero che Fogli ore salva da sé** ogni 600 ms: è la scelta storica di quest'app,
    che non ha copia locale. È uno **scostamento dichiarato** dal §10.1 («mai salvataggio
    automatico»), **non toccato**: senza, l'esterno perderebbe tutto chiudendo la pagina.
- 👁️ **NIENTE PIÙ SOTTO I 12,5px FUORI DALLA TABELLA DEL MESE** (rev 10, 07/11/2026, stesso Nu\*).
  Il blocco della rev 4 copriva le misure da **6 a 11px** e **si era dimenticato il 12px**:
  misurate **9 scritte** a 12px (Esci, 📥 Backup JSON, il PROMEMORIA del backup, 🔒 Chiudi
  \<mese\>, ✏️ CORREGGI NOME / DATI, il 🗑, ← Torna alla lista). Aggiunte **due regole**:
  il modello `[style*="font-size:12px"]` e la classe **`.btn-s`** (35 usi, tutti fuori dalla
  tabella), entrambe con la stessa esclusione `:not(.tbl-wrap *)`.
  ⚠️ **La regola originale `.btn-s{font-size:12px}` NON è stata toccata**: la misura minima si
  aggiunge dopo. ⚠️ **Dentro `.tbl-wrap` non è stato cambiato niente**, per il motivo del
  31/10/2026. **Misurato**: la tabella del mese resta **906px** identica alla rev 9 a 390 e a
  1500px, la pagina non scorre di lato, e le scritte sotto i 12,5px passano da **9 a 0**.
  Resta a 9-11px **solo la targhetta della revisione**, eccezione già dichiarata.
- 📝 **LA FRASE DEL TETTO ANNUO ORA NOMINA ANCHE I PERMESSI** (rev 9, 06/11/2026, Christian:
  «4, completa»). Nel riquadro **🎯 Le ore che ti restano quest'anno** (`buildResiduoAnnuoPanel`)
  la riga in fondo diceva «Comprende le ore fatte e le assenze retribuite dei giorni in cui il
  servizio era aperto»: era rimasta indietro rispetto all'app Dipendenti, che dalla **ver98**
  fa consumare il tetto **anche ai permessi retribuiti** e dalla **ver99** applica anche a loro
  il contrassegno erosiva/non erosiva. Ora si legge: «Comprende **le ore fatte, le assenze
  retribuite e i permessi retribuiti** dei giorni in cui il servizio era aperto».
  ⚠️ **Nient'altro è stato toccato**: nessun calcolo, nessuna regola, nessun dato. È una frase
  **nata con la rev 7 e scritta da Claude**, non una dicitura storica di Christian.
  ⚠️ Il numero continua ad arrivare **già fatto** dall'app Dipendenti (collection `residui`,
  sola lettura): qui si mostra e basta.
- 🔒 **LA CHIUSURA DEL MESE STA NELLA SCHERMATA «OPERATORI»** (rev 8, 06/11/2026, richiesta di
  Christian: «sposta in home»). Il blocco del mese stava **dentro la scheda di un singolo
  operatore** (linguetta *Per mese*), ma chiude il mese **per TUTTI**: un solo documento
  `locks/<anno>_<mese>`. Chi lo trovava lì dentro poteva credere che valesse solo per quella
  persona.
  - **Ora**: in `renderAdminList` (la schermata **Operatori**), fra il PROMEMORIA del backup e
    l'elenco delle persone, c'è il blocco **«🔒 Chiusura del mese»** con le due tendine anno +
    mese e il pulsante rosso. ⚠️ Le tendine scrivono in **`as.year`/`as.month`**, gli stessi
    della scheda *Per mese*: cambiando mese qui, la scheda di un operatore si aprirà su quel
    mese. Voluto, così i due posti dicono la stessa cosa.
  - **Nella scheda dell'operatore** resta **solo l'avviso**, in sola lettura: «🔒 \<mese\>
    \<anno\> è CHIUSO per tutti gli operatori — Si riapre dalla schermata Operatori». Chi guarda
    il mese di una persona deve sapere se è chiuso; i due pulsanti non ci sono più.
  - ⚠️ **Le diciture dei pulsanti NON sono state toccate**: «🔒 Chiudi \<mese\> \<anno\>»,
    «🔓 Riapri mese», «Blocca le modifiche per tutti gli operatori» e la fascia rossa sono le
    stesse di prima, spostate. **Nuove** (scritte da Claude): il titolo «🔒 Chiusura del mese» e
    la riga «Si riapre dalla schermata Operatori».
  - **`toggleMonthLock` NON è stata toccata**: stessa conferma («CHIUDERE \<mese\> \<anno\> per
    TUTTI gli operatori?»), stessa scrittura, stesso `renderAdmin()` alla fine.
  - ⚠️ **Il blocco resta imposto solo dall'app, non dal database** — scelta già presa e
    **confermata da Christian il 06/11/2026** («va bene così») dopo che gli era stato scritto che
    chi avesse la pagina aperta da prima potrebbe ancora salvare. Le regole Firestore **non sono
    state toccate**.
  - **Provato in esecuzione** con una **finta Firebase** (`fo8/` + `lock8.cjs`, `lock8b.cjs`),
    **13 controlli su 13** più 5 di contorno: il blocco c'è nella home; il pulsante segue le
    tendine (Marzo · Agosto · Novembre · anno 2027); premendolo scrive davvero
    `locks/2026_11 {locked:true}`; compare la fascia rossa e «🔓 Riapri mese»; nella scheda
    dell'operatore l'avviso c'è e i **due pulsanti non ci sono più**; la riapertura dalla home
    riscrive `{locked:false}`. A **390px** la pagina non scorre di lato. **Zero errori di pagina.**
    ⚠️ **Non verificato con Firebase vero**: le prove girano con un finto database.
- 🎯 **DUE sistemi di massimali, e dalla rev 6 se ne usa UNO SOLO** (03/11/2026, dopo un caso
  reale: un tetto di 408 h sull'a.s. 2026/27 risultava «0 ore consumate» pur essendoci le ore).
  - **`svccaps` — quello buono**, menù *🎯 Attribuzioni (massimali e altro)*, pulsante
    **METTI UN TETTO**. Doc-id `<uid>__<serviceIdx>`: il tetto è agganciato **allo slot del
    servizio**, `calcConsumedForSvcCap` somma le ore di quello slot nei mesi del periodo
    (`scolMonths(y)` = set..ago, `civileMonths(y)` = gen..dic). Nessun confronto di testo.
  - **`caps` — quello vecchio**, era nella scheda dell'operatore, linguetta *Massimali*.
    `calcConsumedForCap` conta una riga solo se coincidono **tutti e cinque** i campi
    `mansione`, `sede`, `dettagli`, `comune`, `alunno`. ⚠️ Mansione e sede sono confrontate
    **lettera per lettera** (niente trim, niente minuscole), gli altri tre con trim+minuscole.
    Nel modulo Via/Comune/Alunno partivano **vuoti**: se nel foglio ore erano scritti, **vuoto ≠
    scritto** e il tetto non trovava nessuna riga → 0 ore, **senza dirlo**. È esattamente il caso
    del 03/11/2026.
  - **Rev 6**: il modulo «Aggiungi massimale» è stato **tolto** dalla scheda dell'operatore
    (scelta di Christian). Al suo posto un riquadro giallo che rimanda alle *Attribuzioni*.
    ⚠️ **Nessun dato cancellato**: i massimali `caps` già creati restano **visibili con il loro
    conteggio e con il pulsante Elimina**, così si possono smaltire. `calcConsumedForCap`,
    `loadCaps` e `delCap` sono **invariati**; `window.addCap` resta nel file ma **non è più
    richiamata da nessuna parte** (lasciata per non toccare i dati esistenti).
  - Se lo stesso lavoro finisce su **due slot diversi**, il tetto nuovo ne vede uno solo (il
    vecchio li sommava perché confrontava le scritte): in quel caso si vedono due righe uguali
    nelle Attribuzioni. 🚫 **CHIUSA il 09/11/2026: Christian ha risposto «non capita».**
    Non c'è niente da fare e **non va riproposta**.
- 🎯 **IL DIPENDENTE VEDE LE ORE CHE GLI RESTANO** (rev 7, 03/11/2026). Nuova collection
  **`residui`**, scritta **dall'app Dipendenti** e letta qui. Doc-id = `uid` dell'operatore,
  dentro **solo numeri** (`tetto`, `usate`, `restano`, `periodo`, `anno`, `aggiornato`): nessun
  nome, nessun dato personale — il documento è già il proprio.
  - Funzioni `loadResiduoAnnuo(uid)` e **`buildResiduoAnnuoPanel(uid)`**, chiamate in
    `renderMieiServizi` e `renderFoglioUnico`, **sopra** il pannello dei massimali per servizio.
    Se il documento non c'è, o le regole non sono ancora pubblicate, la funzione torna `""` e il
    riquadro **semplicemente non compare**: nessun errore a video.
  - ⚠️ **Sola lettura**: le regole non lasciano all'operatore nemmeno scrivere il proprio.
  - ✅ **REGOLE PUBBLICATE, VERIFICATO IL 07/11/2026**: Christian ha incollato in chat il testo in
    vigore nella console e risulta **identico carattere per carattere** a
    `regole-firestore/regole-residui-03nov26.rules` (96 righe, 5.028 byte). Rieseguito
    l'emulatore ufficiale **su quel testo**: **51 controlli su 51**, compresi «l'operatore legge
    il PROPRIO residuo» e «NON legge quello di un collega». ⚠️ Prima di quella pubblicazione la
    funzione non scriveva e il riquadro non compariva (misurato: 4 controlli negati).
  - ⚠️ Questo numero **non coincide** con il residuo dei massimali per servizio mostrato poco
    sotto: quello conta **solo le ore erogate**, questo conta anche **le assenze delle giornate
    erosive**. Misurano cose diverse, per scelta.
- **Leggibilità (rev 4, 31/10/2026)**: terzo blocco in fondo al `<style>`. Fuori dalla tabella
  del mese nessuna scritta resta sotto i 12,5px, i grigi chiari (#999/#ccc/#bbb) diventano
  `#4b5563` e la casella in cui scrivi ha un bordo blu ben visibile. ⚠️ **Dentro la tabella del
  mese non si tocca nulla**: provato il 31/10, alzando le misure lì dentro la tabella passa da
  **906px a 979px** e su telefono si scorre ancora di più; per questo ogni regola esclude i
  discendenti di `.tbl-wrap` con `:not(.tbl-wrap *)`. Non usare `font-size:revert` per rimettere
  le misure originali: azzera anche quelle scritte nell'attributo `style` e la tabella arriva a
  1170px (provato).
- **Telefono e tablet (rev 3)**: seconda sezione in fondo al `<style>`, dentro una
  `@media (max-width:900px)`. **D)** le caselle degli orari (`.ti`) e le tendine (`.sl`) del
  foglio crescono solo in **altezza** (40px e 36px): mai in larghezza, perché la tabella è già
  larga 906px. I bersagli sotto i 32px nella tabella passano da **405 a 33**. **F)** il riquadro
  giallo delle istruzioni (`.instr`) e i due cartelloni della schermata iniziale (`.homecard`)
  diventano più compatti: la home su telefono passa da 958px a 844px, cioè entra in uno schermo.
  Le misure di quei riquadri stanno negli attributi `style` scritti dal JavaScript, perciò qui
  — **e solo dentro quella media query** — servono gli `!important`.
  ⚠️ **NON togliere il `min-width` dei `.homecard`**: provato il 30/10/2026, senza quello i due
  cartelloni si affiancano su un telefono da 390px e il testo del primo viene **tagliato**.
  Per agganciare il foglio di stile sono stati aggiunti **tre soli attributi `class`** nel
  JavaScript (`instr` in `instrBox`, `homecard` sui due pulsanti della home): nessuna logica
  toccata, verificato confrontando il blocco `<script>` riga per riga.
- **Telefono e tablet (rev 2)**: in fondo al blocco `<style>` c'è una sezione marcata
  "TELEFONO E TABLET" con tre interventi di solo aspetto: la **colonna del giorno** (`.dc`/`.dn`
  e le prime due `th` del capo-tabella) è `position:sticky;left:0`/`left:22px`, così resta ferma
  mentre si scorre di lato; le celle bloccate hanno **sfondo proprio** per ogni tipo di riga
  (`we`, `fest`, `fe`, hover) — senza, il resto della riga scorrerebbe sotto e i testi si
  sovrapporrebbero; la `.revtag` si rimpicciolisce sotto i 900px. Inoltre il `<meta viewport>`
  non blocca più lo **zoom con due dita**.
  ⚠️ **Provato e NON funzionante**: bloccare in alto l'intero capo-tabella
  (`thead th{position:sticky;top:0}`). La tabella sta dentro `.tbl-wrap`, che ha
  `overflow-x:auto` e nessuna altezza: lo `sticky` verticale si àncora a quel contenitore, che
  non scorre in verticale, quindi non succede niente. Per ottenerlo servirebbe dare un'altezza
  fissa alla tabella, cioè cambiare il modo in cui scorre la pagina: non farlo senza richiesta.
- **Copia di prova con database finto**: Fogli ore si può far girare in locale sostituendo gli
  indirizzi delle librerie e aggiungendo `auth.useEmulator`/`db.useEmulator` subito dopo
  `const auth=firebase.auth(),db=firebase.firestore();`, con gli emulatori Firebase (auth 9099,
  firestore 8085). Si entra con un utente inventato e si semina un `timesheets` con
  `mansione`/`sede`/`comune` (senza quei campi il servizio risulta "non configurato"). È così
  che si provano le modifiche senza toccare i dati veri.
- **Regole di sicurezza Firestore**: copia versionata + prova automatica in
  **`regole-firestore/`** (vedi il suo `LEGGIMI.md`). Il 30/10/2026 l'emulatore ufficiale ha
  dimostrato **due falle nelle regole allora pubblicate**: in `timesheets` un operatore poteva
  scrivere e poi leggere il foglio ore di un collega; in `users` chiunque si registrasse poteva
  crearsi il documento con `role:"admin"`. **Entrambe CHIUSE lo stesso giorno**: il file
  `regole-corrette-30ott26.rules` passa 39 controlli su 39 **ed è il testo oggi pubblicato in
  console** (verificato rileggendo la linguetta Regole). **Le regole le pubblica Christian in
  console Firebase**, Claude non ha accesso: quando si toccano, aggiungere i nuovi controlli al
  test senza togliere i vecchi.
  Restano aperte per scelta: blocco mese (`locks`) e ruolo `disabled` non imposti dal database,
  creazione libera dei documenti `lightsheets`.
- 🔢 **ARROTONDAMENTO: usare SEMPRE `R2`, mai `Math.round(x*100)/100`** (da rev 5, 03/11/2026).
  Stesso difetto trovato da Christian in USOINT: `67,5 × 22,99` dentro la macchina vale
  `1551,8249999999998` e il vecchio modo lo buttava **giù** a 1551,82 invece di 1551,83 (succede
  quando il terzo decimale è esattamente 5). **`R2(v,dec)`** (sopra `normNome`) ripulisce con
  `toPrecision(12)`; messa in **14 punti**. `fmtDec` ora formatta il numero già ripulito (il
  vecchio `+Number.EPSILON` è rimasto, innocuo). ⚠️ Sui **negativi** l'arrotondamento è ora
  **simmetrico** (commerciale). Provate le funzioni in isolamento: 1.551,83 e 2,68, corrette.
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


## 9. REGOLA ANTI-DOCUMENTI-VECCHI (importante)

Un documento invecchia nell'istante in cui si cambia il codice. Quindi **ogni modifica a questa
app deve includere, NELLO STESSO commit**:

1. **l'incremento del numero di revisione** mostrato nell'app (e della data);
2. **l'aggiornamento di questo file `CLAUDE.md`**, se la modifica cambia qualcosa di ciò che
   descrive (modello dati, funzioni presenti, cose da non toccare, numero di revisione attuale);
3. **l'aggiornamento di `master.md`** (sta nel repo `rendicontazione-usoint`), che è il riepilogo
   generale del sistema.

Non rimandare: una modifica committata senza aggiornare questi tre punti lascia la
documentazione che mente, ed è peggio di non averla. Se Christian chiede una modifica e questi
aggiornamenti non sono stati fatti, farli prima di dire che il lavoro è finito.

## 10. COMANDO PERMANENTE DI CHRISTIAN (dato il 30/10/2026)

Vale per **ogni** creazione o modifica di questa web app, in questa e in tutte le chat future.
Vale insieme alle regole 1-9 sopra; dove ci fosse attrito, prevale ciò che Christian dice in
chat per ultimo.

### 10.0 Ruolo da assumere

Comportarsi come un **ingegnere software senior responsabile anche del controllo qualità e della
stabilità dell'intero progetto**, non come chi scrive una toppa.

Prima di intervenire: analizzare il codice esistente, la struttura dell'applicazione, le
funzionalità disponibili e le dipendenze tra i componenti; individuare quali parti potrebbero
essere influenzate dalla modifica; **conservare una copia ripristinabile della versione
funzionante**.

Applicare **esclusivamente** le modifiche richieste, nel modo più circoscritto possibile. Tutto
ciò che non è direttamente interessato dalla richiesta resta **esattamente com'è**: funzionalità,
interfaccia grafica, testi, pulsanti, menù, procedure, permessi, dati, database, collegamenti,
integrazioni, calcoli, esportazioni e qualsiasi altro comportamento già esistente. Non
eliminare, semplificare, riscrivere o modificare parti funzionanti per comodità, per preferenze
personali o per rendere il codice apparentemente più pulito. **Non introdurre miglioramenti non
richiesti.**

Dopo ogni modifica non basta verificare che la novità funzioni: va controllato meticolosamente
che **tutto il resto continui a funzionare come prima**. Confrontare la nuova versione con la
precedente, esaminare le differenze nel codice, verificare le conseguenze indirette e cercare
attivamente regressioni: funzioni scomparse, pulsanti che non rispondono, procedure interrotte,
dati persi o alterati, problemi di compatibilità, modifiche accidentali.

Eseguire tutti i test tecnici e funzionali disponibili e pertinenti: compilazione, console,
interfaccia, navigazione, persistenza dei dati, database, integrazioni. Ripetere anche i test
delle funzionalità preesistenti che la modifica potrebbe avere toccato, anche solo
indirettamente. Se si trova un errore: correggerlo e **ripetere** i controlli prima di
considerare concluso il lavoro. Quando possibile, provare la nuova versione in un ambiente di
prova prima di pubblicarla.

Mantenere una cronologia delle versioni e un punto di ripristino funzionante prima di ogni
intervento. **Non sovrascrivere l'unica versione funzionante** e non eseguire operazioni
distruttive sui dati senza averne verificato le conseguenze e predisposto le protezioni.

Al termine, comunicare con precisione: cosa è stato modificato, quali controlli sono stati
eseguiti, quali test superati, quali funzionalità preesistenti verificate, quali errori,
limitazioni o controlli restano aperti. **Non dichiarare mai eseguito un test che non è stato
realmente effettuato** e non affermare che tutto funziona senza verifiche sufficienti a
sostenerlo. Se mancano gli strumenti, i dati o l'ambiente per controllare qualcosa, **dirlo
esplicitamente**: una valutazione teorica del codice non sostituisce una verifica reale.

> **Regola fondamentale**: la nuova versione deve essere identica alla precedente in ogni
> aspetto, salvo le modifiche espressamente richieste e le conseguenze strettamente necessarie
> per realizzarle. La priorità assoluta è evitare regressioni, perdite di funzionalità e perdita
> di dati. Il lavoro non è concluso perché la modifica "sembra funzionare": è concluso dopo tutti
> i controlli concretamente possibili, risolti gli errori trovati e dichiarati i limiti delle
> verifiche.

### 10.1 Sicurezza dei dati e recuperabilità — priorità n. 1

- **Mai salvataggio automatico**: salvataggio sempre e solo manuale (💾), con avviso alla
  chiusura se ci sono modifiche non salvate.
- Il salvataggio deve **confermare visibilmente la riuscita** e segnalare con un errore evidente
  quando **fallisce** (localStorage può essere pieno o disattivato in navigazione privata):
  "salvato" non deve mai essere una bugia silenziosa.
- Funzione **Backup (esporta JSON)** e **Import** presenti in ogni app fin dalla ver1.
- Ogni backup JSON porta un **numero di versione dello schema dati**. All'import: prima
  validare, poi — solo se valido — sovrascrivere; se l'import fallisce a metà, i dati correnti
  non si toccano. Se lo schema del backup è più vecchio dell'app: adattarlo o avvisare, **mai
  reimportare alla cieca**. È il punto più fragile, perché il modello dati cambia tra versioni.
- **Conferma esplicita su ogni eliminazione** di dati (progetto, voce, persona, fattura, riga,
  cella non vuota): nessuna cancellazione a secco.
- **Nessun dato personale** (nomi di minori, codici fiscali, dati del personale) in app
  pubblicate su GitHub Pages senza protezione: Pages è pubblico e leggibile da chiunque. Se
  serve il cloud: Firebase **sempre con regole di accesso ristrette**, mai database aperto (la
  config nel file pubblico è visibile a tutti).
- Il sync cloud (Firebase) è lo **stato corrente, non uno storico**: i backup JSON periodici
  restano indispensabili come punti di ripristino.
- **Export Excel stilizzato** (xlsx-js-style) sempre disponibile, con autore nei metadata.

### 10.2 Regole di codice che evitano rotture (imparate sul campo)

- **Sintassi vietata**: `catch{}` senza parametro (usare sempre `catch(e)`); doppio attributo
  `style` sullo stesso elemento JSX; `toLocaleString` (usare sempre `grp()` manuale per i
  separatori italiani).
- Formattazione numerica ed euro **sempre con le funzioni interne**, mai affidarsi al locale del
  browser — sia in uscita sia in entrata: l'utente scrive "1.234,56" e il parsing deve capirlo.
- **React, contro i bug "non si aggiorna"**: mai mutare lo stato direttamente (sempre una nuova
  copia); nelle liste `key` stabili e uniche, **mai l'indice dell'array**.
- **Verifiche obbligatorie prima di ogni consegna**: compilazione Babel; parentesi bilanciate
  (graffe, tonde, quadre); `node --check` sul JS estratto; test runtime
  (Puppeteer/Playwright) sui dati reali — non solo "sembra giusto".
- **Casi limite da provare sempre**: campo vuoto; doppio tocco/click; numeri negativi o zero;
  testo lunghissimo; lista vuota; import di un file corrotto.

### 10.3 Workflow con Christian (blindato)

- **Nulla osta esplicito** prima di generare o consegnare qualsiasi `index.html`, con
  **anteprima (PNG) mostrata prima**.
- Si modifica solo ciò che è stato chiesto: nessun effetto collaterale, nessun "miglioramento"
  non richiesto. Se una modifica richiesta rischia di rompere qualcosa di esistente: **avvisare
  prima** di procedere.
- Domande di chiarimento brevi sui punti ambigui o complessi; risposte dirette sulle cose ovvie.
- Le **decisioni storiche restano valide** finché non le cambia Christian. Tenere un breve
  registro "decisioni prese e idee scartate" e non riproporre ciò che è già stato scartato.
- **Non narrare i passaggi operativi in chat**: solo una riga di sintesi con ciò che serve a
  Christian (domande, cose che quadrano, cose che non quadrano, cosa NON è stato gestito).

### 10.4 Architettura e persistenza

- **Single-file HTML** (tutto in un `index.html`), pubblicato su GitHub Pages (`spazioireos`),
  fatto salvo il vincolo sui dati personali del punto 10.1.
- **React 18 + Babel standalone** per le app complesse; **vanilla HTML/JS** per quelle semplici,
  rispettandone i vincoli (es. no-ES6 su OPOC / Collaboratori).
- Persistenza: `localStorage` + sync Firebase dove serve l'accesso multi-dispositivo;
  `localStorage` + export/import dove basta.

### 10.5 Convenzioni su file e versioni

- Nome file: `[descrizione] - ggMMMaa - verN - HH.MM.ext` (mesi italiani minuscoli, ora di Roma,
  senza underscore).
- Autore nei metadata sempre **"Christian Canonica"**; veri file Office, mai testo camuffato;
  elenchi nominativi in **STAMPATELLO**.
- **Versioni sequenziali, mai saltate**, ognuna verificata. Prima di un cambiamento grosso
  Christian fornisce la versione attuale stabile come punto di salvataggio, per poter tornare
  indietro; se chiede di ripartire da una versione precedente, va recuperata **per numero**,
  senza rifare da capo.
- Anteprima prima di ogni modifica visiva; dopo la creazione, verificare che il file sia
  leggibile, non corrotto, > 0 byte e scaricabile.

### 10.6 UX e leggibilità (app gestionali)

- **Celle editabili sempre giallino con bordo ambra**: segnale visivo immediato di cosa si può
  modificare.
- **Spaziature compatte, sempre** (regola permanente di Christian, 03/11/2026): imbottiture e
  distanze strette — riquadri ~9px, blocchi ~8px, griglie ~6px — così sullo schermo ci sta più
  roba e si scorre meno. ⚠️ Si stringono **gli spazi**, non i comandi: l'altezza di caselle e
  pulsanti NON si riduce (restano comodi da centrare col dito) e nessuna scritta scende sotto i
  12,5px fuori dalle griglie dense.
- Struttura chiara e intuitiva, palette coerente, distinzioni a colpo d'occhio (colori per anno,
  badge di stato, semafori); **intuitiva come se la usasse un ragazzo preadolescente da
  telefono**.
- Terminologia di dominio corretta e, dove serve generalità, neutra (es. "Committente" invece di
  "Comune").
- 🔴 **LE DICITURE NON SI TOCCANO** (regola permanente di Christian, 03/11/2026: «non devi toccare
  le diciture, furono da me scelte»). Titoli, etichette, nomi dei pulsanti, voci dei menù, testi
  delle schermate: **le parole restano quelle**, maiuscole comprese. Una passata grafica cambia
  **colori, misure, spazi e disposizione**, non il testo. Se una dicitura sembra sbagliata o
  rimanda a qualcosa che non esiste più: **segnalarla a Christian e aspettare**, non correggerla
  di propria iniziativa.
- Alla consegna: spiegare **in parole semplici (12\*)** cosa fa ogni pulsante, così Christian
  verifica che corrisponda a ciò che voleva.

### 10.7 Continuità tra sessioni

- `master.md` di progetto per il passaggio a nuove chat, con prompt di ripartenza (obiettivo,
  punto raggiunto, decisioni, prossimi passi).
- Backup strutturato quando ci si avvicina al limite della conversazione.

### 10.8 Controllo cumulativo delle versioni e divieto di consegna non verificata

- A ogni nuova versione: **mantenere e aggiornare un registro cumulativo** delle funzionalità
  esistenti, delle decisioni progettuali, dei bug corretti e dei test di regressione già
  definiti. Non perdere né sostituire i controlli delle versioni precedenti: ogni modifica
  **aggiunge** i nuovi test necessari e **ripete** quelli pertinenti già esistenti.
- Prima di consegnare: confrontare il risultato con l'ultima versione stabile, verificare tutte
  le differenze e accertarsi che **nessuna** funzionalità, formula, regola di calcolo, dato,
  campo, pulsante, procedura o comportamento preesistente sia stato eliminato o alterato senza
  autorizzazione esplicita di Christian.
- Per ogni controllo distinguere chiaramente: **test eseguito e superato**, **test eseguito e
  fallito**, **test non eseguito**, **verifica soltanto teorica**. Una compilazione riuscita
  **non** è prova che l'applicazione funzioni.
- Se un test obbligatorio fallisce, se esistono regressioni note o se manca una verifica
  essenziale: **non dichiarare la versione pronta per la pubblicazione**. Correggere e ripetere i
  controlli; se non è possibile, consegnare solo una versione **esplicitamente indicata come non
  verificata**, senza presentarla come stabile.
- Prima di ogni modifica conservare un riferimento certo alla versione stabile precedente e
  garantire una procedura di ripristino. **Non sovrascrivere tale riferimento.** Dopo ogni
  correzione ripetere anche i test pertinenti, perché la soluzione di un problema non ne
  introduca un altro.
- La conformità a queste regole si dimostra con **controlli effettivi e risultati documentabili**,
  non con dichiarazioni.
