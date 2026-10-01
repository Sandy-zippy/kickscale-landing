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

  /* ⚠️ THIS WAS `var G = window.GE;` AND IT WAS THE ROOT OF EVERYTHING.

     api.js loads BEFORE app.js — it has to, because app.js asks the API where
     the server is while it is booting. app.js creates `window.GE` on its last
     line. So this captured `undefined`, permanently, and every single reference
     to G in this file threw a TypeError.

     WHAT THAT MEANT IN PRACTICE: push() throws on its first line, every time.
     The console has never once saved a record to the server. Not a client, not
     an engagement, not an invoice. And it was invisible, because every push
     happens inside a scheduled callback with nobody awaiting it, so the
     TypeError went to the console log and nowhere else. Meanwhile the panel
     showed "Saved to the server" — because that reads `lastSync`, which the PULL
     sets — and "Waiting to save: nothing", because the queue is counted without
     touching G at all. Three true-looking readings, one dead function.

     Everything else chased this: records stranded in the browser, documents
     refused with "No such record to file it against" because the engagement had
     never gone up, a backup sheet with nothing in it because the mirror only
     fires on a server write.

     Looked up on every access now, so the load order cannot matter. Not a
     reassignment somebody has to remember to make. */
  var G = {};
  ['D', 'render', 'toast', 'save', 'saveLocal', 'paintSync',
   'unsyncedRecords', 'retryStrandedDocs'].forEach(function (k) {
    Object.defineProperty(G, k, {
      get: function () { return window.GE ? window.GE[k] : undefined; }
    });
  });

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
  var queue = { clients: {}, opportunities: {}, invoices: {}, followups: {}, settings: {} };
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
           Object.keys(queue.invoices).length + Object.keys(queue.followups).length +
           Object.keys(queue.settings).length;
  }
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { push(); }, 1200);
  }

  /* ⚠️ `_synced` IS THE WHOLE DEFENCE AGAINST LOSING SOMEBODY'S WORK.
     It is set only when the server has ACCEPTED that record. Anything without it
     is work that exists in this browser and nowhere else, and adoptRemote() is
     forbidden from throwing it away. See the comment there; the two belong
     together and neither works alone. */
  /* ⚠️ THE QUEUE IS A HINT, NOT THE TRUTH.

     It was the truth, and that was the bug behind every "it says saved and the
     count will not move". The queue is filled by noticing a change; anything
     that stops the noticing — a record rescued after a pull, a push that failed
     for a reason other than being offline, a path that forgot to call save() —
     leaves a record out of it FOR EVER, with nothing to put it back.

     So before every push, the store itself is swept: any record the server has
     not confirmed goes into the queue whether anything noticed it or not. The
     store is the truth and the queue is only an optimisation over it, which
     makes this self-healing rather than dependent on every path remembering. */
  function sweepUnsent() {
    if (!G.unsyncedRecords) return;
    var u = G.unsyncedRecords();
    ['clients', 'opportunities', 'invoices', 'followups'].forEach(function (k) {
      (u[k] || []).forEach(function (r) { if (r && r.id) queue[k][r.id] = true; });
    });
    state.pending = count();
  }

  /* Somebody asked for a push while one was already running. */
  var askedAgain = false;

  async function push() {
    if (!signedIn()) return;

    /* ⚠️ A SECOND PUSH USED TO GIVE UP SILENTLY AND NEVER COME BACK.

       `if (state.pushing) return;` looks like ordinary mutual exclusion and is
       not: the change that triggered it is dropped on the floor. On a cold
       Worker the first push after sign-in takes about ten seconds, and the timer
       for the client you just typed fires inside that window, sees the lock,
       returns, and nothing reschedules. Type one client, change nothing else,
       and it waits for ever.

       That is why records sat in the browser while the panel said everything was
       saved. It was, right up until the moment you added something. */
    if (state.pushing) { askedAgain = true; return; }

    try { sweepUnsent(); } catch (e) { /* the app may not be up yet */ }
    if (!count()) return;

    /* ⚠️ AND THE LOCK IS TAKEN ONLY ONCE WE CAN GUARANTEE RELEASING IT.
       `var D = G.D()` used to sit between `state.pushing = true` and the try, so
       anything it threw left the lock held for the life of the page and every
       later push returned at the first line. One throw, no more saving, no
       message. */
    var D = G.D && G.D();
    if (!D) { schedule(); return; }

    state.pushing = true;
    var sent = 0, failed = 0;

    try {
      for (var id of Object.keys(queue.clients)) {
        var c = (D.clients || []).filter(function (x) { return x.id === id; })[0];
        delete queue.clients[id];
        if (!c) continue;
        try {
          var rc = await call('POST', '/api/clients', { body: forWire('clients', c) });
          /* ⚠️ ADOPT THE REFERENCE THE SERVER GAVE IT. `ref` is UNIQUE there and
             this browser mints one from what it alone can see, so the server has
             the last word. Ignoring the answer means the two disagree about what
             the record is called and every later save collides again. */
          if (rc && rc.ref) c.ref = rc.ref;
          sent++; c._synced = true;
        }
        catch (e) {
          /* ⚠️ PUT IT BACK WHATEVER WENT WRONG. This only restored the id when
             the failure was "offline", so a 400, a 403 or a 500 deleted it from
             the queue and nothing ever tried again. The record sat unsent for
             ever while the panel said there was nothing waiting. The sweep above
             would find it anyway now; this keeps the error visible in the
             meantime. */
          failed++; queue.clients[id] = true;
          if (e.offline) throw e;
        }
      }
      for (var oid of Object.keys(queue.opportunities)) {
        var o = (D.opportunities || []).filter(function (x) { return x.id === oid; })[0];
        delete queue.opportunities[oid];
        if (!o) continue;
        try {
          var ro = await call('POST', '/api/opportunities', { body: forWire('opportunities', o) });
          /* ⚠️ ADOPT THE REFERENCE THE SERVER GAVE IT. `ref` is UNIQUE there and
             this browser mints one from what it alone can see, so the server has
             the last word. Ignoring the answer means the two disagree about what
             the record is called and every later save collides again. */
          if (ro && ro.ref) o.ref = ro.ref;
          sent++; o._synced = true;
        }
        catch (e) {
          /* ⚠️ PUT IT BACK WHATEVER WENT WRONG. This only restored the id when
             the failure was "offline", so a 400, a 403 or a 500 deleted it from
             the queue and nothing ever tried again. The record sat unsent for
             ever while the panel said there was nothing waiting. The sweep above
             would find it anyway now; this keeps the error visible in the
             meantime. */
          failed++; queue.opportunities[oid] = true;
          if (e.offline) throw e;
        }
      }
      /* Money and chases go up AFTER the engagements they hang off, or the
         server refuses them for belonging to an engagement it has not heard of
         yet. That is also why they are separate loops rather than one. */
      for (var iid of Object.keys(queue.invoices)) {
        var inv = (D.invoices || []).filter(function (x) { return x.id === iid; })[0];
        delete queue.invoices[iid];
        if (!inv) { try { await call('DELETE', '/api/invoices/' + iid); sent++; } catch (e) {} continue; }
        try { await call('POST', '/api/invoices', { body: forWire('invoices', inv) }); sent++; inv._synced = true; }
        catch (e) { failed++; queue.invoices[iid] = true; if (e.offline) throw e; }
      }
      for (var fid of Object.keys(queue.followups)) {
        var fu = (D.followups || []).filter(function (x) { return x.id === fid; })[0];
        delete queue.followups[fid];
        if (!fu) { try { await call('DELETE', '/api/followups/' + fid); sent++; } catch (e) {} continue; }
        try { await call('POST', '/api/followups', { body: forWire('followups', fu) }); sent++; fu._synced = true; }
        catch (e) { failed++; queue.followups[fid] = true; if (e.offline) throw e; }
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
      /* anything that arrived while this was in flight, and anything still
         queued, gets another go rather than waiting for an unrelated change */
      if (askedAgain || count()) { askedAgain = false; schedule(); }
      /* ⚠️ THE `_synced` MARKS HAVE TO REACH localStorage, or a reload forgets
         which records the server already has and the whole book is sent up
         again — and worse, the "only in this browser" count reads as though
         nothing had ever saved. */
      if (sent && G.saveLocal) G.saveLocal();
      if (count()) schedule();
      if (G.paintSync) G.paintSync();
      /* ⚠️ AND NOW THE FILES THAT WERE WAITING ON THOSE RECORDS.
         A document is refused outright if the engagement it belongs to is not on
         the server yet ("No such record to file it against"), so the moment the
         records land, anything stranded is tried again. Without this, ordering
         is left to luck and to somebody noticing a red line on a row. */
      if (sent && G.retryStrandedDocs) {
        try { G.retryStrandedDocs(); } catch (e) {}
      }
      /* the count on screen is now wrong until something repaints it */
      if (sent && G.render) G.render();
    }
    return { sent: sent, failed: failed };
  }

  /* ---- for callers that must actually WAIT for the book to be up ----

     `flush` used to be push itself, so a caller awaiting it got `undefined` the
     moment another push held the lock and carried on as though everything had
     been sent. A pull then replaced the store. Waits for the lock, then pushes,
     and only then answers. */
  async function flush() {
    for (var i = 0; i < 60 && state.pushing; i++) {
      await new Promise(function (r) { setTimeout(r, 250); });
    }
    return push();
  }

  /* The client's field names are not all the server's. Map them once, here,
     rather than letting the difference leak into every call site. */
  /* ⚠️ THE TWO SIDES NAME THINGS DIFFERENTLY, and the difference is exactly the
     kind that fails silently. The console says `opp`, `client` and `of`; the
     tables say `opp_id`, `client_id` and `of_n`. The server writes from an
     ALLOWLIST of columns, so a field under the wrong name is not rejected — it
     is simply not written, and nobody finds out until somebody asks where the
     invoice went. Mapped here, and mapped back in adoptRemote. */
  function forWire(table, rec) {
    var out = Object.assign({}, rec);
    if (table === 'opportunities') {
      out.client_id = rec.client || rec.client_id;
      delete out.client;
    }
    if (table === 'invoices' || table === 'followups') {
      out.opp_id = rec.opp || rec.opp_id;
      out.client_id = rec.client || rec.client_id;
      delete out.opp; delete out.client;
    }
    if (table === 'invoices') {
      out.of_n = rec.of || rec.of_n || 1;
      delete out.of;
      /* proof is a reading, not a fact: kept whole, as JSON */
      if (out.proof && typeof out.proof === 'object') out.proof = JSON.stringify(out.proof);
    }
    if (table === 'followups') {
      out.by_staff = rec.by || rec.by_staff || null;
      delete out.by;
    }
    delete out.score; delete out.completeness;
    delete out._synced;          /* ours to track, not the server's to store */
    return out;
  }

  /* And back, for what the server sends down. */
  function fromWire(table, row) {
    var out = Object.assign({}, row);
    out.opp = row.opp_id;
    out.client = row.client_id;
    delete out.opp_id; delete out.client_id; delete out.updated_at;
    if (table === 'invoices') {
      out.of = row.of_n || 1;
      delete out.of_n;
      out.advance = Number(row.advance) || 0;
      if (typeof row.proof === 'string' && row.proof) {
        try { out.proof = JSON.parse(row.proof); } catch (e) { out.proof = null; }
      }
    }
    if (table === 'followups') {
      out.by = row.by_staff || null;
      out.done = !!row.done;
      delete out.by_staff;
    }
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

  /* ⚠️ THE FILE ENDPOINT WANTS A TOKEN AND A LINK CARRIES NONE, which is why
     every Open button used to be gated on the browser's own copy and a file over
     1.4 MB could not be opened at all. Fetched with the token and handed to the
     browser as a blob instead. The alternative — a token in the query string —
     puts a session key in browser history and in every referrer header. */
  async function docBlob(id) {
    if (!state.url) throw new Error('No server is configured.');
    var res = await fetch(docUrl(id), {
      headers: state.token ? { authorization: 'Bearer ' + state.token } : {}
    });
    if (!res.ok) {
      var why = 'HTTP ' + res.status;
      try { why = (await res.json()).error || why; } catch (e) {}
      throw new Error(why);
    }
    return URL.createObjectURL(await res.blob());
  }

  /* Re-sending a file we only hold as a data URL, because the original File
     object is long gone by the time somebody presses "Send it up". */
  async function uploadDataUrl(dataUrl, name, mime, holderKind, holderId, type) {
    var res = await fetch(dataUrl);
    var blob = await res.blob();
    return uploadDoc(new File([blob], name || 'document', { type: mime || blob.type }),
                     holderKind, holderId, type, name);
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

  /* ---------------- Mark ----------------
     Finding runs on the server because only the server can fetch somebody else's
     website. The browser sends the list of names it found on OpenStreetMap,
     which it can reach and the Worker cannot. */
  async function findProspects(payload) { return call('POST', '/api/prospects/find', { body: payload }); }
  async function saveProspect(patch) { return call('POST', '/api/prospects', { body: patch }); }
  /* ⚠️ THE ONE CALL THAT REACHES A STRANGER. It goes out of Bhargav's own
     mailbox through the Apps Script, and the server re-checks that the subject
     has a verified finding behind it before it will send. The browser cannot
     talk it out of that. */
  async function sendOutreach(payload) { return call('POST', '/api/outreach/send', { body: payload }); }
  async function readReplies() { return call('POST', '/api/outreach/replies', { body: {} }); }

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
    findProspects: findProspects, saveProspect: saveProspect,
    sendOutreach: sendOutreach, readReplies: readReplies,
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
    fromWire: fromWire,
    flush: flush,
    push: push,
    touch: touch,
    touchSetting: touchSetting,

    /* documents */
    uploadDoc: uploadDoc,
    docUrl: docUrl,
    fetchDoc: fetchDoc,
    editDoc: editDoc,
    dropDoc: dropDoc,
    docBlob: docBlob, uploadDataUrl: uploadDataUrl,

    /* people */
    addStaff: addStaff,

    call: call
  };
})();
