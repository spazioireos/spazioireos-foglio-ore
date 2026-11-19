// fo-a03 — schermata Operatori (admin): chiusura del mese, massimali per servizio, residuo annuo,
// backup JSON / Excel, ripristino (file malfatti, vero, senza schema, schema 99, scrittura caduta),
// eliminazioni con conferma, viewer, isolamento lato interfaccia del worker. SOLO DATI INVENTATI.
const H = require('./fo-a00-comune.cjs');
const { c } = H;
const fs = require('fs');
(async () => {
  const browser = await H.chromium.launch();
  const ADM = H.u('ADMIN0001', H.ADMIN, 'admin', 'AMMINISTRAZIONE', 'PROVA');
  const W1 = H.u('WRK00001', 'rossi.prova@esempio.it', 'worker', 'ROSSI', 'MARIO');
  const W2 = H.u('WRK00002', 'bianchi.prova@esempio.it', 'worker', 'BIANCHI', 'ANNA');
  const W3 = H.u('WRK00003', 'damico.prova@esempio.it', 'worker', "D'AMICO", 'LUCIA');
  const ED = H.u('EDT00001', 'editor.prova@esempio.it', 'editor', 'EDITORI', 'ELIO');
  const DIS = H.u('DIS00001', 'spento.prova@esempio.it', 'disabled', 'SPENTO', 'ALDO');
  const VW = H.u('VIW00001', 'guarda.prova@esempio.it', 'viewer', 'GUARDA', 'LIA', { viewableWorkers: ['WRK00001'] });
  const d0 = { 1: { t1f: '900', t1t: '1300' }, 2: { t1f: '14.30', t1t: '18.30' }, 5: { t1f: '14h30', t1t: '18h30' }, 6: { t1f: '9', t1t: '13' }, 7: { t1f: '130', t1t: '530' }, 8: { absence: 'FERIE' } };
  const docs = Object.assign({},
    H.ts('WRK00001', 2026, 10, 0, d0, { workerName: 'ROSSI MARIO' }),
    H.ts('WRK00001', 2026, 10, 1, { 8: { absence: 'FERIE' }, 12: { t1f: '09:00', t1t: '11:00' } }, { workerName: 'ROSSI MARIO', mansione: 'Insegnante/Istruttore', sede: 'Casa di quartiere', dettagli: 'PIAZZA FINTA 2' }),
    H.ts('WRK00002', 2026, 10, 0, {}, { workerName: 'BIANCHI ANNA' }),
    H.ts('WRK00003', 2026, 10, 0, { 3: { t1f: '08:00', t1t: '09:00' } }, { workerName: "D'AMICO LUCIA" }),
    { 'svccaps/WRK00001__0': { workerUid: 'WRK00001', serviceIdx: 0, maxHours: 100, periodType: 'civile', periodYear: 2026 },
      'residui/WRK00001': { tetto: 400, usate: 120.5, restano: 279.5, periodo: 'scolastico', anno: 2026, aggiornato: { __ts: Date.UTC(2026, 10, 15) } },
      'lightsheets/LGT00001': { editorUid: 'EDT00001', editorName: 'EDITORI ELIO', name: 'LUCE LINA', ruolo: 'Insegnante/Istruttore', retrib: 'Retribuito', materia: 'MUSICA', comune: 'PROVOPOLI', sede: 'VIA LUCE 3', hours: { 2026: { 0: 3, 5: 2, 6: 1.5 } }, skip: {} },
      'caps/CAP00001': { workerUid: 'WRK00001', mansione: 'Educatore/Assistente', sede: 'Scuola', maxHours: 50 } });
  const tutti = [ADM, W1, W2, W3, ED, DIS, VW];
  const t = await H.apri(browser, H.seme('a03', tutti, docs));
  const p = t.page;
  await H.entra(t, H.ADMIN);
  await p.waitForTimeout(800);
  let tx = await H.testo(t, '#app-main');
  c('C01', 'schermata Operatori', 'elenca ROSSI, BIANCHI, D\'AMICO, EDITORI; sezioni Visualizzatori e Disattivati', ['ROSSI MARIO', 'BIANCHI ANNA', "D'AMICO LUCIA", 'EDITORI ELIO', 'Visualizzatori', 'Disattivati', 'SPENTO ALDO'].map(s => s + ':' + tx.includes(s)).join(' '), ['ROSSI MARIO', 'BIANCHI ANNA', "D'AMICO LUCIA", 'EDITORI ELIO', 'Visualizzatori', 'Disattivati', 'SPENTO ALDO'].every(s => tx.includes(s)));
  c('C02', 'blocco «🔒 Chiusura del mese» nella schermata Operatori', 'presente con «🔒 Chiudi Novembre 2026»', /Chiusura del mese/.test(tx) + ' ' + /Chiudi Novembre 2026/.test(tx), /Chiusura del mese/.test(tx) && /Chiudi Novembre 2026/.test(tx));
  // chiusura di ottobre
  await p.locator('.controls select').nth(1).selectOption('10'); await p.waitForTimeout(500);
  t.dialoghi.length = 0;
  await p.click('text=🔒 Chiudi Ottobre 2026'); await p.waitForTimeout(800);
  let db = await H.dump(t);
  tx = await H.testo(t, '#app-main');
  c('C03', 'chiusura mese con conferma', 'conferma «CHIUDERE Ottobre 2026 per TUTTI», locks/2026_10 locked:true, fascia CHIUSO e «🔓 Riapri mese»', (t.dialoghi[0] || {}).msg + ' | ' + JSON.stringify(db['locks/2026_10']) + ' | ' + /CHIUSO per tutti/.test(tx), /CHIUDERE Ottobre 2026 per TUTTI/.test((t.dialoghi[0] || {}).msg || '') && db['locks/2026_10'] && db['locks/2026_10'].locked === true && /CHIUSO per tutti/.test(tx) && /Riapri mese/.test(tx));
  // scheda operatore: solo avviso
  await p.evaluate(() => { as.view = 'worker'; as.uid = 'WRK00001'; as.name = 'ROSSI MARIO'; as.subTab = 'mese'; return renderAdmin(); }); await p.waitForTimeout(1200);
  tx = await H.testo(t, '#app-main');
  c('C04', 'scheda operatore con mese chiuso', 'avviso «CHIUSO per tutti gli operatori» + «Si riapre dalla schermata Operatori», nessun pulsante Chiudi/Riapri', /CHIUSO per tutti gli operatori/.test(tx) + ' ' + /Si riapre dalla schermata Operatori/.test(tx) + ' bottoni=' + /Riapri mese|Chiudi Ottobre/.test(tx), /CHIUSO per tutti gli operatori/.test(tx) && /Si riapre dalla schermata Operatori/.test(tx) && !/Riapri mese|Chiudi Ottobre/.test(tx));
  await p.evaluate(() => { as.view = 'list'; return renderAdmin(); }); await p.waitForTimeout(600);
  await p.click('text=🔓 Riapri mese'); await p.waitForTimeout(800);
  db = await H.dump(t);
  c('C05', 'riapertura dalla schermata Operatori', 'locks/2026_10 locked:false', JSON.stringify(db['locks/2026_10']), db['locks/2026_10'].locked === false);
  // nome con apostrofo: la scheda si apre?
  await p.locator('.wk-card', { hasText: "D'AMICO LUCIA" }).locator('.wk-name').click(); await p.waitForTimeout(1000);
  tx = await H.testo(t, '#app-main');
  const errAp = t.errori.filter(e => /SyntaxError|Unexpected|missing/i.test(e));
  c('C06', 'scheda di un operatore con apostrofo nel nome (D\'AMICO)', 'si apre il dettaglio «Dettaglio operatore»', 'dettaglio=' + /Dettaglio operatore/.test(tx) + ' errori=' + errAp.join('|').slice(0, 100), /Dettaglio operatore/.test(tx));
  await p.evaluate(() => { as.view = 'list'; return renderAdmin(); }); await p.waitForTimeout(600);
  // --- massimali
  await p.evaluate(() => { as.year = 2026; return renderAdminMassimali(); }); await p.waitForTimeout(1500);
  tx = await H.testo(t, '#app-main');
  c('C07', 'massimale esistente: consumo', 'ROSSI 1° servizio: 20,00 / 100,00 h · restano 80,00 h', (tx.match(/[\d,]+ \/ 100,00 h · [^·]*/) || ['—'])[0], /20,00 \/ 100,00 h · restano 80,00 h/.test(tx));
  const nTetto = await p.locator('text=METTI UN TETTO DI ORE AL SERVIZIO').count();
  c('C08', 'servizi senza tetto: pulsante METTI UN TETTO', '≥ 3 (ROSSI 2°, BIANCHI, D\'AMICO)', nTetto, nTetto >= 3);
  await p.evaluate(() => openSvcCapForm('WRK00001', 1, 'ROSSI MARIO')); await p.waitForTimeout(400);
  await p.fill('#svccap-hours', '0'); t.dialoghi.length = 0;
  await p.click('#svccap-modal >> text=💾 Salva massimale'); await p.waitForTimeout(400);
  c('C09', 'tetto 0 ore', 'rifiutato «maggiore di 0»', (t.dialoghi[0] || {}).msg, /maggiore di 0/.test((t.dialoghi[0] || {}).msg || ''));
  await p.fill('#svccap-hours', '50,5'); await p.selectOption('#svccap-ptype', 'civile'); await p.evaluate(() => svcCapYearOpts(2026));
  await p.click('#svccap-modal >> text=💾 Salva massimale'); await p.waitForTimeout(1500);
  db = await H.dump(t); tx = await H.testo(t, '#app-main');
  c('C10', 'METTI UN TETTO: salvataggio', 'svccaps/WRK00001__1 maxHours 50.5 civile 2026; a video 2,00 / 50,50', JSON.stringify(db['svccaps/WRK00001__1'] && [db['svccaps/WRK00001__1'].maxHours, db['svccaps/WRK00001__1'].periodType, db['svccaps/WRK00001__1'].periodYear]) + ' ' + /2,00 \/ 50,50 h/.test(tx), db['svccaps/WRK00001__1'] && db['svccaps/WRK00001__1'].maxHours === 50.5 && db['svccaps/WRK00001__1'].periodYear === 2026 && /2,00 \/ 50,50 h/.test(tx));
  t.risposte.push(false);
  await p.evaluate(() => removeSvcCap('WRK00001', 1)); await p.waitForTimeout(600);
  db = await H.dump(t);
  c('C11', 'togli massimale: annullo', 'il massimale resta', !!db['svccaps/WRK00001__1'], !!db['svccaps/WRK00001__1']);
  await p.evaluate(() => removeSvcCap('WRK00001', 1)); await p.waitForTimeout(1200);
  db = await H.dump(t);
  c('C12', 'togli massimale: confermo', 'documento eliminato', !db['svccaps/WRK00001__1'], !db['svccaps/WRK00001__1']);
  // --- backup JSON
  await p.evaluate(() => { as.view = 'list'; return renderAdmin(); }); await p.waitForTimeout(600);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), p.click('text=📥 Backup JSON')]);
  const nomeF = dl.suggestedFilename(); const fileB = H.OUT + '/fo-a03-backup.json'; await dl.saveAs(fileB);
  const B = JSON.parse(fs.readFileSync(fileB, 'utf8'));
  const cont = ['users', 'timesheets', 'lightsheets', 'svccaps', 'caps', 'locks'].map(k => k + ':' + (Array.isArray(B[k]) ? B[k].length : 'NO')).join(' ');
  c('C13', 'backup JSON: sei collection', 'users 7 · timesheets 4 · lightsheets 1 · svccaps 1 · caps 1 · locks 1', cont, B.users.length === 7 && B.timesheets.length === 4 && B.lightsheets.length === 1 && B.svccaps.length === 1 && B.caps.length === 1 && B.locks.length === 1);
  c('C14', 'backup JSON: schema e versione', '__schema 1, __app «Fogli ore», __rev «' + H.REV + '» (FO_REV del file), niente residui', B.__schema + ' ' + B.__app + ' ' + B.__rev + ' residui=' + ('residui' in B), B.__schema === 1 && B.__app === 'Fogli ore' && B.__rev === H.REV && !('residui' in B));
  c('C15', 'backup JSON: nome del file', '«Foglio Ore ggmmmaa - ver1 - HH.MM.json»', nomeF, /^Foglio Ore \d{2}[a-z]{3}\d{2} - ver1 - \d{2}\.\d{2}\.json$/.test(nomeF));
  // --- backup Excel
  const [dx] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('text=📥 Backup Excel')]);
  const fileX = H.OUT + '/fo-a03-backup.xlsx'; await dx.saveAs(fileX);
  const XLSX = require(require('path').join('/home/user/rendicontazione-usoint/collaudo/comune/.strumenti/node_modules/xlsx'));
  const wb = XLSX.readFile(fileX); const sh = wb.Sheets[wb.SheetNames.find(n => /ROSSI/.test(n))];
  const aoa = sh ? XLSX.utils.sheet_to_json(sh, { header: 1 }) : []; const tot = aoa.filter(r => r[1] === 'TOTALI').map(r => r[20]);
  c('C16', 'export Excel: vero .xlsx, un foglio per operatore, totali', 'fogli ROSSI/D\'AMICO…; totali ROSSI 20 e 2', wb.SheetNames.join(',') + ' totali=' + tot.join(','), fs.readFileSync(fileX).slice(0, 2).toString() === 'PK' && tot.join(',') === '20,2');
  c('C17', 'export Excel: autore nei metadati (§10.5)', '«Christian Canonica»', (wb.Props || {}).Author, (wb.Props || {}).Author === 'Christian Canonica');
  c('C18', 'export Excel: nome del file', 'versione non scritta a mano', dx.suggestedFilename(), /- ver1 -/.test(dx.suggestedFilename()) ? 'PARZIALE' : true);
  // --- ripristino: file malfatti
  const dbRef = JSON.stringify(await H.dump(t));
  const malfatti = [['non JSON', '{questo non è json'], ['oggetto qualunque', '{"ciao":1}'], ['elenco nudo', '[1,2,3]'], ['users non elenco', '{"users":"x"}'], ['documenti senza id', '{"users":[{"name":"X"}]}'], ['backup di altra app', '{"operatori":[{"name":"A"}],"versione":3}'], ['schema 99', JSON.stringify(Object.assign({}, B, { __schema: 99 }))], ['schema stringa', JSON.stringify(Object.assign({}, B, { __schema: '1' }))], ['id con barra', '{"users":[{"id":"a/b","name":"X"}]}']];
  const esiti = [];
  for (const [nome, contenuto] of malfatti) {
    const f = H.OUT + '/fo-a03-malfatto.json'; fs.writeFileSync(f, contenuto); t.dialoghi.length = 0;
    await p.setInputFiles('#fo-imp-file', f); await p.waitForTimeout(500);
    const same = JSON.stringify(await H.dump(t)) === dbRef;
    const msg = (t.dialoghi[0] || {}).msg || '';
    esiti.push(nome + ':' + (same ? 'intatto' : 'CAMBIATO') + ':' + (t.dialoghi.length === 1 && t.dialoghi[0].tipo === 'alert' ? 'rifiutato' : 'dialoghi=' + t.dialoghi.length));
  }
  c('C19', 'ripristino: 9 file malfatti', 'tutti rifiutati con un avviso, DB identico', esiti.join(' · '), esiti.every(s => /intatto:rifiutato/.test(s)));
  // annullo alla prima conferma
  const fb = H.OUT + '/fo-a03-vero.json';
  const ridotto = JSON.parse(JSON.stringify(B)); fs.writeFileSync(fb, JSON.stringify(ridotto));
  t.dialoghi.length = 0; t.risposte.push(false);
  await p.setInputFiles('#fo-imp-file', fb); await p.waitForTimeout(500);
  c('C20', 'ripristino: annullo alla prima conferma', 'conferma con conteggi per collection, DB identico', ((t.dialoghi[0] || {}).msg || '').replace(/\n/g, ' ').slice(0, 120) + ' | intatto=' + (JSON.stringify(await H.dump(t)) === dbRef), /RIMETTERE QUESTO BACKUP/.test((t.dialoghi[0] || {}).msg || '') && /timesheets: 4 documenti/.test((t.dialoghi[0] || {}).msg || '') && JSON.stringify(await H.dump(t)) === dbRef);
  c('C20b', 'prima conferma: dichiara i limiti', 'nomina «non cancella niente», «RUOLI», utente CANCELLATO', ['non cancella niente', 'RUOLI', 'CANCELLATO'].map(s => s + ':' + ((t.dialoghi[0] || {}).msg || '').includes(s)).join(' '), ['non cancella niente', 'RUOLI', 'CANCELLATO'].every(s => ((t.dialoghi[0] || {}).msg || '').includes(s)));
  // svuoto due collection e un documento, poi rimetto il backup vero
  await p.evaluate(P => __fakefb.seed(P, { 'lightsheets/LGT00001': null, 'svccaps/WRK00001__0': null, 'timesheets/WRK00001__2026_10_0': null }), H.P);
  t.dialoghi.length = 0;
  await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => {}), p.setInputFiles('#fo-imp-file', fb)]);
  await p.waitForTimeout(1500);
  db = await H.dump(t);
  const d2 = t.dialoghi.map(x => x.tipo + ':' + x.msg.split('\n')[0]).join(' / ');
  c('C21', 'ripristino di un backup vero', 'due conferme, «Ripristino completato», light/massimale/foglio tornati, pagina ricaricata', d2.slice(0, 160) + ' | light=' + !!db['lightsheets/LGT00001'] + ' cap=' + !!db['svccaps/WRK00001__0'] + ' ts=' + !!(db['timesheets/WRK00001__2026_10_0'] && db['timesheets/WRK00001__2026_10_0'].days[7]), t.dialoghi.length === 3 && /Ultima conferma/.test(t.dialoghi[1].msg) && /Ripristino completato/.test(t.dialoghi[2].msg) && !!db['lightsheets/LGT00001'] && !!db['svccaps/WRK00001__0'] && !!(db['timesheets/WRK00001__2026_10_0'] && db['timesheets/WRK00001__2026_10_0'].days[7]));
  const lkR = db['locks/2026_10'] || {}; const lkB = (B.locks.find(x => x.id === '2026_10') || {}).updatedAt;
  c('C21b', 'ripristino: le date (updatedAt) tornano come date', 'Timestamp, non una mappa {seconds,nanoseconds}', 'nel file=' + JSON.stringify(lkB) + ' dopo=' + JSON.stringify(lkR.updatedAt), !!(lkR.updatedAt && lkR.updatedAt.__ts !== undefined));
  // senza schema
  await H.entra(t, H.ADMIN).catch(() => {}); await p.waitForTimeout(600);
  const senza = JSON.parse(JSON.stringify(B)); delete senza.__schema; senza.users = senza.users.slice(0, 1); ['timesheets', 'lightsheets', 'svccaps', 'caps', 'locks'].forEach(k => delete senza[k]);
  fs.writeFileSync(H.OUT + '/fo-a03-senzaschema.json', JSON.stringify(senza));
  t.dialoghi.length = 0; t.risposte.push(false);
  await p.setInputFiles('#fo-imp-file', H.OUT + '/fo-a03-senzaschema.json'); await p.waitForTimeout(500);
  c('C22', 'ripristino senza __schema', 'avvisa «NON dice di che schema è» e chiede', ((t.dialoghi[0] || {}).msg || '').slice(0, 70), /NON dice di che schema/.test((t.dialoghi[0] || {}).msg || '') && t.dialoghi[0].tipo === 'confirm');
  // scrittura caduta durante il ripristino
  await p.evaluate(() => { __fakefb.setCfg({ failWrites: true }); });
  t.dialoghi.length = 0;
  await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => {}), p.setInputFiles('#fo-imp-file', fb)]);
  await p.waitForTimeout(1200);
  const fin = t.dialoghi.map(x => x.msg).join(' || ');
  c('C23', 'ripristino con scrittura caduta', '«Ripristino FINITO A META\'», mai «completato»', fin.replace(/\n/g, ' ').slice(-170), /FINITO A META'/.test(fin) && !/Ripristino completato/.test(fin));
  await p.evaluate(() => { __fakefb.clearCfg(); });
  // --- eliminazioni
  await p.reload(); await H.entra(t, H.ADMIN).catch(() => {}); await p.waitForTimeout(800);
  t.dialoghi.length = 0;
  await p.evaluate(() => delWorker('WRK00001', 'ROSSI MARIO')); await p.waitForTimeout(800);
  db = await H.dump(t);
  c('C24', 'elimina operatore CON ore', 'rifiutato «ha ORE registrate», nulla cancellato', ((t.dialoghi[0] || {}).msg || '').slice(0, 60) + ' users=' + !!db['users/WRK00001'], /ha ORE registrate/.test((t.dialoghi[0] || {}).msg || '') && !!db['users/WRK00001']);
  t.dialoghi.length = 0; t.risposte.push(true, false);
  await p.evaluate(() => delWorker('WRK00002', 'BIANCHI ANNA')); await p.waitForTimeout(800);
  db = await H.dump(t);
  c('C25', 'elimina operatore senza ore: annullo alla seconda conferma', 'due conferme, operatore ancora lì', t.dialoghi.length + ' users=' + !!db['users/WRK00002'], t.dialoghi.length === 2 && !!db['users/WRK00002']);
  t.dialoghi.length = 0;
  await p.evaluate(() => delWorker('WRK00002', 'BIANCHI ANNA')); await p.waitForTimeout(1200);
  db = await H.dump(t);
  c('C26', 'elimina operatore senza ore: confermo', 'users e suoi timesheets rimossi', 'users=' + !!db['users/WRK00002'] + ' ts=' + Object.keys(db).filter(k => /WRK00002/.test(k)).length, !db['users/WRK00002'] && Object.keys(db).filter(k => /WRK00002/.test(k)).length === 0);
  t.dialoghi.length = 0; t.risposte.push(true, true);
  await p.evaluate(() => disableWorker('WRK00003', "D'AMICO LUCIA")); await p.waitForTimeout(1000);
  db = await H.dump(t);
  c('C27', 'disattiva operatore (due conferme)', 'role disabled, ore conservate', t.dialoghi.filter(d => d.tipo === 'confirm').length + ' role=' + db['users/WRK00003'].role + ' ts=' + !!db['timesheets/WRK00003__2026_10_0'], t.dialoghi.filter(d => d.tipo === 'confirm').length === 2 && db['users/WRK00003'].role === 'disabled' && !!db['timesheets/WRK00003__2026_10_0']);
  await p.evaluate(() => { as.view = 'worker'; as.uid = 'WRK00001'; as.name = 'ROSSI MARIO'; as.subTab = 'mese'; renderAdmin(); }); await p.waitForTimeout(1200);
  const dBtn = await p.evaluate(() => !!document.querySelector('button[onclick^="disableWorker"]'));
  c('C27b', 'pulsante «Disattiva operatore» nella scheda', 'presente', dBtn, dBtn);
  await p.evaluate(() => auth.signOut());
  // --- viewer
  await H.entra(t, VW.auth.email); await p.waitForTimeout(1500);
  tx = await H.testo(t, '#app-main');
  c('C28', 'viewer: vede solo gli operatori assegnati', 'ROSSI MARIO sì, D\'AMICO no, sola lettura', 'ROSSI=' + tx.includes('ROSSI MARIO') + ' DAMICO=' + tx.includes("D'AMICO") + ' inputAttivi=' + await p.evaluate(() => [...document.querySelectorAll('.tbl input.ti')].filter(i => !i.disabled).length), tx.includes('ROSSI MARIO') && !tx.includes("D'AMICO") && await p.evaluate(() => [...document.querySelectorAll('.tbl input.ti')].filter(i => !i.disabled).length) === 0);
  await p.evaluate(() => auth.signOut());
  // --- worker: pannelli residuo e massimale, isolamento delle letture
  await p.evaluate(() => { __fakefb.log.length = 0; });
  await H.entra(t, W1.auth.email);
  await p.evaluate(() => { ws.view = 'servizi'; return renderWorker(); }); await p.waitForTimeout(1500);
  tx = await H.testo(t, '#app-main');
  c('C29', 'residuo annuo da «residui» (sola lettura)', 'riquadro «🎯 Le ore che ti restano quest\'anno», 400,00 · 120,50 · «Ti restano 279,50 h» · a.s. 2026/27', (tx.match(/Le ore che ti restano[\s\S]{0,260}/) || ['—'])[0].replace(/\s+/g, ' ').slice(0, 200), /Le ore che ti restano/.test(tx) && /400,00 ore/.test(tx) && /120,50/.test(tx) && /Ti restano 279,50 h/.test(tx) && /anno scolastico 2026\/27/.test(tx));
  c('C29b', 'frase del residuo nomina i permessi (rev 9)', '«le ore fatte, le assenze retribuite e i permessi retribuiti»', /le ore fatte, le assenze retribuite e i permessi retribuiti/.test(tx), /le ore fatte, le assenze retribuite e i permessi retribuiti/.test(tx));
  c('C30', 'pannello «🎯 I tuoi massimali»', '1° servizio: Restano 80,00 h (20,00 / 100,00)', (tx.match(/I tuoi massimali[\s\S]{0,200}/) || ['—'])[0].replace(/\s+/g, ' ').slice(0, 150), /Restano 80,00 h/.test(tx) && /20,00 \/ 100,00 h/.test(tx));
  const letture = await p.evaluate(() => __fakefb.log.filter(o => o.op === 'get' || o.op === 'query').map(o => o.op + ' ' + o.path + ' ' + JSON.stringify(o.data || '')));
  const estranee = letture.filter(s => !/WRK00001/.test(s) && !/^get locks\//.test(s) && !/^(get|query) (locks|lightsheets)/.test(s));
  c('C31', 'worker: legge solo i propri documenti (interfaccia)', 'nessuna lettura di dati di altri', estranee.length + ' ' + estranee.slice(0, 3).join(' | '), estranee.length === 0);
  const wr = (await H.scritture(t)).filter(x => /residui/.test(x.path));
  c('C32', 'residui: nessuna scrittura dall\'app', '0 scritture su residui', wr.length, wr.length === 0);
  await p.evaluate(() => auth.signOut());
  // senza documento residui / lettura negata → nessun riquadro e nessun errore
  await p.evaluate(P => { __fakefb.seed(P, { 'residui/WRK00001': null }); }, H.P);
  await H.entra(t, W1.auth.email); await p.evaluate(() => { ws.view = 'servizi'; return renderWorker(); }); await p.waitForTimeout(1000);
  const assente = !/Le ore che ti restano/.test(await H.testo(t, '#app-main'));
  await p.evaluate(() => auth.signOut());
  await p.evaluate(P => { __fakefb.seed(P, { 'residui/WRK00001': { tetto: 400, usate: 10, restano: 390, periodo: 'civile', anno: 2026 } }); __fakefb.deny = [{ coll: 'residui', op: 'read' }]; }, H.P);
  const nErr = t.errori.length;
  await H.entra(t, W1.auth.email); await p.evaluate(() => { ws.view = 'servizi'; return renderWorker(); }); await p.waitForTimeout(1000);
  const negato = !/Le ore che ti restano/.test(await H.testo(t, '#app-main')) && /AGGIUNGI UN SERVIZIO|CONFIGURA I TUOI SERVIZI/.test(await H.testo(t, '#app-main'));
  c('C33', 'residuo: documento assente / lettura negata', 'riquadro non compare, pagina regolare, nessun errore', 'assente=' + assente + ' negato=' + negato + ' errori+' + (t.errori.length - nErr), assente && negato && t.errori.length === nErr);
  await p.evaluate(() => { __fakefb.deny = []; });
  const e = await H.fine(t);
  c('C34', 'errori di pagina (admin)', '0', e.length + ' ' + e.join('|').slice(0, 200), e.length === 0);
  await browser.close();
  H.riepilogo('fo-a03-admin');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(1); });
