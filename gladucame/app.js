/* Glad U Came cockpit . clickable demo (B1: shell, sign-in, Today's tasks, Tasks + assign).
   No server: the whole demo runs from localStorage. Two tabs signed in as two people see each
   other's changes at once through the storage event. Built on Picasso's kit (design/), classes as they are. */
(function () {
  'use strict';
  var KEY = 'guc.demo.v1', SEED = window.GUC_SEED, d = document;
  var ico = function (n, c) { return GUC.icon(n, c); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var toast = function (t, u) { GUC.toast(t, u); };

  /* ---------------- people ---------------- */
  var P = {}, ORDER = [];
  SEED.people.forEach(function (p, i) {
    P[p[0]] = { id: p[0], name: p[1], role: p[2], dept: p[3], head: p[4], leave: p[5], streak: p[6], targets: p[7], av: 'av' + (i % 4 ? ' av--' + 'bcd'[i % 4 - 1] : '') };
    ORDER.push(p[0]);
  });
  var first = function (id) { return P[id] ? P[id].name.split(' ')[0] : ''; };
  var initials = function (id) { return P[id].name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); };
  var avatar = function (id, lg) { return '<span class="' + P[id].av + (lg ? ' av--lg' : '') + '" title="' + esc(P[id].name) + '">' + initials(id) + '</span>'; };
  var teamOf = function (hid) { return ORDER.filter(function (id) { return P[id].head === hid; }); };
  var DEPTS = ['BD', 'Influencer', 'PR', 'Celebrity & gifting', 'Events', 'Content', 'Finance'];
  /* Checked by defaults to the owner's department head; the Founder checks the heads and herself. */
  var defaultChecker = function (owner) { return P[owner].head || 'maddie'; };

  /* ---------------- dates ---------------- */
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var dayStr = function (dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); };
  var TODAY = dayStr(new Date());
  var addDays = function (iso, n) { var t = new Date(iso.slice(0, 10) + 'T12:00'); t.setDate(t.getDate() + n); return dayStr(t) + iso.slice(10); };
  var daysBetween = function (a, b) { return Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5); };
  var MON = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  function clock(iso) {
    var h = +iso.slice(11, 13), m = iso.slice(14, 16);
    return (h % 12 || 12) + ':' + m + (h < 12 ? ' am' : ' pm');
  }
  function dayWord(iso) {
    var n = daysBetween(TODAY, iso.slice(0, 10));
    if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow'; if (n === -1) return 'Yesterday';
    return +iso.slice(8, 10) + ' ' + MON[+iso.slice(5, 7) - 1];
  }
  var low = function (s) { return String(s).replace(/^(Today|Tomorrow|Yesterday|Overdue|Due)\b/, function (w) { return w.toLowerCase(); }); };   /* H1: only the relative words go lowercase; "16 Nov" keeps its capital */
  var now = function () { var t = new Date(); return dayStr(t) + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes()); };
  var OPEN = { todo: 1, blocked: 1 };
  var isOverdue = function (t) { return OPEN[t.status] && t.due < now(); };
  var isSnoozed = function (t) { return OPEN[t.status] && t.snooze && t.snooze > now(); };
  function dueText(t) {
    if (isOverdue(t)) {
      var late = daysBetween(t.due.slice(0, 10), TODAY);
      return late === 0 ? 'Overdue since ' + clock(t.due) : late === 1 ? 'Due yesterday, ' + clock(t.due) : 'Overdue ' + late + ' days';
    }
    return dayWord(t.due) + ', ' + clock(t.due);
  }

  /* ---------------- store ---------------- */
  var D;
  function blank() {
    var n = 0, st = { day: TODAY, seq: 0, tasks: [], notes: [], leads: [], projects: [] };
    SEED.projects.forEach(function (p) { st.projects.push({ id: p[0], brand: p[1], name: p[2], template: p[3], dept: p[4], team: p[5], live: addDays(TODAY + 'T00:00', p[6]).slice(0, 10), fee: p[7], stage: p[8] }); });
    SEED.leads.forEach(function (l, i) { st.leads.push({ id: 'L' + (i + 1), brand: l[0], contact: l[1], ch: l[2], stage: l[3], owner: l[4], value: l[5] }); });
    st.seqL = st.leads.length;
    migrate(st);
    SEED.tasks.forEach(function (t) {
      var x = t[6] || {}, lead = t[4].indexOf('L:') === 0 && st.leads.filter(function (l) { return l.brand === t[4].slice(2); })[0];
      var task = { id: 'T-' + pad(++n), title: t[1], owner: t[0], checked_by: defaultChecker(t[0]), due: addDays(TODAY + 'T' + t[2][1], t[2][0]),
        priority: t[3], link: lead ? lead.id : t[4], status: t[5], blocked: x.blocked || '', team: x.team || '', pick: x.pick || '',
        checklist: (x.checklist || []).map(function (c) { return { t: c, done: false }; }), assigned_by: t[0] === 'maddie' ? 'maddie' : (P[t[0]].head || 'maddie'),
        history: [{ at: addDays(TODAY + 'T09:00', -3), who: P[t[0]].head || 'maddie', what: 'Assigned to ' + P[t[0]].name + ', Checked by ' + P[defaultChecker(t[0])].name }] };
      if (task.status === 'check') task.history.push({ at: TODAY + 'T10:40', who: t[0], what: 'Marked Done. Waiting for check by ' + P[task.checked_by].name });
      if (task.status === 'done') { task.done_at = TODAY + 'T09:30'; task.history.push({ at: task.done_at, who: t[0], what: 'Marked Done' }); }
      if (task.pick) task.history.push({ at: TODAY + 'T09:05', who: 'agent', what: 'Task chaser: ' + task.pick });
      st.tasks.push(task);
    });
    st.seq = n;
    return st;
  }
  /* B2 fields on leads + the inbox. A store saved by the B1 build gets them here without losing a thing. */
  var TPL = ['Influencer campaign', 'PR retainer', 'PR project', 'Celebrity gifting', 'Event', 'Content'];
  function migrate(st) {
    st.leads.forEach(function (l, i) {
      if (l.mobile !== undefined) return;
      var n = +l.id.slice(1) - 1, slug = l.brand.toLowerCase().replace(/[^a-z]/g, '');
      l.mobile = '+91 98' + (200 + n) + ' ' + String(10000 + n * 311).slice(0, 5);
      l.insta = l.ch === 'instagram' ? '@' + slug : '';
      l.email = l.ch === 'gmail' ? l.contact.split(' ')[0].toLowerCase() + '@' + slug.slice(0, 14) + '.in' : '';
      l.interest = TPL[n % TPL.length]; l.created = addDays(TODAY + 'T10:00', -(n % 24) - 1); l.next = addDays(TODAY + 'T00:00', (n % 5) - 1).slice(0, 10);
      l.lost = l.stage === 'Lost / Nurture' ? (n % 2 ? 'Budget moved to next quarter' : 'Went with another agency') : '';
      l.dup = null; l.thread = []; l.history = [{ at: l.created, who: 'agent', what: 'Lead catcher: new lead from ' + CHN[l.ch] + ', given to ' + P[l.owner].name }];
    });
    (SEED.leadThreads || []).forEach(function (t) { var l = st.leads.filter(function (x) { return x.brand === t[0]; })[0];
      if (l && !l.thread.length) l.thread = t[1].map(function (m) { return { who: m[0], text: m[1], at: minsAgo(m[2]) }; }); });
    if (!st.seqL) st.seqL = st.leads.length;
    if (!st.inbox) st.inbox = SEED.inbox.map(function (c, i) {
      var lead = c[4] && st.leads.filter(function (l) { return l.brand === c[4]; })[0];
      return { id: 'C' + (i + 1), ch: c[0], name: c[1], handle: c[2], biz: c[3], lead: lead ? lead.id : '', assigned: c[5], read: c[6],
        msgs: c[7].map(function (m) { var k = m[0].split(':'); return { kind: k[0], who: k[1] || '', text: m[1], at: minsAgo(m[2]) }; }), history: [] };
    });
  }
  var CHN = { whatsapp: 'WhatsApp', instagram: 'Instagram', gmail: 'Gmail', web: 'Website form', meta: 'Meta lead ad' };
  function minsAgo(m) { var t = new Date(Date.now() - m * 60000); return dayStr(t) + 'T' + pad(t.getHours()) + ':' + pad(t.getMinutes()); }
  function load() {
    try { D = JSON.parse(localStorage.getItem(KEY)); } catch (e) { D = null; }
    if (!D || !D.tasks) { D = blank(); if (other._migrate) other._migrate(D, API); save(); return; }
    if (!D.inbox || !D.seqL) { migrate(D); save(); }
    if (other._migrate && other._migrate(D, API)) save();   /* B3: brands, project records, channels, approvals */
    var shift = daysBetween(D.day, TODAY);              /* a demo opened tomorrow still reads as today */
    if (shift) {
      D.tasks.forEach(function (t) { t.due = addDays(t.due, shift); if (t.snooze) t.snooze = addDays(t.snooze, shift); });
      D.projects.forEach(function (p) { p.live = addDays(p.live + 'T00:00', shift).slice(0, 10); });
      D.leads.forEach(function (l) { if (l.next) l.next = addDays(l.next + 'T00:00', shift).slice(0, 10); if (l.created) l.created = addDays(l.created, shift); });
      D.day = TODAY; save();
    }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { toast('This browser is not keeping the demo data. Changes last until you close the tab.'); } }
  function hist(t, what) { t.history.push({ at: now(), who: ME, what: what }); }
  function note(to, text, kind) { if (to && to !== ME) D.notes.push({ to: to, text: text, at: now(), kind: kind || 'internal', unread: true }); }
  var byId = function (id) { return D.tasks.filter(function (t) { return t.id === id; })[0]; };
  var linkOf = function (t) {
    if (!t.link) return null;
    var p = D.projects.filter(function (x) { return x.id === t.link; })[0];
    if (p) return { icon: 'briefcase', text: p.brand + ' . ' + p.name };
    var l = D.leads.filter(function (x) { return x.id === t.link; })[0];
    return l ? { icon: 'layout-kanban', text: 'Lead . ' + l.brand } : null;
  };

  /* ---------------- who sees what ---------------- */
  var ME = null;
  var me = function () { return P[ME]; };
  function canSee(t, uid) {
    var u = P[uid || ME];
    if (u.role === 'Founder') return true;
    if (t.owner === u.id) return true;
    if (u.role === 'Department head' && (P[t.owner].head === u.id || (t.checked_by === u.id && t.status === 'check'))) return true;
    return false;
  }
  var visible = function () { return D.tasks.filter(function (t) { return t.status !== 'cancelled' && canSee(t); }); };
  /* Who this login may assign to (R-25): Founder anyone, a head their team, everyone else themselves. */
  function assignable() {
    var u = me();
    if (u.role === 'Founder') return ORDER.slice();
    if (u.role === 'Department head') return [u.id].concat(teamOf(u.id));
    return [u.id];
  }
  function assignableTeams() {
    var u = me();
    if (u.role === 'Founder') return DEPTS;
    if (u.role === 'Department head') return [u.dept];
    return [];
  }

  /* ---------------- the Task chaser's pick (T1) ---------------- */
  var openLoad = function (id) { return D.tasks.filter(function (t) { return t.owner === id && (OPEN[t.status] || t.status === 'check'); }).length; };
  var soonDue = function (id) { return D.tasks.filter(function (t) { return t.owner === id && OPEN[t.status] && daysBetween(TODAY, t.due.slice(0, 10)) <= 1; }).length; };
  function pickFor(dept) {
    var all = ORDER.filter(function (id) { return P[id].dept === dept && P[id].role !== 'Founder'; });
    var doers = all.filter(function (id) { return P[id].role !== 'Department head'; });
    if (!doers.length) doers = all;                       /* a one-person department: the head does it */
    var away = doers.filter(function (id) { return P[id].leave; });
    var pool = doers.filter(function (id) { return !P[id].leave; });
    if (!pool.length) pool = all.filter(function (id) { return !P[id].leave; });
    pool.sort(function (a, b) { return openLoad(a) - openLoad(b) || soonDue(a) - soonDue(b) || P[a].name.localeCompare(P[b].name); });
    var who = pool[0];
    var reason = 'Picked: lightest load in ' + dept + ', ' + openLoad(who) + ' open task' + (openLoad(who) === 1 ? '' : 's');
    if (away.length) reason += '. ' + away.map(function (id) { return P[id].name; }).join(', ') + ' is on leave';
    return { who: who, reason: reason };
  }

  /* ---------------- actions ---------------- */
  function snapshot(t) { return JSON.stringify(t); }
  function restore(t, snap) { var o = JSON.parse(snap); Object.keys(t).forEach(function (k) { delete t[k]; }); Object.assign(t, o); save(); render(); }
  function markDone(t) {
    var snap = snapshot(t);
    if (t.checked_by && t.checked_by !== t.owner && t.checked_by !== ME) {
      t.status = 'check'; t.done_at = now(); t.blocked = '';
      hist(t, 'Marked Done. Waiting for check by ' + P[t.checked_by].name);
      note(t.checked_by, P[t.owner].name + ' finished "' + t.title + '". Waiting for check by you.');
      save(); render(); bumpStreak();
      toast('Done. Nice one. ' + P[t.checked_by].name + ' checks it next.', function () { restore(t, snap); });
    } else {
      t.status = 'done'; t.done_at = now(); t.blocked = '';
      hist(t, t.checked_by === ME && t.owner !== ME ? 'Marked Done and approved by ' + me().name : 'Marked Done');
      if (t.owner !== ME) note(t.owner, me().name + ' marked "' + t.title + '" Done.');
      save(); render(); bumpStreak();
      toast('Done. Nice one.', function () { restore(t, snap); });
    }
  }
  function approve(t) {
    var snap = snapshot(t);
    t.status = 'done'; hist(t, 'Approved by ' + me().name + '. Done');
    note(t.owner, me().name + ' approved "' + t.title + '". It is Done.');
    save(); render();
    toast('Approved. ' + first(t.owner) + "'s task is Done.", function () { restore(t, snap); });
  }
  function sendBack(t, why) {
    var snap = snapshot(t);
    t.status = 'todo'; t.sent_back = why; hist(t, 'Sent back by ' + me().name + ': ' + why);
    note(t.owner, me().name + ' sent back "' + t.title + '": ' + why);
    save(); render();
    toast('Sent back to ' + first(t.owner) + ' with your reason.', function () { restore(t, snap); });
  }
  function block(t, why) {
    var snap = snapshot(t);
    t.status = 'blocked'; t.blocked = why; hist(t, 'Marked Blocked: ' + why);
    var h = P[t.owner].head; if (h) note(h, P[t.owner].name + ' is Blocked on "' + t.title + '": ' + why);
    save(); render();
    toast('Marked Blocked. ' + (h ? P[h].name + ' is told.' : 'Saved.'), function () { restore(t, snap); });
  }
  function snooze(t, label) {
    var snap = snapshot(t), at = { 'Later today': TODAY + 'T16:00', 'Tomorrow': addDays(TODAY + 'T10:00', 1), 'Monday': nextMonday() }[label];
    if (!at) { var p = window.GUC_pick || ''; at = p ? p + 'T10:00' : addDays(TODAY + 'T10:00', 2); }
    t.snooze = at; hist(t, 'Snoozed to ' + dayWord(at) + ', ' + clock(at));
    save(); render();
    toast('Snoozed to ' + low(dayWord(at)) + ', ' + clock(at) + '.', function () { restore(t, snap); });
  }
  function nextMonday() { var t = new Date(TODAY + 'T12:00'); do { t.setDate(t.getDate() + 1); } while (t.getDay() !== 1); return dayStr(t) + 'T10:00'; }
  function reassign(t, to) {
    var snap = snapshot(t), from = t.owner;
    t.owner = to; t.pick = 'Reassigned by ' + me().name; if (t.checked_by === from) t.checked_by = defaultChecker(to);
    hist(t, 'Reassigned from ' + P[from].name + ' to ' + P[to].name);
    note(to, me().name + ' gave you "' + t.title + '".');
    save(); render();
    toast('Reassigned to ' + P[to].name + '.', function () { restore(t, snap); });
  }
  function remind(t) {
    note(t.owner, me().name + ' reminded you: "' + t.title + '", ' + low(dueText(t)) + '.');
    hist(t, 'Reminder sent to ' + P[t.owner].name); save(); render();
    toast('Reminder sent to ' + first(t.owner) + '.');
  }
  function bumpStreak() { var s = d.querySelector('.streak'); if (s) { s.classList.remove('is-bump'); void s.offsetWidth; s.classList.add('is-bump'); } }

  /* ---------------- menu (BRIEF order; per role) ---------------- */
  var MENU = [
    ['today', "Today's tasks", 'checklist', 'all'], ['inbox', 'Inbox', 'inbox', 'FHM'], ['leads', 'Leads', 'layout-kanban', 'FHM'],
    ['brands', 'Brands & projects', 'briefcase', 'FHMN'], ['threads', 'Team threads', 'messages', 'all'], ['tasks', 'Tasks', 'list-check', 'all'],
    ['media', 'Influencers & media', 'users', 'FHMN'], ['gifting', 'Gifting & dispatch', 'gift', 'FHMN'], ['approvals', 'Approvals', 'square-check', 'FHMN'],
    ['money', 'Money', 'currency-rupee', 'FHN'], ['dash', 'Dashboards', 'layout-dashboard', 'all'], ['brief', 'Morning brief', 'sparkles', 'all'],
    ['ask', 'Ask GUC', 'message-circle', 'all'], ['people', 'People', 'user', 'all'], ['settings', 'Settings', 'settings', 'F']
  ];
  var RC = { 'Founder': 'F', 'Department head': 'H', 'Team member': 'M', 'Finance': 'N', 'Intern': 'I' };
  var menuFor = function () { var c = RC[me().role]; return MENU.filter(function (m) { return m[3] === 'all' || m[3].indexOf(c) >= 0; }); };
  var moreOpen = false;

  /* ---------------- sign-in ---------------- */
  function signIn() {
    return '<main class="login"><section class="card login-card">' +
      '<div class="brand"><span class="brand-mark">GUC</span><span class="brand-name">Glad U Came</span></div>' +
      '<h1 class="h-page">Sign in to the cockpit</h1>' +
      '<p class="lede">This is a <b>sample</b>. Every person, brand, lead and number inside was created by ZippyScale to show how the cockpit works. None of it is Glad U Came\'s own data.</p>' +
      '<form class="login-form" data-form="login">' +
      '<div class="f"><label for="lu">Username <em>*</em></label><input class="input" id="lu" autocomplete="username" required></div>' +
      '<div class="f"><label for="lp">Password <em>*</em></label><input class="input" id="lp" type="password" autocomplete="current-password" required></div>' +
      '<p class="f-err" id="lerr" role="alert"></p>' +
      '<button class="btn btn--next" type="submit">' + ico('arrow-right') + 'Sign in</button></form>' +
      '<p class="faint login-roles">Five demo logins, one per role: Founder, Department head, Team member, Finance, Intern.</p>' +
      '</section></main>';
  }
  async function tryLogin(u, p) {
    var acc = (window.GUC_LOGINS || {})[u.trim().toLowerCase()];
    if (acc && window.crypto && crypto.subtle) {
      var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
      var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      if (hex === acc.h) { sessionStorage.setItem('guc.me', acc.id); ME = acc.id; location.hash = '#/today'; render(); return; }
    }
    var e = d.getElementById('lerr'); if (e) e.textContent = 'Wrong username or password.';
  }

  /* ---------------- shell ---------------- */
  function shell(route, body) {
    var items = menuFor(), top = items.slice(0, 5), rest = items.slice(5);
    var navA = function (m) {
      var cnt = m[0] === 'today' ? todayCount() : 0;
      return '<a class="nav-a" href="#/' + m[0] + '"' + (route === m[0] ? ' aria-current="page"' : '') + '>' + ico(m[2]) + esc(m[1]) +
        (cnt ? '<span class="count' + (overdueMine() ? ' count--hot' : '') + '">' + cnt + '</span>' : '') + '</a>';
    };
    var restHasRoute = rest.some(function (m) { return m[0] === route; });
    var unread = D.notes.filter(function (n) { return n.to === ME && n.unread; }).length;
    return '<div class="app">' +
      '<aside class="side" aria-label="Main menu"><div class="brand"><span class="brand-mark">GUC</span><span class="brand-name">Glad U Came</span></div>' +
      '<nav class="nav">' + top.map(navA).join('') +
      (rest.length ? '<button class="nav-a nav-more" type="button" data-do="more" aria-expanded="' + (moreOpen || restHasRoute) + '">' + ico('dots-vertical') + 'More</button>' +
        '<div class="nav more-list"' + (moreOpen || restHasRoute ? '' : ' hidden') + '>' + rest.map(navA).join('') + '</div>' : '') +
      '</nav><div class="side-foot">' + avatar(ME, true) + '<div><b>' + esc(me().name) + '</b><span>' + esc(me().role) + (me().role === 'Department head' ? ', ' + esc(me().dept) : '') + '</span></div>' +
      '<button class="btn btn--icon btn--ghost btn--sm" type="button" data-do="resetdemo" aria-label="Reset sample data" title="Reset sample data">' + ico('refresh') + '</button>' +
      '<button class="btn btn--icon btn--ghost btn--sm" type="button" data-do="signout" aria-label="Sign out">' + ico('logout') + '</button></div></aside>' +
      '<div class="body"><header class="top">' +
      '<label class="search"><span class="sr-only">Search the cockpit</span>' + ico('search') + '<input class="input" data-search-all placeholder="Search tasks, brands, leads, people"></label>' +
      '<span class="spacer"></span><span class="chip">Sample data</span>' +
      '<button class="btn btn--solid" type="button" data-do="newtask">' + ico('plus') + 'New task</button>' +
      '<button class="btn btn--icon btn--ghost bell" type="button" aria-label="Bell, ' + unread + ' new" data-do="bell">' + ico('bell') + (unread ? '<span class="count count--hot">' + unread + '</span>' : '') + '</button>' +
      '<button class="btn btn--icon btn--ghost" type="button" aria-label="Switch light or dark" data-theme-toggle>' + ico('moon') + '</button>' +
      '</header><main class="main" id="main">' + body + '</main></div>' +
      '<nav class="bottom-bar" aria-label="Menu">' + items.slice(0, 4).map(navA).join('') + '<button class="nav-a" type="button" data-do="more-sm">' + ico('dots-vertical') + 'More</button></nav>' +
      '</div>';
  }
  var todayCount = function () { return D.tasks.filter(function (t) { return t.owner === ME && OPEN[t.status] && !isSnoozed(t) && t.due.slice(0, 10) <= TODAY; }).length + D.tasks.filter(function (t) { return t.status === 'check' && t.checked_by === ME; }).length; };
  var overdueMine = function () { return D.tasks.some(function (t) { return t.owner === ME && isOverdue(t) && !isSnoozed(t); }); };

  /* ---------------- Today's tasks ---------------- */
  var TF = { q: '', show: 'due', from: '', whose: '', date: '', from_d: '', to_d: '' };
  function linkKind(t) { return !t.link ? 'My own' : t.link.charAt(0) === 'P' ? 'Projects' : 'Leads'; }
  function taskRow(t, o) {
    o = o || {};
    var cls = 'task' + (isOverdue(t) ? ' is-overdue' : '') + (t.status === 'blocked' ? ' is-blocked' : '') + (t.status === 'done' ? ' is-done' : '');
    var lk = linkOf(t), meta = [];
    if (o.who) meta.push('<span class="who">' + avatar(t.owner) + '<b>' + esc(P[t.owner].name) + '</b></span>');
    if (lk) meta.push('<span class="chip' + (t.link.charAt(0) === 'P' ? ' chip--mint' : '') + '">' + ico(lk.icon) + esc(lk.text) + '</span>');
    if (t.priority === 'Urgent' || t.priority === 'High') meta.push('<span class="chip' + (t.priority === 'Urgent' ? ' chip--red' : '') + '">' + t.priority + '</span>');
    meta.push('<span class="task-due">' + (t.status === 'done' ? 'Done ' + clock(t.done_at || now()) : t.status === 'check' ? 'Done, Waiting for check' : dueText(t)) + '</span>');
    if (isSnoozed(t)) meta.push('<span class="chip chip--amber">' + ico('clock-pause') + 'Snoozed to ' + dayWord(t.snooze) + ', ' + clock(t.snooze) + '</span>');
    meta.push('<span class="checker">Checked by ' + esc(P[t.checked_by].name) + '</span>');
    if (t.pick) meta.push('<span class="chip chip--blue" data-pick>' + ico('sparkles') + esc(t.pick) + '</span>');
    if (t.status === 'blocked') meta.push('<span class="blocked-note">Blocked: ' + esc(t.blocked) + '</span>');
    if (t.sent_back && OPEN[t.status]) meta.push('<span class="chip chip--amber">' + ico('arrow-back-up') + 'Sent back: ' + esc(t.sent_back) + '</span>');
    var acts = '';
    if (t.status === 'check' && (t.checked_by === ME || me().role === 'Founder')) {
      acts = '<button class="btn btn--sm' + (o.next ? ' btn--next' : '') + '" type="button" data-do="approve">' + ico('check') + 'Approve</button>' +
             '<button class="btn btn--sm" type="button" data-do="sendback">' + ico('arrow-back-up') + 'Send back</button>';
    } else if (OPEN[t.status] && t.owner !== ME) {
      /* someone else's task: Done, Blocked and Snooze are the owner's (F1). The head or Founder reminds or reassigns. */
      acts = '<button class="btn btn--sm" type="button" data-do="remind">' + ico('bell') + 'Remind</button>' +
             '<button class="btn btn--sm btn--ghost" type="button" data-do="reassign">' + ico('users') + 'Reassign</button>';
    } else if (OPEN[t.status]) {
      acts = '<button class="btn btn--sm' + (o.next ? ' btn--next' : '') + '" type="button" data-do="done">' + ico('check') + 'Done</button>' +
             (t.status === 'blocked' ? '' : '<button class="btn btn--sm" type="button" data-do="blocked">' + ico('hand-stop') + 'Blocked</button>') +
             '<button class="btn btn--sm btn--ghost" type="button" data-do="snooze">' + ico('clock-pause') + 'Snooze</button>';
    }
    var check = OPEN[t.status] && t.owner === ME ? '<button class="task-check" type="button" data-do="done" aria-pressed="false" aria-label="Mark Done">' + ico('check') + '</button>'
      : '<span class="task-check" aria-hidden="true">' + ico('check') + '</span>';
    return '<div class="' + cls + '" data-id="' + t.id + '">' + check +
      '<div class="task-body"><button class="task-title" type="button" data-do="open">' + esc(t.title) + '</button><div class="task-meta">' + meta.join('') + '</div></div>' +
      '<div class="task-acts">' + acts + '</div></div>';
  }
  function passes(t) {
    if (TF.q && (t.title + ' ' + P[t.owner].name + ' ' + ((linkOf(t) || {}).text || '')).toLowerCase().indexOf(TF.q.toLowerCase()) < 0) return false;
    if (TF.from && linkKind(t) !== TF.from && !(TF.from === 'Assigned to me by someone' && t.assigned_by !== t.owner)) return false;
    if (TF.whose === 'mine' && t.owner !== ME) return false;
    if (TF.whose === 'team' && t.owner === ME) return false;
    if (TF.whose && TF.whose !== 'mine' && TF.whose !== 'team' && t.owner !== TF.whose) return false;
    if (TF.date) {
      var day = t.due.slice(0, 10), n = daysBetween(TODAY, day);
      if (TF.date === 'today' && n !== 0) return false;
      if (TF.date === 'week' && (n < -6 || n > 6)) return false;
      if (TF.date === 'month' && day.slice(0, 7) !== TODAY.slice(0, 7)) return false;
      if (TF.date === '30' && (n < -30 || n > 0)) return false;
      if (TF.date === 'custom' && ((TF.from_d && day < TF.from_d) || (TF.to_d && day > TF.to_d))) return false;
    }
    var s = TF.show;
    if (s === 'due') return (OPEN[t.status] && !isSnoozed(t) && daysBetween(TODAY, t.due.slice(0, 10)) <= 6) || t.status === 'check';
    if (s === 'week') return (OPEN[t.status] && daysBetween(TODAY, t.due.slice(0, 10)) <= 6) || t.status === 'check';
    if (s === 'blocked') return t.status === 'blocked';
    if (s === 'snoozed') return isSnoozed(t);
    if (s === 'check') return t.status === 'check';
    if (s === 'done') return t.status === 'done';
    return true;
  }
  function sel(name, label, opts, cur) {
    return '<select class="select" data-tf="' + name + '" aria-label="' + esc(label) + '">' + opts.map(function (o) {
      var v = typeof o === 'string' ? o : o[0], l = typeof o === 'string' ? o : o[1];
      return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
  }
  function dateFilter(F) {
    return '<span class="datef">' + sel('date', 'Date filter', [['', 'Date filter: Any date'], ['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['30', 'Last 30 days'], ['custom', 'Custom dates']], F.date) +
      '<span class="datef-custom"' + (F.date === 'custom' ? '' : ' hidden') + '><input class="input" type="date" data-tf="from_d" value="' + F.from_d + '" aria-label="From"><span class="faint">to</span>' +
      '<input class="input" type="date" data-tf="to_d" value="' + F.to_d + '" aria-label="To"></span></span>';
  }
  function todayFilters() {
    var u = me(), whose = '';
    if (u.role === 'Department head' || u.role === 'Founder') {
      var ppl = u.role === 'Founder' ? ORDER.filter(function (x) { return x !== ME; }) : teamOf(ME);
      whose = sel('whose', 'Whose tasks', [['', u.role === 'Founder' ? 'Whose: everyone' : 'Whose: mine and my team'], ['mine', 'Mine'], ['team', u.role === 'Founder' ? 'Everyone else' : 'My team']].concat(ppl.map(function (x) { return [x, P[x].name]; })), TF.whose);
    }
    return '<div class="filters">' +
      '<label class="search"><span class="sr-only">Search tasks</span>' + ico('search') + '<input class="input" data-tf="q" value="' + esc(TF.q) + '" placeholder="Search tasks, brands, people"></label>' + whose +
      sel('show', 'Show', [['due', 'Show: due today and overdue'], ['week', 'This week'], ['blocked', 'Blocked'], ['snoozed', 'Snoozed'], ['check', 'Waiting for check'], ['done', 'Done today']], TF.show) +
      sel('from', 'From', [['', 'From: anywhere'], 'Leads', 'Projects', 'My own', 'Assigned to me by someone'], TF.from) +
      sel('any', 'Pick any field', [['', '+ Any field'], 'Priority', 'Checked by', 'Linked to'], '') + dateFilter(TF) + '</div>';
  }
  function groupRows(list, o) {
    var html = '', firstNext = true;
    var groups = [['Overdue', function (t) { return isOverdue(t); }], ['Today', function (t) { return !isOverdue(t) && OPEN[t.status] && t.due.slice(0, 10) === TODAY; }],
      ['This week', function (t) { return OPEN[t.status] && !isOverdue(t) && t.due.slice(0, 10) > TODAY; }],
      ['Sent for check', function (t) { return t.status === 'check'; }], ['Done today', function (t) { return t.status === 'done'; }]];
    groups.forEach(function (g) {
      var rows = list.filter(g[1]).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
      if (!rows.length) return;
      html += '<div class="task-group"><div class="label">' + g[0] + '</div>' + rows.map(function (t) {
        var next = firstNext && OPEN[t.status]; if (next) firstNext = false; return taskRow(t, { who: o.who, next: next }); }).join('') + '</div>';
    });
    return html;
  }
  function viewToday() {
    var u = me(), all = visible(), mine = all.filter(function (t) { return t.owner === ME; });
    var mineOpen = mine.filter(function (t) { return OPEN[t.status] && !isSnoozed(t) && t.due.slice(0, 10) <= TODAY; });
    var overdue = mineOpen.filter(isOverdue).length, doneToday = mine.filter(function (t) { return (t.status === 'done' || t.status === 'check') && (t.done_at || '').slice(0, 10) === TODAY; }).length;
    var total = mineOpen.length + doneToday, pct = total ? Math.round(doneToday / total * 100) : 0;
    var toCheck = D.tasks.filter(function (t) { return t.status === 'check' && t.checked_by === ME && passes(t); });
    var hour = new Date().getHours(), hi = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    var lede = hi + ', ' + esc(first(ME)) + '. <b>' + mineOpen.length + ' task' + (mineOpen.length === 1 ? '' : 's') + ' today' + (overdue ? ', ' + overdue + ' overdue' : '') + '.</b> ' +
      (toCheck.length ? toCheck.length + ' waiting for your check. ' : '') + (overdue ? 'Start with the red ones.' : mineOpen.length ? 'You are on track.' : 'All clear.');
    var goals = u.targets.map(function (g) { var p = Math.round(g[1] / g[2] * 100);
      return '<div class="target"><div class="ring" style="--p:' + p + '"><span>' + (g[3].charAt(0) === '%' ? g[1] + '%' : g[1] + '/' + g[2]) + '</span></div><div class="target-txt"><b>' + esc(g[0]) + '</b><span>' + esc(g[3].replace('% ', '')) + '</span></div></div>'; }).join('');
    var head = '<div class="today-head" style="padding:var(--s-4)"><div class="today-sum"><h1 class="h-page">Today\'s tasks</h1><p class="lede">' + lede + '</p>' +
      '<div class="day-progress"><div class="bar"><i data-day-bar style="--p:' + pct + '"></i></div><span data-day-txt>' + doneToday + ' of ' + total + ' done today</span></div></div>' +
      '<div class="today-goals">' + goals + '<span class="burst"><span class="streak" title="Days in a row with every task closed">' + ico('flame') + u.streak + ' day streak</span>' +
      [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<i style="--a:' + a + 'deg"></i>'; }).join('') + '</span></div></div>';
    var body = '';
    if (toCheck.length) body += '<div class="task-group" data-group="check"><div class="label">Waiting for check by you (' + toCheck.length + ')</div>' +
      toCheck.map(function (t, i) { return taskRow(t, { who: true, next: i === 0 }); }).join('') + '</div>';
    var list = all.filter(function (t) { return passes(t) && !(t.status === 'check' && t.checked_by === ME && t.owner !== ME); });
    if (u.role === 'Founder' && TF.whose !== 'mine') {
      /* F4: everyone at a glance before the long list; a click jumps to that person's group */
      body += '<div class="people-strip" data-strip>' + ORDER.map(function (pid) {
        var th = D.tasks.filter(function (t) { return t.owner === pid; }), o = th.filter(function (t) { return OPEN[t.status]; }).length, ov = th.filter(isOverdue).length, ck = th.filter(function (t) { return t.status === 'check'; }).length;
        return '<button class="ps' + (ov ? ' is-over' : '') + '" type="button" data-do="jump" data-v="' + pid + '">' + avatar(pid) + '<b>' + esc(P[pid].name) + '</b>' +
          '<span><span data-c="open">' + o + ' open</span> . <span data-c="overdue"' + (ov ? ' class="t-red"' : '') + '>' + ov + ' overdue</span> . <span data-c="check">' + ck + ' to check</span></span></button>'; }).join('') + '</div>';
      ORDER.forEach(function (pid) {
        var rows = list.filter(function (t) { return t.owner === pid; });
        var theirs = D.tasks.filter(function (t) { return t.owner === pid; });
        if (!rows.length) return;
        var c = { open: theirs.filter(function (t) { return OPEN[t.status]; }).length, over: theirs.filter(isOverdue).length, chk: theirs.filter(function (t) { return t.status === 'check'; }).length };
        body += '<div class="task-group person-group" data-person="' + pid + '"><div class="person-head">' + avatar(pid, true) + '<div><b>' + esc(P[pid].name) + '</b><span>' + esc(P[pid].role + ', ' + P[pid].dept) + (P[pid].leave ? ', on leave today' : '') + '</span></div>' +
          '<span class="counts"><span class="chip" data-c="open">' + c.open + ' open</span><span class="chip' + (c.over ? ' chip--red' : '') + '" data-c="overdue">' + c.over + ' overdue</span>' +
          '<span class="chip' + (c.chk ? ' chip--blue' : '') + '" data-c="check">' + c.chk + ' waiting for check</span></span></div>' +
          rows.sort(function (a, b) { return (isOverdue(b) - isOverdue(a)) || (a.due < b.due ? -1 : 1); }).map(function (t) { return taskRow(t, { who: true }); }).join('') + '</div>';
      });
    } else {
      body += groupRows(list, { who: u.role === 'Department head' || u.role === 'Founder' });
    }
    if (!body) body = '<div class="card empty"><span class="empty-art">' + ico('mood-smile') + '</span><h2 class="h-sec">All clear for today</h2>' +
      '<p>Nothing due on this filter. Your streak is ' + u.streak + ' days.</p><button class="btn btn--next" type="button" data-do="reset-today">' + ico('arrow-right') + 'Show this week</button></div>';
    return '<section class="card card--flush" data-today>' + head + '<div style="padding:0 var(--s-4) var(--s-3)">' + todayFilters() + '</div>' + body + '</section>';
  }

  /* ---------------- Tasks (boards) ---------------- */
  var KF = { q: '', board: 'person', owner: '', dept: '', status: '', priority: '', date: '', from_d: '', to_d: '' };
  var STATUS = { todo: 'To do', blocked: 'Blocked', check: 'Waiting for check', done: 'Done' };
  function kpass(t) {
    if (KF.q && (t.title + ' ' + P[t.owner].name).toLowerCase().indexOf(KF.q.toLowerCase()) < 0) return false;
    if (KF.owner === 'me' && t.owner !== ME) return false;
    if (KF.owner === 'team' && P[t.owner].head !== ME) return false;
    if (KF.owner && KF.owner !== 'me' && KF.owner !== 'team' && t.owner !== KF.owner) return false;
    if (KF.dept && P[t.owner].dept !== KF.dept) return false;
    if (KF.status && STATUS[t.status] !== KF.status) return false;
    if (KF.priority && t.priority !== KF.priority) return false;
    if (KF.date) { var save_ = TF; TF = { show: 'all', date: KF.date, from_d: KF.from_d, to_d: KF.to_d }; var ok = passes(t); TF = save_; if (!ok) return false; }
    return true;
  }
  function bcard(t) {
    var lk = linkOf(t);
    return '<article class="bcard' + (t.status === 'blocked' ? ' is-dup' : '') + '" tabindex="0" data-id="' + t.id + '" data-do="open"><span class="bcard-title">' + esc(t.title) + '</span>' +
      '<span class="bcard-row">' + avatar(t.owner) + esc(P[t.owner].name) + '</span>' +
      (lk ? '<span class="bcard-row">' + esc(lk.text) + '</span>' : '') +
      '<span class="bcard-row"><span class="' + (isOverdue(t) ? 'chip chip--red' : 'chip') + '">' + (OPEN[t.status] ? dueText(t) : STATUS[t.status]) + '</span>' +
      (t.status === 'blocked' ? '<span class="chip chip--amber">Blocked</span>' : t.status === 'check' ? '<span class="chip chip--blue">Waiting for check</span>' : '') + '</span>' +
      '<span class="bcard-row">Checked by ' + esc(P[t.checked_by].name) + '</span>' + (t.pick ? '<span class="bcard-row">' + esc(t.pick) + '</span>' : '') + '</article>';
  }
  function viewTasks() {
    var list = visible().filter(kpass), cols = [];
    if (KF.board === 'person') {
      ORDER.forEach(function (pid) { var r = list.filter(function (t) { return t.owner === pid; }); if (r.length) cols.push([P[pid].name, r, r.filter(isOverdue).length + ' overdue']); });
    } else if (KF.board === 'deadline') {
      var b = function (t) { if (!OPEN[t.status]) return 'Done or checking'; if (isOverdue(t)) return 'Overdue'; var n = daysBetween(TODAY, t.due.slice(0, 10)); return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n <= 6 ? 'This week' : 'Later'; };
      ['Overdue', 'Today', 'Tomorrow', 'This week', 'Later', 'Done or checking'].forEach(function (k) { var r = list.filter(function (t) { return b(t) === k; }); if (r.length) cols.push([k, r, '']); });
    } else {
      D.projects.forEach(function (p) { var r = list.filter(function (t) { return t.link === p.id; }); if (r.length) cols.push([p.brand, r, p.name]); });
      var leadT = list.filter(function (t) { return t.link && t.link.charAt(0) === 'L'; }); if (leadT.length) cols.push(['Leads', leadT, 'tasks on leads']);
      var own = list.filter(function (t) { return !t.link; }); if (own.length) cols.push(['Personal', own, 'not linked']);
    }
    var owners = [['', 'Owner: anyone'], ['me', 'Me']].concat(me().role === 'Department head' ? [['team', 'My team']] : []).concat(
      ORDER.filter(function (x) { return visible().some(function (t) { return t.owner === x; }); }).map(function (x) { return [x, P[x].name]; }));
    var F = '<div class="filters"><label class="search"><span class="sr-only">Search tasks</span>' + ico('search') + '<input class="input" data-kf="q" value="' + esc(KF.q) + '" placeholder="Search tasks or people"></label>' +
      sel('board', 'Board', [['person', 'Board: by person'], ['deadline', 'By deadline'], ['project', 'By project']], KF.board).replace(/data-tf=/g, 'data-kf=') +
      sel('owner', 'Owner', owners, KF.owner).replace(/data-tf=/g, 'data-kf=') +
      sel('dept', 'Department', [['', 'Department: all']].concat(DEPTS), KF.dept).replace(/data-tf=/g, 'data-kf=') +
      sel('status', 'Status', [['', 'Status: any'], 'To do', 'Blocked', 'Waiting for check', 'Done'], KF.status).replace(/data-tf=/g, 'data-kf=') +
      sel('priority', 'Priority', [['', 'Priority: any'], 'Urgent', 'High', 'Normal', 'Low'], KF.priority).replace(/data-tf=/g, 'data-kf=') +
      sel('any', 'Pick any field', [['', '+ Any field'], 'Checked by', 'Linked to', 'Assigned by'], '').replace(/data-tf=/g, 'data-kf=') +
      dateFilter(KF).replace(/data-tf=/g, 'data-kf=') + '</div>';
    var board = cols.length ? '<div class="board">' + cols.map(function (c) {
      return '<section class="col"><div class="col-head"><h3 class="h-sec">' + esc(c[0]) + '</h3><span class="count">' + c[1].length + '</span></div>' +
        (c[2] ? '<div class="col-sum">' + esc(c[2]) + '</div>' : '') + c[1].map(bcard).join('') + '</section>'; }).join('') + '</div>'
      : '<div class="card empty"><span class="empty-art">' + ico('list-check') + '</span><h2 class="h-sec">No tasks on this filter</h2><p>Clear a filter to see more.</p><button class="btn btn--next" type="button" data-do="reset-tasks">Clear filters</button></div>';
    return '<section class="card" style="display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Tasks</h1><span class="chip">' + list.length + ' tasks</span>' +
      '<button class="btn btn--next" type="button" data-do="newtask">' + ico('plus') + 'New task</button></div>' + F + board + '</section>';
  }

  /* ---------------- New task dialog ---------------- */
  function taskDialog() {
    var people = assignable(), teams = assignableTeams();
    var heads = ORDER.filter(function (x) { return P[x].role === 'Department head' || P[x].role === 'Founder'; });
    var links = D.projects.map(function (p) { return [p.id, p.brand + ' . ' + p.name]; }).concat(D.leads.map(function (l) { return [l.id, 'Lead . ' + l.brand]; }));
    return '<dialog class="dialog" id="dlg-task" aria-label="New task"><form method="dialog" data-form="task">' +
      '<div class="dialog-head"><h2 class="h-page">New task</h2>' + micBtn() + '<button class="btn btn--icon btn--ghost" type="button" aria-label="Close" data-do="close">' + ico('x') + '</button></div>' +
      '<div class="dialog-body"><div class="speak-strip">' + ico('microphone', 'i--sm') + '<span>Try: <q>Ask Tanvi to send the Kora shortlist by Wednesday, high priority</q></span></div>' +
      '<div class="f"><label for="nt-title">What needs doing <em>*</em></label><input class="input" id="nt-title" name="title" placeholder="e.g. Send the shortlist to the brand"></div>' +
      '<div class="f-row"><div class="f"><label for="nt-owner">Assign to <em>*</em></label><select class="select" id="nt-owner" name="owner"><option value="">Pick a person or a team</option>' +
      (teams.length ? '<optgroup label="A whole team (the Task chaser picks one person)">' + teams.map(function (t) { return '<option value="team:' + esc(t) + '">' + esc(t) + ' team</option>'; }).join('') + '</optgroup>' : '') +
      '<optgroup label="One person">' + people.map(function (x) { return '<option value="' + x + '">' + esc(P[x].name) + (x === ME ? ' (me)' : '') + (P[x].leave ? ', on leave' : '') + '</option>'; }).join('') + '</optgroup></select></div>' +
      '<div class="f"><label for="nt-due">Deadline <em>*</em></label><input class="input" id="nt-due" name="due" type="datetime-local"></div></div>' +
      '<div class="f-row"><div class="f"><label for="nt-pri">Priority</label><select class="select" id="nt-pri" name="priority"><option>Normal</option><option>Urgent</option><option>High</option><option>Low</option></select></div>' +
      '<div class="f"><label for="nt-chk">Checked by <em>*</em></label><select class="select" id="nt-chk" name="checked_by"><option value="">The owner\'s department head</option>' +
      heads.map(function (x) { return '<option value="' + x + '">' + esc(P[x].name) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="f"><label for="nt-link">Link to lead or project</label><select class="select" id="nt-link" name="link"><option value="">Not linked (a personal task)</option>' +
      links.map(function (l) { return '<option value="' + l[0] + '">' + esc(l[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="nt-list">Checklist</label><textarea class="textarea input" id="nt-list" name="checklist" rows="3" placeholder="One line per step"></textarea></div>' +
      '<p class="f-err" id="nt-err" role="alert"></p>' +
      '<p class="f-help" id="nt-help">It shows on the owner\'s Today\'s tasks at once. The bot reminds them, then their department head, then Maddie.</p></div>' +
      '<div class="dialog-foot"><span class="mic-hint">Speak fills the fields. You check, then save.</span><button class="btn btn--ghost" type="button" data-do="close">Cancel</button>' +
      '<button class="btn btn--next" type="submit">' + ico('check') + 'Save task</button></div></form></dialog>';
  }
  function micBtn() {
    return '<button class="mic" type="button" data-mic aria-pressed="false"><span class="mic-dot">' + ico('microphone') + '</span><span class="mic-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span data-mic-label>Speak</span></button>';
  }
  function openNewTask(pre) {
    var old = d.getElementById('dlg-task'); if (old) old.remove();
    d.body.insertAdjacentHTML('beforeend', taskDialog());
    var dl = d.getElementById('dlg-task');
    dl.querySelector('#nt-due').value = TODAY + 'T18:00';
    if (pre) Object.keys(pre).forEach(function (k) { var el = dl.querySelector('[name="' + k + '"]'); if (el) el.value = pre[k]; });
    dl.showModal(); dl.querySelector('#nt-title').focus();
  }
  function saveTask(form) {
    var v = function (n) { return form.querySelector('[name="' + n + '"]').value.trim(); };
    var err = form.querySelector('#nt-err'), miss = [];
    if (!v('title')) miss.push('What needs doing'); if (!v('owner')) miss.push('Assign to'); if (!v('due')) miss.push('Deadline');
    if (miss.length) { err.textContent = 'Please fill: ' + miss.join(', ') + '.'; return false; }
    var owner = v('owner'), team = '', pick = '';
    if (owner.indexOf('team:') === 0) { team = owner.slice(5); var pk = pickFor(team); owner = pk.who; pick = pk.reason; }
    if (assignable().indexOf(owner) < 0 && !team) { err.textContent = 'You can assign only to ' + (me().role === 'Department head' ? 'your team.' : 'yourself.'); return false; }
    var t = { id: 'T-' + pad(++D.seq), title: v('title'), owner: owner, checked_by: v('checked_by') || defaultChecker(owner), due: v('due'), priority: v('priority') || 'Normal',
      link: v('link'), status: 'todo', blocked: '', team: team, pick: pick, assigned_by: ME,
      checklist: v('checklist').split('\n').filter(Boolean).map(function (c) { return { t: c.trim(), done: false }; }), history: [] };
    hist(t, (team ? 'Given to the ' + team + ' team. ' + pick + '. ' : '') + 'Assigned to ' + P[owner].name + ', Checked by ' + P[t.checked_by].name);
    D.tasks.push(t);
    var fm = window.GUC_fromMsg; window.GUC_fromMsg = null;   /* R-22: a thread message turned into a task links both ways */
    if (fm && other._linkMsg) other._linkMsg(fm, t, API);
    note(owner, me().name + ' assigned you a task: ' + t.title);
    if (P[owner].head && P[owner].head !== ME) note(P[owner].head, me().name + ' assigned ' + P[owner].name + ': ' + t.title);
    save(); render();
    toast(team ? pick.split('.')[0] + '. On ' + first(owner) + "'s Today's tasks now." : 'Task given to ' + P[owner].name + ". It is on their Today's tasks now.",
      function () { D.tasks = D.tasks.filter(function (x) { return x !== t; }); save(); render(); });
    return true;
  }

  /* ---------------- Speak: real speech where the browser has it; the sentence fills the fields ---------------- */
  var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  function parseSpeech(text, dl) {
    var s = ' ' + text.toLowerCase().replace(/[.,!?]/g, ' ') + ' ', out = {};
    ORDER.forEach(function (id) { var f = P[id].name.split(' ')[0].toLowerCase(); if (s.indexOf(' ' + f + ' ') >= 0 && !out.owner) out.owner = id; });
    DEPTS.forEach(function (dpt) { if (s.indexOf(' ' + dpt.toLowerCase() + ' team') >= 0) out.owner = 'team:' + dpt; });
    var when = null;
    if (/ today /.test(s)) when = TODAY; if (/ tomorrow /.test(s)) when = addDays(TODAY + 'T00:00', 1).slice(0, 10);
    DAYS.forEach(function (w, i) { if (s.indexOf(' ' + w + ' ') >= 0) { var t = new Date(TODAY + 'T12:00'); do { t.setDate(t.getDate() + 1); } while (t.getDay() !== i); when = dayStr(t); } });
    if (when) out.due = when + 'T18:00';
    ['urgent', 'high', 'low'].forEach(function (p) { if (s.indexOf(' ' + p + ' priority') >= 0 || (p === 'urgent' && / urgent /.test(s))) out.priority = p.charAt(0).toUpperCase() + p.slice(1); });
    D.projects.forEach(function (p) { if (s.indexOf(' ' + p.brand.toLowerCase().split(' ')[0] + ' ') >= 0 && !out.link) out.link = p.id; });
    if (!out.link) D.leads.forEach(function (l) { if (s.indexOf(' ' + l.brand.toLowerCase().split(' ')[0] + ' ') >= 0 && !out.link) out.link = l.id; });
    var m = text.match(/\bto (.+?)(?:\s+by\s+\w+|\s*,|\s+(?:urgent|high|low)\b|$)/i);
    if (m) out.title = m[1].trim().replace(/^\w/, function (c) { return c.toUpperCase(); });
    var n = 0;
    Object.keys(out).forEach(function (k) {
      var el = dl.querySelector('[name="' + k + '"]'); if (!el) return;
      if (el.tagName === 'SELECT' && !Array.prototype.some.call(el.options, function (o) { return o.value === out[k]; })) return;
      el.value = out[k]; el.closest('.f').classList.add('is-filled'); n++;
    });
    return n;
  }
  function speak(btn) {
    var dl = btn.closest('.dialog'), lab = btn.querySelector('[data-mic-label]');
    var live = function (on) { btn.classList.toggle('is-live', on); btn.setAttribute('aria-pressed', on); lab.textContent = on ? 'Listening' : 'Speak'; };
    var sample = (dl.querySelector('.speak-strip q') || {}).textContent || '';
    var finish = function (text, heard) {
      live(false);
      var n = dl.getAttribute('data-parse') && other._parse ? other._parse(dl.getAttribute('data-parse'), text, dl, API) : parseSpeech(text, dl);
      toast((heard ? 'Heard: "' + text + '". ' : 'No microphone here, so the sample sentence was used. ') + 'Filled ' + n + ' field' + (n === 1 ? '' : 's') + '. Check them, then save.');
    };
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || navigator.webdriver) { live(true); setTimeout(function () { finish(sample, false); }, 900); return; }
    var r = new SR(), got = ''; r.lang = 'en-IN'; r.interimResults = false;
    r.onresult = function (e) { got = e.results[0][0].transcript; };
    r.onerror = function (e) { if (e.error === 'not-allowed') toast('The microphone is blocked. Allow it in the address bar and try again.'); };
    r.onend = function () { got ? finish(got, true) : (live(false), toast('Nothing heard. Press Speak and say the task in one sentence.')); };
    live(true); try { r.start(); } catch (e) { finish(sample, false); }
  }

  /* ---------------- task page (dialog) with History ---------------- */
  function openTask(t) {
    var old = d.getElementById('dlg-view'); if (old) old.remove();
    var lk = linkOf(t);
    var html = '<dialog class="dialog" id="dlg-view" aria-label="Task"><div class="dialog-head"><h2 class="h-page">Task ' + t.id.replace('T-', '') + '</h2>' + micBtn() +
      '<button class="btn btn--icon btn--ghost" type="button" aria-label="Close" data-do="close">' + ico('x') + '</button></div><div class="dialog-body">' +
      '<p class="lede"><b>' + esc(t.title) + '</b></p><div class="facts">' +
      [['Owner', P[t.owner].name], ['Checked by', P[t.checked_by].name], ['Deadline', dayWord(t.due) + ', ' + clock(t.due)], ['Priority', t.priority], ['Status', STATUS[t.status] + (t.blocked && t.status === 'blocked' ? ': ' + t.blocked : '')],
        ['Linked to', lk ? lk.text : 'Personal'], ['Assigned by', P[t.assigned_by] ? P[t.assigned_by].name : 'Task chaser']].map(function (f) { return '<div class="fact"><span class="label">' + f[0] + '</span><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>' +
      (t.pick ? '<p class="chip chip--blue">' + ico('sparkles') + esc(t.pick) + '</p>' : '') +
      (t.checklist.length ? '<div><span class="label">Checklist</span>' + t.checklist.map(function (c, i) { return '<label class="check-line"><input type="checkbox" data-cl="' + i + '"' + (c.done ? ' checked' : '') + '> ' + esc(c.t) + '</label>'; }).join('') + '</div>' : '') +
      '<div class="f" data-speak-target><label for="tv-note">Add a note (Speak works here)</label><input class="input" id="tv-note" name="note" placeholder="Anything the team should know"></div>' +
      '<div><span class="label">History</span><div class="list hist">' + t.history.slice().reverse().map(function (h) {
        return '<div class="lrow" style="--cols:110px minmax(0,1fr)"><span class="label">' + dayWord(h.at) + ', ' + clock(h.at) + '</span><span>' + (h.who === 'agent' ? '' : esc((P[h.who] || {}).name || '') + ': ') + esc(h.what) + '</span></div>'; }).join('') + '</div></div>' +
      '</div><div class="dialog-foot"><span class="mic-hint">Speak fills the fields. You check, then save.</span><button class="btn btn--ghost" type="button" data-do="close">Close</button>' +
      '<button class="btn btn--next" type="button" data-do="savenote" data-id="' + t.id + '">' + ico('check') + 'Save note</button></div></dialog>';
    d.body.insertAdjacentHTML('beforeend', html);
    d.getElementById('dlg-view').showModal();
  }

  /* ---------------- bell: two feeds ---------------- */
  var bellTab = 'internal';
  function bellPop() {
    var mine = D.notes.filter(function (n) { return n.to === ME; }).reverse();
    var ext = (D.inbox || []).filter(function (c) { return !c.read; }).map(function (c) { var m = c.msgs[c.msgs.length - 1];
      return { text: CHN[c.ch] + ', ' + c.name + ': ' + m.text.slice(0, 80), at: m.at, unread: true }; }).concat(
      D.leads.filter(function (l) { return l.stage === 'New'; }).slice(-5).reverse().map(function (l) {
      return { text: 'New lead from ' + CHN[l.ch] + ': ' + l.brand + ' (' + l.contact + ')', at: l.created || TODAY + 'T09:10' }; }));
    var rows = bellTab === 'internal' ? mine : ext;
    return '<div class="pop notes" data-temp role="dialog" aria-label="Bell" style="right:12px;top:52px;position:fixed"><div class="notes-head"><h2 class="h-sec">Bell</h2>' +
      '<button class="btn btn--sm btn--ghost" type="button" data-do="bellread">Mark all read</button></div>' +
      '<div class="tabs" role="tablist" style="padding:0 var(--s-3)"><button class="tab" role="tab" type="button" data-do="belltab" data-tab="internal" aria-selected="' + (bellTab === 'internal') + '">Internal</button>' +
      '<button class="tab" role="tab" type="button" data-do="belltab" data-tab="external" aria-selected="' + (bellTab === 'external') + '">External</button></div>' +
      (rows.length ? rows.slice(0, 12).map(function (n) { return '<div class="note' + (n.unread ? ' is-unread' : '') + '"><span class="av">' + ico(bellTab === 'internal' ? 'bell' : 'inbox', 'i--sm') + '</span><div><p>' + esc(n.text) + '</p><time>' + dayWord(n.at) + ', ' + clock(n.at) + '</time></div></div>'; }).join('')
        : '<div class="note"><span class="av">' + ico('mood-smile', 'i--sm') + '</span><div><p>Nothing new. Tasks given to you, checks waiting and Blocked tasks land here.</p></div></div>') +
      (bellTab === 'external' ? '<p class="faint" style="padding:var(--s-2) var(--s-3);font-size:var(--fs-11)">Sample. WhatsApp, Instagram, Gmail, the website form and Meta lead ads connect in the build.</p>' : '') + '</div>';
  }

  /* ---------------- the other screens: real lists on sample data ---------------- */
  var other = window.GUC_SCREENS || {};

  /* ---------------- render ---------------- */
  var PARENT = { lead: 'leads', brand: 'brands', project: 'brands', infl: 'media', jour: 'media', celeb: 'media', hamper: 'gifting' };   /* record routes light up their menu item */
  function route() { var r = (location.hash.match(/^#\/([a-z]+)/) || [])[1] || 'today', m = PARENT[r] || r; return menuFor().some(function (x) { return x[0] === m; }) ? r : 'today'; }
  function render() {
    var root = d.getElementById('root');
    if (!ME || !P[ME]) { root.innerHTML = signIn(); return; }
    var r = route(), body, nav = PARENT[r] || r;
    if (r === 'today') body = viewToday();
    else if (r === 'tasks') body = viewTasks();
    else body = other[r] ? other[r](API) : '';
    var y = window.scrollY, focus = d.activeElement && d.activeElement.getAttribute && (d.activeElement.getAttribute('data-tf') || d.activeElement.getAttribute('data-kf'));
    root.innerHTML = shell(nav, body);
    if (other._after) other._after(r, API);
    if (focus) { var el = d.querySelector('[data-tf="' + focus + '"],[data-kf="' + focus + '"]'); if (el) { el.focus(); if (el.setSelectionRange && el.type === 'text') try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} } }
    window.scrollTo(0, y);
  }
  var API = { D: function () { return D; }, P: P, ORDER: ORDER, me: me, ico: ico, esc: esc, avatar: avatar, teamOf: teamOf, visible: visible, isOverdue: isOverdue,
    OPEN: OPEN, dayWord: dayWord, clock: clock, TODAY: TODAY, save: save, render: render, toast: toast, micBtn: micBtn, openNewTask: openNewTask, sel: sel, dateFilter: dateFilter,
    ME: function () { return ME; }, first: first, now: now, addDays: addDays, daysBetween: daysBetween, note: note, assignable: assignable, CHN: CHN, TPL: TPL, DAYS: DAYS, dayStr: dayStr, speak: function (b) { speak(b); }, low: low, reload: function () { load(); } };
  window.GUC_APP = API;

  /* ---------------- events ---------------- */
  /* Speak is ours on these dialogs: stop the kit's sample filler from also running. */
  window.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-mic]');
    if (!b || !b.closest('.dialog')) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (b.classList.contains('is-live')) return;
    if (b.closest('#dlg-view')) { var inp = b.closest('.dialog').querySelector('#tv-note'); inp.value = 'Spoke to the brand, they confirmed by phone.'; inp.closest('.f').classList.add('is-filled'); toast('No microphone here, so a sample note was used. Check it, then save.'); return; }
    speak(b);
  }, true);

  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-do]'); if (!a) return;
    var act = a.getAttribute('data-do'), row = a.closest('[data-id]'), t = row && byId(row.getAttribute('data-id'));
    if (act === 'done' && t) return markDone(t);
    if (act === 'approve' && t) return approve(t);
    if (act === 'open' && t) return openTask(t);
    if ((act === 'blocked' || act === 'sendback') && t) {
      if (row.querySelector('.reason')) return;
      var isBack = act === 'sendback';
      var quick = isBack ? ['Missing the live link', 'Numbers do not match', 'Brief not followed'] : ['Waiting on brand', 'Waiting for approval', 'Waiting on an influencer'];
      row.insertAdjacentHTML('beforeend', '<div class="reason"><input class="input" placeholder="' + (isBack ? 'Why are you sending it back? (needed)' : 'What is it waiting on? (needed)') + '" aria-label="' + (isBack ? 'Reason for sending back' : 'Reason for Blocked') + '">' +
        '<div class="reason-quick">' + quick.map(function (q) { return '<button type="button" data-do="quick">' + q + '</button>'; }).join('') + '</div>' +
        '<button class="btn btn--sm btn--solid" type="button" data-do="' + (isBack ? 'backsave' : 'blocksave') + '">' + (isBack ? 'Send back' : 'Mark Blocked') + '</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-do="reasoncancel">Cancel</button></div>');
      row.querySelector('.reason .input').focus(); return;
    }
    if (act === 'quick') { a.closest('.reason').querySelector('.input').value = a.textContent; return; }
    if (act === 'reasoncancel') { a.closest('.reason').remove(); return; }
    if ((act === 'blocksave' || act === 'backsave') && t) {
      var inp = a.closest('.reason').querySelector('.input'), why = inp.value.trim();
      if (!why) { inp.setAttribute('aria-invalid', 'true'); inp.placeholder = act === 'blocksave' ? 'A reason is needed for Blocked' : 'A reason is needed to send it back'; inp.focus(); return; }
      return act === 'blocksave' ? block(t, why) : sendBack(t, why);
    }
    if (act === 'snooze' && t) {
      d.querySelectorAll('.pop[data-temp]').forEach(function (p) { p.remove(); });
      var m = d.createElement('div'); m.className = 'pop'; m.setAttribute('data-temp', ''); m.setAttribute('role', 'menu');
      m.innerHTML = [['Later today', '4:00 pm'], ['Tomorrow', '10:00 am'], ['Monday', '10:00 am'], ['Pick a date', '']].map(function (o) {
        return '<button class="menu-i" role="menuitem" type="button" data-do="snoozeto" data-v="' + o[0] + '">' + ico('clock-pause') + o[0] + '<span class="faint">' + o[1] + '</span></button>'; }).join('') +
        '<input class="input" type="date" data-snooze-date aria-label="Pick a date" style="margin:6px;width:calc(100% - 12px)">';
      m.style.right = '12px'; m.style.top = '100%'; row.appendChild(m); return;
    }
    if (act === 'snoozeto' && t) { window.GUC_pick = (a.closest('.pop').querySelector('[data-snooze-date]') || {}).value; if (a.getAttribute('data-v') === 'Pick a date' && !window.GUC_pick) { a.closest('.pop').querySelector('[data-snooze-date]').focus(); return; } return snooze(t, a.getAttribute('data-v')); }
    if (act === 'reassign' && t) {
      d.querySelectorAll('.pop[data-temp]').forEach(function (p) { p.remove(); });
      var dept = t.team || P[t.owner].dept, ppl = ORDER.filter(function (x) { return P[x].dept === dept && x !== t.owner && P[x].role !== 'Founder'; });
      var pm = d.createElement('div'); pm.className = 'pop'; pm.setAttribute('data-temp', ''); pm.setAttribute('role', 'menu');
      pm.innerHTML = ppl.map(function (x) { return '<button class="menu-i" role="menuitem" type="button" data-do="reassignto" data-v="' + x + '">' + avatar(x) + esc(P[x].name) + '<span class="faint">' + (P[x].leave ? 'on leave' : openLoad(x) + ' open') + '</span></button>'; }).join('');
      pm.style.right = '12px'; pm.style.top = '100%'; row.appendChild(pm); return;
    }
    if (act === 'remind' && t) return remind(t);
    if (act === 'jump') { var pid = a.getAttribute('data-v'), go = function () { var g = d.querySelector('[data-person="' + pid + '"]'); if (g) g.scrollIntoView({ block: 'start' }); return g; };
      if (!go()) { TF.whose = pid; TF.show = 'week'; render(); go(); } return; }
    if (act === 'reassignto' && t) return reassign(t, a.getAttribute('data-v'));
    if (act === 'newtask') return openNewTask();
    if (act === 'close') { var dl = a.closest('dialog'); if (dl) dl.close(); return; }
    if (act === 'savenote') {
      var tk = byId(a.getAttribute('data-id')), nv = d.getElementById('tv-note').value.trim();
      if (!nv) { d.getElementById('tv-note').focus(); return; }
      hist(tk, 'Note: ' + nv); save(); a.closest('dialog').close(); toast('Note saved to the task History.'); return;
    }
    if (act === 'more') { moreOpen = !moreOpen; render(); return; }
    if (act === 'more-sm') { moreOpen = true; var side = d.querySelector('.side'); if (side) side.classList.toggle('is-open'); return; }
    if (act === 'signout') { sessionStorage.removeItem('guc.me'); ME = null; location.hash = ''; render(); return; }
    if (act === 'bell') { var open = d.querySelector('.pop.notes'); if (open) { open.remove(); return; } d.body.insertAdjacentHTML('beforeend', bellPop()); return; }
    if (act === 'belltab') { bellTab = a.getAttribute('data-tab'); d.querySelector('.pop.notes').outerHTML = bellPop(); return; }
    if (act === 'bellread') { D.notes.forEach(function (n) { if (n.to === ME) n.unread = false; }); save(); render(); d.body.insertAdjacentHTML('beforeend', bellPop()); return; }
    if (act === 'reset-today') { TF = { q: '', show: 'week', from: '', whose: '', date: '', from_d: '', to_d: '' }; render(); return; }
    if (act === 'reset-tasks') { KF = { q: '', board: KF.board, owner: '', dept: '', status: '', priority: '', date: '', from_d: '', to_d: '' }; render(); return; }
    if (other._act) other._act(act, a, API);
  });
  d.addEventListener('change', function (e) {
    var el = e.target;
    if (el.hasAttribute('data-tf')) { TF[el.getAttribute('data-tf')] = el.value; render(); }
    if (el.hasAttribute('data-kf')) { KF[el.getAttribute('data-kf')] = el.value; render(); }
    if (el.hasAttribute('data-cl')) { var dl = el.closest('dialog'), t = byId(dl.querySelector('[data-id]').getAttribute('data-id')); t.checklist[+el.getAttribute('data-cl')].done = el.checked; hist(t, (el.checked ? 'Ticked: ' : 'Unticked: ') + t.checklist[+el.getAttribute('data-cl')].t); save(); }
    if (el.id === 'nt-owner' && el.value.indexOf('team:') === 0) d.getElementById('nt-help').textContent = 'The Task chaser picks one person in the ' + el.value.slice(5) + ' team (lightest load, nobody on leave) and shows why. Their department head can reassign in one tap.';
  });
  d.addEventListener('input', function (e) {
    var el = e.target;
    if (el.getAttribute('data-tf') === 'q') { TF.q = el.value; render(); }
    if (el.getAttribute('data-kf') === 'q') { KF.q = el.value; render(); }
    if (el.hasAttribute('data-search-all')) { var q = el.value.toLowerCase(); d.querySelectorAll('#main .task, #main .bcard, #main .lrow').forEach(function (r) { r.hidden = q && r.textContent.toLowerCase().indexOf(q) < 0; }); }
    if (el.closest && el.closest('.f.is-filled')) el.closest('.f').classList.remove('is-filled');
  });
  d.addEventListener('submit', function (e) {
    var f = e.target.getAttribute('data-form'); if (!f) return;
    e.preventDefault();
    if (f === 'login') tryLogin(d.getElementById('lu').value, d.getElementById('lp').value);
    if (f === 'task' && saveTask(e.target)) e.target.closest('dialog').close();
  });
  window.addEventListener('hashchange', function () { d.querySelectorAll('dialog[open]').forEach(function (x) { x.close(); }); render(); });
  /* Another tab (another person) changed something: show it now, without a reload. */
  window.addEventListener('storage', function (e) { if (e.key === KEY) { load(); if (!d.querySelector('dialog[open], .reason, .pop[data-temp]')) render(); } });
  setInterval(function () { var nt = dayStr(new Date()); if (nt !== TODAY) location.reload(); }, 60000);

  load();
  ME = sessionStorage.getItem('guc.me');
  render();
})();

/* A NEW BUILD MUST REACH AN OPEN TAB (traps 50). Every minute, and whenever the tab comes back,
   compare this page's build stamp with the live one; if it changed, show "Reload now". */
(function () {
  var s = document.querySelector('script[src*="app.js?b="]'), m = s && s.getAttribute('src').match(/\?b=(\d+)/), mine = m && m[1], shown = false;
  if (!mine || !window.fetch || location.protocol === 'file:') return;
  function check() {
    if (shown) return;
    fetch(location.pathname + '?nv=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (html) {
      var x = html.match(/app\.js\?b=(\d+)/); if (!x || x[1] === mine || shown) return;
      shown = true;
      document.body.insertAdjacentHTML('beforeend', '<div class="notice" role="status" id="newbuild">' + GUC.icon('sparkles') +
        '<span>A new version of the cockpit is ready.</span><button class="btn btn--sm btn--next" type="button" data-reload>' + GUC.icon('refresh') + 'Reload now</button></div>');
    }).catch(function () {});
  }
  setInterval(check, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
  window.GUC_checkVersion = check;
})();
