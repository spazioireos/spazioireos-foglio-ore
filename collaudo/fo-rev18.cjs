// fo-rev18 — le cinque correzioni della rev 18 di Fogli ore, con il CONFRONTO DIRETTO sulla rev 17
// congelata e la non regressione. SOLO DATI INVENTATI (repository pubblico).
//   PORTA=8341 node collaudo/fo-rev18.cjs
// La rev 17 congelata va servita dal banco comune in /fo17/index.html (localizzata con localizza.py).
//   1 «Esci» subito dopo aver scritto      2 nomi con apostrofo / virgolette / barra rovescia
//   3 «N° servizio salvato!» con la scrittura caduta      4 orari impossibili
//   5 due dispositivi sullo stesso foglio
const H = require('./fo-a00-comune.cjs');
const { c } = H;
const U17 = H.BASE + 'fo17/index.html', U18 = H.URL;
const ADM = H.u('ADMIN0001', H.ADMIN, 'admin', 'AMMINISTRAZIONE', 'PROVA');
const W1 = H.u('WRK00001', 'rossi.prova@esempio.it', 'worker', 'ROSSI', 'MARIO');
const WA = H.u('WRK00002', 'damico.prova@esempio.it', 'worker', "D'AMICO", 'LUCIA');
const WQ = H.u('WRK00003', 'virgolette.prova@esempio.it', 'worker', 'VERDI', '"GIGI" LUCA');
const WB = H.u('WRK00004', 'barra.prova@esempio.it', 'worker', 'NERI\\', 'ANNA');
const WN = H.u('WRK00005', 'nuovo.prova@esempio.it', 'worker', 'NUOVI', 'NINO');
const uid = W1.auth.uid, K10 = 'timesheets/' + uid + '__2026_10_0', K10b = 'timesheets/' + uid + '__2026_10_1';
function semeBase(id) {
  const d0 = { 1: { t1f: '900', t1t: '1300' }, 2: { t1f: '14.30', t1t: '18.30' }, 5: { t1f: '14h30', t1t: '18h30' }, 6: { t1f: '9', t1t: '13' }, 7: { t1f: '130', t1t: '530' }, 9: { t1f: 'abc', t1t: '12:00' }, 20: { t1f: '09:00', t1t: '13:00' } };
  const d1 = { 3: { t1f: '15:00', t1t: '16:00' } };
  const docs = Object.assign({}, H.ts(uid, 2026, 10, 0, d0, { workerName: 'ROSSI MARIO' }),
    H.ts(uid, 2026, 10, 1, d1, { workerName: 'ROSSI MARIO', mansione: 'Insegnante/Istruttore', sede: 'Casa di quartiere', dettagli: 'PIAZZA FINTA 2' }));
  return H.seme(id, [ADM, W1, WA, WQ, WB, WN], docs);
}
const cellaDi = p => (d, f) => p.locator('.tbl tbody tr').nth(d - 1).locator('input[data-fld=' + f + ']');
const footDi = p => async () => p.evaluate(() => { const f = document.querySelectorAll('.tbl tfoot tr td'); return f.length ? f[f.length - 1].textContent.trim() : ''; });
const vers = u => (u === U17 ? 'rev17' : 'rev18');

// ---------------------------------------------------------------- 1. «Esci»
async function prova1(browser, url) {
  const r = {};
  let t = await H.apri(browser, semeBase('r18-1-' + vers(url)), { url });
  let p = t.page; const cella = cellaDi(p);
  await H.entra(t, W1.auth.email); await H.apriFoglio(t, 2026, 10, 0);
  await cella(12, 't1f').fill('08:00'); await cella(12, 't1t').fill('11:00');
  await p.click('.topbar button:has-text("Esci")'); await p.waitForTimeout(1500);
  let db = await H.dump(t);
  r.dato = JSON.stringify((db[K10].days || {})[12] || null);
  r.login = await p.isVisible('#app-login');
  r.errori = t.errori.length; r.erroriTxt = t.errori.join('|').slice(0, 90);
  // linea caduta: «Esci» chiede, ANNULLA resta dentro
  await H.entra(t, W1.auth.email); await H.apriFoglio(t, 2026, 10, 0);
  await p.evaluate(() => { __fakefb.failWrites = true; });
  await cella(14, 't1f').fill('08:00'); await cella(14, 't1t').fill('10:00');
  t.dialoghi.length = 0; t.risposte.push(false);
  await p.click('.topbar button:has-text("Esci")'); await p.waitForTimeout(1500);
  r.domanda = (t.dialoghi.find(d => d.tipo === 'confirm') || {}).msg || '';
  r.restaDentro = await p.isVisible('#app-main');
  r.bandaOre = await p.evaluate(() => { const b = document.getElementById('banda-salv'); return !!b && getComputedStyle(b).display !== 'none'; });
  // torna la linea: «Esci» scrive e esce senza domande
  await p.evaluate(() => { __fakefb.failWrites = false; });
  t.dialoghi.length = 0;
  if (r.restaDentro) { await p.click('.topbar button:has-text("Esci")'); await p.waitForTimeout(1500); }
  db = await H.dump(t);
  r.datoDopo = JSON.stringify((db[K10].days || {})[14] || null);
  r.domandeDopo = t.dialoghi.filter(d => d.tipo === 'confirm').length;
  r.login2 = await p.isVisible('#app-login');
  // linea caduta, rispondo OK: esce, banda spenta
  await H.entra(t, W1.auth.email); await H.apriFoglio(t, 2026, 10, 0);
  await p.evaluate(() => { __fakefb.failWrites = true; });
  await cella(15, 't1f').fill('08:00'); await cella(15, 't1t').fill('10:00');
  t.dialoghi.length = 0; t.risposte.push(true);
  await p.click('.topbar button:has-text("Esci")'); await p.waitForTimeout(1500);
  r.escitoOK = await p.isVisible('#app-login');
  r.bandaDopoOK = await p.evaluate(() => { const b = document.getElementById('banda-salv'); return !!b && getComputedStyle(b).display !== 'none'; });
  await p.evaluate(() => { __fakefb.failWrites = false; });
  // niente in sospeso: nessuna domanda, nessuna scrittura
  await H.entra(t, W1.auth.email); await H.apriFoglio(t, 2026, 10, 0); await p.waitForTimeout(800);
  const n0 = (await H.scritture(t)).length; t.dialoghi.length = 0;
  await p.click('.topbar button:has-text("Esci")'); await p.waitForTimeout(1000);
  r.scrittureSenzaModifiche = (await H.scritture(t)).length - n0; r.domandeSenzaModifiche = t.dialoghi.length;
  r.login3 = await p.isVisible('#app-login');
  // doppio clic su «Esci» con un dato in sospeso: una sola scrittura del foglio, esce
  await H.entra(t, W1.auth.email); await H.apriFoglio(t, 2026, 10, 0);
  await cella(16, 't1f').fill('08:00'); await cella(16, 't1t').fill('09:00');
  const n1 = (await H.scritture(t)).filter(x => x.path === K10).length;
  await p.dblclick('.topbar button:has-text("Esci")'); await p.waitForTimeout(1500);
  r.doppioClic = ((await H.scritture(t)).filter(x => x.path === K10).length - n1) + ' scritture, login=' + await p.isVisible('#app-login');
  // scrittura che resta in attesa (Firestore vero con la linea caduta): dopo 8 s chiede, non resta muto
  if (url === U18) {
    await H.entra(t, W1.auth.email); await H.apriFoglio(t, 2026, 10, 0);
    await p.evaluate(() => { __fakefb.writeDelayMs = 14000; });
    await cella(17, 't1f').fill('08:00'); await cella(17, 't1t').fill('09:00');
    t.dialoghi.length = 0; t.risposte.push(false);
    const t0 = Date.now();
    await p.click('.topbar button:has-text("Esci")');
    await p.waitForEvent('dialog', { timeout: 15000 }).catch(() => {});
    r.attesaSecondi = Math.round((Date.now() - t0) / 1000);
    await p.waitForTimeout(300);
    r.attesaDomanda = /ORE NON SALVATE/.test((t.dialoghi.find(d => d.tipo === 'confirm') || {}).msg || '');
    r.attesaDentro = await p.isVisible('#app-main');
    await p.waitForTimeout(7000);     // la scrittura arriva
    await p.evaluate(() => { __fakefb.writeDelayMs = 0; });
    const dbx = await H.dump(t);
    r.attesaArrivata = JSON.stringify((dbx[K10].days || {})[17] || null);
    t.dialoghi.length = 0;
    await p.click('.topbar button:has-text("Esci")'); await p.waitForTimeout(1200);
    r.attesaPoiEsce = t.dialoghi.length + ' domande, login=' + await p.isVisible('#app-login');
  }
  r.erroriFine = t.errori.length;
  await H.fine(t);
  // l'admin esce come prima
  t = await H.apri(browser, semeBase('r18-1b-' + vers(url)), { url }); p = t.page;
  await H.entra(t, H.ADMIN); await p.waitForTimeout(500);
  await p.click('.topbar button:has-text("Esci")'); await p.waitForTimeout(800);
  r.adminEsce = await p.isVisible('#app-login'); r.adminErr = t.errori.length;
  await H.fine(t);
  return r;
}

// ---------------------------------------------------------------- 2. nomi con apostrofo & C.
async function prova2(browser, url) {
  const r = { schede: {} };
  const t = await H.apri(browser, semeBase('r18-2-' + vers(url)), { url }); const p = t.page;
  await H.entra(t, H.ADMIN); await p.waitForTimeout(800);
  // tutti i gestori on* della pagina devono essere JS valido
  const compila = async () => p.evaluate(() => { let n = 0, ko = []; document.querySelectorAll('*').forEach(el => { for (const a of el.attributes) { if (/^on/.test(a.name)) { n++; try { new Function(a.value); } catch (e) { ko.push(a.value.slice(0, 80)); } } } }); return { n, ko }; });
  r.lista = await compila();
  for (const W of [WA, WQ, WB]) {
    const nome = W.doc.name;
    const nErr = t.errori.length;
    await p.evaluate(() => { as.view = 'list'; renderAdmin(); }); await p.waitForTimeout(500);
    const card = p.locator('.wk-card').filter({ hasText: W.doc.cognome.replace('\\', '') });
    if (await card.count() === 0) { r.schede[nome] = 'scheda non trovata'; continue; }
    await card.first().click(); await p.waitForTimeout(900);
    const h1 = (await p.textContent('.topbar h1').catch(() => '')) || '';
    const det = /Dettaglio operatore/.test(await H.testo(t, '.topbar'));
    const asName = await p.evaluate(() => as.name);
    const gest = await compila();
    r.schede[nome] = { h1, det, asNameUguale: asName === nome, erroriNuovi: t.errori.length - nErr, gestoriKO: gest.ko.length };
  }
  // «Correggi nome»: il nome proposto contiene l'apostrofo (prima veniva TOLTO: «DAMICO»)
  await p.evaluate(() => { as.view = 'list'; renderAdmin(); }); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__prompts = []; window.prompt = function (m, d) { window.__prompts.push(d); return null; }; });
  const btn = p.locator('.wk-card').filter({ hasText: "D'AMICO" }).locator('[onclick^="renameWorker"]');
  if (await btn.count()) { await btn.first().click({ force: true }); await p.waitForTimeout(300); }
  r.promptCognome = await p.evaluate(() => (window.__prompts || [])[0]);
  r.errori = t.errori.length; r.erroriTxt = t.errori.join('|').slice(0, 100);
  await H.fine(t);
  return r;
}

// ---------------------------------------------------------------- 3. «N° servizio salvato!»
async function prova3(browser, url) {
  const r = {};
  const t = await H.apri(browser, semeBase('r18-3-' + vers(url)), { url }); const p = t.page;
  await H.entra(t, WN.auth.email);
  const y = new Date().getFullYear(), m = new Date().getMonth() + 1, kN = 'timesheets/' + WN.auth.uid + '__' + y + '_' + m + '_0';
  await p.evaluate(() => { ws.view = 'servizi'; ws.addingService = false; return renderWorker(); }); await p.waitForTimeout(700);
  await p.click('button:has-text("➕ AGGIUNGI UN SERVIZIO")'); await p.waitForTimeout(600);
  await p.selectOption('#ms-mans-0', 'Educatore/Assistente'); await p.selectOption('#ms-sede-0', 'Scuola'); await p.fill('#ms-det-0', 'VIA DELLE PROVE 3');
  await p.evaluate(() => { __fakefb.failWrites = true; });
  t.dialoghi.length = 0;
  await p.click('button:has-text("💾 Salva servizio")'); await p.waitForTimeout(1200);
  let db = await H.dump(t);
  r.avvisoCaduta = (t.dialoghi[0] || {}).msg || '';
  r.dbCaduta = !!db[kN];
  r.moduloAperto = await p.locator('#ms-mans-0').count() > 0;
  r.bandaOre = await p.evaluate(() => { const b = document.getElementById('banda-salv'); return !!b && getComputedStyle(b).display !== 'none'; });
  r.cacheConfigurata = await p.evaluate(k => !!(cache[k] && cache[k].mansione), kN.replace('timesheets/', ''));
  await p.evaluate(() => { __fakefb.failWrites = false; });
  t.dialoghi.length = 0;
  if (r.moduloAperto) { await p.click('button:has-text("💾 Salva servizio")'); await p.waitForTimeout(1200); }
  db = await H.dump(t);
  r.avvisoBuono = (t.dialoghi[0] || {}).msg || '';
  r.dbBuono = !!(db[kN] && db[kN].mansione === 'Educatore/Assistente');
  r.errori = t.errori.length;
  await H.fine(t);
  return r;
}

// ---------------------------------------------------------------- 4. orari
async function prova4(browser, url) {
  const r = { casi: [] };
  const t = await H.apri(browser, semeBase('r18-4-' + vers(url)), { url }); const p = t.page;
  const cella = cellaDi(p), foot = footDi(p);
  await H.entra(t, W1.auth.email); await H.apriFoglio(t, 2026, 10, 0);
  r.storici = await foot();       // 900/14.30/14h30/9/130 + 09-13 del 20 (+ «abc» del 9 che non conta)
  const casi = [
    { d: 8, f: '20:00', tt: '25:00', atteso: '' },
    { d: 8, f: '09:00', tt: '9:75', atteso: '' },
    { d: 10, f: 'abc', tt: '12:00', campo: 't1f', atteso: '' },
    { d: 20, tt: '24:00', atteso: '13:00' },          // dato che c'era: torna com'era
  ];
  for (const k of casi) {
    const prima = await foot(); t.dialoghi.length = 0;
    if (k.f !== undefined) await cella(k.d, 't1f').fill(k.f);
    await cella(k.d, 't1t').fill(k.tt); await cella(k.d, 't1t').press('Tab'); await p.waitForTimeout(1000);
    const campo = k.campo || 't1t';
    const vis = await cella(k.d, campo).inputValue();
    const db = await H.dump(t); const e = (db[K10].days || {})[k.d] || {};
    r.casi.push({ scritto: (k.f !== undefined ? k.f + '→' : '') + k.tt, prima, dopo: await foot(), avviso: ((t.dialoghi[0] || {}).msg || '').split('\n')[0], vis, db: e[campo] === undefined ? '(assente)' : e[campo], atteso: k.atteso });
    // ripulisco la riga (non quella del 20)
    if (k.d !== 20) { t.dialoghi.length = 0; await cella(k.d, 't1f').fill(''); await cella(k.d, 't1t').fill(''); await cella(k.d, 't1t').press('Tab'); await p.waitForTimeout(900); }
  }
  // formati storici scritti A MANO: accettati, nessun avviso
  t.dialoghi.length = 0;
  const totPrimaBuoni = await foot();
  const buoni = [[21, '900', '1300'], [22, '14.30', '18.30'], [23, '14h30', '18h30'], [24, '9', '13'], [26, '130', '530'], [27, '0800', '0930']];
  for (const [d, a, b] of buoni) { await cella(d, 't1f').fill(a); await cella(d, 't1t').fill(b); await cella(d, 't1t').press('Tab'); await p.waitForTimeout(250); }
  await p.waitForTimeout(1000);
  r.buoniAvvisi = t.dialoghi.length; r.buoniTot = (await foot()) + ' (era ' + totPrimaBuoni + ', +' + (parseFloat((await foot()).replace(',', '.')) - parseFloat(totPrimaBuoni.replace(',', '.'))).toFixed(2) + ')';
  const db = await H.dump(t); r.buoniDB = buoni.map(([d]) => { const e = (db[K10].days || {})[d] || {}; return (e.t1f || '') + '-' + (e.t1t || ''); }).join(' ');
  // dato storico strano già nel DB («abc» del 9): passarci sopra senza scrivere non avvisa e non lo tocca
  t.dialoghi.length = 0;
  await cella(9, 't1f').focus(); await cella(9, 't1t').focus(); await cella(9, 't1t').press('Tab'); await p.waitForTimeout(900);
  const db9 = await H.dump(t);
  r.storicoIntatto = t.dialoghi.length + ' avvisi, DB=' + JSON.stringify((db9[K10].days || {})[9]);
  // foglio unico: stessa regola
  await p.evaluate(() => { ws.year = 2026; ws.month = 10; ws.view = 'unico'; return renderWorker(); }); await p.waitForTimeout(1500);
  t.dialoghi.length = 0;
  const cu = p.locator('.tbl tbody tr input[data-fld=t1t]').first();
  const valPrima = await cu.inputValue();
  await cu.fill('26:00'); await cu.press('Tab'); await p.waitForTimeout(1200);
  r.unico = { avviso: ((t.dialoghi[0] || {}).msg || '').split('\n')[0], prima: valPrima, dopo: await cu.inputValue() };
  r.errori = t.errori.length;
  await H.fine(t);
  return r;
}

// ---------------------------------------------------------------- 5. due dispositivi
async function prova5(browser, url) {
  const r = {};
  const t = await H.apri(browser, semeBase('r18-5-' + vers(url)), { url }); const pA = t.page;
  await H.entra(t, W1.auth.email); await H.apriFoglio(t, 2026, 10, 0);
  // secondo «dispositivo»: un'altra scheda dello stesso contesto, con la sua cache
  const pB = await t.ctx.newPage(); const errB = []; pB.on('pageerror', e => errB.push(e.message));
  pB.on('dialog', d => d.accept());
  await pB.goto(url); await pB.waitForSelector('#app-main:not(.hide)', { timeout: 15000 }); await pB.waitForTimeout(500);
  await pB.evaluate(() => { ws.year = 2026; ws.month = 10; ws.si = 0; ws.view = 'foglio'; return renderWorker(); }); await pB.waitForSelector('.tbl tbody tr');
  await pB.waitForTimeout(400);
  const cA = cellaDi(pA), cB = cellaDi(pB);
  await cA(3, 't1f').fill('08:00'); await cA(3, 't1t').fill('10:00'); await cA(3, 't1t').press('Tab'); await pA.waitForTimeout(1000);
  await cB(4, 't1f').fill('15:00'); await cB(4, 't1t').fill('17:00'); await cB(4, 't1t').press('Tab'); await pB.waitForTimeout(1000);
  let db = await H.dump(t); let dd = db[K10].days || {};
  r.giorno3A = JSON.stringify(dd[3] || null); r.giorno4B = JSON.stringify(dd[4] || null);
  r.storicoIntatto = JSON.stringify(dd[1]) + ' ' + JSON.stringify(dd[20]);
  // B (cache vecchia) preme 💾: il giorno 3 di A non deve sparire
  await pB.click('#btn-save'); await pB.waitForTimeout(1000);
  db = await H.dump(t); dd = db[K10].days || {};
  r.dopoSalvaB = JSON.stringify(dd[3] || null);
  // svuotare una casella funziona ancora
  await cA(3, 't1t').fill(''); await cA(3, 't1t').press('Tab'); await pA.waitForTimeout(1000);
  db = await H.dump(t); r.svuotata = JSON.stringify((db[K10].days || {})[3] || null);
  // permesso tolto: sparisce dal DB
  await pA.evaluate(() => onPerm(6, '2h')); await pA.waitForTimeout(800);
  db = await H.dump(t); r.permMesso = ((db[K10].days || {})[6] || {}).perm || '';
  await pA.evaluate(() => onPerm(6, '')); await pA.waitForTimeout(800);
  db = await H.dump(t); r.permTolto = JSON.stringify(((db[K10].days || {})[6] || {}).perm);
  // assenza su un giorno con ore: le ore spariscono dal DB; tolta l'assenza: sparisce da TUTTI i servizi
  await pA.evaluate(() => preloadAllTS(CU.uid)); await pA.waitForTimeout(500);
  await H.apriFoglio(t, 2026, 10, 0);
  t.risposte.push(true);
  await pA.locator('.tbl tbody tr').nth(19).locator('select[onchange^="onAbs"]').selectOption('FERIE'); await pA.waitForTimeout(1200);
  db = await H.dump(t);
  r.assenzaMessa = JSON.stringify((db[K10].days || {})[20] || null) + ' | ' + JSON.stringify((db[K10b].days || {})[20] || null);
  await pA.locator('.tbl tbody tr').nth(19).locator('select[onchange^="onAbs"]').selectOption(''); await pA.waitForTimeout(1200);
  db = await H.dump(t);
  r.assenzaTolta = JSON.stringify((db[K10].days || {})[20] || null) + ' | ' + JSON.stringify((db[K10b].days || {})[20] || null);
  // scrittura caduta e poi ripresa: anche il giorno perso arriva
  await H.apriFoglio(t, 2026, 10, 0);
  await pA.evaluate(() => { __fakefb.failWrites = true; });
  await cA(7, 't2f').fill('08:00'); await cA(7, 't2t').fill('09:00'); await cA(7, 't2t').press('Tab'); await pA.waitForTimeout(1000);
  await pA.evaluate(() => { __fakefb.failWrites = false; });
  await cA(11, 't1f').fill('10:00'); await cA(11, 't1t').fill('11:00'); await cA(11, 't1t').press('Tab'); await pA.waitForTimeout(1000);
  db = await H.dump(t); dd = db[K10].days || {};
  r.ripresa = JSON.stringify(dd[7] || null) + ' + ' + JSON.stringify(dd[11] || null);
  r.bandaDopoRipresa = await pA.evaluate(() => { const b = document.getElementById('banda-salv'); return !!b && getComputedStyle(b).display !== 'none'; });
  // mese nuovo (il documento non c'è): nasce intero, come prima
  await H.apriFoglio(t, 2026, 12, 0).catch(() => {});
  await pA.waitForTimeout(800);
  db = await H.dump(t); const K12 = 'timesheets/' + uid + '__2026_12_0';
  r.meseNuovo = db[K12] ? (db[K12].mansione + ' days=' + JSON.stringify(db[K12].days)) : 'assente';
  if (await pA.locator('.tbl tbody tr').count()) {
    await cA(2, 't1f').fill('09:00'); await cA(2, 't1t').fill('10:00'); await cA(2, 't1t').press('Tab'); await pA.waitForTimeout(1000);
    db = await H.dump(t); r.meseNuovoGiorno = JSON.stringify(((db[K12] || {}).days || {})[2] || null);
  }
  r.errori = t.errori.length + errB.length; r.erroriTxt = t.errori.concat(errB).join('|').slice(0, 120);
  await H.fine(t);
  return r;
}

(async () => {
  const browser = await H.chromium.launch();
  const R = {};
  for (const url of [U17, U18]) {
    const v = vers(url); R[v] = {};
    R[v].p1 = await prova1(browser, url); console.log(v, 'p1', JSON.stringify(R[v].p1));
    R[v].p2 = await prova2(browser, url); console.log(v, 'p2', JSON.stringify(R[v].p2));
    R[v].p3 = await prova3(browser, url); console.log(v, 'p3', JSON.stringify(R[v].p3));
    R[v].p4 = await prova4(browser, url); console.log(v, 'p4', JSON.stringify(R[v].p4));
    R[v].p5 = await prova5(browser, url); console.log(v, 'p5', JSON.stringify(R[v].p5));
  }
  const a = R.rev17, b = R.rev18;
  // 1
  c('R1a', '«Esci» entro 600 ms: rev 17 perde l\'ultima modifica', 'rev17: dato assente nel DB', a.p1.dato + ' errori=' + a.p1.errori, a.p1.dato === 'null');
  c('R1b', '«Esci» entro 600 ms: rev 18 la scrive prima di uscire', 'rev18: 08:00-11:00 nel DB, esce, 0 errori', b.p1.dato + ' login=' + b.p1.login + ' errori=' + b.p1.errori, /08:00/.test(b.p1.dato) && /11:00/.test(b.p1.dato) && b.p1.login && b.p1.errori === 0);
  c('R1c', '«Esci» con la linea caduta: chiede', 'domanda «ORE NON SALVATE … Vuoi uscire lo stesso?»', b.p1.domanda.split('\n')[0], /ORE NON SALVATE/.test(b.p1.domanda) && /Vuoi uscire lo stesso\?/.test(b.p1.domanda));
  c('R1d', '«Esci» con la linea caduta, ANNULLA: resta dentro con la banda rossa', 'dentro, banda accesa', 'dentro=' + b.p1.restaDentro + ' banda=' + b.p1.bandaOre, b.p1.restaDentro && b.p1.bandaOre);
  c('R1e', 'tornata la linea, «Esci» scrive il giorno rimasto in sospeso ed esce senza domande', 'giorno 14 nel DB, 0 domande, login', b.p1.datoDopo + ' domande=' + b.p1.domandeDopo + ' login=' + b.p1.login2, /10:00/.test(b.p1.datoDopo) && b.p1.domandeDopo === 0 && b.p1.login2);
  c('R1f', '«Esci» con la linea caduta, OK: esce e la banda si spegne', 'login, banda spenta', 'login=' + b.p1.escitoOK + ' banda=' + b.p1.bandaDopoOK, b.p1.escitoOK && !b.p1.bandaDopoOK);
  c('R1g', 'non regressione: «Esci» senza modifiche non scrive e non chiede', '0 scritture, 0 dialoghi, login', b.p1.scrittureSenzaModifiche + '/' + b.p1.domandeSenzaModifiche + ' login=' + b.p1.login3, b.p1.scrittureSenzaModifiche === 0 && b.p1.domandeSenzaModifiche === 0 && b.p1.login3);
  c('R1i', 'doppio clic su «Esci» con un dato in sospeso', 'una sola scrittura, esce', b.p1.doppioClic, /^1 scritture, login=true$/.test(b.p1.doppioClic));
  c('R1j', 'scrittura che resta in attesa: dopo ~8 s «Esci» chiede invece di restare muto', 'domanda dopo 8-10 s, ANNULLA resta dentro', 'dopo ' + b.p1.attesaSecondi + ' s domanda=' + b.p1.attesaDomanda + ' dentro=' + b.p1.attesaDentro, b.p1.attesaDomanda && b.p1.attesaDentro && b.p1.attesaSecondi >= 7 && b.p1.attesaSecondi <= 11);
  c('R1k', 'quando la scrittura in attesa arriva, «Esci» esce senza domande', 'giorno 17 nel DB, 0 domande', b.p1.attesaArrivata + ' · ' + b.p1.attesaPoiEsce, /08:00/.test(b.p1.attesaArrivata) && /^0 domande, login=true$/.test(b.p1.attesaPoiEsce));
  c('R1h','non regressione: l\'admin esce come prima; nessun errore di pagina', 'login, 0 errori', 'admin=' + b.p1.adminEsce + ' err=' + b.p1.adminErr + ' erroriFine=' + b.p1.erroriFine, b.p1.adminEsce && b.p1.adminErr === 0 && b.p1.erroriFine === 0);
  // 2
  const sA = a.p2.schede["D'AMICO LUCIA"] || {}, sB = b.p2.schede["D'AMICO LUCIA"] || {};
  c('R2a', 'rev 17: la scheda di D\'AMICO non si apre', 'errore «Unexpected identifier»', JSON.stringify(sA) + ' ' + a.p2.erroriTxt, !sA.det && /Unexpected identifier/.test(a.p2.erroriTxt));
  for (const W of [WA, WQ, WB]) {
    const s = b.p2.schede[W.doc.name] || {};
    c('R2-' + W.doc.cognome.replace(/\W/g, ''), 'rev 18: scheda di «' + W.doc.name + '»', 'si apre, as.name identico, 0 errori, 0 gestori rotti', JSON.stringify(s), s.det && s.asNameUguale && s.erroriNuovi === 0 && s.gestoriKO === 0);
  }
  c('R2b', 'tutti i gestori on* dell\'elenco operatori sono JavaScript valido', 'rev17 ne ha di rotti, rev18 zero', 'rev17 KO=' + a.p2.lista.ko.length + '/' + a.p2.lista.n + ' · rev18 KO=' + b.p2.lista.ko.length + '/' + b.p2.lista.n, a.p2.lista.ko.length > 0 && b.p2.lista.ko.length === 0);
  c('R2c', '«Correggi nome» propone il cognome CON l\'apostrofo', "rev17 DAMICO · rev18 D'AMICO", 'rev17=' + a.p2.promptCognome + ' rev18=' + b.p2.promptCognome, a.p2.promptCognome === 'DAMICO' && b.p2.promptCognome === "D'AMICO");
  c('R2d', 'nessun errore di pagina nell\'admin (rev 18)', '0', b.p2.errori + ' ' + b.p2.erroriTxt, b.p2.errori === 0);
  // 3
  c('R3a', 'rev 17: «salvato!» con la scrittura caduta', 'avviso «salvato!» ma niente nel DB', a.p3.avvisoCaduta + ' DB=' + a.p3.dbCaduta, /salvato!/.test(a.p3.avvisoCaduta) && !a.p3.dbCaduta);
  c('R3b', 'rev 18: con la scrittura caduta dice NON salvato', '«1° servizio NON salvato. Non c\'è collegamento: riprova quando torna la linea.»', b.p3.avvisoCaduta, /NON salvato\. Non c'è collegamento: riprova quando torna la linea\./.test(b.p3.avvisoCaduta) && !/salvato!/.test(b.p3.avvisoCaduta));
  c('R3c', 'rev 18: niente nel DB, la pagina non lo crede configurato, modulo aperto, nessuna banda ORE', 'DB=false cache=false modulo=true banda=false', 'DB=' + b.p3.dbCaduta + ' cache=' + b.p3.cacheConfigurata + ' modulo=' + b.p3.moduloAperto + ' banda=' + b.p3.bandaOre, !b.p3.dbCaduta && !b.p3.cacheConfigurata && b.p3.moduloAperto && !b.p3.bandaOre);
  c('R3d', 'tornata la linea: «salvato!» e il servizio è nel DB (non regressione)', 'salvato! + DB', b.p3.avvisoBuono + ' DB=' + b.p3.dbBuono + ' errori=' + b.p3.errori, /salvato!/.test(b.p3.avvisoBuono) && b.p3.dbBuono && b.p3.errori === 0);
  // 4
  c('R4a', 'formati storici nel DB: totale come prima', 'rev17 = rev18 = 24,00 (20,00 storici + 09-13)', 'rev17=' + a.p4.storici + ' rev18=' + b.p4.storici, a.p4.storici === b.p4.storici && b.p4.storici === '24,00');
  a.p4.casi.forEach((k, i) => {
    const n = b.p4.casi[i];
    c('R4-' + (i + 1), 'orario «' + k.scritto + '»', 'rev17 accettato; rev18 avviso, casella e DB «' + (n.atteso || 'vuota') + '», totale invariato',
      'rev17: tot ' + k.prima + '→' + k.dopo + ' DB=' + k.db + ' · rev18: tot ' + n.prima + '→' + n.dopo + ' vis=' + n.vis + ' DB=' + n.db + ' avviso=' + n.avviso.slice(0, 60),
      /non è un orario valido/.test(n.avviso) && n.vis === n.atteso && (n.db === n.atteso || (n.atteso === '' && n.db === '(assente)')) && n.prima === n.dopo);
  });
  c('R4b', 'formati storici scritti a mano (900, 14.30, 14h30, 9, 130, 0800): accettati', '0 avvisi, +21,50 ore (4+4+4+4+4+1,5) come la rev 17, stessi valori nel DB', 'rev17 ' + a.p4.buoniTot + ' [' + a.p4.buoniDB + '] · rev18 ' + b.p4.buoniTot + ' avvisi=' + b.p4.buoniAvvisi + ' [' + b.p4.buoniDB + ']', b.p4.buoniAvvisi === 0 && a.p4.buoniTot.split('+')[1] === b.p4.buoniTot.split('+')[1] && /\+21\.50\)$/.test(b.p4.buoniTot) && a.p4.buoniDB === b.p4.buoniDB);
  c('R4c', 'dato strano GIÀ nel DB («abc»): passarci sopra non avvisa e non lo tocca', '0 avvisi, abc', b.p4.storicoIntatto, /^0 avvisi/.test(b.p4.storicoIntatto) && /"abc"/.test(b.p4.storicoIntatto));
  c('R4d', 'foglio unico: 26:00 rifiutato, casella com\'era', 'avviso + valore di prima', JSON.stringify(b.p4.unico), /non è un orario valido/.test(b.p4.unico.avviso) && b.p4.unico.dopo === b.p4.unico.prima);
  c('R4e', 'nessun errore di pagina (orari)', '0', b.p4.errori, b.p4.errori === 0);
  // 5
  c('R5a', 'rev 17: due dispositivi, chi salva per ultimo cancella il giorno dell\'altro', 'giorno 3 di A sparito', 'rev17 giorno3=' + a.p5.giorno3A + ' dopo💾B=' + a.p5.dopoSalvaB, a.p5.giorno3A === 'null' || a.p5.dopoSalvaB === 'null');
  c('R5b', 'rev 18: i giorni di A e di B restano tutti e due, anche dopo il 💾 di B', 'giorno 3 e 4 nel DB', 'g3=' + b.p5.giorno3A + ' g4=' + b.p5.giorno4B + ' dopo💾B g3=' + b.p5.dopoSalvaB, /08:00/.test(b.p5.giorno3A) && /15:00/.test(b.p5.giorno4B) && /08:00/.test(b.p5.dopoSalvaB));
  c('R5c', 'i giorni non toccati restano come erano (storici compresi)', 'giorno 1 «900-1300», giorno 20 09-13', b.p5.storicoIntatto, /"900"/.test(b.p5.storicoIntatto) && /09:00/.test(b.p5.storicoIntatto));
  c('R5d', 'svuotare una casella arriva nel DB', 't1t vuoto', b.p5.svuotata, /"t1t":""/.test(b.p5.svuotata));
  c('R5e', 'togliere un permesso arriva nel DB', '2h, poi ""', b.p5.permMesso + ' → ' + b.p5.permTolto, b.p5.permMesso === '2h' && b.p5.permTolto === '""');
  c('R5f', 'assenza su un giorno con ore: nel DB le ore spariscono (rev17 le lasciava sotto l\'assenza)', '{"absence":"FERIE"} su tutti e due i servizi', 'rev17 ' + a.p5.assenzaMessa + ' · rev18 ' + b.p5.assenzaMessa, b.p5.assenzaMessa === '{"absence":"FERIE"} | {"absence":"FERIE"}');
  c('R5g', 'togliere l\'assenza la toglie dal DB su tutti i servizi (rev17 no: merge)', 'nessuna absence', 'rev17 ' + a.p5.assenzaTolta + ' · rev18 ' + b.p5.assenzaTolta, !/absence/.test(b.p5.assenzaTolta) && /absence/.test(a.p5.assenzaTolta));
  c('R5h', 'scrittura caduta e poi ripresa: anche il giorno perso arriva', 'giorno 7 (t2f 08:00) e giorno 11 nel DB, banda spenta', b.p5.ripresa + ' banda=' + b.p5.bandaDopoRipresa, /"t2f":"08:00"/.test(b.p5.ripresa) && /10:00/.test(b.p5.ripresa) && !b.p5.bandaDopoRipresa);
  c('R5i', 'mese nuovo: il documento nasce intero come prima, e poi accetta i giorni', 'mansione copiata, giorno 2 nel DB', b.p5.meseNuovo + ' · ' + b.p5.meseNuovoGiorno + ' (rev17: ' + a.p5.meseNuovo + ')', /Educatore/.test(b.p5.meseNuovo) && /09:00/.test(b.p5.meseNuovoGiorno || ''));
  c('R5j', 'nessun errore di pagina (due dispositivi)', '0', b.p5.errori + ' ' + b.p5.erroriTxt, b.p5.errori === 0);
  require('fs').writeFileSync(require('path').join(H.OUT, 'fo-rev18-grezzo.json'), JSON.stringify(R, null, 1));
  await browser.close();
  H.riepilogo('fo-rev18');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(1); });
