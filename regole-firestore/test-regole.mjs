import fs from 'fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';

// Quale file di regole provare: RULES=<file> npm run prova
// Senza indicazioni prova le regole corrette.
const RULES = process.env.RULES || 'regole-corrette-30ott26.rules';
const ADMIN_MAIL = 'spazioireos@gmail.com';
let ok = 0, ko = 0;
const righe = [];

function esito(nome, atteso, passato) {
  const simbolo = passato ? 'OK ' : 'FALLITO';
  if (passato) ok++; else ko++;
  righe.push(`${simbolo} | ${nome} | atteso: ${atteso}`);
}
// prova(nome, 'permesso'|'negato', fn)
async function prova(nome, atteso, fn) {
  try {
    if (atteso === 'permesso') await assertSucceeds(fn());
    else await assertFails(fn());
    esito(nome, atteso, true);
  } catch (e) {
    esito(nome, atteso, false);
  }
}

const env = await initializeTestEnvironment({
  projectId: 'demo-sp-fogliore',
  firestore: { host: '127.0.0.1', port: 8085, rules: fs.readFileSync(RULES, 'utf8') }
});

async function semina() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore();
    await setDoc(doc(d, 'users/uidADMIN'),  { name:'CANONICA CHRISTIAN', role:'admin', email:ADMIN_MAIL });
    await setDoc(doc(d, 'users/uidW1'),     { name:'ROSSI MARIO',  role:'worker' });
    await setDoc(doc(d, 'users/uidW2'),     { name:'VERDI LUCIA',  role:'worker' });
    await setDoc(doc(d, 'users/uidVIEW'),   { name:'BIANCHI ANNA', role:'viewer', viewableWorkers:['uidW1'], viewableLightEditors:['uidED'] });
    await setDoc(doc(d, 'users/uidED'),     { name:'NERI PAOLO',   role:'editor', viewableWorkers:['uidW1'] });
    await setDoc(doc(d, 'users/uidDIS'),    { name:'GIALLI UGO',   role:'disabled' });
    await setDoc(doc(d, 'timesheets/uidW1__2026_10_0'), { workerUid:'uidW1', year:2026, month:10, days:{ '1':{t1f:'09:00',t1t:'13:00'} } });
    await setDoc(doc(d, 'timesheets/uidW2__2026_10_0'), { workerUid:'uidW2', year:2026, month:10, days:{ '1':{t1f:'14:00',t1t:'18:00'} } });
    await setDoc(doc(d, 'svccaps/uidW1__2026_0'), { workerUid:'uidW1', cap:100 });
    await setDoc(doc(d, 'caps/uidW1_2026'), { cap:1000 });
    await setDoc(doc(d, 'locks/2026_10'), { locked:true });
    await setDoc(doc(d, 'lightsheets/L1'), { editorUid:'uidED', nome:'MARRONI IDA' });
    await setDoc(doc(d, 'report-ore-mensile/uidADMIN'), { dipendenti:[], dati:{} });
  });
}

const W1    = () => env.authenticatedContext('uidW1').firestore();
const W2    = () => env.authenticatedContext('uidW2').firestore();
const ADMIN = () => env.authenticatedContext('uidADMIN', { email: ADMIN_MAIL, email_verified: true }).firestore();
const VIEW  = () => env.authenticatedContext('uidVIEW').firestore();
const ED    = () => env.authenticatedContext('uidED').firestore();
const NUOVO = () => env.authenticatedContext('uidNUOVO', { email:'intruso@example.com', email_verified:true }).firestore();

await semina();

/* ---------- ATTACCHI (devono essere NEGATI) ---------- */
await prova('A1 scrittura "merge" sul foglio ore di un collega (uidW1 -> doc di uidW2)', 'negato',
  () => setDoc(doc(W1(), 'timesheets/uidW2__2026_10_0'), { workerUid:'uidW1' }, { merge:true }));

// A2: la lettura dopo l'attacco (se A1 e' passata, il documento del collega e' ora leggibile)
await prova('A2 lettura del foglio ore del collega dopo l\'attacco A1', 'negato',
  () => getDoc(doc(W1(), 'timesheets/uidW2__2026_10_0')));

await semina();
await prova('A3 sovrascrittura totale del foglio ore di un collega (perdita dati)', 'negato',
  () => setDoc(doc(W1(), 'timesheets/uidW2__2026_10_0'), { workerUid:'uidW1', year:2026, month:10, days:{} }));

await semina();
await prova('A4 nuovo iscritto si crea il documento utente con ruolo "admin"', 'negato',
  () => setDoc(doc(NUOVO(), 'users/uidNUOVO'), { name:'INTRUSO', role:'admin', email:'intruso@example.com' }));

await prova('A5 lettura del foglio ore di un collega (senza attacchi)', 'negato',
  () => getDoc(doc(W1(), 'timesheets/uidW2__2026_10_0')));
await prova('A6 lettura del documento utente di un collega', 'negato',
  () => getDoc(doc(W1(), 'users/uidW2')));
await prova('A7 operatore scrive sui massimali (svccaps)', 'negato',
  () => setDoc(doc(W1(), 'svccaps/uidW1__2026_0'), { workerUid:'uidW1', cap:9999 }));
await prova('A8 operatore scrive sui tetti (caps)', 'negato',
  () => setDoc(doc(W1(), 'caps/uidW1_2026'), { cap:9999 }));
await prova('A9 operatore apre/chiude il blocco del mese (locks)', 'negato',
  () => setDoc(doc(W1(), 'locks/2026_10'), { locked:false }));
await prova('A10 operatore legge il Report Ore mensile dei dipendenti', 'negato',
  () => getDoc(doc(W1(), 'report-ore-mensile/uidADMIN')));
await prova('A11 operatore legge il foglio light di un editor', 'negato',
  () => getDoc(doc(W1(), 'lightsheets/L1')));
await prova('A12 utente non autorizzato legge l\'elenco completo dei fogli ore', 'negato',
  () => getDocs(query(collection(W1(), 'timesheets'), where('year','==',2026))));

/* ---------- USO NORMALE (deve restare PERMESSO) ---------- */
await semina();
await prova('N1 operatore legge il PROPRIO foglio ore', 'permesso',
  () => getDoc(doc(W1(), 'timesheets/uidW1__2026_10_0')));
await prova('N2 operatore scrive il PROPRIO foglio ore (mese nuovo)', 'permesso',
  () => setDoc(doc(W1(), 'timesheets/uidW1__2026_11_0'), { workerUid:'uidW1', year:2026, month:11, days:{ '2':{t1f:'09:00',t1t:'12:30'} } }));
await prova('N3 operatore aggiorna il PROPRIO foglio ore', 'permesso',
  () => setDoc(doc(W1(), 'timesheets/uidW1__2026_10_0'), { days:{ '1':{t1f:'09:00',t1t:'14:00'} } }, { merge:true }));
await prova('N4 operatore legge il PROPRIO documento utente', 'permesso',
  () => getDoc(doc(W1(), 'users/uidW1')));
await prova('N5 operatore legge i PROPRI massimali (svccaps)', 'permesso',
  () => getDoc(doc(W1(), 'svccaps/uidW1__2026_0')));
await prova('N6 operatore legge il blocco del mese (locks)', 'permesso',
  () => getDoc(doc(W1(), 'locks/2026_10')));
await prova('N7 operatore interroga i PROPRI fogli ore per workerUid', 'permesso',
  () => getDocs(query(collection(W1(), 'timesheets'), where('workerUid','==','uidW1'))));
await prova('N8 REGISTRAZIONE: nuovo iscritto si crea il documento con ruolo "worker"', 'permesso',
  () => setDoc(doc(NUOVO(), 'users/uidNUOVO'), { name:'NUOVO UTENTE', role:'worker', email:'intruso@example.com' }));

await semina();
await prova('N9 ADMIN legge l\'elenco utenti (serve all\'app Dipendenti)', 'permesso',
  () => getDocs(collection(ADMIN(), 'users')));
await prova('N10 ADMIN interroga i fogli ore del mese (serve all\'app Dipendenti)', 'permesso',
  () => getDocs(query(collection(ADMIN(), 'timesheets'), where('year','==',2026), where('month','==',10))));
await prova('N11 ADMIN legge il foglio ore di un operatore', 'permesso',
  () => getDoc(doc(ADMIN(), 'timesheets/uidW2__2026_10_0')));
await prova('N12 ADMIN corregge il documento di un utente (cambio ruolo)', 'permesso',
  () => setDoc(doc(ADMIN(), 'users/uidW1'), { role:'viewer' }, { merge:true }));
await prova('N13 ADMIN scrive i massimali (svccaps)', 'permesso',
  () => setDoc(doc(ADMIN(), 'svccaps/uidW1__2026_0'), { workerUid:'uidW1', cap:120 }));
await prova('N14 ADMIN chiude il mese (locks)', 'permesso',
  () => setDoc(doc(ADMIN(), 'locks/2026_10'), { locked:true }));
await prova('N15 ADMIN legge e scrive il Report Ore mensile', 'permesso',
  () => setDoc(doc(ADMIN(), 'report-ore-mensile/uidADMIN'), { dipendenti:[{id:1,nome:'ROSSI MARIO'}] }, { merge:true }));
await prova('N16 ADMIN cancella un documento utente', 'permesso',
  () => deleteDoc(doc(ADMIN(), 'users/uidDIS')));

await semina();
await prova('N17 VIEWER legge il foglio ore di un operatore assegnato', 'permesso',
  () => getDoc(doc(VIEW(), 'timesheets/uidW1__2026_10_0')));
await prova('N18 VIEWER NON legge il foglio ore di un operatore non assegnato', 'negato',
  () => getDoc(doc(VIEW(), 'timesheets/uidW2__2026_10_0')));
await prova('N19 VIEWER legge il documento utente di un operatore assegnato', 'permesso',
  () => getDoc(doc(VIEW(), 'users/uidW1')));
await prova('N20 VIEWER non scrive sui fogli ore', 'negato',
  () => setDoc(doc(VIEW(), 'timesheets/uidW1__2026_10_0'), { days:{} }, { merge:true }));
await prova('N21 EDITOR legge il foglio ore di un operatore assegnato', 'permesso',
  () => getDoc(doc(ED(), 'timesheets/uidW1__2026_10_0')));
await prova('N22 EDITOR legge il PROPRIO foglio light', 'permesso',
  () => getDoc(doc(ED(), 'lightsheets/L1')));
await prova('N23 EDITOR crea un PROPRIO foglio light', 'permesso',
  () => setDoc(doc(ED(), 'lightsheets/L2'), { editorUid:'uidED', nome:'AZZURRI TEO' }));
await prova('N24 EDITOR aggiorna il PROPRIO foglio light', 'permesso',
  () => setDoc(doc(ED(), 'lightsheets/L1'), { nome:'MARRONI IDA' }, { merge:true }));
await prova('N25 ADMIN legge il foglio light di un editor', 'permesso',
  () => getDoc(doc(ADMIN(), 'lightsheets/L1')));
await prova('N26 VIEWER legge il foglio light di un editor assegnato', 'permesso',
  () => getDoc(doc(VIEW(), 'lightsheets/L1')));
await prova('N27 operatore NON modifica il foglio light di un editor', 'negato',
  () => setDoc(doc(W1(), 'lightsheets/L1'), { nome:'MANOMESSO' }, { merge:true }));

await env.cleanup();

console.log('\n===== REGOLE PROVATE: ' + RULES + ' =====');
righe.forEach(r => console.log(r));
console.log(`\nTOTALE: ${ok} coerenti con l'atteso, ${ko} NON coerenti`);
process.exit(0);
