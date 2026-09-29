/* The second board. After the PO, Production & Dispatch own the work: vendor
   POs, goods-in and QC, artwork approval, branding, kitting, split dispatch,
   invoice, payment. Each stage refuses to be entered until its prerequisite
   is true, so the board cannot claim something that has not happened. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS, esc = G.esc;
  var D = function () { return G.D(); };

  V.orders = function () {
    var list = D().orders.filter(G.inScope);
    var open = list.filter(GC.orderOpen);
    var risky = open.filter(function (o) { return GC.orderRisks(o).length; });
    var h = '<div class="ph"><div><h1>Orders</h1><p>' + open.length + ' in progress worth ' + GC.money(open.reduce(function (a, o) { return a + o.value; }, 0)) + '. Order watch checks every one of them for slipping dates.</p></div>' +
      '<div class="acts"><button class="btn agent" data-act="runWatch">◉ Run Order watch</button></div></div>';
    if (risky.length) h += '<div class="notice bad">' + risky.length + ' order' + (risky.length > 1 ? 's need' : ' needs') + ' attention — marked red or amber below.</div>';
    h += '<div class="board">' + GC.T.orderStages.map(function (s) {
      var col = list.filter(function (o) { return o.stage === s || (GC.T.orderStages.indexOf(o.stage) < 0 && s === GC.T.orderStages[0]); });
      if (s === 'Paid') col = col.filter(function (o) { return G.inRange(o.updated); });
      return '<div class="col"><h4 title="' + esc(GC.T.orderHelp[s] || '') + '">' + esc(s) + ' <small>' + col.length + '</small></h4>' + col.map(function (o) {
        var co = G.companyById(o.company), r = GC.orderRisks(o);
        var bad = r.some(function (x) { return x.sev === 'bad'; });
        return '<div class="deal' + (bad ? ' risk' : r.length ? ' warnl' : '') + '" data-act="go" data-id="#/order/' + o.id + '"><b>' + esc(o.no) + ' · ' + esc(co ? co.name : '') + '</b><span class="co">' + esc(o.title) + '</span>' +
          '<div class="foot"><span>' + GC.money(o.value) + '</span><span>' + (o.deadline ? esc(G.when(o.deadline)) : '') + '</span></div>' + (r.length ? '<div class="small" style="margin-top:4px;color:var(--' + (bad ? 'bad' : 'warn') + ')">' + esc(r[0].text) + '</div>' : '') + '</div>';
      }).join('') + (s === 'Paid' ? '<p class="small muted" style="padding:4px">Paid in the selected window. Change it on Reports.</p>' : '') + '</div>';
    }).join('') + '</div>';
    return h;
  };

  V.order = function (id) {
    var o = G.orderById(id);
    if (!o) return G.deny('No such order.', '');
    if (!G.canOpen(o)) return G.deny('This order belongs to ' + GC.staffName(o.assigned_to), 'Ask Production & Dispatch.');
    var co = G.companyById(o.company), ct = G.contactById(o.contact), risks = GC.orderRisks(o), cost = G.can('cost');
    var days = o.deadline ? GC.daysBetween(GC.today(), o.deadline) : null;
    var h = '<div class="stickyhead"><div class="ph"><div><p class="muted small"><a href="#/company/' + (co ? co.id : '') + '">' + esc(co ? co.name : '') + '</a> · PO ' + esc(o.po_no || '—') + (o.opp ? ' · <a href="#/opp/' + o.opp + '">the requirement</a>' : '') + '</p>' +
      '<h1>' + esc(o.no) + ' · ' + esc(o.title) + '</h1><p>' + G.pill(o.stage, o.stage === 'Paid' ? 'ok' : 'info') + ' ' + GC.rupees(o.value) + (cost ? ' · margin ' + GC.rupees(o.value / 1.18 - o.cost) : '') +
      (o.deadline ? ' · deliver by <b>' + esc(o.deadline) + '</b> ' + G.pill(days < 0 ? Math.abs(days) + ' days late' : days + ' days left', days < 0 ? 'bad' : days <= GC.T.rules.bufferDays ? 'warn' : 'dim') : '') + '</p></div>' +
      '<div class="acts"><a class="btn ghost" href="client.html#' + esc(o.token) + '" target="_blank">Client portal ↗</a>' + (o.picks ? '<a class="btn ghost" href="pick.html#' + esc(o.picks.code) + '" target="_blank">Employee picker ↗</a>' : '') + '</div></div>';
    h += '<div class="stagebar">' + GC.T.orderStages.map(function (s, i) {
      var cur = GC.T.orderStages.indexOf(o.stage);
      return '<button class="' + (s === o.stage ? 'on' : i < cur ? 'done' : '') + '" data-act="moveOrder" data-id="' + id + '|' + esc(s) + '" title="' + esc(GC.T.orderHelp[s] || '') + '">' + esc(s) + '</button>';
    }).join('') + '</div></div>';
    risks.forEach(function (r) { h += '<div class="notice ' + (r.sev === 'bad' ? 'bad' : 'warn') + '">' + esc(r.text) + (r.vendor != null && G.can('vendors') ? ' <button class="btn sm ghost" data-act="sourceFaster" data-id="' + id + '">⇄ Find a faster vendor</button>' : '') + '</div>'; });
    var waiting = D().proposals.filter(function (p) { return p.status === 'pending' && p.target && p.target.id === id; });
    waiting.forEach(function (p) { var a = AG.agentById(p.agent); h += '<div class="notice agent">' + a.icon + ' <b>' + esc(a.name) + '</b> ' + esc(p.summary) + ' <a class="btn agent sm" href="#/proposal/' + p.id + '">Review</a></div>'; });

    h += '<div class="split"><div>';
    h += '<div class="card pad0 scroller"><div class="hd"><h3>Lines</h3></div><table class="tbl"><thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Unit</th><th>Branding</th><th>Vendor PO</th></tr></thead><tbody>' + o.lines.map(function (l) {
      var po = null, pi = -1;
      o.vendorPOs.forEach(function (v, k) { if (v.pids.indexOf(l.pid) >= 0) { po = v; pi = k; } });
      return '<tr><td><a href="#" data-act="peekProduct" data-id="' + esc(l.pid) + '|order/' + id + '"><b>' + esc(l.name) + '</b></a><small>' + esc(l.vendor) + '</small></td><td class="num">' + GC.fmt(l.qty) + '</td><td class="num">₹' + GC.fmt(l.unit + l.brandCost) + '</td><td>' + esc(l.branding || '—') + '</td>' +
        '<td>' + (!po ? G.pill('not placed', 'warn')
          : po.status === 'received' ? G.pill('received', 'ok') + '<small>' + GC.fmt(l.qty) + ' pcs at ' + esc(po.receivedWh ? GC.branchName(D().warehouses, po.receivedWh) : 'warehouse') + (po.receivedAt ? ' · ' + esc(po.receivedAt) : '') + '</small>'
          : G.pill('due ' + po.eta, o.deadline && po.eta > o.deadline ? 'bad' : 'info') + '<small>' + esc(po.vendorName) + '</small><button class="minibtn" style="margin-top:4px" data-act="poReceived" data-id="' + id + '|' + pi + '">Mark received</button>') + '</td></tr>';
    }).join('') + '</tbody></table></div>';

    h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>Vendor POs</h3>' + (o.lines.some(function (l) { return !o.vendorPOs.some(function (v) { return v.pids.indexOf(l.pid) >= 0; }); }) ? '<button class="btn sm" data-act="placePOs" data-id="' + id + '">Place POs for every line</button>' : '') + '</div>' +
      (o.vendorPOs.length ? o.vendorPOs.map(function (v, i) {
        return '<div class="item"><div class="grow"><h4>' + esc(v.vendorName) + '</h4><p>' + v.pids.length + ' line · placed ' + esc(v.placed || '') + ' · promised <input type="date" data-chg="poEta" data-id="' + id + '|' + i + '" value="' + esc(v.eta || '') + '" style="width:auto;padding:3px 6px"></p></div>' +
          (v.status === 'received' ? G.pill('received ' + (v.receivedAt || ''), 'ok') : '<button class="minibtn" data-act="poReceived" data-id="' + id + '|' + i + '">Mark goods received</button>') + '</div>';
      }).join('') : G.empty('No vendor POs yet.')) + '</div>';

    h += '<div class="card" style="margin-top:14px"><h3>Dispatch</h3>' + (o.dispatches.length ? '<table class="tbl"><thead><tr><th>City</th><th class="num">Qty</th><th>AWB / vehicle</th><th>Status</th><th></th></tr></thead><tbody>' + o.dispatches.map(function (d, i) {
      return '<tr><td>' + esc(d.city) + '</td><td class="num">' + GC.fmt(d.qty) + '</td><td>' + esc(d.awb || '—') + '</td><td>' + G.pill(d.status, d.status === 'delivered' ? 'ok' : 'info') + '</td><td>' + (d.status !== 'delivered' ? '<button class="minibtn" data-act="dispDelivered" data-id="' + id + '|' + i + '">Delivered</button>' : '') + '</td></tr>';
    }).join('') + '</tbody></table>' : '<p class="muted small">Nothing dispatched yet. Split across as many locations as the client needs.</p>') +
      '<form class="row" data-submit="addDispatch" data-id="' + id + '" style="margin-top:10px"><input name="city" placeholder="City" style="max-width:140px"><input type="number" name="qty" placeholder="Qty" style="max-width:90px"><input name="awb" placeholder="AWB / vehicle" style="max-width:170px"><button class="btn sm">Add dispatch</button></form></div>';

    if (o.picks) {
      var pk = o.picks, by = {};
      pk.entries.forEach(function (e) { by[e.pid] = (by[e.pid] || 0) + 1; });
      h += '<div class="card" style="margin-top:14px"><h3>Employee choices · ' + pk.entries.length + ' of ' + pk.employees + '</h3><p class="muted small">Code <code>' + esc(pk.code) + '</code> · closes ' + esc(pk.closes) + ' · budget ₹' + GC.fmt(pk.budget) + '</p>' +
        '<table class="tbl"><tbody>' + pk.options.map(function (pid) { var p = G.P(pid); return '<tr><td>' + esc(p ? p.name : pid) + '</td><td class="num"><b>' + (by[pid] || 0) + '</b></td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="honest">Staff pick on their own link; the counts become the per-product quantities on the vendor POs.</p></div>';
    }
    h += '</div><div>';
    var aw = o.artwork;
    h += '<div class="card"><h3>Artwork</h3><p>' + G.pill(aw.status, aw.status === 'approved' ? 'ok' : aw.status === 'sent' ? 'warn' : 'dim') + ' ' + esc(aw.file || 'no file yet') + '</p>' +
      (aw.sent ? '<p class="small muted">Sent ' + esc(aw.sent) + (aw.approved ? ' · approved ' + esc(aw.approved) : '') + '</p>' : '') +
      '<div class="row">' + (aw.status !== 'approved' ? '<button class="btn sm" data-act="artSend" data-id="' + id + '">Send proof to client portal</button><button class="btn ghost sm" data-act="artApprove" data-id="' + id + '">Client approved</button>' : '') + '</div></div>';
    h += '<div class="card" style="margin-top:14px"><h3>Quality check</h3><p>' + G.pill(o.qc.status, o.qc.status === 'passed' ? 'ok' : o.qc.status === 'failed' ? 'bad' : 'dim') + ' ' + esc(o.qc.note || '') + '</p>' +
      '<div class="row"><button class="btn sm" data-act="qcPass" data-id="' + id + '">Passed</button><button class="btn ghost sm" data-act="qcFail" data-id="' + id + '">Failed…</button></div></div>';
    h += '<div class="card" style="margin-top:14px"><h3>Money</h3><dl class="kv"><dt>Order value</dt><dd>' + GC.rupees(o.value) + '</dd>' + (cost ? '<dt>Vendor cost</dt><dd>' + GC.rupees(o.cost) + '</dd>' : '') +
      '<dt>Invoice</dt><dd>' + (o.invoice ? esc(o.invoice.no) + ' · ' + esc(o.invoice.at) : '—') + '</dd><dt>Paid</dt><dd>' + (o.paid ? esc(o.paid.at) : '—') + '</dd></dl>' +
      (G.can('money') ? '<div class="row" style="margin-top:10px">' + (!o.invoice ? (o.dispatches.length && o.dispatches.every(function (d) { return d.status === 'delivered'; }) ? '<button class="btn sm" data-act="raiseInvoice" data-id="' + id + '">Raise invoice</button>' : '<span class="small muted">Invoice once every location has taken delivery.</span>') : !o.paid ? '<button class="btn sm" data-act="recordPayment" data-id="' + id + '">Record payment</button>' : '') + '</div>' : '<p class="honest">Invoices and payments are for Accounts.</p>') + '</div>';
    h += '<div class="card" style="margin-top:14px"><h3>History</h3><ul class="timeline">' + o.history.slice().reverse().map(function (x) { return '<li class="done"><b>' + esc(x.stage) + '</b>' + (x.note ? ' — ' + esc(x.note) : '') + '<small>' + esc(x.at) + ' · ' + esc(GC.staffName(x.by)) + '</small></li>'; }).join('') + '</ul></div>';
    h += '<div class="card" style="margin-top:14px"><h3>Client</h3><p>' + esc(ct ? ct.name + ' · ' + ct.role : '—') + '<br><span class="small muted">' + esc(ct ? G.mob(ct.mobile) : '') + '</span></p><p class="small muted">They follow this order on their portal link — stages, artwork proof, dispatch tracking.</p></div>';
    return h + '</div></div>';
  };

  /* ================= stock ================= */

  var STAB = 'warehouse', SQ = '';
  V.stock = function (tab) {
    STAB = tab || STAB;
    var db = G.db(), d = D();
    var h = '<div class="ph"><div><h1>Stock</h1><p>Samples in the office for client visits, ready stock in the warehouse, and every movement in and out.</p></div></div>';
    h += '<div class="tabs">' + [['warehouse', 'Warehouse'], ['samples', 'Samples in office'], ['moves', 'Movements']].map(function (t) { return '<a href="#/stock/' + t[0] + '" class="' + (STAB === t[0] ? 'on' : '') + '">' + t[1] + '</a>'; }).join('') + '</div>';
    if (STAB === 'samples') {
      var s = db.items.filter(function (it) { return it.attr.indexOf(5) >= 0 || (d.productEdits[it.id] || {}).sample === true; });
      if (SQ) s = s.filter(function (it) { return it.name.toLowerCase().indexOf(SQ.toLowerCase()) >= 0; });
      h += '<div class="row" style="margin-bottom:12px"><input data-input="sampleSearch" id="sampleSearch" value="' + esc(SQ) + '" placeholder="Search samples" style="max-width:300px"><span class="muted small">' + s.length + ' samples in ' + esc((d.warehouses.filter(function (w) { return w.kind === 'samples'; })[0] || {}).name || 'the office') + '</span></div>';
      h += '<div class="pgrid">' + s.slice(0, 60).map(function (it) { var p = G.P(it.id); return '<div class="pcard" data-act="go" data-id="#/product/' + esc(p.id) + '"><div class="img" style="height:80px;background:linear-gradient(135deg,hsl(' + p.hue + ',42%,52%),hsl(' + ((p.hue + 40) % 360) + ',50%,36%))">' + esc(p.category.charAt(0)) + '</div><div class="body"><span class="v">' + esc(p.vendorName) + '</span><b>' + esc(p.name) + '</b><div class="foot"><span class="price">₹' + GC.fmt(p.price) + '</span></div></div></div>'; }).join('') + '</div>';
      return h;
    }
    if (STAB === 'moves') {
      h += '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>When</th><th>Product</th><th>Type</th><th class="num">Qty</th><th>Ref</th><th>By</th></tr></thead><tbody>' +
        d.stockMoves.slice().sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }).map(function (m) {
          var p = G.P(m.pid);
          return '<tr data-act="go" data-id="#/product/' + esc(m.pid) + '"><td>' + esc(m.at) + '</td><td>' + esc(p ? p.name : m.pid) + '</td><td>' + G.pill(m.kind, m.qty > 0 ? 'ok' : 'info') + '</td><td class="num">' + (m.qty > 0 ? '+' : '') + GC.fmt(m.qty) + '</td><td>' + esc(m.ref) + '</td><td>' + esc(GC.staffName(m.by)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      return h;
    }
    var ids = Object.keys(d.warehouse);
    h += '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Product</th>' + d.warehouses.filter(function (w) { return w.kind !== 'samples'; }).map(function (w) { return '<th class="num">' + esc(w.name) + '</th>'; }).join('') + '<th class="num">Reserved for orders</th>' + (G.can('cost') ? '<th class="num">Value at cost</th>' : '') + '</tr></thead><tbody>' +
      ids.map(function (pid) {
        var p = G.P(pid); if (!p) return '';
        var res = d.orders.filter(GC.orderOpen).reduce(function (a, o) { return a + o.lines.filter(function (l) { return l.pid === pid; }).reduce(function (x, l) { return x + l.qty; }, 0); }, 0);
        var tot = Object.keys(d.warehouse[pid]).reduce(function (a, k) { return a + d.warehouse[pid][k]; }, 0);
        return '<tr data-act="go" data-id="#/product/' + esc(pid) + '"><td><b>' + esc(p.name) + '</b><small>' + esc(p.vendorName) + '</small></td>' + d.warehouses.filter(function (w) { return w.kind !== 'samples'; }).map(function (w) { return '<td class="num">' + GC.fmt(d.warehouse[pid][w.id] || 0) + '</td>'; }).join('') +
          '<td class="num">' + (res ? GC.fmt(res) : '—') + '</td>' + (G.can('cost') ? '<td class="num">' + GC.rupees(tot * p.cost) + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>';
    if (G.can('orders') || G.can('catalogue')) h += '<form class="card" data-submit="grn" style="margin-top:14px;max-width:760px"><h3>Goods in (GRN)</h3><div class="grid3">' +
      G.field('Product code', '<input name="pid" placeholder="RC-HMP-000123" required>') + G.field('Quantity', '<input type="number" name="qty" required>') +
      G.field('Warehouse', '<select name="wh">' + d.warehouses.filter(function (w) { return w.kind !== 'samples'; }).map(function (w) { return '<option value="' + w.id + '">' + esc(w.name) + '</option>'; }).join('') + '</select>') +
      G.field('Reference', '<input name="ref" placeholder="Vendor challan no.">') + '</div><button class="btn">Record goods in</button></form>';
    return h;
  };

  /* ================= actions ================= */

  function ord(id) { var p = String(id).split('|'); return [G.orderById(p[0]), p[1]]; }
  function hist(o, note) { o.history.push({ stage: o.stage, at: GC.today(), by: G.me().id, note: note }); o.updated = GC.today(); }
  Object.assign(A, {
    runWatch: function () { var r = G.runAgent('orderwatch', null, { manual: true }); G.toast('Order watch: ' + (r && r.length ? r.length + ' order(s) flagged — on the Agent Desk.' : 'nothing new.'), 'agent'); G.render(); },
    moveOrder: function (id) {
      var x = ord(id), r = GC.moveOrder(x[0], x[1], G.me().id);
      if (r.error) return G.toast(r.error, 'bad');
      G.log('order_stage', x[0].no + ' → ' + x[1], { order: x[0].id, company: x[0].company }); G.save(); G.render();
    },
    placePOs: function (id) {
      var o = G.orderById(id);
      o.lines.forEach(function (l) {
        if (o.vendorPOs.some(function (v) { return v.pids.indexOf(l.pid) >= 0; })) return;
        var p = G.P(l.pid);
        o.vendorPOs.push({ id: GC.uid('vp'), vendor: p.vendor, vendorName: p.vendorName, pids: [l.pid], eta: GC.addDays(GC.today(), p.lead), status: 'placed', placed: GC.today() });
      });
      if (o.stage === GC.T.orderStages[0]) GC.moveOrder(o, GC.T.orderStages[1], G.me().id);
      G.log('vpo', 'Vendor POs placed for ' + o.no, { order: id }); G.save(); G.render();
      var w = G.runAgent('orderwatch'); if (w && w.length) G.toast('Order watch flagged a vendor date — see the notice.', 'agent');
    },
    poEta: function (v, el) { var p = el.dataset.id.split('|'), o = G.orderById(p[0]); o.vendorPOs[+p[1]].eta = v; G.log('order_edit', o.no + ': ' + o.vendorPOs[+p[1]].vendorName + ' now promises ' + v, { order: o.id }); G.save(); G.render(); },
    poReceived: function (id) {
      var p = id.split('|'), o = G.orderById(p[0]), v = o.vendorPOs[+p[1]];
      var wh = (D().warehouses.filter(function (w) { return w.kind !== 'samples'; })[0] || {}).id || 'w2';
      v.status = 'received'; v.receivedAt = GC.today(); v.receivedWh = wh;
      v.pids.forEach(function (pid) {
        var l = o.lines.filter(function (x) { return x.pid === pid; })[0];
        var w = D().warehouse[pid] = D().warehouse[pid] || {}; w[wh] = (w[wh] || 0) + (l ? l.qty : 0);
        D().stockMoves.push({ id: GC.uid('sm'), pid: pid, qty: l ? l.qty : 0, kind: 'GRN', ref: o.no, wh: wh, at: GC.today(), by: G.me().id });
      });
      hist(o, 'Goods received from ' + v.vendorName + ' at ' + GC.branchName(D().warehouses, wh)); G.log('stock', 'Goods received for ' + o.no + ' from ' + v.vendorName, { order: o.id }); G.save(); G.toast('Received and counted into ' + GC.branchName(D().warehouses, wh) + '.'); G.render();
    },
    artSend: function (id) { var o = G.orderById(id); o.artwork.status = 'sent'; o.artwork.sent = GC.today(); o.artwork.file = o.artwork.file || (o.no + '-proof.pdf'); hist(o, 'Artwork proof on the client portal'); G.log('order_edit', o.no + ': artwork proof sent to the client portal', { order: id }); G.save(); G.render(); },
    artApprove: function (id) { var o = G.orderById(id); o.artwork.status = 'approved'; o.artwork.approved = GC.today(); hist(o, 'Artwork approved'); G.log('order_edit', o.no + ': artwork approved', { order: id }); G.save(); G.render(); },
    qcPass: function (id) { var o = G.orderById(id); o.qc = { status: 'passed', note: '' }; hist(o, 'QC passed'); G.log('order_edit', o.no + ': QC passed', { order: id }); G.save(); G.render(); },
    qcFail: function (id) {
      var n = window.prompt('What failed QC?'); if (!n) return;
      var o = G.orderById(id); o.qc = { status: 'failed', note: n }; hist(o, 'QC failed: ' + n); G.log('order_edit', o.no + ': QC failed — ' + n, { order: id }); G.save();
      G.runAgent('orderwatch'); G.render();
    },
    addDispatch: function (f, form) {
      var o = G.orderById(form.dataset.id);
      if (!f.city || !(+f.qty > 0)) return G.toast('City and quantity, please.', 'bad');
      o.dispatches.push({ city: f.city, qty: +f.qty, awb: f.awb, status: 'in transit', at: GC.today() });
      if (GC.T.orderStages.indexOf(o.stage) < GC.T.orderStages.indexOf('Dispatched')) { var r = GC.moveOrder(o, 'Dispatched', G.me().id); if (r.error) G.toast('Dispatch logged, but the order stays at ' + o.stage + ': ' + r.error, 'bad'); }
      hist(o, 'Dispatched ' + f.qty + ' to ' + f.city); G.log('dispatch', o.no + ': ' + f.qty + ' dispatched to ' + f.city, { order: o.id }); G.save(); G.render();
    },
    dispDelivered: function (id) {
      var p = id.split('|'), o = G.orderById(p[0]); o.dispatches[+p[1]].status = 'delivered';
      if (o.dispatches.every(function (d) { return d.status === 'delivered'; }) && o.stage === 'Dispatched') GC.moveOrder(o, 'Delivered', G.me().id);
      hist(o, o.dispatches[+p[1]].city + ' delivered'); G.log('dispatch', o.no + ': ' + o.dispatches[+p[1]].city + ' delivered', { order: o.id }); G.save(); G.render();
    },
    raiseInvoice: function (id) {
      var o = G.orderById(id);
      o.invoice = { no: 'INV/26-27/' + String(200 + D().orders.filter(function (x) { return x.invoice; }).length).padStart(4, '0'), at: GC.today(), amount: o.value };
      var r = GC.moveOrder(o, 'Invoiced', G.me().id);
      if (r.error) { G.toast('Invoice raised; the order stays at ' + o.stage + ' — ' + r.error); }
      G.log('invoice', o.no + ': invoice ' + o.invoice.no + ' raised for ' + GC.rupees(o.value), { order: o.id }); G.save(); G.render();
    },
    recordPayment: function (id) {
      var o = G.orderById(id); o.paid = { at: GC.today() };
      var r = GC.moveOrder(o, 'Paid', G.me().id);
      if (r.error) return G.toast(r.error, 'bad');
      G.log('invoice', o.no + ': payment received', { order: o.id }); G.save(); G.toast('Paid. The order is complete.'); G.render();
    },
    sampleSearch: function (v) { SQ = v; G.render(); },
    grn: function (f) {
      var p = G.P(String(f.pid || '').trim().toUpperCase()); if (!p) return G.toast('No product with that code.', 'bad');
      var q = +f.qty; if (!(q > 0)) return G.toast('Quantity must be more than zero.', 'bad');
      var w = D().warehouse[p.id] = D().warehouse[p.id] || {}; w[f.wh] = (w[f.wh] || 0) + q;
      D().stockMoves.push({ id: GC.uid('sm'), pid: p.id, qty: q, kind: 'GRN', ref: f.ref || '—', wh: f.wh, at: GC.today(), by: G.me().id });
      G.log('stock', 'Goods in: ' + q + ' × ' + p.name, { product: p.id }); G.save(); G.toast('Recorded.'); G.render();
    }
  });
})();
