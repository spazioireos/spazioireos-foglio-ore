// fo-a04 — grafica a 390 · 768 · 1280 · 1700 px: niente scorrimento laterale, tabella del mese 906px a
// 390, nessuna scritta < 12,5px fuori dalla tabella (salvo la targhetta), tre bande non sovrapposte,
// caselle del foglio comode da dito sul telefono. SOLO DATI INVENTATI.
const H = require('./fo-a00-comune.cjs');
const { c } = H;
const LARG = [390, 768, 1280, 1700];
async function misura(p) {
  return p.evaluate(() => {
    const piccole = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('.tbl-wrap, table.tbl, .revtag, script, style')) return;
      const st = getComputedStyle(el); if (st.display === 'none' || st.visibility === 'hidden') return;
      const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return;
      const ha = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!ha) return;
      if (parseFloat(st.fontSize) < 12.5) piccole.push(st.fontSize + ':' + [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 30));
    });
    const tb = document.querySelector('table.tbl');
    return { sw: document.documentElement.scrollWidth, iw: innerWidth, tbl: tb ? Math.round(tb.getBoundingClientRect().width) : null, piccole };
  });
}
(async () => {
  const browser = await H.chromium.launch();
  const ADM = H.u('ADMIN0001', H.ADMIN, 'admin', 'AMMINISTRAZIONE', 'PROVA');
  const W1 = H.u('WRK00001', 'rossi.prova@esempio.it', 'worker', 'ROSSI', 'MARIO');
  const docs = Object.assign({}, H.ts('WRK00001', 2026, 11, 0, { 2: { t1f: '09:00', t1t: '13:00' } }, { workerName: 'ROSSI MARIO' }),
    H.ts('WRK00001', 2026, 11, 1, {}, { workerName: 'ROSSI MARIO', mansione: 'Insegnante/Istruttore', sede: 'Casa di quartiere', dettagli: 'PIAZZA FINTA 2' }),
    { 'svccaps/WRK00001__0': { workerUid: 'WRK00001', serviceIdx: 0, maxHours: 100, periodType: 'civile', periodYear: 2026 },
      'residui/WRK00001': { tetto: 400, usate: 12, restano: 388, periodo: 'civile', anno: 2026 } });
  for (const L of LARG) {
    const t = await H.apri(browser, H.seme('a04-' + L, [ADM, W1], docs), { viewport: { width: L, height: 900 } });
    const p = t.page;
    await p.waitForSelector('#app-login:not(.hide)');
    let m = await misura(p);
    c('G-' + L + '-login', 'accesso a ' + L + 'px', 'niente scorrimento laterale, 0 scritte < 12,5px', 'sw=' + m.sw + '/' + m.iw + ' piccole=' + m.piccole.length + ' ' + m.piccole.slice(0, 3).join(' | '), m.sw <= m.iw && m.piccole.length === 0);
    await H.entra(t, W1.auth.email);
    const viste = [['home', () => { ws.view = 'home'; return renderWorker(); }], ['servizi', () => { ws.view = 'servizi'; return renderWorker(); }], ['riepilogo', () => { ws.view = 'riepilogo'; return renderWorker(); }], ['foglio', () => { ws.year = 2026; ws.month = 11; ws.si = 0; ws.view = 'foglio'; return renderWorker(); }], ['unico', () => { ws.year = 2026; ws.month = 11; ws.view = 'unico'; return renderWorker(); }]];
    for (const [nome, fn] of viste) {
      await p.evaluate(fn); await p.waitForTimeout(900);
      m = await misura(p);
      const extra = nome === 'foglio' && L === 390 ? ' tabella=' + m.tbl : '';
      const okT = !(nome === 'foglio' && L === 390) || m.tbl === 906;
      c('G-' + L + '-' + nome, 'operatore «' + nome + '» a ' + L + 'px', 'niente scorrimento laterale, 0 scritte < 12,5px fuori tabella' + (nome === 'foglio' && L === 390 ? ', tabella 906px' : ''), 'sw=' + m.sw + '/' + m.iw + extra + ' piccole=' + m.piccole.length + ' ' + m.piccole.slice(0, 4).join(' | '), m.sw <= m.iw && m.piccole.length === 0 && okT);
      if (nome === 'foglio') {
        if (L === 390) {
          const alt = await p.evaluate(() => { const i = document.querySelector('.tbl tbody input.ti'), s = document.querySelector('.tbl tbody select.sl'); return [Math.round(i.getBoundingClientRect().height), Math.round(s.getBoundingClientRect().height)]; });
          c('G-390-dito', 'caselle orari e tendine sul telefono (rev 3)', 'casella 40px, tendina 36px', alt.join('/'), alt[0] >= 40 && alt[1] >= 36);
          const stk = await p.evaluate(() => { const td = document.querySelector('.tbl tbody td.dc'); return getComputedStyle(td).position; });
          c('G-390-sticky', 'colonna del giorno ferma (rev 2)', 'position sticky', stk, stk === 'sticky');
        }
        // tre bande accese
        await p.evaluate(() => { bandaSalvataggio(true); bandaSalvataggio(true, 'assenza'); bandaLettura(true); }); await p.waitForTimeout(200);
        const b = await p.evaluate(() => ['banda-salv', 'banda-ass', 'banda-lett'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), Math.round(r.height)]; }));
        const mb = await misura(p);
        const nonSov = b[1][1] <= b[0][0] + 1 && b[2][1] <= b[1][0] + 1 && b[0][1] <= 901;
        c('G-' + L + '-bande', 'tre bande accese a ' + L + 'px', 'impilate ore·assenza·lettura senza sovrapporsi, niente scorrimento, testo bande ≥ 12,5px', 'ore=' + b[0].join('-') + ' ass=' + b[1].join('-') + ' lett=' + b[2].join('-') + ' sw=' + mb.sw + ' piccole=' + mb.piccole.length, nonSov && mb.sw <= mb.iw && mb.piccole.length === 0);
        if (L === 390 || L === 1280) await p.screenshot({ path: H.OUT + '/fo-a04-bande-' + L + '.png' });
        // ridimensionamento a caldo
        await p.setViewportSize({ width: L === 390 ? 1280 : 390, height: 900 }); await p.waitForTimeout(300);
        const b2 = await p.evaluate(() => ['banda-salv', 'banda-ass', 'banda-lett'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }));
        c('G-' + L + '-resize', 'bande dopo ridimensionamento a caldo', 'ancora non sovrapposte', JSON.stringify(b2), b2[1][1] <= b2[0][0] + 1 && b2[2][1] <= b2[1][0] + 1);
        await p.setViewportSize({ width: L, height: 900 });
        await p.evaluate(() => { bandaSalvataggio(false); bandaSalvataggio(false, 'assenza'); bandaLettura(false); });
      }
    }
    await p.evaluate(() => auth.signOut()); await H.entra(t, H.ADMIN);
    const va = [['operatori', () => { as.view = 'list'; return renderAdmin(); }], ['massimali', () => renderAdminMassimali()], ['scheda', () => { as.view = 'worker'; as.uid = 'WRK00001'; as.name = 'ROSSI MARIO'; as.subTab = 'mese'; as.year = 2026; as.month = 11; return renderAdmin(); }]];
    for (const [nome, fn] of va) {
      await p.evaluate(fn); await p.waitForTimeout(1400);
      m = await misura(p);
      c('G-' + L + '-adm-' + nome, 'admin «' + nome + '» a ' + L + 'px', 'niente scorrimento laterale, 0 scritte < 12,5px fuori tabella', 'sw=' + m.sw + '/' + m.iw + ' piccole=' + m.piccole.length + ' ' + m.piccole.slice(0, 4).join(' | '), m.sw <= m.iw && m.piccole.length === 0);
    }
    const e = await H.fine(t);
    c('G-' + L + '-err', 'errori di pagina a ' + L + 'px', '0', e.length + ' ' + e.join('|').slice(0, 120), e.length === 0);
  }
  await browser.close();
  H.riepilogo('fo-a04-grafica');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(1); });
