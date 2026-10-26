/* Glad U Came demo . the screens beyond Today's tasks and Tasks, as real lists on sample data.
   B2 to B5 deepen each one (Inbox to lead, Leads board flows, Won, Approvals, Money, Dashboards, Brief). */
(function () {
  var CH = { whatsapp: ['WhatsApp', 'brand-whatsapp'], instagram: ['Instagram', 'brand-instagram'], gmail: ['Gmail', 'brand-gmail'], web: ['Website form', 'world-www'], meta: ['Meta lead ad', 'brand-meta'] };
  var ch = function (A, k) { return '<span class="ch" data-ch="' + k + '"><span class="ch-ico">' + A.ico(CH[k][1]) + '</span>' + CH[k][0] + '</span>'; };
  var lakh = function (v) { return '₹' + v.toFixed(1) + 'L'; };
  var rupees = function (n) { var s = String(Math.round(n)), last = s.slice(-3), rest = s.slice(0, -3); return '₹' + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last; };
  var role = function (A) { return A.me().role; };
  var masked = '₹ ••••';

  /* one list screen: page head, filter bar (search, dropdowns from the rows, + Any field, Date filter), rows, foot */
  function listScreen(A, title, noun, rows, opts) {
    opts = opts || {};
    var drops = (opts.drops || []).map(function (dd) {
      var vals = []; rows.forEach(function (r) { var v = r.f[dd[0]]; if (v && vals.indexOf(v) < 0) vals.push(v); });
      return '<select class="select" data-lf="' + dd[0] + '" aria-label="' + dd[1] + '"><option value="">' + dd[1] + ': all</option>' + vals.map(function (v) { return '<option>' + A.esc(v) + '</option>'; }).join('') + '</select>';
    }).join('');
    return '<section class="card card--flush" data-list><div style="padding:var(--s-4) var(--s-4) var(--s-3);display:flex;flex-direction:column;gap:var(--s-3)">' +
      '<div class="page-head"><h1 class="h-page">' + A.esc(title) + '</h1>' + (opts.head || '') + '</div>' + (opts.top || '') +
      '<div class="filters"><label class="search"><span class="sr-only">Search ' + noun + '</span>' + A.ico('search') + '<input class="input" data-lq placeholder="Search ' + noun + '"></label>' + drops +
      '<select class="select" aria-label="Pick any field"><option>+ Any field</option>' + (opts.drops || []).map(function (dd) { return '<option>' + dd[1] + '</option>'; }).join('') + '</select>' + A.dateFilter({ date: '', from_d: '', to_d: '' }).replace(/data-tf=/g, 'data-ldate=') + '</div></div>' +
      '<div class="list" style="border-top:1px solid var(--line)">' + (rows.length ? rows.map(function (r) {
        return '<div class="lrow' + (r.cls || '') + '" style="--cols:' + (opts.cols || 'minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) auto') + '"' + Object.keys(r.f).map(function (k) { return ' data-f-' + k + '="' + A.esc(r.f[k]) + '"'; }).join('') + '>' + r.h + '</div>'; }).join('')
        : '<div class="card empty"><span class="empty-art">' + A.ico('mood-smile') + '</span><h2 class="h-sec">Nothing here for you yet</h2><p>' + (opts.empty || 'When something is yours, it shows here.') + '</p></div>') + '</div>' +
      '<div class="list-foot"><span data-lcount>' + rows.length + ' of ' + rows.length + ' ' + noun + '</span><span class="spacer" style="flex:1"></span><span>Sample data</span></div></section>';
  }
  var who = function (A, id, sub) { return '<div class="cell-who">' + A.avatar(id, true) + '<div><b>' + A.esc(A.P[id].name) + '</b><span>' + A.esc(sub) + '</span></div></div>'; };
  var leadsFor = function (A) {
    var u = A.me(), L = A.D().leads;
    if (u.role === 'Founder') return L;
    if (u.role === 'Department head') return L.filter(function (l) { return l.owner === u.id || A.P[l.owner].head === u.id; });
    if (u.role === 'Team member') return L.filter(function (l) { return l.owner === u.id; });
    return [];
  };
  var projectsFor = function (A) {
    var u = A.me(), Pj = A.D().projects;
    if (u.role === 'Founder' || u.role === 'Finance') return Pj;
    return Pj.filter(function (p) { return p.team.indexOf(u.id) >= 0; });
  };

  var INBOX = [
    ['whatsapp', 'Meera Sethi', 'Kora Skincare', 'Can we see 3 more beauty names before Friday?', '2 min', 'kabir', true],
    ['instagram', '@saffronlane.jewels', 'New', 'Hi! Looking for a PR agency for our Bandra store launch', '18 min', '', false],
    ['gmail', 'Kunal Bhatia', 'Kalaghoda Arts Fest', 'Re: Media list for the press preview', '1 h', 'ananya', true],
    ['web', 'Nisha Pillai', 'Urban Paws Mumbai', 'Budget ₹1 to 2 lakh, influencer campaign for a pet cafe', '3 h', 'ishaan', true],
    ['meta', 'Varun Khanna', 'Monsoon Activewear', 'Interested in: Influencer campaign . Mumbai', 'Yesterday', 'riya', true],
    ['whatsapp', 'Sana Mirza', 'Tide & Thyme Cafe', 'Sharing the revised budget by evening', 'Yesterday', 'riya', true],
    ['instagram', '@bandra.bites', 'Kora Skincare', 'Posted! Link in bio, sharing the live link now', '2 days', 'tanvi', true]
  ];
  var INFL = [['@bandra.bites', 'Ishita Kapoor', 'Food', 'Bandra', '212K', '4.8%', 45000, 'Worked with us 3x'], ['@thanekitchen', 'Aarav Joshi', 'Food', 'Thane', '98K', '6.1%', 22000, 'New to us'],
    ['@mumbaimasala.diaries', 'Riya Fernandes', 'Food', 'Andheri', '340K', '3.9%', 60000, 'Shortlisted'], ['@glowwithtara', 'Tara Sen', 'Beauty', 'Juhu', '410K', '3.2%', 75000, 'Worked with us 1x'],
    ['@runbombay', 'Kunal Shah', 'Fitness', 'Powai', '156K', '5.4%', 35000, 'New to us'], ['@pawsofmumbai', 'Diya Rao', 'Pets', 'Khar', '88K', '7.2%', 18000, 'New to us']];
  var CELEB = [['Ayesha Rao', 'Actor', 'Mumbai', 'Gifting only'], ['Vikram Sethi', 'Cricketer', 'Mumbai', 'Gifting + post'], ['Naina Kapoor', 'TV host', 'Mumbai', 'Event appearance']];
  var JOUR = [['Priya Menon', 'Mid-Day', 'Food and lifestyle', '20 Oct'], ['Rahul Desai', 'HT City', 'Events', '14 Oct'], ['Sneha Iyer', 'Vogue India', 'Beauty', '2 Oct'], ['Amit Joshi', 'Mumbai Mirror', 'Business', '25 Oct']];
  var HAMPERS = [['Ayesha Rao', 'Dadar Silk House', 'Festive saree + sweets', 'DTDC 7731 0942', 'Delivered', 'zoya'], ['Vikram Sethi', 'Dadar Silk House', 'Kurta set + note', 'Blue Dart 5520 11', 'Dispatched', 'zoya'],
    ['@bandra.bites', 'Kora Skincare', 'Diwali hamper, 4 products', 'Dunzo 88213', 'Posted', 'tanvi'], ['@glowwithtara', 'Kora Skincare', 'Diwali hamper, 4 products', 'Delhivery 4431', 'Delivered', 'tanvi']];
  var APPROVALS = [['Pricing', 'Kora Skincare proposal fee', 'kabir', 800000, 'Waiting'], ['Proposal', 'Lower Parel Lofts proposal', 'riya', 750000, 'Waiting'],
    ['Influencer fee', '@mumbaimasala.diaries for Kora Skincare', 'tanvi', 60000, 'Waiting'], ['Payout', '@bandra.bites, Kora teaser reel', 'tanvi', 45000, 'Waiting'],
    ['Expense', 'Venue deposit, Monsoon Activewear launch', 'arjun', 120000, 'Waiting'], ['Payout', 'Photographer, Bandra Book Cafe shoot', 'neha', 18000, 'Approved']];
  var MONEYTYPES = { 'Influencer fee': 1, 'Payout': 1, 'Expense': 1 };
  var INVOICES = [['GUC-INV-1041', 'Bombay Brew Co.', 300000, 12, 'Sent'], ['GUC-INV-1038', 'Kalaghoda Arts Fest', 380000, 64, 'Overdue'], ['GUC-INV-1036', 'Dadar Silk House', 260000, 35, 'Part paid'],
    ['GUC-INV-1033', 'Bandra Book Cafe', 140000, 3, 'Sent'], ['GUC-INV-1029', 'Kora Skincare', 400000, 0, 'Draft']];

  window.GUC_SCREENS = {
    inbox: function (A) {
      var u = A.me(), rows = INBOX.filter(function (r) { return u.role === 'Founder' || r[5] === u.id || !r[5] || (A.P[r[5]] && A.P[r[5]].head === u.id); });
      return listScreen(A, 'Inbox', 'conversations', rows.map(function (r) {
        return { cls: ' inbox-row' + (r[6] ? '' : ' is-unread'), f: { ch: CH[r[0]][0], who: r[5] ? A.P[r[5]].name : 'Not assigned' },
          h: ch(A, r[0]) + '<div style="min-width:0"><div class="inbox-top"><b>' + A.esc(r[1]) + '</b><span class="faint" style="font-size:var(--fs-12)">' + A.esc(r[2]) + '</span>' + (r[2] !== 'New' ? '<span class="chip chip--mint">Lead</span>' : '') + '</div><div class="msg-snip">' + A.esc(r[3]) + '</div></div>' +
            '<div class="inbox-side"><time>' + r[4] + '</time>' + (r[5] ? A.avatar(r[5]) : '<span class="chip">Not assigned</span>') + '</div>' };
      }), { drops: [['ch', 'Channel'], ['who', 'Assigned to']], cols: '128px minmax(0,1fr) auto',
        top: '<p class="f-help">Sample conversations. WhatsApp (one shared number), Instagram DMs, Gmail, the website form and Meta lead ads connect in the build; Instagram DMs need Meta App Review first.</p>' });
    },
    leads: function (A) {
      var L = leadsFor(A), stages = ['New', 'Contacted', 'Discovery call', 'Proposal sent', 'Negotiation', 'Won', 'Lost / Nurture'];
      return '<section style="display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Leads</h1><span class="chip">' + L.length + ' leads . Sample data</span></div>' +
        '<div class="filters"><label class="search"><span class="sr-only">Search leads</span>' + A.ico('search') + '<input class="input" data-search-board placeholder="Search brand or contact"></label>' +
        '<select class="select" aria-label="Pick any field"><option>+ Any field</option><option>Owner</option><option>Channel</option></select>' + A.dateFilter({ date: '', from_d: '', to_d: '' }).replace(/data-tf=/g, 'data-ldate=') + '</div>' +
        '<div class="board">' + stages.map(function (s) {
          var cards = L.filter(function (l) { return l.stage === s; });
          var sum = cards.reduce(function (a, l) { return a + l.value; }, 0);
          return '<section class="col' + (s === 'Won' ? ' col--won' : s.indexOf('Lost') === 0 ? ' col--lost' : '') + '"><div class="col-head"><h3 class="h-sec">' + s + '</h3><span class="count">' + cards.length + '</span></div><div class="col-sum">' + (sum ? lakh(sum) : '') + '</div>' +
            cards.map(function (l) { return '<article class="bcard" tabindex="0"><span class="bcard-title">' + A.esc(l.brand) + '</span><span class="bcard-row">' + ch(A, l.ch) + '<span class="money">' + lakh(l.value) + '</span></span><span class="bcard-row">' + A.avatar(l.owner) + A.esc(A.P[l.owner].name) + '</span></article>'; }).join('') + '</section>';
        }).join('') + '</div></section>';
    },
    brands: function (A) {
      var u = A.me(), seeFee = u.role === 'Founder' || u.role === 'Finance' || u.role === 'Department head';
      return listScreen(A, 'Brands & projects', 'projects', projectsFor(A).map(function (p) {
        return { f: { tpl: p.template, dept: p.dept }, h: '<div class="cell-who"><span class="av av--lg">' + p.brand.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2) + '</span><div><b>' + A.esc(p.brand) + '</b><span>' + A.esc(p.name + ' . ' + p.template) + '</span></div></div>' +
          '<span class="avs">' + p.team.map(function (x) { return A.avatar(x); }).join('') + '</span><span class="chip chip--mint">' + A.esc(p.stage) + '</span><span class="money num">' + (seeFee ? lakh(p.fee) : masked) + '</span>' };
      }), { drops: [['tpl', 'Template'], ['dept', 'Department']], empty: 'Projects you are on show here.' });
    },
    threads: function (A) {
      var rows = A.D().projects.filter(function (p) { return A.me().role === 'Founder' || p.team.indexOf(A.me().id) >= 0; }).map(function (p) {
        return { f: { kind: 'Project' }, h: '<div class="cell-who"><span class="av av--lg">' + A.ico('messages', 'i--sm') + '</span><div><b>' + A.esc(p.brand + ' . ' + p.name) + '</b><span>Team thread . ' + p.team.length + ' people</span></div></div><span class="faint">Last message today</span><span class="avs">' + p.team.map(function (x) { return A.avatar(x); }).join('') + '</span><span></span>' };
      });
      return listScreen(A, 'Team threads', 'threads', rows, { drops: [['kind', 'Kind']], top: '<div class="chan-list">' + ['bd', 'influencer', 'pr', 'events'].map(function (c) { return '<a class="nav-a" href="#/threads">' + A.ico('hash') + c + '</a>'; }).join('') + '</div>' });
    },
    media: function (A) {
      var r = role(A), canCeleb = r === 'Founder' || r === 'Department head';
      var rows = INFL.map(function (i) { return { f: { cat: i[2], city: i[3] }, h: '<div class="cell-who"><span class="av av--lg">' + i[0].slice(1, 3).toUpperCase() + '</span><div><b>' + i[0] + '</b><span>' + i[1] + ' . ' + i[2] + ' . ' + i[3] + '</span></div></div><span class="num">' + i[4] + ' followers, ' + i[5] + ' ER</span><span class="num">Reel ' + rupees(i[6]) + '</span><span class="chip">' + i[7] + '</span>' }; });
      var tabs = '<div class="tabs" role="tablist"><button class="tab" role="tab" type="button" aria-selected="true">Influencers ' + INFL.length + '</button>' + (canCeleb ? '<button class="tab" role="tab" type="button" aria-selected="false" data-do="celebs">Celebrities ' + CELEB.length + '</button>' : '') +
        (r === 'Finance' ? '' : '<button class="tab" role="tab" type="button" aria-selected="false" data-do="journos">Journalists &amp; outlets ' + JOUR.length + '</button>') + '</div>';
      return listScreen(A, 'Influencers & media', 'influencers', rows, { drops: [['cat', 'Category'], ['city', 'City']], top: tabs });
    },
    gifting: function (A) {
      return listScreen(A, 'Gifting & dispatch', 'hampers', HAMPERS.map(function (h) {
        var c = { Dispatched: 'chip--blue', Delivered: 'chip--amber', Posted: 'chip--green' }[h[4]];
        return { f: { st: h[4], brand: h[1] }, h: '<div class="cell-who"><span class="av av--lg">' + A.ico('gift', 'i--sm') + '</span><div><b>' + A.esc(h[0]) + '</b><span>' + A.esc(h[1] + ' . ' + h[2]) + '</span></div></div><span class="num">' + h[3] + '</span>' + A.avatar(h[5]) + '<span class="chip ' + c + '">' + h[4] + (h[4] === 'Delivered' ? ', waiting for proof of post' : '') + '</span>' };
      }), { drops: [['st', 'Status'], ['brand', 'Brand']] });
    },
    approvals: function (A) {
      var list, r = role(A), live = (A.D().approvals || []).slice().reverse().map(function (x) { return [x.type, x.what, x.by, x.amount, x.status]; });
      list = live.concat(APPROVALS).filter(function (a) { return r !== 'Finance' || MONEYTYPES[a[0]]; });
      if (r === 'Team member') list = list.filter(function (a) { return a[2] === A.me().id; });
      return listScreen(A, 'Approvals', 'approvals', list.map(function (a) {
        return { f: { type: a[0], st: a[4] }, h: '<div class="cell-who">' + A.avatar(a[2], true) + '<div><b>' + A.esc(a[1]) + '</b><span>' + a[0] + ' . asked by ' + A.esc(A.P[a[2]].name) + '</span></div></div><span class="money num">' + rupees(a[3]) + '</span><span class="chip' + (a[4] === 'Approved' ? ' chip--green' : ' chip--amber') + '">' + a[4] + '</span><span></span>' };
      }), { drops: [['type', 'Type'], ['st', 'Status']], top: r === 'Finance' ? '<p class="f-help">Finance sees money approvals only: influencer fees, payouts and expenses.</p>' : '' });
    },
    money: function (A) {
      var head = role(A) === 'Department head';
      var card = head ? '' : '<article class="card money-card"><div class="card-head"><h2 class="h-sec">To collect</h2><span class="chip chip--red">1 over 60 days</span></div><div class="money-big"><span class="fig fig--xl num">₹14.8L</span></div>' +
        '<div class="ageing"><div class="age"><div class="bar"><i style="--p:100"></i></div><span>0 to 30 days</span><b>₹8.4L</b></div><div class="age"><div class="bar"><i style="--p:40"></i></div><span>31 to 60</span><b>₹2.6L</b></div><div class="age"><div class="bar bar--red"><i style="--p:45"></i></div><span>61 to 90</span><b>₹3.8L</b></div><div class="age"><div class="bar bar--red"><i style="--p:0"></i></div><span>90+</span><b>₹0</b></div></div></article>';
      return card + listScreen(A, 'Invoices', 'invoices', INVOICES.map(function (i) {
        return { f: { st: i[4] }, h: '<div class="cell-who"><span class="av av--lg">' + A.ico('file-invoice', 'i--sm') + '</span><div><b>' + i[1] + '</b><span>' + i[0] + '</span></div></div><span class="money num">' + (head ? masked : rupees(i[2])) + '</span><span class="num">' + (i[3] ? i[3] + ' days' : 'Not sent') + '</span><span class="chip' + (i[4] === 'Overdue' ? ' chip--red' : '') + '">' + i[4] + '</span>' };
      }), { drops: [['st', 'Status']], top: head ? '<p class="f-help">Department heads see the invoice status of their own brands. Amounts and margin stay with the Founder and Finance.</p>' : '' });
    },
    dash: function (A) {
      var mine = A.D().tasks.filter(function (t) { return t.owner === A.me().id; });
      var dueToday = mine.filter(function (t) { return A.OPEN[t.status] && t.due.slice(0, 10) === A.TODAY; }).length, over = mine.filter(A.isOverdue).length, blk = mine.filter(function (t) { return t.status === 'blocked'; }).length;
      var tile = function (l, i, n, sub, alert) { return '<button class="tile' + (alert ? ' tile--alert' : '') + '" type="button" onclick="location.hash=\'#/today\'"><span class="tile-top"><span class="label">' + l + '</span><span class="tile-ico">' + A.ico(i) + '</span></span><span class="fig num">' + n + '</span><span class="tile-sub">' + sub + '</span></button>'; };
      var lb = '';
      if (role(A) === 'Founder') {
        var pts = A.ORDER.map(function (id) { return [id, A.D().tasks.filter(function (t) { return t.owner === id && (t.status === 'done' || t.status === 'check'); }).length * 3 + A.P[id].streak]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
        lb = '<div class="card"><div class="card-head"><h2 class="h-sec">Team leaderboard</h2><span class="label">This week . sample</span></div><div class="leader">' + pts.map(function (p, i) { return '<div class="lb-row"><span class="lb-rank">' + (i + 1) + '</span>' + A.avatar(p[0]) + '<div class="lb-who"><b>' + A.esc(A.P[p[0]].name) + '</b><span class="bar"><i style="--p:' + Math.round(p[1] / pts[0][1] * 100) + '"></i></span></div><span class="lb-pts num">' + p[1] + '</span></div>'; }).join('') + '</div><p class="faint" style="font-size:var(--fs-11);margin-top:var(--s-2)">Points: task done on time 3, plus streak days. Illustrative.</p></div>';
      }
      return '<section style="display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">My dashboard</h1><span class="chip">Sample data</span></div><div class="tiles">' +
        tile('Due today', 'calendar-event', dueToday, 'Open tasks with a deadline today') + tile('Overdue', 'alert-triangle', over, over ? 'Start with these' : 'Nothing late', over > 0) +
        tile('Blocked', 'hand-stop', blk, 'Your department head is told') + tile('Streak', 'flame', A.me().streak, 'Days in a row with every task closed') + '</div>' + lb + '</section>';
    },
    brief: function (A) {
      var T = A.D().tasks, over = T.filter(A.isOverdue), chk = T.filter(function (t) { return t.status === 'check'; }), due = T.filter(function (t) { return A.OPEN[t.status] && t.due.slice(0, 10) === A.TODAY; });
      if (role(A) !== 'Founder') { var vis = A.visible(); over = over.filter(function (t) { return vis.indexOf(t) >= 0; }); chk = chk.filter(function (t) { return vis.indexOf(t) >= 0; }); due = due.filter(function (t) { return vis.indexOf(t) >= 0; }); }
      var byP = {}; over.forEach(function (t) { byP[t.owner] = (byP[t.owner] || 0) + 1; });
      var li = Object.keys(byP).map(function (id) { return '<li>' + A.avatar(id) + '<span>' + A.esc(A.P[id].name) + '</span><span class="chip chip--red">' + byP[id] + ' overdue</span></li>'; }).join('');
      var wa = 'Good morning team. Today: ' + due.length + ' tasks due, ' + over.length + ' overdue, ' + chk.length + ' waiting for check.\n' + Object.keys(byP).map(function (id) { return A.P[id].name + ': ' + byP[id] + ' overdue'; }).join('\n');
      return '<section class="brief-hero card"><div class="brief-sum"><h1 class="h-page">Morning brief</h1><p class="lede">For the 9:30 meeting. <b>' + due.length + ' due today, ' + over.length + ' overdue, ' + chk.length + ' waiting for check.</b></p></div>' +
        '<button class="btn btn--next" type="button" data-do="wa">' + A.ico('brand-whatsapp') + 'Send on WhatsApp</button></section>' +
        '<div class="brief"><div class="card"><h2 class="h-sec">Overdue by person</h2><ul class="brief-list">' + (li || '<li><span>Nobody is overdue.</span></li>') + '</ul></div>' +
        '<div class="card"><h2 class="h-sec">Waiting for check</h2><ul class="brief-list">' + (chk.map(function (t) { return '<li>' + A.avatar(t.owner) + '<span>' + A.esc(t.title) + '</span><span class="chip">Checked by ' + A.esc(A.P[t.checked_by].name) + '</span></li>'; }).join('') || '<li><span>No checks waiting.</span></li>') + '</ul></div>' +
        '<div class="card"><h2 class="h-sec">WhatsApp preview</h2><div class="wa-preview">' + A.esc(wa) + '</div><p class="f-help">Sending connects in the build; today it is a preview.</p></div></div>';
    },
    ask: function (A) {
      var qa = [['What is our rate for a food reel with 200K followers?', 'Rate card (sample): ₹35,000 to ₹50,000 per reel at 100K to 300K followers, plus 18% GST. Above the ₹45,000 cap needs Maddie.'],
        ['How do we send a celebrity hamper?', 'SOP (sample): Zoya approves the list, Finance clears the cost, courier with tracking, proof of post nudged 2 days after Delivered.'],
        ['Which case study fits a pet brand?', 'Case study (sample): a Bandra pet cafe launch with 6 pet influencers, 1.4M views in two weeks.']];
      return '<section class="card" style="display:flex;flex-direction:column;gap:var(--s-3)"><div class="page-head"><h1 class="h-page">Ask GUC</h1><span class="chip">Answers from sample rate cards, SOPs and case studies</span></div>' +
        '<div class="filters"><label class="search" style="max-width:none;flex:1"><span class="sr-only">Ask a question</span>' + A.ico('message-circle') + '<input class="input" data-lq placeholder="Ask about rates, SOPs or past work"></label><button class="btn btn--next" type="button" data-do="newtask">' + A.ico('plus') + 'Make a task</button></div>' +
        '<div class="list" data-list>' + qa.map(function (q) { return '<div class="lrow" style="--cols:minmax(0,1fr)"><div><b>' + q[0] + '</b><p class="faint">' + q[1] + '</p></div></div>'; }).join('') + '</div></section>';
    },
    people: function (A) {
      return listScreen(A, 'People', 'people', A.ORDER.map(function (id) {
        var p = A.P[id];
        return { f: { dept: p.dept, role: p.role }, h: who(A, id, p.role + ', ' + p.dept) + '<span>' + (p.head ? 'Reports to ' + A.esc(A.P[p.head].name) : 'Founder') + '</span><span class="num">' + A.D().tasks.filter(function (t) { return t.owner === id && A.OPEN[t.status]; }).length + ' open tasks</span>' + (p.leave ? '<span class="chip chip--amber">On leave today</span>' : '<span class="chip">In today</span>') };
      }), { drops: [['dept', 'Department'], ['role', 'Role']] });
    },
    settings: function (A) {
      var L = [['Task priority', 'Urgent, High, Normal, Low'], ['Why it is Blocked', 'Waiting on brand, Waiting for approval, Waiting on a teammate, Waiting on an influencer, Waiting on payment, Need information, Other'],
        ['Task status', 'To do, In progress, Waiting on brand, Waiting for approval, Blocked, Waiting for check, Done, Cancelled'], ['Lead stages', 'New, Contacted, Discovery call, Proposal sent, Negotiation, Won, Lost / Nurture'],
        ['Project templates', 'PR retainer, PR project, Influencer campaign, Celebrity gifting, Event, Content'], ['Reminder rules', 'Owner, then their department head after 4 working hours, then Maddie after 1 working day; the checker too while a check is pending']];
      return listScreen(A, 'Settings', 'Dropdown lists', L.map(function (l) { return { f: { k: 'Dropdown lists' }, h: '<div><b>' + l[0] + '</b><p class="faint">' + l[1] + '</p></div><span></span><span></span><span class="chip">Founder edits</span>' }; }), { drops: [] });
    },
    _act: function (act, a, A) {
      if (act === 'wa') A.toast('Preview only. Sending on WhatsApp connects in the build.');
      if (act === 'celebs' || act === 'journos') {
        var list = act === 'celebs' ? CELEB.map(function (c) { return c[0] + ' . ' + c[1] + ' . ' + c[3]; }) : JOUR.map(function (j) { return j[0] + ' . ' + j[1] + ' . ' + j[2] + ' . last pitch ' + j[3]; });
        var box = a.closest('[data-list]').querySelector('.list');
        box.innerHTML = list.map(function (x) { return '<div class="lrow" style="--cols:minmax(0,1fr)"><b>' + A.esc(x) + '</b></div>'; }).join('');
        a.closest('.tabs').querySelectorAll('.tab').forEach(function (t) { t.setAttribute('aria-selected', t === a); });
      }
    }
  };

  /* list search + dropdown filters: hide rows that do not match */
  function filterList(el) {
    var box = el.closest('[data-list]'); if (!box) return;
    var q = (box.querySelector('[data-lq]') || {}).value || '', sels = box.querySelectorAll('[data-lf]'), shown = 0, rows = box.querySelectorAll('.lrow');
    rows.forEach(function (r) {
      var ok = !q || r.textContent.toLowerCase().indexOf(q.toLowerCase()) >= 0;
      sels.forEach(function (s) { if (s.value && r.getAttribute('data-f-' + s.getAttribute('data-lf')) !== s.value) ok = false; });
      r.hidden = !ok; if (ok) shown++;
    });
    var c = box.querySelector('[data-lcount]'); if (c) c.textContent = c.textContent.replace(/^\d+/, shown);
  }
  document.addEventListener('input', function (e) {
    if (e.target.hasAttribute('data-lq')) filterList(e.target);
    if (e.target.hasAttribute('data-search-board')) { var q = e.target.value.toLowerCase(); document.querySelectorAll('#main .bcard').forEach(function (b) { b.hidden = q && b.textContent.toLowerCase().indexOf(q) < 0; }); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.hasAttribute('data-lf')) filterList(e.target);
    if (e.target.getAttribute('data-ldate') === 'date') { var c = e.target.parentElement.querySelector('.datef-custom'); if (c) c.hidden = e.target.value !== 'custom'; }
  });
})();
