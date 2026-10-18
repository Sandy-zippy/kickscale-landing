/* WhatsApp: the templates, the limit we are standing at, and what failed.

   This lives in Settings because it is plumbing, not daily work. Three tabs:

     Templates: the list Meta holds, made here and submitted to Meta for real
                (Meta part 3A, 18 Oct 2026), with Approved / Pending / Rejected
                and Meta's reason in words.
     Health:    which tier the number is on, the quality rating, and how close
                to the ceiling today's sending is.
     Delivery:  what was sent, what landed, what failed and WHY.

   Sending happens from the Inbox and Start a chat, never from this screen. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return ZS.esc(s); };
  function D() { return G.D(); }

  var TAB = 'templates';
  var EDIT = null;            /* the template being written, before it is saved */
  var VARQ = '';              /* the variable search box */
  var VARFOR = null;          /* which field the picker will insert into */

  function wa() {
    var d = D();
    d.whatsapp = d.whatsapp || {};
    var w = d.whatsapp;
    if (!Array.isArray(w.templates)) w.templates = [];
    if (!Array.isArray(w.sends)) w.sends = [];
    if (w.connected === undefined) w.connected = false;
    if (w.tier === undefined) w.tier = 250;
    if (!w.health) w.health = 'GREEN';
    if (!w.number) w.number = '';
    return w;
  }
  G.wa = wa;

  /* ---------------- the section ---------------- */

  G.whatsappSection = function (tab) {
    TAB = tab || TAB;
    var w = wa();
    var a = G.acc();
    if (!a.settings) return G.deny('Not in your view', 'WhatsApp is set up by the owner.');

    var h = '<div class="cardhead pad"><div><h3>WhatsApp</h3>' +
      '<p class="m" style="margin:4px 0 0">Templates, the sending limit we are on, and what actually ' +
      'landed. Meta decides most of this, so the rules below are theirs.</p></div>' +
      (TPL && TPL.checked && TPL.checked.ok ? '<span class="pill ok">Connected</span>'
        : '<span class="pill dim">Waiting for setup</span>') + '</div>';

    h += '<div class="tabs" style="padding:0 16px">' +
      [['templates', 'Templates', TPL ? (TPL.templates || []).length : null],
       ['health', 'Sending limit', null],
       ['delivery', 'What landed', ZS.waStats(w.sends).failed || null]].map(function (t) {
        return '<button class="tab ' + (t[0] === TAB ? 'on' : '') + '" data-act="waTab" data-id="' +
          t[0] + '">' + esc(t[1]) +
          (t[2] ? ' <span class="tcount">' + t[2] + '</span>' : '') + '</button>';
      }).join('') + '</div>';

    if (TAB === 'templates') h += templatesTab();
    else if (TAB === 'health') h += healthTab(w);
    else h += deliveryTab(w);
    return h;
  };

  /* ---------------- templates ----------------

     Server-backed since Meta part 3A (18 Oct): the list is what Meta holds,
     read from the server's copy, and "Submit to Meta" really submits. Status
     comes back on the template-status webhook, or on "Check Meta again". The
     old browser-only list (d.whatsapp.templates) is left where it is, unread. */

  var TPL = null, TPL_KEY = '', TPL_BUSY = false, TPL_WHY = '';
  var TST = 'all', TCAT = '', TLANG = '', TQ = '';
  var LANGS = [['en', 'English'], ['en_US', 'English (US)'], ['en_GB', 'English (UK)'], ['hi', 'Hindi'],
               ['te', 'Telugu'], ['ta', 'Tamil'], ['ar', 'Arabic']];
  var langName = function (k) { return (LANGS.filter(function (l) { return l[0] === k; })[0] || [k, k])[1]; };
  var CAT = { MARKETING: 'Marketing', UTILITY: 'Utility', AUTHENTICATION: 'Authentication' };
  /* Meta's rejection codes, in words, with what to change. Never the code itself. */
  var WHY = {
    INVALID_FORMAT: ['the layout breaks one of its rules, often a variable at the very start or end, or two side by side.',
                     'put words around each variable and submit again.'],
    TAG_CONTENT_MISMATCH: ['the words do not match the category picked.',
                           'change the category, or keep a Utility message to facts they asked for, then submit again.'],
    INCORRECT_CATEGORY: ['it reads as marketing, not an update on something they asked for.',
                         'change the category to Marketing, or keep it to the facts, then submit again.'],
    PROMOTIONAL: ['it reads as an offer where a Utility message is expected.',
                  'change the category to Marketing, then submit again.'],
    ABUSIVE_CONTENT: ['the words broke WhatsApp’s commerce or business rules.',
                      'rewrite it plainly, without pressure or claims, then submit again.'],
    SCAM: ['it looked like a scam to their review.', 'name the business, drop urgency words, then submit again.']
  };
  function whyWords(code) {
    var w = WHY[String(code || '').toUpperCase()];
    return w ? '<b>Meta says:</b> ' + esc(w[0]) + ' <b>Fix:</b> ' + esc(w[1])
             : 'Meta did not say why. Open it in WhatsApp Manager.';
  }

  function loadTemplates(force) {
    if (!window.API || !API.signedIn()) return;
    var r = G.range(), key = r.from + '|' + r.to;
    if (!force && TPL && TPL_KEY === key) return;
    TPL_KEY = key;
    API.waTemplates(r.from, r.to).then(function (out) { TPL = out || { templates: [] }; TPL_WHY = ''; G.render(); })
      .catch(function (e) { TPL = TPL || { templates: [] }; TPL_WHY = (e && e.message) || 'The server did not answer.'; G.render(); });
  }
  G.waTemplatesNow = function () { loadTemplates(); return TPL; };
  G.waEditForTest = function () { return EDIT; };
  G.setTemplatesForTest = function (t) { TPL = t; TPL_KEY = G.range().from + '|' + G.range().to; EDIT = null; };

  function stLabel(t) {
    var s = String(t.status || '').toUpperCase();
    if (s === 'APPROVED') return '<span class="pill ok">Approved</span>';
    if (s === 'PENDING' || s === 'IN_APPEAL') return '<span class="pill info">Pending</span><span class="sub">Meta usually answers within the hour</span>';
    if (s === 'REJECTED') return '<span class="pill bad">Rejected</span><span class="why">' + whyWords(t.reason) + '</span>';
    if (s === 'DRAFT') return '<span class="pill dim">Draft</span>';
    if (s === 'DELETED') return '<span class="pill dim">Deleted on Meta</span><span class="sub">Submit it again under a new name</span>';
    if (s === 'PAUSED' || s === 'DISABLED') return '<span class="pill warn">Paused by Meta</span>';
    return '<span class="pill dim">' + esc(s.toLowerCase() || 'unknown') + '</span>';
  }
  var bucket = function (t) {
    var s = String(t.status || '').toUpperCase();
    return s === 'IN_APPEAL' ? 'PENDING' : s === 'DISABLED' ? 'PAUSED' : s;
  };

  function templatesTab() {
    loadTemplates();
    var h = '<div class="pad">';
    if (EDIT) return h + editor() + '</div>';

    var all = (TPL && TPL.templates) || [];
    var ck = TPL && TPL.checked;
    h += '<div class="cardhead" style="margin-bottom:12px"><div><h3>WhatsApp templates</h3>' +
      '<p class="m" style="margin:4px 0 0">Messages Meta approves in advance. ' +
      (ck ? (ck.ok ? 'Last checked with Meta <b>' + esc(G.whenSaid ? G.whenSaid(ck.at) : ck.at) + '</b>.'
                   : 'The last check with Meta did not go through: ' + esc(ck.note) + '.')
          : 'Not checked with Meta yet.') + '</p></div>' +
      '<div class="right"><button class="btn alt" data-act="waCheckMeta"' + (TPL_BUSY ? ' disabled' : '') + '>' +
      (TPL_BUSY ? 'Checking…' : 'Check Meta again') + '</button>' +
      (G.acc().settings ? '<button class="btn" data-act="waNew">+ New template</button>' : '') + '</div></div>';

    h += '<div class="wbar"><b>Outside 24 hours of their last message, only an approved template can start a chat.</b> ' +
      'Inside the 24 hours you can write anything from the Inbox.</div>';
    h += G.rangeBar();
    h += '<p class="hint" style="margin:-8px 0 12px">The Date filter is on the submitted date, and on Sent and Read. ' +
      'Templates made in Meta have no submitted date here, so they always show.</p>';

    var counts = { all: all.length };
    all.forEach(function (t) { var b = bucket(t); counts[b] = (counts[b] || 0) + 1; });
    var langs = []; all.forEach(function (t) { if (langs.indexOf(t.language) < 0) langs.push(t.language); });
    h += '<div class="chips" style="margin-bottom:12px">' +
      [['all', 'All'], ['APPROVED', 'Approved'], ['PENDING', 'Pending'], ['REJECTED', 'Rejected'], ['DRAFT', 'Drafts']]
        .map(function (c) {
          return '<button class="chip" data-act="waTplSt" data-id="' + c[0] + '" aria-pressed="' +
            (TST === c[0] ? 'true' : 'false') + '">' + c[1] + ' <i>' + (counts[c[0]] || 0) + '</i></button>';
        }).join('') +
      '<select id="wa-fcat" aria-label="Category"><option value="">Any category</option>' +
        ['MARKETING', 'UTILITY'].map(function (k) {
          return '<option value="' + k + '"' + (TCAT === k ? ' selected' : '') + '>' + CAT[k] + '</option>';
        }).join('') + '</select>' +
      '<select id="wa-flang" aria-label="Language"><option value="">Any language</option>' +
        langs.map(function (k) {
          return '<option value="' + esc(k) + '"' + (TLANG === k ? ' selected' : '') + '>' + esc(langName(k)) + '</option>';
        }).join('') + '</select>' +
      '<input type="search" id="wa-fq" placeholder="Search templates" aria-label="Search templates" value="' + esc(TQ) + '">' +
      '</div>';

    if (!TPL) return h + '<div class="card pad"><p class="m">' +
      (window.API && API.signedIn() ? 'Reading the templates…' : 'Sign in to the server to see the templates.') + '</p></div></div>';
    if (TPL_WHY) h += '<p class="err">' + esc(TPL_WHY) + '</p>';

    var q = TQ.toLowerCase();
    var list = all.filter(function (t) {
      if (TST !== 'all' && bucket(t) !== TST) return false;
      if (TCAT && t.category !== TCAT) return false;
      if (TLANG && t.language !== TLANG) return false;
      if (q && (t.name + ' ' + (t.body || '')).toLowerCase().indexOf(q) < 0) return false;
      /* submitted date only where we made it; one made in Meta has none */
      if (t.by_staff && t.created_at && !G.inRange(String(t.created_at).slice(0, 10))) return false;
      return true;
    });
    if (!list.length) return h + '<div class="card pad"><p class="m">Nothing on this filter.</p></div></div>';

    h += '<section class="card" style="padding:0"><div class="scroller" style="border:0"><table class="tbl"><thead><tr>' +
      '<th>Template</th><th>Category</th><th>Language</th><th>Status</th><th>Submitted</th>' +
      '<th class="num">Sent</th><th class="num">Read</th><th></th></tr></thead><tbody>' +
      list.map(function (t) {
        var rej = bucket(t) === 'REJECTED';
        var body = String(t.body || '');
        return '<tr data-tpl="' + esc(t.name) + '"><td' + (rej ? ' class="wrapok"' : '') + '><b>' + esc(t.name) + '</b><span class="sub">' +
          esc(body.slice(0, 58)) + (body.length > 58 ? '…' : '') + '</span></td>' +
          '<td>' + esc(CAT[t.category] || t.category || '·') + '</td>' +
          '<td>' + esc(langName(t.language)) + '</td>' +
          '<td' + (rej ? ' class="wrapok"' : '') + '>' + stLabel(t) + '</td>' +
          '<td>' + (t.by_staff && t.created_at ? esc(ZS.fmtDate ? ZS.fmtDate(String(t.created_at).slice(0, 10)) : String(t.created_at).slice(0, 10)) : 'In Meta') + '</td>' +
          '<td class="num">' + (t.sent || '·') + '</td>' +
          '<td class="num">' + (t.sent ? Math.round(100 * (t.read || 0) / t.sent) + '%' : '·') + '</td>' +
          '<td><button class="minibtn" data-act="waOpenTpl" data-id="' + esc(t.name) + '">' + (rej ? 'Fix it' : 'Open') + '</button>' +
          (TPL.mayEdit && G.me() && G.me().role === 'owner' && bucket(t) !== 'DRAFT'
            ? '<button class="xbtn" data-act="waDropTpl" data-id="' + esc(t.name) + '" aria-label="Delete ' + esc(t.name) + '">&times;</button>' : '') +
          '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
    return h + '</div>';
  }

  /* ---------------- the phone preview, shared with Start a chat ---------------- */

  function marked(text, vals, mark) {
    return esc(String(text || '')).replace(/\{\{\s*(\d+)\s*\}\}/g, function (w, n) {
      var v = (vals || [])[Number(n) - 1];
      return v ? (mark ? '<mark>' + esc(v) + '</mark>' : esc(v)) : w;
    });
  }
  G.waPhone = function (t, vals, headVals, opts) {
    opts = opts || {};
    var hd = t.header_type === 'IMAGE' ? '<div class="wimg">Image</div>'
      : t.header_type === 'TEXT' && t.header_text ? '<b>' + marked(t.header_text, headVals, true) + '</b>' : '';
    return '<div class="waphone" aria-label="Preview on a phone">' +
      '<div class="wptop"><span class="agico">ZS</span><div><b>ZippyScale</b><span>Business account</span></div></div>' +
      '<div class="wpchat"' + (opts.short ? ' style="min-height:260px"' : '') + '>' +
      (opts.short ? '' : '<span class="wpday">Today</span>') +
      '<div class="wabub">' + hd + '<p>' + (marked(t.body, vals, true) || 'The message goes here.') + '</p>' +
      (t.footer ? '<i>' + esc(t.footer) + '</i>' : '') + '<span class="wtime">' + (opts.short ? 'now' : esc(ZS.nowTime ? ZS.nowTime() : '')) + '</span></div>' +
      ((t.buttons || []).length ? '<div class="wabtns">' + t.buttons.map(function (b) {
        return '<span>' + esc(b.text || '') + '</span>'; }).join('') + '</div>' : '') +
      '</div></div>';
  };

  /* ---------------- the form ---------------- */

  function blankTemplate() {
    return { name: '', language: 'en', category: 'MARKETING', header_type: 'NONE', header_text: '', body: '',
             footer: '', buttons: [{ type: 'QUICK_REPLY', text: 'Stop promotions' }],
             samples: { body: [], header: [] }, fills: [], image: '' };
  }
  function nVars(text) {
    var m = 0;
    String(text || '').replace(/\{\{\s*(\d+)\s*\}\}/g, function (w, n) { m = Math.max(m, Number(n)); return w; });
    return m;
  }
  /* Said before Submit, so the button is never pressed into a refusal. The
     server checks the same rules again and has the last word. */
  function missingWhy(t) {
    if (!/^[a-z0-9_]+$/.test(t.name || '')) return 'Give it a name: lowercase letters, numbers and underscores.';
    if (!String(t.body || '').trim()) return 'Write the message.';
    for (var i = 0; i < nVars(t.body); i++) {
      if (!String(t.samples.body[i] || '').trim()) return 'Give a sample for {{' + (i + 1) + '}}. Meta reads the samples to approve it.';
    }
    if (t.header_type === 'TEXT' && nVars(t.header_text) && !String(t.samples.header[0] || '').trim()) return 'Give a sample for the header variable.';
    if (t.header_type === 'IMAGE' && !t.image) return 'Add the sample image for the header.';
    return '';
  }

  function editor() {
    var t = EDIT, n = nVars(t.body), why = missingWhy(t);
    var fillOpts = function (sel) {
      return '<option value="">Typed each time</option>' + ZS.WA_VARS.map(function (v) {
        return '<option value="' + esc(v.key) + '"' + (sel === v.key ? ' selected' : '') + '>' + esc(v.label) + '</option>';
      }).join('');
    };
    var modes = function (name, cur, list) {
      return '<div class="modes">' + list.map(function (o) {
        return '<label class="modepick"><input type="radio" name="' + name + '" value="' + o[0] + '"' +
          (cur === o[0] ? ' checked' : '') + ' data-wamode="' + name + '"> ' + esc(o[1]) + '</label>';
      }).join('') + '</div>';
    };
    var h = '<div style="display:flex;gap:6px;align-items:center;margin-bottom:14px">' +
      '<button class="crumb" data-act="waCancel">Templates</button><span class="crumb-sep">/</span>' +
      '<span class="crumb now asis">' + (t.fixing ? 'Fix ' + esc(t.name) : 'New template') + '</span></div>';
    h += '<div class="twocol"><form id="waform">';
    h += '<div class="fgroup"><h4>What it is</h4><div class="fbody">' +
      '<div class="f"><label for="wa-name">Name</label><input id="wa-name" data-wa="name" value="' + esc(t.name) + '"' +
        (t.fixing ? ' readonly' : '') + ' autocomplete="off">' +
        '<span class="hint">Lowercase, numbers and underscores. Meta refuses anything else.</span></div>' +
      '<div class="f"><label for="wa-lang">Language</label><select id="wa-lang" data-wa="language">' +
        LANGS.map(function (l) { return '<option value="' + l[0] + '"' + (t.language === l[0] ? ' selected' : '') + '>' + esc(l[1]) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f wide" style="grid-column:1/-1"><label>Category</label>' +
        modes('category', t.category, [['MARKETING', 'Marketing'], ['UTILITY', 'Utility']]) +
        '<span class="hint">Marketing: offers, follow-ups, news. Utility: an update on something they already asked for ' +
        '(an invoice, a booking). Meta rejects a Utility template that sells.</span></div>' +
      '</div></div>';

    h += '<div class="fgroup"><h4>Header <em>optional</em></h4><div class="fbody">' +
      '<div class="f wide" style="grid-column:1/-1">' +
        modes('header_type', t.header_type, [['NONE', 'None'], ['TEXT', 'Text'], ['IMAGE', 'Image']]) + '</div>' +
      (t.header_type === 'TEXT'
        ? '<div class="f wide" style="grid-column:1/-1"><label for="wa-head">Header text</label>' +
          '<input id="wa-head" data-wa="header_text" value="' + esc(t.header_text) + '" maxlength="60">' +
          '<span class="hint">One line, 60 characters. It can carry one variable, {{1}}. ' +
          '<span id="wa-headn">' + String(t.header_text || '').length + '</span> / 60</span></div>' +
          (nVars(t.header_text)
            ? '<div class="f wide" style="grid-column:1/-1"><label for="wa-hs">Sample for the header {{1}}</label>' +
              '<input id="wa-hs" data-wasample="header|0" value="' + esc(t.samples.header[0] || '') + '"></div>' : '')
        : '') +
      (t.header_type === 'IMAGE'
        ? '<div class="f wide" style="grid-column:1/-1"><label class="btn alt upl" for="wa-img">' +
            (t.image ? 'Change the image' : 'Upload the image') + '</label>' +
          '<input type="file" id="wa-img" accept="image/jpeg,image/png" hidden>' +
          (t.image ? '<span class="hint">Sample image added. <a href="' + esc(t.image) + '" target="_blank" rel="noopener">View it</a> · ' +
            '<button type="button" class="minibtn" data-act="waImgDrop">Remove</button></span>' : '') +
          '<span class="hint">JPG or PNG, up to 5 MB. Meta reviews it with the words. When you send it, you give the image’s web address.</span></div>'
        : '') +
      '</div></div>';

    h += '<div class="fgroup"><h4>Message</h4><div class="fbody">' +
      '<div class="f wide" style="grid-column:1/-1"><label for="wa-body">Body</label>' +
        '<textarea id="wa-body" data-wa="body" rows="4">' + esc(t.body) + '</textarea>' +
        '<div class="varrow"><button type="button" class="minibtn" data-act="waVarPick" data-id="body">+ Add a variable</button>' +
        (VARFOR ? picker('body') : '') + '</div>' +
        '<span class="hint">Variables are added from the list, never typed. <span id="wa-bodyn">' +
        String(t.body || '').length + '</span> / 1024</span></div>' +
      (n ? '<div class="f wide" style="grid-column:1/-1"><label>Sample for each variable</label>' +
        '<div class="opthead"><span>Fills from</span><span>Sample Meta sees</span></div><div class="opts">' +
        Array.apply(null, { length: n }).map(function (x, i) {
          return '<div class="optrow"><span class="optn">' + (i + 1) + '</span>' +
            '<select aria-label="Variable ' + (i + 1) + ' fills from" data-wafill="' + i + '">' + fillOpts(t.fills[i] || '') + '</select>' +
            '<input aria-label="Sample for variable ' + (i + 1) + '" data-wasample="body|' + i + '" value="' + esc(t.samples.body[i] || '') + '"></div>';
        }).join('') + '</div><span class="hint">Meta needs a sample for every variable before it will review.</span></div>' : '') +
      '<div class="f wide" style="grid-column:1/-1"><label for="wa-foot">Footer <span class="unit">optional</span></label>' +
        '<input id="wa-foot" data-wa="footer" value="' + esc(t.footer) + '" maxlength="60"><span class="hint">60 characters, no variables.</span></div>' +
      '</div></div>';

    h += '<div class="fgroup"><h4>Buttons <em>optional, up to 3 here</em></h4><div class="fbody" style="grid-template-columns:1fr">' +
      '<div class="opts" style="margin:0">' + t.buttons.map(function (b, i) {
        return '<div class="optrow"><span class="optn">' + (i + 1) + '</span>' +
          '<select aria-label="Button ' + (i + 1) + ' type" data-wabtn="' + i + '|type">' +
            [['QUICK_REPLY', 'Quick reply'], ['URL', 'Visit website'], ['PHONE_NUMBER', 'Call']].map(function (o) {
              return '<option value="' + o[0] + '"' + (b.type === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
          '</select><input aria-label="Button ' + (i + 1) + ' words" data-wabtn="' + i + '|text" value="' + esc(b.text || '') + '" maxlength="25">' +
          (b.type === 'URL' ? '<input aria-label="Button ' + (i + 1) + ' web address" data-wabtn="' + i + '|url" value="' + esc(b.url || '') + '" placeholder="https://">' : '') +
          (b.type === 'PHONE_NUMBER' ? '<input aria-label="Button ' + (i + 1) + ' phone" data-wabtn="' + i + '|phone_number" value="' + esc(b.phone_number || '') + '" placeholder="+91…">' : '') +
          '<button type="button" class="xbtn" data-act="waBtnDrop" data-id="' + i + '" aria-label="Remove button ' + (i + 1) + '">&times;</button></div>';
      }).join('') + '</div>' +
      (t.buttons.length < 3 ? '<button type="button" class="minibtn" data-act="waBtnAdd">+ Add a button</button>' : '') +
      '<span class="hint">Marketing templates keep a Stop promotions button. Anyone who taps it or writes STOP never gets a campaign again.</span>' +
      '</div></div>';

    h += '<p class="err" id="wa-why"' + (why ? '' : ' hidden') + '>' + esc(why) + '</p>' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
      '<button class="btn alt" type="submit" name="how" value="draft"' + (TPL_BUSY ? ' disabled' : '') + '>Save as a draft</button>' +
      '<button class="btn" type="submit" name="how" value="submit" id="wa-submit"' + (why || TPL_BUSY ? ' disabled' : '') + '>' +
        (TPL_BUSY ? 'Sending to Meta…' : 'Submit to Meta') + '</button>' +
      '<span class="hint">Meta usually answers within the hour. This list shows Approved or Rejected the moment Meta says.</span></div>';
    h += '</form><div class="waside"><div id="wa-prev">' + G.waPhone(t, t.samples.body, t.samples.header) + '</div>' +
      '<span class="hint">Live preview with the samples. Highlighted words change per person.</span></div></div>';
    return h;
  }

  /* Click, search, insert. There is deliberately no way to type a variable: the
     picker puts in the NEXT {{n}}, Meta's format, and remembers which field
     fills it, so Start a chat can fill it from the record. */
  function picker(name) {
    var q = VARQ.toLowerCase().trim();
    var hits = ZS.WA_VARS.filter(function (v) {
      return !q || v.label.toLowerCase().indexOf(q) >= 0 || v.key.indexOf(q) >= 0 ||
             v.group.toLowerCase().indexOf(q) >= 0;
    });
    var h = '<div class="varpick"><div class="varhead">' +
      '<input id="varq" placeholder="Search variables…" value="' + esc(VARQ) + '" autocomplete="off">' +
      '<button type="button" class="xbtn" data-act="waVarClose" aria-label="Close">&times;</button></div>';
    h += '<div class="varlist">' +
      '<button type="button" class="varopt" data-act="waVarAdd" data-id="' + esc(name + '|') + '"><b>Typed each time</b></button>' +
      ZS.waVarGroups().map(function (g) {
        var mine = hits.filter(function (v) { return v.group === g; });
        if (!mine.length) return '';
        return '<p class="eyebrow">' + esc(g) + '</p>' + mine.map(function (v) {
          return '<button type="button" class="varopt" data-act="waVarAdd" data-id="' + esc(name + '|' + v.key) + '">' +
            '<b>' + esc(v.label) + '</b>' + (v.care ? '<i>' + esc(v.care) + '</i>' : '') + '</button>';
        }).join('');
      }).join('') + '</div></div>';
    return h;
  }

  /* typing updates the record and the preview without re-drawing the form, so
     the cursor never jumps */
  function livePreview() {
    var p = document.getElementById('wa-prev');
    if (p && EDIT) p.innerHTML = G.waPhone(EDIT, EDIT.samples.body, EDIT.samples.header);
    var why = EDIT ? missingWhy(EDIT) : '';
    var w = document.getElementById('wa-why'), s = document.getElementById('wa-submit');
    if (w) { w.textContent = why; w.hidden = !why; }
    if (s) s.disabled = !!why || TPL_BUSY;
    ['body', 'head'].forEach(function (k) {
      var c = document.getElementById('wa-' + k + 'n');
      if (c && EDIT) c.textContent = String(EDIT[k === 'body' ? 'body' : 'header_text'] || '').length;
    });
  }

  function fromServer(t) {
    return { name: t.name, language: t.language || 'en', category: t.category === 'UTILITY' ? 'UTILITY' : 'MARKETING',
      header_type: t.header_type === 'TEXT' || t.header_type === 'IMAGE' ? t.header_type : 'NONE',
      header_text: t.header_text || '', body: t.body || '', footer: t.footer || '',
      buttons: (t.buttons || []).map(function (b) { return { type: b.type, text: b.text, url: b.url, phone_number: b.phone_number }; }),
      samples: { body: (t.samples && t.samples.body) || [], header: (t.samples && t.samples.header) || [] },
      fills: t.fills || [], image: '', fixing: String(t.status).toUpperCase() === 'REJECTED' };
  }
  function tplByName(name) {
    return ((TPL && TPL.templates) || []).filter(function (t) { return t.name === name; })[0] || null;
  }

  /* ---------------- the sending limit ---------------- */

  function healthTab(w) {
    var idx = ZS.waTierIndex(w.tier);
    var tier = ZS.waTier(w.tier);
    var health = ZS.WA_HEALTH[w.health] || ZS.WA_HEALTH.GREEN;
    var today = (w.sends || []).filter(function (s) { return String(s.at).slice(0, 10) === ZS.today(); });
    var uniq = {};
    today.forEach(function (s) { uniq[s.to] = 1; });
    var used = Object.keys(uniq).length;
    var cap = tier.cap === Infinity ? null : tier.cap;
    var pct = cap ? Math.min(100, Math.round(100 * used / cap)) : 0;

    var h = '<div class="pad">';

    h += '<p class="m">Meta caps how many <b>different people</b> you can start a conversation ' +
      'with in a moving 24 hours. The cap climbs on its own, but only while quality holds ' +
      '<i>and</i> you are actually using at least half of what you already have. So sitting ' +
      'well under the limit is itself what keeps you off the next tier.</p>';

    /* where we stand */
    h += '<div class="card pad" style="margin-top:14px">' +
      '<div class="cardhead"><h3>' + esc(tier.label) + '</h3>' +
      '<span class="pill ' + health.pill + '" title="' + esc(health.note) + '">' +
      esc(health.label) + ' quality</span></div>' +
      '<p class="m">' + esc(tier.note) + '</p>';

    /* the ladder, with where we are on it */
    h += '<div class="tierbar">' + ZS.WA_TIERS.map(function (t, i) {
      return '<div class="tierstep' + (i < idx ? ' done' : i === idx ? ' at' : '') + '" ' +
        'title="' + esc(t.note) + '"><span>' + esc(t.label) + '</span></div>';
    }).join('') + '</div>';

    /* today against the cap */
    if (cap) {
      h += '<p class="eyebrow" style="margin-top:18px">Today</p>' +
        '<div class="capbar"><div class="capfill' + (pct >= 90 ? ' full' : pct >= 50 ? ' half' : '') +
        '" style="width:' + pct + '%"></div></div>' +
        '<p class="hint">' + used + ' of ' + ZS.fmt(cap) + ' unique numbers today · ' + pct + '%' +
        (pct < 50 ? '. Under half, so the limit will not climb from here.'
                  : pct >= 90 ? '. Nearly out, so sends will start being refused.' : '') + '</p>';
    } else {
      h += '<p class="hint" style="margin-top:14px">No cap at this tier.</p>';
    }
    h += '</div>';

    /* how to move up, in their terms */
    h += '<p class="eyebrow" style="margin-top:20px">Getting to the next one</p>' +
      '<div class="card pad"><ul class="ledger">' +
      li('Verify the business', 'The fastest route off 250. Business verification in Meta Business Manager.') +
      li('Or send 2,000', 'Delivered to unique numbers in a 30-day window, on high-quality templates.') +
      li('Above 2,000', 'Automatic within about six hours, when quality holds and you have used half your limit in 7 days.') +
      li('Quality rating', health.label + '. ' + health.note) +
      '</ul></div>';

    /* the honest bit */
    h += '<p class="honest" style="margin-top:16px">' +
      (w.connected
        ? 'These are the numbers as last read from the WhatsApp Business account.'
        : 'No WhatsApp Business account is connected, so the tier and the quality rating above ' +
          'are what you have set by hand, not what Meta says. Connect the number and they become ' +
          'real. Nothing here sends anything.') + '</p>';

    /* set it by hand until the number is connected */
    if (!w.connected) {
      h += '<div class="card pad" style="margin-top:14px"><div class="cardhead"><h3>Set it by hand</h3>' +
        '<span class="hint">Until the number is connected</span></div>' +
        '<form id="watier"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">' +
        '<div class="f"><label for="wt-tier">Tier we are on</label><select id="wt-tier" name="tier">' +
          ZS.WA_TIERS.map(function (t) {
            return '<option value="' + (t.cap === Infinity ? 'inf' : t.cap) + '"' +
              (t.cap === w.tier ? ' selected' : '') + '>' + esc(t.label) + '</option>';
          }).join('') + '</select></div>' +
        '<div class="f"><label for="wt-health">Quality rating</label><select id="wt-health" name="health">' +
          Object.keys(ZS.WA_HEALTH).map(function (k) {
            return '<option value="' + k + '"' + (w.health === k ? ' selected' : '') + '>' +
              esc(ZS.WA_HEALTH[k].label) + '</option>';
          }).join('') + '</select></div>' +
        '<div class="f"><label for="wt-num">Business number</label>' +
        '<input id="wt-num" name="number" value="' + esc(w.number) + '" placeholder="+91…"></div>' +
        '</div><button class="btn alt" type="submit" style="margin-top:12px">Save</button></form></div>';
    }

    return h + '</div>';
  }

  function li(k, v) { return '<li><span>' + esc(k) + '</span><b>' + esc(v) + '</b></li>'; }

  /* ---------------- what landed ---------------- */

  function deliveryTab(w) {
    var r = G.range();
    var st = ZS.waStats(w.sends, r);
    var fails = ZS.waFailures(w.sends, r);
    var camps = (D().campaigns || []).length;

    var h = '<div class="pad">' + G.rangeBar();

    h += '<div class="kpis" style="margin:14px 0">' +
      kpi(st.sent, 'Sent') +
      kpi(st.delivered + (st.deliveredPct != null ? ' · ' + st.deliveredPct + '%' : ''), 'Delivered') +
      kpi(st.read + (st.readPct != null ? ' · ' + st.readPct + '%' : ''), 'Read') +
      kpi(st.failed + (st.failedPct != null ? ' · ' + st.failedPct + '%' : ''), 'Failed', st.failed ? 'bad' : null) +
      kpi(camps, 'Campaigns run') +
      '</div>';

    if (!st.sent) {
      h += '<div class="card"><p class="m">Nothing sent in this window.' +
        (w.connected ? '' : ' Nothing can be, until a WhatsApp Business account is connected.') +
        '</p></div></div>';
      return h;
    }

    h += '<p class="eyebrow">Why things failed</p>';
    h += fails.length
      ? '<div class="card" style="padding:0">' + fails.map(function (f) {
          return '<div class="failrow">' +
            '<span class="failn">' + f.n + '</span>' +
            '<div class="t"><b>' + esc(f.info.title) + '</b>' +
              '<span>code ' + esc(String(f.code)) + ' · ' +
              (f.info.fault === 'meta' ? "Meta's cap, not your copy"
                : f.info.fault === 'them' ? 'their end'
                : f.info.fault === 'us' ? 'ours to fix' : 'unknown') + '</span>' +
              '<p class="failwhy">' + esc(f.info.why) + '</p>' +
              '<p class="failfix"><b>Do this:</b> ' + esc(f.info.fix) + '</p></div></div>';
        }).join('') + '</div>'
      : '<div class="card"><p class="m">Nothing failed in this window.</p></div>';

    return h + '</div>';
  }

  function kpi(v, l, tone) {
    return '<div class="kpi' + (tone ? ' ' + tone : '') + '"><b>' + esc(String(v)) + '</b><span>' +
      esc(l) + '</span></div>';
  }

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    waTab: function (t) { TAB = t; VARFOR = null; G.render(); },
    waNew: function () { EDIT = blankTemplate(); VARFOR = null; G.render(); },
    waCancel: function () { EDIT = null; VARFOR = null; VARQ = ''; G.render(); },
    waTplSt: function (k) { TST = k; G.render(); },
    waCheckMeta: function () {
      if (!window.API || !API.signedIn()) return G.toast('Sign in to the server first.', true);
      TPL_BUSY = true; G.render();
      API.waCheck().then(function (out) {
        TPL_BUSY = false;
        TPL = Object.assign({}, TPL || {}, out || {});
        var list = (out && out.templates) || [];
        var ap = list.filter(function (t) { return t.status === 'APPROVED'; }).length;
        var pe = list.filter(function (t) { return t.status === 'PENDING'; }).length;
        G.toast('Checked. ' + ap + ' approved, ' + pe + ' pending.');
        loadTemplates(true);
      }).catch(function (e) {
        TPL_BUSY = false; G.toast((e && e.message) || 'Meta did not answer.', true); G.render();
      });
    },
    waOpenTpl: function (name) {
      var t = tplByName(name);
      if (!t) return;
      var s = String(t.status).toUpperCase();
      if ((s === 'REJECTED' || s === 'DRAFT' || s === 'DELETED') && TPL.mayEdit) {
        EDIT = fromServer(t);
        if (s === 'DELETED') { EDIT.name = ''; EDIT.fixing = false; }
        VARFOR = null; G.render(); return;
      }
      G.modal(t.name, (CAT[t.category] || '') + ' · ' + langName(t.language),
        '<div class="twocol" style="margin:0"><div>' + stLabel(t) +
        '<p class="m" style="margin-top:10px">' + (s === 'APPROVED'
          ? 'Approved by Meta. It can start a chat with anybody, at any time.'
          : 'Not approved yet, so it cannot start a chat.') + '</p>' +
        (s === 'APPROVED' ? '<button class="btn" data-act="startChat" data-id="tpl|' + esc(t.name) + '|' + esc(t.language) + '">Start a chat with it</button>' : '') +
        '</div><div class="waside">' + G.waPhone(t, (t.samples || {}).body, (t.samples || {}).header, { short: true }) + '</div></div>');
    },
    waDropTpl: function (name) {
      if (!confirm('Delete the template "' + name + '" on Meta? Meta will not let the name be used again for 30 days. ' +
                   'Its wording stays in the bin for 30 days.')) return;
      API.waDropTemplate(name).then(function () {
        G.toast('Deleted on Meta. The wording is in the bin.');
        loadTemplates(true);
      }).catch(function (e) { G.toast((e && e.message) || 'Meta did not delete it.', true); });
    },
    waBtnAdd: function () { if (EDIT && EDIT.buttons.length < 3) EDIT.buttons.push({ type: 'QUICK_REPLY', text: '' }); G.render(); },
    waBtnDrop: function (i) { if (EDIT) EDIT.buttons.splice(Number(i), 1); G.render(); },
    waImgDrop: function () { if (EDIT) EDIT.image = ''; G.render(); },
    waVarPick: function () { VARFOR = VARFOR ? null : 'body'; VARQ = ''; G.render(); },
    waVarClose: function () { VARFOR = null; VARQ = ''; G.render(); },
    waVarAdd: function (arg) {
      var key = String(arg).split('|')[1] || '';
      if (!EDIT) return;
      var n = nVars(EDIT.body) + 1;
      EDIT.body = String(EDIT.body || '').replace(/\s+$/, '');
      EDIT.body += (EDIT.body ? ' ' : '') + '{{' + n + '}}';
      EDIT.fills[n - 1] = key;
      VARFOR = null; VARQ = '';
      G.render();
    }
  });

  /* every field of the form writes straight into EDIT as it is typed */
  document.addEventListener('input', function (e) {
    var el = e.target, d = el && el.dataset;
    if (!d) return;
    if (el.id === 'varq') { VARQ = el.value; G.render(); return; }
    if (el.id === 'wa-fq') { TQ = String(el.value || ''); G.render(); return; }
    if (!EDIT) return;
    if (d.wa) { EDIT[d.wa] = el.value; livePreview(); }
    else if (d.wasample) {
      var p = d.wasample.split('|');
      EDIT.samples[p[0]][Number(p[1])] = el.value; livePreview();
    } else if (d.wabtn) {
      var q = d.wabtn.split('|');
      EDIT.buttons[Number(q[0])][q[1]] = el.value; livePreview();
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target, d = el && el.dataset;
    if (!d) return;
    if (el.id === 'wa-fcat') { TCAT = el.value; G.render(); return; }
    if (el.id === 'wa-flang') { TLANG = el.value; G.render(); return; }
    if (!EDIT) return;
    if (d.wamode) { EDIT[d.wamode] = el.value; G.render(); return; }
    if (d.wa === 'language') { EDIT.language = el.value; return; }
    if (d.wafill) { EDIT.fills[Number(d.wafill)] = el.value; return; }
    if (d.wabtn) { var q = d.wabtn.split('|'); EDIT.buttons[Number(q[0])][q[1]] = el.value; G.render(); return; }
    if (el.id === 'wa-img' && el.files && el.files[0]) {
      var f = el.files[0];
      if (f.size > 5 * 1024 * 1024) return G.toast('The image is over 5 MB.', true);
      var rd = new FileReader();
      rd.onload = function () { EDIT.image = String(rd.result || ''); G.render(); };
      rd.readAsDataURL(f);
    }
  });

  var prevSubmit = A.onSubmit;
  A.onSubmit = function (e) {
    if (prevSubmit) prevSubmit(e);

    if (e.target.id === 'watier') {
      e.preventDefault();
      var w = wa(), fd = new FormData(e.target);
      var tv = fd.get('tier');
      w.tier = tv === 'inf' ? Infinity : Number(tv);
      w.health = fd.get('health');
      w.number = String(fd.get('number') || '').trim();
      G.log('wa_settings', 'WhatsApp set to ' + ZS.waTier(w.tier).label + ', quality ' + w.health);
      G.save(); G.toast('Saved.'); G.render();
      return;
    }

    if (e.target.id === 'waform') {
      e.preventDefault();
      if (!EDIT || TPL_BUSY) return;
      if (!window.API || !API.signedIn()) return G.toast('Sign in to the server first.', true);
      var how = (e.submitter && e.submitter.value) || 'draft';
      var why = missingWhy(EDIT);
      if (how === 'submit' && why) return G.toast(why, true);
      var n = nVars(EDIT.body);
      var out = Object.assign({}, EDIT, { how: how,
        samples: { body: EDIT.samples.body.slice(0, n), header: EDIT.samples.header.slice(0, 1) },
        fills: EDIT.fills.slice(0, n),
        buttons: EDIT.buttons.filter(function (b) { return String(b.text || '').trim(); }) });
      delete out.fixing;
      TPL_BUSY = true; G.render();
      API.waSaveTemplate(out).then(function () {
        TPL_BUSY = false;
        G.toast(how === 'draft' ? 'Saved as a draft. Nothing went to Meta.'
                                : 'Sent to Meta. It shows Pending until Meta answers, usually within the hour.');
        EDIT = null; VARFOR = null; VARQ = '';
        loadTemplates(true);
        G.render();
      }).catch(function (err) {
        TPL_BUSY = false;
        G.toast((err && err.message) || 'Meta did not take it. Nothing was submitted.', true);
        G.render();
      });
      return;
    }
  };
})();
