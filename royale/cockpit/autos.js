/* Automations (Audience · When · Only if · Then), client issues, and the
   WhatsApp template manager. A rule's Test is a dry run: it counts the real
   audience today and sends nothing. */
(function () {
  'use strict';
  var G = window.GE, V = G.VIEWS, A = G.ACTIONS, esc = G.esc;
  var D = function () { return G.D(); };
  var TIERS = ['Strategic', 'Key account', 'Active', 'Prospect'];

  function trigText(t) {
    var T = GC.TRIGGERS[t.type]; if (!T) return t.type;
    var s = T.label;
    Object.keys(T.cfg).forEach(function (k) { if (t[k] != null && t[k] !== '' && t[k] !== 'any') s += ' ' + t[k] + (k === 'days' ? ' days' : k === 'pct' ? '%' : k === 'hours' ? ' hours' : ''); });
    return s;
  }
  function stepText(x) {
    var a = GC.ACTS[x.type]; if (!a) return x.type;
    if (x.type === 'run_agent') { var ag = AG.agentById(x.agent); return '✦ ' + (ag ? ag.name : 'an agent'); }
    if (x.type === 'wa_template') return a.label + ': ' + (x.template || '—');
    if (x.type === 'notify_role') return 'Notify ' + G.roleName(x.role || 'ops');
    if (x.type === 'wait') return 'Wait ' + (x.hours || 0) + ' hours';
    return a.label + (x.text ? ': ' + x.text : '');
  }

  /* ================= list ================= */

  var AFILT = '';
  V.automations = function () {
    var list = D().automations.filter(function (a) { return !AFILT || GC.autoKind(a) === AFILT; });
    var h = '<div class="ph"><div><h1>Automations</h1><p>When something happens, do something — including running an agent. Anything that reaches a client needs an audience and respects consent and open issues.</p></div>' +
      '<div class="acts"><a class="btn" href="#/automation/new">+ New rule</a></div></div>';
    h += '<div class="row" style="margin-bottom:12px">' + [['', 'All'], ['internal', 'Internal only'], ['client', 'Reaches clients']].map(function (f) { return '<button class="chip" data-act="autoFilter" data-id="' + f[0] + '" aria-pressed="' + (AFILT === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div>';
    h += '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>On</th><th>Rule</th><th>When</th><th>Then</th><th>Reaches</th><th class="num">Runs</th><th></th></tr></thead><tbody>' + list.map(function (a) {
      var k = GC.autoKind(a);
      return '<tr><td><input type="checkbox" data-chg="autoToggle" data-id="' + a.id + '"' + (a.on ? ' checked' : '') + '></td><td><a href="#/automation/' + a.id + '"><b>' + esc(a.name) + '</b></a></td><td class="small">' + esc(trigText(a.trigger)) + '</td>' +
        '<td class="small">' + a.actions.map(function (x) { return esc(stepText(x)); }).join(' → ') + '</td><td>' + (k === 'client' ? G.pill('clients', 'warn') + '<small>' + (a.tiers.join(', ') || '—') + '</small>' : G.pill('internal', 'dim')) + '</td>' +
        '<td class="num">' + (a.runs || 0) + '<small>' + esc(a.last ? G.when(a.last) : 'never') + '</small></td><td><button class="minibtn" data-act="testAuto" data-id="' + a.id + '">Test</button></td></tr>';
    }).join('') + '</tbody></table></div><p class="honest">Run counts on seeded rules are illustrative.</p>';
    return h;
  };

  /* ================= builder ================= */

  var EDIT = null;
  V.automation = function (id) {
    if (!EDIT || EDIT._id !== id) {
      var src = id === 'new' ? { id: GC.uid('a'), name: '', on: true, trigger: { type: 'new_enquiry' }, actions: [{ type: 'run_agent', agent: 'brief' }], tiers: [], sources: [], conds: [], pharmaOnly: false, runs: 0 }
        : D().automations.filter(function (a) { return a.id === id; })[0];
      if (!src) return G.deny('No such rule.', '');
      EDIT = JSON.parse(JSON.stringify(src)); EDIT._id = id;
    }
    var a = EDIT, k = GC.autoKind(a), T = GC.TRIGGERS[a.trigger.type] || { cfg: {} };
    var groups = {};
    Object.keys(GC.TRIGGERS).forEach(function (t) { (groups[GC.TRIGGERS[t].group] = groups[GC.TRIGGERS[t].group] || []).push(t); });
    var h = '<div class="ph"><div><h1>' + (id === 'new' ? 'New rule' : esc(a.name || 'Rule')) + '</h1><p>' + (k === 'client' ? G.pill('Reaches clients', 'warn') + ' Choose who it goes to. Consent and open issues are respected automatically.' : G.pill('Internal only', 'dim') + ' Nothing here reaches a client.') + '</p></div>' +
      '<div class="acts"><button class="btn ghost" data-act="testEdit">Test (dry run)</button><button class="btn" data-act="saveAuto">Save rule</button>' + (id !== 'new' ? '<button class="btn ghost" data-act="deleteAuto">Delete</button>' : '') + '</div></div>';
    h += '<div class="card" style="max-width:900px">' + G.field('Name', '<input data-chg="aName" id="aName" value="' + esc(a.name) + '" placeholder="e.g. Quote unanswered 5 days → nudge">');
    h += '<p class="eyebrow">1 · When</p><div class="row"><select data-chg="aTrig" style="width:auto">' + Object.keys(groups).map(function (g) { return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (t) { return '<option value="' + t + '"' + (a.trigger.type === t ? ' selected' : '') + '>' + esc(GC.TRIGGERS[t].label) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>' +
      Object.keys(T.cfg).map(function (c) {
        var spec = T.cfg[c];
        if (Array.isArray(spec)) return '<select data-chg="aTrigCfg" data-id="' + c + '" style="width:auto">' + spec.map(function (o) { return '<option' + (a.trigger[c] === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>';
        return '<input type="' + (spec === 'time' ? 'time' : 'number') + '" data-chg="aTrigCfg" data-id="' + c + '" value="' + esc(a.trigger[c] == null ? '' : a.trigger[c]) + '" style="width:110px" placeholder="' + c + '">';
      }).join('') + '</div>';
    h += '<p class="eyebrow">2 · Who (only for steps that reach clients)</p><div class="row">' + TIERS.map(function (t) { return '<button class="chip" data-act="aTier" data-id="' + t + '" aria-pressed="' + (a.tiers.indexOf(t) >= 0) + '">' + t + '</button>'; }).join('') +
      '<label class="chk" style="margin-left:8px"><input type="checkbox" data-chg="aPharma"' + (a.pharmaOnly ? ' checked' : '') + '> Pharma clients only</label></div>';
    h += '<p class="eyebrow">3 · Then</p>' + a.actions.map(function (x, i) {
      var cfg = (GC.ACTS[x.type] || { cfg: {} }).cfg;
      return '<div class="row" style="margin-bottom:8px;padding:10px;border:1px solid var(--line);border-radius:12px"><b style="width:22px">' + (i + 1) + '</b><select data-chg="aStep" data-id="' + i + '" style="width:auto">' +
        ['internal', 'client'].map(function (kind) { return '<optgroup label="' + (kind === 'client' ? 'Reaches clients' : 'Internal') + '">' + Object.keys(GC.ACTS).filter(function (t) { return GC.ACTS[t].kind === kind; }).map(function (t) { return '<option value="' + t + '"' + (x.type === t ? ' selected' : '') + '>' + esc(GC.ACTS[t].label) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>' +
        Object.keys(cfg).map(function (c) {
          var sp = cfg[c], v = x[c] == null ? '' : x[c];
          if (sp === 'agent') return '<select data-chg="aStepCfg" data-id="' + i + '|' + c + '" style="width:auto">' + AG.AGENTS.map(function (g) { return '<option value="' + g.id + '"' + (v === g.id ? ' selected' : '') + '>' + g.icon + ' ' + esc(g.name) + '</option>'; }).join('') + '</select>';
          if (sp === 'staff') return '<select data-chg="aStepCfg" data-id="' + i + '|' + c + '" style="width:auto"><option value="owner-of-deal">The account manager</option>' + D().staff.map(function (u) { return '<option value="' + u.id + '"' + (v === u.id ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>';
          if (sp === 'role') return '<select data-chg="aStepCfg" data-id="' + i + '|' + c + '" style="width:auto">' + D().roles.map(function (r) { return '<option value="' + r.id + '"' + (v === r.id ? ' selected' : '') + '>' + esc(r.name) + '</option>'; }).join('') + '</select>';
          if (sp === 'template') return '<select data-chg="aStepCfg" data-id="' + i + '|' + c + '" style="width:auto">' + D().templates.map(function (t) { return '<option value="' + t.key + '"' + (v === t.key ? ' selected' : '') + '>' + esc(t.key) + (t.status !== 'approved' ? ' (' + t.status + ')' : '') + '</option>'; }).join('') + '</select>';
          return '<input ' + (sp === 'number' ? 'type="number" style="width:100px"' : 'style="flex:1;min-width:180px"') + ' data-chg="aStepCfg" data-id="' + i + '|' + c + '" value="' + esc(v) + '" placeholder="' + c.replace(/_/g, ' ') + '">';
        }).join('') + (GC.ACTS[x.type] && GC.ACTS[x.type].kind === 'client' ? G.pill('client', 'warn') : '') +
        '<button class="minibtn" data-act="aStepDel" data-id="' + i + '" style="margin-left:auto">✕</button></div>';
    }).join('') + '<button class="btn ghost sm" data-act="aStepAdd">+ Add a step</button>';
    h += '<p class="honest" style="margin-top:14px">Guardrails that cannot be switched off: no marketing to a company with an open issue or without consent; WhatsApp outside the 24-hour window only with an approved template; anything to a Strategic account waits for a person.</p></div>';
    return h;
  };

  function showTest(a) {
    var r = GC.testAuto(a, D());
    if (r.error) return G.toast(r.error, 'bad');
    G.modal('Dry run — nothing was sent', a.name || 'Rule', '<dl class="kv"><dt>Reaches</dt><dd>' + (r.kind === 'client' ? G.pill('clients', 'warn') : G.pill('internal only', 'dim')) + '</dd>' +
      '<dt>Audience today</dt><dd>' + (r.kind === 'client' ? r.audience + ' companies (consent given, no open issue)' : 'Internal rule — no client audience') + '</dd>' +
      '<dt>Steps</dt><dd>' + r.steps.map(function (s, i) { return (i + 1) + '. ' + esc(s); }).join('<br>') + '</dd><dt>Messages actually sent</dt><dd><b>0</b></dd></dl>');
  }

  /* ================= issues ================= */

  var IF = 'open';
  V.issues = function () {
    var list = D().issues.filter(function (i) { return G.inScope(G.companyById(i.company) || {}) || G.acc().scope !== 'own'; })
      .filter(function (i) { return IF === 'all' || (IF === 'open' ? i.status !== 'resolved' : i.status === 'resolved'); });
    var h = '<div class="ph"><div><h1>Client issues</h1><p>Damaged, short or wrongly branded deliveries. Each has a deadline by severity and a three-step ladder. While one is open, marketing to that client pauses.</p></div></div>';
    h += '<div class="row" style="margin-bottom:12px">' + [['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(function (f) { return '<button class="chip" data-act="issueFilter" data-id="' + f[0] + '" aria-pressed="' + (IF === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div>';
    h += '<div class="card pad0">' + (list.length ? list.map(function (i) {
      var co = G.companyById(i.company), od = G.orderById(i.order), over = GC.issueOverdue(i);
      return '<div class="item" data-act="go" data-id="#/issue/' + i.id + '" style="cursor:pointer"><span class="sev ' + (i.status === 'resolved' ? 'ok' : over ? 'bad' : 'warn') + '"></span><div class="grow"><h4>' + esc(i.kind) + ' · ' + esc(co ? co.name : '') + (od ? ' · ' + esc(od.no) : '') + '</h4><p>' + esc(i.text) + '</p></div>' +
        G.pill(i.severity, i.severity === 'critical' || i.severity === 'high' ? 'bad' : 'warn') + ' ' + G.pill(i.status === 'resolved' ? 'resolved' : over ? 'overdue' : 'due ' + GC.issueDue(i), i.status === 'resolved' ? 'ok' : over ? 'bad' : 'dim') + ' ' + G.pill(GC.LADDER[i.level] || 'Owner', 'info') + '</div>';
    }).join('') : G.empty('No issues here.')) + '</div>';
    return h;
  };
  V.issue = function (id) {
    var i = D().issues.filter(function (x) { return x.id === id; })[0];
    if (!i) return G.deny('No such issue.', '');
    var co = G.companyById(i.company), od = G.orderById(i.order);
    var h = '<div class="ph"><div><p class="muted small"><a href="#/company/' + (co ? co.id : '') + '">' + esc(co ? co.name : '') + '</a>' + (od ? ' · <a href="#/order/' + od.id + '">' + esc(od.no) + '</a>' : '') + ' · opened ' + esc(i.opened) + '</p><h1>' + esc(i.kind) + '</h1>' +
      '<p>' + G.pill(i.severity, 'bad') + ' ' + G.pill(i.status, i.status === 'resolved' ? 'ok' : 'warn') + ' · with ' + esc(GC.LADDER[i.level] || 'Owner') + ' · due ' + esc(GC.issueDue(i)) + (GC.issueOverdue(i) ? ' ' + G.pill('overdue', 'bad') : '') + '</p></div>' +
      (i.status !== 'resolved' ? '<div class="acts"><button class="btn ghost" data-act="issueEscalate" data-id="' + id + '">Escalate</button><button class="btn" data-act="issueResolve" data-id="' + id + '">Resolve</button></div>' : '') + '</div>';
    h += '<div class="split"><div class="card"><h3>What happened</h3><p>' + esc(i.text) + '</p><ul class="timeline">' + i.log.map(function (l) { return '<li><b>' + esc(l.text) + '</b><small>' + esc(l.at) + ' · ' + esc(GC.staffName(l.by)) + '</small></li>'; }).join('') + '</ul>' +
      (i.status !== 'resolved' ? '<form data-submit="issueNote" data-id="' + id + '" class="row" style="margin-top:10px"><input name="text" placeholder="Add a note" style="flex:1"><button class="btn sm">Add</button></form>' : '') + '</div>' +
      '<div class="card"><h3>While this is open</h3><p class="muted">Campaigns and marketing automations skip ' + esc(co ? co.name : 'this client') + '. Service messages — dispatch, delivery, this issue — still go out. Marketing resumes the moment it is resolved.</p></div></div>';
    return h;
  };

  /* ================= templates (a Settings tab) ================= */

  G.SETTINGS.templates = function () {
    var t = D().templates;
    return '<div class="card pad0 scroller"><table class="tbl"><thead><tr><th>Template</th><th>Type</th><th>Text</th><th>Buttons</th><th>Meta status</th></tr></thead><tbody>' + t.map(function (x) {
      return '<tr><td><code>' + esc(x.key) + '</code></td><td>' + esc(x.cat) + '</td><td class="small">' + esc(x.text) + '</td><td class="small">' + esc((x.buttons || []).join(' · ') || '—') + '</td><td>' + G.pill(x.status, x.status === 'approved' ? 'ok' : x.status === 'pending' ? 'warn' : 'bad') + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
      '<form class="card" data-submit="saveTemplate" style="margin-top:16px;max-width:760px"><h3>New template</h3><div class="grid2">' +
      G.field('Name (lowercase, underscores)', '<input name="key" placeholder="e.g. proof_ready" required>') + G.field('Type', '<select name="cat"><option>UTILITY</option><option>MARKETING</option></select>') + '</div>' +
      G.field('Text — use {{1}}, {{2}} for the client name, order number, link…', '<textarea name="text" required></textarea>') +
      G.field('Quick-reply buttons (comma separated, optional)', '<input name="buttons" placeholder="Approve, Request change">') +
      '<button class="btn">Submit to Meta for approval</button><p class="honest">Approval states in the demo are illustrative; in production Meta approves each template, usually within a day.</p></form>';
  };

  /* ================= actions ================= */

  function saveEdit() { var a = D().automations.filter(function (x) { return x.id === EDIT.id; })[0]; var clean = JSON.parse(JSON.stringify(EDIT)); delete clean._id; if (a) Object.assign(a, clean); else D().automations.unshift(clean); }
  Object.assign(A, {
    autoFilter: function (v) { AFILT = v || ''; G.render(); },
    autoToggle: function (v, el) { var a = D().automations.filter(function (x) { return x.id === el.dataset.id; })[0]; a.on = !!v; G.log('auto_toggle', a.name + ' ' + (v ? 'on' : 'off')); G.save(); G.render(); },
    testAuto: function (id) { showTest(D().automations.filter(function (x) { return x.id === id; })[0]); },
    testEdit: function () { showTest(EDIT); },
    aName: function (v) { EDIT.name = v; },
    aTrig: function (v) { EDIT.trigger = { type: v }; G.render(); },
    aTrigCfg: function (v, el) { EDIT.trigger[el.dataset.id] = el.type === 'number' ? +v : v; },
    aTier: function (t) { var i = EDIT.tiers.indexOf(t); if (i >= 0) EDIT.tiers.splice(i, 1); else EDIT.tiers.push(t); G.render(); },
    aPharma: function (v) { EDIT.pharmaOnly = !!v; },
    aStep: function (v, el) { EDIT.actions[+el.dataset.id] = { type: v }; if (v === 'run_agent') EDIT.actions[+el.dataset.id].agent = 'brief'; G.render(); },
    aStepCfg: function (v, el) { var p = el.dataset.id.split('|'); EDIT.actions[+p[0]][p[1]] = el.type === 'number' ? +v : v; },
    aStepAdd: function () { EDIT.actions.push({ type: 'notify_person', who: 'owner-of-deal' }); G.render(); },
    aStepDel: function (i) { EDIT.actions.splice(+i, 1); G.render(); },
    saveAuto: function () {
      var n = document.getElementById('aName'); if (n) EDIT.name = n.value;
      var err = GC.validateAuto(EDIT); if (err) return G.toast(err, 'bad');
      saveEdit(); G.log('auto_save', 'Rule saved: ' + EDIT.name); G.save(); var id = EDIT.id; EDIT = null; G.toast('Saved.'); G.go('#/automations');
    },
    deleteAuto: function () { D().automations = D().automations.filter(function (a) { return a.id !== EDIT.id; }); G.log('auto_save', 'Rule deleted: ' + EDIT.name); EDIT = null; G.save(); G.go('#/automations'); },
    issueFilter: function (v) { IF = v; G.render(); },
    newIssue: function (coId) {
      var ords = D().orders.filter(function (o) { return o.company === coId; });
      G.modal('Log a client issue', G.companyById(coId).name, '<form data-submit="saveIssue" data-id="' + coId + '">' +
        G.field('Order', '<select name="order"><option value="">Not about one order</option>' + ords.map(function (o) { return '<option value="' + o.id + '">' + esc(o.no + ' · ' + o.title) + '</option>'; }).join('') + '</select>') +
        G.field('What kind', '<select name="kind">' + GC.ISSUE_KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select>') +
        G.field('Severity', '<select name="severity">' + Object.keys(GC.SEVERITY).map(function (s) { return '<option value="' + s + '"' + (s === 'high' ? ' selected' : '') + '>' + s + ' — resolve within ' + GC.SEVERITY[s] + ' h</option>'; }).join('') + '</select>') +
        G.field('What happened', '<textarea name="text" required></textarea>') + '<button class="btn">Log issue</button></form>');
    },
    saveIssue: function (f, form) {
      if (!String(f.text || '').trim()) return G.toast('Say what happened.', 'bad');
      var co = G.companyById(form.dataset.id);
      var i = GC.newIssue({ company: co.id, order: f.order || null, kind: f.kind, severity: f.severity, text: f.text, assigned_to: co.assigned_to, log: [{ at: GC.today(), by: G.me().id, text: 'Logged' }] });
      D().issues.unshift(i); G.log('issue', 'Issue logged for ' + co.name + ': ' + f.kind + ' — marketing paused', { company: co.id, order: f.order || null });
      G.save(); G.closeModal(); G.go('#/issue/' + i.id);
    },
    issueNote: function (f, form) { var i = D().issues.filter(function (x) { return x.id === form.dataset.id; })[0]; if (!f.text) return; i.log.push({ at: GC.today(), by: G.me().id, text: f.text }); G.log('issue_edit', 'Note on issue: ' + f.text, { company: i.company }); G.save(); G.render(); },
    issueEscalate: function (id) { var i = D().issues.filter(function (x) { return x.id === id; })[0]; i.level = Math.min(GC.LADDER.length - 1, i.level + 1); i.log.push({ at: GC.today(), by: G.me().id, text: 'Escalated to ' + GC.LADDER[i.level] }); G.log('issue_edit', 'Issue escalated to ' + GC.LADDER[i.level], { company: i.company }); G.save(); G.render(); },
    issueResolve: function (id) {
      var n = arguments[3]; if (n == null) return G.ask('How was it resolved?', 'Marketing to this client resumes once it is resolved.', function (t) { A.issueResolve(id, null, null, t); }); if (!n) return;
      var i = D().issues.filter(function (x) { return x.id === id; })[0]; i.status = 'resolved'; i.resolved = GC.today(); i.log.push({ at: GC.today(), by: G.me().id, text: 'Resolved: ' + n });
      G.log('issue_edit', 'Issue resolved — marketing resumes: ' + n, { company: i.company }); G.save(); G.render();
    },
    saveTemplate: function (f) {
      if (!/^[a-z0-9_]{3,}$/.test(f.key || '')) return G.toast('Name: lowercase letters, numbers and underscores.', 'bad');
      if (D().templates.some(function (t) { return t.key === f.key; })) return G.toast('That name is taken.', 'bad');
      D().templates.push({ key: f.key, cat: f.cat, lang: 'en', status: 'pending', text: f.text, buttons: String(f.buttons || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean) });
      G.log('settings', 'Template submitted to Meta: ' + f.key); G.save(); G.toast('Submitted — pending Meta approval.'); G.render();
    }
  });
})();
