'use strict';
/* EGO Master LIVE: the screens for real records. Runs on the demo's shell (app.js:
   sidebar, cards, tables, modal, toast) so it looks the same, and replaces every
   screen whose numbers would otherwise be invented.

   The rule: every figure here is counted from records the team saved. A screen that
   needs a system we have not connected yet (Tally, Runo, Sales Diary, WhatsApp,
   ad leads, AI) says "Not connected yet" and names what it needs.

   Every add or edit goes to the API first; only what the API returns is put into D.
   Field types come from schema.js, the same file the server validates with. */

const API = window.EGOAPI.api;
const DIVS = { wholesale: { name: 'Wholesale', co: 'EGO Premium' }, retail: { name: 'Retail', co: 'Big E' } };
const me = () => D.user;
const acc = () => D.access;
const isOwner = () => D.user.role === 'owner';
const holds = () => D.access.scope !== 'none';
const canDiv = div => D.user.division === 'both' || div === 'both' || div === D.user.division;
function allowedTab(t) {
  if (['home', 'account', 'soon'].includes(t)) return true;
  if (['clients', 'people', 'opps', 'import'].includes(t)) return holds();
  if (t === 'dealers') return holds() && canDiv('wholesale');
  if (t === 'architects') return holds();
  if (t === 'team') return D.access.users;
  if (t === 'lists') return isOwner();
  return false;
}
EM.div = D.user.division === 'both' ? 'both' : D.user.division;
EM.navTabs = () => ({
  main: [['home', 'Home'], ['dealers', 'Dealers'], ['architects', 'Architects'], ['people', 'People'], ['opps', 'Opportunities'], ['import', 'Import from Excel']]
    .filter(([k]) => allowedTab(k) && !(k === 'dealers' && EM.div === 'retail')),
  shared: [['team', 'Team & access'], ['lists', 'Lists & stages'], ['account', 'My account']].filter(([k]) => allowedTab(k)),
});
Object.assign(ICON, {
  opps: ICON.leads, architects: ICON.firms, people: ICON.clients, import: _i('<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/><path d="M4 15.5v3A2 2 0 0 0 6 20.5h12a2 2 0 0 0 2-2v-3"/>'),
  lists: _i('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17.5" r="1"/>'),
  account: _i('<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
});
EM.topExtras = () => (D.user.division === 'both' ? `<div class="seg divsw" role="tablist" aria-label="Division">${[['both', 'Both'], ['wholesale', 'Wholesale · EGO'], ['retail', 'Retail · Big E']].map(([k, l]) => `<button role="tab" aria-selected="${EM.div === k}" class="${EM.div === k ? 'on' : ''}" data-act="div" data-d="${k}">${l}</button>`).join('')}</div>` : '')
  + '<button class="btn sm ghost" data-act="sign-out">Sign out</button>';
EM.ACTIONS.div = el => { EM.div = el.dataset.d; EM.rerender(); };
EM.ACTIONS['sign-out'] = () => window.EGOAPI.signOut();
EM.noAccess = why => `<div class="stack" style="max-width:640px"><h1>Not in your access</h1><p class="muted">${esc(me().name)} is <b>${esc(acc().name)}</b>. ${esc(why || '')}</p>
  <div class="callout">Access is set in <b>Team &amp; access</b> by the Owner.</div><a class="btn" href="#/home">Home</a></div>`;

/* ---------------------------------------------------------------- small helpers */
const byIdL = a => Object.fromEntries((a || []).map(x => [x.id, x]));
const CL = () => byIdL(D.clients);
const ST = () => byIdL(D.staff);
const staffName = id => (ST()[id] || {}).name || 'Not set';
const kindLabel = k => (KINDS[k] || { label: k }).label;
const today = () => new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
const money = n => n == null || n === '' ? '' : inrFull(n);
const NOTSET = '<span class="muted">Not filled</span>';
const inDiv = r => EM.div === 'both' || r.division === 'both' || r.division === EM.div;
const showFields = list => list.filter(f => D.access.prices || f.type !== 'money');
const upsertLocal = (arr, rec) => { const i = arr.findIndex(x => x.id === rec.id); if (i >= 0) arr[i] = rec; else arr.push(rec); return rec; };
const ctxLocal = () => ({ lists: D.lists, staffIds: new Set(D.staff.filter(s => s.active).map(s => s.id)) });
const empty = (title, body, actions = '') => `<div class="card empty stack-s"><h3>${title}</h3><p class="muted">${body}</p>${actions ? `<div class="row">${actions}</div>` : ''}</div>`;
const tile = (k, v, sub, href) => `<${href ? `a href="${href}"` : 'div'} class="card stat ${href ? 'tile' : ''}" style="text-decoration:none"><div class="kicker">${k}</div><div class="num">${v}</div>${sub ? `<span class="small muted">${sub}</span>` : ''}</${href ? 'a' : 'div'}>`;
const busy = (el, on) => { if (el) { el.disabled = on; if (on) el.dataset.label = el.textContent, el.textContent = 'Saving…'; else if (el.dataset.label) el.textContent = el.dataset.label; } };
const errBox = id => `<div class="small err" id="${id}" role="alert"></div>`;
const showErr = (id, errs) => { const el = qs('#' + id); if (el) el.innerHTML = (Array.isArray(errs) ? errs : [errs]).map(esc).join('<br>'); };
const greet = () => { const h = new Date(Date.now() + 5.5 * 36e5).getUTCHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

/* ---------------------------------------------------------------- the shared field helpers
   ONE renderer per field type, used by every form and modal. A mobile anywhere has a
   country code; a designation anywhere is the same dropdown. check_live.js renders every
   form and fails if a mobile or designation control was built by hand. */
function splitMobile(v) {
  const s = String(v || '');
  if (!s.startsWith('+')) return { dial: '+91', num: s };
  const dial = DIAL_CODES.slice().sort((a, b) => b.length - a.length).find(c => s.startsWith(c)) || '+91';
  return { dial, num: s.slice(dial.length) };
}
const G = {
  wrap: (f, p, inner, wide) => `<div class="field${wide ? ' span2' : ''}" data-field="${f.key}"><label for="${p}-${f.key}">${esc(f.label)}${f.req ? ' *' : ''}</label>${inner}</div>`,
  mobile: (f, v, p) => { const m = splitMobile(v); return G.wrap(f, p, `<div class="mob" data-mobile="${f.key}"><select class="input dial" name="${f.key}_dial" aria-label="Country code for ${esc(f.label)}">${DIAL_CODES.map(c => `<option ${c === m.dial ? 'selected' : ''}>${c}</option>`).join('')}</select><input class="input" id="${p}-${f.key}" name="${f.key}" inputmode="tel" autocomplete="off" value="${esc(m.num)}" placeholder="10-digit mobile"></div>`); },
  select: (f, v, p, opts, blank = true) => G.wrap(f, p, `<select class="input" id="${p}-${f.key}" name="${f.key}"${f.key === 'designation' ? ' data-designation' : ''}>${blank ? '<option value="">Choose</option>' : ''}${opts.map(([k, l]) => `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`),
};
function fieldHtml(f, v, p, opt = {}) {
  v = v ?? '';
  switch (f.type) {
    case 'mobile': return G.mobile(f, v, p);
    case 'textarea': return G.wrap(f, p, `<textarea class="input" rows="2" id="${p}-${f.key}" name="${f.key}">${esc(v)}</textarea>`, true);
    case 'email': return G.wrap(f, p, `<input class="input" type="email" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}">`);
    case 'number': case 'money': return G.wrap(f, p, `<input class="input" type="number" min="0" step="${f.type === 'money' ? '0.01' : '1'}" inputmode="decimal" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}">`);
    case 'date': return G.wrap(f, p, `<input class="input" type="date" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}">`);
    case 'yesno': return G.select(f, v === true ? 'Yes' : v === false ? 'No' : v, p, [['Yes', 'Yes'], ['No', 'No']]);
    case 'select': return G.select(f, v, p, f.opts.map(o => [o, optLabel(f, o)]), !f.req);
    case 'city': return G.select(f, v, p, D.lists.cities.map(c => [c.city, `${c.city} · ${c.region}`]));
    case 'owner': {
      const ppl = D.staff.filter(s => s.active && (D.access.scope !== 'own' || s.id === me().id));
      return G.select(f, v, p, ppl.map(s => [s.id, s.name]), !f.req);
    }
    case 'link': {
      const opts = D.clients.filter(c => f.to.includes(c.kind) && c.id !== opt.self).sort((a, b) => a.name.localeCompare(b.name)).map(c => [c.id, `${c.name} · ${kindLabel(c.kind)} · ${c.city}`]);
      return G.select(f, v, p, opts);
    }
    case 'cats': return fieldHtml({ ...f, type: 'multi', opts: D.lists.categories }, v, p);
    case 'cities': return fieldHtml({ ...f, type: 'multi', opts: D.lists.cities.map(c => c.city) }, v, p);
    case 'multi': return G.wrap(f, p, `<div class="checks" id="${p}-${f.key}" role="group" aria-label="${esc(f.label)}">${f.opts.map(o => `<label class="chip"><input type="checkbox" name="${f.key}" value="${esc(o)}" ${(Array.isArray(v) ? v : []).includes(o) ? 'checked' : ''}> ${esc(o)}</label>`).join('')}</div>`, true);
    case 'stage': return G.select(f, v, p, ((D.lists.stages || {})[opt.pipeline] || []).map(s => [s, s]), false);
    case 'lost': return G.select(f, v, p, D.lists.lost_reasons.map(s => [s, s]));
    case 'contact': return G.select(f, v, p, D.contacts.filter(k => k.client_id === opt.client).map(k => [k.id, `${k.name}${k.designation ? ' · ' + k.designation : ''}`]));
    case 'gst': return G.wrap(f, p, `<input class="input" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}" maxlength="15" autocapitalize="characters" placeholder="15 characters">`);
    default: return G.wrap(f, p, `<input class="input" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}">`);
  }
}
function readForm(form, fields) {
  const fd = new FormData(form), o = {};
  for (const f of fields) {
    if (['multi', 'cats', 'cities'].includes(f.type)) o[f.key] = fd.getAll(f.key);
    else { o[f.key] = fd.has(f.key) ? String(fd.get(f.key)) : ''; if (f.type === 'mobile') o[f.key + '_dial'] = String(fd.get(f.key + '_dial') || '+91'); }
  }
  return o;
}
/* a mobile is shown and edited with its code, so the form gives back +<code><number> */
const withDials = (o, fields) => { for (const f of fields) if (f.type === 'mobile' && o[f.key]) { const r = normMobile(o[f.key], o[f.key + '_dial']); if (r.value) o[f.key] = r.value; } return o; };
function showVal(f, v) {
  if (v === '' || v == null || (Array.isArray(v) && !v.length)) return NOTSET;
  switch (f.type) {
    case 'mobile': return esc(fmtMobile(v));
    case 'owner': return esc(staffName(v));
    case 'link': { const c = CL()[v]; return c ? `<a href="#/client/${c.id}">${esc(c.name)}</a>` : '<span class="muted">Outside your view</span>'; }
    case 'yesno': return v ? 'Yes' : 'No';
    case 'multi': case 'cats': case 'cities': return v.map(x => `<span class="chip">${esc(x)}</span>`).join('');
    case 'money': return money(v);
    case 'date': return ds(v);
    case 'select': return esc(optLabel(f, v));
    case 'email': return `<a href="mailto:${esc(v)}">${esc(v)}</a>`;
    default: return esc(v);
  }
}

/* ---------------------------------------------------------------- home */
EM.VIEWS.home = () => {
  const who = `<div class="stack-s"><div class="kicker">${esc(acc().name)} · ${esc(scopeLabel())}</div><h1>${greet()}, ${esc(me().name.split(' ')[0])}</h1></div>`;
  if (!holds()) return `<div class="stack">${who}<p class="muted">Your role manages people and access, not business records.</p><div class="row">${allowedTab('team') ? '<a class="btn primary" href="#/team">Team &amp; access</a>' : ''}</div></div>`;
  const cs = D.clients.filter(inDiv), os = D.opportunities.filter(inDiv), t = today(), month = t.slice(0, 7);
  const n = k => cs.filter(c => c.kind === k).length;
  const open = os.filter(o => !['Won', 'Lost'].includes(o.stage));
  const due = [...open.filter(o => o.next_date && o.next_date <= t)];
  const won = os.filter(o => o.stage === 'Won' && (o.closed_at || '').slice(0, 7) === month);
  const sum = a => a.reduce((s, o) => s + (Number(o.value) || 0), 0);
  const groups = [
    ['wholesale', 'Dealers', DEALER_KINDS, '#/dealers'],
    ['both', 'Architects', ARCH_KINDS, '#/architects'],
  ].filter(([d]) => canDiv(d) && (EM.div === 'both' || d === 'both' || d === EM.div));
  const ppl = peopleRows();
  const tiles = groups.map(([, l, ks, h]) => tile(l, ks.reduce((a, k) => a + n(k), 0), ks.map(k => `${n(k)} ${kindLabel(k).toLowerCase()}${n(k) === 1 ? '' : 's'}`).join(' · '), h)).join('')
    + tile('People', ppl.length, ppl.length ? `${ppl.filter(x => x.type === 'personal').length} personal` : '', '#/people')
    + tile('Open opportunities', open.length, D.access.prices && open.length ? `${inr(sum(open))} in values entered` : '', '#/opps')
    + tile('Next actions due', due.length, due.length ? `${due.filter(o => o.next_date < t).length} overdue` : 'nothing due today', '#/opps')
    + tile('Won this month', won.length, D.access.prices && won.length ? inr(sum(won)) : '', '#/opps');
  const next = due.concat(open.filter(o => o.next_date > t)).sort((a, b) => (a.next_date || '').localeCompare(b.next_date || '')).slice(0, 8);
  return `<div class="stack">${who}
    ${cs.length ? '' : empty('Nothing saved yet', 'Add a dealer with its team, an architect firm with its team, or a person, or fill the Excel file and upload it. Every number on this page is counted from what you save.', addButtons())}
    <div class="grid g4">${tiles}</div>
    ${next.length ? `<section class="stack-s"><h3>Next actions in your view</h3>${table(['Opportunity', 'Client', 'Next action', 'Due', 'Owner'], next.map(o => ({ href: `#/opp/${o.id}`, cells: [`<b>${esc(o.title)}</b>`, esc((CL()[o.client_id] || {}).name || ''), esc(o.next_action || ''), o.next_date < t ? `<span class="badge bad">${ds(o.next_date)}</span>` : ds(o.next_date), esc(staffName(o.owner_id))] })))}</section>` : ''}
    ${notConnectedCard()}</div>`;
};
EM.VIEWS.home.title = () => 'Home';
const scopeLabel = () => ({ all: 'sees both companies', division: `sees all of ${D.user.division === 'both' ? 'both companies' : DIVS[D.user.division].name}`, region: `sees the ${D.user.region || ''} region`, own: 'sees the records you own', none: 'no business records' })[acc().scope] || '';

/* What is still to come, said plainly instead of shown as numbers. */
const SOON = {
  sales: ['Orders, invoices and dealer sales', 'Tally. Sales, outstanding and credit will be read from Tally invoices only.'],
  calls: ['Calls and telecalling', 'Runo, through its API key.'],
  visits: ['Field visits', 'Sales Diary, once the vendor shares its API documentation.'],
  whatsapp: ['WhatsApp messages', 'The WhatsApp Business number and Meta approval.'],
  ads: ['Ad and portal leads', 'Meta, Google, IndiaMART and JustDial lead feeds.'],
  ai: ['AI lead screening and the call agent', 'The leads feed above, a telephony number and DLT registration.'],
  targets: ['Targets, schemes and Priority 200 scores', 'Sales from Tally, so achievement is never typed by hand.'],
  stock: ['Stock, fulfilment and production', 'Tally stock items and godowns.'],
};
const notConnectedCard = () => `<section class="card stack-s"><h3>Not connected yet</h3><p class="small muted">These parts of EGO Master show no figures until the system that feeds them is connected. Nothing here is estimated.</p>
  ${table(['Part', 'Waits for', ''], Object.values(SOON).map(([a, b]) => [esc(a), esc(b), '<span class="badge warn">Not connected yet</span>']))}</section>`;
/* the demo's screens, if a bookmark or an old link reaches them */
const DEMO_ROUTES = { orders: 'sales', worder: 'sales', order: 'sales', fulfilment: 'stock', fulfil: 'stock', production: 'stock', po: 'stock', stock: 'stock', targets: 'targets', schemes: 'targets', p200: 'targets', champions: 'targets', complaints: 'sales', leads: 'ads', lead: 'ads', projects: 'sales', project: 'sales', installation: 'stock', inbox: 'whatsapp', approvals: 'sales', cockpit: 'targets', automations: 'whatsapp', ai: 'ai', integrations: 'ai', app: 'visits', map: 'ai', tech: 'ai' };
for (const [r, k] of Object.entries(DEMO_ROUTES)) {
  EM.VIEWS[r] = () => `<div class="stack" style="max-width:720px"><span class="badge warn">Not connected yet</span><h1>${esc(SOON[k][0])}</h1><p class="muted">This part of EGO Master waits for: ${esc(SOON[k][1])} Until then it shows nothing rather than sample figures.</p><div class="row"><a class="btn primary" href="#/people">People</a><a class="btn" href="#/home">Home</a></div></div>`;
  EM.VIEWS[r].tab = 'soon';
  EM.VIEWS[r].title = () => SOON[k][0];
}

/* ---------------------------------------------------------------- dealers, architects, people
   A dealer or an architect firm is a COMPANY (a row in clients) with its team (contacts).
   A person with no company is a personal contact (a client of kind direct or retail).
   People shows all of them together; each company portal shows its own companies. */
const DEALER_KINDS = ['distributor', 'dealer', 'sub_dealer'], ARCH_KINDS = ['design_firm', 'architect'];
const PERSONAL_KINDS = ['direct', 'retail'];
const kindsAllowed = () => Object.keys(KINDS).filter(k => canDiv(KINDS[k].division) && (EM.div === 'both' || KINDS[k].division === 'both' || KINDS[k].division === EM.div));
const personalKinds = () => PERSONAL_KINDS.filter(k => kindsAllowed().includes(k));
const addButtons = () => [
  allowedTab('dealers') && kindsAllowed().includes('dealer') ? '<button class="btn primary" data-act="org-add" data-org="dealer">+ Add dealer</button>' : '',
  '<button class="btn primary" data-act="org-add" data-org="architect">+ Add architect firm</button>',
  '<button class="btn" data-act="person-add">+ Add person</button>', '<a class="btn" href="#/import">Import from Excel</a>'].join('');
const wonValue = id => D.opportunities.filter(o => o.client_id === id && o.stage === 'Won').reduce((a, o) => a + (Number(o.value) || 0), 0);
EM.clientQ = '';
const searchBox = ph => `<label class="field" style="max-width:420px"><span class="small muted">Search</span><input class="input" id="cq" value="${esc(EM.clientQ)}" placeholder="${ph}"></label>`;
const matches = (txt, mobiles) => { const q = EM.clientQ.toLowerCase(), qd = q.replace(/\D/g, ''); return !q || txt.toLowerCase().includes(q) || (qd.length >= 4 && mobiles.some(m => String(m || '').includes(qd))); };
function orgList(org, arg) {
  const all0 = org === 'dealer' ? DEALER_KINDS : ARCH_KINDS;
  const subs = org === 'dealer' ? [['all', 'All', all0], ['distributor', 'Distributors', ['distributor']], ['dealer', 'Dealers', ['dealer']], ['sub_dealer', 'Sub-dealers', ['sub_dealer']]]
    : [['all', 'All', all0], ['design_firm', 'Firms', ['design_firm']], ['architect', 'Solo architects', ['architect']]];
  const tab = subs.find(t => t[0] === arg) || subs[0];
  const all = D.clients.filter(c => all0.includes(c.kind) && inDiv(c));
  const rows = all.filter(c => tab[2].includes(c.kind) && matches(`${c.name} ${c.city} ${c.ref || ''} ${c.gst}`, [c.mobile]));
  const team = id => D.contacts.filter(k => k.client_id === id).length, open = id => D.opportunities.filter(o => o.client_id === id && !['Won', 'Lost'].includes(o.stage)).length;
  const title = org === 'dealer' ? 'Dealers' : 'Architects', base = '#/' + (org === 'dealer' ? 'dealers' : 'architects');
  const rating = c => org === 'dealer' ? c.grade : (c.extra || {}).rating;
  return `<div class="stack">
    <div class="row between"><div class="stack-s"><div class="kicker">${org === 'dealer' ? 'Distributors, dealers and sub-dealers, each with its team' : 'Architect firms and solo architects, each with its team'}</div><h1>${title}</h1><p class="muted">${rows.length} of ${all.length} · ${esc(scopeLabel())}</p></div>
      <div class="row"><a class="btn" href="#/import">Import from Excel</a><button class="btn primary" data-act="org-add" data-org="${org}">+ Add ${org === 'dealer' ? 'dealer' : 'architect firm'}</button></div></div>
    ${subtabs(base, tab[0], subs.map(([k, l, ks]) => [k, `${l} <span class="muted">${all.filter(c => ks.includes(c.kind)).length}</span>`]))}
    ${searchBox('Company name, city, mobile, GST or reference')}
    ${all.length ? (rows.length ? table(['Company', 'Type', 'City', 'Rating', 'Team', 'Open opportunities', ...(D.access.prices ? ['Won value'] : []), 'Looked after by'], rows.slice(0, 300).map(c => ({ href: `#/client/${c.id}`,
      cells: [`<b>${esc(c.name)}</b><div class="small muted">${esc(c.ref || '')}${c.parent_id && CL()[c.parent_id] ? ' · under ' + esc(CL()[c.parent_id].name) : ''}</div>`, esc(kindLabel(c.kind)), esc(c.city), esc(rating(c) || ''), team(c.id), open(c.id), ...(D.access.prices ? [money(wonValue(c.id))] : []), esc(staffName(c.owner_id))] })))
      + (rows.length > 300 ? `<p class="small muted">Showing 300 of ${rows.length}. Search to narrow it down.</p>` : '') : '<p class="muted">Nothing matches that search.</p>')
      : empty(`No ${title.toLowerCase()} yet`, `Add the company and its people in one go, or fill the Excel file and upload it.`, `<button class="btn primary" data-act="org-add" data-org="${org}">+ Add ${org === 'dealer' ? 'dealer' : 'architect firm'}</button><a class="btn" href="#/import">Import from Excel</a>`)}
  </div>`;
}
EM.VIEWS.dealers = arg => orgList('dealer', arg);
EM.VIEWS.dealers.title = () => 'Dealers';
EM.VIEWS.architects = arg => orgList('architect', arg);
EM.VIEWS.architects.title = () => 'Architects';

/* everyone in one list: the team of every company in view, and every personal contact */
function peopleRows() {
  const out = [];
  for (const k of D.contacts) {
    const c = CL()[k.client_id];
    if (!c || !inDiv(c)) continue;
    out.push({ id: k.id, name: k.name, role: k.designation || '', resp: k.responsibilities || '', mobile: k.mobile, email: k.email || '', company: c, type: DEALER_KINDS.includes(c.kind) ? 'dealer' : ARCH_KINDS.includes(c.kind) ? 'architect' : 'personal', href: `#/client/${c.id}/contacts` });
  }
  for (const c of D.clients) if (PERSONAL_KINDS.includes(c.kind) && inDiv(c)) out.push({ id: c.id, name: c.name, role: (c.extra || {}).client_type || '', resp: '', mobile: c.mobile, email: c.email || '', company: null, type: 'personal', href: `#/client/${c.id}` });
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
EM.VIEWS.people = arg => {
  const all = peopleRows();
  const subs = [['all', 'All'], ...(allowedTab('dealers') && EM.div !== 'retail' ? [['dealer', 'At a dealer']] : []), ['architect', 'At an architect firm'], ['personal', 'Personal']];
  const tab = subs.find(t => t[0] === arg) || subs[0];
  const rows = all.filter(x => (tab[0] === 'all' || x.type === tab[0]) && matches(`${x.name} ${x.role} ${x.company ? x.company.name : ''} ${x.email}`, [x.mobile]));
  const TYPE = { dealer: 'Dealer', architect: 'Architect firm', personal: 'Personal' };
  return `<div class="stack">
    <div class="row between"><div class="stack-s"><div class="kicker">Everyone in one place</div><h1>People</h1><p class="muted">${rows.length} of ${all.length}. Every person belongs to a dealer, an architect firm, or is a personal contact.</p></div>
      <div class="row"><a class="btn" href="#/import">Import from Excel</a><button class="btn primary" data-act="person-add">+ Add person</button></div></div>
    ${subtabs('#/people', tab[0], subs.map(([k, l]) => [k, `${l} <span class="muted">${k === 'all' ? all.length : all.filter(x => x.type === k).length}</span>`]))}
    ${searchBox('Name, role, company, mobile or email')}
    ${all.length ? (rows.length ? table(['Name', 'Role', 'Belongs to', 'Type', 'Mobile', 'Email'], rows.slice(0, 400).map(x => ({ href: x.href,
      cells: [`<b>${esc(x.name)}</b>${x.resp ? `<div class="small muted">${esc(x.resp)}</div>` : ''}`, esc(x.role), x.company ? esc(x.company.name) : '<span class="muted">Personal</span>', esc(TYPE[x.type]), esc(fmtMobile(x.mobile)), esc(x.email)] })))
      + (rows.length > 400 ? `<p class="small muted">Showing 400 of ${rows.length}. Search to narrow it down.</p>` : '') : '<p class="muted">Nothing matches that search.</p>')
      : empty('No people yet', 'Add a dealer or an architect firm with its team, or add a personal contact.', addButtons())}
  </div>`;
};
EM.VIEWS.people.title = () => 'People';
EM.VIEWS.clients = EM.VIEWS.people;   // old links
EM.VIEWS.clients.title = () => 'People';
document.addEventListener('input', e => { if (e.target.id === 'cq') { EM.clientQ = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#cq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });

/* + Add person: at a dealer, at an architect firm, or personal */
EM.ACTIONS['person-add'] = () => {
  const opts = [allowedTab('dealers') && kindsAllowed().includes('dealer') ? ['dealer', 'Works at a dealer', 'Distributor, dealer or sub-dealer'] : null,
    ['architect', 'Works at an architect firm', 'Or is a solo architect'], personalKinds().length ? ['personal', 'Personal contact', 'No company: a homeowner, or a firm on its own'] : null].filter(Boolean);
  EM.modal(`<h2>Add a person</h2><p class="muted">Every person belongs to a dealer, an architect firm, or is a personal contact.</p>
    <div class="stack-s" style="margin-top:14px">${opts.map(([k, l, d]) => `<button class="btn" style="justify-content:flex-start;text-align:left" data-act="person-at" data-at="${k}"><span><b>${l}</b><br><span class="small muted">${d}</span></span></button>`).join('')}</div>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['person-at'] = el => {
  const at = el.dataset.at;
  if (at === 'personal') return openClientForm(null, personalKinds()[0], null, personalKinds());
  openPersonForm(at, null, {});
};
function openPersonForm(org, companyId, keep) {
  const kinds = org === 'dealer' ? DEALER_KINDS : ARCH_KINDS;
  const cos = D.clients.filter(c => kinds.includes(c.kind) && inDiv(c)).sort((a, b) => a.name.localeCompare(b.name));
  const what = org === 'dealer' ? 'dealer company' : 'architect firm';
  EM.modal(`<h2>Add a person at a ${what}</h2>
    <form id="pf" class="stack" onsubmit="return false" style="margin-top:14px" data-org="${org}">
      <div class="fgrid">${G.select({ key: 'company', label: `Which ${what}`, req: true }, companyId || keep.company || '', 'pf', [...cos.map(c => [c.id, `${c.name} · ${c.city}`]), ['__new', `+ New ${what}…`]]).replace('<select', '<select data-company-pick')}</div>
      <div class="fgrid">${CONTACT_FIELDS.map(f => fieldHtml(f, keep[f.key], 'pf')).join('')}</div>
      ${errBox('pf-err')}
      <div class="row sticky-actions"><button class="btn primary" data-act="person-save">Add person</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
document.addEventListener('change', e => {
  if (!e.target.matches('[data-company-pick]') || e.target.value !== '__new') return;
  /* a company not on the list: open the company form with this person already in its team */
  const form = qs('#pf'), org = form.dataset.org, person = withDials(readForm(form, CONTACT_FIELDS), CONTACT_FIELDS);
  openClientForm(null, org === 'dealer' ? 'dealer' : 'design_firm', null, org === 'dealer' ? DEALER_KINDS : ARCH_KINDS, Object.values(person).some(v => v && v !== '+91') ? [person] : [{}]);
});
EM.ACTIONS['person-save'] = async el => {
  const form = qs('#pf'), company = form.querySelector('[data-company-pick]').value;
  if (!company || company === '__new') return showErr('pf-err', 'Choose the company this person works at.');
  const input = withDials(readForm(form, CONTACT_FIELDS), CONTACT_FIELDS);
  const { errors } = cleanContact(input, {});
  if (errors.length) return showErr('pf-err', errors);
  busy(el, true);
  try {
    const r = await API('POST', '/api/contacts', { ...input, client_id: company });
    D.contacts = D.contacts.filter(k => k.client_id !== company).concat(r.contacts);
    EM.closeModal(); EM.toast(`<b>${esc(input.name)} added</b><ul><li>${esc(CL()[company].name)}</li></ul>`);
    location.hash = `#/client/${company}/contacts`; EM.rerender();
  } catch (x) { busy(el, false); showErr('pf-err', x.errors || x.message); }
};
EM.ACTIONS['org-add'] = el => openClientForm(null, el.dataset.org === 'dealer' ? 'dealer' : 'design_firm', null, el.dataset.org === 'dealer' ? DEALER_KINDS : ARCH_KINDS, [{}]);

/* the add / edit form: the type decides the fields */
/* The add / edit form: the type decides the fields. `only` limits the types offered
   (a dealer form offers the three dealer types). A NEW dealer or architect firm gets a
   people block under it: as many people as they like, saved with the company. */
const FAMILIES = [DEALER_KINDS, ARCH_KINDS, PERSONAL_KINDS];
const kindName = k => PERSONAL_KINDS.includes(k) ? `Personal contact · ${DIVS[KINDS[k].division].co}` : `${KINDS[k].label} · ${KINDS[k].division === 'both' ? 'EGO Premium or Big E' : DIVS[KINDS[k].division].co}`;
const personRow = (i, v = {}) => `<form class="card stack-s pf-row" data-i="${i}" onsubmit="return false"><div class="row between"><b>Person ${i + 1}</b><button class="btn sm ghost" data-act="ppl-del" data-i="${i}">Remove</button></div>
  <div class="fgrid">${CONTACT_FIELDS.map(f => fieldHtml(f, v[f.key], 'pp' + i)).join('')}</div></form>`;
function openClientForm(c, kind, keep, only, people) {
  const fam = c ? FAMILIES.find(f => f.includes(c.kind)) : null;
  const kinds = c ? fam.filter(k => canDiv(KINDS[k].division)) : (only || kindsAllowed()).filter(k => kindsAllowed().includes(k));
  kind = kinds.includes(kind) ? kind : (c ? c.kind : kinds[0]);
  const v = keep || (c ? { ...c, ...c.extra } : { owner_id: me().id, status: 'Active' });
  const fields = showFields(fieldsFor(kind)).filter(f => f.key !== 'kind');
  const sections = [...new Set(fields.map(f => f.section))];
  const org = DEALER_KINDS.includes(kind) ? 'dealer' : ARCH_KINDS.includes(kind) ? 'architect' : null;
  const noun = org === 'dealer' ? 'dealer' : org === 'architect' ? 'architect firm' : 'person';
  const team = !c && org ? (people && people.length ? people : [{}]) : null;
  EM.modal(`<h2>${c ? 'Edit ' + esc(c.name) : `Add a ${noun}`}</h2>
    <p class="muted small">${org ? 'Company details first, then the people who work there. ' : ''}Compulsory fields end with a star. The same mobile or GST number cannot be saved twice in one company.</p>
    <form id="cf" class="stack" onsubmit="return false" style="margin-top:14px" data-id="${c ? c.id : ''}" data-only="${(only || []).join(',')}">
      ${org ? '<h3>Company details</h3>' : ''}
      <div class="fgrid">${G.select(CLIENT_FIELDS[0], kind, 'cf', kinds.map(k => [k, kindName(k)]), false).replace('<select', '<select data-kind-pick')}
        ${KINDS[kind].division === 'both' && D.user.division === 'both' ? G.select({ key: 'division', label: 'Which company keeps this record' }, v.division || (EM.div === 'both' ? 'both' : EM.div), 'cf', [['wholesale', 'EGO Premium'], ['retail', 'Big E'], ['both', 'Both companies']], false) : ''}</div>
      ${sections.map(s => `<fieldset class="fs"><legend>${esc(s)}</legend><div class="fgrid">${fields.filter(f => f.section === s).map(f => fieldHtml(f, v[f.key], 'cf', { self: c && c.id })).join('')}</div></fieldset>`).join('')}
    </form>
    ${team ? `<div class="stack-s" style="margin-top:18px"><h3>People at this ${noun}</h3><p class="small muted">Name, role, what they handle, mobile and email. Leave a block empty to skip it. More people can be added later from the company page.</p>
      <div id="ppl" class="stack-s">${team.map((pv, i) => personRow(i, pv)).join('')}</div><div class="row"><button class="btn" data-act="ppl-add">+ Add another person</button></div></div>` : ''}
    ${errBox('cf-err')}
    <div class="row sticky-actions" style="margin-top:14px"><button class="btn primary" data-act="client-save">${c ? 'Save changes' : `Add ${noun}`}</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
}
const readPeople = () => [...document.querySelectorAll('#ppl .pf-row')].map(f => withDials(readForm(f, CONTACT_FIELDS), CONTACT_FIELDS))
  .filter(pv => CONTACT_FIELDS.some(f => f.type !== 'yesno' && String(pv[f.key] || '').trim()));
EM.ACTIONS['ppl-add'] = () => { const box = qs('#ppl'), n = box.querySelectorAll('.pf-row').length; box.insertAdjacentHTML('beforeend', personRow(n)); };
EM.ACTIONS['ppl-del'] = el => { const f = el.closest('.pf-row'); if (f) f.remove(); };
document.addEventListener('change', e => {
  if (!e.target.matches('[data-kind-pick]')) return;
  const form = qs('#cf'), id = form.dataset.id, c = id ? CL()[id] : null;
  const prev = readForm(form, CLIENT_FIELDS);
  const dv = form.querySelector('[name="division"]'); if (dv) prev.division = dv.value;
  for (const f of CLIENT_FIELDS) if (f.type === 'mobile' && prev[f.key]) { const r = normMobile(prev[f.key], prev[f.key + '_dial']); if (r.value) prev[f.key] = r.value; }
  const only = form.dataset.only ? form.dataset.only.split(',') : null;
  openClientForm(c, e.target.value, prev, only, qs('#ppl') ? readPeople() : null);
});
EM.ACTIONS['client-add'] = el => openClientForm(null, el.dataset.kind);
EM.ACTIONS['client-edit'] = el => openClientForm(CL()[el.dataset.id], CL()[el.dataset.id].kind);
EM.ACTIONS['client-save'] = async el => {
  const form = qs('#cf'), id = form.dataset.id, kind = form.querySelector('[data-kind-pick]').value;
  const input = readForm(form, fieldsFor(kind));
  input.kind = kind;
  const dv = form.querySelector('[name="division"]');
  if (dv) input.division = dv.value;
  else if (KINDS[kind].division === 'both' && !id) input.division = EM.div;
  const { errors } = cleanClient(input, ctxLocal());
  const people = qs('#ppl') ? readPeople() : [];
  people.forEach((pv, i) => { const r = cleanContact(pv, {}); if (r.errors.length) errors.push(`Person ${i + 1}: ${r.errors.join(', ')}`); });
  if (errors.length) return showErr('cf-err', errors);
  if (id) input.id = id;
  if (people.length) input.people = people;
  busy(el, true);
  try {
    const r = await API('POST', '/api/clients', input);
    upsertLocal(D.clients, r.client);
    if (r.contacts) D.contacts = D.contacts.filter(k => k.client_id !== r.client.id).concat(r.contacts);
    EM.closeModal();
    EM.toast(`<b>${esc(r.client.name)} ${r.created ? 'added' : 'saved'}</b><ul><li>${esc(kindLabel(r.client.kind))} · ${esc(r.client.city)} · ${esc(r.client.ref || '')}</li>${r.created && people.length ? `<li>${people.length} ${people.length === 1 ? 'person' : 'people'} added to the team</li>` : ''}<li>Saved to EGO Master</li></ul>`);
    location.hash = `#/client/${r.client.id}`; EM.rerender();
  } catch (x) { busy(el, false); showErr('cf-err', x.errors || x.message); }
};

/* ---------------------------------------------------------------- client 360 */
const DOC_TYPES = ['GST certificate', 'PAN card', 'Cancelled cheque', 'Agreement', 'Visiting card', 'Shop photo', 'Display photo', 'Quotation', 'Other'];
EM.VIEWS.client = arg => {
  const [id, tab = 'overview'] = arg.split('/'), c = CL()[id];
  if (!c) return `<div class="stack"><h1>Not found</h1><p class="muted">It may have been deleted, or it is outside your view.</p><a class="btn" href="#/people">People</a></div>`;
  const cts = D.contacts.filter(k => k.client_id === id), ops = D.opportunities.filter(o => o.client_id === id), docs = D.documents.filter(d => d.client_id === id);
  const org = ['dealer', 'architect', 'firm'].includes(KINDS[c.kind].group);
  const tabs = [['overview', 'Overview'], ['contacts', `${org ? 'Team' : 'Contacts'} (${cts.length})`], ['opps', `Opportunities (${ops.length})`], ['docs', `Documents (${docs.length})`], ['history', 'History']];
  const body = { overview: clientOverview, contacts: clientContacts, opps: clientOpps, docs: clientDocs, history: () => '<div id="hist"><p class="muted">Loading the history…</p></div>' }[tab] || clientOverview;
  const home = homeOf(c);
  return `<div class="stack">${crumbs(home, [c.name])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(c.name)}</h1>
      <div class="row"><span class="badge info plain">${esc(kindLabel(c.kind))}</span>${c.grade || (c.extra || {}).rating ? `<span class="badge plain">Rating ${esc(c.grade || c.extra.rating)}</span>` : ''}${KINDS[c.kind].division === 'both' ? `<span class="badge plain">${esc(c.division === 'both' ? 'Both companies' : DIVS[c.division].co)}</span>` : ''}<span class="badge plain">${esc(c.status || 'Active')}</span><span class="small muted">${esc(c.ref || '')}</span></div>
      <p class="muted">${esc(fmtMobile(c.mobile))} · ${esc(c.city)}${c.region ? ', ' + esc(c.region) : ''} · owner ${esc(staffName(c.owner_id))}</p></div>
      <div class="row"><button class="btn" data-act="client-edit" data-id="${id}">Edit</button><button class="btn primary" data-act="opp-add" data-client="${id}">+ Opportunity</button>${isOwner() ? `<button class="btn ghost" data-act="client-del" data-id="${id}">Delete</button>` : ''}</div></div>
    ${subtabs(`#/client/${id}`, tab, tabs)}
    ${body(c, cts, ops, docs)}</div>`;
};
const homeOf = c => DEALER_KINDS.includes(c.kind) ? ['Dealers', '#/dealers'] : ARCH_KINDS.includes(c.kind) ? ['Architects', '#/architects'] : ['People', '#/people'];
/* the menu highlights the portal the record belongs to */
Object.defineProperty(EM.VIEWS.client, 'tab', { get() { const c = CL()[(location.hash.split('/')[2] || '')]; return c ? homeOf(c)[1].slice(2) : 'people'; } });
EM.VIEWS.client.title = a => (CL()[a.split('/')[0]] || { name: 'Client' }).name;
EM.VIEWS.client.after = arg => { const [id, tab] = arg.split('/'); if (tab === 'history') loadHistory(id); };

function clientOverview(c) {
  const v = { ...c, ...c.extra }, fields = showFields(fieldsFor(c.kind)).filter(f => f.key !== 'kind');
  const sections = [...new Set(fields.map(f => f.section))];
  const kids = D.clients.filter(x => x.parent_id === c.id || x.firm_id === c.id || x.architect_id === c.id);
  return `<div class="grid g2">${sections.map(s => `<section class="card stack-s"><h3>${esc(s)}</h3>${kv(fields.filter(f => f.section === s).map(f => [esc(f.label), showVal(f, v[f.key])]))}</section>`).join('')}
    ${['dealer', 'architect', 'firm'].includes(KINDS[c.kind].group) ? businessCard(c) : ''}
    ${KINDS[c.kind].group === 'dealer' ? `<section class="card stack-s"><h3>Sales, outstanding and orders</h3><span class="badge warn">Not connected yet</span><p class="small muted">These come from Tally invoices once Tally is connected. Nothing is shown until then, so no figure here is ever typed or estimated.</p></section>` : ''}
    ${kids.length ? `<section class="card stack-s"><h3>Linked to ${esc(c.name)}</h3>${table(['Name', 'Type', 'City'], kids.map(x => ({ href: `#/client/${x.id}`, cells: [esc(x.name), esc(kindLabel(x.kind)), esc(x.city)] })))}</section>` : ''}
    ${c.prices_hidden ? '<p class="small muted">Money fields are hidden for your role.</p>' : ''}</div>`;
}
/* what this company brings, counted only from saved opportunities */
function businessCard(c) {
  const ops = D.opportunities.filter(o => o.client_id === c.id), won = ops.filter(o => o.stage === 'Won'), open = ops.filter(o => !['Won', 'Lost'].includes(o.stage));
  const sum = a => a.reduce((t, o) => t + (Number(o.value) || 0), 0);
  const by = {};
  for (const o of won) { const k = o.contact_id || ''; by[k] = (by[k] || 0) + (Number(o.value) || 0); }
  const who = Object.entries(by).filter(([k]) => k).map(([k, v]) => [esc((D.contacts.find(x => x.id === k) || { name: 'Removed' }).name), D.access.prices ? money(v) : '']);
  return `<section class="card stack-s"><h3>Business from ${esc(c.name)}</h3>
    ${kv([['Team', String(D.contacts.filter(k => k.client_id === c.id).length)], ['Open opportunities', String(open.length) + (D.access.prices && open.length ? ` · ${money(sum(open))}` : '')], ['Won', String(won.length) + (D.access.prices && won.length ? ` · ${money(sum(won))}` : '')]])}
    ${who.length ? `<div class="small muted">Won business by the person who brought it</div>${kv(who)}` : ''}
    <p class="small muted">Counted from opportunities saved here. Invoice revenue arrives when Tally is connected.</p></section>`;
}
function clientContacts(c, cts) {
  return `<div class="stack-s"><div class="row between"><p class="muted">The people at ${esc(c.name)}, their role and what they handle. Mark one as the main person to talk to.</p><button class="btn primary" data-act="contact-add" data-client="${c.id}">+ Add person</button></div>
    ${cts.length ? table(['Name', 'Role', 'Responsibilities', 'Mobile', 'WhatsApp', 'Email', 'Main', ''], cts.sort((a, b) => b.is_primary - a.is_primary).map(k => [`<b>${esc(k.name)}</b>`, esc(k.designation || ''), esc(k.responsibilities || ''), esc(fmtMobile(k.mobile)), esc(fmtMobile(k.whatsapp)), esc(k.email || ''), k.is_primary ? '<span class="badge ok">Main</span>' : '',
      `<button class="btn sm ghost" data-act="contact-edit" data-id="${k.id}">Edit</button><button class="btn sm ghost" data-act="contact-del" data-id="${k.id}">Remove</button>`]))
    : empty('No contacts yet', 'Add the owner, the purchase person, accounts and anyone else you deal with.')}</div>`;
}
function clientOpps(c, cts, ops) {
  return `<div class="stack-s"><div class="row between"><p class="muted">Opportunities with ${esc(c.name)}.</p><button class="btn primary" data-act="opp-add" data-client="${c.id}">+ Add opportunity</button></div>
    ${ops.length ? oppTable(ops) : empty('No opportunities yet', 'Add one when there is a real chance of business.')}</div>`;
}
const oppTable = ops => table(['Opportunity', 'Pipeline', 'Stage', ...(D.access.prices ? ['Value'] : []), 'Owner', 'Next action'], ops.map(o => ({ href: `#/opp/${o.id}`,
  cells: [`<b>${esc(o.title)}</b><div class="small muted">${esc(o.ref || '')}</div>`, esc(PIPELINES[o.pipeline].label), stageBadge(o.stage), ...(D.access.prices ? [money(o.value)] : []), esc(staffName(o.owner_id)), o.next_date ? `${esc(o.next_action || '')} · ${ds(o.next_date)}` : esc(o.next_action || '')] })));
const stageBadge = s => `<span class="badge ${s === 'Won' ? 'ok' : s === 'Lost' ? 'bad' : 'info'}">${esc(s)}</span>`;
function clientDocs(c, cts, ops, docs) {
  return `<div class="stack-s"><form id="df" class="card stack-s" onsubmit="return false"><h3>Add a document</h3><div class="fgrid">
      <div class="field"><label for="df-type">What it is</label><select class="input" id="df-type" name="type">${DOC_TYPES.map(t => `<option>${t}</option>`).join('')}</select></div>
      <div class="field"><label for="df-name">Name (optional)</label><input class="input" id="df-name" name="name" placeholder="e.g. GST certificate 2026"></div>
      <div class="field span2"><label for="df-file">File (up to 25 MB)</label><input class="input" id="df-file" name="file" type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"></div></div>
      ${errBox('df-err')}<div class="row"><button class="btn primary" data-act="doc-up" data-client="${c.id}">Upload</button></div></form>
    ${docs.length ? table(['Document', 'Type', 'Size', 'Added', ''], docs.map(d => [`<b>${esc(d.name)}</b>`, esc(d.type), `${Math.max(1, Math.round(d.size / 1024))} KB`, `${ds(d.created_at)} · ${esc(staffName(d.uploaded_by))}`,
      `<button class="btn sm ghost" data-act="doc-open" data-id="${d.id}">Open</button><button class="btn sm ghost" data-act="doc-del" data-id="${d.id}">Remove</button>`])) : empty('No documents yet', 'GST certificate, cheque, agreement, shop and display photos go here.')}</div>`;
}
async function loadHistory(id) {
  try {
    const r = await API('GET', '/api/audit?client=' + encodeURIComponent(id));
    const el = qs('#hist'); if (!el) return;
    el.innerHTML = r.audit.length ? table(['When', 'Who', 'What'], r.audit.map(a => [`${ds(a.at)} ${tFmt(a.at)}`, esc(a.by_name || ''), esc(a.summary) + (a.diff && Object.keys(a.diff).length ? `<div class="small muted">${Object.keys(a.diff).map(k => esc(k.replace(/_id$/, '').replace(/_/g, ' '))).join(', ')} changed</div>` : '')])) : '<p class="muted">No history yet.</p>';
  } catch (x) { const el = qs('#hist'); if (el) el.innerHTML = `<p class="err">${esc(x.message)}</p>`; }
}
EM.ACTIONS['client-del'] = el => {
  const c = CL()[el.dataset.id];
  EM.modal(`<h2>Delete ${esc(c.name)}?</h2><p class="muted">Its contacts, opportunities and documents are deleted with it. This cannot be undone.</p>${errBox('del-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="client-del-go" data-id="${c.id}">Delete</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['client-del-go'] = async el => {
  const id = el.dataset.id; busy(el, true);
  try {
    await API('DELETE', '/api/clients/' + id);
    D.clients = D.clients.filter(c => c.id !== id); D.contacts = D.contacts.filter(k => k.client_id !== id);
    const gone = new Set(D.opportunities.filter(o => o.client_id === id).map(o => o.id));
    D.opportunities = D.opportunities.filter(o => !gone.has(o.id)); D.history = D.history.filter(h => !gone.has(h.opp_id)); D.documents = D.documents.filter(d => d.client_id !== id);
    EM.closeModal(); EM.toast('Deleted.'); location.hash = '#/people';
  } catch (x) { busy(el, false); showErr('del-err', x.message); }
};

/* ---------------------------------------------------------------- contacts */
function openContactForm(clientId, k) {
  EM.modal(`<h2>${k ? 'Edit ' + esc(k.name) : 'Add a person'}</h2><p class="muted small">At ${esc(CL()[clientId].name)}</p>
    <form id="kf" class="stack" onsubmit="return false" style="margin-top:14px"><div class="fgrid">${CONTACT_FIELDS.map(f => fieldHtml(f, k ? k[f.key] : '', 'kf')).join('')}</div>
    ${errBox('kf-err')}<div class="row"><button class="btn primary" data-act="contact-save" data-client="${clientId}" data-id="${k ? k.id : ''}">${k ? 'Save' : 'Add contact'}</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
EM.ACTIONS['contact-add'] = el => openContactForm(el.dataset.client);
EM.ACTIONS['contact-edit'] = el => { const k = D.contacts.find(x => x.id === el.dataset.id); openContactForm(k.client_id, k); };
EM.ACTIONS['contact-save'] = async el => {
  const input = readForm(qs('#kf'), CONTACT_FIELDS);
  const { errors } = cleanContact(input, ctxLocal());
  if (errors.length) return showErr('kf-err', errors);
  Object.assign(input, { client_id: el.dataset.client }, el.dataset.id ? { id: el.dataset.id } : {});
  busy(el, true);
  try {
    const r = await API('POST', '/api/contacts', input);
    D.contacts = D.contacts.filter(k => k.client_id !== el.dataset.client).concat(r.contacts);
    EM.closeModal(); EM.toast(`<b>${esc(input.name)}</b> saved.`); location.hash = `#/client/${el.dataset.client}/contacts`; EM.rerender();
  } catch (x) { busy(el, false); showErr('kf-err', x.errors || x.message); }
};
EM.ACTIONS['contact-del'] = async el => {
  const k = D.contacts.find(x => x.id === el.dataset.id);
  if (!confirm(`Remove ${k.name} from ${CL()[k.client_id] ? CL()[k.client_id].name : 'here'}?`)) return;
  try { await API('DELETE', '/api/contacts/' + k.id); D.contacts = D.contacts.filter(x => x.id !== k.id); D.opportunities.forEach(o => { if (o.contact_id === k.id) o.contact_id = ''; }); EM.toast(`${esc(k.name)} removed.`); EM.rerender(); } catch (x) { EM.toast(esc(x.message)); }
};

/* ---------------------------------------------------------------- documents */
EM.ACTIONS['doc-up'] = async el => {
  const f = qs('#df-file').files[0];
  if (!f) return showErr('df-err', 'Choose a file first.');
  if (f.size > 25 * 1024 * 1024) return showErr('df-err', 'That file is over 25 MB.');
  const fd = new FormData(); fd.append('file', f); fd.append('client_id', el.dataset.client); fd.append('type', qs('#df-type').value); fd.append('name', qs('#df-name').value);
  busy(el, true);
  try { const r = await API('POST', '/api/documents', fd, true); D.documents.push(r.document); EM.toast(`<b>${esc(r.document.name)}</b> uploaded.`); EM.rerender(); } catch (x) { busy(el, false); showErr('df-err', x.message); }
};
EM.ACTIONS['doc-open'] = async el => {
  const w = window.open('', '_blank');
  try {
    let tok = ''; try { tok = localStorage.getItem('ego-live-token') || ''; } catch (e) { tok = window.__egoTok || ''; }
    const res = await fetch(window.EGOAPI.file(el.dataset.id), { headers: { authorization: 'Bearer ' + tok } });
    if (!res.ok) throw new Error('Could not open it.');
    const url = URL.createObjectURL(await res.blob());
    if (w) w.location = url; else location.href = url;
  } catch (x) { if (w) w.close(); EM.toast(esc(x.message)); }
};
EM.ACTIONS['doc-del'] = async el => {
  const d = D.documents.find(x => x.id === el.dataset.id);
  if (!confirm(`Remove ${d.name}?`)) return;
  try { await API('DELETE', '/api/documents/' + d.id); D.documents = D.documents.filter(x => x.id !== d.id); EM.rerender(); } catch (x) { EM.toast(esc(x.message)); }
};

/* ---------------------------------------------------------------- opportunities */
const pipesAllowed = () => Object.keys(PIPELINES).filter(p => canDiv(PIPELINES[p].division) && (EM.div === 'both' || PIPELINES[p].division === EM.div));
EM.oppMine = false;
EM.VIEWS.opps = arg => {
  const ps = pipesAllowed();
  if (!ps.length) return EM.noAccess('No pipeline is open to your role.');
  const p = ps.includes(arg) ? arg : ps[0];
  const all = D.opportunities.filter(o => o.pipeline === p && (!EM.oppMine || o.owner_id === me().id));
  const stages = [...(D.lists.stages[p] || [])];
  for (const o of all) if (!stages.includes(o.stage)) stages.push(o.stage);   // a stage the Owner has since removed still shows
  const t = today();
  const card = o => `<div class="mini" data-href="#/opp/${o.id}" tabindex="0"><b>${esc(o.title)}</b><div class="small muted">${esc((CL()[o.client_id] || {}).name || '')}</div>
    <div class="small">${D.access.prices && o.value != null ? money(o.value) + ' · ' : ''}${esc(staffName(o.owner_id))}</div>${o.next_date ? `<div class="small ${o.next_date < t && !['Won', 'Lost'].includes(o.stage) ? 'err' : 'muted'}">${esc(o.next_action || 'Next action')} · ${ds(o.next_date)}</div>` : ''}</div>`;
  return `<div class="stack">
    <div class="row between"><div class="stack-s"><div class="kicker">Each one linked to a dealer, an architect firm or a person</div><h1>Opportunities</h1><p class="muted">${all.length} ${esc(PIPELINES[p].plural.toLowerCase())} · ${esc(scopeLabel())}</p></div>
      <div class="row"><label class="chip" style="padding:8px 10px"><input type="checkbox" id="opp-mine" ${EM.oppMine ? 'checked' : ''}> Only mine</label><button class="btn primary" data-act="opp-add" data-pipeline="${p}">+ Add opportunity</button></div></div>
    ${subtabs('#/opps', p, ps.map(k => [k, `${PIPELINES[k].plural} <span class="muted">${D.opportunities.filter(o => o.pipeline === k).length}</span>`]))}
    ${all.length ? `<div class="board">${stages.map(s => { const ls = all.filter(o => o.stage === s); return `<div class="lane"><h4><span>${esc(s)}</span><span class="muted">${ls.length}</span></h4>${D.access.prices && ls.some(o => o.value) ? `<div class="small muted">${inr(ls.reduce((a, o) => a + (Number(o.value) || 0), 0))}</div>` : ''}${ls.map(card).join('')}</div>`; }).join('')}</div>`
      : empty(`No ${esc(PIPELINES[p].plural.toLowerCase())} yet`, 'Add one from here, or from a dealer, an architect firm or a person.', `<button class="btn primary" data-act="opp-add" data-pipeline="${p}">+ Add opportunity</button>`)}</div>`;
};
EM.VIEWS.opps.title = () => 'Opportunities';
document.addEventListener('change', e => { if (e.target.id === 'opp-mine') { EM.oppMine = e.target.checked; EM.rerender(); } });

EM.VIEWS.opp = id => {
  const o = D.opportunities.find(x => x.id === id);
  if (!o) return `<div class="stack"><h1>Opportunity not found</h1><a class="btn" href="#/opps">Opportunities</a></div>`;
  const c = CL()[o.client_id] || { name: 'Client outside your view' }, v = { ...o, ...o.extra };
  const stages = D.lists.stages[o.pipeline] || [], hist = D.history.filter(h => h.opp_id === id);
  const at = stages.indexOf(o.stage);
  const fields = showFields(OPP_FIELDS).filter(f => !['pipeline', 'title', 'stage', 'contact_id'].includes(f.key) && (f.key !== 'lost_reason' || o.stage === 'Lost'));
  const contact = D.contacts.find(k => k.id === o.contact_id);
  return `<div class="stack">${crumbs(['Opportunities', `#/opps/${o.pipeline}`], [o.title])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(o.title)}</h1>
      <div class="row"><span class="badge info plain">${esc(PIPELINES[o.pipeline].label)}</span>${stageBadge(o.stage)}<span class="small muted">${esc(o.ref || '')}</span></div>
      <p class="muted"><a href="#/client/${o.client_id}">${esc(c.name)}</a>${contact ? ` · ${esc(contact.name)} ${esc(fmtMobile(contact.mobile))}` : ''}</p></div>
      <div class="row"><button class="btn" data-act="opp-edit" data-id="${id}">Edit</button>${isOwner() ? `<button class="btn ghost" data-act="opp-del" data-id="${id}">Delete</button>` : ''}</div></div>
    <section class="card stack-s"><h3>Stage</h3><div class="flow">${stages.map((s, i) => `<span class="${s === o.stage ? 'cur' : i < at && o.stage !== 'Lost' ? 'done' : ''}">${esc(s)}</span>`).join('<i>›</i>')}</div>
      <div class="row"><select class="input" id="move-stage" aria-label="Move to stage" style="width:auto">${stages.map(s => `<option ${s === o.stage ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><button class="btn primary" data-act="opp-move" data-id="${id}">Move stage</button></div></section>
    <div class="grid g2"><section class="card stack-s"><h3>Details</h3>${kv(fields.map(f => [esc(f.label), showVal(f, v[f.key])]))}</section>
      <section class="card stack-s"><h3>Stage history</h3>${hist.length ? `<div class="timeline">${hist.map(h => `<div class="on"><b>${esc(h.to_stage)}</b>${h.from_stage ? ` <span class="small muted">from ${esc(h.from_stage)}</span>` : ''}<div class="small muted">${ds(h.at)} ${tFmt(h.at)} · ${esc(staffName(h.by_staff))}${h.note ? ' · ' + esc(h.note) : ''}</div></div>`).join('')}</div>` : '<p class="muted">No moves yet.</p>'}</section></div></div>`;
};
EM.VIEWS.opp.tab = 'opps';
EM.VIEWS.opp.title = id => (D.opportunities.find(x => x.id === id) || { title: 'Opportunity' }).title;

function openOppForm(o, keep) {
  const v = keep || (o ? { ...o, ...o.extra } : { owner_id: me().id });
  const clients = D.clients.filter(c => PIPES_FOR[KINDS[c.kind].group].some(p => pipesAllowed().includes(p))).sort((a, b) => a.name.localeCompare(b.name));
  if (!clients.length) return EM.modal(`<h2>Add an opportunity</h2><p class="muted">An opportunity belongs to a dealer, an architect firm or a person. Add one first.</p><div class="row" style="margin-top:14px">${addButtons()}<button class="btn" data-act="close-modal">Cancel</button></div>`);
  const client = CL()[v.client_id] || clients[0];
  const pipes = PIPES_FOR[KINDS[client.kind].group].filter(p => pipesAllowed().includes(p) || (o && o.pipeline === p));
  const pipeline = pipes.includes(v.pipeline) ? v.pipeline : pipes[0];
  const stages = D.lists.stages[pipeline] || [];
  if (!stages.includes(v.stage)) v.stage = stages[0];
  const fields = showFields(OPP_FIELDS).filter(f => f.key !== 'pipeline');
  EM.modal(`<h2>${o ? 'Edit opportunity' : 'Add an opportunity'}</h2>
    <form id="of" class="stack" onsubmit="return false" style="margin-top:14px" data-id="${o ? o.id : ''}"><div class="fgrid">
      ${o ? `<div class="field"><label>Client</label><input class="input" value="${esc(client.name)}" disabled><input type="hidden" name="client_id" value="${client.id}"></div>`
    : `<div class="field"><label for="of-client_id">Client *</label><select class="input" id="of-client_id" name="client_id" data-opp-redraw>${clients.map(c => `<option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>${esc(c.name)} · ${esc(kindLabel(c.kind))}</option>`).join('')}</select></div>`}
      ${G.select(OPP_FIELDS[0], pipeline, 'of', pipes.map(p => [p, PIPELINES[p].label]), false).replace('<select', '<select data-opp-redraw')}
      ${fields.map(f => fieldHtml(f, v[f.key], 'of', { pipeline, client: client.id })).join('')}</div>
      ${errBox('of-err')}<div class="row sticky-actions"><button class="btn primary" data-act="opp-save">${o ? 'Save changes' : 'Add opportunity'}</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
document.addEventListener('change', e => {
  if (!e.target.matches('[data-opp-redraw]')) return;
  const form = qs('#of'), o = form.dataset.id ? D.opportunities.find(x => x.id === form.dataset.id) : null;
  const keep = withDials(readForm(form, OPP_FIELDS), OPP_FIELDS);
  keep.client_id = form.querySelector('[name=client_id]').value;
  if (e.target.name === 'client_id') { keep.pipeline = ''; keep.contact_id = ''; }
  openOppForm(o, keep);
});
EM.ACTIONS['opp-add'] = el => openOppForm(null, el.dataset.client || el.dataset.pipeline ? { owner_id: me().id, client_id: el.dataset.client, pipeline: el.dataset.pipeline } : null);
EM.ACTIONS['opp-edit'] = el => openOppForm(D.opportunities.find(x => x.id === el.dataset.id));
async function saveOpp(input, el, errId) {
  const { errors } = cleanOpp(input, ctxLocal());
  if (errors.length) { showErr(errId, errors); return null; }
  busy(el, true);
  try {
    const r = await API('POST', '/api/opportunities', input);
    upsertLocal(D.opportunities, r.opportunity);
    D.history = D.history.filter(h => h.opp_id !== r.opportunity.id).concat(r.history);
    return r;
  } catch (x) { busy(el, false); showErr(errId, x.errors || x.message); return null; }
}
EM.ACTIONS['opp-save'] = async el => {
  const form = qs('#of'), input = readForm(form, OPP_FIELDS);
  input.client_id = form.querySelector('[name=client_id]').value;
  if (form.dataset.id) input.id = form.dataset.id;
  const r = await saveOpp(input, el, 'of-err');
  if (!r) return;
  EM.closeModal(); EM.toast(`<b>${esc(r.opportunity.title)}</b> ${r.created ? 'added' : 'saved'} · ${esc(r.opportunity.stage)}`);
  location.hash = `#/opp/${r.opportunity.id}`; EM.rerender();
};
const oppInput = o => ({ ...o.extra, id: o.id, client_id: o.client_id, pipeline: o.pipeline, title: o.title, stage: o.stage, value: o.value ?? '', owner_id: o.owner_id, contact_id: o.contact_id, source: o.source, next_action: o.next_action, next_date: o.next_date, lost_reason: o.lost_reason });
EM.ACTIONS['opp-move'] = async el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id), to = qs('#move-stage').value;
  if (to === o.stage) return;
  if (to === 'Lost') return EM.modal(`<h2>Why was it lost?</h2><p class="muted">A lost reason is compulsory.</p><div class="field" style="margin-top:12px"><label for="lost-pick">Lost reason *</label><select class="input" id="lost-pick"><option value="">Choose</option>${D.lists.lost_reasons.map(r => `<option>${esc(r)}</option>`).join('')}</select></div>${errBox('lost-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="opp-lost" data-id="${o.id}">Mark as lost</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
  const r = await saveOpp({ ...oppInput(o), stage: to }, el, 'move-err');
  if (r) { EM.toast(`Moved to <b>${esc(to)}</b>.`); EM.rerender(); } else EM.toast('Could not move it. ' + esc((qs('#move-err') || {}).textContent || ''));
};
EM.ACTIONS['opp-lost'] = async el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id), why = qs('#lost-pick').value;
  if (!why) return showErr('lost-err', 'Choose the reason.');
  const r = await saveOpp({ ...oppInput(o), stage: 'Lost', lost_reason: why }, el, 'lost-err');
  if (r) { EM.closeModal(); EM.toast('Marked as lost: ' + esc(why)); EM.rerender(); }
};
EM.ACTIONS['opp-del'] = async el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id);
  if (!confirm(`Delete ${o.title}? Its stage history goes with it.`)) return;
  try { await API('DELETE', '/api/opportunities/' + o.id); D.opportunities = D.opportunities.filter(x => x.id !== o.id); D.history = D.history.filter(h => h.opp_id !== o.id); location.hash = '#/opps/' + o.pipeline; } catch (x) { EM.toast(esc(x.message)); }
};

/* ---------------------------------------------------------------- import from Excel
   Two templates, one per company. Each company's card downloads its own file and
   uploads only that file; the server refuses the other company's file too. */
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const IMP = { tpl: null, file: null, rows: [], results: null, done: null, error: '' };
/* both files always side by side for anyone who works in both companies, whatever the top switch says */
const tplsHere = () => Object.values(TEMPLATES).filter(t => canDiv(t.division));
const SHEET_NOTE = {
  dealers: 'Each dealer, distributor and sub-dealer company: where it is, the areas it covers, its rating, then the rest.',
  dealer_people: 'Everyone who works at those companies: role, what they handle, name, mobile, email.',
  architects: 'Each architect firm, or solo architect: where it is, its rating, then the rest.',
  architect_people: 'Everyone who works at those firms: role, what they handle, name, mobile, email.',
  clients: 'People with no company: individuals, or a firm on its own.',
  ego_lists: 'Your own product categories and warehouses, for the stock module that comes next.',
};
EM.VIEWS.import = () => {
  const r = IMP.results, cnt = s => r ? r.filter(x => x.status === s).length : 0;
  const shown = r ? (IMP.errorsOnly ? r.filter(x => x.status === 'error') : r) : [];
  const ts = tplsHere();
  return `<div class="stack">
    <div class="stack-s"><div class="kicker">Bulk upload</div><h1>Import from Excel</h1><p class="muted" style="max-width:760px">EGO Premium and Big E each have their own file. Download the file for your company, fill it, and upload it in the same card. Nothing is saved until you have seen every row: each one shows as <b>new</b>, <b>update</b> (already saved) or <b>error</b> with the reason. Uploading the same file again only updates.</p></div>
    <div class="grid g2">${ts.map(t => `<section class="card stack-s" data-template="${t.id}"><div class="kicker">${esc(t.division === 'wholesale' ? 'Wholesale' : 'Retail')}</div><h3>${esc(t.company)} file</h3>
      <ol class="small" style="margin:0;padding-left:18px">${t.sheets.map(sh => `<li><b>${esc(sh.sheet)}</b>: ${esc(SHEET_NOTE[sh.id])}</li>`).join('')}</ol>
      <p class="small muted">Compulsory columns end with a star. The grey EXAMPLE rows are skipped.</p>
      <a class="btn" href="${t.file}" download>1. Download the ${esc(t.company)} file</a>
      <label class="field"><span class="small muted">2. Upload the filled ${esc(t.company)} file</span><input class="input" type="file" id="imp-file-${t.id}" data-imp="${t.id}" accept=".xlsx,.xls"></label>
      ${IMP.tpl === t.id && IMP.file ? `<p class="small muted">Read: ${esc(IMP.file)}</p>` : ''}</section>`).join('')}</div>
    ${IMP.error ? `<div class="callout warn">${esc(IMP.error)}</div>` : ''}
    ${IMP.done ? `<div class="callout ok"><b>Import finished.</b> ${IMP.done.added} added · ${IMP.done.updated} updated · ${IMP.done.skipped} skipped with errors.</div>` : ''}
    ${r ? `<section class="stack-s"><h3>3. Check, then save the ${esc(TEMPLATES[IMP.tpl].company)} file</h3><div class="grid g4">${tile('New', cnt('new'))}${tile('Update', cnt('update'))}${tile('Error', cnt('error'), cnt('error') ? 'skipped when you save' : '')}${tile('Rows read', r.length)}</div>
      <div class="row"><button class="btn primary" data-act="imp-save" ${cnt('new') + cnt('update') && !IMP.done ? '' : 'disabled'}>Save ${cnt('new') + cnt('update')} rows</button><label class="chip" style="padding:8px 10px"><input type="checkbox" id="imp-errs" ${IMP.errorsOnly ? 'checked' : ''}> Show errors only</label></div>
      <div id="imp-prog" class="small muted"></div>
      ${table(['Sheet', 'Row', 'Name', 'Result', 'Reason'], shown.slice(0, 500).map(x => [esc(x.sheetName), x.row, esc(x.name || ''), `<span class="badge ${x.status === 'new' ? 'ok' : x.status === 'update' ? 'info' : 'bad'}" data-status="${x.status}">${x.status}</span>`, esc(x.reason || x.note || '')]))}
      ${shown.length > 500 ? `<p class="small muted">Showing 500 of ${shown.length}.</p>` : ''}</section>` : ''}</div>`;
};
EM.VIEWS.import.title = () => 'Import from Excel';
document.addEventListener('change', async e => {
  if (e.target.id === 'imp-errs') { IMP.errorsOnly = e.target.checked; EM.rerender(); return; }
  if (!e.target.dataset.imp || !e.target.files[0]) return;
  const f = e.target.files[0];
  Object.assign(IMP, { tpl: e.target.dataset.imp, file: f.name, rows: [], results: null, done: null, error: '' });
  EM.toast('Reading ' + esc(f.name) + '…');
  try { await readWorkbook(f, TEMPLATES[IMP.tpl]); await preview(); } catch (x) { IMP.error = x.message; }
  EM.rerender();
});
const loadScript = src => new Promise((ok, bad) => { if (window.XLSX) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => bad(new Error('Could not load the Excel reader. Check the internet connection.')); document.head.appendChild(s); });
async function readWorkbook(file, tpl) {
  await loadScript(XLSX_URL);
  const wb = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const how = wb.Sheets['How to fill'], ver = how && how.B1 ? String(how.B1.v).trim() : '';
  if (!ver) throw new Error(`This is not an EGO Master file (the How to fill sheet is missing). Download the ${tpl.company} file and copy your rows into it.`);
  if (ver !== tpl.version) {
    const other = Object.values(TEMPLATES).find(t => t.version === ver);
    throw new Error(other ? `This is the ${other.company} file. Upload it under ${other.company}, not ${tpl.company}.` : `This file is an old template (${ver}). Download the ${tpl.company} file and copy your rows into it.`);
  }
  IMP.version = ver;
  const rows = [];
  for (const t of tpl.sheets) {
    const ws = wb.Sheets[t.sheet];
    if (!ws) continue;
    const grid = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
    if (!grid.length) continue;
    const cols = templateColumns(t), byH = new Map(cols.map(c => [normHeader(c.header), c]));
    const map = grid[0].map(h => { if (normHeader(h) === '') return null; const c = byH.get(normHeader(h)); if (!c) throw new Error(`${t.sheet}: the column "${h}" is not in the template. Do not rename or add columns.`); return c; });
    const missing = cols.filter(c => c.req && !map.includes(c));
    if (missing.length) throw new Error(`${t.sheet}: the compulsory column "${missing[0].header}" is missing.`);
    let group = [];
    grid.slice(1).forEach((line, i) => {
      if (line.every(x => String(x).trim() === '')) return;
      const data = {};
      map.forEach((c, j) => { if (c) data[c.key] = line[j]; });
      const name = String(data.name || data.category || data.wh_name || '').trim();
      if (name.toUpperCase().startsWith(EXAMPLE_MARK)) return;
      if (t.tab === 'clients' && t.kinds.length === 1) data.kind = t.kinds[0];
      group.push({ tab: t.tab, sheet: t.id, sheetName: t.sheet, row: i + 2, data, name });
    });
    /* parents before children, so a sub-dealer's distributor already exists when it is saved */
    const rank = { distributor: 0, design_firm: 0, dealer: 1, architect: 1, sub_dealer: 2 };
    const kindOf = d => KINDS[d.kind] ? d.kind : KIND_BY_LABEL[String(d.kind || '').trim().toLowerCase()];
    if (t.tab === 'clients') group = group.map((g, i) => [g, i]).sort((a, b) => ((rank[kindOf(a[0].data)] ?? 1) - (rank[kindOf(b[0].data)] ?? 1)) || a[1] - b[1]).map(x => x[0]);
    rows.push(...group);
  }
  if (!rows.length) throw new Error('No rows to import. Fill rows under the headers (the example rows are skipped).');
  /* the same company or person twice in one file: the second is an error, not a silent update */
  const seen = new Map();
  for (const r of rows) {
    const keys = r.tab === 'clients' ? [normMobile(r.data.mobile).value, normGst(r.data.gst)].filter(Boolean).map(k => 'c:' + k)
      : r.tab === 'contacts' ? ['k:' + String(r.data.client_key).trim().toLowerCase() + '|' + (normMobile(r.data.mobile).value || '')] : [];
    for (const k of keys) { if (seen.has(k)) { r.local = `same as ${seen.get(k).sheetName} row ${seen.get(k).row} in this file`; break; } }
    if (!r.local) keys.forEach(k => seen.set(k, r));
  }
  IMP.rows = rows;
}
/* companies this file creates, by mobile, GST and name, so their people preview cleanly */
const pendingKeys = () => {
  const o = {};
  IMP.rows.filter(r => r.tab === 'clients' && !r.local).forEach(r => {
    const kind = String(r.data.kind || '');
    [normMobile(r.data.mobile).value, normGst(r.data.gst)].filter(Boolean).forEach(k => { o[k] = kind; });
    if (r.name) o['n:' + r.name.toLowerCase()] = kind;
  });
  return o;
};
async function sendRows(rows, dry, prog) {
  const out = [];
  for (let i = 0; i < rows.length; i += 50) {
    const part = rows.slice(i, i + 50);
    const r = await API('POST', '/api/import', { template: IMP.tpl, version: IMP.version, dry, pending: dry ? pendingKeys() : {}, rows: part.map(x => ({ sheet: x.sheet, row: x.row, data: x.data })) });
    r.results.forEach((res, j) => out.push({ ...res, sheet: part[j].sheet, sheetName: part[j].sheetName, name: res.name || part[j].name }));
    if (prog) prog(Math.min(rows.length, i + 50), rows.length);
  }
  return out;
}
async function preview() {
  const local = IMP.rows.filter(r => r.local).map(r => ({ sheet: r.sheet, sheetName: r.sheetName, row: r.row, name: r.name, status: 'error', reason: r.local }));
  const res = await sendRows(IMP.rows.filter(r => !r.local), true);
  const order = TEMPLATES[IMP.tpl].sheets.map(t => t.id);
  IMP.results = [...res, ...local].sort((a, b) => order.indexOf(a.sheet) - order.indexOf(b.sheet) || a.row - b.row);
}
EM.ACTIONS['imp-save'] = async el => {
  busy(el, true);
  const ok = new Set(IMP.results.filter(r => r.status !== 'error').map(r => r.sheet + '|' + r.row));
  const todo = IMP.rows.filter(r => ok.has(r.sheet + '|' + r.row));
  const prog = (n, of) => { const p = qs('#imp-prog'); if (p) p.textContent = `Saved ${n} of ${of}…`; };
  const done = { added: 0, updated: 0, skipped: IMP.results.length - todo.length };
  try {
    for (const tab of ['clients', 'contacts', 'lists']) {
      const res = await sendRows(todo.filter(r => r.tab === tab), false, prog);
      for (const r of res) { if (r.status === 'new') done.added++; else if (r.status === 'update') done.updated++; else done.skipped++; }
      const failed = res.filter(r => r.status === 'error');
      failed.forEach(f => { const x = IMP.results.find(y => y.sheet === f.sheet && y.row === f.row); if (x) Object.assign(x, { status: 'error', reason: f.reason }); });
    }
    IMP.done = done;
    const fresh = await API('GET', '/api/bootstrap');
    window.EGOLIVE.refresh(fresh);
  } catch (x) { IMP.error = 'Stopped part way: ' + x.message + '. Rows already saved stay saved; upload the same file again to finish (saved rows will show as updates).'; }
  EM.rerender();
};
window.EGOLIVE = { refresh(boot) { Object.assign(D, boot); EM.rerender(); } };

/* ---------------------------------------------------------------- team & access */
const roleName = id => ((D.roles.find(r => r.id === id) || {}).name || id);
const SCOPES = [['all', 'Both companies'], ['division', 'Whole division'], ['region', 'Own region'], ['own', 'Own records'], ['none', 'No business records']];
EM.VIEWS.team = arg => {
  if (!D.access.users) return EM.noAccess('Managing people needs the Manage users permission.');
  const tab = arg === 'roles' ? 'roles' : 'people';
  return `<div class="stack"><div class="row between"><div class="stack-s"><h1>Team &amp; access</h1><p class="muted">${D.staff.filter(s => s.active).length} active logins. Everyone signs in with their own username and password.</p></div>
    ${tab === 'people' ? '<button class="btn primary" data-act="staff-add">+ Add person</button>' : ''}</div>
    ${subtabs('#/team', tab, [['people', 'People'], ['roles', 'Roles & access']])}
    ${tab === 'roles' ? rolesMatrix() : peopleTable()}</div>`;
};
EM.VIEWS.team.title = () => 'Team & access';
const divName = d => d === 'both' ? 'Both' : DIVS[d] ? DIVS[d].name : d;
const peopleTable = () => table(['Name', 'Username', 'Role', 'Division', 'Region', 'Reports to', 'Status', ''], D.staff.slice().sort((a, b) => b.active - a.active || a.name.localeCompare(b.name)).map(s => [`<b>${esc(s.name)}</b><div class="small muted">${esc(fmtMobile(s.mobile))}</div>`, esc(s.login), esc(roleName(s.role)), divName(s.division), esc(s.region || ''), esc(s.reports_to ? staffName(s.reports_to) : ''),
  !s.active ? '<span class="badge plain">Switched off</span>' : s.must_change ? '<span class="badge warn">Temporary password</span>' : '<span class="badge ok">Active</span>',
  s.active ? `<button class="btn sm ghost" data-act="staff-edit" data-id="${s.id}">Edit</button><button class="btn sm ghost" data-act="staff-pass" data-id="${s.id}">New password</button>${s.id !== me().id ? `<button class="btn sm ghost" data-act="staff-off" data-id="${s.id}">Switch off</button>` : ''}` : '']));
function rolesMatrix() {
  const edit = isOwner();
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Role</th><th>Division</th><th>Sees</th><th class="r">Prices</th><th class="r">Cost &amp; GP</th><th class="r">Approve</th><th class="r">Export</th><th class="r">Manage users</th></tr></thead><tbody>
    ${D.roles.map(r => `<tr><td><b>${esc(r.name)}</b><div class="small muted">${D.staff.filter(s => s.role === r.id && s.active).length} people</div></td><td>${divName(r.division)}</td>
      <td><select class="input" data-role="${r.id}|scope" ${!edit || r.id === 'owner' ? 'disabled' : ''} aria-label="What ${esc(r.name)} sees">${SCOPES.map(([k, l]) => `<option value="${k}" ${r.scope === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
      ${['prices', 'cost', 'approve', 'export', 'users'].map(k => `<td class="r"><input type="checkbox" data-role="${r.id}|${k}" ${r[k] ? 'checked' : ''} ${!edit || r.id === 'owner' ? 'disabled' : ''} aria-label="${k} for ${esc(r.name)}"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="small muted">${edit ? 'Changes save at once and apply on the next screen each person opens. The server enforces them: a role that cannot see a record is never sent it.' : 'Only an Owner changes what a role can see.'} Cost &amp; GP and Approve are recorded now and used when orders and approvals go live.</p>`;
}
document.addEventListener('change', async e => {
  const t = e.target.closest('[data-role]');
  if (!t) return;
  const [id, k] = t.dataset.role.split('|'), val = t.type === 'checkbox' ? t.checked : t.value;
  try { await API('POST', '/api/roles/' + id, { [k]: val }); const r = D.roles.find(x => x.id === id); r[k] = val; EM.toast(`${esc(r.name)} updated.`); } catch (x) { EM.toast(esc(x.message)); EM.rerender(); }
});
const genPass = () => { const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const b = crypto.getRandomValues(new Uint8Array(12)); return Array.from(b, x => a[x % a.length]).join(''); };
const STAFF_MOBILE = { key: 'mobile', label: 'Mobile', type: 'mobile' };
function openStaffForm(s) {
  const roles = D.roles.filter(r => isOwner() || !['owner', 'director'].includes(r.id));
  EM.modal(`<h2>${s ? 'Edit ' + esc(s.name) : 'Add a person'}</h2><form id="sf" class="stack" onsubmit="return false" style="margin-top:14px"><div class="fgrid">
    <div class="field"><label for="sf-name">Full name *</label><input class="input" id="sf-name" name="name" value="${esc(s ? s.name : '')}"></div>
    ${s ? '' : `<div class="field"><label for="sf-login">Username *</label><input class="input" id="sf-login" name="login" autocapitalize="none" placeholder="e.g. priya.sales"></div>
    <div class="field"><label for="sf-pass">Temporary password *</label><div class="mob"><input class="input" id="sf-pass" name="password" value="${genPass()}"><button class="btn sm" type="button" data-act="staff-gen">New</button></div><span class="small muted">They choose their own at first sign-in.</span></div>`}
    <div class="field"><label for="sf-role">Role *</label><select class="input" id="sf-role" name="role">${roles.map(r => `<option value="${r.id}" ${s && s.role === r.id ? 'selected' : ''}>${esc(r.name)} · ${divName(r.division)}</option>`).join('')}</select></div>
    <div class="field"><label for="sf-region">Region (for regional roles)</label><select class="input" id="sf-region" name="region"><option value="">None</option>${REGIONS.map(x => `<option ${s && s.region === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    ${fieldHtml(STAFF_MOBILE, s ? s.mobile : '', 'sf')}
    <div class="field"><label for="sf-email">Email</label><input class="input" id="sf-email" name="email" type="email" value="${esc(s ? s.email : '')}"></div>
    <div class="field"><label for="sf-rep">Reports to</label><select class="input" id="sf-rep" name="reports_to"><option value="">Nobody</option>${D.staff.filter(x => x.active && (!s || x.id !== s.id)).map(x => `<option value="${x.id}" ${s && s.reports_to === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div></div>
    ${errBox('sf-err')}<div class="row"><button class="btn primary" data-act="staff-save" data-id="${s ? s.id : ''}">${s ? 'Save' : 'Add person'}</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
EM.ACTIONS['staff-gen'] = () => { qs('#sf-pass').value = genPass(); };
EM.ACTIONS['staff-add'] = () => openStaffForm(null);
EM.ACTIONS['staff-edit'] = el => openStaffForm(D.staff.find(s => s.id === el.dataset.id));
EM.ACTIONS['staff-save'] = async el => {
  const fd = new FormData(qs('#sf')), b = Object.fromEntries(fd.entries());
  if (el.dataset.id) b.id = el.dataset.id;
  b.mobile_dial = fd.get('mobile_dial');
  busy(el, true);
  try {
    await API('POST', '/api/staff', b);
    const fresh = await API('GET', '/api/bootstrap'); Object.assign(D, fresh);
    EM.closeModal();
    EM.toast(b.id ? `<b>${esc(b.name)}</b> saved.` : `<b>${esc(b.name)}</b> added.<ul><li>Username: ${esc(b.login)}</li><li>Give them the temporary password yourself. They choose their own at first sign-in.</li></ul>`, 9000);
    EM.rerender();
  } catch (x) { busy(el, false); showErr('sf-err', x.message); }
};
EM.ACTIONS['staff-pass'] = el => {
  const s = D.staff.find(x => x.id === el.dataset.id);
  EM.modal(`<h2>New password for ${esc(s.name)}</h2><p class="muted">${s.id === me().id ? 'Change your own password in My account.' : 'Their old password stops working and they are signed out everywhere. They choose their own at the next sign-in.'}</p>
    ${s.id === me().id ? '' : `<div class="field" style="margin-top:12px"><label for="np-p">Temporary password</label><input class="input" id="np-p" value="${genPass()}"></div>${errBox('np-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="staff-pass-go" data-id="${s.id}">Set it</button><button class="btn" data-act="close-modal">Cancel</button></div>`}`);
};
EM.ACTIONS['staff-pass-go'] = async el => {
  busy(el, true);
  try { await API('POST', '/api/auth/password', { staff_id: el.dataset.id, password: qs('#np-p').value }); const s = D.staff.find(x => x.id === el.dataset.id); s.must_change = true; EM.closeModal(); EM.toast(`Temporary password set for <b>${esc(s.name)}</b>. Give it to them yourself.`, 8000); EM.rerender(); } catch (x) { busy(el, false); showErr('np-err', x.message); }
};
EM.ACTIONS['staff-off'] = el => {
  const s = D.staff.find(x => x.id === el.dataset.id);
  const n = D.clients.filter(c => c.owner_id === s.id).length + D.opportunities.filter(o => o.owner_id === s.id).length;
  EM.modal(`<h2>Switch off ${esc(s.name)}</h2><p class="muted">They can no longer sign in. Their history stays. ${n ? `They own ${n} records in your view; hand them over.` : ''}</p>
    <div class="field" style="margin-top:12px"><label for="off-to">Hand their records to</label><select class="input" id="off-to"><option value="">Keep them as they are</option>${D.staff.filter(x => x.active && x.id !== s.id).map(x => `<option value="${x.id}">${esc(x.name)} · ${esc(roleName(x.role))}</option>`).join('')}</select></div>
    ${errBox('off-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="staff-off-go" data-id="${s.id}">Switch off</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['staff-off-go'] = async el => {
  const s = D.staff.find(x => x.id === el.dataset.id);
  busy(el, true);
  try {
    await API('POST', '/api/staff', { id: s.id, name: s.name, role: s.role, region: s.region, mobile: s.mobile, email: s.email, reports_to: s.reports_to, active: false, hand_to: qs('#off-to').value });
    const fresh = await API('GET', '/api/bootstrap'); Object.assign(D, fresh); EM.closeModal(); EM.toast(`<b>${esc(s.name)}</b> switched off.`); EM.rerender();
  } catch (x) { busy(el, false); showErr('off-err', x.message); }
};

/* ---------------------------------------------------------------- lists & stages (Owner) */
EM.VIEWS.lists = () => {
  if (!isOwner()) return EM.noAccess('Only an Owner edits the lists and stages.');
  const L = D.lists;
  return `<div class="stack"><div class="stack-s"><h1>Lists &amp; stages</h1><p class="muted" style="max-width:760px">The stages of each pipeline, the cities, the lost reasons, and EGO's product categories and warehouses. One per line. The last two stages of every pipeline stay Won and Lost. A city already used by a client cannot be removed.</p></div>
    <form id="lf2" class="stack" onsubmit="return false"><div class="grid g3">${Object.keys(PIPELINES).map(p => `<div class="field"><label for="ls-${p}">${esc(PIPELINES[p].label)} stages</label><textarea class="input" rows="11" id="ls-${p}" name="${p}">${esc(L.stages[p].join('\n'))}</textarea></div>`).join('')}</div>
      <div class="grid g2"><div class="field"><label for="ls-cities">Cities (City, Region)</label><textarea class="input" rows="12" id="ls-cities" name="cities">${esc(L.cities.map(c => c.city + ', ' + c.region).join('\n'))}</textarea><span class="small muted">Regions: ${REGIONS.join(', ')}</span></div>
      <div class="field"><label for="ls-lost">Lost reasons</label><textarea class="input" rows="12" id="ls-lost" name="lost">${esc(L.lost_reasons.join('\n'))}</textarea></div></div>
      <div class="grid g2"><div class="field"><label for="ls-cats">Product categories (${L.categories.length})</label><textarea class="input" rows="10" id="ls-cats" name="cats">${esc(L.categories.join('\n'))}</textarea><span class="small muted">EGO's own categories. They fill every product list.</span></div>
      <div class="field"><label for="ls-wh">Warehouses (${L.warehouses.length}): Name, City, Address</label><textarea class="input" rows="10" id="ls-wh" name="wh" placeholder="Bhiwandi godown, Thane, Gala 12, Mankoli Naka">${esc(L.warehouses.map(w => [w.name, w.city, w.address].filter(Boolean).join(', ')).join('\n'))}</textarea><span class="small muted">For the stock module that comes next.</span></div></div>
      ${errBox('ls-err')}<div class="row"><button class="btn primary" data-act="lists-save">Save lists</button></div></form></div>`;
};
EM.VIEWS.lists.title = () => 'Lists & stages';
EM.ACTIONS['lists-save'] = async el => {
  const lines = id => qs(id).value.split('\n').map(s => s.trim()).filter(Boolean);
  const b = { stages: Object.fromEntries(Object.keys(PIPELINES).map(p => [p, lines('#ls-' + p)])), cities: lines('#ls-cities').map(l => { const [city, region] = l.split(',').map(s => (s || '').trim()); return { city, region }; }), lost_reasons: lines('#ls-lost'),
    categories: lines('#ls-cats'), warehouses: lines('#ls-wh').map(l => { const [name, city, ...rest] = l.split(',').map(s => s.trim()); return { name, city: city || '', address: rest.join(', ') }; }) };
  busy(el, true);
  try { const r = await API('POST', '/api/lists', b); D.lists = r.lists; busy(el, false); EM.toast('Lists saved.'); EM.rerender(); } catch (x) { busy(el, false); showErr('ls-err', x.message); }
};

/* ---------------------------------------------------------------- my account */
EM.VIEWS.account = () => `<div class="stack" style="max-width:560px"><div class="stack-s"><h1>My account</h1><p class="muted">${esc(me().name)} · ${esc(me().login)} · ${esc(acc().name)}</p></div>
  <form id="mf" class="card stack" onsubmit="return false"><h3>Change my password</h3>
    <div class="field"><label for="mf-c">Current password</label><input class="input" id="mf-c" type="password" autocomplete="current-password"></div>
    <div class="field"><label for="mf-n">New password (at least ten characters)</label><input class="input" id="mf-n" type="password" autocomplete="new-password"></div>
    <div class="field"><label for="mf-n2">New password again</label><input class="input" id="mf-n2" type="password" autocomplete="new-password"></div>
    ${errBox('mf-err')}<div class="row"><button class="btn primary" data-act="my-pass">Change password</button><button class="btn" data-act="sign-out">Sign out</button></div></form></div>`;
EM.VIEWS.account.title = () => 'My account';
EM.ACTIONS['my-pass'] = async el => {
  if (qs('#mf-n').value !== qs('#mf-n2').value) return showErr('mf-err', 'The two new passwords are different.');
  busy(el, true);
  try { await API('POST', '/api/auth/password', { current: qs('#mf-c').value, password: qs('#mf-n').value }); busy(el, false); EM.toast('Password changed.'); qs('#mf').reset(); } catch (x) { busy(el, false); showErr('mf-err', x.message); }
};
