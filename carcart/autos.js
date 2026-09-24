/* Automations: the GHL shape the team already knows —
   1 Who it applies to · 2 When this happens · 3 Only if · 4 Then do this.
   One `kind` field on each action earns the whole internal/client-facing UX. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS;
  var esc = function (s) { return CC.esc(s); };
  var FILTER = 'all', DRAFT = null;

  function D() { return G.D(); }

  V.automations = function () {
    var list = D().automations;
    var shown = list.filter(function (a) {
      if (FILTER === 'internal') return CC.autoKind(a) === 'internal';
      if (FILTER === 'client') return CC.autoKind(a) === 'client';
      if (FILTER === 'off') return !a.on;
      return true;
    });

    var h = '<div class="ph"><div><h1>Automations</h1>' +
      '<p>' + list.filter(function (a) { return a.on; }).length + ' running &middot; ' +
      list.reduce(function (s, a) { return s + (a.runs || 0); }, 0) + ' times so far</p></div>' +
      '<div class="right"><a class="btn" href="#/automation/new">+ New rule</a></div></div>';

    h += '<div class="note"><b>The guardrails, always on.</b> No marketing to anyone without consent ' +
      'or with an open complaint. Outside WhatsApp’s 24-hour window only an approved template goes out. ' +
      '<b>Test is a dry run</b> &mdash; it names the real audience and sends nothing.</div>';

    h += '<div class="chips" style="margin-bottom:16px">' +
      [['all', 'All'], ['internal', 'Internal — your team'], ['client', 'Client-facing'], ['off', 'Switched off']]
        .map(function (f) {
          var n = f[0] === 'all' ? list.length
            : f[0] === 'off' ? list.filter(function (a) { return !a.on; }).length
            : list.filter(function (a) { return CC.autoKind(a) === f[0]; }).length;
          return '<button class="chip" data-act="autoFilter" data-id="' + f[0] + '" aria-pressed="' +
            (FILTER === f[0] ? 'true' : 'false') + '">' + f[1] + '<i>' + n + '</i></button>';
        }).join('') + '</div>';

    h += '<div class="grid2">' + shown.map(function (a) {
      var kind = CC.autoKind(a);
      var t = CC.TRIGGERS[a.trigger.type] || { label: a.trigger.type };
      var aud = CC.audienceOf(a, D().clients);
      return '<div class="card"><div style="display:flex;gap:9px;align-items:flex-start;margin-bottom:9px">' +
        '<h3 style="flex:1">' + esc(a.name) + '</h3>' +
        '<span class="pill ' + (kind === 'client' ? 'warn' : 'dim') + '">' +
        (kind === 'client' ? 'Client-facing' : 'Internal') + '</span>' +
        '<span class="pill ' + (a.on ? 'ok' : 'dim') + '">' + (a.on ? 'On' : 'Off') + '</span></div>' +
        '<p class="m"><b style="color:#D9D5D2">When:</b> ' + esc(t.label) + ' ' + esc(cfgText(a.trigger)) + '</p>' +
        '<p class="m" style="margin-top:5px"><b style="color:#D9D5D2">Then:</b> ' +
        (a.actions || []).map(function (x) {
          var d = CC.ACTS[x.type] || {};
          return '<span class="pill ' + (d.kind === 'client' ? 'warn' : 'dim') + '" style="margin:2px 3px 2px 0">' +
            esc(d.label || x.type) + '</span>';
        }).join('') + '</p>' +
        (a.note ? '<p class="m" style="margin-top:8px;color:var(--dim);font-style:italic">' + esc(a.note) + '</p>' : '') +
        '<p class="m" style="margin-top:10px;color:var(--dim)">' +
        (kind === 'client' ? aud.length + ' customers would get this today &middot; ' : '') +
        'ran ' + (a.runs || 0) + ' times &middot; last ' + esc(a.last || '—') + '</p>' +
        '<p style="margin-top:12px"><a class="minibtn" href="#/automation/' + esc(a.id) + '">Open</a> ' +
        '<button class="minibtn" data-act="testAuto" data-id="' + esc(a.id) + '">Test</button> ' +
        '<button class="minibtn" data-act="toggleAuto" data-id="' + esc(a.id) + '">' +
        (a.on ? 'Switch off' : 'Switch on') + '</button></p></div>';
    }).join('') + '</div>';
    return h;
  };

  function cfgText(tr) {
    var t = CC.TRIGGERS[tr.type];
    if (!t) return '';
    return Object.keys(t.cfg || {}).map(function (k) {
      return tr[k] === undefined || tr[k] === '' ? '' : tr[k] + (k === 'days' ? ' days'
        : k === 'hours' ? ' hours' : k === 'months' ? ' months' : k === 'years' ? ' years'
        : k === 'pct' ? '%' : k === 'km' ? ' km' : '');
    }).filter(Boolean).join(', ');
  }

  /* ---------------- the builder ---------------- */

  V.automation = function (id) {
    if (!G.acc().automations) return G.deny('Not in your view', 'Automations are set up by the owner.');

    if (id === 'new') {
      if (!DRAFT || DRAFT.id) DRAFT = { id: null, name: '', on: true, stages: [], sources: [],
                                        trigger: { type: 'new_enquiry' }, conds: [], actions: [] };
    } else {
      var found = D().automations.filter(function (a) { return a.id === id; })[0];
      if (!found) return G.deny('No such rule', 'That automation is not here.');
      if (!DRAFT || DRAFT.id !== id) DRAFT = JSON.parse(JSON.stringify(found));
    }
    var a = DRAFT, kind = CC.autoKind(a);

    var h = '<div class="ph"><div><h1>' + (a.id ? 'Edit rule' : 'New rule') + '</h1>' +
      '<p>Audience, then what starts it, then the conditions, then what happens.</p></div>' +
      '<div class="right"><button class="btn alt" data-act="testDraft">Test (dry run)</button>' +
      '<button class="btn" data-act="saveAuto">Save</button>' +
      '<a class="btn alt" href="#/automations">Cancel</a></div></div>';

    h += '<div class="fgroup"><h4>Name</h4><div class="fbody"><div class="f wide">' +
      '<input id="a-name" data-d="name" value="' + esc(a.name) + '" placeholder="What does this rule do?"></div></div></div>';

    /* 1 — audience */
    h += '<div class="fgroup"><h4>1 &middot; Who it applies to</h4><div class="fbody"><div class="f wide">' +
      '<label>Stages</label><div class="chips">' + CC.STAGES.map(function (s) {
        return '<button class="chip" type="button" data-act="toggleAud" data-id="stages|' + esc(s) + '" aria-pressed="' +
          (a.stages.indexOf(s) >= 0 ? 'true' : 'false') + '">' + esc(s) + '</button>';
      }).join('') + '</div>' +
      '<label style="margin-top:12px">Where they came from</label><div class="chips">' +
      Object.keys(CC.SOURCES).map(function (s) {
        return '<button class="chip" type="button" data-act="toggleAud" data-id="sources|' + esc(s) + '" aria-pressed="' +
          (a.sources.indexOf(s) >= 0 ? 'true' : 'false') + '">' + esc(CC.SOURCES[s]) + '</button>';
      }).join('') + '</div>' +
      '<p class="hint">' + (kind === 'internal'
        ? 'Every step here is internal, so this rule never messages a customer. Audience is optional.'
        : 'This rule sends a message, so it needs an audience. ' +
          CC.audienceOf(a, D().clients).length + ' customers match right now.') + '</p>' +
      '</div></div></div>';

    /* 2 — trigger */
    var groups = {};
    Object.keys(CC.TRIGGERS).forEach(function (k) {
      var t = CC.TRIGGERS[k];
      (groups[t.group] = groups[t.group] || []).push([k, t]);
    });
    h += '<div class="fgroup"><h4>2 &middot; When this happens</h4><div class="fbody">' +
      '<div class="f"><label>Trigger</label><select data-d="trigger.type">' +
      Object.keys(groups).map(function (g) {
        return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (p) {
          return '<option value="' + p[0] + '"' + (a.trigger.type === p[0] ? ' selected' : '') + '>' +
            esc(p[1].label) + '</option>';
        }).join('') + '</optgroup>';
      }).join('') + '</select></div>';
    var tr = CC.TRIGGERS[a.trigger.type] || { cfg: {} };
    Object.keys(tr.cfg || {}).forEach(function (k) {
      var spec = tr.cfg[k];
      h += '<div class="f"><label>' + esc(k.replace(/_/g, ' ')) + '</label>';
      if (Array.isArray(spec)) {
        h += '<select data-d="trigger.' + k + '">' + spec.map(function (o) {
          return '<option' + (String(a.trigger[k]) === o ? ' selected' : '') + '>' + esc(o) + '</option>';
        }).join('') + '</select>';
      } else {
        h += '<input data-d="trigger.' + k + '" type="' + (spec === 'time' ? 'time' : 'number') +
          '" value="' + esc(a.trigger[k] === undefined ? '' : a.trigger[k]) + '">';
      }
      h += '</div>';
    });
    h += '</div></div>';

    /* 3 — conditions */
    h += '<div class="fgroup"><h4>3 &middot; Only if</h4><div class="fbody"><div class="f wide">' +
      (a.conds.length ? a.conds.map(function (c, i) {
        return '<div style="display:flex;gap:7px;margin-bottom:7px;align-items:center">' +
          '<input data-d="conds.' + i + '.f" value="' + esc(c.f) + '" placeholder="Field" list="condfields" style="flex:2">' +
          '<select data-d="conds.' + i + '.op" style="flex:0 0 90px">' +
          ['is', 'is not', '>', '<'].map(function (o) {
            return '<option' + (c.op === o ? ' selected' : '') + '>' + o + '</option>';
          }).join('') + '</select>' +
          '<input data-d="conds.' + i + '.v" value="' + esc(c.v) + '" placeholder="Value" style="flex:1">' +
          '<button class="minibtn" type="button" data-act="delCond" data-id="' + i + '">Remove</button></div>';
      }).join('') : '<p class="hint">No conditions — this runs every time.</p>') +
      '<datalist id="condfields">' +
      ['Budget', 'Stage', 'Salesperson', 'Days since last contact', 'Cars saved', 'Came from', 'Has a trade-in']
        .map(function (f) { return '<option>' + f + '</option>'; }).join('') + '</datalist>' +
      '<button class="minibtn" type="button" data-act="addCond" style="margin-top:8px">+ Add a condition</button>' +
      '</div></div></div>';

    /* 4 — actions */
    h += '<div class="fgroup"><h4>4 &middot; Then do this</h4><div class="fbody"><div class="f wide">' +
      (a.actions.length ? a.actions.map(function (x, i) {
        var d = CC.ACTS[x.type] || {};
        var inner = Object.keys(d.cfg || {}).map(function (k) {
          var spec = d.cfg[k];
          if (spec === 'staff') {
            return '<select data-d="actions.' + i + '.' + k + '"><option value="">—</option>' +
              CC.STAFF.map(function (u) {
                return '<option value="' + u.id + '"' + (x[k] === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>';
              }).join('') + '</select>';
          }
          if (spec === 'role') {
            return '<select data-d="actions.' + i + '.' + k + '"><option value="">—</option>' +
              Object.keys(CC.ROLES).map(function (r) {
                return '<option value="' + r + '"' + (x[k] === r ? ' selected' : '') + '>' + esc(CC.ROLES[r].label) + '</option>';
              }).join('') + '</select>';
          }
          return '<input data-d="actions.' + i + '.' + k + '" type="' + (spec === 'number' ? 'number' : 'text') +
            '" value="' + esc(x[k] === undefined ? '' : x[k]) + '" placeholder="' + esc(k.replace(/_/g, ' ')) + '">';
        }).join('');
        return '<div style="border:1px solid var(--line);padding:11px;margin-bottom:8px">' +
          '<div style="display:flex;gap:8px;align-items:center;margin-bottom:' + (inner ? '9px' : '0') + '">' +
          '<span class="pill ' + (d.kind === 'client' ? 'warn' : 'dim') + '">' + (i + 1) + '</span>' +
          '<b style="font-family:var(--d);font-size:13.5px;flex:1">' + esc(d.label || x.type) + '</b>' +
          '<button class="minibtn" type="button" data-act="delAct" data-id="' + i + '">Remove</button></div>' +
          (inner ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:7px">' + inner + '</div>' : '') +
          '</div>';
      }).join('') : '<p class="hint">Nothing happens yet. Add a step.</p>') +
      '<select data-act-add="1" style="margin-top:8px"><option value="">+ Add a step&hellip;</option>' +
      '<optgroup label="Internal — your team">' +
      Object.keys(CC.ACTS).filter(function (k) { return CC.ACTS[k].kind === 'internal'; })
        .map(function (k) { return '<option value="' + k + '">' + esc(CC.ACTS[k].label) + '</option>'; }).join('') +
      '</optgroup><optgroup label="Client-facing — reaches the customer">' +
      Object.keys(CC.ACTS).filter(function (k) { return CC.ACTS[k].kind === 'client'; })
        .map(function (k) { return '<option value="' + k + '">' + esc(CC.ACTS[k].label) + '</option>'; }).join('') +
      '</optgroup></select>' +
      '</div></div></div>';

    h += '<p class="err" id="a-err"></p>';
    return h;
  };

  /* ---------------- actions ---------------- */

  Object.assign(A, {
    autoFilter: function (f) { FILTER = f; G.render(); },
    toggleAuto: function (id) {
      var a = D().automations.filter(function (x) { return x.id === id; })[0];
      if (!a) return;
      a.on = !a.on;
      G.log('auto_toggle', '"' + a.name + '" switched ' + (a.on ? 'on' : 'off'));
      G.save();
      G.toast(a.name + (a.on ? ' switched on.' : ' switched off.'));
      G.render();
    },
    testAuto: function (id) {
      var a = D().automations.filter(function (x) { return x.id === id; })[0];
      if (a) showTest(a);
    },
    testDraft: function () { if (DRAFT) showTest(DRAFT); },
    toggleAud: function (arg) {
      var p = arg.split('|'), list = DRAFT[p[0]];
      var i = list.indexOf(p[1]);
      if (i < 0) list.push(p[1]); else list.splice(i, 1);
      G.render();
    },
    addCond: function () { DRAFT.conds.push({ f: '', op: 'is', v: '' }); G.render(); },
    delCond: function (i) { DRAFT.conds.splice(Number(i), 1); G.render(); },
    delAct: function (i) { DRAFT.actions.splice(Number(i), 1); G.render(); },
    saveAuto: function () {
      var err = CC.validateAuto(DRAFT);
      if (err) { var box = document.getElementById('a-err'); if (box) box.textContent = err; G.toast(err, true); return; }
      if (DRAFT.id) {
        var i = D().automations.findIndex(function (x) { return x.id === DRAFT.id; });
        D().automations[i] = DRAFT;
      } else {
        DRAFT.id = 'a' + Date.now();
        DRAFT.runs = 0; DRAFT.last = 'never';
        D().automations.push(DRAFT);
      }
      G.log('auto_save', '"' + DRAFT.name + '" saved');
      G.save();
      var name = DRAFT.name;
      DRAFT = null;
      G.toast('Saved “' + name + '”.');
      G.go('#/automations');
    }
  });

  function showTest(a) {
    var r = CC.testAuto(a, D().clients);
    if (r.error) return G.toast(r.error, true);
    G.modal('Dry run — ' + a.name, 'Nothing was sent.',
      '<ul class="ledger">' +
      '<li><span>Kind</span><b>' + (r.kind === 'client' ? 'Client-facing' : 'Internal only') + '</b></li>' +
      '<li><span>Customers it would reach today</span><b>' + r.audience + '</b></li>' +
      '<li><span>Steps</span><b>' + r.steps.length + '</b></li>' +
      '<li class="tot"><span>Messages actually sent</span><b>' + r.sent + '</b></li></ul>' +
      '<h3 class="sec">What would run</h3><ol style="color:var(--mut);padding-left:18px">' +
      r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<div class="note">This is a dry run. The audience above is counted from the real customer ' +
      'list; no WhatsApp, no SMS and no email left the building.</div>');
  }

  /* draft edits write straight through */
  var prevChange = A.onChange;
  A.onChange = function (e) {
    if (prevChange) prevChange(e);
    var el = e.target;

    if (el.hasAttribute && el.hasAttribute('data-act-add') && el.value) {
      var type = el.value;
      var step = { type: type };
      var cfg = CC.ACTS[type].cfg || {};
      if (cfg.hours) step.hours = 24;
      if (cfg.due_in_days) step.due_in_days = 1;
      DRAFT.actions.push(step);
      G.render();
      return;
    }
    if (el.dataset && el.dataset.d) setPath(el.dataset.d, el.value);
  };

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.dataset || !el.dataset.d || !DRAFT) return;
    if (el.tagName === 'SELECT') return;
    setPath(el.dataset.d, el.value, true);
  });

  /* "trigger.days" / "actions.2.text" — write into the draft without a re-render
     unless the shape changed, so a text box does not lose focus mid-typing. */
  function setPath(path, value, quiet) {
    if (!DRAFT) return;
    var parts = path.split('.'), o = DRAFT;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    var last = parts[parts.length - 1];
    var was = o[last];
    o[last] = value;
    if (path === 'trigger.type' && was !== value) {
      var cfg = (CC.TRIGGERS[value] || {}).cfg || {};
      Object.keys(DRAFT.trigger).forEach(function (k) { if (k !== 'type') delete DRAFT.trigger[k]; });
      var seed = { days: 7, hours: 24, months: 6, years: 3, km: 40000, pct: 20, min_photos: 10 };
      Object.keys(cfg).forEach(function (k) {
        DRAFT.trigger[k] = Array.isArray(cfg[k]) ? cfg[k][0] : (seed[k] !== undefined ? seed[k] : '');
      });
      G.render();
      return;
    }
    if (!quiet) G.render();
  }
})();
