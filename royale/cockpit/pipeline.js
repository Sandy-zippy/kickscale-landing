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
    var unread = D().messages.filter(function (m) { return m.status === 'pending'; }).length;
    if (unread) h += '<div class="notice info"><b>' + unread + ' new message' + (unread > 1 ? 's' : '') + ' waiting.</b> The Brief assistant has read them and drafted enquiries. <a class="btn sm" href="#/inbox">Read them</a></div>';
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

  /* One sentence, one next step, then three tabs: what they get, what it costs, what was said. */
  var OPPTAB = {};
  function nextOppStep(o, id) {
    var S = GC.T.stages, i = S.indexOf(o.stage), lines = GC.inPlay(o).length;
    var b = function (act, label) { return '<button class="btn" data-act="' + act + '" data-id="' + id + '">' + esc(label) + '</button>'; };
    if (i <= 1) return lines ? b('sendShortlist', 'Send shortlist to client') : b('runCurator', 'Find products');
    if (i <= 3) return lines ? b('runProposal', 'Draft the quote') : b('runCurator', 'Find products');
    if (i === 4) return b('logFollow', 'Log follow-up');
    return b('winOpp', 'Won, PO in hand');
  }
  V.opp = function (id) {
    var o = G.oppById(id);
    if (!o) return G.deny('No such requirement.', '');
    if (!G.canOpen(o)) return G.deny('This requirement belongs to ' + GC.staffName(o.assigned_to), 'Ask them, or the Sales Head, if you need access.');
    var co = G.companyById(o.company), ct = G.contactById(o.contact), open = GC.isOpen(o);
    var val = GC.oppValue(o, G.P), cost = G.can('cost'), b = o.brief;
    var S = GC.T.stages, si = S.indexOf(o.stage);
    var tab = OPPTAB[id] || 'shortlist';
    var days = b.deadline ? GC.daysBetween(GC.today(), b.deadline) : null;

    var h = '<div class="stickyhead"><div class="ph" style="align-items:flex-start"><div><p class="muted small"><a href="#/company/' + (co ? co.id : '') + '">' + esc(co ? co.name : 'No company') + '</a>' + (ct ? ' · ' + esc(ct.name) + (ct.role ? ' (' + esc(ct.role) + ')' : '') : '') + ' · came by ' + esc(GC.T.sources[o.source] || o.source) + ' · ' + esc(GC.staffName(o.assigned_to)) + ' looks after it</p>' +
      '<p class="sentence">' + esc(co ? co.name : 'The client') + ' wants ' + esc(b.occasion && b.recipients ? (b.qty ? GC.fmt(b.qty) + ' ' : '') + b.occasion.toLowerCase() + ' gifts for ' + b.recipients.toLowerCase() : o.title) +
      (b.deadline ? ' <span class="soft">by ' + esc(G.day(b.deadline)) + (open && days != null ? ' (' + (days < 0 ? Math.abs(days) + ' days ago' : days + ' days left') + ')' : '') + '</span>' : '') +
      (val ? ' <span class="soft">· about ' + GC.money(val) + '</span>' : '') + '</p>';
    if (open && si >= 0) h += '<div class="stepline"><span>Step <b>' + (si + 1) + ' of ' + S.length + '</b>: ' + esc(o.stage) + '</span><span class="track" aria-hidden="true"><i style="width:' + Math.round(100 * (si + 1) / S.length) + '%"></i></span>' +
      (S[si + 1] ? '<button class="minibtn" data-act="moveOpp" data-id="' + id + '|' + esc(S[si + 1]) + '" title="' + esc(GC.T.stageHelp[S[si + 1]] || '') + '">Move to ' + esc(S[si + 1]) + '</button>' : '') +
      '<button class="minibtn" data-act="winOpp" data-id="' + id + '">Won</button><button class="minibtn" data-act="loseOpp" data-id="' + id + '">Lost</button></div>';
    else h += '<p style="margin-top:10px">' + G.pill(o.stage, o.stage === 'Won' ? 'ok' : 'bad') + '</p>';
    h += '</div><div class="acts">' + (open ? nextOppStep(o, id) + '<button class="btn ghost" data-act="logFollow" data-id="' + id + '">Log follow-up</button>' : o.order ? '<a class="btn" href="#/order/' + o.order + '">Open the order</a>' : '') +
      '<button class="btn ghost" data-act="editOppToggle" data-id="' + id + '">' + (EDITING[id] ? 'Done editing' : 'Edit details') + '</button></div></div>';
    h += '<div class="tabs" role="tablist">' + [['shortlist', 'Shortlist · ' + GC.inPlay(o).length], ['quote', 'Quote' + (o.quotes.length ? ' · v' + o.quotes[o.quotes.length - 1].v : '')], ['talk', 'Conversation']].map(function (t) {
      return '<a href="#" role="tab" data-act="oppTab" data-id="' + id + '|' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '" aria-selected="' + (tab === t[0]) + '">' + esc(t[1]) + '</a>';
    }).join('') + '</div></div>';

    if (EDITING[id]) h += editCard(o, id, co) + briefForm(o, id, open);
    if (o.stage === 'Lost') h += '<div class="notice bad">Lost on ' + esc(o.closed) + ': ' + esc(o.lost_reason || 'no reason given') + '. <button class="btn sm ghost" data-act="reopenOpp" data-id="' + id + '">Reopen</button></div>';
    D().proposals.filter(function (p) { return p.status === 'pending' && p.target && p.target.id === id; }).forEach(function (p) {
      var a = AG.agentById(p.agent);
      h += '<div class="notice agent"><b>Needs your OK · ' + esc(a.name) + '</b> ' + esc(p.summary) + ' <a class="btn sm" href="#/proposal/' + p.id + '">Review</a></div>';
    });

    var lines = o.lines, q = lines.length ? GC.buildQuote(o, G.P) : null;

    if (tab === 'shortlist') {
      /* what they asked for, read first */
      var asked = [['Occasion', b.occasion], ['For', b.recipients], ['How many', b.qty ? GC.fmt(b.qty) : ''], ['Deliver by', b.deadline ? G.day(b.deadline) : ''],
        ['Budget per piece', b.budgetMin || b.budgetMax ? (b.budgetMin ? '₹' + GC.fmt(b.budgetMin) : '') + (b.budgetMin && b.budgetMax ? ' to ' : '') + (b.budgetMax ? '₹' + GC.fmt(b.budgetMax) : '') : ''],
        ['Cities', (b.cities || []).join(', ')], ['Branding', b.branding]].filter(function (x) { return x[1]; });
      h += '<div class="card" style="margin-bottom:14px"><div class="between"><h3 style="margin:0">What they asked for</h3>' + (open ? '<button class="minibtn" data-act="editOppToggle" data-id="' + id + '">' + (EDITING[id] ? 'Close' : 'Change') + '</button>' : '') + '</div>' +
        (asked.length ? '<dl class="kv" style="margin-top:12px">' + asked.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>' : '<p class="muted" style="margin:10px 0 0">Not filled in yet. Tap Change, or let the Brief assistant read their message.</p>') +
        (b.ucpmp ? '<p style="margin:10px 0 0">' + G.pill('Gifts to doctors: limit ₹' + GC.fmt(GC.T.rules.ucpmpCap) + ' each', 'warn') + '</p>' : '') +
        (b.text ? '<p class="small muted" style="white-space:pre-wrap;margin:12px 0 0">“' + esc(b.text) + '”</p>' : '') + '</div>';
      h += '<div class="card pad0"><div class="hd"><h3>Shortlist · ' + GC.inPlay(o).length + ' in play</h3><span class="row">' +
        (open ? (GC.inPlay(o).length ? '<button class="btn sm" data-act="sendShortlist" data-id="' + id + '">Send shortlist</button>' : '') + '<button class="btn ghost sm" data-act="runCurator" data-id="' + id + '">Find products</button><a class="btn ghost sm" href="#/discover">Browse all products</a>' : '') + '</span></div>';
      h += lines.length ? '<div class="scroller"><table class="tbl"><thead><tr><th>Product</th><th>Qty</th><th class="num">Price each</th><th>Branding</th><th>Client says</th>' + (cost ? '<th class="num">Margin</th>' : '') + '</tr></thead><tbody>' + lines.map(function (l) {
        var p = G.P(l.pid); if (!p) return '';
        var qty = l.qty || b.qty || p.moq, unit = GC.unitPrice(p, qty);
        var rej = l.mark === 'rejected';
        var acts = open ? '<div class="row" style="margin-top:6px;gap:4px"><button class="minibtn" data-act="sendSample" data-id="' + id + '|' + esc(l.pid) + '">Send sample</button>' + (G.can('vendors') ? '<button class="minibtn" data-act="lineSource" data-id="' + id + '|' + esc(l.pid) + '">Ask vendors for price</button>' : '') + '<button class="minibtn" data-act="lineRemove" data-id="' + id + '|' + esc(l.pid) + '">Remove</button></div>' : '';
        return '<tr style="' + (rej ? 'opacity:.5' : '') + '"><td style="min-width:260px"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">' + G.photo(p) + '<span><a href="#" data-act="peekProduct" data-id="' + esc(p.id) + '|opp/' + id + '"><b>' + esc(p.name) + '</b></a><small>' + esc(p.vendorName) + ' · min order ' + p.moq + ' · ready in ' + p.lead + ' days' + (p.ucpmp ? ' · UCPMP-safe' : '') + (p.sample ? ' · sample in office' : '') + '</small>' + acts + '</span></div></td>' +
          '<td>' + (open ? '<input type="number" style="width:96px" data-chg="lineQty" data-id="' + id + '|' + esc(l.pid) + '" value="' + qty + '" aria-label="Quantity">' : GC.fmt(qty)) + (qty < p.moq ? '<small style="color:var(--warn)">below the minimum order</small>' : '') + '</td>' +
          '<td class="num">₹' + GC.fmt(unit) + '</td>' +
          '<td>' + (open && p.branding.length ? '<select data-chg="lineBrand" data-id="' + id + '|' + esc(l.pid) + '" style="width:auto" aria-label="Branding"><option value="">None</option>' + p.branding.map(function (x) { return '<option' + (l.branding === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' : esc(l.branding || (p.branding.length ? 'None' : 'Not brandable'))) + '</td>' +
          '<td>' + (open ? '<select data-chg="lineMark" data-id="' + id + '|' + esc(l.pid) + '" style="width:auto" aria-label="What the client says">' + Object.keys(GC.MARKS).map(function (m) { return '<option value="' + m + '"' + (l.mark === m ? ' selected' : '') + '>' + GC.MARKS[m] + '</option>'; }).join('') + '</select>' : G.pill(GC.MARKS[l.mark] || l.mark, 'info')) + '</td>' +
          (cost ? '<td class="num">' + Math.round(100 * (unit - p.cost) / unit) + '%</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>' : G.empty('Nothing shortlisted yet. Tap Find products: it searches the whole catalogue against what they asked for.');
      h += '</div>';
      if (o.samples.length) h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>Samples</h3></div>' + o.samples.map(function (sm, i) {
        var p = G.P(sm.pid);
        return '<div class="item"><div class="grow"><h4>' + esc(p ? p.name : sm.pid) + '</h4><p>' + esc(sm.status) + ' ' + esc(sm.at || '') + (sm.feedback ? ' · “' + esc(sm.feedback) + '”' : '') + '</p></div>' +
          (sm.status !== 'delivered' ? '<button class="minibtn" data-act="sampleDelivered" data-id="' + id + '|' + i + '">Delivered</button>' : !sm.feedback ? '<button class="minibtn" data-act="sampleFeedback" data-id="' + id + '|' + i + '">Log feedback</button>' : '') + '</div>';
      }).join('') + '</div>';
    }

    if (tab === 'quote') {
      h += '<div class="card">' + (q && q.lines.length ? '<div class="between"><div><span class="muted">Products in play, with branding and GST</span><p class="sentence" style="margin-top:4px">' + GC.rupees(q.total) + ' <span class="soft">· ' + GC.rupees(q.taxable) + ' + GST ' + GC.rupees(q.gst) + (cost ? ' · margin ' + q.marginPct + '%' : '') + '</span></p></div>' +
        (open ? '<span class="row"><button class="btn" data-act="runProposal" data-id="' + id + '">Draft the quote</button><button class="btn ghost" data-act="saveQuote" data-id="' + id + '">Save as a version</button></span>' : '') + '</div>'
        : '<p class="muted" style="margin:0">Shortlist products first. The quote is worked out from them.</p>') + '</div>';
      if (q && q.lines.length && open) h += '<div style="margin-top:14px">' + G.complianceBox(GC.compliance(q, o, co, GC.T.rules)) + '</div>';
      h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>Versions</h3></div>' + (o.quotes.length ? o.quotes.slice().reverse().map(function (qq) {
        return '<div class="item"><div class="grow"><h4>Version ' + qq.v + ' · ' + GC.rupees(qq.total) + (cost ? ' · margin ' + qq.marginPct + '%' : '') + '</h4><p>' + esc(qq.at) + ' · ' + qq.lines.length + ' products · valid till ' + esc(qq.validTill) + ' · by ' + esc(GC.staffName(qq.by)) + '</p></div>' + G.pill(qq.status === 'sent' ? 'sent' : 'draft', qq.status === 'sent' ? 'ok' : 'dim') +
          ' <button class="minibtn" data-act="printQuote" data-id="' + id + '|' + qq.v + '">PDF</button></div>';
      }).join('') : G.empty('No quote saved yet.')) + '</div>';
    }

    if (tab === 'talk') {
      var fs = D().followups.filter(function (f) { return f.opp === id; }).sort(function (x, y) { return String(x.done ? x.done_at || x.due : x.due).localeCompare(String(y.done ? y.done_at || y.due : y.due)); });
      h += '<div class="card pad0"><div class="hd"><h3>Conversation with ' + esc(ct ? ct.name : co ? co.name : 'the client') + '</h3>' + (open ? '<button class="btn sm" data-act="logFollow" data-id="' + id + '">Log follow-up</button>' : '') + '</div>' +
        (fs.length ? '<div class="chat">' + fs.map(function (f) {
          var sc = f.done && f.note && !f.auto ? GC.scoreNote(f.note, { outcome: f.outcome }) : null;
          return '<div class="msg ' + (f.done ? 'me' : 'todo') + '"><div>' + esc(f.note || 'Follow up') + '</div><small>' + esc(f.done ? (f.done_at || '') + ' · ' + f.method + ' · ' + GC.staffName(f.by || f.owner) + (f.outcome ? ' · ' + f.outcome : '') + (f.auto ? ' · by an assistant' : '') : 'Next: ' + f.method + ' ' + G.when(f.due) + ' · ' + GC.staffName(f.owner)) + '</small>' +
            (sc ? '<small>' + G.pill('note ' + sc.score + '/10', sc.band) + '</small>' : !f.done ? '<div style="margin-top:6px"><button class="minibtn" data-act="doneFollow" data-id="' + f.id + '">Done</button></div>' : '') + '</div>';
        }).join('') + '</div>' : G.empty('Nothing logged yet. After every call or WhatsApp, tap Log follow-up.')) + '</div>';
      var runs = D().runs.filter(function (r) { return r.target && r.target.id === id; }).slice(0, 6);
      if (runs.length) h += '<div class="card pad0" style="margin-top:14px"><div class="hd"><h3>What the assistants did here</h3></div>' + runs.map(function (r) {
        var a = AG.agentById(r.agent) || { name: r.agent };
        return '<a class="item" href="#/run/' + r.id + '"><div class="grow"><h4>' + esc(a.name) + '</h4><p>' + esc(r.summary) + '</p></div>' + G.pill(r.status, 'dim') + '</a>';
      }).join('') + '</div>';
    }
    return h;
  };
  function briefForm(o, id, open) {
    var b = o.brief;
    return '<form class="card" style="margin-top:14px" data-submit="saveBrief" data-id="' + id + '"><h3>What they asked for</h3>' +
      '<div class="grid2" style="gap:0 12px">' + G.field('Occasion', '<input name="occasion" value="' + esc(b.occasion) + '">') + G.field('For', '<input name="recipients" value="' + esc(b.recipients) + '">') +
      G.field('How many', '<input type="number" name="qty" value="' + (b.qty || '') + '">') + G.field('Deliver by', '<input type="date" name="deadline" value="' + esc(b.deadline || '') + '">') +
      G.field('Budget per piece, from ₹', '<input type="number" name="budgetMin" value="' + (b.budgetMin || '') + '">') + G.field('Budget per piece, up to ₹', '<input type="number" name="budgetMax" value="' + (b.budgetMax || '') + '">') +
      G.field('Cities', '<input name="cities" value="' + esc((b.cities || []).join(', ')) + '">') + G.field('Branding', '<input name="branding" value="' + esc(b.branding) + '">') + '</div>' +
      '<label class="chk"><input type="checkbox" name="ucpmp"' + (b.ucpmp ? ' checked' : '') + '> Gifts to doctors (UCPMP applies)</label>' +
      (open ? '<p style="margin-top:10px"><button class="btn sm">Save</button></p>' : '') + '</form>';
  }

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
           ' and <b>' + cost.proposals + '</b> agent proposal' + (cost.proposals === 1 ? '' : 's') + '.</p>' +
           '<button class="btn sm bad" data-act="delOpp" data-id="' + id + '">Delete this requirement</button>';
    }
    return h + '</div></div>';
  }

  /* Four things, nothing else: who, what, how many, by when. The rest is filled
     in later on the enquiry, or by the Brief assistant from their message. */
  V.oppnew = function (companyId) {
    var cos = D().companies.filter(G.inScope).sort(function (a, b) { return a.name.localeCompare(b.name); });
    var pre = companyId ? G.companyById(companyId) : null;
    var src = Object.keys(GC.T.sources).slice(0, 5);
    return '<div class="ph"><div><h1>New enquiry</h1><p>Four questions. Everything else can wait.</p></div></div>' +
      '<form class="card" data-submit="saveOpp" style="max-width:720px">' +
      '<p class="field" style="margin-bottom:6px"><span>How did it come in?</span></p><div class="srcpick" role="radiogroup" aria-label="How did it come in?">' + src.map(function (k, i) {
        return '<label><input type="radio" name="source" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(GC.T.sources[k]) + '</span></label>';
      }).join('') + '</div>' +
      G.field('Client', '<input name="company" list="colist" required autocomplete="off" placeholder="Start typing a company name" value="' + esc(pre ? pre.name : '') + '"><datalist id="colist">' + cos.map(function (c) { return '<option value="' + esc(c.name) + '">'; }).join('') + '</datalist>') +
      G.field('What do they want?', '<input name="title" required placeholder="e.g. Diwali gifts for 250 clients">') +
      '<div class="grid2" style="gap:0 12px">' + G.field('How many', '<input type="number" name="qty" min="1" placeholder="e.g. 250">') + G.field('By when', '<input type="date" name="deadline">') + '</div>' +
      '<p class="honest">A new company name creates the client. Add their contact person later, from the client page.</p>' +
      '<button class="btn">Save enquiry</button></form>';
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
    oppTab: function (id) { var p = String(id).split('|'); OPPTAB[p[0]] = p[1]; G.render(); },
    sendShortlist: function (id) {
      var o = G.oppById(id), co = G.companyById(o.company), ct = G.contactById(o.contact);
      var lines = GC.inPlay(o).map(function (l, i) { var p = G.P(l.pid); if (!p) return ''; var qty = l.qty || o.brief.qty || p.moq; return (i + 1) + '. ' + p.name + ', ₹' + GC.fmt(GC.unitPrice(p, qty)) + ' each for ' + GC.fmt(qty) + (l.branding ? ' with ' + l.branding : ''); }).filter(Boolean);
      var text = 'Dear ' + (ct ? ct.name.split(' ')[0] : 'Sir/Madam').replace('Sir/Madam', 'team') + ',\n\nThank you for your enquiry. Here are our options for ' + o.title + ':\n\n' + lines.join('\n') + '\n\nPrices are before GST. Tell us which ones you like and we will send samples and a formal quote.\n\n' + GC.T.name;
      var mob = ct && ct.mobile ? String(ct.mobile).replace(/\D/g, '').slice(-10) : '';
      G.modal('Send shortlist', (co ? co.name : '') + (ct ? ' · ' + ct.name : ''), '<form data-submit="confirmShortlist" data-id="' + id + '">' + G.field('Message', '<textarea name="text" id="slText" style="min-height:220px">' + esc(text) + '</textarea>') +
        '<div class="row">' + (mob ? '<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/91' + mob + '?text=' + encodeURIComponent(text) + '">Open in WhatsApp</a>' : '<span class="small muted">No mobile on this contact. Copy the message and send it by email.</span>') +
        '<button class="btn">Mark as sent</button></div><p class="honest">Marking it sent moves the enquiry to "' + esc(GC.T.stages[2]) + '" and books a follow-up in 2 days.</p></form>');
    },
    confirmShortlist: function (f, form) {
      var o = G.oppById(form.dataset.id), me = G.me().id;
      if (GC.T.stages.indexOf(o.stage) < 2) GC.moveOpp(o, GC.T.stages[2]);
      D().followups.push(GC.newFollow({ opp: o.id, company: o.company, owner: o.assigned_to || me, due: GC.addDays(GC.today(), 2), method: 'Call', note: 'Ask which options they liked', by: me }));
      o.updated = GC.today();
      G.log('sent', 'Shortlist sent: ' + o.title + ' (' + GC.inPlay(o).length + ' options)', { opp: o.id, company: o.company });
      G.save(); G.closeModal(); G.toast('Shortlist marked as sent. Follow-up booked in 2 days.'); G.render();
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
      var p = String(id).split('|'), o = G.oppById(p[0]); var fb = arguments[3]; if (fb == null) return G.ask('What did the client say about the sample?', '', function (t) { A.sampleFeedback(id, null, null, t); });
      if (!fb) return; o.samples[+p[1]].feedback = fb; G.log('sample', 'Sample feedback: ' + fb, { opp: o.id }); G.save(); G.render();
    },
    saveBrief: function (f, form) {
      var o = G.oppById(form.dataset.id);
      Object.assign(o.brief, { occasion: f.occasion, recipients: f.recipients, qty: +f.qty || null, deadline: f.deadline || null, budgetMin: +f.budgetMin || null, budgetMax: +f.budgetMax || null,
        cities: String(f.cities || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean), branding: f.branding, ucpmp: !!f.ucpmp });
      o.updated = GC.today(); G.log('opp_stage', 'Brief updated: ' + o.title, { opp: o.id }); G.save(); G.toast('Brief saved.'); G.render();
    },
    saveOpp: function (f) {
      var name = String(f.company || '').trim();
      if (name.length < 2) return G.toast('Which company is this for?', 'bad');
      if (!String(f.title || '').trim()) return G.toast('Write what they want, in a few words.', 'bad');
      var me = G.me(), co = GC.findCompany(D().companies, name), made = false;
      if (co && !G.inScope(co)) co = null;
      if (!co) {
        co = GC.newCompany({ name: name, source: f.source || 'phone', assigned_to: me.id, branch: me.branch });
        D().companies.push(co); made = true;
      }
      var o = GC.newOpp({ company: co.id, contact: (G.contactsOf(co.id)[0] || {}).id, title: String(f.title).trim(), source: f.source || co.source, assigned_to: co.assigned_to || me.id, branch: co.branch,
        stage: GC.T.stages[0],
        brief: { text: '', occasion: '', recipients: '', qty: +f.qty || null, deadline: f.deadline || null, budgetMin: null, budgetMax: null, cities: [], branding: '', ucpmp: !!co.pharma } });
      D().opps.push(o);
      if (made) G.log('company_add', 'New client: ' + co.name, { company: co.id });
      G.log('opp_new', 'New requirement: ' + o.title, { opp: o.id, company: co.id }); G.save();
      G.toast(made ? 'Saved. ' + co.name + ' is a new client: add their contact when you can.' : 'Enquiry saved.');
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
      G.save(); G.closeModal(); G.celebrate(); G.toast('Won. Order ' + r.order.no + ' opened and Production has been told.'); G.go('#/order/' + r.order.id);
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
    var co = o.company;
    var r = G.deleteOpp(id);
    if (r.error) { G.toast(r.error, 'bad'); return; }
    G.toast('Deleted.', 'ok');
    G.go(co ? '#/company/' + co : '#/pipeline');
  };

})();
