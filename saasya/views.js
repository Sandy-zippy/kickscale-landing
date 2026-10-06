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
  function famName(fid) { var f = one(D().families, fid); return f ? f.name + (f.area ? ', ' + f.area : '') : '—'; }
  /* a client with no household is a household of one: never pooled with other clients who have none */
  function famOrdersOf(c) {
    if (!c.family) return by(D().orders, 'client', c.id);
    var ids = by(D().clients, 'family', c.family).map(function (k) { return k.id; });
    return D().orders.filter(function (o) { return ids.indexOf(o.client) > -1; });
  }
  GE.famOrdersOf = famOrdersOf;
  /* every mobile in the app: a country-code dropdown and the number, read back as one */
  function phoneField(id, label, value) {
    var m = /^(\+\d{1,4})\s*(.*)$/.exec(value || ''), code = m ? m[1] : '+91', rest = m ? m[2] : '';
    return '<div class="f"><label>' + (label || 'Mobile') + '</label><div class="phone">' +
      '<select id="' + id + 'Cc" aria-label="Country code">' + GE.COUNTRY_CODES.map(function (c) {
        return '<option value="' + c[0] + '"' + (c[0] === code ? ' selected' : '') + '>' + c[0] + ' ' + c[1] + '</option>'; }).join('') + '</select>' +
      '<input id="' + id + '" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="98300 12345" value="' + esc(rest) + '"></div>' +
      '<div class="hint">Pick the country, then the number without the code.</div></div>';
  }
  function readPhone(id, need) {
    var code = document.getElementById(id + 'Cc').value, n = document.getElementById(id).value;
    if (!String(n).replace(/\D/g, '')) return need ? null : '';
    if (!GE.phoneOk(code, n)) return null;
    return GE.phoneJoin(code, n);
  }
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
    var oid = m.order && m.order.id;
    var h = '<table class="mon"><tbody>' +
      '<tr><td>Order value <span class="sub">the garments and other items, before tax</span></td>' +
      '<td>' + rupees(m.value) + '</td></tr>';
    (m.adds || []).forEach(function (c, i) {
      h += '<tr class="add"><td>Add: ' + esc(c.label) +
        (editable ? ' <button class="mini" data-act="dropAdd" data-id="' + oid + '|' + i + '" title="Take this charge off">&times;</button>' : '') +
        '</td><td>+ ' + rupees(c.amount) + '</td></tr>';
    });
    (m.cuts || []).forEach(function (c, i) {
      h += '<tr class="cut"><td>Less: ' + esc(c.label) +
        (editable ? ' <button class="mini" data-act="dropCut" data-id="' + oid + '|' + i +
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
    if (editable) h += '<div style="margin-top:12px"><button class="mini" data-act="addCharge" data-id="' + oid + '">Add a charge</button> ' +
      '<button class="mini" data-act="addCut" data-id="' + oid + '">Add a deduction</button> <span class="hint">charges (delivery, porter, extra design) go on, deductions come off, both before GST. ' +
      'Neither has a payment mode. A payment does.</span></div>';
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
      var fam = famOrdersOf(c);
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
    var kin = c.family ? by(D().clients, 'family', c.family).filter(function (x) { return x.id !== c.id; }) : [];
    var orders = by(D().orders, 'client', c.id);
    var running = orders.filter(function (o) { return o.stage !== 'Delivered' && o.stage !== 'Lost'; });
    var famOrders = famOrdersOf(c);
    var sets = by(D().meas, 'client', c.id);
    var mine = sum(orders, function (o) { return o.value; });
    var pending = sum(orders, function (o) { return Math.max(0, GE.orderMoney(o.id).pending); });

    var h = '<h1>' + esc(c.name) + '</h1>' +
      '<p class="sub">' + esc(c.relation || '') + (c.relation ? ' · ' : '') +
      esc(fam ? famName(fam.id) + ' · ' : '') + esc(c.phone) + '</p>';

    h += '<div class="kpis">' +
      kpi(GE.moneyShort(mine), 'His revenue to date', orders.length + ' orders') +
      kpi(GE.moneyShort(sum(famOrders, function (o) { return o.value; })), 'The household together',
          famOrders.length + ' orders across ' + (kin.length + 1) + ' people') +
      kpi(running.length, 'Running right now', running.length ? 'see them below' : 'nothing open') +
      kpi(GE.moneyShort(pending), 'Still to come in', 'across his open orders') + '</div>';

    h += '<div class="card"><div class="three">' +
      fld('Phone', c.phone) + fld('Email', c.email || '—') + fld('Source', c.source) +
      '<div class="f"><label>Birthday</label><input type="date" value="' + (c.dob || '') + '" data-change="saveClientField" data-id="' + c.id + '|dob"></div>' +
      '<div class="f"><label>Anniversary</label><input type="date" value="' + (c.anniversary || '') + '" data-change="saveClientField" data-id="' + c.id + '|anniversary"></div>' +
      fld('Stylist', pname(c.stylist)) +
      fld('Occasion', c.event || '—') + fld('Date of the occasion', c.event_date ? d(c.event_date) : '—') + fld('Delivery wanted by', c.delivery_wanted ? d(c.delivery_wanted) : '—') +
      '</div><div class="f"><label>Note</label><textarea rows="2" data-change="saveClientNote" data-id="' +
      c.id + '">' + esc(c.note) + '</textarea></div></div>';

    /* the household, a segment inside the client, not a screen of its own */
    h += '<div class="card" data-sec="household"><div class="cardhead"><div><h3>Household</h3>' +
      '<p class="sub">' + esc(fam ? fam.name + (fam.area ? ' of ' + fam.area : '') : 'Not part of a household yet') +
      (fam && fam.note ? ' · ' + esc(fam.note) : '') + '</p></div>' +
      '<div style="text-align:right"><b>' + GE.moneyShort(sum(famOrders, function (o) { return o.value; })) +
      '</b><div class="sub">lifetime, the family</div></div></div>';
    h += '<div class="two"><div class="f"><label>' + (fam ? 'Household' : 'Add him to a household') + '</label><select data-change="setHousehold" data-id="' + c.id + '">' +
      '<option value="">' + (fam ? 'Not in a household' : 'Choose a household') + '</option>' +
      D().families.map(function (f) { return '<option value="' + f.id + '"' + (f.id === c.family ? ' selected' : '') + '>' + esc(famName(f.id)) + '</option>'; }).join('') +
      '<option value="__new">+ Add a new household</option></select></div>' +
      '<div class="f"><label>Who he is in it</label><input value="' + esc(c.relation || '') + '" placeholder="Son, the groom" data-change="saveClientField" data-id="' + c.id + '|relation"></div></div>';
    if (fam && !kin.length) h += '<p class="sub">Nobody else on this household yet.</p>';
    else if (fam) {
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
    if (GE.can('settings')) h += '<div class="danger"><button class="mini bad" data-act="delClient" data-id="' + c.id + '">Delete this client</button>' +
      '<span class="hint">Takes every opportunity of his with it.</span></div>';
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
  A.saveClientField = function (id, el) {
    var p = id.split('|'), c = one(D().clients, p[0]); if (!c) return;
    c[p[1]] = el.value; GE.save(); GE.toast('Saved.');
  };
  A.setHousehold = function (id, el) {
    var c = one(D().clients, id); if (!c) return;
    if (el.value === '__new') { A.newHousehold(id); el.value = c.family || ''; return; }
    linkHousehold(c, el.value);
    GE.toast(el.value ? c.name + ' is now in the ' + famName(el.value) + ' household.' : c.name + ' is not in a household now.');
  };
  function linkHousehold(c, fid) {
    c.family = fid;
    by(D().orders, 'client', c.id).forEach(function (o) { o.family = fid; });   /* his orders move with him */
    GE.save(); A.openClient(c.id);
  }
  A.newHousehold = function (cid) {
    var c = one(D().clients, cid);
    GE.modal('<h2>A new household</h2><p class="sub">' + esc(c.name) + ' goes into it. Others can be added from their own records.</p>' +
      '<div class="two"><div class="f"><label>Household name</label><input id="nhName" value="' + esc(c.name.split(' ').slice(-1)[0]) + '"></div>' +
      '<div class="f"><label>Area</label><input id="nhArea" placeholder="Alipore"></div></div>' +
      '<div class="f"><label>Who he is in it</label><input id="nhRel" placeholder="Son, the groom" value="' + esc(c.relation || '') + '"></div>' +
      '<button class="btn gold" data-act="saveHousehold" data-id="' + cid + '">Add the household</button>');
  };
  A.saveHousehold = function (cid) {
    var c = one(D().clients, cid), name = document.getElementById('nhName').value.trim();
    if (!name) { GE.toast('Give the household a name.'); return; }
    var fid = GE.uid('F-');
    D().families.push({ id: fid, name: name, area: document.getElementById('nhArea').value.trim(), note: '' });
    c.relation = document.getElementById('nhRel').value;
    GE.closeModal(); linkHousehold(c, fid);
    GE.toast('The ' + name + ' household is added, with ' + c.name + ' in it.');
  };
  /* deleting: say exactly what goes before anything goes */
  function n(x, one1, many) { return x + ' ' + (x === 1 ? one1 : many); }
  A.delOrder = function (id) {
    if (!GE.can('settings')) { GE.toast('Only the owner or the BDM can delete an opportunity.'); return; }
    var o = one(D().orders, id), x = GE.orderImpact(id);
    GE.modal('<h2>Delete ' + o.id + '?</h2><p class="sub">' + esc(cname(o.client)) + (o.event ? ', ' + esc(o.event) : '') + '. This cannot be undone.</p>' +
      '<div class="note bad"><b>Everything on this opportunity goes with it:</b><ul class="gone">' +
      '<li>' + n(x.garments.length, 'outfit', 'outfits') + (x.garments.length ? ', taken off Our operations and At the designers' : '') + '</li>' +
      '<li>' + n(x.invoices.length, 'invoice', 'invoices') + ' and ' + n(x.payins.length, 'payment', 'payments') + (x.paid ? ' (' + rupees(x.paid) + ' recorded, which leaves the accounts)' : '') + '</li>' +
      (x.payables.length ? '<li>' + n(x.payables.length, 'designer payable', 'designer payables') + '</li>' : '') +
      '<li>' + n(x.costlines.length, 'cost line', 'cost lines') + ', ' + n(x.follows.length, 'follow-up', 'follow-ups') + ', ' + n(x.comms.length, 'note', 'notes') + '</li>' +
      (o.share ? '<li>the client\'s live link stops showing the order</li>' : '') +
      '</ul></div><p class="hint">The client stays, with his measurements. Delete the client to remove him too.</p>' +
      '<button class="btn bad" data-act="delOrderYes" data-id="' + o.id + '">Delete it</button> <button class="btn alt" data-act="closemodal">Keep it</button>');
  };
  A.delOrderYes = function (id) {
    if (!GE.can('settings')) return;
    var o = one(D().orders, id); if (!o) return;
    retireShare(o);
    var x = GE.deleteOrder(id);
    GE.save(); GE.closeModal(); GE.closeDrawer(); GE.go(location.hash || '#/order');
    GE.toast(id + ' is deleted, with ' + n(x.garments.length, 'outfit', 'outfits') + ' and everything on it.');
  };
  A.delClient = function (id) {
    if (!GE.can('settings')) { GE.toast('Only the owner or the BDM can delete a client.'); return; }
    var c = one(D().clients, id), x = GE.clientImpact(id);
    GE.modal('<h2>Delete ' + esc(c.name) + '?</h2><p class="sub">' + esc(c.phone || '') + '. This cannot be undone.</p>' +
      '<div class="note bad"><b>Everything of his goes:</b><ul class="gone">' +
      '<li>' + n(x.orders.length, 'opportunity', 'opportunities') + (x.orders.length ? ' (' + x.orders.map(function (o) { return o.id; }).join(', ') + ')' : '') + '</li>' +
      '<li>' + n(x.garments, 'outfit', 'outfits') + (x.garments ? ', taken off the operations floors' : '') + '</li>' +
      '<li>' + n(x.invoices, 'invoice', 'invoices') + ' and ' + n(x.payins, 'payment', 'payments') + (x.paid ? ' (' + rupees(x.paid) + ' recorded, which leaves the accounts)' : '') + '</li>' +
      '<li>' + n(x.meas.length, 'measurement set', 'measurement sets') + ', ' + n(x.threads.length, 'inbox conversation', 'inbox conversations') + ', ' + n(x.comms.length, 'note', 'notes') + '</li>' +
      '</ul></div>' + (c.family ? '<p class="hint">The rest of his household stays.</p>' : '') +
      '<button class="btn bad" data-act="delClientYes" data-id="' + c.id + '">Delete him and all of it</button> <button class="btn alt" data-act="closemodal">Keep him</button>');
  };
  A.delClientYes = function (id) {
    if (!GE.can('settings')) return;
    var c = one(D().clients, id); if (!c) return;
    by(D().orders, 'client', id).forEach(retireShare);
    var x = GE.deleteClient(id);
    GE.save(); GE.closeModal(); GE.closeDrawer(); GE.go('#/clients');
    GE.toast(c.name + ' is deleted, with ' + n(x.orders.length, 'opportunity', 'opportunities') + ' and ' + n(x.garments, 'outfit', 'outfits') + '.');
  };
  /* a shared link stops showing a deleted order */
  function retireShare(o) {
    if (!o.share || !/^http/.test(String(location.protocol || ''))) return;
    fetch(SHARE_API + o.share.token, { method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: o.share.key, data: { deleted: true } }) }).catch(function () {});
  }
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
    var p = id.split('|'), cid = p[0], kind = p[1] || measKindFor(cid);
    var last = by(D().meas, 'client', cid).filter(function (m) { return m.kind === kind; })
                 .sort(function (a, b) { return a.at < b.at ? 1 : -1; })[0];
    var h = '<h2>A new set</h2><p class="sub">' + esc(cname(cid)) + '. The last set stays where it is.</p>' +
      '<div class="two"><div class="f"><label>Garment</label><select id="msKind" data-change="switchMeasKind" data-id="' + cid + '">' +
      GE.KINDS.map(function (k) { return '<option' + (k === kind ? ' selected' : '') + '>' + k + '</option>'; }).join('') +
      '</select></div><div class="f"><label>Why it is being taken again</label><select id="msWhy">' +
      GE.MEAS_WHY.map(function (w) { return '<option' + (last ? '' : (w === 'First set' ? ' selected' : '')) + '>' + w + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="two"><div class="f"><label>Date</label><input type="date" id="msAt" value="' + GE.localToday() + '"></div>' +
      '<div class="f"><label>Unit</label><select id="msUnit"><option>inches</option><option>centimetres</option></select></div></div>' +
      '<div class="card pad" id="msFields">' + measFields(kind, last) + '</div>' +
      '<button class="btn gold" data-act="saveMeas" data-id="' + cid + '">Save the set</button>';
    GE.modal(h);
  };
  /* the garment a new set is for, when nobody said: his first live garment with no set, else his
     first live garment, else the first kind. A kurta order opens on Kurta. */
  function measKindFor(cid) {
    var mine = D().orders.filter(function (o) { return o.client === cid && o.stage !== 'Delivered' && o.stage !== 'Lost'; });
    var kinds = [];
    mine.forEach(function (o) { garmentsOf(o.id).forEach(function (g) { if (g.make === 'custom' && kinds.indexOf(g.kind) < 0) kinds.push(g.kind); }); });
    var has = function (k) { return by(D().meas, 'client', cid).some(function (m) { return m.kind === k; }); };
    return kinds.filter(function (k) { return !has(k); })[0] || kinds[0] || GE.KINDS[0];
  }
  GE.measKindFor = measKindFor;
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
               '<span class="sub">budget ' + (GE.can('money') ? lakh(o.estimate || 0) : '•••') + '</span>') +
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
        '<td>' + (gs.length ? '<div class="gstages">' + gs.map(function (g) {
          return '<span title="' + esc(g.kind + (GE.isThird(g) ? ', at ' + dgname(g.designer) : ', our floor')) + '">' + esc(g.kind.split(' ')[0]) + ' ' + stagePill(g.stage) + '</span>'; }).join('') + '</div>' : '—') + '</td>' +
        '<td>' + stagePill(o.stage) + '</td><td>' + d(o.trial) + '</td>' +
        '<td>' + d(o.delivery) + ' ' + lateness(o) + '</td>' +
        '<td>' + esc(pname(o.salesperson)) + '</td>' +
        '<td class="num">' + (o.value ? GE.money(o.value) :
          '<span class="sub">budget ' + (GE.can('money') ? lakh(o.estimate || 0) : '•••') + '</span>') + '</td>' +
        '<td class="num">' + (o.value ? GE.money(m.pending) : '—') + '</td>' +
        '<td><button class="mini">Open it</button></td></tr>';
    });
    if (!orders.length) h += '<tr><td colspan="11" class="sub">Nothing matches that.</td></tr>';
    return h + '</tbody></table></div>';
  };

  /* ---------- one opportunity ---------- */

  /* ---- PICASSO: the garment card on the order screen (garmentCard and its CSS block only) ---- */
  function garmentCard(g, o) {
      var fl = GE.fabricsOf(g), sug = GE.garmentSuggest(g), val = GE.garmentValue(g);
      var lib = !GE.isThird(g) && sug.amount;
      var mtr = GE.metresOf(g);
      var who = g.master ? pname(g.master) : (g.designer ? dgname(g.designer) : '');
      var h = '<div class="card gcard" data-garment="' + g.id + '">' +
        '<div class="gc-head"><h4>' + esc(g.kind) + ' <span class="gc-make">' +
        (g.make === 'readymade' ? 'readymade' : 'custom') + '</span></h4>' +
        '<div class="gc-acts"><span class="gc-line">' + (GE.isThird(g) ? 'at ' + esc(dgname(g.designer)) : 'our floor') + '</span>' + stagePill(g.stage) + '<button class="mini" data-act="openGarment" data-id="' + g.id +
        '">Open</button></div></div>' +
        (g.note ? '<p class="gc-note">' + esc(g.note) + '</p>' : '') +
        '<p class="gc-meta"><span>' + (g.designer && !g.master ? 'Designer' : 'Master') + ' <b>' + (who ? esc(who) : 'not given yet') + '</b></span>' +
        '<span>Due back <b>' + d(g.due) + '</b></span>' +
        (mtr ? '<span><b>' + mtr.toFixed(1) + ' m</b> in all</span>' : '') + '</p>';
      if (g.piece) {
        h += '<div class="gc-fabs"><div class="gc-fab"><span class="gc-fname">Readymade piece: ' + esc(pieceName(g.piece)) + '</span></div></div>';
      } else if (!GE.isThird(g)) {
        h += '<div class="gc-fabs">';
        if (!fl.length) h += '<p class="gc-empty">No fabric chosen yet.</p>';
        fl.forEach(function (u, i) {
          var f = one(D().fabrics, u.fabric);
          h += '<div class="gc-fab">' + fabThumb(f) + '<span class="gc-fname">' + esc(fname(u.fabric)) + '</span>' +
            '<label class="gc-m"><input type="number" step="0.1" min="0" aria-label="Metres of ' + esc(fname(u.fabric)) + '" value="' + u.metres +
            '" data-change="setFabMetres" data-id="' + g.id + '|' + i + '"> m</label>' +
            (GE.can('cost') && f ? '<span class="gc-cost">' + rupees(f.cost * u.metres) + '</span>' : '') +
            '<button class="gc-x" aria-label="Remove this fabric" data-act="dropFab" data-id="' + g.id + '|' + i + '">&times;</button></div>';
        });
        h += '<button class="gc-link" data-act="addFab" data-id="' + g.id + '">+ Add fabric</button></div>';
      }
      if (GE.can('money')) {
        var by = g.price != null ? (g.price_by === 'agreed' ? 'as agreed' : g.price_by === 'design' ? 'the price of our design' : g.price_by === 'designer' ? 'the designer\'s price' : 'set by hand') : '';
        var why = g.price != null ? by + (lib ? '. The fabric library says ' + rupees(sug.amount) + '.' : '') : 'From the fabric library: ' + sug.why;
        h += '<div class="gval" data-gval="' + g.id + '"><div class="gc-vl"><span class="gc-lab">Value</span>' +
          '<span class="gc-why" title="' + esc(why) + '">' + (g.price != null ? by : g.piece ? 'from readymade stock' : sug.amount ? 'from fabric library' : 'no fabric chosen yet') + '</span>' +
          '<span class="gc-vacts"><button class="gc-link" data-act="setGarmentPrice" data-id="' + g.id + '">Change</button>' +
          (g.price != null && lib ? '<button class="gc-link" title="' + rupees(sug.amount) + '" data-act="useLibraryPrice" data-id="' + g.id + '">Use library price</button>' : '') +
          '</span></div><b class="gc-amt">' + rupees(val) + '</b></div>';
      }
      function up(key, label) {
        var list = g[key] || [], s = '<div class="gc-up"><div class="gc-uph"><span>' + label + ' <span class="gc-n">' + list.length + '</span></span>' +
          '<button class="gc-link" data-act="addUpload" data-id="' + g.id + '|' + key + '">Upload</button></div>';
        list.forEach(function (f, i) {
          s += '<div class="gc-file"><span class="gc-fn">' + esc(f.name) + ' <span class="gc-sz">' + esc(f.size) + '</span></span>' +
            '<button class="gc-link" data-act="docAct" data-id="open|' + esc(f.name) + '">Open</button>' +
            '<button class="gc-x" aria-label="Remove ' + esc(f.name) + '" data-act="dropUpload" data-id="' + g.id + '|' + key + '|' + i + '">&times;</button></div>';
        });
        return s + '</div>';
      }
      h += '<div class="gc-ups">' + up('samples', 'Sample outfit') + up('designform', 'Design form') + '</div>';
      h += '</div>';
      return h;
  }
  /* ---- end garment card ---- */

  A.openOrder = function (id) {
    var o = one(D().orders, id); if (!o) return;
    var gs = garmentsOf(o.id);
    var m = GE.orderMoney(o.id), mg = GE.marginOf(o.id), cost = GE.costOf(o.id);
    var own = GE.OUR_DESIGN_TYPES.indexOf(o.type) > -1, opsRole = ['Owner', 'BDM', 'Operations manager'].indexOf(GE.me().role) > -1;

    var h = '<div class="dstick"><h1>' + o.id + ' · ' + esc(cname(o.client)) + '</h1>' +
      '<label class="dstage"><span>Stage</span><select data-change="pickOrderStage" data-id="' + o.id + '" aria-label="Stage">' +
        GE.SELL.map(function (st, n) { return '<option value="' + st + '"' + (st === o.stage ? ' selected' : '') + '>' + (n + 1) + '. ' + st + '</option>'; }).join('') +
      '</select></label></div>' +
      '<p class="sub">' + esc(o.type || 'type not set yet') +
      (o.vertical === 'designer' ? ', at ' + esc(dgname(o.designer)) : '') +
      ' · ' + esc(o.event || 'no event') + (o.event_date ? ' on ' + d(o.event_date) : '') +
      ' · sold by ' + esc(pname(o.salesperson)) + ', styled by ' + esc(pname(o.stylist)) + '</p>';

    h += '<div class="kpis">' +
      kpi(GE.moneyShort(m.value || o.estimate || 0), m.value ? 'Order value' : 'Budget',
          m.value ? 'the garments and other items, before tax' : 'no garment priced yet') +
      kpi(GE.moneyShort(m.pending), 'Pending at delivery', 'of ' + (GE.can('money') ? rupees(m.total) : '•••') + ' payable') +
      kpi(gs.length, 'Garments', 'each with its own master and date') +
      kpi(d(o.delivery), 'Delivery promised', o.trial ? 'trial ' + d(o.trial) : 'no trial set') +
      (GE.can('cost') ? kpi(GE.moneyShort(cost.total), 'Cost so far', 'fabric plus every line') : '') +
      '</div>';

    /* 1. what kind of order */
    h += '<div class="card" data-sec="kind"><div class="cardhead"><h3>1 · What kind of order</h3>' +
      '<span class="sub">ours or theirs, readymade or made to measure</span></div>' +
      '<div class="two"><div class="f"><label>Type of order</label>' +
      '<select data-change="setOrderType" data-id="' + o.id + '">' +
      '<option value="">Not chosen yet</option>' +
      GE.ORDER_TYPES.map(function (t) {
        return '<option' + (t === o.type ? ' selected' : '') + '>' + t + '</option>'; }).join('') +
      (o.type && GE.ORDER_TYPES.indexOf(o.type) < 0 ? '<option selected>' + esc(o.type) + '</option>' : '') +
      '</select></div>' +
      (o.vertical === 'designer' ?
        '<div class="f"><label>Which designer</label><select data-change="setDesigner" data-id="' + o.id + '">' +
        D().designers.map(function (g) {
          return '<option value="' + g.id + '"' + (g.id === o.designer ? ' selected' : '') + '>' +
            esc(g.name) + ', ' + g.margin + '% to us</option>'; }).join('') + '</select></div>'
      : own ?
        '<div class="f"><label>Made from one of our designs</label>' +
        '<select data-change="setFromDesign" data-id="' + o.id + '">' +
        '<option value="">A fresh design</option>' +
        D().readymade.filter(function (r) { return r.owner === 'Sasya'; }).map(function (r) {
          return '<option value="' + r.id + '"' + (r.id === o.from_design ? ' selected' : '') + '>' +
            esc(r.code + ' · ' + r.name + ' · ' + rupees(r.price)) + '</option>'; }).join('') +
        '</select><div class="hint">Picking one adds it as a garment at its price. Measurements are still taken.</div></div>'
      : '<div class="f"><label>&nbsp;</label><div class="sub">Choose the type first.</div></div>') +
      '</div></div>';

    /* 2. occasion, dates and stage */
    h += '<div class="card" data-sec="stage"><div class="cardhead"><h3>2 · Occasion, dates and stage</h3>' +
      '<span class="sub">set here, in the showroom, not on the floor</span></div>' +
      '<div class="three">' +
      '<div class="f"><label>Occasion</label>' + occasionSelect('ooEvent', o.event, ' data-change="setOrderField" data-id="' + o.id + '|event"') + '</div>' +
      '<div class="f"><label>When is the event</label><input type="date" value="' + (o.event_date || '') +
        '" data-change="setOrderField" data-id="' + o.id + '|event_date"></div>' +
      '<div class="f"><label>How many outfits</label><input type="number" min="0" value="' + (o.outfits || '') +
        '" data-change="setOrderField" data-id="' + o.id + '|outfits"><div class="hint">' + gs.length + ' added so far</div></div>' +
      '</div><div class="three">' +
      '<div class="f"><label>Trial date</label><input type="date" value="' + (o.trial || '') +
        '" data-change="setOrderDate" data-id="' + o.id + '|trial"></div>' +
      '<div class="f"><label>Delivery date</label><input type="date" value="' + (o.delivery || '') +
        '" data-change="setOrderDate" data-id="' + o.id + '|delivery"></div>' +
      (o.vertical === 'designer' ?
      '<div class="f"><label>Date back with us</label><input type="date" value="' +
        (o.expected_in || '') + '" data-change="setOrderDate" data-id="' + o.id + '|expected_in"></div>' : '<div></div>') +
      '</div>' +
      '<div class="two">' + (GE.me().role === 'BDM' ?
        '<div class="f"><label>Stylist (owner of the order)</label><select data-change="setOrderStylist" data-id="' + o.id + '">' +
        stylists().map(function (p) { return '<option value="' + p.id + '"' + (p.id === o.stylist ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('') +
        '</select><div class="hint">Only the BDM can change the stylist.</div></div>' : fld('Stylist (owner of the order)', pname(o.stylist))) +
      '<div class="f"><label>Operations person on it</label>' + (opsRole ?
        '<select data-change="setOrderOps" data-id="' + o.id + '"><option value="">Nobody yet</option>' + opsPeople().map(function (p) {
          return '<option value="' + p.id + '"' + (p.id === o.ops ? ' selected' : '') + '>' + esc(p.name) + ' · ' + esc(p.role) + '</option>'; }).join('') + '</select>'
        : '<div>' + esc(o.ops ? pname(o.ops) : 'Not given yet') + '</div>') + '</div></div></div>';

    /* 3. the garments, each with its value, and anything else being added */
    h += '<div class="card" data-sec="garments"><div class="cardhead"><h3>3 · The garments</h3><div>' +
      '<button class="mini" data-act="addGarment" data-id="' + o.id + '">Add a garment</button> ' +
      '<button class="mini" data-act="addExtra" data-id="' + o.id + '">Add something else</button></div></div>';
    gs.forEach(function (g) { h += garmentCard(g, o); });
    (o.extras || []).forEach(function (x, i) {
      h += '<div class="card gcard" data-extra="' + i + '"><div class="cardhead"><div><h4>' + esc(x.label) + ' <span class="sub">something else</span></h4>' +
        '<p class="sub">' + esc(x.note || '') + (x.due ? ' · wanted by ' + d(x.due) : '') + '</p></div>' +
        '<div>' + (GE.can('money') ? '<b>' + rupees(x.amount) + '</b> ' : '') + '<button class="mini" data-act="dropExtra" data-id="' + o.id + '|' + i + '" title="Take it off">&times;</button></div></div></div>';
    });
    if (!gs.length && !(o.extras || []).length) h += '<p class="sub">No garments yet. Add each garment: the outfit, the fabric, and its value follows from the fabric library.</p>';
    if (GE.can('money') && m.lines.listed) h += '<p class="gsum">Garments ' + rupees(m.lines.garmentsTotal) +
      ((o.extras || []).length ? ' + other items ' + rupees(m.lines.extrasTotal) : '') + ' = <b>order value ' + rupees(m.value) + '</b></p>';
    h += '</div>';

    /* 4. the money: from the garments, plus charges, less deductions, GST on top, payments, pending */
    if (GE.can('money')) {
      h += '<div class="card" data-sec="money"><div class="cardhead"><h3>4 · The money</h3>' +
        '<div><button class="mini" data-act="orderPdf" data-id="' + o.id + '">Download the order PDF</button> ' +
        '<button class="mini" data-act="shareOrder" data-id="' + o.id + '">' + (o.share ? 'The client\'s live link' : 'Share the order link') + '</button></div></div>' +
        moneyBlock(m, true) +
        '<div style="margin-top:14px" class="cardhead"><h4>5 · Payments</h4>' +
        '<button class="btn gold" data-act="orderPay" data-id="' + o.id + '">Record a payment</button></div>';
      var invs = by(D().invoices, 'order', o.id);
      h += '<table><thead><tr><th>When</th><th>What</th><th class="num">Amount</th><th>How</th><th>Reference</th><th>Invoice</th><th></th></tr></thead><tbody>';
      var rows = 0;
      invs.forEach(function (i) {
        by(D().payins, 'invoice', i.id).forEach(function (p) {
          rows++;
          h += '<tr><td>' + d(p.at) + '</td><td>' + esc(p.kind || i.kind) + '</td><td class="num">' + rupees(p.amount) + '</td>' +
            '<td>' + esc(p.method) + '</td><td class="sub">' + esc(p.ref || '') + (p.proof ? ' <button class="mini" data-act="seeProof" data-id="' + p.id + '">Photo</button>' : '') + '</td><td><b>' + i.id + '</b></td>' +
            '<td><button class="mini" data-act="invoicePdf" data-id="' + i.id + '">Invoice PDF</button></td></tr>';
        });
      });
      if (!rows) h += '<tr><td colspan="7" class="sub">Nothing paid yet. Record the advance: its mode is kept, and its invoice is made from it.</td></tr>';
      h += '</tbody></table><p class="hint">Record a payment, and its invoice is made from it, ready as a PDF. What is left shows as pending.</p></div>';
    }

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
        '<div>' + (s ? '<button class="mini" data-act="openMeas" data-id="' + o.client + '|' + esc(kind) + '">See it</button>'
          : '<button class="mini" data-act="newMeas" data-id="' + o.client + '|' + esc(kind) + '">Take the ' + esc(kind.split(' / ')[0].toLowerCase()) + ' set</button>') + '</div></div>';
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
      gs.forEach(function (g) {
        var r = g.piece && one(D().readymade, g.piece);
        if (r && r.cost_to_make) h += '<tr><td>Readymade piece</td><td>' + esc(pieceName(g.piece)) + '</td><td class="sub">from the readymade stock</td><td class="num">' + GE.money(r.cost_to_make) + '</td></tr>';
      });
      cost.lines.forEach(function (l) {
        var lg = l.garment && one(D().garments, l.garment);
        h += '<tr><td>' + esc(l.kind) + '</td><td>' + (lg ? esc(lg.kind) + ': ' : '') + esc(l.label) + (l.person ? ' <span class="sub">· ' + esc(pname(l.person)) + '</span>' : '') + '</td><td>' + esc(pname(l.by)) +
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

    if (GE.can('settings')) h += '<div class="danger"><button class="mini bad" data-act="delOrder" data-id="' + o.id + '">Delete this opportunity</button>' +
      '<span class="hint">Takes its outfits off the operations floors with it.</span></div>';
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
    if (GE.OUR_DESIGN_TYPES.indexOf(o.type) < 0) o.from_design = '';   /* our own designs belong to our own orders only */
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
    if (r) {   /* our design becomes a garment on the order, at its price */
      D().garments.push({ id: GE.uid('G-'), order: o.id, kind: r.kind, make: 'custom', stage: 'Not started', master: '', fabrics: [],
        due: o.delivery || '', designer: '', note: 'From our design ' + r.code + ', ' + r.name, price: r.price, price_by: 'design', samples: [], designform: [],
        history: [{ stage: 'Not started', by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5) }] });
      GE.toast(r.code + ' added as a garment at ' + rupees(r.price) + '. Measurements are still taken.');
    }
    GE.save(); A.openOrder(id);
  };
  function pieceName(id) { var r = one(D().readymade, id); return r ? (r.code ? r.code + ' · ' : '') + r.name + (r.size ? ', size ' + r.size : '') : ''; }
  GE.pieceName = pieceName;
  /* an order's value in one line: its garments of that line (an order not yet listed counts whole, by its type) */
  function lineValue(o, line) {
    var gs = garmentsOf(o.id);
    if (!gs.length) return (o.vertical === line) ? (Number(o.value) || 0) : 0;
    return sum(gs.filter(function (g) { return (GE.isThird(g) ? 'designer' : 'in-house') === line; }), GE.garmentValue);
  }
  GE.lineValue = lineValue;
  /* who can be the operations person on an order */
  function opsPeople() { return D().people.filter(function (p) { return ['Operations manager', 'Owner', 'BDM'].indexOf(p.role) > -1; }); }
  A.setOrderOps = function (id, el) {
    var o = one(D().orders, id); o.ops = el.value;
    (o.history = o.history || []).push({ stage: o.stage, by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5), note: 'Operations person: ' + (el.value ? pname(el.value) : 'nobody') });
    GE.save(); GE.toast(el.value ? pname(el.value) + ' is on this order for operations.' : 'Nobody from operations on it now.');
  };
  /* something other than a garment: a brooch, a stole, anything, with a note, a date and its price */
  A.addExtra = function (id) {
    GE.modal('<h2>Add something else</h2><p class="sub">Anything that is not a garment: a brooch, a pocket square, a stole, a turban. Its price is typed here.</p>' +
      '<div class="two"><div class="f"><label>What it is</label><input id="xLabel" placeholder="Brooch"></div>' +
      '<div class="f"><label>Price</label><input type="number" id="xAmt"></div></div>' +
      '<div class="two"><div class="f"><label>Wanted by</label><input type="date" id="xDue"></div>' +
      '<div class="f"><label>Note</label><input id="xNote" placeholder="Antique gold, to go on the sherwani"></div></div>' +
      '<button class="btn gold" data-act="saveExtra" data-id="' + id + '">Add it</button>');
  };
  A.saveExtra = function (id) {
    var o = one(D().orders, id), lab = document.getElementById('xLabel').value.trim(), amt = Number(document.getElementById('xAmt').value) || 0;
    if (!lab) { GE.toast('Say what it is.'); return; }
    o.extras = o.extras || [];
    o.extras.push({ id: GE.uid('X-'), label: lab, amount: amt, due: document.getElementById('xDue').value, note: document.getElementById('xNote').value });
    GE.save(); GE.closeModal(); A.openOrder(id);
    GE.toast(lab + ' added. The order value is now ' + rupees(GE.orderMoney(id).value) + '.');
  };
  A.dropExtra = function (id) {
    var p = id.split('|'), o = one(D().orders, p[0]);
    o.extras.splice(Number(p[1]), 1); GE.save(); A.openOrder(p[0]);
    GE.toast('Taken off. The order value moved with it.');
  };
  /* a charge added on top: delivery, porter, extra design work */
  A.addCharge = function (id) {
    GE.modal('<h2>Add a charge</h2><p class="sub">Added to the order value before GST.</p>' +
      '<div class="two"><div class="f"><label>What kind</label><select id="chLabel">' +
      GE.ADD_LABELS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>How much</label><input type="number" id="chAmt"></div></div>' +
      '<div class="f"><label>Call it something else, if you like</label><input id="chOwn" placeholder="Delivery to Alipore"></div>' +
      '<button class="btn gold" data-act="saveCharge" data-id="' + id + '">Add it</button>');
  };
  A.saveCharge = function (id) {
    var o = one(D().orders, id), amt = Number(document.getElementById('chAmt').value) || 0;
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    o.adds = o.adds || [];
    o.adds.push({ label: document.getElementById('chOwn').value.trim() || document.getElementById('chLabel').value, amount: amt });
    GE.save(); GE.closeModal(); A.openOrder(id);
    var m = GE.orderMoney(id);
    GE.toast('Net ' + rupees(m.net) + ', GST ' + rupees(m.gst) + ', payable ' + rupees(m.total) + ', pending ' + rupees(m.pending) + '.');
  };
  A.dropAdd = function (id) {
    var p = id.split('|'), o = one(D().orders, p[0]);
    o.adds.splice(Number(p[1]), 1); GE.save(); A.openOrder(p[0]);
    GE.toast('Taken off. The pending figure has moved with it.');
  };
  /* a garment's value: from the fabric library unless the stylist sets it */
  A.setGarmentPrice = function (id) {
    var g = one(D().garments, id), o = one(D().orders, g.order), sug = GE.garmentSuggest(g);
    GE.modal('<h2>Value of this garment</h2><p class="sub">' + esc(g.kind) + ' on ' + g.order + '. ' +
      (GE.isThird(g) ? 'The designer\'s price for this piece.' : 'The fabric library suggests ' + rupees(sug.amount) + ': ' + esc(sug.why) + '.') + '</p>' +
      '<div class="f"><label>Value, before tax</label><input type="number" id="gpVal" value="' + GE.garmentValue(g) + '"></div>' +
      '<button class="btn gold" data-act="saveGarmentPrice" data-id="' + g.id + '">Save it</button>');
  };
  A.saveGarmentPrice = function (id) {
    var g = one(D().garments, id), o = one(D().orders, g.order);
    g.price = Number(document.getElementById('gpVal').value) || 0; g.price_by = GE.isThird(g) ? 'designer' : 'hand';
    GE.save(); GE.closeModal(); A.openOrder(g.order);
    GE.toast('Set. The order value is now ' + rupees(GE.orderMoney(g.order).value) + '.');
  };
  A.useLibraryPrice = function (id) {
    var g = one(D().garments, id); delete g.price; delete g.price_by;
    GE.save(); A.openOrder(g.order);
    GE.toast('Back on the fabric library price: ' + rupees(GE.garmentValue(g)) + '. It follows the fabric from now on.');
  };
  /* a payment is recorded on the order, with its mode; its invoice is made from it */
  A.orderPay = function (id) {
    var o = one(D().orders, id), m = GE.orderMoney(id), first = !by(D().invoices, 'order', id).length;
    if (!m.value) { GE.toast('Add the garments first: the payment is taken against their value.'); return; }
    GE.modal('<h2>Record a payment</h2><p class="sub">' + o.id + ' · total payable ' + rupees(m.total) + ' · paid ' + rupees(m.paid) + ' · <b>pending ' + rupees(m.pending) + '</b></p>' +
      '<div class="two"><div class="f"><label>Amount received</label><input type="number" id="opAmt" value="' + Math.max(0, m.pending) + '"></div>' +
      '<div class="f"><label>What it is</label><select id="opKind">' + ['Advance', 'Part payment', 'Full and final'].map(function (k) {
        return '<option' + (k === (first ? 'Advance' : 'Part payment') ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="f"><label>How it came in</label><select id="opMethod">' + GE.PAY_METHODS.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>When</label><input type="date" id="opAt" value="' + GE.localToday() + '"></div></div>' +
      '<div class="f"><label>Photo of the payment</label><input type="file" id="opProof" accept="image/*" capture="environment" data-input="readProof">' +
      '<div class="hint" id="opProofMsg">Take a photo or upload the screenshot: the reference is read off it.</div><div id="opProofPrev"></div></div>' +
      '<div class="f"><label>Reference</label><input id="opRef" placeholder="UPI reference, cheque number, receipt number"></div>' +
      '<div class="f"><label>Billed to</label><input id="opTo" value="' + esc(cname(o.client)) + '"></div>' +
      '<button class="btn gold" data-act="saveOrderPay" data-id="' + id + '">Record it, and make its invoice</button>');
  };
  /* the photo of the payment: kept small on the payment, and read for its reference.
     ponytail: OCR runs in the browser (Tesseract, loaded on first use, about 10 MB the first time);
     the built system reads it on the server. */
  var PROOF = '';
  A.readProof = function (id, el) {
    var f = el.files && el.files[0], msg = document.getElementById('opProofMsg'), ref = document.getElementById('opRef');
    if (!f) return;
    readImage(f, function (url) { PROOF = url; var pv = document.getElementById('opProofPrev'); if (pv) pv.innerHTML = '<img src="' + url + '" alt="The payment" style="max-height:120px;border-radius:8px;margin-top:8px">'; });
    msg.textContent = 'Reading the reference off the photo…';
    var run = function () {
      window.Tesseract.recognize(f, 'eng').then(function (r) {
        var got = GE.extractRef(r.data.text);
        if (got) { ref.value = got; msg.innerHTML = 'Read off the photo: <b>' + esc(got) + '</b>. Check it against the photo.'; }
        else msg.textContent = 'No reference found on the photo. Type it in.';
      }, function () { msg.textContent = 'The photo could not be read. Type the reference in.'; });
    };
    if (window.Tesseract) return run();
    var sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    sc.onload = run; sc.onerror = function () { msg.textContent = 'The reader could not load. Type the reference in.'; };
    document.head.appendChild(sc);
  };
  A.seeProof = function (id) {
    var p = one(D().payins, id); if (!p || !p.proof) return;
    GE.modal('<h2>The payment</h2><p class="sub">' + d(p.at) + ' · ' + rupees(p.amount) + ' · ' + esc(p.method) + (p.ref ? ' · ' + esc(p.ref) : '') + '</p>' +
      '<img src="' + p.proof + '" alt="The payment" style="max-width:100%;border-radius:10px">');
  };
  A.saveOrderPay = function (id) {
    var o = one(D().orders, id), amt = Number(document.getElementById('opAmt').value) || 0;
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    var kind = document.getElementById('opKind').value, at = document.getElementById('opAt').value || GE.TODAY;
    var num = 'INV-' + (2663 + D().invoices.length);
    D().invoices.push({ id: num, order: o.id, client: o.client, billed_to: document.getElementById('opTo').value || cname(o.client), parent: '',
      amount: amt, kind: kind === 'Full and final' ? 'Final' : kind, issued: at, due: at, scope: garmentsOf(o.id).map(function (g) { return g.kind; }).join(', ') });
    D().payins.push({ id: GE.uid('PI-'), invoice: num, amount: amt, kind: kind, method: document.getElementById('opMethod').value, at: at,
      ref: document.getElementById('opRef').value, by: GE.me().id, proof: PROOF || '' });
    PROOF = '';
    if (kind === 'Advance' && !o.advance_at) o.advance_at = at;
    GE.save(); GE.closeModal(); A.openOrder(id);
    var m = GE.orderMoney(id);
    GE.toast(rupees(amt) + ' recorded as ' + kind.toLowerCase() + '. Invoice ' + num + ' is ready as a PDF. Pending is now ' + rupees(m.pending) + '.');
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
  A.setOrderStylist = function (id, el) {
    if (GE.me().role !== 'BDM') { GE.toast('Only the BDM can change the stylist.'); return; }
    var o = one(D().orders, id), from = o.stylist;
    o.stylist = el.value;
    (o.history = o.history || []).push({ stage: o.stage, by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5), note: 'Stylist changed from ' + pname(from) + ' to ' + pname(el.value) });
    GE.save(); A.openOrder(id);
    GE.toast(o.id + ' is now with ' + pname(el.value) + '. The change is on the order\'s history.');
  };
  A.setOrderField = function (id, el) {
    var p = id.split('|'), o = one(D().orders, p[0]);
    o[p[1]] = p[1] === 'outfits' ? (Number(el.value) || 0) : el.value; GE.save();
    GE.toast(p[1] === 'event' ? 'Occasion: ' + (el.value || 'not known yet') + '.' : 'Saved.');
  };
  A.pickOrderStage = function (id, el) { A.setOrderStage(id + '|' + el.value); GE.save(); A.openOrder(id); };   /* save: the client's link follows at once */
  A.setOrderStage = function (id) {
    var p = id.split('|'), o = one(D().orders, p[0]);
    if (p[1] === 'In operations') {
      var missing = garmentsOf(o.id).filter(function (g) {
        return g.make === 'custom' && !by(D().meas, 'client', o.client)
          .filter(function (m) { return m.kind === g.kind; }).length;
      });
      if (missing.length) { GE.toast(missing[0].kind + ' has no measurement set, so it cannot go to operations. Take the set first: it opens on ' + missing[0].kind + '.'); return; }
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
      ' · styled by ' + esc(pname(o.stylist)) +
      (g.designer ? ' · at ' + esc(dgname(g.designer)) : '') + '</p>';

    h += '<div class="kpis">' + kpi(d(g.due), 'Due back', days(GE.TODAY, g.due) < 0 ? 'past it' :
      days(GE.TODAY, g.due) + ' days') +
      kpi(GE.sittingFor(g) + ' days', 'At this stage', g.stage) +
      kpi(GE.metresOf(g) ? GE.metresOf(g).toFixed(1) + ' m' : '—', 'Fabric on it',
          GE.fabricsOf(g).length + ' bunch' + (GE.fabricsOf(g).length === 1 ? '' : 'es')) + '</div>';

    /* who is on it: operations gives the master and names who looks after it */
    var giver = ['Owner', 'BDM', 'Operations manager'].indexOf(GE.me().role) > -1;
    h += '<div class="card" data-sec="who"><div class="cardhead"><h3>Who is on it</h3><span class="sub">given by operations</span></div><div class="three">' +
      fld('Stylist (owner of the order)', pname(o.stylist)) +
      (GE.isThird(g) ? fld('Made at', dgname(g.designer)) :
      '<div class="f"><label>Master</label>' + (giver ? '<select data-change="setGarmentMaster" data-id="' + g.id + '"><option value="">Nobody yet</option>' +
        by(D().people, 'role', 'Master').map(function (p) { return '<option value="' + p.id + '"' + (p.id === g.master ? ' selected' : '') + '>' + esc(p.name) + (p.craft ? ' · ' + esc(p.craft) : '') + '</option>'; }).join('') + '</select>'
        : '<div>' + esc(g.master ? pname(g.master) : 'Not given yet') + '</div>') + '</div>') +
      '<div class="f"><label>Operations person</label>' + (giver ? '<select data-change="setOrderOps" data-id="' + o.id + '"><option value="">Nobody yet</option>' +
        opsPeople().map(function (p) { return '<option value="' + p.id + '"' + (p.id === o.ops ? ' selected' : '') + '>' + esc(p.name) + ' · ' + esc(p.role) + '</option>'; }).join('') + '</select>'
        : '<div>' + esc(o.ops ? pname(o.ops) : 'Not given yet') + '</div>') + '</div></div>' +
      '<p class="hint">When the master hands it on or moves it from his own screen, this changes with it.</p></div>';

    /* what has to be made, and out of what */
    h += '<div class="card"><div class="cardhead"><h3>What has to be made</h3>' +
      '<span class="sub">no sale value on this screen</span></div>' +
      '<div class="two">' + fld('The outfit', g.kind) + fld('Made', g.make === 'readymade' ? 'Readymade, altered here' : 'Custom, to his measurements') + '</div>' +
      (g.note ? '<div class="f"><label>Note from the showroom</label><div>' + esc(g.note) + '</div></div>' : '') +
      (g.piece ? '<div class="f"><label>The readymade piece</label><div>' + esc(pieceName(g.piece)) + '</div></div>' : '') +
      '<div class="f"' + (g.piece ? ' hidden' : '') + '><label>Fabric and metres</label>';
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

    /* the costs of making it: entered here by operations, no totals and no profit on this screen */
    if (GE.can('cost') === true) {
      h += '<div class="card" data-sec="gcosts"><div class="cardhead"><h3>Costs on this garment</h3>' +
        '<button class="mini" data-act="addGCost" data-id="' + g.id + '">Add a cost</button></div><table><tbody>';
      GE.fabricsOf(g).forEach(function (u) {
        var f = one(D().fabrics, u.fabric); if (!f || !u.metres) return;
        h += '<tr><td>Fabric</td><td>' + esc(f.brand + ' ' + f.colour) + ', ' + u.metres + ' m</td><td class="sub">from the fabric library</td><td class="num">' + rupees(f.cost * u.metres) + '</td></tr>';
      });
      var gr = g.piece && one(D().readymade, g.piece);
      if (gr && gr.cost_to_make) h += '<tr><td>Readymade piece</td><td>' + esc(pieceName(g.piece)) + '</td><td class="sub">from the readymade stock</td><td class="num">' + rupees(gr.cost_to_make) + '</td></tr>';
      by(D().costlines, 'garment', g.id).forEach(function (l) {
        h += '<tr><td>' + esc(l.kind) + '</td><td>' + esc(l.label || '') + (l.file ? ' <span class="sub">· ' + esc(l.file) + '</span>' : '') + '</td><td>' + esc(l.person ? pname(l.person) : 'Outside / a vendor') +
          '<div class="sub">by ' + esc(pname(l.by)) + ', ' + d(l.at) + '</div></td><td class="num">' + rupees(l.amount) + '</td></tr>';
      });
      h += '</tbody></table><p class="hint">Each cost is added here, line by line. The totals, and what the order made, are on the opportunity.</p></div>';
    }

    var tag = GE.isThird(g) ? 'the third-party ladder, at ' + dgname(g.designer) : 'our own ladder';
    h += '<div class="card" data-sec="ladder"><div class="cardhead"><h3>Where it has got to</h3><span class="sub">' + tag + '</span></div>' +
      '<div class="f"><label>Stage</label><select data-change="pickGarmentStage" data-id="' + g.id + '">' +
      ladder.map(function (st, n) { return '<option value="' + esc(st) + '"' + (n === i ? ' selected' : '') + '>' + (n + 1) + '. ' + esc(st) + '</option>'; }).join('') +
      '</select><div class="hint">' + esc(GE.STAGE_MEANS[g.stage] || '') + ' · stage ' + (i + 1) + ' of ' + ladder.length + '</div></div></div>';

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

  A.setGarmentMaster = function (id, el) {
    var g = one(D().garments, id), from = g.master;
    g.master = el.value;
    (g.history = g.history || []).push({ handover: true, from: from, to: el.value, note: 'Given by operations', by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5) });
    GE.save(); A.openGarment(id);
    GE.toast(el.value ? 'Given to ' + pname(el.value) + '. It is on his screen now.' : 'Taken off the master.');
  };
  A.pickGarmentStage = function (id, el) { if (el.value) A.moveGarment(id + '|' + el.value); };
  A.addGCost = function (id) {
    var g = one(D().garments, id);
    GE.modal('<h2>Add a cost</h2><p class="sub">' + esc(g.kind) + ' on ' + g.order + '. It goes onto the opportunity\'s cost sheet.</p>' +
      '<div class="two"><div class="f"><label>What kind</label><select id="gcKind">' +
      GE.COST_KINDS.filter(function (k) { return k !== 'Fabric' && k !== 'Readymade piece'; }).map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Who did it</label><select id="gcWho"><option value="">Outside / a vendor</option>' +
      by(D().people, 'role', 'Master').map(function (p) { return '<option value="' + p.id + '"' + (p.id === g.master ? ' selected' : '') + '>' + esc(p.name) + (p.craft ? ' · ' + esc(p.craft) : '') + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="two"><div class="f"><label>Amount</label><input type="number" id="gcAmt"></div>' +
      '<div class="f"><label>Detail</label><input id="gcLabel" placeholder="Zardozi on the placket and cuffs"></div></div>' +
      '<div class="f"><label>The bill, if there is one</label><input type="file" id="gcFile" accept="image/*,application/pdf"></div>' +
      '<button class="btn gold" data-act="saveGCost" data-id="' + g.id + '">Add it</button>');
  };
  A.saveGCost = function (id) {
    var g = one(D().garments, id), $ = function (i) { return document.getElementById(i); };
    var amt = Number($('gcAmt').value) || 0;
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    var file = $('gcFile') && $('gcFile').files && $('gcFile').files[0];
    D().costlines.push({ id: GE.uid('CL-'), order: g.order, garment: g.id, kind: $('gcKind').value, person: $('gcWho').value,
      label: $('gcLabel').value, amount: amt, file: file ? file.name : '', by: GE.me().id, at: GE.TODAY });
    GE.save(); GE.closeModal(); A.openGarment(id);
    GE.toast('Added to the cost sheet, with your name on it.');
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
      '<div class="f"><label>Which bunch</label>' +
      '<input type="search" id="afFabFind" class="pickfind" placeholder="Type a brand, colour or pattern" data-input="fabFind" data-id="afFab" autocomplete="off">' +
      '<select id="afFab">' + fabricOptions('') + '</select></div>' +
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
      if (!o || GE.isThird(g)) return false;
      if (mine && g.master !== GE.me().id) return false;
      /* once it is delivered it leaves the floor. The history stays on the client. */
      return g.stage !== 'Delivered' && o.stage !== 'Delivered';
    });
    var gs = all.filter(function (g) {
      var o = one(D().orders, g.order);
      return GE.matches(q('#/floor'), [g.kind, g.order, cname(o.client), g.stage, pname(g.master), pname(o.stylist), o.ops ? pname(o.ops) : '',
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
    h += searchBar('#/floor', 'Search a garment, a client, a stylist, a master, a fabric', gs.length, all.length);
    h += '<div class="card">' + garmentTable(gs, false, true) + '</div>';
    return h;
  };

  /* floor: the operations dashboard, which names who is on it and every date (5 Oct), no money */
  function garmentTable(gs, withPending, floor) {
    var showMoney = withPending && GE.can('invoices');
    var h = '<table' + (floor ? ' class="floortab"' : '') + '><thead><tr><th>Garment</th>' + (floor ? '<th>Client · order</th>' : '<th>Order</th><th>Client</th>') + (floor ? '<th>Stylist</th>' : '') + '<th>Master</th>' +
      (floor ? '<th>Operations</th><th>Stage</th>' : '<th>Stage</th><th>Sat</th>') + (floor ? '<th>Trial</th>' : '') + '<th>Due</th>' + (floor ? '<th>Delivery</th>' : '') +
      (showMoney ? '<th class="num">Pending</th>' : '') + (floor ? '' : '<th></th>') + '</tr></thead><tbody>';
    var dd = function (x) { return x ? (floor ? d(x).replace(/ \d\d$/, '') : d(x)) : '—'; };
    gs.slice().sort(function (a, b) { return (a.due || '9') < (b.due || '9') ? -1 : 1; }).forEach(function (g) {
      var o = one(D().orders, g.order);
      h += '<tr class="click" data-act="openGarment" data-id="' + g.id + '">' +
        '<td><b>' + esc(g.kind) + '</b>' + (g.note ? '<div class="sub">' + esc(g.note) + '</div>' : '') + '</td>' +
        (floor ? '<td>' + esc(cname(o.client)) + '<div class="sub">' + g.order + '</div></td>' : '<td>' + g.order + '</td><td>' + esc(cname(o.client)) + '</td>') +
        (floor ? '<td>' + esc(pname(o.stylist)) + '</td>' : '') +
        '<td>' + esc(g.master ? pname(g.master) : 'nobody') + '</td>' +
        (floor ? '<td>' + esc(o.ops ? pname(o.ops) : 'nobody') + '</td>' : '') +
        (floor ? '<td>' + stagePill(g.stage) + '<div class="sub">' + GE.sittingFor(g) + 'd here' + (GE.sittingFor(g) > 7 ? ' ' + pill('held', 'bad') : '') + '</div></td>'
          : '<td>' + stagePill(g.stage) + '</td><td>' + GE.sittingFor(g) + 'd' + (GE.sittingFor(g) > 7 ? ' ' + pill('held', 'bad') : '') + '</td>') +
        (floor ? '<td>' + dd(o.trial) + '</td>' : '') +
        '<td>' + dd(g.due) + (g.due && days(GE.TODAY, g.due) < 0 ? ' ' + pill('late', 'bad') : '') + '</td>' +
        (floor ? '<td>' + dd(o.delivery) + '</td>' : '') +
        (showMoney ? '<td class="num">' + rupees(Math.max(0, GE.orderMoney(o.id).pending)) + '</td>' : '') +
        (floor ? '' : '<td><button class="mini">Open</button></td>') + '</tr>';
    });
    if (!gs.length) h += '<tr><td colspan="13" class="sub">Nothing here.</td></tr>';
    return h + '</tbody></table>';
  }

  /* ================= At the designers ================= */

  V['#/designers-floor'] = function () {
    var all = D().garments.filter(function (g) {
      var o = one(D().orders, g.order);
      return o && GE.isThird(g) && g.stage !== 'Delivered' && o.stage !== 'Delivered';
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
    if (GE.can('cost')) h += '<div class="card" data-sec="rule"><div class="cardhead"><h3>How a garment is priced</h3></div><p>A garment\'s value comes from the price set for that outfit on its cloth (open a bunch to set them). Where no price is set, charge ' +
      '<input type="number" min="1" step="0.5" style="width:70px" value="' + (D().priceRule.multiplier || 6) + '" data-change="setPriceRule" aria-label="Times the fabric cost"> times the cost of the fabric used, rounded to the nearest ₹500.</p></div>';
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
    if (GE.can('stock') === true) {
      h += '<div class="card" data-sec="prices"><div class="cardhead"><h3>What we charge for each outfit</h3><span class="sub">in this cloth, before tax</span></div><table><tbody>';
      GE.KINDS.forEach(function (k) {
        var auto = GE.garmentSuggest({ kind: k, fabrics: [] }), rule = Math.round(f.cost * 3 * (D().priceRule.multiplier || 6) / 500) * 500;
        h += '<tr><td>' + esc(k) + '</td><td style="width:170px"><input type="number" placeholder="rule: ' + rupees(rule) + ' at 3 m" value="' + (f.prices[k] || '') +
          '" data-change="setFabPrice" data-id="' + f.id + '|' + esc(k) + '" aria-label="Price for a ' + esc(k) + '"></td></tr>';
      });
      h += '</tbody></table><p class="hint">When a stylist picks this cloth for an outfit, the garment\'s value comes from here. Left empty, the rule applies: ' +
        (D().priceRule.multiplier || 6) + ' times the cost of the fabric used (' + rupees(f.cost) + ' a metre). The rule is set on the fabric library page.</p></div>';
    }
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

  A.setFabPrice = function (id, el) {
    var p = id.split('|'), f = one(D().fabrics, p[0]), v = Number(el.value) || 0;
    if (v > 0) f.prices[p[1]] = v; else delete f.prices[p[1]];
    GE.save(); GE.toast(v > 0 ? 'A ' + p[1].split(' / ')[0].toLowerCase() + ' in ' + f.brand + ' ' + f.colour + ' is now ' + rupees(v) + '.' : 'Back on the rule for that outfit.');
  };
  A.setPriceRule = function (id, el) {
    D().priceRule.multiplier = Math.max(1, Number(el.value) || 6); GE.save();
    GE.toast('Garments without a set price are now ' + D().priceRule.multiplier + ' times their fabric cost.');
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
    var ord = one(D().orders, oid); ord.adds = []; ord.extras = []; ord.ops = '';
    D().garments.push({ id: GE.uid('G-'), order: oid, kind: r.kind, make: 'readymade', piece: r.id, stage: r.owner !== 'Sasya' ? 'Order confirmed' : 'Not started',
      master: '', fabrics: [], due: '', designer: r.owner !== 'Sasya' ? r.owner : '', note: 'From ' + (r.code || r.name) + ', ' + r.name,
      price: Number(document.getElementById('udVal').value) || r.price, price_by: 'design', samples: [], designform: [],
      history: [{ stage: 'Not started', by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5) }] });
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
  A.pdf = function (id) { A.invoicePdf(id); };
  /* the invoice, on Saasya Men's letterhead. One for each payment (its invoice), one for the
     whole order. Drawn as a page and turned into a PDF in the browser, so the ₹ is the real one. */
  var HOUSE_INFO = { name: 'SAASYA MEN', line: 'A house of Sasya', addr: '23a Shakespeare Sarani, Kolkata 700017, West Bengal', gstin: 'GSTIN to be filled in', phone: '+91 33 0000 0000', mail: 'hello@saasya.co' };
  function invoiceHtml(o, inv) {
    var m = GE.orderMoney(o.id), c = one(D().clients, o.client) || {}, gs = garmentsOf(o.id);
    var pays = []; by(D().invoices, 'order', o.id).forEach(function (i) { by(D().payins, 'invoice', i.id).forEach(function (p) { pays.push({ i: i, p: p }); }); });
    var r = function (n) { return '₹' + Math.round(n || 0).toLocaleString('en-IN'); };
    var row = function (a, b, c2, cls) { return '<tr class="' + (cls || '') + '"><td>' + a + '</td><td class="d">' + (b || '') + '</td><td class="n">' + c2 + '</td></tr>'; };
    var lines = gs.map(function (g, n) { return row((n + 1) + '. ' + esc(g.kind), esc(GE.fabricsOf(g).map(function (u) { return fname(u.fabric) + (u.metres ? ' · ' + u.metres + ' m' : ''); }).join(', ') || (g.note || '')), r(GE.garmentValue(g))); }).join('') +
      (o.extras || []).map(function (x) { return row(esc(x.label), esc(x.note || '') + (x.due ? ' · by ' + d(x.due) : ''), r(x.amount)); }).join('');
    var half = Math.round(m.gst / 2);
    return '<div class="inv"><div class="ih"><div class="il"><img src="assets/logo.png" alt="Saasya Men"><div><b>' + HOUSE_INFO.name + '</b><span>' + HOUSE_INFO.line + '</span></div></div>' +
      '<div class="ir"><b>' + (inv ? 'TAX INVOICE' : 'ORDER AND INVOICE') + '</b><span>' + (inv ? inv.id + ' · ' + d(inv.issued) : 'Order ' + o.id + ' · ' + d(GE.TODAY)) + '</span></div></div>' +
      '<div class="ia"><div><label>From</label><b>' + HOUSE_INFO.name + '</b><span>' + HOUSE_INFO.addr + '</span><span>' + HOUSE_INFO.phone + ' · ' + HOUSE_INFO.mail + '</span><span>' + HOUSE_INFO.gstin + '</span></div>' +
      '<div><label>Billed to</label><b>' + esc(inv ? inv.billed_to : c.name) + '</b><span>' + esc(c.phone || '') + '</span><span>' + esc(famName(c.family)) + '</span><span>Order ' + o.id + (o.event ? ' · ' + esc(o.event) : '') + (o.delivery ? ' · delivery ' + d(o.delivery) : '') + '</span></div></div>' +
      (inv ? '<div class="ib">This invoice is for <b>' + esc(inv.kind === 'Final' ? 'the full and final payment' : inv.kind.toLowerCase()) + '</b> of <b>' + r(inv.amount) + '</b>, received against order ' + o.id + '.</div>' : '') +
      '<table class="it"><thead><tr><th>Item</th><th>Fabric and detail</th><th class="n">Amount</th></tr></thead><tbody>' + lines +
      row('<b>Order value</b>', '', '<b>' + r(m.value) + '</b>', 'sum') +
      (m.adds || []).map(function (x) { return row('Add: ' + esc(x.label), '', '+ ' + r(x.amount)); }).join('') +
      (m.cuts || []).map(function (x) { return row('Less: ' + esc(x.label), '', '− ' + r(x.amount)); }).join('') +
      row('<b>Net order value</b>', '', '<b>' + r(m.net) + '</b>', 'sum') +
      row('CGST at ' + (m.rate * 50) + '%', '', '+ ' + r(half)) + row('SGST at ' + (m.rate * 50) + '%', '', '+ ' + r(m.gst - half)) +
      row('<b>Total payable</b>', '', '<b>' + r(m.total) + '</b>', 'tot') + '</tbody></table>' +
      '<table class="it"><thead><tr><th>Payments received</th><th>How</th><th class="n">Amount</th></tr></thead><tbody>' +
      (pays.length ? pays.map(function (x) { return row(d(x.p.at) + ' · ' + esc(x.p.kind || x.i.kind) + ' · ' + x.i.id + (inv && x.i.id === inv.id ? ' (this invoice)' : ''), esc(x.p.method) + (x.p.ref ? ' · ' + esc(x.p.ref) : ''), r(x.p.amount)); }).join('') : row('Nothing received yet', '', r(0))) +
      row('<b>Pending at delivery</b>', '', '<b>' + r(m.pending) + '</b>', 'tot') + '</tbody></table>' +
      '<div class="if"><div>Thank you for choosing Saasya Men. Garments are made to your measurements; alterations within 30 days of delivery are on us. Payments by cheque are subject to realisation.</div><div class="sg">For SAASYA MEN<br><br>Authorised signatory</div></div></div>';
  }
  var INV_CSS = '.inv{width:760px;padding:40px 44px;background:#fbf8f2;color:#1d1a16;font:13px/1.5 Inter,Arial,sans-serif}.inv .ih{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #a9835a;padding-bottom:16px}' +
    '.inv .il{display:flex;gap:14px;align-items:center}.inv .il img{width:64px;height:64px;object-fit:contain;background:#1d1a16;border-radius:8px;padding:6px}.inv .il b{display:block;font-size:20px;letter-spacing:.18em}.inv .il span,.inv .ir span{color:#6b6257;font-size:12px}' +
    '.inv .ir{text-align:right}.inv .ir b{display:block;font-size:16px;letter-spacing:.14em;color:#7a5e41}.inv .ia{display:flex;gap:30px;margin:18px 0}.inv .ia>div{flex:1}.inv .ia label{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#7a5e41}' +
    '.inv .ia b{display:block;font-size:14px}.inv .ia span{display:block;color:#4a433b;font-size:12px}.inv .ib{background:#f1e9dc;border-left:3px solid #a9835a;padding:9px 12px;margin-bottom:14px}.inv table.it{width:100%;border-collapse:collapse;margin-bottom:16px}' +
    '.inv .it th{text-align:left;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#7a5e41;border-bottom:1px solid #d9cdb9;padding:6px 4px}.inv .it td{padding:6px 4px;border-bottom:1px solid #eee5d6;vertical-align:top}.inv .it td.d{color:#6b6257;font-size:12px}' +
    '.inv th,.inv td{color:#1d1a16!important;opacity:1!important;font-weight:inherit}.inv .it th{color:#7a5e41!important}.inv .it td.d{color:#6b6257!important}.inv b{color:inherit}.inv .n{text-align:right;white-space:nowrap}.inv .it tr.sum td{border-top:1px solid #d9cdb9}.inv .it tr.tot td{border-top:2px solid #a9835a;font-size:14px}.inv .if{display:flex;justify-content:space-between;gap:30px;color:#6b6257;font-size:11px;margin-top:20px}.inv .sg{text-align:right;color:#1d1a16;min-width:180px}';
  function makePdf(html, file) {
    var box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1';
    box.innerHTML = '<style>' + INV_CSS + '</style>' + html;
    document.body.appendChild(box);
    var go = function () {
      window.html2pdf().set({ margin: 0, filename: file, image: { type: 'jpeg', quality: 0.96 }, html2canvas: { scale: 2, backgroundColor: '#fbf8f2', useCORS: true },
        jsPDF: { unit: 'px', format: [760, 1075], orientation: 'portrait', hotfixes: ['px_scaling'] } }).from(box.querySelector('.inv')).save()
        .then(function () { box.remove(); }, function () { box.remove(); GE.toast('The PDF could not be made here. Check the internet connection.'); });
    };
    if (window.html2pdf) return go();
    var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    sc.onload = go; sc.onerror = function () { box.remove(); GE.toast('The PDF maker could not load. Check the internet connection.'); }; document.head.appendChild(sc);
  }
  /* ---- the client's live order link: one snapshot per shared order, refreshed on every save ---- */
  var SHARE_API = 'https://saasya-share.zippyscale-cockpit-server.workers.dev/o/';
  var SHARE_PAGE = 'https://zippyscale.in/saasya/track.html#';
  /* what the client may see: no cost, no master, no phone, no internal notes */
  function shareData(o) {
    var m = GE.orderMoney(o.id), pays = [];
    by(D().invoices, 'order', o.id).forEach(function (i) { by(D().payins, 'invoice', i.id).forEach(function (p) {
      pays.push({ at: p.at, kind: p.kind || i.kind, method: p.method, amount: p.amount, invoice: i.id }); }); });
    return { house: HOUSE_INFO.name, order: o.id, client: cname(o.client), type: o.type || '', occasion: o.event || '',
      event_date: o.event_date || '', trial: o.trial || '', delivery: o.delivery || '', stylist: pname(o.stylist), stage: o.stage,
      garments: garmentsOf(o.id).map(function (g) { return { kind: g.kind, stage: g.stage, value: GE.garmentValue(g),
        fabric: GE.fabricsOf(g).map(function (u) { return fname(u.fabric); }).join(', ') }; }),
      extras: (o.extras || []).map(function (x) { return { label: x.label, note: x.note || '', due: x.due || '', amount: Number(x.amount) || 0 }; }),
      money: { value: m.value, adds: m.adds, cuts: m.cuts, net: m.net, rate: m.rate, gst: m.gst, total: m.total, paid: m.paid, pending: m.pending },
      payments: pays };
  }
  var sentShare = {};
  function pushShare(o) {
    if (!o.share || !/^http/.test(String(location.protocol || ''))) return Promise.resolve(false);
    var body = JSON.stringify({ key: o.share.key, data: shareData(o) });
    if (sentShare[o.id] === body) return Promise.resolve(true);
    return fetch(SHARE_API + o.share.token, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: body })
      .then(function (r) { if (r.ok) sentShare[o.id] = body; return r.ok; }, function () { return false; });
  }
  function pushShares() { (D().orders || []).forEach(function (o) { if (o.share) pushShare(o); }); }
  var saveFirst = GE.save;
  GE.save = function () { saveFirst(); pushShares(); };
  if (typeof setInterval === 'function' && /^http/.test(String(location.protocol || ''))) setInterval(pushShares, 20000);  /* catches moves saved inside core */
  function token(n) {
    var a = new Uint8Array(n); (window.crypto || require('crypto').webcrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[b & 63]; }).join('');
  }
  A.shareOrder = function (id) {
    var o = one(D().orders, id);
    if (!o.share) { o.share = { token: token(22), key: token(32), at: GE.localToday() }; GE.save(); }
    var url = SHARE_PAGE + o.share.token, c = one(D().clients, o.client) || {};
    var msg = 'Mr. ' + (c.name || '').split(' ').slice(-1)[0] + ', your Saasya Men order ' + o.id + ' is here, and it updates itself as we work on it: ' + url;
    GE.modal('<h2>The client\'s live link</h2><p class="sub">One link for ' + esc(cname(o.client)) + '. Every payment, every garment moving on, every date: it shows the moment it is saved here. No new PDF each time.</p>' +
      '<div class="f"><label>The link</label><input id="shUrl" readonly value="' + esc(url) + '"></div>' +
      '<div><button class="btn gold" data-act="copyShare" data-id="' + o.id + '">Copy the link</button> ' +
      '<a class="btn alt" target="_blank" rel="noopener" href="https://wa.me/' + String(c.phone || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(msg) + '">Send on WhatsApp</a> ' +
      '<a class="btn alt" target="_blank" rel="noopener" href="' + esc(url) + '">Open it</a></div>' +
      '<p class="hint" id="shState">Sending the latest to the link…</p>' +
      '<p class="hint">He sees the garments and their stage, the dates, the money, his payments and what is pending. Never the cost, the master or our notes.</p>');
    pushShare(o).then(function (ok) { var e = document.getElementById('shState'); if (e) e.textContent = ok ? 'The link is up to date.' : 'Could not reach the link just now. It updates on the next save.'; });
  };
  A.copyShare = function (id) {
    var e = document.getElementById('shUrl'); e.select();
    (navigator.clipboard ? navigator.clipboard.writeText(e.value) : Promise.reject()).then(function () { GE.toast('Copied.'); }, function () { document.execCommand('copy'); GE.toast('Copied.'); });
  };
  GE.shareData = shareData;

  A.invoicePdf = function (id) {
    var inv = one(D().invoices, id); if (!inv) return;
    makePdf(invoiceHtml(one(D().orders, inv.order), inv), 'Saasya-Men-' + inv.id + '.pdf');
    GE.toast('Making ' + inv.id + ' as a PDF…');
  };
  A.orderPdf = function (id) {
    makePdf(invoiceHtml(one(D().orders, id), null), 'Saasya-Men-' + id + '.pdf');
    GE.toast('Making the PDF of ' + id + '…');
  };
  GE.invoiceHtml = invoiceHtml; GE.INV_CSS = INV_CSS;

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
        var mine = closedAll.filter(function (o) { return lineValue(o, L[1]) > 0; });
        var v = sum(closedAll, function (o) { return lineValue(o, L[1]); });
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
          .reduce(function (a, o) { a[o.family || o.client] = 1; return a; }, {})).length;
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

  function occasionSelect(id, cur, attrs) {
    var known = false;
    var h = '<select id="' + id + '"' + (attrs || '') + '><option value="">Not known yet</option>' +
      GE.OCCASIONS.map(function (g) {
        return '<optgroup label="' + g[0] + '">' + g[1].map(function (x) {
          if (x === cur) known = true;
          return '<option' + (x === cur ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</optgroup>'; }).join('');
    if (cur && !known) h += '<option selected>' + esc(cur) + '</option>';
    return h + '</select>';
  }
  /* Start an order (6 Oct): find him by name or mobile (or the dropdown), and what was taken when he
     was added comes back here, marked as such; what was not taken is asked here. The stage is set here. */
  function stylists() { return D().people.filter(function (p) { return p.role === 'Stylist' || p.role === 'Salesperson'; }); }
  A.newOrder = function (cid) {
    cid = cid || '';
    GE.modal('<h2>Start an order</h2>' +
      '<p class="sub">Find the client, check what was taken when he was added, and mark where the sale stands.</p>' +
      '<div class="f"><label>Who it is for</label><input id="noFind" type="search" autocomplete="off" placeholder="Type his name or mobile number" data-input="noFind">' +
      '<div id="noHits" class="hits"></div>' +
      '<select id="noClient" data-change="noPick" style="margin-top:8px"><option value="">Or choose from the list</option>' +
      D().clients.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }).map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === cid ? ' selected' : '') + '>' + esc(c.name) + ' · ' + esc(c.phone || '') + '</option>'; }).join('') +
      '</select></div>' +
      '<div id="noFrom" class="note" style="display:none"></div>' +
      '<div class="two"><div class="f"><label>Type of order</label><select id="noType">' +
      '<option value="">Not decided yet</option>' +
      GE.ORDER_TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Sales stage</label><select id="noStage">' +
      START_STAGES.map(function (st) { return '<option>' + st + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="f"><label>Stylist</label><select id="noStylist">' +
      stylists().map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Source</label><select id="noSrc">' +
      GE.SOURCES.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="f"><label>Budget</label><input type="number" id="noEst" placeholder="150000"></div>' +
      '<div class="f"><label>How many outfits</label><input type="number" min="1" id="noOutfits" placeholder="3"></div></div>' +
      '<div class="two"><div class="f"><label>Occasion <span class="tag" id="noEventTag"></span></label>' + occasionSelect('noEvent', '') + '</div>' +
      '<div class="f"><label>Date of the occasion <span class="tag" id="noEventAtTag"></span></label><input type="date" id="noEventAt"></div></div>' +
      '<div class="two"><div class="f"><label>Delivery wanted by <span class="tag" id="noDeliveryTag"></span></label><input type="date" id="noDelivery"></div><div></div></div>' +
      '<div class="f"><label>What was said <span class="tag" id="noNoteTag"></span></label><textarea id="noNote" rows="2"></textarea></div>' +
      '<button class="btn gold" data-act="saveOrder">Put him on the showroom</button>');
    if (cid) A.noPick(cid);
  };
  A.noFind = function (id, el) {
    var t = el.value.trim().toLowerCase(), digits = t.replace(/\D/g, ''), box = document.getElementById('noHits');
    if (t.length < 2) { box.innerHTML = ''; return; }
    var hits = D().clients.filter(function (c) {
      return c.name.toLowerCase().indexOf(t) > -1 || (digits.length >= 3 && String(c.phone || '').replace(/\D/g, '').indexOf(digits) > -1);
    }).slice(0, 6);
    box.innerHTML = hits.length ? hits.map(function (c) {
      return '<button type="button" class="hit" data-act="noPick" data-id="' + c.id + '"><b>' + esc(c.name) + '</b> <span class="sub">' + esc(c.phone || '') +
        (c.family ? ' · ' + esc(famName(c.family)) : '') + '</span></button>'; }).join('')
      : '<div class="sub">Nobody by that name or number. Add him from Clients first.</div>';
  };
  /* fill the form from his record; say what came from it and what is still to be taken */
  A.noPick = function (cid, el) {
    if (!cid && el && el.tagName === 'SELECT') cid = el.value;
    var c = one(D().clients, cid), $ = function (i) { return document.getElementById(i); };
    if (!c || !$('noClient')) return;
    $('noClient').value = c.id; $('noFind').value = c.name; $('noHits').innerHTML = '';
    if (c.stylist) $('noStylist').value = c.stylist;
    if (c.source) $('noSrc').value = c.source;
    var got = [], missing = [];
    [['noEvent', 'event', 'occasion'], ['noEventAt', 'event_date', 'date of the occasion'], ['noDelivery', 'delivery_wanted', 'delivery date'], ['noNote', 'note', 'what was said']].forEach(function (f) {
      var v = c[f[1]] || '';
      $(f[0]).value = v;
      $(f[0] + 'Tag').textContent = v ? 'from his record' : (f[1] === 'note' ? '' : 'not taken yet');
      $(f[0] + 'Tag').className = 'tag' + (v ? '' : ' warn');
      if (f[1] !== 'note') (v ? got : missing).push(f[2]);
    });
    var box = $('noFrom'); box.style.display = '';
    box.innerHTML = '<b>' + esc(c.name) + '</b>' + (c.phone ? ', ' + esc(c.phone) : '') + ', with ' + esc(pname(c.stylist)) + '. ' +
      (got.length ? 'Brought across from when he was added: ' + got.join(', ') + '. ' : '') +
      (missing.length ? '<b>Still to be taken: ' + missing.join(', ') + '.</b> Put them in here.' : 'Change anything that has moved.');
  };
  A.saveOrder = function () {
    var $ = function (i) { return document.getElementById(i); };
    var cid = $('noClient').value, c = one(D().clients, cid);
    if (!c) { GE.toast('Find the client first: type his name or mobile, or choose him from the list.'); return; }
    var type = $('noType').value, stage = $('noStage').value || 'Stylist', now = GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5);
    var id = 'O-' + (1053 + D().orders.length);
    var hist = [{ stage: 'Stylist', by: GE.me().id, at: now }];
    if (stage !== 'Stylist') hist.push({ stage: stage, by: GE.me().id, at: now });
    D().orders.push({ id: id, client: cid, family: c.family,
      vertical: type.indexOf('Third-party') === 0 ? 'designer' : 'in-house', type: type,
      stage: stage, value: 0, cuts: [],
      estimate: Number($('noEst').value) || 0,
      source: $('noSrc').value,
      salesperson: GE.me().role === 'Salesperson' ? GE.me().id : (c.salesperson || $('noStylist').value),
      stylist: $('noStylist').value,
      designer: type.indexOf('Third-party') === 0 ? D().designers[0].id : '',
      booked: GE.TODAY, advance_at: stage === 'Advance taken' ? GE.TODAY : '',
      event: $('noEvent').value, event_date: $('noEventAt').value,
      outfits: Number($('noOutfits').value) || 0, adds: [], extras: [], ops: '',
      delivery: $('noDelivery').value, trial: '', note: $('noNote').value,
      history: hist });
    /* what was only taken here goes back on his record, so it is there next time */
    if (!c.event) c.event = $('noEvent').value;
    if (!c.event_date) c.event_date = $('noEventAt').value;
    if (!c.delivery_wanted) c.delivery_wanted = $('noDelivery').value;
    GE.save(); GE.closeModal(); GE.go('#/showroom'); A.openOrder(id);
    GE.toast(id + ' is on the showroom at ' + stage + '. The Doorman chases it if it goes quiet for five days.');
  };

  /* what the showroom needs on day one (6 Oct): the man, how he came, who has him, the occasion and its
     dates. No stage and no order here: the stage is marked when his order is started.
     Household and birthday live on his own record. */
  var START_STAGES = ['Stylist', 'Shown designs', 'Quotation provided', 'Advance taken', 'Measurements'];
  A.newClient = function () {
    GE.modal('<h2>Add a client</h2><p class="sub">One person. His household and birthday go on his own record; his order is started next.</p>' +
      '<div class="two"><div class="f"><label>Name</label><input id="ncName" autocomplete="off"></div>' + phoneField('ncPhone', 'Mobile') + '</div>' +
      '<div class="two"><div class="f"><label>Source</label><select id="ncSrc">' +
      GE.SOURCES.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Assign a stylist</label><select id="ncStylist">' +
      stylists().map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + ' · ' + esc(p.role) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="f"><label>Occasion</label>' + occasionSelect('ncEvent', 'Wedding') + '</div>' +
      '<div class="f"><label>Date of the occasion</label><input type="date" id="ncEventAt"></div></div>' +
      '<div class="two"><div class="f"><label>Delivery wanted by</label><input type="date" id="ncDelivery"></div><div></div></div>' +
      '<div class="f"><label>Note</label><textarea id="ncNote" rows="2" placeholder="Walked in at four, asking about a bandhgala."></textarea></div>' +
      '<button class="btn gold" data-act="saveClient">Add him</button>');
  };
  A.saveClient = function () {
    var v = function (i) { return document.getElementById(i).value; };
    var name = v('ncName').trim();
    if (!name) { GE.toast('A name first.'); return; }
    var phone = readPhone('ncPhone', true);
    if (phone === null) { GE.toast(v('ncPhoneCc') === '+91' ? 'An Indian mobile is 10 digits, starting 6, 7, 8 or 9.' : 'Check the mobile number: 6 to 14 digits, without the country code.'); return; }
    var dup = D().clients.filter(function (c) { return c.phone && c.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''); })[0];
    if (dup) { GE.toast(dup.name + ' already has this number. Open him from Clients.'); return; }
    var stylist = v('ncStylist'), id = GE.uid('C-');
    D().clients.push({ id: id, family: '', name: name, relation: '', phone: phone, email: '', dob: '', anniversary: '',
      source: v('ncSrc'), stylist: stylist, salesperson: GE.me().role === 'Salesperson' ? GE.me().id : stylist, note: v('ncNote'),
      event: v('ncEvent'), event_date: v('ncEventAt'), delivery_wanted: v('ncDelivery') });
    GE.save(); GE.closeModal(); GE.go('#/clients'); A.openClient(id);
    GE.toast(name + ' is added, with ' + pname(stylist) + '. Start his order from his record: what you just took comes across.');
  };

  /* type to search: the list narrows as you type, for a library of hundreds */
  function fabricPicker(id) {
    return '<input type="search" id="' + id + 'Find" class="pickfind" placeholder="Type a brand, colour or pattern" data-input="fabFind" data-id="' + id + '" autocomplete="off">' +
      '<select id="' + id + '" data-change="agPrice"><option value="">None yet</option>' + fabricOptions('') + '</select>';
  }
  function fabricOptions(t) {
    t = (t || '').toLowerCase();
    return D().fabrics.filter(function (f) { return !t || [f.brand, f.colour, f.pattern, f.book].join(' ').toLowerCase().indexOf(t) > -1; })
      .map(function (f) { return '<option value="' + f.id + '">' + esc(f.brand + ' ' + f.colour + ', ' + f.pattern) + ' · ' + GE.stockOf(f.id).hand.toFixed(1) + ' m left</option>'; }).join('');
  }
  A.fabFind = function (id, el) {
    var sel = document.getElementById(id), opts = fabricOptions(el.value);
    sel.innerHTML = (id === 'agFab' ? '<option value="">None yet</option>' : '') + (opts || '<option value="">Nothing matches</option>');
    if (opts && el.value) sel.selectedIndex = id === 'agFab' ? 1 : 0;
    if (id === 'agFab') A.agPrice();
  };
  function pieceOptions(t, owner) {
    t = (t || '').toLowerCase();
    return D().readymade.filter(function (r) { return (owner == null || r.owner === owner) && (!t || [r.code, r.name, r.kind, dgname(r.owner), r.size].join(' ').toLowerCase().indexOf(t) > -1); })
      .map(function (r) { return '<option value="' + r.id + '">' + esc((r.code ? r.code + ' · ' : '') + r.name) + ' · size ' + esc(r.size || '—') +
        ' · ' + esc(r.owner === 'Sasya' ? 'ours' : dgname(r.owner)) + (r.warehouse ? ' · ' + esc(r.warehouse) : '') + ' · ' + rupees(r.price) + '</option>'; }).join('');
  }
  function agOwner() { var f = document.getElementById('agFrom'); return f && f.value ? f.value : 'Sasya'; }
  A.pieceFind = function (id, el) {
    var sel = document.getElementById('agPiece'), opts = pieceOptions(el.value, agOwner());
    sel.innerHTML = '<option value="">Choose the piece</option>' + (opts || '<option value="">Nothing matches</option>');
    if (opts && el.value) sel.selectedIndex = 1;
    A.agPrice();
  };
  /* one order, any mix: ours or a designer's, custom or readymade. The garment goes to the floor that makes it. */
  A.addGarment = function (oid) {
    var o = one(D().orders, oid), from = o.vertical === 'designer' ? (o.designer || '') : '';
    GE.modal('<h2>Add a garment to ' + esc(oid) + '</h2>' +
      '<div class="two"><div class="f"><label>What it is</label><select id="agKind" data-change="agPrice">' +
      GE.KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Made by</label><select id="agFrom" data-change="agMakeSwitch">' +
      '<option value="">Saasya Men, in-house</option>' +
      D().designers.map(function (dz) { return '<option value="' + dz.id + '"' + (dz.id === from ? ' selected' : '') + '>' + esc(dz.name) + ', third-party</option>'; }).join('') +
      '</select><div class="hint" id="agRoute"></div></div></div>' +
      '<div class="two"><div class="f"><label>Made how</label><select id="agMake" data-change="agMakeSwitch">' +
      '<option value="custom">Custom, to his measurements</option>' +
      '<option value="readymade">Readymade, from stock</option></select></div><div></div></div>' +
      '<div id="agReady" hidden><div class="f"><label>Which readymade piece</label>' +
      '<input type="search" id="agPieceFind" class="pickfind" placeholder="Type a code, a name or a size" data-input="pieceFind" autocomplete="off">' +
      '<select id="agPiece" data-change="agPrice"><option value="">Choose the piece</option></select>' +
      '<div class="hint">Straight from the readymade stock: its price becomes the garment\'s value. No metres.</div></div></div>' +
      '<div id="agCustom"><div class="two"><div class="f"><label>Fabric</label>' + fabricPicker('agFab') +
      '<div class="hint">More can be added on the garment itself: lining, contrast, whatever it takes.</div></div>' +
      '<div class="f"><label>Metres</label><input type="number" step="0.1" id="agM" value="3" data-change="agPrice"></div></div></div>' +
      '<div class="two"><div class="f"><label id="agPriceLbl">Value of this garment</label><input type="number" id="agPriceIn">' +
      '<div class="hint" id="agWhy"></div></div>' +
      '<div class="f"><label id="agDueLbl">Back by</label><input type="date" id="agDue" value="' + (o.delivery || '') + '"></div></div>' +
      '<div class="f"><label>Note for whoever makes it</label><textarea id="agNote" rows="2"></textarea></div>' +
      '<button class="btn gold" data-act="saveGarment" data-id="' + esc(oid) + '">Add it</button>');
    A.agMakeSwitch();
  };
  A.agMakeSwitch = function () {
    var $ = function (i) { return document.getElementById(i); };
    if (!$('agMake') || !$('agFrom') || !$('agReady')) return;
    var ready = $('agMake').value === 'readymade', third = !!$('agFrom').value;
    $('agReady').hidden = !ready;
    $('agCustom').hidden = ready || third;           /* fabric is ours to cut only on our own custom garments */
    if (ready) $('agPiece').innerHTML = '<option value="">Choose the piece</option>' + (pieceOptions($('agPieceFind').value, agOwner()) || '<option value="">None in stock from this maker</option>');
    $('agPriceLbl').textContent = third && !ready ? 'The designer\'s price' : 'Value of this garment';
    $('agDueLbl').textContent = third ? 'Back from the designer by' : 'Back by';
    $('agRoute').textContent = third ? 'Goes to At the designers, on the designer\'s ladder.' : 'Goes to Our operations: operations gives it a master.';
    var out = $('agPriceIn'); if (out && out.dataset) delete out.dataset.touched;
    A.agPrice();
  };
  /* the suggested value, live: the readymade piece's price, or the fabric library; a designer's custom piece is typed */
  A.agPrice = function () {
    var $ = function (i) { return document.getElementById(i); }, out = $('agPriceIn'), why = $('agWhy');
    if (!out || !$('agMake')) return;
    var ready = $('agMake').value === 'readymade', third = !!($('agFrom') && $('agFrom').value);
    if (third && !ready) { if (why) why.textContent = 'What the designer charges for this piece.'; return; }
    var g = { kind: $('agKind').value, piece: ready ? $('agPiece').value : '',
      fabrics: !ready && $('agFab') && $('agFab').value ? [{ fabric: $('agFab').value, metres: Number($('agM').value) || 0 }] : [] };
    if (ready && g.piece) { var r = one(D().readymade, g.piece); if (r && r.kind) { $('agKind').value = r.kind; g.kind = r.kind; } }
    var sg = GE.garmentSuggest(g);
    if (!out.dataset.touched) out.value = sg.amount || '';
    if (why) why.textContent = sg.amount ? (ready ? 'The piece\'s price from the readymade stock. ' : 'From the fabric library: ' + sg.why + '. ') + 'Change it if this one is different.'
      : (ready ? 'Choose the piece: its price comes from the readymade stock.' : 'Choose the fabric: the value comes from the fabric library.');
  };
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'agPriceIn') e.target.dataset.touched = '1'; });
  A.saveGarment = function (oid) {
    var o = one(D().orders, oid);
    var el = function (i) { return document.getElementById(i); };
    var from = el('agFrom') ? el('agFrom').value : '';
    var ready = el('agMake').value === 'readymade', piece = ready && el('agPiece') ? el('agPiece').value : '';
    if (ready && !piece) { GE.toast('Choose the readymade piece from the stock.'); return; }
    var first = from ? 'Order confirmed' : 'Not started';
    var fabs = [];
    if (!ready && !from && el('agFab') && el('agFab').value)
      fabs.push({ fabric: el('agFab').value, metres: Number(el('agM').value) || 0 });
    var g = { id: GE.uid('G-'), order: oid, kind: el('agKind').value,
      make: el('agMake').value, stage: first, master: '', fabrics: fabs, piece: piece,
      due: el('agDue').value, designer: from,
      note: el('agNote').value, samples: [], designform: [],
      history: [{ stage: first, by: GE.me().id, at: GE.TODAY + 'T' + new Date().toTimeString().slice(0, 5) }] };
    var typed = Number(el('agPriceIn') && el('agPriceIn').value) || 0, sug = GE.garmentSuggest(g).amount;
    if (from && !piece) { g.price = typed; g.price_by = 'designer'; }
    else if (typed && typed !== sug) { g.price = typed; g.price_by = 'hand'; }   /* otherwise it follows the library or the piece */
    D().garments.push(g);
    GE.save(); GE.closeModal(); A.openOrder(oid);
    GE.toast('Added at ' + rupees(GE.garmentValue(g)) + (from ? ', going to ' + dgname(from) : ', going to our floor') + '. The order value is now ' + rupees(GE.orderMoney(oid).value) + '.');
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
      '</select></div>' + phoneField('npPhone', 'Mobile') + '</div>' +
      '<div class="f"><label>Login name</label><input id="npLogin"></div>' +
      '<p class="hint">The password is issued by the owner, never set here and never shown on a screen.</p>' +
      '<button class="btn gold" data-act="savePerson">Add them</button>');
  };
  A.savePerson = function () {
    var g = function (i) { return document.getElementById(i).value; };
    if (!g('npName')) { GE.toast('A name first.'); return; }
    var ph = readPhone('npPhone', false);
    if (ph === null) { GE.toast(g('npPhoneCc') === '+91' ? 'An Indian mobile is 10 digits, starting 6, 7, 8 or 9.' : 'Check the mobile number: 6 to 14 digits, without the country code.'); return; }
    D().people.push({ id: GE.uid('p-'), name: g('npName'), role: g('npRole'), login: g('npLogin'),
      phone: ph, reports: g('npRep'), lines: ['In-house'] });
    GE.save(); GE.closeModal(); GE.go('#/team');
    GE.toast('Added. What they can reach comes from their role.');
  };

})();
