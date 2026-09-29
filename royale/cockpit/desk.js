/* The Agent Desk: runs agents, queues what they propose, and applies what a
   person approves. The rule, enforced here and nowhere else:
     - an agent never writes to the store; apply() does, after approval;
     - anything that would reach a client waits for a person, whatever the
       agent's autonomy setting says — "auto" only ever covers internal steps. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS, esc = G.esc;
  var D = function () { return G.D(); };

  function mode(id) { return (GC.T.agents || {})[id] || 'suggest'; }
  function ctx() { return { E: G.E, db: G.db(), D: D(), P: G.P }; }
  function keyOf(run) {
    var t = run.target || {};
    return run.agent + ':' + (t.kind || '') + ':' + (t.id == null ? '' : t.id) + (run.payload && run.payload.pid ? ':' + run.payload.pid : '');
  }
  function ownerOf(run) {
    var t = run.target || {};
    if (t.kind === 'opp') { var o = G.oppById(t.id); return o && o.assigned_to; }
    if (t.kind === 'order') { var r = G.orderById(t.id); return r && r.assigned_to; }
    if (t.kind === 'company') { var c = G.companyById(t.id); return c && c.assigned_to; }
    return null;
  }

  /* Record a run; queue it for a decision if it proposes anything. */
  function record(run, opts) {
    opts = opts || {};
    if (!run) return null;
    if (mode(run.agent) === 'off' && !opts.manual) return null;
    var d = D();
    var decision = !!run.draft || ['curator', 'proposal', 'sourcing', 'intake', 'reorder', 'brief'].indexOf(run.agent) >= 0;
    run.key = keyOf(run);
    run.status = decision ? 'pending' : 'auto';
    d.runs.unshift({ id: run.id, agent: run.agent, title: run.title, summary: run.summary, at: run.at, status: run.status,
                     minutes: run.minutes, steps: run.steps, target: run.target, key: run.key });
    if (d.runs.length > 250) d.runs.length = 250;
    G.log('agent_run', AG.agentById(run.agent).name + ': ' + run.summary, refsOf(run, { by: null }));
    if (!decision) { G.save(); return run; }
    /* one open proposal per thing — a re-run refreshes it rather than stacking */
    var existing = d.proposals.filter(function (p) { return p.key === run.key && p.status === 'pending'; })[0];
    var p = Object.assign(existing || { id: GC.uid('p') }, {
      runId: run.id, agent: run.agent, title: run.title, summary: run.summary, target: run.target, steps: run.steps,
      draft: run.draft, payload: run.payload, clientFacing: run.clientFacing, confidence: run.confidence,
      minutes: run.minutes, status: 'pending', owner: ownerOf(run), key: run.key, at: run.at
    });
    if (!existing) d.proposals.unshift(p);
    G.save();
    return p;
  }
  function refsOf(run, extra) {
    var t = run.target || {}, r = Object.assign({}, extra || {});
    if (t.kind === 'opp') r.opp = t.id; else if (t.kind === 'order') r.order = t.id; else if (t.kind === 'company') r.company = t.id; else if (t.kind === 'product') r.product = t.id;
    return r;
  }
  /* A sweep should not re-propose what somebody just decided. */
  function recentlyDecided(key, days) {
    var since = GC.addDays(GC.today(), -(days || 3));
    return D().proposals.some(function (p) { return p.key === key && p.status !== 'pending' && String(p.decided || '') >= since; });
  }

  function runAgent(id, arg, opts) {
    opts = opts || {};
    var c = ctx(), out = null;
    switch (id) {
      case 'brief': out = record(AG.brief(arg.text, { channel: arg.channel, from: arg.from, source: arg.source, msgId: arg.id }, c), opts);
        if (out && arg.id) { arg.proposal = out.id; }
        break;
      case 'curator': out = record(AG.curate(arg, c), opts); break;
      case 'proposal': out = record(AG.proposal(arg, c), opts); break;
      case 'compliance': out = record(AG.complianceRun(arg, GC.buildQuote(arg, G.P), c), opts); break;
      case 'sourcing': out = record(AG.sourcing(G.P(arg.pid), arg.qty, c, arg), opts); break;
      case 'intake': out = record(AG.intake(arg.csv, arg.vendor, c), opts); break;
      case 'followup': out = sweep(AG.followups(c), opts); break;
      case 'orderwatch': out = sweep(AG.orderwatch(c), opts); break;
      case 'reorder': out = sweep(AG.reorder(c), opts); break;
      case 'morning': var r = AG.morning(c); D().morning = { at: GC.today(), steps: r.steps, payload: r.payload }; out = record(r, opts); break;
    }
    G.save();
    return out;
  }
  function sweep(runs, opts) {
    var made = [];
    runs.forEach(function (r) {
      if (recentlyDecided(keyOf(r))) return;
      var p = record(r, opts);
      if (p) made.push(p);
    });
    return made;
  }

  /* On sign-in the agents catch up on whatever happened: the same sweep the
     9:00 schedule and the event automations would have run in production. */
  function autopilot() {
    var d = D();
    runAgent('followup'); runAgent('orderwatch'); runAgent('reorder');
    d.messages.filter(function (m) { return m.status === 'pending' && !m.proposal; }).forEach(function (m) { runAgent('brief', m); });
    /* price lists a vendor dropped on the vendor portal */
    (d.vendorUploads || []).filter(function (u) { return !u.done; }).forEach(function (u) { runAgent('intake', { csv: u.csv, vendor: u.vendor }); u.done = true; });
    d.opps.filter(function (o) { return GC.isOpen(o) && o.stage === GC.T.stages[1] && !o.lines.length; }).forEach(function (o) {
      var k = 'curator:opp:' + o.id;
      if (!d.proposals.some(function (p) { return p.key === k; })) runAgent('curator', o);
    });
    /* last, so it counts what the sweep just queued; recorded once a day */
    if (!d.morning || d.morning.at !== GC.today()) runAgent('morning');
    else { var r = AG.morning(ctx()); d.morning = { at: GC.today(), steps: r.steps, payload: r.payload }; }
    G.save();
  }
  G.afterLogin = autopilot;
  G.morningBrief = function () {
    var m = D().morning;
    if (!m || m.at !== GC.today()) { runAgent('morning'); m = D().morning; }
    else { var r = AG.morning(ctx()); m = D().morning = { at: GC.today(), steps: r.steps, payload: r.payload }; }
    return m;
  };
  G.runAgent = runAgent;

  /* ================= applying an approved proposal ================= */

  function sent(p, text, channel, refs) {
    G.log('sent', (channel || 'Message') + ' sent: ' + String(text || '').split('\n')[0].slice(0, 80) + ' (demo — nothing left this browser)', refs);
  }
  function leastLoadedAM() {
    var ams = GC.staffByRole('am');
    if (!ams.length) return G.me().id;
    return ams.map(function (u) { return [u.id, D().opps.filter(function (o) { return o.assigned_to === u.id && GC.isOpen(o); }).length]; })
      .sort(function (a, b) { return a[1] - b[1]; })[0][0];
  }

  var APPLY = {
    brief: function (p, o) {
      var d = D(), pl = p.payload, co = pl.company ? G.companyById(pl.company) : null, ct = pl.contact ? G.contactById(pl.contact) : null;
      if (!co) {
        var r = GC.upsertClient(d, { company: pl.who.company || 'Unknown company', name: pl.who.name || 'Unknown contact',
          mobile: pl.who.mobile, email: pl.who.email || (pl.who.mobile ? '' : 'unknown@example.com'), source: pl.source,
          pharma: pl.brief.ucpmp, assigned_to: leastLoadedAM() });
        if (r.error) return { error: r.error };
        co = r.company; ct = r.contact;
        if (r.created) G.log('company_add', 'New client from an enquiry: ' + co.name, { company: co.id });
      }
      if (!ct) ct = G.contactsOf(co.id)[0] || null;
      var complete = pl.missing.length <= 2;
      var opp = GC.newOpp({ company: co.id, contact: ct && ct.id, title: pl.title, brief: pl.brief, source: pl.source,
        stage: complete ? GC.T.stages[1] : GC.T.stages[0], assigned_to: co.assigned_to || leastLoadedAM(), branch: co.branch });
      d.opps.push(opp);
      var m = d.messages.filter(function (x) { return x.proposal === p.id || x.id === (p.target || {}).id; })[0];
      if (m) { m.status = 'approved'; m.opp = opp.id; m.company = co.id; }
      G.log('opp_new', 'Requirement opened by the Brief agent: ' + opp.title, { opp: opp.id, company: co.id });
      if (o.send) sent(p, o.text, p.draft.channel, { opp: opp.id });
      /* the "Brief captured → curate" automation */
      var chain = '';
      if (complete) { var c = runAgent('curator', opp); if (c) chain = ' The Curator has already proposed ' + c.payload.picks.length + ' option' + (c.payload.picks.length === 1 ? '' : 's') + '.'; }
      return { ok: 'Requirement opened for ' + co.name + '.' + chain, go: '#/opp/' + opp.id };
    },
    curator: function (p, o) {
      var opp = G.oppById(p.target.id); if (!opp) return { error: 'That requirement is gone.' };
      var keep = o.picks || p.payload.picks.map(function (x) { return x.pid; });
      keep.forEach(function (pid) { GC.addLine(opp, pid, opp.brief.qty); });
      G.log('opp_line', keep.length + ' options added by the Curator to ' + opp.title, { opp: opp.id });
      return { ok: keep.length + ' options are on the shortlist.', go: '#/opp/' + opp.id };
    },
    proposal: function (p, o) {
      var opp = G.oppById(p.target.id); if (!opp) return { error: 'That requirement is gone.' };
      var q = GC.buildQuote(opp, G.P, { by: G.me().id });           // re-price at approval time
      var co = G.companyById(opp.company);
      var chk = GC.compliance(q, opp, co, GC.T.rules);
      if (o.send && !chk.ok) {
        var ucpmp = chk.blocks.some(function (b) { return /UCPMP/.test(b); });
        if (ucpmp) return { error: 'Blocked by UCPMP — this cannot be overridden. Swap the product.' };
        if (!(o.override && G.me().role === 'owner')) return { error: 'Blocked: ' + chk.blocks[0] + ' Only the owner can override the margin floor.' };
        G.log('quote', 'Owner overrode: ' + chk.blocks.join(' '), { opp: opp.id });
      }
      q.status = o.send ? 'sent' : 'draft';
      opp.quotes.push(q);
      if (o.send) { GC.moveOpp(opp, 'Quote sent'); sent(p, o.text, 'Email', { opp: opp.id }); }
      G.log('quote', 'Quote v' + q.v + ' ' + (o.send ? 'sent' : 'saved as draft') + ' — ' + GC.rupees(q.total), { opp: opp.id });
      return { ok: 'Quote v' + q.v + (o.send ? ' sent.' : ' saved as a draft.'), go: '#/opp/' + opp.id };
    },
    sourcing: function (p, o) {
      var pl = p.payload, win = o.winner != null ? +o.winner : pl.winner;
      var bid = pl.bids.filter(function (b) { return b.vi === win; })[0];
      if (!bid || bid.status !== 'quoted') return { error: 'Pick a vendor that quoted.' };
      var d = D();
      var rfq = { id: GC.uid('rfq'), pid: pl.pid, qty: pl.qty, mode: pl.mode, bids: pl.bids, rounds: pl.rounds, status: 'awarded',
                  winner: win, price: bid.price, lead: bid.lead, opp: pl.opp || null, at: GC.today(), by: G.me().id,
                  saving: ((G.P(pl.pid) || {}).cost - bid.price) * pl.qty };
      d.rfqs.unshift(rfq);
      var e = d.productEdits[pl.pid] = d.productEdits[pl.pid] || {};
      e.cost = bid.price; e.lead = bid.lead; G.dropCache(pl.pid);
      G.log('award', 'Awarded ' + (G.P(pl.pid) || {}).name + ' to ' + bid.name + ' at ₹' + GC.fmt(bid.price) + '/pc', { product: pl.pid, opp: pl.opp });
      return { ok: 'Awarded to ' + bid.name + '. The product\'s cost and lead time are updated.', go: '#/rfq/' + rfq.id };
    },
    intake: function (p, o) {
      var d = D(), db = G.db(), rows = p.payload.rows, added = 0, updated = 0, queued = 0;
      rows.forEach(function (r) {
        if (r.status === 'duplicate' && r.price) { var e = d.productEdits[r.dup] = d.productEdits[r.dup] || {}; e.price = r.price; G.dropCache(r.dup); updated++; }
        else if (r.status === 'ready') {
          var cat = db.cats[r.cat];
          var it = { id: 'RC-' + cat.code + '-N' + String(d.newProducts.length + 1).padStart(5, '0'), name: r.name, cat: r.cat, vendor: p.payload.vendor,
            price: r.price, occ: [0], rec: [0], pack: [0], attr: [], mat: [], color: '—', moq: r.moq || 50, stock: 0, lead: r.lead || 7,
            hue: (r.cat * 29) % 360, added: GC.today() };
          d.newProducts.push(it); added++;
        } else if (r.status === 'check') { d.intakeQueue.push(Object.assign({ vendor: p.payload.vendor, at: GC.today() }, r)); queued++; }
      });
      G.rebuildIndex();
      G.log('intake', 'Price list from ' + p.payload.vendorName + ': ' + added + ' added, ' + updated + ' re-priced, ' + queued + ' to check');
      return { ok: added + ' products added, ' + updated + ' re-priced, ' + queued + ' waiting for a person to check.', go: '#/vendors' };
    },
    followup: function (p, o) {
      var opp = G.oppById(p.target.id); if (!opp) return { error: 'That requirement is gone.' };
      D().followups.push(GC.newFollow({ opp: opp.id, company: opp.company, owner: p.payload.owner || opp.assigned_to, due: p.payload.due,
        method: 'WhatsApp', note: 'Agent nudge sent — check for a reply', auto: true, by: null }));
      if (o.send) sent(p, o.text, 'WhatsApp', { opp: opp.id });
      if (p.payload.escalate) G.log('follow', 'Escalated to the Sales Head: ' + opp.title, { opp: opp.id });
      opp.updated = GC.today();
      return { ok: (o.send ? 'Nudge sent and ' : '') + 'next follow-up booked for ' + p.payload.due + '.' };
    },
    orderwatch: function (p, o) {
      var ord = G.orderById(p.target.id); if (!ord) return { error: 'That order is gone.' };
      G.log('order_edit', 'Ops alerted on ' + ord.no + ': ' + p.summary, { order: ord.id });
      if (o.send && p.draft) { sent(p, o.text, 'Email', { order: ord.id }); ord.history.push({ stage: ord.stage, at: GC.today(), by: G.me().id, note: 'Client update sent' }); }
      return { ok: 'Ops alerted' + (o.send ? ' and the client updated' : '') + '.', go: '#/order/' + ord.id };
    },
    reorder: function (p, o) {
      var co = G.companyById(p.payload.company), last = G.orderById(p.payload.from);
      if (!co || !last) return { error: 'Missing client or order.' };
      var opp = GC.newOpp({ company: co.id, contact: last.contact, title: 'Reorder — ' + last.title.replace(/^Reorder — /, ''),
        stage: GC.T.stages[0], source: 'repeat', assigned_to: co.assigned_to, branch: co.branch,
        brief: { text: 'Repeat of last year\'s order', qty: last.lines[0] && last.lines[0].qty, deadline: GC.addDays(p.payload.anniv, -3) } });
      last.lines.forEach(function (l) { GC.addLine(opp, l.pid, l.qty); });
      D().opps.push(opp);
      if (o.send) sent(p, o.text, 'Email', { opp: opp.id });
      G.log('opp_new', 'Reorder opened for ' + co.name, { opp: opp.id, company: co.id });
      return { ok: 'Reorder requirement opened with last year\'s products on it.', go: '#/opp/' + opp.id };
    }
  };

  function decide(pid, approve, o) {
    o = o || {};
    var p = D().proposals.filter(function (x) { return x.id === pid; })[0];
    if (!p || p.status !== 'pending') return;
    if (!G.can('agents')) return G.toast('Approving agent work is switched off for your role.', 'bad');
    if (!approve) {
      p.status = 'rejected'; p.decided = GC.today(); p.decidedBy = G.me().id;
      markRun(p, 'rejected');
      G.log('agent_no', 'Rejected: ' + p.title, refsOf(p));
      G.save(); G.toast('Rejected. The agent will not propose it again for a few days.'); return G.go('#/desk');
    }
    var res = APPLY[p.agent] ? APPLY[p.agent](p, o) : { ok: 'Noted.' };
    if (res.error) { G.toast(res.error, 'bad'); return; }
    p.status = 'approved'; p.decided = GC.today(); p.decidedBy = G.me().id; p.sent = !!o.send;
    markRun(p, 'approved');
    G.log('agent_ok', 'Approved: ' + p.title, refsOf(p));
    G.save(); G.closeModal(); G.toast(res.ok, 'agent');
    G.go(res.go || '#/desk');
  }
  function markRun(p, st) { var r = D().runs.filter(function (x) { return x.id === p.runId; })[0]; if (r) r.status = st; }

  /* ================= views ================= */

  var FILTER = '';
  V.desk = function () {
    var d = D(), pend = G.pending();
    var mine = FILTER ? pend.filter(function (p) { return p.agent === FILTER; }) : pend;
    var month = d.runs.filter(function (r) { return G.inRange(r.at); });
    var approved = d.runs.filter(function (r) { return r.status === 'approved'; }).length, decided = d.runs.filter(function (r) { return r.status === 'approved' || r.status === 'rejected'; }).length;
    var hrs = Math.round(month.filter(function (r) { return r.status !== 'rejected'; }).reduce(function (a, r) { return a + (r.minutes || 0); }, 0) / 60);
    var h = '<div class="ph"><div><h1>Agent Desk</h1><p>What the agents did, and what is waiting for a person. Nothing reaches a client until someone approves it.</p></div>' +
      '<div class="acts"><button class="btn ghost" data-act="runSweep">↻ Run the sweep now</button></div></div>';
    h += G.rangeBar();
    h += G.kpis([[pend.length, 'Waiting for approval', pend.length ? 'warn' : 'ok'], [month.length, 'Agent runs in window'],
                 [decided ? Math.round(100 * approved / decided) + '%' : '—', 'Approval rate', null, 'Approved ÷ decided, all time, including sample history.'],
                 [hrs + ' h', 'Hours saved (est.)', null, 'Each agent carries an estimate of the manual minutes it replaces. Rejected runs do not count.']]);

    h += '<div class="split" style="margin-top:18px"><div><p class="eyebrow">Waiting for you <span class="pill ' + (pend.length ? 'agent' : 'dim') + '">' + pend.length + '</span></p>' +
      '<div class="row" style="margin-bottom:10px"><button class="chip" data-act="deskFilter" data-id="" aria-pressed="' + (!FILTER) + '">All</button>' +
      AG.AGENTS.filter(function (a) { return pend.some(function (p) { return p.agent === a.id; }); }).map(function (a) {
        return '<button class="chip" data-act="deskFilter" data-id="' + a.id + '" aria-pressed="' + (FILTER === a.id) + '">' + a.icon + ' ' + esc(a.name.replace(' agent', '')) + '</button>';
      }).join('') + '</div><div class="card pad0">' +
      (mine.length ? mine.map(function (p) {
        var a = AG.agentById(p.agent);
        return '<div class="qrow" data-act="go" data-id="#/proposal/' + p.id + '"><span class="ic">' + a.icon + '</span><div><h4>' + esc(p.title) + '</h4><p>' + esc(p.summary) + '</p>' +
          '<p style="margin-top:6px" class="row">' + G.pill(a.name, 'agent') + (p.clientFacing && p.draft ? G.pill('reaches the client', 'warn') : G.pill('internal', 'dim')) + ' ' + G.conf(p.confidence) + '</p></div>' +
          '<div style="text-align:right">' + (p.owner ? G.avatar(p.owner, true) : '') + '<div class="small muted">' + esc(G.when(p.at)) + '</div></div></div>';
      }).join('') : G.empty('Nothing waiting. The agents will queue work here as it arrives.')) + '</div>';

    h += '<p class="eyebrow">Recent runs</p><div class="card pad0">' + d.runs.slice(0, 20).map(function (r) {
      var a = AG.agentById(r.agent) || { icon: '•', name: r.agent };
      return '<div class="item" data-act="go" data-id="#/run/' + r.id + '" style="cursor:pointer"><span class="thumb" style="width:30px;height:30px;background:var(--agent);font-size:13px">' + a.icon + '</span><div class="grow"><h4>' + esc(r.title) + '</h4><p>' + esc(r.summary) + '</p></div>' +
        G.pill(r.status === 'auto' ? 'done automatically' : r.status, r.status === 'approved' ? 'ok' : r.status === 'rejected' ? 'bad' : r.status === 'pending' ? 'warn' : 'info') + (r.demo ? ' <span class="pill dim" title="Seeded history">sample</span>' : '') + '</div>';
    }).join('') + '</div></div>';

    h += '<div><p class="eyebrow">The team of agents</p><div class="card pad0">' + AG.AGENTS.map(function (a) {
      var m = mode(a.id);
      return '<div class="item"><span class="thumb" style="width:34px;height:34px;background:var(--agent);font-size:15px">' + a.icon + '</span><div class="grow"><h4>' + esc(a.name) + ' ' + G.pill(m === 'auto' ? 'Auto (internal)' : m === 'off' ? 'Off' : 'Suggests', m === 'off' ? 'dim' : m === 'auto' ? 'ok' : 'info') + '</h4>' +
        '<p><b style="font-weight:600;color:var(--ink2)">When:</b> ' + esc(a.trigger) + '</p><p>' + esc(a.does) + '</p></div></div>';
    }).join('') + '</div><p class="honest">In this demo the agents are deterministic rules running on local data, so the story is repeatable. In production the reading and writing steps are Gemini calls that return the same shapes' +
      (localKey() ? ' — and a Gemini key is set in this browser, so the Brief agent can re-read messages with it.' : '. Add a Gemini key in Settings → Connections to try that live.') + '</p></div></div>';
    return h;
  };

  V.proposal = function (id) {
    var p = D().proposals.filter(function (x) { return x.id === id; })[0];
    if (!p) return G.deny('That proposal is gone.', 'It may have been decided already.');
    var a = AG.agentById(p.agent);
    var h = '<div class="ph"><div><p class="muted small">' + a.icon + ' ' + esc(a.name) + ' · ' + esc(G.when(p.at)) + '</p><h1>' + esc(p.title) + '</h1><p>' + esc(p.summary) + '</p></div>' +
      '<div class="acts">' + targetLink(p) + '</div></div>';
    h += '<div class="split"><div>' + body(p) + '</div><div>';
    h += '<div class="agentcard"><span class="tag">How the agent got here</span>' + G.stepsHTML(p.steps) + '<p>' + G.conf(p.confidence) + '</p></div>';
    if (p.status === 'pending') {
      h += '<div class="card" style="margin-top:14px">';
      if (p.draft) h += '<h3>' + (p.clientFacing ? 'Message to the client' : 'Draft') + ' · ' + esc(p.draft.channel) + '</h3><textarea id="draftText" style="min-height:220px">' + esc(p.draft.text) + '</textarea>' +
        '<p class="honest">Edit before sending. In the demo nothing leaves this browser; in production this goes out on ' + esc(p.draft.channel) + ' from ' + esc(GC.T.name) + '\'s own number or address.</p>';
      if (p.agent === 'brief' && localKey()) h += '<p><button class="btn ghost sm" data-act="geminiBrief" data-id="' + p.id + '">✦ Re-read with Gemini</button></p>';
      var can = G.can('agents');
      h += can ? '<div class="row" style="margin-top:12px">' +
        (p.draft && p.clientFacing ? '<button class="btn agent" data-act="approveSend" data-id="' + p.id + '">Approve & send</button><button class="btn ghost" data-act="approveOnly" data-id="' + p.id + '">Approve, don\'t send</button>'
                                   : '<button class="btn agent" data-act="approveOnly" data-id="' + p.id + '">Approve</button>') +
        '<button class="btn ghost" data-act="reject" data-id="' + p.id + '">Reject</button></div>'
        : '<p class="notice warn">Approving agent work is switched off for your role. Someone with that access will see this on their desk.</p>';
      h += '</div>';
    } else {
      h += '<div class="card" style="margin-top:14px"><h3>' + (p.status === 'approved' ? 'Approved' : 'Rejected') + '</h3><p class="muted">' + esc(GC.staffName(p.decidedBy)) + ' · ' + esc(p.decided || '') + (p.sent ? ' · message sent' : '') + '</p>' +
        (p.draft ? '<div class="draft">' + esc(p.draft.text) + '</div>' : '') + '</div>';
    }
    return h + '</div></div>';
  };
  function targetLink(p) {
    var t = p.target || {};
    if (t.kind === 'opp' && G.oppById(t.id)) return '<a class="btn ghost" href="#/opp/' + t.id + '">Open the requirement</a>';
    if (t.kind === 'order' && G.orderById(t.id)) return '<a class="btn ghost" href="#/order/' + t.id + '">Open the order</a>';
    if (t.kind === 'company' && G.companyById(t.id)) return '<a class="btn ghost" href="#/company/' + t.id + '">Open the client</a>';
    if (t.kind === 'product') return '<a class="btn ghost" href="#/product/' + t.id + '">Open the product</a>';
    return '';
  }

  /* What the proposal actually proposes, per agent. */
  function body(p) {
    var pl = p.payload || {}, h = '';
    if (p.agent === 'brief') {
      var b = pl.brief || {}, w = pl.who || {};
      var m = D().messages.filter(function (x) { return x.proposal === p.id; })[0];
      if (m) h += '<div class="card" style="margin-bottom:14px"><h3>The message · ' + esc(m.channel) + '</h3><div class="draft" style="border-style:solid;border-color:var(--line)">' + esc(m.text) + '</div></div>';
      h += '<div class="card"><h3>What the agent understood</h3><dl class="kv">' +
        kv('Company', (w.company || '—') + (pl.company ? ' (existing client)' : ' (new)')) + kv('Contact', w.name || '—') + kv('Mobile', w.mobile ? G.mob(w.mobile) : '—') + kv('Email', w.email || '—') +
        kv('Occasion', b.occasion || '—') + kv('For', b.recipients || '—') + kv('Quantity', b.qty ? GC.fmt(b.qty) : '—') +
        kv('Budget each', b.budgetMax ? (b.budgetMin ? '₹' + GC.fmt(b.budgetMin) + ' – ' : 'up to ') + '₹' + GC.fmt(b.budgetMax) : '—') +
        kv('Deliver by', b.deadline || '—') + kv('Cities', (b.cities || []).join(', ') || '—') + kv('Branding', b.branding || '—') + kv('UCPMP', b.ucpmp ? 'Yes — doctors' : 'No') + '</dl>' +
        (pl.missing && pl.missing.length ? '<p class="notice warn" style="margin-top:12px">Still missing: ' + esc(pl.missing.join(', ')) + '. The reply asks for them.</p>' : '<p class="notice ok" style="margin-top:12px">Complete — approving opens the requirement and the Curator starts immediately.</p>') + '</div>';
    } else if (p.agent === 'curator') {
      var opp = G.oppById(p.target.id);
      h += '<div class="card pad0"><div class="hd"><h3>' + pl.picks.length + ' options' + (pl.relaxed.length ? ' · relaxed ' + esc(pl.relaxed.join(', ')) : '') + '</h3><span class="muted small">Untick any you do not want</span></div>' +
        pl.picks.map(function (x) {
          var pr = G.P(x.pid);
          return '<div class="item"><input type="checkbox" class="pickbox" value="' + esc(x.pid) + '" checked style="margin-top:14px;width:16px;height:16px;accent-color:var(--brand)" title="Keep on the shortlist">' + (G.photo ? G.photo(pr) : G.thumb(pr)) + '<div class="grow" data-act="peekProduct" data-id="' + esc(x.pid) + '" data-why="' + esc(x.why.join(' · ')) + '" style="cursor:pointer"><h4><span style="color:var(--brand)">' + esc(x.name) + '</span> <span class="small muted">— tap to open</span></h4><p>' + esc(pr ? pr.vendorName : '') + ' · ₹' + GC.fmt(x.price) + ' · MOQ ' + (pr ? pr.moq : '—') + (G.can('cost') ? ' · margin ' + x.marginPct + '%' : '') + '</p><p>' + esc(x.why.join(' · ')) + '</p></div>' + G.pill(x.score + '', 'agent') + '</div>';
        }).join('') + '</div>' + (opp ? '<p class="honest">For ' + esc(opp.title) + ' — ' + esc(opp.brief.text || '') + '</p>' : '');
    } else if (p.agent === 'proposal') {
      h += quoteTable(pl.quote) + complianceBox(pl.compliance);
    } else if (p.agent === 'sourcing') {
      var pr2 = G.P(pl.pid);
      h += '<div class="card pad0"><div class="hd"><h3>' + (pl.mode === 'auction' ? 'Reverse auction' : 'Sealed RFQ') + ' · ' + esc(pr2 ? pr2.name : '') + ' × ' + GC.fmt(pl.qty) + '</h3>' + (G.can('cost') ? '<span class="small muted">Current cost ' + G.cost(pr2 && pr2.cost) + '</span>' : '') + '</div>' + bidsTable(pl, true) + '</div>' +
        (pl.rounds && pl.rounds.length ? '<p class="honest">Rounds: ' + pl.rounds.map(function (r) { return 'R' + r.round + ' low ₹' + GC.fmt(r.low); }).join(' → ') + '</p>' : '') +
        '<p class="honest">Replies are simulated in the demo (the same every time). On the vendor portal a vendor answers for real.</p>';
    } else if (p.agent === 'intake') {
      h += '<div class="card pad0 scroller"><div class="hd"><h3>' + esc(pl.vendorName) + ' · ' + pl.rows.length + ' rows</h3></div><table class="tbl"><thead><tr><th>Row</th><th>Product</th><th class="num">Price</th><th>MOQ</th><th>Category</th><th>Tags</th><th>Result</th></tr></thead><tbody>' +
        pl.rows.map(function (r) { return '<tr><td>' + r.row + '</td><td><b>' + esc(r.name || '(blank)') + '</b></td><td class="num">' + (r.price ? '₹' + GC.fmt(r.price) : '—') + '</td><td>' + (r.moq || '—') + '</td><td>' + esc(r.catName) + '</td><td class="small">' + esc(r.tags.join(', ')) + '</td><td>' + G.pill(r.status === 'duplicate' ? 'updates existing' : r.status === 'ready' ? 'ready' : 'a person checks', r.status === 'ready' ? 'ok' : r.status === 'duplicate' ? 'info' : 'warn') + ' <span class="small muted">' + Math.round(r.conf * 100) + '%</span></td></tr>'; }).join('') + '</tbody></table></div>';
    } else if (p.agent === 'orderwatch') {
      var o = G.orderById(p.target.id);
      h += '<div class="card"><h3>' + esc(o ? o.no + ' · ' + o.title : 'Order') + '</h3>' + (pl.risks || []).map(function (r) { return '<div class="notice ' + (r.sev === 'bad' ? 'bad' : 'warn') + '">' + esc(r.text) + '</div>'; }).join('') +
        (pl.vendor != null && o ? '<button class="btn ghost" data-act="sourceFaster" data-id="' + o.id + '">⇄ Ask the Sourcing agent for a faster vendor</button>' : '') + '</div>';
    } else if (p.agent === 'reorder') {
      var last = G.orderById(pl.from);
      h += '<div class="card"><h3>Last year</h3>' + (last ? '<p>' + esc(last.title) + ' · ' + esc(last.created) + ' · ' + GC.money(last.value) + '</p><ul>' + last.lines.map(function (l) { return '<li>' + esc(l.name) + ' × ' + GC.fmt(l.qty) + '</li>'; }).join('') + '</ul>' : '') +
        '<p class="muted">Approving opens a requirement with these products shortlisted, owned by the account manager.</p></div>';
    } else if (p.agent === 'followup') {
      var op = G.oppById(p.target.id);
      h += '<div class="card"><h3>' + esc(op ? op.title : '') + '</h3><p class="muted">' + esc(p.summary) + '</p><p>Approving books the next follow-up for ' + esc(p.payload.due) + (p.payload.escalate ? ' and escalates to the Sales Head' : '') + '.</p></div>';
    }
    return h;
  }
  function kv(k, v) { return '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>'; }
  function quoteTable(q) {
    if (!q) return '';
    var cost = G.can('cost');
    return '<div class="card pad0 scroller"><div class="hd"><h3>Quote v' + q.v + '</h3><span class="small muted">valid till ' + esc(q.validTill) + '</span></div><table class="tbl"><thead><tr><th>Product</th><th class="num">Qty</th><th class="num">Unit</th><th>Branding</th><th class="num">GST</th><th class="num">Total</th>' + (cost ? '<th class="num">Margin</th>' : '') + '</tr></thead><tbody>' +
      q.lines.map(function (l) { return '<tr><td><b>' + esc(l.name) + '</b><small>' + esc(l.vendor) + ' · HSN ' + esc(l.hsn) + '</small></td><td class="num">' + GC.fmt(l.qty) + '</td><td class="num">₹' + GC.fmt(l.unit) + '</td><td>' + (l.branding ? esc(l.branding) + ' <small>+₹' + GC.fmt(l.brandCost) + '</small>' : '—') + '</td><td class="num">' + l.gstRate + '%</td><td class="num">' + GC.rupees(l.total) + '</td>' + (cost ? '<td class="num">' + GC.rupees(l.margin) + '</td>' : '') + '</tr>'; }).join('') +
      '<tr><td colspan="' + (cost ? 5 : 4) + '" class="num">Taxable ' + GC.rupees(q.taxable) + ' · GST ' + GC.rupees(q.gst) + '</td><td class="num"><b>' + GC.rupees(q.total) + '</b></td>' + (cost ? '<td class="num"><b>' + q.marginPct + '%</b></td>' : '') + '</tr></tbody></table></div>';
  }
  function complianceBox(c) {
    if (!c) return '';
    return '<div class="card" style="margin-top:14px"><h3>⚖ Compliance check</h3>' + (c.ok ? '<div class="notice ok">Clear to send.</div>' : '') +
      c.blocks.map(function (b) { return '<div class="notice bad">✕ ' + esc(b) + '</div>'; }).join('') + c.warns.map(function (w) { return '<div class="notice warn">! ' + esc(w) + '</div>'; }).join('') + '</div>';
  }
  function bidsTable(pl, choose) {
    var cost = G.can('cost');
    return '<table class="tbl"><thead><tr>' + (choose ? '<th></th>' : '') + '<th>Vendor</th><th class="num">Price / pc</th><th class="num">Lead</th><th class="num">Rating</th><th class="num">On time</th><th class="num">Score</th></tr></thead><tbody>' +
      pl.bids.slice().sort(function (a, b) { return (b.score || -1) - (a.score || -1); }).map(function (b) {
        var win = b.vi === pl.winner;
        return '<tr>' + (choose ? '<td>' + (b.status === 'quoted' ? '<input type="radio" name="winner" value="' + b.vi + '"' + (win ? ' checked' : '') + '>' : '') + '</td>' : '') +
          '<td><b>' + esc(b.name) + '</b>' + (win ? ' ' + G.pill('recommended', 'agent') : '') + (b.status === 'declined' ? '<small>' + esc(b.note) + '</small>' : '') + '</td>' +
          '<td class="num">' + (b.status === 'quoted' ? (cost ? '₹' + GC.fmt(b.price) : '₹ ••••') : G.pill('declined', 'dim')) + '</td><td class="num">' + (b.lead ? b.lead + ' d' : '—') + '</td><td class="num">' + b.rating + '★</td><td class="num">' + b.ontime + '%</td><td class="num">' + (b.score != null ? '<b>' + b.score + '</b>' : '—') + '</td></tr>';
      }).join('') + '</tbody></table>';
  }
  G.quoteTable = quoteTable; G.complianceBox = complianceBox; G.bidsTable = bidsTable;

  V.run = function (id) {
    var r = D().runs.filter(function (x) { return x.id === id; })[0];
    if (!r) return G.deny('No such run.', '');
    var p = D().proposals.filter(function (x) { return x.runId === id; })[0];
    if (p) return V.proposal(p.id);
    var a = AG.agentById(r.agent) || { name: r.agent, icon: '•' };
    return '<div class="ph"><div><p class="muted small">' + a.icon + ' ' + esc(a.name) + ' · ' + esc(String(r.at).slice(0, 16).replace('T', ' ')) + '</p><h1>' + esc(r.title) + '</h1><p>' + esc(r.summary) + '</p></div></div>' +
      '<div class="agentcard"><span class="tag">' + (r.status === 'auto' ? 'Done automatically — internal only' : esc(r.status)) + '</span>' + (r.steps && r.steps.length ? G.stepsHTML(r.steps) : '<p class="muted">Sample history — the trace was not kept.</p>') + '</div>';
  };

  /* ================= settings tabs owned by this file ================= */

  G.SETTINGS.agents = function () {
    return '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Agent</th><th>Starts when</th><th>Autonomy</th></tr></thead><tbody>' + AG.AGENTS.map(function (a) {
      var m = mode(a.id);
      return '<tr><td><b>' + a.icon + ' ' + esc(a.name) + '</b><small>' + esc(a.does) + '</small></td><td>' + esc(a.trigger) + '</td><td><select data-chg="setAgentMode" data-id="' + a.id + '" style="width:auto">' +
        [['off', 'Off'], ['suggest', 'Suggest — a person approves'], ['auto', 'Auto — internal steps only']].map(function (o) { return '<option value="' + o[0] + '"' + (m === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></td></tr>';
    }).join('') + '</tbody></table></div><p class="honest">Whatever the setting, anything that reaches a client — a reply, a quote, an update — waits for a person to approve it. "Auto" lets an agent do internal work on its own: alerts, follow-ups, notes.</p>';
  };

  function localKey() { try { return localStorage.getItem('gc_gemini_key') || ''; } catch (e) { return ''; } }
  G.SETTINGS.connections = function () {
    var k = localKey();
    var rows = [
      ['Gemini (Google AI)', 'The Brief and Proposal agents read and write with it.', k ? 'Key set in this browser' : 'Not connected', k ? 'ok' : 'dim', 'A Gemini API key. Paste one below to try it live — it stays in this browser only.'],
      ['WhatsApp Business', 'Agent drafts go out from ' + GC.T.name + '\'s number.', 'Setting up', 'warn', 'Meta business verification and a WhatsApp Cloud API number.'],
      ['Email', 'Quotes, proposals and client updates.', 'Setting up', 'warn', 'Google Workspace or SMTP credentials for ' + GC.T.email + '.'],
      ['IndiaMART / TradeIndia', 'Enquiries flow straight into the Inbox.', 'Setting up', 'warn', 'The CRM API key from each portal.'],
      ['Tally', 'Invoices and payments sync.', 'Setting up', 'warn', 'The Tally connector on the accounts PC (Tally talks XML on port 9000).'],
      ['Client portal', 'Order status and artwork approval for clients.', 'Live in the demo', 'ok', 'Nothing — it is part of the cockpit.'],
      ['Vendor portal', 'Vendors answer RFQs and upload price lists.', 'Live in the demo', 'ok', 'Nothing — it is part of the cockpit.'],
      ['Employee gift picker', 'Staff of a client choose their own gift.', 'Live in the demo', 'ok', 'Nothing — it is part of the cockpit.']
    ];
    return '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Connection</th><th>What it does</th><th>Status</th><th>What it needs</th></tr></thead><tbody>' + rows.map(function (r) {
      return '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + G.pill(r[2], r[3]) + '</td><td class="small">' + esc(r[4]) + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
      '<form class="card" style="margin-top:16px;max-width:620px" data-submit="saveGemini"><h3>Gemini key (optional)</h3><p class="muted small">Stored only in this browser, never in the demo data, never sent anywhere except Google\'s API. Without it, the agents use their built-in rules.</p>' +
      '<div class="row"><input type="password" name="key" placeholder="AIza…" value="' + (k ? '••••••••' : '') + '" style="max-width:320px"><button class="btn">Save</button>' + (k ? '<button type="button" class="btn ghost" data-act="testGemini">Test</button><button type="button" class="btn ghost" data-act="clearGemini">Remove</button>' : '') + '</div></form>';
  };

  /* One call, JSON out. Used only when a key is present. */
  function llm(prompt) {
    var key = localKey();
    if (!key) return Promise.reject(new Error('No Gemini key'));
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(key), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } })
    }).then(function (r) { if (!r.ok) throw new Error('Gemini said ' + r.status); return r.json(); })
      .then(function (j) { return JSON.parse(j.candidates[0].content.parts[0].text); });
  }
  G.llm = llm;

  /* ================= actions ================= */

  Object.assign(A, {
    deskFilter: function (id) { FILTER = id || ''; G.render(); },
    runSweep: function () {
      var before = D().proposals.filter(function (p) { return p.status === 'pending'; }).length;
      autopilot();
      var after = D().proposals.filter(function (p) { return p.status === 'pending'; }).length;
      G.toast('Sweep done — ' + (after - before > 0 ? (after - before) + ' new proposal(s).' : 'nothing new.'), 'agent'); G.render();
    },
    approveSend: function (id) { decide(id, true, { send: true, text: val('draftText'), picks: picks(), winner: radio('winner') }); },
    approveOnly: function (id) { decide(id, true, { send: false, text: val('draftText'), picks: picks(), winner: radio('winner') }); },
    reject: function (id) { decide(id, false); },
    setAgentMode: function (v, el) { D().tenant.agents = Object.assign({}, GC.T.agents, D().tenant.agents || {}); D().tenant.agents[el.dataset.id] = v; G.applyTenant(); G.log('settings', AG.agentById(el.dataset.id).name + ' set to ' + v); G.save(); G.render(); },
    saveGemini: function (f) {
      if (!f.key || /^•+$/.test(f.key)) return G.toast('Paste a key first.', 'bad');
      try { localStorage.setItem('gc_gemini_key', f.key.trim()); } catch (e) {}
      G.toast('Saved in this browser. Try Test.'); G.render();
    },
    clearGemini: function () { try { localStorage.removeItem('gc_gemini_key'); } catch (e) {} G.render(); },
    testGemini: function () {
      G.toast('Asking Gemini…');
      llm('Return JSON {"ok":true,"said":"<five words about corporate gifting>"}').then(function (j) { G.toast('Gemini answered: ' + (j.said || 'ok'), 'agent'); })
        .catch(function (e) { G.toast('Gemini did not answer: ' + e.message, 'bad'); });
    },
    geminiBrief: function (id) {
      var p = D().proposals.filter(function (x) { return x.id === id; })[0];
      var m = D().messages.filter(function (x) { return x.proposal === id; })[0];
      if (!p || !m) return;
      G.toast('Gemini is reading the message…', 'agent');
      llm('Extract a corporate gifting enquiry as JSON with keys company, name, mobile, email, qty (number), budgetMin (number, rupees per gift), budgetMax (number), deadline (YYYY-MM-DD, today is ' + GC.today() + '), cities (array), occasion, recipients, branding, ucpmp (true if gifts are for doctors/healthcare professionals). Use null when not stated.\n\nMessage:\n' + m.text)
        .then(function (j) {
          var b = p.payload.brief, w = p.payload.who;
          ['qty', 'budgetMin', 'budgetMax', 'deadline', 'occasion', 'recipients', 'branding'].forEach(function (k) { if (j[k] != null && j[k] !== '') b[k] = j[k]; });
          if (Array.isArray(j.cities) && j.cities.length) b.cities = j.cities;
          if (j.ucpmp === true) b.ucpmp = true;
          ['company', 'name', 'mobile', 'email'].forEach(function (k) { if (j[k]) w[k] = String(j[k]); });
          p.payload.missing = ['qty', 'budgetMax', 'deadline'].filter(function (k) { return !b[k]; });
          p.steps.push({ t: 'Re-read with Gemini', d: 'gemini-2.5-flash returned the fields above; they replace the rule-based guesses.' });
          G.save(); G.toast('Gemini re-read it.', 'agent'); G.render();
        }).catch(function (e) { G.toast('Gemini did not answer: ' + e.message, 'bad'); });
    },
    sourceFaster: function (orderId) {
      var o = G.orderById(orderId), risk = GC.orderRisks(o).filter(function (x) { return x.vendor != null; })[0];
      var po = o.vendorPOs.filter(function (v) { return risk && v.vendor === risk.vendor; })[0];
      if (!po) return;
      var line = o.lines.filter(function (l) { return po.pids.indexOf(l.pid) >= 0; })[0];
      var pr = runAgent('sourcing', { pid: po.pids[0], qty: line ? line.qty : 100, deadline: o.deadline, mode: 'rfq' }, { manual: true });
      if (pr) G.go('#/proposal/' + pr.id);
    }
  });
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function picks() { var b = document.querySelectorAll('.pickbox'); return b.length ? Array.prototype.filter.call(b, function (x) { return x.checked; }).map(function (x) { return x.value; }) : null; }
  function radio(n) { var r = document.querySelector('input[name="' + n + '"]:checked'); return r ? r.value : null; }
})();
