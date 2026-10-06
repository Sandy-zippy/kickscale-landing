/* Accounts: on-order purchases and consignment. Payments are made in Tally; the cockpit records
   them, and sets what was received, returned and sold against what was billed and paid. */
(function () {
  var V = GE.VIEWS, A = GE.ACTIONS, U = GE.ui;
  var esc = GE.esc, rupees = GE.rupees, d = GE.d, one = GE.one, by = GE.by, sum = GE.sum;
  function D() { return GE.D; }
  var who = function (s) { return GE.whoSupplies(s); };
  var MODES = ['Net transfer', 'Cheque', 'UPI (GPay / PhonePe / Razorpay)', 'Cash', 'Credit card', 'Debit card'];
  function month() { return GE.Q['#/acc.month'] || GE.localToday().slice(0, 7); }
  function monthRange(m) { var y = +m.slice(0, 4), mo = +m.slice(5, 7); var last = new Date(y, mo, 0).getDate(); return [m + '-01', m + '-' + ('0' + last).slice(-2)]; }
  function monthName(m) { return new Date(m + '-01T00:00:00').toLocaleString('en-IN', { month: 'long', year: 'numeric' }); }
  function monthPicker() {
    return '<label class="mpick">Statement month <input type="month" value="' + month() + '" data-change="accMonth"></label>';
  }
  A.accMonth = function (id, el) { GE.Q['#/acc.month'] = el.value || GE.localToday().slice(0, 7); GE.refresh(); };

  /* ================= On-order purchases ================= */
  V['#/purchases'] = function () {
    var purs = D().purchases.filter(function (p) { return p.type === 'on-order'; });
    var sums = purs.map(function (p) { return GE.purchaseSummary(p.id); });
    var h = U.head('On-order purchases', 'What we bought from each designer: the advance, the pieces, what went back and when, what has sold, and what we owe because of it.',
      '<button class="btn gold" data-act="receiveGoods">Receive a purchase</button>');
    h += '<div class="kpis">' + U.kpi(sum(sums, function (x) { return x.pieces.length; }), 'Pieces bought', purs.length + ' purchases') +
      U.kpi(GE.lakh(sum(sums, function (x) { return x.advance; })), 'Advance paid', 'to designers, in all') +
      U.kpi(sum(sums, function (x) { return x.sold.length; }), 'Sold', GE.lakh(sum(sums, function (x) { return x.soldCost; })) + ' at cost') +
      U.kpi(sum(sums, function (x) { return x.returned.length; }), 'Returned', 'went back to the designer') +
      U.kpi(GE.lakh(sum(sums, function (x) { return x.owed; })), 'We owe now', 'sold beyond the advance') + '</div>';
    h += '<div class="card" style="overflow-x:auto"><table><thead><tr><th>Purchase</th><th>Designer</th><th class="num">In</th><th class="num">Returned</th><th class="num">Sold</th><th class="num">On hand</th>' +
      '<th class="num">Advance</th><th class="num">Sold at cost</th><th class="num">We owe</th><th>Credit</th><th></th></tr></thead><tbody>';
    sums.forEach(function (x) {
      var p = x.purchase;
      h += '<tr class="click" data-act="openPurchase" data-id="' + p.id + '"><td><b>' + p.id + '</b><div class="sub">' + d(p.at) + (p.bill ? ' · ' + esc(p.bill) : '') + '</div></td>' +
        '<td>' + esc(who(p.supplier)) + '</td><td class="num">' + x.pieces.length + '</td><td class="num">' + x.returned.length + '</td><td class="num">' + x.sold.length + '</td><td class="num">' + x.onHand.length + '</td>' +
        '<td class="num">' + rupees(x.advance) + '</td><td class="num">' + rupees(x.soldCost) + '</td>' +
        '<td class="num"><b>' + rupees(x.owed) + '</b>' + (x.credit ? '<div class="sub">' + rupees(x.credit) + ' advance unused</div>' : '') + '</td>' +
        '<td>' + (x.due ? d(x.due) + '<div class="sub">' + (x.daysLeft < 0 ? U.pill(-x.daysLeft + ' days over', 'bad') : x.daysLeft + ' days left') + '</div>' : '—') + '</td>' +
        '<td><button class="mini">Open</button></td></tr>';
    });
    if (!sums.length) h += '<tr><td colspan="11" class="sub">No on-order purchases yet. Receive one.</td></tr>';
    h += '</tbody></table></div>';
    h += '<div class="card"><div class="cardhead"><h3>Designer-wise report</h3>' + monthPicker() + '</div><p class="sub">One click, for any designer we buy from: received, returned with the days held, sold, the advance, what has been paid and what we owe.</p><div class="btnrow">' +
      uniq(purs.map(function (p) { return p.supplier; })).map(function (sup) {
        return '<span class="rep"><b>' + esc(who(sup)) + '</b> <button class="mini" data-act="onOrderPdf" data-id="' + sup + '">PDF</button> <button class="mini" data-act="onOrderXls" data-id="' + sup + '">Excel</button></span>'; }).join('') + '</div></div>';
    h += '<p class="hint">We owe for what has sold, at its cost after GST, less the advance and what has been paid. A piece we do not want is returned and owes nothing. Payments are made in Tally and recorded here.</p>';
    return h;
  };
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  A.openPurchase = function (id) {
    var x = GE.purchaseSummary(id), p = x.purchase;
    var h = '<div class="dstick"><h1>' + p.id + ' · ' + esc(who(p.supplier)) + '</h1>' + U.pill(x.owed ? 'we owe ' + rupees(x.owed) : 'nothing owed', x.owed ? 'warn' : 'ok') + '</div>' +
      '<p class="sub">Bought ' + d(p.at) + (p.bill ? ' · their bill ' + esc(p.bill) : '') + (p.credit_days ? ' · ' + p.credit_days + '-day credit, ends ' + d(x.due) : '') + '</p>';
    h += '<div class="kpis">' + U.kpi(x.pieces.length, 'Pieces in', rupees(x.costIn) + ' at cost') + U.kpi(x.returned.length, 'Returned', rupees(x.costReturned)) +
      U.kpi(x.sold.length, 'Sold', rupees(x.soldCost) + ' at cost') + U.kpi(x.onHand.length, 'On hand', rupees(x.costOnHand)) + '</div>';
    h += '<div class="card"><table class="mon"><tbody>' +
      '<tr><td>Sold, at cost after GST</td><td>' + rupees(x.soldCost) + '</td></tr>' +
      '<tr><td>Less the advance paid</td><td>− ' + rupees(x.advance) + '</td></tr>' +
      '<tr><td>Less payments since</td><td>− ' + rupees(x.paid) + '</td></tr>' +
      '<tr class="pend"><td>We owe ' + esc(who(p.supplier)) + '</td><td>' + rupees(x.owed) + '</td></tr>' +
      (x.credit ? '<tr><td>Advance not yet used up</td><td>' + rupees(x.credit) + '</td></tr>' : '') + '</tbody></table>' +
      '<div class="btnrow" style="margin-top:12px"><button class="btn gold" data-act="supPay" data-id="on-order|' + p.supplier + '|' + p.id + '">Record a payment</button> ' +
      '<button class="mini" data-act="onOrderPdf" data-id="' + p.supplier + '">Designer report, PDF</button> <button class="mini" data-act="onOrderXls" data-id="' + p.supplier + '">Excel</button></div></div>';
    h += '<div class="card" style="overflow-x:auto"><h3>Every piece</h3><table><thead><tr><th>Barcode</th><th>Piece</th><th>Size</th><th class="num">Cost after GST</th><th class="num">MRP</th><th>Status</th><th>Days held</th></tr></thead><tbody>';
    x.pieces.forEach(function (pc) {
      h += '<tr class="click" data-act="openPiece" data-id="' + pc.id + '"><td><code>' + esc(pc.barcode) + '</code></td><td>' + esc(pc.name) + '</td><td>' + esc(pc.size) + '</td>' +
        '<td class="num">' + rupees(GE.withGst(pc.cost_ex, pc.gst)) + '</td><td class="num">' + rupees(GE.withGst(pc.price_ex, pc.gst)) + '</td><td>' + GE.pieceStatusPill(pc) +
        (pc.status === 'sold' ? '<div class="sub">' + d(pc.sold_at) + '</div>' : pc.status === 'returned' ? '<div class="sub">' + d(pc.returned_at) + '</div>' : '') + '</td>' +
        '<td>' + GE.days(pc.received, pc.returned_at || pc.sold_at || GE.localToday()) + (pc.status === 'returned' ? ' <span class="sub">then returned</span>' : '') + '</td></tr>';
    });
    h += '</tbody></table></div>';
    h += payTable(p.supplier, p.id);
    GE.drawer(h);
  };
  function payTable(sup, purId, kind) {
    var pays = (D().supplier_payments || []).filter(function (x) { return x.supplier === sup && (purId ? x.purchase === purId : x.kind === kind); });
    var h = '<div class="card"><h3>Payments recorded</h3><table><thead><tr><th>When</th><th>What</th><th>How</th><th>Tally / reference</th><th class="num">Amount</th></tr></thead><tbody>';
    pays.forEach(function (x) { h += '<tr><td>' + d(x.at) + '</td><td>' + esc(x.advance ? 'Advance' : (x.note || 'Payment')) + '</td><td>' + esc(x.mode) + '</td><td class="sub">' + esc(x.ref || '') + '</td><td class="num">' + rupees(x.amount) + '</td></tr>'; });
    if (!pays.length) h += '<tr><td colspan="5" class="sub">Nothing recorded yet.</td></tr>';
    return h + '</tbody></table><p class="hint">The accountant pays in Tally. Record it here with the Tally reference, so stock and money can be matched.</p></div>';
  }
  A.supPay = function (id) {
    var p = id.split('|'), kind = p[0], sup = p[1], pur = p[2] || '';
    var owed = kind === 'on-order' ? GE.purchaseSummary(pur).owed : GE.consignmentSummary(sup).toPay;
    GE.modal('<h2>Record a payment to ' + esc(who(sup)) + '</h2><p class="sub">' + (kind === 'on-order' ? 'Purchase ' + pur : 'Consignment') + ' · owed now ' + rupees(owed) + '. Paid in Tally, recorded here.</p>' +
      '<div class="two"><div class="f"><label>Amount</label><input type="number" id="spAmt" value="' + owed + '"></div>' +
      '<div class="f"><label>Paid on</label><input type="date" id="spAt" value="' + GE.localToday() + '"></div></div>' +
      '<div class="two"><div class="f"><label>How</label><select id="spMode">' + MODES.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Tally voucher or bank reference</label><input id="spRef"></div></div>' +
      '<div class="f"><label>Note</label><input id="spNote" placeholder="Against their bill for September sales"></div>' +
      '<button class="btn gold" data-act="saveSupPay" data-id="' + esc(id) + '">Record it</button>');
  };
  A.saveSupPay = function (id) {
    var p = id.split('|'), $ = function (i) { return document.getElementById(i).value; };
    var amt = Number($('spAmt')) || 0; if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    D().supplier_payments.push({ id: GE.uid('SP-'), supplier: p[1], kind: p[0], purchase: p[2] || '', amount: amt, at: $('spAt') || GE.localToday(), mode: $('spMode'), ref: $('spRef'), note: $('spNote'), advance: false, by: GE.me().id });
    GE.save(); GE.closeModal();
    if (p[0] === 'on-order') A.openPurchase(p[2]); else A.openConsignment(p[1]);
    GE.toast(rupees(amt) + ' to ' + who(p[1]) + ' recorded.');
  };

  /* ================= Consignment ================= */
  V['#/consignment'] = function () {
    var sups = uniq(D().pieces.filter(function (p) { return p.source === 'consignment'; }).map(function (p) { return p.supplier; }));
    var r = monthRange(month());
    var rows = sups.map(function (s) { return GE.consignmentSummary(s, r[0], r[1]); });
    var all = sups.map(function (s) { return GE.consignmentSummary(s); });
    var h = U.head('Consignment', 'Designers’ pieces lying in our store. Not ours until sold; then our share is ' + '30% and theirs 70% of the price before GST. Each month, one click sends each designer what sold.',
      '<button class="btn gold" data-act="receiveGoods">Receive a consignment</button>');
    h += '<div class="kpis">' + U.kpi(sum(all, function (x) { return x.pieces.length; }), 'Pieces received', sups.length + ' designers') +
      U.kpi(sum(all, function (x) { return x.onHand.length; }), 'On our floor', 'not ours, theirs') +
      U.kpi(sum(rows, function (x) { return x.sold.length; }), 'Sold in ' + monthName(month()), rupees(sum(rows, function (x) { return x.pre; })) + ' before GST') +
      U.kpi(GE.lakh(sum(rows, function (x) { return x.ours; })), 'Our share that month', 'before GST') +
      U.kpi(GE.lakh(sum(all, function (x) { return x.toPay; })), 'Billed, not yet paid', 'from their invoices') + '</div>';
    h += '<div class="card"><div class="cardhead"><h3>By designer</h3>' + monthPicker() + '</div><div style="overflow-x:auto"><table><thead><tr><th>Designer</th><th class="num">Received</th><th class="num">On floor</th><th class="num">Returned</th>' +
      '<th class="num">Sold this month</th><th class="num">Sale before GST</th><th class="num">Our 30%</th><th class="num">Their 70%</th><th class="num">Billed, unpaid</th><th>Statement</th></tr></thead><tbody>';
    rows.forEach(function (x, i) {
      var a = all[i];
      h += '<tr class="click" data-act="openConsignment" data-id="' + x.supplier + '"><td><b>' + esc(who(x.supplier)) + '</b><div class="sub">margin ' + GE.supplierMargin(x.supplier) + '%</div></td>' +
        '<td class="num">' + a.pieces.length + '</td><td class="num">' + a.onHand.length + '</td><td class="num">' + a.returned.length + '</td><td class="num">' + x.sold.length + '</td>' +
        '<td class="num">' + rupees(x.pre) + '</td><td class="num">' + rupees(x.ours) + '</td><td class="num"><b>' + rupees(x.theirs) + '</b></td><td class="num">' + rupees(a.toPay) + '</td>' +
        '<td><button class="mini" data-act="conPdf" data-id="' + x.supplier + '">PDF</button> <button class="mini" data-act="conXls" data-id="' + x.supplier + '">Excel</button></td></tr>';
    });
    if (!rows.length) h += '<tr><td colspan="10" class="sub">No consignment stock yet.</td></tr>';
    h += '</tbody></table></div></div>';
    h += '<p class="hint">The statement tells the designer what sold and at what price. They send their invoice; record it here, the accountant pays it in Tally, record the payment. Nothing is owed until their invoice comes in.</p>';
    return h;
  };
  A.openConsignment = function (sup) {
    var a = GE.consignmentSummary(sup), r = monthRange(month()), x = GE.consignmentSummary(sup, r[0], r[1]);
    var h = '<div class="dstick"><h1>' + esc(who(sup)) + '</h1>' + U.pill('consignment, ' + GE.supplierMargin(sup) + '% ours', 'gold') + '</div>' +
      '<p class="sub">' + a.pieces.length + ' pieces received · ' + a.onHand.length + ' on our floor · ' + a.returned.length + ' returned</p>';
    h += '<div class="card"><table class="mon"><tbody>' +
      '<tr><td>Sold, their share before GST, all time</td><td>' + rupees(a.theirsAll) + '</td></tr>' +
      '<tr><td>Their invoices received</td><td>' + rupees(a.billed) + '</td></tr>' +
      '<tr><td>Paid, recorded from Tally</td><td>− ' + rupees(a.paid) + '</td></tr>' +
      '<tr class="pend"><td>Billed, still to pay</td><td>' + rupees(a.toPay) + '</td></tr>' +
      (a.notBilled ? '<tr><td>Sold, their invoice not yet in</td><td>' + rupees(a.notBilled) + '</td></tr>' : '') + '</tbody></table>' +
      '<div class="btnrow" style="margin-top:12px"><button class="btn gold" data-act="supBill" data-id="' + sup + '">Record their invoice</button> <button class="mini" data-act="supPay" data-id="consignment|' + sup + '">Record a payment</button> ' +
      '<button class="mini" data-act="conPdf" data-id="' + sup + '">' + monthName(month()) + ' statement, PDF</button> <button class="mini" data-act="conXls" data-id="' + sup + '">Excel</button></div></div>';
    h += '<div class="card" style="overflow-x:auto"><h3>Their pieces</h3><table><thead><tr><th>Barcode</th><th>Piece</th><th>Size</th><th class="num">Price before GST</th><th class="num">MRP</th><th>Status</th><th class="num">Their 70%</th></tr></thead><tbody>';
    a.pieces.forEach(function (pc) {
      var l = GE.consignmentLine(pc);
      h += '<tr class="click" data-act="openPiece" data-id="' + pc.id + '"><td><code>' + esc(pc.barcode) + '</code></td><td>' + esc(pc.name) + '</td><td>' + esc(pc.size) + '</td>' +
        '<td class="num">' + rupees(l.pre) + '</td><td class="num">' + rupees(l.mrp) + '</td><td>' + GE.pieceStatusPill(pc) + (pc.sold_at ? '<div class="sub">' + d(pc.sold_at) + '</div>' : '') + '</td>' +
        '<td class="num">' + (pc.status === 'sold' ? rupees(l.theirs) : '<span class="sub">when sold</span>') + '</td></tr>';
    });
    h += '</tbody></table></div>';
    var bills = (D().supplier_bills || []).filter(function (b) { return b.supplier === sup; });
    h += '<div class="card"><h3>Their invoices</h3><table><thead><tr><th>Received</th><th>Their bill</th><th>For</th><th class="num">Amount</th></tr></thead><tbody>' +
      (bills.length ? bills.map(function (b) { return '<tr><td>' + d(b.at) + '</td><td>' + esc(b.bill_no) + '</td><td class="sub">' + esc(b.note || '') + '</td><td class="num">' + rupees(b.amount) + '</td></tr>'; }).join('')
        : '<tr><td colspan="4" class="sub">None yet.</td></tr>') + '</tbody></table></div>';
    h += payTable(sup, null, 'consignment');
    GE.drawer(h);
  };
  A.supBill = function (sup) {
    var a = GE.consignmentSummary(sup);
    GE.modal('<h2>Their invoice</h2><p class="sub">' + esc(who(sup)) + ' bills us for what sold. Their share of everything sold so far: ' + rupees(a.theirsAll) + '; already billed ' + rupees(a.billed) + '.</p>' +
      '<div class="two"><div class="f"><label>Their bill number</label><input id="sbNo"></div><div class="f"><label>Amount on it</label><input type="number" id="sbAmt" value="' + a.notBilled + '"></div></div>' +
      '<div class="two"><div class="f"><label>Received on</label><input type="date" id="sbAt" value="' + GE.localToday() + '"></div><div class="f"><label>For</label><input id="sbNote" placeholder="September sales"></div></div>' +
      '<button class="btn gold" data-act="saveSupBill" data-id="' + sup + '">Record it</button>');
  };
  A.saveSupBill = function (sup) {
    var $ = function (i) { return document.getElementById(i).value; }, amt = Number($('sbAmt')) || 0;
    if (amt <= 0) { GE.toast('Put the amount on their invoice.'); return; }
    D().supplier_bills.push({ id: GE.uid('SB-'), supplier: sup, kind: 'consignment', bill_no: $('sbNo'), at: $('sbAt') || GE.localToday(), amount: amt, note: $('sbNote') });
    GE.save(); GE.closeModal(); A.openConsignment(sup); GE.toast('Their invoice for ' + rupees(amt) + ' is recorded. It now shows as to pay.');
  };

  /* ================= one-click reports: PDF and Excel ================= */
  function sheetDoc(title, sub, heads, rows, totals, note, extra) {
    var r = function (n) { return typeof n === 'number' ? '₹' + Math.round(n).toLocaleString('en-IN') : esc(n); };
    return '<div class="inv"><div class="ih"><div class="il"><img src="assets/logo.png" alt="Saasya Men"><div><b>SAASYA MEN</b><span>' + esc(GE.HOUSE_INFO.addr) + '</span></div></div>' +
      '<div class="ir"><b>' + esc(title) + '</b><span>' + esc(sub) + '</span></div></div>' +
      '<table class="it"><thead><tr>' + heads.map(function (h, i) { return '<th' + (i >= heads.length - (totals ? totals.length : 0) ? ' class="n"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (row) { return '<tr>' + row.map(function (c, i) { return '<td' + (typeof c === 'number' ? ' class="n"' : '') + '>' + r(c) + '</td>'; }).join('') + '</tr>'; }).join('') +
      (totals ? '<tr class="tot">' + heads.map(function (h, i) { var k = i - (heads.length - totals.length); return '<td' + (k >= 0 ? ' class="n"' : '') + '>' + (i === 0 ? '<b>Total</b>' : k >= 0 ? '<b>' + r(totals[k]) + '</b>' : '') + '</td>'; }).join('') + '</tr>' : '') +
      '</tbody></table>' + (note ? '<div class="ib">' + note + '</div>' : '') + (extra || '') + '</div>';
  }
  function plainTable(heads, rows) {
    var r = function (n) { return typeof n === 'number' ? '₹' + Math.round(n).toLocaleString('en-IN') : esc(n); };
    return '<table class="it"><thead><tr>' + heads.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (row) { return '<tr>' + row.map(function (c) { return '<td' + (typeof c === 'number' ? ' class="n"' : '') + '>' + r(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function xls(name, sheets) {
    var go = function () {
      var wb = window.XLSX.utils.book_new();
      sheets.forEach(function (s) { window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(s.rows), s.name.slice(0, 31)); });
      window.XLSX.writeFile(wb, name);
    };
    if (window.XLSX) return go();
    var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    sc.onload = go; sc.onerror = function () { GE.toast('The Excel maker could not load. Check the internet connection.'); }; document.head.appendChild(sc);
  }
  GE.xls = xls; GE.sheetDoc = sheetDoc;
  function onOrderRows(sup) {
    return D().purchases.filter(function (p) { return p.type === 'on-order' && p.supplier === sup; }).map(function (p) { return GE.purchaseSummary(p.id); });
  }
  function conRows(sup) { var r = monthRange(month()); return GE.consignmentSummary(sup, r[0], r[1]); }
  GE.reports = {
    onOrder: function (sup) {
      var xs = onOrderRows(sup);
      var heads = ['Purchase', 'Date', 'Pieces in', 'Returned', 'Sold', 'On hand', 'Advance', 'Paid since', 'Sold at cost', 'We owe'];
      var rows = xs.map(function (x) { return [x.purchase.id, d(x.purchase.at), String(x.pieces.length), String(x.returned.length), String(x.sold.length), String(x.onHand.length), x.advance, x.paid, x.soldCost, x.owed]; });
      var pieces = [];
      xs.forEach(function (x) { x.pieces.forEach(function (pc) {
        pieces.push([x.purchase.id, pc.barcode, pc.name, pc.size, pc.status, d(pc.received), pc.status === 'returned' ? d(pc.returned_at) + ' (' + GE.days(pc.received, pc.returned_at) + ' days)' : pc.status === 'sold' ? d(pc.sold_at) : '',
          GE.withGst(pc.cost_ex, pc.gst), GE.withGst(pc.price_ex, pc.gst)]); }); });
      return { heads: heads, rows: rows, totals: [sum(xs, function (x) { return x.advance; }), sum(xs, function (x) { return x.paid; }), sum(xs, function (x) { return x.soldCost; }), sum(xs, function (x) { return x.owed; })],
        pieceHeads: ['Purchase', 'Barcode', 'Piece', 'Size', 'Status', 'Received', 'Sold or returned', 'Cost after GST', 'MRP'], pieces: pieces };
    },
    consignment: function (sup) {
      var x = conRows(sup);
      var heads = ['Barcode', 'Piece', 'Size', 'Sold on', 'Price before GST', 'GST', 'MRP', 'Saasya Men ' + GE.supplierMargin(sup) + '%', 'Yours ' + (100 - GE.supplierMargin(sup)) + '%'];
      var rows = x.sold.map(function (l) { return [l.piece.barcode, l.piece.name, l.piece.size, d(l.piece.sold_at), l.pre, l.gst, l.mrp, l.ours, l.theirs]; });
      return { summary: x, heads: heads, rows: rows, totals: [x.pre, x.gst, x.mrp, x.ours, x.theirs] };
    }
  };
  A.onOrderPdf = function (sup) {
    var r = GE.reports.onOrder(sup);
    GE.makePdf(sheetDoc('ON-ORDER PURCHASES', who(sup) + ' · as of ' + d(GE.localToday()), r.heads, r.rows, r.totals,
      'We owe for pieces sold, at cost after GST, less the advance and payments. Returned pieces owe nothing.', '<h4 style="margin:18px 0 6px">Every piece</h4>' + plainTable(r.pieceHeads, r.pieces)),
      'Saasya-Men-' + who(sup).replace(/[^A-Za-z]+/g, '-') + '-on-order.pdf');
    GE.toast('Making the ' + who(sup) + ' report…');
  };
  A.onOrderXls = function (sup) {
    var r = GE.reports.onOrder(sup);
    xls('Saasya-Men-' + who(sup).replace(/[^A-Za-z]+/g, '-') + '-on-order.xlsx', [{ name: 'Purchases', rows: [r.heads].concat(r.rows) }, { name: 'Pieces', rows: [r.pieceHeads].concat(r.pieces) }]);
  };
  A.conPdf = function (sup) {
    var r = GE.reports.consignment(sup), m = month();
    GE.makePdf(sheetDoc('CONSIGNMENT STATEMENT', who(sup) + ' · ' + monthName(m), r.heads, r.rows.length ? r.rows : [['', 'Nothing of yours sold this month', '', '', 0, 0, 0, 0, 0]], r.totals,
      r.summary.sold.length + ' of your pieces sold in ' + monthName(m) + '. ' + r.summary.onHand.length + ' are still on our floor. Please send your invoice for your share; we pay it on receipt.'),
      'Saasya-Men-' + who(sup).replace(/[^A-Za-z]+/g, '-') + '-' + m + '.pdf');
    GE.toast('Making the ' + monthName(m) + ' statement for ' + who(sup) + '…');
  };
  A.conXls = function (sup) {
    var r = GE.reports.consignment(sup);
    xls('Saasya-Men-' + who(sup).replace(/[^A-Za-z]+/g, '-') + '-' + month() + '.xlsx', [{ name: 'Sold ' + month(), rows: [r.heads].concat(r.rows).concat([['Total', '', '', ''].concat(r.totals)]) }]);
  };
})();
