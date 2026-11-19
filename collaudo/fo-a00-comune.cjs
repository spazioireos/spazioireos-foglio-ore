// Collaudo individuale (Livello A) di Fogli ore — modulo comune agli script fo-a01…fo-a09.
// SOLO DATI INVENTATI (repository pubblico). Usa il banco comune con la finta Firebase:
//   rendicontazione-usoint/collaudo/comune/  (porta 8340, /fo/index.html).
// Se `playwright` non si trova: NODE_PATH=/opt/node-tools/node_modules node collaudo/fo-a01-....cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const PORTA = process.env.PORTA || '8340';
const BASE = 'http://127.0.0.1:' + PORTA + '/';
const URL = BASE + 'fo/index.html';
const P = 'spazio-ireos-foglio-ore';
const ADMIN = 'spazioireos@gmail.com', PWD = 'prova123';
const OUT = path.join(__dirname, 'out'); try { fs.mkdirSync(OUT, { recursive: true }); } catch (e) {}
// targhetta attesa: letta dalla costante FO_REV del file dell'app, così non invecchia (rev 18)
const REV = JSON.parse((fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').match(/const FO_REV=("[^"]*")/) || [, '"?"'])[1]);

const righe = [];
function c(id, funz, atteso, effettivo, stato) {
  // stato: true -> SUPERATO, false -> FALLITO, oppure stringa 'PARZIALE'/'NON VERIFICATO'
  const st = stato === true ? 'SUPERATO' : stato === false ? 'FALLITO' : stato;
  righe.push({ id, funz, atteso, effettivo: String(effettivo).slice(0, 220), stato: st });
  console.log((st === 'SUPERATO' ? 'OK ' : st === 'FALLITO' ? 'KO ' : '?? ') + id + ' · ' + funz + ' → ' + String(effettivo).slice(0, 200));
}
function riepilogo(nome) {
  const n = s => righe.filter(r => r.stato === s).length;
  const tot = { script: nome, pianificati: righe.length, superati: n('SUPERATO'), falliti: n('FALLITO'), parziali: n('PARZIALE'), nonVerificati: n('NON VERIFICATO') };
  console.log('\nRIEPILOGO ' + nome + ': ' + JSON.stringify(tot));
  fs.writeFileSync(path.join(OUT, nome + '.json'), JSON.stringify({ tot, righe }, null, 1));
  return tot;
}

// utenti e documenti inventati
function u(uid, email, ruolo, cognome, nome, extra) {
  return { auth: { email, password: PWD, uid }, doc: Object.assign({ email, role: ruolo, cognome, nome, name: cognome + ' ' + nome }, extra || {}) };
}
function seme(id, utenti, docs, opz) {
  opz = opz || {};
  const d = {};
  utenti.forEach(x => { d['users/' + x.auth.uid] = x.doc; });
  Object.assign(d, docs || {});
  const s = { reset: true, users: utenti.map(x => x.auth), docs: d };
  if (opz.session) s.session = { email: opz.session, app: '[DEFAULT]' };
  return { id, [P]: s };
}
function ts(uid, y, m, si, days, anag) {
  anag = anag || {};
  return { ['timesheets/' + uid + '__' + y + '_' + m + '_' + si]: {
    workerUid: uid, workerName: anag.workerName || '', year: y, month: m, serviceIdx: si,
    mansione: anag.mansione || 'Educatore/Assistente', sede: anag.sede || 'Scuola', dettagli: anag.dettagli || 'VIA DELLE PROVE 1',
    comune: anag.comune || 'PROVOPOLI', alunno: anag.alunno || '', days: days || {} } };
}

async function apri(browser, seed, opz) {
  opz = opz || {};
  const ctx = await browser.newContext({ viewport: opz.viewport || { width: 1280, height: 900 }, acceptDownloads: true });
  const esterni = [];
  await ctx.route('**/*', r => { const x = r.request().url(); if (x.startsWith(BASE) || x.startsWith('data:') || x.startsWith('blob:') || x === 'about:blank') return r.continue(); esterni.push(x); return r.abort(); });
  if (seed) await ctx.addInitScript(s => { window.__FAKEFB_SEED__ = s; }, seed);
  if (opz.cfg) await ctx.addInitScript(cfg => { window.__fakefb = Object.assign(window.__fakefb || {}, cfg); }, opz.cfg);
  const page = await ctx.newPage();
  const t = { ctx, page, esterni, errori: [], dialoghi: [], risposte: [] };
  page.on('pageerror', e => { t.errori.push('pageerror: ' + e.message); t.stack = (t.stack || []).concat(String(e.stack || '').split('\n').slice(0, 4).join(' / ')); });
  page.on('dialog', async dg => {
    const msg = dg.message(); t.dialoghi.push({ tipo: dg.type(), msg });
    let r = t.risposte.length ? t.risposte.shift() : true;
    if (typeof r === 'function') r = r(msg, dg.type());
    if (dg.type() === 'alert') return dg.accept();
    if (dg.type() === 'prompt') return r === false ? dg.dismiss() : dg.accept(typeof r === 'string' ? r : (dg.defaultValue() || ''));
    return r === false ? dg.dismiss() : dg.accept();
  });
  await page.goto(opz.url || URL);
  return t;
}
async function entra(t, email, pwd) {
  const p = t.page;
  await p.waitForSelector('#app-login:not(.hide), #app-main:not(.hide)', { timeout: 15000 });
  if (await p.isVisible('#app-main')) return;
  await p.fill('#email', email); await p.fill('#password', pwd || PWD); await p.click('#auth-btn');
  await p.waitForSelector('#app-main:not(.hide)', { timeout: 15000 });
  await p.waitForTimeout(400);
}
async function dump(t) { return t.page.evaluate(p => __fakefb.dump(p), P); }
async function scritture(t) { return t.page.evaluate(() => __fakefb.log.filter(o => /^(set|update|delete|batch|transaction)$/.test(o.op)).map(o => ({ op: o.op, path: o.path || '', p: o.project, data: o.data }))); }
async function testo(t, sel) { return (await t.page.textContent(sel || 'body').catch(() => '')) || ''; }
async function aspetta(ms) { return new Promise(r => setTimeout(r, ms)); }
// apre il foglio di un servizio di un mese, per un operatore già dentro
async function apriFoglio(t, y, m, si) {
  await t.page.evaluate(([y, m, si]) => { ws.year = y; ws.month = m; ws.si = si; ws.view = 'foglio'; return renderWorker(); }, [y, m, si]);
  await t.page.waitForSelector('.tbl tbody tr', { timeout: 10000 });
  await t.page.waitForTimeout(300);
}
async function fine(t) { const e = t.errori.slice(); await t.ctx.close(); return e; }

module.exports = { REV, chromium, URL, BASE, P, ADMIN, PWD, OUT, c, riepilogo, u, seme, ts, apri, entra, dump, scritture, testo, aspetta, apriFoglio, fine, righe };
