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
    messenger: { label: 'Messenger', tone: 'info', mark: 'M' },
    comments:  { label: 'Comments',  tone: 'warn', mark: 'C' }
  };

  var FILTER = 'all';       /* all | whatsapp | instagram | messenger | comments */
  var CAMP = null;          /* a WhatsApp campaign's id: its conversations only */
  var Q = '';               /* search: name, handle or the last line */
  var MINE = false;
  var OPEN = null;          /* the conversation being read */
  var LOADED = {};          /* thread id -> its messages, once fetched */
  var TEMPLATES = null;     /* what Meta has approved, fetched once */
  var BUSY = false;

  function threads() {
    var list = (D().threads || []).slice();
    if (FILTER !== 'all') list = list.filter(function (t) { return t.channel === FILTER; });
    if (CAMP) list = list.filter(function (t) { return t.wa_campaign === CAMP; });
    if (MINE) list = list.filter(function (t) { return t.assigned_to === (G.me() || {}).id; });
    /* the shared Date filter, on when they last wrote or were written to */
    list = list.filter(function (t) { return G.inRange(String(t.last_at || '').slice(0, 10)); });
    if (Q) list = list.filter(function (t) {
      return [t.name, t.handle, t.last_body].join(' ').toLowerCase().indexOf(Q) >= 0;
    });
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
      '<p>Every WhatsApp, Instagram and Messenger conversation in one place. ' +
      (mayAssign
        ? 'Hand one to somebody and it moves to their inbox until you take it back.'
        : 'You see the conversations handed to you.') +
      '</p></div>' +
      (G.acc().clients ? '<div class="right"><button class="btn" data-act="startChat">+ Start a chat</button></div>' : '') +
      '</div>';

    /* the filters: channel first, because "show me WhatsApp" is the question */
    var counts = { all: all.length };
    all.forEach(function (t) { counts[t.channel] = (counts[t.channel] || 0) + 1; });
    var unread = all.filter(function (t) { return t.unread > 0; }).length;

    h += G.rangeBar();
    h += '<div class="chips" style="margin-bottom:14px">' +
      [['all', 'All channels'], ['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'],
       ['messenger', 'Messenger'], ['comments', 'Comments']]
        .map(function (c) {
          /* the Comments chip says in its tooltip when Meta will not let us read them */
          var tip = '';
          if (c[0] === 'comments') {
            var st = G.metaStatusNow ? G.metaStatusNow() : null;
            var cc = ((st && st.cards) || []).filter(function (x) { return x.id === 'comments'; })[0];
            tip = cc ? (cc.state === 'wait' ? (cc.line || '') + ' ' + (cc.step || '') : (cc.line || '')) : '';
          }
          return '<button class="chip" data-act="inboxChannel" data-id="' + c[0] + '" ' +
            (tip ? 'title="' + esc(tip.trim()) + '" ' : '') +
            'aria-pressed="' + (FILTER === c[0] ? 'true' : 'false') + '">' + esc(c[1]) +
            '<i>' + (counts[c[0]] || 0) + '</i></button>';
        }).join('') +
      '<button class="chip" data-act="inboxMine" aria-pressed="' + (MINE ? 'true' : 'false') +
      '">Mine<i>' + all.filter(function (t) {
        return t.assigned_to === (me || {}).id; }).length + '</i></button>' +
      (CAMP ? '<button class="chip" data-act="inboxNoCamp" aria-pressed="true" title="Show every conversation again">' +
        'One WhatsApp campaign &times;</button>' : '') +
      (unread ? '<span class="pill em" style="align-self:center">' +
        unread + ' unread</span>' : '') +
      '<input type="search" id="inboxq" placeholder="Search conversations" value="' + esc(Q) + '">' +
      '</div>';

    if (!all.length) {
      return h + '<div class="card pad"><p class="m">Nothing yet. Messages land here once ' +
        'Meta is connected (Settings, Connections). A message waits here for one tap rather ' +
        'than opening a client by itself.</p></div>';
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
      'WhatsApp number, the one Instagram account and the one Page, whoever writes it. The ' +
      'client sees one business, not a rota.</p></div>';
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
        (t.ref_ad ? '<span class="pill info" title="' + esc(t.ref_headline || '') + '">from an ad</span>' : '') +
        (t.opted_out_at ? '<span class="pill dim">said STOP</span>' : '') +
        (t.wa_campaign ? '<span class="pill info">campaign</span>' : '') +
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
        '<span>' + esc(c.label) + ' &middot; ' + esc(t.handle) + '</span>' +
        /* the ad that started it, by name: campaign, ad set, ad */
        (t.ref_ad ? '<span>From an ad: ' + esc([t.ref_campaign, t.ref_adset, t.ref_adname].filter(Boolean).join(' \u00b7 ') ||
          t.ref_headline || 'an ad not yet in the last pull') + '</span>' : '') +
        (t.wa_campaign ? '<span>Last written to by a <a href="#/campaigns/wa/' + esc(t.wa_campaign) +
          '">WhatsApp campaign</a></span>' : '') +
        '</div>' +
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
    if (t.channel === 'comments') {
      /* answering a comment from here is not built: said, with the way there */
      h += '<div class="convsend shut"><p class="closed">Answer comments on Facebook.' +
        '<span>A comment on a post or an ad lands here so nothing is missed. Replying to it from the ' +
        'cockpit is not built yet.</span></p>' +
        '<a class="btn alt" target="_blank" rel="noopener" href="https://www.facebook.com/925570163977473">' +
        'Open the Page on Facebook</a></div>';
    } else if (t.channel !== 'whatsapp' && !left) {
      /* Instagram and Messenger: no templates, so nothing can go until they
         write. Send stays on screen and disabled, never hidden. */
      var who = String(t.name || '').trim();
      var lastIn = t.window_until ? new Date(new Date(t.window_until).getTime() - 86400000) : null;
      var ago = lastIn ? Math.max(1, Math.floor((Date.now() - lastIn.getTime()) / 86400000)) : null;
      h += '<form class="convsend shut" onsubmit="return false">' +
        '<p class="closed">Reply window closed. They need to write first.' +
        '<span>' + esc(c.label) + ' lets a business reply for 24 hours after the person&rsquo;s ' +
        'last message.' + (ago ? ' Theirs was ' + (ago === 1 ? 'a day' : ago + ' days') + ' ago.' : '') +
        '</span></p>' +
        '<textarea rows="2" disabled aria-disabled="true" placeholder="Opens again when ' +
        (who ? esc(who) + ' writes' : 'they write') + '"></textarea>' +
        '<div class="sendrow"><button class="btn" type="button" disabled aria-disabled="true">Send</button>' +
        '<span class="hint">Meta&rsquo;s rule for Instagram and Messenger, not ours.</span></div></form>';
    } else if (t.channel === 'whatsapp' && !left) {
      h += '<div class="convsend shut">' +
        '<p class="closed">Reply window closed. They need to write first.' +
        '<span>WhatsApp only takes a template Meta has approved until they write again.</span></p>' +
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
            : '<span class="hint">' + esc(left) + ' to reply</span>') +
        '</div></form>';
    }

    return h + '</div>';
  }

  /* Every sent message says where it got to, in words: Sending, Sent,
     Delivered, Read or Failed, and a failure says why and what to do. Meta's
     codes are never shown; the reason Meta gave is matched to plain words. */
  var STATE = { sent: 'Sent', delivered: 'Delivered', read: 'Read', failed: 'Failed', sending: 'Sending\u2026' };
  function failWords(why) {
    var w = String(why || '');
    if (/not (a valid )?whatsapp|no whatsapp|undeliverable|131026/i.test(w)) return 'The number has no WhatsApp account, or could not take it. Check the number or call them.';
    if (/re-?engagement|24 hours|outside .*window|131047/i.test(w)) return 'Reply window closed. They need to write first.';
    if (/ecosystem|healthy|marketing messages|131049/i.test(w)) return 'Meta held it back: they had many marketing messages lately. Try in a few days.';
    if (/limit|spam rate|131048|130429/i.test(w)) return 'The number reached its limit for today. It goes again tomorrow.';
    if (/media|too large|size/i.test(w)) return 'The file is larger than WhatsApp takes. Send a smaller file or a link.';
    if (/paused|disabled/i.test(w)) return 'Meta paused this template. Pick another one, or check it under Settings, WhatsApp.';
    return 'WhatsApp did not take it. Try again; if it fails twice, check Settings, Connections.';
  }
  function bubble(m) {
    var out = m.direction === 'out';
    var by = out && m.by_staff ? ZS.staffById(m.by_staff) : null;
    var st = String(m.state || '').toLowerCase();
    var failed = out && st === 'failed';
    var tpl = out ? (/^\[([a-z0-9_]+)\] /.exec(m.body || '') || [])[1] : null;
    var text = tpl ? String(m.body).slice(tpl.length + 3) : (m.body || '');
    return '<div class="bub' + (out ? ' out' : '') + (failed ? ' fail' : '') + '">' +
      '<div class="bubtext">' + esc(text) + '</div>' +
      '<div class="bubfoot">' + esc(when(m.at)) +
        /* who wrote it is an internal fact and never travels outward */
        (by ? ' &middot; ' + esc(by.name.split(' ')[0]) : '') +
        (tpl ? ' &middot; template ' + esc(tpl) : '') +
        (out && STATE[st] ? ' &middot; <span class="st' + (st === 'read' ? ' read' : '') + '">' + STATE[st] + '</span>' : '') +
      '</div>' +
      (failed ? '<div class="failline"><b>Not delivered.</b> ' + esc(failWords(m.fail)) +
        (m.params ? ' <button class="minibtn" data-act="waRetry" data-id="' + esc(m.id) + '">Try again</button>' : '') +
        '</div>' : '') +
      '</div>';
  }

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    inboxChannel: function (which) { FILTER = which; G.render(); },
    inboxNoCamp: function () { CAMP = null; G.render(); },
    /* Try again on a failed template: the same words, on the same bubble */
    waRetry: function (id) {
      if (!window.API || !API.signedIn()) return G.toast('Sign in to the server first.', true);
      G.toast('Trying again\u2026');
      API.waRetry(id).then(function (r) {
        G.toast('Sent again.');
        return API.thread(r.thread || OPEN).then(function (x) { LOADED[r.thread || OPEN] = (x && x.messages) || []; G.render(); });
      }).catch(function (e) { G.toast((e && e.message) || 'It did not go again.', true); });
    },
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

    /* the closed-window block and the Template button: Start a chat, with the
       number locked to this conversation */
    pickTemplate: function (id) { G.startChat({ thread: id }); },

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


  /* ---------------- Start a chat ----------------

     ⚠️ OUTSIDE 24 HOURS OF THEIR LAST MESSAGE, ONLY AN APPROVED TEMPLATE CAN
     START A CHAT. So this dialog offers approved templates and nothing else,
     fills the {{n}} blanks from the record using the field each template
     remembers, shows the message on a phone before it goes, and sends through
     the server, which checks the approval again. A typed number never makes a
     client by itself (locked 30 Sep); the conversation opens in the Inbox and
     one tap there makes them one. */
  var SC = null;

  function contactOf(c) {
    var ct = c ? ZS.primaryContact(c) : null;
    var digits = (ct && ct.mobile) || (c && c.mobile) || '';
    return { ct: ct, dial: (ct && ct.dial) || (c && c.dial) || ZS.DEFAULT_DIAL, digits: String(digits).replace(/\D/g, '') };
  }
  function lastWrote(digits) {
    var tail = String(digits || '').slice(-9);
    if (tail.length < 9) return null;
    var t = (D().threads || []).filter(function (x) { return String(x.handle || '').slice(-9) === tail; })[0];
    if (!t || !t.last_at) return null;
    var d = Math.floor((Date.now() - new Date(t.last_at).getTime()) / 86400000);
    return d <= 0 ? 'last message today' : 'last message ' + d + ' day' + (d === 1 ? '' : 's') + ' ago';
  }
  function scTemplates() {
    var t = G.waTemplatesNow ? G.waTemplatesNow() : null;
    return ((t && t.templates) || []).filter(function (x) { return x.status === 'APPROVED'; });
  }
  function scTpl() {
    return scTemplates().filter(function (x) { return x.name + '|' + x.language === SC.tpl; })[0] || null;
  }
  function nOf(text) {
    var m = 0;
    String(text || '').replace(/\{\{\s*(\d+)\s*\}\}/g, function (w, n) { m = Math.max(m, Number(n)); return w; });
    return m;
  }
  /* the record the blanks fill from: the client, their first open engagement */
  function scCtx() {
    var c = SC.client ? G.clientById(SC.client) : null;
    var o = SC.opp ? (D().opportunities || []).filter(function (x) { return x.id === SC.opp; })[0] : null;
    if (o && !c) c = G.clientById(o.client);
    if (c && !o) o = (D().opportunities || []).filter(function (x) { return x.client === c.id && ZS.isOpen(x); })[0] || null;
    if (!c) return null;
    return { client: c, contact: ZS.primaryContact(c), opp: o, me: G.me(),
             invoice: o ? (D().invoices || []).filter(function (i) { return i.opp === o.id; })[0] || null : null,
             owed: o ? ZS.owedOn(D().invoices, o.id) : 0 };
  }
  function prefill() {
    var t = scTpl();
    SC.vals = [];
    if (!t) return;
    var ctx = scCtx();
    for (var i = 0; i < nOf(t.body); i++) {
      /* a template made in Meta remembers nothing: {{1}} is nearly always the
         first name, so that one is offered and the rest are typed */
      var key = (t.fills || [])[i] || ZS.waGuess(t, i);
      var v = '';
      if (key && ctx) {
        var r = ZS.waFill('{{' + key + '}}', ctx);
        v = r.missing.length ? '' : r.text;
      }
      SC.vals[i] = v;
    }
  }
  function scWhy() {
    if (!SC.wa && !(SC.digits && ZS.validPhone(SC.dial, SC.digits))) {
      return SC.who === 'number' ? 'Type the number, with its country code picked.' : 'Pick who it goes to.';
    }
    var t = scTpl();
    if (!t) return 'Pick a template.';
    for (var i = 0; i < nOf(t.body); i++) {
      if (!String(SC.vals[i] || '').trim()) {
        return scCtx() ? 'Fill in {{' + (i + 1) + '}}. The record has nothing for it.'
                       : 'Type ' + (i === 0 ? 'the first name' : 'what goes in {{' + (i + 1) + '}}') + '. There is no record to fill it from.';
      }
    }
    if (t.header_type === 'IMAGE' && !/^https:\/\/\S+$/.test(SC.image || '')) return 'Give the web address of the header image (https://).';
    return '';
  }

  function scBody() {
    var tpls = scTemplates(), t = scTpl(), why = scWhy();
    var h = '<div class="twocol" style="margin:0"><div>';
    if (SC.wa) {
      h += '<div class="f"><label>Who</label><p class="m" style="margin:0"><b>' + esc(SC.name || ('+' + SC.wa)) +
        '</b> · +' + esc(SC.wa) + '</p></div>';
    } else {
      h += '<div class="f"><label>Who</label><div class="modes">' +
        [['client', 'A client'], ['opp', 'An enquiry'], ['number', 'A number']].map(function (m) {
          return '<label class="modepick"><input type="radio" name="sc-who" value="' + m[0] + '" data-scwho="1"' +
            (SC.who === m[0] ? ' checked' : '') + '> ' + m[1] + '</label>';
        }).join('') + '</div></div>';
      if (SC.who === 'number') {
        h += '<div style="margin-top:10px">' + G.mobileField('sc-num', 'sc_mobile', SC.dial, SC.digits, 'Mobile number') +
          '<span class="hint">Not on the cockpit yet. The chat opens in the Inbox, and one tap makes them a client.</span></div>';
      } else {
        h += '<div style="margin-top:10px"><input type="search" id="sc-q" value="' + esc(SC.q) + '" style="width:100%" ' +
          'placeholder="' + (SC.who === 'opp' ? 'Find an enquiry' : 'Find a client') + '" aria-label="Find">' +
          '<div class="card" style="padding:0;margin-top:6px" id="sc-hits">' + scHits() + '</div></div>';
      }
    }
    h += '<div class="f" style="margin-top:14px"><label for="sc-tpl">Template</label>' +
      '<select id="sc-tpl"><option value="">Pick an approved template</option>' + tpls.map(function (x) {
        return '<option value="' + esc(x.name + '|' + x.language) + '"' + (SC.tpl === x.name + '|' + x.language ? ' selected' : '') + '>' +
          esc(x.name + ' · ' + ({ MARKETING: 'Marketing', UTILITY: 'Utility' }[x.category] || x.category) + ' · ' + x.language) + '</option>';
      }).join('') + '</select><span class="hint">Approved only. ' + tpls.length + ' on this WhatsApp account.</span></div>';
    if (t && nOf(t.body)) {
      h += '<div class="f" style="margin-top:14px"><label>Fill the blanks</label><div class="opts">' +
        SC.vals.map(function (v, i) {
          return '<div class="optrow"><span class="optn">' + (i + 1) + '</span><input aria-label="Variable ' + (i + 1) + '" data-scval="' + i + '" value="' + esc(v) + '"></div>';
        }).join('') + '</div>' +
        (scCtx() ? '<span class="hint">Filled from ' + esc(scCtx().client.name) + '’s record. A change here changes only this message.</span>' : '') +
        '</div>';
    }
    if (t && t.header_type === 'IMAGE') {
      h += '<div class="f" style="margin-top:14px"><label for="sc-img">Header image</label><input id="sc-img" value="' + esc(SC.image) + '" placeholder="https://"></div>';
    }
    h += '</div><div class="waside" id="sc-prev">' + (t ? G.waPhone(t, SC.vals, [], { short: true }) : '') + '</div></div>';
    h += '<p class="err" id="sc-why"' + (why ? '' : ' hidden') + '>' + esc(why) + '</p>' +
      '<div class="sendrow" style="display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)">' +
      '<button class="btn" type="button" id="sc-send" data-act="scSend"' + (why || SC.busy ? ' disabled' : '') + '>' + (SC.busy ? 'Sending…' : 'Send') + '</button>' +
      '<button class="btn alt" type="button" data-act="scClose">Cancel</button>' +
      '<span class="hint" style="flex:1;min-width:200px">Goes out from +91 99893 98484' +
        (t ? ' as a ' + ({ MARKETING: 'Marketing', UTILITY: 'Utility' }[t.category] || '') + ' message' : '') +
        '. The conversation opens in the Inbox.</span></div>';
    return h;
  }

  function scHits() {
    var q = String(SC.q || '').toLowerCase();
    var rows;
    if (SC.who === 'opp') {
      rows = (D().opportunities || []).filter(ZS.isOpen).map(function (o) {
        var c = G.clientById(o.client);
        return { id: o.id, kind: 'opp', c: c, title: (o.title || o.ref || 'Enquiry'), sub: c ? c.name : '' };
      });
    } else {
      rows = (D().clients || []).map(function (c) { return { id: c.id, kind: 'client', c: c, title: c.name, sub: '' }; });
    }
    rows = rows.filter(function (r) { return !q || (r.title + ' ' + r.sub).toLowerCase().indexOf(q) >= 0; }).slice(0, 6);
    if (!rows.length) return '<p class="m" style="padding:10px">Nothing matches.</p>';
    return rows.map(function (r) {
      var k = contactOf(r.c), has = k.digits && ZS.validPhone(k.dial, k.digits);
      var picked = (r.kind === 'opp' ? SC.opp : SC.client) === r.id;
      var lw = has ? lastWrote(k.digits) : null;
      return '<div class="pickrow"><div class="t"><b>' + esc(r.title) + '</b><span>' +
        esc([r.sub, has ? k.dial + ' ' + k.digits : '', lw].filter(Boolean).join(' · ')) + '</span></div>' +
        (!has ? '<span class="pill warn">No mobile</span>'
          : picked ? '<span class="pill ok">Picked</span>'
          : '<button class="minibtn" data-act="scPick" data-id="' + esc(r.kind + '|' + r.id) + '">Pick</button>') + '</div>';
    }).join('');
  }

  function scDraw(full) {
    var body = document.getElementById('m-body');
    if (!body || !SC) return;
    if (full) { body.innerHTML = scBody(); return; }
    var t = scTpl(), why = scWhy();
    var p = document.getElementById('sc-prev'); if (p) p.innerHTML = t ? G.waPhone(t, SC.vals, [], { short: true }) : '';
    var w = document.getElementById('sc-why'); if (w) { w.textContent = why; w.hidden = !why; }
    var s = document.getElementById('sc-send'); if (s) s.disabled = !!why || SC.busy;
  }

  /* opts: {client, opp, thread, tpl: 'name|lang'}. From a conversation the
     number is locked to that conversation's own. */
  G.startChat = function (opts) {
    opts = opts || {};
    if (!window.API || !API.signedIn()) return G.toast('Sign in to the server first.', true);
    SC = { who: opts.opp ? 'opp' : opts.client ? 'client' : 'client', q: '', client: opts.client || null,
           opp: opts.opp || null, dial: ZS.DEFAULT_DIAL, digits: '', wa: null, name: '', tpl: opts.tpl || '',
           vals: [], image: '', busy: false };
    if (opts.thread) {
      var th = (D().threads || []).filter(function (x) { return x.id === opts.thread; })[0];
      if (th) { SC.wa = String(th.handle).replace(/\D/g, ''); SC.name = th.name; SC.client = th.client_id || null; }
    }
    var c = SC.client ? G.clientById(SC.client) : SC.opp ? G.clientById(((D().opportunities || []).filter(function (o) { return o.id === SC.opp; })[0] || {}).client) : null;
    if (c && !SC.wa) { var k = contactOf(c); SC.dial = k.dial; SC.digits = k.digits; SC.name = (k.ct && k.ct.name) || c.name; }
    prefill();
    G.modal('Start a chat', 'Outside 24 hours of their last message, only an approved template can start a chat.', scBody());
    /* the template list may still be on its way; draw again when it lands */
    if (!scTemplates().length) setTimeout(function () { if (SC) { prefill(); scDraw(true); } }, 1500);
  };

  Object.assign(A, {
    startChat: function (arg) {
      var p = String(arg || '').split('|');
      if (p[0] === 'client') return G.startChat({ client: p[1] });
      if (p[0] === 'opp') return G.startChat({ opp: p[1] });
      if (p[0] === 'tpl') return G.startChat({ tpl: p[1] + '|' + p[2] });
      return G.startChat({});
    },
    scPick: function (arg) {
      var p = String(arg).split('|');
      if (p[0] === 'opp') { SC.opp = p[1]; SC.client = null; } else { SC.client = p[1]; SC.opp = null; }
      var c = scCtx() && scCtx().client, k = contactOf(c);
      SC.dial = k.dial; SC.digits = k.digits; SC.name = (k.ct && k.ct.name) || (c && c.name) || '';
      prefill(); scDraw(true);
    },
    scClose: function () { SC = null; var dm = document.getElementById('modal'); if (dm && dm.open) dm.close(); },
    scSend: function () {
      if (!SC || SC.busy || scWhy()) return;
      var t = scTpl();
      SC.busy = true; scDraw();
      var who = SC.name || (SC.wa ? '+' + SC.wa : SC.dial + ' ' + SC.digits);
      var c = scCtx();
      API.waStart({ wa: SC.wa || undefined, dial: SC.dial, digits: SC.digits, name: SC.name || '',
        client_id: c ? c.client.id : null, opp_id: c && c.opp ? c.opp.id : null,
        template: t.name, language: t.language, params: { body: SC.vals, image: SC.image || '' } })
        .then(function (r) {
          SC = null;
          var dm = document.getElementById('modal'); if (dm && dm.open) dm.close();
          G.toast('Sent to ' + who + '.');
          return (G.pullNow ? Promise.resolve(G.pullNow()) : Promise.resolve()).then(function () {
            if (location.hash.indexOf('#/inbox') !== 0) G.go('#/inbox');
            A.openThread(r.thread);
          });
        }).catch(function (e) {
          var th = e && e.data && e.data.thread;
          if (th) {
            /* it is on the conversation as Failed, with Try again */
            SC = null;
            var dm2 = document.getElementById('modal'); if (dm2 && dm2.open) dm2.close();
            G.toast('Not delivered: ' + ((e && e.message) || 'WhatsApp did not take it.'), true);
            return (G.pullNow ? Promise.resolve(G.pullNow()) : Promise.resolve()).then(function () {
              if (location.hash.indexOf('#/inbox') !== 0) G.go('#/inbox');
              A.openThread(th);
            });
          }
          if (SC) { SC.busy = false; scDraw(); }
          /* in words, never a red dot: "not sent" with no reason is how somebody
             walks away believing they reached a client */
          G.toast((e && e.message) || 'It did not go. Nothing was sent.', true);
        });
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!SC || !el) return;
    if (el.id === 'sc-q') { SC.q = el.value; var hl = document.getElementById('sc-hits'); if (hl) hl.innerHTML = scHits(); return; }
    if (el.id === 'sc-num') { SC.digits = String(el.value || '').replace(/\D/g, ''); SC.name = ''; scDraw(); return; }
    if (el.id === 'sc-img') { SC.image = el.value; scDraw(); return; }
    if (el.dataset && el.dataset.scval !== undefined) { SC.vals[Number(el.dataset.scval)] = el.value; scDraw(); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!SC || !el) return;
    if (el.dataset && el.dataset.scwho) { SC.who = el.value; SC.q = ''; SC.client = null; SC.opp = null; SC.digits = ''; prefill(); scDraw(true); return; }
    if (el.id === 'sc-num-dial') { SC.dial = el.value; scDraw(); return; }
    if (el.id === 'sc-tpl') { SC.tpl = el.value; prefill(); scDraw(true); }
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

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'inboxq') {
      Q = String(e.target.value || '').toLowerCase().trim();
      G.render();
    }
  });

  G.inboxBubble = bubble;
  /* Inbox showing one WhatsApp campaign's conversations (from its results) */
  G.inboxCampaign = function (id) { CAMP = id || null; FILTER = 'all'; G.go('#/inbox'); };
  /* what the overview and Jarvis can both ask for */
  G.inboxThreads = threads;
})();
