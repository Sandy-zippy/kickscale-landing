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

  var STATUS_LIST = ['in stock', 'reserved', 'on approval', 'sold', 'returned'];
  function pieceFields() {
    return [
      { k: 'barcode', label: 'Code', get: function (p) { return p.barcode; } },
      { k: 'name', label: 'Design', get: function (p) { return p.name; } },
      { k: 'status', label: 'Status', type: 'enum', options: STATUS_LIST, get: function (p) { return p.status; } },
      { k: 'source', label: 'Source', type: 'enum', get: function (p) { return SOURCES[p.source] || p.source; } },
      { k: 'from', label: 'Designer or brand', type: 'enum', get: function (p) { return who(p.supplier); } },
      { k: 'kind', label: 'Kind', type: 'enum', get: function (p) { return p.kind; } },
      { k: 'size', label: 'Size', type: 'enum', get: function (p) { return p.size; } },
      { k: 'where', label: 'Where it is', type: 'enum', get: function (p) { return p.location; } },
      { k: 'price', label: 'Price before GST', type: 'num', get: function (p) { return GE.piecePrice(p); } },
      { k: 'received', label: 'Received', type: 'date', get: function (p) { return p.received; } },
      { k: 'order', label: 'Order', get: function (p) { return p.order; } }
    ];
  }
  V['#/stock'] = function () {
    var S = GE.fbState('#/stock'); if (S.quick.status == null) S.quick.status = 'in stock';
    var fb = GE.filterBar('#/stock', D().pieces, { placeholder: 'Search a code, a design, a size, a designer', fields: pieceFields(), quick: ['status', 'source', 'from', 'kind', 'size', 'where'], date: 'received' });
    var list = fb.rows, stock = D().pieces.filter(function (p) { return p.status === 'in stock'; });
    var month = GE.localToday().slice(0, 7);
    var h = U.head('Readymade stock', 'Every piece on the shelf, one code each. A piece sold on an opportunity leaves here by itself; a piece received comes in here first.',
      '<button class="btn gold" data-act="receiveGoods">Receive goods</button> ' + GE.sheetButtons('stock') + ' <button class="btn alt" data-act="printLabels" data-id="filtered">Print labels for these</button> <button class="btn alt" data-act="camScan">Scan with camera</button>');
    h += '<div class="kpis">' + U.kpi(stock.length, 'Pieces in stock', 'store and godown') +
      (seeCost() ? U.kpi(GE.lakh(sum(stock, GE.pieceCost)), 'At cost to us', 'consignment at the designer’s share') : '') +
      U.kpi(GE.lakh(sum(stock, function (p) { return GE.withGst(GE.piecePrice(p), p.gst); })), 'At MRP', 'selling price with GST') +
      U.kpi(D().pieces.filter(function (p) { return p.status === 'reserved'; }).length, 'Reserved for orders', 'held for a client') +
      U.kpi(D().pieces.filter(function (p) { return p.status === 'sold' && String(p.sold_at).slice(0, 7) === month; }).length, 'Sold this month', '') + '</div>';
    h += '<div class="scanrow"><label for="stockScan">Scan a code</label><input id="stockScan" class="scan" placeholder="Scan the QR or barcode, or type a code, then Enter" autocomplete="off" data-scan="1"></div>';
    h += fb.html;
    h += '<div class="card" style="overflow-x:auto"><table><thead><tr><th>Code</th><th>Piece</th><th>Size</th><th>From</th><th>Received</th>' +
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
    if (!list.length) h += '<tr><td colspan="9" class="sub">Nothing in these filters.</td></tr>';
    return h + '</tbody></table></div><p class="hint">Consignment pieces cost us nothing until they sell; then the designer’s share, 70% of the price before GST, is what they cost.</p>';
  };
  A.stockTab = function (t) { GE.Q['#/stock.st'] = t; GE.refresh(); };
  A.stockSrc = function (id, el) { GE.Q['#/stock.src'] = el.value; GE.refresh(); };

  A.openPiece = function (id) {
    var p = one(D().pieces, id); if (!p) return;
    var pur = p.purchase && one(D().purchases, p.purchase);
    var h = '<div class="dstick"><h1>' + esc(p.name) + '</h1>' + statusPill(p) + '</div>' +
      '<p class="sub">' + esc(p.kind) + ' · size ' + esc(p.size || '—') + ' · ' + esc(who(p.supplier)) + ' · ' + esc(SOURCES[p.source] || '') + '</p>';
    h += '<div class="card label-preview"><div class="qr" data-code="' + esc(p.barcode) + '"></div><div><svg class="bc" data-code="' + esc(p.barcode) + '"></svg><b>' + esc(p.barcode) + '</b><div class="sub">MRP ' + rupees(GE.withGst(GE.piecePrice(p), p.gst)) + ' incl. GST</div></div>' +
      '<button class="mini" data-act="printLabels" data-id="' + p.id + '">Print its label</button>' + (seeCost() ? ' <button class="mini" data-act="editPiece" data-id="' + p.id + '">Change any detail</button>' : '') + '</div>';
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
    GE.drawer(h); drawCodes();
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
  /* sizes typed as "38 x1, 40 x2, 42" (or "38, 40, 40, 42") become one entry per piece */
  function parseSizes(txt) {
    var out = [];
    String(txt || '').split(/[,;\n]+/).forEach(function (part) {
      var m = /^\s*([^x×*]+?)\s*(?:[x×*]\s*(\d+))?\s*$/i.exec(part); if (!m || !m[1].trim()) return;
      for (var i = 0; i < (Number(m[2]) || 1); i++) out.push(m[1].trim());
    });
    return out;
  }
  GE.parseSizes = parseSizes;
  var RG_N = 0;
  function rgRow(i) {
    return '<div class="rgrow" data-row="' + i + '"><div class="f"><label>Design</label><input id="rgName_' + i + '" placeholder="Velvet bandhgala, midnight" data-input="rgTotal"></div>' +
      '<div class="f"><label>Kind</label><select id="rgKind_' + i + '">' + GE.KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Colour</label><input id="rgCol_' + i + '"></div>' +
      '<div class="f rgsizes"><label>Sizes and how many</label><input id="rgSizes_' + i + '" placeholder="38 x1, 40 x2, 42 x1" data-input="rgTotal"><div class="hint" id="rgSizesSay_' + i + '"></div></div>' +
      '<div class="f rgcost"><label>Cost before GST</label><input type="number" id="rgCost_' + i + '" data-input="rgTotal"></div>' +
      '<div class="f"><label>Price before GST</label><input type="number" id="rgPrice_' + i + '" data-input="rgTotal"></div>' +
      '<div class="f"><label>GST %</label><input type="number" id="rgGst_' + i + '" value="18"></div></div>';
  }
  A.receiveGoods = function () {
    var aw = awaited(); RG_N = 1;
    GE.modal('<h2>Receive goods</h2><p class="sub">One row per design. Sizes like <b>38 x1, 40 x2, 42 x1</b> make four pieces, each with its own code and QR label. Or fill the stock sheet in Excel and upload it.</p>' +
      '<div class="btnrow" style="margin-bottom:12px">' + GE.sheetButtons('stock') + '</div>' +
      '<div class="two"><div class="f"><label>What is coming in</label><select id="rgType" data-change="rgSwitch">' +
      '<option value="on-order">On-order purchase from a designer</option><option value="consignment">Consignment from a designer</option>' +
      '<option value="own">Our own make</option>' + (aw.length ? '<option value="for-order">A designer piece made for an order</option>' : '') + '</select></div>' +
      '<div class="f"><label>Received on</label><input type="date" id="rgAt" value="' + GE.localToday() + '"></div></div>' +
      '<div id="rgOrder" hidden><div class="f"><label>For which order</label><select id="rgGarment" data-change="rgPick">' +
      aw.map(function (g) { var o = one(D().orders, g.order); return '<option value="' + g.id + '">' + esc(g.order + ' · ' + GE.ui.cname(o.client) + ' · ' + g.kind + ' · ' + GE.ui.dgname(g.designer)) + '</option>'; }).join('') +
      '</select><div class="hint">It goes into stock held for that client, and the order shows what he has paid so far.</div></div></div>' +
      '<div id="rgSupWrap" class="three"><div class="f"><label>From</label><select id="rgSup">' + D().designers.map(function (dz) { return '<option value="' + dz.id + '">' + esc(dz.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Their bill or challan number</label><input id="rgBill"></div><div class="f"><label>Where it goes</label><select id="rgLoc"><option>Store</option><option>Godown</option></select></div></div>' +
      '<div id="rgTerms" class="two"><div class="f"><label>Credit period, days</label><input type="number" id="rgCredit" value="60"></div><div class="f"><label>Advance paid to them</label><input type="number" id="rgAdv" value="0"></div></div>' +
      '<div id="rgRows">' + rgRow(0) + '</div><button class="mini" data-act="rgAddRow" id="rgAddBtn">+ Another design</button>' +
      '<p class="rftotal" id="rgTotal"></p>' +
      '<button class="btn gold" data-act="saveReceive">Receive and make the codes</button>');
    A.rgSwitch();
  };
  A.rgAddRow = function () { document.getElementById('rgRows').insertAdjacentHTML('beforeend', rgRow(RG_N)); RG_N++; A.rgSwitch(); };
  A.rgSwitch = function () {
    var $ = function (i) { return document.getElementById(i); }; if (!$('rgType')) return;
    var t = $('rgType').value, hide = function (id, yes) { var e = $(id); if (e) e.hidden = yes; };
    hide('rgOrder', t !== 'for-order');
    hide('rgSupWrap', t === 'own' || t === 'for-order');
    hide('rgTerms', t !== 'on-order');
    [].forEach.call(document.querySelectorAll('.rgcost'), function (e) { e.hidden = t === 'consignment'; });
    if ($('rgAddBtn')) $('rgAddBtn').hidden = t === 'for-order';
    if (t === 'for-order') A.rgPick();
    A.rgTotal();
  };
  A.rgPick = function () {
    var $ = function (i) { return document.getElementById(i); };
    var g = one(D().garments, $('rgGarment') && $('rgGarment').value); if (!g) return;
    $('rgName_0').value = g.kind.split(' / ')[0] + ' for ' + g.order; $('rgKind_0').value = g.kind; $('rgPrice_0').value = GE.garmentValue(g); $('rgSizes_0').value = 'made to measure x1';
  };
  A.rgTotal = function () {
    var n = 0, val = 0;
    for (var i = 0; i < RG_N; i++) {
      var S = document.getElementById('rgSizes_' + i); if (!S) continue;
      var sz = parseSizes(S.value), price = Number(document.getElementById('rgPrice_' + i).value) || 0;
      n += sz.length; val += sz.length * price;
      var say = document.getElementById('rgSizesSay_' + i);
      if (say) say.textContent = sz.length ? sz.length + (sz.length === 1 ? ' piece: ' : ' pieces: ') + sz.join(', ') : '';
    }
    var e = document.getElementById('rgTotal'); if (e) e.innerHTML = n ? '<b>' + n + ' pieces</b>, ' + rupees(val) + ' before GST.' : '';
  };
  A.saveReceive = function () {
    var v = function (i) { var e = document.getElementById(i); return e ? e.value : ''; };
    var t = v('rgType'), at = v('rgAt') || GE.localToday(), lines = [];
    for (var i = 0; i < RG_N; i++) {
      if (!document.getElementById('rgName_' + i)) continue;
      var name = v('rgName_' + i).trim(), sizes = parseSizes(v('rgSizes_' + i));
      if (!name && !sizes.length) continue;
      if (!name) { GE.toast('Row ' + (i + 1) + ': name the design.'); return; }
      if (!sizes.length) { GE.toast('Row ' + (i + 1) + ': put the sizes in, like 38 x1, 40 x2.'); return; }
      if (!(Number(v('rgPrice_' + i)) > 0)) { GE.toast('Row ' + (i + 1) + ': put in the price before GST.'); return; }
      if (t !== 'consignment' && t !== 'for-order' && !(Number(v('rgCost_' + i)) > 0)) { GE.toast('Row ' + (i + 1) + ': put in the cost before GST.'); return; }
      lines.push({ name: name, kind: v('rgKind_' + i), colour: v('rgCol_' + i), sizes: sizes, cost_ex: v('rgCost_' + i), price_ex: v('rgPrice_' + i), gst: v('rgGst_' + i) });
    }
    if (!lines.length) { GE.toast('Add at least one design.'); return; }
    var made = receiveLines(t, t === 'own' ? 'Sasya' : t === 'for-order' ? null : v('rgSup'), at, v('rgBill'), v('rgLoc'), lines, { credit: v('rgCredit'), adv: v('rgAdv'), garment: v('rgGarment') });
    GE.closeModal(); GE.go('#/stock');
    GE.toast(made.length + (made.length === 1 ? ' piece' : ' pieces') + ' received: ' + made.map(function (p) { return p.barcode; }).join(', ') + '.');
    A.printLabels(made.map(function (p) { return p.id; }).join(','), true);
  };
  /* one place that turns lines into a purchase and pieces: used by the form and by the stock sheet */
  function receiveLines(t, sup, at, bill, loc, lines, extra) {
    extra = extra || {};
    var g = null, pur = null;
    if (t === 'for-order') { g = one(D().garments, extra.garment); sup = g.designer; }
    else if (t === 'on-order' || t === 'consignment') {
      pur = { id: (t === 'on-order' ? 'PUR-' : 'CON-') + ('0' + (D().purchases.filter(function (x) { return x.type === t; }).length + 1)).slice(-2), type: t, supplier: sup, at: at,
        credit_days: t === 'on-order' ? Number(extra.credit) || 60 : 0, advance: t === 'on-order' ? Number(extra.adv) || 0 : 0, bill: bill || '', note: '' };
      while (one(D().purchases, pur.id)) pur.id += 'b';
      D().purchases.push(pur);
      if (pur.advance > 0) D().supplier_payments.push({ id: GE.uid('SP-'), supplier: sup, kind: 'on-order', purchase: pur.id, amount: pur.advance, at: at, mode: 'Net transfer', ref: '', note: 'Advance with the order', advance: true, by: GE.me().id });
    }
    var made = [];
    lines.forEach(function (L) {
      made = made.concat(GE.receivePieces({ source: t, supplier: sup, purchase: pur ? pur.id : '', name: L.name, kind: L.kind, colour: L.colour, sizes: L.sizes.join(','), cost_ex: L.cost_ex, price_ex: L.price_ex, gst: L.gst === '' || L.gst == null ? 18 : L.gst, at: at, location: loc || 'Store' }));
    });
    if (g) { g.piece = made[0].id; made[0].history[0].what = 'Received from ' + GE.ui.dgname(g.designer) + ' for ' + g.order; GE.moveGarment(g.id, 'Received and checked'); }
    GE.save();
    return made;
  }
  GE.receiveLines = receiveLines;

  /* ---- the stock sheet: fill it in Excel, upload it, check it, then save ---- */
  var SHEET_HEADS = ['Type (On-order / Consignment / Our own)', 'Designer or brand', 'Their bill number', 'Received on (YYYY-MM-DD)', 'Design', 'Kind', 'Colour', 'Size', 'How many', 'Cost before GST', 'Price before GST', 'GST %', 'Where (Store / Godown)'];
  A.stockSheet = function () {
    GE.xls('Saasya-Men-stock-sheet.xlsx', [
      { name: 'Stock', rows: [SHEET_HEADS,
        ['On-order', 'JJ Valaya', 'JJV/2026/0500', GE.localToday(), 'Ivory achkan, zardozi', 'Sherwani', 'Ivory', '40', 1, 95000, 160000, 18, 'Store'],
        ['On-order', 'JJ Valaya', 'JJV/2026/0500', GE.localToday(), 'Ivory achkan, zardozi', 'Sherwani', 'Ivory', '42', 2, 95000, 160000, 18, 'Store'],
        ['Consignment', 'Gaurav Gupta', '', GE.localToday(), 'Draped kurta, charcoal', 'Kurta', 'Charcoal', '40', 1, '', 142000, 18, 'Store']] },
      { name: 'How to fill', rows: [['One row per design and size. "How many" makes that many pieces, each with its own code.'], ['Type is On-order, Consignment or Our own. Consignment needs no cost.'],
        ['Designer or brand must be one of these:']].concat(D().designers.map(function (x) { return [x.name]; })).concat([['Saasya Men (for Our own)'], [''], ['Kind must be one of these:']]).concat(GE.KINDS.map(function (k) { return [k]; })) }]);
  };
  function readSheet(rows) {
    var errs = [], groups = {}, typeOf = { 'on-order': 'on-order', 'on order': 'on-order', 'consignment': 'consignment', 'our own': 'own', 'own': 'own' };
    rows.forEach(function (r, i) {
      var n = i + 2, cell = function (k) { return r[k] == null ? '' : String(r[k]).trim(); };
      if (!r.length || r.every(function (x) { return x === '' || x == null; })) return;
      var t = typeOf[cell(0).toLowerCase()]; if (!t) { errs.push('Row ' + n + ': Type must be On-order, Consignment or Our own.'); return; }
      var sup = t === 'own' ? 'Sasya' : (D().designers.filter(function (x) { return x.name.toLowerCase() === cell(1).toLowerCase(); })[0] || {}).id;
      if (!sup) { errs.push('Row ' + n + ': no designer called "' + cell(1) + '". Use a name from the How to fill sheet.'); return; }
      var at = cell(3) || GE.localToday(); if (!/^\d{4}-\d{2}-\d{2}$/.test(at)) { errs.push('Row ' + n + ': the date must look like 2026-10-07.'); return; }
      if (!cell(4)) { errs.push('Row ' + n + ': the design has no name.'); return; }
      if (GE.KINDS.indexOf(cell(5)) < 0) { errs.push('Row ' + n + ': "' + cell(5) + '" is not a kind we know. Use one from the How to fill sheet.'); return; }
      var qty = Number(cell(8)) || 0; if (qty < 1) { errs.push('Row ' + n + ': How many must be 1 or more.'); return; }
      if (!(Number(cell(10)) > 0)) { errs.push('Row ' + n + ': put in the price before GST.'); return; }
      if (t !== 'consignment' && !(Number(cell(9)) > 0)) { errs.push('Row ' + n + ': put in the cost before GST.'); return; }
      var key = [t, sup, cell(2), at].join('|'); groups[key] = groups[key] || { t: t, sup: sup, bill: cell(2), at: at, loc: cell(12) || 'Store', lines: [] };
      var sizes = []; for (var q = 0; q < qty; q++) sizes.push(cell(7) || 'free size');
      groups[key].lines.push({ name: cell(4), kind: cell(5), colour: cell(6), sizes: sizes, cost_ex: cell(9), price_ex: cell(10), gst: cell(11) || 18 });
    });
    return { errs: errs, groups: Object.keys(groups).map(function (k) { return groups[k]; }) };
  }
  GE.readSheet = readSheet;
  var PENDING = null;
  A.stockUpload = function (id, el) {
    var f = el.files && el.files[0]; if (!f) return;
    var go = function () {
      var fr = new FileReader();
      fr.onload = function (e) {
        var wb = window.XLSX.read(e.target.result, { type: 'array' }), ws = wb.Sheets[wb.SheetNames[0]];
        var all = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        showSheet(readSheet(all.slice(1)));
      };
      fr.readAsArrayBuffer(f);
    };
    if (window.XLSX) go(); else { var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; sc.onload = go; document.head.appendChild(sc); }
  };
  function showSheet(res) {
    PENDING = res.errs.length ? null : res.groups;
    var pieces = sum(res.groups, function (g) { return sum(g.lines, function (l) { return l.sizes.length; }); });
    GE.modal('<h2>The stock sheet</h2>' + (res.errs.length ? '<div class="note bad"><b>Nothing has been saved. Fix these in the sheet and upload it again:</b><ul class="gone">' + res.errs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>'
      : '<p class="sub">' + pieces + ' pieces on ' + res.groups.length + (res.groups.length === 1 ? ' bill' : ' bills') + '. Check, then save.</p><table><thead><tr><th>Type</th><th>From</th><th>Bill</th><th>Design</th><th>Sizes</th><th class="num">Price</th></tr></thead><tbody>' +
        res.groups.map(function (g) { return g.lines.map(function (l) { return '<tr><td>' + esc(SOURCES[g.t]) + '</td><td>' + esc(who(g.sup)) + '</td><td>' + esc(g.bill) + '</td><td>' + esc(l.name) + '</td><td>' + esc(l.sizes.join(', ')) + '</td><td class="num">' + rupees(l.price_ex) + '</td></tr>'; }).join(''); }).join('') +
        '</tbody></table><button class="btn gold" data-act="saveSheet">Save ' + pieces + ' pieces</button>'));
  }
  A.saveSheet = function () {
    if (!PENDING) return;
    var made = [];
    PENDING.forEach(function (g) { made = made.concat(receiveLines(g.t, g.sup, g.at, g.bill, g.loc, g.lines)); });
    PENDING = null; GE.closeModal(); GE.go('#/stock'); GE.toast(made.length + ' pieces received from the sheet.');
  };

  /* ---- every field of a piece can be changed, and the change is stamped ---- */
  A.editPiece = function (id) {
    var p = one(D().pieces, id);
    var sel = function (idn, opts, cur) { return '<select id="' + idn + '">' + opts.map(function (o) { var v = o[0], l = o[1]; return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>'; };
    GE.modal('<h2>Change ' + esc(p.barcode) + '</h2><p class="sub">Every field. The change is written into its story.</p>' +
      '<div class="two"><div class="f"><label>Design</label><input id="epName" value="' + esc(p.name) + '"></div><div class="f"><label>Kind</label>' + sel('epKind', GE.KINDS.map(function (k) { return [k, k]; }), p.kind) + '</div></div>' +
      '<div class="three"><div class="f"><label>Size</label><input id="epSize" value="' + esc(p.size) + '"></div><div class="f"><label>Colour</label><input id="epCol" value="' + esc(p.colour || '') + '"></div><div class="f"><label>Where</label>' + sel('epLoc', [['Store', 'Store'], ['Godown', 'Godown']], p.location) + '</div></div>' +
      '<div class="two"><div class="f"><label>From</label>' + sel('epSup', [['Sasya', 'Saasya Men']].concat(D().designers.map(function (x) { return [x.id, x.name]; })), p.supplier) + '</div><div class="f"><label>Source</label>' + sel('epSrc', Object.keys(SOURCES).map(function (k) { return [k, SOURCES[k]]; }), p.source) + '</div></div>' +
      '<div class="three"><div class="f"><label>Cost before GST</label><input type="number" id="epCost" value="' + (p.cost_ex || 0) + '"></div><div class="f"><label>Price before GST</label><input type="number" id="epPrice" value="' + (p.price_ex || 0) + '"></div><div class="f"><label>GST %</label><input type="number" id="epGst" value="' + p.gst + '"></div></div>' +
      '<div class="f"><label>Received on</label><input type="date" id="epAt" value="' + p.received + '"></div>' +
      '<button class="btn gold" data-act="savePiece2" data-id="' + id + '">Save</button>');
  };
  A.savePiece2 = function (id) {
    var p = one(D().pieces, id), v = function (i) { return document.getElementById(i).value; };
    var map = { name: ['epName', 'design'], kind: ['epKind', 'kind'], size: ['epSize', 'size'], colour: ['epCol', 'colour'], location: ['epLoc', 'where'], supplier: ['epSup', 'from'], source: ['epSrc', 'source'],
      cost_ex: ['epCost', 'cost'], price_ex: ['epPrice', 'price'], gst: ['epGst', 'GST'], received: ['epAt', 'received'] };
    var changed = [];
    Object.keys(map).forEach(function (k) {
      var nv = v(map[k][0]); if (['cost_ex', 'price_ex', 'gst'].indexOf(k) > -1) nv = Number(nv) || 0;
      if (String(nv) !== String(p[k] == null ? '' : p[k])) { changed.push(map[k][1] + ' ' + (p[k] == null ? '' : p[k]) + ' to ' + nv); p[k] = nv; }
    });
    if (changed.length) stamp(p, 'Changed: ' + changed.join('; '));
    GE.save(); GE.closeModal(); A.openPiece(id); GE.toast(changed.length ? 'Saved: ' + changed.join('; ') + '.' : 'Nothing changed.');
  };

  /* ================= Fabric stock: our own metres, bought on bills ================= */
  V['#/fabricstock'] = function () {
    var fabs = D().fabrics.filter(function (f) { var st = GE.stockOf(f.id); return st.in > 0 || st.reserved > 0; });
    var vname = function (f) { var v = one(D().vendors, f.vendor); return v ? v.name : ''; };
    var fb = GE.filterBar('#/fabricstock', fabs, { placeholder: 'Search a brand, a colour, a pattern, a vendor', quick: ['vendor', 'brand', 'colour', 'low'], fields: [
      { k: 'brand', label: 'Brand', type: 'enum', get: function (f) { return f.brand; } }, { k: 'colour', label: 'Colour', type: 'enum', get: function (f) { return f.colour; } },
      { k: 'pattern', label: 'Pattern', get: function (f) { return f.pattern; } }, { k: 'vendor', label: 'Vendor', type: 'enum', get: vname },
      { k: 'hand', label: 'On hand, metres', type: 'num', get: function (f) { return GE.stockOf(f.id).hand; } }, { k: 'free', label: 'Free, metres', type: 'num', get: function (f) { return GE.stockOf(f.id).available; } },
      { k: 'low', label: 'Stock level', type: 'enum', options: ['Low', 'Fine'], all: 'Any stock level', get: function (f) { return GE.stockOf(f.id).low ? 'Low' : 'Fine'; } },
      { k: 'sell', label: 'Selling a metre', type: 'num', get: function (f) { return GE.sellOf(f); } }] });
    var list = fb.rows;
    var cost = seeCost(), price = GE.canPrice();
    var h = U.head('Fabric stock', 'The cloth we own and hold here, from purchase bills: metres in, cut, promised to garments, free. The selling price a metre is what an order picks up.',
      '<button class="btn gold" data-act="receiveFabric">Receive fabric</button> ' + GE.sheetButtons('fabricIn'));
    h += '<div class="kpis">' + U.kpi(Math.round(sum(fabs, function (f) { return GE.stockOf(f.id).hand; })) + ' m', 'On hand', fabs.length + ' cloths') +
      (cost ? U.kpi(GE.lakh(sum(fabs, function (f) { var st = GE.stockOf(f.id); return st.hand * st.avgCost; })), 'At cost', 'what it cost us') : '') +
      U.kpi(GE.lakh(sum(fabs, function (f) { return GE.stockOf(f.id).hand * GE.sellOf(f); })), 'At our selling price', 'before GST') +
      U.kpi(fabs.filter(function (f) { return GE.stockOf(f.id).low; }).length, 'Under the notify mark', 'The Bolt is watching') + '</div>';
    h += '<div class="card"><div class="cardhead"><h3>How fabric is priced</h3><span class="sub">set by the owner or the BDM</span></div><p>An outfit is the fabric at our selling price a metre (GST 5%), plus its stitching and design charge from <a href="#/stitching">Stitching charges</a> (GST 18%). ' +
      'A cloth with no selling price sells at its cost times ' + (price ? '<input type="number" min="1" step="0.1" style="width:70px" value="' + (D().priceRule.markup || 1.6) + '" data-change="setPriceRule" aria-label="Markup on cost">' : '<b>' + (D().priceRule.markup || 1.6) + '</b>') + '.</p></div>';
    h += fb.html;
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
    h += fabricPurchasesHtml();
    return h;
  };

  /* ---- fabric purchases: every bill, by vendor, with what is paid and owed ---- */
  function fabBills() { return D().purchases.filter(function (p) { return p.type === 'fabric'; }); }
  function lotsOf(pid) { return D().fabric_lots.filter(function (l) { return l.purchase === pid; }); }
  function vendorFabric(vid) {
    var bills = fabBills().filter(function (p) { return p.supplier === vid; });
    var amount = sum(bills, function (p) { return Number(p.amount) || 0; });
    var paid = sum((D().supplier_payments || []).filter(function (x) { return x.supplier === vid && x.kind === 'fabric'; }), function (x) { return Number(x.amount) || 0; });
    return { bills: bills, metres: sum(bills, function (p) { return sum(lotsOf(p.id), function (l) { return Number(l.metres) || 0; }); }), amount: amount, paid: paid, owed: amount - paid };
  }
  GE.vendorFabric = vendorFabric; GE.fabBills = fabBills;
  function fabricPurchasesHtml() {
    var cost = seeCost(); if (!cost) return '';
    var h = '<div class="card"><div class="cardhead"><h3>Fabric purchases, by vendor</h3><span class="sub">what we bought, paid and still owe</span></div><div style="overflow-x:auto"><table><thead><tr><th>Vendor</th><th class="num">Bills</th><th class="num">Metres bought</th><th class="num">Bills with GST</th><th class="num">Paid</th><th class="num">Still owed</th><th></th></tr></thead><tbody>';
    D().vendors.forEach(function (v) {
      var x = vendorFabric(v.id); if (!x.bills.length) return;
      h += '<tr><td><b>' + esc(v.name) + '</b></td><td class="num">' + x.bills.length + '</td><td class="num">' + x.metres + ' m</td><td class="num">' + rupees(x.amount) + '</td><td class="num">' + rupees(x.paid) + '</td><td class="num"><b>' + rupees(x.owed) + '</b></td>' +
        '<td><button class="mini" data-act="fabPay" data-id="' + v.id + '">Record a payment</button></td></tr>';
    });
    h += '</tbody></table></div></div>';
    var rows = []; fabBills().forEach(function (p) { lotsOf(p.id).forEach(function (l) { rows.push({ p: p, l: l }); }); });
    var fb = GE.filterBar('#/fabricbills', rows, { placeholder: 'Search a vendor, a cloth, a bill number', quick: ['vendor', 'cloth'], date: 'at', fields: [
      { k: 'at', label: 'Received', type: 'date', get: function (r) { return r.l.at; } }, { k: 'vendor', label: 'Vendor', type: 'enum', get: function (r) { var v = one(D().vendors, r.p.supplier); return v ? v.name : ''; } },
      { k: 'cloth', label: 'Cloth', type: 'enum', get: function (r) { var f = one(D().fabrics, r.l.fabric) || {}; return (f.brand || '') + ' ' + (f.colour || ''); } },
      { k: 'bill', label: 'Their bill', get: function (r) { return r.p.bill; } }, { k: 'metres', label: 'Metres', type: 'num', get: function (r) { return r.l.metres; } },
      { k: 'total', label: 'Total with GST', type: 'num', get: function (r) { return GE.withGst(r.l.metres * r.l.cost_m, r.l.gst); } }, { k: 'code', label: 'Lot code', get: function (r) { return r.l.code; } }] });
    h += '<div class="card"><div class="cardhead"><h3>Fabric purchase register</h3><div class="btnrow"><button class="mini" data-act="fabRegPdf">PDF</button> <button class="mini" data-act="fabRegXls">Excel</button></div></div>' + fb.html +
      '<div style="overflow-x:auto"><table><thead><tr><th>Received</th><th>Lot code</th><th>Cloth</th><th>Vendor</th><th>Their bill</th><th class="num">Metres</th><th class="num">Cost a metre</th><th class="num">GST</th><th class="num">Total</th><th></th></tr></thead><tbody>';
    fb.rows.forEach(function (r) {
      var f = one(D().fabrics, r.l.fabric) || {}, v = one(D().vendors, r.p.supplier);
      h += '<tr><td>' + d(r.l.at) + '</td><td><code>' + esc(r.l.code || '') + '</code></td><td>' + esc((f.brand || '') + ' ' + (f.colour || '')) + '</td><td>' + esc(v ? v.name : '') + '</td><td class="sub">' + esc(r.p.bill || '') + '</td>' +
        '<td class="num">' + r.l.metres + ' m</td><td class="num">' + rupees(r.l.cost_m) + '</td><td class="num">' + r.l.gst + '%</td><td class="num">' + rupees(GE.withGst(r.l.metres * r.l.cost_m, r.l.gst)) + '</td>' +
        '<td><button class="mini" data-act="openLot" data-id="' + r.l.id + '">Open</button></td></tr>';
    });
    if (!fb.rows.length) h += '<tr><td colspan="10" class="sub">No fabric bills in these filters.</td></tr>';
    return h + '</tbody></table></div><p class="hint">Opening stock is not a bill and is left out. Payments are made in Tally and recorded here.</p></div>';
  }
  function registerRows() {
    var rows = GE.filterBar('#/fabricbills', (function () { var r = []; fabBills().forEach(function (p) { lotsOf(p.id).forEach(function (l) { r.push({ p: p, l: l }); }); }); return r; })(), FB_REG()).rows;
    return rows.map(function (r) { var f = one(D().fabrics, r.l.fabric) || {}, v = one(D().vendors, r.p.supplier);
      return [d(r.l.at), r.l.code || '', (f.brand || '') + ' ' + (f.colour || ''), v ? v.name : '', r.p.bill || '', String(r.l.metres), r.l.cost_m, r.l.gst + '%', GE.withGst(r.l.metres * r.l.cost_m, r.l.gst)]; });
  }
  function FB_REG() { return { fields: [{ k: 'at', label: 'Received', type: 'date', get: function (r) { return r.l.at; } }, { k: 'vendor', label: 'Vendor', type: 'enum', get: function (r) { var v = one(D().vendors, r.p.supplier); return v ? v.name : ''; } },
    { k: 'cloth', label: 'Cloth', type: 'enum', get: function (r) { var f = one(D().fabrics, r.l.fabric) || {}; return (f.brand || '') + ' ' + (f.colour || ''); } }, { k: 'bill', label: 'Their bill', get: function (r) { return r.p.bill; } },
    { k: 'metres', label: 'Metres', type: 'num', get: function (r) { return r.l.metres; } }, { k: 'total', label: 'Total with GST', type: 'num', get: function (r) { return GE.withGst(r.l.metres * r.l.cost_m, r.l.gst); } }, { k: 'code', label: 'Lot code', get: function (r) { return r.l.code; } }], date: 'at' }; }
  var REG_HEADS = ['Received', 'Lot code', 'Cloth', 'Vendor', 'Their bill', 'Metres', 'Cost a metre', 'GST', 'Total with GST'];
  A.fabRegPdf = function () { var rows = registerRows(); GE.makePdf(GE.sheetDoc('FABRIC PURCHASE REGISTER', d(GE.localToday()), REG_HEADS, rows, [sum(rows, function (r) { return r[8]; })], ''), 'Saasya-Men-fabric-purchases.pdf'); };
  A.fabRegXls = function () { GE.xls('Saasya-Men-fabric-purchases.xlsx', [{ name: 'Fabric purchases', rows: [REG_HEADS].concat(registerRows()) }]); };
  A.fabPay = function (vid) {
    var x = vendorFabric(vid), v = one(D().vendors, vid);
    GE.modal('<h2>Record a payment to ' + esc(v.name) + '</h2><p class="sub">Fabric bills ' + rupees(x.amount) + ', paid ' + rupees(x.paid) + ', <b>still owed ' + rupees(x.owed) + '</b>. Paid in Tally, recorded here.</p>' +
      '<div class="two"><div class="f"><label>Amount</label><input type="number" id="fpAmt" value="' + Math.max(0, x.owed) + '"></div><div class="f"><label>Paid on</label><input type="date" id="fpAt" value="' + GE.localToday() + '"></div></div>' +
      '<div class="two"><div class="f"><label>How</label><select id="fpMode"><option>Net transfer</option><option>Cheque</option><option>UPI (GPay / PhonePe / Razorpay)</option><option>Cash</option></select></div><div class="f"><label>Tally voucher or bank reference</label><input id="fpRef"></div></div>' +
      '<button class="btn gold" data-act="saveFabPay" data-id="' + vid + '">Record it</button>');
  };
  A.saveFabPay = function (vid) {
    var v = function (i) { return document.getElementById(i).value; }, amt = Number(v('fpAmt')) || 0;
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    D().supplier_payments.push({ id: GE.uid('SP-'), supplier: vid, kind: 'fabric', purchase: '', amount: amt, at: v('fpAt') || GE.localToday(), mode: v('fpMode'), ref: v('fpRef'), note: 'Fabric', advance: false, by: GE.me().id });
    GE.save(); GE.closeModal(); GE.refresh(); GE.toast(rupees(amt) + ' to ' + one(D().vendors, vid).name + ' recorded. Still owed ' + rupees(vendorFabric(vid).owed) + '.');
  };
  /* one lot: its code, its QR label, every field editable */
  A.openLot = function (id) {
    var l = one(D().fabric_lots, id); if (!l) return;
    var f = one(D().fabrics, l.fabric) || {}, v = one(D().vendors, l.vendor), p = l.purchase && one(D().purchases, l.purchase);
    var h = '<div class="dstick"><h1>' + esc((f.brand || '') + ' ' + (f.colour || '')) + '</h1>' + U.pill(l.metres + ' m in', 'ok') + '</div>' +
      '<p class="sub">Lot ' + esc(l.code || '') + ' · ' + esc(v ? v.name : '') + (p ? ' · bill ' + esc(p.bill || p.id) : ' · ' + esc(l.bill || '')) + '</p>' +
      '<div class="card label-preview"><div class="qr" data-code="' + esc(l.code || '') + '"></div><div><svg class="bc" data-code="' + esc(l.code || '') + '"></svg><b>' + esc(l.code || '') + '</b><div class="sub">' + esc(f.brand + ' ' + f.colour) + ', ' + l.metres + ' m</div></div>' +
      '<button class="mini" data-act="printLotLabel" data-id="' + l.id + '">Print its label</button> <button class="mini" data-act="editLot" data-id="' + l.id + '">Change any detail</button></div>' +
      '<div class="card"><div class="three">' + U.fld('Received', d(l.at)) + U.fld('Metres', l.metres + ' m') + (seeCost() ? U.fld('Cost a metre', rupees(l.cost_m)) + U.fld('Bill with GST', rupees(GE.withGst(l.metres * l.cost_m, l.gst))) : '') +
      U.fld('GST', l.gst + '%') + U.fld('Where', l.location) + '</div></div>';
    GE.drawer(h); drawCodes();
  };
  A.editLot = function (id) {
    var l = one(D().fabric_lots, id);
    GE.modal('<h2>Change the lot</h2><p class="sub">' + esc(l.code || '') + '. Every figure here feeds stock, the register and Tally.</p>' +
      '<div class="three"><div class="f"><label>Metres</label><input type="number" step="0.1" id="elM" value="' + l.metres + '"></div><div class="f"><label>Cost a metre</label><input type="number" id="elC" value="' + l.cost_m + '"></div><div class="f"><label>GST %</label><input type="number" id="elG" value="' + l.gst + '"></div></div>' +
      '<div class="three"><div class="f"><label>Received</label><input type="date" id="elAt" value="' + l.at + '"></div><div class="f"><label>Their bill</label><input id="elBill" value="' + esc(l.bill || '') + '"></div><div class="f"><label>Where</label><select id="elLoc"><option' + (l.location === 'Store' ? ' selected' : '') + '>Store</option><option' + (l.location === 'Godown' ? ' selected' : '') + '>Godown</option></select></div></div>' +
      '<button class="btn gold" data-act="saveLot" data-id="' + id + '">Save</button>');
  };
  A.saveLot = function (id) {
    var l = one(D().fabric_lots, id), v = function (i) { return document.getElementById(i).value; };
    l.metres = Number(v('elM')) || 0; l.cost_m = Number(v('elC')) || 0; l.gst = Number(v('elG')) || 0; l.at = v('elAt') || l.at; l.bill = v('elBill'); l.location = v('elLoc');
    var p = l.purchase && one(D().purchases, l.purchase);
    if (p) { p.amount = sum(lotsOf(p.id), function (x) { return GE.withGst(x.metres * x.cost_m, x.gst); }); p.bill = l.bill || p.bill; }
    GE.save(); GE.closeModal(); A.openLot(id); GE.toast('Saved. Stock, the register and Tally follow.');
  };

  /* ---- receive fabric: vendor first, then one row per cloth on the bill ---- */
  var RF_N = 0;
  function rfRow(i, vid, fid) {
    var cloths = D().fabrics.filter(function (f) { return !vid || f.vendor === vid; });
    return '<div class="rfrow" data-row="' + i + '"><div class="f"><label>Cloth</label><select id="rfFab_' + i + '" data-change="rfCloth" data-id="' + i + '">' +
      cloths.map(function (f) { return '<option value="' + f.id + '"' + (f.id === fid ? ' selected' : '') + '>' + esc(f.brand + ' ' + f.colour + ', ' + f.pattern) + '</option>'; }).join('') +
      '<option value="__new">+ A cloth not in the library yet</option></select>' +
      '<div class="rfnew" id="rfNew_' + i + '" hidden><input id="rfNB_' + i + '" placeholder="Brand"><input id="rfNC_' + i + '" placeholder="Colour"><input id="rfNP_' + i + '" placeholder="Pattern"></div></div>' +
      '<div class="f"><label>Metres</label><input type="number" step="0.1" id="rfM_' + i + '" data-input="rfTotal"></div>' +
      '<div class="f"><label>Cost a metre</label><input type="number" id="rfC_' + i + '" data-input="rfTotal" value="' + ((one(D().fabrics, fid || (cloths[0] && cloths[0].id)) || {}).cost || '') + '"></div>' +
      '<div class="f"><label>GST %</label><input type="number" id="rfG_' + i + '" data-input="rfTotal" value="5"></div></div>';
  }
  A.receiveFabric = function (fid) {
    var f0 = fid && one(D().fabrics, fid), vid = f0 ? f0.vendor : (D().vendors[0] || {}).id;
    RF_N = 1;
    GE.modal('<h2>Receive fabric</h2><p class="sub">From a vendor’s bill: vendor first, then each cloth on it. It goes into our stock and into what we owe them.</p>' +
      '<div class="two"><div class="f"><label>Vendor</label><select id="rfVendor" data-change="rfVendorPick">' + D().vendors.map(function (v) { return '<option value="' + v.id + '"' + (v.id === vid ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join('') +
      '<option value="__new">+ Add a new vendor</option></select>' +
      '<div class="rfnew" id="rfNewV" hidden><input id="rfNVName" placeholder="Vendor name"><input id="rfNVCity" placeholder="City"><input type="number" id="rfNVDays" placeholder="Days to deliver"></div></div>' +
      '<div class="f"><label>Their bill number</label><input id="rfBill"></div></div>' +
      '<div class="two"><div class="f"><label>Received on</label><input type="date" id="rfAt" value="' + GE.localToday() + '"></div><div class="f"><label>Where it goes</label><select id="rfLoc"><option>Store</option><option>Godown</option></select></div></div>' +
      '<div id="rfRows">' + rfRow(0, vid, fid) + '</div>' +
      '<div class="btnrow"><button class="mini" data-act="rfAddRow">+ Another cloth on this bill</button> <button class="mini" data-act="rfAddFive">+ 5 more rows</button></div>' +
      '<p class="rftotal" id="rfTotal"></p><p class="hint" id="rfWait"></p>' +
      '<div class="btnrow"><button class="btn gold" data-act="saveFabricIn">Receive it</button> <button class="btn alt" data-act="saveFabricNext">Receive, then the next bill</button></div>' +
      '<p class="hint">Many cloths? Add rows here, or use the Excel sheet on the Fabric stock screen.</p>');
    A.rfTotal();
  };
  A.rfVendorPick = function () {
    var vid = document.getElementById('rfVendor').value; document.getElementById('rfNewV').hidden = vid !== '__new';
    for (var i = 0; i < RF_N; i++) { var box = document.querySelector('.rfrow[data-row="' + i + '"]'); if (box) box.outerHTML = rfRow(i, vid === '__new' ? 'none' : vid); }
    A.rfTotal();
  };
  A.rfCloth = function (i) {
    var sel = document.getElementById('rfFab_' + i); document.getElementById('rfNew_' + i).hidden = sel.value !== '__new';
    var f = one(D().fabrics, sel.value); if (f) document.getElementById('rfC_' + i).value = f.cost; A.rfTotal();
  };
  A.rfAddFive = function () { for (var k = 0; k < 5; k++) A.rfAddRow(); };
  A.saveFabricNext = function () { var vid = document.getElementById('rfVendor').value; if (A.saveFabricIn() === false) return; A.receiveFabric(); var v = document.getElementById('rfVendor'); if (v && vid !== '__new') { v.value = vid; A.rfVendorPick(); } };
  A.rfAddRow = function () { var vid = document.getElementById('rfVendor').value; document.getElementById('rfRows').insertAdjacentHTML('beforeend', rfRow(RF_N, vid === '__new' ? 'none' : vid)); RF_N++; A.rfTotal(); };
  A.rfTotal = function () {
    var t = 0, m = 0, waits = [];
    for (var i = 0; i < RF_N; i++) {
      var M = document.getElementById('rfM_' + i); if (!M) continue;
      var mm = Number(M.value) || 0, c = Number(document.getElementById('rfC_' + i).value) || 0, g = Number(document.getElementById('rfG_' + i).value) || 0;
      t += GE.withGst(mm * c, g); m += mm;
      var fid = document.getElementById('rfFab_' + i).value;
      D().garments.forEach(function (gg) { if (gg.awaited_fabric && !GE.garmentInStock(gg) && GE.fabricsOf(gg).some(function (u) { return u.fabric === fid; })) waits.push(gg.order); });
    }
    var e = document.getElementById('rfTotal'); if (e) e.innerHTML = 'Bill: <b>' + m + ' m</b>, <b>' + rupees(t) + '</b> with GST.';
    var w = document.getElementById('rfWait'); if (w) w.textContent = waits.length ? 'Waiting for this cloth: ' + waits.join(', ') + '. Their stylists will be told to collect ' + GE.advRule().fabric + '%.' : '';
  };
  A.saveFabricIn = function () {
    var v = function (i) { var e = document.getElementById(i); return e ? e.value : ''; };
    var vid = v('rfVendor');
    if (vid === '__new') {
      if (!v('rfNVName').trim()) { GE.toast('Name the new vendor.'); return false; }
      vid = GE.uid('V-'); D().vendors.push({ id: vid, name: v('rfNVName').trim(), city: v('rfNVCity'), days: Number(v('rfNVDays')) || 21, contact: '' });
    }
    var rows = [];
    for (var i = 0; i < RF_N; i++) {
      if (!document.getElementById('rfM_' + i)) continue;
      var fid = v('rfFab_' + i), m = Number(v('rfM_' + i)) || 0, c = Number(v('rfC_' + i)) || 0, g = v('rfG_' + i) === '' ? 5 : Number(v('rfG_' + i));
      if (!m) continue;
      if (fid === '__new') {
        if (!v('rfNB_' + i).trim()) { GE.toast('Row ' + (i + 1) + ': give the new cloth a brand.'); return false; }
        fid = GE.uid('F-'); D().fabrics.push({ id: fid, brand: v('rfNB_' + i).trim(), colour: v('rfNC_' + i).trim(), pattern: v('rfNP_' + i).trim(), book: '', vendor: vid, cost: c, sell_m: 0, threshold: 5,
          procure_days: (one(D().vendors, vid) || {}).days || 21, at_vendor: 0, hex: '#b9b2a6', img: '', sat_days: 0, sold_90: 0 });
      }
      if (!one(D().fabrics, fid)) { GE.toast('Row ' + (i + 1) + ': choose the cloth.'); return false; }
      rows.push({ fid: fid, m: m, c: c, g: g });
    }
    if (!rows.length) { GE.toast('How many metres came in?'); return false; }
    var at = v('rfAt') || GE.localToday(), pid = 'FAB-' + ('0' + (fabBills().length + 1)).slice(-2);
    while (one(D().purchases, pid)) pid += 'b';
    D().purchases.push({ id: pid, type: 'fabric', supplier: vid, at: at, credit_days: 30, advance: 0, bill: v('rfBill'), note: rows.map(function (r) { var f = one(D().fabrics, r.fid); return r.m + ' m ' + f.brand + ' ' + f.colour; }).join(', '),
      amount: sum(rows, function (r) { return GE.withGst(r.m * r.c, r.g); }) });
    rows.forEach(function (r) {
      D().fabric_lots.push({ id: GE.uid('FL-'), code: GE.nextLotCode(at), fabric: r.fid, vendor: vid, at: at, metres: r.m, cost_m: r.c, gst: r.g, bill: v('rfBill'), location: v('rfLoc'), purchase: pid });
      var f = one(D().fabrics, r.fid); if (r.c) f.cost = r.c;
    });
    GE.save(); GE.closeModal(); GE.go('#/fabricstock');
    GE.toast(rows.length + (rows.length === 1 ? ' cloth' : ' cloths') + ' received on ' + pid + ', ' + sum(rows, function (r) { return r.m; }) + ' m. Owed to ' + one(D().vendors, vid).name + ' now ' + rupees(vendorFabric(vid).owed) + '.');
  };

  /* ================= Stitching charges: what we charge to stitch each outfit ================= */
  V['#/stitching'] = function () {
    var ed = GE.canPrice();
    var h = U.head('Stitching charges', 'What we charge to stitch each outfit, and its design charge. These come into an order beside the fabric, at 18% GST.',
      ed ? '<button class="btn gold" data-act="newStitch">Add an outfit</button> ' + GE.sheetButtons('stitching') : '');
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

  /* ---------- Labels carry BOTH codes, holding the same plain text: a QR for phones and 2D scanners,
     and a Code 128 barcode for the 1D scanners a stockroom already has (any USB or Bluetooth scanner in
     keyboard mode types the code and presses Enter; the cockpit listens for that anywhere) ---------- */
  var QRJS = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  var BCJS = 'https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.6/JsBarcode.all.min.js';
  function drawCodes() {
    var go = function () {
      if (!window.QRCode || !window.JsBarcode) return;
      [].forEach.call(document.querySelectorAll('.qr[data-code]'), function (el) {
        if (el.getAttribute('data-done')) return; el.setAttribute('data-done', '1'); el.innerHTML = '';
        try { new window.QRCode(el, { text: el.getAttribute('data-code'), width: 96, height: 96, correctLevel: window.QRCode.CorrectLevel.M }); } catch (e) {} });
      [].forEach.call(document.querySelectorAll('svg.bc[data-code]'), function (el) {
        if (el.getAttribute('data-done')) return; el.setAttribute('data-done', '1');
        try { window.JsBarcode(el, el.getAttribute('data-code'), { format: 'CODE128', height: 34, width: 1.4, margin: 4, displayValue: false, background: '#ffffff', lineColor: '#000000' }); } catch (e) {} });
    };
    if (window.QRCode && window.JsBarcode) return go();
    if (!document.head) return;
    [['qrLoad', QRJS], ['bcLoad', BCJS]].forEach(function (x) {
      if (document.getElementById(x[0])) return;
      var sc = document.createElement('script'); sc.id = x[0]; sc.src = x[1]; sc.onload = go; document.head.appendChild(sc);
    });
  }
  GE.drawCodes = drawCodes; GE.drawBarcodes = drawCodes;
  function labelSheet(items) {
    var w = window.open('', '_blank'); if (!w) return false;
    w.document.write('<!doctype html><meta charset="utf-8"><title>Saasya Men labels</title><style>body{font:11px Arial,sans-serif;margin:8mm}' +
      '.g{display:grid;grid-template-columns:repeat(3,62mm);gap:4mm}.l{border:1px dashed #bbb;padding:2.5mm 3mm;height:44mm;box-sizing:border-box;display:flex;flex-direction:column;gap:1.5mm}.t{display:flex;gap:3mm;align-items:center}' +
      '.l b{display:block;font-size:9px;letter-spacing:.14em}.l .n{font-size:10.5px;margin:1mm 0}.l .c{font:600 11px monospace}.q{width:24mm;height:24mm;flex:none}.q img,.q canvas{width:24mm!important;height:24mm!important}.bc{width:100%;height:11mm}@media print{.l{border:0}}</style>' +
      '<div class="g">' + items.map(function (it) {
        return '<div class="l"><div class="t"><div class="q" data-code="' + esc(it.code) + '"></div><div><b>SAASYA MEN</b><div class="n">' + esc(it.line1) + '</div><div>' + esc(it.line2) + '</div><div class="c">' + esc(it.code) + '</div></div></div><svg class="bc" data-code="' + esc(it.code) + '"></svg></div>'; }).join('') + '</div>' +
      '<script src="' + QRJS + '"><\/script><script src="' + BCJS + '"><\/script><script>document.querySelectorAll(".q").forEach(function(e){new QRCode(e,{text:e.getAttribute("data-code"),width:120,height:120})});document.querySelectorAll(".bc").forEach(function(e){JsBarcode(e,e.getAttribute("data-code"),{format:"CODE128",height:40,width:1.6,margin:0,displayValue:false})});setTimeout(function(){window.print()},500)<\/script>');
    w.document.close(); return true;
  }
  A.printLabels = function (ids, quiet) {
    var list;
    if (ids === 'filtered') list = GE.filterBar('#/stock', D().pieces, { fields: pieceFields(), date: 'received' }).rows;
    else list = String(ids || '').split(',').map(function (i) { return one(D().pieces, i); }).filter(Boolean);
    if (!list.length) { GE.toast('No pieces to label.'); return; }
    if (!labelSheet(list.map(function (p) { return { code: p.barcode, line1: p.name + (p.size ? ', size ' + p.size : ''), line2: 'MRP ' + rupees(GE.withGst(GE.piecePrice(p), p.gst)) + ' incl. GST' }; })) && !quiet)
      GE.toast('Allow pop-ups for this site to print labels.');
  };
  A.printLotLabel = function (id) {
    var l = one(D().fabric_lots, id), f = one(D().fabrics, l.fabric) || {};
    if (!labelSheet([{ code: l.code, line1: f.brand + ' ' + f.colour + ', ' + l.metres + ' m', line2: rupees(GE.sellOf(f)) + ' a metre' }])) GE.toast('Allow pop-ups for this site to print labels.');
  };
  /* the phone's or laptop's camera reads the QR, inside the cockpit */
  /* the camera of a phone, an iPad or a laptop reads a QR tag and hands the code to whoever asked */
  GE.camScan = function (cb, title) {
    GE.modal('<h2>' + esc(title || 'Scan with the camera') + '</h2><p class="sub">Hold the QR tag up to the camera.</p><div id="camReader" style="width:100%;max-width:420px"></div><p class="hint" id="camMsg">Starting the camera…</p>' +
      '<div class="f" style="margin-top:10px"><label>Or type the code</label><input id="camType" placeholder="SM2610-0026" autocomplete="off"></div><button class="mini" data-act="camTyped">Use this code</button>');
    CAM_CB = cb;
    var go = function () {
      var q = new window.Html5Qrcode('camReader'); CAM_Q = q;
      q.start({ facingMode: 'environment' }, { fps: 10, qrbox: 220 }, function (text) {
        q.stop().catch(function () {}); CAM_Q = null; GE.closeModal(); var f = CAM_CB; CAM_CB = null; if (f) f(text);
      }).then(function () { var m = document.getElementById('camMsg'); if (m) m.textContent = 'Point it at the label.'; }, function () { CAM_Q = null; var m = document.getElementById('camMsg'); if (m) m.textContent = 'The camera could not start. Allow the camera for this site, or type the code below.'; });
    };
    if (window.Html5Qrcode) return go();
    if (!document.head) return;
    var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'; sc.onload = go; document.head.appendChild(sc);
  };
  var CAM_CB = null, CAM_Q = null;
  A.camTyped = function () {
    var v = (document.getElementById('camType') || {}).value; if (!v) { GE.toast('Type the code first.'); return; }
    if (CAM_Q) { try { var st = CAM_Q.stop(); if (st && st.catch) st.catch(function () {}); } catch (e) {} CAM_Q = null; }
    GE.closeModal(); var f = CAM_CB; CAM_CB = null; if (f) f(v.trim());
  };
  A.camScan = function (target) {
    GE.camScan(function (text) {
      if (target && document.getElementById(target)) { var el = document.getElementById(target); el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); return; }
      openCode(text);
    });
  };
  /* a code opens what it belongs to: a piece or a fabric lot */
  function openCode(code) {
    var p = GE.findBarcode(code); if (p) { A.openPiece(p.id); return true; }
    var l = GE.findLot(code); if (l) { A.openLot(l.id); return true; }
    GE.toast('Nothing has the code ' + code + '.'); return false;
  }
  GE.openCode = openCode;

  /* ---------- the scanner: a barcode gun types fast and ends with Enter ---------- */
  var buf = '', last = 0;
  document.addEventListener('keydown', function (e) {
    var t = e.target, inScan = t && t.getAttribute && t.getAttribute('data-scan');
    if (e.key === 'Enter' && inScan) { if (openCode(t.value)) t.value = ''; e.preventDefault(); return; }
    if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;     /* typing in a form is typing, not scanning */
    var now = Date.now();
    if (now - last > 60) buf = '';
    last = now;
    if (e.key === 'Enter') { var code = buf; buf = ''; if (code.length >= 6 && (GE.findBarcode(code) || GE.findLot(code))) { openCode(code); e.preventDefault(); } return; }
    if (e.key.length === 1) buf += e.key;
  });
})();
