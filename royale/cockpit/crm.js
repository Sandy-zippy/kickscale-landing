/* Clients: the Inbox the Brief agent reads, companies with the people under
   them, the 360 view, and festive campaigns. The company is the record; the
   buyer, the approver and the payer are contacts on it. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS, esc = G.esc;
  var D = function () { return G.D(); };

  /* Which records are open for editing. The read view is what people want 99% of the
     time, so editing is a deliberate act behind a button, never a page of empty inputs. */
  var EDITING = {};

  /* ================= INBOX ================= */

  V.inbox = function () {
    var ms = D().messages.slice().sort(function (a, b) { return (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || String(b.at).localeCompare(String(a.at)); });
    var h = '<div class="ph"><div><h1>Inbox</h1><p>Email, WhatsApp, the website form and IndiaMART in one place. The Brief agent reads each one as it lands.</p></div>' +
      '<div class="acts"><button class="btn" data-act="pasteEnquiry">+ Paste an enquiry</button></div></div>';
    h += '<div class="card pad0">' + (ms.length ? ms.map(function (m) {
      var p = m.proposal ? D().proposals.filter(function (x) { return x.id === m.proposal; })[0] : null;
      var who = m.from || {};
      return '<div class="item"><span class="thumb" style="background:' + chColor(m.channel) + ';font-size:12px">' + esc(chIcon(m.channel)) + '</span><div class="grow">' +
        '<h4>' + esc(who.name || who.email || who.mobile || 'Unknown') + (who.company ? ' · ' + esc(who.company) : '') + ' <span class="muted small">' + esc(m.channel) + ' · ' + esc(G.when(m.at)) + '</span></h4>' +
        '<p style="white-space:pre-wrap;color:var(--ink2)">' + esc(m.text.length > 260 ? m.text.slice(0, 260) + '…' : m.text) + '</p>' +
        (p ? '<div class="agentcard" style="margin-top:10px;padding:12px"><span class="tag">Brief agent</span><h4 style="margin:4px 0 2px">' + esc(p.summary) + '</h4>' +
          (p.status === 'pending' ? '<div class="row" style="margin-top:8px"><a class="btn agent sm" href="#/proposal/' + p.id + '">Review & approve</a>' + G.conf(p.confidence) + '</div>' : '<p class="small muted">' + esc(p.status) + ' by ' + esc(GC.staffName(p.decidedBy)) + '</p>') + '</div>' : '') +
        (m.opp ? '<p style="margin-top:8px"><a class="minibtn" href="#/opp/' + m.opp + '">Open the requirement →</a></p>' : '') + '</div>' +
        G.pill(m.status === 'pending' ? 'new' : m.status, m.status === 'pending' ? 'warn' : 'ok') + '</div>';
    }).join('') : G.empty('No enquiries.')) + '</div>';
    return h;
  };
  function chIcon(c) { return { Email: '@', WhatsApp: 'W', IndiaMART: 'IM', 'Website form': 'www', TradeIndia: 'TI' }[c] || '•'; }
  function chColor(c) { return { Email: '#265C9E', WhatsApp: '#17703D', IndiaMART: '#A93226', 'Website form': '#55525F', TradeIndia: '#7D3C98' }[c] || '#55525F'; }

  /* ================= COMPANIES ================= */

  var CF = { q: '', tier: '' };
  V.companies = function () {
    var rows = D().companies.filter(G.inScope).filter(function (c) {
      if (CF.tier && G.tierOf(c) !== CF.tier) return false;
      if (CF.q) { var q = CF.q.toLowerCase(); return (c.name + ' ' + c.industry + ' ' + c.city).toLowerCase().indexOf(q) >= 0 || G.contactsOf(c.id).some(function (x) { return x.name.toLowerCase().indexOf(q) >= 0; }); }
      return true;
    }).sort(function (a, b) { return String(b.last_touch).localeCompare(String(a.last_touch)); });
    var h = '<div class="ph"><div><h1>Clients</h1><p>' + (G.acc().scope === 'own' ? 'The companies assigned to you.' : 'Every company on the books.') + ' Tiers come from the last twelve months of orders.</p></div>' +
      '<div class="acts"><a class="btn ghost" href="#/campaigns">Campaigns</a>' + (G.can('exportData') ? '<button class="btn ghost" data-act="exportClients">Export CSV</button>' : '') + '<a class="btn" href="#/companynew">+ Add a client</a></div></div>';
    h += '<div class="row" style="margin-bottom:12px"><input data-input="coSearch" id="coSearch" value="' + esc(CF.q) + '" placeholder="Search company, person, city" style="max-width:320px">' +
      ['', 'Strategic', 'Key account', 'Active', 'Prospect'].map(function (t) { return '<button class="chip" data-act="coTier" data-id="' + t + '" aria-pressed="' + (CF.tier === t) + '">' + (t || 'All') + '</button>'; }).join('') + '</div>';
    h += '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Company</th><th>Tier</th><th>Main contact</th><th class="num">Open reqs</th><th class="num">12-month orders</th><th>Owner</th><th>Last touch</th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (c) {
        var ct = G.contactsOf(c.id)[0];
        var open = D().opps.filter(function (o) { return o.company === c.id && GC.isOpen(o); }).length;
        var paused = D().issues.some(function (i) { return i.company === c.id && i.status !== 'resolved'; });
        return '<tr data-act="go" data-id="#/company/' + c.id + '"><td><b>' + esc(c.name) + '</b><small>' + esc(c.industry || '') + ' · ' + esc(c.city || '') + (c.pharma ? ' · pharma' : '') + '</small></td><td>' + G.tierPill(c) + (paused ? ' ' + G.pill('issue open', 'bad') : '') + '</td>' +
          '<td>' + (ct ? esc(ct.name) + '<small>' + esc(ct.role) + ' · ' + esc(G.mob(ct.mobile)) + '</small>' : '—') + '</td><td class="num">' + open + '</td><td class="num">' + GC.money(GC.companySpend(c, D().orders)) + '</td>' +
          '<td>' + G.avatar(c.assigned_to, true) + '</td><td>' + esc(G.when(c.last_touch)) + '</td></tr>';
      }).join('') : '<tr><td colspan="7">' + G.empty('No clients match.') + '</td></tr>') + '</tbody></table></div>';
    return h;
  };

  V.companynew = function () {
    return '<div class="ph"><div><h1>Add a client</h1><p>A company and the first person there. If the company or the mobile already exists, it is matched, not duplicated.</p></div></div>' +
      '<form class="card" data-submit="saveCompany" style="max-width:760px"><div class="grid2">' +
      G.field('Company', '<input name="company" required>') + G.field('Industry', '<input name="industry" placeholder="e.g. Pharmaceuticals">') +
      G.field('City', '<input name="city" value="Mumbai">') + G.field('Source', '<select name="source">' + Object.keys(GC.T.sources).map(function (k) { return '<option value="' + k + '">' + esc(GC.T.sources[k]) + '</option>'; }).join('') + '</select>') +
      G.field('Contact name', '<input name="name" required>') + G.field('Their role', '<select name="role">' + GC.CONTACT_ROLES.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select>') +
      G.field('Mobile', '<input name="mobile" placeholder="10 digits">') + G.field('Email', '<input name="email" type="email">') +
      G.field('Account manager', '<select name="assigned_to">' + D().staff.filter(function (u) { return ['am', 'head', 'owner'].indexOf(u.role) >= 0; }).map(function (u) { return '<option value="' + u.id + '"' + (u.id === G.me().id ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>') +
      '</div><label class="chk"><input type="checkbox" name="pharma"> Pharma / healthcare — gifts to doctors fall under UCPMP</label><div class="err" id="coErr"></div><button class="btn">Save client</button></form>';
  };

  var COTAB = {};
  V.company = function (id) {
    var c = G.companyById(id);
    if (!c) return G.deny('No such client.', '');
    if (!G.canOpen(c)) return G.deny('This client belongs to ' + GC.staffName(c.assigned_to), 'Ask them, or the Sales Head, if you need access.');
    var opps = D().opps.filter(function (o) { return o.company === id; });
    var orders = D().orders.filter(function (o) { return o.company === id; });
    var issues = D().issues.filter(function (i) { return i.company === id; });
    var paused = issues.some(function (i) { return i.status !== 'resolved'; }) || !c.consent;
    var tab = COTAB[id] || 'now';
    var openOpps = opps.filter(GC.isOpen), openOrders = orders.filter(GC.orderOpen);
    var spend = GC.companySpend(c, D().orders);
    var h = '<div class="stickyhead"><div class="ph" style="align-items:flex-start"><div><p class="muted small">' + esc(c.industry || 'Client') + ' · ' + esc(c.city || '') + ' · ' + esc(GC.staffName(c.assigned_to)) + ' looks after them · client since ' + esc(G.day(c.created)) + '</p><h1>' + esc(c.name) + ' ' + G.tierPill(c) + '</h1>' +
      '<p class="sentence" style="font-size:17px;margin-top:6px"><span class="soft">' + (spend ? GC.money(spend) + ' ordered in the last 12 months' : 'No orders in the last 12 months') + ' · ' + openOpps.length + ' open enquir' + (openOpps.length === 1 ? 'y' : 'ies') + ' · ' + openOrders.length + ' order' + (openOrders.length === 1 ? '' : 's') + ' in progress</span>' + (c.pharma ? ' ' + G.pill('Pharma: UCPMP applies', 'warn') : '') + '</p></div>' +
      '<div class="acts"><button class="btn" data-act="newOppFor" data-id="' + id + '">New enquiry</button><button class="btn ghost" data-act="addContact" data-id="' + id + '">Add contact</button><button class="btn ghost" data-act="editClientToggle" data-id="' + id + '">' + (EDITING[id] ? 'Done editing' : 'Edit details') + '</button></div></div>';
    h += '<div class="tabs" role="tablist">' + [['now', 'Now'], ['history', 'History and settings']].map(function (t) {
      return '<a href="#" role="tab" data-act="coTab" data-id="' + id + '|' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + '</a>';
    }).join('') + '</div></div>';
    if (paused) h += '<div class="notice warn">Marketing to this client is paused: ' + (c.consent ? 'an issue is open. Service messages still go out; campaigns resume when it is resolved.' : 'they opted out.') + '</div>';
    if (EDITING[id]) h += editCard(c, id);
    var oppRow = function (o) { return '<a class="item" href="#/opp/' + o.id + '"><div class="grow"><h4>' + esc(o.title) + '</h4><p>' + esc(G.day(o.created)) + ' · ' + o.lines.length + ' products' + (o.lost_reason ? ' · ' + esc(o.lost_reason) : '') + '</p></div>' + G.pill(o.stage, o.stage === 'Won' ? 'ok' : o.stage === 'Lost' ? 'bad' : 'info') + '</a>'; };
    var ordRow = function (o) { return '<a class="item" href="#/order/' + o.id + '"><div class="grow"><h4>' + esc(o.no + ' · ' + o.title) + '</h4><p>' + esc(G.day(o.created)) + ' · ' + GC.money(o.value) + '</p></div>' + G.pill(o.stage, o.stage === 'Paid' ? 'ok' : 'info') + '</a>'; };

    if (tab === 'now') {
      h += '<div class="split"><div>';
      h += '<div class="card pad0"><div class="hd"><h3>Open enquiries</h3></div>' + (openOpps.length ? openOpps.map(oppRow).join('') : G.empty('Nothing open. Tap New enquiry when they call.')) + '</div>';
      h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>Orders in progress</h3></div>' + (openOrders.length ? openOrders.map(ordRow).join('') : G.empty('No order in progress.')) + '</div>';
      var talk = D().followups.filter(function (f) { return f.company === id && f.done && f.note; }).sort(function (x, y) { return String(y.done_at || '').localeCompare(String(x.done_at || '')); }).slice(0, 5);
      h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>Last conversations</h3></div>' + (talk.length ? '<div class="chat">' + talk.map(function (f) {
        return '<div class="msg me"><div>' + esc(f.note) + '</div><small>' + esc(G.day(f.done_at)) + ' · ' + esc(f.method) + ' · ' + esc(GC.staffName(f.by || f.owner)) + '</small></div>';
      }).join('') + '</div>' : G.empty('Nothing logged yet.')) + '</div>';
      h += '</div><div>';
      h += '<div class="card pad0"><div class="hd"><h3>People</h3><button class="minibtn" data-act="addContact" data-id="' + id + '">Add</button></div>' + (G.contactsOf(id).length ? G.contactsOf(id).map(function (ct) {
        return '<div class="item"><span class="av sm" style="background:var(--brand)">' + esc(ct.name.charAt(0)) + '</span><div class="grow"><h4>' + esc(ct.name) + (ct.primary ? ' ' + G.pill('main', 'dim') : '') + '</h4><p>' + esc(ct.role || 'Contact') + ' · ' + esc(G.mob(ct.mobile) || 'no mobile') + (ct.email ? ' · ' + esc(ct.email) : '') + '</p></div></div>';
      }).join('') : G.empty('No contact person yet. Add one so we can call them.')) + '</div>';
      var openIss = issues.filter(function (i) { return i.status !== 'resolved'; });
      if (openIss.length) h += '<div class="card" style="margin-top:14px"><h3>Open issues</h3>' + openIss.map(function (i) { return '<p><a href="#/issue/' + i.id + '"><b>' + esc(i.kind) + '</b></a> ' + G.pill(i.status, 'bad') + '<br><span class="small muted">' + esc(i.text) + '</span></p>'; }).join('') + '</div>';
      var soon = (c.dates || []).filter(function (d) { var n = GC.daysBetween(GC.today(), d.date); return n >= 0 && n <= 60; });
      if (soon.length) h += '<div class="card" style="margin-top:14px"><h3>Coming up</h3><ul class="timeline">' + soon.map(function (d) { return '<li><b>' + esc(d.label) + '</b><small>' + esc(G.day(d.date)) + '</small></li>'; }).join('') + '</ul></div>';
      return h + '</div></div>';
    }

    h += '<div class="split"><div>';
    h += '<div class="card pad0"><div class="hd"><h3>All enquiries</h3></div>' + (opps.length ? opps.slice().sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); }).map(oppRow).join('') : G.empty('None yet.')) + '</div>';
    h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>All orders</h3></div>' + (orders.length ? orders.map(ordRow).join('') : G.empty('No orders yet.')) + '</div>';
    var tl = D().activity.filter(function (x) { return x.company === id || opps.some(function (o) { return o.id === x.opp; }) || orders.some(function (o) { return o.id === x.order; }); }).slice(0, 15);
    h += '<div class="card" style="margin-top:14px"><h3>Timeline</h3>' + (tl.length ? '<ul class="timeline">' + tl.map(function (x) { return '<li><b>' + esc(x.text) + '</b><small>' + esc(G.day(String(x.at).slice(0, 10))) + ' · ' + esc(x.by ? GC.staffName(x.by) : 'Assistant') + '</small></li>'; }).join('') + '</ul>' : G.empty('Nothing logged yet.')) + '</div>';
    h += '</div><div>';
    h += '<div class="card"><h3>Dates we should not miss</h3>' + ((c.dates || []).length ? '<ul class="timeline">' + c.dates.map(function (d) { return '<li><b>' + esc(d.label) + '</b><small>' + esc(G.day(d.date)) + '</small></li>'; }).join('') + '</ul>' : '<p class="muted small">None yet. Last year\'s order dates are watched automatically by the Reorder agent.</p>') +
      '<form data-submit="addDate" data-id="' + id + '" class="row" style="margin-top:8px"><input name="label" placeholder="e.g. Foundation day" style="flex:1"><input type="date" name="date" style="width:auto"><button class="btn sm">Add</button></form></div>';
    h += '<div class="card" style="margin-top:14px"><div class="between"><h3 style="margin:0">Issues</h3><button class="minibtn" data-act="newIssue" data-id="' + id + '">Log an issue</button></div>' + (issues.length ? issues.map(function (i) { return '<p><a href="#/issue/' + i.id + '"><b>' + esc(i.kind) + '</b></a> ' + G.pill(i.status, i.status === 'resolved' ? 'ok' : 'bad') + '<br><span class="small muted">' + esc(i.text) + '</span></p>'; }).join('') : '<p class="muted small">None.</p>') + '</div>';
    h += '<div class="card" style="margin-top:14px"><h3>Settings for this client</h3><label class="chk"><input type="checkbox" data-chg="coConsent" data-id="' + id + '"' + (c.consent ? ' checked' : '') + '> Happy to receive marketing</label>' +
      '<label class="chk"><input type="checkbox" data-chg="coPharma" data-id="' + id + '"' + (c.pharma ? ' checked' : '') + '> Pharma: UCPMP applies to doctor gifts</label>' +
      G.field('Tier override (with a reason, logged)', '<select data-chg="coTierOverride" data-id="' + id + '"><option value="">Worked out from orders</option>' + ['Strategic', 'Key account', 'Active', 'Prospect'].map(function (t) { return '<option' + (c.tierOverride === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>') +
      (G.can('settings') || G.me().role === 'head' ? G.field('Account manager', '<select data-chg="coOwner" data-id="' + id + '">' + D().staff.filter(function (u) { return ['am', 'head', 'owner'].indexOf(u.role) >= 0; }).map(function (u) { return '<option value="' + u.id + '"' + (c.assigned_to === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>') : '') + '</div>';
    return h + '</div></div>';
  };

  /* The edit card. Every field saves on change, like the product editor, so there is no
     "did I press save" question. Deleting lives in here rather than on the header,
     because a delete one click from a list is a delete somebody makes by accident. */
  function editCard(c, id) {
    var fields = GC.companyFields(GC.T);
    var h = '<div class="card" style="margin-top:16px"><div class="between"><h3>Edit details</h3>' +
      '<button class="btn sm ghost" data-act="editClientToggle" data-id="' + id + '">Done</button></div>' +
      '<div class="grid2">';
    h += fields.map(function (f) {
      var v = c[f.key] == null ? '' : String(c[f.key]);
      var did = id + '|' + f.key;
      var inp;
      if (f.type === 'select') {
        inp = '<select data-chg="coField" data-id="' + did + '"><option value="">Not set</option>' +
          (f.options || []).map(function (o) {
            var val = o && o.value !== undefined ? o.value : o, lab = o && o.label !== undefined ? o.label : o;
            return '<option value="' + esc(String(val)) + '"' + (String(val) === v ? ' selected' : '') + '>' + esc(String(lab)) + '</option>';
          }).join('') + '</select>';
      } else if (f.type === 'textarea') {
        inp = '<textarea data-chg="coField" data-id="' + did + '" style="min-height:70px">' + esc(v) + '</textarea>';
      } else {
        inp = '<input type="text" data-chg="coField" data-id="' + did + '" value="' + esc(v) + '">';
      }
      return G.field(f.label + (f.required ? ' *' : ''), inp);
    }).join('') + '</div>';

    var blockers = GC.companyDeleteBlockers(c, D().opps, D().orders, D().issues);
    var cost = GC.companyDeleteCost(c, D().opps, D().contacts, D().activity);
    h += '<div class="danger" style="margin-top:16px;border-top:1px solid var(--line);padding-top:14px">';
    if (blockers.length) {
      h += '<p class="small muted"><b>This client cannot be deleted.</b> ' + esc(blockers.join('. ')) + '.</p>';
    } else {
      h += '<p class="small muted">Deleting removes <b>' + cost.requirements + '</b> requirement' + (cost.requirements === 1 ? '' : 's') +
           ', <b>' + cost.contacts + '</b> contact' + (cost.contacts === 1 ? '' : 's') +
           ', <b>' + cost.dates + '</b> saved date' + (cost.dates === 1 ? '' : 's') +
           ' and <b>' + cost.timeline + '</b> timeline entr' + (cost.timeline === 1 ? 'y' : 'ies') + '.</p>' +
           '<button class="btn sm bad" data-act="delClient" data-id="' + id + '">Delete this client</button>';
    }
    return h + '</div></div>';
  }

  /* ================= CAMPAIGNS ================= */

  V.campaigns = function () {
    var cs = D().campaigns;
    var h = '<div class="ph"><div><h1>Campaigns</h1><p>Festive pushes to the right tiers, with what came back. An open client issue or a missing consent keeps a company out automatically.</p></div>' +
      '<div class="acts"><button class="btn" data-act="newCampaign">+ New campaign</button></div></div>';
    h += '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Campaign</th><th>Audience</th><th>Status</th><th class="num">Reached</th><th class="num">Replies</th><th class="num">Requirements</th><th class="num">Value</th></tr></thead><tbody>' +
      cs.map(function (c) {
        var aud = GC.audienceOf({ actions: [{ type: 'audience' }], tiers: c.tiers, sources: [] }, D()).length;
        return '<tr><td><b>' + esc(c.name) + '</b><small>' + esc(c.occasion) + ' · from ' + esc(c.start) + '</small></td><td>' + c.tiers.map(function (t) { return G.pill(t, GC.TIER_BAND[t]); }).join(' ') + '<small>' + aud + ' companies qualify today</small></td>' +
          '<td>' + G.pill(c.status, c.status === 'live' ? 'ok' : c.status === 'draft' ? 'dim' : 'info') + '</td><td class="num">' + c.sent + '</td><td class="num">' + c.replies + (c.sent ? '<small>' + Math.round(100 * c.replies / c.sent) + '%</small>' : '') + '</td>' +
          '<td class="num">' + c.opps + '</td><td class="num">' + GC.money(c.value) + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="honest">Reach and response figures on seeded campaigns are illustrative. Sending is a dry run in the demo: it counts the real audience and sends nothing.</p>';
    return h;
  };

  /* ================= actions ================= */

  A.coTab = function (id) { var p = String(id).split('|'); COTAB[p[0]] = p[1]; G.render(); };
  Object.assign(A, {
    pasteEnquiry: function () {
      G.modal('Paste an enquiry', 'The Brief agent reads it exactly as if it had arrived.', '<form data-submit="saveEnquiry">' +
        G.field('Channel', '<select name="channel"><option>Email</option><option>WhatsApp</option><option>IndiaMART</option><option>Website form</option><option>TradeIndia</option></select>') +
        G.field('Message', '<textarea name="text" style="min-height:160px" placeholder="Paste the email or WhatsApp text, signature and all" required></textarea>') +
        '<button class="btn agent">✦ Let the Brief agent read it</button></form>');
    },
    saveEnquiry: function (f) {
      if (String(f.text || '').trim().length < 10) return G.toast('Paste the message first.', 'bad');
      var src = { Email: 'email', WhatsApp: 'whatsapp', IndiaMART: 'indiamart', 'Website form': 'website', TradeIndia: 'tradeindia' }[f.channel] || 'email';
      var m = { id: GC.uid('m'), channel: f.channel, source: src, from: {}, text: f.text, at: new Date().toISOString(), status: 'pending' };
      D().messages.unshift(m);
      G.log('msg', 'Enquiry pasted into the Inbox (' + f.channel + ')');
      var p = G.runAgent('brief', m, { manual: true });
      G.closeModal(); G.save();
      if (p) { G.toast('The Brief agent read it.', 'agent'); G.go('#/proposal/' + p.id); } else G.render();
    },
    coSearch: function (v) { CF.q = v; G.render(); },
    coTier: function (t) { CF.tier = t || ''; G.render(); },
    exportClients: function () {
      G.download('clients.csv', [['Company', 'Industry', 'City', 'Tier', 'Owner', 'Contact', 'Mobile', 'Email']].concat(D().companies.filter(G.inScope).map(function (c) {
        var ct = G.contactsOf(c.id)[0] || {};
        return [c.name, c.industry, c.city, G.tierOf(c), GC.staffName(c.assigned_to), ct.name, G.mob(ct.mobile), ct.email];
      })));
    },
    saveCompany: function (f) {
      var r = GC.upsertClient(D(), { company: f.company, industry: f.industry, city: f.city, source: f.source, name: f.name, role: f.role,
        mobile: f.mobile, email: f.email, pharma: !!f.pharma, assigned_to: f.assigned_to });
      if (r.error) { document.getElementById('coErr').textContent = r.error; return; }
      G.log(r.created ? 'company_add' : 'contact_add', (r.created ? 'New client: ' : 'Matched existing client: ') + r.company.name, { company: r.company.id });
      G.save(); G.toast(r.created ? 'Client added.' : 'Already on the books — the contact was added to ' + r.company.name + '.'); G.go('#/company/' + r.company.id);
    },
    addContact: function (id) {
      G.modal('Add a person', G.companyById(id).name, '<form data-submit="saveContact" data-id="' + id + '">' + G.field('Name', '<input name="name" required>') +
        G.field('Role', '<select name="role">' + GC.CONTACT_ROLES.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select>') +
        G.field('Mobile', '<input name="mobile">') + G.field('Email', '<input name="email" type="email">') + '<div class="err" id="ctErr"></div><button class="btn">Add</button></form>');
    },
    saveContact: function (f, form) {
      var co = G.companyById(form.dataset.id);
      var r = GC.upsertClient(D(), { company: co.name, name: f.name, role: f.role, mobile: f.mobile, email: f.email });
      if (r.error) { document.getElementById('ctErr').textContent = r.error; return; }
      G.log('contact_add', f.name + ' added to ' + co.name, { company: co.id }); G.save(); G.closeModal(); G.render();
    },
    addDate: function (f, form) {
      if (!f.label || !f.date) return G.toast('A name and a date, please.', 'bad');
      var c = G.companyById(form.dataset.id); c.dates = c.dates || []; c.dates.push({ label: f.label, date: f.date });
      G.log('company_edit', 'Date added for ' + c.name + ': ' + f.label, { company: c.id }); G.save(); G.render();
    },
    coConsent: function (v, el) { var c = G.companyById(el.dataset.id); c.consent = !!v; G.log('company_edit', c.name + ': marketing ' + (v ? 'on' : 'off'), { company: c.id }); G.save(); G.render(); },
    coPharma: function (v, el) { var c = G.companyById(el.dataset.id); c.pharma = !!v; G.log('company_edit', c.name + ': pharma ' + (v ? 'on' : 'off'), { company: c.id }); G.save(); G.render(); },
    coTierOverride: function (v, el) {
      var c = G.companyById(el.dataset.id);
      var why = arguments[2];
      if (v && why == null) { var did = el.dataset.id; return G.ask('Why change the tier to ' + v + '?', 'The reason is kept in the log.', function (t) { A.coTierOverride(v, { dataset: { id: did } }, t); }); }
      if (v && !why) return G.render();
      c.tierOverride = v || null; G.log('company_edit', c.name + ' tier ' + (v ? 'set to ' + v + ' — ' + why : 'back to automatic'), { company: c.id }); G.save(); G.render();
    },
    coOwner: function (v, el) { var c = G.companyById(el.dataset.id); c.assigned_to = v; G.log('company_edit', c.name + ' now owned by ' + GC.staffName(v), { company: c.id }); G.save(); G.render(); },
    newCampaign: function () {
      G.modal('New campaign', 'Pick who it is for. The count is live.', '<form data-submit="saveCampaign">' + G.field('Name', '<input name="name" placeholder="e.g. Diwali 2026 — second wave" required>') +
        G.field('Occasion', '<select name="occasion">' + G.E.OCCASIONS.map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>') +
        '<p class="small muted">Tiers</p>' + ['Strategic', 'Key account', 'Active', 'Prospect'].map(function (t) { return '<label class="chk"><input type="checkbox" name="tiers" data-multi="1" value="' + t + '"> ' + t + '</label>'; }).join('') +
        G.field('WhatsApp template', '<select name="template">' + D().templates.map(function (t) { return '<option value="' + t.key + '">' + t.key + ' (' + t.status + ')</option>'; }).join('') + '</select>') +
        '<button class="btn">Save as draft</button></form>');
    },
    saveCampaign: function (f) {
      if (!f.name || !(f.tiers || []).length) return G.toast('Name it and pick at least one tier.', 'bad');
      var aud = GC.audienceOf({ actions: [{ type: 'audience' }], tiers: f.tiers, sources: [] }, D()).length;
      D().campaigns.unshift({ id: GC.uid('cp'), name: f.name, occasion: f.occasion, tiers: f.tiers, template: f.template, status: 'draft', start: GC.today(), sent: 0, replies: 0, opps: 0, value: 0, sources: {} });
      G.log('auto_save', 'Campaign drafted: ' + f.name + ' (' + aud + ' companies qualify)'); G.save(); G.closeModal(); G.toast(aud + ' companies qualify today. Saved as a draft — nothing sent.'); G.render();
    }
  });

  A.editClientToggle = function (id) { EDITING[id] = !EDITING[id]; G.render(); };

  A.coField = function (v, el) {
    var parts = String(el.getAttribute('data-id')).split('|');
    var r = G.editCompany(parts[0], parts[1], v);
    if (r && r.error) { G.toast(r.error, 'bad'); G.render(); return; }
    G.toast('Saved.', 'ok');
    G.render();
  };

  A.delClient = function (id) {
    var c = G.companyById(id);
    if (!c) return;
    var r = G.deleteCompany(id);
    if (r.error) { G.toast(r.error, 'bad'); return; }
    G.toast('Deleted ' + r.name + '.', 'ok');
    G.go('#/companies');
  };

})();
