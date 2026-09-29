/* WhatsApp: the templates, the limit we are standing at, and what failed.

   This lives in Settings because it is plumbing, not daily work. Three tabs:

     Templates — write one, pick variables rather than typing them, submit it.
     Health    — which tier the number is on, the quality rating, and how close
                 to the ceiling today's sending is.
     Delivery  — what was sent, what landed, what failed and WHY, in Meta's own
                 error codes with the thing to actually do about each.

   Nothing here sends. There is no WABA connected and no server to send from,
   and the screen says so rather than implying otherwise. What it does do is
   make a template that will be accepted, which is most of the work. */
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
      '<span class="pill ' + (w.connected ? 'ok' : 'warn') + '">' +
      (w.connected ? 'connected' : 'not connected yet') + '</span></div>';

    h += '<div class="tabs" style="padding:0 16px">' +
      [['templates', 'Templates', w.templates.length],
       ['health', 'Sending limit', null],
       ['delivery', 'What landed', ZS.waStats(w.sends).failed || null]].map(function (t) {
        return '<button class="tab ' + (t[0] === TAB ? 'on' : '') + '" data-act="waTab" data-id="' +
          t[0] + '">' + esc(t[1]) +
          (t[2] ? ' <span class="tcount">' + t[2] + '</span>' : '') + '</button>';
      }).join('') + '</div>';

    if (TAB === 'templates') h += templatesTab(w);
    else if (TAB === 'health') h += healthTab(w);
    else h += deliveryTab(w);
    return h;
  };

  /* ---------------- templates ---------------- */

  function templatesTab(w) {
    var h = '<div class="pad">';

    if (EDIT) return h + editor(w) + '</div>';

    h += '<p class="m">A template is a message Meta has approved in advance. Without one you ' +
      'can only reply inside 24 hours of them writing to you, which is almost never when you ' +
      'need to.</p>';

    h += '<div class="right" style="margin:12px 0"><button class="btn" data-act="waNew">' +
      '+ Write a template</button></div>';

    if (!w.templates.length) {
      h += '<div class="card"><p class="m">Nothing written yet.</p></div></div>';
      return h;
    }

    h += '<div class="scroller"><table class="tbl"><thead><tr>' +
      '<th>Name</th><th>Category</th><th>Variables</th><th>State</th><th>Quality</th>' +
      '<th class="num">Sent</th><th class="num">Failed</th><th></th></tr></thead><tbody>' +
      w.templates.map(function (t) {
        var st = ZS.WA_STATES[t.state] || ZS.WA_STATES.DRAFT;
        var q = ZS.WA_QUALITY[t.quality] || ZS.WA_QUALITY.PENDING;
        var vars = ZS.templateVars(t);
        var mine = (w.sends || []).filter(function (s) { return s.template === t.id; });
        var failed = mine.filter(function (s) { return s.state === 'failed'; }).length;
        return '<tr>' +
          '<td><b>' + esc(t.name) + '</b><span class="sub">' + esc(String(t.body).slice(0, 58)) +
            (String(t.body).length > 58 ? '…' : '') + '</span></td>' +
          '<td>' + esc((ZS.WA_CATEGORIES[t.category] || {}).label || t.category) + '</td>' +
          '<td>' + (vars.length
            ? '<span class="pill dim">' + vars.length + '</span>'
            : '<span style="color:var(--dim)">none</span>') + '</td>' +
          '<td><span class="pill ' + st.pill + '" title="' + esc(st.note) + '">' + esc(st.label) + '</span></td>' +
          '<td><span class="pill ' + q.pill + '">' + esc(q.label) + '</span></td>' +
          '<td class="num">' + mine.length + '</td>' +
          '<td class="num">' + (failed ? '<span style="color:var(--bad)">' + failed + '</span>' : '0') + '</td>' +
          '<td><button class="minibtn" data-act="waEdit" data-id="' + esc(t.id) + '">Open</button>' +
          '<button class="xbtn" data-act="waDrop" data-id="' + esc(t.id) + '" ' +
          'aria-label="Remove ' + esc(t.name) + '">&times;</button></td></tr>';
      }).join('') + '</tbody></table></div>';

    return h + '</div>';
  }

  /* ---------------- the editor, with the variable picker ---------------- */

  function editor(w) {
    var t = EDIT;
    var vars = ZS.templateVars(t);
    var bad = ZS.validateTemplate(t);

    var h = '<div class="cardhead"><h3>' + (t.id && byId(w, t.id) ? 'Edit' : 'New') + ' template</h3>' +
      '<button class="minibtn" data-act="waCancel">Close</button></div>';

    h += '<form id="waform"><div class="fgroup"><h4>What it is</h4><div class="fbody">' +
      '<div class="f"><label for="wa-name">Name</label>' +
      '<input id="wa-name" name="name" value="' + esc(t.name) + '" autocomplete="off" ' +
      'placeholder="build_handover">' +
      '<span class="hint">Lowercase, numbers and underscores. Meta refuses anything else.</span></div>' +
      '<div class="f"><label for="wa-cat">Category</label><select id="wa-cat" name="category">' +
        Object.keys(ZS.WA_CATEGORIES).map(function (k) {
          return '<option value="' + k + '"' + (t.category === k ? ' selected' : '') + '>' +
            esc(ZS.WA_CATEGORIES[k].label) + '</option>';
        }).join('') + '</select>' +
      '<span class="hint">' + esc((ZS.WA_CATEGORIES[t.category] || {}).note || '') + '</span></div>' +
      '<div class="f"><label for="wa-lang">Language</label>' +
      '<input id="wa-lang" name="language" value="' + esc(t.language) + '" autocomplete="off"></div>' +
      '</div></div>';

    h += '<div class="fgroup"><h4>The message</h4><div class="fbody">' +
      field('wa-header', 'header', 'Header', t.header, 'Optional. One line, 60 characters.') +
      field('wa-body', 'body', 'Body', t.body, 'The message itself. Up to 1024 characters.', true) +
      field('wa-footer', 'footer', 'Footer', t.footer, 'Optional. 60 characters, no variables worth putting here.') +
      '</div></div>';

    /* what it will actually look like */
    h += '<div class="card pad" style="margin-top:14px">' +
      '<p class="eyebrow">Against a real engagement</p>' + preview(t) + '</div>';

    h += (bad ? '<p class="err" style="margin-top:12px">' + esc(bad) + '</p>'
               : '<p class="hint" style="margin-top:12px">Ready to submit.' +
                 (vars.length ? ' Carries ' + vars.length + ' variable' + (vars.length === 1 ? '' : 's') + '.' : '') +
                 '</p>');

    h += '<div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">' +
      '<button class="btn alt" type="submit" name="how" value="save">Save as a draft</button>' +
      '<button class="btn" type="submit" name="how" value="submit"' + (bad ? ' disabled' : '') +
      '>Submit to Meta</button></div></form>';

    return h;
  }

  /* One text field with its own "Add a variable" button. */
  function field(id, name, label, val, hint, big) {
    return '<div class="f wide"><label for="' + id + '">' + esc(label) + '</label>' +
      (big
        ? '<textarea id="' + id + '" name="' + name + '" rows="5" data-watext="' + name + '">' + esc(val || '') + '</textarea>'
        : '<input id="' + id + '" name="' + name + '" value="' + esc(val || '') + '" ' +
          'autocomplete="off" data-watext="' + name + '">') +
      '<div class="varrow">' +
      '<button type="button" class="minibtn" data-act="waVarPick" data-id="' + name + '">+ Add a variable</button>' +
      (VARFOR === name ? picker(name) : '') +
      '</div>' +
      (hint ? '<span class="hint">' + esc(hint) + '</span>' : '') +
      '</div>';
  }

  /* Click, search, insert. There is deliberately no way to type a variable:
     a hand-typed {{clinet_name}} is a message that goes out with a hole in it
     and you find out about it from the client. */
  function picker(name) {
    var q = VARQ.toLowerCase().trim();
    var hits = ZS.WA_VARS.filter(function (v) {
      return !q || v.label.toLowerCase().indexOf(q) >= 0 || v.key.indexOf(q) >= 0 ||
             v.group.toLowerCase().indexOf(q) >= 0;
    });
    var h = '<div class="varpick"><div class="varhead">' +
      '<input id="varq" placeholder="Search variables…" value="' + esc(VARQ) + '" autocomplete="off">' +
      '<button type="button" class="xbtn" data-act="waVarClose" aria-label="Close">&times;</button></div>';

    if (!hits.length) {
      h += '<p class="m pad">Nothing matches. Every variable this cockpit can fill is on this ' +
        'list; if what you want is not here, it is not a field we hold.</p></div>';
      return h;
    }
    h += '<div class="varlist">' + ZS.waVarGroups().map(function (g) {
      var mine = hits.filter(function (v) { return v.group === g; });
      if (!mine.length) return '';
      return '<p class="eyebrow">' + esc(g) + '</p>' + mine.map(function (v) {
        return '<button type="button" class="varopt" data-act="waVarAdd" data-id="' +
          esc(name + '|' + v.key) + '">' +
          '<b>' + esc(v.label) + '</b><code>{{' + esc(v.key) + '}}</code>' +
          (v.care ? '<i>' + esc(v.care) + '</i>' : '') + '</button>';
      }).join('');
    }).join('') + '</div></div>';
    return h;
  }

  /* Filled against a real engagement, so a variable that resolves to nothing is
     visible here rather than in a client's chat. */
  function preview(t) {
    var opp = (D().opportunities || []).filter(function (o) { return ZS.isOpen(o) || o.proc; })[0] ||
              (D().opportunities || [])[0];
    if (!opp) return '<p class="m">No engagement to preview against yet.</p>';
    var c = G.clientById(opp.client);
    var inv = (D().invoices || []).filter(function (i) { return i.opp === opp.id; })[0] || null;
    var ctx = { client: c, contact: ZS.primaryContact(c), opp: opp, invoice: inv,
                owed: ZS.owedOn(D().invoices, opp.id), me: G.me() };
    var parts = ['header', 'body', 'footer'].map(function (k) { return ZS.waFill(t[k] || '', ctx); });
    var missing = [];
    parts.forEach(function (p) { p.missing.forEach(function (m) { if (missing.indexOf(m) < 0) missing.push(m); }); });

    var h = '<div class="wapreview">' +
      (parts[0].text ? '<b>' + esc(parts[0].text) + '</b>' : '') +
      '<p>' + esc(parts[1].text || 'The message goes here.').replace(/\n/g, '<br>') + '</p>' +
      (parts[2].text ? '<i>' + esc(parts[2].text) + '</i>' : '') +
      '</div>' +
      '<p class="hint" style="margin-top:8px">Filled against <b>' + esc(c ? c.name : '—') + '</b> · ' +
      esc(opp.ref || opp.id) + '</p>';

    if (missing.length) {
      h += '<p class="err" style="margin-top:6px">' +
        missing.map(function (k) { return '{{' + esc(k) + '}}'; }).join(', ') +
        ' resolved to nothing on this engagement. It would send as a blank.</p>';
    }
    return h;
  }

  function byId(w, id) {
    return (w.templates || []).filter(function (t) { return t.id === id; })[0] || null;
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
      '<i>and</i> you are actually using at least half of what you already have — so sitting ' +
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
        (pct < 50 ? ' — under half, so the limit will not climb from here.'
                  : pct >= 90 ? ' — nearly out. Sends will start being refused.' : '') + '</p>';
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
      li('Quality rating', health.label + ' — ' + health.note) +
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
    waNew: function () { EDIT = ZS.newTemplate({}); VARFOR = null; G.render(); },
    waCancel: function () { EDIT = null; VARFOR = null; VARQ = ''; G.render(); },
    waEdit: function (id) {
      var t = byId(wa(), id);
      if (!t) return;
      EDIT = JSON.parse(JSON.stringify(t));
      VARFOR = null;
      G.render();
    },
    waDrop: function (id) {
      var w = wa(), t = byId(w, id);
      if (!t) return;
      if (!confirm('Remove the template "' + t.name + '"? This cannot be undone.')) return;
      w.templates = w.templates.filter(function (x) { return x.id !== id; });
      G.log('wa_template', t.name + ' removed');
      G.save(); G.toast('Removed.'); G.render();
    },
    waVarPick: function (name) { keepEdits(); VARFOR = (VARFOR === name ? null : name); VARQ = ''; G.render(); },
    waVarClose: function () { keepEdits(); VARFOR = null; VARQ = ''; G.render(); },
    waVarAdd: function (arg) {
      var p = String(arg).split('|'), name = p[0], key = p[1];
      keepEdits();
      if (!EDIT) return;
      EDIT[name] = String(EDIT[name] || '').replace(/\s+$/, '');
      EDIT[name] += (EDIT[name] ? ' ' : '') + '{{' + key + '}}';
      VARFOR = null; VARQ = '';
      G.save(); G.render();
    }
  });

  /* Whatever is typed into the editor survives a re-render, because opening the
     variable picker re-renders and losing half a message to that would be
     infuriating. */
  function keepEdits() {
    if (!EDIT) return;
    ['name', 'category', 'language', 'header', 'body', 'footer'].forEach(function (k) {
      var el = document.getElementById('wa-' + (k === 'category' ? 'cat' : k === 'language' ? 'lang' : k));
      if (el) EDIT[k] = el.value;
    });
  }
  G.waKeepEdits = keepEdits;

  var prevInput = A.onInput;
  A.onInput = function (e) {
    if (prevInput) prevInput(e);
    if (e.target.id === 'varq') { VARQ = e.target.value; G.render(); return; }
    /* live preview as the message is written */
    if (e.target.dataset && e.target.dataset.watext && EDIT) {
      EDIT[e.target.dataset.watext] = e.target.value;
    }
  };
  document.addEventListener('input', function (e) { A.onInput(e); });

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
      keepEdits();
      var w2 = wa();
      var how = (e.submitter && e.submitter.value) || 'save';
      var bad = ZS.validateTemplate(EDIT);
      if (how === 'submit' && bad) { G.toast(bad, true); return; }
      if (!ZS.validTemplateName(EDIT.name)) { G.toast('Give it a name first.', true); return; }

      if (how === 'submit') {
        EDIT.state = 'IN_REVIEW';
        EDIT.submitted = ZS.today();
      }
      var existing = byId(w2, EDIT.id);
      if (existing) w2.templates = w2.templates.map(function (t) { return t.id === EDIT.id ? EDIT : t; });
      else w2.templates.push(EDIT);

      G.log('wa_template', EDIT.name + (how === 'submit' ? ' submitted to Meta' : ' saved as a draft'));
      G.save();
      G.toast(how === 'submit'
        ? 'Submitted. Meta usually answers within the hour.'
        : 'Saved as a draft.');
      EDIT = null; VARFOR = null; VARQ = '';
      G.render();
      return;
    }
  };
})();
