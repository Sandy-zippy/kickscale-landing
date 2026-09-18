'use strict';
/* Retail · Big E — all retail clients in one place, and the architect-firm module (one firm → many architects → their clients).
   Loaded last: also labels every screen with its division and tab. */

const CLIENT = byId(D.client);
const rnav = cur => subnav([['clients', 'All clients', '#/clients'], ['firms', 'Architect firms', '#/firms']], cur);
const clientStatus = s => `<span class="badge ${s === 'Active project' ? 'ok' : s === 'Prospect' ? 'info' : s === 'Lost' ? 'bad' : 'plain'}">${s}</span>`;
const archLink = id => id ? `<a href="#/architect/${id}">${esc(ARCH[id].name)}</a> · <a class="muted" href="#/firm/${ARCH[id].firm}">${esc(FIRM[ARCH[id].firm].name.replace(' (sample)', ''))}</a>` : '<span class="muted">Direct</span>';

// ---------------------------------------------------------------- all retail clients
EM.cf ||= { q: '', type: '', city: '', firm: '', source: '' };
EM.VIEWS.clients = () => {
  const f = EM.cf, qn = f.q.toLowerCase(), mine = D.client.filter(seeClient);
  const rows = mine.filter(c => (!qn || (c.name + ' ' + c.phone).toLowerCase().includes(qn)) && (!f.type || c.type === f.type) && (!f.city || MK[c.market].city === f.city) && (!f.firm || c.firm === f.firm) && (!f.source || c.source === f.source))
    .sort((a, b) => b.value - a.value);
  const opt = (key, label, vals, names = v => v) => `<label class="field"><span class="small muted">${label}</span><select class="input" data-cf="${key}"><option value="">All</option>${vals.map(v => `<option value="${esc(v)}" ${f[key] === v ? 'selected' : ''}>${esc(names(v))}</option>`).join('')}</select></label>`;
  const firms = [...new Set(mine.map(c => c.firm).filter(Boolean))].sort((a, b) => FIRM[a].name.localeCompare(FIRM[b].name));
  return `<div class="stack">${rnav('clients')}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">Retail · Big E</div><h1>Retail clients</h1><p class="muted">Every homeowner, builder, hotel and corporate client in one place · ${rows.length} of ${mine.length} · ${esc(scopeLabel())}</p></div>
      <button class="btn primary" data-act="client-add">+ Add client</button></div>
    <div class="grid g4">${['Homeowner', 'Builder', 'Hotel', 'Corporate'].map(t => stat(t + 's', mine.filter(c => c.type === t).length, inr(mine.filter(c => c.type === t).reduce((a, c) => a + c.value, 0)))).join('')}</div>
    <div class="row" style="align-items:flex-end"><label class="field grow" style="min-width:200px"><span class="small muted">Search</span><input class="input" id="cq" value="${esc(f.q)}" placeholder="Name or phone"></label>
      ${opt('type', 'Type', ['Homeowner', 'Builder', 'Hotel', 'Corporate', 'Retail chain', 'Institution'])}${opt('city', 'City', [...new Set(mine.map(c => MK[c.market].city))].sort())}
      ${opt('firm', 'Architect firm', firms, v => FIRM[v].name.replace(' (sample)', ''))}${opt('source', 'Source', [...new Set(mine.map(c => c.source))].sort())}</div>
    ${table(['Client', 'Type', 'City', 'Architect · firm', 'Projects', 'Value', 'Status'], rows.slice(0, 60).map(c => ({ href: `#/client/${c.id}`,
      cells: [`<b>${esc(c.name)}</b> ${c.demo ? demo : ''}`, c.type, esc(MK[c.market].city), archLink(c.architect), c.projects.length || '—', inr(c.value), clientStatus(c.status)] })))}
    ${rows.length > 60 ? `<p class="small muted">Showing 60 of ${rows.length} — refine with search or filters.</p>` : ''}</div>`;
};
document.addEventListener('change', e => { const el = e.target.closest('[data-cf]'); if (el) { EM.cf[el.dataset.cf] = el.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id !== 'cq') return; EM.cf.q = e.target.value; EM.rerender(); const el = qs('#cq'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } });

EM.VIEWS.client = id => {
  const c = CLIENT[id];
  if (!c) return '<p>Client not found.</p>';
  if (!seeClient(c)) return EM.noAccess('This client is outside your data scope.');
  const ps = c.projects.map(p => PROJ[p]), sites = D.site.filter(s => c.projects.includes(s.project)), lead = c.lead && LEAD[c.lead];
  const cmp = D.complaint.filter(x => x.division === 'retail' && sites.some(s => s.id === x.site));
  return `<div class="stack">${rnav('clients')}${crumbs(['Retail clients', '#/clients'], [c.name])}
    <div class="stack-s"><h1>${esc(c.name)}</h1><div class="row"><span class="badge plain">${c.type}</span>${clientStatus(c.status)}${c.demo ? demo : ''}</div><p class="muted">${esc(c.phone)} · ${esc(market(c.market))} · via ${esc(c.source)}</p></div>
    <div class="grid g4">${stat('Value', inr(c.value))}${stat('Projects', ps.length)}${stat('Sites', sites.length, sites.filter(s => s.step >= 15).length + ' signed off')}${stat('Complaints', cmp.length)}</div>
    <div class="grid g2">
      <section class="card stack-s"><h3>Architect</h3>${c.architect ? kv([['Architect', `<a href="#/architect/${c.architect}">${esc(ARCH[c.architect].name)}</a> · ${esc(ARCH[c.architect].position)}`], ['Firm', `<a href="#/firm/${ARCH[c.architect].firm}">${esc(FIRM[ARCH[c.architect].firm].name)}</a>`],
        ['Design 500', ARCH[c.architect].design500 ? 'Yes' : 'No'], ['EGO owner', esc(EMP[FIRM[ARCH[c.architect].firm].owner].name)]]) : '<p class="muted">Came to Big E directly — no architect linked.</p>'}</section>
      <section class="card stack-s"><h3>How they came in</h3>${lead ? kv([['Lead', `<a href="#/lead/${lead.id}">${esc(lead.source)} · ${dFmt(lead.created)}</a>`], ['Requirement', `${esc(lead.category)} · ${esc(lead.application)} · ${lead.area_sqft} sq ft`], ['Telecaller', esc(EMP[lead.owner].name)]]) : kv([['Source', esc(c.source)], ['Client since', dFmt(c.created)]])}</section></div>
    <section class="stack-s"><h3>Projects</h3>${ps.length ? table(['Project', 'Stage', 'Value', 'Sites'], ps.map(p => ({ href: `#/project/${p.id}`, cells: [esc(p.name), esc(p.stage), inr(p.value), p.sites.length || '—'] }))) : '<p class="muted">No project record — single order through a dealer.</p>'}</section>
    ${sites.length ? `<section class="stack-s"><h3>Installation</h3>${table(['Site', 'Step', 'Progress'], sites.map(s => ({ href: `#/site/${s.id}`, cells: [esc(s.name), esc(SITE_STEPS[s.step]), `${pctOf(s)}%`] })))}</section>` : ''}</div>`;
};

// ---------------------------------------------------------------- architect firms (module: firm → architects → clients)
EM.VIEWS.firms = () => {
  const fs = D.design_firm.filter(seeFirm).sort((a, b) => b.architects - a.architects || b.project_value - a.project_value);
  return `<div class="stack">${rnav('firms')}
    <div class="stack-s"><div class="kicker">Retail · Big E</div><h1>Architect firms</h1><p class="muted">${fs.length} firms · ${fs.reduce((a, f) => a + f.architects, 0)} architects · ${esc(scopeLabel())}</p></div>
    ${table(['Firm', 'City', 'Focus', 'Architects', 'Design 500', 'Clients', 'Active projects', 'Project value', 'EGO owner'], fs.map(f => ({ href: `#/firm/${f.id}`,
      cells: [`<b>${esc(f.name.replace(' (sample)', ''))}</b>`, esc(MK[f.market].city), esc(f.focus), f.architects, f.design500, f.clients, f.active_projects, inr(f.project_value), esc(EMP[f.owner].name)] })))}</div>`;
};
EM.VIEWS.architects = () => { location.hash = '#/firms'; return ''; };
EM.VIEWS.firm = arg => {
  const [id, tab = 'architects'] = arg.split('/'), f = FIRM[id];
  if (!f) return '<p>Firm not found.</p>';
  if (!seeFirm(f)) return EM.noAccess('This firm is managed by another Architect Relations owner.');
  const archs = D.architect.filter(a => a.firm === id), ids = new Set(archs.map(a => a.id));
  const clients = D.client.filter(c => ids.has(c.architect)), projects = D.project.filter(p => ids.has(p.org.architect));
  const body = {
    architects: `<section class="card stack-s"><div class="row between"><h3>Architects at ${esc(f.name.replace(' (sample)', ''))}</h3><button class="btn primary" data-act="arch-add" data-f="${id}">+ Add architect</button></div>
      <p class="small muted">Every architect in the firm who works with EGO — each with their own clients and projects, all rolled up to the firm.</p>
      ${archs.map(a => { const cs = clients.filter(c => c.architect === a.id), pr = projects.filter(p => p.org.architect === a.id); return `<div class="member"><span class="avatar">${esc(a.name.replace('Ar. ', '').split(' ').map(w => w[0]).join('').slice(0, 2))}</span>
        <div><a href="#/architect/${a.id}"><b>${esc(a.name)}</b></a> ${demo}<div class="small muted">${esc(a.position)} · ${esc(a.specialisation)} · last contact ${dFmt(a.last_contact)}</div></div>
        <div class="row" style="gap:6px;justify-content:flex-end">${a.design500 ? '<span class="badge ok">Design 500</span>' : ''}<span class="badge plain">${cs.length} client${cs.length === 1 ? '' : 's'}</span><span class="badge plain">${pr.length} project${pr.length === 1 ? '' : 's'}</span></div></div>`; }).join('')}</section>`,
    clients: table(['Client', 'Type', 'Architect', 'Value', 'Status'], clients.sort((a, b) => b.value - a.value).map(c => ({ href: `#/client/${c.id}`, cells: [esc(c.name), c.type, esc(ARCH[c.architect].name), inr(c.value), clientStatus(c.status)] }))),
    projects: projects.length ? table(['Project', 'Architect', 'Stage', 'Value'], projects.map(p => ({ href: `#/project/${p.id}`, cells: [esc(p.name), esc(ARCH[p.org.architect].name), esc(p.stage), inr(p.value)] }))) : '<p class="muted">No projects yet.</p>',
  }[tab];
  return `<div class="stack">${rnav('firms')}${crumbs(['Architect firms', '#/firms'], [f.name])}
    <div class="stack-s"><h1>${esc(f.name.replace(' (sample)', ''))}</h1><div class="row"><span class="badge plain">Focus: ${esc(f.focus)}</span>${demo}</div><p class="muted">${esc(market(f.market))} · working with EGO since ${new Date(f.since).getFullYear()} · owner ${esc(EMP[f.owner].name)}</p></div>
    <div class="grid g4">${stat('Architects', archs.length, `${archs.filter(a => a.design500).length} in Design 500`)}${stat('Clients', clients.length, `${clients.filter(c => c.status === 'Active project').length} active`)}
      ${stat('Project value', inr(projects.filter(p => p.stage !== 'Lost').reduce((a, p) => a + p.value, 0)), `${projects.filter(p => p.stage_idx < 7 && p.stage !== 'Lost').length} in pipeline`)}${stat('Client value', inr(clients.reduce((a, c) => a + c.value, 0)))}</div>
    ${subtabs(`#/firm/${id}`, tab, [['architects', `Architects (${archs.length})`], ['clients', `Clients (${clients.length})`], ['projects', `Projects (${projects.length})`]])}
    ${body}</div>`;
};
EM.VIEWS.firm.title = a => (FIRM[a.split('/')[0]] || { name: 'Firm' }).name;
EM.ACTIONS['arch-add'] = el => EM.modal(`<h2>Add architect</h2><p class="muted">${esc(FIRM[el.dataset.f].name)}</p><form class="stack" style="margin-top:12px" onsubmit="return false">
  <div class="grid g2"><div class="field"><label for="ar-name">Name *</label><input class="input" id="ar-name" placeholder="Ar. …"></div><div class="field"><label for="ar-phone">Mobile *</label><input class="input" id="ar-phone" inputmode="numeric"></div></div>
  <div class="grid g2"><div class="field"><label for="ar-pos">Position</label><select class="input" id="ar-pos"><option>Architect</option><option>Senior architect</option><option>Principal</option><option>Interior designer</option></select></div>
  <div class="field"><label for="ar-spec">Specialisation</label><select class="input" id="ar-spec">${['Luxury villas', 'Boutique hotels', 'Workplace', 'Retail fit-outs', 'Apartments'].map(x => `<option>${x}</option>`).join('')}</select></div></div>
  <div id="ar-err" class="small" style="color:var(--bad)"></div><div class="row"><button class="btn primary" data-act="arch-save" data-f="${el.dataset.f}">Add</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
EM.ACTIONS['arch-save'] = el => {
  const name = qs('#ar-name').value.trim(), d10 = qs('#ar-phone').value.replace(/\D/g, '').slice(-10), f = FIRM[el.dataset.f];
  if (!name || d10.length !== 10) { qs('#ar-err').textContent = 'Enter a name and a 10-digit mobile number.'; return; }
  if (D.architect.some(a => a.phone.replace(/\D/g, '').slice(-10) === d10)) { qs('#ar-err').textContent = 'An architect with this mobile already exists.'; return; }
  const a = { id: 'arc_new' + EM.tick++, name: name.startsWith('Ar.') ? name : 'Ar. ' + name, firm: f.id, market: f.market, focus: f.focus, position: qs('#ar-pos').value, specialisation: qs('#ar-spec').value, potential: 'Medium', design500: false,
    phone: '+91 ' + d10.slice(0, 5) + ' ' + d10.slice(5), demo: true, owner: f.owner, relationship: 'EGO-direct', division: 'retail', connected_dealers: [], last_contact: stamp(), next_action: 'Welcome visit + catalogue' };
  D.architect.push(a); ARCH[a.id] = a; f.architects++;
  EM.closeModal(); EM.toast(`<b>${esc(a.name)} added to ${esc(f.name.replace(' (sample)', ''))}</b><ul><li>${esc(EMP[f.owner].name)} gets a welcome-visit task</li><li>Clients they bring in roll up to the firm</li></ul>`); EM.rerender();
};

// architect profile (replaces the old one): firm link + their clients
const oldArchitect = EM.VIEWS.architect;
EM.VIEWS.architect = id => {
  const a = ARCH[id];
  if (!a) return '<p>Architect not found.</p>';
  if (!seeFirm(FIRM[a.firm])) return EM.noAccess('This architect’s firm is managed by another owner.');
  const cs = D.client.filter(c => c.architect === id);
  return oldArchitect(id).replace(pnav('architects'), rnav('firms')).replace(crumbs(['Architects', '#/architects'], [a.name]), crumbs(['Architect firms', '#/firms'], [FIRM[a.firm].name.replace(' (sample)', ''), `#/firm/${a.firm}`], [a.name]))
    + `<section class="stack-s" style="margin-top:20px"><h3>Clients</h3>${cs.length ? table(['Client', 'Type', 'Value', 'Status'], cs.map(c => ({ href: `#/client/${c.id}`, cells: [esc(c.name), c.type, inr(c.value), clientStatus(c.status)] }))) : '<p class="muted">No clients linked yet.</p>'}</section>`;
};

// ---------------------------------------------------------------- every screen → its division and tab
const META = {
  dealers: ['wholesale', 'dealers'], dealer: ['wholesale', 'dealers'], order: ['wholesale', 'dealers'], orders: ['wholesale', 'orders'], worder: ['wholesale', 'orders'],
  stock: ['wholesale', 'stock'], production: ['wholesale', 'production'], po: ['wholesale', 'production'],
  champions: ['wholesale', 'champions'], displays: ['wholesale', 'champions'], samples: ['wholesale', 'champions'], training: ['wholesale', 'champions'],
  clients: ['retail', 'clients'], client: ['retail', 'clients'], firms: ['retail', 'firms'], firm: ['retail', 'firms'], architects: ['retail', 'firms'], architect: ['retail', 'firms'],
  leads: ['retail', 'leads'], lead: ['retail', 'leads'], projects: ['retail', 'projects'], project: ['retail', 'projects'], partner: ['retail', 'projects'],
  installation: ['retail', 'installation'], site: ['retail', 'installation'], schedule: ['retail', 'installation'], installers: ['retail', 'installation'], installer: ['retail', 'installation'], siteapp: ['retail', 'installation'],
  complaints: [null, 'complaints'], roles: [null, 'team'], team: [null, 'team'], home: [null, 'home'],
};
Object.entries(META).forEach(([k, [div, tab]]) => { if (EM.VIEWS[k]) { EM.VIEWS[k].div = div; EM.VIEWS[k].tab = tab; } });
