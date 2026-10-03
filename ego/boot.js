'use strict';
/* EGO Master LIVE: sign-in, then load the app with the records this person may see.
   The demo's app.js expects window.EGO before it runs, so nothing else loads until
   the bootstrap has answered. No password or token is ever in this file. */
(function () {
  /* The API address is decided by where the page is served, never by the URL:
     a ?api= parameter would let a forwarded link send passwords elsewhere. */
  const API = /(^|\.)zippyscale\.in$/.test(location.hostname) ? 'https://ego-master.zippyscale-cockpit-server.workers.dev' : 'http://localhost:8787';
  const KEY = 'ego-live-token';
  const store = {
    get() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return window.__egoTok || ''; } },
    set(v) { window.__egoTok = v; try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} },
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  async function api(method, path, data, isForm) {
    const headers = {};
    const tok = store.get();
    if (tok) headers.authorization = 'Bearer ' + tok;
    if (data && !isForm) headers['content-type'] = 'application/json';
    let res;
    try { res = await fetch(API + path, { method, headers, body: data ? (isForm ? data : JSON.stringify(data)) : undefined }); } catch (e) {
      throw Object.assign(new Error('Cannot reach EGO Master. Check the internet connection and try again.'), { offline: true });
    }
    const out = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/api/auth/login') { store.set(''); gate('Your session ended. Sign in again.'); throw new Error('Sign in again.'); }
    if (res.status === 403 && out && out.must_change) { changeGate(); throw new Error('Choose a new password first.'); }
    if (!res.ok) throw Object.assign(new Error(out.error || 'Something went wrong.'), { status: res.status, errors: out.errors });
    return out;
  }
  window.EGOAPI = { api, base: API, signOut: async () => { try { await api('POST', '/api/auth/logout', {}); } catch (e) {} store.set(''); location.hash = ''; location.reload(); }, file: id => API + '/api/documents/' + id };

  const root = () => document.getElementById('gate');
  const LOGO = '<svg class="logo" viewBox="0 0 557 201" height="30" role="img" aria-label="EGO"><path d="M0 0H194V85H27V117H194V144H0Z M27 29V59H167V29Z M204 0H374V201H204V174H347V144H204Z M231 29V117H347V29Z M386 0H557V144H386Z M411 29V117H530V29Z" fill="#FB0B18" fill-rule="evenodd"/></svg>';
  function gate(msg) {
    document.body.classList.add('gated');
    root().innerHTML = `<form class="gate-card stack" id="lf" autocomplete="on">
      <div class="row">${LOGO}<b class="brand-name">Master</b></div>
      <div class="stack-s"><h1>Sign in</h1><p class="muted">EGO Premium and The Big E Retail. Live records only: everything you see here was entered by your team.</p></div>
      <div class="field"><label for="lf-u">Username</label><input class="input" id="lf-u" name="username" autocomplete="username" autocapitalize="none" required></div>
      <div class="field"><label for="lf-p">Password</label><input class="input" id="lf-p" name="password" type="password" autocomplete="current-password" required></div>
      <div id="lf-err" class="small err">${esc(msg || '')}</div>
      <button class="btn primary" id="lf-go" type="submit">Sign in</button>
      <p class="small muted">Forgotten your password? Ask the Owner to issue a new one in Team and access.</p></form>`;
    root().querySelector('#lf').onsubmit = async e => {
      e.preventDefault();
      const btn = root().querySelector('#lf-go'); btn.disabled = true;
      try {
        const r = await api('POST', '/api/auth/login', { login: root().querySelector('#lf-u').value, password: root().querySelector('#lf-p').value });
        store.set(r.token);
        if (r.must_change) return changeGate();
        history.replaceState(null, '', '#/home');
        start();
      } catch (err) { root().querySelector('#lf-err').textContent = err.message; btn.disabled = false; }
    };
  }
  function changeGate() {
    document.body.classList.add('gated');
    root().innerHTML = `<form class="gate-card stack" id="pf">
      <div class="row">${LOGO}<b class="brand-name">Master</b></div>
      <div class="stack-s"><h1>Choose your own password</h1><p class="muted">You signed in with a temporary password. Choose one only you know, at least ten characters.</p></div>
      <div class="field"><label for="pf-c">Temporary password</label><input class="input" id="pf-c" type="password" autocomplete="current-password" required></div>
      <div class="field"><label for="pf-n">New password</label><input class="input" id="pf-n" type="password" autocomplete="new-password" minlength="10" required></div>
      <div class="field"><label for="pf-n2">New password again</label><input class="input" id="pf-n2" type="password" autocomplete="new-password" required></div>
      <div id="pf-err" class="small err"></div>
      <button class="btn primary" id="pf-go" type="submit">Save and continue</button>
      <button class="btn ghost" type="button" id="pf-out">Sign out</button></form>`;
    root().querySelector('#pf-out').onclick = () => { store.set(''); gate(); };
    root().querySelector('#pf').onsubmit = async e => {
      e.preventDefault();
      const q = s => root().querySelector(s), err = t => { q('#pf-err').textContent = t; };
      if (q('#pf-n').value !== q('#pf-n2').value) return err('The two new passwords are different.');
      if (q('#pf-n').value.length < 10) return err('Use at least ten characters.');
      try { await api('POST', '/api/auth/password', { current: q('#pf-c').value, password: q('#pf-n').value }); history.replaceState(null, '', '#/home'); start(); } catch (x) { err(x.message); }
    };
  }

  const FILES = ['schema.js', 'app.js', 'live.js'];
  async function start() {
    if (!store.get()) return gate();
    let boot;
    try { boot = await api('GET', '/api/bootstrap'); } catch (e) { if (e.offline) root().innerHTML = `<div class="gate-card stack"><h1>Cannot reach EGO Master</h1><p class="muted">${esc(e.message)}</p><button class="btn primary" onclick="location.reload()">Try again</button></div>`; return; }
    /* the demo screens read these tables at load; in live mode they are empty, never invented */
    const empty = ['dealer', 'market', 'employee', 'sku', 'lead', 'project', 'architect', 'installer', 'connection', 'stock'];
    window.EGO = Object.assign(Object.fromEntries(empty.map(k => [k, []])), boot, { live: true });
    if (window.EM) { window.EGOLIVE.refresh(boot); return; }
    root().innerHTML = '';
    document.body.classList.remove('gated');
    const v = document.querySelector('meta[name="build"]');
    for (const f of FILES) await new Promise((ok, bad) => { const s = document.createElement('script'); s.src = f + (v ? '?v=' + v.content : ''); s.onload = ok; s.onerror = () => bad(new Error(f)); document.body.appendChild(s); });
    window.EM.start();
  }
  window.EGOBOOT = { start, gate };
  start();
})();
