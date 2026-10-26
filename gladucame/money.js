/* Glad U Came demo . B4: Influencers & media (Influencers, Celebrities, Journalists & outlets, record pages, Excel),
   Gifting & dispatch (hampers, proof of post, Gifting agent nudges), Approvals (one queue, five types, limits,
   reason dialog with Speak), Money (Invoices, Receivables by age, Payouts, Project margin, Money agent drafts).
   Loads after projects.js and before app.js. Every approval decision goes through decide() here. */
(function () {
  'use strict';
  var S = window.GUC_SCREENS, d = document, G = function () { return window.GUC_APP; }, J = function () { return S._pj; };
  var KEY = 'guc.demo.v1', MASK = '₹ ••••';
  var LIMIT0 = { fee: 100000, expense: 10000 };
  var LIMIT = LIMIT0; /* B5: Settings > Approval limits override these (D.settings.limits), read on every routing */
  var NUDGE_DAYS = [2, 5];
  var CATS = ['Fashion', 'Beauty', 'Food', 'Travel', 'Lifestyle', 'Fitness', 'Parenting', 'Tech', 'Comedy', 'Finance', 'Interiors and decor', 'Luxury', 'Pets'];
  var CITIES = ['Andheri', 'Bandra', 'Colaba', 'Juhu', 'Khar', 'Powai', 'Thane', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Other'];
  var BEATS = ['Fashion', 'Beauty', 'Lifestyle', 'Food', 'Business', 'Startups', 'Entertainment', 'Luxury', 'Tech', 'Health'];
  var OTYPES = ['Print', 'Online', 'TV', 'Podcast', 'Newsletter'];
  var RESP = ['Replied', 'Interested', 'Not interested', 'No reply'];
  var BARTER = ['Yes', 'No', 'Depends on the brand'];
  var HLAD = ['Planned', 'Packed', 'Dispatched', 'Delivered', 'Posted'];
  var COURIERS = ['DTDC', 'Blue Dart', 'Delhivery', 'Dunzo', 'By hand'];
  var MONEYT = { Payout: 1, Expense: 1 };
  var rupees = function (n) { var neg = n < 0, s = String(Math.abs(Math.round(n))), last = s.slice(-3), rest = s.slice(0, -3); return (neg ? '-' : '') + '₹' + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last; };
  var kfmt = function (n) { return n >= 1e5 ? (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L' : Math.round(n / 1000) + 'K'; };
  var tier = function (f) { return f < 1e4 ? 'Nano (under 10k)' : f < 1e5 ? 'Micro (10k to 100k)' : f < 5e5 ? 'Mid (100k to 500k)' : f < 1e6 ? 'Macro (500k to 1M)' : 'Mega (above 1M)'; };
  var byId = function (l, id) { return (l || []).filter(function (x) { return x.id === id; })[0]; };
  var role = function (A) { return A.me().role; };
  var day = function (A, n) { return A.addDays(A.TODAY + 'T00:00', n).slice(0, 10); };
  function hist(A, o, what, who) { (o.history = o.history || []).push({ at: A.now(), who: who || A.ME(), what: what }); }
  var fact = function (A, f) { return '<div class="fact"><span class="label">' + f[0] + '</span><b>' + A.esc(f[1]) + '</b></div>'; };
  function blocked(A, icon, title, why, back, label) {
    return '<div class="card empty" data-blocked><span class="empty-art">' + A.ico(icon) + '</span><h2 class="h-sec">' + title + '</h2><p>' + why + '</p><a class="btn btn--next" href="' + back + '">' + label + '</a></div>';
  }

  /* ---------------- store: B4 shape (idempotent, runs on every load) ---------------- */
  var prevMig = S._migrate;
  S._migrate = function (D, A) {
    var ch = prevMig ? prevMig(D, A) : false;
    if (!D.b4) {
      D.b4 = true; ch = true;
      var past = { '@bandra.bites': ['Bombay Brew Co. monsoon menu, Jul 2026', 'Tide & Thyme Cafe opening, Mar 2026'], '@glowwithtara': ['Kora Skincare summer edit, May 2026'], '@thebombaycook': ['Bombay Brew Co. launch, Jan 2026'] };
      D.infl.forEach(function (x, i) {
        x.id = 'I' + (i + 1); x.story = Math.round(x.rate * 0.4 / 500) * 500; x.post = Math.round(x.rate * 0.7 / 500) * 500;
        x.barter = i % 3 === 0 ? 'Depends on the brand' : i % 3 === 1 ? 'No' : 'Yes'; x.checked = day(A, -3 * (i + 1)); x.pan = i === 5 ? 'No' : 'Yes';
        x.past = past[x.h] || []; x.history = [{ at: A.addDays(A.TODAY + 'T10:00', -40 + i), who: 'kabir', what: 'Added to the influencer database' }];
      });
      D.infl.forEach(function (x) { x.tier = tier(x.fol); });
      D.celebs = [['Ayesha Rao', 'Film', 'Mumbai', 'Gifting only', 'Karan Mehta, Northstar Management'], ['Vikram Sethi', 'Sports', 'Mumbai', 'Gifting plus a post', 'Pooja Shah, Boundary Line Management'],
        ['Naina Kapoor', 'Television', 'Mumbai', 'Event appearance', 'Rhea Dsouza, Prime Time Artists'], ['Arjun Bajwa', 'Music', 'Mumbai', 'Gifting only', 'Sameer Khan, Bassline Management']]
        .map(function (c, i) { return { id: 'C' + (i + 1), name: c[0], cat: c[1], city: c[2], terms: c[3], mgmt: c[4], history: [{ at: A.addDays(A.TODAY + 'T11:00', -60 + i), who: 'zoya', what: 'Added to Celebrities' }] }; });
      D.journos = [['Priya Menon', 'Mid-Day', 'Print', 'Food', -6, 'Bombay Brew Co. monsoon menu', 'Interested', 1], ['Rahul Desai', 'HT City', 'Print', 'Entertainment', -12, 'Kalaghoda Arts Fest press preview', 'Replied', -2],
        ['Sneha Iyer', 'Vogue India', 'Online', 'Beauty', -24, 'Kora Skincare Diwali edit', 'No reply', 3], ['Amit Joshi', 'Mumbai Mirror', 'Print', 'Business', -1, 'Dadar Silk House at 50', 'Replied', 5],
        ['Kavya Shetty', 'Mashable India', 'Online', 'Lifestyle', -9, 'Urban Paws pet cafe opening', 'Not interested', null]]
        .map(function (j, i) { return { id: 'J' + (i + 1), name: j[0], outlet: j[1], otype: j[2], beat: j[3], email: j[0].split(' ')[0].toLowerCase() + '@' + j[1].toLowerCase().replace(/[^a-z]/g, '') + '.in',
          pitches: [{ on: day(A, j[4] - 20), story: 'Glad U Came agency credentials', resp: 'Replied', by: 'ananya' }, { on: day(A, j[4]), story: j[5], resp: j[6], by: 'meera' }], next: j[7] == null ? '' : day(A, j[7]),
          history: [{ at: A.addDays(A.TODAY + 'T10:00', j[4]), who: 'meera', what: 'Pitched: ' + j[5] }] }; });
      var pOf = function (b) { var p = D.projects.filter(function (x) { return x.brand === b; })[0]; return p ? p.id : ''; };
      D.hampers = [['Celebrity', 'Ayesha Rao', 'Dadar Silk House', 'Festive saree and sweets', 18500, 'DTDC', '7731 0942', 'Delivered', 'zoya', -3, ''],
        ['Celebrity', 'Vikram Sethi', 'Dadar Silk House', 'Kurta set and a handwritten note', 12000, 'Blue Dart', '5520 11', 'Dispatched', 'zoya', null, ''],
        ['Influencer', '@bandra.bites', 'Kora Skincare', 'Diwali hamper, 4 products', 4200, 'Dunzo', '88213', 'Posted', 'tanvi', -8, 'https://instagram.com/p/sample-bandrabites-hamper'],
        ['Influencer', '@glowwithtara', 'Kora Skincare', 'Diwali hamper, 4 products', 4200, 'Delhivery', '4431', 'Delivered', 'tanvi', -6, ''],
        ['Journalist', 'Priya Menon', 'Bombay Brew Co.', 'Cold brew tasting set', 2500, '', '', 'Packed', 'meera', null, ''],
        ['Influencer', '@thanekitchen', 'Kora Skincare', 'Diwali hamper, 4 products', 4200, '', '', 'Planned', 'tanvi', null, '']]
        .map(function (h, i) { return { id: 'H' + (i + 1), no: 'GUC-H-000' + (i + 1), to: h[0], rec: h[1], brand: h[2], project: pOf(h[2]), contents: h[3], value: h[4], courier: h[5], ref: h[6], stage: h[7], owner: h[8],
          delivered: h[9] == null ? '' : day(A, h[9]), proof: { link: h[10], files: [] }, nudged: {}, history: [{ at: A.addDays(A.TODAY + 'T10:00', -10), who: h[8], what: 'Hamper planned for ' + h[1] }] }; });
      D.seqH = D.hampers.length;
      /* invoices: amounts before GST in rupees; GST 18% worked out, never typed */
      D.invoices = [['P2', 300000, -40, 'Paid', 354000], ['P6', 380000, -75, 'Sent', 0], ['P4', 260000, -35, 'Part paid', 150000], ['P5', 140000, -3, 'Sent', 0], ['P3', 250000, -100, 'Part paid', 200000]]
        .map(function (v, i) { var p = byId(D.projects, v[0]); return { id: 'V' + (i + 1), no: 'GUC/26-27/0' + (31 + i), brand: p.brand, project: p.id, amount: v[1], gst: 18, issued: day(A, v[2]), due_in: 30, stage: v[3], received: v[4], by: 'farhan',
          history: [{ at: A.addDays(A.TODAY + 'T12:00', v[2]), who: 'farhan', what: 'Invoice sent to ' + p.brand }] }; });
      D.seqV = D.invoices.length; D.seqNo = 35;
      D.payouts = [['Influencer', '@bandra.bites', 'P1', 45000, 10, 'Paid'], ['Vendor', 'Lens & Light Studio', 'P5', 18000, 2, 'Approved'], ['Celebrity management', 'Northstar Management', 'P4', 60000, 10, 'Documents in']]
        .map(function (v, i) { return { id: 'PO' + (i + 1), no: 'GUC-PO-000' + (i + 1), ptype: v[0], payee: v[1], project: v[2], amount: v[3], tds: v[4], stage: v[5], docs: { live: v[0] === 'Influencer', inv: true, pan: true }, bank: v[5] === 'Paid' ? 'UTR 2026SBIN0012' : '',
          history: [{ at: A.addDays(A.TODAY + 'T12:00', -5), who: 'tanvi', what: 'Payout requested' }] }; });
      D.seqPO = D.payouts.length;
      D.expenses = [{ id: 'E1', project: 'P3', what: 'Venue deposit, store launch', amount: 120000, status: 'Approved', history: [] }, { id: 'E2', project: 'P5', what: 'Props for the reel shoot', amount: 6500, status: 'Approved', history: [] }];
      D.seqE = 2;
      /* the B1 sample approvals become real records you can decide */
      var L = function (b) { return D.leads.filter(function (l) { return l.brand === b; })[0]; };
      D.leads.forEach(function (l) { if (/^(Proposal sent|Negotiation|Won)$/.test(l.stage)) l.pricing = 'Approved'; });
      var lp = D.leads.filter(function (l) { return /^(Discovery call|Contacted)$/.test(l.stage); })[0];
      var seedA = [
        lp && { type: 'Pricing', what: 'Pricing for ' + lp.brand + ', ' + rupees(Math.round(lp.value * 1e5)), by: lp.owner, amount: Math.round(lp.value * 1e5), link: lp.id },
        L('Lower Parel Lofts') && { type: 'Proposal', what: 'Proposal for Lower Parel Lofts', by: 'riya', amount: 750000, link: L('Lower Parel Lofts').id },
        { type: 'Payout', what: 'Northstar Management, Dadar Silk House', by: 'zoya', amount: 60000, link: 'P4', ref: 'PO3' },
        { type: 'Expense', what: 'Sound and lights, store launch', by: 'arjun', amount: 85000, link: 'P3', ref: 'E3' },
        { type: 'Expense', what: 'Courier top-up for hampers', by: 'siddharth', amount: 4500, link: 'P3', ref: 'E4' }].filter(Boolean);
      seedA.forEach(function (o) { raise(A, o, true); });
      D.approvals.forEach(function (a) { a.history = a.history || []; });
    }
    if (sweep(A, D)) ch = true;
    return ch;
  };

  /* ---------------- the approvals engine: route, raise, decide, resubmit ---------------- */
  function deptOf(A, link) { var D = A.D(), p = byId(D.projects, link); if (p) return p.dept; var l = byId(D.leads, link); return l ? A.P[l.owner].dept : 'BD'; }
  function approverFor(A, type, amount, link, max) { LIMIT = (A.D().settings && A.D().settings.limits) || LIMIT0;
    var head = J().headOf(A, deptOf(A, link));
    if (type === 'Payout') return 'farhan';
    if (type === 'Influencer fee') return (max || amount) <= LIMIT.fee ? head : 'maddie';
    if (type === 'Expense') return amount <= LIMIT.expense ? head : 'maddie';
    return 'maddie';   /* Pricing, Proposal */
  }
  var limitWord = function (a) {
    if (a.type === 'Influencer fee') return 'Department head up to ₹1,00,000 per influencer, Maddie above (placeholder)';
    if (a.type === 'Expense') return 'Department head up to ₹10,000, Maddie above (placeholder)';
    if (a.type === 'Payout') return 'Finance checks the documents and approves (placeholder)';
    return 'Maddie decides every ' + a.type + ' (placeholder)';
  };
  function recordOf(A, a) { var D = A.D(); return byId(D.projects, a.link) || byId(D.leads, a.link); }
  function recHist(A, a, what, who) { var r = recordOf(A, a); if (r) hist(A, r, what, who); }
  function raise(A, o, seed) {
    var D = A.D(), who = o.by || A.ME();
    var a = { id: 'A' + (++D.seqA), type: o.type, what: o.what, by: who, amount: o.amount, max: o.max || 0, status: 'Waiting', link: o.link || '', ref: o.ref || '', line: o.line || '', at: A.now(), history: [] };
    a.approver = approverFor(A, a.type, a.amount, a.link, a.max);
    if (a.type === 'Expense' && !byId(D.expenses, a.ref)) { a.ref = a.ref || 'E' + (++D.seqE); D.expenses.push({ id: a.ref, project: a.link, what: o.what, amount: o.amount, status: 'Waiting', history: [] }); }
    hist(A, a, 'Raised by ' + A.P[who].name + ', with ' + A.P[a.approver].name, who);
    D.approvals.push(a);
    recHist(A, a, a.type + ' approval raised (' + rupees(a.amount) + '), with ' + A.P[a.approver].name, who);
    J().mkTask(A, { title: 'Decide: ' + a.type + ', ' + a.what + ', ' + rupees(a.amount), owner: a.approver, checker: a.approver, due: A.TODAY + 'T18:00', link: a.link, agent: true, priority: 'High', kind: 'approval', by: who, quiet: seed, why: 'Approvals: raised by ' + A.P[who].name });
    D.tasks[D.tasks.length - 1].appr = a.id;
    return a;
  }
  function fresh(id) { try { return byId((JSON.parse(localStorage.getItem(KEY)) || {}).approvals, id); } catch (e) { return null; } }
  var canDecide = function (A, a) { return a.status === 'Waiting' && (a.approver === A.ME() || role(A) === 'Founder'); };
  function decide(A, id, ok, why) {
    var D = A.D(), a = byId(D.approvals, id), f = fresh(id);
    if (f && f.status !== 'Waiting') { A.reload(); a = byId(A.D().approvals, id); A.render(); A.toast('Already decided: ' + f.status + (f.decided_by ? ' by ' + A.P[f.decided_by].name : '') + '. Nothing changed.'); return false; }
    if (!a || a.status !== 'Waiting') { A.toast('Already decided. Nothing changed.'); return false; }
    if (!canDecide(A, a)) { A.toast('This approval is with ' + A.P[a.approver].name + '.'); return false; }
    if (!ok && !why) return false;
    D = A.D(); var me = A.me().name, line = ok ? a.type + ' approved by ' + me : a.type + ' sent back by ' + me + ': ' + why;
    a.status = ok ? 'Approved' : 'Sent back'; a.decided_by = A.ME(); a.decided_at = A.now(); a.why = why || '';
    hist(A, a, line); recHist(A, a, line + ' (' + a.what + ', ' + rupees(a.amount) + ')');
    D.tasks.forEach(function (t) { if (t.appr === a.id && A.OPEN[t.status]) { t.status = 'done'; t.done_at = A.now(); t.history.push({ at: A.now(), who: A.ME(), what: 'Done: ' + (ok ? 'approved' : 'sent back') }); } });
    A.note(a.by, line + '. ' + a.what + '.');
    apply(A, a, ok, why);
    if (!ok) { var t = J().mkTask(A, { title: 'Fix and resend: ' + a.what + '. Reason: ' + why, owner: a.by, due: A.TODAY + 'T18:00', link: a.link, agent: true, quiet: true, why: 'Sent back by ' + me }); t.fix = a.id; }
    A.save(); A.render();
    A.toast(ok ? 'Approved. ' + A.first(a.by) + ' is told.' : 'Sent back to ' + A.first(a.by) + ' with your reason.');
    return true;
  }
  function resubmit(A, id) {
    var D = A.D(), a = byId(D.approvals, id); if (!a || a.status !== 'Sent back' || a.by !== A.ME()) return;
    a.status = 'Waiting'; a.decided_by = ''; hist(A, a, 'Resubmitted by ' + A.me().name); recHist(A, a, a.type + ' resubmitted for approval');
    D.tasks.forEach(function (t) { if (t.fix === a.id && A.OPEN[t.status]) { t.status = 'done'; t.done_at = A.now(); } });
    var t = J().mkTask(A, { title: 'Decide: ' + a.type + ', ' + a.what + ', ' + rupees(a.amount), owner: a.approver, checker: a.approver, due: A.TODAY + 'T18:00', link: a.link, agent: true, priority: 'High', kind: 'approval', why: 'Approvals: resubmitted by ' + A.me().name }); t.appr = a.id;
    if (a.line === 'shortlist') { var p = byId(D.projects, a.link); if (p) p.slState = 'Waiting'; }
    var po = byId(D.payouts, a.ref); if (po) po.stage = 'Documents in';
    A.save(); A.render(); A.toast('Resubmitted. ' + A.first(a.approver) + ' has it on Today\'s tasks.');
  }
  /* what a decision changes on the record it was for */
  function apply(A, a, ok, why) {
    var D = A.D(), p = byId(D.projects, a.link), pj = J();
    if (a.line === 'shortlist' && p) {
      if (ok) {
        p.slState = 'Approved'; pj.stageTo(A, p, 'Outreach');
        pj.closeTasks(A, p.id, /^(Shortlist influencers from the database|Raise influencer fee approvals)/, 'shortlist approved');
        pj.mkTask(A, { title: 'Outreach to ' + p.lines.length + ' approved influencers for ' + p.brand, owner: p.owner_line, due: A.addDays(A.TODAY + 'T18:00', 1), link: p.id, agent: true, priority: 'High', why: 'Campaign agent: shortlist approved by ' + A.me().name });
      } else p.slState = '';
    }
    if (a.type === 'Payout') {
      var po = byId(D.payouts, a.ref);
      if (po) { po.stage = ok ? 'Approved' : 'Requested'; po.back = ok ? '' : why; hist(A, po, ok ? 'Approved by ' + A.me().name : 'Sent back by ' + A.me().name + ': ' + why); }
      var x = p && p.lines.filter(function (l) { return l.h === a.line; })[0]; if (x) x.payout = ok ? 'Approved' : 'Sent back';
      if (ok && po) { var t = pj.mkTask(A, { title: 'Pay ' + po.payee + ' ' + rupees(po.amount - tdsOf(po)) + ' and record the bank reference', owner: 'farhan', checker: 'farhan', due: A.addDays(A.TODAY + 'T17:00', 1), link: a.link, agent: true, quiet: A.ME() === 'farhan', why: 'Payout approved by ' + A.me().name }); t.payout = po.id; }
    }
    if (a.type === 'Expense') { var e = byId(D.expenses, a.ref); if (e) { e.status = ok ? 'Approved' : 'Sent back'; hist(A, e, a.status + ' by ' + A.me().name); } }
    if (a.type === 'Pricing') { var l = byId(D.leads, a.link); if (l) { l.pricing = ok ? 'Approved' : 'Sent back'; if (ok) pj.mkTask(A, { title: 'Send the proposal to ' + l.brand + ': pricing approved', owner: l.owner, due: A.addDays(A.TODAY + 'T18:00', 1), link: l.id, agent: true, quiet: true, why: 'Pricing approved by ' + A.me().name }); } }
  }
  var tdsOf = function (po) { return Math.round(po.amount * po.tds / 100); };
  /* Pricing gate for Proposal sent (R-15): leads.js asks here before moving a lead */
  function pricingGate(A, l) {
    if (l.pricing === 'Approved') return true;
    var w = A.D().approvals.filter(function (a) { return a.type === 'Pricing' && a.link === l.id && a.status === 'Waiting'; })[0];
    if (w) { A.toast('Proposal sent waits for the Pricing approval, with ' + A.P[w.approver].name + '.'); return false; }
    askDialog(A, { type: 'Pricing', what: 'Pricing for ' + l.brand, amount: Math.round((l.value || 0) * 1e5), link: l.id, lock: true });
    return false;
  }

  /* ---------------- Gifting agent + Money agent: rules, run on every load and after each change ---------------- */
  function sweep(A, D) {
    var ch = false;
    (D.hampers || []).forEach(function (h) {
      if (h.stage !== 'Delivered' || h.proof.link || h.proof.files.length || !h.delivered) return;
      var n = A.daysBetween(h.delivered, A.TODAY);
      NUDGE_DAYS.forEach(function (k) {
        if (n < k || h.nudged[k]) return;
        h.nudged[k] = true; ch = true;
        var t = J().mkTask(A, { title: 'Get proof of post from ' + h.rec + ' (delivered ' + n + ' days ago)', owner: h.owner, due: A.TODAY + 'T12:00', link: h.project, agent: true, by: 'agent', priority: k >= 5 ? 'High' : 'Normal', quiet: true,
          why: 'Gifting agent: hamper ' + h.no + ' delivered ' + n + ' days ago, no proof yet (rule: day ' + k + ')' });
        t.hamper = h.id; hist(A, h, 'Gifting agent: proof-of-post nudge to ' + A.P[h.owner].name + ' (day ' + k + ')', 'agent');
        D.notes.push({ to: h.owner, text: 'Gifting agent: ' + h.rec + ' has had the hamper ' + n + ' days. Ask for the live link or a screenshot.', at: A.now(), kind: 'internal', unread: true });
      });
    });
    (D.projects || []).forEach(function (p) {
      if (!D.invoices || D.invoices.some(function (v) { return v.project === p.id; })) return;
      D.invoices.push({ id: 'V' + (++D.seqV), no: '', brand: p.brand, project: p.id, amount: Math.round(p.fee * 1e5), gst: 18, issued: '', due_in: 30, stage: 'Draft', received: 0, by: 'agent',
        history: [{ at: A.now(), who: 'agent', what: 'Money agent drafted this invoice from the Won brand, fee ' + rupees(Math.round(p.fee * 1e5)) + '. A person checks and sends it.' }] });
      ch = true;
    });
    return ch;
  }

  /* ---------------- dialogs (kit DIALOG pattern, Speak on each) ---------------- */
  var CB = {};
  function dialog(A, id, title, parse, body, submit, sample) {
    var old = d.getElementById(id); if (old) old.remove();
    d.body.insertAdjacentHTML('beforeend', '<dialog class="dialog" id="' + id + '" aria-label="' + A.esc(title) + '" data-parse="' + parse + '"><form method="dialog" data-form="' + id + '">' +
      '<div class="dialog-head"><h2 class="h-page">' + A.esc(title) + '</h2>' + A.micBtn() + '<button class="btn btn--icon btn--ghost" type="button" aria-label="Close" data-do="close">' + A.ico('x') + '</button></div>' +
      '<div class="dialog-body"><div class="speak-strip">' + A.ico('microphone', 'i--sm') + '<span>Try: <q>' + A.esc(sample) + '</q></span></div>' + body + '<p class="f-err" data-derr role="alert"></p></div>' +
      '<div class="dialog-foot"><span class="mic-hint">Speak fills the fields. You check, then save.</span><button class="btn btn--ghost" type="button" data-do="close">Cancel</button>' +
      '<button class="btn btn--next" type="submit">' + A.ico('check') + A.esc(submit) + '</button></div></form></dialog>');
    var dl = d.getElementById(id); dl.showModal(); var f = dl.querySelector('textarea, input:not([type=hidden]), select'); if (f) f.focus(); return dl;
  }
  /* the reason dialog: every Send back in the cockpit's money and approval flows */
  function reasonDialog(A, a, cb) {
    var quick = ['Fee is above the rate card', 'Documents missing', 'Numbers do not match'];
    dialog(A, 'dlg-reason', 'Send back', 'reason', '<p class="lede"><b>' + A.esc(a.type + ': ' + a.what) + '</b> goes back to ' + A.esc(A.P[a.by].name) + '. A reason is needed.</p>' +
      '<div class="f"><label for="rs-why">Why are you sending it back? <em>*</em></label><textarea class="textarea" id="rs-why" name="why" rows="3" placeholder="The reason they will read"></textarea></div>' +
      '<div class="reason-quick">' + quick.map(function (q) { return '<button type="button" data-do="rsquick">' + q + '</button>'; }).join('') + '</div>', 'Send back', 'The fee is above the rate card, please renegotiate to 40,000');
    CB['dlg-reason'] = function (dl) { var w = dl.querySelector('[name=why]').value.trim(); if (!w) { dl.querySelector('[name=why]').setAttribute('aria-invalid', 'true'); return 'A reason is needed to send it back.'; } cb(w); };
  }
  function askDialog(A, o) {
    var D = A.D(), types = o.lock ? [o.type] : ['Expense', 'Proposal'];
    var projs = D.projects.filter(function (p) { return role(A) === 'Founder' || p.team.indexOf(A.ME()) >= 0 || J().headOf(A, p.dept) === A.ME(); });
    dialog(A, 'dlg-ask', o.lock ? 'Ask for the Pricing approval' : 'Ask for approval', 'ask',
      (o.lock ? '<p class="lede">Proposal sent waits for the Pricing approval. It goes to <b>' + A.esc(A.P[approverFor(A, 'Pricing', o.amount, o.link)].name) + '</b>.</p>' : '') +
      '<div class="f-row"><div class="f"><label for="ak-type">Type <em>*</em></label><select class="select" id="ak-type" name="type">' + types.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="ak-amt">Amount, ₹ <em>*</em></label><input class="input" id="ak-amt" name="amount" inputmode="numeric" value="' + (o.amount || '') + '"></div></div>' +
      '<div class="f"><label for="ak-what">What it is for <em>*</em></label><input class="input" id="ak-what" name="what" value="' + A.esc(o.what || '') + '"></div>' +
      (o.lock ? '<input type="hidden" name="link" value="' + o.link + '">' : '<div class="f"><label for="ak-p">Project <em>*</em></label><select class="select" id="ak-p" name="link">' + projs.map(function (p) { return '<option value="' + p.id + '">' + A.esc(p.name) + '</option>'; }).join('') + '</select></div>') +
      '<p class="f-help">Placeholder limits: expense up to ₹10,000 goes to the department head, above that to Maddie.</p>', 'Send to Approvals', 'Expense of 8,500 rupees for courier charges');
    CB['dlg-ask'] = function (dl) {
      var v = function (n) { return dl.querySelector('[name=' + n + ']').value.trim(); }, amt = Number(v('amount').replace(/[^\d.]/g, ''));
      if (!amt) return 'Put the amount in rupees.'; if (!v('what')) return 'Say what it is for.'; if (!v('link')) return 'Pick the project.';
      var a = raise(A, { type: v('type'), what: v('what'), amount: amt, link: v('link') }); A.save(); A.render();
      A.toast('Sent to Approvals. ' + A.first(a.approver) + ' has it on Today\'s tasks.');
    };
  }
  var prevParse = S._parse;
  S._parse = function (kind, text, dl, A) {
    var put = function (n, v) { var el = dl.querySelector('[name=' + n + ']'); if (!el || v == null || v === '') return 0; el.value = v; el.closest('.f').classList.add('is-filled'); return 1; };
    var num = (text.replace(/,/g, '').match(/\d+(\.\d+)?/) || [])[0];
    if (kind === 'reason' || kind === 'remind') return put(kind === 'reason' ? 'why' : 'note', text);
    if (kind === 'ask') { var n = put('amount', num); if (/courier|charge|venue|prop|expense/i.test(text)) n += put('what', text.replace(/^.*?for\s+/i, '').replace(/^\w/, function (c) { return c.toUpperCase(); })); return n; }
    if (kind === 'paid' || kind === 'recv') { var n2 = put('ref', (text.match(/[A-Z]{2,}\w*\d+|\d{6,}/i) || [])[0]); if (kind === 'recv') n2 += put('amount', num); return n2; }
    if (kind === 'dispatch') { var c = COURIERS.filter(function (x) { return text.toLowerCase().indexOf(x.toLowerCase()) >= 0; })[0]; return put('courier', c) + put('ref', (text.match(/\d[\d ]{3,}\d/) || [])[0]); }
    return prevParse ? prevParse(kind, text, dl, A) : 0;
  };
  d.addEventListener('submit', function (e) {
    var id = e.target.getAttribute && e.target.getAttribute('data-form'); if (!CB[id]) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var dl = e.target.closest('dialog'), err = CB[id](dl, G());
    if (typeof err === 'string') { dl.querySelector('[data-derr]').textContent = err; return; }
    dl.close();
  }, true);

  /* ---------------- one filter bar for the B4 lists: search, dropdowns, + Any field, Date filter (Custom dates) ---------------- */
  var FS = {};
  function fstate(k) { return FS[k] || (FS[k] = { q: '', dr: {}, any: '', anyv: '', date: '', from_d: '', to_d: '' }); }
  function datePass(A, F, dy) {
    if (!F.date) return true; if (!dy) return false;
    var n = A.daysBetween(A.TODAY, dy);
    if (F.date === 'today') return n === 0; if (F.date === 'week') return n >= -6 && n <= 6;
    if (F.date === 'month') return dy.slice(0, 7) === A.TODAY.slice(0, 7); if (F.date === '30') return n >= -30 && n <= 0;
    return !((F.from_d && dy < F.from_d) || (F.to_d && dy > F.to_d));
  }
  /* rows: [{o, f:{key:value}, text, date}]; drops: [[key,label]]; anyF: [[key,label]] */
  function fbar(A, k, rows, drops, anyF, noun) {
    var F = fstate(k), opt = function (key, label) {
      var vals = []; rows.forEach(function (r) { var v = r.f[key]; if (v && vals.indexOf(v) < 0) vals.push(v); }); vals.sort();
      return '<select class="select" data-mf="' + k + '|dr.' + key + '" aria-label="' + label + '"><option value="">' + label + ': all</option>' + vals.map(function (v) { return '<option' + (F.dr[key] === v ? ' selected' : '') + '>' + A.esc(v) + '</option>'; }).join('') + '</select>';
    };
    return '<div class="filters"><label class="search"><span class="sr-only">Search ' + noun + '</span>' + A.ico('search') + '<input class="input" data-mf="' + k + '|q" value="' + A.esc(F.q) + '" placeholder="Search ' + noun + '"></label>' +
      drops.map(function (x) { return opt(x[0], x[1]); }).join('') +
      '<select class="select" data-mf="' + k + '|any" aria-label="Pick any field"><option value="">+ Any field</option>' + anyF.map(function (x) { return '<option value="' + x[0] + '"' + (F.any === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>' +
      (F.any ? '<input class="input" style="max-width:160px" data-mf="' + k + '|anyv" value="' + A.esc(F.anyv) + '" placeholder="has, or at least" aria-label="Value for the picked field">' : '') +
      A.dateFilter(F).replace(/data-tf="(\w+)"/g, 'data-mf="' + k + '|$1"') + '</div>';
  }
  function fpass(A, k, rows) {
    var F = fstate(k);
    return rows.filter(function (r) {
      if (F.q && r.text.toLowerCase().indexOf(F.q.toLowerCase()) < 0) return false;
      for (var key in F.dr) if (F.dr[key] && r.f[key] !== F.dr[key]) return false;
      if (F.any && F.anyv) { var v = r.any[F.any], q = F.anyv.trim(); if (typeof v === 'number' ? !(v >= Number(q.replace(/[^\d.]/g, ''))) : String(v || '').toLowerCase().indexOf(q.toLowerCase()) < 0) return false; }
      return datePass(A, F, r.date);
    });
  }
  var foot = function (A, n, of, noun) { return '<div class="list-foot"><span data-lcount>' + n + ' of ' + of + ' ' + noun + '</span><span class="spacer" style="flex:1"></span><span>Sample data</span></div>'; };
  d.addEventListener('input', function (e) { var m = e.target.getAttribute && e.target.getAttribute('data-mf'); if (!m || !/\|(q|anyv)$/.test(m)) return; setF(m, e.target.value); G().render(); var x = d.querySelector('[data-mf="' + m + '"]'); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } });
  d.addEventListener('change', function (e) { var m = e.target.getAttribute && e.target.getAttribute('data-mf'); if (!m || /\|(q|anyv)$/.test(m)) return; setF(m, e.target.value); G().render(); });
  function setF(m, v) { var p = m.split('|'), F = fstate(p[0]); if (p[1].indexOf('dr.') === 0) F.dr[p[1].slice(3)] = v; else F[p[1]] = v; if (p[1] === 'any') F.anyv = ''; }

  /* ---------------- Approvals: one queue, five types ---------------- */
  function apprVisible(A) {
    var r = role(A), me = A.ME(), L = A.D().approvals;
    if (r === 'Founder') return L;
    if (r === 'Finance') return L.filter(function (a) { return MONEYT[a.type]; });
    if (r === 'Department head') return L.filter(function (a) { return a.approver === me || a.by === me || A.P[a.by].head === me; });
    if (r === 'Team member') return L.filter(function (a) { return a.by === me; });
    return [];
  }
  var ST = { Waiting: 'chip--amber', Approved: 'chip--green', 'Sent back': 'chip--red' };
  S.approvals = function (A) {
    if (role(A) === 'Intern') return blocked(A, 'square-check', 'Approvals are not on your list', 'Interns see their own tasks. Your department head takes approvals.', '#/today', 'Back to Today\'s tasks');
    var all = apprVisible(A).slice().sort(function (x, y) { return (x.status === 'Waiting' ? 0 : 1) - (y.status === 'Waiting' ? 0 : 1) || (x.at < y.at ? 1 : -1); });
    var rows = all.map(function (a) { var r = recordOf(A, a); return { o: a, f: { type: a.type, st: a.status, by: A.P[a.by].name }, text: [a.type, a.what, A.P[a.by].name, r ? r.brand || r.name : ''].join(' '), date: a.at.slice(0, 10), any: { amount: a.amount, with: A.P[a.approver].name, why: a.why || '' } }; });
    var list = fpass(A, 'appr', rows), waiting = all.filter(function (a) { return canDecide(A, a); }).length;
    var card = function (a) {
      var r = recordOf(A, a), href = r ? (r.id.charAt(0) === 'P' ? '#/project/' : '#/lead/') + r.id : '';
      return '<article class="card approval" data-appr="' + a.id + '"><div class="approval-top"><span class="tile-ico">' + A.ico({ Pricing: 'coin-rupee', Proposal: 'file-text', 'Influencer fee': 'users', Payout: 'currency-rupee', Expense: 'receipt-rupee' }[a.type] || 'square-check') + '</span>' +
        '<div><b>' + A.esc(a.what) + '</b><span class="faint">' + a.type + ' . asked by ' + A.esc(A.P[a.by].name) + ', ' + A.dayWord(a.at) + (href ? ' . <a href="' + href + '">' + A.esc(r.brand || r.name) + '</a>' : '') + '</span></div>' +
        '<span class="approval-amt">' + rupees(a.amount) + '</span></div>' +
        '<div class="approval-why">With <b>' + A.esc(A.P[a.approver].name) + '</b>. ' + limitWord(a) + '.' + (a.why ? ' Reason: ' + A.esc(a.why) : '') + '</div>' +
        '<div class="approval-acts"><span class="chip ' + ST[a.status] + '" data-ast>' + a.status + (a.decided_by ? ' by ' + A.esc(A.first(a.decided_by)) : '') + '</span>' +
        (canDecide(A, a) ? '<button class="btn btn--next btn--sm" type="button" data-do="aok" data-a="' + a.id + '">' + A.ico('check') + 'Approve</button><button class="btn btn--sm" type="button" data-do="aback" data-a="' + a.id + '">' + A.ico('arrow-back-up') + 'Send back</button>' : '') +
        (a.status === 'Sent back' && a.by === A.ME() ? '<button class="btn btn--sm btn--solid" type="button" data-do="aresub" data-a="' + a.id + '">' + A.ico('send') + 'Resubmit</button>' : '') + '</div>' +
        '<details class="faint" style="font-size:var(--fs-12)"><summary>History (' + a.history.length + ')</summary>' + J().histList(A, a.history) + '</details></article>';
    };
    return '<section class="card card--flush" data-b4="approvals"><div style="padding:var(--s-4);display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Approvals</h1>' +
      '<span class="chip chip--amber">' + waiting + ' waiting for you</span><span class="spacer" style="flex:1"></span>' +
      (role(A) !== 'Finance' ? '<button class="btn btn--next btn--sm" type="button" data-do="aask">' + A.ico('plus') + 'Ask for approval</button>' : '') + '</div>' +
      '<p class="f-help">' + (role(A) === 'Finance' ? 'Finance sees money approvals only: payouts and expenses. ' : '') + 'Placeholder limits, set in Settings: Pricing and Proposal with Maddie; influencer fee up to ₹1,00,000 per influencer and expense up to ₹10,000 with the department head, above that Maddie; payouts with Finance.</p>' +
      fbar(A, 'appr', rows, [['type', 'Type'], ['st', 'Status'], ['by', 'Asked by']], [['amount', 'Amount'], ['with', 'With'], ['why', 'Reason']], 'approvals') + '</div>' +
      '<div class="appr-list" style="display:grid;gap:var(--s-3);padding:0 var(--s-4) var(--s-4);grid-template-columns:repeat(auto-fill,minmax(360px,1fr))">' + (list.length ? list.map(function (r) { return card(r.o); }).join('') :
        '<div class="card empty"><span class="empty-art">' + A.ico('mood-smile') + '</span><h2 class="h-sec">Nothing waiting</h2><p>All clear. New approvals show here and on Today\'s tasks.</p></div>') + '</div>' + foot(A, list.length, rows.length, 'approvals') + '</section>';
  };

  /* ---------------- Gifting & dispatch ---------------- */
  function hampersFor(A) {
    var r = role(A), me = A.ME(), D = A.D();
    if (r === 'Founder' || r === 'Finance') return D.hampers;
    if (r === 'Department head') return D.hampers.filter(function (h) { var p = byId(D.projects, h.project); return h.owner === me || A.P[h.owner].head === me || (p && J().headOf(A, p.dept) === me); });
    if (r === 'Team member') return D.hampers.filter(function (h) { var p = byId(D.projects, h.project); return h.owner === me || (p && p.team.indexOf(me) >= 0); });
    return [];
  }
  var seeValue = function (A) { return /^(Founder|Finance|Department head)$/.test(role(A)); };
  var HC = { Planned: '', Packed: 'chip--blue', Dispatched: 'chip--blue', Delivered: 'chip--amber', Posted: 'chip--green' };
  var hasProof = function (h) { return !!(h.proof.link || h.proof.files.length); };
  function nextBtn(A, h) {
    var i = HLAD.indexOf(h.stage), nx = HLAD[i + 1]; if (!nx) return '';
    return '<button class="btn btn--sm' + (nx === 'Posted' ? '' : ' btn--next') + '" type="button" data-do="hnext" data-h="' + h.id + '">' + A.ico('arrow-right') + nx + '</button>';
  }
  S.gifting = function (A) {
    if (role(A) === 'Intern') return blocked(A, 'gift', 'Gifting is not on your list', 'Interns see their own tasks.', '#/today', 'Back to Today\'s tasks');
    var all = hampersFor(A), sv = seeValue(A);
    var rows = all.map(function (h) { return { o: h, f: { st: h.stage, brand: h.brand, to: h.to, owner: A.P[h.owner].name }, text: [h.no, h.rec, h.brand, h.contents, h.courier, h.ref].join(' '), date: h.delivered, any: { contents: h.contents, ref: h.courier + ' ' + h.ref, value: h.value } }; });
    var list = fpass(A, 'gift', rows), wait = all.filter(function (h) { return h.stage === 'Delivered' && !hasProof(h); }).length;
    return '<section class="card card--flush" data-b4="gifting"><div style="padding:var(--s-4);display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Gifting &amp; dispatch</h1>' +
      (wait ? '<span class="chip chip--amber">' + wait + ' delivered, waiting for proof of post</span>' : '') + '</div>' +
      '<p class="f-help">Planned, Packed, Dispatched, Delivered, Posted. Dispatched needs the courier and its ref; Posted needs a live link or a screenshot. The Gifting agent nudges the owner on day ' + NUDGE_DAYS.join(' and day ') + ' after Delivered with no proof (rule in Settings, Reminder rules).</p>' +
      fbar(A, 'gift', rows, [['st', 'Stage'], ['brand', 'Brand'], ['to', 'Going to'], ['owner', 'Owner']], [['contents', 'What is inside'], ['ref', 'Courier ref'], ['value', 'Hamper value']], 'hampers') + '</div>' +
      '<div class="list" style="border-top:1px solid var(--line)">' + list.map(function (r) {
        var h = r.o, late = h.stage === 'Delivered' && !hasProof(h) && h.delivered ? A.daysBetween(h.delivered, A.TODAY) : -1;
        return '<div class="lrow" data-hamper="' + h.id + '" style="--cols:minmax(0,2fr) minmax(0,1.2fr) auto auto auto auto"><a class="cell-who" href="#/hamper/' + h.id + '" style="color:inherit;text-decoration:none"><span class="av av--lg">' + A.ico('gift', 'i--sm') + '</span><div><b>' + A.esc(h.rec) + '</b><span>' + A.esc(h.to + ' . ' + h.brand + ' . ' + h.contents) + '</span></div></a>' +
          '<span class="num">' + (h.courier ? A.esc(h.courier + ' ' + h.ref) : '<span class="faint">No courier yet</span>') + '</span><span class="money num">' + (sv ? rupees(h.value) : MASK) + '</span>' + A.avatar(h.owner) +
          '<span class="chip ' + HC[h.stage] + '" data-hst>' + h.stage + (late >= 0 ? ', ' + late + ' days, no proof' : '') + '</span><span>' + nextBtn(A, h) + '</span></div>'; }).join('') + '</div>' + foot(A, list.length, rows.length, 'hampers') + '</section>';
  };
  function fileRow(A, h, f) {
    return '<div class="file"><span>' + A.ico('paperclip', 'i--sm') + A.esc(f.n) + ' <span class="faint">' + Math.max(1, Math.round(f.size / 1024)) + ' KB</span></span><span class="spacer" style="flex:1"></span>' +
      ['View', 'Download', 'Share'].map(function (w) { return '<button class="btn btn--sm btn--ghost" type="button" data-do="hf' + w.toLowerCase() + '" data-h="' + h.id + '" data-f="' + f.id + '">' + w + '</button>'; }).join('') + '</div>';
  }
  S.hamper = function (A) {
    var id = (location.hash.match(/^#\/hamper\/(H\d+)/) || [])[1], h = id && byId(hampersFor(A), id);
    if (!h) return blocked(A, 'gift', 'This hamper is not on your list', 'Hampers show for their owner, the project team, the department head, Finance and Maddie.', '#/gifting', 'Back to Gifting &amp; dispatch');
    var i = HLAD.indexOf(h.stage), late = h.stage === 'Delivered' && !hasProof(h) && h.delivered ? A.daysBetween(h.delivered, A.TODAY) : -1;
    return '<section class="card rec-head" data-hamper-rec="' + h.id + '"><div class="page-head"><a class="btn btn--sm btn--ghost" href="#/gifting">' + A.ico('arrow-back-up') + 'Gifting &amp; dispatch</a><span class="label">Hamper ' + h.no + '</span></div>' +
      '<h1 class="h-page">' + A.esc(h.rec) + '</h1><p class="rec-sentence">' + A.esc(h.contents) + ' for ' + A.esc(h.rec) + ' (' + h.to.toLowerCase() + '), ' + A.esc(h.brand) + '. ' + A.esc(A.P[h.owner].name) + ' owns it.' + (late >= 0 ? ' Delivered ' + late + ' days ago, no proof of post yet.' : '') + '</p>' +
      '<div class="steps">' + HLAD.map(function (s, k) { return '<span class="chip' + (k < i ? ' chip--green' : k === i ? ' chip--mint' : '') + '">' + s + '</span>'; }).join('') + '</div>' +
      '<div class="facts">' + [['Stage', h.stage], ['Courier', h.courier ? h.courier + ' ' + h.ref : 'Not yet'], ['Delivered', h.delivered ? A.dayWord(h.delivered + 'T00:00') : 'Not yet'], ['Hamper value', seeValue(A) ? rupees(h.value) : MASK], ['Owner', A.P[h.owner].name]].map(function (f) { return fact(A, f); }).join('') + '</div>' +
      '<div style="display:flex;gap:var(--s-2);flex-wrap:wrap">' + nextBtn(A, h) + '</div>' +
      '<h2 class="h-sec">Proof of post</h2><div class="f-row"><input class="input" data-hlink placeholder="Paste the live link" value="' + A.esc(h.proof.link) + '" aria-label="Live link">' +
      '<button class="btn btn--sm" type="button" data-do="hlink" data-h="' + h.id + '">' + A.ico('link') + 'Save live link</button><label class="btn btn--sm btn--ghost">' + A.ico('upload') + 'Add screenshots<input type="file" multiple hidden data-hfile="' + h.id + '"></label></div>' +
      (h.proof.link ? '<a class="chip chip--green" href="' + A.esc(h.proof.link) + '" target="_blank" rel="noopener">' + A.ico('link') + 'Live link</a>' : '') +
      '<div class="files">' + h.proof.files.map(function (f) { return fileRow(A, h, f); }).join('') + '</div>' +
      (late >= 0 ? '<div class="appr-bar is-wait"><span><b>Gifting agent draft (sample, ' + A.esc(A.first(h.owner)) + ' sends it):</b> Hi ' + A.esc(h.rec.replace(/^@/, '')) + ', hope you are enjoying the ' + A.esc(h.brand) + ' hamper. When you post, could you share the live link with us? Thank you.</span></div>' : '') +
      '<h2 class="h-sec">History</h2>' + J().histList(A, h.history) + '</section>';
  };
  function hamperNext(A, h) {
    var nx = HLAD[HLAD.indexOf(h.stage) + 1]; if (!nx) return;
    if (nx === 'Dispatched' && !(h.courier && h.ref)) return dispatchDialog(A, h);
    if (nx === 'Posted' && !hasProof(h)) { A.toast('Posted needs a live link or a screenshot. Add the proof on the hamper.'); location.hash = '#/hamper/' + h.id; return; }
    moveH(A, h, nx);
  }
  function moveH(A, h, nx) {
    var was = h.stage; h.stage = nx; if (nx === 'Delivered') h.delivered = A.TODAY;
    hist(A, h, 'Stage ' + was + ' to ' + nx);
    if (nx === 'Posted') A.D().tasks.forEach(function (t) { if (t.hamper === h.id && A.OPEN[t.status]) { t.status = 'done'; t.done_at = A.now(); t.history.push({ at: A.now(), who: A.ME(), what: 'Done: proof of post in' }); } });
    sweep(A, A.D()); A.save(); A.render(); A.toast(h.rec + ': ' + nx + '.');
  }
  function dispatchDialog(A, h) {
    dialog(A, 'dlg-dispatch', 'Dispatch the hamper', 'dispatch', '<p class="lede"><b>' + A.esc(h.rec) + '</b>: Dispatched needs the courier and its ref.</p><div class="f-row"><div class="f"><label for="dp-c">Courier <em>*</em></label><select class="select" id="dp-c" name="courier"><option value="">Pick</option>' +
      COURIERS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div><div class="f"><label for="dp-r">Courier ref <em>*</em></label><input class="input" id="dp-r" name="ref"></div></div>', 'Mark Dispatched', 'Blue Dart 5520 8841');
    CB['dlg-dispatch'] = function (dl) { var c = dl.querySelector('[name=courier]').value, r = dl.querySelector('[name=ref]').value.trim(); if (!c || !r) return 'Both the courier and the ref are needed.'; h.courier = c; h.ref = r; hist(A, h, 'Courier ' + c + ' ' + r); moveH(A, h, 'Dispatched'); };
  }

  /* ---------------- Influencers & media ---------------- */
  var MTAB = 'infl', UP = null;
  var canCeleb = function (A) { return /^(Founder|Department head)$/.test(role(A)); };
  var canJour = function (A) { return /^(Founder|Department head|Team member)$/.test(role(A)); };
  var pastOf = function (A, x) { return A.D().projects.filter(function (p) { return p.lines.some(function (l) { return l.h === x.h; }); }).map(function (p) { return p.name + ', ' + p.brand; }).concat(x.past || []); };
  var lastPitch = function (j) { return j.pitches.slice().sort(function (a, b) { return a.on < b.on ? 1 : -1; })[0]; };   /* R-32: worked out from the log */
  S.media = function (A) {
    var r = role(A), sub = (location.hash.match(/^#\/media\/(\w+)/) || [])[1];
    if (r === 'Intern') return blocked(A, 'users', 'Influencers &amp; media are not on your list', 'Interns see their own tasks.', '#/today', 'Back to Today\'s tasks');
    if (sub === 'celebs' && !canCeleb(A)) return blocked(A, 'crown', 'Celebrities are for the Founder and department heads', 'Ask your department head if a celebrity is needed on your project.', '#/media', 'Back to Influencers');
    if (sub === 'journos' && !canJour(A)) return blocked(A, 'news', 'Journalists &amp; outlets are not on your list', 'Finance sees influencer payout details only.', '#/media', 'Back to Influencers');
    MTAB = sub === 'celebs' ? 'celebs' : sub === 'journos' ? 'journos' : 'infl';
    var D = A.D(), tabs = [['infl', 'Influencers', D.infl.length, '#/media']].concat(canCeleb(A) ? [['celebs', 'Celebrities', D.celebs.length, '#/media/celebs']] : []).concat(canJour(A) ? [['journos', 'Journalists &amp; outlets', D.journos.length, '#/media/journos']] : []);
    var head = '<div class="page-head"><h1 class="h-page">Influencers &amp; media</h1><span class="spacer" style="flex:1"></span>' +
      (MTAB !== 'celebs' && r !== 'Finance' ? '<button class="btn btn--sm btn--ghost" type="button" data-do="xsample" data-k="' + MTAB + '">' + A.ico('download') + 'Excel sample</button><label class="btn btn--sm btn--ghost">' + A.ico('upload') + 'Upload Excel<input type="file" accept=".xlsx" hidden data-xup="' + MTAB + '"></label>' : '') + '</div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<a class="tab" role="tab" href="' + t[3] + '" aria-selected="' + (MTAB === t[0]) + '" data-mtab="' + t[0] + '">' + t[1] + ' ' + t[2] + '</a>'; }).join('') + '</div>';
    var body, rows, list;
    if (MTAB === 'infl') {
      rows = D.infl.map(function (x) { return { o: x, f: { cat: x.cat, city: x.city, tier: x.tier }, text: [x.h, x.name, x.cat, x.city].join(' '), date: x.checked, any: { name: x.name, er: x.er, fol: x.fol, rate: x.rate, barter: x.barter } }; });
      list = fpass(A, 'infl', rows);
      body = fbar(A, 'infl', rows, [['cat', 'Category'], ['city', 'City'], ['tier', 'Tier']], [['name', 'Name'], ['fol', 'Followers'], ['er', 'ER %'], ['rate', 'Rate per reel'], ['barter', 'Barter']], 'influencers') + '</div><div class="list" style="border-top:1px solid var(--line)">' +
        list.map(function (q) { var x = q.o, pw = pastOf(A, x); return '<a class="lrow" data-infl="' + x.id + '" href="#/infl/' + x.id + '" style="--cols:minmax(0,1.6fr) minmax(0,1fr) auto auto minmax(0,1.3fr) minmax(0,1.2fr);color:inherit;text-decoration:none"><div class="cell-who"><span class="av av--lg">' + A.esc(x.h.slice(1, 3).toUpperCase()) + '</span><div><b>' + A.esc(x.h) + '</b><span>' + A.esc(x.name) + '</span></div></div>' +
          '<span>' + A.esc(x.cat + ', ' + x.city) + '</span><span class="num">' + kfmt(x.fol) + ' . ' + x.tier.split(' ')[0] + '</span><span class="num">' + x.er + '% ER</span><span class="money num">Reel ' + rupees(x.rate) + ' . Story ' + rupees(x.story) + '</span><span class="faint">' + (pw.length ? A.esc(pw.length + ' past: ' + pw[0]) : 'New to us') + '</span></a>'; }).join('') + '</div>' + foot(A, list.length, rows.length, 'influencers');
    } else if (MTAB === 'celebs') {
      rows = D.celebs.map(function (c) { var g = D.hampers.filter(function (h) { return h.rec === c.name; }).length; return { o: c, g: g, f: { cat: c.cat, terms: c.terms }, text: [c.name, c.cat, c.mgmt].join(' '), date: '', any: { mgmt: c.mgmt, city: c.city } }; });
      list = fpass(A, 'celeb', rows);
      body = fbar(A, 'celeb', rows, [['cat', 'Category'], ['terms', 'Terms']], [['mgmt', 'Management contact'], ['city', 'City']], 'celebrities') + '</div><div class="list" style="border-top:1px solid var(--line)">' +
        list.map(function (q) { var c = q.o; return '<a class="lrow" data-celeb="' + c.id + '" href="#/celeb/' + c.id + '" style="--cols:minmax(0,1.5fr) minmax(0,1fr) minmax(0,1.5fr) auto;color:inherit;text-decoration:none"><div class="cell-who"><span class="av av--lg">' + A.ico('crown', 'i--sm') + '</span><div><b>' + A.esc(c.name) + '</b><span>' + A.esc(c.cat + ', ' + c.city) + '</span></div></div><span>' + A.esc(c.terms) + '</span><span class="faint">' + A.esc(c.mgmt) + '</span><span class="chip">' + q.g + ' hamper' + (q.g === 1 ? '' : 's') + '</span></a>'; }).join('') + '</div>' + foot(A, list.length, rows.length, 'celebrities');
    } else {
      rows = D.journos.map(function (j) { var lp = lastPitch(j); return { o: j, lp: lp, f: { outlet: j.outlet, beat: j.beat, resp: lp ? lp.resp : '' }, text: [j.name, j.outlet, j.beat, lp ? lp.story : ''].join(' '), date: lp ? lp.on : '', any: { email: j.email, otype: j.otype, story: lp ? lp.story : '' } }; });
      list = fpass(A, 'jour', rows);
      body = fbar(A, 'jour', rows, [['outlet', 'Outlet'], ['beat', 'Beat'], ['resp', 'Response']], [['email', 'Email'], ['otype', 'Outlet type'], ['story', 'Last pitch']], 'journalists') + '</div><div class="list" style="border-top:1px solid var(--line)">' +
        list.map(function (q) { var j = q.o, lp = q.lp, over = j.next && j.next < A.TODAY; return '<a class="lrow" data-jour="' + j.id + '" href="#/jour/' + j.id + '" style="--cols:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.6fr) auto auto;color:inherit;text-decoration:none"><div class="cell-who"><span class="av av--lg">' + A.ico('news', 'i--sm') + '</span><div><b>' + A.esc(j.name) + '</b><span>' + A.esc(j.outlet + ' . ' + j.otype) + '</span></div></div><span>' + A.esc(j.beat) + '</span>' +
          '<span data-lastpitch>' + (lp ? A.esc(A.dayWord(lp.on + 'T00:00') + ': ' + lp.story) : 'No pitch yet') + '</span><span class="chip' + (lp && /Interested|Replied/.test(lp.resp) ? ' chip--green' : '') + '">' + (lp ? lp.resp : 'None') + '</span><span class="' + (over ? 't-red' : 'faint') + '">' + (j.next ? 'Next ' + A.low(A.dayWord(j.next + 'T00:00')) : 'No follow-up') + '</span></a>'; }).join('') + '</div>' + foot(A, list.length, rows.length, 'journalists');
    }
    return (UP && UP.k === MTAB ? upCard(A) : '') + '<section class="card card--flush" data-b4="media"><div style="padding:var(--s-4);display:flex;flex-direction:column;gap:var(--s-3)">' + head + body + '</section>';
  };
  function recPage(A, kind, o, title, sentence, facts, extra) {
    return '<section class="card rec-head" data-' + kind + '-rec="' + o.id + '"><div class="page-head"><a class="btn btn--sm btn--ghost" href="#/media' + (kind === 'celeb' ? '/celebs' : kind === 'jour' ? '/journos' : '') + '">' + A.ico('arrow-back-up') + 'Influencers &amp; media</a></div>' +
      '<h1 class="h-page">' + A.esc(title) + '</h1><p class="rec-sentence">' + sentence + '</p><div class="facts">' + facts.map(function (f) { return fact(A, f); }).join('') + '</div>' + (extra || '') +
      '<h2 class="h-sec">History</h2>' + J().histList(A, o.history) + '</section>';
  }
  S.infl = function (A) {
    var id = (location.hash.match(/^#\/infl\/(I\d+)/) || [])[1], x = id && byId(A.D().infl, id);
    if (role(A) === 'Intern' || !x) return blocked(A, 'users', 'This influencer is not on your list', 'Influencers show for the Founder, department heads, team members and Finance.', '#/media', 'Back to Influencers');
    var pw = pastOf(A, x), pays = A.D().payouts.filter(function (p) { return p.payee === x.h; });
    return recPage(A, 'infl', x, x.h, A.esc(x.name) + ', ' + x.cat.toLowerCase() + ', ' + A.esc(x.city) + '. ' + kfmt(x.fol) + ' followers at ' + x.er + '% ER, so ' + x.tier.split(' ')[0] + ' tier. Rates checked ' + A.dayWord(x.checked + 'T00:00') + '.',
      [['Reel', rupees(x.rate)], ['Story', rupees(x.story)], ['Post', rupees(x.post)], ['Barter', x.barter], ['PAN on file', x.pan], ['Tier', x.tier]],
      '<h2 class="h-sec">Past work</h2>' + (pw.length ? '<ul class="brief-list">' + pw.map(function (w) { return '<li>' + A.esc(w) + '</li>'; }).join('') + '</ul>' : '<p class="faint">New to us.</p>') +
      (pays.length ? '<h2 class="h-sec">Payouts</h2><ul class="brief-list">' + pays.map(function (p) { return '<li>' + p.no + ', ' + rupees(p.amount) + ', ' + p.stage + '</li>'; }).join('') + '</ul>' : ''));
  };
  S.celeb = function (A) {
    var id = (location.hash.match(/^#\/celeb\/(C\d+)/) || [])[1], c = id && byId(A.D().celebs, id);
    if (!canCeleb(A)) return blocked(A, 'crown', 'Celebrities are for the Founder and department heads', 'Ask your department head if a celebrity is needed on your project.', '#/media', 'Back to Influencers');
    if (!c) return blocked(A, 'crown', 'Not found', 'This celebrity is not in the list.', '#/media/celebs', 'Back to Celebrities');
    var hs = A.D().hampers.filter(function (h) { return h.rec === c.name; });
    return recPage(A, 'celeb', c, c.name, A.esc(c.name) + ', ' + c.cat.toLowerCase() + ', ' + A.esc(c.city) + '. Terms: ' + A.esc(c.terms.toLowerCase()) + '.', [['Category', c.cat], ['Terms', c.terms], ['Management contact', c.mgmt], ['Hampers', String(hs.length)]],
      hs.length ? '<h2 class="h-sec">Hampers</h2><ul class="brief-list">' + hs.map(function (h) { return '<li><a href="#/hamper/' + h.id + '">' + h.no + '</a>, ' + A.esc(h.brand) + ', ' + h.stage + '</li>'; }).join('') + '</ul>' : '');
  };
  S.jour = function (A) {
    var id = (location.hash.match(/^#\/jour\/(J\d+)/) || [])[1], j = id && byId(A.D().journos, id);
    if (!canJour(A) || !j) return blocked(A, 'news', 'This journalist is not on your list', 'Journalists &amp; outlets show for the Founder, department heads and team members.', '#/media', 'Back to Influencers');
    var lp = lastPitch(j);
    return recPage(A, 'jour', j, j.name, A.esc(j.name) + ' writes on ' + j.beat.toLowerCase() + ' for ' + A.esc(j.outlet) + '. ' + (lp ? 'Last pitch ' + A.low(A.dayWord(lp.on + 'T00:00')) + ': ' + A.esc(lp.story) + ', ' + lp.resp.toLowerCase() + '.' : 'Not pitched yet.'),
      [['Outlet', j.outlet + ', ' + j.otype], ['Beat', j.beat], ['Email', j.email], ['Last pitch', lp ? A.dayWord(lp.on + 'T00:00') : 'None'], ['Response', lp ? lp.resp : 'None'], ['Next follow-up', j.next ? A.dayWord(j.next + 'T00:00') : 'Not set']],
      '<h2 class="h-sec">Pitch log</h2><div class="list">' + j.pitches.slice().reverse().map(function (p) { return '<div class="lrow" style="--cols:100px minmax(0,1fr) auto"><span class="label">' + A.dayWord(p.on + 'T00:00') + '</span><span>' + A.esc(p.story) + '</span><span class="chip">' + p.resp + '</span></div>'; }).join('') + '</div>' +
      '<div class="f-row" style="margin-top:var(--s-2)"><input class="input" data-pstory placeholder="Story pitched today" aria-label="Story pitched"><select class="select" data-presp aria-label="Response">' + RESP.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select>' +
      '<button class="btn btn--sm btn--next" type="button" data-do="plog" data-j="' + j.id + '">' + A.ico('plus') + 'Log the pitch</button></div>');
  };

  /* ---------------- Excel sample + upload (R-33): influencers and journalists ---------------- */
  var XCOLS = {
    infl: [['Name', 1], ['Instagram handle', 1], ['Category', 1, 'cat'], ['City', 1, 'city'], ['Followers', 1, 'num'], ['ER %', 0, 'num'], ['Rate per reel, ₹', 0, 'num'], ['Rate per story, ₹', 0, 'num'], ['Rate per post, ₹', 0, 'num'], ['Barter', 0, 'barter']],
    journos: [['Name', 1], ['Outlet', 1], ['Outlet type', 0, 'otype'], ['Beat', 1, 'beat'], ['Email', 1], ['Mobile', 0], ['Last response', 0, 'resp'], ['Next follow-up', 0, 'date']]
  };
  var XL = { cat: CATS, city: CITIES, barter: BARTER, otype: OTYPES, beat: BEATS, resp: RESP };
  function need(cb) {
    if (window.ExcelJS) return cb();
    var sc = d.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js'; sc.onload = cb;
    sc.onerror = function () { G().toast('The Excel maker could not load. Check the internet connection.'); }; d.head.appendChild(sc);
  }
  function xsample(A, k) {
    need(function () {
      var cols = XCOLS[k], wb = new window.ExcelJS.Workbook(), fill = wb.addWorksheet('Fill this'), how = wb.addWorksheet('How to fill'), li = wb.addWorksheet('Lists'), keys = [];
      cols.forEach(function (c) { if (XL[c[2]]) keys.push(c[2]); });
      keys.forEach(function (key, ci) { li.getCell(1, ci + 1).value = key; XL[key].forEach(function (v, r) { li.getCell(r + 2, ci + 1).value = v; }); });
      li.state = 'hidden';
      fill.columns = cols.map(function (c) { return { header: c[0] + (c[1] ? ' *' : ''), width: Math.max(16, c[0].length + 4) }; });
      fill.getRow(1).font = { bold: true }; fill.views = [{ state: 'frozen', ySplit: 1 }];
      cols.forEach(function (c, i) {
        var letter = fill.getColumn(i + 1).letter, ki = keys.indexOf(c[2]);
        for (var r = 2; r <= 501; r++) {
          var cell = fill.getCell(letter + r);
          if (ki >= 0) { var L = String.fromCharCode(65 + ki); cell.dataValidation = { type: 'list', allowBlank: !c[1], formulae: ['Lists!$' + L + '$2:$' + L + '$' + (XL[c[2]].length + 1)], showErrorMessage: true, error: 'Choose a value from the dropdown.' }; }
          else if (c[2] === 'num') cell.dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: true, formulae: [0], showErrorMessage: true, error: 'A number, 0 or more.' };
          else if (c[2] === 'date') { cell.dataValidation = { type: 'date', operator: 'greaterThan', allowBlank: true, formulae: [new Date(2020, 0, 1)], showErrorMessage: true, error: 'A date.' }; cell.numFmt = 'yyyy-mm-dd'; }
        }
      });
      fill.addRow(k === 'infl' ? ['Pooja Rane', '@leafandloaf.eats', 'Food', 'Bandra', 54000, 6.2, 18000, 7000, 12000, 'Yes'] : ['Nikhil Bose', 'The Bombay Daily', 'Online', 'Food', 'nikhil@bombaydaily.in', '+91 98200 11223', 'Replied', A.addDays(A.TODAY + 'T00:00', 3).slice(0, 10)]);
      how.getCell('A1').value = 'Glad U Came: ' + (k === 'infl' ? 'influencers' : 'journalists') + ' sheet'; how.getCell('A1').font = { bold: true, size: 14 };
      how.getCell('A2').value = 'One row per person. Columns with * are required. Dropdowns show today\'s lists. Row 2 is an example: replace it. Nothing saves until you check the rows and press Save.';
      wb.xlsx.writeBuffer().then(function (buf) { var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.download = 'Glad-U-Came-' + (k === 'infl' ? 'influencers' : 'journalists') + '-sheet.xlsx'; d.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); });
      A.toast('The sheet is downloading, with today\'s lists in its dropdowns.');
    });
  }
  function cellText(v) {
    if (v == null) return '';
    if (v instanceof Date) return new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (typeof v === 'object') { if (v.result != null) v = v.result; else if (v.text) v = v.text; else if (v.richText) v = v.richText.map(function (r) { return r.text; }).join(''); }
    return String(v).trim();
  }
  function xupload(A, el) {
    var k = el.getAttribute('data-xup'), f = el.files && el.files[0]; if (!f) return; el.value = '';
    need(function () {
      var fr = new FileReader();
      fr.onload = function (e) {
        var wb = new window.ExcelJS.Workbook();
        wb.xlsx.load(e.target.result).then(function () {
          var ws = wb.getWorksheet('Fill this') || wb.worksheets[0], rows = [];
          ws.eachRow({ includeEmpty: false }, function (row, n) { if (n === 1) return; var v = XCOLS[k].map(function (c, i) { return cellText(row.getCell(i + 1).value); }); if (v.some(Boolean)) rows.push({ n: n, v: v }); });
          xcheck(A, k, rows, f.name); A.render();
        }, function () { A.toast('That file could not be read. Download the Excel sample and fill it.'); });
      };
      fr.readAsArrayBuffer(f);
    });
  }
  function xcheck(A, k, rows, name) {
    var D = A.D(), cols = XCOLS[k], ok = [], errs = [], seen = {};
    rows.forEach(function (r) {
      var v = r.v, bad = [];
      cols.forEach(function (c, i) {
        if (c[1] && !v[i]) bad.push(c[0] + ' is empty');
        else if (v[i] && XL[c[2]] && XL[c[2]].indexOf(v[i]) < 0) bad.push('"' + v[i] + '" is not in the ' + c[0].toLowerCase() + ' list');   /* exact label, never a prefix */
        else if (v[i] && c[2] === 'num' && isNaN(Number(v[i]))) bad.push(c[0] + ' must be a number');
        else if (v[i] && c[2] === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v[i])) bad.push(c[0] + ' must be a date');
      });
      var key = k === 'infl' ? (v[1].charAt(0) === '@' ? v[1] : '@' + v[1]).toLowerCase() : v[4].toLowerCase();
      if (key && (seen[key] || (k === 'infl' ? D.infl.some(function (x) { return x.h.toLowerCase() === key; }) : D.journos.some(function (x) { return x.email.toLowerCase() === key; })))) bad.push((k === 'infl' ? 'handle ' : 'email ') + key + ' is already on file' + (seen[key] ? ' (row ' + seen[key] + ')' : ''));
      if (key && !seen[key]) seen[key] = r.n;
      if (bad.length) errs.push('Row ' + r.n + ': ' + bad.join('; ') + '.'); else ok.push(v);
    });
    UP = { k: k, name: name, ok: ok, errs: errs };
  }
  function upCard(A) {
    var noun = UP.k === 'infl' ? 'influencers' : 'journalists';
    return '<section class="card" data-upcheck><div class="card-head"><h2 class="h-sec">Check the upload: ' + A.esc(UP.name) + '</h2></div><p class="lede"><b data-upok>' + UP.ok.length + ' ' + noun + ' ready</b>' +
      (UP.errs.length ? ', <b class="t-red" data-uperr>' + UP.errs.length + ' row' + (UP.errs.length === 1 ? '' : 's') + ' to fix</b> (they do not save)' : '') + '. Nothing is saved yet.</p>' +
      (UP.errs.length ? '<ul class="up-errs">' + UP.errs.map(function (e) { return '<li>' + A.esc(e) + '</li>'; }).join('') + '</ul>' : '') +
      '<div style="display:flex;gap:var(--s-2)"><button class="btn btn--next" type="button" data-do="xsave"' + (UP.ok.length ? '' : ' disabled') + '>' + A.ico('check') + 'Save ' + UP.ok.length + ' ' + noun + '</button><button class="btn btn--ghost" type="button" data-do="xcancel">Cancel</button></div></section>';
  }
  function xsave(A) {
    var D = A.D(), n = UP.ok.length, file = UP.name;
    UP.ok.forEach(function (v) {
      if (UP.k === 'infl') { var fol = Number(v[4]), x = { id: 'I' + (D.infl.length + 1), h: v[1].charAt(0) === '@' ? v[1] : '@' + v[1], name: v[0], cat: v[2], city: v[3], fol: fol, tier: tier(fol), er: Number(v[5]) || 0, rate: Number(v[6]) || 0, story: Number(v[7]) || 0, post: Number(v[8]) || 0, barter: v[9] || 'Depends on the brand', checked: A.TODAY, pan: 'No', past: [], history: [] };
        hist(A, x, 'Added from the Excel upload ' + file); D.infl.push(x); }
      else { var j = { id: 'J' + (D.journos.length + 1), name: v[0], outlet: v[1], otype: v[2] || 'Online', beat: v[3], email: v[4], mobile: v[5], pitches: v[6] ? [{ on: A.TODAY, story: 'Added from the sheet', resp: v[6], by: A.ME() }] : [], next: v[7] || '', history: [] };
        hist(A, j, 'Added from the Excel upload ' + file); D.journos.push(j); }
    });
    UP = null; A.save(); A.render(); A.toast(n + ' saved.');
  }

  /* ---------------- Money ---------------- */
  var MONT = 'inv';
  var gstOf = function (v) { return Math.round(v.amount * v.gst / 100); };
  var totOf = function (v) { return v.amount + gstOf(v); };
  var dueOn = function (A, v) { return v.issued ? A.addDays(v.issued + 'T00:00', v.due_in).slice(0, 10) : ''; };
  var openAmt = function (v) { return /^(Sent|Part paid)$/.test(v.stage) ? totOf(v) - v.received : 0; };
  var BUCKETS = [['0 to 30 days', 0, 30], ['31 to 60', 31, 60], ['61 to 90', 61, 90], ['above 90', 91, 1e9]];
  var cell = function (n, k) { return '<span class="money num" data-c="' + k + '" style="text-align:right">' + rupees(n) + '</span>'; };
  function brandsOfHead(A) { var me = A.ME(); return A.D().projects.filter(function (p) { return J().headOf(A, p.dept) === me || p.team.indexOf(me) >= 0; }).map(function (p) { return p.brand; }); }
  S.money = function (A) {
    var r = role(A), D = A.D();
    if (!/^(Founder|Finance|Department head)$/.test(r)) return blocked(A, 'currency-rupee', 'Money is not on your list', 'Money is for Maddie, Finance and, for invoice status, department heads.', '#/today', 'Back to Today\'s tasks');
    var head = r === 'Department head', sub = (location.hash.match(/^#\/money\/(\w+)/) || [])[1];
    MONT = head ? 'inv' : (sub || 'inv');
    var tabs = head ? [['inv', 'Invoices']] : [['inv', 'Invoices'], ['age', 'Receivables by age'], ['pay', 'Payouts'], ['margin', 'Project margin']];
    var html = '<div class="page-head"><h1 class="h-page">Money</h1><span class="chip">Money agent drafts; a person checks and sends. Nothing here moves money.</span></div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<a class="tab" role="tab" href="#/money/' + t[0] + '" aria-selected="' + (MONT === t[0]) + '">' + t[1] + '</a>'; }).join('') + '</div>';
    if (MONT === 'inv') {
      var mine = head ? brandsOfHead(A) : null, inv = D.invoices.filter(function (v) { return !mine || mine.indexOf(v.brand) >= 0; });
      var rows = inv.map(function (v) { var du = dueOn(A, v), over = du && du < A.TODAY && openAmt(v) > 0; return { o: v, over: over, f: { st: over ? 'Overdue' : v.stage, brand: v.brand }, text: [v.no, v.brand].join(' '), date: v.issued, any: { amount: v.amount, no: v.no } }; });
      var list = fpass(A, 'inv', rows), drafts = inv.filter(function (v) { return v.by === 'agent' && v.stage === 'Draft'; }).length;
      var COLS = head ? 'minmax(0,1.6fr) minmax(0,1fr) auto auto' : 'minmax(210px,1fr) repeat(4,88px) 64px 88px 158px';
      var sum = function (f) { return list.reduce(function (s, q) { return s + f(q.o); }, 0); };
      html += (drafts && !head ? '<div class="appr-bar" data-agentdraft>' + A.ico('sparkles') + '<span><b>Money agent</b> drafted ' + drafts + ' invoice' + (drafts === 1 ? '' : 's') + ' from Won brands. Finance checks each one, then sends it.</span></div>' : '') +
        (head ? '<p class="f-help">Department heads see the invoice status of their own brands. Amounts and margin stay with Maddie and Finance.</p>' : '') +
        fbar(A, 'inv', rows, [['st', 'Stage'], ['brand', 'Brand']], [['amount', 'Amount before GST'], ['no', 'Invoice number']], 'invoices') +
        '<div class="list" data-invoices>' + (head ? '' : '<div class="lrow label" style="--cols:' + COLS + '"><span>Invoice</span><span style="text-align:right">Before GST</span><span style="text-align:right">GST 18%</span><span style="text-align:right">Total</span><span style="text-align:right">Received</span><span>Due</span><span>Stage</span><span></span></div>') +
        list.map(function (q) {
          var v = q.o, du = dueOn(A, v), st = q.over ? 'Overdue' : v.stage, act = '';
          if (!head) {
            if (v.stage === 'Draft') act = '<button class="btn btn--sm btn--next" type="button" data-do="vcheck" data-v="' + v.id + '">' + A.ico('check') + 'Checked by Finance</button>';
            else if (v.stage === 'Checked by Finance') act = '<button class="btn btn--sm btn--next" type="button" data-do="vsend" data-v="' + v.id + '">' + A.ico('send') + 'Mark sent</button>';
            else if (openAmt(v) > 0) act = '<button class="btn btn--sm" type="button" data-do="vrecv" data-v="' + v.id + '">Record received</button>' + (q.over ? '<button class="btn btn--sm btn--ghost" type="button" data-do="vremind" data-v="' + v.id + '">Payment reminder</button>' : '');
          }
          return '<div class="lrow" data-inv="' + v.id + '" style="--cols:' + COLS + '"><div class="cell-who"><span class="av av--lg">' + A.ico('file-invoice', 'i--sm') + '</span><div><b>' + A.esc(v.brand) + '</b><span>' + (v.no || 'Draft') + ' . ' + A.esc((byId(D.projects, v.project) || {}).name || '') + '</span></div></div>' +
            (head ? '<span>' + (du ? 'Due ' + A.dayWord(du + 'T00:00') : 'Not sent') + '</span>' : cell(v.amount, 'a') + cell(gstOf(v), 'g') + cell(totOf(v), 't') + cell(v.received, 'r') + '<span>' + (du ? A.dayWord(du + 'T00:00') : 'Not sent') + '</span>') +
            '<span class="chip' + (q.over ? ' chip--red' : v.stage === 'Paid' ? ' chip--green' : v.stage === 'Draft' ? ' chip--amber' : '') + '">' + st + '</span>' + (head ? '' : '<span style="display:flex;gap:4px;flex-wrap:wrap">' + act + '</span>') + '</div>';
        }).join('') +
        (head ? '' : '<div class="lrow" data-invtotal style="--cols:' + COLS + ';font-weight:600"><span>Total, ' + list.length + ' invoices</span>' + cell(sum(function (v) { return v.amount; }), 'a') + cell(sum(gstOf), 'g') + cell(sum(totOf), 't') + cell(sum(function (v) { return v.received; }), 'r') + '<span></span><span></span><span></span></div>') + '</div>' + foot(A, list.length, rows.length, 'invoices');
    }
    if (MONT === 'age') {
      var by = {}; D.invoices.forEach(function (v) { var o = openAmt(v); if (!o) return; var n = A.daysBetween(v.issued, A.TODAY), b = BUCKETS.filter(function (x) { return n >= x[1] && n <= x[2]; })[0]; by[v.brand] = by[v.brand] || [0, 0, 0, 0]; by[v.brand][BUCKETS.indexOf(b)] += o; });
      var names = Object.keys(by).sort(), tot = [0, 0, 0, 0]; names.forEach(function (b) { by[b].forEach(function (x, i) { tot[i] += x; }); });
      var all = tot.reduce(function (a, b) { return a + b; }, 0), C = 'minmax(0,1fr) repeat(5,120px)';
      html += '<article class="card money-card"><div class="card-head"><h2 class="h-sec">To collect</h2>' + (tot[2] + tot[3] ? '<span class="chip chip--red">' + rupees(tot[2] + tot[3]) + ' over 60 days</span>' : '') + '</div><div class="money-big"><span class="fig fig--xl num" data-agetotal>' + rupees(all) + '</span></div>' +
        '<div class="ageing">' + BUCKETS.map(function (b, i) { return '<div class="age"><div class="bar' + (i > 1 ? ' bar--red' : '') + '"><i style="--p:' + (all ? Math.round(tot[i] / all * 100) : 0) + '"></i></div><span>' + b[0] + '</span><b>' + rupees(tot[i]) + '</b></div>'; }).join('') + '</div></article>' +
        '<div class="list" data-ageing><div class="lrow label" style="--cols:' + C + '"><span>Brand</span>' + BUCKETS.map(function (b) { return '<span style="text-align:right">' + b[0] + '</span>'; }).join('') + '<span style="text-align:right">Total</span></div>' +
        names.map(function (b) { return '<div class="lrow" data-agerow="' + A.esc(b) + '" style="--cols:' + C + '"><b>' + A.esc(b) + '</b>' + by[b].map(function (x, i) { return cell(x, 'b' + i); }).join('') + cell(by[b].reduce(function (a, c) { return a + c; }, 0), 't') + '</div>'; }).join('') +
        '<div class="lrow" data-agesum style="--cols:' + C + ';font-weight:600"><span>Total</span>' + tot.map(function (x, i) { return cell(x, 'b' + i); }).join('') + cell(all, 't') + '</div></div><p class="f-help">Age is days since the invoice was sent. Money still to collect only: total with GST less what is received.</p>';
    }
    if (MONT === 'pay') {
      var prow = D.payouts.map(function (p) { return { o: p, f: { st: p.stage, pt: p.ptype }, text: [p.no, p.payee, (byId(D.projects, p.project) || {}).brand].join(' '), date: '', any: { amount: p.amount, payee: p.payee } }; });
      var pl = fpass(A, 'pay', prow), PC = 'minmax(200px,1fr) repeat(3,88px) 180px 110px 130px', ps = function (f) { return pl.reduce(function (s, q) { return s + f(q.o); }, 0); };
      html += fbar(A, 'pay', prow, [['st', 'Stage'], ['pt', 'Paying']], [['amount', 'Amount'], ['payee', 'Payee']], 'payouts') +
        '<div class="list" data-payouts><div class="lrow label" style="--cols:' + PC + '"><span>Payout</span><span style="text-align:right">Amount</span><span style="text-align:right">TDS</span><span style="text-align:right">To pay</span><span>Documents</span><span>Stage</span><span></span></div>' +
        pl.map(function (q) { var p = q.o, pr = byId(D.projects, p.project) || {};
          return '<div class="lrow" data-payout="' + p.id + '" style="--cols:' + PC + '"><div class="cell-who"><span class="av av--lg">' + A.ico('currency-rupee', 'i--sm') + '</span><div><b>' + A.esc(p.payee) + '</b><span>' + p.no + ' . ' + A.esc(p.ptype + ' . ' + (pr.brand || '')) + '</span></div></div>' +
            cell(p.amount, 'a') + cell(tdsOf(p), 'd') + cell(p.amount - tdsOf(p), 'n') +
            '<span>' + [['Live link', p.ptype !== 'Influencer' || p.docs.live], ['Invoice', p.docs.inv], ['PAN', p.docs.pan]].filter(function (x) { return x[0] !== 'Live link' || p.ptype === 'Influencer'; }).map(function (x) { return '<span class="chip' + (x[1] ? ' chip--green' : ' chip--red') + '">' + x[0] + '</span>'; }).join(' ') + '</span>' +
            '<span class="chip' + (p.stage === 'Paid' ? ' chip--green' : p.stage === 'Approved' ? ' chip--blue' : ' chip--amber') + '" data-pst>' + p.stage + (p.back ? ', sent back' : '') + '</span>' +
            '<span>' + (p.stage === 'Approved' && r === 'Finance' ? '<button class="btn btn--sm btn--next" type="button" data-do="ppaid" data-po="' + p.id + '">Record paid</button>' : p.stage === 'Paid' ? '<span class="faint">' + A.esc(p.bank) + '</span>' : '') + '</span></div>'; }).join('') +
        '<div class="lrow" data-paytotal style="--cols:' + PC + ';font-weight:600"><span>Total, ' + pl.length + ' payouts</span>' + cell(ps(function (p) { return p.amount; }), 'a') + cell(ps(tdsOf), 'd') + cell(ps(function (p) { return p.amount - tdsOf(p); }), 'n') + '<span></span><span></span><span></span></div></div>' +
        '<p class="f-help">TDS rates are placeholders until Farhan confirms them. Only Finance records Paid, and only after the payout is Approved.</p>' + foot(A, pl.length, prow.length, 'payouts');
    }
    if (MONT === 'margin') {
      var MC = 'minmax(0,1fr) repeat(5,110px) 48px', T = [0, 0, 0, 0, 0];
      var mrows = D.projects.map(function (p) {
        var fee = Math.round(p.fee * 1e5), po = D.payouts.filter(function (x) { return x.project === p.id && /^(Approved|Paid)$/.test(x.stage); }).reduce(function (s, x) { return s + x.amount; }, 0);
        var hm = D.hampers.filter(function (h) { return h.project === p.id; }).reduce(function (s, h) { return s + h.value; }, 0), ex = D.expenses.filter(function (e) { return e.project === p.id && e.status === 'Approved'; }).reduce(function (s, e) { return s + e.amount; }, 0);
        var m = [fee, po, hm, ex, fee - po - hm - ex]; m.forEach(function (x, i) { T[i] += x; }); return { p: p, m: m };
      });
      html += '<div class="list" data-margin><div class="lrow label" style="--cols:' + MC + '"><span>Project</span>' + ['Fee', 'Payouts', 'Hampers', 'Expenses', 'Margin'].map(function (h) { return '<span style="text-align:right">' + h + '</span>'; }).join('') + '<span>%</span></div>' +
        mrows.map(function (x) { return '<div class="lrow" data-mrow="' + x.p.id + '" style="--cols:' + MC + '"><a href="#/project/' + x.p.id + '"><b>' + A.esc(x.p.name) + '</b></a>' + x.m.map(function (v, i) { return cell(v, 'm' + i); }).join('') + '<span class="num">' + (x.m[0] ? Math.round(x.m[4] / x.m[0] * 100) : 0) + '%</span></div>'; }).join('') +
        '<div class="lrow" data-mtotal style="--cols:' + MC + ';font-weight:600"><span>Total</span>' + T.map(function (v, i) { return cell(v, 'm' + i); }).join('') + '<span class="num">' + (T[0] ? Math.round(T[4] / T[0] * 100) : 0) + '%</span></div></div>' +
        '<p class="f-help">Margin = fee less approved or paid payouts, hamper values and approved expenses. Maddie and Finance only.</p>';
    }
    return '<section class="card" data-b4="money" style="display:flex;flex-direction:column;gap:var(--s-3)">' + html + '</section>';
  };

  /* ---------------- actions ---------------- */
  function invHist(A, v, w) { hist(A, v, w); }
  var prevAct = S._act;
  S._act = function (act, a, A) {
    var D = A.D(), ap = byId(D.approvals, a.getAttribute('data-a')), h = byId(D.hampers, a.getAttribute('data-h')), v = byId(D.invoices, a.getAttribute('data-v'));
    if (act === 'aok' && ap) return decide(A, ap.id, true);
    if (act === 'aback' && ap) { if (ap.status !== 'Waiting') return decide(A, ap.id, false, 'x'); return reasonDialog(A, ap, function (w) { decide(A, ap.id, false, w); }); }
    if (act === 'aresub' && ap) return resubmit(A, ap.id);
    if (act === 'aask') return askDialog(A, {});
    if (act === 'rsquick') { var ta = a.closest('dialog').querySelector('[name=why]'); ta.value = a.textContent; return; }
    if (act === 'hnext' && h) return hamperNext(A, h);
    if (act === 'hlink' && h) {
      var inp = d.querySelector('[data-hlink]'), lk = inp.value.trim();
      if (!/^https?:\/\/\S+\.\S+/.test(lk)) { inp.setAttribute('aria-invalid', 'true'); A.toast('Paste the live link, starting with https://'); return; }
      h.proof.link = lk; hist(A, h, 'Live link added: ' + lk); if (h.stage === 'Delivered') return moveH(A, h, 'Posted');
      A.save(); A.render(); A.toast('Live link saved.'); return;
    }
    if (/^hf(view|download|share)$/.test(act) && h) {
      var f = h.proof.files.filter(function (x) { return x.id === a.getAttribute('data-f'); })[0]; if (!f) return;
      if (act === 'hfshare') return A.toast('Sample: in the build, Share copies a signed link to ' + f.n + ' that opens without a login and stops working after 7 days.');
      var url = URL.createObjectURL(J().blobOf(f));
      if (act === 'hfview') window.open(url, '_blank', 'noopener'); else { var dl = d.createElement('a'); dl.href = url; dl.download = f.data ? f.n : f.n + '.txt'; d.body.appendChild(dl); dl.click(); dl.remove(); }
      return;
    }
    if (act === 'plog') {
      var j = byId(D.journos, a.getAttribute('data-j')), st = d.querySelector('[data-pstory]'), story = st.value.trim();
      if (!story) { st.setAttribute('aria-invalid', 'true'); st.focus(); return; }
      j.pitches.push({ on: A.TODAY, story: story, resp: d.querySelector('[data-presp]').value, by: A.ME() }); hist(A, j, 'Pitched: ' + story);
      A.save(); A.render(); A.toast('Pitch logged. Last pitch is now today.'); return;
    }
    if (act === 'xsample') return xsample(A, a.getAttribute('data-k'));
    if (act === 'xsave' && UP) return xsave(A);
    if (act === 'xcancel') { UP = null; A.render(); return; }
    if (act === 'vcheck' && v) { v.stage = 'Checked by Finance'; invHist(A, v, 'Checked by ' + A.me().name); A.save(); A.render(); A.toast('Checked. Mark it sent when it goes to ' + v.brand + '.'); return; }
    if (act === 'vsend' && v) {
      v.stage = 'Sent'; v.issued = A.TODAY; v.no = v.no || 'GUC/26-27/0' + (++D.seqNo); invHist(A, v, 'Sent to ' + v.brand + ' as ' + v.no + ' by ' + A.me().name);
      A.save(); A.render(); A.toast(v.no + ' is marked sent. Due in ' + v.due_in + ' days.'); return;
    }
    if (act === 'vrecv' && v) {
      dialog(A, 'dlg-recv', 'Record money received', 'recv', '<p class="lede"><b>' + A.esc(v.no + ', ' + v.brand) + '</b>: ' + rupees(openAmt(v)) + ' still to collect.</p><div class="f-row"><div class="f"><label for="rv-a">Amount received, ₹ <em>*</em></label><input class="input" id="rv-a" name="amount" inputmode="numeric"></div>' +
        '<div class="f"><label for="rv-r">Bank or UPI ref <em>*</em></label><input class="input" id="rv-r" name="ref"></div></div>', 'Record received', '1,50,000 received, UTR HDFC0098812');
      CB['dlg-recv'] = function (dl) { var n = Number(dl.querySelector('[name=amount]').value.replace(/[^\d.]/g, '')), ref = dl.querySelector('[name=ref]').value.trim();
        if (!n || n > openAmt(v)) return 'Put an amount up to ' + rupees(openAmt(v)) + '.'; if (!ref) return 'The bank or UPI ref is needed.';
        v.received += n; v.stage = openAmt(v) ? 'Part paid' : 'Paid'; invHist(A, v, rupees(n) + ' received, ref ' + ref + ', recorded by ' + A.me().name); A.save(); A.render(); A.toast(rupees(n) + ' recorded. ' + v.no + ' is ' + v.stage + '.'); };
      return;
    }
    if (act === 'vremind' && v) {
      var du = dueOn(A, v), late = A.daysBetween(du, A.TODAY);
      dialog(A, 'dlg-remind', 'Payment reminder (sample)', 'remind', '<p class="lede">The Money agent drafted this for <b>' + A.esc(v.brand) + '</b>. It does not send: Finance sends it from the agency Gmail in the build.</p>' +
        '<div class="f"><label for="rm-n">Reminder</label><textarea class="textarea" id="rm-n" name="note" rows="5">Hello, a gentle reminder that invoice ' + v.no + ' for ' + rupees(openAmt(v)) + ' was due on ' + A.dayWord(du + 'T00:00') + ' (' + late + ' days ago). Could you share the payment date? Thank you, Farhan, Glad U Came.</textarea></div>', 'Keep the draft on the invoice', 'Please add that the bank details are on the invoice');
      CB['dlg-remind'] = function () { invHist(A, v, 'Payment reminder drafted by the Money agent, kept by ' + A.me().name + ' (not sent)'); A.save(); A.render(); A.toast('Draft kept on the invoice History. Nothing was sent.'); };
      return;
    }
    if (act === 'ppaid') {
      var po = byId(D.payouts, a.getAttribute('data-po'));
      if (!po || po.stage !== 'Approved' || role(A) !== 'Finance') return A.toast('Only Finance records Paid, and only after the payout is Approved.');
      dialog(A, 'dlg-paid', 'Record paid', 'paid', '<p class="lede"><b>' + A.esc(po.payee) + '</b>: pay ' + rupees(po.amount - tdsOf(po)) + ' (' + rupees(po.amount) + ' less TDS ' + rupees(tdsOf(po)) + ') at the bank, then record it here.</p><div class="f"><label for="pd-r">Bank ref <em>*</em></label><input class="input" id="pd-r" name="ref"></div>', 'Record paid', 'Paid by NEFT, ref SBIN0026114');
      CB['dlg-paid'] = function (dl) { var ref = dl.querySelector('[name=ref]').value.trim(); if (!ref) return 'The bank ref is needed.';
        po.stage = 'Paid'; po.bank = ref; hist(A, po, 'Paid, ref ' + ref + ', recorded by ' + A.me().name);
        var p = byId(D.projects, po.project), x = p && p.lines.filter(function (l) { return l.h === po.payee; })[0]; if (x) x.payout = 'Paid'; if (p) hist(A, p, 'Payout ' + po.no + ' to ' + po.payee + ' paid, ref ' + ref);
        D.tasks.forEach(function (t) { if (t.payout === po.id && A.OPEN[t.status]) { t.status = 'done'; t.done_at = A.now(); t.history.push({ at: A.now(), who: A.ME(), what: 'Done: paid' }); } });
        A.save(); A.render(); A.toast(po.payee + ' is Paid.'); };
      return;
    }
    if (prevAct) prevAct(act, a, A);
  };
  d.addEventListener('change', function (e) {
    var el = e.target, A = G(); if (!A || !el.getAttribute) return;
    if (el.hasAttribute('data-xup')) xupload(A, el);
    if (el.hasAttribute('data-hfile')) { var h = byId(A.D().hampers, el.getAttribute('data-hfile')); J().readFiles(A, el, function (fs) { fs.forEach(function (f) { h.proof.files.push(f); }); hist(A, h, 'Proof added: ' + fs.map(function (f) { return f.n; }).join(', ')); A.save(); A.render(); A.toast(fs.length + ' file' + (fs.length === 1 ? '' : 's') + ' added. Mark Posted when it is up.'); }); }
  });

  window.GUC_APPR = { raise: raise, decide: decide, resubmit: resubmit, pricingGate: pricingGate, reasonDialog: reasonDialog, approverFor: approverFor, sweep: sweep };
})();
