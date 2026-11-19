// fo-a07 — prova di fumo delle schede admin non coperte altrove (Quadro anno civile, Quadro anno
// scolastico, Vista d'insieme, Operatori light) con i totali del seme, ed export della vista d'insieme
// e degli operatori light. SOLO DATI INVENTATI.
const H = require('./fo-a00-comune.cjs');
const { c } = H;
(async () => {
  const browser = await H.chromium.launch();
  const ADM = H.u('ADMIN0001', H.ADMIN, 'admin', 'AMMINISTRAZIONE', 'PROVA');
  const W1 = H.u('WRK00001', 'rossi.prova@esempio.it', 'worker', 'ROSSI', 'MARIO');
  const ED = H.u('EDT00001', 'editor.prova@esempio.it', 'editor', 'EDITORI', 'ELIO');
  const d0 = { 1: { t1f: '900', t1t: '1300' }, 2: { t1f: '14.30', t1t: '18.30' }, 5: { t1f: '14h30', t1t: '18h30' }, 6: { t1f: '9', t1t: '13' }, 7: { t1f: '130', t1t: '530' }, 8: { absence: 'FERIE' } };
  const docs = Object.assign({}, H.ts('WRK00001', 2026, 10, 0, d0, { workerName: 'ROSSI MARIO' }),
    H.ts('WRK00001', 2026, 10, 1, { 8: { absence: 'FERIE' }, 12: { t1f: '09:00', t1t: '11:00' } }, { workerName: 'ROSSI MARIO', mansione: 'Insegnante/Istruttore', sede: 'Casa di quartiere', dettagli: 'PIAZZA FINTA 2' }),
    { 'lightsheets/LGT00001': { editorUid: 'EDT00001', editorName: 'EDITORI ELIO', name: 'LUCE LINA', ruolo: 'Insegnante/Istruttore', retrib: 'Retribuito', materia: 'MUSICA', comune: 'PROVOPOLI', sede: 'VIA LUCE 3', hours: { 2026: { 0: 3, 5: 2, 6: 1.5 } }, skip: {} } });
  const t = await H.apri(browser, H.seme('a07', [ADM, W1, ED], docs));
  const p = t.page;
  await H.entra(t, H.ADMIN);
  for (const [v, atteso] of [['quadro', /22,00/], ['quadroSc', /22,00/], ['insieme', /22,00|ROSSI/], ['light', /LUCE LINA/]]) {
    const n0 = t.errori.length;
    await p.evaluate(v => { as.view = v; as.year = 2026; as.month = 10; as.scolYear = 2026; as.lightYear = 2026; renderAdmin(); }, v); await p.waitForTimeout(2500);
    const tx = (await H.testo(t, '#app-main')).replace(/\s+/g, ' ');
    const sw = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    c('F-' + v, 'scheda admin «' + v + '»', 'si apre, dati del seme (' + atteso + '), nessun errore', (tx.match(atteso) || ['—'])[0] + ' errori+' + (t.errori.length - n0) + ' noScroll=' + sw, atteso.test(tx) && t.errori.length === n0);
  }
  // Vista d'insieme: export
  await p.evaluate(() => { as.view = 'insieme'; renderAdmin(); }); await p.waitForTimeout(2000);
  const b = p.locator('button[onclick^="exportInsieme"]');
  if (await b.count()) {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }).catch(() => null), b.first().click()]);
    c('F-exp-insieme', 'export della Vista d\'insieme', 'scarica un file', dl ? dl.suggestedFilename() : 'nessun download', !!dl);
  } else c('F-exp-insieme', 'export della Vista d\'insieme', 'pulsante presente', 'pulsante non trovato', 'NON VERIFICATO');
  await p.evaluate(() => auth.signOut()); await H.entra(t, ED.auth.email);
  await p.evaluate(() => { ws.view = 'light'; ls.schoolYear = 2025; return renderWorker(); }); await p.waitForTimeout(1200);
  const tx = (await H.testo(t, '#app-main')).replace(/\s+/g, ' ');
  c('F-light-ed', 'editor: foglio operatori light a.s. 2025/26', 'LUCE LINA, totale 6,5 ore (3 + 2 + 1,5)', (tx.match(/LUCE LINA.{0,80}/) || ['—'])[0], /LUCE LINA/.test(tx) && /6,5/.test(tx));
  const bl = p.locator('button[onclick="exportLightExcel()"]');
  if (await bl.count()) {
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }).catch(() => null), bl.first().click()]);
    c('F-exp-light', 'export Excel operatori light', 'scarica un .xlsx', dl ? dl.suggestedFilename() : 'nessun download', !!dl && /\.xlsx$/.test(dl.suggestedFilename()));
  } else c('F-exp-light', 'export Excel operatori light', 'pulsante presente', 'non trovato', 'NON VERIFICATO');
  const e = await H.fine(t);
  c('F-err', 'errori di pagina (quadri)', '0', e.length + ' ' + e.join('|').slice(0, 200), e.length === 0);
  await browser.close();
  H.riepilogo('fo-a07-quadri');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(1); });
