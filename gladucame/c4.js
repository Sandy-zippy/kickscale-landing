/* Glad U Came demo . C4: sample data a working agency would have (retainers, realistic team costs, a task history with most
   work on time), and Ask GUC on the agency's own figures: the number, a short table, Open this list and How I counted, inside
   the asker's own view, with follow-ups, Why, actions a person confirms, pins on the dashboard and scheduled questions.
   Every answer is worked out from the demo store by fixed rules, never by a guess. Loads after c3.js, before logins.js. */
(function () {
  'use strict';
  var S = window.GUC_SCREENS, d = document, C3 = function () { return window.GUC_C3; };
  var rupees = function (n) { var s = String(Math.round(Math.abs(n))), last = s.slice(-3), rest = s.slice(0, -3); return (n < 0 ? '-' : '') + '₹' + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last; };
  var byId = function (l, id) { return (l || []).filter(function (x) { return x.id === id; })[0]; };
  var sum = function (l, f) { return l.reduce(function (a, x) { return a + (f ? f(x) : x); }, 0); };
  var role = function (A) { return A.me().role; };
  var pl = function (n, w, ws) { return n + ' ' + (n === 1 ? w : (ws || w + 's')); };

  /* ---------------- H1 + H2: the sample a working agency would have (runs once, on D.c4) ---------------- */
  var NEW_P = [   /* id, brand, name, template, dept, team, live in days, fee in lakh (a month for retainers), stage, start in days */
    ['P7', 'Juhu Beach Resort', 'Social media, monthly', 'Social media management', 'Content', ['neha'], 6, 1.8, 'Content plan', -30],
    ['P8', 'Worli Art House', 'PR retainer, art season', 'PR retainer', 'PR', ['ananya', 'meera', 'dev'], 10, 2.4, 'Pitching', -36],
    ['P9', 'Hill Road Denim', 'Winter denim influencer campaign', 'Influencer campaign', 'Influencer', ['kabir', 'tanvi', 'rohan'], 12, 4.0, 'Shortlist', -2],
    ['P10', 'Ghatkopar Gym Co.', 'Social media, monthly', 'Social media management', 'Content', ['neha'], 8, 1.2, 'Content plan', -33],
    ['P11', 'Andheri Eats Festival', 'Food festival weekend', 'Event', 'Events', ['arjun', 'siddharth'], 18, 3.2, 'Plan', -2]
  ];
  var TEAM = { BD: 100000, Influencer: 150000, PR: 120000, 'Celebrity & gifting': 65000, Events: 80000, Content: 65000, Finance: 50000 };
  var TITLES = {
    "Founder's office": ['Review the pipeline with Riya', 'Sign off the monthly coverage report', 'Approve the influencer shortlist', 'Renewal call with a retainer client', 'Review payments due with Farhan', 'Agenda for the team meeting'],
    BD: ['Send the credentials deck', 'Discovery call notes on the lead', 'Follow up a proposal', 'Update the pipeline before Monday', 'Proposal draft for the Pricing approval', 'Log the call outcome'],
    Influencer: ['Shortlist influencers for the brief', 'Check the live links', 'Send the brief to confirmed influencers', 'Collect content drafts', 'Update the rate card sheet', 'Share the campaign report'],
    PR: ['Pitch the story to the food desk', 'Clip coverage for the report', 'Update the media list', 'Draft the press note', 'Follow up journalists on the pitch', 'Send the coverage tracker'],
    'Celebrity & gifting': ['Confirm the hamper list', 'Book the courier', 'Chase proof of post', 'Update the celebrity sheet', 'Share the gifting report', 'Pack the hampers with the vendor'],
    Events: ['Get vendor quotes', 'Site visit at the venue', 'Update the run of show', 'Confirm the guest list', 'Book the sound vendor', 'Share the event report'],
    Content: ['First drafts of the reels', 'Captions for the week\'s posts', 'Edit the reel', 'Post the scheduled content', 'Share the content calendar', 'Fix the brand\'s review notes'],
    Finance: ['Record payments received', 'Send payment reminders', 'Update direct costs', 'Check the vendor bills', 'Reconcile the bank statement', 'Share the payments due list']
  };
  var OFF = [-33, -30, -27, -24, -21, -18, -15, -12, -9, -6, -3, -2];
  /* which of the 12 past tasks each person finished late (Ishaan and Siddharth are the two clearly behind) */
  var LATE = { maddie: [4], riya: [2, 9], kabir: [5], ananya: [1, 7], zoya: [3], arjun: [2, 8], neha: [6], farhan: [9], ishaan: [1, 3, 5, 8, 10],
    tanvi: [4, 10], rohan: [7], meera: [2], siddharth: [0, 2, 4, 6, 9, 11], aisha: [5], dev: [3, 8] };
  var YDAY = ['tanvi', 'neha'];   /* a handful done yesterday */
  var BEHIND = { ishaan: 1, siddharth: 1 };

  function seed(D, A) {
    var day = function (n) { return A.addDays(A.TODAY + 'T00:00', n).slice(0, 10); }, at = function (n, hm) { return A.addDays(A.TODAY + 'T' + hm, n); };
    D.c4 = { day: A.TODAY };
    D.settings.c3.team = Object.assign({}, TEAM);
    (D.settings.history = D.settings.history || []).push({ at: A.now(), who: 'agent', what: 'Sample team cost per department set to ' + rupees(sum(Object.keys(TEAM), function (k) { return TEAM[k]; })) + ' a month in all' });
    var p2 = byId(D.projects, 'P2'); if (p2) { p2.fee = 1.5; p2.name = 'PR retainer, monthly'; p2.end = ''; }   /* a retainer's fee is its monthly fee (matches the 1.5L a month paid) */
    NEW_P.forEach(function (x) {
      if (byId(D.projects, x[0])) return;
      var l = D.leads.filter(function (y) { return y.brand === x[1]; })[0], b = D.brands.filter(function (y) { return y.name === x[1]; })[0];
      if (!b) { b = { id: 'B' + (++D.seqB), name: x[1], lead: l ? l.id : '', created: at(x[9] - 2, '10:00'), contacts: l ? [{ name: l.contact, role: 'Marketing head', mobile: l.mobile || '', email: l.email || '' }] : [], history: [], contact: day(-2) };
        b.history.push({ at: b.created, who: 'agent', what: 'Brand record made from the Won lead ' + x[1] }); D.brands.push(b); }
      D.projects.push({ id: x[0], brand: x[1], name: x[2], template: x[3], dept: x[4], team: x[5], live: day(x[6]), fee: x[7], stage: x[8], bid: b.id, poc: x[5][0], start: day(x[9]), end: '',
        files: [], thread: [], lines: [], owner_line: x[5].filter(function (id) { return A.P[id].role === 'Team member'; })[0] || x[5][0],
        history: [{ at: at(x[9], '10:00'), who: x[5][0], what: 'Project made from the ' + x[3] + ' template' }] });
    });
    var pay = function (pid, what, amt, due, recv) {
      var y = { id: 'PY' + (++D.seqPY), project: pid, what: what, amount: amt, due: day(due), recv: (recv || []).map(function (r) { return { on: day(r[0]), amount: r[1], ref: r[2], by: 'farhan' }; }),
        history: [{ at: day(Math.min(due, 0) - 5) + 'T11:00', who: 'farhan', what: 'Payment due set: ' + what + ', ' + rupees(amt) + ', due ' + A.dayWord(day(due) + 'T00:00') }] };
      y.recv.forEach(function (r) { y.history.push({ at: r.on + 'T15:30', who: 'farhan', what: rupees(r.amount) + ' received, ref ' + r.ref }); }); D.pay.push(y);
    };
    pay('P7', 'October retainer', 180000, -30, [[-28, 180000, 'UTR HDFC0090211']]); pay('P7', 'November retainer', 180000, -3, [[-2, 180000, 'UTR HDFC0093388']]);
    pay('P8', 'October retainer', 240000, -32, [[-29, 240000, 'UTR YESB0012209']]); pay('P8', 'November retainer', 240000, 2);
    pay('P9', 'Advance, 50%', 200000, 3);
    pay('P10', 'October retainer', 120000, -31, [[-30, 120000, 'UPI 5521 0034']]); pay('P10', 'November retainer', 120000, -4);
    pay('P11', 'Advance, 50%', 160000, -1, [[-1, 160000, 'UTR ICIC0049901']]); pay('P11', 'Balance, after the festival', 160000, 20);
    [['P9', 'Influencer fee', '@glowwithtara', 'Fee for @glowwithtara, denim reel', 60000, -1], ['P9', 'Influencer fee', '@mumbaimasala.diaries', 'Fee for @mumbaimasala.diaries, styling reel', 55000, -1],
      ['P11', 'Vendor', 'Juhu Tents & Stalls', 'Stalls and tents, festival', 90000, -1], ['P8', 'Vendor', 'Kala Ghoda Caterers', 'Press preview catering', 22000, -15], ['P7', 'Vendor', 'Lens & Light Studio', 'Resort photo shoot', 25000, -8]].forEach(function (c) {
      var x = C3().addCost(A, { project: c[0], kind: c[1], who: c[2], what: c[3], amount: c[4], quiet: true }); x.on = day(c[5]); x.history[0].at = x.on + 'T12:00'; x.history[0].who = 'farhan';
    });
    /* H2: a working agency. Past work is mostly done on time; Ishaan and Siddharth are behind. */
    var now = A.now(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    D.tasks.forEach(function (t) {
      if (/^Decide: /.test(t.title) && t.due < now) { t.due = at(1, '12:00'); return; }
      if (!A.OPEN[t.status] || t.due >= now || BEHIND[t.owner] || t.link === 'P3' || t.kind === 'bd' || /64 days unpaid|proof of post/i.test(t.title)) return;
      t.status = 'done'; t.blocked = ''; t.done_at = A.addDays(t.due, 0).slice(0, 11) + pad(Math.max(9, +t.due.slice(11, 13) - 1)) + ':' + t.due.slice(14, 16); if (t.done_at > t.due) t.done_at = t.due; if (t.done_at > now) t.done_at = now;
      t.history.push({ at: t.done_at, who: t.owner, what: 'Marked Done' });
    });
    /* the two who are behind keep their 4 oldest late tasks open; one proof-of-post nudge stays open */
    var keep = {}, pp = 0;
    D.tasks.filter(function (t) { return A.OPEN[t.status] && t.due < now; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }).forEach(function (t) {
      var k = BEHIND[t.owner] ? t.owner : /proof of post/i.test(t.title) ? 'pp' : ''; if (!k) return;
      keep[k] = (keep[k] || 0) + 1; if (keep[k] <= (k === 'pp' ? 1 : 4)) return;
      t.status = 'done'; t.blocked = ''; t.done_at = t.due > now ? now : A.addDays(t.due, 1); if (t.done_at > now) t.done_at = now; t.history.push({ at: t.done_at, who: t.owner, what: 'Marked Done, after the deadline' });
    });
    var deptOf = function (id) { return A.P[id].role === 'Founder' ? "Founder's office" : A.P[id].dept; };
    A.ORDER.forEach(function (id, pi) {
      var T = TITLES[deptOf(id)] || TITLES.BD, proj = D.projects.filter(function (p) { return p.team.indexOf(id) >= 0; }), late = LATE[id] || [];
      OFF.concat(YDAY.indexOf(id) >= 0 ? [-1] : []).forEach(function (o, k) {
        var due = at(o, ['11:00', '13:00', '16:00', '18:00'][(k + pi) % 4]), isLate = late.indexOf(k) >= 0, p = proj.length ? proj[(k + pi) % proj.length] : null;
        var done = isLate ? A.addDays(due, 1 + (k % 2)) : A.addDays(due, 0).slice(0, 11) + pad(+due.slice(11, 13) - 1) + ':30';
        var chk = A.P[id].head || 'maddie';
        D.tasks.push({ id: 'T-' + (++D.seq), title: T[(k + pi) % T.length] + (p ? ', ' + p.brand : ''), owner: id, checked_by: chk, due: due, priority: 'Normal', link: p ? p.id : '', status: 'done', blocked: '', team: '', pick: '', checklist: [],
          assigned_by: chk, kind: '', done_at: done, history: [{ at: A.addDays(due, -3), who: chk, what: 'Assigned to ' + A.P[id].name + ', Checked by ' + A.P[chk].name }, { at: done, who: id, what: 'Marked Done' + (isLate ? ', after the deadline' : '') }] });
      });
    });
  }

  var prevMig = S._migrate;
  S._migrate = function (D, A) {
    var ch = prevMig ? prevMig(D, A) : false;
    if (!D.c4 && D.c3) { seed(D, A); ch = true; }
    if (D.c4) {
      var shift = A.daysBetween(D.c4.day, A.TODAY);   /* a demo opened another day reads the same (done times move with the deadlines) */
      if (shift) { D.tasks.forEach(function (t) { if (t.done_at) t.done_at = A.addDays(t.done_at, shift); }); D.c4.day = A.TODAY; ch = true; }
      D.pins = D.pins || []; D.sched = D.sched || []; D.seqQ = D.seqQ || 0;
      if (runDue(D, A)) ch = true;
    }
    return ch;
  };

  /* ---------------- Ask GUC: periods ---------------- */
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var lastDay = function (y, m) { return new Date(y, m, 0).getDate(); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function per(A, k) {
    var t = A.TODAY, y = +t.slice(0, 4), m = +t.slice(5, 7), q = Math.floor((m - 1) / 3) * 3 + 1, ym = function (Y, M) { return Y + '-' + pad2(M); };
    if (k === 'lastmonth') { var ly = m === 1 ? y - 1 : y, lm = m === 1 ? 12 : m - 1; return { k: k, from: ym(ly, lm) + '-01', to: ym(ly, lm) + '-' + lastDay(ly, lm), word: 'last month (' + MON[lm - 1] + ')' }; }
    if (k === 'quarter') return { k: k, from: ym(y, q) + '-01', to: t, word: 'this quarter' };
    if (k === 'lastquarter') { var qy = q === 1 ? y - 1 : y, qm = q === 1 ? 10 : q - 3; return { k: k, from: ym(qy, qm) + '-01', to: ym(qy, qm + 2) + '-' + lastDay(qy, qm + 2), word: 'last quarter (' + MON[qm - 1] + ' to ' + MON[qm + 1] + ')' }; }
    if (k === 'week') return { k: k, from: A.addDays(t + 'T00:00', -6).slice(0, 10), to: t, word: 'the last 7 days' };
    if (k === 'all') return { k: k, from: '2000-01-01', to: '2999-12-31', word: 'so far' };
    return { k: 'month', from: t.slice(0, 8) + '01', to: t, word: 'this month' };
  }
  var inP = function (P, dy) { return !!dy && dy.slice(0, 10) >= P.from && dy.slice(0, 10) <= P.to; };

  /* ---------------- Ask GUC: the words (English and simple Hinglish, cleaned before matching) ---------------- */
  var HING = [[/\bis (mahine|mahina|month)\b/g, 'this month'], [/\b(pichhle|pichle|pichla|pichhla)\b/g, 'last'], [/\b(mahine|mahina)\b/g, 'month'], [/\bis (quarter|timahi)\b/g, 'this quarter'],
    [/\bsabse (zyada|jyada|adhik)\b/g, 'most'], [/\bkisne (laya|layi|laye|laaya)\b/g, 'who brought'], [/\b(kaun|kisne)\b/g, 'who'], [/\b(baki|baaki|ruka hua)\b/g, 'pending'],
    [/\b(paisa|paise|bhugtan)\b/g, 'payment'], [/\bkaam\b/g, 'tasks'], [/\baaj\b/g, 'today'], [/\bkal\b/g, 'tomorrow'], [/\b(mera|meri|mere)\b/g, 'my'], [/\b(pura nahi|poora nahi|nahi kiya|nahin kiya|complete nahi)\b/g, 'not completed'], [/\b(der se|late chal\w*)\b/g, 'delayed'],
    [/\b(kitna|kitni|kitne)\b/g, 'how much'], [/\b(kamai|aamdani)\b/g, 'revenue'], [/\b(kyun|kyon|kyu)\b/g, 'why'], [/\bclients? ko\b/g, 'clients'], [/\b(wale|wali|ka|ki|ke|se|me|mein|hai|hain|tha)\b/g, ' ']];
  function clean(q) {
    var s = ' ' + String(q).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9@&. ]/g, ' ') + ' ';
    s = s.replace(/\b(um+|uh+|please|pls|can you|could you|tell me|batao|bataiye|bata do|ok|okay|hey guc|guc)\b/g, ' ');
    HING.forEach(function (h) { s = s.replace(h[0], h[1]); });
    return s.replace(/\s+/g, ' ').trim();
  }
  function perWord(s) {
    if (/\blast quarter|previous quarter\b/.test(s)) return 'lastquarter';
    if (/\bthis quarter|quarter\b/.test(s)) return 'quarter';
    if (/\blast month|previous month\b/.test(s)) return 'lastmonth';
    if (/\bthis month|month\b/.test(s)) return 'month';
    if (/\bthis week|last 7 days|week\b/.test(s)) return 'week';
    if (/\bso far|all time|ever\b/.test(s)) return 'all';
    return '';
  }
  var DEPTW = [['PR', /\bpr\b|press/], ['Influencer', /\binfluencer/], ['Events', /\bevents?\b/], ['Content', /\bcontent|social media/], ['Celebrity & gifting', /\bcelebrity|gifting|hamper/], ['BD', /\bbd\b|business development/], ['Finance', /\bfinance\b/]];
  var deptWord = function (s) { var m = DEPTW.filter(function (x) { return x[1].test(s); })[0]; return m ? m[0] : ''; };
  function personWord(A, s) { return A.ORDER.filter(function (id) { var n = A.P[id].name.toLowerCase(); return new RegExp('\\b(' + n.split(' ')[0] + '|' + n + ')\\b').test(s); })[0] || ''; }

  /* ---------------- scope: what this person may see ---------------- */
  var isHead = function (A) { return role(A) === 'Department head'; };
  function peopleIn(A) { var r = role(A), me = A.ME(); return r === 'Founder' ? A.ORDER.slice() : r === 'Department head' ? [me].concat(A.teamOf(me)) : [me]; }
  function leadsIn(A) {
    var r = role(A), me = A.ME(), ids = peopleIn(A);
    if (r === 'Founder' || (isHead(A) && A.me().dept === 'BD')) return A.D().leads;   /* the BD head sees every lead (C2) */
    return A.D().leads.filter(function (l) { return ids.indexOf(l.owner) >= 0 || ids.indexOf(l.by) >= 0; });
  }
  function projectsIn(A) { var r = role(A), me = A.ME(); return A.D().projects.filter(function (p) { return r === 'Founder' || r === 'Finance' || (isHead(A) && p.dept === A.me().dept) || p.team.indexOf(me) >= 0; }); }
  var moneyOk = function (A) { return /^(Founder|Finance|Department head)$/.test(role(A)); };
  var scopeWord = function (A) { var r = role(A); return r === 'Founder' ? 'the whole agency' : r === 'Department head' ? 'your department' : r === 'Finance' ? 'every project' : 'your own work'; };
  function refuseMoney(A) {
    if (role(A) === 'Intern') return { refused: true, a: 'Money and rates stay with the team members, department heads and Maddie. Ask ' + A.P[A.P[A.ME()].head || 'maddie'].name + ' for this one.' };
    return { refused: true, a: 'Money figures are for Maddie, Farhan and the department heads. Ask ' + A.P[A.P[A.ME()].head || 'maddie'].name + ' if you need this one.' };
  }

  /* ---------------- the answers ---------------- */
  var row = function (cells, href) { return { c: cells, href: href || '' }; };
  var who = function (A, id) { return A.P[id] ? A.P[id].name : id; };
  function revBy(A, P) { return C3().revRows(A, P); }
  var I = {};
  I.bdtop = { t: 'Which BD executive brought in the most business', money: true, f: function (A, x) {
    var P = per(A, x.per || 'month'), R = revBy(A, P), bd = A.ORDER.filter(function (id) { return A.P[id].dept === 'BD'; });
    if (!/^(Founder|Department head)$/.test(role(A)) || (isHead(A) && A.me().dept !== 'BD')) {
      if (A.P[A.ME()].dept !== 'BD') return { a: 'The BD figures are for Maddie and Riya. Your own numbers are on My dashboard.', refused: true };
      bd = [A.ME()];
    }
    var tab = bd.map(function (id) { var mine = R.filter(function (r) { return r.who === id; }); return { id: id, n: mine.length, amt: sum(mine, function (r) { return r.amt; }), L: mine }; }).sort(function (a, b) { return b.amt - a.amt; });
    var top = tab[0], own = bd.length === 1;
    return { num: top.amt, a: own ? 'You brought in ' + rupees(top.amt) + ' of business ' + P.word + ', from ' + pl(top.n, 'project') + '. Only your own figures show for you.'
      : top.amt ? who(A, top.id) + ' brought in the most business ' + P.word + ': ' + rupees(top.amt) + ' from ' + pl(top.n, 'project') + '.' : 'No BD executive brought in business ' + P.word + '.',
      head: ['BD executive', 'Projects', 'Business'], rows: tab.map(function (t) { return row([who(A, t.id), t.n, rupees(t.amt)], role(A) === 'Founder' ? '#/dash/f/rev/p-' + t.id : '#/leads/score'); }),
      href: role(A) === 'Founder' ? '#/dash/f/rev/p-' + top.id : '#/leads/score', per: P.k,
      how: 'Business = fees of projects for brands the person brought in (the lead\'s Brought in by, or its owner when nobody is named), as on the BD scorecard. A one-off project counts in the period it started; a retainer counts its monthly fee for every month it runs ' + P.word + '.' }; } };
  I.pay = { t: 'Which clients have pending payments', money: true, f: function (A, x) {
    var pids = projectsIn(A).map(function (p) { return p.id; }), Y = A.D().pay.filter(function (y) { return pids.indexOf(y.project) >= 0 && C3().leftOf(y) > 0 && y.due <= A.TODAY && (!x.dept || byId(A.D().projects, y.project).dept === x.dept); });
    var late = Y.filter(function (y) { return C3().lateBy(A, y); }), brands = {}; Y.forEach(function (y) { brands[byId(A.D().projects, y.project).brand] = 1; });
    var nb = Object.keys(brands).length, tot = sum(Y, C3().leftOf);
    return { num: nb, a: nb ? pl(nb, 'client') + ' have money still to collect' + (x.dept ? ' in ' + x.dept : '') + ': ' + rupees(tot) + ' in all, ' + rupees(sum(late, C3().leftOf)) + ' of it overdue.' : 'No client owes us anything right now' + (x.dept ? ' in ' + x.dept : '') + '.',
      head: ['Client', 'For', 'Still to collect', 'Status'], rows: Y.sort(function (a, b) { return a.due < b.due ? -1 : 1; }).map(function (y) { var p = byId(A.D().projects, y.project); return row([p.brand, y.what, rupees(C3().leftOf(y)), C3().payWord(A, y)[0]], '#/project/' + p.id); }),
      href: '#/money/due', how: 'Every payment due by today on a project in ' + scopeWord(A) + ' with money left after what Farhan recorded as received. Overdue = past its due date with money left. Payments not yet due are on the Payments list.' }; } };
  function lateTasks(A, p) { var ids = peopleIn(A); return A.D().tasks.filter(function (t) { return t.link === p.id && A.isOverdue(t) && (role(A) === 'Founder' || isHead(A) || ids.indexOf(t.owner) >= 0); }); }
  function delayedProjects(A, x) { return projectsIn(A).filter(function (p) { return p.stage !== 'Closed' && (!x.dept || p.dept === x.dept) && (lateTasks(A, p).length || (p.live && p.live < A.TODAY && !/Report|Closed|Delivered|Live|Published/.test(p.stage))); }); }
  I.late = { t: 'Which projects are delayed', f: function (A, x) {
    var L = delayedProjects(A, x);
    return { num: L.length, a: L.length ? pl(L.length, 'project is', 'projects are') + ' delayed' + (x.dept ? ' in ' + x.dept : '') + ': ' + L.map(function (p) { return p.brand; }).join(', ') + '. Ask "why is ' + L[0].brand + ' late?" for the tasks behind it.' : 'No project is delayed' + (x.dept ? ' in ' + x.dept : '') + '. Every task on them is on time.',
      head: ['Project', 'Late tasks', 'Oldest late', 'Live date'], rows: L.map(function (p) { var lt = lateTasks(A, p).sort(function (a, b) { return a.due < b.due ? -1 : 1; }); return row([p.brand + ', ' + p.name, lt.length, lt.length ? A.low(A.dayWord(lt[0].due)) : 'past the live date', A.dayWord(p.live + 'T00:00')], '#/project/' + p.id); }),
      href: L.length ? '#/project/' + L[0].id : '#/brands', ctxP: L.length ? L[0].id : '', how: 'A project is delayed when one of its open tasks is past its deadline, or its live date has passed before it was live. Projects in ' + scopeWord(A) + '.' }; } };
  I.why = { t: 'Why is a project late', f: function (A, x) {
    var p = x.pid ? byId(A.D().projects, x.pid) : null; if (!p) return null;
    if (projectsIn(A).indexOf(p) < 0) return { refused: true, a: p.brand + ' is not one of your projects, so I cannot show its tasks.' };
    var lt = lateTasks(A, p).sort(function (a, b) { return a.due < b.due ? -1 : 1; }), past = p.live && p.live < A.TODAY && !/Report|Closed|Delivered|Live|Published/.test(p.stage);
    return { num: lt.length, a: lt.length ? p.brand + ' is late because ' + pl(lt.length, 'task is', 'tasks are') + ' past the deadline: ' + lt.map(function (t) { return t.title + ' (' + A.first(t.owner) + ')'; }).join('; ') + '.' : past ? p.brand + ' is past its live date of ' + A.dayWord(p.live + 'T00:00') + ' and is still at ' + p.stage + '.' : p.brand + ' is not late: no task on it is past its deadline.',
      head: ['Late task', 'Owner', 'Deadline'], rows: lt.map(function (t) { return row([t.title, who(A, t.owner), A.dayWord(t.due) + ', ' + A.clock(t.due)], '#/project/' + p.id); }), href: '#/project/' + p.id, ctxP: p.id, act: lt.length ? { k: 'remind', to: lt[0].owner, what: lt[0].title } : null,
      how: 'The open tasks on ' + p.brand + ', ' + p.name + ' whose deadline has passed, oldest first, with who owns each.' }; } };
  I.notdone = { t: 'Who has not completed assigned tasks', f: function (A, x) {
    var ids = peopleIn(A).filter(function (id) { return !x.dept || (A.P[id].role === 'Founder' ? "Founder's office" : A.P[id].dept) === x.dept; }), T = A.D().tasks.filter(function (t) { return ids.indexOf(t.owner) >= 0 && A.isOverdue(t); });
    var by = {}; T.forEach(function (t) { (by[t.owner] = by[t.owner] || []).push(t); });
    var P = Object.keys(by).sort(function (a, b) { return by[b].length - by[a].length; });
    return { num: T.length, a: T.length ? pl(P.length, 'person has', 'people have') + ' tasks past the deadline, ' + pl(T.length, 'task') + ' in all. ' + who(A, P[0]) + ' has the most (' + by[P[0]].length + ').' : 'Everyone in ' + scopeWord(A) + ' is up to date: no task is past its deadline.',
      head: ['Person', 'Past the deadline', 'Oldest'], rows: P.map(function (id) { var o = by[id].sort(function (a, b) { return a.due < b.due ? -1 : 1; })[0]; return row([who(A, id), by[id].length, A.low(A.dayWord(o.due))], role(A) === 'Founder' ? '#/dash/f/over/p-' + id : '#/dash/t/over/' + id); }),
      href: role(A) === 'Founder' ? '#/dash/f/over' : '#/dash/t/over', act: P.length ? { k: 'remind', to: P[0], what: 'the ' + pl(by[P[0]].length, 'task') + ' past the deadline' } : null,
      how: 'Open tasks (To do or Blocked) whose deadline has passed, as of now, for ' + scopeWord(A) + ', grouped by owner.' }; } };
  I.infl = { t: 'Revenue from influencer marketing', money: true, f: function (A, x) {
    var P = per(A, x.per || 'quarter'), pids = projectsIn(A).map(function (p) { return p.id; }), R = revBy(A, P).filter(function (r) { return r.svc === 'Influencer campaign' && pids.indexOf(r.p.id) >= 0; }), tot = sum(R, function (r) { return r.amt; });
    return { num: tot, a: 'Influencer marketing brought in ' + rupees(tot) + ' ' + P.word + ', from ' + pl(R.length, 'campaign') + '.', per: P.k,
      head: ['Campaign', 'Started', 'Fee'], rows: R.map(function (r) { return row([r.p.brand + ', ' + r.p.name, A.dayWord(r.p.start + 'T00:00'), rupees(r.amt)], '#/project/' + r.p.id); }),
      href: role(A) === 'Founder' ? '#/dash/f/rev/s-0' : '#/money/profit', how: 'Fees of Influencer campaign projects that started ' + P.word + ' (' + P.from + ' to ' + P.to + '), the same rule as Revenue generated on the dashboard.' }; } };
  I.leads = { t: 'Leads by source', f: function (A, x) {
    var P = per(A, x.per || 'month'), L = leadsIn(A).filter(function (l) { return inP(P, l.created); }), by = {};
    L.forEach(function (l) { var c = (A.CHN && A.CHN[l.ch]) || l.ch; by[c] = (by[c] || 0) + 1; });
    var K = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; });
    return { num: L.length, a: pl(L.length, 'lead') + ' came in ' + P.word + (role(A) === 'Founder' ? '' : ' in ' + scopeWord(A)) + (K.length ? ', most from ' + K[0] + ' (' + by[K[0]] + ').' : '.'), per: P.k,
      head: ['Source', 'Leads'], rows: K.map(function (k) { return row([k, by[k]]); }), href: role(A) === 'Founder' ? '#/dash/f/leads' : '#/leads', how: 'Leads created ' + P.word + ' (' + P.from + ' to ' + P.to + '), by the channel they came from. Same count as Total leads on the founder dashboard.' }; } };
  I.props = { t: 'Proposals sent', f: function (A, x) {
    var P = per(A, x.per || 'month'), mine = leadsIn(A), L = C3().propsIn(A, P).filter(function (l) { return mine.indexOf(l) >= 0; });
    return { num: L.length, a: pl(L.length, 'proposal') + ' sent ' + P.word + '.', per: P.k, head: ['Brand', 'Owner', 'Now at'], rows: L.map(function (l) { return row([l.brand, who(A, l.owner), l.stage], '#/lead/' + l.id); }),
      href: role(A) === 'Founder' ? '#/dash/f/props' : '#/leads', how: 'Leads whose History shows a move to Proposal sent ' + P.word + '.' }; } };
  I.risk = { t: 'Clients at risk', f: function (A, x) {
    var mine = projectsIn(A), L = C3().atRisk(A).filter(function (b) { return mine.some(function (p) { return p.brand === b.name; }); });
    return { num: L.length, a: L.length ? pl(L.length, 'client is', 'clients are') + ' at risk: ' + L.map(function (b) { return b.name; }).join(', ') + '.' : 'No client is at risk.',
      head: ['Client', 'Why'], rows: L.map(function (b) { return row([b.name, C3().reasons(A, b).map(function (r) { return r.t; }).join('; ')], '#/health'); }), href: '#/health',
      how: 'A live client is at risk with a deliverable 2 days late, a client approval stuck, a payment overdue, no contact in the set days, or a retainer ending soon. Each reason shows.' }; } };
  I.profit = { t: 'Profit by department', money: true, f: function (A, x) {
    var P = per(A, x.per || 'month'), D0 = isHead(A) ? [A.me().dept] : C3().DEPTS, R = D0.filter(function (k) { return !x.dept || k === x.dept; }).map(function (k) { return C3().deptProfit(A, P, k); }), tot = sum(R, function (r) { return r.pf; });
    var red = R.filter(function (r) { return r.pf < 0 && !/^(BD|Finance)$/.test(r.dept); });
    return { num: tot, a: (R.length > 1 ? 'Profit ' + P.word + ' is ' + rupees(tot) + ' in all.' : R[0].dept + ' profit ' + P.word + ' is ' + rupees(tot) + '.') + (red.length ? ' In the red: ' + red.map(function (r) { return r.dept + ' (' + rupees(r.pf) + ')'; }).join(', ') + '.' : ''), per: P.k,
      head: ['Department', 'Revenue', 'Direct costs', 'Team cost', 'Profit'], rows: R.map(function (r) { return row([r.dept, rupees(r.rev), rupees(r.dc), rupees(r.tc), rupees(r.pf)], '#/money/profit'); }), href: '#/money/profit',
      how: 'Revenue (projects started ' + P.word + ', retainers for each month they run) less their direct costs less the department\'s team cost from Settings. BD and Finance earn no client fees, so they show their team cost only.' }; } };
  I.camps = { t: 'Influencer campaigns running', f: function (A, x) {
    var mine = projectsIn(A), L = C3().campsRunning(A).filter(function (p) { return mine.indexOf(p) >= 0; });
    return { num: L.length, a: pl(L.length, 'influencer campaign') + ' running now.', head: ['Campaign', 'Stage', 'Live date'], rows: L.map(function (p) { return row([p.brand + ', ' + p.name, p.stage, A.dayWord(p.live + 'T00:00')], '#/project/' + p.id); }),
      href: role(A) === 'Founder' ? '#/dash/f/camps' : '#/brands', how: 'Influencer campaign projects not yet Closed.' }; } };
  I.cold = { t: 'Cold leads to bring back', f: function (A, x) {
    var L = leadsIn(A).filter(function (l) { return l.back && !l.back.sent && l.stage !== 'Won'; });
    return { num: L.length, a: L.length ? pl(L.length, 'cold lead') + ' to bring back, each with a check-in drafted.' : 'No cold lead is waiting to be brought back.', head: ['Brand', 'Owner', 'Why'],
      rows: L.map(function (l) { return row([l.brand, who(A, l.owner), l.back.why], '#/lead/' + l.id); }), href: '#/leads/back', how: 'Leads on the Bring back list: no reply from the brand for the set days, or a Nurture check-in date that has come.' }; } };
  I.cappr = { t: 'Pending client approvals', f: function (A, x) {
    var mine = projectsIn(A).map(function (p) { return p.id; }), L = C3().capprWaiting(A).filter(function (c) { return mine.indexOf(c.project) >= 0; });
    return { num: L.length, a: L.length ? pl(L.length, 'item is', 'items are') + ' waiting for the client. The oldest has waited ' + pl(C3().ageOf(A, L[0]), 'day') + '.' : 'Nothing is waiting for a client.', head: ['Client', 'What', 'Waiting'],
      rows: L.map(function (c) { var p = byId(A.D().projects, c.project); return row([p.brand, c.what, pl(C3().ageOf(A, c), 'day')], '#/approvals/client'); }), href: '#/approvals/client', how: 'Content, plans and deliverables sent to the client for sign-off and not yet approved, oldest first.' }; } };
  I.expect = { t: 'Expected revenue this month', money: true, f: function (A, x) {
    var o = window.GUC_BD.pipe(A, leadsIn(A)), L = leadsIn(A).filter(function (l) { return o.mids.indexOf(l.id) >= 0; }), W = A.D().settings.bd.weights;
    return { num: Math.round(o.month * 1e5), a: 'Expected revenue this month is ' + rupees(Math.round(o.month * 1e5)) + ', from ' + pl(L.length, 'open lead') + ' due to close this month. The whole open pipeline is worth ' + rupees(Math.round(o.raw * 1e5)) + '.',
      head: ['Brand', 'Stage', 'Value', 'Counts'], rows: L.map(function (l) { return row([l.brand, l.stage, rupees(l.value * 1e5), rupees(Math.round((W[l.stage] || 0) / 100 * l.value * 1e5))], '#/lead/' + l.id); }), href: '#/leads/list/month',
      how: 'Open leads with an expected close date this month, each counted at its stage weight from Settings (New ' + W.New + '%, Contacted ' + W.Contacted + '%, Discovery call ' + W['Discovery call'] + '%, Proposal sent ' + W['Proposal sent'] + '%, Negotiation ' + W.Negotiation + '%).' }; } };
  I.missed = { t: 'Who missed follow-ups', f: function (A, x) {
    var P = per(A, x.per || 'week'), ids = peopleIn(A), L = (A.D().missed || []).filter(function (m) { return A.P[m.who] && inP(P, m.at) && (role(A) === 'Founder' || (isHead(A) && A.me().dept === 'BD') || ids.indexOf(m.who) >= 0); }), by = {};
    L.forEach(function (m) { (by[m.who] = by[m.who] || []).push(m); }); var K = Object.keys(by).sort(function (a, b) { return by[b].length - by[a].length; });
    return { num: L.length, a: L.length ? pl(L.length, 'follow-up') + ' missed ' + P.word + ', by ' + K.map(function (k) { return A.first(k) + ' (' + by[k].length + ')'; }).join(', ') + '.' : 'No follow-up was missed ' + P.word + '.', per: P.k,
      head: ['Person', 'Missed', 'Brands'], rows: K.map(function (k) { return row([who(A, k), by[k].length, by[k].map(function (m) { return m.brand; }).join(', ')], '#/leads/score'); }), href: '#/leads/score',
      act: K.length ? { k: 'remind', to: K[0], what: 'the follow-ups missed ' + P.word } : null, how: 'The missed follow-up log: a lead past the silence clock or an enquiry past the first-response limit, against the person it was given to, ' + P.word + '.' }; } };

  /* ---------------- 5 Nov: everyday questions across the whole sample (tasks, team, clients, inbox, media, gifting, money) ---------------- */
  var ST = { todo: 'To do', blocked: 'Blocked', check: 'Waiting for check', done: 'Done' };
  var dayOf = function (t) { return (t.due || '').slice(0, 10); };
  function whoScope(A, x) {   /* whose work the question is about, inside what this login may see */
    if (x.mine) return { ids: [A.ME()], word: 'you' };
    if (x.who) return peopleIn(A).indexOf(x.who) >= 0 ? { ids: [x.who], word: who(A, x.who) } : { refused: true };
    if (x.dept) return { ids: peopleIn(A).filter(function (id) { return A.P[id].dept === x.dept; }), word: 'the ' + x.dept + ' team' };
    return { ids: peopleIn(A), word: role(A) === 'Founder' ? 'the agency' : role(A) === 'Department head' ? 'you and your team' : 'you' };
  }
  var noSee = function (A, x) { return { refused: true, a: 'You can see ' + scopeWord(A) + ' only, so I cannot show ' + who(A, x.who) + '\'s work. Ask ' + A.P[A.P[A.ME()].head || 'maddie'].name + '.' }; };
  I.tasks = { t: 'Tasks', f: function (A, x) {
    var sc = whoScope(A, x); if (sc.refused) return noSee(A, x);
    var when = x.when || (x.who || x.mine ? 'open' : 'today'), T = A.D().tasks.filter(function (t) { return sc.ids.indexOf(t.owner) >= 0; }), tm = A.addDays(A.TODAY + 'T00:00', 1).slice(0, 10), wk = A.addDays(A.TODAY + 'T00:00', 6).slice(0, 10);
    var L = when === 'today' ? T.filter(function (t) { return dayOf(t) === A.TODAY; }) : when === 'tomorrow' ? T.filter(function (t) { return dayOf(t) === tm; }) : when === 'week' ? T.filter(function (t) { return A.OPEN[t.status] && dayOf(t) >= A.TODAY && dayOf(t) <= wk; }) : T.filter(function (t) { return A.OPEN[t.status] || t.status === 'check'; });
    L.sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var open = L.filter(function (t) { return A.OPEN[t.status]; }), over = T.filter(A.isOverdue), many = sc.ids.length > 1, ppl = {}; L.forEach(function (t) { ppl[t.owner] = 1; });
    var wword = { today: 'due today', tomorrow: 'due tomorrow', week: 'due in the next 7 days', open: 'open' }[when];
    var a = !L.length ? 'Nothing is ' + wword + ' for ' + sc.word + '.' : (sc.word === 'you' ? 'You have ' : (many ? sc.word.charAt(0).toUpperCase() + sc.word.slice(1) + ' has ' : sc.word + ' has ')) + pl(L.length, 'task') + ' ' + wword + (many && Object.keys(ppl).length > 1 ? ', across ' + pl(Object.keys(ppl).length, 'person', 'people') : '') + (when === 'today' ? ': ' + open.length + ' still to do, ' + (L.length - open.length) + ' done or waiting for check.' : '.') + (L[0] && when !== 'open' ? ' First up: ' + L[0].title + ' (' + A.first(L[0].owner) + ', ' + A.clock(L[0].due) + ').' : '');
    if (over.length && when !== 'open') a += ' Also ' + pl(over.length, 'task') + ' past the deadline from before; ask "who has overdue tasks?" for those.';
    return { num: L.length, a: a, head: ['Task', 'Owner', 'Due', 'Status'], rows: L.map(function (t) { return row([t.title, who(A, t.owner), A.dayWord(t.due) + ', ' + A.clock(t.due), A.isOverdue(t) ? 'Overdue' : ST[t.status] || t.status], t.link ? (/^P/.test(t.link) ? '#/project/' + t.link : '#/lead/' + t.link) : '#/tasks'); }),
      href: when === 'today' && !x.who ? '#/today' : '#/tasks', act: open.length && x.who && x.who !== A.ME() ? { k: 'remind', to: x.who, what: 'the ' + pl(open.length, 'task') + ' ' + wword } : null,
      how: 'Tasks owned by ' + sc.word + ', ' + wword + (when === 'open' ? ' (To do, Blocked or Waiting for check)' : '') + ', from the Tasks list, soonest first.' }; } };
  I.blocked = { t: 'Blocked tasks', f: function (A, x) {
    var sc = whoScope(A, x); if (sc.refused) return noSee(A, x);
    var L = A.D().tasks.filter(function (t) { return sc.ids.indexOf(t.owner) >= 0 && t.status === 'blocked'; });
    return { num: L.length, a: L.length ? pl(L.length, 'task is', 'tasks are') + ' blocked. ' + L.slice(0, 2).map(function (t) { return t.title + ' (' + A.first(t.owner) + ': ' + (t.blocked || 'no reason given') + ')'; }).join('; ') + '.' : 'No task is blocked for ' + sc.word + '.',
      head: ['Task', 'Owner', 'Why blocked'], rows: L.map(function (t) { return row([t.title, who(A, t.owner), t.blocked || 'No reason given'], '#/tasks'); }), href: '#/tasks', how: 'Open tasks marked Blocked, with the reason the person gave.' }; } };
  I.check = { t: 'Waiting for check', f: function (A, x) {
    var me = A.ME(), L = A.D().tasks.filter(function (t) { return t.status === 'check' && (role(A) === 'Founder' ? true : t.checked_by === me || peopleIn(A).indexOf(t.owner) >= 0); });
    return { num: L.length, a: L.length ? pl(L.length, 'task is', 'tasks are') + ' done and waiting for a check' + (role(A) === 'Founder' ? '' : ' from you or your team') + '.' : 'Nothing is waiting for a check.',
      head: ['Task', 'Done by', 'Checked by'], rows: L.map(function (t) { return row([t.title, who(A, t.owner), who(A, t.checked_by)], '#/today'); }), href: '#/today', how: 'Tasks marked Done by their owner and not yet approved by the person in Checked by.' }; } };
  I.appr = { t: 'Approvals waiting', f: function (A, x) {
    var me = A.ME(), L = (A.D().approvals || []).filter(function (a) { return a.status === 'Waiting' && (role(A) === 'Founder' || a.approver === me || a.by === me); }), money = moneyOk(A);
    return { num: L.length, a: L.length ? pl(L.length, 'approval is', 'approvals are') + ' waiting' + (role(A) === 'Founder' ? '' : ' on you or raised by you') + ': ' + L.map(function (a) { return a.what; }).join('; ') + '.' : 'No approval is waiting.',
      head: ['What', 'Type', 'Raised by', 'Amount'], rows: L.map(function (a) { return row([a.what, a.type, who(A, a.by), money && a.amount ? rupees(a.amount) : '']); }), href: '#/approvals', how: 'Pricing, proposals, influencer fees and content plans raised inside the agency and not yet decided. Items waiting on the client are under "pending client approvals".' }; } };
  I.rev = { t: 'Revenue generated', money: true, f: function (A, x) {
    var P = per(A, x.per || 'month'), pids = projectsIn(A).map(function (p) { return p.id; }), R = revBy(A, P).filter(function (r) { return pids.indexOf(r.p.id) >= 0 && (!x.dept || r.p.dept === x.dept); }), tot = sum(R, function (r) { return r.amt; }), by = {};
    R.forEach(function (r) { by[r.svc] = (by[r.svc] || 0) + r.amt; }); var K = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; });
    return { num: tot, per: P.k, a: 'Revenue generated ' + (x.dept ? 'in ' + x.dept + ' ' : '') + P.word + ' is ' + rupees(tot) + ', from ' + pl(R.length, 'project') + (K.length ? '. Biggest: ' + K[0] + ' (' + rupees(by[K[0]]) + ').' : '.'),
      head: ['Service', 'Revenue'], rows: K.map(function (k) { return row([k, rupees(by[k])], '#/money/profit'); }), href: role(A) === 'Founder' ? '#/dash/f/rev' : '#/money/profit',
      how: 'Fees of projects that started ' + P.word + ', and the monthly fee of every retainer for each month it runs, the same rule as the founder dashboard.' }; } };
  I.coll = { t: 'Revenue collected', money: true, f: function (A, x) {
    var P = per(A, x.per || 'month'), pids = projectsIn(A).map(function (p) { return p.id; }), R = C3().receipts(A, P).filter(function (o) { return pids.indexOf(o.y.project) >= 0; }), tot = sum(R, function (o) { return o.r.amount; });
    return { num: tot, per: P.k, a: rupees(tot) + ' collected ' + P.word + ', in ' + pl(R.length, 'payment') + '.', head: ['Client', 'For', 'Received on', 'Amount'],
      rows: R.sort(function (a, b) { return a.r.on < b.r.on ? 1 : -1; }).map(function (o) { var p = byId(A.D().projects, o.y.project); return row([p.brand, o.y.what, A.dayWord(o.r.on + 'T00:00'), rupees(o.r.amount)], '#/project/' + p.id); }),
      href: '#/money/due', how: 'Money Farhan recorded as received ' + P.word + ', on projects in ' + scopeWord(A) + '.' }; } };
  I.won = { t: 'New clients closed', f: function (A, x) {
    var P = per(A, x.per || 'month'), mine = leadsIn(A), L = C3().wonIn(A, P).filter(function (l) { return mine.indexOf(l) >= 0; }), money = moneyOk(A);
    return { num: L.length, per: P.k, a: L.length ? pl(L.length, 'new client') + ' closed ' + P.word + ': ' + L.map(function (l) { return l.brand; }).join(', ') + '.' : 'No new client closed ' + P.word + ' yet.',
      head: ['Brand', 'Service', 'Closed by', 'Value'], rows: L.map(function (l) { return row([l.brand, l.interest || '', who(A, l.owner), money ? rupees(l.value * 1e5) : ''], '#/lead/' + l.id); }), href: '#/leads', how: 'Leads moved to Won ' + P.word + ', from each lead\'s History.' }; } };
  I.lost = { t: 'Leads lost', f: function (A, x) {
    var L = leadsIn(A).filter(function (l) { return /^Lost/.test(l.stage); }), by = {}; L.forEach(function (l) { var k = (l.lost || 'No reason').split(',')[0]; by[k] = (by[k] || 0) + 1; });
    var K = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; });
    return { num: L.length, a: L.length ? pl(L.length, 'lead is', 'leads are') + ' at Lost / Nurture. Top reason: ' + K[0] + ' (' + by[K[0]] + ').' : 'No lead is at Lost / Nurture.', head: ['Brand', 'Owner', 'Reason'],
      rows: L.map(function (l) { return row([l.brand, who(A, l.owner), l.lost || 'No reason'], '#/lead/' + l.id); }), href: '#/leads', how: 'Leads at Lost / Nurture with the reason given when they were moved.' }; } };
  I.pipe = { t: 'Pipeline by stage', f: function (A, x) {
    var L = leadsIn(A).filter(function (l) { return !/^(Won|Lost)/.test(l.stage); }), by = {}, money = moneyOk(A) || A.P[A.ME()].dept === 'BD';
    L.forEach(function (l) { var b = by[l.stage] = by[l.stage] || { n: 0, v: 0 }; b.n++; b.v += +l.value || 0; });
    var order = ['New', 'Contacted', 'Discovery call', 'Proposal sent', 'Negotiation'], tot = sum(L, function (l) { return +l.value || 0; });
    return { num: L.length, a: pl(L.length, 'open lead') + ' in the pipeline' + (money ? ', worth ' + rupees(tot * 1e5) + ' in all' : '') + '. ' + order.filter(function (s) { return by[s]; }).map(function (s) { return s + ' ' + by[s].n; }).join(', ') + '.',
      head: ['Stage', 'Leads', 'Value'], rows: order.filter(function (s) { return by[s]; }).map(function (s) { return row([s, by[s].n, money ? rupees(by[s].v * 1e5) : ''], '#/leads'); }), href: '#/leads', how: 'Every lead not yet Won or Lost, by its stage on the Leads board.' }; } };
  I.newleads = { t: 'New leads', f: function (A, x) {
    var L = leadsIn(A).filter(function (l) { return l.stage === 'New' || (l.created || '').slice(0, 10) === A.TODAY; });
    return { num: L.length, a: L.length ? pl(L.length, 'lead') + ' new or still not contacted: ' + L.slice(0, 4).map(function (l) { return l.brand + ' (' + A.first(l.owner) + ')'; }).join(', ') + '.' : 'Every lead has been contacted.',
      head: ['Brand', 'Came from', 'Owner', 'Stage'], rows: L.map(function (l) { return row([l.brand, (A.CHN && A.CHN[l.ch]) || l.ch, who(A, l.owner), l.stage], '#/lead/' + l.id); }), href: '#/leads', how: 'Leads that came in today, and leads still at New.' }; } };
  I.inbox = { t: 'Inbox', f: function (A, x) {
    if (role(A) === 'Finance') return { refused: true, a: 'The inbox is for the client-facing team. Ask Maddie if you need a conversation.' };
    var me = A.ME(), C = (A.D().inbox || []).filter(function (c) { return role(A) === 'Founder' || c.assigned === me || (isHead(A) && (!c.assigned || peopleIn(A).indexOf(c.assigned) >= 0)); });
    var L = C.filter(function (c) { var m = c.msgs[c.msgs.length - 1]; return !c.read || (m && m.kind === 'them'); }), un = C.filter(function (c) { return !c.assigned; });
    return { num: L.length, a: L.length ? pl(L.length, 'conversation') + ' waiting for a reply, ' + un.length + ' of them not given to anyone yet.' : 'Every conversation has a reply.',
      head: ['From', 'Channel', 'Given to', 'Last message'], rows: L.map(function (c) { var m = c.msgs[c.msgs.length - 1]; return row([c.name + (c.biz ? ', ' + c.biz : ''), (A.CHN && A.CHN[c.ch]) || c.ch, c.assigned ? who(A, c.assigned) : 'Nobody yet', m ? A.dayWord(m.at) + ', ' + A.clock(m.at) : ''], '#/inbox'); }), href: '#/inbox', how: 'Conversations where the last message is from the client, or that nobody has opened.' }; } };
  I.clients = { t: 'Clients', f: function (A, x) {
    var P = projectsIn(A).filter(function (p) { return p.stage !== 'Closed' && (!x.dept || p.dept === x.dept); }), by = {}; P.forEach(function (p) { (by[p.brand] = by[p.brand] || []).push(p); });
    var K = Object.keys(by);
    return { num: K.length, a: pl(K.length, 'live client') + (x.dept ? ' in ' + x.dept : '') + ': ' + K.join(', ') + '.', head: ['Client', 'Projects', 'Lead person'], rows: K.map(function (k) { return row([k, by[k].map(function (p) { return p.name; }).join(', '), who(A, by[k][0].poc)], '#/project/' + by[k][0].id); }), href: '#/brands', how: 'Brands with at least one project not yet Closed, in ' + scopeWord(A) + '.' }; } };
  I.projects = { t: 'Projects', f: function (A, x) {
    var P = projectsIn(A).filter(function (p) { return p.stage !== 'Closed' && (!x.dept || p.dept === x.dept); });
    return { num: P.length, a: pl(P.length, 'project') + ' running' + (x.dept ? ' in ' + x.dept : '') + '.' + (P.length ? ' Next to go live: ' + P.slice().sort(function (a, b) { return (a.live || '9') < (b.live || '9') ? -1 : 1; })[0].brand + '.' : ''),
      head: ['Project', 'Department', 'Stage', 'Live date'], rows: P.map(function (p) { return row([p.brand + ', ' + p.name, p.dept, p.stage, p.live ? A.dayWord(p.live + 'T00:00') : '']); }).map(function (r, i) { r.href = '#/project/' + P[i].id; return r; }), href: '#/brands', how: 'Projects not yet Closed, in ' + scopeWord(A) + '.' }; } };
  I.status = { t: 'Status of a client', f: function (A, x) {
    var P = A.D().projects.filter(function (p) { return p.brand === x.brand && projectsIn(A).indexOf(p) >= 0; }), l = leadsIn(A).filter(function (y) { return y.brand === x.brand; })[0];
    if (!P.length && !l) return { refused: true, a: x.brand + ' is not in ' + scopeWord(A) + ', so I cannot show it.' };
    if (!P.length) return { a: x.brand + ' is a lead at ' + l.stage + ', owned by ' + who(A, l.owner) + '.' + (l.next ? ' Next follow-up: ' + A.dayWord(l.next + 'T00:00') + '.' : '') + (l.asked ? ' They asked for: ' + l.asked + '.' : ''), href: '#/lead/' + l.id, how: 'From the lead record: stage, owner, next follow-up and the last ask.' };
    var parts = P.map(function (p) { var lt = lateTasks(A, p), ca = C3().capprWaiting(A).filter(function (c) { return c.project === p.id; }), due = moneyOk(A) ? A.D().pay.filter(function (y) { return y.project === p.id && C3().leftOf(y) > 0 && y.due <= A.TODAY; }) : [];
      return { p: p, t: p.name + ' is at ' + p.stage + (p.live ? ', live ' + A.low(A.dayWord(p.live + 'T00:00')) : '') + (lt.length ? ', ' + pl(lt.length, 'task') + ' late' : ', on time') + (ca.length ? ', ' + pl(ca.length, 'item') + ' waiting for the client' : '') + (due.length ? ', ' + rupees(sum(due, C3().leftOf)) + ' to collect' : '') }; });
    return { a: x.brand + ': ' + parts.map(function (o) { return o.t; }).join('. ') + '.', head: ['Project', 'Stage', 'Live date', 'Lead person'], rows: P.map(function (p) { return row([p.name, p.stage, p.live ? A.dayWord(p.live + 'T00:00') : '', who(A, p.poc)], '#/project/' + p.id); }),
      href: '#/project/' + P[0].id, ctxP: P[0].id, how: 'From the project: its stage, live date, tasks past the deadline, items waiting for the client and payments due.' }; } };
  I.dept = { t: 'Department performance', f: function (A, x) {
    if (role(A) !== 'Founder' && !isHead(A)) return { refused: true, a: 'Department figures are for Maddie and the heads. Your own are on My dashboard.' };
    var P = per(A, x.per || 'month'), depts = isHead(A) ? [A.me().dept] : C3().DEPTS.filter(function (k) { return !x.dept || k === x.dept; }), R = revBy(A, P);
    var rows = depts.map(function (k) { var ids = A.ORDER.filter(function (id) { return A.P[id].dept === k; }), s = C3().taskStats(A, P, ids); return { k: k, pct: s.pct, over: s.over.length, rev: sum(R.filter(function (r) { return r.p.dept === k; }), function (r) { return r.amt; }), live: A.D().projects.filter(function (p) { return p.dept === k && p.stage !== 'Closed'; }).length }; });
    var best = rows.filter(function (r) { return r.pct != null; }).sort(function (a, b) { return b.pct - a.pct; })[0], worst = rows.slice().sort(function (a, b) { return b.over - a.over; })[0];
    return { a: (best ? best.k + ' is doing best on time (' + best.pct + '% of tasks on time ' + P.word + ').' : '') + (worst && worst.over ? ' ' + worst.k + ' has the most overdue (' + worst.over + ').' : ''), per: P.k,
      head: ['Department', 'On time', 'Overdue', 'Live projects', 'Revenue'], rows: rows.map(function (r) { return row([r.k, r.pct == null ? 'No tasks due' : r.pct + '%', r.over, r.live, rupees(r.rev)], '#/dash'); }), href: '#/dash',
      how: 'On time = tasks due ' + P.word + ' done by their deadline. Overdue = open tasks past the deadline now. Revenue as on the dashboard.' }; } };
  I.prod = { t: 'Individual productivity', f: function (A, x) {
    var sc = whoScope(A, x); if (sc.refused) return noSee(A, x);
    var P = per(A, x.per || 'month'), rows = sc.ids.map(function (id) { var s = C3().taskStats(A, P, [id]); return { id: id, pct: s.pct, over: s.over.length, open: s.open.length, delay: s.delay }; }).sort(function (a, b) { return (b.pct == null ? -1 : b.pct) - (a.pct == null ? -1 : a.pct); });
    var top = rows.filter(function (r) { return r.pct != null; })[0];
    return { per: P.k, a: rows.length === 1 ? who(A, rows[0].id) + ': ' + (rows[0].pct == null ? 'no tasks due ' + P.word : rows[0].pct + '% of tasks done on time ' + P.word) + ', ' + rows[0].over + ' overdue, ' + rows[0].open + ' open.' : (top ? who(A, top.id) + ' is the most on time ' + P.word + ' (' + top.pct + '%).' : 'No tasks were due ' + P.word + '.'),
      head: ['Person', 'On time', 'Overdue', 'Open', 'Avg delay'], rows: rows.map(function (r) { return row([who(A, r.id), r.pct == null ? 'None due' : r.pct + '%', r.over, r.open, r.delay ? r.delay + ' d' : '0'], '#/dash/t/over/' + r.id); }), href: '#/dash',
      how: 'Tasks due ' + P.word + ' and done by the deadline, open tasks past the deadline, and the average days late, person by person.' }; } };
  I.inflist = { t: 'Influencers', f: function (A, x) {
    var s = x.s, L = (A.D().infl || []).slice(), cats = {}, cities = {}; L.forEach(function (i) { cats[i.cat.toLowerCase()] = 1; cities[i.city.toLowerCase()] = 1; });
    var c = Object.keys(cats).filter(function (k) { return s.indexOf(k) >= 0; }), t = Object.keys(cities).filter(function (k) { return s.indexOf(k) >= 0; });
    L = L.filter(function (i) { return (!c.length || c.indexOf(i.cat.toLowerCase()) >= 0) && (!t.length || t.indexOf(i.city.toLowerCase()) >= 0); });
    var byEr = /\bengag|\ber\b/.test(s); L.sort(function (a, b) { return byEr ? b.er - a.er : b.fol - a.fol; });
    var rates = role(A) !== 'Intern', k = function (n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1000) + 'k'; };
    return { num: L.length, a: L.length ? pl(L.length, 'influencer') + (c.length ? ' in ' + L.map(function (i) { return i.cat; }).filter(function (v, k, a) { return a.indexOf(v) === k; }).join(', ') : '') + (t.length ? ' in ' + L.map(function (i) { return i.city; }).filter(function (v, k, a) { return a.indexOf(v) === k; }).join(', ') : '') + ' on file. ' + (byEr ? 'Best engagement: ' : 'Biggest: ') + L[0].h + ' (' + k(L[0].fol) + ' followers, ' + L[0].er + '% engagement).' : 'No influencer on file matches that.',
      head: rates ? ['Handle', 'Category, city', 'Followers', 'Engagement', 'Reel rate'] : ['Handle', 'Category, city', 'Followers', 'Engagement'], rows: L.map(function (i) { var r = [i.h + ', ' + i.name, i.cat + ', ' + i.city, k(i.fol), i.er + '%']; if (rates) r.push(rupees(i.rate)); return row(r, '#/media'); }), href: '#/media',
      how: 'The influencer database' + (c.length || t.length ? ', filtered by the category or city in your question' : '') + ', sorted by ' + (byEr ? 'engagement' : 'followers') + '.' + (rates ? '' : ' Rates are hidden for interns.') }; } };
  I.hampers = { t: 'Gifting and dispatch', f: function (A, x) {
    var H = (A.D().hampers || []).filter(function (h) { return h.stage !== 'Posted'; }), money = moneyOk(A);
    return { num: H.length, a: H.length ? pl(H.length, 'hamper') + ' not yet posted about: ' + H.map(function (h) { return h.rec + ' (' + h.stage + ')'; }).join(', ') + '.' : 'Every hamper has been posted about.',
      head: ['Recipient', 'Brand', 'Stage', 'Courier', 'Value'], rows: H.map(function (h) { return row([h.rec, h.brand, h.stage, h.courier + ' ' + h.ref, money ? rupees(h.value) : ''], '#/gifting'); }), href: '#/gifting', how: 'Hampers from the dispatch tracker that have not reached Posted (proof of the post).' }; } };
  I.press = { t: 'Press follow-ups', f: function (A, x) {
    var L = (A.D().journos || []).slice().sort(function (a, b) { return (a.next || '9') < (b.next || '9') ? -1 : 1; });
    return { num: L.length, a: pl(L.length, 'journalist') + ' on the media list. Next follow-up: ' + L[0].name + ', ' + L[0].outlet + ', ' + A.low(A.dayWord(L[0].next + 'T00:00')) + '.',
      head: ['Journalist', 'Outlet', 'Last pitch', 'Next follow-up'], rows: L.map(function (j) { var p = j.pitches[j.pitches.length - 1]; return row([j.name, j.outlet + ', ' + j.beat, p ? p.story + ' (' + p.resp + ')' : '', j.next ? A.dayWord(j.next + 'T00:00') : ''], '#/media'); }), href: '#/media', how: 'Journalists and outlets, soonest follow-up first, with the last pitch and their response.' }; } };
  I.celebs = { t: 'Celebrities', f: function (A, x) {
    if (role(A) !== 'Founder' && !isHead(A)) return { refused: true, a: 'Celebrities and talent are for Maddie and the heads only.' };
    var L = A.D().celebs || [];
    return { num: L.length, a: pl(L.length, 'celebrity', 'celebrities') + ' on file: ' + L.map(function (c) { return c.name; }).join(', ') + '.', head: ['Name', 'Field', 'Terms', 'Management'], rows: L.map(function (c) { return row([c.name, c.cat, c.terms, c.mgmt], '#/media'); }), href: '#/media', how: 'Celebrities and talent, with their terms and who manages them.' }; } };
  I.team = { t: 'The team', f: function (A, x) {
    var ids = A.ORDER.filter(function (id) { return (!x.dept || A.P[id].dept === x.dept) && (!x.who || id === x.who || A.P[id].head === x.who); }), lv = A.D().leave || [], away = Array.isArray(lv) ? lv.map(function (l) { return l.who || l; }) : Object.keys(lv).filter(function (k) { return lv[k]; });
    return { num: ids.length, a: pl(ids.length, 'person', 'people') + (x.dept ? ' in ' + x.dept : x.who ? ' with ' + who(A, x.who) : ' at Glad U Came') + '.' + (away.length ? ' Away today: ' + away.map(function (w) { return who(A, w); }).join(', ') + '.' : ' Nobody is away today.'),
      head: ['Person', 'Role', 'Department', 'Reports to'], rows: ids.map(function (id) { var p = A.P[id]; return row([p.name, p.role, p.dept, p.head ? who(A, p.head) : ''], '#/people'); }), href: '#/people', how: 'From People: role, department and reporting line.' }; } };
  I.brief = { t: 'Summary', f: function (A, x) {
    var ids = peopleIn(A), T = A.D().tasks.filter(function (t) { return ids.indexOf(t.owner) >= 0; }), today = T.filter(function (t) { return dayOf(t) === A.TODAY && A.OPEN[t.status]; }), over = T.filter(A.isOverdue);
    var P = per(A, 'month'), L = leadsIn(A).filter(function (l) { return inP(P, l.created); }), del = delayedProjects(A, {}), ap = (A.D().approvals || []).filter(function (a) { return a.status === 'Waiting' && (role(A) === 'Founder' || a.approver === A.ME()); });
    var parts = [pl(today.length, 'task') + ' due today', pl(over.length, 'task') + ' overdue', pl(L.length, 'lead') + ' this month', pl(del.length, 'project') + ' delayed', pl(ap.length, 'approval') + ' waiting on you'];
    if (moneyOk(A)) { var rv = sum(revBy(A, P), function (r) { return r.amt; }), cl = sum(C3().receipts(A, P), function (o) { return o.r.amount; }); parts.push(rupees(rv) + ' revenue and ' + rupees(cl) + ' collected this month'); }
    return { a: 'Here is where things stand for ' + scopeWord(A) + ': ' + parts.join(', ') + '.', head: ['What', 'Now'], rows: [['Due today', today.length, '#/today'], ['Overdue', over.length, '#/dash'], ['Leads this month', L.length, '#/leads'], ['Projects delayed', del.length, '#/brands'], ['Approvals waiting', ap.length, '#/approvals']].map(function (r) { return row([r[0], r[1]], r[2]); }),
      href: '#/brief', how: 'The same counts as the morning brief and dashboards, for ' + scopeWord(A) + ', as of now.' }; } };
  var HELP = ['What are the tasks for today?', 'What is Tanvi working on?', 'Which projects are delayed?', 'Which clients have pending payments?', 'How much revenue did we generate this month?', 'Brief me', 'Who has overdue tasks?', 'Show the pipeline', 'Top food influencers in Bandra', 'Status of Kora Skincare'];
  I.help = { t: 'What I can answer', f: function (A, x) {
    return { a: 'I answer from everything in the cockpit: tasks (today, tomorrow, this week, by person, overdue, blocked), leads and the pipeline, clients and projects, payments, revenue and profit, approvals, the inbox, influencers, press, gifting, the team, and the handbook. I can also create a task, remind someone or draft a client update. Try one of these:', sugg: HELP }; } };

  /* which question is this? (fixed word rules over the cleaned sentence) */
  var MATCH = [
    ['why', /^why\b|\bwhy (is|are)\b/], ['bdtop', /\b(bd|business development|sales)\b.*\b(most|top|highest|best|maximum|max|more)\b|\b(maximum|max|highest) business\b|\bmost business\b|\bwho brought\b.*\b(most|business)|\b(most|top)\b.*\bbusiness\b|\bgenerated the most\b/],
    ['infl', /\binfluencer\b.*\b(revenue|business|earn\w*|income|how much|made)\b|\b(revenue|business|earn\w*|how much)\b.*\binfluencer/], ['pay', /\b(pending|outstanding|unpaid|owed|owes|not paid|overdue) payments?\b|\bpayments? (pending|due|outstanding|overdue)\b|\bwho owes\b|\bpending\b.*\bpayment|\bpayment\b.*\bpending/],
    ['late', /\b(delayed|late|behind)\b.*\bprojects?\b|\bprojects?\b.*\b(delayed|late|behind)\b/], ['missed', /\bmiss\w* follow|\bfollow.?ups? missed\b|\bfollow.?ups?\b.*\bmiss/],
    ['notdone', /\bnot completed|haven.?t (completed|done|finished)|did ?n.?t (complete|finish)|incomplete|\boverdue tasks?\b|\btasks? overdue\b|\bwho is behind\b|\bnot done\b/],
    ['cold', /\bcold\b|\bbring back\b|\brevive\b|\bdormant\b/], ['cappr', /\bclient approvals?\b|\bwaiting (on|for) the client\b|\bsign.?offs?\b/], ['expect', /\bexpected\b|\bforecast\b|\bpipeline value\b/],
    ['risk', /\bat risk\b|\brisky?\b|\bunhappy\b/], ['profit', /\bprofit|\bmargin|\bloss\b|\bin the red\b/], ['camps', /\bcampaigns?\b.*\b(running|live|active|on)\b|\b(running|live|active)\b.*\bcampaigns?\b/],
    ['props', /\bproposals?\b/],
    /* 5 Nov: everyday questions */
    ['help', /\bwhat (all )?can (you|i) (do|ask|answer)|\bhow (do|can) i use\b|^help\b|\bwhat do you know\b/],
    ['brief', /^brief\b|\bbrief me|\bgive me (a|the) brief|\bsummar|\boverview\b|\bhow (is|are) (the )?(business|agency|we|things)\b|\bwhat.?s (happening|going on)\b|\bkya chal raha\b|\bupdate me\b|\bstatus of (the )?(agency|business|company)\b/],
    ['coll', /\bcollected|\bcollections?\b|\b(money|payments?|amount|cash) (received|came in)\b|\breceived\b.*\b(money|payments?|amount)\b|\bcash in\b/],
    ['won', /\b(new )?(clients?|brands?|deals?|accounts?|leads?) (closed|won|signed|converted|onboarded)\b|\b(closed|won|signed|converted)\b.*\b(clients?|deals?|leads?|brands?)\b|\bconversions?\b/],
    ['lost', /\blost\b|\bwhy (do|did) we lose\b/],
    ['dept', /\bdepartments?\b|\bdept\b|\bteam.?wise\b|\bwhich team\b/],
    ['prod', /\bproductiv|\bperforman|\bon.?time\b|\bwho is (doing|performing) (best|well|worst|badly)\b|\bhow is \w+ doing\b|\bbest employee\b/],
    ['rev', /\brevenue\b|\bturnover\b|\bearn\w*\b|\bhow much (money|business)\b|\bbilling\b|\bincome\b/],
    ['blocked', /\bblocked\b|\bstuck\b/], ['check', /\bwaiting (for )?(a |my )?(check|review)\b|\b(to|for me to) (check|review)\b|\bneeds? (my )?(check|review)\b/],
    ['appr', /\bapprov|\bdecisions?\b/],
    ['inbox', /\binbox\b|\bunanswered\b|\bunread\b|\bmessages?\b|\bdms?\b|\bchats?\b|\bconversations?\b|\bnot replied\b|\breplies\b/],
    ['newleads', /\bnew leads?\b|\bleads? (today|came in today)\b|\bnot (yet )?contacted\b|\buncontacted\b|\bunassigned leads?\b/],
    ['pipe', /\bpipeline\b|\bopen leads?\b|\bfunnel\b|\bleads? (in|at|by) (negotiation|proposal|discovery|contacted|stage)/],
    ['celebs', /\bcelebrit|\btalent\b/],
    ['hampers', /\bhampers?\b|\bgifting\b|\bdispatch\w*\b|\bcourier\b|\bproof of post\b/],
    ['inflist', /\binfluencers?\b|\bcreators?\b|\bbloggers?\b/],
    ['press', /\bjournalists?\b|\bmedia list\b|\bpress\b|\bcoverage\b|\bpitch(es)?\b|\boutlets?\b|\breporters?\b/],
    ['team', /\bwho (is|are|works) in\b|\bteam (list|members?)\b|\breports? to\b|\bon leave\b|\baway today\b|\bhow many (people|employees|staff)\b|\bstaff\b|\bour team\b|\bwho is (in charge|the head)\b/],
    ['clients', /\bclients?\b|\bbrands?\b|\baccounts\b/],
    ['projects', /\bprojects?\b/],
    ['leads', /\bleads?\b|\benquir/],
    ['tasks', /\btasks?\b|\bto ?dos?\b|\bwork(ing)? on\b|\bagenda\b|\bon (my|his|her|their) plate\b|\bassigned\b|\bdue (today|tomorrow)\b|\bschedule\b/]
  ];
  var RATE = /\b(rate|rates|rate card|charge|price|pricing|fee|fees|salary|salaries|revenue|profit|payment|payments|money|margin|invoice|cost|costs|business)\b/;
  var ACTION = /^(remind|create|add|make|new task|reassign|give|draft|write|delete|remove|send)\b/;

  function knownBrand(A, s) {
    var all = A.D().brands.map(function (b) { return b.name; }).concat(A.D().leads.map(function (l) { return l.brand; }));
    var hit = all.filter(function (n) { var k = n.toLowerCase().replace(/[^a-z0-9& ]/g, ' ').replace(/\s+/g, ' ').trim(), w = k.split(' ')[0]; return s.indexOf(k) >= 0 || (w.length > 3 && new RegExp('\\b' + w + '\\b').test(s)); })[0];
    return hit || '';
  }
  /* a business name in the question (two or more capitalised words, not at the start) that is not a person, a month or a department */
  function namedBrand(A, q) {
    var w = String(q).replace(/[?!.,]+(\s|$)/g, ' ').split(/\s+/), runs = [], cur = [];
    w.forEach(function (x, i) { if (i > 0 && /^[A-Z][\w&'.-]*$/.test(x)) cur.push(x); else { if (cur.length) runs.push(cur); cur = []; } }); if (cur.length) runs.push(cur);
    var skip = new RegExp('^(' + A.ORDER.map(function (id) { return A.P[id].name.split(' ').join('|'); }).join('|') + '|PR|BD|GUC|Ask|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mid-Day|Instagram|WhatsApp|LinkedIn|Gmail|Hinglish|Diwali|Kora|Juhu|Bandra)$');
    var hit = runs.map(function (r) { return r.filter(function (x) { return !skip.test(x); }); }).filter(function (r) { return r.length >= 2; })[0];
    return hit ? hit.join(' ') : '';
  }

  var CTX = null, DEPTOK = { pay: 1, late: 1, notdone: 1, profit: 1, rev: 1, clients: 1, projects: 1, dept: 1, team: 1, tasks: 1 };
  function run(A, q, fromSched) {
    var s = clean(q), r, cmp = /\b(compare|vs|versus|against)\b/.test(s), x = { per: perWord(cmp ? s.split(/\b(?:with|vs|versus|against)\b/)[0] : s), dept: deptWord(s), pid: '' }, id = '';
    var brand = knownBrand(A, s); if (brand) { var p = A.D().projects.filter(function (p) { return p.brand === brand; })[0]; if (p) x.pid = p.id; }
    if (ACTION.test(s) && !fromSched) return action(A, q, s);
    if (/\b(policy|policies|sop|sops|process|guideline|rate cards?|case stud\w*|how do we|onboarding steps|template for)\b/.test(s)) return null;   /* the handbook answers these */
    var nb = namedBrand(A, q);
    if (nb && !brand) return { q: q, r: { none: true, a: 'Nothing is on file for ' + nb + ': no lead, brand or project by that name. I have not made a number up. Asking Maddie to check.' }, ask: 'maddie' };
    x.who = personWord(A, s); x.mine = !x.who && /\b(my|mine|i have|do i|i need to|am i)\b/.test(s); x.s = s; x.brand = brand;
    x.when = /\btomorrow\b/.test(s) ? 'tomorrow' : /\btoday\b|\btodays\b|\btonight\b/.test(s) ? 'today' : /\b(this|next) week\b|\bweek\b/.test(s) ? 'week' : '';
    var skip = (brand || (CTX && CTX.r && (CTX.r.ctxP || CTX.id === 'late'))) ? '' : 'why';
    if (/\bwhat (all )?can (you|i)\b|\bwhat do you (know|do)\b|^\s*help\b|\bhow (do|can) i use\b/i.test(q)) { var hh = I.help.f(A, {}); return { q: q, r: hh, id: '' }; }
    MATCH.some(function (m) { if (m[0] !== skip && m[1].test(s)) { id = m[0]; return true; } return false; });
    if (brand && (!id || /^(clients|projects|brief|leads)$/.test(id) || (id === 'tasks' && !x.who))) id = 'status';
    if (!id && x.who) id = 'tasks';
    /* follow-ups: "and last quarter?", "only PR", "why?" reuse the last question */
    if ((!id || (id === 'leads' && CTX && CTX.id !== 'leads' && !/\bleads?\b/.test(s))) && CTX && (x.per || x.dept || x.who || x.when || /^(and|only|just|what about|same|how about)\b/.test(s))) { id = CTX.id; x.per = x.per || CTX.x.per; x.dept = x.dept || CTX.x.dept; x.follow = true; if (x.dept && !DEPTOK[id]) return { q: q, r: { a: 'That answer is not split by department. Ask it again with the department in it, for example "which projects are delayed in ' + x.dept + '?"' } }; }
    if (id === 'why' && !x.pid && CTX && CTX.r && CTX.r.ctxP) x.pid = CTX.r.ctxP;
    if (id === 'why' && !x.pid && CTX && CTX.id === 'late') { var dl = delayedProjects(A, CTX.x)[0]; if (dl) x.pid = dl.id; }
    if (!id || (id === 'why' && !x.pid)) return null;   /* not a question about the agency's figures: the handbook takes it */
    var def = I[id];
    if (def.money && !moneyOk(A) && !(id === 'bdtop' && A.P[A.ME()].dept === 'BD' && role(A) === 'Team member')) return { q: q, r: refuseMoney(A), id: id };
    r = def.f(A, x); if (!r) return null;
    if (cmp && r.per && !r.refused) {   /* compare with the period before */
      var prev = { month: 'lastmonth', quarter: 'lastquarter', lastmonth: '', lastquarter: '' }[r.per];
      if (prev) { var r2 = def.f(A, Object.assign({}, x, { per: prev })), dlt = r.num - r2.num; r.a += ' ' + (per(A, prev).word.charAt(0).toUpperCase() + per(A, prev).word.slice(1)) + ': ' + fmt(id, r2.num) + '. ' + (dlt === 0 ? 'No change.' : (dlt > 0 ? 'Up ' : 'Down ') + fmt(id, Math.abs(dlt)) + '.'); r.cmp = r2.num; }
    } else if (x.follow && CTX && CTX.r && CTX.id === id && CTX.r.num != null && r.num != null && x.per && x.per !== (CTX.r.per || '')) {
      var dd = r.num - CTX.r.num; r.a += ' That is ' + (dd === 0 ? 'the same as' : fmt(id, Math.abs(dd)) + (dd > 0 ? ' more than' : ' less than')) + ' ' + per(A, CTX.r.per || 'month').word + ' (' + fmt(id, CTX.r.num) + ').';
    }
    CTX = { id: id, x: x, r: r };
    return { q: q, r: r, id: id, x: x };
  }
  var fmt = function (id, n) { return /^(bdtop|infl|profit|expect|rev|coll)$/.test(id) ? rupees(n) : String(n); };

  /* ---------------- actions: a person confirms; nothing is deleted or sent ---------------- */
  function action(A, q, s) {
    if (/^(delete|remove)\b/.test(s)) return { q: q, r: { refused: true, a: 'Ask GUC cannot delete anything. Open the record and delete it there; it stays in the Recycle bin for 30 days.' } };
    var to = personWord(A, s.replace(/^\w+\s+/, ' '));
    if (/^remind\b/.test(s)) {
      if (!to) return { q: q, r: { a: 'Who should I remind? Say a name, for example "remind Tanvi about the Kora reels".' } };
      var what = q.replace(/^\s*remind\s+\S+(\s+\S+)?\s*(about|to|of)?\s*/i, '').trim() || 'the open tasks';
      if (A.P[to] && new RegExp('^' + A.P[to].name.split(' ')[1] + '\\b', 'i').test(what)) what = what.replace(/^\S+\s*(about|to|of)?\s*/i, '');
      return { q: q, r: { a: 'I will remind ' + who(A, to) + ' about ' + what + '. Press Confirm to send it to their bell.' }, act: { k: 'remind', to: to, what: what } };
    }
    if (/^reassign|^give\b/.test(s)) {
      var m = s.match(/^(?:reassign|give)\s+(.*?)\s+to\s+(\w+)/), nt = m ? personWord(A, ' ' + m[2] + ' ') : '', words = m ? m[1].split(' ').filter(function (w) { return w.length > 3 && !/task|the|from/.test(w); }) : [];
      var t = m && A.D().tasks.filter(function (t) { return A.OPEN[t.status] && words.length && words.every(function (w) { return t.title.toLowerCase().indexOf(w) >= 0; }); })[0];
      if (!t || !nt) return { q: q, r: { a: 'Say the task and the person, for example "reassign the Kora reel scripts to Tanvi".' } };
      return { q: q, r: { a: 'I will move "' + t.title + '" from ' + who(A, t.owner) + ' to ' + who(A, nt) + '. Press Confirm.' }, act: { k: 'reassign', task: t.id, to: nt } };
    }
    if (/^(draft|write)\b/.test(s)) {
      var b = knownBrand(A, s), p = b && A.D().projects.filter(function (p) { return p.brand === b; })[0];
      if (!p) return { q: q, r: { a: 'Which client? Say the brand, for example "draft a message to Kora Skincare".' } };
      var u = C3().updParts(A, p), l = A.D().leads.filter(function (y) { return y.brand === p.brand; })[0], nm = l && !/^@/.test(l.contact) ? l.contact.split(' ')[0] : 'team';
      var txt = 'Hi ' + nm + ', a quick update on ' + p.name + '.\nDone: ' + (u.done.join(', ') || 'work is under way') + '.\nNext: ' + (u.next.join(', ') || 'the next steps are being planned') + '.' + (u.need.length ? '\nWe need from you: ' + u.need.join(', ') + '.' : '') + '\nThanks, ' + A.me().name.split(' ')[0] + ', Glad U Came';
      return { q: q, r: { a: 'Here is a draft for ' + p.brand + '. Check it, then copy it and send it yourself on WhatsApp or email. Ask GUC never sends a message to a client.', draft: txt } };
    }
    /* create a task */
    var due = /\btomorrow\b|\bkal\b/.test(s) ? A.addDays(A.TODAY + 'T18:00', 1) : A.TODAY + 'T18:00', owner = to || A.ME();
    if (role(A) !== 'Founder' && !isHead(A)) owner = A.ME();
    var title = q.replace(/^\s*(create|add|make)\s+(a\s+)?(new\s+)?task\s*(for\s+\S+)?\s*(to|:)?\s*/i, '').replace(/\b(by|due)?\s*(tomorrow|today)\b/i, '').trim();
    if (!title || title.length < 4) return { q: q, r: { a: 'Say what the task is, for example "create a task for Meera to clip the Mid-Day story tomorrow".' } };
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return { q: q, r: { a: 'I will give ' + (owner === A.ME() ? 'you' : who(A, owner)) + ' the task "' + title + '", due ' + A.low(A.dayWord(due)) + ' at ' + A.clock(due) + '. Press Confirm to save it.' }, act: { k: 'task', to: owner, title: title, due: due } };
  }
  function doAct(A, act) {
    var D = A.D();
    if (act.k === 'remind') { A.note(act.to, A.me().name + ' reminds you: ' + act.what); (D.askLog = D.askLog || []).push({ at: A.now(), who: A.ME(), what: 'Reminded ' + who(A, act.to) + ': ' + act.what }); return 'Reminder sent to ' + who(A, act.to) + '\'s bell.'; }
    if (act.k === 'task') { var t = S._pj.mkTask(A, { title: act.title, owner: act.to, due: act.due, by: A.ME() }); t.history.push({ at: A.now(), who: A.ME(), what: 'Made from Ask GUC' }); return 'Task saved for ' + who(A, act.to) + '.'; }
    if (act.k === 'reassign') { var t2 = byId(D.tasks, act.task); if (!t2) return 'That task is gone.'; var was = t2.owner; t2.owner = act.to; t2.history.push({ at: A.now(), who: A.ME(), what: 'Reassigned from ' + who(A, was) + ' to ' + who(A, act.to) + ' (Ask GUC)' }); A.note(act.to, A.me().name + ' gave you: ' + t2.title); return 'Moved to ' + who(A, act.to) + '.'; }
    return '';
  }

  /* ---------------- pins + scheduled questions ---------------- */
  var DOW = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  function nextRun(A, dw, hm, after) {
    var t = new Date((after || A.now()).slice(0, 16)); var c = new Date(t.getFullYear(), t.getMonth(), t.getDate(), +hm.slice(0, 2), +hm.slice(3, 5));
    while (c <= t || (dw >= 0 && c.getDay() !== dw)) c = new Date(c.getFullYear(), c.getMonth(), c.getDate() + 1, c.getHours(), c.getMinutes());
    return A.dayStr(c) + 'T' + hm;
  }
  function parseSched(s) {
    var m = s.match(/\bevery\s+(day|morning|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b(?:\s+(?:at\s+)?(\d{1,2})(?:[:. ](\d{2}))?\s*(am|pm)?)?/); if (!m) return null;
    var h = +(m[2] || 9), mi = m[3] || (m[2] ? '00' : '30'); if (m[4] === 'pm' && h < 12) h += 12; if (m[4] === 'am' && h === 12) h = 0;
    return { dw: DOW.indexOf(m[1]), hm: pad2(h) + ':' + mi, rest: s.replace(m[0], ' ').replace(/^\s*(,|and)?\s*(tell me|send me|show me)?\s*/, '').trim() };
  }
  var schedWord = function (A, x) { return (x.dw >= 0 ? 'Every ' + DOW[x.dw].charAt(0).toUpperCase() + DOW[x.dw].slice(1, 3) : 'Every day') + ' at ' + A.clock('2000-01-01T' + x.hm); };
  function runDue(D, A) {
    var ch = false, now = A.now();
    (D.sched || []).forEach(function (x) { if (x.next && x.next <= now) { var o = run(A, x.q, true); x.last = { at: now, a: o && o.r ? o.r.a : 'No answer.' }; A.note(x.by, 'Ask GUC, ' + schedWord(A, x).toLowerCase() + ': ' + x.last.a); x.next = nextRun(A, x.dw, x.hm, now); ch = true; } });
    return ch;
  }

  /* ---------------- the screen ---------------- */
  var ASK = [];
  var SUG = ['What are the tasks for today?', 'Brief me', 'Which BD executive generated the most business this month?', 'Which clients have pending payments?', 'Which projects are delayed?', 'Which employees have not completed assigned tasks?',
    'How much revenue came from influencer marketing this quarter?', 'Is mahine sabse zyada business kisne laya?', 'Leads this month by source', 'Profit by department this month', 'Which clients are at risk?', 'Who missed follow-ups this week?'];
  function table(A, r) {
    if (!r.rows || !r.rows.length) return '';
    var C = 'minmax(0,1.6fr) repeat(' + (r.head.length - 1) + ',minmax(0,1fr))';
    return '<div class="list" data-ans-table style="margin-top:var(--s-2)"><div class="lrow label" style="--cols:' + C + '">' + r.head.map(function (h, i) { return '<span' + (i ? ' style="text-align:right"' : '') + '>' + A.esc(h) + '</span>'; }).join('') + '</div>' +
      r.rows.slice(0, 8).map(function (w) { var cells = w.c.map(function (c, i) { return '<span' + (i ? ' class="num" style="text-align:right"' : '') + '>' + A.esc(String(c)) + '</span>'; }).join('');
        return w.href ? '<a class="lrow" data-ans-row href="' + w.href + '" style="--cols:' + C + ';text-decoration:none;color:inherit">' + cells + '</a>' : '<div class="lrow" data-ans-row style="--cols:' + C + '">' + cells + '</div>'; }).join('') +
      (r.rows.length > 8 ? '<div class="lrow faint" style="--cols:minmax(0,1fr)">and ' + (r.rows.length - 8) + ' more on the list</div>' : '') + '</div>';
  }
  function card(A, x, i) {
    var r = x.r, actB = '';
    if (x.act && !x.done) actB = '<button class="btn btn--sm btn--next" type="button" data-do="askconfirm" data-i="' + i + '">' + A.ico('check') + 'Confirm</button><button class="btn btn--sm btn--ghost" type="button" data-do="askcancel" data-i="' + i + '">Cancel</button>';
    else if (r.act && !x.done && !x.offer) actB = '<button class="btn btn--sm" type="button" data-do="askoffer" data-i="' + i + '">' + A.ico('bell') + 'Remind ' + A.esc(A.first(r.act.to)) + '</button>';
    var tools = x.id && !r.refused && !r.none ? '<button class="btn btn--sm btn--ghost" type="button" data-do="askpin" data-i="' + i + '">' + A.ico('pin') + 'Pin to dashboard</button><button class="btn btn--sm btn--ghost" type="button" data-do="asksched" data-i="' + i + '">' + A.ico('calendar-event') + 'Every Monday 9:30 am</button>' : '';
    return '<div class="lrow" data-ans="' + (r.refused ? 'refused' : r.none ? 'none' : x.id || (x.act ? 'action' : 'kb')) + '"' + (r.num != null ? ' data-num="' + r.num + '"' : '') + ' style="--cols:minmax(0,1fr)"><div style="display:flex;flex-direction:column;gap:var(--s-2)">' +
      '<b>' + A.esc(x.q) + '</b><p style="margin:0" data-ans-text>' + A.esc(r.a) + '</p>' +
      (r.draft ? '<div class="wa-preview" data-draft>' + A.esc(r.draft) + '</div><div><button class="btn btn--sm" type="button" data-do="askcopy" data-i="' + i + '">' + A.ico('copy') + 'Copy the draft</button> <span class="chip chip--amber">A person sends it</span></div>' : '') +
      table(A, r) +
      (r.sugg ? '<div class="chan-list" data-ans-sugg>' + r.sugg.map(function (t) { return '<button class="chip" type="button" data-do="asksug">' + A.esc(t) + '</button>'; }).join(' ') + '</div>' : '') +
      (r.src ? '<span class="chip chip--mint" data-src>' + A.ico('file-text') + 'Source: ' + A.esc(r.src) + '</span>' : '') + (x.ask || r.ask ? '<span class="chip chip--amber" data-asked>' + A.ico('bell') + 'Sent to ' + A.esc(A.P[x.ask || r.ask].name) + ' as a task</span>' : '') +
      (x.done ? '<span class="chip chip--green" data-acted>' + A.ico('check') + A.esc(x.done) + '</span>' : '') +
      (r.how ? '<details data-how><summary>How I counted</summary><p class="f-help" style="margin:var(--s-1) 0 0">' + A.esc(r.how) + '</p></details>' : '') +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' + (r.href && !r.refused ? '<a class="btn btn--sm btn--solid" data-open href="' + r.href + '">' + A.ico('list-details') + 'Open this list</a>' : '') + actB + tools + '</div></div></div>';
  }
  S.ask = function (A) {
    var D = A.D(), mineS = (D.sched || []).filter(function (x) { return x.by === A.ME(); });
    var sched = mineS.length ? '<div class="card" data-sched-list style="display:flex;flex-direction:column;gap:var(--s-2)"><div class="card-head"><h2 class="h-sec">Scheduled questions</h2><span class="label">The answer comes to your bell</span></div><div class="list">' +
      mineS.map(function (x) { return '<div class="lrow" data-sched="' + x.id + '" style="--cols:minmax(0,1fr) auto auto auto"><span>' + A.esc(x.q) + '</span><span class="chip">' + A.esc(schedWord(A, x)) + '</span><span class="faint">Next: ' + A.esc(A.dayWord(x.next) + ', ' + A.clock(x.next)) + '</span><button class="btn btn--sm btn--ghost" type="button" data-do="askunsched" data-v="' + x.id + '">Stop</button></div>'; }).join('') + '</div></div>' : '';
    return '<section class="card" data-ask style="display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Ask GUC</h1><span class="chip">Answers from the agency\'s own sample figures and the handbook, within ' + A.esc(scopeWord(A)) + '</span></div>' +
      '<form class="filters" data-form="ask4"><label class="search" style="max-width:none;flex:1"><span class="sr-only">Ask a question</span>' + A.ico('message-circle') + '<input class="input" id="ask-q" placeholder="Ask about leads, projects, tasks, payments, revenue or the handbook" autocomplete="off"></label>' +
      '<button class="btn btn--solid" type="submit">' + A.ico('send') + 'Ask</button><button class="mic" type="button" data-do="askmic" aria-pressed="false"><span class="mic-dot">' + A.ico('microphone') + '</span><span class="mic-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span data-mic-label>Speak</span></button>' +
      '<button class="btn btn--next" type="button" data-do="askvoice">' + A.ico('plus') + 'Create a task</button></form>' +
      '<div class="chan-list">' + SUG.map(function (s) { return '<button class="chip" type="button" data-do="asksug">' + A.esc(s) + '</button>'; }).join(' ') + '</div>' +
      '<div class="list" data-answers>' + (ASK.length ? ASK.map(function (x, i) { return [x, i]; }).reverse().map(function (y) { return card(A, y[0], y[1]); }).join('') :
        '<p class="faint" style="padding:var(--s-3)">Ask in your own words, in English or Hinglish, by typing or with Speak. Follow up with "and last quarter?", "only PR" or "why?". Ask GUC never invents an answer: when it has nothing on file, it says so and asks the person who owns that topic.</p>') + '</div>' + sched + '</section>';
  };
  function ask(A, q) {
    q = String(q || '').trim(); if (!q) return;
    var D = A.D(), sc = parseSched(clean(q)), o, r0;
    if (sc && sc.rest) { o = run(A, sc.rest, false); if (o && o.id) { addSched(A, sc.rest, sc.dw, sc.hm); o.q = q; o.r = Object.assign({}, o.r, { a: o.r.a + ' Scheduled: ' + schedWord(A, sc).toLowerCase() + ', the answer comes to your bell.' }); } }
    else o = run(A, q, false);
    if (!o) {   /* not about the figures: the handbook (B5), which asks the owner when it does not know */
      r0 = S._askKB(A, q);
      if (r0.ask) {
        var h = I.help.f(A, {}), real = clean(q).split(' ').filter(function (w) { return w.length > 3 && !/^(want|know|what|tell|about|there|this|that|with|have|need|show|give|which|where|when|something|anything|thing|things|some|please|would|like|from)$/.test(w); }).length >= 2;
        o = { q: q, r: { a: 'I did not catch what you need. ' + h.a, sugg: h.sugg }, id: '' };
        if (real) { o.r.a = 'I have nothing on file for that. Press Confirm to send your question to ' + A.P[r0.ask].name + ' as a task, or try one of these:'; o.act = { k: 'task', to: r0.ask, title: 'Answer for Ask GUC: ' + q, due: A.TODAY + 'T18:00' }; }
      } else o = { q: q, r: r0 };
    } else if (o.ask) S._pj.mkTask(A, { title: 'Answer for Ask GUC: ' + q, owner: o.ask, checker: o.ask, due: A.TODAY + 'T18:00', agent: true, by: A.ME(), why: 'Ask GUC: ' + A.me().name + ' asked, nothing on file' });
    ASK.push(o); A.save(); A.render();
    var inp = d.getElementById('ask-q'); if (inp) inp.focus();
  }
  function addSched(A, q, dw, hm) { var D = A.D(); D.sched.push({ id: 'Q' + (++D.seqQ), q: q, dw: dw, hm: hm, by: A.ME(), next: nextRun(A, dw, hm) }); }

  /* the pinned answers on the dashboard, recounted from the live data every time it opens */
  var prevDash = S.dash;
  S.dash = function (A) {
    var html = prevDash(A), D = A.D(), mine = (D.pins || []).filter(function (p) { return p.by === A.ME(); });
    if (!mine.length || /^#\/dash\/[tf]\//.test(location.hash)) return html;
    var save = CTX, cards = mine.map(function (p) { var o = run(A, p.q, true); CTX = save; var r = o && o.r || { a: 'No answer now.' };
      return '<div class="card" data-pin="' + p.id + '" style="display:flex;flex-direction:column;gap:var(--s-1)"><div class="card-head"><h2 class="h-sec">' + A.esc(p.q) + '</h2><button class="btn btn--sm btn--ghost" type="button" data-do="askunpin" data-v="' + p.id + '">Unpin</button></div>' +
        (r.num != null ? '<b class="fig" data-pin-num="' + r.num + '">' + A.esc(fmt(o.id, r.num)) + '</b>' : '') + '<p class="f-help" style="margin:0">' + A.esc(r.a) + '</p>' + (r.href ? '<a class="btn btn--sm" href="' + r.href + '">' + A.ico('list-details') + 'Open this list</a>' : '') + '</div>'; }).join('');
    var block = '<div class="brief" data-pins style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">' + cards + '</div>';
    var at = html.indexOf('</div>', html.indexOf('class="page-head"')) ; at = html.indexOf('</div>', at) ;
    var tabsEnd = html.indexOf('</div>', html.indexOf('class="tabs"')); var cut = tabsEnd > 0 ? tabsEnd + 6 : at + 6;
    return html.slice(0, cut) + block + html.slice(cut);
  };

  var prevAct = S._act;
  S._act = function (act, a, A) {
    var D = A.D(), i = +a.getAttribute('data-i'), x = ASK[i];
    if (act === 'asksug') { ask(A, a.textContent); return; }
    if (act === 'askconfirm' && x && x.act) { x.done = doAct(A, x.act); A.save(); A.render(); A.toast(x.done); return; }
    if (act === 'askcancel' && x) { x.act = null; x.done = 'Cancelled, nothing changed'; A.render(); return; }
    if (act === 'askoffer' && x && x.r.act) { var w = x.r.act; ASK.push({ q: 'Remind ' + A.first(w.to) + ' about ' + w.what, r: { a: 'I will remind ' + who(A, w.to) + ' about ' + w.what + '. Press Confirm to send it to their bell.' }, act: w }); x.offer = true; A.render(); return; }
    if (act === 'askpin' && x) { if (!D.pins.some(function (p) { return p.q === x.q && p.by === A.ME(); })) D.pins.push({ id: 'PN' + (++D.seqQ), q: x.q, by: A.ME(), at: A.now() }); A.save(); A.toast('Pinned to your dashboard. It recounts every time the dashboard opens.'); return; }
    if (act === 'asksched' && x) { addSched(A, x.q, 1, '09:30'); A.save(); A.render(); A.toast('Scheduled every Monday at 9:30 am. The answer comes to your bell.'); return; }
    if (act === 'askunpin') { D.pins = D.pins.filter(function (p) { return p.id !== a.getAttribute('data-v'); }); A.save(); A.render(); A.toast('Unpinned.'); return; }
    if (act === 'askunsched') { D.sched = D.sched.filter(function (p) { return p.id !== a.getAttribute('data-v'); }); A.save(); A.render(); A.toast('Stopped. That question no longer runs.'); return; }
    if (act === 'askcopy' && x) { try { navigator.clipboard.writeText(x.r.draft); } catch (e) {} A.toast('Draft copied. Send it yourself on WhatsApp or email.'); return; }
    if (act === 'askmic') {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition, lab = a.querySelector('[data-mic-label]'), live = function (on) { a.classList.toggle('is-live', on); a.setAttribute('aria-pressed', on); lab.textContent = on ? 'Listening' : 'Speak'; };
      var put = function (t, heard) { live(false); d.getElementById('ask-q').value = t; A.toast(heard ? 'Heard: "' + t + '".' : 'No microphone here, so a sample question was used: "' + t + '".'); ask(A, t); };
      if (!SR || navigator.webdriver) { live(true); setTimeout(function () { put('Is mahine sabse zyada business kisne laya?', false); }, 700); return; }
      var r = new SR(), got = ''; r.lang = 'en-IN'; r.interimResults = false;
      r.onresult = function (e) { got = e.results[0][0].transcript; };
      r.onerror = function (e) { if (e.error === 'not-allowed') A.toast('The microphone is blocked. Allow it in the address bar and try again.'); };
      r.onend = function () { got ? put(got, true) : (live(false), A.toast('Nothing heard. Press Speak and ask in one sentence.')); };
      live(true); try { r.start(); } catch (e) { put('Is mahine sabse zyada business kisne laya?', false); }
      return;
    }
    if (prevAct) prevAct(act, a, A);
  };
  d.addEventListener('submit', function (e) {
    if (e.target.getAttribute('data-form') !== 'ask4') return;
    e.preventDefault(); e.stopImmediatePropagation(); ask(window.GUC_APP, d.getElementById('ask-q').value);
  }, true);
  setInterval(function () { var A = window.GUC_APP; if (A && A.D && A.D() && A.D().c4 && runDue(A.D(), A)) A.save(); }, 60000);

  window.GUC_ASK = { run: run, clean: clean, per: per, ask: function (q) { ask(window.GUC_APP, q); }, list: function () { return ASK; }, reset: function () { ASK.length = 0; CTX = null; }, I: I };
})();
