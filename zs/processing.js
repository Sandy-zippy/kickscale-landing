/* Processing: what happens after the product is sold.

   An agency does not finish when the client says yes. The build has to be
   delivered, the client has to be onboarded and handed the keys, and the
   insurance has to follow it. Two of those run on a statutory fourteen-day
   clock from the date of sale — and if the insurance endorsement misses it,
   the new owner's own-damage cover simply is not there. That is the fact this
   screen exists to prevent.

   Processing is not a second record. It is a later phase of the same
   opportunity (`o.proc`), so the client, the product, the price and the
   owner stay attached without being copied anywhere. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  var MINE = false;

  function D() { return G.D(); }
  function staffName(id) { var u = ZS.staffById(id); return u ? u.name : 'Unassigned'; }

  function visible(o) {
    var me = G.me();
    if (!ZS.acc(me, D().access).clients) return false;
    if (ZS.acc(me, D().access).scope !== 'company' && o.assigned_to !== me.id) return false;
    if (MINE && o.assigned_to !== me.id) return false;
    return true;
  }

  function deals() { return ZS.procDeals(D().opportunities || []).filter(visible); }

  /* The clock, in the words somebody would actually use. */
  /* What the card says about time. The number that matters is the handover
     date we promised, and whether anything on the way there has slipped —
     a milestone gone by unmet is the first sign a build is going wrong. */
  function clock(o) {
    var slipped = ZS.planSlipped(o);
    if (slipped.length) {
      var worst = slipped.slice().sort(function (a, b) { return b.lateBy - a.lateBy; })[0];
      return ['bad', worst.stage.toLowerCase() + ' ' + worst.lateBy + ' day' +
              (worst.lateBy === 1 ? '' : 's') + ' late'];
    }
    if (o.proc.stage === 'Running') return ['ok', 'live and running'];
    var left = ZS.daysLeft(ZS.procDue(o));
    if (left === null) return ['dim', 'no plan set'];
    if (left < 0) return ['bad', Math.abs(left) + ' day' + (Math.abs(left) === 1 ? '' : 's') + ' past handover'];
    if (left === 0) return ['bad', 'handover promised today'];
    if (left <= 7) return ['warn', left + ' day' + (left === 1 ? '' : 's') + ' to handover'];
    return ['dim', left + ' days to handover'];
  }


  /* ---------------- the board ---------------- */

  V.processing = function () {
    if (!G.acc().clients) return G.deny('Not in your view', 'Client records are switched off for your role.');
    var live = deals();
    var products = G.products(), byId = {};
    products.forEach(function (c) { byId[c.id] = c; });

    var late = live.filter(function (o) { return ZS.procOverdue(o); });

    var h = '<div class="ph"><div><h1>Processing</h1>' +
      '<p>Every signed engagement until it is live and theirs. Each build carries a plan, ' +
      'and every milestone on it has <b>a date we promised</b> — ' +
      'a slipped one is the first sign a build is going wrong.</p></div></div>';

    h += '<div class="chips" style="margin-bottom:16px">' +
      '<button class="chip" data-act="procMine" aria-pressed="' + (MINE ? 'true' : 'false') + '">Only mine</button>' +
      '<span style="margin-left:auto;font-size:12px;color:var(--dim)">' + live.length +
      ' build' + (live.length === 1 ? '' : 's') + ' in flight</span></div>';

    if (late.length) {
      h += '<div class="card" style="border-color:var(--bad);margin-bottom:16px">' +
        '<h3 style="color:var(--bad)">' + late.length + ' behind the plan</h3>' +
        '<p class="m">A date we gave the client has gone by. They notice these. ' +
        late.slice(0, 8).map(function (o) {
          var c2 = G.clientById(o.client);
          return '<button class="minibtn" data-act="openDrawer" data-id="' + esc(o.id) + '" style="margin:6px 5px 0 0">' +
            esc(c2 ? c2.name : 'Client') + '</button>';
        }).join('') + '</p></div>';
    }

    h += '<div class="board pipe">' + ZS.PROC_STAGES.map(function (st) {
      var rows = live.filter(function (o) { return o.proc.stage === st; });
      return '<div class="col"><h4 title="' + esc(ZS.PROC_HELP[st] || '') + '">' + esc(st) +
        '<i>' + rows.length + '</i></h4>' +
        '<div class="colhelp">' + esc(ZS.PROC_HELP[st] || '') + '</div>' +
        (rows.length
          ? rows.map(function (o) {
              var c = G.clientById(o.client), line = byId[o.won_line];
              var ck = clock(o);
              var pr = ZS.procProgress(o);
              return '<div class="vcard" data-act="openDrawer" data-id="' + esc(o.id) + '">' +
                '<b>' + esc(c ? c.name : 'Unknown') + '</b>' +
                '<span>' + esc(ZS.productName(o.product)) + '</span>' +
                '<span class="bar"><i style="width:' + pr.pct + '%"></i></span>' +
                '<span class="oppmeta"><span class="pill ' + ck[0] + '">' + esc(ck[1]) + '</span></span>' +
                '<span class="oppmeta"><span>sold ' + esc(o.closed || '—') + '</span>' +
                '<span>' + esc(staffName(o.assigned_to).split(' ')[0]) + '</span></span>' +
                '<select class="cardstage" data-procstage="' + esc(o.id) + '" ' +
                  'aria-label="Move ' + esc(c ? c.name : 'this transfer') + ' to another stage">' +
                  ZS.PROC_STAGES.map(function (s2) {
                    return '<option value="' + esc(s2) + '"' + (o.proc.stage === s2 ? ' selected' : '') + '>' +
                      (s2 === o.proc.stage ? '' : 'Move to ') + esc(s2) + '</option>';
                  }).join('') + '</select>' +
                '</div>';
            }).join('')
          : '<div class="empty" style="padding:18px;font-size:12px">—</div>') +
        '</div>';
    }).join('') + '</div>';

    var done = (D().opportunities || []).filter(function (o) {
      return visible(o) && o.proc && o.proc.stage === 'Completed';
    });
    if (done.length) {
      h += '<p class="eyebrow" style="margin-top:30px">Transferred and closed</p>' +
        '<div class="scroller"><table class="tbl"><thead><tr><th>Client</th><th>Service line</th>' +
        '<th>Sold</th><th>Completed</th><th>Days taken</th><th>Owner</th>' +
        '</tr></thead><tbody>' + done.map(function (o) {
          var c = G.clientById(o.client), line = byId[o.won_line];
          var took = ZS.daysLeft(o.proc.done, o.closed);
          return '<tr data-act="openDrawer" data-id="' + esc(o.id) + '">' +
            '<td><b>' + esc(c ? c.name : '—') + '</b></td>' +
            '<td>' + esc(ZS.productName(o.product)) + '</td>' +
            '<td>' + esc(o.closed || '—') + '</td><td>' + esc(o.proc.done || '—') + '</td>' +
            '<td class="num">' + (took === null ? '—' : took) + '</td>' +
            '<td>' + esc(staffName(o.assigned_to)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    h += G.drawerHTML ? G.drawerHTML() : '';
    return h;
  };

  /* ---------------- the transfer file, inside an opportunity ---------------- */

  /* `brief` is the quick-look drawer: the clock, the stage and the progress bar
     are the reasons somebody opens a transfer file in a hurry. The document grid
     underneath is a filing job, and a filing job belongs on the full page. */
  G.procPanel = function (o, c, line, brief) {
    if (!o || !o.proc) return '';
    var ck = clock(o), pr = ZS.procProgress(o);
    var may = G.acc().clients;

    var h = '<div class="card" style="margin-bottom:18px;border-color:var(--' + ck[0] + ')">' +
      '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:220px"><h3>Transfer file</h3>' +
      '<p class="m">' + esc(ZS.PROC_HELP[o.proc.stage] || '') + '</p></div>' +
      '<span class="pill ' + ck[0] + '">' + esc(ck[1]) + '</span>' +
      (may ? '<span class="stagepick"><label for="p-stage">Stage</label>' +
        '<select id="p-stage" data-procstage="' + esc(o.id) + '">' +
        ZS.PROC_STAGES.map(function (s2) {
          return '<option value="' + esc(s2) + '"' + (o.proc.stage === s2 ? ' selected' : '') + '>' +
            esc(s2) + '</option>';
        }).join('') + '</select></span>' : '') +
      '</div>' +
      '<span class="bar" style="margin-top:12px"><i style="width:' + pr.pct + '%"></i></span>' +
      '<p class="hint" style="margin-top:8px">Sold ' + esc(o.closed || '—') +
        ' &middot; handover promised <b>' + esc(ZS.procDue(o) || '—') + '</b>' +
        (o.proc.handed_over ? ' &middot; line handed over ' + esc(o.proc.handed_over) : '') + '</p>';

    if (!brief) {
      h += docSection('deal', o.id, ZS.docsOf(o.proc), may,
        'Everything this build runs on. What is missing here is what is holding the stage.',
        ZS.PROC_NEEDS[o.proc.stage] || []);
    }
    h += '</div>';
    return h;
  };

  /* ---------------- invoices on an engagement ----------------
     Two or three is normal and the split changes mid-build more often than not,
     so this is a list you add to rather than a fixed first/second. */
  G.invoiceSection = invoiceSection;
  function invoiceSection(o, c) {
    var may = G.acc().invoices;
    var list = ZS.invoicesFor(D().invoices || [], o.id);
    var owed = ZS.owedOn(D().invoices || [], o.id);

    var adv = ZS.advanceOn(D().invoices || [], o.id);
    var h = '<h4 class="sec" style="margin-top:18px">Invoices' +
      (owed ? ' <span class="pill bad">' + ZS.money(owed) + ' outstanding</span>' : '') +
      (adv ? ' <span class="pill ok">' + ZS.money(adv) + ' in advance</span>' : '') +
      (ZS.oppValue(o) ? ' <span class="pill dim">of ' + ZS.money(ZS.oppValue(o)) + '</span>' : '') +
      '</h4>';

    h += '<div class="invlist">' + (list.length
      ? list.map(function (i) {
          var late = ZS.invoiceOverdue(i);
          return '<div class="invrow">' +
            '<span class="invn">' + i.n + '<i>of ' + i.of + '</i></span>' +
            '<div class="t"><b>' + esc(i.scope || 'Phase ' + i.n) +
            (i.ref ? ' <span class="refchip">' + esc(i.ref) + '</span>' : '') + '</b>' +
            '<span>raised ' + esc(i.raised) + ' &middot; due ' + esc(i.due) +
            (i.paid ? ' &middot; paid ' + esc(i.paid) : '') + '</span></div>' +
            '<span class="invamt">' + ZS.money(i.amount) +
              (i.advance ? '<i>' + ZS.money(i.advance) + ' in advance</i>' : '') +
              (i.state !== 'paid' && ZS.invoiceLeft(i) !== i.amount
                ? '<i>' + ZS.money(ZS.invoiceLeft(i)) + ' left</i>' : '') +
            '</span>' +
            /* ⚠️ CLEARED OR NOT, IN ONE WORD, NEXT TO THE MONEY. "draft / sent /
               paid / overdue" is the life of an invoice and it is not the
               question anybody actually asks, which is whether the money is in.
               Both are shown: the word first, the detail beside it. */
            '<span class="pill ' + (i.state === 'paid' ? 'ok' : late ? 'bad' : 'warn') + '">' +
              (i.state === 'paid' ? 'cleared' : 'not cleared') + '</span>' +
            '<span class="pill dim">' + esc(late && i.state !== 'paid' ? 'overdue' : i.state) + '</span>' +
            (i.proof ? '<span class="pill em" title="' + esc(i.proof.note || '') + '">proof read</span>' : '') +
            /* ⚠️ SET BY HAND, ALWAYS. The Reconciler reads a proof and proposes;
               this is the control that waits for nobody. Half the time you know
               the money landed because you looked at your bank, and a system
               that will not let you say so is a system you work around.

               Plain words on all four. It read "draft / sent / cleared /
               overdue": three internal names and one plain one, which is what a
               list looks like when nobody has read it aloud. */
            (may ? '<select class="invstate" data-invstate="' + esc(i.id) + '" ' +
              'aria-label="Is this invoice cleared?" title="Set this yourself, any time">' +
              ZS.INVOICE_STATES.map(function (st) {
                return '<option value="' + st + '"' + (i.state === st ? ' selected' : '') + '>' +
                  esc(ZS.INVOICE_WORDS[st] || st) + '</option>';
              }).join('') + '</select>' +
              '<button class="minibtn" data-act="setAdvance" data-id="' + esc(i.id) + '" ' +
              'aria-label="Record an advance against invoice ' + i.n + '">Advance</button>' +
              '<button class="xbtn" data-act="dropInvoice" data-id="' + esc(i.id) + '" ' +
              'title="Remove" aria-label="Remove invoice ' + i.n + '">&times;</button>' : '') +
            '</div>';
        }).join('')
      : '<p class="m" style="padding:12px 14px">Nothing raised yet.</p>') + '</div>';

    if (may) {
      h += '<div class="invadd">' +
        '<button class="btn alt" data-act="addInvoice" data-id="' + esc(o.id) + '">+ Raise an invoice</button>' +
        '<span class="hint">Split it however it was agreed — the numbering follows.</span></div>';
    }
    return h;
  }

  /* ---------------- documents ----------------

     One renderer, used by the transfer file and by the product record, so a
     document looks and behaves the same wherever it is attached. */

  /* Where a document actually lives, given the id the row carries. Delete and
     edit both need it and both used to work it out themselves, which is how they
     drift apart. An engagement keeps docs in two places — the delivery file once
     one exists, the engagement before that — so both are searched. */
  function docHolders(kind, holderId) {
    if (kind === 'client') {
      var cl = G.clientById(holderId);
      return cl ? [cl] : [];
    }
    var o = (D().opportunities || []).filter(function (x) { return x.id === holderId; })[0];
    if (!o) return [];
    return o.proc ? [o.proc, o] : [o];
  }
  function docOwner(kind, holderId, docId) {
    var hs = docHolders(kind, holderId);
    for (var i = 0; i < hs.length; i++) {
      if ((hs[i].docs || []).some(function (d) { return d.id === docId; })) return hs[i];
    }
    return null;
  }

  /* One filed document: open it, rename or re-file it, remove it.

     Every one of those three has to work wherever a document lives, so this is
     the only place a document row is drawn and every screen calls it. The open
     link is a real link to the stored file — a row that says "viewable" and
     hands you nothing is worse than one that admits the file was too big. */
  /* Which slots are worth a model's attention, and as what. Everything else is
     filed and left alone: reading a handover pack would spend an allowance and
     tell nobody anything. */
  var READABLE = {
    payment_proof: 'payment',
    gst_cert: 'billing', pan: 'billing', bank: 'billing'
  };

  function maybeRead(doc, kind, holder, type) {
    var job = READABLE[type];
    if (!job || !doc || !doc.data) return;
    if (!window.API || !API.signedIn()) return;
    if (job === 'payment' && !G.acc().invoices) return;

    G.toast('Reading ' + doc.name + '\u2026');
    API.readDoc(job, doc.data, doc.mime || 'image/jpeg',
                kind === 'client' ? { client: holder } : { opp: holder })
      .then(function (r) {
        if (!r || !r.read) return;
        doc.read = r.read;                       /* kept on the document itself */
        G.save();

        if (job === 'payment') {
          /* the agent proposes; a person clears the invoice */
          var made = G.runAgent('reconciler',
            { oppId: holder, doc: doc, read: r.read }, { manual: true });
          G.toast(made ? 'Read it. It is in the queue for you to approve.'
                       : 'Read it, but there was nothing to propose.');
        } else {
          fillBilling(holder, r.read, doc);
        }
        G.render();
      })
      .catch(function (e) {
        /* the document is already saved; only the reading failed */
        G.toast('Saved, but I could not read it: ' + (e.message || 'no reason given'), true);
      });
  }

  /* ---- billing details, off the document that carries them ----

     ⚠️ IT FILLS ONLY WHAT IS EMPTY, AND NEVER OVERWRITES.

     That is the whole safety rule here, and it is why this does not need the
     approval queue the way a payment does. Writing a GSTIN into a blank box is
     visible, obviously wrong if it is wrong, and one edit to fix. Silently
     replacing a number somebody typed is a different thing entirely: they would
     never know it happened, and they would keep believing the old one.

     Every field it fills is named in the toast and in the activity log, so
     nothing arrives invisibly. */
  /* what the model calls it  ->  where it lives on the client.
     Every one of these also has a field in the registry, so anything filled here
     can be seen and corrected by hand. check_ghosts asserts that. */
  var BILL_MAP = {
    legal_name: ['legal_name'], gst: ['gst'], pan: ['pan'],
    bank_name: ['bank', 'name'], bank_account: ['bank', 'account'],
    ifsc: ['bank', 'ifsc'], account_holder: ['bank', 'holder'],
    city: ['address', 'city'], state: ['address', 'state'], address: ['address', 'line1']
  };

  function fillBilling(clientId, read, doc) {
    var c = G.clientById(clientId);
    if (!c) return;
    if (!G.acc().clients) return;

    var filled = [], skipped = [];
    Object.keys(BILL_MAP).forEach(function (k) {
      var v = String(read[k] == null ? '' : read[k]).trim();
      if (!v) return;
      var path = BILL_MAP[k];
      var holder = c;
      if (path.length === 2) { c[path[0]] = c[path[0]] || {}; holder = c[path[0]]; }
      var key = path[path.length - 1];
      var had = String(holder[key] == null ? '' : holder[key]).trim();
      if (had) {
        if (had.toLowerCase() !== v.toLowerCase()) skipped.push(k.replace(/_/g, ' '));
        return;
      }
      holder[key] = v;
      filled.push(k.replace(/_/g, ' '));
    });

    if (!filled.length && !skipped.length) {
      G.toast('Read it, and there was nothing in it we did not already have.');
      return;
    }
    if (filled.length) {
      c.last_touch = ZS.today();
      G.log('client_edit', 'Read off ' + (doc ? doc.name : 'a document') + ': filled ' +
            filled.join(', ') + ' (' + (read.confidence || 'low') + ' confidence)',
            { client: c.id });
      G.save();
    }
    G.toast(
      (filled.length ? 'Filled ' + filled.join(', ') + '. ' : '') +
      (skipped.length ? 'Left ' + skipped.join(', ') + ' alone, because you already had a ' +
        'different value there. Check them if you want.' : '') +
      (filled.length && !skipped.length ? 'Check them before you invoice.' : ''));
    G.render();
  }

  /* Copying to the clipboard is blocked in some contexts and simply absent in
     older ones, so a failure shows the link instead of pretending it worked. */
  function copy(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () { G.modal('The link', '', '<p class="body">' + esc(text) + '</p>'); });
        return;
      }
    } catch (e) { /* fall through */ }
    G.modal('The link', 'Copy it from here', '<p class="body">' + esc(text) + '</p>');
  }

  /* ⚠️ A FILE THE SERVER HAS IS A FILE YOU CAN OPEN, even with no copy in the
     browser. Every Open and Download on this row used to be gated on `d.data`,
     the browser's own copy, which is only kept for files under about 1.4 MB. So
     a 1.4 MB set of minutes uploaded perfectly, sat safely in storage, and the
     row offered no way whatsoever to look at it: "too large to keep in the
     browser, recorded only", as though the file had been thrown away. It had
     not. Nothing asked the server for it.

     The server copy cannot be a plain href because that endpoint wants a token
     and a link carries none, so it is fetched and handed to the browser as a
     blob. Same two buttons, either source. */
  /* ⚠️ DO NOT HIDE IT WHEN THE FILE IS ON THE SERVER AND YOU ARE SIGNED OUT.
     A missing button is exactly what made a perfectly safe file look lost. The
     button is offered whenever the file exists ANYWHERE, and if it cannot be
     fetched right now the action says why in a sentence. A control that explains
     itself beats a gap somebody has to interpret. */
  function canOpen(d) { return !!(d.data || d.remote); }

  function docFileRow(d, kind, holderId, may) {
    var id = kind + '|' + holderId + '|' + d.id;
    var isImg = d.data && /^data:image\//.test(d.data);
    var open = canOpen(d);
    var thumb = isImg
      ? '<a class="dthumb" href="' + d.data + '" target="_blank" rel="noopener" ' +
        'title="Open ' + esc(d.name) + '"><img src="' + d.data + '" alt=""></a>'
      : '<span class="dthumb doc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.6"><path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/></svg></span>';

    return '<div class="dfile">' + thumb +
      '<span class="dmeta">' +
        (open
          ? '<a href="#" data-act="openDoc" data-id="' + esc(id) + '">' + esc(d.name) + '</a>'
          : '<b>' + esc(d.name) + '</b>') +
        '<i>' + esc(G.fileSize(d.size)) + ' &middot; ' + esc(d.when) +
        (d.remote ? ' &middot; on the server'
          : d.upload_error ? ' &middot; <b style="color:var(--bad-ink)">not sent up: ' +
              esc(d.upload_error) + '</b>'
          : d.data ? ' &middot; in this browser only'
          : d.too_big ? ' &middot; too large for the browser, and not on the server either'
          : ' &middot; recorded, file not stored') + '</i>' +
      '</span>' +
      '<span class="dacts">' +
        /* ---- keep a copy, and give somebody else a copy ----
           The point of putting a file in here is not having to keep it on a
           laptop. That only holds if it can come back out again. */
        (open
          ? '<button class="minibtn" data-act="openDoc" data-id="' + esc(id) + '" ' +
            'aria-label="Open ' + esc(d.name) + '">Open</button>' +
            '<button class="minibtn" data-act="saveDoc" data-id="' + esc(id) + '" ' +
            'aria-label="Download ' + esc(d.name) + '">Download</button>'
          : '') +
        /* it never reached the server, so say so and offer the one thing that
           fixes it rather than leaving somebody to guess */
        (!d.remote && d.data && may
          ? '<button class="minibtn" data-act="sendDocUp" data-id="' + esc(id) + '" ' +
            'aria-label="Send ' + esc(d.name) + ' to the server">Send it up</button>'
          : '') +
        /* Share stays visible even when the file is not on the server yet. It
           cannot work, and the action says so precisely and offers the retry —
           which is more use than a button that quietly is not there. */
        (d.share
          ? '<button class="minibtn on" data-act="copyShare" data-id="' + esc(id) + '" ' +
            'aria-label="Copy the link to ' + esc(d.name) + '">Copy link</button>' +
            (may ? '<button class="minibtn" data-act="unshareDoc" data-id="' + esc(id) + '" ' +
                   'aria-label="Stop sharing ' + esc(d.name) + '">Stop sharing</button>' : '')
          : (may ? '<button class="minibtn" data-act="shareDoc" data-id="' + esc(id) + '" ' +
                   'aria-label="Share ' + esc(d.name) + '">Share</button>' : '')) +
        (may ? '<button class="minibtn" data-act="editDoc" data-id="' + esc(id) + '" ' +
               'aria-label="Edit ' + esc(d.name) + '">Edit</button>' : '') +
        (may ? '<button class="xbtn" data-act="dropDoc" data-id="' + esc(id) + '" ' +
               'title="Remove" aria-label="Remove ' + esc(d.name) + '">&times;</button>' : '') +
      '</span>' +
      (d.share
        ? '<span class="dshare">Shared &middot; the link works without signing in, ' +
          'until ' + esc(String(d.share.expires || '').slice(0, 10)) +
          (d.share.opens ? ' &middot; opened ' + d.share.opens +
            (d.share.opens === 1 ? ' time' : ' times') : ' &middot; not opened yet') +
          '</span>'
        : '') +
      '</div>';
  }
  /* ---- the file itself, from the browser or from the server ---- */
  function withFile(key, download) {
    var p = String(key).split('|'), kind = p[0], holder = p[1], docId = p[2];
    var own = docOwner(kind, holder, docId);
    var d = own && (own.docs || []).filter(function (x) { return x.id === docId; })[0];
    if (!d) return G.toast('That document is no longer here.', true);

    if (d.data) return handOver(d.data, d.name, download);
    if (!d.remote || !window.API || !API.signedIn()) {
      return G.toast('There is no copy of this file to open. It is recorded here, ' +
                     'and the file itself never reached the server.', true);
    }

    G.toast('Fetching ' + d.name + '\u2026');
    API.docBlob(d.remote).then(function (url) {
      handOver(url, d.name, download);
      /* the blob url is only needed long enough for the browser to take it */
      setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 60000);
    }).catch(function (e) {
      G.toast('The server would not hand it over: ' + (e.message || 'no reason given'), true);
    });
  }

  function handOver(url, name, download) {
    if (!download) {
      var w = window.open(url, '_blank');
      if (!w) G.toast('Your browser blocked the new tab. Allow pop-ups for this site.', true);
      return;
    }
    var a = document.createElement('a');
    a.href = url;
    a.download = name || 'document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* One place that puts a file on the server, so the upload path and the retry
     cannot drift apart. */
  function sendUp(doc, kind, holder, done) {
    var f = doc._file;
    var put = f
      ? API.uploadDoc(f, kind === 'client' ? 'client' : 'deal', holder, doc.type, doc.name)
      : API.uploadDataUrl(doc.data, doc.name, doc.mime,
                          kind === 'client' ? 'client' : 'deal', holder, doc.type);
    return put.then(function (r) {
      if (!r || !r.id) throw new Error('the server took it and named nothing');
      doc.remote = r.id;
      delete doc.upload_error;
      G.save();
      if (done) done(null);
    }).catch(function (e) {
      /* ⚠️ RECORDED, NOT SWALLOWED. This was an empty catch, so an upload that
         failed left a document that looked filed, could not be opened, could not
         be shared, and gave no reason for any of it. */
      doc.upload_error = (e && e.message) || 'no reason given';
      G.save();
      if (done) done(doc.upload_error);
    });
  }
  G.sendDocUp = sendUp;

  G.docFileRow = docFileRow;

  /* ---- a slot that holds thirty files ----

     Every file is written out, because a name that is not in the page is a name
     nobody can search for and nothing can assert on. Only the first few are on
     SCREEN: a card that grows to thirty rows pushes every slot below it off the
     bottom, and it does that again on every upload, which is the "it adjusts
     while the documents are getting uploaded" Bhargav described.

     <details> and not a toggle in state, because a toggle would need an id per
     slot and the 20-second pulse re-render would shut it anyway. */
  var SHOW_FIRST = 3;
  function docFileList(mine, kind, holderId, may) {
    var h = mine.slice(0, SHOW_FIRST).map(function (d) {
      return docFileRow(d, kind, holderId, may);
    }).join('');
    var rest = mine.slice(SHOW_FIRST);
    if (rest.length) {
      h += '<details class="dmore"><summary>Show the other ' + rest.length +
        (rest.length === 1 ? ' file' : ' files') + '</summary>' +
        rest.map(function (d) { return docFileRow(d, kind, holderId, may); }).join('') +
        '</details>';
    }
    return h;
  }

  G.docSection = docSection;
  function docSection(kind, holderId, docs, may, blurb, blocking) {
    var types = ZS.docTypes(kind);
    var groups = [];
    types.forEach(function (t) { if (groups.indexOf(t.group) < 0) groups.push(t.group); });
    var holder = { docs: docs || [] };

    /* ⚠️ A document whose type has no slot rendered NOWHERE — uploaded, stored,
       counted by nothing and visible on no screen. Every stray type gets a row
       of its own rather than disappearing, because a file you can see is a file
       you can re-file, and one you cannot see is one you think you lost. */
    var known = {};
    types.forEach(function (t) { known[t.key] = 1; });
    var strays = [];
    (docs || []).forEach(function (d) {
      if (known[d.type]) return;
      if (strays.indexOf(d.type) < 0) strays.push(d.type);
    });
    if (strays.length) {
      if (groups.indexOf('Unfiled') < 0) groups.push('Unfiled');
      types = types.concat(strays.map(function (k) {
        return { key: k, label: k ? ('Filed as "' + k + '"') : 'No slot recorded',
                 group: 'Unfiled', when: 'This does not match any slot. Edit it to move it.' };
      }));
    }

    var h = '<h4 class="sec" style="margin-top:18px">Documents</h4>' +
      '<p class="hint" style="margin-bottom:10px">' + esc(blurb) + '</p>';

    h += '<div class="docs">' + groups.map(function (g) {
      return '<div class="docgroup"><p class="eyebrow">' + esc(g) + '</p>' +
        types.filter(function (t) { return t.group === g; }).map(function (t) {
          var mine = ZS.docsIn(holder, t.key);
          var need = (blocking || []).indexOf(t.key) >= 0 && !mine.length;
          return '<div class="docrow' + (need ? ' need' : '') + '">' +
            '<div class="dhead">' +
              '<b>' + esc(t.label) + '</b>' +
              (mine.length ? '<span class="dcount">' + mine.length + '</span>' : '') +
              (may
                ? '<label class="upl">' + (mine.length ? 'Add more' : 'Upload') +
                  '<input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt" hidden ' +
                  'data-doc="' + esc(kind + '|' + holderId + '|' + t.key) + '"></label>'
                : '') +
            '</div>' +
            (t.when ? '<span class="dwhen">' + esc(t.when) + '</span>' : '') +
            (need ? '<span class="needline">Needed before this stage can move on.</span>' : '') +
            (mine.length
              ? '<div class="dfiles">' + docFileList(mine, kind, holderId, may) + '</div>'
              : '') +
            '</div>';
        }).join('') + '</div>';
    }).join('') + '</div>';
    return h;
  }

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    procMine: function () { MINE = !MINE; G.render(); },
    addInvoice: function (oppId) {
      if (!G.acc().invoices) return;
      var o = (D().opportunities || []).filter(function (x) { return x.id === oppId; })[0];
      if (!o) return;
      var existing = ZS.invoicesFor(D().invoices, o.id);
      var left = Math.max(0, ZS.oppValue(o) - existing.reduce(function (a, i) { return a + i.amount; }, 0));
      G.modal('Raise an invoice', (G.clientById(o.client) || {}).name || '',
        '<form id="invform" data-oid="' + esc(o.id) + '">' +
        '<div class="f" style="margin-bottom:12px"><label for="i-scope">What is this one for?</label>' +
        '<input id="i-scope" name="scope" placeholder="e.g. Phase 1 — build"></div>' +
        '<div class="f" style="margin-bottom:12px"><label for="i-amt">Amount</label>' +
        '<input id="i-amt" name="amount" type="number" min="0" value="' + (left || '') + '">' +
        '<p class="hint">' + (left ? ZS.money(left) + ' of the agreed fee is not yet invoiced.'
                                   : 'The whole fee is already invoiced.') + '</p></div>' +
        '<p class="err" id="i-err"></p>' +
        '<button class="btn" type="submit">Raise it</button></form>');
    },
    /* ---- money in before the work ----
       An advance belongs ON the invoice it is an advance against. A separate
       "payments" list would be the same money in two places, and the two would
       disagree within a week. */
    setAdvance: function (id) {
      if (!G.acc().invoices) return;
      var inv = (D().invoices || []).filter(function (x) { return x.id === id; })[0];
      if (!inv) return;
      G.modal('Advance against ' + (inv.ref || 'this invoice'), ZS.money(inv.amount) + ' raised',
        '<form id="advform" data-id="' + esc(inv.id) + '">' +
        '<p class="m">Money already received against this one. It comes off what is ' +
        'outstanding, and it is counted as arrived even while the invoice is open.</p>' +
        '<div class="f" style="margin-top:12px"><label for="adv-amt">Received so far</label>' +
        '<input id="adv-amt" name="advance" type="number" min="0" max="' + (inv.amount || 0) + '" ' +
        'value="' + (inv.advance || '') + '">' +
        '<span class="hint">' + ZS.money(inv.amount) + ' was raised. ' +
        'The whole amount marks it cleared.</span></div>' +
        '<p class="err" id="adv-err"></p>' +
        '<div style="display:flex;gap:10px;margin-top:14px">' +
        '<button class="btn" type="submit">Save it</button>' +
        '<button class="btn alt" type="button" data-act="closeModal">Cancel</button></div></form>');
    },

    dropInvoice: function (id) {
      if (!G.acc().invoices) return;
      var r = ZS.dropInvoice(D().invoices, id);
      if (r.error) return G.toast(r.error, true);
      G.log('invoice_drop', 'Invoice removed');
      G.save(); G.toast('Removed.'); G.render();
    },
    /* ---- sharing a document ----

       A share link works with NO SIGN-IN, which is the point and also the risk.
       So the file has to be on the server before there is anything to share: a
       document that only exists as a data URL in this browser cannot be fetched
       by anybody else, however good the link looks.

       The link is a revocable row rather than a signature, so "stop sharing"
       works immediately and the row can say how many times it was opened. */
    /* ---- opening a file, from wherever it actually is ----
       The browser copy if there is one, and the server's if there is not. The
       server's cannot be a plain link because that endpoint wants a token, so it
       is fetched and handed over as a blob. */
    openDoc: function (key) { withFile(key, false); },
    saveDoc: function (key) { withFile(key, true); },

    /* An upload that failed, tried again, with the reason kept either way. */
    sendDocUp: function (key) {
      var p = String(key).split('|'), kind = p[0], holder = p[1], docId = p[2];
      if (!G.acc().clients) return;
      var own = docOwner(kind, holder, docId);
      var doc = own && (own.docs || []).filter(function (d) { return d.id === docId; })[0];
      if (!doc) return G.toast('That document is no longer here.', true);
      if (!doc.data) {
        return G.toast('There is no copy of this file in the browser to send, ' +
                       'so it has to be uploaded again from the original.', true);
      }
      if (!window.API || !API.signedIn()) {
        return G.toast('Sign in to the server first.', true);
      }
      G.toast('Sending ' + doc.name + '\u2026');
      sendUp(doc, kind, holder, function (err) {
        if (err) G.toast('It would not go: ' + err, true);
        else G.toast(doc.name + ' is on the server now.');
        G.render();
      });
    },

    shareDoc: function (key) {
      var p = String(key).split('|'), kind = p[0], holder = p[1], docId = p[2];
      if (!G.acc().clients) return;
      var own = docOwner(kind, holder, docId);
      var doc = own && (own.docs || []).filter(function (d) { return d.id === docId; })[0];
      if (!doc) return G.toast('That document is no longer here.', true);

      if (!window.API || !API.signedIn()) {
        return G.toast('Sharing needs the server. This file is only in this browser, ' +
                       'so there is nothing for anybody else to open.', true);
      }
      if (!doc.remote) {
        /* ⚠️ THIS USED TO GUESS, AND THE GUESS WAS WRONG. It said "uploaded
           before the server was connected", so Bhargav re-uploaded, got the same
           message, and reasonably concluded sharing was broken. The server was
           connected the whole time and the upload had failed for some other
           reason that nobody had recorded. Now the reason is kept on the
           document, said here, and there is a button that tries again. */
        return G.toast(doc.upload_error
          ? 'This file never reached the server: ' + doc.upload_error +
            ' Press "Send it up" on the row and it will try again.'
          : 'This file is not on the server yet, so there is nothing for anybody ' +
            'else to open. Press "Send it up" on the row.', true);
      }

      G.toast('Making a link…');
      API.shareDoc(doc.remote, 30).then(function (r) {
        doc.share = { token: r.token, url: r.url, expires: r.expires, opens: 0 };
        G.log('doc_edit', 'Shared ' + doc.name + ', link good for ' + (r.days || 30) + ' days',
              kind === 'client' ? { client: holder } : { opp: holder });
        G.save();
        copy(r.url);
        G.toast('Link copied. It works without signing in, for ' + (r.days || 30) + ' days.');
        G.render();
      }).catch(function (e) {
        G.toast(e.message || 'The server would not share that.', true);
      });
    },

    copyShare: function (key) {
      var p = String(key).split('|'), kind = p[0], holder = p[1], docId = p[2];
      var own = docOwner(kind, holder, docId);
      var doc = own && (own.docs || []).filter(function (d) { return d.id === docId; })[0];
      if (!doc || !doc.share) return;
      copy(doc.share.url);
      G.toast('Link copied.');
    },

    unshareDoc: function (key) {
      var p = String(key).split('|'), kind = p[0], holder = p[1], docId = p[2];
      if (!G.acc().clients) return;
      var own = docOwner(kind, holder, docId);
      var doc = own && (own.docs || []).filter(function (d) { return d.id === docId; })[0];
      if (!doc || !doc.share) return;
      if (!confirm('Stop sharing "' + doc.name + '"? Anybody holding the link loses it immediately.')) return;
      var tok = doc.share.token;
      doc.share = null;
      G.log('doc_edit', 'Stopped sharing ' + doc.name,
            kind === 'client' ? { client: holder } : { opp: holder });
      G.save(); G.render();
      if (window.API && API.signedIn()) {
        API.unshareDoc(tok).catch(function () {
          G.toast('Removed here, but the server still has the link live. Try again.', true);
        });
      }
      G.toast('Stopped. That link is dead.');
    },

    dropDoc: function (key) {
      var p = String(key).split('|'), kind = p[0], holder = p[1], docId = p[2];
      if (!G.acc().clients) return;
      var own = docOwner(kind, holder, docId);
      if (!own) return G.toast('That document is no longer here.', true);
      var gone = (own.docs || []).filter(function (d) { return d.id === docId; })[0];
      if (!confirm('Remove "' + (gone ? gone.name : 'this document') + '"? ' +
                   'It goes to the Bin and can be put back for ' + ZS.BIN_DAYS + ' days.')) return;
      /* into the bin, with a note of what it was filed against, so putting it
         back puts it back in the right slot rather than loose */
      if (gone) ZS.binPut(D(), 'document', gone, { kind: kind, holder: holder }, G.me());
      own.docs = (own.docs || []).filter(function (d) { return d.id !== docId; });
      var refs = kind === 'client' ? { client: holder } : { opp: holder };
      G.log('doc_remove', (gone ? gone.name : 'A document') + ' removed, kept in the bin for ' +
            ZS.BIN_DAYS + ' days', refs);
      G.save();

      /* ⚠️ AND OFF THE SERVER. This removed it from the browser and nowhere else,
         the same bug the engagement delete had: the row stayed in D1, the file
         stayed in R2, and the next reload put the document back on the page. The
         server bins it rather than destroying it, and holds on to the R2 object
         so putting it back gives you the file and not a broken link. */
      if (gone && gone.remote && window.API && API.signedIn()) {
        API.dropDoc(docId).then(function () {
          G.toast('In the bin for ' + ZS.BIN_DAYS + ' days, here and on the server.');
          return G.pullNow ? G.pullNow() : null;
        }).catch(function (err) {
          G.toast('Removed here, but the server refused: ' + (err.message || 'no reason given') +
                  '. It will come back on the next reload.', true);
        });
        return;
      }

      G.toast('Removed.');
      G.render();
    },

    /* Rename it, or re-file it under a different slot. Both are things somebody
       needs within a day of uploading: a phone calls a photo IMG_4471.jpg, and
       the MOU gets filed under the wrong heading the first time. */
    editDoc: function (key) {
      var p = String(key).split('|'), kind = p[0], holder = p[1], docId = p[2];
      if (!G.acc().clients) return;
      var own = docOwner(kind, holder, docId);
      if (!own) return G.toast('That document is no longer here.', true);
      var d = (own.docs || []).filter(function (x) { return x.id === docId; })[0];
      G.modal('Edit this document', d.name,
        '<form id="docedit" data-id="' + esc(key) + '">' +
        '<div class="f" style="margin-bottom:12px"><label for="de-name">Name</label>' +
        '<input id="de-name" name="name" value="' + esc(d.name) + '" autocomplete="off">' +
        '<span class="hint">What it is, in words you would search for.</span></div>' +
        '<div class="f" style="margin-bottom:12px"><label for="de-type">Filed under</label>' +
        '<select id="de-type" name="type">' + ZS.docTypes(kind).map(function (t) {
          return '<option value="' + esc(t.key) + '"' + (t.key === d.type ? ' selected' : '') +
            '>' + esc(t.group) + ' &middot; ' + esc(t.label) + '</option>';
        }).join('') + '</select>' +
        '<span class="hint">Move it to the right slot and it counts towards that one.</span></div>' +
        (d.data
          ? '<p class="hint"><a href="' + d.data + '" target="_blank" rel="noopener">Open the file</a> ' +
            '&middot; ' + esc(G.fileSize(d.size)) + ' &middot; uploaded ' + esc(d.when) + '</p>'
          : '<p class="hint">' + (d.too_big
              ? 'The file itself was too large to keep in the browser, so only this record exists. ' +
                'Re-upload a smaller copy to replace it.'
              : 'The file itself is not stored, only this record.') + '</p>') +
        '<div class="f" style="margin:12px 0"><label for="de-file">Replace the file</label>' +
        '<input id="de-file" name="file" type="file" ' +
        'accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt"></div>' +
        '<p class="err" id="de-err"></p>' +
        '<button class="btn" type="submit">Save</button></form>');
    }
  });

  /* The stage dropdown, on the board and inside the file. Refusing names the
     missing document, so the message is a sentence rather than a shrug. */
  var prevSubmitI = A.onSubmit;
  A.onSubmit = function (e) {
    if (prevSubmitI) prevSubmitI(e);
    if (e.target.id === 'advform') {
      e.preventDefault();
      if (!G.acc().invoices) return;
      var ai = (D().invoices || []).filter(function (x) { return x.id === e.target.dataset.id; })[0];
      if (!ai) return;
      var amt = Number(new FormData(e.target).get('advance')) || 0;
      if (amt < 0 || amt > (ai.amount || 0)) {
        document.getElementById('adv-err').textContent =
          'An advance cannot be more than the invoice. Raise another invoice instead.';
        return;
      }
      ai.advance = amt;
      /* Paying the whole thing in advance IS paying it. Leaving it "not cleared"
         with nothing outstanding is a row that argues with itself. */
      if (amt && amt >= (ai.amount || 0) && ai.state !== 'paid') {
        ai.state = 'paid';
        ai.paid = ZS.today();
      }
      G.log('invoice_state', 'Advance of ' + ZS.money(amt) + ' on ' + (ai.ref || 'an invoice') +
            (ai.state === 'paid' ? ', which clears it' : ''), { client: ai.client, opp: ai.opp });
      G.save();
      var am = document.getElementById('modal'); if (am && am.open) am.close();
      G.toast(ai.state === 'paid' ? 'Recorded. That clears the invoice.' : 'Recorded.');
      G.render();
      return;
    }

    if (e.target.id === 'docedit') {
      e.preventDefault();
      var dp2 = String(e.target.dataset.id).split('|');
      var own2 = docOwner(dp2[0], dp2[1], dp2[2]);
      if (!own2) return G.toast('That document is no longer here.', true);
      var fd2 = new FormData(e.target);
      var r2 = ZS.editDoc(own2, dp2[2], { name: fd2.get('name'), type: fd2.get('type') });
      if (r2.error) { document.getElementById('de-err').textContent = r2.error; return; }
      var refs2 = dp2[0] === 'client' ? { client: dp2[1] } : { opp: dp2[1] };
      var file2 = (document.getElementById('de-file') || {}).files;
      var finish = function () {
        G.log('doc_edit', r2.before.name + ' → ' + r2.doc.name +
              (r2.before.type !== r2.doc.type
                ? ', re-filed under ' + ZS.docLabel(dp2[0], r2.doc.type) : ''), refs2);
        G.save();
        var md = document.getElementById('modal'); if (md && md.open) md.close();
        G.toast('Saved.');
        G.render();
      };
      if (file2 && file2.length) {
        /* Replacing the file keeps the id, so nothing that points at this
           document goes stale just because somebody swapped a blurry photo. */
        G.takeDoc(file2[0], dp2[0], r2.doc.type, function (fresh) {
          r2.doc.data = fresh.data;
          r2.doc.size = fresh.size;
          r2.doc.mime = fresh.mime;
          r2.doc.too_big = fresh.too_big;
          r2.doc.when = ZS.today();
          finish();
        });
      } else finish();
      return;
    }
    if (e.target.id !== 'invform') return;
    e.preventDefault();
    if (!G.acc().invoices) return;
    var o = (D().opportunities || []).filter(function (x) { return x.id === e.target.dataset.oid; })[0];
    if (!o) return;
    var fd = new FormData(e.target);
    /* Nothing here is mandatory either. An invoice gets raised as a placeholder
       the moment the work is agreed and priced two days later, so it takes a
       blank amount and sits at zero until somebody fills it in. */
    var amt = Number(fd.get('amount')) || 0;
    ZS.addInvoice(D().invoices, { opp: o.id, client: o.client,
                                  scope: String(fd.get('scope') || '').trim(), amount: amt });
    G.log('invoice_add', amt ? 'Invoice raised — ' + ZS.money(amt)
                             : 'Invoice started, no amount yet', { client: o.client, opp: o.id });
    G.save();
    document.getElementById('modal').close();
    G.toast('Invoice raised.');
    G.render();
  };

  var prevChange = A.onChange;
  A.onChange = function (e) {
    if (prevChange) prevChange(e);
    var ps = e.target.closest ? e.target.closest('[data-procstage]') : null;
    if (ps) {
      var o = (D().opportunities || []).filter(function (x) { return x.id === ps.dataset.procstage; })[0];
      if (!o) return;
      if (!G.acc().clients) { G.render(); return; }
      var r = ZS.moveProc(o, ps.value);
      if (r.error) { G.toast(r.error, true); G.render(); return; }
      G.log('proc_stage', (G.clientById(o.client) || {}).name + ' — delivery moved to ' + ps.value,
            { client: o.client, opp: o.id });
      G.save();
      G.toast('Moved to ' + ps.value + '.');
      G.render();
      return;
    }
    var iv = e.target.closest ? e.target.closest('[data-invstate]') : null;
    if (iv) {
      if (!G.acc().invoices) { G.render(); return; }
      var inv = (D().invoices || []).filter(function (x) { return x.id === iv.dataset.invstate; })[0];
      if (inv) {
        inv.state = iv.value;
        if (iv.value === 'paid' && !inv.paid) inv.paid = ZS.today();
        if (iv.value !== 'paid') inv.paid = null;
        if (iv.value === 'sent' && !inv.sent) inv.sent = ZS.today();
        G.log('invoice_state', 'Invoice marked ' + iv.value + ' — ' + ZS.money(inv.amount),
              { client: inv.client, opp: inv.opp });
        G.save(); G.toast('Marked ' + iv.value + '.'); G.render();
      }
      return;
    }
    var dp = e.target.closest ? e.target.closest('[data-doc]') : null;
    if (dp) G.onDocPicked(dp);
  };

  /* ---------------- naming what you just uploaded ----------------

     ⚠️ EVERY UPLOAD IN THE COCKPIT COMES THROUGH HERE, which is the only reason
     this is one change and not eleven. Drop three files in and you are asked what
     each one is, before anything is filed.

     WHY IT IS WORTH A STEP. A phone calls a photograph IMG_4471.jpg and a laptop
     calls a download document(3).pdf. Three of those under one slot are three
     files nobody can tell apart without opening all three, and the moment that
     happens the folder stops being useful and somebody starts keeping the real
     copies on their desktop. Ten seconds now against that.

     It is a step, not a wall: the boxes are pre-filled with a tidied version of
     the filename, so Enter is a perfectly good answer. */

  var PICKED = null;    /* { files, kind, holder, type } waiting to be named */

  /* IMG_4471.jpg -> "IMG 4471". A tidied filename beats an empty box: an empty
     box is a decision, and a decision at upload time gets skipped. */
  function tidyName(n) {
    return String(n || '')
      .replace(/\.[a-z0-9]{1,5}$/i, '')       /* the extension is not the name */
      .replace(/[_+]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .slice(0, 80) || 'Untitled';
  }

  G.onDocPicked = function (input) {
    var spec = input.getAttribute('data-doc');
    if (!spec || !input.files || !input.files.length) return;
    var p = spec.split('|'), kind = p[0], holder = p[1], type = p[2];
    if (!G.acc().clients) return;
    var files = Array.prototype.slice.call(input.files);

    PICKED = { files: files, kind: kind, holder: holder, type: type };
    /* the input keeps its FileList; clearing it lets the same file be picked
       again after a cancel, which otherwise silently does nothing */
    try { input.value = ''; } catch (e) {}

    G.modal('Name ' + (files.length === 1 ? 'this file' : 'these ' + files.length + ' files'),
      'Filed under ' + ZS.docLabel(kind, type) + '. What each one is, in words you ' +
      'would search for. The names are filled in from the filenames, so you can just ' +
      'press Save.',
      '<form id="nameform">' +
      files.map(function (f, i) {
        return '<div class="f" style="margin-bottom:12px">' +
          '<label for="nm-' + i + '">' + esc(f.name) + ' &middot; ' +
          esc(G.fileSize(f.size)) + '</label>' +
          '<input id="nm-' + i + '" name="n' + i + '" value="' + esc(tidyName(f.name)) + '" ' +
          'autocomplete="off" maxlength="80"></div>';
      }).join('') +
      '<div style="display:flex;gap:10px;margin-top:14px">' +
      '<button class="btn" type="submit">Save ' +
        (files.length === 1 ? 'it' : 'them') + '</button>' +
      '<button class="btn alt" type="button" data-act="cancelUpload">Cancel</button></div></form>');
  };

  A.cancelUpload = function () {
    PICKED = null;
    var m = document.getElementById('modal'); if (m && m.open) m.close();
  };

  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'nameform') return;
    e.preventDefault();
    if (!PICKED) return;
    var names = PICKED.files.map(function (f, i) {
      var box = document.getElementById('nm-' + i);
      return (box && String(box.value || '').trim()) || tidyName(f.name);
    });
    var job = PICKED;
    PICKED = null;
    var m = document.getElementById('modal'); if (m && m.open) m.close();
    fileThem(job, names);
  });

  function fileThem(job, names) {
    var kind = job.kind, holder = job.holder, type = job.type;
    var files = job.files;
    var left = files.length;
    files.forEach(function (f, i) { G.takeDoc(f, kind, type, function (doc) {
      /* ⚠️ THE NAME THEY TYPED, NOT THE FILENAME. takeDoc fills in file.name by
         default, so this has to overwrite it or the whole step was theatre. */
      doc.name = names[i] || doc.name;
      if (kind === 'client') {
        var cl2 = G.clientById(holder);
        if (!cl2) return;
        cl2.docs = (cl2.docs || []).concat([doc]);
        G.log('doc_add', ZS.docLabel('client', type) + ': "' + doc.name + '" uploaded for ' +
              cl2.name, { client: cl2.id });
        G.save();
      } else {
        var o = (D().opportunities || []).filter(function (x) { return x.id === holder; })[0];
        if (!o) return;
        /* Before delivery there is no proc file, and starting one early would
           put an unsold deal on the delivery board. The engagement holds them. */
        if (o.proc) o.proc.docs.push(doc);
        else o.docs = (o.docs || []).concat([doc]);
        G.log('doc_add', ZS.docLabel('deal', type) + ': "' + doc.name + '" uploaded',
              { client: o.client, opp: o.id });
        G.save();
      }
      /* ---- and onto the server, where it can be shared and can follow you ----

         The browser copy stays: it is what makes the thumbnail appear instantly
         and what keeps the file readable offline. The server copy is what makes
         it survive this laptop and what a share link points at.

         This never blocks the upload. If the server refuses or is unreachable
         the document is already saved here, and the Share button then says
         plainly that there is nothing for anybody else to fetch. */
      /* ⚠️ THE CATCH HERE WAS EMPTY, and that one line produced three symptoms
         that looked like three different bugs: a file that could not be opened,
         a Share button that refused with a made-up reason, and an upload that
         reported success while the server had never heard of it. Whatever goes
         wrong is now written on the document and said out loud. */
      if (!window.API || !API.signedIn()) {
        doc.upload_error = 'not signed in to the server when it was uploaded';
      } else if (f.size > 25 * 1024 * 1024) {
        doc.upload_error = 'over the 25 MB limit';
        G.toast(doc.name + ' is over 25 MB, so it is recorded here and not stored.', true);
      } else {
        doc._file = f;                     /* for a retry, until the page reloads */
        sendUp(doc, kind, holder, function (err) {
          if (err) {
            G.toast(doc.name + ' did not reach the server: ' + err +
                    ' Press "Send it up" on the row to try again.', true);
          }
          G.render();
        });
      }

      /* ---- and if it is worth reading, read it ----

         A payment screenshot and a GST certificate both arrive as a photograph
         of something, and both contain exactly the figures somebody is about to
         retype. The model reads it; a person still approves what it found. */
      maybeRead(doc, kind, holder, type);

      left--;
      if (left > 0) return;                 /* render once, when they are all in */
      G.toast(files.length + ' file' + (files.length === 1 ? '' : 's') +
              ' added to ' + ZS.docLabel(kind, type) + '.');
      G.render();
    }); });
  }

  /* used by the naming modal's pre-fill, and worth having in one place */
  G.tidyDocName = tidyName;
})();
