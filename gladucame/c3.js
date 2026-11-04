/* Glad U Came demo . C3: light money (payments due and received per project, direct costs, team cost per department,
   profit), client approvals ("Waiting for the client" with a drafted chase), Client health with its reasons, the
   Client update agent (weekly drafts a person sends) and the founder dashboard (12 items, one period filter).
   Loads after b5.js and before logins.js. Every figure is worked out from the demo store, never fixed text. */
(function () {
  'use strict';
  var S = window.GUC_SCREENS, d = document;
  var rupees = function (n) { var s = String(Math.round(Math.abs(n))), last = s.slice(-3), rest = s.slice(0, -3); return (n < 0 ? '-' : '') + '₹' + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last; };
  var role = function (A) { return A.me().role; };
  var byId = function (l, id) { return (l || []).filter(function (x) { return x.id === id; })[0]; };
  var sum = function (l, f) { return l.reduce(function (a, x) { return a + (f ? f(x) : x); }, 0); };
  function hist(A, o, what, who) { (o.history = o.history || []).push({ at: A.now(), who: who || A.ME(), what: what }); }
  var MF = function () { return S._mf; }, PJ = function () { return S._pj; };
  var DEPTS = ['BD', 'Influencer', 'PR', 'Celebrity & gifting', 'Events', 'Content', 'Finance'];
  var PERF_DEPTS = ["Founder's office"].concat(DEPTS);
  var SUPPORT = /^(BD|Finance)$/;
  var KINDS = ['Influencer fee', 'Vendor', 'Hamper'];
  var CKINDS = ['Content', 'Plan', 'Deliverable'];
  var slug = function (s) { return String(s).toLowerCase().replace(/[^a-z]/g, ''); };
  var deptBySlug = function (x) { return PERF_DEPTS.filter(function (n) { return slug(n) === x; })[0]; };

  /* ---------------- store (idempotent; runs on every load, after b5's) ---------------- */
  var prevMig = S._migrate;
  S._migrate = function (D, A) {
    var ch = prevMig ? prevMig(D, A) : false;
    if (!D.c3) { seed(D, A); ch = true; }
    var shift = A.daysBetween(D.c3.day, A.TODAY);   /* a demo opened another day reads the same */
    if (shift) {
      var sd = function (x) { return x ? A.addDays(x, shift) : x; };
      D.pay.forEach(function (p) { p.due = sd(p.due); p.recv.forEach(function (r) { r.on = sd(r.on); }); });
      D.costs.forEach(function (c) { c.on = sd(c.on); });
      D.capprs.forEach(function (c) { c.sent = sd(c.sent); if (c.decided) c.decided = sd(c.decided); });
      D.projects.forEach(function (p) { p.start = sd(p.start); if (p.end) p.end = sd(p.end); });
      D.brands.forEach(function (b) { b.contact = sd(b.contact); });
      D.c3.day = A.TODAY; ch = true;
    }
    if (sweep(A, D)) ch = true;
    return ch;
  };
  function seed(D, A) {
    var day = function (n) { return A.addDays(A.TODAY + 'T00:00', n).slice(0, 10); };
    D.c3 = { day: A.TODAY };
    D.settings.c3 = { contactDays: 7, retainerDays: 30, stuckDays: 3,
      team: { BD: 180000, Influencer: 260000, PR: 220000, 'Celebrity & gifting': 120000, Events: 150000, Content: 110000, Finance: 90000 } };
    /* payout leftovers out (MOU v3): the Payout approval type, payout records, invoices and their tasks */
    var gone = {}; (D.approvals || []).forEach(function (a) { if (a.type === 'Payout') gone[a.id] = 1; });
    D.approvals = (D.approvals || []).filter(function (a) { return !gone[a.id]; });
    D.approvals.forEach(function (a) { if (a.type === 'Expense') a.type = 'Vendor cost'; });
    var RN = { 'Review the October retainer invoices with Farhan': 'Review the retainer payments due with Farhan', 'Raise the Bombay Brew October invoice': 'Ask Bombay Brew for the November retainer payment',
      'Clear 4 influencer payouts for Kora': 'Record 4 influencer fees for Kora as direct costs', 'Influencer invoices and PAN for payouts': 'Influencer fee agreements and PAN on file', 'Request payouts with invoices': 'Record influencer fees as direct costs' };
    D.tasks = D.tasks.filter(function (t) { return !gone[t.appr] && !t.payout; });
    D.tasks.forEach(function (t) {
      if (RN[t.title]) t.title = RN[t.title];
      t.title = t.title.replace(/^Raise the payout for (\S+), /, 'Record the fee for $1 as a direct cost, ').replace(/^Decide: Expense, /, 'Decide: Vendor cost, ');
    });
    Object.keys(D.settings.tpl || {}).forEach(function (n) { D.settings.tpl[n].forEach(function (s) { if (RN[s[0]]) s[0] = RN[s[0]]; }); });
    D.projects.forEach(function (p) { if (p.stage === 'Payouts cleared') p.stage = 'Fees recorded'; (p.lines || []).forEach(function (x) { delete x.payout; if (x.cost === undefined) x.cost = ''; }); });
    delete D.invoices; delete D.payouts; delete D.seqV; delete D.seqPO; delete D.seqNo;
    /* projects: start, retainer end */
    var ST = { P1: -25, P2: -34, P3: -40, P4: -15, P5: -3, P6: -70 };
    D.projects.forEach(function (p) { if (ST[p.id] != null) p.start = day(ST[p.id]); if (!p.start) p.start = A.TODAY; });
    var p2 = byId(D.projects, 'P2'); if (p2) p2.end = day(20);
    /* payments due per project, received against them (sample) */
    D.pay = []; D.seqPY = 0;
    var mk = function (pid, what, amt, due, recv) { var p = byId(D.projects, pid); if (!p) return;
      var y = { id: 'PY' + (++D.seqPY), project: pid, what: what, amount: amt, due: day(due), recv: (recv || []).map(function (r) { return { on: day(r[0]), amount: r[1], ref: r[2], by: 'farhan' }; }),
        history: [{ at: day(Math.min(due, 0) - 5) + 'T11:00', who: 'farhan', what: 'Payment due set: ' + what + ', ' + rupees(amt) + ', due ' + A.dayWord(day(due) + 'T00:00') }] };
      y.recv.forEach(function (r) { y.history.push({ at: r.on + 'T15:30', who: 'farhan', what: rupees(r.amount) + ' received, ref ' + r.ref }); });
      D.pay.push(y); };
    mk('P1', 'Advance, 50%', 400000, -20, [[-18, 400000, 'UTR HDFC0081123']]); mk('P1', 'Balance, on the report', 400000, 15);
    mk('P2', 'October retainer', 150000, -30, [[-27, 150000, 'UTR ICIC0045510']]); mk('P2', 'November retainer', 150000, -2, [[-1, 150000, 'UTR ICIC0047720']]);
    mk('P3', 'Advance, 50%', 250000, -35, [[-33, 200000, 'UTR SBIN0017744']]); mk('P3', 'Balance, after the launch', 250000, 10);
    mk('P4', 'Full fee', 260000, -10, [[-2, 100000, 'UPI 4410 2291']]);
    mk('P5', 'Full fee', 140000, 12);
    mk('P6', 'Advance, 50%', 190000, -65, [[-60, 190000, 'UTR KKBK0033120']]); mk('P6', 'Balance, after the preview', 190000, -40);
    /* direct costs (influencer fees and vendors; hampers come from Gifting) */
    D.costs = []; D.seqDC = 0;
    [['P1', 'Influencer fee', '@bandra.bites', 'Fee for @bandra.bites, teaser reel', 45000, -6], ['P4', 'Vendor', 'Northstar Management', 'Celebrity management fee', 60000, -9],
      ['P5', 'Vendor', 'Lens & Light Studio', 'Photography for the reels', 18000, -2], ['P3', 'Vendor', 'Blue Frog Venues', 'Venue deposit, store launch', 120000, -20],
      ['P5', 'Vendor', 'Prop House Andheri', 'Props for the reel shoot', 6500, -4], ['P2', 'Vendor', 'Print Shop Lower Parel', 'Press kit printing', 14000, -10],
      ['P6', 'Vendor', 'Kala Ghoda Studio', 'Preview venue', 35000, -12]].forEach(function (c) {
      var x = addCost(A, { project: c[0], kind: c[1], who: c[2], what: c[3], amount: c[4], quiet: true }); x.on = day(c[5]); x.history[0].at = x.on + 'T12:00'; x.history[0].who = 'farhan';
      if (c[1] === 'Influencer fee') { var p = byId(D.projects, c[0]), ln = p && (p.lines || []).filter(function (l) { return l.h === c[2]; })[0]; if (ln) ln.cost = x.id; }
    });
    /* waiting for the client (sample) */
    D.capprs = []; D.seqCA = 0;
    [['P1', 'Content', 'Teaser reel from @thanekitchen', -4, 'kabir', 'Waiting'], ['P5', 'Plan', 'November content calendar, 12 posts', -6, 'neha', 'Waiting'],
      ['P6', 'Deliverable', 'Press preview invite and press note', -1, 'ananya', 'Waiting'], ['P2', 'Content', 'October coverage report', -3, 'ananya', 'Approved']].forEach(function (c) {
      var p = byId(D.projects, c[0]); if (!p) return;
      var x = { id: 'CA' + (++D.seqCA), project: c[0], kind: c[1], what: c[2], sent: day(c[3]) + 'T11:00', owner: c[4], status: c[5], chases: [], decided: c[5] === 'Approved' ? day(c[3] + 2) + 'T16:00' : '',
        history: [{ at: day(c[3]) + 'T11:00', who: c[4], what: 'Sent to ' + p.brand + ' for sign-off' }] };
      if (x.decided) x.history.push({ at: x.decided, who: c[4], what: p.brand + ' approved it' });
      D.capprs.push(x);
    });
    /* last contact with each client */
    var CT = { 'Kora Skincare': -1, 'Bombay Brew Co.': -2, 'Monsoon Activewear': -3, 'Dadar Silk House': -1, 'Bandra Book Cafe': -12, 'Kalaghoda Arts Fest': -4 };
    D.brands.forEach(function (b) { b.contact = day(CT[b.name] != null ? CT[b.name] : -2); });
    D.cupd = []; D.seqCU = 0;
    /* G2: lead History carries the stage moves (Proposal sent, Won, Lost), and older closed leads give every owner a win rate */
    var LOSTW = { 'Coastal Linen Co.': 'Budget moved to next quarter', 'Matunga Filter Coffee': 'Went with another agency' };
    var off = [-1, -3, -9, -15, -22, -30, -2, -12, -18, -26], k = 0;
    D.leads.forEach(function (l) {
      var at = function (n) { return A.addDays(A.TODAY + 'T15:00', n); }, o;
      if (/^(Proposal sent|Negotiation|Won)$/.test(l.stage) && !l.history.some(function (h) { return / to Proposal sent(\.|$)/.test(h.what); })) { o = off[k++ % off.length]; l.history.push({ at: at(o - 6), who: l.owner, what: 'Moved from Discovery call to Proposal sent' }); }
      if (l.stage === 'Won' && !l.history.some(function (h) { return / to Won(\.|$)/.test(h.what); })) l.history.push({ at: at({ 'Bombay Brew Co.': -20, 'Bandra Book Cafe': -2, 'Dadar Silk House': -12 }[l.brand] || -5), who: l.owner, what: 'Moved from Negotiation to Won' });
      if (l.stage === 'Lost / Nurture' && !l.lost) l.lost = LOSTW[l.brand] || 'Not a fit';
      if (l.stage === 'Lost / Nurture' && !l.history.some(function (h) { return / to Lost/.test(h.what); })) l.history.push({ at: at(-25), who: l.owner, what: 'Moved from Contacted to Lost / Nurture. Reason: ' + l.lost });
    });
    var BY = { 'Fort Heritage Hotel': 'maddie', 'Marine Drive Motors': 'maddie', 'Lower Parel Lofts': 'maddie', 'Kora Skincare': 'kabir', 'Kalaghoda Arts Fest': 'ananya', 'Bombay Brew Co.': 'ananya',
      'Dadar Silk House': 'zoya', 'Malabar Hill Florist': 'zoya', 'Powai Founders Meetup': 'arjun', 'Bandra Book Cafe': 'neha', 'Khar Kitchen Studio': 'neha', 'Sion Sneaker Co.': 'kabir', 'Versova Surf Club': 'riya', 'Goregaon Game Arena': 'riya' };
    D.leads.forEach(function (l) { if (BY[l.brand]) l.by = BY[l.brand]; });
    var cnt = {}, k2 = 0, TO = ['maddie', 'kabir', 'zoya', 'neha', 'ananya', 'arjun'];   /* G2: BD brings the most, but not everything */
    D.leads.forEach(function (l) { cnt[l.by] = (cnt[l.by] || 0) + 1; if (/^(riya|ishaan)$/.test(l.by) && cnt[l.by] > 8) { cnt[l.by]--; l.by = TO[k2++ % TO.length]; cnt[l.by] = (cnt[l.by] || 0) + 1; } });
    [['Hill Road Denim', 'Rahul Khanna', 'instagram', 'Won', 'riya', 4.0, 'riya', '', -70, -45, 'Influencer campaign'], ['Breach Candy Bakers', 'Shreya Kulkarni', 'web', 'Lost / Nurture', 'riya', 1.2, 'maddie', 'Budget moved to next quarter', -60, -41, 'Influencer campaign'],
      ['Ghatkopar Gym Co.', 'Amol Patil', 'meta', 'Won', 'ishaan', 1.8, 'ishaan', '', -66, -38, 'Content'], ['Vile Parle Snacks', 'Neha Desai', 'whatsapp', 'Lost / Nurture', 'ishaan', 0.9, 'ishaan', 'Went with another agency', -58, -40, 'Influencer campaign'],
      ['Bandra Bloom Florals', 'Ira Mehta', 'instagram', 'Lost / Nurture', 'kabir', 2.1, 'ishaan', 'No reply after 3 follow-ups', -62, -37, 'Influencer campaign'], ['Juhu Beach Resort', 'Farid Shaikh', 'gmail', 'Won', 'kabir', 6.5, 'riya', '', -75, -36, 'Influencer campaign'],
      ['Worli Art House', 'Tanya Bose', 'gmail', 'Won', 'ananya', 2.4, 'maddie', '', -68, -39, 'PR project'], ['Powai Tech Summit', 'Kiran Rao', 'web', 'Lost / Nurture', 'arjun', 4.5, 'riya', 'Not a fit', -55, -42, 'Event'],
      ['Mahalaxmi Racecourse Gala', 'Dinesh Shah', 'gmail', 'Won', 'arjun', 7.0, 'arjun', '', -72, -44, 'Event'], ['Kurla Kitchen Co.', 'Pankaj Jain', 'web', 'Lost / Nurture', 'neha', 1.0, 'neha', 'Budget moved to next quarter', -50, -38, 'Content'],
      ['Sewri Spice Co.', 'Lata Rao', 'whatsapp', 'Lost / Nurture', 'zoya', 1.6, 'zoya', 'Went with another agency', -64, -43, 'Celebrity gifting'], ['Andheri Eats Festival', 'Mihir Shah', 'meta', 'Won', 'riya', 3.2, 'ishaan', '', -57, -35, 'Event']].forEach(function (x) {
      if (D.leads.some(function (l) { return l.brand === x[0]; })) return;
      var cr = A.addDays(A.TODAY + 'T10:30', x[8]), cl = A.addDays(A.TODAY + 'T16:00', x[9]);
      D.leads.push({ id: 'L' + (++D.seqL), brand: x[0], contact: x[1], ch: x[2], stage: x[3], owner: x[4], value: x[5], by: x[6], lost: x[7], interest: x[10], created: cr, next: '', mobile: '', insta: '', email: '', dup: null, thread: [],
        lastUs: '', lastThem: '', frt: 20 + (D.seqL * 37) % 140, asked: '', shift: 0, checkin: '', close: '', svc: { tag: x[10], why: 'Confirmed by ' + A.P[x[4]].name, ok: true }, pricing: 'Approved', old: true,
        history: [{ at: cr, who: 'agent', what: 'Lead catcher: new lead, given to ' + A.P[x[4]].name }, { at: A.addDays(cl, -8), who: x[4], what: 'Moved from Discovery call to Proposal sent' },
          { at: cl, who: x[4], what: 'Moved from Proposal sent to ' + x[3] + (x[7] ? '. Reason: ' + x[7] : '') }] });
    });
    /* G3: missed follow-ups dated when they became missed */
    (D.missed || []).forEach(function (m) { if (S._missAt) m.at = S._missAt(A, m.key); });
  }
  function addCost(A, o) {
    var D = A.D(), x = { id: 'DC' + (++D.seqDC), project: o.project, kind: o.kind, who: o.who || '', what: o.what, amount: o.amount, on: A.TODAY, by: A.ME() || 'farhan', history: [] };
    hist(A, x, 'Direct cost recorded: ' + o.what + ', ' + rupees(o.amount), x.by); D.costs.push(x);
    var p = byId(D.projects, o.project); if (p && !o.quiet) hist(A, p, 'Direct cost: ' + o.what + ', ' + rupees(o.amount));
    return x;
  }

  /* ---------------- the money engine ---------------- */
  var C3 = function (A) { return A.D().settings.c3; };
  var recvOf = function (y) { return sum(y.recv, function (r) { return r.amount; }); };
  var leftOf = function (y) { return y.amount - recvOf(y); };
  var lateBy = function (A, y) { return leftOf(y) > 0 && y.due < A.TODAY ? A.daysBetween(y.due, A.TODAY) : 0; };
  var payWord = function (A, y) { var l = leftOf(y), n = lateBy(A, y); return !l ? ['Received', 'chip--green'] : n ? ['Overdue ' + n + ' day' + (n === 1 ? '' : 's'), 'chip--red'] : recvOf(y) ? ['Part received', 'chip--amber'] : ['Due ' + A.low(A.dayWord(y.due + 'T00:00')), '']; };
  var hampersOf = function (A, pid) { return (A.D().hampers || []).filter(function (h) { return h.project === pid; }); };
  function costsOf(A, pid) {   /* R-119: approved influencer fees + vendor costs + hamper values */
    return A.D().costs.filter(function (c) { return c.project === pid; }).map(function (c) { return { kind: c.kind, what: c.what, who: c.who, amount: c.amount, on: c.on, o: c }; })
      .concat(hampersOf(A, pid).map(function (h) { return { kind: 'Hamper', what: h.no + ', ' + h.rec, who: h.rec, amount: h.value, on: h.delivered || '', h: h }; }));
  }
  var dcOf = function (A, pid) { return sum(costsOf(A, pid), function (c) { return c.amount; }); };
  var feeOf = function (p) { return Math.round((p.fee || 0) * 1e5); };
  var startOf = function (A, p) { return p.start || A.TODAY; };
  /* the money a person may see: Founder and Finance all, a department head their department, nobody else */
  var seesMoney = function (A) { return /^(Founder|Finance|Department head)$/.test(role(A)); };
  var myDepts = function (A) { return role(A) === 'Department head' ? [A.me().dept] : DEPTS; };
  var projOk = function (A, p) { return myDepts(A).indexOf(p.dept) >= 0; };

  /* ---------------- the period (one filter for the whole page) ---------------- */
  var PER = { k: 'month', from: '', to: '' };
  function period(A) {
    var t = A.TODAY, y = +t.slice(0, 4), m = +t.slice(5, 7), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    if (PER.k === 'quarter') { var q = Math.floor((m - 1) / 3) * 3 + 1; return { from: y + '-' + pad(q) + '-01', to: t, word: 'this quarter' }; }
    if (PER.k === 'custom') { var f = PER.from || t.slice(0, 8) + '01', e = PER.to || t; return { from: f, to: e, word: A.dayWord(f + 'T00:00') + ' to ' + A.dayWord(e + 'T00:00') }; }
    return { from: t.slice(0, 8) + '01', to: t, word: 'this month' };
  }
  var inP = function (P, dy) { return !!dy && dy.slice(0, 10) >= P.from && dy.slice(0, 10) <= P.to; };
  function months(P) {   /* whole months the period touches, never split by the day (trap 35) */
    var a = +P.from.slice(0, 4) * 12 + +P.from.slice(5, 7), b = +P.to.slice(0, 4) * 12 + +P.to.slice(5, 7); return Math.max(1, b - a + 1);
  }
  function perBar(A) {
    return '<div class="filters" data-period><label class="label" for="c3-per">Period</label><select class="select" id="c3-per" data-c3per aria-label="Period">' +
      [['month', 'This month'], ['quarter', 'This quarter'], ['custom', 'Custom dates']].map(function (o) { return '<option value="' + o[0] + '"' + (PER.k === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
      (PER.k === 'custom' ? '<label class="sr-only" for="c3-from">From</label><input class="input" type="date" id="c3-from" data-c3from value="' + period(A).from + '" aria-label="From"><label class="sr-only" for="c3-to">To</label><input class="input" type="date" id="c3-to" data-c3to value="' + period(A).to + '" aria-label="To">' : '') +
      '<span class="faint">Every figure on this page counts ' + A.esc(period(A).word) + '.</span></div>';
  }
  d.addEventListener('change', function (e) {
    var el = e.target, A = window.GUC_APP; if (!el.hasAttribute) return;
    if (el.hasAttribute('data-c3per')) { PER.k = el.value; if (el.value === 'custom' && !PER.from) { PER.from = A.TODAY.slice(0, 8) + '01'; PER.to = A.TODAY; } A.render(); }
    if (el.hasAttribute('data-c3from')) { PER.from = el.value; A.render(); }
    if (el.hasAttribute('data-c3to')) { PER.to = el.value; A.render(); }
  });

  /* revenue generated: fees of projects started in the period; the person is who brought the brand in */
  function personOf(A, p) { var l = A.D().leads.filter(function (x) { return x.brand === p.brand; })[0]; return (l && (l.by || l.owner)) || p.poc; }
  /* C4 H1: a retainer (PR retainer, Social media management) earns its monthly fee in every month it runs inside the period;
     a one-off project earns its fee in the period it started. Whole months, never split by the day (trap 35). */
  var isRet = function (p) { return /^(PR retainer|Social media management)$/.test(p.template); };
  function monthsOn(A, p, P) { var s = startOf(A, p) > P.from ? startOf(A, p) : P.from, e = p.end && p.end < P.to ? p.end : P.to; return s > e ? 0 : months({ from: s, to: e }); }
  function revOf(A, p, P) { return isRet(p) ? feeOf(p) * monthsOn(A, p, P) : inP(P, startOf(A, p)) ? feeOf(p) : 0; }
  function dcIn(A, p, P) { return isRet(p) ? sum(costsOf(A, p.id).filter(function (c) { return inP(P, c.on); }), function (c) { return c.amount; }) : inP(P, startOf(A, p)) ? dcOf(A, p.id) : 0; }
  function revRows(A, P) { return A.D().projects.map(function (p) { return { p: p, amt: revOf(A, p, P), svc: p.template, who: personOf(A, p), n: isRet(p) ? monthsOn(A, p, P) : 0 }; }).filter(function (r) { return r.amt > 0; }); }
  function receipts(A, P) { var out = []; A.D().pay.forEach(function (y) { y.recv.forEach(function (r) { if (inP(P, r.on)) out.push({ y: y, r: r }); }); }); return out; }
  function deptProfit(A, P, dept) {
    var ps = A.D().projects.filter(function (p) { return p.dept === dept && (revOf(A, p, P) > 0 || dcIn(A, p, P) > 0); });
    var rev = sum(ps, function (p) { return revOf(A, p, P); }), dc = sum(ps, function (p) { return dcIn(A, p, P); }), tc = (C3(A).team[dept] || 0) * months(P);
    return { dept: dept, ps: ps, rev: rev, dc: dc, tc: tc, pf: rev - dc - tc };
  }
  function profitTable(A, P, depts, attr) {
    var R = depts.map(function (x) { return deptProfit(A, P, x); }), T = { rev: sum(R, function (r) { return r.rev; }), dc: sum(R, function (r) { return r.dc; }), tc: sum(R, function (r) { return r.tc; }) }; T.pf = T.rev - T.dc - T.tc;
    var C = 'minmax(0,1.4fr) repeat(4,minmax(0,1fr))', cell = function (v, k, href, sup) { return '<a class="num money' + (k === 'pf' && v < 0 && !sup ? ' t-red' : '') + '" data-c="' + k + '" data-v="' + v + '" href="' + href + '" style="text-align:right;color:inherit">' + rupees(v) + '</a>'; };
    return '<div class="list" data-profit' + (attr || '') + '><div class="lrow label" style="--cols:' + C + '"><span>Department</span><span style="text-align:right">Revenue</span><span style="text-align:right">Direct costs</span><span style="text-align:right">Team cost</span><span style="text-align:right">Profit</span></div>' +
      R.map(function (r) { var h = '#/dash/f/rev/d-' + slug(r.dept); return '<div class="lrow" data-prow="' + A.esc(r.dept) + '" style="--cols:' + C + '"><b>' + A.esc(r.dept) + '</b>' + cell(r.rev, 'rev', h) + cell(r.dc, 'dc', '#/money/costs') + cell(r.tc, 'tc', role(A) === 'Founder' ? '#/settings/clients' : '#/money/profit') + cell(r.pf, 'pf', h, SUPPORT.test(r.dept)) + '</div>'; }).join('') +
      (R.length > 1 ? '<div class="lrow" data-ptotal style="--cols:' + C + ';font-weight:600"><span>Total</span>' + cell(T.rev, 'rev', '#/dash/f/rev') + cell(T.dc, 'dc', '#/money/costs') + cell(T.tc, 'tc', '#/money/profit') + cell(T.pf, 'pf', '#/dash/f/rev') + '</div>' : '') + '</div>' +
      '<p class="f-help">Profit = revenue (fees of projects started ' + A.esc(P.word) + ', plus each retainer\'s monthly fee for every month it runs ' + A.esc(P.word) + ') less their direct costs (influencer fees, vendors, hampers) less the department\'s team cost (' + months(P) + ' month' + (months(P) === 1 ? '' : 's') + ' x the monthly figure in Settings). BD and Finance earn no client fees of their own, so they show their team cost only.</p>';
  }

  /* ---------------- client approvals + client health ---------------- */
  var ageOf = function (A, c) { return A.daysBetween(c.sent.slice(0, 10), A.TODAY); };
  var capprWaiting = function (A) { return A.D().capprs.filter(function (c) { return c.status === 'Waiting'; }).sort(function (a, b) { return a.sent < b.sent ? -1 : 1; }); };
  var brandProjects = function (A, b) { return A.D().projects.filter(function (p) { return p.brand === b.name; }); };
  function reasons(A, b) {
    var D = A.D(), K = C3(A), ps = brandProjects(A, b), ids = ps.map(function (p) { return p.id; }), out = [];
    var late = D.tasks.filter(function (t) { return ids.indexOf(t.link) >= 0 && A.isOverdue(t) && A.daysBetween(t.due.slice(0, 10), A.TODAY) >= 2; });   /* same 2-day line as project health (B5) */
    if (late.length) out.push({ k: 'late', t: late.length + ' deliverable' + (late.length === 1 ? '' : 's') + ' overdue 2 days or more' });
    var st = D.capprs.filter(function (c) { return ids.indexOf(c.project) >= 0 && c.status === 'Waiting' && ageOf(A, c) >= K.stuckDays; });
    if (st.length) out.push({ k: 'appr', t: st.length + ' client approval' + (st.length === 1 ? '' : 's') + ' waiting ' + Math.max.apply(null, st.map(function (c) { return ageOf(A, c); })) + ' days' });
    var po = D.pay.filter(function (y) { return ids.indexOf(y.project) >= 0 && lateBy(A, y); });
    if (po.length) out.push({ k: 'pay', t: 'Payment of ' + rupees(sum(po, leftOf)) + ' overdue ' + Math.max.apply(null, po.map(function (y) { return lateBy(A, y); })) + ' days' });
    var nc = b.contact ? A.daysBetween(b.contact.slice(0, 10), A.TODAY) : 99;
    if (nc >= K.contactDays) out.push({ k: 'contact', t: 'No contact for ' + nc + ' days' });
    var rt = ps.filter(function (p) { return p.end && A.daysBetween(A.TODAY, p.end) >= 0 && A.daysBetween(A.TODAY, p.end) <= K.retainerDays; });
    if (rt.length) out.push({ k: 'retainer', t: 'Retainer ends ' + A.low(A.dayWord(rt[0].end + 'T00:00')) + ', in ' + A.daysBetween(A.TODAY, rt[0].end) + ' days' });
    return out;
  }
  var liveBrands = function (A) { return A.D().brands.filter(function (b) { return brandProjects(A, b).some(function (p) { return p.stage !== 'Closed'; }); }); };
  var atRisk = function (A) { return liveBrands(A).filter(function (b) { return reasons(A, b).length; }); };
  var canSeeProj = function (A, p) { var r = role(A), me = A.ME(); return r === 'Founder' || (r === 'Department head' && (PJ().headOf(A, p.dept) === me || p.team.indexOf(me) >= 0)) || (r === 'Team member' && p.team.indexOf(me) >= 0); };

  /* ---------------- the Client update agent: one weekly draft per live project ---------------- */
  function monday(A) { var t = new Date(A.TODAY + 'T12:00'), k = (t.getDay() + 6) % 7; return A.addDays(A.TODAY + 'T00:00', -k).slice(0, 10); }
  function updParts(A, p) {
    var D = A.D(), wk = monday(A), nx = A.addDays(A.TODAY + 'T00:00', 7).slice(0, 10);
    var done = D.tasks.filter(function (t) { return t.link === p.id && (t.status === 'done' || t.status === 'check') && t.done_at && t.done_at.slice(0, 10) >= wk; }).map(function (t) { return t.title; });
    var next = D.tasks.filter(function (t) { return t.link === p.id && A.OPEN[t.status] && t.due.slice(0, 10) <= nx; }).slice(0, 4).map(function (t) { return t.title; });
    var need = D.capprs.filter(function (c) { return c.project === p.id && c.status === 'Waiting'; }).map(function (c) { return 'your sign-off on ' + c.what; })
      .concat(D.pay.filter(function (y) { return y.project === p.id && leftOf(y) > 0 && y.due <= nx; }).map(function (y) { return 'the ' + y.what.toLowerCase() + ' payment of ' + rupees(leftOf(y)) + (lateBy(A, y) ? ', due ' + A.low(A.dayWord(y.due + 'T00:00')) : ''); }));
    return { done: done, next: next, need: need };
  }
  function updText(A, p, u) {
    var b = byId(A.D().brands, p.bid), l = A.D().leads.filter(function (x) { return x.brand === p.brand; })[0], nm = l && !/^@/.test(l.contact) ? l.contact.split(' ')[0] : 'team', x = updParts(A, p);
    var li = function (L, e) { return L.length ? L.map(function (s) { return '- ' + s; }).join('\n') : '- ' + e; };
    return 'Hi ' + nm + ', your weekly update on ' + p.name + ' from Glad U Came.\n\nDone this week:\n' + li(x.done, 'Work in progress, nothing closed yet this week') + '\n\nNext:\n' + li(x.next, 'Planning the next steps, we will share them on our call') +
      '\n\nWhat we need from you:\n' + li(x.need, 'Nothing right now') + '\n\nThanks, ' + A.first(p.poc) + (b ? '' : '');
  }
  var updOf = function (A, p) { var wk = monday(A); return A.D().cupd.filter(function (u) { return u.project === p.id && u.week === wk; })[0]; };
  function sweep(A, D) {
    var ch = false, wk = monday(A);
    D.projects.forEach(function (p) {
      if (p.stage === 'Closed' || D.cupd.some(function (u) { return u.project === p.id && u.week === wk; })) return;
      D.cupd.push({ id: 'CU' + (++D.seqCU), project: p.id, week: wk, status: 'Draft', text: '', at: A.now(), history: [{ at: A.now(), who: 'agent', what: 'Client update agent drafted the weekly note. ' + A.P[p.poc].name + ' checks it and sends it.' }] });
      D.notes.push({ to: p.poc, text: 'Client update agent: the weekly note for ' + p.brand + ' is drafted. Check it and send it.', at: A.now(), kind: 'internal', unread: true });
      ch = true;
    });
    return ch;
  }

  /* ---------------- shared bits ---------------- */
  var tile = function (A, n, l, i, fig, sub, href, alert) {
    return '<a class="tile' + (alert ? ' tile--alert' : '') + '" href="' + href + '" data-fig data-item="' + n + '" style="text-decoration:none;color:inherit"><span class="tile-top"><span class="label">' + l + '</span><span class="tile-ico">' + A.ico(i) + '</span></span><span class="fig num">' + fig + '</span><span class="tile-sub">' + sub + '</span></a>';
  };
  var card = function (title, sub, body, attr) { return '<div class="card"' + (attr || '') + ' style="display:flex;flex-direction:column;gap:var(--s-2)"><div class="card-head"><h2 class="h-sec">' + title + '</h2>' + (sub ? '<span class="label">' + sub + '</span>' : '') + '</div>' + body + '</div>'; };
  var none = function (t) { return '<p class="faint">' + t + '</p>'; };
  var lnk = function (href, v, txt, k) { return '<a class="num" href="' + href + '" data-c="' + (k || '') + '" data-v="' + v + '" style="text-align:right;color:inherit">' + txt + '</a>'; };
  var ppl = function (A) { return A.ORDER; };
  var deptOfP = function (A, id) { return A.P[id].role === 'Founder' ? "Founder's office" : A.P[id].dept; };
  function taskStats(A, P, ids) {
    var D = A.D(), now = A.now();
    var due = D.tasks.filter(function (t) { return ids.indexOf(t.owner) >= 0 && inP(P, t.due) && t.due <= now; });
    var ok = due.filter(function (t) { return (t.status === 'done' || t.status === 'check') && (!t.done_at || t.done_at <= t.due); });
    var lateL = due.filter(function (t) { return ok.indexOf(t) < 0; }), dl = lateL.map(function (t) { var e = t.done_at && !A.OPEN[t.status] ? t.done_at : now; return Math.max(0, (new Date(e) - new Date(t.due)) / 864e5); });
    return { due: due, ok: ok, pct: due.length ? Math.round(ok.length / due.length * 100) : null, over: D.tasks.filter(function (t) { return ids.indexOf(t.owner) >= 0 && A.isOverdue(t); }),
      delay: dl.length ? Math.round(sum(dl) / dl.length * 10) / 10 : 0, open: D.tasks.filter(function (t) { return ids.indexOf(t.owner) >= 0 && A.OPEN[t.status]; }) };
  }
  var idsOfDept = function (A, dept) { return ppl(A).filter(function (id) { return deptOfP(A, id) === dept; }); };
  var propsIn = function (A, P) { return A.D().leads.filter(function (l) { return l.history.some(function (h) { return / to Proposal sent(\.|$)/.test(h.what) && inP(P, h.at); }); }); };
  var wonIn = function (A, P) { return A.D().leads.filter(function (l) { return l.stage === 'Won' && l.history.some(function (h) { return / to Won(\.|$)/.test(h.what) && inP(P, h.at); }); }); };
  var leadsIn = function (A, P) { return A.D().leads.filter(function (l) { return inP(P, l.created); }); };
  var campsRunning = function (A) { return A.D().projects.filter(function (p) { return p.template === 'Influencer campaign' && p.stage !== 'Closed'; }); };

  /* ---------------- the founder dashboard ---------------- */
  S._fd = function (A) {
    var D = A.D(), P = period(A), b = S._briefData(A), rv = revRows(A, P), rc = receipts(A, P), ov = D.tasks.filter(A.isOverdue), ca = capprWaiting(A), risk = atRisk(A), camps = campsRunning(A);
    var lw = PER.k === 'month' ? 'Total leads this month' : PER.k === 'quarter' ? 'Total leads this quarter' : 'Total leads, ' + P.word;
    var brief = '<section class="card" data-brief-top style="display:flex;flex-wrap:wrap;gap:var(--s-3);align-items:center"><div style="flex:1;min-width:260px"><h2 class="h-sec">Morning brief</h2><p class="lede" style="margin:0">For the 9:30 meeting: <b>' + b.done.length + ' done since yesterday, ' + b.due.length + ' due today, ' + b.over.length + ' overdue, ' + b.chk.length + ' waiting for check, ' + b.dec.length + ' decisions needed.</b></p></div>' +
      '<a class="btn" href="#/brief">' + A.ico('sparkles') + 'Open the brief</a><button class="btn btn--next" type="button" data-do="wa">' + A.ico('brand-whatsapp') + 'Send on WhatsApp</button></section>';
    var bySvc = {}, byWho = {}; rv.forEach(function (r) { bySvc[r.svc] = (bySvc[r.svc] || 0) + r.amt; byWho[r.who] = (byWho[r.who] || 0) + r.amt; });
    var revT = sum(rv, function (r) { return r.amt; }), recT = sum(rc, function (x) { return x.r.amount; });
    var svcIdx = Object.keys(window.GUC_TEMPLATES || {});
    var split = '<div class="brief" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">' +
      card('Revenue generated by service', A.esc(P.word), Object.keys(bySvc).length ? '<div class="list" data-rev-svc>' + Object.keys(bySvc).map(function (s) { return '<div class="lrow" style="--cols:minmax(0,1fr) auto"><span>' + A.esc(s) + '</span>' + lnk('#/dash/f/rev/s-' + svcIdx.indexOf(s), bySvc[s], rupees(bySvc[s])) + '</div>'; }).join('') + '<div class="lrow" style="--cols:minmax(0,1fr) auto;font-weight:600"><span>Total</span>' + lnk('#/dash/f/rev', revT, rupees(revT)) + '</div></div>' : none('No project started ' + A.esc(P.word) + '.')) +
      card('Revenue generated by person', 'Who brought the brand in', Object.keys(byWho).length ? '<div class="list" data-rev-person>' + Object.keys(byWho).map(function (w) { return '<div class="lrow" style="--cols:minmax(0,1fr) auto"><span class="cell-who">' + A.avatar(w) + '<b>' + A.esc(A.P[w].name) + '</b></span>' + lnk('#/dash/f/rev/p-' + w, byWho[w], rupees(byWho[w])) + '</div>'; }).join('') + '<div class="lrow" style="--cols:minmax(0,1fr) auto;font-weight:600"><span>Total</span>' + lnk('#/dash/f/rev', revT, rupees(revT)) + '</div></div>' : none('No project started ' + A.esc(P.word) + '.')) + '</div>';
    /* 6 department-wise performance */
    var DC = 'minmax(0,1.4fr) repeat(6,minmax(0,1fr))', dTot = { due: 0, ok: 0, over: 0, rev: 0, camp: 0 };
    var dRows = PERF_DEPTS.map(function (dp) {
      var s = taskStats(A, P, idsOfDept(A, dp)), rev = sum(rv.filter(function (r) { return r.p.dept === dp; }), function (r) { return r.amt; }), camp = D.projects.filter(function (p) { return p.dept === dp && p.stage !== 'Closed'; }).length, sl = slug(dp);
      dTot.due += s.due.length; dTot.ok += s.ok.length; dTot.over += s.over.length; dTot.rev += rev; dTot.camp += camp;
      return '<div class="lrow" data-drow="' + A.esc(dp) + '" style="--cols:' + DC + '"><b>' + A.esc(dp) + '</b>' + lnk('#/dash/f/due/d-' + sl, s.due.length, s.due.length, 'due') + lnk('#/dash/f/ontime/d-' + sl, s.ok.length, s.ok.length, 'ok') +
        lnk('#/dash/f/ontime/d-' + sl, s.pct == null ? '' : s.pct, s.pct == null ? 'No tasks due' : s.pct + '%', 'pct') + lnk('#/dash/f/over/d-' + sl, s.over.length, '<span class="' + (s.over.length ? 't-red' : '') + '">' + s.over.length + '</span>', 'over') +
        lnk('#/dash/f/rev/d-' + sl, rev, rupees(rev), 'rev') + lnk('#/dash/f/projects/d-' + sl, camp, camp, 'camp') + '</div>';
    }).join('');
    var perf = card('Department-wise performance', A.esc(P.word) + '. Overdue and running are as of now', '<div class="list" data-item="6" data-deptperf><div class="lrow label" style="--cols:' + DC + '"><span>Department</span>' + ['Tasks due', 'Done on time', 'On time', 'Overdue now', 'Revenue', 'Projects running'].map(function (h) { return '<span style="text-align:right">' + h + '</span>'; }).join('') + '</div>' + dRows +
      '<div class="lrow" data-dtotal style="--cols:' + DC + ';font-weight:600"><span>Total</span>' + lnk('#/dash/f/due', dTot.due, dTot.due, 'due') + lnk('#/dash/f/ontime', dTot.ok, dTot.ok, 'ok') + lnk('#/dash/f/ontime', dTot.due ? Math.round(dTot.ok / dTot.due * 100) : '', dTot.due ? Math.round(dTot.ok / dTot.due * 100) + '%' : 'No tasks due', 'pct') +
      lnk('#/dash/f/over', dTot.over, dTot.over, 'over') + lnk('#/dash/f/rev', dTot.rev, rupees(dTot.rev), 'rev') + lnk('#/dash/f/projects', dTot.camp, dTot.camp, 'camp') + '</div></div>' +
      '<p class="f-help">Tasks due = tasks with a deadline ' + A.esc(P.word) + ' up to now. Done on time = done by the deadline. Revenue = fees of the department\'s projects started ' + A.esc(P.word) + ', and each retainer\'s monthly fee for every month it runs.</p>');
    /* 7 individual productivity */
    var PC = 'minmax(0,1.5fr) minmax(0,1fr) repeat(6,minmax(0,0.8fr))';
    var pRows = ppl(A).map(function (id) {
      var s = taskStats(A, P, [id]), bd = A.P[id].dept === 'BD', ld = bd ? leadsIn(A, P).filter(function (l) { return l.owner === id; }).length : null, rvp = bd ? sum(rv.filter(function (r) { return r.who === id; }), function (r) { return r.amt; }) : null;
      return '<div class="lrow" data-prow-person="' + id + '" style="--cols:' + PC + '"><span class="cell-who">' + A.avatar(id) + '<b>' + A.esc(A.P[id].name) + '</b></span><span class="faint">' + A.esc(deptOfP(A, id)) + '</span>' +
        lnk('#/dash/f/ontime/p-' + id, s.pct == null ? '' : s.pct, s.pct == null ? 'No tasks due' : s.pct + '%', 'pct') + lnk('#/dash/f/over/p-' + id, s.over.length, '<span class="' + (s.over.length ? 't-red' : '') + '">' + s.over.length + '</span>', 'over') +
        lnk('#/dash/f/ontime/p-' + id, s.delay, s.delay + ' day' + (s.delay === 1 ? '' : 's'), 'delay') + lnk('#/dash/t/open/' + id, s.open.length, s.open.length, 'open') +
        (bd ? lnk('#/dash/f/leads/p-' + id, ld, ld, 'leads') + lnk('#/dash/f/rev/p-' + id, rvp, rupees(rvp), 'rev') : '<span data-c="leads"></span><span data-c="rev"></span>') + '</div>';
    }).join('');
    var prod = card('Individual employee productivity', A.esc(P.word), '<div class="list" data-item="7" data-personperf><div class="lrow label" style="--cols:' + PC + '"><span>Person</span><span>Department</span>' + ['On time', 'Overdue now', 'Average delay', 'Open tasks', 'Leads', 'Revenue'].map(function (h) { return '<span style="text-align:right">' + h + '</span>'; }).join('') + '</div>' + pRows + '</div>' +
      '<p class="f-help">On time = tasks done by the deadline, of those due ' + A.esc(P.word) + ' up to now. Average delay = days late, over the tasks done late or still open past the deadline. Leads and revenue show on BD rows only: leads = leads the person owns, created ' + A.esc(P.word) + '; revenue = projects of brands the person brought in (the lead\'s Brought in by, or its owner when nobody is named), as on the BD scorecard.</p>');
    var caL = ca.slice(0, 4).map(function (c) { var p = byId(D.projects, c.project); return '<a class="lrow" href="#/approvals/client" style="--cols:minmax(0,1fr) auto;text-decoration:none;color:inherit"><span><b>' + A.esc(p.brand) + '</b> <span class="faint">' + A.esc(c.what) + '</span></span><span class="chip' + (ageOf(A, c) >= C3(A).stuckDays ? ' chip--red' : '') + '">' + ageOf(A, c) + ' day' + (ageOf(A, c) === 1 ? '' : 's') + '</span></a>'; }).join('');
    var riskL = risk.map(function (b) { return '<a class="lrow" data-risk="' + b.id + '" href="#/health" style="--cols:minmax(0,1fr);text-decoration:none;color:inherit"><b>' + A.esc(b.name) + '</b><span style="display:flex;flex-wrap:wrap;gap:6px">' + reasons(A, b).map(function (r) { return '<span class="chip chip--amber">' + A.esc(r.t) + '</span>'; }).join('') + '</span></a>'; }).join('');
    return brief + perBar(A) +
      '<div class="tiles">' + tile(A, 1, lw, 'user-plus', leadsIn(A, P).length, 'Leads created ' + A.esc(P.word), '#/dash/f/leads') +
      tile(A, 2, 'Proposals sent', 'file-text', propsIn(A, P).length, 'Leads moved to Proposal sent', '#/dash/f/props') +
      tile(A, 3, 'New clients closed', 'trophy', wonIn(A, P).length, 'Leads moved to Won', '#/dash/f/won') +
      tile(A, 4, 'Revenue generated', 'trending-up', rupees(revT), rv.length + ' project' + (rv.length === 1 ? '' : 's') + ', retainers each month', '#/dash/f/rev') + '</div>' +
      '<div class="tiles">' + tile(A, 5, 'Revenue collected', 'currency-rupee', rupees(recT), rc.length + ' payment' + (rc.length === 1 ? '' : 's') + ' received', '#/dash/f/coll') +
      tile(A, 8, 'Pending client approvals', 'clock-pause', ca.length, ca.length ? 'Oldest waiting ' + ageOf(A, ca[0]) + ' days' : 'Nothing waiting on a client', '#/approvals/client', ca.some(function (c) { return ageOf(A, c) >= C3(A).stuckDays; })) +
      tile(A, 9, 'Overdue tasks', 'alert-triangle', ov.length, 'Open tasks past the deadline, whole agency', '#/dash/f/over', ov.length > 0) +
      tile(A, 10, 'Influencer campaigns running', 'users', camps.length, 'Not yet Closed', '#/dash/f/camps') +
      tile(A, 11, 'Clients at risk', 'chart-bar', risk.length, 'Of ' + liveBrands(A).length + ' live clients', '#/health', risk.length > 0) + '</div>' + split +
      '<div class="brief" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">' + card('Pending client approvals', 'Oldest first', caL || none('Nothing is waiting on a client.'), ' data-item="8"') + card('Clients at risk', 'Each with its reasons', riskL || none('Every live client is healthy.'), ' data-item="11"') + '</div>' +
      perf + prod + card('Department-wise profitability', A.esc(P.word), profitTable(A, P, DEPTS, ' data-item="12"'));
  };

  /* the list behind every founder figure: #/dash/f/<key>[/<d-dept|p-person|s-service>] */
  var FL = { leads: 'Leads created', props: 'Proposals sent', won: 'New clients closed', rev: 'Revenue generated', coll: 'Revenue collected', over: 'Overdue tasks', due: 'Tasks due', ontime: 'Tasks due, on time or late', camps: 'Influencer campaigns running', projects: 'Projects running' };
  S._c3drill = function (A) {
    var m = location.hash.match(/^#\/dash\/f\/(\w+)(?:\/([a-z]+)-([\w]+))?/); if (!m || !FL[m[1]]) return '';
    if (role(A) !== 'Founder') return MF().blocked(A, 'lock', 'This list is on the founder dashboard', 'It is for Maddie.', '#/dash', 'Back to Dashboards');
    var D = A.D(), P = period(A), k = m[1], fk = m[2], fv = m[3], dept = fk === 'd' ? deptBySlug(fv) : '', who = fk === 'p' ? fv : '', svc = fk === 's' ? Object.keys(window.GUC_TEMPLATES || {})[+fv] : '';
    var ownerOk = function (id) { return (!dept || deptOfP(A, id) === dept) && (!who || id === who); };
    var leadRow = function (l, right) { return '<a class="lrow" href="#/lead/' + l.id + '" style="--cols:minmax(0,1fr) auto auto;text-decoration:none;color:inherit"><span><b>' + A.esc(l.brand) + '</b> <span class="faint">' + A.esc(l.contact) + '</span></span><span class="faint">' + A.esc(A.P[l.owner].name) + '</span><span class="chip">' + right + '</span></a>'; };
    var taskRow = function (t) { return '<div class="lrow" data-id="' + t.id + '" style="--cols:minmax(0,1fr) auto auto"><button class="task-title" type="button" data-do="open" style="text-align:left">' + A.esc(t.title) + '</button><span class="faint">' + A.esc(A.P[t.owner].name) + '</span><span class="chip' + (A.isOverdue(t) ? ' chip--red' : '') + '">' + A.esc(A.dayWord(t.due) + ', ' + A.clock(t.due)) + '</span></div>'; };
    var projRow = function (p, right) { return '<a class="lrow" href="#/project/' + p.id + '" style="--cols:minmax(0,1fr) auto auto;text-decoration:none;color:inherit"><span><b>' + A.esc(p.brand) + '</b> <span class="faint">' + A.esc(p.name) + '</span></span><span class="faint">' + A.esc(p.stage) + '</span><b class="num">' + right + '</b></a>'; };
    var L = [], tot = null;
    if (k === 'leads') L = leadsIn(A, P).filter(function (l) { return ownerOk(l.owner); }).map(function (l) { return leadRow(l, A.esc(l.stage)); });
    if (k === 'props') L = propsIn(A, P).map(function (l) { return leadRow(l, A.esc(l.stage)); });
    if (k === 'won') L = wonIn(A, P).map(function (l) { return leadRow(l, 'Won'); });
    if (k === 'rev') { var R = revRows(A, P).filter(function (r) { return (!dept || r.p.dept === dept) && (!who || r.who === who) && (!svc || r.svc === svc); }); tot = sum(R, function (r) { return r.amt; }); L = R.map(function (r) { return projRow(r.p, rupees(r.amt) + (r.n ? ' <span class="faint">(' + r.n + ' month' + (r.n === 1 ? '' : 's') + ')</span>' : '')); }); }
    if (k === 'coll') { var C = receipts(A, P); tot = sum(C, function (x) { return x.r.amount; }); L = C.map(function (x) { var p = byId(D.projects, x.y.project); return '<a class="lrow" href="#/money/due" style="--cols:minmax(0,1fr) auto auto;text-decoration:none;color:inherit"><span><b>' + A.esc(p.brand) + '</b> <span class="faint">' + A.esc(x.y.what + ', ref ' + x.r.ref) + '</span></span><span class="faint">' + A.dayWord(x.r.on + 'T00:00') + '</span><b class="num">' + rupees(x.r.amount) + '</b></a>'; }); }
    if (k === 'over') L = D.tasks.filter(function (t) { return A.isOverdue(t) && ownerOk(t.owner); }).map(taskRow);
    if (k === 'due' || k === 'ontime') { var ids = ppl(A).filter(ownerOk); L = taskStats(A, P, ids).due.map(taskRow); }
    if (k === 'camps') L = campsRunning(A).map(function (p) { return projRow(p, A.esc(A.P[p.poc].name)); });
    if (k === 'projects') L = D.projects.filter(function (p) { return p.stage !== 'Closed' && (!dept || p.dept === dept); }).map(function (p) { return projRow(p, A.esc(p.dept)); });
    var title = FL[k] + (dept ? ', ' + dept : who ? ', ' + A.P[who].name : svc ? ', ' + svc : '');
    return '<section class="card card--flush" data-fdrill="' + k + '"><div style="padding:var(--s-4);display:flex;flex-direction:column;gap:var(--s-2)"><div class="page-head"><h1 class="h-page">' + A.esc(title) + '</h1><span class="chip">' + A.esc(/^(over|camps|projects)$/.test(k) ? 'as of now' : P.word) + '</span><a class="btn btn--sm" href="#/dash">' + A.ico('chevron-left') + 'Dashboards</a></div></div>' +
      '<div class="list" style="border-top:1px solid var(--line)">' + (L.length ? L.join('') : '<div class="card empty"><span class="empty-art">' + A.ico('mood-smile') + '</span><h2 class="h-sec">Nothing on this figure</h2><p>No record matches ' + A.esc(P.word) + '. Change the period on the dashboard to see more.</p><a class="btn btn--next" href="#/dash">' + A.ico('chevron-left') + 'Back to Dashboards</a></div>') + '</div>' +
      '<div class="list-foot"><span data-fcount>' + L.length + ' on this list</span>' + (tot != null ? '<span class="spacer" style="flex:1"></span><b data-ftotal="' + tot + '">' + rupees(tot) + '</b>' : '') + '</div></section>';
  };

  /* Finance's dashboard: payments, not invoices */
  S._finD = function (A) {
    var D = A.D(), P = period(A), dueAll = sum(D.pay, function (y) { return y.amount; }), left = sum(D.pay, leftOf), late = D.pay.filter(function (y) { return lateBy(A, y); }), rc = sum(receipts(A, P), function (x) { return x.r.amount; });
    var wait = (D.approvals || []).filter(function (a) { return a.status === 'Waiting' && a.approver === A.ME(); });
    return '<div class="tiles">' + tile(A, 'f1', 'Payments due', 'currency-rupee', rupees(dueAll), 'Asked of brands, every project', '#/money/due') + tile(A, 'f2', 'Received this month', 'currency-rupee', rupees(rc), 'Paid in by brands', '#/money/due') +
      tile(A, 'f3', 'Still to collect', 'cash', rupees(left), late.length + ' payment' + (late.length === 1 ? '' : 's') + ' overdue, ' + rupees(sum(late, leftOf)), '#/money/age', late.length > 0) +
      tile(A, 'f4', 'Approvals waiting', 'square-check', wait.length, 'Money approvals on you', '#/approvals', wait.length > 0) + '</div>';
  };

  /* ---------------- Revenue, payments and profit (#/money) ---------------- */
  var MTABS = [['due', 'Payments'], ['age', 'Payments due by age'], ['costs', 'Direct costs'], ['profit', 'Profit']];
  var AGEB = [['Not yet due', -1e9, 0], ['1 to 30 days late', 1, 30], ['31 to 60', 31, 60], ['61 to 90', 61, 90], ['above 90', 91, 1e9]];
  var canRecord = function (A) { return /^(Founder|Finance)$/.test(role(A)); };
  S.money = function (A) {
    if (!seesMoney(A)) return MF().blocked(A, 'currency-rupee', 'Revenue, payments and profit are not on your list', 'They are for Maddie, Finance and each department head for their own department.', '#/today', 'Back to Today\'s tasks');
    var D = A.D(), tab = (location.hash.match(/^#\/money\/(\w+)/) || [])[1]; if (!MTABS.some(function (t) { return t[0] === tab; })) tab = 'due';
    var projs = D.projects.filter(function (p) { return projOk(A, p); }), pids = projs.map(function (p) { return p.id; }), f = MF(), html = '';
    var scope = role(A) === 'Department head' ? '<span class="chip">' + A.esc(A.me().dept) + ' department only</span>' : '<span class="chip">All departments</span>';
    if (tab === 'due') {
      var Y = D.pay.filter(function (y) { return pids.indexOf(y.project) >= 0; });
      var rows = Y.map(function (y) { var p = byId(D.projects, y.project), w = payWord(A, y); return { o: y, p: p, w: w, f: { brand: p.brand, st: w[0].replace(/ \d+ days?$/, '').replace(/^Due .*/, 'Due'), dept: p.dept }, text: [p.brand, p.name, y.what, w[0]].join(' '), date: y.due, any: { amount: y.amount, left: leftOf(y), what: y.what } }; });
      var list = f.fpass(A, 'c3pay', rows), C = 'minmax(0,1.6fr) minmax(0,1fr) repeat(3,minmax(0,0.9fr)) auto';
      var T = [sum(list, function (r) { return r.o.amount; }), sum(list, function (r) { return recvOf(r.o); }), sum(list, function (r) { return leftOf(r.o); })];
      html = f.fbar(A, 'c3pay', rows, [['brand', 'Brand'], ['st', 'Status'], ['dept', 'Department']], [['amount', 'Amount due'], ['left', 'Still to collect'], ['what', 'What for']], 'payments') +
        (canRecord(A) ? '<div><button class="btn btn--sm btn--solid" type="button" data-do="c3paynew">' + A.ico('plus') + 'Add a payment due</button></div>' : '') +
        '<div class="list" data-payments><div class="lrow label" style="--cols:' + C + '"><span>Project</span><span>Due</span><span style="text-align:right">Amount due</span><span style="text-align:right">Received</span><span style="text-align:right">Still to collect</span><span></span></div>' +
        list.map(function (r) { var y = r.o;
          return '<div class="lrow" data-py="' + y.id + '" style="--cols:' + C + '"><div style="min-width:0"><a href="#/project/' + r.p.id + '"><b>' + A.esc(r.p.brand) + '</b></a><span class="faint" style="display:block;font-size:var(--fs-12)">' + A.esc(r.p.name + ' . ' + y.what) + '</span></div>' +
            '<span><span class="chip ' + r.w[1] + '">' + A.esc(r.w[0]) + '</span><span class="faint" style="display:block;font-size:var(--fs-12)">' + A.dayWord(y.due + 'T00:00') + '</span></span>' +
            '<span class="num money" data-c="due" data-v="' + y.amount + '" style="text-align:right">' + rupees(y.amount) + '</span><span class="num money" data-c="recv" data-v="' + recvOf(y) + '" style="text-align:right">' + rupees(recvOf(y)) + '</span><span class="num money" data-c="left" data-v="' + leftOf(y) + '" style="text-align:right">' + rupees(leftOf(y)) + '</span>' +
            '<span style="display:flex;gap:6px;justify-content:flex-end">' + (canRecord(A) && leftOf(y) > 0 ? '<button class="btn btn--sm btn--next" type="button" data-do="c3recv" data-py="' + y.id + '">' + A.ico('check') + 'Record received</button>' : '') + '</span>' +
            '<details class="faint" style="grid-column:1/-1;font-size:var(--fs-12)"><summary>History (' + y.history.length + ')</summary>' + PJ().histList(A, y.history) + '</details></div>';
        }).join('') +
        '<div class="lrow" data-paytotal style="--cols:' + C + ';font-weight:600"><span>Total</span><span></span>' + T.map(function (v, i) { return '<span class="num money" data-c="' + ['due', 'recv', 'left'][i] + '" data-v="' + v + '" style="text-align:right">' + rupees(v) + '</span>'; }).join('') + '<span></span></div></div>' +
        f.foot(A, list.length, rows.length, 'payments') + '<p class="f-help">Still to collect = amount due less received. A payment past its due date with money left is overdue. Nothing here moves money: Finance records what reached the bank.</p>';
    }
    if (tab === 'age') {
      var by = {}, tot = [0, 0, 0, 0, 0];
      D.pay.forEach(function (y) { if (pids.indexOf(y.project) < 0 || !leftOf(y)) return; var p = byId(D.projects, y.project), n = y.due < A.TODAY ? A.daysBetween(y.due, A.TODAY) : 0, i = AGEB.map(function (b) { return n >= b[1] && n <= b[2]; }).indexOf(true);
        by[p.brand] = by[p.brand] || [0, 0, 0, 0, 0]; by[p.brand][i] += leftOf(y); tot[i] += leftOf(y); });
      var AC = 'minmax(0,1.3fr) repeat(6,minmax(0,0.9fr))', cell = function (v, k) { return '<span class="money num" data-c="' + k + '" data-v="' + v + '" style="text-align:right">' + rupees(v) + '</span>'; };
      html = '<div class="list" data-ageing><div class="lrow label" style="--cols:' + AC + '"><span>Brand</span>' + AGEB.map(function (b) { return '<span style="text-align:right">' + b[0] + '</span>'; }).join('') + '<span style="text-align:right">Total</span></div>' +
        Object.keys(by).sort().map(function (b) { return '<div class="lrow" data-agerow="' + A.esc(b) + '" style="--cols:' + AC + '"><b>' + A.esc(b) + '</b>' + by[b].map(function (v, i) { return cell(v, 'b' + i); }).join('') + cell(sum(by[b]), 't') + '</div>'; }).join('') +
        '<div class="lrow" data-agesum style="--cols:' + AC + ';font-weight:600"><span>Total</span>' + tot.map(function (v, i) { return cell(v, 'b' + i); }).join('') + cell(sum(tot), 't') + '</div></div><p class="f-help">Money still to collect, by days past the due date.</p>';
    }
    if (tab === 'costs') {
      var all = []; projs.forEach(function (p) { costsOf(A, p.id).forEach(function (c) { all.push({ o: c, p: p, f: { kind: c.kind, brand: p.brand, dept: p.dept }, text: [p.brand, p.name, c.kind, c.what, c.who].join(' '), date: c.on, any: { amount: c.amount, who: c.who } }); }); });
      var cl = f.fpass(A, 'c3cost', all), CC = 'minmax(0,1.5fr) minmax(0,1fr) minmax(0,1.5fr) minmax(0,0.9fr)';
      var perP = projs.map(function (p) { return [p, dcOf(A, p.id)]; });
      html = f.fbar(A, 'c3cost', all, [['kind', 'Kind'], ['brand', 'Brand'], ['dept', 'Department']], [['amount', 'Amount'], ['who', 'Paid to']], 'direct costs') +
        (canRecord(A) ? '<div><button class="btn btn--sm btn--solid" type="button" data-do="c3costnew">' + A.ico('plus') + 'Add a direct cost</button></div>' : '') +
        '<div class="list" data-costs><div class="lrow label" style="--cols:' + CC + '"><span>Project</span><span>Kind</span><span>What</span><span style="text-align:right">Amount</span></div>' +
        cl.map(function (r) { var c = r.o; return '<div class="lrow" data-dc="' + (c.o ? c.o.id : c.h.id) + '" style="--cols:' + CC + '"><a href="#/project/' + r.p.id + '"><b>' + A.esc(r.p.brand) + '</b></a><span class="chip">' + c.kind + '</span><span>' + (c.h ? '<a href="#/hamper/' + c.h.id + '">' + A.esc(c.what) + '</a>' : A.esc(c.what)) + '<span class="faint" style="display:block;font-size:var(--fs-12)">' + A.esc(c.who) + (c.on ? ', ' + A.dayWord(c.on + 'T00:00') : '') + '</span></span><span class="num money" data-v="' + c.amount + '" style="text-align:right">' + rupees(c.amount) + '</span>' +
          (c.o ? '<details class="faint" style="grid-column:1/-1;font-size:var(--fs-12)"><summary>History (' + c.o.history.length + ')</summary>' + PJ().histList(A, c.o.history) + '</details>' : '') + '</div>'; }).join('') +
        '<div class="lrow" style="--cols:' + CC + ';font-weight:600"><span>Total</span><span></span><span></span><span class="num money" data-costtotal="' + sum(cl, function (r) { return r.o.amount; }) + '" style="text-align:right">' + rupees(sum(cl, function (r) { return r.o.amount; })) + '</span></div></div>' + f.foot(A, cl.length, all.length, 'direct costs') +
        card('Direct costs per project', 'Influencer fees + vendors + hampers', '<div class="list" data-costproj>' + perP.map(function (x) { return '<div class="lrow" data-cp="' + x[0].id + '" style="--cols:minmax(0,1fr) auto auto"><span><b>' + A.esc(x[0].brand) + '</b> <span class="faint">' + A.esc(x[0].name) + '</span></span><span class="faint">' + A.esc(x[0].dept) + '</span><b class="num" data-v="' + x[1] + '">' + rupees(x[1]) + '</b></div>'; }).join('') + '</div>');
    }
    if (tab === 'profit') {
      var P = period(A);
      html = perBar(A) + profitTable(A, P, myDepts(A)) +
        card('Profit per project', 'Fee less its direct costs, every project', '<div class="list" data-projprofit>' + projs.map(function (p) { var dc = dcOf(A, p.id); return '<div class="lrow" style="--cols:minmax(0,1.5fr) repeat(3,minmax(0,1fr))"><a href="#/project/' + p.id + '"><b>' + A.esc(p.brand) + '</b> <span class="faint">' + A.esc(p.name) + '</span></a><span class="num" style="text-align:right">' + rupees(feeOf(p)) + (isRet(p) ? ' a month' : '') + '</span><span class="num" style="text-align:right">' + rupees(dc) + '</span><b class="num" style="text-align:right">' + rupees(feeOf(p) - dc) + '</b></div>'; }).join('') + '</div><p class="f-help">Columns: fee, direct costs, fee less direct costs. Team cost is counted per department above.</p>');
    }
    return '<section class="card" data-b4="money" data-c3money="' + tab + '" style="display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Revenue, payments and profit</h1>' + scope + '<span class="chip">Nothing here moves money.</span></div>' +
      '<div class="tabs" role="tablist">' + MTABS.map(function (t) { return '<a class="tab" role="tab" href="#/money/' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + '</a>'; }).join('') + '</div>' + html + '</section>';
  };

  /* ---------------- Approvals: + Waiting for the client ---------------- */
  var prevAppr = S.approvals;
  var capprsFor = function (A) { return A.D().capprs.filter(function (c) { var p = byId(A.D().projects, c.project); return p && canSeeProj(A, p); }); };
  S.approvals = function (A) {
    var r = role(A), client = /^#\/approvals\/client/.test(location.hash), canClient = /^(Founder|Department head|Team member)$/.test(r);
    var tabs = canClient ? '<div class="tabs" role="tablist" style="margin-bottom:var(--s-3)"><a class="tab" role="tab" href="#/approvals" aria-selected="' + !client + '">Our approvals</a><a class="tab" role="tab" href="#/approvals/client" aria-selected="' + client + '" data-ctab>Waiting for the client ' + capprsFor(A).filter(function (c) { return c.status === 'Waiting'; }).length + '</a></div>' : '';
    if (!client || !canClient) return tabs + prevAppr(A);
    var D = A.D(), f = MF(), all = capprsFor(A).slice().sort(function (a, b) { return (a.status === 'Waiting' ? 0 : 1) - (b.status === 'Waiting' ? 0 : 1) || (a.sent < b.sent ? -1 : 1); });
    var rows = all.map(function (c) { var p = byId(D.projects, c.project); return { o: c, p: p, f: { kind: c.kind, st: c.status, brand: p.brand }, text: [p.brand, p.name, c.kind, c.what, A.P[c.owner].name].join(' '), date: c.sent.slice(0, 10), any: { owner: A.P[c.owner].name, what: c.what } }; });
    var list = f.fpass(A, 'c3ca', rows);
    return tabs + '<section class="card card--flush" data-capprs><div style="padding:var(--s-4);display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Waiting for the client</h1><span class="chip chip--amber">' + all.filter(function (c) { return c.status === 'Waiting'; }).length + ' waiting</span><span class="spacer" style="flex:1"></span>' +
      '<button class="btn btn--next btn--sm" type="button" data-do="c3canew">' + A.ico('plus') + 'Send for client approval</button></div>' +
      '<p class="f-help">Content, plans and work the brand must sign off. Age counts from the day it went to them; after ' + C3(A).stuckDays + ' days it counts against the client\'s health. Chase drafts a message; a person sends it.</p>' +
      f.fbar(A, 'c3ca', rows, [['kind', 'Kind'], ['st', 'Status'], ['brand', 'Brand']], [['owner', 'Owner'], ['what', 'What']], 'client approvals') + '</div>' +
      '<div class="list" style="border-top:1px solid var(--line)">' + (list.length ? list.map(function (x) { var c = x.o, age = ageOf(A, c), w = c.status === 'Waiting';
        return '<div class="lrow" data-ca="' + c.id + '" style="--cols:minmax(0,1.6fr) auto auto auto"><div style="min-width:0"><b>' + A.esc(x.p.brand) + '</b> <span class="faint">' + A.esc(c.kind) + '</span><span style="display:block">' + A.esc(c.what) + '</span><span class="faint" style="font-size:var(--fs-12)">' + A.esc(A.P[c.owner].name) + ' . sent ' + A.dayWord(c.sent) + (c.chases.length ? ' . chased ' + c.chases.length + ' time' + (c.chases.length === 1 ? '' : 's') : '') + '</span></div>' +
          '<span class="chip ' + (w ? (age >= C3(A).stuckDays ? 'chip--red' : 'chip--amber') : c.status === 'Approved' ? 'chip--green' : 'chip--amber') + '" data-age="' + age + '">' + (w ? 'Waiting ' + age + ' day' + (age === 1 ? '' : 's') : c.status) + '</span>' +
          (w ? '<button class="btn btn--sm btn--next" type="button" data-do="c3chase" data-ca="' + c.id + '">' + A.ico('send') + 'Chase</button><button class="btn btn--sm" type="button" data-do="c3caok" data-ca="' + c.id + '">' + A.ico('check') + 'Client approved</button>' : '<span></span><span></span>') +
          '<details class="faint" style="grid-column:1/-1;font-size:var(--fs-12)"><summary>History (' + c.history.length + ')</summary>' + PJ().histList(A, c.history) + '</details></div>'; }).join('')
        : '<div class="card empty"><span class="empty-art">' + A.ico('mood-smile') + '</span><h2 class="h-sec">Nothing waiting on a client</h2><p>Work sent to a brand for sign-off shows here with its age.</p></div>') + '</div>' + f.foot(A, list.length, rows.length, 'client approvals') + '</section>';
  };
  function chaseText(A, c) { var D = A.D(), p = byId(D.projects, c.project), l = D.leads.filter(function (x) { return x.brand === p.brand; })[0], nm = l && !/^@/.test(l.contact) ? l.contact.split(' ')[0] : 'there';
    return 'Hi ' + nm + ', ' + A.first(c.owner) + ' from Glad U Came. A gentle nudge on the ' + c.what + ' we shared ' + A.low(A.dayWord(c.sent)) + '. Could you approve it or send your changes today, so we keep ' + p.name + ' on time? Happy to take a quick call.'; }

  /* ---------------- Client health + weekly client updates (#/health) ---------------- */
  S.health = function (A) {
    var r = role(A); if (!/^(Founder|Department head)$/.test(r)) return MF().blocked(A, 'chart-bar', 'Client health is not on your list', 'It is for Maddie and the department heads.', '#/today', 'Back to Today\'s tasks');
    var D = A.D(), tab = /^#\/health\/updates/.test(location.hash) ? 'updates' : 'health', f = MF(), html;
    var tabs = '<div class="tabs" role="tablist"><a class="tab" role="tab" href="#/health" aria-selected="' + (tab === 'health') + '">Client health</a><a class="tab" role="tab" href="#/health/updates" aria-selected="' + (tab === 'updates') + '">Weekly client updates</a></div>';
    var mine = function (b) { return brandProjects(A, b).some(function (p) { return canSeeProj(A, p); }); };
    if (tab === 'health') {
      var bs = liveBrands(A).filter(mine), rows = bs.map(function (b) { var rs = reasons(A, b); return { o: b, rs: rs, f: { st: rs.length ? 'At risk' : 'Healthy', why: rs.length ? rs.map(function (x) { return x.k; })[0] : '' }, text: [b.name].concat(rs.map(function (x) { return x.t; })).join(' '), date: (b.contact || '').slice(0, 10), any: { reasons: rs.map(function (x) { return x.t; }).join(', ') } }; });
      rows.sort(function (a, b) { return b.rs.length - a.rs.length || (a.o.name < b.o.name ? -1 : 1); });
      var list = f.fpass(A, 'c3h', rows);
      html = f.fbar(A, 'c3h', rows, [['st', 'Health']], [['reasons', 'Reason']], 'clients') +
        '<div class="list" data-health-list>' + list.map(function (x) { var b = x.o;
          return '<div class="lrow" data-brand-health="' + b.id + '" data-st="' + x.f.st + '" style="--cols:minmax(0,1fr) minmax(0,2fr) auto"><a href="#/brand/' + b.id + '"><b>' + A.esc(b.name) + '</b><span class="faint" style="display:block;font-size:var(--fs-12)">Last contact ' + A.low(A.dayWord(b.contact + 'T00:00')) + '</span></a>' +
            '<span style="display:flex;flex-wrap:wrap;gap:6px" data-reasons>' + (x.rs.length ? x.rs.map(function (rr) { return '<span class="chip chip--amber" data-reason="' + rr.k + '">' + A.esc(rr.t) + '</span>'; }).join('') : '<span class="faint">Nothing to flag</span>') + '</span>' +
            '<span class="chip ' + (x.rs.length ? 'chip--red' : 'chip--green') + '">' + x.f.st + '</span></div>'; }).join('') + '</div>' + f.foot(A, list.length, rows.length, 'clients') +
        '<p class="f-help">At risk when a client has a deliverable overdue 2 days or more, a client approval waiting ' + C3(A).stuckDays + ' days or more, a payment overdue, no contact for ' + C3(A).contactDays + ' days, or a retainer ending within ' + C3(A).retainerDays + ' days (Settings, Clients and money). Every reason is shown.</p>';
    } else {
      var ps = D.projects.filter(function (p) { return p.stage !== 'Closed' && canSeeProj(A, p); });
      var urows = ps.map(function (p) { var u = updOf(A, p); return { o: u, p: p, f: { st: u ? u.status : 'Draft', brand: p.brand }, text: [p.brand, p.name, A.P[p.poc].name].join(' '), date: u ? u.at.slice(0, 10) : A.TODAY, any: { owner: A.P[p.poc].name } }; }).filter(function (x) { return x.o; });
      var ul = f.fpass(A, 'c3u', urows);
      html = f.fbar(A, 'c3u', urows, [['st', 'Status'], ['brand', 'Brand']], [['owner', 'Account owner']], 'client updates') +
        '<p class="f-help">Every Monday the Client update agent drafts a note per live project from its tasks, client approvals and payments: done, next, and what we need from the client. The account owner checks it and sends it. Nothing goes on its own.</p>' +
        '<div style="display:grid;gap:var(--s-3);grid-template-columns:repeat(auto-fill,minmax(360px,1fr))" data-updates>' + ul.map(function (x) { var u = x.o, p = x.p, can = p.poc === A.ME() || r === 'Founder', parts = updParts(A, p), sent = u.status === 'Sent';
          return '<article class="card" data-upd="' + u.id + '" data-project="' + p.id + '" style="display:flex;flex-direction:column;gap:var(--s-2)"><div class="card-head"><h2 class="h-sec">' + A.esc(p.brand) + '</h2><span class="chip ' + (sent ? 'chip--green' : 'chip--amber') + '" data-ust>' + (sent ? 'Sent by ' + A.esc(A.first(u.by)) + ' on ' + u.ch : 'Draft, not sent') + '</span></div>' +
            '<span class="faint" style="font-size:var(--fs-12)">' + A.esc(p.name) + ' . account owner ' + A.esc(A.P[p.poc].name) + '</span>' +
            '<span class="label">Done this week</span><ul class="brief-list" data-udone>' + (parts.done.length ? parts.done.map(function (t) { return '<li>' + A.esc(t) + '</li>'; }).join('') : '<li class="faint">Nothing closed yet this week</li>') + '</ul>' +
            '<label class="label" for="ut-' + u.id + '">The note</label><textarea class="textarea" id="ut-' + u.id + '" rows="8" data-utext="' + u.id + '"' + (sent || !can ? ' readonly' : '') + '>' + A.esc(u.text || updText(A, p, u)) + '</textarea>' +
            (sent ? '' : can ? '<div style="display:flex;gap:var(--s-2);flex-wrap:wrap">' + A.micBtn() + '<button class="btn btn--sm btn--next" type="button" data-do="c3usend" data-u="' + u.id + '" data-ch="WhatsApp">' + A.ico('brand-whatsapp') + 'Send on WhatsApp</button><button class="btn btn--sm" type="button" data-do="c3usend" data-u="' + u.id + '" data-ch="email">' + A.ico('mail') + 'Send by email</button></div>' : '<p class="faint">' + A.esc(A.first(p.poc)) + ' sends this one.</p>') +
            '<details class="faint" style="font-size:var(--fs-12)"><summary>History (' + u.history.length + ')</summary>' + PJ().histList(A, u.history) + '</details></article>'; }).join('') + '</div>' + f.foot(A, ul.length, urows.length, 'client updates');
    }
    return '<section class="card" data-health="' + tab + '" style="display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Client health</h1><span class="chip">Sample data</span></div>' + tabs + html + '</section>';
  };

  /* ---------------- Settings: Clients and money ---------------- */
  S._c3settings = function (A) {
    var K = C3(A), num = function (id, lab, v, step) { return '<div class="f"><label for="' + id + '">' + lab + '</label><input class="input" id="' + id + '" type="number" min="0" step="' + (step || 1) + '" value="' + v + '"></div>'; };
    return card('Team cost per department', 'One monthly figure each', '<p>Salaries and running cost of each department for one month, used in the profit tables. Only Maddie sees and edits these.</p><div class="f-row" data-teamcost style="flex-wrap:wrap">' +
        DEPTS.map(function (x) { return num('tc-' + slug(x), x + ' (₹ a month)', K.team[x] || 0, 1000); }).join('') + '</div>', ' data-c3team') +
      card('Client health rules', '', '<div class="f-row">' + num('ch-contact', 'No contact for (days)', K.contactDays) + num('ch-ret', 'Retainer ending within (days)', K.retainerDays) + num('ch-stuck', 'Client approval stuck after (days)', K.stuckDays) + '</div>') +
      '<div><button class="btn btn--next" type="button" data-do="c3setsave">' + A.ico('check') + 'Save clients and money</button></div>';
  };

  /* ---------------- dialogs + actions ---------------- */
  var projOpts = function (A) { return A.D().projects.filter(function (p) { return projOk(A, p) && (canRecord(A) || canSeeProj(A, p)); }).map(function (p) { return '<option value="' + p.id + '">' + A.esc(p.brand + ' . ' + p.name) + '</option>'; }).join(''); };
  var prevAct = S._act;
  S._act = function (act, a, A) {
    var D = A.D(), f = MF(), num = function (v) { return Number(String(v).replace(/[^\d.]/g, '')); };
    if (act === 'c3recv') {
      var y = byId(D.pay, a.getAttribute('data-py')); if (!y || !canRecord(A)) return;
      f.dialog(A, 'dlg-c3recv', 'Record payment received', 'c3pay', '<p class="lede"><b>' + A.esc(byId(D.projects, y.project).brand + ', ' + y.what) + '</b>: ' + rupees(leftOf(y)) + ' still to collect.</p><div class="f-row"><div class="f"><label for="cr-a">Amount received, ₹ <em>*</em></label><input class="input" id="cr-a" name="amount" inputmode="numeric"></div>' +
        '<div class="f"><label for="cr-r">Bank or UPI ref <em>*</em></label><input class="input" id="cr-r" name="ref"></div></div>', 'Record received', '1,50,000 received, UTR HDFC0098812');
      f.CB['dlg-c3recv'] = function (dl) { var n = num(dl.querySelector('[name=amount]').value), ref = dl.querySelector('[name=ref]').value.trim();
        if (!n || n > leftOf(y)) return 'Put an amount up to ' + rupees(leftOf(y)) + '.'; if (!ref) return 'The bank or UPI ref is needed.';
        y.recv.push({ on: A.TODAY, amount: n, ref: ref, by: A.ME() }); hist(A, y, rupees(n) + ' received, ref ' + ref + ', recorded by ' + A.me().name);
        var p = byId(D.projects, y.project); hist(A, p, 'Payment received: ' + rupees(n) + ' against ' + y.what);
        A.save(); A.render(); A.toast(rupees(n) + ' recorded. ' + (leftOf(y) ? rupees(leftOf(y)) + ' still to collect.' : 'Paid in full.')); };
      return;
    }
    if (act === 'c3paynew') {
      f.dialog(A, 'dlg-c3pay', 'Add a payment due', 'c3pay', '<div class="f"><label for="cp-p">Project <em>*</em></label><select class="select" id="cp-p" name="project">' + projOpts(A) + '</select></div>' +
        '<div class="f-row"><div class="f"><label for="cp-w">What for <em>*</em></label><input class="input" id="cp-w" name="what" placeholder="Advance, 50%"></div><div class="f"><label for="cp-a">Amount, ₹ <em>*</em></label><input class="input" id="cp-a" name="amount" inputmode="numeric"></div><div class="f"><label for="cp-d">Due date <em>*</em></label><input class="input" type="date" id="cp-d" name="due"></div></div>', 'Add the payment due', 'Advance of 2 lakh due on the 20th');
      f.CB['dlg-c3pay'] = function (dl) { var v = function (n) { return dl.querySelector('[name=' + n + ']').value.trim(); }, n = num(v('amount'));
        if (!v('what') || !n || !v('due')) return 'What for, the amount and the due date are needed.';
        var yy = { id: 'PY' + (++D.seqPY), project: v('project'), what: v('what'), amount: n, due: v('due'), recv: [], history: [] }; hist(A, yy, 'Payment due set: ' + yy.what + ', ' + rupees(n) + ', due ' + A.dayWord(yy.due + 'T00:00')); D.pay.push(yy);
        A.save(); A.render(); A.toast('Payment due added: ' + rupees(n) + '.'); };
      return;
    }
    if (act === 'c3costnew') {
      f.dialog(A, 'dlg-c3cost', 'Add a direct cost', 'c3cost', '<div class="f"><label for="cc-p">Project <em>*</em></label><select class="select" id="cc-p" name="project">' + projOpts(A) + '</select></div>' +
        '<div class="f-row"><div class="f"><label for="cc-k">Kind <em>*</em></label><select class="select" id="cc-k" name="kind"><option>Vendor</option><option>Influencer fee</option></select></div><div class="f"><label for="cc-a">Amount, ₹ <em>*</em></label><input class="input" id="cc-a" name="amount" inputmode="numeric"></div></div>' +
        '<div class="f-row"><div class="f"><label for="cc-w">What for <em>*</em></label><input class="input" id="cc-w" name="what"></div><div class="f"><label for="cc-who">Paid to</label><input class="input" id="cc-who" name="who"></div></div><p class="f-help">Hampers count on their own from Gifting and dispatch.</p>', 'Add the direct cost', 'Vendor cost of 12,000 rupees for sound and lights');
      f.CB['dlg-c3cost'] = function (dl) { var v = function (n) { return dl.querySelector('[name=' + n + ']').value.trim(); }, n = num(v('amount'));
        if (!v('what') || !n) return 'What for and the amount are needed.';
        addCost(A, { project: v('project'), kind: v('kind'), what: v('what'), who: v('who'), amount: n }); A.save(); A.render(); A.toast('Direct cost added: ' + rupees(n) + '.'); };
      return;
    }
    if (act === 'c3canew') {
      var ps = D.projects.filter(function (p) { return canSeeProj(A, p); });
      f.dialog(A, 'dlg-c3ca', 'Send for client approval', 'c3ca', '<div class="f"><label for="ca-p">Project <em>*</em></label><select class="select" id="ca-p" name="project">' + ps.map(function (p) { return '<option value="' + p.id + '">' + A.esc(p.brand + ' . ' + p.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="f-row"><div class="f"><label for="ca-k">Kind <em>*</em></label><select class="select" id="ca-k" name="kind">' + CKINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div><div class="f"><label for="ca-w">What the client signs off <em>*</em></label><input class="input" id="ca-w" name="what"></div></div>', 'Mark it sent to the client', 'Reel draft two for the brand to approve');
      f.CB['dlg-c3ca'] = function (dl) { var w = dl.querySelector('[name=what]').value.trim(); if (!w) return 'Say what the client signs off.';
        var p = byId(D.projects, dl.querySelector('[name=project]').value), c = { id: 'CA' + (++D.seqCA), project: p.id, kind: dl.querySelector('[name=kind]').value, what: w, sent: A.now(), owner: A.ME(), status: 'Waiting', chases: [], decided: '', history: [] };
        hist(A, c, 'Sent to ' + p.brand + ' for sign-off'); hist(A, p, 'Sent to the client for approval: ' + w); D.capprs.push(c); A.save(); A.render(); A.toast('Waiting for ' + p.brand + '. It shows with its age.'); };
      return;
    }
    if (act === 'c3chase' || act === 'c3caok') {
      var c = byId(D.capprs, a.getAttribute('data-ca')); if (!c || c.status !== 'Waiting') return; var p = byId(D.projects, c.project);
      if (act === 'c3caok') { c.status = 'Approved'; c.decided = A.now(); hist(A, c, p.brand + ' approved it, recorded by ' + A.me().name); hist(A, p, 'Client approved: ' + c.what); var b = byId(D.brands, p.bid); if (b) b.contact = A.TODAY; A.save(); A.render(); A.toast(p.brand + ' approved ' + c.what + '.'); return; }
      f.dialog(A, 'dlg-c3chase', 'Chase ' + p.brand, 'c3chase', '<p class="f-help">Drafted from what is waiting. Edit it, then press Send. Nothing goes out until you do.</p><div class="f"><label for="ch-t">Message</label><textarea class="textarea" id="ch-t" name="text" rows="5">' + A.esc(chaseText(A, c)) + '</textarea></div>' +
        '<div class="f"><label for="ch-c">Send on</label><select class="select" id="ch-c" name="ch"><option>WhatsApp</option><option>Email</option></select></div>', 'Send', 'Add that we can share it on a call too');
      f.CB['dlg-c3chase'] = function (dl) { var t = dl.querySelector('[name=text]').value.trim(), chn = dl.querySelector('[name=ch]').value; if (!t) return 'The message is empty.';
        c.chases.push({ at: A.now(), by: A.ME(), ch: chn, text: t }); hist(A, c, 'Chased on ' + chn + ' by ' + A.me().name); var b = byId(D.brands, p.bid); if (b) b.contact = A.TODAY;
        A.save(); A.render(); A.toast('Sample: the chase goes from the shared ' + (chn === 'WhatsApp' ? 'WhatsApp number' : 'Gmail') + ' in the build. Logged on the approval.'); };
      return;
    }
    if (act === 'c3usend') {
      var u = byId(D.cupd, a.getAttribute('data-u')), pp = u && byId(D.projects, u.project); if (!u || u.status === 'Sent' || !(pp.poc === A.ME() || role(A) === 'Founder')) return;
      var ta = d.querySelector('[data-utext="' + u.id + '"]'); u.text = ta ? ta.value : updText(A, pp, u); u.status = 'Sent'; u.by = A.ME(); u.ch = a.getAttribute('data-ch'); u.sentAt = A.now();
      hist(A, u, 'Sent on ' + u.ch + ' by ' + A.me().name); hist(A, pp, 'Weekly client update sent on ' + u.ch); var bb = byId(D.brands, pp.bid); if (bb) bb.contact = A.TODAY;
      A.save(); A.render(); A.toast('Sample: the note goes from the shared ' + (u.ch === 'WhatsApp' ? 'WhatsApp number' : 'Gmail') + ' in the build. Marked sent.'); return;
    }
    if (act === 'c3setsave') {
      var K = C3(A), g = function (id) { return Math.max(0, Math.round(Number((d.getElementById(id) || {}).value) || 0)); }, was = JSON.stringify(K.team);
      DEPTS.forEach(function (x) { K.team[x] = g('tc-' + slug(x)); }); K.contactDays = g('ch-contact') || 1; K.retainerDays = g('ch-ret') || 1; K.stuckDays = g('ch-stuck') || 1;
      D.settings.history.push({ at: A.now(), who: A.ME(), what: 'Clients and money: ' + (was !== JSON.stringify(K.team) ? 'team cost changed; ' : '') + 'no contact ' + K.contactDays + ' days, retainer ' + K.retainerDays + ' days, client approval ' + K.stuckDays + ' days' });
      A.save(); A.render(); A.toast('Saved. Profit and client health read these now.'); return;
    }
    if (prevAct) prevAct(act, a, A);
  };
  var prevParse = S._parse;
  S._parse = function (kind, text, dl, A) {
    if (!/^c3/.test(kind)) return prevParse ? prevParse(kind, text, dl, A) : 0;
    var put = function (n, v) { var el = dl.querySelector('[name=' + n + ']'); if (!el || v == null || v === '') return 0; el.value = v; var fw = el.closest('.f'); if (fw) fw.classList.add('is-filled'); return 1; };
    var lk = text.match(/(\d+(?:\.\d+)?)\s*lakh/i), nm = text.match(/\d[\d,]*/), amt = lk ? Math.round(parseFloat(lk[1]) * 1e5) : nm ? Number(nm[0].replace(/,/g, '')) : '';
    return put('amount', amt) + put('ref', (text.match(/(UTR|UPI)\s*\w+/i) || [])[0]) + (kind === 'c3cost' || kind === 'c3ca' ? put('what', text.replace(/^.*?for\s+/i, '')) : 0);
  };

  window.GUC_C3 = { addCost: addCost, costFromAppr: function (A, a) { if (A.D().costs && a.link && byId(A.D().projects, a.link)) addCost(A, { project: a.link, kind: 'Vendor', what: a.what, who: '', amount: a.amount }); },
    feesOf: function (A, h) { return (A.D().costs || []).filter(function (c) { return c.kind === 'Influencer fee' && c.who === h; }).map(function (c) { var p = byId(A.D().projects, c.project); return { pname: p ? p.brand + ', ' + p.name : c.project, amount: c.amount, st: 'direct cost recorded ' + A.low(A.dayWord(c.on + 'T00:00')) }; }); },
    reasons: reasons, atRisk: atRisk, deptProfit: deptProfit, revRows: revRows, revOf: revOf, isRet: isRet, receipts: receipts, capprWaiting: capprWaiting, campsRunning: campsRunning, leadsIn: leadsIn, propsIn: propsIn, wonIn: wonIn, payWord: payWord, lateBy: lateBy, ageOf: ageOf, personOf: personOf, liveBrands: liveBrands, DEPTS: DEPTS, period: period, PER: PER, months: months, leftOf: leftOf, dcOf: dcOf, costsOf: costsOf, taskStats: taskStats, updParts: updParts, monday: monday };
})();
