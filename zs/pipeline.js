/* Opportunities: the pipeline board, one opportunity, and opening a new one.

   A client is a company; an engagement is one build we sell them.
   The stage lives on the engagement, never on the person — so a returning client
   keeps their history instead of being dragged back to "New", and the board
   only ever carries live work. Anything won or lost drops off it and lands on
   the client's record. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  var MINE = false, LINE = '';
  var FQ = '';                      // floor search: name or mobile
  var TAB = '';                     // '' | 'blocked' | 'nofollow' | a stage name
  var PICK = [], OQ = '', BRIEF = '';   // the shortlist being built on a new opportunity

  /* ---- fields typed into the engagement panel and NOT yet saved ----

     These used to write on every `change` event: you tabbed out of a box and it
     was in the store, with a toast that had gone by the time you looked up, and a
     full re-render that put the cursor back at the top of the page. Bhargav's
     words: "there is no submit button". He was right in the way that matters —
     an edit you cannot see, cannot review and cannot back out of is not an edit
     you trust, and typing eight fields meant eight renders.

     So typing now STAGES. The value sits here, the row is marked, a bar keeps
     count, and one button commits the lot. Two things make that safe:

     - the panel RENDERS from here when a key is staged, so a re-render from
       anywhere (the twenty-second pulse, a colleague's change) does not throw
       away what you were halfway through typing.
     - `G.unsaved()` reports the count, and the pulse refuses to re-render the
       screen under your hands while it is not zero. */
  var PENDING = {};          /* field key -> the raw string typed */
  var PENDING_OPP = null;    /* which engagement they belong to */

  function pendingCount() { return Object.keys(PENDING).length; }
  function pendingFor(oppId) { return PENDING_OPP === oppId ? PENDING : {}; }
  function clearPending() { PENDING = {}; PENDING_OPP = null; }

  function D() { return G.D(); }
  function staffName(id) { var u = ZS.staffById(id); return u ? u.name : 'Unassigned'; }
  function visible(o) {
    var me = G.me();
    if (!ZS.acc(me, D().access).clients) return false;
    if (ZS.acc(me, D().access).scope !== 'company' && o.assigned_to !== me.id) return false;
    if (MINE && o.assigned_to !== me.id) return false;
    if (LINE && o.product !== LINE) return false;
    if (FQ && !matchesSearch(o)) return false;
    if (!matchesTab(o)) return false;
    return true;
  }

  function matchesTab(o) {
    if (!TAB) return true;
    if (TAB === 'blocked') return o.blocked_on === 'client';
    if (TAB === 'nofollow') return !ZS.nextFollow(D().followups || [], o.id);
    return o.stage === TAB;
  }
  /* A store written by an older build may have no followups array at all, and
     a tab count is not worth a crash card. */
  function CC_stalled() {
    var fu = D().followups || [];
    return (D().opportunities || []).filter(ZS.isOpen).filter(function (o) {
      return !ZS.nextFollow(fu, o.id);
    });
  }

  /* Name or mobile. A number is what somebody has in their hand when they ring,
     so digits are matched against the digits of the mobile and nothing else. */
  function matchesSearch(o) {
    var q = FQ.toLowerCase().trim();
    if (!q) return true;
    var c = G.clientById(o.client);
    if (!c) return false;
    var digits = q.replace(/\D/g, '');
    if (digits.length >= 3 && ZS.normMobile(c.mobile).indexOf(digits) >= 0) return true;
    var hay = [c.name, c.mobile, o.title].join(' ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  }

  /* ---------------- the floor: one board, one ladder ---------------- */

  V.floor = function () {
    var opps = D().opportunities || [];
    var live = opps.filter(ZS.isOpen).filter(visible);
    var cols = ZS.pipelineByStage(opps, visible);
    var products = G.products(), byId = {};
    products.forEach(function (c) { byId[c.id] = c; });

    var closed = opps.filter(function (o) {
      return !ZS.isOpen(o) && visible(o) && G.inRange(o.closed);
    });
    var won = closed.filter(function (o) { return o.outcome === 'won'; });

    var h = '<div class="ph"><div><h1>Sales</h1>' +
      '<p>Every live deal, from the first enquiry to the day they sign. ' +
      'One opportunity per engagement — a referral and a Meta lead both land here.</p></div>' +
      /* One verb. Every enquiry worth writing down IS an opportunity, and a
         second button for the same act only made people wonder which to press. */
      '<div class="right"><a class="btn" href="#/oppnew">+ New opportunity</a></div></div>';

    h += G.rangeBar(won.length + ' won and ' + (closed.length - won.length) +
      ' lost in this window · the board itself always shows live deals only');

    /* Tabs first, because "how many are sitting at MOU sent" is the question
       you actually arrive with. Selecting one narrows the board to it. */
    h += '<div class="btabs" role="tablist">' +
      ['', 'blocked', 'nofollow'].concat(ZS.OPEN_STAGES).map(function (t) {
        var n, label;
        if (t === '') { n = live.length; label = 'All'; }
        else if (t === 'blocked') {
          n = live.filter(function (o) { return o.blocked_on === 'client'; }).length;
          label = 'Waiting on client';
        } else if (t === 'nofollow') {
          n = CC_stalled().length; label = 'Gone quiet';
        } else { n = (cols[t] || []).length; label = t; }
        if (!n && t !== '') return '';
        return '<button class="btab" role="tab" data-act="floorTab" data-id="' + esc(t) + '" ' +
          'aria-selected="' + (TAB === t ? 'true' : 'false') + '">' + esc(label) +
          '<b>' + n + '</b></button>';
      }).join('') + '</div>';

    h += '<div class="chips" style="margin-bottom:16px">' +
      '<input id="fq" type="search" placeholder="Search name or number&hellip;" value="' + esc(FQ) + '" ' +
      'style="background:var(--coal);border:1px solid var(--line);padding:8px 12px;min-width:210px" autocomplete="off">' +
      (FQ ? '<button class="chip" data-act="floorClear" aria-pressed="true">Clear &ldquo;' +
            esc(FQ) + '&rdquo;</button>' : '') +
      '<button class="chip" data-act="pipeMine" aria-pressed="' + (MINE ? 'true' : 'false') + '">Only mine</button>' +
      '<button class="chip" data-act="pipeLine" data-id="" aria-pressed="' + (LINE ? 'false' : 'true') + '">Everything we sell</button>' +
      ZS.PRODUCTS.map(function (b) {
        return '<button class="chip" data-act="pipeLine" data-id="' + esc(b.id) + '" aria-pressed="' +
          (LINE === b.id ? 'true' : 'false') + '">' + esc(b.name) + '</button>';
      }).join('') +
      '<span style="margin-left:auto;font-size:12px;color:var(--dim)">' + live.length +
      ' live &middot; ' + ZS.money(live.reduce(function (a, o) { return a + ZS.oppValue(o); }, 0)) +
      ' of budget in play</span></div>';

    var stalled = ZS.needsAttention(opps.filter(visible), D().followups);
    if (stalled.length) {
      h += '<div class="card" style="border-color:var(--warn);margin-bottom:16px">' +
        '<h3 style="color:var(--warn)">' + stalled.length + ' deal' + (stalled.length === 1 ? '' : 's') +
        ' with no follow-up booked, or one already overdue</h3>' +
        '<p class="m">These are the ones that go quiet. ' +
        stalled.slice(0, 8).map(function (o) {
          var c2 = G.clientById(o.client);
          return '<button class="minibtn" data-act="logFollow" data-id="' + esc(o.id) + '" style="margin:6px 5px 0 0">' +
            esc(c2 ? c2.name : 'Client') + '</button>';
        }).join('') + '</p></div>';
    }

    h += '<div class="board pipe">' + ZS.OPEN_STAGES.map(function (st) {
      var rows = cols[st] || [];
      return '<div class="col"><h4 title="' + esc(ZS.STAGE_HELP[st] || '') + '">' + esc(st) +
        '<i>' + rows.length + '</i></h4>' +
        '<div class="colhelp">' + esc(ZS.STAGE_HELP[st] || '') + '</div>' +
        (rows.length
          ? rows.map(function (o) {
              var c = G.clientById(o.client);
              var tier = c ? ZS.clientTier(c, D().opportunities) : ['—', 'dim'];
              var nx = ZS.nextFollow(D().followups, o.id);
              var flag = !nx ? ['warn', 'no follow-up']
                : ZS.isOverdue(nx) ? ['bad', 'overdue ' + nx.due]
                : ZS.isDueToday(nx) ? ['warn', 'due today']
                : ['dim', 'next ' + nx.due];
              var play = (o.inplay || []).map(function (s2) { return byId[s2]; }).filter(Boolean);
              return '<div class="vcard" data-act="openDrawer" data-id="' + esc(o.id) + '">' +
                '<b>' + esc(c ? c.name : 'Unknown') + '</b>' +
                '<span>' + esc(o.title || 'Enquiry') + '</span>' +
                (play.length
                  ? '<span class="playline">' + play.map(function (p2) {
                      return esc(p2.model || p2.title);
                    }).join(', ') + '</span>'
                  : (o.lines.length ? '<span class="oppbud" style="color:var(--dim)">' + o.lines.length +
                      ' shortlisted, none in play</span>' : '')) +
                '<span class="oppmeta"><span class="pill ' + tier[1] + '">' + tier[0] + '</span>' +
                (ZS.atRisk(D().followups, o.id) ? '<span class="pill bad">at risk</span>' : '') +
                '<span>' + esc(staffName(o.assigned_to).split(' ')[0]) + '</span></span>' +
                '<span class="oppmeta"><span class="pill ' + flag[0] + '">' + esc(flag[1]) + '</span>' +
                (o.expected ? '<span>buying ' + esc(o.expected) + '</span>' : '') + '</span>' +
                '<select class="cardstage" data-stage="' + esc(o.id) + '" ' +
                  'aria-label="Move ' + esc(c ? c.name : 'this deal') + ' to another stage">' +
                  ZS.OPP_STAGES.map(function (st2) {
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
        '<div class="scroller"><table class="tbl"><thead><tr><th>Client</th><th>Opportunity</th>' +
        '<th>Outcome</th><th>Service line</th><th class="num">Value</th><th>Owner</th><th>Closed</th>' +
        '</tr></thead><tbody>' +
        closed.slice().sort(function (a, b) { return String(b.closed).localeCompare(String(a.closed)); })
        .map(function (o) {
          var c = G.clientById(o.client), line = byId[o.won_line];
          return '<tr data-act="openDrawer" data-id="' + esc(o.id) + '">' +
            '<td><b>' + esc(c ? c.name : '—') + '</b></td>' +
            '<td>' + esc(o.title || 'Enquiry') + '</td>' +
            '<td><span class="pill ' + (o.outcome === 'won' ? 'ok' : 'bad') + '">' + esc(o.stage) + '</span></td>' +
            '<td>' + esc(ZS.productName(o.product)) + '</td>' +
            '<td class="num">' + (o.won_price ? ZS.money(o.won_price) : '—') + '</td>' +
            '<td>' + esc(staffName(o.assigned_to)) + '</td>' +
            '<td>' + esc(o.closed || '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    h += G.drawerHTML ? G.drawerHTML() : '';
    return h;
  };

  /* ---------------- one opportunity ---------------- */

  /* ---- one renderer, two depths ----

     `brief` is the quick-look drawer. Bhargav's rule for it: show what needs a
     decision (follow-ups due, appointments, money not cleared, a stage that is
     blocked) and what we already HOLD, and nothing that is only there to be
     typed into. So the drawer drops the sixty-box editing grid, the document
     slots and the paperwork reader, and shows the registry read-only with the
     blanks left out. Open full page is one button above it.

     A FLAG, NOT A SECOND RENDERER. Two renderings of one record drift apart,
     and then a field gets fixed in only one of them. */
  V.opp = function (id, brief) {
    var o = (D().opportunities || []).filter(function (x) { return x.id === id; })[0];
    if (!o) return G.deny('No such opportunity', 'That one is not on the board.');
    var c = G.clientById(o.client);
    if (!c) return G.deny('Orphaned opportunity', 'The client behind it has gone.');
    if (!ZS.canOpen(o, G.me(), D().access))
      return G.deny('Not in your view', 'This belongs to ' + staffName(o.assigned_to) + '.');

    var products = G.products(), byId = {};
    products.forEach(function (x) { byId[x.id] = x; });
    var sum = ZS.clientSummary(c, D().opportunities, products);
    var live = ZS.isOpen(o);
    var lineNames = products.map(function (x) { return x.name; });

    /* Header: who, and the one control that matters — which stage is it in. */
    var h = '<div class="ph"><div><h1>' + esc(c.name) +
      (o.ref ? ' <span class="refchip">' + esc(o.ref) + '</span>' : '') + '</h1>' +
      '<p>' + esc(o.title || 'Enquiry') + ' &middot; ' + esc(ZS.SOURCES[o.source] || o.source) +
      ' &middot; ' + esc(staffName(o.assigned_to)) +
      ' &middot; ' + esc(ZS.lineName(o.product)) +
      /* WHO IT RUNS THROUGH. One person inside the company, named on the
         engagement itself, because "the client" is a company and a company has
         several people who each want to hear about different things. */
      ' &middot; ' + (ZS.oppContact(o, c)
        ? '<b style="color:var(--tx)">' + esc(ZS.oppContact(o, c).name) + '</b>' +
          (ZS.oppContact(o, c).designation ? ', ' + esc(ZS.oppContact(o, c).designation) : '')
        : '<b style="color:var(--warn)">nobody named</b>') +
      '</p></div>' +
      '<div class="right">' +
      (ZS.contactsOf(c).length > 1 && G.acc().clients
        ? '<span class="stagepick"><label for="o-contact">Contact</label>' +
          '<select id="o-contact" data-oppcontact="' + esc(o.id) + '">' +
            ZS.contactsOf(c).map(function (ct) {
              return '<option value="' + esc(ct.id) + '"' +
                ((ZS.oppContact(o, c) || {}).id === ct.id ? ' selected' : '') + '>' +
                esc(ct.name) + '</option>';
            }).join('') + '</select></span>'
        : '') +
      /* ⚠️ THE VALUE BELONGS BESIDE THE STAGE. It used to live in Terms, under
         "Fee agreed", four screens down among the paperwork: the one number
         everybody asks about, filed with the GST certificate. Stage and value
         are the two things somebody wants within a second of opening this. */
      (G.acc().cost
        ? '<span class="stagepick"><label>Opportunity value</label>' +
          '<b class="oppval' + (ZS.oppValue(o) ? '' : ' none') + '">' +
          (ZS.oppValue(o) ? ZS.money(ZS.oppValue(o)) : 'not set') + '</b></span>'
        : '') +
      '<span class="stagepick"><label for="o-stage">Stage</label>' +
      '<select id="o-stage" data-stage="' + esc(o.id) + '">' +
        ZS.OPP_STAGES.map(function (st) {
          return '<option value="' + esc(st) + '"' + (o.stage === st ? ' selected' : '') + '>' +
            esc(st) + '</option>';
        }).join('') + '</select></span>' +
      '<a class="btn alt" href="#/client/' + esc(c.id) + '">Client</a>' +
      (G.acc().clients ? '<button class="btn alt" data-act="editOpp" data-id="' + esc(o.id) + '">Edit</button>' : '') +
      (ZS.canDelete(G.me())
        ? '<button class="btn danger" data-act="askDeleteOpp" data-id="' + esc(o.id) + '">Delete</button>'
        : '') +
      '</div></div>';

    h += '<p class="stagenote">' + esc(ZS.STAGE_HELP[o.stage] || '') +
      (live ? '' : ' &mdash; closed on ' + esc(o.closed || '')) + '</p>';

    if (!live) {
      h += '<div class="card" style="border-color:var(--' + (o.outcome === 'won' ? 'ok' : 'bad') + ');margin-bottom:18px">' +
        '<p class="m">' + (o.outcome === 'won'
          ? 'Signed for ' + esc(ZS.productName(o.product)) +
            (o.won_price ? ' for ' + ZS.money(o.won_price) : '') + '. It is on their record now.'
          : esc(o.lost_reason || 'No reason recorded.')) +
        ' Move the stage above to put it back on the floor.</p></div>';
    }

    /* ---- what happens next, first ----

       Chasing is the job. Everything else on this screen is a record of work
       already done, so the two things somebody comes here to DO — log the call
       they just had, and book the next meeting — sit above the fold, before the
       money and long before the paperwork. Order on a screen is a claim about
       what matters; this one used to open with an empty invoice table. */
    /* ---- follow-ups, against the engagement ----

       This was a per-line panel: a cover photo, model/year/variant, a price and
       a "shown / test-driven / bought" mark for each car in play, with the screen
       insisting "follow-ups hang off it, not off the engagement as a whole". That
       is true of a dealer with forty cars on a forecourt and exactly backwards
       here. We sell one thing per engagement, so the engagement IS the thread. */
    var fols = ZS.followsFor(D().followups, 'opp', o.id);
    var nx = fols.filter(function (f) { return !f.done; })
      .sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); })[0];
    var doneF = fols.filter(function (f) { return f.done; });
    var avg = doneF.length
      ? Math.round(10 * doneF.reduce(function (a, f) {
          return a + ZS.scoreNote(f.note, { outcome: f.outcome, lineNames: lineNames }).score;
        }, 0) / doneF.length) / 10
      : null;

    h += '<p class="eyebrow" style="margin-top:6px">Follow-ups' +
      (avg !== null ? ' <span class="pill ' + (avg >= 8 ? 'ok' : avg >= 5 ? 'warn' : 'bad') + '">' +
        'notes ' + avg + '/10</span>' : '') +
      ' <span class="pill ' + (!nx ? 'warn' : ZS.isOverdue(nx) ? 'bad' : 'dim') + '">' +
        (!nx ? 'no next date' : (ZS.isOverdue(nx) ? 'overdue ' : 'next ') + esc(nx.due)) + '</span></p>';

    h += '<div class="card" style="padding:0">' +
      (fols.length
        ? '<div class="follist">' + fols.map(function (f) { return folRow(f, lineNames); }).join('') + '</div>'
        : '<p class="m pad">Nothing logged yet. Every call, every "they said next week", goes here ' +
          '&mdash; it is the only record of why this deal is where it is.</p>') +
      '</div>' +
      (live ? '<div class="invadd"><button class="btn" data-act="logFollow" data-id="' + esc(o.id) +
              '">+ Log a follow-up</button></div>' : '');


    /* meetings and their minutes */
    var mts = (o.meetings || []).slice().sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    var next = ZS.upcoming(o.meetings);
    h += '<p class="eyebrow" style="margin-top:20px">Appointments' +
      (next.length ? ' <span class="pill warn">next ' + esc(next[0].at) + '</span>' : '') +
      '</p><div class="card" style="padding:0">' +
      (mts.length
        ? mts.map(function (m) {
            var gap = ZS.meetingGap(m);
            return '<div class="mtrow' + (m.done ? '' : ' soon') + '">' +
              '<div class="mthead"><b>' + esc(m.kind) + '</b>' +
              '<span>' + esc(ZS.MEETING_MODES[m.mode] || 'Google Meet') + ' &middot; ' +
              esc(m.at) + (m.time ? ' ' + esc(m.time) : '') +
              (m.mins_long && m.mins_long !== 60 ? ' &middot; ' + m.mins_long + ' min' : '') +
              (m.who ? ' &middot; ' + esc(m.who) : '') + '</span>' +
              '<span class="pill ' + (m.done ? 'ok' : gap ? 'warn' : 'em') + '">' +
                (m.done ? 'held' : gap ? esc(gap) : 'booked') + '</span>' +
              (live ? '<button class="xbtn" data-act="dropMeeting" data-id="' + esc(o.id + '|' + m.id) +
                      '" aria-label="Remove">&times;</button>' : '') + '</div>' +
              /* the link and the address are the two things somebody needs in the
                 ten seconds before a meeting, so they are on the row rather than
                 behind a click */
              (m.link ? '<p class="mtmin"><a class="minibtn" href="' + esc(m.link) +
                        '" target="_blank" rel="noopener">Join the Meet</a> ' +
                        '<span class="dimtxt">' + esc(m.link.replace(/^https?:\/\//, '')) +
                        '</span></p>' : '') +
              (m.where ? '<p class="mtmin"><b>Where</b> ' + esc(m.where) + '</p>' : '') +
              (m.minutes ? '<p class="mtmin">' + esc(m.minutes) + '</p>'
                         : (m.done ? '<p class="mtmin dimtxt">No minutes written.</p>' : '')) +
              '</div>';
          }).join('')
        : '<p class="m pad">Nothing booked. Book one, or write up one that happened.</p>') +
      '</div>' +
      (live ? '<div class="invadd"><button class="btn alt" data-act="addMeeting" data-id="' + esc(o.id) +
              '">+ Log or book a meeting</button></div>' : '');


    /* Money next: the first invoice goes out at Invoiced, before there is any
       build to show, so this cannot live inside the delivery panel. */
    if (G.invoiceSection) h += G.invoiceSection(o, c);
    /* Documents belong to the engagement from the MOU onwards, not only once
       it reaches delivery — the MOU is the first thing uploaded and it happens
       long before there is a build. */
    if (G.docSection && !brief) {
      h += '<div class="card pad" style="margin-top:18px">' +
        G.docSection('deal', o.id, ZS.docsOf(o.proc) .concat(o.docs || []), G.acc().clients,
          'Everything filed against this engagement. A slot takes as many files as it needs.',
          o.proc ? (ZS.PROC_NEEDS[o.proc.stage] || []) : []) + '</div>';
    }
    if (G.procPanel) h += G.procPanel(o, c, byId[o.won_line], brief);

    /* ---------------- the deal itself ----------------

       Only fields somebody can type into. The panel that used to sit here
       reported "Trade-in: None mentioned", "Finance: Not discussed" and a
       budget nobody had been asked for — three labels with no input behind
       them, inherited whole from a dealer build. A field with no input is a
       lie with a label. */

    h += '<div class="cols" style="align-items:start;margin-top:22px"><div>';

    h += '<p class="eyebrow">The deal</p><div class="card pad">' +
      '<ul class="ledger">' +
      li('Product', ZS.productName(o.product)) +
      li('Opportunity value', G.acc().cost ? ZS.money(ZS.oppValue(o)) : '₹ ••••') +
      li('Source', (ZS.SOURCES[o.source] || o.source || '—') +
         (o.campaign ? ' · ' + esc((ZS.campaignById(D(), o.campaign) || {}).name || '') : '')) +
      li('Opened', o.created) +
      li('Last moved', o.updated) +
      /* a date picker is a box to type into, so the drawer reads the date back
         instead of offering to change it */
      (brief && o.expected ? li('Expected to close', o.expected) : '') +
      '</ul>' +
      (brief ? ''
        : '<div class="inlinef"><label for="exp-' + esc(o.id) + '">Expected to close</label>' +
          '<input id="exp-' + esc(o.id) + '" type="date" data-expected="' + esc(o.id) + '" ' +
          'value="' + esc(o.expected || '') + '"></div>') +
      (o.scope
        ? '<h4 class="sec" style="margin-top:16px">Scope</h4><p class="m">' + esc(o.scope) + '</p>'
        : '') +
      '</div>';

    /* ---- what we still do not know about this engagement ----

       ZS.FIELDS is a 60-field registry of everything an engagement should carry:
       who they are, the billing identity, the terms, the plan, the build, the
       credentials, what we gave away free. It existed for months scored against
       a PRODUCT record, so it never reached a screen. Composed against the real
       engagement it answers the question the owner actually has — which of these
       builds is running on a handshake. */
    var rec = ZS.engagementRecord(o, c, D().invoices);
    var sc = ZS.scoreRecord(rec);
    var mayEdit = G.acc().editStock && live !== false;

    /* ---- the quick look shows what we HOLD, never sixty empty boxes ----

       Bhargav, on the drawer: only the details that are filled up, or the ones
       that need an action. The full grid is a filing job with a save button, and
       a filing job is not why anybody opened a card on the board. So in here the
       registry is read back, filled fields only, no controls, no reader. The
       score pill stays because "11 of 60" IS the thing that needs an action, and
       it is the one line that says the rest exists. */
    if (brief) {
      var filled = ZS.FIELDS.filter(function (fd) { return ZS.hasField(rec, fd); });
      h += '<p class="eyebrow" style="margin-top:20px">On file' +
        ' <span class="pill ' + (sc.pct >= 80 ? 'ok' : sc.pct >= 50 ? 'warn' : 'bad') + '">' +
        sc.present + ' of ' + sc.total + '</span></p><div class="card pad">' +
        (filled.length
          ? '<ul class="ledger">' + filled.map(function (fd) {
              return li(esc(fd.label),
                fd.type === 'derived' ? 'yes' : String(ZS.fieldValue(rec, fd)));
            }).join('') + '</ul>'
          : '<p class="m" style="margin:0">Nothing on file against this one yet.</p>') +
        '</div>';
    } else {
      h += '<p class="eyebrow" style="margin-top:20px">On file' +
        ' <span class="pill ' + (sc.pct >= 80 ? 'ok' : sc.pct >= 50 ? 'warn' : 'bad') + '">' +
        sc.present + ' of ' + sc.total + '</span></p>' +
        '<div class="card pad">' +
        /* ⚠️ THE SAVE BUTTON WAS ONLY AT THE FOOT OF THIS PANEL, and the panel is
           sixty fields long. Bhargav looked at the top of the engagement, saw no
           button, and reasonably concluded there was none. A control you have to
           scroll past forty boxes to find is a control that does not exist. It is
           now at BOTH ends: the top one appears as soon as something is typed and
           stays in view, the bottom one is where your hands already are. */
        (mayEdit ? recBar(o, 'top') : '') +
        '<p class="m" style="margin-top:0">Everything this engagement should carry. Type it in ' +
        'here, or drop the paperwork in at the bottom and let it fill what it recognises. ' +
        'Anything still blank is a thing we would have to ask them for at the worst moment.</p>';

      ZS.FIELD_GROUPS.forEach(function (g) {
        var inGroup = ZS.FIELDS.filter(function (fd) { return fd.group === g; });
        if (!inGroup.length) return;
        var done = inGroup.filter(function (fd) { return ZS.hasField(rec, fd); }).length;
        h += '<h4 class="sec" style="margin-top:16px">' + esc(g) +
          ' <span class="hint" style="font-weight:400">' + done + ' of ' + inGroup.length + '</span></h4>' +
          '<div class="recgrid">' + inGroup.map(function (fd) {
            return recField(o, fd, rec, mayEdit);
          }).join('') + '</div>';
      });

      /* ---- the submit button ----
         Sticky at the foot of the panel, because the fields run past a screenful
         and a button you have to scroll to find is a button nobody presses. */
      if (mayEdit) h += recBar(o);

      /* ---- consolidate from the paperwork ----
         The same reader the client form uses, pointed at this engagement. It fills
         only what is blank and only what validates, so a wrong GSTIN in a scanned
         PDF leaves the field empty rather than filling it in wrong. */
      if (mayEdit) {
        h += '<div class="scanbox" style="margin-top:18px">' +
          '<div class="cardhead"><h3>Fill it from the paperwork</h3>' +
          '<span class="hint">MOU, invoice, handover note, a credentials sheet</span></div>' +
          '<p class="m">Drop in as many files as you like. Anything recognisable across all of ' +
          'them &mdash; company name, GSTIN, PAN, IFSC, account number, fee, payment split, ' +
          'build length, signing date, repository, login and password &mdash; is read out and ' +
          'written into the blanks above. Numbers are checked first, so a bad one is left blank ' +
          'rather than filled in wrong. Nothing already filled gets overwritten.</p>' +
          '<div class="scanrow">' +
            '<label class="btn alt">Upload documents' +
              '<input type="file" id="rec-scan" multiple hidden ' +
              'accept="image/*,.pdf,.txt,.csv,.doc,.docx"></label>' +
            '<button type="button" class="btn alt" data-act="pasteRecScan" data-id="' + esc(o.id) +
              '">Paste the text instead</button>' +
            '<span class="hint" id="rec-scan-note">Nothing read yet.</span>' +
          '</div>' +
          '<p class="hint" style="margin-top:8px">Every file you drop here is also filed against ' +
          'this engagement, under Documents above, where you can open, rename, re-file or ' +
          'remove it.</p>' +
          '</div>';
      }
      h += '</div>';
    }

    /* what they asked for, as it changes.
       An empty list in the drawer is an invitation to type, so it is left out of
       the quick look entirely; with something in it, it is a record of what they
       asked for and it stays. */
    if (!brief || (o.requirements || []).length)
    h += '<p class="eyebrow" style="margin-top:20px">Requirements</p><div class="card" style="padding:0">' +
      ((o.requirements || []).length
        ? o.requirements.slice().reverse().map(function (r) {
            return '<div class="pickrow"><div class="t"><b>' + esc(r.text) + '</b>' +
              '<span>' + esc(r.at) + (r.stage ? ' · at ' + esc(r.stage) : '') +
              ' · ' + esc(staffName(r.by)) + '</span></div>' +
              (live ? '<button class="xbtn" data-act="dropReq" data-id="' + esc(o.id + '|' + r.id) +
                      '" aria-label="Remove">&times;</button>' : '') + '</div>';
          }).join('')
        : '<p class="m pad">Nothing recorded yet. Add what they ask for as it comes up.</p>') +
      '</div>' +
      (live && !brief ? '<div class="invadd"><button class="btn alt" data-act="addReq" data-id="' + esc(o.id) +
              '">+ Add a requirement</button></div>' : '');

    h += '</div><div>';

    /* what we handed over */
    if (!brief || (o.deliverables || []).length)
    h += '<p class="eyebrow">What we delivered</p><div class="card" style="padding:0">' +
      ((o.deliverables || []).length
        ? o.deliverables.slice().reverse().map(function (dl) {
            return '<div class="pickrow"><div class="t"><b>' + esc(dl.label) + '</b>' +
              (dl.url ? '<span><a href="' + esc(dl.url) + '" target="_blank" rel="noopener">' +
                        esc(dl.url.replace(/^https?:\/\//, '').slice(0, 52)) + '</a></span>'
                      : '<span>' + esc(dl.note || '—') + '</span>') +
              '</div><span class="sub">' + esc(dl.at) + '</span>' +
              '<button class="xbtn" data-act="dropDeliv" data-id="' + esc(o.id + '|' + dl.id) +
              '" aria-label="Remove">&times;</button></div>';
          }).join('')
        : '<p class="m pad">Nothing handed over yet. Demo links, documents, credentials go here.</p>') +
      '</div>' +
      (brief ? '' : '<div class="invadd"><button class="btn alt" data-act="addDeliv" data-id="' + esc(o.id) +
      '">+ Add a link or file</button></div>');

    h += '</div></div>';

    /* ---- and say out loud that there is more ----
       A screen that quietly leaves things out is a screen somebody stops
       trusting. This names what was left out and where it is. */
    if (brief) {
      h += '<p class="hint" style="margin-top:20px;padding-top:14px;border-top:1px solid var(--line)">' +
        'That is the quick look: what needs doing, and what we already hold. The documents, ' +
        'every blank still to fill and anything you can type into are on the full page. ' +
        'Press Open full page at the top.</p>';
    }
    return h;
  };

  /* One logged conversation, with the score for what was written. */
  function folRow(f, lineNames) {
    var sc = f.done ? ZS.scoreNote(f.note, { outcome: f.outcome, lineNames: lineNames }) : null;
    var cls = f.done ? 'done' : ZS.isOverdue(f) ? 'over' : ZS.isDueToday(f) ? 'soon' : '';
    return '<div class="folrow"><span class="dot ' + cls + '"></span><div class="t">' +
      '<b>' + esc(f.method) + ' &middot; ' + esc(f.done ? (f.done_at || f.due) : f.due) +
      (f.done ? '' : ' <span class="pill ' + (ZS.isOverdue(f) ? 'bad' : 'warn') + '">due</span>') + '</b>' +
      (f.note ? '<p>' + esc(f.note) + '</p>' : '<p style="color:var(--dim)">No remark written.</p>') +
      '<span class="meta">' + (f.outcome ? esc(f.outcome) + ' &middot; ' : '') +
      esc(staffName(f.by || f.owner)) + '</span></div>' +
      (sc
        ? '<button class="scorechip ' + sc.band + '" data-act="explainScore" data-id="' + esc(f.id) + '" ' +
          'title="How this was scored">' + sc.score + '<span>/10</span></button>'
        : '<button class="minibtn" data-act="doneFollow" data-id="' + esc(f.id) + '">Done</button>') +
      '</div>';
  }


  /* One row of the registry: what we hold, and a control to change it.

     A field the panel can only REPORT on is half a feature — the screen said
     "GST number" was missing and gave you nowhere to put it, so the only way to
     fill it was to go and find the client record. Derived fields stay read-only
     because they are worked out from the plan, and say so. */
  function recField(o, fd, rec, mayEdit) {
    var v = ZS.fieldValue(rec, fd);
    var has = ZS.hasField(rec, fd);
    /* something typed and not yet saved wins over what is on file, so a
       re-render from the pulse does not wipe what you were in the middle of */
    var pend = pendingFor(o.id);
    var dirty = pend.hasOwnProperty(fd.key);
    if (dirty) { v = pend[fd.key]; has = String(v) !== ''; }
    var id = 'rf-' + o.id + '-' + fd.key;
    var name = 'data-recfield="' + esc(o.id + '|' + fd.key) + '"';
    var cls = 'recrow' + (has ? '' : ' blank') + (dirty ? ' dirty' : '');

    if (fd.type === 'derived') {
      return '<div class="' + cls + ' derived"><label>' + esc(fd.label) + '</label>' +
        '<span class="recval">' + (has ? '&#10003; yes' : '&mdash;') + '</span>' +
        '<span class="rechint">Worked out from the plan.</span></div>';
    }
    if (!mayEdit) {
      return '<div class="' + cls + '"><label>' + esc(fd.label) + '</label>' +
        '<span class="recval">' + esc(has ? String(v) : '—') + '</span></div>';
    }

    /* Country, State and City render together, as one chained trio, at the
       Country row; the State and City rows are drawn there, not on their own */
    if (fd.type === 'place') {
      if (fd.key !== 'country') return '';
      var valOf = function (k) {
        var f2 = ZS.FIELDS.filter(function (x) { return x.key === k; })[0];
        if (pend.hasOwnProperty(k)) return pend[k];
        return f2 && ZS.hasField(rec, f2) ? String(ZS.fieldValue(rec, f2)) : '';
      };
      var keyOf = { country: 'country', state: 'state', city: 'city' };
      return ZS.placeFields({
        /* blank stays blank ("Choose"); India is only the list to offer */
        id: 'rf-' + o.id, country: valOf('country'), state: valOf('state'), city: valOf('city'), assume: 'India',
        attrs: {
          country: ' data-recfield="' + esc(o.id + '|country') + '"',
          state: ' data-recfield="' + esc(o.id + '|state') + '"',
          city: ' data-recfield="' + esc(o.id + '|city') + '"'
        },
        wrap: function (label, cid, control) {
          var k = keyOf[cid.slice(cid.lastIndexOf('-') + 1)];
          var isDirty = pend.hasOwnProperty(k), filled = !!valOf(k);
          return '<div class="recrow' + (filled ? '' : ' blank') + (isDirty ? ' dirty' : '') + '">' +
            '<label for="' + esc(cid) + '">' + esc(label) + '</label>' + control +
            (isDirty ? '<span class="rechint dirtyhint">Not saved yet.</span>' : '') + '</div>';
        }
      }).join('');
    }

    var control;
    if (fd.type === 'select') {
      control = '<select id="' + esc(id) + '" ' + name + '>' +
        '<option value="">—</option>' +
        (fd.options || []).map(function (op) {
          return '<option value="' + esc(op) + '"' + (String(v) === String(op) ? ' selected' : '') +
            '>' + esc(op) + '</option>';
        }).join('') + '</select>';
    } else if (fd.type === 'textarea') {
      control = '<textarea id="' + esc(id) + '" ' + name + ' rows="2">' + esc(has ? v : '') + '</textarea>';
    } else {
      control = '<input id="' + esc(id) + '" ' + name +
        ' type="' + (fd.type === 'date' ? 'date' : fd.type === 'number' ? 'number' : 'text') + '"' +
        ' value="' + esc(has ? String(v) : '') + '"' +
        (fd.unit ? ' placeholder="' + esc(fd.unit) + '"' : '') + '>';
    }
    return '<div class="' + cls + '"><label for="' + esc(id) + '">' + esc(fd.label) + '</label>' +
      control +
      (dirty ? '<span class="rechint dirtyhint">Not saved yet.</span>'
             : fd.note ? '<span class="rechint">' + esc(fd.note) + '</span>' : '') + '</div>';
  }

  /* an ISO date in a read-out reads "1 Oct 2026", never 2026-10-01 or 01/10/2026 */
  function li(k, v) { return '<li><span>' + k + '</span><b>' + esc(ZS.niceDate(v)) + '</b></li>'; }

  /* ---------------- a new opportunity ---------------- */

  /* ---------------- a new opportunity ----------------

     An enquiry IS an opportunity. There is no separate "log an enquiry" step,
     because every enquiry worth writing down is an attempt to sell somebody
     something, and a second verb for the same act only made people wonder which
     one they were supposed to press.

     So: pick the client (or add one), say what they want, done. */

  V.oppnew = function (clientId) {
    if (!G.acc().clients) return G.deny('Not in your view', 'Client records are switched off for your role.');
    var c = clientId ? G.clientById(clientId) : null;

    var h = '<div class="ph"><div><h1>New opportunity</h1>' +
      '<p>' + (c ? 'Another run at ' + esc(c.name) + '. Their history stays intact.'
                 : 'Pick the client first &mdash; everything we already know about them loads in.') +
      '</p></div><div class="right">' +
      (c ? '' : '<a class="btn alt" href="#/clientnew">+ New client</a>') +
      '<a class="btn alt" href="#/floor">Cancel</a></div></div>';

    if (!c) {
      var people = D().clients.filter(function (x) { return ZS.inScope(x, G.me(), D().access); });
      h += '<div class="card"><div class="cardhead pad"><h3>Which client?</h3>' +
        '<span class="hint">' + people.length + ' on the books</span></div>' +
        '<div class="scroller" style="max-height:460px"><table class="tbl"><thead><tr>' +
        '<th>Client</th><th>Sector</th><th>They are</th><th>Where</th>' +
        '<th class="num">Open</th><th class="num">Signed</th><th></th>' +
        '</tr></thead><tbody>' + people.map(function (x) {
          var sum = ZS.clientSummary(x, D().opportunities, G.products());
          var a2 = x.address || {};
          return '<tr data-act="startOpp" data-id="' + esc(x.id) + '">' +
            '<td><b>' + esc(x.name) + '</b>' +
              (ZS.primaryContact(x) ? '<span class="sub">' + esc(ZS.primaryContact(x).name) +
               (ZS.primaryContact(x).designation ? ' · ' + esc(ZS.primaryContact(x).designation) : '') +
               '</span>' : '') + '</td>' +
            '<td>' + esc(x.sector || '—') + '</td>' +
            '<td><span class="pill ' + (x.type === 'client' ? 'ok' : x.type === 'past' ? 'dim' : 'info') + '">' +
              esc(ZS.CLIENT_TYPES[x.type] || 'Lead') + '</span></td>' +
            '<td>' + esc([a2.city, a2.country].filter(Boolean).join(', ') || '—') + '</td>' +
            '<td class="num">' + sum.open.length + '</td>' +
            '<td class="num">' + sum.bought.length + '</td>' +
            '<td><button class="minibtn" data-act="startOpp" data-id="' + esc(x.id) + '">Open one</button></td></tr>';
        }).join('') + '</tbody></table></div></div>';
      return h;
    }

    var sum = ZS.clientSummary(c, D().opportunities, G.products());
    if (sum.open.length) {
      h += '<div class="card" style="border-color:var(--warn);margin-bottom:16px">' +
        '<h3 style="color:var(--warn)">' + esc(c.name) + ' already has ' + sum.open.length +
        ' open</h3><p class="m">Only open a second one if it is genuinely a different piece of work.</p>' +
        sum.open.map(function (x) {
          return '<p style="margin-top:9px"><button class="minibtn" data-act="openOpp" data-id="' + esc(x.id) +
            '">' + esc(x.title || 'Opportunity') + ' &middot; ' + esc(x.stage) + '</button></p>';
        }).join('') + '</div>';
    }

    /* WHO IT IS FOR, FIRST, BECAUSE IT DECIDES EVERYTHING ELSE.

       This form used to open straight onto "Call it" with the client only
       mentioned in a panel on the right, and no way to name the person at all.
       So an engagement was created against a company and nobody in it, and
       every message afterwards went to whoever happened to be the company's
       main contact. A client is a company; an engagement runs through exactly
       one person inside it. */
    var people = ZS.contactsOf(c);
    var pick = ZS.primaryContact(c);

    h += '<div class="cols" style="align-items:start"><div>' +
      '<form id="oppform" data-cid="' + esc(c.id) + '">' +
      '<div class="fgroup"><h4>Who it is for</h4><div class="fbody">' +
      '<div class="f"><label>Client</label>' +
      '<div class="picked"><b>' + esc(c.name) + '</b>' +
      (c.sector ? '<span>' + esc(c.sector) + '</span>' : '') +
      '<a class="minibtn" href="#/oppnew">Change</a></div></div>' +
      '<div class="f"><label for="o-contact">Point of contact</label>' +
      (people.length
        ? '<select id="o-contact" name="contact">' +
            people.map(function (ct) {
              return '<option value="' + esc(ct.id) + '"' +
                (pick && ct.id === pick.id ? ' selected' : '') + '>' + esc(ct.name) +
                (ct.designation ? ' \u00b7 ' + esc(ct.designation) : '') + '</option>';
            }).join('') +
          '</select>' +
          '<span class="hint">' + (people.length === 1
            ? 'The only person we know at ' + esc(c.name) + ', so they are it.'
            : people.length + ' people here. This engagement runs through one of them.') +
          '</span>'
        : '<button type="button" class="btn alt" data-act="addContact" data-id="' + esc(c.id) + '">' +
          '+ Add the person we deal with</button>' +
          '<span class="hint">Nobody is on file at ' + esc(c.name) + ' yet. You can open this ' +
          'without one and add them later, but every message will have nobody to go to.</span>') +
      '</div>' +
      (people.length
        ? '<div class="f wide"><button type="button" class="minibtn" data-act="addContact" data-id="' +
          esc(c.id) + '">+ Somebody else at ' + esc(c.name) + '</button></div>'
        : '') +
      '</div></div>' +
      '<div class="fgroup"><h4>What they want</h4><div class="fbody">' +
      '<div class="f wide"><label for="o-title">Call it</label>' +
      '<input id="o-title" name="title" value="' + esc(BRIEF) + '" autocomplete="off" ' +
      'placeholder="e.g. Agentic Cockpit — Phase 1"></div>' +
      '<div class="f"><label for="o-product">What we are selling</label>' +
      '<select id="o-product" name="product">' +
        ZS.PRODUCTS.map(function (p) {
          return '<option value="' + esc(p.id) + '"' + (p.id === c.product ? ' selected' : '') + '>' +
            esc(p.name) + ' · ' + esc(p.code) + '</option>'; }).join('') +
      '</select><span class="hint">Prices it, prefixes the reference, carries the target.</span></div>' +
      '<div class="f"><label for="o-fee">Opportunity value</label>' +
      '<input id="o-fee" name="fee" type="number" min="0" ' +
      'placeholder="' + (ZS.PRODUCTS[0] ? ZS.PRODUCTS[0].from : 0) + '">' +
      '<span class="hint">What this one is worth. Invoices are raised against it ' +
      'and the split is measured against it.</span></div>' +
      '<div class="f wide"><label for="o-scope">Scope &mdash; what are we actually building?</label>' +
      '<textarea id="o-scope" name="scope" rows="3" ' +
      'placeholder="In plain words. This is what the invoice will say."></textarea></div>' +
      (G.sourceField ? G.sourceField('o-src', 'source', '', 'Source') : '') +
      '<div class="f"><label for="o-own">Owner</label><select id="o-own" name="assigned_to">' +
        ZS.staffList().map(function (u) {
          return '<option value="' + u.id + '"' + (u.id === c.assigned_to ? ' selected' : '') + '>' +
            esc(u.name) + '</option>'; }).join('') + '</select></div>' +

      '<div class="f"><label for="o-stage">Starting stage</label><select id="o-stage" name="stage">' +
        ZS.OPEN_STAGES.map(function (st) {
          return '<option value="' + esc(st) + '"' + (st === 'Enquiry' ? ' selected' : '') + '>' +
            esc(st) + '</option>'; }).join('') + '</select></div>' +
      '</div></div>' +
      '<p class="err" id="o-err"></p>' +
      '<button class="btn" type="submit">Open it</button></form></div>';

    /* what we already know about them */
    h += '<div><p class="eyebrow">' + esc(c.name) + ' so far</p><div class="card pad">' +
      '<div class="ministats">' +
      '<div><b>' + sum.bought.length + '</b><span>signed</span></div>' +
      '<div><b>' + sum.won + '</b><span>won</span></div>' +
      '<div><b>' + sum.lost + '</b><span>lost</span></div></div>' +
      '<ul class="ledger" style="margin-top:13px">' +
      li('They are', ZS.CLIENT_TYPES[c.type] || 'Lead') +
      li('Sector', c.sector || '—') +
      li('Spent with us', G.acc().cost ? ZS.money(sum.spent) : '₹ ••••') +
      li('First seen', c.created) + li('Last touch', c.last_touch) +
      '</ul></div>';

    var people2 = ZS.contactsOf(c);
    if (people2.length) {
      h += '<p class="eyebrow" style="margin-top:18px">Who we deal with</p><div class="card" style="padding:0">' +
        people2.map(function (ct) {
          return '<div class="pickrow"><div class="t"><b>' + esc(ct.name) + '</b><span>' +
            esc(ct.designation || '—') + '</span></div>' +
            (ct.primary ? '<span class="pill em">main</span>' : '') + '</div>';
        }).join('') + '</div>';
    }
    if (sum.closed.length) {
      h += '<p class="eyebrow" style="margin-top:18px">Past opportunities</p><div class="card" style="padding:0">' +
        sum.closed.map(function (x) {
          return '<div class="pickrow"><div class="t"><b>' + esc(x.title || 'Opportunity') + '</b>' +
            '<span>' + esc(x.created) + ' → ' + esc(x.closed || '') + '</span></div>' +
            '<span class="pill ' + (x.outcome === 'won' ? 'ok' : 'bad') + '">' + esc(x.stage) + '</span></div>';
        }).join('') + '</div>';
    }
    h += '</div></div>';
    return h;
  };

  /* ---------------- actions ---------------- */

  function oppById(id) {
    return (D().opportunities || []).filter(function (x) { return x.id === id; })[0] || null;
  }

  /* ---------------- the registry panel: typing in, and reading in ---------------- */

  /* What the last scan found, waiting to be written into the blanks. Held rather
     than applied immediately so the render can report exactly what it filled. */
  var REC_SCAN = null;

  /* The bar. It says what is waiting and offers the two ways out of it. */
  function recBar(o, where) {
    var n = PENDING_OPP === o.id ? pendingCount() : 0;
    /* the top one is only worth the space when there is something to save */
    if (where === 'top' && !n) return '';
    return '<div class="recbar' + (n ? ' armed' : '') + (where === 'top' ? ' top' : '') +
      '" id="rec-bar' + (where === 'top' ? '-top' : '') + '">' +
      '<span class="recbarsay">' +
        (n ? '<b>' + n + (n === 1 ? ' change' : ' changes') + ' typed in and not saved.</b> ' +
             'Nothing is written until you press save.'
           : 'Type into any box above, then save. Nothing is written as you type.') +
      '</span>' +
      (n ? '<button type="button" class="btn alt" data-act="recDiscard" data-id="' + esc(o.id) +
           '">Throw them away</button>' : '') +
      '<button type="button" class="btn' + (n ? '' : ' ghost') + '" data-act="recSave" data-id="' +
        esc(o.id) + '"' + (n ? '' : ' disabled') + '>Save these details</button>' +
      '</div>';
  }

  /* Typing stages. It does NOT write, does NOT log and does NOT re-render — the
     whole point of the button is that this step is reversible. */
  function stageRecField(oppId, key, raw, el) {
    if (!G.acc().editStock) return G.toast('Editing engagements is switched off for your role.', true);
    if (PENDING_OPP !== oppId) { PENDING = {}; PENDING_OPP = oppId; }

    var o = oppById(oppId);
    var c = o ? G.clientById(o.client) : null;
    var fd = ZS.fieldByKey(key);
    var rec = o ? ZS.engagementRecord(o, c, D().invoices) : null;
    /* Typed back to what is already on file? Then there is nothing to save, and
       counting it would have somebody pressing save over an unchanged field. */
    var onFile = rec && fd ? (ZS.hasField(rec, fd) ? String(ZS.fieldValue(rec, fd)) : '') : '';
    if (String(raw) === onFile) delete PENDING[key];
    else PENDING[key] = raw;
    if (!pendingCount()) PENDING_OPP = null;

    /* mark the row and redraw the bar in place, rather than the whole screen */
    var row = el && el.parentNode;
    if (row && row.classList) {
      row.classList.toggle('dirty', PENDING.hasOwnProperty(key));
      var hint = row.querySelector('.dirtyhint');
      if (PENDING.hasOwnProperty(key)) {
        if (!hint) {
          hint = document.createElement('span');
          hint.className = 'rechint dirtyhint';
          hint.textContent = 'Not saved yet.';
          row.appendChild(hint);
        }
      } else if (hint) { hint.parentNode.removeChild(hint); }
    }
    /* ⚠️ BOTH BARS, or the top one shows a stale count while the bottom one is
       right, which is worse than having only one. A re-render is avoided here on
       purpose: it would throw away the box somebody is still typing in. */
    if (o) {
      ['', '-top'].forEach(function (suffix) {
        var bar = document.getElementById('rec-bar' + suffix);
        if (!bar || !bar.parentNode) return;
        var wrap = document.createElement('div');
        wrap.innerHTML = recBar(o, suffix ? 'top' : '');
        if (wrap.firstChild) bar.parentNode.replaceChild(wrap.firstChild, bar);
        else bar.parentNode.removeChild(bar);
      });
      /* nothing armed yet and no top bar in the page: the next render adds it */
      if (pendingCount() && !document.getElementById('rec-bar-top')) G.render();
    }
  }

  /* One press, every staged field, one line in the log. A field that fails its
     validator STAYS staged and stays on screen: told "that GSTIN is 14
     characters" you want the thing you typed still in the box. */
  function saveRecFields(oppId) {
    var o = oppById(oppId);
    if (!o) return;
    if (!G.acc().editStock) return G.toast('Editing engagements is switched off for your role.', true);
    if (PENDING_OPP !== oppId || !pendingCount()) return;
    var c = G.clientById(o.client);

    var saved = [], refused = [], keep = {};
    Object.keys(PENDING).forEach(function (key) {
      var r = ZS.setEngagementField(o, c, key, PENDING[key]);
      var fd = ZS.fieldByKey(key);
      var label = (r.field && r.field.label) || (fd && fd.label) || key;
      if (r.error) { refused.push(label + ': ' + r.error); keep[key] = PENDING[key]; }
      else saved.push(label);
    });

    PENDING = keep;
    if (!pendingCount()) PENDING_OPP = null;

    if (saved.length) {
      G.log('client_edit', saved.length + ' field(s) saved on ' +
            (c ? c.name : 'an engagement') + ': ' + saved.join(', '),
            { client: o.client, opp: o.id });
      G.save();
    }
    if (refused.length) G.toast(refused[0], true);
    else G.toast(saved.length + (saved.length === 1 ? ' detail saved.' : ' details saved.'));
    G.render();
  }

  /* Write everything the scan found into whatever is still blank. Never over a
     value somebody already put there, and never past a validator. */
  function applyRecScan() {
    if (!REC_SCAN) return;
    var o = (D().opportunities || []).filter(function (x) { return x.id === REC_SCAN.opp; })[0];
    var note = document.getElementById('rec-scan-note');
    if (!o) { REC_SCAN = null; return; }
    var c = G.clientById(o.client);
    var filled = [], refused = [];
    /* the reader's key for a field is not always the registry's */
    var ALIAS = { bank_account: 'bank_acc', pin: null, website: null, instagram: null };
    Object.keys(REC_SCAN.fields).forEach(function (k) {
      var key = ALIAS.hasOwnProperty(k) ? ALIAS[k] : k;
      if (!key) return;                                  /* belongs on the client form, not here */
      var fd = ZS.fieldByKey(key);
      if (!fd) return;
      if (ZS.hasField(ZS.engagementRecord(o, c, D().invoices), fd)) return;   /* never overwrite */
      var r = ZS.setEngagementField(o, c, key, REC_SCAN.fields[k]);
      if (r.error) refused.push(fd.label);
      else filled.push(fd.label);
    });
    var msgs = REC_SCAN.notes.slice(1);
    REC_SCAN = null;
    if (filled.length) {
      G.log('client_edit', 'Read ' + filled.length + ' field(s) out of the paperwork: ' +
            filled.join(', '), { client: o.client, opp: o.id });
      G.save();
    }
    if (note) {
      note.textContent = (filled.length ? 'Filled ' + filled.join(', ') + '. ' : 'Nothing new to fill. ') +
        (refused.length ? refused.join(' and ') + ' did not check out, so ' +
          (refused.length === 1 ? 'it was' : 'they were') + ' left blank. ' : '') +
        msgs.join(' ');
    }
    if (filled.length) G.render();
  }
  G.applyRecScan = applyRecScan;

  /* What the pulse asks before it redraws the screen under somebody's hands. */
  G.unsaved = pendingCount;

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t) return;

    if (t.hasAttribute && t.hasAttribute('data-recfield')) {
      var p = String(t.getAttribute('data-recfield')).split('|');
      stageRecField(p[0], p[1], t.value, t);
      return;
    }

    if (t.id === 'rec-scan') {
      var oid = (function () {
        var m = String(location.hash || '').match(/#\/opp\/([^/]+)/);
        return m ? m[1] : null;
      })();
      var o = (D().opportunities || []).filter(function (x) { return x.id === oid; })[0];
      if (!o) return;
      var files = Array.prototype.slice.call(t.files || []);
      if (!files.length) return;
      var note = document.getElementById('rec-scan-note');
      if (note) note.textContent = 'Reading ' + files.length + ' file' +
        (files.length === 1 ? '' : 's') + '…';

      var left = files.length, text = '';
      files.forEach(function (f) {
        /* every file dropped here is filed against the engagement too, so it is
           never a thing you uploaded that then vanished */
        G.takeDoc(f, 'deal', 'scan', function (doc) {
          /* ⚠️ NO NAMING MODAL HERE, DELIBERATELY. This box is "drop the
             paperwork and let it read", and stopping to name three files in the
             middle of that would break the one flow that is meant to be
             thoughtless. It still gets a readable name rather than IMG_4471.jpg,
             and it lands in Dropped in, where filing it is already a rename. */
          if (G.tidyDocName) doc.name = G.tidyDocName(doc.name);
          o.docs = o.docs || [];
          o.docs.push(doc);
          G.log('doc_add', doc.name + ' filed against the engagement', { opp: o.id, client: o.client });
          G.save();
        });
        if (/^text\/|\.(txt|csv|md|json)$/i.test((f.type || '') + f.name)) {
          var r = new FileReader();
          r.onload = function () { text += '\n' + r.result; done(); };
          r.onerror = done;
          r.readAsText(f);
        } else { done(); }
        function done() {
          left--;
          if (left > 0) return;
          /* one read across ALL the files, so a GSTIN in one and an account
             number in another still consolidate into the same record */
          var res = ZS.readDocument(text);
          if (Object.keys(res.fields).length) {
            REC_SCAN = { opp: o.id, fields: res.fields, notes: res.notes };
            applyRecScan();
          } else {
            /* ⚠️ THE SERVER READS PHOTOGRAPHS AND PDFs, and this box never asked
               it. It only ran the local text parser, so a GST certificate as a
               photo produced nothing and the note blamed a missing server that
               has been reading exactly these documents for a fortnight. */
            readOnServer(o, files, note);
          }
          G.render();
        }
      });
      return;
    }
  });

  /* What the text parser could not read, the model can. It proposes into blanks
     only, never over anything already filled, exactly like the local reader. */
  function readOnServer(o, files, note) {
    var can = files.filter(function (f) {
      return /^image\//.test(f.type || '') || /pdf$/i.test(f.name || '') || /pdf$/i.test(f.type || '');
    });
    if (!can.length) {
      if (note) note.textContent = files.length + ' file' + (files.length === 1 ? '' : 's') +
        ' filed against this engagement. Nothing recognisable in them.';
      return;
    }
    if (!window.API || !API.signedIn()) {
      if (note) note.textContent = 'Filed. Reading a photo or a PDF happens on the server, ' +
        'and this browser is not signed in to one \u2014 sign in, or paste the text instead.';
      return;
    }

    if (note) note.textContent = 'Reading ' + can[0].name + '\u2026';
    var r = new FileReader();
    r.onload = function () {
      API.readDoc('billing', String(r.result || ''), can[0].type || 'application/pdf', { opp: o.id })
        .then(function (out) {
          var read = out && out.read;
          if (!read) { if (note) note.textContent = 'Nothing came back from the reading.'; return; }
          var f = {};
          ['gst', 'pan', 'ifsc', 'legal_name', 'address', 'city', 'state',
           'bank_name', 'account_holder'].forEach(function (k) { if (read[k]) f[k] = read[k]; });
          if (read.bank_account) f.bank_acc = read.bank_account;
          if (!Object.keys(f).length) {
            if (note) note.textContent = 'Read it, and found nothing this engagement has a ' +
              'field for. ' + (read.note || '');
            return;
          }
          REC_SCAN = { opp: o.id, fields: f, notes: [
            'Read by the model, ' + (read.confidence || 'low') + ' confidence. ' + (read.note || '')
          ] };
          applyRecScan();
        })
        .catch(function (e) {
          if (note) note.textContent = 'Filed, but it could not be read: ' +
            (e.message || 'no reason given');
        });
    };
    r.onerror = function () { if (note) note.textContent = 'That file could not be opened.'; };
    r.readAsDataURL(can[0]);
  }

  Object.assign(A, {
    recSave: function (oppId) { saveRecFields(oppId); },

    recDiscard: function (oppId) {
      if (PENDING_OPP !== oppId || !pendingCount()) return;
      var n = pendingCount();
      if (!confirm('Throw away ' + n + (n === 1 ? ' change' : ' changes') +
                   ' you have not saved?')) return;
      clearPending();
      G.toast('Thrown away. Nothing was written.');
      G.render();
    },

    pasteRecScan: function (oppId) {
      G.modal('Paste the text',
        'Copy the MOU, the invoice or the credentials sheet and paste it here. ' +
        'Everything recognisable fills the blanks above.',
        '<form id="recscanform" data-oid="' + esc(oppId) + '">' +
        '<div class="f" style="margin-bottom:12px"><label for="rs-text">The text</label>' +
        '<textarea id="rs-text" name="text" rows="10" ' +
        'placeholder="Name of the Company: …&#10;GSTIN: …&#10;A/c No: …  IFSC: …&#10;' +
        'Total fee agreed: Rs …  payable 50/50&#10;Build length: 90 days. Signed on 2026-08-14.&#10;' +
        'Repo: github.com/…&#10;Username: …  Password: …"></textarea></div>' +
        '<button class="btn" type="submit">Read it</button></form>');
    },
    /* ---- edit ---- */
    editOpp: function (id) {
      var o = oppById(id);
      if (!o || !G.acc().clients) return;
      var camps = D().campaigns || [];
      G.modal('Edit the opportunity', (G.clientById(o.client) || {}).name || '',
        '<form id="oppeditform" data-oid="' + esc(o.id) + '"><div class="fbody" style="padding:0">' +
        '<div class="f wide"><label for="eo-title">Call it</label>' +
        '<input id="eo-title" name="title" value="' + esc(o.title || '') + '"></div>' +
        /* ONE control, not two. "Product" and "Service line" were the same
           choice asked twice, and nothing stopped you answering them
           differently, which then put the engagement on one line and its
           reference on another. */
        '<div class="f"><label for="eo-product">What we are selling</label>' +
        '<select id="eo-product" name="product">' +
          ZS.PRODUCTS.map(function (p) {
            return '<option value="' + esc(p.id) + '"' + (p.id === o.product ? ' selected' : '') + '>' +
              esc(p.name) + ' · ' + esc(p.code) + '</option>'; }).join('') + '</select>' +
        '<span class="hint">Prices the work, prefixes the reference and carries the target.</span></div>' +
        '<div class="f"><label for="eo-fee">Opportunity value</label>' +
        '<input id="eo-fee" name="fee" type="number" min="0" value="' + esc(o.fee || '') + '"></div>' +
        '<div class="f wide"><label for="eo-scope">Scope</label>' +
        '<textarea id="eo-scope" name="scope" rows="3">' + esc(o.scope || '') + '</textarea></div>' +
        '<div class="f"><label for="eo-src">Source</label><select id="eo-src" name="source" data-source="1">' +
          Object.keys(ZS.SOURCES).map(function (k) {
            return '<option value="' + k + '"' + (k === o.source ? ' selected' : '') + '>' +
              esc(ZS.SOURCES[k]) + '</option>'; }).join('') + '</select></div>' +
        '<div class="f" id="eo-src-camp"' + (ZS.isPaid(o.source) ? '' : ' hidden') + '>' +
          '<label for="eo-src-c">Campaign</label><select id="eo-src-c" name="campaign">' +
          '<option value="">Not set</option>' +
          camps.map(function (cm) {
            return '<option value="' + esc(cm.id) + '"' + (cm.id === o.campaign ? ' selected' : '') + '>' +
              esc(cm.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="f"><label for="eo-own">Owner</label><select id="eo-own" name="assigned_to">' +
          ZS.staffList().map(function (u) {
            return '<option value="' + u.id + '"' + (u.id === o.assigned_to ? ' selected' : '') + '>' +
              esc(u.name) + '</option>'; }).join('') + '</select></div>' +

        '</div><p class="err" id="eo-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" type="submit">Save</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },

    /* ---- delete: owner only, and it says what goes ---- */
    askDeleteOpp: function (id) {
      var o = oppById(id);
      if (!o) return;
      if (!ZS.canDelete(G.me())) return G.toast('Only the owner can delete an opportunity.', true);
      var blockers = ZS.deleteBlockers(o, D().invoices);
      var cost = ZS.deleteCost(o, D().invoices, D().followups);
      var name = (G.clientById(o.client) || {}).name || 'this client';

      if (blockers.length) {
        G.modal('Cannot delete this', name,
          '<p class="m">This one carries a record that should not just vanish:</p>' +
          '<ul class="ledger" style="margin-top:12px">' +
          blockers.map(function (b) { return '<li><span>·</span><b>' + esc(b) + '</b></li>'; }).join('') +
          '</ul><p class="m" style="margin-top:14px">If the deal fell through, move it to ' +
          '<b>Lost</b> — that keeps what happened and takes it off the board.</p>' +
          '<div style="margin-top:16px"><button class="btn alt" type="button" data-act="closeModal">Close</button></div>');
        return;
      }

      var lines = Object.keys(cost).filter(function (k) { return cost[k]; })
        .map(function (k) { return cost[k] + ' ' + k; });
      G.modal('Delete this opportunity?', name + ' — ' + (o.title || 'untitled'),
        '<p class="m">This cannot be undone.' +
        (lines.length ? ' It also removes ' + lines.join(', ') + '.' : '') + '</p>' +
        /* Typing the client's name sounds safer and is mostly just annoying: it
           is long, it is easy to get wrong, and it punishes the person for the
           system's caution. One deliberate word does the same job. */
        '<p class="m" style="margin-top:10px">Type <b>DELETE</b> to confirm.</p>' +
        '<form id="delform" data-oid="' + esc(o.id) + '">' +
        '<div class="f" style="margin-top:10px"><label for="dl-confirm">Type DELETE</label>' +
        '<input id="dl-confirm" name="confirm" autocomplete="off" autocapitalize="characters" ' +
        'spellcheck="false" placeholder="DELETE"></div>' +
        '<p class="err" id="dl-derr"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn danger" type="submit">Delete it</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Keep it</button></div></form>');
    },
    /* ---- requirements: what they asked for, as it changes ---- */
    addReq: function (id) {
      var o = oppById(id);
      if (!o) return;
      G.modal('Add a requirement', (G.clientById(o.client) || {}).name || '',
        '<form id="reqform" data-oid="' + esc(o.id) + '">' +
        '<div class="f"><label for="rq-t">What did they ask for?</label>' +
        '<textarea id="rq-t" name="text" rows="3" ' +
        'placeholder="In their words. Recorded against the stage it came up in."></textarea></div>' +
        '<p class="err" id="rq-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" type="submit">Record it</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },
    dropReq: function (arg) {
      var p = String(arg).split('|'), o = oppById(p[0]);
      if (!o) return;
      o.requirements = (o.requirements || []).filter(function (r) { return r.id !== p[1]; });
      G.save(); G.toast('Removed.'); G.render();
    },

    /* ---- meetings and their minutes ---- */
    addMeeting: function (id) {
      var o = oppById(id);
      if (!o) return;
      var mc = G.clientById(o.client) || {};
      var mct = ZS.oppContact(o, mc);
      G.modal('Meeting', mc.name || '',
        '<form id="mtform" data-oid="' + esc(o.id) + '">' +
        '<div class="fbody" style="padding:0">' +

        /* WHERE IT HAPPENS, FIRST, because it decides what else is asked. A video
           call needs a link and a length; somewhere you have to be needs an
           address. Asking for all four every time is how a form gets ignored. */
        '<div class="f wide"><label>How</label>' +
        '<div class="modes">' +
        Object.keys(ZS.MEETING_MODES).map(function (k) {
          return '<label class="modepick"><input type="radio" name="mode" value="' + esc(k) + '"' +
            (k === 'meet' ? ' checked' : '') + '> ' + esc(ZS.MEETING_MODES[k]) + '</label>';
        }).join('') + '</div>' +
        '<span class="hint" id="mt-modehint">A Google Meet link is made and the invite ' +
        'sent when you tick &ldquo;book it&rdquo; below.</span></div>' +

        '<div class="f"><label for="mt-kind">What kind</label><select id="mt-kind" name="kind">' +
          ZS.MEETING_KINDS.map(function (k) { return '<option>' + esc(k) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="f"><label for="mt-at">Date</label>' +
        '<input id="mt-at" name="at" type="date" value="' + esc(ZS.today()) + '"></div>' +
        '<div class="f"><label for="mt-time">Time</label><input id="mt-time" name="time" type="time"></div>' +
        '<div class="f"><label for="mt-long">How long</label>' +
        '<select id="mt-long" name="mins_long">' +
          ZS.MEETING_LENGTHS.map(function (n) {
            return '<option value="' + n + '"' + (n === 60 ? ' selected' : '') + '>' +
              (n >= 60 ? (n / 60) + (n === 60 ? ' hour' : ' hours') : n + ' minutes') + '</option>';
          }).join('') + '</select></div>' +

        /* only for a meeting somebody has to travel to */
        '<div class="f wide" id="mt-wherewrap" hidden><label for="mt-where">Where</label>' +
        '<input id="mt-where" name="where" autocomplete="off" ' +
        'placeholder="Their office, an address, a landmark"></div>' +

        '<div class="f"><label for="mt-who">Who is there</label>' +
        '<input id="mt-who" name="who" autocomplete="off" value="' +
        esc(mct ? mct.name : '') + '" placeholder="names, both sides"></div>' +
        '<div class="f"><label for="mt-guests">Send the invite to</label>' +
        '<input id="mt-guests" name="guests" autocomplete="off" value="' +
        esc(mct && mct.email ? mct.email : '') + '" placeholder="email, comma separated">' +
        '<span class="hint">Blank sends no invite and just holds the time.</span></div>' +

        '<div class="f wide"><label for="mt-min">Minutes</label>' +
        '<textarea id="mt-min" name="minutes" rows="4" ' +
        'placeholder="What was decided, what was promised, what is next."></textarea>' +
        (G.micButton ? G.micButton('mt-min') : '') + '</div>' +
        '<div class="f wide"><label><input type="checkbox" name="booked" value="1" id="mt-booked"> ' +
        'This one has not happened yet &mdash; book it</label></div>' +
        '</div><p class="err" id="mt-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" type="submit">Save it</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },
    /* ⚠️ REMOVING IT HERE MUST REMOVE IT THERE.

       This deleted the row and left the calendar untouched, so the meeting
       vanished from the cockpit and stayed in the diary, the guest kept their
       invite, and the hour held after it stayed blocked for a call that was not
       happening. Two records of one meeting that disagree is worse than one
       record: you stop trusting either.

       The row goes either way. A calendar we cannot reach must not be able to
       trap a meeting in the cockpit, so the failure is reported rather than
       blocking, and it says exactly what to go and delete by hand. */
    dropMeeting: function (arg) {
      var p = String(arg).split('|'), o = oppById(p[0]);
      if (!o) return;
      var m = (o.meetings || []).filter(function (x) { return x.id === p[1]; })[0];
      /* ⚠️ A meeting booked through the website before event ids were recorded
         has no id to cancel by. It is still in Google, and deleting it here
         without deleting it there is the disagreement this whole path exists to
         prevent. With a date and a time we can find it; without one there is
         genuinely nothing to go on. */
      var inDiary = m && (m.event || (m.at && m.time && !m.done));

      if (inDiary && !confirm('Remove this meeting? It is in your Google Calendar, so ' +
                              'the invite will be cancelled and the hour held after it freed.')) return;

      o.meetings = (o.meetings || []).filter(function (x) { return x.id !== p[1]; });
      o.updated = ZS.today();
      G.log('follow_log', 'Meeting removed' + (inDiary ? ', and cancelled in the calendar' : ''),
            { client: o.client, opp: o.id });
      G.save();

      if (!inDiary || !window.API || !API.signedIn()) {
        G.toast('Removed.'); G.render();
        return;
      }

      G.toast('Removed. Cancelling the invite…');
      G.render();
      API.diary({ action: 'cancel', event: m.event || '',
                  start: m.event ? '' : new Date(m.at + 'T' + m.time + ':00+05:30').toISOString(),
                  match: (G.clientById(o.client) || {}).name || '',
                  client: o.client, opp: o.id })
        .then(function (r) {
          G.toast(r && r.breaks
            ? 'Cancelled, and the hour after it is free again.'
            : 'Cancelled in your calendar.');
        })
        .catch(function (e) {
          G.toast('Removed here, but the calendar kept it: ' + (e.message || 'no reason given') +
                  '. Delete it in Google yourself.', true);
        });
    },

    /* ---- what we handed over ---- */
    addDeliv: function (id) {
      var o = oppById(id);
      if (!o) return;
      G.modal('Add what we delivered', (G.clientById(o.client) || {}).name || '',
        '<form id="dlform" data-oid="' + esc(o.id) + '">' +
        '<div class="f" style="margin-bottom:10px"><label for="dl-l">What is it</label>' +
        '<input id="dl-l" name="label" autocomplete="off" ' +
        'placeholder="Demo link, handover pack, credentials sheet&hellip;"></div>' +
        '<div class="f" style="margin-bottom:10px"><label for="dl-u">Link</label>' +
        '<input id="dl-u" name="url" type="url" placeholder="https://" autocomplete="off"></div>' +
        '<div class="f"><label for="dl-n">Note</label>' +
        '<input id="dl-n" name="note" autocomplete="off"></div>' +
        '<p class="hint" style="margin-top:8px">A link or a note. Files go in Documents below, ' +
        'where a slot takes as many as you need.</p>' +
        '<p class="err" id="dl-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" type="submit">Add it</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },
    dropDeliv: function (arg) {
      var p = String(arg).split('|'), o = oppById(p[0]);
      if (!o) return;
      o.deliverables = (o.deliverables || []).filter(function (x) { return x.id !== p[1]; });
      G.save(); G.toast('Removed.'); G.render();
    },
    pipeMine: function () { MINE = !MINE; G.render(); },
    pipeLine: function (id) { LINE = id || ''; G.render(); },
    openOpp: function (id) { G.go('#/opp/' + id); },
    startOpp: function (id) { PICK = []; OQ = ''; G.go('#/oppnew/' + id); },
    floorClear: function () { FQ = ''; G.render(); },
    floorTab: function (t) { TAB = (TAB === t ? '' : t); G.render(); },
    pickProduct: function (id) {
      if (PICK.indexOf(id) < 0) PICK.push(id);
      G.render();
    },
    unpickProduct: function (id) {
      PICK = PICK.filter(function (x) { return x !== id; });
      G.render();
    },

    setStage: function (arg) {
      var p = arg.split('|');
      var o = (D().opportunities || []).filter(function (x) { return x.id === p[0]; })[0];
      if (!o) return;
      if (p[1] === 'Won') return A.winOpp(o.id);
      if (p[1] === 'Lost') return A.loseOpp(o.id);
      if (p[1] === o.stage) return;
      var c = G.clientById(o.client);
      var r = ZS.moveOpp(o, p[1], c);
      if (r.error) { G.toast(r.error, true); G.render(); return; }
      if (c) c.last_touch = ZS.today();
      G.log('opp_stage', (c ? c.name : 'Opportunity') + ' moved to ' + p[1] +
            (r.marks.length ? ' — ' + r.marks.length + ' line mark updated to match' : ''),
            { client: o.client, opp: o.id });
      G.save();
      G.toast('Moved to ' + p[1] + '.' +
              (r.marks.length ? ' The line in play is now marked ' + ZS.MARKS[ZS.STAGE_MARK[p[1]]].toLowerCase() + '.' : ''));
      G.render();
    },

    /* Winning a build is not picking a car off a shelf. The old flow here showed
       a photo grid of stock, priced the deal at the product's list price, marked
       the line "Sold" — which, with one product line, meant the NEXT win had
       nothing left to pick — took a 4% booking and recorded a finance flag. What
       actually happens: we agreed a fee, we agreed how long the build runs, and
       signing starts the delivery clock. So ask those two things and nothing else. */
    winOpp: function (id) {
      var o = (D().opportunities || []).filter(function (x) { return x.id === id; })[0];
      if (!o) return;
      var c = G.clientById(o.client);
      var prod = ZS.productById(o.product || 'cockpit');
      var fee = o.fee != null ? o.fee : (prod ? prod.from : 0);
      G.modal('Sign off ' + (c ? c.name : 'this engagement'),
        'This records the win and opens the delivery file. The dates below are what we are promising them.',
        '<form id="winform" data-oid="' + esc(id) + '">' +
        '<div class="f" style="margin-bottom:13px"><label for="w-fee">Agreed fee</label>' +
        '<input id="w-fee" name="fee" type="number" min="0" value="' + esc(String(fee)) + '">' +
        '<span class="hint">' + (o.fee != null ? 'What you put on the engagement.'
          : 'No fee was agreed yet, so this is the ' + (prod ? prod.name : 'product') + ' floor. Change it.') +
        '</span></div>' +
        '<div class="f" style="margin-bottom:13px"><label for="w-days">How long is the build?</label>' +
        '<select id="w-days" name="days">' + ZS.PLAN_DURATIONS.map(function (n) {
          return '<option value="' + n + '"' + (n === ZS.PLAN_DEFAULT ? ' selected' : '') + '>' +
            n + ' days</option>'; }).join('') + '</select>' +
        '<span class="hint">Onboarding, demo, testing and handover get dated off this.</span></div>' +
        '<p class="err" id="w-err"></p>' +
        '<button class="btn ok" type="submit">Sign it off</button></form>');
    },

    loseOpp: function (id) {
      G.modal('Mark this lost', 'It leaves the board and stays on the client’s record.',
        '<form id="loseform" data-oid="' + esc(id) + '">' +
        '<div class="f" style="margin-bottom:13px"><label for="l-why">Why did we lose it?</label>' +
        '<select id="l-why" name="reason">' +
        ['Price', 'Went with another agency', 'Went quiet', 'Building it in-house',
         'Budget pulled', 'Wrong time', 'Wanted something we do not do', 'Other'].map(function (x) {
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
      /* It used to reopen at "Negotiating", a stage this ladder does not have —
         so the deal came back onto a column that renders nowhere and simply
         disappeared. Reopen at the last stage before the close instead. */
      var back = ZS.OPEN_STAGES[ZS.OPEN_STAGES.length - 1];
      o.stage = back; o.outcome = null; o.closed = null; o.updated = ZS.today();
      var rc = G.clientById(o.client);
      G.log('opp_reopen', (rc ? rc.name : 'An engagement') + ' reopened at ' + back,
            { client: o.client, opp: o.id });
      G.save(); G.toast('Back on the board at ' + back + '.'); G.render();
    },

    /* Shown or hidden the moment the outcome changes, so the form says what it
       will do before it is submitted rather than afterwards. */
    folOutcome: function () {
      var sel = document.getElementById('f-outcome');
      var wrap = document.getElementById('f-next-wrap');
      if (!sel || !wrap) return;
      wrap.hidden = !ZS.needsNextDate(sel.value);
      var grid = document.getElementById('f-dates');
      if (grid) grid.style.gridTemplateColumns = wrap.hidden ? '1fr' : '1fr 1fr';
    },

    logFollow: function (arg) {
      /* One engagement, one thread. This used to refuse outright — "put a service
         line in play first" — and offered a dropdown of which car the call was
         about. There is nothing to disambiguate here. */
      var oppId = String(arg).split('|')[0];
      var o = (D().opportunities || []).filter(function (x) { return x.id === oppId; })[0];
      if (!o) return;
      var c = G.clientById(o.client);
      var next = new Date(); next.setDate(next.getDate() + 3);   /* the default next date */
      G.modal('Follow-up — ' + (c ? c.name : ''),
        esc(o.title || ZS.productName(o.product)) + ' · ' + esc(o.stage),
        '<form id="folform" data-oid="' + esc(oppId) + '" data-product="' + esc(o.product || '') + '">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:13px">' +
        '<div class="f"><label for="f-method">How</label><select id="f-method" name="method">' +
          ZS.FOLLOW_METHODS.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div>' +
        '<div class="f"><label for="f-when">When it happened</label>' +
          '<input id="f-when" name="when" type="date" value="' + ZS.today() + '"></div>' +
        '</div>' +
        '<div class="f" style="margin-bottom:13px"><label for="f-note">What did you talk about?</label>' +
        '<div style="display:flex;gap:8px;align-items:flex-start">' +
        '<textarea id="f-note" name="note" rows="4" data-scored="1" placeholder="' +
        'Walked them through the build. They asked whether the fee covers phase two. ' +
        'Sending the revised scope Monday and meeting again on the 4th.' + '"></textarea>' +
        G.micButton('f-note') + '</div>' +
        '<div id="f-score" class="scorebar"></div>' +
        '<p class="hint">Tap Speak and talk &mdash; it types for you. Chrome and Edge only. ' +
        'The note is scored out of ten as you write it.</p></div>' +
        '<div class="f" style="margin-bottom:13px"><label for="f-outcome">How did it go?</label>' +
        '<select id="f-outcome" name="outcome">' +
          ZS.FOLLOW_OUTCOMES.map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select></div>' +
        /* ⚠️ READY TO SIGN HAS NO NEXT FOLLOW-UP. There is nothing left to chase;
           the only date that matters is when the money is expected. The field is
           hidden rather than disabled so nobody fills in a date that is then
           thrown away, and the submit handler ignores it regardless of what the
           hidden input still holds. */
        '<div id="f-dates" style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:13px">' +
        '<div class="f" id="f-next-wrap"><label for="f-next">Next follow-up</label>' +
          '<input id="f-next" name="next" type="date" value="' + ZS.iso(next) + '"></div>' +
        '<div class="f"><label for="f-exp">Expected purchase date</label>' +
          '<input id="f-exp" name="expected" type="date" value="' + esc(o.expected || '') + '"></div>' +
        '</div>' +
        '<button class="btn" type="submit">Save the follow-up</button></form>');
    },

    playproduct: function (arg) {
      var p = arg.split('|');
      var o = (D().opportunities || []).filter(function (x) { return x.id === p[0]; })[0];
      if (!o) return;
      ZS.attachProduct(o, p[1], true);
      var line = G.productById_view(p[1]), c = G.clientById(o.client);
      if (c) ZS.addMark(c, p[1], 'negotiating', D().session);
      G.log('opp_line', (line ? line.name : p[1]) + ' moved into play for ' +
            (c ? c.name : 'a client'), { client: o.client, opp: o.id, line: p[1] });
      G.save();
      G.toast('In play. Follow-ups on this line now sit under it.');
      G.render();
    },
    unplay: function (arg) {
      var p = arg.split('|');
      var o = (D().opportunities || []).filter(function (x) { return x.id === p[0]; })[0];
      if (!o) return;
      ZS.attachProduct(o, p[1], false);
      G.save(); G.toast('Back on the shortlist.'); G.render();
    },
    explainScore: function (id) {
      var f = (D().followups || []).filter(function (x) { return x.id === id; })[0];
      if (!f) return;
      var names = G.products().map(function (x) { return x.name; });
      var sc = ZS.scoreNote(f.note, { outcome: f.outcome, lineNames: names });
      G.modal('Follow-up scored ' + sc.score + ' out of 10', sc.verdict,
        '<div class="body" style="margin-bottom:14px">' + esc(f.note || 'Nothing written.') + '</div>' +
        '<ul class="ledger">' + sc.marks.map(function (m) {
          return '<li><span>' + esc(m.label) + '</span><b class="' +
            (m.got === m.max ? 'ok' : m.got ? 'warn' : 'bad') + '">' + m.got + ' / ' + m.max + '</b></li>';
        }).join('') + '</ul>' +
        '<div class="note">Scored on what was written down, against a fixed set of marks — ' +
        'so anyone can see why, and argue with it. It rewards naming the line, recording a number, ' +
        'capturing what the client actually said, and setting a clear next step.</div>');
    },

    addProductToOpp: function (arg) {
      var p = arg.split('|');
      var o = (D().opportunities || []).filter(function (x) { return x.id === p[0]; })[0];
      if (!o || o.lines.indexOf(p[1]) >= 0) return;
      o.lines.push(p[1]);
      o.updated = ZS.today();
      var c = G.clientById(o.client);
      if (c) ZS.addMark(c, p[1], 'interested', D().session);
      var ac = G.productById_view(p[1]);
      /* This read ac.make + ' ' + ac.model — a used car's fields on a product
         that has neither, so the activity log recorded "undefined undefined". */
      G.log('opp_line', 'Added ' + (ac ? ac.name : p[1]) + ' to ' +
            (c ? c.name + '’s' : 'an') + ' opportunity', { client: o.client, opp: o.id, line: p[1] });
      G.save(); G.render();
    }
  });

  /* The two search boxes: the inventory on a new opportunity, and the floor.
     Re-rendering keeps the caret, because render() restores focus by id. */
  document.addEventListener('input', function (e) {
    if (e.target.id === 'oq') { OQ = e.target.value; G.render(); return; }
    if (e.target.id === 'fq') { FQ = e.target.value; G.render(); }
  });

  /* score the note as it is typed, so the standard is obvious before saving */
  document.addEventListener('input', function (e) {
    if (!e.target.dataset || !e.target.dataset.scored) return;
    var box = document.getElementById('f-score');
    if (!box) return;
    var out = document.getElementById('f-outcome');
    var sc = ZS.scoreNote(e.target.value, {
      outcome: out ? out.value : null,
      lineNames: G.products().map(function (x) { return x.name; })
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
    if (e.target.id === 'f-outcome') { A.folOutcome(); return; }
    /* The address box only exists for a meeting somebody has to travel to, and
       the hint under the mode picker says what each one will actually do. */
    if (e.target.name === 'mode') {
      var wrap = document.getElementById('mt-wherewrap');
      var hint = document.getElementById('mt-modehint');
      var isPerson = e.target.value === 'person';
      if (wrap) wrap.hidden = !isPerson;
      if (hint) {
        hint.textContent = isPerson
          ? 'The address goes on the invite, so it is useful on a phone at the door.'
          : e.target.value === 'phone'
            ? 'Just the time, held in the calendar. No link, nothing to join.'
            : 'A Google Meet link is made and the invite sent when you tick "book it" below.';
      }
      return;
    }
    var oc = e.target.closest ? e.target.closest('[data-oppcontact]') : null;
    if (oc) {
      var oo = oppById(oc.dataset.oppcontact);
      if (!oo) return;
      if (!G.acc().clients) { G.render(); return; }
      var cc = G.clientById(oo.client);
      var ctPick = ZS.contactById(cc, oc.value);
      if (!ctPick) { G.render(); return; }
      oo.contact = ctPick.id;
      oo.updated = ZS.today();
      G.log('opp_edit', (oo.title || 'Engagement') + ' now runs through ' + ctPick.name,
            { client: oo.client, opp: oo.id });
      G.save();
      G.toast('Now going through ' + ctPick.name + '.');
      G.render();
      return;
    }
    var el = e.target.closest ? e.target.closest('[data-expected]') : null;
    if (el) {
      var o = (D().opportunities || []).filter(function (x) { return x.id === el.dataset.expected; })[0];
      if (o) { o.expected = el.value || null; o.updated = ZS.today();
        G.log('follow_log', 'Expected purchase date set to ' + (el.value || 'none'),
              { client: o.client, opp: o.id });
        G.save();
        G.toast(el.value ? 'Expected purchase ' + el.value + '.' : 'Expected date cleared.'); }
    }
  };

  var prevSubmit = A.onSubmit;
  A.onSubmit = function (e) {
    if (prevSubmit) prevSubmit(e);

    if (e.target.id === 'oppeditform') {
      e.preventDefault();
      var eo = oppById(e.target.dataset.oid);
      if (!eo || !G.acc().clients) return;
      var ed = new FormData(e.target);
      /* Nothing on an engagement is mandatory. A half-known deal is the normal
         state of a deal — you learn the scope on the second call and the fee on
         the fourth — and a form that refuses to save until you invent a value is
         a form that gets fed invented values. Where a name is genuinely needed
         to render a row, one is derived rather than demanded. */
      var t = String(ed.get('title') || '').trim();
      var was = ZS.oppValue(eo);
      eo.title = t || eo.title || ((c ? c.name : 'Engagement') + ' — ' + ZS.productName(ed.get('product')));
      eo.product = ed.get('product');
      eo.fee = ed.get('fee') ? Number(ed.get('fee')) : null;
      eo.scope = String(ed.get('scope') || '').trim();
      eo.source = ed.get('source');
      eo.campaign = ZS.isPaid(eo.source) ? (ed.get('campaign') || null) : null;
      eo.assigned_to = ed.get('assigned_to');
      /* the line IS the product, so one control sets one field */
      eo.updated = ZS.today();
      G.log('opp_stage', 'Edited "' + eo.title + '"' +
            (was !== ZS.oppValue(eo) ? ' — fee ' + ZS.money(was) + ' → ' + ZS.money(ZS.oppValue(eo)) : ''),
            { client: eo.client, opp: eo.id });
      G.save();
      document.getElementById('modal').close();
      G.toast('Saved.');
      G.render();
      return;
    }

    if (e.target.id === 'delform') {
      e.preventDefault();
      var dOpp = oppById(e.target.dataset.oid);
      if (!dOpp) return;
      var nm = (G.clientById(dOpp.client) || {}).name || '';
      var typed = document.getElementById('dl-confirm').value.trim();
      if (typed !== 'DELETE') {
        document.getElementById('dl-derr').textContent = 'Type DELETE, in capitals, to confirm.';
        return;
      }
      var goneId = dOpp.id;
      var r = ZS.deleteOpp(D(), dOpp.id, G.me());
      if (r.error) { document.getElementById('dl-derr').textContent = r.error; return; }
      G.log('opp_delete', 'Opportunity deleted — ' + nm + ' · ' + (dOpp.title || 'untitled'),
            { client: dOpp.client });
      G.save();
      document.getElementById('modal').close();

      /* ⚠️ AND OFF THE SERVER, OR IT COMES STRAIGHT BACK.

         This deleted the row in the browser and nowhere else. The server kept
         its copy, the next reload pulled it down again, and the engagement
         reappeared as though nothing had happened. Nothing on screen said the
         delete had not reached anywhere: it looked like the cockpit forgetting
         its own instruction, which is the fastest way to stop trusting it. */
      if (window.API && API.signedIn()) {
        API.dropOpp(goneId).then(function () {
          G.toast('In the bin for ' + ZS.BIN_DAYS + ' days, here and on the server.');
          return G.pullNow ? G.pullNow() : null;
        }).catch(function (err) {
          G.toast('Removed here, but the server refused: ' + (err.message || 'no reason given') +
                  '. It will come back on the next reload.', true);
        });
      } else {
        G.toast('Deleted.');
      }
      G.go('#/floor');
      return;
    }

    if (e.target.id === 'reqform') {
      e.preventDefault();
      var ro = oppById(e.target.dataset.oid);
      if (!ro) return;
      var txt = document.getElementById('rq-t').value.trim();
      if (!txt) { document.getElementById('modal').close(); return; }   /* nothing typed, nothing to record */
      ro.requirements = (ro.requirements || []).concat([ZS.newRequirement({
        text: txt, by: D().session, stage: ro.stage })]);
      ro.updated = ZS.today();
      G.log('opp_stage', 'Requirement added — ' + txt.slice(0, 60), { client: ro.client, opp: ro.id });
      G.save(); document.getElementById('modal').close();
      G.toast('Recorded.'); G.render();
      return;
    }

    if (e.target.id === 'mtform') {
      e.preventDefault();
      var mo = oppById(e.target.dataset.oid);
      if (!mo) return;
      var fd = new FormData(e.target);
      var booked = !!fd.get('booked');
      var mins = String(fd.get('minutes') || '').trim();
      var mmode = String(fd.get('mode') || 'meet');
      var mwhere = String(fd.get('where') || '').trim();
      var mtime = String(fd.get('time') || '');
      var mat = String(fd.get('at') || ZS.today());

      if (booked && mmode === 'person' && !mwhere) {
        document.getElementById('mt-err').textContent =
          'Where is it? An appointment with no address is one somebody turns up to wrong.';
        return;
      }
      if (booked && !mtime) {
        document.getElementById('mt-err').textContent =
          'What time? A day is not a booking.';
        return;
      }

      /* Minutes used to be demanded on a meeting that had happened. They are
         worth having and not worth blocking on — you write them up after the
         call, not during it. The row says "no minutes written" until you do. */
      var mt = ZS.newMeeting({
        kind: fd.get('kind'), mode: mmode, at: mat, time: mtime,
        mins_long: Number(fd.get('mins_long')) || 60, where: mwhere,
        who: fd.get('who'), minutes: mins, by: D().session, done: !booked });
      mo.meetings = (mo.meetings || []).concat([mt]);
      mo.updated = ZS.today();
      G.log('follow_log', (booked ? 'Meeting booked — ' : 'Minutes written — ') +
            fd.get('kind') + ' ' + mat, { client: mo.client, opp: mo.id });
      G.save();
      document.getElementById('modal').close();

      /* ---- and into the real diary ----

         Only when it is booked, only when it is ahead of us, and only through
         the server, which holds the key. The meeting is ALREADY SAVED by this
         point: if Google is unreachable the record stands and the row says the
         invite is missing, rather than the whole thing being lost to somebody
         else's outage. */
      var wantsDiary = booked && mtime && window.API && API.signedIn();
      if (!wantsDiary) {
        G.toast(booked ? 'Booked.' : 'Minutes saved.');
        G.render();
        return;
      }

      var cl = G.clientById(mo.client) || {};
      G.toast('Booked. Putting it in your calendar…');
      G.render();
      API.diary({
        start: new Date(mat + 'T' + mtime + ':00+05:30').toISOString(),
        minutes: mt.mins_long, mode: mmode,
        title: (fd.get('kind') || 'Meeting') + ': ' + (cl.name || 'client'),
        where: mwhere,
        note: (mo.title || '') + (mo.ref ? ' (' + mo.ref + ')' : '') +
              (mins ? '\n\n' + mins : ''),
        guests: String(fd.get('guests') || ''),
        client: mo.client, opp: mo.id
      }).then(function (r) {
        var live = oppById(mo.id);
        if (!live) return;
        var row = (live.meetings || []).filter(function (x) { return x.id === mt.id; })[0];
        if (!row) return;
        row.link = r.link || '';
        row.event = r.event || '';
        G.save();
        G.toast(r.link ? 'In your calendar, with a Meet link.' : 'In your calendar.');
        G.render();
      }).catch(function (err) {
        G.toast('Saved here, but the calendar refused: ' + (err.message || 'no reason given'), true);
      });
      return;
    }

    if (e.target.id === 'dlform') {
      e.preventDefault();
      var dO = oppById(e.target.dataset.oid);
      if (!dO) return;
      var df = new FormData(e.target);
      var label = String(df.get('label') || '').trim() ||
        String(df.get('url') || '').trim() || 'Delivered ' + ZS.today();
      dO.deliverables = (dO.deliverables || []).concat([ZS.newDeliverable({
        label: label, url: df.get('url'), note: df.get('note'), by: D().session })]);
      dO.updated = ZS.today();
      G.log('doc_add', 'Delivered — ' + label, { client: dO.client, opp: dO.id });
      G.save(); document.getElementById('modal').close();
      G.toast('Added.'); G.render();
      return;
    }

    var f = e.target;

    if (f.id === 'oppform') {
      e.preventDefault();
      var d = new FormData(f);
      var c = G.clientById(f.dataset.cid);
      /* Read back exactly the fields the form above puts on screen, and nothing
         else. This handler used to be the dealer's: it built wants{bodies,makes,
         fuels}, forced a stage called "New lead" that is not on our ladder, and
         never read `fee` at all — so a ₹1.2L engagement was created at zero and
         the board showed the product floor instead. Form and handler have to be
         read as one thing; a field is only real if BOTH ends know about it. */
      var prod = String(d.get('product') || (ZS.PRODUCTS[0] || {}).id || '');
      var fee = String(d.get('fee') || '').trim();
      var stage = String(d.get('stage') || '');
      if (ZS.OPEN_STAGES.indexOf(stage) < 0) stage = ZS.OPEN_STAGES[0];
      /* A blank name is fine — derive one rather than refusing to open the
         engagement. You often start one knowing only who called. */
      var title = String(d.get('title') || '').trim() ||
        (c.name + ' — ' + ZS.productName(prod));
      /* Read the contact back. A field is only real if BOTH ends know about it,
         and this form has shipped a control the handler ignored before. */
      var ctId = String(d.get('contact') || '');
      if (ctId && !ZS.contactById(c, ctId)) ctId = '';
      var o = ZS.newOpp({
        client: c.id, title: title,
        contact: ctId || (ZS.primaryContact(c) || {}).id || null,
        assigned_to: d.get('assigned_to') || c.assigned_to,
        source: d.get('source'),
        product: prod, scope: String(d.get('scope') || '').trim(),
        fee: fee === '' ? null : Number(fee),
        stage: stage,
        lines: prod ? [prod] : [], inplay: prod ? [prod] : []
      });
      D().opportunities.push(o);
      c.last_touch = ZS.today();
      if (!c.assigned_to) c.assigned_to = o.assigned_to;
      G.save();
      var och = ZS.contactById(c, o.contact);
      G.log('opp_new', 'Opened "' + o.title + '" for ' + c.name +
            (och ? ' through ' + och.name : ' with nobody named on it') +
            (o.fee ? ' at ' + ZS.money(o.fee) : ' with no fee agreed yet'), { client: c.id, opp: o.id });
      G.toast('Opened for ' + c.name + '. Their history is untouched.');
      PICK = []; OQ = ''; BRIEF = '';
      G.go('#/opp/' + o.id);
      return;
    }

    if (f.id === 'recscanform') {
      e.preventDefault();
      var rsOpp = f.dataset.oid;
      var rsText = String(new FormData(f).get('text') || '');
      var m2 = document.getElementById('modal'); if (m2 && m2.open) m2.close();
      var res2 = ZS.readDocument(rsText);
      if (!Object.keys(res2.fields).length) return G.toast('Nothing recognisable in that.', true);
      REC_SCAN = { opp: rsOpp, fields: res2.fields, notes: res2.notes };
      G.render();
      setTimeout(applyRecScan, 0);
      return;
    }

    if (f.id === 'winform') {
      e.preventDefault();
      var wo = (D().opportunities || []).filter(function (x) { return x.id === f.dataset.oid; })[0];
      if (!wo) return;
      var wd = new FormData(f);
      var wfee = Number(wd.get('fee') || 0);
      var wdays = Number(wd.get('days') || ZS.PLAN_DEFAULT);
      /* Signing without a figure is allowed: deals get agreed on a call and
         priced in writing afterwards. It lands as no fee rather than a wrong one,
         and the On file panel goes on saying the fee is missing. */
      var wc = G.clientById(wo.client);
      var pid = wo.product || (ZS.PRODUCTS[0] || {}).id;
      if (wfee) wo.fee = wfee;
      var wr = ZS.winOpp(wo, wc, pid, wfee || wo.fee || null, ZS.today());
      if (wr.error) return G.toast(wr.error, true);
      /* The delivery file exists the moment they sign, dated off the duration
         they were promised — nobody has to remember to open one. */
      if (wo.proc) {
        wo.proc.duration = wdays;
        wo.proc.plan = ZS.planFor(wo.closed, wdays);
      }
      /* ⚠️ NOTHING IS PUSHED TO A SALES LIST ANY MORE. It used to append to
         `D.sales`, which no sync ever carried, so the row was gone on the next
         pull and every target read zero. The engagement IS the sale now:
         ZS.salesOf() derives it from the fee, the owner and the dates that are
         already on it and already sync. */
      D().followups.unshift(ZS.newFollow({
        opp: wo.id, client: wc.id, line: pid, owner: wo.assigned_to, by: D().session,
        due: ZS.today(), method: 'Call',
        note: 'Signed. Book the onboarding call and ask for the credentials and data we need.' }));
      G.save();
      var wm = document.getElementById('modal'); if (wm && wm.open) wm.close();
      G.log('opp_won', 'Won — ' + wc.name + ' signed for ' + ZS.productName(pid) +
            (wfee ? ' at ' + ZS.money(wfee) : ' with no fee agreed yet') +
            ', ' + wdays + '-day build', { client: wc.id, opp: wo.id });
      G.toast('Signed. The delivery file is open and the dates are set.');
      G.render();
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
      var carId = fd.get('line') || f.dataset.product || (o.product || null);
      D().followups.unshift(ZS.newFollow({
        opp: oid, client: o.client, line: carId, owner: o.assigned_to, by: D().session,
        due: fd.get('when') || ZS.today(), method: fd.get('method'),
        note: note, outcome: fd.get('outcome'),
        done: true, done_at: fd.get('when') || ZS.today()
      }));
      /* and the next one, open.
         ⚠️ NOT WHEN THEY ARE READY TO SIGN. The field is hidden in that case and
         the check is made here as well, because a hidden input still submits its
         value and a follow-up booked against somebody about to sign is the kind
         of nag that costs a deal. */
      var wantsNext = ZS.needsNextDate(fd.get('outcome'));
      if (wantsNext && fd.get('next')) {
        D().followups.unshift(ZS.newFollow({
          opp: oid, client: o.client, line: carId, owner: o.assigned_to, by: D().session,
          due: fd.get('next'), method: fd.get('method'),
          note: 'Follow up on: ' + (note ? note.slice(0, 80) : (o.title || 'the enquiry'))
        }));
      }
      var sc = ZS.scoreNote(note, { outcome: fd.get('outcome'),
        lineNames: G.products().map(function (x) { return x.name; }) });
      o.expected = fd.get('expected') || o.expected;
      o.updated = ZS.today();
      if (c) c.last_touch = ZS.today();
      G.log('follow_log', (c ? c.name : 'Client') + ' — ' + fd.get('method') + ': ' +
            (note ? note.slice(0, 90) : 'no remark') + ' (' + fd.get('outcome') + ')',
            { client: o.client, opp: oid });
      G.save();
      var m3 = document.getElementById('modal'); if (m3 && m3.open) m3.close();
      G.toast('Logged — note scored ' + sc.score + '/10.' +
              (wantsNext && fd.get('next') ? ' Next one booked for ' + fd.get('next') + '.'
               : !wantsNext ? ' No follow-up booked — they are ready to sign.' : ''));
      G.render();
      return;
    }

    if (f.id === 'loseform') {
      e.preventDefault();
      var o2 = (D().opportunities || []).filter(function (x) { return x.id === f.dataset.oid; })[0];
      if (!o2) return;
      var why = document.getElementById('l-why').value;
      var note = document.getElementById('l-note').value;
      ZS.loseOpp(o2, note ? why + ' — ' + note : why, ZS.today());
      var lc = G.clientById(o2.client);
      G.log('opp_lost', 'Lost — ' + (lc ? lc.name : 'a client') + ' — ' + why,
            { client: o2.client, opp: o2.id });
      G.save();
      var m2 = document.getElementById('modal'); if (m2 && m2.open) m2.close();
      G.toast('Marked lost. It is off the board and on their record.');
      G.render();
    }
  };
})();
