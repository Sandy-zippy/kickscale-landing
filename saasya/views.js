/* Every screen. One function per route, each returning HTML. */
(function () {
  var V = GE.VIEWS, A = GE.ACTIONS;
  var esc = GE.esc, rupees = GE.rupees, lakh = GE.lakh, d = GE.d, dt = GE.dt, days = GE.days;
  var by = GE.by, one = GE.one, sum = GE.sum;

  function D() { return GE.D; }
  function pname(id) { var p = one(D().people, id); return p ? p.name : '—'; }
  function cname(id) { var c = one(D().clients, id); return c ? c.name : '—'; }
  function dgname(id) { var g = one(D().designers, id); return g ? g.name : '—'; }
  function fname(id) { var f = one(D().fabrics, id); return f ? f.brand + ' ' + f.colour : '—'; }
  function garmentsOf(oid) { return by(D().garments, 'order', oid); }
  function famName(fid) { var f = one(D().families, fid); return f ? f.name + ', ' + f.area : '—'; }
  function head(t, sub, right) {
    return '<div class="ph"><div><h1>' + t + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
           '<div>' + (right || '') + '</div></div>';
  }
  function pill(txt, cls) { return '<span class="pill ' + (cls || '') + '">' + esc(txt) + '</span>'; }
  function bar(pct, cls) {
    pct = Math.max(0, Math.min(100, Math.round(pct)));
    return '<span class="bar"><i class="' + (cls || '') + '" style="width:' + pct + '%"></i></span>';
  }
  function stagePill(st) {
    var cls = '';
    if (st === 'Delivered' || st === 'Ready') cls = 'ok';
    else if (st === 'Lost' || st === 'Queried by designer' || st === 'Reworking' || st === 'Back to designer') cls = 'bad';
    else if (st === 'Not started' || st === 'Stylist') cls = 'warn';
    return pill(st, cls);
  }
  function lateness(o) {
    if (!o.delivery || o.stage === 'Delivered') return '';
    var left = days(GE.TODAY, o.delivery);
    if (left < 0) return pill((-left) + 'd late', 'bad');
    if (left <= 14) return pill(left + 'd to go', left <= 7 ? 'bad' : 'warn');
    return '<span class="sub">' + left + ' days</span>';
  }
  function kpi(v, label, note) {
    return '<div class="kpi"><b>' + v + '</b><span>' + esc(label) + '</span>' +
           (note ? '<i>' + esc(note) + '</i>' : '') + '</div>';
  }
  function fld(l, v) { return '<div class="f"><label>' + esc(l) + '</label><div>' + esc(v) + '</div></div>'; }

  /* ---------- search: one box, filtering as you type, on every list ---------- */

  function q(route) { return GE.Q[route] || ''; }
  function searchBar(route, placeholder, shown, total) {
    return '<div class="searchrow"><input class="search" data-input="search" data-id="' + route +
      '" value="' + esc(q(route)) + '" placeholder="' + esc(placeholder) + '" autocomplete="off">' +
      '<span class="sub">' + (shown === total ? total + ' in all' : shown + ' of ' + total) + '</span>' +
      (q(route) ? ' <button class="mini" data-act="clearSearch" data-id="' + route + '">Clear</button>' : '') +
      '</div>';
  }
  A.search = function (route, el) {
    GE.Q[route] = el.value;
    var caret = el.selectionStart;
    GE.refresh();
    var again = document.querySelector('.search[data-id="' + route + '"]');
    if (again) { again.focus(); try { again.setSelectionRange(caret, caret); } catch (e) {} }
  };
  A.clearSearch = function (route) { GE.Q[route] = ''; GE.refresh(); };

  /* ---------- a bunch of cloth, as a photograph or as its weave ---------- */

  function weave(f) {
    var hex = (f && f.hex) || '#cccccc', p = ((f && f.pattern) || '').toLowerCase();
    var line = 'rgba(0,0,0,.14)', lift = 'rgba(255,255,255,.16)', g;
    if (p.indexOf('herringbone') > -1)
      g = '<path d="M0 0l4 4 4-4M0 8l4 4 4-4" stroke="' + line + '" fill="none" stroke-width="1.2"/>';
    else if (p.indexOf('birdseye') > -1)
      g = '<circle cx="2" cy="2" r="1" fill="' + line + '"/><circle cx="6" cy="6" r="1" fill="' + lift + '"/>';
    else if (p.indexOf('twill') > -1)
      g = '<path d="M-2 2L2 -2M0 8L8 0M6 10l4-4" stroke="' + line + '" stroke-width="1.4"/>';
    else if (p.indexOf('slub') > -1)
      g = '<path d="M0 3h8M0 6h5M3 1h5" stroke="' + line + '" stroke-width=".9"/>';
    else
      g = '<path d="M0 4h8M4 0v8" stroke="' + line + '" stroke-width=".7"/>';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">' +
      '<rect width="8" height="8" fill="' + hex + '"/>' + g + '</svg>';
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
  }
  function fabSwatch(f, h) {
    if (f && f.img) return '<div class="sw" style="height:' + h + 'px"><img src="' + f.img + '" alt=""></div>';
    return '<div class="sw" style="height:' + h + 'px;background:' + ((f && f.hex) || '#ccc') +
      ';background-image:' + weave(f) + ';background-size:14px 14px"></div>';
  }
  function fabThumb(f) {
    if (f && f.img) return '<img class="thumb" src="' + f.img + '" alt="">';
    return '<span class="thumb" style="display:inline-block;background:' + ((f && f.hex) || '#ccc') +
      ';background-image:' + weave(f) + ';background-size:12px 12px"></span>';
  }

  /* ---------- the money on one order, drawn the same way everywhere ---------- */

  function moneyBlock(m, editable) {
    var h = '<table class="mon"><tbody>' +
      '<tr><td>Order value <span class="sub">the whole engagement, before tax</span></td>' +
      '<td>' + rupees(m.value) + '</td></tr>';
    (m.cuts || []).forEach(function (c, i) {
      h += '<tr class="cut"><td>Less: ' + esc(c.label) +
        (editable ? ' <button class="mini" data-act="dropCut" data-id="' + m.order.id + '|' + i +
          '" title="Take this deduction off">&times;</button>' : '') +
        '</td><td>− ' + rupees(c.amount) + '</td></tr>';
    });
    h += '<tr><td><b>Net order value</b></td><td><b>' + rupees(m.net) + '</b></td></tr>' +
      '<tr><td>GST at ' + Math.round(m.rate * 100) + '%</td><td>+ ' + rupees(m.gst) + '</td></tr>' +
      '<tr class="big"><td>Total payable</td><td>' + rupees(m.total) + '</td></tr>' +
      '<tr><td>Paid so far <span class="sub">' + (m.paid ? 'advance and part payments' : 'nothing yet') +
      '</span></td><td>− ' + rupees(m.paid) + '</td></tr>' +
      '<tr class="pend"><td>Pending at delivery</td><td>' + rupees(m.pending) + '</td></tr>' +
      '</tbody></table>';
    if (editable) h += '<div style="margin-top:12px"><button class="mini" data-act="addCut" data-id="' +
      m.order.id + '">Add a deduction</button> <span class="hint">as many as you need. ' +
      'A deduction has no payment mode. A payment does.</span></div>';
    return h;
  }

  /* ---------- the agent strip ---------- */

  function agentStrip(limit) {
    var all = GE.runAgents();
    if (!GE.can('ops') && !GE.can('invoices')) return '';
    var show = all.filter(function (f) { return f.level !== 'ok'; }).slice(0, limit || 4);
    if (!show.length) return '';
    var h = '<div class="card"><div class="cardhead"><h3>What the agents are raising</h3>' +
            '<a class="mini" href="#/agents">All ' + all.length + ' and their rules</a></div>';
    show.forEach(function (f) {
      h += '<div class="rung"><div class="n">' + (f.level === 'bad' ? '!' : '·') + '</div>' +
           '<div><b>' + esc(f.what) + '</b><p>' + esc(f.agentName) + ': ' + esc(f.why) + '</p></div>' +
           '<div><a class="mini" href="' + f.route + '">Open</a></div></div>';
    });
    return h + '</div>';
  }

  /* ================= Overview, different for every role ================= */

  V['#/home'] = function () {
    var me = GE.me(), role = me.role;
    var w = GE.windowFor('Month');
    var closed = GE.closedIn(w);
    var live = D().garments.filter(function (g) { return g.stage !== 'Ready' && g.stage !== 'Delivered'; });
    var liveOrders = {}; live.forEach(function (g) { liveOrders[g.order] = 1; });
    var owed = sum(D().payables.filter(function (p) { return !p.paid; }),
      function (p) { return GE.payableOn(p).payable; });
    var shelf = sum(D().fabrics, function (f) { return GE.stockOf(f.id).hand * f.cost; });
    var pending = sum(D().orders, function (o) { return Math.max(0, GE.orderMoney(o.id).pending); });

    var h = head('Good morning, ' + esc(me.name.split(' ')[0]) + '.',
      esc(role) + ' · ' + d(GE.TODAY) + ' · Kolkata',
      '<span class="pill gold">October 2026</span>');

    if (role === 'Master') {
      var mine = D().garments.filter(function (g) { return g.master === me.id && g.stage !== 'Delivered'; });
      var late = mine.filter(function (g) { return g.due && days(GE.TODAY, g.due) < 0; });
      h += '<div class="kpis">' +
        kpi(mine.length, 'Garments in your hands', '') +
        kpi(late.length, 'Past their date', late.length ? 'see them first' : 'nothing late') +
        kpi(mine.filter(function (g) { return days(GE.TODAY, g.due) <= 7; }).length, 'Due inside a week', '') +
        '</div>';
      h += '<div class="note">You see the garments given to you, their stage, their measurements and ' +
           'their fabric. You do not see any money. That is deliberate.</div>';
      h += '<div class="card">' + garmentTable(mine, false) + '</div>';
      return h;
    }

    h += '<div class="kpis">';
    if (GE.can('money')) {
      h += kpi(lakh(sum(closed, function (o) { return o.value; })), 'Taken this month',
               closed.length + ' orders where the advance landed');
      h += kpi(lakh(pending), 'Pending across every order', 'order value less what has come in');
    }
    h += kpi(live.length, 'Garments in motion', 'across ' + Object.keys(liveOrders).length + ' orders');
    if (GE.can('cost')) {
      var delivered = D().orders.filter(function (o) { return o.stage === 'Delivered'; });
      h += kpi(lakh(sum(delivered, function (o) { return GE.marginOf(o.id).kept; })),
               'Made on delivered work', 'order value less every cost line');
    }
    if (GE.can('invoices')) h += kpi(lakh(owed), 'Owed to designers', 'after GST and our margin');
    if (GE.can('stock') === true) h += kpi(lakh(shelf), 'Fabric on the shelf', 'both warehouses, at cost');
    h += '</div>';

    if (role === 'Owner') {
      h += '<div class="note"><b>The AI overview.</b> Three things about this morning. ' +
           'Karan Bhansali’s churidar has sat at Not started for 15 days while the sherwani it goes under ' +
           'is already in handwork. Shantanu &amp; Nikhil have been waiting three days for an answer on a collar ' +
           'height, and nobody has replied. Loro Piana ivory is down to 4.7 metres and Milan takes 28 days. ' +
           '<span class="sub">The owner sees this panel and the agent discussions. The BDM does not.</span></div>';
    }

    h += agentStrip(5);

    if (GE.can('money')) {
      h += '<div class="card"><div class="cardhead"><h3>Closed this month</h3>' +
           '<span class="sub">order value counts when the advance arrives</span></div>' +
           '<table><thead><tr><th>Order</th><th>Client</th><th>Type</th><th>Sold by</th>' +
           '<th>Source</th><th class="num">Order value</th><th class="num">Pending</th></tr></thead><tbody>';
      closed.forEach(function (o) {
        var m = GE.orderMoney(o.id);
        h += '<tr class="click" data-act="openOrder" data-id="' + o.id + '"><td><b>' + o.id + '</b></td>' +
             '<td>' + esc(cname(o.client)) + '</td><td>' + esc(o.type || '—') +
             '</td><td>' + esc(pname(o.salesperson)) + '</td><td>' + esc(o.source) + '</td>' +
             '<td class="num">' + GE.money(o.value) + '</td>' +
             '<td class="num">' + GE.money(m.pending) + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    return h;
  };

  /* ================= Clients, with the household inside ================= */

  V['#/clients'] = function () {
    var all = D().clients;
    var list = all.filter(function (c) {
      return GE.matches(q('#/clients'), [c.name, c.phone, c.email, c.relation, c.source,
        famName(c.family), (one(D().families, c.family) || {}).name]);
    });
    var h = head('Clients', 'Every client, one after the other. A client is one person, because every set of measurements is his own. The household he belongs to is inside his record.',
      '<button class="btn gold" data-act="newClient">Add a client</button>');
    h += searchBar('#/clients', 'Search a name, a number, a family, a source', list.length, all.length);
    h += '<div class="card"><table><thead><tr><th>Client</th><th>Number</th><th>Household</th>' +
      '<th>Source</th><th>Measurement sets</th><th>Running now</th>' +
      '<th class="num">Given us, to date</th><th class="num">The family together</th><th></th></tr></thead><tbody>';
    list.forEach(function (c) {
      var mine = by(D().orders, 'client', c.id);
      var running = mine.filter(function (o) { return o.stage !== 'Delivered' && o.stage !== 'Lost'; });
      var fam = D().orders.filter(function (o) { return o.family === c.family; });
      h += '<tr class="click" data-act="openClient" data-id="' + c.id + '">' +
        '<td><b>' + esc(c.name) + '</b>' + (c.relation ? '<div class="sub">' + esc(c.relation) + '</div>' : '') + '</td>' +
        '<td class="sub">' + esc(c.phone) + '</td>' +
        '<td>' + esc(famName(c.family)) + '</td>' +
        '<td>' + esc(c.source) + '</td>' +
        '<td>' + by(D().meas, 'client', c.id).length + '</td>' +
        '<td>' + (running.length ? running.length + ' of ' + mine.length : '<span class="sub">nothing</span>') + '</td>' +
        '<td class="num">' + GE.money(sum(mine, function (o) { return o.value; })) + '</td>' +
        '<td class="num sub">' + GE.money(sum(fam, function (o) { return o.value; })) + '</td>' +
        '<td><button class="mini">Open</button></td></tr>';
    });
    if (!list.length) h += '<tr><td colspan="9" class="sub">Nobody matches that.</td></tr>';
    return h + '</tbody></table></div>';
  };

  A.openClient = function (id) {
    var c = one(D().clients, id);
    if (!c) return;
    var fam = one(D().families, c.family);
    var kin = by(D().clients, 'family', c.family).filter(function (x) { return x.id !== c.id; });
    var orders = by(D().orders, 'client', c.id);
    var running = orders.filter(function (o) { return o.stage !== 'Delivered' && o.stage !== 'Lost'; });
    var famOrders = D().orders.filter(function (o) { return o.family === c.family; });
    var sets = by(D().meas, 'client', c.id);
    var mine = sum(orders, function (o) { return o.value; });
    var pending = sum(orders, function (o) { return Math.max(0, GE.orderMoney(o.id).pending); });

    var h = '<h1>' + esc(c.name) + '</h1>' +
      '<p class="sub">' + esc(c.relation || '') + (c.relation ? ' · ' : '') +
      esc(fam ? fam.name + ', ' + fam.area : '') + ' · ' + esc(c.phone) + '</p>';

    h += '<div class="kpis">' +
      kpi(GE.moneyShort(mine), 'His revenue to date', orders.length + ' orders') +
      kpi(GE.moneyShort(sum(famOrders, function (o) { return o.value; })), 'The household together',
          famOrders.length + ' orders across ' + (kin.length + 1) + ' people') +
      kpi(running.length, 'Running right now', running.length ? 'see them below' : 'nothing open') +
      kpi(GE.moneyShort(pending), 'Still to come in', 'across his open orders') + '</div>';

    h += '<div class="card"><div class="three">' +
      fld('Phone', c.phone) + fld('Email', c.email || '—') + fld('How he found us', c.source) +
      fld('Birthday', d(c.dob)) + fld('Anniversary', d(c.anniversary)) +
      fld('Stylist', pname(c.stylist)) +
      '</div><div class="f"><label>Note</label><textarea rows="2" data-change="saveClientNote" data-id="' +
      c.id + '">' + esc(c.note) + '</textarea></div></div>';

    /* the household, a segment inside the client, not a screen of its own */
    h += '<div class="card"><div class="cardhead"><div><h3>Household</h3>' +
      '<p class="sub">' + esc(fam ? fam.name + ' of ' + fam.area : '') +
      (fam && fam.note ? ' · ' + esc(fam.note) : '') + '</p></div>' +
      '<div style="text-align:right"><b>' + GE.moneyShort(sum(famOrders, function (o) { return o.value; })) +
      '</b><div class="sub">lifetime, the family</div></div></div>';
    if (!kin.length) h += '<p class="sub">Nobody else on this household yet.</p>';
    else {
      h += '<table><thead><tr><th>Who</th><th>In the family</th><th>Orders</th>' +
        '<th class="num">Lifetime</th><th></th></tr></thead><tbody>';
      kin.forEach(function (k) {
        var ko = by(D().orders, 'client', k.id);
        h += '<tr class="click" data-act="openClient" data-id="' + k.id + '">' +
          '<td><b>' + esc(k.name) + '</b><div class="sub">' + esc(k.phone) + '</div></td>' +
          '<td>' + esc(k.relation || '—') + '</td><td>' + ko.length + '</td>' +
          '<td class="num">' + GE.money(sum(ko, function (o) { return o.value; })) + '</td>' +
          '<td><button class="mini">Open</button></td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '</div>';

    h += commBlock('client', c.id);

    h += '<div class="card"><div class="cardhead"><h3>Measurements</h3>' +
         '<button class="mini" data-act="newMeas" data-id="' + c.id + '">Take a new set</button></div>';
    if (!sets.length) h += '<p class="sub">No set yet. Measurements are taken after the advance.</p>';
    GE.KINDS.forEach(function (kind) {
      var ks = sets.filter(function (m) { return m.kind === kind; })
                   .sort(function (a, b) { return a.at < b.at ? 1 : -1; });
      if (!ks.length) return;
      h += '<div class="rung"><div class="n">' + ks.length + '</div><div><b>' + esc(kind) + '</b>' +
           '<p>latest ' + d(ks[0].at) + ', ' + esc(ks[0].why) + ', by ' + esc(pname(ks[0].by)) + '</p></div>' +
           '<div><button class="mini" data-act="openMeas" data-id="' + c.id + '|' + kind + '">See the sets</button></div></div>';
    });
    h += '</div>';

    h += '<div class="card"><div class="cardhead"><h3>His orders</h3>' +
      '<button class="mini" data-act="newOrder" data-id="' + c.id + '">Start one</button></div>' +
      '<table><thead><tr><th>Order</th><th>Type</th><th>Stage</th><th>Delivery</th>' +
      '<th class="num">Order value</th><th class="num">Pending</th></tr></thead><tbody>';
    orders.forEach(function (o) {
      var m = GE.orderMoney(o.id);
      h += '<tr class="click" data-act="openOrder" data-id="' + o.id + '"><td><b>' + o.id + '</b></td>' +
           '<td>' + esc(o.type || '—') + '</td>' +
           '<td>' + stagePill(o.stage) + '</td><td>' + d(o.delivery) + '</td>' +
           '<td class="num">' + GE.money(o.value) + '</td>' +
           '<td class="num">' + GE.money(m.pending) + '</td></tr>';
    });
    if (!orders.length) h += '<tr><td colspan="6" class="sub">Nothing yet.</td></tr>';
    h += '</tbody></table></div>';

    h += '<div class="card"><h3>Timeline</h3><div class="tl">' + timelineFor(c.id) + '</div></div>';
    GE.drawer(h);
  };

  function timelineFor(clientId) {
    var evs = [];
    by(D().orders, 'client', clientId).forEach(function (o) {
      (o.history || []).forEach(function (hh) {
        evs.push({ at: hh.at, what: o.id + ' moved to ' + hh.stage, who: pname(hh.by) });
      });
      garmentsOf(o.id).forEach(function (g) {
        (g.history || []).forEach(function (hh) {
          if (hh.handover) evs.push({ at: hh.at,
            what: g.kind + ' passed from ' + pname(hh.from) + ' to ' + pname(hh.to), who: pname(hh.by) });
        });
      });
    });
    GE.commsOn('client', clientId).forEach(function (c) {
      evs.push({ at: c.at, what: c.source + ': ' + c.note.slice(0, 90), who: pname(c.who) });
    });
    by(D().meas, 'client', clientId).forEach(function (m) {
      evs.push({ at: m.at, what: m.kind + ' measured, ' + m.why, who: pname(m.by) });
    });
    evs.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    if (!evs.length) return '<p class="sub empty">Nothing yet.</p>';
    return evs.map(function (e) {
      return '<div class="ev"><b>' + esc(e.what) + '</b><span>' + dt(e.at) + ' · ' + esc(e.who) + '</span></div>';
    }).join('');
  }

  /* ---------- the communication log ---------- */

  function commBlock(kind, ref) {
    var list = GE.commsOn(kind, ref);
    var h = '<div class="card"><div class="cardhead"><h3>Communication</h3>' +
      '<button class="mini" data-act="logComm" data-id="' + kind + '|' + ref + '">Log a communication</button></div>';
    if (!list.length) h += '<p class="sub empty">Nothing logged yet.</p>';
    list.forEach(function (c) {
      h += '<div class="rung"><div class="n">' + esc((c.source || '?')[0]) + '</div><div>' +
        '<b>' + esc(c.source) + ' · ' + dt(c.at) + '</b>' +
        '<p>' + esc(c.note) + '</p>' +
        (c.docs && c.docs.length ? '<p>' + c.docs.map(function (f) {
          return '<span class="pill">' + esc(f.name) + ' · ' + esc(f.size) + '</span> ' +
            '<button class="mini" data-act="docAct" data-id="open|' + esc(f.name) + '">Open</button> ' +
            '<button class="mini" data-act="docAct" data-id="share|' + esc(f.name) + '">Share</button> ' +
            '<button class="mini" data-act="docAct" data-id="download|' + esc(f.name) + '">Download</button> ' +
            '<button class="mini" data-act="docAct" data-id="edit|' + esc(f.name) + '">Edit</button>';
        }).join(' ') + '</p>' : '') +
        '</div><div class="sub">' + esc(pname(c.who)) + '</div></div>';
    });
    return h + '</div>';
  }

  A.logComm = function (id) {
    var p = id.split('|'), kind = p[0], ref = p[1];
    GE.modal('<h2>Log a communication</h2><p class="sub">On ' + esc(ref) + '</p>' +
      '<div class="two"><div class="f"><label>When</label>' +
      '<input type="date" id="cmDate" value="' + GE.TODAY + '"></div>' +
      '<div class="f"><label>Where it happened</label><select id="cmSrc">' +
      ['WhatsApp','Email','Call','Walk-in','Instagram','Online meet','Outreach by Mark'].map(function (s) {
        return '<option>' + s + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="f"><label>What was said</label><textarea id="cmNote" rows="4" ' +
      'placeholder="He asked whether the sherwani could be a week earlier."></textarea></div>' +
      '<div class="f"><label>Documents</label><input type="file" id="cmDoc" multiple>' +
      '<div class="hint">Once attached you can open, share, download or edit it.</div></div>' +
      '<button class="btn gold" data-act="saveComm" data-id="' + esc(id) + '">Save it</button>');
  };
  A.saveComm = function (id) {
    var p = id.split('|');
    var note = document.getElementById('cmNote').value.trim();
    if (!note) { GE.toast('Write what was said first.'); return; }
    var files = document.getElementById('cmDoc').files, docs = [];
    for (var i = 0; i < files.length; i++)
      docs.push({ name: files[i].name, size: Math.max(1, Math.round(files[i].size / 1024)) + ' KB' });
    GE.addComm(p[0], p[1], {
      at: document.getElementById('cmDate').value + 'T' + new Date().toTimeString().slice(0, 5),
      source: document.getElementById('cmSrc').value, who: GE.me().id, note: note, docs: docs
    });
    GE.closeModal();
    if (p[0] === 'client') A.openClient(p[1]); else A.openOrder(p[1]);
    GE.toast('Logged. It stays with the record, and it follows the client.');
  };
  A.docAct = function (id) {
    var p = id.split('|');
    GE.toast(p[0].charAt(0).toUpperCase() + p[0].slice(1) + ' ' + p[1] +
      ': in the built system this opens the real file from storage.');
  };
  A.saveClientNote = function (id, el) {
    var c = one(D().clients, id); if (!c) return;
    c.note = el.value; GE.save(); GE.toast('Saved.');
  };

  /* ---------- measurements ---------- */

  A.openMeas = function (id) {
    var p = id.split('|'), cid = p[0], kind = p[1];
    var sets = by(D().meas, 'client', cid).filter(function (m) { return m.kind === kind; })
                 .sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    var fields = GE.MEAS[kind] || [];
    var h = '<h1>' + esc(kind) + '</h1><p class="sub">' + esc(cname(cid)) +
      ' · ' + sets.length + ' dated set' + (sets.length === 1 ? '' : 's') +
      '. A set is never overwritten.</p>';
    h += '<div class="card"><table><thead><tr><th>Measurement</th>' +
      sets.map(function (s) { return '<th class="num">' + d(s.at) + '</th>'; }).join('') +
      (sets.length > 1 ? '<th class="num">Change</th>' : '') + '</tr></thead><tbody>';
    fields.forEach(function (f) {
      var vals = sets.map(function (s) { return s.vals[f]; });
      var delta = (sets.length > 1 && vals[0] != null && vals[1] != null) ? (vals[0] - vals[1]) : null;
      h += '<tr><td>' + esc(f) + '</td>' +
        vals.map(function (v) { return '<td class="num">' + (v == null ? '—' : v) + '"</td>'; }).join('') +
        (sets.length > 1 ? '<td class="num">' + (delta == null || delta === 0 ? '—' :
          '<span class="pill ' + (delta < 0 ? 'bad' : 'warn') + '">' +
          (delta > 0 ? '+' : '') + delta.toFixed(1) + '"</span>') + '</td>' : '') + '</tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="card"><h3>Why each set exists</h3>';
    sets.forEach(function (s) {
      h += '<div class="rung"><div class="n">' + d(s.at).slice(0, 2) + '</div><div><b>' + esc(s.why) + '</b>' +
        '<p>' + d(s.at) + ', taken by ' + esc(pname(s.by)) + (s.trial ? ', at ' + esc(s.trial) : '') +
        ', in ' + esc(s.unit) + '</p></div><div></div></div>';
    });
    h += '</div><button class="btn gold" data-act="newMeas" data-id="' + cid + '|' + esc(kind) + '">Take a new set</button>';
    GE.drawer(h);
  };

  A.newMeas = function (id) {
    var p = id.split('|'), cid = p[0], kind = p[1] || GE.KINDS[0];
    var last = by(D().meas, 'client', cid).filter(function (m) { return m.kind === kind; })
                 .sort(function (a, b) { return a.at < b.at ? 1 : -1; })[0];
    var h = '<h2>A new set</h2><p class="sub">' + esc(cname(cid)) + '. The last set stays where it is.</p>' +
      '<div class="two"><div class="f"><label>Garment</label><select id="msKind" data-change="switchMeasKind" data-id="' + cid + '">' +
      GE.KINDS.map(function (k) { return '<option' + (k === kind ? ' selected' : '') + '>' + k + '</option>'; }).join('') +
      '</select></div><div class="f"><label>Why it is being taken again</label><select id="msWhy">' +
      GE.MEAS_WHY.map(function (w) { return '<option' + (last ? '' : (w === 'First set' ? ' selected' : '')) + '>' + w + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="two"><div class="f"><label>Date</label><input type="date" id="msAt" value="' + GE.TODAY + '"></div>' +
      '<div class="f"><label>Unit</label><select id="msUnit"><option>inches</option><option>centimetres</option></select></div></div>' +
      '<div class="card pad" id="msFields">' + measFields(kind, last) + '</div>' +
      '<button class="btn gold" data-act="saveMeas" data-id="' + cid + '">Save the set</button>';
    GE.modal(h);
  };
  function measFields(kind, last) {
    return (GE.MEAS[kind] || []).map(function (f) {
      var v = last && last.vals[f] != null ? last.vals[f] : '';
      return '<div class="mrow"><label>' + esc(f) + '</label>' +
        '<input type="number" step="0.25" data-m="' + esc(f) + '" value="' + v + '"></div>';
    }).join('');
  }
  A.switchMeasKind = function (cid) {
    var kind = document.getElementById('msKind').value;
    var last = by(D().meas, 'client', cid).filter(function (m) { return m.kind === kind; })
                 .sort(function (a, b) { return a.at < b.at ? 1 : -1; })[0];
    document.getElementById('msFields').innerHTML = measFields(kind, last);
  };
  A.saveMeas = function (cid) {
    var vals = {}, any = false;
    [].forEach.call(document.querySelectorAll('#msFields [data-m]'), function (i) {
      if (i.value !== '') { vals[i.getAttribute('data-m')] = Number(i.value); any = true; }
    });
    if (!any) { GE.toast('Put at least one measurement in.'); return; }
    D().meas.push({ id: GE.uid('M-'), client: cid, kind: document.getElementById('msKind').value,
      at: document.getElementById('msAt').value, by: GE.me().id,
      unit: document.getElementById('msUnit').value, why: document.getElementById('msWhy').value,
      trial: '', vals: vals });
    GE.save(); GE.closeModal(); A.openClient(cid);
    GE.toast('Saved as a new set. Nothing was overwritten.');
  };

  /* ================= The showroom ================= */

  V['#/showroom'] = function () {
    var all = GE.myOrders();
    var orders = all.filter(function (o) {
      return GE.matches(q('#/showroom'), [o.id, cname(o.client), o.type, o.stage, o.event,
        o.source, pname(o.salesperson), o.vertical === 'designer' ? dgname(o.designer) : 'in-house']);
    });
    var h = head('The showroom', 'Every live order by stage. It starts when a stylist is put on him: the walk-in itself is already a client record.',
      '<button class="btn gold" data-act="newOrder">Start an order</button>');
    h += agentStrip(3);
    h += searchBar('#/showroom', 'Search a client, an order, a designer, a stage', orders.length, all.length);
    h += '<div class="board">';
    GE.SELL.forEach(function (st) {
      var col = orders.filter(function (o) { return o.stage === st; });
      if ((st === 'Lost' || st === 'Delivered') && !col.length) return;
      h += '<div class="col"><h4>' + esc(st) + '<span>' + col.length + '</span></h4>';
      col.forEach(function (o) {
        var gs = garmentsOf(o.id), m = GE.orderMoney(o.id);
        h += '<div class="ocard" data-act="openOrder" data-id="' + o.id + '">' +
             '<b>' + esc(cname(o.client)) + '</b>' +
             '<span>' + o.id + ' · ' + esc(o.type || 'type not set yet') + '</span>' +
             '<span>' + (gs.length ? gs.length + ' garments' : 'no garments yet') +
             (o.event_date ? ' · ' + esc(o.event) + ' ' + d(o.event_date) : '') + '</span>' +
             '<div class="row">' + (o.value ? GE.moneyShort(o.value) :
               '<span class="sub">est ' + (GE.can('money') ? lakh(o.estimate || 0) : '•••') + '</span>') +
             lateness(o) + '</div>' +
             (m.pending > 0 ? '<div class="sub">pending ' + (GE.can('money') ? rupees(m.pending) : '•••') + '</div>' : '') +
             '</div>';
      });
      h += '</div>';
    });
    return h + '</div>';
  };

  /* ================= Opportunities ================= */

  V['#/order'] = function () {
    var all = GE.myOrders();
    var orders = all.filter(function (o) {
      return GE.matches(q('#/order'), [o.id, cname(o.client), o.type, o.stage, o.event,
        pname(o.salesperson), garmentsOf(o.id).map(function (g) { return g.kind; }).join(' ')]);
    });
    var h = head('Opportunities',
      'The showroom shows where an order has got to. This shows what each one is: the garments, the dates, the money and who is on it.',
      '<button class="btn gold" data-act="newOrder">Start an order</button>');
    h += searchBar('#/order', 'Search an order, a client, a garment, a type', orders.length, all.length);
    h += '<div class="card"><table><thead><tr><th>Order</th><th>Client</th><th>Type</th>' +
      '<th>Garments</th><th>Stage</th><th>Trial</th><th>Delivery</th><th>Sold by</th>' +
      '<th class="num">Order value</th><th class="num">Pending</th><th></th></tr></thead><tbody>';
    orders.slice().sort(function (a, b) { return (a.delivery || '9') < (b.delivery || '9') ? -1 : 1; })
      .forEach(function (o) {
      var gs = garmentsOf(o.id), m = GE.orderMoney(o.id);
      h += '<tr class="click" data-act="openOrder" data-id="' + o.id + '">' +
        '<td><b>' + o.id + '</b><div class="sub">' + esc(o.event || '') + '</div></td>' +
        '<td>' + esc(cname(o.client)) + '</td>' +
        '<td>' + esc(o.type || '—') +
        (o.vertical === 'designer' ? '<div class="sub">' + esc(dgname(o.designer)) + '</div>' : '') + '</td>' +
        '<td>' + (gs.length || '—') +
        (gs.length ? '<div class="sub">' + esc(gs.map(function (g) { return g.kind.split(' ')[0]; })
          .join(', ')) + '</div>' : '') + '</td>' +
        '<td>' + stagePill(o.stage) + '</td><td>' + d(o.trial) + '</td>' +
        '<td>' + d(o.delivery) + ' ' + lateness(o) + '</td>' +
        '<td>' + esc(pname(o.salesperson)) + '</td>' +
        '<td class="num">' + (o.value ? GE.money(o.value) :
          '<span class="sub">est ' + (GE.can('money') ? lakh(o.estimate || 0) : '•••') + '</span>') + '</td>' +
        '<td class="num">' + (o.value ? GE.money(m.pending) : '—') + '</td>' +
        '<td><button class="mini">Open it</button></td></tr>';
    });
    if (!orders.length) h += '<tr><td colspan="11" class="sub">Nothing matches that.</td></tr>';
    return h + '</tbody></table></div>';
  };

  /* ---------- one opportunity ---------- */

  A.openOrder = function (id) {
    var o = one(D().orders, id); if (!o) return;
    var gs = garmentsOf(o.id);
    var m = GE.orderMoney(o.id), mg = GE.marginOf(o.id), cost = GE.costOf(o.id);

    var h = '<h1>' + o.id + ' · ' + esc(cname(o.client)) + '</h1>' +
      '<p class="sub">' + esc(o.type || 'type not set yet') +
      (o.vertical === 'designer' ? ', at ' + esc(dgname(o.designer)) : '') +
      ' · ' + esc(o.event || 'no event') + (o.event_date ? ' on ' + d(o.event_date) : '') +
      ' · sold by ' + esc(pname(o.salesperson)) + ', styled by ' + esc(pname(o.stylist)) + '</p>';

    h += '<div class="kpis">' +
      kpi(GE.moneyShort(o.value || o.estimate || 0), o.value ? 'Order value' : 'Estimate',
          o.value ? 'before tax, and it does not move' : 'nothing signed yet') +
      kpi(GE.moneyShort(m.pending), 'Pending at delivery', 'of ' + (GE.can('money') ? rupees(m.total) : '•••') + ' payable') +
      kpi(gs.length, 'Garments', 'each with its own master and date') +
      kpi(d(o.delivery), 'Delivery promised', o.trial ? 'trial ' + d(o.trial) : 'no trial set') +
      (GE.can('cost') ? kpi(GE.moneyShort(cost.total), 'Cost so far', 'fabric plus every line') : '') +
      '</div>';

    /* what kind of order this is */
    h += '<div class="card"><div class="cardhead"><h3>What kind of order</h3>' +
      '<span class="sub">ours or theirs, readymade or made to measure</span></div>' +
      '<div class="two"><div class="f"><label>Type of order</label>' +
      '<select data-change="setOrderType" data-id="' + o.id + '">' +
      '<option value="">Not chosen yet</option>' +
      GE.ORDER_TYPES.map(function (t) {
        return '<option' + (t === o.type ? ' selected' : '') + '>' + t + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label>Made from one of our designs</label>' +
      '<select data-change="setFromDesign" data-id="' + o.id + '">' +
      '<option value="">A fresh design</option>' +
      D().readymade.filter(function (r) { return r.owner === 'Sasya'; }).map(function (r) {
        return '<option value="' + r.id + '"' + (r.id === o.from_design ? ' selected' : '') + '>' +
          esc(r.code + ' · ' + r.name + ' · ' + rupees(r.price)) + '</option>'; }).join('') +
      '</select><div class="hint">Picking one fills the price in. Measurements are still taken, ' +
      'whether it is made new or altered.</div></div></div>' +
      (o.vertical === 'designer' ? '<div class="f"><label>Which designer</label><select data-change="setDesigner" data-id="' + o.id + '">' +
        D().designers.map(function (g) {
          return '<option value="' + g.id + '"' + (g.id === o.designer ? ' selected' : '') + '>' +
            esc(g.name) + ', ' + g.margin + '% to us</option>'; }).join('') + '</select></div>' : '') +
      '</div>';

    /* the stage ladder */
    h += '<div class="card"><div class="cardhead"><h3>Where it has got to</h3>' +
      '<span class="sub">trial and delivery are set here, in the showroom, not on the floor</span></div>' +
      '<div class="three">' +
      '<div class="f"><label>Trial date</label><input type="date" value="' + (o.trial || '') +
        '" data-change="setOrderDate" data-id="' + o.id + '|trial"></div>' +
      '<div class="f"><label>Delivery date</label><input type="date" value="' + (o.delivery || '') +
        '" data-change="setOrderDate" data-id="' + o.id + '|delivery"></div>' +
      (o.vertical === 'designer' ?
      '<div class="f"><label>Date back with us</label><input type="date" value="' +
        (o.expected_in || '') + '" data-change="setOrderDate" data-id="' + o.id + '|expected_in"></div>' :
      '<div class="f"><label>Occasion</label><input value="' + esc(o.event) + '" disabled></div>') +
      '</div>' +
      '<div class="chips">' + GE.SELL.map(function (st) {
        return '<span class="chip' + (st === o.stage ? ' on' : '') + '" data-act="setOrderStage" data-id="' +
          o.id + '|' + st + '" title="' + esc(GE.STAGE_MEANS[st] || '') + '">' + st + '</span>';
      }).join('') + '</div>' +
      '<p class="hint">' + esc(GE.STAGE_MEANS[o.stage] || '') + '</p></div>';

    /* the money */
    if (GE.can('money')) {
      h += '<div class="card"><div class="cardhead"><h3>The money</h3>' +
        '<button class="mini" data-act="setOrderValue" data-id="' + o.id + '">Set the order value</button></div>' +
        moneyBlock(m, true) +
        '<div style="margin-top:14px" class="cardhead"><h4>Payments taken</h4>' +
        (GE.can('invoices') ? '<button class="mini" data-act="newInvoice" data-id="' + o.id +
          '">Raise an invoice</button>' : '') + '</div>';
      var invs = by(D().invoices, 'order', o.id);
      h += '<table><thead><tr><th>Invoice</th><th>What for</th><th class="num">Asked for</th>' +
        '<th class="num">Paid</th><th>How</th><th></th></tr></thead><tbody>';
      invs.forEach(function (i) {
        var pays = by(D().payins, 'invoice', i.id);
        h += '<tr><td><b>' + i.id + '</b><div class="sub">' + d(i.issued) + '</div></td>' +
          '<td>' + esc(i.kind) + '</td><td class="num">' + rupees(i.amount) + '</td>' +
          '<td class="num">' + rupees(GE.paidOn(i.id)) + '</td>' +
          '<td class="sub">' + esc(pays.map(function (p) { return p.method; }).join(', ') || 'nothing yet') + '</td>' +
          '<td>' + (GE.can('invoices') ? '<button class="mini" data-act="openInvoice" data-id="' + i.id +
            '">Open</button>' : '') + '</td></tr>';
      });
      if (!invs.length) h += '<tr><td colspan="6" class="sub">Nothing raised yet.</td></tr>';
      h += '</tbody></table></div>';
    }

    /* the garments */
    h += '<div class="card"><div class="cardhead"><h3>The garments</h3>' +
      '<button class="mini" data-act="addGarment" data-id="' + o.id + '">Add a garment</button></div>';
    gs.forEach(function (g) {
      var fl = GE.fabricsOf(g);
      h += '<div class="card" style="background:#fbf8f2;margin-bottom:10px">' +
        '<div class="cardhead"><div><h4>' + esc(g.kind) + ' <span class="sub">' +
        (g.make === 'readymade' ? 'readymade' : 'custom') + '</span></h4>' +
        '<p class="sub">' + esc(g.note || '') + '</p></div>' +
        '<div>' + stagePill(g.stage) + ' <button class="mini" data-act="openGarment" data-id="' + g.id +
        '">Open</button></div></div>' +
        '<div class="three">' + fld('With', g.master ? pname(g.master) : (g.designer ? dgname(g.designer) : 'nobody yet')) +
        fld('Due back', d(g.due)) + fld('Metres in all', GE.metresOf(g) ? GE.metresOf(g).toFixed(1) + ' m' : '—') +
        '</div>';
      h += '<div class="f"><label>Fabric, as many as it takes</label>';
      if (!fl.length) h += '<div class="sub">None chosen yet.</div>';
      fl.forEach(function (u, i) {
        var f = one(D().fabrics, u.fabric);
        h += '<div class="upl"><span class="f1">' + fabThumb(f) + ' <b>' + esc(fname(u.fabric)) + '</b>' +
          '<input type="number" step="0.1" style="width:76px" value="' + u.metres +
          '" data-change="setFabMetres" data-id="' + g.id + '|' + i + '"> m' +
          (GE.can('cost') && f ? ' <span class="sub">' + rupees(f.cost * u.metres) + '</span>' : '') +
          ' <button class="mini" data-act="dropFab" data-id="' + g.id + '|' + i + '">&times;</button>' +
          '</span></div>';
      });
      h += '<div style="margin-top:8px"><button class="mini" data-act="addFab" data-id="' + g.id +
        '">Add another fabric</button></div></div>';
      h += uploadBlock(g);
      h += '</div>';
    });
    if (!gs.length) h += '<p class="sub">No garments yet. They get added once the advance is in.</p>';
    h += '</div>';

    /* measurements used */
    h += '<div class="card"><div class="cardhead"><h3>Measurements used</h3>' +
      '<button class="mini" data-act="newMeas" data-id="' + o.client + '">Take a new set</button></div>';
    var used = {};
    gs.forEach(function (g) { used[g.kind] = 1; });
    Object.keys(used).forEach(function (kind) {
      var s = by(D().meas, 'client', o.client).filter(function (mm) { return mm.kind === kind; })
                .sort(function (a, b) { return a.at < b.at ? 1 : -1; })[0];
      h += '<div class="rung"><div class="n">' + (s ? '✓' : '!') + '</div><div><b>' + esc(kind) + '</b>' +
        '<p>' + (s ? 'set of ' + d(s.at) + ', ' + esc(s.why) : '<b>no set. It cannot move on without one.</b>') + '</p></div>' +
        '<div>' + (s ? '<button class="mini" data-act="openMeas" data-id="' + o.client + '|' + esc(kind) + '">See it</button>' : '') + '</div></div>';
    });
    if (!Object.keys(used).length) h += '<p class="sub empty">Nothing to measure yet.</p>';
    h += '</div>';

    if (GE.can('cost')) {
      h += '<div class="card"><div class="cardhead"><h3>What this job is costing us</h3>' +
        '<button class="mini" data-act="addCost" data-id="' + o.id + '">Add a cost</button></div>' +
        '<table><thead><tr><th>What</th><th>Detail</th><th>Entered by</th><th class="num">Amount</th></tr></thead><tbody>';
      gs.forEach(function (g) {
        GE.fabricsOf(g).forEach(function (u) {
          var f = one(D().fabrics, u.fabric);
          if (!f || !u.metres) return;
          h += '<tr><td>Fabric</td><td>' + esc(g.kind) + ': ' + esc(f.brand + ' ' + f.colour) + ', ' +
            u.metres + ' m at ' + rupees(f.cost) + '/m</td><td class="sub">from the fabric library</td>' +
            '<td class="num">' + GE.money(f.cost * u.metres) + '</td></tr>';
        });
      });
      cost.lines.forEach(function (l) {
        h += '<tr><td>' + esc(l.kind) + '</td><td>' + esc(l.label) + '</td><td>' + esc(pname(l.by)) +
          '<div class="sub">' + d(l.at) + '</div></td><td class="num">' + GE.money(l.amount) + '</td></tr>';
      });
      h += '<tr><td colspan="3"><b>Everything it cost</b></td><td class="num"><b>' + GE.money(cost.total) +
        '</b></td></tr><tr><td colspan="3"><b>Order value</b></td><td class="num"><b>' + GE.money(o.value) +
        '</b></td></tr><tr><td colspan="3"><b>P/L on this order</b></td><td class="num"><b>' + GE.money(mg.kept) +
        ' <span class="sub">' + mg.pct + '%</span></b></td></tr></tbody></table>' +
        '<p class="hint">The metres a master enters on the floor land here as cost, at the cost per metre ' +
        'on that bunch. A master never sees any of these figures.</p></div>';
    }

    h += commBlock('order', o.id);

    var fus = by(D().follows, 'order', o.id);
    h += '<div class="card"><div class="cardhead"><h3>Follow-ups</h3>' +
      '<button class="mini" data-act="newFollow" data-id="' + o.id + '">Book one</button></div>';
    if (!fus.length) h += '<p class="sub">None booked. The Doorman will raise this if the order goes quiet.</p>';
    fus.forEach(function (f) {
      h += '<div class="rung ' + (f.done ? 'done' : (days(GE.TODAY, f.at) <= 0 ? 'now' : '')) + '">' +
        '<div class="n">' + (f.done ? '✓' : '·') + '</div><div><b>' + d(f.at) + ' · ' + esc(f.method) +
        '</b><p>' + esc(f.note) + (f.outcome ? ' <span class="pill ok">' + esc(f.outcome) + '</span>' : '') +
        '<br><span class="sub">' + esc(pname(f.owner)) + '</span></p></div><div>' +
        (f.done ? '' : '<button class="mini" data-act="closeFollow" data-id="' + f.id + '">Update it</button>') +
        '</div></div>';
    });
    h += '</div>';

    h += '<div class="card"><h3>Everything that has happened</h3><div class="tl">' +
      (o.history || []).slice().reverse().map(function (hh) {
        return '<div class="ev"><b>Moved to ' + esc(hh.stage) + '</b><span>' + dt(hh.at) +
          ' · ' + esc(pname(hh.by)) + '</span></div>';
      }).join('') + '</div></div>';

    GE.drawer(h);
  };

  /* the two upload sets, on the garment, so the master sees them on the floor */
  function uploadBlock(g) {
    function set(key, label) {
      var list = g[key] || [];
      var h = '<div class="f"><label>' + label + '</label><div class="upl">';
      list.forEach(function (f, i) {
        h += '<span class="f1"><span class="thumbbox">' + esc(f.name.split('.').pop().toUpperCase()) + '</span>' +
          esc(f.name) + ' <span class="sub">' + esc(f.size) + '</span>' +
          ' <button class="mini" data-act="docAct" data-id="open|' + esc(f.name) + '">Open</button>' +
          ' <button class="mini" data-act="dropUpload" data-id="' + g.id + '|' + key + '|' + i + '">&times;</button></span>';
      });
      if (!list.length) h += '<span class="sub">Nothing uploaded.</span>';
      h += '</div><div style="margin-top:7px"><button class="mini" data-act="addUpload" data-id="' +
        g.id + '|' + key + '">Upload</button></div></div>';
      return h;
    }
    return '<div class="two">' + set('samples', 'Sample outfit') + set('designform', 'Design form') + '</div>';
  }

  A.addUpload = function (id) {
    var p = id.split('|'), g = one(D().garments, p[0]);
    GE.modal('<h2>Upload ' + (p[1] === 'samples' ? 'sample outfit photographs' : 'the design form') + '</h2>' +
      '<p class="sub">' + esc(g.kind) + ' on ' + g.order + '. As many files as you like.</p>' +
      '<div class="f"><input type="file" id="upFiles" multiple></div>' +
      '<button class="btn gold" data-act="saveUpload" data-id="' + esc(id) + '">Attach them</button>');
  };
  A.saveUpload = function (id) {
    var p = id.split('|'), g = one(D().garments, p[0]);
    var files = document.getElementById('upFiles').files;
    if (!files.length) { GE.toast('Choose a file first.'); return; }
    g[p[1]] = g[p[1]] || [];
    for (var i = 0; i < files.length; i++)
      g[p[1]].push({ name: files[i].name, size: Math.max(1, Math.round(files[i].size / 1024)) + ' KB' });
    GE.save(); GE.closeModal(); A.openOrder(g.order);
    GE.toast('Attached. The master sees these when he opens the outfit.');
  };
  A.dropUpload = function (id) {
    var p = id.split('|'), g = one(D().garments, p[0]);
    g[p[1]].splice(Number(p[2]), 1); GE.save(); A.openOrder(g.order);
  };

  A.setOrderType = function (id, el) {
    var o = one(D().orders, id);
    o.type = el.value;
    o.vertical = el.value.indexOf('Third-party') === 0 ? 'designer' : 'in-house';
    if (o.vertical === 'designer' && !o.designer) o.designer = D().designers[0].id;
    GE.save(); A.openOrder(id);
    GE.toast('Set to ' + (el.value || 'not chosen') + '.');
  };
  A.setDesigner = function (id, el) {
    one(D().orders, id).designer = el.value; GE.save(); A.openOrder(id);
    GE.toast('The margin on this order follows that designer.');
  };
  A.setFromDesign = function (id, el) {
    var o = one(D().orders, id), r = one(D().readymade, el.value);
    o.from_design = el.value;
    if (r) { o.value = r.price; GE.toast('Price filled in from ' + r.code + '. Measurements are still taken.'); }
    GE.save(); A.openOrder(id);
  };
  A.setOrderValue = function (id) {
    var o = one(D().orders, id);
    GE.modal('<h2>Order value</h2><p class="sub">' + o.id + '. Before tax, and it is the whole engagement.</p>' +
      '<div class="f"><label>Order value</label><input type="number" id="ovVal" value="' + (o.value || o.estimate || 0) + '"></div>' +
      '<button class="btn gold" data-act="saveOrderValue" data-id="' + o.id + '">Save it</button>');
  };
  A.saveOrderValue = function (id) {
    var o = one(D().orders, id);
    o.value = Number(document.getElementById('ovVal').value) || 0;
    GE.save(); GE.closeModal(); A.openOrder(id);
    GE.toast('Set. Deductions come off this, GST goes on top, and what is left is pending.');
  };

  A.addCut = function (id) {
    var o = one(D().orders, id), m = GE.orderMoney(id);
    GE.modal('<h2>Add a deduction</h2>' +
      '<p class="sub">' + o.id + '. Net today is ' + rupees(m.net) + '. A deduction has no payment mode.</p>' +
      '<div class="two"><div class="f"><label>What kind</label><select id="ctLabel">' +
      GE.CUT_LABELS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>How much</label><input type="number" id="ctAmt"></div></div>' +
      '<div class="f"><label>Call it something else, if you like</label><input id="ctOwn" placeholder="Festive offer, 10 per cent"></div>' +
      '<button class="btn gold" data-act="saveCut" data-id="' + o.id + '">Take it off</button>');
  };
  A.saveCut = function (id) {
    var o = one(D().orders, id);
    var amt = Number(document.getElementById('ctAmt').value) || 0;
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    o.cuts = o.cuts || [];
    o.cuts.push({ label: document.getElementById('ctOwn').value.trim() ||
      document.getElementById('ctLabel').value, amount: amt });
    GE.save(); GE.closeModal(); A.openOrder(id);
    var m = GE.orderMoney(id);
    GE.toast('Net ' + rupees(m.net) + ', GST ' + rupees(m.gst) + ', payable ' + rupees(m.total) +
      ', pending ' + rupees(m.pending) + '.');
  };
  A.dropCut = function (id) {
    var p = id.split('|'), o = one(D().orders, p[0]);
    o.cuts.splice(Number(p[1]), 1); GE.save(); A.openOrder(p[0]);
    GE.toast('Taken out. The pending figure has moved with it.');
  };

  A.setOrderDate = function (id, el) {
    var p = id.split('|'), o = one(D().orders, p[0]);
    o[p[1]] = el.value; GE.save();
    GE.toast('Saved. The Clock counts back from the delivery date.');
  };
  A.setOrderStage = function (id) {
    var p = id.split('|'), o = one(D().orders, p[0]);
    if (p[1] === 'In operations') {
      var missing = garmentsOf(o.id).filter(function (g) {
        return g.make === 'custom' && !by(D().meas, 'client', o.client)
          .filter(function (m) { return m.kind === g.kind; }).length;
      });
      if (missing.length) { GE.toast('No measurement set for ' + missing[0].kind + '. It cannot move on.'); return; }
    }
    GE.moveOrder(p[0], p[1]);
    A.openOrder(p[0]);
    GE.toast('Moved to ' + p[1] + '. Stamped with your name and the time.');
  };

  /* ---------- one garment, as the floor sees it ---------- */

  A.openGarment = function (id) {
    var g = one(D().garments, id); if (!g) return;
    var o = one(D().orders, g.order);
    var ladder = GE.ladderFor(g);
    var i = ladder.indexOf(g.stage);
    var kindSets = by(D().meas, 'client', o.client).filter(function (m) { return m.kind === g.kind; })
      .sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    var set = kindSets[0];

    var h = '<h1>' + esc(g.kind) + '</h1><p class="sub">' + g.order + ' · ' + esc(cname(o.client)) +
      ' · ' + (g.make === 'readymade' ? 'readymade' : 'custom') +
      (g.master ? ' · with ' + esc(pname(g.master)) : '') +
      (g.designer ? ' · at ' + esc(dgname(g.designer)) : '') + '</p>';

    h += '<div class="kpis">' + kpi(d(g.due), 'Due back', days(GE.TODAY, g.due) < 0 ? 'past it' :
      days(GE.TODAY, g.due) + ' days') +
      kpi(GE.sittingFor(g) + ' days', 'At this stage', g.stage) +
      kpi(GE.metresOf(g) ? GE.metresOf(g).toFixed(1) + ' m' : '—', 'Fabric on it',
          GE.fabricsOf(g).length + ' bunch' + (GE.fabricsOf(g).length === 1 ? '' : 'es')) + '</div>';

    /* what has to be made, and out of what */
    h += '<div class="card"><div class="cardhead"><h3>What has to be made</h3>' +
      '<span class="sub">no sale value on this screen</span></div>' +
      '<div class="two">' + fld('The outfit', g.kind) + fld('Made', g.make === 'readymade' ? 'Readymade, altered here' : 'Custom, to his measurements') + '</div>' +
      (g.note ? '<div class="f"><label>Note from the showroom</label><div>' + esc(g.note) + '</div></div>' : '') +
      '<div class="f"><label>Fabric and metres</label>';
    var fl = GE.fabricsOf(g);
    if (!fl.length) h += '<div class="sub">No fabric chosen at sale time. Ask the showroom.</div>';
    h += '<table><tbody>';
    fl.forEach(function (u, n) {
      var f = one(D().fabrics, u.fabric);
      h += '<tr><td style="width:70px">' + fabThumb(f) + '</td>' +
        '<td><b>' + esc(fname(u.fabric)) + '</b><div class="sub">' +
        esc((f && f.book) || '') + (f ? ' · ' + esc(f.pattern) : '') + '</div></td>' +
        '<td style="width:140px"><input type="number" step="0.1" value="' + u.metres +
        '" data-change="setFabMetres" data-id="' + g.id + '|' + n + '"> m</td>' +
        '<td style="width:110px"><button class="mini" data-act="dropFab" data-id="' + g.id + '|' + n +
        '">Take off</button></td></tr>';
    });
    h += '</tbody></table><div style="margin-top:8px"><button class="mini" data-act="addFab" data-id="' +
      g.id + '">Add another fabric</button></div>' +
      '<div class="hint">The metres you enter here go back to the opportunity as cost, at the cost per ' +
      'metre on that bunch. You never see the money.</div></div></div>';

    /* his measurements, which is what a master actually needs */
    h += '<div class="card"><div class="cardhead"><h3>His measurements</h3>' +
      '<span class="sub">' + (set ? 'set of ' + d(set.at) + ', ' + esc(set.why) : 'none taken') + '</span></div>';
    if (!set) h += '<p class="sub empty"><b>No set for this garment.</b> Nothing can be cut until the showroom takes one.</p>';
    else {
      h += '<table><tbody>';
      (GE.MEAS[g.kind] || []).forEach(function (fname2, n) {
        if (n % 2 === 0) h += '<tr>';
        h += '<td>' + esc(fname2) + '</td><td class="num"><b>' +
          (set.vals[fname2] == null ? '—' : set.vals[fname2] + '"') + '</b></td>';
        if (n % 2 === 1) h += '</tr>';
      });
      h += '</tbody></table>';
      if (kindSets.length > 1) h += '<p class="hint">' + kindSets.length +
        ' sets exist. This is the newest. <button class="mini" data-act="openMeas" data-id="' +
        o.client + '|' + esc(g.kind) + '">See them all</button></p>';
    }
    h += '</div>';

    h += '<div class="card"><div class="cardhead"><h3>Sample outfit and design form</h3></div>' +
      uploadBlock(g) + '</div>';

    h += '<div class="card"><div class="cardhead"><h3>Where it has got to</h3>' +
      '<span class="sub">' + (o.vertical === 'designer' ? 'the third-party ladder' : 'our own ladder') +
      '</span></div>';
    ladder.forEach(function (st, n) {
      var cls = n < i ? 'done' : (n === i ? 'now' : '');
      h += '<div class="rung ' + cls + '"><div class="n">' + (n < i ? '✓' : n + 1) + '</div>' +
        '<div><b>' + esc(st) + '</b><p>' + esc(GE.STAGE_MEANS[st] || '') + '</p></div>' +
        '<div>' + (n === i ? pill('here now', 'gold') :
          '<button class="mini" data-act="moveGarment" data-id="' + g.id + '|' + st + '">Move it here</button>') +
        '</div></div>';
    });
    h += '</div>';

    /* one master does not do the whole garment */
    h += '<div class="card"><div class="cardhead"><h3>Who is holding it</h3>' +
      '<button class="mini" data-act="handOver" data-id="' + g.id + '">Hand it to another master</button></div>' +
      '<p class="sub">Marking, cutting and stitching are different men. Every pass is stamped.</p>' +
      '<div class="tl">' + (g.history || []).slice().reverse().map(function (hh) {
        return '<div class="ev"><b>' + (hh.handover ?
            'Passed from ' + esc(pname(hh.from)) + ' to ' + esc(pname(hh.to)) +
            (hh.note ? '<div class="sub">' + esc(hh.note) + '</div>' : '')
          : esc(hh.stage)) + '</b><span>' + dt(hh.at) + ' · ' + esc(pname(hh.by)) + '</span></div>';
      }).join('') + '</div></div>';
    GE.drawer(h);
  };

  A.moveGarment = function (id) {
    var p = id.split('|');
    GE.moveGarment(p[0], p[1]);
    A.openGarment(p[0]);
    GE.toast('Moved to ' + p[1] + ', stamped ' + GE.me().name + '.');
  };
  A.handOver = function (id) {
    var g = one(D().garments, id);
    GE.modal('<h2>Hand it on</h2><p class="sub">' + esc(g.kind) + ' on ' + g.order +
      (g.master ? ', with ' + esc(pname(g.master)) : '') + '</p>' +
      '<div class="f"><label>To which master</label><select id="hoTo">' +
      by(D().people, 'role', 'Master').filter(function (p) { return p.id !== g.master; })
        .map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) +
          (p.craft ? ' · ' + esc(p.craft) : '') + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>What you are handing over</label><textarea id="hoNote" rows="2" ' +
      'placeholder="Cutting done, over to Sujit for stitching"></textarea></div>' +
      '<button class="btn gold" data-act="saveHandOver" data-id="' + g.id + '">Hand it over</button>');
  };
  A.saveHandOver = function (id) {
    var to = document.getElementById('hoTo').value;
    GE.handOver(id, to, document.getElementById('hoNote').value);
    GE.closeModal(); A.openGarment(id);
    GE.toast('Now with ' + pname(to) + ', stamped with the time and who passed it.');
  };
  A.setFabMetres = function (id, el) {
    var p = id.split('|'), g = one(D().garments, p[0]);
    g.fabrics = GE.fabricsOf(g);
    g.fabrics[Number(p[1])].metres = Number(el.value) || 0;
    delete g.fabric; delete g.metres;
    GE.save();
    GE.toast('Metres recorded. The opportunity shows the cost of them.');
  };
  A.dropFab = function (id) {
    var p = id.split('|'), g = one(D().garments, p[0]);
    g.fabrics = GE.fabricsOf(g); g.fabrics.splice(Number(p[1]), 1);
    delete g.fabric; delete g.metres; GE.save();
    if (document.getElementById('dbody').innerHTML.indexOf('What has to be made') > -1) A.openGarment(g.id);
    else A.openOrder(g.order);
  };
  A.addFab = function (id) {
    var g = one(D().garments, id);
    GE.modal('<h2>Add a fabric</h2><p class="sub">' + esc(g.kind) + ' on ' + g.order +
      '. A garment takes as many bunches as it takes: the cloth, the lining, the contrast.</p>' +
      '<div class="f"><label>Which bunch</label><select id="afFab">' +
      D().fabrics.map(function (f) {
        return '<option value="' + f.id + '">' + esc(f.brand + ' ' + f.colour + ', ' + f.pattern) +
          ' · ' + GE.stockOf(f.id).hand.toFixed(1) + ' m left</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Metres</label><input type="number" step="0.1" id="afM" value="1.5"></div>' +
      '<button class="btn gold" data-act="saveFab" data-id="' + g.id + '">Add it</button>');
  };
  A.saveFab = function (id) {
    var g = one(D().garments, id);
    g.fabrics = GE.fabricsOf(g);
    g.fabrics.push({ fabric: document.getElementById('afFab').value,
                     metres: Number(document.getElementById('afM').value) || 0 });
    delete g.fabric; delete g.metres; GE.save(); GE.closeModal();
    A.openGarment(id);
    GE.toast('Added. It comes off the shelf and lands on the cost sheet.');
  };

  /* ================= Our operations ================= */

  V['#/floor'] = function () {
    var mine = GE.can('orders') === 'mine';
    var all = D().garments.filter(function (g) {
      var o = one(D().orders, g.order);
      if (!o || o.vertical !== 'in-house') return false;
      if (mine && g.master !== GE.me().id) return false;
      /* once it is delivered it leaves the floor. The history stays on the client. */
      return g.stage !== 'Delivered' && o.stage !== 'Delivered';
    });
    var gs = all.filter(function (g) {
      var o = one(D().orders, g.order);
      return GE.matches(q('#/floor'), [g.kind, g.order, cname(o.client), g.stage, pname(g.master),
        GE.fabricsOf(g).map(function (u) { return fname(u.fabric); }).join(' ')]);
    });
    var h = head('Our operations', 'Every in-house garment, who is holding it and for how long. The stage is the garment’s, not the order’s. A delivered order leaves this floor.');
    h += agentStrip(3);
    h += '<div class="kpis">' +
      kpi(all.length, 'Garments here', '') +
      kpi(all.filter(function (g) { return !g.master; }).length, 'With nobody', 'not picked up') +
      kpi(all.filter(function (g) { return g.due && days(GE.TODAY, g.due) < 0; }).length, 'Past their date', '') +
      kpi(all.filter(function (g) { return GE.sittingFor(g) > 7; }).length, 'Sat over a week', 'at one stage') +
      '</div>';
    h += searchBar('#/floor', 'Search a garment, a client, a master, a fabric', gs.length, all.length);
    if (GE.can('invoices'))
      h += '<div class="note">Pending collection shows on this floor so the manager knows before a piece ' +
           'goes out. A master never sees it.</div>';
    h += '<div class="card">' + garmentTable(gs, true) + '</div>';
    return h;
  };

  function garmentTable(gs, withPending) {
    var showMoney = withPending && GE.can('invoices');
    var h = '<table><thead><tr><th>Garment</th><th>Order</th><th>Client</th><th>Master</th>' +
      '<th>Stage</th><th>Sat</th><th>Due</th>' + (showMoney ? '<th class="num">Pending</th>' : '') +
      '<th></th></tr></thead><tbody>';
    gs.slice().sort(function (a, b) { return (a.due || '9') < (b.due || '9') ? -1 : 1; }).forEach(function (g) {
      var o = one(D().orders, g.order);
      h += '<tr class="click" data-act="openGarment" data-id="' + g.id + '">' +
        '<td><b>' + esc(g.kind) + '</b>' + (g.note ? '<div class="sub">' + esc(g.note) + '</div>' : '') + '</td>' +
        '<td>' + g.order + '</td><td>' + esc(cname(o.client)) + '</td>' +
        '<td>' + esc(g.master ? pname(g.master) : 'nobody') + '</td>' +
        '<td>' + stagePill(g.stage) + '</td>' +
        '<td>' + GE.sittingFor(g) + 'd' + (GE.sittingFor(g) > 7 ? ' ' + pill('held', 'bad') : '') + '</td>' +
        '<td>' + d(g.due) + (g.due && days(GE.TODAY, g.due) < 0 ? ' ' + pill('late', 'bad') : '') + '</td>' +
        (showMoney ? '<td class="num">' + rupees(Math.max(0, GE.orderMoney(o.id).pending)) + '</td>' : '') +
        '<td><button class="mini">Open</button></td></tr>';
    });
    if (!gs.length) h += '<tr><td colspan="9" class="sub">Nothing here.</td></tr>';
    return h + '</tbody></table>';
  }

  /* ================= At the designers ================= */

  V['#/designers-floor'] = function () {
    var all = D().garments.filter(function (g) {
      var o = one(D().orders, g.order);
      return o && o.vertical === 'designer' && g.stage !== 'Delivered' && o.stage !== 'Delivered';
    });
    var gs = all.filter(function (g) {
      var o = one(D().orders, g.order);
      return GE.matches(q('#/designers-floor'), [g.kind, g.order, cname(o.client), g.stage, dgname(o.designer)]);
    });
    var h = head('At the designers', 'Everything sitting with a third-party designer, and how late it is. We cannot see their workshop, so the dates and the chasing are all we have.');
    h += agentStrip(3);
    h += searchBar('#/designers-floor', 'Search a designer, a client, a piece', gs.length, all.length);
    h += '<div class="card"><table><thead><tr><th>Piece</th><th>Order</th><th>Designer</th><th>Stage</th>' +
      '<th>Promised back</th><th>Delivery to him</th><th>Sat</th><th></th></tr></thead><tbody>';
    gs.forEach(function (g) {
      var o = one(D().orders, g.order);
      var over = o.expected_in && days(GE.TODAY, o.expected_in) < 0;
      h += '<tr class="click" data-act="openGarment" data-id="' + g.id + '"><td><b>' + esc(g.kind) + '</b>' +
        (g.note ? '<div class="sub">' + esc(g.note) + '</div>' : '') + '</td>' +
        '<td>' + o.id + '</td><td>' + esc(dgname(o.designer)) + '</td><td>' + stagePill(g.stage) + '</td>' +
        '<td>' + d(o.expected_in) + (over ? ' ' + pill((-days(GE.TODAY, o.expected_in)) + 'd over', 'bad') : '') + '</td>' +
        '<td>' + d(o.delivery) + '</td><td>' + GE.sittingFor(g) + 'd</td>' +
        '<td><button class="mini">Open</button></td></tr>';
    });
    if (!gs.length) h += '<tr><td colspan="8" class="sub">Nothing matches that.</td></tr>';
    h += '</tbody></table></div>';

    h += '<div class="card"><div class="cardhead"><h3>The designers themselves</h3>' +
      '<span class="sub">their stock on our floor is their money, not ours</span></div>' +
      '<table><thead><tr><th>Designer</th><th>Their margin to us</th><th class="num">Their stock here</th>' +
      '<th>Oldest piece</th>' + (GE.can('invoices') ? '<th class="num">Owed to them</th>' : '') +
      '</tr></thead><tbody>';
    D().designers.forEach(function (g) {
      var owed = sum(D().payables.filter(function (p) { return p.designer === g.id && !p.paid; }),
        function (p) { return GE.payableOn(p).payable; });
      h += '<tr><td><b>' + esc(g.name) + '</b><div class="sub">' + esc(g.city) + '</div></td>' +
        '<td>' + g.margin + '% of the net</td><td class="num">' + GE.money(g.consign) + '</td>' +
        '<td>' + g.aged_days + ' days' + (g.aged_days > 90 ? ' ' + pill('ageing', 'warn') : '') + '</td>' +
        (GE.can('invoices') ? '<td class="num">' + rupees(owed) + '</td>' : '') + '</tr>';
    });
    return h + '</tbody></table></div>';
  };

  /* ================= Master tracking ================= */

  V['#/mine'] = function () {
    var mine = GE.can('orders') === 'mine';
    if (mine) {
      var own = D().garments.filter(function (g) {
        return g.master === GE.me().id && g.stage !== 'Delivered'; });
      return head('What is in your hands',
        'Your garments, their stage and their date. You move the stage yourself and it is stamped with your name. When your part is done you hand it to the next master.') +
        '<div class="card">' + garmentTable(own, false) + '</div>';
    }

    var picked = GE.Q['#/mine.master'] || '';
    var h = head('Master tracking', 'Every master, what they are carrying and whether it is on time. Pick one to see his work.');
    h += '<div class="card"><table><thead><tr><th>Master</th><th>Craft</th><th>Carrying</th>' +
      '<th>Past the date</th><th>Longest held</th><th>On time this month</th><th></th></tr></thead><tbody>';
    by(D().people, 'role', 'Master').forEach(function (p) {
      var gs = D().garments.filter(function (g) { return g.master === p.id && g.stage !== 'Delivered'; });
      var late = gs.filter(function (g) { return g.due && days(GE.TODAY, g.due) < 0; });
      var held = gs.slice().sort(function (a, b) { return GE.sittingFor(b) - GE.sittingFor(a); })[0];
      var t = D().targets.filter(function (t) { return t.who === p.id; })[0];
      var done = D().garments.filter(function (g) { return g.master === p.id && g.stage === 'Delivered'; });
      var ontime = done.length ? Math.round(done.filter(function (g) {
        var last = (g.history || []).filter(function (x) { return x.stage === 'Ready'; })[0];
        return !last || last.at.slice(0, 10) <= g.due; }).length / done.length * 100) : 100;
      h += '<tr class="pick' + (picked === p.id ? ' picked' : '') + '" data-act="pickMaster" data-id="' + p.id + '">' +
        '<td><b>' + esc(p.name) + '</b></td><td class="sub">' + esc(p.craft || '') + '</td>' +
        '<td>' + gs.length + '</td><td>' + (late.length ? pill(late.length, 'bad') : '0') + '</td>' +
        '<td>' + (held ? esc(held.kind) + ', ' + GE.sittingFor(held) + 'd' : '—') + '</td>' +
        '<td>' + bar(ontime, ontime >= (t ? t.month : 90) ? 'ok' : 'bad') + ontime + '%' +
        (t ? ' <span class="sub">of ' + t.month + '%</span>' : '') + '</td>' +
        '<td><button class="mini">' + (picked === p.id ? 'Chosen' : 'Show his work') + '</button></td></tr>';
    });
    h += '</tbody></table></div>';

    if (!picked) h += '<div class="card"><p class="sub">Pick a master above to see what he is carrying. ' +
      'This screen never shows the whole floor at once: that is what Our operations is for.</p></div>';
    else {
      var his = D().garments.filter(function (g) { return g.master === picked && g.stage !== 'Delivered'; });
      h += '<div class="card"><div class="cardhead"><h3>' + esc(pname(picked)) + '</h3>' +
        '<button class="mini" data-act="pickMaster" data-id="">Clear</button></div>' +
        garmentTable(his, GE.can('invoices')) + '</div>';
    }
    return h;
  };
  A.pickMaster = function (id) {
    GE.Q['#/mine.master'] = (GE.Q['#/mine.master'] === id) ? '' : id;
    GE.refresh();
  };

  /* ================= Fabric library ================= */

  V['#/fabric'] = function () {
    var metresOnly = GE.can('stock') === 'metres';
    var all = D().fabrics;
    var list = all.filter(function (f) {
      var v = one(D().vendors, f.vendor);
      return GE.matches(q('#/fabric'), [f.brand, f.colour, f.pattern, f.book, v && v.name]);
    });
    var h = head('Fabric library', 'Every bunch we hold, where it is and how much is left. Orders eat metres out of this, so the number on the shelf is the number on the screen.',
      metresOnly ? '' : '<button class="btn gold" data-act="newFabric">Add a bunch</button> ' +
        '<button class="btn alt" data-act="newVendor">Add a vendor</button>');
    if (!metresOnly) {
      h += '<div class="kpis">' +
        kpi(sum(all, function (f) { return GE.stockOf(f.id).hand; }).toFixed(1) + ' m', 'On hand', 'store and godown together') +
        kpi(lakh(sum(all, function (f) { return GE.stockOf(f.id).hand * f.cost; })), 'Value sitting still', 'at cost per metre') +
        kpi(all.filter(function (f) { return GE.stockOf(f.id).low; }).length, 'Under the notify mark', 'The Bolt is watching') +
        kpi(all.filter(function (f) { return f.sat_days >= 120; }).length, 'Not moved in 120 days', 'The Shelf calls this dead') +
        '</div>';
    }
    h += searchBar('#/fabric', 'Search a brand, a colour, a pattern, a vendor', list.length, all.length);
    h += '<div class="grid">';
    list.forEach(function (f) {
      var s = GE.stockOf(f.id);
      h += '<div class="swatch" data-act="openFabric" data-id="' + f.id + '">' +
        fabSwatch(f, 110) + '<div class="b">' +
        '<b>' + esc(f.brand) + '</b><span>' + esc(f.colour) + ' · ' + esc(f.pattern) + '</span>' +
        '<div style="margin-top:8px">' + bar(Math.min(100, s.hand / Math.max(1, f.threshold * 3) * 100),
          s.low ? 'bad' : 'ok') + '<span class="sub">' + s.hand.toFixed(1) + ' m</span></div>' +
        (metresOnly ? '' : '<div class="sub" style="margin-top:6px">' + rupees(f.cost) + ' a metre</div>') +
        (s.low ? '<div style="margin-top:7px">' + pill('order now, ' + f.procure_days + 'd', 'bad') + '</div>' : '') +
        (f.sat_days >= 120 ? '<div style="margin-top:7px">' + pill('dead ' + f.sat_days + 'd', 'warn') + '</div>' : '') +
        (!f.img ? '<div class="sub" style="margin-top:6px">weave drawn from the pattern. Upload the photograph.</div>' : '') +
        '</div></div>';
    });
    h += '</div>';
    if (!list.length) h += '<p class="sub empty">Nothing matches that.</p>';
    if (metresOnly) h += '<div class="note">You see metres, not money. The cost per metre is not yours to see.</div>';
    return h;
  };

  A.openFabric = function (id) {
    var f = one(D().fabrics, id); if (!f) return;
    var s = GE.stockOf(f.id), v = one(D().vendors, f.vendor);
    var used = [];
    D().garments.forEach(function (g) {
      GE.fabricsOf(g).forEach(function (u) { if (u.fabric === f.id) used.push({ g: g, m: u.metres }); });
    });
    var h = '<h1>' + esc(f.brand) + ' · ' + esc(f.colour) + '</h1>' +
      '<p class="sub">' + esc(f.book) + ', ' + esc(f.pattern) + '</p>' +
      fabSwatch(f, 180) +
      '<div style="margin:12px 0"><button class="mini" data-act="fabPhoto" data-id="' + f.id + '">' +
      (f.img ? 'Replace the photograph' : 'Upload the photograph of this cloth') + '</button></div>';
    h += '<div class="kpis">' + kpi(s.hand.toFixed(1) + ' m', 'On hand', 'store ' + s.store + ' m, godown ' + s.godown + ' m') +
      kpi(s.reserved.toFixed(1) + ' m', 'Reserved', 'cut not yet taken') +
      (GE.can('stock') === true ? kpi(rupees(f.cost), 'Cost a metre', '') : '') +
      kpi(f.sold_90 + ' m', 'Cut in 90 days', f.sold_90 > 40 ? 'our best seller' : '') + '</div>';
    h += '<div class="card"><div class="three">' +
      fld('Vendor', v ? v.name : '—') + fld('They take', f.procure_days + ' days') +
      fld('Notify me under', f.threshold + ' metres') +
      fld('Last cut', f.sat_days + ' days ago') +
      fld('In the store', f.stock.Store + ' metres') + fld('In the godown', f.stock.Godown + ' metres') + '</div>';
    if (s.low) h += '<div class="note bad"><b>The Bolt:</b> under the ' + f.threshold +
      ' metre notify mark and ' + (v ? v.name : 'the vendor') + ' takes ' + f.procure_days +
      ' days. Order it today or the next sherwani waits.</div>';
    h += '</div>';
    h += '<div class="card"><h3>What it has gone into</h3><table><thead><tr><th>Garment</th><th>Order</th>' +
      '<th class="num">Metres</th><th>Stage</th></tr></thead><tbody>';
    used.forEach(function (u) {
      h += '<tr><td>' + esc(u.g.kind) + '</td><td>' + u.g.order + '</td><td class="num">' + u.m +
        '</td><td>' + stagePill(u.g.stage) + '</td></tr>';
    });
    if (!used.length) h += '<tr><td colspan="4" class="sub">Nothing yet.</td></tr>';
    h += '</tbody></table>' +
      '<p class="hint">Opening stock less what has been cut less what is reserved is what the shelf says.</p></div>';
    GE.drawer(h);
  };

  A.fabPhoto = function (id) {
    GE.modal('<h2>The photograph of the cloth</h2>' +
      '<p class="sub">A photograph beats a colour chip: the weave and the sheen are what a client picks on.</p>' +
      '<div class="f"><input type="file" id="fpFile" accept="image/*" data-input="previewPhoto" data-id="' + id + '"></div>' +
      '<div id="fpPrev"></div>' +
      '<button class="btn gold" data-act="saveFabPhoto" data-id="' + id + '">Save it</button>');
  };
  /* ponytail: downscaled to 600px because this prototype keeps images in localStorage.
     Real storage comes with the build. */
  function readImage(file, cb) {
    var r = new FileReader();
    r.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = Math.min(600, img.width), hgt = Math.round(img.height * (w / img.width));
        var c = document.createElement('canvas'); c.width = w; c.height = hgt;
        c.getContext('2d').drawImage(img, 0, 0, w, hgt);
        try { cb(c.toDataURL('image/jpeg', 0.72)); } catch (err) { cb(e.target.result); }
      };
      img.onerror = function () { cb(e.target.result); };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  }
  A.previewPhoto = function (id, el) {
    if (!el.files || !el.files[0]) return;
    readImage(el.files[0], function (data) {
      GE._pending = data;
      document.getElementById('fpPrev').innerHTML =
        '<img src="' + data + '" style="width:100%;border-radius:10px;margin:10px 0">';
    });
  };
  A.saveFabPhoto = function (id) {
    if (!GE._pending) { GE.toast('Choose a photograph first.'); return; }
    one(D().fabrics, id).img = GE._pending;
    GE._pending = null; GE.save(); GE.closeModal(); A.openFabric(id); GE.refresh();
    GE.toast('Saved. The library shows the real cloth now.');
  };

  A.newVendor = function () {
    GE.modal('<h2>Add a vendor</h2>' +
      '<div class="two"><div class="f"><label>Name</label><input id="nvName" placeholder="Holland &amp; Sherry"></div>' +
      '<div class="f"><label>City</label><input id="nvCity"></div></div>' +
      '<div class="two"><div class="f"><label>Days to deliver</label><input type="number" id="nvDays" value="21"></div>' +
      '<div class="f"><label>Who to call or write to</label><input id="nvContact"></div></div>' +
      '<p class="hint">The days you put here are what The Bolt weighs a low bunch against.</p>' +
      '<button class="btn gold" data-act="saveVendor">Add them</button>');
  };
  A.saveVendor = function () {
    var g = function (i) { return document.getElementById(i).value; };
    if (!g('nvName')) { GE.toast('A name first.'); return; }
    D().vendors.push({ id: GE.uid('V-'), name: g('nvName'), city: g('nvCity'),
      days: Number(g('nvDays')) || 21, contact: g('nvContact') });
    GE.save(); GE.closeModal(); GE.go('#/fabric');
    GE.toast('Added. You can put a bunch against them now.');
  };

  A.newFabric = function () {
    GE.modal('<h2>Add a bunch</h2>' +
      '<div class="two"><div class="f"><label>Brand</label><input id="nfBrand"></div>' +
      '<div class="f"><label>Book</label><input id="nfBook"></div></div>' +
      '<div class="two"><div class="f"><label>Colour</label><input id="nfColour"></div>' +
      '<div class="f"><label>Pattern</label><input id="nfPattern" placeholder="Herringbone, twill, birdseye, slub"></div></div>' +
      '<div class="two"><div class="f"><label>Vendor</label><select id="nfVendor">' +
      D().vendors.map(function (v) { return '<option value="' + v.id + '">' + esc(v.name) + ', ' + v.days + ' days</option>'; }).join('') +
      '</select><div class="hint">Not there? Close this and use Add a vendor.</div></div>' +
      '<div class="f"><label>Cost a metre, in rupees</label><input type="number" id="nfCost" placeholder="₹"></div></div>' +
      '<div class="three"><div class="f"><label>In the store, metres</label><input type="number" step="0.1" id="nfStore" placeholder="metres"></div>' +
      '<div class="f"><label>In the godown, metres</label><input type="number" step="0.1" id="nfGodown" placeholder="metres"></div>' +
      '<div class="f"><label>Notify me under, metres</label><input type="number" step="0.1" id="nfThresh" value="5"></div></div>' +
      '<div class="f"><label>Photograph of the cloth</label>' +
      '<input type="file" id="fpFile" accept="image/*" data-input="previewPhoto" data-id="new"></div>' +
      '<div id="fpPrev"></div>' +
      '<button class="btn gold" data-act="saveFabric">Add it</button>');
  };
  A.saveFabric = function () {
    var g = function (i) { return document.getElementById(i).value; };
    if (!g('nfBrand')) { GE.toast('A brand first.'); return; }
    var v = one(D().vendors, g('nfVendor'));
    D().fabrics.push({ id: GE.uid('F-'), brand: g('nfBrand'), vendor: g('nfVendor'), book: g('nfBook'),
      pattern: g('nfPattern'), colour: g('nfColour'), hex: '#b9b2a6', img: GE._pending || '',
      cost: Number(g('nfCost')) || 0,
      threshold: Number(g('nfThresh')) || 0, procure_days: v ? v.days : 21,
      stock: { Store: Number(g('nfStore')) || 0, Godown: Number(g('nfGodown')) || 0 },
      sat_days: 0, sold_90: 0 });
    GE._pending = null; GE.save(); GE.closeModal(); GE.go('#/fabric');
    GE.toast('Added. The Bolt watches it from now on.');
  };

  /* ================= Readymade, in two segments ================= */

  V['#/readymade'] = function () {
    var seg = GE.Q['#/readymade.seg'] || 'Ours';
    var all = D().readymade.filter(function (r) {
      return seg === 'Ours' ? r.owner === 'Sasya' : r.owner !== 'Sasya';
    });
    var list = all.filter(function (r) {
      return GE.matches(q('#/readymade'), [r.name, r.code, r.kind, r.designed_by, r.size, r.warehouse,
        r.owner === 'Sasya' ? 'ours' : dgname(r.owner)]);
    });
    var h = head('Readymade', 'Finished pieces on the floor. Ours and the designers’ are kept apart, because theirs is their money standing in our shop.',
      seg === 'Ours' ? '<button class="btn gold" data-act="newPiece">Add one of ours</button>' : '');
    h += '<div class="tabs">' + ['Ours', 'Third-party'].map(function (t) {
      return '<button class="' + (t === seg ? 'on' : '') + '" data-act="segRM" data-id="' + t + '">' + t +
        ' <span class="sub">' + D().readymade.filter(function (r) {
          return t === 'Ours' ? r.owner === 'Sasya' : r.owner !== 'Sasya'; }).length + '</span></button>';
    }).join('') + '</div>';
    h += searchBar('#/readymade', 'Search a piece, a code, a designer', list.length, all.length);

    h += '<div class="card"><table><thead><tr>' +
      (seg === 'Ours' ? '<th>Our name for it</th><th>Designed by</th><th>Kind</th><th>Size</th>' +
        '<th class="num">What it costs us</th><th class="num">What we sell it at</th>' +
        '<th class="num">Made so far</th><th>On the floor</th><th>To make another</th><th></th>'
      : '<th>Piece</th><th>Whose</th><th>Designed by</th><th>Kind</th><th>Size</th>' +
        '<th class="num">Price</th><th>On the floor</th><th></th>') +
      '</tr></thead><tbody>';
    list.forEach(function (r) {
      var age = r.age_days >= 90 ? ' ' + pill('dead', 'warn') : (r.age_days <= 14 ? ' ' + pill('moving', 'ok') : '');
      if (seg === 'Ours') {
        var madeFrom = D().orders.filter(function (o) { return o.from_design === r.id; }).length;
        h += '<tr><td><b>' + esc(r.name) + '</b><div class="sub">' + esc(r.code) + ' · ' + esc(r.warehouse) + '</div></td>' +
          '<td>' + esc(r.designed_by) + '</td><td>' + esc(r.kind) + '</td><td>' + esc(r.size) + '</td>' +
          '<td class="num">' + GE.money(r.cost_to_make) + '</td>' +
          '<td class="num">' + GE.money(r.price) + '<div class="sub">' +
          (GE.can('cost') && r.price ? Math.round((r.price - r.cost_to_make) / r.price * 100) + '% kept' : '') + '</div></td>' +
          '<td class="num">' + (r.made_count + madeFrom) + '<div class="sub">' +
          (madeFrom ? madeFrom + ' from the cockpit' : '') + '</div></td>' +
          '<td>' + r.age_days + ' days' + age + '</td><td>' + r.make_days + ' days</td>' +
          '<td><button class="mini" data-act="useDesign" data-id="' + r.id + '">Start an order from it</button></td></tr>';
      } else {
        h += '<tr><td><b>' + esc(r.name) + '</b><div class="sub">' + esc(r.warehouse) + '</div></td>' +
          '<td>' + esc(dgname(r.owner)) + '</td><td>' + esc(r.designed_by) + '</td>' +
          '<td>' + esc(r.kind) + '</td><td>' + esc(r.size) + '</td>' +
          '<td class="num">' + GE.money(r.price) + '</td>' +
          '<td>' + r.age_days + ' days' + age + '</td>' +
          '<td><button class="mini" data-act="useDesign" data-id="' + r.id + '">Start an order from it</button></td></tr>';
      }
    });
    if (!list.length) h += '<tr><td colspan="10" class="sub">Nothing matches that.</td></tr>';
    h += '</tbody></table></div>';
    h += '<div class="note">' + (seg === 'Ours'
      ? '<b>Ours.</b> A client often likes a piece on the floor and wants it in his own size. ' +
        'Starting an order from it carries the price across and the measurements are still taken.'
      : '<b>Theirs.</b> We cannot make another. What we can do is sell it, keep our margin and pay them the rest.') +
      '</div>';
    return h;
  };
  A.segRM = function (t) { GE.Q['#/readymade.seg'] = t; GE.refresh(); };
  A.useDesign = function (id) {
    var r = one(D().readymade, id);
    GE.modal('<h2>Start an order from ' + esc(r.name) + '</h2>' +
      '<p class="sub">' + esc(r.code || dgname(r.owner)) + ' · ' + rupees(r.price) + ' · ' + esc(r.kind) + '</p>' +
      '<div class="f"><label>For which client</label><select id="udClient">' +
      D().clients.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label>Type of order</label><select id="udType">' +
      GE.ORDER_TYPES.map(function (t) {
        var fit = r.owner === 'Sasya' ? (t.indexOf('Our own') === 0) : (t.indexOf('Third-party') === 0);
        return '<option' + (fit && t.indexOf('custom') > -1 ? ' selected' : '') + '>' + t + '</option>';
      }).join('') + '</select></div>' +
      '<div class="f"><label>Price</label><input type="number" id="udVal" value="' + r.price + '"></div>' +
      '<p class="hint">Readymade as it stands, or made again to his measurements. Either way a set is taken.</p>' +
      '<button class="btn gold" data-act="saveUseDesign" data-id="' + r.id + '">Put it on the showroom</button>');
  };
  A.saveUseDesign = function (id) {
    var r = one(D().readymade, id);
    var cid = document.getElementById('udClient').value, c = one(D().clients, cid);
    var type = document.getElementById('udType').value;
    var oid = 'O-' + (1053 + D().orders.length);
    D().orders.push({ id: oid, client: cid, family: c.family,
      vertical: type.indexOf('Third-party') === 0 ? 'designer' : 'in-house', type: type,
      stage: 'Shown designs', value: Number(document.getElementById('udVal').value) || 0, cuts: [],
      estimate: r.price, source: 'Walk-in', salesperson: GE.me().id, stylist: c.stylist,
      booked: GE.TODAY, advance_at: '', from_design: r.id,
      designer: r.owner === 'Sasya' ? '' : r.owner,
      event: '', event_date: '', delivery: '', trial: '',
      note: 'Started from ' + (r.code || r.name) + ' on the floor.',
      history: [{ stage: 'Stylist', by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5) },
                { stage: 'Shown designs', by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5) }] });
    GE.save(); GE.closeModal(); GE.go('#/showroom'); A.openOrder(oid);
    GE.toast(oid + ' started from ' + (r.code || r.name) + ', price carried across.');
  };
  A.newPiece = function () {
    GE.modal('<h2>Add one of ours</h2>' +
      '<div class="two"><div class="f"><label>Our name for it</label><input id="npcName"></div>' +
      '<div class="f"><label>Our code</label><input id="npcCode" placeholder="SM-BG-022"></div></div>' +
      '<div class="two"><div class="f"><label>Kind</label><select id="npcKind">' +
      GE.KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Who designed it</label><input id="npcBy" value="' + esc(GE.me().name) + '"></div></div>' +
      '<div class="three"><div class="f"><label>Size</label><input id="npcSize"></div>' +
      '<div class="f"><label>What it costs us</label><input type="number" id="npcCost"></div>' +
      '<div class="f"><label>What we sell it at</label><input type="number" id="npcPrice"></div></div>' +
      '<div class="two"><div class="f"><label>Days to make another</label><input type="number" id="npcDays" value="18"></div>' +
      '<div class="f"><label>Where it is</label><select id="npcWh"><option>Store</option><option>Godown</option></select></div></div>' +
      '<button class="btn gold" data-act="savePiece">Add it</button>');
  };
  A.savePiece = function () {
    var g = function (i) { return document.getElementById(i).value; };
    if (!g('npcName')) { GE.toast('A name first.'); return; }
    D().readymade.push({ id: GE.uid('R-'), name: g('npcName'), code: g('npcCode'), kind: g('npcKind'),
      owner: 'Sasya', designed_by: g('npcBy'), size: g('npcSize'),
      price: Number(g('npcPrice')) || 0, cost_to_make: Number(g('npcCost')) || 0,
      make_days: Number(g('npcDays')) || 0, age_days: 0, warehouse: g('npcWh'), made_count: 0, img: '' });
    GE.save(); GE.closeModal(); GE.go('#/readymade');
    GE.toast('Added. An opportunity can be started from it now.');
  };

  /* ================= Invoices ================= */

  V['#/invoices'] = function () {
    var all = D().invoices;
    var list = all.filter(function (i) {
      return GE.matches(q('#/invoices'), [i.id, i.billed_to, i.order, i.kind, cname(i.client), i.scope]);
    });
    var h = head('Invoices', 'There is no invoice value. There is the order value, what has been deducted, what has been paid, and what is pending.',
      '<button class="btn gold" data-act="newInvoice" data-id="">Raise an invoice</button>');
    h += agentStrip(3);
    var pending = sum(D().orders, function (o) { return Math.max(0, GE.orderMoney(o.id).pending); });
    h += '<div class="kpis">' +
      kpi(lakh(sum(D().orders, function (o) { return GE.orderMoney(o.id).total; })), 'Payable in all', 'order value less deductions, plus GST') +
      kpi(lakh(sum(all, function (i) { return GE.paidOn(i.id); })), 'Collected', '') +
      kpi(lakh(pending), 'Pending', 'across every order') +
      kpi(all.filter(function (i) { return GE.invoiceLeft(i) > 0 && days(GE.TODAY, i.due) < 0; }).length,
          'Overdue', 'The Collector is on them') + '</div>';
    h += searchBar('#/invoices', 'Search a number, a party, an order', list.length, all.length);
    h += '<div class="card"><table><thead><tr><th>Number</th><th>Billed to</th><th>Order</th><th>What for</th>' +
      '<th class="num">Order value</th><th class="num">Asked for</th><th class="num">Paid</th>' +
      '<th class="num">Pending on the order</th><th>State</th><th></th></tr></thead><tbody>';
    list.slice().sort(function (a, b) { return a.issued < b.issued ? 1 : -1; }).forEach(function (i) {
      var m = GE.orderMoney(i.order), left = GE.invoiceLeft(i);
      var state = left <= 0 ? pill('cleared', 'ok') :
        (days(GE.TODAY, i.due) < 0 ? pill((-days(GE.TODAY, i.due)) + 'd overdue', 'bad') : pill('sent', 'warn'));
      h += '<tr class="click" data-act="openInvoice" data-id="' + i.id + '">' +
        '<td><b>' + i.id + '</b><div class="sub">' + d(i.issued) + '</div></td>' +
        '<td>' + esc(i.billed_to) + (i.parent ? '<div class="sub">a company, not the man</div>' : '') + '</td>' +
        '<td>' + i.order + '</td><td>' + esc(i.kind) + '</td>' +
        '<td class="num sub">' + rupees(m.value) + '</td>' +
        '<td class="num">' + rupees(i.amount) + '</td>' +
        '<td class="num">' + rupees(GE.paidOn(i.id)) + '</td>' +
        '<td class="num"><b>' + rupees(m.pending) + '</b></td><td>' + state + '</td>' +
        '<td><button class="mini">Open</button></td></tr>';
    });
    if (!list.length) h += '<tr><td colspan="10" class="sub">Nothing matches that.</td></tr>';
    return h + '</tbody></table></div>';
  };

  A.openInvoice = function (id) {
    var i = one(D().invoices, id); if (!i) return;
    var m = GE.orderMoney(i.order), pays = by(D().payins, 'invoice', i.id);
    var h = '<h1>' + i.id + '</h1><p class="sub">' + esc(i.billed_to) + ' · ' + esc(i.kind) +
      ' · raised ' + d(i.issued) + ' · due ' + d(i.due) + '</p>';
    h += '<div class="card"><div class="cardhead"><h3>The order it belongs to</h3>' +
      '<button class="mini" data-act="openOrder" data-id="' + i.order + '">Open ' + i.order + '</button></div>' +
      '<div class="two">' + fld('Client', cname(i.client)) + fld('Billed to', i.billed_to) + '</div>' +
      '<div class="f"><label>What it covers</label><div>' + esc(i.scope) + '</div></div>' +
      moneyBlock(m, false) + '</div>';
    h += '<div class="card"><div class="cardhead"><h3>This invoice</h3>' +
      '<button class="mini" data-act="pdf" data-id="' + i.id + '">Download the PDF</button></div>' +
      '<table class="mon"><tbody>' +
      '<tr><td>' + esc(i.kind) + ' asked for</td><td>' + rupees(i.amount) + '</td></tr>' +
      '<tr><td>Paid against it</td><td>' + rupees(GE.paidOn(i.id)) + '</td></tr>' +
      '<tr class="big"><td>Still to come on this invoice</td><td>' + rupees(GE.invoiceLeft(i)) + '</td></tr>' +
      '</tbody></table></div>';

    h += '<div class="card"><div class="cardhead"><h3>Payments</h3>' +
      '<button class="mini" data-act="addPay" data-id="' + i.id + '">Record a payment</button></div>' +
      '<table><thead><tr><th>When</th><th>What it was</th><th>How</th><th>Reference</th><th>Taken by</th>' +
      '<th class="num">Amount</th></tr></thead><tbody>';
    pays.forEach(function (p) {
      h += '<tr><td>' + d(p.at) + '</td><td>' + esc(p.kind || i.kind) + '</td><td>' + esc(p.method) +
        '</td><td class="sub">' + esc(p.ref) + '</td><td>' + esc(pname(p.by)) +
        '</td><td class="num">' + rupees(p.amount) + '</td></tr>';
    });
    if (!pays.length) h += '<tr><td colspan="6" class="sub">Nothing paid yet.</td></tr>';
    h += '</tbody></table><p class="hint">A payment carries a mode. A deduction never does: it comes off ' +
      'the order value before anybody pays anything.</p></div>';
    GE.drawer(h);
  };

  A.addPay = function (id) {
    var i = one(D().invoices, id), m = GE.orderMoney(i.order);
    GE.modal('<h2>Record a payment</h2>' +
      '<p class="sub">' + i.id + ' · ' + rupees(GE.invoiceLeft(i)) + ' still asked for on this invoice, ' +
      rupees(m.pending) + ' pending on the whole order</p>' +
      '<div class="two"><div class="f"><label>Amount</label><input type="number" id="pyAmt" value="' +
      Math.max(0, GE.invoiceLeft(i)) + '"></div>' +
      '<div class="f"><label>What it is</label><select id="pyKind">' +
      ['Advance','Part payment','Full and final'].map(function (k) {
        return '<option' + (k === i.kind || (k === 'Full and final' && i.kind === 'Final') ? ' selected' : '') +
          '>' + k + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="f"><label>How it came in</label><select id="pyMethod">' +
      GE.PAY_METHODS.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>When</label><input type="date" id="pyAt" value="' + GE.TODAY + '"></div></div>' +
      '<div class="f"><label>Reference</label><input id="pyRef" placeholder="UPI reference, cheque number, receipt number"></div>' +
      '<button class="btn gold" data-act="savePay" data-id="' + i.id + '">Save it</button>');
  };
  A.savePay = function (id) {
    var amt = Number(document.getElementById('pyAmt').value) || 0;
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    var i = one(D().invoices, id);
    D().payins.push({ id: GE.uid('PI-'), invoice: id, amount: amt,
      kind: document.getElementById('pyKind').value,
      method: document.getElementById('pyMethod').value, at: document.getElementById('pyAt').value,
      ref: document.getElementById('pyRef').value, by: GE.me().id });
    GE.save(); A.openInvoice(id);
    var m = GE.orderMoney(i.order);
    GE.closeModal();
    GE.toast('Taken. Pending on ' + i.order + ' is now ' + rupees(m.pending) + '.');
  };
  A.pdf = function (id) {
    GE.toast(id + ': the built system draws the real PDF, on their own letterhead, with the ₹ sign in the font.');
  };

  A.newInvoice = function (oid) {
    var orders = GE.myOrders().filter(function (o) { return o.value > 0; });
    GE.modal('<h2>Raise an invoice</h2>' +
      '<div class="f"><label>Against which order</label><select id="ivOrder" data-change="ivOrderPick">' +
      orders.map(function (o) {
        return '<option value="' + o.id + '"' + (o.id === oid ? ' selected' : '') + '>' + o.id + ' · ' +
          cname(o.client) + ' · ' + rupees(o.value) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="card pad" id="ivMoney"></div>' +
      '<div class="two"><div class="f"><label>What this invoice is</label><select id="ivKind">' +
      ['Advance','Part payment','Final'].map(function (k) { return '<option>' + k + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label>How much you are asking for now</label><input type="number" id="ivAmt"></div></div>' +
      '<div class="f"><label>Billed to</label><input id="ivTo"></div>' +
      '<div class="f"><label>Or bill a company instead</label><input id="ivParent" placeholder="Bhansali Exports Pvt Ltd"></div>' +
      '<div class="f"><label>What it covers</label><textarea id="ivScope" rows="2"></textarea></div>' +
      '<div class="two"><div class="f"><label>Raised on</label><input type="date" id="ivAt" value="' + GE.TODAY + '"></div>' +
      '<div class="f"><label>Due by</label><input type="date" id="ivDue" value="2026-10-09"></div></div>' +
      '<p class="hint">Deductions live on the order, not here. Add them on the opportunity and they come ' +
      'off before GST.</p>' +
      '<button class="btn gold" data-act="saveInvoice">Raise it</button>');
    A.ivOrderPick();
  };
  A.ivOrderPick = function () {
    var o = one(D().orders, document.getElementById('ivOrder').value);
    if (!o) return;
    var m = GE.orderMoney(o.id);
    document.getElementById('ivMoney').innerHTML = moneyBlock(m, false);
    document.getElementById('ivTo').value = cname(o.client);
    document.getElementById('ivScope').value = o.note || '';
    document.getElementById('ivAmt').value = Math.max(0, m.total - m.billed);
  };
  A.saveInvoice = function () {
    var o = one(D().orders, document.getElementById('ivOrder').value);
    var amt = Number(document.getElementById('ivAmt').value) || 0;
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    var num = 'INV-' + (2663 + D().invoices.length);
    D().invoices.push({ id: num, order: o.id, client: o.client,
      billed_to: document.getElementById('ivParent').value || document.getElementById('ivTo').value,
      parent: document.getElementById('ivParent').value,
      amount: amt, kind: document.getElementById('ivKind').value,
      issued: document.getElementById('ivAt').value, due: document.getElementById('ivDue').value,
      scope: document.getElementById('ivScope').value });
    GE.save(); GE.closeModal(); A.openInvoice(num);
    var m = GE.orderMoney(o.id);
    GE.toast(num + ' raised for ' + rupees(amt) + '. Pending on the order stays ' + rupees(m.pending) +
      ' until it is paid.');
  };

  /* ================= Owed to designers ================= */

  V['#/payables'] = function () {
    var h = head('Owed to designers', 'What we collected on their behalf, what we keep, and what is theirs. The arithmetic is theirs too, so it is shown line by line.');
    h += agentStrip(2);
    var open = D().payables.filter(function (p) { return !p.paid; });
    h += '<div class="kpis">' +
      kpi(lakh(sum(open, function (p) { return GE.payableOn(p).payable; })), 'Owed right now', open.length + ' pieces sold') +
      kpi(lakh(sum(open, function (p) { return GE.payableOn(p).ours; })), 'Our margin on those', '') +
      kpi(open.filter(function (p) { return days(p.at) > 30; }).length, 'Older than a month', 'The Settler is on them') +
      '</div>';
    h += '<div class="card"><table><thead><tr><th>Designer</th><th>Order</th><th>Sold on</th>' +
      '<th class="num">Total charged</th><th class="num">GST 18%</th><th class="num">Net</th>' +
      '<th class="num">Our margin</th><th class="num">Theirs</th><th>State</th><th></th></tr></thead><tbody>';
    D().payables.forEach(function (p) {
      var m = GE.payableOn(p);
      h += '<tr><td><b>' + esc(dgname(p.designer)) + '</b><div class="sub">' + p.margin + '% to us</div></td>' +
        '<td>' + p.order + '</td><td>' + d(p.at) + '</td>' +
        '<td class="num">' + rupees(m.gross) + '</td><td class="num">' + rupees(m.gst) + '</td>' +
        '<td class="num">' + rupees(m.net) + '</td><td class="num">' + rupees(m.ours) + '</td>' +
        '<td class="num"><b>' + rupees(m.payable) + '</b></td>' +
        '<td>' + (p.paid ? pill('paid ' + d(p.paid_at), 'ok') :
          (days(p.at) > 30 ? pill(days(p.at) + 'd', 'bad') : pill(days(p.at) + 'd', 'warn'))) + '</td>' +
        '<td>' + (p.paid ? '' : '<button class="mini" data-act="payDesigner" data-id="' + p.id + '">Pay out</button>') +
        '</td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="note"><b>The arithmetic, on a round number.</b> A piece is charged at ' + rupees(100000) +
      ' including tax. GST at 18% of that is ' + rupees(18000) + ', leaving ' + rupees(82000) +
      '. On a 30% designer the house keeps ' + rupees(24600) + ' and ' + rupees(57400) +
      ' is theirs. Every row above is that same sum, on the total that order was charged.</div>';
    return h;
  };
  A.payDesigner = function (id) {
    var p = one(D().payables, id), m = GE.payableOn(p);
    GE.modal('<h2>Pay ' + esc(dgname(p.designer)) + '</h2>' +
      '<p class="sub">' + p.order + ', sold ' + d(p.at) + '</p>' +
      '<div class="card pad"><table class="mon"><tbody>' +
      '<tr><td>Total charged to the client</td><td>' + rupees(m.gross) + '</td></tr>' +
      '<tr><td>GST at 18%</td><td>− ' + rupees(m.gst) + '</td></tr>' +
      '<tr><td>Net</td><td>' + rupees(m.net) + '</td></tr>' +
      '<tr><td>Our margin at ' + p.margin + '%</td><td>− ' + rupees(m.ours) + '</td></tr>' +
      '<tr class="big"><td>Paying out</td><td>' + rupees(m.payable) + '</td></tr>' +
      '</tbody></table></div>' +
      '<div class="two"><div class="f"><label>How</label><select id="poMethod">' +
      GE.PAY_METHODS.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>When</label><input type="date" id="poAt" value="' + GE.TODAY + '"></div></div>' +
      '<button class="btn gold" data-act="savePayout" data-id="' + p.id + '">Mark it paid</button>');
  };
  A.savePayout = function (id) {
    var p = one(D().payables, id);
    p.paid = true; p.paid_at = document.getElementById('poAt').value;
    p.method = document.getElementById('poMethod').value;
    GE.save(); GE.closeModal(); GE.go('#/payables');
    GE.toast('Paid out. It leaves the Settler’s list and lands in Accounting.');
  };

  /* ================= P/L on each order ================= */

  V['#/costsheet'] = function () {
    var all = GE.myOrders().filter(function (o) { return o.value > 0; });
    var orders = all.filter(function (o) {
      return GE.matches(q('#/costsheet'), [o.id, cname(o.client), o.type]);
    });
    var h = head('P/L on each order', 'What each order is worth against everything it has cost us. One order at a time, and the month together.');
    var val = sum(all, function (o) { return o.value; });
    var cst = sum(all, function (o) { return GE.costOf(o.id).total; });
    h += '<div class="kpis">' +
      kpi(lakh(val), 'Order value on the books', all.length + ' orders') +
      kpi(lakh(cst), 'Cost recorded', 'fabric plus every line entered') +
      kpi(lakh(val - cst), 'P/L, if nothing else lands', val ? Math.round((val - cst) / val * 100) + '%' : '') +
      '</div>';
    h += searchBar('#/costsheet', 'Search an order, a client, a type', orders.length, all.length);
    h += '<div class="card"><table><thead><tr><th>Order</th><th>Client</th><th>Type</th>' +
      '<th class="num">Order value</th><th class="num">Fabric</th><th class="num">Stitching</th>' +
      '<th class="num">Designing</th><th class="num">Handwork</th><th class="num">Porter</th>' +
      '<th class="num">All cost</th><th class="num">P/L</th></tr></thead><tbody>';
    orders.forEach(function (o) {
      var c = GE.costOf(o.id), m = GE.marginOf(o.id);
      function kind(k) { return sum(c.lines.filter(function (l) { return l.kind === k; }), function (l) { return l.amount; }); }
      h += '<tr class="click" data-act="openOrder" data-id="' + o.id + '"><td><b>' + o.id + '</b></td>' +
        '<td>' + esc(cname(o.client)) + '</td>' +
        '<td>' + esc(o.type || '—') + '</td>' +
        '<td class="num">' + rupees(o.value) + '</td>' +
        '<td class="num">' + rupees(c.fabric) + '</td>' +
        '<td class="num">' + rupees(kind('Stitching')) + '</td>' +
        '<td class="num">' + rupees(kind('Designing')) + '</td>' +
        '<td class="num">' + rupees(kind('Embroidery / handwork')) + '</td>' +
        '<td class="num">' + rupees(kind('Porter / courier')) + '</td>' +
        '<td class="num">' + rupees(c.total) + '</td>' +
        '<td class="num"><b>' + rupees(m.kept) + '</b> <span class="sub">' + m.pct + '%</span></td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="note">On a third-party order our margin is the designer split, not this sheet. ' +
      'The two never get added together.</div>';
    return h;
  };

  A.addCost = function (oid) {
    GE.modal('<h2>Add a cost to ' + esc(oid) + '</h2>' +
      '<div class="f"><label>What kind</label><select id="csKind">' +
      GE.COST_KINDS.filter(function (k) { return k !== 'Fabric'; }).map(function (k) {
        return '<option>' + k + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Detail</label><input id="csLabel" placeholder="Zardozi on the sherwani, Ratan"></div>' +
      '<div class="f"><label>Amount</label><input type="number" id="csAmt"></div>' +
      '<p class="hint">Fabric is not entered here. It comes from the metres on the garment times the cost per metre.</p>' +
      '<button class="btn gold" data-act="saveCost" data-id="' + esc(oid) + '">Add it</button>');
  };
  A.saveCost = function (oid) {
    var amt = Number(document.getElementById('csAmt').value) || 0;
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    D().costlines.push({ id: GE.uid('CL-'), order: oid, kind: document.getElementById('csKind').value,
      label: document.getElementById('csLabel').value, amount: amt, by: GE.me().id, at: GE.TODAY });
    GE.save(); GE.closeModal(); A.openOrder(oid);
    GE.toast('Added, with your name on it.');
  };

  /* ================= Accounting ================= */

  V['#/accounting'] = function () {
    var h = head('Accounting', 'Every order and every payment by date, read only, in the shape the accounts team already works in.',
      '<button class="btn alt" data-act="tally">Export for Tally</button>');
    h += '<div class="card"><div class="cardhead"><h3>Sales</h3><span class="sub">by order, net of deductions</span></div>' +
      '<table><thead><tr><th>Order</th><th>Party</th><th>Type</th><th class="num">Order value</th>' +
      '<th class="num">Deductions</th><th class="num">Net</th><th class="num">GST</th>' +
      '<th class="num">Total</th><th class="num">Pending</th></tr></thead><tbody>';
    var tx = 0, gs = 0, pend = 0;
    D().orders.filter(function (o) { return o.value > 0; }).forEach(function (o) {
      var m = GE.orderMoney(o.id); tx += m.net; gs += m.gst; pend += Math.max(0, m.pending);
      h += '<tr><td><b>' + o.id + '</b><div class="sub">' + d(o.advance_at || o.booked) + '</div></td>' +
        '<td>' + esc(cname(o.client)) + '</td><td>' + esc(o.type || '—') + '</td>' +
        '<td class="num">' + rupees(m.value) + '</td><td class="num">' + rupees(m.cutsTotal) + '</td>' +
        '<td class="num">' + rupees(m.net) + '</td><td class="num">' + rupees(m.gst) + '</td>' +
        '<td class="num">' + rupees(m.total) + '</td><td class="num">' + rupees(m.pending) + '</td></tr>';
    });
    h += '<tr><td colspan="5"><b>Total</b></td><td class="num"><b>' + rupees(tx) + '</b></td>' +
      '<td class="num"><b>' + rupees(gs) + '</b></td><td class="num"><b>' + rupees(tx + gs) + '</b></td>' +
      '<td class="num"><b>' + rupees(pend) + '</b></td></tr></tbody></table></div>';

    h += '<div class="card"><div class="cardhead"><h3>Money in</h3><span class="sub">by payment date</span></div>' +
      '<table><thead><tr><th>Date</th><th>Invoice</th><th>Party</th><th>What it was</th><th>Method</th>' +
      '<th>Reference</th><th class="num">Amount</th></tr></thead><tbody>';
    D().payins.slice().sort(function (a, b) { return a.at < b.at ? -1 : 1; }).forEach(function (p) {
      var i = one(D().invoices, p.invoice);
      h += '<tr><td>' + d(p.at) + '</td><td>' + p.invoice + '</td><td>' + esc(i ? i.billed_to : '') + '</td>' +
        '<td>' + esc(p.kind || (i ? i.kind : '')) + '</td><td>' + esc(p.method) + '</td>' +
        '<td class="sub">' + esc(p.ref) + '</td><td class="num">' + rupees(p.amount) + '</td></tr>';
    });
    h += '<tr><td colspan="6"><b>Total</b></td><td class="num"><b>' +
      rupees(sum(D().payins, function (p) { return p.amount; })) + '</b></td></tr></tbody></table></div>';

    h += '<div class="card"><div class="cardhead"><h3>Money out, to designers</h3></div>' +
      '<table><thead><tr><th>Date</th><th>Designer</th><th>Order</th><th class="num">Paid</th>' +
      '<th>State</th></tr></thead><tbody>';
    D().payables.forEach(function (p) {
      var m = GE.payableOn(p);
      h += '<tr><td>' + d(p.paid_at || p.at) + '</td><td>' + esc(dgname(p.designer)) + '</td>' +
        '<td>' + p.order + '</td><td class="num">' + rupees(m.payable) + '</td>' +
        '<td>' + (p.paid ? pill('paid', 'ok') : pill('owing', 'warn')) + '</td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="note">Nothing on this screen can be edited. Accounts reads it, exports it and ' +
      'puts it into Tally. The cockpit never writes into Tally by itself.</div>';
    return h;
  };
  A.tally = function () { GE.toast('The built system writes a Tally-shaped CSV, one row per voucher.'); };

  /* ================= Targets, set from this screen ================= */

  V['#/targets'] = function () {
    var period = (location.hash.split('=')[1] || 'Month');
    var w = GE.windowFor(period);
    var rule = GE.can('targets');
    var h = head('Targets', 'Against target is the value closed in the period against the value set for that period. It is never pro-rated by the day.',
      (rule === 'set' ? '<button class="btn gold" data-act="newTarget">Set a target</button> ' : '') +
      '<span class="pill gold">' + esc(w.label) + '</span>');
    h += '<div class="chips">' + GE.PERIODS.map(function (p) {
      return '<a class="chip' + (p === period ? ' on' : '') + '" href="#/targets?p=' + p + '">' + p + '</a>';
    }).join('') + '</div>';

    var gone = Math.round((days(w.from) + 1) / (days(w.from, w.to) + 1) * 100);
    h += '<div class="note">' + esc(w.label) + ' is <b>' + Math.max(0, Math.min(100, gone)) +
      '% gone</b>. The percentages below are against the whole period, so early in a period they read low on purpose.</div>';

    if (rule === 'set' || rule === 'see') {
      var houseT = D().targets.filter(function (t) { return t.who === 'house' && t.unit === 'money' && t.what.indexOf('Order value') === 0; })[0];
      var marginT = D().targets.filter(function (t) { return t.what === 'Margin kept'; })[0];
      var closed = GE.closedIn(w);
      h += '<div class="card"><div class="cardhead"><h3>The house</h3>' +
        '<span class="sub">' + (rule === 'set' ? 'type over a target to change it' : 'set by the owner') + '</span></div>' +
        '<table><thead><tr><th>What</th><th class="num">Target for the ' + esc(period.toLowerCase()) +
        '</th><th class="num">Where we are</th><th>Against target</th><th class="num">Orders</th></tr></thead><tbody>';
      [[houseT, sum(closed, function (o) { return o.value; }), closed.length],
       [marginT, sum(D().orders.filter(function (o) { return o.stage === 'Delivered'; }),
          function (o) { return GE.marginOf(o.id).kept; }), null]].forEach(function (row) {
        var t = row[0]; if (!t) return;
        var tv = GE.targetValue(t, period), got = row[1];
        var pct = tv ? Math.round(got / tv * 100) : 0;
        h += '<tr><td><b>' + esc(t.what) + '</b></td>' +
          '<td class="num">' + targetCell(t, period, rule) + '</td>' +
          '<td class="num"><b>' + rupees(got) + '</b></td>' +
          '<td>' + bar(pct, pct >= 100 ? 'ok' : (pct >= 50 ? 'warn' : 'bad')) + pct + '%</td>' +
          '<td class="num">' + (row[2] == null ? '—' : row[2]) + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }

    var sps = by(D().people, 'role', 'Salesperson');
    if (rule === 'own') sps = sps.filter(function (p) { return p.id === GE.me().id; });
    if (sps.length) {
      h += '<div class="card"><div class="cardhead"><h3>By salesperson</h3>' +
        '<span class="sub">value first, count second</span></div>' +
        '<table><thead><tr><th>Who</th><th>Service line</th><th class="num">Target for the ' + esc(period.toLowerCase()) +
        '</th><th class="num">Closed</th><th>Against target</th><th class="num">Orders</th></tr></thead><tbody>';
      sps.forEach(function (p) {
        var t = D().targets.filter(function (t) { return t.who === p.id; })[0];
        var tv = t ? GE.targetValue(t, period) : 0;
        var got = GE.closedIn(w, p.id);
        var v = sum(got, function (o) { return o.value; });
        var pct = tv ? Math.round(v / tv * 100) : 0;
        h += '<tr><td><b>' + esc(p.name) + '</b></td>' +
          '<td><select data-change="setLines" data-id="' + p.id + '">' +
          ['In-house','Third-party','Both lines'].map(function (l) {
            var cur = (p.lines || []).length > 1 ? 'Both lines' : (p.lines || [])[0];
            return '<option' + (l === cur ? ' selected' : '') + '>' + l + '</option>'; }).join('') +
          '</select></td>' +
          '<td class="num">' + (t ? targetCell(t, period, rule) :
            (rule === 'set' ? '<button class="mini" data-act="newTarget" data-id="' + p.id + '">Set one</button>' : '—')) + '</td>' +
          '<td class="num"><b>' + rupees(v) + '</b></td>' +
          '<td>' + bar(pct, pct >= 100 ? 'ok' : (pct >= 50 ? 'warn' : 'bad')) + pct + '%</td>' +
          '<td class="num">' + got.length + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }

    if (rule === 'set' || rule === 'see') {
      var closedAll = GE.closedIn(w);
      var houseVal = GE.targetValue(D().targets.filter(function (t) {
        return t.who === 'house' && t.unit === 'money' && t.what.indexOf('Order value') === 0; })[0], period);
      h += '<div class="card"><div class="cardhead"><h3>By service line</h3>' +
        '<span class="sub">a line is scored on the orders in that line, not on who is assigned to it</span></div>' +
        '<table><thead><tr><th>Line</th><th class="num">Target</th><th class="num">Closed</th>' +
        '<th>Against target</th><th class="num">Orders</th></tr></thead><tbody>';
      [['In-house', 'in-house', 0.6], ['Third-party', 'designer', 0.4]].forEach(function (L) {
        var mine = closedAll.filter(function (o) { return o.vertical === L[1]; });
        var v = sum(mine, function (o) { return o.value; });
        var tv = Math.round(houseVal * L[2]);
        var pct = tv ? Math.round(v / tv * 100) : 0;
        h += '<tr><td><b>' + L[0] + '</b></td><td class="num">' + rupees(tv) + '</td>' +
          '<td class="num"><b>' + rupees(v) + '</b></td>' +
          '<td>' + bar(pct, pct >= 100 ? 'ok' : (pct >= 50 ? 'warn' : 'bad')) + pct + '%</td>' +
          '<td class="num">' + mine.length + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }

    h += '<div class="card"><div class="cardhead"><h3>The floor and the styling</h3></div>' +
      '<table><thead><tr><th>Who</th><th>What they are aiming at</th><th class="num">Target</th>' +
      '<th>Where they are</th></tr></thead><tbody>';
    var any = false;
    D().targets.filter(function (t) { return t.unit !== 'money'; }).forEach(function (t) {
      if (rule === 'own' && t.who !== GE.me().id) return;
      any = true;
      var got, label;
      if (t.per === 'master') {
        var done = D().garments.filter(function (g) { return g.master === t.who && g.stage === 'Delivered'; });
        got = done.length ? Math.round(done.filter(function (g) {
          var r = (g.history || []).filter(function (x) { return x.stage === 'Ready'; })[0];
          return !r || r.at.slice(0, 10) <= g.due; }).length / done.length * 100) : 100;
        label = got + '%';
      } else if (t.per === 'stylist') {
        got = Object.keys(GE.closedIn(w).filter(function (o) { return o.stylist === t.who; })
          .reduce(function (a, o) { a[o.family] = 1; return a; }, {})).length;
        label = got + ' households';
      } else {
        var del = D().orders.filter(function (o) { return o.stage === 'Delivered'; });
        got = del.length ? Math.round(del.filter(function (o) {
          var r = (o.history || []).filter(function (x) { return x.stage === 'Delivered'; })[0];
          return !r || r.at.slice(0, 10) <= o.delivery; }).length / del.length * 100) : 100;
        label = got + '%';
      }
      var pct = t.month ? Math.round(got / t.month * 100) : 0;
      h += '<tr><td><b>' + esc(t.who === 'house' ? 'The house' : pname(t.who)) + '</b></td>' +
        '<td>' + esc(t.what) + '</td><td class="num">' + targetCell(t, period, rule) + '</td>' +
        '<td>' + bar(pct, pct >= 100 ? 'ok' : 'warn') + label + '</td></tr>';
    });
    if (!any) h += '<tr><td colspan="4" class="sub">Nothing set for you.</td></tr>';
    h += '</tbody></table></div>';

    if (rule === 'set') h += '<div class="note">Type straight over a figure to change it. A month target ' +
      'halves for a half-month, trebles for a quarter and multiplies by twelve for a year. ' +
      'Only the owner and the BDM set them.</div>';
    return h;
  };
  V['#/targets?p=Half-month'] = V['#/targets'];
  V['#/targets?p=Month'] = V['#/targets'];
  V['#/targets?p=Quarter'] = V['#/targets'];
  V['#/targets?p=Year'] = V['#/targets'];

  /* the cell you type over. The month figure is the one stored; the period scales it. */
  function targetCell(t, period, rule) {
    if (rule !== 'set')
      return (t.unit === 'money' ? rupees(GE.targetValue(t, period)) : t.month + (t.unit === 'pct' ? '%' : ''));
    if (period !== 'Month' && t.unit === 'money')
      return '<span class="sub" title="scaled from the month">' + rupees(GE.targetValue(t, period)) + '</span>';
    return '<input type="number" style="width:120px;text-align:right" value="' + t.month +
      '" data-change="setTarget" data-id="' + t.id + '">' + (t.unit === 'pct' ? ' %' : '');
  }
  A.setTarget = function (id, el) {
    var t = one(D().targets, id);
    t.month = Number(el.value) || 0; GE.save();
    GE.toast(esc(t.what) + ' set to ' + (t.unit === 'money' ? rupees(t.month) : t.month) + ' a month.');
  };
  A.newTarget = function (who) {
    GE.modal('<h2>Set a target</h2>' +
      '<div class="f"><label>For whom</label><select id="tgWho">' +
      '<option value="house">The house</option>' +
      D().people.filter(function (p) { return ['Salesperson','Stylist','Master'].indexOf(p.role) > -1; })
        .map(function (p) { return '<option value="' + p.id + '"' + (p.id === who ? ' selected' : '') + '>' +
          esc(p.name) + ', ' + esc(p.role) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>What they are aiming at</label><select id="tgWhat">' +
      ['Order value closed','Margin kept','Delivered on or before the promised date',
       'Garments returned on time','Households advised who placed an order'].map(function (x) {
        return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="two"><div class="f"><label>Measured in</label><select id="tgUnit">' +
      '<option value="money">Rupees</option><option value="pct">Per cent</option>' +
      '<option value="count">A count</option></select></div>' +
      '<div class="f"><label>For a month</label><input type="number" id="tgVal"></div></div>' +
      '<p class="hint">A month figure is what gets stored. Half-month, quarter and year are worked out ' +
      'from it, and never pro-rated by the day.</p>' +
      '<button class="btn gold" data-act="saveTarget">Set it</button>');
  };
  A.saveTarget = function () {
    var who = document.getElementById('tgWho').value;
    var val = Number(document.getElementById('tgVal').value) || 0;
    if (val <= 0) { GE.toast('Put a figure in.'); return; }
    var p = one(D().people, who);
    D().targets.push({ id: GE.uid('T-'), what: document.getElementById('tgWhat').value,
      per: who === 'house' ? 'house' : (p.role === 'Salesperson' ? 'salesperson' :
        (p.role === 'Master' ? 'master' : 'stylist')),
      who: who, month: val, unit: document.getElementById('tgUnit').value });
    GE.save(); GE.closeModal(); GE.go('#/targets');
    GE.toast('Set. It shows against every period from here on.');
  };
  A.setLines = function (id, el) {
    var p = one(D().people, id);
    p.lines = el.value === 'Both lines' ? ['In-house', 'Third-party'] : [el.value];
    GE.save(); GE.toast(p.name + ' now works ' + el.value.toLowerCase() + '.');
  };

  /* ================= Team ================= */

  V['#/team'] = function () {
    var h = head('Team', 'Everybody, their role, who they report to and what their role can reach.',
      '<button class="btn gold" data-act="newPerson">Add somebody</button>');
    h += '<div class="card"><table><thead><tr><th>Name</th><th>Role</th><th>Reports to</th>' +
      '<th>Service line</th><th>Login</th><th>Phone</th></tr></thead><tbody>';
    D().people.forEach(function (p) {
      h += '<tr><td><b>' + esc(p.name) + '</b>' + (p.craft ? '<div class="sub">' + esc(p.craft) + '</div>' : '') + '</td>' +
        '<td>' + esc(p.role) + '</td><td>' + esc(p.reports ? pname(p.reports) : '—') + '</td>' +
        '<td class="sub">' + esc((p.lines || []).join(', ') || '—') + '</td>' +
        '<td><code>' + esc(p.login) + '</code></td><td class="sub">' + esc(p.phone) + '</td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="card"><div class="cardhead"><h3>What each role can reach</h3>' +
      '<span class="sub">a role is a filter on the data, not a hidden column</span></div>' +
      '<table><thead><tr><th>Role</th><th>Orders</th><th>Cost and P/L</th><th>Any money</th>' +
      '<th>Stock</th><th>Operations</th><th>Invoices</th><th>Targets</th><th>Settings</th></tr></thead><tbody>';
    Object.keys(GE.ROLES).forEach(function (r) {
      var c = GE.ROLES[r];
      function y(v) {
        if (v === true) return '<span class="pill ok">yes</span>';
        if (v === false) return '<span class="pill">no</span>';
        return '<span class="pill warn">' + esc(v) + '</span>';
      }
      h += '<tr><td><b>' + esc(r) + '</b></td><td>' + y(c.orders) + '</td><td>' + y(c.cost) + '</td>' +
        '<td>' + y(c.money) + '</td><td>' + y(c.stock) + '</td><td>' + y(c.ops) + '</td>' +
        '<td>' + y(c.invoices) + '</td><td>' + y(c.targets) + '</td><td>' + y(c.settings) + '</td></tr>';
    });
    return h + '</tbody></table>' +
      '<p class="hint">The BDM has the owner’s reach apart from the AI overview and the agent ' +
      'discussions. A master sees garments given to them, their measurements, metres, and no figure at all.</p></div>';
  };

  /* ================= Agents ================= */

  V['#/agents'] = function () {
    var found = GE.runAgents();
    var h = head('Agents and their rules', 'Each one is a rule with a job title. You set the threshold it watches with, and it shows its working.');
    h += '<div class="kpis">' +
      kpi(D().agents.filter(function (a) { return a.mode !== 'off'; }).length, 'Switched on', 'of ' + D().agents.length) +
      kpi(found.filter(function (f) { return f.level === 'bad'; }).length, 'Raised now', 'needing somebody') +
      kpi(found.filter(function (f) { return f.level === 'ok'; }).length, 'Worth knowing', 'the winners') +
      '</div>';
    D().agents.forEach(function (a) {
      var mine = found.filter(function (f) { return f.agent === a.id; });
      h += '<div class="card"><div class="cardhead"><div><h3>' + esc(a.name) + '</h3>' +
        '<p class="sub">' + esc(a.job) + '</p></div>' +
        '<div><select data-change="setMode" data-id="' + a.id + '">' +
        ['off', 'suggest', 'auto'].map(function (m) {
          return '<option' + (m === a.mode ? ' selected' : '') + '>' + m + '</option>'; }).join('') +
        '</select></div></div>';
      var keys = Object.keys(a.rules || {});
      if (keys.length) {
        h += '<div class="' + (keys.length > 1 ? 'two' : '') + '">';
        keys.forEach(function (k) {
          h += '<div class="f"><label>' + esc((a.rule_labels || {})[k] || k) + '</label>' +
            '<input type="number" value="' + a.rules[k] + '" data-change="setRule" data-id="' + a.id + '|' + k + '"></div>';
        });
        h += '</div>';
      } else h += '<p class="hint">No threshold of its own. It uses the notify mark set on each bunch of fabric.</p>';
      if (a.mode === 'off') h += '<p class="sub">Switched off, so it is raising nothing.</p>';
      else if (!mine.length) h += '<p class="sub empty">Nothing to raise this morning.</p>';
      else mine.forEach(function (f) {
        h += '<div class="rung"><div class="n">' + (f.level === 'bad' ? '!' : (f.level === 'ok' ? '★' : '·')) +
          '</div><div><b>' + esc(f.what) + '</b><p>' + esc(f.why) + '</p></div>' +
          '<div><a class="mini" href="' + f.route + '">Open it</a></div></div>';
      });
      h += '</div>';
    });
    return h + '<div class="note">Suggest means it drafts and waits. Auto means it acts on the floor by itself. ' +
      'Anything a client would see queues for a person whatever the mode says, and that is in the ' +
      'dispatcher, not in a setting.</div>';
  };
  A.setMode = function (id, el) {
    one(D().agents, id).mode = el.value; GE.save(); GE.go('#/agents');
    GE.toast('Set to ' + el.value + '.');
  };
  A.setRule = function (id, el) {
    var p = id.split('|');
    one(D().agents, p[0]).rules[p[1]] = Number(el.value) || 0;
    GE.save(); GE.go('#/agents');
    GE.toast('Threshold saved. What it raises has changed with it.');
  };

  /* ================= Inbox ================= */

  V['#/inbox'] = function () {
    var all = D().threads.filter(function (t) {
      return GE.can('orders') === 'all' || t.assigned === GE.me().id;
    });
    var list = all.filter(function (t) {
      return GE.matches(q('#/inbox'), [cname(t.client), t.channel, pname(t.assigned),
        t.msgs.map(function (m) { return m.text; }).join(' ')]);
    });
    var h = head('Inbox', 'WhatsApp and Instagram, threaded by person and assigned, so each person answers their own.');
    h += searchBar('#/inbox', 'Search a person, a channel, a message', list.length, all.length);
    h += '<div class="card"><table><thead><tr><th>Who</th><th>Channel</th><th>Last message</th>' +
      '<th>Assigned to</th><th></th></tr></thead><tbody>';
    list.forEach(function (t) {
      var last = t.msgs[t.msgs.length - 1];
      h += '<tr class="click" data-act="openThread" data-id="' + t.id + '">' +
        '<td><b>' + esc(cname(t.client)) + '</b>' + (t.unread ? ' ' + pill(t.unread + ' new', 'gold') : '') + '</td>' +
        '<td>' + esc(t.channel) + '</td>' +
        '<td>' + esc(last.text.slice(0, 70)) + '<div class="sub">' + dt(last.at) + '</div></td>' +
        '<td>' + esc(pname(t.assigned)) + '</td><td><button class="mini">Open</button></td></tr>';
    });
    if (!list.length) h += '<tr><td colspan="5" class="sub">Nothing matches that.</td></tr>';
    h += '</tbody></table></div>';
    return h + '<div class="note">Every field in the cockpit can go into a WhatsApp template, so a message ' +
      'can carry the trial date, the garment, the master or the pending amount without anybody typing it.</div>';
  };
  A.openThread = function (id) {
    var t = one(D().threads, id);
    var h = '<h1>' + esc(cname(t.client)) + '</h1><p class="sub">' + esc(t.channel) +
      ' · assigned to ' + esc(pname(t.assigned)) + '</p><div class="card">';
    t.msgs.forEach(function (m) {
      h += '<div style="margin:9px 0;padding:11px 14px;border-radius:12px;max-width:80%;' +
        (m.from === 'us' ? 'background:var(--charcoal);color:var(--cream);margin-left:auto' :
         'background:#f2ece1') + '">' + esc(m.text) +
        '<div style="font-size:11px;opacity:.65;margin-top:5px">' + dt(m.at) + '</div></div>';
    });
    h += '</div><div class="card"><div class="f"><label>Reply</label>' +
      '<textarea id="thReply" rows="3" placeholder="Type, or pick a template"></textarea></div>' +
      '<div class="chips">' +
      ['Trial reminder, {{trial_date}}', 'Ready for collection, {{order_id}}', 'Pending at delivery, {{pending}}',
       'Fabric options attached'].map(function (x) {
        return '<span class="chip" data-act="useTpl" data-id="' + esc(x) + '">' + esc(x) + '</span>'; }).join('') +
      '</div><button class="btn gold" data-act="sendReply" data-id="' + t.id + '">Send it</button>' +
      '<p class="hint">In the built system this goes out on their own WhatsApp Business number.</p></div>';
    GE.drawer(h);
  };
  A.useTpl = function (id) {
    document.getElementById('thReply').value = id
      .replace('{{trial_date}}', '22 November').replace('{{order_id}}', 'O-1041')
      .replace('{{pending}}', rupees(GE.orderMoney('O-1041').pending));
  };
  A.sendReply = function (id) {
    var t = one(D().threads, id), box = document.getElementById('thReply');
    if (!box.value.trim()) { GE.toast('Write something first.'); return; }
    t.msgs.push({ at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5), from: 'us', text: box.value.trim() });
    t.unread = 0; GE.save(); A.openThread(id);
    GE.toast('Sent, and logged against the client.');
  };

  /* ================= Campaigns ================= */

  V['#/campaigns'] = function () {
    var h = head('Campaigns', 'What was spent against what it brought in. A lead is only a lead once it is a person on the showroom.');
    var spend = sum(D().campaigns, function (c) { return c.spend; });
    var val = sum(D().campaigns, function (c) { return c.value; });
    h += '<div class="kpis">' +
      kpi(lakh(spend), 'Spent this month', '') +
      kpi(lakh(val), 'Order value from it', '') +
      kpi(spend ? (val / spend).toFixed(1) + 'x' : '—', 'Return', 'order value over spend') +
      kpi(sum(D().campaigns, function (c) { return c.leads; }), 'Leads', '') +
      '</div>';
    h += '<div class="card"><table><thead><tr><th>Campaign</th><th>Channel</th><th class="num">Spend</th>' +
      '<th class="num">Leads</th><th class="num">Cost a lead</th><th class="num">Orders</th>' +
      '<th class="num">Order value</th><th class="num">Return</th></tr></thead><tbody>';
    D().campaigns.forEach(function (c) {
      h += '<tr><td><b>' + esc(c.name) + '</b><div class="sub">' + esc(c.window) + '</div></td>' +
        '<td>' + esc(c.channel) + '</td><td class="num">' + rupees(c.spend) + '</td>' +
        '<td class="num">' + c.leads + '</td>' +
        '<td class="num">' + rupees(c.leads ? c.spend / c.leads : 0) + '</td>' +
        '<td class="num">' + c.orders + '</td><td class="num">' + rupees(c.value) + '</td>' +
        '<td class="num">' + (c.spend ? '<b>' + (c.value / c.spend).toFixed(1) + 'x</b>' : '—') + '</td></tr>';
    });
    return h + '</tbody></table></div>' +
      '<div class="note">Nothing here is connected yet. Meta, Google and the WhatsApp number each need ' +
      'a credential from Sasya before these figures come in by themselves.</div>';
  };

  /* ---------- the things that create records ---------- */

  A.newOrder = function (cid) {
    GE.modal('<h2>Start an order</h2>' +
      '<p class="sub">The walk-in is already a client record. This is the moment a stylist takes him on.</p>' +
      '<div class="f"><label>Who it is for</label><select id="noClient">' +
      D().clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cid ? ' selected' : '') +
        '>' + esc(c.name) + ' · ' + esc(famName(c.family)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="two"><div class="f"><label>Type of order</label><select id="noType">' +
      '<option value="">Not decided yet</option>' +
      GE.ORDER_TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Which stylist</label><select id="noStylist">' +
      D().people.filter(function (p) { return p.role === 'Stylist' || p.role === 'Salesperson'; })
        .map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="two"><div class="f"><label>How he found us</label><select id="noSrc">' +
      GE.SOURCES.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>What it might be worth</label><input type="number" id="noEst" value="150000"></div></div>' +
      '<div class="two"><div class="f"><label>The occasion</label><input id="noEvent" placeholder="Wedding"></div>' +
      '<div class="f"><label>When it is</label><input type="date" id="noEventAt"></div></div>' +
      '<div class="f"><label>What was said</label><textarea id="noNote" rows="2"></textarea></div>' +
      '<button class="btn gold" data-act="saveOrder">Put him on the showroom</button>');
  };
  A.saveOrder = function () {
    var cid = document.getElementById('noClient').value, c = one(D().clients, cid);
    var type = document.getElementById('noType').value;
    var id = 'O-' + (1053 + D().orders.length);
    D().orders.push({ id: id, client: cid, family: c.family,
      vertical: type.indexOf('Third-party') === 0 ? 'designer' : 'in-house', type: type,
      stage: 'Stylist', value: 0, cuts: [],
      estimate: Number(document.getElementById('noEst').value) || 0,
      source: document.getElementById('noSrc').value,
      salesperson: GE.me().role === 'Salesperson' ? GE.me().id : c.salesperson,
      stylist: document.getElementById('noStylist').value,
      designer: type.indexOf('Third-party') === 0 ? D().designers[0].id : '',
      booked: GE.TODAY, advance_at: '',
      event: document.getElementById('noEvent').value, event_date: document.getElementById('noEventAt').value,
      delivery: '', trial: '', note: document.getElementById('noNote').value,
      history: [{ stage: 'Stylist', by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5) }] });
    GE.save(); GE.closeModal(); GE.go('#/showroom'); A.openOrder(id);
    GE.toast(id + ' is on the showroom at Stylist. The Doorman chases it if it goes quiet for five days.');
  };

  A.newClient = function () {
    GE.modal('<h2>Add a client</h2><p class="sub">One person. The household is a link on his record, not a merged one.</p>' +
      '<div class="two"><div class="f"><label>Name</label><input id="ncName"></div>' +
      '<div class="f"><label>Mobile</label><input id="ncPhone" placeholder="+91 "></div></div>' +
      '<div class="two"><div class="f"><label>Household</label><select id="ncFam">' +
      D().families.map(function (f) { return '<option value="' + f.id + '">' + esc(f.name) + ', ' + esc(f.area) + '</option>'; }).join('') +
      '<option value="new">A new household</option></select></div>' +
      '<div class="f"><label>Who he is in it</label><input id="ncRel" placeholder="Son, the groom"></div></div>' +
      '<div class="two"><div class="f"><label>How he found us</label><select id="ncSrc">' +
      GE.SOURCES.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Birthday</label><input type="date" id="ncDob"></div></div>' +
      '<div class="f"><label>Note</label><textarea id="ncNote" rows="2" placeholder="Walked in at four, asking about a bandhgala."></textarea></div>' +
      '<button class="btn gold" data-act="saveClient">Add him</button>');
  };
  A.saveClient = function () {
    var name = document.getElementById('ncName').value.trim();
    if (!name) { GE.toast('A name first.'); return; }
    var fam = document.getElementById('ncFam').value;
    if (fam === 'new') {
      fam = GE.uid('F-');
      D().families.push({ id: fam, name: name.split(' ').slice(-1)[0], area: '', note: '' });
    }
    var id = GE.uid('C-');
    D().clients.push({ id: id, family: fam, name: name, relation: document.getElementById('ncRel').value,
      phone: document.getElementById('ncPhone').value, email: '', dob: document.getElementById('ncDob').value,
      anniversary: '', source: document.getElementById('ncSrc').value,
      stylist: 'p-farhan', salesperson: GE.me().id, note: document.getElementById('ncNote').value });
    GE.save(); GE.closeModal(); GE.go('#/clients'); A.openClient(id);
    GE.toast('Added. His measurements are his own, and the household is on his record.');
  };

  A.addGarment = function (oid) {
    var o = one(D().orders, oid);
    GE.modal('<h2>Add a garment to ' + esc(oid) + '</h2>' +
      '<div class="two"><div class="f"><label>What it is</label><select id="agKind">' +
      GE.KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Made how</label><select id="agMake">' +
      '<option value="custom">Custom, to his measurements</option>' +
      '<option value="readymade">Readymade, altered here</option></select></div></div>' +
      (o.vertical === 'in-house' ?
      '<div class="two"><div class="f"><label>Which master</label><select id="agMaster"><option value="">Nobody yet</option>' +
      by(D().people, 'role', 'Master').map(function (p) {
        return '<option value="' + p.id + '">' + esc(p.name) + (p.craft ? ' · ' + esc(p.craft) : '') + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label>First fabric</label><select id="agFab"><option value="">None yet</option>' +
      D().fabrics.map(function (f) {
        return '<option value="' + f.id + '">' + esc(f.brand + ' ' + f.colour) + ', ' +
          GE.stockOf(f.id).hand.toFixed(1) + ' m left</option>'; }).join('') + '</select>' +
      '<div class="hint">More can be added on the garment itself: lining, contrast, whatever it takes.</div></div></div>' +
      '<div class="two"><div class="f"><label>Metres</label><input type="number" step="0.1" id="agM" value="3"></div>' +
      '<div class="f"><label>Back by</label><input type="date" id="agDue"></div></div>' :
      '<div class="f"><label>Back from the designer by</label><input type="date" id="agDue"></div>') +
      '<div class="f"><label>Note for whoever makes it</label><textarea id="agNote" rows="2"></textarea></div>' +
      '<button class="btn gold" data-act="saveGarment" data-id="' + esc(oid) + '">Add it</button>');
  };
  A.saveGarment = function (oid) {
    var o = one(D().orders, oid);
    var el = function (i) { return document.getElementById(i); };
    var first = o.vertical === 'designer' ? 'Order confirmed' : 'Not started';
    var fabs = [];
    if (el('agFab') && el('agFab').value)
      fabs.push({ fabric: el('agFab').value, metres: Number(el('agM').value) || 0 });
    D().garments.push({ id: GE.uid('G-'), order: oid, kind: el('agKind').value,
      make: el('agMake').value, stage: first,
      master: el('agMaster') ? el('agMaster').value : '',
      fabrics: fabs,
      due: el('agDue').value, designer: o.vertical === 'designer' ? o.designer : '',
      note: el('agNote').value, samples: [], designform: [],
      history: [{ stage: first, by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5) }] });
    GE.save(); GE.closeModal(); A.openOrder(oid);
    GE.toast('Added. It has its own stage, its own fabric and its own date from here on.');
  };

  A.newFollow = function (oid) {
    GE.modal('<h2>Book a follow-up</h2>' +
      '<div class="two"><div class="f"><label>When</label><input type="date" id="fuAt" value="' + GE.TODAY + '"></div>' +
      '<div class="f"><label>How</label><select id="fuMethod">' +
      GE.FOLLOW_METHODS.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="f"><label>What for</label><textarea id="fuNote" rows="2"></textarea></div>' +
      '<button class="btn gold" data-act="saveFollow" data-id="' + esc(oid) + '">Book it</button>');
  };
  A.saveFollow = function (oid) {
    var o = one(D().orders, oid);
    D().follows.push({ id: GE.uid('FU-'), order: oid, client: o.client,
      at: document.getElementById('fuAt').value, method: document.getElementById('fuMethod').value,
      owner: GE.me().id, note: document.getElementById('fuNote').value, done: false, outcome: '' });
    GE.save(); GE.closeModal(); A.openOrder(oid);
    GE.toast('Booked.');
  };
  A.closeFollow = function (id) {
    var f = one(D().follows, id), o = one(D().orders, f.order);
    GE.modal('<h2>Update the follow-up</h2>' +
      '<p class="sub">' + d(f.at) + ', ' + esc(f.method) + ', on ' + f.order + '</p>' +
      '<div class="f"><label>What happened</label><textarea id="cfNote" rows="3" placeholder="He confirmed the trial for 22 November."></textarea></div>' +
      '<div class="f"><label>How it went</label><select id="cfOutcome">' +
      ['Spoke, interested','Spoke, needs time','No answer','Ready to sign','Not happening'].map(function (x) {
        return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="two"><div class="f"><label>Book the next one</label>' +
      '<input type="date" id="cfNext" value="' + GE.TODAY + '"></div>' +
      '<div class="f"><label>How</label><select id="cfNextM">' +
      GE.FOLLOW_METHODS.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="f"><label>Or move the order on</label><select id="cfStage">' +
      '<option value="">Leave it at ' + esc(o.stage) + '</option>' +
      GE.SELL.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label><input type="checkbox" id="cfDone" checked> Mark this follow-up done</label></div>' +
      '<button class="btn gold" data-act="saveCloseFollow" data-id="' + id + '">Save it</button>' +
      '<p class="hint">A bare Done loses the one thing worth keeping: what he actually said.</p>');
  };
  A.saveCloseFollow = function (id) {
    var f = one(D().follows, id);
    var note = document.getElementById('cfNote').value.trim();
    if (!note) { GE.toast('Write what happened. That is the point of the pop-up.'); return; }
    f.note = f.note + (f.note ? ' → ' : '') + note;
    f.outcome = document.getElementById('cfOutcome').value;
    f.done = document.getElementById('cfDone').checked;
    var next = document.getElementById('cfNext').value;
    if (next && next !== f.at) D().follows.push({ id: GE.uid('FU-'), order: f.order, client: f.client,
      at: next, method: document.getElementById('cfNextM').value, owner: GE.me().id,
      note: 'Next step after: ' + note, done: false, outcome: '' });
    var st = document.getElementById('cfStage').value;
    if (st) GE.moveOrder(f.order, st);
    GE.addComm('order', f.order, { at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5),
      source: f.method === 'Phone call' ? 'Call' : f.method, who: GE.me().id, note: note, docs: [] });
    GE.save(); GE.closeModal(); A.openOrder(f.order);
    GE.toast('Saved, logged as a communication' + (st ? ', and the order moved to ' + st : '') + '.');
  };

  A.newPerson = function () {
    GE.modal('<h2>Add somebody</h2>' +
      '<div class="two"><div class="f"><label>Name</label><input id="npName"></div>' +
      '<div class="f"><label>Role</label><select id="npRole">' +
      Object.keys(GE.ROLES).map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="f"><label>Reports to</label><select id="npRep">' +
      D().people.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') +
      '</select></div><div class="f"><label>Mobile</label><input id="npPhone" placeholder="+91 "></div></div>' +
      '<div class="f"><label>Login name</label><input id="npLogin"></div>' +
      '<p class="hint">The password is issued by the owner, never set here and never shown on a screen.</p>' +
      '<button class="btn gold" data-act="savePerson">Add them</button>');
  };
  A.savePerson = function () {
    var g = function (i) { return document.getElementById(i).value; };
    if (!g('npName')) { GE.toast('A name first.'); return; }
    D().people.push({ id: GE.uid('p-'), name: g('npName'), role: g('npRole'), login: g('npLogin'),
      phone: g('npPhone'), reports: g('npRep'), lines: ['In-house'] });
    GE.save(); GE.closeModal(); GE.go('#/team');
    GE.toast('Added. What they can reach comes from their role.');
  };

})();
