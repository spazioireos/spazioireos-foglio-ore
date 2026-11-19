// fo-a01 — accesso, password errata, registrazione (normale, lenta, caduta), nome al primo accesso,
// ruoli disabled/viewer, password dimenticata, targhetta. SOLO DATI INVENTATI.
const H = require('./fo-a00-comune.cjs');
const { c } = H;
(async () => {
  const browser = await H.chromium.launch();
  const ADM = H.u('ADMIN0001', H.ADMIN, 'admin', 'AMMINISTRAZIONE', 'PROVA');
  const W1 = H.u('WRK00001', 'rossi.prova@esempio.it', 'worker', 'ROSSI', 'MARIO');
  const DIS = H.u('DIS00001', 'spento.prova@esempio.it', 'disabled', 'SPENTO', 'ALDO');
  const VW = H.u('VIW00001', 'guarda.prova@esempio.it', 'viewer', 'GUARDA', 'LIA');
  const MAILN = H.u('MAIL0001', 'mailnome@esempio.it', 'worker', '', ''); MAILN.doc = { email: 'mailnome@esempio.it', role: 'worker', name: 'mailnome@esempio.it' };
  const ADMMAIL = H.u('ADMIN0002', 'spazioireos@gmail.com', 'admin', '', ''); ADMMAIL.doc = { email: H.ADMIN, role: 'admin', name: H.ADMIN };
  const base = [ADM, W1, DIS, VW, MAILN];

  // --- A01-A04 accesso
  {
    const t = await H.apri(browser, H.seme('a01-acc', base));
    await t.page.waitForSelector('#app-login:not(.hide)', { timeout: 15000 });
    const rv = (await H.testo(t, '.revtag')).trim();
    c('A01', 'targhetta revisione', H.REV + ' (FO_REV del file)', rv, rv === H.REV);
    const pe = await t.page.evaluate(() => getComputedStyle(document.querySelector('.revtag')).pointerEvents + '|' + getComputedStyle(document.querySelector('.revtag')).bottom + '|' + getComputedStyle(document.querySelector('.revtag')).right);
    c('A01b', 'targhetta in basso a destra, pointer-events:none', 'none|…|…', pe, /^none\|/.test(pe));
    await t.page.click('#auth-btn'); await t.page.waitForTimeout(200);
    c('A02', 'campi vuoti', 'Compila tutti i campi', await H.testo(t, '#auth-error'), /Compila tutti i campi/.test(await H.testo(t, '#auth-error')));
    await t.page.fill('#email', W1.auth.email); await t.page.fill('#password', 'sbagliata'); await t.page.click('#auth-btn');
    await t.page.waitForTimeout(500);
    const er = await H.testo(t, '#auth-error');
    c('A03', 'password errata', '«Email o password errati», resta sul login', er + ' / main visibile=' + await t.page.isVisible('#app-main'), /Email o password errati/.test(er) && !(await t.page.isVisible('#app-main')));
    await t.page.fill('#password', H.PWD); await t.page.click('#auth-btn');
    await t.page.waitForSelector('#app-main:not(.hide)', { timeout: 15000 });
    await t.page.waitForTimeout(500);
    const tx = await H.testo(t, '#app-main');
    c('A04', 'accesso worker', 'home operatore «Ciao MARIO! 👋», niente admin-mode', (tx.match(/Ciao [^!]*!/) || [''])[0] + ' admin-mode=' + await t.page.evaluate(() => document.body.classList.contains('admin-mode')), /Ciao MARIO!/.test(tx) && !(await t.page.evaluate(() => document.body.classList.contains('admin-mode'))));
    c('A04b', 'nessun riquadro «Come ti chiami?» per chi ha il nome', 'assente', await t.page.isVisible('#chiedi-nome'), !(await t.page.isVisible('#chiedi-nome')));
    await t.page.reload(); await t.page.waitForSelector('#app-main:not(.hide)', { timeout: 15000 });
    c('A05', 'sessione dopo ricaricamento', 'resta dentro', await t.page.isVisible('#app-main'), await t.page.isVisible('#app-main'));
    await t.page.click('text=Esci'); await t.page.waitForSelector('#app-login:not(.hide)', { timeout: 8000 }).catch(() => {});
    c('A06', 'Esci', 'torna alla schermata di accesso', await t.page.isVisible('#app-login'), await t.page.isVisible('#app-login'));
    // password dimenticata
    await t.page.fill('#email', W1.auth.email); await t.page.click('#forgot-pass'); await t.page.waitForTimeout(400);
    const mails = await t.page.evaluate(() => (__fakefb.mails || []).length);
    c('A07', 'password dimenticata', 'mail di reset inviata + avviso', 'mail=' + mails + ' dialog=' + (t.dialoghi.slice(-1)[0] || {}).msg, mails === 1 && /Ti abbiamo inviato/.test((t.dialoghi.slice(-1)[0] || {}).msg || ''));
    // mail non valida
    await t.page.fill('#email', 'nonvalida'); await t.page.fill('#password', 'x123456'); await t.page.click('#auth-btn'); await t.page.waitForTimeout(400);
    const er2 = await H.testo(t, '#auth-error');
    c('A08', 'accesso con email non valida', 'messaggio in italiano', er2, /Firebase|auth\//.test(er2) ? 'PARZIALE' : true);
    const e = await H.fine(t); c('A09', 'errori di pagina (accesso)', 0, e.length + ' ' + e.join('|'), e.length === 0);
  }
  // --- ruoli disabled e viewer senza assegnazioni
  {
    const t = await H.apri(browser, H.seme('a01-dis', base));
    await t.page.waitForSelector('#app-login:not(.hide)');
    await t.page.fill('#email', DIS.auth.email); await t.page.fill('#password', H.PWD); await t.page.click('#auth-btn');
    await t.page.waitForTimeout(1200);
    const d = t.dialoghi.map(x => x.msg).join('|');
    c('A10', 'ruolo disabled', 'avviso «disattivato» e ritorno al login', d + ' login=' + await t.page.isVisible('#app-login'), /disattivato/.test(d) && await t.page.isVisible('#app-login'));
    await t.page.fill('#email', VW.auth.email); await t.page.fill('#password', H.PWD); await t.page.click('#auth-btn');
    await t.page.waitForSelector('#app-main:not(.hide)', { timeout: 10000 }); await t.page.waitForTimeout(600);
    const tx = await H.testo(t, '#app-main');
    c('A11', 'viewer senza operatori assegnati', '«Nessun operatore assegnato»', tx.slice(0, 120), /Nessun operatore assegnato/.test(tx));
    await H.fine(t);
  }
  // --- registrazione normale
  async function registra(tag, cfg, cognome, nome, email) {
    const t = await H.apri(browser, H.seme('a01-reg-' + tag, [ADM]));
    await t.page.waitForSelector('#app-login:not(.hide)');
    if (cfg) await t.page.evaluate(cfg => Object.assign(__fakefb, cfg), cfg);
    await t.page.click('#toggle-auth');
    await t.page.fill('#email', email); await t.page.fill('#password', H.PWD);
    await t.page.fill('#reg-cognome', cognome); await t.page.fill('#reg-nome', nome);
    const t0 = Date.now();
    await t.page.click('#auth-btn');
    return { t, t0 };
  }
  {
    const { t } = await registra('norm', null, 'Verdi', 'Viola', 'verdi.viola@esempio.it');
    await t.page.waitForSelector('#app-main:not(.hide)', { timeout: 15000 }); await t.page.waitForTimeout(800);
    const w = (await H.scritture(t)).filter(x => /^users\//.test(x.path));
    const db = await H.dump(t); const k = Object.keys(db).find(x => /^users\//.test(x) && db[x].email === 'verdi.viola@esempio.it');
    const tx = await H.testo(t, '#app-main');
    c('A12', 'registrazione normale', '1 scrittura users, name VERDI VIOLA, role worker, «Ciao VIOLA!»', 'scritture=' + w.length + ' name=' + (k && db[k].name) + ' role=' + (k && db[k].role) + ' ' + (tx.match(/Ciao [^!]*!/) || [''])[0], w.length === 1 && k && db[k].name === 'VERDI VIOLA' && db[k].role === 'worker' && /Ciao VIOLA!/.test(tx));
    await H.fine(t);
  }
  for (const ms of [5500, 9000]) {
    const { t, t0 } = await registra('lenta' + ms, { writeDelayMs: ms }, 'Lenti', 'Luca', 'lenti' + ms + '@esempio.it');
    await t.page.waitForSelector('#app-main:not(.hide)', { timeout: 40000 }).catch(() => {}); await t.page.waitForTimeout(ms + 1500);
    const w = (await H.scritture(t)).filter(x => /^users\//.test(x.path));
    const db = await H.dump(t); const k = Object.keys(db).find(x => /^users\//.test(x) && db[x].email === 'lenti' + ms + '@esempio.it');
    const tx = await H.testo(t, '#app-main');
    c('A13-' + ms, 'registrazione con scrittura lenta ' + ms + ' ms', '1 scrittura, name LENTI LUCA, cognome/nome presenti, «Ciao LUCA!»', 'scritture=' + w.length + ' name=' + (k && db[k].name) + ' cognome=' + (k && db[k].cognome) + ' ' + (tx.match(/Ciao [^!]*!/) || ['—'])[0], w.length === 1 && k && db[k].name === 'LENTI LUCA' && db[k].cognome === 'LENTI' && /Ciao LUCA!/.test(tx));
    await H.fine(t);
  }
  // --- registrazione con scrittura caduta, poi primo accesso buono
  {
    const { t } = await registra('caduta', { failWrites: true }, 'Caduti', 'Carla', 'caduti@esempio.it');
    await t.page.waitForTimeout(3000);
    const er = await H.testo(t, '#auth-error');
    const st = { login: await t.page.isVisible('#app-login'), main: await t.page.isVisible('#app-main'), loading: await t.page.isVisible('#loading') };
    c('A14', 'registrazione con scrittura caduta', 'messaggio comprensibile, nessun blocco silenzioso', 'errore="' + er + '" ' + JSON.stringify(st) + ' errPag=' + t.errori.length, (er.length > 0 || st.main) && !(st.loading && !st.main && !st.login) ? true : 'PARZIALE');
    c('A14b', 'errori di pagina durante la registrazione caduta', '0 (nessuna promessa rifiutata non gestita)', t.errori.length + ' ' + t.errori.join('|').slice(0, 160), t.errori.length === 0);
    // primo accesso buono: l'account in Auth non ha documento users
    await t.page.evaluate(() => { __fakefb.failWrites = false; });
    await t.page.reload(); await t.page.waitForTimeout(1500);
    let vis = await t.page.isVisible('#chiedi-nome');
    if (!vis && await t.page.isVisible('#app-login')) { await H.entra(t, 'caduti@esempio.it'); await t.page.waitForTimeout(800); vis = await t.page.isVisible('#chiedi-nome'); }
    c('A15', 'primo accesso dopo registrazione caduta', 'riquadro «Come ti chiami?»', vis, vis);
    if (vis) {
      await t.page.click('#cn-ok'); await t.page.waitForTimeout(200);
      c('A16', 'riquadro nome con campi vuoti', '«Scrivi sia il cognome sia il nome.»', await H.testo(t, '#cn-err'), /Scrivi sia il cognome sia il nome/.test(await H.testo(t, '#cn-err')));
      await t.page.fill('#cn-cognome', 'caduti'); await t.page.fill('#cn-nome', 'carla'); await t.page.click('#cn-ok');
      await t.page.waitForTimeout(800);
      const db = await H.dump(t); const k = Object.keys(db).find(x => /^users\//.test(x) && db[x].email === 'caduti@esempio.it');
      const tx = await H.testo(t, '#app-main');
      c('A17', 'nome scritto dal riquadro', 'name CADUTI CARLA (stampatello), role worker intatto, «Ciao CARLA!»', 'name=' + (k && db[k].name) + ' role=' + (k && db[k].role) + ' ' + (tx.match(/Ciao [^!]*!/) || ['—'])[0], k && db[k].name === 'CADUTI CARLA' && db[k].role === 'worker' && /Ciao CARLA!/.test(tx));
    }
    await H.fine(t);
  }
  // --- nome uguale alla mail: chiesto; con scrittura caduta → «Lo faccio dopo»; admin non disturbato
  {
    const t = await H.apri(browser, H.seme('a01-mail', base));
    await H.entra(t, 'mailnome@esempio.it').catch(() => {});
    await t.page.waitForSelector('#chiedi-nome', { timeout: 8000 }).catch(() => {});
    c('A18', 'utente con name = mail', 'riquadro «Come ti chiami?»', await t.page.isVisible('#chiedi-nome'), await t.page.isVisible('#chiedi-nome'));
    const geo = await t.page.evaluate(() => { const b = document.getElementById('cn-box'); if (!b) return null; const r = b.getBoundingClientRect(); return { w: Math.round(r.width), ok: document.getElementById('cn-ok').getBoundingClientRect().height }; });
    c('A18b', 'riquadro nome: pulsante comodo', 'pulsante ≥ 40px', JSON.stringify(geo), geo && geo.ok >= 40);
    await t.page.evaluate(() => { __fakefb.failWrites = true; });
    await t.page.fill('#cn-cognome', 'Rossi'); await t.page.fill('#cn-nome', 'Mario'); await t.page.click('#cn-ok'); await t.page.waitForTimeout(600);
    const er = await H.testo(t, '#cn-err'); const dopo = await t.page.isVisible('#cn-dopo');
    c('A19', 'nome con scrittura caduta', '«Non c\'è collegamento…» + «Lo faccio dopo»', er + ' dopo=' + dopo, /Non c'è collegamento/.test(er) && dopo);
    await t.page.click('#cn-dopo'); await t.page.waitForTimeout(600);
    c('A20', '«Lo faccio dopo»', 'si entra comunque nell\'app', await t.page.isVisible('#app-main') && !(await t.page.isVisible('#chiedi-nome')), await t.page.isVisible('#app-main') && !(await t.page.isVisible('#chiedi-nome')));
    await H.fine(t);
  }
  {
    const t = await H.apri(browser, H.seme('a01-admmail', [ADMMAIL]));
    await H.entra(t, H.ADMIN); await t.page.waitForTimeout(800);
    c('A21', 'admin con name = mail', 'NON disturbato dal riquadro; Pannello Admin', 'riquadro=' + await t.page.isVisible('#chiedi-nome') + ' pannello=' + /Pannello Admin/.test(await H.testo(t, '#app-main')), !(await t.page.isVisible('#chiedi-nome')) && /Pannello Admin/.test(await H.testo(t, '#app-main')));
    await H.fine(t);
  }
  // --- cognome che sembra un nome
  {
    const { t } = await registra('inv', null, 'Mario', 'Rossi', 'inv@esempio.it');
    await t.page.waitForTimeout(400);
    // il primo dialog è la conferma: H risponde true di serie; qui serve annullare -> rifacciamo con risposta false
    await H.fine(t);
    const t2 = await H.apri(browser, H.seme('a01-inv2', [ADM]));
    await t2.page.waitForSelector('#app-login:not(.hide)'); await t2.page.click('#toggle-auth');
    t2.risposte.push(false);
    await t2.page.fill('#email', 'inv2@esempio.it'); await t2.page.fill('#password', H.PWD); await t2.page.fill('#reg-cognome', 'Mario'); await t2.page.fill('#reg-nome', 'Rossi');
    await t2.page.click('#auth-btn'); await t2.page.waitForTimeout(600);
    const d = t2.dialoghi.map(x => x.msg).join('|'); const us = Object.keys(await t2.page.evaluate(p => __fakefb.users(p), H.P)).length;
    c('A22', 'cognome che sembra un nome (annulla)', 'avviso «sembra un NOME proprio», nessun account creato', /sembra un NOME/.test(d) + ' utenti=' + us, /sembra un NOME/.test(d) && us === 1);
    await H.fine(t2);
  }
  await browser.close();
  H.riepilogo('fo-a01-accesso');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(1); });
