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
    var sumsAll = purs.map(function (p) { return GE.purchaseSummary(p.id); });
    var fbp = GE.filterBar('#/purchases', sumsAll, { placeholder: 'Search a purchase, a designer, a bill', quick: ['designer', 'credit'], date: 'at', fields: [
      { k: 'id', label: 'Purchase', get: function (x) { return x.purchase.id; } }, { k: 'designer', label: 'Designer', type: 'enum', get: function (x) { return who(x.purchase.supplier); } },
      { k: 'bill', label: 'Their bill', get: function (x) { return x.purchase.bill; } }, { k: 'at', label: 'Bought on', type: 'date', get: function (x) { return x.purchase.at; } },
      { k: 'credit', label: 'Credit', type: 'enum', options: ['Over', 'Running', 'No credit'], all: 'Any credit state', get: function (x) { return x.due ? (x.daysLeft < 0 ? 'Over' : 'Running') : 'No credit'; } },
      { k: 'owed', label: 'We owe', type: 'num', get: function (x) { return x.owed; } }, { k: 'pieces', label: 'Pieces in', type: 'num', get: function (x) { return x.pieces.length; } },
      { k: 'sold', label: 'Sold', type: 'num', get: function (x) { return x.sold.length; } }, { k: 'left', label: 'Days of credit left', type: 'num', get: function (x) { return x.daysLeft == null ? 9999 : x.daysLeft; } }] });
    var sums = fbp.rows;
    var h = U.head('On-order purchases', 'What we bought from each designer: the advance, the pieces, what went back and when, what has sold, and what we owe because of it.',
      '<button class="btn gold" data-act="receiveGoods">Receive a purchase</button> ' + GE.sheetButtons('stock'));
    h += '<div class="kpis">' + U.kpi(sum(sums, function (x) { return x.pieces.length; }), 'Pieces bought', purs.length + ' purchases') +
      U.kpi(GE.lakh(sum(sums, function (x) { return x.advance; })), 'Advance paid', 'to designers, in all') +
      U.kpi(sum(sums, function (x) { return x.sold.length; }), 'Sold', GE.lakh(sum(sums, function (x) { return x.soldCost; })) + ' at cost') +
      U.kpi(sum(sums, function (x) { return x.returned.length; }), 'Returned', 'went back to the designer') +
      U.kpi(GE.lakh(sum(sums, function (x) { return x.owed; })), 'We owe now', 'sold beyond the advance') + '</div>';
    h += fbp.html;
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
    var rowsAll = sups.map(function (s) { return GE.consignmentSummary(s, r[0], r[1]); });
    var fbc = GE.filterBar('#/consignment', rowsAll, { placeholder: 'Search a designer', quick: ['designer'], fields: [
      { k: 'designer', label: 'Designer', type: 'enum', get: function (x) { return who(x.supplier); } }, { k: 'sold', label: 'Sold this month', type: 'num', get: function (x) { return x.sold.length; } },
      { k: 'floor', label: 'On our floor', type: 'num', get: function (x) { return x.onHand.length; } }, { k: 'theirs', label: 'Their 70% this month', type: 'num', get: function (x) { return x.theirs; } },
      { k: 'topay', label: 'Billed, unpaid', type: 'num', get: function (x) { return GE.consignmentSummary(x.supplier).toPay; } }] });
    var rows = fbc.rows;
    var all = rows.map(function (x) { return GE.consignmentSummary(x.supplier); });
    var h = U.head('Consignment', 'Designers’ pieces lying in our store. Not ours until sold; then our share is ' + '30% and theirs 70% of the price before GST. Each month, one click sends each designer what sold.',
      '<button class="btn gold" data-act="receiveGoods">Receive a consignment</button> ' + GE.sheetButtons('stock'));
    h += '<div class="kpis">' + U.kpi(sum(all, function (x) { return x.pieces.length; }), 'Pieces received', sups.length + ' designers') +
      U.kpi(sum(all, function (x) { return x.onHand.length; }), 'On our floor', 'not ours, theirs') +
      U.kpi(sum(rows, function (x) { return x.sold.length; }), 'Sold in ' + monthName(month()), rupees(sum(rows, function (x) { return x.pre; })) + ' before GST') +
      U.kpi(GE.lakh(sum(rows, function (x) { return x.ours; })), 'Our share that month', 'before GST') +
      U.kpi(GE.lakh(sum(all, function (x) { return x.toPay; })), 'Billed, not yet paid', 'from their invoices') + '</div>';
    h += fbc.html + '<div class="card"><div class="cardhead"><h3>By designer</h3>' + monthPicker() + '</div><div style="overflow-x:auto"><table><thead><tr><th>Designer</th><th class="num">Received</th><th class="num">On floor</th><th class="num">Returned</th>' +
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
    GE.house();
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

  /* ================= Rewards: credit notes and gift coupons, used once ================= */
  var RKINDS = { 'Credit note': 'SMCN', 'Gift coupon': 'SMGC', 'Reward': 'SMRW' };
  function canIssue() { return ['Owner', 'BDM', 'Accounts'].indexOf(GE.me().role) > -1; }
  function rState(r) { return r.used ? 'used on ' + r.used.order : (r.valid_until && r.valid_until < GE.localToday() ? 'expired' : 'open'); }
  V['#/rewards'] = function () {
    var all = D().rewards, open = all.filter(function (r) { return rState(r) === 'open'; });
    var fbr = GE.filterBar('#/rewards', all, { placeholder: 'Search a code, a client, a reason', quick: ['kind', 'state', 'client'], date: 'issued', fields: [
      { k: 'code', label: 'Code', get: function (r) { return r.code; } }, { k: 'kind', label: 'What it is', type: 'enum', options: Object.keys(RKINDS), get: function (r) { return r.kind; } },
      { k: 'state', label: 'State', type: 'enum', options: ['open', 'used', 'expired'], all: 'Any state', get: function (r) { var s2 = rState(r); return s2.indexOf('used') === 0 ? 'used' : s2; } },
      { k: 'client', label: 'Client', type: 'enum', get: function (r) { return U.cname(r.client); } }, { k: 'reason', label: 'Why', get: function (r) { return r.reason; } },
      { k: 'amount', label: 'Amount', type: 'num', get: function (r) { return r.amount; } }, { k: 'issued', label: 'Issued', type: 'date', get: function (r) { return r.issued; } },
      { k: 'until', label: 'Valid until', type: 'date', get: function (r) { return r.valid_until; } }, { k: 'order', label: 'Against', get: function (r) { return r.order; } }] });
    var list = fbr.rows;
    var h = U.head('Rewards', 'Credit notes for a damaged piece or an issue, gift coupons and rewards. Each has a code; it is used once, in full, as a payment on an order.',
      canIssue() ? '<button class="btn gold" data-act="newReward">Issue a credit note or coupon</button>' : '');
    h += '<div class="kpis">' + U.kpi(open.length, 'Open', rupees(sum(open, function (r) { return r.amount; })) + ' waiting to be used') +
      U.kpi(all.filter(function (r) { return r.used; }).length, 'Used', rupees(sum(all.filter(function (r) { return r.used; }), function (r) { return r.amount; }))) +
      U.kpi(open.filter(function (r) { return r.valid_until && GE.days(GE.localToday(), r.valid_until) <= 30; }).length, 'Running out in 30 days', '') + '</div>';
    h += fbr.html;
    h += '<div class="card" style="overflow-x:auto"><table><thead><tr><th>Code</th><th>What</th><th>Client</th><th>Why</th><th>Against</th><th>Valid until</th><th class="num">Amount</th><th>State</th><th></th></tr></thead><tbody>';
    list.slice().sort(function (a, b) { return a.issued < b.issued ? 1 : -1; }).forEach(function (r) {
      var st = rState(r);
      h += '<tr><td><code>' + esc(r.code) + '</code><div class="sub">' + d(r.issued) + '</div></td><td>' + esc(r.kind) + '</td><td>' + esc(U.cname(r.client)) + '</td><td class="sub">' + esc(r.reason) + '</td>' +
        '<td>' + esc(r.order || '—') + '</td><td>' + (r.valid_until ? d(r.valid_until) : '—') + '</td><td class="num">' + rupees(r.amount) + '</td>' +
        '<td>' + U.pill(st, st === 'open' ? 'ok' : st === 'expired' ? 'bad' : '') + (r.used ? '<div class="sub">' + d(r.used.at) + ' · ' + esc(r.used.doc) + '</div>' : '') + '</td>' +
        '<td><button class="mini" data-act="rewardPdf" data-id="' + r.id + '">PDF</button></td></tr>';
    });
    if (!list.length) h += '<tr><td colspan="9" class="sub">None yet.</td></tr>';
    return h + '</tbody></table></div><p class="hint">To use one: Record a payment on his order, choose "Credit note / gift coupon" and type the code. It comes off what is pending and cannot be used again.</p>';
  };
  A.newReward = function () {
    if (!canIssue()) return;
    var later = new Date(); later.setMonth(later.getMonth() + 6);
    GE.modal('<h2>Issue a credit note or coupon</h2>' +
      '<div class="two"><div class="f"><label>What it is</label><select id="rwKind">' + Object.keys(RKINDS).map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Amount</label><input type="number" id="rwAmt"></div></div>' +
      '<div class="f"><label>For which client</label><select id="rwClient">' + D().clients.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }).map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + ' · ' + esc(c.phone || '') + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Why</label><input id="rwWhy" placeholder="The collar thread came loose; goodwill for the wait; Diwali gift"></div>' +
      '<div class="two"><div class="f"><label>Against an order or invoice (optional)</label><input id="rwRef" placeholder="O-1045 or INV-2641"></div>' +
      '<div class="f"><label>Valid until</label><input type="date" id="rwUntil" value="' + new Date(later.getTime() - later.getTimezoneOffset() * 60000).toISOString().slice(0, 10) + '"></div></div>' +
      '<button class="btn gold" data-act="saveReward">Issue it</button>');
  };
  A.saveReward = function () {
    if (!canIssue()) { GE.toast('Only the owner, the BDM or accounts can issue these.'); return; }
    var v = function (i) { return document.getElementById(i).value; }, amt = Number(v('rwAmt')) || 0, ref = String(v('rwRef') || '').trim().toUpperCase();
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    if (!String(v('rwWhy')).trim()) { GE.toast('Say why it is being given.'); return; }
    if (ref && !one(D().orders, ref) && !one(D().invoices, ref)) { GE.toast('There is no order or invoice ' + ref + '.'); return; }
    var pre = RKINDS[v('rwKind')], n = 1001 + D().rewards.filter(function (r) { return r.code.indexOf(pre) === 0; }).length, code = pre + '-' + n;
    while (GE.rewardByCode(code)) code = pre + '-' + (++n);
    var r = { id: GE.uid('RW-'), code: code, kind: v('rwKind'), client: v('rwClient'), amount: amt, reason: v('rwWhy'), order: ref, issued: GE.localToday(), valid_until: v('rwUntil'), used: null, by: GE.me().id };
    D().rewards.push(r); GE.save(); GE.closeModal(); GE.refresh();
    GE.toast(r.kind + ' ' + code + ' for ' + rupees(amt) + ' issued to ' + U.cname(r.client) + '.');
  };
  A.rewardPdf = function (id) {
    var r = one(D().rewards, id); if (!r) return;
    var c = one(D().clients, r.client) || {}; GE.house();
    GE.makePdf('<div class="inv"><div class="ih"><div class="il"><img src="assets/logo.png" alt="Saasya Men"><div><b>SAASYA MEN</b><span>' + esc(GE.HOUSE_INFO.line) + '</span></div></div>' +
      '<div class="ir"><b>' + esc(r.kind.toUpperCase()) + '</b><span>' + esc(r.code) + ' · ' + d(r.issued) + '</span></div></div>' +
      '<div class="ib" style="margin-top:24px;font-size:15px">Mr. ' + esc((c.name || '').split(' ').slice(-1)[0]) + ', this ' + esc(r.kind.toLowerCase()) + ' is worth <b>' + rupees(r.amount) + '</b> against your next order with us' +
      (r.valid_until ? ', until ' + d(r.valid_until) : '') + '. Quote the code <b>' + esc(r.code) + '</b>. It is used once, in full.</div>' +
      '<p style="color:#6b6257">' + esc(r.reason) + (r.order ? ' · against ' + esc(r.order) : '') + '</p><div class="if"><div>' + esc(GE.HOUSE_INFO.addr) + '</div><div class="sg">For SAASYA MEN<br><br>Authorised signatory</div></div></div>',
      'Saasya-Men-' + r.code + '.pdf');
  };

  /* ================= Money in and out: every rupee, one place, ready for Tally ================= */
  var EXP_CATS = ['Porter / courier', 'Electricity (current bill)', 'Rent', 'Salaries and wages', 'Repairs and maintenance', 'Marketing', 'Packaging', 'Travel', 'Miscellaneous'];
  var BUY_CATS = { 'Fabric purchase': 'fabric', 'On-order purchase': 'on-order', 'Consignment payment': 'consignment' };
  function orderBlock(oid) {
    var gs = by(D().garments, 'order', oid), v = { 'Readymade sale, in-house': 0, 'Bespoke sale, in-house': 0, 'Third-party designer sale': 0 };
    gs.forEach(function (g) { v[GE.isThird(g) ? 'Third-party designer sale' : g.piece ? 'Readymade sale, in-house' : 'Bespoke sale, in-house'] += GE.garmentValue(g); });
    var best = Object.keys(v).sort(function (a, b) { return v[b] - v[a]; })[0];
    return v[best] ? best : 'Bespoke sale, in-house';
  }
  function orderConcern(oid) {
    var ds = uniq(by(D().garments, 'order', oid).filter(GE.isThird).map(function (g) { return U.dgname(g.designer); }));
    return ds.length ? ds.join(', ') : 'Saasya Men';
  }
  function ledger() {
    var rows = [];
    D().payins.forEach(function (p) {
      var inv = one(D().invoices, p.invoice); if (!inv) return;
      var coupon = /coupon/i.test(p.method || '');
      rows.push({ at: p.at, dir: 'in', block: coupon ? 'Credit note or coupon used' : orderBlock(inv.order), party: U.cname(inv.client), concern: orderConcern(inv.order),
        ref: inv.id + (p.ref ? ' · ' + p.ref : ''), mode: p.method, amount: Number(p.amount) || 0, order: inv.order, doc: inv.doc === 'receipt' ? 'Receipt' : 'GST invoice', src: 'payin', id: p.id });
    });
    (D().supplier_payments || []).forEach(function (x) {
      var blk = x.kind === 'fabric' ? 'Fabric purchase' : x.kind === 'consignment' ? 'Consignment payment' : 'On-order purchase';
      rows.push({ at: x.at, dir: 'out', block: blk, party: who(x.supplier), concern: who(x.supplier), ref: (x.purchase ? x.purchase + ' · ' : '') + (x.ref || ''), mode: x.mode, amount: Number(x.amount) || 0, note: x.advance ? 'Advance' : (x.note || ''), src: 'supplier', id: x.id });
    });
    (D().expenses || []).forEach(function (x) {
      rows.push({ at: x.at, dir: 'out', block: x.category, party: x.payee, concern: '—', ref: x.ref || '', mode: x.mode, amount: Number(x.amount) || 0, gst: Number(x.gst) || 0, note: x.note || '', src: 'expense', id: x.id });
    });
    return rows.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  }
  GE.ledger = ledger; GE.orderBlock = orderBlock;
  var PRESETS = ['This month', 'Last month', 'This quarter', 'This financial year', 'Everything', 'Custom dates'];
  function range() {
    var F = GE.Q['#/money.f'] || {}, t = GE.localToday(), y = +t.slice(0, 4), m = +t.slice(5, 7);
    var pad = function (n) { return ('0' + n).slice(-2); }, last = function (yy, mm) { return new Date(yy, mm, 0).getDate(); };
    switch (F.preset || 'This month') {
      case 'Last month': var lm = m === 1 ? 12 : m - 1, ly = m === 1 ? y - 1 : y; return [ly + '-' + pad(lm) + '-01', ly + '-' + pad(lm) + '-' + last(ly, lm)];
      case 'This quarter': var q0 = Math.floor((m - 1) / 3) * 3 + 1; return [y + '-' + pad(q0) + '-01', y + '-' + pad(q0 + 2) + '-' + last(y, q0 + 2)];
      case 'This financial year': var fy = m >= 4 ? y : y - 1; return [fy + '-04-01', (fy + 1) + '-03-31'];
      case 'Everything': return ['', ''];
      case 'Custom dates': return [F.from || '', F.to || ''];
      default: return [y + '-' + pad(m) + '-01', y + '-' + pad(m) + '-' + last(y, m)];
    }
  }
  function filtered() {
    var F = GE.Q['#/money.f'] || {}, r = range(), tab = GE.Q['#/money.tab'] || 'Money in';
    return ledger().filter(function (x) {
      return (!r[0] || x.at >= r[0]) && (!r[1] || x.at <= r[1]) &&
        (tab === 'Everything' || (tab === 'Money in' ? x.dir === 'in' : tab === 'Money out' ? x.dir === 'out' : true)) &&
        (!F.block || x.block === F.block) && (!F.party || x.party === F.party) && (!F.concern || x.concern.indexOf(F.concern) > -1) &&
        GE.matches(U.q('#/money'), [x.party, x.block, x.ref, x.mode, x.concern, x.note]);
    });
  }
  GE.moneyFiltered = filtered; GE.moneyRange = range;
  V['#/money'] = function () {
    var F = GE.Q['#/money.f'] || {}, tab = GE.Q['#/money.tab'] || 'Money in', all = ledger(), r = range(), rows = filtered();
    var inWin = all.filter(function (x) { return (!r[0] || x.at >= r[0]) && (!r[1] || x.at <= r[1]); });
    var tin = sum(inWin.filter(function (x) { return x.dir === 'in'; }), function (x) { return x.amount; }), tout = sum(inWin.filter(function (x) { return x.dir === 'out'; }), function (x) { return x.amount; });
    var h = U.head('Money in and out', 'Every rupee that came in and went out, in one place: sales collections, designer and fabric payments, and every expense. Filter it, report it, send it to Tally.',
      '<button class="btn gold" data-act="newExpense">Record money out</button> ' + GE.sheetButtons('expenses') + ' <button class="btn alt" data-act="tally">Tally Export</button>');
    h += '<div class="kpis">' + U.kpi(GE.lakh(tin), 'Money in', r[0] ? d(r[0]) + ' to ' + d(r[1]) : 'everything') + U.kpi(GE.lakh(tout), 'Money out', 'payments and expenses') +
      U.kpi(GE.lakh(tin - tout), 'Net', tin >= tout ? 'more in than out' : 'more out than in') + '</div>';
    h += '<div class="tabs">' + ['Money in', 'Money out', 'Everything', 'Reports'].map(function (t) { return '<button class="' + (t === tab ? 'on' : '') + '" data-act="moneyTab" data-id="' + t + '">' + t + '</button>'; }).join('') + '</div>';
    var blocks = uniq(all.map(function (x) { return x.block; })).sort(), parties = uniq(all.map(function (x) { return x.party; })).sort();
    var concerns = uniq([].concat.apply([], all.map(function (x) { return x.concern.split(', '); })).filter(function (c) { return c && c !== '—'; })).sort();
    h += '<div class="card filters"><div class="filtergrid">' +
      sel('preset', 'Dates', PRESETS, F.preset || 'This month') +
      ((F.preset || '') === 'Custom dates' ? '<div class="f"><label>From</label><input type="date" value="' + (F.from || '') + '" data-change="moneyF" data-id="from"></div><div class="f"><label>To</label><input type="date" value="' + (F.to || '') + '" data-change="moneyF" data-id="to"></div>' : '') +
      sel('block', 'What it was', [''].concat(blocks), F.block || '', 'Every kind') + sel('party', 'Client, vendor or designer', [''].concat(parties), F.party || '', 'Everyone') +
      sel('concern', 'Brand or designer', [''].concat(concerns), F.concern || '', 'Every brand') + '</div>' +
      ((F.block || F.party || F.concern || (F.preset && F.preset !== 'This month')) ? '<button class="mini" data-act="moneyClear">Clear the filters</button>' : '') + '</div>';
    if (tab === 'Reports') return h + reportsHtml(inWin);
    var fbm = GE.filterBar('#/money.list', rows, { placeholder: 'Search a party, a reference, a mode', quick: ['mode'], fields: [
      { k: 'party', label: 'Who', get: function (x) { return x.party; } }, { k: 'block', label: 'What it was', type: 'enum', get: function (x) { return x.block; } },
      { k: 'concern', label: 'Brand or designer', get: function (x) { return x.concern; } }, { k: 'ref', label: 'Reference', get: function (x) { return x.ref; } },
      { k: 'mode', label: 'How', type: 'enum', get: function (x) { return x.mode || ''; } }, { k: 'amount', label: 'Amount', type: 'num', get: function (x) { return x.amount; } },
      { k: 'at', label: 'Date', type: 'date', get: function (x) { return x.at; } }, { k: 'note', label: 'Note', get: function (x) { return x.note || ''; } }] });
    rows = fbm.rows;
    h += fbm.html;
    h += '<div class="card" style="overflow-x:auto"><table><thead><tr><th>Date</th><th>In or out</th><th>What it was</th><th>Who</th><th>Brand or designer</th><th>Reference</th><th>How</th><th class="num">Amount</th></tr></thead><tbody>';
    rows.forEach(function (x) {
      h += '<tr><td>' + d(x.at) + '</td><td>' + U.pill(x.dir === 'in' ? 'in' : 'out', x.dir === 'in' ? 'ok' : 'warn') + '</td><td>' + esc(x.block) + (x.doc ? '<div class="sub">' + esc(x.doc) + '</div>' : x.note ? '<div class="sub">' + esc(x.note) + '</div>' : '') + '</td>' +
        '<td>' + esc(x.party) + '</td><td class="sub">' + esc(x.concern) + '</td><td class="sub">' + esc(x.ref) + '</td><td class="sub">' + esc(x.mode || '') + '</td>' +
        '<td class="num">' + (x.dir === 'out' ? '− ' : '') + rupees(x.amount) + '</td></tr>';
    });
    if (!rows.length) h += '<tr><td colspan="8" class="sub">Nothing in these filters.</td></tr>';
    h += '<tr class="tot"><td colspan="7"><b>' + rows.length + ' entries</b></td><td class="num"><b>' + rupees(sum(rows, function (x) { return x.dir === 'in' ? x.amount : -x.amount; })) + '</b></td></tr>';
    return h + '</tbody></table></div><p class="hint">Money in is recorded where it happens, on the order. Money out is recorded here, or on a purchase or consignment. Payments are made in Tally; the cockpit records them.</p>';
  };
  function sel(k, label, opts, cur, blank) {
    return '<div class="f"><label>' + label + '</label><select data-change="moneyF" data-id="' + k + '">' + opts.map(function (o) {
      return '<option value="' + esc(o) + '"' + (o === cur ? ' selected' : '') + '>' + esc(o || blank || 'All') + '</option>'; }).join('') + '</select></div>';
  }
  A.moneyTab = function (t) { GE.Q['#/money.tab'] = t; GE.refresh(); };
  A.moneyF = function (k, el) { var F = GE.Q['#/money.f'] = GE.Q['#/money.f'] || {}; F[k] = el.value; GE.refresh(); };
  A.moneyClear = function () { GE.Q['#/money.f'] = {}; GE.refresh(); };
  function reportsHtml(rows) {
    var byKey = function (k) { var m = {}; rows.forEach(function (x) { var key = x[k] || '—'; m[key] = m[key] || { inn: 0, out: 0, n: 0 }; m[key][x.dir === 'in' ? 'inn' : 'out'] += x.amount; m[key].n++; }); return m; };
    var tbl = function (title, m, act) {
      return '<div class="card" style="overflow-x:auto"><div class="cardhead"><h3>' + title + '</h3></div><table><thead><tr><th>' + title.split(' by ')[1] + '</th><th class="num">Entries</th><th class="num">In</th><th class="num">Out</th><th></th></tr></thead><tbody>' +
        Object.keys(m).sort().map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="num">' + m[k].n + '</td><td class="num">' + rupees(m[k].inn) + '</td><td class="num">' + rupees(m[k].out) + '</td>' +
          '<td>' + (act ? '<button class="mini" data-act="' + act + 'Pdf" data-id="' + esc(k) + '">PDF</button> <button class="mini" data-act="' + act + 'Xls" data-id="' + esc(k) + '">Excel</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    };
    var h = tbl('Money by what it was', byKey('block'), 'block') + tbl('Money by client, vendor or designer', byKey('party'), 'party');
    var invs = D().invoices.filter(function (i) { var r = range(); return i.doc !== 'receipt' && (!r[0] || i.issued >= r[0]) && (!r[1] || i.issued <= r[1]); });
    var sold = D().pieces.filter(function (p) { var r = range(); return p.status === 'sold' && (!r[0] || p.sold_at >= r[0]) && (!r[1] || p.sold_at <= r[1]); });
    var bySup = {}; sold.forEach(function (p) { var k = who(p.supplier); bySup[k] = bySup[k] || { n: 0, v: 0 }; bySup[k].n++; bySup[k].v += GE.piecePrice(p); });
    var top = Object.keys(bySup).sort(function (a, b) { return bySup[b].v - bySup[a].v; }).slice(0, 5);
    h += '<div class="card"><div class="cardhead"><h3>Sales analysis</h3><span class="sub">readymade pieces sold in these dates</span></div><table><thead><tr><th>Top suppliers</th><th class="num">Pieces sold</th><th class="num">Sale before GST</th></tr></thead><tbody>' +
      (top.length ? top.map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="num">' + bySup[k].n + '</td><td class="num">' + rupees(bySup[k].v) + '</td></tr>'; }).join('') : '<tr><td colspan="3" class="sub">No pieces sold in these dates.</td></tr>') +
      '</tbody></table><p class="hint">' + invs.length + ' GST invoices in these dates.</p></div>';
    var sups = D().designers.concat(D().vendors);
    h += '<div class="card"><div class="cardhead"><h3>Supplier bill report</h3><span class="sub">bills in, what was bought, sold and still owed, as of today</span></div><div style="overflow-x:auto"><table><thead><tr><th>Supplier</th><th class="num">Bills</th><th class="num">Bill value</th><th class="num">Purchase value</th><th class="num">Sold, before GST</th><th class="num">Paid</th><th class="num">Closing balance</th><th></th></tr></thead><tbody>';
    sups.forEach(function (sp) {
      var x = supplierBills(sp.id); if (!x.bills) return;
      h += '<tr><td>' + esc(sp.name) + '</td><td class="num">' + x.bills + '</td><td class="num">' + rupees(x.billValue) + '</td><td class="num">' + rupees(x.purchase) + '</td><td class="num">' + rupees(x.soldPre) + '</td><td class="num">' + rupees(x.paid) + '</td><td class="num"><b>' + rupees(x.balance) + '</b></td>' +
        '<td><button class="mini" data-act="partyPdf" data-id="' + esc(sp.name) + '">PDF</button> <button class="mini" data-act="partyXls" data-id="' + esc(sp.name) + '">Excel</button></td></tr>';
    });
    return h + '</tbody></table></div></div>';
  }
  /* one supplier: every bill, what it was worth, what sold, what was paid, what is left */
  function supplierBills(sid) {
    var purs = D().purchases.filter(function (p) { return p.supplier === sid; }), cb = (D().supplier_bills || []).filter(function (b) { return b.supplier === sid; });
    var purchase = 0, billValue = 0, owed = 0;
    purs.forEach(function (p) {
      if (p.type === 'fabric') { purchase += Number(p.amount) || 0; billValue += Number(p.amount) || 0; owed += Number(p.amount) || 0; }
      else if (p.type === 'on-order') { var x = GE.purchaseSummary(p.id); purchase += x.costIn; billValue += x.costIn; owed += x.soldCost; }
    });
    billValue += sum(cb, function (b) { return Number(b.amount) || 0; }); owed += sum(cb, function (b) { return Number(b.amount) || 0; });
    var paid = sum((D().supplier_payments || []).filter(function (x) { return x.supplier === sid; }), function (x) { return Number(x.amount) || 0; });
    var soldPre = sum(D().pieces.filter(function (p) { return p.supplier === sid && p.status === 'sold'; }), GE.piecePrice);
    return { bills: purs.filter(function (p) { return p.type !== 'consignment'; }).length + cb.length, billValue: billValue, purchase: purchase, soldPre: soldPre, paid: paid, balance: owed - paid };
  }
  GE.supplierBills = supplierBills;
  function reportOf(key, val) {
    var rows = filtered().concat([]).filter(function (x) { return x[key] === val; });
    if (!rows.length) { var r = range(); rows = ledger().filter(function (x) { return x[key] === val && (!r[0] || x.at >= r[0]) && (!r[1] || x.at <= r[1]); }); }
    return { heads: ['Date', 'In or out', 'What it was', 'Who', 'Brand or designer', 'Reference', 'How', 'Amount'],
      rows: rows.map(function (x) { return [d(x.at), x.dir === 'in' ? 'In' : 'Out', x.block, x.party, x.concern, x.ref, x.mode || '', x.dir === 'in' ? x.amount : -x.amount]; }) };
  }
  function rangeLabel() { var r = range(); return r[0] ? d(r[0]) + ' to ' + d(r[1]) : 'all dates'; }
  ['block', 'party'].forEach(function (k) {
    A[k + 'Pdf'] = function (v) { var r = reportOf(k, v); GE.makePdf(sheetDoc('MONEY IN AND OUT', v + ' · ' + rangeLabel(), r.heads, r.rows, [sum(r.rows, function (x) { return x[7]; })], ''), 'Saasya-Men-' + v.replace(/[^A-Za-z0-9]+/g, '-') + '.pdf'); };
    A[k + 'Xls'] = function (v) { var r = reportOf(k, v); xls('Saasya-Men-' + v.replace(/[^A-Za-z0-9]+/g, '-') + '.xlsx', [{ name: 'Entries', rows: [r.heads].concat(r.rows) }]); };
  });
  A.newExpense = function () {
    GE.modal('<h2>Record money out</h2><p class="sub">An expense, or a payment to a vendor or designer. Paid in Tally or cash; recorded here.</p>' +
      '<div class="two"><div class="f"><label>What it was</label><select id="exCat" data-change="exSwitch">' + Object.keys(BUY_CATS).concat(EXP_CATS).map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label>Paid on</label><input type="date" id="exAt" value="' + GE.localToday() + '"></div></div>' +
      '<div class="f" id="exSupWrap"><label>To which vendor or designer</label><select id="exSup">' + D().designers.concat(D().vendors).map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f" id="exPayeeWrap" hidden><label>Paid to</label><input id="exPayee" placeholder="CESC Limited"></div>' +
      '<div class="three"><div class="f"><label>Amount</label><input type="number" id="exAmt"></div><div class="f"><label>GST in it</label><input type="number" id="exGst" value="0"></div>' +
      '<div class="f"><label>How</label><select id="exMode">' + MODES.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="f"><label>Tally voucher or reference</label><input id="exRef"></div><div class="f"><label>The bill</label><input type="file" id="exFile" accept="image/*,application/pdf"></div></div>' +
      '<div class="f"><label>Note</label><input id="exNote"></div>' +
      '<button class="btn gold" data-act="saveExpense">Record it</button>');
    A.exSwitch();
  };
  A.exSwitch = function () { var c = document.getElementById('exCat').value, buy = !!BUY_CATS[c]; document.getElementById('exSupWrap').hidden = !buy; document.getElementById('exPayeeWrap').hidden = buy; };
  A.saveExpense = function () {
    var v = function (i) { var e = document.getElementById(i); return e ? e.value : ''; }, amt = Number(v('exAmt')) || 0, c = v('exCat');
    if (amt <= 0) { GE.toast('Put an amount in.'); return; }
    if (BUY_CATS[c]) {
      D().supplier_payments.push({ id: GE.uid('SP-'), supplier: v('exSup'), kind: BUY_CATS[c], purchase: '', amount: amt, at: v('exAt') || GE.localToday(), mode: v('exMode'), ref: v('exRef'), note: v('exNote'), advance: false, by: GE.me().id });
    } else {
      if (!String(v('exPayee')).trim()) { GE.toast('Who was it paid to?'); return; }
      var f = document.getElementById('exFile'), file = f && f.files && f.files[0];
      D().expenses.push({ id: GE.uid('EX-'), at: v('exAt') || GE.localToday(), category: c, payee: v('exPayee'), amount: amt, gst: Number(v('exGst')) || 0, mode: v('exMode'), ref: v('exRef'), note: v('exNote'), file: file ? file.name : '', by: GE.me().id });
    }
    GE.save(); GE.closeModal(); GE.Q['#/money.tab'] = 'Money out'; GE.refresh(); GE.toast(rupees(amt) + ' out, recorded as ' + c.toLowerCase() + '.');
  };
  /* Tally: one workbook, a sheet per voucher type, for the dates and filters on screen */
  function tallyBook() {
    var r = range(), win = function (dt) { return (!r[0] || dt >= r[0]) && (!r[1] || dt <= r[1]); };
    var rows = filtered().length ? filtered() : [];
    var receipts = [['Date', 'Voucher type', 'Voucher no', 'Party ledger', 'Ledger', 'Amount', 'Mode', 'Narration']], payments = receipts[0].slice().concat([]);
    payments = [['Date', 'Voucher type', 'Voucher no', 'Party ledger', 'Ledger', 'Amount', 'GST', 'Mode', 'Narration']];
    ledger().filter(function (x) { return win(x.at); }).forEach(function (x) {
      if (x.dir === 'in') receipts.push([x.at, 'Receipt', x.ref.split(' · ')[0], x.party, x.block, x.amount, x.mode || '', x.order ? 'Against order ' + x.order : '']);
      else payments.push([x.at, 'Payment', x.ref || x.id, x.party, x.block, x.amount, x.gst || 0, x.mode || '', x.note || '']);
    });
    var sales = [['Date', 'Voucher type', 'Invoice no', 'Party ledger', 'Ledger', 'Taxable value', 'GST rate', 'CGST', 'SGST', 'Invoice total']];
    D().invoices.filter(function (i) { return i.doc !== 'receipt' && win(i.issued); }).forEach(function (i) {
      var m = GE.orderMoney(i.order), share = m.total ? (Number(i.amount) || 0) / m.total : 0;
      (m.gstParts || []).forEach(function (gp) { var g = Math.round(gp.gst * share); sales.push([i.issued, 'Sales', i.id, U.cname(i.client), orderBlock(i.order), Math.round(gp.base * share), gp.rate + '%', Math.round(g / 2), g - Math.round(g / 2), i.amount]); });
    });
    var purchases = [['Date', 'Voucher type', 'Bill no', 'Party ledger', 'Ledger', 'Purchase value', 'Note']];
    D().purchases.filter(function (p) { return win(p.at); }).forEach(function (p) {
      var val = p.type === 'fabric' ? Number(p.amount) || 0 : p.type === 'on-order' ? GE.purchaseSummary(p.id).costIn : 0;
      purchases.push([p.at, p.type === 'consignment' ? 'Memo (consignment, not a purchase)' : 'Purchase', p.bill || p.id, who(p.supplier), p.type === 'fabric' ? 'Fabric purchase' : p.type === 'on-order' ? 'On-order purchase' : 'Consignment received', val, p.note || '']);
    });
    (D().supplier_bills || []).filter(function (b) { return win(b.at); }).forEach(function (b) { purchases.push([b.at, 'Purchase', b.bill_no, who(b.supplier), 'Consignment, sold pieces billed', b.amount, b.note || '']); });
    return { receipts: receipts, payments: payments, sales: sales, purchases: purchases };
  }
  GE.tallyBook = tallyBook;
  A.tallyExport = function () {
    var b = tallyBook(), r = range();
    xls('Saasya-Men-Tally-' + (r[0] || 'all') + (r[1] ? '-to-' + r[1] : '') + '.xlsx', [{ name: 'Receipts', rows: b.receipts }, { name: 'Payments', rows: b.payments }, { name: 'Sales', rows: b.sales }, { name: 'Purchases', rows: b.purchases }]);
    GE.toast('Tally workbook: ' + (b.receipts.length - 1) + ' receipts, ' + (b.payments.length - 1) + ' payments, ' + (b.sales.length - 1) + ' sales lines, ' + (b.purchases.length - 1) + ' purchases.');
  };
  A.tally = function () { GE.go('#/tally'); };

  /* ================= Tally Export: what goes to the accountant, date by date ================= */
  /* any record can be changed from here: the export is read from the records, never typed twice */
  var FIELDSETS = {
    payins: { title: 'Payment received', fields: [['at', 'Date', 'date'], ['amount', 'Amount', 'num'], ['method', 'How', 'text'], ['ref', 'Reference', 'text'], ['kind', 'What it was', 'text']] },
    supplier_payments: { title: 'Payment to a designer or vendor', fields: [['at', 'Date', 'date'], ['amount', 'Amount', 'num'], ['mode', 'How', 'text'], ['ref', 'Tally voucher or reference', 'text'], ['note', 'Note', 'text']] },
    expenses: { title: 'Expense', fields: [['at', 'Date', 'date'], ['category', 'What it was', 'text'], ['payee', 'Paid to', 'text'], ['amount', 'Amount', 'num'], ['gst', 'GST in it', 'num'], ['mode', 'How', 'text'], ['ref', 'Reference', 'text'], ['note', 'Note', 'text']] },
    purchases: { title: 'Purchase', fields: [['at', 'Date', 'date'], ['bill', 'Their bill number', 'text'], ['credit_days', 'Credit period, days', 'num'], ['note', 'Note', 'text']] },
    supplier_bills: { title: 'Designer’s bill', fields: [['at', 'Received on', 'date'], ['bill_no', 'Their bill number', 'text'], ['amount', 'Amount', 'num'], ['note', 'For', 'text']] },
    invoices: { title: 'Invoice or receipt', fields: [['issued', 'Date', 'date'], ['billed_to', 'Billed to', 'text'], ['amount', 'Amount', 'num'], ['kind', 'What it was', 'text']] }
  };
  A.editRec = function (id) {
    var p = id.split('|'), col = p[0], rec = one(D()[col] || [], p[1]), fs = FIELDSETS[col];
    if (!rec || !fs) { if (col === 'pieces') return A.editPiece(p[1]); return; }
    GE.modal('<h2>Change: ' + esc(fs.title) + '</h2><p class="sub">' + esc(rec.id) + '. Every field. The change flows to every report and to Tally.</p>' +
      fs.fields.map(function (f) { return '<div class="f"><label>' + esc(f[1]) + '</label><input id="er_' + f[0] + '" type="' + (f[2] === 'num' ? 'number' : f[2]) + '" value="' + esc(rec[f[0]] == null ? '' : rec[f[0]]) + '"></div>'; }).join('') +
      '<button class="btn gold" data-act="saveRec" data-id="' + esc(id) + '">Save</button>');
  };
  A.saveRec = function (id) {
    var p = id.split('|'), col = p[0], rec = one(D()[col], p[1]), fs = FIELDSETS[col], changed = [];
    fs.fields.forEach(function (f) { var v = document.getElementById('er_' + f[0]).value; if (f[2] === 'num') v = Number(v) || 0; if (String(v) !== String(rec[f[0]] == null ? '' : rec[f[0]])) { changed.push(f[1] + ': ' + (rec[f[0]] == null ? '' : rec[f[0]]) + ' to ' + v); rec[f[0]] = v; } });
    if (changed.length) (rec.edits = rec.edits || []).push({ by: GE.me().id, at: GE.localToday(), what: changed.join('; ') });
    GE.save(); GE.closeModal(); GE.refresh(); GE.toast(changed.length ? 'Saved. ' + changed.join('; ') + '.' : 'Nothing changed.');
  };
  function tallyDates() {
    var t = GE.localToday(), y = +t.slice(0, 4), m = +t.slice(5, 7), last = new Date(y, m, 0).getDate(), pad = function (n) { return ('0' + n).slice(-2); };
    var Q = GE.Q['#/tally.d'] = GE.Q['#/tally.d'] || { from: y + '-' + pad(m) + '-01', to: y + '-' + pad(m) + '-' + last };
    return Q;
  }
  function inDates(dt) { var Q = tallyDates(); return dt && Q.from && Q.to && dt >= Q.from && dt <= Q.to; }
  function ledgerName(block) {
    return { 'Readymade sale, in-house': 'Sales: readymade, in-house', 'Bespoke sale, in-house': 'Sales: bespoke, in-house', 'Third-party designer sale': 'Sales: third-party designer',
      'Credit note or coupon used': 'Credit notes and coupons', 'On-order purchase': 'Purchase: on-order readymade', 'Consignment payment': 'Consignment: designer payable', 'Fabric purchase': 'Purchase: fabric' }[block] || block;
  }
  var TABS = { money: 'Money in and out', onorder: 'On-order purchases', consignment: 'Consignment' };
  function tallyRows(tab, sub) {
    var rows = [];
    if (tab === 'money' && sub === 'in') {
      D().payins.forEach(function (pi) { var inv = one(D().invoices, pi.invoice); if (!inv || !inDates(pi.at)) return;
        var blk = /coupon/i.test(pi.method || '') ? 'Credit note or coupon used' : orderBlock(inv.order);
        rows.push({ src: 'payins|' + pi.id, cells: [pi.at, 'Receipt', inv.id, pi.id, U.cname(inv.client), inv.doc === 'receipt' ? 'Advance from customers' : ledgerName(blk), Number(pi.amount) || 0, pi.method || '',
          (pi.kind || inv.kind) + ' against ' + inv.order + (pi.ref ? ', ref ' + pi.ref : '') + (inv.doc === 'receipt' ? ', receipt ' + inv.id : ', invoice ' + inv.id)] }); });
      return { heads: ['Voucher date', 'Voucher type', 'Voucher no.', 'Reference', 'Party ledger', 'Ledger', 'Amount', 'Mode', 'Narration'], rows: rows, sum: 6 };
    }
    if (tab === 'money' && sub === 'out') {
      (D().supplier_payments || []).forEach(function (x) { if (!inDates(x.at)) return;
        var blk = x.kind === 'fabric' ? 'Fabric purchase' : x.kind === 'consignment' ? 'Consignment payment' : 'On-order purchase';
        rows.push({ src: 'supplier_payments|' + x.id, cells: [x.at, 'Payment', x.ref || x.id, x.id, who(x.supplier), ledgerName(blk), Number(x.amount) || 0, 0, x.mode || '', (x.advance ? 'Advance' : 'Payment') + (x.purchase ? ' against ' + x.purchase : '') + (x.note ? ', ' + x.note : '')] }); });
      (D().expenses || []).forEach(function (x) { if (!inDates(x.at)) return;
        rows.push({ src: 'expenses|' + x.id, cells: [x.at, 'Payment', x.ref || x.id, x.id, x.payee || '', x.category, Number(x.amount) || 0, Number(x.gst) || 0, x.mode || '', x.note || ''] }); });
      return { heads: ['Voucher date', 'Voucher type', 'Voucher no.', 'Reference', 'Party ledger', 'Ledger', 'Amount', 'GST in it', 'Mode', 'Narration'], rows: rows, sum: 6 };
    }
    if (tab === 'money' && sub === 'sales') {
      D().invoices.filter(function (i) { return i.doc !== 'receipt' && inDates(i.issued); }).forEach(function (i) {
        var m = GE.orderMoney(i.order), share = m.total ? (Number(i.amount) || 0) / m.total : 0;
        (m.gstParts || []).forEach(function (gp) { var g = Math.round(gp.gst * share), taxable = Math.round(gp.base * share);
          rows.push({ src: 'invoices|' + i.id, cells: [i.issued, 'Sales', i.id, i.order, i.billed_to || U.cname(i.client), 'Sales GST ' + gp.rate + '%' + (gp.rate === 5 ? ' (fabric)' : ''), taxable, gp.rate + '%', Math.round(g / 2), g - Math.round(g / 2), 0, taxable + g, i.kind + ' for ' + i.order] }); });
      });
      return { heads: ['Voucher date', 'Voucher type', 'Invoice no.', 'Reference', 'Party ledger', 'Ledger', 'Taxable value', 'GST rate', 'CGST', 'SGST', 'IGST', 'Amount', 'Narration'], rows: rows, sum: 11 };
    }
    if (tab === 'onorder') {
      D().purchases.filter(function (p) { return p.type === 'on-order'; }).forEach(function (p) {
        GE.piecesOf(p.id).forEach(function (pc) {
          if (inDates(p.at)) { var g = GE.withGst(pc.cost_ex, pc.gst) - pc.cost_ex;
            rows.push({ src: 'pieces|' + pc.id, cells: [p.at, 'Purchase', p.bill || p.id, p.id, who(p.supplier), 'Purchase: on-order readymade', pc.barcode + ' ' + pc.name + ', size ' + pc.size, 1, Number(pc.cost_ex) || 0, pc.gst + '%', Math.round(g / 2), g - Math.round(g / 2), Number(pc.cost_ex) + g, 'Bought on ' + p.id] }); }
          if (pc.status === 'returned' && inDates(pc.returned_at)) { var g2 = GE.withGst(pc.cost_ex, pc.gst) - pc.cost_ex;
            rows.push({ src: 'pieces|' + pc.id, cells: [pc.returned_at, 'Purchase return', p.bill || p.id, p.id, who(p.supplier), 'Purchase: on-order readymade', pc.barcode + ' ' + pc.name + ', size ' + pc.size, -1, -Number(pc.cost_ex) || 0, pc.gst + '%', -Math.round(g2 / 2), -(g2 - Math.round(g2 / 2)), -(Number(pc.cost_ex) + g2), 'Returned after ' + GE.days(pc.received, pc.returned_at) + ' days'] }); }
        });
      });
      return { heads: ['Voucher date', 'Voucher type', 'Bill no.', 'Reference', 'Party ledger', 'Ledger', 'Item', 'Qty', 'Taxable value', 'GST rate', 'CGST', 'SGST', 'Amount', 'Narration'], rows: rows, sum: 12 };
    }
    if (tab === 'consignment') {
      D().pieces.filter(function (pc) { return pc.source === 'consignment' && pc.status === 'sold' && inDates(pc.sold_at); }).forEach(function (pc) { var l = GE.consignmentLine(pc);
        rows.push({ src: 'pieces|' + pc.id, cells: [pc.sold_at, 'Memo (consignment sale)', pc.purchase || '', pc.barcode, who(pc.supplier), 'Consignment: designer payable', pc.name + ', size ' + pc.size, l.pre, l.gst, l.mrp, l.ours, l.theirs, 'Sold; their ' + (100 - l.margin) + '% before GST'] }); });
      (D().supplier_bills || []).filter(function (b) { return b.kind === 'consignment' && inDates(b.at); }).forEach(function (b) {
        rows.push({ src: 'supplier_bills|' + b.id, cells: [b.at, 'Purchase', b.bill_no, b.id, who(b.supplier), 'Purchase: consignment sold', b.note || 'Their bill for sold pieces', Number(b.amount) || 0, 0, Number(b.amount) || 0, 0, Number(b.amount) || 0, 'Designer’s invoice for sold consignment'] }); });
      return { heads: ['Voucher date', 'Voucher type', 'Voucher no.', 'Reference', 'Party ledger', 'Ledger', 'Item', 'Taxable value', 'GST', 'Amount', 'Saasya Men share', 'Designer share', 'Narration'], rows: rows, sum: 9 };
    }
    return { heads: [], rows: [], sum: -1 };
  }
  GE.tallyRows = tallyRows; GE.tallyDates = tallyDates;
  V['#/tally'] = function () {
    var tab = GE.Q['#/tally.tab'] || 'money', sub = GE.Q['#/tally.sub'] || 'in', Q = tallyDates(), ok = Q.from && Q.to && Q.from <= Q.to;
    var h = U.head('Tally Export', 'What goes to the accountant, for the dates you choose: every voucher in Tally’s own columns. Each row opens the record it came from, so a correction is made once, at its source.');
    h += '<div class="tabs">' + Object.keys(TABS).map(function (k) { return '<button class="' + (k === tab ? 'on' : '') + '" data-act="tallyTab" data-id="' + k + '">' + TABS[k] + '</button>'; }).join('') + '</div>';
    h += '<div class="card tdates"><div class="f"><label>From (required)</label><input type="date" value="' + (Q.from || '') + '" data-change="tallyDate" data-id="from"></div>' +
      '<div class="f"><label>To (required)</label><input type="date" value="' + (Q.to || '') + '" data-change="tallyDate" data-id="to"></div>' +
      '<div class="btnrow">' + ['This month', 'Last month', 'This quarter', 'This financial year'].map(function (pz) { return '<button class="mini" data-act="tallyPreset" data-id="' + pz + '">' + pz + '</button>'; }).join('') + '</div></div>';
    if (!ok) return h + '<div class="note bad"><b>Choose both dates.</b> The export runs only for a date range.</div>';
    if (tab === 'money') h += '<div class="tabs sub">' + [['in', 'Money in'], ['out', 'Money out'], ['sales', 'Sales invoices (GST by rate)']].map(function (x) { return '<button class="' + (x[0] === sub ? 'on' : '') + '" data-act="tallySub" data-id="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var T = tallyRows(tab, sub), key = '#/tally.' + tab + sub;
    var fb = GE.filterBar(key, T.rows, { placeholder: 'Search a party, a voucher, a ledger', quick: ['party', 'ledger', 'type'], fields: T.heads.map(function (hd, i) {
      var k = i === 4 ? 'party' : i === 5 ? 'ledger' : i === 1 ? 'type' : 'c' + i;
      return { k: k, label: hd, type: (typeof (T.rows[0] && T.rows[0].cells[i]) === 'number') ? 'num' : (i === 4 || i === 5 || i === 1 ? 'enum' : 'text'), get: function (r) { return r.cells[i]; } }; }) });
    var rows = fb.rows, total = T.sum >= 0 ? sum(rows, function (r) { return Number(r.cells[T.sum]) || 0; }) : 0;
    if (tab !== 'money') h += supplierReportHtml(tab);
    h += fb.html + '<div class="btnrow" style="margin-bottom:10px"><button class="btn gold" data-act="tallyXls">Export this for Tally</button> <span class="sub">' + rows.length + ' vouchers, ' + d(Q.from) + ' to ' + d(Q.to) + ' · total ' + rupees(total) + '</span></div>';
    h += '<div class="card" style="overflow-x:auto"><table class="tally"><thead><tr>' + T.heads.map(function (hd) { return '<th>' + esc(hd) + '</th>'; }).join('') + '<th></th></tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr>' + r.cells.map(function (c, i) { return '<td' + (typeof c === 'number' ? ' class="num"' : '') + '>' + (typeof c === 'number' && i !== 7 ? rupees(c) : i === 0 ? d(c) : esc(c)) + '</td>'; }).join('') +
        '<td><button class="mini" data-act="editRec" data-id="' + esc(r.src) + '">Edit</button></td></tr>';
    });
    if (!rows.length) h += '<tr><td colspan="' + (T.heads.length + 1) + '" class="sub">Nothing in these dates.</td></tr>';
    return h + '</tbody></table></div><p class="hint">Each voucher carries the cockpit’s own number as its reference, so the same voucher imported twice can be spotted. Consignment received is a memo, not a purchase: it becomes a purchase when the designer’s bill comes in.</p>';
  };
  function supplierReportHtml(tab) {
    var Q = tallyDates(), ids = uniq(D().purchases.filter(function (p) { return p.type === (tab === 'onorder' ? 'on-order' : 'consignment'); }).map(function (p) { return p.supplier; }));
    var h = '<div class="card"><div class="cardhead"><h3>Supplier bill report</h3><div class="btnrow"><button class="mini" data-act="supRepXls" data-id="' + tab + '">Excel</button> <button class="mini" data-act="supRepPdf" data-id="' + tab + '">PDF</button></div></div><div style="overflow-x:auto"><table><thead><tr><th>Supplier</th><th class="num">Total bills</th><th class="num">Bill value</th><th class="num">Purchase value</th><th class="num">Net sale</th><th class="num">Closing balance</th></tr></thead><tbody>';
    supplierReport(tab).forEach(function (r) { h += '<tr><td>' + esc(r[0]) + '</td><td class="num">' + r[1] + '</td><td class="num">' + rupees(r[2]) + '</td><td class="num">' + rupees(r[3]) + '</td><td class="num">' + rupees(r[4]) + '</td><td class="num"><b>' + rupees(r[5]) + '</b></td></tr>'; });
    return h + '</tbody></table></div><p class="hint">For ' + d(Q.from) + ' to ' + d(Q.to) + '. Net sale is what sold, before GST; the closing balance is what is still owed to them today.</p></div>';
  }
  function supplierReport(tab) {
    var type = tab === 'onorder' ? 'on-order' : 'consignment';
    return uniq(D().purchases.filter(function (p) { return p.type === type; }).map(function (p) { return p.supplier; })).map(function (sid) {
      var purs = D().purchases.filter(function (p) { return p.type === type && p.supplier === sid; });
      var bills = type === 'on-order' ? purs.filter(function (p) { return inDates(p.at); }) : (D().supplier_bills || []).filter(function (b) { return b.supplier === sid && inDates(b.at); });
      var billValue = type === 'on-order' ? sum(bills, function (p) { return GE.purchaseSummary(p.id).costIn; }) : sum(bills, function (b) { return Number(b.amount) || 0; });
      var pv = type === 'on-order' ? billValue : sum(D().pieces.filter(function (pc) { return pc.supplier === sid && pc.source === 'consignment' && inDates(pc.received); }), GE.piecePrice);
      var net = sum(D().pieces.filter(function (pc) { return pc.supplier === sid && pc.source === type && pc.status === 'sold' && inDates(pc.sold_at); }), GE.piecePrice);
      var bal = type === 'on-order' ? sum(purs, function (p) { return GE.purchaseSummary(p.id).owed; }) : GE.consignmentSummary(sid).toPay;
      return [who(sid), bills.length, billValue, pv, net, bal];
    });
  }
  GE.supplierReport = supplierReport;
  var SR_HEADS = ['Supplier', 'Total bills', 'Bill value', 'Purchase value', 'Net sale', 'Closing balance'];
  A.supRepXls = function (tab) { var Q = tallyDates(); GE.xls('Saasya-Men-supplier-bills-' + tab + '-' + Q.from + '-to-' + Q.to + '.xlsx', [{ name: 'Supplier bills', rows: [SR_HEADS].concat(supplierReport(tab)) }]); };
  A.supRepPdf = function (tab) { var Q = tallyDates(); GE.makePdf(sheetDoc('SUPPLIER BILL REPORT', TABS[tab] + ' · ' + d(Q.from) + ' to ' + d(Q.to), SR_HEADS, supplierReport(tab).map(function (r) { return [r[0], String(r[1]), r[2], r[3], r[4], r[5]]; }), null, ''), 'Saasya-Men-supplier-bills-' + tab + '.pdf'); };
  A.tallyTab = function (t) { GE.Q['#/tally.tab'] = t; GE.refresh(); };
  A.tallySub = function (t) { GE.Q['#/tally.sub'] = t; GE.refresh(); };
  A.tallyDate = function (k, el) { tallyDates()[k] = el.value; GE.refresh(); };
  A.tallyPreset = function (pz) { var r = GE.fbRange({ preset: pz }); var Q = tallyDates(); Q.from = r[0]; Q.to = r[1]; GE.refresh(); };
  A.tallyXls = function () {
    var Q = tallyDates(); if (!Q.from || !Q.to) { GE.toast('Choose both dates first.'); return; }
    var tab = GE.Q['#/tally.tab'] || 'money', sub = GE.Q['#/tally.sub'] || 'in', T = tallyRows(tab, sub), key = '#/tally.' + tab + sub;
    var fb = GE.filterBar(key, T.rows, { fields: T.heads.map(function (hd, i) { var k = i === 4 ? 'party' : i === 5 ? 'ledger' : i === 1 ? 'type' : 'c' + i; return { k: k, label: hd, get: function (r) { return r.cells[i]; } }; }) });
    var name = (tab === 'money' ? ({ in: 'money-in', out: 'money-out', sales: 'sales' })[sub] : tab) + '-' + Q.from + '-to-' + Q.to;
    xls('Saasya-Men-Tally-' + name + '.xlsx', [{ name: 'Vouchers', rows: [T.heads].concat(fb.rows.map(function (r) { return r.cells; })) }]);
    GE.toast(fb.rows.length + ' vouchers exported, ' + d(Q.from) + ' to ' + d(Q.to) + '.');
  };

})();
