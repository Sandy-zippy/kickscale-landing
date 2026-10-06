/* Gifting Cockpit — shell, store, router, home, team, reports, settings.
   Plug-ins (desk, discover, crm, pipeline, orders, vendors, autos) register
   into VIEWS and ACTIONS. One render() rebuilds #shell from state; every click
   flows through one delegated listener reading data-act. No framework, no
   build step. Exposes window.GE. */
(function () {
  'use strict';

  var VIEWS = {}, ACTIONS = {};
  var D = null, DB = null, E = window.RoyaleEngine;
  var $ = function (s) { return document.querySelector(s); };
  var esc = GC.esc, money = GC.money;

  /* ================= store ================= */

  function blank() {
    return {
      v: GC.STORE_V, session: null, seeded: false, tenant: {},
      access: GC.defaultAccess(),
      roles: Object.keys(GC.T.roles).map(function (r) { return { id: r, name: GC.T.roles[r].label, custom: false }; }),
      staff: GC.clone(GC.T.staff), branches: GC.clone(GC.T.branches), warehouses: GC.clone(GC.T.warehouses),
      targets: GC.clone(GC.T.targets),
      companies: [], contacts: [], opps: [], orders: [], followups: [], messages: [], rfqs: [],
      issues: [], proposals: [], runs: [], automations: [], templates: [], campaigns: [],
      warehouse: {}, stockMoves: [], vendorEdits: {}, productEdits: {}, newProducts: [], intakeQueue: [], vendorUploads: [],
      activity: [], notifications: []
    };
  }

  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(GC.appKey()) || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object' || !d.v) return blank();
    if (d.v > GC.STORE_V) return blank();                 // written by a newer build: do not guess
    if (d.v < GC.STORE_V) d = migrate(d);
    return repair(d);
  }
  /* Fill anything missing and replace anything of the wrong type, so a half
     written or hand-edited store cannot take a screen down. */
  function repair(d) {
    var b = blank();
    Object.keys(b).forEach(function (k) {
      if (!(k in d) || d[k] === null || d[k] === undefined) { d[k] = b[k]; return; }
      if (Array.isArray(b[k]) && !Array.isArray(d[k])) d[k] = b[k];
      else if (!Array.isArray(b[k]) && b[k] && typeof b[k] === 'object' && (typeof d[k] !== 'object' || Array.isArray(d[k]))) d[k] = b[k];
    });
    /* a saved access map predates any capability added since: backfill from
       the role's defaults without overriding a choice the owner made */
    Object.keys(d.access).forEach(function (role) {
      var base = GC.ACCESS_DEFAULT[role] || GC.NO_ACCESS;
      if (!d.access[role] || typeof d.access[role] !== 'object') d.access[role] = GC.clone(base);
      Object.keys(base).forEach(function (cap) { if (d.access[role][cap] === undefined) d.access[role][cap] = base[cap]; });
    });
    Object.keys(GC.ACCESS_DEFAULT).forEach(function (r) { if (!d.access[r]) d.access[r] = GC.clone(GC.ACCESS_DEFAULT[r]); });
    Object.keys(GC.T.roles).forEach(function (r) {
      if (!d.roles.some(function (x) { return x.id === r; })) d.roles.push({ id: r, name: GC.T.roles[r].label, custom: false });
    });
    if (!d.staff.length) d.staff = GC.clone(GC.T.staff);
    if (!d.branches.length) d.branches = GC.clone(GC.T.branches);
    d.opps.forEach(function (o) {
      if (!Array.isArray(o.lines)) o.lines = [];
      if (!Array.isArray(o.quotes)) o.quotes = [];
      if (!Array.isArray(o.samples)) o.samples = [];
      if (!o.brief || typeof o.brief !== 'object') o.brief = GC.newBrief({});
    });
    d.orders.forEach(function (o) {
      ['vendorPOs', 'dispatches', 'history', 'lines'].forEach(function (k) { if (!Array.isArray(o[k])) o[k] = []; });
      if (!o.artwork || typeof o.artwork !== 'object') o.artwork = { status: 'pending' };
      if (!o.qc || typeof o.qc !== 'object') o.qc = { status: 'pending' };
    });
    d.automations.forEach(function (a) {
      ['tiers', 'sources', 'conds', 'actions'].forEach(function (k) { if (!Array.isArray(a[k])) a[k] = []; });
      if (!a.trigger || !a.trigger.type) a.trigger = { type: 'new_enquiry' };
    });
    return d;
  }
  /* Version 1 is the first shape, so there is nothing older to carry forward
     yet. The next change to a data shape adds a step here and a case in
     check_upgrade.js. */
  function migrate(d) { d.v = GC.STORE_V; return d; }

  function save() {
    try { localStorage.setItem(GC.appKey(), JSON.stringify(D)); }
    catch (e) { toast('This browser\'s storage is full — reset the demo in Settings.', 'bad'); }
  }

  function seedIfEmpty() {
    if (D.seeded) return;
    var s = SEED.build(GC, E, DB);
    Object.keys(s).forEach(function (k) { D[k] = s[k]; });
    D.seeded = true;
    save();
  }

  /* ================= catalogue ================= */

  var PCACHE = {};
  function P(id) {
    if (!id) return null;
    if (PCACHE[id]) return PCACHE[id];
    var it = DB.byId[id];
    return it ? (PCACHE[id] = GC.product(it, DB, D.productEdits[id])) : null;
  }
  function dropCache(id) { if (id) delete PCACHE[id]; else PCACHE = {}; }
  /* Products added in the console (vendor intake) join the engine's arrays,
     so search, facets and the agents see them like any other. */
  function mountNewProducts() {
    (D.newProducts || []).forEach(function (it) {
      if (DB.byId[it.id]) return;
      DB.items.push(it); DB.byId[it.id] = it;
    });
  }
  function editProduct(id, key, value) {
    var p = P(id);
    if (!p) return { error: 'No such product.' };
    var r = GC.setField(p, key, value);
    if (r.error) return r;
    var e = D.productEdits[id] = D.productEdits[id] || {};
    Object.keys(r.patch).forEach(function (k) {
      if (k === 'extra') e.extra = Object.assign({}, e.extra, r.patch.extra); else e[k] = r.patch[k];
    });
    dropCache(id);
    log('product_edit', r.field.label + ': ' + (r.before == null ? 'blank' : String(r.before).slice(0, 40)) + ' → ' + (r.after == null ? 'cleared' : String(r.after).slice(0, 40)), { product: id });
    save();
    return r;
  }

  /* ---------------- editing and deleting clients and requirements ----------------

     Same shape as editProduct above: validate through core, apply, log what it was
     before, save. The log line carries the old value because "who changed the GSTIN"
     is only answerable if the answer says what it used to be. */

  function editCompany(id, key, value) {
    var c = companyById(id);
    if (!c) return { error: 'No such client.' };
    if (!canOpen(c)) return { error: 'This client belongs to somebody else.' };
    var r = GC.setOn(c, GC.companyFields(GC.T), key, value);
    if (r.error) return r;
    GC.applyOn(c, r.field, r.after);
    log('client_edit', r.field.label + ': ' +
        (r.before == null || r.before === '' ? 'blank' : String(r.before).slice(0, 40)) + ' → ' +
        (r.after == null || r.after === '' ? 'cleared' : String(r.after).slice(0, 40)),
        { company: id });
    save();
    return r;
  }

  function editOpp(id, key, value) {
    var o = D.opps.filter(function (x) { return x.id === id; })[0];
    if (!o) return { error: 'No such requirement.' };
    if (!canOpen(o)) return { error: 'This requirement belongs to somebody else.' };
    var r = GC.setOn(o, GC.oppFields(GC.T, contactsOf(o.company)), key, value);
    if (r.error) return r;
    var wasStage = o.stage;
    GC.applyOn(o, r.field, r.after);
    /* Moving to Won or Lost is an outcome, not just a label, and the rest of the
       cockpit reads `outcome`. Keep the two in step or a won deal stays in the pipeline. */
    if (key === 'stage') {
      if (r.after === 'Won') o.outcome = 'won';
      else if (r.after === 'Lost') o.outcome = 'lost';
      else o.outcome = null;
    }
    log('opp_edit', r.field.label + ': ' +
        (r.before == null || r.before === '' ? 'blank' : String(r.before).slice(0, 40)) + ' → ' +
        (r.after == null || r.after === '' ? 'cleared' : String(r.after).slice(0, 40)),
        { opp: id, company: o.company });
    if (key === 'stage' && wasStage !== r.after) log('stage', o.title + ': ' + wasStage + ' → ' + r.after, { opp: id, company: o.company });
    save();
    return r;
  }

  function deleteOpp(id) {
    var o = D.opps.filter(function (x) { return x.id === id; })[0];
    if (!o) return { error: 'No such requirement.' };
    if (!canOpen(o)) return { error: 'This requirement belongs to somebody else.' };
    var blockers = GC.oppDeleteBlockers(o, D.orders);
    if (blockers.length) return { error: 'Cannot delete: ' + blockers.join('; ') + '.' };
    D.opps = D.opps.filter(function (x) { return x.id !== id; });
    D.followups = (D.followups || []).filter(function (f) { return f.opp !== id; });
    /* A pending proposal about something that no longer exists is a trap for whoever
       opens the desk next. */
    D.proposals = (D.proposals || []).filter(function (pr) { return (pr.target || {}).id !== id; });
    log('opp_delete', 'Deleted requirement: ' + o.title, { company: o.company });
    save();
    return { ok: true, title: o.title };
  }

  function deleteCompany(id) {
    var c = D.companies.filter(function (x) { return x.id === id; })[0];
    if (!c) return { error: 'No such client.' };
    if (!canOpen(c)) return { error: 'This client belongs to somebody else.' };
    var blockers = GC.companyDeleteBlockers(c, D.opps, D.orders, D.issues);
    if (blockers.length) return { error: 'Cannot delete: ' + blockers.join('; ') + '.' };
    D.companies = D.companies.filter(function (x) { return x.id !== id; });
    D.opps = D.opps.filter(function (o) { return o.company !== id; });
    D.contacts = (D.contacts || []).filter(function (x) { return x.company !== id; });
    log('client_delete', 'Deleted client: ' + c.name, {});
    save();
    return { ok: true, name: c.name };
  }


  /* ================= people & access ================= */

  function me() { return D && D.session ? GC.staffById(D.session) : null; }
  function acc() { return GC.acc(me(), D.access); }
  function can(cap) { return !!acc()[cap]; }
  function roleName(id) {
    var r = (D.roles || []).filter(function (x) { return x.id === id; })[0];
    return (r && r.name) || (GC.T.roles[id] && GC.T.roles[id].label) || id;
  }
  function initials(n) { return String(n || '?').split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function avatar(uid, sm) {
    var u = GC.staffById(uid);
    return '<span class="av' + (sm ? ' sm' : '') + '" title="' + esc(u ? u.name : 'Unassigned') + '" style="background:hsl(' + Math.round(GC.hash01(uid || 'x') * 360) + ',40%,32%)">' + esc(u ? initials(u.name) : '—') + '</span>';
  }
  function inScope(row) { return GC.inScope(row, me(), D.access); }
  function canOpen(row) { return GC.canOpen(row, me(), D.access); }
  function mob(m) { return GC.maskMobile(m, me(), D.access); }
  function cost(v) { return GC.maskCost(v, me(), D.access); }

  /* ================= lookups ================= */

  function byId(list, id) { return (list || []).filter(function (x) { return x.id === id; })[0] || null; }
  function companyById(id) { return byId(D.companies, id); }
  function contactById(id) { return byId(D.contacts, id); }
  function oppById(id) { return byId(D.opps, id); }
  function orderById(id) { return byId(D.orders, id); }
  function contactsOf(coId) { return D.contacts.filter(function (c) { return c.company === coId; }); }
  function tierOf(co) { return GC.companyTier(co, D.orders, D.opps); }
  function tierPill(co) { var t = tierOf(co); return pill(t, GC.TIER_BAND[t]); }

  /* ================= activity log ================= */

  var KINDS = {
    product_edit: ['Catalogue', 'edit'], product_add: ['Catalogue', 'add'], intake: ['Catalogue', 'add'],
    company_add: ['Clients', 'add'], company_edit: ['Clients', 'edit'], contact_add: ['Clients', 'add'], msg: ['Clients', 'add'],
    opp_new: ['Sales', 'add'], opp_stage: ['Sales', 'edit'], opp_line: ['Sales', 'edit'], opp_won: ['Sales', 'win'], opp_lost: ['Sales', 'lose'],
    quote: ['Sales', 'add'], sample: ['Sales', 'edit'], follow: ['Follow-ups', 'add'], follow_done: ['Follow-ups', 'edit'],
    order_stage: ['Orders', 'edit'], order_edit: ['Orders', 'edit'], vpo: ['Orders', 'add'], dispatch: ['Orders', 'edit'], invoice: ['Orders', 'win'],
    rfq: ['Vendors', 'add'], award: ['Vendors', 'win'], vendor_edit: ['Vendors', 'edit'], stock: ['Stock', 'edit'],
    agent_run: ['Agents', 'add'], agent_ok: ['Agents', 'win'], agent_no: ['Agents', 'lose'], sent: ['Agents', 'add'],
    issue: ['Care', 'add'], issue_edit: ['Care', 'edit'],
    auto_save: ['Automations', 'add'], auto_toggle: ['Automations', 'edit'],
    settings: ['Team & settings', 'edit'], staff: ['Team & settings', 'edit'], target: ['Team & settings', 'edit']
  };
  var KIND_GROUPS = ['Agents', 'Sales', 'Clients', 'Orders', 'Vendors', 'Catalogue', 'Stock', 'Follow-ups', 'Care', 'Automations', 'Team & settings'];
  function log(kind, text, refs) {
    refs = refs || {};
    D.activity.unshift(Object.assign({ id: GC.uid('l'), at: new Date().toISOString(), by: D.session || refs.by || null, kind: kind, text: text }, refs));
    if (D.activity.length > 800) D.activity.length = 800;
  }

  /* ================= date window ================= */

  var RANGE = { key: 'month', from: '', to: '' };
  function range() { var d = GC.rangeDates(RANGE.key, RANGE.from, RANGE.to); return { key: RANGE.key, from: d[0], to: d[1] }; }
  function inRange(s) { return GC.inRange(s, range()); }
  function rangeBar(note) {
    var r = range();
    return '<div class="rangebar">' + GC.RANGES.map(function (x) {
      return '<button class="chip" data-act="setRange" data-id="' + x[0] + '" aria-pressed="' + (RANGE.key === x[0]) + '">' + x[1] + '</button>';
    }).join('') + (RANGE.key === 'custom' ? '<span class="rcustom"><input type="date" id="r-from" data-chg="rangeFrom" value="' + esc(r.from) + '"><span>to</span><input type="date" id="r-to" data-chg="rangeTo" value="' + esc(r.to) + '"></span>' : '') +
      '<span class="rnote">' + esc(note || GC.rangeLabel(r)) + '</span></div>';
  }

  /* ================= small renderers ================= */

  function pill(t, band) { return '<span class="pill ' + (band || '') + '">' + esc(t) + '</span>'; }
  function thumb(p, lg) {
    if (p && p.image) return '<img class="thumb' + (lg ? ' lg' : '') + '" src="' + p.image + '" alt="" style="object-fit:cover">';
    var hue = p ? p.hue : 260;
    var ch = p ? (p.category || '?').charAt(0) : '?';
    return '<span class="thumb' + (lg ? ' lg' : '') + '" style="background:linear-gradient(135deg,hsl(' + hue + ',38%,30%),hsl(' + ((hue + 40) % 360) + ',50%,34%))">' + esc(ch) + '</span>';
  }
  function kpis(list) {
    return '<div class="kpis">' + list.map(function (k) {
      return '<div class="kpi' + (k[2] ? ' ' + k[2] : '') + '"' + (k[4] ? ' data-act="go" data-id="' + esc(k[4]) + '"' : '') + ' title="' + esc(k[3] || '') + '"><b>' + k[0] + '</b><span>' + esc(k[1]) + '</span></div>';
    }).join('') + '</div>';
  }
  function conf(c) {
    var pc = Math.round((c || 0) * 100);
    return '<span class="conf">Confidence <span class="bar ' + (pc >= 80 ? 'ok' : pc >= 55 ? 'warn' : 'bad') + '"><i style="width:' + pc + '%"></i></span> ' + pc + '%</span>';
  }
  function stepsHTML(steps) {
    return '<ol class="steps">' + (steps || []).map(function (s) { return '<li><b>' + esc(s.t) + '</b><span>' + esc(s.d) + '</span></li>'; }).join('') + '</ol>';
  }
  function when(isoStr) {
    if (!isoStr) return '—';
    var d = String(isoStr).slice(0, 10), t = GC.today();
    var n = GC.daysBetween(d, t);
    if (n === 0) return 'today';
    if (n === 1) return 'yesterday';
    if (n === -1) return 'tomorrow';
    if (n > 1 && n < 8) return n + ' days ago';
    if (n < -1 && n > -8) return 'in ' + (-n) + ' days';
    return d;
  }
  /* dates the way people say them: 5 Nov 2026 */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function day(iso) { var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : String(iso || ''); }
  function deny(h, p) { return '<div class="deny"><h3>' + esc(h) + '</h3><p>' + esc(p) + '</p></div>'; }
  function empty(t) { return '<div class="empty">' + esc(t) + '</div>'; }

  /* ================= navigation ================= */

  /* Every screen with its gate. Labels are the words staff use. */
  var NAV = [
    ['home', 'My Day', 'house', null],
    ['pipeline', 'Enquiries', 'clipboard-list', 'clients'],
    ['orders', 'Orders', 'truck', 'orders'],
    ['companies', 'Clients', 'users', 'clients'],
    ['discover', 'Products', 'gift', null],
    ['vendors', 'Vendors', 'handshake', 'vendors'],
    ['stock', 'Stock', 'warehouse', null],
    ['issues', 'Client issues', 'triangle-alert', 'clients'],
    ['inbox', 'New messages', 'inbox', 'clients'],
    ['campaigns', 'Campaigns', 'megaphone', 'clients'],
    ['reports', 'Reports', 'chart-column', null],
    ['activity', 'Activity', 'activity', null],
    ['team', 'Team', 'users-round', 'reports'],
    ['targets', 'Targets', 'target', 'targets'],
    ['desk', 'Assistants', 'sparkles', null],
    ['automations', 'Automations', 'zap', 'automations'],
    ['settings', 'Settings', 'settings', 'settings']
  ];
  /* At most five in front, per role (working memory holds about four things).
     Everything else waits under "More". A custom role gets the first five it can reach. */
  var PRIMARY = {
    owner: ['home', 'pipeline', 'orders', 'companies', 'discover'],
    head: ['home', 'pipeline', 'orders', 'companies', 'discover'],
    am: ['home', 'pipeline', 'orders', 'companies', 'discover'],
    sourcing: ['home', 'vendors', 'discover', 'stock', 'orders'],
    ops: ['home', 'orders', 'stock', 'vendors', 'issues'],
    accounts: ['home', 'orders', 'companies', 'reports']
  };
  function navFor(a, role) {
    var vis = NAV.filter(function (n) { return !n[3] || a[n[3]]; });
    var want = PRIMARY[role] || vis.slice(0, 5).map(function (n) { return n[0]; });
    var pri = want.map(function (k) { return vis.filter(function (n) { return n[0] === k; })[0]; }).filter(Boolean).slice(0, 5);
    return { pri: pri, more: vis.filter(function (n) { return pri.indexOf(n) < 0; }) };
  }
  function ico(name) { return '<i data-lucide="' + name + '"></i>'; }

  /* screens that are not in the menu still carry a gate */
  var ROUTE_CAP = { product: null, company: 'clients', companynew: 'clients', opp: 'clients', oppnew: 'clients',
    order: 'orders', vendor: 'vendors', rfq: 'vendors', intake: 'catalogue', automation: 'automations', issue: 'clients',
    person: 'reports', proposal: null, run: null };
  NAV.forEach(function (n) { ROUTE_CAP[n[0]] = n[3]; });

  var LABELS = { home: 'My Day', desk: 'the Agent Desk', inbox: 'the Inbox', discover: 'Discover', pipeline: 'the Pipeline',
    companies: 'Clients', company: 'the client', companynew: 'Add a client', campaigns: 'Campaigns', opp: 'the enquiry',
    oppnew: 'New requirement', orders: 'Orders', order: 'the order', vendors: 'Vendors', vendor: 'a vendor', rfq: 'an RFQ',
    intake: 'Price-list intake', stock: 'Stock', issues: 'Client issues', issue: 'an issue', automations: 'Automations',
    automation: 'a rule', reports: 'Reports', targets: 'Targets', activity: 'Activity', team: 'Team', person: 'a colleague',
    settings: 'Settings', product: 'the product', proposal: 'a proposal', run: 'an agent run' };

  function badge(route) {
    if (route === 'desk') { var n = pending().length; return n ? '<em class="agent">' + n + '</em>' : ''; }
    if (route === 'inbox') { var m = D.messages.filter(function (x) { return x.status === 'pending'; }).length; return m ? '<em>' + m + '</em>' : ''; }
    if (route === 'issues') { var i = D.issues.filter(function (x) { return x.status !== 'resolved'; }).length; return i ? '<em>' + i + '</em>' : ''; }
    return '';
  }
  function pending() {
    var u = me();
    return D.proposals.filter(function (p) {
      if (p.status !== 'pending') return false;
      if (!u) return false;
      if (acc().scope === 'own' && p.owner && p.owner !== u.id) return false;
      return true;
    });
  }

  var MORE_OPEN = (function () { try { return localStorage.getItem('gc_more') === '1'; } catch (e) { return false; } })();
  function paintChrome(route) {
    var u = me(), a = acc(), nv = navFor(a, u.role);
    var link = function (n, cls) { return '<a href="#/' + n[0] + '" class="' + cls + (n[0] === route ? ' on' : '') + '">' + ico(n[2]) + '<span>' + esc(n[1]) + '</span>' + badge(n[0]) + '</a>'; };
    var inMore = nv.more.some(function (n) { return n[0] === route; });
    var open = MORE_OPEN || inMore;
    var h = '<div class="brandmark"><span class="m">' + esc(GC.T.logoText.charAt(0)) + '</span><span><b>' + esc(GC.T.name) + '</b><small>' + esc(roleName(u.role)) + '</small></span></div>';
    h += nv.pri.map(function (n) { return link(n, 'pri'); }).join('');
    if (nv.more.length) {
      h += '<button class="morebtn" data-act="toggleMore" aria-expanded="' + open + '">' + ico('chevron-down') + 'More</button>';
      h += '<div class="moreg"' + (open ? '' : ' hidden') + '>' + nv.more.map(function (n) { return link(n, ''); }).join('') + '</div>';
    }
    $('#side').innerHTML = say(h);
    $('#uchip').innerHTML = avatar(u.id, true) + '<span style="text-align:left"><b>' + esc(u.name) + '</b><span class="r">' + esc(roleName(u.role)) + '</span></span>';
    var ta = $('#topacts');
    if (ta) ta.innerHTML = (a.clients ? '<a class="btn" href="#/oppnew">' + ico('plus') + '<span class="hideph">New enquiry</span></a>' : '') +
      (u.role === 'owner' ? ' <span class="demo-pill hideph">Sample data</span><button class="btn ghost sm hideph" data-act="stories">Guided stories</button>' : '');
    var tb = $('#themebtn'); if (tb) tb.innerHTML = ico(theme() === 'dark' ? 'sun' : 'moon');
    var tabs = nv.pri.slice(0, 4);
    $('#tabbar').innerHTML = say(tabs.map(function (t) {
      return '<a href="#/' + t[0] + '" class="' + (t[0] === route ? 'on' : '') + '">' + ico(t[2]) + esc(t[1].replace('Client issues', 'Issues')) + '</a>';
    }).join('') + '<button data-act="toggleSide">' + ico('menu') + 'More</button>');
  }

  /* ---- one word per thing: the tenant glossary, applied to rendered text only ----
     ponytail: a string pass over the rendered HTML instead of editing ~300 strings in
     31 screens. Skips tags (so attributes and ids never change) and <textarea> bodies
     (so what someone typed is saved as typed). New screens inherit it for free. */
  var SAY = null;
  function sayRules() {
    if (SAY && SAY.src === GC.T.words) return SAY.list;
    var list = (GC.T.words || []).map(function (w) {
      var acro = /^[A-Z0-9-]+$/.test(w[0].replace(/\s/g, ''));
      var pat = w[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var wordy = /^[A-Za-z0-9]/.test(w[0]);
      return { re: new RegExp((wordy ? '(^|[^A-Za-z0-9])(' : '()(') + pat + ')' + (wordy ? '(?![A-Za-z0-9])' : ''), acro ? 'g' : 'gi'), to: w[1], acro: acro };
    });
    SAY = { src: GC.T.words, list: list };
    return list;
  }
  function sayText(t) {
    var rules = sayRules();
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      t = t.replace(r.re, function (m, pre, hit, off, whole) {
        var to = r.to;
        var first = r.acro ? (/^\s*$/.test(whole.slice(0, off) + pre)) : /^[A-Z]/.test(hit);
        to = first ? to.charAt(0).toUpperCase() + to.slice(1) : (r.acro ? to : to.charAt(0).toLowerCase() + to.slice(1));
        return pre + to;
      });
    }
    return t;
  }
  function say(html) {
    if (!GC.T.words) return html;
    /* a lone dash standing for "nothing here" becomes a word (rule: say it, don't dash it) */
    return String(html).split(/(<textarea[\s\S]*?<\/textarea>|<[^>]*>)/).map(function (seg, i) {
      if (i % 2) return seg;
      if (/^\s*—\s*$/.test(seg)) return seg.replace('—', 'None');
      return sayText(seg.replace(/^(\s*)—\s+/, '$1· ').replace(/(:\s*)—(?=\s|$)/g, '$1not given'));
    }).join('');
  }

  function theme() { try { return localStorage.getItem('gc_theme') || 'light'; } catch (e) { return 'light'; } }
  function icons() { try { if (window.lucide && document.querySelector('i[data-lucide]')) window.lucide.createIcons(); } catch (e) {} }

  /* ================= render ================= */

  var HIST = [], LAST = null;
  var FOCUS_BY = ['id', 'data-input', 'data-chg', 'name', 'data-field'];
  function focusState() {
    var a = document.activeElement;
    if (!a || !a.getAttribute || a === document.body) return null;
    for (var i = 0; i < FOCUS_BY.length; i++) {
      var v = a.getAttribute(FOCUS_BY[i]);
      if (v) { var st = { sel: '[' + FOCUS_BY[i] + '="' + v.replace(/"/g, '\\"') + '"]' }; try { st.s = a.selectionStart; st.e = a.selectionEnd; } catch (e) {} return st; }
    }
    return null;
  }
  function restoreFocus(st) {
    if (!st) return;
    var n = null; try { n = document.querySelector(st.sel); } catch (e) {}
    if (!n || !n.focus) return;
    n.focus();
    if (st.s != null) try { n.setSelectionRange(st.s, st.e); } catch (e) {}
  }

  function render() {
    if (!D.session || !me()) { D.session = null; paintLogin(); $('#login').hidden = false; $('#app').hidden = true; return; }
    $('#login').hidden = true; $('#app').hidden = false;
    var hash = location.hash || '#/home';
    var same = hash === LAST, y = window.scrollY || 0, f = same ? focusState() : null;
    LAST = hash;
    var parts = hash.replace(/^#\/?/, '').split('/');
    var route = parts[0] || 'home', arg = decodeURIComponent(parts.slice(1).join('/'));
    paintChrome(route);
    if (HIST[HIST.length - 1] !== hash) { HIST.push(hash); if (HIST.length > 60) HIST.shift(); }
    $('#backwrap').innerHTML = say(backBar(route));
    var view = VIEWS[route];
    if (!view) { $('#shell').innerHTML = deny('That screen does not exist.', 'Pick something from the menu.'); return; }
    var gate = ROUTE_CAP[route];
    if (gate && !can(gate)) {
      $('#shell').innerHTML = deny('Not in your view', 'This screen is switched off for ' + roleName(me().role).toLowerCase() + '. The owner can switch it on in Settings, under Roles and access.');
      return;
    }
    try { $('#shell').innerHTML = say(view(arg)); }
    catch (e) { $('#shell').innerHTML = crashCard(e, route); if (window.console) console.error(e); }
    if (same) { window.scrollTo(0, y); restoreFocus(f); } else window.scrollTo(0, 0);
    $('#side').classList.remove('open');
    /* the entrance plays on a real route change only, never on a re-render while typing */
    var sh = $('#shell');
    if (!same && sh.classList) { sh.classList.remove('enter'); void sh.offsetWidth; sh.classList.add('enter'); }
    icons();
  }
  function backBar(route) {
    if (route === 'home') return '';
    var to = HIST.length > 1 ? HIST[HIST.length - 2] : '#/home';
    var r = to.replace(/^#\/?/, '').split('/')[0] || 'home';
    return '<div class="backbar"><button class="backbtn" data-act="goBack"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>Back to ' + esc(LABELS[r] || r) + '</button></div>';
  }
  function crashCard(e, route) {
    var st = String((e && e.stack) || ''), m = st.match(/(\w+\.js)[^:]*:(\d+):\d+/);
    return '<div class="deny"><h3>The ' + esc(route) + ' screen hit a problem</h3><p><b style="color:var(--bad)">' + esc(String(e && e.message || e)) + '</b>' +
      (m ? '<br><span class="dim">in ' + esc(m[1] + ' line ' + m[2]) + '</span>' : '') + '</p>' +
      '<p style="margin-top:14px">Almost always a stale cached file, or saved data from an older build.</p>' +
      '<p style="margin-top:16px"><button class="btn" data-act="hardReload">Reload everything fresh</button> <button class="btn ghost" data-act="resetDemo">Reset the demo data</button></p>' +
      '<details style="margin-top:16px;text-align:left"><summary class="dim small" style="cursor:pointer">Technical detail</summary><pre style="white-space:pre-wrap;font-size:11px;color:var(--muted)">' + esc(st.split('\n').slice(0, 6).join('\n')) + '</pre></details></div>';
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  var TT = null, UNDO = null;
  /* Every change answers at once. When the change can be taken back, the toast carries Undo. */
  function toast(msg, kind, undo) {
    var t = $('#toast');
    UNDO = undo || null;
    t.innerHTML = '<span>' + esc(sayText(String(msg))) + '</span>' + (UNDO ? '<button class="undo" data-act="undo">Undo</button>' : '');
    t.hidden = false; t.className = kind && kind !== 'ok' ? kind : '';
    clearTimeout(TT); TT = setTimeout(function () { t.hidden = true; UNDO = null; }, UNDO ? 6000 : kind === 'agent' ? 4800 : 3400);
  }
  function modal(title, sub, body, wide) {
    $('#m-title').textContent = sayText(title); $('#m-sub').textContent = sayText(sub || ''); $('#m-body').innerHTML = say(body);
    var m = $('#modal'); m.className = wide ? 'wide' : '';
    if (!m.open) { try { m.showModal(); } catch (e) { m.setAttribute('open', ''); } }
    icons();
  }
  /* Runs one action. If it changed the data and said nothing, it says "Saved" with Undo;
     if it toasted on its own, Undo is added to that toast. Undo puts the data back as it was. */
  var QUIET = { showAllToday: 1, undo: 1, toggleSide: 1, toggleMore: 1, toggleTheme: 1, gsearch: 1, go: 1, goBack: 1, closeModal: 1, scoreLive: 1, quickLogin: 1, signOut: 1, switchUser: 1, becomeUser: 1, story: 1, stories: 1, hardReload: 1, resetDemo: 1 };
  function runAct(name, args) {
    var fn = ACTIONS[name]; if (!fn) return;
    if (QUIET[name] || !D || !D.session) return fn.apply(null, args);
    var before = JSON.stringify(D), seen = TOASTS;
    var out = fn.apply(null, args);
    var changed = D && JSON.stringify(D) !== before;
    if (!changed) return out;
    var back = function () { var sess = D.session; D = JSON.parse(before); D.session = sess; applyTenant(); dropCache(); rebuildIndex(); save(); render(); toast('Undone.'); };
    if (TOASTS === seen) toast('Saved.', null, back);
    else if (!/^bad$/.test($('#toast').className)) { UNDO = back; var t = $('#toast'); if (t.innerHTML.indexOf('class="undo"') < 0) t.innerHTML += '<button class="undo" data-act="undo">Undo</button>'; clearTimeout(TT); TT = setTimeout(function () { t.hidden = true; UNDO = null; }, 6000); }
    return out;
  }
  var TOASTS = 0;
  var _toast = toast;
  toast = function (m, k, u) { TOASTS++; return _toast(m, k, u); };
  /* a small moment when an order is won (Peak-End). Skipped under reduced motion. */
  function celebrate() {
    try {
      if (!document.body || !document.body.appendChild || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      var cols = ['#3D2F86', '#6A45C9', '#C6F432', '#B7AEF0'];
      for (var i = 0; i < 22; i++) {
        var c = document.createElement('i'); c.className = 'confetti';
        var ang = Math.random() * Math.PI * 2, dist = 80 + Math.random() * 160;
        c.style.background = cols[i % cols.length];
        c.style.setProperty('--x', Math.round(Math.cos(ang) * dist) + 'px'); c.style.setProperty('--y', Math.round(Math.sin(ang) * dist - 40) + 'px'); c.style.setProperty('--r', Math.round(Math.random() * 540) + 'deg');
        document.body.appendChild(c); setTimeout(function (n) { return function () { n.remove(); }; }(c), 700);
      }
    } catch (e) {}
  }
  /* in place of the browser's grey prompt box */
  var ASKCB = null;
  function ask(title, hint, cb) {
    ASKCB = cb;
    modal(title, hint || '', '<form data-submit="askDone">' + field('Your answer', '<textarea name="text" required style="min-height:110px"></textarea>') + '<div class="row"><button class="btn">Save</button><button type="button" class="btn ghost" data-act="closeModal">Cancel</button></div></form>');
  }
  function closeModal() { var m = $('#modal'); if (m.open) { try { m.close(); } catch (e) { m.removeAttribute('open'); } } }

  /* ================= global search: one box, like Google ================= */

  function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9₹ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  /* a word matches if it is inside the text, or one typo away from a word in it */
  function near(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, miss = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++miss > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return miss + (a.length - i) + (b.length - j) <= 1;
  }
  function hits(q, text) {
    var h = norm(text), words = h.split(' ');
    return norm(q).split(' ').filter(Boolean).every(function (w) {
      return h.indexOf(w) >= 0 || (w.length >= 4 && words.some(function (x) { return near(w, x.slice(0, w.length + 1)) || near(w, x); }));
    });
  }
  function searchAll(q) {
    var out = [];
    if (!q || norm(q).length < 2) return out;
    var a = acc();
    if (a.clients) {
      D.companies.filter(inScope).filter(function (c) { return hits(q, c.name + ' ' + (c.city || '')); }).slice(0, 4)
        .forEach(function (c) { out.push(['Clients', c.name, c.city || '', '#/company/' + c.id]); });
      D.opps.filter(inScope).filter(function (o) { var co = companyById(o.company); return hits(q, o.title + ' ' + (co ? co.name : '')); }).slice(0, 4)
        .forEach(function (o) { var co = companyById(o.company); out.push(['Enquiries', o.title, (co ? co.name : '') + ' · ' + o.stage, '#/opp/' + o.id]); });
    }
    if (a.orders) D.orders.filter(inScope).filter(function (o) { var co = companyById(o.company); return hits(q, o.no + ' ' + (co ? co.name : '') + ' ' + (o.po || '')); }).slice(0, 4)
      .forEach(function (o) { var co = companyById(o.company); out.push(['Orders', o.no + ' · ' + (co ? co.name : ''), o.stage, '#/order/' + o.id]); });
    var n = 0, nq = norm(q);
    for (var i = 0; i < DB.items.length && n < 5; i++) { var it = DB.items[i]; if (norm(it.name).indexOf(nq) >= 0) { out.push(['Products', it.name, '', '#/product/' + it.id]); n++; } }
    return out;
  }
  function searchPaint(q) {
    var box = document.getElementById('gres'); if (!box) return;
    var r = searchAll(q);
    if (!q || norm(q).length < 2) { box.hidden = true; return; }
    var last = '', h = '';
    r.forEach(function (x) { if (x[0] !== last) { h += '<div class="gh">' + esc(x[0]) + '</div>'; last = x[0]; } h += '<a href="' + esc(x[3]) + '"><span>' + esc(x[1]) + '</span><small>' + esc(x[2]) + '</small></a>'; });
    box.innerHTML = h || '<div class="empty">Nothing found for "' + esc(q) + '". Check the spelling, or try one word.</div>';
    box.hidden = false;
  }
  function closeSearch() { var b = document.getElementById('gres'); if (b) b.hidden = true; }

  /* ================= login ================= */

  function paintLogin() {
    $('#l-logo').textContent = GC.T.logoText;
    $('#l-sub').textContent = GC.T.name + ' · Agentic Cockpit';
    $('#l-quick').innerHTML = D.staff.map(function (u) {
      return '<button class="chip" data-act="quickLogin" data-id="' + esc(u.id) + '">' + esc(u.name.split(' ')[0]) + ' · ' + esc(roleName(u.role)) + '</button>';
    }).join('');
  }
  function signIn(u) {
    D.session = u.id; save();
    if (window.GE.afterLogin) window.GE.afterLogin();
    location.hash = '#/home'; render();
  }

  /* ================= MY DAY: one prioritised list, for every role =================
     The first screen answers one question: what do I do next? One sentence, at most
     four numbers, then ONE list in priority order, each row with one verb. */

  VIEWS.home = function () {
    var u = me(), a = acc(), first = u.name.split(' ')[0], t = GC.today();
    var hr = new Date().getHours();
    var mine = D.opps.filter(function (o) { return GC.isOpen(o) && inScope(o); });
    var myF = GC.openFollows(D.followups).filter(function (f) { return f.owner === u.id; });
    var dueF = myF.filter(function (f) { return GC.isOverdue(f) || GC.isDueToday(f); })
      .sort(function (x, y) { return String(x.due).localeCompare(String(y.due)); });
    var openOrders = D.orders.filter(function (o) { return GC.orderOpen(o) && inScope(o); });
    var risky = a.orders ? openOrders.filter(function (o) { return GC.orderRisks(o).some(function (x) { return x.sev === 'bad'; }); }) : [];
    var ok = pending();
    var msgs = a.clients ? D.messages.filter(function (m) { return m.status === 'pending'; }) : [];
    var quiet = a.clients ? GC.needsAttention(mine, D.followups).slice(0, 6) : [];

    /* the list, most urgent kind first */
    var rows = [];
    ok.forEach(function (p) {
      var ag = (window.AG && AG.agentById(p.agent)) || { name: 'Assistant' };
      rows.push(['k-ok', 'Needs your OK · ' + ag.name, p.title || p.summary, p.summary && p.title ? p.summary : '', '<a class="btn sm verb" href="#/proposal/' + esc(p.id) + '">Review</a>']);
    });
    dueF.forEach(function (f) {
      var co = companyById(f.company), o = oppById(f.opp), late = GC.isOverdue(f);
      rows.push([late ? 'k-late' : '', late ? 'Call back · was due ' + when(f.due) : 'Call back today', (co ? co.name : 'Client') + (o ? ' · ' + o.title : ''), (f.note || 'Follow up') + ' · ' + f.method,
        (o ? '<button class="btn sm verb" data-act="logFollow" data-id="' + esc(o.id) + '">Log follow-up</button> ' : '') + '<button class="minibtn verb" data-act="doneFollow" data-id="' + esc(f.id) + '">Done</button>']);
    });
    risky.forEach(function (o) {
      var r = GC.orderRisks(o)[0], co = companyById(o.company);
      rows.push(['k-late', 'Order may miss its date', o.no + ' · ' + (co ? co.name : ''), r.text, '<a class="btn sm verb" href="#/order/' + esc(o.id) + '">Open order</a>']);
    });
    msgs.forEach(function (m) {
      rows.push(['', 'New message · ' + (m.channel || 'message'), (m.from && (m.from.name || m.from.email || m.from.mobile)) || 'Someone', String(m.text || '').slice(0, 90), '<a class="btn sm verb" href="#/inbox">Read</a>']);
    });
    quiet.forEach(function (o) {
      var co = companyById(o.company);
      rows.push(['', 'Nothing booked yet', o.title, (co ? co.name : '') + ' · ' + o.stage + ' · last touched ' + when(o.updated), '<a class="btn ghost sm verb" href="#/opp/' + esc(o.id) + '">Book follow-up</a>']);
    });

    /* what got done today, so the list feels finishable */
    var doneToday = D.followups.filter(function (f) { return f.done && f.done_at === t && (f.by || f.owner) === u.id && !f.auto; }).length +
      D.proposals.filter(function (p) { return p.decided === t && p.decidedBy === u.id; }).length;
    var urgent = rows.filter(function (r) { return r[0]; }).length;
    var total = doneToday + rows.length;

    var mb = (u.role === 'owner' || u.role === 'head' || a.reports) && window.GE.morningBrief ? window.GE.morningBrief() : null;
    var lead = !rows.length ? 'Nothing is waiting for you.'
      : (rows.length === 1 ? '1 thing needs you today' : rows.length + ' things need you today') + (urgent ? ', ' + urgent + ' of them first.' : '.');

    var h = '<div class="myday"><div class="ph" style="align-items:flex-start"><div><h1 class="hello">Good ' + (hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening') + ', <em>' + esc(first) + '</em></h1>' +
      '<p class="lead">' + esc(lead) + (mb && mb.payload && mb.payload.one ? ' <span class="muted">' + esc(mb.payload.one) + '</span>' : '') + '</p></div></div>';

    /* at most four numbers, chosen for the role, each opening the list behind it */
    var K = {
      opps: function () { return [mine.length, a.scope === 'own' ? 'Your open enquiries' : 'Open enquiries', null, '', '#/pipeline']; },
      value: function () { return [money(mine.reduce(function (s, o) { return s + GC.oppValue(o, P); }, 0)), 'Enquiry value', null, '', '#/pipeline']; },
      follow: function () { var late = myF.filter(GC.isOverdue).length; return [myF.length, 'Your follow-ups', late ? 'warn' : null, late ? late + ' overdue' : '', null]; },
      orders: function () { return [openOrders.length, 'Orders in progress', null, '', '#/orders']; },
      risk: function () { return [risky.length, 'Orders at risk', risky.length ? 'bad' : 'ok', '', '#/orders']; },
      unpaid: function () { var un = D.orders.filter(function (o) { return o.invoice && !o.paid; }); return [money(un.reduce(function (s, o) { return s + (o.invoice.amount || o.value); }, 0)), 'Invoiced, not paid', un.length ? 'warn' : null, un.length + ' invoice' + (un.length === 1 ? '' : 's'), '#/orders']; },
      rfq: function () { return [D.rfqs.filter(function (r) { return r.status === 'open'; }).length, 'Open price requests', null, '', '#/vendors']; },
      issues: function () { return [D.issues.filter(function (x) { return x.status !== 'resolved'; }).length, 'Open client issues', null, '', '#/issues']; },
      ok: function () { return [ok.length, 'Needs your OK', ok.length ? 'warn' : 'ok', '', '#/desk']; }
    };
    var PICK = { owner: ['value', 'opps', 'risk', 'unpaid'], head: ['value', 'opps', 'follow', 'risk'], am: ['opps', 'follow', 'orders', 'ok'],
      sourcing: ['rfq', 'orders', 'risk', 'ok'], ops: ['orders', 'risk', 'issues', 'ok'], accounts: ['unpaid', 'orders', 'risk', 'ok'] };
    var need = { opps: 'clients', value: 'clients', follow: 'clients', orders: 'orders', risk: 'orders', unpaid: 'money', rfq: 'vendors', issues: 'clients' };
    var keys = (PICK[u.role] || ['opps', 'orders', 'risk', 'ok']).filter(function (k) { return !need[k] || a[need[k]]; }).slice(0, 4);
    h += kpis(keys.map(function (k) { return K[k](); }));

    if (rows.length) {
      var pc = total ? Math.round(100 * doneToday / total) : 0;
      h += '<div class="progress"><span><b style="color:var(--ink)">' + doneToday + ' of ' + total + '</b> done today</span><span class="track" aria-hidden="true"><i style="width:' + pc + '%"></i></span></div>';
      var SHOW = 7;
      h += '<div class="card pad0 todo">' + rows.map(function (r, i) {
        return '<div class="item ' + r[0] + '"' + (i >= SHOW ? ' data-more hidden' : '') + '><div class="grow"><span class="kind">' + esc(r[1]) + '</span><h4>' + esc(r[2]) + '</h4>' + (r[3] ? '<p>' + esc(r[3]) + '</p>' : '') + '</div><span class="row" style="flex-wrap:nowrap">' + r[4] + '</span></div>';
      }).join('') + (rows.length > SHOW ? '<div class="item" style="justify-content:center"><button class="btn ghost sm" data-act="showAllToday">Show all ' + rows.length + '</button></div>' : '') + '</div>';
    } else {
      h += '<div class="card allclear" style="margin-top:18px"><b>All clear. Nice work.</b><p class="muted">' +
        (a.clients ? 'A good use of the quiet: <a href="#/oppnew" style="color:var(--brand-ink);font-weight:600">log a new enquiry</a> or call a client you have not spoken to this month.' : 'Check <a href="#/orders" style="color:var(--brand-ink);font-weight:600">Orders</a> for anything coming up this week.') + '</p></div>';
    }
    return h + '</div>';
  };
  ACTIONS.showAllToday = function () { Array.prototype.forEach.call(document.querySelectorAll('.todo [data-more]'), function (n) { n.hidden = false; }); var b = document.querySelector('[data-act="showAllToday"]'); if (b) b.parentNode.remove(); };

  /* ================= TEAM ================= */

  VIEWS.team = function () {
    var r = range();
    var h = '<div class="ph"><div><h1>Team</h1><p>What each person is carrying, for the window below.</p></div></div>' + rangeBar();
    h += '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Person</th><th>Role</th><th class="num">Open reqs</th><th class="num">Orders won</th><th class="num">Value</th><th>Target</th><th class="num">Follow-ups</th><th class="num">Note score</th></tr></thead><tbody>' +
      D.staff.map(function (u) {
        var open = D.opps.filter(function (o) { return o.assigned_to === u.id && GC.isOpen(o); }).length;
        var tp = GC.targetProgress(D.orders, u.id, D.targets[u.id], r);
        var fu = D.followups.filter(function (f) { return f.owner === u.id && !f.done; }).length;
        var ns = GC.noteAverage(D.followups.filter(function (f) { return inRange(f.done_at); }), u.id);
        return '<tr data-act="go" data-id="#/person/' + esc(u.id) + '"><td><div class="row">' + avatar(u.id, true) + '<b>' + esc(u.name) + '</b></div></td><td>' + esc(roleName(u.role)) + '</td>' +
          '<td class="num">' + open + '</td><td class="num">' + tp.orders + '</td><td class="num">' + money(tp.value) + '</td>' +
          '<td>' + (D.targets[u.id] ? (tp.tooShort ? '<span class="dim small">window too short</span>' : '<span class="bar ' + GC.band(tp.valuePct) + '"><i style="width:' + Math.min(100, tp.valuePct || 0) + '%"></i></span> ' + (tp.valuePct == null ? '—' : tp.valuePct + '%')) : '<span class="dim">—</span>') + '</td>' +
          '<td class="num">' + fu + '</td><td class="num">' + (ns == null ? '—' : ns + '/10') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    return h;
  };
  VIEWS.person = function (id) {
    var u = GC.staffById(id);
    if (!u) return deny('No such person.', '');
    var r = range();
    var tp = GC.targetProgress(D.orders, u.id, D.targets[u.id], r);
    var mineOpps = D.opps.filter(function (o) { return o.assigned_to === u.id && GC.isOpen(o); });
    var done = D.followups.filter(function (f) { return (f.by || f.owner) === u.id && f.done && f.note && !f.auto; }).slice(0, 8);
    var h = '<div class="ph"><div class="row">' + avatar(u.id) + '<div><h1>' + esc(u.name) + '</h1><p>' + esc(roleName(u.role)) + ' · ' + esc(GC.branchName(D.branches, u.branch)) + ' · joined ' + esc(u.joined || '—') + '</p></div></div></div>' + rangeBar();
    h += kpis([[mineOpps.length, 'Open requirements'], [tp.orders, 'Orders won'], [money(tp.value), 'Order value'],
               [tp.valuePct == null ? '—' : tp.valuePct + '%', 'Of target', GC.band(tp.valuePct)]]);
    h += '<p class="eyebrow">Recent conversation notes, scored</p><div class="card pad0">' + (done.length ? done.map(function (f) {
      var s = GC.scoreNote(f.note, { outcome: f.outcome });
      return '<div class="item"><span class="sev ' + s.band + '"></span><div class="grow"><h4>' + esc(f.note) + '</h4><p>' + esc(f.done_at || '') + ' · ' + esc(f.outcome || 'no outcome') + '</p></div>' + pill(s.score + '/10', s.band) + '</div>';
    }).join('') : empty('No notes logged yet.')) + '</div>';
    return h;
  };

  /* ================= ACTIVITY ================= */

  var AF = { who: '', area: '' };
  VIEWS.activity = function () {
    var all = can('reports');
    var rows = D.activity.filter(function (x) {
      if (!all && x.by !== D.session) return false;
      if (AF.who && x.by !== AF.who) return false;
      if (AF.area && (KINDS[x.kind] || ['Other'])[0] !== AF.area) return false;
      return inRange(x.at);
    });
    var h = '<div class="ph"><div><h1>Activity</h1><p>' + (all ? 'Everything anybody did, and what the agents did.' : 'Everything you did.') + '</p></div>' +
      (can('exportData') ? '<div class="acts"><button class="btn ghost" data-act="exportActivity">Export CSV</button></div>' : '') + '</div>' + rangeBar();
    h += '<div class="row" style="margin-bottom:12px">' + (all ? '<select data-chg="afWho" style="width:auto"><option value="">Everyone</option>' + D.staff.map(function (u) { return '<option value="' + u.id + '"' + (AF.who === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>' : '') +
      '<select data-chg="afArea" style="width:auto"><option value="">Every area</option>' + KIND_GROUPS.map(function (g) { return '<option' + (AF.area === g ? ' selected' : '') + '>' + g + '</option>'; }).join('') + '</select><span class="muted small">' + rows.length + ' entries</span></div>';
    var byDay = {};
    rows.slice(0, 300).forEach(function (x) { var d = String(x.at).slice(0, 10); (byDay[d] = byDay[d] || []).push(x); });
    var days = Object.keys(byDay).sort().reverse();
    if (!days.length) return h + '<div class="card">' + empty('Nothing in this window.') + '</div>';
    days.forEach(function (d) {
      h += '<p class="eyebrow">' + esc(when(d)) + (when(d) !== d ? ' · ' + d : '') + '</p><div class="card pad0">' + byDay[d].map(function (x) {
        var link = x.opp ? '#/opp/' + x.opp : x.order ? '#/order/' + x.order : x.company ? '#/company/' + x.company : x.product ? '#/product/' + x.product : x.proposal ? '#/desk' : '';
        var agent = (KINDS[x.kind] || [])[0] === 'Agents';
        return '<div class="item"' + (link ? ' data-act="go" data-id="' + esc(link) + '" style="cursor:pointer"' : '') + '>' + (agent && !x.by ? '<span class="thumb" style="width:24px;height:24px;background:var(--agent);font-size:12px">✦</span>' : avatar(x.by, true)) +
          '<div class="grow"><h4 style="font-weight:500">' + esc(x.text) + '</h4><p>' + esc(x.by ? GC.staffName(x.by) : 'Agent') + ' · ' + esc(String(x.at).slice(11, 16)) + ' · ' + esc((KINDS[x.kind] || ['Other'])[0]) + '</p></div></div>';
      }).join('') + '</div>';
    });
    return h;
  };

  /* ================= TARGETS ================= */

  VIEWS.targets = function () {
    var h = '<div class="ph"><div><h1>Targets</h1><p>Monthly order count and value per person. Progress pro-rates to the window you pick.</p></div></div>' + rangeBar();
    var r = range();
    h += '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Person</th><th>Orders / month</th><th>Value / month (₹)</th><th>Progress in window</th></tr></thead><tbody>' +
      D.staff.filter(function (u) { return ['am', 'head', 'owner'].indexOf(u.role) >= 0; }).map(function (u) {
        var t = D.targets[u.id] || { orders: 0, value: 0 };
        var tp = GC.targetProgress(D.orders, u.id, t, r);
        return '<tr><td><div class="row">' + avatar(u.id, true) + '<b>' + esc(u.name) + '</b></div></td>' +
          '<td><input type="number" min="0" style="width:90px" data-chg="setTarget" data-id="' + u.id + '|orders" value="' + (t.orders || 0) + '"></td>' +
          '<td><input type="number" min="0" step="50000" style="width:140px" data-chg="setTarget" data-id="' + u.id + '|value" value="' + (t.value || 0) + '"></td>' +
          '<td>' + (tp.tooShort ? '<span class="dim small">Window too short to judge</span>' : tp.orders + ' of ' + tp.targetOrders + ' orders · ' + money(tp.value) + ' of ' + money(tp.targetValue) + ' <span class="pill ' + GC.band(tp.valuePct) + '">' + (tp.valuePct == null ? '—' : tp.valuePct + '%') + '</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="honest">Targets are sample figures. The owner sets real ones here.</p>';
    return h;
  };

  /* ================= REPORTS ================= */

  VIEWS.reports = function () {
    var all = can('reports'), u = me();
    var sc = function (o) { return all || o.assigned_to === u.id; };
    var ords = D.orders.filter(function (o) { return sc(o) && inRange(o.created); });
    var opps = D.opps.filter(function (o) { return sc(o) && inRange(o.created); });
    var won = opps.filter(function (o) { return o.outcome === 'won'; }).length, lost = opps.filter(function (o) { return o.outcome === 'lost'; });
    var value = ords.reduce(function (a, o) { return a + o.value; }, 0);
    var marg = ords.reduce(function (a, o) { return a + (o.value / 1.18 - o.cost); }, 0);
    var h = '<div class="ph"><div><h1>Reports</h1><p>' + (all ? 'The whole business' : 'Your own numbers') + ' for the window below.</p></div></div>' + rangeBar();
    var k = [[ords.length, 'Orders'], [money(value), 'Order value (incl. GST)'], [opps.length, 'New requirements'],
             [opps.length ? Math.round(100 * won / opps.length) + '%' : '—', 'Won']];
    if (can('cost')) k.push([money(marg), 'Gross margin (ex GST)', null, 'Order value less GST less vendor cost.']);
    var runs = D.runs.filter(function (x) { return inRange(x.at) && x.status !== 'rejected'; });
    k.push([Math.round(runs.reduce(function (a, x) { return a + (x.minutes || 0); }, 0) / 60) + ' h', 'Saved by agents (est.)', null, 'Sum of each agent\'s estimated manual minutes, approved runs only.']);
    h += kpis(k);

    var bySrc = {};
    opps.forEach(function (o) { var s = GC.T.sources[o.source] || o.source; bySrc[s] = bySrc[s] || { n: 0, won: 0, v: 0 }; bySrc[s].n++; if (o.outcome === 'won') { bySrc[s].won++; var od = orderById(o.order); bySrc[s].v += od ? od.value : 0; } });
    h += '<div class="grid2" style="margin-top:18px"><div class="card pad0"><div class="hd"><h3>Where requirements come from</h3></div><table class="tbl"><thead><tr><th>Source</th><th class="num">Reqs</th><th class="num">Won</th><th class="num">Value</th></tr></thead><tbody>' +
      (Object.keys(bySrc).length ? Object.keys(bySrc).map(function (s) { return '<tr><td>' + esc(s) + '</td><td class="num">' + bySrc[s].n + '</td><td class="num">' + bySrc[s].won + '</td><td class="num">' + money(bySrc[s].v) + '</td></tr>'; }).join('') : '<tr><td colspan="4">' + empty('Nothing in this window.') + '</td></tr>') + '</tbody></table></div>';
    var byStage = GC.pipelineByStage(D.opps, sc);
    h += '<div class="card pad0"><div class="hd"><h3>Sales board right now</h3></div><table class="tbl"><tbody>' + GC.T.stages.map(function (s) {
      var n = byStage[s].length, v = byStage[s].reduce(function (a, o) { return a + GC.oppValue(o, P); }, 0);
      return '<tr><td>' + esc(s) + '</td><td class="num">' + n + '</td><td class="num">' + money(v) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    var reasons = {};
    D.opps.filter(function (o) { return sc(o) && o.outcome === 'lost'; }).forEach(function (o) { reasons[o.lost_reason || 'No reason'] = (reasons[o.lost_reason || 'No reason'] || 0) + 1; });
    h += '<div class="card pad0"><div class="hd"><h3>Why we lose</h3></div><table class="tbl"><tbody>' + (Object.keys(reasons).length ? Object.keys(reasons).map(function (r) { return '<tr><td>' + esc(r) + '</td><td class="num">' + reasons[r] + '</td></tr>'; }).join('') : '<tr><td>' + empty('No lost requirements.') + '</td></tr>') + '</tbody></table></div>';
    if (can('vendors')) {
      var vp = {};
      D.orders.forEach(function (o) { o.vendorPOs.forEach(function (v) { var x = vp[v.vendorName] = vp[v.vendorName] || { n: 0, late: 0 }; x.n++; if (o.deadline && v.eta > o.deadline) x.late++; }); });
      h += '<div class="card pad0"><div class="hd"><h3>Vendor performance on our orders</h3></div><table class="tbl"><thead><tr><th>Vendor</th><th class="num">POs</th><th class="num">Past deadline</th></tr></thead><tbody>' + Object.keys(vp).map(function (v) { return '<tr><td>' + esc(v) + '</td><td class="num">' + vp[v].n + '</td><td class="num">' + (vp[v].late ? pill(vp[v].late, 'bad') : '0') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    h += '</div>';
    return h;
  };

  /* ================= SETTINGS ================= */

  /* eleven pages, four groups: pick a group, then a page inside it */
  var SGROUPS = [
    ['Business', [['profile', 'Business profile'], ['branches', 'Offices & warehouses'], ['reset', 'Reset demo']]],
    ['People & access', [['people', 'People'], ['roles', 'Roles & access']]],
    ['Selling rules', [['pipelines', 'Stages'], ['tiers', 'Client tiers'], ['compliance', 'Rules & limits']]],
    ['Connections', [['connections', 'Connections'], ['templates', 'WhatsApp templates'], ['agents', 'Assistants']]]
  ];
  var STABS = SGROUPS.reduce(function (a, g) { return a.concat(g[1]); }, []);
  VIEWS.settings = function (tab) {
    tab = tab || 'profile';
    var grp = SGROUPS.filter(function (g) { return g[1].some(function (t) { return t[0] === tab; }); })[0] || SGROUPS[0];
    var h = '<div class="ph"><div><h1>Settings</h1><p>Everything that makes this cockpit ' + esc(GC.T.name) + '\'s. A new company changes these, not the code.</p></div></div>';
    h += '<div class="srcpick" style="margin-bottom:12px">' + SGROUPS.map(function (g) { return '<a href="#/settings/' + g[1][0][0] + '"><span style="' + (g === grp ? 'background:var(--brand);border-color:var(--brand);color:#fff' : '') + '">' + esc(g[0]) + '</span></a>'; }).join('') + '</div>';
    h += '<div class="tabs">' + grp[1].map(function (t) { return '<a href="#/settings/' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</a>'; }).join('') + '</div>';
    var f = SETTINGS[tab];
    return h + (f ? f() : empty('No such tab.'));
  };
  var SETTINGS = {};
  SETTINGS.profile = function () {
    var T = GC.T;
    return '<div class="grid2"><form class="card" data-submit="saveProfile"><h3>Company</h3>' +
      field('Business name', '<input name="name" value="' + esc(T.name) + '">') + field('Logo text (script)', '<input name="logoText" value="' + esc(T.logoText) + '">') +
      field('Tagline', '<input name="tagline" value="' + esc(T.tagline) + '">') + field('City', '<input name="city" value="' + esc(T.city) + '">') +
      field('GSTIN', '<input name="gstin" value="' + esc(T.gstin) + '">') + field('WhatsApp business number', '<input name="whatsapp" value="' + esc(T.whatsapp) + '">') +
      field('Sales email', '<input name="email" value="' + esc(T.email) + '">') +
      '<div class="row">' + field('Brand colour', '<input type="color" class="swatch" name="brand" value="' + esc(T.brand) + '">') + field('Accent', '<input type="color" class="swatch" name="accent" value="' + esc(T.accent) + '">') + '</div>' +
      '<button class="btn">Save business profile</button></form>' +
      '<div class="card"><h3>What this is</h3><p class="muted">The cockpit is one product. Everything on these tabs — name, colours, stages, lost reasons, compliance rules, agent autonomy, roles — comes from one tenant profile. Another gifting company is a new profile, not a new build.</p>' +
      '<p class="muted">Changes here are saved in this browser for the demo. In production they are one row in the tenant table.</p>' +
      (Object.keys(D.tenant || {}).length ? '<button class="btn ghost" data-act="resetProfile">Restore ' + esc(window.TENANT.name) + '\'s original profile</button>' : '') + '</div></div>';
  };
  SETTINGS.roles = function () {
    var roles = D.roles;
    var h = '<div class="card pad0 scroller"><table class="tbl matrix"><thead><tr><th>Capability</th>' + roles.map(function (r) { return '<th>' + esc(r.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += '<tr><td><b>Sees</b><small>Which rows appear in lists.</small></td>' + roles.map(function (r) {
      var a = D.access[r.id] || GC.NO_ACCESS;
      return '<td><select data-chg="setScope" data-id="' + r.id + '" style="width:auto;font-size:12px"' + (r.id === 'owner' ? ' disabled' : '') + '>' + Object.keys(GC.SCOPES).map(function (s) { return '<option value="' + s + '"' + (a.scope === s ? ' selected' : '') + '>' + GC.SCOPES[s] + '</option>'; }).join('') + '</select></td>';
    }).join('') + '</tr>';
    h += GC.CAPS.map(function (c) {
      return '<tr><td><b>' + esc(c[1]) + '</b><small>' + esc(c[2]) + '</small></td>' + roles.map(function (r) {
        var a = D.access[r.id] || GC.NO_ACCESS;
        return '<td><input type="checkbox" data-chg="setCap" data-id="' + r.id + '|' + c[0] + '"' + (a[c[0]] ? ' checked' : '') + (r.id === 'owner' ? ' disabled title="The owner\'s row is locked"' : '') + '></td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
    h += '<form class="card" style="margin-top:16px" data-submit="addRole"><h3>Add a role</h3><div class="row">' +
      '<input name="name" placeholder="e.g. Design & mockups" style="max-width:260px"><select name="base" style="width:auto">' + roles.map(function (r) { return '<option value="' + r.id + '">Start from ' + esc(r.name) + '</option>'; }).join('') + '</select><button class="btn">+ New role</button></div></form>';
    h += '<p class="honest">In this demo, hidden figures are a display rule. On the production server, restricted columns are simply not sent to that role, exports go through the same rule, and reads of cost are logged.</p>';
    return h;
  };
  SETTINGS.people = function () {
    var u = me();
    var h = '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Person</th><th>Login</th><th>Role</th><th>Office</th><th>Password</th><th></th></tr></thead><tbody>' + D.staff.map(function (s) {
      var canPass = GC.canSetPass(u, s, D.access);
      return '<tr><td><div class="row">' + avatar(s.id, true) + '<span><b>' + esc(s.name) + '</b><small>' + esc(s.email || '') + '</small></span></div></td><td><code>' + esc(s.login) + '</code></td>' +
        '<td>' + (GC.canSetRole(u, s, null, D.access) ? '<select data-chg="setRole" data-id="' + s.id + '" style="width:auto">' + D.roles.map(function (r) { return '<option value="' + r.id + '"' + (s.role === r.id ? ' selected' : '') + '>' + esc(r.name) + '</option>'; }).join('') + '</select>' : esc(roleName(s.role))) + '</td>' +
        '<td>' + esc(GC.branchName(D.branches, s.branch)) + '</td><td>' + (canPass ? '<code>' + esc(s.pass) + '</code>' : '<span class="dim">••••••</span>') + '</td>' +
        '<td>' + (canPass ? '<button class="minibtn" data-act="resetPass" data-id="' + s.id + '">Reset</button>' : '') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    h += '<form class="card" style="margin-top:16px" data-submit="addStaff"><h3>Add a person</h3><div class="grid3">' +
      field('Name', '<input name="name" required>') + field('Login', '<input name="login" required>') + field('Email', '<input name="email" type="email">') +
      field('Role', '<select name="role">' + D.roles.map(function (r) { return '<option value="' + r.id + '">' + esc(r.name) + '</option>'; }).join('') + '</select>') +
      field('Office', '<select name="branch">' + D.branches.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + '</option>'; }).join('') + '</select>') +
      field('First password', '<input name="pass" required minlength="6">') + '</div><button class="btn">Add person</button></form>';
    return h;
  };
  SETTINGS.branches = function () {
    return '<div class="grid2"><div class="card pad0"><div class="hd"><h3>Offices</h3></div>' + D.branches.map(function (b) {
      return '<div class="item"><div class="grow"><h4>' + esc(b.name) + '</h4><p>' + esc(b.address || '') + '</p></div>' + pill(D.staff.filter(function (s) { return s.branch === b.id; }).length + ' people', 'dim') + '</div>';
    }).join('') + '<form class="item" data-submit="addBranch"><input name="name" placeholder="New office name"><button class="btn sm">Add</button></form></div>' +
    '<div class="card pad0"><div class="hd"><h3>Warehouses & sample rooms</h3></div>' + D.warehouses.map(function (w) {
      return '<div class="item"><div class="grow"><h4>' + esc(w.name) + '</h4><p>' + (w.kind === 'samples' ? 'Physical samples for client visits' : 'Ready stock, goods-in and dispatch') + '</p></div></div>';
    }).join('') + '<form class="item" data-submit="addWarehouse"><input name="name" placeholder="New warehouse"><button class="btn sm">Add</button></form></div></div>';
  };
  SETTINGS.pipelines = function () {
    var T = GC.T;
    var list = function (name, arr, note) {
      return '<form class="card" data-submit="savePipeline" data-id="' + name + '"><h3>' + esc(note) + '</h3><p class="muted small">One per line, in order. Renaming a stage moves every deal on it.</p>' +
        '<textarea name="list" style="min-height:190px">' + esc(arr.join('\n')) + '</textarea><button class="btn">Save</button></form>';
    };
    return '<div class="grid3">' + list('stages', T.stages, 'Sales board stages') + list('orderStages', T.orderStages, 'Order board stages') + list('lostReasons', T.lostReasons, 'Lost reasons') + '</div>' +
      '<p class="honest">Order-board rules (artwork before branding, QC before dispatch, delivery before invoice) follow the stage names; keep those words if you rename.</p>';
  };
  SETTINGS.tiers = function () {
    var T = GC.T;
    var counts = {};
    D.companies.forEach(function (c) { var t = tierOf(c); counts[t] = (counts[t] || 0) + 1; });
    return '<div class="grid2"><form class="card" data-submit="saveTiers"><h3>Tier thresholds (12-month order value)</h3>' +
      field('Strategic from (₹)', '<input type="number" name="strategic" value="' + T.tiers.strategic + '">') +
      field('Key account from (₹)', '<input type="number" name="key" value="' + T.tiers.key + '">') +
      '<button class="btn">Save & recalculate</button></form><div class="card"><h3>Clients by tier now</h3><table class="tbl"><tbody>' +
      ['Strategic', 'Key account', 'Active', 'Prospect'].map(function (t) { return '<tr><td>' + pill(t, GC.TIER_BAND[t]) + '</td><td class="num">' + (counts[t] || 0) + '</td></tr>'; }).join('') +
      '</tbody></table><p class="honest">Tiers are worked out from orders, never typed in. An account manager can override one with a reason on the client page.</p></div></div>';
  };
  SETTINGS.compliance = function () {
    var R = GC.T.rules;
    return '<form class="card" data-submit="saveRules" style="max-width:620px"><h3>Rules every quote is checked against</h3>' +
      field('UCPMP cap per healthcare professional (₹)', '<input type="number" name="ucpmpCap" value="' + R.ucpmpCap + '">') +
      '<p class="muted small" style="margin-top:-6px">UCPMP 2024: pharma companies may give doctors only professional-use items, up to ₹1,000 each. The Curator never relaxes this, and a quote that breaks it cannot be sent.</p>' +
      field('Margin floor (%) — below this the owner must approve', '<input type="number" name="marginFloor" value="' + R.marginFloor + '">') +
      field('Quote counts as unanswered after (days)', '<input type="number" name="quoteStaleDays" value="' + R.quoteStaleDays + '">') +
      field('Reorder agent wakes this many days before last year\'s date', '<input type="number" name="reorderLeadDays" value="' + R.reorderLeadDays + '">') +
      field('Deadline buffer — vendor dates inside this many days are at risk', '<input type="number" name="bufferDays" value="' + R.bufferDays + '">') +
      '<label class="chk"><input type="checkbox" name="vipApproval"' + (R.vipApproval ? ' checked' : '') + '> Anything to a Strategic account waits for a person, always</label>' +
      '<p style="margin-top:14px"><button class="btn">Save rules</button></p></form>';
  };
  SETTINGS.reset = function () {
    return '<div class="card" style="max-width:560px"><h3>Reset the demo</h3><p class="muted">Puts back the sample story: every client, requirement, order and agent proposal. Your changes to the business profile are kept unless you tick the box.</p>' +
      '<label class="chk"><input type="checkbox" id="resetProfileToo"> Also restore the original business profile</label><p style="margin-top:14px"><button class="btn bad" data-act="resetDemo">Reset demo data</button></p></div>';
  };
  function field(label, input) { return '<label class="field"><span>' + label + '</span>' + input + '</label>'; }

  function applyTenant() {
    GC.configure(D.tenant || {});
    GC.setStaff(D.staff);
    /* the client's colours, per theme: a brand colour almost never survives a mode flip,
       so dark gets a lighter fill and a separate ink for words */
    var st = document.getElementById('tenantvars'), B = GC.T.brand, A = GC.T.accent;
    var dk = function (h, w) { var bg = [20, 18, 32]; return 'rgb(' + hexRGB(h).map(function (v, i) { return Math.round(v * (1 - w) + bg[i] * w); }).join(',') + ')'; };
    if (st) st.textContent =
      ':root:not([data-theme=dark]){--brand:' + B + ';--brand-2:' + shade(B, 18) + ';--brand-soft:' + mix(B, 0.9) + ';--brand-ink:' + B + ';--accent:' + A + ';--accent-soft:' + mix(A, 0.78) + '}' +
      ':root[data-theme=dark]{--brand:' + shade(B, 46) + ';--brand-2:' + shade(B, 64) + ';--brand-soft:' + dk(B, 0.72) + ';--brand-ink:' + mix(B, 0.62) + ';--accent:' + A + '}';
    document.title = GC.T.name + ' · Agentic Cockpit';
  }
  function hexRGB(h) { h = String(h).replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16) || 0; }); }
  function shade(h, amt) { return 'rgb(' + hexRGB(h).map(function (v) { return Math.min(255, v + amt); }).join(',') + ')'; }
  function mix(h, w) { return 'rgb(' + hexRGB(h).map(function (v) { return Math.round(v * (1 - w) + 255 * w); }).join(',') + ')'; }

  /* ================= guided stories ================= */

  var STORIES = [
    ['Email to quote in minutes', 'Open the Inbox, let the Brief agent read Quantum Labs\' email, approve it, and watch the Curator and Proposal agents build the quote.', '#/inbox', 'u3'],
    ['Diwali for a pharma client (UCPMP)', 'Medilux wants gifts for 1,200 doctors. The Curator only picks professional-use items under ₹1,000, and the Compliance agent blocks anything else.', '#/pipeline', 'u3'],
    ['A vendor slips — the agent catches it', 'Kiran Foods\' diya vendor now promises a date after the client\'s deadline. Order watch flags it and drafts the client update.', '#/desk', 'u6'],
    ['Reverse auction on a hamper', 'Nexa wants a better price. The Sourcing agent runs an auction across the best hamper vendors and recommends a winner.', '#/pipeline', 'u5'],
    ['Employees pick their own gift', 'Horizon Bank\'s 180 staff choose from four options on their own link; the choices land on the order.', '#/orders', 'u2'],
    ['The owner\'s morning', 'The Morning brief, orders at risk, cost and margin — then switch to an account manager and see what they cannot.', '#/home', 'u1']
  ];

  /* ================= actions ================= */

  Object.assign(ACTIONS, {
    go: function (id) { go(id); },
    goBack: function () { HIST.pop(); var to = HIST.pop() || '#/home'; go(to); },
    toggleSide: function () {
      if (window.innerWidth <= 900) { $('#side').classList.toggle('open'); return; }
      var on = document.body.classList.toggle('navc');
      try { localStorage.setItem('gc_navc', on ? '1' : ''); } catch (e) {}
    },
    toggleMore: function () { MORE_OPEN = !MORE_OPEN; try { localStorage.setItem('gc_more', MORE_OPEN ? '1' : ''); } catch (e) {} render(); },
    toggleTheme: function () {
      var t = theme() === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('gc_theme', t); } catch (e) {}
      document.documentElement.setAttribute('data-theme', t); render();
    },
    undo: function () { var u = UNDO; UNDO = null; $('#toast').hidden = true; if (u) u(); },
    gsearch: function (q) { searchPaint(q); },
    askDone: function (f) { var cb = ASKCB; ASKCB = null; closeModal(); if (cb && String(f.text || '').trim()) cb(String(f.text).trim()); },
    closeModal: closeModal,
    hardReload: function () { location.reload(); },
    resetDemo: function () {
      var both = document.getElementById('resetProfileToo');
      var keep = { session: D.session, tenant: both && both.checked ? {} : D.tenant };
      D = blank(); D.session = keep.session; D.tenant = keep.tenant;
      applyTenant(); DB.items.length = DB.base; dropCache(); rebuildIndex();
      seedIfEmpty(); save(); window.GE.afterLogin && window.GE.afterLogin(); toast('Demo data reset.'); go('#/home');
    },
    setRange: function (id) { RANGE.key = id; render(); },
    rangeFrom: function (v) { RANGE.from = v; render(); },
    rangeTo: function (v) { RANGE.to = v; render(); },
    afWho: function (v) { AF.who = v; render(); },
    afArea: function (v) { AF.area = v; render(); },
    quickLogin: function (id) { var u = GC.staffById(id); if (u) signIn(u); },
    switchUser: function () {
      if (me() && me().role !== 'owner') return modal(me().name, roleName(me().role), '<p class="muted">Signed in on this browser.</p><p style="margin-top:14px"><button class="btn ghost" data-act="signOut">Sign out</button></p>');
      modal('Switch person', 'Demo only. See the cockpit as somebody else.', '<div class="stories">' + D.staff.map(function (u) {
        return '<div class="story" data-act="becomeUser" data-id="' + u.id + '">' + avatar(u.id) + '<div><b>' + esc(u.name) + '</b><span>' + esc(roleName(u.role)) + ' · sees ' + esc(GC.SCOPES[(D.access[u.role] || GC.NO_ACCESS).scope].toLowerCase()) + '</span></div></div>';
      }).join('') + '</div><p style="margin-top:14px"><button class="btn ghost" data-act="signOut">Sign out</button></p>');
    },
    becomeUser: function (id) { closeModal(); D.session = id; save(); toast('You are now ' + GC.staffName(id) + '.'); if (window.GE.afterLogin) window.GE.afterLogin(); go('#/home'); },
    signOut: function () { closeModal(); D.session = null; save(); render(); },
    stories: function () {
      modal('Guided stories', 'Each one sets up the right person and screen. Everything is sample data.', '<div class="stories">' + STORIES.map(function (s, i) {
        return '<div class="story" data-act="story" data-id="' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span><br><span class="small">As ' + esc(GC.staffName(s[3])) + '</span></div></div>';
      }).join('') + '</div>', true);
    },
    story: function (i) { var s = STORIES[+i]; closeModal(); D.session = s[3]; save(); if (window.GE.afterLogin) window.GE.afterLogin(); toast('Story: ' + s[0]); go(s[2]); },
    doneFollow: function (id) {
      var f = byId(D.followups, id); if (!f) return;
      f.done = true; f.done_at = GC.today(); log('follow_done', 'Follow-up done: ' + (f.note || ''), { company: f.company, opp: f.opp }); save(); render();
    },
    exportActivity: function () {
      var rows = [['When', 'Who', 'Area', 'What']].concat(D.activity.map(function (x) { return [x.at, x.by ? GC.staffName(x.by) : 'Agent', (KINDS[x.kind] || ['Other'])[0], x.text]; }));
      download('activity.csv', rows);
    },
    setTarget: function (v, el) {
      var p = el.dataset.id.split('|'); D.targets[p[0]] = D.targets[p[0]] || { orders: 0, value: 0 };
      D.targets[p[0]][p[1]] = Math.max(0, Number(v) || 0);
      log('target', 'Target for ' + GC.staffName(p[0]) + ': ' + p[1] + ' = ' + v); save(); render();
    },
    saveProfile: function (f) {
      D.tenant = Object.assign({}, D.tenant, { name: f.name, logoText: f.logoText, tagline: f.tagline, city: f.city, gstin: f.gstin, whatsapp: f.whatsapp, email: f.email, brand: f.brand, accent: f.accent });
      applyTenant(); log('settings', 'Business profile saved'); save(); toast('Business profile saved.'); render();
    },
    resetProfile: function () { D.tenant = {}; applyTenant(); save(); toast('Original profile restored.'); render(); },
    setScope: function (v, el) { D.access[el.dataset.id].scope = v; log('settings', roleName(el.dataset.id) + ' now sees ' + GC.SCOPES[v].toLowerCase()); save(); render(); },
    setCap: function (v, el) {
      var p = el.dataset.id.split('|');
      if (p[0] === 'owner') return;
      D.access[p[0]][p[1]] = !!el.checked;
      log('settings', roleName(p[0]) + ': ' + p[1] + ' ' + (el.checked ? 'on' : 'off')); save(); render();
    },
    addRole: function (f) {
      var name = String(f.name || '').trim(); if (name.length < 3) return toast('Name the role.', 'bad');
      var id = 'r' + Date.now().toString(36);
      D.roles.push({ id: id, name: name, custom: true }); D.access[id] = GC.clone(D.access[f.base] || GC.NO_ACCESS);
      log('settings', 'New role: ' + name); save(); render();
    },
    setRole: function (v, el) {
      var s = GC.staffById(el.dataset.id);
      if (!GC.canSetRole(me(), s, v, D.access)) { toast('You cannot give that role.', 'bad'); return render(); }
      s.role = v; log('staff', s.name + ' is now ' + roleName(v)); save(); render();
    },
    resetPass: function (id) {
      var s = GC.staffById(id); if (!GC.canSetPass(me(), s, D.access)) return;
      s.pass = s.login + Math.floor(100 + Math.random() * 900); log('staff', 'Password reset for ' + s.name); save(); toast('New password for ' + s.name + ': ' + s.pass); render();
    },
    addStaff: function (f) {
      if (!f.name || !f.login) return toast('Name and login are needed.', 'bad');
      if (D.staff.some(function (s) { return s.login === f.login.toLowerCase(); })) return toast('That login is taken.', 'bad');
      if (!GC.validPass(f.pass)) return toast('Password needs at least 6 characters.', 'bad');
      if (f.role === 'owner' && me().role !== 'owner') return toast('Only the owner can add another owner.', 'bad');
      D.staff.push({ id: 'u' + Date.now().toString(36), login: f.login.toLowerCase(), pass: f.pass, name: f.name, role: f.role, branch: f.branch, email: f.email, mobile: '', joined: GC.today() });
      GC.setStaff(D.staff); log('staff', 'Added ' + f.name); save(); render();
    },
    addBranch: function (f) { if (!f.name) return; D.branches.push({ id: 'b' + Date.now().toString(36), name: f.name, address: '' }); save(); render(); },
    addWarehouse: function (f) { if (!f.name) return; D.warehouses.push({ id: 'w' + Date.now().toString(36), name: f.name, kind: 'stock' }); save(); render(); },
    savePipeline: function (f, form) {
      var key = form.dataset.id, list = String(f.list || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (list.length < 3) return toast('Keep at least three.', 'bad');
      var old = GC.T[key].slice();
      D.tenant[key] = list;
      /* a renamed stage moves its deals with it, position for position */
      if (key === 'stages') D.opps.forEach(function (o) { var i = old.indexOf(o.stage); if (i >= 0 && list[i] && GC.CLOSED.indexOf(o.stage) < 0) o.stage = list[i]; });
      if (key === 'orderStages') D.orders.forEach(function (o) { var i = old.indexOf(o.stage); if (i >= 0 && list[i]) o.stage = list[i]; });
      applyTenant(); log('settings', 'Pipeline updated: ' + key); save(); toast('Saved.'); render();
    },
    saveTiers: function (f) {
      D.tenant.tiers = { strategic: Number(f.strategic) || GC.T.tiers.strategic, key: Number(f.key) || GC.T.tiers.key };
      applyTenant(); log('settings', 'Tier thresholds changed'); save(); toast('Tiers recalculated.'); render();
    },
    saveRules: function (f) {
      D.tenant.rules = { ucpmpCap: +f.ucpmpCap || 1000, marginFloor: +f.marginFloor || 0, quoteStaleDays: +f.quoteStaleDays || 5,
        reorderLeadDays: +f.reorderLeadDays || 45, bufferDays: +f.bufferDays || 0, vipApproval: !!f.vipApproval };
      applyTenant(); log('settings', 'Compliance rules changed'); save(); toast('Rules saved. Every new check uses them.'); render();
    }
  });

  function download(name, rows) {
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function formObj(form) {
    var o = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        if (el.dataset.multi) { o[el.name] = o[el.name] || []; if (el.checked) o[el.name].push(el.value); }
        else o[el.name] = el.checked;
      } else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
      else o[el.name] = el.value;
    });
    return o;
  }

  function rebuildIndex() {
    DB.byId = {};
    DB.items.forEach(function (it) { DB.byId[it.id] = it; });
    mountNewProducts();
  }

  /* ================= boot ================= */

  function boot() {
    D = load();
    applyTenant();
    DB = E.build();
    DB.base = DB.items.length;
    rebuildIndex();
    seedIfEmpty();
    /* the zippyscale.in client portal gate already checked the password */
    try { if (!D.session && sessionStorage.getItem(GC.T.slug + 'In')) { D.session = 'u1'; save(); } } catch (e) {}

    document.getElementById('loginform').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = GC.authenticate($('#l-user').value, $('#l-pass').value);
      if (!u) { $('#l-err').textContent = 'That login and password do not match.'; return; }
      $('#l-err').textContent = ''; signIn(u);
    });
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act]');
      if (!el) return;
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !el.dataset.act) return;
      if (!ACTIONS[el.dataset.act]) return;
      if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
      e.stopPropagation();
      runAct(el.dataset.act, [el.dataset.id, el, e]);
    });
    document.addEventListener('change', function (e) {
      var el = e.target.closest('[data-chg]');
      if (!el) return;
      if (ACTIONS[el.dataset.chg]) runAct(el.dataset.chg, [el.type === 'checkbox' ? el.checked : el.value, el, e]);
    });
    var IT = null;
    document.addEventListener('input', function (e) {
      var el = e.target.closest('[data-input]');
      if (!el) return;
      clearTimeout(IT);
      IT = setTimeout(function () { var fn = ACTIONS[el.dataset.input]; if (fn) fn(el.value, el, e); }, el.dataset.input === 'gsearch' ? 120 : 220);
    });
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (form.id === 'loginform') return;
      e.preventDefault();
      if (ACTIONS[form.dataset.submit]) runAct(form.dataset.submit, [formObj(form), form, e]);
    });
    window.addEventListener('hashchange', function () { closeSearch(); render(); });
    window.addEventListener('load', icons);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
      if (e.key === '/' && !/^(INPUT|SELECT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '')) { var g = document.getElementById('gsearch'); if (g) { e.preventDefault(); g.focus(); } }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.gsearch')) closeSearch(); });
    /* A portal (client, picker, vendor) in another tab wrote to the store.
       Take its version, or our next save would silently undo what it did. */
    window.addEventListener('storage', function (e) {
      if (e.key !== GC.appKey() || !e.newValue) return;
      var sess = D.session; D = load(); D.session = sess; applyTenant(); dropCache(); rebuildIndex(); render();
    });
    try { if (localStorage.getItem('gc_navc')) document.body.classList.add('navc'); } catch (e) {}
    if (D.session && window.GE.afterLogin) window.GE.afterLogin();
    render();
  }

  window.GE = {
    VIEWS: VIEWS, ACTIONS: ACTIONS, SETTINGS: SETTINGS, boot: boot, render: render, go: go, save: save, log: log,
    D: function () { return D; }, setD: function (d) { D = d; }, db: function () { return DB; }, E: E, P: P, dropCache: dropCache,
    editProduct: editProduct, editCompany: editCompany, editOpp: editOpp,
    deleteCompany: deleteCompany, deleteOpp: deleteOpp, rebuildIndex: rebuildIndex, blank: blank, load: load, migrate: migrate, repair: repair, applyTenant: applyTenant,
    me: me, acc: acc, can: can, roleName: roleName, avatar: avatar, inScope: inScope, canOpen: canOpen, mob: mob, cost: cost,
    companyById: companyById, contactById: contactById, oppById: oppById, orderById: orderById, contactsOf: contactsOf, byId: byId,
    tierOf: tierOf, tierPill: tierPill, pill: pill, thumb: thumb, kpis: kpis, conf: conf, stepsHTML: stepsHTML, when: when,
    deny: deny, empty: empty, field: field, toast: function (m, k, u) { return toast(m, k, u); }, runAct: runAct, say: say, day: day, ask: ask, celebrate: celebrate, navFor: navFor, modal: modal, closeModal: closeModal, range: range, rangeBar: rangeBar,
    inRange: inRange, download: download, pending: pending, KINDS: KINDS, esc: esc, money: money, afterLogin: null, morningBrief: null
  };
})();
