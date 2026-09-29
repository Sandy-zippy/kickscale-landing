/* The demo story. Hand-written, never generated, so every walkthrough tells
   the same story: a pharma Diwali brief under UCPMP, a quote gone quiet, a
   vendor slipping on a live order, a short delivery, last year's client coming
   round again. Dates are relative to today so the story is always current.
   Products are found by searching the (deterministic) catalogue, so the seed
   never hard-codes an id that the generator might not produce.

   Everything here is sample data. The UI labels it so. */
(function (root) {
  'use strict';
  var node = typeof module !== 'undefined' && module.exports;

  function build(GC, E, db) {
    var T = GC.T, t0 = GC.today();
    var ago = function (n) { return GC.addDays(t0, -n); };
    var ahead = function (n) { return GC.addDays(t0, n); };
    var edits = {};
    var P = function (id) {
      var it = db.byId[id];
      return it ? GC.product(it, db, edits[id]) : null;
    };
    /* the i-th result for a plain-English query — stable, because the catalogue is */
    var find = function (phrase, i, extra) {
      var blank = function () { return { cat: new Set(), vendor: new Set(), occ: new Set(), rec: new Set(), pack: new Set(), attr: new Set() }; };
      var ex = E.interpret(extra || '', db);
      var tries = [E.interpret(phrase + ' ' + (extra || ''), db),
                   Object.assign(blank(), { min: ex.min, max: ex.max, attr: ex.attr }), blank()];
      for (var k = 0; k < tries.length; k++) {
        tries[k].text = [phrase.toLowerCase()];
        var r = E.search(db, tries[k]).results;
        if (r.length) return r[Math.min(i || 0, r.length - 1)].id;
      }
      throw new Error('seed: nothing in the catalogue called "' + phrase + '"');
    };

    var D = {
      companies: [], contacts: [], opps: [], orders: [], followups: [], messages: [], rfqs: [],
      issues: [], proposals: [], runs: [], automations: [], templates: [], campaigns: [],
      warehouse: {}, stockMoves: [], vendorEdits: {}, productEdits: edits, newProducts: [],
      activity: []
    };

    function company(name, o, contacts) {
      var c = GC.newCompany(Object.assign({ name: name }, o));
      D.companies.push(c);
      (contacts || []).forEach(function (x, i) {
        D.contacts.push(GC.newContact({ company: c.id, name: x[0], mobile: x[1], email: x[2], role: x[3] || 'Buyer', primary: i === 0, created: o.created }));
      });
      return c;
    }
    function contactOf(c) { return D.contacts.filter(function (x) { return x.company === c.id; })[0]; }
    function opp(c, o, picks) {
      var ct = contactOf(c);
      var x = GC.newOpp(Object.assign({ company: c.id, contact: ct && ct.id, assigned_to: c.assigned_to, branch: c.branch, source: c.source }, o));
      (picks || []).forEach(function (p) { var l = GC.addLine(x, p[0], p[1] || x.brief.qty); if (p[2]) l.mark = p[2]; if (p[3]) l.branding = p[3]; });
      D.opps.push(x);
      return x;
    }
    function quote(x, at) {
      var q = GC.buildQuote(x, P, { by: x.assigned_to });
      q.at = at; q.status = 'sent'; q.validTill = GC.addDays(at, 15);
      x.quotes.push(q);
      return q;
    }
    var seq = 2026100;
    function order(c, title, picks, o) {
      var tmp = GC.newOpp({ company: c.id, brief: { qty: picks[0][1] } });
      picks.forEach(function (p) { var l = GC.addLine(tmp, p[0], p[1]); if (p[2]) l.branding = p[2]; });
      var q = GC.buildQuote(tmp, P);
      var ct = contactOf(c);
      var ord = GC.newOrder(Object.assign({ no: 'RC-' + (seq++), company: c.id, contact: ct && ct.id, title: title,
        lines: q.lines, value: q.total, cost: q.cost, assigned_to: c.assigned_to, branch: c.branch }, o));
      ord.history = [{ stage: T.orderStages[0], at: ord.created, by: c.assigned_to }];
      if (ord.stage !== T.orderStages[0]) ord.history.push({ stage: ord.stage, at: ord.updated, by: 'u6' });
      D.orders.push(ord);
      return ord;
    }
    function vpo(ord, pid, eta, status) {
      var p = P(pid);
      ord.vendorPOs.push({ id: GC.uid('vp'), vendor: p.vendor, vendorName: p.vendorName, pids: [pid], eta: eta, status: status || 'placed', placed: ord.created });
    }
    function follow(x, days, note, owner, done, outcome) {
      D.followups.push(GC.newFollow({ opp: x.id, company: x.company, owner: owner || x.assigned_to, due: GC.addDays(t0, days),
        method: 'Call', note: note, done: !!done, done_at: done ? GC.addDays(t0, days) : null, outcome: outcome || null, by: owner || x.assigned_to }));
    }

    /* ---------- the clients ---------- */

    var medilux = company('Medilux Pharma Ltd', { industry: 'Pharmaceuticals', city: 'Mumbai', pharma: true, source: 'referral', assigned_to: 'u3', created: ago(420),
      dates: [{ label: 'Doctors\' Day (1 Jul)', date: '2027-07-01' }] },
      [['Anita Desai', '9820145566', 'anita.desai@medilux.example', 'Buyer'], ['Dr. Vikram Sethi', '9820198877', 'vikram.sethi@medilux.example', 'Approver']]);
    var zentrix = company('Zentrix Technologies Pvt Ltd', { industry: 'IT services', city: 'Pune', source: 'linkedin', assigned_to: 'u4', branch: 'b2', created: ago(60) },
      [['Karan Joshi', '9767012345', 'karan.joshi@zentrix.example', 'HR / Admin'], ['Megha Kulkarni', '9767098765', 'megha.k@zentrix.example', 'Payer']]);
    var sahyadri = company('Sahyadri Finance Ltd', { industry: 'Financial services', city: 'Mumbai', source: 'repeat', assigned_to: 'u3', created: ago(700) },
      [['Rajesh Nair', '9892233445', 'rajesh.nair@sahyadri.example', 'Procurement']]);
    var nexa = company('Nexa Realty Group', { industry: 'Real estate', city: 'Thane', source: 'expo', assigned_to: 'u2', created: ago(300) },
      [['Farah Khan', '9833112244', 'farah@nexarealty.example', 'Founder / CXO']]);
    var bluepeak = company('BluePeak Logistics', { industry: 'Logistics', city: 'Navi Mumbai', source: 'website', assigned_to: 'u4', branch: 'b2', created: ago(45) },
      [['Suresh Iyer', '9870011122', 'suresh.iyer@bluepeak.example', 'HR / Admin']]);
    var orbit = company('Orbit Consulting LLP', { industry: 'Consulting', city: 'Mumbai', source: 'email', assigned_to: 'u3', created: ago(3) },
      [['Nisha Menon', '9819933221', 'nisha@orbitconsulting.example', 'Buyer']]);
    var veda = company('Veda Hospitals', { industry: 'Healthcare', city: 'Pune', pharma: false, source: 'indiamart', assigned_to: 'u4', branch: 'b2', created: ago(38) },
      [['Dr. Asha Patwardhan', '9822334455', 'asha.p@vedahospitals.example', 'Approver'], ['Manoj Deshpande', '9822556677', 'manoj.d@vedahospitals.example', 'Procurement']]);
    var aarav = company('Aarav Motors', { industry: 'Automobile dealership', city: 'Mumbai', source: 'referral', assigned_to: 'u2', created: ago(400) },
      [['Yash Malhotra', '9821456789', 'yash@aaravmotors.example', 'Founder / CXO']]);
    var kiran = company('Kiran Foods Ltd', { industry: 'FMCG', city: 'Mumbai', source: 'email', assigned_to: 'u3', created: ago(90) },
      [['Pooja Shetty', '9869001122', 'pooja.shetty@kiranfoods.example', 'HR / Admin']]);
    var horizon = company('Horizon Bank', { industry: 'Banking', city: 'Mumbai', source: 'linkedin', assigned_to: 'u2', created: ago(75) },
      [['Arjun Kapadia', '9833667788', 'arjun.kapadia@horizonbank.example', 'HR / Admin']]);
    var titanium = company('Titanium Steel Works', { industry: 'Manufacturing', city: 'Mumbai', source: 'tradeindia', assigned_to: 'u4', created: ago(110) },
      [['Ramesh Gupta', '9820778899', 'ramesh.gupta@titaniumsteel.example', 'Procurement']]);
    var lotus = company('Lotus General Insurance', { industry: 'Insurance', city: 'Mumbai', source: 'referral', assigned_to: 'u3', created: ago(160) },
      [['Sneha Pillai', '9820556644', 'sneha.pillai@lotusgi.example', 'Payer']]);

    /* ---------- past orders: these set each client's tier ---------- */

    var pastSahyadri = order(sahyadri, 'Diwali 2025 — client hampers', [[find('diwali hamper', 2, 'premium above 2500'), 500, 'Ribbon & tag'], [find('dry fruit gift box', 1, 'premium'), 300]],
      { stage: 'Paid', created: ago(330), updated: ago(300), deadline: ago(318), artwork: { status: 'approved', sent: ago(328), approved: ago(327), file: 'sahyadri-logo.pdf' }, qc: { status: 'passed', note: '' },
        dispatches: [{ city: 'Mumbai', qty: 1000, status: 'delivered', awb: 'DTDC 7788120', at: ago(319) }], invoice: { no: 'INV/25-26/0412', at: ago(318), amount: 0 }, paid: { at: ago(300) } });
    pastSahyadri.invoice.amount = pastSahyadri.value;
    var pastNexa = order(nexa, 'Site-launch welcome gifts', [[find('copper bottle', 0), 400, 'Laser engraving']],
      { stage: 'Paid', created: ago(140), updated: ago(110), deadline: ago(125), artwork: { status: 'approved', sent: ago(138), approved: ago(137), file: 'nexa.ai' }, qc: { status: 'passed' },
        dispatches: [{ city: 'Thane', qty: 400, status: 'delivered', awb: 'Own van', at: ago(126) }], invoice: { no: 'INV/26-27/0088', at: ago(125), amount: 0 }, paid: { at: ago(110) } });
    pastNexa.invoice.amount = pastNexa.value;
    var pastMedilux = order(medilux, 'CME delegate kits', [[find('doctor\'s desk kit', 0, 'ucpmp'), 800, 'Box printing']],
      { stage: 'Paid', created: ago(250), updated: ago(220), deadline: ago(236), artwork: { status: 'approved', sent: ago(248), approved: ago(247), file: 'medilux.pdf' }, qc: { status: 'passed' },
        dispatches: [{ city: 'Mumbai', qty: 800, status: 'delivered', awb: 'BlueDart 5561', at: ago(237) }], invoice: { no: 'INV/25-26/0301', at: ago(236), amount: 0 }, paid: { at: ago(220) } });
    pastMedilux.invoice.amount = pastMedilux.value;
    /* last year's dealer-meet order: the Reorder agent should wake for this one */
    var pastAarav = order(aarav, 'Dealer meet — awards & gifts', [[find('crystal award', 0), 120, 'Laser engraving'], [find('bluetooth speaker', 0, 'premium'), 120, 'Laser engraving']],
      { stage: 'Paid', created: ago(340), updated: ago(310), deadline: ago(326), artwork: { status: 'approved', sent: ago(338), approved: ago(337), file: 'aarav.pdf' }, qc: { status: 'passed' },
        dispatches: [{ city: 'Mumbai', qty: 240, status: 'delivered', awb: 'Own van', at: ago(327) }], invoice: { no: 'INV/25-26/0433', at: ago(326), amount: 0 }, paid: { at: ago(310) } });
    pastAarav.invoice.amount = pastAarav.value;

    /* ---------- live orders on the second board ---------- */

    // A vendor slips: goods promised after the client's deadline.
    var kiranOrder = order(kiran, 'Diwali — employee gift boxes × 600', [[find('dry fruit gift box', 3, 'under 1200'), 600, 'Box printing'], [find('brass diya set', 0, 'under 600'), 600]],
      { stage: 'Goods in & QC', created: ago(14), updated: ago(2), deadline: ahead(12), artwork: { status: 'sent', sent: ago(3), approved: null, file: 'kiran-foods-box-v2.pdf' }, qc: { status: 'pending' } });
    vpo(kiranOrder, kiranOrder.lines[0].pid, ahead(4), 'received');
    vpo(kiranOrder, kiranOrder.lines[1].pid, ahead(14), 'placed');
    kiranOrder.vendorPOs[0].status = 'received'; kiranOrder.vendorPOs[0].receivedAt = ago(2); kiranOrder.vendorPOs[0].receivedWh = 'w2';

    // Employees pick their own gift.
    var horizonPicks = [find('smartwatch', 0, 'under 2500'), find('bluetooth speaker', 2, 'under 2500'), find('laptop backpack', 1, 'under 2500'), find('vacuum flask', 0)];
    var horizonOrder = order(horizon, 'Employee choice — 180 staff, ₹2,500 budget', horizonPicks.map(function (id) { return [id, 45, 'Laser engraving']; }),
      { stage: 'Vendor POs placed', created: ago(9), updated: ago(6), deadline: ahead(20), artwork: { status: 'sent', sent: ago(2), approved: null, file: 'horizon-bank-logo.svg' } });
    horizonPicks.forEach(function (id) { vpo(horizonOrder, id, ahead(9)); });
    horizonOrder.picks = { code: 'HORIZON26', budget: 2500, employees: 180, closes: ahead(5), options: horizonPicks,
      entries: [['Aditi Rao', 'HB1042', 0, 'Mumbai'], ['Vivek Sharma', 'HB1107', 1, 'Mumbai'], ['Leena George', 'HB1133', 2, 'Pune'],
                ['Samir Khan', 'HB1150', 0, 'Mumbai'], ['Priti Jain', 'HB1188', 3, 'Mumbai'], ['Anil Verma', 'HB1204', 1, 'Pune'],
                ['Divya Menon', 'HB1219', 0, 'Mumbai'], ['Harsh Vora', 'HB1240', 2, 'Mumbai']].map(function (e) {
        return { name: e[0], emp: e[1], pid: horizonPicks[e[2]], city: e[3], at: ago(1) }; }) };

    // Multi-city dispatch with a short delivery at one location.
    var titaniumOrder = order(titanium, 'Safety week — awards + jackets', [[find('winter jacket', 0), 300, 'Embroidery'], [find('metal memento', 0), 30, 'Laser engraving']],
      { stage: 'Dispatched', created: ago(28), updated: ago(3), deadline: ahead(2), artwork: { status: 'approved', sent: ago(24), approved: ago(23), file: 'titanium.pdf' }, qc: { status: 'passed', note: '' },
        dispatches: [{ city: 'Mumbai', qty: 180, status: 'delivered', awb: 'Own van', at: ago(3) }, { city: 'Pune', qty: 90, status: 'delivered', awb: 'DTDC 88213', at: ago(2) },
                     { city: 'Chennai', qty: 60, status: 'in transit', awb: 'BlueDart 99120', at: ago(3) }] });
    titaniumOrder.vendorPOs = titaniumOrder.lines.map(function (l) { var p = P(l.pid); return { id: GC.uid('vp'), vendor: p.vendor, vendorName: p.vendorName, pids: [l.pid], eta: ago(12), status: 'received', placed: ago(26), receivedAt: ago(12), receivedWh: 'w2' }; });

    // Invoiced 40 days ago, unpaid — the accounts story.
    var lotusOrder = order(lotus, 'Agent-of-the-year awards', [[find('crystal award', 2), 50, 'Laser engraving'], [find('fountain pen', 0), 50, 'Laser engraving']],
      { stage: 'Invoiced', created: ago(62), updated: ago(40), deadline: ago(44), artwork: { status: 'approved', sent: ago(58), approved: ago(57), file: 'lotus.pdf' }, qc: { status: 'passed' },
        dispatches: [{ city: 'Mumbai', qty: 100, status: 'delivered', awb: 'Own van', at: ago(45) }], invoice: { no: 'INV/26-27/0131', at: ago(40), amount: 0 } });
    lotusOrder.invoice.amount = lotusOrder.value;
    lotusOrder.vendorPOs = lotusOrder.lines.map(function (l) { var p = P(l.pid); return { id: GC.uid('vp'), vendor: p.vendor, vendorName: p.vendorName, pids: [l.pid], eta: ago(50), status: 'received', placed: ago(60), receivedAt: ago(50), receivedWh: 'w2' }; });

    /* ---------- the sales board ---------- */

    // UCPMP story: a pharma Diwali brief, captured, waiting for the Curator.
    opp(medilux, { title: 'Diwali — Doctors × 1,200', stage: 'Brief captured', created: ago(1), updated: ago(1), source: 'email',
      brief: { text: 'Diwali gifts for 1200 doctors across Mumbai and Pune, UCPMP compliant, logo branded, under 900 each, deliver by ' + ahead(24),
               occasion: 'Diwali & festive', recipients: 'Doctors & professionals', qty: 1200, budgetMax: 900, deadline: ahead(24),
               cities: ['Mumbai', 'Pune'], branding: 'Logo', ucpmp: true } });

    var zOpp = opp(zentrix, { title: 'Onboarding — Employees × 400', stage: 'Options sent', created: ago(9), updated: ago(4), source: 'linkedin',
      brief: { text: 'Welcome kits for 400 new joiners, eco friendly, logo, around 1500, Pune and Bengaluru', occasion: 'Onboarding', recipients: 'Employees',
               qty: 400, budgetMin: 1200, budgetMax: 1800, deadline: ahead(30), cities: ['Pune', 'Bengaluru'], branding: 'Logo' } },
      [[find('new joiner welcome kit', 0, 'under 1800')], [find('laptop backpack', 0, 'under 1800')], [find('bamboo tumbler', 0)], [find('pen + diary set', 2)]]);
    follow(zOpp, -4, 'Sent 4 options by email. Karan said the backpack looks right but wants to see the welcome kit in person; will share with HR head Megha by Friday.', 'u4', true, 'Wants more options');
    follow(zOpp, 1, 'Call Karan for HR feedback on the four options', 'u4');

    var sOpp = opp(sahyadri, { title: 'Diwali — Leadership & CXOs × 60', stage: 'Quote sent', created: ago(16), updated: ago(7), source: 'repeat',
      brief: { text: 'Premium Diwali gifts for 60 CXOs of our client banks, above 4000 each, deliver by ' + ahead(26), occasion: 'Diwali & festive',
               recipients: 'Leadership & CXOs', qty: 60, budgetMin: 4000, budgetMax: 7000, deadline: ahead(26), cities: ['Mumbai'], branding: 'Ribbon & tag' } },
      [[find('leather messenger bag', 0, 'premium'), 60, 'quoted'], [find('analog wrist watch', 0, 'premium'), 60, 'quoted']]);
    quote(sOpp, ago(7));
    follow(sOpp, -7, 'Quote v1 sent to Rajesh, ₹ total around 5 lakh. He said the board approves on Thursday and asked if we can hold watch stock till then.', 'u3', true, 'Waiting on internal approval');
    follow(sOpp, -2, 'Chase Rajesh on the board decision', 'u3');

    var nOpp = opp(nexa, { title: 'Diwali — Clients × 250', stage: 'Negotiating', created: ago(20), updated: ago(2), source: 'expo',
      brief: { text: 'Diwali gifts for 250 home buyers, premium, 2500 to 3500, logo on box, Thane', occasion: 'Diwali & festive', recipients: 'Clients',
               qty: 250, budgetMin: 2500, budgetMax: 3500, deadline: ahead(28), cities: ['Thane'], branding: 'Box printing' } },
      [[find('diwali hamper', 0, 'between 2500 and 3500'), 250, 'quoted', 'Box printing'], [find('dinner set', 0, 'between 2500 and 3500'), 250, 'rejected']]);
    quote(nOpp, ago(6));
    follow(nOpp, -2, 'Farah asked for a better price on the hamper — wants ₹2,800 landed including GST. Said competitor quoted lower. Will revert with revised quote by Monday.', 'u2', true, 'Asked for a better price');
    follow(nOpp, 0, 'Revised quote to Farah — check with Imran if the hamper vendor can do better', 'u2');

    var bOpp = opp(bluepeak, { title: 'Rewards — Top drivers × 150', stage: 'Sampling', created: ago(12), updated: ago(3), source: 'website',
      brief: { text: 'Rewards for 150 top truck drivers, useful items, under 1500, logo, Navi Mumbai', occasion: 'Rewards & recognition', recipients: 'Employees',
               qty: 150, budgetMax: 1500, deadline: ahead(35), cities: ['Navi Mumbai'], branding: 'Logo' } },
      [[find('vacuum flask', 1), 150, 'sample_sent'], [find('duffle bag', 0, 'under 1500'), 150, 'sample_sent'], [find('power bank', 1, 'under 1500'), 150, 'shortlisted']]);
    bOpp.samples = bOpp.lines.slice(0, 2).map(function (l) { return { pid: l.pid, status: 'delivered', at: ago(2), feedback: '' }; });
    follow(bOpp, 3, 'Collect sample feedback from Suresh', 'u4');

    opp(orbit, { title: 'New Year — Clients × 90', stage: 'Enquiry', created: ago(0), updated: ago(0), source: 'email',
      brief: { text: 'Hi, we need New Year desk gifts for about 90 clients. Something classy. Regards, Nisha' , occasion: 'New Year', recipients: 'Clients', qty: 90 } });

    var vOpp = opp(veda, { title: 'Conference — Delegate kits × 500', stage: 'PO received', created: ago(30), updated: ago(1), source: 'indiamart',
      brief: { text: 'Delegate kits for 500 at our annual medical conference, conference bag + diary + pen, under 700', occasion: 'Conference & events',
               recipients: 'Doctors & professionals', qty: 500, budgetMax: 700, deadline: ahead(18), cities: ['Pune'], branding: 'Screen print', ucpmp: true } },
      [[find('conference bag', 0, 'ucpmp under 700'), 500, 'approved', 'Screen print'], [find('pen + diary set', 0, 'ucpmp under 700'), 500, 'approved', 'Debossing']]);
    quote(vOpp, ago(10));
    follow(vOpp, -1, 'Manoj confirmed on call — PO RC/VEDA/0925 coming by email today. Wants dispatch in two lots.', 'u4', true, 'Ready to send PO');

    var lostOpp = opp(lotus, { title: 'Diwali — Agents × 900', stage: 'Lost', created: ago(50), updated: ago(35), source: 'referral',
      brief: { text: 'Diwali sweets for 900 agents under 500', qty: 900, budgetMax: 500, occasion: 'Diwali & festive', recipients: 'Dealers & channel partners' } },
      [[find('mithai & namkeen box', 0, 'under 500'), 900, 'quoted']]);
    lostOpp.outcome = 'lost'; lostOpp.lost_reason = 'Price too high'; lostOpp.closed = ago(35);

    // the Veda PO is in hand; ops will win it in the demo. A past won opp for Kiran:
    var kOpp = opp(kiran, { title: kiranOrder.title, stage: 'Won', created: ago(30), updated: ago(14), source: 'email', brief: { qty: 600, deadline: kiranOrder.deadline } },
      kiranOrder.lines.map(function (l) { return [l.pid, l.qty, 'approved']; }));
    kOpp.outcome = 'won'; kOpp.closed = ago(14); kOpp.order = kiranOrder.id; kiranOrder.opp = kOpp.id; kOpp.po_no = kiranOrder.po_no = 'KF/PO/2291';
    horizonOrder.po_no = 'HB/ADM/0417'; titaniumOrder.po_no = 'TSW-4471'; lotusOrder.po_no = 'LGI/PR/1188';

    /* ---------- the inbox: raw enquiries the Brief agent reads ---------- */

    var msg = function (channel, source, from, text, hoursAgo) {
      D.messages.push({ id: GC.uid('m'), channel: channel, source: source, from: from, text: text,
        at: new Date(Date.now() - hoursAgo * 3600000).toISOString(), status: 'pending' });
    };
    msg('Email', 'email', { name: 'Priyanka Rao', email: 'priyanka.rao@quantumlabs.example' },
      'Hello Royale team,\n\nWe are onboarding 300 new joiners across Bengaluru and Pune next month and need eco-friendly welcome kits with our logo printed. Budget is around 1500 per kit. We need everything delivered by ' +
      ahead(26).slice(8) + ' ' + ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+ahead(26).slice(5, 7)] +
      '.\n\nCould you share options?\n\nRegards,\nPriyanka Rao\nHR Manager, Quantum Labs Pvt Ltd\n+91 98450 22117', 2);
    msg('WhatsApp', 'whatsapp', { name: 'Rahul Bhatia', mobile: '9821077345' },
      'Hi, this is Rahul Bhatia from Crest Motors. Need premium Diwali gifts for 80 dealers, under 3000 each, deliver before Diwali to Mumbai, Thane and Nashik. Logo engraving if possible.', 5);
    msg('IndiaMART', 'indiamart', { name: 'Sanjay Kulkarni', mobile: '9890012233', company: 'Aurum Pharma Pvt Ltd' },
      'Requirement: 1000 pcs conference bags for CME programme, our doctors, must be UCPMP compliant. Pune delivery in 20 days. Aurum Pharma Pvt Ltd.', 20);
    msg('Website form', 'website', { name: 'Meera', email: 'meera@gmail.com' },
      'Need gifts for clients. Please call.', 30);

    /* ---------- follow-ups, general ---------- */

    D.followups.push(GC.newFollow({ company: aarav.id, owner: 'u2', due: ahead(4), method: 'Call', note: 'Courtesy call to Yash — ask about this year\'s dealer meet' }));

    /* ---------- a client issue: short delivery in Chennai ---------- */

    D.issues.push(GC.newIssue({ company: titanium.id, order: titaniumOrder.id, kind: 'Short delivery', severity: 'high', opened: ago(1),
      assigned_to: 'u4', text: 'Chennai plant says 54 jackets arrived against 60 on the challan.',
      log: [{ at: ago(1), by: 'u4', text: 'Logged from Ramesh Gupta\'s call. Asked BlueDart for the POD and carton count.' }] }));
    D.issues.push(GC.newIssue({ company: pastNexa.company, order: pastNexa.id, kind: 'Wrong branding / logo', severity: 'medium', status: 'resolved',
      opened: ago(126), resolved: ago(124), assigned_to: 'u2', text: 'Old logo engraved on 12 bottles.',
      log: [{ at: ago(124), by: 'u2', text: 'Re-engraved and replaced within 48 hours. Client happy.' }] }));

    /* ---------- warehouse: ready stock and movements ---------- */

    [kiranOrder, horizonOrder, titaniumOrder].forEach(function (o) {
      o.lines.forEach(function (l) {
        var got = o.vendorPOs.some(function (v) { return v.pids.indexOf(l.pid) >= 0 && v.status === 'received'; });
        if (!got) return;
        D.warehouse[l.pid] = { w2: o === titaniumOrder ? 0 : l.qty };
        D.stockMoves.push({ id: GC.uid('sm'), pid: l.pid, qty: l.qty, kind: 'GRN', ref: o.no, wh: 'w2', at: o === kiranOrder ? ago(2) : ago(12), by: 'u6' });
        if (o === titaniumOrder) D.stockMoves.push({ id: GC.uid('sm'), pid: l.pid, qty: -l.qty, kind: 'Dispatch', ref: o.no, wh: 'w2', at: ago(3), by: 'u6' });
      });
    });
    [find('diwali hamper', 0, 'premium'), find('conference bag', 0), find('coffee mug', 0), find('cotton polo t-shirt', 0), find('executive diary', 0)].forEach(function (pid, i) {
      D.warehouse[pid] = D.warehouse[pid] || {};
      D.warehouse[pid].w2 = (D.warehouse[pid].w2 || 0) + [120, 800, 300, 450, 600][i];
      D.stockMoves.push({ id: GC.uid('sm'), pid: pid, qty: [120, 800, 300, 450, 600][i], kind: 'GRN', ref: 'Stock buy', wh: 'w2', at: ago(20 + i * 3), by: 'u6' });
    });

    /* ---------- automations ---------- */

    var auto = function (name, trigger, actions, o) {
      D.automations.push(Object.assign({ id: GC.uid('a'), name: name, on: true, trigger: trigger, actions: actions,
        tiers: [], sources: [], conds: [], pharmaOnly: false, runs: 0, last: null }, o || {}));
    };
    auto('Every new enquiry → Brief agent', { type: 'new_enquiry', channel: 'any' }, [{ type: 'run_agent', agent: 'brief' }], { runs: 41, last: ago(0) });
    auto('Brief captured → curate a shortlist', { type: 'brief_captured' }, [{ type: 'run_agent', agent: 'curator' }, { type: 'notify_person', who: 'owner-of-deal', text: 'Shortlist ready to review' }], { runs: 33, last: ago(1) });
    auto('Before any quote → compliance check', { type: 'quote_sent' }, [{ type: 'run_agent', agent: 'compliance' }], { runs: 27, last: ago(6) });
    auto('Quote unanswered 5 days → nudge', { type: 'quote_stale', days: 5 }, [{ type: 'run_agent', agent: 'followup' }, { type: 'followup', due_in_days: 2, text: 'Chase the quote' }], { runs: 12, last: ago(2) });
    auto('Sample delivered → ask for feedback in 2 days', { type: 'sample_delivered' }, [{ type: 'wait', hours: 48 }, { type: 'wa_template', template: 'sample_feedback' }], { tiers: ['Prospect', 'Active', 'Key account'], runs: 9, last: ago(3) });
    auto('PO received → vendor POs + ops alert', { type: 'po_received' }, [{ type: 'notify_role', role: 'ops', text: 'New order — place vendor POs today' }, { type: 'run_agent', agent: 'sourcing' }], { runs: 14, last: ago(9) });
    auto('Vendor slips → order watch + client update', { type: 'vendor_delay' }, [{ type: 'run_agent', agent: 'orderwatch' }, { type: 'portal_update', text: 'Revised delivery plan' }], { tiers: ['Strategic', 'Key account', 'Active', 'Prospect'], runs: 4, last: ago(1) });
    auto('Artwork unapproved 2 days → remind client', { type: 'artwork_pending', days: 2 }, [{ type: 'wa_template', template: 'artwork_reminder' }], { tiers: ['Strategic', 'Key account', 'Active', 'Prospect'], runs: 6, last: ago(1) });
    auto('Delivered → thank-you + review', { type: 'delivered' }, [{ type: 'wa_template', template: 'delivery_thanks' }], { tiers: ['Strategic', 'Key account', 'Active'], runs: 18, last: ago(2) });
    auto('Invoice unpaid 30 days → accounts', { type: 'invoice_overdue', days: 30 }, [{ type: 'notify_role', role: 'accounts', text: 'Chase payment' }, { type: 'email', text: 'Gentle payment reminder' }], { tiers: ['Active', 'Key account'], runs: 5, last: ago(10) });
    auto('45 days before last year\'s order → Reorder agent', { type: 'reorder_due', days: 45 }, [{ type: 'run_agent', agent: 'reorder' }], { runs: 7, last: ago(4) });
    auto('Every day 9:00 → Morning brief', { type: 'schedule', at: '09:00' }, [{ type: 'run_agent', agent: 'morning' }], { runs: 88, last: ago(0) });
    auto('Diwali push — Strategic & Key accounts', { type: 'schedule', at: '10:00' }, [{ type: 'audience', name: 'Diwali 2026' }, { type: 'wa_template', template: 'diwali_lookbook' }], { tiers: ['Strategic', 'Key account'], on: false, runs: 0 });

    /* ---------- WhatsApp templates (Meta approval states are illustrative) ---------- */

    var tpl = function (key, cat, status, text, buttons) { D.templates.push({ key: key, cat: cat, lang: 'en', status: status, text: text, buttons: buttons || [] }); };
    tpl('enquiry_ack', 'UTILITY', 'approved', 'Hello {{1}}, thank you for reaching {{2}}. {{3}} will share curated options with you shortly.');
    tpl('options_ready', 'UTILITY', 'approved', 'Hello {{1}}, your curated gifting options for {{2}} are ready: {{3}}', ['View options', 'Call me']);
    tpl('sample_feedback', 'UTILITY', 'approved', 'Hello {{1}}, hope the samples reached you well. Which ones did your team like?', ['Loved it', 'Need other options']);
    tpl('quote_nudge', 'UTILITY', 'approved', 'Hello {{1}}, a gentle reminder about our quote for {{2}}. To deliver by {{3}} we need to confirm vendors this week.');
    tpl('artwork_reminder', 'UTILITY', 'approved', 'Hello {{1}}, your artwork proof for order {{2}} is waiting for approval: {{3}}', ['Approve', 'Request change']);
    tpl('dispatch_update', 'UTILITY', 'approved', 'Order {{1}} has been dispatched to {{2}}. Tracking: {{3}}');
    tpl('delivery_thanks', 'MARKETING', 'approved', 'Thank you for choosing {{1}}, {{2}}! How was the gifting experience?', ['Great', 'Could be better']);
    tpl('diwali_lookbook', 'MARKETING', 'pending', 'Hello {{1}}, our Diwali 2026 lookbook is here — hampers, premium tech and UCPMP-safe range. {{2}}', ['Send me the lookbook']);

    /* ---------- campaigns (response figures illustrative) ---------- */

    D.campaigns.push({ id: GC.uid('cp'), name: 'Diwali 2026', occasion: 'Diwali & festive', tiers: ['Strategic', 'Key account', 'Active'], status: 'live', start: ago(21),
      sent: 64, replies: 19, opps: 7, value: 3860000, sources: { email: 9, whatsapp: 6, repeat: 4 } });
    D.campaigns.push({ id: GC.uid('cp'), name: 'New Year desk gifts', occasion: 'New Year', tiers: ['Active', 'Prospect'], status: 'draft', start: ahead(30),
      sent: 0, replies: 0, opps: 0, value: 0, sources: {} });
    D.campaigns.push({ id: GC.uid('cp'), name: 'Onboarding kits — IT & GCCs', occasion: 'Onboarding', tiers: ['Prospect'], status: 'done', start: ago(120),
      sent: 140, replies: 22, opps: 5, value: 1420000, sources: { linkedin: 3, email: 2 } });

    /* ---------- a little history on the Agent Desk (illustrative) ---------- */

    [['brief', 'Read an enquiry from Email', 'Sahyadri Finance: Diwali — Leadership & CXOs × 60', 16],
     ['curator', 'Curate options for Diwali — Leadership & CXOs × 60', '12 options from 1,284 matches', 15],
     ['proposal', 'Draft the proposal for Diwali — Leadership & CXOs × 60', '2 lines · clear to send', 7],
     ['brief', 'Read an enquiry from LinkedIn', 'Zentrix Technologies: Onboarding — Employees × 400', 9],
     ['curator', 'Curate options for Onboarding — Employees × 400', '12 options from 3,410 matches', 9],
     ['sourcing', 'RFQ for Diwali hamper', 'Best of 4 vendors · saves ₹18,750', 5],
     ['compliance', 'Check the quote for Conference — Delegate kits × 500', 'Clear to send', 10],
     ['intake', 'Read a price list from Milton', '46 rows · 38 ready · 5 duplicates · 3 to check', 12],
     ['followup', 'Follow up: Nexa Realty Group — Diwali — Clients × 250', 'Quote v1 sent 6 days ago', 3]].forEach(function (h, i) {
      var a = { brief: 15, curator: 90, proposal: 60, sourcing: 120, compliance: 15, intake: 138, followup: 10 }[h[0]];
      D.runs.push({ id: GC.uid('r'), agent: h[0], title: h[1], summary: h[2], at: GC.addDays(t0, -h[3]) + 'T0' + (9 + i % 1) + ':1' + i + ':00',
        status: i === 8 ? 'rejected' : 'approved', minutes: a, steps: [], demo: true, decidedBy: i % 2 ? 'u2' : 'u3' });
    });

    D.activity.push({ id: 'l0', at: new Date(Date.now() - 3600000).toISOString(), by: 'u6', kind: 'order_stage', text: kiranOrder.no + ' → Goods in & QC', order: kiranOrder.id });
    return D;
  }

  var api = { build: build };
  if (node) module.exports = api; else root.SEED = api;
})(typeof self !== 'undefined' ? self : this);
