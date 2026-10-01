/* Jarvis and the roster.

   Jarvis reads the whole cockpit, ranks what is going wrong and what is going
   well, dispatches the other five, and takes instructions in plain words.

   THE RULE THAT MATTERS MOST: Jarvis acts AS YOU, never above you. Every read
   is filtered by your scope and every write goes through the same guard the
   button would have. "Complete control" must not become a way for a contractor
   to delete an opportunity by asking nicely. Where you are refused, Jarvis is
   refused, and says whose rule stopped it.

   THE SECOND RULE: anything a client would see queues for approval, whatever
   mode the agent is in. That is a guard the setting cannot reach, and it is the
   reason an owner is willing to turn the layer on at all.

   What this is NOT: a language model. Jarvis understands a real grammar over
   your actual data — deterministic rules with a job title. In production the
   reading and the drafting become model calls returning these same shapes, and
   the dispatcher, the approval gate and the apply map below do not change. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }
  function me() { return G.me(); }
  function mode(id) { return ZS.agentMode(D(), id); }

  /* ---------------- what Jarvis is allowed to see ---------------- */

  function myOpps() {
    return (D().opportunities || []).filter(function (o) {
      return ZS.canOpen(o, me(), D().access);
    });
  }
  function myClients() {
    return (D().clients || []).filter(function (c) { return ZS.inScope(c, me(), D().access); });
  }
  function clientNamed(q) {
    var n = String(q || '').toLowerCase().trim();
    if (!n) return null;
    var list = myClients();
    return list.filter(function (c) { return c.name.toLowerCase() === n; })[0] ||
           list.filter(function (c) { return c.name.toLowerCase().indexOf(n) >= 0; })[0] ||
           list.filter(function (c) { return n.indexOf(c.name.toLowerCase()) >= 0; })[0] || null;
  }
  function oppsOf(c) { return myOpps().filter(function (o) { return o.client === c.id; }); }
  function staffNamed(q) {
    var n = String(q || '').toLowerCase().trim();
    return ZS.staffList().filter(function (u) {
      return u.name.toLowerCase().indexOf(n) >= 0 || u.login === n;
    })[0] || null;
  }

  /* ---------------- reading the state ---------------- */

  function stuck() {
    return myOpps().filter(function (o) {
      return o.blocked_on === 'client' && (ZS.isOpen(o) || ZS.isProcessing(o));
    });
  }
  function slipped() {
    return ZS.procDeals(myOpps()).filter(function (o) { return ZS.planSlipped(o).length; });
  }
  function unpitched() {
    return myOpps().filter(function (o) { return ZS.isOpen(o) && o.repo && !o.pitched; });
  }
  function overdueInvoices() {
    return (D().invoices || []).filter(function (i) {
      return ZS.invoiceOverdue(i) && myOpps().some(function (o) { return o.id === i.opp; });
    });
  }
  function quiet() {
    return myOpps().filter(ZS.isOpen).filter(function (o) {
      return !ZS.nextFollow(D().followups || [], o.id);
    });
  }
  function liveBuilds() {
    return myOpps().filter(function (o) { return o.demo; });
  }

  /* ---------------- recording a run ---------------- */

  function record(run, opts) {
    opts = opts || {};
    if (!run) return null;
    if (mode(run.agent) === 'off' && !opts.manual) return null;

    /* The invariant, asserted rather than assumed: a client-facing run without
       a draft is a bug, and shipping it would mean something reached a client
       with nothing for a human to read first. */
    if (run.clientFacing && !run.draft) {
      throw new Error('agent ' + run.agent + ' is client-facing but produced no draft');
    }
    var needsHuman = run.clientFacing || !!run.draft || mode(run.agent) !== 'auto';

    run.key = ZS.runKey(run);
    run.status = needsHuman ? 'pending' : 'auto';
    run.by = D().session;

    var row = { id: run.id, agent: run.agent, title: run.title, summary: run.summary,
                at: run.at, status: run.status, minutes: run.minutes,
                steps: run.steps, target: run.target, key: run.key, by: run.by };
    D().runs = D().runs || [];
    /* The proposals dedupe by key; the run log has to as well, or every sign-in
       stacks another identical row and the honest "hours saved" arithmetic — which
       sums over these rows — inflates itself just because somebody logged in twice.
       A re-run of the same conclusion REFRESHES its row; a new conclusion adds one. */
    var seen = D().runs.filter(function (r) {
      return r.key === run.key && r.status === 'pending';
    })[0];
    if (seen) {
      D().runs.splice(D().runs.indexOf(seen), 1);
      row.id = seen.id;                       /* the queue may already point at it */
      D().runs.unshift(row);
    } else {
      D().runs.unshift(row);
      if (D().runs.length > 250) D().runs.length = 250;
      G.log('agent_run', ZS.agentById(run.agent).name + ': ' + run.summary, refsOf(run));
    }
    if (!needsHuman) { G.save(); return run; }

    /* one open proposal per thing — a re-run refreshes it rather than stacking */
    D().proposals = D().proposals || [];
    var open = D().proposals.filter(function (p) {
      return p.key === run.key && p.status === 'pending';
    })[0];
    var prop = Object.assign(open || { id: 'p' + Date.now() + Math.floor(Math.random() * 1000) }, {
      runId: run.id, agent: run.agent, title: run.title, summary: run.summary,
      target: run.target, steps: run.steps, draft: run.draft, payload: run.payload,
      clientFacing: run.clientFacing, confidence: run.confidence, minutes: run.minutes,
      status: 'pending', at: run.at, owner: ownerOf(run)
    });
    if (!open) D().proposals.unshift(prop);
    G.save();
    redraft(prop, run);
    return prop;
  }

  /* ---------------- letting the model write the draft ----------------

     THE TEMPLATE IS WRITTEN FIRST AND ALWAYS. It goes in the queue immediately,
     so the feature works with no model, no key and no network, and a failed
     call costs you a better sentence rather than the whole proposal.

     The model then rewrites it, in place, and the run records that it did. What
     it is given is `run.brief` and nothing else: who it is to, what it is about,
     and the facts that specific agent chose to hand over. Not the fee, not the
     credentials, not the book. If it says nothing useful the template stands.

     Every draft, model-written or not, still queues for a human. That guard is
     in the dispatcher above and nothing here can reach it. */
  /* ONE AT A TIME, AND SLOWLY.

     Measured against the live API: the free tier allows FIVE requests a minute.
     A sweep that finds eight unsent builds fires eight drafts at once, five land
     and three quietly stay as templates — so the queue reads as though the model
     wrote some of them and forgot the rest, for no reason anybody can see.

     They go through a queue instead, one every thirteen seconds, which is inside
     the limit with room for a question you ask while it runs. Nothing waits on
     it: the templates are already in the queue and already approvable. */
  var DRAFT_Q = [], DRAFTING = false;
  var DRAFT_GAP = 13000;

  function redraft(prop, run) {
    if (!prop || !prop.draft || !run || !run.brief) return;
    if (!window.API || !API.signedIn()) return;
    /* a re-run refreshes a proposal rather than stacking one, so drop the
       earlier request for the same proposal instead of drafting it twice */
    DRAFT_Q = DRAFT_Q.filter(function (j) { return j.id !== prop.id; });
    DRAFT_Q.push({ id: prop.id, runId: prop.runId,
                   channel: prop.draft.channel || 'whatsapp', brief: run.brief });
    pumpDrafts();
  }

  function pumpDrafts() {
    if (DRAFTING || !DRAFT_Q.length) return;
    DRAFTING = true;
    var job = DRAFT_Q.shift();
    var after = function () {
      DRAFTING = false;
      if (DRAFT_Q.length) setTimeout(pumpDrafts, DRAFT_GAP);
    };
    API.askModel({ mode: 'draft', channel: job.channel,
                   to: job.brief.to, about: job.brief.about, note: job.brief.note })
      .then(function (r) {
        if (!r || !r.text) return;
        var live = (D().proposals || []).filter(function (p) { return p.id === job.id; })[0];
        if (!live || live.status !== 'pending') return;    /* decided while we waited */
        live.draft = Object.assign({}, live.draft, { text: r.text, by: 'model' });
        (D().runs || []).forEach(function (x) {
          if (x.id === job.runId) ZS.step(x, 'Who wrote this', 'A model drafted it. You still approve it.');
        });
        G.save();
        G.render();
      })
      .catch(function () { /* the template is already in the queue and stands */ })
      .then(after, after);
  }

  function refsOf(run) {
    var t = run.target || {};
    if (t.kind === 'opp') {
      var o = oppById(t.id);
      return o ? { client: o.client, opp: o.id } : {};
    }
    if (t.kind === 'client') return { client: t.id };
    return {};
  }
  function ownerOf(run) {
    var t = run.target || {};
    if (t.kind === 'opp') { var o = oppById(t.id); return o ? o.assigned_to : null; }
    return null;
  }
  function oppById(id) {
    return (D().opportunities || []).filter(function (o) { return o.id === id; })[0] || null;
  }

  /* ---------------- the roster ---------------- */

  function runAgent(id, arg, opts) {
    var fn = RUN[id];
    if (!fn) return null;
    return fn(arg, opts || {});
  }
  G.runAgent = runAgent;
  G.recordRun = record;

  var RUN = {};

  RUN.chaser = function (arg, opts) {
    var list = arg ? [arg] : stuck();
    var made = [];
    list.forEach(function (o) {
      var c = G.clientById(o.client);
      if (!c) return;
      var days = ZS.daysLeft(ZS.today(), o.blocked_since || o.updated) || 0;
      var key = ZS.runKey({ agent: 'chaser', target: { kind: 'opp', id: o.id }, payload: {} });
      if (!opts.manual && ZS.recentlyDecided(D(), key, 3)) return;

      var who = ZS.primaryContact(c);
      var run = ZS.newRun('chaser', 'Chase ' + c.name, { target: { kind: 'opp', id: o.id } });
      ZS.step(run, 'I looked at', stuck().length + ' engagement(s) waiting on a client');
      ZS.step(run, 'I picked this one', c.name + ' has been blocked for ' + Math.abs(days) + ' days');
      ZS.step(run, 'I would ask', who ? who.name + (who.designation ? ', ' + who.designation : '') : 'nobody — no contact recorded');
      ZS.step(run, 'A guard stopped me', 'This reaches a client, so I queue it whatever mode I am in');
      run.summary = 'I drafted a nudge — ' + c.name + ' has been blocked ' + Math.abs(days) + ' days';
      run.draft = { channel: 'whatsapp', text:
        'Hello ' + (who ? who.name.split(' ')[0] : 'there') + ', hope you are well.\n\n' +
        'We are holding on ' + (o.title || 'your build') + ' — we still need ' +
        needWord(o) + ' from your side before we can move on. ' +
        'It has been ' + Math.abs(days) + ' days.\n\nCould you send it across this week?' };
      run.payload = { oppId: o.id, days: Math.abs(days) };
      made.push(record(run, opts));
    });
    return made;
  };
  function needWord(o) {
    var miss = o.proc ? ZS.missingDocs(o.proc, ZS.PROC_NEEDS[o.proc.stage] || []) : [];
    if (miss.length) return ZS.docLabel('deal', miss[0]).toLowerCase();
    if (o.mou === 'sent') return 'the signed MOU';
    return 'what we asked for';
  }

  /* ---------------- Mark ----------------

     He finds and scores on the server; this is the half that writes. One
     proposal per prospect, each carrying the email, the WhatsApp message that is
     held back, and the finding the subject was built from.

     ⚠️ NO VERIFIED FINDING, NO DRAFT, AND THE GUARD IS A RETURN NOT A WARNING.
     `ZS.draftEmail` hands back null when there is nothing checkable to lead
     with, and this skips that prospect entirely. A cold email with a vague
     subject is worse than none: it spends the one chance you get with that
     business and teaches them we have nothing specific to say. It is also the
     line between a subject that works and one that costs $53,088. */
  RUN.mark = function (arg, opts) {
    var all = arg ? [arg] : (D().prospects || []);
    var made = [];
    var me = G.me();
    /* What he has been told to lead with. He reads it; he never writes it. */
    var book = ZS.playbookOf(D());

    all.forEach(function (p) {
      if (!p || p.stage === 'parked' || p.stage === 'sent' || p.stage === 'replied') return;
      var picks = ZS.worthPitching(p);
      if (!picks.length) return;                    /* nothing specific to say */

      var email = ZS.draftEmail(p, picks, me, book.lead);
      if (!email) return;                           /* nothing verified to lead with */

      /* ⚠️ A PLACE THE PLAYBOOK SAYS TO LEAVE ALONE IS LEFT ALONE. It got there
         because enough went out and nothing ever came back, and the whole value
         of learning something is not then ignoring it. */
      var where = (p.city || '') + (p.country ? ', ' + p.country : '');
      if (book.avoid.indexOf(where) >= 0) return;

      var key = ZS.runKey({ agent: 'mark', target: { kind: 'prospect', id: p.id }, payload: {} });
      if (!opts.manual && ZS.recentlyDecided(D(), key, 14)) return;

      var run = ZS.newRun('mark', 'Write to ' + ZS.shortName(p.name),
                          { target: { kind: 'prospect', id: p.id } });
      ZS.step(run, 'I looked at', p.name + ' in ' + (p.city || 'the list'));
      ZS.step(run, 'What I verified', email.finding.evidence);
      ZS.step(run, 'What I can sell them',
        picks.map(function (x) { return x.key + ' (' + x.score + '/5)'; }).join(', '));
      ZS.step(run, 'Who it goes to',
        p.contact_name ? p.contact_name + (p.email ? ' at ' + p.email : '')
                       : 'nobody named yet, so it opens with Hello');
      ZS.step(run, 'A guard stopped me', 'This reaches a stranger, so I queue it whatever my mode');

      run.summary = 'I drafted an email to ' + ZS.shortName(p.name) + ', leading with ' +
        email.finding.what.toLowerCase();
      run.brief = { to: p.contact_name || p.name,
                    about: 'what we found on their website and what we would do about it',
                    note: email.finding.evidence };
      run.draft = { channel: 'email', subject: email.subject, text: email.text };
      run.payload = {
        prospectId: p.id,
        findingId: email.finding.id,
        services: picks.map(function (x) { return x.key; }),
        email: { subject: email.subject, text: email.text },
        whatsapp: ZS.draftWhatsAppReply(p, picks, me, book.lead)
      };
      made.push(record(run, opts));
    });

    /* ---- and once there is enough to learn from, what he would change ----

       ⚠️ A PROPOSAL, NEVER AN EDIT. The playbook is the one thing in here that
       changes how Mark writes, so it is the one thing he is not allowed to
       touch. It also fires at most once a week: a playbook that moves every
       morning is not a playbook, it is noise with a filing system. */
    var pp = ZS.playbookProposal(D());
    /* ⚠️ `runKey` builds the key from the target and the discriminator and then
       overwrites whatever was set by hand, so the discriminator is how this run
       gets a key of its own. Without it, every playbook proposal collides with
       the keyless drafts. */
    var pkey = ZS.runKey({ agent: 'mark', target: null, payload: { discriminator: 'playbook' } });
    if (pp && !ZS.recentlyDecided(D(), pkey, 7)) {
      /* NOT client-facing: a playbook change reaches nobody outside, and a
         client-facing run with no draft is rejected by record() on purpose. */
      var lrun = ZS.newRun('mark', 'Change what I lead with',
                           { target: null, clientFacing: false });
      ZS.step(lrun, 'I looked at', ZS.outreachStats(D()).sent + ' message(s) that went out');
      ZS.step(lrun, 'What the outcomes say', pp.lesson.what);
      ZS.step(lrun, 'The evidence', pp.lesson.evidence);
      ZS.step(lrun, 'What I would change', pp.next.lead[0] !== ZS.playbookOf(D()).lead[0]
        ? 'Lead with ' + pp.next.lead[0] + ' first from now on'
        : 'Stop writing to ' + (pp.next.avoid[pp.next.avoid.length - 1] || 'that city'));
      ZS.step(lrun, 'A guard stopped me', 'This changes how I write, so I cannot apply it myself');
      lrun.summary = pp.lesson.what + ' ' + pp.lesson.evidence;
      lrun.payload = { playbook: pp.next, lesson: pp.lesson, discriminator: 'playbook' };
      made.push(record(lrun, opts));
    }
    return made;
  };

  RUN.closer = function (arg, opts) {
    var list = arg ? [arg] : unpitched();
    var made = [];
    list.forEach(function (o) {
      var c = G.clientById(o.client);
      if (!c) return;
      var key = ZS.runKey({ agent: 'closer', target: { kind: 'opp', id: o.id }, payload: {} });
      if (!opts.manual && ZS.recentlyDecided(D(), key, 3)) return;
      var f = (o.findings || []);
      var run = ZS.newRun('closer', 'Send ' + c.name + ' their build', { target: { kind: 'opp', id: o.id } });
      ZS.step(run, 'I looked at', 'every engagement with work finished');
      ZS.step(run, 'I picked this one', c.name + ' — built, tested, never sent');
      ZS.step(run, 'What I can lead with', f.length + ' finding(s) we can hand over free');
      ZS.step(run, 'A guard stopped me', 'This reaches a client, so I queue it');
      run.summary = 'I drafted the outreach — ' + c.name + ' is finished and unsent';
      run.brief = { to: (ZS.primaryContact(c) || {}).name || c.name,
                    about: 'a build of theirs we have finished and not yet sent',
                    note: f.length ? 'Free findings to lead with: ' + f.slice(0, 3).join('; ') : '' };
      run.draft = { channel: 'whatsapp', text:
        'Hello — before anything else, three things we found on your site that are ' +
        'costing you, free to fix:\n\n' +
        (f.length ? f.slice(0, 3).map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n')
                  : '1. (findings not recorded yet)') +
        '\n\nSeparately, we have built something on your own data. Two minutes to look at?' };
      run.payload = { oppId: o.id };
      made.push(record(run, opts));
    });
    return made;
  };

  /* ---------------- The Reconciler ----------------

     A payment proof lands. It reads it, matches it against what is owed on that
     engagement, and PROPOSES clearing one invoice. It never clears one itself,
     and that is not caution for its own sake: an invoice marked cleared because
     a model was fairly sure about a blurry screenshot is a debt nobody chases
     again. The queue is where a number gets a second pair of eyes.

     Dispatched by an upload rather than by the sweep, because there is nothing
     to reconcile until something arrives. */
  RUN.reconciler = function (arg, opts) {
    /* arg: { oppId, doc, read } — the document and what the model made of it */
    if (!arg || !arg.read) return null;
    var o = oppById(arg.oppId);
    if (!o) return null;
    var c = G.clientById(o.client);
    var read = arg.read;

    var run = ZS.newRun('reconciler', 'A payment on ' + ((c && c.name) || 'an engagement'),
      { target: { kind: 'opp', id: o.id } });

    ZS.step(run, 'What arrived', (arg.doc && arg.doc.name) || 'a payment proof');
    ZS.step(run, 'What it says moved',
      read.amount ? ZS.money(read.amount) + (read.currency && read.currency !== 'INR'
        ? ' (' + read.currency + ')' : '') : 'no amount I could read');
    if (read.paid_on) ZS.step(run, 'On', read.paid_on);
    if (read.reference) ZS.step(run, 'Reference', read.reference);
    ZS.step(run, 'How sure I am', read.confidence + ' — ' + (read.note || ''));

    var open = ZS.invoicesFor(D().invoices || [], o.id)
      .filter(function (i) { return i.state !== 'paid'; });

    if (!read.amount) {
      run.summary = 'A payment proof I could not read a figure from';
      ZS.step(run, 'So I propose', 'nothing. Read it yourself and set the invoice by hand.');
      run.payload = { oppId: o.id, invoiceId: null, amount: 0 };
      run.confidence = 0.2;
      return record(run, opts);
    }
    if (!open.length) {
      run.summary = ZS.money(read.amount) + ' arrived with no open invoice to put it against';
      ZS.step(run, 'So I propose', 'nothing. Raise the invoice first, then this matches.');
      run.payload = { oppId: o.id, invoiceId: null, amount: read.amount };
      run.confidence = 0.3;
      return record(run, opts);
    }

    /* Exact first. Then what is LEFT on an invoice, because a second payment
       against one already part-paid is the common case and matching it to the
       full amount would miss it. Then nearest, and say it is not exact. */
    var exact = open.filter(function (i) { return Math.round(i.amount) === Math.round(read.amount); })[0];
    var rest = exact ? null : open.filter(function (i) {
      return Math.round(ZS.invoiceLeft(i)) === Math.round(read.amount);
    })[0];
    var near = exact || rest || open.slice().sort(function (a, b) {
      return Math.abs(ZS.invoiceLeft(a) - read.amount) - Math.abs(ZS.invoiceLeft(b) - read.amount);
    })[0];

    var how = exact ? 'exactly the invoice'
            : rest ? 'exactly what was left on it after the advance'
            : 'the closest of ' + open.length + ', and it does not match';
    ZS.step(run, 'Against what is owed', open.map(function (i) {
      return (i.ref || ('Invoice ' + i.n)) + ' ' + ZS.money(ZS.invoiceLeft(i)) + ' left';
    }).join(' · '));
    ZS.step(run, 'Best match', (near.ref || ('Invoice ' + near.n)) + ' — ' + how);

    var clean = (exact || rest) && read.confidence === 'high';
    run.summary = clean
      ? ZS.money(read.amount) + ' matches ' + (near.ref || ('invoice ' + near.n)) + ' — clear it?'
      : ZS.money(read.amount) + ' arrived. ' + (exact || rest ? 'The figure matches ' : 'Nothing matches ') +
        (near.ref || ('invoice ' + near.n)) + ', but I am only ' + read.confidence + ' on the reading.';
    ZS.step(run, 'A guard stopped me',
      'Marking money received is not mine to do. You approve it, whatever I think.');

    run.payload = { oppId: o.id, invoiceId: near.id, amount: read.amount,
                    exact: !!(exact || rest), reference: read.reference || '',
                    paid_on: read.paid_on || '', confidence: read.confidence };
    run.confidence = clean ? 0.9 : 0.5;
    run.minutes = 8;
    return record(run, opts);
  };

  RUN.watchman = function (arg, opts) {
    var builds = liveBuilds();
    var run = ZS.newRun('watchman', 'Check the live builds', { target: null });
    ZS.step(run, 'I looked at', builds.length + ' deployed build(s)');
    ZS.step(run, 'What I can check from here', 'that each one has a URL on file and a repo behind it');
    ZS.step(run, 'What I cannot do yet', 'actually fetch them — a browser cannot reach another origin, ' +
      'so the real poll needs the five-minute sweep on a server');
    var noRepo = builds.filter(function (o) { return !o.repo; });
    var noChecks = builds.filter(function (o) { return !o.checks; });
    run.summary = 'I checked ' + builds.length + ' live build(s) · ' + noRepo.length + ' with no repo on file';
    run.payload = { total: builds.length, noRepo: noRepo.length, noChecks: noChecks.length,
                    urls: builds.map(function (o) { return o.demo; }) };
    run.confidence = 0.55;
    return record(run, opts);
  };

  RUN.collector = function (arg, opts) {
    var late = arg ? [arg] : overdueInvoices();
    var made = [];
    late.forEach(function (inv) {
      var c = G.clientById(inv.client);
      var o = oppById(inv.opp);
      if (!c) return;
      var key = ZS.runKey({ agent: 'collector', target: { kind: 'opp', id: inv.opp },
                            payload: { discriminator: inv.id } });
      if (!opts.manual && ZS.recentlyDecided(D(), key, 3)) return;
      var over = Math.abs(ZS.daysLeft(inv.due) || 0);
      var run = ZS.newRun('collector', 'Chase ' + ZS.money(inv.amount) + ' from ' + c.name,
        { target: { kind: 'opp', id: inv.opp },
          payload: { invoiceId: inv.id, discriminator: inv.id } });
      ZS.step(run, 'I looked at', (D().invoices || []).length + ' invoice(s)');
      ZS.step(run, 'I picked this one', 'invoice ' + inv.n + ' of ' + inv.of + ', due ' + inv.due +
        ' — ' + over + ' days over');
      ZS.step(run, 'For context', ZS.money(ZS.owedOn(D().invoices)) + ' is owed across every client');
      ZS.step(run, 'A guard stopped me', 'Client-facing, so it queues');
      run.summary = 'I drafted a reminder — ' + ZS.money(inv.amount) + ' from ' + c.name + ', ' + over + ' days over';
      run.draft = { channel: 'email', text:
        'Hello,\n\nA gentle reminder that invoice ' + inv.id + ' for ' +
        ZS.money(inv.amount) + ' (' + (inv.scope || 'phase ' + inv.n) + ') was due on ' +
        inv.due + ' and is now ' + over + ' days past.\n\n' +
        'If it has already gone out, please ignore this and send the reference.\n\nThank you.' };
      made.push(record(run, opts));
    });
    return made;
  };

  RUN.brief = function (arg, opts) {
    var s = slipped(), q = quiet(), st = stuck(), inv = overdueInvoices();
    var due = ZS.procDeals(myOpps()).filter(function (o) {
      var left = ZS.daysLeft(ZS.procDue(o));
      return left !== null && left >= 0 && left <= 7;
    });
    var run = ZS.newRun('brief', 'Morning brief', { target: null });
    ZS.step(run, 'I looked at', myOpps().length + ' engagement(s), ' +
      (D().invoices || []).length + ' invoice(s)');
    ZS.step(run, 'Behind plan, I found', s.length ? s.map(nameOf).join(', ') : 'none');
    ZS.step(run, 'Waiting on a client, I found', st.length ? st.map(nameOf).join(', ') : 'none');
    ZS.step(run, 'Gone quiet, I found', q.length ? q.map(nameOf).join(', ') : 'none');
    ZS.step(run, 'On the money', ZS.money(ZS.owedOn(D().invoices)) + ' owed, ' + inv.length + ' overdue');
    run.summary = s.length + ' behind · ' + st.length + ' waiting on a client · ' +
      q.length + ' gone quiet · ' + ZS.money(ZS.owedOn(D().invoices)) + ' owed';
    run.payload = { slipped: s.length, stuck: st.length, quiet: q.length,
                    overdue: inv.length, dueThisWeek: due.length };
    return record(run, opts);
  };
  function nameOf(o) { var c = G.clientById(o.client); return c ? c.name : o.id; }

  /* Jarvis reads everything the others read and proposes the work. */
  RUN.jarvis = function (arg, opts) {
    var s = slipped(), st = stuck(), up = unpitched(), inv = overdueInvoices(), q = quiet();
    var wins = myOpps().filter(function (o) { return o.outcome === 'won'; });
    var running = myOpps().filter(function (o) { return o.proc && o.proc.stage === 'Running'; });

    var run = ZS.newRun('jarvis', 'What needs doing', { target: null });
    ZS.step(run, 'I read', myOpps().length + ' engagement(s), ' + myClients().length +
      ' client(s), ' + (D().invoices || []).length + ' invoice(s), ' + liveBuilds().length + ' live build(s)');
    ZS.step(run, 'What I am allowed to see', ZS.acc(me(), D().access).scope === 'company'
      ? 'everything, because you can see the whole book'
      : 'only what is yours, because that is what your role can see');

    var wrong = [], right = [];
    if (inv.length) wrong.push(ZS.money(inv.reduce(function (a, i) { return a + i.amount; }, 0)) + ' overdue');
    if (st.length) wrong.push(st.length + ' waiting on a client');
    if (s.length) wrong.push(s.length + ' behind plan');
    if (up.length) wrong.push(up.length + ' built and never sent');
    if (q.length) wrong.push(q.length + ' with no next contact');
    if (running.length) right.push(running.length + ' live and running');
    if (wins.length) right.push(wins.length + ' signed');
    ZS.step(run, 'Going wrong, I see', wrong.length ? wrong.join(' · ') : 'nothing I can see');
    ZS.step(run, 'Going well, I see', right.length ? right.join(' · ') : 'nothing to report yet');

    /* what to hand to whom, in the order that money and trust are lost */
    var plan = [];
    if (up.length) plan.push({ agent: 'closer', why: up.length + ' finished build(s) earning nothing', n: up.length });
    if (inv.length) plan.push({ agent: 'collector', why: inv.length + ' invoice(s) past terms', n: inv.length });
    if (st.length) plan.push({ agent: 'chaser', why: st.length + ' blocked on the client', n: st.length });
    if (liveBuilds().length) plan.push({ agent: 'watchman', why: liveBuilds().length + ' live build(s) unwatched', n: 1 });
    plan.push({ agent: 'brief', why: 'the digest, last, so it counts what the others just queued', n: 1 });
    ZS.step(run, 'So I propose', plan.map(function (p) { return ZS.agentById(p.agent).name; }).join(', '));

    run.summary = wrong.length ? 'I found: ' + wrong.join(' · ') : 'I found nothing that needs chasing today';
    run.payload = { plan: plan, wrong: wrong, right: right };
    run.confidence = 0.9;
    return record(run, opts);
  };

  /* ---------------- the sweep ----------------
     There is no scheduler and no setInterval. It hangs off sign-in: the same
     pass the 9:00 schedule would run in production. The ORDER IS LOAD-BEARING —
     the brief runs last so it counts what the sweep just queued. Do not
     alphabetise this list. */
  /* ---------------- The Signal: the WhatsApp number's own watcher ----------------

     Most of what goes wrong on WhatsApp is not your copy. 131049 is a per-USER
     cap that Meta applies across every business that person hears from, and no
     amount of rewriting fixes it. Separating that from the failures that ARE
     ours is the whole job, because a report that says "42 failed" sends somebody
     off rewriting a template that was never the problem. */
  RUN.signal = function (arg, opts) {
    var run = ZS.newRun('signal', 'Watch the WhatsApp number', { target: null });
    var w = (D().whatsapp) || {};
    var sends = w.sends || [];
    var templates = w.templates || [];

    if (!sends.length) {
      ZS.step(run, 'I looked at', 'the WhatsApp number');
      ZS.step(run, 'Nothing to read yet', 'no sends on record' +
        (w.connected ? '' : ', and no account connected to make any'));
      run.summary = 'I have nothing to go on until a number is connected';
      return record(run, opts);
    }

    var st = ZS.waStats(sends);
    var fails = ZS.waFailures(sends);
    ZS.step(run, 'I looked at', st.sent + ' send(s): ' + st.delivered + ' delivered, ' +
      st.read + ' read, ' + st.failed + ' failed');

    var ours = fails.filter(function (f) { return f.info.fault === 'us'; });
    var theirs = fails.filter(function (f) { return f.info.fault !== 'us'; });
    var oursN = ours.reduce(function (a, f) { return a + f.n; }, 0);
    var theirsN = theirs.reduce(function (a, f) { return a + f.n; }, 0);

    if (fails.length) {
      ZS.step(run, 'Ours to fix', oursN
        ? oursN + ' — ' + ours.map(function (f) { return f.info.title.toLowerCase(); }).join(', ')
        : 'none of them');
      ZS.step(run, 'Not ours', theirsN
        ? theirsN + ' — ' + theirs.map(function (f) { return f.info.title.toLowerCase(); }).join(', ') +
          '. Rewriting a template will not change these.'
        : 'none');
      ZS.step(run, 'The biggest one', fails[0].n + ' x ' + fails[0].info.title + '. ' + fails[0].info.fix);
    }

    /* templates Meta has turned against */
    var sick = templates.filter(function (t) {
      return t.state === 'PAUSED' || t.state === 'DISABLED' || t.quality === 'LOW';
    });
    if (sick.length) {
      ZS.step(run, 'Templates in trouble', sick.map(function (t) {
        return t.name + ' (' + (ZS.WA_STATES[t.state] || {}).label + ')';
      }).join(', '));
    }
    var waiting = templates.filter(function (t) { return t.state === 'IN_REVIEW'; });
    if (waiting.length) {
      ZS.step(run, 'Waiting on Meta', waiting.map(function (t) { return t.name; }).join(', '));
    }

    /* how close today's sending is to the ceiling */
    var tier = ZS.waTier(w.tier);
    var todaySends = sends.filter(function (s) { return String(s.at).slice(0, 10) === ZS.today(); });
    var uniq = {};
    todaySends.forEach(function (s) { uniq[s.to] = 1; });
    var used = Object.keys(uniq).length;
    if (tier.cap !== Infinity) {
      var pct = Math.round(100 * used / tier.cap);
      ZS.step(run, 'Against the daily limit', used + ' of ' + ZS.fmt(tier.cap) + ' unique numbers (' +
        pct + '%)' + (pct >= 90 ? ' — nearly out, sends will start being refused'
                     : pct < 50 ? ' — under half, so the limit will not climb from here' : ''));
    }
    var health = ZS.WA_HEALTH[w.health] || {};
    if (w.health && w.health !== 'GREEN') {
      ZS.step(run, 'Quality rating', health.label + ' — ' + health.note);
    }

    var head = [];
    if (st.failedPct) head.push(st.failedPct + '% failing');
    if (oursN) head.push(oursN + ' ours to fix');
    if (sick.length) head.push(sick.length + ' template(s) in trouble');
    if (w.health === 'YELLOW' || w.health === 'RED') head.push('quality ' + health.label.toLowerCase());
    run.summary = head.length ? 'On WhatsApp I see: ' + head.join(' · ')
                              : 'The WhatsApp number looks healthy';
    run.payload = { sent: st.sent, failed: st.failed, ours: oursN, theirs: theirsN,
                    sick: sick.length, tier: tier.label, health: w.health };
    return record(run, opts);
  };

  function sweep() {
    /* ⚠️ MARK RUNS FIRST, and the order is load-bearing for the same reason the
       morning brief runs last: the brief counts what the sweep has queued, so
       anything Mark writes has to be in the queue before it looks. */
    runAgent('mark');
    runAgent('chaser'); runAgent('closer'); runAgent('collector'); runAgent('watchman');
    runAgent('signal');
    runAgent('jarvis');
    var d = D();
    if (!d.briefRunOn || d.briefRunOn !== ZS.today()) {
      runAgent('brief');
      d.briefRunOn = ZS.today();
    }
    G.save();
  }
  G.afterLogin = sweep;
  G.sweepAgents = sweep;
})();
