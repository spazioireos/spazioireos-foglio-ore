// fo-rev19 — CHIUSURA OBBLIGATORIA DEL MESE (rev 19 di Fogli ore), con il CONFRONTO DIRETTO sulla
// rev 18 congelata e la non regressione. SOLO DATI INVENTATI (repository pubblico).
//   PORTA=8341 node collaudo/fo-rev19.cjs
// La rev 18 congelata va servita dal banco comune in /fo18/index.html (localizzata con localizza.py):
//   git show 352dc95:index.html > /tmp/fo18.html
//   python3 ../rendicontazione-usoint/collaudo/comune/localizza.py /tmp/fo18.html \
//           ../rendicontazione-usoint/collaudo/comune/.banco/fo18/index.html
// La data del dispositivo si simula con page.clock.setFixedTime (Playwright ≥ 1.45).
// Facoltativo: SCATTI=<cartella> salva le anteprime PNG del riquadro a 390 e 1280px.
const H = require('./fo-a00-comune.cjs');
const { c } = H;
const fs = require('fs'), path = require('path');
const U19 = process.env.FOURL ? H.BASE + process.env.FOURL : H.URL;
const U18 = H.BASE + 'fo18/index.html';
const SCATTI = process.env.SCATTI || '';
const P = H.P;

const ADM = H.u('ADMIN0001', H.ADMIN, 'admin', 'AMMINISTRAZIONE', 'PROVA');
const WE = H.u('WRK00001', 'esterno.prova@esempio.it', 'worker', 'ROSSI', 'MARIO');        // esterno
const WD = H.u('WRK00002', 'dipendente.prova@esempio.it', 'worker', 'BIANCHI', 'ANNA');   // dipendente
const WF = H.u('WRK00003', 'linea.prova@esempio.it', 'worker', 'VERDI', 'LUCA');          // linea caduta
const WV = H.u('VWR00001', 'viewer.prova@esempio.it', 'viewer', 'GUARDA', 'GINO');
const WED = H.u('EDT00001', 'editor.prova@esempio.it', 'editor', 'NERI', 'NINA');         // editor con dati
const WL = H.u('EDT00002', 'light.prova@esempio.it', 'editor', 'LUCE', 'LIA');            // editor senza fogli (solo light)
const WC = H.u('WRK00004', 'vuoto.prova@esempio.it', 'worker', 'VUOTI', 'VITO');          // fogli senza dati
const WO = H.u('WRK00005', 'ottobre.prova@esempio.it', 'worker', 'OTTO', 'OSCAR');        // dati solo a ottobre
const WA = H.u('WRK00006', 'autorizzato.prova@esempio.it', 'worker', 'AUTO', 'ADA');      // autorizzato servizio per servizio (rev 18)
const WAD = H.u('WRK00007', 'autodip.prova@esempio.it', 'worker', 'AUTO', 'DINO');        // dipendente autorizzato senza risposta
const TUTTI = [ADM, WE, WD, WF, WV, WED, WL, WC, WO, WA, WAD];

const D0 = () => ({ 3: { t1f: '09:00', t1t: '13:00' }, 4: { absence: 'FERIE' }, 5: { t1f: '14:00', t1t: '16:00', iF: '16:00', iT: '17:00', mot: 'Formazione' } });
const D1 = () => ({ 4: { absence: 'FERIE' }, 10: { t1f: '08:00', t1t: '10:30' } });
const SEC = { mansione: 'Insegnante/Istruttore', sede: 'Casa di quartiere', dettagli: 'PIAZZA FINTA 2' };
function fogli(w, y, m, extra0, extra1) {
  const uid = w.auth.uid, nome = w.doc.name;
  const a = H.ts(uid, y, m, 0, D0(), { workerName: nome }), b = H.ts(uid, y, m, 1, D1(), Object.assign({ workerName: nome }, SEC));
  Object.assign(a[Object.keys(a)[0]], extra0 || {}); Object.assign(b[Object.keys(b)[0]], extra1 || {});
  return Object.assign(a, b);
}
function semeBase(id, extraDocs) {
  const docs = Object.assign({},
    fogli(WE, 2026, 11), fogli(WD, 2026, 11), fogli(WF, 2026, 11), fogli(WED, 2026, 11),
    H.ts(WC.auth.uid, 2026, 11, 0, {}, { workerName: WC.doc.name }),
    fogli(WO, 2026, 10),
    fogli(WA, 2026, 11, { workerConfirmed: true, workerConfirmedAt: '2026-11-30T10:00:00.000Z' }, { workerConfirmed: true, workerConfirmedAt: '2026-11-30T10:00:00.000Z' }),
    fogli(WAD, 2026, 11, { workerConfirmed: true, workerConfirmedAt: '2026-11-30T10:00:00.000Z' }, { workerConfirmed: true, workerConfirmedAt: '2026-11-30T10:00:00.000Z' }),
    { ['residui/' + WD.auth.uid]: { dip: true }, ['residui/' + WAD.auth.uid]: { dip: true },
      ['users/' + WV.auth.uid]: Object.assign({}, WV.doc, { viewableWorkers: [WE.auth.uid] }),
      'lightsheets/LGT0001': { editorUid: WL.auth.uid, name: 'LUMI LINO', hours: { 2026: { 10: 4 } } } },
    extraDocs || {});
  return H.seme(id, TUTTI, docs);
}
const K = (w, y, m, si) => 'timesheets/' + w.auth.uid + '__' + y + '_' + m + '_' + si;
const DIC1 = new Date('2026-12-01T09:00:00');

async function apriC(browser, seed, opz) {
  opz = opz || {};
  const ctx = await browser.newContext({ viewport: opz.viewport || { width: 1280, height: 900 }, deviceScaleFactor: opz.dsf || 1, acceptDownloads: true });
  const esterni = [];
  await ctx.route('**/*', r => { const x = r.request().url(); if (x.startsWith(H.BASE) || x.startsWith('data:') || x.startsWith('blob:') || x === 'about:blank') return r.continue(); esterni.push(x); return r.abort(); });
  if (seed) await ctx.addInitScript(s => { window.__FAKEFB_SEED__ = s; }, seed);
  const page = await ctx.newPage();
  await page.clock.setFixedTime(opz.data || DIC1);
  const t = { ctx, page, esterni, errori: [], dialoghi: [], risposte: [] };
  page.on('pageerror', e => { t.errori.push('pageerror: ' + e.message); });
  page.on('dialog', async dg => {
    const msg = dg.message(); t.dialoghi.push({ tipo: dg.type(), msg });
    let r = t.risposte.length ? t.risposte.shift() : true;
    if (dg.type() === 'alert') return dg.accept();
    return r === false ? dg.dismiss() : dg.accept();
  });
  await page.goto(opz.url || U19);
  return t;
}
async function dentro(t, w) { await H.entra(t, w.auth.email); await t.page.waitForTimeout(900); }
async function velo(t) { return t.page.evaluate(() => { const v = document.getElementById('chiusura-velo'); return !!v && getComputedStyle(v).display !== 'none'; }); }
async function testoVelo(t) { return t.page.evaluate(() => { const v = document.getElementById('chiusura-velo'); return v ? v.innerText : ''; }); }
async function esci(t) { await t.page.evaluate(() => esci()); await t.page.waitForSelector('#app-login:not(.hide)', { timeout: 15000 }); await t.page.waitForTimeout(300); }
async function vista(t, y, m, view, si) {
  await t.page.evaluate(([y, m, view, si]) => { ws.year = y; ws.month = m; ws.view = view; ws.si = si || 0; ws.fuExtra = {}; return renderWorker(); }, [y, m, view, si]);
  await t.page.waitForTimeout(700);
}
const updNov = (w) => async t => (await H.scritture(t)).filter(x => x.op === 'update' && x.path.indexOf(w.auth.uid + '__2026_11_') >= 0);

(async () => {
  const browser = await H.chromium.launch();
  const errTot = [];
  const fineT = async t => { errTot.push(...(await H.fine(t))); };
  try {
    // ============ 0. CONFRONTO: rev 18 congelata al 1/12/2026 ============
    {
      const t = await apriC(browser, semeBase('r19-0'), { url: U18 });
      await dentro(t, WE);
      const v = await velo(t);
      await vista(t, 2026, 12, 'foglio', 0);
      const ed = await t.page.evaluate(() => { const i = document.querySelector('.tbl tbody tr input.ti'); return !!i && !i.disabled; });
      c('R00', 'rev 18 congelata: al 1/12 nessun obbligo di chiusura e dicembre compilabile', 'nessun riquadro, dicembre scrivibile', 'riquadro=' + v + ' dicembreScrivibile=' + ed, !v && ed);
      await fineT(t);
    }
    // ============ 1. ESTERNO: blocco, testi, rivedi, chiusura ============
    {
      const t = await apriC(browser, semeBase('r19-1'));
      const p = t.page;
      await dentro(t, WE);
      const tx = await testoVelo(t);
      c('R01', 'esterno con dati a novembre: al 1/12 compare il riquadro bloccante', 'riquadro visibile', 'visibile=' + await velo(t), await velo(t));
      const voci = [
        '🔒 Chiudi il mese di NOVEMBRE 2026',
        'Per compilare DICEMBRE devi prima chiudere novembre.',
        '⚠️ Prima di chiudere, rivedi il tuo foglio ore di novembre: controlla giorni, orari, ferie, permessi e malattie.',
        '👀 Rivedi il foglio di novembre',
        'Confermo di aver inserito tutto (ferie e permessi compresi)',
        '✔ Autorizzo le ore e chiudo novembre'];
      const manca = voci.filter(v => tx.indexOf(v) < 0);
      c('R02', 'testi del riquadro identici a quelli approvati', '6 testi presenti', manca.length ? 'mancano: ' + manca.join(' | ') : '6 su 6', manca.length === 0);
      const righe = await p.$$eval('#chiu-box .chiu-tot', a => a.map(x => x.innerText.trim()));
      const att = ['SCUOLA — Dirette 6,00 · Indirette 1,00 · Totale 7,00 · Assenze 1 gg', 'CASA DI QUARTIERE — Dirette 2,50 · Indirette 0,00 · Totale 2,50 · Assenze 1 gg'];
      c('R03', 'una riga di totali per servizio, coi conti del riquadro «Totali e autorizzazione»', att.join(' / '), righe.join(' / '), JSON.stringify(righe) === JSON.stringify(att));
      c('R04', 'esterno: NIENTE domanda sulle ferie/permessi a completamento', 'nessun riquadro azzurro', 'domanda=' + (tx.indexOf('dovuto contrattuale') >= 0), (await p.$('#chiu-box .chiu-dom')) === null && tx.indexOf('dovuto contrattuale') < 0);
      c('R05', 'il pulsante resta spento finché non si spunta la conferma', 'disabled', 'disabled=' + await p.$eval('#chiu-ok', b => b.disabled), await p.$eval('#chiu-ok', b => b.disabled));
      // dicembre bloccato (foglio e foglio unico), senza scritture su dicembre
      const s0 = (await H.scritture(t)).length;
      await vista(t, 2026, 12, 'foglio', 0);
      const bF = await velo(t) && (await p.$('.tbl tbody tr')) === null;
      await vista(t, 2026, 12, 'unico', 0);
      const bU = await velo(t) && (await p.$('.tbl tbody tr')) === null;
      const scrDic = (await H.scritture(t)).slice(s0).filter(x => x.path.indexOf('__2026_12_') >= 0).length;
      c('R06', 'dicembre NON si compila: foglio del servizio e foglio unico mostrano il riquadro, niente tabella', 'bloccati, 0 scritture su dicembre', 'foglio=' + bF + ' unico=' + bU + ' scrittureDicembre=' + scrDic, bF && bU && scrDic === 0);
      // «Rivedi»: novembre si apre ed è modificabile, con la fascia per chiudere
      await p.click('#chiu-box .chiu-rev'); await p.waitForTimeout(900);
      const rv = await p.evaluate(() => ({ view: ws.view, y: ws.year, m: ws.month, velo: !!document.getElementById('chiusura-velo'),
        scriv: [...document.querySelectorAll('.tbl tbody input.ti')].filter(i => !i.disabled).length,
        fascia: (document.getElementById('chiu-fascia') || {}).innerText || '' }));
      c('R07', '«Rivedi» apre novembre (foglio unico) MODIFICABILE, con la fascia «🔒 Chiudi novembre»', 'unico 2026/11, caselle scrivibili, fascia', JSON.stringify(rv).slice(0, 200), rv.view === 'unico' && rv.y === 2026 && rv.m === 11 && !rv.velo && rv.scriv > 10 && rv.fascia.indexOf('🔒 Chiudi novembre') >= 0 && rv.fascia.indexOf('Per compilare DICEMBRE devi prima chiudere novembre.') >= 0);
      // scrivo una cella in novembre (giorno 12) dal foglio del 1° servizio: anche lì c'è la fascia
      await vista(t, 2026, 11, 'foglio', 0);
      const fasciaF = !!(await p.$('#chiu-fascia'));
      const riga12 = p.locator('.tbl tbody tr').nth(11);
      await riga12.locator('input[data-fld=t1f]').fill('08:00'); await riga12.locator('input[data-fld=t1t]').fill('12:00');
      await riga12.locator('input[data-fld=t1t]').blur();
      await p.waitForTimeout(1500);
      // la fascia riapre il riquadro con i totali aggiornati
      await p.click('#chiu-fascia button'); await p.waitForTimeout(700);
      const righe2 = await p.$$eval('#chiu-box .chiu-tot', a => a.map(x => x.innerText.trim()));
      c('R08', 'novembre modificabile anche nel foglio del servizio (con la fascia); la fascia riapre il riquadro coi totali aggiornati', 'SCUOLA Dirette 10,00', 'fascia=' + fasciaF + ' ' + (righe2[0] || ''), fasciaF && await velo(t) && (righe2[0] || '').indexOf('Dirette 10,00') >= 0);
      // chiusura
      await p.check('#chiu-chk');
      const en = await p.$eval('#chiu-ok', b => !b.disabled);
      const u0 = (await updNov(WE)(t)).length;
      await p.click('#chiu-ok'); await p.waitForTimeout(1500);
      const db = await H.dump(t);
      const a = db[K(WE, 2026, 11, 0)], b = db[K(WE, 2026, 11, 1)];
      const okCampi = [a, b].every(x => x && x.workerConfirmed === true && x.meseChiuso === true && typeof x.meseChiusoAt === 'string' && typeof x.workerConfirmedAt === 'string' && !('completamento' in x));
      c('R09', 'spunta → pulsante acceso → chiusura: su TUTTI e due i servizi workerConfirmed, meseChiuso, meseChiusoAt; niente completamento (esterno)', 'campi scritti su 2 fogli', 'acceso=' + en + ' ' + JSON.stringify([a, b].map(x => x && { wc: x.workerConfirmed, mc: x.meseChiuso, at: !!x.meseChiusoAt, comp: x.completamento }) ), en && okCampi);
      c('R10', 'il giorno scritto durante la revisione è arrivato nel database', '12: 08:00-12:00', JSON.stringify((a.days || {})[12] || null), (a.days || {})[12] && a.days[12].t1f === '08:00' && a.days[12].t1t === '12:00');
      const dopo = await p.evaluate(() => ({ velo: !!document.getElementById('chiusura-velo'), y: ws.year, m: ws.month, view: ws.view, tab: !!document.querySelector('.tbl tbody tr') }));
      c('R11', 'dopo la chiusura il riquadro sparisce e dicembre si apre e si compila', 'dicembre, tabella presente', JSON.stringify(dopo), !dopo.velo && dopo.m === 12 && dopo.tab);
      // novembre ora di sola lettura, senza «riapri»
      await vista(t, 2026, 11, 'foglio', 0);
      const ro = await p.evaluate(() => ({ scriv: [...document.querySelectorAll('.tbl tbody input.ti')].filter(i => !i.disabled).length, tx: document.getElementById('app-main').innerText }));
      c('R12', 'novembre chiuso: per il lavoratore di sola lettura, nessun «↩ Riapri», riga «riapre solo l\'amministratore»', '0 caselle scrivibili', 'scrivibili=' + ro.scriv + ' riapri=' + (ro.tx.indexOf('Riapri') >= 0), ro.scriv === 0 && ro.tx.indexOf('Riapri') < 0 && ro.tx.indexOf('Mese chiuso e autorizzato — per modificarlo chiedi all\'amministratore di riaprirlo.') >= 0 && ro.tx.indexOf("Dopo l'autorizzazione potrà riaprirla solo l'amministratore.") >= 0);
      await vista(t, 2026, 11, 'unico', 0);
      const ro2 = await p.evaluate(() => ({ scriv: [...document.querySelectorAll('.tbl tbody input.ti, .tbl tbody select')].filter(i => !i.disabled).length, riapri: [...document.querySelectorAll('button')].some(b => /Riapri/.test(b.textContent)) }));
      c('R13', 'anche nel foglio unico novembre è di sola lettura e senza «↩ Riapri»', '0 comandi scrivibili', JSON.stringify(ro2), ro2.scriv === 0 && !ro2.riapri);
      // reopenMonth chiamata a mano dal lavoratore: rifiutata, nessuna scrittura
      const s1 = (await H.scritture(t)).length; t.dialoghi.length = 0;
      await p.evaluate(() => reopenMonth(0)); await p.waitForTimeout(400);
      const al = (t.dialoghi[0] || {}).msg || '';
      c('R14', 'reopenMonth del lavoratore: rifiutata con «riapre solo l\'amministratore», 0 scritture', 'avviso, 0 scritture', al + ' / scritture=' + ((await H.scritture(t)).length - s1), al === "Dopo l'autorizzazione potrà riaprirla solo l'amministratore." && (await H.scritture(t)).length === s1);
      // confirm dell'autorizzazione servizio per servizio: la frase nuova
      await vista(t, 2026, 12, 'foglio', 0);
      t.dialoghi.length = 0; t.risposte.push(false);
      await p.evaluate(() => { const c = document.getElementById('chk-conf-0'); if (c) { c.checked = true; } return confirmMonth(0); });
      await p.waitForTimeout(300);
      const cm = (t.dialoghi.find(d => d.tipo === 'confirm') || {}).msg || '';
      c('R15', 'conferma «Autorizzo» servizio per servizio: la frase diventata falsa è sostituita', '…potrà riaprirla solo l\'amministratore.', cm.replace(/\n/g, ' ').slice(-90), cm.indexOf("Dopo l'autorizzazione potrà riaprirla solo l'amministratore.") >= 0 && cm.indexOf('Potrai riaprire tu stesso') < 0);
      await esci(t); await dentro(t, WE);
      c('R16', 'rientrando dopo la chiusura il riquadro NON compare più', 'nessun riquadro', 'riquadro=' + await velo(t), !(await velo(t)));
      await fineT(t);
    }
    // ============ 2. DIPENDENTE: domanda obbligatoria ============
    {
      const t = await apriC(browser, semeBase('r19-2'));
      const p = t.page;
      await dentro(t, WD);
      const tx = await testoVelo(t);
      const dom = 'Se non avessi raggiunto con le ore dichiarate lavorate in questo mese il dovuto contrattuale, vuoi che ti siano assegnati ferie/permessi a completamento o lasci così?';
      c('R17', 'dipendente (residui dip:true): compare la domanda con le due scelte, testo esatto', 'domanda + «Sì, assegnatemi…» + «No, lascio così»', 'domanda=' + (tx.indexOf(dom) >= 0) + ' scelte=' + (await p.$$('#chiu-box input[name=chiu-comp]')).length, tx.indexOf(dom) >= 0 && tx.indexOf('Sì, assegnatemi ferie/permessi a completamento') >= 0 && tx.indexOf('No, lascio così') >= 0 && (await p.$$('#chiu-box input[name=chiu-comp]')).length === 2);
      await p.check('#chiu-chk');
      const spentoSenza = await p.$eval('#chiu-ok', b => b.disabled);
      // forzando la chiusura senza risposta: avviso, nessuna scrittura
      const s0 = (await H.scritture(t)).length; t.dialoghi.length = 0;
      await p.evaluate(() => chiudiMese()); await p.waitForTimeout(500);
      const al = (t.dialoghi[0] || {}).msg || '';
      c('R18', 'senza risposta il pulsante resta spento e forzando non si chiude', 'spento, avviso, 0 scritture', 'spento=' + spentoSenza + ' avviso=' + al + ' scritture=' + ((await H.scritture(t)).length - s0), spentoSenza && al.indexOf('Rispondi prima') >= 0 && (await H.scritture(t)).length === s0);
      await p.check('#chiu-box input[value=si]');
      const sel = await p.evaluate(() => [...document.querySelectorAll('#chiu-box .chiu-opt')].map(l => l.classList.contains('sel')));
      const acceso = await p.$eval('#chiu-ok', b => !b.disabled);
      // doppio clic: una sola chiusura
      const u0 = (await updNov(WD)(t)).length;
      await p.dblclick('#chiu-ok'); await p.waitForTimeout(1800);
      const nUpd = (await updNov(WD)(t)).length - u0;
      const db = await H.dump(t);
      const a = db[K(WD, 2026, 11, 0)], b = db[K(WD, 2026, 11, 1)];
      c('R19', 'risposta «Sì» → pulsante acceso; doppio clic = UNA chiusura (una scrittura per foglio); completamento "si" su tutti i servizi', 'acceso, 2 update, completamento si', 'sel=' + sel + ' acceso=' + acceso + ' update=' + nUpd + ' comp=' + [a.completamento, b.completamento], acceso && sel[0] && !sel[1] && nUpd === 2 && a.completamento === 'si' && b.completamento === 'si' && a.meseChiuso === true && b.meseChiuso === true);
      // il riquadro del tetto non compare per un residui con solo {dip:true}
      await vista(t, 2026, 12, 'unico', 0);
      const tt = await H.testo(t, '#app-main');
      c('R20', 'residui con solo {dip:true}: il riquadro «Le ore che ti restano» NON compare', 'assente', 'presente=' + (tt.indexOf('Le ore che ti restano') >= 0), tt.indexOf('Le ore che ti restano') < 0);
      await esci(t);
      // ADMIN: vede la risposta e riapre un servizio
      await dentro(t, ADM);
      c('R21', 'admin al 1/12: nessun riquadro di chiusura', 'nessun riquadro', 'riquadro=' + await velo(t), !(await velo(t)));
      await p.evaluate(([uid]) => { as.year = 2026; as.month = 11; as.view = 'worker'; as.uid = uid; as.name = 'BIANCHI ANNA'; return renderAdminWorker(); }, [WD.auth.uid]).catch(() => {});
      await p.waitForTimeout(1200);
      const at = await H.testo(t, '#app-main');
      const nRisp = (at.match(/Chiede ferie\/permessi a completamento/g) || []).length;
      c('R22', 'pannello admin: accanto all\'autorizzazione la risposta «Chiede ferie/permessi a completamento»', '2 (una per servizio)', nRisp, nRisp === 2);
      t.risposte.push(true);
      await p.evaluate(([uid]) => adminReopenMonth(uid, 0), [WD.auth.uid]); await p.waitForTimeout(1000);
      const db2 = await H.dump(t); const a2 = db2[K(WD, 2026, 11, 0)];
      c('R23', 'riapertura dell\'admin: tolti workerConfirmed, meseChiuso e completamento', 'wc false, mc false, niente completamento', JSON.stringify({ wc: a2.workerConfirmed, mc: a2.meseChiuso, at: a2.meseChiusoAt, comp: a2.completamento }), a2.workerConfirmed === false && a2.meseChiuso === false && a2.meseChiusoAt === null && !('completamento' in a2));
      await esci(t);
      await dentro(t, WD);
      const tx2 = await testoVelo(t);
      c('R24', 'dopo la riapertura dell\'admin il blocco RITORNA e la domanda va rifatta', 'riquadro con domanda', 'riquadro=' + await velo(t) + ' domanda=' + (tx2.indexOf('dovuto contrattuale') >= 0), (await velo(t)) && tx2.indexOf('dovuto contrattuale') >= 0);
      await p.check('#chiu-box input[value=no]'); await p.check('#chiu-chk'); await p.click('#chiu-ok'); await p.waitForTimeout(1500);
      const db3 = await H.dump(t);
      c('R25', 'richiudendo con «No» il completamento diventa "no" su tutti e due', 'no, no', [db3[K(WD, 2026, 11, 0)].completamento, db3[K(WD, 2026, 11, 1)].completamento].join(','), db3[K(WD, 2026, 11, 0)].completamento === 'no' && db3[K(WD, 2026, 11, 1)].completamento === 'no' && !(await velo(t)));
      await esci(t); await dentro(t, ADM);
      await p.evaluate(([uid]) => { as.year = 2026; as.month = 11; as.view = 'worker'; as.uid = uid; as.name = 'BIANCHI ANNA'; return renderAdminWorker(); }, [WD.auth.uid]).catch(() => {});
      await p.waitForTimeout(1200);
      const at2 = await H.testo(t, '#app-main');
      c('R26', 'pannello admin: «Lascia così» dopo la risposta «No»', '2', (at2.match(/· Lascia così/g) || []).length, (at2.match(/· Lascia così/g) || []).length === 2);
      await fineT(t);
    }
    // ============ 3. LINEA CADUTA ============
    {
      const t = await apriC(browser, semeBase('r19-3'));
      const p = t.page;
      await dentro(t, WF);
      await p.check('#chiu-chk');
      await p.evaluate(() => { __fakefb.failWrites = true; });
      await p.click('#chiu-ok'); await p.waitForTimeout(1500);
      const err = await p.$eval('#chiu-err', e => e.innerText).catch(() => '');
      const db = await H.dump(t);
      const nessuno = [0, 1].every(i => !db[K(WF, 2026, 11, i)].meseChiuso && !db[K(WF, 2026, 11, i)].workerConfirmed);
      c('R27', 'scrittura caduta: il mese NON risulta chiuso, il riquadro resta col messaggio della rev 14', '«Non c\'è collegamento…», DB intatto', err + ' / riquadro=' + await velo(t) + ' DBintatto=' + nessuno, err === "⚠️ Non c'è collegamento: riprova quando torna la linea." && (await velo(t)) && nessuno && !(await p.$eval('#chiu-ok', b => b.disabled)));
      await vista(t, 2026, 12, 'foglio', 0);
      c('R28', 'col mese non chiuso dicembre resta bloccato', 'riquadro', 'riquadro=' + await velo(t), await velo(t));
      await p.evaluate(() => { __fakefb.failWrites = false; });
      await p.check('#chiu-chk'); await p.click('#chiu-ok'); await p.waitForTimeout(1500);
      const db2 = await H.dump(t);
      c('R29', 'tornata la linea: riprovando si chiude davvero', 'meseChiuso su 2 fogli', [0, 1].map(i => db2[K(WF, 2026, 11, i)].meseChiuso).join(','), [0, 1].every(i => db2[K(WF, 2026, 11, i)].meseChiuso === true) && !(await velo(t)));
      await fineT(t);
    }
    // ============ 4. CHI NON VEDE IL RIQUADRO ============
    {
      const t = await apriC(browser, semeBase('r19-4'));
      const p = t.page;
      const casi = [];
      for (const [w, nome] of [[WV, 'viewer'], [WC, 'worker con fogli senza dati'], [WO, 'worker con dati solo a ottobre'], [WA, 'esterno autorizzato servizio per servizio (rev 18)'], [WL, 'editor senza fogli (solo light)']]) {
        await dentro(t, w); casi.push(nome + '=' + await velo(t));
        if (w === WL) { await p.evaluate(() => { ws.view = 'light'; return renderWorker(); }); await p.waitForTimeout(800); casi.push('light=' + ((await H.testo(t, '#app-main')).indexOf('LUMI') >= 0)); }
        await esci(t);
      }
      c('R30', 'nessun riquadro per viewer, fogli senza dati (C1), dati solo prima di novembre, esterno già autorizzato, editor solo light (che vede i suoi light)', 'tutti false', casi.join(' · '), casi.every(x => /=false$/.test(x) || x === 'light=true'));
      // l'editor con dati entra mentre la pagina è rimasta sulla vista «light» dell'accesso precedente
      await dentro(t, WED);
      c('R31', 'editor con dati a novembre: il riquadro compare subito dopo l\'accesso (anche se la pagina era rimasta sugli operatori light)', 'riquadro', 'vista=' + await p.evaluate(() => ws.view) + ' riquadro=' + await velo(t), await velo(t));
      await esci(t);
      await p.evaluate(() => { ws.view = 'home'; });
      await dentro(t, WAD);
      const tx = await testoVelo(t);
      c('R32', 'dipendente autorizzato servizio per servizio ma senza risposta: il riquadro compare con la domanda', 'riquadro con domanda', 'riquadro=' + await velo(t), (await velo(t)) && tx.indexOf('dovuto contrattuale') >= 0);
      await fineT(t);
    }
    // ============ 5. DATE E BLOCCO DELL'ADMIN ============
    {
      const t = await apriC(browser, semeBase('r19-5'), { data: new Date('2026-11-19T10:00:00') });
      await dentro(t, WE); const a = await velo(t); await esci(t);
      await t.ctx.close();
      const t2 = await apriC(browser, semeBase('r19-5b'), { data: new Date('2026-11-02T08:00:00') });
      await dentro(t2, WO); const b = await velo(t2);
      await vista(t2, 2026, 11, 'foglio', 0);
      const scr = await t2.page.evaluate(() => [...document.querySelectorAll('.tbl tbody input.ti')].filter(i => !i.disabled).length);
      await fineT(t2);
      c('R33', 'mesi prima di novembre 2026: nessun obbligo (oggi 19/11 con dati a novembre; 2/11 con dati a ottobre)', 'nessun riquadro, novembre compilabile', 'oggi=' + a + ' 2nov=' + b + ' novembreScrivibili=' + scr, !a && !b && scr > 20);
      const t3 = await apriC(browser, semeBase('r19-5c', { 'locks/2026_11': { locked: true } }));
      await dentro(t3, WE); const l = await velo(t3);
      await vista(t3, 2026, 12, 'foglio', 0);
      const scr3 = await t3.page.evaluate(() => [...document.querySelectorAll('.tbl tbody input.ti')].filter(i => !i.disabled).length);
      await fineT(t3);
      c('R34', 'SCELTA: novembre bloccato dall\'admin conta come chiuso (nessun riquadro, dicembre compilabile)', 'nessun riquadro', 'riquadro=' + l + ' dicembreScrivibili=' + scr3, !l && scr3 > 20);
      const t4 = await apriC(browser, semeBase('r19-5d'), { data: new Date('2027-01-04T08:00:00') });
      await dentro(t4, WE); const g = await velo(t4); await fineT(t4);
      c('R35', 'si guarda SOLO il mese subito prima: il 4/1/2027 (dicembre senza dati) nessun riquadro per novembre', 'nessun riquadro', 'riquadro=' + g, !g);
    }
    // ============ 6. GRAFICA 390 / 1280 ============
    for (const [w, h, nome] of [[390, 844, '390'], [1280, 900, '1280']]) {
      const t = await apriC(browser, semeBase('r19-6-' + nome), { viewport: { width: w, height: h }, dsf: SCATTI ? 2 : 1 });
      const p = t.page;
      await dentro(t, WD);
      await p.check('#chiu-box input[value=si]');
      const g = await p.evaluate(() => {
        const box = document.getElementById('chiu-box'), r = box.getBoundingClientRect();
        let minFont = 99, piccole = [];
        box.querySelectorAll('*').forEach(e => { if (!e.childNodes.length) return; const has = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!has) return; const f = parseFloat(getComputedStyle(e).fontSize); if (f < minFont) minFont = f; if (f < 12.5) piccole.push(e.textContent.trim().slice(0, 20) + ':' + f); });
        const comandi = [...box.querySelectorAll('button, label.chiu-opt, label.chiu-chk')].map(b => Math.round(b.getBoundingClientRect().height));
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, l: Math.round(r.left), rr: Math.round(r.right), minFont, piccole, comandi };
      });
      c('R36-' + nome, 'riquadro a ' + nome + 'px: nessuno scorrimento laterale, dentro lo schermo, niente sotto 12,5px, comandi ≥ 40px', 'sw=iw, font ≥12,5, comandi ≥40', JSON.stringify(g), g.sw <= g.iw && g.l >= 0 && g.rr <= g.iw && g.minFont >= 12.5 && g.comandi.every(x => x >= 40));
      if (SCATTI) { fs.mkdirSync(SCATTI, { recursive: true }); await p.screenshot({ path: path.join(SCATTI, 'rev19-riquadro-' + nome + '.png'), fullPage: false }); }
      // fascia in novembre
      await p.click('#chiu-box .chiu-rev'); await p.waitForTimeout(900);
      const f = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, h: Math.round(document.querySelector('#chiu-fascia button').getBoundingClientRect().height), fs: parseFloat(getComputedStyle(document.querySelector('#chiu-fascia span')).fontSize) }));
      c('R37-' + nome, 'fascia «Chiudi novembre» a ' + nome + 'px: niente scorrimento laterale in più, pulsante comodo', 'pulsante ≥40px, testo ≥12,5', JSON.stringify(f), f.h >= 40 && f.fs >= 12.5);
      if (SCATTI) await p.screenshot({ path: path.join(SCATTI, 'rev19-fascia-' + nome + '.png'), fullPage: false });
      await fineT(t);
    }
  } catch (e) { console.error(e); c('ERR', 'eccezione dello script', 'nessuna', String(e && e.stack || e).slice(0, 200), false); }
  c('R99', 'zero errori di pagina in tutte le prove', '0', errTot.length + ' ' + errTot.join(' | ').slice(0, 160), errTot.length === 0);
  await browser.close();
  H.riepilogo('fo-rev19');
})();
