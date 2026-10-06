/* Saasya Men prototype - the library. Vocabulary and arithmetic only, no screens. */
var GE = (function () {

  var KEY = 'saasya.proto.v2';

  /* ---------- vocabulary, straight out of SPEC.json ---------- */

  var SELL = ['Stylist','Shown designs','Quotation provided','Advance taken','Measurements',
              'In operations','Trial','Alteration','Ready','Delivered','Lost'];

  /* the six kinds of order, in his own words */
  var ORDER_TYPES = ['Our own bespoke','Our own readymade','Our own custom-made',
                     'Third-party readymade','Third-party custom-made','Third-party order'];

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
  var OUR_DESIGN_TYPES = ['Our own bespoke','Our own readymade','Our own custom-made'];

  var COST_KINDS = ['Fabric','Stitching','Designing','Embroidery / handwork','Porter / courier',
                    'Third-party stitching','Other'];

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
  function syncValues() { (D.orders || []).forEach(function (o) { var L = orderLines(o); if (L.listed) o.value = L.garmentsTotal + L.extrasTotal; }); }
  function save() { syncValues(); try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  /* 5 Oct: the order value is the garments' values (and the other items), never typed. A saved
     copy from before gets the new fields, and an old order's value is shared out over its
     garments so every total stays exactly what it was. Safe to run twice. */
  function migrate() {
    D.priceRule = D.priceRule || { multiplier: 6 };
    (D.fabrics || []).forEach(function (f) { f.prices = f.prices || {}; });
    (D.orders || []).forEach(function (o) {
      o.adds = o.adds || []; o.extras = o.extras || []; o.cuts = o.cuts || []; if (o.ops == null) o.ops = '';
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

  /* 1,00,000 gross -> 18,000 GST -> 82,000 net -> designer margin 30% to us
     -> Sasya keeps 24,600, designer is owed 57,400 */
  function payableGrossOf(p) {           /* the client-facing total, GST inside */
    var o = one(D.orders, p && p.order);
    return o ? orderMoney(o.id).total : (Number(p && p.gross) || 0);
  }
  function payableOn(p) { return payableOf(payableGrossOf(p), p.margin, D.gst); }

  function payableOf(gross, marginPct, gstRate) {
    gross = Number(gross) || 0;
    var gst = Math.round(gross * (gstRate == null ? 0.18 : gstRate));
    var net = gross - gst;
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
  function garmentSuggest(g) {
    var fl = fabricsOf(g), f0 = fl.length ? one(D.fabrics, fl[0].fabric) : null;
    if (f0 && f0.prices && Number(f0.prices[g.kind]) > 0)
      return { amount: Number(f0.prices[g.kind]), why: f0.brand + ' ' + f0.colour + ', the price set for a ' + g.kind.split(' / ')[0].toLowerCase() };
    var cost = sum(fl, function (u) { var f = one(D.fabrics, u.fabric); return f ? f.cost * (Number(u.metres) || 0) : 0; });
    var k = (D.priceRule && Number(D.priceRule.multiplier)) || 6;
    if (!cost) return { amount: 0, why: 'no fabric chosen yet' };
    return { amount: Math.round(cost * k / 500) * 500, why: k + ' times the fabric cost (' + rupees(Math.round(cost)) + '), rounded to the nearest 500' };
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
    var gst = Math.round(net * rate);
    var total = net + gst;
    var invs = o ? by(D.invoices, 'order', o.id) : [];
    var billed = sum(invs, function (i) { return Number(i.amount) || 0; });
    var paid = sum(invs, function (i) { return paidOn(i.id); });
    return { order: o, value: value, lines: L, adds: (o && o.adds) || [], addsTotal: adds, cuts: (o && o.cuts) || [], cutsTotal: cuts,
             net: net, gst: gst, rate: rate, total: total,
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
    var rest = sum(lines, function (l) { return l.amount; });
    return { fabric: fab, lines: lines, other: rest, total: fab + rest };
  }
  function marginOf(orderId) {
    var o = one(D.orders, orderId), c = costOf(orderId);
    var val = Number(o && o.value) || 0;
    return { value: val, cost: c.total, kept: val - c.total,
             pct: val ? Math.round((val - c.total) / val * 100) : 0 };
  }

  /* fabric: opening - consumed - reserved = on hand */
  function stockOf(fid) {
    var f = one(D.fabrics, fid); if (!f) return { hand: 0, reserved: 0, store: 0, godown: 0 };
    var reserved = 0;
    D.garments.forEach(function (g) {
      if (HOUSE.indexOf(g.stage) >= HOUSE.indexOf('Cut')) return;
      fabricsOf(g).forEach(function (u) { if (u.fabric === fid) reserved += Number(u.metres) || 0; });
    });
    return { store: f.stock.Store, godown: f.stock.Godown,
             hand: f.stock.Store + f.stock.Godown, reserved: reserved,
             low: (f.stock.Store + f.stock.Godown) <= f.threshold };
  }

  /* ---------- stages ---------- */

  function ladderFor(g) {
    var o = one(D.orders, g.order);
    return (o && o.vertical === 'designer') ? DESIGNER : HOUSE;
  }
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
                   why: f.why, ref: f.ref, route: f.route, level: f.level || 'warn' });
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
        if (o.vertical !== 'designer' || o.stage === 'Delivered') return;
        var gs = by(D.garments, 'order', o.id);
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
    ROUTE_OK: ROUTE_OK, allowed: allowed,
    myOrders: myOrders,
    payableOf: payableOf, payableOn: payableOn, payableGrossOf: payableGrossOf,
    orderMoney: orderMoney, cutsTotal: cutsTotal, addsTotal: addsTotal, garmentSuggest: garmentSuggest, garmentValue: garmentValue, orderLines: orderLines, migrate: migrate, syncValues: syncValues,
    paidOn: paidOn, invoiceDue: invoiceDue, invoiceLeft: invoiceLeft,
    costOf: costOf, marginOf: marginOf, stockOf: stockOf,
    fabricsOf: fabricsOf, metresOf: metresOf, handOver: handOver,
    Q: Q, matches: matches,
    ladderFor: ladderFor, moveGarment: moveGarment, moveOrder: moveOrder, sittingFor: sittingFor,
    runAgents: runAgents,
    windowFor: windowFor, inWindow: inWindow, closedIn: closedIn, targetValue: targetValue,
    commsOn: commsOn, addComm: addComm,
    get D() { return D; },
    VIEWS: {}, ACTIONS: {}
  };
})();
