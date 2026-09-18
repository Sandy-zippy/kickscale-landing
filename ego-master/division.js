'use strict';
/* Divisions, users & access.
   Wholesale = EGO Premium (dealers & distributors) · Retail = Big E (consumers, architects, projects, installation).
   Owner + Director see both; each team sees only its division and its own scope. Pattern ported from the Vaarahi demo
   (team(), memberForm/saveMember, removeForm/removeMember, SETTINGS.access, inScope) and extended with a division. */

const DIVS = { wholesale: { name: 'Wholesale', co: 'EGO Premium' }, retail: { name: 'Retail', co: 'Big E' } };
const ROLE = byId(D.role);
const USERS = D.employee;
const UID = id => EMP[id];

// ---------------------------------------------------------------- who is looking (demo: ?as=owner | ws_field | rt_site | … or a user id)
const asParam = params.get('as') || 'owner';
EM.meId = (D.story.users[asParam] || (EMP[asParam] && asParam)) || D.story.users.owner;
const me = () => EMP[EM.meId];
const acc = () => ROLE[me().role];
const canDiv = div => acc().division === 'both' || acc().division === div;
EM.div ||= acc().division === 'both' ? 'both' : acc().division;
const canCost = () => acc().cost;
const canPrice = () => acc().prices;
const masked = (html, ok = canCost()) => ok ? html : '<span class="muted small">hidden for your role</span>';

// which tabs each role works in (null = every tab of its division)
const ROLE_TABS = {
  ws_field: ['home', 'dealers', 'orders', 'champions', 'app'], ws_tele: ['home', 'dealers', 'orders', 'champions'], ws_warehouse: ['home', 'orders', 'stock', 'production', 'app'],
  rt_tele: ['home', 'leads', 'clients', 'app'], rt_arch: ['home', 'firms', 'clients', 'projects'], rt_site: ['home', 'installation', 'app'],
  rt_marketing: ['home', 'leads', 'clients', 'firms', 'ai'], admin: ['home', 'team', 'integrations'],
};
const W_TABS = [['home', 'Home'], ['dealers', 'Dealers'], ['orders', 'Orders'], ['stock', 'Stock'], ['production', 'Production'], ['champions', 'Dealer development'], ['complaints', 'Complaints']];
const R_TABS = [['home', 'Home'], ['clients', 'Clients'], ['firms', 'Architect firms'], ['leads', 'Leads'], ['projects', 'Projects'], ['installation', 'Installation'], ['complaints', 'Complaints']];
const S_TABS = [['map', 'System map'], ['automations', 'Automations'], ['ai', 'AI Analysis'], ['integrations', 'Integrations'], ['app', 'Phone app'], ['team', 'Team & access'], ['tech', 'Tech & ops']];
const allowedTab = t => {
  const r = ROLE_TABS[me().role];
  if (['map', 'tech'].includes(t)) return true;
  if (t === 'team') return acc().users;
  if (t === 'integrations') return ['owner', 'director', 'admin'].includes(me().role);
  // automations reach customers, so leadership and the CRM admin build them — not field staff
  if (t === 'automations') return !r || me().role === 'admin';
  if (t === 'ai') return acc().cost || me().role === 'rt_marketing';
  return !r || r.includes(t);
};
EM.navTabs = () => {
  const div = EM.div === 'both' ? [['home', 'Home']] : EM.div === 'wholesale' ? W_TABS : R_TABS;
  return { main: div.filter(([k]) => allowedTab(k)), shared: S_TABS.filter(([k]) => allowedTab(k)) };
};

// ---------------------------------------------------------------- data scope
const scopeOk = (div, ownFn, regionFn) => {
  if (!canDiv(div)) return false;
  const s = acc().scope;
  if (s === 'all' || s === 'division') return true;
  if (s === 'region') return regionFn ? regionFn() : true;
  if (s === 'own') return ownFn ? ownFn() : false;
  return false;
};
const seeDealer = d => scopeOk('wholesale', () => d.field_owner === EM.meId || d.telesales_owner === EM.meId, () => MK[d.market].region === me().region);
const seeOrder = o => seeDealer(DL[o.dealer]);
const seeLead = l => scopeOk('retail', () => l.owner === EM.meId);
const seeFirm = f => scopeOk('retail', () => f.owner === EM.meId);
const seeClient = c => scopeOk('retail', () => (c.firm && FIRM[c.firm].owner === EM.meId) || (c.lead && LEAD[c.lead] && LEAD[c.lead].owner === EM.meId));
const seeSite = s => scopeOk('retail', () => s.supervisor === EM.meId);
const seeProject = p => scopeOk('retail', () => ARCH[p.org.architect].owner === EM.meId || p.sites.some(id => { const s = D.site.find(x => x.id === id); return s && s.supervisor === EM.meId; }));
const scopeLabel = () => ({ all: 'both divisions', division: `all of ${DIVS[acc().division] ? DIVS[acc().division].name : 'the business'}`, region: `${me().region} region`, own: 'only your own records', none: 'no business data' })[acc().scope];

// ---------------------------------------------------------------- top bar pieces
const VIEW_AS = [['owner', 'Owner'], ['director', 'Director'], ['ws_head', 'Wholesale Head'], ['ws_rm', 'Regional Manager'], ['ws_field', 'Field Sales'], ['ws_warehouse', 'Warehouse'],
  ['rt_head', 'Retail Head'], ['rt_tele', 'Consumer Telecaller'], ['rt_arch', 'Architect Relations'], ['rt_site', 'Site Supervisor'], ['admin', 'CRM Admin']];
EM.topExtras = () => {
  const divs = acc().division === 'both' ? [['both', 'Both'], ['wholesale', 'Wholesale · EGO'], ['retail', 'Retail · Big E']] : [[acc().division, `${DIVS[acc().division].name} · ${DIVS[acc().division].co}`]];
  return `<div class="seg divsw" role="tablist" aria-label="Division">${divs.map(([k, l]) => `<button role="tab" aria-selected="${EM.div === k}" class="${EM.div === k ? 'on' : ''}" data-act="div" data-d="${k}">${l}</button>`).join('')}</div>
    <label class="viewas"><span class="small muted">View as</span><select class="input" id="viewas" aria-label="View as user">${VIEW_AS.map(([k, l]) => `<option value="${k}" ${D.story.users[k] === EM.meId ? 'selected' : ''}>${esc(EMP[D.story.users[k]].name)} · ${l}</option>`).join('')}</select></label>`;
};
EM.ACTIONS.div = el => { EM.div = el.dataset.d; location.hash = '#/home'; EM.render(); };
document.addEventListener('change', e => {
  if (e.target.id !== 'viewas') return;
  const q = new URLSearchParams(location.search); q.set('as', e.target.value);
  location.href = location.pathname + '?' + q.toString() + '#/home';
});
EM.noAccess = why => `<div class="stack" style="max-width:640px"><h1>Not in your access</h1><p class="muted">${esc(me().name)} is <b>${esc(acc().name)}</b> (${esc(scopeLabel())}). ${why || ''}</p>
  <div class="callout">Access is set in <b>Team &amp; access</b> by the Owner, Director or CRM admin — per role, per division.</div><a class="btn" href="#/home">← Home</a></div>`;

// ---------------------------------------------------------------- homes
const stat = (k, v, sub = '', href = '') => `<${href ? `a href="${href}"` : 'div'} class="card stat ${href ? 'tile' : ''}" style="text-decoration:none"><div class="kicker">${k}</div><div class="num">${v}</div>${sub ? `<span class="small muted">${sub}</span>` : ''}</${href ? 'a' : 'div'}>`;
function wholesaleNumbers() {
  const ds = D.dealer.filter(seeDealer), os = D.order.filter(seeOrder), open = os.filter(o => !['Invoiced', 'Collected'].includes(o.stage));
  return {
    ds, os, open, sales: ds.reduce((a, d) => a + d.fy_sales, 0), target: ds.reduce((a, d) => a + d.target_12m, 0), out: ds.reduce((a, d) => a + d.outstanding, 0), over: ds.reduce((a, d) => a + d.overdue, 0),
    toAllocate: open.filter(o => o.stage === 'Stock checked' || (o.path === 'moq' && o.stage === 'Received at warehouse')), transit: D.production_order.filter(p => ['Shipped', 'In transit'].includes(p.stage)),
    risk: ds.filter(d => d.at_risk), reqs: D.requirement.filter(r => r.status === 'New' && seeDealer(DL[r.dealer])),
  };
}
function retailNumbers() {
  const leads = D.lead.filter(seeLead), clients = D.client.filter(seeClient), firms = D.design_firm.filter(seeFirm), projects = D.project.filter(seeProject), sites = D.site.filter(seeSite);
  return {
    leads, clients, firms, projects, sites, newLeads: leads.filter(l => l.stage === 'New'), pipeline: projects.filter(p => p.stage_idx < 7 && p.stage !== 'Lost').reduce((a, p) => a + p.value, 0),
    live: sites.filter(s => s.step >= 11 && s.step <= 13), delayed: sites.filter(s => s.delays.length && s.step < 14), complaints: D.complaint.filter(c => c.division === 'retail' && c.status !== 'Resolved'),
  };
}
const wholesaleHome = (compact = false) => {
  const n = wholesaleNumbers(), stockVal = D.wstock.reduce((a, w) => a + w.on_hand * SKU[w.sku].dealer_price, 0);
  return `<section class="stack-s">${compact ? `<div class="row between"><h2>Wholesale · EGO Premium</h2><button class="btn" data-act="div" data-d="wholesale">Open Wholesale →</button></div>` : ''}
    <div class="grid g4">${stat('Dealer sales this FY', inr(n.sales), `${Math.round(n.sales / Math.max(1, n.target) * 100)}% of target`, '#/dealers')}
      ${stat('Open orders', n.open.length, `${n.open.filter(o => o.path === 'stock').length} from stock · ${n.open.filter(o => o.path === 'moq').length} MOQ / production`, '#/orders')}
      ${stat('To allocate', n.toAllocate.length, 'stock checked or container received', '#/orders')}
      ${stat('Outstanding', masked(inr(n.out), canPrice()), n.over ? `${inr(n.over)} overdue` : '', '#/dealers')}</div>
    ${compact ? '' : `<div class="grid g4">${stat('Stock value', masked(inr(stockVal), canPrice()), `${D.warehouse.length} warehouses`, '#/stock')}${stat('Containers in transit', n.transit.length, n.transit.length ? `next ETA ${ds(n.transit.map(p => p.eta).sort()[0])}` : '', '#/production')}
      ${stat('Vendors at risk', n.risk.length, 'no order for 2× their usual gap', '#/dealers')}${stat('New requirements', n.reqs.length, 'from vendor salespeople', '#/dealers')}</div>`}
  </section>`;
};
const retailHome = (compact = false) => {
  const n = retailNumbers();
  return `<section class="stack-s">${compact ? `<div class="row between"><h2>Retail · Big E</h2><button class="btn" data-act="div" data-d="retail">Open Retail →</button></div>` : ''}
    <div class="grid g4">${stat('New leads', n.newLeads.length, `${n.leads.length} leads in 75 days`, '#/leads')}${stat('Retail clients', n.clients.length, `${n.clients.filter(c => c.status === 'Active project').length} with active projects`, '#/clients')}
      ${stat('Architect firms', n.firms.length, `${n.firms.reduce((a, f) => a + f.architects, 0)} architects`, '#/firms')}${stat('Project pipeline', inr(n.pipeline), `${n.projects.filter(p => p.stage_idx < 7).length} open projects`, '#/projects')}</div>
    ${compact ? '' : `<div class="grid g4">${stat('Sites in progress', n.live.length, '', '#/installation/progress')}${stat('Sites delayed', n.delayed.length, '', '#/installation/delayed')}
      ${stat('Open complaints', n.complaints.length, '', '#/complaints')}${stat('Won this quarter', n.leads.filter(l => l.stage === 'Won').length, 'consumer leads', '#/leads')}</div>`}
  </section>`;
};
EM.VIEWS.home = () => {
  const who = `<div class="stack-s"><div class="kicker">${esc(acc().name)} · sees ${esc(scopeLabel())}</div><h1>Good morning, ${esc(me().name.split(' ')[0])}</h1></div>`;
  if (me().role === 'admin') return `<div class="stack">${who}<p class="muted">As CRM admin you manage users, roles and connections — not business data.</p><div class="row"><a class="btn primary" href="#/team">Team &amp; access →</a><a class="btn" href="#/integrations">Integrations →</a></div></div>`;
  if (EM.div === 'both') return `<div class="stack">${who}
    <p class="muted" style="max-width:720px">Two businesses, one system. Wholesale and Retail have separate teams, screens and data — you see both. Switch division at the top to work inside one.</p>
    ${wholesaleHome(true)}${retailHome(true)}
    <section class="card stack-s"><h3>Combined</h3>${kv([['Revenue in view', `${inr(wholesaleNumbers().sales)} wholesale · ${inr(D.client.filter(c => c.status !== 'Lost').reduce((a, c) => a + c.value, 0))} retail client value`],
      ['People', `${USERS.filter(u => u.status === 'active' && u.division === 'wholesale').length} wholesale · ${USERS.filter(u => u.status === 'active' && u.division === 'retail').length} retail · ${USERS.filter(u => u.status === 'active' && u.division === 'both').length} leadership & admin`]])}</section></div>`;
  return `<div class="stack">${who}${EM.div === 'wholesale' ? wholesaleHome() : retailHome()}</div>`;
};
EM.VIEWS.home.title = () => 'Home';

// ---------------------------------------------------------------- Team & access
const DIV_LABEL = { both: 'Leadership & admin (both)', wholesale: 'Wholesale · EGO Premium', retail: 'Retail · Big E' };
const activeUsers = () => USERS.filter(u => u.status === 'active');
const isUnder = (a, b) => { let x = EMP[a], k = 0; while (x && x.reports_to && k++ < 15) { if (x.reports_to === b) return true; x = EMP[x.reports_to]; } return false; };
const recordsOf = id => ({
  vendors: D.dealer.filter(d => d.field_owner === id || d.telesales_owner === id).length, leads: D.lead.filter(l => l.owner === id && !['Won', 'Lost'].includes(l.stage)).length,
  firms: D.design_firm.filter(f => f.owner === id).length, sites: D.site.filter(s => s.supervisor === id && s.step < 17).length, reports: activeUsers().filter(u => u.reports_to === id).length,
});
EM.VIEWS.team = arg => {
  if (!acc().users) return EM.noAccess('Managing users needs the “manage users” permission.');
  const tab = arg || 'people';
  return `<div class="stack"><div class="row between"><div class="stack-s"><h1>Team &amp; access</h1><p class="muted">${activeUsers().length} active users · two teams · drag a person onto a manager to change who they report to</p></div>
    ${tab === 'people' ? '<button class="btn primary" data-act="user-add">+ Add user</button>' : '<button class="btn primary" data-act="role-add">+ New role</button>'}</div>
    ${subtabs('#/team', tab, [['people', 'People'], ['roles', 'Roles & access']])}
    ${tab === 'roles' ? rolesMatrix() : teamTree()}</div>`;
};
EM.VIEWS.team.tab = 'team';
function teamTree() {
  const people = activeUsers(), kids = people.reduce((m, u) => ((m[u.reports_to] ||= []).push(u), m), {});
  const node = div => u => { const k = (kids[u.id] || []).filter(x => x.division === div); return `<li><div class="node" data-emp="${u.id}" data-drop="${u.id}" draggable="true">
      <div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><div><b>${esc(u.name)}</b><div class="small muted">${esc(u.title)}${u.region && !u.title.includes(u.region) ? ' · ' + u.region : ''}${u.division !== div ? ' · leads this team' : ''}</div></div>
      <span class="badge ${u.division === 'both' ? 'info' : u.division === 'wholesale' ? 'ok' : 'warn'} plain">${ROLE[u.role].name}</span></div>
      <div class="row" style="gap:4px;margin-top:6px"><button class="btn sm ghost" data-act="user-edit" data-u="${u.id}" aria-label="Edit ${esc(u.name)}">Edit</button>${u.role !== 'owner' ? `<button class="btn sm ghost" data-act="user-remove" data-u="${u.id}" aria-label="Remove ${esc(u.name)}">Remove</button>` : ''}</div></div>
    ${k.length ? `<ul>${k.map(node(div)).join('')}</ul>` : ''}</li>`; };
  const cols = ['both', 'wholesale', 'retail'].map(div => {
    const roots = people.filter(u => u.division === div && (!u.reports_to || EMP[u.reports_to].division !== div));
    return `<section class="card stack-s"><h3>${DIV_LABEL[div]}</h3><p class="small muted">${people.filter(u => u.division === div).length} people</p><ul class="tree">${roots.map(node(div)).join('')}</ul></section>`;
  });
  return `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));align-items:start">${cols.join('')}</div>`;
}
function rolesMatrix() {
  const rows = D.role.map(r => `<tr><td><b>${esc(r.name)}</b><div class="small muted">${USERS.filter(u => u.role === r.id && u.status === 'active').length} users</div></td>
    <td>${r.division === 'both' ? 'Both' : DIVS[r.division].name}</td>
    <td><select class="input" data-acc="${r.id}|scope" ${['owner'].includes(r.id) ? 'disabled' : ''} aria-label="Data scope for ${esc(r.name)}">${['all', 'division', 'region', 'own', 'none'].map(s => `<option value="${s}" ${r.scope === s ? 'selected' : ''}>${{ all: 'Both divisions', division: 'Whole division', region: 'Own region', own: 'Own records', none: 'No business data' }[s]}</option>`).join('')}</select></td>
    ${['prices', 'cost', 'approve', 'export', 'users'].map(k => `<td class="r"><input type="checkbox" data-acc="${r.id}|${k}" ${r[k] ? 'checked' : ''} ${r.id === 'owner' ? 'disabled' : ''} aria-label="${k} for ${esc(r.name)}"></td>`).join('')}</tr>`).join('');
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Role</th><th>Division</th><th>Sees</th><th class="r">Prices</th><th class="r">Cost &amp; GP</th><th class="r">Approve</th><th class="r">Export</th><th class="r">Manage users</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted">Rules hold everywhere — screens, exports, the API and the AI. A wholesale role never sees retail clients; a retail role never sees dealer pricing.</p>`;
}
document.addEventListener('change', e => {
  const t = e.target.closest('[data-acc]');
  if (!t) return;
  const [rid, k] = t.dataset.acc.split('|');
  ROLE[rid][k] = t.type === 'checkbox' ? t.checked : t.value;
  EM.toast(`${esc(ROLE[rid].name)}: ${k === 'scope' ? 'sees ' + t.options[t.selectedIndex].text.toLowerCase() : `${k} ${t.checked ? 'allowed' : 'removed'}`} — applies at next sign-in.`);
});
EM.ACTIONS['role-add'] = () => EM.modal(`<h2>New role</h2><div class="stack" style="margin-top:12px">
  <div class="field"><label for="nr-name">Role name</label><input class="input" id="nr-name" placeholder="e.g. Key Account Manager"></div>
  <div class="field"><label for="nr-from">Start from</label><select class="input" id="nr-from">${D.role.filter(r => r.id !== 'owner').map(r => `<option value="${r.id}">${esc(r.name)} · ${r.division === 'both' ? 'Both' : DIVS[r.division].name}</option>`).join('')}</select></div>
  <div id="nr-err" class="small" style="color:var(--bad)"></div><div class="row"><button class="btn primary" data-act="role-save">Create role</button><button class="btn" data-act="close-modal">Cancel</button></div></div>`);
EM.ACTIONS['role-save'] = () => {
  const name = qs('#nr-name').value.trim(), from = ROLE[qs('#nr-from').value];
  if (!name) { qs('#nr-err').textContent = 'Give the role a name.'; return; }
  const r = { ...from, id: 'role_c' + (EM.tick++), name };
  D.role.push(r); ROLE[r.id] = r;
  EM.closeModal(); EM.toast(`Role “${esc(name)}” created with the same access as ${esc(from.name)}.`); location.hash = '#/team/roles'; EM.rerender();
};

// add / edit user
const userForm = u => {
  const divOpts = [['wholesale', 'Wholesale · EGO Premium'], ['retail', 'Retail · Big E'], ...(me().role === 'owner' || me().role === 'director' ? [['both', 'Both divisions (leadership)']] : [])];
  const div = u ? u.division : 'wholesale';
  return `<h2>${u ? 'Edit user' : 'Add user'}</h2><form id="uf" class="stack" style="margin-top:12px" onsubmit="return false">
    <div class="grid g2"><div class="field"><label for="uf-name">Full name *</label><input class="input" id="uf-name" name="name" value="${u ? esc(u.name) : ''}"></div>
    <div class="field"><label for="uf-phone">Mobile *</label><input class="input" id="uf-phone" name="phone" inputmode="numeric" value="${u ? esc(u.phone) : ''}" placeholder="10-digit mobile"></div></div>
    <div class="field"><label for="uf-email">Email</label><input class="input" id="uf-email" name="email" value="${u ? esc(u.email) : ''}"></div>
    <div class="grid g2"><div class="field"><label for="uf-div">Division *</label><select class="input" id="uf-div" name="division">${divOpts.map(([k, l]) => `<option value="${k}" ${div === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="uf-role">Role *</label><select class="input" id="uf-role" name="role">${roleOptions(div, u && u.role)}</select></div></div>
    <div class="grid g2"><div class="field"><label for="uf-mgr">Reports to *</label><select class="input" id="uf-mgr" name="reports_to">${mgrOptions(div, u)}</select></div>
    <div class="field"><label for="uf-region">Region</label><select class="input" id="uf-region" name="region"><option value="">—</option>${['West', 'South', 'North'].map(r => `<option ${u && u.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div></div>
    <p class="small muted">They sign in with an OTP on this mobile. What they see follows the role's access.</p>
    <div id="uf-err" class="small" style="color:var(--bad)"></div>
    <div class="row"><button class="btn primary" data-act="user-save" data-u="${u ? u.id : ''}">${u ? 'Save' : 'Add user'}</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`;
};
const roleOptions = (div, cur) => D.role.filter(r => r.division === div || (div === 'both' && r.division === 'both')).filter(r => r.id !== 'owner').map(r => `<option value="${r.id}" ${cur === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
const mgrOptions = (div, u) => activeUsers().filter(x => (x.division === div || x.division === 'both') && !['ws_field', 'ws_tele', 'rt_tele', 'rt_site', 'admin'].includes(x.role) && (!u || (x.id !== u.id && !isUnder(x.id, u.id))))
  .map(x => `<option value="${x.id}" ${u && u.reports_to === x.id ? 'selected' : ''}>${esc(x.name)} · ${esc(ROLE[x.role].name)}</option>`).join('');
EM.ACTIONS['user-add'] = () => EM.modal(userForm(null));
EM.ACTIONS['user-edit'] = el => EM.modal(userForm(EMP[el.dataset.u]));
document.addEventListener('change', e => {
  if (e.target.id !== 'uf-div') return;
  qs('#uf-role').innerHTML = roleOptions(e.target.value); qs('#uf-mgr').innerHTML = mgrOptions(e.target.value, null);
});
EM.ACTIONS['user-save'] = el => {
  const f = new FormData(qs('#uf')), id = el.dataset.u, d10 = String(f.get('phone')).replace(/\D/g, '').slice(-10), name = String(f.get('name')).trim();
  const err = t => { qs('#uf-err').textContent = t; };
  if (!name || d10.length !== 10) return err('Enter a name and a 10-digit mobile number.');
  const clash = activeUsers().find(x => x.id !== id && x.phone.replace(/\D/g, '').slice(-10) === d10);
  if (clash) return err(`${clash.name} already uses this mobile number.`);
  if (!f.get('reports_to')) return err('Choose who they report to.');
  const data = { name, phone: '+91 ' + d10.slice(0, 5) + ' ' + d10.slice(5), email: String(f.get('email')).trim(), division: f.get('division'), role: f.get('role'), reports_to: f.get('reports_to'), region: f.get('region') || null, title: ROLE[f.get('role')].name };
  let u;
  if (id) u = Object.assign(EMP[id], data);
  else { u = { id: 'emp_new' + (EM.tick++), status: 'active', company: data.division === 'retail' ? 'co_bige' : 'co_ego', demo: true, ...data }; USERS.push(u); EMP[u.id] = u; }
  EM.closeModal();
  EM.toast(`<b>${esc(u.name)} ${id ? 'updated' : 'added'}</b><ul><li>${esc(ROLE[u.role].name)} · ${u.division === 'both' ? 'both divisions' : DIVS[u.division].name} · reports to ${esc(EMP[u.reports_to].name)}</li><li>OTP sign-in link sent on WhatsApp</li></ul>`);
  location.hash = '#/team/people'; EM.rerender();
};

// move under another manager (drag and drop)
document.addEventListener('dragstart', e => { const n = e.target.closest && e.target.closest('[data-emp]'); if (n) e.dataTransfer.setData('text/plain', n.dataset.emp); });
document.addEventListener('dragover', e => { if (e.target.closest && e.target.closest('[data-drop]')) e.preventDefault(); });
document.addEventListener('drop', e => {
  const t = e.target.closest && e.target.closest('[data-drop]');
  if (!t) return;
  e.preventDefault();
  EM.moveUser(e.dataTransfer.getData('text/plain'), t.dataset.drop);
});
EM.moveUser = (id, mgr) => {
  const u = EMP[id], m = EMP[mgr];
  if (!u || !m || id === mgr) return;
  if (isUnder(mgr, id)) { EM.toast(`${esc(m.name)} reports to ${esc(u.name)} — can't move a manager under their own team.`); return; }
  if (m.division !== 'both' && u.division !== m.division) { EM.toast(`${esc(u.name)} is in ${DIVS[u.division] ? DIVS[u.division].name : 'leadership'}; ${esc(m.name)} is in ${DIVS[m.division].name}. Change their division first.`); return; }
  u.reports_to = mgr; EM.toast(`${esc(u.name)} now reports to ${esc(m.name)}.`); EM.rerender();
};

// remove → hand over their work
EM.ACTIONS['user-remove'] = el => {
  const u = EMP[el.dataset.u], r = recordsOf(u.id);
  const peers = activeUsers().filter(x => x.id !== u.id && x.role === u.role);
  const others = activeUsers().filter(x => x.id !== u.id && x.role !== u.role && (x.division === u.division || x.division === 'both') && x.role !== 'admin');
  const has = Object.entries(r).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(' · ') || 'nothing assigned';
  EM.modal(`<h2>Remove ${esc(u.name)}</h2><p class="muted">${esc(ROLE[u.role].name)} · currently owns: <b>${has}</b>. Their history stays; their open work moves to someone else.</p>
    <div class="stack" style="margin-top:12px"><div class="field"><label for="rm-to">Hand over to</label><select class="input" id="rm-to">
      ${peers.length > 1 ? `<option value="__split">Split evenly across ${peers.length} ${esc(ROLE[u.role].name)}s</option>` : ''}
      ${peers.map(x => `<option value="${x.id}">${esc(x.name)} · ${esc(ROLE[x.role].name)}</option>`).join('')}${others.map(x => `<option value="${x.id}">${esc(x.name)} · ${esc(ROLE[x.role].name)}</option>`).join('')}</select></div>
    <div class="row"><button class="btn primary" data-act="user-remove-save" data-u="${u.id}">Remove &amp; hand over</button><button class="btn" data-act="close-modal">Cancel</button></div></div>`);
};
EM.ACTIONS['user-remove-save'] = el => {
  const u = EMP[el.dataset.u], to = qs('#rm-to').value, peers = activeUsers().filter(x => x.id !== u.id && x.role === u.role);
  let k = 0; const pick = () => to === '__split' ? peers[k++ % peers.length].id : to;
  let moved = 0;
  D.dealer.forEach(d => { if (d.field_owner === u.id) { d.field_owner = pick(); moved++; } if (d.telesales_owner === u.id) { d.telesales_owner = pick(); moved++; } });
  D.lead.forEach(l => { if (l.owner === u.id) { l.owner = pick(); moved++; } });
  D.design_firm.forEach(f => { if (f.owner === u.id) { f.owner = pick(); moved++; D.architect.filter(a => a.firm === f.id).forEach(a => { a.owner = f.owner; }); } });
  D.site.forEach(s => { if (s.supervisor === u.id) { s.supervisor = pick(); moved++; } });
  activeUsers().forEach(x => { if (x.reports_to === u.id) x.reports_to = u.reports_to; });
  u.status = 'left';
  EM.closeModal(); EM.toast(`<b>${esc(u.name)} removed</b><ul><li>${moved} records handed over${to === '__split' ? ' (split evenly)' : ` to ${esc(EMP[to].name)}`}</li><li>Their reports now go to ${esc(EMP[u.reports_to] ? EMP[u.reports_to].name : '—')}</li><li>Sign-in disabled; history kept</li></ul>`); EM.rerender();
};
