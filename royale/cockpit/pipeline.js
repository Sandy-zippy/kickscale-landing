/* The sales board and the requirement page: the brief, the shortlist, quote
   versions, samples, follow-ups, compliance, and closing it — won with a PO
   (which opens the order) or lost with a reason. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS, esc = G.esc;
  var D = function () { return G.D(); };

  /* Open for editing. Read view first; editing is a deliberate act. */
  var EDITING = {};

  var BF = { who: '', q: '' };
  V.pipeline = function () {
    var u = G.me();
    var filt = function (o) {
      if (!G.inScope(o)) return false;
      if (BF.who === 'me' && o.assigned_to !== u.id) return false;
      if (BF.q) { var co = G.companyById(o.company); if ((o.title + ' ' + (co ? co.name : '')).toLowerCase().indexOf(BF.q.toLowerCase()) < 0) return false; }
      return true;
    };
    var cols = GC.pipelineByStage(D().opps, filt);
    var total = 0;
    GC.T.stages.forEach(function (s) { cols[s].forEach(function (o) { total += GC.oppValue(o, G.P); }); });
    var quiet = GC.needsAttention(D().opps.filter(filt), D().followups);
    var h = '<div class="ph"><div><h1>Pipeline</h1><p>' + GC.T.stages.reduce(function (a, s) { return a + cols[s].length; }, 0) + ' open requirements worth ' + GC.money(total) + '. Won and lost ones move onto the client\'s record.</p></div>' +
      '<div class="acts"><a class="btn" href="#/oppnew">+ New requirement</a></div></div>';
    if (quiet.length) h += '<div class="notice warn">' + quiet.length + ' requirement' + (quiet.length > 1 ? 's have' : ' has') + ' no follow-up booked, or an overdue one. They are marked on the board.</div>';
    h += '<div class="row" style="margin-bottom:12px"><input data-input="boardSearch" id="boardSearch" value="' + esc(BF.q) + '" placeholder="Search requirement or company" style="max-width:280px">' +
      (G.acc().scope !== 'own' ? '<button class="chip" data-act="boardWho" data-id="" aria-pressed="' + (!BF.who) + '">Everyone</button><button class="chip" data-act="boardWho" data-id="me" aria-pressed="' + (BF.who === 'me') + '">Mine</button>' : '') + '</div>';
    h += '<div class="board">' + GC.T.stages.map(function (s) {
      var list = cols[s], v = list.reduce(function (a, o) { return a + GC.oppValue(o, G.P); }, 0);
      return '<div class="col"><h4 title="' + esc(GC.T.stageHelp[s] || '') + '">' + esc(s) + ' <small>' + list.length + ' · ' + GC.money(v) + '</small></h4>' + list.map(function (o) {
        var co = G.companyById(o.company), nf = GC.nextFollow(D().followups, o.id);
        var risk = GC.atRisk(D().followups, o.id), quietOne = quiet.indexOf(o) >= 0;
        var agentWaiting = D().proposals.some(function (p) { return p.status === 'pending' && p.target && p.target.id === o.id; });
        return '<div class="deal' + (risk ? ' risk' : quietOne ? ' warnl' : '') + '" data-act="go" data-id="#/opp/' + o.id + '"><b>' + esc(o.title) + '</b><span class="co">' + esc(co ? co.name : '') + '</span>' +
          '<div class="foot"><span>' + (o.lines.length ? GC.money(GC.oppValue(o, G.P)) : '<span class="muted">not priced yet</span>') + '</span><span class="row">' + (agentWaiting ? G.pill('✦', 'agent') : '') + (o.brief.ucpmp ? G.pill('UCPMP', 'warn') : '') + G.avatar(o.assigned_to, true) + '</span></div>' +
          '<div class="small ' + (nf && GC.isOverdue(nf) ? '' : 'muted') + '" style="margin-top:4px;' + (nf && GC.isOverdue(nf) ? 'color:var(--bad)' : '') + '">' + (nf ? 'Next: ' + esc(G.when(nf.due)) : 'Nothing booked') + (risk ? ' · at risk' : '') + '</div></div>';
      }).join('') + '</div>';
    }).join('') + '</div>';
    return h;
  };

  /* ================= a requirement ================= */

  V.opp = function (id) {
    var o = G.oppById(id);
    if (!o) return G.deny('No such requirement.', '');
    if (!G.canOpen(o)) return G.deny('This requirement belongs to ' + GC.staffName(o.assigned_to), 'Ask them, or the Sales Head, if you need access.');
    var co = G.companyById(o.company), ct = G.contactById(o.contact), open = GC.isOpen(o);
    var val = GC.oppValue(o, G.P), cost = G.can('cost');
    var h = '<div class="stickyhead"><div class="ph"><div><p class="muted small"><a href="#/company/' + (co ? co.id : '') + '">' + esc(co ? co.name : 'No company') + '</a>' + (ct ? ' · ' + esc(ct.name) + ' (' + esc(ct.role) + ')' : '') + ' · via ' + esc(GC.T.sources[o.source] || o.source) + '</p>' +
      '<h1>' + esc(o.title) + '</h1><p>' + G.pill(o.stage, o.stage === 'Won' ? 'ok' : o.stage === 'Lost' ? 'bad' : 'info') + ' ' + GC.money(val) + ' · owner ' + esc(GC.staffName(o.assigned_to)) + ' · opened ' + esc(o.created) +
      (o.brief.deadline ? ' · deliver by <b>' + esc(o.brief.deadline) + '</b> (' + GC.daysBetween(GC.today(), o.brief.deadline) + ' days)' : '') + '</p></div>' +
      '<div class="acts"><button class="btn ghost" data-act="editOppToggle" data-id="' + id + '">' + (EDITING[id] ? 'Done editing' : 'Edit details') + '</button>' + (open ? '<button class="btn ghost" data-act="logFollow" data-id="' + id + '">Log a conversation</button><button class="btn" data-act="winOpp" data-id="' + id + '">Won — PO in hand</button><button class="btn ghost" data-act="loseOpp" data-id="' + id + '">Lost</button>'
        : o.order ? '<a class="btn" href="#/order/' + o.order + '">Open the order →</a>' : '') + '</div></div>';
    if (open) h += '<div class="stagebar">' + GC.T.stages.map(function (s, i) {
      var cur = GC.T.stages.indexOf(o.stage);
      return '<button class="' + (s === o.stage ? 'on' : i < cur ? 'done' : '') + '" data-act="moveOpp" data-id="' + id + '|' + esc(s) + '" title="' + esc(GC.T.stageHelp[s] || '') + '">' + esc(s) + '</button>';
    }).join('') + '</div>';
    h += '</div>';
    if (EDITING[id]) h += editCard(o, id, co);
    if (o.stage === 'Lost') h += '<div class="notice bad">Lost on ' + esc(o.closed) + ' — ' + esc(o.lost_reason || 'no reason') + '. <button class="btn sm ghost" data-act="reopenOpp" data-id="' + id + '">Reopen</button></div>';
    var waiting = D().proposals.filter(function (p) { return p.status === 'pending' && p.target && p.target.id === id; });
    waiting.forEach(function (p) {
      var a = AG.agentById(p.agent);
      h += '<div class="notice agent">' + a.icon + ' <b>' + esc(a.name) + '</b> ' + esc(p.summary) + ' <a class="btn agent sm" href="#/proposal/' + p.id + '">Review</a></div>';
    });

    h += '<div class="split"><div>';
    /* the shortlist */
    var lines = o.lines;
    var q = lines.length ? GC.buildQuote(o, G.P) : null;
    h += '<div class="card pad0"><div class="hd"><h3>Shortlist · ' + GC.inPlay(o).length + ' in play</h3><span class="row">' +
      (open ? '<button class="btn agent sm" data-act="runCurator" data-id="' + id + '">✦ Ask the Curator</button><a class="btn ghost sm" href="#/discover">⌕ Discover</a>' : '') + '</span></div>';
    h += lines.length ? '<div class="scroller"><table class="tbl"><thead><tr><th>Product</th><th>Qty</th><th class="num">Unit</th><th>Branding</th><th>Mark</th>' + (cost ? '<th class="num">Margin</th>' : '') + '</tr></thead><tbody>' + lines.map(function (l) {
      var p = G.P(l.pid); if (!p) return '';
      var qty = l.qty || o.brief.qty || p.moq, unit = GC.unitPrice(p, qty);
      var rej = l.mark === 'rejected';
      var acts = open ? '<div class="row" style="margin-top:6px;gap:4px"><button class="minibtn" data-act="sendSample" data-id="' + id + '|' + esc(l.pid) + '">Send sample</button>' + (G.can('vendors') ? '<button class="minibtn" data-act="lineSource" data-id="' + id + '|' + esc(l.pid) + '">⇄ Vendor prices</button>' : '') + '<button class="minibtn" data-act="lineRemove" data-id="' + id + '|' + esc(l.pid) + '">Remove</button></div>' : '';
      return '<tr style="' + (rej ? 'opacity:.5' : '') + '"><td style="min-width:260px"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">' + G.photo(p) + '<span><a href="#" data-act="peekProduct" data-id="' + esc(p.id) + '|opp/' + id + '"><b>' + esc(p.name) + '</b></a><small>' + esc(p.vendorName) + ' · MOQ ' + p.moq + ' · ' + p.lead + ' d' + (p.ucpmp ? ' · UCPMP-safe' : '') + (p.sample ? ' · sample in office' : '') + '</small>' + acts + '</span></div></td>' +
        '<td>' + (open ? '<input type="number" style="width:84px" data-chg="lineQty" data-id="' + id + '|' + esc(l.pid) + '" value="' + qty + '">' : GC.fmt(qty)) + (qty < p.moq ? '<small style="color:var(--warn)">under MOQ</small>' : '') + '</td>' +
        '<td class="num">₹' + GC.fmt(unit) + '</td>' +
        '<td>' + (open && p.branding.length ? '<select data-chg="lineBrand" data-id="' + id + '|' + esc(l.pid) + '" style="width:auto;font-size:12px"><option value="">None</option>' + p.branding.map(function (b) { return '<option' + (l.branding === b ? ' selected' : '') + '>' + esc(b) + '</option>'; }).join('') + '</select>' : esc(l.branding || '—')) + '</td>' +
        '<td>' + (open ? '<select data-chg="lineMark" data-id="' + id + '|' + esc(l.pid) + '" style="width:auto;font-size:12px">' + Object.keys(GC.MARKS).map(function (m) { return '<option value="' + m + '"' + (l.mark === m ? ' selected' : '') + '>' + GC.MARKS[m] + '</option>'; }).join('') + '</select>' : G.pill(GC.MARKS[l.mark] || l.mark, 'info')) + '</td>' +
        (cost ? '<td class="num">' + Math.round(100 * (unit - p.cost) / unit) + '%</td>' : '') + '</tr>';
    }).join('') + '</tbody></table></div>' : G.empty('Nothing shortlisted yet. Ask the Curator — it searches the whole catalogue against this brief.');
    if (q && q.lines.length) h += '<div class="between" style="padding:12px 16px;border-top:1px solid var(--line)"><span class="muted">In play: taxable ' + GC.rupees(q.taxable) + ' + GST ' + GC.rupees(q.gst) + ' = <b style="color:var(--ink)">' + GC.rupees(q.total) + '</b>' + (cost ? ' · margin ' + q.marginPct + '%' : '') + '</span>' +
      (open ? '<span class="row"><button class="btn agent sm" data-act="runProposal" data-id="' + id + '">✦ Draft the proposal</button><button class="btn ghost sm" data-act="saveQuote" data-id="' + id + '">Save quote version</button></span>' : '') + '</div>';
    h += '</div>';
    if (q && q.lines.length && open) h += G.complianceBox(GC.compliance(q, o, co, GC.T.rules));

    /* quote versions */
    if (o.quotes.length) h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>Quotes</h3></div>' + o.quotes.slice().reverse().map(function (qq) {
      return '<div class="item"><div class="grow"><h4>v' + qq.v + ' · ' + GC.rupees(qq.total) + (cost ? ' · margin ' + qq.marginPct + '%' : '') + '</h4><p>' + esc(qq.at) + ' · ' + qq.lines.length + ' lines · valid till ' + esc(qq.validTill) + ' · by ' + esc(GC.staffName(qq.by)) + '</p></div>' + G.pill(qq.status, qq.status === 'sent' ? 'ok' : 'dim') +
        ' <button class="minibtn" data-act="printQuote" data-id="' + id + '|' + qq.v + '">Proposal PDF</button></div>';
    }).join('') + '</div>';

    /* samples */
    if (o.samples.length) h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>Samples</h3></div>' + o.samples.map(function (s, i) {
      var p = G.P(s.pid);
      return '<div class="item"><div class="grow"><h4>' + esc(p ? p.name : s.pid) + '</h4><p>' + esc(s.status) + ' ' + esc(s.at || '') + (s.feedback ? ' · “' + esc(s.feedback) + '”' : '') + '</p></div>' +
        (s.status !== 'delivered' ? '<button class="minibtn" data-act="sampleDelivered" data-id="' + id + '|' + i + '">Delivered</button>' : !s.feedback ? '<button class="minibtn" data-act="sampleFeedback" data-id="' + id + '|' + i + '">Log feedback</button>' : '') + '</div>';
    }).join('') + '</div>';
    h += '</div><div>';

    /* the brief */
    var b = o.brief;
    h += '<form class="card" data-submit="saveBrief" data-id="' + id + '"><h3>The brief</h3>' + (b.text ? '<p class="small muted" style="white-space:pre-wrap">“' + esc(b.text) + '”</p>' : '') +
      '<div class="grid2" style="gap:0 12px">' + G.field('Occasion', '<input name="occasion" value="' + esc(b.occasion) + '">') + G.field('For', '<input name="recipients" value="' + esc(b.recipients) + '">') +
      G.field('Quantity', '<input type="number" name="qty" value="' + (b.qty || '') + '">') + G.field('Deliver by', '<input type="date" name="deadline" value="' + esc(b.deadline || '') + '">') +
      G.field('Budget min ₹', '<input type="number" name="budgetMin" value="' + (b.budgetMin || '') + '">') + G.field('Budget max ₹', '<input type="number" name="budgetMax" value="' + (b.budgetMax || '') + '">') +
      G.field('Cities', '<input name="cities" value="' + esc((b.cities || []).join(', ')) + '">') + G.field('Branding', '<input name="branding" value="' + esc(b.branding) + '">') + '</div>' +
      '<label class="chk"><input type="checkbox" name="ucpmp"' + (b.ucpmp ? ' checked' : '') + '> Gifts to doctors — UCPMP applies</label>' +
      (open ? '<p style="margin-top:10px"><button class="btn sm">Save brief</button></p>' : '') + '</form>';

    /* follow-ups */
    var fs = D().followups.filter(function (f) { return f.opp === id; }).sort(function (x, y) { return String(y.due).localeCompare(String(x.due)); });
    h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>Conversations</h3>' + (open ? '<button class="minibtn" data-act="logFollow" data-id="' + id + '">+ Log</button>' : '') + '</div>' + (fs.length ? fs.map(function (f) {
      var s = f.done && f.note && !f.auto ? GC.scoreNote(f.note, { outcome: f.outcome }) : null;
      return '<div class="item"><span class="sev ' + (f.done ? 'ok' : GC.isOverdue(f) ? 'bad' : 'warn') + '"></span><div class="grow"><h4 style="font-weight:500">' + esc(f.note || '—') + '</h4><p>' + esc(f.done ? 'Done ' + (f.done_at || '') : 'Due ' + G.when(f.due)) + ' · ' + esc(f.method) + ' · ' + esc(GC.staffName(f.owner)) + (f.outcome ? ' · ' + esc(f.outcome) : '') + (f.auto ? ' · by an agent' : '') + '</p></div>' +
        (s ? G.pill(s.score + '/10', s.band) : !f.done ? '<button class="minibtn" data-act="doneFollow" data-id="' + f.id + '">Done</button>' : '') + '</div>';
    }).join('') : G.empty('Nothing logged yet.')) + '</div>';

    /* what the agents did here */
    var runs = D().runs.filter(function (r) { return r.target && r.target.id === id; }).slice(0, 6);
    if (runs.length) h += '<div class="agentcard" style="margin-top:14px"><span class="tag">Agents on this requirement</span>' + runs.map(function (r) {
      var a = AG.agentById(r.agent) || { icon: '•', name: r.agent };
      return '<p style="margin:8px 0 0"><a href="#/run/' + r.id + '"><b>' + a.icon + ' ' + esc(a.name) + '</b></a> — ' + esc(r.summary) + ' <span class="small muted">' + esc(r.status) + '</span></p>';
    }).join('') + '</div>';
    return h + '</div></div>';
  };

  /* The requirement's edit card. The value is deliberately absent: it is worked out from
     the line items, and a total you can type over is a total that disagrees with the
     products under it. Change the lines instead. */
  function editCard(o, id, co) {
    var contacts = co ? D().contacts.filter(function (x) { return x.company === co.id; }) : [];
    var fields = GC.oppFields(GC.T, contacts);
    var h = '<div class="card" style="margin-top:16px"><div class="between"><h3>Edit details</h3>' +
      '<button class="btn sm ghost" data-act="editOppToggle" data-id="' + id + '">Done</button></div><div class="grid2">';
    h += fields.map(function (f) {
      var raw = GC.valueOn(o, f);
      var v = raw == null ? '' : String(raw);
      var did = id + '|' + f.key;
      var inp;
      if (f.type === 'select') {
        var opts = (f.options || []).map(function (op) {
          var val = op && op.value !== undefined ? op.value : op;
          var lab = op && op.label !== undefined ? op.label : op;
          return '<option value="' + esc(String(val)) + '"' + (String(val) === v ? ' selected' : '') + '>' + esc(String(lab)) + '</option>';
        }).join('');
        var none = f.key === 'contact'
          ? (contacts.length ? '<option value="">Nobody chosen yet</option>'
                             : '<option value="">No contacts on this client yet</option>')
          : '<option value="">Not set</option>';
        inp = '<select data-chg="oppField" data-id="' + did + '">' + none + opts + '</select>';
      } else if (f.type === 'number') {
        inp = '<input type="number" min="0" data-chg="oppField" data-id="' + did + '" value="' + esc(v) + '">';
      } else if (f.type === 'date') {
        inp = '<input type="date" data-chg="oppField" data-id="' + did + '" value="' + esc(v) + '">';
      } else {
        inp = '<input type="text" data-chg="oppField" data-id="' + did + '" value="' + esc(v) + '">';
      }
      return G.field(f.label + (f.required ? ' *' : ''), inp);
    }).join('') + '</div>';

    h += '<p class="small muted" style="margin-top:10px">The value is worked out from the products on this requirement, so it is changed there, not here.</p>';

    var blockers = GC.oppDeleteBlockers(o, D().orders);
    var cost = GC.oppDeleteCost(o, D().followups, D().proposals);
    h += '<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:14px">';
    if (blockers.length) {
      h += '<p class="small muted"><b>This requirement cannot be deleted.</b> ' + esc(blockers.join('. ')) + '.</p>';
    } else {
      h += '<p class="small muted">Deleting removes <b>' + cost.products + '</b> product line' + (cost.products === 1 ? '' : 's') +
           ', <b>' + cost.samples + '</b> sample' + (cost.samples === 1 ? '' : 's') +
           ', <b>' + cost.quotes + '</b> quote' + (cost.quotes === 1 ? '' : 's') +
           ', <b>' + cost.followups + '</b> follow-up' + (cost.followups === 1 ? '' : 's') +
           ' and <b>' + cost.proposals + '</b> agent proposal' + (cost.proposals === 1 ? '' : 's') + '. This cannot be undone.</p>' +
           '<button class="btn sm bad" data-act="delOpp" data-id="' + id + '">Delete this requirement</button>';
    }
    return h + '</div></div>';
  }

  V.oppnew = function (companyId) {
    var cos = D().companies.filter(G.inScope).sort(function (a, b) { return a.name.localeCompare(b.name); });
    return '<div class="ph"><div><h1>New requirement</h1><p>Or paste the client\'s message into the Inbox and let the Brief agent fill this in.</p></div></div>' +
      '<form class="card" data-submit="saveOpp" style="max-width:800px"><div class="grid2">' +
      G.field('Client', '<select name="company" required>' + cos.map(function (c) { return '<option value="' + c.id + '"' + (c.id === companyId ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select>') +
      G.field('Title', '<input name="title" placeholder="e.g. Diwali — Clients × 250" required>') +
      G.field('Occasion', '<select name="occasion">' + G.E.OCCASIONS.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select>') +
      G.field('For', '<select name="recipients">' + G.E.RECIPIENTS.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select>') +
      G.field('Quantity', '<input type="number" name="qty">') + G.field('Deliver by', '<input type="date" name="deadline">') +
      G.field('Budget min ₹ per piece', '<input type="number" name="budgetMin">') + G.field('Budget max ₹ per piece', '<input type="number" name="budgetMax">') +
      G.field('Delivery cities', '<input name="cities" placeholder="Mumbai, Pune">') + G.field('Branding', '<input name="branding" placeholder="Logo print, engraving…">') + '</div>' +
      G.field('What the client said', '<textarea name="text"></textarea>') +
      '<label class="chk"><input type="checkbox" name="ucpmp"> Gifts to doctors — UCPMP applies</label><p class="honest">With quantity, budget and date filled in, it opens at "' + esc(GC.T.stages[1]) + '" and the Curator starts straight away.</p><button class="btn">Open requirement</button></form>';
  };

  /* ================= the proposal PDF: this page, printed ================= */

  function printQuote(o, q) {
    var co = G.companyById(o.company), ct = G.contactById(o.contact), T = GC.T;
    document.getElementById('printdoc').innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid ' + esc(T.brand) + ';padding-bottom:10px">' +
      '<div><div style="font-family:var(--script);font-size:40px;color:' + esc(T.brand) + ';line-height:1">' + esc(T.logoText) + '</div><div style="color:#666">' + esc(T.name) + ' · ' + esc(T.city) + ' · GSTIN ' + esc(T.gstin) + '</div></div>' +
      '<div style="text-align:right"><b>Proposal & quotation v' + q.v + '</b><br>' + esc(q.at) + '<br>Valid till ' + esc(q.validTill) + '</div></div>' +
      '<h1 style="margin-top:18px">' + esc(o.title) + '</h1><p>Prepared for <b>' + esc(co ? co.name : '') + '</b>' + (ct ? ', attention ' + esc(ct.name) : '') + (o.brief.deadline ? '. Delivery by ' + esc(o.brief.deadline) : '') + (o.brief.cities && o.brief.cities.length ? ' to ' + esc(o.brief.cities.join(', ')) : '') + '.</p>' +
      '<table><thead><tr><th>#</th><th>Product</th><th>HSN</th><th class="r">Qty</th><th class="r">Unit ₹</th><th>Branding</th><th class="r">GST</th><th class="r">Amount ₹</th></tr></thead><tbody>' +
      q.lines.map(function (l, i) { return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(l.name) + '</b></td><td>' + esc(l.hsn) + '</td><td class="r">' + GC.fmt(l.qty) + '</td><td class="r">' + GC.fmt(l.unit + l.brandCost) + '</td><td>' + esc(l.branding || '—') + '</td><td class="r">' + l.gstRate + '%</td><td class="r">' + GC.fmt(l.total) + '</td></tr>'; }).join('') +
      '<tr><td colspan="7" class="r">Taxable value</td><td class="r">' + GC.fmt(q.taxable) + '</td></tr><tr><td colspan="7" class="r">GST</td><td class="r">' + GC.fmt(q.gst) + '</td></tr>' +
      '<tr><td colspan="7" class="r"><b>Total</b></td><td class="r"><b>₹' + GC.fmt(q.total) + '</b></td></tr></tbody></table>' +
      '<p style="margin-top:18px;color:#555">Prices include the branding shown. Samples available within 48 hours in Mumbai. Payment terms and delivery schedule as agreed on the purchase order.</p>' +
      '<p style="margin-top:28px;color:#999;font-size:10px">Generated by the ' + esc(T.name) + ' Agentic Cockpit. Sample data.</p>';
    window.print();
  }

  /* ================= actions ================= */

  function parts(id) { var p = String(id).split('|'); return [G.oppById(p[0]), p[1]]; }
  Object.assign(A, {
    boardSearch: function (v) { BF.q = v; G.render(); },
    boardWho: function (v) { BF.who = v || ''; G.render(); },
    newOppFor: function (id) { G.go('#/oppnew/' + id); },
    moveOpp: function (id) {
      var p = String(id).split('|'), o = G.oppById(p[0]);
      var r = GC.moveOpp(o, p[1]);
      if (r.error) return G.toast(r.error, 'bad');
      G.log('opp_stage', o.title + ' → ' + p[1] + (r.marks.length ? ' (' + r.marks.length + ' product marks moved up)' : ''), { opp: o.id, company: o.company });
      G.save(); G.render();
      if (p[1] === GC.T.stages[1] && !o.lines.length) { var c = G.runAgent('curator', o); if (c) G.toast('The Curator has proposed ' + c.payload.picks.length + ' options.', 'agent'); }
    },
    reopenOpp: function (id) { var o = G.oppById(id); o.stage = GC.T.stages[0]; o.outcome = null; o.closed = null; o.lost_reason = null; G.log('opp_stage', o.title + ' reopened', { opp: id }); G.save(); G.render(); },
    runCurator: function (id) { var p = G.runAgent('curator', G.oppById(id), { manual: true }); if (p) G.go('#/proposal/' + p.id); },
    runProposal: function (id) { var p = G.runAgent('proposal', G.oppById(id), { manual: true }); if (p) G.go('#/proposal/' + p.id); },
    saveQuote: function (id) {
      var o = G.oppById(id), q = GC.buildQuote(o, G.P, { by: G.me().id });
      q.status = 'draft'; o.quotes.push(q); G.log('quote', 'Quote v' + q.v + ' saved — ' + GC.rupees(q.total), { opp: id }); G.save(); G.toast('Quote v' + q.v + ' saved as a draft.'); G.render();
    },
    printQuote: function (id) { var p = String(id).split('|'), o = G.oppById(p[0]); var q = o.quotes.filter(function (x) { return String(x.v) === p[1]; })[0]; if (q) printQuote(o, q); },
    lineQty: function (v, el) { var x = parts(el.dataset.id), l = GC.lineOf(x[0], x[1]); l.qty = Math.max(1, +v || 1); x[0].updated = GC.today(); G.save(); G.render(); },
    lineBrand: function (v, el) { var x = parts(el.dataset.id), l = GC.lineOf(x[0], x[1]); l.branding = v; G.save(); G.render(); },
    lineMark: function (v, el) { var x = parts(el.dataset.id); GC.markLine(x[0], x[1], v); G.log('opp_line', (G.P(x[1]) || {}).name + ' marked ' + GC.MARKS[v], { opp: x[0].id }); G.save(); G.render(); },
    lineRemove: function (id) { var x = parts(id); x[0].lines = x[0].lines.filter(function (l) { return l.pid !== x[1]; }); G.save(); G.render(); },
    lineSource: function (id) {
      var x = parts(id), l = GC.lineOf(x[0], x[1]);
      var pr = G.runAgent('sourcing', { pid: x[1], qty: l.qty || x[0].brief.qty || 100, deadline: x[0].brief.deadline, mode: 'rfq', opp: x[0].id }, { manual: true });
      if (pr) G.go('#/proposal/' + pr.id);
    },
    sendSample: function (id) {
      var x = parts(id);
      x[0].samples.push({ pid: x[1], status: 'sent', at: GC.today(), feedback: '' });
      GC.markLine(x[0], x[1], 'sample_sent');
      if (GC.T.stages.indexOf(x[0].stage) < GC.T.stages.indexOf('Sampling') && GC.T.stages.indexOf('Sampling') >= 0) GC.moveOpp(x[0], 'Sampling');
      G.log('sample', 'Sample sent: ' + (G.P(x[1]) || {}).name, { opp: x[0].id }); G.save(); G.toast('Sample logged as sent.'); G.render();
    },
    sampleDelivered: function (id) { var p = String(id).split('|'), o = G.oppById(p[0]); o.samples[+p[1]].status = 'delivered'; o.samples[+p[1]].at = GC.today(); G.log('sample', 'Sample delivered', { opp: o.id }); G.save(); G.render(); },
    sampleFeedback: function (id) {
      var p = String(id).split('|'), o = G.oppById(p[0]); var fb = window.prompt('What did the client say about the sample?');
      if (!fb) return; o.samples[+p[1]].feedback = fb; G.log('sample', 'Sample feedback: ' + fb, { opp: o.id }); G.save(); G.render();
    },
    saveBrief: function (f, form) {
      var o = G.oppById(form.dataset.id);
      Object.assign(o.brief, { occasion: f.occasion, recipients: f.recipients, qty: +f.qty || null, deadline: f.deadline || null, budgetMin: +f.budgetMin || null, budgetMax: +f.budgetMax || null,
        cities: String(f.cities || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean), branding: f.branding, ucpmp: !!f.ucpmp });
      o.updated = GC.today(); G.log('opp_stage', 'Brief updated: ' + o.title, { opp: o.id }); G.save(); G.toast('Brief saved.'); G.render();
    },
    saveOpp: function (f) {
      var co = G.companyById(f.company); if (!co) return G.toast('Pick a client.', 'bad');
      var complete = f.qty && f.budgetMax && f.deadline;
      var o = GC.newOpp({ company: co.id, contact: (G.contactsOf(co.id)[0] || {}).id, title: f.title, source: co.source, assigned_to: co.assigned_to || G.me().id, branch: co.branch,
        stage: complete ? GC.T.stages[1] : GC.T.stages[0],
        brief: { text: f.text, occasion: f.occasion, recipients: f.recipients, qty: +f.qty || null, deadline: f.deadline || null, budgetMin: +f.budgetMin || null, budgetMax: +f.budgetMax || null,
                 cities: String(f.cities || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean), branding: f.branding, ucpmp: !!f.ucpmp || (co.pharma && /doctor/i.test(f.recipients)) } });
      D().opps.push(o); G.log('opp_new', 'New requirement: ' + o.title, { opp: o.id, company: co.id }); G.save();
      if (complete) { var c = G.runAgent('curator', o); if (c) G.toast('Opened. The Curator has proposed ' + c.payload.picks.length + ' options.', 'agent'); }
      G.go('#/opp/' + o.id);
    },
    winOpp: function (id) {
      var o = G.oppById(id);
      G.modal('Won — PO in hand', o.title, '<form data-submit="confirmWin" data-id="' + id + '">' + G.field('Client PO number', '<input name="po" required placeholder="e.g. RC/VEDA/0925">') +
        '<p class="muted small">This opens an order on the Orders board with the lines in play at their current prices, and tells Production & Dispatch.</p><button class="btn">Open the order</button></form>');
    },
    confirmWin: function (f, form) {
      var o = G.oppById(form.dataset.id);
      var r = GC.winOpp(o, f.po, G.P, G.me().id);
      if (r.error) return G.toast(r.error, 'bad');
      r.order.no = 'RC-' + (2026100 + D().orders.length + 1);
      D().orders.push(r.order);
      G.log('opp_won', o.title + ' won — PO ' + f.po + ', ' + GC.rupees(r.order.value), { opp: o.id, company: o.company, order: r.order.id });
      G.log('order_stage', 'Order ' + r.order.no + ' opened; ops notified to place vendor POs', { order: r.order.id });
      G.save(); G.closeModal(); G.toast('Order ' + r.order.no + ' opened. Ops have been told.'); G.go('#/order/' + r.order.id);
    },
    loseOpp: function (id) {
      G.modal('Mark as lost', G.oppById(id).title, '<form data-submit="confirmLose" data-id="' + id + '">' + G.field('Why', '<select name="reason">' + GC.T.lostReasons.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select>') +
        '<button class="btn bad">Mark lost</button></form>');
    },
    confirmLose: function (f, form) {
      var o = G.oppById(form.dataset.id), r = GC.loseOpp(o, f.reason);
      if (r.error) return G.toast(r.error, 'bad');
      G.log('opp_lost', o.title + ' lost — ' + f.reason, { opp: o.id, company: o.company }); G.save(); G.closeModal(); G.render();
    },
    logFollow: function (id) {
      var o = G.oppById(id);
      G.modal('Log a conversation', o.title, '<form data-submit="saveFollow" data-id="' + id + '">' +
        '<div class="grid2" style="gap:0 12px">' + G.field('How', '<select name="method">' + GC.FOLLOW_METHODS.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select>') +
        G.field('Outcome', '<select name="outcome" data-chg="scoreLive"><option value="">Pick one</option>' + GC.FOLLOW_OUTCOMES.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select>') + '</div>' +
        G.field('What was said', '<textarea name="note" id="fnote" data-input="scoreLive" placeholder="Who you spoke to, what they said, numbers, the next step"></textarea>') +
        '<div id="fscore" class="small muted">Scored as you type — name the product, a number, what they said and the next step.</div>' +
        '<div class="grid2" style="gap:0 12px;margin-top:10px">' + G.field('Next follow-up', '<input type="date" name="due" value="' + GC.addDays(GC.today(), 2) + '">') + G.field('About', '<input name="next" placeholder="e.g. Chase the board decision">') + '</div>' +
        '<button class="btn">Save</button></form>');
    },
    scoreLive: function () {
      var t = (document.getElementById('fnote') || {}).value || '', out = (document.querySelector('#modal select[name=outcome]') || {}).value;
      var s = GC.scoreNote(t, { outcome: out });
      var box = document.getElementById('fscore');
      if (box) box.innerHTML = G.pill(s.score + '/10', s.band) + ' ' + esc(s.verdict) + '<br>' + s.marks.map(function (m) { return (m.got ? '✓ ' : '○ ') + esc(m.label); }).join(' · ');
    },
    saveFollow: function (f, form) {
      var o = G.oppById(form.dataset.id), me = G.me().id;
      if (!String(f.note || '').trim()) return G.toast('Write down what was said.', 'bad');
      D().followups.filter(function (x) { return x.opp === o.id && !x.done && x.due <= GC.today(); }).forEach(function (x) { x.done = true; x.done_at = GC.today(); });
      D().followups.push(GC.newFollow({ opp: o.id, company: o.company, owner: me, due: GC.today(), method: f.method, note: f.note, outcome: f.outcome || null, done: true, done_at: GC.today(), by: me }));
      if (f.due) D().followups.push(GC.newFollow({ opp: o.id, company: o.company, owner: o.assigned_to || me, due: f.due, method: 'Call', note: f.next || 'Follow up', by: me }));
      o.updated = GC.today();
      var co = G.companyById(o.company); if (co) co.last_touch = GC.today();
      var s = GC.scoreNote(f.note, { outcome: f.outcome });
      G.log('follow', 'Conversation logged on ' + o.title + ' (' + s.score + '/10)', { opp: o.id, company: o.company }); G.save(); G.closeModal(); G.render();
    }
  });

  A.editOppToggle = function (id) { EDITING[id] = !EDITING[id]; G.render(); };

  A.oppField = function (v, el) {
    var parts = String(el.getAttribute('data-id')).split('|');
    var r = G.editOpp(parts[0], parts[1], v);
    if (r && r.error) { G.toast(r.error, 'bad'); G.render(); return; }
    G.toast('Saved.', 'ok');
    G.render();
  };

  A.delOpp = function (id) {
    var o = G.oppById(id);
    if (!o) return;
    if (!window.confirm('Delete "' + o.title + '"? This cannot be undone.')) return;
    var co = o.company;
    var r = G.deleteOpp(id);
    if (r.error) { G.toast(r.error, 'bad'); return; }
    G.toast('Deleted.', 'ok');
    G.go(co ? '#/company/' + co : '#/pipeline');
  };

})();
