// fo-a02 — conteggio ore (formati storici), assenze su più servizi, campi non conteggiati,
// salvataggio automatico 600 ms e 💾, guasti di scrittura/lettura e le TRE bande, mese bloccato
// per l'operatore, mese vuoto. SOLO DATI INVENTATI.
const H = require('./fo-a00-comune.cjs');
const { c } = H;
const TXT_ORE = '⚠️ ORE NON SALVATE — il collegamento è caduto. Non chiudere la pagina: quando torna la linea premi 💾 Salva.';
const TXT_ASS = "⚠️ ASSENZA NON SALVATA — il collegamento è caduto. Il 💾 Salva non la rimette: quando torna la linea riscegli l'assenza dalla tendina.";
const TXT_LET = 'ℹ️ NON HAI PERSO NIENTE — il collegamento è caduto mentre la pagina rileggeva i dati, quindi il mese può sembrare vuoto. I tuoi dati sono nel database: quando torna la linea ricarica la pagina e tornano tutti.';
(async () => {
  const browser = await H.chromium.launch();
  const ADM = H.u('ADMIN0001', H.ADMIN, 'admin', 'AMMINISTRAZIONE', 'PROVA');
  const W1 = H.u('WRK00001', 'rossi.prova@esempio.it', 'worker', 'ROSSI', 'MARIO');
  const uid = W1.auth.uid;
  const d0 = { 1: { t1f: '900', t1t: '1300' }, 2: { t1f: '14.30', t1t: '18.30' }, 5: { t1f: '14h30', t1t: '18h30' }, 6: { t1f: '9', t1t: '13' }, 7: { t1f: '130', t1t: '530' }, 8: { absence: 'FERIE' } };
  const d1 = { 8: { absence: 'FERIE' }, 12: { t1f: '09:00', t1t: '11:00', perm: '1h', spole: '2', pausa: '1', nonImp: 'X' } };
  const docs = Object.assign({}, H.ts(uid, 2026, 10, 0, d0, { workerName: 'ROSSI MARIO' }), H.ts(uid, 2026, 10, 1, d1, { workerName: 'ROSSI MARIO', mansione: 'Insegnante/Istruttore', sede: 'Casa di quartiere', dettagli: 'PIAZZA FINTA 2' }),
    { 'locks/2026_9': { locked: true, year: 2026, month: 9 } }, H.ts(uid, 2026, 9, 0, { 3: { t1f: '08:00', t1t: '10:00' } }, { workerName: 'ROSSI MARIO' }));
  const t = await H.apri(browser, H.seme('a02', [ADM, W1], docs));
  const p = t.page;
  await H.entra(t, W1.auth.email);
  await H.apriFoglio(t, 2026, 10, 0);
  const foot = async () => p.evaluate(() => { const f = document.querySelectorAll('.tbl tfoot tr td'); return f.length ? f[f.length - 1].textContent.trim() : ''; });
  c('B01', 'formati storici 900/14.30/14h30/9/130 → ore', 'totale servizio 20,00', await foot(), (await foot()) === '20,00');
  const vis = await p.evaluate(() => [...document.querySelectorAll('.tbl tbody tr')].slice(0, 7).map(r => [...r.querySelectorAll('input[data-fld=t1f]')].map(i => i.value).join('')).join(','));
  c('B02', 'formati storici mostrati normalizzati', '09:00,14:30,,,14:30,09:00,01:30', vis, vis === '09:00,14:30,,,14:30,09:00,01:30');
  const r8 = await p.evaluate(() => { const r = document.querySelectorAll('.tbl tbody tr')[7]; return r.className + '|' + r.querySelector('input[data-fld=t1f]').disabled; });
  c('B03', 'giorno con assenza: riga «fe» e caselle spente', 'fe|true', r8, r8 === 'fe|true');
  // servizio 2: perm/spole/pausa/nonImp non sono ore
  await H.apriFoglio(t, 2026, 10, 1);
  c('B04', 'permesso/spole/pausa/nonImp non conteggiati', 'totale servizio 2,00 (solo 09-11)', await foot(), (await foot()) === '2,00');
  // compilazione + salvataggio automatico 600 ms
  await H.apriFoglio(t, 2026, 10, 0);
  const cella = (d, f) => p.locator('.tbl tbody tr').nth(d - 1).locator('input[data-fld=' + f + ']');
  await cella(13, 't1f').fill('0800'); await cella(13, 't1t').fill('1200');
  await p.waitForTimeout(250);
  let db = await H.dump(t); const k0 = 'timesheets/' + uid + '__2026_10_0';
  const prima = JSON.stringify((db[k0].days || {})[13] || null);
  await p.waitForTimeout(800);
  db = await H.dump(t); const dopo = (db[k0].days || {})[13] || {};
  c('B05', 'salvataggio automatico dopo 600 ms', 'prima dei 600 ms niente; dopo t1f 0800/1200 nel DB', 'prima=' + prima + ' dopo=' + JSON.stringify(dopo), prima === 'null' && /0800|08:00/.test(dopo.t1f || '') && /1200|12:00/.test(dopo.t1t || ''));
  await cella(13, 't1t').press('Tab'); await p.waitForTimeout(800);
  db = await H.dump(t);
  c('B05b', 'normalizzazione 0800 → 08:00 nel database', '08:00 / 12:00', JSON.stringify(db[k0].days[13]), db[k0].days[13].t1f === '08:00' && db[k0].days[13].t1t === '12:00');
  c('B06', 'totale aggiornato a video', '24,00', await foot(), (await foot()) === '24,00');
  await p.click('#btn-save'); await p.waitForTimeout(250);
  const bt = await p.textContent('#btn-save');
  c('B07', '💾 Salva riuscito', '«✓ Salvato!»', bt, /Salvato/.test(bt));
  // orario non valido / accavallato
  await cella(20, 't1f').fill('1300'); await cella(20, 't1t').fill('0900'); await cella(20, 't1t').press('Tab'); await p.waitForTimeout(800);
  c('B08', 'fascia rovesciata (13→09)', '0 ore per quel giorno (nessun negativo)', await foot(), (await foot()) === '24,00');
  await cella(20, 't1f').fill(''); await cella(20, 't1t').fill(''); await cella(20, 't1t').press('Tab'); await p.waitForTimeout(900);
  // --- guasto di scrittura: banda ORE
  await p.waitForTimeout(1600);
  await p.evaluate(() => { __fakefb.failWrites = true; });
  await cella(14, 't1f').fill('0900'); await cella(14, 't1t').fill('1000'); await p.waitForTimeout(1000);
  const bOre = await p.evaluate(() => { const b = document.getElementById('banda-salv'); return b && getComputedStyle(b).display !== 'none' ? b.textContent.replace('✕', '').trim() : null; });
  c('B09', 'scrittura caduta → banda rossa ORE', 'testo esatto «' + TXT_ORE.slice(0, 30) + '…»', bOre, bOre === TXT_ORE);
  db = await H.dump(t);
  c('B10', 'scrittura caduta: nel DB non arriva niente', 'giorno 14 assente', JSON.stringify(db[k0].days[14] || null), !db[k0].days[14]);
  await p.click('#btn-save'); await p.waitForTimeout(300);
  c('B11', '💾 con scrittura caduta', '«Errore!» (non «Salvato»)', await p.textContent('#btn-save'), /Errore/.test(await p.textContent('#btn-save')));
  await p.waitForTimeout(2200);
  // assenza con scrittura caduta → seconda banda
  t.dialoghi.length = 0;
  await p.locator('.tbl tbody tr').nth(14).locator('select[onchange^="onAbs"]').selectOption('MALATTIA');
  await p.waitForTimeout(1200);
  const st = await p.evaluate(() => { const g = id => { const e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), txt: e.textContent.replace('✕', '').trim() }; }; return { s: g('banda-salv'), a: g('banda-ass'), l: g('banda-lett'), vh: innerHeight }; });
  c('B12', 'assenza con scrittura caduta → avviso a comparsa', '«L\'assenza NON è stata salvata»', t.dialoghi.map(x => x.msg).join('|').slice(0, 90), /assenza NON è stata salvata/i.test(t.dialoghi.map(x => x.msg).join('|')));
  c('B13', 'banda ASSENZA, testo esatto', TXT_ASS.slice(0, 30) + '…', st.a && st.a.txt, st.a && st.a.txt === TXT_ASS);
  c('B14', 'la banda ORE resta (rev 17)', 'visibile con il suo testo', st.s && st.s.txt.slice(0, 40), st.s && st.s.txt === TXT_ORE);
  c('B15', 'bande impilate senza sovrapporsi', 'ore in fondo, assenza sopra', JSON.stringify({ s: st.s && [st.s.t, st.s.b], a: st.a && [st.a.t, st.a.b], vh: st.vh }), st.s && st.a && st.a.b <= st.s.t + 1 && st.s.b <= st.vh + 1);
  db = await H.dump(t);
  c('B16', 'assenza caduta: niente nel DB, tendina non mostra l\'assenza', 'giorno 15 assente, tendina vuota', JSON.stringify(db[k0].days[15] || null) + ' / ' + await p.locator('.tbl tbody tr').nth(14).locator('select[onchange^="onAbs"]').inputValue(), !db[k0].days[15] && (await p.locator('.tbl tbody tr').nth(14).locator('select[onchange^="onAbs"]').inputValue()) === '');
  // guasto di lettura → banda blu, impilata sopra
  await p.evaluate(() => { __fakefb.failReads = true; });
  await p.evaluate(() => { cache = {}; return renderWorker(); }).catch(() => {}); await p.waitForTimeout(1200);
  const st3 = await p.evaluate(() => { const g = id => { const e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), bg: getComputedStyle(e).backgroundColor, txt: e.textContent.replace('✕', '').trim() }; }; return { s: g('banda-salv'), a: g('banda-ass'), l: g('banda-lett') }; });
  c('B17', 'lettura caduta → banda blu, testo esatto', TXT_LET.slice(0, 30) + '… su #1D5F8A', st3.l && (st3.l.bg + ' ' + st3.l.txt.slice(0, 40)), st3.l && st3.l.txt === TXT_LET && /29, 95, 138/.test(st3.l.bg));
  c('B18', 'TRE bande impilate: ore · assenza · lettura', 'nessuna sovrapposizione', JSON.stringify({ s: st3.s && [st3.s.t, st3.s.b], a: st3.a && [st3.a.t, st3.a.b], l: st3.l && [st3.l.t, st3.l.b] }), st3.s && st3.a && st3.l && st3.l.b <= st3.a.t + 1 && st3.a.b <= st3.s.t + 1);
  await p.screenshot({ path: H.OUT + '/fo-a02-tre-bande-1280.png' });
  // ✕ sulla banda ORE → le altre si ricompattano
  await p.click('#banda-salv button'); await p.waitForTimeout(200);
  const st4 = await p.evaluate(() => ({ a: document.getElementById('banda-ass').style.bottom, l: document.getElementById('banda-lett').style.bottom, ha: Math.round(document.getElementById('banda-ass').getBoundingClientRect().height) }));
  c('B19', '✕ sulla banda ORE ricompatta le altre', 'assenza a bottom 0, lettura sopra l\'assenza', JSON.stringify(st4), st4.a === '0px' && st4.l === st4.ha + 'px');
  // torna la linea: la lettura riuscita fa sparire la blu
  await p.evaluate(() => { __fakefb.failReads = false; __fakefb.failWrites = false; });
  await p.evaluate(() => { cache = {}; return renderWorker(); }); await p.waitForTimeout(900);
  const lettOn = await p.evaluate(() => { const e = document.getElementById('banda-lett'); return !!e && getComputedStyle(e).display !== 'none'; });
  c('B20', 'lettura tornata → banda blu sparisce da sé', 'nascosta', lettOn, !lettOn);
  // riscegliendo l'assenza sparisce solo la sua banda; la banda ore (riaperta) resta finché 💾
  await p.evaluate(() => bandaSalvataggio(true));
  await p.locator('.tbl tbody tr').nth(14).locator('select[onchange^="onAbs"]').selectOption('MALATTIA'); await p.waitForTimeout(1200);
  const st5 = await p.evaluate(() => ({ a: getComputedStyle(document.getElementById('banda-ass')).display, s: getComputedStyle(document.getElementById('banda-salv')).display }));
  c('B21', 'assenza riscelta a linea buona: chiude SOLO la sua banda', 'assenza none, ore flex', JSON.stringify(st5), st5.a === 'none' && st5.s === 'flex');
  db = await H.dump(t); const k1 = 'timesheets/' + uid + '__2026_10_1';
  c('B22', 'assenza scritta su TUTTI i servizi configurati', 'MALATTIA su servizio 1 e 2 (giorno 15)', (db[k0].days[15] || {}).absence + '/' + (db[k1].days[15] || {}).absence, (db[k0].days[15] || {}).absence === 'MALATTIA' && (db[k1].days[15] || {}).absence === 'MALATTIA');
  // le ore del giorno 14 non erano nel DB: con 💾 tornano? (le ore perse in cache sono state buttate dal rinfresco)
  await H.apriFoglio(t, 2026, 10, 0);
  await cella(14, 't1f').fill('0900'); await cella(14, 't1t').fill('1000');
  await p.click('#btn-save'); await p.waitForTimeout(500);
  const st6 = await p.evaluate(() => getComputedStyle(document.getElementById('banda-salv')).display);
  db = await H.dump(t);
  c('B23', '💾 riuscito chiude la banda ORE e scrive', 'banda none, giorno 14 nel DB', st6 + ' ' + JSON.stringify(db[k0].days[14] || null), st6 === 'none' && !!(db[k0].days[14] && db[k0].days[14].t1f));
  // assenza su giorno con ore → conferma; annulla = niente cambia
  t.risposte.push(false);
  await p.locator('.tbl tbody tr').nth(13).locator('select[onchange^="onAbs"]').selectOption('FERIE'); await p.waitForTimeout(900);
  db = await H.dump(t);
  c('B24', 'assenza su un giorno con ore: chiede conferma (annullo)', 'domanda «ha già delle ore», ore intatte', (t.dialoghi.slice(-1)[0] || {}).msg.slice(0, 60) + ' / ' + JSON.stringify(db[k0].days[14]), /già delle ore/.test((t.dialoghi.slice(-1)[0] || {}).msg) && db[k0].days[14].t1f && !db[k0].days[14].absence);
  // togliere l'assenza da un servizio la toglie da tutti
  await p.locator('.tbl tbody tr').nth(14).locator('select[onchange^="onAbs"]').selectOption(''); await p.waitForTimeout(1000);
  db = await H.dump(t);
  const inCache = await p.evaluate(uid => [0, 1].map(i => ((cache[uid + '__2026_10_' + i] || {}).days || {})[15]), uid);
  const tolto = !(db[k0].days[15] || {}).absence && !(db[k1].days[15] || {}).absence;
  const batchLog = (await H.scritture(t)).filter(x => x.op === 'batch').slice(-1)[0];
  c('B25', 'togliere l\'assenza da un servizio la toglie da tutti', 'giorno 15 senza assenza su 1 e 2', 'DB=' + JSON.stringify([(db[k0].days[15] || {}).absence, (db[k1].days[15] || {}).absence]) + ' cache=' + JSON.stringify(inCache) + ' batch=' + JSON.stringify(batchLog && batchLog.data && batchLog.data.map(o => o.data.days[15])),
    tolto ? true : (JSON.stringify(inCache) === '[{},{}]' ? 'NON VERIFICATO' : false));
  // mese bloccato
  await H.apriFoglio(t, 2026, 9, 0);
  const lk = await p.evaluate(() => ({ msg: /Mese chiuso dall'amministratore/.test(document.body.textContent), dis: [...document.querySelectorAll('.tbl tbody input.ti')].filter(i => !i.disabled).length, save: getComputedStyle(document.getElementById('btn-save')).display }));
  c('B26', 'mese chiuso: avviso, caselle spente, 💾 nascosto', 'avviso, 0 caselle attive, none', JSON.stringify(lk), lk.msg && lk.dis === 0 && lk.save === 'none');
  const w0 = (await H.scritture(t)).length;
  await p.evaluate(() => uD(5, 't1f', '07:00')); await p.waitForTimeout(900);
  c('B27', 'mese chiuso: scrittura forzata da codice', 'rifiutata con avviso, nessuna scrittura', ((t.dialoghi.slice(-1)[0] || {}).msg || '').slice(0, 50) + ' scritture+' + ((await H.scritture(t)).length - w0), /chiuso dall'amministratore/.test((t.dialoghi.slice(-1)[0] || {}).msg || '') && (await H.scritture(t)).length === w0);
  // mese vuoto: comportamento VOLUTO (copia la configurazione)
  await H.apriFoglio(t, 2026, 12, 0); await p.waitForTimeout(500);
  db = await H.dump(t); const kd = db['timesheets/' + uid + '__2026_12_0'];
  c('B28', 'mese vuoto aperto (comportamento voluto)', 'nasce documento con mansione copiata e days {}', kd ? (kd.mansione + ' days=' + JSON.stringify(kd.days)) : 'nessun documento', kd && kd.mansione === 'Educatore/Assistente' && JSON.stringify(kd.days) === '{}');
  // admin: totale mese con assenza contata una volta
  await p.evaluate(() => auth.signOut()); await p.waitForSelector('#app-login:not(.hide)');
  await H.entra(t, H.ADMIN);
  await p.evaluate(uid => { as.view = 'worker'; as.uid = uid; as.name = 'ROSSI MARIO'; as.subTab = 'mese'; as.year = 2026; as.month = 10; return renderAdmin(); }, uid);
  await p.waitForTimeout(1500);
  const tx = await H.testo(t, '#app-main'); const tm = (tx.match(/TOTALE MESE[\s\S]{0,400}/) || [''])[0];
  c('B29', 'admin: assenza su 2 servizi contata UNA volta', 'Assenze (1gg totali) FERIE 1gg', (tm.match(/Assenze \(\d+gg totali\)[^]*?gg/) || ['—'])[0], /Assenze \(1gg totali\)/.test(tm) && /FERIE:\s*1gg/.test(tm));
  c('B30', 'admin: totale ore del mese', 'ORDINARIE + INDIRETTE: 27,00 (20+4+1 sul 1°, 2 sul 2°)', (tm.match(/ORDINARIE \+ INDIRETTE: [\d,]+/) || ['—'])[0], /ORDINARIE \+ INDIRETTE: 27,00/.test(tm));
  c('B31', 'admin: permessi/spole/pause riportati a parte', 'Permessi 1h, Spole 2, Pause 1', (tm.match(/Permessi:[^S]*Spole:\s*\S+/) || ['—'])[0], /Permessi:\s*1h/.test(tm) && /Spole:\s*2/.test(tm) && /Pause pranzo:\s*1/.test(tm));
  const e = await H.fine(t);
  c('B32', 'errori di pagina (ore e bande)', '0', e.length + ' ' + e.join('|').slice(0, 200), e.length === 0);
  await browser.close();
  H.riepilogo('fo-a02-ore-bande');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(1); });
