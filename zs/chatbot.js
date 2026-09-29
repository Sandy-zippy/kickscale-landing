/* The chatbot builder.
 *
 * A BOT HERE IS A MENU, and that is a decision rather than a shortcut. A model
 * answering freely on WhatsApp makes promises in your name, in writing, to a
 * customer — about price, about what is included, about when it will be ready —
 * and they keep those promises on their phone. Every word this can say was
 * written by somebody on this screen beforehand. That is what makes it safe
 * enough to leave switched on, which is the only thing that matters about a bot.
 *
 * THE SHAPE: a bot is a list of STEPS. A step says something and offers up to
 * three options. An option either leads to another step or does something —
 * hands the conversation to a person, opens an enquiry, or stops.
 *
 * Three is not arbitrary: WhatsApp will show three buttons and no more.
 *
 * OFF / SUGGEST / AUTO, and it arrives on SUGGEST. In suggest the bot writes the
 * reply and it waits on the Jarvis desk for somebody to press send. Nobody should
 * be sold auto; they should arrive at it on the one bot they have watched for a
 * fortnight.
 */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  var BOTS = null;          /* what the server has, once fetched */
  var WHY = '';
  var EDIT = null;          /* the bot being worked on, as a draft */

  var MODES = {
    off:     ['Off', 'dim', 'It says nothing at all.'],
    suggest: ['Suggest', 'warn',
      'It writes the reply and waits. Nothing reaches a customer until somebody presses send.'],
    auto:    ['Auto', 'ok',
      'It answers on its own, day and night. Only for a bot you have watched for a while.']
  };

  var ACTIONS_LIST = {
    next:    'go to another step',
    human:   'hand it to a person and stop',
    assign:  'hand it to a named person and stop',
    enquiry: 'open an enquiry on the board and stop',
    end:     'say one last thing and stop'
  };

  function load() {
    if (!window.API || !API.signedIn()) { BOTS = []; WHY = 'Sign in to the server first.'; return; }
    API.bots().then(function (r) {
      BOTS = (r && r.bots) || [];
      G.render();
    }).catch(function (e) {
      BOTS = [];
      WHY = (e && e.message) || 'The server did not answer.';
      G.render();
    });
  }

  V.chatbot = function () {
    var h = '<div class="ph"><div><h1>Chatbot</h1>' +
      '<p>One bot can answer on WhatsApp and Instagram, or you can have one for each. ' +
      'It offers a short menu and hands over to a person &mdash; it never makes anything ' +
      'up, because every word it can say is written here first.</p></div></div>';

    if (BOTS === null) { load(); return h + '<div class="card pad"><p class="m">Reading it&hellip;</p></div>'; }
    if (!BOTS.length) {
      return h + '<div class="card pad"><p class="m">' + esc(WHY || 'No bot yet.') + '</p></div>';
    }

    if (EDIT) return h + editor();

    h += '<div class="note"><b>Why a menu and not something cleverer.</b> A bot that ' +
      'answers freely will eventually quote a price, promise a date or describe something ' +
      'we do not sell &mdash; in writing, in your name, on the customer’s phone. ' +
      'This one can only say what is written on this screen, and hands over the moment it ' +
      'is out of its depth or somebody asks for a person.</div>';

    h += BOTS.map(botCard).join('');
    return h;
  };

  function botCard(b) {
    var mode = MODES[b.mode] || MODES.suggest;
    var ch = b.channels === 'both' ? 'WhatsApp and Instagram'
      : b.channels === 'whatsapp' ? 'WhatsApp only' : 'Instagram only';

    return '<div class="card pad" style="margin-bottom:14px">' +
      '<div class="cardhead"><h3>' + esc(b.name) + '</h3>' +
      '<span class="pill ' + mode[1] + '">' + esc(mode[0]) + '</span></div>' +
      '<p class="m">' + esc(ch) + ' &middot; ' + (b.steps || []).length + ' step' +
      ((b.steps || []).length === 1 ? '' : 's') +
      (b.runs ? ' &middot; answered ' + b.runs + ' time' + (b.runs === 1 ? '' : 's') : '') +
      '</p>' +
      '<p class="hint" style="margin-top:6px">' + esc(mode[2]) + '</p>' +
      '<div class="convpreview">' + (b.steps || []).slice(0, 2).map(function (s) {
        return '<div class="bub"><div class="bubtext">' + esc(s.body) +
          ((s.options || []).length
            ? '\n\n' + (s.options || []).map(function (o, i) {
                return (i + 1) + '. ' + o.label; }).join('\n')
            : '') + '</div></div>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:9px;margin-top:12px;flex-wrap:wrap">' +
      '<button class="btn alt" data-act="editBot" data-id="' + esc(b.id) + '">Edit it</button>' +
      Object.keys(MODES).map(function (m) {
        return '<button class="minibtn" data-act="botMode" data-id="' + esc(b.id + '|' + m) + '"' +
          (b.mode === m ? ' disabled' : '') + '>' + esc(MODES[m][0]) + '</button>';
      }).join('') +
      '</div></div>';
  }

  /* ---------------- the editor ---------------- */

  function editor() {
    var b = EDIT;
    var names = (b.steps || []).map(function (s) { return s.name; });

    var h = '<form id="botform" class="card pad">' +
      '<div class="cardhead"><h3>' + esc(b.name) + '</h3>' +
      '<button type="button" class="minibtn" data-act="cancelBot">Leave it</button></div>' +

      '<div class="recgrid" style="margin-top:12px">' +
      '<div class="recrow"><label for="b-name">What it is called</label>' +
      '<input id="b-name" value="' + esc(b.name) + '" data-bot="name"></div>' +
      '<div class="recrow"><label for="b-ch">Where it answers</label>' +
      '<select id="b-ch" data-bot="channels">' +
      [['both', 'WhatsApp and Instagram'], ['whatsapp', 'WhatsApp only'],
       ['instagram', 'Instagram only']].map(function (o) {
        return '<option value="' + o[0] + '"' + (b.channels === o[0] ? ' selected' : '') +
          '>' + esc(o[1]) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="recrow"><label for="b-mode">How far it may go</label>' +
      '<select id="b-mode" data-bot="mode">' +
      Object.keys(MODES).map(function (m) {
        return '<option value="' + m + '"' + (b.mode === m ? ' selected' : '') +
          '>' + esc(MODES[m][0]) + '</option>';
      }).join('') + '</select>' +
      '<span class="rechint">' + esc((MODES[b.mode] || MODES.suggest)[2]) + '</span></div>' +
      '</div>';

    h += '<h4 class="sec" style="margin-top:20px">What it says</h4>';
    h += (b.steps || []).map(function (s, i) { return stepBox(s, i, names); }).join('');

    h += '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">' +
      '<button class="btn" type="submit">Save the bot</button>' +
      '<button class="btn alt" type="button" data-act="addStep">Add a step</button>' +
      '</div>' +
      '<p class="hint" style="margin-top:10px">The first step is the one it opens with. ' +
      'Three options at most per step: WhatsApp will not show more than three buttons.</p>' +
      '</form>';
    return h;
  }

  function stepBox(s, i, names) {
    var h = '<div class="stepbox">' +
      '<div class="stephead"><b>' + (i === 0 ? 'Opens with' : 'Step ' + (i + 1)) + '</b>' +
      '<input value="' + esc(s.name || '') + '" data-step="' + i + '|name" ' +
      'placeholder="a short name" style="max-width:150px">' +
      (i > 0 ? '<button type="button" class="xbtn" data-act="dropStep" data-id="' + i +
               '" title="Remove">&times;</button>' : '') +
      '</div>' +
      '<textarea rows="2" data-step="' + i + '|body" placeholder="What it says">' +
      esc(s.body || '') + '</textarea>';

    h += '<div class="opts">' + (s.options || []).map(function (o, j) {
      return '<div class="optrow">' +
        '<span class="optn">' + (j + 1) + '</span>' +
        '<input value="' + esc(o.label || '') + '" data-opt="' + i + '|' + j + '|label" ' +
        'placeholder="What they can pick">' +
        '<select data-opt="' + i + '|' + j + '|action">' +
        Object.keys(ACTIONS_LIST).map(function (a) {
          return '<option value="' + a + '"' + ((o.action || 'next') === a ? ' selected' : '') +
            '>' + esc(ACTIONS_LIST[a]) + '</option>';
        }).join('') + '</select>' +
        ((o.action || 'next') === 'next'
          ? '<select data-opt="' + i + '|' + j + '|next">' +
            names.map(function (n) {
              return '<option value="' + esc(n) + '"' + (o.next === n ? ' selected' : '') +
                '>' + esc(n) + '</option>';
            }).join('') + '</select>'
          : (o.action === 'assign'
              ? '<select data-opt="' + i + '|' + j + '|to">' +
                '<option value="">whoever is free</option>' +
                ZS.staffList().map(function (u) {
                  return '<option value="' + esc(u.id) + '"' + (o.to === u.id ? ' selected' : '') +
                    '>' + esc(u.name) + '</option>';
                }).join('') + '</select>'
              : '<span class="hint">and stops</span>')) +
        '<button type="button" class="xbtn" data-act="dropOpt" data-id="' + i + '|' + j +
        '" title="Remove">&times;</button>' +
        '</div>';
    }).join('') + '</div>';

    if ((s.options || []).length < 3) {
      h += '<button type="button" class="minibtn" data-act="addOpt" data-id="' + i +
        '">Add an option</button>';
    } else {
      h += '<span class="hint">Three is the most WhatsApp will show as buttons.</span>';
    }
    return h + '</div>';
  }

  /* ---------------- actions ---------------- */

  function draft(id) {
    var b = BOTS.filter(function (x) { return x.id === id; })[0];
    return b ? JSON.parse(JSON.stringify(b)) : null;
  }

  Object.assign(A, {
    editBot: function (id) { EDIT = draft(id); G.render(); },
    cancelBot: function () { EDIT = null; G.render(); },

    botMode: function (arg) {
      var p = String(arg).split('|');
      var b = draft(p[0]);
      if (!b) return;
      b.mode = p[1];
      /* ⚠️ AUTO IS A REAL DECISION, so it is asked about rather than toggled.
         Everything else on this screen is reversible in a click; this one puts
         words in front of customers with nobody reading them first. */
      if (p[1] === 'auto' && !confirm(
        'Put "' + b.name + '" on auto?\n\n' +
        'It will answer customers on its own, day and night, with nobody reading ' +
        'first. It can only say what is written in its steps, and it hands over ' +
        'the moment somebody asks for a person.')) return;
      saveBot(b, MODES[p[1]][0] + '.');
    },

    addStep: function () {
      collect();
      EDIT.steps = (EDIT.steps || []).concat([
        { name: 'step' + ((EDIT.steps || []).length + 1), body: '', options: [] }]);
      G.render();
    },
    dropStep: function (i) {
      collect();
      EDIT.steps.splice(Number(i), 1);
      G.render();
    },
    addOpt: function (i) {
      collect();
      var s = EDIT.steps[Number(i)];
      s.options = (s.options || []).concat([{ label: '', action: 'next',
        next: (EDIT.steps[Number(i) + 1] || {}).name || '' }]);
      G.render();
    },
    dropOpt: function (arg) {
      collect();
      var p = String(arg).split('|');
      EDIT.steps[Number(p[0])].options.splice(Number(p[1]), 1);
      G.render();
    }
  });

  /* Read the form back into the draft. Everything on this screen is typed into
     several boxes at once, so it is collected on demand rather than saved on
     each keystroke — the same rule the engagement panel follows. */
  function collect() {
    if (!EDIT) return;
    document.querySelectorAll('[data-bot]').forEach(function (el) {
      EDIT[el.getAttribute('data-bot')] = el.value;
    });
    document.querySelectorAll('[data-step]').forEach(function (el) {
      var p = el.getAttribute('data-step').split('|');
      if (EDIT.steps[p[0]]) EDIT.steps[p[0]][p[1]] = el.value;
    });
    document.querySelectorAll('[data-opt]').forEach(function (el) {
      var p = el.getAttribute('data-opt').split('|');
      var s = EDIT.steps[p[0]];
      if (s && s.options && s.options[p[1]]) s.options[p[1]][p[2]] = el.value;
    });
  }

  function saveBot(b, said) {
    if (!window.API || !API.signedIn()) return G.toast('Sign in to the server first.', true);
    b.start_step = ((b.steps || [])[0] || {}).name || null;
    API.saveBot(b).then(function () {
      G.log('auto_edit', 'The chatbot "' + b.name + '" was saved, in ' + b.mode + ' mode');
      G.save();
      G.toast(said || 'Saved.');
      EDIT = null;
      BOTS = null;
      G.render();
    }).catch(function (e) {
      G.toast((e && e.message) || 'It would not save.', true);
    });
  }

  document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'botform') return;
    e.preventDefault();
    collect();
    var empty = (EDIT.steps || []).filter(function (s) { return !String(s.body || '').trim(); });
    if (empty.length) return G.toast('A step with nothing to say would stop the ' +
      'conversation dead. Write something in each, or remove it.', true);
    saveBot(EDIT);
  });
})();
