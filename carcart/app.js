/* Car Cart console \u2014 shell, state, router, and the owner's controls.
   stock.js / crm.js / autos.js register themselves into VIEWS and ACTIONS.
   One render() rebuilds #shell from state; every click flows through one
   delegated listener reading data-act. No framework, no build step. */
(function () {
  'use strict';

  var VIEWS = {}, ACTIONS = {};
  var D = null;            // the whole demo store
  var CARS = [];           // stock.json + any edits, CC.prepare()d
  var RAW = [];            // stock.json as loaded, plus cars added in-session
  var SHEET = null;        // data/sheet.csv parsed, if present
  var booted = false;

  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return CC.esc(s); };

  /* ---------------- storage ---------------- */

  function blank() {
    return {
      v: 3, session: null, access: CC.defaultAccess(),
      roles: Object.keys(CC.ROLES).map(function (r) {
        return { id: r, name: CC.ROLES[r].label, custom: false };
      }),
      clients: [], messages: [], automations: [],
      edits: {}, newCars: [], audit: [], activity: [], followups: [], sales: [], syncLog: [],
      targets: JSON.parse(JSON.stringify(CC.DEFAULT_TARGETS)),
      staff: JSON.parse(JSON.stringify(CC.STAFF)),
      branches: JSON.parse(JSON.stringify(CC.DEFAULT_BRANCHES)),
      opportunities: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(CC.APP_KEY);
      var d = raw ? JSON.parse(raw) : null;
      if (!d || !d.v) return blank();
      if (d.v > 3) return blank();
      if (d.v < 3) d = migrate(d);
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
      o.stage = CC.fixStage(o.stage);
      o.inplay = o.inplay || [];
      o.cars = o.cars || [];
      if (o.stage === 'Won' && !o.outcome) o.outcome = 'won';
      if (o.stage === 'Lost' && !o.outcome) o.outcome = 'lost';
    });
    /* visits were a separate model; anyone still on the floor becomes an
       opportunity at In showroom so nobody is lost */
    (d.visits || []).forEach(function (v) {
      if (v.status === 'done') return;
      if (d.opportunities.some(function (o) { return o.client === v.client && CC.isOpen(o); })) return;
      d.opportunities.push(CC.newOpp({
        client: v.client, assigned_to: v.salesperson, stage: 'In showroom',
        title: v.brief || 'Walk-in', created: String(v.at || '').slice(0, 10) || CC.today(),
        cars: (v.items || []).map(function (i) { return i.stock_id; })
      }));
    });
    delete d.visits;
    (d.clients || []).forEach(function (c) { delete c.stage; });
    if (!Array.isArray(d.automations)) d.automations = [];
    d.automations.forEach(function (a) {
      a.stages = (a.stages || []).map(CC.fixStage).filter(function (x, i, arr) {
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
      var base = CC.ACCESS_DEFAULT[role] || CC.NO_ACCESS;
      Object.keys(base).forEach(function (cap) {
        if (d.access[role][cap] === undefined) d.access[role][cap] = base[cap];
      });
    });
    Object.keys(CC.ACCESS_DEFAULT).forEach(function (role) {
      if (!d.access[role]) d.access[role] = Object.assign({}, CC.ACCESS_DEFAULT[role]);
    });
    (d.followups || []).forEach(function (f) {
      if (!f.method) f.method = 'Call';
      if (!f.note && f.text) { f.note = f.text; delete f.text; }
      if (!('car' in f)) f.car = null;
    });
    d.activity = d.activity || [];
    d.branches = d.branches && d.branches.length ? d.branches
      : JSON.parse(JSON.stringify(CC.DEFAULT_BRANCHES));
    d.staff = d.staff && d.staff.length ? d.staff : JSON.parse(JSON.stringify(CC.STAFF));
    d.staff.forEach(function (u) {
      if (!CC.branchById(d.branches, u.branch)) u.branch = d.branches[0].id;
    });
    d.v = 3;
    return d;
  }
  function save() {
    try { localStorage.setItem(CC.APP_KEY, JSON.stringify(D)); }
    catch (e) { toast('Storage is full — remove a photo-heavy car.', true); }
  }

  function me() { return D.session ? CC.staffById(D.session) : null; }
  function syncStaff() { CC.setStaff(D.staff && D.staff.length ? D.staff : CC.STAFF); }
  function acc() { return CC.acc(me(), D.access); }
  function can(cap) { return !!acc()[cap]; }

  /* ---------------- cars: stock.json + session edits ---------------- */

  function applyEdits() {
    var all = RAW.concat(D.newCars);
    all.forEach(function (c) {
      var e = D.edits[c.stock_id];
      if (!e) return;
      Object.keys(e).forEach(function (k) {
        if (k === 'extra') { c.extra = Object.assign({}, c.extra, e.extra); }
        else c[k] = e[k];
      });
    });
    CARS = all.map(CC.prepare);
    return CARS;
  }

  function carById(id) { return CARS.filter(function (c) { return c.stock_id === id; })[0] || null; }
  function rawById(id) {
    return RAW.concat(D.newCars).filter(function (c) { return c.stock_id === id; })[0] || null;
  }

  /* Record one field change against the car and the audit trail. */
  function editCar(id, key, value) {
    var car = rawById(id);
    if (!car) return { error: 'No such car.' };
    var r = CC.setField(car, key, value);
    if (r.error) return r;

    var e = D.edits[id] = D.edits[id] || {};
    if (Object.prototype.hasOwnProperty.call(car, key) && key !== 'availability') e[key] = car[key];
    else { e.extra = e.extra || {}; e.extra[key] = (car.extra || {})[key]; }
    if (key === 'availability') { e.demo = Object.assign({}, e.demo, { availability: value }); }

    log('car_edit', r.field.label + ': ' +
        (r.before === null || r.before === undefined ? 'blank' : String(r.before).slice(0, 40)) +
        ' → ' + (r.after === null ? 'cleared' : String(r.after).slice(0, 40)), { car: id });
    save(); applyEdits();
    return r;
  }

  /* ---------------- the activity log ----------------
     One line per thing anybody actually did. Written at the point of the change
     rather than inferred afterwards, so it records intent, not just a diff. */

  var KINDS = {
    car_edit:    ['Stock', 'edit'],   car_add:     ['Stock', 'add'],
    car_publish: ['Stock', 'edit'],   sheet_import:['Stock', 'edit'],
    client_add:  ['Customers', 'add'], client_assign: ['Customers', 'edit'],
    wish_add:    ['Customers', 'edit'], msg_approve: ['Customers', 'add'],
    msg_dismiss: ['Customers', 'edit'],
    opp_new:     ['Pipeline', 'add'], opp_stage:   ['Pipeline', 'edit'],
    opp_won:     ['Pipeline', 'win'], opp_lost:    ['Pipeline', 'lose'],
    opp_reopen:  ['Pipeline', 'edit'], opp_car:    ['Pipeline', 'edit'],
    follow_log:  ['Follow-ups', 'add'], follow_done: ['Follow-ups', 'edit'],
    visit_new:   ['Floor', 'add'],    visit_move:  ['Floor', 'edit'],
    visit_mark:  ['Floor', 'edit'],
    target_set:  ['Team & settings', 'edit'], staff_add: ['Team & settings', 'add'],
    staff_edit:  ['Team & settings', 'edit'], staff_remove: ['Team & settings', 'lose'],
    branch_add:  ['Team & settings', 'add'], branch_remove: ['Team & settings', 'lose'],
    access_change: ['Team & settings', 'edit'], role_add: ['Team & settings', 'add'],
    auto_toggle: ['Automations', 'edit'], auto_save: ['Automations', 'add']
  };
  var KIND_GROUPS = ['Stock', 'Customers', 'Pipeline', 'Follow-ups', 'Floor',
                     'Automations', 'Team & settings'];

  function log(kind, text, refs) {
    refs = refs || {};
    D.activity.unshift({
      id: 'l' + Date.now() + Math.floor(Math.random() * 1000),
      at: new Date().toISOString(), by: D.session, kind: kind, text: text,
      client: refs.client || null, opp: refs.opp || null, car: refs.car || null
    });
    if (D.activity.length > 600) D.activity.length = 600;
  }

  /* ---------------- speak instead of typing ----------------
     The Web Speech API, which is Chrome and Edge only. If it is not there we say
     so rather than showing a button that does nothing. */

  var REC = null;
  function dictate(targetId, btn) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var box = document.getElementById(targetId);
    if (!box) return;
    if (!SR) { toast('Voice typing needs Chrome or Edge. Type it instead.', true); return; }
    if (REC) { REC.stop(); REC = null; return; }

    var r = new SR();
    r.lang = 'en-IN'; r.interimResults = true; r.continuous = true;
    var base = box.value ? box.value.trim() + ' ' : '';
    if (btn) { btn.classList.add('rec'); btn.textContent = 'Listening… tap to stop'; }

    r.onresult = function (e) {
      var out = '';
      for (var i = 0; i < e.results.length; i++) out += e.results[i][0].transcript;
      box.value = base + out;
    };
    r.onerror = function (e) {
      toast(e.error === 'not-allowed' ? 'Microphone permission was refused.' : 'Voice typing stopped.', true);
      stopRec(btn);
    };
    r.onend = function () { stopRec(btn); };
    try { r.start(); REC = r; } catch (err) { toast('Could not start the microphone.', true); stopRec(btn); }
  }
  function stopRec(btn) {
    REC = null;
    if (btn) { btn.classList.remove('rec'); btn.textContent = '🎤 Speak'; }
  }
  function micButton(targetId) {
    return '<button class="micbtn" type="button" data-act="dictate" data-id="' + esc(targetId) + '">🎤 Speak</button>';
  }

  /* ---------------- where you just came from ----------------
     Every screen but Home carries a back link naming the previous one. A stack
     rather than history.back() so the label can say where it is going. */

  var HIST = [];
  var LABELS = {
    home: 'Home', stock: 'Stock', car: 'a car', carnew: 'Add a car', sheet: 'the sheet',
    clients: 'Customers', client: 'a customer', clientnew: 'Add a customer',
    opp: 'an opportunity', oppnew: 'New opportunity',
    floor: 'the Floor', inbox: 'Enquiries',
    automations: 'Automations', automation: 'a rule', reports: 'Reports',
    targets: 'Targets', team: 'Team', person: 'a colleague', settings: 'Settings'
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
     thing on the reports screen as it does on the customer list. */

  var RANGE = { key: 'month', from: '', to: '' };
  function range() {
    var d = CC.rangeDates(RANGE.key, RANGE.from, RANGE.to);
    return { key: RANGE.key, from: d[0], to: d[1] };
  }
  function inRange(dateStr) { return CC.inRange(dateStr, range()); }

  function rangeBar(note) {
    var r = range();
    return '<div class="rangebar">' +
      '<span class="rlabel">Showing</span>' +
      CC.RANGES.map(function (x) {
        return '<button class="chip" data-act="setRange" data-id="' + x[0] + '" aria-pressed="' +
          (RANGE.key === x[0] ? 'true' : 'false') + '">' + x[1] + '</button>';
      }).join('') +
      (RANGE.key === 'custom'
        ? '<span class="rcustom"><input type="date" id="r-from" value="' + esc(r.from) + '">' +
          '<span>to</span><input type="date" id="r-to" value="' + esc(r.to) + '"></span>'
        : '') +
      '<span class="rnote">' + esc(note || CC.rangeLabel(r)) + '</span></div>';
  }

  /* ---------------- navigation ---------------- */

  var NAV = [
    ['home',        'Home',        null],
    ['stock',       'Stock',       null],
    ['sheet',       'Sheet',       'editStock'],
    ['clients',     'Customers',   'clients'],
    ['floor',       'Floor',       'clients'],
    ['inbox',       'Inbox',       'clients'],
    ['automations', 'Automations', 'automations'],
    ['reports',     'Reports',     null],
    ['activity',    'Activity',    null],
    ['targets',     'Targets',     'targets'],
    ['team',        'Team',        'reports'],
    ['settings',    'Settings',    'settings']
  ];

  function navFor() {
    var a = acc();
    return NAV.filter(function (n) { return !n[2] || a[n[2]]; });
  }

  function paintChrome() {
    var u = me();
    if (!u) return;
    var route = (location.hash || '#/home').split('/')[1] || 'home';
    $('#nav').innerHTML = navFor().map(function (n) {
      var badge = n[0] === 'inbox' ? pendingMsgs().length : 0;
      return '<a href="#/' + n[0] + '" class="' + (n[0] === route ? 'on' : '') + '">' + n[1] +
             (badge ? '<i>' + badge + '</i>' : '') + '</a>';
    }).join('');
    $('#uchip').innerHTML =
      '<span class="av">' + esc(u.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2)) + '</span>' +
      '<span style="text-align:left"><b style="display:block">' + esc(u.name) + '</b>' +
      '<span>' + esc(CC.ROLES[u.role].label) + '</span></span>';
  }

  function pendingMsgs() {
    return D.messages.filter(function (m) { return m.card && m.card.status === 'pending'; });
  }

  /* ---------------- render ---------------- */

  function render() {
    if (!D.session) { $('#login').hidden = false; $('#app').hidden = true; return; }
    $('#login').hidden = true; $('#app').hidden = false;

    var parts = (location.hash || '#/home').replace(/^#\//, '').split('/');
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
        'This screen is switched off for ' + CC.ROLES[me().role].label.toLowerCase() +
        '. What each role can reach is set by the owner in Settings.');
      return;
    }
    try { $('#shell').innerHTML = view(arg); }
    catch (e) { $('#shell').innerHTML = crashCard(e, route); console.error(e); }
    window.scrollTo(0, 0);
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

  VIEWS.home = function () {
    var u = me(), a = acc();
    var live = CARS.filter(function (c) { return c.availability !== 'Sold'; });
    var mine = D.clients.filter(function (c) { return CC.inScope(c, u, D.access); });
    var myFollow = D.followups.filter(function (f) { return f.owner === u.id && !f.done; });

    var h = '<div class="ph"><div><h1>Good day, ' + esc(u.name.split(' ')[0]) + '</h1>' +
      '<p>' + esc(CC.ROLES[u.role].label) + ' &middot; ' + esc(CC.branchName(D.branches, u.branch)) + '</p></div></div>';

    var k = [];
    k.push([live.length, 'Cars on the floor', null, 'Everything not marked sold.']);
    if (a.cost) {
      var value = live.reduce(function (s, c) { return s + c.price; }, 0);
      k.push([CC.money(value), 'Stock value', null, 'What the floor is worth at asking prices.']);
      var profit = live.reduce(function (s, c) { return s + (c.margin || 0); }, 0);
      k.push([CC.money(profit), 'Profit if all sold', null, 'Illustrative: asking price less modelled landed cost.']);
    }
    if (a.clients) {
      k.push([mine.length, a.scope === 'own' ? 'Your customers' : 'Customers', null,
              a.scope === 'own' ? 'Customers assigned to you.' : 'Everyone on the books.']);
      k.push([myFollow.length, 'Your follow-ups', myFollow.length ? 'warn' : null,
              'Jobs left on your list by a visit or an automation.']);
      k.push([onFloor().length, 'Live deals', null, 'Opportunities still open on the floor.']);
    }
    if (a.editStock) {
      var thin = CARS.filter(function (c) { return c.n_photos < 14 || !CC.fieldValue(c, CC.fieldByKey('description')); }).length;
      k.push([thin, 'Listings needing work', thin ? 'bad' : 'ok', 'Under 14 photographs, or no written description.']);
    }
    var aged = live.filter(function (c) { return c.days > 90; }).length;
    k.push([aged, 'Unsold over 90 days', aged ? 'warn' : null, 'Cars that have sat long enough to cost real money.']);
    h += '<div class="kpis">' + k.map(function (x) {
      return '<div class="kpi' + (x[2] ? ' ' + x[2] : '') + '" data-tip="' + esc(x[3]) + '">' +
             '<b>' + x[0] + '</b><span>' + esc(x[1]) + '</span></div>';
    }).join('') + '</div>';

    /* the one list that matters for this person, today */
    if (a.clients && myFollow.length) {
      var sorted = myFollow.slice().sort(function (x, y) { return String(x.due).localeCompare(String(y.due)); });
      var late = sorted.filter(function (f) { return CC.isOverdue(f); }).length;
      h += '<p class="eyebrow" style="margin-top:32px">Your follow-ups' +
        (late ? ' — ' + late + ' overdue' : '') + '</p><div class="card" style="padding:0">';
      h += sorted.slice(0, 10).map(function (f) {
        var c = clientById(f.client);
        var over = CC.isOverdue(f), today_ = CC.isDueToday(f);
        return '<div class="finding"><span class="sev ' + (over ? 'bad' : today_ ? 'warn' : 'info') + '"></span><div>' +
          '<h4>' + esc(c ? c.name : 'Customer') + ' <span class="pill ' + (over ? 'bad' : today_ ? 'warn' : 'dim') + '">' +
          (over ? 'overdue ' + esc(f.due) : today_ ? 'today' : esc(f.due)) + '</span></h4>' +
          '<p>' + esc(f.note || f.text || 'Follow up') + (f.method ? ' &middot; ' + esc(f.method) : '') + '</p></div>' +
          '<span class="go">' +
          (f.opp ? '<button class="minibtn" data-act="logFollow" data-id="' + esc(f.opp) + '">Log a call</button> ' : '') +
          '<button class="minibtn" data-act="openClient" data-id="' + esc(f.client) + '">Open</button>' +
          ' <button class="minibtn" data-act="doneFollow" data-id="' + esc(f.id) + '">Done</button></span></div>';
      }).join('') + '</div>';
    }

    if (a.editStock) {
      var worst = CARS.slice().sort(function (x, y) { return x.completeness - y.completeness; }).slice(0, 6);
      h += '<p class="eyebrow" style="margin-top:32px">Thinnest listings</p>' +
        '<div class="scroller"><table class="tbl"><thead><tr><th>Car</th><th>Photos</th><th>Details filled</th><th></th></tr></thead><tbody>' +
        worst.map(function (c) {
          return '<tr data-act="openCar" data-id="' + esc(c.stock_id) + '">' +
            '<td><div class="veh"><img loading="lazy" src="' + CC.coverSrc(c) + '" alt="">' +
            '<span><b>' + esc(c.make + ' ' + c.model) + '</b><span>' + esc(c.stock_id) + '</span></span></div></td>' +
            '<td class="num">' + c.n_photos + '</td>' +
            '<td><span class="bar"><i style="width:' + c.completeness + '%"></i></span> ' + c.completeness + '%</td>' +
            '<td class="num"><button class="minibtn" data-act="openCar" data-id="' + esc(c.stock_id) + '">Fill in</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    if (can('settings')) h += healthPanels();
    return h;
  };

  function onFloor() {
    return (D.opportunities || []).filter(CC.isOpen);
  }
  function clientById(id) { return D.clients.filter(function (c) { return c.id === id; })[0] || null; }

  /* ---------------- data health (kept from phase 1) ---------------- */

  var SITE = [
    ['bad', 'Airtel blocks carcartonline.com as a scam',
     'On Airtel broadband and mobile the domain resolves to <b>restrictedspam.rpz.airtelspam.com</b> and ' +
     'serves &ldquo;Airtel found this site dangerous&rdquo;. The certificate is valid \u2014 this is a ' +
     '<b>domain reputation flag</b>, not a security fault. Every Airtel customer in Hyderabad who ' +
     'taps your link sees a scam warning. Fixed by a delisting request to <b>spam.grievance@airtel.com</b>.'],
    ['bad', 'The whole inventory can be downloaded by anyone',
     'The listings endpoint answers without a login, so all <b>25 cars, prices and 270 photographs</b> ' +
     'can be copied in one request. That is how this console was populated.'],
    ['bad', 'Nothing has been added since 22 March 2026',
     'Every car on the site has now been listed <b>{FRESHEST} days or more</b>. A buyer who checked in ' +
     'April and checks again today sees the same floor.'],
    ['warn', 'CarWale carries 36 cars, your own site carries 25',
     'Eleven cars exist only where the portal charges you for the lead.'],
    ['warn', 'The view counter has been dead the whole time',
     'All 25 live listings report <b>0 views</b>, so nobody can tell what to reprice or push.']
  ];

  function healthPanels() {
    var f = [];
    var bad = CARS.filter(function (c) { return c.price_corrected; });
    if (bad.length) f.push(['bad', 'A car is priced at ' + CC.money(bad[0].price_raw),
      'The <b>' + esc(bad[0].year + ' ' + bad[0].make + ' ' + bad[0].model) + '</b> is published at <b>' +
      CC.money(bad[0].price_raw) + '</b> — two digits short. The storefront here shows the corrected ' +
      CC.money(bad[0].price) + '.', bad[0].stock_id]);

    var nodesc = CARS.filter(function (c) { return !CC.fieldValue(c, CC.fieldByKey('description')); }).length;
    if (nodesc) f.push(['bad', nodesc + ' of ' + CARS.length + ' cars have no written description',
      'Buyers get a photo and a spec line; search engines get nothing to index.']);

    var split = CARS.filter(function (c) { return (c.raw_make || '').toUpperCase() === 'RANGE ROVER'; });
    if (split.length) f.push(['warn', 'One manufacturer is filed under two brands',
      '<b>Range Rover</b> and <b>Land Rover</b> are separate makes, so a buyer filtering for one never sees the other.',
      split[0].stock_id]);

    var badfuel = CARS.filter(function (c) { return (c.raw_fuel || '') !== '' && c.raw_fuel !== c.fuel; });
    if (badfuel.length) f.push(['warn', 'A car\'s fuel type is misspelt',
      'The <b>' + esc(badfuel[0].make + ' ' + badfuel[0].model) + '</b> is filed as <b>' +
      esc(badfuel[0].raw_fuel) + '</b>, so it never appears in a Diesel search on your own site.',
      badfuel[0].stock_id]);

    var badmodel = CARS.filter(function (c) {
      return (c.raw_make || '').toUpperCase() === 'HILUX';
    });
    if (badmodel.length) f.push(['warn', 'A model name is sitting in the make field',
      'The <b>' + esc(badmodel[0].year + ' ' + badmodel[0].model) + '</b> is filed under the make ' +
      '<b>HILUX</b>, so it is missing from Toyota and from every other make at once.',
      badmodel[0].stock_id]);

    var badid = CARS.filter(function (c) { return /^CC-(19|20)\d\d$/.test(c.stock_id); });
    if (badid.length) f.push(['warn', 'A year has been typed into the stock number field',
      'The <b>' + esc(badid[0].make + ' ' + badid[0].model) + '</b> carries the stock number <b>' +
      esc(badid[0].stock_id.replace('CC-', '')) + '</b> \u2014 its model year, not an identifier.',
      badid[0].stock_id]);

    var tx = CC.tally(CARS, 'transmission');
    if (tx.length === 1) f.push(['warn', 'All ' + CARS.length + ' cars read &ldquo;' + esc(tx[0][0]) + '&rdquo;',
      'Almost certainly a default that was never changed rather than the truth about the floor.']);

    var noreg = CARS.filter(function (c) { return !CC.fieldValue(c, CC.fieldByKey('reg_no')); }).length;
    if (noreg) f.push(['warn', noreg + ' cars carry no registration number',
      'Nothing identifies a specific car on the phone, in the books, or to a customer.']);

    var old = CARS.slice().sort(function (a, b) { return b.days - a.days; })[0];
    if (old) f.push(['info', 'The oldest car has been listed ' + old.days + ' days',
      '<b>' + esc(old.make + ' ' + old.model) + '</b>, listed ' + old.posted + '.', old.stock_id]);

    function row(x) {
      return '<div class="finding"><span class="sev ' + x[0] + '"></span><div><h4>' + x[1] + '</h4><p>' + x[2] + '</p></div>' +
        (x[3] ? '<span class="go"><button class="minibtn" data-act="openCar" data-id="' + esc(x[3]) + '">Open</button></span>' : '') +
        '</div>';
    }
    return '<p class="eyebrow" style="margin-top:32px">Data health</p>' +
      '<div class="grid2">' +
      '<div class="card" style="padding:0"><h4 style="font-family:var(--d);font-size:13px;padding:14px 16px;border-bottom:1px solid var(--line)">Listing faults <span class="pill bad" style="float:right">' + f.length + '</span></h4>' +
        f.map(row).join('') + '</div>' +
      '<div class="card" style="padding:0"><h4 style="font-family:var(--d);font-size:13px;padding:14px 16px;border-bottom:1px solid var(--line)">Site &amp; account health <span class="pill bad" style="float:right">' + SITE.length + '</span></h4>' +
        SITE.map(function (x) {
          /* the staleness figure has to age with the demo, not with the scrape */
          var freshest = Math.min.apply(null, CARS.map(function (c) { return c.days; }));
          return row([x[0], x[1], x[2].replace('{FRESHEST}', freshest), x[3]]);
        }).join('') + '</div></div>';
  }

  /* ---------------- team ---------------- */

  VIEWS.team = function () {
    var cars = CARS, r = range(), a = acc();
    var h = '<div class="ph"><div><h1>Team</h1>' +
      '<p>Six people across five roles. Open anyone to see their customers, their sales and where they are against target.</p></div>' +
      (a.reports ? '<div class="right"><a class="btn alt" href="#/reports">Team reports</a></div>' : '') + '</div>';
    h += rangeBar();

    h += '<div class="grid3">' + CC.STAFF.map(function (u) {
      var ua = CC.acc(u, D.access);
      var st = CC.personStats(D, u.id, cars, r);
      var sells = u.role === 'sales' || u.role === 'manager';
      var t = st.target;
      return '<div class="card person" data-act="openPerson" data-id="' + esc(u.id) + '">' +
        '<div style="display:flex;gap:11px;align-items:center;margin-bottom:12px">' +
        '<span class="av">' + initials(u.name) + '</span>' +
        '<div style="min-width:0"><b style="font-family:var(--d);font-size:15px">' + esc(u.name) + '</b>' +
        '<span style="display:block;font-size:12px;color:var(--mut)">' + esc(CC.ROLES[u.role].label) + '</span></div>' +
        (u.id === D.session ? '<span class="pill em" style="margin-left:auto">You</span>' : '') +
        '</div>' +
        (sells
          ? '<div class="ministats">' +
              mini(st.clients, 'customers') + mini(st.sales, 'sales') +
              mini(a.cost ? CC.money(st.value) : '••••', 'value') +
            '</div>' +
            (t.targetUnits
              ? '<div class="tprog"><div class="tprow"><span>Target ' + t.targetUnits + ' cars</span>' +
                '<b class="' + CC.band(t.unitsPct) + '">' + (t.unitsPct === null ? '—' : t.unitsPct + '%') + '</b></div>' +
                '<span class="bar wide"><i class="' + CC.band(t.unitsPct) + '" style="width:' +
                Math.min(100, t.unitsPct || 0) + '%"></i></span></div>'
              : '<p class="m" style="color:var(--dim);margin-top:8px">No target set</p>')
          : '<p class="m">Sees: <b style="color:#D9D5D2">' + esc(CC.SCOPES[ua.scope]) + '</b>' +
            (ua.cost ? ' &middot; costs' : '') + (ua.settings ? ' &middot; settings' : '') + '</p>') +
        '</div>';
    }).join('') + '</div>';
    return h;
  };

  function initials(n) { return esc(n.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2)); }
  function mini(v, l) { return '<div><b>' + v + '</b><span>' + l + '</span></div>'; }

  /* ---------------- one person ---------------- */

  VIEWS.person = function (id) {
    var u = CC.staffById(id);
    if (!u) return deny('No such person', 'Nobody by that id works here.');
    var a = acc(), me_ = me();
    if (u.id !== me_.id && !a.reports && a.scope !== 'company')
      return deny('Not in your view', 'Only a manager or the owner can open somebody else\'s numbers.');

    var r = range(), st = CC.personStats(D, u.id, CARS, r), t = st.target;
    var sells = u.role === 'sales' || u.role === 'manager';

    var h = '<div class="ph"><div style="display:flex;gap:13px;align-items:center">' +
      '<span class="av big">' + initials(u.name) + '</span>' +
      '<div><h1>' + esc(u.name) + '</h1><p>' + esc(CC.ROLES[u.role].label) + ' &middot; ' +
      esc(CC.branchName(D.branches, u.branch)) + ' &middot; joined ' + esc(u.joined) + '</p></div></div>' +
      '<div class="right">' +
      (a.targets && sells ? '<button class="btn alt" data-act="editTarget" data-id="' + esc(u.id) + '">Set target</button>' : '') +
      '<a class="btn alt" href="#/team">Back to team</a></div></div>';

    h += rangeBar();

    h += '<div class="kpis">' +
      k(st.clients, 'Customers assigned', null, 'Everyone on their list right now, whenever they came in.') +
      k(st.newClients, 'New in this window', null, 'Customers first added between ' + r.from + ' and ' + r.to + '.') +
      k(st.open, 'Still open', st.open ? 'warn' : null, 'Not yet delivered and not yet lost.') +
      k(st.sales, 'Cars sold', null, 'Sales closed in this window.') +
      k(a.cost ? CC.money(st.value) : '₹ ••••', 'Sales value', null, 'What those sales were worth.') +
      k(st.conversion === null ? '—' : st.conversion + '%', 'Conversion', null,
        'Sales divided by new customers in this window.') +
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
          targetCard('Cars sold', st.sales, t.targetUnits, t.unitsPct, String(st.sales), String(t.targetUnits)) +
          targetCard('Sales value', st.value, t.targetValue, t.valuePct,
            a.cost ? CC.money(st.value) : '₹ ••••', a.cost ? CC.money(t.targetValue) : '₹ ••••') +
          '</div>' +
          '<p class="hint">' + (t.tooShort
            ? 'This window is too short to score against a monthly target — widen it to judge them.'
            : 'Monthly target pro-rated across the ' + t.months.toFixed(1) + ' months this window covers.') +
          '</p>';
      }

      h += '<p class="eyebrow" style="margin-top:30px">Sales in this window</p>';
      h += t.sales.length
        ? '<div class="scroller"><table class="tbl"><thead><tr><th>Date</th><th>Car</th><th>Buyer</th>' +
          '<th class="num">Price</th><th class="num">Booking</th><th>Finance</th></tr></thead><tbody>' +
          t.sales.slice().sort(function (x, y) { return y.at.localeCompare(x.at); }).map(function (sl) {
            return '<tr' + (sl.client ? ' data-act="openClient" data-id="' + esc(sl.client) + '"' : '') + '>' +
              '<td>' + esc(sl.at) + '</td><td><b>' + esc(sl.car || sl.stock_id || '—') + '</b></td>' +
              '<td>' + esc(sl.buyer || '—') + '</td>' +
              '<td class="num">' + CC.money(sl.price) + '</td>' +
              '<td class="num">' + (a.cost ? CC.money(sl.booking) : '₹ ••••') + '</td>' +
              '<td>' + (sl.finance ? 'Yes' : 'No') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
        : '<div class="card"><p class="m">No sales in this window.</p></div>';
    }

    var theirs = D.clients.filter(function (c) { return c.assigned_to === u.id; });
    h += '<p class="eyebrow" style="margin-top:30px">Customers assigned (' + theirs.length + ')</p>';
    h += theirs.length
      ? '<div class="scroller"><table class="tbl"><thead><tr><th>Customer</th><th>Mobile</th><th>Came from</th>' +
        '<th>Standing</th><th class="num">Budget</th><th class="num">Saved</th><th>Added</th>' +
        '<th>Last touch</th></tr></thead><tbody>' +
        theirs.slice().sort(function (x, y) { return String(y.last_touch).localeCompare(String(x.last_touch)); })
        .map(function (c) {
          var fresh = CC.inRange(c.created, r);
          return '<tr data-act="openClient" data-id="' + esc(c.id) + '">' +
            '<td><b>' + esc(c.name) + '</b>' + (fresh ? ' <span class="pill em">new</span>' : '') + '</td>' +
            '<td>' + esc(CC.maskMobile(c.mobile, me_, D.access)) + '</td>' +
            '<td>' + esc(CC.SOURCES[c.source] || c.source) + '</td>' +
            '<td><span class="pill ' + CC.clientTier(c, D.opportunities)[1] + '">' +
              esc(CC.clientTier(c, D.opportunities)[0]) + '</span></td>' +
            '<td class="num">' + (c.budget_max ? CC.money(c.budget_max) : '—') + '</td>' +
            '<td class="num">' + ((c.wishlist || []).length + (c.shown || []).length) + '</td>' +
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
      '<b class="tpct ' + CC.band(pct) + '">' + (pct === null ? '—' : pct + '%') + '</b></div>' +
      '<span class="bar wide"><i class="' + CC.band(pct) + '" style="width:' + Math.min(100, pct || 0) + '%"></i></span>' +
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
    var t = CC.today();
    if (d2 === t) return 'Today';
    var y = new Date(); y.setDate(y.getDate() - 1);
    if (d2 === CC.iso(y)) return 'Yesterday';
    return d2;
  }

  function actRow(x) {
    var who = CC.staffById(x.by);
    var meta = KINDS[x.kind] || ['Other', 'edit'];
    var time = String(x.at).slice(11, 16);
    var links = '';
    if (x.client) links += '<button class="minibtn" data-act="openClient" data-id="' + esc(x.client) + '">Customer</button> ';
    if (x.opp) links += '<button class="minibtn" data-act="openOpp" data-id="' + esc(x.opp) + '">Opportunity</button> ';
    if (x.car) links += '<button class="minibtn" data-act="openCar" data-id="' + esc(x.car) + '">Car</button>';
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
        var who = CC.staffById(x.by);
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
      '<p>Monthly targets for every showroom and every salesperson. ' +
      'Reports pro-rate these across whatever window is picked.</p></div></div>';
    h += rangeBar();

    /* branches */
    h += '<p class="eyebrow">Showrooms</p><div class="scroller" style="max-height:none;margin-bottom:26px">' +
      '<table class="matrix"><thead><tr><th>Showroom</th><th>People</th><th>Cars / month</th>' +
      '<th>Value / month</th><th>Sold in window</th><th>Against target</th></tr></thead><tbody>' +
      D.branches.map(function (b) {
        var staff = D.staff.filter(function (u) { return u.branch === b.id; });
        var ids = staff.map(function (u) { return u.id; });
        var sold = (D.sales || []).filter(function (sl) {
          return ids.indexOf(sl.by) >= 0 && CC.inRange(sl.at, r);
        });
        var value = sold.reduce(function (a2, sl) { return a2 + (sl.price || 0); }, 0);
        var want = Math.round((b.target && b.target.units || 0) * CC.monthsIn(r));
        var pct = want >= 1 ? Math.round(100 * sold.length / want) : null;
        return '<tr><td class="rn">' + esc(b.name) + '<span>' + esc(b.address || '') + '</span></td>' +
          '<td class="num">' + staff.length + '</td>' +
          '<td><input type="number" min="0" class="tin" data-btarget="' + esc(b.id) + '|units" value="' +
            esc(b.target && b.target.units || 0) + '"></td>' +
          '<td><input type="number" min="0" step="100000" class="tin wide" data-btarget="' + esc(b.id) +
            '|value" value="' + esc(b.target && b.target.value || 0) + '"></td>' +
          '<td class="num">' + sold.length + ' &middot; ' + CC.money(value) + '</td>' +
          '<td><span class="bar"><i class="' + CC.band(pct) + '" style="width:' + Math.min(100, pct || 0) +
            '%"></i></span> <b class="' + CC.band(pct) + '">' + (pct === null ? '—' : pct + '%') + '</b>' +
            '<span style="color:var(--dim);font-size:11px"> of ' + want + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';

    /* people */
    var sellers = D.staff.filter(function (u) { return u.role === 'sales' || u.role === 'manager'; });
    h += '<p class="eyebrow">Salespeople</p><div class="scroller" style="max-height:none">' +
      '<table class="matrix"><thead><tr><th>Person</th><th>Showroom</th><th>Cars / month</th>' +
      '<th>Value / month</th><th>Sold in window</th><th>Against target</th></tr></thead><tbody>' +
      sellers.map(function (u) {
        var t = D.targets[u.id] || { units: 0, value: 0 };
        var prog = CC.targetProgress(D.sales, u.id, t, r);
        return '<tr><td class="rn">' + esc(u.name) + '<span>' + esc(CC.ROLES[u.role].label) + '</span></td>' +
          '<td>' + esc(CC.branchName(D.branches, u.branch)) + '</td>' +
          '<td><input type="number" min="0" class="tin" data-ptarget="' + esc(u.id) + '|units" value="' +
            esc(t.units || 0) + '"></td>' +
          '<td><input type="number" min="0" step="100000" class="tin wide" data-ptarget="' + esc(u.id) +
            '|value" value="' + esc(t.value || 0) + '"></td>' +
          '<td class="num">' + prog.units + ' &middot; ' + CC.money(prog.value) + '</td>' +
          '<td><span class="bar"><i class="' + CC.band(prog.unitsPct) + '" style="width:' +
            Math.min(100, prog.unitsPct || 0) + '%"></i></span> <b class="' + CC.band(prog.unitsPct) + '">' +
            (prog.unitsPct === null ? '—' : prog.unitsPct + '%') + '</b>' +
            '<span style="color:var(--dim);font-size:11px"> of ' + prog.targetUnits + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="hint">Type a new figure and it saves itself. ' +
      'A window shorter than a day is not scored — the target rounds below one car.</p>';
    return h;
  };

  /* ---------------- team reports ---------------- */

  VIEWS.reports = function () {
    var a = acc(), me_ = me(), r = range();
    var people = CC.STAFF.filter(function (u) { return u.role === 'sales' || u.role === 'manager'; });
    if (!a.reports) people = people.filter(function (u) { return u.id === me_.id; });

    var h = '<div class="ph"><div><h1>Reports</h1>' +
      '<p>' + (a.reports ? 'Every salesperson, side by side.' : 'Your own numbers.') +
      ' Pick any window, including a custom one.</p></div>' +
      (a.exportData ? '<div class="right"><button class="btn alt" data-act="exportReport">Export CSV</button></div>' : '') +
      '</div>';
    h += rangeBar();

    var rows = people.map(function (u) { return CC.personStats(D, u.id, CARS, r); });
    var tot = rows.reduce(function (t2, x) {
      t2.clients += x.clients; t2.newClients += x.newClients; t2.sales += x.sales;
      t2.value += x.value; t2.visits += x.visits; t2.open += x.open;
      t2.tUnits += x.target.targetUnits; t2.tValue += x.target.targetValue;
      return t2;
    }, { clients: 0, newClients: 0, sales: 0, value: 0, visits: 0, open: 0, tUnits: 0, tValue: 0 });

    h += '<div class="kpis" style="margin-bottom:22px">' +
      k(tot.sales, 'Cars sold', null, 'Across everyone in this window.') +
      k(a.cost ? CC.money(tot.value) : '₹ ••••', 'Sales value', null, 'What those sales were worth.') +
      k(tot.tUnits ? Math.round(100 * tot.sales / tot.tUnits) + '%' : '—', 'Against target',
        CC.band(tot.tUnits ? Math.round(100 * tot.sales / tot.tUnits) : null),
        'Team total against the pro-rated monthly targets.') +
      k(tot.newClients, 'New customers', null, 'First added inside this window.') +
      k(tot.open, 'Open customers', tot.open ? 'warn' : null, 'Not delivered, not lost.') +
      k(tot.visits, 'Deals opened', null, 'Opportunities opened in this window.') +
      '</div>';

    h += '<div class="scroller"><table class="tbl"><thead><tr>' +
      '<th>Salesperson</th><th class="num">Customers</th><th class="num">New</th><th class="num">Open</th>' +
      '<th class="num">Deals</th><th class="num">Cars shown</th><th class="num">Sold</th>' +
      '<th class="num">Value</th><th class="num">Conversion</th><th class="num">Follow-up quality</th>' +
      '<th class="num">Target</th><th class="tcol">Against target</th></tr></thead><tbody>' +
      rows.map(function (x) {
        var t = x.target;
        return '<tr data-act="openPerson" data-id="' + esc(x.user.id) + '">' +
          '<td><div class="veh"><span class="av sm">' + initials(x.user.name) + '</span>' +
          '<span><b>' + esc(x.user.name) + '</b><span>' + esc(CC.ROLES[x.user.role].label) + '</span></span></div></td>' +
          '<td class="num">' + x.clients + '</td><td class="num">' + x.newClients + '</td>' +
          '<td class="num">' + x.open + '</td><td class="num">' + x.visits + '</td>' +
          '<td class="num">' + x.carsShown + '</td><td class="num">' + x.sales + '</td>' +
          '<td class="num">' + (a.cost ? CC.money(x.value) : '₹ ••••') + '</td>' +
          '<td class="num">' + (x.conversion === null ? '—' : x.conversion + '%') + '</td>' +
          '<td class="num">' + (x.noteScore === null ? '—' :
            '<span class="pill ' + (x.noteScore >= 8 ? 'ok' : x.noteScore >= 5 ? 'warn' : 'bad') + '">' +
            x.noteScore + '/10</span>') + '</td>' +
          '<td class="num">' + (t.targetUnits || '—') + '</td>' +
          '<td class="tcol"><span class="bar"><i class="' + CC.band(t.unitsPct) + '" style="width:' +
          Math.min(100, t.unitsPct || 0) + '%"></i></span><b class="' + CC.band(t.unitsPct) + '">' +
          (t.unitsPct === null ? '—' : t.unitsPct + '%') + '</b></td></tr>';
      }).join('') + '</tbody></table></div>';

    /* month by month, so a custom window is not the only way to see a trend */
    var months = {};
    (D.sales || []).forEach(function (sl) {
      if (!CC.inRange(sl.at, r)) return;
      var mk = CC.monthKey(sl.at);
      months[mk] = months[mk] || { n: 0, v: 0 };
      months[mk].n++; months[mk].v += sl.price || 0;
    });
    var keys = Object.keys(months).sort();
    if (keys.length > 1) {
      var peak = Math.max.apply(null, keys.map(function (m2) { return months[m2].v; }));
      h += '<p class="eyebrow" style="margin-top:30px">Month by month</p><div class="card"><div class="spark">' +
        keys.map(function (m2) {
          return '<div class="sbar" title="' + esc(m2) + ': ' + months[m2].n + ' cars">' +
            '<span style="height:' + Math.round(100 * months[m2].v / peak) + '%"></span>' +
            '<em>' + esc(m2.slice(2)) + '</em><b>' + months[m2].n + '</b></div>';
        }).join('') + '</div></div>';
    }
    return h;
  };

  Object.assign(ACTIONS, {
    openPerson: function (id) { go('#/person/' + id); },
    editTarget: function (id) {
      var u = CC.staffById(id), t = D.targets[id] || { units: '', value: '' };
      modal('Target for ' + u.name, 'Per month. The report pro-rates it across whatever window is picked.',
        '<form id="targetform" data-uid="' + esc(id) + '">' +
        '<div class="f" style="margin-bottom:13px"><label for="t-units">Cars per month</label>' +
        '<input id="t-units" name="units" type="number" min="0" value="' + esc(t.units) + '"></div>' +
        '<div class="f" style="margin-bottom:13px"><label for="t-value">Sales value per month (₹)</label>' +
        '<input id="t-value" name="value" type="number" min="0" step="100000" value="' + esc(t.value) + '"></div>' +
        '<button class="btn" type="submit">Save target</button></form>');
    },
    exportReport: function () {
      var r = range(), a = acc();
      var people = CC.STAFF.filter(function (u) { return u.role === 'sales' || u.role === 'manager'; });
      var head = ['salesperson', 'role', 'customers', 'new', 'open', 'visits', 'cars_shown',
                  'sold', 'value', 'conversion_pct', 'followup_quality', 'target_cars', 'against_target_pct'];
      var lines = [head.join(',')];
      people.forEach(function (u) {
        var x = CC.personStats(D, u.id, CARS, r);
        lines.push([u.name, CC.ROLES[u.role].label, x.clients, x.newClients, x.open, x.visits,
                    x.carsShown, x.sales, a.cost ? x.value : '', x.conversion === null ? '' : x.conversion,
                    x.noteScore === null ? '' : x.noteScore,
                    x.target.targetUnits, x.target.unitsPct === null ? '' : x.target.unitsPct].join(','));
      });
      var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      var el2 = document.createElement('a');
      el2.href = URL.createObjectURL(blob);
      el2.download = 'carcart-report-' + r.from + '-to-' + r.to + '.csv';
      el2.click();
      toast('Report exported for ' + CC.rangeLabel(r) + '.');
    }
  });

  /* ---------------- settings ---------------- */

  VIEWS.settings = function (tab) {
    tab = tab || 'access';
    var tabs = [['access', 'Roles & access'], ['people', 'People'], ['branches', 'Showrooms'],
                ['connections', 'Connections'], ['sheet', 'Inventory sheet'], ['reset', 'Reset demo']];
    var h = '<div class="ph"><div><h1>Settings</h1><p>The owner\'s controls. Changes apply the moment you make them.</p></div></div>';
    h += '<div class="tabs">' + tabs.map(function (t) {
      return '<a class="tab ' + (t[0] === tab ? 'on' : '') + '" href="#/settings/' + t[0] + '">' + t[1] + '</a>';
    }).join('') + '</div>';

    if (tab === 'access') h += accessMatrix();
    else if (tab === 'people') h += peopleTab();
    else if (tab === 'branches') h += branchTab();
    else if (tab === 'connections') h += connections();
    else if (tab === 'sheet') h += (VIEWS.sheet ? VIEWS.sheet('panel') : '');
    else h += '<div class="card"><h3>Reset the demonstration</h3>' +
      '<p class="m">Puts every customer, visit, message, automation and car edit back to how it started. ' +
      'Cars you added and photographs you uploaded are removed.</p>' +
      '<p style="margin-top:14px"><button class="btn" data-act="resetDemo">Reset everything</button></p></div>';
    return h;
  };

  function accessMatrix() {
    var h = '<p class="hint" style="margin-bottom:12px">Each row is a role. Tick what they may reach. ' +
      'The owner\'s row is locked so nobody can switch off their own access.</p>';
    h += '<div class="scroller" style="max-height:none"><table class="matrix"><thead><tr><th>Role</th><th>Which customers</th>' +
      CC.CAPS.filter(function (c) { return c[0] !== 'settings' || true; }).map(function (c) {
        return '<th title="' + esc(c[2]) + '">' + esc(c[1]) + '</th>';
      }).join('') + '</tr></thead><tbody>';

    h += D.roles.map(function (r) {
      var a = D.access[r.id] || CC.NO_ACCESS;
      var locked = r.id === 'owner';
      var n = CC.staffByRole(r.id).length;
      return '<tr class="' + (locked ? 'locked' : '') + '">' +
        '<td class="rn">' + esc(r.name) + '<span>' + (n ? n + ' person' + (n === 1 ? '' : 's') : 'nobody yet') +
          (r.custom ? ' &middot; custom' : '') + '</span></td>' +
        '<td><select data-acc="' + esc(r.id) + '|scope"' + (locked ? ' disabled' : '') + '>' +
          Object.keys(CC.SCOPES).map(function (s) {
            return '<option value="' + s + '"' + (a.scope === s ? ' selected' : '') + '>' + CC.SCOPES[s] + '</option>';
          }).join('') + '</select></td>' +
        CC.CAPS.map(function (c) {
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
    var h = '<p class="hint" style="margin-bottom:12px">Everyone who can sign in. ' +
      'A new person gets the access their role carries, which you can change on the Roles tab.</p>';
    h += '<div class="scroller" style="max-height:none"><table class="matrix"><thead><tr>' +
      '<th>Person</th><th>Username</th><th>Role</th><th>Showroom</th><th>Customers</th><th></th>' +
      '</tr></thead><tbody>' + D.staff.map(function (u) {
        var n = D.clients.filter(function (c) { return c.assigned_to === u.id; }).length;
        return '<tr><td class="rn">' + esc(u.name) + '<span>joined ' + esc(u.joined || '—') + '</span></td>' +
          '<td>' + esc(u.login) + '</td>' +
          '<td><select data-person="' + esc(u.id) + '|role"' + (u.id === 'u1' ? ' disabled' : '') + '>' +
            D.roles.map(function (r) {
              return '<option value="' + esc(r.id) + '"' + (u.role === r.id ? ' selected' : '') + '>' +
                esc(r.name) + '</option>';
            }).join('') + '</select></td>' +
          '<td><select data-person="' + esc(u.id) + '|branch">' + D.branches.map(function (b) {
              return '<option value="' + esc(b.id) + '"' + (u.branch === b.id ? ' selected' : '') + '>' +
                esc(b.name) + '</option>';
            }).join('') + '</select></td>' +
          '<td class="num">' + n + '</td>' +
          '<td>' + (u.id === D.session ? '<span class="pill em">You</span>'
            : '<button class="minibtn" data-act="dropPerson" data-id="' + esc(u.id) + '">Remove</button>') +
          '</td></tr>';
      }).join('') + '</tbody></table></div>';

    h += '<div class="card" style="margin-top:16px"><h3>Add a team member</h3>' +
      '<p class="m">They can sign in straight away with the password <b>carcart26</b>.</p>' +
      '<form id="staffform" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:13px;align-items:end">' +
      '<div class="f"><label for="s-name">Full name</label><input id="s-name" name="name" required></div>' +
      '<div class="f"><label for="s-login">Username</label><input id="s-login" name="login" required></div>' +
      '<div class="f"><label for="s-role">Role</label><select id="s-role" name="role">' +
        D.roles.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label for="s-branch">Showroom</label><select id="s-branch" name="branch">' +
        D.branches.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>'; }).join('') +
      '</select></div>' +
      '<button class="btn" type="submit">Add person</button></form>' +
      '<p class="err" id="s-err"></p></div>';
    return h;
  }

  function branchTab() {
    var h = '<p class="hint" style="margin-bottom:12px">Each showroom carries its own people, ' +
      'its own stock allocation and its own monthly target.</p>';
    h += '<div class="grid2">' + D.branches.map(function (b) {
      var staff = D.staff.filter(function (u) { return u.branch === b.id; });
      var cl = D.clients.filter(function (c) { return c.branch === b.id; }).length;
      return '<div class="card"><div style="display:flex;gap:10px;align-items:flex-start">' +
        '<h3 style="flex:1">' + esc(b.name) + '</h3>' +
        (D.branches.length > 1
          ? '<button class="minibtn" data-act="dropBranch" data-id="' + esc(b.id) + '">Remove</button>' : '') +
        '</div>' +
        '<p class="m">' + esc(b.address || '') + '</p>' +
        '<p class="m" style="margin-top:4px">' + esc(b.phone || '') + '</p>' +
        '<div class="ministats" style="margin-top:13px">' +
          '<div><b>' + staff.length + '</b><span>people</span></div>' +
          '<div><b>' + cl + '</b><span>customers</span></div>' +
          '<div><b>' + (b.target && b.target.units || 0) + '</b><span>cars / month</span></div>' +
        '</div>' +
        '<p style="margin-top:12px"><a class="minibtn" href="#/targets">Set its target</a></p></div>';
    }).join('') + '</div>';

    h += '<div class="card" style="margin-top:16px"><h3>Add a showroom</h3>' +
      '<form id="branchform" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:13px;align-items:end">' +
      '<div class="f"><label for="b-name">Name</label><input id="b-name" name="name" placeholder="e.g. Banjara Hills" required></div>' +
      '<div class="f"><label for="b-addr">Address</label><input id="b-addr" name="address"></div>' +
      '<div class="f"><label for="b-phone">Phone</label><input id="b-phone" name="phone"></div>' +
      '<div class="f"><label for="b-units">Cars / month</label><input id="b-units" name="units" type="number" min="0" value="3"></div>' +
      '<button class="btn" type="submit">Add showroom</button></form></div>';
    return h;
  }

  function connections() {
    var rows = [
      ['WhatsApp Business', 'Enquiries, template sends and the 24-hour window.', 'Setting up',
       'warn', 'Needs a Meta Business account, a verified number and approved templates.'],
      ['Instagram', 'DMs and story replies arrive as enquiries.', 'Setting up', 'warn',
       'Needs the Instagram account linked to a Meta Business page.'],
      ['Google Business Profile', 'Calls, messages and reviews from Maps and Search.', 'Setting up', 'warn',
       'Needs ownership of the Car Cart listing.'],
      ['Meta lead ads', 'Lead form submissions land straight on the board.', 'Setting up', 'warn',
       'Needs Meta Business verification and app review.'],
      ['Website listings', 'The 25 cars and 270 photographs this console runs on.', 'Live', 'ok',
       'Reading carcartonline.com every five minutes. Working now.'],
      ['Inventory sheet', 'The spreadsheet the inventory desk works in.', 'Live', 'ok',
       'Written by the five-minute sweep. Export and import both work.']
    ];
    return '<div class="card" style="padding:0">' + rows.map(function (r) {
      return '<div class="conn"><div><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span>' +
        '<span style="display:block;color:var(--dim);margin-top:3px">' + esc(r[4]) + '</span></div>' +
        '<span class="pill ' + r[3] + '">' + esc(r[2]) + '</span></div>';
    }).join('') + '</div>' +
    '<div class="note">Nothing here sends a real message. The two marked Live genuinely read from ' +
    'carcartonline.com; the four marked Setting up are shown so you can see where they would sit, and what each needs before it works.</div>';
  }

  /* ---------------- actions ---------------- */

  Object.assign(ACTIONS, {
    closeModal: function () { document.getElementById('modal').close(); },
    signout: function () { D.session = null; save(); location.hash = '#/home'; render(); },
    openClient: function (id) { go('#/client/' + id); },
    openCar: function (id) { go('#/car/' + id); },
    doneFollow: function (id) {
      var f = D.followups.filter(function (x) { return x.id === id; })[0];
      if (f) { f.done = true; f.done_at = CC.today();
        log('follow_done', 'Follow-up completed' + (f.note ? ' — ' + f.note.slice(0, 60) : ''),
            { client: f.client, opp: f.opp });
        save(); toast('Marked done.'); render(); }
    },
    resetDemo: function () {
      if (!confirm('Reset the whole demonstration? Cars you added will be removed.')) return;
      var s = D.session;
      D = blank(); D.session = s;
      seed();
      save(); applyEdits(); toast('Demo reset.'); go('#/home');
    },
    goBack: function () {
      HIST.pop();                        // where we are
      var to = HIST.pop() || '#/home';   // where we were
      go(to);
    },
    dropPerson: function (id) {
      var u = CC.staffById(id);
      if (!u || id === D.session) return;
      var held = D.clients.filter(function (c) { return c.assigned_to === id; }).length;
      if (!confirm('Remove ' + u.name + '?' + (held ? ' Their ' + held + ' customers become unassigned.' : ''))) return;
      D.clients.forEach(function (c) { if (c.assigned_to === id) c.assigned_to = null; });
      D.staff = D.staff.filter(function (x) { return x.id !== id; });
      syncStaff(); log('staff_remove', u.name + ' removed from the team');
      save(); toast(u.name + ' removed.'); render();
    },
    dropBranch: function (id) {
      if (D.branches.length < 2) return toast('You need at least one showroom.', true);
      var b = CC.branchById(D.branches, id);
      var staff = D.staff.filter(function (u) { return u.branch === id; });
      if (staff.length) return toast('Move ' + staff.length + ' people out of ' + b.name + ' first.', true);
      D.branches = D.branches.filter(function (x) { return x.id !== id; });
      log('branch_remove', b.name + ' closed');
      save(); toast(b.name + ' removed.'); render();
    },
    dictate: function (id, el) { dictate(id, el); },
    hardReload: function () {
      /* a new query string forces the browser to fetch every file again */
      location.replace(location.pathname + '?fresh=' + Date.now() + location.hash);
    },
    setRange: function (k) {
      RANGE.key = k;
      if (k === 'custom' && !RANGE.from) {
        var d = CC.rangeDates('month');
        RANGE.from = d[0]; RANGE.to = d[1];
      }
      render();
    },
    switchUser: function () {
      modal('Switch user', 'Every password is carcart26.',
        '<div class="creds">' + CC.STAFF.map(function (u) {
          return '<button type="button" data-act="beUser" data-id="' + u.id + '">' +
            '<b>' + esc(u.name) + '</b> <em>' + esc(CC.ROLES[u.role].label) + '</em>' +
            '<span>' + esc(u.login) + '</span></button>';
        }).join('') + '</div>');
    },
    beUser: function (id) {
      D.session = id; save();
      document.getElementById('modal').close();
      go('#/home'); toast('Now signed in as ' + CC.staffById(id).name + '.');
    }
  });

  /* ---------------- boot ---------------- */

  function seed() {
    if (window.SEEDER) window.SEEDER(D, RAW);
  }

  function boot() {
    if (booted) return; booted = true;
    D = load();

    fetch('data/stock.json').then(function (r) { return r.json(); }).then(function (rows) {
      RAW = rows;
      if (!D.clients.length) { seed(); save(); }
      syncStaff();
      applyEdits();
      loadSheet();
      wire();
      render();
    }).catch(function (e) {
      document.body.innerHTML = '<div class="deny" style="margin:60px auto;max-width:520px">' +
        '<h3>The inventory did not load</h3><p>' + esc(String(e)) + '</p></div>';
    });
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
    $('#lg-list').innerHTML = CC.STAFF.map(function (u) {
      return '<button type="button" data-login="' + u.login + '">' +
        '<b>' + esc(u.name) + '</b> <em>' + esc(CC.ROLES[u.role].label) + '</em>' +
        '<span>' + esc(u.login) + '</span></button>';
    }).join('');

    $('#loginform').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = CC.authenticate($('#lg-u').value, $('#lg-p').value);
      if (!u) { $('#lg-err').textContent = 'That username and password do not match.'; return; }
      D.session = u.id; save();
      $('#lg-err').textContent = '';
      go('#/home');
    });

    document.addEventListener('click', function (e) {
      var fill = e.target.closest('[data-login]');
      if (fill) { $('#lg-u').value = fill.dataset.login; $('#lg-p').value = 'carcart26'; $('#lg-p').focus(); return; }

      if (e.target.closest('#uchip')) { ACTIONS.switchUser(); return; }

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
      var el = e.target.closest('[data-acc]');
      if (el) {
        var p = el.dataset.acc.split('|');
        D.access[p[0]] = D.access[p[0]] || Object.assign({}, CC.NO_ACCESS);
        D.access[p[0]][p[1]] = el.type === 'checkbox' ? el.checked : el.value;
        log('access_change', (D.roles.filter(function (r2) { return r2.id === p[0]; })[0] || {}).name +
            ' — ' + p[1] + ' set to ' + (el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value));
        save();
        toast('Updated ' + (D.roles.filter(function (r) { return r.id === p[0]; })[0] || {}).name + '.');
        if (p[0] === me().role) render();
        return;
      }
      var bt = e.target.closest ? e.target.closest('[data-btarget]') : null;
      if (bt) {
        var bp = bt.dataset.btarget.split('|');
        var br = CC.branchById(D.branches, bp[0]);
        if (br) { br.target = br.target || {}; br.target[bp[1]] = Number(bt.value) || 0;
          log('target_set', br.name + ' — ' + bp[1] + ' target set to ' + bt.value);
          save(); toast('Target set for ' + br.name + '.'); render(); }
        return;
      }
      var pt = e.target.closest ? e.target.closest('[data-ptarget]') : null;
      if (pt) {
        var pp = pt.dataset.ptarget.split('|');
        D.targets[pp[0]] = D.targets[pp[0]] || { units: 0, value: 0 };
        D.targets[pp[0]][pp[1]] = Number(pt.value) || 0;
        log('target_set', CC.staffById(pp[0]).name + ' — ' + pp[1] + ' target set to ' + pt.value);
        save(); toast('Target set for ' + CC.staffById(pp[0]).name + '.'); render();
        return;
      }
      var pe = e.target.closest ? e.target.closest('[data-person]') : null;
      if (pe) {
        var pk = pe.dataset.person.split('|');
        var who = D.staff.filter(function (u) { return u.id === pk[0]; })[0];
        if (who) { who[pk[1]] = pe.value; syncStaff();
          log('staff_edit', who.name + ' — ' + pk[1] + ' changed');
          save(); toast(who.name + ' updated.'); render(); }
        return;
      }
      if (e.target.id === 'r-from') { RANGE.from = e.target.value; render(); return; }
      if (e.target.id === 'r-to') { RANGE.to = e.target.value; render(); return; }
      if (ACTIONS.onChange) ACTIONS.onChange(e);
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
      if (e.target.id === 'staffform') {
        e.preventDefault();
        var fd = new FormData(e.target);
        var login = String(fd.get('login') || '').trim().toLowerCase();
        var err = document.getElementById('s-err');
        if (!login || D.staff.some(function (u) { return u.login === login; })) {
          err.textContent = 'That username is taken. Pick another.'; return;
        }
        D.staff.push({ id: 'u' + Date.now(), login: login, pass: 'carcart26',
          name: String(fd.get('name')).trim(), role: fd.get('role'),
          branch: fd.get('branch'), joined: CC.today() });
        syncStaff();
        log('staff_add', fd.get('name') + ' added as ' + fd.get('role') + ' at ' +
            CC.branchName(D.branches, fd.get('branch')));
        save();
        toast(fd.get('name') + ' can sign in as ' + login + '.');
        render();
        return;
      }
      if (e.target.id === 'branchform') {
        e.preventDefault();
        var bf = new FormData(e.target);
        D.branches.push({ id: 'b' + Date.now(), name: String(bf.get('name')).trim(),
          address: bf.get('address') || '', phone: bf.get('phone') || '',
          target: { units: Number(bf.get('units')) || 0, value: 0 } });
        log('branch_add', bf.get('name') + ' opened as a showroom');
        save(); toast(bf.get('name') + ' added.'); render();
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
        toast('Target set for ' + CC.staffById(uid).name + '.');
        render();
        return;
      }
      if (ACTIONS.onSubmit) ACTIONS.onSubmit(e);
    });

    window.addEventListener('hashchange', render);
  }

  window.GE = {
    boot: boot, render: render, go: go, toast: toast, modal: modal, deny: deny,
    VIEWS: VIEWS, ACTIONS: ACTIONS,
    me: me, acc: acc, can: can, save: save,
    D: function () { return D; },
    cars: function () { return CARS; },
    carById: carById, rawById: rawById, editCar: editCar, applyEdits: applyEdits,
    clientById: clientById, onFloor: onFloor, pendingMsgs: pendingMsgs,
    range: range, inRange: inRange, rangeBar: rangeBar, micButton: micButton,
    log: log, KINDS: KINDS, KIND_GROUPS: KIND_GROUPS,
    migrate: migrate,   // exposed so the upgrade path can be tested
    setHashForTest: function (h) { location.hash = h; },
    sheet: function () { return SHEET; },
    syncLog: function () { return SYNCLOG; },
    setSheet: function (t) { SHEET = t; },
    addCar: function (car) { D.newCars.push(car); save(); applyEdits(); }
  };
})();
