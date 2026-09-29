'use strict';
/* Automations (D31) — the GHL shape the team already knows: Audience → When → Only if → Then.
   INTERNAL actions move Vaarahi's own people (notify, follow-up, assign); CLIENT-FACING ones
   reach the client over WhatsApp. Tier is a first-class audience filter, because a VIP rule and
   a regular-client rule are not the same rule. Everything is in memory; a reload resets it. */

const COLLECTIONS = [...new Set(D.products.map(p => p.collection))].sort();
const TIERS = ['vip', 'premium', 'regular', 'prospect'];

// what can start an automation
const TRIGGERS = {
  birthday: { label: 'Birthday is coming up', cfg: { days_before: 'number' }, group: 'Dates & family' },
  anniversary: { label: 'Wedding anniversary is coming up', cfg: { days_before: 'number' }, group: 'Dates & family' },
  family_event: { label: 'Family event is coming up', cfg: { event: ['wedding', 'engagement', 'half-saree ceremony', 'any'], days_before: 'number' }, group: 'Dates & family' },
  family_added: { label: 'A family member is linked', group: 'Dates & family' },
  visit_end: { label: 'A shop-floor visit ends', cfg: { outcome: ['bought something', 'left without buying', 'any'] }, group: 'Shop floor' },
  liked_not_bought: { label: 'Liked in store but not bought for N days', cfg: { days: 'number' }, group: 'Shop floor' },
  appointment: { label: 'Appointment is booked / missed', cfg: { state: ['booked', 'came in', 'no-show'] }, group: 'Shop floor' },
  purchase: { label: 'A purchase is billed', cfg: { min_value: 'number' }, group: 'Buying' },
  nth_purchase: { label: 'Client reaches their Nth purchase', cfg: { n: 'number' }, group: 'Buying' },
  tier_change: { label: 'Client moves to a tier', cfg: { to: ['VIP', 'Premium', 'Regular'] }, group: 'Buying' },
  no_purchase: { label: 'No purchase for N days', cfg: { days: 'number' }, group: 'Buying' },
  wishlist_in: { label: 'A piece on their waiting list arrives', group: 'Stock & catalogue' },
  new_design: { label: 'A new design is added in a collection they like', cfg: { collection: ['any', ...COLLECTIONS] }, group: 'Stock & catalogue' },
  low_stock: { label: 'A design drops below N pieces', cfg: { pieces: 'number' }, group: 'Stock & catalogue' },
  complaint: { label: 'A complaint changes status', cfg: { status: ['opened', 'resolved'] }, group: 'Care' },
  complaint_sla: { label: 'A complaint stays open past its deadline', group: 'Care' },
  wa_reply: { label: 'A WhatsApp message arrives', group: 'Care' },
  behind_target: { label: 'A branch is behind target by N%', cfg: { pct: 'number' }, group: 'Team' },
  schedule: { label: 'Every day at a time', cfg: { at: 'time' }, group: 'Team' },
};
const ACTS = {
  notify_person: { label: 'Notify one person', kind: 'internal', cfg: { who: 'employee', text: 'text' } },
  notify_role: { label: 'Notify everyone in a role', kind: 'internal', cfg: { role: 'role', text: 'text' } },
  followup: { label: "Follow-up on the client's Sales staff list", kind: 'internal', cfg: { action: ['Call', 'WhatsApp', 'Invite in', 'Share designs'], due_in_days: 'number', text: 'text' } },
  assign: { label: 'Assign the client to someone', kind: 'internal', cfg: { who: 'employee' } },
  wait: { label: 'Wait before the next step', kind: 'internal', cfg: { hours: 'number' } },
  wa_template: { label: 'Send a WhatsApp template', kind: 'client', cfg: { template: 'template' } },
  wa_text: { label: 'Send a WhatsApp message (inside 24 hours)', kind: 'client', cfg: { text: 'text' } },
  audience: { label: 'Add to a campaign audience', kind: 'client', cfg: { name: 'text' } },
};
const AUTO_KIND = a => a.actions.some(x => (ACTS[x.type] || {}).kind === 'client') ? 'client' : 'internal';
const roleOpts = sel => D.roles.filter(r => r.id !== 'role_admin').map(r => `<option value="${r.id}" ${sel === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
const empOpts2 = sel => active().slice(0, 40).map(e => `<option value="${e.id}" ${sel === e.id ? 'selected' : ''}>${esc(e.name)} · ${esc(e.title)}</option>`).join('');
const tplOpts2 = sel => D.templates.map(t => `<option value="${t.id}" ${sel === t.id ? 'selected' : ''}>${esc(t.title)} · ${t.category === 'utility' ? 'service' : 'marketing'}</option>`).join('');

const hero = D.story.hero_advisor_id, mgr = S.JBH.manager_id;
let AUTOS = [
  { id: 'aut_1', name: 'Birthday wishes — VIP & Premium', on: true, runs: 46, last: 'today', tiers: ['vip', 'premium'], branch: 'all', likes: 'any',
    trigger: { type: 'birthday', days_before: 3 }, conds: [],
    actions: [{ type: 'notify_person', who: hero, text: 'Her birthday is in 3 days — call her, then send the greeting' }, { type: 'wa_template', template: 'tpl_birthday' }] },
  { id: 'aut_2', name: 'Anniversary — offer a matching piece', on: true, runs: 31, last: 'yesterday', tiers: ['vip', 'premium', 'regular'], branch: 'all', likes: 'any',
    trigger: { type: 'anniversary', days_before: 10 }, conds: [],
    actions: [{ type: 'followup', action: 'WhatsApp', due_in_days: 0, text: 'Anniversary in 10 days — share 3 pieces in her colours' }] },
  { id: 'aut_3', name: 'Liked in store, not bought', on: true, runs: 128, last: '2 h ago', tiers: ['vip', 'premium', 'regular'], branch: 'all', likes: 'any',
    trigger: { type: 'liked_not_bought', days: 3 }, conds: [],
    actions: [{ type: 'followup', action: 'Share designs', due_in_days: 0, text: 'Send photos of the pieces she liked but did not take' }] },
  { id: 'aut_4', name: 'The piece she waited for has arrived', on: true, runs: 19, last: '3 d ago', tiers: ['vip', 'premium', 'regular', 'prospect'], branch: 'all', likes: 'any',
    trigger: { type: 'wishlist_in' }, conds: [],
    actions: [{ type: 'notify_person', who: hero, text: 'Her waiting-list piece is in stock — hold it for 48 hours' }, { type: 'wa_template', template: 'tpl_back_in_stock' }] },
  { id: 'aut_5', name: 'New Kanchi arrivals → clients who love Kanchi', on: true, runs: 7, last: 'a week ago', tiers: ['vip', 'premium'], branch: 'all', likes: 'Kanchi Pattu',
    trigger: { type: 'new_design', collection: 'Kanchi Pattu' }, conds: [{ f: 'Spent in 12 months', op: '>', v: '2,50,000' }],
    actions: [{ type: 'wait', hours: 24 }, { type: 'wa_template', template: 'tpl_new_arrivals' }] },
  { id: 'aut_6', name: 'Thank you + silk care after a purchase', on: true, runs: 402, last: '20 min ago', tiers: ['vip', 'premium', 'regular', 'prospect'], branch: 'all', likes: 'any',
    trigger: { type: 'purchase', min_value: 0 }, conds: [],
    actions: [{ type: 'wait', hours: 2 }, { type: 'wa_template', template: 'tpl_thanks_invoice' }] },
  { id: 'aut_7', name: 'Fifth purchase — a note from the director', on: true, runs: 12, last: '5 d ago', tiers: ['vip', 'premium', 'regular'], branch: 'all', likes: 'any',
    trigger: { type: 'nth_purchase', n: 5 }, conds: [],
    actions: [{ type: 'notify_role', role: 'role_owner', text: 'A client just made her 5th purchase — worth a personal note' }, { type: 'wa_text', text: 'Thank you for choosing Vaarahi for the fifth time 🌸 It means a great deal to our family.' }] },
  { id: 'aut_8', name: 'Quiet for six months', on: true, runs: 88, last: 'today', tiers: ['regular'], branch: 'all', likes: 'any',
    trigger: { type: 'no_purchase', days: 180 }, conds: [],
    actions: [{ type: 'followup', action: 'Call', due_in_days: 1, text: 'No purchase in 6 months — call before sending anything' }] },
  { id: 'aut_9', name: 'Complaint past its deadline', on: true, runs: 4, last: '22 h ago', tiers: ['vip', 'premium', 'regular', 'prospect'], branch: 'all', likes: 'any',
    trigger: { type: 'complaint_sla' }, conds: [],
    actions: [{ type: 'notify_role', role: 'role_regional_head', text: 'A complaint has passed its deadline — please step in' }] },
  { id: 'aut_10', name: 'Low stock on a fast design', on: true, runs: 23, last: 'yesterday', tiers: [], branch: 'all', likes: 'any',
    trigger: { type: 'low_stock', pieces: 2 }, conds: [],
    actions: [{ type: 'notify_role', role: 'role_inventory', text: 'Down to 2 pieces — reorder or move stock between branches' }] },
  { id: 'aut_11', name: "Daughter's wedding — invite for a private viewing", on: true, runs: 9, last: '4 d ago', tiers: ['vip', 'premium'], branch: 'all', likes: 'any',
    trigger: { type: 'family_event', event: 'wedding', days_before: 60 }, conds: [],
    actions: [{ type: 'notify_person', who: hero, text: 'Wedding in the family in 2 months — invite her for a private viewing' }, { type: 'wa_template', template: 'tpl_event' }] },
  { id: 'aut_12', name: 'Left without buying today', on: false, runs: 0, last: '—', tiers: ['vip', 'premium', 'regular', 'prospect'], branch: 'all', likes: 'any',
    trigger: { type: 'visit_end', outcome: 'left without buying' }, conds: [],
    actions: [{ type: 'wait', hours: 3 }, { type: 'wa_text', text: 'Thank you for visiting us today 🌸 Shall I keep the two you liked aside for the weekend?' }] },
];

const tierChip = t => `<span class="chip ${t === 'vip' ? 'vip' : t === 'premium' ? 'premium' : ''}">${TIER[t]}</span>`;
const audienceLine = a => a.tiers.length === 0 ? 'Internal — no client audience'
  : (a.tiers.length === 4 ? 'All clients' : a.tiers.map(t => TIER[t]).join(' + '))
  + (a.branch !== 'all' ? ` · ${storeName(a.branch)}` : '') + (a.likes !== 'any' ? ` · likes ${a.likes}` : '');
function trigLabel(t) {
  const T = TRIGGERS[t.type];
  if (!T) return 'Unknown trigger';
  return T.label.replace('N days', `${t.days} days`).replace('N pieces', `${t.pieces} pieces`).replace('N%', `${t.pct}%`).replace('Nth', `${t.n}th`)
    + (t.days_before != null ? ` · ${t.days_before} days before` : '') + (t.collection && t.collection !== 'any' ? ` · ${t.collection}` : '')
    + (t.event && t.event !== 'any' ? ` · ${t.event}` : '') + (t.outcome && t.outcome !== 'any' ? ` · ${t.outcome}` : '')
    + (t.status ? ` · ${t.status}` : '') + (t.state ? ` · ${t.state}` : '') + (t.to ? ` · ${t.to}` : '') + (t.at ? ` · ${t.at}` : '');
}
const tplTitle = id => (D.templates.find(t => t.id === id) || {}).title || 'a template';
function actLabel(x) {
  const A = ACTS[x.type];
  if (!A) return '?';
  return x.type === 'notify_person' ? `Notify ${esc((E[x.who] || {}).name || 'someone')}`
    : x.type === 'notify_role' ? `Notify all ${esc(roleName(x.role))}`
    : x.type === 'followup' ? `Follow-up: ${esc(x.action)}`
    : x.type === 'assign' ? `Assign to ${esc((E[x.who] || {}).name || 'someone')}`
    : x.type === 'wait' ? `Wait ${x.hours} h`
    : x.type === 'wa_template' ? `WhatsApp: ${esc(tplTitle(x.template))}`
    : x.type === 'wa_text' ? 'WhatsApp message' : `Audience: ${esc(x.name || 'campaign')}`;
}
const canBuild = () => (SETTINGS.access[me().role] || {}).automations;

// ---------------------------------------------------------------- list
let autoFilter = 'all';
VIEWS.automations = () => {
  if (!canBuild()) return '<div class="card"><h3>Automations are set up by the director</h3><p class="why">Your role can see the results, not the rules. The director can change that in Settings → Roles & access.</p></div>';
  const f = autoFilter, list = AUTOS.filter(a => f === 'all' || (f === 'internal' && AUTO_KIND(a) === 'internal') || (f === 'client' && AUTO_KIND(a) === 'client') || (f === 'vip' && a.tiers.includes('vip') && !a.tiers.includes('regular')));
  const card = a => `<div class="card auto ${a.on ? '' : 'off'}">
    <div class="row-flex" style="justify-content:space-between;align-items:flex-start">
      <div class="grow"><b>${esc(a.name)}</b><div class="why" style="margin-top:2px">When: ${esc(trigLabel(a.trigger))}</div></div>
      <label class="chip on" style="cursor:pointer"><input type="checkbox" data-act="auto-toggle" data-id="${a.id}" ${a.on ? 'checked' : ''}> ${a.on ? 'On' : 'Off'}</label></div>
    <div class="chips" style="margin:10px 0">${a.tiers.length ? a.tiers.map(tierChip).join('') : '<span class="chip">Internal only</span>'}
      ${a.branch !== 'all' ? `<span class="chip">${esc(storeName(a.branch))}</span>` : ''}${a.likes !== 'any' ? `<span class="chip">likes ${esc(a.likes)}</span>` : ''}</div>
    <div class="chips">${a.conds.map(c => `<span class="chip">${esc(c.f)} ${esc(c.op)} ${esc(c.v)}</span>`).join('')}${a.actions.map(x => `<span class="chip ${ACTS[x.type] && ACTS[x.type].kind === 'client' ? 'warn' : ''}">${actLabel(x)}</span>`).join('')}</div>
    <div class="row-flex" style="justify-content:space-between;margin-top:12px">
      <span class="small muted">${AUTO_KIND(a) === 'client' ? 'Reaches the client' : 'Internal only'} · ${a.runs} runs · last ${esc(a.last)}</span>
      <div class="actbar"><button class="btn sm ghost" data-act="auto-test" data-id="${a.id}">Test</button><a class="btn sm" href="#/automation/${a.id}">Edit</a></div></div></div>`;
  const live = AUTOS.filter(a => a.on);
  return `<div class="stack">
    <div class="page-h" style="margin-bottom:0"><div><div class="kicker">WhatsApp & team automations</div><h1>Automations</h1>
      <p class="help" style="max-width:820px;margin-top:6px">When something happens, check who it applies to, then act. <b>Internal</b> actions move your own team — a notification, a follow-up, an escalation. <b>Client-facing</b> ones go out on WhatsApp. VIP and Premium rules are separate from regular ones, because they should be.</p></div>
      <a class="btn primary" href="#/automation/new">+ New automation</a></div>
    <div class="grid g4">
      <div class="card wash stat"><div class="kicker">Live</div><div class="v">${live.length}</div><div class="d">of ${AUTOS.length} rules</div></div>
      <div class="card stat"><div class="kicker">Internal</div><div class="v">${AUTOS.filter(a => AUTO_KIND(a) === 'internal').length}</div><div class="d">notify · follow-up · escalate</div></div>
      <div class="card stat"><div class="kicker">Client-facing</div><div class="v">${AUTOS.filter(a => AUTO_KIND(a) === 'client').length}</div><div class="d">WhatsApp, with the rules below</div></div>
      <div class="card stat"><div class="kicker">Runs (30 days)</div><div class="v">${AUTOS.reduce((n, a) => n + a.runs, 0).toLocaleString('en-IN')}</div><div class="d">across every rule</div></div></div>
    <div class="card gold"><b>The guardrails apply to every rule</b><ul class="clean">
      <li>Marketing never goes to a client with an open complaint, or without WhatsApp consent — service messages still do.</li>
      <li>Outside WhatsApp's 24-hour window only an approved template can be sent; the rule picks one.</li>
      <li>Anything addressed to a VIP waits for a person to approve it.</li></ul></div>
    <div class="tabs-inline">${[['all', 'All'], ['internal', 'Internal'], ['client', 'Client-facing'], ['vip', 'VIP & Premium only']].map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-act="auto-filter" data-id="${k}">${l}</button>`).join('')}</div>
    <div class="grid g2">${list.map(card).join('') || '<div class="card empty">No automations match this filter.</div>'}</div>
  </div>`;
};

// ---------------------------------------------------------------- builder
let draft = null;
const blankAuto = () => ({ id: 'new', name: '', on: false, runs: 0, last: '—', tiers: ['vip', 'premium'], branch: 'all', likes: 'any',
  trigger: { type: 'birthday', days_before: 3 }, conds: [], actions: [{ type: 'notify_person', who: hero, text: '' }] });
VIEWS.automation = id => {
  if (!canBuild()) return '<div class="card"><h3>Automations are set up by the director</h3></div>';
  const existing = AUTOS.find(a => a.id === id);
  if (!draft || draft.id !== (existing ? id : 'new')) draft = existing ? JSON.parse(JSON.stringify(existing)) : blankAuto();
  const a = draft, T = TRIGGERS[a.trigger.type] || {};
  const cfgField = (k, spec, val, attr) => Array.isArray(spec)
    ? `<div class="field"><label>${k.replace(/_/g, ' ')}</label><select class="in" ${attr}>${spec.map(o => `<option ${String(val) === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`
    : spec === 'employee' ? `<div class="field"><label>who</label><select class="in" ${attr}>${empOpts2(val)}</select></div>`
    : spec === 'role' ? `<div class="field"><label>role</label><select class="in" ${attr}>${roleOpts(val)}</select></div>`
    : spec === 'template' ? `<div class="field grow"><label>template</label><select class="in" ${attr}>${tplOpts2(val)}</select></div>`
    : `<div class="field ${spec === 'text' ? 'grow' : ''}"><label>${k.replace(/_/g, ' ')}</label><input class="in" type="${spec === 'number' ? 'number' : spec === 'time' ? 'time' : 'text'}" ${attr} value="${esc(val ?? '')}"></div>`;
  const actRow = (x, i) => `<div class="card" style="box-shadow:none;background:#F7F9F8">
    <div class="row-flex" style="justify-content:space-between"><div class="field grow" style="min-width:260px"><label>Step ${i + 1}</label>
      <select class="in" data-achange="${i}">${['internal', 'client'].map(kind => `<optgroup label="${kind === 'internal' ? 'Internal — your team' : 'Client-facing — WhatsApp'}">${Object.entries(ACTS).filter(([, v]) => v.kind === kind).map(([k, v]) => `<option value="${k}" ${x.type === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</optgroup>`).join('')}</select></div>
      <button class="btn sm ghost" data-act="auto-actdel" data-id="${i}">Remove</button></div>
    <div class="row-flex" style="margin-top:10px;align-items:flex-end">${Object.entries(ACTS[x.type].cfg).map(([k, spec]) => cfgField(k, spec, x[k], `data-acfg="${i}|${k}"`)).join('')}</div></div>`;
  const kind = AUTO_KIND(a);
  return `<div class="stack">
    <a class="small muted" href="#/automations">← Automations</a>
    <div class="page-h" style="margin:0"><div><h1>${existing ? 'Edit automation' : 'New automation'}</h1>
      <p class="help" style="margin-top:6px">When the trigger fires, the audience and conditions are checked, then the steps run in order.</p></div>
      <div class="actbar">${existing ? `<button class="btn ghost" data-act="auto-del" data-id="${a.id}">Delete</button>` : ''}<button class="btn primary" data-act="auto-save">${existing ? 'Save changes' : 'Create automation'}</button></div></div>
    <div class="card"><div class="field"><label>Name *</label><input class="in" id="au-name" value="${esc(a.name)}" placeholder="e.g. Birthday wishes — VIP & Premium"></div><div id="ferr" class="errbox"></div></div>

    <div class="card"><h3>1 · Who it applies to</h3>
      <div class="field" style="margin-top:12px"><label>Client tiers</label><div class="chips">${TIERS.map(t => `<label class="chip on"><input type="checkbox" data-tier="${t}" ${a.tiers.includes(t) ? 'checked' : ''}> ${TIER[t]}</label>`).join('')}
        <label class="chip on"><input type="checkbox" data-tier="none" ${a.tiers.length === 0 ? 'checked' : ''}> Internal only — no client audience</label></div>
        <div class="hint">A VIP rule and a regular-client rule are rarely the same rule. Untick everything for a rule that only moves your team.</div></div>
      <div class="two" style="margin-top:14px"><div class="field"><label>Branch</label><select class="in" id="au-branch"><option value="all" ${a.branch === 'all' ? 'selected' : ''}>All branches</option>${D.stores.map(s => `<option value="${s.code}" ${a.branch === s.code ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Only clients interested in</label><select class="in" id="au-likes"><option value="any" ${a.likes === 'any' ? 'selected' : ''}>Anything</option>${COLLECTIONS.map(c => `<option ${a.likes === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div></div></div>

    <div class="card"><h3>2 · When this happens</h3>
      <div class="row-flex" style="margin-top:12px;align-items:flex-end"><div class="field grow" style="min-width:300px"><label>Trigger</label>
        <select class="in" id="au-trig">${[...new Set(Object.values(TRIGGERS).map(t => t.group))].map(g => `<optgroup label="${g}">${Object.entries(TRIGGERS).filter(([, v]) => v.group === g).map(([k, v]) => `<option value="${k}" ${a.trigger.type === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</optgroup>`).join('')}</select></div>
        ${Object.entries(T.cfg || {}).map(([k, spec]) => cfgField(k, spec, a.trigger[k], `data-tcfg="${k}"`)).join('')}</div></div>

    <div class="card"><div class="row-flex" style="justify-content:space-between"><h3>3 · Only if</h3><button class="btn sm" data-act="auto-conadd">+ Add condition</button></div>
      ${a.conds.length ? `<div class="list" style="margin-top:10px">${a.conds.map((c, i) => `<div class="row"><input class="in grow" data-ccfg="${i}|f" value="${esc(c.f)}" placeholder="e.g. Spent in 12 months" list="cfields">
        <select class="in" style="width:110px" data-ccfg="${i}|op">${['is', 'is not', '>', '<'].map(o => `<option ${c.op === o ? 'selected' : ''}>${o}</option>`).join('')}</select>
        <input class="in grow" data-ccfg="${i}|v" value="${esc(c.v)}" placeholder="Value">
        <button class="btn sm ghost" data-act="auto-condel" data-id="${i}">Remove</button></div>`).join('')}</div>
        <datalist id="cfields">${['Spent in 12 months', 'Purchases', 'Last purchase (days)', 'Branch', 'Family size', 'Owns', 'Source', 'Language'].map(o => `<option value="${o}">`).join('')}</datalist>`
      : '<p class="help" style="margin-top:8px">No conditions — it runs for everyone in the audience above.</p>'}</div>

    <div class="card"><div class="row-flex" style="justify-content:space-between"><h3>4 · Then do this</h3><button class="btn sm" data-act="auto-actadd">+ Add step</button></div>
      <div class="stack" style="margin-top:12px">${a.actions.map(actRow).join('')}</div>
      <p class="help" style="margin-top:12px">${kind === 'client' ? 'This rule reaches the client. Marketing is held back while a complaint is open or consent is missing, and a VIP message waits for a person to approve.' : 'This rule only moves your own team — nothing reaches the client.'}</p></div>
  </div>`;
};

// ---------------------------------------------------------------- actions
Object.assign(ACTIONS, {
  'auto-filter': k => { autoFilter = k; render(); },
  'auto-toggle': id => { const a = AUTOS.find(x => x.id === id); a.on = !a.on; toast(`${a.name} ${a.on ? 'switched on' : 'paused'}`, [a.on ? 'It will run the next time the trigger fires' : 'Nothing will run until you switch it back on']); render(); },
  'auto-conadd': () => { draft.conds.push({ f: '', op: 'is', v: '' }); render(); },
  'auto-condel': i => { draft.conds.splice(+i, 1); render(); },
  'auto-actadd': () => { draft.actions.push({ type: 'notify_person', who: hero, text: '' }); render(); },
  'auto-actdel': i => { if (draft.actions.length > 1) { draft.actions.splice(+i, 1); render(); } },
  'auto-del': id => { AUTOS = AUTOS.filter(a => a.id !== id); draft = null; toast('Automation deleted', ['It stops running immediately']); location.hash = '#/automations'; },
  'auto-save': () => {
    const name = (document.getElementById('au-name').value || '').trim();
    if (!name) return formError('Give the automation a name.');
    if (draft.tiers.length === 0 && AUTO_KIND(draft) === 'client') return formError('This rule sends a message, so pick at least one client tier — or change the steps to internal ones.');
    draft.name = name;
    const existing = AUTOS.find(x => x.id === draft.id);
    if (existing) Object.assign(existing, draft);
    else { draft.id = 'aut_new' + Date.now(); draft.on = true; AUTOS.push(draft); }
    const client = AUTO_KIND(draft) === 'client';
    toast(`${name} saved`, [`When: ${trigLabel(draft.trigger)}`, `Who: ${audienceLine(draft)}`, `${draft.actions.length} step${draft.actions.length > 1 ? 's' : ''} · ${client ? 'reaches the client' : 'internal only'}`,
      client && draft.tiers.includes('vip') ? 'VIP messages will wait for a person to approve' : null]);
    draft = null; location.hash = '#/automations';
  },
  'auto-test': id => {
    const a = AUTOS.find(x => x.id === id);
    const who = a.tiers.length ? D.customers.filter(c => a.tiers.includes(c.tier) && (a.branch === 'all' || c.store === a.branch)).length : 0;
    toast(`Test run · ${a.name}`, [`When: ${trigLabel(a.trigger)}`, a.tiers.length ? `Audience today: ${who.toLocaleString('en-IN')} clients (${audienceLine(a)})` : 'Internal rule — no client audience',
      ...a.actions.map(x => `${actLabel(x)}${x.text ? ` — “${String(x.text).slice(0, 60)}”` : ''}`), 'Nothing was sent — this is a dry run']);
  },
});
document.addEventListener('change', e => {
  const t = e.target;
  if (!draft) return;
  if (t.dataset.tier) {
    if (t.dataset.tier === 'none') draft.tiers = t.checked ? [] : ['vip', 'premium', 'regular', 'prospect'];
    else draft.tiers = t.checked ? [...new Set([...draft.tiers, t.dataset.tier])] : draft.tiers.filter(x => x !== t.dataset.tier);
    render();
  }
  if (t.id === 'au-branch') draft.branch = t.value;
  if (t.id === 'au-likes') draft.likes = t.value;
  // a fresh trigger needs sensible starting numbers — "not bought in 24 days" reads wrong
  if (t.id === 'au-trig') { const d = { type: t.value }; const cfg = TRIGGERS[t.value].cfg || {};
    Object.entries(cfg).forEach(([k, spec]) => { d[k] = Array.isArray(spec) ? spec[0] : spec === 'time' ? '10:00' : { days_before: 3, days: 30, n: 5, pieces: 2, pct: 20, min_value: 0 }[k] ?? 0; });
    draft.trigger = d; render(); }
  if (t.dataset.tcfg) { draft.trigger[t.dataset.tcfg] = t.value; render(); }
  if (t.dataset.achange) { const i = +t.dataset.achange, type = t.value, x = { type };
    Object.entries(ACTS[type].cfg).forEach(([k, spec]) => { x[k] = Array.isArray(spec) ? spec[0] : spec === 'employee' ? hero : spec === 'role' ? 'role_store_manager' : spec === 'template' ? D.templates[0].id : k === 'hours' ? 2 : k === 'due_in_days' ? 1 : ''; });
    draft.actions[i] = x; render(); }
  if (t.dataset.acfg) { const [i, k] = t.dataset.acfg.split('|'); draft.actions[+i][k] = t.value; }
  if (t.dataset.ccfg) { const [i, k] = t.dataset.ccfg.split('|'); draft.conds[+i][k] = t.value; }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (!draft) return;  // the draft holds every edit: adding a step re-renders the form
  if (t.id === 'au-name') draft.name = t.value;
  if (t.dataset.acfg) { const [i, k] = t.dataset.acfg.split('|'); draft.actions[+i][k] = t.value; }
  if (t.dataset.ccfg) { const [i, k] = t.dataset.ccfg.split('|'); draft.conds[+i][k] = t.value; }
});
render();
