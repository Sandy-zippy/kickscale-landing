/* Saasya Men prototype - the library. Vocabulary and arithmetic only, no screens. */
var GE = (function () {

  var KEY = 'saasya.proto.v2';

  /* ---------- vocabulary, straight out of SPEC.json ---------- */

  var SELL = ['Stylist','Shown designs','Quotation provided','Advance taken','Measurements',
              'In operations','Trial','Alteration','Ready','Delivered','Lost'];

  /* the six kinds of order, in his own words */
  var ORDER_TYPES = ['Our own bespoke','Our own readymade','Third-party readymade','Third-party custom-made'];

  var HOUSE = ['Not started','Design confirmed','Fabric sourced','Cut','Stitching',
               'Embroidery / handwork','Finishing','Checking','Reworking','Ready','Delivered'];

  var DESIGNER = ['Order confirmed','Measurements sent','Designer accepted','Queried by designer',
                  'In production at designer','Dispatched to us','Received and checked','Trial',
                  'Alteration here','Back to designer','Ready','Delivered'];

  var STAGE_MEANS = {
    'Stylist':'a stylist has been put on him. The walk-in itself is already a client record',
    'Shown designs':'they have seen cloth or pieces and liked something',
    'Quotation provided':'a price is with them',
    'Advance taken':'money has arrived and work can start',
    'Measurements':'taken after the advance, because nobody measures a man who has not paid',
    'In operations':'it has left selling and is being made or is with the designer',
    'Trial':'he is coming in to try it on',
    'Alteration':'it came back from trial needing work',
    'Ready':'every garment has passed checking',
    'Delivered':'he has it',
    'Lost':'it is not happening',
    'Not started':'on the floor, waiting for a master',
    'Design confirmed':'the style, the collar, the buttons and the lining are agreed and written down',
    'Fabric sourced':'the cloth is in hand and reserved against this garment',
    'Cut':'cut to his measurements',
    'Stitching':'being put together',
    'Embroidery / handwork':'with the handwork karigars, which is the long one',
    'Finishing':'buttons, pressing, lining, final press',
    'Checking':'somebody senior looks at it before the client does',
    'Reworking':'it failed checking or came back from a trial',
    'Order confirmed':'the client has chosen the designer and the piece',
    'Measurements sent':'the measurement set has gone to the designer',
    'Designer accepted':'they have confirmed they can make it by the date',
    'Queried by designer':'they have come back with a question and the job is stopped',
    'In production at designer':'being made somewhere we cannot see',
    'Dispatched to us':'it is on its way',
    'Received and checked':'it is here and somebody has looked at it',
    'Alteration here':'small work we can do ourselves',
    'Back to designer':'it needs work only they can do'
  };

  var KINDS = ['Suit jacket / blazer / bandhgala','Trousers / breeches','Shirt','Kurta',
               'Sherwani','Churidar / pyjama','Waistcoat / Nehru jacket'];

  var MEAS = {
    'Suit jacket / blazer / bandhgala':['neck','shoulder','chest','stomach','waist','seat',
      'sleeve length','bicep','cuff','front chest','back width','jacket length'],
    'Trousers / breeches':['waist','seat','thigh','knee','bottom (mohri)','outseam','inseam','rise'],
    'Shirt':['collar','shoulder','chest','stomach','waist','sleeve length','bicep','cuff','shirt length'],
    'Kurta':['neck','shoulder','chest','stomach','waist','hip','sleeve length','bicep','cuff',
      'kurta length','side slit'],
    'Sherwani':['neck','collar height','shoulder','chest','stomach','waist','hip','sleeve length',
      'bicep','cuff','sherwani length (2in below the knee)'],
    'Churidar / pyjama':['waist','hip','thigh','knee','calf','ankle (mohri)','length','gather allowance'],
    'Waistcoat / Nehru jacket':['chest','stomach','waist','shoulder','armhole','front length','back length']
  };

  var MEAS_WHY = ['First set','Trial 1','Trial 2','He has lost weight','He has put on weight',
                  'He wants it looser','He wants it slimmer','Master corrected it','Alteration after delivery'];

  /* the occasion, picked not typed (5 Oct). Grouped so the dropdown reads like the calendar of a wedding. */
  var OCCASIONS = [
    ['Wedding functions', ['Wedding','Engagement / Sagai','Roka / Tilak','Haldi','Mehendi','Sangeet','Cocktail','Reception','Ashirbad','Aiburobhat','Bou Bhat','Saree ceremony']],
    ['Festivities', ['Durga Puja','Diwali','Eid','Navratri','Christmas','New Year','Poila Baisakh']],
    ['Other', ['Anniversary','Birthday','Party','Corporate / formal','Everyday wear','Other']]
  ];
  /* the date on the machine, not the sample story's "today": a payment is taken today */
  function localToday() { var t = new Date(); return new Date(t.getTime() - t.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  /* the reference on a payment screenshot: a labelled id first (UTR, UPI ref, transaction id,
     cheque no), else a bare 12-digit UPI number */
  function extractRef(text) {
    var t = String(text || '').replace(/[\u2010-\u2015]/g, '-');
    var lab = /(UTR(?:\s*(?:No|Number))?|UPI\s*(?:Ref(?:erence)?|transaction)\s*(?:No|ID|Number)?|Ref(?:erence)?\s*(?:No|ID|Number)|Transaction\s*(?:ID|No|Number|Reference)|Txn\s*(?:ID|No)|Google\s*transaction\s*ID|Cheque\s*(?:No|Number))\.?\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{5,30})/i.exec(t);
    if (lab && /\d/.test(lab[2])) return lab[2].replace(/-+$/, '');
    var bare = /(?:^|\D)(\d{12})(?!\d)/.exec(t.replace(/(\d)\s(?=\d)/g, '$1'));
    return bare ? bare[1] : '';
  }
  /* the country code on every mobile (6 Oct): picked, never typed. India first. */
  var COUNTRY_CODES = [['+91','India'],['+971','UAE'],['+1','USA / Canada'],['+44','UK'],['+65','Singapore'],['+852','Hong Kong'],
    ['+966','Saudi Arabia'],['+974','Qatar'],['+968','Oman'],['+973','Bahrain'],['+965','Kuwait'],['+61','Australia'],['+64','New Zealand'],
    ['+977','Nepal'],['+880','Bangladesh'],['+94','Sri Lanka'],['+49','Germany'],['+33','France'],['+39','Italy'],['+81','Japan']];
  /* a mobile is a code and digits; India must be 10 digits starting 6 to 9, elsewhere 6 to 14 */
  function phoneOk(code, digits) {
    var n = String(digits || '').replace(/\D/g, '');
    return code === '+91' ? /^[6-9]\d{9}$/.test(n) : /^\d{6,14}$/.test(n);
  }
  function phoneJoin(code, digits) {
    var n = String(digits || '').replace(/\D/g, '');
    return code + ' ' + (code === '+91' && n.length === 10 ? n.slice(0, 5) + ' ' + n.slice(5) : n);
  }
  var SOURCES = ['Walk-in','Referral','Instagram','WhatsApp enquiry','Meta ad','Google','Wedding planner',
                 'Existing client','Outreach by Mark'];

  var PAY_METHODS = ['Cash','UPI (GPay / PhonePe / Razorpay)','Net transfer','Credit card','Debit card','Cheque'];

  var CUT_LABELS = ['Discount','Festive offer','Loyalty adjustment','Goodwill'];
  /* added on top of the garments (5 Oct): more designs, delivery, porter, anything agreed */
  var ADD_LABELS = ['Extra design work','Delivery charges','Porter / courier','Express making','Other'];
  var OUR_DESIGN_TYPES = ['Our own bespoke','Our own readymade'];

  var COST_KINDS = ['Fabric','Readymade piece','Marking','Cutting','Stitching','Designing','Embroidery / handwork','Karigari / extra work',
                    'Finishing','Buttons and trims','Porter / courier','Third-party stitching','Other'];

  var FOLLOW_METHODS = ['Phone call','WhatsApp','In person','Email','Online meet'];

  var PERIODS = ['Half-month','Month','Quarter','Year'];

  /* ---------- small helpers ---------- */

  var idSeq = 0;
  function uid(p) {
    idSeq = (idSeq + 1) % 1679616;
    return String(p) + Date.now().toString(36) + idSeq.toString(36) +
           Math.floor(Math.random() * 1296).toString(36);
  }

  function rupees(n) {
    n = Math.round(Number(n) || 0);
    var neg = n < 0; n = Math.abs(n);
    var s = String(n), out;
    if (s.length <= 3) out = s;
    else {
      var last = s.slice(-3), rest = s.slice(0, -3), parts = [];
      while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
      if (rest) parts.unshift(rest);
      out = parts.join(',') + ',' + last;
    }
    return (neg ? '-' : '') + '₹' + out;
  }

  /* short form for tiles: 4.85L, 1.2Cr */
  function lakh(n) {
    n = Number(n) || 0;
    if (Math.abs(n) >= 10000000) return '₹' + (n / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
    if (Math.abs(n) >= 100000) return '₹' + (n / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
    return rupees(n);
  }

  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function d(iso) {
    if (!iso) return '—';
    var p = String(iso).slice(0, 10).split('-');
    if (p.length !== 3) return iso;
    return Number(p[2]) + ' ' + MON[Number(p[1]) - 1] + ' ' + p[0].slice(2);
  }
  function dt(iso) {
    if (!iso) return '—';
    var t = String(iso).slice(11, 16);
    return d(iso) + (t ? ', ' + t : '');
  }
  var TODAY = '2026-10-02';
  function days(a, b) {
    return Math.round((new Date(b || TODAY) - new Date(a)) / 86400000);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function sum(list, f) {
    var t = 0; for (var i = 0; i < list.length; i++) t += Number(f(list[i])) || 0; return t;
  }
  function by(list, k, v) { return list.filter(function (r) { return r[k] === v; }); }
  function one(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  /* ---------- the store: localStorage so an edit survives a reload ---------- */

  var D = null;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var o = JSON.parse(raw); if (o && o.v === 2) { D = o; migrate(); return; } }
    } catch (e) {}
    D = SEED();           /* seed.js defines window.SEED */
    migrate(); save();
  }
  /* the stored order value always equals its garments and other items, so every screen that reads
     it (targets, households, accounting) is right without knowing how it is worked out */
  /* ---------- stock: pieces ----------
     A piece is reserved while an outfit on an order points at it, sold when that outfit or its
     order is delivered, and back in stock if the outfit or the order goes. Derived on every save,
     so sales and stock cannot drift apart. */
  function pieceOf(id) { return one(D.pieces || [], id) || one(D.readymade || [], id); }
  function supplierMargin(sup) { var dz = one(D.designers || [], sup); return dz ? Number(dz.margin) || 30 : 30; }
  function pieceCost(p) {   /* what the piece costs us: consignment is the designer's share of the price before GST */
    if (!p) return 0;
    if (p.source === 'consignment') return Math.round((Number(p.price_ex) || 0) * (100 - supplierMargin(p.supplier)) / 100);
    return Number(p.cost_ex != null ? p.cost_ex : p.cost_to_make) || 0;
  }
  function piecePrice(p) { return p ? Number(p.price_ex != null ? p.price_ex : p.price) || 0 : 0; }
  function withGst(n, pct) { return Math.round((Number(n) || 0) * (1 + (pct == null ? 18 : Number(pct)) / 100)); }
  function syncPieces() {
    var held = {};
    (D.garments || []).forEach(function (g) {
      var p = g.piece && one(D.pieces || [], g.piece); if (!p) return;
      var o = one(D.orders, g.order); held[p.id] = 1;
      var done = g.stage === 'Delivered' || (o && o.stage === 'Delivered');
      if (done && p.status !== 'sold') { p.status = 'sold'; p.sold_at = p.sold_at || localToday(); }
      else if (!done && p.status !== 'on approval') { p.status = 'reserved'; p.sold_at = ''; }
      p.order = g.order; p.garment = g.id;
    });
    (D.pieces || []).forEach(function (p) {   /* an outfit or order that went releases its piece */
      if (!held[p.id] && p.garment && (p.status === 'reserved' || (p.status === 'sold' && p.order))) {
        p.status = 'in stock'; p.order = ''; p.garment = ''; p.sold_at = '';
      }
    });
  }
  function nextBarcode(at) {
    var ym = String(at || localToday()).slice(2, 7).replace('-', ''), n = 0;
    (D.pieces || []).forEach(function (p) { var m = /-(\d{4})$/.exec(p.barcode || ''); if (m) n = Math.max(n, Number(m[1])); });
    return 'SM' + ym + '-' + ('000' + (n + 1)).slice(-4);
  }
  /* receive goods: one record per piece, each with its own barcode */
  function receivePieces(spec) {
    var sizes = String(spec.sizes || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    var qty = sizes.length || Math.max(1, Number(spec.qty) || 1), made = [];
    for (var i = 0; i < qty; i++) {
      var p = { id: uid('P-'), barcode: nextBarcode(spec.at), name: spec.name, code: spec.code || '', kind: spec.kind, size: sizes[i] || spec.size || '',
        colour: spec.colour || '', supplier: spec.supplier || 'Sasya', source: spec.source, purchase: spec.purchase || '',
        cost_ex: spec.source === 'consignment' ? 0 : Number(spec.cost_ex) || 0, price_ex: Number(spec.price_ex) || 0, gst: spec.gst == null ? 18 : Number(spec.gst),
        received: spec.at || localToday(), location: spec.location || 'Store', status: 'in stock', order: '', garment: '', sold_at: '', returned_at: '', design: spec.design || '',
        history: [{ what: 'Received', by: ME ? ME.id : 'system', at: (spec.at || localToday()) + 'T' + clock() }] };
      D.pieces.push(p); made.push(p);
    }
    save(); return made;
  }
  /* ---------- purchases: on-order and consignment ----------
     On-order: we owe for what has SOLD, at its cost after GST, less the advance and what has been
     paid; returned pieces owe nothing. Consignment: nothing is ours until it sells; then the
     designer's share is (100 - margin)% of the price BEFORE GST (30/70 for most). */
  function piecesOf(purId) { return (D.pieces || []).filter(function (p) { return p.purchase === purId; }); }
  function paidOn(sup, purId) {
    return sum((D.supplier_payments || []).filter(function (x) { return x.supplier === sup && (purId == null || x.purchase === purId); }), function (x) { return Number(x.amount) || 0; });
  }
  function purchaseSummary(purId) {
    var pur = one(D.purchases || [], purId); if (!pur) return null;
    var ps = piecesOf(purId), st = function (s) { return ps.filter(function (p) { return p.status === s; }); };
    var sold = st('sold'), ret = st('returned'), hand = ps.filter(function (p) { return p.status !== 'sold' && p.status !== 'returned'; });
    var inc = function (p) { return withGst(p.cost_ex, p.gst); };
    var pays = (D.supplier_payments || []).filter(function (x) { return x.purchase === purId; });
    var advPays = pays.filter(function (x) { return x.advance; });
    var adv = advPays.length ? sum(advPays, function (x) { return Number(x.amount) || 0; }) : Number(pur.advance) || 0;   /* the advance is a payment, counted once */
    var soldCost = sum(sold, inc), paid = sum(pays.filter(function (x) { return !x.advance; }), function (x) { return Number(x.amount) || 0; });
    var due = pur.credit_days ? addDays(pur.at, pur.credit_days) : '';
    return { purchase: pur, pieces: ps, sold: sold, returned: ret, onHand: hand,
      costIn: sum(ps, inc), costReturned: sum(ret, inc), costOnHand: sum(hand, inc), soldCost: soldCost, soldPrice: sum(sold, function (p) { return withGst(p.price_ex, p.gst); }),
      advance: adv, paid: paid, owed: Math.max(0, soldCost - adv - paid), credit: Math.max(0, adv + paid - soldCost),
      due: due, daysLeft: due ? days(localToday(), due) : null };
  }
  function addDays(dt, n) { var x = new Date(dt + 'T00:00:00'); x.setDate(x.getDate() + Number(n || 0)); return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function consignmentLine(p) {
    var m = supplierMargin(p.supplier), pre = Number(p.price_ex) || 0, ours = Math.round(pre * m / 100);
    return { piece: p, pre: pre, gst: withGst(pre, p.gst) - pre, mrp: withGst(pre, p.gst), margin: m, ours: ours, theirs: pre - ours };
  }
  function consignmentSummary(sup, from, to) {
    var ps = (D.pieces || []).filter(function (p) { return p.source === 'consignment' && p.supplier === sup; });
    var inWin = function (dt) { return dt && (!from || dt >= from) && (!to || dt <= to); };
    var sold = ps.filter(function (p) { return p.status === 'sold' && inWin(p.sold_at); }).map(consignmentLine);
    var allSold = ps.filter(function (p) { return p.status === 'sold'; }).map(consignmentLine);
    var bills = (D.supplier_bills || []).filter(function (b) { return b.supplier === sup && b.kind === 'consignment'; });
    var billed = sum(bills, function (b) { return Number(b.amount) || 0; }), paid = sum((D.supplier_payments || []).filter(function (x) { return x.supplier === sup && x.kind === 'consignment'; }), function (x) { return Number(x.amount) || 0; });
    return { supplier: sup, pieces: ps, sold: sold, onHand: ps.filter(function (p) { return p.status === 'in stock' || p.status === 'on approval' || p.status === 'reserved'; }),
      returned: ps.filter(function (p) { return p.status === 'returned'; }),
      pre: sum(sold, function (l) { return l.pre; }), gst: sum(sold, function (l) { return l.gst; }), mrp: sum(sold, function (l) { return l.mrp; }),
      ours: sum(sold, function (l) { return l.ours; }), theirs: sum(sold, function (l) { return l.theirs; }),
      theirsAll: sum(allSold, function (l) { return l.theirs; }), billed: billed, paid: paid, toPay: Math.max(0, billed - paid), notBilled: Math.max(0, sum(allSold, function (l) { return l.theirs; }) - billed) };
  }
  /* is everything on the order with us? A designer custom outfit not yet received, or our own
     outfit whose fabric is not in stock, means no: take a receipt, not a GST invoice. */
  function garmentInStock(g) {
    if (isThird(g)) return !!g.piece;
    if (g.piece) return true;
    var ok = true;
    fabricsOf(g).forEach(function (u) { var st = stockOf(u.fabric); if (st.hand + 0.001 < (Number(u.metres) || 0)) ok = false; });
    return ok;
  }
  function orderInStock(oid) { var gs = by(D.garments, 'order', oid); return gs.length > 0 && gs.every(garmentInStock); }
  function advRule() { var a = one(D.agents || [], 'advancewatch'); var r = (a && a.rules) || {}; return { pct: Number(r.designer_pct) || 75, days: r.designer_days == null ? 7 : Number(r.designer_days), fabric: Number(r.fabric_pct) || 70 }; }
  function rewardByCode(code) { code = String(code || '').trim().toUpperCase(); return (D.rewards || []).filter(function (r) { return r.code.toUpperCase() === code; })[0] || null; }
  function rewardCheck(code, oid) {
    var r = rewardByCode(code);
    if (!r) return { ok: false, why: 'No credit note or gift coupon has the code ' + code + '.' };
    if (r.used) return { ok: false, why: r.code + ' was already used on ' + r.used.order + ' on ' + d(r.used.at) + '. It cannot be used twice.' };
    if (r.valid_until && r.valid_until < localToday()) return { ok: false, why: r.code + ' ran out on ' + d(r.valid_until) + '.' };
    var o = one(D.orders, oid); if (r.client && o && r.client !== o.client) { var c = one(D.clients, r.client); return { ok: false, why: r.code + ' belongs to ' + (c ? c.name : 'another client') + '.' }; }
    return { ok: true, reward: r };
  }
  function findBarcode(code) { code = String(code || '').trim().toUpperCase(); return (D.pieces || []).filter(function (p) { return p.barcode.toUpperCase() === code; })[0] || null; }
  function syncValues() { (D.orders || []).forEach(function (o) { var L = orderLines(o); if (L.listed) o.value = L.garmentsTotal + L.extrasTotal; }); }
  function save() { syncValues(); syncPieces(); try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  /* 5 Oct: the order value is the garments' values (and the other items), never typed. A saved
     copy from before gets the new fields, and an old order's value is shared out over its
     garments so every total stays exactly what it was. Safe to run twice. */
  function migrate() {
    D.priceRule = D.priceRule || { multiplier: 6 };
    /* 6 Oct: stock. Every physical piece is one record with a barcode; purchases own them. */
    D.supplier_bills = D.supplier_bills || []; D.supplier_payments = D.supplier_payments || [];
    D.rewards = D.rewards || []; D.expenses = D.expenses || [];
    if (!D.stitching) { var sd0 = (typeof SEED === 'function') ? SEED() : {}; D.stitching = sd0.stitching || []; if (!D.expenses.length) D.expenses = sd0.expenses || []; if (!D.rewards.length) D.rewards = sd0.rewards || []; }
    if (!D.priceRule.markup) D.priceRule.markup = 1.6;
    (D.stitching || []).forEach(function (x) { if (KINDS.indexOf(x.kind) < 0) KINDS.push(x.kind); });   /* an outfit added to the stitching menu can be ordered */
    /* 6 Oct: the fabric library is the vendors' catalogue; our own stock is lots bought on bills.
       An old store/godown figure becomes an opening lot, topped up by what has already been cut,
       so the metres on hand read exactly as before. */
    if (!D.fabric_lots) {
      D.fabric_lots = [];
      (D.fabrics || []).forEach(function (f) {
        var st = f.stock || {}, cut = consumedOf(f.id);
        if ((Number(st.Store) || 0) + (Number(st.Godown) || 0) + cut > 0) {
          D.fabric_lots.push({ id: 'FL-' + f.id + '-S', fabric: f.id, vendor: f.vendor, at: '2026-09-01', metres: (Number(st.Store) || 0) + cut, cost_m: f.cost, gst: 5, bill: 'Opening stock', location: 'Store', purchase: '' });
          if (Number(st.Godown) > 0) D.fabric_lots.push({ id: 'FL-' + f.id + '-G', fabric: f.id, vendor: f.vendor, at: '2026-09-01', metres: Number(st.Godown), cost_m: f.cost, gst: 5, bill: 'Opening stock', location: 'Godown', purchase: '' });
        }
        if (!f.sell_m) f.sell_m = Math.round(f.cost * 1.6 / 100) * 100;
        if (f.at_vendor == null) f.at_vendor = 60;
      });
    }
    if (!D.pieces || !D.purchases) { var sd = (typeof SEED === 'function') ? SEED() : {}; D.pieces = D.pieces || sd.pieces || []; D.purchases = D.purchases || sd.purchases || []; }
    /* 6 Oct: an outfit in a cloth is charged per metre, plus its design charge. An old flat
       outfit price becomes a per-metre charge at 3 metres, with no design charge. */
    (D.fabrics || []).forEach(function (f) {
      f.rates = f.rates || {};
      Object.keys(f.prices || {}).forEach(function (k) { if (!f.rates[k] && Number(f.prices[k]) > 0) f.rates[k] = { per_m: Math.round(f.prices[k] / 3 / 100) * 100, design: 0 }; });
      delete f.prices;
    });
    (D.orders || []).forEach(function (o) {
      o.adds = o.adds || []; o.extras = o.extras || []; o.cuts = o.cuts || []; if (o.ops == null) o.ops = '';
      if (o.vertical === 'designer' && o.designer) by(D.garments, 'order', o.id).forEach(function (g) { if (!g.designer) g.designer = o.designer; });
      var gs = by(D.garments, 'order', o.id), priced = gs.filter(function (g) { return g.price != null; });
      if (!(Number(o.value) > 0) || priced.length || o.extras.length) return;
      if (!gs.length) { o.extras.push({ id: uid('X-'), label: 'As agreed', note: 'The value agreed before garments were listed', due: o.delivery || '', amount: Number(o.value) }); return; }
      /* shared in proportion to what the library would charge for each, so a shirt is not priced like a sherwani */
      var w = gs.map(function (g) { return garmentSuggest(g).amount || 1; }), wt = w.reduce(function (a, b) { return a + b; }, 0), left = Number(o.value);
      gs.forEach(function (g, i) { g.price = i === gs.length - 1 ? left : Math.round(Number(o.value) * w[i] / wt / 500) * 500; left -= g.price; g.price_by = 'agreed'; });
    });
    syncValues();
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }

  /* ---------- who is signed in, and what they may see ---------- */

  var ME = null;
  function me() { return ME; }
  function signIn(id) { ME = one(D.people, id); try { sessionStorage.setItem(KEY + '.me', id); } catch (e) {} }
  function signOut() { ME = null; try { sessionStorage.removeItem(KEY + '.me'); } catch (e) {} location.reload(); }

  var ROLES = {
    'Owner':              { orders:'all',  cost:true,  money:true,  stock:true,  ops:true,  invoices:true,  targets:'set', settings:true,  ai:true },
    'BDM':                { orders:'all',  cost:true,  money:true,  stock:true,  ops:true,  invoices:true,  targets:'set', settings:true,  ai:false },
    'Operations manager': { orders:'all',  cost:true,  money:true,  stock:true,  ops:true,  invoices:false, targets:'own', settings:false, ai:false },
    'Accounts':           { orders:'all',  cost:true,  money:true,  stock:true,  ops:false, invoices:true,  targets:'see', settings:false, ai:false },
    'Stylist':            { orders:'own',  cost:false, money:true,  stock:true,  ops:false, invoices:false, targets:'own', settings:false, ai:false },
    'Salesperson':        { orders:'own',  cost:false, money:true,  stock:true,  ops:false, invoices:false, targets:'own', settings:false, ai:false },
    'Master':             { orders:'mine', cost:false, money:false, stock:'metres', ops:true, invoices:false, targets:'own', settings:false, ai:false }
  };

  function can(what) {
    var r = ME && ROLES[ME.role]; return r ? r[what] : false;
  }

  /* masking is a display rule, and this prototype says so out loud */
  function money(n) { return can('money') ? rupees(n) : '<span class="masked">₹ ••••</span>'; }
  function moneyShort(n) { return can('money') ? lakh(n) : '<span class="masked">₹ ••••</span>'; }

  /* orders this person is allowed to see */
  function myOrders() {
    var rule = can('orders');
    if (rule === 'all') return D.orders.slice();
    if (rule === 'own') return D.orders.filter(function (o) {
      return o.salesperson === ME.id || o.stylist === ME.id;
    });
    if (rule === 'mine') {
      var ids = {};
      D.garments.forEach(function (g) { if (g.master === ME.id) ids[g.order] = 1; });
      return D.orders.filter(function (o) { return ids[o.id]; });
    }
    return [];
  }

  /* ---------- which routes a role may reach ----------
     The nav reads this and so does the router, so typing a hash cannot get past it. */

  var ROUTE_OK = {
    '#/home':            function () { return true; },
    '#/showroom':        function () { return can('orders') !== 'mine'; },
    '#/order':           function () { return can('orders') !== 'mine'; },
    '#/clients':         function () { return can('orders') !== 'mine'; },
    '#/inbox':           function () { return can('orders') !== 'mine'; },
    '#/targets':         function () { return !!can('targets'); },
    '#/floor':           function () { return !!can('ops'); },
    '#/designers-floor': function () { return can('ops') === true; },
    '#/mine':            function () { return !!can('ops'); },
    '#/fabric':          function () { return !!can('stock'); },
    '#/readymade':       function () { return can('stock') === true; },
    '#/stock':           function () { return can('stock') === true; },
    '#/purchases':       function () { return !!can('invoices'); },
    '#/fabricstock':     function () { return can('stock') === true; },
    '#/stitching':       function () { return can('stock') === true; },
    '#/rewards':         function () { return can('orders') !== 'mine'; },
    '#/money':           function () { return !!can('invoices'); },
    '#/consignment':     function () { return !!can('invoices'); },
    '#/invoices':        function () { return !!can('invoices'); },
    '#/payables':        function () { return !!can('invoices'); },
    '#/costsheet':       function () { return !!can('cost'); },
    '#/accounting':      function () { return !!can('invoices'); },
    '#/campaigns':       function () { return !!can('settings'); },
    '#/agents':          function () { return !!can('settings'); },
    '#/team':            function () { return !!can('settings'); }
  };
  function allowed(r) {
    var f = ROUTE_OK[String(r || '').split('?')[0]];
    return f ? !!f() : false;
  }

  /* ---------- the money model, his own arithmetic ---------- */

  /* the designer split: see payableOf, on the price before GST */
  function payableGrossOf(p) {           /* the client-facing total, GST inside, for HIS garments only */
    var o = one(D.orders, p && p.order);
    if (!o) return Number(p && p.gross) || 0;
    var m = orderMoney(o.id), L = m.lines;
    if (!L.listed || !m.value) return m.total;
    var his = sum(L.garments.filter(function (g) { return g.designer === p.designer; }), garmentValue);
    return his >= m.value ? m.total : Math.round(m.total * his / m.value);
  }
  function payableOn(p) { return payableOf(payableGrossOf(p), p.margin, D.gst); }

  /* 6 Oct, decided: the designer split is on the price BEFORE GST. A total of 1,18,000 with GST
     inside is 1,00,000 before GST; a 30% designer leaves us 30,000 and is owed 70,000. */
  function payableOf(gross, marginPct, gstRate) {
    gross = Number(gross) || 0;
    var net = Math.round(gross / (1 + (gstRate == null ? 0.18 : gstRate)));
    var gst = gross - net;
    var ours = Math.round(net * (Number(marginPct) || 0) / 100);
    return { gross: gross, gst: gst, net: net, ours: ours, payable: net - ours };
  }

  /* Order value, less as many deductions as you like, plus GST on top, less what has
     been paid, leaves PENDING. One function, so no two screens can disagree.

       Order value       1,50,000   excl GST, set when the order is signed
       less Discount       -10,000
       less Festive offer  -10,000
       Net                1,30,000
       GST at 18%          +23,400
       Total payable      1,53,400
       Paid              -1,00,000
       PENDING               53,400                                                 */
  function cutsTotal(o) {
    return sum((o && o.cuts) || [], function (c) { return Number(c.amount) || 0; });
  }
  function addsTotal(o) {
    return sum((o && o.adds) || [], function (c) { return Number(c.amount) || 0; });
  }
  /* what a garment is charged, suggested from the fabric library: the price set for that outfit
     in its first fabric, or, where none is set, the cost of all its fabric times the house rule */
  /* what we charge for an outfit in a cloth: a charge per metre (so a bigger man pays for the
     cloth he takes) and a design charge for the outfit. Set on the bunch by the owner or BDM;
     where no per-metre charge is set, the house rule: so many times the cost per metre. */
  /* our selling price a metre for a fabric; where none is set, its cost times the markup rule */
  function sellOf(f) { return f ? (Number(f.sell_m) > 0 ? Number(f.sell_m) : Math.round((Number(f.cost) || 0) * ((D.priceRule && Number(D.priceRule.markup)) || 1.6) / 100) * 100) : 0; }
  function stitchOf(kind) { var s = one((D.stitching || []).map(function (x) { x.id = x.kind; return x; }), kind) || {}; return { stitch: Number(s.stitch) || 0, design: Number(s.design) || 0, set: !!s.kind }; }
  function rateFor(f, kind) {
    var r = (f && f.rates && f.rates[kind]) || {}, k = (D.priceRule && Number(D.priceRule.multiplier)) || 6;
    var set = Number(r.per_m) > 0;
    return { per_m: set ? Number(r.per_m) : (f ? f.cost * k : 0), design: Number(r.design) || 0, set: set, rule: k };
  }
  /* 6 Oct: an outfit is FABRIC (metres x our selling price a metre, 5% GST) + STITCHING + DESIGN
     (from the stitching menu, 18% GST), each shown on its own. Figures agreed at sale stay on the garment. */
  function garmentSuggest(g) {
    if (g.piece) { var r = pieceOf(g.piece); if (r) return { amount: piecePrice(r), fabric: 0, stitch: 0, design: 0, why: 'the readymade piece ' + (r.barcode || r.code || r.name) + ', at its price before GST' }; }
    var fl = fabricsOf(g), parts = [], cloth = 0;
    fl.forEach(function (u, i) {
      var f = one(D.fabrics, u.fabric); if (!f) return;
      var pm = i === 0 && g.rate != null ? Number(g.rate) : sellOf(f), m = Number(u.metres) || 0;
      cloth += pm * m;
      parts.push(m + ' m of ' + f.brand + ' ' + f.colour + ' at ' + rupees(pm) + ' a metre');
    });
    if (!parts.length) return { amount: 0, fabric: 0, stitch: 0, design: 0, why: 'no fabric chosen yet' };
    var sm = stitchOf(g.kind), stitch = g.stitch != null ? Number(g.stitch) || 0 : sm.stitch, design = g.design != null ? Number(g.design) || 0 : sm.design;
    cloth = Math.round(cloth);
    return { amount: cloth + stitch + design, fabric: cloth, stitch: stitch, design: design,
      why: parts.join(', ') + (stitch ? ', stitching ' + rupees(stitch) : '') + (design ? ', design ' + rupees(design) : '') };
  }
  /* the GST parts of a garment: fabric at 5%, stitching and design at 18%; a piece at its own rate;
     a price set by hand or agreed stays one figure at 18% */
  function garmentParts(g) {
    if (g.price != null) { var pc = g.piece && pieceOf(g.piece); return [{ amt: Number(g.price) || 0, rate: pc && pc.gst != null ? Number(pc.gst) : 18, what: 'outfit' }]; }
    var sg = garmentSuggest(g);
    if (g.piece) { var p2 = pieceOf(g.piece); return [{ amt: sg.amount, rate: p2 && p2.gst != null ? Number(p2.gst) : 18, what: 'readymade' }]; }
    return [{ amt: sg.fabric, rate: 5, what: 'fabric' }, { amt: sg.stitch + sg.design, rate: 18, what: 'stitching and design' }].filter(function (x) { return x.amt > 0; });
  }
  function garmentValue(g) { return g.price != null ? Number(g.price) || 0 : garmentSuggest(g).amount; }
  /* the order value: every garment's value and every other item, added up. An order with neither
     (a test, or one not yet listed) falls back to the value it was given. */
  function orderLines(o) {
    var gs = o ? by(D.garments, 'order', o.id) : [], ex = (o && o.extras) || [];
    return { garments: gs, extras: ex, garmentsTotal: sum(gs, garmentValue), extrasTotal: sum(ex, function (x) { return Number(x.amount) || 0; }), listed: gs.length + ex.length > 0 };
  }
  function orderMoney(orderId, gstRate) {
    var o = typeof orderId === 'object' ? orderId : one(D.orders, orderId);
    var rate = gstRate == null ? (D.gst == null ? 0.18 : D.gst) : gstRate;
    var L = orderLines(o);
    var value = L.listed ? L.garmentsTotal + L.extrasTotal : (Number(o && o.value) || 0);
    var adds = addsTotal(o);
    var cuts = cutsTotal(o);
    var net = Math.max(0, value + adds - cuts);
    /* GST by part: fabric at 5%, the rest at 18%; deductions come off every part in proportion */
    var parts = [];
    if (L.listed) {
      L.garments.forEach(function (g) { garmentParts(g).forEach(function (pt) { parts.push(pt); }); });
      (o.extras || []).forEach(function (x) { parts.push({ amt: Number(x.amount) || 0, rate: rate * 100, what: x.label }); });
    } else parts.push({ amt: value, rate: rate * 100, what: 'order' });
    if (adds) parts.push({ amt: adds, rate: rate * 100, what: 'charges' });
    var gross = sum(parts, function (x) { return x.amt; }), keep = gross ? net / gross : 0, byRate = {};
    parts.forEach(function (x) { var k = String(x.rate); byRate[k] = (byRate[k] || 0) + x.amt * keep; });
    var gstParts = Object.keys(byRate).map(function (k) { return { rate: Number(k), base: Math.round(byRate[k]), gst: Math.round(byRate[k] * Number(k) / 100) }; })
      .sort(function (a, b) { return a.rate - b.rate; });
    var gst = sum(gstParts, function (x) { return x.gst; });
    var total = net + gst;
    var invs = o ? by(D.invoices, 'order', o.id) : [];
    var billed = sum(invs, function (i) { return Number(i.amount) || 0; });
    var paid = sum(invs, function (i) { return paidOn(i.id); });
    return { order: o, value: value, lines: L, adds: (o && o.adds) || [], addsTotal: adds, cuts: (o && o.cuts) || [], cutsTotal: cuts,
             net: net, gst: gst, rate: rate, total: total, gstParts: gstParts,
             billed: billed, paid: paid, pending: total - paid };
  }

  function paidOn(invId) {
    return sum(by(D.payins, 'invoice', invId), function (p) { return p.amount; });
  }
  /* an invoice is a demand for an amount, nothing more */
  function invoiceDue(inv) { return Number(inv && inv.amount) || 0; }
  function invoiceLeft(inv) { return invoiceDue(inv) - paidOn(inv.id); }

  /* what one order cost us, and what we made */
  function fabricsOf(g) {
    if (g && g.fabrics && g.fabrics.length) return g.fabrics;
    return (g && g.fabric) ? [{ fabric: g.fabric, metres: g.metres || 0 }] : [];
  }
  function metresOf(g) { return sum(fabricsOf(g), function (u) { return u.metres; }); }

  function costOf(orderId) {
    var lines = by(D.costlines, 'order', orderId);
    var fab = 0;
    by(D.garments, 'order', orderId).forEach(function (g) {
      fabricsOf(g).forEach(function (u) {
        var f = one(D.fabrics, u.fabric);
        if (f && u.metres) fab += f.cost * u.metres;
      });
    });
    var pieces = 0;   /* a readymade piece costs what it cost us to make or buy */
    by(D.garments, 'order', orderId).forEach(function (g) { var r = g.piece && pieceOf(g.piece); if (r) pieces += pieceCost(r); });
    var rest = sum(lines, function (l) { return l.amount; });
    return { fabric: fab, pieces: pieces, lines: lines, other: rest, total: fab + pieces + rest };
  }
  function marginOf(orderId) {
    var o = one(D.orders, orderId), c = costOf(orderId);
    var val = Number(o && o.value) || 0;
    return { value: val, cost: c.total, kept: val - c.total,
             pct: val ? Math.round((val - c.total) / val * 100) : 0 };
  }

  /* fabric: opening - consumed - reserved = on hand */
  /* metres already cut: a garment at or past Cut has taken its fabric off the shelf */
  function consumedOf(fid) {
    var used = 0;
    (D.garments || []).forEach(function (g) {
      if (isThird(g) || HOUSE.indexOf(g.stage) < HOUSE.indexOf('Cut')) return;
      fabricsOf(g).forEach(function (u) { if (u.fabric === fid) used += Number(u.metres) || 0; });
    });
    return Math.round(used * 100) / 100;
  }
  /* our own fabric stock: lots bought in, less what has been cut; reserved = promised to garments not cut yet */
  function stockOf(fid) {
    var f = one(D.fabrics, fid); if (!f) return { hand: 0, reserved: 0, store: 0, godown: 0, available: 0, in: 0, cut: 0 };
    var lots = (D.fabric_lots || []).filter(function (l) { return l.fabric === fid; });
    var inS = sum(lots.filter(function (l) { return l.location !== 'Godown'; }), function (l) { return Number(l.metres) || 0; });
    var inG = sum(lots.filter(function (l) { return l.location === 'Godown'; }), function (l) { return Number(l.metres) || 0; });
    var cut = consumedOf(fid), reserved = 0;
    (D.garments || []).forEach(function (g) {
      if (isThird(g) || HOUSE.indexOf(g.stage) >= HOUSE.indexOf('Cut')) return;
      var o = one(D.orders, g.order); if (!o || o.stage === 'Lost') return;
      fabricsOf(g).forEach(function (u) { if (u.fabric === fid) reserved += Number(u.metres) || 0; });
    });
    var store = Math.round(Math.max(0, inS - cut) * 10) / 10, godown = Math.round((inG - Math.max(0, cut - inS)) * 10) / 10;
    var hand = Math.round((inS + inG - cut) * 10) / 10;
    var costIn = sum(lots, function (l) { return (Number(l.metres) || 0) * (Number(l.cost_m) || 0); }), mIn = inS + inG;
    return { store: store, godown: godown, hand: hand, reserved: Math.round(reserved * 10) / 10, available: Math.round((hand - reserved) * 10) / 10,
             in: mIn, cut: cut, lots: lots, avgCost: mIn ? Math.round(costIn / mIn) : f.cost, low: hand <= f.threshold };
  }

  /* ---------- stages ---------- */

  /* 6 Oct: in-house or third-party is the GARMENT's, not the order's. One order can hold both:
     ours go to our floor, a designer's go to the designers. */
  function isThird(g) { return !!(g && g.designer); }
  function ladderFor(g) { return isThird(g) ? DESIGNER : HOUSE; }
  function moveGarment(gid, stage) {
    var g = one(D.garments, gid); if (!g) return;
    g.stage = stage;
    g.history = g.history || [];
    g.history.push({ stage: stage, by: ME ? ME.id : 'system', at: TODAY + 'T' + clock() });
    save();
  }
  function moveOrder(oid, stage) {
    var o = one(D.orders, oid); if (!o) return;
    o.stage = stage;
    o.history = o.history || [];
    o.history.push({ stage: stage, by: ME ? ME.id : 'system', at: TODAY + 'T' + clock() });
    save();
  }
  function clock() {
    var n = new Date();
    return ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2);
  }

  /* marking, cutting and stitching are different men. A master hands it on. */
  function handOver(gid, toId, note) {
    var g = one(D.garments, gid); if (!g) return;
    var from = g.master;
    g.master = toId;
    g.history = g.history || [];
    g.history.push({ stage: g.stage, by: ME ? ME.id : 'system', at: TODAY + 'T' + clock(),
                     handover: true, from: from, to: toId, note: note || '' });
    save();
  }

  /* days a garment has been sitting at its current stage */
  function sittingFor(g) {
    var h = (g.history || []);
    var last = h.length ? h[h.length - 1].at : g.started;
    return last ? days(last) : 0;
  }

  /* ---------- search, the same everywhere ---------- */

  var Q = {};
  function matches(q, parts) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return true;
    var hay = parts.filter(function (x) { return x != null; }).join(' \u00b7 ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }

  /* ---------- the agents, as rules with a job title ---------- */

  function runAgents() {
    var out = [];
    D.agents.forEach(function (a) {
      if (a.mode === 'off') return;
      var found = AGENT_RULES[a.id] ? AGENT_RULES[a.id](a.rules) : [];
      found.forEach(function (f) {
        out.push({ agent: a.id, agentName: a.name, mode: a.mode, what: f.what,
                   why: f.why, ref: f.ref, route: f.route, level: f.level || 'warn', stylist: f.stylist, salesperson: f.salesperson });
      });
    });
    return out;
  }

  var AGENT_RULES = {
    floorwatch: function (r) {
      return D.garments.filter(function (g) {
        return g.stage !== 'Ready' && g.stage !== 'Delivered' && sittingFor(g) > (r.held_days || 7);
      }).map(function (g) {
        var p = one(D.people, g.master);
        return { what: g.kind + ' on ' + g.order + ' has been at ' + g.stage + ' for ' +
                       sittingFor(g) + ' days',
                 why: 'longer than the ' + (r.held_days || 7) + ' days this kind of work usually takes' +
                      (p ? ', held by ' + p.name : ''),
                 ref: g.id, route: '#/floor', level: sittingFor(g) > 14 ? 'bad' : 'warn' };
      });
    },
    clock: function (r) {
      var win = r.days_before_delivery || 7;
      var res = [];
      D.orders.forEach(function (o) {
        if (!o.delivery || o.stage === 'Delivered' || o.stage === 'Lost') return;
        var left = days(TODAY, o.delivery);
        if (left > win) return;
        by(D.garments, 'order', o.id).forEach(function (g) {
          if (['Finishing','Checking','Ready','Delivered','Received and checked','Dispatched to us']
              .indexOf(g.stage) >= 0) return;
          res.push({ what: g.kind + ' on ' + o.id + ' is at ' + g.stage + ' with ' + left +
                           ' days to delivery',
                     why: 'the clock counts back from the delivery date, ' + win + ' days by default',
                     ref: o.id, route: '#/board', level: left <= 3 ? 'bad' : 'warn' });
        });
      });
      return res;
    },
    designerchase: function (r) {
      var res = [];
      D.orders.forEach(function (o) {
        if (o.stage === 'Delivered') return;
        var gs = by(D.garments, 'order', o.id).filter(isThird);
        gs.forEach(function (g) {
          if (g.stage === 'Queried by designer' && sittingFor(g) >= (r.quiet_days || 3))
            res.push({ what: o.designer + ' queried ' + g.kind + ' on ' + o.id + ' ' +
                             sittingFor(g) + ' days ago and the job is stopped',
                       why: 'a query older than ' + (r.quiet_days || 3) + ' days blocks production',
                       ref: o.id, route: '#/designers-floor', level: 'bad' });
          else if (o.promised && days(TODAY, o.promised) < 0 && g.stage !== 'Ready')
            res.push({ what: o.designer + ' is ' + (-days(TODAY, o.promised)) + ' days past the promised date on ' + o.id,
                       why: 'promised ' + d(o.promised),
                       ref: o.id, route: '#/designers-floor', level: 'bad' });
        });
      });
      return res;
    },
    walkin: function (r) {
      return D.orders.filter(function (o) {
        if (['Walk-in','Shown designs','Measured','Quoted'].indexOf(o.stage) < 0) return false;
        if (by(D.follows, 'order', o.id).filter(function (f) { return !f.done; }).length) return false;
        return days(o.booked) >= (r.quiet_days || 5);
      }).map(function (o) {
        var c = one(D.clients, o.client);
        return { what: (c ? c.name : o.client) + ' was at ' + o.stage + ' ' + days(o.booked) +
                       ' days ago with no follow-up booked',
                 why: 'quiet for more than ' + (r.quiet_days || 5) + ' days',
                 ref: o.id, route: '#/board', level: 'warn' };
      });
    },
    bolt: function (r) {
      return D.fabrics.filter(function (f) {
        var s = stockOf(f.id); return s.hand <= f.threshold;
      }).map(function (f) {
        var s = stockOf(f.id);
        return { what: f.brand + ' ' + f.colour + ' is down to ' + s.hand + 'm against a ' +
                       f.threshold + 'm threshold',
                 why: f.vendor + ' takes ' + f.procure_days + ' days to deliver, so order now',
                 ref: f.id, route: '#/fabric', level: s.hand === 0 ? 'bad' : 'warn' };
      });
    },
    /* 75% within a week of placing a designer custom piece; 70% once fabric we were waiting for is in */
    advancewatch: function (r) {
      var out = [], pct = Number(r.designer_pct) || 75, dd = r.designer_days == null ? 7 : Number(r.designer_days), fp = Number(r.fabric_pct) || 70;
      D.orders.forEach(function (o) {
        if (o.stage === 'Delivered' || o.stage === 'Lost') return;
        var gs = by(D.garments, 'order', o.id), m = orderMoney(o.id); if (!m.total) return;
        var c = one(D.clients, o.client) || {}, mr = c.name ? 'Mr. ' + c.name.split(' ').slice(-1)[0] : 'the client';
        var placed = gs.filter(function (g) { return isThird(g) && !g.piece && g.make !== 'readymade'; });
        if (placed.length) {
          var since = placed.map(function (g) { return (g.history && g.history[0] && g.history[0].at || o.booked || TODAY).slice(0, 10); }).sort()[0];
          var need = Math.round(m.total * pct / 100) - m.paid;
          if (need > 0 && days(since, localToday()) >= dd)
            out.push({ what: 'Collect ' + rupees(need) + ' from ' + mr + ' on ' + o.id + ' to reach ' + pct + '%', why: placed.length + ' designer piece' + (placed.length === 1 ? '' : 's') + ' placed ' + days(since, localToday()) + ' days ago; the designer is held until it is paid',
              ref: o.id, route: '#/order', level: 'bad', stylist: o.stylist, salesperson: o.salesperson });
        }
        var waited = gs.filter(function (g) { return g.awaited_fabric && !isThird(g) && HOUSE.indexOf(g.stage) < HOUSE.indexOf('Cut'); });
        if (waited.length && waited.every(garmentInStock)) {
          var need2 = Math.round(m.total * fp / 100) - m.paid;
          if (need2 > 0) out.push({ what: 'The fabric is in: collect ' + rupees(need2) + ' from ' + mr + ' on ' + o.id + ' to reach ' + fp + '%', why: 'cutting waits for it',
            ref: o.id, route: '#/order', level: 'bad', stylist: o.stylist, salesperson: o.salesperson });
        }
      });
      return out;
    },
    collector: function (r) {
      return D.invoices.filter(function (i) {
        return invoiceLeft(i) > 0 && i.due && days(TODAY, i.due) < -(r.grace_days || 0);
      }).map(function (i) {
        return { what: i.id + ' is ' + (-days(TODAY, i.due)) + ' days overdue, ' +
                       rupees(invoiceLeft(i)) + ' still to come',
                 why: 'due ' + d(i.due) + ' and not cleared',
                 ref: i.id, route: '#/invoices', level: 'bad' };
      });
    },
    settler: function (r) {
      return D.payables.filter(function (p) {
        return !p.paid && days(p.at) >= (r.age_days || 30);
      }).map(function (p) {
        var g = one(D.designers, p.designer);
        return { what: (g ? g.name : p.designer) + ' has been owed ' + rupees(payableOn(p).payable) +
                       ' for ' + days(p.at) + ' days',
                 why: 'older than ' + (r.age_days || 30) + ' days',
                 ref: p.id, route: '#/payables', level: 'warn' };
      });
    },
    shelf: function (r) {
      var res = [];
      D.fabrics.forEach(function (f) {
        if (f.sat_days >= (r.dead_fabric_days || 120))
          res.push({ what: f.brand + ' ' + f.colour + ' has not moved in ' + f.sat_days + ' days',
                     why: 'dead stock over ' + (r.dead_fabric_days || 120) + ' days, ' +
                          rupees(stockOf(f.id).hand * f.cost) + ' sitting still',
                     ref: f.id, route: '#/fabric', level: 'warn' });
      });
      D.readymade.forEach(function (p) {
        if (p.age_days >= (r.dead_piece_days || 90))
          res.push({ what: p.name + ' has been on the floor ' + p.age_days + ' days',
                     why: 'readymade gathering dust over ' + (r.dead_piece_days || 90) + ' days',
                     ref: p.id, route: '#/readymade', level: 'warn' });
      });
      var win = D.fabrics.slice().sort(function (a, b) { return b.sold_90 - a.sold_90; })[0];
      if (win) res.push({ what: 'Winning fabric this month: ' + win.brand + ' ' + win.colour +
                                ', ' + win.sold_90 + 'm cut in 90 days',
                          why: 'the one to keep deep stock of', ref: win.id,
                          route: '#/fabric', level: 'ok' });
      var piece = D.readymade.slice().sort(function (a, b) { return a.age_days - b.age_days; })[0];
      if (piece) res.push({ what: 'Winning piece: ' + piece.name + ' sells in ' + piece.age_days + ' days',
                            why: 'reorder it', ref: piece.id, route: '#/readymade', level: 'ok' });
      return res;
    }
  };

  /* ---------- targets ---------- */

  /* a period, never pro-rated by day: the value defined for the period is the denominator */
  function windowFor(period) {
    var y = 2026, m = 9; /* October 2026, zero-based */
    if (period === 'Half-month') return { from: '2026-10-01', to: '2026-10-15', label: '1 to 15 Oct' };
    if (period === 'Quarter')     return { from: '2026-10-01', to: '2026-12-31', label: 'Oct to Dec 2026' };
    if (period === 'Year')        return { from: '2026-04-01', to: '2027-03-31', label: 'FY 2026-27' };
    return { from: '2026-10-01', to: '2026-10-31', label: 'October 2026' };
  }
  function inWindow(iso, w) {
    if (!iso) return false;
    var s = String(iso).slice(0, 10);
    return s >= w.from && s <= w.to;
  }
  /* order value counts when the advance arrived, which is when the sale is real */
  function closedIn(w, personId) {
    return D.orders.filter(function (o) {
      if (!o.advance_at || !inWindow(o.advance_at, w)) return false;
      if (personId && o.salesperson !== personId) return false;
      return true;
    });
  }
  function targetValue(t, period) {
    var m = Number(t.month) || 0;
    if (period === 'Half-month') return Math.round(m / 2);
    if (period === 'Quarter') return m * 3;
    if (period === 'Year') return m * 12;
    return m;
  }

  /* ---------- communication log ---------- */

  function commsOn(kind, ref) {
    return D.comms.filter(function (c) { return c.on === kind && c.ref === ref; })
      .sort(function (a, b) { return a.at < b.at ? 1 : -1; });
  }
  function addComm(kind, ref, c) {
    c.id = uid('cm'); c.on = kind; c.ref = ref; c.by = ME ? ME.id : null;
    c.docs = c.docs || [];
    D.comms.push(c); save(); return c;
  }

  /* ---------- deleting (6 Oct) ----------
     An opportunity holds the whole order, so deleting it takes everything that hangs off it:
     its outfits (and so their operations tasks), invoices and their payments, designer payables,
     cost lines, follow-ups and notes. Deleting a client takes each of his opportunities that way,
     plus his measurement sets, inbox threads and follow-ups. A household left empty goes too. */
  function orderImpact(oid) {
    var inv = by(D.invoices, 'order', oid), invIds = inv.map(function (i) { return i.id; });
    var pays = D.payins.filter(function (p) { return invIds.indexOf(p.invoice) > -1; });
    var gs = by(D.garments, 'order', oid), gIds = gs.map(function (g) { return g.id; });
    return { garments: gs, invoices: inv, payins: pays, paid: sum(pays, function (p) { return Number(p.amount) || 0; }),
      payables: by(D.payables, 'order', oid), costlines: by(D.costlines, 'order', oid), follows: by(D.follows, 'order', oid),
      comms: D.comms.filter(function (c) { return (c.on === 'order' && c.ref === oid) || (c.on === 'garment' && gIds.indexOf(c.ref) > -1); }) };
  }
  function drop(list, gone) { for (var i = list.length - 1; i >= 0; i--) if (gone.indexOf(list[i]) > -1) list.splice(i, 1); }
  function deleteOrder(oid) {
    var o = one(D.orders, oid); if (!o) return null;
    var x = orderImpact(oid);
    drop(D.garments, x.garments); drop(D.invoices, x.invoices); drop(D.payins, x.payins); drop(D.payables, x.payables);
    drop(D.costlines, x.costlines); drop(D.follows, x.follows); drop(D.comms, x.comms); drop(D.orders, [o]);
    save(); return x;
  }
  function clientImpact(cid) {
    var orders = by(D.orders, 'client', cid), per = orders.map(function (o) { return orderImpact(o.id); });
    var tot = function (k) { return per.reduce(function (a, x) { return a + x[k].length; }, 0); };
    return { orders: orders, garments: tot('garments'), invoices: tot('invoices'), payins: tot('payins'),
      paid: per.reduce(function (a, x) { return a + x.paid; }, 0),
      meas: by(D.meas, 'client', cid), threads: by(D.threads, 'client', cid),
      follows: D.follows.filter(function (f) { return f.client === cid; }),
      comms: D.comms.filter(function (c) { return c.on === 'client' && c.ref === cid; }) };
  }
  function deleteClient(cid) {
    var c = one(D.clients, cid); if (!c) return null;
    var x = clientImpact(cid);
    x.orders.slice().forEach(function (o) { deleteOrder(o.id); });
    drop(D.meas, x.meas); drop(D.threads, x.threads); drop(D.follows, D.follows.filter(function (f) { return f.client === cid; })); drop(D.comms, x.comms);
    drop(D.clients, [c]);
    if (c.family && !by(D.clients, 'family', c.family).length) drop(D.families, by(D.families, 'id', c.family));
    save(); return x;
  }

  /* ---------- the public surface ---------- */

  return {
    KEY: KEY, TODAY: TODAY,
    SELL: SELL, HOUSE: HOUSE, DESIGNER: DESIGNER, STAGE_MEANS: STAGE_MEANS,
    ORDER_TYPES: ORDER_TYPES,
    KINDS: KINDS, MEAS: MEAS, MEAS_WHY: MEAS_WHY, SOURCES: SOURCES,
    PAY_METHODS: PAY_METHODS, COUNTRY_CODES: COUNTRY_CODES, phoneOk: phoneOk, phoneJoin: phoneJoin, OCCASIONS: OCCASIONS, localToday: localToday, extractRef: extractRef, CUT_LABELS: CUT_LABELS, ADD_LABELS: ADD_LABELS, OUR_DESIGN_TYPES: OUR_DESIGN_TYPES, COST_KINDS: COST_KINDS,
    FOLLOW_METHODS: FOLLOW_METHODS, PERIODS: PERIODS, ROLES: ROLES,
    uid: uid, rupees: rupees, lakh: lakh, d: d, dt: dt, days: days, esc: esc,
    sum: sum, by: by, one: one,
    load: load, save: save, reset: reset,
    me: me, signIn: signIn, signOut: signOut, can: can, money: money, moneyShort: moneyShort,
    ROUTE_OK: ROUTE_OK, pieceOf: pieceOf, pieceCost: pieceCost, piecePrice: piecePrice, withGst: withGst, syncPieces: syncPieces,
    nextBarcode: nextBarcode, sellOf: sellOf, stitchOf: stitchOf, garmentParts: garmentParts, consumedOf: consumedOf,
    garmentInStock: garmentInStock, orderInStock: orderInStock, advRule: advRule, rewardByCode: rewardByCode, rewardCheck: rewardCheck, piecesOf: piecesOf, purchaseSummary: purchaseSummary, consignmentSummary: consignmentSummary, consignmentLine: consignmentLine, addDays: addDays, paidOn: paidOn, receivePieces: receivePieces, findBarcode: findBarcode, supplierMargin: supplierMargin, allowed: allowed,
    myOrders: myOrders,
    payableOf: payableOf, payableOn: payableOn, payableGrossOf: payableGrossOf,
    orderMoney: orderMoney, rateFor: rateFor, cutsTotal: cutsTotal, addsTotal: addsTotal, garmentSuggest: garmentSuggest, garmentValue: garmentValue, orderLines: orderLines, migrate: migrate, syncValues: syncValues,
    paidOn: paidOn, invoiceDue: invoiceDue, invoiceLeft: invoiceLeft,
    costOf: costOf, marginOf: marginOf, stockOf: stockOf,
    fabricsOf: fabricsOf, metresOf: metresOf, handOver: handOver,
    Q: Q, matches: matches,
    ladderFor: ladderFor, isThird: isThird,
    orderImpact: orderImpact, deleteOrder: deleteOrder, clientImpact: clientImpact, deleteClient: deleteClient, moveGarment: moveGarment, moveOrder: moveOrder, sittingFor: sittingFor,
    runAgents: runAgents,
    windowFor: windowFor, inWindow: inWindow, closedIn: closedIn, targetValue: targetValue,
    commsOn: commsOn, addComm: addComm,
    get D() { return D; },
    VIEWS: {}, ACTIONS: {}
  };
})();
