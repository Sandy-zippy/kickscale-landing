/* ZippyScale — the cockpit that runs the company that builds cockpits.

   The item here is an ENGAGEMENT: one build for one client, one-of-one, with its
   own price, plan, invoices, repo, demo URL and credentials. Winning it does not
   remove it — it moves from the sales board to the delivery board and stays ours
   to keep alive.

   Two boards on purpose. Sales ends at Won; delivery starts at Onboarding and a
   different person does it. That is the second-pipeline signal, and this business
   has it as clearly as any.

   No DOM in here, so it runs under node for the tests. */
(function (root) {
  'use strict';

  /* ⚠️ EVERY ID IN THE COCKPIT COMES FROM HERE, and it was not always so. Each
     record minted its own as `Date.now() + Math.floor(Math.random() * 1000)`,
     which collides whenever two are created in the same millisecond and the
     thousand-sided die lands twice: about one pair in a thousand. An invoice was
     worse still, `'INV' + Date.now()` with no random part at all, so two raised
     in the same millisecond collided outright.

     A collision is not a crash. It is a contact that answers to another
     contact's id, an invoice that overwrites another invoice, a document that
     opens the wrong file: silent, rare, and impossible to reproduce on purpose.
     It showed up here as a test that failed roughly once in twenty runs and
     passed every time it was looked at.

     The counter is what fixes it. Two ids minted in the same millisecond differ
     because the sequence moved, not because a random number happened to. */
  var idSeq = 0;
  function uid(prefix) {
    idSeq = (idSeq + 1) % 1679616;                 /* 36^4, so it stays four chars */
    return String(prefix) + Date.now().toString(36) +
           idSeq.toString(36) + Math.floor(Math.random() * 1296).toString(36);
  }

  var fmt = function (n) { return n == null ? '—' : Number(n).toLocaleString('en-IN'); };

  /* ⚠️ THE FULL FIGURE, FOR ANYTHING A CLIENT READS. `money` below abbreviates
     to L and Cr, which is right on a dashboard and wrong on a bill: nobody has
     ever been invoiced "₹1.40 L". Indian grouping, two decimals, a hair space
     after the sign so the number does not touch it. */
  var rupees = function (n) {
    var v = Number(n) || 0;
    return '\u20b9 ' + v.toLocaleString('en-IN', { minimumFractionDigits: 2,
                                                   maximumFractionDigits: 2 });
  };

  var money = function (n) {
    if (n == null) return '—';
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
    return '₹' + fmt(n);
  };

  /* Ceilings sit just above the real stock so a maxed slider filters nothing. */
  /* A catalogue search layer used to sit here — price/EMI/km ceilings, a
     matches() over make/model/variant/year, sorts by year and km, prepare()
     tacking on landed cost, margin and holding cost, and a cardHTML() with a
     cover photo. An agency sells one scoped service; the only consumer left was
     a ported storefront test. Deleted. What survives is prepare(), because the
     console still normalises a product record once before rendering it. */
  /* Products need no scoring: there is one, and it is complete by construction.
     This used to hang a completeness percentage off every product record by
     scoring it against the ENGAGEMENT registry — a product has no MOU, so the
     figure was meaningless, and nothing rendered it anyway. */
  function prepare(c) { return Object.assign({}, c); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }



  /* cardHTML(), coverSrc(), photoSrc(), ageBucket(), cascadeOptions() and
     tally() used to be here: a storefront product card with a cover photo,
     an EMI figure and a heart, plus make→model→variant cascade filters and
     an ageing-stock bucket. Nothing in this cockpit called any of them. */




  /* ================= ROLES AND ACCESS =================
     Ported from the Vaarahi demo, where it has already survived client demos.
     One accessor, one row filter, one masker. Lists filter, detail pages block,
     fields mask, nav hides. Denial is a polite card, never a 403. */

  var ROLES = {
    owner:      { label: 'Owner',           short: 'Owner' },
    director:   { label: 'Director',        short: 'Director' },
    account:    { label: 'Account Manager', short: 'Account' },
    builder:    { label: 'Builder',         short: 'Builder' },
    contractor: { label: 'Contractor',      short: 'Contractor' }
  };

  var CAPS = [
    ['cost',        'Cost & margin',      'What a build cost us to deliver, and what is left of the fee.'],
    ['clients',     'Client records',     'Open the client database at all.'],
    ['seeMobile',   'Client mobiles',     'See full phone numbers instead of the last four digits.'],
    ['credentials', 'Client credentials', 'The logins, keys and portal passwords we hold FOR a client. The most dangerous thing in here.'],
    ['invoices',    'Invoices & money',   'Raise an invoice, and see what is owed across every client.'],
    ['editStock',   'Edit engagements',   'Change the scope, the plan or the dates on a build.'],
    ['addStock',    'Start engagements',  'Open a new engagement.'],
    ['publish',     'Deploy',             'Push a build live, or take it down.'],
    ['automations', 'Build automations',  'Create and edit the rules that fire on their own.'],
    ['agents',      'Direct the agents',  'Change what Jarvis and the roster are allowed to do.'],
    ['exportData',  'Export data',        'Download client or engagement data as a file.'],
    ['targets',     'Set targets',        'Set the monthly numbers each person carries.'],
    ['reports',     'Team reports',       'See everyone\'s numbers, not just their own.'],
    ['settings',    'Settings',           'Roles, access and connections. The owner\'s controls.'],
    ['passwords',   'Passwords',          'See and reset other people\'s sign-in passwords.']
  ];

  var SCOPES = { own: 'Only their own', line: 'Their line', company: 'Everyone' };

  /* Who carries a monthly number. The screens asked `u.role === 'sales' ||
     u.role === 'manager'` — two dealer roles that do not exist here — so the
     target section and the "Set target" button rendered for nobody at all,
     including the owner whose target is the only real one in the building. */
  var TARGET_ROLES = ['owner', 'director', 'account'];
  function carriesTarget(u) { return !!u && TARGET_ROLES.indexOf(u.role) >= 0; }
  /* The same set answers "who can a client be assigned to" and "who appears on
     reports", so it is one list read from one place. Six screens each asked the
     question their own way against roles that do not exist, which is how the
     Reports page came to list nobody and the Assign dropdown came up empty. */
  function sellers(list) {
    return (list || STAFF).filter(carriesTarget);
  }

  /* The store manager starts level with the owner on purpose — the owner then
     switches individual capabilities off on the Roles tab if they want to. The
     one thing that is not a capability is the owner's own row: see canSetPass(). */
  /* One person today. The matrix exists so the second and third hire cost an
     afternoon rather than a rebuild — and so a contractor can be handed exactly
     one engagement without seeing what anybody else paid. */
  var ACCESS_DEFAULT = {
    owner:      { scope: 'company', cost: true,  clients: true,  seeMobile: true,  credentials: true,  invoices: true,  editStock: true,  addStock: true,  publish: true,  automations: true,  agents: true,  exportData: true,  targets: true,  reports: true,  settings: true,  passwords: true },
    director:   { scope: 'company', cost: true,  clients: true,  seeMobile: true,  credentials: true,  invoices: true,  editStock: true,  addStock: true,  publish: true,  automations: true,  agents: true,  exportData: true,  targets: true,  reports: true,  settings: false, passwords: false },
    account:    { scope: 'company', cost: false, clients: true,  seeMobile: true,  credentials: false, invoices: true,  editStock: true,  addStock: true,  publish: false, automations: false, agents: false, exportData: true,  targets: false, reports: true,  settings: false, passwords: false },
    builder:    { scope: 'company', cost: false, clients: true,  seeMobile: false, credentials: true,  invoices: false, editStock: true,  addStock: false, publish: true,  automations: true,  agents: false, exportData: false, targets: false, reports: false, settings: false, passwords: false },
    contractor: { scope: 'own',     cost: false, clients: false, seeMobile: false, credentials: false, invoices: false, editStock: true,  addStock: false, publish: false, automations: false, agents: false, exportData: false, targets: false, reports: false, settings: false, passwords: false }
  };

  var NO_ACCESS = { scope: 'own', cost: false, clients: false, seeMobile: false, credentials: false,
                    invoices: false, editStock: false, addStock: false, publish: false,
                    automations: false, agents: false, exportData: false, targets: false,
                    reports: false, settings: false, passwords: false };

  function defaultAccess() {
    var out = {};
    Object.keys(ACCESS_DEFAULT).forEach(function (r) { out[r] = Object.assign({}, ACCESS_DEFAULT[r]); });
    return out;
  }

  /* The one accessor. Everything else reads through this. */
  function acc(user, access) {
    if (!user) return Object.assign({}, NO_ACCESS);
    return (access && access[user.role]) || ACCESS_DEFAULT[user.role] || NO_ACCESS;
  }

  /* The row-level filter. `row.assigned_to` is the ownership axis. */
  function inScope(row, user, access) {
    if (!user || !row) return false;
    var a = acc(user, access);
    if (a.scope === 'company') return true;
    /* A saved matrix may still say 'branch'. Both are read, because an unknown
       scope value falls through to 'own' and would silently NARROW somebody's
       access on upgrade — or, if the fallback were 'company', widen it. */
    if (a.scope === 'line' || a.scope === 'branch') {
      return !row.product || row.product === user.line;
    }
    return row.assigned_to === user.id;
  }

  /* Deliberate escape hatch: an unassigned enquiry is everybody's problem. */
  function canOpen(row, user, access) {
    return inScope(row, user, access) || !row.assigned_to;
  }

  function maskMobile(m, user, access) {
    if (!m) return '—';
    if (acc(user, access).seeMobile) return m;
    return '••••••' + String(m).slice(-4);
  }

  function maskCost(v, user, access) {
    return acc(user, access).cost ? money(v) : '₹ ••••';
  }

  /* One person. The rest of the roster is a shape to copy when there is a second. */
  /* ⚠️ NO CREDENTIAL LIVES IN SHIPPED CODE.

     This held the owner's real username and password. core.js goes into the
     deployed bundle, so the owner's username and password were readable by anybody who opened
     view-source — which means the login screen was decoration, not a lock.

     The roster now starts empty. The demo fills it from seed.js, which is not
     shipped; the deployed build has nobody until you create the owner account
     on first run, and that credential is yours and lives only in your browser. */
  var STAFF = [];
  var DEMO_STAFF = [
    { id: 'u1', login: 'owner', pass: '', name: 'Owner', role: 'owner',
      branch: 'b1', mobile: '9999999999', email: 'owner@example.com', joined: '2025-09-01' }
  ];

  /* Who may set whose password.

     Two rules, and they are deliberately not capabilities:
       * nobody sets their own — a password is issued to you, not chosen by you,
         which is the whole point of the owner being able to read them. The one
         exception is the owner themselves: if they could not change their own,
         nobody on earth could, so the check returns early for them;
       * only the owner touches the owner's row, however senior the other person.
     Everything else is the `passwords` capability, which the owner can switch
     off for the store manager on the Roles tab. */
  function canSetPass(actor, target, access) {
    if (!actor || !target) return false;
    if (actor.role === 'owner') return true;          // including their own
    if (!acc(actor, access).passwords) return false;
    if (target.role === 'owner') return false;
    return target.id !== actor.id;
  }

  /* Changing a role is how you would hand yourself back a capability the owner
     just took away, so it carries its own rules rather than riding on
     `settings`: never your own row, and the two senior roles are the owner's
     to give. Without this, "the owner can switch things off for the store
     manager" is not true for five seconds. */
  /* The top two: a promotion INTO either is the owner's call alone. This said
     ['owner','storemanager'] — a dealer role that does not exist here, so the
     guard matched nothing and a director could promote someone to director. */
  var SENIOR_ROLES = ['owner', 'director'];

  function canSetRole(actor, target, role, access) {
    if (!actor || !target) return false;
    if (!acc(actor, access).settings) return false;
    if (actor.role === 'owner') return true;
    if (target.id === actor.id) return false;                 // not your own
    if (target.role === 'owner') return false;                // not the owner's
    if (role && SENIOR_ROLES.indexOf(role) >= 0) return false; // not a promotion into the top two
    return true;
  }

  /* Reading one is the same question as setting one — if you may reset it you
     may as well be told what it is, and the owner asked to see them in clear. */
  function canSeePass(actor, target, access) { return canSetPass(actor, target, access); }

  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); }
  function validPass(p) { return String(p || '').trim().length >= 6; }

  /* Staff live in the store once the app boots, so new people can be added to
     new branches. core.js keeps a pointer so its pure helpers still resolve a name. */
  function setStaff(list) { if (list && list.length) STAFF = list; return STAFF; }
  function staffList() { return STAFF; }

  /* A blank password matches nobody. Without this, a roster entry with no
     password set would sign in on an empty box. */
  function authenticate(login, pass) {
    var l = String(login || '').trim().toLowerCase();
    var p = String(pass == null ? '' : pass);
    if (!l || !p) return null;
    var u = STAFF.filter(function (x) {
      return x.login === l && String(x.pass || '') !== '' && String(x.pass) === p;
    })[0];
    return u || null;
  }
  function staffById(id) { return STAFF.filter(function (u) { return u.id === id; })[0] || null; }
  function staffByRole(r) { return STAFF.filter(function (u) { return u.role === r; }); }


  /* ================= BRANCHES ================= */

  /* BRANCHES ARE GONE. They were the dealer's showrooms, reused as "service
     lines", which duplicated the product list one-for-one and carried an address
     and a phone number that nothing ever displayed. What they genuinely did —
     carry a target and give a role something to be scoped to — the product now
     does. See DEFAULT_PRODUCTS. migrate() maps the two old branches onto the two
     products and drops the field; nothing else in the build knows the word. */

  /* A line IS a product. One name for one thing. */
  function lineName(id) {
    var p = productById(id);
    return p ? p.name : (id || '—');
  }


  /* ================= OPPORTUNITIES =================
     A client is a person; an opportunity is one product-buying attempt. Somebody
     who bought a Superb last year and is now after an X5 has one client record
     and two opportunities. The stage belongs to the opportunity, never to the
     person — otherwise a returning client has to be dragged backwards to "New" and
     their history is overwritten. */

  /* The sales board IS the pipeline. One ladder, from the moment a lead
     arrives to the moment it is booked. A enquiry and a WhatsApp enquiry both
     land on it — they just start at different rungs. */
  var OPEN_STAGES = ['Enquiry', 'Contacted', 'Discovery booked', 'Discovery done',
                     'Pitched', 'MOU sent', 'Invoiced'];
  var STAGE_HELP = {
    'Enquiry':          'Came in from somewhere. Nobody has spoken to them yet.',
    'Contacted':        'We have reached them. Working out whether there is a business here.',
    'Discovery booked': 'A discovery call is in the diary.',
    'Discovery done':   'We know what they do and where it hurts. Now build the pitch.',
    'Pitched':          'They have seen what we would build. Waiting on their word.',
    'MOU sent':         'Terms are with them. Revisions are counted on the record, not a new stage.',
    'Invoiced':         'Agreed in principle and the first invoice is raised. Money not in yet.',
    'Won':              'Paid and starting. It moves to the delivery board.',
    'Lost':             'Not happening. The reason is on the record.'
  };
  var CLOSED_STAGES = ['Won', 'Lost'];
  var OPP_STAGES = OPEN_STAGES.concat(CLOSED_STAGES);

  function isOpen(o) { return o && CLOSED_STAGES.indexOf(o.stage) < 0; }

  /* Stage names used before the floor and the pipeline were merged. */
  var LEGACY_STAGES = {
    'New': 'Enquiry', 'Visit booked': 'Discovery booked', 'Visited': 'Discovery done',
    'Delivered': 'Won'
  };
  function fixStage(st) {
    if (OPP_STAGES.indexOf(st) >= 0) return st;
    return LEGACY_STAGES[st] || OPEN_STAGES[0];
  }

  function newOpp(o) {
    o = o || {};
    return {
      id: o.id || uid('o'),
      ref: o.ref || null,            /* what people see; minted on the way in */
      client: o.client || null,
      title: o.title || '',
      /* The first rung, read from the ladder rather than written out. This said
         'New lead' — a dealer stage this ladder does not have — so any engagement
         created without an explicit stage landed on a column that renders
         nowhere and vanished from the board. */
      stage: OPEN_STAGES.indexOf(o.stage) >= 0 || CLOSED_STAGES.indexOf(o.stage) >= 0
        ? o.stage : OPEN_STAGES[0],
      lines: o.lines || [],       // the products on this engagement
      inplay: o.inplay || [],    // what they are actually buying; follow-ups hang off these
      assigned_to: o.assigned_to || null,
      /* WHO WE ARE ACTUALLY TALKING TO ON THIS ONE.

         A client is a company, and a company has several people: one in sales,
         one in accounts, one who owns the content. An engagement runs through
         exactly ONE of them, and it is not always the same person as the last
         engagement with that company. This used to be missing entirely, so
         every message, every draft and every "contact" on the record silently
         meant "whoever is the company's main contact" — which is right by
         accident when there is one person and wrong the moment there are two. */
      contact: o.contact || null,

      /* What they told the website form. See TEAM_BANDS. */
      team: o.team || '', revenue: o.revenue || '', budget: o.budget || '',
      timeline: o.timeline || '', ad: o.ad || '', landed: o.landed || '',

      source: o.source || 'referral',
      /* ⚠️ Every field here is one somebody can type into. The old shape carried
         budget_min/budget_max/wants/trade_in/finance from a dealer build — none
         had an input, so the screen reported "Trade-in: None mentioned" about a
         thing nobody was ever asked. A field with no input is a lie with a label. */
      fee: o.fee != null ? Number(o.fee) : null,
      scope: o.scope || '',          /* what we actually agreed to build */
      campaign: o.campaign || null,  /* which ad brought them, if a paid one did */
      product: o.product || 'cockpit',
      created: o.created || today(),
      updated: o.updated || today(),
      expected: o.expected || null,      // when they say they will buy
      closed: o.closed || null,
      outcome: o.outcome || null,
      won_line: o.won_line || null,
      won_price: o.won_price || null,
      lost_reason: o.lost_reason || null,
      notes: o.notes || [],
      requirements: o.requirements || [],   /* what they asked for, as it changes */
      meetings: o.meetings || [],           /* each meeting and its minutes */
      deliverables: o.deliverables || [],   /* what we handed over: links and files */
      docs: o.docs || []                    /* MOU and anything else, before delivery */
    };
  }

  function oppsFor(opps, clientId) {
    return (opps || []).filter(function (o) { return o.client === clientId; });
  }
  function openOppsFor(opps, clientId) {
    return oppsFor(opps, clientId).filter(isOpen);
  }
  function openOpps(opps) { return (opps || []).filter(isOpen); }

  /* The pipeline only ever carries live work. Anything decided drops out of it
     and lands on the client's record instead. */
  function pipelineByStage(opps, filterFn) {
    var out = {};
    OPEN_STAGES.forEach(function (s) { out[s] = []; });
    (opps || []).forEach(function (o) {
      if (!isOpen(o)) return;
      if (filterFn && !filterFn(o)) return;
      /* A stage from an older build, or a typo, must not take the board down.
         Park it at the first rung rather than throwing. */
      var col = out[o.stage] ? o.stage : OPEN_STAGES[0];
      out[col].push(o);
    });
    return out;
  }

  /* Promote a product out of the shortlist: this is the one being negotiated, and
     the one follow-ups are about. */
  function attachProduct(opp, stockId, on) {
    var i = opp.inplay.indexOf(stockId);
    if (on === false || (on === undefined && i >= 0)) { if (i >= 0) opp.inplay.splice(i, 1); }
    else if (i < 0) opp.inplay.push(stockId);
    if (opp.lines.indexOf(stockId) < 0) opp.lines.push(stockId);
    opp.updated = today();
    return opp;
  }
  function isInPlay(opp, stockId) { return (opp.inplay || []).indexOf(stockId) >= 0; }

  /* How far along a product is, so a stage move can advance a mark but never drag it
     backwards over something a salesperson chose by hand. */
  /* Ranked so a stage move can only ever raise a mark, never lower one. These
     used to be test_drove/booked/bought — none of which is in MARKS any more, so
     every lookup returned undefined and the "upwards only" rule silently did
     nothing. Parked sits at 0: it is a deliberate pause, not progress. */
  var MARK_RANK = { parked: 0, interested: 1, quoted: 2, accepted: 3, declined: 0 };
  var STAGE_MARK = { 'Pitched': 'quoted', 'MOU sent': 'quoted', 'Invoiced': 'accepted' };

  /* Stages that describe a conversation about one specific product. You cannot
     negotiate nothing, so these need a product in play first. */
  /* You cannot pitch, send terms or invoice without naming what you are selling. */
  var NEEDS_PRODUCT = ['Pitched', 'MOU sent', 'Invoiced'];

  function moveOpp(opp, stage, client) {
    if (OPP_STAGES.indexOf(stage) < 0) return { error: 'Unknown stage.' };
    if (stage === 'Won') return { error: 'Close it as won from the engagement, so the sale is recorded.' };
    if (NEEDS_PRODUCT.indexOf(stage) >= 0 && !(opp.inplay || []).length) {
      return { error: 'Put what they are buying in play first — you cannot be ' + stage.toLowerCase() +
                      ' on nothing in particular.' };
    }
    opp.stage = stage;
    opp.updated = today();
    if (stage === 'Lost') { opp.closed = today(); opp.outcome = 'lost'; }
    else { opp.closed = null; opp.outcome = null; }

    /* The stage is the truth about the deal, so the products in play follow it —
       upwards only, and never over a deliberate "not for them". */
    var moved = [];
    var want = STAGE_MARK[stage];
    if (want && client) {
      (opp.inplay || []).forEach(function (sid) {
        var now = markOf(client, sid);
        if (now === 'declined' || now === 'accepted') return;
        if ((MARK_RANK[now] || 0) >= (MARK_RANK[want] || 0)) return;
        addMark(client, sid, want, null);
        moved.push(sid);
      });
    }
    return { opp: opp, marks: moved };
  }

  /* Winning an opportunity is the moment it leaves the pipeline: the sale is
     written onto the client and the opportunity becomes history. */
  function winOpp(opp, client, stockId, price, when) {
    if (!stockId) return { error: 'Pick what they actually signed for.' };
    opp.stage = 'Won';
    opp.outcome = 'won';
    opp.won_line = stockId;
    opp.won_price = price || null;
    opp.closed = when || today();
    opp.updated = opp.closed;
    if (client) {
      client.purchased = client.purchased || [];
      client.purchased.push({ product_id: stockId, price: price || null, when: opp.closed, opp: opp.id });
      client.last_touch = opp.closed;
    }
    /* Winning it opens the transfer file. Nobody has to remember to start one,
       and the fourteen-day clock starts ticking from this date. */
    startProc(opp, opp.closed);
    return { opp: opp };
  }

  /* ================= PROCESSING =================
     Signing the deal is half the job. The other half is the paperwork that moves
     the build into their hands, and it runs on the dates we promised:

       * every milestone carries a date we gave the client;
       * the insurance is endorsed to the new owner within 14 days too. Miss it
         and only third-party cover carries over — an own-damage claim on the
         product they just bought is refused. That is the one that bites.

     So processing is not a checklist, it is a deadline. It is also NOT a second
     record: it is a later phase of the same opportunity, so the client's file,
     the product and the salesperson all stay attached without being copied. */

  var PROC_STAGES = ['Onboarding', 'Demo', 'Client data', 'Testing',
                     'Corrections', 'Handover', 'Running'];

  var PROC_HELP = {
    'Onboarding':  'Their answers and their credentials. This is where builds stall.',
    'Demo':        'The build itself, on their own data wherever we have it.',
    'Client data': 'Their real records in, and checked.',
    'Testing':     'With the client. Two weeks.',
    'Corrections': 'What testing threw up. One week.',
    'Handover':    'Deployed, credentials handed over, they are trained.',
    'Running':     'Live, and ours to keep alive.'
  };

  /* What a stage cannot be left without. The paperwork and the stage are the
     same fact, so the upload is what moves the deal — not a tick box beside it. */
  /* What a stage cannot be left without. The upload is what moves the build —
     not a tick box beside it. */
  var PROC_NEEDS = {
    'Onboarding':  ['onboarding_answers', 'client_creds'],
    'Demo':        [],
    'Client data': ['sample_data'],
    'Testing':     ['test_signoff'],
    'Corrections': [],
    'Handover':    ['handover_note'],
    'Running':     []
  };

  /* ---- the plan ----

     A build runs 30 to 120 days and the thing that actually goes wrong is that
     nobody can say, on a Tuesday in week six, whether it is late. So the
     duration is chosen once at kickoff and every milestone gets a target date
     by proportion, each one editable afterwards because the proportion is a
     starting guess and the client's calendar is not.

     The weights come from how these actually run: onboarding is short and
     always slips, the build is the bulk, testing with the client is two weeks
     and corrections are one. */
  var PLAN_DURATIONS = [30, 60, 90, 120];
  var PLAN_DEFAULT = 90;

  var PLAN_WEIGHTS = {
    'Onboarding':  0.15,
    'Demo':        0.50,
    'Client data': 0.62,
    'Testing':     0.85,
    'Corrections': 0.95,
    'Handover':    1.00
  };

  function planFor(start, duration) {
    var days = Number(duration) || PLAN_DEFAULT;
    var out = {};
    PROC_STAGES.forEach(function (st) {
      var w = PLAN_WEIGHTS[st];
      if (w == null) return;                 // Running is the end state, not a milestone
      out[st] = addDays(start, Math.round(days * w));
    });
    return out;
  }

  /* One row per milestone: what was promised, whether it happened, how late. */
  function milestones(opp, today_) {
    if (!opp || !opp.proc) return [];
    var pr = opp.proc;
    var plan = pr.plan || {};
    var done = pr.reached || {};
    var at = PROC_STAGES.indexOf(pr.stage);
    return PROC_STAGES.filter(function (st) { return PLAN_WEIGHTS[st] != null; })
      .map(function (st, i) {
        var idx = PROC_STAGES.indexOf(st);
        var target = plan[st] || null;
        var reached = done[st] || (idx < at ? pr.started : null);
        var left = target ? daysLeft(target, today_) : null;
        return {
          stage: st, target: target, reached: reached,
          passed: idx < at || !!done[st],
          current: idx === at,
          daysLeft: left,
          late: !!(target && !reached && left !== null && left < 0),
          lateBy: target && left !== null && left < 0 ? -left : 0
        };
      });
  }

  function planSlipped(opp, today_) {
    return milestones(opp, today_).filter(function (m) { return m.late; });
  }

  /* ---- what we sell ----
     Repeatable lines with a price band and a typical length. An engagement is
     one-of-one; the line it is built from is not. */
  /* An agency has no stock. It has PRODUCTS — what we sell — and every
     engagement is scoped individually, because no two builds are the same job.
     So the product sets the floor price and nothing else; the scope and the fee
     are written per engagement.

     One product today. AI Automations, when it exists, is a second row here and
     nothing else in the build has to change. */
  /* THE DOLLAR FIGURE IS COMPUTED, NEVER STORED.

     It used to be a `usd` field on the product, filled in once at whatever rate
     was hard-coded here. So a floor price edited to ₹69,999 kept showing $838
     at a rate of 83.5 while the real one was near 96, and nothing on any screen
     said which rate it had used. A number nobody can see the workings of is
     worse than no number.

     The live rate is in the store under `usd_rate`, editable in Settings, and
     every screen that shows dollars also shows the rate and the day it was set.
     This is the fallback for a store that has none. */
  var USD = 96;
  var USD_RATE = { rate: USD, at: '2026-09-28' };
  function setUsdRate(r) {
    if (r && Number(r.rate) > 0) USD_RATE = { rate: Number(r.rate), at: r.at || today() };
    return USD_RATE;
  }
  function usdRate() { return USD_RATE; }
  function inUsd(rupees) { return Math.round((Number(rupees) || 0) / (USD_RATE.rate || USD)); }

  /* ⚠️ THE PRICE IS THE RUPEE FIGURE. A dirham figure is that same number in
     another currency and nothing else. Bhargav asked for a conversion and got a
     repositioning instead the first time, which was not mine to do. Editable
     here for the same reason the dollar rate is: a rate hard-coded in a file is
     a rate that is wrong by next quarter. */
  var AED = 24;
  var AED_RATE = { rate: AED, at: '2026-10-01' };
  function setAedRate(r) {
    var n = Number(r && r.rate ? r.rate : r);
    if (!isFinite(n) || n <= 0) return AED_RATE;
    AED_RATE = { rate: n, at: (r && r.at) || today() };
    return AED_RATE;
  }
  function aedRate() { return AED_RATE.rate || AED; }
  function inAed(rupees) { return Math.round((Number(rupees) || 0) / aedRate()); }
  /* `code` is the reference prefix for anything sold under this line, so an
     engagement reads AC-001 rather than a timestamp. Adding a product adds its
     own series; nothing else has to know about it. */
  /* ================= WHAT WE SELL =================

     ONE CONCEPT, NOT TWO. There used to be `PRODUCTS` (Agentic Cockpit, AI
     Automations) and `BRANCHES`, which were "service lines" (Cockpit builds,
     Automation & GHL). The same split, kept in two lists that had to agree by
     hand, and could only drift.

     "Branch" was a car dealer's SHOWROOM, which is why its form asked for an
     address and a phone number. An agency does not have showrooms. So the
     product is the line: it prices the work, prefixes the reference, carries
     the monthly target, and is what a role can be scoped to.

     The list below is only the STARTING list for a cockpit with nothing in it.
     The live one lives in the store and is editable, because a price you cannot
     change is a price that goes stale, and ours was sitting in shipped code
     where literally nobody could edit it. */
  var DEFAULT_PRODUCTS = [
    { id: 'cockpit', name: 'Agentic Cockpit', code: 'AC', from: 61000,
      blurb: 'One system built for one business: console, roles, pipeline, automations, agents.',
      target: { units: 2, value: 500000 } },
    { id: 'automations', name: 'AI Automations', code: 'AO', from: 35000,
      blurb: 'Funnels, WhatsApp, GHL and the integrations between them. Scoped per job.',
      target: { units: 2, value: 200000 } }
  ];

  /* The live list, set from the store on load — the same pattern as the roster. */
  var PRODUCTS = DEFAULT_PRODUCTS.map(function (p) { return JSON.parse(JSON.stringify(p)); });
  function setProducts(list) {
    PRODUCTS = (list && list.length) ? list : DEFAULT_PRODUCTS.map(function (p) {
      return JSON.parse(JSON.stringify(p));
    });
    return PRODUCTS;
  }
  function productList() { return PRODUCTS; }

  function newProduct(o) {
    o = o || {};
    var name = String(o.name || '').trim();
    return {
      id: o.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') ||
          ('p' + Date.now()),
      name: name,
      code: String(o.code || name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'XX'),
      from: o.from != null ? Number(o.from) : 0,
      blurb: o.blurb || '',
      target: { units: (o.target && o.target.units) || 0,
                value: (o.target && o.target.value) || 0 }
    };
  }

  /* A code prefixes every reference on that line, so two lines sharing one would
     put two different engagements at AC-004. Refused rather than merged. */
  function validateProduct(p, list) {
    if (!p || !String(p.name || '').trim()) return 'It needs a name.';
    if (!/^[A-Z]{2,4}$/.test(String(p.code || ''))) {
      return 'The code is two to four capital letters. It prefixes every reference on this line.';
    }
    var clash = (list || []).filter(function (x) {
      return x.id !== p.id && String(x.code).toUpperCase() === String(p.code).toUpperCase();
    })[0];
    if (clash) return '"' + p.code + '" is already the code for ' + clash.name + '. Two lines sharing ' +
      'a code would put two different engagements at the same reference.';
    if (p.from != null && (isNaN(Number(p.from)) || Number(p.from) < 0)) return 'The floor price takes a number.';
    return null;
  }
  /* ================= REFERENCES =================

     Every record keeps its internal `id` exactly as it is: those are keys that
     invoices, follow-ups, documents and the activity log all point at, and
     renumbering them would mean rewriting every reference in the store to make
     a screen read tidier. What people actually see is a `ref`, minted in
     sequence, and that is what the sheet and the screens print.

     So the ugly `o1790500999188` was never wrong as a key. It was wrong as a
     LABEL, and the seed's hand-written "E-001" sitting next to it in the same
     column is what made that obvious. */

  function refSeq(list, prefix, pad) {
    var re = new RegExp('^' + prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '(\\d+)$');
    var top = 0;
    (list || []).forEach(function (x) {
      var m = re.exec(String((x && x.ref) || ''));
      if (m) { var n = parseInt(m[1], 10); if (n > top) top = n; }
    });
    var next = String(top + 1);
    while (next.length < (pad || 3)) next = '0' + next;
    return prefix + next;
  }

  /* Give every record that people see a reference, in the order things were
     actually made. Called on every save, so no creation path has to remember —
     including ones written later. Anything that already has a ref keeps it, so
     a reference printed on an invoice never changes under the client. */
  function ensureRefs(d) {
    if (!d) return d;
    var byCreated = function (a, b) {
      var x = String(a.created || a.at || ''), y = String(b.created || b.at || '');
      return x === y ? String(a.id).localeCompare(String(b.id)) : x.localeCompare(y);
    };

    (d.clients || []).slice().sort(byCreated).forEach(function (c) {
      if (!c.ref) c.ref = clientRef(d.clients);
    });

    (d.opportunities || []).slice().sort(byCreated).forEach(function (o) {
      if (!o.ref) o.ref = oppRef(d.opportunities, o.product);
    });

    /* An invoice reads as a part of its engagement, and renumber() moves the
       parts about, so this follows `n` rather than being minted once. */
    (d.invoices || []).forEach(function (i) {
      var o = (d.opportunities || []).filter(function (x) { return x.id === i.opp; })[0];
      i.ref = invoiceRef(o, i.n);
    });
    return d;
  }

  /* An engagement's series follows what is being sold: AC-001 for a cockpit,
     AO-001 for an automations job. */
  function oppRef(list, productId) {
    var p = productById(productId || 'cockpit');
    return refSeq(list, ((p && p.code) || 'EN') + '-', 3);
  }
  function clientRef(list) { return refSeq(list, 'CL-', 3); }

  /* An invoice belongs to its engagement, so it reads as a part of it. */
  function invoiceRef(opp, n) {
    return ((opp && opp.ref) || 'EN-000') + '/' + (n || 1);
  }

  function productById(id) {
    return PRODUCTS.filter(function (p) { return p.id === id; })[0] || null;
  }
  function productName(id) { var p = productById(id); return p ? p.name : (id || '—'); }


  /* ---- invoices ----
     Two or three per engagement, any split. The PDF carries THEIR billing
     identity as the bill-to and OURS as the pay-into — those are different
     sides and conflating them is how an invoice goes unpaid. */
  var INVOICE_STATES = ['draft', 'sent', 'paid', 'overdue'];
  /* The same four states, in words somebody would say out loud. The dropdown
     used to read "draft / sent / cleared / overdue": three internal names and
     one plain one, which is what a list looks like when nobody has read it
     aloud. */
  var INVOICE_WORDS = {
    draft: 'Not sent yet',
    sent: 'Sent, not cleared',
    paid: 'Cleared',
    overdue: 'Overdue, not cleared'
  };
  var TERMS_DAYS = 15;

  /* Raise another one whenever the deal needs it — a 50/50 becomes a 40/40/20
     halfway through more often than not. Numbering renumbers itself so "2 of 3"
     never goes stale. */
  function addInvoice(list, o) {
    var mine = (list || []).filter(function (i) { return i.opp === o.opp; });
    var inv = newInvoice(Object.assign({ n: mine.length + 1 }, o));
    list.push(inv);
    renumber(list, o.opp);
    return inv;
  }
  function dropInvoice(list, id) {
    var inv = (list || []).filter(function (i) { return i.id === id; })[0];
    if (!inv) return { error: 'No such invoice.' };
    if (inv.state === 'paid') return { error: 'A paid invoice stays on the record.' };
    var opp = inv.opp;
    var out = list.filter(function (i) { return i.id !== id; });
    list.length = 0; Array.prototype.push.apply(list, out);
    renumber(list, opp);
    return { ok: true };
  }
  function renumber(list, oppId) {
    var mine = (list || []).filter(function (i) { return i.opp === oppId; })
      .sort(function (a, b) { return String(a.raised).localeCompare(String(b.raised)); });
    mine.forEach(function (i, n) { i.n = n + 1; i.of = mine.length; });
    return mine;
  }
  function invoicesFor(list, oppId) {
    return renumber(list, oppId);
  }

  /* ---- what an invoice actually says ----

     The shape below is taken from the invoices Bhargav already sends, not
     invented: ZS/EGO/2026/003 reads

        Order value                 ₹ 1,40,000.00
        Less: advance received     – ₹   90,000.00
        Less: due on handover      – ₹   20,000.00
        GST                         Not Applicable
        Total Due Now               ₹   30,000.00

     ⚠️ A DEDUCTION IS NOT AN ADVANCE, and keeping them apart is the whole of the
     money model here. `advance` has always meant *money received against THIS
     invoice*, which is what clears it. The "Less: advance received" line above is
     something else: it explains how an order of ₹1,40,000 comes to ask for
     ₹30,000 today. Folding one into the other would mark this invoice cleared
     the moment it was raised, because ₹90,000 is more than ₹30,000.

     So `order_value` is the agreed total, `deductions` are the lines that
     explain the gap, and `amount` is what this invoice asks for. Everything that
     already reads `amount` and `advance` keeps working untouched. */
  /* ⚠️ THREE, AND ONLY THREE. An open list of labels is an invitation to invent a
     fourth that means the same as one of these, and then nothing can be totalled
     by kind. Plain words: what it is, in the fewest that say it. */
  var DEDUCTION_LABELS = ['Advance already paid', 'Discount', 'To be paid at handover'];

  /* ⚠️ THE ORDER VALUE IS NOT WHAT THIS INVOICE IS FOR.
     The order value is the whole engagement: ₹2,40,000 agreed, and it does not
     change because one invoice was raised against part of it. The INVOICE VALUE
     is what this one bill is for, and it is the only figure the deductions come
     off. The first version subtracted from the order value, so an invoice for
     one phase of a ₹2,40,000 job quietly billed against the whole job.

     `invoice_value` falls back to `order_value` for invoices raised before the
     two were told apart, where they were by definition the same number. */
  function invoiceTotals(inv, gstRate) {
    var order = Number(inv && inv.order_value) || 0;
    var value = Number(inv && inv.invoice_value) || order;
    var cuts = ((inv && inv.deductions) || []).reduce(function (a, d) {
      return a + (Number(d && d.amount) || 0);
    }, 0);
    var taxable = Math.max(0, value - cuts);
    var rate = (inv && inv.gst) ? (Number(inv.gst_rate) || Number(gstRate) || 0) : 0;
    var gst = Math.round(taxable * rate / 100);
    return { order: order, value: value, deducted: cuts, taxable: taxable,
             rate: rate, gst: gst, total: taxable + gst };
  }

  function newInvoice(o) {
    o = o || {};
    return {
      id: o.id || uid('INV'),
      ref: o.ref || null,
      opp: o.opp || null, client: o.client || null,
      n: o.n || 1, of: o.of || 2,
      scope: o.scope || '',
      /* the line under the description on the PDF */
      detail: o.detail || '',
      /* The whole engagement, for context only. Nothing is ever subtracted from
         it and it is not what this invoice asks for. */
      order_value: Number(o.order_value) || 0,
      /* What THIS bill is for. The deductions come off this. */
      invoice_value: Number(o.invoice_value) || 0,
      deductions: Array.isArray(o.deductions) ? o.deductions : [],
      gst: !!o.gst,
      gst_rate: Number(o.gst_rate) || 0,
      /* The invoice number as the client reads it, which is not our internal
         reference. ZS/EGO/2026/003 on paper, AC-001/1 in the database. */
      number: o.number || '',
      /* ⚠️ A due date is not always a date. "On Handover" is a real answer and it
         is on invoices he has already sent. When this is set, `due` is null and
         nothing can call the invoice overdue, which is correct: no date has
         passed. */
      due_text: o.due_text || '',
      note: o.note || '',
      /* the sentence beside the due-date chip, telling them how to pay */
      pay_line: o.pay_line || '',
      /* Who it is billed to, COPIED not referenced. A client who changes their
         address next year must not silently rewrite an invoice already sent. */
      bill_to: o.bill_to || null,
      amount: o.amount || 0,
      state: o.state || 'draft',
      /* An ADVANCE is money taken before the work, against this invoice. It is
         not a separate record: an advance that is not attached to what it is an
         advance ON is a payment nobody can reconcile. */
      advance: Number(o.advance) || 0,
      raised: o.raised || today(),
      sent: o.sent || null,
      paid: o.paid || null,
      /* what the proof of payment said, and who said it matched */
      proof: o.proof || null,
      due: o.due || addDays(o.raised || today(), TERMS_DAYS)
    };
  }

  /* ---- the invoice template ----

     ⚠️ EVERY WORD BELOW IS TAKEN OFF AN INVOICE HE HAS ALREADY SENT
     (ZS/EGO/2026/003 and ZS/BER/2026/002, both raised 1 October 2026). They are
     not suggestions and they are not mine: the whole point of a template is that
     the next invoice looks like the last one. Editable in Settings, which is the
     only place they should ever be edited.

     The bank details are the one block worth reading twice before changing. */
  var DEFAULT_INVOICE_TEMPLATE = {
    logo: '',                                   /* blank = the bundled mark */
    legal_name: 'Zippy Scale',
    byline: 'Co-Founder: Bhargav Naidu',
    address: 'Lab 24, ODCWL, 3rd Floor,\nPranava Business Park, beside Toyota Showroom,\nKondapur, Hyderabad \u2013 500084',
    email: 'bhargav@zippyscale.com',
    bank_holder: 'Zippy Scale',
    bank_name: 'HDFC Bank',
    bank_account: '50200102811362',
    bank_ifsc: 'HDFC0006334',
    /* ⚠️ Not GST-registered. When this goes on, the rate applies and the note
       below is replaced by the ordinary tax lines. */
    gst_registered: false,
    gst_rate: 18,
    gst_note: 'This invoice does not include GST. Zippy Scale is not GST-registered and ' +
              'GST is not applicable on this payment.',
    terms_days: TERMS_DAYS,
    number_format: 'ZS/{CODE}/{YYYY}/{NNN}',
    footer: 'Zippy Scale  \u2022  bhargav@zippyscale.com  \u2022  Thank you for your business'
  };

  function invoiceTemplate(store) {
    var t = (store && store.invoice_template) || {};
    var out = {};
    Object.keys(DEFAULT_INVOICE_TEMPLATE).forEach(function (k) {
      out[k] = (t[k] === undefined || t[k] === null || t[k] === '') && k !== 'gst_registered'
        ? DEFAULT_INVOICE_TEMPLATE[k] : t[k];
    });
    out.gst_registered = !!t.gst_registered;
    return out;
  }

  /* A short code per client, the way the real ones read: EGO Premium Products
     Private Limited is EGO, The Big E Retail is BER. Derived rather than stored,
     and editable on the invoice itself, because a derivation is a good guess and
     never an authority. */
  var CODE_SKIP = /^(the|a|an|and|of|for|m\/s|messrs)$/i;
  /* ⚠️ A GUESS, CORRECTED ONCE. "EGO Premium Products Private Limited" derives
     as EPP and he writes EGO; "The Big E Retail" derives as BER, which is right.
     No rule gets both, so the invoice form shows the guess, he fixes it where it
     is wrong, and the fix is saved on the CLIENT. One correction per client,
     ever, rather than a decision on every invoice. */
  function codeFor(client) {
    return (client && client.invoice_code) || clientCode(client && client.name);
  }
  function clientCode(name) {
    var words = String(name || '').replace(/[^a-z0-9\s]/gi, ' ').split(/\s+/)
      .filter(function (w) { return w && !CODE_SKIP.test(w); });
    if (!words.length) return 'ZS';
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.slice(0, 3).map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  function invoiceNumber(format, code, year, n) {
    return String(format || DEFAULT_INVOICE_TEMPLATE.number_format)
      .replace(/\{CODE\}/g, code || 'ZS')
      .replace(/\{YYYY\}/g, String(year || new Date().getFullYear()))
      .replace(/\{NNN\}/g, String(n == null ? 1 : n).padStart(3, '0'))
      .replace(/\{NN\}/g, String(n == null ? 1 : n).padStart(2, '0'));
  }

  /* Who the invoice is addressed to. Defaults to the client and can be pointed
     at a parent company instead, which is a real thing that happens: the work is
     for the brand and the money comes from the holding company. */
  function billToFrom(client) {
    var a = (client && client.address) || {};
    var ct = client ? primaryContact(client) : null;
    return {
      name: (client && client.name) || '',
      lines: [a.line1, a.area, [a.city, a.state].filter(Boolean).join(', '), a.pin,
              a.country && a.country !== 'India' ? a.country : '']
        .filter(Boolean).join('\n'),
      attn: ct ? ct.name : '',
      /* ⚠️ Split, like every other number in the cockpit. The invoice prints the
         two joined; the form edits them apart, so the country code is a picker
         rather than something somebody has to remember to type. */
      dial: ct ? (ct.dial || DEFAULT_DIAL) : DEFAULT_DIAL,
      mobile: ct ? (ct.mobile || '') : '',
      email: ct ? (ct.email || '') : '',
      gst: (client && client.gst) || '',
      note: ''
    };
  }

  /* What is still owed ON ONE INVOICE, after any advance against it. The state
     says cleared or not; this says how much of it is actually outstanding. */
  function invoiceLeft(inv) {
    if (!inv) return 0;
    if (inv.state === 'paid') return 0;
    return Math.max(0, (inv.amount || 0) - (inv.advance || 0));
  }
  function invoiceOverdue(inv, today_) {
    if (!inv || inv.state === 'paid' || inv.state === 'draft') return false;
    /* "On Handover" is a due date with no day in it. Nothing has passed, so
       nothing is overdue, and calling it overdue would put a red pill on an
       invoice that is behaving exactly as agreed. */
    if (inv.due_text) return false;
    var left = daysLeft(inv.due, today_);
    return left !== null && left < 0;
  }
  function owedOn(invoices, oppId) {
    return (invoices || []).filter(function (i) {
      return (!oppId || i.opp === oppId) && i.state !== 'paid' && i.state !== 'draft';
    }).reduce(function (a, i) { return a + invoiceLeft(i); }, 0);
  }

  /* Everything taken in advance, whether or not the invoice is cleared. Counted
     separately because an advance is real money that has arrived, and treating
     it as nothing until the invoice closes understates what is in the bank. */
  function advanceOn(invoices, oppId) {
    return (invoices || []).filter(function (i) { return !oppId || i.opp === oppId; })
      .reduce(function (a, i) { return a + (Number(i.advance) || 0); }, 0);
  }

  /* Split a fee the way it is actually agreed: 50/50, 60/40, or thirds. */
  var SPLITS = {
    '50/50': [0.5, 0.5],
    '60/40': [0.6, 0.4],
    '40/40/20': [0.4, 0.4, 0.2],
    '100': [1]
  };
  function splitFee(total, split) {
    var parts = SPLITS[split] || SPLITS['50/50'];
    var out = parts.map(function (f) { return Math.round(total * f); });
    /* rounding must never lose or invent a rupee */
    var diff = total - out.reduce(function (a, b) { return a + b; }, 0);
    out[out.length - 1] += diff;
    return out;
  }


  /* Documents against the ENGAGEMENT — everything the build runs on. */
  /* Documents against the ENGAGEMENT — what a build needs to move. */
  /* A slot, not a document. Credentials arrive as four screenshots and a
     WhatsApp photo; an MOU can be twenty pages sent in three parts. So every
     one of these holds as many files as it needs, and each file can be opened,
     replaced or removed on its own. */
  var ENGAGEMENT_DOCS = [
    /* ⚠️ MINUTES BEFORE THE MOU, and in that order on the screen, because that is
       the order they happen in. What was agreed in a meeting is what the MOU is
       supposed to say; when the two disagree six weeks later, the minutes are the
       only thing that settles it. Every dispute in this business has started with
       somebody remembering a call differently. */
    { key: 'mom',                label: 'Minutes of meeting (MOM)', group: 'Terms',
      when: 'What was agreed on each call, dated. The thing that settles an argument later.' },
    { key: 'mou',                label: 'MOU',                     group: 'Terms', when: 'Every version, signed or not.' },
    { key: 'proposal',           label: 'Proposal & scope',        group: 'Terms' },
    { key: 'invoices',           label: 'Invoices raised',         group: 'Terms', when: 'The PDFs as they were sent.' },
    { key: 'payment_proof',      label: 'Payment proof',           group: 'Terms', when: 'Screenshots, UTRs, bank advice.' },
    { key: 'onboarding_answers', label: 'Onboarding answers',      group: 'Onboarding', when: 'Everything we asked, answered.' },
    { key: 'client_creds',       label: 'Credentials from them',   group: 'Onboarding', when: 'Hosting, domain, CRM, socials — screenshots are fine.' },
    { key: 'brand_assets',       label: 'Logo & brand assets',     group: 'Onboarding' },
    { key: 'client_chats',       label: 'Conversations worth keeping', group: 'Onboarding', when: 'WhatsApp, email, anything agreed in writing.' },
    { key: 'sample_data',        label: 'Their data',              group: 'Build', when: 'A sheet, an export, a scrape.' },
    { key: 'test_signoff',       label: 'Testing signed off',      group: 'Build' },
    { key: 'handover_note',      label: 'Handover pack',           group: 'Build', when: 'What we gave them, and what they now own.' },
    { key: 'scan',               label: 'Dropped in',              group: 'Unfiled',
      when: 'Uploaded to be read, not yet filed. Edit one to move it to its slot.' }
  ];

  /* Documents against the CLIENT — their billing identity, captured at MOU so
     invoicing never waits on an email. */
  /* Against the CLIENT — their billing identity, captured at MOU so invoicing
     never waits on an email. Also many files per slot. */
  var CLIENT_DOCS = [
    { key: 'gst_cert',   label: 'GST certificate',  group: 'Billing' },
    { key: 'pan',        label: 'PAN',              group: 'Billing' },
    { key: 'bank',       label: 'Bank details',     group: 'Billing', when: 'Theirs, for refunds.' },
    { key: 'logo',       label: 'Logo',             group: 'Brand' },
    { key: 'agreement',  label: 'Signed agreement', group: 'Legal' },
    { key: 'nda',        label: 'NDA',              group: 'Legal', when: 'Where one was asked for.' },
    { key: 'scan',       label: 'Dropped in',       group: 'Unfiled',
      when: 'Uploaded to be read, not yet filed. Edit one to move it to its slot.' }
  ];

  /* Rename a document, or re-file it under a different slot. Both are edits
     somebody needs constantly: a phone names a photo IMG_4471.jpg, and the MOU
     gets uploaded under "Agreement" when it belonged under "Terms". */
  function editDoc(holder, docId, patch) {
    if (!holder) return { error: 'Nothing to edit.' };
    var d = (holder.docs || []).filter(function (x) { return x.id === docId; })[0];
    if (!d) return { error: 'That document is no longer here.' };
    var before = { name: d.name, type: d.type };
    if (patch && nonEmpty(patch.name)) d.name = String(patch.name).trim();
    if (patch && nonEmpty(patch.type)) d.type = patch.type;
    return { doc: d, before: before };
  }

  function docTypes(kind) { return kind === 'client' ? CLIENT_DOCS : ENGAGEMENT_DOCS; }
  function docLabel(kind, key) {
    var d = docTypes(kind).filter(function (x) { return x.key === key; })[0];
    return (d && d.label) || key;
  }

  /* One uploaded file. A photographed document is kept and shown; anything else
     is recorded by name and size and NOT stored — the demo says so rather than
     pretending, exactly as it does for a walkaround video. */
  function newDoc(o) {
    o = o || {};
    return {
      id: o.id || uid('doc'),
      type: o.type || null,
      name: o.name || '',
      size: o.size || 0,
      mime: o.mime || '',
      too_big: !!o.too_big,          /* kept out of storage on purpose — say so, never pretend */
      data: o.data || null,          // a data URL for an image, null otherwise
      by: o.by || null,
      when: o.when || today(),
      note: o.note || '',
      /* Set when this file IS an invoice the cockpit generated, so the row can
         find its own PDF rather than guessing from the file name. */
      invoice: o.invoice || null,
      /* Set when it was dropped on a communication entry, so it shows on that
         conversation and not only in the Documents tab with no clue why. */
      comm: o.comm || null
    };
  }

/* ================= COMMUNICATION =================

     Every conversation with a brand that somebody should be able to find again:
     a call about something new, an update sent over WhatsApp, a reply worth
     keeping, a meeting nobody wrote minutes for.

     ⚠️ THIS IS NOT A FOLLOW-UP, and the difference is worth stating because the
     two look alike on screen. A follow-up hangs off an ENGAGEMENT and carries a
     next date and an outcome: it is the machinery of chasing one deal, and the
     board flags the ones that go quiet. This hangs off the COMPANY and carries
     neither. Most of what gets said to a client belongs to no deal at all, and
     filing it as a follow-up would mean inventing an engagement for every
     conversation until the board filled with deals nobody is working.

     ⚠️ THE CHANNEL LIST IS FOLLOW_METHODS, deliberately. A call is a call
     whichever screen it was logged on, and two lists of the same idea drift
     apart within a month: one grows "Online meet" and the other does not. */

  function newComm(o) {
    o = o || {};
    return {
      id: o.id || uid('cm'),
      /* the day it HAPPENED, which is not always the day it was written down */
      at: o.at || today(),
      channel: o.channel || FOLLOW_METHODS[0],
      note: o.note || '',
      by: o.by || null,
      logged: o.logged || today()
    };
  }

  /* Newest first, because the question is almost always "what was the last thing
     we said to them". Defensive about the field existing at all: a client record
     written before this feature has no `comms`, and reading it must not throw. */
  function commsOf(client) {
    return ((client && client.comms) || []).slice().sort(function (a, b) {
      return String(b.at).localeCompare(String(a.at)) ||
             String(b.logged).localeCompare(String(a.logged));
    });
  }

  function addComm(client, o) {
    if (!client) return { error: 'No client to log it against.' };
    var note = String((o && o.note) || '').trim();
    if (!note) return { error: 'Write what was said.' };
    if (!Array.isArray(client.comms)) client.comms = [];
    var c = newComm(o);
    c.note = note;
    client.comms.unshift(c);
    client.last_touch = today();
    return { ok: true, comm: c };
  }

  function editComm(client, id, patch) {
    var c = ((client && client.comms) || []).filter(function (x) { return x.id === id; })[0];
    if (!c) return { error: 'That entry is no longer here.' };
    ['at', 'channel', 'note'].forEach(function (k) {
      if (patch && patch[k] !== undefined) c[k] = patch[k];
    });
    return { ok: true, comm: c };
  }

  function dropComm(client, id) {
    if (!client || !Array.isArray(client.comms)) return { error: 'Nothing to remove.' };
    var before = client.comms.length;
    client.comms = client.comms.filter(function (x) { return x.id !== id; });
    return before === client.comms.length ? { error: 'That entry is no longer here.' } : { ok: true };
  }

  /* The files dropped on one entry. They are ordinary documents on the client
     with a back-reference, so open, download, share and edit are the ones that
     already exist rather than a second set that behaves slightly differently. */
  function docsOfComm(client, commId) {
    return ((client && client.docs) || []).filter(function (d) { return d && d.comm === commId; });
  }

  /* The last thing said to them, for anything that needs one line rather than a
     list: a client row, Mark's brief, a prospect card. */
  function lastComm(client) { return commsOf(client)[0] || null; }

  function docsOf(holder) { return (holder && holder.docs) || []; }
  /* The generated PDF for one invoice, if it has been made. Newest wins: making
     it again replaces what the row points at, which is what somebody expects
     after correcting a figure. */
  function docOfInvoice(docs, invoiceId) {
    var mine = (docs || []).filter(function (d) { return d && d.invoice === invoiceId; });
    return mine.sort(function (a, b) { return String(b.when).localeCompare(String(a.when)); })[0] || null;
  }
  /* Every file filed under one slot, newest first. */
  function docsIn(holder, type) {
    return docsOf(holder).filter(function (d) { return d.type === type; })
      .sort(function (a, b) { return String(b.when).localeCompare(String(a.when)); });
  }
  function docCount(holder, type) { return docsIn(holder, type).length; }
  function hasDoc(holder, type) {
    return docsOf(holder).some(function (d) { return d.type === type; });
  }
  function missingDocs(holder, types) {
    return (types || []).filter(function (t) { return !hasDoc(holder, t); });
  }

  function newProc(o) {
    o = o || {};
    return {
      stage: o.stage || PROC_STAGES[0],
      started: o.started || today(),
      docs: o.docs || [],
      handed_over: o.handed_over || null,
      rc_no: o.rc_no || null,
      done: o.done || null
    };
  }

  /* A build is in delivery from the moment it is signed. There is no terminal
     stage: the ladder ends at Running, which is a steady state — live, ours to
     watch — not a finish line. This used to exclude a stage called 'Completed',
     a dealer name that is not on this board, so the comparison did nothing. */
  function isProcessing(opp) {
    return !!(opp && opp.proc);
  }
  function procDeals(opps) { return (opps || []).filter(isProcessing); }

  /* Both clocks run from the sale, not from the stage. */
  function procDue(opp) {
    if (!opp || !opp.proc) return null;
    /* The date the client was promised, not a fixed clock. */
    var plan = opp.proc.plan || {};
    return plan['Handover'] ||
           addDays(opp.closed || opp.proc.started, (opp.proc.duration || PLAN_DEFAULT));
  }
  /* Date arithmetic in UTC, deliberately.

     Parsing '2026-09-01T00:00:00' gives LOCAL midnight; toISOString() then
     converts back to UTC, and in IST that lands on the previous day. A sale on
     the 1st came out due on the 14th rather than the 15th — every deadline in
     the country a day early. Both ends stay in UTC so the arithmetic is on
     calendar days and nothing else. */
  function addDays(iso, n) {
    var t = new Date(String(iso) + 'T00:00:00Z');
    if (isNaN(t.getTime())) return null;
    t.setUTCDate(t.getUTCDate() + n);
    return t.toISOString().slice(0, 10);
  }
  function daysLeft(iso, from) {
    if (!iso) return null;
    var a = new Date(String(from || today()) + 'T00:00:00Z');
    var b = new Date(String(iso) + 'T00:00:00Z');
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    return Math.round((b - a) / 86400000);
  }

  /* Red only where it is actually a problem: the two statutory steps, once the
     fourteen days have run out and the document still is not in. */
  /* Late means a date we promised has gone by unmet — not a missing document. */
  function procOverdue(opp, today_) {
    if (!isProcessing(opp)) return false;
    return planSlipped(opp, today_).length > 0;
  }


  function procProgress(opp) {
    if (!opp || !opp.proc) return { done: 0, total: PROC_STAGES.length - 1, pct: 0 };
    var i = PROC_STAGES.indexOf(opp.proc.stage);
    var total = PROC_STAGES.length - 1;
    var done = i < 0 ? 0 : i;
    return { done: done, total: total, pct: Math.round(100 * done / total) };
  }

  /* Opening the processing file is what winning a deal does now. */
  function startProc(opp, when) {
    if (!opp || opp.outcome !== 'won') return { error: 'Only a won deal goes into processing.' };
    if (opp.proc) return { proc: opp.proc };
    opp.proc = newProc({ started: when || opp.closed || today() });
    return { proc: opp.proc };
  }

  /* The paperwork gates the stage. Refusing with the name of the missing
     document is the whole point — "you cannot hand the product over without a
     signed delivery note" is a sentence, not an error code. */
  function moveProc(opp, stage) {
    if (!opp || !opp.proc) return { error: 'This deal has no processing file.' };
    var from = PROC_STAGES.indexOf(opp.proc.stage);
    var to = PROC_STAGES.indexOf(stage);
    if (to < 0) return { error: 'There is no ' + stage + ' stage.' };
    if (to === from) return { opp: opp };
    if (to > from) {
      /* everything up to the stage being left must be in */
      for (var i = from; i < to; i++) {
        var miss = missingDocs(opp.proc, PROC_NEEDS[PROC_STAGES[i]]);
        if (miss.length) {
          return { error: PROC_STAGES[i] + ' still needs ' + miss.map(function (m) {
            return docLabel('deal', m).toLowerCase();
          }).join(' and ') + '.' };
        }
      }
    }
    opp.proc.stage = stage;
    opp.updated = today();
    if (stage === 'Handover' && !opp.proc.handed_over) opp.proc.handed_over = today();
    if (stage === 'Completed') opp.proc.done = today();
    return { opp: opp };
  }

  /* ---- deleting ----

     Deliberately NOT a capability the owner can hand out. "Only the owner"
     was the requirement, and a grantable permission would quietly contradict
     it — the same reasoning as canSetPass() and the owner's own row.

     And a delete is refused outright once money has moved: an invoice that was
     paid is a record, not a draft, and the way to end a deal that went wrong is
     to mark it Lost, which keeps the history. */
  function canDelete(actor) { return !!actor && actor.role === 'owner'; }

  function deleteBlockers(opp, invoices) {
    var out = [];
    var mine = (invoices || []).filter(function (i) { return i.opp === opp.id; });
    var paid = mine.filter(function (i) { return i.state === 'paid'; });
    if (paid.length) {
      out.push(paid.length + ' paid invoice' + (paid.length === 1 ? '' : 's') +
               ' worth ' + money(paid.reduce(function (a, i) { return a + i.amount; }, 0)));
    }
    if (opp.outcome === 'won') out.push('it is a won deal — mark it Lost instead if it fell through');
    if (opp.proc) out.push('it is on the delivery board at ' + opp.proc.stage);
    return out;
  }

  /* What disappears, said out loud before it does. */
  function deleteCost(opp, invoices, followups) {
    return {
      invoices: (invoices || []).filter(function (i) { return i.opp === opp.id; }).length,
      followups: (followups || []).filter(function (f) { return f.opp === opp.id; }).length,
      requirements: (opp.requirements || []).length,
      meetings: (opp.meetings || []).length,
      deliverables: (opp.deliverables || []).length,
      documents: docsOf(opp).length + docsOf(opp.proc).length
    };
  }

  /* ================= THE BIN =================

     Nothing is deleted. It is moved, kept for thirty days, and then it goes.

     WHY, and it is not politeness. Deleting is the one action in here with no
     undo, done by a person who is usually sure and occasionally wrong, on a
     record that took somebody an afternoon to fill in. Every other mistake in
     this cockpit costs an edit. That one used to cost everything, permanently,
     with a confirmation box as the only thing standing in the way. A bin turns
     the worst failure in the system into a mild one.

     WHOLE RECORDS, NOT REFERENCES. A binned engagement carries its own
     follow-ups, invoices and documents inside it, because they are deleted with
     it and restoring half of something is worse than restoring none of it.

     THIRTY DAYS, then it is gone for good, swept on load rather than by a timer
     somebody has to keep alive. */

  var BIN_DAYS = 30;

  function binPut(store, kind, record, extra, actor) {
    store.bin = store.bin || [];
    store.bin.unshift({
      id: uid('bin'),
      kind: kind,                       /* 'opportunity' | 'client' | 'document' */
      record: JSON.parse(JSON.stringify(record)),
      with: extra || {},                /* everything that went with it */
      label: binLabel(kind, record),
      at: new Date().toISOString(),
      by: (actor && actor.id) || null
    });
    return store.bin[0];
  }

  function binLabel(kind, r) {
    if (kind === 'client') return r.name || 'A client';
    if (kind === 'document') return r.name || 'A document';
    return r.title || r.ref || 'An engagement';
  }

  /* How long is left, in days. Negative means it is due to go. */
  function binDaysLeft(row, today_) {
    var gone = addDays(String(row.at).slice(0, 10), BIN_DAYS);
    return daysLeft(gone, today_);
  }

  /* Swept on load. A timer nobody keeps alive is a promise nobody keeps. */
  function binSweep(store, today_) {
    var before = (store.bin || []).length;
    store.bin = (store.bin || []).filter(function (r) {
      var left = binDaysLeft(r, today_);
      return left === null || left > 0;
    });
    return before - store.bin.length;
  }

  function deleteOpp(store, id, actor) {
    var opp = (store.opportunities || []).filter(function (o) { return o.id === id; })[0];
    if (!opp) return { error: 'No such opportunity.' };
    if (!canDelete(actor)) return { error: 'Only the owner can delete an opportunity.' };
    var blockers = deleteBlockers(opp, store.invoices);
    if (blockers.length) return { error: 'Cannot delete: ' + blockers.join('; ') + '.' };

    /* everything that goes with it, kept WITH it */
    var gone = {
      followups: (store.followups || []).filter(function (f) { return f.opp === id; }),
      invoices: (store.invoices || []).filter(function (i) { return i.opp === id; }),
      purchases: []
    };
    (store.clients || []).forEach(function (c) {
      (c.purchased || []).forEach(function (p) {
        if (p.opp === id) gone.purchases.push({ client: c.id, row: p });
      });
    });
    var row = binPut(store, 'opportunity', opp, gone, actor);

    store.opportunities = store.opportunities.filter(function (o) { return o.id !== id; });
    store.followups = (store.followups || []).filter(function (f) { return f.opp !== id; });
    store.invoices = (store.invoices || []).filter(function (i) { return i.opp !== id; });
    (store.clients || []).forEach(function (c) {
      c.purchased = (c.purchased || []).filter(function (p) { return p.opp !== id; });
    });
    return { opp: opp, bin: row };
  }

  /* ---------------- deleting a client ----------------

     A client takes its engagements, its contacts and its documents with it, and
     they all go into the bin together as one thing. Half a company left behind
     is worse than none: an engagement whose client has gone is an orphan every
     screen has to guard against, and one of them always forgets. */
  function clientBlockers(store, client) {
    var out = [];
    var opps = (store.opportunities || []).filter(function (o) { return o.client === client.id; });
    var paid = (store.invoices || []).filter(function (i) {
      return i.state === 'paid' && opps.some(function (o) { return o.id === i.opp; });
    });
    if (paid.length) {
      out.push(paid.length + ' paid invoice' + (paid.length === 1 ? '' : 's') +
               ' worth ' + money(paid.reduce(function (a, i) { return a + i.amount; }, 0)));
    }
    if (opps.some(function (o) { return o.outcome === 'won'; })) {
      out.push('a won engagement, which is a record of work done');
    }
    return out;
  }

  function clientCost(store, client) {
    var opps = (store.opportunities || []).filter(function (o) { return o.client === client.id; });
    var ids = opps.map(function (o) { return o.id; });
    return {
      'engagement': opps.length,
      'contact': contactsOf(client).length,
      'document': (client.docs || []).length +
        opps.reduce(function (a, o) { return a + (o.docs || []).length; }, 0),
      'follow-up': (store.followups || []).filter(function (f) { return ids.indexOf(f.opp) >= 0; }).length,
      'invoice': (store.invoices || []).filter(function (i) { return ids.indexOf(i.opp) >= 0; }).length
    };
  }

  function deleteClient(store, id, actor) {
    var client = (store.clients || []).filter(function (c) { return c.id === id; })[0];
    if (!client) return { error: 'No such client.' };
    if (!canDelete(actor)) return { error: 'Only the owner can delete a client.' };
    var blockers = clientBlockers(store, client);
    if (blockers.length) return { error: 'Cannot delete: ' + blockers.join('; ') + '.' };

    var opps = (store.opportunities || []).filter(function (o) { return o.client === id; });
    var ids = opps.map(function (o) { return o.id; });
    var gone = {
      opportunities: opps,
      followups: (store.followups || []).filter(function (f) {
        return f.client === id || ids.indexOf(f.opp) >= 0;
      }),
      invoices: (store.invoices || []).filter(function (i) {
        return i.client === id || ids.indexOf(i.opp) >= 0;
      }),
      messages: (store.messages || []).filter(function (m) { return m.client === id; })
    };
    var row = binPut(store, 'client', client, gone, actor);

    store.clients = store.clients.filter(function (c) { return c.id !== id; });
    store.opportunities = (store.opportunities || []).filter(function (o) { return o.client !== id; });
    store.followups = (store.followups || []).filter(function (f) {
      return f.client !== id && ids.indexOf(f.opp) < 0;
    });
    store.invoices = (store.invoices || []).filter(function (i) {
      return i.client !== id && ids.indexOf(i.opp) < 0;
    });
    store.messages = (store.messages || []).filter(function (m) { return m.client !== id; });
    return { client: client, bin: row, took: gone };
  }

  /* ---------------- putting it back ----------------
     Restoring is the whole point of the bin, so it has to work on a record whose
     neighbours have moved on: an engagement whose client was deleted after it
     was, a document whose holder is gone. Say so rather than half-restoring. */
  function binRestore(store, binId) {
    var row = (store.bin || []).filter(function (r) { return r.id === binId; })[0];
    if (!row) return { error: 'That is no longer in the bin.' };
    var w = row.with || {};

    if (row.kind === 'opportunity') {
      var c = (store.clients || []).filter(function (x) { return x.id === row.record.client; })[0];
      if (!c) return { error: 'The client it belonged to has gone too. Restore them first.' };
      store.opportunities = (store.opportunities || []).concat([row.record]);
      store.followups = (store.followups || []).concat(w.followups || []);
      store.invoices = (store.invoices || []).concat(w.invoices || []);
      (w.purchases || []).forEach(function (p) {
        var cl = (store.clients || []).filter(function (x) { return x.id === p.client; })[0];
        if (cl) cl.purchased = (cl.purchased || []).concat([p.row]);
      });
    } else if (row.kind === 'client') {
      if ((store.clients || []).some(function (x) { return x.id === row.record.id; })) {
        return { error: 'That client is already back.' };
      }
      store.clients = (store.clients || []).concat([row.record]);
      store.opportunities = (store.opportunities || []).concat(w.opportunities || []);
      store.followups = (store.followups || []).concat(w.followups || []);
      store.invoices = (store.invoices || []).concat(w.invoices || []);
      store.messages = (store.messages || []).concat(w.messages || []);
    } else if (row.kind === 'document') {
      var holder = w.kind === 'client'
        ? (store.clients || []).filter(function (x) { return x.id === w.holder; })[0]
        : (store.opportunities || []).filter(function (x) { return x.id === w.holder; })[0];
      if (!holder) return { error: 'What it was filed against has gone. Restore that first.' };
      var into = (w.kind !== 'client' && holder.proc) ? holder.proc : holder;
      into.docs = (into.docs || []).concat([row.record]);
    } else {
      return { error: 'I do not know how to put that back.' };
    }

    store.bin = (store.bin || []).filter(function (r) { return r.id !== binId; });
    return { restored: row };
  }

  function binDrop(store, binId) {
    var row = (store.bin || []).filter(function (r) { return r.id === binId; })[0];
    if (!row) return { error: 'That is no longer in the bin.' };
    store.bin = store.bin.filter(function (r) { return r.id !== binId; });
    return { dropped: row };
  }

  function loseOpp(opp, reason, when) {
    opp.stage = 'Lost';
    opp.outcome = 'lost';
    opp.lost_reason = reason || null;
    opp.closed = when || today();
    opp.updated = opp.closed;
    return { opp: opp };
  }

  /* ---------------- follow-ups ----------------
     Every conversation gets written down: when it happened, how, what was said,
     and when to come back. An opportunity without a next date is the one that
     goes quiet, so the board can flag it. */

  var FOLLOW_METHODS = ['Call', 'WhatsApp', 'Email', 'Meeting', 'Online meet', 'Site visit', 'Message'];
  /* ⚠️ THE OUTCOME THAT ENDS THE CHASING. They are ready to sign, so there is no
     next follow-up to book: what matters now is the day the money is expected.
     Kept as a named list rather than a string compared in three files, because
     the wording of an outcome is the sort of thing that gets edited. */
  var NO_NEXT_DATE = ['Ready to sign'];
  function needsNextDate(outcome) { return NO_NEXT_DATE.indexOf(String(outcome || '')) < 0; }
  var FOLLOW_OUTCOMES = [
    'Going well — still keen',
    'Wants time to think',
    'Asked for a better price',
    'Waiting on their budget',
    'Comparing us with another agency',
    'Could not reach them',
    'Cooling off — at risk',
    'Ready to sign'
  ];
  /* Outcomes that mean the deal is slipping away. The board shows these loudly
     because that is the moment you can still save it. */
  var AT_RISK = ['Cooling off — at risk', 'Comparing us with another agency', 'Could not reach them'];

  function newFollow(o) {
    o = o || {};
    return {
      id: o.id || uid('f'),
      opp: o.opp || null, client: o.client || null, owner: o.owner || null,
      line: o.line || null,             // which line this conversation was about
      due: o.due || today(),          // when to come back
      method: o.method || 'Call',
      note: o.note || '',             // what was actually discussed
      outcome: o.outcome || null,
      done: !!o.done, done_at: o.done_at || null,
      created: o.created || today(),
      by: o.by || null
    };
  }

  function followsFor(list, key, id) {
    return (list || []).filter(function (f) { return f[key] === id; })
      .sort(function (a, b) { return String(b.due).localeCompare(String(a.due)); });
  }
  function openFollows(list) { return (list || []).filter(function (f) { return !f.done; }); }

  function isOverdue(f, now) {
    return !f.done && String(f.due) < (now || today());
  }
  function isDueToday(f, now) {
    return !f.done && String(f.due) === (now || today());
  }

  /* ---------------- scoring a follow-up note ----------------
     A rating out of ten for what the salesperson actually wrote down, so a
     manager can see who is having real conversations and who is typing "called,
     no answer" fifty times. Deliberately a transparent rule set rather than a
     black box — the UI shows exactly which marks were earned and which were not,
     because a score nobody can argue with is a score nobody trusts. */

  var NOTE_RULES = [
    ['Enough detail to be useful', 2, function (t) {
      var w = t.trim().split(/\s+/).filter(Boolean).length;
      return w >= 25 ? 2 : w >= 12 ? 1 : 0;
    }],
    ['Names what they discussed', 2, function (t, ctx) {
      var names = (ctx.lineNames || []).filter(function (n) {
        return n && t.toLowerCase().indexOf(String(n).toLowerCase()) >= 0;
      });
      if (names.length) return 2;
      return /\b(cockpit|build|scope|phase|demo|automation|integration|portal)\b/i.test(t) ? 1 : 0;
    }],
    ['Records a number — price, EMI, kilometres', 1, function (t) {
      return /\d[\d,.]*\s*(lakh|l\b|cr|crore|k\b|km|%|₹)|₹\s*\d/i.test(t) ? 1 : 0;
    }],
    ['Captures what the client said or wants', 2, function (t) {
      return /\b(said|wants|asked|prefers|worried|likes|liked|thinks|feels|needs|concern|budget|compare|comparing|objection)\b/i.test(t)
        ? 2 : 0;
    }],
    ['Sets up a clear next step', 2, function (t) {
      return /\b(will|next|call back|follow up|send|share|bring|visit|come|book|schedule|revert|confirm|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|saturday)\b/i.test(t)
        ? 2 : 0;
    }],
    ['An outcome was chosen', 1, function (t, ctx) { return ctx.outcome ? 1 : 0; }]
  ];

  function scoreNote(text, ctx) {
    ctx = ctx || {};
    var t = String(text || '');
    if (!t.trim()) {
      return { score: 0, max: 10, band: 'bad', marks: NOTE_RULES.map(function (r) {
        return { label: r[0], got: 0, max: r[1] };
      }), verdict: 'Nothing was written down.' };
    }
    var marks = NOTE_RULES.map(function (r) {
      var got = 0;
      try { got = Math.min(r[1], r[2](t, ctx) || 0); } catch (e) { got = 0; }
      return { label: r[0], got: got, max: r[1] };
    });
    var score = marks.reduce(function (a, m) { return a + m.got; }, 0);
    return {
      score: score, max: 10, marks: marks,
      band: score >= 8 ? 'ok' : score >= 5 ? 'warn' : 'bad',
      verdict: score >= 8 ? 'A proper record of the conversation.'
             : score >= 5 ? 'Usable, but thin in places.'
             : 'Too vague for anyone else to act on.'
    };
  }

  /* A salesperson's average, for the reports screen. */
  function noteAverage(follows, userId, products) {
    var names = (products || []).map(function (c) { return c.model; });
    var done = (follows || []).filter(function (f) {
      return f.done && f.note && (!userId || (f.by || f.owner) === userId);
    });
    if (!done.length) return null;
    var total = done.reduce(function (a, f) {
      return a + scoreNote(f.note, { outcome: f.outcome, lineNames: names }).score;
    }, 0);
    return Math.round(10 * total / done.length) / 10;
  }

  /* The next thing owed to this opportunity, soonest first. */
  function nextFollow(list, oppId) {
    return (list || []).filter(function (f) { return f.opp === oppId && !f.done; })
      .sort(function (a, b) { return String(a.due).localeCompare(String(b.due)); })[0] || null;
  }

  function atRisk(list, oppId) {
    var done = (list || []).filter(function (f) { return f.opp === oppId && f.done && f.outcome; })
      .sort(function (a, b) { return String(b.done_at).localeCompare(String(a.done_at)); })[0];
    return !!(done && AT_RISK.indexOf(done.outcome) >= 0);
  }

  /* An opportunity with nothing booked in is how deals die quietly. */
  function needsAttention(opps, follows, now) {
    return (opps || []).filter(isOpen).filter(function (o) {
      var n = nextFollow(follows, o.id);
      return !n || isOverdue(n, now);
    });
  }


  /* What a salesperson needs on screen before opening a second opportunity for
     somebody who has already bought from us. */
  /* What a deal is worth. The fee somebody typed, and nothing inferred. */
  function oppValue(o) { return (o && o.fee) || 0; }

  function newRequirement(o) {
    o = o || {};
    return { id: o.id || uid('rq'),
             text: String(o.text || '').trim(), at: o.at || today(),
             by: o.by || null, stage: o.stage || null };
  }
  var MEETING_KINDS = ['Discovery', 'Pitch', 'Review', 'Onboarding', 'Training', 'Catch-up'];
  var MEETING_LENGTHS = [15, 30, 45, 60, 90, 120];
  /* A meeting is either a video call or somewhere you have to be. Those need
     different things: one needs a link, the other needs an address, and nothing
     useful is served by pretending they are the same. */
  var MEETING_MODES = { meet: 'Google Meet', person: 'In person', phone: 'Phone call' };

  function newMeeting(o) {
    o = o || {};
    var mode = MEETING_MODES[o.mode] ? o.mode : 'meet';
    return { id: o.id || uid('mt'),
             kind: o.kind || 'Discovery',
             mode: mode,
             at: o.at || today(), time: o.time || '',
             /* how long it runs, so the calendar entry is not a guess */
             mins_long: Number(o.mins_long) || 60,
             /* where, for anything that is not a video call */
             where: String(o.where || '').trim(),
             /* the video link, and the calendar event it belongs to, so a
                cancellation later has something to cancel */
             link: String(o.link || '').trim(),
             event: String(o.event || '').trim(),
             who: o.who || '', by: o.by || null,
             minutes: String(o.minutes || '').trim(),
             done: o.done !== false };
  }

  /* What a booked meeting is missing, said plainly rather than left to be
     noticed. A video call with no link and a visit with no address are both
     appointments somebody will turn up to the wrong way. */
  function meetingGap(m) {
    if (!m || m.done) return '';
    if (m.mode === 'person') return m.where ? '' : 'no address yet';
    if (m.mode === 'phone') return '';
    return m.link ? '' : 'no Meet link yet';
  }
  function newDeliverable(o) {
    o = o || {};
    return { id: o.id || uid('dl'),
             label: String(o.label || '').trim(), url: o.url || '',
             at: o.at || today(), by: o.by || null, note: o.note || '' };
  }
  function upcoming(list, today_) {
    var t = today_ || today();
    return (list || []).filter(function (m) { return !m.done && String(m.at) >= t; })
      .sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); });
  }

  function clientSummary(client, opps, products) {
    var byId = {};
    (products || []).forEach(function (c) { byId[c.id] = c; });
    var mine = oppsFor(opps, client.id);
    var bought = (client.purchased || []).map(function (p) {
      return Object.assign({}, p, { line: byId[p.product_id] || null });
    });
    return {
      bought: bought,
      spent: bought.reduce(function (a, p) { return a + (p.price || 0); }, 0),
      open: mine.filter(isOpen),
      closed: mine.filter(function (o) { return !isOpen(o); }),
      won: mine.filter(function (o) { return o.outcome === 'won'; }).length,
      lost: mine.filter(function (o) { return o.outcome === 'lost'; }).length,
      shown: (client.shown || []).map(function (s) {
        return { mark: s.mark, when: s.when, line: byId[s.product_id] || null };
      }).filter(function (s) { return s.line; })
    };
  }

  /* A returning client is worth more than a first-timer, and the board should see
     that before they speak. Derived, never stored. */
  /* Where a client stands with us, read off the engagements themselves.

     This used to total `client.purchased`, a denormalised array only winOpp()
     writes — so every client the seed marked won read as a Prospect, including
     three whose builds are live. The engagements are the truth; the tier is a
     view of them. The thresholds are agency-scale too: this asked for ₹1 crore
     before it would say Premium, which is a car showroom's number, not ours. */
  function clientTier(client, opps) {
    var mine = (opps || []).filter(function (o) { return o.client === client.id; });
    var won = mine.filter(function (o) { return o.outcome === 'won'; });
    var billed = won.reduce(function (a, o) { return a + (o.won_price || o.fee || 0); }, 0);
    if (billed >= 500000 || won.length >= 3) return ['Key account', 'em'];
    if (won.length >= 2) return ['Returning', 'ok'];
    if (won.length === 1) return ['Client', 'ok'];
    if (mine.some(isOpen)) return ['Active', 'info'];
    return ['Prospect', 'dim'];
  }


  /* ================= DATES, RANGES AND TARGETS =================
     Anywhere a screen shows more than a handful of rows it carries the same
     date control, so "this month" means the same thing everywhere. Dates are
     plain YYYY-MM-DD strings throughout — they compare correctly as text and
     never pick up a timezone on the way. */

  var RANGES = [
    ['today', 'Today'], ['week', 'This week'], ['month', 'This month'],
    ['last', 'Last month'], ['quarter', 'This quarter'], ['year', 'This year'],
    ['all', 'All time'], ['custom', 'Custom…']
  ];

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseISO(s) {
    var p = String(s || '').slice(0, 10).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function monthKey(s) { return String(s || '').slice(0, 7); }

  /* A range key becomes a pair of inclusive YYYY-MM-DD bounds. */
  function rangeDates(key, from, to, now) {
    var d = now ? parseISO(now) : new Date();
    var y = d.getFullYear(), m = d.getMonth();
    switch (key) {
      case 'today':   return [iso(d), iso(d)];
      case 'week': {
        var back = (d.getDay() + 6) % 7;          // weeks start Monday
        var s0 = new Date(y, m, d.getDate() - back);
        return [iso(s0), iso(d)];
      }
      case 'month':   return [iso(new Date(y, m, 1)), iso(d)];
      case 'last':    return [iso(new Date(y, m - 1, 1)), iso(new Date(y, m, 0))];
      case 'quarter': return [iso(new Date(y, Math.floor(m / 3) * 3, 1)), iso(d)];
      case 'year':    return [iso(new Date(y, 0, 1)), iso(d)];
      case 'custom':  return [from || '1970-01-01', to || iso(d)];
      default:        return ['1970-01-01', '2999-12-31'];
    }
  }

  function rangeLabel(r) {
    var named = RANGES.filter(function (x) { return x[0] === r.key; })[0];
    if (r.key === 'custom') return r.from + ' to ' + r.to;
    if (r.key === 'all') return 'All time';
    return (named ? named[1] : r.key) + ' (' + r.from + ' to ' + r.to + ')';
  }

  function inRange(dateStr, r) {
    if (!dateStr) return false;
    if (!r || r.key === 'all') return true;
    var d = String(dateStr).slice(0, 10);
    return d >= r.from && d <= r.to;
  }

  /* How many whole months a range spans, so a monthly target can be pro-rated
     rather than compared against a quarter and looking like a catastrophe. */
  function monthsIn(r) {
    if (!r || r.key === 'all') return 12;
    var a = parseISO(r.from), b = parseISO(r.to);
    var months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    /* Divide by the real length of the closing month, not a flat 30, or a whole
       calendar August comes out as 1.03 months and a perfect score reads 97%. */
    var daysInEnd = new Date(b.getFullYear(), b.getMonth() + 1, 0).getDate();
    return Math.max(0.03, months + (b.getDate() - a.getDate() + 1) / daysInEnd);
  }

  /* Monthly target per salesperson. The owner changes these in the console. */
  /* Pitched at the real run-rate — 19 products in eight months across two people —
     so the dashboard shows a mix of green and amber rather than a wall of red. */
  var DEFAULT_TARGETS = {
    u3: { units: 2, value: 8000000 },
    u4: { units: 2, value: 6000000 }
  };

/* ⚠️ A SALE IS DERIVED FROM THE ENGAGEMENT, NOT KEPT BESIDE IT.
     `D.sales` was a second list, written only when somebody pressed Won and
     NEVER sent to or read back from the server. So every sync reset it to empty
     and every target, every report and every "sold in window" read zero for ever,
     on a book with a signed engagement in it. Two sources of truth for "what did
     we sell", and the one everything read was the one nothing maintained.

     There is one source now: the engagements, which already carry the fee, the
     owner, the line and the dates, and which sync properly.

     ⚠️ WHAT COUNTS AS SOLD. Not only `Won`. An engagement at **Invoiced** is
     signed in principle with the first invoice raised: it is contracted revenue
     and the owner counts it the day it happens, which is exactly what he meant by
     "we already closed a 2.4 lakh deal". A deal still at Pitched counts nothing.

     ⚠️ WHEN IT COUNTS. The day it was contracted, which is `closed` for a won
     deal, the first invoice's date for one still being delivered, and `updated`
     only as a last resort. Dating it by `created` would put a deal signed in
     October into August's target. */
  var CONTRACTED_STAGES = ['Invoiced'];
  function isContracted(o) {
    return !!o && (o.outcome === 'won' || CONTRACTED_STAGES.indexOf(o.stage) >= 0);
  }
  function contractedOn(o, invoices) {
    if (!o) return null;
    if (o.outcome === 'won' && o.closed) return o.closed;
    var mine = (invoices || []).filter(function (i) { return i.opp === o.id && i.raised; })
      .map(function (i) { return i.raised; }).sort();
    return mine[0] || o.closed || o.updated || o.created || null;
  }

  /* Every sale, as rows shaped the way the reports already expect. */
  function salesOf(store) {
    var invoices = (store && store.invoices) || [];
    return ((store && store.opportunities) || []).filter(isContracted).map(function (o) {
      return {
        id: 'sale-' + o.id, opp: o.id, client: o.client,
        product_id: o.product, line: productName(o.product),
        /* what it actually sold for when that is recorded, not the quoted fee */
        price: o.won_price || oppValue(o), by: o.assigned_to || null,
        at: contractedOn(o, invoices),
        won: o.outcome === 'won'
      };
    }).filter(function (s) { return !!s.at; });
  }

  function salesFor(sales, userId, r) {
    return (sales || []).filter(function (s) {
      if (userId && s.by !== userId) return false;
      return inRange(s.at, r);
    });
  }

  function targetProgress(sales, userId, target, r) {
    var rows = salesFor(sales, userId, r);
    var units = rows.length;
    var value = rows.reduce(function (a, s) { return a + (s.price || 0); }, 0);
    var mul = monthsIn(r);
    var tUnits = (target && target.units ? target.units : 0) * mul;
    var tValue = (target && target.value ? target.value : 0) * mul;
    /* A window shorter than a few days pro-rates to a target below one product.
       Scoring against that is meaningless, so say nothing rather than red. */
    /* ⚠️ VALUE IS SCORED ON ITS OWN. Both percentages used to be gated on the
       BUILDS target reaching one, so somebody carrying a 4 lakh monthly value
       target and no build target scored nothing at all: the bar read "— of 0"
       next to a real sale. The two targets are independent and either one on its
       own is worth scoring against. */
    var judgeUnits = tUnits >= 1;
    var judgeValue = tValue >= 1;
    return {
      units: units, value: value,
      targetUnits: Math.round(tUnits), targetValue: Math.round(tValue),
      unitsPct: judgeUnits ? Math.round(100 * units / tUnits) : null,
      valuePct: judgeValue ? Math.round(100 * value / tValue) : null,
      /* ⚠️ Nothing to score against at all is not the same as a window too short
         to score in. The screen has to say which. */
      noTarget: !judgeUnits && !judgeValue && !(target && (target.units || target.value)),
      tooShort: !judgeUnits && !judgeValue && !!(target && (target.units || target.value)),
      months: mul, sales: rows
    };
  }

  function band(pct) {
    if (pct === null || pct === undefined) return 'dim';
    if (pct >= 100) return 'ok';
    if (pct >= 70) return 'warn';
    return 'bad';
  }

  /* One salesperson's line in a report, for whatever window is selected. */
  function personStats(D, userId, products, r) {
    var clients = (D.clients || []).filter(function (c) { return c.assigned_to === userId; });
    var fresh = clients.filter(function (c) { return inRange(c.created, r); });
    var touched = clients.filter(function (c) { return inRange(c.last_touch, r); });
    var visits = (D.opportunities || []).filter(function (o) {
      return o.assigned_to === userId && inRange(o.created, r);
    });
    var prog = targetProgress(salesOf(D), userId, (D.targets || {})[userId], r);
    var shown = clients.reduce(function (a, c) {
      return a + (c.shown || []).filter(function (x) { return inRange(x.when, r); }).length;
    }, 0);
    /* "Open" means they have a live opportunity — a client has no stage of
       their own any more, so counting one here silently made everybody open. */
    var open = clients.filter(function (c) {
      return openOppsFor(D.opportunities, c.id).length > 0;
    }).length;
    return {
      user: staffById(userId),
      clients: clients.length, newClients: fresh.length, touched: touched.length,
      open: open, visits: visits.length, carsShown: shown,
      sales: prog.units, value: prog.value,
      target: prog, conversion: fresh.length ? Math.round(100 * prog.units / fresh.length) : null,
      follow: (D.followups || []).filter(function (f) { return f.owner === userId && !f.done; }).length,
      noteScore: noteAverage((D.followups || []).filter(function (f) { return inRange(f.done_at, r); }),
                             userId, products)
    };
  }


  /* ================= THE FIELD REGISTRY =================
     What an engagement needs recorded, as editable fields rather than a fixed
     checklist. Completeness walks this, so filling a field in the console moves
     the score immediately. A value lives at product[key], or product.extra[key] once
     someone has added it by hand. */

  function nonEmpty(v) {
    return !(v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length));
  }

    var YESNO = ['Yes', 'No'];

  /* The engagement record. The completeness score off this is what makes it
     obvious that EGO has been running for months with no signed MOU and three
     conflicting invoices — the same trick we use on a client's own listings,
     turned on ourselves.

     `own: false` marks a field the demo layer invented rather than one we
     actually hold, so nothing here flatters us until somebody fills it in. */
  var FIELDS = [
    /* Identity */
    { key: 'client',     label: 'Client name',        group: 'Identity', type: 'text' },
    { key: 'contact',    label: 'Decision maker',     group: 'Identity', type: 'text' },
    { key: 'sector',     label: 'Sector',             group: 'Identity', type: 'text' },
    /* Country, State and City are one chained trio (placeFields), not three
       text boxes: a typed state is how "Maharastra" got into the record */
    { key: 'country',    label: 'Country',            group: 'Identity', type: 'place' },
    { key: 'city',       label: 'City',               group: 'Identity', type: 'place' },
    /* the reader pulls a state off a GST certificate; without a field for it,
       that reading went into the record and appeared on no screen */
    { key: 'state',      label: 'State',              group: 'Identity', type: 'place' },
    { key: 'mobile',     label: 'Mobile',             group: 'Identity', type: 'text' },
    { key: 'email',      label: 'Email',              group: 'Identity', type: 'text' },

    /* Billing identity — captured at MOU, so invoicing never waits */
    { key: 'legal_name', label: 'Registered company name', group: 'Billing', type: 'text' },
    { key: 'address',    label: 'Billing address',    group: 'Billing', type: 'textarea' },
    { key: 'gst',        label: 'GST number',         group: 'Billing', type: 'text' },
    { key: 'pan',        label: 'PAN',                group: 'Billing', type: 'text' },
    { key: 'bank_acc',   label: 'Bank account',       group: 'Billing', type: 'text',
      note: 'Theirs, for refunds. Ours goes on the invoice.' },
    { key: 'ifsc',       label: 'IFSC',               group: 'Billing', type: 'text' },
    /* ⚠️ These two were being FILLED by the document reader and shown nowhere.
       A field a machine can write and a person cannot see is the worst of both:
       it is in the record, it is sometimes wrong, and nobody can correct it. */
    { key: 'bank_name',  label: 'Bank',               group: 'Billing', type: 'text',
      note: 'Which bank, off the cheque or the letter.' },
    { key: 'acct_holder',label: 'Account holder',     group: 'Billing', type: 'text',
      note: 'The name on the account, which is often not the trading name.' },

    /* What they told us before we ever spoke. Answered on the website form and
       never asked again, so the first call starts from what they said rather
       than from scratch. Every one of these is also editable here, because an
       answer given to a form at 11pm is not always the answer they meant. */
    { key: 'team',       label: 'How many would use it', group: 'Qualification', type: 'select',
      options: TEAM_BANDS },
    { key: 'revenue',    label: 'Their turnover',     group: 'Qualification', type: 'text',
      note: 'A band, in their own currency, as the form showed it.' },
    { key: 'budget',     label: 'Budget they named',  group: 'Qualification', type: 'text',
      note: 'What THEY said, not what we quoted. The fee is a separate field.' },
    { key: 'timeline',   label: 'When they want it',  group: 'Qualification', type: 'select',
      options: TIMELINES },
    { key: 'ad',         label: 'Which ad',           group: 'Qualification', type: 'text',
      note: 'The creative inside the campaign. Without it a test month cannot say which ad earned the lead.' },
    { key: 'landed',     label: 'Landed from',        group: 'Qualification', type: 'text',
      note: 'The page or site they arrived from.' },

    /* Terms */
    { key: 'mou',        label: 'MOU state',          group: 'Terms', type: 'select',
      options: ['none', 'sent', 'signed', 'disputed'] },
    { key: 'mou_signed', label: 'MOU signed on',      group: 'Terms', type: 'date' },
    { key: 'split',      label: 'Payment split',      group: 'Terms', type: 'select',
      options: ['50/50', '60/40', '40/40/20', '100'] },

    /* The plan */
    { key: 'duration',   label: 'Build length',       group: 'The plan', type: 'select',
      options: ['30', '60', '90', '120'], unit: 'days' },
    { key: 'started',    label: 'Kickoff date',       group: 'The plan', type: 'date' },
    { key: 'handover_by', label: 'Handover promised', group: 'The plan', type: 'derived',
      pred: function (c) { return !!(c.proc && c.proc.plan && c.proc.plan['Handover']); } },
    { key: 'on_time',    label: 'Nothing slipped',    group: 'The plan', type: 'derived',
      pred: function (c) { return planSlipped(c).length === 0; } },

    /* The build */
    { key: 'repo',       label: 'Repository',         group: 'The build', type: 'text' },
    { key: 'demo',       label: 'Live URL',           group: 'The build', type: 'text' },
    { key: 'deployed',   label: 'Deployed',           group: 'The build', type: 'select', options: YESNO },
    { key: 'checks',     label: 'Checks passing',     group: 'The build', type: 'number' },
    { key: 'stack',      label: 'What it is built on', group: 'The build', type: 'text' },

    /* Credentials — the most dangerous thing in here */
    { key: 'login',      label: 'Demo login',         group: 'Credentials', type: 'text' },
    { key: 'pass',       label: 'Demo password',      group: 'Credentials', type: 'text' },
    { key: 'hosting',    label: 'Hosting access',     group: 'Credentials', type: 'text' },
    { key: 'domain',     label: 'Domain registrar',   group: 'Credentials', type: 'text' },
    { key: 'crm',        label: 'Their CRM / GHL',    group: 'Credentials', type: 'text' },

    /* What we gave away first */
    { key: 'findings',   label: 'Findings handed over', group: 'Value given', type: 'textarea',
      note: 'The faults we found and gave them free. This is what earns the meeting.' },
    { key: 'pitched',    label: 'Actually pitched',   group: 'Value given', type: 'select', options: YESNO,
      note: 'Built and never sent is the most expensive state there is.' }
  ];

  var FIELD_GROUPS = FIELDS.reduce(function (a, f) {
    if (a.indexOf(f.group) < 0) a.push(f.group);
    return a;
  }, []);

  function fieldByKey(k) { return FIELDS.filter(function (f) { return f.key === k; })[0] || null; }

  /* The registry above spans three records: who they are (the client), what we
     agreed (the engagement) and how the build is going (the delivery file). It
     was scored against a PRODUCT for months, which is why nothing ever appeared
     on a screen — a product has no MOU. This composes the one record it is
     actually about, so "what don't we know about this engagement yet" becomes a
     question with an answer. */
  /* The mirror of engagementRecord(): where each field goes when somebody types
     it in. The composer reads from three records, so the writer has to put each
     value back in the one it came from — otherwise a GST number typed on the
     engagement lands nowhere and the panel goes on reporting it missing. */
  var FIELD_HOME = {
    /* on the client */
    client: ['client', 'name'],  sector: ['client', 'sector'],
    mobile: ['client', 'mobile'], email: ['client', 'email'],
    legal_name: ['client', 'legal_name'], gst: ['client', 'gst'], pan: ['client', 'pan'],
    city: ['client', 'address.city'], address: ['client', 'address.line1'],
    state: ['client', 'address.state'],
    bank_acc: ['client', 'bank.account'], ifsc: ['client', 'bank.ifsc'],
    bank_name: ['client', 'bank.name'], acct_holder: ['client', 'bank.holder'],
    contact: ['contact', 'name'],
    /* on the engagement */
    mou: ['opp', 'mou'], mou_signed: ['opp', 'mou_signed'], split: ['opp', 'split'],
    value: ['opp', 'fee'], repo: ['opp', 'repo'], demo: ['opp', 'demo'],
    checks: ['opp', 'checks'], stack: ['opp', 'stack'], login: ['opp', 'login'],
    pass: ['opp', 'pass'], hosting: ['opp', 'hosting'], domain: ['opp', 'domain'],
    crm: ['opp', 'crm'], findings: ['opp', 'findings'], pitched: ['opp', 'pitched'],
    deployed: ['opp', 'demo'],
    team: ['opp', 'team'], revenue: ['opp', 'revenue'], budget: ['opp', 'budget'],
    timeline: ['opp', 'timeline'], ad: ['opp', 'ad'], landed: ['opp', 'landed'],
    /* on the delivery file */
    duration: ['proc', 'duration'], started: ['proc', 'started']
  };

  function putPath(obj, path, v) {
    var parts = String(path).split('.');
    while (parts.length > 1) {
      var k = parts.shift();
      if (!obj[k] || typeof obj[k] !== 'object') obj[k] = {};
      obj = obj[k];
    }
    obj[parts[0]] = v;
  }

  function setEngagementField(opp, client, key, value) {
    var f = fieldByKey(key);
    if (!f) return { error: 'Unknown field.' };
    if (f.type === 'derived') return { error: 'That one is worked out from the plan, not typed in.' };

    var before = fieldValue(engagementRecord(opp, client, []), f);
    var v = value;
    if (typeof v === 'string') v = v.trim();
    if (f.type === 'number' && v !== '' && v != null) {
      if (isNaN(Number(v))) return { error: 'That field takes a number.' };
      v = Number(v);
    }
    if (f.type === 'date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return { error: 'That needs a date.' };
    if (!nonEmpty(v)) v = null;

    /* the two that are worth refusing rather than storing wrong */
    if (key === 'gst' && v && !validGST(v)) return { error: 'That GST number does not check out.' };
    /* A GSTIN contains the PAN at positions 3-12, so typing one fills the other.
       readDocument() already does this; doing it here too means the panel cannot
       sit there asking for a PAN it was handed thirty seconds ago. */
    if (key === 'gst' && v && client && !nonEmpty(client.pan)) client.pan = v.slice(2, 12);
    if (key === 'pan' && v && !validPAN(v)) return { error: 'That PAN does not check out.' };
    if (key === 'ifsc' && v && !validIFSC(v)) return { error: 'That IFSC does not check out.' };

    var home = FIELD_HOME[key];
    if (!home) {                                   /* no home: keep it on the engagement */
      opp.extra = opp.extra || {};
      opp.extra[key] = v;
      return { field: f, before: before, after: v, where: 'engagement' };
    }
    if (home[0] === 'client') {
      if (!client) return { error: 'This engagement has no client on it yet.' };
      if (key === 'logo') client.logo = (v === 'Yes' || v === true);
      else putPath(client, home[1], v);
    } else if (home[0] === 'contact') {
      if (!client) return { error: 'This engagement has no client on it yet.' };
      /* the person on THIS engagement, not whoever the company's main one is */
      var ct = oppContact(opp, client);
      if (!ct) { addContact(client, { name: v || '', primary: true }); }
      else putPath(ct, home[1], v);
    } else if (home[0] === 'proc') {
      if (!opp.proc) return { error: 'Nothing is in delivery yet, so there is no plan to date.' };
      putPath(opp.proc, home[1], v);
      if (opp.proc.started && opp.proc.duration) {
        opp.proc.plan = planFor(opp.proc.started, opp.proc.duration);
      }
    } else {
      if (key === 'pitched' || key === 'deployed') putPath(opp, home[1], v === 'Yes' ? (opp[home[1]] || true) : (key === 'pitched' ? false : ''));
      else putPath(opp, home[1], v);
    }
    opp.updated = today();
    return { field: f, before: before, after: v, where: home[0] };
  }

  function engagementRecord(opp, client, invoices) {
    if (!opp) return {};
    var c = client || {};
    var a = c.address || {};
    var b = c.bank || {};
    var inv = (invoices || []).filter(function (i) { return i.opp === opp.id; });
    var ct = oppContact(opp, c);
    return {
      /* the engagement's own fields stay readable by their own names */
      extra: opp.extra || {},
      proc: opp.proc || null,
      client: c.name || '', contact: ct ? ct.name : '', sector: c.sector || '',
      city: a.city || '', state: a.state || '', mobile: c.mobile || '', email: c.email || '',
      legal_name: c.legal_name || '', address: addressLine(c.address) || '',
      gst: c.gst || '', pan: c.pan || '', bank_acc: b.account || '', ifsc: b.ifsc || '',
      bank_name: b.name || '', acct_holder: b.holder || '',
      mou: opp.mou || null, mou_signed: opp.mou_signed || null,
      split: opp.split || (inv.length > 1 ? String(inv.length) + ' parts' : null),
      value: opp.fee != null ? opp.fee : (opp.won_price != null ? opp.won_price : null),
      duration: opp.proc ? opp.proc.duration : null,
      started: opp.proc ? opp.proc.started : (opp.closed || null),
      repo: opp.repo || '', demo: opp.demo || '',
      deployed: opp.demo ? 'Yes' : null,
      checks: opp.checks != null ? opp.checks : null, stack: opp.stack || '',
      login: opp.login || '', pass: opp.pass || '',
      hosting: opp.hosting || '', domain: opp.domain || '', crm: opp.crm || '',
      findings: opp.findings || '', pitched: opp.pitched ? 'Yes' : null
    };
  }

  /* The one value lookup: the composed record, then anything typed in by hand.

     `own: false` marks a field the demo layer invented rather than one we really
     hold. Counting those would mean the cockpit flattered us about our own book,
     which is the one thing it exists not to do. They count once somebody fills
     them in for real, which lands in `extra`. */
  function fieldValue(line, f) {
    if (!line) return null;
    var x = line.extra || {};
    if (nonEmpty(x[f.key])) return x[f.key];
    if (f.own === false) return null;
    return nonEmpty(line[f.key]) ? line[f.key] : null;
  }

  function hasField(line, f) {
    if (f.pred) { try { return !!f.pred(line); } catch (e) { return false; } }
    return nonEmpty(fieldValue(line, f));
  }

  function scoreRecord(c) {
    var present = [], missing = [];
    FIELDS.forEach(function (f) { (hasField(c, f) ? present : missing).push(f.label); });
    return { total: FIELDS.length, present: present.length,
             missing: missing, presentList: present,
             pct: Math.round(100 * present.length / FIELDS.length) };
  }

  /* Write one field onto a product and hand back an audit line. Editable fields only. */
  function setField(line, key, value) {
    var f = fieldByKey(key);
    if (!f) return { error: 'Unknown field.' };
    if (f.locked) return { error: 'That field is set by the system.' };
    if (f.type === 'derived') return { error: 'That one is worked out, not typed in.' };
    if (f.type === 'number' && value !== '' && value !== null && isNaN(Number(value)))
      return { error: 'That field takes a number.' };

    var before = fieldValue(line, f);
    var v = (f.type === 'number' && value !== '' && value !== null) ? Number(value) : value;
    if (!nonEmpty(v)) v = null;

    if (Object.prototype.hasOwnProperty.call(line, f.key)) line[f.key] = v;
    else { line.extra = line.extra || {}; line.extra[f.key] = v; }

    return { field: f, before: before, after: v };
  }


  /* ================= CUSTOMERS =================
     The mobile number is the identity. A storefront wishlist, a enquiry and a
     WhatsApp enquiry from the same number are one person. */

  var MARKS = {
    interested: 'Interested',
    quoted:     'Quoted',
    accepted:   'Accepted',
    declined:   'Declined',
    parked:     'Parked for later'
  };

  /* ================= WHAT THE WEBSITE FORM ASKS =================

     The discovery form on zippyscale.in asks five qualification questions and
     none of them had anywhere to land: team size, turnover, budget, timeline,
     and which ad produced the lead. They are the entire reason that form is
     three steps rather than one, and they were arriving, being read once in an
     email, and then lost.

     ⚠️ THE BANDS MUST MATCH THE FORM WORD FOR WORD. The form writes a string;
     anything that does not match becomes an unknown value on a dropdown, and
     then it cannot be filtered or reported on. check_intake.js asserts both
     lists agree. If the form changes a band, this changes with it. */
  var TEAM_BANDS = ['Just me', '2 to 5', '6 to 15', '16 to 40', '41 to 100', 'More than 100'];
  var TIMELINES  = ['This month', 'Within 3 months', 'This quarter, no fixed date',
                    'Later this year', 'Just looking for now'];
  /* The money bands are built by the site from USD floors and shown in the
     visitor's own currency, so the string that arrives is whatever it rendered.
     Kept as free text with the known shapes offered, rather than a closed list
     that would reject a perfectly good answer. */
  var REVENUE_SKIP = 'I would rather say on the call';
  var BUDGET_SKIP  = 'No idea yet, tell me what it should be';

  /* ⚠️ ONE LIST, AND EVERY SOURCE FIELD IN THE COCKPIT READS IT. The add-client
     form, the new-opportunity form, the engagement registry, the automation
     audience picker and the reports all come through here, so a source added
     once appears everywhere and stays countable.

     `mark` is deliberately separate from `outbound`. Outbound is us going to
     somebody by any means; `mark` is specifically a business Mark found, scored
     and wrote to, and keeping it apart is the only way to answer "what is the
     outreach actually bringing in" with a number rather than an impression. */
  var SOURCES = {
    referral: 'Referral', outbound: 'Outbound — we went to them',
    mark: 'Outreach by Mark',
    instagram: 'Instagram', whatsapp: 'WhatsApp', google: 'Google',
    meta: 'Meta ad', linkedin: 'LinkedIn', website: 'Website', event: 'Event'
  };

  function normMobile(m) { return String(m || '').replace(/\D/g, '').slice(-10); }
  function validMobile(m) { return /^[6-9]\d{9}$/.test(normMobile(m)); }
  function validName(n) { return String(n || '').trim().length >= 2; }

  /* A number belongs to a PERSON, and a person belongs to a company — so a
     match on any contact is a match on the company. */
  function findByMobile(clients, mobile) {
    var id = normMobile(mobile);
    if (!id) return null;
    return (clients || []).filter(function (c) {
      return c.mobile === id || contactsOf(c).some(function (x) { return x.mobile === id; });
    })[0] || null;
  }
  function findByName(clients, name) {
    var n = String(name || '').trim().toLowerCase();
    if (!n) return null;
    return (clients || []).filter(function (c) {
      return String(c.name || '').trim().toLowerCase() === n;
    })[0] || null;
  }

  /* ================= THE CLIENT IS A COMPANY =================

     Not a person. A client is a business; the two, three or four people you
     actually deal with there each have a name and a designation, and they all
     belong in ONE profile rather than becoming a second company record every
     time somebody new emails.

     So identity moved. It used to be the mobile number, which cannot work when
     a company has four of them: it is now the company name, and a number
     matches the company if ANY of its contacts carries it. */

  var CLIENT_TYPES = { lead: 'Lead', client: 'Client', past: 'Past client' };

  /* ---- dial codes ----
     A mobile without a country code is only a number if everybody is in one
     country, and this agency is not. Stored separately from the digits so the
     number stays matchable however it was typed. */
  var DIAL_CODES = [
    ['+91', 'India'], ['+971', 'UAE'], ['+966', 'Saudi Arabia'], ['+974', 'Qatar'],
    ['+965', 'Kuwait'], ['+968', 'Oman'], ['+973', 'Bahrain'], ['+65', 'Singapore'],
    ['+60', 'Malaysia'], ['+44', 'United Kingdom'], ['+1', 'US / Canada'],
    ['+61', 'Australia'], ['+64', 'New Zealand'], ['+49', 'Germany'], ['+33', 'France'],
    ['+31', 'Netherlands'], ['+41', 'Switzerland'], ['+27', 'South Africa'],
    ['+254', 'Kenya'], ['+234', 'Nigeria'], ['+81', 'Japan'], ['+82', 'South Korea'],
    ['+86', 'China'], ['+94', 'Sri Lanka'], ['+880', 'Bangladesh'], ['+977', 'Nepal']
  ];
  var DEFAULT_DIAL = '+91';
  function dialLabel(code) {
    var row = DIAL_CODES.filter(function (d) { return d[0] === code; })[0];
    return row ? row[0] + '  ' + row[1] : code;
  }
  /* +91 wants ten digits; elsewhere we only insist it looks like a number. */
  function validPhone(dial, digits) {
    var n = String(digits || '').replace(/\D/g, '');
    if (!n) return false;
    if ((dial || DEFAULT_DIAL) === '+91') return /^[6-9]\d{9}$/.test(n);
    return n.length >= 6 && n.length <= 14;
  }
  function phoneLine(dial, digits) {
    var n = String(digits || '').replace(/\D/g, '');
    return n ? (dial || DEFAULT_DIAL) + ' ' + n : '';
  }

  function newContact(o) {
    o = o || {};
    return {
      id: o.id || uid('ct'),
      name: String(o.name || '').trim(),
      designation: o.designation || '',
      dial: o.dial || DEFAULT_DIAL,
      mobile: String(o.mobile || '').replace(/\D/g, ''),
      email: o.email || '',
      primary: !!o.primary,
      note: o.note || ''
    };
  }
  function contactsOf(c) { return (c && c.contacts) || []; }
  function contactById(client, id) {
    return contactsOf(client).filter(function (x) { return x.id === id; })[0] || null;
  }
  /* The person on THIS engagement. Falls back to the company's main contact so
     an older record, or one opened before anybody was named, still answers. */
  function oppContact(opp, client) {
    return (opp && contactById(client, opp.contact)) || primaryContact(client);
  }
  function primaryContact(c) {
    var list = contactsOf(c);
    return list.filter(function (x) { return x.primary; })[0] || list[0] || null;
  }
  function addContact(c, o) {
    if (!validName(o.name)) return { error: 'The person needs a name.' };
    if (o.mobile && !validPhone(o.dial, o.mobile))
      return { error: (o.dial || DEFAULT_DIAL) === '+91'
        ? 'An Indian mobile is 10 digits starting 6-9.'
        : 'That number does not look right for ' + dialLabel(o.dial) + '.' };
    c.contacts = contactsOf(c);
    var dupe = c.contacts.filter(function (x) {
      return x.mobile && x.mobile === normMobile(o.mobile);
    })[0];
    if (dupe) return { error: dupe.name + ' already has that number here.' };
    var ct = newContact(o);
    if (!c.contacts.length) ct.primary = true;     /* the first one is the one we ring */
    c.contacts.push(ct);
    if (ct.primary) { c.mobile = ct.mobile; c.email = ct.email || c.email; }
    return { contact: ct };
  }
  function dropContact(c, id) {
    var list = contactsOf(c);
    var gone = list.filter(function (x) { return x.id === id; })[0];
    c.contacts = list.filter(function (x) { return x.id !== id; });
    if (gone && gone.primary && c.contacts.length) c.contacts[0].primary = true;
    var p = primaryContact(c);
    c.mobile = p ? p.mobile : '';
    return { ok: true };
  }
  function makePrimary(c, id) {
    contactsOf(c).forEach(function (x) { x.primary = (x.id === id); });
    var p = primaryContact(c);
    if (p) { c.mobile = p.mobile; c.email = p.email || c.email; }
    return { ok: true };
  }

  /* An address that works outside India too, because the agency does. Nothing
     is required — a first conversation rarely produces a postcode. */
  function newAddress(o) {
    o = o || {};
    return { line1: o.line1 || '', area: o.area || '', city: o.city || '',
             state: o.state || '', country: o.country || 'India', pin: o.pin || '' };
  }
  function addressLine(a) {
    if (!a) return '';
    return [a.line1, a.area, a.city, a.state, a.pin, a.country]
      .filter(function (x) { return String(x || '').trim(); }).join(', ');
  }

  /* ---- places: Country → State → City ----
     Every address in the cockpit is three dropdowns from ONE list (places.js,
     generated from the website's own list), because a typed state arrives as
     "Maharastra" and can never be counted. "Other" turns that one box into text.
     A stored value that is not on the list is kept and shown as "(not in list)",
     so switching a box to a dropdown never loses what was typed into it. */
  var PLACE_OTHER = '__other';
  function places() { return root.ZS_PLACES || []; }
  function placeCountry(v) {
    var s = String(v || '').trim().toLowerCase();
    return places().filter(function (c) { return c.name.toLowerCase() === s || c.code.toLowerCase() === s; })[0] || null;
  }
  var placeExtra = [];   /* countries somebody added on the spot (the countries picklist) */
  function placeStateOf(c, city) {
    if (!c || !city) return '';
    var hits = Object.keys(c.states).filter(function (st) { return c.states[st].indexOf(city) >= 0; });
    return hits.length === 1 ? hits[0] : '';
  }
  function placeList(level, country, state, city) {
    if (level === 'country') {
      var names = places().map(function (c) { return c.name; });
      return names.concat(PICKLISTS.countries.concat(placeExtra).filter(function (n, i, a) {
        return names.indexOf(n) < 0 && a.indexOf(n) === i;
      }));
    }
    var c = placeCountry(country);
    if (!c) return null;
    if (level === 'state') return Object.keys(c.states);
    /* no state on file: if the city names one state, offer that state's cities
       (so "Mumbai" reads as Mumbai, not "not in list"); otherwise an empty list
       that says "pick a state first", never a text box */
    if (!state) {
      var home = placeStateOf(c, city);
      return home ? c.states[home].filter(function (x) { return x !== 'Other'; }) : [];
    }
    var st = c.states[state];
    return st ? st.filter(function (x) { return x !== 'Other'; }) : null;
  }
  function placeLabel(level, country) {
    if (level === 'country') return 'Country';
    if (level === 'city') return 'City';
    var c = placeCountry(country);
    return c ? c.tier : 'State / province';
  }
  /* the inside of one control: options for a list, or null for a text box */
  /* `hint` is a city used only to find which state's list to offer when no state
     is on file; it is never added to the list */
  function placeOptions(level, country, state, value, hint) {
    var list = placeList(level, country, state, level === 'city' ? (hint || value) : '');
    if (!list) return null;
    var v = String(value || '');
    var known = !v || list.indexOf(v) >= 0;
    return '<option value="">' + (level === 'city' && !state && !list.length ? 'Pick a ' + placeLabel('state', country).toLowerCase() + ' first' : 'Choose') + '</option>' +
      (known ? '' : '<option value="' + esc(v) + '" selected>' + esc(v) + ' (not in list)</option>') +
      list.map(function (x) {
        return '<option value="' + esc(x) + '"' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>';
      }).join('') +
      (level === 'country' ? '' : '<option value="' + PLACE_OTHER + '">Other (type it)</option>');
  }
  var placeSeq = 0;
  /* Returns [country, state, city] as HTML. `wrap(label, id, control)` lets each
     form keep its own field chrome; `attrs[level]` adds e.g. data-recfield. */
  function placeFields(o) {
    var grp = 'pl' + (++placeSeq);
    if (o.countries) placeExtra = o.countries.slice();
    /* `assume` is the country the lists are drawn for when none is on file. It is
       NOT shown as chosen: a box that reads "India" but was never saved is a lie.
       Choosing a state or city fills it in, as a visible unsaved change. */
    var assume = o.assume || 'India';
    var val = { country: o.country || '', state: o.state || '', city: o.city || '' };
    var listCountry = val.country || assume;
    return ['country', 'state', 'city'].map(function (lv) {
      var id = o.id + '-' + lv;
      var a = ' id="' + esc(id) + '" data-place="' + lv + '" data-place-grp="' + grp + '"' +
        ' data-place-assume="' + esc(assume) + '"' +
        (o.names && o.names[lv] ? ' name="' + esc(o.names[lv]) + '"' : '') + ((o.attrs && o.attrs[lv]) || '');
      var opts = placeOptions(lv, listCountry, val.state, val[lv]);
      var control = opts != null
        ? '<select' + a + '>' + opts + '</select>'
        : '<input' + a + ' type="text" autocomplete="off" value="' + esc(val[lv]) + '">';
      return o.wrap(placeLabel(lv, listCountry), id, control);
    });
  }
  /* the chain: a new country refills the states, a new state refills the cities,
     "Other" becomes a text box. Each rebuilt box fires `change`, so a form that
     stages its fields (the engagement registry) sees the cleared value too. */
  function placeRebuild(el, tagName, inner) {
    var d = root.document, n = d.createElement(tagName), keep = el.value;
    Array.prototype.slice.call(el.attributes).forEach(function (at) {
      if (at.name !== 'value' && at.name !== 'type') n.setAttribute(at.name, at.value);
    });
    if (tagName === 'input') { n.type = 'text'; n.autocomplete = 'off'; } else n.innerHTML = inner;
    el.parentNode.replaceChild(n, el);
    /* a state or city that still fits the new list stays: picking Maharashtra
       must not wipe Mumbai */
    if (tagName === 'select' && keep && keep !== PLACE_OTHER &&
        Array.prototype.some.call(n.options, function (op) { return op.value === keep; })) {
      n.value = keep;
      return n;
    }
    n.dispatchEvent(new Event('change', { bubbles: true }));
    return n;
  }
  if (root.document && root.document.addEventListener && root.document.createElement) {
    root.document.addEventListener('change', function (e) {
      var t = e.target, lv = t && t.getAttribute && t.getAttribute('data-place');
      if (!lv) return;
      var d = root.document, grp = t.getAttribute('data-place-grp');
      /* stop the original event: the form must stage the new empty text box, never
         the "__other" sentinel the select was holding */
      if (t.value === PLACE_OTHER) { e.stopImmediatePropagation(); placeRebuild(t, 'input').focus(); return; }
      var byGrp = function (l) { return d.querySelector('[data-place-grp="' + grp + '"][data-place="' + l + '"]'); };
      var ids = {};
      ['country', 'state', 'city'].forEach(function (l) { var x = byGrp(l); ids[l] = x && x.id; });
      var assume = t.getAttribute('data-place-assume') || '', picked = t.value;
      /* ⚠️ EVERYTHING BELOW WAITS FOR THIS EVENT TO FINISH. The engagement registry
         redraws itself on its first unsaved change; touching the other boxes inside
         this event made that redraw happen before the box you picked was staged, and
         it came back blank (Telangana vanished, then Maharashtra). By id, because a
         redraw keeps the ids and replaces the elements. */
      setTimeout(function () {
        var get = function (l) { return ids[l] ? d.getElementById(ids[l]) : null; };
        var cEl = get('country');
        var country = cEl ? (cEl.value || assume) : assume;
        var refill = function (l) {
          var el = get(l); if (!el) return;
          /* read the state NOW: refilling the states just above may have cleared it */
          var stNow = get('state') ? get('state').value : '';
          var opts = placeOptions(l, country, l === 'city' ? stNow : '', '', l === 'city' ? el.value : '');
          if (opts != null) placeRebuild(el, 'select', opts);
          else if (el.tagName === 'SELECT') placeRebuild(el, 'input');
          var lab = d.querySelector('label[for="' + ids[l] + '"]');
          if (lab && l === 'state') lab.textContent = placeLabel('state', country);
        };
        if (lv === 'country') { refill('state'); refill('city'); return; }
        if (lv === 'state') refill('city');
        /* a city picked with no state names its state, when only one state has it */
        var sEl = get('state');
        if (lv === 'city' && picked && sEl && !sEl.value) {
          var home = placeStateOf(placeCountry(country), picked);
          if (home && Array.prototype.some.call(sEl.options || [], function (op) { return op.value === home; })) {
            sEl.value = home; sEl.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        /* a state or city picked under the assumed country fills the country in */
        if (picked && cEl && !cEl.value && assume) {
          cEl.value = assume; cEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 0);
    });
  }

  /* "2026-10-01" → "1 Oct 2026". 01/10/2026 means two different days depending on
     who reads it, so no date in the cockpit is shown that way. */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                  'August', 'September', 'October', 'November', 'December'];
  /* "2 October 2026", which is how his invoices print a date. The screens use
     the short form; a document a client keeps gets the long one. */
  function longDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? (+m[3]) + ' ' + MON_LONG[+m[2] - 1] + ' ' + m[1] : String(iso || '');
  }
  function niceDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : String(iso || '');
  }

  /* ---- picklists ----
     A dropdown you can add to on the spot, where the new value is still there
     next time. ONE mechanism, used for sector and for country, because two
     mechanisms for the same idea is how they drift apart. */
  /* Designations, narrowed by sector. A retailer has a Store Manager; a
     hospital does not. Offering all of them everywhere is how a dropdown gets
     ignored, so the list is filtered and anything missing can be added. */
  var DESIGNATIONS = {
    '*':                      ['Founder', 'Co-founder', 'Managing Director', 'CEO', 'Owner',
                               'Partner', 'Accounts', 'Finance Head', 'Operations Head',
                               'Marketing Head', 'Purchase', 'Admin', 'Assistant'],
    'Automotive':             ['Sales Manager', 'Service Manager', 'Parts Head', 'Branch Head'],
    'Retail':                 ['Store Manager', 'Area Manager', 'Category Head', 'Merchandiser'],
    'Fashion & couture':      ['Creative Director', 'Store Manager', 'Stylist', 'Production Head'],
    'Corporate gifting':      ['Key Account Manager', 'Sourcing Head', 'Client Servicing'],
    'Real estate':            ['Sales Head', 'Channel Partner', 'Project Head', 'CRM Head'],
    'Healthcare':             ['Medical Director', 'Practice Manager', 'Front Desk Lead'],
    'Education':              ['Principal', 'Admissions Head', 'Academic Head'],
    'Hospitality':            ['General Manager', 'F&B Manager', 'Revenue Manager'],
    'Logistics & transport':  ['Fleet Manager', 'Operations Head', 'Dispatch Head'],
    'Financial services':     ['Relationship Manager', 'Compliance Officer', 'Branch Head'],
    'Manufacturing':          ['Plant Head', 'Production Manager', 'Quality Head'],
    'Professional services':  ['Practice Head', 'Engagement Manager'],
    'Technology':             ['CTO', 'Product Head', 'Engineering Manager'],
    'Construction & interiors':['Project Manager', 'Site Head', 'Design Head', 'Procurement Head']
  };
  function designationsFor(store, sector) {
    var base = (DESIGNATIONS[sector] || []).concat(DESIGNATIONS['*']);
    var custom = (store && store.picklists && store.picklists.designations) || [];
    return base.concat(custom.filter(function (x) { return base.indexOf(x) < 0; }));
  }

  var PICKLISTS = {
    sectors: ['Automotive', 'Retail', 'Fashion & couture', 'Corporate gifting',
              'Real estate', 'Healthcare', 'Education', 'Hospitality',
              'Logistics & transport', 'Financial services', 'Manufacturing',
              'Professional services', 'Technology', 'Construction & interiors'],
    countries: ['India', 'United Arab Emirates', 'Singapore', 'United Kingdom',
                'United States', 'Canada', 'Australia', 'Saudi Arabia', 'Qatar',
                'Malaysia', 'Germany', 'Netherlands', 'South Africa', 'Kenya']
  };
  function picklist(store, key) {
    var custom = (store && store.picklists && store.picklists[key]) || [];
    var base = PICKLISTS[key] || [];
    return base.concat(custom.filter(function (x) { return base.indexOf(x) < 0; }))
               .sort(function (a, b) { return String(a).localeCompare(String(b)); });
  }
  function addToPicklist(store, key, value) {
    var v = String(value || '').trim();
    if (v.length < 2) return { error: 'Too short to be useful.' };
    store.picklists = store.picklists || {};
    store.picklists[key] = store.picklists[key] || [];
    if (picklist(store, key).some(function (x) { return x.toLowerCase() === v.toLowerCase(); })) {
      return { error: v + ' is already on the list.' };
    }
    store.picklists[key].push(v);
    return { value: v };
  }

  /* ---- campaigns ----
     "Meta ad" on its own is not an answer to where a lead came from: you run
     several at once and the only question worth asking at month end is which
     one paid for itself. So a paid source carries a campaign, and campaigns
     are a list the owner keeps — by hand today, pulled from the ad accounts
     once those are connected. */
  var PAID_SOURCES = ['meta', 'google', 'linkedin'];
  function isPaid(src) { return PAID_SOURCES.indexOf(src) >= 0; }

  function newCampaign(o) {
    o = o || {};
    return {
      id: o.id || uid('cmp'),
      name: String(o.name || '').trim(),
      platform: o.platform || 'meta',        /* meta | google | linkedin */
      ref: o.ref || '',                      /* the id in their ad manager */
      status: o.status || 'active',          /* active | paused | ended */
      spend: o.spend || 0,
      started: o.started || today(),
      ended: o.ended || null
    };
  }
  var PLATFORMS = { meta: 'Meta Ads Manager', google: 'Google Ads', linkedin: 'LinkedIn Ads' };
  function campaignsFor(store, platform) {
    return (store.campaigns || []).filter(function (c) {
      return !platform || c.platform === platform;
    });
  }
  function campaignById(store, id) {
    return (store.campaigns || []).filter(function (c) { return c.id === id; })[0] || null;
  }
  /* What each campaign actually brought in. The only number that matters. */
  function campaignResults(store, id) {
    var opps = (store.opportunities || []).filter(function (o) { return o.campaign === id; });
    var won = opps.filter(function (o) { return o.outcome === 'won'; });
    return {
      leads: opps.length, won: won.length,
      value: won.reduce(function (a, o) { return a + (o.won_price || o.budget_max || 0); }, 0)
    };
  }

  /* ---- reading a document ----

     GST certificates, PAN cards, a cancelled cheque and a letterhead all carry
     the same handful of identifiers in predictable formats, so pulling them out
     of text is a regex job, not a guess. Each format is checked, not merely
     matched: a GSTIN carries its state code and PAN inside it, and an IFSC has
     a fixed shape. Anything that does not check out is ignored rather than
     filled in wrong — a wrong GST number on an invoice is worse than a blank.

     What this does NOT do is read an image. That needs OCR, which needs either
     a library we do not ship or a server we do not have; the UI says so and
     gives you a box to paste the text into, which works today. */

  var DOC_PATTERNS = {
    gst:        /\b(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d])\b/,
    pan:        /\b([A-Z]{5}\d{4}[A-Z])\b/,
    ifsc:       /\b([A-Z]{4}0[A-Z\d]{6})\b/,
    bank_account: /\b(?:a\/c|acc(?:ount)?)\s*(?:no\.?|number|#)?\s*[:\-]?\s*(\d{9,18})\b/i,
    pin:        /\b(?:pin|pincode|postal)\s*(?:code)?\s*[:\-]?\s*(\d{6})\b/i,
    email:      /\b([\w.+-]+@[\w-]+\.[\w.]{2,})\b/,
    website:    /\b((?:https?:\/\/|www\.)[\w.-]+\.[a-z]{2,}[^\s,]*)/i,
    instagram:  /instagram\.com\/([A-Za-z0-9_.]+)/i,

    /* The engagement side: what an MOU, an invoice or a handover note carries.
       Each one is anchored on a label rather than floating, because "90" on its
       own is not a build length and a bare number is not a fee. */
    legal_name: /(?:name\s+of\s+(?:the\s+)?(?:company|firm)|registered\s+(?:company\s+)?name|m\/s\.?)\s*[:\-]?\s*([A-Za-z0-9&.,'\- ]{3,60}?)(?:\r|\n|,|$)/i,
    repo:       /\b((?:https?:\/\/)?(?:github|gitlab|bitbucket)\.com\/[\w.\-]+\/[\w.\-]+)/i,
    value:      /(?:fee|total|amount|contract\s+value|project\s+value)\s*(?:agreed|payable)?\s*[:\-]?\s*(?:rs\.?|inr|₹)\s*([\d,]{3,15})/i,
    duration:   /\b(30|60|90|120)\s*(?:working\s*)?days\b/i,
    split:      /\b(50\/50|60\/40|40\/40\/20|100)\b/,
    mou_signed: /(?:signed|executed|dated)\s*(?:on)?\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/i,
    login:      /(?:user\s*name|username|user\s*id|login)\s*[:\-]?\s*([A-Za-z0-9_.@\-]{3,40})/i,
    pass:       /(?:password|pass\s*word|pwd)\s*[:\-]?\s*(\S{4,40})/i
  };

  var GST_STATES = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16',
                    '17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32',
                    '33','34','35','36','37','38','96','97','99'];

  /* A GSTIN is a state code + a PAN + an entity number + Z + a checksum, so a
     GSTIN whose PAN does not check out is not a GSTIN. Validating the shape
     alone let "99ZZZZZ9999Z9Z9" through. */
  function validGST(g) {
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(g || '')) return false;
    if (GST_STATES.indexOf(g.slice(0, 2)) < 0) return false;
    return validPAN(g.slice(2, 12));
  }
  /* The 4th character of a PAN is the entity type — P individual, C company,
     H HUF, F firm, A association, T trust, B body, L local authority,
     J juridical person, G government. Anything else is not a PAN, which is
     what stops a random five-letter run being filled into the field. */
  function validPAN(p) {
    return /^[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z]$/.test(p || '');
  }
  function validIFSC(i) { return /^[A-Z]{4}0[A-Z\d]{6}$/.test(i || ''); }

  /* Pull what we can out of whatever text we were given. Returns only the
     fields it is confident about, plus what it looked at, so the UI can show
     its working rather than silently overwriting somebody's typing. */
  var CASE_SENSITIVE = ['email', 'website', 'instagram', 'legal_name', 'repo',
                        'login', 'pass', 'demo', 'stack', 'hosting', 'domain', 'crm'];

  function readDocument(text) {
    var t = String(text || '');
    var found = {}, notes = [];
    if (!t.trim()) return { fields: {}, notes: ['Nothing to read.'] };

    var up = t.toUpperCase();
    Object.keys(DOC_PATTERNS).forEach(function (k) {
      /* ⚠️ Anything case-SENSITIVE must be read off the original text, never the
         uppercased copy. A password came back as "ROYALE@26" instead of
         upper case — a credential silently corrupted on the way in, which is
         worse than not reading it at all. Only the fixed-format codes (GST, PAN,
         IFSC) want the uppercase pass. */
      var src = CASE_SENSITIVE.indexOf(k) >= 0 ? t : up;
      var m = src.match(DOC_PATTERNS[k]);
      if (!m) return;
      var v = m[1];
      if (k === 'gst' && !validGST(v)) { notes.push('Found something GST-shaped that did not check out.'); return; }
      if (k === 'pan' && !validPAN(v)) return;
      if (k === 'ifsc' && !validIFSC(v)) { notes.push('Found something IFSC-shaped that did not check out.'); return; }
      found[k] = v;
    });

    /* A GSTIN contains the PAN at positions 3-12, so one confirms the other. */
    if (found.gst) {
      var inner = found.gst.slice(2, 12);
      if (!found.pan && validPAN(inner)) { found.pan = inner; notes.push('PAN taken from inside the GST number.'); }
      else if (found.pan !== inner) notes.push('The PAN and the GST number disagree — check both.');
    }
    if (found.instagram) found.instagram = 'https://instagram.com/' + found.instagram;
    if (found.website && !/^https?:/i.test(found.website)) found.website = 'https://' + found.website;

    if (found.value) found.value = Number(String(found.value).replace(/,/g, '')) || null;
    if (found.duration) found.duration = Number(found.duration);
    if (found.legal_name) found.legal_name = String(found.legal_name).trim().replace(/[.,]$/, '');
    if (found.repo && !/^https?:/i.test(found.repo)) found.repo = 'https://' + found.repo;

    notes.unshift(Object.keys(found).length
      ? 'Read ' + Object.keys(found).length + ' field' + (Object.keys(found).length === 1 ? '' : 's') + '.'
      : 'Nothing recognisable in that text.');
    return { fields: found, notes: notes };
  }

  /* ================= THE AGENT LAYER =================

     An automation is a rule on an event. An agent is a named worker with a job:
     it reads the state, decides something, drafts the output, shows its
     reasoning and waits.

     These are deterministic rules with a job title. Say that out loud — in
     production the reading and writing steps become model calls returning these
     same shapes, and a client who finds that out later stops believing the rest
     of the build.

     Three rules carry the whole layer:
       1. Anything a client would see queues for a human, whatever the mode.
          That is a guard the setting cannot reach.
       2. Every run carries the steps it took, so a person reads WHY before
          deciding. An agent that cannot explain itself gets switched off in
          week two, and rightly.
       3. Off / Suggest / Auto, defaulting to Suggest. The client earns their
          way to Auto; you do not sell it to them. */

  /* Each of us describes itself in the first person. They are workers with job
     titles, and a worker that refers to itself in the third person reads like a
     brochure rather than a colleague. */
  var AGENTS = [
    { id: 'mark',     name: 'Mark',          icon: '✦',
      trigger: 'Every weekday morning, on the categories you set',
      does: 'I find businesses in Dubai and the States, read their own website for what is actually broken, work out who to write to, score them out of 5 for each of the three things we sell, and draft the email. Nothing leaves until you say so.',
      minutes: 45, client: true },
    { id: 'jarvis',   name: 'Jarvis',        icon: '◉',
      trigger: 'Every morning, and whenever you ask me',
      does: 'I read every engagement, plan, invoice and live build, work out what is going wrong and what is going well, and propose which of my team should do what. I dispatch nothing without your yes.',
      minutes: 30, client: false },
    { id: 'chaser',   name: 'The Chaser',    icon: '↻',
      trigger: 'A build blocked on the client for more than 3 days',
      does: 'I find every engagement waiting on their credentials, data, signature or decision, work out how long it has been stuck, and draft the nudge.',
      minutes: 10, client: true },
    { id: 'closer',   name: 'The Closer',    icon: '▶',
      trigger: 'Work finished and never sent',
      does: 'I flag a build that is ready and unpitched, gather the findings and the demo link, and draft the outreach.',
      minutes: 25, client: true },
    { id: 'watchman', name: 'The Watchman',  icon: '◎',
      trigger: 'Every live build, on a schedule',
      does: 'I check each deployed client build still answers and still passes its own checks, so you hear it from me before you hear it from them.',
      minutes: 15, client: false },
    { id: 'collector',name: 'The Collector', icon: '₹',
      trigger: 'An invoice past its terms',
      does: 'I work out what is owed across every client, flag the ones past terms, and draft the reminder.',
      minutes: 12, client: true },
    { id: 'reconciler', name: 'The Reconciler', icon: '⚖',
      trigger: 'A payment proof is uploaded against an engagement',
      does: 'I read the screenshot, the UTR or the bank advice, pull out what actually moved, match it against the invoices raised on that engagement, and propose marking one cleared. I never clear one myself: a payment read wrong is a debt somebody stops chasing.',
      minutes: 8, client: false },
    { id: 'brief',    name: 'Morning Brief', icon: '☀',
      trigger: 'Every morning',
      does: 'I give you one digest: what slipped, what is due this week, what is owed, and who has gone quiet.',
      minutes: 20, client: false },
    { id: 'signal',   name: 'The Signal',    icon: '✆',
      trigger: 'After every send, and every morning',
      does: 'I sit on the WhatsApp number. I work out what failed and why, tell you which of those ' +
            'are your copy and which are Meta\'s caps, watch the quality rating and say how close ' +
            'the sending is to the daily limit before it starts refusing.',
      minutes: 18, client: false }
  ];

  function agentById(id) { return AGENTS.filter(function (a) { return a.id === id; })[0] || null; }

  var AGENT_MODES = ['off', 'suggest', 'auto'];
  function agentMode(store, id) {
    return (store && store.agentModes && store.agentModes[id]) || 'suggest';
  }

  /* One run envelope. Every agent returns this shape. */
  function newRun(agentId, title, o) {
    o = o || {};
    var a = agentById(agentId);
    return Object.assign({
      id: uid('r'),
      agent: agentId, title: title, at: new Date().toISOString(),
      steps: [], summary: '', payload: {}, draft: null, target: null,
      clientFacing: !!(a && a.client),
      confidence: 0.8,
      minutes: a ? a.minutes : 0
    }, o);
  }
  function step(run, t, d) { run.steps.push({ t: t, d: d || '' }); return run; }

  /* agent + the thing it is about + whatever else makes this run distinct */
  function runKey(run) {
    var t = run.target || {};
    return [run.agent, t.kind || '', t.id == null ? '' : t.id,
            (run.payload && run.payload.discriminator) || ''].join(':');
  }

  /* A sweep must not re-propose what somebody just decided. */
  function recentlyDecided(store, key, days) {
    var since = addDays(today(), -(days || 3));
    return (store.proposals || []).some(function (p) {
      return p.key === key && p.status !== 'pending' && String(p.decided || '') >= since;
    });
  }

  /* Hours saved counts APPROVED work only. A number that grows while nobody
     does anything is the number a client uses to stop believing you. */
  /* ================= MARK'S RUBRIC =================

     ⚠️ NO MODEL RUNS HERE, AND THAT IS THE POINT.

     Qualification is the one part of outreach that must be auditable. A score a
     model produced is a number with an opinion behind it: you cannot check it,
     you cannot reproduce it, and when a client asks "why is this a 4" the honest
     answer is "it felt like one". So scoring is a RUBRIC over named signals. The
     signals are facts found on their own property, each with the evidence
     stored beside it, and the score is arithmetic over the signals.

     It is also free, which matters: the model allowance is twenty calls a day
     and every one of them should go on writing, not on arithmetic a rule can do.

     WEIGHTS. Each signal carries a weight. The raw total is divided by the
     weight it would take to be a certain fit, and capped at 5. A signal that is
     merely suggestive is 1; one that on its own makes the case is 3.

     EVIDENCE OR IT DID NOT HAPPEN. `fires` returns the evidence string, not
     true. A signal with no evidence is not counted, so a score can always be
     read back as a sentence. */

  /* What a prospect looks like once Mark has been over it. Everything optional
     except the name, because a row half-filled is still worth working. */
  function newProspect(o) {
    o = o || {};
    return {
      id: o.id || uid('p'),
      country: o.country || 'AE',
      city: o.city || '', category: o.category || '',
      name: o.name || '', website: o.website || '', email: o.email || '',
      phone: o.phone || '', address: o.address || '',
      place_id: o.place_id || null,
      rating: o.rating || null, reviews: o.reviews || 0,
      contact_name: o.contact_name || '', contact_title: o.contact_title || '',
      contact_level: o.contact_level || 'unknown', linkedin: o.linkedin || '',
      needs_lookup: !!o.needs_lookup,
      findings: o.findings || [], signals: o.signals || {},
      score_auto: o.score_auto || 0, score_cockpit: o.score_cockpit || 0,
      score_site: o.score_site || 0,
      sources: o.sources || {},
      stage: o.stage || 'found', parked_why: o.parked_why || null,
      client_id: o.client_id || null,
      found_at: o.found_at || today(), updated_at: o.updated_at || today()
    };
  }

  var LEVELS = { owner: 'Owner or founder', director: 'Director or partner',
                 manager: 'Manager', unknown: 'Not found yet' };

  /* `p` is the prospect, `site` is what the reader found on their website:
     { html, text, status, https, mobile, updated, forms, tools, pages, speed }.
     Every `fires` returns a sentence or null. The sentence IS the evidence. */
  /* ⚠️ THE RUBRIC ITSELF LIVES ON THE SERVER, IN server/src/rubric.js, AND
     NOWHERE ELSE.

     It was written here first and that was wrong. Scoring needs the website, and
     only the server can fetch somebody else's website, so a copy here could
     never be the one that ran — it would be a second implementation that drifts
     from the real one and disagrees with the number on the screen. The cockpit
     already carries one duplicated list (DEFAULT_PRODUCTS) and needs a check to
     keep the halves honest; a second one is not worth the same tax.

     So the browser never scores. It renders `p.signals` and `p.score_*` exactly
     as the server computed them, and every signal arrives with the sentence that
     earned it. */

  /* ================= WHAT MARK WRITES =================

     ⚠️ THE SUBJECT IS BUILT FROM A FINDING, OR THERE IS NO SUBJECT.

     `subjectFor` takes a finding and returns a line. Handed nothing, it returns
     null and the draft does not happen. That is not a style rule; it is the
     whole design, for two reasons that happen to point the same way.

     It is what works. The Car Cart email got read because the subject said
     Airtel had their site flagged as a scam, and that was TRUE and checkable in
     ten seconds. Nobody deletes an email that names a real problem on their own
     property.

     And it is what is lawful. A deceptive subject line is $53,088 per email
     under the FTC's 2026 CAN-SPAM adjustment. The cheap trick and the crime are
     the same act, and the honest version outperforms both.

     TEMPLATE FIRST, MODEL SECOND. Every message below is complete as written, so
     Mark never stops when the free model allowance runs out. The model sharpens
     what is here; it never supplies it. check_ask.js already holds the rest of
     the cockpit to that rule and this is no different.

     NO EM DASHES. They read as machine-written and undo the one thing this email
     is trying to establish. */

  /* ⚠️ A SUBJECT GMAIL CUTS IN HALF IS A SUBJECT NOBODY READ. Gmail shows about
     70 characters on a laptop and far fewer on a phone, and Gulf company names
     run long: "Royal Fitout & Interior Design Dubai" is 35 before the problem is
     even mentioned. So the name is shortened to the part a human would say out
     loud, and the problem always survives. */
  function shortName(name) {
    var n = String(name || '').split(/[|,–-]/)[0].trim();
    n = n.replace(/\s+(llc|l\.l\.c|fz-?llc|fzco|ltd|limited|pvt|private|co|company|est|trading|contracting)\b\.?/gi, '');
    var words = n.split(/\s+/).filter(Boolean);
    if (words.length > 3) words = words.slice(0, 3);
    n = words.join(' ').replace(/\s*&\s*$/, '').trim();
    return n.length > 28 ? n.slice(0, 28).replace(/\s\S*$/, '') : n;
  }

  var SUBJECTS = {
    no_https:   function (p) { return shortName(p.name) + ': Chrome is showing visitors "Not secure"'; },
    site_down:  function (p) { return shortName(p.name) + ': your website is not loading'; },
    site_error: function (p) { return shortName(p.name) + ': your website is returning an error'; },
    no_site:    function (p) { return shortName(p.name) + ' has no website on its Google listing'; },
    not_mobile: function (p) { return shortName(p.name) + ': your site does not fit a phone screen'; },
    stale:      function (p, f) {
      var y = String(f.evidence || '').match(/(20\d\d)/);
      return shortName(p.name) + ': your site still says ' + (y ? y[1] : 'an old year');
    }
  };

  /* Worst first. A dead site beats a stale footer, because the first is costing
     them money today and the second is only embarrassing. */
  var FINDING_ORDER = ['site_down', 'site_error', 'no_site', 'no_https', 'not_mobile', 'stale'];

  /* `order` is the playbook's, when there is one. That is the only lever the
     learning actually pulls, and it pulls it only after somebody approved the
     change: leadFinding reads the order, it never writes it. */
  function leadFinding(p, order) {
    var ord = (order && order.length) ? order : FINDING_ORDER;
    var got = (p.findings || []).filter(function (f) { return f.verified && SUBJECTS[f.id]; });
    if (!got.length) return null;
    got.sort(function (a, b) {
      var ai = ord.indexOf(a.id), bi = ord.indexOf(b.id);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });
    return got[0];
  }

  function subjectFor(p, order) {
    var f = leadFinding(p, order);
    if (!f) return null;                 /* ⚠️ no verified finding, no subject, no email */
    return { line: SUBJECTS[f.id](p, f), finding: f };
  }

  /* What each service costs, in their money. The rupee figure is the price;
     everything else is the same number in another currency, which is all
     Bhargav asked for. Rates are editable in Settings so nothing goes stale. */
  var SERVICE_PRICE = { automations: 50000, cockpit: 70000, website: 100000 };

  function priceIn(service, country) {
    var inr = SERVICE_PRICE[service] || 0;
    /* ⚠️ Through inAed/inUsd, never by dividing here: `aedRate()` returns a
       number and `usdRate()` returns {rate, at}, so an arithmetic shortcut gave
       "$NaN" on every American prospect. The two converters are the only place
       that difference lives. Rounded to the nearest 50 dirhams and 5 dollars,
       because a price reading "AED 2917" invites haggling over the 17. */
    if (country === 'AE') return 'AED ' + Math.round(inAed(inr) / 50) * 50;
    if (country === 'US') return '$' + Math.round(inUsd(inr) / 5) * 5;
    return money(inr);
  }

  /* One paragraph per service, saying what we would actually do, in their words
     rather than ours. Each takes the evidence so the sentence is about THEM. */
  var PITCH = {
    automations: function (p, hits) {
      var e = (hits || []).map(function (h) { return h.evidence; });
      return 'The enquiries. ' +
        (e.filter(function (x) { return /wa\.me|WhatsApp/i.test(x); }).length
          ? 'Right now they arrive on WhatsApp and live in a phone. '
          : '') +
        (e.filter(function (x) { return /no CRM/i.test(x); }).length
          ? 'Nothing is recording them, so nobody can say how many came in last month or which ones went quiet. '
          : '') +
        'We join what you already use so a new enquiry files itself, chases itself and shows up on one screen. ' +
        'Nothing you work in changes.';
    },
    cockpit: function (p, hits) {
      var e = (hits || []).map(function (h) { return h.evidence; });
      return 'One screen for the whole business. ' +
        (e.filter(function (x) { return /memory/i.test(x); }).length
          ? 'At the moment it runs on somebody remembering, which works until they are on leave. '
          : '') +
        'Every job, who it is for, where it has got to, what is owed and what is overdue, ' +
        'with the chasing done for you. Built on your own data, not a demo.';
    },
    website: function (p, hits) {
      var e = (hits || []).map(function (h) { return h.evidence; });
      return 'The site itself. ' +
        (e.filter(function (x) { return /Not secure/i.test(x); }).length
          ? 'The certificate alone is turning people away before they read a word. '
          : '') +
        'We rebuild it so it loads fast, works on a phone, and turns a visitor into an enquiry ' +
        'that lands somewhere you can see it.';
    }
  };

  /* ⚠️ Returns null when there is nothing verified to lead with. Every caller
     must handle that, and the whole point is that one of them cannot forget. */
  function draftEmail(p, picks, me, order) {
    var sub = subjectFor(p, order);
    if (!sub) return null;

    var greet = p.contact_name ? 'Hello ' + p.contact_name.split(' ')[0] + ',' : 'Hello,';
    var services = (picks || []).slice(0, 3);
    var sig = (me && me.name) || 'Bhargav Naidu';

    var body = [
      greet, '',
      sub.finding.evidence + '.',
      '',
      'I found that looking at ' + p.name + ' this morning, before writing to you. ' +
      'You can check it in ten seconds and it is yours to fix whether or not we ever speak.',
      ''
    ];

    if (services.length) {
      body.push(services.length === 1
        ? 'While I was there, one thing stood out.'
        : 'While I was there, ' + (services.length === 2 ? 'two' : 'three') + ' things stood out.');
      body.push('');
      services.forEach(function (sv) {
        var hits = ((p.signals || {})[sv.key] || []);
        body.push(PITCH[sv.key](p, hits));
        body.push('From ' + priceIn(sv.key, p.country) + '.');
        body.push('');
      });
    }

    body.push('We build these in India for businesses in ' +
      (p.country === 'US' ? 'the States' : 'the Gulf') +
      ', which is why the price looks the way it does. Same engineers, no agency in the middle.');
    body.push('');
    body.push('Worth twenty minutes? I can show you what we have built for people in your trade: ' +
      'zippyscale.in');
    body.push('');
    body.push(sig);
    body.push('ZippyScale');

    return { subject: sub.line, text: body.join('\n'), finding: sub.finding };
  }

  /* ⚠️ HELD UNTIL THEY REPLY, AND THE FUNCTION SAYS SO IN ITS NAME.
     UAE Cabinet Resolutions 56 and 57 of 2024 require documented prior consent
     before any marketing message INCLUDING WhatsApp, provable within 24 to 72
     hours. Meta refuses templates written for cold outreach besides. So this is
     written now and sent only after they have written to us, at which point it
     is a reply inside the window: free, allowed, and welcome. */
  function draftWhatsAppReply(p, picks, me, order) {
    var sub = subjectFor(p, order);
    if (!sub) return null;
    var first = p.contact_name ? p.contact_name.split(' ')[0] : 'there';
    var sv = (picks || [])[0];
    return {
      channel: 'whatsapp',
      hold: 'until they reply',
      text: 'Hello ' + first + ', thanks for coming back to me.\n\n' +
        sub.finding.evidence + ', which is the bit I would fix first.\n\n' +
        (sv ? PITCH[sv.key](p, ((p.signals || {})[sv.key] || [])) + '\n\n' : '') +
        'Shall I send over twenty minutes on Thursday or Friday?\n\n' +
        ((me && me.name) || 'Bhargav') + ', ZippyScale'
    };
  }

  /* Which services are worth pitching to this one, best first. Three or more is
     the bar: below that Mark has not found enough to say anything specific, and
     a vague email is worse than none. */
  var PITCH_BAR = 3;
  function worthPitching(p) {
    var all = [
      { key: 'automations', score: p.score_auto || 0 },
      { key: 'cockpit', score: p.score_cockpit || 0 },
      { key: 'website', score: p.score_site || 0 }
    ];
    return all.filter(function (x) { return x.score >= PITCH_BAR; })
              .sort(function (a, b) { return b.score - a.score; });
  }

/* ================= WHAT MARK LEARNS, AND WHAT HE TEACHES =================

     ⚠️ NOTHING HERE DECIDES ANYTHING. Every lesson below is arithmetic over
     outcomes that actually happened, and the only thing it produces is a
     PROPOSAL. Mark never edits his own playbook, for the plain reason that an
     agent which rewrites its own instructions from its own results is an agent
     nobody can audit after the fact.

     ⚠️ AND NOTHING HERE USES AN OPEN. Apple Mail Privacy Protection fetches
     every image in every message on delivery, so an "open" is a number that
     looks like attention and is not one. Replies, meetings and the words people
     wrote back are the only signal, and they are all real.

     ⚠️ A LESSON FROM THREE EMAILS IS NOT A LESSON. Eight is the floor for any
     claim about a group, and below it the screen says how many more are needed
     rather than showing a percentage of four. That number is low on purpose
     (this is twenty a day, not twenty thousand) and it is still the difference
     between learning and superstition. */

  var LESSON_MIN = 8;
  /* 5.8% replies on sends of fifty or fewer, against 2.1% on bulk (Apollo,
     2026). A BENCHMARK, not a promise: it is here so a rate can be read as good
     or bad rather than just as a number. */
  var REPLY_BENCHMARK = 0.058;

  function sentMessages(d) {
    return (d.sends || []).filter(function (s) { return s && s.sent_at; });
  }

  function outreachStats(d) {
    var sent = sentMessages(d);
    var replied = sent.filter(function (s) { return s.replied_at; });
    var good = replied.filter(function (s) { return s.sentiment === 'positive'; });
    return {
      sent: sent.length,
      replied: replied.length,
      positive: good.length,
      meetings: replied.filter(function (s) { return s.meeting; }).length,
      stopped: (d.prospects || []).filter(function (p) {
        return p.stage === 'parked' && /not to be contacted/i.test(p.parked_why || '');
      }).length,
      rate: sent.length ? replied.length / sent.length : null,
      benchmark: REPLY_BENCHMARK,
      enough: sent.length >= LESSON_MIN,
      shortBy: Math.max(0, LESSON_MIN - sent.length)
    };
  }

  /* One row per group, with the counts kept alongside the rate so nothing ever
     shows a percentage without the n it came from. */
  function groupOutcomes(d, keyOf) {
    var byKey = {};
    sentMessages(d).forEach(function (s) {
      var k = keyOf(s);
      if (!k) return;
      var g = byKey[k] || (byKey[k] = { key: k, sent: 0, replied: 0, positive: 0 });
      g.sent++;
      if (s.replied_at) g.replied++;
      if (s.sentiment === 'positive') g.positive++;
    });
    return Object.keys(byKey).map(function (k) {
      var g = byKey[k];
      g.rate = g.sent ? g.replied / g.sent : 0;
      g.enough = g.sent >= LESSON_MIN;
      return g;
    }).sort(function (a, b) { return b.rate - a.rate || b.sent - a.sent; });
  }

  function prospectOf(d, id) {
    return (d.prospects || []).filter(function (p) { return p.id === id; })[0] || null;
  }

  /* The playbook: what Mark leads with, and what he has been told to leave
     alone. It is a stored setting rather than code, because the whole point is
     that it changes with the evidence. `lead` is the order findings are tried
     in, which is the one lever that provably changed a reply rate. */
  var DEFAULT_PLAYBOOK = { lead: FINDING_ORDER.slice(), avoid: [], why: [], updated: null };

  function playbookOf(d) {
    var b = (d && d.outreach_playbook) || null;
    if (!b || !Array.isArray(b.lead) || !b.lead.length) return DEFAULT_PLAYBOOK;
    /* a finding the playbook does not mention still has to be reachable, or a
       stale playbook silently switches off a whole class of subject line */
    var lead = b.lead.filter(function (x) { return FINDING_ORDER.indexOf(x) >= 0; });
    FINDING_ORDER.forEach(function (x) { if (lead.indexOf(x) < 0) lead.push(x); });
    return { lead: lead, avoid: b.avoid || [], why: b.why || [], updated: b.updated || null };
  }

  /* ⚠️ Every lesson carries its own n and says whether it is sure. A lesson that
     is not sure is still worth showing, as a thing to watch rather than a thing
     to act on, and it says which. */
  function outreachLessons(d) {
    var out = [];
    var st = outreachStats(d);
    if (!st.sent) return out;

    var byFinding = groupOutcomes(d, function (s) { return s.finding_id || ''; });
    var sureFindings = byFinding.filter(function (g) { return g.enough; });
    if (sureFindings.length >= 2) {
      var best = sureFindings[0], worst = sureFindings[sureFindings.length - 1];
      if (best.key !== worst.key && best.rate > worst.rate) {
        out.push({
          id: 'lead_with',
          what: 'Leading with "' + findingWords(best.key) + '" gets answered more than "' +
                findingWords(worst.key) + '".',
          evidence: pct(best.rate) + ' of ' + best.sent + ' against ' +
                    pct(worst.rate) + ' of ' + worst.sent + '.',
          sure: true,
          change: { kind: 'lead', first: best.key, last: worst.key }
        });
      }
    } else if (byFinding.length >= 2) {
      out.push({
        id: 'lead_waiting',
        what: 'Not enough yet to say which problem is worth leading with.',
        evidence: 'The biggest group is ' + byFinding[0].sent + ' message(s); ' +
                  LESSON_MIN + ' is the floor for a claim.',
        sure: false, change: null
      });
    }

    var byPlace = groupOutcomes(d, function (s) {
      var p = prospectOf(d, s.prospect_id);
      return p ? ((p.city || '') + (p.country ? ', ' + p.country : '')) : '';
    });
    var deadPlace = byPlace.filter(function (g) { return g.enough && g.replied === 0; })[0];
    if (deadPlace) {
      out.push({
        id: 'avoid_place',
        what: 'Nothing has ever come back from ' + deadPlace.key + '.',
        evidence: deadPlace.sent + ' sent, not one reply. Worth stopping rather than ' +
                  'spending another week on it.',
        sure: true,
        change: { kind: 'avoid', what: deadPlace.key }
      });
    }

    var byService = groupOutcomes(d, function (s) { return (s.services || [])[0] || ''; });
    var bestService = byService.filter(function (g) { return g.enough; })[0];
    if (bestService) {
      out.push({
        id: 'service',
        what: 'The ' + serviceWords(bestService.key) + ' pitch is the one that lands.',
        evidence: pct(bestService.rate) + ' of ' + bestService.sent + '.',
        sure: true, change: null
      });
    }

    /* The rate against the benchmark. Last, because it is the least actionable
       and the easiest to stare at. */
    if (st.enough) {
      out.push({
        id: 'rate',
        what: st.rate >= st.benchmark
          ? 'The reply rate is ahead of what small, specific outreach usually gets.'
          : 'The reply rate is behind what small, specific outreach usually gets.',
        evidence: pct(st.rate) + ' of ' + st.sent + ', against a 5.8% benchmark for ' +
                  'sends of fifty or fewer.',
        sure: true, change: null
      });
    } else {
      out.push({
        id: 'rate_waiting',
        what: 'Too early to read the reply rate.',
        evidence: st.sent + ' sent. ' + st.shortBy + ' more before the number means anything.',
        sure: false, change: null
      });
    }
    return out;
  }

  function pct(r) { return (Math.round((r || 0) * 1000) / 10) + '%'; }
  function findingWords(id) {
    var W = { no_https: 'the certificate', site_down: 'the site being down',
              site_error: 'the site erroring', no_site: 'having no site at all',
              not_mobile: 'not fitting a phone', stale: 'a stale year in the footer' };
    return W[id] || id;
  }
  function serviceWords(k) {
    return { automations: 'automations', cockpit: 'cockpit', website: 'website' }[k] || k;
  }

  /* ⚠️ WHAT MARK NEEDS FROM HIM. This is the half of the brief that makes the
     agent worth owning rather than worth watching: a row he has to touch, named,
     with the reason. An agent that only reports is an agent that becomes
     wallpaper. */
  function markNeeds(d) {
    var out = [];
    var noName = (d.prospects || []).filter(function (p) {
      return p.needs_lookup && p.stage !== 'parked';
    });
    if (noName.length) {
      out.push({ id: 'names', n: noName.length, where: '#/outreach',
        what: noName.length + ' row(s) where I could not find a person.',
        why: 'Each one is a search link and two fields. A row with nobody on it is ' +
             'a row I open with "Hello," which reads like a circular.' });
    }

    var drafted = (d.prospects || []).filter(function (p) { return p.stage === 'drafted'; });
    if (drafted.length) {
      out.push({ id: 'unsent', n: drafted.length, where: '#/jarvis',
        what: drafted.length + ' email(s) approved and never sent.',
        why: 'They are written and sitting still, which is the same as not having ' +
             'written them.' });
    }

    var warm = sentMessages(d).filter(function (s) {
      return s.sentiment === 'positive' && !s.meeting;
    });
    if (warm.length) {
      out.push({ id: 'warm', n: warm.length, where: '#/outreach',
        what: warm.length + ' warm repl' + (warm.length === 1 ? 'y' : 'ies') +
              ' with no time in the diary.',
        why: 'Somebody said yes and nothing was booked. This is the only item here ' +
             'that costs money every day it waits.' });
    }

    /* ⚠️ THE ONES MARK HAS STOPPED WRITING TO. Somebody we have spoken to is not
       cold, so he does not draft for them: that makes them invisible unless they
       are named here. The last thing they said is the thing to act on. */
    var spoken = (d.prospects || []).filter(function (p) {
      return commsOf(p).length && p.stage !== 'parked' && p.stage !== 'won' && !p.client_id;
    });
    if (spoken.length) {
      var newest = spoken.map(function (p) {
        return { name: p.name, at: (lastComm(p) || {}).at || '', note: (lastComm(p) || {}).note || '' };
      }).sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); })[0];
      out.push({ id: 'spoken', n: spoken.length, where: '#/outreach',
        what: spoken.length + ' you have spoken to and I have stopped writing to.',
        why: 'The oldest is ' + newest.name + ', ' +
             (newest.at ? 'last spoken to on ' + niceDate(newest.at) : 'with no date on it') +
             ': "' + String(newest.note).slice(0, 110) + '". A cold email now would read ' +
             'as if nobody had spoken to them.' });
    }

    var noEmail = (d.prospects || []).filter(function (p) {
      return !p.email && !p.needs_lookup && p.stage !== 'parked' && worthPitching(p).length;
    });
    if (noEmail.length) {
      out.push({ id: 'addresses', n: noEmail.length, where: '#/outreach',
        what: noEmail.length + ' worth writing to with no address published.',
        why: 'Their site did not print one. Their contact form or their Instagram ' +
             'will, and then I can write.' });
    }
    return out;
  }

  /* The daily brief: what went, what came back, the one thing to change, and
     what he has to do himself. One shape, read by the Overview and the Outreach
     screen, so the two can never disagree. */
  function outreachBrief(d) {
    var st = outreachStats(d);
    var lessons = outreachLessons(d);
    var sure = lessons.filter(function (l) { return l.sure && l.change; })[0] ||
               lessons.filter(function (l) { return l.sure; })[0] || null;
    return {
      at: today(),
      stats: st,
      /* ⚠️ ONE change, not a list. A brief with six recommendations is a brief
         nobody acts on, and the arithmetic cannot rank six honestly anyway. */
      change: sure,
      lessons: lessons,
      needs: markNeeds(d),
      playbook: playbookOf(d)
    };
  }

  /* Is there a playbook change worth proposing, and has it not been proposed in
     the last week? Mark proposes; the playbook only moves when somebody says so. */
  function playbookProposal(d) {
    var book = playbookOf(d);
    var change = outreachLessons(d).filter(function (l) { return l.sure && l.change; })[0];
    if (!change) return null;
    var c = change.change;
    if (c.kind === 'lead') {
      if (book.lead[0] === c.first) return null;          /* already doing it */
      var lead = [c.first].concat(book.lead.filter(function (x) { return x !== c.first; }));
      return { lesson: change, next: { lead: lead, avoid: book.avoid.slice() } };
    }
    if (c.kind === 'avoid') {
      if (book.avoid.indexOf(c.what) >= 0) return null;
      return { lesson: change,
               next: { lead: book.lead.slice(), avoid: book.avoid.concat([c.what]) } };
    }
    return null;
  }

  function hoursSaved(store, from, to) {
    var mins = (store.runs || []).filter(function (r) {
      if (r.status !== 'approved' && r.status !== 'auto') return false;
      var d = String(r.at).slice(0, 10);
      return (!from || d >= from) && (!to || d <= to);
    }).reduce(function (a, r) { return a + (r.minutes || 0); }, 0);
    return { minutes: mins, hours: Math.round(mins / 60) };
  }

  function newClient(o) {
    o = o || {};
    return {
      id: o.id || uid('c'),
      ref: o.ref || null,
      name: String(o.name || '').trim(),          /* the COMPANY, not a person */
      type: o.type || 'lead',
      sector: o.sector || '',
      website: o.website || '',
      instagram: o.instagram || '',
      address: newAddress(o.address),
      gst: o.gst || '',
      tax_id: o.tax_id || '',
      bank: { name: (o.bank && o.bank.name) || '', account: (o.bank && o.bank.account) || '',
              ifsc: (o.bank && o.bank.ifsc) || '', swift: (o.bank && o.bank.swift) || '',
              holder: (o.bank && o.bank.holder) || '', branch: (o.bank && o.bank.branch) || '' },
      contacts: (o.contacts || []).map(newContact),
      docs: o.docs || [],
      /* every conversation with this brand worth finding again */
      comms: Array.isArray(o.comms) ? o.comms : [],
      mobile: normMobile(o.mobile),                /* the primary contact's, for display */
      email: o.email || '',
      source: o.source || 'referral',
      assigned_to: o.assigned_to || null,
      product: o.product || null,        /* which line of ours they are on */
      /* No stage here on purpose — a stage belongs to an opportunity, not a
         person. See newOpp(). */
      consent: o.consent !== false,
      created: o.created || today(),
      last_touch: o.last_touch || today(),
      purchased: o.purchased || [],
      shown: o.shown || [],          /* where they stand on each product line */
      notes: o.notes || [],
      timeline: o.timeline || []
    };
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  /* Everything that creates a client funnels through here, so one number can
     never become two records. */
  /* The company is the record. A name that already exists is the same company;
     a number that already exists belongs to somebody already inside one. Either
     way we add to what is there rather than minting a duplicate — which is the
     single most common way a CRM rots. */
  function upsertClient(clients, o) {
    if (!validName(o.name)) return { error: 'Enter the company name.' };
    if (o.mobile && !validMobile(o.mobile)) return { error: 'That mobile number does not look right.' };

    var found = findByName(clients, o.name) || findByMobile(clients, o.mobile);
    if (found) {
      ['email', 'assigned_to', 'sector', 'website', 'instagram', 'gst', 'tax_id']
        .forEach(function (k) { if (nonEmpty(o[k])) found[k] = o[k]; });
      if (o.type && o.type !== 'lead') found.type = o.type;
      if (o.address) {
        found.address = found.address || newAddress();
        Object.keys(newAddress()).forEach(function (k) {
          if (nonEmpty(o.address[k])) found.address[k] = o.address[k];
        });
      }
      /* a new person at a company we already know is a CONTACT, not a client */
      if (o.contact_name && validName(o.contact_name)) {
        addContact(found, { name: o.contact_name, designation: o.designation,
                            mobile: o.mobile, email: o.email });
      }
      found.last_touch = today();
      return { client: found, created: false };
    }

    var c = newClient(o);
    if (o.contact_name && validName(o.contact_name)) {
      addContact(c, { name: o.contact_name, designation: o.designation,
                      mobile: o.mobile, email: o.email, primary: true });
    }
    clients.push(c);
    return { client: c, created: true };
  }

  /* One mark per product per client — re-marking replaces, never duplicates.

     ⚠️ `client.shown` is created here if it is missing rather than assumed. It
     was assumed, and newClient() never made one while migrate() deleted it from
     every upgraded record — so the first stage move to Pitched threw
     "cannot read properties of undefined". The wishlist this also used to write
     is gone: an agency's client does not save products for later. */
  function addMark(client, stockId, mark, byId) {
    if (!client) return { error: 'No client.' };
    if (!MARKS[mark]) return { error: 'Unknown mark.' };
    if (!Array.isArray(client.shown)) client.shown = [];
    var row = client.shown.filter(function (s) { return s.product_id === stockId; })[0];
    if (row) { row.mark = mark; row.when = today(); row.by = byId; }
    else client.shown.push({ product_id: stockId, mark: mark, when: today(), by: byId });
    client.last_touch = today();
    return { client: client, mark: mark };
  }

  function markOf(client, stockId) {
    var r = (client.shown || []).filter(function (s) { return s.product_id === stockId; })[0];
    return r ? r.mark : null;
  }

  /* What this client is worth: the fees on their live engagements. It used to
     total the LIST price of everything on their wishlist, which for an agency
     with one product meant every client was worth exactly the same number. */
  function clientValue(client, opps) {
    return (opps || []).filter(function (o) {
      return o.client === client.id && o.outcome !== 'lost';
    }).reduce(function (a, o) { return a + (oppValue(o) || 0); }, 0);
  }

  /* suggestFor() lived here: it matched stock against a client's wanted body
     types, makes, year and budget band. An agency sells one thing and scopes it
     per client, so there is nothing to suggest. Deleted rather than reworded. */

  /* ================= WHATSAPP =================

     Everything here is Meta's rules, not ours, and they are worth stating
     because getting them wrong is what makes a campaign quietly fail.

     THE TIERS. A business phone number may send to a limited number of unique
     users in a moving 24-hour window: 250, then 2,000, 10,000, 100,000, then
     unlimited. You reach 2,000 by verifying the business or by delivering 2,000
     messages to unique numbers in a 30-day window on high-quality templates.
     Above that it climbs on its own, within about six hours, when quality holds
     AND you have used at least half your current limit in the last 7 days. So
     sitting well under the limit is itself what keeps you off the next tier.
     — developers.facebook.com/docs/whatsapp/messaging-limits/

     THE CATEGORIES. Three, not two: Marketing, Utility and Authentication. The
     category is chosen at submission and Meta will re-categorise a template it
     disagrees with, which changes what it costs and whether it is throttled.

     THE FAILURES. A marketing message is throttled per USER, not per business:
     131049 means that person has had enough marketing this week from everyone,
     and retrying inside 24 hours fails again. 131047 means the 24-hour service
     window has closed and only a template will get through. Those two are most
     of what goes wrong, and neither is a bug in your copy. */

  var WA_TIERS = [
    { cap: 250,    label: '250 a day',      note: 'Where every new number starts.' },
    { cap: 2000,   label: '2,000 a day',    note: 'Verify the business, or deliver 2,000 to unique numbers in 30 days on high-quality templates.' },
    { cap: 10000,  label: '10,000 a day',   note: 'Automatic, once quality holds and you use half your current limit in 7 days.' },
    { cap: 100000, label: '100,000 a day',  note: 'Automatic, same two conditions.' },
    { cap: Infinity, label: 'Unlimited',    note: 'The top tier.' }
  ];
  var WA_CATEGORIES = {
    MARKETING:      { label: 'Marketing', note: 'Offers, news, anything promotional. Throttled per recipient and the first thing Meta pauses.' },
    UTILITY:        { label: 'Utility',   note: 'About something they already did: an invoice, a delivery, an appointment. Cheaper and far less likely to be throttled.' },
    AUTHENTICATION: { label: 'Authentication', note: 'One-time codes only. Fixed format, no marketing language.' }
  };
  var WA_STATES = {
    DRAFT:            { label: 'Draft',            pill: 'dim',  note: 'Not sent to Meta yet. Nothing can be sent on it.' },
    IN_REVIEW:        { label: 'In review',        pill: 'warn', note: 'With Meta. Usually minutes, sometimes a day.' },
    APPROVED:         { label: 'Approved',         pill: 'ok',   note: 'Sendable.' },
    REJECTED:         { label: 'Rejected',         pill: 'bad',  note: 'Meta refused it. Edit and resubmit, or appeal.' },
    PAUSED:           { label: 'Paused',           pill: 'bad',  note: 'Too many people blocked or reported it. It resumes itself, or you fix the copy.' },
    DISABLED:         { label: 'Disabled',         pill: 'bad',  note: 'Paused too often. This one is finished.' },
    APPEAL_REQUESTED: { label: 'Appeal in',        pill: 'warn', note: 'Waiting on a human at Meta.' }
  };
  var WA_QUALITY = {
    HIGH:    { label: 'High',    pill: 'ok' },
    MEDIUM:  { label: 'Medium',  pill: 'warn' },
    LOW:     { label: 'Low',     pill: 'bad' },
    PENDING: { label: 'Not rated yet', pill: 'dim' }
  };
  /* The number's own rating, which is what actually decides the tier. */
  var WA_HEALTH = {
    GREEN:  { label: 'Green',  pill: 'ok',   note: 'Healthy. The limit climbs on its own from here.' },
    YELLOW: { label: 'Yellow', pill: 'warn', note: 'Quality is slipping. Stop sending marketing for a few days.' },
    RED:    { label: 'Red',    pill: 'bad',  note: 'The limit will be cut. Send nothing promotional until it recovers.' }
  };

  /* Why a send failed, in Meta's own codes, with the thing to actually do. */
  var WA_ERRORS = {
    131049: { title: 'That person has had enough marketing',
              why: 'A per-USER cap, not yours. Meta limits how much marketing any one person receives, from everybody.',
              fix: 'Wait 24 hours. Retrying sooner fails again. If it keeps happening, send it as Utility or not at all.',
              fault: 'meta' },
    131047: { title: 'The 24-hour window has closed',
              why: 'They have not replied in 24 hours, so a free-form message will not go.',
              fix: 'Send an approved template instead. That is the whole point of templates.',
              fault: 'us' },
    131026: { title: 'Cannot be delivered',
              why: 'Their account is inactive, has not accepted the current terms, or the app is too old.',
              fix: 'Nothing technical to do. Reach them another way.',
              fault: 'them' },
    131042: { title: 'Billing is not set up',
              why: 'No payment method on the WhatsApp Business account, or the credit line is over.',
              fix: 'Fix billing in Business Manager. Everything is blocked until you do.',
              fault: 'us' },
    132000: { title: 'Wrong number of variables',
              why: 'The template expects a different count from what was sent.',
              fix: 'Check the variables on the template against what the send is filling in.',
              fault: 'us' },
    132001: { title: 'No such approved template',
              why: 'Wrong name, wrong language, or it was never approved.',
              fix: 'Check the name and language, and that it is Approved rather than In review.',
              fault: 'us' },
    132007: { title: 'The copy breaks a policy',
              why: 'Meta read the template and refused it.',
              fix: 'Rewrite it. Promotional language in a Utility template is the usual cause.',
              fault: 'us' },
    132012: { title: 'A variable is the wrong shape',
              why: 'A value did not match the format the template declares.',
              fix: 'Check what is being passed in — a blank where a number was expected is the common one.',
              fault: 'us' },
    132015: { title: 'The template was paused for quality',
              why: 'Too many recipients blocked or reported messages on it.',
              fix: 'Rewrite it and resubmit. Sending more on it will not work.',
              fault: 'us' },
    133010: { title: 'The number is not registered',
              why: 'This business number is not registered on the platform.',
              fix: 'Register and verify it before anything can be sent.',
              fault: 'us' }
  };
  function waError(code) {
    return WA_ERRORS[code] || { title: 'Failed with code ' + code,
      why: 'Not one of the codes we have written down.',
      fix: 'Look it up in Meta\'s error reference.', fault: 'unknown' };
  }

  /* ---- the variables a template can carry ----

     Meta's named parameters are lowercase and underscores only, so a variable
     is `{{client_name}}` on the wire. What matters here is that NOBODY TYPES
     ONE. You pick it from this list, and because every entry carries the code
     that reads the value, a variable that is on the list is a variable that
     will resolve. A hand-typed {{clinet_name}} is a message that goes out with
     a blank where their name should be, and you find out from the client. */
  var WA_VARS = [
    /* the company */
    { key: 'client_name',      group: 'Client',   label: 'Client name',
      read: function (x) { return x.client && x.client.name; } },
    { key: 'client_legal_name', group: 'Client',  label: 'Registered company name',
      read: function (x) { return x.client && x.client.legal_name; } },
    { key: 'client_city',      group: 'Client',   label: 'City',
      read: function (x) { return x.client && x.client.address && x.client.address.city; } },
    { key: 'client_sector',    group: 'Client',   label: 'Sector',
      read: function (x) { return x.client && x.client.sector; } },
    { key: 'client_ref',       group: 'Client',   label: 'Client reference',
      read: function (x) { return x.client && x.client.ref; } },
    { key: 'client_gst',       group: 'Client',   label: 'GST number',
      read: function (x) { return x.client && x.client.gst; } },

    /* the person */
    { key: 'contact_name',     group: 'Contact',  label: 'Who we deal with',
      read: function (x) { return x.contact && x.contact.name; } },
    { key: 'contact_first_name', group: 'Contact', label: 'Their first name',
      read: function (x) { return x.contact && String(x.contact.name || '').split(' ')[0]; } },
    { key: 'contact_designation', group: 'Contact', label: 'Their designation',
      read: function (x) { return x.contact && x.contact.designation; } },

    /* the work */
    { key: 'engagement_ref',   group: 'Engagement', label: 'Engagement reference',
      read: function (x) { return x.opp && x.opp.ref; } },
    { key: 'engagement_title', group: 'Engagement', label: 'What we called it',
      read: function (x) { return x.opp && x.opp.title; } },
    { key: 'engagement_product', group: 'Engagement', label: 'What we are selling',
      read: function (x) { return x.opp && productName(x.opp.product); } },
    { key: 'engagement_stage', group: 'Engagement', label: 'Stage',
      read: function (x) { return x.opp && x.opp.stage; } },
    { key: 'engagement_fee',   group: 'Engagement', label: 'Agreed fee',
      read: function (x) { return x.opp && x.opp.fee != null ? money(x.opp.fee) : null; } },
    { key: 'engagement_scope', group: 'Engagement', label: 'Scope',
      read: function (x) { return x.opp && x.opp.scope; } },
    { key: 'demo_url',         group: 'Engagement', label: 'Live URL',
      read: function (x) { return x.opp && x.opp.demo; } },
    { key: 'demo_login',       group: 'Engagement', label: 'Their login',
      read: function (x) { return x.opp && x.opp.login; } },
    { key: 'demo_password',    group: 'Engagement', label: 'Their password',
      read: function (x) { return x.opp && x.opp.pass; },
      care: 'A password in a marketing template will be refused. Utility only.' },

    /* the build */
    { key: 'delivery_stage',   group: 'Delivery', label: 'Delivery stage',
      read: function (x) { return x.opp && x.opp.proc && x.opp.proc.stage; } },
    { key: 'handover_date',    group: 'Delivery', label: 'Handover promised by',
      read: function (x) { return x.opp && x.opp.proc && x.opp.proc.plan && x.opp.proc.plan['Handover']; } },
    { key: 'kickoff_date',     group: 'Delivery', label: 'Kickoff date',
      read: function (x) { return x.opp && x.opp.proc && x.opp.proc.started; } },
    { key: 'build_length',     group: 'Delivery', label: 'Build length in days',
      read: function (x) { return x.opp && x.opp.proc && x.opp.proc.duration; } },

    /* the money */
    { key: 'invoice_ref',      group: 'Invoice',  label: 'Invoice reference',
      read: function (x) { return x.invoice && x.invoice.ref; } },
    { key: 'invoice_amount',   group: 'Invoice',  label: 'Invoice amount',
      read: function (x) { return x.invoice ? money(x.invoice.amount) : null; } },
    { key: 'invoice_due',      group: 'Invoice',  label: 'Due date',
      read: function (x) { return x.invoice && x.invoice.due; } },
    { key: 'amount_owed',      group: 'Invoice',  label: 'Total owed',
      read: function (x) { return x.owed != null ? money(x.owed) : null; } },

    /* us */
    { key: 'our_name',         group: 'Us',       label: 'Our company name',
      read: function () { return 'ZippyScale'; } },
    { key: 'owner_name',       group: 'Us',       label: 'Who is writing',
      read: function (x) { return x.me && x.me.name; } },
    { key: 'owner_mobile',     group: 'Us',       label: 'Our number',
      read: function (x) { return x.me && x.me.mobile; } },
    { key: 'today',            group: 'Us',       label: "Today's date",
      read: function () { return today(); } }
  ];
  function waVarGroups() {
    var out = [];
    WA_VARS.forEach(function (v) { if (out.indexOf(v.group) < 0) out.push(v.group); });
    return out;
  }
  function waResolve(key) {
    return WA_VARS.filter(function (v) { return v.key === key; })[0] || null;
  }

  /* Fill a template against a real record, and say which variables came back
     empty rather than sending a message with a hole in it. */
  function waFill(text, ctx) {
    var missing = [];
    var out = String(text || '').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, function (whole, key) {
      var v = waResolve(key);
      if (!v) { missing.push(key); return whole; }
      var val = null;
      try { val = v.read(ctx || {}); } catch (e) { val = null; }
      if (!nonEmpty(val)) { missing.push(key); return whole; }
      return String(val);
    });
    return { text: out, missing: missing };
  }

  function templateVars(t) {
    var found = [];
    [t && t.header, t && t.body, t && t.footer].forEach(function (part) {
      String(part || '').replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, function (w, k) {
        if (found.indexOf(k) < 0) found.push(k);
        return w;
      });
    });
    return found;
  }

  /* ---- the template itself ---- */

  /* Meta's rule, not ours: lowercase letters, digits and underscores, 512 max. */
  function validTemplateName(n) { return /^[a-z0-9_]{1,512}$/.test(String(n || '')); }

  function newTemplate(o) {
    o = o || {};
    return {
      id: o.id || uid('tpl'),
      name: o.name || '',
      category: o.category || 'UTILITY',
      language: o.language || 'en',
      header: o.header || '',
      body: o.body || '',
      footer: o.footer || '',
      buttons: Array.isArray(o.buttons) ? o.buttons : [],
      state: o.state || 'DRAFT',
      quality: o.quality || 'PENDING',
      rejected_for: o.rejected_for || '',
      created: o.created || today(),
      submitted: o.submitted || null,
      decided: o.decided || null,
      sent: o.sent || 0,
      delivered: o.delivered || 0,
      read: o.read || 0,
      failed: o.failed || 0
    };
  }

  function validateTemplate(t) {
    if (!validTemplateName(t.name))
      return 'A template name is lowercase letters, numbers and underscores only — no spaces or capitals. Meta refuses anything else.';
    if (!nonEmpty(t.body)) return 'The body is the message. It cannot be empty.';
    if (String(t.body).length > 1024) return 'The body is over 1024 characters, which Meta will refuse.';
    if (String(t.footer || '').length > 60) return 'The footer is over 60 characters, which Meta will refuse.';
    if (!WA_CATEGORIES[t.category]) return 'Pick a category.';
    var unknown = templateVars(t).filter(function (k) { return !waResolve(k); });
    if (unknown.length)
      return 'This carries ' + unknown.map(function (k) { return '{{' + k + '}}'; }).join(', ') +
             ', which is not a variable this cockpit can fill. It would send blank.';
    if (t.category === 'AUTHENTICATION' && templateVars(t).length > 1)
      return 'An authentication template carries one variable, the code, and nothing else.';
    if (t.category === 'UTILITY' && /\b(offer|discount|sale|free|deal|limited time|hurry)\b/i.test(t.body))
      return 'That reads as marketing, and Meta re-categorises a Utility template that does. ' +
             'Either soften the wording or submit it as Marketing.';
    return null;
  }

  /* ---- what actually happened ---- */

  function waStats(sends, range) {
    var rows = (sends || []).filter(function (x) { return !range || inRange(x.at, range); });
    var out = { sent: rows.length, delivered: 0, read: 0, failed: 0 };
    rows.forEach(function (x) {
      if (x.state === 'failed') out.failed++;
      else {
        out.delivered++;
        if (x.state === 'read') out.read++;
      }
    });
    out.deliveredPct = out.sent ? Math.round(100 * out.delivered / out.sent) : null;
    out.failedPct = out.sent ? Math.round(100 * out.failed / out.sent) : null;
    out.readPct = out.delivered ? Math.round(100 * out.read / out.delivered) : null;
    return out;
  }

  /* Failures grouped by reason, worst first, because "43 failed" is a number
     and "38 of them were the same per-user cap" is something you can act on. */
  function waFailures(sends, range) {
    var by = {};
    (sends || []).forEach(function (x) {
      if (x.state !== 'failed' || (range && !inRange(x.at, range))) return;
      var code = x.code || 0;
      (by[code] = by[code] || { code: code, n: 0, info: waError(code), when: x.at })
        .n++;
    });
    return Object.keys(by).map(function (k) { return by[k]; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  function waTier(cap) {
    for (var i = 0; i < WA_TIERS.length; i++) if (WA_TIERS[i].cap === cap) return WA_TIERS[i];
    return WA_TIERS[0];
  }
  function waTierIndex(cap) {
    for (var i = 0; i < WA_TIERS.length; i++) if (WA_TIERS[i].cap === cap) return i;
    return 0;
  }

  /* ================= AUTOMATIONS =================
     The GHL shape the team already knows: Audience -> When -> Only if -> Then.
     One `kind` field on each action decides the whole internal/client-facing UX. */

  /* What an agency needs chasing. Every one of these is something that has
     actually gone wrong here at least once. */
  var TRIGGERS = {
    new_enquiry:      { label: 'A new enquiry arrives',                group: 'Enquiry',  cfg: { channel: ['any', 'WhatsApp', 'Instagram', 'Google', 'Meta ad', 'LinkedIn', 'Referral', 'Website'] } },
    wa_reply:         { label: 'They reply on WhatsApp',               group: 'Enquiry',  cfg: {} },
    missed_call:      { label: 'A call is missed',                     group: 'Enquiry',  cfg: {} },
    form_submit:      { label: 'The website form is submitted',        group: 'Enquiry',  cfg: {} },
    no_contact:       { label: 'A lead goes untouched for',            group: 'Enquiry',  cfg: { days: 'number' } },

    discovery_done:   { label: 'A discovery call is marked done',      group: 'Sales',    cfg: {} },
    not_pitched:      { label: 'Discovery done but no pitch after',    group: 'Sales',    cfg: { days: 'number' } },
    mou_sent:         { label: 'An MOU goes out',                      group: 'Sales',    cfg: {} },
    mou_unsigned:     { label: 'An MOU sits unsigned for',             group: 'Sales',    cfg: { days: 'number' } },
    mou_revised:      { label: 'An MOU is revised again',              group: 'Sales',    cfg: {} },
    deal_won:         { label: 'A deal is won',                        group: 'Sales',    cfg: {} },
    deal_lost:        { label: 'A deal is lost',                       group: 'Sales',    cfg: { reason: 'text' } },

    invoice_raised:   { label: 'An invoice is raised',                 group: 'Money',    cfg: {} },
    invoice_overdue:  { label: 'An invoice is unpaid past its terms by', group: 'Money',  cfg: { days: 'number' } },
    payment_in:       { label: 'A payment lands',                      group: 'Money',    cfg: {} },
    fee_uninvoiced:   { label: 'Part of an agreed fee is never invoiced', group: 'Money', cfg: {} },

    build_started:    { label: 'A build enters delivery',              group: 'Delivery', cfg: {} },
    onboarding_stuck: { label: 'Onboarding has no answers after',      group: 'Delivery', cfg: { days: 'number' } },
    milestone_slipped:{ label: 'A milestone date passes unmet',        group: 'Delivery', cfg: {} },
    blocked_on_client:{ label: 'A build waits on the client for',      group: 'Delivery', cfg: { days: 'number' } },
    testing_started:  { label: 'Client testing begins',                group: 'Delivery', cfg: {} },
    handover_done:    { label: 'A build is handed over',               group: 'Delivery', cfg: {} },
    unpitched:        { label: 'Work is finished and never sent after', group: 'Delivery', cfg: { days: 'number' } },
    demo_down:        { label: 'A live build stops responding',        group: 'Delivery', cfg: {} },
    checkin_due:      { label: 'A handover was',                       group: 'Delivery', cfg: { days: 'number' } },

    behind_target:    { label: 'The month is behind target by',        group: 'Team',     cfg: { pct: 'number' } },
    credential_missing:{ label: 'A credential we need is not on file', group: 'Team',     cfg: {} }
  };

  var ACTS = {
    notify_person: { label: 'Notify one person',           kind: 'internal', cfg: { who: 'staff', text: 'text' } },
    notify_role:   { label: 'Notify everyone in a role',   kind: 'internal', cfg: { role: 'role', text: 'text' } },
    followup:      { label: 'Put a follow-up on their salesperson', kind: 'internal', cfg: { due_in_days: 'number', text: 'text' } },
    assign:        { label: 'Assign the client',         kind: 'internal', cfg: { who: 'staff' } },
    wait:          { label: 'Wait',                        kind: 'internal', cfg: { hours: 'number' } },
    wa_template:   { label: 'Send an approved WhatsApp template', kind: 'client', cfg: { template: 'template' } },
    wa_text:       { label: 'Send a WhatsApp message',     kind: 'client',   cfg: { text: 'text' } },
    review_request:{ label: 'Ask for a Google review',     kind: 'client',   cfg: {} },
    audience:      { label: 'Add to a campaign audience',  kind: 'client',   cfg: { name: 'text' } }
  };

  /* One client-facing step makes the whole rule client-facing. */
  function autoKind(a) {
    return (a.actions || []).some(function (x) {
      return ACTS[x.type] && ACTS[x.type].kind === 'client';
    }) ? 'client' : 'internal';
  }

  /* Who this rule would reach today. Counting only — nothing is ever sent. */
  /* ---- the conditions a rule can filter on ----

     Same contract as the WhatsApp variables and for the same reason: if it is on
     this list it works, and there is no way to put something on the screen that
     is not on this list. Before this, the "Only if" section was a free-text box
     with a datalist of seven labels — Budget, Products saved, Has a trade-in —
     three of which were a car dealer's, none of which was bound to anything, and
     NONE of which was ever read. You could write "Stage is Pitched" and it
     changed nothing at all. A whole section of a form with no effect.

     Each entry says how to read the value off a record, and what kind of control
     the value box should be, so the screen cannot offer a text field where the
     answer is one of five stages. */
  var COND_FIELDS = [
    { key: 'stage',      label: 'Stage',            type: 'select',
      options: function () { return OPP_STAGES; },
      read: function (x) { return x.opp && x.opp.stage; } },
    { key: 'delivery',   label: 'Delivery stage',   type: 'select',
      options: function () { return PROC_STAGES; },
      read: function (x) { return x.opp && x.opp.proc && x.opp.proc.stage; } },
    { key: 'product',    label: 'Product',          type: 'select',
      options: function () { return PRODUCTS.map(function (p) { return p.id; }); },
      labelFor: function (v) { return productName(v); },
      read: function (x) { return x.opp && x.opp.product; } },
    { key: 'owner',      label: 'Who owns it',      type: 'staff',
      read: function (x) { return x.opp && x.opp.assigned_to; } },
    { key: 'source',     label: 'Source',           type: 'select',
      options: function () { return Object.keys(SOURCES); },
      labelFor: function (v) { return SOURCES[v] || v; },
      read: function (x) { return x.opp && x.opp.source; } },
    { key: 'sector',     label: 'Sector',           type: 'text',
      read: function (x) { return x.client && x.client.sector; } },
    { key: 'client_type', label: 'They are',        type: 'select',
      options: function () { return Object.keys(CLIENT_TYPES); },
      labelFor: function (v) { return CLIENT_TYPES[v] || v; },
      read: function (x) { return x.client && x.client.type; } },
    { key: 'line',       label: 'Line',             type: 'line',
      read: function (x) { return x.opp && x.opp.product; } },
    { key: 'fee',        label: 'Opportunity value', type: 'number',
      read: function (x) { return x.opp && x.opp.fee; } },
    { key: 'owed',       label: 'Amount owed',      type: 'number',
      read: function (x) { return x.owed; } },
    { key: 'days_quiet', label: 'Days since we last spoke', type: 'number',
      read: function (x) { return x.daysQuiet; } },
    { key: 'mou',        label: 'MOU state',        type: 'select',
      options: function () { return ['none', 'sent', 'signed', 'disputed']; },
      read: function (x) { return x.opp && x.opp.mou; } },
    { key: 'blocked_on', label: 'Blocked on',       type: 'select',
      options: function () { return ['client', 'us', 'legal']; },
      read: function (x) { return x.opp && x.opp.blocked_on; } },
    { key: 'deployed',   label: 'Is it live',       type: 'select',
      options: function () { return ['yes', 'no']; },
      read: function (x) { return (x.opp && x.opp.demo) ? 'yes' : 'no'; } }
  ];
  function condField(k) {
    return COND_FIELDS.filter(function (f) { return f.key === k; })[0] || null;
  }
  var COND_OPS = ['is', 'is not', 'is more than', 'is less than', 'is set', 'is not set'];

  /* Build the record a condition is read against, once, from whatever we hold. */
  function condContext(d, opp) {
    var client = (d.clients || []).filter(function (c) { return c.id === opp.client; })[0] || null;
    var last = client && client.last_touch;
    return {
      opp: opp, client: client,
      owed: owedOn(d.invoices || [], opp.id),
      daysQuiet: last ? Math.abs(daysLeft(last)) : null
    };
  }

  /* One condition against one record. An unknown field fails CLOSED — it never
     silently passes, because a rule that fires on everything because somebody
     mistyped a field is worse than a rule that fires on nothing. */
  function matchCond(c, ctx) {
    var f = condField(c.f);
    if (!f) return false;
    var have = null;
    try { have = f.read(ctx); } catch (e) { have = null; }
    var want = c.v;
    switch (c.op) {
      case 'is set':      return nonEmpty(have);
      case 'is not set':  return !nonEmpty(have);
      case 'is more than': return Number(have) > Number(want);
      case 'is less than': return Number(have) < Number(want);
      case 'is not':      return String(have == null ? '' : have).toLowerCase() !==
                                 String(want == null ? '' : want).toLowerCase();
      default:            return String(have == null ? '' : have).toLowerCase() ===
                                 String(want == null ? '' : want).toLowerCase();
    }
  }
  /* All of them, or the rule does not fire. */
  function matchConds(a, ctx) {
    return (a.conds || []).every(function (c) { return matchCond(c, ctx); });
  }

  /* Who a client-facing rule would actually reach.

     ⚠️ This filtered on `c.stage`. A client has not carried a stage since the
     opportunity model replaced it, and migrate() deletes the field — so ANY rule
     with a stage filter matched nobody, always, and the dry run cheerfully
     reported an audience of 0 as though that were the answer. The stage lives on
     the engagement, so that is what has to be read. */
  function audienceOf(a, clients, d) {
    if (autoKind(a) === 'internal') return [];
    var store = d || { clients: clients, opportunities: [], invoices: [] };
    var opps = store.opportunities || [];
    return (clients || []).filter(function (c) {
      if (!c.consent) return false;
      if (a.sources && a.sources.length && a.sources.indexOf(c.source) < 0) return false;
      var mine = opps.filter(function (o) { return o.client === c.id; });
      if (a.stages && a.stages.length) {
        mine = mine.filter(function (o) {
          return a.stages.indexOf(o.stage) >= 0 ||
                 (o.proc && a.stages.indexOf(o.proc.stage) >= 0);
        });
        if (!mine.length) return false;
      }
      /* the conditions, which used to be read by nothing at all */
      if ((a.conds || []).length) {
        if (!mine.length) mine = opps.filter(function (o) { return o.client === c.id; });
        var any = mine.some(function (o) { return matchConds(a, condContext(store, o)); });
        if (!any) return false;
      }
      return true;
    });
  }

  /* The only thing a rule genuinely cannot do without is a step to take. A rule
     with no conditions runs every time, which is a perfectly ordinary rule; a
     rule with no audience filter reaches everyone, which is a decision, not an
     error. Demanding a stage or a source made half the sensible rules
     unsaveable. What IS still refused is a step that does not exist, because
     that one fires into nothing. */
  function validateAuto(a) {
    if (!a.actions || !a.actions.length) return 'Add at least one step. Everything else is optional.';
    var bad = (a.actions || []).filter(function (x) { return !ACTS[x.type]; });
    if (bad.length) return 'One of the steps is not a real action.';
    if (a.trigger && a.trigger.type && !TRIGGERS[a.trigger.type])
      return 'That trigger is not one this cockpit knows about.';
    var badCond = (a.conds || []).filter(function (c) { return c.f && !condField(c.f); });
    if (badCond.length)
      return 'A condition points at "' + badCond[0].f + '", which is not something we hold. ' +
             'It would never match.';
    return null;
  }

  /* A dry run: names the real audience, sends nothing. */
  function testAuto(a, clients, d) {
    var err = validateAuto(a);
    if (err) return { error: err };
    var aud = audienceOf(a, clients, d);
    return {
      kind: autoKind(a),
      audience: aud.length,
      names: aud.slice(0, 8).map(function (c) { return c.name; }),
      steps: (a.actions || []).map(function (x) { return (ACTS[x.type] || {}).label || x.type; }),
      conds: (a.conds || []).length,
      sent: 0
    };
  }


  /* The storefront block used to sit here: public sign-in by name + mobile, a
     per-visitor wishlist, saveCounts/clientsWhoSaved/clientRows, and a seed of
     seven invented shoppers with fake numbers and stock ids. ZippyScale has no
     storefront — this cockpit is private by design, it holds every client's
     credentials — so all of it is gone rather than reworded. */
  var APP_KEY = 'zippyscale_cockpit_v2';

  var api = {
    fmt: fmt, money: money, rupees: rupees, esc: esc, today: today, nonEmpty: nonEmpty,
    uid: uid,
    normMobile: normMobile, validName: validName,
    prepare: prepare,

    ROLES: ROLES, CAPS: CAPS, SCOPES: SCOPES,
    TARGET_ROLES: TARGET_ROLES, carriesTarget: carriesTarget, sellers: sellers, ACCESS_DEFAULT: ACCESS_DEFAULT, NO_ACCESS: NO_ACCESS,
    defaultAccess: defaultAccess, acc: acc, inScope: inScope, canOpen: canOpen,
    canSetPass: canSetPass, canSeePass: canSeePass, canSetRole: canSetRole, SENIOR_ROLES: SENIOR_ROLES, validEmail: validEmail, validPass: validPass,
    maskMobile: maskMobile, maskCost: maskCost,
    /* A GETTER, not the array. setStaff() REASSIGNS the local STAFF, so an
       exported reference froze whatever the list was at load time — which is
       empty. Every check that looped "each role on the roster" was looping
       nothing, and said so in a passing line. */
    get STAFF() { return STAFF; },
    DEMO_STAFF: DEMO_STAFF, authenticate: authenticate, staffById: staffById, staffByRole: staffByRole,
    setStaff: setStaff, staffList: staffList,
    lineName: lineName,
    OPEN_STAGES: OPEN_STAGES, CLOSED_STAGES: CLOSED_STAGES, OPP_STAGES: OPP_STAGES,
    canDelete: canDelete, deleteBlockers: deleteBlockers, deleteCost: deleteCost,
    BIN_DAYS: BIN_DAYS, binPut: binPut, binSweep: binSweep, binDaysLeft: binDaysLeft,
    binRestore: binRestore, binDrop: binDrop, binLabel: binLabel,
    deleteClient: deleteClient, clientBlockers: clientBlockers, clientCost: clientCost,
    deleteOpp: deleteOpp,
    isOpen: isOpen, newOpp: newOpp, oppsFor: oppsFor, openOppsFor: openOppsFor, openOpps: openOpps,
    STAGE_HELP: STAGE_HELP, attachProduct: attachProduct, isInPlay: isInPlay,
    MARK_RANK: MARK_RANK, STAGE_MARK: STAGE_MARK, NEEDS_PRODUCT: NEEDS_PRODUCT,
    LEGACY_STAGES: LEGACY_STAGES, fixStage: fixStage,
    NOTE_RULES: NOTE_RULES, scoreNote: scoreNote, noteAverage: noteAverage,
    pipelineByStage: pipelineByStage, moveOpp: moveOpp, winOpp: winOpp, loseOpp: loseOpp,
    oppValue: oppValue, newRequirement: newRequirement, MEETING_KINDS: MEETING_KINDS,
    MEETING_MODES: MEETING_MODES, MEETING_LENGTHS: MEETING_LENGTHS, meetingGap: meetingGap,
    newMeeting: newMeeting, newDeliverable: newDeliverable, upcoming: upcoming,
    clientSummary: clientSummary, clientTier: clientTier,
    PROC_STAGES: PROC_STAGES, PROC_HELP: PROC_HELP, PROC_NEEDS: PROC_NEEDS,
    PLAN_DURATIONS: PLAN_DURATIONS, PLAN_DEFAULT: PLAN_DEFAULT, PLAN_WEIGHTS: PLAN_WEIGHTS,
    planFor: planFor, milestones: milestones, planSlipped: planSlipped,
    get PRODUCTS() { return PRODUCTS; }, productById: productById,
    DEFAULT_PRODUCTS: DEFAULT_PRODUCTS, setProducts: setProducts, productList: productList,
    newProduct: newProduct, validateProduct: validateProduct,
    refSeq: refSeq, oppRef: oppRef, clientRef: clientRef, invoiceRef: invoiceRef,
    TEAM_BANDS: TEAM_BANDS, TIMELINES: TIMELINES,
    REVENUE_SKIP: REVENUE_SKIP, BUDGET_SKIP: BUDGET_SKIP,
    ensureRefs: ensureRefs, productName: productName, USD: USD,
    setUsdRate: setUsdRate, usdRate: usdRate, inUsd: inUsd,
    INVOICE_STATES: INVOICE_STATES, INVOICE_WORDS: INVOICE_WORDS, TERMS_DAYS: TERMS_DAYS, newInvoice: newInvoice,
    DEDUCTION_LABELS: DEDUCTION_LABELS, invoiceTotals: invoiceTotals,
    DEFAULT_INVOICE_TEMPLATE: DEFAULT_INVOICE_TEMPLATE, invoiceTemplate: invoiceTemplate,
    clientCode: clientCode, codeFor: codeFor, invoiceNumber: invoiceNumber,
    billToFrom: billToFrom,
    invoiceOverdue: invoiceOverdue, owedOn: owedOn,
    invoiceLeft: invoiceLeft, advanceOn: advanceOn, SPLITS: SPLITS, splitFee: splitFee,
    addInvoice: addInvoice, dropInvoice: dropInvoice, invoicesFor: invoicesFor, renumber: renumber,
    ENGAGEMENT_DOCS: ENGAGEMENT_DOCS, CLIENT_DOCS: CLIENT_DOCS,
    docTypes: docTypes, docLabel: docLabel, editDoc: editDoc, newDoc: newDoc, docsOf: docsOf,
    docOfInvoice: docOfInvoice,
    newComm: newComm, commsOf: commsOf, addComm: addComm, editComm: editComm,
    dropComm: dropComm, docsOfComm: docsOfComm, lastComm: lastComm,
    hasDoc: hasDoc, missingDocs: missingDocs, docsIn: docsIn, docCount: docCount, newProc: newProc,
    isProcessing: isProcessing, procDeals: procDeals, procDue: procDue,
    addDays: addDays, daysLeft: daysLeft, procOverdue: procOverdue,
    procProgress: procProgress, startProc: startProc, moveProc: moveProc,
    FOLLOW_METHODS: FOLLOW_METHODS, FOLLOW_OUTCOMES: FOLLOW_OUTCOMES, AT_RISK: AT_RISK,
    NO_NEXT_DATE: NO_NEXT_DATE, needsNextDate: needsNextDate,
    newFollow: newFollow, followsFor: followsFor, openFollows: openFollows,
    isOverdue: isOverdue, isDueToday: isDueToday, nextFollow: nextFollow,
    atRisk: atRisk, needsAttention: needsAttention,

    FIELDS: FIELDS, FIELD_GROUPS: FIELD_GROUPS, fieldByKey: fieldByKey, fieldValue: fieldValue,
    hasField: hasField, setField: setField, scoreRecord: scoreRecord,
    engagementRecord: engagementRecord, setEngagementField: setEngagementField,
    FIELD_HOME: FIELD_HOME,

    RANGES: RANGES, rangeDates: rangeDates, rangeLabel: rangeLabel, inRange: inRange,
    monthsIn: monthsIn, monthKey: monthKey, iso: iso,
    DEFAULT_TARGETS: DEFAULT_TARGETS, salesFor: salesFor, targetProgress: targetProgress,
    salesOf: salesOf, isContracted: isContracted, contractedOn: contractedOn,
    CONTRACTED_STAGES: CONTRACTED_STAGES,
    band: band, personStats: personStats,

    STAGES: OPP_STAGES, MARKS: MARKS, SOURCES: SOURCES,
    DOC_PATTERNS: DOC_PATTERNS, readDocument: readDocument,
    validGST: validGST, validPAN: validPAN, validIFSC: validIFSC,
    DIAL_CODES: DIAL_CODES, DEFAULT_DIAL: DEFAULT_DIAL, dialLabel: dialLabel,
    validPhone: validPhone, phoneLine: phoneLine,
    AGENTS: AGENTS, agentById: agentById, AGENT_MODES: AGENT_MODES, agentMode: agentMode,
    newRun: newRun, step: step, runKey: runKey, recentlyDecided: recentlyDecided,
    hoursSaved: hoursSaved,
    /* Mark's rubric: deterministic, auditable, and free */
    newProspect: newProspect, LEVELS: LEVELS, shortName: shortName,
    AED_RATE: AED_RATE, setAedRate: setAedRate, aedRate: aedRate, inAed: inAed,
    SUBJECTS: SUBJECTS, subjectFor: subjectFor, leadFinding: leadFinding,
    FINDING_ORDER: FINDING_ORDER, DEFAULT_PLAYBOOK: DEFAULT_PLAYBOOK, playbookOf: playbookOf,
    LESSON_MIN: LESSON_MIN, REPLY_BENCHMARK: REPLY_BENCHMARK,
    outreachStats: outreachStats, groupOutcomes: groupOutcomes,
    outreachLessons: outreachLessons, markNeeds: markNeeds,
    outreachBrief: outreachBrief, playbookProposal: playbookProposal,
    SERVICE_PRICE: SERVICE_PRICE, priceIn: priceIn, PITCH: PITCH,
    draftEmail: draftEmail, draftWhatsAppReply: draftWhatsAppReply,
    worthPitching: worthPitching, PITCH_BAR: PITCH_BAR,
    PAID_SOURCES: PAID_SOURCES, isPaid: isPaid, newCampaign: newCampaign, PLATFORMS: PLATFORMS,
    campaignsFor: campaignsFor, campaignById: campaignById, campaignResults: campaignResults,
    CLIENT_TYPES: CLIENT_TYPES, newContact: newContact, contactsOf: contactsOf,
    primaryContact: primaryContact, contactById: contactById, oppContact: oppContact,
    addContact: addContact, dropContact: dropContact,
    makePrimary: makePrimary, newAddress: newAddress, addressLine: addressLine,
    placeFields: placeFields, placeList: placeList, niceDate: niceDate, longDate: longDate,
    PLACE_OTHER: PLACE_OTHER,
    PICKLISTS: PICKLISTS, picklist: picklist, addToPicklist: addToPicklist,
    DESIGNATIONS: DESIGNATIONS, designationsFor: designationsFor,
    findByName: findByName,
    validMobile: validMobile, findByMobile: findByMobile, newClient: newClient, upsertClient: upsertClient,
    addMark: addMark, markOf: markOf, clientValue: clientValue,
    WA_TIERS: WA_TIERS, WA_CATEGORIES: WA_CATEGORIES, WA_STATES: WA_STATES,
    WA_QUALITY: WA_QUALITY, WA_HEALTH: WA_HEALTH, WA_ERRORS: WA_ERRORS,
    waError: waError, waTier: waTier, waTierIndex: waTierIndex,
    WA_VARS: WA_VARS, waVarGroups: waVarGroups, waResolve: waResolve, waFill: waFill,
    newTemplate: newTemplate, validTemplateName: validTemplateName, validateTemplate: validateTemplate,
    templateVars: templateVars, waStats: waStats, waFailures: waFailures,
    TRIGGERS: TRIGGERS, ACTS: ACTS, autoKind: autoKind, audienceOf: audienceOf,
    validateAuto: validateAuto, testAuto: testAuto,
    COND_FIELDS: COND_FIELDS, COND_OPS: COND_OPS, condField: condField,
    condContext: condContext, matchCond: matchCond, matchConds: matchConds,

    APP_KEY: APP_KEY
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ZS = api;
})(typeof self !== 'undefined' ? self : this);
