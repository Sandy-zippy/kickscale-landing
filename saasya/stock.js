/* Stock: every physical piece with its own barcode, receiving goods, labels and the scanner.
   Sales and purchases both move these same records, so the shelf and the books agree. */
(function () {
  var V = GE.VIEWS, A = GE.ACTIONS, U = GE.ui;
  var esc = GE.esc, rupees = GE.rupees, d = GE.d, one = GE.one, by = GE.by, sum = GE.sum;
  function D() { return GE.D; }
  function who(sup) { if (sup === 'Sasya') return 'Saasya Men'; var dz = one(D().designers, sup) || one(D().vendors, sup); return dz ? dz.name : '—'; }
  var SOURCES = { 'own': 'Our own make', 'on-order': 'On-order purchase', 'consignment': 'Consignment', 'for-order': 'Made for an order' };
  var STATUSES = ['In stock', 'Reserved', 'On approval', 'Sold', 'Returned', 'All'];
  function statusPill(p) {
    var cls = { 'in stock': 'ok', 'reserved': 'gold', 'on approval': 'warn', 'sold': '', 'returned': 'bad' }[p.status] || '';
    return U.pill(p.status, cls);
  }
  function seeCost() { return GE.can('cost') === true; }
  function daysHeld(p) { return GE.days(p.received, p.returned_at || p.sold_at || GE.localToday()); }
  GE.pieceStatusPill = statusPill; GE.whoSupplies = who;

  V['#/stock'] = function () {
    var st = GE.Q['#/stock.st'] || 'In stock', src = GE.Q['#/stock.src'] || '';
    var all = D().pieces.filter(function (p) { return !src || p.source === src; });
    var inSt = all.filter(function (p) { return st === 'All' || p.status === st.toLowerCase(); });
    var list = inSt.filter(function (p) {
      return GE.matches(U.q('#/stock'), [p.barcode, p.name, p.code, p.kind, p.size, who(p.supplier), SOURCES[p.source], p.order, p.location]);
    });
    var stock = D().pieces.filter(function (p) { return p.status === 'in stock'; });
    var month = GE.localToday().slice(0, 7);
    var h = U.head('Readymade stock', 'Every piece on the shelf, one barcode each. A piece sold on an opportunity leaves here by itself; a piece received comes in here first.',
      '<button class="btn gold" data-act="receiveGoods">Receive goods</button> <button class="btn alt" data-act="printLabels" data-id="filtered">Print labels</button>');
    h += '<div class="kpis">' + U.kpi(stock.length, 'Pieces in stock', 'store and godown') +
      (seeCost() ? U.kpi(GE.lakh(sum(stock, GE.pieceCost)), 'At cost to us', 'consignment at the designer’s share') : '') +
      U.kpi(GE.lakh(sum(stock, function (p) { return GE.withGst(GE.piecePrice(p), p.gst); })), 'At MRP', 'selling price with GST') +
      U.kpi(D().pieces.filter(function (p) { return p.status === 'reserved'; }).length, 'Reserved for orders', 'held for a client') +
      U.kpi(D().pieces.filter(function (p) { return p.status === 'sold' && String(p.sold_at).slice(0, 7) === month; }).length, 'Sold this month', '') + '</div>';
    h += '<div class="scanrow"><label for="stockScan">Scan a barcode</label><input id="stockScan" class="scan" placeholder="Scan or type a barcode, then Enter" autocomplete="off" data-scan="1"></div>';
    h += '<div class="tabs">' + STATUSES.map(function (t) {
      var c = t === 'All' ? all.length : all.filter(function (p) { return p.status === t.toLowerCase(); }).length;
      return '<button class="' + (t === st ? 'on' : '') + '" data-act="stockTab" data-id="' + t + '">' + t + ' <span class="sub">' + c + '</span></button>';
    }).join('') + '<select data-change="stockSrc" aria-label="Where it came from" style="width:auto;margin-left:auto"><option value="">Every source</option>' +
      Object.keys(SOURCES).map(function (k) { return '<option value="' + k + '"' + (k === src ? ' selected' : '') + '>' + SOURCES[k] + '</option>'; }).join('') + '</select></div>';
    h += U.searchBar('#/stock', 'Search a barcode, a piece, a size, a designer', list.length, inSt.length);
    h += '<div class="card" style="overflow-x:auto"><table><thead><tr><th>Barcode</th><th>Piece</th><th>Size</th><th>From</th><th>Received</th>' +
      (seeCost() ? '<th class="num">Cost before GST</th>' : '') + '<th class="num">Price before GST</th><th class="num">MRP</th><th>Status</th></tr></thead><tbody>';
    list.forEach(function (p) {
      h += '<tr class="click" data-act="openPiece" data-id="' + p.id + '"><td><code>' + esc(p.barcode) + '</code></td>' +
        '<td><b>' + esc(p.name) + '</b><div class="sub">' + esc(p.kind.split(' / ')[0]) + ' · ' + esc(p.location) + '</div></td><td>' + esc(p.size || '—') + '</td>' +
        '<td>' + esc(who(p.supplier)) + '<div class="sub">' + esc(SOURCES[p.source] || '') + '</div></td>' +
        '<td>' + d(p.received) + '<div class="sub">' + daysHeld(p) + ' days</div></td>' +
        (seeCost() ? '<td class="num">' + (p.source === 'consignment' ? '<span class="sub">on sale</span>' : rupees(p.cost_ex)) + '</td>' : '') +
        '<td class="num">' + rupees(GE.piecePrice(p)) + '</td><td class="num">' + rupees(GE.withGst(GE.piecePrice(p), p.gst)) + '</td>' +
        '<td>' + statusPill(p) + (p.order ? '<div class="sub">' + esc(p.order) + '</div>' : '') + '</td></tr>';
    });
    if (!list.length) h += '<tr><td colspan="9" class="sub">Nothing here.</td></tr>';
    return h + '</tbody></table></div><p class="hint">Consignment pieces cost us nothing until they sell; then the designer’s share, 70% of the price before GST, is what they cost.</p>';
  };
  A.stockTab = function (t) { GE.Q['#/stock.st'] = t; GE.refresh(); };
  A.stockSrc = function (id, el) { GE.Q['#/stock.src'] = el.value; GE.refresh(); };

  A.openPiece = function (id) {
    var p = one(D().pieces, id); if (!p) return;
    var pur = p.purchase && one(D().purchases, p.purchase);
    var h = '<div class="dstick"><h1>' + esc(p.name) + '</h1>' + statusPill(p) + '</div>' +
      '<p class="sub">' + esc(p.kind) + ' · size ' + esc(p.size || '—') + ' · ' + esc(who(p.supplier)) + ' · ' + esc(SOURCES[p.source] || '') + '</p>';
    h += '<div class="card label-preview"><svg class="bc" data-code="' + esc(p.barcode) + '"></svg><div><b>' + esc(p.barcode) + '</b><div class="sub">MRP ' + rupees(GE.withGst(GE.piecePrice(p), p.gst)) + ' incl. GST</div></div>' +
      '<button class="mini" data-act="printLabels" data-id="' + p.id + '">Print its label</button></div>';
    h += '<div class="card"><div class="three">' +
      (seeCost() ? U.fld('Cost before GST', p.source === 'consignment' ? 'Not ours till sold' : rupees(p.cost_ex)) +
        U.fld('Cost after GST', p.source === 'consignment' ? '—' : rupees(GE.withGst(p.cost_ex, p.gst))) : '') +
      U.fld('Price before GST', rupees(GE.piecePrice(p))) + U.fld('MRP, after GST', rupees(GE.withGst(GE.piecePrice(p), p.gst))) +
      U.fld('GST', p.gst + '%') + U.fld('Received', d(p.received) + ', ' + daysHeld(p) + ' days ' + (p.status === 'in stock' ? 'on the shelf' : 'held')) +
      U.fld('Where', p.location) + (pur ? U.fld('Came in on', pur.id + (pur.bill ? ', bill ' + pur.bill : '')) : '') +
      (p.order ? U.fld('For order', p.order + (one(D().orders, p.order) ? ', ' + GE.ui.cname(one(D().orders, p.order).client) : '')) : '') +
      (p.status === 'returned' ? U.fld('Returned', d(p.returned_at) + ', after ' + daysHeld(p) + ' days') : '') +
      (p.status === 'sold' ? U.fld('Sold', d(p.sold_at)) : '') + '</div></div>';
    var acts = '';
    if (p.status === 'in stock') {
      acts += '<button class="mini" data-act="pieceApproval" data-id="' + p.id + '">Out on approval</button> ';
      if (p.source === 'on-order' || p.source === 'consignment') acts += '<button class="mini" data-act="pieceReturn" data-id="' + p.id + '">Return to ' + esc(who(p.supplier)) + '</button> ';
      acts += '<button class="mini" data-act="pieceMove" data-id="' + p.id + '">Move to ' + (p.location === 'Store' ? 'Godown' : 'Store') + '</button>';
    }
    if (p.status === 'on approval') acts += '<button class="mini" data-act="pieceBack" data-id="' + p.id + '">Back from approval</button>';
    if (p.order) acts += ' <button class="mini" data-act="openOrder" data-id="' + p.order + '">Open the order</button>';
    if (acts) h += '<div class="card"><div class="cardhead"><h3>What happens to it</h3></div>' + acts + '</div>';
    h += '<div class="card"><h3>Its story</h3><div class="tl">' + (p.history || []).slice().reverse().map(function (e) {
      return '<div class="ev"><b>' + esc(e.what) + '</b><span>' + GE.dt(e.at) + ' · ' + esc(GE.ui.pname(e.by)) + '</span></div>'; }).join('') + '</div></div>';
    GE.drawer(h); drawBarcodes();
  };
  function stamp(p, what) { (p.history = p.history || []).push({ what: what, by: GE.me().id, at: GE.localToday() + 'T' + new Date().toTimeString().slice(0, 5) }); }
  A.pieceMove = function (id) { var p = one(D().pieces, id); p.location = p.location === 'Store' ? 'Godown' : 'Store'; stamp(p, 'Moved to the ' + p.location.toLowerCase()); GE.save(); A.openPiece(id); };
  A.pieceApproval = function (id) {
    GE.modal('<h2>Out on approval</h2><p class="sub">He takes it home to decide. It stays ours, out of stock, until it comes back or he keeps it.</p>' +
      '<div class="f"><label>Who has it</label><select id="apClient">' + D().clients.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
      '<button class="btn gold" data-act="savePieceApproval" data-id="' + id + '">Send it out</button>');
  };
  A.savePieceApproval = function (id) {
    var p = one(D().pieces, id), c = one(D().clients, document.getElementById('apClient').value);
    p.status = 'on approval'; p.approval = { client: c.id, at: GE.localToday() }; stamp(p, 'Out on approval with ' + c.name);
    GE.save(); GE.closeModal(); A.openPiece(id); GE.toast(p.barcode + ' is out on approval with ' + c.name + '.');
  };
  A.pieceBack = function (id) { var p = one(D().pieces, id); p.status = 'in stock'; stamp(p, 'Back from approval'); p.approval = null; GE.save(); A.openPiece(id); GE.toast('Back on the shelf.'); };
  A.pieceReturn = function (id) {
    var p = one(D().pieces, id);
    GE.modal('<h2>Return to ' + esc(who(p.supplier)) + '</h2><p class="sub">' + esc(p.barcode + ' · ' + p.name) + '. Received ' + d(p.received) + ', ' + daysHeld(p) + ' days ago.</p>' +
      '<div class="f"><label>Why</label><input id="prWhy" placeholder="Not moving in this size"></div>' +
      '<button class="btn gold" data-act="savePieceReturn" data-id="' + id + '">Return it</button>');
  };
  A.savePieceReturn = function (id) {
    var p = one(D().pieces, id);
    p.status = 'returned'; p.returned_at = GE.localToday(); stamp(p, 'Returned to ' + who(p.supplier) + ' after ' + daysHeld(p) + ' days' + (document.getElementById('prWhy').value ? ': ' + document.getElementById('prWhy').value : ''));
    GE.save(); GE.closeModal(); A.openPiece(id); GE.toast(p.barcode + ' returned after ' + daysHeld(p) + ' days. It comes off what we owe.');
  };

  /* ---------- receive goods ---------- */
  function awaited() {   /* a designer's custom outfit on an order, not yet with us */
    return D().garments.filter(function (g) {
      var o = one(D().orders, g.order);
      return o && GE.isThird(g) && !g.piece && g.make !== 'readymade' && o.stage !== 'Delivered' && o.stage !== 'Lost';
    });
  }
  GE.awaited = awaited;
  A.receiveGoods = function () {
    var aw = awaited();
    GE.modal('<h2>Receive goods</h2><p class="sub">Each piece gets its own barcode. Print the labels when you save.</p>' +
      '<div class="f"><label>What is coming in</label><select id="rgType" data-change="rgSwitch">' +
      '<option value="on-order">On-order purchase from a designer</option><option value="consignment">Consignment from a designer</option>' +
      '<option value="own">Our own make</option>' + (aw.length ? '<option value="for-order">A designer piece made for an order</option>' : '') + '</select></div>' +
      '<div id="rgOrder" hidden><div class="f"><label>For which order</label><select id="rgGarment" data-change="rgPick">' +
      aw.map(function (g) { var o = one(D().orders, g.order); return '<option value="' + g.id + '">' + esc(g.order + ' · ' + GE.ui.cname(o.client) + ' · ' + g.kind + ' · ' + GE.ui.dgname(g.designer)) + '</option>'; }).join('') +
      '</select><div class="hint">It goes into stock reserved for that client, and the order shows what he has paid so far.</div></div></div>' +
      '<div id="rgSupWrap" class="two"><div class="f"><label>From</label><select id="rgSup">' +
      D().designers.map(function (dz) { return '<option value="' + dz.id + '">' + esc(dz.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Their bill or challan number</label><input id="rgBill"></div></div>' +
      '<div id="rgTerms" class="two"><div class="f"><label>Credit period, days</label><input type="number" id="rgCredit" value="60"></div>' +
      '<div class="f"><label>Advance paid to them</label><input type="number" id="rgAdv" value="0"></div></div>' +
      '<div class="two"><div class="f"><label>Piece</label><input id="rgName" placeholder="Velvet bandhgala, midnight"></div>' +
      '<div class="f"><label>Kind</label><select id="rgKind">' + GE.KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="f"><label>Sizes, one piece each</label><input id="rgSizes" placeholder="38, 40, 40, 42"><div class="hint">Four sizes listed make four pieces, each with its own barcode.</div></div>' +
      '<div class="three"><div class="f" id="rgCostWrap"><label>Cost before GST</label><input type="number" id="rgCost"></div>' +
      '<div class="f"><label>Price before GST</label><input type="number" id="rgPrice"></div>' +
      '<div class="f"><label>GST %</label><input type="number" id="rgGst" value="18"></div></div>' +
      '<div class="two"><div class="f"><label>Received on</label><input type="date" id="rgAt" value="' + GE.localToday() + '"></div>' +
      '<div class="f"><label>Where it goes</label><select id="rgLoc"><option>Store</option><option>Godown</option></select></div></div>' +
      '<button class="btn gold" data-act="saveReceive">Receive and make the barcodes</button>');
    A.rgSwitch();
  };
  A.rgSwitch = function () {
    var $ = function (i) { return document.getElementById(i); }; if (!$('rgType')) return;
    var t = $('rgType').value;
    $('rgOrder').hidden = t !== 'for-order';
    $('rgSupWrap').hidden = t === 'own' || t === 'for-order';
    $('rgTerms').hidden = t !== 'on-order';
    $('rgCostWrap').hidden = t === 'consignment';
    if (t === 'for-order') A.rgPick();
  };
  A.rgPick = function () {
    var $ = function (i) { return document.getElementById(i); };
    var g = one(D().garments, $('rgGarment') && $('rgGarment').value); if (!g) return;
    $('rgName').value = g.kind.split(' / ')[0] + ' for ' + g.order; $('rgKind').value = g.kind; $('rgPrice').value = GE.garmentValue(g); $('rgSizes').value = 'made to measure';
  };
  A.saveReceive = function () {
    var v = function (i) { var e = document.getElementById(i); return e ? e.value : ''; };
    var t = v('rgType'), at = v('rgAt') || GE.localToday();
    if (!v('rgName').trim()) { GE.toast('Name the piece.'); return; }
    if (!(Number(v('rgPrice')) > 0)) { GE.toast('Put in the price before GST.'); return; }
    var spec = { source: t, name: v('rgName').trim(), kind: v('rgKind'), sizes: t === 'for-order' ? '' : v('rgSizes'), size: t === 'for-order' ? 'made to measure' : '',
      cost_ex: v('rgCost'), price_ex: v('rgPrice'), gst: v('rgGst'), at: at, location: v('rgLoc') };
    var g = null;
    if (t === 'own') spec.supplier = 'Sasya';
    else if (t === 'for-order') { g = one(D().garments, v('rgGarment')); spec.supplier = g.designer; spec.qty = 1; }
    else {
      spec.supplier = v('rgSup');
      var pur = { id: (t === 'on-order' ? 'PUR-' : 'CON-') + ('0' + (D().purchases.filter(function (x) { return x.type === t; }).length + 1)).slice(-2), type: t, supplier: spec.supplier, at: at,
        credit_days: t === 'on-order' ? Number(v('rgCredit')) || 60 : 0, advance: t === 'on-order' ? Number(v('rgAdv')) || 0 : 0, bill: v('rgBill'), note: '' };
      while (one(D().purchases, pur.id)) pur.id += 'b';
      D().purchases.push(pur); spec.purchase = pur.id;
      if (pur.advance > 0) (D().supplier_payments = D().supplier_payments || []).push({ id: GE.uid('SP-'), supplier: pur.supplier, kind: 'on-order', purchase: pur.id,
        amount: pur.advance, at: at, mode: 'Net transfer', ref: '', note: 'Advance with the order', advance: true, by: GE.me().id });
    }
    var made = GE.receivePieces(spec);
    if (g) { g.piece = made[0].id; made[0].history[0].what = 'Received from ' + GE.ui.dgname(g.designer) + ' for ' + g.order; GE.moveGarment(g.id, 'Received and checked'); GE.save(); }
    GE.closeModal(); GE.go('#/stock');
    GE.toast(made.length + (made.length === 1 ? ' piece' : ' pieces') + ' received: ' + made.map(function (p) { return p.barcode; }).join(', ') + (g ? '. Linked to ' + g.order + '.' : '.'));
    A.printLabels(made.map(function (p) { return p.id; }).join(','), true);
  };

  /* ---------- labels and barcodes ---------- */
  var JSB = 'https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js';
  function drawBarcodes() {
    var go = function () { [].forEach.call(document.querySelectorAll('svg.bc[data-code]'), function (el) {
      try { window.JsBarcode(el, el.getAttribute('data-code'), { format: 'CODE128', height: 46, width: 1.6, fontSize: 12, margin: 4, background: 'transparent' }); } catch (e) {} }); };
    if (window.JsBarcode) return go();
    if (!document.head || document.getElementById('jsbLoad')) return;
    var sc = document.createElement('script'); sc.id = 'jsbLoad'; sc.src = JSB; sc.onload = go; document.head.appendChild(sc);
  }
  GE.drawBarcodes = drawBarcodes;
  A.printLabels = function (ids, quiet) {
    var list;
    if (ids === 'filtered') { var st = GE.Q['#/stock.st'] || 'In stock'; list = D().pieces.filter(function (p) { return st === 'All' || p.status === st.toLowerCase(); }); }
    else list = String(ids || '').split(',').map(function (i) { return one(D().pieces, i); }).filter(Boolean);
    if (!list.length) { GE.toast('No pieces to label.'); return; }
    var w = window.open('', '_blank');
    if (!w) { if (!quiet) GE.toast('Allow pop-ups for this site to print labels.'); return; }
    w.document.write('<!doctype html><meta charset="utf-8"><title>Saasya Men labels</title><style>body{font:11px Arial,sans-serif;margin:8mm}' +
      '.g{display:grid;grid-template-columns:repeat(3,62mm);gap:4mm}.l{border:1px dashed #bbb;padding:3mm;height:32mm;box-sizing:border-box}' +
      '.l b{display:block;font-size:10px;letter-spacing:.14em}.l .n{font-size:11px;margin:1mm 0}.l svg{width:100%;height:14mm}@media print{.l{border:0}}</style>' +
      '<div class="g">' + list.map(function (p) {
        return '<div class="l"><b>SAASYA MEN</b><div class="n">' + esc(p.name) + (p.size ? ', size ' + esc(p.size) : '') + '</div>' +
          '<div>MRP ' + rupees(GE.withGst(GE.piecePrice(p), p.gst)) + ' incl. GST</div><svg class="bc" data-code="' + esc(p.barcode) + '"></svg></div>'; }).join('') + '</div>' +
      '<script src="' + JSB + '"><\/script><script>document.querySelectorAll("svg.bc").forEach(function(e){JsBarcode(e,e.getAttribute("data-code"),{format:"CODE128",height:40,width:1.4,fontSize:11,margin:2})});setTimeout(function(){window.print()},300)<\/script>');
    w.document.close();
  };

  /* ================= Fabric stock: our own metres, bought on bills ================= */
  V['#/fabricstock'] = function () {
    var fabs = D().fabrics.filter(function (f) { var st = GE.stockOf(f.id); return st.in > 0 || st.reserved > 0; });
    var list = fabs.filter(function (f) { var v = one(D().vendors, f.vendor); return GE.matches(U.q('#/fabricstock'), [f.brand, f.colour, f.pattern, v && v.name]); });
    var cost = seeCost(), price = GE.canPrice();
    var h = U.head('Fabric stock', 'The cloth we own and hold here, from purchase bills: metres in, cut, promised to garments, free. The selling price a metre is what an order picks up.',
      '<button class="btn gold" data-act="receiveFabric">Receive fabric</button>');
    h += '<div class="kpis">' + U.kpi(Math.round(sum(fabs, function (f) { return GE.stockOf(f.id).hand; })) + ' m', 'On hand', fabs.length + ' cloths') +
      (cost ? U.kpi(GE.lakh(sum(fabs, function (f) { var st = GE.stockOf(f.id); return st.hand * st.avgCost; })), 'At cost', 'what it cost us') : '') +
      U.kpi(GE.lakh(sum(fabs, function (f) { return GE.stockOf(f.id).hand * GE.sellOf(f); })), 'At our selling price', 'before GST') +
      U.kpi(fabs.filter(function (f) { return GE.stockOf(f.id).low; }).length, 'Under the notify mark', 'The Bolt is watching') + '</div>';
    h += '<div class="card"><div class="cardhead"><h3>How fabric is priced</h3><span class="sub">set by the owner or the BDM</span></div><p>An outfit is the fabric at our selling price a metre (GST 5%), plus its stitching and design charge from <a href="#/stitching">Stitching charges</a> (GST 18%). ' +
      'A cloth with no selling price sells at its cost times ' + (price ? '<input type="number" min="1" step="0.1" style="width:70px" value="' + (D().priceRule.markup || 1.6) + '" data-change="setPriceRule" aria-label="Markup on cost">' : '<b>' + (D().priceRule.markup || 1.6) + '</b>') + '.</p></div>';
    h += U.searchBar('#/fabricstock', 'Search a brand, a colour, a vendor', list.length, fabs.length);
    h += '<div class="card" style="overflow-x:auto"><table><thead><tr><th>Cloth</th><th>Vendor</th><th class="num">In</th><th class="num">Cut</th><th class="num">Promised</th><th class="num">On hand</th><th class="num">Free</th>' +
      (cost ? '<th class="num">Cost a metre</th>' : '') + '<th class="num">Selling a metre</th><th></th></tr></thead><tbody>';
    list.forEach(function (f) {
      var st = GE.stockOf(f.id), v = one(D().vendors, f.vendor);
      h += '<tr><td><b>' + esc(f.brand) + '</b><div class="sub">' + esc(f.colour + ' · ' + f.pattern) + '</div></td><td>' + esc(v ? v.name : '') + '</td>' +
        '<td class="num">' + st.in + ' m</td><td class="num">' + st.cut + ' m</td><td class="num">' + st.reserved + ' m</td><td class="num"><b>' + st.hand + ' m</b>' + (st.low ? ' ' + U.pill('low', 'bad') : '') + '</td>' +
        '<td class="num">' + (st.available < 0 ? U.pill(st.available + ' m', 'bad') : st.available + ' m') + '</td>' +
        (cost ? '<td class="num">' + rupees(st.avgCost) + '</td>' : '') +
        '<td class="num">' + (price ? '<input type="number" min="0" step="100" style="width:110px" value="' + (Number(f.sell_m) || '') + '" placeholder="' + GE.sellOf(f) + '" data-change="setSellM" data-id="' + f.id + '" aria-label="Selling price a metre">' : rupees(GE.sellOf(f))) + '</td>' +
        '<td><button class="mini" data-act="receiveFabric" data-id="' + f.id + '">Receive</button> <button class="mini" data-act="openFabric" data-id="' + f.id + '">Open</button></td></tr>';
    });
    if (!list.length) h += '<tr><td colspan="10" class="sub">No fabric in stock. Receive some.</td></tr>';
    h += '</tbody></table></div>';
    var lots = D().fabric_lots.filter(function (l) { return l.bill !== 'Opening stock'; }).slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    h += '<div class="card"><h3>Fabric purchases</h3><table><thead><tr><th>Received</th><th>Cloth</th><th>Vendor</th><th>Their bill</th><th class="num">Metres</th>' + (cost ? '<th class="num">Cost a metre</th><th class="num">Bill with 5% GST</th>' : '') + '</tr></thead><tbody>' +
      (lots.length ? lots.map(function (l) { var f = one(D().fabrics, l.fabric) || {}, v = one(D().vendors, l.vendor);
        return '<tr><td>' + d(l.at) + '</td><td>' + esc((f.brand || '') + ' ' + (f.colour || '')) + '</td><td>' + esc(v ? v.name : '') + '</td><td class="sub">' + esc(l.bill || '') + '</td><td class="num">' + l.metres + ' m</td>' +
          (cost ? '<td class="num">' + rupees(l.cost_m) + '</td><td class="num">' + rupees(GE.withGst(l.metres * l.cost_m, l.gst)) + '</td>' : '') + '</tr>'; }).join('')
        : '<tr><td colspan="7" class="sub">None since the opening stock.</td></tr>') + '</tbody></table></div>';
    return h;
  };
  A.receiveFabric = function (fid) {
    GE.modal('<h2>Receive fabric</h2><p class="sub">From a vendor’s bill. It goes into our stock, and into what we owe them.</p>' +
      '<div class="f"><label>Which cloth</label><input type="search" id="rfFind" class="pickfind" placeholder="Type a brand, colour or pattern" data-input="rfFind" autocomplete="off">' +
      '<select id="rfFab" data-change="rfPick">' + D().fabrics.map(function (f) { var v = one(D().vendors, f.vendor); return '<option value="' + f.id + '"' + (f.id === fid ? ' selected' : '') + '>' + esc(f.brand + ' ' + f.colour + ', ' + f.pattern + ' · ' + (v ? v.name : '')) + '</option>'; }).join('') + '</select>' +
      '<div class="hint">Not in the library? Add it in the Fabric library first.</div></div>' +
      '<div class="three"><div class="f"><label>Metres</label><input type="number" step="0.1" id="rfM"></div>' +
      '<div class="f"><label>Cost a metre</label><input type="number" id="rfCost"></div><div class="f"><label>GST %</label><input type="number" id="rfGst" value="5"></div></div>' +
      '<div class="three"><div class="f"><label>Their bill number</label><input id="rfBill"></div><div class="f"><label>Received on</label><input type="date" id="rfAt" value="' + GE.localToday() + '"></div>' +
      '<div class="f"><label>Where it goes</label><select id="rfLoc"><option>Store</option><option>Godown</option></select></div></div>' +
      '<p class="hint" id="rfWait"></p>' +
      '<button class="btn gold" data-act="saveFabricIn">Receive it</button>');
    A.rfPick();
  };
  A.rfFind = function (id, el) {
    var t = el.value.toLowerCase(), sel = document.getElementById('rfFab');
    var hits = D().fabrics.filter(function (f) { return [f.brand, f.colour, f.pattern, f.book].join(' ').toLowerCase().indexOf(t) > -1; });
    sel.innerHTML = hits.map(function (f) { return '<option value="' + f.id + '">' + esc(f.brand + ' ' + f.colour + ', ' + f.pattern) + '</option>'; }).join('') || '<option value="">Nothing matches</option>';
    A.rfPick();
  };
  A.rfPick = function () {
    var f = one(D().fabrics, document.getElementById('rfFab').value); if (!f) return;
    document.getElementById('rfCost').value = f.cost;
    var waiting = D().garments.filter(function (g) { return g.awaited_fabric && GE.fabricsOf(g).some(function (u) { return u.fabric === f.id; }) && !GE.garmentInStock(g); });
    document.getElementById('rfWait').textContent = waiting.length ? waiting.length + ' outfit' + (waiting.length === 1 ? ' is' : 's are') + ' waiting for this cloth (' + waiting.map(function (g) { return g.order; }).join(', ') + '). Their stylists will be told to collect ' + GE.advRule().fabric + '%.' : '';
  };
  A.saveFabricIn = function () {
    var v = function (i) { return document.getElementById(i).value; }, f = one(D().fabrics, v('rfFab'));
    var m = Number(v('rfM')) || 0, c = Number(v('rfCost')) || 0;
    if (!f) { GE.toast('Choose the cloth.'); return; }
    if (m <= 0) { GE.toast('How many metres came in?'); return; }
    var at = v('rfAt') || GE.localToday(), pid = 'FAB-' + ('0' + (D().purchases.filter(function (x) { return x.type === 'fabric'; }).length + 1)).slice(-2);
    while (one(D().purchases, pid)) pid += 'b';
    D().purchases.push({ id: pid, type: 'fabric', supplier: f.vendor, at: at, credit_days: 30, advance: 0, bill: v('rfBill'), note: m + ' m of ' + f.brand + ' ' + f.colour,
      amount: GE.withGst(m * c, Number(v('rfGst')) || 5) });
    D().fabric_lots.push({ id: GE.uid('FL-'), fabric: f.id, vendor: f.vendor, at: at, metres: m, cost_m: c, gst: Number(v('rfGst')) || 5, bill: v('rfBill'), location: v('rfLoc'), purchase: pid });
    f.cost = c || f.cost;
    GE.save(); GE.closeModal(); GE.go('#/fabricstock');
    GE.toast(m + ' m of ' + f.brand + ' ' + f.colour + ' received. ' + GE.stockOf(f.id).hand + ' m on hand now.');
  };

  /* ================= Stitching charges: what we charge to stitch each outfit ================= */
  V['#/stitching'] = function () {
    var ed = GE.canPrice();
    var h = U.head('Stitching charges', 'What we charge to stitch each outfit, and its design charge. These come into an order beside the fabric, at 18% GST.',
      ed ? '<button class="btn gold" data-act="newStitch">Add an outfit</button>' : '');
    h += '<div class="card" style="overflow-x:auto"><table><thead><tr><th>Outfit</th><th class="num">Stitching</th><th class="num">Design charge</th><th class="num">Together</th><th class="num">With 18% GST</th></tr></thead><tbody>';
    D().stitching.forEach(function (x, i) {
      var cell = function (k) { return ed ? '<input type="number" min="0" step="500" style="width:120px" value="' + (x[k] || 0) + '" data-change="setStitch" data-id="' + i + '|' + k + '" aria-label="' + k + ' for ' + esc(x.kind) + '">' : rupees(x[k]); };
      h += '<tr><td><b>' + esc(x.kind) + '</b></td><td class="num">' + cell('stitch') + '</td><td class="num">' + cell('design') + '</td>' +
        '<td class="num">' + rupees((Number(x.stitch) || 0) + (Number(x.design) || 0)) + '</td><td class="num">' + rupees(GE.withGst((Number(x.stitch) || 0) + (Number(x.design) || 0), 18)) + '</td></tr>';
    });
    h += '</tbody></table>' + (ed ? '' : '<p class="hint">Set by the owner or the BDM.</p>') + '</div>';
    var eg = D().fabrics[2], sm = GE.stitchOf('Suit jacket / blazer / bandhgala');
    if (eg) h += '<div class="note"><b>On one suit:</b> 3.2 m of ' + esc(eg.brand + ' ' + eg.colour) + ' at ' + rupees(GE.sellOf(eg)) + ' a metre is ' + rupees(Math.round(3.2 * GE.sellOf(eg))) + ' of fabric (GST 5%), plus ' + rupees(sm.stitch) + ' stitching and ' + rupees(sm.design) +
      ' design (GST 18%): ' + rupees(Math.round(3.2 * GE.sellOf(eg)) + sm.stitch + sm.design) + ' before GST. The invoice shows each part on its own line.</div>';
    return h;
  };
  A.setStitch = function (id, el) {
    if (!GE.canPrice()) { GE.toast('Only the owner or the BDM can set what we charge.'); return; }
    var p = id.split('|'), x = D().stitching[Number(p[0])]; x[p[1]] = Math.max(0, Number(el.value) || 0); GE.save(); GE.refresh();
    GE.toast(x.kind.split(' / ')[0] + ': stitching ' + rupees(x.stitch) + ', design ' + rupees(x.design) + '.');
  };
  A.newStitch = function () {
    GE.modal('<h2>Add an outfit we stitch</h2><div class="f"><label>Outfit</label><input id="nsKind" placeholder="Bandi set"></div>' +
      '<div class="two"><div class="f"><label>Stitching</label><input type="number" id="nsStitch"></div><div class="f"><label>Design charge</label><input type="number" id="nsDesign"></div></div>' +
      '<button class="btn gold" data-act="saveStitch">Add it</button>');
  };
  A.saveStitch = function () {
    if (!GE.canPrice()) return;
    var k = document.getElementById('nsKind').value.trim(); if (!k) { GE.toast('Name the outfit.'); return; }
    D().stitching.push({ kind: k, stitch: Number(document.getElementById('nsStitch').value) || 0, design: Number(document.getElementById('nsDesign').value) || 0 });
    if (GE.KINDS.indexOf(k) < 0) GE.KINDS.push(k);
    GE.save(); GE.closeModal(); GE.refresh(); GE.toast(k + ' added.');
  };

  /* ---------- the scanner: a barcode gun types fast and ends with Enter ---------- */
  var buf = '', last = 0;
  document.addEventListener('keydown', function (e) {
    var t = e.target, inScan = t && t.getAttribute && t.getAttribute('data-scan');
    if (e.key === 'Enter' && inScan) { var p = GE.findBarcode(t.value); if (p) { t.value = ''; A.openPiece(p.id); } else GE.toast('No piece with the barcode ' + t.value + '.'); e.preventDefault(); return; }
    if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;     /* typing in a form is typing, not scanning */
    var now = Date.now();
    if (now - last > 60) buf = '';
    last = now;
    if (e.key === 'Enter') { var hit = buf.length >= 6 && GE.findBarcode(buf); buf = ''; if (hit) { A.openPiece(hit.id); e.preventDefault(); } return; }
    if (e.key.length === 1) buf += e.key;
  });
})();
