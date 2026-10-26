/* Glad U Came demo . B3: Start the brand (Won -> brand + project from a template, its tasks on people's Today),
   Brands & projects (brand record, project record with stages, tasks, files, History), the Influencer campaign flow
   (shortlist -> approval -> outreach -> content -> live link -> payout raised), and team threads everywhere
   (@mention lands on Today, files, voice notes, pins, Turn into task, What did we decide?), channels on Team threads.
   Loads after leads.js and before app.js. */
(function () {
  'use strict';
  var S = window.GUC_SCREENS, d = document, G = function () { return window.GUC_APP; };
  var TPLS = window.GUC_TEMPLATES, LAD = window.GUC_LADDERS;
  var DEPT = { 'Influencer campaign': 'Influencer', 'PR retainer': 'PR', 'PR project': 'PR', 'Celebrity gifting': 'Celebrity & gifting', 'Event': 'Events', 'Content': 'Content' };
  var CHANS = [['bd', 'BD'], ['influencer', 'Influencer'], ['pr', 'PR'], ['events', 'Events'], ['content', 'Content']];
  var OUT = ['Not sent', 'Sent', 'Replied', 'Rate agreed', 'Confirmed'];
  var INFL = [ // handle, name, category, city, followers, ER %, rate per reel
    ['@bandra.bites', 'Ishita Kapoor', 'Food', 'Bandra', 212000, 4.8, 45000], ['@thanekitchen', 'Aarav Joshi', 'Food', 'Thane', 98000, 6.1, 22000],
    ['@mumbaimasala.diaries', 'Riya Fernandes', 'Food', 'Andheri', 340000, 3.9, 60000], ['@glowwithtara', 'Tara Sen', 'Beauty', 'Juhu', 410000, 3.2, 75000],
    ['@runbombay', 'Kunal Shah', 'Fitness', 'Powai', 156000, 5.4, 35000], ['@pawsofmumbai', 'Diya Rao', 'Pets', 'Khar', 88000, 7.2, 18000],
    ['@sneakerheads.bom', 'Aman Gupta', 'Fashion', 'Bandra', 265000, 4.4, 50000], ['@streetstyle.mumbai', 'Sara Thomas', 'Fashion', 'Colaba', 132000, 5.9, 28000],
    ['@kicksbykabir', 'Kabir Anand', 'Fashion', 'Andheri', 74000, 8.1, 15000], ['@fitwithnaina', 'Naina Batra', 'Fitness', 'Bandra', 198000, 4.1, 40000],
    ['@juhu.glow', 'Mira Shah', 'Beauty', 'Juhu', 121000, 5.0, 26000], ['@thebombaycook', 'Farah Ali', 'Food', 'Colaba', 520000, 2.9, 90000]];
  var lakh = function (v) { return '₹' + (+v || 0).toFixed(1) + 'L'; };
  var rupees = function (n) { var s = String(Math.round(n)), last = s.slice(-3), rest = s.slice(0, -3); return '₹' + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last; };
  var kfmt = function (n) { return n >= 1e5 ? (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L' : Math.round(n / 1000) + 'K'; };
  var ini = function (s) { return String(s).replace(/^@/, '').split(/[\s.]+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase(); };
  var MASK = '₹ ••••';
  var seeFee = function (A) { return /^(Founder|Finance|Department head)$/.test(A.me().role); };
  var byId = function (list, id) { return list.filter(function (x) { return x.id === id; })[0]; };
  var proj = function (A, id) { return byId(A.D().projects, id); };
  var brand = function (A, id) { return byId(A.D().brands, id); };
  var headOf = function (A, dept) { return A.ORDER.filter(function (x) { return A.P[x].role === 'Department head' && A.P[x].dept === dept; })[0] || 'maddie'; };
  var load = function (A, id) { return A.D().tasks.filter(function (t) { return t.owner === id && (A.OPEN[t.status] || t.status === 'check'); }).length; };
  function pickRole(A, dept, role, team) {
    var pool = A.ORDER.filter(function (x) { return A.P[x].dept === dept && A.P[x].role === role && !A.P[x].leave; });
    pool.sort(function (a, b) { return (team.indexOf(b) >= 0) - (team.indexOf(a) >= 0) || load(A, a) - load(A, b); });
    return pool[0];
  }
  function phist(A, o, what) { o.history.push({ at: A.now(), who: A.ME(), what: what }); }

  /* ---------------- store: B3 shape on any older store (run on every load, idempotent) ---------------- */
  S._migrate = function (D, A) {
    var ch = false;
    D.tasks.forEach(function (t) { if (t.title === 'Quote for Fort Heritage Hotel gifting') { t.title = 'Proposal for Fort Heritage Hotel gifting'; ch = true; } });
    if (D.brands) return ch;
    var map = { 'Vendors booked': 'Venue and vendors', 'Drafting': 'Drafts' };
    D.brands = []; D.seqB = 0; D.approvals = []; D.seqA = 0;
    D.projects.forEach(function (p) {
      if (map[p.stage]) p.stage = map[p.stage];
      var b = D.brands.filter(function (x) { return x.name === p.brand; })[0], l = D.leads.filter(function (x) { return x.brand === p.brand; })[0];
      if (!b) {
        b = { id: 'B' + (++D.seqB), name: p.brand, lead: l ? l.id : '', created: A.addDays(A.TODAY + 'T10:00', -40 + D.seqB * 3),
          contacts: l ? [{ name: l.contact, role: 'Marketing head', mobile: l.mobile || '', email: l.email || '' }] : [], history: [] };
        b.history.push({ at: b.created, who: 'agent', what: 'Brand record made from the Won lead' + (l ? ' ' + l.brand : '') });
        D.brands.push(b);
      }
      p.bid = b.id; p.poc = p.team[0]; p.start = A.addDays(A.TODAY + 'T00:00', -10).slice(0, 10); p.files = p.files || []; p.thread = p.thread || []; p.lines = p.lines || [];
      p.history = [{ at: A.addDays(A.TODAY + 'T10:00', -10), who: p.team[0], what: 'Project made from the ' + p.template + ' template' }];
      p.owner_line = p.team.filter(function (x) { return A.P[x].role === 'Team member'; })[0] || p.team[0];
    });
    var p1 = byId(D.projects, 'P1');
    if (p1) {
      p1.files = [{ id: 'F1', n: 'Kora Diwali brief.pdf', size: 248000, type: 'application/pdf', by: 'kabir', at: A.addDays(A.TODAY + 'T11:00', -9) },
        { id: 'F2', n: 'Shortlist v2.xlsx', size: 31000, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', by: 'tanvi', at: A.addDays(A.TODAY + 'T16:20', -2) }];
      p1.slState = 'Approved';
      p1.lines = [['@bandra.bites', 'Confirmed', 'live'], ['@thanekitchen', 'Confirmed', 'content'], ['@mumbaimasala.diaries', 'Rate agreed', ''], ['@glowwithtara', 'Sent', '']].map(function (r) {
        var i = INFL.filter(function (x) { return x[0] === r[0]; })[0];
        return { h: r[0], rate: i[6], out: r[1], due: A.addDays(p1.live + 'T00:00', -2).slice(0, 10), content: r[2] === 'content' || r[2] === 'live', live: r[2] === 'live' ? 'https://instagram.com/reel/sample-bandrabites' : '', payout: '' };
      });
      p1.thread = [['kabir', 'Brief is in the Files tab. Live date stays as planned.', 2900], ['tanvi', 'Shortlist v2 sent. Meera liked the food pages, wants 3 more beauty names.', 1500],
        ['maddie', 'Decision: we go with 4 influencers now and add beauty names in week 2. Budget stays at ₹8L.', 1400], ['kabir', '@Tanvi can you get the Thane Kitchen draft by Thursday?', 300]]
        .map(function (m, k) { return { who: m[0], text: m[1], at: minsAgo(A, m[2]), files: k === 0 ? [p1.files[0]] : [], pin: k === 2 }; });
    }
    D.channels = {};
    var seedC = { bd: [['riya', 'Three discovery calls today. @Ishaan please send the credentials deck to Thane Organics.', 200]],
      influencer: [['kabir', 'Rate card is updated for food reels. Use it for every new shortlist.', 900], ['tanvi', 'Agreed, using it from today.', 880]],
      pr: [['ananya', 'Mid-Day food desk is open to the Bombay Brew story this week.', 400]], events: [['arjun', 'Venue for Monsoon Activewear: decision by tomorrow. Two options in the project.', 600]],
      content: [['neha', 'Reels for Bandra Book Cafe: first drafts tonight.', 120]] };
    CHANS.forEach(function (c) { D.channels[c[0]] = (seedC[c[0]] || []).map(function (m) { return { who: m[0], text: m[1], at: minsAgo(A, m[2]), files: [] }; }); });
    D.infl = INFL.map(function (i) { return { h: i[0], name: i[1], cat: i[2], city: i[3], fol: i[4], er: i[5], rate: i[6] }; });
    return true;
  };
  function minsAgo(A, m) { var t = new Date(Date.now() - m * 60000); return A.dayStr(t) + 'T' + ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2); }

  /* ---------------- tasks made by the system ---------------- */
  function mkTask(A, o) {
    var D = A.D(), t = { id: 'T-' + (++D.seq), title: o.title, owner: o.owner, checked_by: o.checker || A.P[o.owner].head || 'maddie', due: o.due, priority: o.priority || 'Normal',
      link: o.link || '', status: 'todo', blocked: '', team: '', pick: o.pick || '', checklist: [], assigned_by: o.by || A.ME(), kind: o.kind || '', history: [] };
    t.history.push({ at: A.now(), who: o.agent ? 'agent' : A.ME(), what: o.why || ('Assigned to ' + A.P[t.owner].name + ', Checked by ' + A.P[t.checked_by].name) });
    D.tasks.push(t);
    if (o.owner !== A.ME() && !o.quiet) A.note(o.owner, (o.agent ? 'New task: ' : A.me().name + ' gave you: ') + o.title);
    return t;
  }
  function closeTasks(A, link, re, why) {
    A.D().tasks.forEach(function (t) { if (t.link === link && A.OPEN[t.status] && re.test(t.title)) { t.status = 'done'; t.done_at = A.now(); t.history.push({ at: A.now(), who: A.ME(), what: 'Done: ' + why }); } });
  }
  function dueFrom(A, rule, start, date) {
    var m, at = function (day) { return day + 'T18:00'; }, add = function (iso, n) { return A.addDays(iso + 'T00:00', n).slice(0, 10); }, out;
    if ((m = rule.match(/^(?:month )?start \+ (\d+)/))) out = add(start, +m[1]);
    else if ((m = rule.match(/^(?:live|event) date ([+-]) (\d+)/))) out = add(date, (m[1] === '-' ? -1 : 1) * m[2]);
    else if ((m = rule.match(/^delivery \+ (\d+)/))) out = add(date, +m[1]);
    else if (/^(end date|month end)$/.test(rule)) out = add(date, 7);
    else if (rule === 'every Friday') { var t = new Date(start + 'T12:00'); do { t.setDate(t.getDate() + 1); } while (t.getDay() !== 5); out = A.dayStr(t); }
    else out = date;
    return at(out < A.TODAY ? A.TODAY : out);
  }
  function ownerFor(A, role, p) {
    if (role === 'Brand POC') return p.poc;
    if (role === 'Finance') return 'farhan';
    var m = role.match(/^(.+) (head|team member|intern)$/); if (!m) return p.poc;
    if (m[2] === 'head') return headOf(A, m[1]);
    return pickRole(A, m[1], m[2] === 'intern' ? 'Intern' : 'Team member', p.team) || pickRole(A, m[1], 'Team member', p.team) || headOf(A, m[1]);
  }

  /* ---------------- Start the brand (dialog, Speak fills it) ---------------- */
  function startDialog(A, l, b) {
    var D = A.D(), name = l ? l.brand : b.name, existing = b || D.brands.filter(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })[0];
    var heads = A.ORDER.filter(function (x) { return /Founder|Department head/.test(A.P[x].role); });
    if (l && heads.indexOf(l.owner) < 0) heads.unshift(l.owner);
    var tpl = l && l.interest && TPLS[l.interest] ? l.interest : 'Influencer campaign', poc = l ? (A.P[l.owner].role === 'Department head' || l.owner === 'maddie' ? l.owner : A.P[l.owner].head) : headOf(A, DEPT[tpl]);
    var opt = function (list, cur) { return list.map(function (o) { return '<option value="' + A.esc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + A.esc(o[1]) + '</option>'; }).join(''); };
    var bopts = [['new', 'New brand: ' + name]].concat(D.brands.map(function (x) { return [x.id, 'Link to ' + x.name]; }));
    var html = '<dialog class="dialog" id="dlg-start" aria-label="Start the brand" data-parse="start"' + (l ? ' data-lead="' + l.id + '"' : '') + '><form method="dialog" data-form="start">' +
      '<div class="dialog-head"><h2 class="h-page">Start the brand</h2>' + A.micBtn() + '<button class="btn btn--icon btn--ghost" type="button" aria-label="Close" data-do="close">' + A.ico('x') + '</button></div>' +
      '<div class="dialog-body"><div class="speak-strip">' + A.ico('microphone', 'i--sm') + '<span>Try: <q>Influencer campaign called Launch reels, live in 3 weeks, fee 4.8 lakh, Brand POC Kabir</q></span></div>' +
      '<p class="lede">' + (l ? '<b>' + A.esc(name) + '</b> is Won. ' : '') + 'This makes the brand record and its first project. The template puts every task on the right person\'s Today\'s tasks, with Checked by and dates worked back from the project date.</p>' +
      '<div class="f"><label for="sb-brand">Brand <em>*</em></label><select class="select" id="sb-brand" name="bid">' + opt(bopts, existing ? existing.id : 'new') + '</select>' +
      (existing ? '<span class="f-help">' + A.esc(existing.name) + ' is already on file, so it is linked, not made twice.</span>' : '') + '</div>' +
      '<div class="f-row"><div class="f"><label for="sb-tpl">Template <em>*</em></label><select class="select" id="sb-tpl" name="tpl">' + opt(A.TPL.map(function (t) { return [t, t]; }), tpl) + '</select></div>' +
      '<div class="f"><label for="sb-name">Project name <em>*</em></label><input class="input" id="sb-name" name="pname" value="' + A.esc(tpl + ', ' + name) + '"></div></div>' +
      '<div class="f-row"><div class="f"><label for="sb-date">Project date (live or event date) <em>*</em></label><input class="input" id="sb-date" name="pdate" type="date" value="' + A.addDays(A.TODAY + 'T00:00', 21).slice(0, 10) + '"></div>' +
      '<div class="f"><label for="sb-poc">Brand POC <em>*</em></label><select class="select" id="sb-poc" name="poc">' + opt(heads.map(function (x) { return [x, A.P[x].name]; }), poc) + '</select></div></div>' +
      '<div class="f-row"><div class="f"><label for="sb-fee">Fee, ₹ lakh</label><input class="input" id="sb-fee" name="fee" type="number" min="0" step="0.1" value="' + (l ? l.value : '') + '"></div>' +
      '<div class="f"><label for="sb-contact">Brand contact</label><input class="input" id="sb-contact" name="contact" value="' + A.esc(l ? l.contact : '') + '"></div></div>' +
      '<p class="f-help" id="sb-preview"></p><p class="f-err" id="sb-err" role="alert"></p></div>' +
      '<div class="dialog-foot"><span class="mic-hint">Speak fills the fields. You check, then save.</span><button class="btn btn--ghost" type="button" data-do="close">Cancel</button>' +
      '<button class="btn btn--next" type="submit">' + A.ico('rocket') + 'Start the brand</button></div></form></dialog>';
    var old = d.getElementById('dlg-start'); if (old) old.remove();
    d.body.insertAdjacentHTML('beforeend', html);
    var dl = d.getElementById('dlg-start'); if (b) dl.setAttribute('data-brand', b.id);
    preview(A, dl); dl.showModal();
  }
  function preview(A, dl) {
    var tpl = dl.querySelector('[name=tpl]').value, n = (TPLS[tpl] || []).length;
    dl.querySelector('#sb-preview').textContent = 'The ' + tpl + ' template makes ' + n + ' tasks for the ' + DEPT[tpl] + ' team, dated back from the project date.';
  }
  function parseStart(A, text, dl) {
    var s = text.toLowerCase(), out = {}, m;
    A.TPL.forEach(function (t) { if (s.indexOf(t.toLowerCase()) >= 0) out.tpl = t; });
    if ((m = text.match(/called ([^,]+)/i))) out.pname = m[1].trim().replace(/^\w/, function (c) { return c.toUpperCase(); });
    if ((m = s.match(/in (\d+) weeks?/))) out.pdate = A.addDays(A.TODAY + 'T00:00', 7 * m[1]).slice(0, 10);
    if ((m = s.match(/in (\d+) days?/))) out.pdate = A.addDays(A.TODAY + 'T00:00', +m[1]).slice(0, 10);
    if ((m = s.match(/fee ([\d.]+) lakh/))) out.fee = m[1];
    if ((m = s.match(/(?:brand poc|poc is|poc) (\w+)/))) A.ORDER.forEach(function (id) { if (A.first(id).toLowerCase() === m[1]) out.poc = id; });
    var n = 0;
    Object.keys(out).forEach(function (k) {
      var el = dl.querySelector('[name="' + k + '"]'); if (!el) return;
      if (el.tagName === 'SELECT' && !Array.prototype.some.call(el.options, function (o) { return o.value === out[k]; })) return;
      el.value = out[k]; el.closest('.f').classList.add('is-filled'); n++;
    });
    preview(A, dl); return n;
  }
  function saveStart(A, form) {
    var D = A.D(), dl = form.closest('dialog'), v = function (n) { return form.querySelector('[name="' + n + '"]').value.trim(); }, err = form.querySelector('#sb-err'), miss = [];
    if (!v('pname')) miss.push('Project name'); if (!v('pdate')) miss.push('Project date'); if (!v('poc')) miss.push('Brand POC');
    if (miss.length) { err.textContent = 'Please fill: ' + miss.join(', ') + '.'; return false; }
    var l = dl.getAttribute('data-lead') && byId(D.leads, dl.getAttribute('data-lead')), tpl = v('tpl'), dept = DEPT[tpl], b;
    if (v('bid') === 'new') {
      b = { id: 'B' + (++D.seqB), name: l ? l.brand : 'New brand', lead: l ? l.id : '', created: A.now(), contacts: [], history: [] };
      if (v('contact')) b.contacts.push({ name: v('contact'), role: 'Brand contact', mobile: l ? l.mobile || '' : '', email: l ? l.email || '' : '' });
      phist(A, b, 'Brand record made' + (l ? ' from the Won lead' : '')); D.brands.push(b);
    } else { b = brand(A, v('bid')); phist(A, b, 'Linked' + (l ? ' to the Won lead ' + l.brand : '') + ', new project ' + v('pname')); if (l && !b.lead) b.lead = l.id; }
    var team = [v('poc')].concat(A.ORDER.filter(function (x) { return A.P[x].dept === dept && x !== v('poc') && A.P[x].role !== 'Founder'; }));
    if (l && team.indexOf(l.owner) < 0) team.push(l.owner);
    var p = { id: 'P' + (D.projects.length + 1), brand: b.name, bid: b.id, name: v('pname'), template: tpl, dept: dept, team: team, live: v('pdate'), fee: parseFloat(v('fee')) || 0,
      stage: LAD[tpl][0], poc: v('poc'), start: A.TODAY, files: [], thread: [], lines: [], history: [], lead: l ? l.id : '' };
    phist(A, p, 'Project made from the ' + tpl + ' template' + (l ? ', from the Won lead ' + l.brand : '') + '. Brand POC ' + A.P[p.poc].name);
    var made = (TPLS[tpl] || []).map(function (r) {
      var who = ownerFor(A, r[1], p);
      return mkTask(A, { title: r[0], owner: who, due: dueFrom(A, r[2], p.start, p.live), link: p.id, agent: true, by: p.poc, priority: /approval|Upload/.test(r[0]) ? 'High' : 'Normal',
        why: 'Template ' + tpl + ': ' + r[1] + ', ' + r[2] + '. Assigned to ' + A.P[who].name + ', Checked by ' + A.P[A.P[who].head || 'maddie'].name });
    });
    p.owner_line = made.length ? (made.filter(function (t) { return A.P[t.owner].role === 'Team member'; })[0] || made[0]).owner : p.poc;
    phist(A, p, made.length + ' template tasks given to ' + made.map(function (t) { return t.owner; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (x) { return A.P[x].name; }).join(', '));
    D.projects.push(p);
    if (l) { l.history.push({ at: A.now(), who: A.ME(), what: 'Start the brand: ' + b.name + ', project ' + p.name }); l.project = p.id; }
    p.team.forEach(function (x) { A.note(x, A.me().name + ' started ' + b.name + ': ' + p.name + '. Your tasks are on Today\'s tasks.'); });
    A.save(); location.hash = '#/project/' + p.id;
    A.toast(b.name + ' started. ' + made.length + ' tasks are on the team\'s Today\'s tasks.');
    return true;
  }

  /* ---------------- team threads (leads, projects, channels) ---------------- */
  var TH = { sum: '', att: {} };
  function thread(A, tk) {
    var D = A.D();
    if (tk.charAt(0) === '#') return { list: D.channels[tk.slice(1)], title: '#' + tk.slice(1), link: '', where: '#' + tk.slice(1) };
    if (tk.charAt(0) === 'P') { var p = proj(A, tk); return { list: p.thread, title: p.brand + ' . ' + p.name, link: p.id, where: 'the ' + p.brand + ' project thread', team: p.team, obj: p }; }
    var l = byId(D.leads, tk); return { list: l.thread, title: l.brand, link: l.id, where: 'the ' + l.brand + ' team thread', obj: l };
  }
  function fileChip(A, f, tk) {
    return '<div class="file" data-file="' + f.id + '">' + A.ico(/pdf/.test(f.type) ? 'file-text' : /sheet|excel/.test(f.type) ? 'file-spreadsheet' : /image/.test(f.type) ? 'photo' : 'file-text') +
      '<div><b>' + A.esc(f.n) + '</b><span>' + (f.size > 1e6 ? (f.size / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1000)) + ' KB') + (f.by ? ' . ' + A.esc(A.first(f.by)) : '') + '</span></div>' +
      '<button class="btn btn--icon btn--sm btn--ghost" type="button" data-do="fview" data-f="' + f.id + '" data-tk="' + tk + '" aria-label="View ' + A.esc(f.n) + '">' + A.ico('eye') + '</button>' +
      '<button class="btn btn--icon btn--sm btn--ghost" type="button" data-do="fdown" data-f="' + f.id + '" data-tk="' + tk + '" aria-label="Download ' + A.esc(f.n) + '">' + A.ico('download') + '</button>' +
      '<button class="btn btn--icon btn--sm btn--ghost" type="button" data-do="fshare" data-f="' + f.id + '" data-tk="' + tk + '" aria-label="Share ' + A.esc(f.n) + '">' + A.ico('share') + '</button></div>';
  }
  function msgHtml(A, m, k, tk) {
    return '<div class="msg" data-m="' + k + '">' + A.avatar(m.who) + '<div><div class="msg-top"><b>' + A.esc(A.P[m.who].name) + '</b>' + (m.pin ? '<span class="chip chip--mint">Pinned</span>' : '') +
      '<time>' + A.dayWord(m.at) + ', ' + A.clock(m.at) + '</time></div>' + (m.text ? '<p class="msg-text">' + A.esc(m.text).replace(/@(\w+)/g, '<span class="mention">@$1</span>') + '</p>' : '') +
      (m.voice ? '<div class="file voice">' + A.ico('microphone') + '<div><b>Voice note, ' + m.voice + '</b><span>Sample. Voice notes record and play in the build.</span></div></div>' : '') +
      (m.files || []).map(function (f) { return fileChip(A, f, tk); }).join('') + (m.task ? '<span class="chip chip--blue" data-msg-task>' + A.ico('square-check') + 'Task ' + m.task.replace('T-', '') + '</span>' : '') + '</div>' +
      '<div class="msg-acts"><button class="btn btn--icon btn--sm btn--ghost" type="button" aria-label="' + (m.pin ? 'Unpin' : 'Pin this decision') + '" data-do="thpin" data-tk="' + tk + '" data-m="' + k + '">' + A.ico('pin') + '</button>' +
      '<button class="btn btn--icon btn--sm btn--ghost" type="button" aria-label="Turn into task" data-do="thtask" data-tk="' + tk + '" data-m="' + k + '">' + A.ico('square-check') + '</button></div></div>';
  }
  /* the Thread summariser: rules over the messages above, never invented text */
  function summary(A, tk) {
    var th = thread(A, tk), L = th.list, dec = [], open = [], asks = [];
    L.forEach(function (m) {
      var who = A.first(m.who), when = A.low(A.dayWord(m.at));
      if (m.pin || /\b(decision|decided|agreed|final|go with|hold at|confirmed|approved|stays)\b/i.test(m.text)) dec.push(who + ', ' + when + ': ' + m.text);
      else if (/\?\s*$/.test(m.text)) open.push(who + ' asked: ' + m.text);
      (m.text.match(/@(\w+)/g) || []).forEach(function (x) { asks.push(x.slice(1) + ' was asked by ' + who + ': ' + m.text.replace(/@\w+\s*/g, '').slice(0, 90)); });
    });
    var li = function (a, none) { return a.length ? '<ul>' + a.slice(-4).map(function (x) { return '<li>' + A.esc(x) + '</li>'; }).join('') + '</ul>' : '<p class="faint">' + none + '</p>'; };
    return '<div class="th-sum" data-summary><div class="th-sum-head"><b>What did we decide?</b><span class="chip">Thread summariser, from ' + L.length + ' messages, sample</span></div>' +
      '<span class="label">Decided</span>' + li(dec, 'No decision in this thread yet. Pin one to keep it here.') + '<span class="label">Still open</span>' + li(open, 'No open questions.') +
      '<span class="label">Asked of people</span>' + li(asks, 'Nobody was @mentioned.') + '</div>';
  }
  function threadPane(A, tk, opts) {
    opts = opts || {};
    var th = thread(A, tk), L = th.list, pins = L.filter(function (m) { return m.pin; }), att = TH.att[tk] || [];
    var team = th.team || (th.obj && th.obj.owner ? [th.obj.owner].concat(A.P[th.obj.owner].head ? [A.P[th.obj.owner].head] : []) : []);
    return '<aside class="thread" aria-label="Team thread" data-thread="' + tk + '"><div class="thread-head"><h2 class="h-sec">' + (opts.title ? A.esc(th.title) : 'Team thread') + '</h2><span class="avs">' + team.slice(0, 4).map(function (x) { return A.avatar(x); }).join('') + '</span>' +
      '<button class="btn btn--sm btn--ghost" type="button" data-do="thsum" data-tk="' + tk + '">' + A.ico('sparkles') + 'What did we decide?</button></div>' +
      (TH.sum === tk ? summary(A, tk) : '') +
      pins.map(function (m) { return '<div class="pinned" data-pinned>' + A.ico('pin') + '<div><b>Pinned by the team</b> . ' + A.esc(A.first(m.who)) + ': ' + A.esc(m.text) + '</div></div>'; }).join('') +
      '<div class="msgs">' + (L.length ? L.map(function (m, k) { return msgHtml(A, m, k, tk); }).join('') : '<p class="faint" style="font-size:var(--fs-12)">No messages yet. Talk about it here, not in a WhatsApp group: it stays with the record.</p>') + '</div>' +
      '<div class="composer">' + (att.length ? '<div class="att-row">' + att.map(function (f) { return '<span class="chip">' + A.ico('paperclip') + A.esc(f.n) + '</span>'; }).join('') + '</div>' : '') +
      '<label class="sr-only" for="th-msg">Write to the team</label><textarea class="input textarea composer-box" id="' + (opts.id || 'th-msg') + '" data-th-box="' + tk + '" rows="2" placeholder="Write to the team, type @ to mention"></textarea>' +
      '<div class="composer-row"><button class="btn btn--icon btn--sm btn--ghost" type="button" data-do="speakbox" data-box="' + (opts.id || 'th-msg') + '" aria-label="Speak">' + A.ico('microphone') + '</button>' +
      '<label class="btn btn--icon btn--sm btn--ghost" aria-label="Attach files">' + A.ico('paperclip') + '<input type="file" multiple hidden data-thfile="' + tk + '"></label>' +
      '<button class="btn btn--sm btn--ghost" type="button" data-do="thvoice" data-tk="' + tk + '">' + A.ico('microphone') + 'Voice note</button><span class="spacer"></span>' +
      '<button class="btn btn--sm btn--solid" type="button" data-do="' + (opts.send || 'thsend') + '" data-tk="' + tk + '"' + (opts.send ? ' data-l="' + tk + '"' : '') + '>' + A.ico('send') + 'Send</button></div></div></aside>';
  }
  window.GUC_THREAD = threadPane;
  function sendTo(A, tk, text) {
    var th = thread(A, tk), att = TH.att[tk] || [];
    if (!text && !att.length) return false;
    var m = { who: A.ME(), text: text, at: A.now(), files: att };
    th.list.push(m); TH.att[tk] = [];
    if (th.obj && th.obj.files && att.length) att.forEach(function (f) { th.obj.files.push(f); });
    if (th.obj && th.obj.history && att.length) phist(A, th.obj, 'Added ' + att.length + ' file' + (att.length === 1 ? '' : 's') + ' in the team thread');
    mentionTasks(A, text, th);
    return true;
  }
  /* @mention: a bell line and a task-style row on that person's Today */
  function mentionTasks(A, text, th) {
    (text.match(/@(\w+)/g) || []).forEach(function (x) {
      var f = x.slice(1).toLowerCase();
      A.ORDER.forEach(function (id) {
        if (A.first(id).toLowerCase() !== f || id === A.ME()) return;
        mkTask(A, { title: 'Reply to ' + A.first(A.ME()) + ' in ' + th.title + ': ' + text.replace(/@\w+\s*/g, '').slice(0, 70), owner: id, checker: id, due: A.now(), link: th.link, kind: 'mention',
          why: A.me().name + ' mentioned ' + A.P[id].name + ' in ' + th.where, quiet: true });
        A.note(id, A.me().name + ' mentioned you in ' + th.where + ': ' + text.slice(0, 90));
        if (th.team && th.team.indexOf(id) < 0) th.team.push(id);
      });
    });
  }

  /* ---------------- Brands & projects ---------------- */
  var projectsFor = function (A) {
    var u = A.me(), Pj = A.D().projects;
    if (u.role === 'Founder' || u.role === 'Finance') return Pj;
    return Pj.filter(function (p) { return p.team.indexOf(u.id) >= 0 || (u.role === 'Department head' && p.dept === u.dept); });
  };
  var BF = { q: '', tpl: '', dept: '', poc: '', date: '', from_d: '', to_d: '' };
  function selF(A, name, label, opts, cur) { return A.sel(name, label, opts, cur).replace(/data-tf=/g, 'data-bf='); }
  function datePass(A, F, day) {
    if (!F.date) return true; var n = A.daysBetween(A.TODAY, day);
    return F.date === 'today' ? n === 0 : F.date === 'week' ? n >= -6 && n <= 6 : F.date === 'month' ? day.slice(0, 7) === A.TODAY.slice(0, 7) : F.date === '30' ? n >= -30 && n <= 0 : !((F.from_d && day < F.from_d) || (F.to_d && day > F.to_d));
  }
  S.brands = function (A) {
    var mine = projectsFor(A), D = A.D(), fee = seeFee(A);
    var brands = D.brands.filter(function (b) { return mine.some(function (p) { return p.bid === b.id; }); });
    var rows = brands.filter(function (b) {
      var ps = mine.filter(function (p) { return p.bid === b.id; });
      if (BF.q && (b.name + ' ' + ps.map(function (p) { return p.name; }).join(' ') + ' ' + b.contacts.map(function (c) { return c.name; }).join(' ')).toLowerCase().indexOf(BF.q.toLowerCase()) < 0) return false;
      if (BF.tpl && !ps.some(function (p) { return p.template === BF.tpl; })) return false;
      if (BF.dept && !ps.some(function (p) { return p.dept === BF.dept; })) return false;
      if (BF.poc && !ps.some(function (p) { return p.poc === BF.poc; })) return false;
      return datePass(A, BF, b.created.slice(0, 10));
    });
    var pocs = A.ORDER.filter(function (x) { return mine.some(function (p) { return p.poc === x; }); });
    var F = '<div class="filters"><label class="search"><span class="sr-only">Search brands</span>' + A.ico('search') + '<input class="input" data-bf="q" value="' + A.esc(BF.q) + '" placeholder="Search brand, project, contact"></label>' +
      selF(A, 'tpl', 'Template', [['', 'Template: all']].concat(A.TPL), BF.tpl) + selF(A, 'dept', 'Department', [['', 'Department: all']].concat(Object.keys(DEPT).map(function (k) { return DEPT[k]; }).filter(function (x, i, a) { return a.indexOf(x) === i; })), BF.dept) +
      selF(A, 'poc', 'Brand POC', [['', 'Brand POC: anyone']].concat(pocs.map(function (x) { return [x, A.P[x].name]; })), BF.poc) +
      selF(A, 'any', 'Pick any field', [['', '+ Any field'], 'Contact', 'Stage', 'Live date'], '') + A.dateFilter(BF).replace(/data-tf=/g, 'data-bf=') + '</div>';
    var list = rows.length ? rows.map(function (b) {
      var ps = mine.filter(function (p) { return p.bid === b.id; }), sum = ps.reduce(function (a, p) { return a + p.fee; }, 0);
      return '<div class="lrow brand-row" style="--cols:minmax(0,2fr) minmax(0,2fr) auto auto" data-brand="' + b.id + '"><a class="cell-who" href="#/brand/' + b.id + '"><span class="av av--lg">' + A.esc(ini(b.name)) + '</span><div><b>' + A.esc(b.name) + '</b><span>' + ps.length + ' project' + (ps.length === 1 ? '' : 's') + ' . ' + b.contacts.length + ' contact' + (b.contacts.length === 1 ? '' : 's') + '</span></div></a>' +
        '<div class="proj-chips">' + ps.map(function (p) { return '<a class="chip chip--mint" href="#/project/' + p.id + '">' + A.ico('briefcase') + A.esc(p.name) + ' . ' + A.esc(p.stage) + '</a>'; }).join('') + '</div>' +
        '<span class="avs">' + ps.map(function (p) { return A.avatar(p.poc); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join('') + '</span><span class="money num">' + (fee ? lakh(sum) : MASK) + '</span></div>'; }).join('')
      : '<div class="card empty"><span class="empty-art">' + A.ico('briefcase') + '</span><h2 class="h-sec">No brands on this filter</h2><p>Clear a filter, or win a lead and press Start the brand.</p><button class="btn btn--next" type="button" data-do="bfclear">Clear filters</button></div>';
    return '<section class="card card--flush" data-brands><div style="padding:var(--s-4) var(--s-4) var(--s-3);display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Brands &amp; projects</h1><span class="chip">' + rows.length + ' of ' + brands.length + ' brands</span><span class="chip">Sample data</span></div>' + F + '</div>' +
      '<div class="list" style="border-top:1px solid var(--line)">' + list + '</div><div class="list-foot"><span>' + mine.length + ' projects you can see</span><span class="spacer" style="flex:1"></span>' + (fee ? '' : '<span>Fees show as ' + MASK + ' for your role</span>') + '</div></section>';
  };
  var BTAB = 'projects';
  S.brand = function (A) {
    var id = (location.hash.match(/^#\/brand\/(B\d+)/) || [])[1], b = id && brand(A, id), ps = b ? projectsFor(A).filter(function (p) { return p.bid === b.id; }) : [];
    if (!b || !ps.length) return '<div class="card empty"><span class="empty-art">' + A.ico('briefcase') + '</span><h2 class="h-sec">This brand is not on your list</h2><p>Brands show for the people on their projects, their department heads and Maddie.</p><a class="btn btn--next" href="#/brands">Back to Brands &amp; projects</a></div>';
    var fee = seeFee(A), l = b.lead && byId(A.D().leads, b.lead);
    var tabs = [['projects', 'Projects ' + ps.length], ['contacts', 'Contacts ' + b.contacts.length], ['history', 'History ' + b.history.length]];
    var body = BTAB === 'contacts' ? '<div class="list">' + b.contacts.map(function (c) { return '<div class="lrow" style="--cols:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)"><div class="cell-who"><span class="av av--c">' + A.esc(ini(c.name)) + '</span><div><b>' + A.esc(c.name) + '</b><span>' + A.esc(c.role) + '</span></div></div><span>' + A.esc(c.mobile || 'No mobile') + '</span><span class="faint">' + A.esc(c.email || 'No email') + '</span></div>'; }).join('') + '</div>' +
        '<form class="f-row" data-form="contact" data-b="' + b.id + '" style="align-items:end"><div class="f"><label for="bc-name">Contact name <em>*</em></label><input class="input" id="bc-name" name="name"></div><div class="f"><label for="bc-role">Role</label><input class="input" id="bc-role" name="role" placeholder="e.g. Marketing head"></div><div class="f"><label for="bc-mob">Mobile</label><input class="input" id="bc-mob" name="mobile"></div><div><button class="btn btn--solid btn--sm" type="submit">' + A.ico('plus') + 'Add contact</button></div></form>'
      : BTAB === 'history' ? histList(A, b.history)
      : '<div class="list">' + ps.map(function (p) { return '<a class="lrow" style="--cols:minmax(0,2fr) minmax(0,1fr) auto auto;color:inherit;text-decoration:none" href="#/project/' + p.id + '"><div class="cell-who"><span class="av av--lg">' + A.ico('briefcase', 'i--sm') + '</span><div><b>' + A.esc(p.name) + '</b><span>' + A.esc(p.template + ' . ' + p.dept) + '</span></div></div><span class="chip chip--mint">' + A.esc(p.stage) + '</span><span>' + A.dayWord(p.live + 'T00:00') + '</span><span class="money num">' + (fee ? lakh(p.fee) : MASK) + '</span></a>'; }).join('') + '</div>';
    return '<section class="card rec-head" data-brand-rec="' + b.id + '"><div class="page-head"><a class="btn btn--sm btn--ghost" href="#/brands">' + A.ico('arrow-back-up') + 'Brands &amp; projects</a><span class="label">Brand</span><span class="spacer" style="flex:1"></span>' +
      (A.me().role === 'Founder' || A.me().role === 'Department head' ? '<button class="btn btn--next btn--sm" type="button" data-do="newproj" data-b="' + b.id + '">' + A.ico('plus') + 'New project</button>' : '') + '</div>' +
      '<h1 class="h-page">' + A.esc(b.name) + '</h1><p class="rec-sentence">' + A.esc(b.name) + ' has ' + ps.length + ' project' + (ps.length === 1 ? '' : 's') + ' with us' + (l ? ', first won as a lead on ' + A.dayWord(b.created) : '') + '. ' + (b.contacts[0] ? A.esc(b.contacts[0].name) + ' is the main contact.' : 'No contact yet: add one.') + '</p>' +
      '<div class="facts">' + [['Brand POC', A.P[ps[0].poc].name], ['Since', A.dayWord(b.created)], ['Projects', String(ps.length)], ['Fees', fee ? lakh(ps.reduce(function (a, p) { return a + p.fee; }, 0)) : MASK], ['From lead', l ? l.brand + ', ' + l.stage : 'Added directly']].map(function (f) { return '<div class="fact"><span class="label">' + f[0] + '</span><b>' + A.esc(f[1]) + '</b></div>'; }).join('') + '</div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button class="tab" role="tab" type="button" data-do="btab" data-t="' + t[0] + '" aria-selected="' + (BTAB === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' + body + '</section>';
  };
  function histList(A, h) {
    return '<div class="list hist" data-history>' + h.slice().reverse().map(function (x) { return '<div class="lrow" style="--cols:120px minmax(0,1fr)"><span class="label">' + A.dayWord(x.at) + ', ' + A.clock(x.at) + '</span><span>' + (x.who === 'agent' || !A.P[x.who] ? '' : A.esc(A.P[x.who].name) + ': ') + A.esc(x.what) + '</span></div>'; }).join('') + '</div>';
  }

  /* ---------------- project record ---------------- */
  var PTAB = 'tasks', SL = { cat: '', city: '', min: '', pick: {} };
  S.project = function (A) {
    var id = (location.hash.match(/^#\/project\/(P\d+)/) || [])[1], p = id && proj(A, id);
    if (!p || projectsFor(A).indexOf(p) < 0) return '<div class="card empty"><span class="empty-art">' + A.ico('briefcase') + '</span><h2 class="h-sec">This project is not on your list</h2><p>Projects show for their team, their department head, Finance and Maddie.</p><a class="btn btn--next" href="#/brands">Back to Brands &amp; projects</a></div>';
    var lad = LAD[p.template], i = Math.max(0, lad.indexOf(p.stage)), fee = seeFee(A), T = A.D().tasks.filter(function (t) { return t.link === p.id && t.status !== 'cancelled'; });
    var steps = '<div><div class="steps" aria-hidden="true">' + lad.map(function (s, k) { return '<i' + (k < i ? ' class="on"' : k === i ? ' class="now"' : '') + '></i>'; }).join('') + '</div><span class="steps-txt">Stage ' + (i + 1) + ' of ' + lad.length + ': ' + A.esc(p.stage) + '</span></div>';
    var next = i < lad.length - 1 && (p.team.indexOf(A.ME()) >= 0 || A.me().role === 'Founder') ? '<button class="btn btn--next" type="button" data-do="pnext" data-p="' + p.id + '">' + A.ico('arrow-right') + 'Move to ' + A.esc(lad[i + 1]) + '</button>' : '';
    var open = T.filter(function (t) { return A.OPEN[t.status]; }), over = open.filter(A.isOverdue);
    var facts = [['Brand', p.brand], ['Template', p.template], ['Brand POC', A.P[p.poc].name], ['Project date', A.dayWord(p.live + 'T00:00')], ['Fee', fee ? lakh(p.fee) : MASK], ['Open tasks', open.length + (over.length ? ', ' + over.length + ' overdue' : '')]]
      .map(function (f) { return '<div class="fact"><span class="label">' + f[0] + '</span><b' + (/overdue/.test(f[1]) ? ' class="t-red"' : '') + '>' + A.esc(f[1]) + '</b></div>'; }).join('');
    var allFiles = p.files;
    var tabs = [['tasks', 'Tasks ' + T.length]].concat(p.template === 'Influencer campaign' ? [['infl', 'Influencers ' + p.lines.length]] : []).concat([['files', 'Files ' + allFiles.length], ['history', 'History ' + p.history.length]]);
    if (PTAB === 'infl' && p.template !== 'Influencer campaign') PTAB = 'tasks';
    var body = PTAB === 'history' ? histList(A, p.history) : PTAB === 'files' ? filesTab(A, p) : PTAB === 'infl' ? inflTab(A, p) : tasksTab(A, T);
    return '<section class="record" data-project="' + p.id + '"><div class="card rec-head">' +
      '<div class="page-head"><a class="btn btn--sm btn--ghost" href="#/brand/' + p.bid + '">' + A.ico('arrow-back-up') + A.esc(p.brand) + '</a><span class="label">Project . ' + A.esc(p.template) + '</span><span class="spacer" style="flex:1"></span><span class="avs">' + p.team.map(function (x) { return A.avatar(x); }).join('') + '</span></div>' +
      '<h1 class="h-page">' + A.esc(p.name) + '</h1>' +
      '<p class="rec-sentence">' + A.esc(p.brand) + ', ' + A.esc(p.template.toLowerCase()) + ', ' + A.esc(A.P[p.poc].name) + ' is the Brand POC. Project date ' + A.low(A.dayWord(p.live + 'T00:00')) + '. ' + open.length + ' open task' + (open.length === 1 ? '' : 's') + (over.length ? ', ' + over.length + ' overdue.' : '.') + '</p>' +
      '<div class="rec-next">' + next + steps + '</div><div class="facts">' + facts + '</div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button class="tab" role="tab" type="button" data-do="ptab" data-t="' + t[0] + '" aria-selected="' + (PTAB === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' + body + '</div>' +
      threadPane(A, p.id) + '</section>';
  };
  function tasksTab(A, T) {
    var ST = { todo: 'To do', blocked: 'Blocked', check: 'Waiting for check', done: 'Done' };
    return T.length ? '<div class="list" data-ptasks>' + T.slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; }).map(function (t) {
      return '<div class="lrow" style="--cols:minmax(0,2fr) minmax(0,1fr) auto" data-ptask="' + t.id + '"><div style="min-width:0"><b>' + A.esc(t.title) + '</b><div class="faint" style="font-size:var(--fs-12)">Checked by ' + A.esc(A.P[t.checked_by].name) + ' . ' + (A.isOverdue(t) ? '<span class="t-red">Overdue, ' + A.low(A.dayWord(t.due)) + '</span>' : A.dayWord(t.due) + ', ' + A.clock(t.due)) + '</div></div>' +
        '<span class="cell-who">' + A.avatar(t.owner) + '<span>' + A.esc(A.P[t.owner].name) + '</span></span><span class="chip' + (t.status === 'done' ? ' chip--green' : t.status === 'blocked' ? ' chip--red' : t.status === 'check' ? ' chip--blue' : '') + '">' + ST[t.status] + '</span></div>'; }).join('') + '</div>'
      : '<p class="faint">No tasks on this project yet.</p>';
  }
  function filesTab(A, p) {
    return '<div class="files-tab" data-files><div style="display:flex;gap:var(--s-2);align-items:center"><label class="btn btn--sm btn--solid">' + A.ico('upload') + 'Add files<input type="file" multiple hidden data-pfile="' + p.id + '"></label><span class="faint" style="font-size:var(--fs-12)">Many files at once. View opens in the browser; Share gives a link that needs no login in the build.</span></div>' +
      (p.files.length ? '<div class="file-grid">' + p.files.map(function (f) { return fileChip(A, f, p.id); }).join('') + '</div>' : '<p class="faint">No files yet. Add the brief, the shortlist or the report here.</p>') + '</div>';
  }
  /* ---------------- Influencer campaign: shortlist -> approval -> outreach -> content -> live link -> payout ---------------- */
  function inflTab(A, p) {
    var D = A.D(), on = function (h) { return p.lines.some(function (x) { return x.h === h; }); }, html = '';
    var wAp = function (ln) { return A.D().approvals.filter(function (a) { return a.link === p.id && a.line === ln && a.status === 'Waiting'; })[0]; }, mayDo = function (ln) { var a = wAp(ln); return !!a && (a.approver === A.ME() || A.me().role === 'Founder'); }, canApprove = mayDo('shortlist'), total = p.lines.reduce(function (a, x) { return a + x.rate; }, 0);
    if (p.slState !== 'Approved') {
      var cats = [], cities = []; D.infl.forEach(function (x) { if (cats.indexOf(x.cat) < 0) cats.push(x.cat); if (cities.indexOf(x.city) < 0) cities.push(x.city); });
      var list = D.infl.filter(function (x) { return !on(x.h) && (!SL.cat || x.cat === SL.cat) && (!SL.city || x.city === SL.city) && (!SL.min || x.fol >= +SL.min); });
      var n = Object.keys(SL.pick).filter(function (h) { return SL.pick[h]; }).length;
      html += '<div class="sl" data-shortlist><div class="card-head"><h2 class="h-sec">Shortlist from the influencer list</h2></div><div class="filters">' +
        A.sel('cat', 'Category', [['', 'Category: all']].concat(cats), SL.cat).replace(/data-tf=/g, 'data-sl=') + A.sel('city', 'City', [['', 'City: all']].concat(cities), SL.city).replace(/data-tf=/g, 'data-sl=') +
        A.sel('min', 'Followers', [['', 'Followers: any'], ['50000', '50K and up'], ['100000', '1L and up'], ['250000', '2.5L and up']], SL.min).replace(/data-tf=/g, 'data-sl=') + '</div>' +
        '<div class="list">' + list.map(function (x) {
          return '<label class="lrow infl-row" style="--cols:auto minmax(0,2fr) minmax(0,1fr) auto auto auto;cursor:pointer"><input type="checkbox" data-slpick="' + x.h + '"' + (SL.pick[x.h] ? ' checked' : '') + '><span class="cell-who"><span class="av">' + A.esc(ini(x.h)) + '</span><span><b>' + A.esc(x.h) + '</b><br><span class="faint" style="font-size:var(--fs-12)">' + A.esc(x.name) + '</span></span></span>' +
            '<span>' + x.cat + ', ' + x.city + '</span><span class="num">' + kfmt(x.fol) + '</span><span class="num">' + x.er + '% ER</span><span class="money num">' + rupees(x.rate) + '</span></label>'; }).join('') + '</div>' +
        '<div style="display:flex;gap:var(--s-2);align-items:center"><button class="btn btn--sm btn--solid" type="button" data-do="sladd" data-p="' + p.id + '"' + (n ? '' : ' disabled') + '>' + A.ico('plus') + 'Add ' + n + ' to the shortlist</button><span class="faint" style="font-size:var(--fs-12)">' + list.length + ' influencers match</span></div></div>';
    }
    if (p.lines.length) {
      html += '<div class="card-head" style="margin-top:var(--s-3)"><h2 class="h-sec">Campaign lines</h2><span class="chip">' + p.lines.length + ' influencers . ' + rupees(total) + '</span></div>';
      if (!p.slState) html += '<div class="appr-bar"><span>Shortlist ready. It goes to Approvals as an Influencer fee approval before anyone writes to an influencer.</span><button class="btn btn--sm btn--next" type="button" data-do="slsend" data-p="' + p.id + '">' + A.ico('send') + 'Send shortlist to Approvals</button></div>';
      if (p.slState === 'Waiting') html += '<div class="appr-bar is-wait" data-appr-wait><span class="chip chip--amber">' + A.ico('clock-pause') + 'Waiting in Approvals: Influencer fee, shortlist, ' + rupees(total) + ', with ' + A.esc(A.P[(wAp('shortlist') || { approver: headOf(A, p.dept) }).approver].name) + '</span>' +
        (canApprove ? '<button class="btn btn--sm btn--next" type="button" data-do="slapprove" data-p="' + p.id + '">' + A.ico('check') + 'Approve</button><button class="btn btn--sm" type="button" data-do="slback" data-p="' + p.id + '">' + A.ico('arrow-back-up') + 'Send back</button>' : '') + '</div>';
      html += '<div class="list" data-lines>' + p.lines.map(function (x, k) {
        var act = '';
        if (p.slState !== 'Approved') act = p.slState ? '<span class="chip">Shortlisted</span>' : '<button class="btn btn--sm btn--ghost" type="button" data-do="slrm" data-p="' + p.id + '" data-k="' + k + '">' + A.ico('x') + 'Remove</button>';
        else if (x.out !== 'Confirmed') act = '<label class="sr-only" for="out-' + k + '">Outreach for ' + A.esc(x.h) + '</label><select class="select" id="out-' + k + '" data-out="' + k + '" data-p="' + p.id + '">' + OUT.map(function (o) { return '<option' + (o === x.out ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
        else if (!x.content) act = '<span class="label">Content due</span><input class="input" type="date" data-cdue="' + k + '" data-p="' + p.id + '" value="' + x.due + '" aria-label="Content due for ' + A.esc(x.h) + '"><button class="btn btn--sm btn--next" type="button" data-do="lcontent" data-p="' + p.id + '" data-k="' + k + '">' + A.ico('check') + 'Content received</button>';
        else if (!x.live) act = '<input class="input" data-livein="' + k + '" placeholder="Paste the live link" aria-label="Live link for ' + A.esc(x.h) + '"><button class="btn btn--sm btn--next" type="button" data-do="llive" data-p="' + p.id + '" data-k="' + k + '">' + A.ico('link') + 'Add live link</button>';
        else if (!x.payout) act = '<a class="chip chip--green" href="' + A.esc(x.live) + '" target="_blank" rel="noopener">' + A.ico('link') + 'Live link</a><button class="btn btn--sm btn--next" type="button" data-do="lpay" data-p="' + p.id + '" data-k="' + k + '">' + A.ico('currency-rupee') + 'Raise payout ' + rupees(x.rate) + '</button>';
        else act = '<a class="chip chip--green" href="' + A.esc(x.live) + '" target="_blank" rel="noopener">' + A.ico('link') + 'Live link</a><span class="chip chip--amber" data-payout>Payout ' + rupees(x.rate) + ': ' + x.payout + '</span>' +
          (x.payout === 'Waiting for approval' && mayDo(x.h) ? '<button class="btn btn--sm" type="button" data-do="lpayok" data-p="' + p.id + '" data-k="' + k + '">' + A.ico('check') + 'Approve</button>' : '');
        var st = p.slState !== 'Approved' ? 'Shortlisted' : x.payout ? 'Payout ' + x.payout.toLowerCase() : x.live ? 'Live link in' : x.content ? 'Content received' : x.out === 'Confirmed' ? 'Confirmed, content due ' + A.low(A.dayWord(x.due + 'T00:00')) : 'Outreach: ' + x.out;
        return '<div class="lrow line-row" style="--cols:minmax(0,1.3fr) minmax(0,2.2fr)" data-line="' + A.esc(x.h) + '"><div style="min-width:0"><b>' + A.esc(x.h) + '</b><div class="faint" style="font-size:var(--fs-12)">' + rupees(x.rate) + ' . <span data-line-st>' + A.esc(st) + '</span></div></div><div class="line-acts">' + act + '</div></div>'; }).join('') + '</div>';
    }
    return html || '<p class="faint">No influencers yet.</p>';
  }
  function stageTo(A, p, s) { var lad = LAD[p.template]; if (lad.indexOf(s) > lad.indexOf(p.stage)) { phist(A, p, 'Stage ' + p.stage + ' to ' + s); p.stage = s; } }
  function lineAct(A, act, p, k) {
    var x = p.lines[k], owner = p.owner_line || p.poc, head = headOf(A, p.dept), D = A.D();
    if (act === 'lcontent') {
      x.content = true; phist(A, p, 'Content received from ' + x.h);
      closeTasks(A, p.id, new RegExp('Collect content from ' + x.h.replace(/[.]/g, '\\.')), 'content received');
      mkTask(A, { title: 'Check the content from ' + x.h + ' against the brief', owner: p.poc, due: A.TODAY + 'T18:00', link: p.id, agent: true, why: 'Campaign agent: content from ' + x.h + ' is in' });
      stageTo(A, p, 'Content review'); A.toast('Content from ' + x.h + ' is in. ' + A.first(p.poc) + ' checks it next.');
    }
    if (act === 'llive') {
      var inp = d.querySelector('[data-livein="' + k + '"]'), v = inp.value.trim();
      if (!/^https?:\/\/\S+\.\S+/.test(v)) { inp.setAttribute('aria-invalid', 'true'); inp.placeholder = 'A live link starts with https://'; inp.focus(); A.toast('Paste the live link, starting with https://'); return false; }
      x.live = v; phist(A, p, 'Live link added for ' + x.h + ': ' + v);
      closeTasks(A, p.id, new RegExp('Check the content from ' + x.h.replace(/[.]/g, '\\.')), 'live link in');
      mkTask(A, { title: 'Raise the payout for ' + x.h + ', ' + rupees(x.rate), owner: owner, due: A.TODAY + 'T18:00', link: p.id, agent: true, why: 'Campaign agent: live link in for ' + x.h });
      stageTo(A, p, 'Live'); A.toast('Live link saved for ' + x.h + '. ' + A.first(owner) + ' raises the payout next.');
    }
    if (act === 'lpay') {
      var inf = (D.infl || []).filter(function (i) { return i.h === x.h; })[0];
      var po = { id: 'PO' + (++D.seqPO), no: 'GUC-PO-' + ('000' + (D.seqPO)).slice(-4), ptype: 'Influencer', payee: x.h, project: p.id, amount: x.rate, tds: 10, stage: 'Documents in', docs: { live: !!x.live, inv: true, pan: !inf || inf.pan !== 'No' }, bank: '', history: [] };
      po.history.push({ at: A.now(), who: A.ME(), what: 'Payout requested by ' + A.me().name + '; live link, invoice and PAN on file' }); D.payouts.push(po);
      x.payout = 'Waiting for approval';
      var pa = window.GUC_APPR.raise(A, { type: 'Payout', what: x.h + ', ' + p.brand, amount: x.rate, link: p.id, ref: po.id, line: x.h });
      closeTasks(A, p.id, new RegExp('Raise the payout for ' + x.h.replace(/[.]/g, '\\.')), 'payout raised');
      A.toast('Payout raised. It is in Approvals with ' + A.first(pa.approver) + '.');
    }
    if (act === 'lpayok') {
      var wa = D.approvals.filter(function (a) { return a.link === p.id && a.type === 'Payout' && a.line === x.h && a.status === 'Waiting'; })[0];
      if (wa) window.GUC_APPR.decide(A, wa.id, true);
      return false;
    }
    return true;
  }

  /* ---------------- Team threads screen ---------------- */
  var TT = { open: '#influencer', q: '', kind: '', date: '', from_d: '', to_d: '' };
  S.threads = function (A) {
    var D = A.D(), u = A.me(), m = location.hash.match(/^#\/threads\/(c-\w+|P\d+|L\d+)/);
    if (m) TT.open = m[1].indexOf('c-') === 0 ? '#' + m[1].slice(2) : m[1];
    var leadsMine = D.leads.filter(function (l) { return l.thread.length && (u.role === 'Founder' || l.owner === u.id || (A.P[l.owner].head === u.id)); });
    var all = CHANS.map(function (c) { var L = D.channels[c[0]]; return { tk: '#' + c[0], kind: 'Channel', t: '#' + c[0], sub: c[1] + ' channel', L: L }; })
      .concat(projectsFor(A).map(function (p) { return { tk: p.id, kind: 'Project', t: p.brand + ' . ' + p.name, sub: 'Project thread . ' + p.team.length + ' people', L: p.thread }; }))
      .concat(leadsMine.map(function (l) { return { tk: l.id, kind: 'Lead', t: l.brand, sub: 'Lead thread . ' + l.stage, L: l.thread }; }));
    var rows = all.filter(function (r) {
      if (TT.kind && r.kind !== TT.kind) return false;
      if (TT.q && (r.t + ' ' + r.L.map(function (x) { return x.text; }).join(' ')).toLowerCase().indexOf(TT.q.toLowerCase()) < 0) return false;
      var last = r.L[r.L.length - 1]; return !TT.date || (last && datePass(A, TT, last.at.slice(0, 10)));
    });
    if (!all.some(function (r) { return r.tk === TT.open; })) TT.open = '#influencer';
    var F = '<div class="filters"><label class="search"><span class="sr-only">Search threads</span>' + A.ico('search') + '<input class="input" data-tt="q" value="' + A.esc(TT.q) + '" placeholder="Search threads and messages"></label>' +
      A.sel('kind', 'Kind', [['', 'Kind: all'], 'Channel', 'Project', 'Lead'], TT.kind).replace(/data-tf=/g, 'data-tt=') + A.sel('any', 'Pick any field', [['', '+ Any field'], 'Person', 'Has files', 'Pinned'], '').replace(/data-tf=/g, 'data-tt=') + A.dateFilter(TT).replace(/data-tf=/g, 'data-tt=') + '</div>';
    var list = rows.map(function (r) {
      var last = r.L[r.L.length - 1];
      return '<a class="lrow thread-row" style="--cols:auto minmax(0,1fr) auto;color:inherit;text-decoration:none" href="#/threads/' + (r.kind === 'Channel' ? 'c-' + r.tk.slice(1) : r.tk) + '"' + (r.tk === TT.open ? ' aria-current="true"' : '') + ' data-tk="' + r.tk + '"><span class="av av--lg">' + A.ico(r.kind === 'Channel' ? 'hash' : r.kind === 'Project' ? 'briefcase' : 'layout-kanban', 'i--sm') + '</span>' +
        '<div style="min-width:0"><b>' + A.esc(r.t) + '</b><div class="msg-snip faint" style="font-size:var(--fs-12);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (last ? A.esc(A.first(last.who) + ': ' + (last.text || 'sent a file')) : A.esc(r.sub)) + '</div></div><span class="faint" style="font-size:var(--fs-11)">' + (last ? A.dayWord(last.at) : '') + '</span></a>'; }).join('');
    return '<section class="record" data-threads><section class="card card--flush"><div style="padding:var(--s-4) var(--s-4) var(--s-3);display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Team threads</h1><span class="chip">Sample data</span></div>' +
      '<div class="chan-list">' + CHANS.map(function (c) { return '<a class="chip' + (TT.open === '#' + c[0] ? ' chip--mint' : '') + '" href="#/threads/c-' + c[0] + '" data-chan="' + c[0] + '">' + A.ico('hash') + c[0] + '</a>'; }).join('') + '</div>' + F + '</div>' +
      '<div class="list" style="border-top:1px solid var(--line)">' + (list || '<div class="card empty"><h2 class="h-sec">No threads on this filter</h2><p>Clear a filter to see the rest.</p></div>') + '</div><div class="list-foot"><span>' + rows.length + ' of ' + all.length + ' threads</span></div></section>' +
      threadPane(A, TT.open, { title: true }) + '</section>';
  };

  /* ---------------- Speak into a box (reply, thread) ---------------- */
  function speakBox(A, box, sample) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, put = function (t, heard) { box.value = (box.value ? box.value + ' ' : '') + t; box.focus(); A.toast((heard ? 'Heard it. ' : 'No microphone here, so a sample sentence was used. ') + 'Check it, then send.'); };
    if (!SR || navigator.webdriver) return put(sample, false);
    var r = new SR(), got = ''; r.lang = 'en-IN'; r.onresult = function (e) { got = e.results[0][0].transcript; };
    r.onend = function () { got ? put(got, true) : A.toast('Nothing heard. Press Speak and say it in one sentence.'); }; try { r.start(); } catch (e) { put(sample, false); }
  }

  /* ---------------- files: View / Download / Share ---------------- */
  function findFile(A, tk, id) {
    var p = tk.charAt(0) === 'P' && proj(A, tk), f = p && byId(p.files, id);
    if (!f) { var th = thread(A, tk); th.list.forEach(function (m) { (m.files || []).forEach(function (x) { if (x.id === id) f = x; }); }); }
    return f;
  }
  function blobOf(f) {
    if (f.data) { var b = atob(f.data.split(',')[1]), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Blob([u], { type: f.type || 'application/octet-stream' }); }
    return new Blob(['Glad U Came sample file: ' + f.n + '\nCreated by ZippyScale for the demo. Real files are stored and opened in the build.\n'], { type: 'text/plain' });
  }
  function readFiles(A, input, cb) {
    var fs = Array.prototype.slice.call(input.files || []), out = [], left = fs.length; input.value = '';
    if (!left) return;
    fs.forEach(function (f, i) {
      var x = { id: 'F' + Date.now().toString(36) + i + (++fseq), n: f.name, size: f.size, type: f.type, by: A.ME(), at: A.now() };
      out[i] = x;
      if (f.size > 400000) { if (!--left) cb(out); return; }   /* ponytail: big files keep their name only in the demo; the build stores them */
      var fr = new FileReader(); fr.onload = function () { x.data = fr.result; if (!--left) cb(out); }; fr.readAsDataURL(f);
    });
  }
  var fseq = 0;
  S._pj = { stageTo: function (A, p, st) { stageTo(A, p, st); }, closeTasks: closeTasks, mkTask: mkTask, phist: phist, headOf: headOf, proj: proj, readFiles: readFiles, blobOf: blobOf, histList: histList };   /* B4: money.js shares these */

  /* ---------------- actions ---------------- */
  var prevAct = S._act;
  S._act = function (act, a, A) {
    var D = A.D(), pid = a.getAttribute('data-p'), p = pid && proj(A, pid), tk = a.getAttribute('data-tk'), k = +a.getAttribute(a.hasAttribute('data-m') ? 'data-m' : 'data-k');
    if (act === 'startbrand') {
      var l = byId(D.leads, a.getAttribute('data-l'));
      if (l.stage !== 'Won') return prevAct(act, a, A);
      if (l.project && proj(A, l.project)) { location.hash = '#/project/' + l.project; return; }
      return startDialog(A, l);
    }
    if (act === 'newproj') return startDialog(A, null, brand(A, a.getAttribute('data-b')));
    if (act === 'btab') { BTAB = a.getAttribute('data-t'); A.render(); return; }
    if (act === 'ptab') { PTAB = a.getAttribute('data-t'); A.render(); return; }
    if (act === 'bfclear') { BF = { q: '', tpl: '', dept: '', poc: '', date: '', from_d: '', to_d: '' }; A.render(); return; }
    if (act === 'pnext') { var lad = LAD[p.template]; stageTo(A, p, lad[lad.indexOf(p.stage) + 1]); A.save(); A.render(); A.toast(p.name + ' is at ' + p.stage + '.'); return; }
    if (act === 'sladd') {
      Object.keys(SL.pick).forEach(function (h) { if (!SL.pick[h]) return; var x = D.infl.filter(function (i) { return i.h === h; })[0]; p.lines.push({ h: h, rate: x.rate, out: 'Not sent', due: A.addDays(p.live + 'T00:00', -2).slice(0, 10), content: false, live: '', payout: '' }); });
      var n = Object.keys(SL.pick).filter(function (h) { return SL.pick[h]; }).length; SL.pick = {};
      phist(A, p, 'Shortlisted ' + n + ' influencer' + (n === 1 ? '' : 's') + ': ' + p.lines.map(function (x) { return x.h; }).join(', ')); stageTo(A, p, 'Shortlist');
      A.save(); A.render(); A.toast(n + ' added to the shortlist. Send it to Approvals when it is ready.'); return;
    }
    if (act === 'slrm') { var gone = p.lines.splice(k, 1)[0]; phist(A, p, 'Removed ' + gone.h + ' from the shortlist'); A.save(); A.render(); return; }
    /* B4: the shortlist goes through the one Approvals queue (money.js decide), same rules as the Approvals screen */
    if (act === 'slsend') {
      var tot = p.lines.reduce(function (s, x) { return s + x.rate; }, 0), mx = p.lines.reduce(function (s, x) { return Math.max(s, x.rate); }, 0);
      p.slState = 'Waiting'; stageTo(A, p, 'Brand approval');
      var na = window.GUC_APPR.raise(A, { type: 'Influencer fee', what: 'Shortlist, ' + p.brand + ': ' + p.lines.length + ' influencers', amount: tot, max: mx, link: p.id, line: 'shortlist' });
      A.save(); A.render(); A.toast('Sent to Approvals. ' + A.first(na.approver) + ' has it on Today\'s tasks.'); return;
    }
    if (act === 'slapprove' || act === 'slback') {
      var ap = D.approvals.filter(function (x) { return x.link === p.id && x.line === 'shortlist' && x.status === 'Waiting'; })[0];
      if (!ap) { A.toast('Already decided. Nothing changed.'); return; }
      if (act === 'slback') return window.GUC_APPR.reasonDialog(A, ap, function (w) { window.GUC_APPR.decide(A, ap.id, false, w); });
      return window.GUC_APPR.decide(A, ap.id, true);
    }
    if (/^(lcontent|llive|lpay|lpayok)$/.test(act)) { if (lineAct(A, act, p, k) !== false) { A.save(); A.render(); } return; }
    if (act === 'thsum') { TH.sum = TH.sum === tk ? '' : tk; A.render(); return; }
    if (act === 'thpin') { var th = thread(A, tk), m = th.list[k]; m.pin = !m.pin; if (th.obj && th.obj.history) phist(A, th.obj, (m.pin ? 'Pinned' : 'Unpinned') + ' a decision: ' + m.text.slice(0, 80)); A.save(); A.render(); A.toast(m.pin ? 'Pinned at the top of the thread.' : 'Unpinned.'); return; }
    if (act === 'thtask') { var t2 = thread(A, tk), mm = t2.list[k]; window.GUC_fromMsg = { tk: tk, k: k }; A.openNewTask({ title: (mm.text || 'Follow up the file in ' + t2.title).replace(/@\w+\s*/g, '').slice(0, 90), link: t2.link, owner: A.ME() }); return; }
    if (act === 'thvoice') { var tv = thread(A, tk); tv.list.push({ who: A.ME(), text: '', voice: '0:' + (12 + tv.list.length % 40), at: A.now(), files: [] }); A.save(); A.render(); A.toast('Voice note added (sample).'); return; }
    if (act === 'thsend') {
      var box = d.querySelector('[data-th-box="' + tk + '"]'), tx = box.value.trim();
      if (!sendTo(A, tk, tx)) { box.focus(); box.setAttribute('aria-invalid', 'true'); return; }
      A.save(); A.render(); A.toast('Sent to the team thread.' + (/@\w/.test(tx) ? ' Whoever you mentioned has it on Today\'s tasks.' : '')); return;
    }
    if (act === 'speakbox') { var bx = d.getElementById(a.getAttribute('data-box')); return speakBox(A, bx, bx.id === 'ib-reply' ? 'Thank you, we will send the proposal by tomorrow evening.' : '@Tanvi please share the shortlist by 5 pm today.'); }
    if (act === 'fview' || act === 'fdown') {
      var f = findFile(A, tk, a.getAttribute('data-f')), url = URL.createObjectURL(blobOf(f));
      if (act === 'fview') window.open(url, '_blank', 'noopener');
      else { var dl = d.createElement('a'); dl.href = url; dl.download = f.data ? f.n : f.n + '.txt'; d.body.appendChild(dl); dl.click(); dl.remove(); }
      return;
    }
    if (act === 'fshare') { var fs = findFile(A, tk, a.getAttribute('data-f')); A.toast('Sample: in the build, Share copies a signed link to ' + fs.n + ' that opens without a login and stops working after 7 days.'); return; }
    /* G2: reply to the brand from the Inbox (sample send) */
    if (act === 'ibreply') {
      var cv = D.inbox.filter(function (x) { return x.id === a.getAttribute('data-c'); })[0], rb = d.getElementById('ib-reply'), rt = rb.value.trim();
      if (!rt) { rb.focus(); rb.setAttribute('aria-invalid', 'true'); return; }
      cv.msgs.push({ kind: 'us', who: A.ME(), text: rt, at: A.now(), sample: true }); cv.read = true; if (!cv.assigned) cv.assigned = A.ME();
      cv.history.push({ at: A.now(), who: A.ME(), what: 'Reply sent (sample)' });
      A.save(); A.render(); A.toast('Reply added as a sample. In the build it goes out from the ' + SENDER[cv.ch] + '.'); return;
    }
    if (prevAct) prevAct(act, a, A);
  };
  var SENDER = { whatsapp: 'shared WhatsApp number', instagram: 'Glad U Came Instagram account', gmail: 'agency Gmail', web: 'shared WhatsApp number', meta: 'shared WhatsApp number' };
  window.GUC_SENDER = SENDER;

  S._linkMsg = function (fm, t, A) {
    var th = thread(A, fm.tk), m = th.list[fm.k]; if (!m) return;
    m.task = t.id; t.from_msg = fm.tk; t.history.push({ at: A.now(), who: A.ME(), what: 'Made from a message in ' + th.where + ' (' + A.first(m.who) + ')' });
  };
  var prevParse = S._parse;
  S._parse = function (kind, text, dl, A) { return kind === 'start' ? parseStart(A, text, dl) : prevParse(kind, text, dl, A); };

  d.addEventListener('input', function (e) {
    var el = e.target, A = G(); if (!A) return;
    if (el.getAttribute('data-bf') === 'q') { BF.q = el.value; A.render(); refocus('[data-bf="q"]'); }
    if (el.getAttribute('data-tt') === 'q') { TT.q = el.value; A.render(); refocus('[data-tt="q"]'); }
  });
  function refocus(sel) { var x = d.querySelector(sel); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }
  d.addEventListener('change', function (e) {
    var el = e.target, A = G(); if (!A) return;
    if (el.hasAttribute('data-bf') && el.getAttribute('data-bf') !== 'q') { BF[el.getAttribute('data-bf')] = el.value; A.render(); }
    if (el.hasAttribute('data-tt') && el.getAttribute('data-tt') !== 'q') { TT[el.getAttribute('data-tt')] = el.value; A.render(); }
    if (el.hasAttribute('data-sl')) { SL[el.getAttribute('data-sl')] = el.value; A.render(); }
    if (el.hasAttribute('data-slpick')) { SL.pick[el.getAttribute('data-slpick')] = el.checked; A.render(); }
    if (el.closest && el.closest('#dlg-start') && el.name === 'tpl') { preview(A, el.closest('dialog')); var nm = el.closest('dialog').querySelector('[name=pname]'); nm.value = el.value + ', ' + nm.value.split(', ').slice(1).join(', '); }
    if (el.hasAttribute('data-out')) {
      var p = proj(A, el.getAttribute('data-p')), x = p.lines[+el.getAttribute('data-out')], was = x.out; x.out = el.value;
      phist(A, p, 'Outreach ' + x.h + ': ' + was + ' to ' + x.out);
      if (x.out === 'Confirmed') {
        stageTo(A, p, 'Confirmed'); closeTasks(A, p.id, /^Outreach to \d+ approved/, x.h + ' confirmed');
        mkTask(A, { title: 'Collect content from ' + x.h + ' for ' + p.brand, owner: p.owner_line, due: x.due + 'T18:00', link: p.id, agent: true, why: 'Campaign agent: ' + x.h + ' confirmed, content due ' + A.dayWord(x.due + 'T00:00') });
        A.toast(x.h + ' is Confirmed. Content due ' + A.low(A.dayWord(x.due + 'T00:00')) + ', on ' + A.first(p.owner_line) + '\'s Today\'s tasks.');
      } else A.toast('Outreach for ' + x.h + ': ' + x.out + '.');
      A.save(); A.render();
    }
    if (el.hasAttribute('data-cdue')) {
      var pp = proj(A, el.getAttribute('data-p')), y = pp.lines[+el.getAttribute('data-cdue')]; if (!el.value) return;
      y.due = el.value; phist(A, pp, 'Content due for ' + y.h + ' set to ' + A.dayWord(y.due + 'T00:00'));
      A.D().tasks.forEach(function (t) { if (t.link === pp.id && A.OPEN[t.status] && t.title.indexOf('Collect content from ' + y.h) === 0) t.due = y.due + 'T18:00'; });
      stageTo(A, pp, 'Content due'); A.save(); A.render(); A.toast('Content due ' + A.low(A.dayWord(y.due + 'T00:00')) + ' for ' + y.h + '.');
    }
    if (el.hasAttribute('data-thfile')) { var tk = el.getAttribute('data-thfile'); readFiles(A, el, function (fs) { TH.att[tk] = (TH.att[tk] || []).concat(fs); A.render(); A.toast(fs.length + ' file' + (fs.length === 1 ? '' : 's') + ' ready. Press Send to share in the thread.'); }); }
    if (el.hasAttribute('data-pfile')) { var p2 = proj(A, el.getAttribute('data-pfile')); readFiles(A, el, function (fs) { fs.forEach(function (f) { p2.files.push(f); }); phist(A, p2, 'Added ' + fs.length + ' file' + (fs.length === 1 ? '' : 's') + ': ' + fs.map(function (f) { return f.n; }).join(', ')); A.save(); A.render(); A.toast(fs.length + ' file' + (fs.length === 1 ? '' : 's') + ' added.'); }); }
  });
  d.addEventListener('submit', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-form'), A = G();
    if (f === 'start') { e.preventDefault(); e.stopImmediatePropagation(); if (saveStart(A, e.target)) e.target.closest('dialog').close(); }
    if (f === 'contact') {
      e.preventDefault(); e.stopImmediatePropagation();
      var b = brand(A, e.target.getAttribute('data-b')), v = function (n) { return e.target.querySelector('[name=' + n + ']').value.trim(); };
      if (!v('name')) { e.target.querySelector('[name=name]').focus(); return; }
      b.contacts.push({ name: v('name'), role: v('role') || 'Brand contact', mobile: v('mobile'), email: '' }); phist(A, b, 'Contact added: ' + v('name'));
      A.save(); A.render(); A.toast('Contact added to ' + b.name + '.');
    }
  }, true);
})();
