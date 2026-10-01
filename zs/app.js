/* Product Cart console \u2014 shell, state, router, and the owner's controls.
   stock.js / crm.js / autos.js register themselves into VIEWS and ACTIONS.
   One render() rebuilds #shell from state; every click flows through one
   delegated listener reading data-act. No framework, no build step. */
(function () {
  'use strict';

  var VIEWS = {}, ACTIONS = {};
  var D = null;            // the whole demo store
  /* THERE IS ONE PRODUCT LIST: D.products, edited in Settings → What we sell.
     There used to be two — a shipped data/lines.json with one row, and
     D.products with two — plus an edits map on top. So the floor price on the
     dashboard came from a file nobody could edit, the target came from the
     store, and the two disagreed. One list now, in the store, editable. */
  var SHEET = null;        // data/sheet.csv parsed, if present
  var booted = false;

  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return ZS.esc(s); };

  /* ---------------- storage ---------------- */

  function blank() {
    return {
      v: 9, session: null, access: ZS.defaultAccess(),
      roles: Object.keys(ZS.ROLES).map(function (r) {
        return { id: r, name: ZS.ROLES[r].label, custom: false };
      }),
      clients: [], messages: [], automations: [], invoices: [], picklists: {}, campaigns: [],
      runs: [], proposals: [], agentModes: {}, jarvisLog: [],
      edits: {}, audit: [], activity: [], followups: [], sales: [], syncLog: [],
      /* Nothing is deleted; it is moved here and kept for thirty days. */
      bin: [],
      /* where the backup sheet is, once it has been made */
      backup_sheet: null,
      /* conversations: WhatsApp and Instagram, one row per person per channel */
      threads: [],
      mayAssign: false,
      /* Mark's board: businesses found, read and scored */
      prospects: [],
      sends: [],
      /* ⚠️ MARK DOES NOT WRITE THIS. It is what he leads with and what he has
         been told to leave alone, and it only moves when somebody approves a
         proposal. null means "the order in core.js", which is the honest
         default: no evidence yet, so no opinion yet. */
      outreach_playbook: null,
      targets: JSON.parse(JSON.stringify(ZS.DEFAULT_TARGETS)),
      staff: [],                 /* filled by the seed, or by first-run setup */
      products: JSON.parse(JSON.stringify(ZS.DEFAULT_PRODUCTS)),
      usd_rate: ZS.usdRate(),    /* what a dollar costs, and the day somebody said so */
      branches: [],              /* gone; kept so an old store migrates cleanly */
      opportunities: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(ZS.APP_KEY);
      var d = raw ? JSON.parse(raw) : null;
      if (!d || !d.v) return blank();
      var NOW = blank().v;
      /* Derived, not written out. This gate named "5" in two places, which is the
         same trap the comment below describes: the number and the shape drift
         apart the moment somebody bumps one and not the other. */
      if (d.v > NOW) return blank();
      /* ⚠️ The version gate is why the agency rewrite crashed a real browser:
         the rename from `cars` to `lines` shipped inside migrate(), but every
         store already written was v3, so migrate() never ran and `o.lines` was
         undefined on the first render. A shape change needs a BUMP, not just a
         migration step. */
      if (d.v < NOW) d = migrate(d);
      var b = blank();
      /* Fill anything missing AND repair anything of the wrong type — a half
         written or hand-edited store must not be able to take a screen down. */
      Object.keys(b).forEach(function (k) {
        if (!(k in d) || d[k] === null || d[k] === undefined) { d[k] = b[k]; return; }
        if (Array.isArray(b[k]) && !Array.isArray(d[k])) d[k] = b[k];
        else if (!Array.isArray(b[k]) && typeof b[k] === 'object' && typeof d[k] !== 'object') d[k] = b[k];
      });
      return d;
    } catch (e) { return blank(); }
  }

  /* Somebody's browser is still holding data written before the floor and the
     pipeline were merged. Carry their work forward rather than wiping it. */
  function migrate(d) {
    d.opportunities = d.opportunities || [];
    d.opportunities.forEach(function (o) {
      /* this field was named differently before the agency rewrite */
      if (o.lines === undefined && o.products !== undefined) { o.lines = o.products; delete o.products; }
      if (o.won_line === undefined && o.won_car !== undefined) { o.won_line = o.won_car; delete o.won_car; }
      /* The fee replaced a budget range that had no input. Take whatever was
         there rather than zeroing a deal somebody already priced. */
      if (o.fee == null) o.fee = o.budget_max || o.budget_min || o.won_price || null;
      ['budget_min', 'budget_max', 'wants', 'trade_in', 'finance'].forEach(function (k) { delete o[k]; });
      ['requirements', 'meetings', 'deliverables', 'docs'].forEach(function (k) {
        if (!Array.isArray(o[k])) o[k] = [];
      });
    });
    /* follow-ups and log rows pointed at `.product` before the rename */
    (d.followups || []).forEach(function (f) {
      if (f.line === undefined && f.car !== undefined) { f.line = f.car; delete f.car; }
    });
    (d.activity || []).forEach(function (x) {
      if (x.line === undefined && x.car !== undefined) { x.line = x.car; delete x.car; }
    });
    (d.opportunities || []).forEach(function (o) {
      o.stage = ZS.fixStage(o.stage);
      o.inplay = o.inplay || [];
      o.lines = o.lines || [];
      if (o.stage === 'Won' && !o.outcome) o.outcome = 'won';
      if (o.stage === 'Lost' && !o.outcome) o.outcome = 'lost';
    });
    /* visits were a separate model; anyone still on the floor becomes an
       opportunity at In service line so nobody is lost */
    (d.visits || []).forEach(function (v) {
      if (v.status === 'done') return;
      if (d.opportunities.some(function (o) { return o.client === v.client && ZS.isOpen(o); })) return;
      d.opportunities.push(ZS.newOpp({
        client: v.client, assigned_to: v.owner, stage: 'In service line',
        title: v.brief || 'Enquiry', created: String(v.at || '').slice(0, 10) || ZS.today(),
        lines: (v.items || []).map(function (i) { return i.product_id; })
      }));
    });
    delete d.visits;
    (d.clients || []).forEach(function (c) { delete c.stage; });
    if (!Array.isArray(d.automations)) d.automations = [];
    d.automations.forEach(function (a) {
      a.stages = (a.stages || []).map(ZS.fixStage).filter(function (x, i, arr) {
        return arr.indexOf(x) === i;
      });
      /* conditions and steps arrived after some of these were written */
      if (!Array.isArray(a.sources)) a.sources = [];
      if (!Array.isArray(a.conds)) a.conds = [];
      if (!Array.isArray(a.actions)) a.actions = [];
      if (!a.trigger || !a.trigger.type) a.trigger = { type: 'new_enquiry' };
    });

    /* A persisted access map predates any capability added since. Backfill from
       the role's defaults, never overwriting a choice the owner already made —
       this is what stripped Targets and Reports out of the nav. */
    d.access = d.access || {};
    Object.keys(d.access).forEach(function (role) {
      var base = ZS.ACCESS_DEFAULT[role] || ZS.NO_ACCESS;
      Object.keys(base).forEach(function (cap) {
        if (d.access[role][cap] === undefined) d.access[role][cap] = base[cap];
      });
    });
    /* The role list the People and Roles tabs render from is stored, so a role
       added to core since this store was written has to be appended to it too —
       without disturbing a role the owner created or renamed. */
    d.roles = Array.isArray(d.roles) ? d.roles : [];
    Object.keys(ZS.ROLES).forEach(function (r) {
      if (!d.roles.some(function (x) { return x.id === r; })) {
        d.roles.push({ id: r, name: ZS.ROLES[r].label, custom: false });
      }
    });
    /* A deal won before processing existed has no transfer file. Open one, so
       the product does not simply vanish between "sold" and "theirs". */
    (d.opportunities || []).forEach(function (o) {
      if (o.outcome === 'won' && !o.proc) ZS.startProc(o, o.closed);
    });
    /* A client used to be a person with one mobile. It is a company now, so the
       person we had becomes its first contact — `c.contact` held their name in
       the seed, `c.name` the company. Losing this would throw away who we
       actually talk to at each client. */
    (d.clients || []).forEach(function (c) {
      if (!Array.isArray(c.contacts)) c.contacts = [];
      if (!c.contacts.length && (c.contact || c.mobile)) {
        c.contacts.push(ZS.newContact({
          name: c.contact || c.name, designation: c.designation || '',
          mobile: c.mobile, email: c.email, primary: true
        }));
      }
      if (!c.address || typeof c.address !== 'object') {
        c.address = ZS.newAddress({ city: c.city || '', country: c.country || 'India' });
      }
      if (!c.type) {
        /* anything that ever bought is a client, not a lead */
        var bought = (d.opportunities || []).some(function (o) {
          return o.client === c.id && o.outcome === 'won';
        });
        c.type = bought ? 'client' : 'lead';
      }
      if (!Array.isArray(c.docs)) c.docs = [];
      /* Dealer fields with no input anywhere, dropped on upgrade. `shown` is NOT
         one of them — it is the mark ledger and addMark() writes to it, so
         deleting it here was what made the first stage move to Pitched throw. */
      ['budget_min', 'budget_max', 'wants', 'trade_in', 'finance', 'wishlist']
        .forEach(function (k) { delete c[k]; });
      if (!Array.isArray(c.shown)) c.shown = [];
      if (c.website === undefined) c.website = '';
      if (c.instagram === undefined) c.instagram = '';
      if (c.sector === undefined) c.sector = '';
    });
    d.picklists = d.picklists || {};
    d.campaigns = Array.isArray(d.campaigns) ? d.campaigns : [];
    ['runs', 'proposals', 'jarvisLog'].forEach(function (k) {
      if (!Array.isArray(d[k])) d[k] = [];
    });
    if (!d.agentModes || typeof d.agentModes !== 'object') d.agentModes = {};

    /* Staff written before people had a mobile or an email. It used to hand a
       passwordless account a hard-coded fallback string, which is
       how a default credential gets reinvented after you have removed it. An
       account with no password now simply cannot sign in until somebody issues
       one, which is the honest state and visible on the People tab. */
    (d.staff || []).forEach(function (u) {
      if (u.mobile === undefined) u.mobile = '';
      if (u.email === undefined) u.email = '';
      if (u.pass === undefined) u.pass = '';
    });
    /* the scope once called 'branch' is called 'line', because a branch was a
       showroom and this is the product somebody is scoped to */
    Object.keys(d.access || {}).forEach(function (role) {
      if (d.access[role] && d.access[role].scope === 'branch') d.access[role].scope = 'line';
    });
    Object.keys(ZS.ACCESS_DEFAULT).forEach(function (role) {
      if (!d.access[role]) d.access[role] = Object.assign({}, ZS.ACCESS_DEFAULT[role]);
    });
    (d.followups || []).forEach(function (f) {
      if (!f.method) f.method = 'Call';
      if (!f.note && f.text) { f.note = f.text; delete f.text; }
      if (!('line' in f)) f.line = null;
    });
    d.activity = d.activity || [];
    d.staff = Array.isArray(d.staff) ? d.staff : [];
    d.staff.forEach(function (u) {
      /* A store written by the earlier build has people on roles this one does
         not have — 'manager', 'sales', 'inventory', 'telecaller'. Every screen
         read ZS.ROLES[u.role].label unguarded, so those people crashed the whole
         console rather than merely looking odd. Re-home them on the nearest real
         role and keep the old name, so the owner can see what happened and fix
         it deliberately instead of finding out by exception. */
      if (!ZS.ROLES[u.role] && !(d.roles || []).some(function (r) { return r.id === u.role; })) {
        u.former_role = u.role;
        u.role = ({ manager: 'director', storemanager: 'director', sales: 'account',
                    telecaller: 'account', inventory: 'builder' })[u.role] || 'contractor';
      }
    });
    /* A session pointing at somebody who is no longer on the roster signs out
       rather than rendering a console for a ghost. */
    if (d.session && !(d.staff || []).some(function (u) { return u.id === d.session; })) {
      d.session = null;
    }
    /* ⚠️ A STORE SEEDED BEFORE A FIELD EXISTED NEVER GETS IT.

       The demo is seeded once, on the first load, and never again. So when the
       model gained `product` and `scope`, every store already in a browser went
       on showing "—" in those columns — correct code, stale data, and no way to
       tell the difference by reading either one. The engagement book is a file
       we ship, so for the seeded engagements it is the source of truth and can
       simply be read back. Anything typed in by hand is left alone. */
    var BOOK = (typeof window !== 'undefined' && window.ENGAGEMENTS) || [];
    if (BOOK.length) {
      (d.opportunities || []).forEach(function (o) {
        if (o.product && o.scope) return;
        var c = (d.clients || []).filter(function (x) { return x.id === o.client; })[0];
        if (!c) return;
        var e = BOOK.filter(function (x) { return x.client === c.name; })[0];
        if (!e) return;
        if (!o.product) o.product = e.product;
        if (!o.scope) o.scope = e.scope;
        if (!o.lines || !o.lines.length) o.lines = [o.product];
        if (!o.inplay || !o.inplay.length) o.inplay = [o.product];
      });
    }
    /* whatever is left without a product still needs one: the reference series
       is keyed on it, so a blank there means a record with no reference. */
    (d.opportunities || []).forEach(function (o) {
      if (!o.product) o.product = (ZS.PRODUCTS[0] || {}).id;
    });

    /* ---- service lines became products ----

       They were the same split twice: b1 "Cockpit builds" alongside the
       Agentic Cockpit product, b2 "Automation & GHL" alongside AI Automations.
       Anything still carrying a branch gets the matching product, and the
       branch itself is dropped rather than left to rot as a field nothing
       reads. A branch we cannot map is left on the record under `former_branch`
       so it is visible rather than silently discarded. */
    if (!Array.isArray(d.products) || !d.products.length) {
      d.products = JSON.parse(JSON.stringify(ZS.DEFAULT_PRODUCTS));
      /* carry across whatever targets the old service lines held, so a number
         somebody set by hand is not quietly reset to the default */
      (d.branches || []).forEach(function (b) {
        var pid = b.id === 'b1' ? 'cockpit' : b.id === 'b2' ? 'automations' : null;
        var prod = pid && d.products.filter(function (x) { return x.id === pid; })[0];
        if (prod && b.target && (b.target.units || b.target.value)) prod.target = b.target;
      });
    }
    /* The dollar figure was a STORED field filled in once at a rate hard-coded in
       source. ₹69,999 kept reading $838 at 83.5 while the real rate was near 96.
       It is computed now, from a rate that lives here and is editable. */
    (d.products || []).forEach(function (p) { delete p.usd; });
    if (!d.usd_rate || !(Number(d.usd_rate.rate) > 0)) d.usd_rate = ZS.usdRate();
    ZS.setUsdRate(d.usd_rate);
    ZS.setProducts(d.products);

    var BRANCH_TO_PRODUCT = { b1: 'cockpit', b2: 'automations' };
    [].concat(d.clients || [], d.opportunities || []).forEach(function (r) {
      if (!r.branch) { delete r.branch; return; }
      var pid = BRANCH_TO_PRODUCT[r.branch];
      if (pid) { if (!r.product) r.product = pid; }
      else r.former_branch = r.branch;
      delete r.branch;
    });
    (d.staff || []).forEach(function (u) {
      if (!u.branch) return;
      u.line = BRANCH_TO_PRODUCT[u.branch] || u.line || null;
      delete u.branch;
    });
    d.branches = [];

    /* An engagement now names WHICH person at the company it runs through. One
       opened before this existed gets the company's main contact, which is what
       every screen was silently assuming anyway, so nothing moves for a company
       with one person and everything becomes explicit for a company with three. */
    (d.opportunities || []).forEach(function (o) {
      if (o.contact) return;
      var c = (d.clients || []).filter(function (x) { return x.id === o.client; })[0];
      var ct = ZS.primaryContact(c);
      o.contact = ct ? ct.id : null;
    });

    d.bin = Array.isArray(d.bin) ? d.bin : [];
    /* Swept here rather than on a timer: a timer nobody keeps alive is a promise
       nobody keeps, and a tab that has been shut for a month should still find
       the bin empty of anything older than thirty days when it opens. */
    var swept = ZS.binSweep(d);
    if (swept) {
      d.activity = (d.activity || []).concat([]);   /* logged below, once D exists */
      d._sweptOnLoad = swept;
    }

    ZS.ensureRefs(d);
    d.v = blank().v;   /* whatever the current shape is, never a literal */
    return d;
  }
  /* What changed since the last save, so the push is a diff rather than the
     whole book. Compared by a cheap hash of the record, because deep-comparing
     every client on every keystroke is how a form starts to feel slow. */
  var LAST_SEEN = {};
  function stamp(r) {
    try { return JSON.stringify(r).length + ':' + (r.updated || r.updated_at || r.last_touch || ''); }
    catch (e) { return String(Math.random()); }
  }
  /* Record what everything looks like now, WITHOUT queueing any of it. Used
     right after a pull, so the first local edit is the first thing pushed. */
  function primeChanges() {
    LAST_SEEN = {};
    (D.clients || []).forEach(function (c) { LAST_SEEN['c:' + c.id] = stamp(c); });
    (D.opportunities || []).forEach(function (o) { LAST_SEEN['o:' + o.id] = stamp(o); });
    (D.invoices || []).forEach(function (i) { LAST_SEEN['i:' + i.id] = stamp(i); });
    (D.followups || []).forEach(function (f) { LAST_SEEN['f:' + f.id] = stamp(f); });
    ['access', 'targets', 'picklists', 'products', 'usd_rate', 'roles', 'agentModes'].forEach(function (k) {
      LAST_SEEN['s:' + k] = stamp(D[k]);
    });
  }

  function queueChanges() {
    if (!window.API || !API.signedIn()) return;
    (D.clients || []).forEach(function (c) {
      var k = 'c:' + c.id, now = stamp(c);
      if (LAST_SEEN[k] !== now) { LAST_SEEN[k] = now; API.touch('clients', c); }
    });
    (D.opportunities || []).forEach(function (o) {
      var k = 'o:' + o.id, now = stamp(o);
      if (LAST_SEEN[k] !== now) { LAST_SEEN[k] = now; API.touch('opportunities', o); }
    });
    /* ⚠️ INVOICES AND FOLLOW-UPS WERE NOT ON THIS LIST, and nothing said so.
       They were read down from the server and never sent up, so an invoice
       raised here lived in this browser until the next pull replaced it with the
       server's empty list. On the money layer. */
    (D.invoices || []).forEach(function (i) {
      var k = 'i:' + i.id, now = stamp(i);
      if (LAST_SEEN[k] !== now) { LAST_SEEN[k] = now; API.touch('invoices', i); }
    });
    (D.followups || []).forEach(function (f) {
      var k = 'f:' + f.id, now = stamp(f);
      if (LAST_SEEN[k] !== now) { LAST_SEEN[k] = now; API.touch('followups', f); }
    });
    /* something deleted here has to be deleted there. Seen once and now gone
       means exactly that; the queue turns a missing record into a DELETE. */
    Object.keys(LAST_SEEN).forEach(function (k) {
      var kind = k.slice(0, 2);
      if (kind !== 'i:' && kind !== 'f:') return;
      var id = k.slice(2);
      var list = kind === 'i:' ? (D.invoices || []) : (D.followups || []);
      if (list.some(function (x) { return x.id === id; })) return;
      delete LAST_SEEN[k];
      API.touch(kind === 'i:' ? 'invoices' : 'followups', { id: id });
    });
    ['access', 'targets', 'picklists', 'products', 'usd_rate', 'roles', 'agentModes'].forEach(function (key) {
      var k = 's:' + key, now = stamp(D[key]);
      if (LAST_SEEN[k] !== now) { LAST_SEEN[k] = now; API.touchSetting(key); }
    });
  }

  /* Just the cache, with none of the queueing. The push loop calls this after a
     successful send so the `_synced` marks survive a reload; calling save() there
     would re-enter the very queue that is mid-flight. */
  function saveLocal() {
    try { localStorage.setItem(ZS.APP_KEY, JSON.stringify(D)); } catch (e) {}
  }

  function save() {
    /* Anything new gets its reference here, so no creation path has to remember
       to mint one and none can be missed. */
    ZS.ensureRefs(D);
    /* The local store is the cache and stays instant. The server hears about it
       a moment later, batched, so the screen never waits on a network call. */
    queueChanges();
    try { localStorage.setItem(ZS.APP_KEY, JSON.stringify(D)); }
    catch (e) { toast('Storage is full — remove an engagement with heavy attachments.', true); }
  }

  /* Taking a document in.

     A photographed document — which is how a signed MOU actually arrives, over
     WhatsApp — is downscaled and kept. Anything else under the cap is kept whole
     as a data URL so it can genuinely be opened again: "viewable" has to mean
     the file comes back, not that we remembered its name.

     Above the cap nothing is stored. localStorage is a few megabytes for the
     WHOLE cockpit, and three unread PDFs would evict every client record in it.
     The row then says so on its face rather than offering a link that 404s. */
  var DOC_KEEP_MAX = 1400000;        // ~1.4 MB per file, after any downscaling

  function takeDoc(file, kind, type, cb) {
    var base = { type: type, name: file.name, size: file.size, mime: file.type || '',
                 by: D.session };
    if (/^image\//.test(file.type || '')) {
      shrinkImage(file, function (url) {
        base.data = url && url.length < DOC_KEEP_MAX ? url : null;
        if (!base.data) base.too_big = true;
        cb(ZS.newDoc(base));
      });
      return;
    }
    if (file.size > DOC_KEEP_MAX) { base.too_big = true; cb(ZS.newDoc(base)); return; }
    var r = new FileReader();
    r.onload = function () {
      var url = String(r.result || '');
      base.data = url.length < DOC_KEEP_MAX ? url : null;
      if (!base.data) base.too_big = true;
      cb(ZS.newDoc(base));
    };
    r.onerror = function () { cb(ZS.newDoc(base)); };
    r.readAsDataURL(file);
  }

  /* Downscale before storing — full-size data URLs would blow localStorage. */
  function shrinkImage(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1400, w = img.width, h2 = img.height;
        if (w > max || h2 > max) { var sc = max / Math.max(w, h2); w = Math.round(w * sc); h2 = Math.round(h2 * sc); }
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h2;
        cv.getContext('2d').drawImage(img, 0, 0, w, h2);
        cb(cv.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () { cb(null); };
      img.src = r.result;
    };
    r.onerror = function () { cb(null); };
    r.readAsDataURL(file);
  }

  function fileSize(n) {
    if (!n) return '';
    return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  }

  function me() { return D.session ? ZS.staffById(D.session) : null; }
  /* Wired from sign-in, from switching user, and from boot with a live session. */
  function G_afterLogin() {
    pulseStart();
    if (!window.GE || typeof GE.afterLogin !== 'function') return false;
    try { GE.afterLogin(); } catch (e) { console.error('sweep failed', e); }
    return true;
  }
  /* ================= WATCHING FOR THINGS THAT HAPPENED ELSEWHERE =================

     An enquiry arrives from the website, or a colleague moves a deal, and until
     now you found out by reloading. A cockpit you have to refresh to trust is a
     cockpit you check instead of one that tells you.

     HOW IT WORKS, and why it is a poll rather than a socket. Every twenty
     seconds, while the tab is actually in front, it asks the server three counts
     and the id of the newest thing anybody did. That request is tiny and the
     answer is usually identical. Only when a number moves does it pull the book
     and re-render. A websocket would be fewer bytes and one more thing to
     reconnect, reauthenticate and debug, for a screen where twenty seconds late
     is not late.

     ⚠️ IT USED TO REFUSE TO POLL A HIDDEN TAB, and that one line is why no web
     notification ever arrived. Read the two guards together: the tick returned
     early whenever `document.hidden` was true, and `announce()` only sends a
     real notification when `document.hidden` is true. So the notification could
     fire only in the state that stopped it being reached. It was never a
     permission problem, a browser problem or a Notification-API problem. It was
     unreachable code.

     THE RULE NOW: a hidden tab IS polled, once a minute rather than every twenty
     seconds, and only when notification permission has actually been granted —
     because that is the only case where polling a tab nobody is looking at buys
     anything. Without permission there is nothing to tell you, so it costs
     nothing again, which was the point of the old guard. Browsers throttle timers
     in background tabs to about once a minute anyway, so this asks for roughly
     what it will be given. */

  var PULSE_MS = 20000;
  var HIDDEN_MS = 60000;     /* a backgrounded tab, and only when it can tell you */
  var pulseTimer = null;
  var lastPulse = null;
  var lastAsk = 0;

  function pulseStart() {
    pulseStop();
    if (!window.API || !API.signedIn()) return;
    pulseTimer = setInterval(pulseTick, PULSE_MS);
    /* ask once now, so a tab brought back to the front is right immediately
       rather than up to twenty seconds stale */
    pulseTick();
  }
  function pulseStop() {
    if (pulseTimer) { clearInterval(pulseTimer); pulseTimer = null; }
  }

  function pulseTick() {
    if (!window.API || !API.signedIn()) return pulseStop();

    if (document.hidden) {
      /* nobody looking and no way to tell them: there is nothing this can do */
      if (!notifyOn()) return;
      if (Date.now() - lastAsk < HIDDEN_MS) return;
    }
    lastAsk = Date.now();

    API.pulse().then(function (p) {
      if (!p) return;
      if (!lastPulse) { lastPulse = p; return; }       /* the first read is the baseline */
      var moved = p.clients !== lastPulse.clients ||
                  p.opportunities !== lastPulse.opportunities ||
                  p.top !== lastPulse.top;
      var newClients = p.clients - lastPulse.clients;
      var newOpps = p.opportunities - lastPulse.opportunities;

      /* ⚠️ THE BASELINE MOVES ONLY WHEN THE PULL LANDS.
         This used to update it here, before the pull. One pull that failed — a
         dropped connection, a tab waking up on hotel wifi, the Worker cold and
         slow — and the baseline had already moved past the change, so it was
         never noticed again. The lead was on the server and the cockpit sat there
         looking current until somebody reloaded, which is precisely the
         complaint: "I had to reload to see that I had a lead." A pull that fails
         now simply leaves the baseline where it was and the next tick, twenty
         seconds later, tries again. */
      if (!moved) { lastPulse = p; return; }

      return flushFirst().then(function () { return API.pull(); }).then(function (remote) {
        lastPulse = p;
        adoptRemote(remote);
        announce(newClients, newOpps);
      });
    }).catch(function () { /* offline is not an error worth shouting about */ });
  }

  /* ---------------- telling you, without stealing the screen ----------------

     A toast if you are looking, a real notification if you are not. Permission is
     asked once, from a button in Settings, because a browser refuses a prompt
     that did not come from something you clicked, and because a site that asks
     the second it loads gets denied by reflex. */

  function notifyOn() {
    try { return typeof Notification !== 'undefined' && Notification.permission === 'granted'; }
    catch (e) { return false; }
  }

  function announce(newClients, newOpps) {
    var bits = [];
    if (newOpps > 0) bits.push(newOpps + (newOpps === 1 ? ' new enquiry' : ' new enquiries'));
    if (newClients > 0) bits.push(newClients + (newClients === 1 ? ' new client' : ' new clients'));
    var what = bits.length ? bits.join(' and ') : 'Something changed';

    /* what it actually was, read off the board rather than guessed */
    var latest = (D.opportunities || []).slice().sort(function (a, b) {
      return String(b.created || '').localeCompare(String(a.created || ''));
    })[0];
    var who = latest ? (clientById(latest.client) || {}).name : '';
    var line = bits.length && who
      ? what + ' — ' + who + (latest.stage ? ', at ' + latest.stage : '')
      : what + ' in the cockpit';

    /* ⚠️ NEVER REDRAW OVER SOMEBODY'S TYPING.

       The engagement panel stages what you type until you press save. A pulse
       that re-rendered the screen while eight boxes were half filled in would
       throw the lot away, twenty seconds after a colleague touched an unrelated
       deal. So when there is unsaved work the news is told and the redraw waits
       for the save, which renders anyway. */
    if (window.GE && typeof GE.unsaved === 'function' && GE.unsaved()) {
      toast(line + ' — the screen will catch up when you save what you are typing.');
      return;
    }

    if (!document.hidden) { toast(line); render(); return; }

    if (notifyOn()) {
      try {
        var n = new Notification('ZippyScale', {
          body: line,
          tag: 'zs-pulse',           /* one notification, replaced, never a stack */
          icon: 'img/zippyscale-logo-mark-dark.png'
        });
        n.onclick = function () { try { window.focus(); } catch (e) {} n.close(); };
      } catch (e) { /* some browsers refuse a constructor outside a worker */ }
    }
    render();
  }

  function askToNotify() {
    if (typeof Notification === 'undefined') {
      toast('This browser cannot show notifications.', true);
      return;
    }
    if (Notification.permission === 'denied') {
      toast('Notifications are blocked for this site. Turn them back on in the ' +
            'browser’s site settings, next to the address bar.', true);
      return;
    }
    Notification.requestPermission().then(function (r) {
      if (r === 'granted') {
        toast('On. You will be told when something arrives while you are elsewhere.');
        try { new Notification('ZippyScale', { body: 'Notifications are on.', tag: 'zs-test' }); }
        catch (e) {}
      } else {
        toast('Not allowed. Nothing will be shown.', true);
      }
      render();
    });
  }

  /* A role's display name comes from the store, not core, so a renamed or
     owner-created role still reads correctly. */
  function roleName(id) {
    var r = ((D && D.roles) || []).filter(function (x) { return x.id === id; })[0];
    return (r && r.name) || (ZS.ROLES[id] && ZS.ROLES[id].label) || id;
  }
  function syncStaff() {
    ZS.setStaff(D.staff || []);
    ZS.setProducts(D.products || []);
    ZS.setUsdRate(D.usd_rate || ZS.usdRate());
  }
  function acc() { return ZS.acc(me(), D.access); }
  function can(cap) { return !!acc()[cap]; }

  /* ---------------- products, which are also the service lines ---------------- */

  /* One list, straight out of the store. No projection, no second shape: a
     product has an id, a name, a code that prefixes its references, a floor
     price and a monthly target, and every screen reads those same names. */
  function productList() { return D.products || []; }
  function productById_view(id) { return ZS.productById(id); }

  /* ---------------- the activity log ----------------
     One line per thing anybody actually did. Written at the point of the change
     rather than inferred afterwards, so it records intent, not just a diff. */

  /* Every kind something logs must be in here, and every group in here must be
     in KIND_GROUPS, or the row lands in the activity log with no group and the
     filter can never show it. Eleven kinds were missing — invoices, documents,
     delivery moves, agent runs and password resets among them, which is to say
     the audit trail was blind to the most sensitive things in the build. Three
     more pointed at a group called 'Floor' that KIND_GROUPS never listed.
     check_views.js now asserts both directions, so this cannot drift again. */
  var KINDS = {
    product_edit:  ['Products', 'edit'],  product_add:    ['Products', 'add'],
    rate_set:      ['Products', 'edit'],

    client_add:    ['Clients', 'add'],    client_assign:  ['Clients', 'edit'],
    client_edit:   ['Clients', 'edit'],   mark_add:       ['Clients', 'edit'],
    msg_approve:   ['Clients', 'add'],    msg_dismiss:    ['Clients', 'edit'],

    opp_new:       ['Pipeline', 'add'],   opp_stage:      ['Pipeline', 'edit'],
    opp_won:       ['Pipeline', 'win'],   opp_lost:       ['Pipeline', 'lose'],
    opp_reopen:    ['Pipeline', 'edit'],  opp_line:       ['Pipeline', 'edit'],
    opp_edit:      ['Pipeline', 'edit'],
    opp_delete:    ['Pipeline', 'lose'],

    follow_log:    ['Follow-ups', 'add'], follow_done:    ['Follow-ups', 'edit'],

    proc_stage:    ['Delivery', 'edit'],
    doc_add:       ['Documents', 'add'],  doc_remove:     ['Documents', 'lose'],
    doc_edit:      ['Documents', 'edit'],

    wa_template:   ['WhatsApp', 'edit'],  wa_settings:   ['WhatsApp', 'edit'],

    data_export:   ['Team & settings', 'edit'], data_import: ['Team & settings', 'add'],

    invoice_add:   ['Money', 'add'],      invoice_state:  ['Money', 'edit'],
    invoice_drop:  ['Money', 'lose'],

    agent_run:     ['Agents', 'edit'],

    target_set:    ['Team & settings', 'edit'], staff_add:    ['Team & settings', 'add'],
    staff_edit:    ['Team & settings', 'edit'], staff_remove: ['Team & settings', 'lose'],
    staff_pass:    ['Team & settings', 'edit'], branch_add:   ['Team & settings', 'add'],
    branch_remove: ['Team & settings', 'lose'], access_change:['Team & settings', 'edit'],
    role_add:      ['Team & settings', 'add'],

    auto_toggle:   ['Automations', 'edit'], auto_save:    ['Automations', 'add'],
    /* the chatbot: what it is set to matters as much as what it says, so both
       are worth a line in the log */
    auto_edit:     ['Automations', 'edit']
  };
  var KIND_GROUPS = ['Products', 'Clients', 'Pipeline', 'Follow-ups', 'Delivery',
                     'Documents', 'Money', 'Agents', 'Automations', 'WhatsApp', 'Team & settings'];

  function log(kind, text, refs) {
    refs = refs || {};
    D.activity.unshift({
      id: 'l' + Date.now() + Math.floor(Math.random() * 1000),
      at: new Date().toISOString(), by: D.session, kind: kind, text: text,
      client: refs.client || null, opp: refs.opp || null, line: refs.line || null
    });
    if (D.activity.length > 600) D.activity.length = 600;
  }

  /* ---------------- speak instead of typing ----------------
     The Web Speech API, which is Chrome and Edge only. If it is not there we say
     so rather than showing a button that does nothing.

     Two rules, both learned the hard way:

     1. NOTHING ALREADY SAID IS EVER LOST. The old version rebuilt the whole box
        from `e.results` on every event. That array is the browser's, not ours —
        Chrome prunes it and restarts the recogniser on its own after a pause,
        and when it does, everything before the restart disappears from the box
        mid-sentence. So finalised phrases are copied into a string WE own the
        moment they arrive, and the box is only ever that string plus whatever is
        still being said.

     2. STOPPING AND STARTING AGAIN CONTINUES, it does not begin again. Pressing
        Speak reads what is already in the box and keeps it as the base, so a
        second and third dictation land after the first rather than wiping it. */

  /* ⚠️ THE NODE IS NOT OURS TO KEEP.

     render() replaces the whole of #shell, so every element on screen is thrown
     away and rebuilt. This held `box` from the moment you pressed Speak, which
     meant that the first time anything re-rendered — sending the message you had
     just dictated is enough — the recogniser carried on writing into a detached
     element while the box you were looking at, a brand new one, stayed empty.
     Nothing errored. You just spoke and watched nothing happen.

     So: look the target up by id every time we touch it, and keep the listening
     state in a variable rather than on a button that will not survive either. */
  var REC = null;
  var HEARING = null;          /* the id of the box being dictated into, if any */

  function micTarget() { return HEARING ? document.getElementById(HEARING) : null; }
  function micButtonEl() {
    if (!HEARING) return null;
    try { return document.querySelector('[data-act="dictate"][data-id="' + HEARING + '"]'); }
    catch (e) { return null; }
  }
  /* Called after every render so the button that just replaced the old one still
     says what is happening. */
  function paintMic() {
    var b = micButtonEl();
    if (!b) return;
    b.classList.add('rec');
    b.textContent = 'Listening… tap to stop';
  }

  function dictate(targetId, btn) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!document.getElementById(targetId)) return;
    if (!SR) { toast('Speaking needs Chrome or Edge. Type it instead.', true); return; }
    if (REC) {                                   /* tapping again stops it */
      var was = HEARING;
      REC.wanted = false;
      REC.stop();
      if (was === targetId) return;              /* same box: just stop */
      /* a different box: fall through and start listening to that one instead */
    }

    /* whatever is in the box stays in the box */
    var box0 = document.getElementById(targetId);
    var base = box0.value ? box0.value.replace(/\s+$/, '') + ' ' : '';
    var settled = '';              /* finalised phrases, in a string we own */

    function paint(interim) {
      var box = document.getElementById(targetId);
      if (!box) return;            /* the screen moved on; keep listening, keep the text */
      box.value = base + settled + (interim || '');
      try { box.selectionStart = box.selectionEnd = box.value.length; } catch (e) {}
      /* let anything watching the box react, exactly as if it had been typed */
      try { box.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    }

    function done() {
      REC = null;
      HEARING = null;
      var b = micButtonEl() || btn;
      if (b) { b.classList.remove('rec'); b.textContent = '🎤 Speak'; }
    }

    var r = new SR();
    r.lang = 'en-IN';
    r.interimResults = true;
    r.continuous = true;
    r.wanted = true;

    r.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          /* banked the moment it arrives — this is the line that stops text
             vanishing when Chrome prunes its own results array */
          settled += (settled && !/\s$/.test(settled) ? ' ' : '') + t.trim() + ' ';
        } else interim += t;
      }
      paint(interim);
    };

    r.onerror = function (e) {
      if (e.error === 'no-speech' || e.error === 'aborted') return;   /* harmless */
      toast(e.error === 'not-allowed'
        ? 'The microphone is blocked. Allow it in the address bar and try again.'
        : 'Speaking stopped: ' + e.error, true);
      r.wanted = false;
    };

    r.onend = function () {
      /* Chrome ends the session by itself after a silence. If the person has not
         tapped stop, pick it straight back up — from where it left off, because
         `settled` is ours and survives the restart. */
      if (r.wanted) {
        try { r.start(); return; } catch (err) { /* fall through and stop */ }
      }
      paint('');
      done();
    };

    try {
      r.start();
      REC = r;
      HEARING = targetId;
      var b0 = micButtonEl() || btn;
      if (b0) { b0.classList.add('rec'); b0.textContent = 'Listening… tap to stop'; }
    } catch (err) {
      toast('Could not start the microphone.', true);
      done();
    }
  }

  /* Somebody sent or saved what they dictated: the words are spent, so start the
     next burst from empty rather than appending to a box that has been cleared. */
  function micReset(targetId) {
    if (!REC || (targetId && HEARING !== targetId)) return;
    REC.wanted = false;
    REC.stop();
  }

  function micButton(targetId) {
    return '<button class="micbtn" type="button" data-act="dictate" data-id="' + esc(targetId) + '">🎤 Speak</button>';
  }

  /* ---------------- where you just came from ----------------
     Every screen but Home carries a back link naming the previous one. A stack
     rather than history.back() so the label can say where it is going. */

  var HIST = [];
  var LABELS = {
    home: 'Overview', jarvis: 'Jarvis', diary: 'Diary', campaigns: 'Campaigns', stock: 'What we sell', line: 'a product', sheet: 'the sheet',
    clients: 'Clients', client: 'a client', clientnew: 'Add a client',
    opp: 'an opportunity', oppnew: 'New opportunity',
    floor: 'the Floor', inbox: 'Enquiries',
    automations: 'Automations', automation: 'a rule', reports: 'Reports',
    targets: 'Targets', team: 'Team', person: 'a colleague', bin: 'Bin', settings: 'Settings'
  };

  function labelFor(hash) {
    var r = String(hash || '').replace(/^#\//, '').split('/')[0] || 'home';
    return LABELS[r] || r;
  }
  function pushHist(hash) {
    if (HIST[HIST.length - 1] === hash) return;
    HIST.push(hash);
    if (HIST.length > 60) HIST.shift();
  }
  function backHash() {
    return HIST.length > 1 ? HIST[HIST.length - 2] : '#/home';
  }
  function backBar() {
    var here = location.hash || '#/home';
    if (here === '#/home' || here === '#/') return '';
    var to = backHash();
    return '<div class="backbar">' +
      '<button class="backbtn" data-act="goBack">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
      'Back to ' + esc(labelFor(to)) + '</button>' +
      '<a class="crumb" href="#/home">Home</a>' +
      '<span class="crumb-sep">/</span><span class="crumb now">' + esc(labelFor(here)) + '</span>' +
      '</div>';
  }

  /* ---------------- the shared date window ----------------
     One range object for the whole console, so "this month" means the same
     thing on the reports screen as it does on the client list. */

  var RANGE = { key: 'month', from: '', to: '' };
  function range() {
    var d = ZS.rangeDates(RANGE.key, RANGE.from, RANGE.to);
    return { key: RANGE.key, from: d[0], to: d[1] };
  }
  function inRange(dateStr) { return ZS.inRange(dateStr, range()); }

  function rangeBar(note) {
    var r = range();
    return '<div class="rangebar">' +
      '<span class="rlabel">Showing</span>' +
      ZS.RANGES.map(function (x) {
        return '<button class="chip" data-act="setRange" data-id="' + x[0] + '" aria-pressed="' +
          (RANGE.key === x[0] ? 'true' : 'false') + '">' + x[1] + '</button>';
      }).join('') +
      (RANGE.key === 'custom'
        ? '<span class="rcustom"><input type="date" id="r-from" value="' + esc(r.from) + '">' +
          '<span>to</span><input type="date" id="r-to" value="' + esc(r.to) + '"></span>'
        : '') +
      '<span class="rnote">' + esc(note || ZS.rangeLabel(r)) + '</span></div>';
  }

  /* ---------------- navigation ---------------- */

  var NAV = [
    ['home',        'Overview',      null],
    ['jarvis',      'Jarvis',        'clients'],
    ['floor',       'Sales',         'clients'],
    ['processing',  'Delivery',      'clients'],
    ['clients',     'Clients',       'clients'],
    ['diary',       'Diary',         'clients'],
    ['stock',       'What we sell', null],
    ['inbox',       'Inbox',         'clients'],
    ['outreach',    'Outreach',      'clients'],
    ['chatbot',     'Chatbot',       'automations'],
    ['campaigns',   'Campaigns',     'reports'],
    ['automations', 'Automations',   'automations'],
    ['reports',     'Reports',       null],
    ['activity',    'Activity',      null],
    ['targets',     'Targets',       'targets'],
    ['sheet',       'Sheet',         'editStock'],
    ['team',        'Team',          'reports'],
    ['bin',         'Bin',           'settings'],
    ['settings',    'Settings',      'settings']
  ];

  function navFor() {
    var a = acc();
    return NAV.filter(function (n) { return !n[2] || a[n[2]]; });
  }

  /* One icon family, one stroke width, drawn at 24 and rendered at 18 so the
     rail reads evenly whether it is open or collapsed. Lucide geometry. */
  var ICONS = {
    home:        '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    stock:       '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    sheet:       '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    diary:       '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    bin:         '<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
    clients:     '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5.6M18 20a5.5 5.5 0 0 0-3-4.9"/>',
    floor:       '<path d="M4 4v16"/><rect x="8" y="5" width="5" height="6" rx="1"/><rect x="15" y="9" width="5" height="6" rx="1"/>',
    processing:  '<path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6"/><path d="M17 3v4h-4M7 21v-4h4"/>',
    inbox:       '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M4.5 6.5 3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5l-1.5-6.5a2 2 0 0 0-2-1.5H6.5a2 2 0 0 0-2 1.5Z"/>',
    outreach:    '<path d="M3 11.5 21 4l-7.5 17-2.5-7.5Z"/><path d="M11 13.5 21 4"/>',
    chatbot:     '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 18v3l4-3"/>',
    automations: '<path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z"/>',
    agents:      '<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M12 3v4M9 12h.01M15 12h.01M9.5 16h5"/>',
    reports:     '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    campaigns:   '<path d="M3 11v3a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z"/><path d="M17 8.5a4 4 0 0 1 0 7"/>',
    jarvis:      '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.2"/>',
    targets:     '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
    activity:    '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
    team:        '<circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.4"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M15 19a4.5 4.5 0 0 1 6.5-4"/>',
    settings:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 19.4 9H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>'
  };
  function navIcon(k) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[k] || ICONS.home) + '</svg>';
  }

  /* The rail remembers whether it was open. A per-viewer convenience, so
     localStorage is the right home for it and a failure to read it is fine. */
  function railOpen() {
    try { return localStorage.getItem('zs_rail') !== 'closed'; } catch (e) { return true; }
  }
  function setRail(open) {
    try { localStorage.setItem('zs_rail', open ? 'open' : 'closed'); } catch (e) {}
  }

  /* The label names where the button TAKES you, not where you are: a control
     that reads "Dark mode" while you are in the dark is a statement, and people
     read it as a state and do not press it. */
  function theme() {
    var r = document.documentElement;
    return (r && r.getAttribute && r.getAttribute('data-theme')) || 'dark';
  }
  function paintTheme() {
    var el = document.getElementById('themelbl');
    if (!el) return;
    var light = theme() === 'light';
    el.textContent = light ? 'Dark mode' : 'Light mode';
    var btn = document.getElementById('themebtn');
    if (btn) btn.setAttribute('aria-label', light ? 'Switch to dark' : 'Switch to light');
  }

  function paintChrome() {
    paintTheme();
    var u = me();
    if (!u) return;
    var route = (location.hash || '#/home').split('/')[1] || 'home';
    var open = railOpen();
    document.body.className = open ? 'railopen' : 'railshut';
    $('#nav').innerHTML = navFor().map(function (n) {
      var badge = n[0] === 'inbox' ? pendingMsgs().length : 0;
      /* title carries the label so a collapsed rail is still discoverable */
      return '<a href="#/' + n[0] + '" class="' + (n[0] === route ? 'on' : '') + '" ' +
        'title="' + esc(n[1]) + '" aria-label="' + esc(n[1]) + '"' +
        (n[0] === route ? ' aria-current="page"' : '') + '>' +
        navIcon(n[0]) + '<span>' + esc(n[1]) + '</span>' +
        (badge ? '<i>' + badge + '</i>' : '') + '</a>';
    }).join('');
    /* ⚠️ THERE WAS NO WAY OUT.

       The user chip used to open the demo switcher. Gating that on hasDemo()
       for the deployed build removed the only thing it did and put nothing in
       its place — so on a real install, clicking your own name did nothing and
       there was no sign-out anywhere. A cockpit holding client credentials that
       you cannot sign out of is not a small omission. */
    $('#uchip').innerHTML =
      '<span class="av">' + esc(u.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2)) + '</span>' +
      '<span style="text-align:left"><b style="display:block">' + esc(u.name) + '</b>' +
      '<span>' + esc(roleName(u.role)) + '</span></span>' +
      '<svg class="uchev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    $('#uchip').setAttribute('aria-label', 'Signed in as ' + u.name + '. Open the account menu.');
  }

  /* Who you are, and how to stop being them. */
  function accountMenu() {
    var u = me();
    if (!u) return;
    var onServer = !!(window.API && API.signedIn());
    modal('Signed in as ' + u.name, roleName(u.role) + (onServer ? ' · on the server' : ' · this browser only'),
      '<ul class="ledger">' +
        li('Username', u.login || '—') +
        li('Role', roleName(u.role)) +
        (onServer ? li('Where', 'The server, so this book follows you') : '') +
      '</ul>' +
      (onServer
        ? '<p class="hint" style="margin-top:12px">Signing out ends this session ON THE SERVER, ' +
          'not just in this browser, so the token cannot be used again from anywhere.</p>'
        : '<p class="hint" style="margin-top:12px">Nothing is deleted. Your book stays in this browser.</p>') +
      '<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">' +
      '<button class="btn" data-act="signout">Sign out</button>' +
      (can('passwords') || u.role === 'owner'
        ? '<button class="btn alt" data-act="resetPass" data-id="' + esc(u.id) + '">Change my password</button>'
        : '') +
      (hasDemo() ? '<button class="btn alt" data-act="switchUser">Switch user</button>' : '') +
      '<button class="btn alt" data-act="closeModal">Cancel</button></div>');
  }

  function pendingMsgs() {
    return D.messages.filter(function (m) { return m.card && m.card.status === 'pending'; });
  }

  /* ---------------- render ----------------

     Every edit in this app re-renders the whole screen, which is fine — it is
     one innerHTML and it keeps the state in one place. What is NOT fine is
     throwing the reader back to the top of the page each time, which is what
     an unconditional scrollTo(0, 0) did: save a target, sort a column or type
     a letter in a search box and the page jumped.

     So: scroll to the top only on a real navigation, and on a re-render of the
     screen you are already on, put the scroll and the caret back where they
     were. Same for focus — the input you were typing in is destroyed and
     rebuilt, so it has to be found and re-focused by id. */

  var LAST_HASH = null;

  /* Not every control has an id — the target tables key their inputs on
     data-ptarget, one per person per column — so focus is found again by
     whichever of these identifies it. A `change` fires as you tab out, which
     means the element to restore is usually the NEXT field, and keeping your
     tab progression is exactly what should happen. */
  var FOCUS_BY = ['id', 'data-ptarget', 'data-btarget', 'data-person', 'data-field', 'name'];

  function focusState() {
    var a = document.activeElement;
    if (!a || !a.getAttribute) return null;
    var st = null;
    for (var i = 0; i < FOCUS_BY.length; i++) {
      var v = a.getAttribute(FOCUS_BY[i]);
      if (v) { st = { sel: '[' + FOCUS_BY[i] + '="' + v.replace(/"/g, '\\"') + '"]' }; break; }
    }
    if (!st) return null;
    /* a number input throws on selectionStart in some browsers; it has no
       caret worth restoring anyway */
    try { st.start = a.selectionStart; st.end = a.selectionEnd; } catch (e) {}
    return st;
  }

  function restoreFocus(st) {
    if (!st) return;
    var node = null;
    try { node = document.querySelector(st.sel); } catch (e) {}
    if (!node || typeof node.focus !== 'function') return;
    node.focus();
    if (st.start == null) return;
    try { node.setSelectionRange(st.start, st.end); } catch (e) {}
  }

  function render() {
    if (!D.session) { $('#login').hidden = false; $('#app').hidden = true; return; }
    $('#login').hidden = true; $('#app').hidden = false;

    var hash = location.hash || '#/home';
    var sameScreen = (hash === LAST_HASH);
    var keepY = window.scrollY || 0;
    var keepFocus = sameScreen ? focusState() : null;
    LAST_HASH = hash;

    var parts = hash.replace(/^#\//, '').split('/');
    var route = parts[0] || 'home';
    var arg = parts.slice(1).join('/');
    var view = VIEWS[route];

    paintChrome();
    pushHist(location.hash || '#/home');
    $('#backwrap').innerHTML = backBar();
    if (!view) { $('#shell').innerHTML = deny('That screen does not exist.', 'Pick something from the menu above.'); return; }

    var gate = (NAV.filter(function (n) { return n[0] === route; })[0] || [])[2];
    if (gate && !can(gate)) {
      $('#shell').innerHTML = deny('Not in your view',
        'This screen is switched off for ' + roleName(me().role).toLowerCase() +
        '. What each role can reach is set by the owner in Settings.');
      return;
    }
    try { $('#shell').innerHTML = savingBanner() + view(arg); }
    catch (e) { $('#shell').innerHTML = crashCard(e, route); console.error(e); }

    if (sameScreen) { window.scrollTo(0, keepY); restoreFocus(keepFocus); }
    else window.scrollTo(0, 0);
    /* the button that said "Listening" was just thrown away with the rest of the
       screen; tell its replacement what is going on */
    paintMic();
  }

  /* ⚠️ THE COCKPIT GOING LOCAL-ONLY USED TO BE SILENT, AND IT COST A REAL RECORD.

     A session expires. The next call comes back 401, the token is cleared, and
     `signedIn()` turns false. From that moment nothing is queued and nothing is
     sent, and the ONLY sign of it was a small pill four clicks away in Settings.
     So you carry on adding clients, engagements, follow-ups and invoices into a
     cockpit that is quietly writing to nothing but this browser.

     Nothing is lost now — `_synced` sees to that, and it all goes up the moment
     you sign in again — but finding out an hour later is not good enough when
     the fix is ten seconds. This says so at the top of every screen, until it is
     no longer true. */
  function savingBanner() {
    var api = window.API;
    if (!api || !api.configured()) return '';
    var only = unsyncedCount();

    if (!api.signedIn()) {
      return '<div class="wbar bad">' +
        '<b>Signed out of the server.</b> Everything you add is being kept in this ' +
        'browser only' + (only ? ' \u2014 ' + only + ' record' + (only === 1 ? '' : 's') +
        ' so far' : '') + '. Nothing is lost, and it all goes up the moment you sign in. ' +
        '<button class="minibtn" data-act="signInAgain">Sign in again</button></div>';
    }
    if (!api.state().online) {
      return '<div class="wbar warn">' +
        '<b>Offline.</b> ' + (only ? only + ' record' + (only === 1 ? '' : 's') + ' waiting. ' : '') +
        'They go up on their own when the connection returns.</div>';
    }
    /* Signed in, online, and still holding work the server has not taken. That
       is a refusal rather than a delay, and the reason is worth showing. */
    if (only > 0 && api.state().lastError) {
      return '<div class="wbar warn"><b>' + only + ' record' + (only === 1 ? '' : 's') +
        ' not saved to the server.</b> ' + esc(api.state().lastError) +
        ' <a href="#/settings/data">Look at it</a></div>';
    }
    return '';
  }

  /* A blank "undefined is not a function" tells nobody anything. Name the file
     and the line, and offer the two things that actually fix it. */
  function crashCard(e, route) {
    var frame = '';
    var st = String((e && e.stack) || '');
    var m = st.match(/(\w+\.js):(\d+):(\d+)/);
    if (m) frame = m[1] + ' line ' + m[2];
    return '<div class="deny"><h3>The ' + esc(route) + ' screen hit a problem</h3>' +
      '<p><b style="color:var(--bad)">' + esc(String(e && e.message || e)) + '</b>' +
      (frame ? '<br><span style="color:var(--dim)">in ' + esc(frame) + '</span>' : '') + '</p>' +
      '<p style="margin-top:14px">This is almost always a stale file cached by the browser, ' +
      'or saved data from an older version of the demo.</p>' +
      '<p style="margin-top:16px">' +
      '<button class="btn" data-act="hardReload">Reload everything fresh</button> ' +
      '<button class="btn alt" data-act="resetDemo">Reset the demo data</button></p>' +
      '<details style="margin-top:18px;text-align:left"><summary style="cursor:pointer;color:var(--dim);font-size:12px">' +
      'Technical detail</summary><pre style="white-space:pre-wrap;font-size:11.5px;color:var(--dim);margin-top:9px">' +
      esc(st.split('\n').slice(0, 6).join('\n')) + '</pre></details></div>';
  }

  function deny(h, p) {
    return '<div class="deny"><h3>' + esc(h) + '</h3><p>' + esc(p) + '</p></div>';
  }

  function go(hash) {
    if (location.hash === hash) render(); else location.hash = hash;
  }

  var toastT = null;
  function toast(msg, bad) {
    var t = $('#toast');
    t.textContent = msg; t.hidden = false;
    t.className = bad ? 'bad' : '';
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.hidden = true; }, 3400);
  }

  function modal(title, sub, body) {
    $('#m-title').textContent = title;
    $('#m-sub').textContent = sub || '';
    $('#m-body').innerHTML = body;
    $('#modal').showModal();
  }

  /* ---------------- home, per role ---------------- */

  /* ---------------- the detail drawer ----------------

     Opening a deal should not cost you the board. The drawer slides in over the
     right-hand side, the columns stay where they were, and closing it puts you
     back exactly where you were looking — no scroll position to rebuild.

     It renders the SAME view as the full page rather than a second, thinner
     copy of it. Two renderings of one record drift apart, and then a field gets
     fixed in one of them. The route still changes, so a drawer is still a URL
     somebody can send you.

     It renders it in BRIEF mode: a decision surface, not a record dump. What
     needs an action and what is already filled; the documents, the blanks and
     everything you can type into wait on the full page. Still one renderer with
     a flag, for the same reason as above. */
  var DRAWER = null;

  function drawerHTML() {
    if (!DRAWER) return '';
    var body;
    try { body = (VIEWS.opp ? VIEWS.opp(DRAWER, true) : ''); }
    catch (e) { body = crashCard(e, 'opp'); }
    return '<div class="scrim" data-act="closeDrawer" aria-hidden="true"></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-label="Engagement detail">' +
      '<div class="drawerbar">' +
        '<button class="iconbtn" data-act="closeDrawer" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<span class="hint">Esc to close</span><span style="flex:1"></span>' +
        '<a class="minibtn" href="#/opp/' + esc(DRAWER) + '" data-act="closeDrawer">Open full page</a>' +
      '</div>' +
      '<div class="drawerbody">' + body + '</div></aside>';
  }

  /* ---------------- overview ----------------

     Five numbers, a trend, what happened lately, and the live book. The KPIs
     read the ENGAGEMENTS — an earlier cut counted the six service lines and
     called them engagements, which is the kind of wrong number that quietly
     destroys trust in every other number on the page. */

  function kpi(o) {
    var d = o.delta;
    return '<div class="kcard">' +
      '<div class="ktop"><span class="kico">' + o.icon + '</span>' +
      '<span class="klabel">' + esc(o.label) + '</span></div>' +
      '<div class="krow"><b>' + o.value + '</b>' +
      (d ? '<span class="kdelta ' + d.tone + '">' + esc(d.text) +
           (d.tone === 'up' ? upArrow() : d.tone === 'down' ? downArrow() : '') + '</span>' : '') +
      '</div>' + (o.foot ? '<span class="kfoot">' + o.foot + '</span>' : '') + '</div>';
  }
  function upArrow() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17 17 6M9 6h8v8"/></svg>'; }
  function downArrow() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l11 11M17 9v8H9"/></svg>'; }
  function kIcon(pathd) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + pathd + '</svg>';
  }

  /* One series, one axis, on purpose.

     The obvious move is value AND count on the same chart, which needs two
     y-scales — and a dual axis lets you imply any correlation you like by
     choosing the scales. So: value is the line, and the count for each month
     rides in the tooltip where it cannot mislead anybody. */
  function valueChart(months) {
    var W = 720, H = 190, PADL = 8, PADB = 26, PADT = 14;
    var max = Math.max.apply(null, months.map(function (m) { return m.value; })).valueOf() || 1;
    var step = months.length > 1 ? (W - PADL * 2) / (months.length - 1) : 0;
    var pt = function (m, i) {
      return [PADL + i * step, PADT + (H - PADT - PADB) * (1 - m.value / max)];
    };
    var pts = months.map(pt);
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - PADB) +
               ' L' + pts[0][0].toFixed(1) + ' ' + (H - PADB) + ' Z';

    return '<div class="chartwrap">' +
      '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" ' +
      'aria-label="Value contracted by month">' +
      /* recessive grid */
      [0, 0.5, 1].map(function (f) {
        var y = PADT + (H - PADT - PADB) * f;
        return '<line class="grid" x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>';
      }).join('') +
      '<path class="carea" d="' + area + '"/>' +
      '<path class="cline" d="' + line + '"/>' +
      pts.map(function (p, i) {
        return '<circle class="cdot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4"/>' +
          /* the hit target is bigger than the mark */
          '<circle class="chit" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="16" ' +
          'tabindex="0" role="button" aria-label="' + esc(months[i].label + ': ' + ZS.money(months[i].value) +
          ' across ' + months[i].n + ' engagements') + '" ' +
          'data-tip="' + esc(months[i].label + ' · ' + ZS.money(months[i].value) + ' · ' +
          months[i].n + ' engagement' + (months[i].n === 1 ? '' : 's')) + '"/>';
      }).join('') +
      '</svg>' +
      '<div class="cxaxis">' + months.map(function (m) {
        return '<span>' + esc(m.short) + '</span>';
      }).join('') + '</div>' +
      '<div class="ctip" id="ctip" hidden></div></div>';
  }

  function monthsOf(opps) {
    var out = [], now = new Date();
    for (var k = 7; k >= 0; k--) {
      var dt = new Date(now.getFullYear(), now.getMonth() - k, 1);
      var key = dt.toISOString().slice(0, 7);
      var mine = opps.filter(function (o) { return String(o.created).slice(0, 7) === key; });
      out.push({
        key: key, n: mine.length,
        value: mine.reduce(function (a, o) { return a + ZS.oppValue(o); }, 0),
        label: dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        short: dt.toLocaleDateString('en-IN', { month: 'short' })
      });
    }
    return out;
  }

  VIEWS.home = function () {
    var u = me(), a = acc();
    var opps = D.opportunities || [];

    /* ---- the first run ----
       An empty cockpit with eight zeroes on it tells you nothing about what to
       do next. The deployed build starts empty on purpose, so the first screen
       has to be a way in rather than a dashboard of nothing. */
    if (!opps.length && !(D.clients || []).length) return firstRun();

    var live = opps.filter(function (o) { return ZS.isOpen(o); });
    var building = ZS.procDeals(opps);
    var running = opps.filter(function (o) { return o.proc && o.proc.stage === 'Running'; });
    var owed = ZS.owedOn(D.invoices);
    var slipped = building.filter(function (o) { return ZS.planSlipped(o).length; });
    var blocked = opps.filter(function (o) {
      return o.blocked_on === 'client' && (ZS.isOpen(o) || ZS.isProcessing(o));
    });
    var contracted = opps.reduce(function (x, o) { return x + ZS.oppValue(o); }, 0);

    var h = '<div class="ph"><div><h1>Overview</h1>' +
      '<p>' + esc(u.name.split(' ')[0]) + ' — the whole book, as it stands today.</p></div>' +
      (a.addStock ? '<div class="right"><a class="btn" href="#/oppnew">New engagement</a></div>' : '') +
      '</div>' + notifyNudge();

    h += '<div class="kpis5">' +
      kpi({ label: 'Contracted', value: ZS.money(contracted),
            icon: kIcon('<path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2 2.7 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3"/>'),
            foot: opps.length + ' engagements, all time' }) +
      kpi({ label: 'Live deals', value: live.length,
            icon: kIcon('<path d="M4 4v16"/><rect x="8" y="5" width="5" height="6" rx="1"/><rect x="15" y="9" width="5" height="6" rx="1"/>'),
            foot: ZS.money(live.reduce(function (x, o) { return x + ZS.oppValue(o); }, 0)) + ' in play' }) +
      kpi({ label: 'In build', value: building.length,
            icon: kIcon('<path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6"/><path d="M17 3v4h-4M7 21v-4h4"/>'),
            delta: slipped.length ? { tone: 'down', text: slipped.length + ' behind' } : { tone: 'up', text: 'on plan' },
            foot: running.length + ' live and running' }) +
      kpi({ label: 'Owed', value: ZS.money(owed),
            icon: kIcon('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
            delta: owed > 0 ? { tone: 'down', text: 'unpaid' } : { tone: 'up', text: 'clear' },
            foot: (D.invoices || []).filter(function (i2) { return i2.state !== 'paid' && i2.state !== 'draft'; }).length + ' invoices out' }) +
      kpi({ label: 'Waiting on client', value: blocked.length,
            icon: kIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
            delta: blocked.length ? { tone: 'down', text: 'stuck' } : { tone: 'up', text: 'none' },
            foot: 'credentials, data or a signature' }) +
      '</div>';

    /* ⚠️ WHAT MARK NEEDS, ON THE FIRST SCREEN. The Outreach board carries the
       whole brief, and a brief on a screen nobody opens is a brief nobody
       reads. Only the items he has to touch himself come here, and only when
       there are some: a permanent panel saying "nothing for you" is a panel
       that stops being looked at. */
    if (a.clients) {
      var mn = ZS.markNeeds(D);
      if (mn.length) {
        h += '<div class="note" style="margin-bottom:16px"><b>Mark needs you on ' +
          mn.length + ' thing' + (mn.length === 1 ? '' : 's') + '.</b> ' +
          esc(mn.map(function (n) { return n.what; }).join(' ')) +
          ' <a class="minibtn" href="#/outreach">Open Outreach</a></div>';
      }
    }

    /* trend + what happened lately, side by side */
    h += '<div class="twocol">';
    h += '<section class="card pad"><div class="cardhead"><h3>Value contracted</h3>' +
      '<span class="hint">by month, last 8 &middot; hover a point</span></div>' +
      valueChart(monthsOf(opps)) + '</section>';

    var acts = (D.activity || []).slice(0, 6);
    h += '<section class="card"><div class="cardhead pad"><h3>Lately</h3>' +
      '<a class="minibtn" href="#/activity">View all</a></div>' +
      (acts.length ? '<div class="feed">' + acts.map(function (x) {
        var who = ZS.staffById(x.by);
        return '<div class="feeditem"><span class="av">' +
          esc(((who && who.name) || '?').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2)) +
          '</span><div class="t"><b>' + esc(x.text) + '</b>' +
          '<span>' + esc(String(x.at).slice(0, 10)) + '</span></div></div>';
      }).join('') + '</div>'
      : '<p class="m pad">Nothing logged yet.</p>') + '</section>';
    h += '</div>';

    /* the live book */
    h += '<section class="card"><div class="cardhead pad"><h3>The book</h3>' +
      '<a class="minibtn" href="#/floor">Open the board</a></div>' +
      '<div class="scroller"><table class="tbl"><thead><tr>' +
      '<th>Client</th><th>What</th><th>Where it is</th><th class="num">Value</th>' +
      '<th>Owed</th><th>State</th></tr></thead><tbody>' +
      opps.slice().sort(function (x, y) { return String(y.updated).localeCompare(String(x.updated)); })
        .map(function (o) {
          var c = clientById(o.client);
          var where = o.proc ? o.proc.stage : o.stage;
          var late = o.proc && ZS.planSlipped(o).length;
          var due = ZS.owedOn(D.invoices, o.id);
          return '<tr data-act="openOpp" data-id="' + esc(o.id) + '">' +
            '<td><b>' + esc(c ? c.name : '—') + '</b><span class="sub">' + esc((c && c.sector) || '') + '</span></td>' +
            '<td>' + esc(ZS.productName(o.product)) +
              (o.scope ? '<span class="sub">' + esc(o.scope.slice(0, 64)) +
                (o.scope.length > 64 ? '…' : '') + '</span>' : '') + '</td>' +
            '<td><span class="pill ' + (o.proc ? 'ok' : 'info') + '">' + esc(where) + '</span></td>' +
            '<td class="num">' + (a.cost ? ZS.money(ZS.oppValue(o)) : '₹ ••••') + '</td>' +
            '<td>' + (due ? '<span class="pill bad">' + ZS.money(due) + '</span>' : '<span class="dimtxt">—</span>') + '</td>' +
            '<td>' + (late ? '<span class="pill bad">behind</span>'
                     : o.blocked_on === 'client' ? '<span class="pill warn">waiting</span>'
                     : '<span class="pill ok">moving</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';

    if (a.settings) h += healthPanels();
    return h;
  };

  function onFloor() {
    return (D.opportunities || []).filter(ZS.isOpen);
  }
  function clientById(id) { return D.clients.filter(function (c) { return c.id === id; })[0] || null; }

  /* ---------------- data health (kept from phase 1) ---------------- */

  /* Our own exposure, not a client's. */
  var SITE = [
    ['warn', 'This cockpit holds every client credential we have',
     'Demo logins, hosting, domains, CRM access. The server decides what your role is sent, so a ' +
     'credential you may not see is <b>not in the response at all</b> — masking on screen is a ' +
     'display rule, never the control. Sign out on a shared machine; the session is revocable.'],
    ['warn', 'One person, one login',
     'Every role below exists so the second and third hire cost an afternoon. Today it is all Bhargav.'],
    ['warn', 'Channels are not connected yet',
     'Meta, Google and WhatsApp need a server with a public URL and Meta app review. ' +
     'Nothing here claims to be live that is not.'],
    ['info', 'GHL still holds the funnel',
     '57 leads enrolled, 29 approved WhatsApp templates, a live WABA sender. Templates do not ' +
     'migrate \u2014 switching means a fresh Meta approval queue. That is a scheduling decision.']
  ];



  function healthPanels() {
    var f = [];
    var opps = D.opportunities || [];
    var live = opps.filter(function (o) { return ZS.isOpen(o) || ZS.isProcessing(o); });

    /* The same trick we use on a client's own listings, turned on ourselves. */
    var unsigned = opps.filter(function (o) {
      return o.mou === 'sent' && ZS.isOpen(o);
    });
    unsigned.forEach(function (o) {
      var c = clientById(o.client);
      var days = ZS.daysLeft(ZS.today(), o.blocked_since || o.created);
      f.push(['bad', (c ? c.name : 'A client') + ' has had the MOU for ' + (days || 0) + ' days',
        'Sent, revised ' + (o.mou_revisions || 0) + ' time' + (o.mou_revisions === 1 ? '' : 's') +
        ', still unsigned. Work is happening anyway.', o.id]);
    });

    var conflict = opps.filter(function (o) { return o.invoice_conflict; });
    conflict.forEach(function (o) {
      var c = clientById(o.client);
      f.push(['bad', (c ? c.name : 'A client') + ': ' + o.invoice_conflict + ' conflicting invoice sets',
        'Different numbers in each. Nobody can say what is actually owed, which is why it is not being chased.',
        o.id]);
    });

    var unpitched = opps.filter(function (o) {
      return ZS.isOpen(o) && o.repo && !o.pitched;
    });
    unpitched.forEach(function (o) {
      var c = clientById(o.client);
      f.push(['bad', (c ? c.name : 'A build') + ' is finished and has never been sent',
        'The work is done and tested. It earns nothing until somebody presses send.', o.id]);
    });

    var stuck = opps.filter(function (o) {
      return o.blocked_on === 'client' && (ZS.isOpen(o) || ZS.isProcessing(o));
    });
    if (stuck.length) f.push(['warn', stuck.length + ' build' + (stuck.length === 1 ? '' : 's') +
      ' waiting on the client', 'Credentials, data, a signature or a decision. Nothing moves until they answer.']);

    var slipped = live.filter(function (o) { return ZS.planSlipped(o).length; });
    if (slipped.length) f.push(['warn', slipped.length + ' build' + (slipped.length === 1 ? '' : 's') +
      ' past a promised date', 'A milestone target has gone by unmet.']);

    var owed = ZS.owedOn(D.invoices);
    if (owed > 0) f.push(['warn', ZS.money(owed) + ' invoiced and unpaid',
      'Across every client. The Collector drafts the reminders.']);

    var watch = opps.filter(function (o) { return o.demo; });
    f.push(['info', watch.length + ' live client demos deployed',
      'Nobody is watching them. The Watchman checks each one still loads and still passes its checks.']);

    var given = opps.reduce(function (a2, o) { return a2 + ((o.findings || []).length); }, 0);
    if (given) f.push(['info', given + ' findings handed over free',
      'Real faults on their sites, given away before any pitch. This is what earns the meeting.']);

    function row(x) {
      return '<div class="finding"><span class="sev ' + x[0] + '"></span><div><h4>' + x[1] + '</h4><p>' + x[2] + '</p></div>' +
        (x[3] ? '<span class="go"><button class="minibtn" data-act="openProduct" data-id="' + esc(x[3]) + '">Open</button></span>' : '') +
        '</div>';
    }
    return '<p class="eyebrow" style="margin-top:32px">Data health</p>' +
      '<div class="grid2">' +
      '<div class="card" style="padding:0"><h4 style="font-family:var(--d);font-size:13px;padding:14px 16px;border-bottom:1px solid var(--line)">What is going wrong <span class="pill bad" style="float:right">' + f.length + '</span></h4>' +
        f.map(row).join('') + '</div>' +
      '<div class="card" style="padding:0"><h4 style="font-family:var(--d);font-size:13px;padding:14px 16px;border-bottom:1px solid var(--line)">Site &amp; account health <span class="pill bad" style="float:right">' + SITE.length + '</span></h4>' +
        SITE.map(row).join('') + '</div></div>';
  }

  /* ---------------- team ---------------- */

  VIEWS.team = function () {
    var products = productList(), r = range(), a = acc();
    var h = '<div class="ph"><div><h1>Team</h1>' +
      '<p>' + D.staff.length + ' people across ' +
        (new Set(D.staff.map(function (u) { return u.role; }))).size +
        ' roles. Open anyone to see their clients, their sales and where they are against target.</p></div>' +
      (a.reports ? '<div class="right"><a class="btn alt" href="#/reports">Team reports</a></div>' : '') + '</div>';
    h += rangeBar();

    h += '<div class="grid3">' + ZS.staffList().map(function (u) {
      var ua = ZS.acc(u, D.access);
      var st = ZS.personStats(D, u.id, products, r);
      var sells = ZS.carriesTarget(u);
      var t = st.target;
      return '<div class="card person" data-act="openPerson" data-id="' + esc(u.id) + '">' +
        '<div style="display:flex;gap:11px;align-items:center;margin-bottom:12px">' +
        '<span class="av">' + initials(u.name) + '</span>' +
        '<div style="min-width:0"><b style="font-family:var(--d);font-size:15px">' + esc(u.name) + '</b>' +
        '<span style="display:block;font-size:12px;color:var(--mut)">' + esc(roleName(u.role)) + '</span></div>' +
        (u.id === D.session ? '<span class="pill em" style="margin-left:auto">You</span>' : '') +
        '</div>' +
        (sells
          ? '<div class="ministats">' +
              mini(st.clients, 'clients') + mini(st.sales, 'sales') +
              mini(a.cost ? ZS.money(st.value) : '••••', 'value') +
            '</div>' +
            (t.targetUnits
              ? '<div class="tprog"><div class="tprow"><span>Target ' + t.targetUnits + ' lines</span>' +
                '<b class="' + ZS.band(t.unitsPct) + '">' + (t.unitsPct === null ? '—' : t.unitsPct + '%') + '</b></div>' +
                '<span class="bar wide"><i class="' + ZS.band(t.unitsPct) + '" style="width:' +
                Math.min(100, t.unitsPct || 0) + '%"></i></span></div>'
              : '<p class="m" style="color:var(--dim);margin-top:8px">No target set</p>')
          : '<p class="m">Sees: <b style="color:#D9D5D2">' + esc(ZS.SCOPES[ua.scope]) + '</b>' +
            (ua.cost ? ' &middot; costs' : '') + (ua.settings ? ' &middot; settings' : '') + '</p>') +
        '</div>';
    }).join('') + '</div>';
    return h;
  };

  function initials(n) { return esc(n.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2)); }
  function mini(v, l) { return '<div><b>' + v + '</b><span>' + l + '</span></div>'; }

  /* ---------------- one person ---------------- */

  VIEWS.person = function (id) {
    var u = ZS.staffById(id);
    if (!u) return deny('No such person', 'Nobody by that id works here.');
    var a = acc(), me_ = me();
    /* Somebody else's numbers are the `reports` capability and nothing else. This
       also let anyone through on `scope === 'company'`, but scope decides which
       CLIENT ROWS you may read — it was never meant to decide whether you may
       read a colleague's target and conversion rate. Switching Team reports off
       has to be enough, or the switch does not mean what the Roles tab says. */
    if (u.id !== me_.id && !a.reports)
      return deny('Not in your view',
        'Reading somebody else\'s numbers needs Team reports, which is off for your role.');

    var r = range(), st = ZS.personStats(D, u.id, productList(), r), t = st.target;
    var sells = ZS.carriesTarget(u);

    var h = '<div class="ph"><div style="display:flex;gap:13px;align-items:center">' +
      '<span class="av big">' + initials(u.name) + '</span>' +
      '<div><h1>' + esc(u.name) + '</h1><p>' + esc(roleName(u.role)) + ' &middot; ' +
      esc(u.line ? ZS.lineName(u.line) : 'All lines') + ' &middot; joined ' + esc(u.joined) + '</p></div></div>' +
      '<div class="right">' +
      (a.targets && sells ? '<button class="btn alt" data-act="editTarget" data-id="' + esc(u.id) + '">Set target</button>' : '') +
      '<a class="btn alt" href="#/team">Back to team</a></div></div>';

    h += rangeBar();

    h += '<div class="kpis">' +
      k(st.clients, 'Clients assigned', null, 'Everyone on their list right now, whenever they came in.') +
      k(st.newClients, 'New in this window', null, 'Clients first added between ' + r.from + ' and ' + r.to + '.') +
      k(st.open, 'Still open', st.open ? 'warn' : null, 'Not yet delivered and not yet lost.') +
      k(st.sales, 'Builds delivered', null, 'Sales closed in this window.') +
      k(a.cost ? ZS.money(st.value) : '₹ ••••', 'Sales value', null, 'What those sales were worth.') +
      k(st.conversion === null ? '—' : st.conversion + '%', 'Conversion', null,
        'Sales divided by new clients in this window.') +
      k(st.visits, 'Deals opened', null, 'Opportunities opened in this window.') +
      k(st.noteScore === null ? '—' : st.noteScore + '/10', 'Follow-up quality',
        st.noteScore === null ? null : (st.noteScore >= 8 ? 'ok' : st.noteScore >= 5 ? 'warn' : 'bad'),
        'How well they write up their conversations, scored out of ten.') +
      k(st.follow, 'Open follow-ups', st.follow ? 'warn' : null, 'Jobs still on their list.') +
      '</div>';

    if (sells) {
      h += '<p class="eyebrow" style="margin-top:30px">Against target</p>';
      if (!t.targetUnits && !t.targetValue) {
        h += '<div class="card"><p class="m">No target has been set for ' + esc(u.name.split(' ')[0]) + '. ' +
          (a.targets ? 'Use <b>Set target</b> above.' : 'The owner or the manager sets these.') + '</p></div>';
      } else {
        h += '<div class="grid2">' +
          targetCard('Builds delivered', st.sales, t.targetUnits, t.unitsPct, String(st.sales), String(t.targetUnits)) +
          targetCard('Sales value', st.value, t.targetValue, t.valuePct,
            a.cost ? ZS.money(st.value) : '₹ ••••', a.cost ? ZS.money(t.targetValue) : '₹ ••••') +
          '</div>' +
          '<p class="hint">' + (t.tooShort
            ? 'This window is too short to score against a monthly target — widen it to judge them.'
            : 'Monthly target pro-rated across the ' + t.months.toFixed(1) + ' months this window covers.') +
          '</p>';
      }

      h += '<p class="eyebrow" style="margin-top:30px">Sales in this window</p>';
      /* These columns were "Price · Booking · Finance" — a 4% car booking and a
         finance flag, neither of which has an input anywhere in this cockpit. A
         column is a claim that the number exists; invoiced and collected are
         claims we can actually back, because they read off the invoice records. */
      h += t.sales.length
        ? '<div class="scroller"><table class="tbl"><thead><tr><th>Date</th><th>What we sold</th><th>Client</th>' +
          '<th class="num">Fee</th><th class="num">Invoiced</th><th class="num">Collected</th></tr></thead><tbody>' +
          t.sales.slice().sort(function (x, y) { return y.at.localeCompare(x.at); }).map(function (sl) {
            var mine = (D.invoices || []).filter(function (i) { return i.opp === sl.opp; });
            var raised = mine.reduce(function (x, i) { return x + (i.amount || 0); }, 0);
            var got = mine.filter(function (i) { return i.state === 'paid'; })
                          .reduce(function (x, i) { return x + (i.amount || 0); }, 0);
            return '<tr' + (sl.client ? ' data-act="openClient" data-id="' + esc(sl.client) + '"' : '') + '>' +
              '<td>' + esc(sl.at) + '</td><td><b>' + esc(sl.line || ZS.productName(sl.product_id)) + '</b></td>' +
              '<td>' + esc(sl.buyer || '—') + '</td>' +
              '<td class="num">' + ZS.money(sl.price) + '</td>' +
              '<td class="num">' + (a.invoices ? ZS.money(raised) : '₹ ••••') + '</td>' +
              '<td class="num">' + (a.invoices ? ZS.money(got) : '₹ ••••') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<div class="card"><p class="m">Nothing signed in this window.</p></div>';
    }

    var theirs = D.clients.filter(function (c) { return c.assigned_to === u.id; });
    h += '<p class="eyebrow" style="margin-top:30px">Clients assigned (' + theirs.length + ')</p>';
    h += theirs.length
      ? '<div class="scroller"><table class="tbl"><thead><tr><th>Client</th><th>Mobile</th><th>Came from</th>' +
        '<th>Standing</th><th class="num">Budget</th><th class="num">Saved</th><th>Added</th>' +
        '<th>Last touch</th></tr></thead><tbody>' +
        theirs.slice().sort(function (x, y) { return String(y.last_touch).localeCompare(String(x.last_touch)); })
        .map(function (c) {
          var fresh = ZS.inRange(c.created, r);
          return '<tr data-act="openClient" data-id="' + esc(c.id) + '">' +
            '<td><b>' + esc(c.name) + '</b>' + (fresh ? ' <span class="pill em">new</span>' : '') + '</td>' +
            '<td>' + esc(ZS.maskMobile(c.mobile, me_, D.access)) + '</td>' +
            '<td>' + esc(ZS.SOURCES[c.source] || c.source) + '</td>' +
            '<td><span class="pill ' + ZS.clientTier(c, D.opportunities)[1] + '">' +
              esc(ZS.clientTier(c, D.opportunities)[0]) + '</span></td>' +
            '<td class="num">' + (c.fee ? ZS.money(c.fee) : '—') + '</td>' +
            '<td class="num">' + (c.shown || []).length + '</td>' +
            '<td>' + esc(c.created) + '</td><td>' + esc(c.last_touch) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<div class="card"><p class="m">Nobody assigned to them yet.</p></div>';
    return h;
  };

  function k(v, l, cls, tip) {
    return '<div class="kpi' + (cls ? ' ' + cls : '') + '"' + (tip ? ' data-tip="' + esc(tip) + '"' : '') +
      '><b>' + v + '</b><span>' + esc(l) + '</span></div>';
  }

  function targetCard(label, got, want, pct, gotTxt, wantTxt) {
    return '<div class="card"><div style="display:flex;align-items:baseline;gap:10px;margin-bottom:10px">' +
      '<h3 style="flex:1">' + esc(label) + '</h3>' +
      '<b class="tpct ' + ZS.band(pct) + '">' + (pct === null ? '—' : pct + '%') + '</b></div>' +
      '<span class="bar wide"><i class="' + ZS.band(pct) + '" style="width:' + Math.min(100, pct || 0) + '%"></i></span>' +
      '<p class="m" style="margin-top:9px"><b style="color:#D9D5D2;font-family:var(--d)">' + gotTxt +
      '</b> of ' + wantTxt + (pct !== null && pct < 100 ? ' &middot; ' + (100 - pct) + '% to go' : '') + '</p></div>';
  }

  /* ---------------- the activity log ---------------- */

  var AWHO = '', AKIND = '';

  VIEWS.activity = function () {
    var a = acc(), me_ = me();
    var all = D.activity || [];

    /* Everyone can see what they did. Seeing what everybody did is a manager's
       job, and follows the same capability that opens the team reports. */
    var scoped = a.reports ? all : all.filter(function (x) { return x.by === me_.id; });
    var inWin = scoped.filter(function (x) { return inRange(String(x.at).slice(0, 10)); });
    var rows = inWin.filter(function (x) {
      if (AWHO && x.by !== AWHO) return false;
      if (AKIND && (KINDS[x.kind] || [])[0] !== AKIND) return false;
      return true;
    });

    var h = '<div class="ph"><div><h1>Activity</h1><p>' +
      (a.reports ? 'Every change anyone made' : 'Everything you have done') +
      ' — who, what and when.</p></div>' +
      (a.exportData ? '<div class="right"><button class="btn alt" data-act="exportActivity">Export CSV</button></div>' : '') +
      '</div>';

    h += rangeBar(rows.length + ' of ' + scoped.length + ' changes in this window');

    if (a.reports) {
      h += '<div class="chips" style="margin-bottom:10px">' +
        '<span class="rlabel">Who</span>' +
        '<button class="chip" data-act="actWho" data-id="" aria-pressed="' + (AWHO ? 'false' : 'true') + '">Everyone</button>' +
        D.staff.map(function (u) {
          var n = inWin.filter(function (x) { return x.by === u.id; }).length;
          if (!n) return '';
          return '<button class="chip" data-act="actWho" data-id="' + esc(u.id) + '" aria-pressed="' +
            (AWHO === u.id ? 'true' : 'false') + '">' + esc(u.name.split(' ')[0]) + '<i>' + n + '</i></button>';
        }).join('') + '</div>';
    }
    h += '<div class="chips" style="margin-bottom:16px">' +
      '<span class="rlabel">What</span>' +
      '<button class="chip" data-act="actKind" data-id="" aria-pressed="' + (AKIND ? 'false' : 'true') + '">Everything</button>' +
      KIND_GROUPS.map(function (g) {
        var n = inWin.filter(function (x) { return (KINDS[x.kind] || [])[0] === g; }).length;
        if (!n) return '';
        return '<button class="chip" data-act="actKind" data-id="' + esc(g) + '" aria-pressed="' +
          (AKIND === g ? 'true' : 'false') + '">' + esc(g) + '<i>' + n + '</i></button>';
      }).join('') + '</div>';

    if (!rows.length) {
      return h + '<div class="card"><p class="m">Nothing changed in this window. ' +
        'Widen the dates, or make a change and it will appear here straight away.</p></div>';
    }

    /* grouped by day, newest first */
    var days = {};
    rows.forEach(function (x) {
      var d2 = String(x.at).slice(0, 10);
      (days[d2] = days[d2] || []).push(x);
    });
    h += Object.keys(days).sort().reverse().map(function (d2) {
      return '<p class="eyebrow" style="margin-top:22px">' + esc(dayLabel(d2)) +
        ' <span style="color:var(--dim);letter-spacing:0;text-transform:none">· ' +
        days[d2].length + ' change' + (days[d2].length === 1 ? '' : 's') + '</span></p>' +
        '<div class="card" style="padding:0">' + days[d2].map(actRow).join('') + '</div>';
    }).join('');
    return h;
  };

  function dayLabel(d2) {
    var t = ZS.today();
    if (d2 === t) return 'Today';
    var y = new Date(); y.setDate(y.getDate() - 1);
    if (d2 === ZS.iso(y)) return 'Yesterday';
    return d2;
  }

  function actRow(x) {
    var who = ZS.staffById(x.by);
    var meta = KINDS[x.kind] || ['Other', 'edit'];
    var time = String(x.at).slice(11, 16);
    var links = '';
    if (x.client) links += '<button class="minibtn" data-act="openClient" data-id="' + esc(x.client) + '">Client</button> ';
    if (x.opp) links += '<button class="minibtn" data-act="openOpp" data-id="' + esc(x.opp) + '">Opportunity</button> ';
    if (x.line) links += '<button class="minibtn" data-act="openProduct" data-id="' + esc(x.line) + '">Line</button>';
    return '<div class="actrow"><span class="acttime">' + esc(time) + '</span>' +
      '<span class="av sm" title="' + esc(who ? who.name : 'system') + '">' +
        (who ? initials(who.name) : '—') + '</span>' +
      '<div class="t"><b>' + esc(x.text) + '</b>' +
      '<span class="meta">' + esc(who ? who.name : 'System') + ' &middot; ' +
      '<span class="pill ' + kindPill(meta[1]) + '">' + esc(meta[0]) + '</span></span></div>' +
      (links ? '<span class="go">' + links + '</span>' : '') + '</div>';
  }
  function kindPill(k) {
    return k === 'add' ? 'ok' : k === 'win' ? 'ok' : k === 'lose' ? 'bad' : 'dim';
  }

  Object.assign(ACTIONS, {
    actWho: function (id) { AWHO = id || ''; render(); },
    actKind: function (g) { AKIND = g || ''; render(); },
    exportActivity: function () {
      var r = range();
      var rows = (D.activity || []).filter(function (x) { return inRange(String(x.at).slice(0, 10)); });
      var lines = ['when,who,area,what'];
      rows.forEach(function (x) {
        var who = ZS.staffById(x.by);
        var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
        lines.push([q(x.at.slice(0, 16).replace('T', ' ')), q(who ? who.name : 'System'),
                    q((KINDS[x.kind] || ['Other'])[0]), q(x.text)].join(','));
      });
      var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      var el2 = document.createElement('a');
      el2.href = URL.createObjectURL(blob);
      el2.download = 'carcart-activity-' + r.from + '-to-' + r.to + '.csv';
      el2.click();
      toast(rows.length + ' changes exported.');
    }
  });

  /* ---------------- targets: branches and people, in one place ---------------- */

  VIEWS.targets = function () {
    if (!can('targets')) return deny('Not in your view', 'Targets are set by the owner or the sales manager.');
    var r = range();
    var h = '<div class="ph"><div><h1>Targets</h1>' +
      '<p>Monthly targets for every service line and every person. ' +
      'Reports pro-rate these across whatever window is picked.</p></div></div>';
    h += rangeBar();

    /* branches */
    h += '<p class="eyebrow">Lines</p><div class="scroller" style="max-height:none;margin-bottom:26px">' +
      '<table class="matrix"><thead><tr><th>Line</th><th>People</th><th>Builds / month</th>' +
      '<th>Value / month</th><th>Sold in window</th><th>Against target</th></tr></thead><tbody>' +
      ZS.PRODUCTS.map(function (b) {
        var staff = D.staff.filter(function (u) { return u.line === b.id; });
        var ids = staff.map(function (u) { return u.id; });
        var sold = (D.sales || []).filter(function (sl) {
          return ids.indexOf(sl.by) >= 0 && ZS.inRange(sl.at, r);
        });
        var value = sold.reduce(function (a2, sl) { return a2 + (sl.price || 0); }, 0);
        var want = Math.round((b.target && b.target.units || 0) * ZS.monthsIn(r));
        var pct = want >= 1 ? Math.round(100 * sold.length / want) : null;
        return '<tr><td class="rn">' + esc(b.name) + '<span>' + esc(b.code) + '-001… · from ' +
            esc(ZS.money(b.from)) + '</span></td>' +
          '<td class="num">' + staff.length + '</td>' +
          '<td><input type="number" min="0" class="tin" data-btarget="' + esc(b.id) + '|units" value="' +
            esc(b.target && b.target.units || 0) + '"></td>' +
          '<td><input type="number" min="0" step="100000" class="tin wide" data-btarget="' + esc(b.id) +
            '|value" value="' + esc(b.target && b.target.value || 0) + '"></td>' +
          '<td class="num">' + sold.length + ' &middot; ' + ZS.money(value) + '</td>' +
          '<td><span class="bar"><i class="' + ZS.band(pct) + '" style="width:' + Math.min(100, pct || 0) +
            '%"></i></span> <b class="' + ZS.band(pct) + '">' + (pct === null ? '—' : pct + '%') + '</b>' +
            '<span style="color:var(--dim);font-size:11px"> of ' + want + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';

    /* people */
    var sellers = ZS.sellers(D.staff);
    h += '<p class="eyebrow">Salespeople</p><div class="scroller" style="max-height:none">' +
      '<table class="matrix"><thead><tr><th>Person</th><th>Service line</th><th>Builds / month</th>' +
      '<th>Value / month</th><th>Sold in window</th><th>Against target</th></tr></thead><tbody>' +
      sellers.map(function (u) {
        var t = D.targets[u.id] || { units: 0, value: 0 };
        var prog = ZS.targetProgress(D.sales, u.id, t, r);
        return '<tr><td class="rn">' + esc(u.name) + '<span>' + esc(roleName(u.role)) + '</span></td>' +
          '<td>' + esc(u.line ? ZS.lineName(u.line) : 'All lines') + '</td>' +
          '<td><input type="number" min="0" class="tin" data-ptarget="' + esc(u.id) + '|units" value="' +
            esc(t.units || 0) + '"></td>' +
          '<td><input type="number" min="0" step="100000" class="tin wide" data-ptarget="' + esc(u.id) +
            '|value" value="' + esc(t.value || 0) + '"></td>' +
          '<td class="num">' + prog.units + ' &middot; ' + ZS.money(prog.value) + '</td>' +
          '<td><span class="bar"><i class="' + ZS.band(prog.unitsPct) + '" style="width:' +
            Math.min(100, prog.unitsPct || 0) + '%"></i></span> <b class="' + ZS.band(prog.unitsPct) + '">' +
            (prog.unitsPct === null ? '—' : prog.unitsPct + '%') + '</b>' +
            '<span style="color:var(--dim);font-size:11px"> of ' + prog.targetUnits + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="hint">Type a new figure and it saves itself. ' +
      'A window shorter than a day is not scored — the target rounds below one build.</p>';
    return h;
  };

  /* ---------------- team reports ---------------- */

  VIEWS.reports = function () {
    var a = acc(), me_ = me(), r = range();
    var people = ZS.sellers();
    if (!a.reports) people = people.filter(function (u) { return u.id === me_.id; });

    var h = '<div class="ph"><div><h1>Reports</h1>' +
      '<p>' + (a.reports ? 'Every owner, side by side.' : 'Your own numbers.') +
      ' Pick any window, including a custom one.</p></div>' +
      (a.exportData ? '<div class="right"><button class="btn alt" data-act="exportReport">Export CSV</button></div>' : '') +
      '</div>';
    h += rangeBar();

    var rows = people.map(function (u) { return ZS.personStats(D, u.id, productList(), r); });
    var tot = rows.reduce(function (t2, x) {
      t2.clients += x.clients; t2.newClients += x.newClients; t2.sales += x.sales;
      t2.value += x.value; t2.visits += x.visits; t2.open += x.open;
      t2.tUnits += x.target.targetUnits; t2.tValue += x.target.targetValue;
      return t2;
    }, { clients: 0, newClients: 0, sales: 0, value: 0, visits: 0, open: 0, tUnits: 0, tValue: 0 });

    h += '<div class="kpis" style="margin-bottom:22px">' +
      k(tot.sales, 'Builds delivered', null, 'Across everyone in this window.') +
      k(a.cost ? ZS.money(tot.value) : '₹ ••••', 'Sales value', null, 'What those sales were worth.') +
      k(tot.tUnits ? Math.round(100 * tot.sales / tot.tUnits) + '%' : '—', 'Against target',
        ZS.band(tot.tUnits ? Math.round(100 * tot.sales / tot.tUnits) : null),
        'Team total against the pro-rated monthly targets.') +
      k(tot.newClients, 'New clients', null, 'First added inside this window.') +
      k(tot.open, 'Open clients', tot.open ? 'warn' : null, 'Not delivered, not lost.') +
      k(tot.visits, 'Deals opened', null, 'Opportunities opened in this window.') +
      '</div>';

    h += '<div class="scroller"><table class="tbl"><thead><tr>' +
      '<th>Owner</th><th class="num">Clients</th><th class="num">New</th><th class="num">Open</th>' +
      '<th class="num">Deals</th><th class="num">Pitched</th><th class="num">Sold</th>' +
      '<th class="num">Value</th><th class="num">Conversion</th><th class="num">Follow-up quality</th>' +
      '<th class="num">Target</th><th class="tcol">Against target</th></tr></thead><tbody>' +
      rows.map(function (x) {
        var t = x.target;
        return '<tr data-act="openPerson" data-id="' + esc(x.user.id) + '">' +
          '<td><div class="veh"><span class="av sm">' + initials(x.user.name) + '</span>' +
          '<span><b>' + esc(x.user.name) + '</b><span>' + esc(roleName(x.user.role)) + '</span></span></div></td>' +
          '<td class="num">' + x.clients + '</td><td class="num">' + x.newClients + '</td>' +
          '<td class="num">' + x.open + '</td><td class="num">' + x.visits + '</td>' +
          '<td class="num">' + x.carsShown + '</td><td class="num">' + x.sales + '</td>' +
          '<td class="num">' + (a.cost ? ZS.money(x.value) : '₹ ••••') + '</td>' +
          '<td class="num">' + (x.conversion === null ? '—' : x.conversion + '%') + '</td>' +
          '<td class="num">' + (x.noteScore === null ? '—' :
            '<span class="pill ' + (x.noteScore >= 8 ? 'ok' : x.noteScore >= 5 ? 'warn' : 'bad') + '">' +
            x.noteScore + '/10</span>') + '</td>' +
          '<td class="num">' + (t.targetUnits || '—') + '</td>' +
          '<td class="tcol"><span class="bar"><i class="' + ZS.band(t.unitsPct) + '" style="width:' +
          Math.min(100, t.unitsPct || 0) + '%"></i></span><b class="' + ZS.band(t.unitsPct) + '">' +
          (t.unitsPct === null ? '—' : t.unitsPct + '%') + '</b></td></tr>';
      }).join('') + '</tbody></table></div>';

    /* month by month, so a custom window is not the only way to see a trend */
    var months = {};
    (D.sales || []).forEach(function (sl) {
      if (!ZS.inRange(sl.at, r)) return;
      var mk = ZS.monthKey(sl.at);
      months[mk] = months[mk] || { n: 0, v: 0 };
      months[mk].n++; months[mk].v += sl.price || 0;
    });
    var keys = Object.keys(months).sort();
    if (keys.length > 1) {
      var peak = Math.max.apply(null, keys.map(function (m2) { return months[m2].v; }));
      h += '<p class="eyebrow" style="margin-top:30px">Month by month</p><div class="card"><div class="spark">' +
        keys.map(function (m2) {
          return '<div class="sbar" title="' + esc(m2) + ': ' + months[m2].n + ' products">' +
            '<span style="height:' + Math.round(100 * months[m2].v / peak) + '%"></span>' +
            '<em>' + esc(m2.slice(2)) + '</em><b>' + months[m2].n + '</b></div>';
        }).join('') + '</div></div>';
    }
    return h;
  };

  Object.assign(ACTIONS, {
    openPerson: function (id) { go('#/person/' + id); },
    editTarget: function (id) {
      var u = ZS.staffById(id), t = D.targets[id] || { units: '', value: '' };
      modal('Target for ' + u.name, 'Per month. The report pro-rates it across whatever window is picked.',
        '<form id="targetform" data-uid="' + esc(id) + '">' +
        '<div class="f" style="margin-bottom:13px"><label for="t-units">Builds per month</label>' +
        '<input id="t-units" name="units" type="number" min="0" value="' + esc(t.units) + '"></div>' +
        '<div class="f" style="margin-bottom:13px"><label for="t-value">Value per month (₹)</label>' +
        '<input id="t-value" name="value" type="number" min="0" step="100000" value="' + esc(t.value) + '"></div>' +
        '<button class="btn" type="submit">Save target</button></form>');
    },
    exportReport: function () {
      var r = range(), a = acc();
      var people = ZS.sellers();
      var head = ['owner', 'role', 'clients', 'new', 'open', 'visits', 'cars_shown',
                  'sold', 'value', 'conversion_pct', 'followup_quality', 'target_cars', 'against_target_pct'];
      var lines = [head.join(',')];
      people.forEach(function (u) {
        var x = ZS.personStats(D, u.id, productList(), r);
        lines.push([u.name, roleName(u.role), x.clients, x.newClients, x.open, x.visits,
                    x.carsShown, x.sales, a.cost ? x.value : '', x.conversion === null ? '' : x.conversion,
                    x.noteScore === null ? '' : x.noteScore,
                    x.target.targetUnits, x.target.unitsPct === null ? '' : x.target.unitsPct].join(','));
      });
      var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      var el2 = document.createElement('a');
      el2.href = URL.createObjectURL(blob);
      el2.download = 'carcart-report-' + r.from + '-to-' + r.to + '.csv';
      el2.click();
      toast('Report exported for ' + ZS.rangeLabel(r) + '.');
    }
  });

  /* ---------------- settings ---------------- */

  VIEWS.settings = function (tab) {
    var tabs = [['access', 'Roles & access'], ['people', 'People'], ['lines', 'What we sell'],
                ['whatsapp', 'WhatsApp'],
                ['connections', 'Connections'], ['sheet', 'Engagement sheet'],
                ['data', 'Your data'],
                ['reset', hasDemo() ? 'Reset demo' : 'Start again']];
    /* An unknown tab lands on the first one rather than rendering the tab strip
       over an empty page. #/settings/branches did exactly that for a while: the
       strip said "Service lines", the dispatcher tested for 'lines', and the
       body came out blank with nothing to say why. */
    if (!tabs.some(function (t) { return t[0] === tab; })) tab = tabs[0][0];
    var h = '<div class="ph"><div><h1>Settings</h1><p>The owner\'s controls. Changes apply the moment you make them.</p></div></div>';
    h += '<div class="tabs">' + tabs.map(function (t) {
      return '<a class="tab ' + (t[0] === tab ? 'on' : '') + '" href="#/settings/' + t[0] + '">' + t[1] + '</a>';
    }).join('') + '</div>';

    if (tab === 'access') h += accessMatrix();
    else if (tab === 'people') h += peopleTab();
    else if (tab === 'lines') h += linesTab();
    else if (tab === 'whatsapp') h += (window.GE.whatsappSection ? window.GE.whatsappSection() : '');
    else if (tab === 'connections') h += connections();
    else if (tab === 'sheet') h += (VIEWS.sheet ? VIEWS.sheet('panel') : '');
    else if (tab === 'data') h += dataTab();
    else h += '<div class="card"><h3>' + (hasDemo() ? 'Reset the demonstration' : 'Start again') + '</h3>' +
      '<p class="m">' + (hasDemo()
        ? 'Puts every client, engagement, invoice, document and automation back to how it started. ' +
          'Engagements you added and files you uploaded are removed.'
        : '<b>This empties the cockpit.</b> Every client, engagement, invoice, document and ' +
          'automation goes, and there is no undo. Export your data first if you want it back.') +
      '</p><p style="margin-top:14px"><button class="btn" data-act="resetDemo">' +
      (hasDemo() ? 'Reset everything' : 'Empty it') + '</button></p></div>';
    return h;
  };

  /* ---- your data, and how to carry it ----

     The deployed build starts empty on purpose: it holds client credentials and
     the login here is client-side, so shipping the book would publish it. The
     cost of that decision is that the book lives in ONE browser. This is the
     answer to that — a file you export and import, which never touches a server
     and is therefore the same decision, not a hole in it. */
  /* Three files define their own `li`. app.js did not, and serverPanel() called
     it anyway — so the Settings screen threw "li is not defined", but only once
     a server was configured, because the branch that uses it is the one that
     only runs when there is something to report. A crash behind a condition is
     a crash nobody's checks reach unless the condition is part of the check. */
  function li(k, v) { return '<li><span>' + esc(k) + '</span><b>' + esc(v == null ? '—' : v) + '</b></li>'; }

  /* Where the data lives, said plainly and never guessed at. The worst state
     this app could be in is "you think it is on the server and it is not". */
  /* ---------------- being told, rather than checking ---------------- */
  /* ASK WHERE SOMEBODY IS ACTUALLY LOOKING.
     The switch for this lived in Settings, Connections, four clicks from the
     overview, which is the same as not existing: it was never turned on, so no
     notification could arrive, and the fair conclusion from outside was that the
     feature did not work. A browser refuses a permission prompt that did not come
     from a click, so it cannot simply be asked for on load. This is the one place
     the prompt can honestly be offered: on the screen you open first, once,
     dismissable, and gone for good the moment it is answered either way. */
  var NUDGE_KEY = 'zs.notify.nudged';

  function notifyNudge() {
    if (!window.API || !API.signedIn()) return '';
    if (typeof Notification === 'undefined') return '';
    if (Notification.permission !== 'default') return '';     /* answered already */
    try { if (localStorage.getItem(NUDGE_KEY)) return ''; } catch (e) {}

    return '<div class="note" id="notifynudge" style="border-color:var(--accent)">' +
      '<b>Be told when a lead lands.</b> Enquiries from the website appear on the board ' +
      'on their own, but only while you are looking at this tab. Turn notifications on and ' +
      'the cockpit tells you when it is in the background too. ' +
      '<span style="display:inline-flex;gap:8px;margin-top:10px">' +
      '<button class="minibtn" data-act="askNotify">Turn them on</button>' +
      '<button class="minibtn" data-act="noNudge">Not now</button></span></div>';
  }

  function notifyPanel() {
    /* ⚠️ IT USED TO RETURN NOTHING AT ALL when there was no server, which is the
       same disappearing act that made this hard to find in the first place. The
       fact is worth saying rather than hiding: with nothing to poll there is
       nothing to be told ABOUT, so the card explains that instead of vanishing
       and leaving somebody hunting for a switch that is not there. */
    if (!window.API || !API.signedIn()) {
      return '<div class="card pad" style="margin-bottom:16px">' +
        '<div class="cardhead"><h3>Being told</h3>' +
        '<span class="pill dim">needs the server</span></div>' +
        '<p class="m">Notifications tell you when something arrives from somewhere else ' +
        '&mdash; the website form, or a colleague. This cockpit is not signed in to a ' +
        'server, so there is nowhere for anything to arrive from and nothing to tell you ' +
        'about. Sign in and the switch appears here.</p></div>';
    }
    var can = typeof Notification !== 'undefined';
    var state = can ? Notification.permission : 'unsupported';

    return '<div class="card pad" style="margin-bottom:16px' +
      (state === 'default' ? ';border-color:var(--accent)' : '') + '">' +
      '<div class="cardhead"><h3>Being told</h3>' +
      '<span class="pill ' + (state === 'granted' ? 'ok' : state === 'denied' ? 'bad' : 'warn') + '">' +
      (state === 'granted' ? 'on' : state === 'denied' ? 'blocked' :
       state === 'unsupported' ? 'not available here' : 'off') + '</span></div>' +
      /* THE BUTTON FIRST. It used to sit under two paragraphs of explanation,
         which is where a switch goes to be ignored. The browser will only ask
         when this is clicked, so it is the only thing on the card that matters. */
      (state === 'default'
        ? '<div style="margin:2px 0 12px"><button class="btn" data-act="askNotify">' +
          'Turn notifications on</button></div>'
        : '') +
      '<p class="m">The cockpit checks the server every twenty seconds while this tab is in ' +
      'front, so an enquiry from the website appears on the board without you reloading ' +
      'it.</p>' +
      '<p class="m" style="margin-top:8px">Turn this on and you are told when something ' +
      'arrives while you are in another tab. It is one notification, replaced each time, ' +
      'never a stack of them. It also means the tab keeps checking once a minute while it ' +
      'is in the background, which is what makes that possible: with notifications off it ' +
      'stops checking altogether and a tab left open all week costs nothing.</p>' +
      '<p class="m" style="margin-top:8px"><b>It needs the cockpit open in some tab.</b> ' +
      'A notification with the browser shut needs Meta-style push, a service worker and a ' +
      'subscription per device, which is a real piece of work rather than a switch. Say the ' +
      'word and it gets built; until then, an enquiry with everything closed waits on the ' +
      'board and in your email.</p>' +
      (state === 'granted'
        ? '<p class="hint" style="margin-top:10px">On. There is a test one in your ' +
          'notification centre from when you switched it on. To switch it off, use the ' +
          'browser\u2019s site settings next to the address bar.</p>'
        : state === 'denied'
          ? '<p class="hint" style="margin-top:10px"><b>Blocked for this site, and only the ' +
            'browser can undo that.</b> Chrome: click the icon to the left of the address, ' +
            'Site settings, Notifications, Allow. Safari: Safari menu, Settings, Websites, ' +
            'Notifications, find zippyscale.in, Allow. Then come back here and the switch ' +
            'reads on.</p>'
          : !can
            ? '<p class="hint" style="margin-top:10px">This browser does not do notifications. ' +
              'Everything still appears on screen without a reload.</p>'
            : '') +
      '</div>';
  }

  function serverPanel() {
    var api = window.API;
    if (!api) return '';
    var st = api.status();
    var s2 = api.state();

    var h = '<div class="card pad" style="margin-bottom:16px">' +
      '<div class="cardhead"><h3>The server</h3>' +
      '<span class="pill ' + st.tone + '">' + esc(st.label) + '</span></div>';

    if (!api.configured()) {
      h += '<p class="m">Nothing is configured, so this cockpit keeps everything in ' +
        '<b>this browser</b> and nowhere else. That works, and it does not follow you to ' +
        'another machine.</p>';
    } else {
      var only = unsyncedCount();
      h += '<ul class="ledger">' +
        li('Address', api.url()) +
        li('Signed in', api.signedIn() ? 'yes' : 'no') +
        li('Last saved up', s2.lastSync ? String(s2.lastSync).replace('T', ' ').slice(0, 16) : 'not yet') +
        li('Waiting to save', s2.pending ? String(s2.pending) + ' change(s)' : 'nothing') +
        /* ⚠️ SAID OUT LOUD. "Only in this browser" used to be a state with no
           symptom until the record disappeared. A number here is the difference
           between noticing and finding out a week later. */
        li('Only in this browser', only ? only + ' record(s) the server has not got' : 'nothing') +
        '</ul>';
      if (only) {
        h += '<p class="note" style="margin-top:10px;border-color:var(--warn)">' +
          '<b>' + only + ' record' + (only === 1 ? '' : 's') + ' ' +
          (only === 1 ? 'exists' : 'exist') + ' here and nowhere else.</b> ' +
          'They go up on their own within a second or two of any change. If this number ' +
          'stays put, the server is refusing them and the reason is above. Nothing is ' +
          'thrown away in the meantime.</p>';
      }
      if (s2.lastError) h += '<p class="err" style="margin-top:10px">' + esc(s2.lastError) + '</p>';
    }

    h += '<form id="apiform" style="margin-top:14px">' +
      '<div class="f wide"><label for="api-url">Server address</label>' +
      '<input id="api-url" name="url" value="' + esc(api.url() || '') + '" autocomplete="off" ' +
      'placeholder="https://something.workers.dev">' +
      '<span class="hint">' +
      (api.url() === api.defaultUrl()
        ? 'This is the address built into the cockpit, so every browser and phone finds it ' +
          'without being told. Change it only to point at a different server.'
        : 'This browser is pointed somewhere other than the built-in address.') +
      (api.defaultUrl()
        ? ' Emptying it puts the built-in address back, because a cockpit that can quietly ' +
          'become a separate local one is how you end up with two books.'
        : ' Leave it empty for this browser only. Nothing is deleted either way.') +
      '</span></div>' +
      '<button class="btn alt" type="submit" style="margin-top:10px">Save the address</button>' +
      (api.url() !== api.defaultUrl()
        ? ' <button class="btn alt" type="button" data-act="resetApiUrl">Back to the built-in one</button>'
        : '') +
      (api.signedIn()
        ? ' <button class="btn alt" type="button" data-act="pullNow">Fetch from the server now</button>'
        : '') +
      '</form></div>';
    return h;
  }

  function dataTab() {
    var counts = [
      ['Clients', (D.clients || []).length],
      ['Engagements', (D.opportunities || []).length],
      ['Invoices', (D.invoices || []).length],
      ['Follow-ups', (D.followups || []).length],
      ['Documents', (D.clients || []).reduce(function (a, c) { return a + (c.docs || []).length; }, 0) +
        (D.opportunities || []).reduce(function (a, o) {
          return a + (o.docs || []).length + ((o.proc && o.proc.docs) || []).length; }, 0)],
      ['Automations', (D.automations || []).length],
      ['WhatsApp templates', ((D.whatsapp || {}).templates || []).length]
    ];
    var bytes = 0;
    try { bytes = JSON.stringify(D).length; } catch (e) {}

    var h = serverPanel() + notifyPanel();
    h += '<div class="card pad"><div class="cardhead"><h3>What is in here</h3>' +
      '<span class="hint">' + fileSize(bytes) + ' in this browser</span></div>' +
      '<div class="kpis" style="margin-top:12px">' + counts.map(function (c) {
        return '<div class="kpi"><b>' + c[1] + '</b><span>' + esc(c[0]) + '</span></div>';
      }).join('') + '</div>';

    h += '<p class="honest" style="margin-top:14px">' +
      (window.API && API.signedIn()
        ? 'This is the copy in <b>this browser</b>. The truth is on the server, and what you ' +
          'see is what the server decided your role may see. The export below is still worth ' +
          'taking: it is a copy you hold, not one you have to ask anybody for.'
        : 'This cockpit keeps everything in <b>this browser</b> and nowhere else. No server ' +
          'holds it, which is why the client credentials in here are safe on a public ' +
          'address &mdash; there is nothing at the other end to break into. The cost is that ' +
          'it does not follow you to another machine by itself. That is what the file below ' +
          'is for.') + '</p></div>';

    h += '<div class="cols" style="align-items:start;margin-top:16px"><div>' +
      '<p class="eyebrow">Take it with you</p><div class="card pad">' +
      '<p class="m" style="margin-top:0">Writes everything above to a file on your desktop: ' +
      'clients, engagements, invoices, follow-ups, documents, templates, settings and your ' +
      'team. Keep it somewhere sensible &mdash; it is your whole book, in plain text.</p>' +
      '<p style="margin-top:12px"><button class="btn" data-act="exportAll">Export everything</button></p>' +
      '</div></div><div>' +
      '<p class="eyebrow">Bring it back</p><div class="card pad">' +
      '<p class="m" style="margin-top:0">Load a file you exported before, on this machine or ' +
      'another one. <b>It replaces what is here</b>, so export first if this browser has ' +
      'anything you want to keep.</p>' +
      '<p style="margin-top:12px"><label class="btn alt">Import a file' +
      '<input type="file" id="importall" accept=".json,application/json" hidden></label></p>' +
      '</div></div></div>';

    return h;
  }

  /* Reading a book back in. Validated before anything is replaced, because the
     alternative is a half-written store and no way back to the old one. */
  function importAll(file) {
    if (me().role !== 'owner') return toast('Only the owner imports a book.', true);
    var r = new FileReader();
    r.onerror = function () { toast('Could not read that file.', true); };
    r.onload = function () {
      var payload;
      try { payload = JSON.parse(String(r.result)); }
      catch (e) { return toast('That is not a cockpit file — it is not even JSON.', true); }
      if (!payload || payload.kind !== 'zippyscale-cockpit' || !payload.store) {
        return toast('That is a JSON file, but not one this cockpit exported.', true);
      }
      var incoming = payload.store;
      if (!Array.isArray(incoming.clients) || !Array.isArray(incoming.opportunities)) {
        return toast('That file is damaged: it has no clients or engagements.', true);
      }
      var n = incoming.clients.length + ' client(s) and ' + incoming.opportunities.length +
              ' engagement(s), exported ' + String(payload.exported || '').slice(0, 10);
      if (!confirm('Replace everything in this browser with ' + n + '?\n\n' +
                   'What is here now goes, and there is no undo.')) return;

      /* through the same migration as anything else, so an older export loads */
      D = migrate(incoming);
      syncStaff();
      save();
      log('data_import', 'A book was imported: ' + n);
      save();
      toast('Imported. ' + n + '.');
      location.hash = '#/home';
      render();
    };
    r.readAsText(file);
  }

  function firstRun() {
    var steps = [
      ['Add your first client', 'A client is a company. The people you deal with are contacts on it, ' +
        'so one business never becomes three records.', '#/clientnew', 'Add a client'],
      ['Open an engagement', 'What you are building for them, what it costs, and what the scope is. ' +
        'Nothing on it is mandatory — you learn the fee on the fourth call.', '#/oppnew', 'Open one'],
      ['Bring a book you already have', 'If you have exported this cockpit from another browser, ' +
        'load the file and everything comes back at once.', '#/settings/data', 'Import a file']
    ];
    var h = '<div class="ph"><div><h1>ZippyScale</h1>' +
      '<p>Nothing in here yet. Three ways to change that.</p></div></div>';

    h += '<div class="cols3">' + steps.map(function (s2, i) {
      return '<div class="card pad">' +
        '<p class="eyebrow">' + (i + 1) + '</p>' +
        '<h3 style="margin:6px 0 8px">' + esc(s2[0]) + '</h3>' +
        '<p class="m">' + esc(s2[2] === '#/settings/data' ? s2[1] : s2[1]) + '</p>' +
        '<p style="margin-top:13px"><a class="btn' + (i ? ' alt' : '') + '" href="' + s2[2] + '">' +
        esc(s2[3]) + '</a></p></div>';
    }).join('') + '</div>';

    h += '<div class="card pad" style="margin-top:18px">' +
      '<h3>Where your data lives</h3>' +
      '<p class="m">In this browser, and nowhere else. No server holds any of it, which is why ' +
      'this address is safe to keep even though the cockpit holds client logins and fees: there ' +
      'is nothing at the other end to break into.</p>' +
      '<p class="m" style="margin-top:9px">The cost is that it does not follow you to another ' +
      'machine on its own. <b>Settings &rarr; Your data &rarr; Export</b> writes the whole book to ' +
      'a file you keep, and Import brings it back. Do that before you clear your browser.</p>' +
      '</div>';
    return h;
  }

  /* The server speaks in tables; the screens speak in one object. This is the
     translation, in one place, so no screen has to know a server exists.

     What arrives is ALREADY SCOPED. If a contractor signs in, `remote.clients`
     is short because the database returned few rows, not because this function
     filtered anything. That is the whole difference between a permission and a
     paint job. */
  var G_unsynced = null;

  /* Work that exists in this browser and nowhere else. */
  function unsynced() {
    var out = { clients: [], opportunities: [], invoices: [], followups: [] };
    Object.keys(out).forEach(function (k) {
      (D[k] || []).forEach(function (r) { if (r && !r._synced) out[k].push(r); });
    });
    return out;
  }
  function unsyncedCount() {
    var u = unsynced();
    return u.clients.length + u.opportunities.length + u.invoices.length + u.followups.length;
  }
  /* What the push loop sweeps up before it runs. See the comment there. */
  G_unsynced = unsynced;

  function adoptRemote(remote) {
    if (!remote) return;

    /* ⚠️ THIS FUNCTION USED TO DESTROY UNSAVED WORK, SILENTLY.
    
       It rebuilds the store from blank() plus whatever the server sent. So a
       client typed into this browser and not yet accepted by the server was
       simply not in the new store, and the old one was gone. No error, no
       warning, no trace: the record had never reached the server, so nothing
       there recorded that it had ever existed either.
    
       That is what happened to EGO Premium. It was added in the console, it
       never went up — most likely typed while this browser was not signed in,
       in which case nothing even queued it — and the next pull replaced the
       store with the server's, which had never heard of it.
    
       THE RULE NOW: a record without `_synced` is work the server has never
       accepted, and it SURVIVES the adopt and is queued to be sent. A record
       WITH `_synced` that the server no longer has was genuinely deleted, and is
       allowed to go. Losing somebody's typing must be impossible; resurrecting a
       deleted row is merely untidy, so the doubt goes that way on purpose. */
    var mine = unsynced();
    /* everything this browser holds right now, so a record the server has lost
       can be told apart from one it never had */
    var was = {};
    ['clients', 'opportunities', 'invoices', 'followups'].forEach(function (k) {
      was[k] = (D[k] || []).slice();
    });

    var b = blank();
    D = Object.assign(b, {
      v: b.v,
      session: remote.user && remote.user.id,
      access: remote.settings && remote.settings.access ? remote.settings.access : b.access,
      clients: (remote.clients || []).map(function (c) {
        return Object.assign({}, c, { docs: docsFor(remote, 'client', c.id) });
      }),
      opportunities: (remote.opportunities || []).map(function (o) {
        return Object.assign({}, o, { client: o.client_id, docs: docsFor(remote, 'deal', o.id) });
      }),
      /* ⚠️ MAPPED BACK, not taken raw. The server calls them opp_id, client_id and
         of_n; every screen in here reads opp, client and of. Taken raw, every
         invoice arrives attached to nothing and the whole money layer reads as
         empty — which is not obviously a bug, it just looks like no invoices. */
      invoices: (remote.invoices || []).map(function (i) {
        return window.API ? API.fromWire('invoices', i) : i;
      }),
      followups: (remote.followups || []).map(function (f) {
        return window.API ? API.fromWire('followups', f) : f;
      }),
      automations: remote.automations || [],
      staff: remote.staff || [],
      activity: (remote.activity || []).map(function (a) {
        return { id: a.id, at: a.at, by: a.by_staff, kind: a.kind, text: a.text,
                 client: a.client_id, opp: a.opp_id, line: a.line };
      }),
      /* ⚠️ ANYTHING MISSING FROM HERE IS RESET, because this starts from blank().
         That is how the first bin emptied itself: it lived only in the browser,
         and every sync put it back to []. The server owns it now and sends it
         down with everything else, to whoever may delete. */
      /* ⚠️ SAME TRAP AS THE BIN: absent from here means reset on every sync. The
         server scopes these, so what arrives IS what this person may read. */
      threads: remote.threads || [],
      mayAssign: !!remote.mayAssign,
      /* ⚠️ absent from here means wiped on every sync, the trap that ate the bin */
      prospects: remote.prospects || [],
      sends: remote.sends || [],
      bin: (remote.bin || []).map(function (b) {
        return { id: b.id, kind: b.kind, record: b.record, label: b.label,
                 by: b.by, at: b.at, expires: b.expires, ref: b.ref || '',
                 carried: b.carried || {}, server: true };
      })
    });
    /* account-wide settings the server holds */
    /* ⚠️ A KEY MISSING FROM THIS LIST IS RESET ON EVERY SYNC, because the store
       above is built from blank(). backup_sheet is the address of the backup
       sheet; leaving it out meant the Open the sheet button vanished twenty
       seconds after it appeared. */
    ['targets', 'picklists', 'products', 'usd_rate', 'roles', 'agentModes',
     'backup_sheet', 'outreach_playbook'].forEach(function (k) {
      if (remote.settings && remote.settings[k]) D[k] = remote.settings[k];
    });
    /* syncStaff() also republishes the product list, so what we sell comes from
       the server rather than from whatever this browser last had. */
    syncStaff();
    var rescued = [];

    /* everything that came down IS on the server, by definition */
    ['clients', 'opportunities', 'invoices', 'followups'].forEach(function (k) {
      (D[k] || []).forEach(function (r) { r._synced = true; });
    });

    /* ⚠️ A RECORD MISSING FROM THE SERVER IS NOT PROOF IT WAS DELETED.

       The old rule was: something the server once had and no longer has was
       deleted on purpose, so let it go. That is only true if nothing else can
       remove a row. On 30 September I ran a cleanup over the clients table to
       remove my own test records and took a real client with it. The browser
       still had it, correctly marked as saved, and the very next pull would have
       obeyed the server and destroyed the last copy.

       A deletion made through the cockpit is recorded in the BIN, so that is
       what a deletion looks like. Anything else missing from the server is
       treated as something the server lost, kept, and sent back up. The cost of
       being wrong is a record that reappears; the cost of the old rule is a
       record that is gone. */
    var deleted = {};
    (remote.bin || []).forEach(function (b) {
      if (b && b.record) deleted[b.record] = true;
      ((b && b.carried && b.carried.ids) || []).forEach(function (i) { deleted[i] = true; });
    });
    ['clients', 'opportunities', 'invoices', 'followups'].forEach(function (k) {
      var have = {};
      (D[k] || []).forEach(function (r) { have[r.id] = true; });
      (was[k] || []).forEach(function (r) {
        if (have[r.id] || deleted[r.id]) return;
        /* the server lost it. Keep it, and send it back. */
        delete r._synced;
        D[k] = (D[k] || []).concat([r]);
        rescued.push([k, r]);
      });
    });

    /* and everything that was only here is put back, and queued to go up.
       ⚠️ The bin still wins. Without this, a record rescued once is unsynced for
       ever after, so a later real deletion would find it here and resurrect it. */
    ['clients', 'opportunities', 'invoices', 'followups'].forEach(function (k) {
      var have = {};
      (D[k] || []).forEach(function (r) { have[r.id] = true; });
      mine[k].forEach(function (r) {
        if (have[r.id] || deleted[r.id]) return;
        D[k] = (D[k] || []).concat([r]);
        rescued.push([k, r]);
      });
    });

    /* Prime the change tracker with what just arrived. Without this the next
       save would push every record straight back at the server as though we had
       edited all of them. */
    primeChanges();

    /* ⚠️ QUEUED BY NAME, NOT BY DIFFING, and the difference is the whole thing.

       This used to call queueChanges() here, with a comment claiming that
       priming first and queueing second was "the order that makes this work".
       It was the exact opposite. primeChanges() records a stamp for EVERY record
       in the store, rescued ones included, so queueChanges() then compared each
       one against a stamp it had just written, found no difference, and queued
       NOTHING.

       The visible symptom was "4 records the server has not got" sitting at 4
       for ever while the panel beside it said "Saved to the server" and "Waiting
       to save: nothing". Both were true. Nothing was waiting because nothing was
       ever put in the queue.

       A rescued record is one we KNOW the server has not got. There is nothing
       to work out, so nothing is worked out: it is named to the queue directly. */
    if (rescued.length && window.API) {
      rescued.forEach(function (pair) { API.touch(pair[0], pair[1]); });
      toast(rescued.length + ' record' + (rescued.length === 1 ? '' : 's') +
            ' in this browser had never reached the server. Sending ' +
            (rescued.length === 1 ? 'it' : 'them') + ' up now.');
    }
    try { localStorage.setItem(ZS.APP_KEY, JSON.stringify(D)); } catch (e) {}
    render();
  }

  /* Pull now and adopt what comes back. Anything that changes the server's copy
     and then needs the screen to agree with it calls this rather than re-rendering
     from what the browser happened to have. */
  /* ⚠️ SEND BEFORE YOU FETCH, EVERY TIME.
     A pull replaces the store. Anything still sitting in the queue when that
     happens is work the server has not got and the browser is about to forget.
     Flushing first makes the common case correct; `_synced` in adoptRemote is
     what catches the case where the flush itself fails. Two guards, because
     this is the one thing that must not go wrong. */
  function flushFirst() {
    if (!window.API || typeof API.flush !== 'function') return Promise.resolve();
    return API.flush().catch(function () { /* offline: _synced still protects it */ });
  }

  function pullNow() {
    if (!window.API || !API.signedIn()) { render(); return Promise.resolve(false); }
    return flushFirst().then(function () { return API.pull(); }).then(function (remote) {
      adoptRemote(remote);
      /* the pulse baseline moves with it, or the next tick announces our own change */
      return API.pulse().then(function (p) { if (p) lastPulse = p; return true; })
        .catch(function () { return true; });
    });
  }

  function docsFor(remote, kind, id) {
    return (remote.documents || [])
      .filter(function (d) { return d.holder_kind === kind && d.holder_id === id; })
      .map(function (d) {
        return { id: d.id, type: d.type, name: d.name, size: d.size, mime: d.mime,
                 when: String(d.uploaded_at || '').slice(0, 10), by: d.uploaded_by,
                 /* the file lives on the server now, so the link points there */
                 data: d.r2_key && window.API ? API.docUrl(d.id) : null,
                 remote: true };
      });
  }

  /* null = we have not asked the server yet, false = it has an owner,
     true = it genuinely has none. Starting at `false` would be a claim we have
     not earned, and starting at `true` offers to create an account we may not
     be allowed to create. Unknown is the honest third state. */
  var serverNeedsSetup = null;
  var serverUnreachable = false;

  function accessMatrix() {
    var h = '<p class="hint" style="margin-bottom:12px">Each row is a role. Tick what they may reach. ' +
      'The owner\'s row is locked so nobody can switch off their own access.</p>';
    h += '<div class="scroller" style="max-height:none"><table class="matrix"><thead><tr><th>Role</th><th>Which clients</th>' +
      ZS.CAPS.filter(function (c) { return c[0] !== 'settings' || true; }).map(function (c) {
        return '<th title="' + esc(c[2]) + '">' + esc(c[1]) + '</th>';
      }).join('') + '</tr></thead><tbody>';

    h += D.roles.map(function (r) {
      var a = D.access[r.id] || ZS.NO_ACCESS;
      var locked = r.id === 'owner';
      var n = ZS.staffByRole(r.id).length;
      return '<tr class="' + (locked ? 'locked' : '') + '">' +
        '<td class="rn">' + esc(r.name) + '<span>' + (n ? n + ' person' + (n === 1 ? '' : 's') : 'nobody yet') +
          (r.custom ? ' &middot; custom' : '') + '</span></td>' +
        '<td><select data-acc="' + esc(r.id) + '|scope"' + (locked ? ' disabled' : '') + '>' +
          Object.keys(ZS.SCOPES).map(function (s) {
            return '<option value="' + s + '"' + (a.scope === s ? ' selected' : '') + '>' + ZS.SCOPES[s] + '</option>';
          }).join('') + '</select></td>' +
        ZS.CAPS.map(function (c) {
          return '<td><input type="checkbox" data-acc="' + esc(r.id) + '|' + c[0] + '"' +
            (a[c[0]] ? ' checked' : '') + (locked ? ' disabled' : '') + '></td>';
        }).join('') + '</tr>';
    }).join('');
    h += '</tbody></table></div>';

    h += '<div class="card" style="margin-top:16px"><h3>Add a role</h3>' +
      '<p class="m">Start from an existing role and adjust the ticks.</p>' +
      '<form id="rolef" style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px;align-items:flex-end">' +
      '<div class="f" style="flex:1;min-width:190px"><label for="r-name">Name</label>' +
        '<input id="r-name" placeholder="e.g. Accounts desk" required></div>' +
      '<div class="f" style="min-width:170px"><label for="r-from">Start from</label><select id="r-from">' +
        D.roles.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('') +
      '</select></div><button class="btn" type="submit">Add role</button></form></div>';
    return h;
  }

  function peopleTab() {
    var actor = me(), mayPass = can('passwords');
    var onServer = !!(window.API && API.signedIn());
    var h = '<p class="hint" style="margin-bottom:12px">Everyone who can sign in. ' +
      'A new person gets the access their role carries, which you can change on the Roles tab.' +
      (mayPass
        ? (onServer
            ? ' Passwords are issued here. They are stored as hashes on the server, so nobody ' +
              'can read one back \u2014 not even you. Losing one means issuing another.'
            : ' Passwords are issued here and stay readable, so you can tell somebody what theirs is. ' +
              'Nobody sets their own \u2014 except the owner, who has to be able to, or nobody could.')
        : ' Passwords are hidden from your role.') + '</p>';

    h += '<div class="scroller" style="max-height:none"><table class="matrix"><thead><tr>' +
      '<th>Person</th><th>Username</th><th>Password</th><th>Role</th><th>Line</th>' +
      '<th>Clients</th><th></th>' +
      '</tr></thead><tbody>' + D.staff.map(function (u) {
        var n = D.clients.filter(function (c) { return c.assigned_to === u.id; }).length;
        var seePass = ZS.canSeePass(actor, u, D.access);
        var setPass = ZS.canSetPass(actor, u, D.access);
        return '<tr><td class="rn">' + esc(u.name) +
            '<span>' + (u.mobile ? esc(ZS.maskMobile(u.mobile, actor, D.access)) : 'no mobile') +
              (u.email ? ' &middot; ' + esc(u.email) : '') + '</span>' +
            '<span>joined ' + esc(u.joined || '\u2014') + '</span></td>' +
          '<td>' + esc(u.login) + '</td>' +
          '<td class="passcell">' +
            /* On a server there is nothing readable to show: it is a PBKDF2
               hash with a random salt, and that is the point. Saying "issued"
               is the truth; printing an empty <code> block would look like a
               bug and inviting somebody to read it would be a lie. */
            (onServer
              ? '<span class="dim">issued</span>'
              : (seePass ? '<code>' + esc(u.pass) + '</code>'
                         : '<span class="dim">\u2022\u2022\u2022\u2022\u2022\u2022</span>')) +
            (setPass ? ' <button class="minibtn" data-act="resetPass" data-id="' + esc(u.id) + '">' +
                       (onServer ? 'Issue a new one' : 'Reset') + '</button>' : '') +
          '</td>' +
          '<td><select data-person="' + esc(u.id) + '|role"' +
              (ZS.canSetRole(actor, u, null, D.access) ? '' : ' disabled') + '>' +
            D.roles.filter(function (r) {
              if (u.role === r.id) return true;   // always show what they are now
              return ZS.canSetRole(actor, u, r.id, D.access);
            }).map(function (r) {
              return '<option value="' + esc(r.id) + '"' + (u.role === r.id ? ' selected' : '') + '>' +
                esc(r.name) + '</option>';
            }).join('') + '</select></td>' +
          /* Which line they are scoped to. An empty option matters: somebody
             may work across all of them, and a dropdown with no way to say so
             forces a lie. */
          '<td><select data-person="' + esc(u.id) + '|line">' +
            '<option value=""' + (u.line ? '' : ' selected') + '>All lines</option>' +
            ZS.PRODUCTS.map(function (b) {
              return '<option value="' + esc(b.id) + '"' + (u.line === b.id ? ' selected' : '') + '>' +
                esc(b.name) + '</option>';
            }).join('') + '</select></td>' +
          '<td class="num">' + n + '</td>' +
          '<td>' + (u.id === D.session ? '<span class="pill em">You</span>'
            : '<button class="minibtn" data-act="dropPerson" data-id="' + esc(u.id) + '">Remove</button>') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';

    /* Creating a sign-in means issuing a password, so the form belongs to
       whoever may issue one. */
    if (!mayPass) {
      h += '<div class="note" style="margin-top:16px">Adding a team member means issuing them a ' +
        'password, which your role cannot do. Ask the owner or the store manager.</div>';
      return h;
    }

    h += '<div class="card" style="margin-top:16px"><h3>Add a team member</h3>' +
      '<p class="m">Their name, mobile and email are how you reach them; the username and password ' +
      'are how they sign in. They cannot change the password themselves \u2014 you reset it for them.</p>' +
      '<form id="staffform" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:13px;align-items:end">' +
      '<div class="f"><label for="s-name">Full name</label><input id="s-name" name="name" autocomplete="off" required></div>' +
      (window.GE && GE.mobileField ? GE.mobileField('s-mobile', 'mobile', ZS.DEFAULT_DIAL, '')
                     : '<div class="f"><label for="s-mobile">Mobile</label><input id="s-mobile" name="mobile" required></div>') +
      '<div class="f"><label for="s-email">Email address</label><input id="s-email" name="email" type="email" autocomplete="off" required></div>' +
      '<div class="f"><label for="s-login">Username</label><input id="s-login" name="login" autocomplete="off" required></div>' +
      '<div class="f"><label for="s-pass">Password</label><input id="s-pass" name="pass" autocomplete="off" placeholder="at least 6 characters" required></div>' +
      '<div class="f"><label for="s-role">Role</label><select id="s-role" name="role">' +
        D.roles.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label for="s-line">Line</label><select id="s-line" name="line">' +
        '<option value="">All lines</option>' +
        ZS.PRODUCTS.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>'; }).join('') +
      '</select></div>' +
      '<button class="btn" type="submit">Add person</button></form>' +
      '<p class="err" id="s-err"></p></div>';
    return h;
  }

  /* ---- what we sell, which is also the line ----

     This was two tabs. "Service lines" listed Cockpit builds and Automation &
     GHL with an address and a phone number, and "What we sell" listed Agentic
     Cockpit and AI Automations with a price. The same split twice, and only one
     of them editable — the prices lived in shipped source where nobody at all
     could change them.

     One list now. It prices the work, prefixes the reference, carries the
     monthly target, and is what a role can be scoped to. */
  function linesTab() {
    var may = can('settings');
    var rate = ZS.usdRate();
    var h = '<p class="hint" style="margin-bottom:12px">Everything you sell. Each one sets its own ' +
      'floor price, prefixes the references on it, and carries a monthly target. ' +
      'The fee on an engagement is still scoped per job; this is the floor, not a price list.</p>';

    /* The dollar figure is worked out from this, never stored, so it cannot go
       stale behind your back the way a saved one did. */
    h += '<div class="card pad" style="margin-bottom:16px">' +
      '<div class="cardhead"><h3>The dollar rate</h3>' +
      '<span class="pill info">set ' + esc(rate.at) + '</span></div>' +
      '<p class="m">Every dollar figure on these cards is the rupee price divided by this. ' +
      'It is not fetched from anywhere, so it is right only as long as you keep it right.</p>' +
      (may
        ? '<div class="f" style="max-width:260px;margin-top:10px"><label for="usdrate">Rupees to the dollar</label>' +
          '<input id="usdrate" type="number" min="1" step="0.01" value="' + esc(rate.rate) + '"></div>'
        : '<p class="hint" style="margin-top:8px">\u20b9' + esc(rate.rate) + ' to the dollar.</p>') +
      '</div>';

    h += '<div class="grid2">' + ZS.PRODUCTS.map(function (p) {
      var opps = (D.opportunities || []).filter(function (o) { return o.product === p.id; });
      var won = opps.filter(function (o) { return o.outcome === 'won'; });
      var people = (D.staff || []).filter(function (u) { return u.line === p.id; });
      var value = opps.reduce(function (a, o) { return a + ZS.oppValue(o); }, 0);
      return '<div class="card pad">' +
        '<div style="display:flex;gap:10px;align-items:flex-start">' +
        '<div style="flex:1"><h3 style="margin:0">' + esc(p.name) + '</h3>' +
        '<span class="refchip" style="margin-top:6px;display:inline-block">' + esc(p.code) + '-001…</span></div>' +
        (may ? '<button class="minibtn" data-act="editLine" data-id="' + esc(p.id) + '">Edit</button>' : '') +
        (may && ZS.PRODUCTS.length > 1
          ? '<button class="xbtn" data-act="dropLine" data-id="' + esc(p.id) + '" aria-label="Remove">&times;</button>'
          : '') +
        '</div>' +
        '<p class="m" style="margin-top:8px">' + esc(p.blurb || '') + '</p>' +
        '<div class="ministats" style="margin-top:13px">' +
          '<div><b>' + ZS.money(p.from) + '</b><span>from</span></div>' +
          '<div><b>$' + ZS.fmt(ZS.inUsd(p.from)) + '</b><span>at \u20b9' + esc(rate.rate) + '</span></div>' +
          '<div><b>' + opps.length + '</b><span>engagements</span></div>' +
          '<div><b>' + won.length + '</b><span>signed</span></div>' +
          '<div><b>' + (p.target && p.target.units || 0) + '</b><span>target / month</span></div>' +
          '<div><b>' + (can('cost') ? ZS.money(value) : '₹ ••••') + '</b><span>contracted</span></div>' +
        '</div>' +
        (people.length ? '<p class="hint" style="margin-top:10px">' + people.length +
          ' person(s) scoped to this line</p>' : '') +
        '</div>';
    }).join('') + '</div>';

    if (may) {
      h += '<div class="card pad" style="margin-top:16px"><h3>Add something we sell</h3>' +
        '<p class="m">A line is a thing you sell more than once. Anything sold once is an ' +
        'engagement with its own scope, not a line of its own.</p>' +
        lineForm(null) + '</div>';
    }
    return h;
  }

  /* One form for adding and for editing, so the two cannot ask for different
     things — which is exactly what the old pair did. */
  function lineForm(p) {
    var e = p || {};
    return '<form id="lineform"' + (p ? ' data-id="' + esc(p.id) + '"' : '') + '>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;align-items:start">' +
      '<div class="f"><label for="l-name">Name</label>' +
      '<input id="l-name" name="name" value="' + esc(e.name || '') + '" placeholder="e.g. Website builds"></div>' +
      '<div class="f"><label for="l-code">Reference code</label>' +
      '<input id="l-code" name="code" value="' + esc(e.code || '') + '" maxlength="4" ' +
      'placeholder="WB" style="text-transform:uppercase">' +
      '<span class="hint">Two to four capitals. Every reference on this line starts with it.</span></div>' +
      '<div class="f"><label for="l-from">Floor price (₹)</label>' +
      '<input id="l-from" name="from" type="number" min="0" value="' + esc(e.from == null ? '' : e.from) + '">' +
      '<span class="hint">The starting point. The fee is still agreed per engagement.</span></div>' +
      '<div class="f"><label for="l-units">Target a month</label>' +
      '<input id="l-units" name="units" type="number" min="0" value="' +
      esc((e.target && e.target.units) || 0) + '"></div>' +
      '<div class="f"><label for="l-value">Target value a month (₹)</label>' +
      '<input id="l-value" name="value" type="number" min="0" step="10000" value="' +
      esc((e.target && e.target.value) || 0) + '"></div>' +
      '<div class="f wide"><label for="l-blurb">What it includes</label>' +
      '<textarea id="l-blurb" name="blurb" rows="2">' + esc(e.blurb || '') + '</textarea></div>' +
      '</div><p class="err" id="l-err"></p>' +
      '<div style="display:flex;gap:10px;margin-top:12px">' +
      '<button class="btn" type="submit">' + (p ? 'Save' : 'Add it') + '</button>' +
      (p ? '<button class="btn alt" type="button" data-act="closeModal">Cancel</button>' : '') +
      '</div></form>';
  }



  function connections() {
    /* ⚠️ NOTIFICATIONS BELONG ON THIS SCREEN.
       The switch was on Settings, Your data. Bhargav went looking for it on
       Connections and reported that no prompt ever appeared — and he was right to
       look here: in his head this list IS the list of things that are connected,
       and a browser notification is one of them. A feature nobody can find is a
       feature that does not work, and the place it lives is not a detail. It is
       still on Your data as well; the same panel, in both places. */
    var rows = [
      ['WhatsApp Business', 'Enquiries, template sends and the 24-hour window.', 'Setting up',
       'warn', 'Needs a Meta Business account, a verified number and approved templates.'],
      ['Instagram', 'DMs and story replies arrive as enquiries.', 'Setting up', 'warn',
       'Needs the Instagram account linked to a Meta Business page.'],
      /* ⚠️ THIS ROW USED TO PROMISE MESSAGES, and Google shut Business Messages
         down on 31 July 2024: the endpoints return errors and partner console
         access was revoked. Chat and call history went with it. Leaving the old
         wording in would have had us selling a client a channel that does not
         exist, which is the one mistake that costs every other claim its
         credibility. What is left is reviews and how the listing performs. */
      ['Google Business Profile', 'Reviews, and how the profile performs in Maps and Search.',
       'Setting up', 'warn',
       'Needs the ZippyScale profile claimed, then Google\u2019s approval for the ' +
       'Business Profile API. Messaging is not on the list because Google closed it ' +
       'in July 2024.'],
      ['Meta lead ads', 'Lead form submissions land straight on the board.', 'Setting up', 'warn',
       'Needs Meta Business verification and app review.'],
      ['Website enquiries', 'The enquiry form on zippyscale.in.', 'Live', 'ok',
       'Needs the form wired to this console.'],
      ['Engagement sheet', 'Every engagement, as a spreadsheet.', 'Live', 'ok',
       'Written by the five-minute sweep. Export and import both work.']
    ];
    return '<div class="card" style="padding:0">' + rows.map(function (r) {
      return '<div class="conn"><div><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span>' +
        '<span style="display:block;color:var(--dim);margin-top:3px">' + esc(r[4]) + '</span></div>' +
        '<span class="pill ' + r[3] + '">' + esc(r[2]) + '</span></div>';
    }).join('') + '</div>' + metaPanel() + backupPanel() + notifyPanel() +
    '<div class="note">Nothing in the list above sends a real message yet. Each one is ' +
    'shown so you can see where it would sit, and what it needs first. Notifications are ' +
    'different: they work now, and they are the one thing here you can switch on yourself.</div>';
  }

  /* THE ONE DOOR ALL THREE META CHANNELS COME THROUGH.

     WhatsApp, Instagram and lead ads are not three integrations. They hang off
     one Meta app, one business verification and one Page, and all three POST to
     the same callback URL. Shown here because the URL is the one thing that has
     to be copied out of this cockpit and pasted into Meta, and because the
     conditions are worth reading before anybody starts. */
  function metaPanel() {
    if (!window.API || !API.signedIn()) return '';
    var hook = (API.url() || '') + '/api/hook/meta';
    return '<div class="card pad" style="margin:16px 0">' +
      '<div class="cardhead"><h3>The Meta door</h3>' +
      '<span class="pill warn">waiting on Meta</span></div>' +
      '<p class="m">WhatsApp, Instagram and lead ads all arrive here. One app, one ' +
      'verification, one Page, one address:</p>' +
      '<div class="f wide" style="margin-top:10px">' +
      '<input value="' + esc(hook) + '" readonly onclick="this.select()" ' +
      'style="font-family:var(--mono);font-size:12px">' +
      '<span class="hint">Paste this as the Callback URL on the Meta app, for every ' +
      'product. Click to select it.</span></div>' +
      '<p class="m" style="margin-top:12px"><b>It is shut until it is configured</b>, and ' +
      'it refuses anything that does not carry Meta\u2019s signature. It cannot be ' +
      'opened by pasting the URL somewhere: the app secret has to be set on the ' +
      'server, by hand, once.</p>' +
      '<p class="m" style="margin-top:8px">What lands where: a <b>lead ad</b> becomes a ' +
      'client and an engagement at Enquiry, because filling in a lead form is an ' +
      'enquiry. A <b>WhatsApp or Instagram message</b> waits in the Inbox for one tap, ' +
      'because a message is not an enquiry and a board that fills itself from every ' +
      '&ldquo;hi&rdquo; is a board nobody trusts.</p></div>';
  }

  /* THE BACKUP SHEET.

     Every client with their contacts on one tab, every engagement on another,
     written as they change and MARKED rather than removed when they are deleted.
     It is a mirror and never a source: nothing typed into it is read back.

     Why it exists when there is already a database with a thirty-day bin: this
     one is readable by somebody with no login, and it outlives the cockpit. A
     copy that lives inside the same system is not a backup of that system. */
  function backupPanel() {
    if (!window.API || !API.signedIn()) return '';
    var sheet = D.backup_sheet || null;
    return '<div class="card pad" style="margin:16px 0">' +
      '<div class="cardhead"><h3>Backup sheet</h3>' +
      '<span class="pill ok">live</span></div>' +
      '<p class="m">Every client with their contacts on one tab, every engagement on ' +
      'another, in a Google Sheet that updates itself as things change here &mdash; a new ' +
      'enquiry, a stage moved, a deletion. Deleted records are <b>marked</b>, never removed, ' +
      'so this keeps what the cockpit no longer holds.</p>' +
      '<p class="m" style="margin-top:8px">It is a mirror and not a second cockpit. Nothing ' +
      'typed into that sheet comes back here, and an edited cell is overwritten the next ' +
      'time that record moves.</p>' +
      '<div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">' +
      '<button class="btn alt" data-act="fillSheet">Fill it from scratch</button>' +
      (sheet && sheet.url
        ? '<a class="btn alt" href="' + esc(sheet.url) + '" target="_blank" rel="noopener">' +
          'Open the sheet</a>'
        : '') +
      '</div>' +
      '<p class="hint" style="margin-top:10px">' +
      (sheet && sheet.url
        ? 'Filling it again rewrites every row from the cockpit, which is how you put it ' +
          'right if it has been out of touch.'
        : 'The first fill creates the sheet in the ZippyScale Google account and gives you ' +
          'the link.') + '</p></div>';
  }

  /* ---------------- actions ---------------- */

  Object.assign(ACTIONS, {
    fillSheet: function () {
      if (!window.API || !API.signedIn()) return toast('Sign in to the server first.', true);
      if (!acc().settings) return toast('That is the owner\u2019s.', true);
      toast('Writing every client and engagement into the sheet\u2026');
      API.fillSheet().then(function (r) {
        if (r && r.sheet) { D.backup_sheet = r.sheet; save(); }
        toast('Backed up: ' + (r.clients || 0) + ' client(s) and ' +
              (r.opportunities || 0) + ' engagement(s).');
        render();
      }).catch(function (e) {
        toast((e && e.message) || 'The sheet could not be written.', true);
      });
    },
    closeModal: function () { document.getElementById('modal').close(); },
    openDrawer: function (id) { DRAWER = id; render(); },
    closeDrawer: function () { DRAWER = null; render(); },
    toggleRail: function () { setRail(!railOpen()); paintChrome(); },
    resetPass: function (id) {
      var u = ZS.staffById(id);
      if (!u || !ZS.canSetPass(me(), u, D.access)) {
        toast(u && u.role === 'owner' ? 'Only the owner can change the owner\'s password.'
                                      : 'That is not yours to change.', true);
        return;
      }
      modal('Reset password', u.name + ' \u2014 signs in as ' + u.login,
        '<form id="passform" data-uid="' + esc(u.id) + '">' +
        '<p class="m">' + (window.API && API.signedIn()
          ? (u.id === (me() || {}).id
              ? 'Your own. It is stored as a hash on the server, so nobody \u2014 including you \u2014 can read it back. Write it down. Changing it ends every other session.'
              : 'Issued by you, stored as a hash. Nobody can read it back, so tell them what it is.')
          : (u.id === (me() || {}).id
              ? 'Your own. Make it something you will actually remember \u2014 it stays readable on this page.'
              : 'They cannot change this themselves. Tell them the new one, and it stays readable here.')) +
        '</p>' +
        '<div class="f" style="margin-top:14px"><label for="p-new">New password</label>' +
        '<input id="p-new" type="password" value="' +
        ((window.API && API.signedIn()) ? '' : esc(u.pass)) + '" autocomplete="new-password" ' +
        'placeholder="' + ((window.API && API.signedIn()) ? 'at least 8 characters' : 'at least 6 characters') + '"></div>' +
        '<p class="err" id="p-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:16px">' +
        '<button class="btn" type="submit">Set password</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },
    /* Light and dark. The choice is remembered per browser rather than in the
       store, because it belongs to the screen you are sitting at, not to the
       book — the same book read on a laptop and a bright office monitor wants
       two different answers. Until you choose, it follows the machine. */
    toggleTheme: function () {
      var now = theme() === 'light' ? 'dark' : 'light';
      if (document.documentElement) document.documentElement.setAttribute('data-theme', now);
      try { localStorage.setItem('zs_theme', now); } catch (e) {}
      paintTheme();
    },

    /* The account chip opens this. It is an action rather than a special case in
       the click handler, so it can be reached and checked like everything else. */
    account: function () { accountMenu(); },

    signout: function () {
      var m = document.getElementById('modal'); if (m && m.open) m.close();
      /* End it at the server as well, or the token keeps working from anywhere
         it was copied to. The local session goes either way, and the book stays
         in the cache so the next sign-in is instant. */
      var done = function () {
        D.session = null;
        try { localStorage.setItem(ZS.APP_KEY, JSON.stringify(D)); } catch (e) {}
        location.hash = '#/home';
        render();
        toast('Signed out.');
      };
      if (window.API && API.signedIn()) API.signOut().then(done, done);
      else done();
    },
    askNotify: function () {
      try { localStorage.setItem(NUDGE_KEY, '1'); } catch (e) {}
      askToNotify();
    },
    noNudge: function () {
      try { localStorage.setItem(NUDGE_KEY, '1'); } catch (e) {}
      toast('Fine. It is in Settings, Connections, whenever you want it.');
      render();
    },
    openClient: function (id) { go('#/client/' + id); },
    openProduct: function (id) { go('#/product/' + id); },
    doneFollow: function (id) {
      var f = D.followups.filter(function (x) { return x.id === id; })[0];
      if (f) { f.done = true; f.done_at = ZS.today();
        log('follow_done', 'Follow-up completed' + (f.note ? ' — ' + f.note.slice(0, 60) : ''),
            { client: f.client, opp: f.opp });
        save(); toast('Marked done.'); render(); }
    },
    resetApiUrl: function () {
      API.resetUrl();
      toast('Back to the built-in address.');
      render();
    },

    /* Straight back to the sign-in, keeping everything that is in this browser. */
    signInAgain: function () {
      D.session = null;
      try { localStorage.setItem(ZS.APP_KEY, JSON.stringify(D)); } catch (e) {}
      render();
    },

    pullNow: function () {
      if (!window.API || !API.signedIn()) return;
      toast('Fetching…');
      flushFirst().then(function () { return API.pull(); }).then(adoptRemote)
        .then(function () { toast('Up to date.'); })
        .catch(function (e) { toast(e.message || 'Could not reach the server.', true); });
    },

    /* The whole store as a file. Nothing goes to a server, which is the point:
       the same decision that keeps the credentials safe is what makes this the
       only way to move them. */
    exportAll: function () {
      if (!can('exportData')) return toast('Exporting is switched off for your role.', true);
      if (me().role !== 'owner') return toast('Only the owner exports the whole book.', true);
      var payload = {
        kind: 'zippyscale-cockpit',
        version: D.v,
        exported: new Date().toISOString(),
        by: (me() || {}).name || '',
        store: D
      };
      var text;
      try { text = JSON.stringify(payload, null, 1); }
      catch (e) { return toast('Could not read the store: ' + e.message, true); }
      var blob = new Blob([text], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'zippyscale-cockpit-' + ZS.today() + '.json';
      a.click();
      log('data_export', 'The whole book was exported (' + fileSize(text.length) + ')');
      save();
      toast('Exported. Keep that file somewhere sensible.');
    },

    resetDemo: function () {
      if (!confirm('Reset everything? Engagements you added will be removed.')) return;
      var s = D.session;
      D = blank(); D.session = s;
      seed();
      save(); toast('Demo reset.'); go('#/home');
    },
    goBack: function () {
      HIST.pop();                        // where we are
      var to = HIST.pop() || '#/home';   // where we were
      go(to);
    },
    dropPerson: function (id) {
      var u = ZS.staffById(id);
      if (!u || id === D.session) return;
      var held = D.clients.filter(function (c) { return c.assigned_to === id; }).length;
      if (!confirm('Remove ' + u.name + '?' + (held ? ' Their ' + held + ' clients become unassigned.' : ''))) return;
      D.clients.forEach(function (c) { if (c.assigned_to === id) c.assigned_to = null; });
      D.staff = D.staff.filter(function (x) { return x.id !== id; });
      syncStaff(); log('staff_remove', u.name + ' removed from the team');
      save(); toast(u.name + ' removed.'); render();
    },
    editLine: function (id) {
      var p = ZS.productById(id);
      if (!p || !can('settings')) return;
      modal('Edit ' + p.name, 'Changes apply the moment you save them.', lineForm(p));
    },

    dropLine: function (id) {
      if (!can('settings')) return;
      var p = ZS.productById(id);
      if (!p) return;
      var used = (D.opportunities || []).filter(function (o) { return o.product === id; });
      if (used.length) {
        return toast('Cannot remove ' + p.name + ': ' + used.length + ' engagement(s) are on it. ' +
                     'Move them first, or the references would point at a line that does not exist.', true);
      }
      if (!confirm('Remove "' + p.name + '"? Nothing is on it, so nothing is lost.')) return;
      D.products = (D.products || []).filter(function (x) { return x.id !== id; });
      ZS.setProducts(D.products);
      log('product_edit', p.name + ' removed from what we sell');
      save(); toast('Removed.'); render();
    },

    dictate: function (id, el) { dictate(id, el); },
    hardReload: function () {
      /* a new query string forces the browser to fetch every file again */
      location.replace(location.pathname + '?fresh=' + Date.now() + location.hash);
    },
    setRange: function (k) {
      RANGE.key = k;
      if (k === 'custom' && !RANGE.from) {
        var d = ZS.rangeDates('month');
        RANGE.from = d[0]; RANGE.to = d[1];
      }
      render();
    },
    /* The other way in, and a worse one: this let you become anybody on the
       roster without their password. It belongs to the demo, so it lives with
       the demo. On the deployed build, changing who you are means signing out
       and signing in as them. */
    switchUser: function () {
      if (!hasDemo()) {
        return toast('Sign out and sign in as them. There is no switching without a password.', true);
      }
      modal('Switch user', 'Tap a name to sign in as them. This is here for the demo only.',
        '<div class="creds">' + ZS.staffList().map(function (u) {
          return '<button type="button" data-act="beUser" data-id="' + u.id + '">' +
            '<b>' + esc(u.name) + '</b> <em>' + esc(roleName(u.role)) + '</em>' +
            '<span>' + esc(u.login) + '</span></button>';
        }).join('') + '</div>');
    },
    beUser: function (id) {
      if (!hasDemo()) return toast('That is a demo shortcut and is not in this build.', true);
      D.session = id; save();
      document.getElementById('modal').close();
      G_afterLogin();
      go('#/home'); toast('Now signed in as ' + ZS.staffById(id).name + '.');
    }
  });

  /* ---------------- boot ---------------- */

  /* ---- the demo book, and why the deployed build does not carry it ----

     seed.js holds our real engagements: five clients' live portal passwords, a
     matter that is with lawyers, every fee and every balance. That is exactly what this
     cockpit is FOR, and exactly what must never be shipped to a URL — the login
     on this app is client-side, so view-source defeats it in one step. Publishing
     the bundle would publish the book.

     So the seed is loaded only when it is present, and the deployed build does
     not include seed.js or data/engagements.js at all. It starts empty, you sign
     in, and your book lives in your own browser. Moving it between machines is
     Settings → Your data → Export, which writes a file you keep. */
  function seed() {
    if (window.SEEDER) window.SEEDER(D, D.products || []);
  }
  function hasDemo() { return !!window.SEEDER; }

  function boot() {
    if (booted) return; booted = true;
    D = load();

    /* No catalogue fetch. What we sell lives in the store, so there is nothing
       to wait for and nothing to fail. */
    if (!D.clients.length) { seed(); save(); }
    if (D._sweptOnLoad) {
      log('data_export', D._sweptOnLoad + ' item(s) left the bin after thirty days');
      delete D._sweptOnLoad;
      save();
    }
    syncStaff();
    loadSheet();
    wire();
    if (D.session) G_afterLogin();
    render();
  }

  var SYNCLOG = [];
  function loadSheet() {
    fetch('data/sheet.csv').then(function (r) { return r.ok ? r.text() : null; })
      .then(function (t) { if (t) { SHEET = t; } })
      .catch(function () {});
    fetch('data/sync_log.json').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.length) { SYNCLOG = j; render(); } })
      .catch(function () {});
  }

  function wire() {
    /* login */
    /* ⚠️ THE FRONT DOOR.

       This filled in everyone's password on a tap. Fine on a laptop running a
       demo; on a public URL it is not a login at all, it is a menu. It now
       exists only where the demo book exists, which is nowhere the deployed
       build reaches — build.py does not ship seed.js. */
    if (hasDemo()) {
      var box = $('#lg-demo');
      box.hidden = false;
      box.innerHTML = '<h4>Demonstration logins &mdash; tap to fill</h4><div id="lg-list"></div>' +
        '<p class="hint">Only on this machine. The deployed build has no list and no ' +
        'tap-to-fill: you sign in with a username and a password like anywhere else.</p>';
      $('#lg-list').innerHTML = (D.staff || []).map(function (u) {
        return '<button type="button" data-login="' + u.login + '">' +
          '<b>' + esc(u.name) + '</b> <em>' + esc(roleName(u.role)) + '</em>' +
          '<span>' + esc(u.login) + '</span></button>';
      }).join('');
    }

    /* ---- first run on a build with nobody on the roster ----

       The deployed bundle carries no credential, so the very first visit has to
       make one. The account you create here lives in this browser and nowhere
       else — not in the source, not on a server. */
    function needsSetup() { return !(D.staff || []).length; }

    /* Ask the server whether it has an owner yet, so the same form knows
       whether it is signing in or setting up. Failing to reach it is not fatal:
       the cockpit still runs on the local cache and says so. */
    if (window.API && API.configured()) {
      API.setupNeeded().then(function (needed) {
        serverNeedsSetup = needed;
        serverUnreachable = false;
        paintLogin();
      }).catch(function () {
        /* ⚠️ NEVER FALL BACK TO A LOCAL COCKPIT.
           This used to leave serverNeedsSetup alone and paint whatever the
           local store implied — which on a fresh browser is "nobody has signed
           in here yet, create an owner". That created a SECOND cockpit, with
           its own account and its own empty book, disconnected from the real
           one. A server we cannot reach is a problem to report, not a different
           application to become. */
        serverUnreachable = true;
        paintLogin();
      });

      /* An unexpired token means we were already signed in; go straight in. */
      if (API.signedIn()) {
        /* ⚠️ THE MOST DANGEROUS PULL OF THE LOT. This is boot, on a browser that
           may hold an evening's typing done while signed out. Flush first, and
           _synced catches whatever the flush could not send. */
        flushFirst().then(function () { return API.pull(); }).then(adoptRemote).catch(function (e) {
          if (e && e.unauthorised) { paintLogin(); return; }
          /* offline: carry on with the cache rather than locking them out */
          render();
        });
      }
    }
    function paintLogin() {
      var onServer = !!(window.API && API.configured());

      /* Cannot reach it: say so and offer nothing. The one thing this must not
         do is quietly turn into a different, local cockpit. */
      if (onServer && serverUnreachable) {
        $('#lg-name-w').hidden = true;
        $('#lg-hint').hidden = false;
        $('#lg-hint').innerHTML = 'Cannot reach the server. This is almost always the ' +
          'connection rather than the cockpit. <b>Nothing is lost</b> &mdash; try again in a moment.';
        $('#lg-go').textContent = 'Try again';
        $('#lg-go').disabled = false;
        return;
      }

      /* Have not asked yet: do not guess. */
      if (onServer && serverNeedsSetup === null) {
        $('#lg-name-w').hidden = true;
        $('#lg-hint').hidden = false;
        $('#lg-hint').textContent = 'Checking with the server…';
        $('#lg-go').textContent = 'Sign in';
        $('#lg-go').disabled = true;
        return;
      }
      $('#lg-go').disabled = false;

      /* With a server, ONLY the server decides whether an account may be made.
         The local store has no say: a browser that has never been used is not
         evidence that a cockpit needs setting up. */
      var setup = onServer ? (serverNeedsSetup === true) : needsSetup();
      $('#lg-name-w').hidden = !setup;
      $('#lg-hint').hidden = !setup;
      $('#lg-go').textContent = setup ? 'Create the account' : 'Sign in';
      if (setup) {
        $('#lg-hint').textContent = (window.API && API.configured())
          ? 'Nobody has set this cockpit up yet. Pick a username and a password and this ' +
            'becomes the owner account. It is kept on the server, so it works on any device.'
          : 'Nobody has signed in here yet. Pick a username and a password and this becomes ' +
            'the owner account. It is kept in this browser only, so write it down.';
      }
    }
    paintLogin();

    $('#loginform').addEventListener('submit', function (e) {
      e.preventDefault();

      /* ---- the server, when there is one ----
         The same two boxes do both jobs. What changes is who checks the answer:
         a string comparison in this file, or PBKDF2 against a database. */
      if (window.API && API.configured()) {
        if (serverUnreachable || serverNeedsSetup === null) {
          $('#lg-err').textContent = '';
          $('#lg-hint').textContent = 'Checking with the server…';
          API.setupNeeded().then(function (n) {
            serverNeedsSetup = n; serverUnreachable = false; paintLogin();
          }).catch(function () { serverUnreachable = true; paintLogin(); });
          return;
        }
        var ln0 = String($('#lg-u').value || '').trim().toLowerCase();
        var pw0 = String($('#lg-p').value || '');
        var nm0 = String(($('#lg-n') || {}).value || '').trim();
        $('#lg-err').textContent = '';
        $('#lg-go').disabled = true;
        $('#lg-go').textContent = 'Checking…';

        /* Only the server's answer opens the setup path. Anything else signs in. */
        (serverNeedsSetup === true
          ? API.createOwner(nm0, ln0, pw0)
          : API.signIn(ln0, pw0)
        ).then(function () {
          /* ⚠️ THE MOMENT EGO PREMIUM WAS LOST. Work typed into this browser
             while it was not signed in is not in any queue — there was nowhere to
             queue it to — so flushing finds nothing and the pull that follows
             used to replace it with the server's book. `_synced` in adoptRemote
             is what saves it now. The flush is here for the other case: a token
             that expired mid-session, leaving real entries in the queue. */
          return flushFirst();
        }).then(function () {
          return API.pull();
        }).then(function (remote) {
          adoptRemote(remote);
          $('#lg-go').disabled = false;
          go('#/home');
        }).catch(function (err) {
          $('#lg-err').textContent = err.message || 'That did not work.';
          $('#lg-go').disabled = false;
          paintLogin();
        });
        return;
      }

      if (needsSetup()) {
        var nm = String($('#lg-n').value || '').trim();
        var ln = String($('#lg-u').value || '').trim().toLowerCase();
        var pw = String($('#lg-p').value || '');
        if (!ZS.validName(nm)) { $('#lg-err').textContent = 'What should we call you?'; return; }
        if (!/^[a-z0-9._-]{3,}$/.test(ln)) {
          $('#lg-err').textContent = 'A username is at least three characters: letters, numbers, dots or dashes.';
          return;
        }
        if (!ZS.validPass(pw)) { $('#lg-err').textContent = 'The password needs at least six characters.'; return; }
        D.staff = [{ id: 'u1', login: ln, pass: pw, name: nm, role: 'owner',
                     line: null, mobile: '', email: '',
                     joined: ZS.today() }];
        syncStaff();
        D.session = 'u1';
        save();
        log('staff_add', nm + ' set up the cockpit as owner');
        save();
        $('#lg-err').textContent = '';
        toast('Welcome. Your sign-in is on Settings → People if you forget it.');
        go('#/home');
        return;
      }

      var u = ZS.authenticate($('#lg-u').value, $('#lg-p').value);
      if (!u) { $('#lg-err').textContent = 'That username and password do not match.'; return; }
      D.session = u.id; save();
      $('#lg-err').textContent = '';
      /* The agents catch up on sign-in: the same pass a 9:00 schedule would run
         in production. There is no scheduler here and there must not be one —
         a setInterval in a demo is a lie about how it works. */
      if (G_afterLogin()) { /* swept */ }
      go('#/home');
    });

    document.addEventListener('click', function (e) {
      var fill = e.target.closest('[data-login]');
      if (fill) {
        /* whatever their password is NOW — one of them may have been reset */
        var who = (D.staff || []).filter(function (u) { return u.login === fill.dataset.login; })[0];
        $('#lg-u').value = fill.dataset.login;
        $('#lg-p').value = (who && who.pass) || '';
        $('#lg-p').focus();
        return;
      }

      if (e.target.closest('#uchip')) { ACTIONS.account(); return; }

      /* a control inside a clickable card handles itself — do not also open the card */
      var tag = e.target.tagName;
      if (tag === 'SELECT' || tag === 'OPTION' || tag === 'INPUT' || tag === 'TEXTAREA') return;

      var el = e.target.closest('[data-act]');
      if (!el) return;
      var fn = ACTIONS[el.dataset.act];
      if (!fn) return;
      if (el.tagName !== 'A') e.preventDefault();
      fn(el.dataset.id, el);
    });

    /* settings matrix writes straight through */
    document.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'importall') {
        if (e.target.files && e.target.files[0]) importAll(e.target.files[0]);
        e.target.value = '';
        return;
      }
      var el = e.target.closest('[data-acc]');
      if (el) {
        var p = el.dataset.acc.split('|');
        D.access[p[0]] = D.access[p[0]] || Object.assign({}, ZS.NO_ACCESS);
        D.access[p[0]][p[1]] = el.type === 'checkbox' ? el.checked : el.value;
        log('access_change', (D.roles.filter(function (r2) { return r2.id === p[0]; })[0] || {}).name +
            ' — ' + p[1] + ' set to ' + (el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value));
        save();
        toast('Updated ' + (D.roles.filter(function (r) { return r.id === p[0]; })[0] || {}).name + '.');
        if (p[0] === me().role) render();
        return;
      }
      if (e.target.id === 'usdrate') {
        if (!can('settings')) { render(); return; }
        var nr = Number(e.target.value);
        if (!(nr > 0)) { toast('A rate has to be a number above zero.', true); return; }
        D.usd_rate = { rate: nr, at: ZS.today() };
        ZS.setUsdRate(D.usd_rate);
        log('rate_set', 'Dollar rate set to \u20b9' + nr);
        save(); toast('\u20b9' + nr + ' to the dollar.'); render();
        return;
      }
      var bt = e.target.closest ? e.target.closest('[data-btarget]') : null;
      if (bt) {
        var bp = bt.dataset.btarget.split('|');
        /* the target lives on the line, which is the product */
        var br = (D.products || []).filter(function (x) { return x.id === bp[0]; })[0];
        if (br) { br.target = br.target || {}; br.target[bp[1]] = Number(bt.value) || 0;
          ZS.setProducts(D.products);
          log('target_set', br.name + ' — ' + bp[1] + ' target set to ' + bt.value);
          save(); toast('Target set for ' + br.name + '.'); render(); }
        return;
      }
      var pt = e.target.closest ? e.target.closest('[data-ptarget]') : null;
      if (pt) {
        var pp = pt.dataset.ptarget.split('|');
        D.targets[pp[0]] = D.targets[pp[0]] || { units: 0, value: 0 };
        D.targets[pp[0]][pp[1]] = Number(pt.value) || 0;
        log('target_set', ZS.staffById(pp[0]).name + ' — ' + pp[1] + ' target set to ' + pt.value);
        save(); toast('Target set for ' + ZS.staffById(pp[0]).name + '.'); render();
        return;
      }
      var pe = e.target.closest ? e.target.closest('[data-person]') : null;
      if (pe) {
        var pk = pe.dataset.person.split('|');
        var who = D.staff.filter(function (u) { return u.id === pk[0]; })[0];
        if (!who) return;
        if (!can('settings')) { render(); return; }
        if (pk[1] === 'role' && !ZS.canSetRole(me(), who, pe.value, D.access)) {
          toast('Only the owner can set that role.', true);
          render();                      // put the dropdown back where it was
          return;
        }
        who[pk[1]] = pe.value; syncStaff();
        log('staff_edit', who.name + ' \u2014 ' +
            (pk[1] === 'role' ? 'role changed to ' + roleName(pe.value)
                              : 'line changed to ' + (pe.value ? ZS.lineName(pe.value) : 'all lines')));
        save(); toast(who.name + ' updated.'); render();
        return;
      }
      if (e.target.id === 'r-from') { RANGE.from = e.target.value; render(); return; }
      if (e.target.id === 'r-to') { RANGE.to = e.target.value; render(); return; }
      if (ACTIONS.onChange) ACTIONS.onChange(e);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && DRAWER) { DRAWER = null; render(); }
    });

    document.addEventListener('submit', function (e) {
      if (e.target.id === 'rolef') {
        e.preventDefault();
        var name = document.getElementById('r-name').value.trim();
        var from = document.getElementById('r-from').value;
        if (!name) return;
        var id = 'role' + Date.now();
        D.roles.push({ id: id, name: name, custom: true });
        D.access[id] = Object.assign({}, D.access[from]);
        log('role_add', 'Role "' + name + '" created');
        save(); toast('Added ' + name + '.'); render();
        return;
      }
      if (e.target.id === 'apiform') {
      e.preventDefault();
      var u = String(new FormData(e.target).get('url') || '').trim();
      if (u && !/^https:\/\//i.test(u)) {
        toast('It has to start with https:// — a token sent over http is a token given away.', true);
        return;
      }
      /* Emptying it reverts to the built-in address rather than going local.
         The local-only mode still exists for a build with no address compiled
         in — that is development — but a deployed cockpit must not be able to
         turn into a second, disconnected one by clearing a text box. */
      if (!u) {
        if (API.defaultUrl()) {
          API.resetUrl();
          toast('Back to the built-in address.');
        } else {
          API.setUrl(null);
          toast('Back to this browser only. Nothing was deleted.');
        }
        render(); return;
      }
      API.setUrl(u);
      API.setupNeeded().then(function (needed) {
        serverNeedsSetup = needed;
        toast(needed ? 'Reached it. Nobody has set it up yet — sign out and create the owner account.'
                     : 'Reached it. Sign out and sign in to connect.');
        render();
      }).catch(function (err) {
        toast('Saved the address, but could not reach it: ' + err.message, true);
        render();
      });
      return;
    }

    if (e.target.id === 'staffform') {
        e.preventDefault();
        if (!can('passwords')) return;          // the form is not rendered, but never trust that
        var fd = new FormData(e.target);
        var err = document.getElementById('s-err');
        var nm = String(fd.get('name') || '').trim();
        var login = String(fd.get('login') || '').trim().toLowerCase();
        var mob = String(fd.get('mobile') || '').replace(/\D/g, '');
        var dial = fd.get('mobile_dial') || ZS.DEFAULT_DIAL;
        var mail = String(fd.get('email') || '').trim();
        var pass = String(fd.get('pass') || '').trim();

        /* Checked in the order somebody fills the form in, so the message
           always points at the field they are looking at. */
        if (!ZS.validName(nm)) { err.textContent = 'Enter their full name.'; return; }
        if (!ZS.validPhone(dial, mob)) { err.textContent = 'That number does not look right for ' + ZS.dialLabel(dial) + '.'; return; }
        if (D.staff.some(function (u) { return u.mobile === mob; })) {
          err.textContent = 'Somebody on the team already has that mobile number.'; return;
        }
        if (!ZS.validEmail(mail)) { err.textContent = 'Enter a valid email address.'; return; }
        if (!login) { err.textContent = 'Give them a username to sign in with.'; return; }
        if (D.staff.some(function (u) { return u.login === login; })) {
          err.textContent = 'That username is taken. Pick another.'; return;
        }
        if (!ZS.validPass(pass)) { err.textContent = 'The password needs at least 6 characters.'; return; }

        var person = { id: 'u' + Date.now(), login: login, pass: pass,
          name: nm, mobile: mob, dial: dial, email: mail, role: fd.get('role'),
          line: fd.get('line') || null, joined: ZS.today() };

        function landed(id) {
          person.id = id || person.id;
          D.staff.push(person);
          syncStaff();
          log('staff_add', nm + ' added as ' + roleName(person.role) + ' on ' +
              (person.line ? ZS.lineName(person.line) : 'all lines'));
          save();
          toast(nm + ' can sign in as ' + login + '.');
          render();
        }

        /* ⚠️ THIS USED TO ADD THEM TO THIS BROWSER AND NOTHING ELSE.

           The account existed on the People tab, with a username and a password
           on it, and the person could not sign in from anywhere — same failure
           as the password change above, which reported success and changed
           nothing. An account only exists once the server says it does. */
        if (window.API && API.signedIn()) {
          if (pass.length < 8) { err.textContent = 'The server wants at least eight characters.'; return; }
          err.textContent = '';
          var sbtn = e.target.querySelector('button[type="submit"]');
          if (sbtn) { sbtn.disabled = true; sbtn.textContent = 'Creating…'; }
          API.addStaff({ login: login, password: pass, name: nm, role: person.role,
                         line: person.line, mobile: mob, email: mail })
            .then(function (r) { landed(r && r.id); })
            .catch(function (e2) {
              err.textContent = e2.message || 'The server refused that.';
              if (sbtn) { sbtn.disabled = false; sbtn.textContent = 'Add person'; }
            });
          return;
        }

        landed();
        return;
      }
      if (e.target.id === 'passform') {
        e.preventDefault();
        var who = ZS.staffById(e.target.dataset.uid);
        var pf = document.getElementById('p-new').value.trim();
        var perr = document.getElementById('p-err');
        if (!who || !ZS.canSetPass(me(), who, D.access)) {
          perr.textContent = 'That is not yours to change.'; return;
        }
        if (!ZS.validPass(pf)) { perr.textContent = 'At least 6 characters, please.'; return; }

        /* ⚠️ THIS SAID "NEW PASSWORD SET" AND CHANGED NOTHING.

           It wrote who.pass into the local store and called save(). With no
           server that is the whole job. With a server it is worse than a
           failure, because a password change that reports success and does not
           happen leaves somebody believing they are secure when they are not.

           When a server is connected it is the only thing that decides, so the
           change goes there and the answer comes back before anything is said. */
        if (window.API && API.signedIn()) {
          if (pf.length < 8) { perr.textContent = 'The server wants at least eight characters.'; return; }
          perr.textContent = '';
          var btn = e.target.querySelector('button[type="submit"]');
          if (btn) { btn.disabled = true; btn.textContent = 'Setting…'; }
          API.changePassword(pf, who.id).then(function () {
            log('staff_pass', 'Password issued for ' + who.name);
            save();
            var m = document.getElementById('modal'); if (m) m.close();
            toast(who.id === (me() || {}).id
              ? 'Your password is changed. Every other session has been ended.'
              : 'New password issued for ' + who.name + '.');
            render();
          }).catch(function (err) {
            perr.textContent = err.message || 'The server refused that.';
            if (btn) { btn.disabled = false; btn.textContent = 'Set password'; }
          });
          return;
        }

        who.pass = pf;
        syncStaff();
        /* The new password is never written into the log — the log is readable
           by more people than the People tab is. */
        log('staff_pass', 'Password reset for ' + who.name);
        save();
        document.getElementById('modal').close();
        toast('New password set for ' + who.name + '.');
        render();
        return;
      }
      if (e.target.id === 'lineform') {
      e.preventDefault();
      if (!can('settings')) return;
      var lf = new FormData(e.target);
      var editingId = e.target.dataset.id || null;
      var draft = ZS.newProduct({
        id: editingId || undefined,
        name: lf.get('name'),
        code: String(lf.get('code') || '').toUpperCase(),
        from: lf.get('from'),
        blurb: lf.get('blurb'),
        target: { units: Number(lf.get('units')) || 0, value: Number(lf.get('value')) || 0 }
      });
      var bad = ZS.validateProduct(draft, D.products || []);
      if (bad) { document.getElementById('l-err').textContent = bad; return; }

      D.products = D.products || [];
      if (editingId) {
        D.products = D.products.map(function (x) { return x.id === editingId ? draft : x; });
        log('product_edit', draft.name + ' updated — from ' + ZS.money(draft.from));
      } else {
        D.products.push(draft);
        log('product_add', draft.name + ' added, from ' + ZS.money(draft.from));
      }
      ZS.setProducts(D.products);
      save();
      var lm = document.getElementById('modal'); if (lm && lm.open) lm.close();
      toast(editingId ? 'Saved.' : draft.name + ' added.');
      render();
      return;
    }

      if (e.target.id === 'targetform') {
        e.preventDefault();
        var uid = e.target.dataset.uid;
        var units = Number(document.getElementById('t-units').value) || 0;
        var value = Number(document.getElementById('t-value').value) || 0;
        D.targets[uid] = { units: units, value: value };
        save();
        document.getElementById('modal').close();
        toast('Target set for ' + ZS.staffById(uid).name + '.');
        render();
        return;
      }
      if (ACTIONS.onSubmit) ACTIONS.onSubmit(e);
    });

    window.addEventListener('hashchange', render);

    /* Stop watching a tab nobody is looking at, and catch up the moment one
       comes back to the front. */
    if (document.addEventListener) {
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) return;
        pulseTick();
      });
    }
  }

  window.GE = {
    boot: boot, render: render, go: go, toast: toast, modal: modal, deny: deny,
    pullNow: pullNow, unsyncedCount: unsyncedCount, unsyncedRecords: function () { return unsynced(); },
    saveLocal: saveLocal,
    /* exposed so the suite can prove a pull does not eat unsaved work */
    adoptRemote: adoptRemote,
    VIEWS: VIEWS, ACTIONS: ACTIONS,
    me: me, acc: acc, can: can, save: save,
    D: function () { return D; },
    products: productList,
    productById_view: productById_view,
    clientById: clientById, onFloor: onFloor, pendingMsgs: pendingMsgs,
    range: range, inRange: inRange, rangeBar: rangeBar, micButton: micButton,
    micReset: micReset, hearing: function () { return HEARING; },
    log: log, KINDS: KINDS, KIND_GROUPS: KIND_GROUPS,
    /* A model is behind Jarvis only when there is a server to hold the key.
       The screen says which of the two it is, because "is this thing using AI"
       is a question the honest answer to changes what you should trust. */
    modelOn: function () { return !!(window.API && API.signedIn()); },
    migrate: migrate, blank: blank, roleName: roleName, theme: theme,   // exposed so the upgrade path can be tested
    setHashForTest: function (h) { location.hash = h; },
    sheet: function () { return SHEET; },
    syncLog: function () { return SYNCLOG; },
    setSheet: function (t) { SHEET = t; },
    drawerHTML: drawerHTML,
    takeDoc: takeDoc, fileSize: fileSize,
    /* Documents against a product ride in the edits map, so they survive a reload
       and a re-scrape the same way every other product edit does. */
    clientDocs: function (id) { return ((D.edits[id] || {}).docs) || []; },
    addClientDoc: function (id, doc) {
      D.edits[id] = D.edits[id] || {};
      D.edits[id].docs = (D.edits[id].docs || []).concat([doc]);
      save();
      return doc;
    },
    dropClientDoc: function (id, docId) {
      var e = D.edits[id];
      if (!e || !e.docs) return;
      e.docs = e.docs.filter(function (d) { return d.id !== docId; });
      save();
    }
  };
})();
