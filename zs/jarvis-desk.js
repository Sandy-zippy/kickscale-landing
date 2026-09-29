/* The Jarvis desk: the queue, the conversation, and the apply map.

   APPLY is the ONLY place in this layer that writes the store. Everything
   before it reads. And every write re-checks the permission at the moment of
   approval rather than trusting what was true when the run was made — a
   proposal can sit in a queue for two days while the role changes underneath it. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }
  function me() { return G.me(); }
  function oppById(id) {
    return (D().opportunities || []).filter(function (o) { return o.id === id; })[0] || null;
  }

  var TAB = 'talk';

  /* ================= the apply map ================= */

  var APPLY = {};

  APPLY.chaser = function (p, o) {
    var opp = oppById(p.payload.oppId);
    if (!opp) return { error: 'That engagement has gone.' };
    if (!G.acc().clients) return { error: 'Your role cannot touch client records.' };
    opp.updated = ZS.today();
    D().followups = D().followups || [];
    D().followups.push(ZS.newFollow({
      opp: opp.id, client: opp.client, owner: opp.assigned_to, by: D().session,
      due: ZS.addDays(ZS.today(), 3), method: 'WhatsApp',
      note: o.send ? 'Nudge sent: ' + (o.text || '').slice(0, 120) : 'Nudge approved, not sent yet',
      done: !!o.send, done_at: o.send ? ZS.today() : null
    }));
    return { ok: o.send ? 'Marked as sent and a follow-up booked in 3 days.'
                        : 'Approved. A follow-up is booked in 3 days.' };
  };

  APPLY.closer = function (p, o) {
    var opp = oppById(p.payload.oppId);
    if (!opp) return { error: 'That engagement has gone.' };
    if (!G.acc().clients) return { error: 'Your role cannot touch client records.' };
    opp.pitched = true;
    opp.updated = ZS.today();
    if (opp.stage === 'Enquiry' || opp.stage === 'Contacted') {
      var r = ZS.moveOpp(opp, 'Pitched', G.clientById(opp.client));
      if (r.error) return { error: r.error };
    }
    return { ok: o.send ? 'Marked as sent and moved to Pitched.' : 'Marked as pitched.' };
  };

  APPLY.collector = function (p, o) {
    var inv = (D().invoices || []).filter(function (i) { return i.id === p.payload.invoiceId; })[0];
    if (!inv) return { error: 'That invoice has gone.' };
    if (!G.acc().invoices) return { error: 'Your role cannot touch invoices.' };
    /* re-check now: it may have been paid while this sat in the queue */
    if (inv.state === 'paid') return { error: 'It was paid on ' + inv.paid + '. Nothing to chase.' };
    return { ok: o.send ? 'Reminder marked as sent.' : 'Approved, not sent.' };
  };

  /* Approving what The Reconciler read. The money is marked received HERE, by a
     person, which is the whole point: everything above this line is a reading. */
  APPLY.reconciler = function (p) {
    if (!G.acc().invoices) return { error: 'Your role cannot touch invoices.' };
    var pay = p.payload || {};
    if (!pay.invoiceId) {
      return { ok: 'Noted. Nothing was matched, so nothing changed.' };
    }
    var inv = (D().invoices || []).filter(function (x) { return x.id === pay.invoiceId; })[0];
    if (!inv) return { error: 'That invoice has gone.' };
    /* re-check now: it may have been settled while this sat in the queue */
    if (inv.state === 'paid') return { error: 'It was already cleared on ' + (inv.paid || 'an earlier day') + '.' };

    inv.state = 'paid';
    inv.paid = pay.paid_on || ZS.today();
    /* keep what was read and what was decided, so a figure can be argued with
       later rather than simply believed */
    inv.proof = { amount: pay.amount, reference: pay.reference || '',
                  confidence: pay.confidence || 'low', exact: !!pay.exact,
                  by: D().session, at: ZS.today(),
                  note: (pay.exact ? 'Matched exactly' : 'Approved though the figure did not match') +
                        ', read at ' + (pay.confidence || 'low') + ' confidence' };
    G.log('invoice_state', (inv.ref || 'An invoice') + ' cleared \u2014 ' +
          ZS.money(pay.amount) + (pay.reference ? ' ref ' + pay.reference : ''),
          { client: inv.client, opp: inv.opp });
    return { ok: (inv.ref || 'The invoice') + ' is cleared.' };
  };

  APPLY.watchman = function () { return { ok: 'Noted.' }; };
  APPLY.brief = function () { return { ok: 'Noted.' }; };

  /* Jarvis's own proposal is a plan: approving it dispatches the others. */
  APPLY.jarvis = function (p) {
    var ran = [];
    (p.payload.plan || []).forEach(function (row) {
      if (row.agent === 'jarvis') return;
      var out = G.runAgent(row.agent, null, { manual: true });
      var n = Array.isArray(out) ? out.length : (out ? 1 : 0);
      if (n) ran.push(n + ' × ' + ZS.agentById(row.agent).name);
    });
    return { ok: ran.length ? 'Dispatched: ' + ran.join(', ') + '. They are in the queue below.'
                            : 'Nothing for them to do right now.' };
  };

  /* ================= approving ================= */

  function decide(id, verdict, opts) {
    opts = opts || {};
    var p = (D().proposals || []).filter(function (x) { return x.id === id; })[0];
    if (!p || p.status !== 'pending') return;

    if (verdict === 'reject') {
      p.status = 'rejected'; p.decided = ZS.today();
      markRun(p.runId, 'rejected');
      G.log('agent_run', ZS.agentById(p.agent).name + ' rejected: ' + p.summary);
      G.save();
      G.toast('Rejected. It will not come back for a few days.');
      G.render();
      return;
    }

    var fn = APPLY[p.agent] || function () { return { ok: 'Noted.' }; };
    var res = fn(p, { send: !!opts.send, text: opts.text || (p.draft && p.draft.text) || '' });
    if (res.error) { G.toast(res.error, true); return; }

    p.status = 'approved'; p.decided = ZS.today(); p.sent = !!opts.send;
    markRun(p.runId, 'approved');
    G.log('agent_run', ZS.agentById(p.agent).name + ' approved: ' + p.summary, refsOf(p));
    G.save();
    G.toast(res.ok);
    G.render();
  }
  function markRun(runId, status) {
    (D().runs || []).forEach(function (r) { if (r.id === runId) r.status = status; });
  }
  function refsOf(p) {
    var t = p.target || {};
    if (t.kind === 'opp') { var o = oppById(t.id); return o ? { client: o.client, opp: o.id } : {}; }
    return {};
  }

  /* ================= talking to Jarvis =================

     A real grammar over the real data, not a chat illusion. Each intent names
     what it matched, so when it gets you wrong you can see why. */

  var INTENTS = [
    /* ⚠️ Word boundaries, always, and the specific intents first. Without \b
       the word "temp-LATE" matched the "late" intent and Jarvis cheerfully
       answered a question nobody had asked. */
    /* ⚠️ ANCHORED AT BOTH ENDS. This was /^help\b/, so "help me add a new
       opportunity" — a perfectly clear instruction — got the whole command list
       instead. A word at the START of a sentence is not the subject of it. */
    { id: 'help',    re: /^(?:help|what can you do|what do you do|commands?)\s*[?.!]*$/i },
    { id: 'template',re: /\btemplates?\b/i },
    /* ⚠️ ORDER. 'show' matches "open <anything>", so both of these have to be
       tested before it or "open the board" opens a client called "the board".
       'goto' names the screens explicitly for the same reason: anything not on
       that list is a client, and falls through to 'show'. */
    { id: 'goto',    re: /\b(?:go to|open|take me to|show me)\s+(?:the\s+)?(overview|home|sales board|sales|board|pipeline|delivery|clients|inbox|campaigns|automations|reports|activity|targets|sheet|team|settings|queue|what we sell|products)\b/i },
    { id: 'client',  re: /\b(?:add|create|new)\s+(?:a\s+)?(?:new\s+)?client\s+(?:called\s+|named\s+)?(.+)$/i },
    /* The client is OPTIONAL. "help me add a new opportunity" is a complete
       thought, and the answer to it is the screen that asks which client. */
    { id: 'oppnew',  re: /\b(?:start|open|create|add|raise)\s+(?:an?\s+)?(?:new\s+)?(?:engagement|opportunity|deal|build)(?:\s+(?:for|with)\s+(.+?))?(?:\s+(?:on|as)\s+(.+))?$/i },
    /* Both ways round, because both are what people say. "set the fee on EGO
       Premium to 120000" parsed as a client called "the fee on EGO" with a
       field called "Premium" until this one was put in front of it. */
    { id: 'seton',   re: /\bset\s+(?:the\s+)?(\w+)\s+(?:on|for|of)\s+(.+?)\s+to\s+(.+)$/i },
    { id: 'set',     re: /\bset\s+(.+?)(?:'s|\u2019s)?\s+(\w+)\s+to\s+(.+)$/i },
    { id: 'move',    re: /\bmove\s+(.+?)\s+to\s+(.+)$/i },
    { id: 'assign',  re: /\bassign\s+(.+?)\s+to\s+(.+)$/i },
    { id: 'invoice', re: /\b(raise|create)\s+(an?\s+)?invoice\s+(for|to)\s+(.+?)(?:\s+(?:for|of)\s+([\d,]+))?$/i },
    { id: 'require', re: /\b(add a requirement|requirement)\s+(?:to|for)\s+(.+?)[:,]\s*(.+)$/i },
    { id: 'meeting', re: /\b(book|schedule)\s+(?:a\s+)?(\w+)?\s*meeting\s+(?:with\s+)?(.+?)(?:\s+on\s+(\S+))?$/i },
    { id: 'message', re: /\b(message|whatsapp|write to|draft|chase|remind)\s+(.+)$/i },
    { id: 'run',     re: /\b(run|dispatch)\s+(the\s+)?(\w+)/i },
    { id: 'money',   re: /\b(owed|owes?|money|unpaid|overdue|outstanding)\b/i },
    /* ⚠️ \b is NOT enough here: a hyphen counts as a word boundary, so \blate\b
       happily matched "temp-LATE". It only looked fixed because `template` is
       tested first, and "temp-LATE" contains no "template". A word on its own
       means whitespace or punctuation on both sides — never a hyphen. */
    { id: 'late',    re: /(^|[\s,.;:!?])(behind|slipped|overrun|late)([\s,.;:!?]|$)/i },
    { id: 'quiet',   re: /\b(quiet|gone cold|not heard)\b|\bno follow/i },
    { id: 'unsent',  re: /\b(unsent|unpitched)\b|\bnever sent\b|\bnot pitched\b/i },
    { id: 'brief',   re: /\b(stuck|brief|summary|today|status)\b|what.s (up|going on)/i },
    { id: 'show',    re: /\b(show|open|find|who is|tell me about)\s+(.+)$/i }
  ];


  /* Spoken English is not typed English.

     Every pattern above was written for something somebody types: "what is
     owed". Dictated, the same question arrives as "Um, Jarvis, can you tell me
     what is owed, please?" — and matched nothing, so the answer was "I did not
     understand that" to a question that was perfectly clear. Rather than loosen
     sixteen regexes and lose the word boundaries that stopped "temp-LATE"
     matching "late", the sentence is tidied ONCE before any of them see it.

     What is said is still kept verbatim on the turn, because the transcript is
     the record of what you actually asked. */
  var SPOKEN_NOISE = [
    /^\s*(?:um+|uh+|er+|hmm+|okay|ok|so|well|right|listen|hey|hi|hello)\b[\s,]*/gi,
    /^\s*jarvis\b[\s,]*/i,
    /\b(?:can|could|would|will)\s+you\s+(?:please\s+)?/gi,
    /\b(?:please|kindly|for\s+me)\b/gi,
    /\b(?:i\s+(?:want|need)\s+(?:you\s+)?to|i\s+would\s+like\s+(?:you\s+)?to|let\s+me\s+know)\b\s*/gi,
    /\b(?:just|actually|basically|maybe|sort\s+of|kind\s+of)\b\s*/gi,
    /\b(?:tell\s+me|show\s+me)\s+(?=what\b|which\b|who\b|how\s+much\b)/gi
  ];

  function heard(text) {
    var q = String(text || '');
    SPOKEN_NOISE.forEach(function (re) { q = q.replace(re, ' '); });
    return q
      .replace(/[?!.]+\s*$/, '')        /* dictation punctuates; the patterns do not */
      .replace(/\bwhat's\b/gi, 'what is')
      .replace(/\bwho's\b/gi, 'who is')
      .replace(/\bwhats\b/gi, 'what is')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  G.jarvisHeard = heard;

  function ask(text) {
    var raw = String(text || '').trim();
    if (!raw) return null;
    var q = heard(raw) || raw;
    var turn = { at: new Date().toISOString(), you: raw, by: D().session };
    if (q !== raw) turn.heard = q;      /* show what it acted on, if it differs */

    /* ⚠️ BOTH THE TIDIED SENTENCE AND THE ONE YOU ACTUALLY SAID.

       The tidier strips "can you", which is right for "can you tell me what is
       owed" and catastrophic for "what can you do" — the single most obvious
       thing to ask him became "what do" and matched nothing at all. Rather than
       special-casing that phrase, try the tidied version first, because that is
       what it is for, and then the raw one. A sentence the cleaner damaged is
       still a sentence somebody said. */
    var tries = q === raw ? [q] : [q, raw];
    for (var t = 0; t < tries.length; t++) {
      for (var i = 0; i < INTENTS.length; i++) {
        var m = tries[t].match(INTENTS[i].re);
        if (!m) continue;
        turn.intent = INTENTS[i].id;
        var out = HANDLE[INTENTS[i].id](m, tries[t]);
        turn.jarvis = out.say;
        turn.matched = INTENTS[i].id;
        turn.actions = out.actions || [];
        turn.rows = out.rows || null;
        return turn;
      }
    }
    turn.intent = null;
    turn.jarvis = MISSED;
    return turn;
  }
  G.jarvisAsk = ask;

  var MISSED = 'I did not catch what you wanted there. I work on a fixed set of ' +
    'shapes, so I need the shape of the question more than the words. Say ' +
    '<b>help</b> and I will list exactly what I know how to do.';

  /* ================= the fall-through =================

     THE GRAMMAR STAYS THE FAST PATH. "what is owed" is arithmetic over your own
     invoices: instant, free, and right by construction. Nothing about that
     should cost a call to Google, and nothing about it should be left to a model
     that can only make it plausible rather than correct.

     The model gets the long tail, and one job in it: rewrite what you said into
     a sentence this grammar already knows. "can you bump EGO along to pitched"
     becomes "move EGO Premium to Pitched", which then runs through the very same
     handler, the very same permission guard and the very same approval gate.

     What it is given: your sentence, and the names you can already see. Not the
     book, not a fee, not a credential. The rewrite is shown on the turn, so when
     it reads you wrong you can see precisely where. */

  function vocab() {
    var d = D();
    return {
      clients: (d.clients || []).filter(function (c) { return ZS.inScope(c, me(), d.access); })
        .map(function (c) { return c.name; }),
      staff: ZS.staffList().map(function (u) { return u.name; }),
      stages: ZS.OPP_STAGES.slice(),
      agents: (ZS.AGENTS || []).map(function (a) { return a.name; })
    };
  }

  /* The handbook, answered locally. Free, instant, and the only thing available
     when there is no server. It only answers when one section is clearly ahead
     of the rest, because a confident answer from the wrong section is worse
     than saying nothing. */
  function fromHandbook(q) {
    if (!window.HANDBOOK) return null;
    var s2 = HANDBOOK.find(q);
    if (!s2) return null;
    return { say: '<b>' + esc(s2.title) + '</b><br>' +
      esc(s2.text).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>') +
      '<br><br><span class="hint">Straight out of the handbook, not written by a model.</span>',
      actions: HANDBOOK.actionsFor(s2.id) };
  }

  /* WHAT IS ACTUALLY TRUE RIGHT NOW, alongside what is true in general.

     "Where do I write a WhatsApp template" is a handbook question. "Do I have
     any" is a question about this book. Sending a handful of COUNTS with the
     question lets one answer do both, and a count is not data: no name, no
     number, no figure about a client leaves with it. */
  function snapshot() {
    var d = D();
    var mine = (d.clients || []).filter(function (x) { return ZS.inScope(x, me(), d.access); });
    var opps = myOpps();
    var w = d.whatsapp || {};
    return [
      'clients on the books: ' + mine.length,
      'open engagements: ' + opps.filter(ZS.isOpen).length,
      'in delivery: ' + ZS.procDeals(opps).length,
      'WhatsApp templates written: ' + ((w.templates || []).length),
      'WhatsApp connected: ' + (w.connected ? 'yes' : 'no'),
      'automations: ' + (d.automations || []).length +
        ' (' + (d.automations || []).filter(function (a) { return a.on; }).length + ' switched on)',
      'campaigns added: ' + (d.campaigns || []).length,
      'people on the team: ' + (d.staff || []).length,
      'things waiting on you in the queue: ' +
        (d.proposals || []).filter(function (p) { return p.status === 'pending'; }).length,
      'lines we sell: ' + ZS.PRODUCTS.map(function (p) { return p.name; }).join(', ')
    ].join('\n');
  }

  /* Does this read like a question about how things work, rather than an
     instruction? Only those are worth trying the handbook on first: "bump EGO
     along to pitched" must never be answered with a page about the pipeline. */
  var QUESTIONISH = /^(what|where|how|why|who|which|when|explain|tell me|is |are |can i|do we|does )/i;

  function askAsync(text) {
    var turn = ask(text);
    if (!turn) return Promise.resolve(null);
    if (turn.intent) return Promise.resolve(turn);          /* the grammar had it */

    var q = turn.heard || turn.you;

    /* ⚠️ THE HANDBOOK BEFORE THE MODEL, and it is not an optimisation.

       The free allowance is TWENTY REQUESTS A DAY, measured rather than assumed.
       A cockpit where the twenty-first question of the day is refused is a
       cockpit somebody stops asking. Anything the handbook clearly answers is
       answered from the handbook: free, instant, offline, and word for word what
       we wrote rather than a paraphrase of it.

       Only a question the handbook cannot place goes to the model, which is
       exactly the long tail it is there for. */
    if (QUESTIONISH.test(q)) {
      var first = fromHandbook(q);
      if (first) {
        turn.jarvis = first.say;
        turn.actions = first.actions || [];
        turn.matched = 'handbook';
        turn.intent = 'handbook';
        return Promise.resolve(turn);
      }
    }

    if (!window.API || !API.signedIn()) {
      var local = fromHandbook(q);
      if (local) {
        turn.jarvis = local.say;
        turn.actions = local.actions || [];
        turn.matched = 'handbook';
        turn.intent = 'handbook';
      }
      return Promise.resolve(turn);
    }

    turn.thinking = true;
    return API.askModel({ mode: 'route', question: turn.heard || turn.you, clients: vocab().clients,
                          staff: vocab().staff, stages: vocab().stages, agents: vocab().agents,
                          /* WHAT ZIPPYSCALE IS, so a question about us gets an answer
                             instead of "I did not catch that". It holds our prices and
                             how we pitch, and no client data whatsoever. */
                          handbook: window.HANDBOOK ? HANDBOOK.text() : '',
                          sections: window.HANDBOOK ? HANDBOOK.index() : '',
                          /* counts only, so an answer can be about today */
                          state: snapshot() })
      .then(function (r) {
        if (r && r.answer && !r.sentence) {
          turn.jarvis = esc(r.answer).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>') +
            '<br><br><span class="hint">Answered from the ZippyScale handbook. ' +
            'Anything about a client, a fee or a deal is worked out from your own records instead.</span>';
          turn.matched = 'handbook';
          turn.intent = 'handbook';
          turn.viaModel = true;
          /* THE BUTTONS COME FROM THE SECTION IT USED, not from the model. It
             names which section it answered from; we look the screens up here.
             A model inventing its own links would invent routes that do not
             exist, which is how you get a button that goes nowhere. */
          turn.actions = (window.HANDBOOK && r.section)
            ? HANDBOOK.actionsFor(r.section) : [];
          return turn;
        }
        if (!r || !r.sentence) {
          var fb = fromHandbook(turn.heard || turn.you);
          if (fb) {
            turn.jarvis = fb.say;
            turn.matched = 'handbook';
            turn.intent = 'handbook';
            return turn;
          }
          turn.jarvis = MISSED + (r && r.why
            ? '<br><span class="hint">I looked again and still could not: ' + esc(r.why) + '</span>' : '');
          return turn;
        }
        var second = ask(r.sentence);
        if (!second || !second.intent) {
          /* The rewrite missed too. Say so rather than dressing it up: a wrong
             rewrite presented as an answer is the worst outcome of all. */
          turn.jarvis = MISSED + '<br><span class="hint">I read it as &ldquo;' +
            esc(r.sentence) + '&rdquo; and that is not a shape I know either.</span>';
          return turn;
        }
        second.you = turn.you;             /* the record is what you actually said */
        second.heard = r.sentence;
        second.viaModel = true;
        second.why = r.why || '';
        return second;
      })
      .catch(function (e) {
        /* the model is down, busy or out of its five a minute: the handbook is
           still here, so answer from it rather than from nothing */
        var fb2 = fromHandbook(turn.heard || turn.you);
        if (fb2) { turn.jarvis = fb2.say; turn.matched = 'handbook'; turn.intent = 'handbook'; return turn; }
        turn.jarvis = MISSED + '<br><span class="hint">I tried the model too and it said: ' +
          esc(e.message || 'nothing') + '</span>';
        return turn;
      });
  }
  G.jarvisAskAsync = askAsync;

  function myOpps() {
    return (D().opportunities || []).filter(function (o) { return ZS.canOpen(o, me(), D().access); });
  }
  function clientNamed(q) {
    var n = String(q || '').toLowerCase().trim().replace(/[.?!]$/, '');
    var list = (D().clients || []).filter(function (c) { return ZS.inScope(c, me(), D().access); });
    return list.filter(function (c) { return c.name.toLowerCase() === n; })[0] ||
           list.filter(function (c) { return c.name.toLowerCase().indexOf(n) >= 0; })[0] ||
           list.filter(function (c) { return n.indexOf(c.name.toLowerCase()) >= 0; })[0] || null;
  }

  var HANDLE = {};

  HANDLE.help = function () {
    return { say: 'I read the whole cockpit and act <b>as you</b> — where your role is ' +
      'refused, so am I. Things I understand:<br><br>' +
      ['<u>Reading</u>',
       '<b>what is stuck</b> · <b>what is owed</b> · <b>what is behind</b> · <b>who has gone quiet</b> · <b>what is unsent</b>',
       '<b>show EGO Premium</b> — anything on a client',
       '<b>open the sales board</b> — or clients, delivery, reports, targets, settings',
       '',
       '<u>Making things</u>',
       '<b>add a client called Ingens Auto Arena</b>',
       '<b>start an engagement for Ingens on AI Automations</b>',
       '<b>raise an invoice for EGO Premium for 120000</b>',
       '<b>book a review meeting with EGO on 2026-10-10</b>',
       '<b>add a requirement to EGO: they want WhatsApp</b>',
       '',
       '<u>Changing things</u>',
       '<b>move EGO Premium to Pitched</b>',
       '<b>assign EGO Premium to Bhargav</b>',
       '<b>set the fee on EGO Premium to 120000</b>',
       '<b>set Ingens sector to pre-owned cars</b> — also site, instagram, email, ' +
         'mobile, city, type, source, gst, scope, repo, demo, hosting, domain, stack, expected',
       '',
       '<u>Sending, which I never do on my own</u>',
       '<b>message EGO about the pending MOU</b> — I draft it, you approve it',
       '<b>run the collector</b> — dispatch any of the roster',
       '',
       '<u>Understanding what we do</u>',
       'Ask me anything about ZippyScale itself and I answer from our handbook: ' +
         '<b>what do we sell</b> · <b>what is an Agentic Cockpit</b> · <b>what does AC-001 mean</b> · ' +
         '<b>how does a deal move</b> · <b>what can a Builder see</b> · <b>how do we pitch</b>',
       'Useful for somebody new. Nothing about a client, a fee or a deal is ever ' +
         'answered that way: those are worked out from your own records.',
       '',
       'I cannot delete anything, and I never will. That is the owner\'s, on the record itself.'
      ].map(function (l) { return l ? (l.indexOf('<u>') === 0 ? l : '· ' + l) : ''; }).join('<br>'),
      /* even the list of what he can do ends somewhere to go */
      actions: [['The sales board', 'goto|#/floor'],
                ['Clients', 'goto|#/clients'],
                ['What is waiting on me', 'jarvisTab|queue']] };
  };

  HANDLE.brief = function () {
    var r = G.runAgent('jarvis', null, { manual: true });
    return { say: r ? 'Read everything. <b>' + esc(r.summary) + '</b><br><br>' +
      'I have put my plan in the queue — approve it and I will dispatch the others.'
      : 'Nothing to report.', actions: [['See the queue', 'jarvisTab|queue']] };
  };

  HANDLE.money = function () {
    var owed = ZS.owedOn(D().invoices);
    var late = (D().invoices || []).filter(function (i) { return ZS.invoiceOverdue(i); });
    var rows = late.map(function (i) {
      var c = G.clientById(i.client);
      return [(c ? c.name : '—'), ZS.money(i.amount), i.due,
              Math.abs(ZS.daysLeft(i.due) || 0) + ' days over'];
    });
    return { say: '<b>' + ZS.money(owed) + '</b> outstanding across every client. ' +
      (late.length ? late.length + ' past terms:' : 'Nothing is past its terms.'),
      rows: rows.length ? { head: ['Client', 'Amount', 'Due', 'Late by'], body: rows } : null,
      actions: (late.length ? [['Draft the reminders', 'jarvisRun|collector']] : [])
        .concat([['Open the money on Reports', 'goto|#/reports'],
                 ['The sales board', 'goto|#/floor']]) };
  };

  HANDLE.late = function () {
    var s = ZS.procDeals(myOpps()).filter(function (o) { return ZS.planSlipped(o).length; });
    if (!s.length) {
      return { say: 'Nothing is behind its plan. A build is behind when a milestone date ' +
        'passes and the milestone is not done, so this stays empty until one does.',
        actions: [['The delivery board', 'goto|#/processing']] };
    }
    return { say: s.length + ' behind plan. A milestone date has passed with the milestone ' +
      'not done, which is what puts it here:',
      actions: [['The delivery board', 'goto|#/processing'],
                ['Set up a rule for this', 'goto|#/automation/new']],
      rows: { head: ['Client', 'Stage', 'Milestone', 'Late by'],
        body: s.map(function (o) {
          var w = ZS.planSlipped(o).sort(function (a, b) { return b.lateBy - a.lateBy; })[0];
          var c = G.clientById(o.client);
          return [(c ? c.name : '—'), o.proc.stage, w.stage, w.lateBy + ' days'];
        }) } };
  };

  HANDLE.quiet = function () {
    var q = myOpps().filter(ZS.isOpen).filter(function (o) {
      return !ZS.nextFollow(D().followups || [], o.id);
    });
    return { say: q.length
        ? q.length + ' open with no next contact booked. An open deal with nothing in the diary ' +
          'is the one that goes quiet, so this is the list worth clearing first:'
        : 'Everyone has a next contact booked, which is the state you want.',
      actions: (q.length ? [['Draft the nudges', 'jarvisRun|chaser']] : [])
        .concat([['The sales board', 'goto|#/floor']]),
      rows: q.length ? { head: ['Client', 'Stage', 'Last moved'],
        body: q.map(function (o) {
          var c = G.clientById(o.client);
          return [(c ? c.name : '—'), o.stage, o.updated];
        }) } : null };
  };

  HANDLE.unsent = function () {
    var u = myOpps().filter(function (o) { return ZS.isOpen(o) && o.repo && !o.pitched; });
    return { say: u.length ? u.length + ' finished and never sent — the most expensive state there is:' : 'Nothing is sitting finished and unsent.',
      rows: u.length ? { head: ['Client', 'Stage', 'Built at'],
        body: u.map(function (o) { var c = G.clientById(o.client); return [(c ? c.name : '—'), o.stage, o.repo || '—']; }) } : null,
      actions: (u.length ? [['Draft the outreach', 'jarvisRun|closer']] : [])
        .concat([['The sales board', 'goto|#/floor']]) };
  };

  HANDLE.show = function (m) {
    var c = clientNamed(m[2]);
    if (!c) return { say: 'I cannot find a client called “' + esc(m[2]) + '” in what you can see.' };
    var opps = myOpps().filter(function (o) { return o.client === c.id; });
    var owed = (D().invoices || []).filter(function (i) { return i.client === c.id; })
      .reduce(function (a, i) { return a + (i.state !== 'paid' && i.state !== 'draft' ? i.amount : 0); }, 0);
    return { say: '<b>' + esc(c.name) + '</b> — ' + esc(ZS.CLIENT_TYPES[c.type] || 'Lead') +
      (c.sector ? ' · ' + esc(c.sector) : '') + '<br>' +
      ZS.contactsOf(c).length + ' contact(s) · ' + opps.length + ' engagement(s) · ' +
      (owed ? ZS.money(owed) + ' outstanding' : 'nothing outstanding'),
      rows: opps.length ? { head: ['Opportunity', 'Where', 'Fee'],
        body: opps.map(function (o) {
          return [o.title || '—', o.proc ? o.proc.stage : o.stage,
                  G.acc().cost ? ZS.money(ZS.oppValue(o)) : '₹ ••••']; }) } : null,
      actions: [['Open the client', 'openClient|' + c.id]] };
  };

  /* ---------------- the things he could not do until now ----------------

     Adding a client, opening an engagement, setting a field and opening a
     screen. Every one goes through the same primitive the button goes through,
     and asks the same capability. Where your role is refused, so is he.

     Deleting is NOT here, and will not be: it is owner-only and it is
     irreversible, and a sentence you half-said is the worst possible way to
     reach it. */

  HANDLE.goto = function (m) {
    var where = String(m[1] || '').toLowerCase();
    var TO = {
      'overview': '#/home', 'home': '#/home',
      'sales board': '#/floor', 'sales': '#/floor', 'board': '#/floor', 'pipeline': '#/floor',
      'delivery': '#/processing', 'clients': '#/clients', 'inbox': '#/inbox',
      'campaigns': '#/campaigns', 'automations': '#/automations', 'reports': '#/reports',
      'activity': '#/activity', 'targets': '#/targets', 'sheet': '#/sheet', 'team': '#/team',
      'settings': '#/settings/access', 'queue': '#/jarvis',
      'what we sell': '#/stock', 'products': '#/stock'
    };
    var hash = TO[where];
    if (!hash) return { say: 'I do not have a screen called “' + esc(where) + '”.' };
    if (where === 'queue') { G.jarvisTabSet('queue'); return { say: 'Here is the queue.' }; }
    G.go(hash);
    return { say: 'Opened <b>' + esc(where) + '</b>.',
      actions: [['Back to me', 'goto|#/jarvis']] };
  };

  HANDLE.client = function (m) {
    var name = String(m[1] || '').trim().replace(/[.?!]+$/, '');
    if (!G.acc().clients) return { say: 'Your role cannot add a client, so neither can I.' };
    if (!ZS.validName(name)) return { say: 'Give me the company name and I will add them.' };

    var already = clientNamed(name);
    if (already && already.name.toLowerCase() === name.toLowerCase()) {
      return { say: 'We already have <b>' + esc(already.name) + '</b>.',
        actions: [['Open them', 'openClient|' + already.id]] };
    }

    /* ⚠️ THIS USED TO CREATE THE RECORD ON THE SPOT, and a company called
       "do that" is in the book because of it.

       Every other write here takes an argument that fails safely when it is
       misheard: a client who does not exist, a stage that is not on the ladder.
       A NAME IS DIFFERENT. Any string at all is a valid company name, so a
       dictated sentence that lands half inside the capture group creates a real
       record with a nonsense name, and nothing about it says it was an accident.
       So he asks first. One tap, and only on the write where the argument
       cannot be checked against anything. */
    return { say: 'Add <b>' + esc(name) + '</b> as a new client? I will put them in as a lead ' +
      'assigned to you.',
      actions: [['Yes, add them', 'jarvisAddClient|' + name]] };
  };

  /* The tap. Same primitive the form uses, so a second "add EGO Premium" folds
     into the record we have rather than making a second EGO Premium. */
  A.jarvisAddClient = function (name) {
    if (!G.acc().clients) return G.toast('Your role cannot add a client.', true);
    var r = ZS.upsertClient(D().clients, { name: String(name || ''), assigned_to: D().session, type: 'lead' });
    if (r.error) return G.toast(r.error, true);
    if (r.created) G.log('client_add', 'Jarvis added ' + r.client.name, { client: r.client.id });
    G.save();
    G.toast(r.created ? r.client.name + ' added.' : 'We already had ' + r.client.name + '.');
    /* It lands back in the conversation rather than throwing you onto another
       screen, so the chat stays the record of what happened and YOU decide
       where to go next. */
    G.jarvisTell({
      you: 'Yes, add them',
      intent: 'client', matched: 'client',
      jarvis: (r.created ? 'Added <b>' : 'We already had <b>') + esc(r.client.name) +
        '</b> as a lead, assigned to you.<br><br>Nothing else is on them yet. The next thing they ' +
        'need is <b>a person</b>: a client is a company, and every engagement runs through one ' +
        'named contact inside it. Add them on the client record, then open the engagement.',
      actions: [['Open ' + r.client.name, 'openClient|' + r.client.id],
                ['Start an engagement', 'startOpp|' + r.client.id]]
    });
  };

  HANDLE.oppnew = function (m) {
    if (!G.acc().addStock) return { say: 'Your role cannot open an engagement, so neither can I.' };
    if (!String(m[1] || '').trim()) {
      /* ⚠️ THIS USED TO MOVE YOU TO THE PICKER, and you arrived on a screen you
         had not asked for, with the explanation left behind on the one you came
         from. I ANSWER IN THE BOX. Moving somebody is a thing a button does,
         because a button is a decision they made. */
      var mine = (D().clients || []).filter(function (x) { return ZS.inScope(x, me(), D().access); });
      var lines = ZS.PRODUCTS.map(function (p) { return p.name; }).join(' or ');

      if (!mine.length) {
        return { say: 'I can, but not yet: <b>there is nobody on the books</b>. An engagement ' +
          'always belongs to a client, so there is nothing to open one against.<br><br>' +
          'A <b>client</b> is a company. Inside it are the people we actually deal with, and one ' +
          'of them is the point of contact for each engagement.<br><br>' +
          'So it goes: <b>1.</b> add the company. <b>2.</b> add the person there we speak to. ' +
          '<b>3.</b> open the engagement against them, on ' + esc(lines) + ', and put the fee on it.' +
          '<br><br>Tell me <b>add a client called Vishwa Textiles</b> and I will start the first step, ' +
          'or open the client screen and type it in yourself.',
          actions: [['Open the client screen', 'goto|#/clientnew'],
                    ['Show me the whole list of what I can do', 'jarvisSay|help']] };
      }

      return { say: 'I can. An engagement always belongs to a <b>client</b>, which is a company, ' +
        'and it runs through <b>one person</b> inside that company.<br><br>' +
        'Tell me who, and I will open it here: <b>start an engagement for ' +
        esc(mine[0].name) + ' on ' + esc((ZS.PRODUCTS[0] || {}).name || 'Agentic Cockpit') + '</b>. ' +
        'It starts at <b>' + esc(ZS.OPEN_STAGES[0]) + '</b> with no fee agreed, and takes the main ' +
        'contact at that company unless you tell me otherwise.<br><br>' +
        'Or open the picker and do it on the form, where you can set the scope and the fee at the ' +
        'same time.',
        rows: { head: ['Client', 'Sector', 'They are'],
          body: mine.slice(0, 8).map(function (x) {
            return [x.name, x.sector || '\u2014', ZS.CLIENT_TYPES[x.type] || 'Lead'];
          }) },
        actions: [['Open the picker', 'goto|#/oppnew'],
                  ['Add a new client instead', 'goto|#/clientnew']] };
    }
    var c = clientNamed(m[1]);
    if (!c) {
      return { say: 'No client called “' + esc(String(m[1]).trim()) + '”. Say ' +
        '<b>add a client called ' + esc(String(m[1]).trim()) + '</b> first and I will open one for them.' };
    }
    if (!G.acc().addStock) return { say: 'Your role cannot open an engagement, so neither can I.' };

    var want = String(m[2] || '').toLowerCase().trim();
    var prod = ZS.PRODUCTS.filter(function (p) {
      return p.name.toLowerCase() === want || p.id === want || p.code.toLowerCase() === want;
    })[0] || ZS.PRODUCTS.filter(function (p) {
      return want && p.name.toLowerCase().indexOf(want) >= 0;
    })[0];
    if (want && !prod) {
      return { say: 'I do not sell anything called “' + esc(want) + '”. We sell: ' +
        ZS.PRODUCTS.map(function (p) { return p.name; }).join(', ') + '.' };
    }
    prod = prod || ZS.PRODUCTS[0];
    if (!prod) return { say: 'There is nothing on the What we sell list to open this against.' };

    /* An engagement runs through ONE person at the company. With one on file
       that is settled; with several it takes the main one and says who, so a
       wrong guess is visible rather than silent. */
    var ct = ZS.primaryContact(c);
    var o = ZS.newOpp({
      client: c.id, title: c.name + ' — ' + prod.name,
      contact: ct ? ct.id : null,
      assigned_to: c.assigned_to || D().session,
      product: prod.id, source: c.source,
      stage: ZS.OPEN_STAGES[0],
      lines: [prod.id], inplay: [prod.id]
    });
    D().opportunities.push(o);
    c.last_touch = ZS.today();
    if (!c.assigned_to) c.assigned_to = o.assigned_to;
    G.log('opp_new', 'Jarvis opened "' + o.title + '" for ' + c.name + ' with no fee agreed yet',
          { client: c.id, opp: o.id });
    G.save();
    var others = ZS.contactsOf(c).length;
    return { say: 'Opened <b>' + esc(o.title) + '</b> at <b>' + esc(o.stage) + '</b>, running through ' +
      (ct ? '<b>' + esc(ct.name) + '</b>' + (others > 1
              ? ' — there are ' + others + ' people at ' + esc(c.name) + ', so change it on the ' +
                'engagement if that is the wrong one'
              : '')
          : '<b>nobody</b>, because we have no contact on file for them') + '. ' +
      'No fee is agreed yet — say <b>set the fee on ' + esc(c.name) + ' to 120000</b> when it is.',
      actions: [['Open it', 'openOpp|' + o.id]] };
  };

  /* Which words name which field, and which record owns it. An allowlist, not a
     lookup on whatever you happened to say: "set EGO's password to x" must not
     be a way to write a credential from a chat box. */
  var SETTABLE = {
    sector:    { on: 'client', key: 'sector' },
    website:   { on: 'client', key: 'website' },
    site:      { on: 'client', key: 'website' },
    instagram: { on: 'client', key: 'instagram' },
    email:     { on: 'client', key: 'email' },
    mobile:    { on: 'client', key: 'mobile' },
    number:    { on: 'client', key: 'mobile' },
    type:      { on: 'client', key: 'type' },
    source:    { on: 'client', key: 'source' },
    city:      { on: 'client', key: 'city' },
    gst:       { on: 'client', key: 'gst' },

    fee:       { on: 'opp', key: 'fee' },
    value:     { on: 'opp', key: 'fee' },
    scope:     { on: 'opp', key: 'scope' },
    repo:      { on: 'opp', key: 'repo' },
    demo:      { on: 'opp', key: 'demo' },
    hosting:   { on: 'opp', key: 'hosting' },
    domain:    { on: 'opp', key: 'domain' },
    crm:       { on: 'opp', key: 'crm' },
    stack:     { on: 'opp', key: 'stack' },
    expected:  { on: 'opp', key: 'expected' },
    title:     { on: 'opp', key: 'title' },
    /* named rather than typed: the value is matched against the people at that
       company, so "set the contact on Vishwa to Ravi" cannot invent a Ravi */
    contact:   { on: 'opp', key: 'contact' }
  };

  HANDLE.seton = function (m) { return setField(m[2], m[1], m[3]); };
  HANDLE.set   = function (m) { return setField(m[1], m[2], m[3]); };

  function setField(whoRaw, fieldRaw, valueRaw) {
    var field = String(fieldRaw || '').toLowerCase().trim();
    var value = String(valueRaw || '').trim().replace(/[.]$/, '');
    var spec = SETTABLE[field];
    if (!spec) {
      return { say: 'I cannot set “' + esc(field) + '” from here. I can set: ' +
        Object.keys(SETTABLE).join(', ') + '. Anything else is on the record itself, ' +
        'where the field can tell you what it wants.' };
    }
    var c = clientNamed(whoRaw);
    if (!c) return { say: 'No client called “' + esc(String(whoRaw).trim()) + '”.' };

    if (spec.on === 'client' && !G.acc().clients) {
      return { say: 'Your role cannot edit a client, so neither can I.' };
    }
    if (spec.on === 'opp' && !G.acc().editStock) {
      return { say: 'Your role cannot edit an engagement, so neither can I.' };
    }

    /* Validated the same way the form validates it, or a chat box becomes the
       way bad data gets in. */
    if (spec.key === 'mobile') {
      var digits = value.replace(/\D/g, '');
      if (!ZS.validMobile(digits)) return { say: 'That number does not look right.' };
      value = digits;
    }
    if (spec.key === 'email' && !ZS.validEmail(value)) {
      return { say: 'That is not a valid email address.' };
    }
    if (spec.key === 'fee') {
      var n = Number(value.replace(/[^\d.]/g, ''));
      if (!(n > 0)) return { say: 'Give me a number for the fee.' };
      value = n;
    }
    if (spec.key === 'type') {
      var t = Object.keys(ZS.CLIENT_TYPES).filter(function (k) {
        return k === value.toLowerCase() || ZS.CLIENT_TYPES[k].toLowerCase() === value.toLowerCase();
      })[0];
      if (!t) return { say: 'A client is one of: ' + Object.keys(ZS.CLIENT_TYPES).join(', ') + '.' };
      value = t;
    }
    if (spec.key === 'expected' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { say: 'Give me the date as 2026-10-10.' };
    }
    if (spec.key === 'contact') {
      var people = ZS.contactsOf(c);
      var hit = people.filter(function (x) { return x.name.toLowerCase() === value.toLowerCase(); })[0] ||
                people.filter(function (x) { return x.name.toLowerCase().indexOf(value.toLowerCase()) >= 0; })[0];
      if (!hit) {
        return { say: people.length
          ? 'Nobody called “' + esc(value) + '” at ' + esc(c.name) + '. We deal with: ' +
            people.map(function (x) { return x.name; }).join(', ') + '.'
          : 'We have nobody on file at ' + esc(c.name) + ' yet. Add them on their record first.' };
      }
      value = hit.id;
    }

    if (spec.on === 'client') {
      if (spec.key === 'city') {
        c.address = c.address || ZS.newAddress();
        c.address.city = value;
      } else {
        c[spec.key] = value;
      }
      c.last_touch = ZS.today();
      G.log('client_edit', 'Jarvis set ' + c.name + '’s ' + field + ' to ' + value,
            { client: c.id });
      G.save();
      return { say: 'Set <b>' + esc(c.name) + '</b>’s ' + esc(field) + ' to <b>' + esc(String(value)) + '</b>.',
        actions: [['Open them', 'openClient|' + c.id]] };
    }

    var opp = myOpps().filter(function (o) { return o.client === c.id && ZS.isOpen(o); })[0] ||
              myOpps().filter(function (o) { return o.client === c.id; })
                .sort(function (a, b) { return String(b.updated).localeCompare(String(a.updated)); })[0];
    if (!opp) {
      return { say: esc(c.name) + ' has no engagement to set that on. Say ' +
        '<b>start an engagement for ' + esc(c.name) + '</b> first.' };
    }
    opp[spec.key] = value;
    opp.updated = ZS.today();
    var shown = spec.key === 'fee' ? ZS.money(value)
              : spec.key === 'contact' ? (ZS.contactById(c, value) || {}).name
              : String(value);
    G.log('opp_edit', 'Jarvis set ' + field + ' on ' + (opp.title || c.name) + ' to ' + shown,
          { client: c.id, opp: opp.id });
    G.save();
    return { say: 'Set <b>' + esc(field) + '</b> on ' + esc(opp.title || c.name) + ' to <b>' +
      esc(shown) + '</b>.',
      actions: [['Open it', 'openOpp|' + opp.id]] };
  }

  HANDLE.move = function (m) {
    var c = clientNamed(m[1]);
    if (!c) return { say: 'No client called “' + esc(m[1]) + '”.' };
    var opp = myOpps().filter(function (o) { return o.client === c.id && ZS.isOpen(o); })[0];
    if (!opp) return { say: esc(c.name) + ' has no open opportunity to move.' };
    var want = String(m[2]).trim().replace(/[.?!]$/, '');
    var stage = ZS.OPP_STAGES.filter(function (s) { return s.toLowerCase() === want.toLowerCase(); })[0] ||
                ZS.OPP_STAGES.filter(function (s) { return s.toLowerCase().indexOf(want.toLowerCase()) >= 0; })[0];
    if (!stage) return { say: 'I do not know a stage called “' + esc(want) + '”. They are: ' +
      ZS.OPP_STAGES.join(', ') + '.' };
    if (!G.acc().clients) return { say: 'Your role cannot move an opportunity, so neither can I.' };
    var r = ZS.moveOpp(opp, stage, c);
    if (r.error) return { say: 'No — ' + esc(r.error) };
    G.log('opp_stage', 'Jarvis moved ' + c.name + ' to ' + stage, { client: c.id, opp: opp.id });
    G.save();
    return { say: 'Moved <b>' + esc(c.name) + '</b> to <b>' + esc(stage) + '</b>.',
      actions: [['Open it', 'openOpp|' + opp.id]] };
  };

  HANDLE.assign = function (m) {
    var c = clientNamed(m[1]);
    if (!c) return { say: 'No client called “' + esc(m[1]) + '”.' };
    var u = ZS.staffList().filter(function (x) {
      return x.name.toLowerCase().indexOf(String(m[2]).toLowerCase().trim()) >= 0; })[0];
    if (!u) return { say: 'Nobody on the team called “' + esc(m[2]) + '”.' };
    if (!G.acc().clients) return { say: 'Your role cannot reassign a client, so neither can I.' };
    c.assigned_to = u.id;
    var moved = ZS.openOppsFor(D().opportunities, c.id);
    moved.forEach(function (o) { o.assigned_to = u.id; o.updated = ZS.today(); });
    G.log('client_assign', 'Jarvis assigned ' + c.name + ' to ' + u.name, { client: c.id });
    G.save();
    return { say: '<b>' + esc(c.name) + '</b> is now ' + esc(u.name) + '’s' +
      (moved.length ? ', with ' + moved.length + ' open deal(s) moved across' : '') + '.' };
  };

  HANDLE.invoice = function (m) {
    var c = clientNamed(m[4]);
    if (!c) return { say: 'No client called “' + esc(m[4]) + '”.' };
    if (!G.acc().invoices) return { say: 'Your role cannot raise an invoice, so neither can I.' };
    var opp = myOpps().filter(function (o) { return o.client === c.id; })
      .sort(function (a, b) { return String(b.updated).localeCompare(String(a.updated)); })[0];
    if (!opp) return { say: esc(c.name) + ' has no engagement to invoice against.' };
    var amt = Number(String(m[5] || '').replace(/,/g, '')) || 0;
    if (!amt) {
      var done = ZS.invoicesFor(D().invoices, opp.id).reduce(function (a, i) { return a + i.amount; }, 0);
      amt = Math.max(0, ZS.oppValue(opp) - done);
    }
    if (!amt) return { say: 'The whole fee is already invoiced. Tell me an amount if you want another.' };
    var inv = ZS.addInvoice(D().invoices, { opp: opp.id, client: c.id, amount: amt,
                                            scope: 'Raised by Jarvis' });
    G.log('invoice_add', 'Jarvis raised ' + ZS.money(amt) + ' for ' + c.name,
          { client: c.id, opp: opp.id });
    G.save();
    return { say: 'Raised invoice ' + inv.n + ' of ' + inv.of + ' for <b>' + ZS.money(amt) +
      '</b> against ' + esc(opp.title || c.name) + ', due ' + inv.due + '. It is a draft until you send it.',
      actions: [['Open the engagement', 'openOpp|' + opp.id]] };
  };

  HANDLE.require = function (m) {
    var c = clientNamed(m[2]);
    if (!c) return { say: 'No client called “' + esc(m[2]) + '”.' };
    var opp = myOpps().filter(function (o) { return o.client === c.id && ZS.isOpen(o); })[0];
    if (!opp) return { say: esc(c.name) + ' has no open opportunity.' };
    if (!G.acc().clients) return { say: 'Your role cannot edit an opportunity, so neither can I.' };
    opp.requirements = (opp.requirements || []).concat([
      ZS.newRequirement({ text: m[3], by: D().session, stage: opp.stage })]);
    opp.updated = ZS.today();
    G.save();
    return { say: 'Recorded against <b>' + esc(opp.title || c.name) + '</b> at ' + esc(opp.stage) + '.',
      actions: [['Open it', 'openOpp|' + opp.id]] };
  };

  HANDLE.meeting = function (m) {
    var c = clientNamed(m[3]);
    if (!c) return { say: 'No client called “' + esc(m[3]) + '”.' };
    var opp = myOpps().filter(function (o) { return o.client === c.id && ZS.isOpen(o); })[0] ||
              myOpps().filter(function (o) { return o.client === c.id; })[0];
    if (!opp) return { say: esc(c.name) + ' has no engagement to book against.' };
    if (!G.acc().clients) return { say: 'Your role cannot book a meeting, so neither can I.' };
    var kind = ZS.MEETING_KINDS.filter(function (k) {
      return k.toLowerCase() === String(m[2] || '').toLowerCase(); })[0] || 'Catch-up';
    var when = m[4] && /^\d{4}-\d{2}-\d{2}$/.test(m[4]) ? m[4] : ZS.addDays(ZS.today(), 7);
    opp.meetings = (opp.meetings || []).concat([
      ZS.newMeeting({ kind: kind, at: when, by: D().session, done: false })]);
    opp.updated = ZS.today();
    G.save();
    return { say: 'Booked a <b>' + esc(kind) + '</b> with ' + esc(c.name) + ' on <b>' + esc(when) + '</b>.',
      actions: [['Open it', 'openOpp|' + opp.id]] };
  };

  HANDLE.message = function (m, q) {
    var rest = String(m[2] || '');
    var c = clientNamed(rest.split(/\s+about\s+/i)[0]);
    if (!c) return { say: 'Tell me which client — “message EGO Premium about the MOU”.' };
    var about = (rest.split(/\s+about\s+/i)[1] || '').trim();
    var opp = myOpps().filter(function (o) { return o.client === c.id && ZS.isOpen(o); })[0] ||
              myOpps().filter(function (o) { return o.client === c.id; })[0];
    var who = ZS.primaryContact(c);
    var run = ZS.newRun('chaser', 'Message ' + c.name,
      { target: opp ? { kind: 'opp', id: opp.id } : null,
        payload: { oppId: opp ? opp.id : null, discriminator: 'ask' } });
    ZS.step(run, 'You asked', q);
    ZS.step(run, 'Who', who ? who.name + (who.designation ? ', ' + who.designation : '') : c.name);
    ZS.step(run, 'A guard stopped me', 'This would reach a client, so it queues for you whatever mode I am in');
    run.summary = 'Message to ' + c.name + (about ? ' about ' + about : '');
    run.brief = { to: who ? who.name : c.name, about: about || 'picking the work back up',
                  note: opp ? 'They are at ' + (opp.proc ? opp.proc.stage : opp.stage) + '.' : '' };
    run.draft = { channel: 'whatsapp', text:
      'Hello ' + (who ? who.name.split(' ')[0] : 'there') + ',\n\n' +
      (about ? 'About ' + about + ' — ' : '') +
      'could we pick this up this week? Happy to jump on a quick call if that is easier.\n\n' +
      'Thank you.' };
    var p = recordViaJarvis(run);
    return { say: 'Drafted it and put it in the queue. <b>I do not send anything</b> — you read ' +
      'it, edit it, and approve.', actions: [['Read the draft', 'jarvisTab|queue']] };
  };
  function recordViaJarvis(run) {
    /* Jarvis's own drafts go through the same gate as an agent's. */
    var fn = G.recordRun;
    return fn ? fn(run, { manual: true }) : null;
  }

  HANDLE.template = function () {
    /* ⚠️ THIS ANSWER WAS WRITTEN BEFORE THE WHATSAPP SECTION EXISTED and was
       never revisited. It said templates do not live in here at all and sent you
       to Campaigns, which has Meta, Google and LinkedIn on it and no WhatsApp.
       Meanwhile Settings, WhatsApp, Templates has had a Write a template button
       on it for some time. An answer that has outlived the screen it describes
       is worse than no answer: it is confidently wrong and it wastes a trip. */
    var w = D().whatsapp || {};
    var n = (w.templates || []).length;
    return { say: 'Yes. <b>Settings → WhatsApp → Templates</b>, and the button says ' +
      '<b>Write a template</b>. You have <b>' + n + '</b> written so far.<br><br>' +
      'Writing one here is the first half. The second half is <b>Meta</b>: a template has to be ' +
      'submitted and approved by them before it can actually be sent, and that needs the WABA ' +
      'connected, which it is not yet. So what you write here is stored, versioned and ready, ' +
      'and it goes out for approval the day the number is connected.<br><br>' +
      'Three things to know while writing. Pick <b>Utility</b> if the message is about something ' +
      'they already did and <b>Marketing</b> if it is not, because Marketing is the one users can ' +
      'block and it is capped per user by Meta. Put variables in by clicking, never by typing, or ' +
      'the numbering breaks. And keep the sending tier in mind: it starts at 250 unique customers ' +
      'in 24 hours and climbs on quality rather than on spend.',
      actions: [['Open Templates', 'goto|#/settings/whatsapp'],
                ['What the sending limit is', 'goto|#/settings/whatsapp'],
                ['What connecting needs', 'goto|#/settings/connections']] };
  };

  HANDLE.run = function (m) {
    var want = String(m[3] || '').toLowerCase();
    var a = ZS.AGENTS.filter(function (x) {
      return x.id === want || x.name.toLowerCase().indexOf(want) >= 0; })[0];
    if (!a) return { say: 'I have ' + ZS.AGENTS.map(function (x) { return x.name; }).join(', ') + '.' };
    var out = G.runAgent(a.id, null, { manual: true });
    var n = Array.isArray(out) ? out.length : (out ? 1 : 0);
    G.save();
    return { say: n ? ZS.agentById(a.id).name + ' ran and queued ' + n + ' proposal(s).'
                    : ZS.agentById(a.id).name + ' ran and found nothing to do.',
      actions: n ? [['See the queue', 'jarvisTab|queue']] : [] };
  };

  G.jarvisApply = APPLY;
  G.jarvisDecide = decide;
  G.jarvisTabGet = function () { return TAB; };
  G.jarvisTabSet = function (t) { TAB = t; };
})();
