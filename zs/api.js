/* Talking to the server.
 *
 * THE SHAPE OF THIS, AND WHY.
 *
 * Every screen in this cockpit reads one object, `D`, and calls save() after
 * changing it. Rewriting all of them to await a network call would be a month
 * of work and would make the app slow and racy: save() fires on every keystroke
 * in some places.
 *
 * So the local store stays exactly where it is and becomes a CACHE, and the
 * server becomes the truth:
 *
 *   sign in  ->  fetch everything this person may see, replace the cache
 *   change   ->  write the cache immediately, queue a push
 *   push     ->  debounced, batched, and retried; the screen never waits
 *
 * That gives three things at once: the app stays fast, it keeps working when
 * the connection drops, and the permission model becomes real — because what
 * arrives at sign-in is what the SERVER decided this person may see, not the
 * whole book with parts hidden.
 *
 * WHAT IS DELIBERATELY NOT HERE. No automatic conflict resolution. With one
 * person on two devices, last-write-wins is honest and understandable. When
 * there are five people editing the same engagement, this needs revisiting, and
 * pretending otherwise now would hide the problem rather than solve it.
 */
(function () {
  'use strict';
  var G = window.GE;

  /* ⚠️ THE SERVER ADDRESS BELONGS IN THE BUILD, NOT IN ONE BROWSER.

     This was read only from localStorage. So the machine that set it up knew
     where the server was and every other browser did not: it fell back to local
     mode, found an empty store, and offered to CREATE AN OWNER ACCOUNT. Fill
     that in and you have a second cockpit, disconnected from the first, holding
     a different book. The entire promise is that the book follows you, and the
     one thing that has to follow you is where the book lives.

     The address is not a secret. It is a public URL and the API behind it
     refuses everything without a token. Shipping it is what makes the cockpit
     work on a phone you have never opened it on.

     localStorage now only OVERRIDES this, for pointing a browser at a different
     server, and '' is a deliberate "local only" rather than "unset". */
  var DEFAULT_URL = 'https://zippyscale-cockpit.zippyscale-cockpit-server.workers.dev';

  var KEY_URL = 'zs_api_url';
  var KEY_TOKEN = 'zs_api_token';

  var state = {
    url: null,
    token: null,
    online: false,
    lastSync: null,
    lastError: null,
    pending: 0,
    pushing: false
  };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  var override = get(KEY_URL);
  /* The built-in address wins unless a browser was deliberately pointed
     somewhere else. An empty override no longer means "go local": in a build
     that ships an address, going local is how a second disconnected cockpit
     gets created, which is exactly the accident this is preventing. */
  state.url = (override && override.trim()) ? override.trim() : (DEFAULT_URL || null);
  state.token = get(KEY_TOKEN);

  function configured() { return !!state.url; }
  function signedIn() { return !!(state.url && state.token); }

  /* ---------------- the wire ---------------- */

  async function call(method, path, opts) {
    opts = opts || {};
    if (!state.url) throw new Error('No server is configured.');
    var headers = {};
    if (state.token) headers.authorization = 'Bearer ' + state.token;
    var body;
    if (opts.form) body = opts.form;
    else if (opts.body !== undefined) { headers['content-type'] = 'application/json'; body = JSON.stringify(opts.body); }

    var res;
    try {
      res = await fetch(state.url.replace(/\/+$/, '') + path, { method: method, headers: headers, body: body });
    } catch (e) {
      /* A network failure is not the same as a refusal, and the difference
         matters: one means try again later, the other means stop. */
      state.online = false;
      state.lastError = 'Could not reach the server.';
      throw Object.assign(new Error(state.lastError), { offline: true });
    }

    state.online = true;

    /* ⚠️ NOT EVERY 401 IS AN EXPIRED SESSION.
       /api/auth/login answers 401 for "that username and password do not
       match", and this swallowed it and said "Your session ended. Sign in
       again." to somebody who was signing in for the first time. The real
       message was there all along and this threw it away. Only treat it as an
       expired session when we actually sent a token. */
    if (res.status === 401) {
      var wasSignedIn = !!state.token;
      var said = null;
      try { said = (await res.clone().json()).error; } catch (e) {}

      if (wasSignedIn) {
        state.token = null;
        put(KEY_TOKEN, null);
        state.lastError = said || 'Your session ended. Sign in again.';
        throw Object.assign(new Error(state.lastError), { unauthorised: true });
      }
      state.lastError = said || 'That did not work.';
      throw Object.assign(new Error(state.lastError), { status: 401 });
    }
    if (res.status === 204) return null;

    var ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      if (!res.ok) throw new Error('The server returned ' + res.status + '.');
      return res;
    }
    var data = await res.json().catch(function () { return null; });
    if (!res.ok) {
      var msg = (data && data.error) || ('The server returned ' + res.status + '.');
      throw Object.assign(new Error(msg), { status: res.status, reference: data && data.reference });
    }
    state.lastError = null;
    return data;
  }

  /* ---------------- signing in ---------------- */

  async function setupNeeded() {
    var r = await call('GET', '/api/setup');
    return !!(r && r.needed);
  }

  async function createOwner(name, login, password) {
    var r = await call('POST', '/api/setup', { body: { name: name, login: login, password: password } });
    state.token = r.token; put(KEY_TOKEN, r.token);
    return r;
  }

  async function signIn(login, password) {
    var r = await call('POST', '/api/auth/login', { body: { login: login, password: password } });
    state.token = r.token; put(KEY_TOKEN, r.token);
    return r;
  }

  async function signOut() {
    try { await call('POST', '/api/auth/logout'); } catch (e) {}
    state.token = null; put(KEY_TOKEN, null);
  }

  async function changePassword(password, staffId) {
    return call('POST', '/api/auth/password', { body: { password: password, staff_id: staffId } });
  }

  /* ---------------- reading ---------------- */

  /* Everything this person may see. What comes back is already scoped: a
     contractor receives fewer ROWS, not the same rows with parts blanked. */
  async function pull() {
    var d = await call('GET', '/api/bootstrap');
    state.lastSync = new Date().toISOString();
    return d;
  }

  /* ---------------- writing ---------------- */

  /* A change is queued by id, not by value, so twenty keystrokes on one field
     become one push rather than twenty. */
  var queue = { clients: {}, opportunities: {}, settings: {} };
  var timer = null;

  function touch(kind, record) {
    if (!signedIn() || !record || !record.id) return;
    queue[kind][record.id] = true;
    state.pending = count();
    schedule();
  }
  function touchSetting(key) {
    if (!signedIn()) return;
    queue.settings[key] = true;
    state.pending = count();
    schedule();
  }
  function count() {
    return Object.keys(queue.clients).length + Object.keys(queue.opportunities).length +
           Object.keys(queue.settings).length;
  }
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { push(); }, 1200);
  }

  async function push() {
    if (state.pushing || !signedIn() || !count()) return;
    state.pushing = true;
    var D = G.D();
    var sent = 0, failed = 0;

    try {
      for (var id of Object.keys(queue.clients)) {
        var c = (D.clients || []).filter(function (x) { return x.id === id; })[0];
        delete queue.clients[id];
        if (!c) continue;
        try { await call('POST', '/api/clients', { body: forWire('clients', c) }); sent++; }
        catch (e) { failed++; if (e.offline) { queue.clients[id] = true; throw e; } }
      }
      for (var oid of Object.keys(queue.opportunities)) {
        var o = (D.opportunities || []).filter(function (x) { return x.id === oid; })[0];
        delete queue.opportunities[oid];
        if (!o) continue;
        try { await call('POST', '/api/opportunities', { body: forWire('opportunities', o) }); sent++; }
        catch (e) { failed++; if (e.offline) { queue.opportunities[oid] = true; throw e; } }
      }
      for (var key of Object.keys(queue.settings)) {
        delete queue.settings[key];
        try { await call('POST', '/api/settings', { body: { key: key, value: D[key] } }); sent++; }
        catch (e) { failed++; if (e.offline) { queue.settings[key] = true; throw e; } }
      }
      state.lastSync = new Date().toISOString();
    } catch (e) {
      /* Offline: everything unsent stays queued and goes up when the connection
         returns. Nothing is lost, because the local cache still has it. */
    } finally {
      state.pushing = false;
      state.pending = count();
      if (count()) schedule();
      if (G.paintSync) G.paintSync();
    }
    return { sent: sent, failed: failed };
  }

  /* The client's field names are not all the server's. Map them once, here,
     rather than letting the difference leak into every call site. */
  function forWire(table, rec) {
    var out = Object.assign({}, rec);
    if (table === 'opportunities') {
      out.client_id = rec.client || rec.client_id;
      delete out.client;
    }
    delete out.score; delete out.completeness;
    return out;
  }

  /* ---------------- documents ---------------- */

  async function uploadDoc(file, holderKind, holderId, type, name) {
    var form = new FormData();
    form.append('file', file, file.name);
    form.append('holder_kind', holderKind);
    form.append('holder_id', holderId);
    form.append('type', type || 'scan');
    /* what somebody typed when they uploaded it. Without this the server keeps
       the camera's filename and the next sync overwrites the name they gave. */
    if (name) form.append('name', name);
    return call('POST', '/api/documents', { form: form });
  }
  function docUrl(id) {
    return state.url.replace(/\/+$/, '') + '/api/documents/' + id;
  }
  async function fetchDoc(id) {
    var res = await call('GET', '/api/documents/' + id);
    return res;
  }
  async function editDoc(id, patch) { return call('PATCH', '/api/documents/' + id, { body: patch }); }
  async function dropDoc(id) { return call('DELETE', '/api/documents/' + id); }

  /* ---------------- removing a record for good ----------------

     ⚠️ THE CONSOLE NEVER CALLED THESE. Deleting happened in the browser, the
     server kept its copy, and the next reload pulled the record straight back.
     Somebody deletes a thing, watches it go, reloads, and it is there again:
     nothing about that says "your delete did not reach the server". */
  async function dropClient(id) { return call('DELETE', '/api/clients/' + id); }
  async function dropOpp(id) { return call('DELETE', '/api/opportunities/' + id); }

  /* ---------------- the bin ----------------

     Deleting no longer destroys anything: the server captures the whole record
     and everything under it, and keeps it for thirty days. Deleting a CLIENT is
     one call, because the server cascades — the console used to delete each
     engagement first and got one bin row per engagement plus a hollowed-out
     client, so putting the company back gave you no work under it. */
  async function binRestore(id) { return call('POST', '/api/bin/restore', { body: { id: id } }); }
  async function binDrop(id) { return call('DELETE', '/api/bin/' + id); }
  async function binEmpty() { return call('DELETE', '/api/bin'); }
  async function binList() { return call('GET', '/api/bin'); }

  /* ---------------- the backup sheet ----------------
     A mirror of the whole book in Google Sheets, written as records change. This
     fills it from scratch and hands back where it is; every other write happens
     on the server without the console asking. */
  async function fillSheet() { return call('POST', '/api/mirror'); }

  /* ---------------- conversations ----------------

     The list arrives with the book; a thread's own messages are fetched when it
     is opened, because sending every message of every conversation on every sync
     is a lot of wire for a screen that shows one at a time. */
  async function thread(id) { return call('GET', '/api/threads/' + id); }
  async function assignThread(id, staff) {
    return call('POST', '/api/threads/' + id + '/assign', { body: { staff: staff || null } });
  }
  async function sendOnThread(id, payload) {
    return call('POST', '/api/threads/' + id + '/send', { body: payload });
  }
  async function templates() { return call('GET', '/api/templates'); }

  /* the chatbot: a menu, saved whole — bot and steps in one write, because a bot
     saved without its steps greets somebody and then says nothing */
  async function bots() { return call('GET', '/api/bots'); }
  async function saveBot(b) { return call('POST', '/api/bots', { body: b }); }

  /* ---------------- has anything happened? ----------------
     Three counts and the newest activity row. Cheap on purpose: it is asked
     every twenty seconds all day, and the full pull only follows when one of
     those numbers moves. */
  async function pulse() { return call('GET', '/api/pulse'); }

  /* ---------------- reading a document ----------------
     JavaScript cannot read a photograph of a bank screen. This sends one to the
     model, through the server, and gets fields back. It decides nothing. */
  async function readDoc(job, dataUrl, mime, refs) {
    return call('POST', '/api/read', { body: Object.assign({
      job: job, data: dataUrl, mime: mime
    }, refs || {}) });
  }

  /* ---------------- staff ---------------- */

  async function addStaff(person) { return call('POST', '/api/staff', { body: person }); }

  /* ---------------- Jarvis's model ----------------

     Two shapes, both going through the server because the key is there. `route`
     turns a sentence into one Jarvis already understands; `draft` writes a
     message a human then approves. Neither sends the book. */
  async function askModel(payload) { return call('POST', '/api/ask', { body: payload }); }

  /* ---------------- the diary ----------------
     Putting a meeting in the owner's Google Calendar, through the server, which
     holds the key. The browser never sees it. */
  async function diary(payload) { return call('POST', '/api/diary', { body: payload }); }

  /* ---------------- sharing a document ----------------
     A link that works with no sign-in, so it is a revocable row on the server
     rather than a signature. `days` caps at 90. */
  async function shareDoc(docId, days) {
    return call('POST', '/api/shares', { body: { doc: docId, days: days || 30 } });
  }
  async function unshareDoc(token) {
    return call('DELETE', '/api/shares', { body: { token: token } });
  }

  /* ---------------- what the screen shows about all this ---------------- */

  function status() {
    if (!configured()) return { mode: 'local', label: 'This browser only', tone: 'warn' };
    if (!signedIn()) return { mode: 'out', label: 'Signed out of the server', tone: 'warn' };
    if (!state.online) return { mode: 'offline', label: 'Offline — changes are queued', tone: 'bad' };
    if (state.pending) return { mode: 'saving', label: state.pending + ' change(s) saving', tone: 'dim' };
    return { mode: 'synced', label: 'Saved to the server', tone: 'ok' };
  }

  window.API = {
    askModel: askModel,
    diary: diary,
    shareDoc: shareDoc, unshareDoc: unshareDoc,
    dropClient: dropClient, dropOpp: dropOpp,
    binRestore: binRestore, binDrop: binDrop, binEmpty: binEmpty, binList: binList,
    fillSheet: fillSheet,
    thread: thread, assignThread: assignThread,
    sendOnThread: sendOnThread, templates: templates,
    bots: bots, saveBot: saveBot,
    pulse: pulse,
    readDoc: readDoc,
    /* configuration */
    url: function () { return state.url; },
    setUrl: function (u) {
      state.url = u ? String(u).replace(/\/+$/, '') : null;
      /* store '' rather than removing the key, so "local only" survives a
         reload instead of silently reverting to the built-in address */
      put(KEY_URL, state.url === null ? '' : state.url);
    },
    defaultUrl: function () { return DEFAULT_URL; },
    resetUrl: function () { put(KEY_URL, null); state.url = DEFAULT_URL; },
    configured: configured,
    signedIn: signedIn,
    state: function () { return Object.assign({}, state); },
    status: status,

    /* auth */
    setupNeeded: setupNeeded,
    createOwner: createOwner,
    signIn: signIn,
    signOut: signOut,
    changePassword: changePassword,

    /* data */
    pull: pull,
    push: push,
    touch: touch,
    touchSetting: touchSetting,

    /* documents */
    uploadDoc: uploadDoc,
    docUrl: docUrl,
    fetchDoc: fetchDoc,
    editDoc: editDoc,
    dropDoc: dropDoc,

    /* people */
    addStaff: addStaff,

    call: call
  };
})();
