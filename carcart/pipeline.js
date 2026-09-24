/* Opportunities: the pipeline board, one opportunity, and opening a new one.

   A customer is a person; an opportunity is one attempt to sell them a car.
   The stage lives on the opportunity, never on the person — so a repeat buyer
   keeps their history instead of being dragged back to "New", and the board
   only ever carries live work. Anything won or lost drops off it and lands on
   the customer's record. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return CC.esc(s); };
  var MINE = false, BRANCH = '';

  function D() { return G.D(); }
  function staffName(id) { var u = CC.staffById(id); return u ? u.name : 'Unassigned'; }
  function visible(o) {
    var me = G.me();
    if (!CC.acc(me, D().access).clients) return false;
    if (CC.acc(me, D().access).scope !== 'company' && o.assigned_to !== me.id) return false;
    if (MINE && o.assigned_to !== me.id) return false;
    if (BRANCH && o.branch !== BRANCH) return false;
    return true;
  }

  /* ---------------- the floor: one board, one ladder ---------------- */

  V.floor = function () {
    var opps = D().opportunities || [];
    var live = opps.filter(CC.isOpen).filter(visible);
    var cols = CC.pipelineByStage(opps, visible);
    var cars = G.cars(), byId = {};
    cars.forEach(function (c) { byId[c.stock_id] = c; });

    var closed = opps.filter(function (o) {
      return !CC.isOpen(o) && visible(o) && G.inRange(o.closed);
    });
    var won = closed.filter(function (o) { return o.outcome === 'won'; });

    var h = '<div class="ph"><div><h1>Showroom floor</h1>' +
      '<p>Every live deal, from the moment a lead arrives to the moment it is booked. ' +
      'One opportunity per car-buying attempt — a walk-in and a WhatsApp enquiry both land here.</p></div>' +
      '<div class="right"><button class="btn alt" data-act="newWalkin">+ New walk-in</button>' +
      '<a class="btn" href="#/oppnew">+ New opportunity</a></div></div>';

    h += G.rangeBar(won.length + ' won and ' + (closed.length - won.length) +
      ' lost in this window · the board itself always shows live deals only');

    h += '<div class="chips" style="margin-bottom:16px">' +
      '<button class="chip" data-act="pipeMine" aria-pressed="' + (MINE ? 'true' : 'false') + '">Only mine</button>' +
      '<button class="chip" data-act="pipeBranch" data-id="" aria-pressed="' + (BRANCH ? 'false' : 'true') + '">All showrooms</button>' +
      D().branches.map(function (b) {
        return '<button class="chip" data-act="pipeBranch" data-id="' + esc(b.id) + '" aria-pressed="' +
          (BRANCH === b.id ? 'true' : 'false') + '">' + esc(b.name) + '</button>';
      }).join('') +
      '<span style="margin-left:auto;font-size:12px;color:var(--dim)">' + live.length +
      ' live &middot; ' + CC.money(live.reduce(function (a, o) { return a + (o.budget_max || 0); }, 0)) +
      ' of budget in play</span></div>';

    var stalled = CC.needsAttention(opps.filter(visible), D().followups);
    if (stalled.length) {
      h += '<div class="card" style="border-color:var(--warn);margin-bottom:16px">' +
        '<h3 style="color:var(--warn)">' + stalled.length + ' deal' + (stalled.length === 1 ? '' : 's') +
        ' with no follow-up booked, or one already overdue</h3>' +
        '<p class="m">These are the ones that go quiet. ' +
        stalled.slice(0, 8).map(function (o) {
          var c2 = G.clientById(o.client);
          return '<button class="minibtn" data-act="logFollow" data-id="' + esc(o.id) + '" style="margin:6px 5px 0 0">' +
            esc(c2 ? c2.name : 'Customer') + '</button>';
        }).join('') + '</p></div>';
    }

    h += '<div class="board pipe">' + CC.OPEN_STAGES.map(function (st) {
      var rows = cols[st] || [];
      return '<div class="col"><h4 title="' + esc(CC.STAGE_HELP[st] || '') + '">' + esc(st) +
        '<i>' + rows.length + '</i></h4>' +
        '<div class="colhelp">' + esc(CC.STAGE_HELP[st] || '') + '</div>' +
        (rows.length
          ? rows.map(function (o) {
              var c = G.clientById(o.client);
              var tier = c ? CC.clientTier(c, D().opportunities) : ['—', 'dim'];
              var nx = CC.nextFollow(D().followups, o.id);
              var flag = !nx ? ['warn', 'no follow-up']
                : CC.isOverdue(nx) ? ['bad', 'overdue ' + nx.due]
                : CC.isDueToday(nx) ? ['warn', 'due today']
                : ['dim', 'next ' + nx.due];
              var play = (o.inplay || []).map(function (s2) { return byId[s2]; }).filter(Boolean);
              return '<div class="vcard" data-act="openOpp" data-id="' + esc(o.id) + '">' +
                '<b>' + esc(c ? c.name : 'Unknown') + '</b>' +
                '<span>' + esc(o.title || 'Enquiry') + '</span>' +
                (play.length
                  ? '<span class="playline">' + play.map(function (p2) {
                      return esc(p2.make + ' ' + p2.model);
                    }).join(', ') + '</span>'
                  : (o.cars.length ? '<span class="oppbud" style="color:var(--dim)">' + o.cars.length +
                      ' shortlisted, none in play</span>' : '')) +
                '<span class="oppmeta"><span class="pill ' + tier[1] + '">' + tier[0] + '</span>' +
                (CC.atRisk(D().followups, o.id) ? '<span class="pill bad">at risk</span>' : '') +
                '<span>' + esc(staffName(o.assigned_to).split(' ')[0]) + '</span></span>' +
                '<span class="oppmeta"><span class="pill ' + flag[0] + '">' + esc(flag[1]) + '</span>' +
                (o.expected ? '<span>buying ' + esc(o.expected) + '</span>' : '') + '</span>' +
                '<select class="cardstage" data-stage="' + esc(o.id) + '" ' +
                  'aria-label="Move ' + esc(c ? c.name : 'this deal') + ' to another stage">' +
                  CC.OPP_STAGES.map(function (st2) {
                    return '<option value="' + esc(st2) + '"' + (o.stage === st2 ? ' selected' : '') + '>' +
                      (st2 === o.stage ? '' : 'Move to ') + esc(st2) + '</option>';
                  }).join('') + '</select>' +
                '</div>';
            }).join('')
          : '<div class="empty" style="padding:18px;font-size:12px">—</div>') +
        '</div>';
    }).join('') + '</div>';

    if (closed.length) {
      h += '<p class="eyebrow" style="margin-top:30px">Decided in this window</p>' +
        '<div class="scroller"><table class="tbl"><thead><tr><th>Customer</th><th>Opportunity</th>' +
        '<th>Outcome</th><th>Car</th><th class="num">Value</th><th>Salesperson</th><th>Closed</th>' +
        '</tr></thead><tbody>' +
        closed.slice().sort(function (a, b) { return String(b.closed).localeCompare(String(a.closed)); })
        .map(function (o) {
          var c = G.clientById(o.client), car = byId[o.won_car];
          return '<tr data-act="openOpp" data-id="' + esc(o.id) + '">' +
            '<td><b>' + esc(c ? c.name : '—') + '</b></td>' +
            '<td>' + esc(o.title || 'Enquiry') + '</td>' +
            '<td><span class="pill ' + (o.outcome === 'won' ? 'ok' : 'bad') + '">' + esc(o.stage) + '</span></td>' +
            '<td>' + esc(car ? car.make + ' ' + car.model : (o.outcome === 'won' ? 'earlier stock' : '—')) + '</td>' +
            '<td class="num">' + (o.won_price ? CC.money(o.won_price) : '—') + '</td>' +
            '<td>' + esc(staffName(o.assigned_to)) + '</td>' +
            '<td>' + esc(o.closed || '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    return h;
  };

  /* ---------------- one opportunity ---------------- */

  V.opp = function (id) {
    var o = (D().opportunities || []).filter(function (x) { return x.id === id; })[0];
    if (!o) return G.deny('No such opportunity', 'That one is not on the board.');
    var c = G.clientById(o.client);
    if (!c) return G.deny('Orphaned opportunity', 'The customer behind it has gone.');
    if (!CC.canOpen(o, G.me(), D().access))
      return G.deny('Not in your view', 'This belongs to ' + staffName(o.assigned_to) + '.');

    var cars = G.cars(), byId = {};
    cars.forEach(function (x) { byId[x.stock_id] = x; });
    var sum = CC.clientSummary(c, D().opportunities, cars);
    var live = CC.isOpen(o);
    var carNames = cars.map(function (x) { return x.model; });

    /* Header: who, and the one control that matters — which stage is it in. */
    var h = '<div class="ph"><div><h1>' + esc(c.name) + '</h1>' +
      '<p>' + esc(o.title || 'Enquiry') + ' &middot; ' + esc(CC.SOURCES[o.source] || o.source) +
      ' &middot; ' + esc(staffName(o.assigned_to)) +
      ' &middot; ' + esc(CC.branchName(D().branches, o.branch)) + '</p></div>' +
      '<div class="right">' +
      '<span class="stagepick"><label for="o-stage">Stage</label>' +
      '<select id="o-stage" data-stage="' + esc(o.id) + '">' +
        CC.OPP_STAGES.map(function (st) {
          return '<option value="' + esc(st) + '"' + (o.stage === st ? ' selected' : '') + '>' +
            esc(st) + '</option>';
        }).join('') + '</select></span>' +
      '<a class="btn alt" href="#/client/' + esc(c.id) + '">Customer</a></div></div>';

    h += '<p class="stagenote">' + esc(CC.STAGE_HELP[o.stage] || '') +
      (live ? '' : ' &mdash; closed on ' + esc(o.closed || '')) + '</p>';

    if (!live) {
      h += '<div class="card" style="border-color:var(--' + (o.outcome === 'won' ? 'ok' : 'bad') + ');margin-bottom:18px">' +
        '<p class="m">' + (o.outcome === 'won'
          ? 'Bought ' + esc(byId[o.won_car] ? byId[o.won_car].make + ' ' + byId[o.won_car].model : 'a car') +
            (o.won_price ? ' for ' + CC.money(o.won_price) : '') + '. It is on their record now.'
          : esc(o.lost_reason || 'No reason recorded.')) +
        ' Move the stage above to put it back on the floor.</p></div>';
    }

    /* Selling it is half the job; transferring it is the other half. The
       processing file renders itself here when there is one. */
    if (G.procPanel) h += G.procPanel(o, c, byId[o.won_car]);

    /* ---- the cars actually in play, and the follow-ups against them ---- */
    var play = (o.inplay || []).map(function (s2) { return byId[s2]; }).filter(Boolean);
    var short = (o.cars || []).filter(function (s2) { return (o.inplay || []).indexOf(s2) < 0; })
      .map(function (s2) { return byId[s2]; }).filter(Boolean);

    h += '<p class="eyebrow" style="margin-top:6px">Cars they actually want' +
      ' <span style="color:var(--dim);letter-spacing:0;text-transform:none">· follow-ups happen on these</span></p>';

    if (!play.length) {
      h += '<div class="card" style="border-color:var(--warn)"><h3 style="color:var(--warn)">Nothing in play yet</h3>' +
        '<p class="m">Pick the car — or two — they are seriously after from the shortlist below. ' +
        'Follow-ups are logged against a specific car, not the enquiry as a whole, so you always know ' +
        'which one the conversation was about.</p></div>';
    } else {
      h += play.map(function (car) {
        var fols = CC.followsFor(D().followups, 'opp', o.id)
          .filter(function (f) { return f.car === car.stock_id; });
        var nx = fols.filter(function (f) { return !f.done; })
          .sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); })[0];
        var doneF = fols.filter(function (f) { return f.done; });
        var avg = doneF.length
          ? Math.round(10 * doneF.reduce(function (a, f) {
              return a + CC.scoreNote(f.note, { outcome: f.outcome, carNames: carNames }).score;
            }, 0) / doneF.length) / 10
          : null;

        return '<div class="playcard">' +
          '<div class="playhead">' +
            '<img loading="lazy" src="' + CC.coverSrc(car) + '" alt="">' +
            '<div class="t"><b>' + esc(car.make + ' ' + car.model) + '</b>' +
              '<span>' + esc([car.year, car.variant].filter(Boolean).join(' · ')) + ' &middot; ' +
              CC.money(car.price) + ' &middot; ' + esc(CC.MARKS[CC.markOf(c, car.stock_id)] || 'no mark') + '</span></div>' +
            '<div class="playmeta">' +
              (avg !== null ? '<span class="pill ' + (avg >= 8 ? 'ok' : avg >= 5 ? 'warn' : 'bad') + '">' +
                'follow-ups ' + avg + '/10</span>' : '') +
              '<span class="pill ' + (!nx ? 'warn' : CC.isOverdue(nx) ? 'bad' : 'dim') + '">' +
                (!nx ? 'no next date' : (CC.isOverdue(nx) ? 'overdue ' : 'next ') + esc(nx.due)) + '</span>' +
            '</div>' +
            (live ? '<div class="playacts">' +
              '<button class="btn" data-act="logFollow" data-id="' + esc(o.id + '|' + car.stock_id) + '">Log follow-up</button>' +
              '<button class="minibtn" data-act="unplay" data-id="' + esc(o.id + '|' + car.stock_id) + '">Drop</button>' +
              '<button class="minibtn" data-act="oppWin1" data-id="' + esc(o.id + '|' + car.stock_id) + '">They bought it</button>' +
              '</div>' : '') +
          '</div>' +
          (fols.length
            ? '<div class="follist">' + fols.map(function (f) { return folRow(f, carNames); }).join('') + '</div>'
            : '<div class="follist"><div class="folrow"><span class="dot"></span><div class="t">' +
              '<p style="margin:0;color:var(--dim)">No follow-up logged on this car yet.</p></div></div></div>') +
          '</div>';
      }).join('');
    }

    /* ---- the shortlist: everything they looked at ---- */
    h += '<p class="eyebrow" style="margin-top:26px">Shortlist' +
      ' <span style="color:var(--dim);letter-spacing:0;text-transform:none">· everything they have looked at</span></p>';
    h += short.length
      ? '<div class="card" style="padding:0">' + short.map(function (car) {
          return '<div class="pickrow"><img loading="lazy" src="' + CC.coverSrc(car) + '" alt="">' +
            '<div class="t"><b>' + esc(car.make + ' ' + car.model) + '</b><span>' +
            esc([car.year, car.variant].filter(Boolean).join(' · ')) + ' &middot; ' + CC.money(car.price) + '</span></div>' +
            '<div class="marks">' + Object.keys(CC.MARKS).map(function (m) {
              return '<button class="mk" data-m="' + m + '" aria-pressed="' +
                (CC.markOf(c, car.stock_id) === m ? 'true' : 'false') + '"' +
                (live ? ' data-act="markFor" data-id="' + esc(c.id + '|' + car.stock_id + '|' + m) + '"' : ' disabled') +
                '>' + esc(CC.MARKS[m]) + '</button>';
            }).join('') + '</div>' +
            (live ? '<button class="minibtn play" data-act="playcar" data-id="' + esc(o.id + '|' + car.stock_id) +
              '">Move to in play →</button>' : '') + '</div>';
        }).join('') + '</div>'
      : '<div class="card"><p class="m">Nothing else on the shortlist.</p></div>';

    if (live) {
      var sug = CC.suggestFor(c, cars).filter(function (x) { return o.cars.indexOf(x.stock_id) < 0; }).slice(0, 5);
      if (sug.length) {
        h += '<p class="eyebrow" style="margin-top:22px">Suggested from stock</p><div class="card" style="padding:0">' +
          sug.map(function (car) {
            return '<div class="pickrow"><img loading="lazy" src="' + CC.coverSrc(car) + '" alt="">' +
              '<div class="t"><b>' + esc(car.make + ' ' + car.model) + '</b><span>' +
              esc([car.year, car.variant].filter(Boolean).join(' · ')) + ' &middot; ' + CC.money(car.price) + '</span></div>' +
              '<button class="minibtn" data-act="addCarToOpp" data-id="' + esc(o.id + '|' + car.stock_id) +
              '">+ Shortlist</button></div>';
          }).join('') + '</div>';
      }
    }

    /* ---- the brief and their history, folded down the bottom ---- */
    h += '<div class="cols" style="align-items:start;margin-top:26px"><div>' +
      '<p class="eyebrow">The brief</p><div class="card"><ul class="ledger">' +
      li('Budget', o.budget_max ? CC.money(o.budget_min || 0) + ' – ' + CC.money(o.budget_max) : '—') +
      li('Looking for', (o.wants.makes || []).concat(o.wants.bodies || []).join(', ') || '—') +
      li('Trade-in', o.trade_in || 'None mentioned') +
      li('Finance', o.finance ? 'Wants finance' : 'Not discussed') +
      li('Expected purchase', o.expected || 'not asked yet') +
      li('Opened', o.created) + li('Last moved', o.updated) +
      '</ul>' +
      (live ? '<p style="margin-top:12px;display:flex;gap:9px;align-items:center;flex-wrap:wrap">' +
        '<span style="font-size:12.5px;color:var(--mut)">Expected purchase date</span>' +
        '<input type="date" data-expected="' + esc(o.id) + '" value="' + esc(o.expected || '') + '" ' +
        'style="background:var(--char);border:1px solid var(--line);padding:7px 10px;color:var(--tx)"></p>' : '') +
      '</div></div>';

    h += '<div><p class="eyebrow">' + esc(c.name) + ' so far</p><div class="card">' +
      '<div class="ministats">' +
      '<div><b>' + sum.bought.length + '</b><span>bought</span></div>' +
      '<div><b>' + (G.acc().cost ? CC.money(sum.spent) : '••••') + '</b><span>spent</span></div>' +
      '<div><b>' + sum.open.length + '</b><span>open now</span></div>' +
      '</div></div>';
    if (sum.bought.length) {
      h += '<div class="card" style="padding:0;margin-top:12px">' + sum.bought.map(function (p) {
        return '<div class="pickrow">' + (p.car ? '<img src="' + CC.coverSrc(p.car) + '" alt="">' : '') +
          '<div class="t"><b>' + esc(p.car ? p.car.make + ' ' + p.car.model : 'Earlier purchase') + '</b>' +
          '<span>' + esc(p.when) + (p.price ? ' &middot; ' + CC.money(p.price) : '') + '</span></div></div>';
      }).join('') + '</div>';
    }
    var others = sum.open.filter(function (x) { return x.id !== o.id; }).concat(sum.closed);
    if (others.length) {
      h += '<div class="card" style="padding:0;margin-top:12px">' + others.map(function (x) {
        return '<div class="pickrow"><div class="t"><b>' + esc(x.title || 'Enquiry') + '</b>' +
          '<span>' + esc(x.created) + ' &middot; ' + esc(staffName(x.assigned_to)) + '</span></div>' +
          '<span class="pill ' + (x.outcome === 'won' ? 'ok' : x.outcome === 'lost' ? 'bad' : 'info') + '">' +
          esc(x.stage) + '</span>' +
          '<button class="minibtn" data-act="openOpp" data-id="' + esc(x.id) + '">Open</button></div>';
      }).join('') + '</div>';
    }
    h += '</div></div>';
    return h;
  };

  /* One logged conversation, with the score for what was written. */
  function folRow(f, carNames) {
    var sc = f.done ? CC.scoreNote(f.note, { outcome: f.outcome, carNames: carNames }) : null;
    var cls = f.done ? 'done' : CC.isOverdue(f) ? 'over' : CC.isDueToday(f) ? 'soon' : '';
    return '<div class="folrow"><span class="dot ' + cls + '"></span><div class="t">' +
      '<b>' + esc(f.method) + ' &middot; ' + esc(f.done ? (f.done_at || f.due) : f.due) +
      (f.done ? '' : ' <span class="pill ' + (CC.isOverdue(f) ? 'bad' : 'warn') + '">due</span>') + '</b>' +
      (f.note ? '<p>' + esc(f.note) + '</p>' : '<p style="color:var(--dim)">No remark written.</p>') +
      '<span class="meta">' + (f.outcome ? esc(f.outcome) + ' &middot; ' : '') +
      esc(staffName(f.by || f.owner)) + '</span></div>' +
      (sc
        ? '<button class="scorechip ' + sc.band + '" data-act="explainScore" data-id="' + esc(f.id) + '" ' +
          'title="How this was scored">' + sc.score + '<span>/10</span></button>'
        : '<button class="minibtn" data-act="doneFollow" data-id="' + esc(f.id) + '">Done</button>') +
      '</div>';
  }

  function li(k, v) { return '<li><span>' + k + '</span><b>' + esc(v) + '</b></li>'; }

  /* ---------------- a new opportunity ---------------- */

  V.oppnew = function (clientId) {
    if (!G.acc().clients) return G.deny('Not in your view', 'Customer records are switched off for your role.');
    var cars = G.cars();
    var c = clientId ? G.clientById(clientId) : null;

    var h = '<div class="ph"><div><h1>New opportunity</h1>' +
      '<p>' + (c ? 'A second run at selling to ' + esc(c.name) + '. Their history stays intact.'
                 : 'Pick the customer first — everything we already know about them loads in.') +
      '</p></div><div class="right"><a class="btn alt" href="#/pipeline">Cancel</a></div></div>';

    if (!c) {
      var people = D().clients.filter(function (x) { return CC.inScope(x, G.me(), D().access); });
      h += '<div class="card"><h3>Which customer?</h3>' +
        '<p class="m">Somebody who has bought before still counts as one customer — this just opens a new run at them.</p>' +
        '<div class="scroller" style="max-height:440px;margin-top:14px"><table class="tbl"><thead><tr>' +
        '<th>Customer</th><th>Standing</th><th>Bought</th><th>Open now</th><th>Wishlist</th><th></th>' +
        '</tr></thead><tbody>' + people.map(function (x) {
          var s2 = CC.clientSummary(x, D().opportunities, cars);
          var tier = CC.clientTier(x, D().opportunities);
          return '<tr data-act="startOpp" data-id="' + esc(x.id) + '">' +
            '<td><b>' + esc(x.name) + '</b></td>' +
            '<td><span class="pill ' + tier[1] + '">' + tier[0] + '</span></td>' +
            '<td class="num">' + s2.bought.length + '</td>' +
            '<td class="num">' + s2.open.length + '</td>' +
            '<td class="num">' + s2.wishlist.length + '</td>' +
            '<td><button class="minibtn" data-act="startOpp" data-id="' + esc(x.id) + '">Open one</button></td></tr>';
        }).join('') + '</tbody></table></div></div>';
      return h;
    }

    var sum = CC.clientSummary(c, D().opportunities, cars);
    if (sum.open.length) {
      h += '<div class="card" style="border-color:var(--warn);margin-bottom:16px">' +
        '<h3 style="color:var(--warn)">They already have ' + sum.open.length +
        ' open opportunit' + (sum.open.length === 1 ? 'y' : 'ies') + '</h3>' +
        '<p class="m">Add a second one only if they are genuinely after another car. Otherwise carry on with the existing one.</p>' +
        sum.open.map(function (x) {
          return '<p style="margin-top:9px"><button class="minibtn" data-act="openOpp" data-id="' + esc(x.id) +
            '">' + esc(x.title || 'Enquiry') + ' &middot; ' + esc(x.stage) + '</button></p>';
        }).join('') + '</div>';
    }

    h += '<div class="cols" style="align-items:start"><div>' +
      '<form id="oppform" data-cid="' + esc(c.id) + '">' +
      '<div class="fgroup"><h4>What they are after this time</h4><div class="fbody">' +
      '<div class="f wide"><label for="o-title">Name it</label>' +
      '<input id="o-title" name="title" placeholder="e.g. Second car — BMW X5" required></div>' +
      '<div class="f"><label for="o-bmin">Budget from</label><input id="o-bmin" name="budget_min" type="number"></div>' +
      '<div class="f"><label for="o-bmax">Budget to</label><input id="o-bmax" name="budget_max" type="number"></div>' +
      '<div class="f"><label for="o-body">Body type</label><select id="o-body" name="body"><option value="">Any</option>' +
        CC.BODIES.map(function (b) { return '<option>' + b + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="o-make">Make</label><select id="o-make" name="make"><option value="">Any</option>' +
        CC.tally(cars, 'make').map(function (m) { return '<option>' + esc(m[0]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="f"><label for="o-src">Came from</label><select id="o-src" name="source">' +
        Object.keys(CC.SOURCES).map(function (k) { return '<option value="' + k + '">' + CC.SOURCES[k] + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f"><label for="o-own">Salesperson</label><select id="o-own" name="assigned_to">' +
        CC.staffList().filter(function (u) { return u.role === 'sales' || u.role === 'manager'; })
          .map(function (u) {
            return '<option value="' + u.id + '"' + (u.id === c.assigned_to ? ' selected' : '') + '>' +
              esc(u.name) + '</option>';
          }).join('') + '</select></div>' +
      '<div class="f"><label for="o-branch">Showroom</label><select id="o-branch" name="branch">' +
        D().branches.map(function (b) {
          return '<option value="' + b.id + '"' + (b.id === c.branch ? ' selected' : '') + '>' + esc(b.name) + '</option>';
        }).join('') + '</select></div>' +
      '<div class="f wide"><label for="o-trade">Trade-in</label><input id="o-trade" name="trade_in" value="' +
        esc(c.trade_in || '') + '"></div>' +
      '</div></div>' +
      '<p class="err" id="o-err"></p><button class="btn" type="submit">Open this opportunity</button></form></div>';

    /* the history panel he asked for: what they bought, what they want, what is in play */
    h += '<div><p class="eyebrow">' + esc(c.name) + ' so far</p><div class="card"><div class="ministats">' +
      '<div><b>' + sum.bought.length + '</b><span>bought</span></div>' +
      '<div><b>' + sum.won + '</b><span>won</span></div>' +
      '<div><b>' + sum.lost + '</b><span>lost</span></div>' +
      '</div>' +
      '<ul class="ledger" style="margin-top:13px">' +
      li('Standing', CC.clientTier(c, D().opportunities)[0]) +
      li('Spent with us', G.acc().cost ? CC.money(sum.spent) : '₹ ••••') +
      li('First seen', c.created) +
      li('Last touch', c.last_touch) +
      '</ul></div>';

    if (sum.bought.length) {
      h += '<p class="eyebrow" style="margin-top:18px">Bought from us</p><div class="card" style="padding:0">' +
        sum.bought.map(function (p) {
          return '<div class="pickrow">' + (p.car ? '<img src="' + CC.coverSrc(p.car) + '" alt="">' : '') +
            '<div class="t"><b>' + esc(p.car ? p.car.make + ' ' + p.car.model : 'Earlier purchase') + '</b>' +
            '<span>' + esc(p.when) + (p.price ? ' &middot; ' + CC.money(p.price) : '') + '</span></div></div>';
        }).join('') + '</div>';
    }
    if (sum.wishlist.length) {
      h += '<p class="eyebrow" style="margin-top:18px">Wishlist</p><div class="card" style="padding:0">' +
        sum.wishlist.slice(0, 6).map(function (car) {
          return '<div class="pickrow"><img src="' + CC.coverSrc(car) + '" alt="">' +
            '<div class="t"><b>' + esc(car.make + ' ' + car.model) + '</b><span>' + CC.money(car.price) + '</span></div></div>';
        }).join('') + '</div>';
    }
    if (sum.closed.length) {
      h += '<p class="eyebrow" style="margin-top:18px">Past opportunities</p><div class="card" style="padding:0">' +
        sum.closed.map(function (x) {
          return '<div class="pickrow"><div class="t"><b>' + esc(x.title || 'Enquiry') + '</b>' +
            '<span>' + esc(x.created) + ' → ' + esc(x.closed || '') + '</span></div>' +
            '<span class="pill ' + (x.outcome === 'won' ? 'ok' : 'bad') + '">' + esc(x.stage) + '</span></div>';
        }).join('') + '</div>';
    }
    h += '</div></div>';
    return h;
  };

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    pipeMine: function () { MINE = !MINE; G.render(); },
    pipeBranch: function (id) { BRANCH = id || ''; G.render(); },
    openOpp: function (id) { G.go('#/opp/' + id); },
    startOpp: function (id) { G.go('#/oppnew/' + id); },

    setStage: function (arg) {
      var p = arg.split('|');
      var o = (D().opportunities || []).filter(function (x) { return x.id === p[0]; })[0];
      if (!o) return;
      if (p[1] === 'Won') return A.winOpp(o.id);
      if (p[1] === 'Lost') return A.loseOpp(o.id);
      if (p[1] === o.stage) return;
      var c = G.clientById(o.client);
      var r = CC.moveOpp(o, p[1], c);
      if (r.error) { G.toast(r.error, true); G.render(); return; }
      if (c) c.last_touch = CC.today();
      G.log('opp_stage', (c ? c.name : 'Opportunity') + ' moved to ' + p[1] +
            (r.marks.length ? ' — ' + r.marks.length + ' car mark updated to match' : ''),
            { client: o.client, opp: o.id });
      G.save();
      G.toast('Moved to ' + p[1] + '.' +
              (r.marks.length ? ' The car in play is now marked ' + CC.MARKS[CC.STAGE_MARK[p[1]]].toLowerCase() + '.' : ''));
      G.render();
    },

    winOpp: function (id) {
      var o = (D().opportunities || []).filter(function (x) { return x.id === id; })[0];
      if (!o) return;
      var cars = G.cars(), byId = {};
      cars.forEach(function (x) { byId[x.stock_id] = x; });
      var options = o.cars.map(function (s) { return byId[s]; }).filter(Boolean);
      if (!options.length) options = cars.filter(function (x) { return x.availability !== 'Sold'; }).slice(0, 25);
      G.modal('Which car did they buy?', 'Winning it records the sale and takes it off the board.',
        '<div class="card" style="padding:0">' + options.map(function (car) {
          return '<div class="pickrow"><img src="' + CC.coverSrc(car) + '" alt="">' +
            '<div class="t"><b>' + esc(car.make + ' ' + car.model) + '</b><span>' +
            esc([car.year, car.variant].filter(Boolean).join(' · ')) + ' &middot; ' + CC.money(car.price) + '</span></div>' +
            '<button class="minibtn" data-act="oppWin1" data-id="' + esc(id + '|' + car.stock_id) + '">This one</button></div>';
        }).join('') + '</div>');
    },

    oppWin1: function (arg) {
      var p = arg.split('|');
      var o = (D().opportunities || []).filter(function (x) { return x.id === p[0]; })[0];
      if (!o) return;
      var c = G.clientById(o.client), car = G.carById(p[1]);
      if (!car) return G.toast('That car is not in stock.', true);
      var r = CC.winOpp(o, c, car.stock_id, car.price, CC.today());
      if (r.error) return G.toast(r.error, true);
      CC.addMark(c, car.stock_id, 'bought', D().session);
      G.editCar(car.stock_id, 'availability', 'Sold');
      D().sales.push({ id: 's' + Date.now(), client: c.id, stock_id: car.stock_id,
        car: car.make + ' ' + car.model, buyer: c.name, price: car.price,
        booking: Math.round(car.price * 0.04 / 10000) * 10000, finance: !!o.finance,
        by: o.assigned_to || D().session, at: CC.today(), opp: o.id });
      D().followups.unshift(CC.newFollow({
        opp: o.id, client: c.id, owner: o.assigned_to, by: D().session,
        due: CC.today(), method: 'Call',
        note: 'Delivered ' + car.make + ' ' + car.model + ' — ask for a Google review in three days.' }));
      G.save();
      var m = document.getElementById('modal'); if (m && m.open) m.close();
      G.log('opp_won', 'Won — ' + c.name + ' bought the ' + car.make + ' ' + car.model +
            ' for ' + CC.money(car.price), { client: c.id, opp: o.id, car: car.stock_id });
      G.toast('Won. The sale is on ' + c.name + '’s record and the car is marked sold.');
      G.render();
    },

    loseOpp: function (id) {
      G.modal('Mark this lost', 'It leaves the board and stays on the customer’s record.',
        '<form id="loseform" data-oid="' + esc(id) + '">' +
        '<div class="f" style="margin-bottom:13px"><label for="l-why">Why did we lose it?</label>' +
        '<select id="l-why" name="reason">' +
        ['Bought elsewhere', 'Price', 'Finance declined', 'Wanted something we did not have',
         'Went quiet', 'Postponed the purchase', 'Other'].map(function (x) {
          return '<option>' + x + '</option>';
        }).join('') + '</select></div>' +
        '<div class="f" style="margin-bottom:13px"><label for="l-note">Anything worth remembering</label>' +
        '<input id="l-note" name="note" placeholder="optional"></div>' +
        '<button class="btn" type="submit">Mark lost</button></form>');
    },

    reopenOpp: function (id) {
      var o = (D().opportunities || []).filter(function (x) { return x.id === id; })[0];
      if (!o) return;
      if (o.outcome === 'won' && !confirm('Reopening a won deal leaves the sale on their record. Carry on?')) return;
      o.stage = 'Negotiating'; o.outcome = null; o.closed = null; o.updated = CC.today();
      var rc = G.clientById(o.client);
      G.log('opp_reopen', (rc ? rc.name : 'An opportunity') + ' reopened at Negotiating',
            { client: o.client, opp: o.id });
      G.save(); G.toast('Back on the board at Negotiating.'); G.render();
    },

    logFollow: function (arg) {
      var parts = String(arg).split('|');
      var oppId = parts[0], carId = parts[1] || null;
      var o = (D().opportunities || []).filter(function (x) { return x.id === oppId; })[0];
      if (!o) return;
      if (!carId) {
        if ((o.inplay || []).length === 1) carId = o.inplay[0];
        else if (!(o.inplay || []).length) {
          return G.toast('Move a car into play first — follow-ups are logged against a car.', true);
        }
      }
      var c = G.clientById(o.client);
      var car = carId ? G.carById(carId) : null;
      var next = new Date(); next.setDate(next.getDate() + 3);
      G.modal('Follow-up — ' + (c ? c.name : ''),
        car ? 'About the ' + car.make + ' ' + car.model : 'Pick which car this was about.',
        '<form id="folform" data-oid="' + esc(oppId) + '" data-car="' + esc(carId || '') + '">' +
        ((o.inplay || []).length > 1 && !parts[1]
          ? '<div class="f" style="margin-bottom:13px"><label for="f-car">Which car</label>' +
            '<select id="f-car" name="car">' + o.inplay.map(function (s2) {
              var cc = G.carById(s2);
              return cc ? '<option value="' + esc(s2) + '">' + esc(cc.make + ' ' + cc.model) + '</option>' : '';
            }).join('') + '</select></div>'
          : '') +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:13px">' +
        '<div class="f"><label for="f-method">How</label><select id="f-method" name="method">' +
          CC.FOLLOW_METHODS.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div>' +
        '<div class="f"><label for="f-when">When it happened</label>' +
          '<input id="f-when" name="when" type="date" value="' + CC.today() + '"></div>' +
        '</div>' +
        '<div class="f" style="margin-bottom:13px"><label for="f-note">What did you talk about?</label>' +
        '<div style="display:flex;gap:8px;align-items:flex-start">' +
        '<textarea id="f-note" name="note" rows="4" data-scored="1" placeholder="' +
        (car ? 'Drove the ' + esc(car.model) + '. Said the boot is smaller than he expected but likes the drive. ' +
               'Wants ₹2 L off. Bringing his wife Saturday.' : 'What did you talk about?') + '"></textarea>' +
        G.micButton('f-note') + '</div>' +
        '<div id="f-score" class="scorebar"></div>' +
        '<p class="hint">Tap Speak and talk &mdash; it types for you. Chrome and Edge only. ' +
        'The note is scored out of ten as you write it.</p></div>' +
        '<div class="f" style="margin-bottom:13px"><label for="f-outcome">How did it go?</label>' +
        '<select id="f-outcome" name="outcome">' +
          CC.FOLLOW_OUTCOMES.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:13px">' +
        '<div class="f"><label for="f-next">Next follow-up</label>' +
          '<input id="f-next" name="next" type="date" value="' + CC.iso(next) + '"></div>' +
        '<div class="f"><label for="f-exp">Expected purchase date</label>' +
          '<input id="f-exp" name="expected" type="date" value="' + esc(o.expected || '') + '"></div>' +
        '</div>' +
        '<button class="btn" type="submit">Save the follow-up</button></form>');
    },

    playcar: function (arg) {
      var p = arg.split('|');
      var o = (D().opportunities || []).filter(function (x) { return x.id === p[0]; })[0];
      if (!o) return;
      CC.playCar(o, p[1], true);
      var car = G.carById(p[1]), c = G.clientById(o.client);
      if (c) CC.addMark(c, p[1], 'negotiating', D().session);
      G.log('opp_car', (car ? car.make + ' ' + car.model : p[1]) + ' moved into play for ' +
            (c ? c.name : 'a customer'), { client: o.client, opp: o.id, car: p[1] });
      G.save();
      G.toast('In play. Follow-ups on this car now sit under it.');
      G.render();
    },
    unplay: function (arg) {
      var p = arg.split('|');
      var o = (D().opportunities || []).filter(function (x) { return x.id === p[0]; })[0];
      if (!o) return;
      CC.playCar(o, p[1], false);
      G.save(); G.toast('Back on the shortlist.'); G.render();
    },
    explainScore: function (id) {
      var f = (D().followups || []).filter(function (x) { return x.id === id; })[0];
      if (!f) return;
      var names = G.cars().map(function (x) { return x.model; });
      var sc = CC.scoreNote(f.note, { outcome: f.outcome, carNames: names });
      G.modal('Follow-up scored ' + sc.score + ' out of 10', sc.verdict,
        '<div class="body" style="margin-bottom:14px">' + esc(f.note || 'Nothing written.') + '</div>' +
        '<ul class="ledger">' + sc.marks.map(function (m) {
          return '<li><span>' + esc(m.label) + '</span><b class="' +
            (m.got === m.max ? 'ok' : m.got ? 'warn' : 'bad') + '">' + m.got + ' / ' + m.max + '</b></li>';
        }).join('') + '</ul>' +
        '<div class="note">Scored on what was written down, against a fixed set of marks — ' +
        'so anyone can see why, and argue with it. It rewards naming the car, recording a number, ' +
        'capturing what the customer actually said, and setting a clear next step.</div>');
    },

    addCarToOpp: function (arg) {
      var p = arg.split('|');
      var o = (D().opportunities || []).filter(function (x) { return x.id === p[0]; })[0];
      if (!o || o.cars.indexOf(p[1]) >= 0) return;
      o.cars.push(p[1]);
      o.updated = CC.today();
      var c = G.clientById(o.client);
      if (c) CC.addMark(c, p[1], 'interested', D().session);
      var ac = G.carById(p[1]);
      G.log('opp_car', 'Added ' + (ac ? ac.make + ' ' + ac.model : p[1]) + ' to ' +
            (c ? c.name + '’s' : 'an') + ' opportunity', { client: o.client, opp: o.id, car: p[1] });
      G.save(); G.render();
    }
  });

  /* score the note as it is typed, so the standard is obvious before saving */
  document.addEventListener('input', function (e) {
    if (!e.target.dataset || !e.target.dataset.scored) return;
    var box = document.getElementById('f-score');
    if (!box) return;
    var out = document.getElementById('f-outcome');
    var sc = CC.scoreNote(e.target.value, {
      outcome: out ? out.value : null,
      carNames: G.cars().map(function (x) { return x.model; })
    });
    box.className = 'scorebar ' + sc.band;
    box.innerHTML = '<b>' + sc.score + '<span>/10</span></b>' +
      '<span class="v">' + esc(sc.verdict) + '</span>' +
      '<span class="missing">' + sc.marks.filter(function (m) { return m.got < m.max; })
        .map(function (m) { return esc(m.label); }).join(' · ') + '</span>';
  });

  var prevChange2 = A.onChange;
  A.onChange = function (e) {
    if (prevChange2) prevChange2(e);
    var st = e.target.closest ? e.target.closest('[data-stage]') : null;
    if (st) { A.setStage(st.dataset.stage + '|' + st.value); return; }
    var el = e.target.closest ? e.target.closest('[data-expected]') : null;
    if (el) {
      var o = (D().opportunities || []).filter(function (x) { return x.id === el.dataset.expected; })[0];
      if (o) { o.expected = el.value || null; o.updated = CC.today();
        G.log('follow_log', 'Expected purchase date set to ' + (el.value || 'none'),
              { client: o.client, opp: o.id });
        G.save();
        G.toast(el.value ? 'Expected purchase ' + el.value + '.' : 'Expected date cleared.'); }
    }
  };

  var prevSubmit = A.onSubmit;
  A.onSubmit = function (e) {
    if (prevSubmit) prevSubmit(e);
    var f = e.target;

    if (f.id === 'oppform') {
      e.preventDefault();
      var d = new FormData(f);
      var c = G.clientById(f.dataset.cid);
      var o = CC.newOpp({
        client: c.id, title: String(d.get('title')).trim(),
        assigned_to: d.get('assigned_to') || c.assigned_to,
        branch: d.get('branch') || c.branch, source: d.get('source'),
        budget_min: d.get('budget_min') ? Number(d.get('budget_min')) : null,
        budget_max: d.get('budget_max') ? Number(d.get('budget_max')) : null,
        trade_in: d.get('trade_in') || null,
        wants: { bodies: d.get('body') ? [d.get('body')] : [],
                 makes: d.get('make') ? [d.get('make')] : [], fuels: [] }
      });
      D().opportunities.push(o);
      c.last_touch = CC.today();
      if (!c.assigned_to) c.assigned_to = o.assigned_to;
      G.save();
      G.log('opp_new', 'Opened "' + o.title + '" for ' + c.name, { client: c.id, opp: o.id });
      G.toast('Opened for ' + c.name + '. Their history is untouched.');
      G.go('#/opp/' + o.id);
      return;
    }

    if (f.id === 'folform') {
      e.preventDefault();
      var oid = f.dataset.oid;
      var o = (D().opportunities || []).filter(function (x) { return x.id === oid; })[0];
      if (!o) return;
      var c = G.clientById(o.client);
      var fd = new FormData(f);
      var note = String(fd.get('note') || '').trim();

      /* the one that just happened, closed */
      var carId = fd.get('car') || f.dataset.car || (o.inplay || [])[0] || null;
      D().followups.unshift(CC.newFollow({
        opp: oid, client: o.client, car: carId, owner: o.assigned_to, by: D().session,
        due: fd.get('when') || CC.today(), method: fd.get('method'),
        note: note, outcome: fd.get('outcome'),
        done: true, done_at: fd.get('when') || CC.today()
      }));
      /* and the next one, open */
      if (fd.get('next')) {
        D().followups.unshift(CC.newFollow({
          opp: oid, client: o.client, car: carId, owner: o.assigned_to, by: D().session,
          due: fd.get('next'), method: fd.get('method'),
          note: 'Follow up on: ' + (note ? note.slice(0, 80) : (o.title || 'the enquiry'))
        }));
      }
      var sc = CC.scoreNote(note, { outcome: fd.get('outcome'),
        carNames: G.cars().map(function (x) { return x.model; }) });
      o.expected = fd.get('expected') || o.expected;
      o.updated = CC.today();
      if (c) c.last_touch = CC.today();
      G.log('follow_log', (c ? c.name : 'Customer') + ' — ' + fd.get('method') + ': ' +
            (note ? note.slice(0, 90) : 'no remark') + ' (' + fd.get('outcome') + ')',
            { client: o.client, opp: oid });
      G.save();
      var m3 = document.getElementById('modal'); if (m3 && m3.open) m3.close();
      G.toast('Logged — note scored ' + sc.score + '/10.' +
              (fd.get('next') ? ' Next one booked for ' + fd.get('next') + '.' : ''));
      G.render();
      return;
    }

    if (f.id === 'loseform') {
      e.preventDefault();
      var o2 = (D().opportunities || []).filter(function (x) { return x.id === f.dataset.oid; })[0];
      if (!o2) return;
      var why = document.getElementById('l-why').value;
      var note = document.getElementById('l-note').value;
      CC.loseOpp(o2, note ? why + ' — ' + note : why, CC.today());
      var lc = G.clientById(o2.client);
      G.log('opp_lost', 'Lost — ' + (lc ? lc.name : 'a customer') + ' — ' + why,
            { client: o2.client, opp: o2.id });
      G.save();
      var m2 = document.getElementById('modal'); if (m2 && m2.open) m2.close();
      G.toast('Marked lost. It is off the board and on their record.');
      G.render();
    }
  };
})();
