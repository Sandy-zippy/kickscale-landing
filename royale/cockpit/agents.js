/* The agent layer. Pure logic, no DOM — every agent runs under node.

   An agent READS the store and the catalogue and returns a RUN: what it looked
   at, what it decided and why (steps), and a proposal a person can approve.
   It never writes to the store itself; the Agent Desk applies an approved
   proposal. That split is the whole safety model: anything that would reach a
   client is a draft until somebody taps Approve.

   In the demo these are deterministic rules on local data, and they say so.
   In production the reading and writing steps (brief extraction, cover notes)
   are one Gemini call each, returning the same shapes. */
(function (root) {
  'use strict';

  var node = typeof module !== 'undefined' && module.exports;
  var GC = node ? require('./core.js') : root.GC;

  var AGENTS = [
    { id: 'brief',      name: 'Brief agent',        icon: '✉', trigger: 'A new email, WhatsApp or form message',
      does: 'Reads the message, finds or creates the company and contact, opens a structured requirement, and drafts the questions still missing.', minutes: 15, client: true },
    { id: 'curator',    name: 'Curator agent',      icon: '✦', trigger: 'A brief is captured',
      does: 'Searches the full catalogue, ranks 12 options on fit, margin, stock, lead time and vendor reliability, and explains every pick.', minutes: 90, client: false },
    { id: 'proposal',   name: 'Proposal agent',     icon: '❏', trigger: 'The shortlist is approved',
      does: 'Builds the branded proposal and a versioned quote with quantity-band prices and GST, then drafts the cover note.', minutes: 60, client: true },
    { id: 'compliance', name: 'Compliance agent',   icon: '⚖', trigger: 'Before any quote goes out',
      does: 'Checks UCPMP for doctors, GST against HSN, the margin floor, MOQ and whether lead times fit the deadline. Blocks the send and says why.', minutes: 15, client: false },
    { id: 'sourcing',   name: 'Sourcing agent',     icon: '⇄', trigger: 'A line needs a fresh price or stock',
      does: 'Invites the best-fit vendors to quote (or runs a reverse auction), scores price, lead time and reliability, and recommends a winner.', minutes: 120, client: false },
    { id: 'intake',     name: 'Vendor intake agent',icon: '⇪', trigger: 'A vendor sends a price list',
      does: 'Maps messy columns, removes duplicates against the catalogue, tags each product, and queues low-confidence rows for a person.', minutes: 180, client: false },
    { id: 'followup',   name: 'Follow-up agent',    icon: '↻', trigger: 'A quote goes quiet, a sample lands',
      does: 'Drafts a nudge that uses the deal\'s own context, books the next follow-up, and escalates after two misses.', minutes: 10, client: true },
    { id: 'orderwatch', name: 'Order-watch agent',  icon: '◉', trigger: 'Every order change, and a daily sweep',
      does: 'Catches vendor dates slipping past the deadline, stuck artwork and failed QC, alerts ops and drafts the client update.', minutes: 20, client: true },
    { id: 'reorder',    name: 'Reorder agent',      icon: '↺', trigger: '45 days before last year\'s order',
      does: 'Finds clients coming up on last year\'s gifting date and drafts a reactivation with what they bought and what is new.', minutes: 20, client: true },
    { id: 'morning',    name: 'Morning brief',      icon: '☀', trigger: 'Every day at 9:00',
      does: 'Pipeline, orders at risk, work waiting for approval, and the one thing to do today.', minutes: 30, client: false }
  ];
  function agentById(id) { return AGENTS.filter(function (a) { return a.id === id; })[0] || null; }

  function run(agent, title, o) {
    var a = agentById(agent);
    return Object.assign({ id: GC.uid('r'), agent: agent, title: title, at: new Date().toISOString(),
      steps: [], summary: '', payload: {}, clientFacing: !!(a && a.client), confidence: 0.8,
      minutes: a ? a.minutes : 0, target: null, draft: null }, o || {});
  }
  function step(r, t, d) { r.steps.push({ t: t, d: d || '' }); return r; }
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || 'there'; }
  function listOf(a) { return a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }


  /* ================= 1. BRIEF =================
     Free text in, a structured requirement out. The catalogue interpreter does
     budget, quantity, category, occasion and recipient; this adds the people,
     the company, the deadline and the delivery cities. */

  var CITY_RE = /\b(mumbai|navi mumbai|thane|pune|delhi|new delhi|gurgaon|gurugram|noida|bengaluru|bangalore|hyderabad|chennai|kolkata|ahmedabad|surat|jaipur|lucknow|indore|nagpur|kochi|chandigarh|vadodara|bhopal|coimbatore|goa|nashik)\b/gi;
  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  var FESTIVALS = { diwali: '2026-11-08', 'new year': '2027-01-01', christmas: '2026-12-25', dussehra: '2026-10-20' };
  var COMPANY_WORDS = 'Ltd|Limited|Pvt|Technologies|Tech|Pharma|Pharmaceuticals|Group|Bank|Finance|Motors|Realty|Services|Consulting|Healthcare|Hospitals|Logistics|Industries|Labs|Solutions|Systems|Foods|Infra|Capital|Insurance|Steel|Motors';

  function parseDeadline(text) {
    var t = text.toLowerCase(), m, now = GC.parseISO(GC.today());
    if ((m = t.match(/(\d{4})-(\d{2})-(\d{2})/))) return m[0];
    if ((m = t.match(/(?:by|before|on|latest|deliver(?:ed)?(?: by)?)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/)) ||
        (m = t.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/))) {
      var y = now.getFullYear(), mo = MONTHS[m[2]], d = +m[1];
      var s = y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      if (s < GC.today()) s = (y + 1) + s.slice(4);
      return s;
    }
    if ((m = t.match(/(?:in|within)\s+(\d+)\s*days?/))) return GC.addDays(GC.today(), +m[1]);
    if ((m = t.match(/(?:in|within)\s+(\d+)\s*weeks?/))) return GC.addDays(GC.today(), 7 * m[1]);
    for (var f in FESTIVALS) if (t.indexOf(f) >= 0 && /before|ahead of|for|by/.test(t)) return GC.addDays(FESTIVALS[f], -7);
    return null;
  }
  function parsePeople(text) {
    var out = {};
    var m = text.match(/(?:\+91[\s-]?)?([6-9]\d{4})[\s-]?(\d{5})\b/);
    if (m) out.mobile = m[1] + m[2];
    m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (m) out.email = m[0];
    m = text.match(/(?:regards|thanks|thank you|warm regards|best)[,!.]?\s*\n+\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i) ||
        text.match(/\b(?:I am|I'm|this is|my name is)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/);
    if (m) out.name = m[1];
    var re = new RegExp('([A-Z][A-Za-z&.]*(?:\\s+[A-Z][A-Za-z&.]*){0,3}\\s+(?:' + COMPANY_WORDS + ')\\.?(?:\\s+(?:Ltd|Limited|Pvt\\.? Ltd)\\.?)?)');
    m = text.match(re);
    if (m) out.company = m[1].replace(/^(?:From|At|With|For|Regards|Team|Dear|Hi|Hello)\s+/, '').replace(/[.,]+$/, '').trim();
    else if (out.email && !/gmail|yahoo|outlook|hotmail|rediff/.test(out.email)) {
      var dom = out.email.split('@')[1].split('.')[0];
      out.company = dom.charAt(0).toUpperCase() + dom.slice(1);
    }
    m = text.match(/\n\s*([A-Z][A-Za-z ]*(?:Manager|Head|Director|Officer|Executive|Lead|HR|Admin|Procurement)[A-Za-z ]*)/);
    if (m) out.title = m[1].trim();
    return out;
  }

  function brief(text, meta, ctx) {
    meta = meta || {};
    var E = ctx.E, db = ctx.db;
    var r = run('brief', 'Read an enquiry' + (meta.channel ? ' from ' + meta.channel : ''), { target: { kind: 'msg', id: meta.msgId || null } });
    var f = E.interpret(text, db);
    var who = parsePeople(text);
    if (meta.from) { who.name = who.name || meta.from.name; who.mobile = who.mobile || meta.from.mobile; who.email = who.email || meta.from.email; who.company = who.company || meta.from.company; }
    step(r, 'Read the message', text.length + ' characters' + (meta.channel ? ' on ' + meta.channel : '') + '.');

    var cities = (text.match(CITY_RE) || []).map(function (c) { return c.charAt(0).toUpperCase() + c.slice(1).toLowerCase(); })
      .filter(function (c, i, a) { return a.indexOf(c) === i; });
    var deadline = parseDeadline(text);
    var branding = /logo|brand(ed|ing)?|engrav|print|embroider|personali[sz]/i.test(text)
      ? (text.match(/engrav\w*|embroider\w*|print\w*|logo/i) || ['Logo'])[0] : '';
    var occ = Array.from(f.occ).map(function (i) { return E.OCCASIONS[i]; });
    var rec = Array.from(f.rec).map(function (i) { return E.RECIPIENTS[i]; });
    var doctors = f.rec.has(2) || /pharma|doctor|hcp|physician|ucpmp/i.test(text);
    var b = GC.newBrief({ text: text, occasion: occ[0] || '', recipients: rec.join(', '), qty: f.qty,
      budgetMin: f.min, budgetMax: f.max, deadline: deadline, cities: cities, branding: branding, ucpmp: doctors });
    step(r, 'Pulled out the requirement', [
      'occasion: ' + (b.occasion || '—'), 'for: ' + (b.recipients || '—'),
      'quantity: ' + (b.qty || '—'), 'budget: ' + (b.budgetMax ? (b.budgetMin ? '₹' + GC.fmt(b.budgetMin) + '–' : 'up to ') + '₹' + GC.fmt(b.budgetMax) + ' each' : '—'),
      'deliver by: ' + (b.deadline || '—'), 'cities: ' + (cities.join(', ') || '—'), 'branding: ' + (branding || '—')].join(' · '));
    if (doctors) step(r, 'Flagged as a healthcare-professional gift', 'UCPMP applies: every option must be professional-use and at most ₹' + GC.fmt(GC.T.rules.ucpmpCap) + ' per doctor.');

    var D = ctx.D;
    var co = who.company ? GC.findCompany(D.companies, who.company) : null;
    var ct = GC.findContact(D.contacts, who.mobile, who.email);
    if (!co && ct) co = D.companies.filter(function (c) { return c.id === ct.company; })[0] || null;
    step(r, co ? 'Matched an existing client' : 'New client', co ? co.name + ' is already on the books — the requirement goes on their record.'
      : 'No match for "' + (who.company || 'unknown company') + '" — a company record will be created on approval.');

    var missing = [];
    if (!b.qty) missing.push(['quantity', 'How many pieces do you need?']);
    if (!b.budgetMax) missing.push(['budget', 'What budget per gift are you working with?']);
    if (!b.deadline) missing.push(['deadline', 'By when should everything be delivered?']);
    if (!cities.length) missing.push(['cities', 'Is it one delivery address, or several cities?']);
    if (!branding) missing.push(['branding', 'Would you like your logo on the gifts (printed, engraved or embroidered)?']);
    step(r, missing.length ? 'Found gaps' : 'Brief is complete', missing.length ? 'Missing: ' + missing.map(function (m) { return m[0]; }).join(', ') + '.' : 'Enough to curate a shortlist straight away.');

    var title = (b.occasion || 'Gifting') + (rec[0] ? ' — ' + rec[0] : '') + (b.qty ? ' × ' + GC.fmt(b.qty) : '');
    var greet = 'Hello ' + firstName(who.name) + ',\n\nThank you for reaching out to ' + GC.T.name + '. ';
    var body = missing.length
      ? 'To put the right options in front of you quickly, could you confirm:\n' + missing.map(function (m, i) { return (i + 1) + '. ' + m[1]; }).join('\n') +
        '\n\nMeanwhile we are already shortlisting' + (b.occasion ? ' ' + b.occasion.toLowerCase() : '') + ' options for you.'
      : 'We have everything we need and will share a curated shortlist' + (b.deadline ? ' that can be delivered by ' + b.deadline : '') + ' shortly.';
    r.draft = { channel: meta.channel === 'WhatsApp' ? 'WhatsApp' : 'Email', text: greet + body + '\n\nWarm regards,\n' + GC.T.name };
    r.payload = { who: who, company: co ? co.id : null, contact: ct ? ct.id : null, brief: b, title: title, missing: missing.map(function (m) { return m[0]; }), source: meta.source || 'email' };
    r.summary = (co ? co.name : (who.company || 'New client')) + ': ' + title + (missing.length ? ' · ' + missing.length + ' question' + (missing.length > 1 ? 's' : '') + ' drafted' : ' · brief complete');
    r.confidence = Math.max(0.35, 1 - missing.length * 0.1 - (who.company ? 0 : 0.2));
    return r;
  }


  /* ================= 2. CURATOR =================
     The whole catalogue, not a filter on 5,000 rows: the brief becomes the
     same facet filters a person would click, and when nothing matches the
     least important constraints are loosened, and it says which. */

  function briefFilters(opp, ctx) {
    var E = ctx.E, b = opp.brief, rules = GC.T.rules;
    var f = E.interpret((b.text || '') + ' ' + (b.occasion || '') + ' ' + (b.recipients || ''), ctx.db);
    if (b.qty) f.qty = b.qty;
    if (b.budgetMax) f.max = b.budgetMax;
    if (b.budgetMin) f.min = b.budgetMin;
    if (b.ucpmp) { f.attr.add(6); f.max = Math.min(f.max || Infinity, rules.ucpmpCap); f.rec.add(2); }
    if (b.deadline) {
      var days = GC.daysBetween(GC.today(), b.deadline) - rules.bufferDays;
      f.lead = Math.max(3, days);
    }
    if (b.branding) f.attr.add(1);
    return f;
  }

  function curate(opp, ctx, opts) {
    opts = opts || {};
    var E = ctx.E, db = ctx.db, b = opp.brief, n = opts.n || 12;
    var r = run('curator', 'Curate options for ' + opp.title, { target: { kind: 'opp', id: opp.id } });
    var f = briefFilters(opp, ctx);
    var res = E.searchWithRelax(db, f);
    /* UCPMP is law, not a preference: relaxing "attributes" must never let a
       non-compliant item through. Filter hard after the search, and if that
       empties it, loosen the occasion instead and search again. */
    if (b.ucpmp) {
      var cap = GC.T.rules.ucpmpCap;
      var legal = function (it) { return it.attr.indexOf(6) >= 0 && it.price <= cap; };
      res.results = res.results.filter(legal);
      if (!res.results.length) {
        var f2 = Object.assign({}, f, { occ: new Set(), attr: new Set([6]) });
        var res2 = E.searchWithRelax(db, f2);
        res2.results = res2.results.filter(legal);
        res2.relaxed = ['occasion', 'branding'].concat(res2.relaxed);
        res = res2;
      }
    }
    step(r, 'Searched the full catalogue', GC.fmt(db.items.length) + ' products in ' + Math.max(1, Math.round(res.ms)) + ' ms → ' + GC.fmt(res.results.length) + ' match the brief.');
    if (res.relaxed.length) step(r, 'Loosened the brief', 'Nothing matched everything, so it relaxed: ' + listOf(res.relaxed) + '.');

    var target = b.budgetMax ? (b.budgetMin ? (b.budgetMin + b.budgetMax) / 2 : b.budgetMax * 0.85) : null;
    var days = b.deadline ? GC.daysBetween(GC.today(), b.deadline) - GC.T.rules.bufferDays : null;
    var cxo = /cxo|leader|ceo|director|vip/i.test(b.recipients || '');
    var already = {}; (opp.lines || []).forEach(function (l) { already[l.pid] = 1; });
    var vcache = {};
    function score(pool, seen) {
      var out = [];
      for (var i = 0; i < pool.length; i++) {
        var it = pool[i];
        if (already[it.id] || (seen && seen[it.id])) continue;
        var p = ctx.P(it.id);
        if (!p) continue;
        var vm = vcache[p.vendor] || (vcache[p.vendor] = GC.vendorMeta(p.vendor, db.vendors[p.vendor], (ctx.D.vendorEdits || {})[p.vendor]));
        var fit = target ? Math.max(0, 1 - Math.abs(p.price - target) / target) : 0.6;
        var qty = b.qty || p.moq;
        var stockOk = p.stock >= qty ? 1 : 0.3;
        var leadOk = days == null ? 0.8 : (p.lead <= days ? 1 : 0);
        var sc = 0.3 * fit + 0.2 * Math.min(1, p.marginPct / 35) + 0.15 * stockOk + 0.15 * leadOk +
                 0.15 * (GC.vendorScore(vm) / 100) + (p.sample ? 0.08 : 0) + (cxo && p.premium ? 0.08 : 0);
        out.push({ p: p, vm: vm, score: sc, fit: fit, stockOk: stockOk, leadOk: leadOk });
      }
      return out.sort(function (a, c) { return c.score - a.score; });
    }
    var scored = score(res.results);
    step(r, 'Ranked every match', 'On budget fit 30%, margin 20%, stock 15%, lead time 15%, vendor reliability 15%, plus samples in office' + (cxo ? ' and premium for leadership' : '') + '.');

    /* Twelve of the same bottle is not a shortlist. Cap repeats so the client
       sees a real choice. */
    var perCat = {}, perVendor = {}, perBase = {}, picks = [], taken = {};
    var cats = {};
    scored.slice(0, 300).forEach(function (s) { cats[s.p.cat] = 1; });
    var capCat = f.cat.size === 1 || Object.keys(cats).length < 4 ? 99 : 3;   // a narrow pool (e.g. UCPMP) can't be spread across categories
    function take(list, note, baseCap) {
      for (var k = 0; k < list.length && picks.length < n; k++) {
        var s = list[k], base = s.p.name.split(',')[0];
        if (taken[s.p.id] || (perCat[s.p.cat] || 0) >= capCat || (perVendor[s.p.vendor] || 0) >= 2 || (perBase[base] || 0) >= baseCap) continue;
        perCat[s.p.cat] = (perCat[s.p.cat] || 0) + 1; perVendor[s.p.vendor] = (perVendor[s.p.vendor] || 0) + 1; perBase[base] = (perBase[base] || 0) + 1; taken[s.p.id] = 1;
        var why = [];
        if (note) why.push(note);
        if (target) why.push(s.fit > 0.85 ? 'right on budget' : s.p.price < target ? 'under budget' : 'slightly above budget');
        if (s.stockOk === 1) why.push('ready stock covers ' + GC.fmt(b.qty || s.p.moq)); else why.push('needs vendor stock for the full quantity');
        if (days != null) why.push(s.leadOk ? s.p.lead + '-day lead fits the deadline' : 'lead time is tight');
        if (s.p.sample) why.push('sample in our office');
        if (s.vm.rating >= 4.4) why.push(s.p.vendorName + ' rated ' + s.vm.rating + '★');
        if (s.p.ucpmp && b.ucpmp) why.push('UCPMP-safe');
        if (s.p.brandable && b.branding) why.push('takes ' + (s.p.branding[0] || 'logo').toLowerCase());
        picks.push({ pid: s.p.id, name: s.p.name, price: s.p.price, marginPct: s.p.marginPct, score: Math.round(s.score * 100), why: why });
      }
    }
    take(scored, null, 1);
    /* A narrow brief ("welcome kits") can leave one base product. Widen the
       way a person would: the same occasion, people and budget, any category —
       the pieces that go into a kit — and say so. UCPMP stays hard. */
    if (picks.length < Math.min(n, 8)) {
      var had = picks.length, catName = f.cat.size ? db.cats[Array.from(f.cat)[0]].name.toLowerCase() : 'the category';
      var widen = [
        [{ cat: new Set(), vendor: new Set(), pack: new Set() }, 'widens the choice beyond ' + catName],
        [{ cat: new Set(), vendor: new Set(), pack: new Set(), occ: new Set() }, 'fits the people and budget, any occasion'],
        [{ cat: new Set(), vendor: new Set(), pack: new Set(), occ: new Set(), min: f.min ? Math.round(f.min * 0.8) : null, max: f.max ? Math.round(f.max * 1.1) : null }, 'just outside the budget band']
      ];
      capCat = 3;
      for (var wv = 0; wv < widen.length && picks.length < Math.min(n, 8); wv++) {
        var more = E.searchWithRelax(db, Object.assign({}, f, widen[wv][0])).results;
        if (b.ucpmp) more = more.filter(function (it) { return it.attr.indexOf(6) >= 0 && it.price <= GC.T.rules.ucpmpCap; });
        take(score(more, taken), widen[wv][1], 1);
      }
      if (picks.length > had) step(r, 'Widened the search', 'Only ' + had + ' distinct option' + (had === 1 ? '' : 's') + ' matched exactly, so it added ' + (picks.length - had) + ' more for the same people and budget, and marked each one with why.');
      if (picks.length < Math.min(n, 8)) take(scored, 'another variant', 2);
    }
    step(r, 'Picked ' + picks.length + ' for the shortlist', 'At most 2 per vendor and no repeated base product, so the client gets a real choice.');
    if (b.ucpmp) step(r, 'UCPMP guard held', 'Every pick is professional-use and ≤ ₹' + GC.fmt(GC.T.rules.ucpmpCap) + '.');
    r.payload = { picks: picks, relaxed: res.relaxed, matched: res.results.length };
    r.summary = picks.length + ' option' + (picks.length === 1 ? '' : 's') + ' from ' + GC.fmt(res.results.length) + ' matches' + (res.relaxed.length ? ' (relaxed ' + listOf(res.relaxed) + ')' : '');
    r.confidence = picks.length >= 8 && !res.relaxed.length ? 0.9 : picks.length ? 0.7 : 0.2;
    r.minutes = Math.min(120, 30 + picks.length * 5);
    return r;
  }


  /* ================= 3. PROPOSAL + 4. COMPLIANCE ================= */

  function complianceRun(opp, quote, ctx) {
    var co = ctx.D.companies.filter(function (c) { return c.id === opp.company; })[0];
    var c = GC.compliance(quote, opp, co, GC.T.rules);
    var r = run('compliance', 'Check the quote for ' + opp.title, { target: { kind: 'opp', id: opp.id } });
    step(r, 'UCPMP', c.doctors ? (c.blocks.some(function (b) { return /UCPMP/.test(b); }) ? 'Fails — see blocks.' : 'Every line is professional-use and within the cap.') : 'Not a healthcare-professional gift.');
    step(r, 'GST against HSN', c.warns.some(function (w) { return /GST/.test(w); }) ? 'A rate differs from the usual one for its HSN.' : 'All rates match their HSN codes.');
    step(r, 'Margin floor', quote.marginPct + '% against a ' + GC.T.rules.marginFloor + '% floor.');
    step(r, 'MOQ and lead time', c.warns.filter(function (w) { return /MOQ|lead/.test(w); }).length + ' warning(s).');
    r.payload = c; r.clientFacing = false;
    r.summary = c.ok ? 'Clear to send' + (c.warns.length ? ' with ' + c.warns.length + ' warning(s)' : '') : c.blocks.length + ' block(s): ' + c.blocks[0];
    r.confidence = 1;
    return r;
  }

  function proposal(opp, ctx) {
    var r = run('proposal', 'Draft the proposal for ' + opp.title, { target: { kind: 'opp', id: opp.id } });
    var q = GC.buildQuote(opp, ctx.P);
    step(r, 'Priced ' + q.lines.length + ' line(s)', 'Quantity-band prices, branding add-on where asked, GST by HSN. Total ' + GC.rupees(q.total) + ' incl. GST.');
    var chk = complianceRun(opp, q, ctx);
    step(r, 'Ran the compliance check', chk.summary);
    var co = ctx.D.companies.filter(function (c) { return c.id === opp.company; })[0];
    var ct = ctx.D.contacts.filter(function (c) { return c.id === opp.contact; })[0];
    var lines = q.lines.map(function (l, i) {
      return (i + 1) + '. ' + l.name + ' — ' + GC.fmt(l.qty) + ' pcs × ₹' + GC.fmt(l.unit + l.brandCost) + (l.branding ? ' (' + l.branding + ')' : '');
    }).join('\n');
    r.draft = { channel: 'Email', text: 'Hello ' + firstName(ct && ct.name) + ',\n\nPlease find our proposal for ' + (co ? co.name : 'your team') +
      ' — ' + opp.title + ':\n\n' + lines + '\n\nTotal: ' + GC.rupees(q.total) + ' including GST. Prices valid till ' + q.validTill + '.' +
      (opp.brief.deadline ? ' Delivery by ' + opp.brief.deadline + '.' : '') + '\n\nSamples of any of these can be at your office within 48 hours.\n\nWarm regards,\n' + GC.T.name };
    step(r, 'Wrote the cover note', 'Addressed to ' + (ct ? ct.name : 'the contact') + '; the branded PDF is generated from the same quote.');
    r.payload = { quote: q, compliance: chk.payload };
    r.summary = GC.rupees(q.total) + ' · ' + q.lines.length + ' lines · margin ' + q.marginPct + '% · ' + (chk.payload.ok ? 'clear to send' : 'BLOCKED: ' + chk.payload.blocks.length + ' issue(s)');
    r.confidence = chk.payload.ok ? 0.9 : 0.5;
    return r;
  }


  /* ================= 5. SOURCING =================
     RFQ mode asks the best-fit vendors for one sealed price each. Auction mode
     runs a few open rounds where vendors see they are not leading. Replies are
     simulated in the demo — deterministically, so the story is repeatable —
     and on the vendor portal a vendor can answer for real. */

  function vendorsFor(p, ctx, k) {
    var db = ctx.db;
    return db.vendors.map(function (v, vi) { return { v: v, vi: vi }; })
      .filter(function (x) { return x.v.cat === p.cat; })
      .map(function (x) { var m = GC.vendorMeta(x.vi, x.v, (ctx.D.vendorEdits || {})[x.vi]); return { vi: x.vi, m: m, s: GC.vendorScore(m) + (x.vi === p.vendor ? 5 : 0) }; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, k || 5);
  }
  function simulatedReply(p, vi, qty) {
    var h = GC.hash01(p.id + ':' + vi), h2 = GC.hash01(vi + ':' + p.id);
    if (h < 0.15) return { status: 'declined', note: 'Cannot do ' + GC.fmt(qty) + ' pcs in time' };
    return { status: 'quoted', price: Math.round(p.cost * (0.88 + h2 * 0.26)), lead: Math.max(2, p.lead + Math.round((h - 0.5) * 8)) };
  }
  function scoreBids(bids, deadlineDays) {
    var q = bids.filter(function (b) { return b.status === 'quoted'; });
    if (!q.length) return bids;
    var lo = Math.min.apply(null, q.map(function (b) { return b.price; }));
    q.forEach(function (b) {
      var pr = lo / b.price;
      var ld = deadlineDays == null ? 0.8 : b.lead <= deadlineDays ? 1 : 0.2;
      b.score = Math.round(100 * (0.5 * pr + 0.3 * ld + 0.2 * (b.reliability / 100)));
    });
    return bids;
  }
  function sourcing(p, qty, ctx, opts) {
    opts = opts || {};
    var mode = opts.mode || 'rfq';
    var r = run('sourcing', (mode === 'auction' ? 'Reverse auction' : 'RFQ') + ' for ' + p.name, { target: { kind: 'product', id: p.id } });
    var inv = vendorsFor(p, ctx, opts.k || 5);
    step(r, 'Chose who to invite', inv.length + ' ' + p.category.toLowerCase() + ' vendors, ranked on rating and on-time record: ' + inv.map(function (x) { return x.m.name; }).join(', ') + '.');
    var days = opts.deadline ? GC.daysBetween(GC.today(), opts.deadline) - GC.T.rules.bufferDays : null;
    var bids = inv.map(function (x) {
      var rep = simulatedReply(p, x.vi, qty);
      return Object.assign({ vi: x.vi, name: x.m.name, reliability: GC.vendorScore(x.m), rating: x.m.rating, ontime: x.m.ontime }, rep);
    });
    step(r, 'Collected replies', bids.filter(function (b) { return b.status === 'quoted'; }).length + ' quoted, ' + bids.filter(function (b) { return b.status === 'declined'; }).length + ' declined (simulated replies in the demo).');
    var rounds = [];
    if (mode === 'auction') {
      for (var rd = 1; rd <= (opts.rounds || 3); rd++) {
        var live = bids.filter(function (b) { return b.status === 'quoted'; });
        if (live.length < 2) break;
        var lo = Math.min.apply(null, live.map(function (b) { return b.price; }));
        live.forEach(function (b) {
          if (b.price === lo) return;
          var floor = Math.round(p.cost * 0.84);
          var drop = 0.02 + GC.hash01(b.vi + ':' + rd) * 0.03;
          if (b.price * (1 - drop) >= floor) b.price = Math.round(b.price * (1 - drop));
        });
        rounds.push({ round: rd, low: Math.min.apply(null, live.map(function (b) { return b.price; })) });
      }
      step(r, 'Ran ' + rounds.length + ' open round(s)', rounds.map(function (x) { return 'round ' + x.round + ': low ₹' + GC.fmt(x.low); }).join(' · '));
    }
    scoreBids(bids, days);
    var ranked = bids.filter(function (b) { return b.status === 'quoted'; }).sort(function (a, b) { return b.score - a.score; });
    var win = ranked[0] || null;
    if (win) {
      var saving = (p.cost - win.price) * qty;
      step(r, 'Recommends ' + win.name, '₹' + GC.fmt(win.price) + '/pc, ' + win.lead + ' days, reliability ' + win.reliability + '/100. ' +
        (saving > 0 ? 'Saves ' + GC.rupees(saving) + ' on ' + GC.fmt(qty) + ' pcs against current cost.' : 'Costs ' + GC.rupees(-saving) + ' more than current cost, but ' + (win.lead <= p.lead ? 'faster.' : 'the most reliable.')));
    } else step(r, 'Nobody could quote', 'Widen the vendor list or change the product.');
    r.payload = { pid: p.id, qty: qty, mode: mode, bids: bids, rounds: rounds, winner: win ? win.vi : null,
                  saving: win ? (p.cost - win.price) * qty : 0, deadline: opts.deadline || null, opp: opts.opp || null };
    r.summary = win ? win.name + ' at ₹' + GC.fmt(win.price) + '/pc · ' + win.lead + ' days' + (r.payload.saving > 0 ? ' · saves ' + GC.rupees(r.payload.saving) : '') : 'No vendor could quote';
    r.confidence = win ? (ranked.length >= 3 ? 0.85 : 0.65) : 0.2;
    return r;
  }


  /* ================= 6. VENDOR INTAKE =================
     A vendor's price list arrives however they keep it. Map the columns,
     tag each row, check it is not already in the catalogue, and say how sure. */

  var HEADERS = {
    name: /^(product|item|name|description|particulars|product name|item name)$/i,
    price: /^(price|rate|mrp|cost|unit price|basic|net rate|dp)$/i,
    moq: /^(moq|min(imum)? ?(qty|order)|min qty)$/i,
    lead: /^(lead|lead time|delivery|tat|days)$/i,
    category: /^(category|cat|type|segment)$/i,
    hsn: /^(hsn|hsn code)$/i,
    gst: /^(gst|gst %|tax|gst rate)$/i
  };
  function parseCSV(text) {
    return String(text || '').split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (line) {
      var out = [], cur = '', q = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') q = !q;
        else if ((ch === ',' || ch === '\t') && !q) { out.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      out.push(cur.trim());
      return out;
    });
  }
  function intake(csv, vendorIdx, ctx) {
    var E = ctx.E, db = ctx.db;
    var vname = vendorIdx != null && db.vendors[vendorIdx] ? db.vendors[vendorIdx].name : 'the vendor';
    var r = run('intake', 'Read a price list from ' + vname, { target: { kind: 'vendor', id: vendorIdx } });
    var rows = parseCSV(csv);
    if (rows.length < 2) { step(r, 'Nothing to read', 'Paste a header row and at least one product.'); r.payload = { rows: [] }; r.confidence = 0; return r; }
    var head = rows[0], map = {};
    head.forEach(function (h, i) { Object.keys(HEADERS).forEach(function (k) { if (map[k] == null && HEADERS[k].test(h.trim())) map[k] = i; }); });
    step(r, 'Mapped the columns', Object.keys(map).map(function (k) { return head[map[k]] + ' → ' + k; }).join(' · ') + (map.name == null ? ' · NO product-name column found' : ''));
    var names = {};
    db.items.forEach(function (it) { if (vendorIdx == null || it.vendor === vendorIdx) names[GC.normName(it.name.split(',')[0])] = it.id; });
    var out = rows.slice(1).map(function (c, i) {
      var name = map.name != null ? c[map.name] : c[0];
      var price = map.price != null ? Number(String(c[map.price]).replace(/[^\d.]/g, '')) : null;
      var f = E.interpret(name || '', db);
      var cat = f.cat.size ? Array.from(f.cat)[0] : null;
      if (map.category != null) {
        var cn = String(c[map.category] || '').toLowerCase();
        db.cats.forEach(function (x, ci) { if (cn && x.name.toLowerCase().indexOf(cn.split(' ')[0]) >= 0) cat = ci; });
      }
      var dup = names[GC.normName(String(name || '').split(',')[0])] || null;
      var conf = 0.3 + (name ? 0.2 : 0) + (price ? 0.2 : 0) + (cat != null ? 0.2 : 0) + (map.moq != null ? 0.05 : 0) + (map.lead != null ? 0.05 : 0);
      return { row: i + 2, name: name || '', price: price || null, moq: map.moq != null ? Number(c[map.moq]) || null : null,
               lead: map.lead != null ? Number(String(c[map.lead]).replace(/\D/g, '')) || null : null,
               cat: cat, catName: cat != null ? db.cats[cat].name : '—',
               tags: Array.from(f.occ).map(function (x) { return E.OCCASIONS[x]; }).concat(Array.from(f.rec).map(function (x) { return E.RECIPIENTS[x]; })).slice(0, 4),
               dup: dup, conf: Math.round(Math.min(1, conf) * 100) / 100, status: dup ? 'duplicate' : conf >= 0.75 ? 'ready' : 'check' };
    });
    var ready = out.filter(function (x) { return x.status === 'ready'; }).length;
    var dups = out.filter(function (x) { return x.status === 'duplicate'; }).length;
    step(r, 'Tagged ' + out.length + ' rows', 'Category, occasion and recipient inferred from each name.');
    step(r, 'Checked for duplicates', dups + ' already in the catalogue under ' + vname + ' — these will update the price, not add a copy.');
    step(r, 'Scored confidence', ready + ' ready to publish, ' + (out.length - ready - dups) + ' need a person to check.');
    r.payload = { vendor: vendorIdx, vendorName: vname, rows: out, map: map };
    r.summary = out.length + ' rows · ' + ready + ' ready · ' + dups + ' duplicates · ' + (out.length - ready - dups) + ' to check';
    r.confidence = out.length ? ready / out.length : 0;
    r.minutes = Math.max(10, out.length * 3);
    return r;
  }


  /* ================= 7. FOLLOW-UP ================= */

  function followups(ctx) {
    var D = ctx.D, stale = GC.T.rules.quoteStaleDays, outRuns = [];
    D.opps.filter(GC.isOpen).forEach(function (o) {
      var co = D.companies.filter(function (c) { return c.id === o.company; })[0];
      var ct = D.contacts.filter(function (c) { return c.id === o.contact; })[0];
      var q = GC.lastQuote(o), nf = GC.nextFollow(D.followups, o.id);
      var misses = D.followups.filter(function (f) { return f.opp === o.id && f.auto && f.done && f.outcome === 'Could not reach them'; }).length;
      var reason = null, text = null;
      if (o.stage === 'Quote sent' && q && GC.daysBetween(q.at, GC.today()) >= stale && (!nf || GC.isOverdue(nf))) {
        reason = 'Quote v' + q.v + ' sent ' + GC.daysBetween(q.at, GC.today()) + ' days ago, no reply logged';
        text = 'Hello ' + firstName(ct && ct.name) + ',\n\nJust checking in on the proposal we shared on ' + q.at + ' for ' + o.title + ' (' + GC.rupees(q.total) + ').' +
          (o.brief.deadline ? ' To deliver by ' + o.brief.deadline + ', we would need to lock vendors by ' + GC.addDays(o.brief.deadline, -Math.max.apply(null, q.lines.map(function (l) { return l.lead; }).concat([7])) - GC.T.rules.bufferDays) + '.' : '') +
          '\n\nHappy to adjust quantities or swap any item — and we can drop samples at your office this week.\n\nWarm regards,\n' + GC.T.name;
      } else if (o.samples.some(function (s) { return s.status === 'delivered' && !s.feedback; })) {
        var s = o.samples.filter(function (x) { return x.status === 'delivered' && !x.feedback; })[0];
        var p = ctx.P(s.pid);
        reason = 'Sample of ' + (p ? p.name : s.pid) + ' delivered ' + (s.at || '') + ', no feedback yet';
        text = 'Hello ' + firstName(ct && ct.name) + ',\n\nHope the sample of ' + (p ? p.name.split(',')[0] : 'the product') + ' reached you well. How did the team find it? If it works, we can hold stock for your ' + GC.fmt(o.brief.qty || 0) + ' pieces today.\n\nWarm regards,\n' + GC.T.name;
      } else if (!nf && GC.daysBetween(o.updated, GC.today()) >= 7) {
        reason = 'Untouched for ' + GC.daysBetween(o.updated, GC.today()) + ' days with nothing booked';
        text = 'Hello ' + firstName(ct && ct.name) + ',\n\nFollowing up on your ' + o.title.toLowerCase() + ' requirement — shall we set up 10 minutes to go through options?\n\nWarm regards,\n' + GC.T.name;
      }
      if (!reason) return;
      var r = run('followup', 'Follow up: ' + (co ? co.name : 'client') + ' — ' + o.title, { target: { kind: 'opp', id: o.id } });
      step(r, 'Spotted it', reason + '.');
      step(r, 'Read the deal', 'Stage ' + o.stage + ', owner ' + GC.staffName(o.assigned_to) + (q ? ', quote ' + GC.rupees(q.total) : '') + '.');
      if (misses >= 2) { step(r, 'Escalated', misses + ' earlier nudges got no answer — the Sales Head is added to this one.'); r.payload.escalate = true; }
      step(r, 'Drafted the nudge and booked the next touch', 'Follow-up on ' + GC.staffName(o.assigned_to) + ' for ' + GC.addDays(GC.today(), 2) + '.');
      r.draft = { channel: 'WhatsApp', text: text };
      r.payload.opp = o.id; r.payload.due = GC.addDays(GC.today(), 2); r.payload.owner = o.assigned_to;
      r.summary = reason;
      outRuns.push(r);
    });
    return outRuns;
  }


  /* ================= 8. ORDER WATCH ================= */

  function orderwatch(ctx) {
    var D = ctx.D, out = [];
    D.orders.filter(GC.orderOpen).forEach(function (o) {
      var risks = GC.orderRisks(o, GC.T.rules);
      if (!risks.length) return;
      var co = D.companies.filter(function (c) { return c.id === o.company; })[0];
      var ct = D.contacts.filter(function (c) { return c.id === o.contact; })[0];
      var r = run('orderwatch', 'Order ' + (o.no || '') + ' — ' + (co ? co.name : '') + ' needs attention', { target: { kind: 'order', id: o.id } });
      step(r, 'Checked the order', 'Stage ' + o.stage + ', deadline ' + (o.deadline || 'none') + ', ' + o.vendorPOs.length + ' vendor PO(s).');
      risks.forEach(function (x) { step(r, x.sev === 'bad' ? 'Problem' : 'Risk', x.text); });
      var slip = risks.filter(function (x) { return x.vendor != null; })[0];
      if (slip) step(r, 'Suggested a fix', 'Run the Sourcing agent for a faster vendor, or split the quantity so the first dispatch still makes the deadline.');
      step(r, 'Alerted ops', 'Notification to ' + GC.staffByRole('ops').map(function (u) { return u.name; }).join(', ') + '.');
      var clientSide = risks.some(function (x) { return x.sev === 'bad' || /deadline|artwork/i.test(x.text); });
      if (clientSide) r.draft = { channel: 'Email', text: 'Hello ' + firstName(ct && ct.name) + ',\n\nA quick update on your order ' + (o.no || '') + ' (' + o.title + '). ' +
        (o.artwork.status !== 'approved' ? 'We are waiting on your approval of the artwork to start branding — it is on your portal link. ' : '') +
        (slip ? 'One vendor has moved their date; we are lining up an alternative so your ' + (o.deadline || '') + ' delivery holds. ' : '') +
        'We will confirm the revised plan by tomorrow.\n\nWarm regards,\n' + GC.T.name };
      r.clientFacing = !!clientSide;
      r.payload = { order: o.id, risks: risks, vendor: slip ? slip.vendor : null };
      r.summary = risks[0].text + (risks.length > 1 ? ' (+' + (risks.length - 1) + ' more)' : '');
      r.confidence = 0.95;
      out.push(r);
    });
    return out;
  }


  /* ================= 9. REORDER ================= */

  function reorder(ctx) {
    var D = ctx.D, lead = GC.T.rules.reorderLeadDays, out = [];
    D.companies.forEach(function (co) {
      var past = D.orders.filter(function (o) { return o.company === co.id; });
      if (!past.length) return;
      if (D.opps.some(function (o) { return o.company === co.id && GC.isOpen(o); })) return;
      past.forEach(function (o) {
        var anniv = GC.addDays(o.created, 365);
        var d = GC.daysBetween(GC.today(), anniv);
        if (d < 0 || d > lead) return;
        var ct = D.contacts.filter(function (c) { return c.id === o.contact; })[0];
        var r = run('reorder', 'Reorder: ' + co.name + ' — ' + o.title, { target: { kind: 'company', id: co.id } });
        step(r, 'Found last year\'s order', o.title + ' on ' + o.created + ', ' + GC.rupees(o.value) + '.');
        step(r, 'Worked out the timing', 'Same date this year is ' + anniv + ' — ' + d + ' days away, inside the ' + lead + '-day window.');
        step(r, 'Drafted the reactivation', 'Reminds them what they chose and offers a refreshed shortlist.');
        r.draft = { channel: 'Email', text: 'Hello ' + firstName(ct && ct.name) + ',\n\nLast year we delivered ' + o.title + ' for ' + co.name + ' — ' +
          GC.fmt(o.lines.reduce(function (a, l) { return a + l.qty; }, 0)) + ' gifts. With the season coming up, shall we put together this year\'s options? ' +
          'We have new ranges in the same budget, and ordering by ' + GC.addDays(anniv, -21) + ' keeps every option open.\n\nWarm regards,\n' + GC.T.name };
        r.payload = { company: co.id, from: o.id, anniv: anniv };
        r.summary = co.name + ' — last year ' + GC.rupees(o.value) + ' on ' + o.created;
        out.push(r);
      });
    });
    return out;
  }


  /* ================= 10. MORNING BRIEF ================= */

  function morning(ctx, user) {
    var D = ctx.D;
    var r = run('morning', 'Morning brief — ' + GC.today(), { target: null, clientFacing: false });
    var open = D.opps.filter(GC.isOpen);
    var val = open.reduce(function (a, o) { return a + GC.oppValue(o, ctx.P); }, 0);
    var risky = D.orders.filter(GC.orderOpen).filter(function (o) { return GC.orderRisks(o).some(function (x) { return x.sev === 'bad'; }); });
    var waiting = (D.proposals || []).filter(function (p) { return p.status === 'pending'; });
    var overdue = GC.openFollows(D.followups).filter(GC.isOverdue);
    var quiet = GC.needsAttention(D.opps, D.followups);
    var dueIssues = (D.issues || []).filter(GC.issueOverdue);
    step(r, 'Pipeline', open.length + ' open requirements worth ' + GC.money(val) + '.');
    step(r, 'Orders at risk', risky.length ? risky.map(function (o) { return (o.no || o.title); }).join(', ') : 'None.');
    step(r, 'Waiting for approval', waiting.length + ' agent proposal(s).');
    step(r, 'Follow-ups', overdue.length + ' overdue; ' + quiet.length + ' deal(s) with nothing booked.');
    if (dueIssues.length) step(r, 'Client issues past deadline', dueIssues.length + '.');
    var one = risky.length ? 'Unblock order ' + (risky[0].no || risky[0].title) + ' — it can miss its deadline.'
      : waiting.length ? 'Clear the ' + waiting.length + ' proposal(s) on the Agent Desk.'
      : overdue.length ? 'Work through ' + overdue.length + ' overdue follow-up(s).' : 'Nothing is on fire. Call a Strategic account.';
    step(r, 'The one thing today', one);
    r.payload = { open: open.length, value: val, risky: risky.map(function (o) { return o.id; }), waiting: waiting.length, overdue: overdue.length, quiet: quiet.length, one: one };
    r.summary = one;
    r.confidence = 1;
    return r;
  }

  var api = { AGENTS: AGENTS, agentById: agentById, brief: brief, parseDeadline: parseDeadline, parsePeople: parsePeople,
              briefFilters: briefFilters, curate: curate, proposal: proposal, complianceRun: complianceRun,
              sourcing: sourcing, vendorsFor: vendorsFor, scoreBids: scoreBids, intake: intake, parseCSV: parseCSV,
              followups: followups, orderwatch: orderwatch, reorder: reorder, morning: morning };
  if (node) module.exports = api; else root.AG = api;
})(typeof self !== 'undefined' ? self : this);
