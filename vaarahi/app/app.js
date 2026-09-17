'use strict';
/* Vaarahi Silks — clickable demo on sample data (D20). Plain JS, no build step.
   Data: data.js → window.DEMO (demo/build_bundle.py). Every change is in memory; reload resets the demo.
   URL options: ?as=advisor|advisor_kph|allocation|consultant|billing|manager|owner  &theme=light|dark */
const D = window.DEMO;
const NOW = new Date(D.now), TODAY = D.now.slice(0, 10), MONTH = D.now.slice(0, 7);
const byId = a => Object.fromEntries(a.map(x => [x.id, x]));
const P = byId(D.products), C = byId(D.customers), E = byId(D.employees), SID = byId(D.stores);
const S = Object.fromEntries(D.stores.map(s => [s.code, s]));
const code = id => SID[id] && SID[id].code;
const ORD = D.orders.map(o => ({ id: o[0], no: o[1], at: o[2], store: o[3], adv: o[4], cust: o[5], total: o[6], prods: o[7], inv: o[8], tally: o[9] }));
const group = (a, f) => a.reduce((m, x) => ((m[f(x)] ||= []).push(x), m), {});
let ORD_C = group(ORD.filter(o => o.cust), o => o.cust);
const br = D.tenant.branding, LOGO = '../data/' + br.logo_light;
document.documentElement.style.setProperty('--brand-gold', br.accent);
document.documentElement.style.setProperty('--brand-green', br.primary);
document.documentElement.style.setProperty('--brand-deep', br.secondary);
const params = new URLSearchParams(location.search);
if (params.get('theme')) document.documentElement.dataset.theme = params.get('theme');

// ---------------------------------------------------------------- format
const TZ = { timeZone: 'Asia/Kolkata' };
const inr = n => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${Math.round(n).toLocaleString('en-IN')}`;
const dt = s => new Date(s.length > 10 ? s : s + 'T12:00:00+05:30');
const dFmt = s => dt(s).toLocaleDateString('en-IN', { ...TZ, day: 'numeric', month: 'short' });
const tFmt = s => dt(s).toLocaleTimeString('en-IN', { ...TZ, hour: 'numeric', minute: '2-digit' }).toLowerCase();
const when = s => s.startsWith(TODAY) ? `Today ${tFmt(s)}` : `${dFmt(s)}${s.length > 10 ? ' · ' + tFmt(s) : ''}`;
const ago = s => { const m = Math.round((NOW - dt(s)) / 6e4); return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const initials = n => n.replace(/^(Mrs?\.|Ms\.|Dr\.)\s*/, '').split(' ').map(w => w[0]).slice(0, 2).join('');
const img = (u, w = 480) => !u ? '' : u.startsWith('data:') ? u : u + (u.includes('?') ? '&' : '?') + 'width=' + w;
const plus = days => new Date(NOW.getTime() + days * 864e5).toISOString().slice(0, 10);
const digits10 = s => String(s || '').replace(/\D/g, '').slice(-10);
const CAT = { colour_bleed: 'Colour bleeding after wash', zari_tarnish: 'Zari tarnished', stitching_delay: 'Blouse stitching delayed', delivery_delay: 'Home delivery late', billing: 'Billing error', staff_behaviour: 'Staff behaviour', wrong_item: 'Wrong item received', product_damage: 'Product damage' };
const INTENT = { product_enquiry: 'Product enquiry', store_info: 'Store question', complaint: 'Complaint', appointment_request: 'Appointment request', feedback: 'Feedback', care_info: 'Care question', promo_enquiry: 'Offers question' };
const CH = { whatsapp: 'WhatsApp', google_review: 'Google review ★', instagram: 'Instagram', call: 'Phone call', in_store: 'In store', email: 'Email', web_form: 'Website form' };
const TIER = { vip: 'VIP', premium: 'Premium', regular: 'Regular', prospect: 'Prospect' };
const ACT = { call: 'Call', whatsapp: 'WhatsApp', visit: 'Invite in', send_product: 'Share designs', invite: 'Invite' };
const STAGE = { enquiry: 'Enquiry', shortlisted: 'Shortlisted', trial_viewing: 'Trial / viewing', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' };
const SCOPE = { own: 'Only their own clients', branch: 'Their branch', region: 'Their region', company: 'All branches' };
const LEAF_ROLES = ['role_advisor', 'role_front_desk', 'role_consultant', 'role_billing', 'role_finance', 'role_inventory', 'role_marketing', 'role_service'];
const tier = c => `<span class="chip ${c.tier}">${TIER[c.tier]}</span>`;
const avatar = (c, cls = '') => `<span class="avatar ${c.tier === 'vip' ? 'vip' : ''} ${cls}">${esc(initials(c.name))}</span>`;
const storeName = k => S[k] ? S[k].name : (k || 'All branches');
const roleName = id => (D.roles.find(r => r.id === id) || { name: id }).name;
const advName = c => c.advisor && E[c.advisor] ? E[c.advisor].name : 'Unassigned';
const WA_NUMBER = '+91 90004 54411';  // the brand's one WhatsApp Business number (from vaarahisilks.com)
const lastIn = cid => D.whatsapp.filter(m => m.customer_id === cid && m.direction === 'in').reduce((a, m) => (m.at > a ? m.at : a), '');
const windowLeft = cid => { const l = lastIn(cid); return l ? 24 - (NOW - dt(l)) / 36e5 : -1; };  // hours left in WhatsApp's 24-hour reply window
const notifyAdvisor = c => c.advisor && c.advisor !== me().id ? `${advName(c)} (their Sales staff) is notified` : null;

// ---------------------------------------------------------------- settings (director-controlled)
const ACCESS_DEFAULT = {
  role_owner: { scope: 'company', cost: true, reports: true, export: true, team: true },
  role_business_head: { scope: 'company', cost: true, reports: true, export: true, team: true },
  role_regional_head: { scope: 'region', cost: true, reports: true, export: false, team: false },
  role_store_manager: { scope: 'branch', cost: true, reports: true, export: false, team: false },
  role_assistant_manager: { scope: 'branch', cost: false, reports: true, export: false, team: false },
  role_department_head: { scope: 'company', cost: true, reports: true, export: true, team: false },
  role_finance: { scope: 'company', cost: true, reports: true, export: true, team: false },
  role_inventory: { scope: 'company', cost: true, reports: false, export: true, team: false },
  role_marketing: { scope: 'company', cost: false, reports: true, export: true, team: false },
  role_admin: { scope: 'company', cost: false, reports: false, export: false, team: true },
};
const NO_ACCESS = { scope: 'own', cost: false, reports: false, export: false, team: false };
const SETTINGS = {
  tiers: { vip: 1000000, premium: 250000 },
  sla: { ...D.tenant.settings.grievance_sla_hours },
  ladder: ['role_store_manager', 'role_regional_head', 'role_business_head'],
  access: Object.fromEntries(D.roles.map(r => [r.id, { ...(ACCESS_DEFAULT[r.id] || NO_ACCESS), ...(['role_front_desk', 'role_service', 'role_consultant', 'role_billing'].includes(r.id) ? { scope: 'branch' } : {}) }])),
};

// ---------------------------------------------------------------- roles & scope
const fourPm = D.appointments.find(a => a.id === D.story.four_pm_appointment_id);
const ROLES = {
  advisor: { label: 'Sales Staff · Jubilee Hills', user: D.story.hero_advisor_id, kind: 'advisor' },
  advisor_kph: { label: 'Sales Staff · Kukatpally', user: fourPm.advisor_id, kind: 'advisor' },
  allocation: { label: 'Allocation Staff · Jubilee Hills', user: D.story.allocation_id, kind: 'allocation' },
  consultant: { label: 'Consultant · Jubilee Hills', user: D.story.consultant_id, kind: 'consultant' },
  billing: { label: 'Billing · Jubilee Hills', user: D.story.billing_id, kind: 'billing' },
  manager: { label: 'Store Manager · Jubilee Hills', user: S.JBH.manager_id, kind: 'manager' },
  owner: { label: 'Director', user: D.story.directors[0], kind: 'owner' },
};
let role = ROLES[params.get('as')] ? params.get('as') : 'advisor';
let storyOn = null, tabState = 'owns', query = '', invStore = null, tierFilter = 'all', replyOpen = null, lastMove = null, stockMode = 'one';
let apptDay = 'today', catQ = '', catColl = 'all', tgtMonth = MONTH, allocStore = 'JBH', newImgs = [], tplFilter = 'all', tplVars = [];
const me = () => E[ROLES[role].user], kind = () => ROLES[role].kind;
const acc = () => SETTINGS.access[me().role] || NO_ACCESS;
const isDirector = () => me().role === 'role_owner';
const isPhone = () => window.matchMedia('(max-width: 760px)').matches;
const myStore = () => me().store || 'JBH';
const active = () => D.employees.filter(e => e.status !== 'left');
const advisorsAt = st => active().filter(e => e.role === 'role_advisor' && e.store === st);
function inScope(c) {
  const s = acc().scope;
  if (s === 'company') return true;
  if (s === 'region') return SID['sto_' + c.store].region_id === SID['sto_' + myStore()].region_id;
  if (s === 'branch') return c.store === myStore();
  return c.advisor === me().id;
}
const canOpen = c => inScope(c) || D.appointments.some(a => a.customer_id === c.id && code(a.store_id) === myStore() && a.starts_at.startsWith(TODAY));
const maskCost = () => !acc().cost;
const isOpen = g => !['resolved', 'closed'].includes(g.status);
const paused = cid => D.grievances.some(g => g.customer_id === cid && isOpen(g));
const cost = p => maskCost() ? '<span title="Hidden for your role">₹ ••••</span>' : inr(p.cost);

// ---------------------------------------------------------------- client tiers: automatic from last-12-month spend
const YEAR_AGO = new Date(NOW.getTime() - 365 * 864e5).toISOString().slice(0, 10);
const spend12 = cid => (ORD_C[cid] || []).reduce((s, o) => s + (o.at.slice(0, 10) > YEAR_AGO ? o.total : 0), 0);
const ruleTier = c => c.spend12 >= SETTINGS.tiers.vip ? 'vip' : c.spend12 >= SETTINGS.tiers.premium ? 'premium' : c.n > 0 ? 'regular' : 'prospect';
function retier() { D.customers.forEach(c => { c.spend12 = spend12(c.id); c.tier = c.override ? c.override.tier : ruleTier(c); }); }
retier();
function tierWhy(c) {
  if (c.override) return `Set manually by ${esc(c.override.by)} — ${esc(c.override.reason || 'no reason given')}`;
  const rule = { vip: `VIP starts at ${inr(SETTINGS.tiers.vip)}`, premium: `Premium starts at ${inr(SETTINGS.tiers.premium)}`, regular: `under ${inr(SETTINGS.tiers.premium)}`, prospect: 'no purchase yet' }[c.tier];
  return c.tier === 'prospect' ? 'Prospect — no purchase yet' : `${TIER[c.tier]} — spent ${inr(c.spend12)} in the last 12 months (${rule})`;
}

// ---------------------------------------------------------------- targets (Phase 1 calcs)
const DAYS_LEFT = 30 - Number(TODAY.slice(8));
const inLevel = (o, level, ref) => level === 'brand' || (level === 'store' && o.store === code(ref)) || (level === 'advisor' && o.adv === ref) || (level === 'region' && SID['sto_' + o.store].region_id === ref);
const achieved = (level, ref, month = MONTH) => ORD.reduce((s, o) => s + (o.at.startsWith(month) && inLevel(o, level, ref) ? o.total : 0), 0);
const targetOf = (level, ref, month = MONTH) => D.targets.find(t => t.level === level && t.level_ref_id === ref && t.period_start.startsWith(month));
function progress(level, ref) {
  const t = targetOf(level, ref), a = achieved(level, ref), v = t ? t.target_value : 0, gap = Math.max(0, v - a);
  return { t: v, a, pct: v ? a / v : 0, gap, pace: gap / DAYS_LEFT };
}
function targetStrip(level, ref, who) {
  const p = progress(level, ref), tg = targetOf(level, ref);
  return `<div class="tstrip"><div class="kicker">${esc(who)} · September target</div>
    <div class="tnum"><b>${Math.round(p.pct * 100)}%</b><span class="muted">of ${inr(p.t)}</span></div>
    <div class="bar"><i style="width:${Math.min(100, p.pct * 100)}%"></i></div>
    <div class="tmeta">${inr(p.a)} achieved · ${DAYS_LEFT} days left · <b>${inr(p.pace)}/day</b> needed</div>
    ${tg && tg.set_by && E[tg.set_by] ? `<div class="help" style="margin-top:4px">Target set by ${esc(E[tg.set_by].name)}${tg.set_at ? ' on ' + dFmt(tg.set_at) : ''}</div>` : ''}</div>`;
}

// ---------------------------------------------------------------- shared bits
function stockLine(pid) {
  const have = Object.entries(D.stock[pid] || {}).filter(([, n]) => n > 0);
  return have.length ? have.map(([k, n]) => `${storeName(k)} ${n}`).join(' · ') : '<span class="sev-high">Out of stock in all branches</span>';
}
const pimg = (p, w, cls = '') => p.img && p.img[0] ? `<img loading="lazy" class="${cls}" src="${img(p.img[0], w)}" alt="${esc(p.name)}">` : '<div class="noimg">Photo to add</div>';
const miniBody = p => `${pimg(p, 160)}<span class="grow"><span class="small">${esc(p.name)}</span><br><b>${inr(p.price)}</b><br><span class="small muted">${stockLine(p.id)}</span></span>`;
const miniProduct = p => `<a class="mini" href="#/product/${p.id}">${miniBody(p)}</a>`;
const pcard = (p, extra = '') => `<a class="pcard" href="#/product/${p.id}">${pimg(p, 480)}<div class="pn">${esc(p.name)}</div><div class="pp">${inr(p.price)}</div>${extra}</a>`;
function actionItem(f) {
  const c = C[f.customer_id];
  const flag = f.status === 'escalated' ? '<span class="chip bad">Escalated to manager</span>' : f.status === 'missed' ? '<span class="chip warn">Missed</span>' : '';
  return `<div class="row">${avatar(c)}<div class="grow"><a class="name" href="#/customer/${c.id}">${esc(c.name)}</a> ${tier(c)} ${flag}<div class="why">Why: ${esc(f.reason_text)}</div></div>
    <button class="btn sm primary" data-act="done-fu" data-id="${f.id}">${ACT[f.action] || 'Open'}</button></div>`;
}
const slaText = g => {
  if (!isOpen(g)) return `<span class="chip good">Resolved ${g.resolved_at ? dFmt(g.resolved_at) : ''}</span>`;
  const h = Math.round((dt(g.sla_due_at) - NOW) / 36e5);
  return h < 0 ? `<span class="chip bad">Deadline passed ${-h} h ago</span>` : `<span class="chip warn">Due in ${h} h</span>`;
};
const chBadges = g => [...new Set(g.touchpoints.filter(t => t.dir !== 'out').map(t => t.channel))].map(c => `<span class="ch">${CH[c] || c}</span>`).join('');
const section = (title, body, extra = '') => `<section class="card"><div class="page-h" style="margin-bottom:12px"><h3>${title}</h3>${extra}</div>${body}</section>`;
const chipRadio = (name, opts, def) => opts.map(o => `<label class="chip on"><input type="radio" name="${name}" value="${esc(o)}" ${o === def ? 'checked' : ''}> ${esc(o)}</label>`).join('');
const chipChecks = (name, opts, on = []) => opts.map(o => `<label class="chip on"><input type="checkbox" name="${name}" value="${esc(o)}" ${on.includes(o) ? 'checked' : ''}> ${esc(o)}</label>`).join('');
const formBtns = (act, label, id = '') => `<div id="ferr" class="errbox"></div><div class="row-flex"><button class="btn primary" type="button" data-act="${act}" data-id="${id}">${label}</button><button class="btn ghost" type="button" data-act="close-modal">Cancel</button></div>`;
const formError = msg => { document.getElementById('ferr').textContent = msg; };
const fd = () => new FormData(document.getElementById('f'));

// ---------------------------------------------------------------- modal + toast
let modalT0 = 0;
function openModal(html, focus = true) {
  const again = !!document.querySelector('#overlay .modal');
  document.getElementById('overlay').innerHTML = `<div class="ov center" data-act="close-modal"><div class="modal" role="dialog">${html}</div></div>`;
  if (!again) modalT0 = Date.now();
  if (focus) { const f = document.querySelector('.modal .in'); if (f) f.focus(); }
}
const closeModal = () => { document.getElementById('overlay').innerHTML = ''; };
const secs = () => Math.max(1, Math.round((Date.now() - modalT0) / 1000));
function toast(title, lines, action) {
  const t = document.getElementById('toast');
  t.innerHTML = `<div class="toast"><b>${esc(title)}</b><ul>${lines.filter(Boolean).map(l => `<li>${esc(l)}</li>`).join('')}</ul>${action ? `<button class="tact" data-act="${action.act}">${esc(action.label)}</button>` : ''}</div>`;
  clearTimeout(toast.h); toast.h = setTimeout(() => { t.innerHTML = ''; }, 10000);
}

// ---------------------------------------------------------------- homes
function advisorHome() {
  const u = me(), first = u.name.split(' ')[0];
  const pending = D.whatsapp.filter(m => m.card && m.card.status === 'pending' && C[m.customer_id].advisor === u.id);
  const acts = D.followups.filter(f => f.owner_id === u.id && f.status !== 'done' && f.due_at.slice(0, 10) <= TODAY).sort((a, b) => a.due_at.localeCompare(b.due_at));
  const appts = D.appointments.filter(a => a.advisor_id === u.id && a.starts_at.startsWith(TODAY)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const matches = D.demand.filter(d => d.status === 'notified' && d._fresh && C[d.customer_id].advisor === u.id);
  return `<div class="stack">
    <div class="row-flex" style="justify-content:space-between;align-items:flex-end"><div><div class="kicker">${esc(storeName(u.store))} · ${dFmt(TODAY)}</div><h1>Good afternoon, ${esc(first)}</h1></div>
      ${isPhone() ? '' : '<button class="btn sm primary" data-act="add-client">+ Add client</button>'}</div>
    <div class="card">${targetStrip('advisor', u.id, 'My')}</div>
    ${pending.length ? `<a class="card" href="#/inbox/${pending.find(m => m.customer_id === D.story.capture_customer_id)?.customer_id || pending[0].customer_id}" style="display:block;border-color:var(--ge-accent)">
      <div class="kicker">New on WhatsApp</div><b>${pending.length} messages captured by AI</b><div class="why">Details already filled in — approve with one tap</div></a>` : ''}
    ${matches.length ? section('Wishlist matches in stock', `<div class="list">${matches.map(d => `<div class="row">${avatar(C[d.customer_id])}<div class="grow"><a class="name" href="#/customer/${d.customer_id}">${esc(C[d.customer_id].name)}</a><div class="why">Why: waited ${Math.round((NOW - dt(d.requested_on)) / 864e5)} days for ${esc(P[d.product_id].name)} — now in stock</div></div><button class="btn sm primary" data-act="send-offer" data-id="${d.id}">Send offer</button></div>`).join('')}</div>`) : ''}
    ${section(`Today's actions <span class="muted small">(${acts.length})</span>`, acts.length ? `<div class="list">${acts.slice(0, 12).map(actionItem).join('')}</div>` : '<div class="empty">All done for today.</div>')}
    ${section('Appointments today', appts.length ? `<div class="list">${appts.map(a => { const c = C[a.customer_id], bought = (ORD_C[c.id] || []).find(o => o.at.startsWith(TODAY));
      return `<div class="row">${avatar(c)}<div class="grow"><b>${tFmt(a.starts_at)}</b> · <a class="name" href="#/customer/${c.id}">${esc(c.name)}</a> ${tier(c)}<div class="why">${esc(a.purpose)}${bought && bought.store !== myStore() ? ` · <b>bought at ${esc(storeName(bought.store))} today ${tFmt(bought.at)}</b>` : ''}</div></div></div>`; }).join('')}</div>` : '<div class="empty">No appointments today.</div>', '<button class="btn sm" data-act="book-appt">+ Book</button>')}
  </div>`;
}

function managerHome() {
  const st = myStore(), board = advisorsAt(st).map(a => ({ a, p: progress('advisor', a.id) })).sort((x, y) => y.p.pct - x.p.pct);
  const fus = D.followups.filter(f => C[f.customer_id].store === st);
  const dueToday = fus.filter(f => f.status === 'open' && f.due_at.startsWith(TODAY)).length;
  const missed = fus.filter(f => f.status === 'missed').length, escd = fus.filter(f => f.status === 'escalated');
  const gs = D.grievances.filter(g => code(g.store_id) === st && isOpen(g));
  return `<div class="stack">
    <div class="page-h"><div><div class="kicker">${esc(storeName(st))} · ${dFmt(TODAY)}</div><h1>Store today</h1></div>${isPhone() ? '' : '<button class="btn primary" data-act="add-client">+ Add client</button>'}</div>
    <div class="grid g2"><div class="card">${targetStrip('store', 'sto_' + st, storeName(st))}</div>
      <div class="card grid g3" style="align-items:start">
        <div class="stat"><div class="kicker">Follow-ups due today</div><div class="v">${dueToday}</div></div>
        <div class="stat"><div class="kicker">Missed</div><div class="v">${missed}</div></div>
        <div class="stat"><div class="kicker">Escalated to you</div><div class="v">${escd.length}</div><div class="d">auto-escalated after 24 h</div></div></div></div>
    <div class="grid g2">
      ${section('Sales staff leaderboard', isPhone()
        // a 4-column table is unreadable on a phone — one card per person instead
        ? `<div class="list">${board.map(({ a, p }) => `<div class="row"><div class="grow"><b>${esc(a.name)}</b>${D.trained.includes(a.id) ? '' : ' <span class="chip warn">training due</span>'}<div class="why">${inr(p.a)} of ${inr(p.t)}</div><div class="bar green" style="margin-top:6px"><i style="width:${Math.min(100, p.pct * 100)}%"></i></div></div><span class="small muted">${Math.round(p.pct * 100)}%</span></div>`).join('')}</div>`
        : `<table class="t"><tr><th>Sales staff</th><th>Achieved</th><th>Target</th><th style="width:34%">Progress</th></tr>${board.map(({ a, p }) =>
        `<tr><td>${esc(a.name)}${D.trained.includes(a.id) ? '' : ' <span class="chip warn" title="Has not completed the new-line training">training due</span>'}</td><td>${inr(p.a)}</td><td>${inr(p.t)}</td><td><div class="bar green"><i style="width:${Math.min(100, p.pct * 100)}%"></i></div><span class="small muted">${Math.round(p.pct * 100)}%</span></td></tr>`).join('')}</table>`)}
      ${section(`Open complaints <span class="muted small">(${gs.length})</span>`, gs.length ? `<div class="list">${gs.map(g => `<div class="row"><div class="grow"><a class="name" href="#/grievances/${g.id}">${esc(C[g.customer_id].name)}</a> ${tier(C[g.customer_id])}<div class="why">${chBadges(g)} ${esc(CAT[g.category])}</div></div>${slaText(g)}</div>`).join('')}</div>` : '<div class="empty">No open complaints.</div>', '<a class="btn sm" href="#/grievances">Open queue</a>')}
    </div>
    ${section('Escalated follow-ups', escd.length ? `<div class="list">${escd.slice(0, 8).map(actionItem).join('')}</div>` : '<div class="empty">Nothing escalated.</div>')}
  </div>`;
}

// mark = draw the "100% of target" line; meaningless when the values are rupees, not percentages
function hbars(rows, mark = true) {
  const max = Math.max(1.15, ...rows.map(r => r.value));
  return `<div class="hbars">${rows.map(r => `<div class="hb" title="${esc(r.tip)}"><span>${esc(r.label)}</span><span class="hb-t"><i style="width:${(r.value / max) * 100}%"></i>${mark ? `<em style="left:${100 / max}%" title="Target"></em>` : ''}</span><span class="hb-v">${r.text}</span></div>`).join('')}</div>`;
}
function vbars(items) {
  const W = 720, H = 190, pad = 8, bw = (W - pad * 2) / items.length, max = Math.max(...items.map(i => i.value));
  const hi = items.indexOf(items.reduce((a, b) => (b.value > a.value ? b : a))), lo = items.indexOf(items.reduce((a, b) => (b.value < a.value ? b : a)));
  return `<svg class="vbars" viewBox="0 0 ${W} ${H + 40}" role="img" aria-label="Revenue by month">
    <line x1="0" x2="${W}" y1="${H + 20}" y2="${H + 20}"/>
    ${items.map((it, i) => { const h = (it.value / max) * H, x = pad + i * bw + 5, w = bw - 10, y = H + 20 - h;
      return `<g><title>${it.label}: ${inr(it.value)}${it.note ? ' — ' + it.note : ''}</title><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>
      ${i === hi || i === lo ? `<text class="lab" x="${x + w / 2}" y="${y - 6}" text-anchor="middle">${inr(it.value)}</text>` : ''}
      <text x="${x + w / 2}" y="${H + 36}" text-anchor="middle">${it.label}</text></g>`; }).join('')}</svg>`;
}

function ownerHome() {
  const months = [];
  for (let i = 12; i >= 1; i--) { const d = new Date(2026, 8 - i, 1); months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); }
  const monthRev = m => Object.values(D.rev).reduce((s, r) => s + (r[m] || 0), 0);
  const y12 = ORD.filter(o => o.at.slice(0, 7) >= months[0] && o.at.slice(0, 7) <= months[11]);
  const tot = y12.reduce((s, o) => s + o.total, 0);
  const vip = y12.reduce((s, o) => s + (o.cust && C[o.cust].tier === 'vip' ? o.total : 0), 0);
  const open = D.grievances.filter(isOpen), breached = open.filter(g => dt(g.sla_due_at) < NOW).length;
  const stores = D.stores.map(s => ({ s, p: progress('store', s.id) })).sort((a, b) => b.p.pct - a.p.pct);
  const worst = stores[stores.length - 1], heroG = D.grievances.find(g => g.id === D.story.grievance_id), hc = C[heroG.customer_id];
  const waiting = D.demand.filter(d => d.product_id === D.story.demand_product_id && d.status === 'waiting').length;
  const brand = progress('brand', 'ten_vaarahi');
  return `<div class="stack">
    <div class="page-h"><div><div class="kicker">All branches · ${dFmt(TODAY)}</div><h1>The business today</h1></div><span class="muted small">Sample data · figures are illustrative</span></div>
    <div class="grid g4">
      <div class="card stat"><div class="kicker">September so far</div><div class="v">${inr(brand.a)}</div><div class="d">${Math.round(brand.pct * 100)}% of ${inr(brand.t)} target · ${inr(brand.pace)}/day needed</div></div>
      <div class="card stat"><div class="kicker">Last 12 months</div><div class="v">${inr(tot)}</div><div class="d">${y12.length.toLocaleString('en-IN')} sales, ${Math.round(y12.filter(o => o.cust).length / y12.length * 100)}% linked to a client</div></div>
      <div class="card stat"><div class="kicker">VIP share of revenue</div><div class="v">${Math.round(vip / tot * 100)}%</div><div class="d">from ${D.customers.filter(c => c.tier === 'vip').length} VIP clients</div></div>
      <div class="card stat"><div class="kicker">Open complaints</div><div class="v">${open.length}</div><div class="d">${breached} past deadline</div></div>
    </div>
    <div class="grid g2">
      ${section('Branches vs September target', hbars(stores.map(({ s, p }) => ({ label: s.name, value: p.pct, text: `${Math.round(p.pct * 100)}% · ${inr(p.a)}`, tip: `${s.name}: ${inr(p.a)} of ${inr(p.t)}` }))) + '<div class="small muted" style="margin-top:8px">Line = 100% of target. Vanasthalipuram opened in August.</div>')}
      ${section('Needs your attention', `<div class="list">
        ${isOpen(heroG) ? `<div class="row"><div class="grow"><b>${TIER[hc.tier]} client's complaint escalated to Regional Head</b><div class="why">Why: ${esc(hc.name)} — ${esc(CAT[heroG.category])}, WhatsApp + 1-star Google review, deadline passed</div></div><a class="btn sm" href="#/grievances/${heroG.id}">Open</a></div>` : ''}
        ${waiting ? `<div class="row"><div class="grow"><b>${esc(P[D.story.demand_product_id].name)} lands at Vijayawada today</b><div class="why">Why: ${waiting} clients across branches are waiting for it — out of stock everywhere</div></div><a class="btn sm" href="#/inventory/VJA">Open</a></div>` : ''}
        <div class="row"><div class="grow"><b>${esc(worst.s.name)} is furthest behind</b><div class="why">Why: ${Math.round(worst.p.pct * 100)}% of target with ${DAYS_LEFT} days left — needs ${inr(worst.p.pace)}/day</div></div><a class="btn sm" href="#/targets">Open</a></div>
      </div><div class="small muted" style="margin-top:10px">Rule-based in Phase 1. The AI Owner Copilot arrives in Phase 3.</div>`)}
    </div>
    ${section('Revenue by month', (isPhone()
      // a phone has no hover, and vbars keeps each figure in an SVG <title> — so show the numbers
      ? hbars(months.map(m => ({ label: new Date(m + '-15').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), value: monthRev(m), text: inr(monthRev(m)), tip: '' })), false)
      : vbars(months.map(m => ({ label: new Date(m + '-15').toLocaleDateString('en-IN', { month: 'short' }), value: monthRev(m), note: m.endsWith('-06') || m.endsWith('-07') ? 'Ashadam' : '' })))) + `<div class="small muted" style="margin-top:8px">June–July dip = Ashadam, traditionally the quiet month for weddings.${isPhone() ? '' : ' Hover a bar for exact figures.'}</div>`, '<span class="small muted">Sep 2025 – Aug 2026 · all branches</span>')}
  </div>`;
}

// ---------------------------------------------------------------- WhatsApp inbox + capture
const cardOpened = {};
const draftFor = (x, c) => x.draft_reply || ({
  product_enquiry: `Namaste ${c.first} garu! Sharing a few designs that match what you asked for — photos coming right up. Shall I keep them aside for you?`,
  appointment_request: `Namaste ${c.first} garu! Saturday 4 pm is booked for the bridal trial at Jubilee Hills. We'll have a curated selection ready for you 🌸`,
  promo_enquiry: `Namaste ${c.first} garu! Our Dasara preview opens this week — may I reserve a private viewing slot for you?`,
  store_info: `Yes, we're open till 10 pm today — see you soon!`,
}[x.intent] || '');
function captureCard(m) {
  const card = m.card, x = card.extraction, c = C[m.customer_id];
  if (card.status !== 'pending') return `<div class="cap done">✓ Captured and logged${card.decided_ms ? ` — approved in ${Math.max(1, Math.round(card.decided_ms / 1000))} s` : ''}</div>`;
  cardOpened[card.id] ||= Date.now();
  const chips = [...(x.preferences || []).map(p => `${p.kind === 'colour' ? 'Colour' : 'Weave'}: ${p.value}`)];
  if (x.occasion) chips.push(`Occasion: ${x.occasion.person ? x.occasion.person + "'s " : ''}${x.occasion.kind}`);
  if (x.budget) chips.push(`Budget: ${x.budget.min ? inr(x.budget.min) + '–' + inr(x.budget.max) : 'up to ' + inr(x.budget.max)}`);
  if (x.appointment) chips.push(`Appointment: ${x.appointment.day} ${x.appointment.time}`);
  const prods = (x.products || []).map(id => P[id]).filter(Boolean), draft = draftFor(x, c), closed = windowLeft(c.id) <= 0;
  return `<div class="cap"><div class="cap-h"><span class="kicker">Captured by AI · ${Math.round(card.confidence * 100)}% sure</span><span class="chip">${INTENT[x.intent] || x.intent}</span></div>
    <div class="help" style="margin:-4px 0 10px">Read by AI the moment it arrived — matched to your catalogue and live stock, reply drafted. Nothing reaches the client until someone taps Approve.</div>
    ${chips.length ? `<div class="chips">${chips.map(t => `<label class="chip on"><input type="checkbox" checked> ${esc(t)}</label>`).join('')}</div>` : ''}
    ${prods.length ? `<div class="kicker">Matched from your catalogue</div><div class="cap-prods">${prods.map(miniProduct).join('')}</div>` : ''}
    ${x.complaint_detected ? `<div class="cap-warn"><b>Complaint detected</b> — ${esc(CAT[x.complaint.category])}. Opening a case alerts the store manager and pauses marketing to ${esc(c.first)} until it's resolved.</div>` : ''}
    ${closed && !x.complaint_detected ? `<div class="cap-warn"><b>This message waited over 24 hours.</b> WhatsApp now only allows a pre-approved template, so we'll send “Sorry we missed your message”:<div class="tp-out" style="margin-top:6px">${esc(fillTpl('tpl_missed', c))}</div></div>`
      : draft && !x.complaint_detected ? `<div class="kicker">Drafted reply — edit if you like</div><textarea class="draft" id="draft-${card.id}">${esc(draft)}</textarea>` : ''}
    <div class="cap-actions">${x.complaint_detected ? `<button class="btn primary" data-act="open-grv" data-id="${m.id}">Open complaint case</button>` : `<button class="btn primary" data-act="approve" data-id="${m.id}">${closed ? 'Send apology template' : draft ? 'Approve & send' : 'Approve'}</button>`}
      ${x.intent === 'appointment_request' ? `<button class="btn" data-act="book-appt" data-id="${c.id}|${m.id}">Book the appointment</button>` : ''}
      <button class="btn ghost" data-act="dismiss" data-id="${m.id}">Dismiss</button></div></div>`;
}
// ---- WhatsApp templates: pre-approved by Meta, needed to (re)start a chat after the 24-hour window
const tplById = id => typeof id === 'string' ? D.templates.find(x => x.id === id) : id;
function tplVal(k, c) {
  const lastOrder = (ORD_C[c.id] || []).reduce((a, o) => (!a || o.at > a.at ? o : a), null);
  const g = D.grievances.find(x => x.customer_id === c.id && isOpen(x));
  const inb = D.whatsapp.filter(m => m.customer_id === c.id && m.direction === 'in').reduce((a, m) => (!a || m.at > a.at ? m : a), null);
  const next = D.appointments.filter(a => a.customer_id === c.id && a.starts_at >= D.now).reduce((a, x) => (!a || x.starts_at < a.starts_at ? x : a), null);
  return ({ client: `${c.name.split(' ')[0]} ${c.last || c.first}`.trim(), advisor: c.advisor ? advName(c).split(' ')[0] : 'Our team', branch: storeName(c.store),
    topic: inb ? `“${inb.body.length > 42 ? inb.body.slice(0, 42).trim() + '…' : inb.body}”` : 'your enquiry', date: inb ? dFmt(inb.at) : dFmt(TODAY),
    order: lastOrder ? lastOrder.no : '—', amount: lastOrder ? inr(lastOrder.total) : '—', product: lastOrder ? P[lastOrder.prods[0]].name : 'your saree',
    code: g ? g.code : '—', issue: g ? CAT[g.category].toLowerCase() : 'issue', update: 'we have arranged a replacement and will call you to fix a time', fix: 'we have replaced the saree',
    purpose: next ? next.purpose.toLowerCase() : 'visit', time: next ? tFmt(next.starts_at) : '12:00 pm', eta: 'tomorrow between 11 am and 2 pm', collection: 'Dasara' })[k] ?? `[${k}]`;
}
function fillTpl(id, c, ctx = {}) { const x = tplById(id); return x.body.replace(/\{\{(\d+)\}\}/g, (_, n) => { const k = (x.vars || [])[n - 1]; return ctx[k] ?? tplVal(k, c); }); }
const missed = cid => { const ms = D.whatsapp.filter(m => m.customer_id === cid); if (!ms.length) return false; const last = ms.reduce((a, m) => (m.at > a.at ? m : a)); return last.direction === 'in' && NOW - dt(last.at) > 24 * 36e5; };
const mktBlock = c => !c.consent_wa ? 'no marketing consent' : paused(c.id) ? 'complaint open' : '';
function tplOptions(c, def) {
  const ok = D.templates.filter(x => ['approved', 'recategorised'].includes(x.status)), why = mktBlock(c);
  return `<optgroup label="Service messages">${ok.filter(x => x.category === 'utility').map(x => `<option value="${x.id}" ${x.id === def ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</optgroup>
    <optgroup label="Marketing${why ? ' — not allowed now: ' + why : ''}">${ok.filter(x => x.category === 'marketing').map(x => `<option value="${x.id}" ${why ? 'disabled' : ''}>${esc(x.title)}</option>`).join('')}</optgroup>`;
}
const PROMO = /offer|discount|sale|% ?off|new collection|new arrival|shop now|exclusive|deal|free gift/i;
function tplWarn() {
  const f = document.getElementById('f'), body = document.getElementById('tpl-body'), w = document.getElementById('tpl-warn');
  if (!f || !body || !w) return;
  w.innerHTML = new FormData(f).get('cat') === 'Service' && PROMO.test(body.value) ? '<div class="warnbox">This sounds promotional, so Meta will most likely approve it as <b>Marketing</b> — which can\'t be sent while a client has an open complaint or without marketing consent. Keep service messages about the client\'s own request.</div>' : '';
}
function inbox(arg) {
  const threads = Object.entries(group(D.whatsapp.filter(m => C[m.customer_id] && inScope(C[m.customer_id])), m => m.customer_id))
    .map(([cid, ms]) => ({ c: C[cid], ms: ms.sort((a, b) => a.at.localeCompare(b.at)) })).map(t => ({ ...t, last: t.ms[t.ms.length - 1] }))
    .sort((a, b) => b.last.at.localeCompare(a.last.at));
  const list = `<div class="list">${threads.map(t => { const pend = t.ms.some(m => m.card && m.card.status === 'pending');
    return `<a class="row" href="#/inbox/${t.c.id}" style="${arg === t.c.id ? 'background:var(--ge-surface-2);' : ''}">${avatar(t.c)}<div class="grow"><span class="name">${esc(t.c.name)}</span> ${pend ? '<span class="chip vip">AI captured</span>' : ''}${t.c.advisor ? '' : ' <span class="chip bad">Unassigned</span>'}${missed(t.c.id) ? ' <span class="chip bad">Missed 24 h+</span>' : ''}${paused(t.c.id) ? ' <span class="chip bad">complaint open</span>' : ''}<div class="why" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.last.body)}</div></div><span class="small muted" style="text-align:right;white-space:nowrap">${ago(t.last.at)}${t.c.advisor ? '<br>' + esc(advName(t.c).split(' ')[0]) : ''}</span></a>`; }).join('')}</div>`;
  const cur = threads.find(t => t.c.id === arg), openG = cur && D.grievances.find(g => g.customer_id === cur.c.id && isOpen(g));
  const left = cur ? windowLeft(cur.c.id) : 0;
  const assign = !cur ? '' : kind() === 'advisor' ? `<span class="help">${cur.c.advisor === me().id ? 'Your client' : 'Sales staff: ' + esc(advName(cur.c))}</span>`
    : `<label class="row-flex small" style="gap:8px">Sales staff <select class="in" style="min-height:36px;width:auto" data-assign="${cur.c.id}">${cur.c.advisor ? '' : '<option value="">— Unassigned: pick Sales staff —</option>'}${advisorsAt(cur.c.store).map(a => `<option value="${a.id}" ${a.id === cur.c.advisor ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>`;
  const composer = !cur ? '' : left > 0
    ? `<div class="help">Sends from the Vaarahi Silks WhatsApp number (${WA_NUMBER}) — the one the client wrote to. Free-text replies allowed for ${Math.floor(left)} h ${Math.round((left % 1) * 60)} m more (WhatsApp's 24-hour rule).</div>
       <div class="row-flex"><textarea class="draft" id="wa-new" style="min-height:44px;flex:1" placeholder="Type a message…"></textarea><button class="btn primary" data-act="wa-send" data-id="${cur.c.id}">Send</button></div>`
    : (() => { const miss = missed(cur.c.id), def = miss ? 'tpl_missed' : 'tpl_followup';
      return `<div class="help">${miss ? `${esc(cur.c.first)}'s message has waited more than 24 hours. WhatsApp now only allows a pre-approved template — the apology is suggested. When they reply, free chat reopens for 24 hours.` : `${esc(cur.c.first)} last wrote more than 24 hours ago, so WhatsApp only allows a pre-approved template message.`}</div>
       <select class="in" id="wa-tpl" data-cid="${cur.c.id}">${tplOptions(cur.c, def)}</select>
       <div class="tp-out small" id="tpl-prev" style="margin-top:8px">${esc(fillTpl(def, cur.c))}</div>
       <div class="row-flex" style="margin-top:8px;justify-content:space-between">${isDirector() ? '<a class="small" href="#/settings/templates"><u>Manage templates</u></a>' : '<span></span>'}<button class="btn primary" data-act="tpl-send" data-id="${cur.c.id}">Send template</button></div>`; })();
  const thread = cur ? `<div class="stack"><div class="row-flex">${avatar(cur.c)}<div class="grow"><a class="name" href="#/customer/${cur.c.id}">${esc(cur.c.name)}</a> ${tier(cur.c)}<div class="why">${esc(storeName(cur.c.store))} · LTV ${inr(cur.c.ltv)}</div></div>${assign}</div>
    ${!cur.c.advisor ? '<div class="banner paused"><b>New number</b><span>WhatsApp created this client automatically. Pick their Sales staff above — they own the chat from now on and are notified of new messages.</span></div>' : ''}
    ${openG ? `<div class="banner paused"><b>Complaint open</b><span>${esc(openG.code)} — ${esc(CAT[openG.category])}. Marketing to this client is paused; service replies are fine. <a href="#/grievances/${openG.id}"><u>Open case</u></a></span></div>` : ''}
    <div class="thread">${cur.ms.map(m => `<div class="msg ${m.direction}">${esc(m.body)}<time>${when(m.at)}${m.direction === 'out' ? ' · ' + esc(m.by || advName(cur.c)) : ''}</time></div>${m.card ? captureCard(m) : ''}`).join('')}</div>
    ${composer}</div>` : '';
  if (kind() === 'advisor') return cur ? `<a class="small muted" href="#/inbox">← All chats</a><div style="margin-top:12px">${thread}</div>` : `<h2>WhatsApp</h2><p class="why">Every message is read by AI first — you only approve.</p>${list}`;
  return `<div class="page-h"><h1>WhatsApp inbox</h1><span class="muted small">One number for the whole brand: ${WA_NUMBER}</span></div>
    <p class="help" style="margin:-10px 0 14px">Every message to Vaarahi's WhatsApp lands here and is read by AI first. Each chat belongs to the client's Sales staff — managers can assign or reassign it right here. Anyone allowed can reply; it always goes out from the brand number, and their Sales staff are told.</p>
    <div class="inbox2"><div class="card">${list}</div><div class="card">${thread || '<div class="empty">Pick a conversation.</div>'}</div></div>`;
}

// ---------------------------------------------------------------- clients
function customers() {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const mine = D.customers.filter(inScope);
  const counts = group(mine, c => c.tier);
  // campaign audience (D28): liked in store, never bought
  const likes = Object.fromEntries(mine.map(c => [c.id, interestOf(c.id)]).filter(([, l]) => l.length));
  const aud = tierFilter === 'instore', collsOf = cid => [...new Set(likes[cid].map(pid => P[pid].collection))];
  const collCount = aud ? Object.entries(group(Object.keys(likes).flatMap(cid => collsOf(cid).map(k => [k, cid])), ([k]) => k)).map(([k, xs]) => [k, xs.length]).sort((a, b) => b[1] - a[1]) : [];
  const rows = mine.filter(c => aud ? likes[c.id] && (audColl === 'all' || collsOf(c.id).includes(audColl)) : tierFilter === 'all' || c.tier === tierFilter)
    .filter(c => !q || c.name.toLowerCase().replace(/\s+/g, '').includes(q) || c.phone.includes(q) || c.code.toLowerCase().includes(q))
    .sort((a, b) => aud ? likes[b.id].length - likes[a.id].length : (b.created || '').localeCompare(a.created || '') || b.spend12 - a.spend12 || b.ltv - a.ltv);
  const reachable = rows.filter(c => !mktBlock(c) && !c.dnc).length;
  return `<div class="page-h"><div><div class="kicker">${mine.length.toLocaleString('en-IN')} clients</div><h1>Clients</h1></div>
      <div class="row-flex"><input id="q" class="in" style="width:300px" placeholder="Search name, phone or client code" value="${esc(query)}">${FLOOR.includes(kind()) ? '' : '<button class="btn primary" data-act="add-client">+ Add client</button>'}</div></div>
    <div class="tabs-inline">${['all', 'vip', 'premium', 'regular', 'prospect'].map(t => `<button class="${tierFilter === t ? 'on' : ''}" data-act="tier-filter" data-id="${t}">${t === 'all' ? 'All' : TIER[t]} <span class="muted small">${t === 'all' ? mine.length : (counts[t] || []).length}</span></button>`).join('')}<button class="${aud ? 'on' : ''}" data-act="tier-filter" data-id="instore">Liked in store, not bought <span class="muted small">${Object.keys(likes).length}</span></button></div>
    ${aud ? `<p class="help" style="margin:-6px 0 10px">Clients who liked pieces in store and haven't bought them — the audience for a collection campaign. Marketing only reaches clients who agreed to WhatsApp updates and have no open complaint: <b>${reachable} of ${rows.length}</b> here can receive it now.</p>
      <div class="chips" style="margin-bottom:14px"><button class="chip ${audColl === 'all' ? 'vip' : 'on'}" data-act="aud-coll" data-id="all">All collections</button>${collCount.map(([k, n]) => `<button class="chip ${audColl === k ? 'vip' : 'on'}" data-act="aud-coll" data-id="${esc(k)}">${esc(k)} · ${n}</button>`).join('')}</div>`
    : `<p class="help" style="margin:-6px 0 12px">Tiers are automatic: VIP from ${inr(SETTINGS.tiers.vip)} and Premium from ${inr(SETTINGS.tiers.premium)} spent in the last 12 months.${isDirector() ? ' <a href="#/settings/tiers"><u>Change</u></a>' : ''}</p>`}
    <div class="card"><div class="list" id="clist">${rows.slice(0, 60).map(c => `<a class="row" href="#/customer/${c.id}">${avatar(c)}<div class="grow"><span class="name">${esc(c.name)}</span> ${tier(c)}${c.created ? ' <span class="chip good">new</span>' : ''}<div class="why">${aud ? `Liked ${likes[c.id].length}: ${esc(collsOf(c.id).join(', '))}${mktBlock(c) ? ` · <span class="sev-high">${mktBlock(c)}</span>` : ''}` : `${esc(storeName(c.store))} · ${c.n} purchases · last ${c.last_buy ? dFmt(c.last_buy) : '—'}${paused(c.id) ? ' · <span class="sev-high">marketing paused</span>' : ''}`}</div></div><b>${inr(c.spend12)}</b></a>`).join('') || '<div class="empty">No matches.</div>'}</div></div>`;
}
const advOptions = (st, sel) => advisorsAt(st).map(a => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${esc(a.name)}</option>`).join('');
function clientForm(cid) {
  const c = cid ? C[cid] : null, st = c ? c.store : myStore(), assign = kind() !== 'advisor';
  const ds = c ? D.dates[c.id] || [] : [], anniv = (ds.find(d => d[0] === 'anniversary') || [])[2] || '';
  const sal = c ? c.name.split(' ')[0] : 'Mrs.';
  openModal(`<h2>${c ? 'Edit ' + esc(c.first) : 'Add a client'}</h2>
    <p class="why">${c ? 'Change anything and save.' : 'For walk-ins: only name and mobile are needed — add the rest later. Clients who WhatsApp you or buy at the counter are added automatically.'}</p>
    <form id="f" class="form" onsubmit="return false">
      <div class="two"><div class="field"><label>Title</label><select class="in" name="sal">${['Mrs.', 'Ms.', 'Mr.', 'Dr.'].map(s => `<option ${s === sal ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="field"><label>Full name *</label><input class="in" name="name" value="${c ? esc((c.first + ' ' + c.last).trim()) : ''}" placeholder="e.g. Lakshmi Reddy"></div></div>
      <div class="field"><label>Mobile *</label><input class="in" id="f-phone" name="phone" inputmode="tel" value="${c ? esc(digits10(c.phone)) : ''}" placeholder="10-digit mobile" data-self="${c ? c.id : ''}"><div id="dup"></div></div>
      ${c ? '' : `<div class="field"><label>How did they come to us?</label><div class="chips">${chipRadio('source', ['Walk-in', 'Referral', 'WhatsApp', 'Instagram', 'Event', 'Google'], 'Walk-in')}</div></div>`}
      <div class="two"><div class="field"><label>Branch</label><select class="in" name="store" ${assign ? '' : 'disabled'}>${D.stores.map(s => `<option value="${s.code}" ${s.code === st ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Sales staff</label><select class="in" name="advisor" id="f-adv" ${assign ? '' : 'disabled'}>${advOptions(st, c ? c.advisor : kind() === 'advisor' ? me().id : '')}</select></div></div>
      <details ${c ? 'open' : ''}><summary class="small muted" style="cursor:pointer">More details (optional)</summary>
        <div class="form"><div class="two"><div class="field"><label>Birthday</label><input class="in" type="date" name="dob" value="${c && c.dob ? c.dob : ''}"></div>
          <div class="field"><label>Anniversary</label><input class="in" type="date" name="anniv" value="${anniv}"></div></div>
          <div class="field"><label>Email</label><input class="in" name="email" value="${c && c.email ? esc(c.email) : ''}"></div>
          ${c ? '' : `<div class="field"><label>Interested in</label><div class="chips">${chipChecks('likes', ['Kanchi Pattu', 'Banarasi', 'Paithani', 'Patola', 'Gadwal Pattu', 'Organza'])}</div></div>`}</div></details>
      ${c && kind() !== 'advisor' ? `<div class="field"><label>Client tier</label><select class="in" name="tier_mode"><option value="auto">Automatic — ${TIER[ruleTier(c)]} (${inr(c.spend12)} in 12 months)</option>${['vip', 'premium', 'regular'].map(t => `<option value="${t}" ${c.override && c.override.tier === t ? 'selected' : ''}>Set manually: ${TIER[t]}</option>`).join('')}</select>
        <input class="in" name="tier_reason" style="margin-top:6px" placeholder="Reason if set manually, e.g. daughter of a VIP client" value="${c.override ? esc(c.override.reason) : ''}">
        <div class="hint">Tiers update automatically on the 1st of each month. A manual tier stays until you switch back to automatic.</div></div>` : ''}
      ${formBtns(c ? 'save-client' : 'save-new-client', c ? 'Save changes' : 'Add client', c ? c.id : '')}
    </form>`);
}
const findByPhone = (d10, except) => D.customers.find(x => x.id !== except && digits10(x.phone) === d10);
function saveNewClient() {
  const f = fd(), name = (f.get('name') || '').trim(), d10 = digits10(f.get('phone'));
  if (!name || d10.length !== 10) return formError('Please enter the name and a 10-digit mobile number.');
  const dup = findByPhone(d10);
  if (dup) return formError(`This number already belongs to ${dup.name}. Open their profile instead of adding them twice.`);
  const store = f.get('store') || myStore(), advisor = f.get('advisor') || (kind() === 'advisor' ? me().id : advisorsAt(store)[0].id);
  const [first, ...rest] = name.split(/\s+/);
  const c = { id: 'cus_new' + Date.now(), code: 'VS-C' + String(D.customers.length + 1).padStart(5, '0'), name: `${f.get('sal')} ${name}`, first, last: rest.join(' '),
    phone: '+91' + d10, email: f.get('email') || null, tier: 'prospect', store, advisor, channel: 'whatsapp', lang: 'Telugu', dob: f.get('dob') || null,
    status: 'active', consent_wa: true, dnc: false, source: (f.get('source') || 'Walk-in').toLowerCase(), ltv: 0, n: 0, first_buy: null, last_buy: null, spend12: 0, created: D.now };
  D.customers.push(c); C[c.id] = c;
  f.getAll('likes').forEach(v => (D.prefs[c.id] ||= []).push(['weave', v, 'stated', true]));
  if (f.get('dob')) (D.dates[c.id] ||= []).push(['birthday', 'self', f.get('dob')]);
  if (f.get('anniv')) (D.dates[c.id] ||= []).push(['anniversary', 'self', f.get('anniv')]);
  const took = secs(); closeModal(); tabState = 'owns'; location.hash = '#/customer/' + c.id;
  toast(`${c.name} added in ${took} s`, [`In ${E[advisor].name}'s client book · ${storeName(store)}`, 'Tier: Prospect — moves up automatically after their first purchase', 'Checked: no other client has this mobile number', f.getAll('likes').length ? `Interests saved: ${f.getAll('likes').join(', ')}` : null]);
}
function saveClient(cid) {
  const c = C[cid], f = fd(), name = (f.get('name') || '').trim(), d10 = digits10(f.get('phone'));
  if (!name || d10.length !== 10) return formError('Please enter the name and a 10-digit mobile number.');
  const dup = findByPhone(d10, cid);
  if (dup) return formError(`This number already belongs to ${dup.name}.`);
  const [first, ...rest] = name.split(/\s+/), changes = [];
  if (c.name !== `${f.get('sal')} ${name}`) changes.push('Name updated');
  if (digits10(c.phone) !== d10) changes.push('Mobile updated');
  Object.assign(c, { name: `${f.get('sal')} ${name}`, first, last: rest.join(' '), phone: '+91' + d10, email: f.get('email') || null, dob: f.get('dob') || null });
  if (f.get('store') && f.get('store') !== c.store) { c.store = f.get('store'); changes.push(`Branch → ${storeName(c.store)}`); }
  if (f.get('advisor') && f.get('advisor') !== c.advisor) { c.advisor = f.get('advisor'); changes.push(`Sales staff → ${E[c.advisor].name}`); }
  const ds = (D.dates[cid] ||= []), an = ds.find(d => d[0] === 'anniversary');
  if (f.get('anniv')) { if (an) an[2] = f.get('anniv'); else ds.push(['anniversary', 'self', f.get('anniv')]); }
  const mode = f.get('tier_mode');
  if (mode) {
    const before = c.tier;
    c.override = mode === 'auto' ? null : { tier: mode, reason: f.get('tier_reason') || '', by: me().name, at: TODAY };
    retier();
    if (c.tier !== before) changes.push(`Tier → ${TIER[c.tier]}${c.override ? ' (set manually)' : ' (automatic)'}`);
  }
  closeModal(); toast('Saved', changes.length ? changes : ['Details saved']); render();
}
function customer(id) {
  const c = C[id];
  if (!c) return '<div class="empty">Client not found.</div>';
  if (!canOpen(c)) return `<div class="card"><h3>Not in your view</h3><p class="why">This client belongs to another Sales staff member. Access follows each role's data scope (set by the director).</p></div>`;
  const orders = (ORD_C[id] || []).slice().sort((a, b) => b.at.localeCompare(a.at));
  const todayElsewhere = orders.find(o => o.at.startsWith(TODAY) && o.store !== myStore());
  const openG = D.grievances.find(g => g.customer_id === id && isOpen(g));
  const next = D.followups.filter(f => f.customer_id === id && f.status !== 'done').sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
  const owned = D.owned[id] || [], prefs = D.prefs[id] || [], wants = D.demand.filter(d => d.customer_id === id && ['waiting', 'notified'].includes(d.status));
  const opps = D.opps.filter(o => o.customer_id === id);
  const visits = VISITS.filter(v => v.customer_id === id).sort((a, b) => b.arrived_at.localeCompare(a.arrived_at));
  const tabs = [['owns', `Owns (${owned.length})`], ['store', `In store (${visits.length})`], ['opps', `Opportunities (${opps.length})`], ['wants', 'Wants'], ['timeline', 'Timeline'], ['family', 'Family'], ['dates', 'Dates']];
  let body = '';
  if (tabState === 'owns') body = owned.length ? `<div class="pgrid">${owned.slice().reverse().slice(0, 24).map(([aid, pid, from, st, sm]) => pcard(P[pid], `<div class="small muted">Silk Mark ${esc(sm)}<br>${dFmt(from)} · ${esc(storeName(st))}<br>Warranty till ${dFmt(new Date(dt(from).getTime() + 365 * 864e5).toISOString().slice(0, 10))}</div>`)).join('')}</div>` : '<div class="empty">No pieces yet.</div>';
  if (tabState === 'store') {
    const marked = k => new Set(visits.flatMap(v => v.items.filter(i => i.mark === k).map(i => i.product_id))).size, likes = interestOf(id);
    body = visits.length ? `<div class="kv" style="margin-bottom:18px">${[['Interested, not bought', likes.length], ['Already has', marked('owns')], ['Bought in store', marked('bought')], ['Said no', marked('no')]].map(([l, n]) => `<div><span>${l}</span><b>${n}</b></div>`).join('')}</div>
      ${likes.length ? `<div class="kicker">Interested, not bought — for follow-ups and campaigns</div><div class="pgrid" style="margin:10px 0 20px">${likes.slice(0, 12).map(pid => pcard(P[pid], `<div class="small muted">${esc(P[pid].collection)}</div>`)).join('')}</div>` : ''}
      <div class="kicker">Visits</div><div class="list">${visits.map(v => `<div class="row"><div class="grow"><a class="name" href="#/visit/${v.id}">${when(v.arrived_at)} · ${esc(storeName(v.store))}</a> <span class="chip ${v.order_id ? 'good' : ''}">${v.order_id ? 'Bought ' + inr(orderOf(v).total) : v.status === 'done' ? 'Left without buying' : VSTATUS[v.status]}</span>
        <div class="why">Allocated by ${esc((E[v.allocated_by] || {}).name || '—')}${v.consultant_id ? ' · consultant ' + esc(E[v.consultant_id].name) : ''} · looking for ${esc(v.looking_for.join(', ') || '—')}${v.budget ? ' · ' + esc(v.budget) : ''}</div>
        <div class="chips" style="margin-top:6px">${v.items.map(i => `<span class="chip ${MARK_CHIP[i.mark]}">${esc(pname(i.product_id))} · ${MARK[i.mark]}</span>`).join('')}</div></div></div>`).join('')}</div>`
      : '<div class="empty">No in-store visits yet.</div>';
  }
  if (tabState === 'opps') body = `<div class="row-flex" style="justify-content:flex-end;margin-bottom:8px"><button class="btn sm primary" data-act="add-opp" data-id="${id}">+ New opportunity</button></div>${opps.length ? `<div class="list">${opps.map(o => `<div class="row"><div class="grow"><b>${esc(o.title)}</b><div class="why">${esc(STAGE[o.stage] || o.stage)} · expected ${dFmt(o.expected_close_on)} · ${esc(E[o.advisor_id].name)}</div></div><b>${inr(o.value)}</b></div>`).join('')}</div>` : '<div class="empty">No opportunities yet.</div>'}`;
  if (tabState === 'wants') body = `${wants.length ? `<div class="kicker">Waiting list</div><div class="list">${wants.map(d => `<div class="row">${P[d.product_id] ? miniProduct(P[d.product_id]) : ''}<span class="chip ${d.status === 'notified' ? 'good' : ''}">${d.status === 'notified' ? 'In stock — Sales staff alerted' : 'Waiting since ' + dFmt(d.requested_on)}</span></div>`).join('')}</div>` : ''}
    <div class="kicker" style="margin-top:14px">Preferences</div><div class="list">${prefs.map(([k, v, src, ok], i) => `<div class="row"><div class="grow"><b>${esc(k.replace('size_', 'Size · ').replace('_', ' '))}</b>: ${esc(v)}<div class="why">${src === 'purchase' ? 'From purchases' : src === 'stated' ? 'Said by client' : src === 'in_store' ? 'Liked in store' : 'Suggested by AI'}</div></div>${ok ? '<span class="chip good">Approved</span>' : `<button class="btn sm" data-act="ok-pref" data-id="${id}|${i}">Approve</button>`}</div>`).join('') || '<div class="empty">None yet.</div>'}</div>`;
  if (tabState === 'timeline') {
    const items = [...orders.map(o => ({ at: o.at, html: `<b>Bought</b> ${o.prods.map(p => esc(P[p].name)).join(', ')} · ${esc(storeName(o.store))} · <b>${inr(o.total)}</b><div class="why">Invoice ${esc(o.inv)} · ${o.tally ? 'Tally ✓ synced' : 'Tally: syncing (bridge runs every 1–2 min)'}</div>` })),
      ...D.whatsapp.filter(m => m.customer_id === id).map(m => ({ at: m.at, html: `<b>WhatsApp ${m.direction === 'in' ? 'from client' : 'reply'}</b> — ${esc(m.body)}` })),
      ...D.grievances.filter(g => g.customer_id === id).map(g => ({ at: g.created_at, html: `<b>Complaint</b> <a href="#/grievances/${g.id}"><u>${esc(g.code)}</u></a> ${esc(CAT[g.category])} · ${chBadges(g)} ${slaText(g)}` }))]
      .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
    body = items.length ? `<div class="list tl">${items.map(i => `<div class="row"><span class="dot"></span><div class="grow">${i.html}<div class="small muted">${when(i.at)}</div></div></div>`).join('')}</div>` : '<div class="empty">Nothing yet.</div>';
  }
  if (tabState === 'family') { const h = D.households[id];
    body = h ? `<h3>${esc(h.name)}</h3><div class="list">${h.members.filter(([m]) => m !== id).map(([m, rel]) => `<a class="row" href="#/customer/${m}">${avatar(C[m])}<div class="grow"><span class="name">${esc(C[m].name)}</span><div class="why">${esc(rel)} · LTV ${inr(C[m].ltv)}</div></div></a>`).join('')}</div>` : '<div class="empty">No family linked yet.</div>'; }
  if (tabState === 'dates') body = (D.dates[id] || []).length ? `<div class="list">${D.dates[id].map(([k, who, d]) => `<div class="row"><div class="grow"><b>${esc(k)}</b> · ${esc(who)}</div><span>${d ? dFmt(d) : 'date to confirm'}</span></div>`).join('')}</div>` : '<div class="empty">No dates yet — add them with Edit details.</div>';
  return `<div class="stack">
    ${kind() === 'advisor' ? '' : '<a class="small muted" href="#/customers">← Clients</a>'}
    ${todayElsewhere ? `<div class="banner live"><b>Live</b><span>Bought today at <b>${esc(storeName(todayElsewhere.store))}, ${tFmt(todayElsewhere.at)}</b> — ${todayElsewhere.prods.map(p => esc(P[p].name)).join(', ')} (${inr(todayElsewhere.total)}). Visible here within seconds of the sale; no end-of-day sync.</span></div>` : ''}
    ${openG ? `<div class="banner paused"><b>Marketing paused</b><span>Open complaint ${esc(openG.code)} — ${esc(CAT[openG.category])}. Campaigns resume automatically once it's resolved; service messages still go out. <a href="#/grievances/${openG.id}"><u>Open case</u></a></span></div>` : ''}
    <div class="c360-h">${avatar(c, 'lg')}<div class="grow"><h2>${esc(c.name)}</h2><div class="row-flex">${tier(c)}<span class="small muted">${esc(c.code)} · ${esc(storeName(c.store))} · Sales staff ${esc(advName(c))}</span></div><div class="help" style="margin-top:4px">${tierWhy(c)}</div></div></div>
    ${FLOOR.includes(kind()) ? (() => { const open = visits.find(v => v.status !== 'done'); return open ? `<div class="actbar"><a class="btn primary" href="#/visit/${open.id}">Open today's visit</a></div>` : ''; })() : `<div class="actbar"><button class="btn primary" data-act="quick" data-id="${id}">Quick update</button><button class="btn" data-act="edit-client" data-id="${id}">Edit details</button><button class="btn" data-act="add-opp" data-id="${id}">+ Opportunity</button><button class="btn" data-act="book-appt" data-id="${id}">Book appointment</button><a class="btn" href="#/inbox/${id}">WhatsApp</a></div>`}
    <div class="card kv"><div><span>Last 12 months</span><b>${inr(c.spend12)}</b></div><div><span>Lifetime value</span><b>${inr(c.ltv)}</b></div><div><span>Purchases</span><b>${c.n}</b></div><div><span>Mobile</span><b>${esc(c.phone.replace('+91', '+91 '))}</b></div></div>
    ${next ? `<div class="card" style="border-color:var(--ge-accent)"><div class="kicker">Next step</div><div class="row-flex" style="justify-content:space-between"><div><b>${ACT[next.action] || 'Follow up'}</b> — ${dFmt(next.due_at)}<div class="why">Why: ${esc(next.reason_text)}</div></div><button class="btn primary sm" data-act="done-fu" data-id="${next.id}">Done</button></div></div>` : ''}
    <div class="card"><div class="tabs-inline">${tabs.map(([k, l]) => `<button class="${tabState === k ? 'on' : ''}" data-act="tab" data-id="${k}">${l}</button>`).join('')}</div>${body}</div>
  </div>`;
}

// quick-update sheet (< 30 s target, instrumented)
let qStart = 0, qCust = null;
function quickSheet(cid) {
  qStart = Date.now(); qCust = cid;
  const c = C[cid], weaves = [...new Set((D.prefs[cid] || []).filter(p => p[0] === 'weave').map(p => p[1]))].slice(0, 3);
  const grp = (t, opts) => `<div class="grp"><div class="kicker">${t}</div><div class="chips">${opts.map(o => `<label class="chip on"><input type="checkbox" data-q="${esc(t)}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</div></div>`;
  document.getElementById('overlay').innerHTML = `<div class="ov" data-act="q-close"><div class="sheet">
    <div class="row-flex" style="justify-content:space-between"><h3>Update ${esc(c.first)}</h3><button class="btn sm ghost" data-act="q-close">Close</button></div>
    <p class="why">Speak or tap — no typing needed.</p>
    <button class="voice" data-act="voice">🎙 Hold to speak — AI fills the fields</button><div id="heard" class="why" style="margin-top:6px"></div>
    ${grp('Interested in', [...weaves, 'Paithani', 'Banarasi'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5))}
    ${grp('Occasion', ['Anniversary', 'Wedding', 'Festival', 'Birthday'])}
    ${grp('Budget', ['Up to ₹25K', '₹25–50K', '₹50–80K', '₹80K–1.5L', '₹1.5L+'])}
    ${grp('Next step', ['Call tomorrow', 'WhatsApp photos', 'Book a visit', 'No action'])}
    <div class="grp"><button class="btn primary" style="width:100%" data-act="q-save">Save</button></div></div></div>`;
}
function voice() {
  document.getElementById('heard').textContent = 'Listening…';
  setTimeout(() => {
    document.getElementById('heard').innerHTML = '“Loved the Paithani, anniversary is on 24 October, budget fifty to eighty, call Saturday.”';
    document.querySelectorAll('[data-q]').forEach(i => { i.checked = ['Paithani', 'Anniversary', '₹50–80K', 'Call tomorrow'].includes(i.value); });
  }, 1200);
}
function qSave() {
  const picked = [...document.querySelectorAll('[data-q]:checked')].map(i => [i.dataset.q, i.value]);
  const took = Math.max(1, Math.round((Date.now() - qStart) / 1000)), c = C[qCust];
  picked.filter(([g]) => g === 'Interested in').forEach(([, v]) => (D.prefs[qCust] ||= []).push(['weave', v, 'stated', true]));
  const nxt = picked.find(([g]) => g === 'Next step');
  if (nxt && nxt[1] !== 'No action') D.followups.push({ id: 'fu-q' + Date.now(), customer_id: qCust, trigger: 'manual', reason_text: `Quick update: ${picked.map(p => p[1]).join(', ')}`, action: nxt[1].startsWith('Call') ? 'call' : 'whatsapp', due_at: plus(1) + 'T11:00:00+05:30', owner_id: c.advisor || me().id, status: 'open' });
  closeModal();
  toast(`Saved in ${took} s`, [`${picked.length} details saved to ${c.first}'s profile`, nxt && nxt[1] !== 'No action' ? `Follow-up set: ${nxt[1]}` : 'No follow-up needed', 'Timeline updated · manager view updated', `Target for this screen: under 30 s ${took < 30 ? '✓' : ''}`]);
  render();
}

// ---------------------------------------------------------------- opportunities
const clientPicker = () => `<div class="field"><label>Client *</label><input class="in" name="cname" list="cdl" placeholder="Start typing a name or mobile"><datalist id="cdl">${D.customers.filter(inScope).map(c => `<option value="${esc(c.name)} · ${digits10(c.phone)}">`).join('')}</datalist></div>`;
function pickedClient(f) { if (f.get('cid')) return C[f.get('cid')]; const d10 = digits10((f.get('cname') || '').split('·').pop()); return d10.length === 10 ? findByPhone(d10) : null; }
function oppForm(cid) {
  const pre = cid ? C[cid] : null;
  openModal(`<h2>New opportunity</h2><p class="why">Something a client is likely to buy — it goes into the pipeline, so nobody forgets to follow up.</p>
    <form id="f" class="form" onsubmit="return false">
      ${pre ? `<div class="field"><label>Client</label><div><b>${esc(pre.name)}</b> ${tier(pre)}</div><input type="hidden" name="cid" value="${pre.id}"></div>`
        : clientPicker()}
      <div class="field"><label>What is it for? *</label><input class="in" name="title" placeholder="e.g. Daughter's wedding sarees (November)">
        <div class="chips" style="margin-top:6px">${['Wedding', 'Engagement', 'Festival', 'Anniversary gift', 'Half-saree ceremony'].map(o => `<button class="chip on" type="button" data-act="fill-title" data-id="${o}">${o}</button>`).join('')}</div></div>
      <div class="two"><div class="field"><label>Expected value (₹) *</label><input class="in" name="value" inputmode="numeric" placeholder="e.g. 150000"></div>
        <div class="field"><label>Expected by *</label><input class="in" type="date" name="date" value="${plus(14)}"></div></div>
      <div class="two"><div class="field"><label>Stage</label><select class="in" name="stage">${['enquiry', 'shortlisted', 'trial_viewing', 'negotiation'].map(k => `<option value="${k}">${STAGE[k]}</option>`).join('')}</select></div>
        <div class="field"><label>Next step</label><input class="in" name="next" placeholder="e.g. Book a trial"></div></div>
      ${formBtns('save-opp', 'Add to pipeline')}
    </form>`, !pre);
}
function saveOpp() {
  const f = fd(), c = pickedClient(f);
  const value = Number(String(f.get('value') || '').replace(/[^\d]/g, ''));
  if (!c) return formError('Pick the client from the list.');
  if (!f.get('title') || !value) return formError('Please fill in what it is for and the expected value.');
  const o = { id: 'opp_new' + Date.now(), customer_id: c.id, title: f.get('title'), stage: f.get('stage'), advisor_id: c.advisor || me().id, store_id: 'sto_' + c.store,
    value, expected_close_on: f.get('date'), next_action: f.get('next') || 'Follow up', last_activity_at: D.now };
  D.opps.push(o);
  D.followups.push({ id: 'fu-o' + Date.now(), customer_id: c.id, trigger: 'manual', reason_text: `Opportunity: ${o.title} (${inr(value)})`, action: 'call', due_at: plus(2) + 'T11:00:00+05:30', owner_id: o.advisor_id, status: 'open' });
  const days = Math.round((dt(o.expected_close_on) - NOW) / 864e5);
  closeModal(); tabState = 'opps';
  toast('Added to the pipeline', [`${o.title} — ${inr(value)} for ${c.name}`, `Shows under "${days <= 0 ? 'Due today' : days <= 7 ? 'This week' : 'This month'}" in Pipeline`, `Follow-up reminder set for ${E[o.advisor_id].name}`]);
  render();
}

// ---------------------------------------------------------------- product, inventory, stock
function product(id) {
  const p = P[id];
  if (!p) return '<div class="empty">Product not found.</div>';
  const waiting = D.demand.filter(d => d.product_id === id && d.status === 'waiting');
  const rows = D.stores.map(s => `<tr><td>${esc(s.name)}</td><td>${(D.stock[id] || {})[s.code] || 0}</td></tr>`).join('');
  return `<div class="grid g2">
    <div class="gallery">${pimg(p, 900)}<div class="side-imgs">${(p.img || []).slice(1, 3).map(u => `<img loading="lazy" src="${img(u, 500)}" alt="">`).join('')}</div></div>
    <div class="stack"><div><div class="kicker">${esc(p.collection)}</div><h1>${esc(p.name)}</h1><div class="rule"></div>
      <div class="row-flex"><h2>${inr(p.price)}</h2>${p.mrp > p.price ? `<span class="muted"><s>${inr(p.mrp)}</s></span>` : ''}<span class="small muted">Cost ${cost(p)}${maskCost() ? ' <span class="chip">hidden for your role</span>' : ''}</span></div></div>
      <div class="card kv" style="grid-template-columns:repeat(3,1fr)"><div><span>Colour</span><b>${esc(p.colour || '—')}</b></div><div><span>Zari</span><b>${esc(p.zari)}</b></div><div><span>Tracking</span><b>${p.serial ? 'Each piece (Silk Mark)' : 'By quantity'}</b></div></div>
      <div class="card"><div class="kicker">Stock by branch</div><table class="t">${rows}</table></div>
      ${waiting.length ? `<div class="card"><div class="kicker">${waiting.length} clients waiting for this</div><div class="list">${waiting.map(d => `<a class="row" href="#/customer/${d.customer_id}">${avatar(C[d.customer_id])}<span class="grow">${esc(C[d.customer_id].name)} <span class="small muted">· ${esc(storeName(C[d.customer_id].store))}</span></span><span class="small muted">since ${dFmt(d.requested_on)}</span></a>`).join('')}</div></div>` : ''}
      <div class="row-flex"><button class="btn primary" data-act="share" data-id="${id}">Share on WhatsApp</button><button class="btn" data-act="reserve" data-id="${id}">Reserve</button>${p.url && p.url !== '#' ? `<a class="btn ghost" href="${p.url}" target="_blank" rel="noopener">View on website ↗</a>` : ''}</div>
    </div></div>`;
}
function inventory(arg) {
  if (arg === 'catalogue') return catalogue();
  const st = arg || invStore || (kind() === 'owner' ? 'JBH' : myStore()); invStore = st;
  const items = D.products.filter(p => ((D.stock[p.id] || {})[st] || 0) > 0).sort((a, b) => (b.added || '').localeCompare(a.added || '') || b.price - a.price);
  const pos = D.po.filter(p => code(p.store_id) === st && p.status !== 'received');
  return `<div class="page-h"><div><div class="kicker">Inventory</div><h1>${esc(storeName(st))}</h1></div><div class="row-flex"><span class="muted small">${items.length} designs in stock</span>${kind() === 'consultant' ? '' : '<button class="btn" data-act="add-design">+ New design</button><button class="btn primary" data-act="add-stock">+ Add stock</button>'}</div></div>
    <p class="help" style="margin:-10px 0 14px">Stock counts arrive automatically from your POS. Use <b>Add stock</b> for new arrivals or anything the POS doesn't have — pure silk is tagged piece by piece.</p>
    <div class="tabs-inline"><a href="#/inventory/catalogue">All designs</a>${D.stores.map(s => `<a class="${s.code === st ? 'on' : ''}" href="#/inventory/${s.code}">${esc(s.name)}</a>`).join('')}</div>
    ${pos.map(po => { const lines = D.po_lines.filter(l => l.po_id === po.id); const waiting = lines.reduce((n, l) => n + D.demand.filter(d => d.product_id === l.product_id && d.status === 'waiting').length, 0);
      return `<div class="card" style="border-color:var(--ge-accent);margin-bottom:20px"><div class="row-flex" style="justify-content:space-between"><div><div class="kicker">Delivery expected today · ${esc(po.po_no)} · ${esc((D.vendors[0] || {}).name || '')}</div>
        ${lines.map(l => `<div class="mini" style="margin-top:8px">${pimg(P[l.product_id], 160)}<span><b>${l.qty} × ${esc(P[l.product_id].name)}</b><br><span class="small muted">${waiting} clients are waiting for this saree</span></span></div>`).join('')}</div>
        <button class="btn primary" data-act="rx-open" data-id="${po.id}">Receive shipment</button></div>
        <p class="help" style="margin-top:10px">When the parcel arrives: count it, scan each piece's Silk Mark tag, confirm. Stock updates and waiting clients' Sales staff are alerted.</p></div>`; }).join('')}
    <div class="pgrid">${items.slice(0, 48).map(p => pcard(p, `<div class="small muted">${(D.stock[p.id] || {})[st]} in stock${p.added ? ' · <b>just added</b>' : ''}</div>`)).join('')}</div>`;
}
function catalogue() {
  const colls = [...new Set(D.products.map(p => p.collection))].sort(), q = catQ.toLowerCase();
  const items = D.products.filter(p => (catColl === 'all' || p.collection === catColl) && (!q || p.name.toLowerCase().includes(q))).sort((a, b) => (b.added || '').localeCompare(a.added || '') || b.price - a.price);
  const total = p => Object.values(D.stock[p.id] || {}).reduce((s, n) => s + n, 0);
  return `<div class="page-h"><div><div class="kicker">Catalogue</div><h1>All designs</h1></div><div class="row-flex"><span class="muted small">${D.products.length} designs · ${colls.length} collections</span><button class="btn primary" data-act="add-design">+ New design</button></div></div>
    <p class="help" style="margin:-10px 0 14px">Every design you sell, for all branches. Add new arrivals here with their collection and photos; pieces per branch come from your POS or from Add stock. (Once connected, new designs can also flow in from your POS or website automatically.)</p>
    <div class="tabs-inline"><a class="on" href="#/inventory/catalogue">All designs</a>${D.stores.map(s => `<a href="#/inventory/${s.code}">${esc(s.name)}</a>`).join('')}</div>
    <div class="row-flex" style="margin-bottom:16px"><input id="catq" class="in" style="width:280px" placeholder="Search designs" value="${esc(catQ)}"><select id="cat-coll" class="in" style="width:auto">${['all', ...colls].map(c => `<option value="${esc(c)}" ${c === catColl ? 'selected' : ''}>${c === 'all' ? 'All collections' : esc(c)}</option>`).join('')}</select></div>
    <div class="pgrid">${items.slice(0, 60).map(p => pcard(p, `<div class="small muted">${esc(p.collection)} · ${total(p)} in stock${p.added ? ' · <b>new</b>' : ''}</div>`)).join('') || '<div class="empty">No designs match.</div>'}</div>`;
}
function designForm() {
  newImgs = [];
  const colls = [...new Set(D.products.map(p => p.collection))].sort();
  openModal(`<h2>New design for the catalogue</h2><p class="why">For new arrivals. Once saved, it shows for every branch, in stock, and in WhatsApp product matching.</p>
    <form id="f" class="form" onsubmit="return false">
      <div class="field"><label>Design name *</label><input class="in" name="name" placeholder="e.g. Peacock Blue Kanchi Pattu with Temple Border"></div>
      <div class="two"><div class="field"><label>Collection *</label><select class="in" name="coll" id="f-coll">${colls.map(c => `<option>${esc(c)}</option>`).join('')}<option value="__new">+ New collection…</option></select>
          <input class="in" name="newcoll" id="f-newcoll" placeholder="New collection, e.g. Dasara 2026" style="margin-top:6px;display:none"></div>
        <div class="field"><label>Colour</label><input class="in" name="colour" placeholder="e.g. peacock blue"></div></div>
      <div class="two"><div class="field"><label>Selling price (₹) *</label><input class="in" name="price" inputmode="numeric"></div>
        <div class="field"><label>Cost price (₹)</label><input class="in" name="cost" inputmode="numeric" placeholder="hidden from roles without cost access"></div></div>
      <div class="two"><div class="field"><label>Zari</label><select class="in" name="zari"><option>pure zari</option><option>tested zari</option><option>no zari</option></select></div>
        <div class="field"><label>How is it tracked?</label><select class="in" name="serial"><option value="1">Each piece (pure silk — Silk Mark tag)</option><option value="0">By quantity</option></select></div></div>
      <div class="field"><label>Photos</label><input type="file" id="f-photos" accept="image/*" multiple class="in" style="padding-top:10px"><div id="photoprev" class="row-flex" style="margin-top:8px"></div></div>
      <div class="two"><div class="field"><label>Opening stock at</label>${branchSelect('store', invStore || myStore())}</div><div class="field"><label>Pieces (optional)</label><input class="in" name="qty" type="number" min="0" value="0"></div></div>
      ${formBtns('save-design', 'Add to catalogue')}</form>`);
}
function saveDesign() {
  const f = fd(), name = (f.get('name') || '').trim(), price = Number(String(f.get('price') || '').replace(/[^\d]/g, ''));
  const isNewColl = f.get('coll') === '__new', coll = isNewColl ? (f.get('newcoll') || '').trim() : f.get('coll');
  if (!name || !price) return formError('Please add the design name and selling price.');
  if (!coll) return formError('Give the new collection a name.');
  if (D.products.some(p => p.name.toLowerCase() === name.toLowerCase())) return formError('This design is already in the catalogue — use Add stock for more pieces.');
  const p = { id: 'prd_new' + Date.now(), name, price, mrp: price, cost: Number(String(f.get('cost') || '').replace(/[^\d]/g, '')) || Math.round(price * 0.58), collection: coll,
    colour: f.get('colour') || null, zari: f.get('zari'), img: newImgs.slice(), serial: f.get('serial') === '1', url: '#', added: D.now };
  D.products.push(p); P[p.id] = p;
  const qty = parseInt(f.get('qty'), 10) || 0;
  if (qty) addPieces(p, f.get('store'), qty);
  closeModal(); location.hash = '#/inventory/catalogue';
  toast('Design added to the catalogue', [`${name} · ${coll}${isNewColl ? ' (new collection)' : ''} · ${inr(price)}`, newImgs.length ? `${newImgs.length} photo${newImgs.length > 1 ? 's' : ''} saved` : 'No photo yet — add one later',
    qty ? `${qty} pieces in ${storeName(f.get('store'))}` : 'No stock yet — use Add stock when pieces arrive', 'Now shows in WhatsApp product matching for every branch']);
  render();
}
const branchSelect = (name, sel) => `<select class="in" name="${name}">${D.stores.map(s => `<option value="${s.code}" ${s.code === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>`;
let csvRows = [];
function stockForm() {
  const st = invStore || myStore();
  openModal(`<h2>Add stock</h2>
    <div class="tabs-inline" style="margin-top:8px"><button type="button" class="${stockMode === 'one' ? 'on' : ''}" data-act="stock-mode" data-id="one">One design</button><button type="button" class="${stockMode === 'file' ? 'on' : ''}" data-act="stock-mode" data-id="file">Upload a sheet</button></div>
    ${stockMode === 'one' ? `<form id="f" class="form" onsubmit="return false">
      <div class="field"><label>Saree *</label><input class="in" name="design" list="pdl" placeholder="Search your catalogue — or type a new design name"><datalist id="pdl">${D.products.map(p => `<option value="${esc(p.name)}">`).join('')}</datalist>
        <div class="hint">New design? <a href="#" data-act="add-design"><u>Add it to the catalogue</u></a> with its collection and photos — or just type the name here.</div></div>
      <div class="two"><div class="field"><label>Branch</label>${branchSelect('store', st)}</div><div class="field"><label>How many pieces? *</label><input class="in" name="qty" type="number" min="1" value="1"></div></div>
      <div class="field"><label>Silk Mark tags (one per line)</label><textarea class="in" name="tags" placeholder="Scan each tag — or leave blank for items counted by quantity"></textarea><div class="hint">Pure silk is tracked piece by piece, so each saree keeps its own history (owner, warranty, repairs).</div></div>
      <div class="field"><label>Price (₹) — only for a new design</label><input class="in" name="price" inputmode="numeric" placeholder="e.g. 45000"></div>
      ${formBtns('save-stock', 'Add to stock')}</form>`
    : `<p class="why" style="margin-top:10px">Save your Excel sheet as CSV with three columns: <b>saree name, branch, quantity</b>. The first row can be headings.</p>
      <div class="row-flex" style="margin-top:10px"><a class="btn sm" download="stock-template.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent('saree,branch,quantity\nNavy Blue Paithani Saree,Vijayawada,2\nRed Patola Saree,Jubilee Hills,1\n')}">Download a template</a></div>
      <input type="file" id="csv" accept=".csv,text/csv" class="in" style="padding-top:10px;margin-top:12px"><div id="csvprev" style="margin-top:12px"></div>`}`, stockMode === 'one');
}
function addPieces(p, st, qty) {
  (D.stock[p.id] ||= {})[st] = ((D.stock[p.id] || {})[st] || 0) + qty;
  p.added = D.now;
  const woken = D.demand.filter(d => d.product_id === p.id && d.status === 'waiting');
  woken.forEach(d => { d.status = 'notified'; d._fresh = true; });
  return woken;
}
function saveStock() {
  const f = fd(), name = (f.get('design') || '').trim(), qty = parseInt(f.get('qty'), 10), st = f.get('store');
  const tags = String(f.get('tags') || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
  if (!name || !(qty > 0)) return formError('Pick a saree and how many pieces.');
  if (tags.length && tags.length !== qty) return formError(`You entered ${tags.length} Silk Mark tags for ${qty} pieces — one tag per piece.`);
  let p = D.products.find(x => x.name.toLowerCase() === name.toLowerCase()), isNew = false;
  if (!p) {
    const price = Number(String(f.get('price') || '').replace(/[^\d]/g, ''));
    if (!price) return formError('This is a new design — please add its price.');
    p = { id: 'prd_new' + Date.now(), name, price, mrp: price, cost: Math.round(price * 0.58), collection: 'New arrival', colour: null, zari: '—', img: [], serial: tags.length > 0, url: '#' };
    D.products.push(p); P[p.id] = p; isNew = true;
  }
  const before = (D.stock[p.id] || {})[st] || 0, woken = addPieces(p, st, qty);
  closeModal(); location.hash = '#/inventory/' + st;
  toast('Stock added', [`${qty} × ${p.name} at ${storeName(st)} — stock ${before} → ${before + qty}`, isNew ? 'New design added to the catalogue (add a photo later)' : null,
    tags.length ? `${tags.length} Silk Mark tags recorded — each piece tracked` : 'Counted by quantity', woken.length ? `${woken.length} clients were waiting — their Sales staff are alerted` : 'No clients were waiting for this design']);
  render();
}
function parseCsv(text) {
  // ponytail: plain comma split, no quoted commas — fine for name,branch,qty sheets
  return text.split(/\r?\n/).map(l => l.split(',').map(s => s.trim())).filter(r => r.length >= 3 && r[0] && !/^saree$/i.test(r[0]))
    .map(([n, b, q]) => ({ n, b, q: parseInt(q, 10), p: D.products.find(x => x.name.toLowerCase() === n.toLowerCase() || x.id === n), st: (D.stores.find(s => s.name.toLowerCase() === b.toLowerCase() || s.code === b.toUpperCase()) || {}).code }));
}
function importCsv() {
  const ok = csvRows.filter(r => r.p && r.st && r.q > 0);
  let woken = 0; ok.forEach(r => { woken += addPieces(r.p, r.st, r.q).length; });
  closeModal(); toast(`Imported ${ok.length} rows`, [`${ok.reduce((s, r) => s + r.q, 0)} pieces added across ${new Set(ok.map(r => r.st)).size} branches`, csvRows.length - ok.length ? `${csvRows.length - ok.length} rows skipped — name or branch not recognised` : null, woken ? `${woken} waiting clients alerted` : null]);
  render();
}
let rx = null;
function rxOpen(poId) {
  const po = D.po.find(p => p.id === poId);
  rx = { po, step: 1, got: Object.fromEntries(D.po_lines.filter(l => l.po_id === poId).map(l => [l.id, l.qty])), tags: {} };
  rxRender();
}
function rxRender() {
  const lines = D.po_lines.filter(l => l.po_id === rx.po.id), st = code(rx.po.store_id);
  const bar = `<div class="steps-bar">${[1, 2, 3].map(i => `<span class="${rx.step >= i ? 'on' : ''}"></span>`).join('')}</div>`;
  let body = '';
  if (rx.step === 1) body = `<h2>1 · Check the delivery</h2><p class="why">Count what arrived against order ${esc(rx.po.po_no)}. Change the number if something is missing.</p>
    ${lines.map(l => `<div class="row-flex" style="justify-content:space-between;margin:14px 0"><div class="mini">${miniBody(P[l.product_id])}</div><div class="field" style="width:120px"><label>Arrived</label><input class="in" type="number" min="0" max="${l.qty}" data-rx-got="${l.id}" value="${rx.got[l.id]}"><div class="hint">ordered ${l.qty}</div></div></div>`).join('')}
    <div class="row-flex"><button class="btn primary" data-act="rx-next">Next: tag each piece</button><button class="btn ghost" data-act="close-modal">Cancel</button></div>`;
  if (rx.step === 2) {
    lines.forEach(l => { const n = rx.got[l.id]; rx.tags[l.id] = (rx.tags[l.id] || []).slice(0, n); while (rx.tags[l.id].length < n) rx.tags[l.id].push('SM' + Math.floor(1e7 + Math.random() * 9e7)); });
    body = `<h2>2 · Tag each piece</h2><p class="why">Scan the Silk Mark tag on each saree — shown here as if already scanned. This is what lets every piece keep its own history: who bought it, warranty, repairs.</p>
      <div class="form">${lines.map(l => rx.tags[l.id].map((t, i) => `<div class="field"><label>${esc(P[l.product_id].name)} — piece ${i + 1}</label><input class="in" data-rx-tag="${l.id}|${i}" value="${t}"></div>`).join('')).join('')}</div>
      <div class="row-flex" style="margin-top:16px"><button class="btn ghost" data-act="rx-back">Back</button><button class="btn primary" data-act="rx-next">Next: confirm</button></div>`;
  }
  if (rx.step === 3) {
    const waiting = lines.flatMap(l => D.demand.filter(d => d.product_id === l.product_id && d.status === 'waiting'));
    body = `<h2>3 · Confirm</h2><div class="list">${lines.map(l => { const now = (D.stock[l.product_id] || {})[st] || 0;
      return `<div class="row"><div class="grow"><b>${esc(P[l.product_id].name)}</b><div class="why">${esc(storeName(st))} stock: ${now} → <b>${now + rx.got[l.id]}</b> · tags ${rx.tags[l.id].join(', ')}</div></div></div>`; }).join('')}</div>
      ${waiting.length ? `<div class="kicker" style="margin-top:14px">${waiting.length} clients are waiting for this — their Sales staff will be alerted</div><div class="list">${waiting.map(d => { const c = C[d.customer_id];
        return `<div class="row">${avatar(c)}<div class="grow"><b>${esc(c.name)}</b><div class="why">${esc(storeName(c.store))} · Sales staff ${esc(advName(c))} · waiting since ${dFmt(d.requested_on)}</div></div></div>`; }).join('')}</div>` : ''}
      <div class="row-flex" style="margin-top:16px"><button class="btn ghost" data-act="rx-back">Back</button><button class="btn primary" data-act="rx-confirm">Confirm — add to stock</button></div>`;
  }
  openModal(bar + body, false);
}
function rxConfirm() {
  const lines = D.po_lines.filter(l => l.po_id === rx.po.id), st = code(rx.po.store_id);
  let woken = [];
  lines.forEach(l => { if (rx.got[l.id] > 0) woken = woken.concat(addPieces(P[l.product_id], st, rx.got[l.id])); });
  rx.po.status = 'received'; closeModal();
  toast(`Delivery received at ${storeName(st)}`, [...lines.map(l => `${rx.got[l.id]} × ${P[l.product_id].name} added — each with its Silk Mark tag`),
    woken.length ? `${woken.length} waiting clients — at ${[...new Set(woken.map(d => storeName(C[d.customer_id].store)))].join(', ')}` : 'Nobody was waiting for these',
    woken.length ? 'Their Sales staff see a "Wishlist match" on their home screen, offer ready to send' : null, 'Phase 2 adds AI ranking of who gets first choice']);
  render();
}

// ---------------------------------------------------------------- pipeline, targets
function pipeline(arg) {
  const tab = arg || 'week';
  const mine = D.opps.filter(o => !['won', 'lost'].includes(o.stage) && inScope(C[o.customer_id]));
  const lim = { today: TODAY, week: plus(7), month: '2026-09-30' }[tab];
  const rows = mine.filter(o => o.expected_close_on <= lim).sort((a, b) => a.expected_close_on.localeCompare(b.expected_close_on));
  const total = rows.reduce((s, o) => s + o.value, 0);
  return `<div class="page-h"><div><div class="kicker">Pipeline</div><h1>${inr(total)} closing ${tab === 'today' ? 'today' : tab === 'week' ? 'this week' : 'this month'}</h1></div><div class="row-flex"><span class="muted small">${rows.length} opportunities · overdue ones flagged</span><button class="btn primary" data-act="add-opp">+ New opportunity</button></div></div>
    <div class="tabs-inline">${[['today', 'Due today'], ['week', 'This week'], ['month', 'This month']].map(([k, l]) => `<a class="${tab === k ? 'on' : ''}" href="#/pipeline/${k}">${l}</a>`).join('')}</div>
    <div class="card"><div class="list">${rows.map(o => { const c = C[o.customer_id], late = o.expected_close_on < TODAY;
      return `<div class="row">${avatar(c)}<div class="grow"><a class="name" href="#/customer/${c.id}">${esc(c.name)}</a> ${tier(c)} ${late ? '<span class="chip bad">Overdue</span>' : ''}<div class="why">${esc(o.title)} · ${esc(STAGE[o.stage] || o.stage)} · next: ${esc(o.next_action)}${kind() !== 'advisor' ? ' · ' + esc(E[o.advisor_id].name) : ''}</div></div><div style="text-align:right"><b>${inr(o.value)}</b><div class="small muted">${dFmt(o.expected_close_on)}</div></div></div>`; }).join('') || '<div class="empty">Nothing due in this window.</div>'}</div></div>`;
}
const NEXT_MONTH = '2026-10';
const monthLabel = m => new Date(m + '-15').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const lakh = v => String(Math.round(v / 1e4) / 10);
const setBy = x => x && x.set_by && E[x.set_by] ? `${esc(E[x.set_by].name)}${x.set_at ? ', ' + dFmt(x.set_at) : ''}` : '—';
const allocText = (sum, total) => `Allocated <b>${inr(sum)}</b> of ${inr(total)} branch target · ${sum > total ? `<span class="sev-high">${inr(sum - total)} over (stretch)</span>` : `${inr(total - sum)} left to allocate`}`;
function setTarget(level, ref, value, parentId) {
  let x = targetOf(level, ref, tgtMonth);
  if (!x) { const [y, mo] = tgtMonth.split('-').map(Number); x = { id: 'tgt_new' + Math.random().toString(36).slice(2), level, level_ref_id: ref, period_start: `${tgtMonth}-01`, period_end: new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10), target_value: 0, parent_target_id: parentId || null }; D.targets.push(x); }
  return Object.assign(x, { target_value: Math.round(value), set_by: me().id, set_at: TODAY });
}
const monthTabs = () => `<div class="tabs-inline">${[MONTH, NEXT_MONTH].map(m => `<button class="${tgtMonth === m ? 'on' : ''}" data-act="tgt-month" data-id="${m}">${monthLabel(m)}</button>`).join('')}</div>`;
function advisorAlloc(st) {
  const stT = targetOf('store', 'sto_' + st, tgtMonth), advs = advisorsAt(st);
  if (!stT) return `<div class="empty">The director hasn't set ${esc(storeName(st))}'s target for ${monthLabel(tgtMonth)} yet.</div>`;
  const sum = advs.reduce((s, a) => s + ((targetOf('advisor', a.id, tgtMonth) || {}).target_value || 0), 0);
  return `<table class="t"><tr><th>Sales staff</th><th>Target (₹ lakh)</th><th>Achieved</th><th>Progress</th><th>Set by</th></tr>${advs.map(a => { const x = targetOf('advisor', a.id, tgtMonth), ach = achieved('advisor', a.id, tgtMonth);
      return `<tr><td>${esc(a.name)}</td><td style="width:140px"><input class="in" style="min-height:36px" inputmode="decimal" data-alloc="${a.id}" value="${x ? lakh(x.target_value) : ''}"></td><td>${inr(ach)}</td><td style="width:20%"><div class="bar green"><i style="width:${x && x.target_value ? Math.min(100, ach / x.target_value * 100) : 0}%"></i></div></td><td class="small muted">${setBy(x)}</td></tr>`; }).join('')}</table>
    <div class="row-flex" style="justify-content:space-between;margin-top:12px"><span id="alloc-sum" class="help" data-total="${stT.target_value}">${allocText(sum, stT.target_value)}</span>
      <div class="actbar"><button class="btn" data-act="split-even" data-id="${st}">Split evenly</button><button class="btn primary" data-act="save-alloc" data-id="${st}">Save Sales staff targets</button></div></div>`;
}
function updateAlloc() {
  const el = document.getElementById('alloc-sum'), sum = [...document.querySelectorAll('[data-alloc]')].reduce((s, i) => s + (parseFloat(i.value) || 0) * 1e5, 0);
  el.innerHTML = allocText(sum, Number(el.dataset.total));
}
function targets() {
  if (kind() === 'advisor') {
    const mine = ORD.filter(o => o.adv === me().id && o.at.startsWith(MONTH)).sort((a, b) => b.at.localeCompare(a.at)), next = targetOf('advisor', me().id, NEXT_MONTH);
    return `<div class="stack"><h2>My targets</h2><div class="card">${targetStrip('advisor', me().id, 'My')}</div>
      ${next ? `<div class="card"><div class="kicker">${monthLabel(NEXT_MONTH)}</div><b>${inr(next.target_value)}</b> <span class="help">set by ${setBy(next)}</span></div>` : ''}
      ${section(`My sales this month <span class="muted small">(${mine.length})</span>`, mine.length ? `<div class="list">${mine.slice(0, 12).map(o => `<div class="row"><div class="grow"><b>${o.cust ? esc(C[o.cust].name) : 'Walk-in'}</b><div class="why">${dFmt(o.at)} · ${esc(o.prods.map(p => P[p].name).join(', ').slice(0, 60))}</div></div><b>${inr(o.total)}</b></div>`).join('')}</div>` : '<div class="empty">No sales yet this month.</div>')}
      <p class="help">Your store manager sets your target. You can see it and your progress, but not change it.</p></div>`;
  }
  if (kind() === 'manager') { const st = myStore(), stT = targetOf('store', 'sto_' + st, tgtMonth);
    return `<div class="stack"><div class="page-h"><div><div class="kicker">Targets · ${esc(storeName(st))}</div><h1>${monthLabel(tgtMonth)}</h1></div></div>${monthTabs()}
      <div class="card">${tgtMonth === MONTH ? targetStrip('store', 'sto_' + st, storeName(st)) : stT ? `<div class="kicker">${esc(storeName(st))} target</div><h2>${inr(stT.target_value)}</h2><div class="help">Set by ${setBy(stT)}</div>` : '<div class="empty">Not set yet by the director.</div>'}</div>
      ${section('Split the branch target between Sales staff', advisorAlloc(st))}
      <p class="help">The director sets the branch target. Each Sales staff member sees the target you give them on their home screen, with your name as who set it.</p></div>`; }
  const brandT = D.stores.reduce((s, x) => s + ((targetOf('store', x.id, tgtMonth) || {}).target_value || 0), 0);
  const rows = D.stores.map(s => { const x = targetOf('store', s.id, tgtMonth), ach = achieved('store', s.id, tgtMonth);
    return `<tr><td><b>${esc(s.name)}</b></td><td style="width:150px"><input class="in" style="min-height:36px" inputmode="decimal" data-btgt="${s.id}" value="${x ? lakh(x.target_value) : ''}"></td><td>${inr(ach)}</td><td style="width:20%"><div class="bar green"><i style="width:${x && x.target_value ? Math.min(100, ach / x.target_value * 100) : 0}%"></i></div></td><td class="small muted">${setBy(x)}</td></tr>`; }).join('');
  return `<div class="stack"><div class="page-h"><div><div class="kicker">Targets · all branches</div><h1>${monthLabel(tgtMonth)}</h1></div></div>${monthTabs()}
    ${tgtMonth === MONTH ? `<div class="card">${targetStrip('brand', 'ten_vaarahi', 'Vaarahi Silks')}</div>` : ''}
    ${section('Branch targets', `<table class="t"><tr><th>Branch</th><th>Target (₹ lakh)</th><th>Achieved</th><th>Progress</th><th>Set by</th></tr>${rows}</table>
      <div class="row-flex" style="justify-content:space-between;margin-top:12px"><span class="help">Brand target = sum of branches: <b>${inr(brandT)}</b>. Regions roll up automatically.</span><button class="btn primary" data-act="save-branch-tgts">Save branch targets</button></div>`)}
    ${section('Sales staff targets', `<div class="row-flex" style="margin-bottom:10px"><span class="small muted">Branch</span><select class="in" style="width:auto;min-height:36px" id="alloc-store">${D.stores.map(s => `<option value="${s.code}" ${s.code === allocStore ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>${advisorAlloc(allocStore)}`, '<span class="small muted">Usually done by each store manager</span>')}</div>`;
}

// ---------------------------------------------------------------- complaints (Grievance Cell)
const SEV = { critical: 0, high: 1, medium: 2, low: 3 };
const REPLY = { whatsapp: 'Reply on WhatsApp', google_review: 'Reply to review', instagram: 'Reply on Instagram', email: 'Reply by email', web_form: 'Reply by email', call: 'Log a call', in_store: 'Log a note' };
const salOf = c => c.name.split(' ')[0];
function draftReply(g, ch) {
  const c = C[g.customer_id], who = `${salOf(c)} ${c.last}`, st = storeName(code(g.store_id)), mgr = E[g.assigned_to].name.split(' ')[0];
  if (ch === 'google_review') return `Thank you for telling us, ${who} — this isn't the standard we hold ourselves to. We've contacted you directly to make it right. — Vaarahi Silks, ${st}`;
  if (ch === 'call' || ch === 'in_store') return '';
  return `Dear ${who}, we're truly sorry about the ${CAT[g.category].toLowerCase()}. ${mgr} from our ${st} store will call you today to put it right.`;
}
function grievances(arg) {
  if (arg) return grievance(arg);
  const scoped = D.grievances.filter(g => inScope(C[g.customer_id]));
  const open = scoped.filter(isOpen).sort((a, b) => SEV[a.severity] - SEV[b.severity] || a.created_at.localeCompare(b.created_at));
  const done = scoped.filter(g => !isOpen(g)).sort((a, b) => (b.resolved_at || '').localeCompare(a.resolved_at || ''));
  const row = g => { const first = g.touchpoints.find(t => t.dir !== 'out') || {};
    return `<tr><td><a class="name" href="#/grievances/${g.id}">${esc(g.code)}</a></td><td>${chBadges(g)}</td><td>${esc(C[g.customer_id].name)} ${tier(C[g.customer_id])}</td><td>${esc(CAT[g.category])}</td><td class="sev-${g.severity}">${g.severity}</td><td>${slaText(g)}</td><td>${esc(storeName(code(g.store_id)))}</td>
      <td style="white-space:nowrap">${isOpen(g) ? `<button class="btn sm" data-act="reply-open" data-id="${g.id}|${g.touchpoints.indexOf(first)}">${esc(REPLY[first.channel] || 'Reply')}</button> <button class="btn sm primary" data-act="resolve-open" data-id="${g.id}">Resolve</button>` : `<span class="small muted">by ${esc(g.resolved_by || E[g.assigned_to].name)}</span>`}</td></tr>`; };
  return `<div class="page-h"><div><div class="kicker">Grievance Cell</div><h1>Complaints from every channel, one queue</h1></div><div class="row-flex"><span class="muted small">Most severe first, then oldest</span><button class="btn primary" data-act="log-complaint">+ Log a complaint</button></div></div>
    <div class="card" style="margin-bottom:20px"><div class="kicker">How complaints arrive</div><div class="grid g4" style="margin-top:10px">
      <div><b>WhatsApp</b><div class="why">AI spots a complaint in any chat and suggests opening a case — staff confirm with one tap.</div></div>
      <div><b>Google reviews</b><div class="why">Every review of 3★ or less opens a case automatically. Replies post back to Google.</div></div>
      <div><b>Instagram, Facebook, email</b><div class="why">Comments, DMs and emails to your care address are read the same way.</div></div>
      <div><b>Phone and in store</b><div class="why">Staff log it in 20 seconds with “+ Log a complaint”.</div></div></div></div>
    ${section(`Open <span class="muted small">(${open.length})</span>`, `<table class="t"><tr><th>Case</th><th>Came in on</th><th>Client</th><th>Issue</th><th>Severity</th><th>Deadline</th><th>Branch</th><th></th></tr>${open.map(row).join('')}</table>`)}
    <div style="height:20px"></div>
    ${section(`Resolved <span class="muted small">(${done.length})</span>`, `<table class="t">${done.slice(0, 12).map(row).join('')}</table>`)}`;
}
function grievance(id) {
  const g = D.grievances.find(x => x.id === id), c = C[g.customer_id], open = isOpen(g), owner = E[g.assigned_to];
  const ins = g.touchpoints.filter(t => t.dir !== 'out'), chans = [...new Set(ins.map(t => CH[t.channel] || t.channel))];
  const esc2 = g.escalations.filter(e => e.to_id !== g.assigned_to);
  const nextRole = SETTINGS.ladder[esc2.length + 1];
  const nextLevel = nextRole && active().find(e => e.role === nextRole && e.id !== g.assigned_to && !esc2.some(x => x.to_id === e.id));
  const ack = D.outbound.find(o => o.customer_id === c.id && o.category === 'utility');
  const mk = D.outbound.filter(o => o.customer_id === c.id && o.category === 'marketing');
  const tp = (t, i) => {
    const key = `${g.id}|${i}`, out = t.dir === 'out';
    return `<div class="row" style="align-items:flex-start"><span class="dot"></span><div class="grow ${out ? 'tp-out' : ''}"><span class="ch">${out ? 'You replied · ' : ''}${CH[t.channel] || t.channel}</span> <span class="small muted">${when(t.at)}${out && t.by ? ' · ' + esc(t.by) : ''}</span><div style="margin-top:4px">${esc(t.body)}</div>
      ${!out && open ? `<div class="actbar" style="margin-top:8px"><button class="btn sm primary" data-act="reply-open" data-id="${key}">${esc(REPLY[t.channel] || 'Reply')}</button>
        ${t.channel === 'whatsapp' ? `<a class="btn sm" href="#/inbox/${c.id}">Open the chat</a>` : ''}
        ${t.channel === 'google_review' ? `<a class="btn sm ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Vaarahi Silks ' + storeName(code(g.store_id)))}" target="_blank" rel="noopener">Open on Google ↗</a>` : ''}</div>` : ''}
      ${replyOpen === key ? `<div style="margin-top:10px"><textarea class="draft" id="reply-text">${esc(draftReply(g, t.channel))}</textarea>
        <div class="help" style="margin:4px 0 8px">${t.channel === 'google_review' ? 'Posted publicly under the review, through Google\'s official reply feature. Keep it short and move the details to a private chat.' : t.channel === 'call' || t.channel === 'in_store' ? 'Write what was discussed — it is saved on the case.' : t.channel === 'whatsapp' ? (windowLeft(c.id) > 0 ? `Goes out from the Vaarahi Silks WhatsApp number (${WA_NUMBER}) — the same number ${esc(c.first)} wrote to. Edit freely; service replies are allowed even while marketing is paused.` : `Goes out from ${WA_NUMBER}. ${esc(c.first)} last wrote over 24 h ago, so WhatsApp sends this as the approved "complaint update" service template — your text fills it in.`) : 'Service reply — always allowed, even while marketing is paused.'}</div>
        <div class="actbar"><button class="btn sm primary" data-act="reply-send" data-id="${key}">${t.channel === 'google_review' ? 'Post reply on Google' : t.channel === 'call' || t.channel === 'in_store' ? 'Save note' : 'Send'}</button><button class="btn sm ghost" data-act="reply-cancel">Cancel</button></div></div>` : ''}</div></div>`;
  };
  return `<div class="stack"><a class="small muted" href="#/grievances">← Complaints</a>
    <div class="page-h"><div><div class="kicker">${esc(g.code)} · ${esc(storeName(code(g.store_id)))}</div><h1>${esc(CAT[g.category])}</h1><div class="row-flex" style="margin-top:8px"><span class="chip sev-${g.severity}">${g.severity} severity</span>${slaText(g)}<span class="chip">${esc(g.status.replace('_', ' '))}</span></div></div>
      <a class="row-flex" href="#/customer/${c.id}">${avatar(c)}<span><span class="name">${esc(c.name)}</span> ${tier(c)}<br><span class="small muted">LTV ${inr(c.ltv)} · open profile</span></span></a></div>
    ${open ? `<div class="actbar"><button class="btn primary" data-act="resolve-open" data-id="${g.id}">✓ Mark resolved</button>${ins.map(t => `<button class="btn" data-act="reply-open" data-id="${g.id}|${g.touchpoints.indexOf(t)}">${esc(REPLY[t.channel] || 'Reply')}</button>`).join('')}</div>`
      : `<div class="banner live"><b>Resolved</b><span>by ${esc(g.resolved_by || owner.name)}${g.resolved_at ? ' on ' + dFmt(g.resolved_at) : ''} — ${esc(g.resolution_notes || '')}${g.customer_confirmed ? ' · client confirmed' : ''}</span></div>`}
    <div class="grid g2">
      <div class="stack">
        <div class="card"><div class="kicker">What happened</div><p style="margin-top:6px">${esc(g.ai_summary)}</p><div class="help">Summary written automatically from ${esc(c.first)}'s ${ins.length} message${ins.length > 1 ? 's' : ''} (${chans.join(' + ')}), so the manager doesn't have to read them all.</div></div>
        ${section('Messages on this case', `<div class="list tl">${g.touchpoints.map(tp).join('')}</div>`)}
      </div>
      <div class="stack">
        <div class="card"><div class="kicker">Who's handling it</div>
          <p style="margin-top:6px"><b>${esc(owner.name)}</b> (${esc(owner.title)}) is responsible for this complaint.</p>
          ${esc2.map(e => `<p class="why" style="margin-top:6px">Not solved within ${SETTINGS.sla[g.severity]} h → also sent to <b>${esc(E[e.to_id].name)}</b>, ${esc(E[e.to_id].title)} (${when(e.at)}).</p>`).join('')}
          ${open && nextLevel ? `<p class="help" style="margin-top:6px">If it is still open ${SETTINGS.sla[g.severity]} h later, it goes to ${esc(nextLevel.name)} (${esc(nextLevel.title)}).</p>` : ''}</div>
        <div class="card"><div class="kicker">${open ? `Marketing to ${esc(c.first)} is paused` : 'Messages to this client'}</div>
          ${open ? `<p class="why" style="margin-top:6px">While a complaint is open, campaigns stop automatically. Service messages — like replies and updates on this case — still go out.</p>` : ''}
          ${ack ? `<div class="row-flex" style="margin-top:8px"><span class="chip good">Sent</span><span class="small">Complaint acknowledgement (service message)</span></div>` : ''}
          ${mk.map(o => `<div class="row-flex" style="margin-top:6px"><span class="chip ${o.status === 'blocked' ? 'bad' : 'good'}">${o.status === 'blocked' ? 'On hold' : 'Resumed'}</span><span class="small">Dasara preview campaign (marketing)</span></div>`).join('')}</div>
      </div></div></div>`;
}
function resolveForm(gid) {
  const g = D.grievances.find(x => x.id === gid), c = C[g.customer_id];
  openModal(`<h2>Mark ${esc(g.code)} resolved</h2><p class="why">${esc(c.name)} — ${esc(CAT[g.category])}</p>
    <form id="f" class="form" onsubmit="return false">
      <div class="field"><label>What was done? *</label><div class="chips">${chipRadio('fix', ['Replaced the saree', 'Refunded', 'Repaired / re-dyed', 'Apology + goodwill gesture', 'Other'], 'Replaced the saree')}</div></div>
      <div class="field"><label>Note (optional)</label><textarea class="in" name="note" placeholder="Anything the team should know"></textarea></div>
      <label class="row-flex small"><input type="checkbox" name="ok" checked> Client confirmed they're happy</label>
      ${formBtns('resolve', 'Mark resolved', gid)}</form>`, false);
}
function resolve(gid) {
  const g = D.grievances.find(x => x.id === gid), c = C[g.customer_id], f = fd();
  Object.assign(g, { status: 'resolved', resolved_at: D.now, resolved_by: me().name, resolution_notes: `${f.get('fix')}${f.get('note') ? ' — ' + f.get('note') : ''}`, customer_confirmed: !!f.get('ok') });
  const resumed = !paused(c.id);
  if (resumed) D.outbound.filter(o => o.customer_id === c.id && o.category === 'marketing').forEach(o => { o.status = 'approved'; });
  D.whatsapp.push({ id: 'wa-res' + Date.now(), customer_id: c.id, channel: 'whatsapp', direction: 'out', at: D.now, by: me().name + ' · template', body: fillTpl('tpl_grv_resolved', c, { code: g.code, fix: String(f.get('fix')).toLowerCase() }) });
  closeModal(); replyOpen = null;
  toast(`${g.code} resolved`, [`What was done: ${g.resolution_notes}`, g.customer_confirmed ? 'Client confirmation recorded' : 'Waiting for the client to confirm',
    resumed ? `Marketing resumed for ${c.first} — Dasara preview back on` : 'Marketing stays paused — another complaint is still open', 'Client told on WhatsApp (“Complaint resolved” template)', 'Time to resolve added to the branch report']);
  render();
}
function sendReply(key) {
  const [gid, i] = key.split('|'), g = D.grievances.find(x => x.id === gid), t = g.touchpoints[Number(i)], c = C[g.customer_id];
  const body = (document.getElementById('reply-text') || {}).value || '';
  if (!body.trim()) return;
  g.touchpoints.push({ channel: t.channel, dir: 'out', at: D.now, body, by: me().name });
  if (t.channel === 'whatsapp') D.whatsapp.push({ id: 'wa-r' + Date.now(), customer_id: c.id, channel: 'whatsapp', direction: 'out', at: D.now, body, by: me().name });
  if (g.status === 'open' || g.status === 'acknowledged') g.status = 'in_progress';
  replyOpen = null;
  toast({ google_review: 'Reply posted on Google', whatsapp: 'Sent on WhatsApp', instagram: 'Sent on Instagram', email: 'Email sent', web_form: 'Email sent' }[t.channel] || 'Note saved',
    [t.channel === 'google_review' ? 'Shows publicly under the review within minutes' : t.channel === 'call' || t.channel === 'in_store' ? 'Saved on the case' : t.channel === 'whatsapp' ? `From the Vaarahi Silks number (${WA_NUMBER}) — service message, allowed while marketing is paused` : 'Service message — allowed while marketing is paused',
      t.channel === 'whatsapp' ? notifyAdvisor(c) : null, 'Logged on the case and the client\'s timeline', 'Case status: in progress — mark it resolved once it\'s sorted']);
  render();
}
function openGrievance(mid) {
  const m = D.whatsapp.find(x => x.id === mid), c = C[m.customer_id], x = m.card.extraction;
  const g = { id: 'grv-new-' + mid, code: `GRV-${String(D.grievances.length + 1).padStart(4, '0')}`, customer_id: c.id, store_id: 'sto_' + c.store, category: x.complaint.category, severity: x.complaint.severity,
    status: 'acknowledged', raised_by: 'ai', assigned_to: S[c.store].manager_id, created_at: m.at, sla_due_at: new Date(dt(m.at).getTime() + SETTINGS.sla[x.complaint.severity] * 36e5).toISOString(), escalation_level: 0,
    ai_summary: `${c.name} says: ${m.body}`, ai_confidence: m.card.confidence, touchpoints: [{ channel: 'whatsapp', at: m.at, body: m.body }], escalations: [] };
  D.grievances.push(g); m.card.status = 'approved';
  D.outbound.push({ id: 'ack-' + mid, customer_id: c.id, category: 'utility', status: 'delivered' });
  D.whatsapp.push({ id: 'wa-ack' + mid, customer_id: c.id, channel: 'whatsapp', direction: 'out', at: D.now, by: me().name + ' · template', body: fillTpl('tpl_grv_ack', c, { code: g.code, issue: CAT[g.category].toLowerCase() }) });
  D.outbound.filter(o => o.customer_id === c.id && o.category === 'marketing').forEach(o => { o.status = 'blocked'; });
  if (!D.outbound.some(o => o.customer_id === c.id && o.category === 'marketing')) D.outbound.push({ id: 'mk-' + mid, customer_id: c.id, category: 'marketing', status: 'blocked', blocked_reason: 'grievance_pause' });
  toast(`Complaint case ${g.code} opened`, [`Assigned to ${E[g.assigned_to].name}, store manager`, `Deadline ${SETTINGS.sla[g.severity]} h (placeholder — you set these in Settings)`, 'Acknowledgement sent (service message — always allowed)', `Marketing to ${c.first} paused until it's resolved`]);
  render();
}

// ---------------------------------------------------------------- appointments
const SRC = { in_store: 'Booked in store', phone: 'Phone call', whatsapp: 'WhatsApp', website: 'Website' };
function appointments(arg) {
  const day = arg || apptDay; apptDay = day;
  const [from, to] = { today: [TODAY, TODAY], tomorrow: [plus(1), plus(1)], week: [TODAY, plus(6)] }[day];
  const list = D.appointments.filter(a => a.starts_at.slice(0, 10) >= from && a.starts_at.slice(0, 10) <= to)
    .filter(a => kind() === 'owner' || (kind() === 'manager' ? code(a.store_id) === myStore() : a.advisor_id === me().id))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const row = a => { const c = C[a.customer_id];
    return `<div class="row">${avatar(c)}<div class="grow"><b>${when(a.starts_at)}</b> · <a class="name" href="#/customer/${c.id}">${esc(c.name)}</a> ${tier(c)}<div class="why">${esc(a.purpose)}${a.value ? ' · expected ' + inr(a.value) : ''} · with ${esc(E[a.advisor_id] ? E[a.advisor_id].name : '—')}${kind() === 'owner' ? '' : ''} · <span class="ch">${SRC[a.booked_via] || SRC.in_store}</span></div></div>
      ${a.status === 'booked' ? `<div class="actbar"><button class="btn sm" data-act="appt-status" data-id="${a.id}|completed">Came in</button><button class="btn sm ghost" data-act="appt-status" data-id="${a.id}|no_show">No-show</button></div>` : `<span class="chip ${a.status === 'completed' ? 'good' : 'warn'}">${a.status === 'completed' ? 'Came in' : 'No-show'}</span>`}</div>`; };
  const groups = kind() === 'owner' ? Object.entries(group(list, a => code(a.store_id))) : [[null, list]];
  return `<div class="page-h"><div><div class="kicker">${kind() === 'advisor' ? 'My diary' : 'Appointments'}</div><h1>${list.length} ${day === 'today' ? 'today' : day === 'tomorrow' ? 'tomorrow' : 'in the next 7 days'}</h1></div><button class="btn primary" data-act="book-appt">+ Book appointment</button></div>
    <p class="help" style="margin:-10px 0 14px">Appointments come from staff booking in store or on a call, from clients asking on WhatsApp (AI turns the message into a booking you confirm), and — once connected — your website's booking link. Clients get a WhatsApp confirmation and a reminder the day before.</p>
    <div class="tabs-inline">${[['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'Next 7 days']].map(([k, l]) => `<a class="${day === k ? 'on' : ''}" href="#/appointments/${k}">${l}</a>`).join('')}</div>
    ${list.length ? groups.map(([st, as]) => `<div class="card" style="margin-bottom:16px">${st ? `<h3 style="margin-bottom:8px">${esc(storeName(st))} <span class="muted small">(${as.length})</span></h3>` : ''}<div class="list">${as.map(row).join('')}</div></div>`).join('') : '<div class="card empty">No appointments in this window.</div>'}`;
}
function apptForm(key) {
  const [cid, mid] = (key || '').split('|'), pre = cid ? C[cid] : null, m = mid ? D.whatsapp.find(x => x.id === mid) : null, ap = m && m.card.extraction.appointment;
  const d = new Date(NOW); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); const saturday = d.toISOString().slice(0, 10);
  const st = pre ? pre.store : myStore();
  openModal(`<h2>Book an appointment</h2><p class="why">${m ? 'Filled in from the WhatsApp message — check it and confirm.' : 'Pick the client, the time and what it is for.'}</p>
    <form id="f" class="form" onsubmit="return false">
      ${pre ? `<div class="field"><label>Client</label><div><b>${esc(pre.name)}</b> ${tier(pre)}</div><input type="hidden" name="cid" value="${pre.id}"></div>` : clientPicker()}
      <div class="two"><div class="field"><label>Date *</label><input class="in" type="date" name="date" value="${ap ? saturday : plus(1)}"></div><div class="field"><label>Time *</label><input class="in" type="time" name="time" value="${ap ? ap.time : '12:00'}"></div></div>
      <div class="field"><label>What for? *</label><div class="chips">${chipRadio('purpose', ['Bridal trial', 'Engagement saree selection', 'Festive shopping', 'Blouse fitting', 'Collection preview'], ap ? 'Bridal trial' : 'Festive shopping')}</div></div>
      <div class="two"><div class="field"><label>Branch</label>${branchSelect('store', st)}</div><div class="field"><label>With Sales staff</label><select class="in" name="advisor" id="f-adv">${advOptions(st, pre && pre.advisor ? pre.advisor : kind() === 'advisor' ? me().id : '')}</select></div></div>
      <div class="two"><div class="field"><label>How was it booked?</label><select class="in" name="source">${Object.entries(SRC).map(([k, l]) => `<option value="${k}" ${(m ? 'whatsapp' : 'in_store') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label>Expected value (₹, optional)</label><input class="in" name="value" inputmode="numeric" placeholder="adds it to the pipeline"></div></div>
      <label class="row-flex small"><input type="checkbox" name="confirm" checked> Send the client a WhatsApp confirmation (service message)</label>
      ${m ? `<input type="hidden" name="mid" value="${m.id}">` : ''}
      ${formBtns('save-appt', 'Book appointment')}</form>`, !pre);
}
function saveAppt() {
  const f = fd(), c = pickedClient(f);
  if (!c) return formError('Pick the client from the list.');
  if (!f.get('date') || !f.get('time')) return formError('Pick a date and a time.');
  const store = f.get('store'), adv = f.get('advisor') || c.advisor || advisorsAt(store)[0].id, value = Number(String(f.get('value') || '').replace(/[^\d]/g, ''));
  const a = { id: 'apt_new' + Date.now(), customer_id: c.id, store_id: 'sto_' + store, advisor_id: adv, starts_at: `${f.get('date')}T${f.get('time')}:00+05:30`, purpose: f.get('purpose'), booked_via: f.get('source'), status: 'booked', value: value || null };
  D.appointments.push(a);
  if (!c.advisor) c.advisor = adv;
  if (value) D.opps.push({ id: 'opp_a' + Date.now(), customer_id: c.id, title: `${a.purpose} (${dFmt(a.starts_at)})`, stage: 'trial_viewing', advisor_id: adv, store_id: a.store_id, value, expected_close_on: f.get('date'), next_action: 'Appointment', last_activity_at: D.now });
  if (f.get('confirm')) D.whatsapp.push({ id: 'wa-apt' + Date.now(), customer_id: c.id, channel: 'whatsapp', direction: 'out', at: D.now, by: me().name + ' · template',
    body: fillTpl('tpl_appt_confirm', c, { purpose: a.purpose.toLowerCase(), date: dFmt(a.starts_at), time: tFmt(a.starts_at), branch: storeName(store), advisor: E[adv].name.split(' ')[0] }) });
  if (f.get('mid')) { const msg = D.whatsapp.find(x => x.id === f.get('mid')); if (msg && msg.card) msg.card.status = 'approved'; }
  closeModal();
  toast('Appointment booked', [`${c.name} · ${dFmt(a.starts_at)}, ${tFmt(a.starts_at)} · ${storeName(store)}`, `With ${E[adv].name} — on their diary and home screen`, value ? `${inr(value)} added to the pipeline` : null,
    f.get('confirm') ? `WhatsApp confirmation sent from ${WA_NUMBER} ("Appointment confirmed" template)` : null, 'Reminder goes the day before ("Appointment reminder" template)']);
  render();
}

// ---------------------------------------------------------------- complaints logged by staff (phone / in store)
function pauseMarketing(c) {
  D.outbound.filter(o => o.customer_id === c.id && o.category === 'marketing').forEach(o => { o.status = 'blocked'; });
  if (!D.outbound.some(o => o.customer_id === c.id && o.category === 'marketing')) D.outbound.push({ id: 'mk-' + Date.now(), customer_id: c.id, category: 'marketing', status: 'blocked', blocked_reason: 'grievance_pause' });
}
function complaintForm() {
  openModal(`<h2>Log a complaint</h2><p class="why">For complaints made on a call or in the store. WhatsApp, Google reviews, Instagram and email complaints come in automatically.</p>
    <form id="f" class="form" onsubmit="return false">${clientPicker()}
      <div class="two"><div class="field"><label>How did it come in?</label><select class="in" name="channel"><option value="call">Phone call</option><option value="in_store">In store</option><option value="email">Email</option></select></div>
        <div class="field"><label>How serious?</label><select class="in" name="sev"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div></div>
      <div class="field"><label>What is it about? *</label><select class="in" name="cat">${Object.entries(CAT).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select></div>
      <div class="field"><label>What did the client say? *</label><textarea class="in" name="body" placeholder="Briefly, in the client's words"></textarea></div>
      ${formBtns('save-complaint', 'Open complaint case')}</form>`);
}
function saveComplaint() {
  const f = fd(), c = pickedClient(f), body = (f.get('body') || '').trim();
  if (!c) return formError('Pick the client from the list.');
  if (!body) return formError('Write what the client said.');
  const sev = f.get('sev');
  const g = { id: 'grv-log' + Date.now(), code: `GRV-${String(D.grievances.length + 1).padStart(4, '0')}`, customer_id: c.id, store_id: 'sto_' + c.store, category: f.get('cat'), severity: sev, status: 'open', raised_by: 'staff',
    assigned_to: S[c.store].manager_id, created_at: D.now, sla_due_at: new Date(NOW.getTime() + SETTINGS.sla[sev] * 36e5).toISOString(), escalation_level: 0,
    ai_summary: `${c.name}: ${body}`, ai_confidence: 1, touchpoints: [{ channel: f.get('channel'), at: D.now, body, by: me().name }], escalations: [] };
  D.grievances.push(g); pauseMarketing(c);
  closeModal(); location.hash = '#/grievances/' + g.id;
  toast(`Complaint ${g.code} opened`, [`Assigned to ${E[g.assigned_to].name} (store manager) · deadline ${SETTINGS.sla[sev]} h`, `Marketing to ${c.first} paused until it's resolved`, 'Same queue as WhatsApp and Google complaints']);
}

// ---------------------------------------------------------------- team (director): chart, drag & drop, add / edit / remove
const isUnder = (a, b) => { let x = E[a]; for (let i = 0; x && i < 12; i++) { if (x.reports_to === b) return true; x = E[x.reports_to]; } return false; };
function team(arg) {
  if (!acc().team) return '<div class="card"><h3>Team is managed by the director</h3><p class="why">Ask the director to change who reports to whom, or to add someone new.</p></div>';
  if (arg) return person(arg);
  const people = active(), kids = group(people.filter(e => e.reports_to), e => e.reports_to);
  const leaf = e => LEAF_ROLES.includes(e.role) && !(kids[e.id] || []).length;
  const node = e => { const k = kids[e.id] || [], leaves = k.filter(leaf), subs = k.filter(x => !leaf(x));
    return `<li><div class="node ${e.demo ? '' : 'gold'}" data-emp="${e.id}" data-drop="${e.id}" draggable="true"><a href="#/team/${e.id}"><b>${esc(e.name)}</b></a><span>${esc(e.title)}</span></div>
      ${leaves.length ? `<div class="leafs">${leaves.map(x => `<a class="chip" href="#/team/${x.id}" data-emp="${x.id}" draggable="true" title="${esc(x.title)} — drag onto a manager to move">${esc(x.name)}</a>`).join('')}</div>` : ''}
      ${subs.length ? `<ul>${subs.map(node).join('')}</ul>` : ''}</li>`; };
  return `<div class="page-h"><div><div class="kicker">Team · ${people.length} people · 6 branches</div><h1>Who reports to whom</h1></div><button class="btn primary" data-act="add-member">+ Add team member</button></div>
    <p class="help" style="margin:-10px 0 16px"><b>Drag anyone onto a new manager</b> to change who they report to — targets, approvals and escalations follow automatically. Click a name for details, edit or remove.</p>
    <div class="card org"><ul>${people.filter(e => !e.reports_to).map(node).join('')}</ul></div>`;
}
function person(id) {
  const e = E[id];
  if (!e) return '<div class="empty">Not found.</div>';
  const clients = D.customers.filter(c => c.advisor === id).length, opps = D.opps.filter(o => o.advisor_id === id && !['won', 'lost'].includes(o.stage)).length;
  const fus = D.followups.filter(f => f.owner_id === id && f.status !== 'done').length, reports = active().filter(x => x.reports_to === id);
  const boss = E[e.reports_to];
  return `<div class="stack"><a class="small muted" href="#/team">← Team</a>
    <div class="page-h"><div><div class="kicker">${esc(e.code || '')}${e.status === 'left' ? ' · removed' : ''}</div><h1>${esc(e.name)}</h1><div class="help">${esc(e.title)}</div></div>
      ${e.status === 'left' ? '' : `<div class="actbar"><button class="btn" data-act="edit-member" data-id="${id}">Edit details</button>${e.role === 'role_owner' ? '' : `<button class="btn" data-act="remove-member" data-id="${id}">Remove from team</button>`}</div>`}</div>
    <div class="grid g2"><div class="card person">
      <div><span>Full name</span><b>${esc(e.name)}</b></div><div><span>Mobile</span><b>${esc(e.phone || '—')}</b></div>
      <div><span>Role</span><b>${esc(roleName(e.role))}</b></div><div><span>Branch</span><b>${esc(storeName(e.store))}</b></div>
      <div><span>Reports to</span><b>${boss ? `<a href="#/team/${boss.id}"><u>${esc(boss.name)}</u></a>` : '—'}</b></div><div><span>Email</span><b>${esc(e.email || '—')}</b></div>
      <div><span>Joined</span><b>${e.joined ? dFmt(e.joined) + ' ' + e.joined.slice(0, 4) : '—'}</b></div><div><span>Languages</span><b>${esc((e.languages || []).join(', ') || '—')}</b></div></div>
    <div class="card grid g2"><div class="stat"><div class="kicker">Clients</div><div class="v">${clients}</div></div><div class="stat"><div class="kicker">Open opportunities</div><div class="v">${opps}</div></div>
      <div class="stat"><div class="kicker">Open follow-ups</div><div class="v">${fus}</div></div><div class="stat"><div class="kicker">Team members</div><div class="v">${reports.length}</div></div></div></div></div>`;
}
function memberForm(id) {
  const e = id ? E[id] : null, [fn, ...ln] = e ? e.name.split(' ') : [''];
  const managers = active().filter(x => !LEAF_ROLES.includes(x.role) && x.id !== id && !(e && isUnder(x.id, id)));
  openModal(`<h2>${e ? 'Edit ' + esc(e.name) : 'Add a team member'}</h2>
    <form id="f" class="form" onsubmit="return false">
      <div class="two"><div class="field"><label>First name *</label><input class="in" name="first" value="${esc(fn)}"></div><div class="field"><label>Last name</label><input class="in" name="last" value="${esc(ln.join(' '))}"></div></div>
      <div class="two"><div class="field"><label>Mobile *</label><input class="in" name="phone" inputmode="tel" value="${e && e.phone ? digits10(e.phone) : ''}" placeholder="10-digit mobile"></div><div class="field"><label>Email</label><input class="in" name="email" value="${esc(e && e.email || '')}"></div></div>
      <div class="two"><div class="field"><label>Role *</label><select class="in" name="role">${D.roles.filter(r => r.id !== 'role_admin').map(r => `<option value="${r.id}" ${e ? (e.role === r.id ? 'selected' : '') : (r.id === 'role_advisor' ? 'selected' : '')}>${esc(r.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Branch</label><select class="in" name="store"><option value="">All branches / head office</option>${D.stores.map(s => `<option value="${s.code}" ${(e ? e.store : 'JBH') === s.code ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div></div>
      <div class="field"><label>Reports to *</label><select class="in" name="reports_to">${managers.map(x => `<option value="${x.id}" ${(e ? e.reports_to : S.JBH.manager_id) === x.id ? 'selected' : ''}>${esc(x.name)} — ${esc(x.title)}</option>`).join('')}</select></div>
      <div class="two"><div class="field"><label>Joining date</label><input class="in" type="date" name="joined" value="${e && e.joined ? e.joined : TODAY}"></div>
        <div class="field"><label>Languages</label><div class="chips">${chipChecks('lang', ['Telugu', 'English', 'Hindi', 'Tamil'], e ? e.languages || [] : ['Telugu', 'English'])}</div></div></div>
      ${formBtns('save-member', e ? 'Save changes' : 'Add to team', id || '')}</form>`);
}
function saveMember(id) {
  const f = fd(), first = (f.get('first') || '').trim(), d10 = digits10(f.get('phone'));
  if (!first || d10.length !== 10) return formError('Please enter a name and a 10-digit mobile number.');
  const clash = active().find(x => x.id !== id && x.phone && digits10(x.phone) === d10);
  if (clash) return formError(`${clash.name} already uses this mobile number.`);
  const store = f.get('store') || null, rid = f.get('role');
  const data = { name: `${first} ${(f.get('last') || '').trim()}`.trim(), phone: '+91' + d10, email: f.get('email') || null, role: rid, store, reports_to: f.get('reports_to'),
    joined: f.get('joined'), languages: f.getAll('lang'), title: `${roleName(rid)}${store ? ' — ' + storeName(store) : ''}` };
  let e;
  if (id) { e = Object.assign(E[id], data); }
  else { e = { id: 'emp_new' + Date.now(), code: 'VS-E' + String(D.employees.length + 1).padStart(3, '0'), demo: true, status: 'active', ...data }; D.employees.push(e); E[e.id] = e; }
  closeModal(); location.hash = '#/team';
  toast(id ? 'Saved' : `${e.name} added to the team`, [`${roleName(rid)}${store ? ' at ' + storeName(store) : ''}`, `Reports to ${E[e.reports_to].name}`, id ? null : `Can sign in with ${e.phone} (one-time code)`, id ? null : `Sees: ${SCOPE[(SETTINGS.access[rid] || NO_ACCESS).scope].toLowerCase()} — change in Settings → Roles & access`]);
  render();
}
function moveEmployee(id, mgrId) {
  const e = E[id], m = E[mgrId];
  if (!e || !m || id === mgrId || e.reports_to === mgrId) return;
  if (isUnder(mgrId, id)) return toast("Can't move there", [`${m.name} reports to ${e.name} — pick someone above them.`]);
  lastMove = { id, reports_to: e.reports_to, store: e.store, title: e.title };
  const from = E[e.reports_to]; e.reports_to = mgrId;
  const branchChange = m.store && e.store && m.store !== e.store;
  if (branchChange) { e.store = m.store; e.title = `${roleName(e.role)} — ${storeName(m.store)}`; }
  const n = D.customers.filter(c => c.advisor === id).length;
  toast(`${e.name} now reports to ${m.name}`, [from ? `Moved from ${from.name}` : null, branchChange ? `Branch: ${storeName(lastMove.store)} → ${storeName(e.store)}` : null,
    'Targets, approvals and escalations now follow the new line', n ? `${n} clients stay with ${e.name.split(' ')[0]} — reassign them from the profile if needed` : null], { label: 'Undo', act: 'undo-move' });
  render();
}
function removeForm(id) {
  const e = E[id], peers = active().filter(x => x.id !== id && x.role === e.role && x.store === e.store);
  const others = active().filter(x => x.id !== id && x.role !== 'role_owner' && (x.store === e.store || !x.store));
  const reports = active().filter(x => x.reports_to === id);
  const n = { clients: D.customers.filter(c => c.advisor === id).length, opps: D.opps.filter(o => o.advisor_id === id && !['won', 'lost'].includes(o.stage)).length,
    fus: D.followups.filter(f => f.owner_id === id && f.status !== 'done').length, appts: D.appointments.filter(a => a.advisor_id === id && a.starts_at >= TODAY).length, cases: D.grievances.filter(g => g.assigned_to === id && isOpen(g)).length };
  const opt = x => `<option value="${x.id}">${esc(x.name)} — ${esc(x.title)}</option>`;
  openModal(`<h2>Remove ${esc(e.name)}?</h2>
    <p class="why">${esc(e.name.split(' ')[0])} looks after <b>${n.clients} clients</b>, <b>${n.opps} open opportunities</b>, ${n.fus} follow-ups, ${n.appts} upcoming appointments${n.cases ? ` and ${n.cases} open complaints` : ''}${reports.length ? `, and has <b>${reports.length} team members</b>` : ''}. Nothing is lost — choose who takes over.</p>
    <form id="f" class="form" onsubmit="return false">
      <div class="field"><label>Hand clients, opportunities and follow-ups to *</label><select class="in" name="to">${peers.length > 1 ? `<option value="__split">Share evenly across ${peers.length} ${esc(roleName(e.role).toLowerCase())}s at ${esc(storeName(e.store))}</option>` : ''}${[...peers, ...others.filter(x => !peers.includes(x))].map(opt).join('')}</select></div>
      ${reports.length ? `<div class="field"><label>${reports.length} team members will report to *</label><select class="in" name="reports_to">${active().filter(x => x.id !== id && !LEAF_ROLES.includes(x.role) && !isUnder(x.id, id)).map(x => `<option value="${x.id}" ${x.id === e.reports_to ? 'selected' : ''}>${esc(x.name)} — ${esc(x.title)}</option>`).join('')}</select></div>` : ''}
      <p class="help">Their history stays on record (who sold what, notes) — they just stop appearing in the team and can no longer sign in.</p>
      ${formBtns('confirm-remove', 'Remove and hand over', id)}</form>`, false);
}
function removeMember(id) {
  const e = E[id], f = fd(), to = f.get('to'), peers = active().filter(x => x.id !== id && x.role === e.role && x.store === e.store);
  let k = 0; const pick = () => to === '__split' ? peers[k++ % peers.length].id : to;
  const cl = D.customers.filter(c => c.advisor === id), got = {};
  cl.forEach(c => { c.advisor = pick(); got[c.advisor] = (got[c.advisor] || 0) + 1; });
  const moveTo = cid => C[cid] ? C[cid].advisor : pick();
  const opps = D.opps.filter(o => o.advisor_id === id); opps.forEach(o => { o.advisor_id = moveTo(o.customer_id); });
  const fus = D.followups.filter(x => x.owner_id === id); fus.forEach(x => { x.owner_id = moveTo(x.customer_id); });
  const ap = D.appointments.filter(a => a.advisor_id === id); ap.forEach(a => { a.advisor_id = moveTo(a.customer_id); });
  const cases = D.grievances.filter(g => g.assigned_to === id && isOpen(g)); cases.forEach(g => { g.assigned_to = e.reports_to || pick(); });
  const reports = active().filter(x => x.reports_to === id); reports.forEach(x => { x.reports_to = f.get('reports_to'); });
  e.status = 'left';
  closeModal(); location.hash = '#/team';
  toast(`${e.name} removed — nothing lost`, [`${cl.length} clients handed to ${Object.entries(got).map(([a, c]) => `${E[a].name} (${c})`).join(', ') || '—'}`, `${opps.length} opportunities, ${fus.length} follow-ups and ${ap.length} appointments moved with their clients`,
    cases.length ? `${cases.length} open complaints moved to ${E[cases[0].assigned_to].name}` : null, reports.length ? `${reports.length} team members now report to ${E[f.get('reports_to')].name}` : null, 'Sign-in switched off · history kept']);
  render();
}

// ---------------------------------------------------------------- settings (director only)
function settings(arg) {
  if (!isDirector()) return '<div class="card"><h3>Settings are for the director</h3></div>';
  const tab = arg || 'access';
  const tabs = [['access', 'Roles & access'], ['templates', 'WhatsApp templates'], ['tiers', 'Client tiers'], ['complaints', 'Complaint deadlines'], ['connections', 'Connections'], ['brand', 'Brand']];
  let body = '';
  if (tab === 'access') {
    const count = group(active(), e => e.role);
    body = `<div class="page-h" style="margin-bottom:10px"><p class="help">Decide what each role can see and do. Changes apply instantly — in screens, exports and the AI assistant.</p><button class="btn primary" data-act="add-role">+ New role</button></div>
      <table class="t"><tr><th>Role</th><th>People</th><th>Can see which clients</th><th>Cost & margins</th><th>Sales reports</th><th>Export data</th><th>Manage team</th></tr>
      ${D.roles.filter(r => r.id !== 'role_admin').map(r => { const a = SETTINGS.access[r.id], lock = r.id === 'role_owner';
        const box = k => `<input type="checkbox" class="tog" data-acc="${r.id}|${k}" ${a[k] ? 'checked' : ''} ${lock ? 'disabled' : ''} aria-label="${esc(r.name)} ${k}">`;
        return `<tr><td><b>${esc(r.name)}</b></td><td>${(count[r.id] || []).length}</td><td><select class="in" style="min-height:36px" data-acc="${r.id}|scope" ${lock ? 'disabled' : ''}>${Object.entries(SCOPE).map(([k, l]) => `<option value="${k}" ${a.scope === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td><td>${box('cost')}</td><td>${box('reports')}</td><td>${box('export')}</td><td>${box('team')}</td></tr>`; }).join('')}</table>`;
  }
  if (tab === 'tiers') {
    const t = group(D.customers, c => c.tier), y = D.customers.reduce((s, c) => s + c.spend12, 0);
    const share = k => Math.round((t[k] || []).reduce((s, c) => s + c.spend12, 0) / y * 100);
    body = `<p class="help">Tiers are automatic, from what each client spent in the last 12 months. They update on the 1st of every month. A manager can still set a client's tier by hand, with a reason.</p>
      <form id="f" class="form" onsubmit="return false" style="max-width:560px"><div class="two"><div class="field"><label>VIP from (₹ lakh, last 12 months)</label><input class="in" name="vip" inputmode="decimal" value="${SETTINGS.tiers.vip / 1e5}"></div>
        <div class="field"><label>Premium from (₹ lakh)</label><input class="in" name="premium" inputmode="decimal" value="${SETTINGS.tiers.premium / 1e5}"></div></div>
        <div id="ferr" class="errbox"></div><div><button class="btn primary" type="button" data-act="save-tiers">Save & recalculate now</button></div></form>
      <table class="t" style="margin-top:20px"><tr><th>Tier</th><th>Rule</th><th>Clients</th><th>Share of revenue</th></tr>
        <tr><td>${TIER.vip}</td><td>${inr(SETTINGS.tiers.vip)}+ in 12 months</td><td>${(t.vip || []).length}</td><td>${share('vip')}%</td></tr>
        <tr><td>${TIER.premium}</td><td>${inr(SETTINGS.tiers.premium)} – ${inr(SETTINGS.tiers.vip)}</td><td>${(t.premium || []).length}</td><td>${share('premium')}%</td></tr>
        <tr><td>${TIER.regular}</td><td>bought, under ${inr(SETTINGS.tiers.premium)}</td><td>${(t.regular || []).length}</td><td>${share('regular')}%</td></tr>
        <tr><td>${TIER.prospect}</td><td>no purchase yet</td><td>${(t.prospect || []).length}</td><td>—</td></tr></table>
      <p class="help" style="margin-top:8px">${D.customers.filter(c => c.override).length} clients have a tier set by hand.</p>`;
  }
  if (tab === 'complaints') body = `<p class="help">How fast each complaint must be solved, and who it goes to if it isn't. <b>These are placeholders — your decision.</b> Legal limit for online sales: acknowledge within 48 h, resolve within 1 month.</p>
    <form id="f" class="form" onsubmit="return false" style="max-width:640px"><div class="grid g4">${['critical', 'high', 'medium', 'low'].map(s => `<div class="field"><label>${s[0].toUpperCase() + s.slice(1)} (hours)</label><input class="in" name="${s}" inputmode="numeric" value="${SETTINGS.sla[s]}"></div>`).join('')}</div>
      <div class="field"><label>If the deadline passes, it goes to</label>${SETTINGS.ladder.map((r, i) => `<div class="row-flex" style="margin-top:6px"><span class="small" style="width:70px">Level ${i + 1}</span><select class="in" name="lvl${i}">${D.roles.filter(x => !LEAF_ROLES.includes(x.id)).map(x => `<option value="${x.id}" ${x.id === r ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>`).join('')}</div>
      <div id="ferr" class="errbox"></div><div><button class="btn primary" type="button" data-act="save-sla">Save</button></div></form>`;
  if (tab === 'templates') body = templatesPage();
  if (tab === 'connections') body = connections();
  if (tab === 'brand') body = `<p class="help">Set up with you during onboarding. Only your logo appears to your staff and clients — never ours.</p>
    <div class="grid g2" style="margin-top:14px"><div class="card" style="background:linear-gradient(165deg,var(--brand-deep),var(--brand-green));display:grid;place-items:center;min-height:160px"><img src="${LOGO}" alt="" style="height:44px"></div>
      <div class="card"><div class="row-flex"><span class="swatch" style="background:${br.primary}"></span><span>Primary · ${br.primary}</span></div><div class="row-flex" style="margin-top:10px"><span class="swatch" style="background:${br.accent}"></span><span>Accent · ${br.accent}</span></div>
        <p class="help" style="margin-top:12px">Headings: ${esc(br.font_heading)} · Text: ${esc(br.font_body)}. Colours are checked for readability automatically.</p></div></div>`;
  return `<div class="page-h"><div><div class="kicker">Director only</div><h1>Settings</h1></div></div>
    <div class="tabs-inline">${tabs.map(([k, l]) => `<a class="${tab === k ? 'on' : ''}" href="#/settings/${k}">${l}</a>`).join('')}</div><div class="card">${body}</div>`;
}
function templatesPage() {
  const list = D.templates.filter(x => tplFilter === 'all' || x.category === tplFilter), sample = C[D.story.capture_customer_id];
  const ST = { approved: ['good', 'Approved by Meta'], in_review: ['warn', 'In review at Meta'], recategorised: ['warn', 'Approved as Marketing (Meta changed it)'], rejected: ['bad', 'Rejected'] };
  const n = k => D.templates.filter(x => k === 'all' || x.category === k).length;
  return `<div class="page-h" style="margin-bottom:10px"><p class="help">Ready-made messages for starting or restarting a WhatsApp conversation. Details in {{ }} fill in automatically from the client's profile.</p><button class="btn primary" data-act="add-tpl">+ New template</button></div>
    <div class="grid g3" style="margin-bottom:18px">
      <div><b>Service messages</b><div class="why">Follow up on something the client did or asked — an enquiry, a booking, a purchase, a complaint. Allowed any time, even during a complaint. Must mention the client's own request and contain no offers.</div></div>
      <div><b>Marketing messages</b><div class="why">Festivals, new arrivals, events, greetings. Only to clients who agreed to marketing, and never while they have an open complaint.</div></div>
      <div><b>Why templates are needed</b><div class="why">Within 24 hours of a client's last message, staff can type anything. After that, WhatsApp allows only these pre-approved templates. Meta reviews each one — usually in minutes, at most 24–48 h — and can re-file a "service" template as marketing if it sounds promotional.</div></div></div>
    <div class="tabs-inline">${[['all', 'All'], ['utility', 'Service'], ['marketing', 'Marketing']].map(([k, l]) => `<button class="${tplFilter === k ? 'on' : ''}" data-act="tpl-filter" data-id="${k}">${l} <span class="muted small">${n(k)}</span></button>`).join('')}</div>
    <table class="t"><tr><th>Template</th><th>Type</th><th>When it's used</th><th>Preview — filled for ${esc(sample.name)}</th><th>Status</th></tr>
      ${list.map(x => `<tr><td><b>${esc(x.title)}</b><div class="small muted">${esc((x.languages || ['English']).join(', '))}</div></td><td><span class="chip ${x.category === 'utility' ? 'good' : ''}">${x.category === 'utility' ? 'Service' : 'Marketing'}</span></td>
        <td class="small">${esc(x.use)}</td><td class="small" style="max-width:420px">${esc(fillTpl(x, sample))}${x.buttons && x.buttons.length ? `<div style="margin-top:4px">${x.buttons.map(b => `<span class="ch">${esc(b)}</span>`).join(' ')}</div>` : ''}</td>
        <td><span class="chip ${ST[x.status][0]}">${ST[x.status][1]}</span></td></tr>`).join('')}</table>
    <p class="help" style="margin-top:10px">Any template can also be added in Telugu or Hindi — WhatsApp supports both.</p>`;
}
function tplForm() {
  tplVars = [];
  openModal(`<h2>New WhatsApp template</h2><p class="why">Write it once; staff can send it any time, even after the 24-hour window. Meta reviews it before first use.</p>
    <form id="f" class="form" onsubmit="return false">
      <div class="field"><label>Type *</label><div class="chips">${chipRadio('cat', ['Service', 'Marketing'], 'Service')}</div><div class="hint">Service = follows up on something the client did or asked. Marketing = anything promotional.</div></div>
      <div class="two"><div class="field"><label>Title *</label><input class="in" name="title" placeholder="e.g. Blouse ready for trial"></div><div class="field"><label>Language</label><select class="in" name="lang"><option>English</option><option>Telugu</option><option>Hindi</option></select></div></div>
      <div class="field"><label>Message *</label><textarea class="in" id="tpl-body" name="body" placeholder="Namaste {{1}}, …"></textarea>
        <div class="chips" style="margin-top:6px">${[['client', 'Client name'], ['advisor', 'Sales staff'], ['branch', 'Branch'], ['product', 'Saree'], ['date', 'Date'], ['time', 'Time'], ['order', 'Order no.']].map(([k, l]) => `<button type="button" class="chip on" data-act="tpl-var" data-id="${k}">+ ${l}</button>`).join('')}</div>
        <div id="tpl-warn"></div></div>
      <div class="field"><label>Quick-reply buttons (optional)</label><input class="in" name="buttons" placeholder="e.g. Confirm, Reschedule"></div>
      ${formBtns('save-tpl', 'Submit to Meta for approval')}</form>`);
}
function connections() {
  const last = ORD.reduce((a, o) => (o.at > a.at ? o : a)), pendingTally = ORD.filter(o => !o.tally).length;
  const syncedAt = ORD.filter(o => o.tally).reduce((a, o) => (o.tally > a ? o.tally : a), '');
  const card = (name, status, cls, lines) => `<div class="card"><div class="row-flex" style="justify-content:space-between"><h3>${name}</h3><span class="chip ${cls}">${status}</span></div><div class="why" style="margin-top:6px">${lines}</div></div>`;
  return `<div class="page-h" style="margin-bottom:10px"><p class="help">Everything is connected in real time — no end-of-day uploads.</p><button class="btn primary" data-act="sim">Simulate a POS sale</button></div>
    <div class="grid g3">
      ${card('Point of sale', 'Live', 'good', `Your existing POS pushes every sale instantly.<br>Last sale ${ago(last.at)} · ${esc(storeName(last.store))}`)}
      ${card('Tally', 'Syncing', 'good', `Small bridge on the accounts PC syncs every 1–2 minutes.<br>Last sync ${ago(syncedAt)} · ${pendingTally} invoice${pendingTally === 1 ? '' : 's'} in the queue`)}
      ${card('WhatsApp Business', 'Live', 'good', `Every message read by AI, approved by staff.<br>Last message ${ago(D.whatsapp.reduce((a, m) => (m.at > a ? m.at : a), ''))}`)}
      ${card('Payments', 'Live', 'good', 'Razorpay · card, UPI, EMI — payment events in real time.')}
      ${card('Google reviews', 'Setting up', 'warn', 'New reviews flow into Complaints; replies post back to Google.')}
      ${card('Instagram & Facebook', 'Setting up', 'warn', 'Comments and DMs flow into Complaints after Meta review.')}
    </div>`;
}
function simulateSale() {
  const pool = D.customers.filter(c => c.store === 'JBH' && c.n > 0 && !paused(c.id) && c.id !== D.story.capture_customer_id);
  const c = pool[Math.floor(Math.random() * pool.length)];
  const p = D.products.find(x => x.serial && ((D.stock[x.id] || {}).JBH || 0) > 0 && x.price > 30000);
  const total = Math.round(p.price * 1.05), before = c.tier;
  const o = { id: 'ord-sim' + ORD.length, no: `JBH/2609/${String(ORD.length + 1).padStart(5, '0')}`, at: D.now, store: 'JBH', adv: c.advisor, cust: c.id, total, prods: [p.id], inv: `VS/2026-${ORD.length + 1}`, tally: null };
  ORD.push(o); ORD_C = group(ORD.filter(x => x.cust), x => x.cust);
  D.stock[p.id].JBH -= 1; c.ltv += total; c.n += 1; c.last_buy = TODAY; retier();
  (D.owned[c.id] ||= []).push(['ast-sim', p.id, TODAY, 'JBH', 'SM' + Math.floor(1e7 + Math.random() * 9e7), 'VS-SIM']);
  toast('1 sale → 8 updates, in real time', [`POS sale received — ${inr(total)} at Jubilee Hills`, `Stock: ${p.name.slice(0, 40)} −1`, `${c.name}: 12-month spend now ${inr(c.spend12)}${c.tier !== before ? ` → now ${TIER[c.tier]}` : ''}`, 'Piece added to their collection · 12-month warranty started',
    'Invoice queued for Tally (syncs within 2 min)', `Targets: ${E[c.advisor].name} and Jubilee Hills updated`, 'Store manager notified', 'Thank-you + silk care guide drafted for approval']);
  render();
}

// ---------------------------------------------------------------- actions
function approve(mid) {
  const m = D.whatsapp.find(x => x.id === mid), card = m.card, x = card.extraction, c = C[m.customer_id];
  card.decided_ms = Date.now() - (cardOpened[card.id] || Date.now()); card.status = 'approved';
  const closed = windowLeft(c.id) <= 0, el = document.getElementById('draft-' + card.id), text = closed ? fillTpl('tpl_missed', c) : el ? el.value : draftFor(x, c), up = [];
  if (text) { D.whatsapp.push({ id: 'out-' + mid, customer_id: c.id, channel: 'whatsapp', direction: 'out', at: D.now, body: text, by: me().name + (closed ? ' · template' : '') });
    up.push(closed ? 'Sent the approved “Sorry we missed your message” template (WhatsApp 24-hour rule)' : `Reply sent from the Vaarahi Silks number (${WA_NUMBER})`); if (notifyAdvisor(c)) up.push(notifyAdvisor(c)); }
  up.push('Conversation logged on the client timeline');
  (x.preferences || []).forEach(p => (D.prefs[c.id] ||= []).push([p.kind, p.value, 'inferred_ai', true]));
  if ((x.preferences || []).length) up.push(`Preferences saved: ${x.preferences.map(p => p.value).join(', ')}`);
  if (x.occasion) { (D.dates[c.id] ||= []).push([x.occasion.kind, x.occasion.person || 'self', '']); up.push(`Occasion saved: ${x.occasion.person ? x.occasion.person + "'s " : ''}${x.occasion.kind}`); }
  const oos = (x.products || []).filter(id => !Object.values(D.stock[id] || {}).some(n => n > 0));
  oos.forEach(id => D.demand.push({ id: 'dem-' + mid + id, customer_id: c.id, product_id: id, status: 'waiting', requested_on: TODAY }));
  if (oos.length) up.push('Added to the waiting list — you\'ll be alerted when stock lands');
  if (x.follow_up_needed) { D.followups.push({ id: 'fu-' + mid, customer_id: c.id, trigger: 'capture', reason_text: `Asked on WhatsApp: “${m.body.slice(0, 50)}…”`, action: 'send_product', due_at: plus(1) + 'T11:00:00+05:30', owner_id: c.advisor || me().id, status: 'open' }); up.push('Follow-up set for tomorrow'); }
  toast(`Done in ${Math.max(1, Math.round(card.decided_ms / 1000))} s — no forms`, up);
  render();
}
const ACTIONS = {
  approve, 'open-grv': openGrievance, resolve, sim: simulateSale, voice, 'q-save': qSave, 'q-close': closeModal, quick: quickSheet,
  'close-modal': closeModal, tab: id => { tabState = id; render(); }, 'tier-filter': id => { tierFilter = id; render(); },
  theme: () => { const r = document.documentElement, cur = r.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); r.dataset.theme = cur === 'dark' ? 'light' : 'dark'; },
  dismiss: mid => { D.whatsapp.find(x => x.id === mid).card.status = 'dismissed'; render(); },
  'done-fu': fid => { const f = D.followups.find(x => x.id === fid); f.status = 'done'; toast('Done', [`${ACT[f.action] || 'Follow-up'} with ${C[f.customer_id].name} logged`, 'Removed from today\'s list · manager compliance updated']); render(); },
  'send-offer': did => { const d = D.demand.find(x => x.id === did); d.status = 'reserved'; d._fresh = false; toast('Offer sent', [`${C[d.customer_id].name} offered the ${P[d.product_id].name}`, 'Piece held for 48 h']); render(); },
  'ok-pref': key => { const [cid, i] = key.split('|'); D.prefs[cid][i][3] = true; render(); },
  share: pid => toast('Shared', [`${P[pid].name} sent with photos and price (demo)`]),
  reserve: pid => toast('Reserved', [`${P[pid].name} held for 48 h (demo)`]),
  more: () => moreSheet(), 'more-close': () => { document.getElementById('overlay').innerHTML = ''; },
  'add-client': () => clientForm(), 'edit-client': cid => clientForm(cid), 'save-new-client': saveNewClient, 'save-client': saveClient,
  'add-opp': cid => oppForm(cid), 'save-opp': saveOpp, 'fill-title': t => { document.querySelector('#f [name=title]').value = t; },
  'add-stock': stockForm, 'stock-mode': m => { stockMode = m; stockForm(); }, 'save-stock': saveStock, 'import-csv': importCsv,
  'rx-open': rxOpen, 'rx-next': () => { rx.step++; rxRender(); }, 'rx-back': () => { rx.step--; rxRender(); }, 'rx-confirm': rxConfirm,
  'resolve-open': resolveForm, 'reply-open': key => { replyOpen = key; if (location.hash !== '#/grievances/' + key.split('|')[0]) location.hash = '#/grievances/' + key.split('|')[0]; else render(); }, 'reply-cancel': () => { replyOpen = null; render(); }, 'reply-send': sendReply,
  'add-tpl': tplForm, 'tpl-filter': k => { tplFilter = k; render(); },
  'tpl-var': k => { const ta = document.getElementById('tpl-body'); let n = tplVars.indexOf(k) + 1; if (!n) { tplVars.push(k); n = tplVars.length; } ta.value += (ta.value && !ta.value.endsWith(' ') ? ' ' : '') + '{{' + n + '}}'; ta.focus(); tplWarn(); },
  'save-tpl': () => { const f = fd(), title = (f.get('title') || '').trim(), body = (f.get('body') || '').trim();
    if (!title || !body) return formError('Add a title and the message.');
    if ([...body.matchAll(/\{\{(\d+)\}\}/g)].some(m => Number(m[1]) > tplVars.length)) return formError('Use the buttons to insert details like {{1}} — each number needs a matching detail.');
    const cat = f.get('cat') === 'Service' ? 'utility' : 'marketing', promo = cat === 'utility' && PROMO.test(body);
    D.templates.push({ id: 'tpl_c' + Date.now(), channel: 'whatsapp', name: title.toLowerCase().replace(/[^a-z0-9]+/g, '_'), title, category: cat, languages: [f.get('lang')], body, vars: tplVars.slice(), use: 'Sent by staff from the chat',
      buttons: String(f.get('buttons') || '').split(',').map(s => s.trim()).filter(Boolean), status: 'in_review' });
    closeModal(); tplFilter = 'all';
    toast('Submitted to Meta for approval', [`"${title}" · ${cat === 'utility' ? 'Service' : 'Marketing'} · ${f.get('lang')}`, 'Meta usually approves within minutes (at most 24–48 h) — it appears in the chat picker once approved', promo ? 'Heads-up: it sounds promotional, so Meta may approve it as Marketing' : null]); render(); },
  'book-appt': key => apptForm(key), 'save-appt': saveAppt,
  'appt-status': key => { const [id, s] = key.split('|'), a = D.appointments.find(x => x.id === id); a.status = s; toast(s === 'completed' ? 'Marked as came in' : 'Marked as no-show', [`${C[a.customer_id].name} · ${tFmt(a.starts_at)}`, s === 'completed' ? 'Follow-up after the visit is drafted for the advisor' : 'Sales staff reminded to reschedule']); render(); },
  'add-design': () => designForm(), 'save-design': saveDesign, 'log-complaint': complaintForm, 'save-complaint': saveComplaint,
  'tgt-month': m => { tgtMonth = m; render(); },
  'split-even': () => { const el = document.getElementById('alloc-sum'), ins = [...document.querySelectorAll('[data-alloc]')]; ins.forEach(i => { i.value = lakh(Number(el.dataset.total) / ins.length); }); updateAlloc(); },
  'save-alloc': st => { const stT = targetOf('store', 'sto_' + st, tgtMonth); let n = 0, sum = 0;
    document.querySelectorAll('[data-alloc]').forEach(i => { const v = parseFloat(i.value); if (v > 0) { setTarget('advisor', i.dataset.alloc, v * 1e5, stT.id); n++; sum += v * 1e5; } });
    toast(`${n} Sales staff targets saved`, [`${storeName(st)} · ${monthLabel(tgtMonth)}`, `Each Sales staff member now sees their target on their home screen — set by ${me().name}`, sum > stT.target_value ? `${inr(sum - stT.target_value)} more than the branch target (stretch)` : `${inr(stT.target_value - sum)} of the branch target not yet allocated`]); render(); },
  'save-branch-tgts': () => { let n = 0; document.querySelectorAll('[data-btgt]').forEach(i => { const v = parseFloat(i.value); if (v > 0) { setTarget('store', i.dataset.btgt, v * 1e5); n++; } });
    const sumOf = ss => ss.reduce((s, x) => s + ((targetOf('store', x.id, tgtMonth) || {}).target_value || 0), 0);
    D.regions.forEach(r => setTarget('region', r.id, sumOf(D.stores.filter(s => s.region_id === r.id)))); const total = sumOf(D.stores); setTarget('brand', 'ten_vaarahi', total);
    toast(`${n} branch targets saved`, [`${monthLabel(tgtMonth)} · brand total ${inr(total)} (sum of branches)`, 'Region targets updated automatically', 'Each store manager is notified to split theirs between Sales staff']); render(); },
  'wa-send': cid => { const x = document.getElementById('wa-new'), c = C[cid]; if (!x.value.trim()) return; D.whatsapp.push({ id: 'wa-' + Date.now(), customer_id: cid, channel: 'whatsapp', direction: 'out', at: D.now, body: x.value.trim(), by: me().name });
    toast('Sent on WhatsApp', [`From the Vaarahi Silks number (${WA_NUMBER}), signed ${me().name.split(' ')[0]}`, notifyAdvisor(c), 'Saved on the client timeline']); render(); },
  'tpl-send': cid => { const c = C[cid], tp = tplById(document.getElementById('wa-tpl').value);
    if (tp.category === 'marketing' && mktBlock(c)) return toast('Not sent', [`Marketing templates can't go to this client right now (${mktBlock(c)}). Use a service template.`]);
    D.whatsapp.push({ id: 'wa-t' + Date.now(), customer_id: cid, channel: 'whatsapp', direction: 'out', at: D.now, body: fillTpl(tp, c), by: me().name + ' · template' });
    toast('Template sent', [`"${tp.title}" (${tp.category === 'utility' ? 'service' : 'marketing'}) from ${WA_NUMBER}`, 'Details filled in automatically from the client profile', 'When the client replies, free chat reopens for 24 hours', notifyAdvisor(c)]); render(); },
  'add-member': () => memberForm(), 'edit-member': id => memberForm(id), 'save-member': saveMember, 'remove-member': removeForm, 'confirm-remove': removeMember,
  'undo-move': () => { if (!lastMove) return; Object.assign(E[lastMove.id], { reports_to: lastMove.reports_to, store: lastMove.store, title: lastMove.title }); toast('Undone', [`${E[lastMove.id].name} is back where they were`]); lastMove = null; render(); },
  'add-role': () => openModal(`<h2>New role</h2><p class="why">For example "Senior Stylist" or "Cashier". Start from a similar role, then adjust what it can see.</p><form id="f" class="form" onsubmit="return false"><div class="field"><label>Role name *</label><input class="in" name="name"></div><div class="field"><label>Start from</label><select class="in" name="from">${D.roles.filter(r => r.id !== 'role_owner' && r.id !== 'role_admin').map(r => `<option value="${r.id}" ${r.id === 'role_advisor' ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></div>${formBtns('save-role', 'Create role')}</form>`),
  'save-role': () => { const f = fd(), name = (f.get('name') || '').trim(); if (!name) return formError('Give the role a name.'); const r = { id: 'role_c' + Date.now(), name, data_scope: {}, field_masks: {} }; D.roles.push(r); SETTINGS.access[r.id] = { ...SETTINGS.access[f.get('from')] }; closeModal(); toast(`Role "${name}" created`, [`Copied access from ${roleName(f.get('from'))} — adjust it in the table`, 'Pick it when adding a team member']); render(); },
  'save-tiers': () => { const f = fd(), v = Number(f.get('vip')) * 1e5, p = Number(f.get('premium')) * 1e5; if (!(v > p && p > 0)) return formError('VIP must start higher than Premium.'); const before = D.customers.filter(c => c.tier === 'vip').length; SETTINGS.tiers = { vip: v, premium: p }; retier(); toast('Tiers recalculated', [`VIP: ${before} → ${D.customers.filter(c => c.tier === 'vip').length} clients`, `Premium: ${D.customers.filter(c => c.tier === 'premium').length} clients`, 'Clients with a hand-set tier are unchanged']); render(); },
  'save-sla': () => { const f = fd(); ['critical', 'high', 'medium', 'low'].forEach(s => { SETTINGS.sla[s] = Number(f.get(s)) || SETTINGS.sla[s]; }); SETTINGS.ladder = SETTINGS.ladder.map((r, i) => f.get('lvl' + i) || r); toast('Complaint deadlines saved', [`Critical ${SETTINGS.sla.critical} h · High ${SETTINGS.sla.high} h · Medium ${SETTINGS.sla.medium} h · Low ${SETTINGS.sla.low} h`, `Escalation: ${SETTINGS.ladder.map(roleName).join(' → ')}`, 'Applies to new complaints from now on']); },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || (el.classList.contains('ov') && e.target !== el)) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset.id); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { query = t.value; const pos = t.selectionStart; render(); const q = document.getElementById('q'); q.focus(); q.setSelectionRange(pos, pos); }
  if (t.id === 'f-phone') { const d10 = digits10(t.value), dup = d10.length === 10 && findByPhone(d10, t.dataset.self);
    document.getElementById('dup').innerHTML = dup ? `<div class="warnbox">Already a client: <a href="#/customer/${dup.id}" data-act="close-modal"><u>${esc(dup.name)}</u></a> · ${esc(storeName(dup.store))} · Sales staff ${esc(advName(dup))}</div>` : ''; }
  if (t.id === 'catq') { catQ = t.value; const pos = t.selectionStart; render(); const q = document.getElementById('catq'); q.focus(); q.setSelectionRange(pos, pos); }
  if (t.id === 'tpl-body') tplWarn();
  if (t.id === 'f-wphone') walkinLookup(t);
  if (t.id === 'vq') { visitQ = t.value; const pos = t.selectionStart; render(); const q = document.getElementById('vq'); q.focus(); q.setSelectionRange(pos, pos); }
  if (t.dataset.alloc) updateAlloc();
  if (t.dataset.rxGot) rx.got[t.dataset.rxGot] = Math.max(0, parseInt(t.value, 10) || 0);
  if (t.dataset.rxTag) { const [l, i] = t.dataset.rxTag.split('|'); rx.tags[l][i] = t.value; }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'role') { role = t.value; storyOn = null; tabState = 'owns'; replyOpen = null; location.hash = '#/home'; render(); }
  if (t.dataset.acc) { const [rid, k] = t.dataset.acc.split('|'); SETTINGS.access[rid][k] = t.type === 'checkbox' ? t.checked : t.value;
    toast('Saved — applies immediately', [`${roleName(rid)}: ${k === 'scope' ? 'sees ' + SCOPE[t.value].toLowerCase() : `${{ cost: 'cost & margins', reports: 'sales reports', export: 'export', team: 'manage team' }[k]} ${t.checked ? 'on' : 'off'}`}`]); }
  if (t.name === 'store' && t.closest('#f') && document.getElementById('f-adv')) document.getElementById('f-adv').innerHTML = advOptions(t.value, '');
  if (t.dataset.assign) { const c = C[t.dataset.assign], before = c.advisor; c.advisor = t.value || null;
    D.followups.filter(x => x.customer_id === c.id && x.status !== 'done').forEach(x => { x.owner_id = c.advisor; });
    toast(`${c.first} assigned to ${advName(c)}`, [before ? `Was: ${E[before].name}` : 'Was: unassigned (new number)', `${advName(c)} is notified and owns this chat from now on`, 'Open follow-ups moved to them', 'Anyone allowed can still reply — always from the brand number']); render(); }
  if (t.id === 'wa-tpl') document.getElementById('tpl-prev').textContent = fillTpl(t.value, C[t.dataset.cid]);
  if (t.name === 'cat' && t.closest('#f')) tplWarn();
  if (t.id === 'alloc-store') { allocStore = t.value; render(); }
  if (t.id === 'cat-coll') { catColl = t.value; render(); }
  if (t.id === 'f-coll') document.getElementById('f-newcoll').style.display = t.value === '__new' ? '' : 'none';
  if (t.id === 'f-photos') [...t.files].slice(0, 4).forEach(file => { const r = new FileReader(); r.onload = () => { newImgs.push(String(r.result)); document.getElementById('photoprev').innerHTML = newImgs.map(u => `<img src="${u}" alt="" style="width:56px;height:74px;object-fit:cover;border-radius:8px">`).join(''); }; r.readAsDataURL(file); });
  if (t.id === 'csv' && t.files[0]) { const r = new FileReader(); r.onload = () => { csvRows = parseCsv(String(r.result)); const ok = csvRows.filter(x => x.p && x.st && x.q > 0);
    document.getElementById('csvprev').innerHTML = `<table class="t"><tr><th>Saree</th><th>Branch</th><th>Qty</th><th></th></tr>${csvRows.map(x => `<tr><td>${esc(x.n)}</td><td>${esc(x.b)}</td><td>${x.q || ''}</td><td>${x.p && x.st && x.q > 0 ? '<span class="chip good">OK</span>' : `<span class="chip bad">${!x.p ? 'saree not found' : !x.st ? 'branch not found' : 'check qty'}</span>`}</td></tr>`).join('')}</table>
      <div class="row-flex" style="margin-top:12px"><button class="btn primary" data-act="import-csv" ${ok.length ? '' : 'disabled'}>Import ${ok.length} rows</button><button class="btn ghost" data-act="close-modal">Cancel</button></div>`; }; r.readAsText(t.files[0]); }
});
// drag & drop on the team chart
document.addEventListener('dragstart', e => { const n = e.target.closest && e.target.closest('[data-emp]'); if (n) { e.dataTransfer.setData('text/plain', n.dataset.emp); e.dataTransfer.effectAllowed = 'move'; } });
document.addEventListener('dragover', e => { const t = e.target.closest && e.target.closest('[data-drop]'); if (t) { e.preventDefault(); t.classList.add('over'); } });
document.addEventListener('dragleave', e => { const t = e.target.closest && e.target.closest('[data-drop]'); if (t) t.classList.remove('over'); });
document.addEventListener('drop', e => { const t = e.target.closest && e.target.closest('[data-drop]'); if (!t) return; e.preventDefault(); moveEmployee(e.dataTransfer.getData('text/plain'), t.dataset.drop); });

// ---------------------------------------------------------------- walk-in floor (D28): allocation → consultant → billing
// Sales staff (back office) work WhatsApp and follow-ups; these three teams work the shop floor.
// Every visit keeps its shortlist, so what a client liked but didn't buy lands on their profile.
const VISITS = D.visits;
let audColl = 'all';
const FLOOR = ['allocation', 'consultant', 'billing'];
const MARK = { liked: 'Liked', owns: 'Already has', buying: 'Buying', no: 'Said no', bought: 'Bought' };
const MARK_CHIP = { bought: 'good', buying: 'good', liked: 'premium', no: 'bad', owns: '' };
const VSTATUS = { waiting: 'Waiting', with_consultant: 'With consultant', at_billing: 'At billing', done: 'Done' };
const LOOKING = ['Kanchi Pattu', 'Banarasi', 'Paithani', 'Tussar', 'Patola', 'Fancy / Designer', 'Tissue', 'Khadi', 'Organza', 'Georgette'];
const BUDGET_RANGE = { 'Up to ₹25K': [0, 25000], '₹25–50K': [25000, 50000], '₹50–80K': [50000, 80000], '₹80K–1.5L': [80000, 150000], '₹1.5L+': [150000, 1e7] };
const rs = n => '₹' + Math.round(n).toLocaleString('en-IN');  // exact rupees for bills
const withGst = n => Math.round(n * 1.05);  // GST 5% on sarees, as on every order in the sample data
const pname = pid => P[pid].name.replace(/ Saree.*$/i, '');
const visitById = id => VISITS.find(v => v.id === id);
const orderOf = v => ORD.find(o => o.id === v.order_id);
const buying = v => v.items.filter(i => i.mark === 'buying');
const sumPrice = items => items.reduce((s, i) => s + P[i.product_id].price, 0);
const consultantsAt = st => active().filter(e => e.role === 'role_consultant' && e.store === st);
const busyWith = eid => VISITS.filter(v => v.consultant_id === eid && v.status === 'with_consultant').length;
const lastVisit = cid => VISITS.filter(v => v.customer_id === cid).reduce((a, v) => (!a || v.arrived_at > a.arrived_at ? v : a), null);
const paidToday = st => VISITS.filter(v => v.store === st && v.order_id && (v.closed_at || '').startsWith(TODAY));
const goHome = () => { if (location.hash === '#/home') render(); else location.hash = '#/home'; };
// liked in store and never bought — the audience for follow-ups and campaigns
function interestOf(cid) {
  const vs = VISITS.filter(v => v.customer_id === cid);
  if (!vs.length) return [];
  const got = new Set([...vs.flatMap(v => v.items.filter(i => i.mark === 'bought').map(i => i.product_id)), ...(D.owned[cid] || []).map(o => o[1])]);
  return [...new Set(vs.flatMap(v => v.items.filter(i => i.mark === 'liked').map(i => i.product_id)))].filter(p => !got.has(p));
}

function visitRow(v, action = '') {
  const c = C[v.customer_id], b = buying(v);
  const meta = [v.looking_for.join(', ') || 'Browsing', v.budget, v.occasion, v.party > 1 ? `${v.party} people` : ''].filter(Boolean).join(' · ');
  const state = v.status === 'waiting' ? `Arrived ${ago(v.arrived_at)}`
    : v.status === 'with_consultant' ? `${esc(E[v.consultant_id].name)} · ${v.items.length} shortlisted`
    : v.status === 'at_billing' ? `${esc(E[v.consultant_id].name)} · ${b.length} to bill · ${rs(withGst(sumPrice(b)))}`
    : v.order_id ? `Bought ${rs(orderOf(v).total)} · ${tFmt(v.closed_at)}` : `Left without buying · liked ${v.items.filter(i => i.mark === 'liked').length}`;
  return `<div class="row">${avatar(C[v.customer_id])}<div class="grow"><a class="name" href="#/visit/${v.id}">${esc(c.name)}</a> ${tier(c)}<div class="why">${esc(meta)}</div><div class="small muted">${state}</div></div>${action}</div>`;
}
const visitList = (vs, action) => vs.length ? `<div class="list">${vs.map(v => visitRow(v, action ? action(v) : '')).join('')}</div>` : '<div class="empty">No one.</div>';

// ---- allocation staff: take the details, hand over to a consultant
function floorHome() {
  const st = myStore(), today = VISITS.filter(v => v.store === st && v.arrived_at.startsWith(TODAY)).sort((a, b) => b.arrived_at.localeCompare(a.arrived_at));
  const col = s => today.filter(v => v.status === s), cs = consultantsAt(st);
  return `<div class="stack">
    <div class="page-h" style="margin-bottom:0"><div><div class="kicker">${esc(storeName(st))} · ${dFmt(TODAY)}</div><h1>Walk-ins today</h1></div>${isPhone() ? '' : '<button class="btn primary" data-act="new-walkin">+ New walk-in</button>'}</div>
    <div class="card kv"><div><span>Waiting</span><b>${col('waiting').length}</b></div><div><span>With consultant</span><b>${col('with_consultant').length}</b></div><div><span>At billing</span><b>${col('at_billing').length}</b></div><div><span>Consultants free</span><b>${cs.filter(e => !busyWith(e.id)).length} of ${cs.length}</b></div></div>
    ${section(`Waiting <span class="muted small">(${col('waiting').length})</span>`, visitList(col('waiting'), v => `<button class="btn sm primary" data-act="allocate" data-id="${v.id}">Allocate</button>`))}
    ${section('With a consultant', visitList(col('with_consultant')))}
    ${section('At billing', visitList(col('at_billing')))}
    ${section('Done today', visitList(col('done')))}
  </div>`;
}
function consultantPick(st, cid, allowWait) {
  const last = cid && (VISITS.filter(v => v.customer_id === cid && v.consultant_id).sort((a, b) => b.arrived_at.localeCompare(a.arrived_at))[0] || {}).consultant_id;
  const list = consultantsAt(st).sort((a, b) => (b.id === last) - (a.id === last) || busyWith(a.id) - busyWith(b.id));
  return `<div class="field"><label>Hand over to</label><div class="list">${list.map((e, i) => `<label class="row" style="cursor:pointer"><input type="radio" name="cons" value="${e.id}" ${i === 0 ? 'checked' : ''}><div class="grow"><b>${esc(e.name)}</b>${e.id === last ? ' <span class="chip vip">Served them last time</span>' : ''}<div class="why">${busyWith(e.id) ? `With ${busyWith(e.id)} client now` : 'Free now'}</div></div></label>`).join('')}
    ${allowWait ? '<label class="row" style="cursor:pointer"><input type="radio" name="cons" value=""><div class="grow"><b>No one free — keep waiting</b></div></label>' : ''}</div>
    <div class="hint">Suggested order: whoever served them last time, then whoever is free. You decide.</div></div>`;
}
function walkinForm() {
  openModal(`<h2>New walk-in</h2><p class="why">Mobile first — a returning client's details fill in by themselves. Then hand over to a consultant.</p>
    <form id="f" class="form" onsubmit="return false">
      <div class="field"><label>Mobile *</label><input class="in" id="f-wphone" name="phone" inputmode="tel" placeholder="10-digit mobile"><div id="wfound"></div></div>
      <div class="two"><div class="field"><label>Title</label><select class="in" name="sal">${['Mrs.', 'Ms.', 'Mr.', 'Dr.'].map(s => `<option>${s}</option>`).join('')}</select></div>
        <div class="field"><label>Name *</label><input class="in" id="f-wname" name="name" placeholder="e.g. Lakshmi Reddy"></div></div>
      <div class="field"><label>Looking for</label><div class="chips">${chipChecks('looking', LOOKING)}</div></div>
      <div class="field"><label>Budget</label><div class="chips">${chipRadio('budget', Object.keys(BUDGET_RANGE), '')}</div></div>
      <div class="field"><label>Occasion</label><div class="chips">${chipRadio('occasion', ['Wedding', 'Festival', 'Anniversary', 'Birthday', 'Gift', 'Just browsing'], '')}</div></div>
      <div class="two"><div class="field"><label>Buying for</label><select class="in" name="for_whom">${['Self', 'Daughter', 'Daughter-in-law', 'Mother', 'Sister', 'Someone else'].map(s => `<option>${s}</option>`).join('')}</select></div>
        <div class="field"><label>People with them</label><input class="in" type="number" name="party" min="1" value="1"></div></div>
      <div class="field"><label class="chip on" style="width:max-content"><input type="checkbox" name="consent"> Agreed to WhatsApp updates from Vaarahi</label><div class="hint">Ask first — campaigns only go to clients who said yes.</div></div>
      <div id="wcons">${consultantPick(myStore(), null, true)}</div>
      ${formBtns('save-walkin', 'Save & hand over')}
    </form>`);
}
function walkinLookup(t) {
  const d10 = digits10(t.value), c = d10.length === 10 && findByPhone(d10), box = document.getElementById('wfound'), f = document.getElementById('f');
  if (c) {
    const last = lastVisit(c.id), hh = D.households[c.id], likes = interestOf(c.id).length, open = VISITS.find(v => v.customer_id === c.id && v.status !== 'done');
    box.innerHTML = open ? `<div class="warnbox"><b>${esc(c.name)} is already on the floor</b> — ${VSTATUS[open.status].toLowerCase()}${open.consultant_id ? ' · ' + esc(E[open.consultant_id].name) : ''} since ${tFmt(open.arrived_at)}. <a href="#/visit/${open.id}" data-act="close-modal"><u>Open their visit</u></a></div>` : `<div class="okbox"><b>Returning client: ${esc(c.name)}</b> ${tier(c)}<br>${hh ? esc(hh.name) + ' · ' : ''}Sales staff ${esc(advName(c))}${last ? ` · last visit ${dFmt(last.arrived_at)}` : ''}${likes ? ` · liked ${likes} piece${likes > 1 ? 's' : ''} before` : ''}</div>`;
    f.elements.name.value = (c.first + ' ' + c.last).trim(); f.elements.sal.value = c.name.split(' ')[0]; f.elements.consent.checked = !!c.consent_wa;
  } else box.innerHTML = d10.length === 10 ? '<div class="help" style="margin-top:4px">New client — add their name below.</div>' : '';
  document.getElementById('wcons').innerHTML = consultantPick(myStore(), c ? c.id : null, true);
}
function saveWalkin() {
  const f = fd(), d10 = digits10(f.get('phone')), name = (f.get('name') || '').trim(), st = myStore();
  if (d10.length !== 10) return formError('Please enter a 10-digit mobile number.');
  let c = findByPhone(d10);
  const isNew = !c, open = c && VISITS.find(v => v.customer_id === c.id && v.status !== 'done');
  if (open) return formError(`${c.name} is already on the floor (${VSTATUS[open.status].toLowerCase()}) — open their visit instead of logging them twice.`);
  if (isNew) {
    if (!name) return formError('New client — please add their name.');
    const [first, ...rest] = name.split(/\s+/);
    c = { id: 'cus_new' + Date.now(), code: 'VS-C' + String(D.customers.length + 1).padStart(5, '0'), name: `${f.get('sal')} ${name}`, first, last: rest.join(' '),
      phone: '+91' + d10, email: null, tier: 'prospect', store: st, advisor: null, channel: 'in_store', lang: 'Telugu', dob: null, status: 'active',
      consent_wa: false, dnc: false, source: 'walk-in', ltv: 0, n: 0, first_buy: null, last_buy: null, spend12: 0, created: D.now };
    D.customers.push(c); C[c.id] = c;
  }
  if (f.get('consent')) c.consent_wa = true;
  const cons = f.get('cons') || null, looking = f.getAll('looking');
  VISITS.push({ id: 'vis_new' + Date.now(), customer_id: c.id, store: st, arrived_at: D.now, allocated_by: me().id, consultant_id: cons, status: cons ? 'with_consultant' : 'waiting',
    looking_for: looking, budget: f.get('budget') || null, occasion: f.get('occasion') || null, for_whom: f.get('for_whom'), party: Math.max(1, parseInt(f.get('party'), 10) || 1),
    order_id: null, sent_at: null, closed_at: null, items: [] });
  const took = secs(); closeModal();
  toast(`Walk-in logged in ${took} s`, [isNew ? `New client ${c.name} — Prospect` : `Returning client ${c.name} — history attached`, looking.length ? `Looking for ${looking.join(', ')}${f.get('budget') ? ' · ' + f.get('budget') : ''}` : null,
    cons ? `Handed to ${E[cons].name} — notified on their phone` : 'Waiting — allocate when a consultant is free', D.households[c.id] ? `Family: ${D.households[c.id].name}` : null]);
  render();
}
function allocateForm(vid) {
  const v = visitById(vid), c = C[v.customer_id];
  openModal(`<h2>Allocate ${esc(c.first)}</h2><p class="why">${esc([v.looking_for.join(', '), v.budget].filter(Boolean).join(' · ') || 'Browsing')} · arrived ${ago(v.arrived_at)}</p>
    <form id="f" class="form" onsubmit="return false">${consultantPick(v.store, c.id, false)}${formBtns('save-allocate', 'Hand over', vid)}</form>`, false);
}
function saveAllocate(vid) {
  const v = visitById(vid), cons = fd().get('cons');
  if (!cons) return formError('Pick a consultant.');
  Object.assign(v, { consultant_id: cons, status: 'with_consultant' });
  closeModal(); toast('Handed over', [`${C[v.customer_id].name} → ${E[cons].name}`, `${E[cons].name} is notified with what they're looking for${v.budget ? ' and the budget' : ''}`]); render();
}

// ---- consultant staff: family, shortlist, mark each piece, send to billing
function consultantHome() {
  const u = me(), now = VISITS.filter(v => v.consultant_id === u.id && v.status === 'with_consultant');
  const earlier = VISITS.filter(v => v.consultant_id === u.id && v.arrived_at.startsWith(TODAY) && v.status !== 'with_consultant');
  const waiting = VISITS.filter(v => v.store === myStore() && v.status === 'waiting');
  return `<div class="stack">
    <div><div class="kicker">${esc(storeName(u.store))} · ${dFmt(TODAY)}</div><h1>Good afternoon, ${esc(u.name.split(' ')[0])}</h1></div>
    ${section(`With you now <span class="muted small">(${now.length})</span>`, visitList(now, v => `<a class="btn sm primary" href="#/visit/${v.id}">Open</a>`))}
    ${section('Earlier today', visitList(earlier))}
    ${section(`Waiting at the door <span class="muted small">(${waiting.length})</span>`, visitList(waiting) + '<div class="help" style="margin-top:8px">Allocation staff hand these over — tell them when you are free.</div>')}
  </div>`;
}
let visitQ = '';
function visitView(id) {
  const v = visitById(id);
  if (!v) return '<div class="empty">Visit not found.</div>';
  const c = C[v.customer_id], hh = D.households[c.id], edit = kind() === 'consultant' && v.status === 'with_consultant', b = buying(v);
  const earlier = VISITS.filter(x => x.customer_id === c.id && x.id !== v.id && x.arrived_at < v.arrived_at);
  const inList = new Set(v.items.map(i => i.product_id)), owned = D.owned[c.id] || [];
  const saidNo = [...new Set(earlier.flatMap(x => x.items.filter(i => i.mark === 'no').map(i => i.product_id)))].filter(p => !inList.has(p));
  const [lo, hi] = BUDGET_RANGE[v.budget] || [0, 1e7], q = visitQ.toLowerCase();
  const avail = p => !inList.has(p.id) && !saidNo.includes(p.id) && ((D.stock[p.id] || {})[v.store] || 0) > 0;
  const want = p => !v.looking_for.length || v.looking_for.includes(p.collection);
  let ideas = D.products.filter(p => avail(p) && (q ? (p.name + ' ' + p.collection).toLowerCase().includes(q) : want(p) && p.price >= lo * .8 && p.price <= hi * 1.2));
  if (!ideas.length && !q) ideas = D.products.filter(p => avail(p) && want(p));
  const back = kind() === 'consultant' ? ['#/home', 'My clients'] : FLOOR.includes(kind()) ? ['#/home', 'Walk-ins'] : [`#/customer/${c.id}`, c.first];
  return `<div class="stack">
    <a class="small muted" href="${back[0]}">← ${esc(back[1])}</a>
    <div class="c360-h">${avatar(c, 'lg')}<div class="grow"><h2>${esc(c.name)}</h2><div class="row-flex">${tier(c)}<span class="chip ${v.status === 'done' ? 'good' : v.status === 'waiting' ? 'warn' : ''}">${VSTATUS[v.status]}</span></div>
      <div class="help" style="margin-top:4px">${v.arrived_at.startsWith(TODAY) ? 'Arrived ' + tFmt(v.arrived_at) : dFmt(v.arrived_at)} · allocated by ${esc((E[v.allocated_by] || {}).name || '—')}${v.consultant_id ? ' · consultant ' + esc(E[v.consultant_id].name) : ''} · <a href="#/customer/${c.id}"><u>Full profile</u></a></div></div></div>
    <div class="card kv"><div><span>Looking for</span><b>${esc(v.looking_for.join(', ') || 'Browsing')}</b></div><div><span>Budget</span><b>${esc(v.budget || '—')}</b></div>
      <div><span>Occasion</span><b>${esc([v.occasion, v.for_whom && v.for_whom !== 'Self' ? 'for ' + v.for_whom.toLowerCase() : ''].filter(Boolean).join(' ') || '—')}</b></div><div><span>With them</span><b>${v.party > 1 ? v.party + ' people' : 'Alone'}</b></div></div>
    <div class="card"><div class="row-flex" style="justify-content:space-between"><div class="grow"><div class="kicker">Family</div>${hh ? `<b>${esc(hh.name)}</b><div class="why">${hh.members.filter(([m]) => m !== c.id).map(([m, rel]) => `${esc(C[m].name)} (${esc(rel)})`).join(' · ') || 'No other members yet'}</div>`
      : '<div class="why">Not linked to a family yet — link them so the whole household\'s purchases and likes show together.</div>'}</div>
      ${edit ? `<button class="btn sm${hh ? '' : ' primary'}" data-act="family-open" data-id="${v.id}">${hh ? 'Change family' : 'Attach to a family'}</button>` : ''}</div></div>
    ${owned.length || saidNo.length ? `<div class="card"><div class="kicker">Before you show anything</div>
      ${owned.length ? `<div class="why" style="margin:6px 0">Already owns ${owned.length} piece${owned.length > 1 ? 's' : ''} from us — ${esc([...new Set(owned.map(o => P[o[1]].collection))].slice(0, 3).join(', '))}</div>` : ''}
      ${saidNo.length ? `<div class="why" style="margin:6px 0"><b>Don't show again</b> — said no on an earlier visit:</div><div class="cap-prods">${saidNo.slice(0, 4).map(pid => `<div class="mini">${pimg(P[pid], 160)}<span class="small">${esc(P[pid].name)}<br><b>${inr(P[pid].price)}</b></span></div>`).join('')}</div>` : ''}</div>` : ''}
    ${section(`Shortlist <span class="muted small">(${v.items.length} shown · ${b.length} buying)</span>`, v.items.length ? `<div class="list">${v.items.map(i => { const p = P[i.product_id];
      return `<div class="row"><a class="mini grow" href="#/product/${p.id}">${pimg(p, 160)}<span class="grow"><span class="small">${esc(p.name)}</span><br><b>${inr(p.price)}</b> <span class="small muted">· ${esc(p.collection)}</span></span></a>
        ${edit ? `<div class="seg">${['liked', 'owns', 'buying', 'no'].map(k => `<button class="${i.mark === k ? 'on' : ''}" data-act="mark" data-id="${v.id}|${p.id}|${k}">${MARK[k]}</button>`).join('')}</div>` : `<span class="chip ${MARK_CHIP[i.mark]}">${MARK[i.mark]}</span>`}</div>`; }).join('')}</div>`
      : '<div class="empty">Nothing shortlisted yet — add pieces below or scan a tag.</div>')}
    ${edit ? `<div class="card" style="border-color:var(--ge-accent)"><div class="why" style="margin-bottom:10px">${b.length ? `Billing charges only the ${b.length} piece${b.length > 1 ? 's' : ''} marked Buying — ${rs(withGst(sumPrice(b)))} incl. GST. Everything else stays on their profile.` : 'Mark what they are taking as <b>Buying</b>, then send them to billing.'}</div>
      <div class="row-flex"><button class="btn primary" data-act="to-billing" data-id="${v.id}" ${b.length ? '' : 'disabled'}>Send to billing${b.length ? ` · ${b.length} piece${b.length > 1 ? 's' : ''}` : ''}</button><button class="btn ghost" data-act="left-visit" data-id="${v.id}">Left without buying</button></div></div>` : ''}
    ${edit ? section('Add pieces', `<div class="row-flex" style="margin-bottom:10px"><input id="vq" class="in grow" placeholder="Search any design or collection" value="${esc(visitQ)}"><button class="btn" data-act="scan-tag" data-id="${v.id}">Scan tag</button></div>
      <div class="help" style="margin-bottom:12px">${q ? 'Search results, in stock here' : `Suggested: ${esc(v.looking_for.join(', ') || 'all collections')} in stock here${v.budget ? ', around ' + esc(v.budget) : ''}`}${saidNo.length ? ' · pieces they said no to are hidden' : ''}</div>
      <div class="pgrid">${ideas.slice(0, 12).map(p => `<div class="pcard">${pimg(p, 480)}<div class="pn">${esc(p.name)}</div><div class="pp">${inr(p.price)}</div><button class="btn sm" style="margin-top:6px;width:100%;justify-content:center" data-act="shortlist" data-id="${v.id}|${p.id}">+ Shortlist</button></div>`).join('') || '<div class="empty">Nothing matches.</div>'}</div>`) : ''}
  </div>`;
}
function scanTag(vid) {
  const v = visitById(vid), inList = new Set(v.items.map(i => i.product_id));
  const pool = D.products.filter(p => p.serial && !inList.has(p.id) && ((D.stock[p.id] || {})[v.store] || 0) > 0 && (!v.looking_for.length || v.looking_for.includes(p.collection)));
  const p = pool[Math.floor(Math.random() * pool.length)] || D.products.find(x => !inList.has(x.id));
  v.items.push({ product_id: p.id, mark: 'liked' });
  toast('Tag scanned', [`SM${Math.floor(1e7 + Math.random() * 9e7)} → ${p.name}`, `${inr(p.price)} · added to the shortlist as Liked`]); render();
}
function familyForm(vid) {
  const c = C[visitById(vid).customer_id];
  openModal(`<h2>Attach ${esc(c.first)} to a family</h2><p class="why">Link them to a family member who is already a client — or start a new family. Everyone's purchases and likes then show together.</p>
    <form id="f" class="form" onsubmit="return false">
      <div class="field"><label>Family member (name or mobile)</label><input class="in" name="cname" list="cdl" placeholder="Start typing"><datalist id="cdl">${D.customers.filter(x => x.store === c.store && x.id !== c.id).map(x => `<option value="${esc(x.name)} · ${digits10(x.phone)}">`).join('')}</datalist></div>
      <div class="field"><label>${esc(c.first)} is their…</label><div class="chips">${chipRadio('rel', ['spouse', 'daughter', 'son', 'daughter-in-law', 'mother', 'sister', 'family'], 'family')}</div></div>
      <div class="field"><label>…or start a new family</label><input class="in" name="newfam" placeholder="e.g. ${esc(c.last || c.first)} family"></div>
      ${formBtns('save-family', 'Link family', vid)}</form>`);
}
function saveFamily(vid) {
  const c = C[visitById(vid).customer_id], f = fd(), m = pickedClient(f), fresh = (f.get('newfam') || '').trim(), rel = f.get('rel') || 'family';
  if (!m && !fresh) return formError('Pick a family member from the list, or name a new family.');
  if (m && m.id === c.id) return formError('Pick someone other than the client.');
  const setFamily = h => h.members.forEach(([x]) => { D.households[x] = h; });
  const old = D.households[c.id];
  if (old) { delete D.households[c.id]; const rest = { name: old.name, members: old.members.filter(([x]) => x !== c.id) }; if (rest.members.length) setFamily(rest); }
  const mh = m && D.households[m.id];
  const h = !m ? { name: fresh, members: [[c.id, 'self']] } : mh ? { name: mh.name, members: [...mh.members, [c.id, rel]] } : { name: `${m.last || m.first} family`, members: [[m.id, 'self'], [c.id, rel]] };
  setFamily(h);
  closeModal();
  toast(`Linked to ${h.name}`, [m ? `${c.name} — ${rel} of ${m.name}` : 'New family started — link members as they visit', `${h.members.length} member${h.members.length > 1 ? 's' : ''} · family lifetime value ${inr(h.members.reduce((s, [x]) => s + C[x].ltv, 0))}`, "Shows on every member's Family tab"]);
  render();
}
// closing a visit, bought or not: likes go to the profile, the client's Sales staff get the follow-up
function closeVisit(v, order) {
  const c = C[v.customer_id], up = [];
  Object.assign(v, { status: 'done', closed_at: D.now, order_id: order ? order.id : null });
  v.items.forEach(i => { if (i.mark === 'buying') i.mark = order ? 'bought' : 'liked'; });
  const liked = v.items.filter(i => i.mark === 'liked'), bought = v.items.filter(i => i.mark === 'bought').length;
  const colls = [...new Set(liked.map(i => P[i.product_id].collection))], prefs = (D.prefs[c.id] ||= []);
  colls.forEach(coll => { if (!prefs.some(p => p[0] === 'weave' && p[1] === coll)) prefs.push(['weave', coll, 'in_store', true]); });
  if (liked.length) up.push(`Saved to ${c.first}'s profile: liked ${liked.length} piece${liked.length > 1 ? 's' : ''} (${colls.join(', ')})`);
  if (!liked.length && !bought) return up;
  const owner = c.advisor || S[v.store].manager_id;
  D.followups.push({ id: 'fu-v' + Date.now(), customer_id: c.id, trigger: 'in_store_visit', action: liked.length ? 'send_product' : 'whatsapp', due_at: TODAY + 'T18:00:00+05:30', owner_id: owner, status: 'open',
    reason_text: liked.length ? `In store today: liked ${liked.length}, bought ${bought} — follow up on ${liked.slice(0, 2).map(i => pname(i.product_id)).join(' and ')}` : 'Bought in store today — send a thank-you and the silk care guide' });
  up.push(c.advisor ? `Follow-up on ${E[c.advisor].name}'s list today (Sales staff)` : `No Sales staff yet — ${E[owner].name} (store manager) is asked to assign one`);
  return up;
}

// ---- billing staff: charge only what was marked Buying
function billingHome() {
  const st = myStore(), queue = VISITS.filter(v => v.store === st && v.status === 'at_billing').sort((a, b) => (a.sent_at || '').localeCompare(b.sent_at || ''));
  const paid = paidToday(st);
  return `<div class="stack">
    <div class="page-h" style="margin-bottom:0"><div><div class="kicker">${esc(storeName(st))} · ${dFmt(TODAY)}</div><h1>Billing desk</h1></div></div>
    <div class="grid g3"><div class="card stat"><div class="kicker">Waiting to pay</div><div class="v">${queue.length}</div></div>
      <div class="card stat"><div class="kicker">Walk-in bills today</div><div class="v">${inr(paid.reduce((s, v) => s + orderOf(v).total, 0))}</div><div class="d">${paid.length} bill${paid.length === 1 ? '' : 's'}</div></div>
      <div class="card stat"><div class="kicker">The rule</div><div class="d" style="margin-top:6px">Bill only what the consultant marked <b>Buying</b>. Everything else they liked stays on the client profile for Sales staff.</div></div></div>
    ${queue.map(billCard).join('') || '<div class="card empty">No one waiting to pay.</div>'}
  </div>`;
}
function billCard(v) {
  const c = C[v.customer_id], b = buying(v), sub = sumPrice(b), others = v.items.length - b.length;
  return `<section class="card"><div class="row-flex">${avatar(c)}<div class="grow"><a class="name" href="#/customer/${c.id}">${esc(c.name)}</a> ${tier(c)}<div class="why">${esc(c.phone.replace('+91', '+91 '))} · consultant ${esc(E[v.consultant_id].name)} · sent ${ago(v.sent_at || v.arrived_at)}</div></div></div>
    <div style="overflow-x:auto"><table class="t" style="margin-top:12px"><tr><th>Piece</th><th>Price</th><th></th></tr>${b.map(i => { const p = P[i.product_id];
      return `<tr><td><div class="mini">${pimg(p, 160)}<span>${esc(p.name)}<br><span class="small muted">${esc(p.collection)}${p.serial ? ' · Silk Mark tagged' : ''}</span></span></div></td><td>${rs(p.price)}</td><td style="text-align:right"><button class="btn sm ghost" data-act="bill-drop" data-id="${v.id}|${p.id}">Not taking</button></td></tr>`; }).join('')}
      <tr><td class="muted">GST 5%</td><td>${rs(withGst(sub) - sub)}</td><td></td></tr><tr><td><b>Total</b></td><td><b>${rs(withGst(sub))}</b></td><td></td></tr></table></div>
    ${others ? `<div class="help" style="margin:8px 0 12px">${others} other shortlisted piece${others > 1 ? 's are' : ' is'} not billed — kept on the profile as interests.</div>` : ''}
    ${b.length ? `<div class="row-flex" style="justify-content:space-between;margin-top:12px"><div class="chips">${chipRadio('pay-' + v.id, ['UPI', 'Card', 'Cash', 'Bank transfer'], 'UPI')}</div><button class="btn primary" data-act="bill-collect" data-id="${v.id}">Collect ${rs(withGst(sub))}</button></div>`
      : `<div class="row-flex" style="margin-top:12px"><span class="why grow">Nothing left to bill.</span><button class="btn" data-act="left-visit" data-id="${v.id}">Close — nothing bought</button></div>`}
  </section>`;
}
function collect(vid) {
  const v = visitById(vid), c = C[v.customer_id], b = buying(v);
  if (!b.length) return;
  const pay = (document.querySelector(`[name="pay-${vid}"]:checked`) || {}).value || 'UPI';
  const total = withGst(sumPrice(b)), before = c.tier, n = ORD.length + 1;
  const o = { id: 'ord-v' + n, no: `${v.store}/2609/${String(n).padStart(5, '0')}`, at: D.now, store: v.store, adv: v.consultant_id, cust: c.id, total, prods: b.map(i => i.product_id), inv: `VS/2026-${String(n).padStart(6, '0')}`, tally: null };
  ORD.push(o); ORD_C = group(ORD.filter(x => x.cust), x => x.cust);
  b.forEach(i => { const s = (D.stock[i.product_id] ||= {}); if (s[v.store] > 0) s[v.store] -= 1;
    if (P[i.product_id].serial) (D.owned[c.id] ||= []).push(['ast-v' + n + i.product_id, i.product_id, TODAY, v.store, 'SM' + Math.floor(1e7 + Math.random() * 9e7), 'VS-V' + n]); });
  c.ltv += total; c.n += 1; c.last_buy = TODAY; c.first_buy ||= TODAY; retier();
  const up = closeVisit(v, o);
  toast(`Paid ${rs(total)} by ${pay}`, [`${c.name} · invoice ${o.inv} → Tally (syncs within 2 min)`, `Billed only the ${b.length} piece${b.length > 1 ? 's' : ''} marked Buying`,
    `Stock at ${storeName(v.store)} updated · added to ${c.first}'s collection with warranty`, c.tier !== before ? `Tier: ${TIER[before]} → ${TIER[c.tier]}` : null, `Sale credited to ${E[v.consultant_id].name}`, ...up]);
  render();
}
function paidView() {
  const rows = paidToday(myStore()).sort((a, b) => b.closed_at.localeCompare(a.closed_at));
  return `<div class="page-h"><div><div class="kicker">${esc(storeName(myStore()))} · ${dFmt(TODAY)}</div><h1>Paid today</h1></div></div>
    <div class="card" style="overflow-x:auto">${rows.length ? `<table class="t"><tr><th>Time</th><th>Client</th><th>Pieces</th><th>Consultant</th><th>Invoice</th><th>Amount</th></tr>${rows.map(v => { const o = orderOf(v), c = C[v.customer_id];
      return `<tr><td>${tFmt(v.closed_at)}</td><td><a class="name" href="#/customer/${c.id}">${esc(c.name)}</a></td><td>${o.prods.map(p => esc(pname(p))).join(', ')}</td><td>${esc(E[v.consultant_id].name)}</td><td>${esc(o.inv)}<div class="small muted">${o.tally ? 'Tally ✓' : 'Tally: syncing'}</div></td><td><b>${rs(o.total)}</b></td></tr>`; }).join('')}</table>` : '<div class="empty">No bills yet today.</div>'}</div>`;
}
Object.assign(ACTIONS, {
  'new-walkin': walkinForm, 'save-walkin': saveWalkin, allocate: allocateForm, 'save-allocate': saveAllocate,
  mark: key => { const [vid, pid, m] = key.split('|'); visitById(vid).items.find(i => i.product_id === pid).mark = m; render(); },
  shortlist: key => { const [vid, pid] = key.split('|'); visitById(vid).items.push({ product_id: pid, mark: 'liked' }); render(); },
  'scan-tag': scanTag, 'family-open': familyForm, 'save-family': saveFamily,
  'to-billing': vid => { const v = visitById(vid), b = buying(v); if (!b.length) return; Object.assign(v, { status: 'at_billing', sent_at: D.now });
    toast('Sent to billing', [`${C[v.customer_id].name} · ${b.length} piece${b.length > 1 ? 's' : ''} · ${rs(withGst(sumPrice(b)))} incl. GST`, 'Billing sees only the pieces marked Buying', `${v.items.length - b.length} other shortlisted pieces stay on the client profile`]); goHome(); },
  'left-visit': vid => { const v = visitById(vid), up = closeVisit(v, null); toast(`${C[v.customer_id].first} left without buying`, [...up, 'Nothing billed']); goHome(); },
  'bill-drop': key => { const [vid, pid] = key.split('|'); visitById(vid).items.find(i => i.product_id === pid).mark = 'liked'; toast('Taken off the bill', [`${P[pid].name} — kept on the profile as Liked`]); render(); },
  'bill-collect': collect, 'aud-coll': k => { audColl = k; render(); },
});

// ---------------------------------------------------------------- stories + chrome + router
const STORIES = [
  { t: 'WhatsApp → captured in one tap', role: 'advisor', go: `#/inbox/${D.story.capture_customer_id}`, steps: ['A client asks for a peacock-blue Kanchi pattu on WhatsApp', 'AI has already matched real sarees, checked stock in 6 branches and drafted the reply', 'Tap “Approve & send” — see everything that gets logged, with no forms'] },
  { t: 'Bought at 2 pm, visits another branch at 4 pm', role: 'advisor_kph', go: `#/customer/${D.story.two_pm_customer_id}`, steps: ['You are Kukatpally Sales staff with a 4 pm walk-in', 'She bought at Jubilee Hills at 2:05 pm today', 'It is already on her profile here — no end-of-day sync'] },
  { t: 'Waiting list → stock arrives', role: 'manager', go: '#/inventory/VJA', steps: [`${D.demand.filter(d => d.product_id === D.story.demand_product_id).length} clients wait for the ${P[D.story.demand_product_id].name} — out of stock everywhere`, 'Tap “Receive shipment”: count it, scan the Silk Mark tags, confirm', 'Every waiting client\'s Sales staff are alerted, offer ready to send'] },
  { t: 'One complaint, many channels', role: 'manager', go: `#/grievances/${D.story.grievance_id}`, steps: ['A client complained on WhatsApp and left a 1-star Google review — merged into one case', 'Reply on each channel right from the case; the deadline passed so it went to the Regional Head', 'Tap “Mark resolved” — her paused marketing resumes on its own'] },
  { t: 'Targets at every level', role: 'owner', go: '#/home', steps: ['Brand, region, branch and Sales staff targets roll up automatically', 'See who is behind and the daily pace needed', 'Switch roles above — same data, shaped for each person'] },
  { t: 'Walk-in → consultant → billing', role: 'allocation', go: '#/home', steps: ['Allocation staff: tap “+ New walk-in”, type the mobile (returning clients fill in by themselves), note what they want, hand over to a consultant', 'Switch to Consultant: open the client, attach a family, shortlist pieces and mark each Liked · Already has · Buying · Said no, then send to billing', "Switch to Billing: only the Buying pieces are charged — everything else lands on the client profile (In store tab) and on their Sales staff's follow-up list"] },
  { t: 'One sale → many updates', role: 'owner', go: '#/settings/connections', steps: ['Tap “Simulate a POS sale”', 'One real-time event updates stock, client value and tier, warranty, invoice → Tally, targets and the manager'] },
];
function demoBar() {
  document.getElementById('demobar').innerHTML = `<div class="db"><span class="pill">Demo · sample data, not Vaarahi's real data · built by ZippyScale</span><button class="pill" data-act="theme">Light / dark</button>
    <label>Viewing as <select id="role">${Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${k === role ? 'selected' : ''}>${esc(E[r.user].name)} — ${esc(r.label)}</option>`).join('')}</select></label>
    <span class="stories">${STORIES.map((s, i) => `<button class="${storyOn === i ? 'on' : ''}" data-story="${i}">${i + 1}. ${esc(s.t)}</button>`).join('')}</span></div>
    ${storyOn !== null ? `<div class="hint"><b>Story ${storyOn + 1}</b><ol>${STORIES[storyOn].steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol><button class="btn sm ghost" style="color:#ccc;border-color:#444" data-story="x">Close</button></div>` : ''}`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-story]'); if (!b) return;
  if (b.dataset.story === 'x') { storyOn = null; return render(); }
  storyOn = Number(b.dataset.story); const s = STORIES[storyOn]; role = s.role; replyOpen = null; tabState = s.go.includes('customer') ? 'timeline' : 'owns';
  if (location.hash === s.go) render(); else location.hash = s.go;
});
function navFor() {
  const k = kind();
  const items = { advisor: [['home', 'Home'], ['inbox', 'Chats'], ['appointments', 'Diary'], ['customers', 'Clients'], ['pipeline', 'Pipeline'], ['targets', 'Targets']],
    manager: [['home', 'Home'], ['inbox', 'WhatsApp'], ['appointments', 'Appointments'], ['customers', 'Clients'], ['pipeline', 'Pipeline'], ['targets', 'Targets'], ['inventory', 'Inventory'], ['grievances', 'Complaints']],
    owner: [['home', 'Home'], ['inbox', 'WhatsApp'], ['appointments', 'Appointments'], ['grievances', 'Complaints'], ['targets', 'Targets'], ['inventory', 'Inventory'], ['pipeline', 'Pipeline'], ['customers', 'Clients']],
    allocation: [['home', 'Walk-ins'], ['customers', 'Clients']],
    consultant: [['home', 'My clients'], ['inventory', 'Catalogue'], ['customers', 'Clients']],
    billing: [['home', 'Billing desk'], ['paid', 'Paid today'], ['customers', 'Clients']] }[k].slice();
  if (acc().team) items.push(['team', 'Team']);
  return items;
}
const VIEWS = { home: () => ({ advisor: advisorHome, manager: managerHome, owner: ownerHome, allocation: floorHome, consultant: consultantHome, billing: billingHome })[kind()](), visit: id => visitView(id), paid: paidView, inbox, appointments, customers, customer, pipeline, targets, inventory, product, grievances, team, settings };
function badgeCount(r) {
  return r === 'inbox' ? D.whatsapp.filter(m => m.card && m.card.status === 'pending' && inScope(C[m.customer_id])).length
    : r === 'grievances' ? D.grievances.filter(g => isOpen(g) && inScope(C[g.customer_id])).length : 0;
}
function badge(r) { const n = badgeCount(r); return n ? `<span class="n">${n}</span>` : ''; }

// One navigation frame for every role. Apple HIG: "about five or fewer" tabs; Material 3: 3-5.
// Advisors, managers and the director share these four plus More — only the contents differ,
// because teaching two mental models in one app costs more than it saves.
const PH_PRIMARY = [['home', 'Home'], ['inbox', 'WhatsApp'], ['customers', 'Clients'], ['appointments', 'Diary']];
// the floor teams have three screens or fewer, so their tabs are simply their own nav
const phPrimary = () => FLOOR.includes(kind()) ? navFor() : PH_PRIMARY;
function moreItems() {
  const primary = phPrimary().map(([h]) => h);
  const items = navFor().filter(([h]) => !primary.includes(h));
  if (isDirector()) items.push(['settings', 'Settings']);
  return items;
}
// Overflow lives in a bottom sheet, not a hamburger: hidden nav costs >20% discoverability (NN/g),
// so anything urgent in here still surfaces as a count on the More tab.
function moreSheet() {
  const r = location.hash.replace(/^#\/?/, '').split('/')[0];
  document.getElementById('overlay').innerHTML = `<div class="ov" data-act="more-close"><div class="sheet sheet-nav">
    <div class="sheet-grab"></div>
    <div class="who-row"><b>${esc(me().name)}</b><span>${esc(ROLES[role].label)}</span></div>
    <nav>${moreItems().map(([h, l]) => `<a href="#/${h}" class="${r === h ? 'on' : ''}">${esc(l)}${badge(h)}</a>`).join('')}</nav>
  </div></div>`;
}
let lastRoute = '';
function render() {
  const [r = 'home', arg] = location.hash.replace(/^#\/?/, '').split('/');
  if (r !== 'customer' && lastRoute.startsWith('customer')) tabState = 'owns';
  if (r !== 'grievances') replyOpen = null;
  if (r !== 'visit') visitQ = '';
  const ov = document.getElementById('overlay');
  if (ov.querySelector('.sheet-nav')) ov.innerHTML = '';  // picking a destination closes the sheet
  const view = (VIEWS[r] || VIEWS.home)(arg && decodeURIComponent(arg));
  const link = ([h, l]) => `<a href="#/${h}" class="${r === h || (r === 'customer' && h === 'customers') || (r === 'visit' && h === 'home') ? 'on' : ''}">${l}${badge(h)}</a>`;
  const shell = document.getElementById('shell');
  const phone = isPhone() || ['advisor', 'allocation', 'consultant'].includes(kind());  // real phone, or an on-screen handset for staff on their feet
  shell.className = 'shell' + (phone ? ' phone-mode' : '');
  const moreN = moreItems().reduce((n, [h]) => n + badgeCount(h), 0);
  const moreOn = !phPrimary().some(([h]) => h === r || (r === 'customer' && h === 'customers') || (r === 'visit' && h === 'home'));
  const fab = kind() === 'allocation' ? '<button class="fab" data-act="new-walkin" aria-label="New walk-in">+</button>' : FLOOR.includes(kind()) ? '' : '<button class="fab" data-act="add-client" aria-label="Add a client">+</button>';
  shell.innerHTML = phone
    ? `<div class="phone"><div class="ph-head"><img src="${LOGO}" alt="${esc(D.tenant.name)}"><span class="ph-who">${esc(ROLES[role].label)}</span></div>
       <div class="ph-body">${view}</div>
       ${fab}
       <nav class="ph-tabs">${phPrimary().map(link).join('')}${moreItems().length ? `<button class="${moreOn ? 'on' : ''}" data-act="more">More${moreN ? `<span class="n">${moreN}</span>` : ''}</button>` : ''}</nav></div>`
    : `<aside class="side"><img class="logo" src="${LOGO}" alt="${esc(D.tenant.name)}"><div class="who"><b>${esc(me().name)}</b><span>${esc(ROLES[role].label)}</span></div><nav>${navFor().map(link).join('')}</nav>
       ${isDirector() ? `<nav class="navb">${link(['settings', 'Settings'])}</nav>` : ''}</aside><main class="main">${view}</main>`;
  if (location.hash.replace(/^#\/?/, '') !== lastRoute) { window.scrollTo(0, 0); lastRoute = location.hash.replace(/^#\/?/, ''); }
  demoBar();
}
window.addEventListener('hashchange', render);
matchMedia('(max-width: 760px)').addEventListener('change', render);  // rotate / resize across the breakpoint
window.GE = { moveEmployee, D, SETTINGS };  // used by demo/check_demo.js
render();
