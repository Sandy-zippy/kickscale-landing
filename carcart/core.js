/* Car Cart — console logic. No DOM here, so it runs under node for tests.
   console.html and its plug-ins build on this (namespace CC).
   The public storefront index.html runs on shop.js (namespace SHOP). */
(function (root) {
  'use strict';

  var fmt = function (n) { return n == null ? '—' : Number(n).toLocaleString('en-IN'); };

  var money = function (n) {
    if (n == null) return '—';
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + fmt(n);
  };

  /* Ceilings sit just above the real stock so a maxed slider filters nothing. */
  var LIMITS = { price: 38500000, emi: 700000, km: 160000 };

  var DEFAULTS = function () {
    return { make: '', model: '', variant: '', year: '', q: '', sort: 'price-desc',
             price: LIMITS.price, emi: LIMITS.emi, km: LIMITS.km,
             fuel: [], tx: [], body: [], hideSold: true, wishOnly: false };
  };

  function matches(c, S) {
    if (S.make && c.make !== S.make) return false;
    if (S.model && c.model !== S.model) return false;
    if (S.variant && c.variant !== S.variant) return false;
    if (S.year && String(c.year) !== String(S.year)) return false;
    if (c.price > S.price) return false;
    if (c.emi > S.emi) return false;
    if (c.km != null && c.km > S.km) return false;
    if (S.fuel.length && S.fuel.indexOf(c.fuel) < 0) return false;
    if (S.tx.length && S.tx.indexOf(c.transmission) < 0) return false;
    if (S.body.length && S.body.indexOf(c.body_type) < 0) return false;
    if (S.hideSold && c.availability === 'Sold') return false;
    if (S.q) {
      var hay = [c.make, c.model, c.variant, c.year, c.fuel, c.transmission, c.stock_id, c.body_type]
        .join(' ').toLowerCase();
      var words = S.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  var SORTS = {
    'price-desc': function (a, b) { return b.price - a.price; },
    'price-asc':  function (a, b) { return a.price - b.price; },
    'year-desc':  function (a, b) { return (b.year || 0) - (a.year || 0); },
    'km-asc':     function (a, b) { return (a.km == null ? 9e9 : a.km) - (b.km == null ? 9e9 : b.km); },
    'new-first':  function (a, b) { return a.days_listed - b.days_listed; }
  };

  /* Normalise a raw record once, so every consumer sees the same shape. */
  function prepare(c) {
    var d = c.demo || {};
    var sc = scoreRecord(c);
    return Object.assign({}, c, {
      score: sc, completeness: sc.pct,
      availability: d.availability || 'Available',
      name: (c.make || '') + ' ' + (c.model || ''),
      landed: d.landed_cost, floor: d.floor_price, margin: d.margin,
      marginpc: c.price ? (d.margin / c.price * 100) : 0,
      days: c.days_listed,
      holding: c.days_listed * Math.round((d.landed_cost || 0) * 0.00035)
    });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var ICONS = {
    year: '<path d="M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>',
    km:   '<circle cx="12" cy="13" r="8"/><path d="M12 13l4-3M9 3h6"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h3a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0v-7l-3-3M7 8h4"/>',
    tx:   '<path d="M6 4v6M12 4v6M18 4v6M6 10a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3M12 13v7"/>'
  };
  function icon(k) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
           'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[k] || '') + '</svg>';
  }

  /* One catalogue card. Public cards carry nothing internal. */
  function cardHTML(c, wished) {
    var av = c.availability;
    var badge = av !== 'Available'
      ? '<span class="tag ' + esc(av.toLowerCase()) + '">' + esc(av) + '</span>' : '';

    var spec = [['year', c.year], ['km', c.km != null ? fmt(c.km) + ' km' : null],
                ['fuel', c.fuel], ['tx', c.transmission]]
      .filter(function (p) { return p[1] !== null && p[1] !== undefined && p[1] !== ''; })
      .map(function (p) { return '<li>' + icon(p[0]) + '<span>' + esc(p[1]) + '</span></li>'; })
      .join('');

    var variant = c.variant ? '<p class="c-var">' + esc(c.variant) + '</p>'
                            : '<p class="c-var c-var-none">' + esc(c.body_type || '') + '</p>';

    return '' +
      '<article class="card" data-id="' + esc(c.stock_id) + '" tabindex="0" role="button" ' +
        'aria-label="' + esc(c.name + ' ' + c.variant) + ', ' + esc(money(c.price)) + '">' +
        '<div class="c-img">' +
          '<img loading="lazy" src="' + coverSrc(c) + '" alt="' + esc(c.name) + '">' +
          '<div class="c-tags">' + badge + '</div>' +
          '<span class="c-count">' + c.n_photos + '</span>' +
          '<button class="heart" type="button" data-wish="' + esc(c.stock_id) + '" aria-pressed="' +
            (wished ? 'true' : 'false') + '" aria-label="Save ' + esc(c.name) + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 4.2 12.9a4.7 4.7 0 0 1 6.6-6.7l1.2 1.1 1.2-1.1a4.7 4.7 0 1 1 6.6 6.7Z"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="c-body">' +
          '<p class="c-make">' + esc(c.make) + '</p>' +
          '<h3 class="c-name">' + esc(c.model) + '</h3>' + variant +
          '<div class="c-foot">' +
            '<ul class="c-spec">' + spec + '</ul>' +
            '<div class="c-price"><strong>' + money(c.price) + '</strong>' +
              '<span>₹' + fmt(c.emi) + '/mo</span></div>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* A car added inside the demo carries data-URL photos; a scraped one points at
     a file on disk. One helper so every caller stops caring which. */
  function coverSrc(c) {
    var p = (c.photos && c.photos[0]) || '';
    return /^data:|^https?:/.test(p) ? p : 'img/cover/' + p;
  }
  function photoSrc(p) {
    return /^data:|^https?:/.test(p) ? p : 'img/gallery/' + p;
  }

  function ageBucket(days) {
    if (days <= 30) return ['0–30 days', 'ok'];
    if (days <= 60) return ['31–60 days', 'ok'];
    if (days <= 90) return ['61–90 days', 'warn'];
    return ['over 90 days', 'bad'];
  }

  function cascadeOptions(cars, S, level) {
    var pool = cars.filter(function (c) {
      if (level >= 1 && S.make && c.make !== S.make) return false;
      if (level >= 2 && S.model && c.model !== S.model) return false;
      if (level >= 3 && S.variant && c.variant !== S.variant) return false;
      return true;
    });
    var key = ['make', 'model', 'variant', 'year'][level];
    var counts = {};
    pool.forEach(function (c) {
      var v = c[key];
      if (v === null || v === undefined || v === '') return;
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.keys(counts).sort(function (a, b) {
      return a.localeCompare(b, undefined, { numeric: true });
    }).map(function (v) { return [v, counts[v]]; });
  }

  function tally(cars, key) {
    var counts = {};
    cars.forEach(function (c) {
      var v = c[key];
      if (v === null || v === undefined || v === '') return;
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b);
    }).map(function (v) { return [v, counts[v]]; });
  }


  /* ================= ROLES AND ACCESS =================
     Ported from the Vaarahi demo, where it has already survived client demos.
     One accessor, one row filter, one masker. Lists filter, detail pages block,
     fields mask, nav hides. Denial is a polite card, never a 403. */

  var ROLES = {
    owner:       { label: 'Owner',                  short: 'Owner' },
    storemanager:{ label: 'Store Manager',          short: 'Store Mgr' },
    manager:     { label: 'Sales Manager',          short: 'Manager' },
    sales:       { label: 'Sales Floor',            short: 'Sales' },
    telecaller:  { label: 'Telecaller',             short: 'Telecaller' },
    inventory:   { label: 'Inventory & Photography', short: 'Inventory' }
  };

  var CAPS = [
    ['cost',       'Cost & margins',   'Landed cost, floor price, margin and profit.'],
    ['clients',    'Customer records', 'Open the customer database at all.'],
    ['seeMobile',  'Customer mobiles', 'See full phone numbers instead of the last four digits.'],
    ['editStock',  'Edit car details', 'Change or add fields on a car record.'],
    ['addStock',   'Add cars',         'Create a new listing, upload photos.'],
    ['publish',    'Publish listings', 'Push a car live to the website, or pull it down.'],
    ['automations','Build automations','Create and edit automation rules.'],
    ['exportData', 'Export data',      'Download customer or stock data as a file.'],
    ['targets',    'Set targets',      'Set and change the monthly targets each salesperson carries.'],
    ['reports',    'Team reports',     'See every salesperson\'s numbers, not just their own.'],
    ['settings',   'Settings',         'Roles, access and connections. The owner\'s controls.'],
    ['passwords',  'Passwords',        'See and reset other people\'s sign-in passwords, and set one when adding somebody.']
  ];

  var SCOPES = { own: 'Only their own', branch: 'Their showroom', company: 'Everyone' };

  /* The store manager starts level with the owner on purpose — the owner then
     switches individual capabilities off on the Roles tab if they want to. The
     one thing that is not a capability is the owner's own row: see canSetPass(). */
  var ACCESS_DEFAULT = {
    owner:       { scope: 'company', cost: true,  clients: true,  seeMobile: true,  editStock: true,  addStock: true,  publish: true,  automations: true,  exportData: true,  targets: true,  reports: true,  settings: true,  passwords: true },
    storemanager:{ scope: 'company', cost: true,  clients: true,  seeMobile: true,  editStock: true,  addStock: true,  publish: true,  automations: true,  exportData: true,  targets: true,  reports: true,  settings: true,  passwords: true },
    manager:     { scope: 'company', cost: true,  clients: true,  seeMobile: true,  editStock: true,  addStock: true,  publish: true,  automations: true,  exportData: true,  targets: true,  reports: true,  settings: false, passwords: false },
    sales:       { scope: 'own',     cost: false, clients: true,  seeMobile: true,  editStock: false, addStock: false, publish: false, automations: false, exportData: false, targets: false, reports: false, settings: false, passwords: false },
    telecaller:  { scope: 'company', cost: false, clients: true,  seeMobile: true,  editStock: false, addStock: false, publish: false, automations: false, exportData: false, targets: false, reports: false, settings: false, passwords: false },
    inventory:   { scope: 'company', cost: true,  clients: false, seeMobile: false, editStock: true,  addStock: true,  publish: true,  automations: false, exportData: false, targets: false, reports: false, settings: false, passwords: false }
  };

  var NO_ACCESS = { scope: 'own', cost: false, clients: false, seeMobile: false, editStock: false,
                    addStock: false, publish: false, automations: false, exportData: false,
                    targets: false, reports: false, settings: false, passwords: false };

  function defaultAccess() {
    var out = {};
    Object.keys(ACCESS_DEFAULT).forEach(function (r) { out[r] = Object.assign({}, ACCESS_DEFAULT[r]); });
    return out;
  }

  /* The one accessor. Everything else reads through this. */
  function acc(user, access) {
    if (!user) return Object.assign({}, NO_ACCESS);
    return (access && access[user.role]) || ACCESS_DEFAULT[user.role] || NO_ACCESS;
  }

  /* The row-level filter. `row.assigned_to` is the ownership axis. */
  function inScope(row, user, access) {
    if (!user || !row) return false;
    var a = acc(user, access);
    if (a.scope === 'company') return true;
    if (a.scope === 'branch') return !row.branch || row.branch === user.branch;
    return row.assigned_to === user.id;
  }

  /* Deliberate escape hatch: an unassigned walk-in is everybody's problem. */
  function canOpen(row, user, access) {
    return inScope(row, user, access) || !row.assigned_to;
  }

  function maskMobile(m, user, access) {
    if (!m) return '—';
    if (acc(user, access).seeMobile) return m;
    return '••••••' + String(m).slice(-4);
  }

  function maskCost(v, user, access) {
    return acc(user, access).cost ? money(v) : '₹ ••••';
  }

  var STAFF = [
    { id: 'u1', login: 'owner',  pass: 'carcart26', name: 'Owner',        role: 'owner',        branch: 'b1', mobile: '6269898989', email: 'owner@carcartonline.com',   joined: '2018-06-01' },
    { id: 'u7', login: 'vijay',  pass: 'vijay26', name: 'Vijay Menon',  role: 'storemanager', branch: 'b1', mobile: '9848076512', email: 'vijay@carcartonline.com',   joined: '2020-01-20' },
    { id: 'u2', login: 'naveen', pass: 'naveen26', name: 'Naveen Rao',   role: 'manager',      branch: 'b1', mobile: '9885543210', email: 'naveen@carcartonline.com',  joined: '2021-03-08' },
    { id: 'u3', login: 'rahul',  pass: 'rahul26', name: 'Rahul Varma',  role: 'sales',        branch: 'b1', mobile: '9701123344', email: 'rahul@carcartonline.com',   joined: '2022-11-01' },
    { id: 'u4', login: 'imran',  pass: 'imran26', name: 'Imran Ali',    role: 'sales',        branch: 'b2', mobile: '7075390099', email: 'imran@carcartonline.com',   joined: '2024-05-20' },
    { id: 'u5', login: 'kavya',  pass: 'kavya26', name: 'Kavya Reddy',  role: 'telecaller',   branch: 'b1', mobile: '9391556677', email: 'kavya@carcartonline.com',   joined: '2024-09-16' },
    { id: 'u6', login: 'ravi',   pass: 'ravi26', name: 'Ravi Kumar',   role: 'inventory',    branch: 'b1', mobile: '6302118899', email: 'ravi@carcartonline.com',    joined: '2025-02-03' }
  ];

  /* Who may set whose password.

     Two rules, and they are deliberately not capabilities:
       * nobody sets their own — a password is issued to you, not chosen by you,
         which is the whole point of the owner being able to read them;
       * only the owner touches the owner's row, however senior the other person.
     Everything else is the `passwords` capability, which the owner can switch
     off for the store manager on the Roles tab. */
  function canSetPass(actor, target, access) {
    if (!actor || !target) return false;
    if (actor.role === 'owner') return true;          // including their own
    if (!acc(actor, access).passwords) return false;
    if (target.role === 'owner') return false;
    return target.id !== actor.id;
  }

  /* Changing a role is how you would hand yourself back a capability the owner
     just took away, so it carries its own rules rather than riding on
     `settings`: never your own row, and the two senior roles are the owner's
     to give. Without this, "the owner can switch things off for the store
     manager" is not true for five seconds. */
  var SENIOR_ROLES = ['owner', 'storemanager'];

  function canSetRole(actor, target, role, access) {
    if (!actor || !target) return false;
    if (!acc(actor, access).settings) return false;
    if (actor.role === 'owner') return true;
    if (target.id === actor.id) return false;                 // not your own
    if (target.role === 'owner') return false;                // not the owner's
    if (role && SENIOR_ROLES.indexOf(role) >= 0) return false; // not a promotion into the top two
    return true;
  }

  /* Reading one is the same question as setting one — if you may reset it you
     may as well be told what it is, and the owner asked to see them in clear. */
  function canSeePass(actor, target, access) { return canSetPass(actor, target, access); }

  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); }
  function validPass(p) { return String(p || '').trim().length >= 6; }

  /* Staff live in the store once the app boots, so new people can be added to
     new branches. core.js keeps a pointer so its pure helpers still resolve a name. */
  function setStaff(list) { if (list && list.length) STAFF = list; return STAFF; }
  function staffList() { return STAFF; }

  function authenticate(login, pass) {
    var u = STAFF.filter(function (x) {
      return x.login === String(login || '').trim().toLowerCase() && x.pass === pass;
    })[0];
    return u || null;
  }
  function staffById(id) { return STAFF.filter(function (u) { return u.id === id; })[0] || null; }
  function staffByRole(r) { return STAFF.filter(function (u) { return u.role === r; }); }


  /* ================= BRANCHES ================= */

  var DEFAULT_BRANCHES = [
    { id: 'b1', name: 'Kavuri Hills', address: 'H.No. 1-98/21A, Plot 145P & 146P, Opp. Divya Diamonds, Madhapur, Hyderabad 500081',
      phone: '6269898989', target: { units: 4, value: 20000000 } },
    { id: 'b2', name: 'Banjara Hills', address: 'Road No. 12, Banjara Hills, Hyderabad 500034',
      phone: '7075390099', target: { units: 2, value: 9000000 } }
  ];

  function branchById(branches, id) {
    return (branches || []).filter(function (b) { return b.id === id; })[0] || null;
  }
  function branchName(branches, id) {
    var b = branchById(branches, id);
    return b ? b.name : '—';
  }


  /* ================= OPPORTUNITIES =================
     A customer is a person; an opportunity is one car-buying attempt. Somebody
     who bought a Superb last year and is now after an X5 has one customer record
     and two opportunities. The stage belongs to the opportunity, never to the
     person — otherwise a repeat buyer has to be dragged backwards to "New" and
     their history is overwritten. */

  /* The showroom floor IS the pipeline. One ladder, from the moment a lead
     arrives to the moment it is booked. A walk-in and a WhatsApp enquiry both
     land on it — they just start at different rungs. */
  var OPEN_STAGES = ['New lead', 'Contacted', 'Appointment', 'In showroom',
                     'Test drive', 'Negotiating', 'Booked'];
  var STAGE_HELP = {
    'New lead':    'Just arrived. Nobody has spoken to them yet.',
    'Contacted':   'We have reached them. Working out what they want.',
    'Appointment': 'Booked in to come and see the cars.',
    'In showroom': 'On the floor right now, with a salesperson.',
    'Test drive':  'Driving one of the cars.',
    'Negotiating': 'Talking price on a specific car.',
    'Booked':      'Money taken. Waiting on paperwork and delivery.',
    'Won':         'Delivered. It is on their record now.',
    'Lost':        'Gone elsewhere, or gone quiet for good.'
  };
  var CLOSED_STAGES = ['Won', 'Lost'];
  var OPP_STAGES = OPEN_STAGES.concat(CLOSED_STAGES);

  function isOpen(o) { return o && CLOSED_STAGES.indexOf(o.stage) < 0; }

  /* Stage names used before the floor and the pipeline were merged. */
  var LEGACY_STAGES = {
    'New': 'New lead', 'Visit booked': 'Appointment', 'Visited': 'In showroom',
    'Delivered': 'Won'
  };
  function fixStage(st) {
    if (OPP_STAGES.indexOf(st) >= 0) return st;
    return LEGACY_STAGES[st] || OPEN_STAGES[0];
  }

  function newOpp(o) {
    o = o || {};
    return {
      id: o.id || 'o' + Date.now() + Math.floor(Math.random() * 1000),
      client: o.client || null,
      title: o.title || '',
      stage: o.stage || 'New lead',
      cars: o.cars || [],        // the shortlist — everything they looked at
      inplay: o.inplay || [],    // the cars they actually want; follow-ups hang off these
      assigned_to: o.assigned_to || null,
      branch: o.branch || 'b1',
      source: o.source || 'walkin',
      budget_min: o.budget_min || null,
      budget_max: o.budget_max || null,
      wants: Object.assign({ bodies: [], fuels: [], makes: [], year_min: null }, o.wants || {}),
      trade_in: o.trade_in || null,
      finance: !!o.finance,
      created: o.created || today(),
      updated: o.updated || today(),
      expected: o.expected || null,      // when they say they will buy
      closed: o.closed || null,
      outcome: o.outcome || null,
      won_car: o.won_car || null,
      won_price: o.won_price || null,
      lost_reason: o.lost_reason || null,
      notes: o.notes || []
    };
  }

  function oppsFor(opps, clientId) {
    return (opps || []).filter(function (o) { return o.client === clientId; });
  }
  function openOppsFor(opps, clientId) {
    return oppsFor(opps, clientId).filter(isOpen);
  }
  function openOpps(opps) { return (opps || []).filter(isOpen); }

  /* The pipeline only ever carries live work. Anything decided drops out of it
     and lands on the customer's record instead. */
  function pipelineByStage(opps, filterFn) {
    var out = {};
    OPEN_STAGES.forEach(function (s) { out[s] = []; });
    (opps || []).forEach(function (o) {
      if (!isOpen(o)) return;
      if (filterFn && !filterFn(o)) return;
      /* A stage from an older build, or a typo, must not take the board down.
         Park it at the first rung rather than throwing. */
      var col = out[o.stage] ? o.stage : OPEN_STAGES[0];
      out[col].push(o);
    });
    return out;
  }

  /* Promote a car out of the shortlist: this is the one being negotiated, and
     the one follow-ups are about. */
  function playCar(opp, stockId, on) {
    var i = opp.inplay.indexOf(stockId);
    if (on === false || (on === undefined && i >= 0)) { if (i >= 0) opp.inplay.splice(i, 1); }
    else if (i < 0) opp.inplay.push(stockId);
    if (opp.cars.indexOf(stockId) < 0) opp.cars.push(stockId);
    opp.updated = today();
    return opp;
  }
  function isInPlay(opp, stockId) { return (opp.inplay || []).indexOf(stockId) >= 0; }

  /* How far along a car is, so a stage move can advance a mark but never drag it
     backwards over something a salesperson chose by hand. */
  var MARK_RANK = { interested: 1, test_drove: 2, negotiating: 3, booked: 4, bought: 5 };
  var STAGE_MARK = { 'Test drive': 'test_drove', 'Negotiating': 'negotiating', 'Booked': 'booked' };

  /* Stages that describe a conversation about one specific car. You cannot
     negotiate nothing, so these need a car in play first. */
  var NEEDS_CAR = ['Negotiating', 'Booked'];

  function moveOpp(opp, stage, client) {
    if (OPP_STAGES.indexOf(stage) < 0) return { error: 'Unknown stage.' };
    if (stage === 'Won') return { error: 'Close it as won from the car, so the sale is recorded.' };
    if (NEEDS_CAR.indexOf(stage) >= 0 && !(opp.inplay || []).length) {
      return { error: 'Move a car into play first — you cannot be ' + stage.toLowerCase() +
                      ' on nothing in particular.' };
    }
    opp.stage = stage;
    opp.updated = today();
    if (stage === 'Lost') { opp.closed = today(); opp.outcome = 'lost'; }
    else { opp.closed = null; opp.outcome = null; }

    /* The stage is the truth about the deal, so the cars in play follow it —
       upwards only, and never over a deliberate "not for them". */
    var moved = [];
    var want = STAGE_MARK[stage];
    if (want && client) {
      (opp.inplay || []).forEach(function (sid) {
        var now = markOf(client, sid);
        if (now === 'rejected' || now === 'bought') return;
        if ((MARK_RANK[now] || 0) >= MARK_RANK[want]) return;
        addMark(client, sid, want, null);
        moved.push(sid);
      });
    }
    return { opp: opp, marks: moved };
  }

  /* Winning an opportunity is the moment it leaves the pipeline: the sale is
     written onto the customer and the opportunity becomes history. */
  function winOpp(opp, client, stockId, price, when) {
    if (!stockId) return { error: 'Pick which car they actually bought.' };
    opp.stage = 'Won';
    opp.outcome = 'won';
    opp.won_car = stockId;
    opp.won_price = price || null;
    opp.closed = when || today();
    opp.updated = opp.closed;
    if (client) {
      client.purchased = client.purchased || [];
      client.purchased.push({ stock_id: stockId, price: price || null, when: opp.closed, opp: opp.id });
      client.last_touch = opp.closed;
    }
    /* Winning it opens the transfer file. Nobody has to remember to start one,
       and the fourteen-day clock starts ticking from this date. */
    startProc(opp, opp.closed);
    return { opp: opp };
  }

  /* ================= PROCESSING =================
     Selling the car is half the job. The other half is the paperwork that moves
     the car into the buyer's name, and it runs on two statutory clocks:

       * Forms 29 and 30 go to the RTO within 14 days of the sale;
       * the insurance is endorsed to the new owner within 14 days too. Miss it
         and only third-party cover carries over — an own-damage claim on the
         car they just bought is refused. That is the one that bites.

     So processing is not a checklist, it is a deadline. It is also NOT a second
     record: it is a later phase of the same opportunity, so the customer's file,
     the car and the salesperson all stay attached without being copied. */

  var PROC_STAGES = ['Payment', 'Papers', 'Handover', 'RC transfer', 'Insurance', 'Completed'];

  var PROC_HELP = {
    'Payment':    'Paid in full, or the financier has disbursed.',
    'Papers':     'Forms 29 and 30 signed, old RC and the loan NOC in hand.',
    'Handover':   'Car, keys and papers given to the customer.',
    'RC transfer':'Filed at the RTO and waiting for the new registration certificate.',
    'Insurance':  'Policy endorsed into the new owner\'s name.',
    'Completed':  'Smart card received and handed over. Nothing outstanding.'
  };

  /* What a stage cannot be left without. The paperwork and the stage are the
     same fact, so the upload is what moves the deal — not a tick box beside it. */
  var PROC_NEEDS = {
    'Payment':     ['invoice'],
    'Papers':      ['kyc_id', 'form2930'],
    'Handover':    ['delivery_note'],
    'RC transfer': ['new_rc'],
    'Insurance':   ['new_insurance'],
    'Completed':   []
  };

  var STATUTORY_DAYS = 14;

  /* Documents against the DEAL — the buyer's side of the transfer. */
  var DEAL_DOCS = [
    { key: 'invoice',       label: 'Sale invoice or agreement', group: 'Money' },
    { key: 'loan_docs',     label: 'Finance documents',         group: 'Money', when: 'Only if they are financing.' },
    { key: 'kyc_id',        label: 'Buyer ID — Aadhaar or PAN',  group: 'The buyer' },
    { key: 'kyc_address',   label: 'Buyer address proof',        group: 'The buyer' },
    { key: 'form2930',      label: 'Signed Form 29 & Form 30',   group: 'Transfer', when: 'Both, within 14 days of the sale.' },
    { key: 'delivery_note', label: 'Delivery note, signed',      group: 'Transfer' },
    { key: 'new_rc',        label: 'New RC — buyer\'s name',      group: 'Transfer' },
    { key: 'new_insurance', label: 'New insurance policy',       group: 'Transfer' }
  ];

  /* Documents against the CAR — what came in with it, and what a buyer will ask
     to see before they hand over money. */
  var CAR_DOCS = [
    { key: 'rc_old',        label: 'Registration certificate',   group: 'Ownership' },
    { key: 'noc_form35',    label: 'Loan NOC / Form 35',         group: 'Ownership', when: 'Only if the car was hypothecated.' },
    { key: 'insurance_old', label: 'Insurance policy',           group: 'Ownership' },
    { key: 'puc',           label: 'PUC certificate',            group: 'Ownership' },
    { key: 'inspection',    label: 'Inspection report',          group: 'Condition' },
    { key: 'service_book',  label: 'Service history',            group: 'Condition' }
  ];

  function docTypes(kind) { return kind === 'car' ? CAR_DOCS : DEAL_DOCS; }
  function docLabel(kind, key) {
    var d = docTypes(kind).filter(function (x) { return x.key === key; })[0];
    return (d && d.label) || key;
  }

  /* One uploaded file. A photographed document is kept and shown; anything else
     is recorded by name and size and NOT stored — the demo says so rather than
     pretending, exactly as it does for a walkaround video. */
  function newDoc(o) {
    o = o || {};
    return {
      id: o.id || 'doc' + Date.now() + Math.floor(Math.random() * 1000),
      type: o.type || null,
      name: o.name || '',
      size: o.size || 0,
      mime: o.mime || '',
      data: o.data || null,          // a data URL for an image, null otherwise
      by: o.by || null,
      when: o.when || today(),
      note: o.note || ''
    };
  }

  function docsOf(holder) { return (holder && holder.docs) || []; }
  function hasDoc(holder, type) {
    return docsOf(holder).some(function (d) { return d.type === type; });
  }
  function missingDocs(holder, types) {
    return (types || []).filter(function (t) { return !hasDoc(holder, t); });
  }

  function newProc(o) {
    o = o || {};
    return {
      stage: o.stage || PROC_STAGES[0],
      started: o.started || today(),
      docs: o.docs || [],
      handed_over: o.handed_over || null,
      rc_no: o.rc_no || null,
      done: o.done || null
    };
  }

  function isProcessing(opp) {
    return !!(opp && opp.proc && opp.proc.stage !== 'Completed');
  }
  function procDeals(opps) { return (opps || []).filter(isProcessing); }

  /* Both clocks run from the sale, not from the stage. */
  function procDue(opp) {
    if (!opp || !opp.proc) return null;
    var from = opp.closed || opp.proc.started;
    return addDays(from, STATUTORY_DAYS);
  }
  /* Date arithmetic in UTC, deliberately.

     Parsing '2026-09-01T00:00:00' gives LOCAL midnight; toISOString() then
     converts back to UTC, and in IST that lands on the previous day. A sale on
     the 1st came out due on the 14th rather than the 15th — every deadline in
     the country a day early. Both ends stay in UTC so the arithmetic is on
     calendar days and nothing else. */
  function addDays(iso, n) {
    var t = new Date(String(iso) + 'T00:00:00Z');
    if (isNaN(t.getTime())) return null;
    t.setUTCDate(t.getUTCDate() + n);
    return t.toISOString().slice(0, 10);
  }
  function daysLeft(iso, from) {
    if (!iso) return null;
    var a = new Date(String(from || today()) + 'T00:00:00Z');
    var b = new Date(String(iso) + 'T00:00:00Z');
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    return Math.round((b - a) / 86400000);
  }

  /* Red only where it is actually a problem: the two statutory steps, once the
     fourteen days have run out and the document still is not in. */
  function procOverdue(opp, today_) {
    if (!isProcessing(opp)) return false;
    var left = daysLeft(procDue(opp), today_);
    if (left === null || left >= 0) return false;
    return missingDocs(opp.proc, ['new_rc', 'new_insurance']).length > 0;
  }

  function procProgress(opp) {
    if (!opp || !opp.proc) return { done: 0, total: PROC_STAGES.length - 1, pct: 0 };
    var i = PROC_STAGES.indexOf(opp.proc.stage);
    var total = PROC_STAGES.length - 1;
    var done = i < 0 ? 0 : i;
    return { done: done, total: total, pct: Math.round(100 * done / total) };
  }

  /* Opening the processing file is what winning a deal does now. */
  function startProc(opp, when) {
    if (!opp || opp.outcome !== 'won') return { error: 'Only a won deal goes into processing.' };
    if (opp.proc) return { proc: opp.proc };
    opp.proc = newProc({ started: when || opp.closed || today() });
    return { proc: opp.proc };
  }

  /* The paperwork gates the stage. Refusing with the name of the missing
     document is the whole point — "you cannot hand the car over without a
     signed delivery note" is a sentence, not an error code. */
  function moveProc(opp, stage) {
    if (!opp || !opp.proc) return { error: 'This deal has no processing file.' };
    var from = PROC_STAGES.indexOf(opp.proc.stage);
    var to = PROC_STAGES.indexOf(stage);
    if (to < 0) return { error: 'There is no ' + stage + ' stage.' };
    if (to === from) return { opp: opp };
    if (to > from) {
      /* everything up to the stage being left must be in */
      for (var i = from; i < to; i++) {
        var miss = missingDocs(opp.proc, PROC_NEEDS[PROC_STAGES[i]]);
        if (miss.length) {
          return { error: PROC_STAGES[i] + ' still needs ' + miss.map(function (m) {
            return docLabel('deal', m).toLowerCase();
          }).join(' and ') + '.' };
        }
      }
    }
    opp.proc.stage = stage;
    opp.updated = today();
    if (stage === 'Handover' && !opp.proc.handed_over) opp.proc.handed_over = today();
    if (stage === 'Completed') opp.proc.done = today();
    return { opp: opp };
  }

  function loseOpp(opp, reason, when) {
    opp.stage = 'Lost';
    opp.outcome = 'lost';
    opp.lost_reason = reason || null;
    opp.closed = when || today();
    opp.updated = opp.closed;
    return { opp: opp };
  }

  /* ---------------- follow-ups ----------------
     Every conversation gets written down: when it happened, how, what was said,
     and when to come back. An opportunity without a next date is the one that
     goes quiet, so the board can flag it. */

  var FOLLOW_METHODS = ['Call', 'WhatsApp', 'Showroom visit', 'Test drive', 'Email', 'Walk-in'];
  var FOLLOW_OUTCOMES = [
    'Going well — still keen',
    'Wants time to think',
    'Asked for a better price',
    'Waiting on finance',
    'Comparing with another dealer',
    'Could not reach them',
    'Cooling off — at risk',
    'Ready to book'
  ];
  /* Outcomes that mean the deal is slipping away. The board shows these loudly
     because that is the moment you can still save it. */
  var AT_RISK = ['Cooling off — at risk', 'Comparing with another dealer', 'Could not reach them'];

  function newFollow(o) {
    o = o || {};
    return {
      id: o.id || 'f' + Date.now() + Math.floor(Math.random() * 1000),
      opp: o.opp || null, client: o.client || null, owner: o.owner || null,
      car: o.car || null,             // which car this conversation was about
      due: o.due || today(),          // when to come back
      method: o.method || 'Call',
      note: o.note || '',             // what was actually discussed
      outcome: o.outcome || null,
      done: !!o.done, done_at: o.done_at || null,
      created: o.created || today(),
      by: o.by || null
    };
  }

  function followsFor(list, key, id) {
    return (list || []).filter(function (f) { return f[key] === id; })
      .sort(function (a, b) { return String(b.due).localeCompare(String(a.due)); });
  }
  function openFollows(list) { return (list || []).filter(function (f) { return !f.done; }); }

  function isOverdue(f, now) {
    return !f.done && String(f.due) < (now || today());
  }
  function isDueToday(f, now) {
    return !f.done && String(f.due) === (now || today());
  }

  /* ---------------- scoring a follow-up note ----------------
     A rating out of ten for what the salesperson actually wrote down, so a
     manager can see who is having real conversations and who is typing "called,
     no answer" fifty times. Deliberately a transparent rule set rather than a
     black box — the UI shows exactly which marks were earned and which were not,
     because a score nobody can argue with is a score nobody trusts. */

  var NOTE_RULES = [
    ['Enough detail to be useful', 2, function (t) {
      var w = t.trim().split(/\s+/).filter(Boolean).length;
      return w >= 25 ? 2 : w >= 12 ? 1 : 0;
    }],
    ['Names the car they discussed', 2, function (t, ctx) {
      var names = (ctx.carNames || []).filter(function (n) {
        return n && t.toLowerCase().indexOf(String(n).toLowerCase()) >= 0;
      });
      if (names.length) return 2;
      return /\b(car|vehicle|suv|sedan|model|variant)\b/i.test(t) ? 1 : 0;
    }],
    ['Records a number — price, EMI, kilometres', 1, function (t) {
      return /\d[\d,.]*\s*(lakh|l\b|cr|crore|k\b|km|%|₹)|₹\s*\d/i.test(t) ? 1 : 0;
    }],
    ['Captures what the customer said or wants', 2, function (t) {
      return /\b(said|wants|asked|prefers|worried|likes|liked|thinks|feels|needs|concern|budget|compare|comparing|objection)\b/i.test(t)
        ? 2 : 0;
    }],
    ['Sets up a clear next step', 2, function (t) {
      return /\b(will|next|call back|follow up|send|share|bring|visit|come|book|schedule|revert|confirm|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|saturday)\b/i.test(t)
        ? 2 : 0;
    }],
    ['An outcome was chosen', 1, function (t, ctx) { return ctx.outcome ? 1 : 0; }]
  ];

  function scoreNote(text, ctx) {
    ctx = ctx || {};
    var t = String(text || '');
    if (!t.trim()) {
      return { score: 0, max: 10, band: 'bad', marks: NOTE_RULES.map(function (r) {
        return { label: r[0], got: 0, max: r[1] };
      }), verdict: 'Nothing was written down.' };
    }
    var marks = NOTE_RULES.map(function (r) {
      var got = 0;
      try { got = Math.min(r[1], r[2](t, ctx) || 0); } catch (e) { got = 0; }
      return { label: r[0], got: got, max: r[1] };
    });
    var score = marks.reduce(function (a, m) { return a + m.got; }, 0);
    return {
      score: score, max: 10, marks: marks,
      band: score >= 8 ? 'ok' : score >= 5 ? 'warn' : 'bad',
      verdict: score >= 8 ? 'A proper record of the conversation.'
             : score >= 5 ? 'Usable, but thin in places.'
             : 'Too vague for anyone else to act on.'
    };
  }

  /* A salesperson's average, for the reports screen. */
  function noteAverage(follows, userId, cars) {
    var names = (cars || []).map(function (c) { return c.model; });
    var done = (follows || []).filter(function (f) {
      return f.done && f.note && (!userId || (f.by || f.owner) === userId);
    });
    if (!done.length) return null;
    var total = done.reduce(function (a, f) {
      return a + scoreNote(f.note, { outcome: f.outcome, carNames: names }).score;
    }, 0);
    return Math.round(10 * total / done.length) / 10;
  }

  /* The next thing owed to this opportunity, soonest first. */
  function nextFollow(list, oppId) {
    return (list || []).filter(function (f) { return f.opp === oppId && !f.done; })
      .sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); })[0] || null;
  }

  function atRisk(list, oppId) {
    var done = (list || []).filter(function (f) { return f.opp === oppId && f.done && f.outcome; })
      .sort(function (a, b) { return String(b.done_at).localeCompare(String(a.done_at)); })[0];
    return !!(done && AT_RISK.indexOf(done.outcome) >= 0);
  }

  /* An opportunity with nothing booked in is how deals die quietly. */
  function needsAttention(opps, follows, now) {
    return (opps || []).filter(isOpen).filter(function (o) {
      var n = nextFollow(follows, o.id);
      return !n || isOverdue(n, now);
    });
  }


  /* What a salesperson needs on screen before opening a second opportunity for
     somebody who has already bought from us. */
  function clientSummary(client, opps, cars) {
    var byId = {};
    (cars || []).forEach(function (c) { byId[c.stock_id] = c; });
    var mine = oppsFor(opps, client.id);
    var bought = (client.purchased || []).map(function (p) {
      return Object.assign({}, p, { car: byId[p.stock_id] || null });
    });
    return {
      bought: bought,
      spent: bought.reduce(function (a, p) { return a + (p.price || 0); }, 0),
      open: mine.filter(isOpen),
      closed: mine.filter(function (o) { return !isOpen(o); }),
      won: mine.filter(function (o) { return o.outcome === 'won'; }).length,
      lost: mine.filter(function (o) { return o.outcome === 'lost'; }).length,
      wishlist: (client.wishlist || []).map(function (s) { return byId[s]; }).filter(Boolean),
      shown: (client.shown || []).map(function (s) {
        return { mark: s.mark, when: s.when, car: byId[s.stock_id] || null };
      }).filter(function (s) { return s.car; })
    };
  }

  /* A returning buyer is worth more than a first-timer, and the floor should see
     that before they speak. Derived, never stored. */
  function clientTier(client, opps) {
    var spent = (client.purchased || []).reduce(function (a, p) { return a + (p.price || 0); }, 0);
    var n = (client.purchased || []).length;
    if (spent >= 10000000 || n >= 3) return ['Premium', 'em'];
    if (n >= 1) return ['Returning', 'ok'];
    if (openOppsFor(opps, client.id).length) return ['Active', 'info'];
    return ['Prospect', 'dim'];
  }


  /* ================= DATES, RANGES AND TARGETS =================
     Anywhere a screen shows more than a handful of rows it carries the same
     date control, so "this month" means the same thing everywhere. Dates are
     plain YYYY-MM-DD strings throughout — they compare correctly as text and
     never pick up a timezone on the way. */

  var RANGES = [
    ['today', 'Today'], ['week', 'This week'], ['month', 'This month'],
    ['last', 'Last month'], ['quarter', 'This quarter'], ['year', 'This year'],
    ['all', 'All time'], ['custom', 'Custom…']
  ];

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseISO(s) {
    var p = String(s || '').slice(0, 10).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function monthKey(s) { return String(s || '').slice(0, 7); }

  /* A range key becomes a pair of inclusive YYYY-MM-DD bounds. */
  function rangeDates(key, from, to, now) {
    var d = now ? parseISO(now) : new Date();
    var y = d.getFullYear(), m = d.getMonth();
    switch (key) {
      case 'today':   return [iso(d), iso(d)];
      case 'week': {
        var back = (d.getDay() + 6) % 7;          // weeks start Monday
        var s0 = new Date(y, m, d.getDate() - back);
        return [iso(s0), iso(d)];
      }
      case 'month':   return [iso(new Date(y, m, 1)), iso(d)];
      case 'last':    return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
      case 'quarter': return [iso(new Date(y, Math.floor(m / 3) * 3, 1)), iso(d)];
      case 'year':    return [iso(new Date(y, 0, 1)), iso(d)];
      case 'custom':  return [from || '1970-01-01', to || iso(d)];
      default:        return ['1970-01-01', '2999-12-31'];
    }
  }

  function rangeLabel(r) {
    var named = RANGES.filter(function (x) { return x[0] === r.key; })[0];
    if (r.key === 'custom') return r.from + ' to ' + r.to;
    if (r.key === 'all') return 'All time';
    return (named ? named[1] : r.key) + ' (' + r.from + ' to ' + r.to + ')';
  }

  function inRange(dateStr, r) {
    if (!dateStr) return false;
    if (!r || r.key === 'all') return true;
    var d = String(dateStr).slice(0, 10);
    return d >= r.from && d <= r.to;
  }

  /* How many whole months a range spans, so a monthly target can be pro-rated
     rather than compared against a quarter and looking like a catastrophe. */
  function monthsIn(r) {
    if (!r || r.key === 'all') return 12;
    var a = parseISO(r.from), b = parseISO(r.to);
    var months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    /* Divide by the real length of the closing month, not a flat 30, or a whole
       calendar August comes out as 1.03 months and a perfect score reads 97%. */
    var daysInEnd = new Date(b.getFullYear(), b.getMonth() + 1, 0).getDate();
    return Math.max(0.03, months + (b.getDate() - a.getDate() + 1) / daysInEnd);
  }

  /* Monthly target per salesperson. The owner changes these in the console. */
  /* Pitched at the real run-rate — 19 cars in eight months across two people —
     so the dashboard shows a mix of green and amber rather than a wall of red. */
  var DEFAULT_TARGETS = {
    u3: { units: 2, value: 8000000 },
    u4: { units: 2, value: 6000000 }
  };

  function salesFor(sales, userId, r) {
    return (sales || []).filter(function (s) {
      if (userId && s.by !== userId) return false;
      return inRange(s.at, r);
    });
  }

  function targetProgress(sales, userId, target, r) {
    var rows = salesFor(sales, userId, r);
    var units = rows.length;
    var value = rows.reduce(function (a, s) { return a + (s.price || 0); }, 0);
    var mul = monthsIn(r);
    var tUnits = (target && target.units ? target.units : 0) * mul;
    var tValue = (target && target.value ? target.value : 0) * mul;
    /* A window shorter than a few days pro-rates to a target below one car.
       Scoring against that is meaningless, so say nothing rather than red. */
    var judgeable = tUnits >= 1;
    return {
      units: units, value: value,
      targetUnits: Math.round(tUnits), targetValue: Math.round(tValue),
      unitsPct: judgeable ? Math.round(100 * units / tUnits) : null,
      valuePct: judgeable && tValue ? Math.round(100 * value / tValue) : null,
      tooShort: !judgeable && !!(target && target.units),
      months: mul, sales: rows
    };
  }

  function band(pct) {
    if (pct === null || pct === undefined) return 'dim';
    if (pct >= 100) return 'ok';
    if (pct >= 70) return 'warn';
    return 'bad';
  }

  /* One salesperson's line in a report, for whatever window is selected. */
  function personStats(D, userId, cars, r) {
    var clients = (D.clients || []).filter(function (c) { return c.assigned_to === userId; });
    var fresh = clients.filter(function (c) { return inRange(c.created, r); });
    var touched = clients.filter(function (c) { return inRange(c.last_touch, r); });
    var visits = (D.opportunities || []).filter(function (o) {
      return o.assigned_to === userId && inRange(o.created, r);
    });
    var prog = targetProgress(D.sales, userId, (D.targets || {})[userId], r);
    var shown = clients.reduce(function (a, c) {
      return a + (c.shown || []).filter(function (x) { return inRange(x.when, r); }).length;
    }, 0);
    /* "Open" means they have a live opportunity — a customer has no stage of
       their own any more, so counting one here silently made everybody open. */
    var open = clients.filter(function (c) {
      return openOppsFor(D.opportunities, c.id).length > 0;
    }).length;
    return {
      user: staffById(userId),
      clients: clients.length, newClients: fresh.length, touched: touched.length,
      open: open, visits: visits.length, carsShown: shown,
      sales: prog.units, value: prog.value,
      target: prog, conversion: fresh.length ? Math.round(100 * prog.units / fresh.length) : null,
      follow: (D.followups || []).filter(function (f) { return f.owner === userId && !f.done; }).length,
      noteScore: noteAverage((D.followups || []).filter(function (f) { return inRange(f.done_at, r); }),
                             userId, cars)
    };
  }


  /* ================= THE FIELD REGISTRY =================
     What a pre-owned buyer looks for, as editable fields rather than a fixed
     checklist. Completeness walks this, so filling a field in the console moves
     the score immediately. A value lives at car[key], or car.extra[key] once
     someone has added it by hand. */

  function nonEmpty(v) {
    return !(v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length));
  }

  var FUELS = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
  var BODIES = ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Coupe', 'Convertible', 'Pickup'];
  var YESNO = ['Yes', 'No'];

  var FIELDS = [
    /* Identity */
    { key: 'stock_id',  label: 'Dealer stock number', group: 'Identity', type: 'text', own: false },
    { key: 'make',      label: 'Make',                group: 'Identity', type: 'text' },
    { key: 'model',     label: 'Model',               group: 'Identity', type: 'text' },
    { key: 'variant',   label: 'Variant',             group: 'Identity', type: 'text' },
    { key: 'year',      label: 'Manufacture year',    group: 'Identity', type: 'number' },
    { key: 'reg_year',  label: 'Registration year',   group: 'Identity', type: 'number' },
    { key: 'reg_no',    label: 'Registration number', group: 'Identity', type: 'text' },
    { key: 'reg_state', label: 'Registration state',  group: 'Identity', type: 'text' },

    /* Body & colour */
    { key: 'body_type', label: 'Body style',          group: 'Body & colour', type: 'select', options: BODIES },
    { key: 'colour',    label: 'Exterior colour',     group: 'Body & colour', type: 'text' },
    { key: 'interior',  label: 'Interior colour',     group: 'Body & colour', type: 'text' },
    { key: 'doors',     label: 'Doors',               group: 'Body & colour', type: 'number' },
    { key: 'seats',     label: 'Seats',               group: 'Body & colour', type: 'number' },

    /* Engine & drivetrain */
    { key: 'fuel',         label: 'Fuel type',        group: 'Engine & drivetrain', type: 'select', options: FUELS },
    { key: 'engine_cc',    label: 'Engine capacity',  group: 'Engine & drivetrain', type: 'number', unit: 'cc' },
    { key: 'cylinders',    label: 'Cylinders',        group: 'Engine & drivetrain', type: 'number' },
    { key: 'power_bhp',    label: 'Power',            group: 'Engine & drivetrain', type: 'number', unit: 'bhp' },
    { key: 'torque_nm',    label: 'Torque',           group: 'Engine & drivetrain', type: 'number', unit: 'Nm' },
    { key: 'transmission', label: 'Transmission',     group: 'Engine & drivetrain', type: 'select', options: ['Manual', 'Automatic'] },
    { key: 'gears',        label: 'Number of gears',  group: 'Engine & drivetrain', type: 'number' },
    { key: 'drivetrain',   label: 'Drive type',       group: 'Engine & drivetrain', type: 'select', options: ['FWD', 'RWD', 'AWD', '4x4', '4x2'] },
    { key: 'emission',     label: 'Emission norm',    group: 'Engine & drivetrain', type: 'select', options: ['BS4', 'BS6', 'BS6 Phase 2'] },
    { key: 'economy',      label: 'Fuel economy',     group: 'Engine & drivetrain', type: 'number', unit: 'km/l' },

    /* Dimensions */
    { key: 'boot',      label: 'Boot space',          group: 'Dimensions', type: 'number', unit: 'litres' },
    { key: 'tank',      label: 'Fuel tank',           group: 'Dimensions', type: 'number', unit: 'litres' },
    { key: 'clearance', label: 'Ground clearance',    group: 'Dimensions', type: 'number', unit: 'mm' },
    { key: 'wheelbase', label: 'Wheelbase',           group: 'Dimensions', type: 'number', unit: 'mm' },

    /* History & papers */
    { key: 'km',           label: 'Kilometres driven',  group: 'History & papers', type: 'number', unit: 'km' },
    { key: 'owners',       label: 'Number of owners',   group: 'History & papers', type: 'number' },
    { key: 'inspection',   label: 'Inspection score',   group: 'History & papers', type: 'number', unit: '/ 200' },
    { key: 'accident',     label: 'Accident history',   group: 'History & papers', type: 'select', options: ['None reported', 'Minor, repaired', 'Major, repaired'] },
    { key: 'service',      label: 'Service history',    group: 'History & papers', type: 'select', options: ['Full — authorised', 'Partial', 'None'] },
    { key: 'insurance',    label: 'Insurance status',   group: 'History & papers', type: 'select', options: ['Comprehensive', 'Third-party', 'Expired'] },
    { key: 'insurance_to', label: 'Insurance expiry',   group: 'History & papers', type: 'date' },
    { key: 'warranty',     label: 'Warranty',           group: 'History & papers', type: 'text' },
    { key: 'rc_status',    label: 'RC status',          group: 'History & papers', type: 'select', options: ['Clear', 'In transfer', 'Pending'] },
    { key: 'hypo',         label: 'Hypothecation',      group: 'History & papers', type: 'select', options: ['None', 'Bank — to be cleared', 'Cleared'] },
    { key: 'tyres',        label: 'Tyre condition',     group: 'History & papers', type: 'text' },
    { key: 'keys',         label: 'Number of keys',     group: 'History & papers', type: 'number' },

    /* Description */
    { key: 'description', label: 'Written description', group: 'Description', type: 'textarea' },
    { key: 'features',    label: 'Feature list',        group: 'Description', type: 'textarea' },
    { key: 'safety',      label: 'Safety kit',          group: 'Description', type: 'textarea' },

    /* Pricing */
    { key: 'price',      label: 'Listed price',      group: 'Pricing', type: 'number', unit: '₹' },
    { key: 'offer',      label: 'Offer price',       group: 'Pricing', type: 'number', unit: '₹' },
    { key: 'emi',        label: 'EMI shown',         group: 'Pricing', type: 'number', unit: '₹/mo', own: false },
    { key: 'finance',    label: 'Finance available', group: 'Pricing', type: 'select', options: YESNO },
    { key: 'rto_cost',   label: 'RTO transfer cost', group: 'Pricing', type: 'number', unit: '₹' },
    { key: 'booking',    label: 'Booking amount',    group: 'Pricing', type: 'number', unit: '₹' },
    { key: 'price_ok',   label: 'Price is plausible', group: 'Pricing', type: 'derived',
      pred: function (c) { return !c.price_corrected; } },

    /* Availability */
    { key: 'availability', label: 'Availability status', group: 'Availability', type: 'select', options: ['Available', 'Reserved', 'Sold'], own: false },
    { key: 'branch',       label: 'Showroom',            group: 'Availability', type: 'text', own: false },

    /* Media */
    { key: 'photos10', label: 'At least 10 photos',  group: 'Media', type: 'derived',
      pred: function (c) { return (c.n_photos || 0) >= 10; } },
    { key: 'photos20', label: 'At least 20 photos',  group: 'Media', type: 'derived',
      pred: function (c) { return (c.n_photos || 0) >= 20; } },
    { key: 'odo_photo', label: 'Odometer photograph', group: 'Media', type: 'select', options: YESNO },
    { key: 'video',     label: 'Walkaround video',    group: 'Media', type: 'text' },
    { key: 'spin360',   label: '360° exterior',       group: 'Media', type: 'select', options: YESNO }
  ];

  var FIELD_GROUPS = FIELDS.reduce(function (a, f) {
    if (a.indexOf(f.group) < 0) a.push(f.group);
    return a;
  }, []);

  function fieldByKey(k) { return FIELDS.filter(function (f) { return f.key === k; })[0] || null; }

  /* The one value lookup: the record itself, then anything added by hand.

     `own: false` marks a field Car Cart does not actually publish — the value on
     the record came from our own demo layer (a minted stock number, an invented
     availability, an EMI we calculated). Counting those as "what the buyer is
     told" would flatter the score, so they only count once somebody fills them
     in for real, which lands in `extra`. */
  function fieldValue(car, f) {
    if (!car) return null;
    var x = car.extra || {};
    if (nonEmpty(x[f.key])) return x[f.key];
    if (f.own === false) return null;
    return nonEmpty(car[f.key]) ? car[f.key] : null;
  }

  function hasField(car, f) {
    if (f.pred) { try { return !!f.pred(car); } catch (e) { return false; } }
    return nonEmpty(fieldValue(car, f));
  }

  function scoreRecord(c) {
    var present = [], missing = [];
    FIELDS.forEach(function (f) { (hasField(c, f) ? present : missing).push(f.label); });
    return { total: FIELDS.length, present: present.length,
             missing: missing, presentList: present,
             pct: Math.round(100 * present.length / FIELDS.length) };
  }

  /* Write one field onto a car and hand back an audit line. Editable fields only. */
  function setField(car, key, value) {
    var f = fieldByKey(key);
    if (!f) return { error: 'Unknown field.' };
    if (f.locked) return { error: 'That field is set by the system.' };
    if (f.type === 'derived') return { error: 'That one is worked out, not typed in.' };
    if (f.type === 'number' && value !== '' && value !== null && isNaN(Number(value)))
      return { error: 'That field takes a number.' };

    var before = fieldValue(car, f);
    var v = (f.type === 'number' && value !== '' && value !== null) ? Number(value) : value;
    if (!nonEmpty(v)) v = null;

    if (f.key === 'availability') { car.demo = car.demo || {}; car.demo.availability = v; car.availability = v; }
    else if (Object.prototype.hasOwnProperty.call(car, f.key)) car[f.key] = v;
    else { car.extra = car.extra || {}; car.extra[f.key] = v; }

    return { field: f, before: before, after: v };
  }


  /* ================= CUSTOMERS =================
     The mobile number is the identity. A storefront wishlist, a walk-in and a
     WhatsApp enquiry from the same number are one person. */

  var MARKS = {
    interested:  'Interested',
    test_drove:  'Test drove',
    negotiating: 'Negotiating',
    booked:      'Booked',
    bought:      'Bought',
    rejected:    'Not for them'
  };

  var SOURCES = {
    walkin: 'Walk-in', whatsapp: 'WhatsApp', instagram: 'Instagram',
    google: 'Google', meta: 'Meta ad', referral: 'Referral', website: 'Website'
  };

  function normMobile(m) { return String(m || '').replace(/\D/g, '').slice(-10); }
  function validMobile(m) { return /^[6-9]\d{9}$/.test(normMobile(m)); }
  function validName(n) { return String(n || '').trim().length >= 2; }

  function findByMobile(clients, mobile) {
    var id = normMobile(mobile);
    return clients.filter(function (c) { return c.mobile === id; })[0] || null;
  }

  function newClient(o) {
    o = o || {};
    return {
      id: o.id || 'c' + Date.now() + Math.floor(Math.random() * 1000),
      name: String(o.name || '').trim(),
      mobile: normMobile(o.mobile),
      email: o.email || '',
      source: o.source || 'walkin',
      assigned_to: o.assigned_to || null,
      branch: o.branch || 'b1',
      /* No stage here on purpose — a stage belongs to an opportunity, not a
         person. See newOpp(). */
      budget_min: o.budget_min || null,
      budget_max: o.budget_max || null,
      wants: Object.assign({ bodies: [], fuels: [], makes: [], year_min: null }, o.wants || {}),
      trade_in: o.trade_in || null,
      finance: !!o.finance,
      consent: o.consent !== false,
      created: o.created || today(),
      last_touch: o.last_touch || today(),
      shown: o.shown || [],
      wishlist: o.wishlist || [],
      purchased: o.purchased || [],
      notes: o.notes || [],
      timeline: o.timeline || []
    };
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  /* Everything that creates a customer funnels through here, so one number can
     never become two records. */
  function upsertClient(clients, o) {
    if (!validName(o.name)) return { error: 'Please enter the customer\'s name.' };
    if (!validMobile(o.mobile)) return { error: 'Enter a 10-digit Indian mobile number.' };
    var found = findByMobile(clients, o.mobile);
    if (found) {
      if (o.name && o.name.length > found.name.length) found.name = o.name;
      ['email', 'assigned_to', 'budget_min', 'budget_max', 'trade_in'].forEach(function (k) {
        if (nonEmpty(o[k])) found[k] = o[k];
      });
      if (o.wants) {
        ['bodies', 'fuels', 'makes'].forEach(function (k) {
          (o.wants[k] || []).forEach(function (v) {
            if (found.wants[k].indexOf(v) < 0) found.wants[k].push(v);
          });
        });
        if (o.wants.year_min) found.wants.year_min = o.wants.year_min;
      }
      found.last_touch = today();
      return { client: found, created: false };
    }
    var c = newClient(o);
    clients.push(c);
    return { client: c, created: true };
  }

  /* One mark per car per client — re-marking replaces, never duplicates. */
  function addMark(client, stockId, mark, byId) {
    if (!MARKS[mark]) return { error: 'Unknown mark.' };
    var row = client.shown.filter(function (s) { return s.stock_id === stockId; })[0];
    if (row) { row.mark = mark; row.when = today(); row.by = byId; }
    else client.shown.push({ stock_id: stockId, mark: mark, when: today(), by: byId });
    if (mark === 'interested' && client.wishlist.indexOf(stockId) < 0) client.wishlist.push(stockId);
    if (mark === 'rejected') {
      var i = client.wishlist.indexOf(stockId);
      if (i >= 0) client.wishlist.splice(i, 1);
    }
    client.last_touch = today();
    return { client: client, mark: mark };
  }

  function markOf(client, stockId) {
    var r = (client.shown || []).filter(function (s) { return s.stock_id === stockId; })[0];
    return r ? r.mark : null;
  }

  /* What the customer is worth to look at: everything they have shown interest in. */
  function clientValue(client, cars) {
    var byId = {};
    cars.forEach(function (c) { byId[c.stock_id] = c; });
    var ids = {};
    (client.wishlist || []).forEach(function (s) { ids[s] = 1; });
    (client.shown || []).forEach(function (s) { if (s.mark !== 'rejected') ids[s.stock_id] = 1; });
    return Object.keys(ids).reduce(function (a, s) { return a + ((byId[s] || {}).price || 0); }, 0);
  }

  /* Cars in stock that answer what this customer said they wanted. */
  function suggestFor(client, cars) {
    var w = client.wants || {};
    var seen = {};
    (client.shown || []).forEach(function (s) { seen[s.stock_id] = 1; });
    return cars.filter(function (c) {
      if (seen[c.stock_id]) return false;
      if (c.availability === 'Sold') return false;
      if (w.bodies && w.bodies.length && w.bodies.indexOf(c.body_type) < 0) return false;
      if (w.fuels && w.fuels.length && w.fuels.indexOf(c.fuel) < 0) return false;
      if (w.makes && w.makes.length && w.makes.indexOf(c.make) < 0) return false;
      if (w.year_min && c.year < w.year_min) return false;
      if (client.budget_max && c.price > client.budget_max * 1.1) return false;
      if (client.budget_min && c.price < client.budget_min * 0.8) return false;
      return true;
    });
  }


  /* ================= AUTOMATIONS =================
     The GHL shape the team already knows: Audience -> When -> Only if -> Then.
     One `kind` field on each action decides the whole internal/client-facing UX. */

  var TRIGGERS = {
    new_enquiry:     { label: 'A new enquiry arrives',              group: 'Enquiry',   cfg: { channel: ['any', 'WhatsApp', 'Instagram', 'Google', 'Meta ad', 'Website'] } },
    wa_reply:        { label: 'A customer replies on WhatsApp',     group: 'Enquiry',   cfg: {} },
    missed_call:     { label: 'A call is missed',                   group: 'Enquiry',   cfg: {} },
    form_submit:     { label: 'The website form is submitted',      group: 'Enquiry',   cfg: {} },

    walkin_logged:   { label: 'A walk-in is logged at the door',    group: 'Showroom',  cfg: {} },
    visit_end:       { label: 'A showroom visit ends',              group: 'Showroom',  cfg: { outcome: ['any', 'bought', 'left without buying'] } },
    test_drive:      { label: 'A test drive is',                    group: 'Showroom',  cfg: { state: ['booked', 'done', 'no-show'] } },
    shown_not_bought:{ label: 'Shown a car but did not buy, for',   group: 'Showroom',  cfg: { days: 'number' } },

    booking_taken:   { label: 'A booking amount is taken',          group: 'Buying',    cfg: {} },
    delivery_done:   { label: 'A car is delivered',                 group: 'Buying',    cfg: {} },
    finance_pending: { label: 'A finance file sits pending for',    group: 'Buying',    cfg: { hours: 'number' } },
    deal_lost:       { label: 'A deal is marked lost',              group: 'Buying',    cfg: {} },

    car_added:       { label: 'A car is added to stock',            group: 'Stock',     cfg: {} },
    matches_want:    { label: 'A car arrives matching a saved requirement', group: 'Stock', cfg: {} },
    price_drop:      { label: 'The price drops on a saved car',     group: 'Stock',     cfg: {} },
    aged_stock:      { label: 'A car has been unsold for',          group: 'Stock',     cfg: { days: 'number' } },
    thin_listing:    { label: 'A listing is missing photos or a description', group: 'Stock', cfg: { min_photos: 'number' } },

    service_due:     { label: 'Service is due after',               group: 'Aftercare', cfg: { months: 'number' } },
    upgrade_due:     { label: 'A car we sold reaches',              group: 'Aftercare', cfg: { years: 'number', km: 'number' } },
    papers_expiring: { label: 'Insurance or RC on stock expires in', group: 'Aftercare', cfg: { days: 'number' } },

    no_contact:      { label: 'An open lead goes untouched for',    group: 'Team',      cfg: { days: 'number' } },
    behind_target:   { label: 'The showroom is behind target by',   group: 'Team',      cfg: { pct: 'number' } },
    schedule:        { label: 'Every day at',                       group: 'Team',      cfg: { at: 'time' } }
  };

  var ACTS = {
    notify_person: { label: 'Notify one person',           kind: 'internal', cfg: { who: 'staff', text: 'text' } },
    notify_role:   { label: 'Notify everyone in a role',   kind: 'internal', cfg: { role: 'role', text: 'text' } },
    followup:      { label: 'Put a follow-up on their salesperson', kind: 'internal', cfg: { due_in_days: 'number', text: 'text' } },
    assign:        { label: 'Assign the customer',         kind: 'internal', cfg: { who: 'staff' } },
    wait:          { label: 'Wait',                        kind: 'internal', cfg: { hours: 'number' } },
    wa_template:   { label: 'Send an approved WhatsApp template', kind: 'client', cfg: { template: 'text' } },
    wa_text:       { label: 'Send a WhatsApp message',     kind: 'client',   cfg: { text: 'text' } },
    review_request:{ label: 'Ask for a Google review',     kind: 'client',   cfg: {} },
    audience:      { label: 'Add to a campaign audience',  kind: 'client',   cfg: { name: 'text' } }
  };

  /* One client-facing step makes the whole rule client-facing. */
  function autoKind(a) {
    return (a.actions || []).some(function (x) {
      return ACTS[x.type] && ACTS[x.type].kind === 'client';
    }) ? 'client' : 'internal';
  }

  /* Who this rule would reach today. Counting only — nothing is ever sent. */
  function audienceOf(a, clients) {
    if (autoKind(a) === 'internal') return [];
    return clients.filter(function (c) {
      if (a.stages && a.stages.length && a.stages.indexOf(c.stage) < 0) return false;
      if (a.sources && a.sources.length && a.sources.indexOf(c.source) < 0) return false;
      if (!c.consent) return false;
      return true;
    });
  }

  function validateAuto(a) {
    if (!a.name || !a.name.trim()) return 'Give the rule a name.';
    if (!a.trigger || !TRIGGERS[a.trigger.type]) return 'Pick what starts this rule.';
    if (!a.actions || !a.actions.length) return 'Add at least one step.';
    var bad = (a.actions || []).filter(function (x) { return !ACTS[x.type]; });
    if (bad.length) return 'One of the steps is not a real action.';
    if (autoKind(a) === 'client' && !(a.stages || []).length && !(a.sources || []).length)
      return 'This rule sends a message, so choose who it goes to — or switch the steps to internal ones.';
    return null;
  }

  /* A dry run: names the real audience, sends nothing. */
  function testAuto(a, clients) {
    var err = validateAuto(a);
    if (err) return { error: err };
    var aud = audienceOf(a, clients);
    return {
      kind: autoKind(a),
      audience: aud.length,
      steps: (a.actions || []).map(function (x) { return (ACTS[x.type] || {}).label || x.type; }),
      sent: 0
    };
  }


  /* ================= storefront accounts & wishlist =================
     Name + mobile only — what a walk-in will actually complete on a phone.
     The same mobile keys into the CRM, so a save here is a lead there. */

  var STORE_KEY = 'carcart_demo_v1';   /* shared with the public storefront (shop.js) */
  var APP_KEY = 'carcart_console_v2';

  function loadStore(storage) {
    try {
      var raw = storage.getItem(STORE_KEY);
      var d = raw ? JSON.parse(raw) : null;
      if (!d || typeof d !== 'object' || !d.users) return { users: {}, current: null };
      if (!d.hasOwnProperty('current')) d.current = null;
      return d;
    } catch (e) { return { users: {}, current: null }; }
  }
  function saveStore(storage, store) {
    try { storage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {}
    return store;
  }

  function signIn(store, name, mobile, when) {
    if (!validName(name)) return { error: 'Please enter your full name.' };
    if (!validMobile(mobile)) return { error: 'Enter a 10-digit Indian mobile number.' };
    var id = normMobile(mobile);
    var u = store.users[id];
    if (!u) u = store.users[id] = { mobile: id, name: String(name).trim(), wishlist: [], joined: when || null, seed: false };
    else u.name = String(name).trim();
    u.lastSeen = when || null;
    store.current = id;
    return { user: u };
  }
  function signOut(store) { store.current = null; return store; }
  function currentUser(store) { return store.current ? store.users[store.current] || null : null; }

  function toggleWish(store, stockId) {
    var u = currentUser(store);
    if (!u) return { error: 'signin' };
    var i = u.wishlist.indexOf(stockId);
    if (i < 0) u.wishlist.push(stockId); else u.wishlist.splice(i, 1);
    return { user: u, saved: i < 0 };
  }
  function isWished(store, stockId) {
    var u = currentUser(store);
    return !!(u && u.wishlist.indexOf(stockId) >= 0);
  }

  function saveCounts(store) {
    var out = {};
    Object.keys(store.users).forEach(function (id) {
      store.users[id].wishlist.forEach(function (s) { out[s] = (out[s] || 0) + 1; });
    });
    return out;
  }

  function customersWhoSaved(store, stockId) {
    return Object.keys(store.users).map(function (id) { return store.users[id]; })
      .filter(function (u) { return u.wishlist.indexOf(stockId) >= 0; })
      .map(function (u) { return { name: u.name, mobile: u.mobile, seed: !!u.seed,
                                   joined: u.joined || null, also: u.wishlist.length - 1 }; })
      .sort(function (a, b) { return b.also - a.also; });
  }

  function customerRows(store, cars) {
    var byId = {};
    cars.forEach(function (c) { byId[c.stock_id] = c; });
    return Object.keys(store.users).map(function (id) {
      var u = store.users[id];
      var items = u.wishlist.map(function (s) { return byId[s]; }).filter(Boolean);
      var value = items.reduce(function (a, c) { return a + (c.price || 0); }, 0);
      return { mobile: u.mobile, name: u.name, seed: !!u.seed, joined: u.joined || null,
               count: items.length, value: value, cars: items };
    }).sort(function (a, b) { return b.count - a.count || b.value - a.value; });
  }

  var SEED = [
    ['Arjun Reddy',    '9848011223', ['CC-358', 'CC-374', 'CC-298'], '2026-08-26'],
    ['Sneha Rao',      '9700455612', ['CC-381', 'CC-367'],           '2026-08-30'],
    ['Faisal Ahmed',   '7075391144', ['CC-383', 'CC-390', 'CC-391'], '2026-09-02'],
    ['Karthik Varma',  '9885560987', ['CC-382', 'CC-371'],           '2026-09-05'],
    ['Divya Prasad',   '6302581190', ['CC-375', 'CC-388', 'CC-365'], '2026-09-08'],
    ['Rohit Chowdary', '9391127788', ['CC-389', 'CC-387', 'CC-212'], '2026-09-11'],
    ['Meera Iyer',     '9000342211', ['CC-382', 'CC-371', 'CC-318', 'CC-391'], '2026-09-14']
  ];
  function seedStore(store) {
    SEED.forEach(function (s) {
      var id = normMobile(s[1]);
      if (!store.users[id]) store.users[id] = { mobile: id, name: s[0], wishlist: s[2].slice(), joined: s[3], seed: true };
    });
    return store;
  }


  var api = {
    fmt: fmt, money: money, esc: esc, icon: icon, today: today, nonEmpty: nonEmpty,
    DEFAULTS: DEFAULTS, LIMITS: LIMITS, matches: matches, SORTS: SORTS, prepare: prepare,
    cardHTML: cardHTML, coverSrc: coverSrc, photoSrc: photoSrc, ageBucket: ageBucket,
    cascadeOptions: cascadeOptions, tally: tally,

    ROLES: ROLES, CAPS: CAPS, SCOPES: SCOPES, ACCESS_DEFAULT: ACCESS_DEFAULT, NO_ACCESS: NO_ACCESS,
    defaultAccess: defaultAccess, acc: acc, inScope: inScope, canOpen: canOpen,
    canSetPass: canSetPass, canSeePass: canSeePass, canSetRole: canSetRole, SENIOR_ROLES: SENIOR_ROLES, validEmail: validEmail, validPass: validPass,
    maskMobile: maskMobile, maskCost: maskCost,
    STAFF: STAFF, authenticate: authenticate, staffById: staffById, staffByRole: staffByRole,
    setStaff: setStaff, staffList: staffList,
    DEFAULT_BRANCHES: DEFAULT_BRANCHES, branchById: branchById, branchName: branchName,
    OPEN_STAGES: OPEN_STAGES, CLOSED_STAGES: CLOSED_STAGES, OPP_STAGES: OPP_STAGES,
    isOpen: isOpen, newOpp: newOpp, oppsFor: oppsFor, openOppsFor: openOppsFor, openOpps: openOpps,
    STAGE_HELP: STAGE_HELP, playCar: playCar, isInPlay: isInPlay,
    MARK_RANK: MARK_RANK, STAGE_MARK: STAGE_MARK, NEEDS_CAR: NEEDS_CAR,
    LEGACY_STAGES: LEGACY_STAGES, fixStage: fixStage,
    NOTE_RULES: NOTE_RULES, scoreNote: scoreNote, noteAverage: noteAverage,
    pipelineByStage: pipelineByStage, moveOpp: moveOpp, winOpp: winOpp, loseOpp: loseOpp,
    clientSummary: clientSummary, clientTier: clientTier,
    PROC_STAGES: PROC_STAGES, PROC_HELP: PROC_HELP, PROC_NEEDS: PROC_NEEDS,
    STATUTORY_DAYS: STATUTORY_DAYS, DEAL_DOCS: DEAL_DOCS, CAR_DOCS: CAR_DOCS,
    docTypes: docTypes, docLabel: docLabel, newDoc: newDoc, docsOf: docsOf,
    hasDoc: hasDoc, missingDocs: missingDocs, newProc: newProc,
    isProcessing: isProcessing, procDeals: procDeals, procDue: procDue,
    addDays: addDays, daysLeft: daysLeft, procOverdue: procOverdue,
    procProgress: procProgress, startProc: startProc, moveProc: moveProc,
    FOLLOW_METHODS: FOLLOW_METHODS, FOLLOW_OUTCOMES: FOLLOW_OUTCOMES, AT_RISK: AT_RISK,
    newFollow: newFollow, followsFor: followsFor, openFollows: openFollows,
    isOverdue: isOverdue, isDueToday: isDueToday, nextFollow: nextFollow,
    atRisk: atRisk, needsAttention: needsAttention,

    FIELDS: FIELDS, FIELD_GROUPS: FIELD_GROUPS, fieldByKey: fieldByKey, fieldValue: fieldValue,
    hasField: hasField, setField: setField, scoreRecord: scoreRecord,
    FUELS: FUELS, BODIES: BODIES,

    RANGES: RANGES, rangeDates: rangeDates, rangeLabel: rangeLabel, inRange: inRange,
    monthsIn: monthsIn, monthKey: monthKey, iso: iso,
    DEFAULT_TARGETS: DEFAULT_TARGETS, salesFor: salesFor, targetProgress: targetProgress,
    band: band, personStats: personStats,

    STAGES: OPP_STAGES, MARKS: MARKS, SOURCES: SOURCES,
    normMobile: normMobile, validMobile: validMobile, validName: validName,
    findByMobile: findByMobile, newClient: newClient, upsertClient: upsertClient,
    addMark: addMark, markOf: markOf, clientValue: clientValue, suggestFor: suggestFor,

    TRIGGERS: TRIGGERS, ACTS: ACTS, autoKind: autoKind, audienceOf: audienceOf,
    validateAuto: validateAuto, testAuto: testAuto,

    STORE_KEY: STORE_KEY, APP_KEY: APP_KEY,
    loadStore: loadStore, saveStore: saveStore, signIn: signIn, signOut: signOut,
    currentUser: currentUser, toggleWish: toggleWish, isWished: isWished,
    saveCounts: saveCounts, customerRows: customerRows, customersWhoSaved: customersWhoSaved,
    seedStore: seedStore
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CC = api;
})(typeof self !== 'undefined' ? self : this);
