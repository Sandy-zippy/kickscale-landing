/* Glad U Came demo . B5: Dashboards (My dashboard, Department head, Founder, Finance), the 9:30 Morning brief,
   Ask GUC (answers from sample rate cards, SOPs and case studies, names the source, asks the owner when it does not know,
   makes a task by Speak), People (who reports to whom, leave feeds the team pick) and Settings (Dropdown lists, project
   templates, reminder rules, approval limits). Every figure is worked out from the demo store, never fixed text.
   Loads after money.js and before app.js. */
(function () {
  'use strict';
  var S = window.GUC_SCREENS, d = document, KEY = 'guc.demo.v1';
  var rupees = function (n) { var s = String(Math.round(Math.abs(n))), last = s.slice(-3), rest = s.slice(0, -3); return (n < 0 ? '-' : '') + '₹' + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last; };
  var lakh = function (v) { return '₹' + (Math.round(v * 10) / 10).toFixed(1) + 'L'; };
  var role = function (A) { return A.me().role; };
  var STAGES = ['New', 'Contacted', 'Discovery call', 'Proposal sent', 'Negotiation', 'Won', 'Lost / Nurture'];
  var WEIGHT = { 'Proposal sent': 0.4, 'Negotiation': 0.7 };
  var tot = function (v) { return Math.round(v.amount * 1.18); };
  var openAmt = function (v) { return /^(Sent|Part paid)$/.test(v.stage) ? tot(v) - (v.received || 0) : 0; };

  /* ---------------- store: B5 settings + leave (idempotent, every load) ---------------- */
  var prevMig = S._migrate;
  S._migrate = function (D, A) {
    var ch = prevMig ? prevMig(D, A) : false;
    if (!D.settings) {
      ch = true;
      D.settings = { limits: { fee: 100000, expense: 10000 }, remind: { head_hours: 4, founder_days: 1 }, tpl: {}, history: [],
        lists: { 'Task priority': ['Urgent', 'High', 'Normal', 'Low'],
          'Why it is Blocked': ['Waiting on brand', 'Waiting for approval', 'Waiting on a teammate', 'Waiting on an influencer', 'Waiting on payment', 'Need information', 'Other'],
          'Lead source': ['WhatsApp', 'Instagram', 'Gmail', 'Website form', 'Meta lead ad', 'Referral'],
          'Why a lead was lost': ['Budget moved to next quarter', 'Went with another agency', 'No reply after 3 follow-ups', 'Not a fit'],
          'Influencer category': ['Fashion', 'Beauty', 'Food', 'Travel', 'Lifestyle', 'Fitness', 'Parenting', 'Tech', 'Comedy', 'Finance', 'Interiors and decor', 'Luxury', 'Pets'],
          'Courier': ['DTDC', 'Blue Dart', 'Delhivery', 'Dunzo', 'By hand'] } };
    }
    if (!D.leave) { D.leave = {}; ch = true; }
    Object.keys(D.leave).forEach(function (id) { if (A.P[id]) A.P[id].leave = D.leave[id]; });
    var T = window.GUC_TEMPLATES || {};
    Object.keys(D.settings.tpl).forEach(function (n) { if (T[n]) T[n].splice.apply(T[n], [0, T[n].length].concat(D.settings.tpl[n])); });
    return ch;
  };

  /* ---------------- shared bits ---------------- */
  var tile = function (A, l, i, n, sub, href, alert) {
    return '<a class="tile' + (alert ? ' tile--alert' : '') + '" href="' + href + '" data-fig style="text-decoration:none;color:inherit"><span class="tile-top"><span class="label">' + l + '</span><span class="tile-ico">' + A.ico(i) + '</span></span><span class="fig num">' + n + '</span><span class="tile-sub">' + sub + '</span></a>';
  };
  var card = function (title, sub, body, attr) { return '<div class="card"' + (attr || '') + ' style="display:flex;flex-direction:column;gap:var(--s-2)"><div class="card-head"><h2 class="h-sec">' + title + '</h2>' + (sub ? '<span class="label">' + sub + '</span>' : '') + '</div>' + body + '</div>'; };
  var barRow = function (A, href, left, n, max, right, red) {
    return '<a class="lrow" href="' + href + '" data-fig style="--cols:minmax(0,1fr) auto;row-gap:6px;text-decoration:none;color:inherit">' + left + '<b class="num" style="text-align:right">' + right + '</b><span class="bar' + (red ? ' bar--red' : '') + '" style="grid-column:1/-1"><i style="--p:' + (max ? Math.round(n / max * 100) : 0) + '"></i></span></a>';
  };
  var whoCell = function (A, id) { return '<span class="cell-who">' + A.avatar(id) + '<b>' + A.esc(A.P[id].name) + '</b></span>'; };
  var none = function (t) { return '<p class="faint">' + t + '</p>'; };
  var dueToday = function (A, t) { return A.OPEN[t.status] && t.due.slice(0, 10) === A.TODAY; };
  var inWeek = function (A, iso) { var n = A.daysBetween(iso.slice(0, 10), A.TODAY); return n >= 0 && n < 7; };
  var monthOf = function (A) { return A.TODAY.slice(0, 7); };
  function onTimeMonth(A, ids) {
    var due = A.D().tasks.filter(function (t) { return ids.indexOf(t.owner) >= 0 && t.due.slice(0, 7) === monthOf(A) && t.due.slice(0, 10) <= A.TODAY; });
    var ok = due.filter(function (t) { return (t.status === 'done' || t.status === 'check') && (!t.done_at || t.done_at <= t.due); });
    return due.length ? Math.round(ok.length / due.length * 100) + '%' : 'No tasks due yet';
  }
  var waitingOn = function (A, id) { return (A.D().approvals || []).filter(function (a) { return a.approver === id && a.status === 'Waiting'; }); };
  var health = function (A, p) {
    var late = A.D().tasks.filter(function (t) { return t.link === p.id && A.isOverdue(t); });
    var two = late.some(function (t) { return A.daysBetween(t.due.slice(0, 10), A.TODAY) >= 2; });
    var soon = p.live && A.daysBetween(A.TODAY, p.live) <= 7;
    return p.live && p.live < A.TODAY && !/Report|Closed|Delivered|Live/.test(p.stage) ? 'Late' : two || (soon && late.length) ? 'At risk' : 'On track';
  };
  var HC = { 'On track': 'chip--green', 'At risk': 'chip--amber', 'Late': 'chip--red' };

  /* ---------------- the four dashboards ---------------- */
  function myDash(A) {
    var id = A.ME(), u = A.me(), mine = A.D().tasks.filter(function (t) { return t.owner === id; });
    var due = mine.filter(function (t) { return dueToday(A, t); }).length, over = mine.filter(A.isOverdue).length, blk = mine.filter(function (t) { return t.status === 'blocked'; }).length, wt = waitingOn(A, id).length;
    var tg = (u.targets || []).map(function (t) { return '<div class="lrow" style="--cols:minmax(0,1fr) minmax(0,1fr) auto"><div><b>' + A.esc(t[0]) + '</b><span class="faint" style="display:block;font-size:var(--fs-12)">' + A.esc(t[3]) + '</span></div><span class="bar"><i style="--p:' + Math.min(100, Math.round(t[1] / t[2] * 100)) + '"></i></span><b class="num">' + t[1] + ' of ' + t[2] + '</b></div>'; }).join('');
    return '<div class="tiles">' + tile(A, 'Due today', 'calendar-event', due, 'My open tasks with a deadline today', '#/dash/t/due') +
      tile(A, 'Overdue', 'alert-triangle', over, over ? 'Start with these' : 'Nothing late', '#/dash/t/over', over > 0) +
      tile(A, 'Blocked', 'hand-stop', blk, 'With the reason, my department head is told', '#/dash/t/blocked') +
      tile(A, 'Streak', 'flame', u.streak, 'Days in a row with every task closed', '#/today') + '</div>' +
      '<div class="tiles">' + tile(A, 'On time this month', 'clock', onTimeMonth(A, [id]), 'Done by the deadline, of my tasks due so far', '#/dash/t/month') +
      tile(A, 'Waiting on my approval', 'square-check', wt, wt ? 'Oldest first in Approvals' : 'Nothing waiting', '#/approvals', wt > 0) +
      tile(A, 'Waiting for check', 'eye', A.D().tasks.filter(function (t) { return t.status === 'check' && t.checked_by === id; }).length, 'Tasks I check', '#/dash/t/check') + '</div>' +
      card('My targets', 'Whole month, never split by the day', tg || none('No targets set for you this month.'), ' data-targets');
  }

  function headDash(A, hid) {
    var D = A.D(), team = [hid].concat(A.teamOf(hid)), T = D.tasks.filter(function (t) { return team.indexOf(t.owner) >= 0; });
    var load = team.map(function (id) { return [id, T.filter(function (t) { return t.owner === id && A.OPEN[t.status]; }).length]; }), mx = Math.max.apply(null, load.map(function (x) { return x[1]; }).concat(1));
    var over = {}; T.filter(A.isOverdue).forEach(function (t) { over[t.owner] = (over[t.owner] || 0) + 1; });
    var blk = T.filter(function (t) { return t.status === 'blocked'; }), chk = D.tasks.filter(function (t) { return t.status === 'check' && (team.indexOf(t.owner) >= 0 || t.checked_by === hid); });
    var ap = waitingOn(A, hid), dept = A.P[hid].dept, risk = D.projects.filter(function (p) { return (p.dept === dept || p.team.indexOf(hid) >= 0) && health(A, p) !== 'On track'; });
    var pick = role(A) === 'Founder' ? '<select class="select" data-dashhead aria-label="Department">' + A.ORDER.filter(function (x) { return A.P[x].role === 'Department head'; }).map(function (x) { return '<option value="' + x + '"' + (x === hid ? ' selected' : '') + '>' + A.esc(A.P[x].dept + ', ' + A.P[x].name) + '</option>'; }).join('') + '</select>' : '';
    return (pick ? '<div class="filters">' + pick + '</div>' : '') + '<div class="tiles">' +
      tile(A, 'Overdue', 'alert-triangle', T.filter(A.isOverdue).length, 'Open tasks past the deadline, in the team', '#/dash/t/over/' + hid, Object.keys(over).length > 0) +
      tile(A, 'Blocked', 'hand-stop', blk.length, 'Grouped by reason below', '#/dash/t/blocked/' + hid) +
      tile(A, 'Waiting for check', 'eye', chk.length, 'Done by the team, not yet checked', '#/dash/t/check/' + hid) +
      tile(A, 'Approvals waiting', 'square-check', ap.length, 'Waiting on ' + A.first(hid), '#/approvals', ap.length > 0) + '</div>' +
      '<div class="brief" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">' + card('Team load', 'Open tasks per person', '<div class="list" data-load>' + load.map(function (x) { return barRow(A, '#/dash/t/open/' + x[0], whoCell(A, x[0]) + (A.P[x[0]].leave ? ' <span class="chip chip--amber">On leave</span>' : ''), x[1], mx, x[1]); }).join('') + '</div>') +
      card('Overdue by person', '', Object.keys(over).length ? '<div class="list">' + Object.keys(over).map(function (id) { return barRow(A, '#/dash/t/over/' + id, whoCell(A, id), over[id], mx, over[id] + ' overdue', true); }).join('') + '</div>' : none('Nobody in the team is overdue.')) +
      card('Blocked, with reasons', '', blk.length ? '<div class="list">' + blk.map(function (t) { return '<div class="lrow" data-id="' + t.id + '" style="--cols:minmax(0,1fr) auto"><button class="task-title" type="button" data-do="open">' + A.esc(t.title) + '</button><span class="chip chip--amber">' + A.esc(t.blocked || 'No reason') + '</span></div>'; }).join('') + '</div>' : none('Nothing is Blocked.')) +
      card('Risks', 'Projects At risk or Late', risk.length ? '<div class="list">' + risk.map(function (p) { return '<a class="lrow" data-fig href="#/project/' + p.id + '" style="--cols:minmax(0,1fr) auto;text-decoration:none;color:inherit"><b>' + A.esc(p.brand + ' . ' + p.name) + '</b><span class="chip ' + HC[health(A, p)] + '">' + health(A, p) + '</span></a>'; }).join('') + '</div>' : none('Every project is on track.')) + '</div>';
  }

  function founderDash(A) {
    var D = A.D(), L = D.leads, by = {}; STAGES.forEach(function (s) { by[s] = L.filter(function (l) { return l.stage === s; }); });
    var mx = Math.max.apply(null, STAGES.map(function (s) { return by[s].length; }));
    var fc = L.reduce(function (s, l) { return s + (WEIGHT[l.stage] || 0) * l.value; }, 0), won = by.Won.reduce(function (s, l) { return s + l.value; }, 0);
    var signed = D.projects.reduce(function (s, p) { return s + (p.fee || 0); }, 0), closed = by.Won.length + by['Lost / Nurture'].length;
    var inv = D.invoices || [], recv = inv.reduce(function (s, v) { return s + (v.received || 0); }, 0), owed = inv.reduce(function (s, v) { return s + openAmt(v); }, 0);
    var over = {}; D.tasks.filter(A.isOverdue).forEach(function (t) { over[t.owner] = (over[t.owner] || 0) + 1; }); var omx = Math.max.apply(null, Object.keys(over).map(function (k) { return over[k]; }).concat(1));
    var dec = (D.approvals || []).filter(function (a) { return a.status === 'Waiting'; });
    var camp = D.projects.map(function (p) { return [p, health(A, p)]; });
    /* leaderboard: tasks done on time this week; needs 5 due this week to be ranked */
    var lb = A.ORDER.map(function (id) {
      var due = D.tasks.filter(function (t) { return t.owner === id && inWeek(A, t.due) && t.due.slice(0, 10) <= A.TODAY; });
      var ok = D.tasks.filter(function (t) { return t.owner === id && (t.status === 'done' || t.status === 'check') && (!t.done_at || t.done_at <= t.due) && inWeek(A, t.due); });
      return [id, ok.length, due.length];
    }).sort(function (a, b) { return b[1] - a[1] || b[2] - a[2]; });
    var lmx = Math.max.apply(null, lb.map(function (x) { return x[1]; }).concat(1));
    return '<div class="tiles">' + tile(A, 'Forecast', 'trending-up', lakh(fc), 'Proposal sent x 40% + Negotiation x 70% (sample weights)', '#/leads') +
      tile(A, 'Signed business', 'briefcase', lakh(signed), D.projects.length + ' projects on the book, ' + lakh(won) + ' Won in Leads', '#/brands') +
      tile(A, 'Collected', 'currency-rupee', rupees(recv), rupees(owed) + ' still to collect', '#/money/age', owed > 0) +
      tile(A, 'Decisions needed', 'square-check', dec.length, 'Approvals waiting on someone', '#/approvals', dec.length > 0) + '</div>' +
      '<div class="brief" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">' + card('Lead funnel', 'Leads now, value in lakh', '<div class="list" data-funnel>' + STAGES.map(function (s) { return barRow(A, '#/leads', '<span>' + s + '</span>', by[s].length, mx, by[s].length + ' . ' + lakh(by[s].reduce(function (a, l) { return a + l.value; }, 0)), s.indexOf('Lost') === 0); }).join('') + '</div>' +
        '<p class="f-help">Win rate: ' + (closed ? Math.round(by.Won.length / closed * 100) : 0) + '% (' + by.Won.length + ' Won of ' + closed + ' Won or Lost).</p>') +
      card('Campaign health', 'Every project', '<div class="list" data-health>' + camp.map(function (x) { return '<a class="lrow" data-fig href="#/project/' + x[0].id + '" style="--cols:minmax(0,1fr) auto;text-decoration:none;color:inherit"><span class="cell-who"><div><b>' + A.esc(x[0].brand) + '</b><span>' + A.esc(x[0].name + ' . ' + x[0].stage) + '</span></div></span><span class="chip ' + HC[x[1]] + '">' + x[1] + '</span></a>'; }).join('') + '</div>' +
        '<p class="f-help">At risk: a task on it 2 days overdue, or the live date within 7 days with a task late. Late: past the live date.</p>') +
      card('Overdue by person', 'Whole agency', Object.keys(over).length ? '<div class="list" data-overby>' + Object.keys(over).sort(function (a, b) { return over[b] - over[a]; }).map(function (id) { return barRow(A, '#/dash/t/over/' + id, whoCell(A, id), over[id], omx, over[id] + ' overdue', true); }).join('') + '</div>' : none('Nobody is overdue.')) +
      card('Team leaderboard', 'This week . Founder only', '<div class="list" data-leader>' + lb.slice(0, 8).map(function (x, i) { var q = x[2] >= 5; return barRow(A, '#/dash/t/week/' + x[0], '<span class="cell-who"><span class="lb-rank" style="min-width:18px">' + (q ? i + 1 : '') + '</span>' + A.avatar(x[0]) + '<b>' + A.esc(A.P[x[0]].name) + '</b></span>', x[1], lmx, x[1] + ' on time' + (q ? '' : ', ' + x[2] + ' due')); }).join('') + '</div>' +
        '<p class="f-help">Ranked by tasks done on time this week. A person needs 5 tasks due this week to be ranked; the rest show without a rank.</p>') + '</div>';
  }

  function financeDash(A) {
    var D = A.D(), inv = D.invoices || [], pay = D.payouts || [];
    var sent = inv.filter(function (v) { return v.stage !== 'Draft' && v.stage !== 'Checked by Finance'; }), invd = sent.reduce(function (s, v) { return s + tot(v); }, 0);
    var recv = inv.reduce(function (s, v) { return s + (v.received || 0); }, 0), drafts = inv.filter(function (v) { return v.stage === 'Draft' || v.stage === 'Checked by Finance'; }).length;
    var B = [['0 to 30 days', 0, 30], ['31 to 60', 31, 60], ['61 to 90', 61, 90], ['above 90', 91, 1e9]], bt = [0, 0, 0, 0];
    inv.forEach(function (v) { var o = openAmt(v); if (!o || !v.issued) return; var n = A.daysBetween(v.issued, A.TODAY); B.forEach(function (b, i) { if (n >= b[1] && n <= b[2]) bt[i] += o; }); });
    var amx = Math.max.apply(null, bt.concat(1)), due = pay.filter(function (p) { return p.stage === 'Approved'; });
    var miss = pay.filter(function (p) { return p.stage !== 'Paid' && (!p.docs.inv || !p.docs.pan || (p.ptype === 'Influencer' && !p.docs.live)); });
    return '<div class="tiles">' + tile(A, 'Invoiced', 'file-invoice', rupees(invd), sent.length + ' invoices sent, with GST', '#/money/inv') +
      tile(A, 'Received', 'currency-rupee', rupees(recv), rupees(invd - recv) + ' still to collect', '#/money/age') +
      tile(A, 'Payouts due', 'cash', due.length, rupees(due.reduce(function (s, p) { return s + p.amount; }, 0)) + ' approved, not yet paid', '#/money/pay', due.length > 0) +
      tile(A, 'Documents missing', 'file-text', miss.length, 'Payouts without invoice, PAN or live link', '#/money/pay', miss.length > 0) + '</div>' +
      '<div class="brief" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">' + card('Receivables by age', 'Days since sent', '<div class="list" data-ageing>' + B.map(function (b, i) { return barRow(A, '#/money/age', '<span>' + b[0] + '</span>', bt[i], amx, rupees(bt[i]), i > 1); }).join('') + '</div>') +
      card('Documents missing', 'Before a payout can be paid', miss.length ? '<div class="list">' + miss.map(function (p) { return '<a class="lrow" data-fig href="#/money/pay" style="--cols:minmax(0,1fr) auto;text-decoration:none;color:inherit"><span class="cell-who"><div><b>' + A.esc(p.payee) + '</b><span>' + A.esc(p.no + ' . ' + rupees(p.amount)) + '</span></div></span><span>' +
        [['Invoice', p.docs.inv], ['PAN', p.docs.pan], ['Live link', p.ptype !== 'Influencer' || p.docs.live]].filter(function (x) { return !x[1]; }).map(function (x) { return '<span class="chip chip--red">' + x[0] + '</span>'; }).join(' ') + '</span></a>'; }).join('') + '</div>' : none('Every payout has its documents.')) +
      (drafts ? card('Invoices to check', '', '<a class="lrow" data-fig href="#/money/inv" style="--cols:minmax(0,1fr) auto;text-decoration:none;color:inherit"><span>Drafted by the Money agent, waiting for Finance</span><b class="num">' + drafts + '</b></a>') : '') + '</div>';
  }

  /* the list behind a figure: #/dash/t/<key>[/<person>] */
  var DRILL = { due: 'Due today', over: 'Overdue', blocked: 'Blocked', check: 'Waiting for check', open: 'Open tasks', month: 'Due this month', week: 'Due this week' };
  function drill(A, key, pid) {
    var vis = A.visible(), u = A.ME();
    var L = vis.filter(function (t) {
      if (pid && key !== 'check' && t.owner !== pid) return false;
      if (!pid && key !== 'check' && t.owner !== u) return false;
      if (key === 'due') return dueToday(A, t);
      if (key === 'over') return A.isOverdue(t);
      if (key === 'blocked') return t.status === 'blocked';
      if (key === 'check') { var team = pid ? [pid].concat(A.teamOf(pid)) : null; return t.status === 'check' && (team ? team.indexOf(t.owner) >= 0 || t.checked_by === pid : t.checked_by === u); }
      if (key === 'open') return A.OPEN[t.status];
      if (key === 'month') return t.due.slice(0, 7) === monthOf(A);
      if (key === 'week') return inWeek(A, t.due);
      return false;
    });
    return '<section class="card card--flush" data-drill="' + key + '"><div style="padding:var(--s-4);display:flex;flex-direction:column;gap:var(--s-2)"><div class="page-head"><h1 class="h-page">' + DRILL[key] + (pid ? ', ' + A.esc(A.P[pid].name) : '') + '</h1><a class="btn btn--sm" href="#/dash">' + A.ico('chevron-left') + 'Dashboards</a></div></div>' +
      '<div class="list" style="border-top:1px solid var(--line)">' + (L.length ? L.map(function (t) {
        return '<div class="lrow" data-id="' + t.id + '" style="--cols:minmax(0,1fr) auto auto auto"><button class="task-title" type="button" data-do="open" style="text-align:left">' + A.esc(t.title) + '</button>' + whoCell(A, t.owner) +
          '<span class="faint">' + A.esc(A.dayWord(t.due) + ', ' + A.clock(t.due)) + '</span><span class="chip' + (A.isOverdue(t) ? ' chip--red' : t.status === 'blocked' ? ' chip--amber' : '') + '">' + ({ todo: 'To do', blocked: 'Blocked', check: 'Waiting for check', done: 'Done' }[t.status] || t.status) + '</span></div>';
      }).join('') : '<div class="card empty"><span class="empty-art">' + A.ico('mood-smile') + '</span><h2 class="h-sec">Nothing here</h2><p>No task matches this figure right now.</p></div>') + '</div>' +
      '<div class="list-foot"><span>' + L.length + ' tasks</span></div></section>';
  }

  S.dash = function (A) {
    var m = location.hash.match(/^#\/dash\/t\/(\w+)(?:\/(\w+))?/);
    if (m && DRILL[m[1]]) return drill(A, m[1], m[2]);
    var r = role(A), views = r === 'Founder' ? [['founder', 'Founder'], ['head', 'Department head'], ['finance', 'Finance'], ['my', 'My dashboard']]
      : r === 'Department head' ? [['head', 'Department head'], ['my', 'My dashboard']] : r === 'Finance' ? [['finance', 'Finance'], ['my', 'My dashboard']] : [['my', 'My dashboard']];
    var v = (location.hash.match(/^#\/dash\/(\w+)/) || [])[1]; if (!views.some(function (x) { return x[0] === v; })) v = views[0][0];
    var hid = r === 'Department head' ? A.ME() : (S._dashHead || 'kabir');
    var body = v === 'founder' ? founderDash(A) : v === 'head' ? headDash(A, hid) : v === 'finance' ? financeDash(A) : myDash(A);
    return '<section data-dash="' + v + '" style="display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">' + (views.length > 1 ? 'Dashboards' : 'My dashboard') + '</h1><span class="chip">Sample data . every figure opens its list</span></div>' +
      (views.length > 1 ? '<div class="tabs" role="tablist">' + views.map(function (x) { return '<a class="tab" role="tab" href="#/dash/' + x[0] + '" aria-selected="' + (x[0] === v) + '">' + x[1] + '</a>'; }).join('') + '</div>' : '') + body + '</section>';
  };

  /* ---------------- Morning brief (9:30) ---------------- */
  function briefData(A) {
    var D = A.D(), r = role(A), vis = r === 'Founder' ? D.tasks : A.visible();
    var yday = A.addDays(A.TODAY + 'T09:30', -1);
    var done = vis.filter(function (t) { return (t.status === 'done' || t.status === 'check') && t.done_at && t.done_at >= yday; });
    var due = vis.filter(function (t) { return dueToday(A, t) && !A.isOverdue(t); }), over = vis.filter(A.isOverdue), blk = vis.filter(function (t) { return t.status === 'blocked'; });
    var chk = vis.filter(function (t) { return t.status === 'check'; });
    var ppl = r === 'Founder' ? A.ORDER : [A.ME()].concat(A.teamOf(A.ME()));
    var dec = (D.approvals || []).filter(function (a) { return a.status === 'Waiting' && (r === 'Founder' || ppl.indexOf(a.approver) >= 0 || ppl.indexOf(a.by) >= 0); });
    var byP = {}; over.forEach(function (t) { byP[t.owner] = (byP[t.owner] || 0) + 1; });
    return { done: done, due: due, over: over, blk: blk, chk: chk, dec: dec, byP: byP, scope: r === 'Founder' ? 'the whole agency' : r === 'Department head' ? 'your team' : 'your own tasks' };
  }
  function waText(A, b) {
    var L = ['Good morning team. 9:30 brief, ' + A.dayWord(A.TODAY + 'T00:00').replace('Today', 'today') + '.',
      'Done since yesterday: ' + b.done.length, 'Due today: ' + b.due.length, 'Overdue: ' + b.over.length, 'Waiting for check: ' + b.chk.length, 'Decisions needed: ' + b.dec.length];
    var ov = Object.keys(b.byP); if (ov.length) { L.push(''); L.push('Overdue by person:'); ov.forEach(function (id) { L.push(A.P[id].name + ': ' + b.byP[id]); }); }
    if (b.dec.length) { L.push(''); L.push('Decisions:'); b.dec.slice(0, 5).forEach(function (a) { L.push(GUC_APPR.label(a) + ', ' + rupees(a.amount) + ' (' + A.P[a.approver].name + ')'); }); }
    return L.join('\n');
  }
  S.brief = function (A) {
    var b = briefData(A), li = function (L, f, e) { return L.length ? '<ul class="brief-list">' + L.slice(0, 8).map(f).join('') + (L.length > 8 ? '<li><span class="faint">and ' + (L.length - 8) + ' more</span></li>' : '') + '</ul>' : '<p class="faint">' + e + '</p>'; };
    var trow = function (t) { return '<li data-id="' + t.id + '">' + A.avatar(t.owner) + '<button class="task-title" type="button" data-do="open" style="text-align:left">' + A.esc(t.title) + '</button></li>'; };
    return '<section class="brief-hero card"><div class="brief-sum"><h1 class="h-page">Morning brief</h1><p class="lede">For the 9:30 meeting, ' + b.scope + '. <b>' + b.done.length + ' done since yesterday, ' + b.due.length + ' due today, ' + b.over.length + ' overdue, ' + b.chk.length + ' waiting for check, ' + b.dec.length + ' decisions needed.</b></p></div>' +
      '<button class="btn btn--next" type="button" data-do="wa">' + A.ico('brand-whatsapp') + 'Send on WhatsApp</button></section>' +
      '<div class="brief" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))" data-brief>' + card('Done since yesterday', b.done.length, li(b.done, trow, 'Nothing closed since yesterday\'s brief.')) +
      card('Due today', b.due.length, li(b.due, trow, 'Nothing else due today.')) +
      card('Overdue by person', b.over.length, li(Object.keys(b.byP), function (id) { return '<li><a href="#/dash/t/over/' + id + '" style="display:contents;color:inherit">' + A.avatar(id) + '<span>' + A.esc(A.P[id].name) + '</span><span class="chip chip--red">' + b.byP[id] + ' overdue</span></a></li>'; }, 'Nobody is overdue.')) +
      card('Waiting for check', b.chk.length, li(b.chk, function (t) { return '<li data-id="' + t.id + '">' + A.avatar(t.owner) + '<button class="task-title" type="button" data-do="open" style="text-align:left">' + A.esc(t.title) + '</button><span class="chip">Checked by ' + A.esc(A.P[t.checked_by].name) + '</span></li>'; }, 'No checks waiting.')) +
      card('Decisions needed', b.dec.length, li(b.dec, function (a) { return '<li><a href="#/approvals" style="display:contents;color:inherit">' + A.avatar(a.approver) + '<span>' + A.esc(GUC_APPR.label(a)) + '</span><span class="chip chip--amber">' + rupees(a.amount) + '</span></a></li>'; }, 'No approvals waiting.')) +
      (b.blk.length ? card('Blocked', b.blk.length, li(b.blk, function (t) { return '<li data-id="' + t.id + '">' + A.avatar(t.owner) + '<button class="task-title" type="button" data-do="open" style="text-align:left">' + A.esc(t.title) + '</button><span class="chip chip--amber">' + A.esc(t.blocked) + '</span></li>'; }, '')) : '') + '</div>';
  };

  /* ---------------- Ask GUC ---------------- */
  /* Sample handbook: every entry names its kind, title, date and the person who owns it. */
  var KB = [
    { k: 'Rate card', t: 'Influencer reels, food and lifestyle', at: '1 Oct 2026', o: 'kabir', rate: 1, w: 'rate rates reel reels food lifestyle charge price cost fee followers 200k 100k 300k influencer',
      a: 'Food and lifestyle reels: ₹15,000 to ₹25,000 at 50K to 100K followers, ₹35,000 to ₹50,000 at 100K to 300K, ₹60,000 and up above 300K. Plus 18% GST. Above ₹1,00,000 per influencer needs Maddie\'s approval.' },
    { k: 'Rate card', t: 'Beauty and fashion reels and stories', at: '1 Oct 2026', o: 'kabir', rate: 1, w: 'rate rates beauty fashion story stories reel charge price fee influencer',
      a: 'Beauty and fashion: a story is about 40% of the reel rate, a static post about 70%. Reels run ₹45,000 to ₹75,000 at 200K to 400K followers.' },
    { k: 'Rate card', t: 'PR retainer', at: '15 Sep 2026', o: 'maddie', rate: 1, w: 'pr retainer monthly fee charge price rate press',
      a: 'PR retainer: ₹1.5L to ₹3L a month, minimum 3 months, includes a monthly coverage report.' },
    { k: 'SOP', t: 'Celebrity hamper', at: '20 Sep 2026', o: 'zoya', w: 'celebrity hamper gifting send dispatch courier proof post celeb',
      a: 'Zoya approves the list, Finance clears the cost, the hamper goes by courier with a tracking number, and the Gifting agent nudges for proof of post 2 and 5 days after Delivered.' },
    { k: 'SOP', t: 'Influencer payout', at: '5 Oct 2026', o: 'farhan', w: 'payout pay influencer invoice pan tds payment paid documents',
      a: 'A payout needs the live link, the influencer\'s invoice and PAN. Farhan approves, then records Paid with the bank reference. TDS is deducted at source.' },
    { k: 'SOP', t: 'New lead', at: '10 Oct 2026', o: 'riya', w: 'lead new enquiry reply first call discovery owner respond',
      a: 'Reply within 2 working hours, book the discovery call within 3 days, and move the lead to Discovery call once it is on the calendar.' },
    { k: 'SOP', t: 'Press preview', at: '12 Sep 2026', o: 'ananya', w: 'press preview journalist media list invite pitch outlet event',
      a: 'Media list from Journalists & outlets, invites 10 days before, a reminder 2 days before, and every attendee logged as a pitch.' },
    { k: 'Case study', t: 'Bandra pet cafe launch', at: 'Aug 2026', o: 'kabir', w: 'case study pet pets cafe launch dog example past work',
      a: 'A Bandra pet cafe launch with 6 pet influencers: 1.4M views and 210 walk-ins in two weeks (sample figures).' },
    { k: 'Case study', t: 'Bombay Brew Co. monsoon menu', at: 'Jul 2026', o: 'ananya', w: 'case study cafe coffee food menu monsoon launch example past work restaurant',
      a: 'Bombay Brew Co. monsoon menu: 12 food reels, 3 press stories, menu sold out in the first weekend (sample figures).' }
  ];
  var OWNERS = [[/rate|price|fee|reel|influencer/, 'kabir'], [/pay|invoice|gst|tds|money/, 'farhan'], [/press|pr\b|journalist|media/, 'ananya'], [/event|venue/, 'arjun'], [/celeb|hamper|gift/, 'zoya'], [/content|shoot|caption/, 'neha']];
  var ASK = [];
  function answer(A, q) {
    var words = q.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; });
    var best = null, score = 0;
    KB.forEach(function (e) { var s = words.filter(function (w) { return (' ' + e.w + ' ').indexOf(' ' + w + ' ') >= 0 || e.t.toLowerCase().indexOf(w) >= 0; }).length; if (s > score) { score = s; best = e; } });
    if (best && score >= 2) {
      if (best.rate && role(A) === 'Intern') return { a: 'Rates stay with the team members and heads. Ask ' + A.P[best.o].name + ' for this one.', refused: true };
      return { a: best.a, src: best.k + ': ' + best.t + ', updated ' + best.at + ', owned by ' + A.P[best.o].name };
    }
    var lq = q.toLowerCase(), own = (OWNERS.filter(function (x) { return x[0].test(lq); })[0] || [0, 'maddie'])[1];
    return { a: 'I don\'t know, asking ' + A.P[own].name + '.', ask: own };
  }
  S.ask = function (A) {
    var sug = ['What is our rate for a food reel with 200K followers?', 'How do we send a celebrity hamper?', 'Which case study fits a pet brand?', 'What do we charge for a wedding planner?'];
    return '<section class="card" data-ask style="display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Ask GUC</h1><span class="chip">Answers from sample rate cards, SOPs and case studies</span></div>' +
      '<form class="filters" data-form="ask"><label class="search" style="max-width:none;flex:1"><span class="sr-only">Ask a question</span>' + A.ico('message-circle') + '<input class="input" id="ask-q" placeholder="Ask about rates, SOPs or past work" autocomplete="off"></label>' +
      '<button class="btn btn--solid" type="submit">' + A.ico('send') + 'Ask</button><button class="btn btn--next" type="button" data-do="askvoice">' + A.ico('microphone') + 'Create a task</button></form>' +
      '<div class="chan-list">' + sug.map(function (s) { return '<button class="chip" type="button" data-do="asksug">' + A.esc(s) + '</button>'; }).join(' ') + '</div>' +
      '<div class="list" data-answers>' + (ASK.length ? ASK.slice().reverse().map(function (x) {
        return '<div class="lrow" style="--cols:minmax(0,1fr)"><div><b>' + A.esc(x.q) + '</b><p>' + A.esc(x.r.a) + '</p>' + (x.r.src ? '<span class="chip chip--mint" data-src>' + A.ico('file-text') + 'Source: ' + A.esc(x.r.src) + '</span>' : x.r.ask ? '<span class="chip chip--amber" data-asked>' + A.ico('bell') + 'Sent to ' + A.esc(A.P[x.r.ask].name) + ' as a task</span>' : '') + '</div></div>';
      }).join('') : '<p class="faint" style="padding:var(--s-3)">Ask a question, or press Create a task and say it in one sentence. Ask GUC never invents an answer: when the handbook does not have it, it asks the person who owns that topic.</p>') + '</div></section>';
  };
  function ask(A, q) {
    q = q.trim(); if (!q) return;
    var r = answer(A, q);
    if (r.ask) S._pj.mkTask(A, { title: 'Answer for Ask GUC: ' + q, owner: r.ask, checker: r.ask, due: A.TODAY + 'T18:00', agent: true, by: A.ME(), why: 'Ask GUC: ' + A.me().name + ' asked, the handbook has no answer' });
    ASK.push({ q: q, r: r }); A.save(); A.render();
  }

  /* ---------------- People ---------------- */
  S.people = function (A) {
    var r = role(A), me = A.ME(), canLeave = function (id) { return r === 'Founder' || A.P[id].head === me || id === me; };
    var heads = A.ORDER.filter(function (x) { return A.P[x].role === 'Department head' || A.P[x].role === 'Finance'; });
    var tree = '<div class="card" data-tree style="display:flex;flex-direction:column;gap:var(--s-2)"><div class="card-head"><h2 class="h-sec">Who reports to whom</h2></div>' +
      '<div class="cell-who">' + A.avatar('maddie') + '<div><b>Maddie</b><span>Founder</span></div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--s-2)">' + heads.map(function (h) {
        return '<div class="card" style="padding:var(--s-3)"><div class="cell-who">' + A.avatar(h) + '<div><b>' + A.esc(A.P[h].name) + '</b><span>' + A.esc(A.P[h].dept) + ', reports to Maddie</span></div></div>' +
          A.teamOf(h).map(function (x) { return '<div class="cell-who" style="margin:6px 0 0 18px">' + A.avatar(x) + '<div><b>' + A.esc(A.P[x].name) + '</b><span>' + A.esc(A.P[x].role) + (A.P[x].leave ? ', on leave' : '') + '</span></div></div>'; }).join('') + '</div>';
      }).join('') + '</div></div>';
    var rows = A.ORDER.map(function (id) {
      var p = A.P[id], open = A.D().tasks.filter(function (t) { return t.owner === id && A.OPEN[t.status]; }).length;
      return '<div class="lrow" data-person="' + id + '" data-f-dept="' + A.esc(p.dept) + '" data-f-role="' + A.esc(p.role) + '" style="--cols:minmax(0,1.4fr) minmax(0,1fr) auto auto">' +
        '<div class="cell-who">' + A.avatar(id, true) + '<div><b>' + A.esc(p.name) + '</b><span>' + A.esc(p.role + ', ' + p.dept) + '</span></div></div>' +
        '<span>' + (p.head ? 'Reports to ' + A.esc(A.P[p.head].name) : 'Founder') + '</span><span class="num">' + open + ' open tasks</span>' +
        (canLeave(id) ? '<button class="btn btn--sm' + (p.leave ? ' btn--next' : '') + '" type="button" data-do="leave" data-v="' + id + '" aria-pressed="' + !!p.leave + '">' + A.ico('calendar-event') + (p.leave ? 'On leave today' : 'Mark on leave') + '</button>'
          : '<span class="chip' + (p.leave ? ' chip--amber' : '') + '">' + (p.leave ? 'On leave today' : 'In today') + '</span>') + '</div>';
    }).join('');
    return '<section style="display:flex;flex-direction:column;gap:var(--s-3)">' + tree +
      '<section class="card card--flush" data-list><div style="padding:var(--s-4) var(--s-4) var(--s-3);display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">People</h1><span class="chip">15 people . Sample data</span></div>' +
      '<p class="f-help">A person on leave is skipped when a task is given to a team, and their reminders go to their department head for the day.</p>' +
      '<div class="filters"><label class="search"><span class="sr-only">Search people</span>' + A.ico('search') + '<input class="input" data-lq placeholder="Search people"></label>' +
      '<select class="select" data-lf="dept" aria-label="Department"><option value="">Department: all</option>' + ['Founder\'s office', 'BD', 'Influencer', 'PR', 'Celebrity & gifting', 'Events', 'Content', 'Finance'].map(function (x) { return '<option>' + A.esc(x) + '</option>'; }).join('') + '</select>' +
      '<select class="select" data-lf="role" aria-label="Role"><option value="">Role: all</option>' + ['Founder', 'Department head', 'Team member', 'Finance', 'Intern'].map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select>' +
      A.dateFilter({ date: '', from_d: '', to_d: '' }).replace(/data-tf=/g, 'data-ldate=') + '</div></div>' +
      '<div class="list" style="border-top:1px solid var(--line)">' + rows + '</div><div class="list-foot"><span data-lcount>15 of 15 people</span></div></section></section>';
  };

  /* ---------------- Settings (Founder) ---------------- */
  S.settings = function (A) {
    if (role(A) !== 'Founder') return '<div class="card empty"><span class="empty-art">' + A.ico('settings') + '</span><h2 class="h-sec">Settings are with Maddie</h2><p>Dropdown lists, templates, reminder rules and approval limits are edited by the Founder.</p><a class="btn btn--next" href="#/today">Back to Today\'s tasks</a></div>';
    var St = A.D().settings, tab = (location.hash.match(/^#\/settings\/(\w+)/) || [])[1] || 'lists', T = window.GUC_TEMPLATES || {};
    var tabs = [['lists', 'Dropdown lists'], ['tpl', 'Project templates'], ['remind', 'Reminder rules'], ['limits', 'Approval limits']], html = '';
    if (tab === 'lists') html = Object.keys(St.lists).map(function (n) {
      return '<div class="card" data-dlist="' + A.esc(n) + '" style="display:flex;flex-direction:column;gap:var(--s-2)"><div class="card-head"><h2 class="h-sec">' + A.esc(n) + '</h2><span class="label">' + St.lists[n].length + ' options</span></div><div style="display:flex;flex-wrap:wrap;gap:6px">' +
        St.lists[n].map(function (o, i) { return '<span class="chip">' + A.esc(o) + '<button type="button" class="btn btn--icon btn--ghost btn--sm" data-do="optdel" data-i="' + i + '" aria-label="Remove ' + A.esc(o) + '">' + A.ico('x', 'i--sm') + '</button></span>'; }).join('') +
        '</div><div class="filters"><input class="input" data-optnew placeholder="Add an option" aria-label="Add an option to ' + A.esc(n) + '"><button class="btn btn--sm" type="button" data-do="optadd">' + A.ico('plus') + 'Add</button></div></div>';
    }).join('') + '<p class="f-help">Changes here are kept in this sample. In the build every form reads these lists.</p>';
    if (tab === 'tpl') html = Object.keys(T).map(function (n) {
      return '<div class="card" data-tpl="' + A.esc(n) + '" style="display:flex;flex-direction:column;gap:var(--s-2)"><div class="card-head"><h2 class="h-sec">' + A.esc(n) + '</h2><span class="label">' + T[n].length + ' tasks when a project starts</span></div><div class="list">' +
        T[n].map(function (s, i) { return '<div class="lrow" style="--cols:minmax(0,1fr) auto auto auto"><span>' + A.esc(s[0]) + '</span><span class="chip">' + A.esc(s[1]) + '</span><span class="faint">' + A.esc(s[2]) + '</span><button class="btn btn--icon btn--ghost btn--sm" type="button" data-do="tpldel" data-i="' + i + '" aria-label="Remove this task">' + A.ico('x', 'i--sm') + '</button></div>'; }).join('') +
        '</div><div class="filters"><input class="input" data-tplnew placeholder="Add a task to this template" aria-label="New task in ' + A.esc(n) + '"><button class="btn btn--sm" type="button" data-do="tpladd">' + A.ico('plus') + 'Add</button></div></div>';
    }).join('') + '<p class="f-help">The next project started from a template gets these tasks. Projects already running keep theirs.</p>';
    if (tab === 'remind') html = '<div class="card" style="display:flex;flex-direction:column;gap:var(--s-3)"><p>A reminder goes to the task owner first, and to the person in Checked by while a check is waiting.</p>' +
      '<div class="f"><label for="rm-h">Then their department head, after (working hours)</label><input class="input" id="rm-h" type="number" min="1" max="48" value="' + St.remind.head_hours + '"></div>' +
      '<div class="f"><label for="rm-f">Then Maddie, after (working days)</label><input class="input" id="rm-f" type="number" min="1" max="10" value="' + St.remind.founder_days + '"></div>' +
      '<p class="f-help">On leave: the reminder goes to the department head instead. Reminders send on their own in the build.</p><button class="btn btn--next" type="button" data-do="remsave">' + A.ico('check') + 'Save reminder rules</button></div>';
    if (tab === 'limits') html = '<div class="card" style="display:flex;flex-direction:column;gap:var(--s-3)" data-limits><p>Up to the limit, the department head approves. Above it, the approval goes to Maddie. Payouts are approved by Finance; pricing and proposals by Maddie.</p>' +
      '<div class="f"><label for="lm-fee">Influencer fee, per influencer (₹)</label><input class="input" id="lm-fee" type="number" min="0" step="1000" value="' + St.limits.fee + '"></div>' +
      '<div class="f"><label for="lm-exp">Expense (₹)</label><input class="input" id="lm-exp" type="number" min="0" step="500" value="' + St.limits.expense + '"></div>' +
      '<button class="btn btn--next" type="button" data-do="limsave">' + A.ico('check') + 'Save approval limits</button><p class="f-help">Approvals raised from now on route by these limits. Ones already waiting stay with their approver.</p></div>';
    var hist = (St.history || []).slice(-6).reverse();
    return '<section style="display:flex;flex-direction:column;gap:var(--s-3)" data-settings="' + tab + '"><div class="page-head"><h1 class="h-page">Settings</h1><span class="chip">Maddie edits</span></div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<a class="tab" role="tab" href="#/settings/' + t[0] + '" aria-selected="' + (t[0] === tab) + '">' + t[1] + '</a>'; }).join('') + '</div>' + html +
      card('History', 'Settings changes', hist.length ? '<div class="list hist">' + hist.map(function (h) { return '<div class="lrow" style="--cols:minmax(0,1fr) auto"><span>' + A.esc(h.what) + '</span><span class="faint">' + A.esc(A.P[h.who] ? A.P[h.who].name : '') + ', ' + A.esc(A.dayWord(h.at) + ' ' + A.clock(h.at)) + '</span></div>'; }).join('') + '</div>' : none('No settings changed yet.')) + '</section>';
  };
  function shist(A, what) { A.D().settings.history.push({ at: A.now(), who: A.ME(), what: what }); }
  /* impact notice before removing an option that records use */
  function useCount(A, list, opt) {
    var D = A.D();
    if (list === 'Task priority') return D.tasks.filter(function (t) { return t.priority === opt; }).length + ' tasks';
    if (list === 'Why it is Blocked') return D.tasks.filter(function (t) { return t.blocked === opt; }).length + ' tasks';
    if (list === 'Why a lead was lost') return D.leads.filter(function (l) { return l.lost === opt; }).length + ' leads';
    if (list === 'Influencer category') return (D.infl || []).filter(function (x) { return x.cat === opt || x.category === opt; }).length + ' influencers';
    if (list === 'Courier') return (D.hampers || []).filter(function (h) { return h.courier === opt; }).length + ' hampers';
    if (list === 'Lead source') { var k = { WhatsApp: 'whatsapp', Instagram: 'instagram', Gmail: 'gmail', 'Website form': 'web', 'Meta lead ad': 'meta' }[opt]; return D.leads.filter(function (l) { return l.ch === k; }).length + ' leads'; }
    return '0 records';
  }

  /* ---------------- actions ---------------- */
  var prevAct = S._act;
  S._act = function (act, a, A) {
    var D = A.D();
    if (act === 'wa') {
      var old = d.getElementById('dlg-wa'); if (old) old.remove();
      d.body.insertAdjacentHTML('beforeend', '<dialog class="dialog" id="dlg-wa" aria-label="Send on WhatsApp"><div class="dialog-head"><h2 class="h-page">Send on WhatsApp</h2>' + A.micBtn() + '<button class="btn btn--icon btn--ghost" type="button" aria-label="Close" data-do="close">' + A.ico('x') + '</button></div>' +
        '<div class="dialog-body"><p class="f-help">This is exactly what goes to the team group from the shared number. Sample: sending connects in the build, and nothing leaves until you press Send there.</p><div class="wa-preview" data-wa>' + A.esc(waText(A, briefData(A))) + '</div></div>' +
        '<div class="dialog-foot"><button class="btn" type="button" data-do="close">Close</button><button class="btn btn--next" type="button" data-do="wacopy">' + A.ico('copy') + 'Copy the message</button></div></dialog>');
      d.getElementById('dlg-wa').showModal(); return;
    }
    if (act === 'wacopy') { try { navigator.clipboard.writeText(d.querySelector('[data-wa]').textContent); } catch (e) {} A.toast('Message copied. Sending from the shared number connects in the build.'); return; }
    if (act === 'asksug') { ask(A, a.textContent); return; }
    if (act === 'askvoice') {
      A.openNewTask();
      setTimeout(function () { var m = d.querySelector('dialog[open] [data-mic]'); if (m) m.click(); }, 60);
      return;
    }
    if (act === 'leave') {
      var id = a.getAttribute('data-v'), on = !A.P[id].leave; A.P[id].leave = on; D.leave[id] = on;
      if (A.P[id].head) A.note(A.P[id].head, A.P[id].name + (on ? ' is on leave today. Team tasks skip them.' : ' is back today.'));
      A.save(); A.render();
      A.toast(on ? A.P[id].name + ' is on leave today. New team tasks skip them; their reminders go to ' + (A.P[id].head ? A.P[A.P[id].head].name : 'Maddie') + '.' : A.P[id].name + ' is back in today.');
      return;
    }
    var box = a.closest('[data-dlist]');
    if (box && (act === 'optadd' || act === 'optdel')) {
      var n = box.getAttribute('data-dlist'), L = D.settings.lists[n];
      if (act === 'optadd') { var inp = box.querySelector('[data-optnew]'), v = inp.value.trim(); if (!v) { inp.focus(); return; }
        if (L.some(function (x) { return x.toLowerCase() === v.toLowerCase(); })) { A.toast('"' + v + '" is already on ' + n + '.'); return; }
        L.push(v); shist(A, n + ': added "' + v + '"'); A.save(); A.render(); A.toast('Added "' + v + '" to ' + n + '.'); return; }
      var i = +a.getAttribute('data-i'), opt = L[i], used = useCount(A, n, opt);
      var old2 = d.getElementById('dlg-impact'); if (old2) old2.remove();
      d.body.insertAdjacentHTML('beforeend', '<dialog class="dialog" id="dlg-impact" aria-label="Before you remove it"><div class="dialog-head"><h2 class="h-page">Before you remove it</h2>' + A.micBtn() + '<button class="btn btn--icon btn--ghost" type="button" aria-label="Close" data-do="close">' + A.ico('x') + '</button></div>' +
        '<div class="dialog-body"><p>"' + A.esc(opt) + '" on <b>' + A.esc(n) + '</b> is used by <b data-impact>' + used + '</b>, the Excel sample dropdowns and the filter bars.</p><p class="f-help">Change them too moves those records to "' + A.esc(L[i - 1] || L[i + 1] || '') + '". Only here keeps them as they are and removes the option for new records.</p></div>' +
        '<div class="dialog-foot"><button class="btn" type="button" data-do="close">Cancel</button><button class="btn" type="button" data-do="optonly" data-n="' + A.esc(n) + '" data-i="' + i + '">Only here</button><button class="btn btn--next" type="button" data-do="optall" data-n="' + A.esc(n) + '" data-i="' + i + '">Change them too</button></div></dialog>');
      d.getElementById('dlg-impact').showModal(); return;
    }
    if (act === 'optonly' || act === 'optall') {
      var nn = a.getAttribute('data-n'), LL = D.settings.lists[nn], ii = +a.getAttribute('data-i'), o = LL[ii], to = LL[ii - 1] || LL[ii + 1], moved = 0;
      if (act === 'optall' && to) {
        if (nn === 'Task priority') D.tasks.forEach(function (t) { if (t.priority === o) { t.priority = to; t.history.push({ at: A.now(), who: A.ME(), what: 'Priority changed to ' + to + ' (option removed in Settings)' }); moved++; } });
        if (nn === 'Why it is Blocked') D.tasks.forEach(function (t) { if (t.blocked === o) { t.blocked = to; t.history.push({ at: A.now(), who: A.ME(), what: 'Blocked reason changed to ' + to + ' (option removed in Settings)' }); moved++; } });
        if (nn === 'Why a lead was lost') D.leads.forEach(function (l) { if (l.lost === o) { l.lost = to; moved++; } });
      }
      LL.splice(ii, 1); shist(A, nn + ': removed "' + o + '"' + (act === 'optall' ? ', ' + moved + ' records moved to "' + to + '"' : ', records kept as they are'));
      a.closest('dialog').close(); A.save(); A.render(); A.toast('Removed "' + o + '" from ' + nn + (act === 'optall' ? '. ' + moved + ' records moved to "' + to + '".' : '. Existing records keep it.')); return;
    }
    var tb = a.closest('[data-tpl]');
    if (tb && (act === 'tpladd' || act === 'tpldel')) {
      var tn = tb.getAttribute('data-tpl'), TT = window.GUC_TEMPLATES[tn];
      if (act === 'tpladd') { var ti = tb.querySelector('[data-tplnew]'), tv = ti.value.trim(); if (!tv) { ti.focus(); return; } TT.push([tv, 'Brand POC', 'start + ' + (TT.length + 1) + ' days']); shist(A, tn + ' template: added "' + tv + '"'); }
      else { var gone = TT.splice(+a.getAttribute('data-i'), 1)[0]; shist(A, tn + ' template: removed "' + gone[0] + '"'); }
      D.settings.tpl[tn] = TT.map(function (x) { return x.slice(); }); A.save(); A.render(); A.toast('Saved. The next ' + tn + ' starts with ' + TT.length + ' tasks.'); return;
    }
    if (act === 'remsave') {
      var h = +d.getElementById('rm-h').value, f = +d.getElementById('rm-f').value;
      if (!(h >= 1) || !(f >= 1)) { A.toast('Both numbers must be 1 or more.'); return; }
      D.settings.remind = { head_hours: h, founder_days: f }; shist(A, 'Reminder rules: head after ' + h + ' working hours, Maddie after ' + f + ' working day' + (f === 1 ? '' : 's'));
      A.save(); A.render(); A.toast('Reminder rules saved.'); return;
    }
    if (act === 'limsave') {
      var fe = +d.getElementById('lm-fee').value, ex = +d.getElementById('lm-exp').value;
      if (!(fe >= 0) || !(ex >= 0) || d.getElementById('lm-fee').value === '' || d.getElementById('lm-exp').value === '') { A.toast('Enter both limits in rupees.'); return; }
      D.settings.limits = { fee: fe, expense: ex }; shist(A, 'Approval limits: influencer fee ' + rupees(fe) + ', expense ' + rupees(ex));
      A.save(); A.render(); A.toast('Approval limits saved. New approvals route by them.'); return;
    }
    if (act === 'resetdemo') {
      var o3 = d.getElementById('dlg-reset'); if (o3) o3.remove();
      d.body.insertAdjacentHTML('beforeend', '<dialog class="dialog" id="dlg-reset" aria-label="Reset sample data"><div class="dialog-head"><h2 class="h-page">Reset sample data</h2>' + A.micBtn() + '<button class="btn btn--icon btn--ghost" type="button" aria-label="Close" data-do="close">' + A.ico('x') + '</button></div>' +
        '<div class="dialog-body"><p>Put the sample data back as it was when the demo first opened: 30 leads, 6 projects and their tasks. Everything changed in this browser is cleared. Other browsers keep theirs.</p></div>' +
        '<div class="dialog-foot"><button class="btn" type="button" data-do="close">Cancel</button><button class="btn btn--next" type="button" data-do="resetgo">' + A.ico('refresh') + 'Reset sample data</button></div></dialog>');
      d.getElementById('dlg-reset').showModal(); return;
    }
    if (act === 'resetgo') { try { localStorage.removeItem(KEY); } catch (e) {} location.hash = '#/today'; location.reload(); return; }
    if (prevAct) prevAct(act, a, A);
  };
  d.addEventListener('submit', function (e) {
    if (e.target.getAttribute('data-form') !== 'ask') return;
    e.preventDefault(); e.stopImmediatePropagation(); var A = window.GUC_APP, q = d.getElementById('ask-q'); ask(A, q.value);
  }, true);
  d.addEventListener('change', function (e) { if (e.target.hasAttribute('data-dashhead')) { S._dashHead = e.target.value; window.GUC_APP.render(); } });
})();
