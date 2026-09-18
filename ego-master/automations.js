'use strict';
/* EGO Master — automation builder. Trigger → conditions → actions: the GHL shape the team
   already knows. INTERNAL automations move EGO's own people (notify, task, assign, update);
   EXTERNAL ones reach the dealer or client (WhatsApp, webhook).
   Everything is in memory; a reload resets it. Triggers reference real EGO states only. */

const ORDER_STAGES = [...new Set([...WS_STOCK, ...WS_MOQ])];
const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Dealer Allocated', 'Dealer Accepted', 'Appointment / E-Showroom', 'Site Visit', 'Sample', 'Quote', 'Won', 'Lost'];
const PROJ_STAGES = ['Identified', 'Qualified', 'Specification', 'Sample', 'Quotation', 'Negotiation', 'Approval', 'Won', 'Execution', 'Installation', 'Collection', 'Completed', 'Lost'];
const LEAD_SOURCES = [...new Set(D.lead.map(l => l.source).filter(Boolean))].sort();

// what can start an automation — div says which division it belongs to
const TRIGGERS = {
  order_stage: { label: 'Order reaches a stage', div: 'wholesale', cfg: { stage: ORDER_STAGES } },
  order_created: { label: 'New order is raised', div: 'wholesale' },
  order_credit: { label: 'Order crosses the dealer’s credit limit', div: 'wholesale' },
  dealer_idle: { label: 'Dealer has not ordered in N days', div: 'wholesale', cfg: { days: 'number' } },
  payment_due: { label: 'Dealer payment goes overdue', div: 'wholesale' },
  requirement: { label: 'Requirement changes status', div: 'wholesale', cfg: { status: ['New', 'Quoted', 'Converted', 'Lost'] } },
  visit_logged: { label: 'Field visit is logged', div: 'wholesale', cfg: { purpose: ['Order collection', 'Display check', 'New range intro', 'Payment follow-up', 'Complaint'] } },
  lead_created: { label: 'New lead arrives', div: 'retail', cfg: { source: LEAD_SOURCES } },
  lead_stage: { label: 'Lead moves to a stage', div: 'retail', cfg: { stage: LEAD_STAGES } },
  project_stage: { label: 'Project moves to a stage', div: 'retail', cfg: { stage: PROJ_STAGES } },
  site_step: { label: 'Site reaches a step', div: 'retail', cfg: { step: SITE_STEPS } },
  complaint: { label: 'Complaint changes status', div: 'both', cfg: { status: ['Open', 'In progress', 'Resolved'] } },
  complaint_sla: { label: 'Complaint stays open longer than N hours', div: 'both', cfg: { hours: 'number' } },
  wa_reply: { label: 'WhatsApp reply is received', div: 'both' },
  webhook_in: { label: 'Inbound webhook is received', div: 'both' },
  schedule: { label: 'Every day at a time', div: 'both', cfg: { at: 'time' } },
};
const ACTIONS = {
  notify: { label: 'Notify someone in EGO', kind: 'internal', cfg: { who: 'employee', text: 'text' } },
  task: { label: 'Create a task', kind: 'internal', cfg: { who: 'employee', text: 'text' } },
  assign: { label: 'Assign an owner', kind: 'internal', cfg: { who: 'employee' } },
  update: { label: 'Update a field', kind: 'internal', cfg: { field: 'text', val: 'text' } },
  wait: { label: 'Wait before the next step', kind: 'internal', cfg: { hours: 'number' } },
  wa: { label: 'Send WhatsApp', kind: 'external', cfg: { to: ['Dealer owner', 'Retail client', 'Architect', 'Dealer salesperson'], text: 'text' } },
  webhook: { label: 'Call a webhook', kind: 'external', cfg: { url: 'text', method: ['POST', 'GET'] } },
};
const empOpts = sel => D.employee.map(e => `<option value="${e.id}" ${sel === e.id ? 'selected' : ''}>${esc(e.name)}</option>`).join('');
const waConn = () => (CONN.whatsapp || {}).status === 'connected';

// seeded so the screen shows something real on first open
const emp1 = D.employee[0] && D.employee[0].id;
EM.autos ||= [
  { id: 'aut_1', name: 'Order stuck before dispatch', div: 'wholesale', on: true, runs: 34, last: '2 h ago',
    trigger: { type: 'order_stage', stage: 'Stock checked' },
    conds: [{ f: 'Order value', op: '>', v: '2,00,000' }],
    actions: [{ type: 'wait', hours: 24 }, { type: 'notify', who: emp1, text: 'Order still not allocated after a day' }] },
  { id: 'aut_2', name: 'Dispatch confirmation to the dealer', div: 'wholesale', on: true, runs: 212, last: '18 min ago',
    trigger: { type: 'order_stage', stage: 'Dispatched' }, conds: [],
    actions: [{ type: 'wa', to: 'Dealer owner', text: 'Your order {{order_no}} has been dispatched. {{lines}} designs, ₹{{value}}.' }] },
  { id: 'aut_3', name: 'Dealer gone quiet', div: 'wholesale', on: true, runs: 61, last: 'yesterday',
    trigger: { type: 'dealer_idle', days: 45 }, conds: [{ f: 'Grade', op: 'is', v: 'Platinum' }],
    actions: [{ type: 'task', who: emp1, text: 'Call the dealer — 45 days without an order' }] },
  { id: 'aut_4', name: 'New Meta lead → welcome + call task', div: 'retail', on: true, runs: 148, last: '40 min ago',
    trigger: { type: 'lead_created', source: 'Meta Ads' }, conds: [],
    actions: [{ type: 'wa', to: 'Retail client', text: 'Thanks for your interest in EGO flooring — our team will call you shortly.' }, { type: 'task', who: emp1, text: 'Call the new Meta lead within 15 minutes' }] },
  { id: 'aut_5', name: 'Complaint breaching its deadline', div: 'both', on: false, runs: 0, last: '—',
    trigger: { type: 'complaint_sla', hours: 48 }, conds: [],
    actions: [{ type: 'notify', who: emp1, text: 'Complaint open 48 h — escalating to the Director' }, { type: 'webhook', url: 'https://hooks.egopremium.com/complaint-escalation', method: 'POST' }] },
];
const autoKind = a => a.actions.some(x => ACTIONS[x.type] && ACTIONS[x.type].kind === 'external') ? 'external' : 'internal';
const trigLabel = t => {
  const T = TRIGGERS[t.type]; if (!T) return 'Unknown trigger';
  const extra = ['stage', 'status', 'step', 'source', 'purpose'].map(k => t[k]).find(Boolean);
  return T.label.replace('a stage', `“${extra}”`).replace('a step', `“${extra}”`).replace('status', `status “${extra}”`)
    .replace('N days', `${t.days} days`).replace('N hours', `${t.hours} hours`)
    + (t.type === 'lead_created' && t.source ? ` · ${t.source}` : '');
};
const actLabel = a => {
  const A = ACTIONS[a.type]; if (!A) return '?';
  return a.type === 'wa' ? `WhatsApp → ${a.to}` : a.type === 'webhook' ? `Webhook → ${String(a.url || '').replace(/^https?:\/\//, '').slice(0, 28)}`
    : a.type === 'wait' ? `Wait ${a.hours} h` : a.type === 'notify' ? `Notify ${esc((EMP[a.who] || {}).name || 'someone')}`
      : a.type === 'task' ? `Task → ${esc((EMP[a.who] || {}).name || 'someone')}` : A.label;
};

// ---------------------------------------------------------------- list
EM.VIEWS.automations = () => {
  const mine = EM.autos.filter(a => a.div === 'both' || EM.div === 'both' || a.div === EM.div);
  const card = a => `<div class="card" style="display:grid;gap:10px">
    <div class="row between"><div class="stack-s"><b>${esc(a.name)}</b>
      <div class="small muted">When: ${esc(trigLabel(a.trigger))}</div></div>
      <label class="chip" style="padding:8px 12px;cursor:pointer"><input type="checkbox" data-act="auto-toggle" data-id="${a.id}" ${a.on ? 'checked' : ''}> ${a.on ? 'On' : 'Off'}</label></div>
    <div class="row">${a.conds.map(c => `<span class="chip">${esc(c.f)} ${esc(c.op)} ${esc(c.v)}</span>`).join('')}
      ${a.actions.map(x => `<span class="chip">${actLabel(x)}</span>`).join('')}</div>
    <div class="row between">
      <div class="row"><span class="badge ${autoKind(a) === 'external' ? 'warn' : 'plain'}">${autoKind(a) === 'external' ? 'Reaches the customer' : 'Internal only'}</span>
        <span class="badge plain">${a.div === 'both' ? 'Both divisions' : a.div === 'wholesale' ? 'Wholesale' : 'Retail'}</span>
        <span class="small muted">${a.runs} runs · last ${esc(a.last)}</span></div>
      <div class="row"><button class="btn sm" data-act="auto-test" data-id="${a.id}">Test run</button>
        <a class="btn sm" href="#/automation/${a.id}">Edit</a></div></div></div>`;
  return `<div class="stack">
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">EGO Master</div><h1>Automations</h1>
      <p class="muted" style="max-width:760px">Build your own rules: when something happens, check a condition, then act. Internal actions move your own team; external ones reach the dealer or client over WhatsApp or a webhook.</p></div>
      <a class="btn primary" href="#/automation/new">+ New automation</a></div>
    <div class="grid g4">
      ${stat('Live', EM.autos.filter(a => a.on).length, 'running right now')}
      ${stat('Internal', EM.autos.filter(a => autoKind(a) === 'internal').length, 'notify, task, assign')}
      ${stat('Customer-facing', EM.autos.filter(a => autoKind(a) === 'external').length, 'WhatsApp, webhook')}
      ${stat('Runs (30 d)', EM.autos.reduce((n, a) => n + a.runs, 0), 'across all rules')}</div>
    ${waConn() ? '' : '<div class="callout warn">WhatsApp is not connected, so WhatsApp actions will queue instead of sending. Connect it in Integrations.</div>'}
    <div class="grid g2">${mine.map(card).join('')}</div>
    ${mine.length ? '' : '<div class="card"><p class="muted">No automations in this division yet.</p></div>'}</div>`;
};
EM.VIEWS.automations.title = () => 'Automations';

// ---------------------------------------------------------------- builder
const blank = () => ({ id: 'aut_new' + EM.tick, name: '', div: EM.div === 'both' ? 'wholesale' : EM.div, on: false, runs: 0, last: '—', trigger: { type: 'order_stage', stage: ORDER_STAGES[1] }, conds: [], actions: [{ type: 'notify', who: emp1, text: '' }] });
EM.VIEWS.automation = id => {
  const existing = EM.autos.find(a => a.id === id);
  const a = EM.autoDraft && EM.autoDraft.id === (existing ? id : 'new') ? EM.autoDraft : (EM.autoDraft = existing ? JSON.parse(JSON.stringify(existing)) : Object.assign(blank(), { id: 'new' }));
  const T = TRIGGERS[a.trigger.type] || {};
  const cfgRow = (k, spec) => {
    const val = a.trigger[k] ?? '';
    if (Array.isArray(spec)) return `<label class="field"><span class="small muted">${k[0].toUpperCase() + k.slice(1)}</span><select class="input" data-tcfg="${k}">${spec.map(o => `<option ${val === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
    return `<label class="field"><span class="small muted">${k[0].toUpperCase() + k.slice(1)}</span><input class="input" type="${spec === 'number' ? 'number' : spec === 'time' ? 'time' : 'text'}" data-tcfg="${k}" value="${esc(val)}"></label>`;
  };
  const actRow = (x, i) => {
    const A = ACTIONS[x.type], cfg = A ? A.cfg : {};
    const f = (k, spec) => Array.isArray(spec)
      ? `<label class="field"><span class="small muted">${k}</span><select class="input" data-acfg="${i}|${k}">${spec.map(o => `<option ${x[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`
      : spec === 'employee' ? `<label class="field"><span class="small muted">who</span><select class="input" data-acfg="${i}|who">${empOpts(x.who)}</select></label>`
        : `<label class="field grow"><span class="small muted">${k}</span><input class="input" type="${spec === 'number' ? 'number' : 'text'}" data-acfg="${i}|${k}" value="${esc(x[k] ?? '')}"></label>`;
    return `<div class="card" style="background:var(--ge-surface-2);border:0">
      <div class="row between"><label class="field" style="min-width:230px"><span class="small muted">Action ${i + 1}</span>
        <select class="input" data-achange="${i}">${Object.entries(ACTIONS).map(([k, v]) => `<option value="${k}" ${x.type === k ? 'selected' : ''}>${v.label}${v.kind === 'external' ? ' · customer-facing' : ''}</option>`).join('')}</select></label>
        <button class="btn sm" data-act="auto-actdel" data-id="${i}">Remove</button></div>
      <div class="row" style="margin-top:10px">${Object.entries(cfg).filter(([k]) => k !== 'who' || true).map(([k, spec]) => f(k, spec)).join('')}</div></div>`;
  };
  return `<div class="stack">${crumbs(['Automations', '#/automations'], [existing ? a.name || 'Automation' : 'New automation'])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${existing ? 'Edit automation' : 'New automation'}</h1>
      <p class="muted">When the trigger fires, every condition must be true, then the actions run in order.</p></div>
      <div class="row">${existing ? `<button class="btn" data-act="auto-del" data-id="${a.id}">Delete</button>` : ''}
        <button class="btn primary" data-act="auto-save">${existing ? 'Save changes' : 'Create automation'}</button></div></div>
    <div class="card"><div class="row">
      <label class="field grow" style="min-width:260px"><span class="small muted">Name *</span><input class="input" id="au-name" value="${esc(a.name)}" placeholder="e.g. Dispatch confirmation to the dealer"></label>
      <label class="field"><span class="small muted">Division</span><select class="input" id="au-div">${[['wholesale', 'Wholesale · EGO'], ['retail', 'Retail · Big E'], ['both', 'Both']].map(([k, l]) => `<option value="${k}" ${a.div === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    </div><div class="small muted" id="au-err" style="color:var(--bad);min-height:18px"></div></div>

    <div class="card"><h3>1 · When this happens</h3><div class="row" style="margin-top:10px">
      <label class="field grow" style="min-width:280px"><span class="small muted">Trigger</span>
        <select class="input" id="au-trig">${Object.entries(TRIGGERS).filter(([, v]) => v.div === 'both' || v.div === a.div || a.div === 'both').map(([k, v]) => `<option value="${k}" ${a.trigger.type === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
      ${Object.entries(T.cfg || {}).map(([k, spec]) => cfgRow(k, spec)).join('')}</div>
      ${a.trigger.type === 'webhook_in' ? `<div class="copyrow" style="margin-top:10px"><input class="input mono" readonly value="https://hooks.egopremium.com/in/${a.id}"><button class="btn" data-act="auto-copy">Copy</button></div>
        <p class="small muted" style="margin-top:6px">Point any outside system at this URL. Whatever it posts becomes available to the actions below.</p>` : ''}</div>

    <div class="card"><div class="row between"><h3>2 · Only if</h3><button class="btn sm" data-act="auto-conadd">+ Add condition</button></div>
      ${a.conds.length ? `<div class="stack-s" style="margin-top:10px">${a.conds.map((c, i) => `<div class="row">
        <input class="input grow" data-ccfg="${i}|f" value="${esc(c.f)}" placeholder="Field, e.g. Grade">
        <select class="input" style="max-width:110px" data-ccfg="${i}|op">${['is', 'is not', '>', '<'].map(o => `<option ${c.op === o ? 'selected' : ''}>${o}</option>`).join('')}</select>
        <input class="input grow" data-ccfg="${i}|v" value="${esc(c.v)}" placeholder="Value">
        <button class="btn sm" data-act="auto-condel" data-id="${i}">Remove</button></div>`).join('')}</div>`
      : '<p class="small muted" style="margin-top:8px">No conditions — the automation runs every time the trigger fires.</p>'}</div>

    <div class="card"><div class="row between"><h3>3 · Then do this</h3><button class="btn sm" data-act="auto-actadd">+ Add action</button></div>
      <div class="stack-s" style="margin-top:10px">${a.actions.map(actRow).join('')}</div>
      <p class="small muted" style="margin-top:10px">Actions marked <b>customer-facing</b> leave EGO — they reach the dealer or client. Everything else stays inside your team.</p></div></div>`;
};
EM.VIEWS.automation.title = a => (EM.autos.find(x => x.id === a) || { name: 'New automation' }).name;

// ---------------------------------------------------------------- actions
const draft = () => EM.autoDraft;
EM.ACTIONS['auto-toggle'] = el => { const a = EM.autos.find(x => x.id === el.dataset.id); a.on = !a.on; EM.toast(`<b>${esc(a.name)} ${a.on ? 'switched on' : 'paused'}</b>`); EM.rerender(); };
EM.ACTIONS['auto-conadd'] = () => { draft().conds.push({ f: '', op: 'is', v: '' }); EM.rerender(); };
EM.ACTIONS['auto-condel'] = el => { draft().conds.splice(+el.dataset.id, 1); EM.rerender(); };
EM.ACTIONS['auto-actadd'] = () => { draft().actions.push({ type: 'notify', who: emp1, text: '' }); EM.rerender(); };
EM.ACTIONS['auto-actdel'] = el => { if (draft().actions.length > 1) { draft().actions.splice(+el.dataset.id, 1); EM.rerender(); } };
EM.ACTIONS['auto-copy'] = () => EM.toast('<b>Webhook URL copied</b><ul><li>Paste it into the system that should trigger this automation.</li></ul>');
EM.ACTIONS['auto-del'] = el => { EM.autos = EM.autos.filter(a => a.id !== el.dataset.id); EM.autoDraft = null; EM.toast('<b>Automation deleted</b>'); location.hash = '#/automations'; };
EM.ACTIONS['auto-save'] = () => {
  const a = draft(), name = (qs('#au-name').value || '').trim();
  if (!name) { qs('#au-err').textContent = 'Give the automation a name.'; return; }
  if (a.actions.some(x => x.type === 'webhook' && !/^https?:\/\//.test(x.url || ''))) { qs('#au-err').textContent = 'A webhook action needs a full URL starting with https://'; return; }
  a.name = name; a.div = qs('#au-div').value;
  const existing = EM.autos.find(x => x.id === a.id);
  if (existing) Object.assign(existing, a);
  else { a.id = 'aut_new' + EM.tick; a.on = true; EM.autos.push(a); }
  EM.autoDraft = null;
  const ext = autoKind(a) === 'external';
  EM.toast(`<b>${esc(name)} saved</b><ul><li>When: ${esc(trigLabel(a.trigger))}</li><li>${a.actions.length} action${a.actions.length > 1 ? 's' : ''} · ${ext ? 'reaches the customer' : 'internal only'}</li>${ext && !waConn() ? '<li>WhatsApp is not connected yet — sends will queue</li>' : ''}</ul>`);
  location.hash = '#/automations';
};
EM.ACTIONS['auto-test'] = el => {
  const a = EM.autos.find(x => x.id === el.dataset.id);
  const steps = a.actions.map(x => `<li>${actLabel(x)}${x.text ? ` — “${esc(String(x.text).slice(0, 60))}”` : ''}</li>`).join('');
  EM.toast(`<b>Test run · ${esc(a.name)}</b><ul><li>Trigger: ${esc(trigLabel(a.trigger))}</li>${a.conds.length ? `<li>Conditions: ${a.conds.map(c => esc(`${c.f} ${c.op} ${c.v}`)).join(', ')}</li>` : ''}${steps}<li>Nothing was really sent — this is a dry run.</li></ul>`, 7000);
};
document.addEventListener('change', e => {
  const t = e.target, d = draft();
  if (!d) return;
  if (t.id === 'au-name') d.name = t.value;
  // division decides which triggers are offered, so re-render to re-filter the list
  if (t.id === 'au-div') { d.div = t.value; if (!TRIGGERS[d.trigger.type] || !(TRIGGERS[d.trigger.type].div === 'both' || d.div === 'both' || TRIGGERS[d.trigger.type].div === d.div)) d.trigger = { type: 'complaint', status: 'Open' }; EM.rerender(); }
  // sensible starting numbers per unit — a "not ordered in N days" rule defaulting to 24 reads wrong
  if (t.id === 'au-trig') { d.trigger = { type: t.value }; const c = TRIGGERS[t.value].cfg || {}; Object.entries(c).forEach(([k, s]) => { d.trigger[k] = Array.isArray(s) ? s[0] : s === 'number' ? (k === 'days' ? 45 : 48) : ''; }); EM.rerender(); }
  if (t.dataset.tcfg) { d.trigger[t.dataset.tcfg] = t.value; EM.rerender(); }
  if (t.dataset.achange) { const i = +t.dataset.achange; d.actions[i] = { type: t.value }; const c = ACTIONS[t.value].cfg; Object.entries(c).forEach(([k, s]) => { d.actions[i][k] = Array.isArray(s) ? s[0] : s === 'employee' ? emp1 : ''; }); EM.rerender(); }
  if (t.dataset.acfg) { const [i, k] = t.dataset.acfg.split('|'); d.actions[+i][k] = t.value; }
  if (t.dataset.ccfg) { const [i, k] = t.dataset.ccfg.split('|'); d.conds[+i][k] = t.value; }
});
document.addEventListener('input', e => {
  const t = e.target, d = draft();
  if (!d) return;
  // the name must live on the draft: adding an action or switching the trigger re-renders
  // the whole form, and anything held only in the DOM would be wiped mid-edit
  if (t.id === 'au-name') d.name = t.value;
  if (t.dataset.acfg) { const [i, k] = t.dataset.acfg.split('|'); d.actions[+i][k] = t.value; }
  if (t.dataset.ccfg) { const [i, k] = t.dataset.ccfg.split('|'); d.conds[+i][k] = t.value; }
});
