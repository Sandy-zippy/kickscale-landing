/* The inbox: conversations, not loose messages.
 *
 * WHAT THIS REPLACED, AND WHY. The old screen drew one card per message, each
 * with a "what this enquiry is asking for" panel and an Approve button. That is
 * the right shape for a form arriving once and the wrong shape for talking to
 * somebody: the fourth message from a client appeared as a fourth stranger, with
 * no history above it, no way to reply, and nobody responsible for answering.
 *
 * THREE THINGS IT HAS TO GET RIGHT:
 *
 *   1. ONE CONVERSATION PER PERSON PER CHANNEL, filterable. WhatsApp and
 *      Instagram are separate threads on purpose: they are separate 24-hour
 *      windows and separate rules, and pretending otherwise makes the reply box
 *      lie about what it can send.
 *   2. ASSIGNMENT DECIDES VISIBILITY. The owner reads everything; everybody else
 *      reads what has been handed to them. The list here is short because the
 *      SERVER sent fewer rows, not because this file drew fewer. Anything that
 *      reads as a permission on this screen is decoration over the real rule.
 *   3. ONE FACE OUTWARD. Everything leaves from one number and one account,
 *      whoever writes it. Internally the thread has an owner and every reply
 *      records who typed it. The client sees one business; we see the rota.
 */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  var CHAN = {
    whatsapp:  { label: 'WhatsApp',  tone: 'ok',   mark: 'W' },
    instagram: { label: 'Instagram', tone: 'em',   mark: 'IG' },
    messenger: { label: 'Messenger', tone: 'info', mark: 'M' }
  };

  var FILTER = 'all';       /* all | whatsapp | instagram */
  var MINE = false;
  var OPEN = null;          /* the conversation being read */
  var LOADED = {};          /* thread id -> its messages, once fetched */
  var TEMPLATES = null;     /* what Meta has approved, fetched once */
  var BUSY = false;

  function threads() {
    var list = (D().threads || []).slice();
    if (FILTER !== 'all') list = list.filter(function (t) { return t.channel === FILTER; });
    if (MINE) list = list.filter(function (t) { return t.assigned_to === (G.me() || {}).id; });
    return list.sort(function (a, b) {
      return String(b.last_at || '').localeCompare(String(a.last_at || ''));
    });
  }

  /* Is a plain message deliverable, or is it templates only? WhatsApp gives you
     twenty-four hours from THEIR last message. Said on the screen before
     somebody types, never after Meta refuses it. */
  function windowLeft(t) {
    if (!t || !t.window_until) return 0;
    return Math.max(0, new Date(t.window_until).getTime() - Date.now());
  }
  function windowWords(t) {
    var ms = windowLeft(t);
    if (!ms) return null;
    var h = Math.floor(ms / 3600000), m = Math.round((ms % 3600000) / 60000);
    return h ? h + 'h ' + m + 'm left' : m + 'm left';
  }

  function when(iso) {
    if (!iso) return '';
    var t = String(iso).replace('T', ' ');
    return t.slice(0, 10) === ZS.today() ? t.slice(11, 16) : t.slice(5, 16);
  }

  /* ---------------- the screen ---------------- */

  V.inbox = function () {
    var me = G.me();
    var all = D().threads || [];
    var list = threads();
    var mayAssign = !!D().mayAssign;

    var h = '<div class="ph"><div><h1>Inbox</h1>' +
      '<p>Every WhatsApp and Instagram conversation in one place. ' +
      (mayAssign
        ? 'Hand one to somebody and it moves to their inbox until you take it back.'
        : 'You see the conversations handed to you.') +
      '</p></div></div>';

    /* the filters: channel first, because "show me WhatsApp" is the question */
    var counts = { all: all.length };
    all.forEach(function (t) { counts[t.channel] = (counts[t.channel] || 0) + 1; });
    var unread = all.filter(function (t) { return t.unread > 0; }).length;

    h += '<div class="chips" style="margin-bottom:14px">' +
      [['all', 'Everything'], ['whatsapp', 'WhatsApp'], ['instagram', 'Instagram']]
        .map(function (c) {
          return '<button class="chip" data-act="inboxChannel" data-id="' + c[0] + '" ' +
            'aria-pressed="' + (FILTER === c[0] ? 'true' : 'false') + '">' + esc(c[1]) +
            '<i>' + (counts[c[0]] || 0) + '</i></button>';
        }).join('') +
      '<button class="chip" data-act="inboxMine" aria-pressed="' + (MINE ? 'true' : 'false') +
      '">Mine<i>' + all.filter(function (t) {
        return t.assigned_to === (me || {}).id; }).length + '</i></button>' +
      (unread ? '<span class="pill em" style="margin-left:auto;align-self:center">' +
        unread + ' unread</span>' : '') +
      '</div>';

    if (!all.length) {
      return h + '<div class="card pad"><p class="m">Nothing yet. ' +
        'WhatsApp and Instagram messages land here the moment Meta is connected &mdash; ' +
        'Settings, Connections, The Meta door. A message waits here for one tap rather ' +
        'than opening a client by itself, because a message is not an enquiry.</p></div>';
    }

    h += '<div class="inbox2">' +
      '<div class="threadlist">' +
        (list.length
          ? list.map(threadRow).join('')
          : '<p class="m" style="padding:14px">Nothing on this filter.</p>') +
      '</div>' +
      '<div class="threadview">' + (OPEN ? conversation(OPEN, mayAssign) : nothingOpen()) + '</div>' +
      '</div>';
    return h;
  };

  function nothingOpen() {
    return '<div class="card pad" style="height:100%"><p class="m">' +
      'Pick a conversation on the left. Everything you send goes out from the one ' +
      'WhatsApp number and the one Instagram account, whoever writes it &mdash; the client ' +
      'sees one business, not a rota.</p></div>';
  }

  function threadRow(t) {
    var c = CHAN[t.channel] || { label: t.channel, tone: 'dim', mark: '·' };
    var who = t.assigned_to ? ZS.staffById(t.assigned_to) : null;
    var open = OPEN === t.id;

    return '<button class="threadrow' + (open ? ' on' : '') + (t.unread ? ' unread' : '') + '" ' +
      'data-act="openThread" data-id="' + esc(t.id) + '">' +
      '<div class="tr1">' +
        '<b>' + esc(t.name || t.handle) + '</b>' +
        '<span class="pill ' + c.tone + '">' + esc(c.label) + '</span>' +
        (t.unread ? '<span class="dot">' + t.unread + '</span>' : '') +
        '<i>' + esc(when(t.last_at)) + '</i>' +
      '</div>' +
      '<div class="tr2">' + (t.last_dir === 'out' ? '<span class="you">You: </span>' : '') +
        esc(String(t.last_body || '').slice(0, 90)) + '</div>' +
      '<div class="tr3">' +
        (who ? '<span class="pill dim">' + esc(who.name) + '</span>'
             : '<span class="pill warn">nobody yet</span>') +
        (t.client_id ? '<span class="pill ok">a client</span>' : '') +
      '</div></button>';
  }

  function conversation(id, mayAssign) {
    var t = (D().threads || []).filter(function (x) { return x.id === id; })[0];
    if (!t) return nothingOpen();
    var c = CHAN[t.channel] || { label: t.channel, tone: 'dim' };
    var msgs = LOADED[id];
    var who = t.assigned_to ? ZS.staffById(t.assigned_to) : null;
    var left = windowWords(t);

    var h = '<div class="card" style="padding:0;display:flex;flex-direction:column;height:100%">' +
      '<div class="convhead">' +
        '<div><b>' + esc(t.name || t.handle) + '</b>' +
        '<span>' + esc(c.label) + ' &middot; ' + esc(t.handle) + '</span></div>' +
        (t.client_id
          ? '<button class="minibtn" data-act="openClient" data-id="' + esc(t.client_id) +
            '">Open the client</button>'
          : '<button class="minibtn" data-act="clientFromThread" data-id="' + esc(t.id) +
            '">Make them a client</button>') +
        (mayAssign
          ? '<button class="minibtn" data-act="assignThread" data-id="' + esc(t.id) + '">' +
            (who ? esc(who.name) : 'Hand it to somebody') + '</button>'
          : '<span class="pill dim">' + (who ? esc(who.name) : 'yours') + '</span>') +
      '</div>';

    h += '<div class="convbody" id="convbody">' +
      (msgs
        ? (msgs.length
            ? msgs.map(bubble).join('')
            : '<p class="m">Nothing in this conversation yet.</p>')
        : '<p class="m">Reading it&hellip;</p>') +
      '</div>';

    /* ⚠️ THE REPLY BOX HAS TO KNOW WHICH STATE IT IS IN BEFORE SOMEBODY TYPES.
       Outside the 24 hours WhatsApp rejects a plain message rather than
       delivering it late, and discovering that from Meta's error means four
       lines have already been written and believed sent. */
    if (t.channel === 'whatsapp' && !left) {
      h += '<div class="convsend shut">' +
        '<p class="m"><b>They have not written for over 24 hours.</b> WhatsApp will only ' +
        'take a template Meta has already approved until they write again. That is Meta’s ' +
        'rule, not ours.</p>' +
        '<button class="btn alt" data-act="pickTemplate" data-id="' + esc(t.id) + '">' +
        'Send an approved template</button></div>';
    } else {
      h += '<form class="convsend" id="sendform" data-id="' + esc(t.id) + '">' +
        '<textarea id="sendbox" name="text" rows="2" placeholder="Write a reply…"></textarea>' +
        '<div class="sendrow">' +
          '<button class="btn" type="submit"' + (BUSY ? ' disabled' : '') + '>' +
            (BUSY ? 'Sending…' : 'Send') + '</button>' +
          (t.channel === 'whatsapp'
            ? '<button class="btn alt" type="button" data-act="pickTemplate" data-id="' +
              esc(t.id) + '">Template</button>' +
              '<span class="hint">' + esc(left) + ' to reply freely</span>'
            : '<span class="hint">Goes out from the ZippyScale account.</span>') +
        '</div></form>';
    }

    return h + '</div>';
  }

  function bubble(m) {
    var out = m.direction === 'out';
    var by = out && m.by_staff ? ZS.staffById(m.by_staff) : null;
    return '<div class="bub' + (out ? ' out' : '') + '">' +
      '<div class="bubtext">' + esc(m.body || '') + '</div>' +
      '<div class="bubfoot">' + esc(when(m.at)) +
        /* who wrote it is an internal fact and never travels outward */
        (by ? ' &middot; ' + esc(by.name.split(' ')[0]) : '') +
        (m.state ? ' &middot; ' + esc(m.state) : '') +
        (m.fail ? ' &middot; <b>' + esc(m.fail) + '</b>' : '') +
      '</div></div>';
  }

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    inboxChannel: function (which) { FILTER = which; G.render(); },
    inboxMine: function () { MINE = !MINE; G.render(); },

    openThread: function (id) {
      OPEN = id;
      var t = (D().threads || []).filter(function (x) { return x.id === id; })[0];
      if (t) t.unread = 0;
      G.render();
      if (!window.API || !API.signedIn()) return;
      API.thread(id).then(function (r) {
        LOADED[id] = (r && r.messages) || [];
        if (r && r.thread) {
          /* the server's copy wins: it knows the window and who owns it */
          var i = (D().threads || []).map(function (x) { return x.id; }).indexOf(id);
          if (i >= 0) D().threads[i] = r.thread;
        }
        G.render();
        var b = document.getElementById('convbody');
        if (b) b.scrollTop = b.scrollHeight;
      }).catch(function (e) {
        G.toast((e && e.message) || 'That conversation is not yours to read.', true);
        OPEN = null;
        G.render();
      });
    },

    assignThread: function (id) {
      if (!D().mayAssign) return G.toast('Handing conversations out is the owner’s.', true);
      var t = (D().threads || []).filter(function (x) { return x.id === id; })[0];
      if (!t) return;
      G.modal('Who handles ' + (t.name || t.handle) + '?',
        'It moves to their inbox and leaves everybody else’s. They see this whole ' +
        'conversation and no other. The client notices nothing: every reply still goes ' +
        'out from the one ZippyScale number.',
        ZS.staffList().map(function (u) {
          return '<div class="pickrow"><div class="t"><b>' + esc(u.name) + '</b><span>' +
            esc((ZS.ROLES[u.role] || {}).label || u.role) + '</span></div>' +
            (t.assigned_to === u.id
              ? '<span class="pill ok">has it</span>'
              : '<button class="minibtn" data-act="doAssignThread" data-id="' +
                esc(id + '|' + u.id) + '">Hand it over</button>') + '</div>';
        }).join('') +
        '<div class="pickrow"><div class="t"><b>Nobody</b><span>back in the ' +
        'unassigned pile, which only you can see</span></div>' +
        '<button class="minibtn" data-act="doAssignThread" data-id="' + esc(id + '|') +
        '">Take it back</button></div>');
    },

    doAssignThread: function (arg) {
      var p = String(arg).split('|'), id = p[0], staff = p[1] || null;
      var dm = document.getElementById('modal'); if (dm && dm.open) dm.close();
      if (!window.API || !API.signedIn()) return G.toast('Sign in to the server first.', true);
      API.assignThread(id, staff).then(function () {
        G.toast(staff ? 'Handed to ' + (ZS.staffById(staff) || {}).name + '.'
                      : 'Back in the unassigned pile.');
        return G.pullNow ? G.pullNow() : null;
      }).catch(function (e) {
        G.toast((e && e.message) || 'That did not go through.', true);
      });
    },

    pickTemplate: function (id) {
      if (!window.API || !API.signedIn()) return G.toast('Sign in to the server first.', true);
      G.modal('An approved template', 'Reading what Meta has approved…', '<p class="m">One moment.</p>');
      var show = function () {
        var list = TEMPLATES || [];
        var ok = list.filter(function (t) { return String(t.status).toUpperCase() === 'APPROVED'; });
        G.modal('An approved template',
          ok.length + ' approved on this WhatsApp account. A template with {{1}} in it ' +
          'needs filling in before it can go, so those are listed and not offered yet.',
          ok.length
            ? ok.map(function (t) {
                var holes = (t.vars || []).length;
                return '<div class="pickrow"><div class="t"><b>' + esc(t.name) + '</b>' +
                  '<span>' + esc(String(t.body || '').slice(0, 120)) + '</span></div>' +
                  (holes
                    ? '<span class="pill warn">' + holes + ' to fill in</span>'
                    : '<button class="minibtn" data-act="sendTemplate" data-id="' +
                      esc(id + '|' + t.name + '|' + (t.language || 'en')) + '">Send it</button>') +
                  '</div>';
              }).join('')
            : '<p class="m">Nothing approved came back. ' + esc(TEMPLATES_WHY || '') + '</p>');
      };
      if (TEMPLATES) return show();
      API.templates().then(function (r) {
        TEMPLATES = (r && r.templates) || [];
        TEMPLATES_WHY = (r && r.why) || '';
        show();
      }).catch(function (e) {
        TEMPLATES = [];
        TEMPLATES_WHY = (e && e.message) || 'Meta did not answer.';
        show();
      });
    },

    sendTemplate: function (arg) {
      var p = String(arg).split('|');
      var dm = document.getElementById('modal'); if (dm && dm.open) dm.close();
      send(p[0], { template: { name: p[1], language: p[2] }, preview: p[1] });
    },

    /* A conversation is not a client until somebody says so. This is that tap. */
    clientFromThread: function (id) {
      var t = (D().threads || []).filter(function (x) { return x.id === id; })[0];
      if (!t) return;
      if (!G.acc().clients) return G.toast('Client records are switched off for your role.', true);
      G.go('#/clientnew?name=' + encodeURIComponent(t.name || '') +
           '&mobile=' + encodeURIComponent(t.channel === 'whatsapp' ? t.handle : '') +
           '&source=' + encodeURIComponent(t.channel));
    }
  });

  var TEMPLATES_WHY = '';

  function send(id, payload) {
    if (!window.API || !API.signedIn()) return G.toast('Sign in to the server first.', true);
    BUSY = true; G.render();
    API.sendOnThread(id, payload).then(function () {
      BUSY = false;
      var box = document.getElementById('sendbox');
      if (box) box.value = '';
      return API.thread(id).then(function (r) {
        LOADED[id] = (r && r.messages) || [];
        G.render();
        var b = document.getElementById('convbody');
        if (b) b.scrollTop = b.scrollHeight;
      });
    }).catch(function (e) {
      BUSY = false;
      /* ⚠️ SAID IN WORDS, NOT AS A RED DOT. "Not sent" with no reason is how
         somebody walks away believing a client has been answered. */
      G.toast((e && e.message) || 'It did not go. Nothing was sent.', true);
      G.render();
    });
  }

  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'sendform') return;
    e.preventDefault();
    var box = document.getElementById('sendbox');
    var text = box ? String(box.value || '').trim() : '';
    if (!text) return;
    send(e.target.dataset.id, { text: text });
  });

  /* what the overview and Jarvis can both ask for */
  G.inboxThreads = threads;
})();
