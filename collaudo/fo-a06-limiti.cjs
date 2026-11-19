// fo-a06 — casi limite del foglio: sovrapposizioni, testo non orario, orari impossibili, cancellazione,
// «Esci» o ricarica subito dopo aver scritto, doppio clic sul 💾. SOLO DATI INVENTATI.
const H = require('./fo-a00-comune.cjs');
const { c } = H;
(async () => {
  const browser = await H.chromium.launch();
  const W1 = H.u('WRK00001', 'rossi.prova@esempio.it', 'worker', 'ROSSI', 'MARIO');
  const uid = W1.auth.uid;
  const docs = Object.assign({}, H.ts(uid, 2026, 10, 0, { 1: { t1f: '09:00', t1t: '13:00' } }, { workerName: 'ROSSI MARIO' }),
    H.ts(uid, 2026, 10, 1, { 3: { t1f: '10:00', t1t: '11:00' } }, { workerName: 'ROSSI MARIO', mansione: 'Insegnante/Istruttore', sede: 'Casa di quartiere', dettagli: 'PIAZZA FINTA 2' }));
  const t = await H.apri(browser, H.seme('a06', [W1], docs));
  const p = t.page; const k0 = 'timesheets/' + uid + '__2026_10_0';
  await H.entra(t, W1.auth.email);
  await H.apriFoglio(t, 2026, 10, 0);
  const cella = (d, f) => p.locator('.tbl tbody tr').nth(d - 1).locator('input[data-fld=' + f + ']');
  const foot = async () => p.evaluate(() => { const f = document.querySelectorAll('.tbl tfoot tr td'); return f[f.length - 1].textContent.trim(); });
  // sovrapposizione nello stesso servizio
  await cella(5, 't1f').fill('09:00'); await cella(5, 't1t').fill('12:00'); await cella(5, 't1t').press('Tab');
  await cella(5, 't2f').fill('11:00'); await cella(5, 't2t').fill('13:00'); t.dialoghi.length = 0; await cella(5, 't2t').press('Tab'); await p.waitForTimeout(900);
  let db = await H.dump(t);
  c('E01', 'sovrapposizione fra due fasce dello stesso giorno', 'avviso «Sovrapposizione oraria», casella appena scritta (t2t) svuotata', ((t.dialoghi[0] || {}).msg || '—').split('\n')[0] + ' t2t=' + JSON.stringify((db[k0].days[5] || {}).t2t), /Sovrapposizione oraria/.test((t.dialoghi[0] || {}).msg || '') && !(db[k0].days[5] || {}).t2t);
  // sovrapposizione fra servizi (servizio 2 ha il 3 ottobre 10-11)
  await p.evaluate(() => preloadAllTS(CU.uid));
  await cella(3, 't1f').fill('09:30'); await cella(3, 't1t').fill('10:30'); t.dialoghi.length = 0; await cella(3, 't1t').press('Tab'); await p.waitForTimeout(900);
  c('E02', 'sovrapposizione con un altro servizio', 'avviso «Sovrapposizione tra servizi diversi»', ((t.dialoghi[0] || {}).msg || '—').split('\n')[0], /tra servizi diversi/.test((t.dialoghi[0] || {}).msg || ''));
  // testo non orario
  t.dialoghi.length = 0;
  await cella(7, 't1f').fill('abc'); await cella(7, 't1t').fill('12:00'); await cella(7, 't1t').press('Tab'); await p.waitForTimeout(900);
  db = await H.dump(t);
  c('E03', 'testo non orario «abc»', 'rifiutato o segnalato', 'DB=' + JSON.stringify(db[k0].days[7]) + ' avvisi=' + t.dialoghi.length + ' tot=' + await foot(), t.dialoghi.length > 0 || !(db[k0].days[7] || {}).t1f ? true : 'PARZIALE');
  await cella(7, 't1f').fill(''); await cella(7, 't1t').fill(''); await cella(7, 't1t').press('Tab'); await p.waitForTimeout(900);
  // orario impossibile 25:00
  const prima = await foot();
  t.dialoghi.length = 0;
  await cella(8, 't1f').fill('20:00'); await cella(8, 't1t').fill('25:00'); await cella(8, 't1t').press('Tab'); await p.waitForTimeout(900);
  db = await H.dump(t);
  const dopo = await foot();
  c('E04', 'orario impossibile 20:00 → 25:00', 'rifiutato o segnalato, non contato come 5 ore', 'prima=' + prima + ' dopo=' + dopo + ' DB=' + JSON.stringify(db[k0].days[8]) + ' avvisi=' + t.dialoghi.length, dopo === prima || t.dialoghi.length > 0);
  await cella(8, 't1f').fill('09:00'); await cella(8, 't1t').fill('9:75'); await cella(8, 't1t').press('Tab'); await p.waitForTimeout(900);
  db = await H.dump(t);
  c('E05', 'minuti impossibili 09:00 → 9:75', 'rifiutato o segnalato, non contato', 'tot=' + await foot() + ' DB=' + JSON.stringify(db[k0].days[8]) + ' avvisi=' + t.dialoghi.length, (await foot()) === prima || t.dialoghi.length > 0);
  await cella(8, 't1f').fill(''); await cella(8, 't1t').fill(''); await cella(8, 't1t').press('Tab'); await p.waitForTimeout(900);
  // cancellare un orario riduce il totale e arriva nel DB
  await cella(1, 't1t').fill(''); await cella(1, 't1t').press('Tab'); await p.waitForTimeout(900);
  db = await H.dump(t);
  c('E06', 'cancellazione di un orario', 'totale ricalcolato, campo vuoto nel DB', 'tot=' + await foot() + ' DB=' + JSON.stringify(db[k0].days[1]), !(db[k0].days[1] || {}).t1t);
  // doppio clic sul 💾
  const nPrima = (await H.scritture(t)).length;
  await p.dblclick('#btn-save'); await p.waitForTimeout(600);
  c('E07', 'doppio clic sul 💾', 'una sola scrittura, «✓ Salvato!», nessun errore', 'scritture+' + ((await H.scritture(t)).length - nPrima) + ' ' + await p.textContent('#btn-save') + ' errori=' + t.errori.length, ((await H.scritture(t)).length - nPrima) <= 1 && /Salvato/.test(await p.textContent('#btn-save')) && t.errori.length === 0);
  await p.waitForTimeout(1600);
  // ricarica subito dopo aver scritto (flush del beforeunload)
  await cella(10, 't1f').fill('08:00'); await cella(10, 't1t').fill('09:00');
  await p.reload(); await p.waitForTimeout(1200);
  db = await H.dump(t);
  c('E08', 'ricarica entro 600 ms dalla scrittura', 'l\'ultimo dato è nel DB (flush alla chiusura)', JSON.stringify(db[k0].days[10] || null), !!(db[k0].days[10] && db[k0].days[10].t1t));
  // «Esci» subito dopo aver scritto
  await H.entra(t, W1.auth.email).catch(() => {});
  await H.apriFoglio(t, 2026, 10, 0);
  const nErr = t.errori.length;
  await cella(12, 't1f').fill('08:00'); await cella(12, 't1t').fill('11:00');
  await p.click('.topbar button:has-text("Esci")'); await p.waitForTimeout(1500);
  db = await H.dump(t);
  c('E09', '«Esci» entro 600 ms dalla scrittura', 'l\'ultimo dato è nel DB, nessun errore', 'DB=' + JSON.stringify(db[k0].days[12] || null) + ' errori+' + (t.errori.length - nErr) + ' ' + t.errori.slice(nErr).join('|').slice(0, 90), !!(db[k0].days[12] && db[k0].days[12].t1t) && t.errori.length === nErr);
  // «Esci» con il cursore ancora in una casella, ma 2 s dopo l'ultima battitura
  await H.entra(t, W1.auth.email).catch(() => {});
  await H.apriFoglio(t, 2026, 10, 0);
  const nErr2 = t.errori.length;
  await cella(13, 't1f').fill('08:00'); await cella(13, 't1t').fill('11:00'); await p.waitForTimeout(2000);
  await p.click('.topbar button:has-text("Esci")'); await p.waitForTimeout(1500);
  db = await H.dump(t);
  c('E10', '«Esci» col cursore in una casella, 2 s dopo l\'ultima battitura', 'dato nel DB, nessun errore di pagina', 'DB=' + JSON.stringify(db[k0].days[13] || null) + ' errori+' + (t.errori.length - nErr2), !!(db[k0].days[13] && db[k0].days[13].t1t) && t.errori.length === nErr2 ? true : (!!(db[k0].days[13] && db[k0].days[13].t1t) ? 'PARZIALE' : false));
  await H.fine(t);
  await browser.close();
  H.riepilogo('fo-a06-limiti');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(1); });
