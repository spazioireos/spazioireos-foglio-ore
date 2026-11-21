// fo-a05 — creazione e configurazione di un servizio, doppioni, eliminazione di un servizio,
// doppio clic, testo lunghissimo, foglio unico, operatori light (editor), guasti. SOLO DATI INVENTATI.
const H = require('./fo-a00-comune.cjs');
const { c } = H;
(async () => {
  const browser = await H.chromium.launch();
  const ADM = H.u('ADMIN0001', H.ADMIN, 'admin', 'AMMINISTRAZIONE', 'PROVA');
  const W1 = H.u('WRK00001', 'nuovo.prova@esempio.it', 'worker', 'NUOVI', 'NINO');
  const ED = H.u('EDT00001', 'editor.prova@esempio.it', 'editor', 'EDITORI', 'ELIO');
  const W4 = H.u('WRK00004', 'unico.prova@esempio.it', 'worker', 'UNICI', 'UGO');
  const docs = Object.assign({},
    H.ts('WRK00004', 2026, 11, 0, { 2: { t1f: '0900', t1t: '1100' }, 10: { absence: 'MALATTIA' } }, { workerName: 'UNICI UGO' }),
    H.ts('WRK00004', 2026, 11, 1, { 3: { t1f: '14.00', t1t: '16.30' }, 10: { absence: 'MALATTIA' } }, { workerName: 'UNICI UGO', mansione: 'Insegnante/Istruttore', sede: 'Casa di quartiere', dettagli: 'PIAZZA FINTA 2' }));
  const t = await H.apri(browser, H.seme('a05', [ADM, W1, ED, W4], docs));
  const p = t.page;
  await H.entra(t, W1.auth.email);
  // nessun servizio: il foglio dice «NON È ANCORA CONFIGURATO»
  await p.evaluate(() => { ws.year = 2026; ws.month = 11; ws.si = 0; ws.view = 'foglio'; return renderWorker(); }); await p.waitForTimeout(700);
  let tx = await H.testo(t, '#app-main');
  c('D01', 'foglio di un servizio non configurato', '«QUESTO SERVIZIO NON È ANCORA CONFIGURATO», nessuna tabella', /NON È ANCORA CONFIGURATO/.test(tx) + ' tabella=' + await p.locator('.tbl').count(), /NON È ANCORA CONFIGURATO/.test(tx) && (await p.locator('.tbl').count()) === 0);
  // configurazione dal pulsante della home
  await p.evaluate(() => { ws.view = 'servizi'; ws.addingService = false; return renderWorker(); }); await p.waitForTimeout(700);
  await p.click('button:has-text("➕ AGGIUNGI UN SERVIZIO")'); await p.waitForTimeout(600);
  t.dialoghi.length = 0;
  await p.click('button:has-text("💾 Salva servizio")'); await p.waitForTimeout(400);
  c('D02', 'salva servizio con campi vuoti', '«Compila almeno mansione e sede», niente scritto', (t.dialoghi[0] || {}).msg + ' scritture=' + (await H.scritture(t)).filter(x => /timesheets/.test(x.path)).length, /Compila almeno mansione e sede/.test((t.dialoghi[0] || {}).msg || '') && (await H.scritture(t)).filter(x => /timesheets/.test(x.path)).length === 0);
  const lungo = 'VIA ' + 'LUNGHISSIMA '.repeat(40);
  await p.selectOption('#ms-mans-0', 'Educatore/Assistente'); await p.selectOption('#ms-sede-0', 'Scuola');
  await p.fill('#ms-det-0', lungo); await p.fill('#ms-com-0', 'provopoli');
  t.dialoghi.length = 0;
  await p.dblclick('button:has-text("💾 Salva servizio")'); await p.waitForTimeout(1200);
  let db = await H.dump(t); const kN = 'timesheets/WRK00001__2026_11_0';
  const nSet = (await H.scritture(t)).filter(x => x.path === kN.replace('timesheets/', 'timesheets/')).length;
  c('D03', 'salva servizio con doppio clic', 'una sola scrittura, un solo avviso «salvato!»', 'scritture=' + (await H.scritture(t)).filter(x => /timesheets\/WRK00001/.test(x.path)).length + ' avvisi=' + t.dialoghi.filter(d => /salvato!/.test(d.msg)).length, (await H.scritture(t)).filter(x => /timesheets\/WRK00001/.test(x.path)).length === 1 && t.dialoghi.filter(d => /salvato!/.test(d.msg)).length === 1);
  c('D04', 'configurazione salvata', 'mansione, sede, comune in maiuscolo nel documento del mese', db[kN] && [db[kN].mansione, db[kN].sede, db[kN].comune].join('|'), db[kN] && db[kN].mansione === 'Educatore/Assistente' && db[kN].comune === 'PROVOPOLI');
  const sw = await p.evaluate(() => document.documentElement.scrollWidth + '/' + innerWidth);
  await p.evaluate(() => { ws.view = 'riepilogo'; return renderWorker(); }); await p.waitForTimeout(700);
  const sw2 = await p.evaluate(() => document.documentElement.scrollWidth + '/' + innerWidth);
  c('D05', 'testo lunghissimo (via di 484 caratteri)', 'la pagina non scorre di lato (servizi e riepilogo)', sw + ' · ' + sw2, sw.split('/')[0] === sw.split('/')[1] && sw2.split('/')[0] === sw2.split('/')[1]);
  // doppione
  await p.evaluate(() => { ws.view = 'servizi'; ws.addingService = true; return renderWorker(); }); await p.waitForTimeout(800);
  await p.selectOption('#ms-mans-1', 'Educatore/Assistente'); await p.selectOption('#ms-sede-1', 'Scuola'); await p.fill('#ms-det-1', lungo.toLowerCase()); await p.fill('#ms-com-1', 'X');
  t.dialoghi.length = 0;
  await p.locator('button', { hasText: '💾 Salva servizio' }).nth(1).click(); await p.waitForTimeout(800);
  c('D06', 'servizio doppione', '«già presente nel 1° servizio. Non puoi duplicarla»', (t.dialoghi[0] || {}).msg, /già presente nel 1° servizio/.test((t.dialoghi[0] || {}).msg || ''));
  // scrittura caduta durante la configurazione del servizio
  await p.evaluate(() => { __fakefb.failWrites = true; });
  await p.selectOption('#ms-mans-1', 'Altro'); await p.selectOption('#ms-sede-1', 'Altro spazio'); await p.fill('#ms-det-1', 'VIA CADUTA 1');
  t.dialoghi.length = 0;
  await p.locator('button', { hasText: '💾 Salva servizio' }).nth(1).click(); await p.waitForTimeout(1000);
  db = await H.dump(t);
  const bS = await p.evaluate(() => { const b = document.getElementById('banda-salv'); return b && getComputedStyle(b).display !== 'none'; });
  c('D07', 'configurazione servizio con scrittura caduta', 'nessun «salvato!» se il DB non ha ricevuto niente', 'avviso=' + ((t.dialoghi[0] || {}).msg || '—') + ' DB=' + !!db['timesheets/WRK00001__2026_11_1'] + ' bandaOre=' + bS, !/salvato!/.test((t.dialoghi[0] || {}).msg || '') || !!db['timesheets/WRK00001__2026_11_1']);
  await p.evaluate(() => { __fakefb.failWrites = false; bandaSalvataggio(false); });
  // eliminazione di un servizio vuoto (con conferma)
  await p.evaluate(() => { ws.view = 'servizi'; ws.addingService = false; _preloadDone = {}; cache = {}; return renderWorker(); }); await p.waitForTimeout(900);
  t.risposte.push(false);
  await p.evaluate(() => delServizio(0)); await p.waitForTimeout(700);
  db = await H.dump(t);
  c('D08', 'elimina servizio vuoto: annullo', 'conferma, documento resta', ((t.dialoghi.slice(-1)[0] || {}).msg || '').slice(0, 40) + ' DB=' + !!db[kN], /Vuoi eliminare questo servizio/.test((t.dialoghi.slice(-1)[0] || {}).msg || '') && !!db[kN]);
  // con ore non si elimina
  await p.evaluate(() => { ws.year = 2026; ws.month = 11; ws.si = 0; ws.view = 'foglio'; return renderWorker(); }); await p.waitForTimeout(800);
  await p.locator('.tbl tbody tr').nth(1).locator('input[data-fld=t1f]').fill('0900'); await p.locator('.tbl tbody tr').nth(1).locator('input[data-fld=t1t]').fill('1000'); await p.waitForTimeout(1000);
  t.dialoghi.length = 0;
  await p.evaluate(() => delServizio(0)); await p.waitForTimeout(700);
  db = await H.dump(t);
  c('D09', 'elimina servizio con ore', 'rifiutato «ha ORE registrate»', ((t.dialoghi[0] || {}).msg || '').slice(0, 60) + ' DB=' + !!db[kN], /ha ORE registrate/.test((t.dialoghi[0] || {}).msg || '') && !!db[kN]);
  await p.waitForTimeout(1500); await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); }); await p.waitForTimeout(300); await p.evaluate(() => auth.signOut()); await p.waitForTimeout(500);
  // --- foglio unico
  await H.entra(t, W4.auth.email);
  await p.evaluate(() => { ws.year = 2026; ws.month = 11; ws.view = 'unico'; ws.fuExtra = {}; return renderWorker(); }); await p.waitForTimeout(1500);
  let fu = await H.testo(t, '#fu-foot');
  c('D10', 'foglio unico: totale mese di più servizi, assenza una volta', 'Ordinarie 4,50 … ✅ 4,50 ore · Assenze: 1gg', fu.replace(/\s+/g, ' '), /= ✅ 4,50 ore/.test(fu) && /Assenze: 1gg/.test(fu));
  await p.evaluate(() => setSvcU(5, -1, '0')); await p.waitForTimeout(600);
  const nIn = await p.locator('input.ti[oninput^="uDU(5,0,\'t1f\'"]').count();
  if (nIn) {
    await p.locator('input.ti[oninput^="uDU(5,0,\'t1f\'"]').fill('0800'); await p.locator('input.ti[oninput^="uDU(5,0,\'t1t\'"]').fill('0930'); await p.waitForTimeout(400);
    db = await H.dump(t); const pr = JSON.stringify(((db['timesheets/WRK00004__2026_11_0'] || {}).days || {})[5] || null);
    await p.waitForTimeout(900); db = await H.dump(t);
    fu = await H.testo(t, '#fu-foot');
    c('D11', 'foglio unico: salvataggio automatico', 'dopo 800 ms giorno 5 nel DB, totale 6,00', 'prima=' + pr + ' dopo=' + JSON.stringify(db['timesheets/WRK00004__2026_11_0'].days[5]) + ' tot=' + (fu.match(/✅ [\d,]+/) || [''])[0], pr === 'null' && !!db['timesheets/WRK00004__2026_11_0'].days[5] && /✅ 6,00/.test(fu));
  } else c('D11', 'foglio unico: salvataggio automatico', 'casella del giorno 5 del 1° servizio', 'riga non trovata (il giorno 5 non ha una riga col servizio 1)', 'NON VERIFICATO');
  await p.evaluate(() => { __fakefb.failWrites = true; });
  await p.click('#btn-save-u'); await p.waitForTimeout(400);
  c('D12', 'foglio unico: 💾 con scrittura caduta', '«Errore!» e banda ORE', (await p.textContent('#btn-save-u')) + ' banda=' + await p.evaluate(() => { const b = document.getElementById('banda-salv'); return !!b && getComputedStyle(b).display !== 'none'; }), /Errore/.test(await p.textContent('#btn-save-u')) && await p.evaluate(() => { const b = document.getElementById('banda-salv'); return !!b && getComputedStyle(b).display !== 'none'; }));
  await p.evaluate(() => { __fakefb.failWrites = false; }); await p.waitForTimeout(2200);
  await p.click('#btn-save-u'); await p.waitForTimeout(400);
  c('D13', 'foglio unico: 💾 riuscito', '«✓ Salvato!», banda nascosta', (await p.textContent('#btn-save-u')) + ' banda=' + await p.evaluate(() => getComputedStyle(document.getElementById('banda-salv')).display), /Salvato/.test(await p.textContent('#btn-save-u')) && await p.evaluate(() => getComputedStyle(document.getElementById('banda-salv')).display) === 'none');
  await p.evaluate(() => auth.signOut());
  // --- operatori light (editor)
  await H.entra(t, ED.auth.email); await p.waitForTimeout(1200);
  tx = await H.testo(t, '#app-main');
  c('D14a', 'altro utente nella stessa scheda dopo «Esci»', 'parte dalla home (stato del precedente azzerato)', 'vista=' + await p.evaluate(() => ws.view) + ' inizio=' + tx.slice(0, 50).replace(/\s+/g, ' '), await p.evaluate(() => ws.view) === 'home' ? true : 'PARZIALE');
  await p.evaluate(() => { ws.view = 'home'; return renderWorker(); }); await p.waitForTimeout(600);
  tx = await H.testo(t, '#app-main');
  c('D14', 'editor: pulsante operatori light in home', '«🗂️ VAI A OPERATORI LIGHT DI CUI TI OCCUPI»', /VAI A OPERATORI LIGHT/.test(tx), /VAI A OPERATORI LIGHT/.test(tx));
  await p.evaluate(() => { ws.view = 'light'; return renderWorker(); }); await p.waitForTimeout(900);
  await p.evaluate(() => { ls.addOpen = true; ls.editId = null; return renderLightEditor(); }); await p.waitForTimeout(600);
  await p.fill('#lo-cognome', 'luce'); await p.fill('#lo-nome', 'lina'); await p.selectOption('#lo-ruolo', 'Insegnante/Istruttore'); await p.selectOption('#lo-retrib', 'Retribuito');
  await p.fill('#lo-materia', 'musica'); await p.fill('#lo-comune', 'provopoli'); await p.fill('#lo-sede', 'via luce 3');
  await p.click('button:has-text("💾 Salva")'); await p.waitForTimeout(1000);
  db = await H.dump(t); const kl = Object.keys(db).find(k => /^lightsheets\//.test(k));
  c('D15', 'nuovo operatore light', 'lightsheets con name LUCE LINA, editorUid dell\'editor', kl && (db[kl].name + ' ' + db[kl].editorUid + ' ' + db[kl].materia), kl && db[kl].name === 'LUCE LINA' && db[kl].editorUid === 'EDT00001' && db[kl].materia === 'MUSICA');
  const opId = kl.split('/')[1];
  const cellaL = () => p.locator('input[data-row="' + opId + '"]').first();
  await cellaL().fill('0,3'); await cellaL().blur(); await p.waitForTimeout(700);
  c('D16', 'ore light non ammesse (0,3)', 'rifiutate «Usa interi o 0,25 / 0,50 / 0,75»', ((t.dialoghi.slice(-1)[0] || {}).msg || '').slice(0, 60), /0,25 \/ 0,50 \/ 0,75/.test((t.dialoghi.slice(-1)[0] || {}).msg || ''));
  await cellaL().fill('2,5'); await cellaL().blur(); await p.waitForTimeout(900);
  db = await H.dump(t); const hrs = db[kl].hours;
  c('D17', 'ore light ammesse (2,5)', 'salvate in hours[anno][colonna] = 2.5', JSON.stringify(hrs), JSON.stringify(hrs).includes('2.5'));
  await p.evaluate(() => { __fakefb.failWrites = true; }); t.dialoghi.length = 0;
  await p.locator('input[data-row="' + opId + '"]').nth(1).fill('3'); await p.locator('input[data-row="' + opId + '"]').nth(1).blur(); await p.waitForTimeout(900);
  c('D18', 'ore light con scrittura caduta', 'avviso di errore comprensibile (in italiano)', ((t.dialoghi.slice(-1)[0] || {}).msg || '—').slice(0, 90), /Errore|NON salvate/.test((t.dialoghi.slice(-1)[0] || {}).msg || '') ? (/offline|Failed/i.test((t.dialoghi.slice(-1)[0] || {}).msg) ? 'PARZIALE' : true) : false);   // rev 21: la frase italiana della rev 14 al posto del testo di Firebase
  await p.evaluate(() => { __fakefb.failWrites = false; });
  t.risposte.push(false);
  await p.evaluate(([id]) => delLightOp(id, 'LUCE LINA'), [opId]); await p.waitForTimeout(700);
  db = await H.dump(t);
  c('D19', 'elimina operatore light: annullo', 'conferma, operatore resta', ((t.dialoghi.slice(-1)[0] || {}).msg || '').slice(0, 50) + ' DB=' + !!db[kl], /eliminare definitivamente l'operatore light/.test((t.dialoghi.slice(-1)[0] || {}).msg || '') && !!db[kl]);
  await p.evaluate(() => auth.signOut());
  // admin vede gli operatori light
  await H.entra(t, H.ADMIN);
  await p.evaluate(() => { as.view = 'light'; as.lightYear = new Date().getFullYear(); return renderAdmin(); }); await p.waitForTimeout(1500);
  tx = await H.testo(t, '#app-main');
  c('D20', 'admin: vista operatori light', 'LUCE LINA con le sue ore', /LUCE LINA/.test(tx) + ' ' + (tx.match(/LUCE LINA[\s\S]{0,120}/) || [''])[0].replace(/\s+/g, ' ').slice(0, 100), /LUCE LINA/.test(tx));
  console.log('STACK', JSON.stringify(t.stack||[]));
  const e = await H.fine(t);
  c('D21', 'errori di pagina (servizi/unico/light)', '0', e.length + ' ' + e.join('|').slice(0, 200), e.length === 0);
  await browser.close();
  H.riepilogo('fo-a05-servizi-unico-light');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(1); });
