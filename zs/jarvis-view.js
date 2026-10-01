/* The Jarvis screen: talk to him, read the queue, watch the roster. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  function pending() { return (D().proposals || []).filter(function (p) { return p.status === 'pending'; }); }

  V.jarvis = function () {
    if (!G.acc().clients) return G.deny('Not in your view',
      'I read client records to be any use, and those are switched off for your role.');
    var tab = G.jarvisTabGet();
    var q = pending();
    var saved = ZS.hoursSaved(D());

    var h = '<div class="ph"><div><h1>Jarvis</h1>' +
      '<p>I read the whole cockpit and do the work nobody gets round to. ' +
      'I act <b>as you</b> &mdash; where your role is refused, so am I.</p></div>' +
      '<div class="right"><button class="btn alt" data-act="jarvisSweep">Run the sweep</button></div></div>';

    h += '<div class="btabs" role="tablist">' +
      [['talk', 'Talk to me', 0], ['queue', 'Waiting on you', q.length],
       ['roster', 'My team', ZS.AGENTS.length], ['runs', 'What I did', (D().runs || []).length]]
      .map(function (t) {
        return '<button class="btab" role="tab" data-act="jarvisTab" data-id="' + t[0] + '" ' +
          'aria-selected="' + (tab === t[0] ? 'true' : 'false') + '">' + esc(t[1]) +
          (t[2] ? '<b>' + t[2] + '</b>' : '') + '</button>';
      }).join('') + '</div>';

    if (tab === 'talk') h += talkTab();
    else if (tab === 'queue') h += queueTab(q);
    else if (tab === 'roster') h += rosterTab(saved);
    else h += runsTab();

    h += '<p class="honest">' + (G.modelOn && G.modelOn()
      ? 'Everything I tell you about a client, a deal or the money is worked out from your ' +
        'own book, never written by a model: &ldquo;what is owed&rdquo; is arithmetic over your ' +
        'invoices, so it is right rather than merely plausible. A model sits behind me for ' +
        'three things. It rewrites a question I did not catch into a shape I know, and shows ' +
        'you the rewrite. It writes the drafts, which you read and approve before anything ' +
        'moves. And it answers questions about ZippyScale itself from our handbook, which is ' +
        'the only document I am allowed to write prose from. What is sent: your question, the ' +
        'names you can already see, and that handbook. Never a fee, never a credential, never ' +
        'the book.'
      : 'I am a fixed set of shapes with a job title, running on your own data in this ' +
        'browser, so I behave the same way every time. No model is connected.') +
      ' I do not send anything from here.</p>';
    return h;
  };

  function talkTab() {
    var log = D().jarvisLog || [];
    var h = '<div class="card" style="padding:0">' +
      '<div class="chatlog" id="chatlog">' +
      (log.length
        ? log.slice(-14).map(function (t) {
            var who = ZS.staffById(t.by);
            return '<div class="chatturn"><div class="bubble you">' +
              '<span class="av">' + esc(((who && who.name) || '?').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2)) + '</span>' +
              '<p>' + esc(t.you) + '</p></div>' +
              '<div class="bubble him"><span class="av jv">◉</span><div class="said">' +
                '<p>' + t.jarvis + '</p>' +
                (t.rows ? table(t.rows) : '') +
                (t.actions && t.actions.length
                  ? '<div class="chatacts">' + t.actions.map(function (a) {
                      var p = a[1].split('|');
                      return '<button class="minibtn" data-act="' + esc(p[0]) + '" data-id="' +
                        esc(p[1] || '') + '">' + esc(a[0]) + '</button>';
                    }).join('') + '</div>'
                  : '') +
                /* When the words were tidied before matching — which is most of
                   what gets dictated — say what was acted on, so a wrong answer
                   is traceable to a mishearing rather than a mystery. */
                (t.matched
                  ? '<span class="matched">read as: ' + esc(t.matched) +
                    (t.heard ? ' &middot; heard &ldquo;' + esc(t.heard) + '&rdquo;' : '') +
                    /* A model rewrote it, so say so on the turn itself. A rewrite
                       you cannot see is a rewrite you cannot correct. */
                    (t.viaModel ? ' &middot; <b>rewritten by the model</b>' : '') + '</span>'
                  : '<span class="matched">not understood</span>') +
              '</div></div></div>';
          }).join('')
        : '<div class="chatempty"><b>◉</b><p>Ask me what is stuck, what is owed, or tell me to ' +
          'move something. Type <b>help</b> and I will list what I know how to do.</p></div>') +
      '</div>' +
      '<form id="jarvisform" class="chatbar">' +
      '<input id="jv-q" name="q" autocomplete="off" placeholder="Ask me something, or tell me to do it…">' +
      /* Speak rather than type. It appends, so you can stop, think, and carry on
         without losing the first half of what you said. */
      G.micButton('jv-q') +
      '<button class="btn" type="submit">Send</button></form></div>';

    h += '<div class="chips" style="margin-top:12px">' +
      ['what is stuck', 'what is owed', 'what is behind', 'who has gone quiet', 'help']
        .map(function (s) {
          return '<button class="chip" data-act="jarvisSay" data-id="' + esc(s) + '">' + esc(s) + '</button>';
        }).join('') + '</div>';
    return h;
  }

  function table(rows) {
    return '<div class="scroller" style="margin-top:9px"><table class="tbl"><thead><tr>' +
      rows.head.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.body.map(function (r) {
        return '<tr>' + r.map(function (cell) { return '<td>' + esc(cell) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function queueTab(q) {
    if (!q.length) {
      return '<div class="card pad"><p class="m">Nothing waiting on you. Run the sweep, or ask me ' +
        'what needs doing.</p></div>';
    }
    return q.map(function (p) {
      var a = ZS.agentById(p.agent);
      return '<div class="card prop"><div class="prophead">' +
        '<span class="agico">' + esc(a.icon) + '</span>' +
        '<div class="t"><b>' + esc(p.title) + '</b><span>' + esc(a.name) + ' · ' +
          esc(String(p.at).slice(0, 10)) + '</span></div>' +
        (p.clientFacing ? '<span class="pill warn">a client would see this</span>' : '') +
        '</div>' +
        '<p class="m">' + esc(p.summary) + '</p>' +
        '<details class="why"><summary>How I got here</summary><ul class="ledger">' +
          p.steps.map(function (s) {
            return '<li><span>' + esc(s.t) + '</span><b>' + esc(s.d) + '</b></li>';
          }).join('') + '</ul></details>' +
        (p.draft
          ? '<div class="draft"><label for="dr-' + esc(p.id) + '">Draft &mdash; ' +
            esc(p.draft.channel) + ', ' +
            (p.draft.by === 'model' ? 'written by the model' : 'written from a template') +
            ', edit before approving</label>' +
            /* ⚠️ AN EMAIL DRAFT WITH NO SUBJECT BOX. Mark's subject line is the
               whole email: it is the verified fault, it is the reason it gets
               opened, and it is the thing CAN-SPAM is about. It was being
               carried in the payload and shown nowhere, so the one field
               Bhargav would most want to tighten was the one he could not
               reach. */
            (p.draft.subject
              ? '<input id="sj-' + esc(p.id) + '" value="' + esc(p.draft.subject) +
                '" aria-label="Subject line" style="margin-bottom:8px">'
              : '') +
            '<textarea id="dr-' + esc(p.id) + '" rows="6">' + esc(p.draft.text) + '</textarea></div>'
          : '') +
        '<div class="propacts">' +
          (p.draft && p.clientFacing
            ? '<button class="btn" data-act="approveSend" data-id="' + esc(p.id) + '">Approve &amp; mark sent</button>' +
              '<button class="btn alt" data-act="approveOnly" data-id="' + esc(p.id) + '">Approve, don\'t send</button>'
            : '<button class="btn" data-act="approveOnly" data-id="' + esc(p.id) + '">Approve</button>') +
          '<button class="btn alt" data-act="rejectProp" data-id="' + esc(p.id) + '">No</button>' +
        '</div></div>';
    }).join('');
  }

  function rosterTab(saved) {
    var h = '<div class="kpis5" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">' +
      '<div class="kcard"><span class="klabel">Waiting on you</span><div class="krow"><b>' +
        pending().length + '</b></div></div>' +
      '<div class="kcard"><span class="klabel">Hours saved (est.)</span><div class="krow"><b>' +
        saved.hours + ' h</b></div><span class="kfoot">approved work only</span></div>' +
      '<div class="kcard"><span class="klabel">Runs I kept</span><div class="krow"><b>' +
        (D().runs || []).length + '</b></div></div></div>';

    h += '<div class="grid2">' + ZS.AGENTS.map(function (a) {
      var m = ZS.agentMode(D(), a.id);
      return '<div class="card pad"><div class="cardhead">' +
        '<span class="agico">' + esc(a.icon) + '</span>' +
        '<h3 style="flex:1">' + esc(a.name) + '</h3>' +
        (a.client ? '<span class="pill warn">always asks you</span>' : '') + '</div>' +
        '<p class="m">' + esc(a.does) + '</p>' +
        '<p class="hint" style="margin-top:8px">When: ' + esc(a.trigger) + ' · ' +
          'claims ' + a.minutes + ' min a run</p>' +
        '<div class="scanrow">' +
          (G.acc().agents
            ? '<select data-agentmode="' + esc(a.id) + '" aria-label="Mode for ' + esc(a.name) + '">' +
              ZS.AGENT_MODES.map(function (x) {
                return '<option value="' + x + '"' + (x === m ? ' selected' : '') + '>' + x + '</option>';
              }).join('') + '</select>'
            : '<span class="pill dim">' + esc(m) + '</span>') +
          '<button class="minibtn" data-act="jarvisRun" data-id="' + esc(a.id) + '">Run it now</button>' +
        '</div>' +
        (a.client ? '<p class="honest">This one reaches a client, so it waits for you even on Auto.</p>' : '') +
        '</div>';
    }).join('') + '</div>';

    h += '<p class="honest">Hours saved multiplies each of our own estimates of the manual ' +
      'minutes we replace, and counts only what you approved. It is arithmetic over an estimate, ' +
      'not a measurement — do not quote it to anybody as a fact.</p>';
    return h;
  }

  function runsTab() {
    var runs = (D().runs || []).slice(0, 40);
    if (!runs.length) return '<div class="card pad"><p class="m">Nothing yet.</p></div>';
    return '<div class="card" style="padding:0"><div class="scroller"><table class="tbl"><thead><tr>' +
      '<th>When</th><th>Agent</th><th>What</th><th>Outcome</th></tr></thead><tbody>' +
      runs.map(function (r) {
        var a = ZS.agentById(r.agent) || { name: r.agent, icon: '·' };
        return '<tr><td>' + esc(String(r.at).slice(0, 16).replace('T', ' ')) + '</td>' +
          '<td>' + esc(a.icon + ' ' + a.name) + '</td>' +
          '<td>' + esc(r.summary) + '</td>' +
          '<td><span class="pill ' + (r.status === 'approved' || r.status === 'auto' ? 'ok'
            : r.status === 'rejected' ? 'bad' : 'warn') + '">' + esc(r.status) + '</span></td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  Object.assign(A, {
    jarvisTab: function (t) { G.jarvisTabSet(t); G.go('#/jarvis'); },
    jarvisSay: function (text) { say(text); },
    jarvisRun: function (id) {
      var out = G.runAgent(id, null, { manual: true });
      var n = Array.isArray(out) ? out.length : (out ? 1 : 0);
      G.save();
      G.toast(n ? ZS.agentById(id).name + ' queued ' + n + '.' : ZS.agentById(id).name + ' found nothing.');
      G.jarvisTabSet(n ? 'queue' : G.jarvisTabGet());
      G.render();
    },
    jarvisSweep: function () {
      var before = pending().length;
      G.sweepAgents();
      var added = pending().length - before;
      G.toast(added > 0 ? 'I have ' + added + ' new thing(s) for you.' : 'Nothing new from me.');
      G.jarvisTabSet('queue');
      G.render();
    },
    approveSend: function (id) { decide(id, true); },
    approveOnly: function (id) { decide(id, false); },
    rejectProp:  function (id) { G.jarvisDecide(id, 'reject'); },
    goto: function (h) { G.go(h); }
  });

  function decide(id, send) {
    var box = document.getElementById('dr-' + id);
    var sub = document.getElementById('sj-' + id);
    G.jarvisDecide(id, 'approve',
      { send: send, text: box ? box.value : '', subject: sub ? sub.value : '' });
  }

  /* Put a turn in the log from somewhere other than the input box, so anything
     Jarvis does as a result of a button still reads as part of the conversation
     rather than happening silently on another screen. */
  G.jarvisTell = function (turn) {
    turn.at = turn.at || new Date().toISOString();
    turn.by = turn.by || D().session;
    D().jarvisLog = (D().jarvisLog || []).concat([turn]);
    if (D().jarvisLog.length > 60) D().jarvisLog = D().jarvisLog.slice(-60);
    G.save();
    G.jarvisTabSet('talk');
    G.render();
  };

  function say(text) {
    /* The grammar answers before this returns; only the long tail waits on the
       model, and the screen says so rather than sitting there looking broken. */
    var p = G.jarvisAskAsync ? G.jarvisAskAsync(text) : Promise.resolve(G.jarvisAsk(text));
    var box = document.getElementById('chatlog');
    if (box) {
      box.insertAdjacentHTML('beforeend',
        '<div class="chatturn" id="jv-wait"><div class="bubble you"><span class="av">·</span><p>' +
        esc(text) + '</p></div><div class="bubble him"><span class="av jv">\u25c9</span>' +
        '<div class="said"><p class="hint">Reading that\u2026</p></div></div></div>');
      box.scrollTop = box.scrollHeight;
    }
    p.then(function (turn) {
      if (!turn) { var w = document.getElementById('jv-wait'); if (w) w.remove(); return; }
      D().jarvisLog = (D().jarvisLog || []).concat([turn]);
      if (D().jarvisLog.length > 60) D().jarvisLog = D().jarvisLog.slice(-60);
      G.save();
      G.jarvisTabSet('talk');
      G.render();
    });
  }

  var prevSubmit = A.onSubmit;
  A.onSubmit = function (e) {
    if (prevSubmit) prevSubmit(e);
    if (e.target.id !== 'jarvisform') return;
    e.preventDefault();
    var box = document.getElementById('jv-q');
    var v = box ? box.value : '';
    if (!String(v).trim()) return;
    /* The words are spent. Stop the microphone rather than leaving it running
       against a box that is about to be cleared, or the next thing said lands
       appended to a message already sent. */
    if (G.micReset) G.micReset('jv-q');
    if (box) box.value = '';
    say(v);
  };

  var prevChange = A.onChange;
  A.onChange = function (e) {
    if (prevChange) prevChange(e);
    var am = e.target.closest ? e.target.closest('[data-agentmode]') : null;
    if (!am) return;
    if (!G.acc().agents) { G.render(); return; }
    D().agentModes = D().agentModes || {};
    D().agentModes[am.dataset.agentmode] = am.value;
    G.log('auto_toggle', ZS.agentById(am.dataset.agentmode).name + ' set to ' + am.value);
    G.save();
    G.toast(ZS.agentById(am.dataset.agentmode).name + ' is now on ' + am.value + '.');
    G.render();
  };
})();
