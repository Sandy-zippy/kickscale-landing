/* Customers, the walk-in floor, and the channel inbox.
   One client record, keyed on the mobile number, however they arrive. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return CC.esc(s); };

  var CQ = '', CF = '', TAB = 'wants', PICK = '';

  function D() { return G.D(); }
  function mine(list) {
    var me = G.me();
    return list.filter(function (c) { return CC.inScope(c, me, D().access); });
  }
  function mob(c) { return CC.maskMobile(c.mobile, G.me(), D().access); }
  function staffName(id) { var u = CC.staffById(id); return u ? u.name : 'Unassigned'; }

  var CHANNELS = {
    whatsapp: ['WhatsApp', 'ok'], instagram: ['Instagram', 'em'],
    google: ['Google', 'info'], meta: ['Meta ad', 'info'],
    walkin: ['Walk-in', 'dim'], website: ['Website', 'dim'], referral: ['Referral', 'dim']
  };

  /* ---------------- customers ---------------- */

  V.clients = function () {
    var all = mine(D().clients), a = G.acc();
    var inWin = all.filter(function (c) { return G.inRange(c.last_touch); });
    var list = inWin.filter(function (c) {
      if (CF && CC.clientTier(c, D().opportunities)[0] !== CF) return false;
      if (CQ) {
        var hay = [c.name, c.mobile, c.source, c.stage].join(' ').toLowerCase();
        if (hay.indexOf(CQ) < 0) return false;
      }
      return true;
    });

    var h = '<div class="ph"><div><h1>Customers</h1><p>' + all.length +
      (a.scope === 'own' ? ' assigned to you' : ' on the books') +
      ' &middot; ' + D().clients.length + ' in total</p></div>' +
      '<div class="right"><a class="btn" href="#/clientnew">+ Add a customer</a></div></div>';

    if (a.scope === 'own') h += '<div class="note">You are seeing only your own customers. ' +
      'The owner sets that in Settings &rarr; Roles &amp; access.</div>';

    h += G.rangeBar(inWin.length + ' of ' + all.length + ' touched in this window');

    h += '<div class="chips" style="margin-bottom:14px">' +
      '<input id="cq" type="search" placeholder="Search name or number&hellip;" value="' + esc(CQ) + '" ' +
      'style="background:var(--coal);border:1px solid var(--line);padding:8px 12px;min-width:200px" autocomplete="off">' +
      '<button class="chip" data-act="clientStage" data-id="" aria-pressed="' + (CF ? 'false' : 'true') + '">All</button>' +
      ['Active', 'Returning', 'Premium', 'Prospect'].map(function (t) {
        var n = inWin.filter(function (c) { return CC.clientTier(c, D().opportunities)[0] === t; }).length;
        if (!n) return '';
        return '<button class="chip" data-act="clientStage" data-id="' + esc(t) + '" aria-pressed="' +
          (CF === t ? 'true' : 'false') + '">' + esc(t) + '<i>' + n + '</i></button>';
      }).join('') + '</div>';

    h += '<div class="scroller"><table class="tbl"><thead><tr>' +
      '<th>Customer</th><th>Mobile</th><th>Standing</th><th>Open now</th><th>Bought</th>' +
      '<th>Came from</th><th>Saved</th><th>Salesperson</th><th>Last touch</th></tr></thead><tbody>' +
      (list.length ? list.map(function (c) {
        var ch = CHANNELS[c.source] || ['—', 'dim'];
        var tier = CC.clientTier(c, D().opportunities);
        var open = CC.openOppsFor(D().opportunities, c.id);
        return '<tr data-act="openClient" data-id="' + esc(c.id) + '">' +
          '<td><b>' + esc(c.name) + '</b></td>' +
          '<td>' + esc(mob(c)) + '</td>' +
          '<td><span class="pill ' + tier[1] + '">' + tier[0] + '</span></td>' +
          '<td>' + (open.length
            ? open.map(function (o) { return '<span class="pill info">' + esc(o.stage) + '</span>'; }).join(' ')
            : '<span style="color:var(--dim)">—</span>') + '</td>' +
          '<td class="num">' + (c.purchased || []).length + '</td>' +
          '<td><span class="pill ' + ch[1] + '">' + ch[0] + '</span></td>' +
          '<td class="num">' + ((c.wishlist || []).length + (c.shown || []).length) + '</td>' +
          '<td>' + esc(staffName(c.assigned_to)) + '</td>' +
          '<td>' + esc(c.last_touch) + '</td></tr>';
      }).join('') : '<tr><td colspan="9" class="empty">Nobody matches.</td></tr>') +
      '</tbody></table></div>';
    return h;
  };

  /* ---------------- client 360 ---------------- */

  V.client = function (id) {
    var c = G.clientById(id);
    if (!c) return G.deny('No such customer', 'That record is not on the books.');
    if (!CC.canOpen(c, G.me(), D().access))
      return G.deny('Not in your view',
        'This customer belongs to ' + staffName(c.assigned_to) + '. What each role can see is set by the owner in Settings.');

    var cars = G.cars();
    var byId = {}; cars.forEach(function (x) { byId[x.stock_id] = x; });
    var value = CC.clientValue(c, cars);

    var tier = CC.clientTier(c, D().opportunities);
    var open = CC.openOppsFor(D().opportunities, c.id);
    var h = '<div class="ph"><div><h1>' + esc(c.name) + '</h1>' +
      '<p>' + esc(mob(c)) + ' &middot; ' + esc((CHANNELS[c.source] || ['—'])[0]) +
      ' &middot; ' + esc(tier[0]) + ' &middot; with ' + esc(staffName(c.assigned_to)) +
      ' &middot; ' + esc(CC.branchName(D().branches, c.branch)) + '</p></div>' +
      '<div class="right">' +
      (D().access[G.me().role].seeMobile
        ? '<a class="btn ok" href="https://wa.me/91' + esc(c.mobile) + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<a class="btn alt" href="tel:' + esc(c.mobile) + '">Call</a>' : '') +
      '<button class="btn alt" data-act="assignClient" data-id="' + esc(c.id) + '">Assign</button>' +
      '<a class="btn" href="#/oppnew/' + esc(c.id) + '">+ New opportunity</a></div></div>';

    h += '<div class="kpis" style="margin-bottom:20px">' +
      kpi(open.length, 'Open opportunities') +
      kpi((c.purchased || []).length, 'Cars bought') +
      kpi(G.acc().cost ? CC.money((c.purchased || []).reduce(function (a2, p) { return a2 + (p.price || 0); }, 0)) : '₹ ••••', 'Spent with us') +
      kpi((c.wishlist || []).length, 'Cars saved') +
      kpi(CC.money(value), 'Interest value') +
      '</div>';

    var tabs = [['opps', 'Opportunities'], ['wants', 'Wants'], ['shown', 'Shown'],
                ['wishlist', 'Wishlist'], ['owned', 'Bought'], ['papers', 'Papers'],
                ['timeline', 'Timeline']];
    h += '<div class="tabs">' + tabs.map(function (t) {
      return '<button class="tab ' + (TAB === t[0] ? 'on' : '') + '" data-act="clientTab" data-id="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>';

    if (TAB === 'opps') {
      var all = CC.oppsFor(D().opportunities, c.id)
        .sort(function (x, y) { return String(y.created).localeCompare(String(x.created)); });
      h += '<div class="note">One person, many runs at selling to them. Live ones sit on the ' +
        'pipeline; decided ones stay here as history.</div>';
      h += all.length
        ? '<div class="card" style="padding:0">' + all.map(function (o) {
            var isLive = CC.isOpen(o);
            var carW = o.won_car ? byId[o.won_car] : null;
            return '<div class="pickrow"><div class="t"><b>' + esc(o.title || 'Enquiry') + '</b>' +
              '<span>' + esc(o.created) + (o.closed ? ' → ' + esc(o.closed) : ' &middot; open') +
              ' &middot; ' + esc(staffName(o.assigned_to)) +
              (carW ? ' &middot; ' + esc(carW.make + ' ' + carW.model) : '') +
              (o.won_price ? ' &middot; ' + CC.money(o.won_price) : '') + '</span></div>' +
              '<span class="pill ' + (o.outcome === 'won' ? 'ok' : o.outcome === 'lost' ? 'bad' : 'info') + '">' +
              esc(o.stage) + '</span>' +
              '<button class="minibtn" data-act="openOpp" data-id="' + esc(o.id) + '">Open</button></div>';
          }).join('') + '</div>'
        : '<div class="card"><p class="m">Nothing opened for them yet. ' +
          'Use <b>+ New opportunity</b> above.</p></div>';
    }

    if (TAB === 'wants') {
      h += '<div class="grid2"><div class="card"><h3>What they said they want</h3>' +
        '<ul class="ledger" style="margin-top:10px">' +
        li('Body', (c.wants.bodies || []).join(', ') || '—') +
        li('Makes', (c.wants.makes || []).join(', ') || '—') +
        li('Fuel', (c.wants.fuels || []).join(', ') || '—') +
        li('Budget', c.budget_max ? CC.money(c.budget_min || 0) + ' – ' + CC.money(c.budget_max) : '—') +
        li('Trade-in', c.trade_in || 'None mentioned') +
        li('Finance', c.finance ? 'Wants finance' : 'Not discussed') +
        '</ul></div>';
      var sug = CC.suggestFor(c, cars).slice(0, 6);
      h += '<div class="card" style="padding:0"><h3 style="padding:18px 18px 10px">In stock for them <span class="pill em" style="float:right">' + sug.length + '</span></h3>' +
        (sug.length ? sug.map(function (x) { return pickRow(x, c, true); }).join('')
                    : '<p class="m" style="padding:0 18px 18px">Nothing in stock matches their brief yet.</p>') +
        '</div></div>';
    }

    if (TAB === 'shown') {
      h += (c.shown || []).length
        ? '<div class="card" style="padding:0">' + c.shown.map(function (s) {
            var car = byId[s.stock_id];
            if (!car) return '';
            return pickRow(car, c, false, s.mark);
          }).join('') + '</div>'
        : '<div class="card"><p class="m">Nothing shown to them yet.</p></div>';
    }

    if (TAB === 'wishlist') {
      var w = (c.wishlist || []).map(function (s) { return byId[s]; }).filter(Boolean);
      h += '<div class="ph"><div><p class="m">Staff can add to this list on the customer\'s behalf &mdash; ' +
        'what the floor picks out, and what the customer saved themselves, land in the same place.</p></div>' +
        '<div class="right"><button class="btn alt" data-act="pickForClient" data-id="' + esc(c.id) + '">+ Add a car</button></div></div>';
      h += w.length
        ? '<div class="card" style="padding:0">' + w.map(function (x) { return pickRow(x, c, false, CC.markOf(c, x.stock_id)); }).join('') + '</div>'
        : '<div class="card"><p class="m">Nothing saved yet.</p></div>';
    }

    if (TAB === 'owned') {
      h += (c.purchased || []).length
        ? '<div class="card" style="padding:0">' + c.purchased.map(function (p) {
            var car = byId[p.stock_id];
            var o = (D().opportunities || []).filter(function (x) { return x.id === p.opp; })[0];
            var st = o && o.proc ? o.proc.stage : null;
            return '<div class="pickrow">' + (car ? '<img src="' + CC.coverSrc(car) + '" alt="">' : '') +
              '<div class="t"><b>' + esc(car ? car.make + ' ' + car.model : (p.stock_id || 'Earlier stock')) + '</b>' +
              '<span>Bought ' + esc(p.when) + ' for ' + CC.money(p.price) + '</span></div>' +
              (st ? '<span class="pill ' + (st === 'Completed' ? 'ok' : 'warn') + '">' +
                    (st === 'Completed' ? 'transferred' : st) + '</span>' : '') +
              (o ? '<button class="minibtn" data-act="openOpp" data-id="' + esc(o.id) + '">Open</button>' : '') +
              '</div>';
          }).join('') + '</div>'
        : '<div class="card"><p class="m">No purchase yet.</p></div>';
    }

    /* "The customer rings up wanting their RC." Every document this person has,
       across every car they have bought, in one place — because hunting through
       three opportunities for one PDF is how it gets lost. */
    if (TAB === 'papers') {
      var papers = [];
      CC.oppsFor(D().opportunities, c.id).forEach(function (o) {
        CC.docsOf(o.proc).forEach(function (d) {
          papers.push({ doc: d, opp: o, car: byId[o.won_car] });
        });
      });
      papers.sort(function (a2, b2) { return String(b2.doc.when).localeCompare(String(a2.doc.when)); });

      var pending = CC.oppsFor(D().opportunities, c.id).filter(CC.isProcessing);
      if (pending.length) {
        h += '<div class="card" style="border-color:var(--warn);margin-bottom:14px">' +
          '<h3 style="color:var(--warn)">' + pending.length + ' transfer' +
          (pending.length === 1 ? '' : 's') + ' still open</h3>' +
          pending.map(function (o) {
            var car2 = byId[o.won_car];
            return '<p class="m">' + esc(car2 ? car2.make + ' ' + car2.model : 'A car') +
              ' — at <b>' + esc(o.proc.stage) + '</b>, due ' + esc(CC.procDue(o) || '—') + '. ' +
              '<button class="minibtn" data-act="openOpp" data-id="' + esc(o.id) + '">Open the file</button></p>';
          }).join('') + '</div>';
      }

      h += papers.length
        ? '<div class="card" style="padding:0">' + papers.map(function (x) {
            return '<div class="pickrow"><div class="t">' +
              '<b>' + esc(CC.docLabel('deal', x.doc.type)) + '</b>' +
              '<span>' + esc(x.car ? x.car.make + ' ' + x.car.model : 'Earlier stock') +
                ' &middot; ' + esc(x.doc.when) + '</span></div>' +
              (x.doc.data
                ? '<a class="minibtn" href="' + x.doc.data + '" target="_blank" rel="noopener">View</a>'
                : '<span class="pill dim">not stored</span>') +
              '<button class="minibtn" data-act="openOpp" data-id="' + esc(x.opp.id) + '">Deal</button>' +
              '</div>';
          }).join('') + '</div>'
        : '<div class="card"><p class="m">Nothing filed against this customer yet. ' +
          'Documents uploaded on a transfer file show up here.</p></div>';
    }

    if (TAB === 'timeline') {
      var events = [];
      events.push({ at: c.created, t: 'Came in from ' + (CHANNELS[c.source] || ['—'])[0] });
      (c.shown || []).forEach(function (s) {
        var car = byId[s.stock_id];
        events.push({ at: s.when, t: (CC.MARKS[s.mark] || 'Shown') + ' — ' + (car ? car.make + ' ' + car.model : s.stock_id) });
      });
      (c.purchased || []).forEach(function (p) {
        var car = byId[p.stock_id];
        events.push({ at: p.when, t: 'Bought ' + (car ? car.make + ' ' + car.model : p.stock_id) + ' for ' + CC.money(p.price) });
      });
      D().messages.filter(function (m) { return m.client === c.id; }).forEach(function (m) {
        events.push({ at: m.at.slice(0, 10), t: (CHANNELS[m.channel] || ['—'])[0] + ': ' + m.body.slice(0, 90) });
      });
      /* every follow-up, so you can read the whole conversation back */
      D().followups.filter(function (f) { return f.client === c.id; }).forEach(function (f) {
        if (f.done) {
          events.push({ at: f.done_at || f.due, kind: 'follow',
            t: f.method + ' — ' + (f.note || 'no remark') + (f.outcome ? ' (' + f.outcome + ')' : ''),
            risk: CC.AT_RISK.indexOf(f.outcome) >= 0 });
        } else {
          events.push({ at: f.due, kind: 'due',
            t: 'Follow-up due — ' + (f.note || f.method), risk: CC.isOverdue(f) });
        }
      });
      CC.oppsFor(D().opportunities, c.id).forEach(function (o) {
        events.push({ at: o.created, kind: 'opp', t: 'Opportunity opened — ' + (o.title || 'enquiry') });
        if (o.closed) {
          events.push({ at: o.closed, kind: 'opp',
            t: o.outcome === 'won' ? 'Won — ' + (o.title || 'enquiry') +
                 (o.won_price ? ' for ' + CC.money(o.won_price) : '')
               : 'Lost — ' + (o.lost_reason || 'no reason recorded'),
            risk: o.outcome === 'lost' });
        }
      });
      events.sort(function (x, y) { return String(y.at).localeCompare(String(x.at)); });
      h += '<div class="card" style="padding:0">' + events.map(function (e) {
        var sev = e.risk ? 'bad' : e.kind === 'follow' ? 'warn' : 'info';
        return '<div class="finding"><span class="sev ' + sev + '"></span><div><h4>' + esc(e.at) +
          (e.kind === 'follow' ? ' <span class="pill dim">follow-up</span>' :
           e.kind === 'due' ? ' <span class="pill warn">due</span>' :
           e.kind === 'opp' ? ' <span class="pill info">opportunity</span>' : '') +
          '</h4><p>' + esc(e.t) + '</p></div></div>';
      }).join('') + '</div>';
    }
    return h;
  };

  function kpi(v, l) { return '<div class="kpi"><b>' + v + '</b><span>' + l + '</span></div>'; }
  function li(k, v) { return '<li><span>' + k + '</span><b>' + esc(v) + '</b></li>'; }

  function pickRow(car, client, addable, mark) {
    var h = '<div class="pickrow"><img loading="lazy" src="' + CC.coverSrc(car) + '" alt="">' +
      '<div class="t"><b>' + esc(car.make + ' ' + car.model) + '</b>' +
      '<span>' + esc([car.year, car.variant, CC.fmt(car.km) + ' km'].filter(Boolean).join(' · ')) +
      ' &middot; ' + CC.money(car.price) + '</span></div>';
    if (addable) {
      h += '<button class="minibtn" data-act="wishFor" data-id="' + esc(client.id + '|' + car.stock_id) + '">+ Save for them</button>';
    } else {
      h += '<div class="marks">' + Object.keys(CC.MARKS).map(function (m) {
        return '<button class="mk" data-m="' + m + '" aria-pressed="' + (mark === m ? 'true' : 'false') +
          '" data-act="markFor" data-id="' + esc(client.id + '|' + car.stock_id + '|' + m) + '">' +
          esc(CC.MARKS[m]) + '</button>';
      }).join('') + '</div>';
    }
    return h + '</div>';
  }

  /* ---------------- add a customer ---------------- */

  V.clientnew = function () {
    if (!G.acc().clients) return G.deny('Not in your view', 'Customer records are switched off for your role.');
    var h = '<div class="ph"><div><h1>Add a customer</h1>' +
      '<p>The mobile number is the identity &mdash; if they already exist, this opens their record instead of making a second one.</p></div>' +
      '<div class="right"><a class="btn alt" href="#/clients">Cancel</a></div></div>';
    h += '<form id="clientform"><div class="fgroup"><h4>Who they are</h4><div class="fbody">' +
      '<div class="f"><label for="cl-mob">Mobile number</label><input id="cl-mob" name="mobile" inputmode="numeric" placeholder="98480 12345" required></div>' +
      '<div class="f"><label for="cl-name">Full name</label><input id="cl-name" name="name" required></div>' +
      '<div class="f"><label for="cl-email">Email</label><input id="cl-email" name="email" type="email"></div>' +
      '<div class="f"><label for="cl-src">Came from</label><select id="cl-src" name="source">' +
        Object.keys(CC.SOURCES).map(function (s) { return '<option value="' + s + '">' + CC.SOURCES[s] + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label for="cl-own">Salesperson</label><select id="cl-own" name="assigned_to">' +
        '<option value="">Unassigned</option>' +
        CC.STAFF.filter(function (u) { return u.role === 'sales' || u.role === 'manager'; })
          .map(function (u) { return '<option value="' + u.id + '">' + esc(u.name) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label for="cl-branch">Showroom</label><select id="cl-branch" name="branch">' +
        D().branches.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>'; }).join('') +
      '</select></div>' +
      '</div></div>';
    h += '<div class="fgroup"><h4>What they are looking for</h4><div class="fbody">' +
      '<div class="f"><label for="cl-bmin">Budget from</label><input id="cl-bmin" name="budget_min" type="number"></div>' +
      '<div class="f"><label for="cl-bmax">Budget to</label><input id="cl-bmax" name="budget_max" type="number"></div>' +
      '<div class="f"><label for="cl-body">Body type</label><select id="cl-body" name="body"><option value="">Any</option>' +
        CC.BODIES.map(function (b) { return '<option>' + b + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="cl-fuel">Fuel</label><select id="cl-fuel" name="fuel"><option value="">Any</option>' +
        CC.FUELS.map(function (b) { return '<option>' + b + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="cl-make">Make</label><select id="cl-make" name="make"><option value="">Any</option>' +
        CC.tally(G.cars(), 'make').map(function (m) { return '<option>' + esc(m[0]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="cl-trade">Trade-in</label><input id="cl-trade" name="trade_in" placeholder="e.g. Creta 2019, 60,000 km"></div>' +
      '</div></div>';
    h += '<p class="err" id="cl-err"></p><button class="btn" type="submit">Add customer</button></form>';
    return h;
  };

  /* ---------------- channel inbox ---------------- */

  V.inbox = function () {
    var every = D().messages.slice().sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    var msgs = every.filter(function (m) { return G.inRange(m.at); });
    var pending = msgs.filter(function (m) { return m.card.status === 'pending'; });

    var h = '<div class="ph"><div><h1>Enquiries</h1>' +
      '<p>' + pending.length + ' waiting &middot; WhatsApp, Instagram, Google and Meta in one place</p></div></div>';
    h += '<div class="note">Every enquiry is read and its requirements pulled out automatically. ' +
      '<b>Nothing reaches the customer until somebody taps Approve.</b></div>';
    h += G.rangeBar(msgs.length + ' of ' + every.length + ' enquiries in this window');
    if (!msgs.length) return h + '<div class="card"><p class="m">No enquiries in this window.</p></div>';

    h += msgs.map(function (m) {
      var ch = CHANNELS[m.channel] || ['—', 'dim'];
      var x = m.card.extraction;
      var cars = G.cars(), byId = {}; cars.forEach(function (c) { byId[c.stock_id] = c; });

      var out = '<div class="msg"><div class="msghead">' +
        '<span class="pill ' + ch[1] + '">' + ch[0] + '</span>' +
        '<b>' + esc(m.from) + '</b>' +
        '<span>' + esc(m.at.slice(0, 16).replace('T', ' ')) + '</span>' +
        (m.card.status === 'approved' ? '<span class="pill ok" style="margin-left:auto">Approved</span>'
          : m.card.status === 'dismissed' ? '<span class="pill dim" style="margin-left:auto">Dismissed</span>'
          : '<span class="pill em" style="margin-left:auto">' + Math.round(m.card.confidence * 100) + '% sure</span>') +
        '</div>';
      out += '<div class="body">' + esc(m.body) + '</div>';

      if (m.card.status === 'pending') {
        out += '<div class="capture"><h4>What this enquiry is asking for</h4><div class="kvs">' +
          [['Budget', x.budget ? CC.money(x.budget[0]) + ' – ' + CC.money(x.budget[1]) : null],
           ['Body', (x.bodies || []).join(', ')],
           ['Make', (x.makes || []).join(', ')],
           ['Fuel', (x.fuels || []).join(', ')],
           ['When', x.timeline],
           ['Trade-in', x.trade_in]]
          .filter(function (p) { return p[1]; })
          .map(function (p) { return '<span><b>' + p[0] + '</b>' + esc(p[1]) + '</span>'; }).join('') +
          '</div>';

        var matched = (x.cars || []).map(function (s) { return byId[s]; }).filter(Boolean);
        if (matched.length) {
          out += '<p style="font-size:12px;color:var(--dim);margin:0 0 7px">Matched in stock:</p>' +
            matched.map(function (car) {
              return '<div class="pickrow" style="padding:8px 0;border:0"><img src="' + CC.coverSrc(car) + '" alt="">' +
                '<div class="t"><b>' + esc(car.make + ' ' + car.model) + '</b><span>' +
                CC.money(car.price) + ' &middot; ' + esc(car.availability) + '</span></div></div>';
            }).join('');
        }
        out += '<p style="font-size:12px;color:var(--dim);margin:12px 0 5px">Suggested reply:</p>' +
          '<div class="body" style="margin-bottom:12px">' + esc(x.reply) + '</div>' +
          '<button class="btn ok" data-act="approveMsg" data-id="' + esc(m.id) + '">Approve &amp; create the customer</button> ' +
          '<button class="btn alt" data-act="dismissMsg" data-id="' + esc(m.id) + '">Dismiss</button>' +
          '</div>';
      } else if (m.client) {
        out += '<button class="minibtn" data-act="openClient" data-id="' + esc(m.client) + '">Open the customer</button>';
      }
      return out + '</div>';
    }).join('');
    return h;
  };

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    clientStage: function (s) { CF = s || ''; G.render(); },
    clientTab: function (t) { TAB = t; G.render(); },

    wishFor: function (arg) {
      var p = arg.split('|'), c = G.clientById(p[0]);
      if (!c) return;
      if (c.wishlist.indexOf(p[1]) < 0) c.wishlist.push(p[1]);
      CC.addMark(c, p[1], 'interested', G.D().session);
      G.log('wish_add', 'Saved a car to ' + c.name + '’s list', { client: c.id, car: p[1] });
      G.save(); G.toast('Saved to ' + c.name.split(' ')[0] + '’s list.'); G.render();
    },
    markFor: function (arg) {
      var p = arg.split('|'), c = G.clientById(p[0]);
      if (!c) return;
      var cur = CC.markOf(c, p[1]);
      CC.addMark(c, p[1], cur === p[2] ? 'interested' : p[2], G.D().session);
      G.save(); G.render();
    },
    pickForClient: function (id) {
      PICK = id;
      var c = G.clientById(id);
      var sug = CC.suggestFor(c, G.cars());
      G.modal('Add a car for ' + c.name, sug.length + ' in stock match their brief',
        (sug.length ? sug.slice(0, 20).map(function (car) {
          return '<div class="pickrow"><img src="' + CC.coverSrc(car) + '" alt="">' +
            '<div class="t"><b>' + esc(car.make + ' ' + car.model) + '</b><span>' +
            esc([car.year, car.variant].filter(Boolean).join(' · ')) + ' &middot; ' + CC.money(car.price) + '</span></div>' +
            '<button class="minibtn" data-act="wishFor" data-id="' + esc(id + '|' + car.stock_id) + '">+ Save</button></div>';
        }).join('') : '<p class="m">Nothing in stock matches their brief. Widen their budget or wants first.</p>'));
    },
    assignClient: function (id) {
      var c = G.clientById(id);
      G.modal('Assign ' + c.name, 'Whoever owns this customer sees them on their list.',
        CC.STAFF.filter(function (u) { return u.role === 'sales' || u.role === 'manager'; })
          .map(function (u) {
            return '<div class="pickrow"><div class="t"><b>' + esc(u.name) + '</b><span>' +
              esc(CC.ROLES[u.role].label) + '</span></div>' +
              '<button class="minibtn" data-act="doAssign" data-id="' + esc(id + '|' + u.id) + '">Assign</button></div>';
          }).join(''));
    },
    doAssign: function (arg) {
      var p = arg.split('|'), c = G.clientById(p[0]);
      c.assigned_to = p[1];
      G.log('client_assign', c.name + ' assigned to ' + staffName(p[1]), { client: c.id });
      G.save();
      document.getElementById('modal').close();
      G.toast('Assigned to ' + staffName(p[1]) + '.'); G.render();
    },

    newWalkin: function () {
      G.modal('New walk-in', 'The mobile number first — a returning customer fills themselves in.',
        '<form id="walkinform"><div class="f" style="margin-bottom:12px">' +
        '<label for="w-mob">Mobile number</label><input id="w-mob" name="mobile" inputmode="numeric" placeholder="98480 12345" required></div>' +
        '<p id="w-found" class="hint"></p>' +
        '<div class="f" style="margin-bottom:12px"><label for="w-name">Name</label><input id="w-name" name="name" required></div>' +
        '<div class="f" style="margin-bottom:12px"><label for="w-brief">What are they after?</label>' +
        '<input id="w-brief" name="brief" placeholder="e.g. Fortuner, around ₹45 L"></div>' +
        '<div class="f" style="margin-bottom:12px"><label for="w-sales">Salesperson</label>' +
        '<select id="w-sales" name="salesperson"><option value="">Decide later</option>' +
        CC.staffByRole('sales').map(function (u) {
          var busy = (D().opportunities || []).some(function (o) {
            return o.assigned_to === u.id && o.stage === 'In showroom' && CC.isOpen(o);
          });
          return '<option value="' + u.id + '">' + esc(u.name) + (busy ? ' — with someone' : ' — free') + '</option>';
        }).join('') + '</select>' +
        '<p class="hint">The list suggests who is free. The pick stays yours.</p></div>' +
        '<p class="hint" style="margin-bottom:12px">This creates the customer and opens an opportunity ' +
        'for them at <b>In showroom</b>, so the walk-in lands straight on the floor.</p>' +
        '<p class="err" id="w-err"></p><button class="btn" type="submit">Log the walk-in</button></form>');
    },

    approveMsg: function (id) {
      var m = D().messages.filter(function (x) { return x.id === id; })[0];
      if (!m) return;
      var x = m.card.extraction;
      var r = CC.upsertClient(D().clients, {
        name: m.from, mobile: m.mobile, source: m.channel,
        budget_min: x.budget ? x.budget[0] : null,
        budget_max: x.budget ? x.budget[1] : null,
        wants: { bodies: x.bodies || [], fuels: x.fuels || [], makes: x.makes || [] },
        trade_in: x.trade_in || null,
        assigned_to: leastBusy()
      });
      if (r.error) return G.toast(r.error, true);
      var c = r.client;
      m.client = c.id;
      (x.cars || []).forEach(function (s) {
        if (G.carById(s) && c.wishlist.indexOf(s) < 0) c.wishlist.push(s);
      });
      m.card.status = 'approved';
      /* An enquiry is a new run at selling to them — open one unless they
         already have a live opportunity we should be adding to. */
      var live = CC.openOppsFor(D().opportunities, c.id)[0];
      if (!live) {
        live = CC.newOpp({ client: c.id, assigned_to: c.assigned_to, branch: c.branch || 'b1',
          source: m.channel, title: ((x.makes || []).join(', ') || 'Enquiry'),
          budget_min: x.budget ? x.budget[0] : null, budget_max: x.budget ? x.budget[1] : null,
          wants: { bodies: x.bodies || [], fuels: x.fuels || [], makes: x.makes || [] },
          trade_in: x.trade_in || null, cars: (x.cars || []).filter(function (s2) { return G.carById(s2); }) });
        D().opportunities.push(live);
      } else {
        (x.cars || []).forEach(function (s2) {
          if (G.carById(s2) && live.cars.indexOf(s2) < 0) live.cars.push(s2);
        });
        live.updated = CC.today();
      }
      D().followups.unshift(CC.newFollow({
        opp: live ? live.id : null, client: c.id, owner: c.assigned_to, by: D().session,
        due: CC.today(), method: m.channel === 'whatsapp' ? 'WhatsApp' : 'Call',
        note: 'Reply to their ' + (CHANNELS[m.channel] || ['—'])[0] + ' enquiry — ' +
              ((x.makes || []).join(', ') || 'general') + ', ' +
              (x.budget ? CC.money(x.budget[1]) : 'budget unknown') + '.' }));
      G.save();
      G.log('msg_approve', (r.created ? 'Created ' : 'Updated ') + c.name + ' from a ' +
            (CHANNELS[m.channel] || ['—'])[0] + ' enquiry, assigned to ' + staffName(c.assigned_to),
            { client: c.id, opp: live ? live.id : null });
      G.toast((r.created ? 'Customer created' : 'Existing customer updated') + ' and assigned to ' +
              staffName(c.assigned_to) + '.');
      G.render();
    },
    dismissMsg: function (id) {
      var m = D().messages.filter(function (x) { return x.id === id; })[0];
      if (m) { m.card.status = 'dismissed';
        G.log('msg_dismiss', 'Dismissed a ' + (CHANNELS[m.channel] || ['—'])[0] + ' enquiry from ' + m.from);
        G.save(); G.render(); }
    }
  });

  function leastBusy() {
    var staff = CC.staffByRole('sales');
    var counts = staff.map(function (u) {
      return [u.id, D().clients.filter(function (c) { return c.assigned_to === u.id; }).length];
    }).sort(function (a, b) { return a[1] - b[1]; });
    return counts.length ? counts[0][0] : null;
  }

  /* ---------------- form and input plumbing ---------------- */

  var prevChange = A.onChange, prevSubmit = A.onSubmit;

  A.onChange = function (e) {
    if (prevChange) prevChange(e);
    if (e.target.id === 'cq') { CQ = e.target.value.toLowerCase().trim(); G.render(); }
  };

  document.addEventListener('input', function (e) {
    if (e.target.id === 'cq') { CQ = e.target.value.toLowerCase().trim(); G.render(); }
    if (e.target.id === 'q') { /* handled by stock.js via its own id */ }
    if (e.target.id === 'w-mob') {
      var found = CC.findByMobile(D().clients, e.target.value);
      var box = document.getElementById('w-found');
      if (!box) return;
      if (found) {
        var onFloor = (D().opportunities || []).some(function (o) {
          return o.client === found.id && o.stage === 'In showroom' && CC.isOpen(o);
        });
        box.innerHTML = onFloor
          ? '<b style="color:var(--warn)">' + esc(found.name) + ' is already on the floor.</b> Open their visit instead of logging a second one.'
          : '<b style="color:var(--ok)">' + esc(found.name) + '</b> — ' + esc(found.stage) +
            ', ' + (found.wishlist || []).length + ' cars saved, last here ' + esc(found.last_touch) + '.';
        var nm = document.getElementById('w-name');
        if (nm && !nm.value) nm.value = found.name;
      } else box.textContent = '';
    }
  });

  A.onSubmit = function (e) {
    if (prevSubmit) prevSubmit(e);
    var f = e.target;

    if (f.id === 'clientform') {
      e.preventDefault();
      var d = new FormData(f);
      var r = CC.upsertClient(D().clients, {
        name: d.get('name'), mobile: d.get('mobile'), email: d.get('email'),
        source: d.get('source'), assigned_to: d.get('assigned_to') || null,
        budget_min: d.get('budget_min') ? Number(d.get('budget_min')) : null,
        budget_max: d.get('budget_max') ? Number(d.get('budget_max')) : null,
        trade_in: d.get('trade_in') || null,
        wants: { bodies: d.get('body') ? [d.get('body')] : [],
                 fuels: d.get('fuel') ? [d.get('fuel')] : [],
                 makes: d.get('make') ? [d.get('make')] : [] }
      });
      if (r.error) { document.getElementById('cl-err').textContent = r.error; return; }
      r.client.branch = d.get('branch') || 'b1';
      G.save();
      if (r.created) G.log('client_add', r.client.name + ' added from ' +
        (CC.SOURCES[r.client.source] || r.client.source), { client: r.client.id });
      G.toast(r.created ? 'Customer added.' : 'They were already on the books — opening their record.');
      G.go('#/client/' + r.client.id);
      return;
    }

    if (f.id === 'walkinform') {
      e.preventDefault();
      var w = new FormData(f);
      var res = CC.upsertClient(D().clients, {
        name: w.get('name'), mobile: w.get('mobile'), source: 'walkin',
        assigned_to: w.get('salesperson') || null
      });
      if (res.error) { document.getElementById('w-err').textContent = res.error; return; }
      var c = res.client;
      var sp = w.get('salesperson') || null;
      if (!c.assigned_to && sp) c.assigned_to = sp;

      /* One walk-in, one opportunity, landing on the floor at In showroom. */
      var existing = CC.openOppsFor(D().opportunities, c.id)[0];
      var o;
      if (existing) {
        o = existing;
        CC.moveOpp(o, 'In showroom');
        if (sp) o.assigned_to = sp;
      } else {
        o = CC.newOpp({
          client: c.id, assigned_to: sp || c.assigned_to, branch: c.branch || 'b1',
          source: 'walkin', stage: sp ? 'In showroom' : 'New lead',
          title: w.get('brief') || 'Walk-in',
          budget_min: c.budget_min, budget_max: c.budget_max, wants: c.wants
        });
        D().opportunities.push(o);
      }
      G.log('visit_new', c.name + ' walked in' + (sp ? ' — with ' + staffName(sp) : ' — waiting at the door'),
            { client: c.id, opp: o.id });
      G.save();
      document.getElementById('modal').close();
      G.toast(existing ? 'Already had an open deal — moved it to In showroom.'
                       : (res.created ? 'New customer, opportunity opened.' : 'Returning customer — opportunity opened.'));
      G.go('#/opp/' + o.id);
    }
  };
})();
