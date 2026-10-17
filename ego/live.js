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
  if (t === 'attendance' || t === 'roadmap') return holds() && canFieldTab(D.access, t);   // R2a: managers, Owners, telesales (FIELD_TABS)
  /* each role has its own screens (8 Oct); within them, the access rules below still apply */
  const only = (D.access.tabs || []).length ? D.access.tabs : null;   // the screens ticked for this role in Roles & access
  if (only && !['team', 'lists', 'integrations', 'followups', 'bin', 'targets'].includes(t) && !only.includes(t)) return false;
  if (t === 'targets') return holds();   // everyone sees their own target; it opens from Home and from Analysis
  if (t === 'bin') return isOwner() || !!D.access.can_delete;   // whoever may delete sees what they deleted; an Owner sees everything
  if (t === 'followups') return holds();   // My follow-ups opens from Home, like Lost sales from Opportunities
  if (t === 'integrations') return isOwner() && !D.access.viewing_as;   // every API key in one place: an Owner only
  if (['clients', 'people', 'opps', 'projects', 'import', 'inventory', 'analysis'].includes(t)) return holds();
  if (t === 'dealers' || t === 'design500') return holds();   // R3b: Big E keeps its own dealers; Design 500 in both companies
  if (t === 'architects') return holds();
  if (t === 'orders' || t === 'installation') return holds();   // R3b: Big E fulfilment (retail ladder), EGO installation
  if (t === 'p200' || t === 'schemes') return holds() && canDiv('wholesale');
  if (t === 'complaints' || t === 'approvals' || t === 'orderbook') return holds();
  if (t === 'team') return D.access.users;
  if (t === 'lists') return !!D.access.can_lists;
  return false;
}
EM.div = D.user.division === 'both' ? 'both' : D.user.division;
/* "Both" puts EGO Premium and Big E together to LOOK at (4 Oct). Nothing is added, changed,
   moved or deleted there: to change anything, switch to one company. One guard sits in front of
   every button; the buttons themselves are hidden in Both. */
const SEG = { wholesale: 'EGO Premium', retail: 'Big E', both: 'Both companies' };
const segBadge = div => `<span class="badge plain" data-seg>${esc(SEG[div] || div)}</span>`;
/* Both, and a view-only role, look without changing. Viewing as someone shows THEIR buttons (hidden only if their
   own role is view only); pressing one explains, because nothing saves while viewing as. */
const ownReadonly = () => D.access.viewing_as ? !!D.access.own_readonly : !!D.access.readonly;
const isBothView = () => (EM.div === 'both' && D.user.division === 'both') || ownReadonly();
/* opening tabs, filters and menus is looking, not changing */
const NAV_ACTS = new Set(['hist-open', 'role-toggle', 'opp-mine', 'invf-clear', 'menu', 'theme', 'back', 'close-modal', 'notif-open', 'notif-close', 'notif-tab',
  /* opening, downloading and sharing a kept file, and downloading a report, change no record (13 Oct) */
  'fu-view', 'fu-dl', 'fu-share', 'fu-share-native', 'fu-share-copy', 'lost-csv',
  /* seeing the records behind a figure, downloading the analysis or the targets sample, closing a file preview (13 Oct, batch 3) */
  'why', 'an-csv', 'tg-sample', 'tg-imp-close',
  /* batch 4: downloading the leads or interventions list, opening an intervention's files */
  'ho-csv', 'iv-csv', 'iv-files',
  /* R3a: the projects Excel sample and closing its preview */
  'pj-sample', 'pj-imp-close',
  /* R3b: the Design 500 Excel sample and closing its preview */
  'd5-sample', 'd5-imp-close']);
const LOOK_ACTS = new Set(['hist-open', 'view-back', 'view-as', 'role-toggle', 'role-copy', 'role-del', 'div', 'sign-out', 'menu', 'theme', 'back', 'close-modal', 'notif-open', 'notif-close', 'notif-tab', 'notif-seen', 'invf-clear', 'list-open', 'alloc-open',
  /* the people who log in and their own password are account matters, not company data */
  'staff-add', 'staff-edit', 'staff-gen', 'staff-off', 'staff-off-go', 'staff-pass', 'staff-pass-go', 'staff-save', 'my-pass',
  /* so are API keys: one set for the whole company (Integrations, 12 Oct) */
  'int-key-add', 'int-key-go', 'int-key-revoke', 'int-key-revoke-go', 'int-copy', 'int-tool-add', 'int-tool-edit', 'int-tool-save', 'int-tool-del', 'int-tool-del-go', 'int-row-add', 'int-row-del',
  'fu-view', 'fu-dl', 'fu-share', 'fu-share-native', 'fu-share-copy', 'lost-csv',
  'why', 'an-csv', 'tg-sample', 'tg-imp-close',
  'ho-csv', 'iv-csv', 'iv-files', 'pj-sample', 'pj-imp-close', 'd5-sample', 'd5-imp-close',
  /* dealer portal logins are account matters, like staff logins (batch 4) */
  'pu-add', 'pu-go', 'pu-pass', 'pu-toggle']);
/* in Both, the buttons that would change something are hidden (the guard stops any that remain) */
const hideChangeButtons = root => { if (!isBothView() || !root) return; root.querySelectorAll('[data-act]').forEach(b => { if (!LOOK_ACTS.has(b.dataset.act)) b.setAttribute('hidden', ''); }); root.querySelectorAll('input[type="file"], #move-stage, [data-list-only]').forEach(x => x.setAttribute('hidden', '')); };
EM.guard = el => {
  if (D.access.viewing_as && !['view-back', 'div', 'sign-out', 'list-open', 'alloc-open'].includes(el.dataset.act) && !NAV_ACTS.has(el.dataset.act)) { bubbleNear(el, `This is what ${D.access.viewing_as.name} sees and can press. Nothing saves while viewing as: press Back to me.`); return false; }
  if (!isBothView() || LOOK_ACTS.has(el.dataset.act)) return true;
  bubbleNear(el, ownReadonly() ? `${D.access.name} is view only: you can see, not change.` : 'Both shows EGO Premium and Big E together, to look at. Switch to Wholesale · EGO or Retail · Big E to add or change anything.');
  return false;
};
const baseModal = EM.modal.bind(EM);
EM.modal = html => { baseModal(html); hideChangeButtons(qs('#overlay')); };
const baseRender = EM.render.bind(EM);
EM.render = (...a) => {
  baseRender(...a);
  const both = isBothView();
  qs('#shell').classList.toggle('view-both', both);
  hideChangeButtons(qs('#view'));
  if (!allowedTab('import')) qs('#view').querySelectorAll('a[href="#/import"]').forEach(a => a.remove());   // no Import screen, no Import button
  histButton();
  if (EM.route().r !== 'bin') EM.BIN = null;   // the bin is read again each time it is opened
  if (D.access.viewing_as && !qs('#view [data-viewing-as]')) qs('#view').insertAdjacentHTML('afterbegin', `<div class="callout warn" data-viewing-as role="note"><b>Viewing as ${esc(D.access.viewing_as.name)} · ${esc(D.access.name)}.</b> This is exactly their menu, dashboard and records. Nothing can be changed from here. <button class="btn sm primary" data-act="view-back">Back to me</button></div>`);
  if (both && !D.access.viewing_as && !qs('#view [data-both-note]')) qs('#view').insertAdjacentHTML('afterbegin', D.access.readonly ? `<div class="callout" data-both-note role="note"><b>${esc(D.access.name)}: view only.</b> You see everything your role covers; nothing can be added or changed from this login.</div>` : '<div class="callout" data-both-note role="note"><b>Both: EGO Premium and Big E together, to look at.</b> Nothing can be added or changed here. Switch to <b>Wholesale · EGO</b> or <b>Retail · Big E</b> at the top to make changes.</div>');
};
const NAV_LABEL = { home: 'Home', dealers: 'Dealers', architects: 'Architects', design500: 'Design 500', people: 'People', opps: 'Opportunities', projects: 'Projects', schemes: 'Schemes', orderbook: 'Orders', orders: 'Fulfilment', installation: 'Installation', complaints: 'Complaints', approvals: 'Approvals', analysis: 'Analysis', p200: 'Priority 200', inventory: 'Inventory', import: 'Import from Excel', attendance: 'Attendance', roadmap: 'Roadmap' };
const NAV_TAIL = ['attendance', 'roadmap', 'complaints', 'approvals', 'analysis', 'p200', 'inventory', 'import'];
// Menu order per view, as Bhargav set it on 5 Oct.
const NAV_ORDER = {
  wholesale: ['home', 'people', 'architects', 'design500', 'dealers', 'opps', 'projects', 'schemes', 'orders', 'orderbook', 'installation', ...NAV_TAIL],
  retail: ['home', 'people', 'architects', 'design500', 'dealers', 'opps', 'projects', 'orders', 'orderbook', 'installation', ...NAV_TAIL],
  both: ['home', 'people', 'dealers', 'architects', 'design500', 'orderbook', 'opps', 'projects', 'schemes', 'orders', 'installation', ...NAV_TAIL],
};
EM.navTabs = () => ({
  main: (NAV_ORDER[EM.div] || NAV_ORDER.both).map(k => [k, NAV_LABEL[k]])
    .filter(([k]) => allowedTab(k) && !(['p200', 'schemes'].includes(k) && EM.div === 'retail')),
  shared: [['team', 'Team & access'], ['lists', 'Lists & stages'], ['integrations', 'Integrations'], ['bin', 'Recycle bin'], ['account', 'My account']].filter(([k]) => allowedTab(k)),
});
Object.assign(ICON, {
  opps: ICON.leads, schemes: ICON.targets, architects: ICON.firms, people: ICON.clients, inventory: ICON.stock, p200: ICON.targets, orderbook: ICON.orders || ICON.leads, import: _i('<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/><path d="M4 15.5v3A2 2 0 0 0 6 20.5h12a2 2 0 0 0 2-2v-3"/>'),
  lists: _i('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17.5" r="1"/>'),
  design500: _i('<circle cx="12" cy="9" r="5"/><path d="M8.5 13 7 20.5l5-2.5 5 2.5-1.5-7.5"/>'),
  projects: _i('<path d="M4 20.5h16"/><path d="M6 20.5V6.5l6-3 6 3v14"/><path d="M9.5 9h1.5M13 9h1.5M9.5 12.5h1.5M13 12.5h1.5M10.5 20.5v-4h3v4"/>'),
  account: _i('<circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  bin: _i('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5M14 11v5"/>'),
  analysis: _i('<path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/>'),
  integrations: _i('<path d="M9 3.5v4M15 3.5v4"/><path d="M6.5 7.5h11v3a5.5 5.5 0 0 1-11 0z"/><path d="M12 16v4.5"/>'),
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
/* Every stage set shows as a board with ALL its stages, in the order set in Lists & stages,
   whether or not anything is in them yet. A stage since removed from the list still shows
   while records sit in it, so nothing disappears. */
function stageBoard(stages, items, stageOf, card, laneExtra) {
  const all = [...stages];
  for (const x of items) if (stageOf(x) && !all.includes(stageOf(x))) all.push(stageOf(x));
  return `<div class="board" data-board>${all.map(sname => { const ls = items.filter(x => stageOf(x) === sname);
    return `<div class="lane" data-stage="${esc(sname)}"><h4><span>${esc(sname)}</span><span class="muted">${ls.length}</span></h4>${laneExtra ? laneExtra(ls) : ''}${ls.map(card).join('') || '<div class="small muted">Nothing here</div>'}</div>`; }).join('')}</div>`;
}
const empty = (title, body, actions = '') => `<div class="card empty stack-s"><h3>${title}</h3><p class="muted">${body}</p>${actions ? `<div class="row">${actions}</div>` : ''}</div>`;
const tile = (k, v, sub, href) => `<${href ? `a href="${href}"` : 'div'} class="card stat ${href ? 'tile' : ''}" style="text-decoration:none"><div class="kicker">${k}</div><div class="num">${v}</div>${sub ? `<span class="small muted">${sub}</span>` : ''}</${href ? 'a' : 'div'}>`;
const busy = (el, on) => { if (el) { el.disabled = on; if (on) el.dataset.label = el.textContent, el.textContent = 'Saving…'; else if (el.dataset.label) el.textContent = el.dataset.label; } };
const errBox = id => `<div class="small err" id="${id}" role="alert"></div>`;
const showErr = (id, errs) => { const el = qs('#' + id), list = (Array.isArray(errs) ? errs : [errs]).filter(Boolean).map(String);
  const left = markFieldErrors(el ? (el.closest('#overlay') || document) : document, list);   // each mistake appears just above its field
  if (el) el.innerHTML = left.map(esc).join('<br>'); };
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
/* a unit shown beside the box replaces the "(₹)" or "(sq ft)" in the label, so it is said once */
const unitOf = f => f.type === 'money' ? 'money' : UNITS[f.key] || '';
const formLabel = f => unitOf(f) ? f.label.replace(/\s*\((₹|sq ft|days|kg|years|boxes)[^)]*\)\s*$/, '') : f.label;
const G = {
  wrap: (f, p, inner, wide) => `<div class="field${wide ? ' span2' : ''}" data-field="${f.key}"><label for="${p}-${f.key}">${esc(formLabel(f))}${f.req ? ' *' : ''}</label>${inner}</div>`,
  /* ₹ … /- around money, the unit after an area, a size or a count */
  adorn: (f, input) => { const u = unitOf(f); return u ? `<div class="adorn" data-unit="${esc(u)}">${u === 'money' ? '<span class="pre">₹</span>' : ''}${input}<span class="suf">${u === 'money' ? '/-' : esc(u)}</span></div>` : input; },
  /* several values: a dropdown with ticks and a search, not a wall of chips */
  /* opts: plain values, or [value, label] pairs (a record picked by id, shown by name) */
  multi: (f, v, p, opts) => { const sel = Array.isArray(v) ? v : [], kv2 = opts.map(o => Array.isArray(o) ? o : [o, o]);
    return G.wrap(f, p, `<div class="ms" data-ms="${f.key}"><button type="button" class="input ms-btn" id="${p}-${f.key}" aria-expanded="false">${sel.length ? esc(kv2.filter(([o]) => sel.includes(o)).map(([, l]) => l).join(', ')) : '<span class="muted">Choose…</span>'}</button>
      <div class="ms-pop" hidden><input class="input ms-q" placeholder="Search" aria-label="Search ${esc(f.label)}">${kv2.map(([o, l]) => `<label class="ms-opt"><input type="checkbox" name="${f.key}" value="${esc(o)}" ${sel.includes(o) ? 'checked' : ''}> ${esc(l)}</label>`).join('')}
      <div class="row"><button type="button" class="btn sm ms-done">Done</button><span class="small muted ms-n">${sel.length} chosen</span></div></div></div>`, true); },
  mobile: (f, v, p) => { const m = splitMobile(v); return G.wrap(f, p, `<div class="mob" data-mobile="${f.key}"><select class="input dial" name="${f.key}_dial" aria-label="Country code for ${esc(f.label)}">${DIAL_CODES.map(c => `<option ${c === m.dial ? 'selected' : ''}>${c}</option>`).join('')}</select><input class="input" id="${p}-${f.key}" name="${f.key}" inputmode="tel" autocomplete="off" value="${esc(m.num)}" placeholder="10-digit mobile"></div>`); },
  select: (f, v, p, opts, blank = true) => G.wrap(f, p, `<select class="input" id="${p}-${f.key}" name="${f.key}"${f.key === 'designation' ? ' data-designation' : ''}>${blank ? '<option value="">Choose</option>' : ''}${opts.map(([k, l]) => `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`),
};
function fieldHtml(f, v, p, opt = {}) {
  v = v ?? '';
  switch (f.type) {
    case 'mobile': return G.mobile(f, v, p);
    case 'textarea': return G.wrap(f, p, `<textarea class="input" rows="2" id="${p}-${f.key}" name="${f.key}">${esc(v)}</textarea>`, true);
    case 'email': return G.wrap(f, p, `<input class="input" type="email" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}">`);
    case 'number': case 'money': return G.wrap(f, p, G.adorn(f, `<input class="input" type="number" min="0" step="${f.type === 'money' ? '0.01' : '1'}" inputmode="decimal" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}">`));
    case 'date': return G.wrap(f, p, `<input class="input" type="date" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}" placeholder="DD/MM/YYYY">`);
    case 'yesno': return G.select(f, v === true ? 'Yes' : v === false ? 'No' : v, p, [['Yes', 'Yes'], ['No', 'No']]);
    case 'select': return G.select(f, v, p, optsOf(f, D.lists).map(o => [o, optLabel(f, o)]), !f.req);
    case 'city': return G.select(f, v, p, D.lists.cities.map(c => [c.city, `${c.city} · ${c.region}`]));
    case 'owner': {
      const ppl = D.staff.filter(s => s.active && (D.access.scope !== 'own' || s.id === me().id));
      return G.select(f, v, p, ppl.map(s => [s.id, s.name]), !f.req);
    }
    case 'link': {
      const opts = D.clients.filter(c => f.to.includes(c.kind) && c.id !== opt.self).sort((a, b) => a.name.localeCompare(b.name)).map(c => [c.id, `${c.name} · ${kindLabel(c.kind)} · ${c.city}`]);
      return G.select(f, v, p, opts);
    }
    /* R3a: a project of the pipeline's company; a dealer for a consumer lead (those near the person first); a Project Partner */
    case 'project': return G.select(f, v, p, PJS().filter(x => x.division === (PIPELINES[opt.pipeline] || {}).division).map(x => [x.id, `${x.name} · ${x.city}`]));
    case 'dealer': { const city = (CL()[opt.client] || {}).city, sug = dealerSuggest(city).map(x => x.d.id);
      return G.select(f, v, p, [...sug.map(id => DDIR().find(d => d.id === id)).map(d => [d.id, `${d.name} · ${d.city} · suggested for ${city}`]), ...DDIR().filter(d => !sug.includes(d.id) && d.division !== 'retail').map(d => [d.id, `${d.name} · ${d.city}`])]).replace('<select', '<select data-keep-order'); }
    case 'partner': return G.select(f, v, p, DDIR().filter(d => (PARTNER_OK.includes(d.project_partner) && (!opt.division || d.division === opt.division)) || d.id === v).map(d => [d.id, `${d.name} · ${d.city} · Project Partner ${d.project_partner || 'not set'}`]));
    case 'cats': return fieldHtml({ ...f, type: 'multi', opts: D.lists.categories }, v, p);
    case 'cat': return G.select(f, v, p, D.lists.categories.map(c => [c, c]));
    case 'decimal': return G.wrap(f, p, G.adorn(f, `<input class="input" type="number" min="0" step="any" inputmode="decimal" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}">`));
    case 'collection': return G.select(f, v, p, INVD().collections.map(c => [c.id, `${c.name} · ${c.category}`]));
    case 'cities': return fieldHtml({ ...f, type: 'multi', opts: D.lists.cities.map(c => c.city) }, v, p);
    case 'multi': return G.multi(f, v, p, optsOf(f, D.lists));
    case 'stage': return G.select(f, v, p, ((D.lists.stages || {})[opt.pipeline] || []).map(s => [s, s]), false).replace('<select', '<select data-keep-order');
    case 'lost': return G.select(f, v, p, D.lists.lost_reasons.map(s => [s, s]));
    case 'contact': return G.select(f, v, p, D.contacts.filter(k => k.client_id === opt.client).map(k => [k.id, `${k.name}${k.designation ? ' · ' + k.designation : ''}`]));
    /* type anything, or pick from the list (Lists & stages) */
    case 'suggest': return G.wrap(f, p, `<input class="input" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}" autocomplete="off" data-suggest="${esc(JSON.stringify(optsOf(f, D.lists) || []))}" placeholder="Type or pick">`);
    case 'address': return addrPick(f, v, p, opt.client);
    case 'addresses': return G.wrap(f, p, `<div class="stack-s" data-addrs>${(Array.isArray(v) ? v : []).map(a => addrLine(f.key, a)).join('')}<div class="row"><button type="button" class="btn sm" data-act="addr-add" data-key="${f.key}">+ Add an address</button></div></div>`, true);
    case 'gst': return G.wrap(f, p, `<input class="input" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}" maxlength="15" autocapitalize="characters" placeholder="15 characters">`);
    default: return G.wrap(f, p, `<input class="input" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}">`);
  }
}
function readForm(root, fields) {
  const mine = name => [...root.querySelectorAll(`[name="${name}"]`)].filter(el => !el.disabled && (el.closest('[data-scope]') || root) === root);
  const o = {};
  for (const f of fields) {
    const els = mine(f.key);
    if (['multi', 'cats', 'cities'].includes(f.type)) o[f.key] = els.filter(el => el.checked).map(el => el.value);
    else if (f.type === 'addresses') o[f.key] = els.map(el => el.value.trim()).filter(Boolean);
    else if (els.some(el => el.type === 'radio')) o[f.key] = (els.find(el => el.checked) || { value: '' }).value;
    else { o[f.key] = els.length ? String(els[0].value) : ''; if (f.type === 'mobile') o[f.key + '_dial'] = (mine(f.key + '_dial')[0] || { value: '+91' }).value || '+91'; }
  }
  return o;
}
/* the multi-select dropdown */
document.addEventListener('click', e => {
  const btn = e.target.closest('.ms-btn, .ms-done');
  document.querySelectorAll('.ms-pop:not([hidden])').forEach(p => { if (!p.parentElement.contains(e.target) || (btn && btn.classList.contains('ms-done') && p.contains(btn))) { p.hidden = true; p.parentElement.querySelector('.ms-btn').setAttribute('aria-expanded', 'false'); } });
  if (btn && btn.classList.contains('ms-btn')) { const pop = btn.nextElementSibling, open = pop.hidden; pop.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open) pop.querySelector('.ms-q').focus(); }
});
document.addEventListener('change', e => {
  const ms = e.target.closest && e.target.closest('.ms');
  if (!ms || e.target.type !== 'checkbox') return;
  const sel = [...ms.querySelectorAll('input[type=checkbox]:checked')].map(x => x.closest('label').textContent.trim());
  ms.querySelector('.ms-btn').innerHTML = sel.length ? esc(sel.join(', ')) : '<span class="muted">Choose…</span>';
  ms.querySelector('.ms-n').textContent = sel.length + ' chosen';
});
document.addEventListener('input', e => { if (e.target.classList && e.target.classList.contains('ms-q')) { const q = e.target.value.toLowerCase(); e.target.parentElement.querySelectorAll('.ms-opt').forEach(l => { l.hidden = q && !l.textContent.toLowerCase().includes(q); }); } });
/* type to search (11 Oct): any dropdown of 8 or more choices gets a box on top that shortlists as you type,
   A to Z (a list with an order of its own, like stages, keeps it). The <select> stays and holds the value, so
   forms and listeners read it as before. A free-text box with data-suggest offers its list the same way. */
const CB_MIN = 8, cbNorm = t => String(t || '').toLowerCase();
const cbAZ = (a, b) => a.l.localeCompare(b.l, 'en', { numeric: true, sensitivity: 'base' });
function cbChoices(el) {
  if (el.tagName !== 'SELECT') return JSON.parse(el.dataset.suggest || '[]').map(v => ({ v, l: v })).sort(cbAZ);
  const all = [...el.options].map(o => ({ v: o.value, l: o.textContent.trim() + (o.parentElement.tagName === 'OPTGROUP' ? ' · ' + o.parentElement.label : ''), top: o.value === '' || o.value.startsWith('__') }));
  const top = all.filter(o => o.top), rest = all.filter(o => !o.top);
  return [...top.filter(o => o.v === ''), ...(el.hasAttribute('data-keep-order') ? rest : rest.sort(cbAZ)), ...top.filter(o => o.v !== '')];
}
function cbEnhance(el) {
  if (el.dataset.cb) return;
  const isSel = el.tagName === 'SELECT';
  if (isSel && (el.multiple || el.classList.contains('dial') || el.options.length < CB_MIN)) return;
  el.dataset.cb = '1';
  const wrap = document.createElement('div'); wrap.className = 'cb';
  const q = isSel ? document.createElement('input') : el, list = document.createElement('div');
  list.className = 'cb-list'; list.hidden = true; list.setAttribute('role', 'listbox');
  if (isSel) {
    q.className = 'input cb-q'; q.autocomplete = 'off'; q.placeholder = 'Type to search';
    if (el.id) { q.id = el.id + '-q'; const lab = document.querySelector(`label[for="${el.id}"]`); if (lab) lab.htmlFor = q.id; }
    q.setAttribute('aria-label', el.getAttribute('aria-label') || (el.closest('.field') && el.closest('.field').querySelector('label, span') || {}).textContent || 'Search');
    q.disabled = el.disabled; el.classList.add('cb-sel'); el.tabIndex = -1;
    el.after(wrap); wrap.append(q, list);
  } else { el.after(wrap); wrap.append(el, list); }
  q.setAttribute('role', 'combobox'); q.setAttribute('aria-expanded', 'false');
  const shown = () => { const o = isSel && el.selectedOptions[0]; return o && o.value !== '' ? o.textContent.trim() : ''; };
  const sync = () => { if (isSel) { q.value = shown(); const o = el.selectedOptions[0]; q.placeholder = o && o.value === '' && o.textContent.trim() !== 'Choose' ? o.textContent.trim() : 'Type to search'; } };
  let act = 0, cur = [], nav = false;
  const draw = text => {
    const t = cbNorm(text).trim();
    cur = cbChoices(el).filter(o => !t || (o.v !== '' && cbNorm(o.l).includes(t)));
    if (t) cur.sort((a, b) => (cbNorm(b.l).startsWith(t) - cbNorm(a.l).startsWith(t)));
    act = Math.max(0, cur.findIndex(o => isSel && o.v === el.value && !t));
    list.innerHTML = cur.length ? cur.slice(0, 300).map((o, i) => `<div class="cb-opt${i === act ? ' on' : ''}" role="option" data-i="${i}">${esc(o.l)}</div>`).join('') : `<div class="cb-none small muted">${isSel ? 'Nothing matches' : 'Type your own'}</div>`;
    list.hidden = false; q.setAttribute('aria-expanded', 'true');
    const on = list.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  };
  const close = () => { list.hidden = true; q.setAttribute('aria-expanded', 'false'); sync(); };
  const pick = o => {
    if (!o) return;
    el.value = o.v; if (!isSel) q.value = o.v;
    el.dispatchEvent(new Event(isSel ? 'change' : 'input', { bubbles: true })); if (isSel) el.dispatchEvent(new Event('input', { bubbles: true }));
    close();
  };
  q.addEventListener('focus', () => { if (isSel) q.select(); draw(isSel ? '' : q.value); });
  q.addEventListener('click', () => { if (list.hidden) draw(isSel ? '' : q.value); });
  q.addEventListener('input', () => { nav = false; draw(q.value); });
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); nav = true; if (list.hidden) return draw(''); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + cur.length) % Math.max(cur.length, 1); list.querySelectorAll('.cb-opt').forEach((d, i) => d.classList.toggle('on', i === act)); const on = list.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && !list.hidden) { e.preventDefault(); if (isSel || nav) pick(cur[act]); else close(); }
    else if (e.key === 'Escape' && !list.hidden) { e.stopPropagation(); close(); }
    else if (e.key === 'Tab') close();
  });
  list.addEventListener('mousedown', e => { e.preventDefault(); const d = e.target.closest('.cb-opt'); if (d) pick(cur[+d.dataset.i]); });
  q.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== q) close(); }, 120));
  if (isSel) { el.addEventListener('change', sync); el.addEventListener('focus', () => q.focus()); }
  sync();
}
const cbScan = root => (root.querySelectorAll ? root : document).querySelectorAll('select.input:not([data-cb]), input[data-suggest]:not([data-cb])').forEach(cbEnhance);
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches('select.input, input[data-suggest]')) cbEnhance(n); else cbScan(n); } }).observe(document.documentElement, { childList: true, subtree: true });
/* a mobile is shown and edited with its code, so the form gives back +<code><number> */
const withDials = (o, fields) => { for (const f of fields) if (f.type === 'mobile' && o[f.key]) { const r = normMobile(o[f.key], o[f.key + '_dial']); if (r.value) o[f.key] = r.value; } return o; };
function showVal(f, v) {
  if (f.key === 'delivery_address' && !v) return 'Same as billing';
  if (f.type === 'addresses' && Array.isArray(v)) return v.map(a => `<div style="white-space:pre-line">${esc(a)}</div>`).join('<hr class="sep">') || NOTSET;
  if (v === '' || v == null || (Array.isArray(v) && !v.length)) return NOTSET;
  switch (f.type) {
    case 'mobile': return esc(fmtMobile(v));
    case 'owner': return esc(staffName(v));
    case 'link': case 'dealer': case 'partner': { const c = CL()[v] || DDIR().find(d => d.id === v); return c ? (CL()[v] ? `<a href="#/client/${c.id}">${esc(c.name)}</a>` : esc(c.name)) : '<span class="muted">Outside your view</span>'; }
    case 'project': { const x = PJS().find(y => y.id === v); return x ? `<a href="#/project/${x.id}">${esc(x.name)}</a>` : '<span class="muted">Outside your view</span>'; }
    case 'yesno': return v ? 'Yes' : 'No';
    case 'multi': case 'cats': case 'cities': return v.map(x => `<span class="chip">${esc(x)}</span>`).join('');
    case 'money': return money(v);
    case 'date': return ds(v);
    case 'select': return esc(optLabel(f, v));
    case 'email': return `<a href="mailto:${esc(v)}">${esc(v)}</a>`;
    default: return esc(v);
  }
}

/* addresses (11 Oct): a client keeps several; a sale picks its billing and delivery address from them, or adds a new one */
const addrLine = (key, a = '') => `<div class="row" data-addr-line style="align-items:flex-start"><textarea class="input" rows="2" name="${key}" style="flex:1" placeholder="Address, area, city, state, pincode">${esc(a)}</textarea><button type="button" class="btn sm ghost" data-act="addr-del">Remove</button></div>`;
EM.ACTIONS['addr-add'] = el => { el.closest('.row').insertAdjacentHTML('beforebegin', addrLine(el.dataset.key)); el.closest('[data-addrs]').querySelector('[data-addr-line]:last-of-type textarea').focus(); };
EM.ACTIONS['addr-del'] = el => el.closest('[data-addr-line]').remove();
const clientAddrs = id => { const c = CL()[id]; if (!c) return []; return [...new Set([mainAddress(c), ...((c.extra || {}).addresses || [])].filter(Boolean))]; };
/* the value lives in the textarea; the dropdown fills it, and "+ Add new address" opens it to type */
function addrPick(f, v, p, clientId) {
  const bill = f.key === 'billing_address', list = clientAddrs(clientId);
  if (bill && !v) v = list[0] || '';
  const opts = [...(bill ? [] : [['', 'Same as billing']]), ...list.map(a => [a, a.replace(/\s*\n\s*/g, ', ')]), ...(v && !list.includes(v) ? [[v, v.replace(/\s*\n\s*/g, ', ')]] : [])];
  const typing = bill && !list.length;
  return G.wrap(f, p, `<select class="input" id="${p}-${f.key}" data-addr-pick="${f.key}">${opts.map(([k, l]) => `<option value="${esc(k)}" ${k === v && !typing ? 'selected' : ''}>${esc(l.length > 90 ? l.slice(0, 88) + '…' : l)}</option>`).join('')}<option value="__new" ${typing ? 'selected' : ''}>+ Add new address…</option></select>
    <textarea class="input" rows="2" name="${f.key}" data-addr-new placeholder="Type the new address: it is kept on the client for next time" ${typing ? '' : 'hidden'} style="margin-top:6px">${esc(v)}</textarea>`, true);
}
document.addEventListener('change', e => {
  const sel = e.target.closest && e.target.closest('[data-addr-pick]'); if (!sel) return;
  const ta = sel.parentElement.querySelector('[data-addr-new]'), isNew = sel.value === '__new';
  ta.hidden = !isNew; ta.value = isNew ? '' : sel.value; if (isNew) ta.focus();
});
/* a city we know fills its state; it can still be changed */
document.addEventListener('change', e => {
  if (!e.target.matches || !e.target.matches('select[name="city"]')) return;
  const st = CITY_STATE[e.target.value], box = (e.target.closest('[data-scope], form, .modal') || document).querySelector('[name="state"]');
  if (st && box && box.value !== st) { box.value = st; box.dispatchEvent(new Event('change', { bubbles: true })); }
});
/* R4: a flooring line is priced per sq ft, so its list rate is the collection's price per sq ft; accessories have none */
const listRate = pid => { const p = lineProd(pid), e = p ? colOf(p).extra || {} : {}; return p && lineUnit(pid) === 'sqft' && e.price_sqft ? Number(e.price_sqft) : null; };
const listRateTxt = pid => { const r = pid && listRate(pid); return r ? `List rate ${inr0(r)} / sq ft` : ''; };
/* picking a design redraws its line: the unit (sq ft, piece, rft) and the box size come from the design */
document.addEventListener('change', e => {
  if (!e.target.matches || !e.target.matches('[data-ol="p"]')) return;
  const line = e.target.closest('.ordline'), v = readLine(line); delete v.keep;
  if (!v.rate && listRate(v.product_id)) v.rate = listRate(v.product_id);
  line.outerHTML = ordLine(line.dataset.i, v);
  const f = qs('#of'); if (f) f.dispatchEvent(new Event('input', { bubbles: true }));
});

/* ---------------------------------------------------------------- home */
EM.VIEWS.home = () => {
  const who = `<div class="stack-s"><div class="kicker">${esc(acc().name)} · ${esc(scopeLabel())}</div><h1>${greet()}, ${esc(me().name.split(' ')[0])}</h1></div>`;
  if (!holds()) return `<div class="stack">${who}<p class="muted">Your role manages people and access, not business records.</p><div class="row">${allowedTab('team') ? '<a class="btn primary" href="#/team">Team &amp; access</a>' : ''}</div></div>`;
  const cs = D.clients.filter(inDiv), os = D.opportunities.filter(inDiv), t = today(), month = t.slice(0, 7);
  const open = os.filter(o => !isClosed(o.pipeline, o.stage, D.lists));
  const due = [...open.filter(o => o.next_date && o.next_date <= t)];
  const won = os.filter(o => o.stage === wonStage(o.pipeline, D.lists) && (o.closed_at || '').slice(0, 7) === month);
  const sum = a => a.reduce((s, o) => s + (Number(o.value) || 0), 0);
  const tiles = homeTarget(isOwner() || D.access.scope === 'all' ? 'company' : under(me().id).length ? 'team' : 'person')
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

/* ---------------------------------------------------------------- dashboards, one per role (8 Oct)
   EGO Premium's team: management, the national sales head, field sales, telesales, accounts,
   dispatch, office admin, marketing. Every figure is counted from saved records in the person's view. */
const under = id => { const out = []; const walk = x => D.staff.filter(s => s.reports_to === x && s.active).forEach(s => { if (!out.includes(s.id)) { out.push(s.id); walk(s.id); } }); walk(id); return out; };
const thisMonthD = ts => !!ts && dayIST(ts).slice(0, 7) === today().slice(0, 7);
const sumV = a => a.reduce((t, x) => t + (Number(x.value) || 0), 0);
const isWon = o => o.stage === wonStage(o.pipeline, D.lists), isOpen = o => !isClosed(o.pipeline, o.stage, D.lists);
const due = o => (o.total || 0) - (o.paid || 0);
const daysSince = ts => ts ? Math.floor((Date.now() - Date.parse(ts.endsWith('Z') ? ts : ts.replace(' ', 'T') + 'Z')) / 864e5) : null;
/* one row per person: dealers they look after, open sales, won this month, overdue next actions */
function teamTable(ids) {
  const P = D.access.prices, t = today();
  const rows = ids.map(id => D.staff.find(s => s.id === id)).filter(Boolean).map(s => { const os = D.opportunities.filter(o => o.owner_id === s.id), open = os.filter(isOpen), won = os.filter(o => isWon(o) && thisMonthD(o.closed_at));
    return [`<b>${esc(s.name)}</b><div class="small muted">${esc(roleName(s.role))}${s.region ? ' · ' + esc(s.region) : ''}</div>`, num(D.clients.filter(c => c.owner_id === s.id).length), `${num(open.length)}${P && open.length ? ` · ${inr0(sumV(open))}` : ''}`, `${num(won.length)}${P && won.length ? ` · ${inr0(sumV(won))}` : ''}`, (n => n ? `<span class="badge bad">${n}</span>` : '0')(open.filter(o => o.next_date && o.next_date < t).length)]; });
  return rows.length ? table(['Person', 'Dealers and clients', 'Open opportunities', 'Won this month', 'Overdue actions'], rows) : '<p class="small muted">Nobody reports here yet.</p>';
}
const stageTable = () => { const W = D.lists.stages.wholesale || [], os = D.opportunities.filter(o => o.pipeline === 'wholesale' && inDiv(o));
  return table(['Stage', 'Opportunities', ...(D.access.prices ? ['Value'] : [])], W.map(st => { const a = os.filter(o => o.stage === st); return [esc(st), num(a.length), ...(D.access.prices ? [sumV(a) ? inr0(sumV(a)) : ''] : [])]; })); };
const fulTable = () => { const O = OPSD(), FS = OS_('fulfilment_stages'); return table(['Fulfilment stage', 'Orders'], FS.map(st => [esc(st), num(O.orders.filter(o => o.ful_stage === st).length)])); };
const nextTable = (opps, title) => { const t = today(), list = opps.filter(o => isOpen(o) && o.next_date && o.next_date <= t).sort((a, b) => a.next_date.localeCompare(b.next_date)).slice(0, 12);
  return `<section class="card stack-s"><h3>${title}</h3>${list.length ? table(['Opportunity', 'Client', 'Next action', 'Due'], list.map(o => ({ href: `#/opp/${o.id}`, cells: [`<b>${esc(o.title)}</b>`, esc(clientName(o.client_id)), esc(o.next_action || ''), o.next_date < t ? `<span class="badge bad">${ds(o.next_date)}</span>` : ds(o.next_date)] }))) : '<p class="small muted">Nothing due. Well done.</p>'}</section>`; };
const ordersAt = (stages, cols) => { const O = OPSD(), list = O.orders.filter(o => stages.includes(o.ful_stage));
  return list.length ? table(['Order', 'Dealer', ...cols.map(c => c[0])], list.map(o => ({ href: '#/order/' + o.id, cells: [`<b>${esc(o.ref)}</b><div class="small muted">${esc(o.ful_stage)}</div>`, esc(clientName(o.client_id)), ...cols.map(c => c[1](o))] }))) : '<p class="small muted">None right now.</p>'; };
const schemeCard = filter => { const run = SCH().list.filter(sc => sc.status === 'Approved' && today() >= sc.start_on && today() <= sc.end_on);
  if (!run.length || !D.access.prices) return '';
  return `<section class="card stack-s"><h3>Schemes running</h3>${run.map(sc => { const rows = schemeRows(sc).filter(r => !filter || filter(r.c)); return `<div class="small"><a href="#/scheme/${sc.id}"><b>${esc(sc.name)}</b></a> · ends ${ds(sc.end_on)} · ${num(rows.filter(r => r.won).length)} of ${num(rows.length)} reached ${inr0(sc.target)}</div>`; }).join('')}</section>`; };
function roleDash(kind) {
  const P = D.access.prices, O = OPSD(), t = today(), mine = o => o.owner_id === me().id, myOpps = D.opportunities.filter(mine), team = under(me().id);
  const who = `<div class="stack-s"><div class="kicker">${esc(acc().name)} · ${esc(scopeLabel())}</div><h1>${greet()}, ${esc(me().name.split(' ')[0])}</h1></div>`;
  const short = O.orders.filter(o => [FN('Stock check'), FN('Waiting on production')].includes(o.ful_stage)).reduce((a, o) => a + missingOf(o.id), 0);
  const invDue = O.orders.filter(o => o.invoiced_at && due(o) > 0.5);
  if (kind === 'mgmt') {
    const os = D.opportunities.filter(inDiv), open = os.filter(isOpen), won = os.filter(o => isWon(o) && thisMonthD(o.closed_at)), pend = O.approvals.filter(a => a.status === 'Pending'), cs = D.clients.filter(inDiv);
    const sellers = D.staff.filter(s => s.active && ['ws_field', 'ws_tele', 'ws_marketing', 'ws_head'].includes(s.role)).map(s => s.id), dueAmt = invDue.reduce((a, o) => a + due(o), 0);
    return `<div class="stack">${who}${cs.length ? '' : empty('Nothing saved yet', 'Add a dealer with its team, an architect firm with its team, or a person, or fill the Excel file and upload it. Every number on this page is counted from what you save.', addButtons())}
      <div class="grid g4">${homeTarget('company')}${tile('Open opportunities', num(open.length), P && open.length ? inr0(sumV(open)) : '', '#/opps')}${tile('Money due', P && dueAmt > 0 ? inr0(dueAmt) : num(invDue.length), invDue.length ? `${num(invDue.length)} invoices · ${num(O.orders.filter(o => o.credit_hold).length)} on credit hold` : '', '#/orders')}${tile('Approvals waiting', num(pend.length), pend.length ? `${num(pend.filter(a => levelLimit(D.lists.rules, a.kind, D.access.level) >= a.amount).length)} you can decide` : '', '#/approvals')}</div>
      <p class="small muted">Won this month, orders in fulfilment, dealers and the rest: <a href="#/analysis">Analysis</a>.</p>
      ${fuRollup()}<section class="card stack-s" data-dash-team><h3>The sales team</h3>${teamTable(sellers)}</section>
      <div class="grid g2"><section class="card stack-s"><h3>Wholesale pipeline</h3>${stageTable()}</section><section class="card stack-s"><h3>Fulfilment</h3>${fulTable()}</section></div>${schemeCard()}${notConnectedCard()}</div>`;
  }
  if (kind === 'head') {
    const os = D.opportunities.filter(o => o.pipeline === 'wholesale'), open = os.filter(isOpen), won = os.filter(o => isWon(o) && thisMonthD(o.closed_at)), mineAp = O.approvals.filter(a => a.status === 'Pending' && levelLimit(D.lists.rules, a.kind, D.access.level) >= a.amount);
    return `<div class="stack">${who}<div class="grid g4">${homeTarget('team')}${tile('Open opportunities', num(open.length), P ? inr0(sumV(open)) : '', '#/opps/wholesale')}${tile('Won this month', num(won.length), P ? inr0(sumV(won)) : '', '#/orderbook')}${tile('Approvals for you', num(mineAp.length), mineAp.length ? 'discounts and credit waiting' : 'nothing waiting', '#/approvals')}</div>
      ${fuCount([me().id, ...team], 'Follow-ups in your team')}<section class="card stack-s" data-dash-team><h3>Your team</h3>${teamTable(team)}</section>
      <div class="grid g2"><section class="card stack-s"><h3>Wholesale pipeline</h3>${stageTable()}</section><section class="card stack-s"><h3>Orders short of stock</h3>${ordersAt([FN('Stock check'), FN('Waiting on production')], [['Missing', o => missingOf(o.id) ? `<span class="badge bad">${num(missingOf(o.id))} boxes</span>` : '<span class="badge ok">covered</span>']])}</section></div>
      ${nextTable(open.filter(o => o.next_date && o.next_date < t), 'Overdue next actions in your team')}${schemeCard()}</div>`;
  }
  if (kind === 'sales' || kind === 'tele') {
    const open = myOpps.filter(isOpen), won = myOpps.filter(o => isWon(o) && thisMonthD(o.closed_at)), dueN = open.filter(o => o.next_date && o.next_date <= t), myDealers = D.clients.filter(c => mine(c) && DEALER_KINDS.includes(c.kind));
    const myOrders = O.orders.filter(o => mine(o) && o.ful_stage !== lastOf(OS_('fulfilment_stages')));
    const callDue = myDealers.filter(c => { const every = Number((c.extra || {}).contact_every_days || 0); if (!every) return false; const last = [c.updated_at, ...D.opportunities.filter(o => o.client_id === c.id).map(o => o.updated_at)].filter(Boolean).sort().pop(); return daysSince(last) >= every; });
    const tiles = kind === 'tele'
      ? tile('Calls due', num(dueN.length), `${num(dueN.filter(o => o.next_date < t).length)} overdue`, '#/opps') + tile('Dealers due a call', num(callDue.length), 'past their call-every days', '#/dealers') + tile('New and contacted leads', num(open.filter(o => o.stage === (D.lists.stages[o.pipeline] || [])[0] || o.stage === (D.lists.stages[o.pipeline] || [])[1]).length), '', '#/opps') + homeTarget('person')
      : homeTarget('person') + tile('My open opportunities', num(open.length), P ? inr0(sumV(open)) : '', '#/opps') + tile('Next actions due', num(dueN.length), `${num(dueN.filter(o => o.next_date < t).length)} overdue`, '#/opps') + tile('Won this month', num(won.length), P ? inr0(sumV(won)) : '', '#/orderbook');
    return `<div class="stack">${who}${fuCard(kind === 'tele' ? 'Your calls and follow-ups: due today and overdue' : 'Your follow-ups: due today and overdue')}<div class="grid g4">${tiles}</div>
      ${kind === 'tele' ? fieldReqCard(myOpps) : ''}
      ${kind === 'tele' && callDue.length ? `<section class="card stack-s"><h3>Dealers due a call</h3>${table(['Dealer', 'Call every', 'City'], callDue.map(c => ({ href: '#/client/' + c.id, cells: [`<b>${esc(c.name)}</b>`, `${num(c.extra.contact_every_days)} days`, esc(c.city)] })))}</section>` : ''}
      <section class="card stack-s"><h3>Your orders in fulfilment</h3>${myOrders.length ? table(['Order', 'Dealer', 'Where it is'], myOrders.map(o => ({ href: '#/order/' + o.id, cells: [`<b>${esc(o.ref)}</b>`, esc(clientName(o.client_id)), `<span class="badge info">${esc(o.ful_stage)}</span>`] }))) : '<p class="small muted">None right now. An order comes here when your opportunity reaches Order confirmed.</p>'}</section>
      ${team.length ? `<section class="card stack-s" data-dash-team><h3>Your team</h3>${teamTable(team)}</section>` : ''}${schemeCard(c => c.owner_id === me().id || team.includes(c.owner_id))}</div>`;
  }
  if (kind === 'mkt') {
    const month = myOpps.filter(o => thisMonthD(o.created_at)), srcs = [...new Set(month.map(o => o.source || 'Not filled'))];
    return `<div class="stack">${who}<div class="grid g4">${tile('Leads this month', num(month.length), '', '#/opps')}${tile('Moved on', num(month.filter(o => (D.lists.stages[o.pipeline] || []).indexOf(o.stage) > 0 && o.stage !== lostStage(o.pipeline, D.lists)).length), 'past the first stage')}${tile('Won', num(month.filter(isWon).length))}${tile('Lost', num(month.filter(o => o.stage === lostStage(o.pipeline, D.lists)).length))}</div>
      <section class="card stack-s"><h3>This month's leads by source</h3>${srcs.length ? table(['Source', 'Leads', 'Moved on', 'Won'], srcs.map(sr => { const a = month.filter(o => (o.source || 'Not filled') === sr); return [esc(sr), num(a.length), num(a.filter(o => (D.lists.stages[o.pipeline] || []).indexOf(o.stage) > 0 && o.stage !== lostStage(o.pipeline, D.lists)).length), num(a.filter(isWon).length)]; })) : '<p class="small muted">No leads this month yet. Add them as opportunities, with their source.</p>'}</section></div>`;
  }
  if (kind === 'accounts') {
    const pi = O.orders.filter(o => o.ful_stage === FN('PI sent')), paidNot = O.orders.filter(o => o.ful_stage === FN('Payment received'));
    return `<div class="stack">${who}<div class="grid g4">${tile('Waiting for payment', num(pi.length), P ? inr0(pi.reduce((a, o) => a + due(o), 0)) : '', '#/orders')}${tile('Paid, to invoice', num(paidNot.length), '', '#/orders')}${tile('Invoiced, money due', num(invDue.length), P ? inr0(invDue.reduce((a, o) => a + due(o), 0)) : '', '#/orders')}${tile('On credit hold', num(O.orders.filter(o => o.credit_hold).length), '', '#/approvals')}</div>
      <section class="card stack-s"><h3>PI sent: waiting for the payment</h3>${ordersAt([FN('PI sent')], P ? [['Total', o => inr0(o.total)], ['Received', o => inr0(o.paid || 0)]] : [])}</section>
      <section class="card stack-s"><h3>Payment received: to invoice</h3>${ordersAt([FN('Payment received')], P ? [['Received', o => inr0(o.paid || 0)], ['Still due', o => inr0(due(o))]] : [])}</section>
      <section class="card stack-s" data-dash-due><h3>Invoiced with money still due</h3>${invDue.length ? table(['Order', 'Dealer', ...(P ? ['Still due'] : []), 'Days since invoice'], invDue.sort((a, b) => a.invoiced_at.localeCompare(b.invoiced_at)).map(o => ({ href: '#/order/' + o.id, cells: [`<b>${esc(o.ref)}</b>`, esc(clientName(o.client_id)), ...(P ? [inr0(due(o))] : []), (d => d > D.lists.rules.payment_days ? `<span class="badge bad">${d}</span>` : String(d))(daysSince(o.invoiced_at))] }))) : '<p class="small muted">Nothing due.</p>'}</section></div>`;
  }
  if (kind === 'dispatch') {
    const PS = OS_('production_stages'), recI = PS.indexOf(PNn('Received at warehouse')), coming = O.production.filter(p => PS.indexOf(p.stage) < recI).sort((a, b) => (a.eta || '').localeCompare(b.eta || ''));
    const low = INVD().products.filter(p => p.extra.low_stock != null && INVD().stock.filter(x => x.product_id === p.id).reduce((a, x) => a + x.boxes, 0) < p.extra.low_stock);
    return `<div class="stack">${who}<div class="grid g4">${tile('To check and block', num(O.orders.filter(o => o.ful_stage === FN('Stock check')).length), short ? `${num(short)} boxes short` : '', '#/orders')}${tile('Ready to pack', num(O.orders.filter(o => o.ful_stage === FN('Invoiced')).length), 'invoiced, not packed', '#/orders')}${tile('To dispatch', num(O.orders.filter(o => o.ful_stage === nm(D.lists, 'ops.fulfilment_stages', 'Packed')).length), '', '#/orders')}${tile('Production coming', num(coming.length), '', '#/orders/production')}</div>
      <section class="card stack-s"><h3>Stock check: what is missing</h3>${ordersAt([FN('Stock check'), FN('Waiting on production')], [['Missing', o => missingOf(o.id) ? `<span class="badge bad">${num(missingOf(o.id))} boxes</span>` : '<span class="badge ok">covered</span>']])}</section>
      <section class="card stack-s"><h3>To pack and dispatch</h3>${ordersAt([FN('Invoiced'), nm(D.lists, 'ops.fulfilment_stages', 'Packed')], [['Boxes', o => num(O.lines.filter(l => l.order_id === o.id).reduce((a, l) => a + l.boxes, 0))]])}</section>
      <div class="grid g2"><section class="card stack-s"><h3>Production orders coming</h3>${coming.length ? table(['Production order', 'Design', 'Boxes', 'Expected'], coming.map(p => ({ href: '#/po/' + p.id, cells: [`<b>${esc(p.ref)}</b>`, esc(prodName(p.product_id)), num(p.boxes), p.eta ? (p.eta < t ? `<span class="badge bad">${ds(p.eta)}</span>` : ds(p.eta)) : ''] }))) : '<p class="small muted">None.</p>'}</section>
        <section class="card stack-s"><h3>Below the warning level</h3>${low.length ? table(['Design', 'Warn below'], low.map(p => [esc(p.name), num(p.extra.low_stock)])) : '<p class="small muted">No design is below its warning level.</p>'}</section></div></div>`;
  }
  if (kind === 'office') {
    const I = INVD();
    return `<div class="stack">${who}<div class="grid g4">${tile('Dealers', num(D.clients.filter(c => DEALER_KINDS.includes(c.kind)).length), '', '#/dealers')}${tile('Architects', num(D.clients.filter(c => ARCH_KINDS.includes(c.kind)).length), '', '#/architects')}${tile('People', num(peopleRows().length), '', '#/people')}${tile('Open complaints', num(O.complaints.filter(c => c.status !== nm(D.lists, 'ops.complaint_statuses', 'Resolved')).length), '', '#/complaints')}</div>
      <p class="small muted">Inventory: ${num(I.products.length)} designs in ${num(I.collections.length)} collections, ${num(I.stock.reduce((a, x) => a + x.boxes, 0))} boxes in ${num(I.warehouses.length)} warehouses. <a href="#/inventory">Open Inventory</a>.</p></div>`;
  }
  return null;
}
{ const baseHome = EM.VIEWS.home; EM.VIEWS.home = () => { const k = D.access.dash; return (k && holds() && EM.div !== 'retail' && roleDash(k)) || baseHome(); }; EM.VIEWS.home.title = () => 'Home'; }
const scopeLabel = () => ({ all: 'sees both companies', division: `sees all of ${D.user.division === 'both' ? 'both companies' : DIVS[D.user.division].name}`, region: `sees the ${D.user.region || ''} region`, own: 'sees your records and those of everyone who reports to you', none: 'no business records' })[acc().scope] || '';

/* What is still to come, said plainly instead of shown as numbers. */
const SOON = {
  sales: ['Invoices, outstanding and ledgers', 'Tally. Orders are taken here; invoices, payments and outstanding will be read from Tally.'],
  calls: ['Calls and telecalling', 'Runo, through its API key.'],
  visits: ['Field visits', 'Sales Diary, once the vendor shares its API documentation.'],
  whatsapp: ['WhatsApp messages', 'The WhatsApp Business number and Meta approval.'],
  ads: ['Ad and portal leads', 'Meta, Google, IndiaMART and JustDial lead feeds.'],
  ai: ['AI lead screening and the call agent', 'The leads feed above, a telephony number and DLT registration.'],
  targets: ['Invoices filled in from Tally (targets and Priority 200)', 'Tally. Targets and Priority 200 already count the invoices recorded here (Fulfilment, at Invoiced); once Tally is connected it fills those invoices in by itself.'],
  stock: ['Fulfilment and production', 'Tally. Stock itself is kept in Inventory until Tally is connected.'],
};
const notConnectedCard = () => `<section class="card stack-s"><h3>Not connected yet</h3><p class="small muted">These parts of EGO Master show no figures until the system that feeds them is connected. Nothing here is estimated.</p>
  ${table(['Part', 'Waits for', ''], Object.values(SOON).map(([a, b]) => [esc(a), esc(b), '<span class="badge warn">Not connected yet</span>']))}</section>`;
/* the demo's screens, if a bookmark or an old link reaches them */
const DEMO_ROUTES = { worder: 'sales', fulfil: 'stock', targets: 'targets', champions: 'targets', leads: 'ads', lead: 'ads', inbox: 'whatsapp', cockpit: 'targets', automations: 'whatsapp', ai: 'ai', integrations: 'ai', app: 'visits', map: 'ai', tech: 'ai' };
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
const wonValue = id => D.opportunities.filter(o => o.client_id === id && o.stage === wonStage(o.pipeline, D.lists)).reduce((a, o) => a + (Number(o.value) || 0), 0);
/* each screen remembers its own search, so one typed in People does not filter Opportunities (11 Oct) */
EM.qByView = {};
Object.defineProperty(EM, 'clientQ', { get: () => EM.qByView[(location.hash.split('/')[1] || 'home')] || '', set: v => { EM.qByView[(location.hash.split('/')[1] || 'home')] = v; } });
const searchBox = ph => `<label class="field" style="max-width:420px"><span class="small muted">Search</span><input class="input" id="cq" value="${esc(EM.clientQ)}" placeholder="${ph}"></label>`;
const matches = (txt, mobiles) => { const q = EM.clientQ.toLowerCase(), qd = q.replace(/\D/g, ''); return !q || txt.toLowerCase().includes(q) || (qd.length >= 4 && mobiles.some(m => String(m || '').includes(qd))); };
function orgList(org, arg) {
  const all0 = org === 'dealer' ? DEALER_KINDS : ARCH_KINDS;
  const subs = org === 'dealer' ? [['all', 'All', all0], ['distributor', 'Distributors', ['distributor']], ['dealer', 'Dealers', ['dealer']], ['sub_dealer', 'Sub-dealers', ['sub_dealer']]]
    : [['all', 'All', all0], ['design_firm', 'Firms', ['design_firm']], ['architect', 'Solo architects', ['architect']]];
  const tab = subs.find(t => t[0] === arg) || subs[0];
  const all = D.clients.filter(c => all0.includes(c.kind) && inDiv(c));
  const ppF = org === 'dealer' ? EM.ppF || '' : '', ppOf = c => (c.extra || {}).project_partner || '';
  const rows = all.filter(c => tab[2].includes(c.kind) && (!ppF || (ppF === 'none' ? !ppOf(c) : ppOf(c) === ppF)) && matches(`${c.name} ${c.city} ${c.ref || ''} ${c.gst} ${(c.extra || {}).partner_capability || ''}`, [c.mobile]));
  const team = id => D.contacts.filter(k => k.client_id === id).length, open = id => D.opportunities.filter(o => o.client_id === id && !isClosed(o.pipeline, o.stage, D.lists)).length;
  const title = org === 'dealer' ? 'Dealers' : 'Architects', base = '#/' + (org === 'dealer' ? 'dealers' : 'architects');
  const rating = c => org === 'dealer' ? c.grade : (c.extra || {}).rating;
  return `<div class="stack">
    <div class="row between"><div class="stack-s"><div class="kicker">${org === 'dealer' ? 'Distributors, dealers and sub-dealers, each with its team' : 'Architect firms and solo architects, each with its team'}</div><h1>${title}</h1><p class="muted">${rows.length} of ${all.length} · ${esc(scopeLabel())}</p></div>
      <div class="row" style="flex-wrap:wrap"><a class="btn" href="#/import">Import from Excel</a>${(org === 'dealer' ? DEALER_KINDS : ARCH_KINDS).map((k, i) => `<button class="btn ${(tab[2].length === 1 ? tab[2][0] === k : i === (org === 'dealer' ? 1 : 0)) ? 'primary' : ''}" data-act="org-add" data-kind="${k}">+ Add ${esc(kindName(k).toLowerCase())}</button>`).join('')}</div></div>
    ${subtabs(base, tab[0], subs.map(([k, l, ks]) => [k, `${l} <span class="muted">${all.filter(c => ks.includes(c.kind)).length}</span>`]))}
    ${org === 'dealer' ? `<div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-pp-filter><label class="field" style="min-width:170px"><span class="small muted">Project Partner</span><select class="input" id="pp-f">${[['', 'Every dealer'], ['Yes', 'Yes'], ['Potential', 'Potential'], ['No', 'No'], ['none', 'Not filled']].map(([v, l]) => `<option value="${v}" ${ppF === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>` : ''}
    ${searchBox('Company name, city, mobile, GST, reference or Project Partner capability')}
    ${all.length ? (rows.length ? table(['Company', 'Type', ...(org === 'dealer' ? ['Served by', 'Project Partner'] : []), 'City', 'Rating', 'Team', 'Open opportunities', ...(D.access.prices ? ['Won value'] : []), 'Looked after by'], rows.slice(0, 300).map(c => ({ href: `#/client/${c.id}`,
      cells: [`<b>${esc(c.name)}</b><div class="small muted">${esc(c.ref || '')}</div>${EM.div === 'both' ? segBadge(c.division) : ''}`, esc(kindLabel(c.kind)), ...(org === 'dealer' ? [c.kind === 'sub_dealer' ? (CL()[c.parent_id] ? esc(CL()[c.parent_id].name) : '<span class="badge bad">No distributor</span>') : esc((DIVS[c.division] || DIVS.wholesale).co), ppOf(c) ? `<span class="badge ${ppOf(c) === 'Yes' ? 'ok' : ppOf(c) === 'Potential' ? 'info' : 'plain'}">${esc(ppOf(c))}</span>` : ''] : []), esc(c.city), esc(rating(c) || ''), team(c.id), open(c.id), ...(D.access.prices ? [money(wonValue(c.id))] : []), esc(staffName(c.owner_id))] })))
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
  const subs = [['all', 'All'], ...(allowedTab('dealers') ? [['dealer', 'At a dealer']] : []), ['architect', 'At an architect firm'], ['personal', 'Personal']];
  const tab = subs.find(t => t[0] === arg) || subs[0];
  const rows = all.filter(x => (tab[0] === 'all' || x.type === tab[0]) && matches(`${x.name} ${x.role} ${x.company ? x.company.name : ''} ${x.email}`, [x.mobile]));
  const TYPE = { dealer: 'Dealer', architect: 'Architect firm', personal: 'Personal' };
  return `<div class="stack">
    <div class="row between"><div class="stack-s"><div class="kicker">Everyone in one place</div><h1>People</h1><p class="muted">${rows.length} of ${all.length}. Every person belongs to a dealer, an architect firm, or is a personal contact.</p></div>
      <div class="row"><a class="btn" href="#/import">Import from Excel</a><button class="btn primary" data-act="person-add">+ Add person</button></div></div>
    ${subtabs('#/people', tab[0], subs.map(([k, l]) => [k, `${l} <span class="muted">${k === 'all' ? all.length : all.filter(x => x.type === k).length}</span>`]))}
    ${searchBox('Name, role, company, mobile or email')}
    ${all.length ? (rows.length ? table(['Name', 'Role', 'Belongs to', 'Type', 'Mobile', 'Email'], rows.slice(0, 400).map(x => ({ href: x.href,
      cells: [`<b>${esc(x.name)}</b>${x.resp ? `<div class="small muted">${esc(x.resp)}</div>` : ''}${EM.div === 'both' ? segBadge(x.company ? x.company.division : (CL()[x.id] || {}).division) : ''}`, esc(x.role), x.company ? esc(x.company.name) : '<span class="muted">Personal</span>', esc(TYPE[x.type]), esc(fmtMobile(x.mobile)), esc(x.email)] })))
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
  openClientForm(null, org === 'dealer' ? 'dealer' : 'design_firm', null, org === 'dealer' ? DEALER_KINDS : ARCH_KINDS, null, person);
});
EM.ACTIONS['person-save'] = async el => {
  const form = qs('#pf'), company = form.querySelector('[data-company-pick]').value;
  if (!company || company === '__new') return showErr('pf-err', 'Choose the company this person works at.');
  const input = withDials(readForm(form, CONTACT_FIELDS), CONTACT_FIELDS);
  const { errors } = cleanContact(input, ctxLocal());
  if (errors.length) return showErr('pf-err', errors);
  busy(el, true);
  try {
    const r = await API('POST', '/api/contacts', { ...input, client_id: company });
    D.contacts = D.contacts.filter(k => k.client_id !== company).concat(r.contacts);
    EM.closeModal(); EM.toast(`<b>${esc(input.name)} added</b><ul><li>${esc(CL()[company].name)}</li></ul>`);
    location.hash = `#/client/${company}/contacts`; EM.rerender();
  } catch (x) { busy(el, false); showErr('pf-err', x.errors || x.message); }
};
EM.ACTIONS['org-add'] = el => { const k = el.dataset.kind || (el.dataset.org === 'dealer' ? 'dealer' : 'design_firm'); openClientForm(null, k, null, DEALER_KINDS.includes(k) ? DEALER_KINDS : ARCH_KINDS); };

/* the add / edit form: the type decides the fields */
/* The add / edit form: the type decides the fields. `only` limits the types offered.
   A dealer or an architect firm is laid out in the order the team thinks in (3 Oct):
   company, point of contact, address, areas, business. Everything else waits under
   "More details", to be filled now or later. The company's mobile is its point of
   contact's: a company is always reached through a person. */
const FAMILIES = [DEALER_KINDS, ARCH_KINDS, PERSONAL_KINDS];
const kindName = k => PERSONAL_KINDS.includes(k) ? `Personal contact · ${DIVS[KINDS[k].division].co}` : k === 'architect' ? 'Solo architect' : k === 'design_firm' ? 'Architect firm' : KINDS[k].label;
const ORG_LAYOUT = [
  ['Company details', ['name', 'legal_name', 'gst']],
  ['Address', ['address', 'locality', 'city', 'state', 'pincode', 'addresses']],
  ['Area details', ['areas_covered', 'other_offices']],
  ['Business details', ['parent_id', 'owner_id', 'grade', 'rating', 'source', 'status', 'since', 'credit_limit', 'priority200', 'relationship', 'connected_dealers']],
];
const POC_FIELDS = CONTACT_FIELDS.filter(f => f.key !== 'is_primary');
const SERVE_NOTE = { dealer: 'A dealer orders from EGO Premium directly, order by order.', sub_dealer: 'A sub-dealer is a retailer served by a distributor: choose the distributor first.', distributor: 'A distributor keeps stock, has an assigned area and answers for its sales against the target. Its sub-dealers buy from it.' };
const personRow = (i, v = {}) => `<form class="card stack-s pf-row" data-scope data-i="${i}" onsubmit="return false"><div class="row between"><b>Another person</b><button class="btn sm ghost" data-act="ppl-del" data-i="${i}">Remove</button></div>
  <div class="fgrid">${POC_FIELDS.map(f => fieldHtml(f, v[f.key], 'pp' + i)).join('')}</div></form>`;
const fsHtml = (title, inner) => `<fieldset class="fs"><legend>${esc(title)}</legend>${inner}</fieldset>`;
function openClientForm(c, kind, keep, only, people, poc) {
  const fam = c ? FAMILIES.find(f => f.includes(c.kind)) : null;
  const kinds = c ? fam.filter(k => canDiv(KINDS[k].division)) : (only || kindsAllowed()).filter(k => kindsAllowed().includes(k));
  kind = kinds.includes(kind) ? kind : (c ? c.kind : kinds[0]);
  const v = keep || (c ? { ...c, ...c.extra } : { owner_id: me().id, status: 'Active' });
  const all = showFields(fieldsFor(kind)).filter(f => f.key !== 'kind').map(f => ({ ...f, label: labelFor(f, kind) }));
  const org = DEALER_KINDS.includes(kind) ? 'dealer' : ARCH_KINDS.includes(kind) ? 'architect' : null;
  const noun = org ? kindName(kind).toLowerCase() : 'person';
  const fh = f => fieldHtml(f, v[f.key], 'cf', { self: c && c.id });
  const kindPick = `<div class="field span2"><span class="small muted">${org ? 'What are you adding?' : 'Type'}</span><div class="seg-kind" role="radiogroup" aria-label="Type">${kinds.map(k => `<label><input type="radio" name="kind" value="${k}" data-kind-pick ${k === kind ? 'checked' : ''}> ${esc(kindName(k))}</label>`).join('')}</div></div>
    ${KINDS[kind].division === 'both' ? `<div class="field"><span class="small muted">Kept by</span><div>${segBadge(c ? c.division : EM.div)}</div></div>` : ''}`;
  let body;
  if (org) {
    const placed = new Set(), pick = keys => keys.map(k => all.find(f => f.key === k)).filter(Boolean).map(f => (placed.add(f.key), f));
    /* editing: the company's own numbers stay editable; adding: its mobile comes from the point of contact */
    const contactKeys = ['mobile', 'whatsapp', 'mobile_alt', 'email'];
    if (!c) placed.add('mobile');
    const secs = ORG_LAYOUT.map(([t, keys]) => [t, pick(t === 'Company details' && c ? [...keys, ...contactKeys] : keys)]);
    const rest = all.filter(f => !placed.has(f.key)), restSecs = [...new Set(rest.map(f => f.section))];
    const pocBlock = c ? '' : fsHtml('Point of contact', `<p class="small muted">The person you deal with. Their mobile is the company's mobile, and they become the main person in its team.</p>
      <div id="pocf" data-scope class="fgrid">${POC_FIELDS.map(f => fieldHtml({ ...f, req: f.key === 'name' || f.key === 'mobile' }, (poc || {})[f.key], 'poc')).join('')}</div>`);
    body = fsHtml(secs[0][0], `<div class="fgrid">${kindPick}${secs[0][1].map(fh).join('')}</div>`) + pocBlock
      + secs.slice(1).filter(([, fs]) => fs.length).map(([t, fs]) => fsHtml(t, `${t === 'Business details' && SERVE_NOTE[kind] ? `<p class="small muted" data-serve-note>${SERVE_NOTE[kind]}</p>` : ''}<div class="fgrid">${fs.map(fh).join('')}</div>`)).join('')
      + (rest.length ? `<details class="more"><summary>More details (optional): ${esc(restSecs.join(', ').toLowerCase())}</summary><div class="stack-s">${restSecs.map(sc => fsHtml(sc, `<div class="fgrid">${rest.filter(f => f.section === sc).map(fh).join('')}</div>`)).join('')}</div></details>` : '')
      + (c ? '' : `<details class="more" ${people && people.length ? 'open' : ''}><summary>More people at this ${esc(noun)} (optional)</summary><div id="ppl" class="stack-s">${(people || []).map((pv, i) => personRow(i, pv)).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm" data-act="ppl-add">+ Add a person</button></div></details>`);
  } else {
    const sections = [...new Set(all.map(f => f.section))];
    body = `<div class="fgrid">${kindPick}</div>` + sections.map(sc => fsHtml(sc, `<div class="fgrid">${all.filter(f => f.section === sc).map(fh).join('')}</div>`)).join('');
  }
  EM.modal(`<h2>${c ? 'Edit ' + esc(c.name) : `Add a ${esc(noun)}`}</h2>
    <p class="muted small">Compulsory fields end with a star.${org && !c ? ' Fill the five parts below; the rest can wait and be added later from its page.' : ''}</p>
    <div id="cf" data-scope class="stack" style="margin-top:14px" data-id="${c ? c.id : ''}" data-only="${(only || []).join(',')}">${body}</div>
    ${errBox('cf-err')}
    <div class="row sticky-actions" style="margin-top:14px"><button class="btn primary" data-act="client-save">${c ? 'Save changes' : `Add ${esc(noun)}`}</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
}
const readPeople = () => [...document.querySelectorAll('#ppl .pf-row')].map(f => withDials(readForm(f, POC_FIELDS), POC_FIELDS))
  .filter(pv => POC_FIELDS.some(f => String(pv[f.key] || '').trim() && !(f.type === 'mobile' && pv[f.key] === '')));
const readPoc = () => qs('#pocf') ? withDials(readForm(qs('#pocf'), POC_FIELDS), POC_FIELDS) : null;
EM.ACTIONS['ppl-add'] = () => { const box = qs('#ppl'), n = box.querySelectorAll('.pf-row').length; box.insertAdjacentHTML('beforeend', personRow(n)); };
EM.ACTIONS['ppl-del'] = el => { const f = el.closest('.pf-row'); if (f) f.remove(); };
document.addEventListener('change', e => {
  if (!e.target.matches('[data-kind-pick]')) return;
  const form = qs('#cf'), id = form.dataset.id, c = id ? CL()[id] : null;
  const prev = readForm(form, CLIENT_FIELDS);
  const dv = form.querySelector('[name="division"]'); if (dv) prev.division = dv.value;
  for (const f of CLIENT_FIELDS) if (f.type === 'mobile' && prev[f.key]) { const r = normMobile(prev[f.key], prev[f.key + '_dial']); if (r.value) prev[f.key] = r.value; }
  const only = form.dataset.only ? form.dataset.only.split(',') : null;
  openClientForm(c, e.target.value, prev, only, qs('#ppl') ? readPeople() : null, readPoc());
});
EM.ACTIONS['client-add'] = el => openClientForm(null, el.dataset.kind);
EM.ACTIONS['client-edit'] = el => openClientForm(CL()[el.dataset.id], CL()[el.dataset.id].kind);
EM.ACTIONS['client-save'] = async el => {
  const form = qs('#cf'), id = form.dataset.id, kind = (form.querySelector('[data-kind-pick]:checked') || {}).value;
  const input = readForm(form, fieldsFor(kind));
  input.kind = kind;
  const dv = form.querySelector('[name="division"]');
  if (dv) input.division = dv.value;
  else if (KINDS[kind].division === 'both' && !id) input.division = EM.div;
  const poc = readPoc(), pre = [], people = qs('#ppl') ? readPeople() : [];
  if (poc) {   /* the company is reached through its point of contact */
    const r = cleanContact(poc, ctxLocal());
    r.errors.forEach(x => pre.push('Point of contact: ' + x));
    if (!r.errors.length) { input.mobile = poc.mobile; if (!input.whatsapp) input.whatsapp = poc.whatsapp || ''; if (!input.email) input.email = poc.email || ''; }
  }
  let { errors } = cleanClient(input, ctxLocal());
  if (poc) errors = errors.filter(x => !/^Mobile /.test(x));   // said once, as the point of contact's
  errors = [...pre, ...errors];
  people.forEach((pv, i) => { const r = cleanContact(pv, ctxLocal()); if (r.errors.length) errors.push(`Person ${i + 2}: ${r.errors.join(', ')}`); });
  if (errors.length) return showErr('cf-err', errors);
  if (id) input.id = id;
  const team = poc ? [{ ...poc, is_primary: 'Yes' }, ...people] : people;
  if (team.length) input.people = team;
  busy(el, true);
  try {
    const r = await API('POST', '/api/clients', input);
    upsertLocal(D.clients, r.client);
    if (r.contacts) D.contacts = D.contacts.filter(k => k.client_id !== r.client.id).concat(r.contacts);
    if (r.followups) fuApply(r);
    EM.closeModal();
    EM.toast(`<b>${esc(r.client.name)} ${r.created ? 'added' : 'saved'}</b><ul><li>${esc(kindLabel(r.client.kind))} · ${esc(r.client.city)} · ${esc(r.client.ref || '')}</li>${r.created && team.length ? `<li>${team.length} ${team.length === 1 ? 'person' : 'people'} in the team${poc ? `, ${esc(poc.name)} as the point of contact` : ''}</li>` : ''}<li>Saved to EGO Master</li></ul>`);
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
  const nOrd = buildOrders().filter(x => x.client_id === id).length;
  const tabs = [['overview', 'Overview'], ['activity', 'Activity'], ['orders', `Orders (${nOrd})`], ['contacts', `${org ? 'Team' : 'Contacts'} (${cts.length})`], ['opps', `Opportunities (${ops.length})`], ['docs', `Documents (${docs.length})`], ['history', 'History']];
  if (DEALER_KINDS.includes(c.kind)) tabs.splice(6, 0, ...dealerTabs(c));   // batch 4: leads, development plan, portal logins
  const body = { overview: clientOverview, activity: c2 => activityPanel({ clientId: c2.id }), orders: clientOrders, contacts: clientContacts, opps: clientOpps, docs: clientDocs, history: () => '<div id="hist"><p class="muted">Loading the history…</p></div>', ...(DEALER_KINDS.includes(c.kind) ? DEALER_TAB_BODY : {}) }[tab] || clientOverview;
  const home = homeOf(c);
  return `<div class="stack">${crumbs(home, [c.name])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(c.name)}</h1>
      <div class="row"><span class="badge info plain">${esc(kindLabel(c.kind))}</span>${c.grade || (c.extra || {}).rating ? `<span class="badge plain">Rating ${esc(c.grade || c.extra.rating)}</span>` : ''}${KINDS[c.kind].division === 'both' ? `<span class="badge plain">${esc(c.division === 'both' ? 'Both companies' : DIVS[c.division].co)}</span>` : ''}${DEALER_KINDS.includes(c.kind) ? `<span class="badge ${(c.extra || {}).project_partner === 'Yes' ? 'ok' : (c.extra || {}).project_partner === 'Potential' ? 'info' : 'plain'}" data-pp-badge>Project Partner: ${esc((c.extra || {}).project_partner || 'not filled')}</span>` : ''}<span class="badge plain">${esc(c.status || 'Active')}</span><span class="small muted">${esc(c.ref || '')}</span></div>
      <p class="muted">${esc(fmtMobile(c.mobile))} · ${esc(c.city)}${c.region ? ', ' + esc(c.region) : ''} · owner ${esc(staffName(c.owner_id))}</p></div>
      <div class="row"><button class="btn" data-act="client-edit" data-id="${id}">Edit</button><button class="btn" data-act="fu-add" data-client="${id}">+ Follow-up</button><button class="btn primary" data-act="opp-add" data-client="${id}">+ Opportunity</button>${D.access.can_delete ? `<button class="btn ghost" data-act="client-del" data-id="${id}">Delete</button>` : ''}</div></div>
    ${subtabs(`#/client/${id}`, tab, tabs)}
    ${body(c, cts, ops, docs)}</div>`;
};
/* who serves a dealer company (onboarding answers): a sub-dealer its distributor, a dealer EGO directly */
const servedBy = c => c.kind === 'sub_dealer' ? (CL()[c.parent_id] ? `<a href="#/client/${c.parent_id}">${esc(CL()[c.parent_id].name)}</a> <span class="small muted">distributor</span>` : '<span class="badge bad">No distributor chosen</span>')
  : c.kind === 'dealer' ? 'EGO Premium directly' : c.kind === 'distributor' ? 'EGO Premium directly (serves its sub-dealers)' : '';
const homeOf = c => DEALER_KINDS.includes(c.kind) ? ['Dealers', '#/dealers'] : ARCH_KINDS.includes(c.kind) ? ['Architects', '#/architects'] : ['People', '#/people'];
/* the menu highlights the portal the record belongs to */
Object.defineProperty(EM.VIEWS.client, 'tab', { get() { const c = CL()[(location.hash.split('/')[2] || '')]; return c ? homeOf(c)[1].slice(2) : 'people'; } });
EM.VIEWS.client.title = a => (CL()[a.split('/')[0]] || { name: 'Client' }).name;
EM.VIEWS.client.after = arg => { const [id, tab] = arg.split('/'); if (tab === 'history') loadHistory(id); };

function clientOverview(c) {
  const v = { ...c, ...c.extra }, fields = showFields(fieldsFor(c.kind)).filter(f => f.key !== 'kind');
  const sections = [...new Set(fields.map(f => f.section))];
  const kids = D.clients.filter(x => x.parent_id === c.id || x.firm_id === c.id || x.architect_id === c.id);
  return `<div class="grid g2">${DEALER_KINDS.includes(c.kind) ? `<section class="card stack-s" data-served><h3>Who serves them</h3>${kv([['Served by', servedBy(c)], ...(c.kind === 'distributor' ? [['Sub-dealers they serve', String(kids.filter(x => x.kind === 'sub_dealer').length)], ['Assigned area', showVal({ type: 'cities' }, v.areas_covered)]] : [])])}</section>` : ''}
    ${sections.map(s => `<section class="card stack-s"><h3>${esc(s)}</h3>${kv(fields.filter(f => f.section === s).map(f => [esc(labelFor(f, c.kind)), showVal(f, v[f.key])]))}</section>`).join('')}
    ${['dealer', 'architect', 'firm'].includes(KINDS[c.kind].group) ? businessCard(c) : ''}
    ${KINDS[c.kind].group === 'dealer' ? `<section class="card stack-s"><h3>Sales, outstanding and orders</h3><span class="badge warn">Not connected yet</span><p class="small muted">These come from Tally invoices once Tally is connected. Nothing is shown until then, so no figure here is ever typed or estimated.</p></section>` : ''}
    ${kids.length ? `<section class="card stack-s"><h3>${c.kind === 'distributor' ? 'Sub-dealers they serve' : 'Linked to ' + esc(c.name)}</h3>${table(['Name', 'Type', 'City'], kids.map(x => ({ href: `#/client/${x.id}`, cells: [esc(x.name), esc(kindLabel(x.kind)), esc(x.city)] })))}</section>` : ''}
    ${c.prices_hidden ? '<p class="small muted">Money fields are hidden for your role.</p>' : ''}</div>`;
}
/* what this company brings, counted only from saved opportunities */
function businessCard(c) {
  const ops = D.opportunities.filter(o => o.client_id === c.id), won = ops.filter(o => o.stage === wonStage(o.pipeline, D.lists)), open = ops.filter(o => !isClosed(o.pipeline, o.stage, D.lists));
  const sum = a => a.reduce((t, o) => t + (Number(o.value) || 0), 0);
  const by = {};
  for (const o of won) { const k = o.contact_id || ''; by[k] = (by[k] || 0) + (Number(o.value) || 0); }
  const who = Object.entries(by).filter(([k]) => k).map(([k, v]) => [esc((D.contacts.find(x => x.id === k) || { name: 'Removed' }).name), D.access.prices ? money(v) : '']);
  return `<section class="card stack-s"><h3>Business from ${esc(c.name)}</h3>
    ${kv([['Team', String(D.contacts.filter(k => k.client_id === c.id).length)], ['Open opportunities', String(open.length) + (D.access.prices && open.length ? ` · ${money(sum(open))}` : '')], ['Won', String(won.length) + (D.access.prices && won.length ? ` · ${money(sum(won))}` : '')]])}
    ${who.length ? `<div class="small muted">Won business by the person who brought it</div>${kv(who)}` : ''}
    <p class="small muted">Counted from opportunities saved here. Invoice revenue needs Tally, which is not connected yet.</p></section>`;
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
const stageBadge = s => `<span class="badge ${Object.keys(PIPELINES).some(p => wonStage(p, D.lists) === s) ? 'ok' : Object.keys(PIPELINES).some(p => lostStage(p, D.lists) === s) ? 'bad' : 'info'}">${esc(s)}</span>`;
function clientDocs(c, cts, ops, docs) {
  return filesBox({ id: 'cl', client: c.id, types: DOC_TYPES, docs, title: 'Add documents', canAdd: true, showOrder: true,
    emptyTitle: 'No documents yet', emptyText: 'GST certificate, cheque, agreement, shop and display photos go here. PI and invoices added on an order show here too.' });
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
  EM.modal(`<h2>Delete ${esc(c.name)}?</h2><p class="muted">Its contacts, opportunities, files and follow-ups go with it, into the Recycle bin for 30 days. An Owner can put it all back from there.</p>${errBox('del-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="client-del-go" data-id="${c.id}">Delete</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['client-del-go'] = async el => {
  const id = el.dataset.id; busy(el, true);
  try {
    await API('DELETE', '/api/clients/' + id);
    D.clients = D.clients.filter(c => c.id !== id); D.contacts = D.contacts.filter(k => k.client_id !== id);
    const gone = new Set(D.opportunities.filter(o => o.client_id === id).map(o => o.id));
    D.opportunities = D.opportunities.filter(o => !gone.has(o.id)); D.history = D.history.filter(h => !gone.has(h.opp_id)); D.documents = D.documents.filter(d => d.client_id !== id);
    D.followups = FUS().filter(f => f.client_id !== id); D.activities = ACTS().filter(a => a.client_id !== id);
    EM.closeModal(); EM.toast('Moved to the Recycle bin for 30 days.'); location.hash = '#/people';
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
  try { await API('DELETE', '/api/contacts/' + k.id); D.contacts = D.contacts.filter(x => x.id !== k.id); D.opportunities.forEach(o => { if (o.contact_id === k.id) o.contact_id = ''; }); EM.toast(`${esc(k.name)} removed, in the Recycle bin for 30 days.`); EM.rerender(); } catch (x) { EM.toast(esc(x.message)); }
};

/* ---------------------------------------------------------------- files: ONE upload for every kept file (13 Oct)
   Bhargav: "the agenda is the functionality and making sure that this is easy to use". Every upload takes
   many files at once; every file has View (opens in the browser, never downloads), Download (its real
   name) and Share (WhatsApp, email, any app) through a link that opens without signing in, for 7 days
   unless changed. Used by a client's Documents and by PI / invoices on a fulfilment order. Excel import
   is the one single-file input: it is read, not kept. */
const FILE_ACCEPT = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt';
const OFFICE_RE = /\.(docx?|xlsx?|pptx?)$/i;
const kb = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB';
const mayRemoveDoc = d => d.order_id ? (D.access.ful || []).includes('money') : true;
function filesBox(o) {   // o: { id, client, order, types, docs, canAdd, tags, title, note, showOrder, emptyTitle, emptyText }
  const P = D.access.prices, tagCols = o.tags || o.docs.some(d => d.doc_no || d.doc_date), b = 'fu-' + o.id, ordOf = id => allOrders().find(x => x.id === id);
  const form = o.canAdd ? `<form class="card stack-s" data-fu-box="${o.id}" onsubmit="return false"><h3>${esc(o.title || 'Add files')}</h3>${o.note ? `<p class="small muted">${o.note}</p>` : ''}<div class="fgrid">
      <div class="field" data-field="doc_type"><label for="${b}-type">What it is</label><select class="input" id="${b}-type" data-keep-order>${o.types.map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
      ${o.tags ? `<div class="field" data-field="doc_no"><label for="${b}-no">Number (optional)</label><input class="input" id="${b}-no" placeholder="e.g. PI/2026/0142"></div>
      <div class="field" data-field="doc_date"><label for="${b}-date">Date (optional)</label><input class="input" type="date" id="${b}-date"></div>
      ${P ? `<div class="field" data-field="doc_amount"><label for="${b}-amt">Amount (optional)</label>${G.adorn({ type: 'money', key: 'amount' }, `<input class="input" type="number" min="0" step="0.01" id="${b}-amt">`)}</div>` : ''}`
    : `<div class="field" data-field="doc_name"><label for="${b}-name">Name (optional)</label><input class="input" id="${b}-name" placeholder="e.g. GST certificate 2026"></div>`}
      <div class="field span2" data-field="doc_files"><label for="${b}-file">Files: one or many, up to 25 MB each</label><input class="input" id="${b}-file" type="file" multiple accept="${FILE_ACCEPT}"></div></div>
      ${errBox(b + '-err')}<div class="row"><button class="btn primary" data-act="fu-up" data-box="${o.id}" data-client="${o.client || ''}" data-order="${o.order || ''}" data-followup="${o.followup || ''}" data-plan="${o.plan || ''}" data-project="${o.project || ''}">Upload</button></div></form>` : '';
  const rows = o.docs.slice().sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
  const list = rows.length ? table(['File', 'What it is', ...(tagCols ? ['Number', 'Date', ...(P ? ['Amount'] : [])] : []), ...(o.showOrder ? ['On order'] : []), 'Size', 'Added', ''], rows.map(d => [
    `<b>${esc(d.name)}</b>${d.file_name && d.file_name !== d.name ? `<div class="small muted">${esc(d.file_name)}</div>` : ''}`, esc(d.type), ...(tagCols ? [esc(d.doc_no || ''), d.doc_date ? ds(d.doc_date) : '', ...(P ? [d.amount != null ? inr0(d.amount) : ''] : [])] : []),
    ...(o.showOrder ? [d.order_id && ordOf(d.order_id) ? `<a href="#/order/${d.order_id}">${esc(ordOf(d.order_id).ref)}</a>` : ''] : []), kb(d.size), `${ds(String(d.created_at).slice(0, 10))} · ${esc(staffName(d.uploaded_by))}`,
    `<div class="row" style="gap:6px;flex-wrap:nowrap" data-file-acts><button class="btn sm" data-act="fu-view" data-id="${d.id}">View</button><button class="btn sm ghost" data-act="fu-dl" data-id="${d.id}">Download</button><button class="btn sm ghost" data-act="fu-share" data-id="${d.id}">Share</button>${mayRemoveDoc(d) ? `<button class="btn sm ghost" data-act="fu-del" data-id="${d.id}">Remove</button>` : ''}</div>`]))
    : empty(o.emptyTitle || 'No files yet', o.emptyText || '');
  return `<div class="stack-s" data-files="${o.id}">${form}${list}</div>`;
}
EM.ACTIONS['fu-up'] = async el => {
  const b = 'fu-' + el.dataset.box, files = [...qs('#' + b + '-file').files], v = id => (qs('#' + b + '-' + id) || { value: '' }).value;
  if (!files.length) return showErr(b + '-err', 'Choose one or more files first.');
  if (files.length > 10) return showErr(b + '-err', 'Up to 10 files at a time.');
  const big = files.find(f => f.size > 25 * 1024 * 1024); if (big) return showErr(b + '-err', `${big.name} is over 25 MB.`);
  const fd = new FormData(); files.forEach(f => fd.append('file', f));
  fd.append('type', v('type')); fd.append('name', v('name')); fd.append('doc_no', v('no')); fd.append('doc_date', v('date')); fd.append('amount', v('amt'));
  if (el.dataset.order) fd.append('order_id', el.dataset.order); else if (el.dataset.followup) fd.append('followup_id', el.dataset.followup); else if (el.dataset.plan) fd.append('plan_id', el.dataset.plan); else if (el.dataset.project) fd.append('project_id', el.dataset.project); else fd.append('client_id', el.dataset.client);
  busy(el, true);
  try { const r = await API('POST', '/api/documents', fd, true); D.documents.push(...r.documents); EM.toast(`<b>${r.documents.length} file${r.documents.length === 1 ? '' : 's'}</b> uploaded.`);
    const box = el.dataset.followup && el.closest('#overlay [data-files]'); if (box) box.outerHTML = fuFilesBox(el.dataset.followup); else EM.rerender(); }
  catch (x) { busy(el, false); showErr(b + '-err', x.message); }
};
const docTok = () => { try { return localStorage.getItem('ego-live-token') || ''; } catch (e) { return window.__egoTok || ''; } };
const docLink = (id, b) => API('POST', `/api/documents/${id}/share`, b);
/* View: opens in the browser. PDF, photos and text inline; Word, Excel and PowerPoint in Microsoft's free web viewer */
EM.ACTIONS['fu-view'] = async el => {
  const d = D.documents.find(x => x.id === el.dataset.id), w = window.open('', '_blank');
  try {
    const { url } = await docLink(d.id, { view: true });
    const go = OFFICE_RE.test(d.file_name || d.name) ? 'https://view.officeapps.live.com/op/view.aspx?src=' + encodeURIComponent(url) : url;
    if (w) w.location = go; else location.href = go;
  } catch (x) { if (w) w.close(); bubbleNear(el, x.message); }
};
async function docBlob(d) {
  const res = await fetch(window.EGOAPI.file(d.id) + '?dl=1', { headers: { authorization: 'Bearer ' + docTok() } });
  if (!res.ok) throw new Error('Could not get the file.');
  return res.blob();
}
EM.ACTIONS['fu-dl'] = async el => {
  const d = D.documents.find(x => x.id === el.dataset.id);
  busy(el, true);
  try { const u = URL.createObjectURL(await docBlob(d)), a = document.createElement('a'); a.href = u; a.download = d.file_name || d.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); }
  catch (x) { bubbleNear(el, x.message); }
  busy(el, false);
};
/* Share: a link anyone can open without signing in, until it expires */
EM.share = null;
async function shareModal(d, days) {
  const r = await docLink(d.id, { days });
  EM.share = { d, url: r.url, expires: r.expires, file: EM.share && EM.share.d.id === d.id ? EM.share.file : null };
  const text = `${d.name}: ${r.url}`, until = whenTxt(r.expires);
  EM.modal(`<h2>Share ${esc(d.name)}</h2><p class="muted" data-share-note>Anyone with this link can open the file until <b>${esc(until)}</b>, without signing in to EGO Master. Send it only to the person who needs it.</p>
    <div class="fgrid" style="margin-top:12px"><div class="field span2"><label for="sh-url">Link</label><input class="input" id="sh-url" readonly value="${esc(r.url)}"></div>
      <div class="field"><label for="sh-days">The link works for</label><select class="input" id="sh-days" data-share-days="${d.id}" data-keep-order>${[1, 3, 7, 14, 30].map(n => `<option value="${n}" ${n === r.days ? 'selected' : ''}>${n} day${n === 1 ? '' : 's'}</option>`).join('')}</select></div></div>
    <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn primary" data-act="fu-share-native">Share to any app</button>
      <a class="btn" target="_blank" rel="noopener" data-share-wa href="https://wa.me/?text=${encodeURIComponent(text)}">WhatsApp</a>
      <a class="btn" data-share-mail href="mailto:?subject=${encodeURIComponent(d.name)}&body=${encodeURIComponent(`${d.name}\n\n${r.url}\n\nThe link works until ${until}.`)}">Email</a>
      <button class="btn ghost" data-act="fu-share-copy">Copy link</button><button class="btn ghost" data-act="close-modal">Close</button></div>`);
  /* the file itself is fetched now, so "Share to any app" can attach it at once (phones allow that only straight after a tap) */
  if (!EM.share.file && d.size <= 15 * 1024 * 1024) docBlob(d).then(bl => { if (EM.share && EM.share.d.id === d.id) EM.share.file = new File([bl], d.file_name || d.name, { type: d.mime || bl.type }); }).catch(() => {});
}
EM.ACTIONS['fu-share'] = async el => { busy(el, true); try { EM.share = null; await shareModal(D.documents.find(x => x.id === el.dataset.id), 7); } catch (x) { bubbleNear(el, x.message); } busy(el, false); };
document.addEventListener('change', e => { if (e.target.matches('[data-share-days]')) shareModal(D.documents.find(x => x.id === e.target.dataset.shareDays), Number(e.target.value)).catch(x => EM.toast(esc(x.message))); });
EM.ACTIONS['fu-share-native'] = async el => {
  const S = EM.share; if (!S) return;
  const data = { title: S.d.name, text: `${S.d.name} (link works until ${whenTxt(S.expires)})`, url: S.url };
  try {
    if (S.file && navigator.canShare && navigator.canShare({ files: [S.file] })) await navigator.share({ files: [S.file], title: S.d.name, text: `${S.d.name}: ${S.url}` });
    else if (navigator.share) await navigator.share(data);
    else { await EM.ACTIONS['fu-share-copy'](el); bubbleNear(el, 'This browser has no share menu. The link is copied: paste it into any app.'); }
  } catch (x) { if (x && x.name !== 'AbortError') bubbleNear(el, 'Could not open the share menu. Use WhatsApp, Email or Copy link.'); }
};
EM.ACTIONS['fu-share-copy'] = async el => { const S = EM.share; if (!S) return; try { await navigator.clipboard.writeText(S.url); EM.toast('Link copied'); } catch (x) { const i = qs('#sh-url'); if (i) { i.select(); document.execCommand('copy'); EM.toast('Link copied'); } } };
EM.ACTIONS['fu-del'] = async el => {
  const d = D.documents.find(x => x.id === el.dataset.id);
  if (!confirm(`Remove ${d.name}?`)) return;
  try { await API('DELETE', '/api/documents/' + d.id); D.documents = D.documents.filter(x => x.id !== d.id); EM.toast(`${esc(d.name)} removed, in the Recycle bin for 30 days.`); EM.rerender(); } catch (x) { bubbleNear(el, x.message); }
};

/* R2b: telesales' "From field sales" list: every open Requirement from a field phone that is theirs, newest first */
function fieldReqCard(opps) {
  const rows = opps.filter(o => fromField(o) && !isClosed(o.pipeline, o.stage, D.lists)).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return `<section class="card stack-s" data-field-reqs><div class="row between"><h3>From field sales <span class="muted">${num(rows.length)}</span></h3><a class="btn sm" href="#/opps" data-act="opp-field-on">All in Opportunities</a></div>
    <p class="small muted">Requirements saved at a visit by field sales. Call them, hand a consumer lead to a dealer, or let EGO fulfil it.</p>
    ${rows.length ? table(['Requirement', 'Who', 'Raised by', 'Saved', 'Stage'], rows.slice(0, 30).map(o => ({ href: '#/opp/' + o.id, cells: [`<b>${esc(o.title)}</b><div class="small muted">${esc(PIPELINES[o.pipeline].label)}${o.extra.area_sqft ? ` · ${num(o.extra.area_sqft)} sq ft` : ''}</div>`, esc(o.c_name || clientName(o.client_id)), esc(staffName(o.extra.raised_by)), esc(ds(dayIST(o.created_at))), `<span class="badge info">${esc(o.stage)}</span>`] })))
      : '<p class="small muted">None waiting. A Requirement saved on a field sales phone shows here at once, and rings your bell.</p>'}</section>`;
}
EM.ACTIONS['opp-field-on'] = () => { EM.oppField = true; location.hash = '#/opps'; };
/* ---------------------------------------------------------------- opportunities */
const pipesAllowed = () => Object.keys(PIPELINES).filter(p => canDiv(PIPELINES[p].division) && (EM.div === 'both' || PIPELINES[p].division === EM.div));
EM.oppMine = false; EM.oppField = false;
/* R2b: a Requirement saved on a field sales phone is an opportunity with who raised it */
const fromField = o => !!(o && o.extra && o.extra.raised_by);
EM.VIEWS.opps = arg => {
  const ps = pipesAllowed();
  if (!ps.length) return EM.noAccess('No pipeline is open to your role.');
  const p = ps.includes(arg) ? arg : ps[0];
  const all = D.opportunities.filter(o => o.pipeline === p && (!EM.oppMine || o.owner_id === me().id) && (!EM.oppField || fromField(o)) && matches(`${o.title} ${o.ref || ''} ${(CL()[o.client_id] || {}).name || ''} ${staffName(o.owner_id)} ${o.next_action || ''} ${(PJS().find(x => x.id === o.project_id) || {}).name || ''} ${o.dealer_id ? (DDIR().find(d => d.id === o.dealer_id) || {}).name || '' : ''}`, [(CL()[o.client_id] || {}).mobile]));
  const stages = D.lists.stages[p] || [];
  const t = today();
  const card = o => `<div class="mini" data-href="#/opp/${o.id}" tabindex="0"><b>${esc(o.title)}</b><div class="small muted">${esc((CL()[o.client_id] || {}).name || '')}</div>${o.project_id && PJS().find(x => x.id === o.project_id) ? `<div class="small">Project: ${esc(PJS().find(x => x.id === o.project_id).name)}</div>` : ''}${o.dealer_id ? `<div class="small">Dealer: ${esc((DDIR().find(d => d.id === o.dealer_id) || { name: 'outside your view' }).name)}</div>` : ''}
    ${fromField(o) ? `<div class="small"><span class="badge info">From field sales</span> ${esc(staffName(o.extra.raised_by))}</div>` : ''}<div class="small">${D.access.prices && o.value != null ? money(o.value) + ' · ' : ''}${esc(staffName(o.owner_id))}</div>${o.next_date ? `<div class="small ${o.next_date < t && !isClosed(o.pipeline, o.stage, D.lists) ? 'err' : 'muted'}">${esc(o.next_action || 'Next action')} · ${ds(o.next_date)}</div>` : ''}<button class="btn sm ghost" data-act="fu-add" data-client="${o.client_id}" data-opp="${o.id}" style="margin-top:4px">+ Follow-up</button></div>`;
  return `<div class="stack">
    <div class="row between"><div class="stack-s"><div class="kicker">Each one linked to a dealer, an architect firm or a person</div><h1>Opportunities</h1><p class="muted">${all.length} ${esc(PIPELINES[p].plural.toLowerCase())} · ${esc(scopeLabel())}</p></div>
      <div class="row"><label class="chip" style="padding:8px 10px"><input type="checkbox" id="opp-mine" ${EM.oppMine ? 'checked' : ''}> Only mine</label><label class="chip" style="padding:8px 10px"><input type="checkbox" id="opp-field" ${EM.oppField ? 'checked' : ''}> From field sales</label><a class="btn" href="#/lost">Lost sales</a><button class="btn primary" data-act="opp-add" data-pipeline="${p}">+ Add opportunity</button></div></div>
    ${searchBox('Opportunity, company, project, dealer, owner or next action')}
    ${PIPELINES[p].dealer ? `<p class="small muted" data-retail-note>Consumer leads: telesales qualify each one, then allocate it to a dealer (the dealers in the person's city are suggested). The dealer accepts it and moves it on in the dealer portal. A lead with no move for ${escDays()} day${escDays() === 1 ? '' : 's'} goes to the dealer's field sales owner in the bell.</p>` : ''}
    ${subtabs('#/opps', p, ps.map(k => [k, `${PIPELINES[k].plural} <span class="muted">${D.opportunities.filter(o => o.pipeline === k).length}</span>`]))}
    <p class="small muted">The board shows what is live. A won or lost one stays until the end of the month it closed in; every order, old and new, is in <a href="#/orderbook">Orders</a>.</p>
    ${all.length ? '' : EM.clientQ ? '<p class="muted">Nothing matches that search.</p>' : `<p class="small muted">No ${esc(PIPELINES[p].plural.toLowerCase())} yet. Add one from here, or from a dealer, an architect firm or a person. The stages below come from Lists & stages.</p>`}
    ${stageBoard(stages, all.filter(o => !isClosed(o.pipeline, o.stage, D.lists) || thisMonth(o.closed_at || o.updated_at)), o => o.stage, card, ls => D.access.prices && ls.some(o => o.value) ? `<div class="small muted">${inr(ls.reduce((a, o) => a + (Number(o.value) || 0), 0))}</div>` : '')}</div>`;
};
EM.VIEWS.opps.title = () => 'Opportunities';
document.addEventListener('change', e => { if (e.target.id === 'opp-mine') { EM.oppMine = e.target.checked; EM.rerender(); } if (e.target.id === 'opp-field') { EM.oppField = e.target.checked; EM.rerender(); } });
document.addEventListener('change', e => { if (e.target.id === 'pp-f') { EM.ppF = e.target.value; EM.rerender(); } });

/* ---------------------------------------------------------------- Lost sales (13 Oct)
   Every lost opportunity in your view: why, the details, the value, who, which client, when, and the
   stage it was lost from. Every figure is counted from saved opportunities and their stage history.
   Opened from Opportunities (the menu stays short). */
EM.lostF = { period: 'all', from: '', to: '', reason: '', owner: '', seg: '', pipe: '', field: '', fq: '' };
const LOST_FIELDS = [['title', 'Opportunity'], ['client', 'Client'], ['reason', 'Reason'], ['detail', 'Details'], ['from', 'Lost from stage'], ['owner', 'Owner'], ['pipe', 'Pipeline']];
function lostRows() {
  return D.opportunities.filter(o => o.stage === lostStage(o.pipeline, D.lists) && (EM.div === 'both' || PIPELINES[o.pipeline].division === EM.div)).map(o => {
    const h = D.history.filter(x => x.opp_id === o.id && x.to_stage === o.stage).pop();
    return { o, at: (h && h.at) || o.closed_at || o.updated_at || '', from: h ? h.from_stage || '' : '', reason: o.lost_reason || '', detail: (o.extra || {}).lost_detail || '', value: Number(o.value) || 0,
      owner: staffName(o.owner_id), client: clientName(o.client_id), pipe: PIPELINES[o.pipeline].label, seg: PIPELINES[o.pipeline].division, title: o.title };
  });
}
function lostFiltered() {
  const f = EM.lostF, fq = f.fq.trim().toLowerCase();
  return lostRows().filter(r => inPeriod(r.at, f.period, f.from, f.to) && (!f.reason || r.reason === f.reason) && (!f.owner || r.o.owner_id === f.owner) && (!f.seg || r.seg === f.seg) && (!f.pipe || r.o.pipeline === f.pipe)
    && (!fq || (f.field ? [String(r[f.field] || '')] : LOST_FIELDS.map(([k]) => String(r[k] || ''))).some(v => v.toLowerCase().includes(fq)))
    && matches(`${r.title} ${r.o.ref || ''} ${r.client} ${r.reason} ${r.detail} ${r.owner} ${r.from}`, [(CL()[r.o.client_id] || {}).mobile])).sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
const sumBy = (rows, key) => { const m = {}; for (const r of rows) { const k = r[key] || 'Not given'; (m[k] = m[k] || { n: 0, v: 0 }); m[k].n++; m[k].v += r.value; } return Object.entries(m).sort((a, b) => b[1].n - a[1].n || b[1].v - a[1].v); };
EM.VIEWS.lost = () => {
  const f = EM.lostF, P = D.access.prices, all = lostRows(), rows = lostFiltered();
  const sel = (k, label, opts) => `<label class="field" style="min-width:160px"><span class="small muted">${label}</span><select class="input" data-lf="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const reasons = [...new Set([...(D.lists.lost_reasons || []), ...all.map(r => r.reason).filter(Boolean)])], owners = [...new Set(all.map(r => r.o.owner_id))].map(id => [id, staffName(id)]).sort((a, b) => a[1].localeCompare(b[1]));
  const pipes = Object.keys(PIPELINES).filter(p => EM.div === 'both' || PIPELINES[p].division === EM.div);
  const totals = (key, head) => { const t = sumBy(rows, key); return `<section class="card stack-s" data-lost-by="${key}"><h3>By ${head.toLowerCase()}</h3>${t.length ? table([head, 'Lost', ...(P ? ['Value'] : [])], t.map(([k, x]) => [esc(k), num(x.n), ...(P ? [inr0(x.v)] : [])])) : '<p class="small muted">Nothing for this filter.</p>'}</section>`; };
  const top = sumBy(rows, 'reason')[0];
  return `<div class="stack">${crumbs(['Opportunities', '#/opps'], ['Lost sales'])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">Why sales are lost, counted from saved opportunities</div><h1>Lost sales</h1>
      <p class="muted" style="max-width:780px">Every opportunity marked ${esc([...new Set(pipes.map(p => lostStage(p, D.lists)))].join(' / '))} in your view, with the reason and the details given when it was lost, and the stage it was lost from (from its stage history).</p></div>
      <button class="btn" data-act="lost-csv">Download for Excel</button></div>
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-lost-filters>${dateFilter(f, 'lost', 'When it was lost')}
      ${sel('reason', 'Reason', [['', 'Every reason'], ...reasons.map(r => [r, r])])}${sel('owner', 'Owner', [['', 'Everyone'], ...owners])}
      ${EM.div === 'both' ? sel('seg', 'Company', [['', 'EGO Premium and Big E'], ['wholesale', 'EGO Premium (wholesale)'], ['retail', 'Big E (retail)']]) : ''}${sel('pipe', 'Pipeline', [['', 'Every pipeline'], ...pipes.map(p => [p, PIPELINES[p].label])])}
      ${sel('field', 'Any field', [['', 'Any field'], ...LOST_FIELDS])}<label class="field" style="min-width:160px"><span class="small muted">contains</span><input class="input" id="lost-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
    ${searchBox('Opportunity, client, reason, details or owner')}
    <div class="grid g4">${tile('Lost', num(rows.length), rows.length !== all.length ? `of ${num(all.length)} in your view` : '')}${P ? tile('Value lost', inr0(rows.reduce((a, r) => a + r.value, 0))) : ''}${tile('Top reason', top ? esc(top[0]) : 'None', top ? `${top[1].n} lost` : '')}</div>
    <div class="grid g2">${totals('reason', 'Reason')}${totals('owner', 'Owner')}</div>
    ${rows.length ? table(['Lost on', 'Opportunity', 'Client', 'Lost from', 'Reason', 'Details', ...(P ? ['Value'] : []), 'Owner'], rows.slice(0, 500).map(r => ({ href: '#/opp/' + r.o.id,
      cells: [r.at ? ds(dayIST(r.at)) : '', `<b>${esc(r.title)}</b><div class="small muted">${esc(r.o.ref || '')} · ${esc(r.pipe)}</div>${EM.div === 'both' ? segBadge(r.seg) : ''}`, esc(r.client), esc(r.from) || '<span class="muted">Not recorded</span>', `<span class="badge bad">${esc(r.reason || 'Not given')}</span>`, esc(r.detail), ...(P ? [r.value ? inr0(r.value) : ''] : []), esc(r.owner)] })))
      + (rows.length > 500 ? `<p class="small muted">Showing 500 of ${rows.length}. Use the filters, or download all of them.</p>` : '')
      : empty(all.length ? 'Nothing lost for this filter' : 'No lost sales yet', all.length ? 'Change or clear the filters above.' : 'When an opportunity is moved to Lost, with its reason and details, it is listed here.')}</div>`;
};
EM.VIEWS.lost.tab = 'opps';
EM.VIEWS.lost.title = () => 'Lost sales';
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.lf; if (k) { EM.lostF[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'lost-fq') { EM.lostF.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#lost-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
/* the list as filtered, as a CSV file Excel opens (with the ₹ figures only for roles that see money) */
EM.ACTIONS['lost-csv'] = () => {
  const P = D.access.prices, cell = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const head = ['Lost on', 'Opportunity', 'Number', 'Client', 'Company', 'Pipeline', 'Lost from stage', 'Reason', 'Details', ...(P ? ['Value (Rs)'] : []), 'Owner'];
  const lines = lostFiltered().map(r => [r.at ? dayIST(r.at) : '', r.title, r.o.ref || '', r.client, r.seg === 'retail' ? 'Big E' : 'EGO Premium', r.pipe, r.from, r.reason, r.detail, ...(P ? [Math.round(r.value * 100) / 100] : []), r.owner]);
  const csv = '﻿' + [head, ...lines].map(l => l.map(cell).join(',')).join('\r\n');
  const u = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
  a.href = u; a.download = `EGO lost sales ${today()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000);
  EM.toast(`<b>${lines.length}</b> lost sale${lines.length === 1 ? '' : 's'} downloaded.`);
};

EM.VIEWS.opp = id => {
  const o = D.opportunities.find(x => x.id === id);
  if (!o) return `<div class="stack"><h1>Opportunity not found</h1><a class="btn" href="#/opps">Opportunities</a></div>`;
  const c = CL()[o.client_id] || { name: 'Client outside your view' }, v = { ...o, ...o.extra };
  const stages = D.lists.stages[o.pipeline] || [], hist = D.history.filter(h => h.opp_id === id);
  const at = stages.indexOf(o.stage);
  const fields = showFields(oppFieldsFor(o.pipeline)).filter(f => !['pipeline', 'title', 'stage', 'contact_id'].includes(f.key) && (!LOST_KEYS.includes(f.key) || o.stage === lostStage(o.pipeline, D.lists)));
  const contact = D.contacts.find(k => k.id === o.contact_id);
  return `<div class="stack">${crumbs(['Opportunities', `#/opps/${o.pipeline}`], [o.title])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(o.title)}</h1>
      <div class="row"><span class="badge info plain">${esc(PIPELINES[o.pipeline].label)}</span>${stageBadge(o.stage)}<span class="small muted">${esc(o.ref || '')}</span></div>
      <p class="muted"><a href="#/client/${o.client_id}">${esc(c.name)}</a>${contact ? ` · ${esc(contact.name)} ${esc(fmtMobile(contact.mobile))}` : ''}</p></div>
      <div class="row">${o.stage === wonStage(o.pipeline, D.lists) && o.pipeline !== 'wholesale' && allowedTab('installation') ? `<button class="btn primary" data-act="site-add" data-client="${o.client_id}" data-opp="${id}">Add installation site</button>` : ''}${PIPELINES[o.pipeline].dealer && !isClosed(o.pipeline, o.stage, D.lists) ? `<button class="btn ${o.dealer_id ? '' : 'primary'}" data-act="ld-move" data-id="${id}">${o.dealer_id ? 'Move to another dealer' : 'Allocate to a dealer'}</button>` : ''}<button class="btn" data-act="fu-add" data-client="${o.client_id}" data-opp="${id}">+ Follow-up</button><button class="btn" data-act="opp-edit" data-id="${id}">Edit</button>${D.access.can_delete ? `<button class="btn ghost" data-act="opp-del" data-id="${id}">Delete</button>` : ''}</div></div>
    <section class="card stack-s"><h3>Stage</h3><div class="flow">${stages.map((s, i) => `<span class="${s === o.stage ? 'cur' : i < at && o.stage !== lostStage(o.pipeline, D.lists) ? 'done' : ''}">${esc(s)}</span>`).join('<i>›</i>')}</div>
      <div class="row"><select class="input" id="move-stage" data-keep-order aria-label="Move to stage" style="width:auto">${stages.map(s => `<option ${s === o.stage ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><button class="btn primary" data-act="opp-move" data-id="${id}">Move stage</button></div></section>
    ${(o.extra || {}).portal ? portalRequestNote(o) : ''}${PIPELINES[o.pipeline].lines ? oppLinesCard(o) : PIPELINES[o.pipeline].sqft ? rfOppLinesCard(o) : ''}
    ${(() => { const ord = allOrders().find(x => x.opp_id === o.id); return ord ? orderFiles(ord) : ''; })()}
    <div class="grid g2"><section class="card stack-s"><h3>Details</h3>${kv(fields.map(f => [esc(f.label), showVal(f, v[f.key])]))}</section>
      <section class="card stack-s"><h3>Stage history</h3>${hist.length ? `<div class="timeline">${hist.map(h => `<div class="on"><b>${esc(h.to_stage)}</b>${h.from_stage ? ` <span class="small muted">from ${esc(h.from_stage)}</span>` : ''}<div class="small muted">${ds(h.at)} ${tFmt(h.at)} · ${esc(staffName(h.by_staff))}${h.note ? ' · ' + esc(h.note) : ''}</div></div>`).join('')}</div>` : '<p class="muted">No moves yet.</p>'}</section></div>
    ${activityPanel({ clientId: o.client_id, oppId: id })}</div>`;
};
EM.VIEWS.opp.tab = 'opps';
EM.VIEWS.opp.title = id => (D.opportunities.find(x => x.id === id) || { title: 'Opportunity' }).title;

function openOppForm(o, keep) {
  const v = keep || (o ? { ...o, ...o.extra } : { owner_id: me().id });
  const clients = D.clients.filter(c => PIPES_FOR[KINDS[c.kind].group].some(p => pipesAllowed().includes(p))).sort((a, b) => a.name.localeCompare(b.name));
  if (!clients.length) return EM.modal(`<h2>Add an opportunity</h2><p class="muted">An opportunity belongs to a dealer, an architect firm or a person. Add one first.</p><div class="row" style="margin-top:14px">${addButtons()}<button class="btn" data-act="close-modal">Cancel</button></div>`);
  /* opened from a board (Retail, Project): the first client offered is one that can hold that pipeline */
  const client = CL()[v.client_id] || (v.pipeline && clients.find(c => PIPES_FOR[KINDS[c.kind].group].includes(v.pipeline))) || clients[0];
  const pipes = PIPES_FOR[KINDS[client.kind].group].filter(p => pipesAllowed().includes(p) || (o && o.pipeline === p));
  const pipeline = pipes.includes(v.pipeline) ? v.pipeline : pipes[0];
  const stages = D.lists.stages[pipeline] || [];
  if (!stages.includes(v.stage)) v.stage = stages[0];
  const withLines = PIPELINES[pipeline].lines || PIPELINES[pipeline].sqft, fields = showFields(oppFieldsFor(pipeline)).filter(f => f.key !== 'pipeline' && !(withLines && f.key === 'value') && (!LOST_KEYS.includes(f.key) || v.stage === lostStage(pipeline, D.lists)));
  const autoName = oppAutoName(client.name, (v.products || [])[0] || PIPELINES[pipeline].label, o && o.created_at);
  const oh = f => { const h = fieldHtml(f, v[f.key], 'of', { pipeline, client: client.id }); return f.key === 'stage' ? h.replace('<select', '<select data-opp-redraw') : f.key === 'title' ? h.replace('<input', `<input placeholder="Left blank: ${esc(autoName)}"`) : h; };
  const lines0 = (v.lines || (o ? (OPSD().oppLines || []).filter(l => l.opp_id === o.id) : [])), inFul = o && allOrders().some(x => x.opp_id === o.id);
  EM.modal(`<h2>${o ? 'Edit opportunity' : 'Add an opportunity'}</h2>
    <form id="of" class="stack" onsubmit="return false" style="margin-top:14px" data-id="${o ? o.id : ''}" data-seen="${esc(JSON.stringify(o ? { action: o.next_action || '', date: o.next_date || '' } : {}))}"><div class="fgrid">
      ${o ? `<div class="field"><label>Client</label><input class="input" value="${esc(client.name)}" disabled><input type="hidden" name="client_id" value="${client.id}"></div>`
    : `<div class="field"><label for="of-client_id">Client *</label><select class="input" id="of-client_id" name="client_id" data-opp-redraw>${clients.map(c => `<option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>${esc(c.name)} · ${esc(kindLabel(c.kind))}</option>`).join('')}</select></div>`}
      ${G.select(OPP_FIELDS[0], pipeline, 'of', pipes.map(p => [p, PIPELINES[p].label]), false).replace('<select', '<select data-opp-redraw')}
      ${fields.filter(f => !f.section).map(oh).join('')}</div>
      ${fields.some(f => f.section) ? fsHtml('Billing, payment and delivery', `<div class="fgrid">${fields.filter(f => f.section).map(oh).join('')}</div>`) : ''}
      ${withLines && !inFul ? `<fieldset class="fs"><legend>Designs, sq ft and rate</legend><p class="small muted">Type the sq ft needed, the wastage (${wastageDefault(D.lists.rules)}% unless changed) and the rate per sq ft: the boxes are rounded up to whole boxes, and the amount is the sq ft supplied x the rate. Accessories are per piece or per rft. GST (${D.lists.rules.gst_pct}%) and the total are worked out; the total is the opportunity's value.</p>
        <div id="olines" class="stack-s">${(lines0.length ? lines0.map(l => ({ ...l, keep: l.id })) : [{}]).map((l, i) => ordLine(i, l)).join('')}</div><div class="row" style="flex-wrap:wrap"><button class="btn sm" data-act="ol-add">+ Another design</button><button class="btn sm ghost" data-act="ol-sample">Sample Excel</button><label class="btn sm ghost" style="cursor:pointer">Upload Excel<input type="file" accept=".xlsx" data-sheet="olines" hidden></label></div><div id="ol-imp"></div>
        ${D.access.prices ? `<div class="fgrid"><div class="field"><label for="ord-disc">Discount</label><div class="adorn" data-unit="%"><input class="input" type="number" min="0" max="100" step="0.1" id="ord-disc" value="${esc(v.discount_pct ?? 0)}"><span class="suf">%</span></div></div></div>
        <div class="stack-s" data-charges><b class="small">Other charges</b><p class="small muted">Installation, porter or loading, transport, skirting, accessories: say what each is for and the amount. They are added before GST.</p>
          <datalist id="chg-hints">${CHARGE_HINTS.map(h => `<option value="${esc(h)}">`).join('')}</datalist>
          <div id="ochg" class="stack-s">${(v.charges || []).map((c, i) => chgLine(i, c)).join('')}</div><div class="row"><button class="btn sm" data-act="chg-add">+ Add a charge</button></div></div>` : ''}<div id="ord-total" class="small"></div></fieldset>` : ''}
      ${errBox('of-err')}<div class="row sticky-actions"><button class="btn primary" data-act="opp-save">${o ? 'Save changes' : 'Add opportunity'}</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
document.addEventListener('change', e => {
  if (!e.target.matches('[data-opp-redraw]')) return;
  const form = qs('#of'), o = form.dataset.id ? D.opportunities.find(x => x.id === form.dataset.id) : null;
  const keep = withDials(readForm(form, OPP_FIELDS), OPP_FIELDS);
  keep.client_id = form.querySelector('[name=client_id]').value;
  if (qs('#olines')) { keep.lines = readOrder(); keep.discount_pct = Number((qs('#ord-disc') || { value: 0 }).value || 0); }
  if (qs('#ochg')) keep.charges = readCharges();
  if (e.target.name === 'client_id') { keep.contact_id = '';   /* the pipeline stays when the new client may have it (a Retail or Project opportunity opened from its board) */ keep.billing_address = ''; keep.delivery_address = ''; }
  openOppForm(o, keep);
});
EM.ACTIONS['opp-add'] = el => openOppForm(null, el.dataset.client || el.dataset.pipeline ? { owner_id: me().id, client_id: el.dataset.client, pipeline: el.dataset.pipeline, project_id: el.dataset.project || '', dealer_id: el.dataset.dealer || '' } : null);
EM.ACTIONS['opp-edit'] = el => openOppForm(D.opportunities.find(x => x.id === el.dataset.id));
async function saveOpp(input, el, errId) {
  const { errors } = cleanOpp(input, ctxLocal());
  if (errors.length) { showErr(errId, errors); return null; }
  busy(el, true);
  try {
    const r = await API('POST', '/api/opportunities', input);
    upsertLocal(D.opportunities, r.opportunity);
    D.history = D.history.filter(h => h.opp_id !== r.opportunity.id).concat(r.history);
    if (r.followups) fuApply({ followups: r.followups, client: null, opportunity: null, clientId: r.opportunity.client_id });
    /* a wholesale sale also changes its designs, approvals and (at payment) its fulfilment: read them again */
    if (PIPELINES[r.opportunity.pipeline].lines || PIPELINES[r.opportunity.pipeline].sqft) { const fresh = await API('GET', '/api/bootstrap'); Object.assign(D, fresh); }
    return r;
  } catch (x) {
    busy(el, false); EM._lastErr = (x.errors || [x.message]).join(' '); showErr(errId, x.errors || x.message);
    if (PIPELINES[input.pipeline] && (PIPELINES[input.pipeline].lines || PIPELINES[input.pipeline].sqft)) { try { Object.assign(D, await API('GET', '/api/bootstrap')); } catch (e) { } }   // a refused move may still have raised an approval
    return null;
  }
}
EM.ACTIONS['opp-save'] = async el => {
  const form = qs('#of'), input = readForm(form, OPP_FIELDS);
  input.client_id = form.querySelector('[name=client_id]').value;
  if (form.dataset.id) { input.id = form.dataset.id; input.next_seen = JSON.parse(form.dataset.seen || '{}'); }
  if (qs('#olines')) {
    input.lines = readOrder(); input.discount_pct = Number((qs('#ord-disc') || { value: 0 }).value || 0);
    { const bad = input.lines.findIndex(l => !l.keep && (!l.product_id || lineCalc(l).error)); if (bad >= 0) return showErr('of-err', `Design line ${bad + 1}: ${input.lines[bad].product_id ? lineCalc(input.lines[bad]).error : 'choose a design'} (or remove the line).`); }
    if (qs('#ochg')) { input.charges = readCharges(); const bad = input.charges.findIndex(c => !c.label || !(c.amount > 0)); if (bad >= 0) return showErr('of-err', `Charge ${bad + 1}: say what it is for and the amount (or remove it).`); }
  }
  const r = await saveOpp(input, el, 'of-err');
  if (!r) return;
  EM.closeModal(); EM.toast(`<b>${esc(r.opportunity.title)}</b> ${r.created ? 'added' : 'saved'} · ${esc(r.opportunity.stage)}`);
  location.hash = `#/opp/${r.opportunity.id}`; EM.rerender();
};
const oppInput = o => ({ ...o.extra, next_seen: { action: o.next_action || '', date: o.next_date || '' }, id: o.id, client_id: o.client_id, pipeline: o.pipeline, title: o.title, stage: o.stage, value: o.value ?? '', owner_id: o.owner_id, contact_id: o.contact_id, source: o.source, next_action: o.next_action, next_date: o.next_date, lost_reason: o.lost_reason, project_id: o.project_id || '', dealer_id: o.dealer_id || '' });
EM.ACTIONS['opp-move'] = async el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id), to = qs('#move-stage').value;
  if (to === o.stage) return;
  if (to === lostStage(o.pipeline, D.lists)) return EM.modal(`<h2>Why was it lost?</h2><p class="muted">Choose the reason, then say exactly what happened. Both are compulsory.</p>
    <div class="field" style="margin-top:12px" data-field="lost_reason"><label for="lost-pick">Lost reason *</label><select class="input" id="lost-pick"><option value="">Choose</option>${D.lists.lost_reasons.map(r => `<option>${esc(r)}</option>`).join('')}</select></div>
    <div class="field" style="margin-top:12px" data-field="lost_detail"><label for="lost-detail">The details *</label><textarea class="input" id="lost-detail" rows="3" placeholder="e.g. Needed 300 boxes of Oak in 10 days; we had 120 and the next container is 6 weeks away"></textarea></div>
    ${errBox('lost-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="opp-lost" data-id="${o.id}">Mark as lost</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
  const r = await saveOpp({ ...oppInput(o), stage: to }, el, 'move-err');
  if (r) { EM.toast(`Moved to <b>${esc(to)}</b>.`); EM.rerender(); } else bubbleNear(qs('[data-act="opp-move"]') || el, EM._lastErr || 'Could not move it.');
};
EM.ACTIONS['opp-lost'] = async el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id), why = qs('#lost-pick').value, detail = qs('#lost-detail').value.trim();
  if (!why) return showErr('lost-err', 'Lost reason is compulsory when the stage is ' + lostStage(o.pipeline, D.lists));
  if (!detail) return showErr('lost-err', 'Lost: the details are compulsory when the stage is ' + lostStage(o.pipeline, D.lists));
  const r = await saveOpp({ ...oppInput(o), stage: lostStage(o.pipeline, D.lists), lost_reason: why, lost_detail: detail }, el, 'lost-err');
  if (r) { EM.closeModal(); EM.toast('Marked as lost: ' + esc(why)); EM.rerender(); }
};
EM.ACTIONS['opp-del'] = async el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id);
  if (!confirm(`Delete ${o.title}? Its stage history goes with it.`)) return;
  try { await API('DELETE', '/api/opportunities/' + o.id); D.opportunities = D.opportunities.filter(x => x.id !== o.id); D.history = D.history.filter(h => h.opp_id !== o.id); D.followups = FUS().filter(f => f.opp_id !== o.id); EM.toast('Moved to the Recycle bin for 30 days.'); location.hash = '#/opps/' + o.pipeline; } catch (x) { EM.toast(esc(x.message)); }
};

/* ---------------------------------------------------------------- inventory
   One inventory for EGO Premium and Big E: category > collection > design, and each
   design's boxes in each warehouse. Stock changes only through a stock move (or the
   boxes typed when a design is added), so every figure has who, when and why.
   The filter bar at the top (warehouse, category, collection, design) narrows every tab. */
const INVD = () => D.inventory || { collections: [], products: [], warehouses: [], stock: [] };
const canStockUI = () => !!D.access.stock;
const colOf = p => INVD().collections.find(c => c.id === p.collection_id) || { name: '', category: '', extra: {} };
const num = n => n == null ? '' : Number(n).toLocaleString('en-IN');
EM.invF = { wh: '', cat: '', col: '', q: '' };
const F = () => EM.invF;
/* the filter, applied once: which designs, which warehouses */
const fProducts = () => INVD().products.filter(p => { const c = colOf(p), q = F().q.toLowerCase(); return (!F().cat || c.category === F().cat) && (!F().col || c.id === F().col) && (!q || `${p.name} ${p.code} ${c.name} ${p.extra.colour || ''}`.toLowerCase().includes(q)); });
const fWarehouses = () => INVD().warehouses.filter(w => !F().wh || w.id === F().wh);
const boxesOf = (pid, wid) => INVD().stock.filter(x => x.product_id === pid && (wid ? x.warehouse_id === wid : (!F().wh || x.warehouse_id === F().wh))).reduce((a, x) => a + x.boxes, 0);
const sqftFor = (p, boxes) => sqftOf(boxes, colOf(p).extra.sqm_per_box);
const sqftTxt = (p, b) => { const f = sqftFor(p, b); return f == null ? '<span class="muted">box size not set</span>' : num(f); };
const totalSqft = list => list.reduce((a, [p, b]) => a + (sqftFor(p, b) || 0), 0);
const allCats = () => [...new Set([...D.lists.categories, ...INVD().collections.map(c => c.category)])];
const INV_TABS = [['overview', 'Overview'], ['stock', 'Stock'], ['categories', 'Categories'], ['collections', 'Collections'], ['designs', 'Designs'], ['warehouses', 'Warehouses']];
EM.VIEWS.inventory = arg => {
  const I = INVD(), tab = INV_TABS.find(t => t[0] === arg) ? arg : 'overview', f = F();
  const opt = (v, cur, l) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`;
  const colsIn = I.collections.filter(c => !f.cat || c.category === f.cat);
  const filters = `<div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" id="invfilters">
      <label class="field" style="min-width:170px"><span class="small muted">Warehouse</span><select class="input" data-invf="wh">${opt('', f.wh, 'All warehouses')}${I.warehouses.map(w => opt(w.id, f.wh, w.name)).join('')}</select></label>
      <label class="field" style="min-width:170px"><span class="small muted">Category</span><select class="input" data-invf="cat">${opt('', f.cat, 'All categories')}${allCats().map(c => opt(c, f.cat, c)).join('')}</select></label>
      <label class="field" style="min-width:190px"><span class="small muted">Collection</span><select class="input" data-invf="col">${opt('', f.col, 'All collections')}${colsIn.map(c => opt(c.id, f.col, c.name)).join('')}</select></label>
      <label class="field" style="min-width:220px;flex:1"><span class="small muted">Design</span><input class="input" id="invq" value="${esc(f.q)}" placeholder="Design name, code or colour"></label>
      ${f.wh || f.cat || f.col || f.q ? '<button class="btn sm ghost" data-act="invf-clear">Clear filters</button>' : ''}</div>`;
  const tpl = TEMPLATES.inv;
  const head = `<div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">Shared by EGO Premium and Big E</div><h1>Inventory</h1><p class="muted" style="max-width:640px">${canStockUI() ? 'Add a category, then its collections, then each design with the warehouses it is in and how many boxes. After that, stock changes with Stock in / out.' : 'You can see the inventory. Stock is changed by the Owner, a Director or Warehouse & Dispatch.'}</p></div>
    <div class="row" style="flex-wrap:wrap;justify-content:flex-end"><a class="btn" href="${tpl.file}" download>Download sample Excel</a><a class="btn" href="#/import">Upload Excel</a>
      ${canStockUI() ? `<button class="btn" data-act="cat-add">+ Category</button><button class="btn" data-act="col-add">+ Collection</button><button class="btn" data-act="prod-add">+ Design</button><button class="btn" data-act="wh-add">+ Warehouse</button><button class="btn primary" data-act="move-add">Stock in / out</button>` : ''}</div></div>`;
  const counts = { stock: I.stock.length, categories: allCats().length, collections: I.collections.length, designs: I.products.length, warehouses: I.warehouses.length };
  const body = { overview: invOverview, stock: invStock, categories: invCategories, collections: invCollections, designs: invDesigns, warehouses: invWarehouses }[tab]();
  return `<div class="stack">${head}${subtabs('#/inventory', tab, INV_TABS.map(([k, l]) => [k, l + (counts[k] != null ? ` <span class="muted">${counts[k]}</span>` : '')]))}${tab === 'overview' && !I.products.length ? '' : filters}${body}</div>`;
};
EM.VIEWS.inventory.title = () => 'Inventory';
EM.VIEWS.stock = EM.VIEWS.inventory;
EM.VIEWS.stock.title = () => 'Inventory';
document.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.invf;
  if (!k) return;
  EM.invF[k] = e.target.value;
  if (k === 'cat' && EM.invF.col && colOf({ collection_id: EM.invF.col }).category !== EM.invF.cat) EM.invF.col = '';
  EM.rerender();
});
document.addEventListener('input', e => { if (e.target.id === 'invq') { EM.invF.q = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#invq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
EM.ACTIONS['invf-clear'] = () => { EM.invF = { wh: '', cat: '', col: '', q: '' }; EM.rerender(); };
const filtNote = () => { const f = F(), bits = [f.wh && INVD().warehouses.find(w => w.id === f.wh)?.name, f.cat, f.col && colOf({ collection_id: f.col }).name, f.q && `"${f.q}"`].filter(Boolean); return bits.length ? `<p class="small muted">Showing ${esc(bits.join(' · '))}</p>` : ''; };

function invOverview() {
  const I = INVD();
  if (!I.products.length && !I.warehouses.length) return empty('Nothing in the inventory yet', 'Start with a category, then its collections, then each design with its warehouse and boxes. Or download the sample Excel, fill it and upload it.', canStockUI() ? '<button class="btn primary" data-act="cat-add">+ Category</button><a class="btn" href="#/import">Upload Excel</a>' : '');
  const ps = fProducts(), whs = fWarehouses(), all = ps.map(p => [p, boxesOf(p.id)]);
  const cats = [...new Set(ps.map(p => colOf(p).category))];
  const low = ps.filter(p => p.status !== 'Discontinued' && p.extra.low_stock != null && boxesOf(p.id) < p.extra.low_stock);
  const noBox = I.collections.filter(c => !c.extra.sqm_per_box).length;
  return `${filtNote()}<div class="grid g4">${tile('Categories', cats.length, '', '#/inventory/categories')}${tile('Collections', new Set(ps.map(p => p.collection_id)).size, '', '#/inventory/collections')}${tile('Designs', ps.length, `${ps.filter(p => p.status === 'Discontinued').length} discontinued`, '#/inventory/designs')}${tile('Warehouses', whs.length, '', '#/inventory/warehouses')}
      ${tile('Boxes in stock', num(all.reduce((a, [, b]) => a + b, 0)), '', '#/inventory/stock')}${tile('Sq ft in stock', num(totalSqft(all)), noBox ? `${noBox} collection${noBox === 1 ? '' : 's'} without a box size` : '', '#/inventory/stock')}${tile('Below their warning level', low.length, '', '#/inventory/designs')}${(() => { const sh = OPSD().orders.filter(o => [FN('Stock check'), FN('Waiting on production')].includes(o.ful_stage)).reduce((a, o) => a + missingOf(o.id), 0); return tile('Boxes short for open sales', num(sh), 'whole boxes ordered, less blocked and on production', '#/orders'); })()}</div>
    <div class="grid g2"><section class="card stack-s"><h3>By warehouse</h3>${whs.length ? table(['Warehouse', 'City', 'Designs in stock', 'Boxes', 'Sq ft'], whs.map(w => { const l = ps.map(p => [p, boxesOf(p.id, w.id)]).filter(([, b]) => b); return { href: '#/inventory/warehouses', cells: [`<b>${esc(w.name)}</b>`, esc(w.city || ''), l.length, num(l.reduce((a, [, b]) => a + b, 0)), num(totalSqft(l))] }; })) : '<p class="small muted">No warehouses yet.</p>'}</section>
      <section class="card stack-s"><h3>By category</h3>${table(['Category', 'Collections', 'Designs', 'Boxes', 'Sq ft'], cats.map(c => { const l = ps.filter(p => colOf(p).category === c).map(p => [p, boxesOf(p.id)]); return [`<b>${esc(c)}</b>`, new Set(l.map(([p]) => p.collection_id)).size, l.length, num(l.reduce((a, [, b]) => a + b, 0)), num(totalSqft(l))]; }))}</section></div>
    ${low.length ? `<section class="card stack-s"><h3>Below their warning level</h3>${table(['Design', 'Collection', 'Boxes', 'Warn below'], low.map(p => ({ href: '#/product/' + p.id, cells: [`<b>${esc(p.name)}</b>`, esc(colOf(p).name), boxesOf(p.id), p.extra.low_stock] })))}</section>` : ''}`;
}
/* the one table that answers "where is the stock": a line per design per warehouse */
function invStock() {
  const ps = fProducts(), whs = fWarehouses();
  const lines = [];
  for (const p of ps) for (const w of whs) { const b = boxesOf(p.id, w.id); if (b) lines.push([p, w, b]); }
  const sum = lines.reduce((a, [, , b]) => a + b, 0), sq = lines.reduce((a, [p, , b]) => a + (sqftFor(p, b) || 0), 0);
  return `${filtNote()}<div class="grid g4">${tile('Lines in stock', lines.length)}${tile('Boxes', num(sum))}${tile('Sq ft', num(sq))}${tile('Designs in stock', new Set(lines.map(([p]) => p.id)).size)}</div>
    ${lines.length ? table(['Warehouse', 'Category', 'Collection', 'Design', 'Code', 'Boxes', 'Sq ft per box', 'Sq ft'], lines.slice(0, 600).map(([p, w, b]) => ({ href: '#/product/' + p.id,
      cells: [esc(w.name), esc(colOf(p).category), esc(colOf(p).name), `<b>${esc(p.name)}</b>`, esc(p.code || ''), num(b), colOf(p).extra.sqft_per_box ?? '<span class="muted">not set</span>', sqftTxt(p, b)] })))
      + (lines.length > 600 ? `<p class="small muted">Showing 600 of ${lines.length}. Use the filters to narrow it down.</p>` : '')
      : empty('No stock for this filter', INVD().warehouses.length ? 'Add boxes with Stock in / out, when you add a design, or with the Excel file.' : 'Add a warehouse first, then the boxes of each design in it.', canStockUI() ? `${INVD().warehouses.length ? '' : '<button class="btn" data-act="wh-add">+ Warehouse</button>'}<button class="btn primary" data-act="move-add">Stock in / out</button>` : '')}`;
}
function invCategories() {
  const I = INVD();
  return table(['Category', 'Collections', 'Designs', 'Boxes', 'Sq ft'], allCats().filter(c => !F().cat || c === F().cat).map(c => { const cs = I.collections.filter(x => x.category === c), l = fProducts().filter(p => colOf(p).category === c).map(p => [p, boxesOf(p.id)]);
    return [`<b>${esc(c)}</b>${!cs.length && canStockUI() ? ` <button class="btn sm ghost" data-act="col-add" data-category="${esc(c)}">+ Collection</button>` : ''}`, cs.length, l.length, num(l.reduce((a, [, b]) => a + b, 0)), num(totalSqft(l))]; }));
}
function invDesigns() {
  const ps = fProducts();
  return `${filtNote()}${INVD().products.length ? table(['Design', 'Code', 'Collection', 'Category', 'Type', 'Boxes', 'Sq ft', 'Warehouses', 'Status'], ps.slice(0, 400).map(p => { const b = boxesOf(p.id), wn = INVD().warehouses.filter(w => boxesOf(p.id, w.id)).map(w => w.name); return { href: '#/product/' + p.id,
      cells: [`<b>${esc(p.name)}</b>`, esc(p.code || ''), esc(colOf(p).name), esc(colOf(p).category), esc(p.sub_type || ''), p.extra.low_stock != null && b < p.extra.low_stock ? `<span class="badge bad">${b}</span>` : b, sqftTxt(p, b), esc(wn.join(', ')), p.status === 'Discontinued' ? '<span class="badge plain">Discontinued</span>' : ''] }; }))
      + (ps.length > 400 ? `<p class="small muted">Showing 400 of ${ps.length}.</p>` : '')
      : empty('No designs yet', 'Add a collection first, then its designs, or upload the Excel file.')}`;
}
function invCollections() {
  const I = INVD(), ps = fProducts(), ids = new Set(ps.map(p => p.collection_id));
  const list = I.collections.filter(c => (!F().cat || c.category === F().cat) && (!F().col || c.id === F().col) && (!F().q || ids.has(c.id)));
  return list.length ? table(['Collection', 'Category', 'Designs', 'Box size (sq ft)', 'Box size (m²)', 'Size', 'Thickness', 'Boxes in stock', 'Sq ft in stock'], list.map(c => { const l = ps.filter(p => p.collection_id === c.id).map(p => [p, boxesOf(p.id)]); return { href: '#/collection/' + c.id,
    cells: [`<b>${esc(c.name)}</b>`, esc(c.category), l.length, c.extra.sqft_per_box ?? '<span class="muted">not set</span>', c.extra.sqm_per_box ?? '<span class="muted">not set</span>', esc(c.extra.size_mm || ''), esc(c.extra.thickness_mm || ''), num(l.reduce((a, [, b]) => a + b, 0)), num(totalSqft(l))] }; }))
    : empty('No collections for this filter', 'A collection holds what all its designs share: the box size and the specifications.', canStockUI() ? '<button class="btn primary" data-act="col-add">+ Collection</button>' : '');
}
function invWarehouses() {
  const whs = fWarehouses(), ps = fProducts();
  return whs.length ? `<div class="stack">${whs.map(w => { const l = ps.map(p => [p, boxesOf(p.id, w.id)]).filter(([, b]) => b), cats = [...new Set(l.map(([p]) => colOf(p).category))];
    return `<section class="card stack-s"><div class="row between"><div><h3>${esc(w.name)}</h3><p class="small muted">${esc([w.city, w.address].filter(Boolean).join(' · '))}</p></div>${canStockUI() ? `<button class="btn sm ghost" data-act="wh-edit" data-id="${w.id}">Edit</button>` : ''}</div>
      ${kv([['Categories here', esc(cats.join(', ')) || NOTSET], ['Designs in stock', String(l.length)], ['Boxes', num(l.reduce((a, [, b]) => a + b, 0))], ['Sq ft', num(totalSqft(l))]])}
      ${l.length ? table(['Category', 'Collection', 'Design', 'Boxes', 'Sq ft'], l.slice(0, 200).map(([p, b]) => ({ href: '#/product/' + p.id, cells: [esc(colOf(p).category), esc(colOf(p).name), `<b>${esc(p.name)}</b>`, b, sqftTxt(p, b)] }))) : '<p class="small muted">Nothing in stock here for this filter.</p>'}</section>`; }).join('')}</div>`
    : empty('No warehouses yet', 'Add each warehouse: name, city and address.', canStockUI() ? '<button class="btn primary" data-act="wh-add">+ Warehouse</button>' : '');
}

const specRows = (c, sections) => [...COLLECTION_FIELDS.filter(f => !['category', 'name'].includes(f.key) && (!sections || sections.includes(f.section)) && (D.access.prices || f.type !== 'money')).map(f => [esc(f.label), showVal(f, c.extra[f.key])]),
  /* the rate per box, worked out: what an opportunity line starts at (11 Oct) */
  ...(D.access.prices && c.extra.price_sqft && c.extra.sqft_per_box && (!sections || sections.includes('Box size and packing')) ? [['Rate per box (price per sq ft × sq ft per box)', inr0(c.extra.price_sqft * c.extra.sqft_per_box)]] : [])];
const BOX = 'Box size and packing';
EM.VIEWS.product = id => {
  const p = INVD().products.find(x => x.id === id);
  if (!p) return `<div class="stack"><h1>Design not found</h1><a class="btn" href="#/inventory/designs">Designs</a></div>`;
  const c = colOf(p), I = INVD(), total = boxesOf(p.id, null);
  const allB = I.stock.filter(x => x.product_id === p.id).reduce((a, x) => a + x.boxes, 0);
  return `<div class="stack">${crumbs(['Inventory', '#/inventory/designs'], [c.category, '#/inventory/categories'], [c.name, '#/collection/' + c.id], [p.name])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(p.name)}</h1><div class="row"><a class="badge info plain" href="#/collection/${c.id}">${esc(c.name)}</a><span class="badge plain">${esc(c.category)}</span>${p.sub_type ? `<span class="badge plain">${esc(p.sub_type)}</span>` : ''}${p.code ? `<span class="small muted">${esc(p.code)}</span>` : ''}${p.status === 'Discontinued' ? '<span class="badge warn">Discontinued</span>' : ''}</div>
      <p class="muted">${num(allB)} boxes in stock · ${sqftTxt(p, allB)} sq ft</p></div>
      ${canStockUI() ? `<div class="row"><button class="btn" data-act="prod-edit" data-id="${p.id}">Edit</button><button class="btn primary" data-act="move-add" data-product="${p.id}">Stock in / out</button>${D.access.can_delete ? `<button class="btn ghost" data-act="prod-del" data-id="${p.id}">Delete</button>` : ''}</div>` : ''}</div>
    <div class="grid g2">${p.extra.image ? `<section class="card"><img src="${esc(p.extra.image)}" alt="${esc(p.name)}" style="width:100%;border-radius:10px;display:block" loading="lazy"></section>` : ''}
      <section class="card stack-s"><h3>Where it is</h3>${I.warehouses.length ? table(['Warehouse', 'Boxes', 'Sq ft'], I.warehouses.map(w => { const b = boxesOf(p.id, w.id); return [esc(w.name), b, sqftTxt(p, b)]; })) : '<p class="small muted">No warehouses yet.</p>'}
        ${kv([['Box size', c.extra.sqft_per_box != null ? `${c.extra.sqft_per_box} sq ft (${c.extra.sqm_per_box} m²)` : NOTSET], ['Colour or shade', esc(p.extra.colour || '') || NOTSET], ['Warn below', p.extra.low_stock != null ? p.extra.low_stock + ' boxes' : NOTSET]])}</section>
      <section class="card stack-s"><h3>Specifications (from ${esc(c.name)})</h3>${kv(specRows(c, ['Specifications', 'Warranty']))}</section>
      <section class="card stack-s"><h3>${BOX}</h3>${kv(specRows(c, [BOX, 'Other']))}</section></div>
    <section class="stack-s"><h3>Stock history</h3><div id="moves"><p class="muted">Loading…</p></div></section></div>`;
};
EM.VIEWS.product.tab = 'inventory';
EM.VIEWS.product.title = id => (INVD().products.find(x => x.id === id) || { name: 'Design' }).name;
EM.VIEWS.product.after = async id => {
  try {
    const r = await API('GET', '/api/stock?product=' + encodeURIComponent(id)), box = qs('#moves');
    if (box) box.innerHTML = r.moves.length ? table(['When', 'What', 'Warehouse', 'Boxes', 'By', 'Note'], r.moves.map(m => [ds(m.at.slice(0, 10)), esc(MOVE_KINDS[m.kind]), esc(m.warehouse || ''), m.boxes > 0 ? '+' + m.boxes : String(m.boxes), esc(m.by_name || ''), esc(m.note || '')])) : '<p class="small muted">No stock moves yet.</p>';
  } catch (x) { const box = qs('#moves'); if (box) box.textContent = x.message; }
};
EM.VIEWS.collection = id => {
  const c = INVD().collections.find(x => x.id === id);
  if (!c) return `<div class="stack"><h1>Collection not found</h1><a class="btn" href="#/inventory/collections">Collections</a></div>`;
  const ps = INVD().products.filter(p => p.collection_id === id), whs = INVD().warehouses;
  return `<div class="stack">${crumbs(['Inventory', '#/inventory/collections'], [c.category, '#/inventory/categories'], [c.name])}
    <div class="row between"><div class="stack-s"><h1>${esc(c.name)}</h1><div class="row"><span class="badge info plain">${esc(c.category)}</span><span class="small muted">${ps.length} designs</span></div></div>
      ${canStockUI() ? `<div class="row"><button class="btn" data-act="col-edit" data-id="${c.id}">Edit</button><button class="btn primary" data-act="prod-add" data-collection="${c.id}">+ Design</button></div>` : ''}</div>
    <div class="grid g2"><section class="card stack-s"><h3>${BOX}</h3>${kv(specRows(c, [BOX]))}</section>
      <section class="card stack-s"><h3>Where its stock is</h3>${whs.length ? table(['Warehouse', 'Designs', 'Boxes', 'Sq ft'], whs.map(w => { const l = ps.map(p => [p, boxesOf(p.id, w.id)]).filter(([, b]) => b); return [esc(w.name), l.length, num(l.reduce((a, [, b]) => a + b, 0)), num(totalSqft(l))]; })) : '<p class="small muted">No warehouses yet.</p>'}</section>
      <section class="card stack-s"><h3>Specifications</h3>${kv(specRows(c, ['Specifications', 'Warranty', 'Other']))}</section></div>
    <section class="stack-s"><h3>Designs</h3>${ps.length ? table(['Design', 'Code', 'Type', 'Boxes', 'Sq ft', 'Warehouses'], ps.map(p => { const b = boxesOf(p.id, null); return { href: '#/product/' + p.id, cells: [`<b>${esc(p.name)}</b>`, esc(p.code || ''), esc(p.sub_type || ''), b, sqftTxt(p, b), esc(whs.filter(w => boxesOf(p.id, w.id)).map(w => w.name).join(', '))] }; })) : '<p class="small muted">No designs yet.</p>'}</section></div>`;
};
EM.VIEWS.collection.tab = 'inventory';
EM.VIEWS.collection.title = id => (INVD().collections.find(x => x.id === id) || { name: 'Collection' }).name;

/* ---- adding, in order: category, then collection, then design with where it is stocked */
const stepNote = (n, txt) => `<div class="callout"><b>Step ${n} of 3.</b> ${txt}</div>`;
EM.ACTIONS['cat-add'] = () => EM.modal(`<h2>Add a category</h2>${stepNote(1, 'A category is the kind of floor: LVT, SPC, Laminate, Engineered, Deck... Next you add its collections.')}
  <form id="catf" class="stack" onsubmit="return false" style="margin-top:14px"><div class="field"><label for="catf-name">Category name *</label><input class="input" id="catf-name" placeholder="e.g. PVC Soffit & Cladding"></div>
  <p class="small muted">Already there: ${esc(allCats().join(', '))}</p>${errBox('catf-err')}
  <div class="row"><button class="btn primary" data-act="cat-save">Add category, then a collection</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
EM.ACTIONS['cat-save'] = async el => {
  const name = qs('#catf-name').value.trim();
  if (!name) return showErr('catf-err', 'Type the category name.');
  busy(el, true);
  try { const r = await API('POST', '/api/categories', { name }); D.lists = r.lists; EM.toast(`<b>${esc(name)} added</b>`); invForm('collections', null, { category: name }, 2); }
  catch (x) { busy(el, false); showErr('catf-err', x.message); }
};
const stockLine = (i, whs) => `<div class="fgrid stockline" data-i="${i}" style="align-items:end">
  <div class="field"><label for="sl-wh-${i}">Warehouse</label><select class="input" id="sl-wh-${i}" data-sl="wh">${whs.map(w => `<option value="${w.id}">${esc(w.name)}</option>`).join('')}<option value="__new">+ New warehouse…</option></select></div>
  <div class="field"><label for="sl-boxes-${i}">Boxes there today</label><input class="input" id="sl-boxes-${i}" type="number" min="0" step="1" inputmode="numeric" data-sl="boxes"></div>
  <div class="field sl-new" ${whs.length ? 'hidden' : ''}><label for="sl-name-${i}">New warehouse name</label><input class="input" id="sl-name-${i}" data-sl="name"></div>
  <div class="field sl-new" ${whs.length ? 'hidden' : ''}><label for="sl-city-${i}">Its city</label><input class="input" id="sl-city-${i}" data-sl="city"></div></div>`;
function invForm(table, rec, keep, step) {
  const FL = { collections: COLLECTION_FIELDS, products: PRODUCT_FIELDS, warehouses: WAREHOUSE_FIELDS }[table], what = { collections: 'collection', products: 'design', warehouses: 'warehouse' }[table];
  const v = keep && !rec ? keep : (rec ? { ...rec, ...(rec.extra || {}) } : {});
  const fields = FL.filter(f => D.access.prices || f.type !== 'money'), secs = [...new Set(fields.map(f => f.section || ''))];
  if (table === 'products' && !INVD().collections.length) return EM.modal(`<h2>Add a design</h2><p class="muted">A design belongs to a collection. Add the collection first.</p><div class="row" style="margin-top:14px"><button class="btn primary" data-act="col-add">+ Collection</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
  const note = step === 2 ? stepNote(2, `Add a collection${v.category ? ' in ' + esc(v.category) : ''}. The box size matters most: stock is counted in boxes, and sq ft are worked out from it. Fill sq ft OR square metres.`)
    : step === 3 ? stepNote(3, 'Add a design in this collection, and the warehouses it is in with the boxes there today.')
      : table === 'collections' && !rec ? '<p class="small muted">Box size in sq ft or square metres: fill either, the other is worked out.</p>' : '';
  const newDesign = table === 'products' && !rec, whs = INVD().warehouses;
  EM.modal(`<h2>${rec ? 'Edit ' + esc(rec.name) : 'Add a ' + what}</h2>${note}
    <form id="ivf" class="stack" onsubmit="return false" style="margin-top:14px" data-table="${table}" data-id="${rec ? rec.id : ''}" data-step="${step || ''}">
      ${secs.map(sc => `<fieldset class="fs">${sc ? `<legend>${esc(sc)}</legend>` : ''}<div class="fgrid">${fields.filter(f => (f.section || '') === sc).map(f => fieldHtml(f, v[f.key], 'ivf')).join('')}</div></fieldset>`).join('')}
    </form>
    ${newDesign ? `<fieldset class="fs" style="margin-top:12px"><legend>Where it is stocked</legend><div id="slines" class="stack-s">${stockLine(0, whs)}</div>
      <div class="row"><button class="btn sm" data-act="sl-add">+ Another warehouse</button></div><p class="small muted">Leave Boxes empty if it is not in stock yet. Later changes go through Stock in / out.</p></fieldset>` : ''}
    ${errBox('ivf-err')}<div class="row sticky-actions" style="margin-top:14px"><button class="btn primary" data-act="inv-save">${rec ? 'Save changes' : 'Add ' + what}</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
}
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.sl === 'wh') e.target.closest('.stockline').querySelectorAll('.sl-new').forEach(x => { x.hidden = e.target.value !== '__new'; }); });
EM.ACTIONS['sl-add'] = () => { const box = qs('#slines'); box.insertAdjacentHTML('beforeend', stockLine(box.querySelectorAll('.stockline').length, INVD().warehouses)); };
const readStock = () => [...document.querySelectorAll('#slines .stockline')].map(l => { const g = k => l.querySelector(`[data-sl="${k}"]`).value.trim(); return { warehouse_id: g('wh'), boxes: g('boxes'), new_warehouse: g('name'), new_city: g('city') }; })
  .filter(x => x.boxes !== '' || (x.warehouse_id === '__new' && x.new_warehouse)).map(x => ({ ...x, boxes: x.boxes === '' ? 0 : Number(x.boxes) }));
EM.ACTIONS['col-add'] = el => invForm('collections', null, { category: (el && el.dataset.category) || F().cat || '' });
EM.ACTIONS['col-edit'] = el => invForm('collections', INVD().collections.find(x => x.id === el.dataset.id));
EM.ACTIONS['prod-add'] = el => invForm('products', null, { collection_id: (el && el.dataset.collection) || F().col || '', status: 'Active' });
EM.ACTIONS['prod-edit'] = el => invForm('products', INVD().products.find(x => x.id === el.dataset.id));
EM.ACTIONS['wh-add'] = () => invForm('warehouses');
EM.ACTIONS['wh-edit'] = el => invForm('warehouses', INVD().warehouses.find(x => x.id === el.dataset.id));
EM.ACTIONS['inv-save'] = async el => {
  const form = qs('#ivf'), table = form.dataset.table, FL = { collections: COLLECTION_FIELDS, products: PRODUCT_FIELDS, warehouses: WAREHOUSE_FIELDS }[table];
  const input = readForm(form, FL);
  const { errors } = cleanFields(FL, input, ctxLocal());
  const stock = qs('#slines') ? readStock() : [];
  stock.forEach((x, i) => { if (!Number.isInteger(x.boxes) || x.boxes < 0) errors.push(`Warehouse line ${i + 1}: boxes must be a whole number`); if (x.warehouse_id === '__new' && !x.new_warehouse) errors.push(`Warehouse line ${i + 1}: type the new warehouse's name`); });
  if (errors.length) return showErr('ivf-err', errors);
  if (form.dataset.id) input.id = form.dataset.id;
  if (stock.length) input.stock = stock;
  busy(el, true);
  try {
    const r = await API('POST', '/api/' + table, input);
    D.inventory = r.inventory;
    /* the next step opens by itself: a new collection asks for its designs, a new design offers another */
    if (table === 'collections' && !form.dataset.id) { EM.toast(`<b>${esc(input.name)} added</b>`); location.hash = '#/collection/' + r.id; EM.rerender(); return invForm('products', null, { collection_id: r.id, status: 'Active' }, 3); }
    if (table === 'products' && !form.dataset.id) {
      location.hash = '#/product/' + r.id; EM.rerender();
      return EM.modal(`<h2>${esc(input.name)} added</h2><p class="muted">${stock.length ? `In ${stock.length} warehouse${stock.length === 1 ? '' : 's'}.` : 'No stock yet.'}</p>
        <div class="row" style="margin-top:14px"><button class="btn primary" data-act="prod-add" data-collection="${esc(input.collection_id)}">+ Another design in ${esc(colOf({ collection_id: input.collection_id }).name)}</button><button class="btn" data-act="col-add" data-category="${esc(colOf({ collection_id: input.collection_id }).category)}">+ Another collection</button><button class="btn" data-act="close-modal">Done</button></div>`);
    }
    EM.closeModal(); EM.toast(`<b>${esc(input.name)} saved</b>`);
    location.hash = table === 'products' ? '#/product/' + r.id : table === 'collections' ? '#/collection/' + r.id : '#/inventory/warehouses'; EM.rerender();
  } catch (x) { busy(el, false); showErr('ivf-err', x.errors || x.message); }
};
EM.ACTIONS['prod-del'] = async el => {
  const p = INVD().products.find(x => x.id === el.dataset.id);
  if (!confirm(`Delete ${p.name}?`)) return;
  try { await API('DELETE', '/api/products/' + p.id); D.inventory.products = D.inventory.products.filter(x => x.id !== p.id); EM.toast('Moved to the Recycle bin for 30 days.'); location.hash = '#/inventory/designs'; } catch (x) { EM.toast(esc(x.message)); }
};
/* stock in, stock out, transfer */
EM.ACTIONS['move-add'] = el => {
  const I = INVD();
  if (!I.products.length || !I.warehouses.length) return EM.modal(`<h2>Stock in or out</h2><p class="muted">Stock is counted per design per warehouse, so you need ${!I.warehouses.length ? 'a warehouse' : ''}${!I.warehouses.length && !I.products.length ? ' and ' : ''}${!I.products.length ? 'a design' : ''} first.</p>
    <div class="row" style="margin-top:14px">${!I.warehouses.length ? '<button class="btn primary" data-act="wh-add">+ Warehouse</button>' : ''}${!I.products.length ? '<button class="btn primary" data-act="cat-add">+ Category</button>' : ''}<button class="btn" data-act="close-modal">Close</button></div>`);
  const sel = (id, label, inner) => `<div class="field"><label for="${id}">${label}</label><select class="input" id="${id}">${inner}</select></div>`;
  const o = (k, l, v) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`;
  const whs = I.warehouses, pre = el.dataset.product || '';
  const byCol = I.collections.map(c => [c, I.products.filter(p => p.collection_id === c.id).sort((a, b) => a.name.localeCompare(b.name))]).filter(([, ps]) => ps.length);
  EM.modal(`<h2>Stock in, out or transfer</h2><p class="muted small">Counted in boxes. Every move is kept with your name and the time.</p>
    <form id="mvf" class="stack" onsubmit="return false" style="margin-top:14px"><div class="fgrid">
      ${sel('mv-kind', 'What happened', o('in', 'Stock in (arrived)', 'in') + o('out', 'Stock out (dispatched or sold)') + o('transfer', 'Transfer between warehouses'))}
      ${sel('mv-product', 'Design', byCol.map(([c, ps]) => `<optgroup label="${esc(c.category + ' · ' + c.name)}">${ps.map(p => o(p.id, p.name + (p.code ? ' · ' + p.code : ''), pre)).join('')}</optgroup>`).join(''))}
      ${sel('mv-wh', 'Warehouse', whs.map(w => o(w.id, w.name, F().wh || whs[0].id)).join(''))}
      ${sel('mv-to', 'Move to (transfer only)', o('', 'Not a transfer') + whs.map(w => o(w.id, w.name)).join(''))}
      <div class="field"><label for="mv-boxes">Boxes</label><input class="input" id="mv-boxes" type="number" min="1" step="1" inputmode="numeric"></div>
      <div class="field span2"><label for="mv-note">Note (invoice, order, reason)</label><input class="input" id="mv-note"></div></div>
      ${errBox('mv-err')}<div class="row"><button class="btn primary" data-act="move-save">Save stock move</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
};
EM.ACTIONS['move-save'] = async el => {
  const b = { kind: qs('#mv-kind').value, product_id: qs('#mv-product').value, warehouse_id: qs('#mv-wh').value, to_warehouse_id: qs('#mv-to').value, boxes: Number(qs('#mv-boxes').value), note: qs('#mv-note').value };
  if (!Number.isInteger(b.boxes) || b.boxes <= 0) return showErr('mv-err', 'Boxes must be a whole number above 0.');
  busy(el, true);
  try { const r = await API('POST', '/api/stock', b); D.inventory = r.inventory; EM.closeModal(); EM.toast(`<b>${esc(MOVE_KINDS[b.kind])} saved</b><ul><li>${b.boxes} boxes</li></ul>`); EM.rerender(); }
  catch (x) { busy(el, false); showErr('mv-err', x.message); }
};

/* ---------------------------------------------------------------- operations: the processing side (4 Oct)
   EGO Premium: Orders > Fulfilment (sets real stock aside, dispatch takes it out) > Production
   when stock is short. Big E: installation sites with steps, readiness and snags. Both:
   complaints and approvals. Priority 200 ranks the dealers from what is saved here.
   Every stage set is edited in Lists & stages; the locked stages carry the logic. */
const FN = r => nm(D.lists, 'ops.fulfilment_stages', r), PNn = r => nm(D.lists, 'ops.production_stages', r);   // a stage by its role, whatever it is called now
/* R3b: Big E's sales now have fulfilment records too (the retail ladder). OPSD().orders stays EGO Premium's wholesale
   fulfilment, so every wholesale count, board and dashboard reads what it always read; Big E's are OPSD().rorders,
   and allOrders() is both, for the screens that show any sale (Orders, an opportunity, a client's history, files). */
const OPS_EMPTY = { orders: [], lines: [], allocations: [], production: [], waits: [], sites: [], snags: [], complaints: [], approvals: [] };
let opsMemo = null;
const OPSD = () => { const o = D.ops || OPS_EMPTY;
  if (!opsMemo || opsMemo.src !== o || opsMemo.arr !== o.orders) { const all = o.orders || []; opsMemo = { src: o, arr: o.orders, v: { ...o, orders: all.filter(x => x.division !== 'retail'), rorders: all.filter(x => x.division === 'retail') } }; }
  return opsMemo.v; };
const allOrders = () => [...OPSD().orders, ...OPSD().rorders];
const OS_ = k => opsStages(D.lists, k);
const prodName = id => { const p = INVD().products.find(x => x.id === id); return p ? `${p.name}${p.code ? ' · ' + p.code : ''}` : 'Design'; };
const clientName = id => (CL()[id] || { name: 'Outside your view' }).name;
const inr0 = n => n == null ? '' : '₹' + Math.round(n).toLocaleString('en-IN');
const stageChips = (stages, cur) => `<div class="row" style="flex-wrap:wrap;gap:4px">${stages.map((s, i) => { const at = stages.indexOf(cur); return `<span class="badge ${i < at ? 'ok' : i === at ? 'info' : 'plain'}">${esc(s)}</span>`; }).join('')}</div>`;
const pendingFor = (entity, id) => OPSD().approvals.filter(a => a.entity === entity && a.record_id === id && a.status === 'Pending');
const refreshOps = async () => { const fresh = await API('GET', '/api/bootstrap'); window.EGOLIVE.refresh(fresh); };
const opsAct = async (el, path, body, okMsg, errId) => {
  busy(el, true);
  try { const r = await API('POST', '/api/ops/' + path, body || {}); EM.closeModal(); if (okMsg) EM.toast(okMsg); await refreshOps(); return r; }
  catch (x) { busy(el, false); if (errId && qs('#' + errId)) showErr(errId, x.message); else bubbleNear(el, x.message); await refreshOps(); return null; }
};
async function showLog(entity, id, box) {
  try { const r = await API('GET', `/api/ops/log?entity=${entity}&id=${encodeURIComponent(id)}`), el = qs(box); if (el) el.innerHTML = r.log.length ? table(['When', 'From', 'To', 'By', 'Note'], r.log.map(l => [ds(l.at.slice(0, 10)), esc(l.from_stage || ''), `<b>${esc(l.to_stage)}</b>`, esc(l.by_name || ''), esc(l.note || '')])) : '<p class="small muted">Nothing yet.</p>'; } catch (x) { }
}

/* ---- fulfilment (wholesale): the sale is the opportunity; at Order confirmed it comes here */
const ORD_TABS = [['fulfilment', 'Fulfilment'], ['production', 'Production']];
const waitsOf = (pred) => OPSD().waits.filter(pred);
const poRef = id => (OPSD().production.find(p => p.id === id) || { ref: 'PO' }).ref;
const oppOf = o => D.opportunities.find(x => x.id === o.opp_id);
/* the whole road, from the first contact to the dealer's door, said once at the top */
const flowStrip = () => { const W = D.lists.stages.wholesale || [], FS = OS_('fulfilment_stages'), PS = OS_('production_stages'), won = wonStage('wholesale', D.lists);
  const chip = (t, cls) => `<span class="badge ${cls || 'plain'}">${esc(t)}</span>`, arrow = '<span class="muted">→</span>';
  return `<section class="card stack-s" data-flow><h3>How a wholesale sale moves</h3>
    <div class="row" style="flex-wrap:wrap;gap:6px;align-items:center"><b class="small">1. Opportunities (the sale)</b>${W.filter(x => ![lostStage('wholesale', D.lists), nm(D.lists, 'stages.wholesale', 'Nurturing')].includes(x)).map(x => chip(x, x === won ? 'ok' : '')).join(arrow)}</div>
    <p class="small muted">The designs, boxes, rate and other charges are typed on the opportunity; the money is worked out. At <b>${esc(won)}</b> the sale comes here by itself. ${esc(lostStage('wholesale', D.lists))} and ${esc(nm(D.lists, 'stages.wholesale', 'Nurturing'))} stay in Opportunities.</p>
    <div class="row" style="flex-wrap:wrap;gap:6px;align-items:center"><b class="small">2. Fulfilment</b>${FS.map(x => chip(x, [FN('Stock check'), FN('Invoiced')].includes(x) ? 'warn' : x === FN('Payment received') ? 'ok' : x === FN('Dispatched') ? 'info' : '')).join(arrow)}</div>
    <p class="small muted">At <b>${esc(FN('Stock check'))}</b> each design is compared with what is free in the warehouses and the boxes are blocked. Whatever is missing is named, design by design, and goes on a production order; the sale waits for it, then is blocked from what arrives. <b>${esc(FN('Payment received'))}</b> records the advance or the full payment. <b>${esc(FN('Invoiced'))}</b> checks the credit limit. <b>${esc(FN('Dispatched'))}</b> takes the boxes out of the inventory.</p>
    <div class="row" style="flex-wrap:wrap;gap:6px;align-items:center"><b class="small">3. Production (only for what was short)</b>${PS.map(x => chip(x, x === PNn('Received at warehouse') ? 'warn' : '')).join(arrow)}</div>
    <p class="small muted">One production order can serve several sales of the same design. <b>${esc(PNn('Received at warehouse'))}</b> adds the boxes to stock; <b>${esc(PNn('Allocated & closed'))}</b> gives each waiting sale its share, oldest first, and they move on by themselves.</p></section>`; };
EM.VIEWS.orders = arg => {
  /* R3b: Big E has its own fulfilment, the retail ladder; in Both it is the third tab */
  const rfHead = `<div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">Big E · from Won to Closed</div><h1>Fulfilment</h1></div><div class="row"><a class="btn" href="#/opps/retail_lead">Retail leads</a><a class="btn" href="#/opps/retail_project">Retail projects</a></div></div>`;
  if (EM.div === 'retail') return `<div class="stack">${rfHead}${rfBoard()}</div>`;
  const TABS = EM.div === 'both' ? [...ORD_TABS, ['bige', 'Big E fulfilment']] : ORD_TABS;
  const tab = TABS.find(t => t[0] === arg) ? arg : 'fulfilment';
  if (tab === 'bige') return `<div class="stack">${rfHead}${subtabs('#/orders', tab, TABS.map(([k, l]) => [k, `${l} <span class="muted">${k === 'fulfilment' ? OPSD().orders.length : k === 'bige' ? OPSD().rorders.length : OPSD().production.length}</span>`]))}${rfBoard()}</div>`;
  let O = OPSD();
  const lineSum = id => O.lines.filter(l => l.order_id === id);
  const head = `<div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">EGO Premium · from the confirmed order to the dealer's door</div><h1>Fulfilment</h1></div>
    <div class="row">${tab === 'production' && canStockUI() ? '<button class="btn" data-act="po-add">+ Production order</button>' : ''}<a class="btn" href="#/opps/wholesale">Wholesale opportunities</a></div></div>
    ${flowStrip()}
    ${subtabs('#/orders', tab, TABS.map(([k, l]) => [k, `${l} <span class="muted">${k === 'fulfilment' ? O.orders.length : k === 'bige' ? O.rorders.length : O.production.length}</span>`]))}
    ${searchBox(tab === 'fulfilment' ? 'Fulfilment number, opportunity or dealer' : 'Production order, design or container')}`;
  let body;
  if (tab === 'fulfilment') {
    const liveO = O.orders.filter(o => (o.ful_stage !== lastOf(OS_('fulfilment_stages')) || thisMonth(stageAt(o.id, o.ful_stage))) && matches(`${o.ref} ${(oppOf(o) || { title: '' }).title} ${clientName(o.client_id)}`, []));
    body = `<p class="small muted">The board shows what is live. A delivered order stays in ${esc(lastOf(OS_('fulfilment_stages')))} until the end of the month it was delivered in; every order, old and new, is in <a href="#/orderbook">Orders</a>.</p>${O.orders.length ? '' : `<p class="small muted">Nothing in fulfilment yet. A wholesale opportunity comes here when it reaches ${esc(wonStage('wholesale', D.lists))}.</p>`}${stageBoard(OS_('fulfilment_stages'), liveO, o => o.ful_stage, ordCard)}
      ${liveO.length ? table(['Fulfilment', 'Opportunity', 'Dealer', 'Boxes', ...(D.access.prices ? ['Value'] : []), 'Stage', 'Production orders'], liveO.map(o => ({ href: '#/order/' + o.id,
        cells: [`<b>${esc(o.ref)}</b><div class="small muted">${ds(o.created_at.slice(0, 10))}</div>`, esc((oppOf(o) || { title: '' }).title), esc(clientName(o.client_id)), num(lineSum(o.id).reduce((a, l) => a + l.boxes, 0)), ...(D.access.prices ? [inr0(o.total)] : []),
          `<span class="badge info">${esc(o.ful_stage)}</span>`, esc([...new Set(waitsOf(w => w.order_id === o.id).map(w => poRef(w.po_id)))].join(', '))] }))) : ''}`;
  } else {
    const nSales = p => new Set(waitsOf(w => w.po_id === p.id).map(w => w.order_id)).size;
    O = { ...O, production: O.production.filter(p => matches(`${p.ref} ${prodName(p.product_id)} ${p.container || ''}`, [])) };
    body = stageBoard(OS_('production_stages'), O.production, p => p.stage, p => `<a class="card stack-s" style="text-decoration:none" href="#/po/${p.id}"><b>${esc(p.ref)}</b><span class="small">${esc(prodName(p.product_id))}</span><span class="small muted">${num(p.boxes)} boxes · for ${nSales(p)} sale${nSales(p) === 1 ? '' : 's'}</span></a>`)
      + (O.production.length ? table(['Production order', 'Design', 'Boxes', 'For sales', 'Stage', 'Expected', 'Warehouse'], O.production.map(p => ({ href: '#/po/' + p.id,
        cells: [`<b>${esc(p.ref)}</b>${p.container ? `<div class="small muted">${esc(p.container)}</div>` : ''}`, esc(prodName(p.product_id)), num(p.boxes), esc([...new Set(waitsOf(w => w.po_id === p.id).map(w => (O.orders.find(o => o.id === w.order_id) || {}).ref))].join(', ')), `<span class="badge info">${esc(p.stage)}</span>`, p.eta ? ds(p.eta) : '', esc((INVD().warehouses.find(w => w.id === p.warehouse_id) || {}).name || '')] })))
        : '<p class="small muted">No production orders yet. One is made at Stock check for what a sale cannot take from the warehouses, or placed directly.</p>');
  }
  return `<div class="stack">${head}${body}</div>`;
};
EM.VIEWS.orders.title = () => 'Fulfilment';
/* what an order still misses: per line, ordered − blocked − on production */
const shortLines = id => { const O = OPSD(); return O.lines.filter(l => l.order_id === id).map(l => { const got = O.allocations.filter(a => a.line_id === l.id).reduce((a, x) => a + x.boxes, 0), wait = O.waits.filter(w => w.line_id === l.id && !w.done).reduce((a, w) => a + w.boxes, 0); return { l, got, wait, miss: Math.max(0, l.boxes - got - wait) }; }); };
const missingOf = id => shortLines(id).reduce((a, x) => a + x.miss, 0);
const ordCard = o => { const miss = [FN('Stock check'), FN('Waiting on production')].includes(o.ful_stage) ? missingOf(o.id) : 0;
  return `<a class="card stack-s" style="text-decoration:none" href="#/order/${o.id}"><b>${esc(o.ref)}</b><span class="small">${esc(clientName(o.client_id))}</span><span class="small muted">${num(OPSD().lines.filter(l => l.order_id === o.id).reduce((a, l) => a + l.boxes, 0))} boxes</span>${miss ? `<span class="badge bad">Short ${num(miss)} boxes</span>` : ''}${o.credit_hold ? '<span class="badge warn">Credit hold</span>' : ''}</a>`; };
/* the designs on a wholesale opportunity, with the money worked out */
function oppLinesCard(o) {
  const ls = (OPSD().oppLines || []).filter(l => l.opp_id === o.id), ex = o.extra || {}, ord = OPSD().orders.find(x => x.opp_id === o.id), pend = pendingFor('opp', o.id), apprs = OPSD().approvals.filter(a => a.entity === 'opp' && a.record_id === o.id);
  return `<section class="card stack-s" data-opp-lines><div class="row between"><h3>Designs, sq ft and boxes</h3>${ord ? `<a class="btn sm primary" href="#/order/${ord.id}">In fulfilment: ${esc(ord.ref)} · ${esc(ord.ful_stage)}</a>` : ''}</div>
    ${ls.length ? linesTable(ls, [['Free boxes now', l => l.boxes ? num(INVD().warehouses.reduce((a, w) => a + Math.max(0, freeAt(l.product_id, w.id)), 0)) : '']])
      + `<p class="small">${linesSum(ls)}</p>` + (D.access.prices ? `<p class="small" data-money>${moneyLine(ex)} = <b>${inr0(o.value)}</b></p>` : (ex.charges || []).length ? `<p class="small muted">Other charges: ${ex.charges.map(c => esc(c.label)).join(', ')}</p>` : '')
      : `<p class="small muted">No designs yet. Edit the opportunity to add the designs with their sq ft needed and rate; they are needed before ${esc(wonStage(o.pipeline, D.lists))}.</p>`}
    ${pend.length ? `<div class="callout warn"><b>Waiting for approval.</b> ${pend.map(a => esc(a.reason)).join(' · ')} <a href="#/approvals">Approvals</a></div>` : ''}
    ${apprs.filter(a => a.status !== 'Pending').map(a => `<p class="small muted">${esc((D.lists.rules.approvals[a.kind] || { label: a.kind }).label)}: <b>${esc(a.status)}</b> by ${esc(staffName(a.decided_by))}${a.decision_note ? ' · ' + esc(a.decision_note) : ''}</p>`).join('')}</section>`;
}

/* R4: one line editor for every pipeline with designs. THE quantity rule is qtyLine (schema.js); a saved line comes back
   with keep = its id and is sent untouched (its saved numbers stay) until something on it is changed. */
const lineProd = pid => INVD().products.find(x => x.id === pid);
const lineUnit = pid => { const p = lineProd(pid); return p ? catUnit(colOf(p).category, D.lists.rules) : 'sqft'; };
const lineBox = pid => { const p = lineProd(pid); return p ? boxSizeOf(p, colOf(p)) : 0; };
const lineCalc = l => qtyLine({ unit: lineUnit(l.product_id), sqft_need: l.sqft_need, wastage_pct: l.wastage_pct, per_box: lineBox(l.product_id) || l.per_box, qty: l.qty, rate: l.rate });
const calcTxt = q => q.error ? `<span class="muted">${esc(q.error)}</span>` : q.unit === 'sqft' ? `${num(q.supply)} sq ft with ${num(q.wastage_pct)}% wastage · <b data-q-boxes>${num(q.boxes)}</b> boxes of ${num(q.per_box)} sq ft = <b data-q-sqft>${num(q.sqft)}</b> sq ft supplied${D.access.prices ? ` · <b data-q-amt>${inr0(q.amount)}</b>` : ''}` : `${num(q.qty)} ${q.unit === 'rft' ? 'rft' : 'pieces'}${D.access.prices ? ` · <b data-q-amt>${inr0(q.amount)}</b>` : ''}`;
const ordLine = (i, v = {}) => { const I = INVD(), byCol = I.collections.map(c => [c, I.products.filter(p => p.collection_id === c.id && p.status !== 'Discontinued')]).filter(([, ps]) => ps.length);
  const pick = `<div class="field span2"><label for="ol-p-${i}">Design</label><select class="input" id="ol-p-${i}" data-ol="p"><option value="">Choose</option>${byCol.map(([c, ps]) => `<optgroup label="${esc(c.category + ' · ' + c.name)}">${ps.map(p => `<option value="${p.id}" ${p.id === v.product_id ? 'selected' : ''}>${esc(p.name)}${p.code ? ' · ' + esc(p.code) : ''}</option>`).join('')}</optgroup>`).join('')}</select></div>`;
  if (v.keep && !v.unit) return `<div class="fgrid ordline" data-i="${i}" data-keep="${esc(v.keep)}" data-pid="${esc(v.product_id)}" style="align-items:end"><div class="field span2"><label>Design</label><input class="input" value="${esc(prodName(v.product_id))}" disabled></div>
    <div class="field span2"><span class="small">${esc(qtyText(v))}${D.access.prices ? ` · ${inr0(v.rate)} / ${rateUnit(v)} · <b>${inr0(v.amount)}</b>` : ''}</span><span class="small muted">Saved before the wastage rule, so its numbers stay as saved.</span></div>
    <div class="field row"><button class="btn sm" data-act="ol-change">Change</button><button class="btn sm ghost" data-act="ol-del">Remove</button></div></div>`;
  const u = lineUnit(v.product_id), pb = lineBox(v.product_id), sq = u === 'sqft';
  const w = v.wastage_pct == null || v.wastage_pct === '' ? wastageDefault(D.lists.rules) : v.wastage_pct;
  return `<div class="ordline stack-s" data-i="${i}"${v.keep ? ` data-keep="${esc(v.keep)}"` : ''}><div class="fgrid" style="align-items:end">${pick}
    ${sq ? `<div class="field"><label for="ol-s-${i}">Sq ft needed</label>${G.adorn({ key: 'area_sqft' }, `<input class="input" type="number" min="0" step="0.01" id="ol-s-${i}" data-ol="s" value="${esc(v.sqft_need || '')}">`)}</div>
      <div class="field"><label for="ol-w-${i}">Wastage</label><div class="adorn" data-unit="%"><input class="input" type="number" min="0" max="100" step="0.5" id="ol-w-${i}" data-ol="w" value="${esc(w)}"><span class="suf">%</span></div></div>
      ${v.product_id && !pb ? `<div class="field"><label for="ol-pb-${i}">Sq ft per box *</label>${G.adorn({ key: 'area_sqft' }, `<input class="input" type="number" min="0" step="0.01" id="ol-pb-${i}" data-ol="pb" value="${esc(v.per_box || '')}">`)}<span class="small muted">This design has no box size yet.</span></div>` : ''}`
    : `<div class="field"><label for="ol-q-${i}">${u === 'rft' ? 'Running ft (rft)' : 'Pieces'}</label><input class="input" type="number" min="0" step="${u === 'rft' ? '0.5' : '1'}" id="ol-q-${i}" data-ol="q" value="${esc(v.qty || '')}"></div>`}
    ${D.access.prices ? `<div class="field"><label for="ol-r-${i}">Rate per ${QTY_UNITS[u]}</label>${G.adorn({ type: 'money', key: 'rate' }, `<input class="input" type="number" min="0" step="0.01" id="ol-r-${i}" data-ol="r" value="${esc(v.rate || '')}">`)}<span class="small muted" data-listrate>${listRateTxt(v.product_id)}</span></div>` : ''}
    <div class="field"><button class="btn sm ghost" data-act="ol-del">Remove</button></div></div>
    <div class="small" data-ol-calc>${v.product_id ? calcTxt(lineCalc({ ...v, wastage_pct: w })) : ''}</div></div>`; };
const readLine = l => { const q = k => l.querySelector(`[data-ol="${k}"]`), val = k => q(k) ? q(k).value : '';
  if (l.dataset.keep && l.dataset.pid) return { keep: l.dataset.keep, product_id: l.dataset.pid };
  const out = { product_id: val('p'), rate: Number(val('r') || 0) };
  if (q('s')) Object.assign(out, { sqft_need: Number(val('s') || 0), wastage_pct: val('w') === '' ? 0 : Number(val('w')) });
  if (q('pb')) out.per_box = Number(val('pb') || 0);
  if (q('q')) out.qty = Number(val('q') || 0);
  if (l.dataset.keep) out.keep = l.dataset.keep;
  return out; };
const readOrder = () => [...document.querySelectorAll('#olines .ordline')].map(readLine).filter(l => l.product_id || l.sqft_need || l.qty);
const savedLine = l => (OPSD().oppLines || []).find(x => x.id === l.keep) || {};
document.addEventListener('input', e => {
  if (!e.target.closest || !e.target.closest('#ordf, #of')) return;
  const row = e.target.closest('.ordline');
  if (row && e.target.dataset.ol && !row.dataset.pid) { delete row.dataset.keep; const c = row.querySelector('[data-ol-calc]'), v = readLine(row); if (c) c.innerHTML = v.product_id ? calcTxt(lineCalc(v)) : ''; }
  const ls = readOrder().map(l => l.keep ? savedLine(l) : { ...l, ...lineCalc(l) }).filter(l => !l.error), gross = ls.reduce((a, l) => a + (Number(l.amount) || 0), 0), disc = Number((qs('#ord-disc') || { value: 0 }).value || 0), chg = readCharges().reduce((a, c) => a + (c.amount || 0), 0), sub = gross * (1 - disc / 100) + chg, t = qs('#ord-total');
  if (t) t.innerHTML = `${linesSum(ls)}${D.access.prices ? ` · designs ${inr0(gross * (1 - disc / 100))}${chg ? ` + charges ${inr0(chg)}` : ''} = ${inr0(sub)} before GST + GST ${D.lists.rules.gst_pct}% = ${inr0(sub * (1 + D.lists.rules.gst_pct / 100))}` : ''}`;
});
EM.ACTIONS['ol-add'] = () => { const box = qs('#olines'); box.insertAdjacentHTML('beforeend', ordLine(box.children.length, {})); };
EM.ACTIONS['ol-del'] = el => { const l = el.closest('.ordline'); if (document.querySelectorAll('#olines .ordline').length > 1) l.remove(); const f = qs('#of'); if (f) f.dispatchEvent(new Event('input', { bubbles: true })); };
/* a line saved before R4: Change turns it into sq ft needed + wastage, starting from what was supplied, at 0% */
EM.ACTIONS['ol-change'] = el => { const row = el.closest('.ordline'), v = savedLine({ keep: row.dataset.keep }), u = lineUnit(v.product_id), pb = lineBox(v.product_id);
  row.outerHTML = ordLine(row.dataset.i, { product_id: v.product_id, sqft_need: u === 'sqft' ? (Number(v.sqft) || Math.round((v.boxes || 0) * pb * 100) / 100) : '', qty: u === 'sqft' ? '' : v.boxes || '', wastage_pct: 0, rate: '' }); };
/* THE line table: opportunity, fulfilment (EGO and Big E), the PI and Analysis read a line the same way */
const linesTable = (ls, more = []) => table(['Design', 'Sq ft needed', 'Wastage', 'Boxes', 'Sq ft supplied', ...(D.access.prices ? ['Rate', 'Amount'] : []), ...more.map(m => m[0])],
  ls.map(l => { const acc = l.unit === 'piece' || l.unit === 'rft', old = !l.unit;
    return [`<b>${esc(prodName(l.product_id))}</b>${l.per_box ? `<div class="small muted">${num(l.per_box)} sq ft per box</div>` : ''}`, acc ? `${num(l.qty)} ${l.unit === 'rft' ? 'rft' : 'pieces'}` : old ? '' : num(l.sqft_need), acc ? '' : `${num(old ? 0 : l.wastage_pct)}%`,
      acc ? '' : `<span data-l-boxes>${num(l.boxes)}</span>`, acc ? '' : `<span data-l-sqft>${Number(l.sqft) ? num(l.sqft) : ''}</span>`, ...(D.access.prices ? [`${inr0(l.rate)} / ${rateUnit(l)}`, `<span data-l-amt>${inr0(l.amount)}</span>`] : []), ...more.map(m => m[1](l))]; }));
const linesSum = ls => `${num(Math.round(ls.reduce((a, l) => a + (Number(l.sqft) || 0), 0) * 100) / 100)} sq ft supplied · ${num(ls.reduce((a, l) => a + (Number(l.boxes) || 0), 0))} boxes`;
const LOST_KEYS = ['lost_reason', 'lost_detail'];
const chgLine = (i, c = {}) => `<div class="fgrid chgline" data-i="${i}" style="align-items:end"><div class="field span2"><label for="chg-l-${i}">What it is for</label><input class="input" id="chg-l-${i}" data-chg="l" list="chg-hints" value="${esc(c.label || '')}" placeholder="e.g. Installation"></div>
  <div class="field"><label for="chg-a-${i}">Amount</label>${G.adorn({ type: 'money', key: 'charge' }, `<input class="input" type="number" min="0" step="0.01" id="chg-a-${i}" data-chg="a" value="${esc(c.amount || '')}">`)}</div><div class="field"><button class="btn sm ghost" data-act="chg-del">Remove</button></div></div>`;
const readCharges = () => [...document.querySelectorAll('#ochg .chgline')].map(l => ({ label: l.querySelector('[data-chg="l"]').value.trim(), amount: Number(l.querySelector('[data-chg="a"]').value || 0) })).filter(c => c.label || c.amount);
EM.ACTIONS['chg-add'] = () => { const box = qs('#ochg'); box.insertAdjacentHTML('beforeend', chgLine(box.children.length)); box.lastElementChild.querySelector('input').focus(); };
EM.ACTIONS['chg-del'] = el => { el.closest('.chgline').remove(); const f = qs('#of'); if (f) f.dispatchEvent(new Event('input', { bubbles: true })); };
const moneyLine = ex => { const ch = (ex.charges || []).filter(c => c.amount != null);
  return `${ex.discount_pct ? `Discount ${ex.discount_pct}% · ` : ''}${ch.length ? ch.map(c => `${esc(c.label)} ${inr0(c.amount)}`).join(' · ') + ' · ' : ''}Taxable ${inr0(ex.subtotal)} + GST ${ex.gst_pct ?? D.lists.rules.gst_pct}%`; };
/* one fulfilment: the sale it came from, each design against the warehouses, and the production orders serving it */
EM.VIEWS.order = id => {
  const O = OPSD(), o = O.orders.find(x => x.id === id);
  if (!o && O.rorders.find(x => x.id === id)) return rfOrderView(O.rorders.find(x => x.id === id));   // R3b: a Big E sale
  if (!o) return `<div class="stack"><h1>Fulfilment not found</h1><a class="btn" href="#/orders">Fulfilment</a></div>`;
  const FS = OS_('fulfilment_stages'), lines = O.lines.filter(l => l.order_id === id), WH = INVD().warehouses, opp = oppOf(o);
  const al = l => O.allocations.filter(a => a.line_id === l.id), got = l => al(l).reduce((a, x) => a + x.boxes, 0);
  const wl = l => O.waits.filter(w => w.line_id === l.id), waiting = l => wl(l).filter(w => !w.done).reduce((a, w) => a + w.boxes, 0);
  const atCheck = [FN('Stock check'), FN('Waiting on production')].includes(o.ful_stage);
  const mineAt = (l, w) => al(l).filter(a => a.warehouse_id === w.id && !a.dispatched).reduce((a, x) => a + x.boxes, 0);
  return `<div class="stack">${crumbs(['Fulfilment', '#/orders'], [o.ref])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(o.ref)}</h1><p class="muted">From ${opp ? `<a href="#/opp/${opp.id}">${esc(opp.title)}</a>` : 'an opportunity'} · <a href="#/client/${o.client_id}">${esc(clientName(o.client_id))}</a> · order confirmed ${ds(o.created_at.slice(0, 10))}${D.access.prices ? ` · <b>${inr0(o.total)}</b>` : ''}</p></div>
      ${o.ful_stage !== lastOf(FS) && fulMayMove(o) ? `<button class="btn primary" data-act="ful-next" data-id="${id}">Move fulfilment on</button>` : o.ful_stage !== lastOf(FS) ? `<span class="small muted" data-ful-who>Next step by ${esc(FUL_WHO[fulGroupOf(D.lists, nextFul(o))] || 'the fulfilment team')}</span>` : ''}</div>
    <section class="card stack-s">${stageChips(FS, o.ful_stage)}${o.credit_hold ? `<div class="callout warn"><b>On credit hold.</b> Waiting for the credit approval before ${esc(FN('Invoiced'))}. <a href="#/approvals">Approvals</a></div>` : ''}</section>
    ${shortBox(o)}
    <section class="card stack-s" data-stockcheck><div class="row between"><h3>Stock check: each design against the warehouses</h3>${atCheck && D.access.ful.includes('stock') ? `<button class="btn" data-act="alloc-open" data-id="${id}">Block boxes</button>` : ''}</div>
      <p class="small muted">Free = in the warehouse and not blocked for another sale. Missing = ordered − blocked − on a production order; it must be 0 before the sale moves past ${esc(FN('Stock check'))}.</p>
      ${table(['Design', 'Ordered', ...WH.map(w => esc(w.name) + ' <span class="muted">free</span>'), 'Blocked', 'On production', 'Missing'], lines.map(l => { const left = l.boxes - got(l) - waiting(l);
        return [`<b>${esc(prodName(l.product_id))}</b>`, `<span data-o-boxes>${num(l.boxes)}</span>`, ...WH.map(w => `${num(Math.max(0, freeAt(l.product_id, w.id) + mineAt(l, w)))}${mineAt(l, w) ? ` <span class="badge ok">${mineAt(l, w)} blocked</span>` : ''}`), num(got(l)), waiting(l) ? num(waiting(l)) : '', left > 0 ? `<span class="badge bad">${left}</span>` : '<span class="badge ok">0</span>']; }))}</section>
    ${payCard(o)}
    ${orderFiles(o)}
    <section class="card stack-s" data-sources><h3>Where each design's boxes come from</h3>
      ${table(['Design', 'Sq ft supplied', 'From a warehouse', 'From production', ...(D.access.prices ? ['Rate', 'Amount'] : [])], lines.map(l => [`<b>${esc(prodName(l.product_id))}</b><div class="small muted">${esc(qtyText(l))}</div>`, `<span data-o-sqft>${Number(l.sqft) ? num(l.sqft) : ''}</span>`,
        esc(al(l).filter(a => !a.po_id).map(a => `${(WH.find(w => w.id === a.warehouse_id) || {}).name}: ${a.boxes}${a.dispatched ? ' (dispatched)' : ''}`).join(', ')) || '<span class="muted">None</span>',
        wl(l).length ? wl(l).map(w => `<a href="#/po/${w.po_id}">${esc(poRef(w.po_id))}</a>: ${w.boxes} ${w.done ? '<span class="badge ok">arrived, blocked</span>' : '<span class="badge warn">waiting</span>'}`).join('<br>') : '<span class="muted">None</span>',
        ...(D.access.prices ? [`${inr0(l.rate)} / ${rateUnit(l)}`, `<span data-o-amt>${inr0(l.amount)}</span>`] : [])]))}</section>
    ${piCard(o, lines)}
    ${orderStory(o)}</div>`;
};
/* R4: the PI view. EGO makes the PI in Tally; this is what it must say, line for line, from the same saved lines */
const piCard = (o, lines) => `<section class="card stack-s" data-pi><div class="row between"><h3>PI: what it says</h3><button class="btn sm" data-act="pi-print">Print</button></div>
  <p class="small muted">${esc(o.ref)} · ${esc(clientName(o.client_id))}. The same lines as the opportunity and the dealer portal: sq ft needed, wastage, whole boxes, sq ft supplied${D.access.prices ? ', rate and amount' : ''}.</p>
  ${linesTable(lines)}<p class="small">${linesSum(lines)}${D.access.prices ? ` · ${moneyLine({ ...(o.extra || {}), subtotal: o.subtotal, gst_pct: o.gst_pct })} = <b data-pi-total>${inr0(o.total)}</b>` : ''}</p></section>`;
EM.ACTIONS['pi-print'] = el => { const sec = el.closest('[data-pi]'), w = window.open('', '_blank'); if (!w) return; w.document.write(`<title>PI lines</title><style>body{font:14px Inter,system-ui,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left}button{display:none}</style>${sec.innerHTML}`); w.document.close(); w.print(); };
EM.VIEWS.order.tab = 'orders';
EM.VIEWS.order.title = id => (allOrders().find(x => x.id === id) || { ref: 'Fulfilment' }).ref;

/* ================================================================ R3b (17 Oct): Big E fulfilment, the RETAIL ladder
   Won > Advance received > Stock check > Blocked > Delivered to site > Installation > Balance received > Closed.
   A Big E sale reaching Won opens its fulfilment record (the Worker); its line items are design, sq ft, rate per sq ft, amount
   (boxes come in R4). Blocked uses the same stock block as EGO; Installation creates or links the installation site. */
const RF_WHAT = { 'Advance received': 'the advance is recorded', 'Stock check': 'the designs are checked against the warehouses', Blocked: 'boxes are blocked for every design',
  'Delivered to site': 'the blocked boxes leave the warehouses', Installation: 'the installation site opens (or the one already made is linked)', 'Balance received': 'the balance is paid in full', Closed: 'the sale is done' };
const RF_WHO = { stock: 'the stock team', money: 'Accounts', dispatch: 'Dispatch' };
const rfNext = o => RETAIL_FUL[RETAIL_FUL.indexOf(o.ful_stage) + 1];
const rfMay = o => { const n = rfNext(o); return !!n && (D.access.ful || []).includes(RETAIL_FUL_GROUP[n]); };
const rfLines = o => OPSD().lines.filter(l => l.order_id === o.id);
const rfBlocked = l => OPSD().allocations.filter(a => a.line_id === l.id).reduce((a, x) => a + x.boxes, 0);
const rfSites = o => OPSD().sites.filter(x => (x.extra || {}).order_id === o.id || (o.opp_id && x.opp_id === o.opp_id));
const rfSqft = ls => Math.round(ls.reduce((a, l) => a + Number(l.sqft || 0), 0) * 100) / 100;
const rfLineTable = (ls, withBlocked) => linesTable(ls, withBlocked ? [['Boxes blocked', l => !l.boxes ? '' : rfBlocked(l) ? `<span class="badge ${rfBlocked(l) >= l.boxes ? 'ok' : 'warn'}">${num(rfBlocked(l))} of ${num(l.boxes)}</span>` : '<span class="badge plain">None yet</span>']] : []);
/* on a Big E opportunity: its line items, and its fulfilment once Won */
function rfOppLinesCard(o) {
  const ls = (OPSD().oppLines || []).filter(l => l.opp_id === o.id), ord = OPSD().rorders.find(x => x.opp_id === o.id), ex = o.extra || {};
  return `<section class="card stack-s" data-opp-lines data-rf-opp><div class="row between"><h3>Designs, sq ft and boxes</h3>${ord ? `<a class="btn sm primary" href="#/order/${ord.id}">In fulfilment: ${esc(ord.ref)} · ${esc(ord.ful_stage)}</a>` : ''}</div>
    ${ls.length ? rfLineTable(ls) + `<p class="small">${linesSum(ls)}${D.access.prices ? ` · ${moneyLine(ex)} = <b>${inr0(o.value)}</b>` : ''}</p>`
      : `<p class="small muted">No designs yet. Edit the opportunity to add each design with its sq ft and rate per sq ft; they are needed before ${esc(wonStage(o.pipeline, D.lists))}, when its fulfilment opens.</p>`}</section>`;
}
EM.rfF = { period: 'all', from: '', to: '', stage: '', owner: '', field: '', fq: '' };
const RF_FIELDS = [['ref', 'Fulfilment number'], ['title', 'Sale'], ['client', 'Client'], ['stage', 'Stage'], ['owner', 'Owner'], ['designs', 'Designs']];
const rfVal = (o, k) => k === 'title' ? (oppOf(o) || { title: o.notes || '' }).title : k === 'client' ? clientName(o.client_id) : k === 'stage' ? o.ful_stage : k === 'owner' ? staffName(o.owner_id) : k === 'designs' ? rfLines(o).map(l => prodName(l.product_id)).join(' ') : String(o[k] || '');
function rfBoard() {
  const f = EM.rfF, fq = f.fq.trim().toLowerCase(), all = OPSD().rorders;
  const rows = all.filter(o => (!f.stage || o.ful_stage === f.stage) && (!f.owner || o.owner_id === f.owner) && inPeriod(o.created_at, f.period, f.from, f.to)
    && (!fq || (f.field ? [rfVal(o, f.field)] : RF_FIELDS.map(([k]) => rfVal(o, k))).some(v => v.toLowerCase().includes(fq))) && matches(`${o.ref} ${rfVal(o, 'title')} ${rfVal(o, 'client')} ${rfVal(o, 'designs')}`, [(CL()[o.client_id] || {}).mobile]));
  const sel = (k, label, opts) => `<label class="field" style="min-width:150px"><span class="small muted">${label}</span><select class="input" data-rff="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const chip = (t, i) => `<span class="badge ${i === 0 ? 'ok' : t === 'Blocked' ? 'warn' : ''}">${esc(t)}</span>`;
  return `<section class="card stack-s" data-flow data-rf-flow><h3>How a Big E sale moves</h3><div class="row" style="flex-wrap:wrap;gap:6px;align-items:center">${RETAIL_FUL.map(chip).join('<span class="muted">→</span>')}</div>
      <p class="small muted">At <b>Won</b> on a retail lead or retail project the sale comes here by itself, with its designs in sq ft. ${RETAIL_FUL.slice(1).map(st => `<b>${esc(st)}</b>: ${esc(RF_WHAT[st])}`).join('. ')}.</p></section>
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-rf-filters>${dateFilter(f, 'rf', 'When it was won')}${sel('stage', 'Stage', [['', 'Every stage'], ...RETAIL_FUL.map(x => [x, x])])}
      ${sel('owner', 'Owner', [['', 'Everyone'], ...[...new Set(all.map(o => o.owner_id))].map(id => [id, staffName(id)])])}${sel('field', 'Any field', [['', 'Any field'], ...RF_FIELDS])}
      <label class="field" style="min-width:150px"><span class="small muted">contains</span><input class="input" id="rf-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
    ${searchBox('Big E fulfilment: number, sale, client or design')}
    ${stageBoard(RETAIL_FUL, rows, o => o.ful_stage, o => `<a class="mini" style="display:block;text-decoration:none;color:inherit" href="#/order/${o.id}" data-rf-card><b>${esc(o.ref)}</b><div class="small">${esc(clientName(o.client_id))}</div><div class="small muted">${linesSum(rfLines(o))}</div>${rfSites(o).length ? `<div class="small">Site ${esc(rfSites(o)[0].ref)}</div>` : ''}</a>`)}
    ${rows.length ? table(['Fulfilment', 'Sale', 'Client', 'Sq ft', ...(D.access.prices ? ['Value', 'Received'] : []), 'Stage', 'Installation site'], rows.map(o => ({ href: '#/order/' + o.id,
      cells: [`<b>${esc(o.ref)}</b><div class="small muted">${ds(dayIST(o.created_at))}</div>`, esc(rfVal(o, 'title')), esc(clientName(o.client_id)), num(rfSqft(rfLines(o))), ...(D.access.prices ? [inr0(o.total), inr0(o.paid || 0)] : []), `<span class="badge info">${esc(o.ful_stage)}</span>`, esc(rfSites(o).map(x => x.ref).join(', '))] })))
      : empty(all.length ? 'Nothing for this filter' : 'No Big E sale in fulfilment yet', all.length ? 'Change or clear the filters above.' : 'A retail lead or retail project comes here when it reaches Won, with its designs in sq ft and rate per sq ft.')}`;
}
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.rff; if (k) { EM.rfF[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'rf-fq') { EM.rfF.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#rf-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
/* one Big E sale in fulfilment */
function rfOrderView(o) {
  const ls = rfLines(o), opp = oppOf(o), nxt = rfNext(o), sites = rfSites(o), SS = OS_('site_steps'), ex = o.extra || {}, pays = ex.payments || [], due = Math.max(0, (o.total || 0) - (o.paid || 0));
  const atBlock = ['Stock check', 'Blocked'].includes(o.ful_stage) && (D.access.ful || []).includes('stock');
  return `<div class="stack" data-rf-order>${crumbs(['Fulfilment', '#/orders'], [o.ref])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">Big E · retail ladder</div><h1>${esc(o.ref)}</h1><p class="muted">From ${opp ? `<a href="#/opp/${opp.id}">${esc(opp.title)}</a>` : 'a sale'} · <a href="#/client/${o.client_id}">${esc(clientName(o.client_id))}</a> · won ${ds(dayIST(o.created_at))}${D.access.prices ? ` · <b>${inr0(o.total)}</b>` : ''}</p></div>
      ${nxt ? (rfMay(o) ? `<button class="btn primary" data-act="rf-next" data-id="${o.id}">Move to ${esc(nxt)}</button>` : `<span class="small muted" data-ful-who>Next step (${esc(nxt)}) by ${esc(RF_WHO[RETAIL_FUL_GROUP[nxt]])} or Management</span>`) : '<span class="badge ok">Closed</span>'}</div>
    <section class="card stack-s">${stageChips(RETAIL_FUL, o.ful_stage)}${nxt ? `<p class="small muted">Next, <b>${esc(nxt)}</b>: ${esc(RF_WHAT[nxt])}.</p>` : ''}</section>
    <section class="card stack-s" data-rf-lines><div class="row between"><h3>Designs, sq ft and boxes</h3>${atBlock ? `<button class="btn" data-act="rf-alloc" data-id="${o.id}">Block boxes</button>` : ''}</div>
      ${rfLineTable(ls, true)}<p class="small">${linesSum(ls)}${D.access.prices ? ` · ${moneyLine(ex)} = <b>${inr0(o.total)}</b>` : ''}</p>
      <p class="small muted">Blocked uses EGO's stock block: the boxes typed per warehouse are held for this sale and leave the warehouses at Delivered to site.</p></section>
    ${D.access.prices ? `<section class="card stack-s" data-pay><div class="row between"><h3>Advance and balance</h3>${(D.access.ful || []).includes('money') && due > 0 ? `<button class="btn sm" data-act="rf-pay" data-id="${o.id}">+ Record a payment</button>` : ''}</div>
      ${kv([['Total', inr0(o.total)], ['Received', inr0(o.paid || 0)], ['Still due', due > 0 ? `<b>${inr0(due)}</b>` : '<span class="badge ok">Paid in full</span>']])}
      ${pays.length ? table(['Received on', 'Amount', 'Note', 'By'], pays.map(p => [ds(p.on), inr0(p.amount), esc(p.note || ''), esc(staffName(p.by))])) : '<p class="small muted">No payment yet. Advance received records the advance; Balance received needs the rest.</p>'}</section>` : ''}
    <section class="card stack-s" data-rf-site><h3>Installation site</h3>
      ${sites.length ? table(['Site', 'Step', 'Installed by', 'Planned start'], sites.map(x => [`<a href="#/site/${x.id}"><b>${esc(x.ref)}</b> ${esc(x.name)}</a>`, `<span class="badge info">${esc(x.step)}</span> <span class="small muted">${SS.indexOf(x.step) + 1}/${SS.length}</span>`, esc(installedByTxt(x)), x.planned_start ? ds(x.planned_start) : '']))
        : `<p class="small muted">The installation site opens by itself when this sale moves to Installation${OPSD().sites.some(x => x.opp_id === o.opp_id) ? '' : ', under the same client and project'}.</p>`}</section>
    ${orderFiles(o)}
    <section class="stack-s"><h3>History</h3><div id="log-rf"><p class="muted">Loading…</p></div></section></div>`;
}
{ const baseAfter = EM.VIEWS.order.after; EM.VIEWS.order.after = id => { if (OPSD().rorders.some(x => x.id === id)) return showLog('fulfilment', id, '#log-rf'); return baseAfter && baseAfter(id); }; }
const rfPayModal = (o, step) => { const due = Math.max(0, (o.total || 0) - (o.paid || 0)), to = step ? rfNext(o) : '';
  EM.modal(`<h2>${step ? esc(to) : 'Record a payment'}</h2><p class="muted">${esc(o.ref)} · ${esc(clientName(o.client_id))}. Total ${inr0(o.total)}, received so far ${inr0(o.paid || 0)}, still due ${inr0(due)}.</p>
    <div class="fgrid" style="margin-top:12px"><div class="field"><label for="rfp-a">${to === 'Advance received' ? 'Advance received' : to === 'Balance received' ? 'Balance received' : 'Amount received'}${to === 'Balance received' && !due ? '' : ' *'}</label>${G.adorn({ type: 'money', key: 'pay' }, `<input class="input" type="number" min="0" step="0.01" id="rfp-a" value="${to === 'Advance received' ? '' : due || ''}">`)}</div>
      <div class="field"><label for="rfp-on">Received on</label><input class="input" type="date" id="rfp-on" value="${today()}"></div><div class="field span2"><label for="rfp-n">Note</label><input class="input" id="rfp-n" placeholder="e.g. 30% advance by UPI"></div></div>
    ${errBox('rfp-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="rf-pay-save" data-id="${o.id}" data-step="${step ? 1 : ''}">${step ? 'Record and move on' : 'Record payment'}</button><button class="btn" data-act="close-modal">Cancel</button></div>`); };
EM.ACTIONS['rf-next'] = el => {
  const o = OPSD().rorders.find(x => x.id === el.dataset.id), to = rfNext(o);
  if (['Advance received', 'Balance received'].includes(to) && D.access.prices && !(to === 'Balance received' && (o.paid || 0) >= (o.total || 0) - 0.5)) return rfPayModal(o, true);
  return opsAct(el, `orders/${o.id}/ful-next`, {}, `<b>${esc(o.ref)} moved to ${esc(to)}</b>`);
};
EM.ACTIONS['rf-pay'] = el => rfPayModal(OPSD().rorders.find(x => x.id === el.dataset.id), false);
EM.ACTIONS['rf-pay-save'] = async el => {
  const body = { amount: Number(qs('#rfp-a').value || 0), on: qs('#rfp-on').value, note: qs('#rfp-n').value };
  if (!el.dataset.step && !(body.amount > 0)) return showErr('rfp-err', 'Type the amount received.');
  await opsAct(el, `orders/${el.dataset.id}/${el.dataset.step ? 'ful-next' : 'pay'}`, body, body.amount ? `<b>${inr0(body.amount)} recorded</b>` : '<b>Moved on</b>', 'rfp-err');
};
EM.ACTIONS['rf-alloc'] = el => {
  const o = OPSD().rorders.find(x => x.id === el.dataset.id), WH = INVD().warehouses, mine = (l, w) => OPSD().allocations.filter(a => a.line_id === l.id && a.warehouse_id === w.id && !a.dispatched).reduce((a, x) => a + x.boxes, 0);
  if (!WH.length) return EM.modal('<h2>Block boxes</h2><p class="muted">There is no warehouse yet. Add one in Inventory, with its stock, then block the boxes here.</p><div class="row" style="margin-top:12px"><a class="btn primary" href="#/inventory">Inventory</a><button class="btn" data-act="close-modal">Close</button></div>');
  EM.modal(`<h2>Block boxes: ${esc(o.ref)}</h2><p class="muted small">For each design, how many boxes to hold from each warehouse. "Free" is what is there and not blocked for another sale.</p>
    <p class="small muted">Each design starts filled with its boxes on the sale (whole boxes for the sq ft and wastage), taken from the warehouses in turn up to what is free. Change any figure before saving.</p>
    <div class="stack" style="margin-top:12px">${rfLines(o).filter(l => l.boxes > 0).map(l => { const had = WH.some(w => mine(l, w)); let left = l.boxes;
      return `<fieldset class="fs" data-rf-line="${l.id}"><legend>${esc(prodName(l.product_id))} · ${num(l.boxes)} boxes · ${num(l.sqft || 0)} sq ft</legend><div class="fgrid">${WH.map(w => { const fr = Math.max(0, freeAt(l.product_id, w.id) + mine(l, w)), take = had ? mine(l, w) : Math.min(left, fr); if (!had) left -= take;
      return `<div class="field"><label for="rfa-${l.id}-${w.id}">${esc(w.name)} <span class="muted">(free ${fr})</span></label><input class="input" type="number" min="0" step="1" id="rfa-${l.id}-${w.id}" data-wh="${w.id}" value="${take || ''}"></div>`; }).join('')}</div></fieldset>`; }).join('')}</div>
    ${errBox('rfa-err')}<div class="row sticky-actions" style="margin-top:12px"><button class="btn primary" data-act="rf-alloc-save" data-id="${o.id}">Save</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['rf-alloc-save'] = el => {
  const allocs = [...document.querySelectorAll('fieldset[data-rf-line]')].flatMap(fs => [...fs.querySelectorAll('input[data-wh]')].map(i => ({ line_id: fs.dataset.rfLine, warehouse_id: i.dataset.wh, boxes: Number(i.value || 0) })));
  return opsAct(el, `orders/${el.dataset.id}/allocate`, { allocs }, '<b>Boxes blocked</b>', 'rfa-err');
};
const installedByTxt = x => { const e = x.extra || {}; return e.installed_by === 'dealer' ? `${INSTALLED_BY.dealer}${e.installer_dealer ? ': ' + ((DDIR().find(d => d.id === e.installer_dealer) || CL()[e.installer_dealer] || {}).name || 'a dealer outside your view') : ''}` : e.installed_by === 'contractor' ? INSTALLED_BY.contractor : 'Not chosen yet'; };

/* PI, invoices and payment proofs (13 Oct): EGO keeps making them in Tally and uploads the PDFs here.
   Accounts or Management add them; whoever sees the order sees them, here, on the sale and on the client's page. */
const orderFiles = o => { const may = (D.access.ful || []).includes('money');
  return `<section class="card stack-s" data-order-files><h3>PI, invoices and payment proofs</h3>${filesBox({ id: 'ord', order: o.id, client: o.client_id, types: ORDER_DOC_TYPES, tags: true, canAdd: may, title: 'Add PI, invoice or payment proof',
    note: 'Made in Tally: upload the PDF (or a photo of the cheque or transfer). Choose what it is; the number, date and amount are optional. Several files at once take the same details.',
    docs: D.documents.filter(d => d.order_id === o.id), emptyTitle: 'Nothing uploaded yet', emptyText: may ? 'Upload the PI when it is sent, the invoice when it is raised, and proof of each payment.' : 'Accounts or Management upload the PI, invoices and payment proofs here.' })}</section>`; };
/* who moves the next step (8 Oct, by department) */
const FUL_WHO = { stock: 'Dispatch, the Wholesale Head or Management', money: 'Accounts or Management', dispatch: 'Dispatch or Management' };
const nextFul = o => { const FS = OS_('fulfilment_stages'), i = FS.indexOf(o.ful_stage), s1 = FS[i + 1]; return s1 === FN('Waiting on production') && o.ful_stage !== FN('Stock check') ? FS[i + 2] : [FN('Stock check'), FN('Waiting on production')].includes(o.ful_stage) ? FN('Blocked') : s1; };
const fulMayMove = o => canFul(D.lists, D.access.ful, nextFul(o));
/* the red box at the stock check: blocked, and exactly what is missing, design by design */
function shortBox(o) {
  if (![FN('Stock check'), FN('Waiting on production')].includes(o.ful_stage)) return '';
  const S = shortLines(o.id), miss = S.filter(x => x.miss > 0), R = D.lists.rules, total = miss.reduce((a, x) => a + x.miss, 0);
  if (!miss.length) return o.ful_stage === FN('Waiting on production') ? `<section class="callout" data-short><b>Waiting on production.</b> Nothing else is missing: the sale moves to ${esc(FN('Blocked'))} by itself when the production order arrives and is allocated.</section>` : `<section class="callout ok" data-short><b>Everything is covered.</b> Move fulfilment on.</section>`;
  const free = l => INVD().warehouses.reduce((a, w) => a + Math.max(0, freeAt(l.product_id, w.id)), 0), code = l => { const p = INVD().products.find(x => x.id === l.product_id); return p && p.code ? ` <span class="muted">${esc(p.code)}</span>` : ''; };
  return `<section class="card stack-s short-box" data-short style="border-color:var(--bad, #c0392b)"><div class="row between"><h3 style="color:var(--bad, #c0392b)">Blocked: short of ${num(total)} box${total === 1 ? '' : 'es'}</h3>
      ${D.access.ful.includes('stock') ? `<button class="btn primary" data-act="prod-all" data-id="${o.id}">Place production order for everything missing</button>` : ''}</div>
    <p class="small">Why it cannot move on: these designs do not have enough free boxes in the warehouses. Block what is free, and put what is missing on a production order (at least ${num(R.moq_boxes)} boxes, rounded up to ${num(R.production_round_boxes)}; an open production order of the same design is joined instead).</p>
    ${table(['Design', 'Ordered', 'Free in the warehouses', 'Blocked', 'On production', 'Missing'], miss.map(x => [`<b>${esc(prodName(x.l.product_id))}</b>${code(x.l)}`, num(x.l.boxes), num(free(x.l)), num(x.got), x.wait ? num(x.wait) : '', `<span class="badge bad">${num(x.miss)}</span>`]))}</section>`;
}
/* the money: total, what came in, what is still due; payments one by one */
function payCard(o) {
  if (!D.access.prices) return '';
  const ex = o.extra || {}, pays = ex.payments || [], due = Math.max(0, (o.total || 0) - (o.paid || 0)), FS = OS_('fulfilment_stages');
  return `<section class="card stack-s" data-pay><div class="row between"><h3>Payment and invoice</h3>${(FS.indexOf(o.ful_stage) >= FS.indexOf(FN('PI sent')) || pays.length) && D.access.ful.includes('money') ? `<button class="btn sm" data-act="pay-add" data-id="${o.id}">+ Record a payment</button>` : ''}</div>
    <p class="small">${moneyLine(ex)} = <b>${inr0(o.total)}</b></p>
    ${kv([['Received', inr0(o.paid || 0)], ['Still due', due > 0 ? `<b>${inr0(due)}</b>` : '<span class="badge ok">Paid in full</span>'], ['Invoiced', o.invoiced_at ? whenTxt(o.invoiced_at) : NOTSET]])}
    ${pays.length ? table(['Received on', 'Amount', 'Note', 'By'], pays.map(p => [ds(p.on), inr0(p.amount), esc(p.note || ''), esc(staffName(p.by))])) : `<p class="small muted">No payment yet. At ${esc(FN('Payment received'))} the advance or the full payment is recorded.</p>`}</section>`;
}
EM.ACTIONS['ful-next'] = el => {
  const o = OPSD().orders.find(x => x.id === el.dataset.id), FS = OS_('fulfilment_stages'), i = FS.indexOf(o.ful_stage);
  /* the step into Payment received asks how much came in */
  if (FS[i + 1] === FN('Payment received') && D.access.prices) return payModal(o, true);
  return opsAct(el, `orders/${el.dataset.id}/ful-next`, {}, '<b>Fulfilment moved on</b>');
};
const payModal = (o, step) => { const due = Math.max(0, (o.total || 0) - (o.paid || 0));
  EM.modal(`<h2>${step ? esc(FN('Payment received')) : 'Record a payment'}</h2><p class="muted">${esc(o.ref)} · ${esc(clientName(o.client_id))}. Total ${inr0(o.total)}, received so far ${inr0(o.paid || 0)}, still due ${inr0(due)}.</p>
    <div class="fgrid" style="margin-top:12px"><div class="field"><label for="pay-a">Amount received (advance or full) *</label>${G.adorn({ type: 'money', key: 'pay' }, `<input class="input" type="number" min="0" step="0.01" id="pay-a" value="${due || ''}">`)}</div>
      <div class="field"><label for="pay-on">Received on</label><input class="input" type="date" id="pay-on" value="${today()}"></div><div class="field span2"><label for="pay-n">Note</label><input class="input" id="pay-n" placeholder="e.g. 50% advance by NEFT"></div></div>
    ${errBox('pay-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="pay-save" data-id="${o.id}" data-step="${step ? 1 : ''}">${step ? 'Record and move on' : 'Record payment'}</button><button class="btn" data-act="close-modal">Cancel</button></div>`); };
EM.ACTIONS['pay-add'] = el => payModal(OPSD().orders.find(x => x.id === el.dataset.id), false);
EM.ACTIONS['pay-save'] = async el => {
  const body = { amount: Number(qs('#pay-a').value || 0), on: qs('#pay-on').value, note: qs('#pay-n').value };
  if (!(body.amount > 0)) return showErr('pay-err', 'Type the amount received.');
  const r = await opsAct(el, `orders/${el.dataset.id}/${el.dataset.step ? 'ful-next' : 'pay'}`, body, `<b>${inr0(body.amount)} recorded</b>`, 'pay-err');
  if (r) EM.closeModal();
};
EM.ACTIONS['prod-all'] = el => {
  const o = OPSD().orders.find(x => x.id === el.dataset.id), miss = shortLines(o.id).filter(x => x.miss > 0), R = D.lists.rules, PS = OS_('production_stages'), recI = PS.indexOf(PNn('Received at warehouse'));
  const plan = miss.map(x => { const open = OPSD().production.find(p => p.product_id === x.l.product_id && PS.indexOf(p.stage) < recI);
    return [esc(prodName(x.l.product_id)), num(x.miss), open ? `Joins ${esc(open.ref)}` : `New order of ${num(Math.max(R.moq_boxes, Math.ceil(x.miss / R.production_round_boxes) * R.production_round_boxes))} boxes`]; });
  EM.modal(`<h2>Production for everything missing</h2><p class="muted">${esc(o.ref)}: ${num(miss.reduce((a, x) => a + x.miss, 0))} boxes across ${miss.length} design${miss.length === 1 ? '' : 's'}. The sale then waits on production and is blocked from what arrives.</p>
    ${table(['Design', 'Missing', 'Production order'], plan)}${errBox('pa-all-err')}
    <div class="row" style="margin-top:14px"><button class="btn primary" data-act="prod-all-go" data-id="${o.id}">Place production order</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['prod-all-go'] = async el => { const r = await opsAct(el, `orders/${el.dataset.id}/production`, { all: true }, '<b>Production order placed</b> for everything missing', 'pa-all-err'); if (r) EM.closeModal(); };
/* setting boxes aside: per line, per warehouse, never more than is free */
const freeAt = (pid, wid) => INVD().stock.filter(x => x.product_id === pid && x.warehouse_id === wid).reduce((a, x) => a + x.boxes, 0) - OPSD().allocations.filter(a => a.product_id === pid && a.warehouse_id === wid && !a.dispatched).reduce((a, x) => a + x.boxes, 0);
EM.ACTIONS['alloc-open'] = el => {
  const id = el.dataset.id, O = OPSD(), lines = O.lines.filter(l => l.order_id === id), WH = INVD().warehouses;
  const mine = (l, w) => O.allocations.filter(a => a.line_id === l.id && a.warehouse_id === w.id && !a.dispatched).reduce((a, x) => a + x.boxes, 0);
  EM.modal(`<h2>Block boxes</h2><p class="muted small">For each design, how many boxes to take from each warehouse. "Free" is what is there and not blocked for another order. Whatever cannot be covered can go to production.</p>
    <div class="stack" style="margin-top:12px">${lines.map(l => { const wait = O.waits.filter(w => w.line_id === l.id && !w.done).reduce((a, w) => a + w.boxes, 0);
      return `<fieldset class="fs" data-line="${l.id}" data-need="${l.boxes - wait}"><legend>${esc(prodName(l.product_id))} · ${l.boxes} boxes${wait ? ` (${wait} waiting on production)` : ''}</legend><div class="fgrid">${WH.map(w => `<div class="field"><label for="al-${l.id}-${w.id}">${esc(w.name)} <span class="muted">(free ${Math.max(0, freeAt(l.product_id, w.id) + mine(l, w))})</span></label><input class="input" type="number" min="0" step="1" id="al-${l.id}-${w.id}" data-wh="${w.id}" data-free="${Math.max(0, freeAt(l.product_id, w.id) + mine(l, w))}" value="${mine(l, w) || ''}"></div>`).join('')}</div>
        <div class="row"><span class="small" data-left>Still to cover: <b>${l.boxes - wait - O.allocations.filter(a => a.line_id === l.id && !a.dispatched).reduce((a, x) => a + x.boxes, 0)}</b></span><button class="btn sm" data-act="al-suggest" data-line="${l.id}">Suggest</button><button class="btn sm ghost" data-act="al-prod" data-order="${id}" data-line="${l.id}">Send the rest to production</button></div></fieldset>`; }).join('')}</div>
    ${errBox('al-err')}<div class="row sticky-actions" style="margin-top:12px"><button class="btn primary" data-act="al-save" data-id="${id}">Save</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
const leftOf = fs => Number(fs.dataset.need) - [...fs.querySelectorAll('input[data-wh]')].reduce((a, i) => a + Number(i.value || 0), 0);
const showLeft = fs => { const el = fs.querySelector('[data-left] b'), n = leftOf(fs); if (el) { el.textContent = n; el.parentElement.className = 'small ' + (n < 0 ? 'err' : ''); } };
document.addEventListener('input', e => { const fs = e.target.closest && e.target.closest('fieldset[data-line]'); if (fs) showLeft(fs); });
EM.ACTIONS['al-suggest'] = el => {   // fill from the warehouses with the most free boxes first
  const fs = el.closest('fieldset'), ins = [...fs.querySelectorAll('input[data-wh]')].sort((a, b) => b.dataset.free - a.dataset.free);
  let need = Number(fs.dataset.need);
  for (const i of ins) { const n = Math.min(need, Number(i.dataset.free)); i.value = n || ''; need -= n; }
  showLeft(fs);
};
EM.ACTIONS['al-save'] = el => {
  const allocs = [...document.querySelectorAll('fieldset[data-line]')].flatMap(fs => [...fs.querySelectorAll('input[data-wh]')].map(i => ({ line_id: fs.dataset.line, warehouse_id: i.dataset.wh, boxes: Number(i.value || 0) })));
  return opsAct(el, `orders/${el.dataset.id}/allocate`, { allocs }, '<b>Boxes blocked</b>', 'al-err');
};
EM.ACTIONS['al-prod'] = async el => {
  const allocs = [...el.closest('fieldset').querySelectorAll('input[data-wh]')].map(i => ({ line_id: el.dataset.line, warehouse_id: i.dataset.wh, boxes: Number(i.value || 0) }));
  try { await API('POST', `/api/ops/orders/${el.dataset.order}/allocate`, { allocs }); } catch (x) { return showErr('al-err', x.message); }
  return opsAct(el, `orders/${el.dataset.order}/production`, { line_id: el.dataset.line }, '<b>The rest went to production</b>', 'al-err');
};

/* production orders */
EM.VIEWS.po = id => {
  const p = OPSD().production.find(x => x.id === id);
  if (!p) return `<div class="stack"><h1>Production order not found</h1><a class="btn" href="#/orders/production">Production</a></div>`;
  const PS = OS_('production_stages'), nextS = PS[PS.indexOf(p.stage) + 1], waits = OPSD().waits.filter(w => w.po_id === id), forSales = waits.reduce((a, w) => a + w.boxes, 0);
  return `<div class="stack">${crumbs(['Orders', '#/orders'], ['Production', '#/orders/production'], [p.ref])}
    <div class="row between"><div class="stack-s"><h1>${esc(p.ref)}</h1><p class="muted">${esc(prodName(p.product_id))} · ${num(p.boxes)} boxes${p.factory ? ' · ' + esc(p.factory) : ''}${p.eta ? ' · expected ' + ds(p.eta) : ''}${p.container ? ' · container ' + esc(p.container) : ''}</p></div>
      ${nextS && canStockUI() ? `<button class="btn primary" data-act="po-next" data-id="${id}" data-to="${esc(nextS)}">Move to ${esc(nextS)}</button>` : ''}</div>
    <section class="card stack-s">${stageChips(PS, p.stage)}</section>
    <section class="card stack-s"><h3>The sales this production order serves</h3>
      <p class="small">${num(p.boxes)} boxes ordered from production · ${num(forSales)} for the sales below · ${num(Math.max(0, p.boxes - forSales))} spare, which go into stock when received.</p>
      ${waits.length ? table(['Fulfilment', 'Opportunity', 'Dealer', 'Boxes for it', 'Status'], waits.map(w => { const o = OPSD().orders.find(x => x.id === w.order_id) || {}; return { href: '#/order/' + w.order_id, cells: [`<b>${esc(o.ref || '')}</b>`, esc((oppOf(o) || { title: '' }).title), esc(clientName(o.client_id)), num(w.boxes), w.done ? '<span class="badge ok">Arrived, blocked</span>' : '<span class="badge warn">Waiting</span>'] }; })) : '<p class="small muted">No sale is waiting for it; everything it brings goes into stock.</p>'}</section>
    <section class="stack-s"><h3>History</h3><div id="log-p"><p class="muted">Loading…</p></div></section></div>`;
};
EM.VIEWS.po.tab = 'orders';
EM.VIEWS.po.title = id => (OPSD().production.find(x => x.id === id) || { ref: 'Production order' }).ref;
EM.VIEWS.po.after = id => showLog('production', id, '#log-p');
EM.ACTIONS['po-next'] = el => {
  const id = el.dataset.id, to = el.dataset.to, p = OPSD().production.find(x => x.id === id);
  if (to === PNn('Received at warehouse') || to === 'Shipped') return EM.modal(`<h2>${esc(to)}</h2><div class="fgrid" style="margin-top:12px">
      ${to === PNn('Received at warehouse') ? `<div class="field"><label for="po-wh">Arrived at</label><select class="input" id="po-wh">${INVD().warehouses.map(w => `<option value="${w.id}">${esc(w.name)}</option>`).join('')}</select></div><div class="field"><label for="po-rec">Boxes received</label><input class="input" id="po-rec" type="number" min="0" step="1" value="${p.boxes}"></div>` : ''}
      <div class="field"><label for="po-ct">Container number</label><input class="input" id="po-ct" value="${esc(p.container || '')}"></div></div>${errBox('po-err')}
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="po-next-go" data-id="${id}">Save</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
  return opsAct(el, `production/${id}/next`, {}, `<b>${esc(to)}</b>`);
};
EM.ACTIONS['po-next-go'] = el => opsAct(el, `production/${el.dataset.id}/next`, { warehouse_id: (qs('#po-wh') || {}).value, received: qs('#po-rec') ? Number(qs('#po-rec').value) : undefined, container: (qs('#po-ct') || {}).value }, '<b>Production order moved on</b>', 'po-err');
EM.ACTIONS['po-add'] = () => {
  const I = INVD();
  EM.modal(`<h2>Place a production order</h2><div class="fgrid" style="margin-top:12px">
    <div class="field span2"><label for="pa-p">Design</label><select class="input" id="pa-p">${I.products.map(p => `<option value="${p.id}">${esc(prodName(p.id))}</option>`).join('')}</select></div>
    <div class="field"><label for="pa-b">Boxes</label><input class="input" id="pa-b" type="number" min="1" step="1" value="${D.lists.rules.moq_boxes}"></div>
    <div class="field"><label for="pa-f">Factory</label><input class="input" id="pa-f"></div><div class="field"><label for="pa-e">Expected</label><input class="input" id="pa-e" type="date"></div></div>${errBox('pa-err')}
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="po-save">Place it</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['po-save'] = async el => { const r = await opsAct(el, 'production', { product_id: qs('#pa-p').value, boxes: Number(qs('#pa-b').value), factory: qs('#pa-f').value, eta: qs('#pa-e').value }, null, 'pa-err'); if (r) location.hash = '#/po/' + r.id; };

/* ---- installation sites, both companies (R3b: EGO Premium too). A site links to a project or an order of its company;
   who installs it (our contractor, or the partner dealer's team) is picked per site (Q9); a later planned start needs a delay reason. */
EM.inF = { period: 'all', from: '', to: '', step: '', by: '', project: '', field: '', fq: '' };
const SITE_FIELDS = [['ref', 'Site number'], ['name', 'Site'], ['client', 'Client'], ['project', 'Project'], ['step', 'Step'], ['crew', 'Installer or crew'], ['by', 'Installed by'], ['address', 'Address']];
const siteProject = x => x.project_id ? PJS().find(p => p.id === x.project_id) : null;
const siteVal = (x, k) => k === 'client' ? clientName(x.client_id) : k === 'project' ? (siteProject(x) || {}).name || '' : k === 'by' ? installedByTxt(x) : String(x[k] || '');
const siteCo = () => EM.div === 'both' ? '' : EM.div;
EM.VIEWS.installation = () => {
  const f = EM.inF, fq = f.fq.trim().toLowerCase(), all = OPSD().sites.filter(inDiv), SS = OS_('site_steps'), co = siteCo();
  const S = all.filter(x => (!f.step || x.step === f.step) && (!f.by || ((x.extra || {}).installed_by || 'none') === f.by) && (!f.project || x.project_id === f.project) && inPeriod(x.created_at, f.period, f.from, f.to)
    && (!fq || (f.field ? [siteVal(x, f.field)] : SITE_FIELDS.map(([k]) => siteVal(x, k))).some(v => v.toLowerCase().includes(fq))) && matches(`${x.ref} ${x.name} ${clientName(x.client_id)} ${siteVal(x, 'project')} ${x.address || ''}`, [(CL()[x.client_id] || {}).mobile]));
  const sel = (k, label, opts) => `<label class="field" style="min-width:150px"><span class="small muted">${label}</span><select class="input" data-inf="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  return `<div class="stack"><div class="row between"><div class="stack-s"><div class="kicker">${co ? esc(DIVS[co].co) : 'EGO Premium and Big E'} · from survey to handover</div><h1>Installation</h1><p class="muted">${S.length} of ${all.length}. Each site moves through the installation steps. Some steps check before they let you on: a crew, the readiness checklist, no open snag, the client's sign-off.</p></div><button class="btn primary" data-act="site-add">+ Site</button></div>
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-inst-filters>${dateFilter(f, 'inst', 'When it was added')}${sel('step', 'Step', [['', 'Every step'], ...SS.map(x => [x, x])])}
      ${sel('by', 'Installed by', [['', 'Anyone'], ...Object.entries(INSTALLED_BY), ['none', 'Not chosen yet']])}${sel('project', 'Project', [['', 'Every project'], ...[...new Set(all.map(x => x.project_id).filter(Boolean))].map(id => [id, (PJS().find(p => p.id === id) || { name: id }).name])])}
      ${sel('field', 'Any field', [['', 'Any field'], ...SITE_FIELDS])}<label class="field" style="min-width:150px"><span class="small muted">contains</span><input class="input" id="inst-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
    ${searchBox('Installation sites: site, number, client, project or address')}
    ${stageBoard(SS, S, x => x.step, x => `<a class="mini" style="display:block;text-decoration:none;color:inherit" href="#/site/${x.id}"><b>${esc(x.ref)}</b><div class="small">${esc(x.name)}</div><div class="small muted">${esc(clientName(x.client_id))}</div>${siteProject(x) ? `<div class="small">Project: ${esc(siteProject(x).name)}</div>` : ''}</a>`)}
    ${S.length ? table(['Site', 'Client', 'Project', 'Area', 'Step', 'Installed by', 'Open snags', 'Planned start'], S.map(x => ({ href: '#/site/' + x.id, cells: [`<b>${esc(x.ref)}</b> ${esc(x.name)}${EM.div === 'both' ? segBadge(x.division) : ''}`, esc(clientName(x.client_id)), esc(siteVal(x, 'project')), x.sqft ? num(x.sqft) + ' sq ft' : '', `<span class="badge info">${esc(x.step)}</span> <span class="small muted">${SS.indexOf(x.step) + 1}/${SS.length}</span>`, esc(installedByTxt(x)), OPSD().snags.filter(n => n.site_id === x.id && n.status === 'Open').length || '', x.planned_start ? ds(x.planned_start) : ''] })))
      : empty(all.length ? 'Nothing for this filter' : 'No installation sites yet', all.length ? 'Change or clear the filters above.' : 'Add a site for a client: a flat, a floor, a project. A site can sit under a project or an order of this company.', all.length ? '' : '<button class="btn primary" data-act="site-add">+ Site</button>')}</div>`;
};
EM.VIEWS.installation.title = () => 'Installation';
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.inf; if (k) { EM.inF[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'inst-fq') { EM.inF.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#inst-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
const installerFields = (div, by, dealer) => `<div class="field"><label for="sa-by">Installed by</label><select class="input" id="sa-by" data-keep-order><option value="">Not chosen yet</option>${Object.entries(INSTALLED_BY).map(([k, l]) => `<option value="${k}" ${by === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
  <div class="field" data-sa-dealer ${by === 'dealer' ? '' : 'hidden'}><label for="sa-dealer">Partner dealer</label><select class="input" id="sa-dealer"><option value="">Choose</option>${DDIR().filter(d => d.division === div).map(d => `<option value="${d.id}" ${dealer === d.id ? 'selected' : ''}>${esc(d.name)} · ${esc(d.city || '')}</option>`).join('')}</select></div>`;
document.addEventListener('change', e => { if (e.target.id === 'sa-by') { const d = qs('[data-sa-dealer]'); if (d) d.hidden = e.target.value !== 'dealer'; } });
EM.ACTIONS['site-add'] = el => {
  const pj = el.dataset.project ? PJS().find(p => p.id === el.dataset.project) : null, ord = el.dataset.order ? allOrders().find(o => o.id === el.dataset.order) : null;
  const div = pj ? pj.division : ord ? ord.division : siteCo() || (D.user.division === 'retail' ? 'retail' : 'wholesale');
  const cs = D.clients.filter(c => c.division === div || c.division === 'both').sort((a, b) => a.name.localeCompare(b.name));
  const pre = el.dataset.client || (ord ? ord.client_id : pj ? (D.opportunities.find(o => o.project_id === pj.id) || {}).client_id || '' : '');
  EM.modal(`<h2>Add an installation site</h2><p class="muted small">${esc(DIVS[div].co)}. One flat, floor or part of a project.</p><div class="fgrid" style="margin-top:12px">
    ${G.select({ key: 'client', label: 'Client', req: true }, pre, 'sa', cs.map(c => [c.id, `${c.name} · ${kindLabel(c.kind)}`]))}
    <div class="field"><label for="sa-name">Site name *</label><input class="input" id="sa-name" placeholder="e.g. Tower B, floors 3 to 7" value="${esc(pj && !ord ? pj.name : '')}"></div>
    ${G.select({ key: 'project', label: 'Project' }, pj ? pj.id : '', 'sa', PJS().filter(p => p.division === div).map(p => [p.id, `${p.name} · ${p.city}`]), true)}
    ${G.select({ key: 'order', label: 'Order (fulfilment)' }, ord ? ord.id : '', 'sa', allOrders().filter(o => o.division === div || (div === 'wholesale' && !o.division)).map(o => [o.id, `${o.ref} · ${clientName(o.client_id)}`]), true)}
    ${installerFields(div, '', '')}
    <div class="field"><label for="sa-sqft">Area</label>${G.adorn({ key: 'area_sqft' }, '<input class="input" id="sa-sqft" type="number" min="0" step="1">')}</div>
    <div class="field"><label for="sa-ps">Planned start</label><input class="input" id="sa-ps" type="date"></div>
    <div class="field span2"><label for="sa-ad">Address</label><input class="input" id="sa-ad" value="${esc(pj ? pj.address || '' : '')}"></div></div>${errBox('sa-err')}
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="site-save" data-opp="${esc(el.dataset.opp || '')}" data-div="${div}">Add site</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['site-save'] = async el => { const r = await opsAct(el, 'sites', { client_id: qs('#sa-client').value, name: qs('#sa-name').value, sqft: qs('#sa-sqft').value, planned_start: qs('#sa-ps').value, address: qs('#sa-ad').value, opp_id: el.dataset.opp, division: el.dataset.div, project_id: qs('#sa-project').value, order_id: qs('#sa-order').value, installed_by: qs('#sa-by').value, installer_dealer: qs('#sa-dealer').value }, null, 'sa-err'); if (r) location.hash = '#/site/' + r.id; };
EM.VIEWS.site = id => {
  const x = OPSD().sites.find(s => s.id === id);
  if (!x) return `<div class="stack"><h1>Site not found</h1><a class="btn" href="#/installation">Installation</a></div>`;
  const SS = OS_('site_steps'), nextS = SS[SS.indexOf(x.step) + 1], snags = OPSD().snags.filter(n => n.site_id === id), ready = x.extra.ready || {};
  return `<div class="stack">${crumbs(['Installation', '#/installation'], [x.ref])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(x.ref)} · ${esc(x.name)}</h1><p class="muted"><a href="#/client/${x.client_id}">${esc(clientName(x.client_id))}</a>${x.sqft ? ' · ' + num(x.sqft) + ' sq ft' : ''}${x.address ? ' · ' + esc(x.address) : ''}${x.actual_start ? ' · started ' + ds(x.actual_start) : ''}${x.actual_end ? ' · completed ' + ds(x.actual_end) : ''}</p></div>
      ${nextS ? `<button class="btn primary" data-act="site-next" data-id="${id}">Move to ${esc(nextS)}</button>` : ''}</div>
    <section class="card stack-s">${stageChips(SS, x.step)}</section>
    <section class="card stack-s" data-site-links><h3>Where it belongs</h3>${kv([['Company', esc(DIVS[x.division] ? DIVS[x.division].co : x.division)], ['Project', siteProject(x) ? `<a href="#/project/${x.project_id}">${esc(siteProject(x).name)}</a>` : NOTSET],
      ['Order', (() => { const o = allOrders().find(k => k.id === (x.extra || {}).order_id) || allOrders().find(k => x.opp_id && k.opp_id === x.opp_id); return o ? `<a href="#/order/${o.id}">${esc(o.ref)} · ${esc(o.ful_stage)}</a>` : NOTSET; })()], ['Installed by', esc(installedByTxt(x))]])}</section>
    <div class="grid g2"><section class="card stack-s"><h3>Crew and dates</h3><div class="fgrid">
        ${installerFields(x.division, (x.extra || {}).installed_by || '', (x.extra || {}).installer_dealer || '')}
        <div class="field"><label for="se-crew">Installer or crew</label><input class="input" id="se-crew" value="${esc(x.crew || '')}"></div>
        <div class="field"><label for="se-ps">Planned start</label><input class="input" id="se-ps" type="date" value="${esc(x.planned_start || '')}" data-was="${esc(x.planned_start || '')}"></div>
        <div class="field" data-delay ${x.planned_start ? '' : 'hidden'}><label for="se-dr">Delay reason (when the start moves later)</label><select class="input" id="se-dr" data-keep-order><option value="">Choose</option>${(D.lists.delay_reasons || []).map(r => `<option>${esc(r)}</option>`).join('')}</select></div>
        <div class="field" data-delay ${x.planned_start ? '' : 'hidden'}><label for="se-dn">Delay note</label><input class="input" id="se-dn"></div>
        <label class="row" style="gap:8px;align-items:center"><input type="checkbox" id="se-so" ${x.signed_off ? 'checked' : ''}> The client has signed off</label></div>
        <div class="row"><button class="btn sm" data-act="site-upd" data-id="${id}">Save</button></div>
        ${(x.extra.delays || []).length ? `<div data-delays>${table(['Delayed', 'From', 'To', 'Reason', 'By'], x.extra.delays.map(d => [ds(dayIST(d.at)), ds(d.from), ds(d.to), `<b>${esc(d.reason)}</b>${d.note ? `<div class="small muted">${esc(d.note)}</div>` : ''}`, esc(staffName(d.by))]))}</div>` : ''}</section>
      <section class="card stack-s"><h3>Site readiness</h3>${D.lists.readiness_items.map((k, i) => `<div class="row between"><span class="small">${esc(k)}</span><select class="input" style="width:140px" data-ready="${esc(k)}">${['', 'Ready', 'Not ready'].map(v => `<option value="${v}" ${(ready[k] || '') === v ? 'selected' : ''}>${v || 'Not checked'}</option>`).join('')}</select></div>`).join('')}
        <div class="row"><button class="btn sm" data-act="site-upd" data-id="${id}">Save the checklist</button></div></section></div>
    <section class="card stack-s"><div class="row between"><h3>Snags</h3><button class="btn sm" data-act="snag-add" data-id="${id}">+ Snag</button></div>
      ${snags.length ? table(['Snag', 'Severity', 'Note', 'Due', 'Status', ''], snags.map(n => [esc(n.category), esc(n.severity), esc(n.note || ''), n.due ? ds(n.due) : '', n.status === 'Open' ? '<span class="badge warn">Open</span>' : `<span class="badge ok">Closed</span> <span class="small muted">${esc(n.closed_note || '')}</span>`, n.status === 'Open' ? `<button class="btn sm ghost" data-act="snag-close" data-id="${n.id}">Close</button>` : ''])) : '<p class="small muted">No snags.</p>'}</section>
    <section class="stack-s"><h3>History</h3><div id="log-s"><p class="muted">Loading…</p></div></section></div>`;
};
EM.VIEWS.site.tab = 'installation';
EM.VIEWS.site.title = id => (OPSD().sites.find(x => x.id === id) || { name: 'Site' }).name;
EM.VIEWS.site.after = id => showLog('site', id, '#log-s');
EM.ACTIONS['site-next'] = el => opsAct(el, `sites/${el.dataset.id}/next`, {}, '<b>Site moved on</b>');
EM.ACTIONS['site-upd'] = el => {
  const was = qs('#se-ps').dataset.was, ps = qs('#se-ps').value;
  if (was && ps > was && !qs('#se-dr').value) return bubbleNear(el, `The planned start moves later (${was} to ${ps}): choose the delay reason.`);
  return opsAct(el, `sites/${el.dataset.id}/update`, { crew: qs('#se-crew').value, planned_start: ps, signed_off: qs('#se-so').checked, installed_by: qs('#sa-by').value, installer_dealer: qs('#sa-dealer').value, delay_reason: qs('#se-dr').value, delay_note: qs('#se-dn').value, ready: Object.fromEntries([...document.querySelectorAll('[data-ready]')].map(s => [s.dataset.ready, s.value])) }, '<b>Site saved</b>');
};
EM.ACTIONS['snag-add'] = el => EM.modal(`<h2>Add a snag</h2><div class="fgrid" style="margin-top:12px">
  ${G.select({ key: 'cat', label: 'Kind of snag', req: true }, '', 'sn', D.lists.snag_types.map(v => [v, v]))}${G.select({ key: 'sev', label: 'Severity', req: true }, 'Medium', 'sn', D.lists.severities.map(v => [v, v]))}
  <div class="field span2"><label for="sn-note">Where and what</label><input class="input" id="sn-note"></div><div class="field"><label for="sn-due">Put right by</label><input class="input" id="sn-due" type="date"></div></div>${errBox('sn-err')}
  <div class="row" style="margin-top:12px"><button class="btn primary" data-act="snag-save" data-id="${el.dataset.id}">Add snag</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
EM.ACTIONS['snag-save'] = el => opsAct(el, 'snags', { site_id: el.dataset.id, category: qs('#sn-cat').value, severity: qs('#sn-sev').value, note: qs('#sn-note').value, due: qs('#sn-due').value }, '<b>Snag added</b>', 'sn-err');
EM.ACTIONS['snag-close'] = el => EM.modal(`<h2>Close the snag</h2><div class="field" style="margin-top:12px"><label for="sc-note">How it was put right *</label><input class="input" id="sc-note"></div>${errBox('sc-err')}<div class="row" style="margin-top:12px"><button class="btn primary" data-act="snag-close-go" data-id="${el.dataset.id}">Close it</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
EM.ACTIONS['snag-close-go'] = el => opsAct(el, `snags/${el.dataset.id}/close`, { note: qs('#sc-note').value }, '<b>Snag closed</b>', 'sc-err');

/* ---- complaints */
EM.VIEWS.complaints = arg => {
  const CS = OS_('complaint_statuses'), all = OPSD().complaints.filter(inDiv).filter(c => (!EM.cseg || c.division === EM.cseg) && matches(`${c.ref} ${clientName(c.client_id)} ${c.type} ${c.description || ''}`, [])), tab = CS.includes(arg) ? arg : 'all', rows = all.filter(c => tab === 'all' || c.status === tab);
  return `<div class="stack"><div class="row between"><div class="stack-s"><div class="kicker">${EM.div === 'both' ? 'EGO Premium and Big E' : DIVS[EM.div].co}</div><h1>Complaints</h1><p class="muted">Logged, handled and resolved with what was done. A settlement of <span data-rule>${inr0(D.lists.rules.complaint_settle_from)}</span> or more needs approval.</p></div><button class="btn primary" data-act="cmp-add">+ Complaint</button></div>
    ${searchBox('Complaint number, company, kind or what happened')}
    ${stageBoard(CS, all, c => c.status, c => `<a class="card stack-s" style="text-decoration:none" href="#/complaint/${c.id}"><b>${esc(c.ref)}</b><span class="small">${esc(c.type)}</span><span class="small muted">${esc(clientName(c.client_id))}</span></a>`)}
    ${subtabs('#/complaints', tab, [['all', `All <span class="muted">${all.length}</span>`], ...CS.map(s => [s, `${esc(s)} <span class="muted">${all.filter(c => c.status === s).length}</span>`])])}
    ${EM.div === 'both' ? `<label class="field" style="max-width:260px"><span class="small muted">Company</span><select class="input" id="cseg"><option value="">EGO Premium and Big E</option><option value="wholesale" ${EM.cseg === 'wholesale' ? 'selected' : ''}>EGO Premium (wholesale)</option><option value="retail" ${EM.cseg === 'retail' ? 'selected' : ''}>Big E (retail)</option></select></label>` : ''}
    ${rows.length ? table(['Complaint', 'Company', 'From', 'Kind', 'Severity', 'Status', 'Handled by', 'Logged'], rows.map(c => ({ href: '#/complaint/' + c.id, cells: [`<b>${esc(c.ref)}</b>`, segBadge(c.division), esc(clientName(c.client_id)), esc(c.type), esc(c.severity), `<span class="badge ${c.status === lastOf(CS) ? 'ok' : 'warn'}">${esc(c.status)}</span>`, esc(staffName(c.owner_id)), ds(c.created_at.slice(0, 10))] })))
      : '<p class="small muted">No complaints here.</p>'}</div>`;
};
EM.VIEWS.complaints.title = () => 'Complaints';
EM.cseg = '';
document.addEventListener('change', e => { if (e.target.id === 'cseg') { EM.cseg = e.target.value; EM.rerender(); } });
EM.ACTIONS['cmp-add'] = el => {
  const cs = D.clients.filter(inDiv).sort((a, b) => a.name.localeCompare(b.name));
  EM.modal(`<h2>Log a complaint</h2><div class="fgrid" style="margin-top:12px">
    ${G.select({ key: 'client', label: 'From', req: true }, el.dataset.client || '', 'cp', cs.map(c => [c.id, `${c.name} · ${kindLabel(c.kind)}`]))}
    ${G.select({ key: 'type', label: 'Kind', req: true }, '', 'cp', D.lists.complaint_types.map(v => [v, v]))}${G.select({ key: 'sev', label: 'Severity', req: true }, 'Medium', 'cp', D.lists.severities.map(v => [v, v]))}
    ${G.select({ key: 'ch', label: 'Came in by' }, '', 'cp', D.lists.complaint_channels.map(v => [v, v]))}${G.select({ key: 'own', label: 'Handled by' }, me().id, 'cp', D.staff.filter(x => x.active).map(x => [x.id, x.name]), false)}
    <div class="field span2"><label for="cp-desc">What happened</label><textarea class="input" id="cp-desc" rows="3"></textarea></div></div>${errBox('cp-err')}
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="cmp-save">Log it</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['cmp-save'] = async el => { const r = await opsAct(el, 'complaints', { client_id: qs('#cp-client').value, type: qs('#cp-type').value, severity: qs('#cp-sev').value, channel: qs('#cp-ch').value, owner_id: qs('#cp-own').value, description: qs('#cp-desc').value }, null, 'cp-err'); if (r) location.hash = '#/complaint/' + r.id; };
EM.VIEWS.complaint = id => {
  const c = OPSD().complaints.find(x => x.id === id);
  if (!c) return `<div class="stack"><h1>Complaint not found</h1><a class="btn" href="#/complaints">Complaints</a></div>`;
  const CS = OS_('complaint_statuses'), pend = pendingFor('complaint', id);
  return `<div class="stack">${crumbs(['Complaints', '#/complaints'], [c.ref])}
    <div class="stack-s"><h1>${esc(c.ref)} · ${esc(c.type)}</h1><p class="muted"><a href="#/client/${c.client_id}">${esc(clientName(c.client_id))}</a> · ${esc(c.severity)}${c.channel ? ' · by ' + esc(c.channel) : ''} · ${esc(staffName(c.owner_id))} · ${ds(c.created_at.slice(0, 10))}</p></div>
    ${pend.length ? `<div class="callout warn"><b>Waiting for approval.</b> ${pend.map(a => esc(a.reason)).join(' · ')}</div>` : ''}
    <section class="card stack-s">${stageChips(CS, c.status)}<p>${esc(c.description || '')}</p>${c.resolution ? `<p><b>Resolution:</b> ${esc(c.resolution)}${c.cost != null && D.access.prices ? ` · cost ${inr0(c.cost)}` : ''}</p>` : ''}</section>
    ${c.status !== lastOf(CS) ? `<section class="card stack-s"><h3>Update</h3><div class="fgrid">${G.select({ key: 'st', label: 'Status' }, c.status, 'cu', CS.map(v => [v, v]), false)}
      <div class="field span2"><label for="cu-res">Resolution (compulsory to resolve)</label><input class="input" id="cu-res" value="${esc(c.resolution || '')}"></div>
      <div class="field"><label for="cu-cost">Settlement cost</label>${G.adorn({ type: 'money', key: 'cost' }, `<input class="input" id="cu-cost" type="number" min="0" step="1" value="${c.cost ?? ''}">`)}</div></div>${errBox('cu-err')}
      <div class="row"><button class="btn primary" data-act="cmp-upd" data-id="${id}">Save</button></div></section>` : ''}
    <section class="stack-s"><h3>History</h3><div id="log-c"><p class="muted">Loading…</p></div></section></div>`;
};
EM.VIEWS.complaint.tab = 'complaints';
EM.VIEWS.complaint.title = id => (OPSD().complaints.find(x => x.id === id) || { ref: 'Complaint' }).ref;
EM.VIEWS.complaint.after = id => showLog('complaint', id, '#log-c');
EM.ACTIONS['cmp-upd'] = el => opsAct(el, `complaints/${el.dataset.id}/status`, { status: qs('#cu-st').value, resolution: qs('#cu-res').value, cost: qs('#cu-cost').value }, '<b>Complaint saved</b>', 'cu-err');

/* ---- approvals */
const myLimit = kind => levelLimit(D.lists.rules, kind, D.access.level);
const apAmt = a => (D.lists.rules.approvals[a.kind] || {}).unit === '%' ? a.amount + '%' : inr0(a.amount);
/* everything waiting for a yes in one place (11 Oct): credit, discounts, complaint settlements, and dealer schemes drawn up */
const schAsks = () => SCH().list.map(sc => ({ id: sc.id, scheme: sc, kind: 'scheme', status: sc.status === 'Draft' ? 'Pending' : sc.status === 'Rejected' ? 'Rejected' : 'Approved', division: sc.division || 'wholesale', amount: sc.target,
  reason: `${sc.name}${sc.reward ? ' · reward: ' + sc.reward : ''} · ${ds(sc.start_on)} to ${ds(sc.end_on)}`, requested_by: sc.created_by, created_at: sc.created_at || sc.updated_at || '',
  decided_by: sc.status === 'Rejected' ? sc.rejected_by : sc.approved_by, decision_note: sc.status === 'Rejected' ? sc.reject_reason : '' }));
EM.VIEWS.approvals = arg => {
  const label = a => a.kind === 'scheme' ? 'Dealer scheme' : (D.lists.rules.approvals[a.kind] || { label: a.kind }).label;
  const all = [...OPSD().approvals, ...schAsks()].filter(a => matches(`${a.scheme ? a.scheme.name : clientName(a.client_id)} ${label(a)} ${a.reason || ''} ${staffName(a.requested_by)}`, [])), tab = ['Pending', 'Approved', 'Rejected'].includes(arg) ? arg : 'Pending', rows = all.filter(a => a.status === tab).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const href = a => a.kind === 'scheme' ? '#/scheme/' + a.id : a.entity === 'opp' ? '#/opp/' + a.record_id : a.entity === 'order' ? '#/order/' + a.record_id : a.entity === 'complaint' ? '#/complaint/' + a.record_id : '#/approvals';
  const act = a => a.kind === 'scheme' ? (canSch('approve') ? `<button class="btn sm primary" data-act="sch-approve" data-id="${a.id}">Approve</button><button class="btn sm ghost" data-act="sch-reject" data-id="${a.id}">Reject</button>` : '<span class="small muted">The Owner or a Director approves</span>')
    : myLimit(a.kind) >= a.amount ? `<button class="btn sm primary" data-act="ap-yes" data-id="${a.id}">Approve</button><button class="btn sm ghost" data-act="ap-no" data-id="${a.id}">Reject</button>` : '<span class="small muted">Above your limit</span>';
  return `<div class="stack"><div class="stack-s"><div class="kicker">Credit, discounts, complaint settlements, dealer schemes</div><h1>Approvals</h1><p class="muted">Everything waiting for a yes. A request goes to whoever's limit covers it (limits in Lists & stages › Rules and numbers); a dealer scheme goes to the Owner or a Director. The Owner has no limit.</p></div>
    ${searchBox('Company, scheme, kind, reason or who asked')}
    ${subtabs('#/approvals', tab, ['Pending', 'Approved', 'Rejected'].map(s => [s, `${s} <span class="muted">${all.filter(a => a.status === s).length}</span>`]))}
    ${rows.length ? table(['What', 'Company', 'Amount', 'Asked by', 'When', ''], rows.map(a => [`<a href="${href(a)}"><b>${esc(label(a))}</b></a><div class="small muted">${esc(a.reason)}</div>`, segBadge(a.division), a.kind === 'scheme' ? (D.access.prices ? `${inr0(a.amount)} target per dealer` : '') : apAmt(a), esc(staffName(a.requested_by)), a.created_at ? ds(String(a.created_at).slice(0, 10)) : '',
      a.status === 'Pending' ? act(a) : `${esc(staffName(a.decided_by))}${a.decision_note ? ' · ' + esc(a.decision_note) : ''}`]))
      : empty(`Nothing ${tab.toLowerCase()}`, 'Requests appear here when an order goes over a credit limit, a discount is above someone\'s limit, a complaint settlement is large, or a dealer scheme is drawn up.')}</div>`;
};
EM.VIEWS.approvals.title = () => 'Approvals';
EM.navBadge = Object.assign(EM.navBadge || {}, { approvals: () => OPSD().approvals.filter(a => a.status === 'Pending' && myLimit(a.kind) >= a.amount).length + (canSch('approve') ? SCH().list.filter(sc => sc.status === 'Draft').length : 0) });
EM.ACTIONS['ap-yes'] = el => opsAct(el, `approvals/${el.dataset.id}/decide`, { decision: 'Approved' }, '<b>Approved</b>');
EM.ACTIONS['ap-no'] = el => { const note = prompt('Why is it rejected?') || ''; return opsAct(el, `approvals/${el.dataset.id}/decide`, { decision: 'Rejected', note }, '<b>Rejected</b>'); };

/* ---- Priority 200: the dealers EGO develops first, scored from what is saved here */
function p200Score(c) {
  const R = D.lists.rules, W = R.p200.weights, O = OPSD(), ex = c.extra || {};
  const fy0 = (() => { const d = new Date(Date.now() + 5.5 * 36e5), y = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; return `${y}-04-01`; })();
  const orders = O.orders.filter(o => o.client_id === c.id), fyOrders = orders.filter(o => o.created_at.slice(0, 10) >= fy0);
  const months = Math.max(1, (Date.now() - Date.parse(fy0)) / (30.44 * 864e5)), ytdTarget = ex.target_12m ? ex.target_12m * Math.min(12, months) / 12 : 0;
  const actual = fyOrders.reduce((a, o) => a + (o.subtotal || 0), 0);
  const cats = new Set(fyOrders.flatMap(o => O.lines.filter(l => l.order_id === o.id).map(l => colOf(INVD().products.find(p => p.id === l.product_id) || {}).category)).filter(Boolean));
  /* an invoice still not fully paid after the payment days (invoices are raised in fulfilment since 6 Oct) */
  const unpaidOld = orders.some(o => o.invoiced_at && (o.total || 0) - (o.paid || 0) > 0.5 && (Date.now() - Date.parse(o.invoiced_at.endsWith('Z') ? o.invoiced_at : o.invoiced_at + 'Z')) / 864e5 > R.payment_days);
  const recent = orders.some(o => (Date.now() - Date.parse(o.created_at + 'Z')) / 864e5 <= 90) || D.opportunities.some(o => o.client_id === c.id && (Date.now() - Date.parse((o.updated_at || o.created_at) + 'Z')) / 864e5 <= 90);
  const parts = { sales: ytdTarget ? Math.min(1, actual / ytdTarget) * W.sales : 0, breadth: D.lists.categories.length ? Math.min(1, cats.size / D.lists.categories.length) * W.breadth : 0,
    payments: unpaidOld ? W.payments / 3 : W.payments, display: ex.showroom ? W.display : 0, activity: recent ? W.activity : 0 };
  const score = Math.round(Object.values(parts).reduce((a, x) => a + x, 0));
  const tier = (R.p200.tiers.find(t => score >= t.min) || lastOf(R.p200.tiers)).name;
  return { score, tier, parts, actual, ytdTarget, cats: cats.size, noTarget: !ex.target_12m };
}
EM.VIEWS.p200 = arg => {
  if (arg === 'plans') return p200Plans();   // batch 4: development plans and interventions
  const R = D.lists.rules, dealers = D.clients.filter(c => DEALER_KINDS.includes(c.kind) && inDiv(c) && c.division !== 'retail'), inList = dealers.filter(c => (c.extra || {}).priority200);
  const scored = (arg === 'candidates' ? dealers.filter(c => !(c.extra || {}).priority200) : inList).map(c => [c, p200Score(c)]).sort((a, b) => R.p200.tiers.findIndex(t => t.name === a[1].tier) - R.p200.tiers.findIndex(t => t.name === b[1].tier) || b[1].score - a[1].score);
  const W = R.p200.weights;
  return `<div class="stack"><div class="stack-s"><div class="kicker">EGO Premium · the dealers developed first</div><h1>Priority 200</h1>
      <p class="muted" style="max-width:780px">A dealer is in Priority 200 when "Priority 200" is Yes on its page. The score out of 100 is worked out from what is saved: sales against the year-to-date target (${W.sales}), product breadth (${W.breadth}), nothing invoiced and unpaid for more than ${R.payment_days} days (${W.payments}), a showroom (${W.display}), activity in the last 90 days (${W.activity}). The levels and weights are in Lists & stages › Rules and numbers.</p></div>
    <div class="grid g4">${R.p200.tiers.map(t => tile(t.name, scored.filter(([, x]) => x.tier === t.name).length, `score ${t.min}+`)).join('')}</div>
    ${subtabs('#/p200', arg === 'candidates' ? 'candidates' : 'list', [['list', `In Priority 200 <span class="muted">${inList.length}</span>`], ['candidates', `Other dealers <span class="muted">${dealers.length - inList.length}</span>`], ['plans', `Plans and interventions <span class="muted">${PLANS().filter(p => p.status === 'Active').length}</span>`]])}
    ${scored.length ? table(['Dealer', 'Level', 'Score', ...(D.access.prices ? ['Sales this year', 'Year-to-date target'] : []), 'Categories bought', 'Showroom'], scored.map(([c, x]) => ({ href: '#/client/' + c.id,
      cells: [`<b>${esc(c.name)}</b><div class="small muted">${esc(c.city)} · rating ${esc(c.grade || 'not set')}</div>`, `<span class="badge info">${esc(x.tier)}</span>`, `<b>${x.score}</b>`, ...(D.access.prices ? [inr0(x.actual), x.noTarget ? '<span class="muted">no target set</span>' : inr0(x.ytdTarget)] : []), `${x.cats} of ${D.lists.categories.length}`, (c.extra || {}).showroom ? 'Yes' : 'No'] })))
      : empty(arg === 'candidates' ? 'No other dealers' : 'No dealer is in Priority 200 yet', 'Set "Priority 200" to Yes on a dealer\'s page (Business details), or in the Excel file.')}</div>`;
};
EM.VIEWS.p200.title = () => 'Priority 200';

/* ---- dealer schemes (6 Oct): as EGO runs them. A target over a period, approved by the Owner or a
   Director, settled at the end. Each dealer's progress is counted from orders invoiced inside the
   period (before GST); nothing is typed. Dealers hear their progress on WhatsApp or by email. */
const SCH = () => D.schemes || { list: [], dealers: [] };
const dayOf = ts => ts ? dayIST(ts) : '';
function schemeMembers(sc) {
  const dealers = D.clients.filter(c => DEALER_KINDS.includes(c.kind) && c.division !== 'retail');
  if (sc.who === 'chosen') { const ids = new Set(SCH().dealers.filter(x => x.scheme_id === sc.id).map(x => x.client_id)); return dealers.filter(c => ids.has(c.id)); }
  if (sc.who === 'rating') return dealers.filter(c => (sc.ratings || []).includes(c.grade));
  return dealers;
}
function schemeRows(sc) {
  const O = OPSD();
  return schemeMembers(sc).map(c => {
    const inv = O.orders.filter(o => o.client_id === c.id && o.invoiced_at && dayOf(o.invoiced_at) >= sc.start_on && dayOf(o.invoiced_at) <= sc.end_on);
    const achieved = inv.reduce((a, o) => a + (o.subtotal || 0), 0), first = O.orders.filter(o => o.client_id === c.id).map(o => dayOf(o.created_at)).sort()[0];
    const settle = SCH().dealers.find(x => x.scheme_id === sc.id && x.client_id === c.id && x.settled);
    return { c, achieved, pct: sc.target ? Math.round(achieved / sc.target * 100) : 0, won: achieved >= sc.target, isNew: !!(first && first >= sc.start_on && first <= sc.end_on && inv.length), settle };
  }).sort((a, b) => b.pct - a.pct || a.c.name.localeCompare(b.c.name));
}
const schemeState = sc => sc.status === 'Draft' ? ['Draft: waiting for approval', 'warn'] : sc.status === 'Rejected' ? ['Rejected', 'bad'] : sc.status === 'Settled' ? ['Settled', 'ok'] : today() < sc.start_on ? [`Approved: starts ${ds(sc.start_on)}`, 'info'] : today() <= sc.end_on ? ['Running', 'info'] : ['Ended: to settle', 'warn'];
const canSch = right => (D.access.schemes || []).includes(right);   // draw up, approve, settle: switched in Roles & access
EM.VIEWS.schemes = () => {
  const L = SCH().list;
  return `<div class="stack"><div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">EGO Premium · dealer schemes</div><h1>Schemes</h1>
      <p class="muted" style="max-width:780px">A target over a period, as EGO runs them today (a 7-month dealer scheme). Approved by the Owner or a Director, settled at the end by the Owner, a Director or Wholesale Finance. Each dealer's progress is counted from orders invoiced inside the period, before GST; nothing is typed.</p></div>
      ${canSch('edit') ? '<button class="btn primary" data-act="sch-add">+ Draw up a scheme</button>' : ''}</div>
    ${L.length ? table(['Scheme', 'Period', ...(D.access.prices ? ['Target per dealer'] : []), 'Dealers', 'Reached the target', 'Status'], L.map(sc => { const rows = schemeRows(sc), st = schemeState(sc);
      return { href: '#/scheme/' + sc.id, cells: [`<b>${esc(sc.name)}</b><div class="small muted">${esc(sc.ref || '')}</div>`, `${ds(sc.start_on)} to ${ds(sc.end_on)}`, ...(D.access.prices ? [inr0(sc.target)] : []), num(rows.length), D.access.prices ? num(rows.filter(r => r.won).length) : '<span class="muted">Hidden</span>', `<span class="badge ${st[1]}">${esc(st[0])}</span>`] }; }))
      : empty('No schemes yet', 'Draw up the scheme running today: its period, the target per dealer, which dealers, and the reward. It runs once the Owner or a Director approves it.', canSch('edit') ? '<button class="btn primary" data-act="sch-add">+ Draw up a scheme</button>' : '')}</div>`;
};
EM.VIEWS.schemes.title = () => 'Schemes';
EM.VIEWS.scheme = id => {
  const sc = SCH().list.find(x => x.id === id);
  if (!sc) return `<div class="stack"><h1>Scheme not found</h1><a class="btn" href="#/schemes">Schemes</a></div>`;
  const rows = schemeRows(sc), st = schemeState(sc), P = D.access.prices, ended = today() > sc.end_on;
  const msg = r => `Dear ${r.c.name}, your progress on the EGO Premium scheme "${sc.name}" (${ds(sc.start_on)} to ${ds(sc.end_on)}): ₹${Math.round(r.achieved).toLocaleString('en-IN')} of ₹${Math.round(sc.target).toLocaleString('en-IN')} (${r.pct}%).${r.won ? ' Target reached, congratulations!' : ` ₹${Math.round(sc.target - r.achieved).toLocaleString('en-IN')} to go.`}${sc.reward ? ' Reward: ' + sc.reward + '.' : ''} EGO Premium`;
  const send = r => { const w = String(r.c.whatsapp || r.c.mobile || '').replace(/\D/g, ''), t = encodeURIComponent(msg(r));
    return `${w ? `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${w}?text=${t}">WhatsApp</a>` : ''}${r.c.email ? `<a class="btn sm ghost" href="mailto:${esc(r.c.email)}?subject=${encodeURIComponent('Your progress: ' + sc.name)}&body=${t}">Email</a>` : ''}`; };
  return `<div class="stack">${crumbs(['Schemes', '#/schemes'], [sc.name])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(sc.name)}</h1><div class="row"><span class="badge ${st[1]}">${esc(st[0])}</span><span class="small muted">${esc(sc.ref || '')}</span></div></div>
      <div class="row">${['Draft', 'Rejected'].includes(sc.status) && canSch('edit') ? `<button class="btn" data-act="sch-edit" data-id="${id}">${sc.status === 'Rejected' ? 'Change and send again' : 'Edit'}</button>` : ''}${sc.status === 'Draft' && canSch('approve') ? `<button class="btn primary" data-act="sch-approve" data-id="${id}">Approve</button><button class="btn ghost" data-act="sch-reject" data-id="${id}">Reject</button>` : ''}${sc.status === 'Approved' && ended && canSch('settle') ? `<button class="btn primary" data-act="sch-settle" data-id="${id}">Settle</button>` : ''}${D.access.can_delete ? `<button class="btn ghost" data-act="sch-del" data-id="${id}">Delete</button>` : ''}</div></div>
    ${sc.reject_reason ? `<div class="callout ${sc.status === 'Rejected' ? 'warn' : ''}" data-sch-rejected><b>${sc.status === 'Rejected' ? 'Rejected' : 'Sent again after a rejection'}</b> by ${esc(staffName(sc.rejected_by))} · ${whenTxt(sc.rejected_at)}: ${esc(sc.reject_reason)}${sc.status === 'Rejected' ? '<br><span class="small">Whoever drew it up changes it and sends it again for approval.</span>' : ''}</div>` : ''}
    <div class="grid g4">${tile('Dealers in it', num(rows.length))}${P ? tile('Reached the target', num(rows.filter(r => r.won).length)) : ''}${P ? tile('New dealers activated', num(rows.filter(r => r.isNew).length), 'first order inside the period') : ''}${P ? tile('Invoiced in the period', inr0(rows.reduce((a, r) => a + r.achieved, 0)), 'before GST') : ''}</div>
    <section class="card stack-s"><h3>The scheme</h3>${kv([['Period', `${ds(sc.start_on)} to ${ds(sc.end_on)}`], ...(P ? [['Target per dealer', inr0(sc.target)]] : []), ['For', esc(SCHEME_WHO[sc.who]) + (sc.who === 'rating' ? ': ' + esc((sc.ratings || []).join(', ')) : '')], ['Reward', esc(sc.reward || '') || NOTSET], ['Notes', esc(sc.notes || '') || NOTSET],
      ['Drawn up by', esc(staffName(sc.created_by))], ['Approved by', sc.approved_by ? `${esc(staffName(sc.approved_by))} · ${whenTxt(sc.approved_at)}` : NOTSET], ['Settled by', sc.settled_by ? `${esc(staffName(sc.settled_by))} · ${whenTxt(sc.settled_at)}` : NOTSET]])}</section>
    <section class="card stack-s"><h3>Each dealer's progress</h3><p class="small muted">Counted from orders invoiced between ${ds(sc.start_on)} and ${ds(sc.end_on)}, before GST. Send each dealer their progress on WhatsApp or by email.</p>
      ${rows.length ? table(['Dealer', 'Rating', ...(P ? ['Invoiced', '% of target'] : []), 'Status', ...(sc.status === 'Settled' ? ['Settlement'] : []), ...(P ? ['Send progress'] : [])], rows.map(r => [`<a href="#/client/${r.c.id}"><b>${esc(r.c.name)}</b></a><div class="small muted">${esc(kindLabel(r.c.kind))} · ${esc(r.c.city)}</div>`, esc(r.c.grade || ''),
        ...(P ? [inr0(r.achieved), `${r.pct}%`] : []), P ? (r.won ? '<span class="badge ok">Reached</span>' : '<span class="badge plain">Not yet</span>') + (r.isNew ? ' <span class="badge info">New dealer</span>' : '') : '', ...(sc.status === 'Settled' ? [esc((r.settle || {}).settle_note || '')] : []), ...(P ? [send(r)] : [])]))
        : '<p class="muted">No dealer matches this scheme yet.</p>'}</section></div>`;
};
EM.VIEWS.scheme.tab = 'schemes';
EM.VIEWS.scheme.title = id => (SCH().list.find(x => x.id === id) || { name: 'Scheme' }).name;
const addMonths = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCMonth(x.getUTCMonth() + n); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); };
function openSchemeForm(sc) {
  const v = sc ? { ...sc, dealers: SCH().dealers.filter(x => x.scheme_id === sc.id).map(x => x.client_id) } : { start_on: today(), end_on: addMonths(today(), 7), who: 'all', ratings: [], dealers: [] };
  const dealers = D.clients.filter(c => DEALER_KINDS.includes(c.kind) && c.division !== 'retail').sort((a, b) => a.name.localeCompare(b.name)).map(c => [c.id, `${c.name} · ${kindLabel(c.kind)} · ${c.city}`]);
  EM.modal(`<h2>${sc ? 'Edit ' + esc(sc.name) : 'Draw up a scheme'}</h2><p class="muted small">It runs once the Owner or a Director approves it. Compulsory fields end with a star.</p>
    <form id="scf" class="stack" onsubmit="return false" style="margin-top:14px"><div class="fgrid">
      <div class="field span2" data-field="sch_name"><label for="scf-name">Scheme name *</label><input class="input" id="scf-name" value="${esc(v.name || '')}" placeholder="e.g. 7-month dealer scheme, Oct to Apr"></div>
      <div class="field"><label for="scf-start">Starts on *</label><input class="input" type="date" id="scf-start" value="${esc(v.start_on)}"></div>
      <div class="field"><label for="scf-end">Ends on *</label><input class="input" type="date" id="scf-end" value="${esc(v.end_on)}"></div>
      <div class="field"><label for="scf-target">Target per dealer *</label>${G.adorn({ type: 'money', key: 'target' }, `<input class="input" type="number" min="0" step="1" id="scf-target" value="${esc(v.target || '')}">`)}</div>
      ${G.select({ key: 'who', label: 'Which dealers', req: true }, v.who, 'scf', Object.entries(SCHEME_WHO), false).replace('<select', '<select data-sch-who')}
      <div data-sch-part="rating" ${v.who === 'rating' ? '' : 'hidden'} class="span2">${G.multi({ key: 'ratings', label: 'Dealer ratings' }, v.ratings, 'scf', D.lists.dealer_grades || [])}</div>
      <div data-sch-part="chosen" ${v.who === 'chosen' ? '' : 'hidden'} class="span2">${G.multi({ key: 'dealers', label: 'Dealers' }, v.dealers, 'scf', dealers)}</div>
      <div class="field span2"><label for="scf-reward">Reward</label><input class="input" id="scf-reward" value="${esc(v.reward || '')}" placeholder="e.g. 2% credit note, or a trip"></div>
      <div class="field span2"><label for="scf-notes">Notes</label><textarea class="input" id="scf-notes" rows="2">${esc(v.notes || '')}</textarea></div></div>
      ${errBox('scf-err')}<div class="row sticky-actions"><button class="btn primary" data-act="sch-save" data-id="${sc ? sc.id : ''}">${sc ? (sc.status === 'Rejected' ? 'Save and send again for approval' : 'Save') : 'Save as draft'}</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
document.addEventListener('change', e => { if (!e.target.matches('[data-sch-who]')) return; document.querySelectorAll('[data-sch-part]').forEach(x => { x.hidden = x.dataset.schPart !== e.target.value; }); });
EM.ACTIONS['sch-add'] = () => openSchemeForm(null);
EM.ACTIONS['sch-edit'] = el => openSchemeForm(SCH().list.find(x => x.id === el.dataset.id));
const schReload = async () => { Object.assign(D, await API('GET', '/api/bootstrap')); };
EM.ACTIONS['sch-save'] = async el => {
  const f = qs('#scf'), pick = n => [...f.querySelectorAll(`[name="${n}"]:checked`)].map(x => x.value);
  const b = { name: qs('#scf-name').value, start_on: qs('#scf-start').value, end_on: qs('#scf-end').value, target: Number(qs('#scf-target').value || 0), who: f.querySelector('[data-sch-who]').value, ratings: pick('ratings'), dealers: pick('dealers'), reward: qs('#scf-reward').value, notes: qs('#scf-notes').value };
  if (el.dataset.id) b.id = el.dataset.id;
  const again = el.textContent.includes('again');   // a rejected scheme goes back for approval
  busy(el, true);
  try { const r = await API('POST', '/api/schemes', b); await schReload(); EM.closeModal(); EM.toast(`<b>${esc(b.name)}</b> saved. ${!el.dataset.id || again ? 'It runs once the Owner or a Director approves it.' : ''}`); location.hash = '#/scheme/' + r.id; EM.rerender(); }
  catch (x) { busy(el, false); showErr('scf-err', x.errors || x.message); }
};
EM.ACTIONS['sch-approve'] = async el => { busy(el, true); try { await API('POST', `/api/schemes/${el.dataset.id}/approve`, {}); await schReload(); EM.toast('<b>Scheme approved</b>'); EM.rerender(); } catch (x) { busy(el, false); bubbleNear(el, x.message); } };
EM.ACTIONS['sch-reject'] = el => { const sc = SCH().list.find(x => x.id === el.dataset.id);
  EM.modal(`<h2>Reject ${esc(sc.name)}?</h2><p class="muted">Say why. Whoever drew it up sees the reason, changes the scheme and sends it again.</p>
    <div class="field" style="margin-top:12px" data-field="reject_reason"><label for="sr-why">Why it is rejected *</label><textarea class="input" id="sr-why" rows="3" placeholder="e.g. Target too low for A-rated dealers; make it ₹5 lakh"></textarea></div>
    ${errBox('sr-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="sch-reject-go" data-id="${sc.id}">Reject</button><button class="btn" data-act="close-modal">Cancel</button></div>`); };
EM.ACTIONS['sch-reject-go'] = async el => {
  const reason = qs('#sr-why').value.trim();
  if (!reason) return showErr('sr-err', 'Why it is rejected is compulsory');
  busy(el, true);
  try { await API('POST', `/api/schemes/${el.dataset.id}/reject`, { reason }); await schReload(); EM.closeModal(); EM.toast('<b>Scheme rejected</b>'); EM.rerender(); } catch (x) { busy(el, false); showErr('sr-err', x.errors || x.message); }
};
EM.ACTIONS['sch-settle'] = el => {
  const sc = SCH().list.find(x => x.id === el.dataset.id), won = schemeRows(sc).filter(r => r.won);
  EM.modal(`<h2>Settle ${esc(sc.name)}</h2><p class="muted">${won.length} dealer${won.length === 1 ? '' : 's'} reached the target. Say how each one is settled (credit note, cheque, trip…).</p>
    <div class="stack-s" style="margin-top:12px">${won.map(r => `<div class="field"><label for="st-${r.c.id}">${esc(r.c.name)} · ${inr0(r.achieved)}</label><input class="input" id="st-${r.c.id}" data-settle="${r.c.id}" placeholder="How it was settled"></div>`).join('') || '<p class="small muted">Nobody reached the target; settling closes the scheme.</p>'}</div>
    ${errBox('st-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="sch-settle-go" data-id="${sc.id}">Settle the scheme</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['sch-settle-go'] = async el => {
  const notes = Object.fromEntries([...document.querySelectorAll('[data-settle]')].map(x => [x.dataset.settle, x.value]));
  busy(el, true);
  try { await API('POST', `/api/schemes/${el.dataset.id}/settle`, { notes }); await schReload(); EM.closeModal(); EM.toast('<b>Scheme settled</b>'); EM.rerender(); } catch (x) { busy(el, false); showErr('st-err', x.message); }
};
EM.ACTIONS['sch-del'] = async el => { const sc = SCH().list.find(x => x.id === el.dataset.id); if (!confirm(`Delete ${sc.name}?`)) return; try { await API('DELETE', '/api/schemes/' + sc.id); await schReload(); location.hash = '#/schemes'; } catch (x) { bubbleNear(el, x.message); } };

/* ---- Lists & stages: the operations stage sets and the rules */
const OPS_LIST_GROUP = () => ['Operations stages', 'The stages of the processing side. Any item can be locked or unlocked. ⚙ marks the stages that run the processing: unlock one to rename it (the processing follows the new name); they cannot be removed, and they keep their order.', Object.entries(OPS).map(([k, v]) => ['ops.' + k, v.label])];
EM.ACTIONS['rules-open'] = () => {
  const R = D.lists.rules, n = (id, label, v, unit) => `<div class="field"><label for="ru-${id}">${label}</label>${G.adorn(unit === '₹' ? { type: 'money', key: id } : { key: 'x' }, `<input class="input" type="number" min="0" step="any" id="ru-${id}" value="${v}">`).replace('class="suf">undefined<', `class="suf">${unit || ''}<`).replace('<span class="suf"></span>', '')}</div>`;
  EM.modal(`<h2>Rules and numbers</h2><p class="muted small">The numbers the processing uses. Changes apply from the next order, approval or score.</p>
    <div class="stack" style="margin-top:12px"><fieldset class="fs"><legend>Orders and production</legend><div class="fgrid">${n('gst', 'GST', R.gst_pct, '%')}${n('wastage', 'Wastage on a new line', wastageDefault(R), '%')}${n('moq', 'Minimum production order', R.moq_boxes, 'boxes')}${n('round', 'Round production up to', R.production_round_boxes, 'boxes')}${n('eta', 'Production takes', R.production_eta_days, 'days')}${n('pay', 'An order is overdue after', R.payment_days, 'days')}${n('cset', 'Complaint settlements need approval from', R.complaint_settle_from, '₹')}${n('lesc', 'A dealer lead goes to the field sales owner after', R.lead_escalate_days ?? 2, 'days without an update')}</div></fieldset>
    <fieldset class="fs" data-cat-units><legend>How each category is sold</legend><p class="small muted">Flooring and cladding are per sq ft, with whole boxes. Accessories (skirting, profiles, underlay foam, film, installation) are per piece or per running ft (rft). A new category starts from its name; change any here.</p>
      ${table(['Category', 'Sold'], allCats().map(c => [esc(c), `<select class="input" data-cu="${esc(c)}" aria-label="${esc(c)} sold" style="max-width:240px">${Object.entries(QTY_UNIT_LONG).map(([k, l]) => `<option value="${k}" ${catUnit(c, R) === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`]))}</fieldset>
    <fieldset class="fs"><legend>Approval limits (the Owner has none)</legend>${table(['Approval', 'Regional manager / Project head', 'Head', 'Director'], Object.entries(R.approvals).map(([k, a]) => [esc(a.label) + ` <span class="muted">(${a.unit})</span>`, ...['manager', 'head', 'director'].map(l => `<input class="input" type="number" min="0" step="any" data-ap="${k}" data-lv="${l}" value="${a.levels[l]}" aria-label="${esc(a.label)} ${l}" style="max-width:140px">`)]))}</fieldset>
    <fieldset class="fs"><legend>Priority 200 levels (a dealer gets the first level whose score it reaches)</legend><div id="p2t" class="stack-s">${R.p200.tiers.map(t => `<div class="row p2t"><input class="input" data-t="name" value="${esc(t.name)}" style="max-width:180px" aria-label="Level name"><input class="input" type="number" min="0" max="100" data-t="min" value="${t.min}" style="max-width:120px" aria-label="From score"><button class="btn sm ghost" data-act="p2t-del">✕</button></div>`).join('')}</div><div class="row"><button class="btn sm" data-act="p2t-add">+ Level</button></div></fieldset>
    <fieldset class="fs"><legend>Priority 200 weights (they add up to 100)</legend><div class="fgrid">${Object.entries({ sales: 'Sales against target', breadth: 'Product breadth', payments: 'Payments on time', display: 'Showroom', activity: 'Activity in 90 days' }).map(([k, l]) => n('w-' + k, l, R.p200.weights[k], 'points')).join('')}</div></fieldset></div>
    ${errBox('ru-err')}<div class="row sticky-actions" style="margin-top:12px"><button class="btn primary" data-act="rules-save">Save</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['p2t-add'] = () => qs('#p2t').insertAdjacentHTML('beforeend', '<div class="row p2t"><input class="input" data-t="name" style="max-width:180px" aria-label="Level name"><input class="input" type="number" min="0" max="100" data-t="min" style="max-width:120px" aria-label="From score"><button class="btn sm ghost" data-act="p2t-del">✕</button></div>');
EM.ACTIONS['p2t-del'] = el => el.closest('.p2t').remove();
EM.ACTIONS['rules-save'] = async el => {
  if (!el.dataset.sure) {   /* what a change of the numbers affects, before it is saved */
    const err = qs('#ru-err'); if (err) err.innerHTML = '<div class="callout"><b>Before saving:</b> new numbers apply from the next sale, approval or score. Saved sales keep the numbers they were made with; pending approvals are decided against the new limits; every Priority 200 dealer is re-scored. Press Save again to confirm.</div>';
    el.dataset.sure = '1'; el.textContent = 'Save, I understand'; return;
  }
  const v = id => Number(qs('#ru-' + id).value), R = D.lists.rules;
  const rules = { ...R, gst_pct: v('gst'), wastage_pct: v('wastage'), cat_units: Object.fromEntries([...document.querySelectorAll('[data-cu]')].map(x => [x.dataset.cu, x.value])), moq_boxes: v('moq'), production_round_boxes: v('round'), production_eta_days: v('eta'), payment_days: v('pay'), complaint_settle_from: v('cset'), lead_escalate_days: v('lesc'),
    approvals: Object.fromEntries(Object.keys(R.approvals).map(k => [k, { levels: Object.fromEntries([...document.querySelectorAll(`[data-ap="${k}"]`)].map(i => [i.dataset.lv, Number(i.value)])) }])),
    p200: { tiers: [...document.querySelectorAll('#p2t .p2t')].map(r => ({ name: r.querySelector('[data-t="name"]').value.trim(), min: Number(r.querySelector('[data-t="min"]').value) })).filter(t => t.name),
      weights: Object.fromEntries(['sales', 'breadth', 'payments', 'display', 'activity'].map(k => [k, v('w-' + k)])) } };
  busy(el, true);
  try { const r = await API('POST', '/api/rules', { rules }); D.lists = r.lists; EM.closeModal(); EM.toast('<b>Rules and numbers saved</b>'); EM.rerender(); } catch (x) { busy(el, false); showErr('ru-err', x.message); }
};

/* ---------------------------------------------------------------- the Excel files, with today's lists
   The files are built once, but the lists change in Lists & stages and the team changes in
   Team & access. On download the hidden Lists sheet is refilled with today's values and every
   dropdown's range is stretched to fit, so the Excel lists always equal the app's. */
const JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
const loadJs = (src, test) => new Promise((ok, bad) => { if (test()) return ok(); const el = document.createElement('script'); el.src = src; el.onload = ok; el.onerror = () => bad(new Error('Could not load a helper. Check the internet connection.')); document.head.appendChild(el); });
const todayList = key => key === 'team' ? D.staff.filter(x => x.active).map(x => x.name) : key === 'cities' ? D.lists.cities.map(c => c.city) : D.lists[key];
const xmlEsc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function personalTemplate(file) {
  await loadJs(JSZIP_URL, () => window.JSZip);
  const zip = await window.JSZip.loadAsync(await (await fetch(file, { cache: 'no-store' })).arrayBuffer());
  const wbx = await zip.file('xl/workbook.xml').async('string'), rels = await zip.file('xl/_rels/workbook.xml.rels').async('string');
  const rid = (wbx.match(/<sheet[^>]*name="Lists"[^>]*r:id="([^"]+)"/) || [])[1];
  const target = rid && (rels.match(new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`)) || rels.match(new RegExp(`Target="([^"]+)"[^>]*Id="${rid}"`)) || [])[1];
  if (!target) return zip.generateAsync({ type: 'blob' });
  const path = 'xl/' + target.replace(/^\/?xl\//, ''), sx = await zip.file(path).async('string');
  const sst = zip.file('xl/sharedStrings.xml') ? [...(await zip.file('xl/sharedStrings.xml').async('string')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join('')) : [];
  /* read the sheet as columns of values */
  const cols = {};
  for (const m of sx.matchAll(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, c, r, attrs, inner = ''] = m, t = (attrs.match(/t="(\w+)"/) || [])[1];
    const raw = t === 'inlineStr' ? (inner.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1] : (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
    const v = t === 's' ? sst[+raw] : raw;
    (cols[c] = cols[c] || [])[+r - 1] = v;
  }
  const ends = {};
  for (const [c, vals] of Object.entries(cols)) {
    const head = vals[0] || '-', now = head.startsWith('@') && todayList(head.slice(1).replace(/&amp;/g, '&'));
    if (now && now.length) cols[c] = [head, ...now.map(xmlEsc)];
    ends[c] = cols[c].filter(x => x != null).length;
  }
  const letters = Object.keys(cols).sort((a, b) => a.length - b.length || a.localeCompare(b)), max = Math.max(...Object.values(ends));
  let data = '<sheetData>';
  for (let r = 1; r <= max; r++) data += `<row r="${r}">` + letters.filter(c => cols[c][r - 1] != null).map(c => `<c r="${c}${r}" t="inlineStr"><is><t>${cols[c][r - 1]}</t></is></c>`).join('') + '</row>';
  zip.file(path, sx.replace(/<sheetData>[\s\S]*<\/sheetData>|<sheetData\/>/, data + '</sheetData>').replace(/<dimension[^>]*\/>/, ''));
  /* every dropdown that reads a Lists column now reaches its new last row */
  for (const f of Object.keys(zip.files).filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n) && n !== path)) {
    const x = await zip.file(f).async('string');
    const y = x.replace(/Lists!\$([A-Z]+)\$2:\$([A-Z]+)\$(\d+)/g, (m, a, b) => `Lists!$${a}$2:$${b}$${Math.max(2, ends[a] || 2)}`);
    if (y !== x) zip.file(f, y);
  }
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
window.personalTemplate = personalTemplate;
document.addEventListener('click', async e => {
  const a = e.target.closest('a[download][href$=".xlsx"]');
  if (!a) return;
  e.preventDefault();
  try {
    const blob = await personalTemplate(a.getAttribute('href')), url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = a.getAttribute('href'); document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (x) { location.href = a.getAttribute('href'); }   // the plain file is still correct, only without today's list changes
});

/* ---------------------------------------------------------------- import from Excel
   Two templates, one per company. Each company's card downloads its own file and
   uploads only that file; the server refuses the other company's file too. */
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const IMP = { tpl: null, file: null, rows: [], results: null, done: null, error: '' };
/* both files always side by side for anyone who works in both companies, whatever the top switch says */
const tplsHere = () => Object.values(TEMPLATES).filter(t => t.id === 'inv' ? !!D.access.stock : canDiv(t.division));
const SHEET_NOTE = {
  dealers: 'Each dealer, distributor and sub-dealer company: where it is, the areas it covers, its rating, then the rest.',
  dealer_people: 'Everyone who works at those companies: role, what they handle, name, mobile, email.',
  architects: 'Each architect firm, or solo architect: where it is, its rating, then the rest.',
  architect_people: 'Everyone who works at those firms: role, what they handle, name, mobile, email.',
  clients: 'People with no company: individuals, or a firm on its own.',
  categories: 'Every kind of floor: LVT, SPC, Laminate, Engineered, Deck...',
  collections: 'Each collection with its category, box size (sq ft or m²) and specifications.',
  warehouses: 'Every warehouse: name, city, address.',
  stock: 'Every design, and how many boxes are in each warehouse today (one row per design per warehouse). Sq ft are worked out in the sheet.',
};
EM.VIEWS.import = () => {
  const r = IMP.results, cnt = s => r ? r.filter(x => x.status === s).length : 0;
  const shown = r ? (IMP.errorsOnly ? r.filter(x => x.status === 'error') : r) : [];
  const ts = tplsHere();
  return `<div class="stack">
    <div class="stack-s"><div class="kicker">Bulk upload</div><h1>Import from Excel</h1><p class="muted" style="max-width:760px">EGO Premium and Big E each have their own file. Download the file for your company, fill it, and upload it in the same card. Nothing is saved until you have seen every row: each one shows as <b>new</b>, <b>update</b> (already saved) or <b>error</b> with the reason. Uploading the same file again only updates.</p></div>
    <div class="grid g2">${ts.map(t => `<section class="card stack-s" data-template="${t.id}"><div class="kicker">${esc(t.id === 'inv' ? 'Shared by EGO Premium and Big E' : t.division === 'wholesale' ? 'Wholesale' : 'Retail')}</div><h3>${esc(t.company)} file</h3>
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
      const name = String(data.name || '').trim();
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
    const keys = r.tab === 'clients' ? [normMobile(r.data.mobile || r.data.poc_mobile).value, normGst(r.data.gst)].filter(Boolean).map(k => 'c:' + k)
      : r.tab === 'contacts' ? ['k:' + String(r.data.client_key).trim().toLowerCase() + '|' + (normMobile(r.data.mobile).value || '')]
        : ['categories', 'collections', 'warehouses'].includes(r.tab) ? [r.tab + ':' + r.name.toLowerCase()]
          : r.tab === 'stock' ? ['s:' + String(r.data.collection || '').trim().toLowerCase() + '|' + r.name.toLowerCase() + '|' + String(r.data.warehouse || '').trim().toLowerCase()] : [];
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
    [normMobile(r.data.mobile || r.data.poc_mobile).value, normGst(r.data.gst)].filter(Boolean).forEach(k => { o[k] = kind; });
    if (r.name) o['n:' + r.name.toLowerCase()] = kind;
  });
  /* the inventory file: collections, designs and warehouses it creates */
  const low = v => String(v == null ? '' : v).trim().toLowerCase();
  IMP.rows.filter(r => !r.local).forEach(r => {
    if (r.tab === 'categories') o['cat:' + low(r.data.name)] = String(r.data.name).trim();
    if (r.tab === 'collections') o['col:' + low(r.data.name)] = String(r.data.category || '').trim() || 1;
    if (r.tab === 'warehouses') o['wh:' + low(r.data.name)] = 1;
    if (r.tab === 'stock') { o['prod:' + low(r.data.name)] = 1; if (low(r.data.code)) o['prod:' + low(r.data.code)] = 1; }
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
    for (const tab of ['clients', 'contacts', 'categories', 'collections', 'warehouses', 'stock']) {
      /* distributors go first, so a sub-dealer in the same file finds the distributor that serves it */
      const res = await sendRows(todo.filter(r => r.tab === tab).sort((x, y) => (String(y.data.kind).toLowerCase().startsWith('distributor') ? 1 : 0) - (String(x.data.kind).toLowerCase().startsWith('distributor') ? 1 : 0)), false, prog);
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
  s.active ? `${isOwner() && s.id !== me().id ? `<button class="btn sm" data-act="view-as" data-id="${s.id}">View as</button>` : ''}<button class="btn sm ghost" data-act="staff-edit" data-id="${s.id}">Edit</button><button class="btn sm ghost" data-act="staff-pass" data-id="${s.id}">New password</button>${s.id !== me().id ? `<button class="btn sm ghost" data-act="staff-off" data-id="${s.id}">Switch off</button>` : ''}` : '']));
/* Roles & access (8 Oct): every switch of every role, for management. Each click saves at once; the
   people in that role get it at their next reload or sign-in. "View as" shows exactly what they see. */
const TAB_CHOICES = [['people', 'People'], ['architects', 'Architects'], ['design500', 'Design 500'], ['dealers', 'Dealers'], ['opps', 'Opportunities'], ['projects', 'Projects'], ['schemes', 'Schemes'], ['orders', 'Fulfilment'], ['orderbook', 'Orders'], ['installation', 'Installation'], ['complaints', 'Complaints'], ['approvals', 'Approvals'], ['analysis', 'Analysis'], ['p200', 'Priority 200'], ['inventory', 'Inventory'], ['import', 'Import from Excel'], ['attendance', 'Attendance'], ['roadmap', 'Roadmap']];
const ROLE_SWITCHES = [['prices', 'Sees money (rates, values, payments)'], ['readonly', 'View only (changes nothing)'], ['users', 'Manages logins (Team & access)'], ['stock', 'Changes the inventory'], ['can_delete', 'Deletes records'], ['can_lists', 'Edits lists, stages and rules'], ['can_targets', 'Sets targets (founders for anyone, others for their team)']];
EM.roleOpen = EM.roleOpen || '';
function rolesMatrix() {
  const edit = isOwner(), L = D.lists.rules;
  const card = r => { const n = D.staff.filter(s => s.role === r.id && s.active), locked = !edit || r.id === 'owner', dis = locked ? 'disabled' : '', open = EM.roleOpen === r.id;
    const chk = (k, label, on) => `<label class="chip" style="padding:6px 10px"><input type="checkbox" data-rsw="${r.id}|${k}" ${on ? 'checked' : ''} ${dis}> ${esc(label)}</label>`;
    const tabsOn = (r.tabs || []).length ? r.tabs : TAB_CHOICES.map(([k]) => k).filter(k => !FIELD_TABS[k] || FIELD_TABS[k].includes(r.id));   // R2a: the two field boards follow FIELD_TABS until ticked
    return `<section class="card stack-s" data-role-card="${r.id}"><div class="row between"><div><b>${esc(r.name)}</b> <span class="small muted">${n.length} ${n.length === 1 ? 'person' : 'people'}${n.length ? ': ' + esc(n.slice(0, 6).map(s => s.name.split(' ')[0]).join(', ')) + (n.length > 6 ? '…' : '') : ''}</span>
        <div class="small muted">${esc((SCOPES_ALL.find(x => x[0] === r.scope) || ['', r.scope])[1])} · ${divName(r.division)}${r.prices ? ' · money' : ' · no money'}${r.readonly ? ' · view only' : ''} · ${esc((DASHES.find(x => x[0] === (r.dash || '')) || ['', ''])[1])} dashboard</div></div>
      <div class="row">${edit ? `<button class="btn sm" data-act="role-toggle" data-id="${r.id}">${open ? 'Close' : r.id === 'owner' ? 'See' : 'Change access'}</button><button class="btn sm ghost" data-act="role-copy" data-id="${r.id}">Copy role</button>${r.id !== 'owner' && !D.staff.some(s => s.role === r.id) ? `<button class="btn sm ghost" data-act="role-del" data-id="${r.id}">Remove</button>` : ''}` : ''}</div></div>
      ${open ? `<div class="stack-s" data-role-body>${r.id === 'owner' ? '<div class="callout">The Owner role always has full access, so management can never be locked out.</div>' : ''}
        <div class="fgrid"><div class="field"><label for="rn-${r.id}">Role name</label><input class="input" id="rn-${r.id}" data-rsw="${r.id}|name" value="${esc(r.name)}" ${dis}></div>
          <div class="field"><label for="rs-${r.id}">Sees</label><select class="input" id="rs-${r.id}" data-rsw="${r.id}|scope" ${dis}>${SCOPES_ALL.map(([k, l]) => `<option value="${k}" ${r.scope === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
          <div class="field"><label for="rd-${r.id}">Company</label><select class="input" id="rd-${r.id}" data-rsw="${r.id}|division" ${dis}>${[['wholesale', 'EGO Premium'], ['retail', 'Big E'], ['both', 'Both']].map(([k, l]) => `<option value="${k}" ${r.division === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field"><label for="rh-${r.id}">Dashboard</label><select class="input" id="rh-${r.id}" data-rsw="${r.id}|dash" ${dis}>${DASHES.map(([k, l]) => `<option value="${k}" ${(r.dash || '') === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
          <div class="field"><label for="rl-${r.id}">Approves</label><select class="input" id="rl-${r.id}" data-rsw="${r.id}|level" ${dis}>${LEVELS.map(([k, l]) => `<option value="${k}" ${(r.level || 'none') === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div></div>
        <div class="small muted">Approval limits: credit ₹${num(L.approvals.credit.levels.manager)} / ₹${num(L.approvals.credit.levels.head)} / ₹${num(L.approvals.credit.levels.director)} (manager / head / director), set in Lists & stages › Rules and numbers.</div>
        <b class="small">What they may do</b><div class="row" style="flex-wrap:wrap;gap:6px">${ROLE_SWITCHES.map(([k, l]) => chk(k, l, r[k])).join('')}</div>
        <b class="small">Screens in their menu</b><div class="row" style="flex-wrap:wrap;gap:6px" data-rtabs="${r.id}">${TAB_CHOICES.map(([k, l]) => `<label class="chip" style="padding:6px 10px"><input type="checkbox" data-rtab="${r.id}|${k}" ${tabsOn.includes(k) ? 'checked' : ''} ${dis}> ${esc(l)}</label>`).join('')}</div>
        <b class="small">Order steps they move</b><div class="row" style="flex-wrap:wrap;gap:6px">${Object.entries(FUL_LABEL).map(([k, l]) => `<label class="chip" style="padding:6px 10px"><input type="checkbox" data-rlist="${r.id}|ful|${k}" ${(r.ful || []).includes(k) ? 'checked' : ''} ${dis}> ${esc(l)}</label>`).join('')}</div>
        <b class="small">Dealer schemes</b><div class="row" style="flex-wrap:wrap;gap:6px">${Object.entries(SCHEME_LABEL).map(([k, l]) => `<label class="chip" style="padding:6px 10px"><input type="checkbox" data-rlist="${r.id}|schemes|${k}" ${(r.schemes || []).includes(k) ? 'checked' : ''} ${dis}> ${esc(l)}</label>`).join('')}</div>
        <p class="small muted" data-role-note="${r.id}">Each change saves at once and reaches the ${n.length} ${n.length === 1 ? 'person' : 'people'} in this role at their next reload or sign-in. ${n.length ? 'Use View as in People to see exactly what they see.' : ''}</p></div>` : ''}</section>`; };
  return `<div class="stack-s"><p class="muted">${edit ? 'Management decides who sees and does what. Open a role, switch what you want; a person who needs a little more or less gets a copied role (Copy role, then change their role in People › Edit).' : 'Only an Owner changes roles.'}</p>${D.roles.map(card).join('')}</div>`;
}
const saveRoleSw = async (id, patch) => {
  if (D.access.viewing_as) return EM.toast('Press Back to me first: nothing changes while viewing as someone.');
  try { const r = await API('POST', '/api/roles/' + id, patch); upsertLocal(D.roles, r.role); EM.toast(`<b>${esc(r.role.name)}</b> saved. Applies to ${r.people} ${r.people === 1 ? 'person' : 'people'} at their next reload or sign-in.`); EM.rerender(); }
  catch (x) { EM.toast(esc(x.message)); EM.rerender(); }
};
document.addEventListener('change', e => {
  const t = e.target;
  if (!t.dataset) return;
  if (t.dataset.rsw) { const [id, k] = t.dataset.rsw.split('|'); return saveRoleSw(id, { [k]: t.type === 'checkbox' ? t.checked : t.value }); }
  if (t.dataset.rtab) { const id = t.dataset.rtab.split('|')[0]; return saveRoleSw(id, { tabs: [...document.querySelectorAll(`[data-rtab^="${id}|"]:checked`)].map(x => x.dataset.rtab.split('|')[1]) }); }
  if (t.dataset.rlist) { const [id, k] = t.dataset.rlist.split('|'); return saveRoleSw(id, { [k]: [...document.querySelectorAll(`[data-rlist^="${id}|${k}|"]:checked`)].map(x => x.dataset.rlist.split('|')[2]) }); }
});
EM.ACTIONS['role-toggle'] = el => { EM.roleOpen = EM.roleOpen === el.dataset.id ? '' : el.dataset.id; EM.rerender(); };
EM.ACTIONS['role-copy'] = async el => { const from = D.roles.find(r => r.id === el.dataset.id), name = prompt('Name for the new role', `${from.name} (copy)`); if (!name) return;
  try { const r = await API('POST', '/api/roles', { from: from.id, name }); D.roles.push(r.role); EM.roleOpen = r.role.id; EM.toast(`<b>${esc(name)}</b> made with the same access as ${esc(from.name)}. Change what you need, then give it to a person in People › Edit.`, 8000); EM.rerender(); } catch (x) { EM.toast(esc(x.message)); } };
EM.ACTIONS['role-del'] = async el => { const r = D.roles.find(x => x.id === el.dataset.id); if (!confirm(`Remove the role ${r.name}?`)) return; try { await API('DELETE', '/api/roles/' + r.id); D.roles = D.roles.filter(x => x.id !== r.id); EM.rerender(); } catch (x) { EM.toast(esc(x.message)); } };
/* View as this person: their own data, menu and dashboard, view only, until Back to me */
EM.ACTIONS['view-as'] = async el => {
  try { const fresh = await API('GET', '/api/bootstrap?as=' + encodeURIComponent(el.dataset.id)); Object.assign(D, fresh); EM.div = D.user.division === 'both' ? 'both' : D.user.division; location.hash = '#/home'; EM.rerender(); }
  catch (x) { EM.toast(esc(x.message)); }
};
EM.ACTIONS['view-back'] = async () => { const fresh = await API('GET', '/api/bootstrap'); Object.assign(D, fresh); EM.div = D.user.division === 'both' ? 'both' : D.user.division; location.hash = '#/team'; EM.rerender(); };
const genPass = () => { const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const b = crypto.getRandomValues(new Uint8Array(12)); return Array.from(b, x => a[x % a.length]).join(''); };
const STAFF_MOBILE = { key: 'mobile', label: 'Mobile', type: 'mobile' };
function openStaffForm(s) {
  const roles = D.roles.filter(r => isOwner() || !['owner', 'director'].includes(r.id));
  EM.modal(`<h2>${s ? 'Edit ' + esc(s.name) : 'Add a person'}</h2><form id="sf" class="stack" onsubmit="return false" style="margin-top:14px"><div class="fgrid">
    <div class="field"><label for="sf-name">Full name *</label><input class="input" id="sf-name" name="name" value="${esc(s ? s.name : '')}"></div>
    ${s ? '' : `<div class="field"><label for="sf-login">Username *</label><input class="input" id="sf-login" name="login" autocapitalize="none" placeholder="e.g. priya.sales"></div>
    <div class="field"><label for="sf-pass">Temporary password *</label><div class="mob"><input class="input" id="sf-pass" name="password" value="${genPass()}"><button class="btn sm" type="button" data-act="staff-gen">New</button></div><span class="small muted">They choose their own at first sign-in.</span></div>`}
    <div class="field"><label for="sf-role">Role *</label><select class="input" id="sf-role" name="role">${roles.map(r => `<option value="${r.id}" ${s && s.role === r.id ? 'selected' : ''}>${esc(r.name)} · ${divName(r.division)}</option>`).join('')}</select></div>
    <div class="field"><label for="sf-region">Region *</label><select class="input" id="sf-region" name="region"><option value="">Choose</option>${REGIONS.map(x => `<option ${s && s.region === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    ${fieldHtml(STAFF_MOBILE, s ? s.mobile : '', 'sf')}
    <div class="field"><label for="sf-email">Email</label><input class="input" id="sf-email" name="email" type="email" value="${esc(s ? s.email : '')}"></div>
    <div class="field"><label for="sf-rep">Reports to *</label><select class="input" id="sf-rep" name="reports_to"><option value="">Choose their manager</option>${D.staff.filter(x => x.active && (!s || x.id !== s.id)).map(x => `<option value="${x.id}" ${s && s.reports_to === x.id ? 'selected' : ''}>${esc(x.name)} · ${esc(roleName(x.role))}</option>`).join('')}</select></div>
    <p class="small muted span2">Region and Reports to are compulsory for everyone except the Owner, a Director and the CRM Administrator. A person sees their own records; their manager sees theirs too, and so on up the line.</p></div>
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

/* ---------------------------------------------------------------- lists & stages (Owner)
   Every list and stage set the app uses, each edited on its own: rename in place (the
   records holding the old name follow), move up or down, add, remove. A value that
   saved records still use cannot be removed; the server says how many use it. */
const LISTS_UI = () => [
  ['Sales stages', 'The stages of each opportunity board. Any item can be locked or unlocked. ⚙ marks the stages that run the processing (where the sale is won and fulfilment starts, Lost, and where the credit limit is checked): unlock them to rename them; they cannot be removed.', Object.keys(PIPELINES).map(p => [`stages.${p}`, PIPELINES[p].label])],
  ...(typeof OPS_LIST_GROUP === 'function' ? [OPS_LIST_GROUP()] : []),
  ...LIST_GROUPS.map(([t, ls]) => [t, '', ls]),
  ['Places', 'A city belongs to a region; the region decides which regional manager sees a record.', [['cities', 'Cities and their regions']]],
];
const listItems = key => key.startsWith('stages.') ? D.lists.stages[key.slice(7)] : key.startsWith('ops.') ? (D.lists.ops || {})[key.slice(4)] || [] : key === 'cities' ? D.lists.cities : D.lists[key] || [];
EM.listOpen = EM.listOpen || '';
EM.VIEWS.lists = () => {
  if (!D.access.can_lists) return EM.noAccess('Your role does not edit the lists and stages.');
  return `<div class="stack"><div class="stack-s"><h1>Lists &amp; stages</h1><p class="muted" style="max-width:780px">Every dropdown and every stage in EGO Master comes from here. Rename an item and every record that has it changes too. Move items up or down to change their order in the dropdowns and on the boards. An item that saved records still use cannot be removed: rename it, or change those records first.</p></div>
    <section class="stack-s"><h3>Rules and numbers</h3><p class="small muted">GST, production quantities, when an order is overdue, approval limits, Priority 200 levels and weights.</p>
      <div class="grid g3"><button class="card stack-s" style="text-align:left;cursor:pointer" data-act="rules-open"><b>Rules and numbers</b><span class="small muted">GST ${D.lists.rules.gst_pct}% · MOQ ${D.lists.rules.moq_boxes} boxes · ${Object.keys(D.lists.rules.approvals).length} approval limits · ${D.lists.rules.p200.tiers.length} Priority 200 levels</span></button></div></section>
    ${LISTS_UI().map(([title, note, ls]) => `<section class="stack-s"><h3>${esc(title)}</h3>${note ? `<p class="small muted">${esc(note)}</p>` : ''}
      <div class="grid g3">${ls.map(([k, l]) => { const it = listItems(k); return `<button class="card stack-s" style="text-align:left;cursor:pointer" data-act="list-open" data-key="${esc(k)}"><b>${esc(l)}</b><span class="small muted">${it.length} · ${esc((k === 'cities' ? it.map(c => c.city) : it).slice(0, 4).join(', '))}${it.length > 4 ? '…' : ''}</span>${locksOf(D.lists, k).length ? `<span class="small">🔒 ${locksOf(D.lists, k).filter(x => (k === 'cities' ? it.map(c => c.city) : it).includes(x)).length} locked</span>` : ''}</button>`; }).join('')}</div></section>`).join('')}</div>`;
};
EM.VIEWS.lists.title = () => 'Lists & stages';
const listLabel = key => LISTS_UI().flatMap(([, , ls]) => ls).find(([k]) => k === key)?.[1] || key;
/* one row: a lock switch, the name (read-only while locked), move up and down, remove.
   A row with a role (it runs the processing) shows ⚙ and can be renamed once unlocked, never removed. */
const listRow = (key, v, i) => {
  const name = key === 'cities' ? (v ? v.city : '') : (v || ''), locked = !!v && isLocked(key, name), role = !!v && isRole(key, name);
  return `<div class="row lrow${locked ? ' is-locked' : ''}" data-from="${esc(name)}" data-role="${role ? 1 : ''}"><span class="small muted" style="width:22px">${i + 1}</span>
    <button class="btn sm ghost lock" data-act="lrow-lock" aria-pressed="${locked}" aria-label="${locked ? 'Locked: press to unlock' : 'Unlocked: press to lock'}" title="${locked ? 'Locked: press to unlock' : 'Unlocked: press to lock'}">${locked ? '🔒' : '🔓'}</button>
    <input class="input" data-l="to" value="${esc(name)}" aria-label="${key === 'cities' ? 'City' : 'Item'}" style="flex:1"${locked ? ' readonly' : ''}>
    ${key === 'cities' ? `<select class="input" data-l="region" aria-label="Region" style="width:130px"${locked ? ' disabled' : ''}>${REGIONS.map(r => `<option ${v && v.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select>` : ''}
    ${role ? '<span title="Runs the processing: it can be renamed when unlocked, never removed" aria-label="Runs the processing">⚙</span>' : ''}
    <button class="btn sm ghost" data-act="lrow-up" aria-label="Move up">↑</button><button class="btn sm ghost" data-act="lrow-down" aria-label="Move down">↓</button>
    <button class="btn sm ghost" data-act="lrow-del" aria-label="Remove"${locked || role ? ' hidden' : ''}>✕</button></div>`;
};
const isLocked = (key, v) => locksOf(D.lists, key).includes(v);
const isRole = (key, v) => roleNames(D.lists, key).includes(v);
EM.ACTIONS['lrow-lock'] = el => {
  const r = el.closest('.lrow'), lock = !r.classList.contains('is-locked');
  r.classList.toggle('is-locked', lock);
  el.textContent = lock ? '🔒' : '🔓'; el.setAttribute('aria-pressed', String(lock)); el.title = el.ariaLabel = lock ? 'Locked: press to unlock' : 'Unlocked: press to lock';
  r.querySelector('[data-l="to"]').readOnly = lock;
  const rg = r.querySelector('[data-l="region"]'); if (rg) rg.disabled = lock;
  r.querySelector('[data-act="lrow-del"]').hidden = lock || !!r.dataset.role;
};
EM.ACTIONS['list-open'] = el => {
  const key = el.dataset.key, it = listItems(key);
  EM.modal(`<h2>${esc(listLabel(key))}</h2><p class="muted small">🔒 locked: it cannot be renamed or removed. Press the lock to unlock it, then type over it to rename it; the records that have it follow. ↑ ↓ change the order. ✕ removes it (only if nothing uses it). ⚙ runs the processing: it can be renamed once unlocked, never removed. Press Save to keep the changes, locks included.</p>
    <div id="lrows" class="stack-s" style="margin-top:12px" data-key="${esc(key)}">${it.map((v, i) => listRow(key, v, i)).join('')}</div>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-act="lrow-add">+ Add</button></div>${errBox('l-err')}
    <div class="row sticky-actions" style="margin-top:12px"><button class="btn primary" data-act="list-save">Save</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
const renumber = () => document.querySelectorAll('#lrows .lrow').forEach((r, i) => { r.firstElementChild.textContent = i + 1; });
EM.ACTIONS['lrow-add'] = () => { const box = qs('#lrows'); box.insertAdjacentHTML('beforeend', listRow(box.dataset.key, null, box.children.length)); box.lastElementChild.querySelector('input').focus(); };
EM.ACTIONS['lrow-del'] = el => { el.closest('.lrow').remove(); renumber(); };
EM.ACTIONS['lrow-up'] = el => { const r = el.closest('.lrow'); if (r.previousElementSibling) r.parentNode.insertBefore(r, r.previousElementSibling); renumber(); };
EM.ACTIONS['lrow-down'] = el => { const r = el.closest('.lrow'); if (r.nextElementSibling) r.parentNode.insertBefore(r.nextElementSibling, r); renumber(); };
EM.ACTIONS['list-save'] = async el => {
  const box = qs('#lrows'), key = box.dataset.key;
  const items = [...box.querySelectorAll('.lrow')].map(r => ({ from: r.dataset.from || null, to: r.querySelector('[data-l="to"]').value.trim(), city: r.querySelector('[data-l="to"]').value.trim(), region: (r.querySelector('[data-l="region"]') || {}).value, locked: r.classList.contains('is-locked') })).filter(i => i.to);
  const before = listItems(key).map(v => key === 'cities' ? v.city : v);
  const changes = items.some(i => i.from && i.from !== i.to) || before.some(v => !items.some(i => i.from === v));
  if (!changes) return saveListNow(el, key, items, true);
  /* a rename or a removal touches other things: show what, and ask before anything is saved */
  busy(el, true);
  let imp;
  try { imp = (await API('POST', '/api/lists/' + encodeURIComponent(key), { items, dry: true })).impact; } catch (x) { busy(el, false); return showErr('l-err', x.message); }
  EM._pendingList = { key, items };
  const T = { follow_ups: 'follow-ups', opportunities: 'opportunities', clients: 'dealers, architects and people', contacts: 'people in teams', orders: 'fulfilments', production_orders: 'production orders', sites: 'installation sites', complaints: 'complaints', snags: 'snags', collections: 'collections', products: 'designs' };
  const rec = r => Object.entries(r).map(([t, n]) => `${n} ${T[t] || t}`).join(', ') || 'no saved record';
  EM.modal(`<h2>Before saving: what this change touches</h2><p class="muted small">${esc(listLabel(key))}</p>
    <div class="stack-s" style="margin-top:12px" data-impact>
      ${imp.renames.map(r => `<div class="callout"><b>"${esc(r.from)}" becomes "${esc(r.to)}"</b><br><span class="small">Saved records with it: ${esc(rec(r.records))}.${r.role ? ' It runs the processing; the processing follows the new name.' : ''}</span></div>`).join('')}
      ${imp.removes.map(r => `<div class="callout warn"><b>"${esc(r.value)}" is removed</b><br><span class="small">${Object.keys(r.records).length ? `Still used by ${esc(rec(r.records))}: it will be refused.` : 'Nothing uses it.'}</span></div>`).join('')}
      ${imp.board ? `<p class="small"><b>Screens:</b> ${esc(imp.board)}.</p>` : ''}
      ${imp.files.length ? `<p class="small"><b>Excel files:</b> ${imp.files.map(esc).join('; ')}. Downloads from now on carry the new list; a file already filled with the old name is refused for that column until it is re-typed.</p>` : ''}
      <p class="small"><b>Automations:</b> ${esc(imp.automations)}</p></div>
    ${errBox('li-err')}
    <div class="row sticky-actions" style="margin-top:12px;flex-wrap:wrap">${imp.renames.length ? `<button class="btn primary" data-act="list-go" data-prop="1">Change them too</button><button class="btn" data-act="list-go" data-prop="0">Only here, I will change the rest by hand</button>` : `<button class="btn primary" data-act="list-go" data-prop="1">Save</button>`}<button class="btn ghost" data-act="list-back">Back</button></div>`);
};
EM.ACTIONS['list-go'] = el => { const P = EM._pendingList; if (P) saveListNow(el, P.key, P.items, el.dataset.prop === '1', 'li-err'); };
EM.ACTIONS['list-back'] = () => { const P = EM._pendingList; if (P) { EM.ACTIONS['list-open']({ dataset: { key: P.key } }); } };
async function saveListNow(el, key, items, propagate, errId = 'l-err') {
  busy(el, true);
  try {
    const r = await API('POST', '/api/lists/' + encodeURIComponent(key), { items, propagate });
    D.lists = r.lists; EM.closeModal(); EM._pendingList = null;
    EM.toast(`<b>${esc(listLabel(key))} saved</b>${r.renamed ? `<ul><li>${propagate ? `${r.renamed} renamed, ${r.records} record${r.records === 1 ? '' : 's'} changed with it` : `${r.renamed} renamed here only; the records are in the bell to change by hand`}</li></ul>` : ''}`);
    if (r.records) { const fresh = await API('GET', '/api/bootstrap'); window.EGOLIVE.refresh(fresh); } else EM.rerender();
    loadNotifs();
  } catch (x) { busy(el, false); showErr(errId, x.message); }
}

/* ---------------------------------------------------------------- notifications: the bell
   Internal: the system end to end (added, changed with impact, failing, waiting, low, overdue).
   External: anything arriving from outside (leads, WhatsApp, email, Tally). Heads-ups that are
   true right now come with every load; recorded ones are unread until marked read. */
EM.notif = EM.notif || { live: [], internal: [], external: [], sources: [], seen_at: '' };
const unreadN = () => { const N = EM.notif; return N.live.length + [...N.internal, ...N.external].filter(n => n.created_at > (N.seen_at || '')).length; };
const BELL_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
const bellHtml = () => { const n = unreadN(); return `<button class="iconbtn bell" data-act="notif-open" aria-haspopup="dialog" aria-label="Notifications${n ? `, ${n} need attention` : ''}">${BELL_SVG}<i class="nbadge" data-bell-n ${n ? '' : 'hidden'}>${n}</i></button>`; };
EM.brandExtras = bellHtml;
async function loadNotifs() {
  try { EM.notif = await API('GET', '/api/notifications'); } catch (x) { return; }
  const b = qs('[data-bell-n]'), n = unreadN();
  if (b) { b.textContent = n; b.hidden = !n; }
  refreshPop();
  if (location.hash.startsWith('#/notifications')) EM.rerender();
}
const LV = { action: ['Needs you', 'warn'], warn: ['Heads-up', 'warn'], error: ['Not working', 'bad'], info: ['Done', 'info'] };
const notifRow = (n, isNew) => `<a class="np-item${isNew ? ' is-new' : ''}" href="${esc(n.link || '#/notifications')}" data-notif><span class="np-dot ${LV[n.level][1]}" aria-hidden="true"></span><span class="np-text"><span class="np-title">${esc(n.title)}</span>${n.body ? `<span class="np-body">${esc(n.body)}</span>` : ''}<span class="np-meta">${LV[n.level][0]} · ${n.created_at ? ds(n.created_at.slice(0, 10)) + ' ' + n.created_at.slice(11, 16) + (n.by_name ? ' · ' + esc(n.by_name) : '') : 'right now'}${isNew ? ' · new' : ''}</span></span></a>`;
function notifBody(tab) {
  const N = EM.notif, seen = N.seen_at || '';
  if (tab === 'external') return `<p class="np-note">Leads and messages that arrive from outside EGO Master.</p>${N.external.map(n => notifRow(n, n.created_at > seen)).join('')}${N.sources.map(([a, b, st, last]) => `<div class="np-src"><span>${esc(a)}</span><span class="badge ${st === 'live' ? 'ok' : st === 'keys' ? 'info' : 'warn'}">${esc(b)}${last ? ' · ' + esc(whenIST(last)) : ''}</span></div>`).join('')}`;
  return `${N.live.length ? `<div class="np-head">Right now</div>${N.live.map(n => notifRow(n, false)).join('')}` : ''}<div class="np-head">Recorded</div>${N.internal.length ? N.internal.map(n => notifRow(n, n.created_at > seen)).join('') : '<p class="np-note">Nothing yet.</p>'}`;
}
const notifTabs = tab => { const N = EM.notif, ni = N.live.length + N.internal.filter(n => n.created_at > (N.seen_at || '')).length, ne = N.external.filter(n => n.created_at > (N.seen_at || '')).length;
  return `<div class="np-tabs" role="tablist">${[['internal', 'Internal', ni], ['external', 'External', ne]].map(([k, l, c]) => `<button class="np-tab${k === tab ? ' on' : ''}" role="tab" aria-selected="${k === tab}" data-act="notif-tab" data-tab="${k}">${l}${c ? `<i>${c}</i>` : ''}</button>`).join('')}</div>`; };
EM.notifTab = 'internal';
/* the pop-up: a small panel under the bell, not a page */
const popHtml = () => `<div class="np-top"><b>Notifications</b><a class="np-link" href="#/notifications" data-act="notif-close">Full page</a></div>${notifTabs(EM.notifTab)}<div class="np-list" id="notif-list">${notifBody(EM.notifTab)}</div><div class="np-foot"><button class="np-link" data-act="notif-seen">Mark all as read</button></div>`;
function placePop() {
  const pop = qs('#notif-pop'), bell = qs('.bell'); if (!pop || !bell) return;
  const r = bell.getBoundingClientRect(), w = Math.min(380, window.innerWidth - 16);
  pop.style.width = w + 'px'; pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + 'px'; pop.style.top = (r.bottom + 8) + 'px';
}
EM.ACTIONS['notif-open'] = () => {
  if (qs('#notif-pop')) return EM.ACTIONS['notif-close']();
  const pop = document.createElement('div'); pop.id = 'notif-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Notifications'); pop.innerHTML = popHtml();
  document.body.appendChild(pop); placePop(); loadNotifs();
};
EM.ACTIONS['notif-close'] = () => { const p = qs('#notif-pop'); if (p) p.remove(); };
const refreshPop = () => { const p = qs('#notif-pop'); if (p) { p.innerHTML = popHtml(); placePop(); } };
EM.ACTIONS['notif-tab'] = el => { EM.notifTab = el.dataset.tab; if (location.hash.startsWith('#/notifications')) return EM.rerender(); refreshPop(); };
EM.ACTIONS['notif-seen'] = async () => { try { await API('POST', '/api/notifications/seen'); } catch (x) { } await loadNotifs(); refreshPop(); if (location.hash.startsWith('#/notifications')) EM.rerender(); };
document.addEventListener('click', e => { const p = qs('#notif-pop'); if (p && !p.contains(e.target) && !e.target.closest('.bell')) p.remove(); if (p && e.target.closest('[data-notif]')) p.remove(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') EM.ACTIONS['notif-close'](); });
window.addEventListener('resize', placePop);
EM.VIEWS.notifications = () => `<div class="stack" style="max-width:760px"><div class="row between"><div class="stack-s"><h1>Notifications</h1><p class="muted">Internal: the system end to end. External: what arrives from outside.</p></div><button class="btn" data-act="notif-seen">Mark all as read</button></div>${notifTabs(EM.notifTab)}<div class="np-list np-page">${notifBody(EM.notifTab)}</div></div>`;
EM.VIEWS.notifications.title = () => 'Notifications';
EM.VIEWS.notifications.tab = 'home';
/* a screen that fails in someone's browser is reported to the Internal feed */
let lastReport = 0;
window.EGOREPORT = (err, where) => { if (Date.now() - lastReport < 10000) return; lastReport = Date.now(); API('POST', '/api/notifications/error', { message: String((err && err.message) || err).slice(0, 300), where: where || location.hash }).catch(() => {}); };
window.addEventListener('error', e => window.EGOREPORT(e.error || e.message));
window.addEventListener('unhandledrejection', e => window.EGOREPORT(e.reason));
setTimeout(loadNotifs, 300);
setInterval(loadNotifs, 60000);

/* ---------------------------------------------------------------- Orders: every order, live and old
   The boards show only what is live (a closed sale or a delivered order stays until the end of
   its month). Orders keeps every one, from any month or year, with its whole story: each stage
   with date, time and who; who gave it, who closed it, who processed it; the designs, the
   warehouses, production and dispatch. Each order also shows on the company's page. */
const ymIST = ts => ts ? new Date(Date.parse(ts.endsWith('Z') || ts.includes('+') ? ts : ts.replace(' ', 'T') + 'Z') + 5.5 * 36e5).toISOString().slice(0, 7) : '';
const thisMonth = ts => !!ts && ymIST(ts) === ymIST(new Date().toISOString());
const stageAt = (orderId, stage) => { const l = (OPSD().logs || []).filter(x => x.record_id === orderId && x.to_stage === stage).pop(); return l ? l.at : ''; };
const whenTxt = ts => ts ? `${ds(ts.slice(0, 10))} ${new Date(Date.parse(ts.endsWith('Z') ? ts : ts.replace(' ', 'T') + 'Z') + 5.5 * 36e5).toISOString().slice(11, 16)}` : '';
/* one list of every order: a wholesale sale (its fulfilment) or a won retail sale (its installation) */
function buildOrders() {
  const O = OPSD(), FS = OS_('fulfilment_stages'), out = [];
  for (const o of O.orders) {
    const opp = oppOf(o) || {}, h = D.history.filter(x => x.opp_id === o.opp_id), won = h.filter(x => x.to_stage === wonStage('wholesale', D.lists)).pop(), logs = (O.logs || []).filter(l => l.record_id === o.id);
    out.push({ id: o.id, kind: 'Wholesale', ref: o.ref, title: opp.title || o.notes || '', client_id: o.client_id, contact_id: opp.contact_id || '', opp_id: o.opp_id, value: o.total,
      won_at: (won && won.at) || o.created_at, closed_by: won ? won.by_staff : o.created_by, processed_by: [...new Set(logs.map(l => l.by_staff).filter(Boolean))], owner_id: o.owner_id,
      stage: o.ful_stage, done_at: stageAt(o.id, lastOf(FS)), done: o.ful_stage === lastOf(FS), boxes: O.lines.filter(l => l.order_id === o.id).reduce((a, l) => a + l.boxes, 0), href: '#/order/' + o.id });
  }
  /* R3b: a Big E sale in fulfilment is listed from its fulfilment record, where it is on the retail ladder */
  for (const o of OPSD().rorders) {
    const opp = oppOf(o) || {}, won = D.history.filter(x => x.opp_id === o.opp_id && x.to_stage === opp.stage).pop(), logs = (O.logs || []).filter(l => l.record_id === o.id);
    out.push({ id: o.id, kind: 'Retail', ref: o.ref, title: opp.title || o.notes || '', client_id: o.client_id, contact_id: opp.contact_id || '', opp_id: o.opp_id, value: o.total,
      won_at: (won && won.at) || o.created_at, closed_by: won ? won.by_staff : o.created_by, processed_by: [...new Set(logs.map(l => l.by_staff).filter(Boolean))], owner_id: o.owner_id,
      stage: o.ful_stage, done_at: stageAt(o.id, lastOf(RETAIL_FUL)), done: o.ful_stage === lastOf(RETAIL_FUL), boxes: null, href: '#/order/' + o.id });
  }
  const inRf = new Set(OPSD().rorders.map(o => o.opp_id));
  for (const p of Object.keys(PIPELINES).filter(k => !PIPELINES[k].lines)) for (const opp of D.opportunities.filter(x => x.pipeline === p && x.stage === wonStage(p, D.lists) && !inRf.has(x.id))) {
    const h = D.history.filter(x => x.opp_id === opp.id), won = h.filter(x => x.to_stage === opp.stage).pop(), sites = O.sites.filter(x => x.opp_id === opp.id), SS = OS_('site_steps');
    const last = sites.map(x => x.step).sort((a, b) => SS.indexOf(a) - SS.indexOf(b))[0];
    out.push({ id: opp.id, kind: 'Retail', ref: opp.ref, title: opp.title, client_id: opp.client_id, contact_id: opp.contact_id || '', opp_id: opp.id, value: opp.value,
      won_at: (won && won.at) || opp.closed_at || opp.updated_at, closed_by: won ? won.by_staff : opp.owner_id, processed_by: [...new Set(sites.map(x => x.owner_id))], owner_id: opp.owner_id,
      stage: sites.length ? last : 'Won, no site yet', done_at: sites.length && sites.every(x => x.actual_end) ? sites.map(x => x.actual_end).sort().pop() : '', done: !!(sites.length && sites.every(x => x.actual_end)), boxes: null, href: '#/opp/' + opp.id });
  }
  return out.sort((a, b) => (b.won_at || '').localeCompare(a.won_at || ''));
}
const givenBy = x => { const c = CL()[x.client_id] || {}, k = D.contacts.find(y => y.id === x.contact_id), arch = c.architect_id && CL()[c.architect_id];
  return `<a href="#/client/${x.client_id}">${esc(c.name || 'Outside your view')}</a> <span class="small muted">${esc(kindLabel(c.kind || ''))}</span>${k ? `<div class="small">${esc(k.name)}${k.designation ? ' · ' + esc(k.designation) : ''}</div>` : ''}${arch ? `<div class="small muted">Architect: ${esc(arch.name)}</div>` : ''}`; };
EM.ob = EM.ob || { period: 'all', from: '', to: '', seg: '', kind: '', state: '', q: '' };
/* THE date filter: every list filtered by a date uses this one, and it always offers Custom dates (4 Oct) */
const PERIODS = [['all', 'All time'], ['today', 'Today'], ['month', 'This month'], ['last', 'Last month'], ['year', 'This financial year'], ['lastyear', 'Last financial year'], ['custom', 'Custom dates']];
const dayIST = ts => ts ? new Date(Date.parse(ts.endsWith('Z') || ts.includes('+') ? ts : ts.replace(' ', 'T') + 'Z') + 5.5 * 36e5).toISOString().slice(0, 10) : '';
function dateFilter(st, key, label) {   // st: the screen's filter state; key: which re-render it belongs to
  const custom = st.period === 'custom';
  return `<label class="field" style="min-width:170px"><span class="small muted">${esc(label)}</span><select class="input" data-df="${key}" data-dfk="period" data-keep-order>${PERIODS.map(([v, l]) => `<option value="${v}" ${st.period === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
    ${custom ? `<label class="field" style="min-width:150px"><span class="small muted">From</span><input class="input" type="date" data-df="${key}" data-dfk="from" value="${esc(st.from || '')}" aria-label="From date"></label><label class="field" style="min-width:150px"><span class="small muted">To</span><input class="input" type="date" data-df="${key}" data-dfk="to" value="${esc(st.to || '')}" aria-label="To date"></label>` : ''}`;
}
const DF_STATE = { ob: () => EM.ob, co: () => EM.co, lost: () => EM.lostF };
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.df; if (!k || !DF_STATE[k]) return; DF_STATE[k]()[e.target.dataset.dfk] = e.target.value; EM.rerender(); });
function inPeriod(ts, p, from, to) {
  if (p === 'all') return true; if (!ts) return false;
  if (p === 'custom') { const d = dayIST(ts); return (!from || d >= from) && (!to || d <= to); }
  if (p === 'today') return dayIST(ts) === dayIST(new Date().toISOString());
  const ym = ymIST(ts), now = ymIST(new Date().toISOString()), [y, m] = now.split('-').map(Number), fy = m >= 4 ? y : y - 1;
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  if (p === 'month') return ym === now; if (p === 'last') return ym === prev;
  if (p === 'year') return ym >= `${fy}-04` && ym <= `${fy + 1}-03`; if (p === 'lastyear') return ym >= `${fy - 1}-04` && ym <= `${fy}-03`;
  return true;
}
EM.VIEWS.orderbook = () => {
  const f = EM.ob, all = buildOrders();
  const segOf = x => x.kind === 'Wholesale' ? 'wholesale' : 'retail';
  const rows = all.filter(x => (EM.div === 'both' || segOf(x) === EM.div) && (!f.seg || segOf(x) === f.seg) && inPeriod(x.won_at, f.period, f.from, f.to) && (!f.kind || x.kind === f.kind || (f.kind === 'dealer' && DEALER_KINDS.includes((CL()[x.client_id] || {}).kind)) || (f.kind === 'architect' && ARCH_KINDS.includes((CL()[x.client_id] || {}).kind)) || (f.kind === 'personal' && PERSONAL_KINDS.includes((CL()[x.client_id] || {}).kind)))
    && (!f.state || (f.state === 'done' ? x.done : !x.done)) && (!f.q || `${x.ref} ${x.title} ${clientName(x.client_id)}`.toLowerCase().includes(f.q.toLowerCase())));
  const sel = (k, label, opts) => `<label class="field" style="min-width:170px"><span class="small muted">${label}</span><select class="input" data-ob="${k}">${opts.map(([v, l]) => `<option value="${v}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  return `<div class="stack"><div class="stack-s"><div class="kicker">Every order, live and old</div><h1>Orders</h1><p class="muted" style="max-width:760px">Every sale that was won, whenever it was: where it is now, when each stage happened and who moved it, who gave it, who closed it and who processed it. The boards show only what is live; this keeps everything.</p></div>
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end">${dateFilter(f, 'ob', 'When it was won')}${EM.div === 'both' ? sel('seg', 'Company', [['', 'EGO Premium and Big E'], ['wholesale', 'EGO Premium (wholesale)'], ['retail', 'Big E (retail)']]) : ''}${sel('kind', 'From', [['', 'Everyone'], ['dealer', 'Dealers'], ['architect', 'Architects'], ['personal', 'Personal contacts']])}${sel('state', 'Where it is', [['', 'Live and done'], ['live', 'Still live'], ['done', 'Delivered or completed']])}
      <label class="field" style="flex:1;min-width:200px"><span class="small muted">Search</span><input class="input" id="obq" value="${esc(f.q)}" placeholder="Order number, sale or company"></label></div>
    <div class="grid g4">${tile('Orders', rows.length)}${tile('Still live', rows.filter(x => !x.done).length)}${tile('Delivered or completed', rows.filter(x => x.done).length)}${D.access.prices ? tile('Value', inr0(rows.reduce((a, x) => a + (Number(x.value) || 0), 0))) : ''}</div>
    ${rows.length ? table(['Order', 'Won on', 'Given by', ...(D.access.prices ? ['Value'] : []), 'Where it is now', 'Closed by', 'Processed by', 'Delivered or completed'], rows.slice(0, 500).map(x => ({ href: x.href,
      cells: [`<b>${esc(x.ref || '')}</b><div class="small">${esc(x.title)}</div>${segBadge(x.kind === 'Wholesale' ? 'wholesale' : 'retail')}`, whenTxt(x.won_at), givenBy(x), ...(D.access.prices ? [inr0(x.value)] : []),
        `<span class="badge ${x.done ? 'ok' : 'info'}">${esc(x.stage)}</span>`, esc(staffName(x.closed_by)), esc(x.processed_by.map(staffName).join(', ')) || '<span class="muted">Not started</span>', x.done_at ? whenTxt(x.done_at) : ''] })))
      + (rows.length > 500 ? `<p class="small muted">Showing 500 of ${rows.length}. Use the filters.</p>` : '')
      : empty('No orders for this filter', 'An order appears here when a sale is won: a wholesale sale at its won stage, a retail sale when won.')}</div>`;
};
EM.VIEWS.orderbook.title = () => 'Orders';
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.ob; if (k) { EM.ob[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'obq') { EM.ob.q = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#obq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
/* one order's whole story: the sale stages and the fulfilment stages, each with date, time and who */
function orderStory(o) {
  const x = buildOrders().find(y => y.id === o.id) || {}, opp = oppOf(o);
  const sale = D.history.filter(h => h.opp_id === o.opp_id).map(h => ({ at: h.at, part: 'Sale', from: h.from_stage, to: h.to_stage, by: h.by_staff, note: h.note }));
  const ful = (OPSD().logs || []).filter(l => l.record_id === o.id).map(l => ({ at: l.at, part: 'Fulfilment', from: l.from_stage, to: l.to_stage, by: l.by_staff, note: l.note }));
  const story = [...sale, ...ful].sort((a, b) => (a.at || '').localeCompare(b.at || ''));
  return `<div class="grid g2"><section class="card stack-s" data-people><h3>Who</h3>${kv([['Given by', givenBy(x)], ['Looked after by', esc(staffName(o.owner_id))], ['Closed by', esc(staffName(x.closed_by)) + (x.won_at ? ` <span class="small muted">${whenTxt(x.won_at)}</span>` : '')], ['Processed by', esc((x.processed_by || []).map(staffName).join(', ')) || NOTSET], ['Delivered', x.done_at ? whenTxt(x.done_at) : NOTSET]])}${opp ? `<a class="btn sm" href="#/opp/${opp.id}">The sale: ${esc(opp.title)}</a>` : ''}</section>
    <section class="card stack-s" data-story><h3>The whole story</h3>${story.length ? table(['When', 'Part', 'Stage', 'By', 'Note'], story.map(e => [whenTxt(e.at), esc(e.part), `${e.from ? `<span class="muted">${esc(e.from)} →</span> ` : ''}<b>${esc(e.to)}</b>`, esc(staffName(e.by)), esc(e.note || '')])) : '<p class="small muted">Nothing yet.</p>'}</section></div>`;
}
/* a company's or a person's orders, with the totals */
EM.co = EM.co || { period: 'all', from: '', to: '' };
function clientOrders(c) {
  const f = EM.co, rows = buildOrders().filter(x => x.client_id === c.id && inPeriod(x.won_at, f.period, f.from, f.to)), done = rows.filter(x => x.done), fy = rows.filter(x => inPeriod(x.won_at, 'year')), sum = a => a.reduce((t, x) => t + (Number(x.value) || 0), 0);
  return `<div class="stack-s"><div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-end">${dateFilter(f, 'co', 'When it was won')}</div><div class="grid g4">${tile('Orders', rows.length)}${tile('This financial year', fy.length, D.access.prices && fy.length ? inr0(sum(fy)) : '')}${tile('Delivered or completed', done.length)}${D.access.prices ? tile('All-time value', inr0(sum(rows))) : ''}</div>
    ${rows.length ? table(['Order', 'Won on', 'Brought by', ...(D.access.prices ? ['Value'] : []), 'Where it is now', 'Closed by', 'Delivered or completed'], rows.map(x => ({ href: x.href, cells: [`<b>${esc(x.ref || '')}</b><div class="small">${esc(x.title)}</div>`, whenTxt(x.won_at), esc((D.contacts.find(k => k.id === x.contact_id) || {}).name || ''), ...(D.access.prices ? [inr0(x.value)] : []), `<span class="badge ${x.done ? 'ok' : 'info'}">${esc(x.stage)}</span>`, esc(staffName(x.closed_by)), x.done_at ? whenTxt(x.done_at) : ''] })))
      : `<p class="small muted">No orders from ${esc(c.name)} yet. Every won sale shows here, live and old.</p>`}</div>`;
}
/* ---------------------------------------------------------------- mistakes, shown where they are
   A message that names a field ("Mobile has 9 digits") is put in a small bubble just above that
   field, which turns red; the person sees the mistake where it is. A message that names no field
   stays under the form. A refused action ("waiting for approval") pops up above the button pressed. */
const ALL_FIELDS = () => [...CLIENT_FIELDS, ...CONTACT_FIELDS, ...OPP_FIELDS, ...COLLECTION_FIELDS, ...PRODUCT_FIELDS, ...WAREHOUSE_FIELDS];
function markFieldErrors(root, msgs) {
  root.querySelectorAll('.ferr').forEach(x => x.remove()); root.querySelectorAll('.field.has-err').forEach(x => x.classList.remove('has-err'));
  const left = [];
  let first = null;
  for (const m0 of msgs) {
    let scope = root, m = m0;
    const pre = m.match(/^(Point of contact|Person (\d+)|Design line (\d+)|Warehouse line (\d+)): ?/i);
    if (pre) {
      m = m.slice(pre[0].length);
      if (/^Point of contact/i.test(pre[1])) scope = root.querySelector('#pocf') || root;
      else if (pre[2]) scope = root.querySelectorAll('#ppl .pf-row')[Number(pre[2]) - 2] || root;
      else if (pre[3]) scope = root.querySelectorAll('#olines .ordline')[Number(pre[3]) - 1] || root;
      else if (pre[4]) scope = root.querySelectorAll('#slines .stockline')[Number(pre[4]) - 1] || root;
    }
    const low = m.toLowerCase(), cands = [];
    for (const fe of scope.querySelectorAll('.field[data-field]')) {
      const key = fe.dataset.field, shown = (fe.querySelector('label') || {}).textContent || '', f = ALL_FIELDS().find(x => x.key === key);
      for (const lab of [shown.replace(/\s*\*$/, ''), f && f.label].filter(Boolean)) if (low.startsWith(lab.toLowerCase() + ' ') || low.startsWith(lab.toLowerCase() + ':')) cands.push([lab.length, fe]);
    }
    if (/^point of contact/i.test(m0) && !cands.length && scope.querySelector('[data-field="mobile"]')) cands.push([1, scope.querySelector('[data-field="mobile"]')]);
    const hit = cands.sort((a, b) => b[0] - a[0])[0];
    if (!hit) { left.push(m0); continue; }
    const fe = hit[1];
    fe.classList.add('has-err');
    fe.insertAdjacentHTML('afterbegin', `<div class="ferr" role="alert">${esc(m.charAt(0).toUpperCase() + m.slice(1))}</div>`);
    if (!first) first = fe;
  }
  if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
  return left;
}
document.addEventListener('input', e => { const fe = e.target.closest && e.target.closest('.field.has-err'); if (fe) { fe.classList.remove('has-err'); const b = fe.querySelector('.ferr'); if (b) b.remove(); } });
/* a refused action: a bubble just above the button that was pressed */
function bubbleNear(el, msg) {
  document.querySelectorAll('.near-err').forEach(x => x.remove());
  if (!el || !el.getBoundingClientRect) return EM.toast(`<b>Not done</b><ul><li>${esc(msg)}</li></ul>`);
  const r = el.getBoundingClientRect(), b = document.createElement('div');
  b.className = 'near-err'; b.setAttribute('role', 'alert'); b.textContent = msg;
  document.body.appendChild(b);
  const w = b.offsetWidth, h = b.offsetHeight;
  b.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
  b.style.top = Math.max(8, r.top - h - 10) + 'px';
  setTimeout(() => b.remove(), 7000);
  b.addEventListener('click', () => b.remove());
}

/* ---------------------------------------------------------------- what is this? (hover for 2 seconds)
   Rest the pointer on a field, a button, a menu item, a stage or a card for two seconds and a
   small note says what it is and what it does. */
const FIELD_HELP = {
  /* R3a */
  partner_capability: 'What this dealer can take on for projects: investment, installation team, areas, past projects.', project_id: 'The project (building or site) this opportunity belongs to.',
  dealer_id: 'The dealer this consumer lead is allocated to. Picking one moves it to Dealer allocated; the dealer sees it in the dealer portal.',
  partner_id: 'The dealer who supplies and serves this project. Only dealers marked Yes or Potential as Project Partner are offered.',
  doc_type: 'What the file is. On an order: PI, Invoice, Payment proof or Other.', doc_name: 'A name to find it by. Left blank, the file name is used.', doc_files: 'Pick or drop one or many files at once: PDF, photos, Word, Excel. Up to 25 MB each, 10 at a time.',
  doc_no: 'The PI or invoice number as it is in Tally. Optional.', doc_date: 'The date on the PI, invoice or payment. Optional.', doc_amount: 'The amount on it, in rupees. Optional; shown only to roles that see money.',
  reject_reason: 'Why the scheme is not approved, in plain words. Whoever drew it up reads this, changes the scheme and sends it again.',
  kind: 'What this record is: distributor, dealer, sub-dealer, architect firm, solo architect or a personal contact. It decides which fields are asked.',
  name: 'The name the team knows it by. For a company, the trading name; the legal name has its own field.',
  client_type: 'For a person with no company: an individual, or what kind of firm (builder, hotel, corporate...). The choices are edited in Lists & stages.',
  mobile: 'The main mobile, with its country code. The same mobile cannot be saved twice in one company (EGO Premium or Big E).',
  whatsapp: 'The WhatsApp number, if it is not the mobile. Messages will go here once WhatsApp is connected.',
  mobile_alt: 'A second number to reach them on.', email: 'Their email address.',
  city: 'The city of the main office. The city decides the region, and the region decides which regional manager sees the record.',
  locality: 'The area or locality inside the city.', pincode: 'The 6-digit pincode.', address: 'The full postal address.',
  areas_covered: 'The cities this company sells in or works in. For a distributor, its assigned area: it answers for the sales there against its target.', other_offices: 'Other offices or branches, by area.',
  owner_id: 'The person at EGO who looks after this record. Field sales and telesales see only the records they look after.',
  source: 'Where this record came from (Meta ads, a walk-in, a referral...). The choices are edited in Lists & stages.',
  status: 'Active, Prospect or Inactive: whether you are doing business with them now.', legal_name: 'The registered name, exactly as on the GST certificate.',
  gst: 'The 15-character GST number. The same GST cannot be saved twice in one company.', parent_id: 'For a sub-dealer: the distributor that serves it. Compulsory, and only a distributor can be chosen. A dealer buys from EGO Premium directly.',
  grade: 'The dealer rating (Platinum, A, B, C). It is shown everywhere the dealer appears and helps decide who gets production first.',
  priority200: 'Yes puts this dealer in Priority 200, the list of dealers EGO develops first. Its score is worked out from saved sales.',
  since: 'The date they started working with EGO.', credit_limit: 'The most they may owe at once. At Invoiced, what is still unpaid on the order plus their other unpaid invoices is checked against it; above it, the order waits for approval.',
  telesales_id: 'The telesales person who calls this dealer.', specialist_id: 'The product specialist who supports this dealer.', contact_every_days: 'How often someone should call or visit, in days.',
  categories: 'The product categories this dealer buys today.', categories_missing: 'Categories they do not buy yet: the chance to sell more.',
  brands_sold: 'Other brands they sell.', competitors: 'The main competitors near them.', customer_types: 'Who this dealer sells to.', project_partner: 'Whether they take on project work with EGO.',
  showroom: 'Whether they have a showroom. A showroom adds to the Priority 200 score.', display_area_sqft: 'The display area in their showroom.', warehouse_sqft: 'Their own warehouse space.',
  dealer_salespeople: 'How many salespeople they have.', own_installers: 'How many installers they have.', service_capable: 'Whether they can install and service on their own.',
  current_business: 'Their yearly business with EGO, as they told you.', target_12m: 'The target for the next 12 months. Priority 200 compares sales with this target, so far this year.',
  potential_3y: 'What they could do with EGO in 3 years.', potential_note: 'A short note on that potential.', firm_id: 'The architect firm this architect belongs to.',
  position: 'The architect\'s position in the firm.', specialisation: 'The kind of projects they specialise in.', focus: 'Residential, corporate, hospitality or retail.', team_size: 'How many people work at the firm.',
  rating: 'The architect rating (A, B, C), if you rate architects.', potential: 'How much business they could bring: high, medium or low.', design500: 'Whether they are in the Design 500 programme.',
  relationship: 'Whether EGO works with them directly or through a dealer.', connected_dealers: 'The dealers they buy through.', architect_id: 'The architect or firm behind this client.',
  campaign: 'The campaign that brought this client.', condition_tag: 'Hot, warm or cold: how likely they are to buy soon.', last_contact: 'When someone last spoke to them.',
  next_action: 'What happens next, in a few words. It shows on Home when it is due.', next_date: 'When the next action is due. Past this date it shows as overdue in the bell.', notes: 'Anything else worth remembering.',
  designation: 'The person\'s role at the company. The choices are edited in Lists & stages.', responsibilities: 'What this person handles, in a few words.', is_primary: 'The main person to talk to at this company. Only one per company.',
  pipeline: 'Which board the opportunity is on: wholesale, retail lead or retail project.', title: 'A short name for this sale.', stage: 'Where the sale stands. The stages are edited in Lists & stages.',
  value: 'The value in rupees. For a wholesale sale it is worked out from its designs, boxes and rate.', products: 'The product categories in this sale.', area_sqft: 'The area in sq ft.',
  application: 'The room or use.', budget: 'The budget band.', contact_id: 'The person at the company who brought this sale.', expected_close: 'When you expect it to close.', lost_reason: 'Why it was lost, from the list. Compulsory at Lost.', lost_detail: 'Exactly what happened, in your words: which design, how many boxes, what the client chose instead. Compulsory at Lost.',
  billing_address: 'The address the invoice goes to.', delivery_address: 'Where the boxes are delivered, if not the billing address.', payment_terms: 'e.g. 50% advance, balance before dispatch.', delivery_terms: 'e.g. ex-warehouse Bhiwandi, or delivered to site.', delivery_time: 'When the client needs it.', terms: 'The terms and conditions printed on the quotation.',
  category: 'The kind of floor: LVT, SPC, Laminate... Categories are added with + Category or in Lists & stages.', sqft_per_box: 'The area one box covers, in sq ft. Fill this or square metres; the other is worked out. Stock in sq ft is worked out from it.',
  sqm_per_box: 'The area one box covers, in square metres. Fill this or sq ft.', pcs_per_box: 'How many planks or tiles are in one box.', low_stock: 'Warn below this many boxes: the bell gives a heads-up when stock drops under it.',
  collection_id: 'The collection this design belongs to; it takes the collection\'s box size and specifications.', code: 'The design code, if it has one. A code can be used only once.',
  sub_type: 'Plank, tile, herringbone, chevron...', image: 'A link to the design\'s photo.',
};
const TYPE_HELP = { mobile: 'A 10-digit mobile; the country code is on the left.', money: 'An amount in rupees.', date: 'Pick the date from the calendar.', select: 'Pick one from the list.', multi: 'Pick one or more from the list.', cats: 'Pick one or more categories.', cities: 'Pick one or more cities.', yesno: 'Yes or No.', number: 'A whole number.', decimal: 'A number; decimals are fine.', email: 'An email address.' };
const ACT_HELP = {
  'fu-up': 'Upload the files chosen above. Each is kept with who added it and when.', 'fu-view': 'Open the file in the browser. Nothing is downloaded. Word, Excel and PowerPoint open in Microsoft\'s free web viewer.',
  'fu-dl': 'Save the file to this device with its real name.', 'fu-share': 'Send the file on WhatsApp, by email or to any app. The receiver opens it with a link that needs no sign-in and stops working after the days chosen (7 unless changed).',
  'fu-share-native': 'Open the phone\'s share menu with the file attached (or its link where the browser cannot attach files).', 'fu-share-copy': 'Copy the link to paste anywhere.', 'fu-del': 'Remove this file for everyone.',
  'sch-reject': 'Reject this scheme (Owner or Director) with a reason. Whoever drew it up can change it and send it again.', 'sch-reject-go': 'Reject it. The reason is compulsory and is shown on the scheme and in Approvals.',
  'lost-csv': 'Download the lost sales shown, with every filter applied, as a file Excel opens.',
  'org-add': 'Add a company with its point of contact, address, areas and business details. Everything else can be added later.', 'person-add': 'Add a person: at a dealer, at an architect firm, or a personal contact.',
  'opp-add': 'Start a sale. For wholesale, type the designs, boxes and rate; the total is worked out.', 'opp-move': 'Move this sale to the stage chosen on the left. Some stages check things first (designs, credit, approvals).',
  'opp-edit': 'Change this sale\'s details and designs.', 'client-edit': 'Change this record\'s details.', 'client-save': 'Save. Anything wrong is shown just above the field.',
  'ful-next': 'Move this fulfilment to its next stage. At the stock check every design must be blocked or on production; the step into Payment received asks for the amount; Invoiced checks the credit limit.',
  'prod-all': 'Put every missing box of this order on a production order: one press for all designs. An open production order of the same design is joined.', 'pay-add': 'Record a payment that came in: the advance, an instalment or the balance.',
  'pay-save': 'Save the payment. It can never be more than what is still due.', 'chg-add': 'Add a charge besides the designs: installation, porter, transport…', 'chg-del': 'Remove this charge.',
  'sch-add': 'Draw up a dealer scheme: the period, the target per dealer, which dealers and the reward.', 'sch-approve': 'Approve this scheme (Owner or Director). It then runs over its period.', 'sch-settle': 'Close the scheme after it ends, with how each winner was settled.', 'alloc-open': 'Block boxes: for each design, how many to take from each warehouse.',
  'al-suggest': 'Fill from the warehouses with the most free boxes first.', 'al-prod': 'Whatever this design is still short of goes on a production order.', 'al-save': 'Save how many boxes are blocked in each warehouse.',
  'po-next': 'Move this production order on. Received at warehouse adds the boxes to stock.', 'po-add': 'Place a production order directly.',
  'move-add': 'Record stock coming in, going out, or moving between warehouses. Every move keeps who and when.', 'cat-add': 'Add a product category, then its collections, then its designs.',
  'col-add': 'Add a collection: its category, box size and specifications.', 'prod-add': 'Add a design, with the warehouses it is in and the boxes there today.', 'wh-add': 'Add a warehouse.',
  'site-add': 'Add an installation site for a client.', 'site-next': 'Move this site to its next step. Some steps check first: a crew, the readiness list, no open snag, the sign-off.',
  'cmp-add': 'Log a complaint.', 'ap-yes': 'Approve this request.', 'ap-no': 'Reject this request, with a reason.', 'list-open': 'Open this list to rename, reorder, lock or remove its items.',
  'lrow-lock': 'Lock or unlock this item. Locked: it cannot be renamed or removed.', 'lrow-up': 'Move this item up.', 'lrow-down': 'Move this item down.', 'lrow-del': 'Remove this item (only if nothing uses it).',
  'list-save': 'Save. If the change touches saved records or Excel files, you are shown what first and asked.', 'rules-open': 'GST, production quantities, approval limits, Priority 200 levels and weights.',
  'notif-open': 'Notifications: Internal (the system) and External (from outside).', 'notif-seen': 'Mark the recorded notifications as read.', 'div': 'Show EGO Premium (wholesale), Big E (retail) or both.',
  'sign-out': 'Sign out of EGO Master.', 'contact-add': 'Add a person to this company\'s team.', 'snag-add': 'Record a snag on this site.', 'snag-close': 'Close this snag, saying how it was put right.',
};
const NAV_HELP = { attendance: 'Attendance: who started the day, when, where, the photo, late marks and who has not started.', roadmap: 'Roadmap: plan each field person\'s day as an ordered list of visits, and see the team\'s progress.', projects: 'Projects: one building or site each, with its opportunities, contacts by role, Project Partner dealer, installation sites and files.', home: 'Today at a glance: counts, next actions due, what is not connected yet.', dealers: 'Distributors, dealers and sub-dealers, each with its team, sales and business.',
  architects: 'Architect firms and solo architects, each with its team.', design500: 'Design 500: the architects and interior designers who specify us, with their projects and the business they bring.', people: 'Everyone: the people at every company, and personal contacts.', opps: 'The sales boards. A wholesale sale runs here until Order confirmed.', schemes: 'Dealer schemes: a target over a period, progress counted from invoiced orders.',
  orders: 'EGO Premium: from the confirmed order to dispatch. Big E: the retail ladder from Won to Closed, handing over to the installation site.', orderbook: 'Every order, live and old: when each stage happened, who gave it, who closed it, who processed it.', installation: 'Installation sites of both companies, step by step: under a project or an order, with who installs each one.', complaints: 'Complaints, from logged to resolved.',
  approvals: 'Credit, discounts and settlements waiting for someone whose limit covers them.', p200: 'The dealers EGO develops first, scored from saved sales.', inventory: 'Categories, collections, designs, warehouses and stock.',
  import: 'Upload the Excel files: EGO Premium, Big E and Inventory.', team: 'The people who use EGO Master and what each role may see.', integrations: 'Every API key in one place: EGO Master\'s own, and the tools it connects to.', lists: 'Every dropdown and every stage, editable, with locks.', account: 'Your password.' };
function helpFor(t) {
  const own = t.closest('[data-help]'); if (own) return [own, own.dataset.help];
  const fe = t.closest('.field[data-field]');
  if (fe) { const f = ALL_FIELDS().find(x => x.key === fe.dataset.field), lab = ((fe.querySelector('label') || {}).textContent || '').replace(/\s*\*$/, '');
    return [fe, `<b>${esc(lab)}</b><br>${esc(FIELD_HELP[fe.dataset.field] || (f ? TYPE_HELP[f.type] || '' : ''))}${f && f.req ? '<br><span class="muted">Compulsory.</span>' : ''}${f && f.list ? '<br><span class="muted">The choices are in Lists & stages.</span>' : ''}`]; }
  const act = t.closest('[data-act]'); if (act && ACT_HELP[act.dataset.act]) return [act, esc(ACT_HELP[act.dataset.act])];
  const nav = t.closest('.navcard'); if (nav) { const k = (nav.getAttribute('href') || '').slice(2); return NAV_HELP[k] ? [nav, `<b>${esc(nav.textContent.trim())}</b><br>${esc(NAV_HELP[k])}`] : null; }
  const lane = t.closest('.lane[data-stage]'); if (lane && !t.closest('a, .mini')) return [lane, `<b>${esc(lane.dataset.stage)}</b><br>${lane.querySelectorAll('a, .mini').length} here. The stages and their order come from Lists & stages.`];
  const opp = t.closest('[data-href^="#/opp/"], a[href^="#/opp/"]');
  if (opp) { const o = D.opportunities.find(x => x.id === (opp.dataset.href || opp.getAttribute('href')).split('/')[2]); if (o) return [opp, `<b>${esc(o.title)}</b><br>${esc((CL()[o.client_id] || {}).name || '')} · ${esc(o.stage)}${D.access.prices && o.value ? ' · ' + money(o.value) : ''}<br>${esc(o.next_action || '')}${o.next_date ? ' by ' + ds(o.next_date) : ''}<br><span class="muted">Click to open it.</span>`]; }
  const row = t.closest('tr[data-href], a.card[href^="#/"]'); if (row) return [row, 'Click to open it.'];
  return null;
}
let hoverT = null, hoverEl = null;
const hideHelp = () => { clearTimeout(hoverT); hoverT = null; hoverEl = null; const h = qs('#hover-help'); if (h) h.remove(); };
document.addEventListener('mouseover', e => {
  if (e.pointerType === 'touch' || !e.target.closest) return;
  const hit = helpFor(e.target);
  if (!hit) { if (hoverEl && !hoverEl.contains(e.target)) hideHelp(); return; }
  if (hit[0] === hoverEl) return;
  hideHelp(); hoverEl = hit[0];
  const x = e.clientX, y = e.clientY, html = hit[1];
  hoverT = setTimeout(() => {   // two seconds of resting on it
    const h = document.createElement('div'); h.id = 'hover-help'; h.setAttribute('role', 'tooltip'); h.innerHTML = html; document.body.appendChild(h);
    const w = h.offsetWidth, hh = h.offsetHeight;
    h.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x + 12)) + 'px';
    h.style.top = (y + 18 + hh > window.innerHeight ? Math.max(8, y - hh - 12) : y + 18) + 'px';
  }, 2000);
});
for (const ev of ['mousedown', 'keydown', 'scroll', 'wheel']) document.addEventListener(ev, hideHelp, true);
document.addEventListener('mouseout', e => { if (hoverEl && !hoverEl.contains(e.relatedTarget)) hideHelp(); });

/* ---------------------------------------------------------------- my account */
/* ---------------------------------------------------------------- integrations (12 Oct) */
/* ---------------------------------------------------------------- follow-ups (13 Oct)
   A follow-up is what, when, who, on which client or opportunity, and a note. Done asks what happened
   and books the next one in the same small sheet, so a record never drops out of follow-up by accident.
   The record's own Next action and date follow its earliest open follow-up (the server keeps them in step). */
const FUS = () => D.followups || [], ACTS = () => D.activities || [];
const dayPlus = n => new Date(Date.now() + 5.5 * 36e5 + n * 864e5).toISOString().slice(0, 10);
const fuBucket = f => f.status !== 'open' ? 'done' : f.due_date < today() ? 'overdue' : f.due_date === today() ? 'today' : f.due_date <= dayPlus(7) ? 'week' : 'later';
const FU_TABS = [['overdue', 'Overdue'], ['today', 'Today'], ['week', 'This week'], ['later', 'Later'], ['done', 'Done']];
const fuSort = (a, b) => (a.due_date + (a.due_time || '99')).localeCompare(b.due_date + (b.due_time || '99'));
const fuOf = f => { const c = CL()[f.client_id], o = f.opp_id ? D.opportunities.find(x => x.id === f.opp_id) : null;
  return { c, o, client: c ? c.name : 'Outside your view', opp: o ? o.title : '', href: o ? '#/opp/' + o.id : f.plan_id ? `#/client/${f.client_id}/plan` : '#/client/' + f.client_id }; };
const fuInDiv = f => { const c = CL()[f.client_id]; return !c || inDiv(c); };
const fuWhen = f => `${f.status === 'open' && f.due_date < today() ? `<span class="badge bad">${ds(f.due_date)}</span>` : ds(f.due_date)}${f.due_time ? ' ' + esc(f.due_time) : ''}`;
const fuClosed = f => { if (f.plan_id) return true; const x = fuOf(f); return x.o ? isClosed(x.o.pipeline, x.o.stage, D.lists) : !!x.c && x.c.status === CLIENT_CLOSED; };
const fuBtns = f => f.status === 'open' ? `<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm primary" data-act="fu-done" data-id="${f.id}">Done</button><button class="btn sm ghost" data-act="fu-edit" data-id="${f.id}">Change</button></div>` : '';
function fuTable(list, { who = true, where = true } = {}) {
  return table(['When', 'Follow-up', ...(where ? ['Client'] : []), ...(who ? ['Who'] : []), ''], list.map(f => { const x = fuOf(f);
    return { href: x.href, cells: [fuWhen(f), `<b>${esc(f.action)}</b>${f.note ? `<div class="small muted">${esc(f.note)}</div>` : ''}${f.status !== 'open' ? `<div class="small">${f.source ? `<span class="badge plain">${esc(f.source)}</span> ` : ''}${esc(f.outcome)}${(n => n ? ` <span class="small muted">· ${n} file${n === 1 ? '' : 's'}</span>` : '')(D.documents.filter(d => d.followup_id === f.id).length)}${f.stop_reason ? ` <span class="badge plain">No further follow-up: ${esc(f.stop_reason)}</span>` : ''}</div><div class="small muted">Done ${esc(whenIST(f.done_at))} · ${esc(staffName(f.done_by))}</div>` : ''}`,
      ...(where ? [`${esc(x.client)}${x.opp ? `<div class="small muted">${esc(x.opp)}</div>` : ''}`] : []), ...(who ? [esc(staffName(f.owner_id))] : []), fuBtns(f)] }; }));
}
/* first on the field sales and telesales Home: what is due today and what is late, each with Done */
function fuCard(title) {
  const mine = FUS().filter(f => f.owner_id === me().id && f.status === 'open' && fuInDiv(f)), n = b => mine.filter(f => fuBucket(f) === b).length;
  const due = mine.filter(f => ['overdue', 'today'].includes(fuBucket(f))).sort(fuSort);
  return `<section class="card stack-s" data-dash-fu><div class="row between"><h3>${title}</h3><a class="btn sm" href="#/followups">All my follow-ups (${mine.length})</a></div>
    <p class="small"><b class="${n('overdue') ? 'err' : ''}">${num(n('overdue'))} overdue</b> · ${num(n('today'))} today · ${num(n('week'))} this week</p>
    ${due.length ? fuTable(due.slice(0, 7), { who: false }) + (due.length > 7 ? `<p class="small muted"><a href="#/followups/overdue">${due.length - 7} more</a></p>` : '') : '<p class="small muted">Nothing due today. Well done. Add a follow-up from any client, opportunity or board card.</p>'}</section>`;
}
/* a count for the head and management: whose follow-ups are late */
function fuCount(ids, title) {
  const list = FUS().filter(f => f.status === 'open' && fuInDiv(f) && (!ids || ids.includes(f.owner_id))), n = b => list.filter(f => fuBucket(f) === b).length;
  return `<section class="card stack-s" data-dash-fucount><div class="row between"><h3>${title}</h3><a class="btn sm" href="#/followups/overdue">See them</a></div>
    <p class="small"><b class="${n('overdue') ? 'err' : ''}">${num(n('overdue'))} overdue</b> · ${num(n('today'))} today · ${num(n('week'))} this week · ${num(list.length)} open</p></section>`;
}
/* My follow-ups: Overdue, Today, This week, Later, Done. Field sales see their own; a manager their team; an Owner everyone */
EM.fuF = { who: '', action: '', period: 'all', from: '', to: '', field: '', fq: '' };
const FU_FIELDS = [['action', 'Follow-up'], ['client', 'Client'], ['opp', 'Opportunity'], ['owner', 'Who'], ['note', 'Note'], ['outcome', 'What happened']];
const fuWhoDefault = () => ['sales', 'tele'].includes(D.access.dash) ? 'me' : 'all';
function fuRows(tab) {
  const f = EM.fuF, who = f.who || fuWhoDefault(), fq = f.fq.trim().toLowerCase();
  return FUS().filter(x => fuInDiv(x) && (who === 'all' || (who === 'me' ? x.owner_id === me().id : x.owner_id === who)) && (!f.action || x.action === f.action)
    && inPeriod(x.status === 'open' ? dateTs(x.due_date) : x.done_at, f.period, f.from, f.to)
    && (!fq || (f.field ? [fuVal(x, f.field)] : FU_FIELDS.map(([k]) => fuVal(x, k))).some(v => v.toLowerCase().includes(fq)))
    && matches(`${x.action} ${x.note} ${x.outcome} ${fuOf(x).client} ${fuOf(x).opp} ${staffName(x.owner_id)}`, [(CL()[x.client_id] || {}).mobile]))
    .filter(x => !tab || fuBucket(x) === tab);
}
const fuVal = (x, k) => String(k === 'client' ? fuOf(x).client : k === 'opp' ? fuOf(x).opp : k === 'owner' ? staffName(x.owner_id) : x[k] || '');
EM.VIEWS.followups = arg => {
  if (!allowedTab('followups')) return EM.noAccess('Follow-ups belong to roles that hold business records.');
  const f = EM.fuF, all = fuRows(''), cnt = b => all.filter(x => fuBucket(x) === b).length;
  const tab = FU_TABS.some(([k]) => k === arg) ? arg : cnt('overdue') ? 'overdue' : 'today', rows = all.filter(x => fuBucket(x) === tab);
  rows.sort(tab === 'done' ? (a, b) => String(b.done_at).localeCompare(String(a.done_at)) : fuSort);
  const owners = [...new Set(FUS().filter(fuInDiv).map(x => x.owner_id))].filter(id => id !== me().id).map(id => [id, staffName(id)]).sort((a, b) => a[1].localeCompare(b[1]));
  const sel = (k, label, opts) => `<label class="field" style="min-width:160px"><span class="small muted">${label}</span><select class="input" data-ff="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${(k === 'who' ? f.who || fuWhoDefault() : f[k]) === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const actions = [...new Set([...(D.lists.next_actions || []), ...FUS().map(x => x.action)])];
  return `<div class="stack">${crumbs(['Home', '#/home'], ['Follow-ups'])}
    <div class="stack-s"><div class="kicker">${esc(scopeLabel())}</div><h1>Follow-ups</h1><p class="muted" style="max-width:780px">Every call, visit and next step with a date. Done asks what happened and books the next one, so nobody drops out of follow-up. Add one from any client, opportunity or board card.</p></div>
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-fu-filters>${sel('who', 'Whose', [['me', 'Mine'], ['all', 'Everyone I can see'], ...owners])}${sel('action', 'Follow-up', [['', 'Every kind'], ...actions.map(a => [a, a])])}
      ${dateFilter(f, 'fu', tab === 'done' ? 'When it was done' : 'When it is due')}${sel('field', 'Any field', [['', 'Any field'], ...FU_FIELDS])}<label class="field" style="min-width:160px"><span class="small muted">contains</span><input class="input" id="fu-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
    ${searchBox('Client, opportunity, follow-up, note or person')}
    ${subtabs('#/followups', tab, FU_TABS.map(([k, l]) => [k, `${l} <span class="muted">${cnt(k)}</span>`]))}
    ${rows.length ? fuTable(rows.slice(0, 500)) + (rows.length > 500 ? `<p class="small muted">Showing 500 of ${rows.length}. Use the filters.</p>` : '') : empty({ overdue: 'Nothing overdue', today: 'Nothing due today', week: 'Nothing this week', later: 'Nothing later', done: 'Nothing done yet' }[tab], tab === 'overdue' || tab === 'today' ? 'Well done. Everything is up to date.' : 'Change the filters above, or add a follow-up from a client or an opportunity.')}</div>`;
};
EM.VIEWS.followups.tab = 'home';
EM.VIEWS.followups.title = () => 'Follow-ups';
DF_STATE.fu = () => EM.fuF;
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.ff; if (k) { EM.fuF[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'fu-fq') { EM.fuF.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#fu-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
/* what the server sends back after a follow-up write: that client's follow-ups, and the record it moved */
function fuApply(r) {
  const cid = (r.client && r.client.id) || r.clientId || (r.followups[0] || {}).client_id;
  D.followups = FUS().filter(f => f.client_id !== cid).concat(r.followups || []);
  if (r.client) upsertLocal(D.clients, r.client);
  if (r.opportunity) upsertLocal(D.opportunities, r.opportunity);
}
const FU_ACTION = { key: 'action', list: 'next_actions', label: 'What', type: 'suggest', req: true, opts: [] };
const dayChips = id => `<div class="row" style="gap:6px;flex-wrap:wrap">${[[0, 'Today'], [1, 'Tomorrow'], [3, 'In 3 days'], [7, 'Next week']].map(([n, l]) => `<button type="button" class="btn sm ghost" data-day="${n}" data-for="${id}">${l}</button>`).join('')}</div>`;
document.addEventListener('click', e => { const b = e.target.closest('[data-day]'); if (!b) return; const i = qs('#' + b.dataset.for); if (i) { i.value = dayPlus(Number(b.dataset.day)); i.dispatchEvent(new Event('change', { bubbles: true })); } });
function fuForm(clientId, oppId, f) {
  const c = CL()[clientId], o = oppId && D.opportunities.find(x => x.id === oppId), owner = f ? f.owner_id : (o || c || {}).owner_id || me().id;
  const ppl = D.staff.filter(s => s.active).sort((a, b) => a.name.localeCompare(b.name));
  EM.modal(`<h2>${f ? 'Change the follow-up' : 'Add a follow-up'}</h2><p class="muted small">${esc(c ? c.name : 'Client')}${o ? ' · ' + esc(o.title) : ''}</p>
    <form id="fuf" class="stack" onsubmit="return false" style="margin-top:12px" data-client="${esc(clientId)}" data-opp="${esc(oppId || '')}" data-id="${f ? f.id : ''}"><div class="fgrid">
      ${fieldHtml(FU_ACTION, f ? f.action : '', 'fu')}
      <div class="field" data-field="due_date"><label for="fu-date">When *</label><input class="input" type="date" id="fu-date" value="${esc(f ? f.due_date : '')}">${dayChips('fu-date')}</div>
      <div class="field"><label for="fu-time">Time (if it matters)</label><input class="input" type="time" id="fu-time" value="${esc(f ? f.due_time : '')}"></div>
      <div class="field"><label for="fu-owner">Who does it</label><select class="input" id="fu-owner">${ppl.map(s => `<option value="${s.id}" ${s.id === owner ? 'selected' : ''}>${esc(s.name)}${s.id === me().id ? ' (me)' : ''}</option>`).join('')}</select></div>
      <div class="field span2"><label for="fu-note">Note</label><input class="input" id="fu-note" maxlength="500" value="${esc(f ? f.note : '')}" placeholder="e.g. Take the Oak and Walnut samples"></div></div>
      ${errBox('fu-err')}<div class="row sticky-actions"><button class="btn primary" data-act="fu-save">${f ? 'Save' : 'Add follow-up'}</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
EM.ACTIONS['fu-add'] = el => fuForm(el.dataset.client, el.dataset.opp);
EM.ACTIONS['fu-edit'] = el => { const f = FUS().find(x => x.id === el.dataset.id); fuForm(f.client_id, f.opp_id, f); };
EM.ACTIONS['fu-save'] = async el => {
  const form = qs('#fuf'), b = { action: qs('#fu-action').value.trim(), date: qs('#fu-date').value, time: qs('#fu-time').value, owner_id: qs('#fu-owner').value, note: qs('#fu-note').value };
  if (!b.action || !b.date) return showErr('fu-err', [!b.action && 'What is compulsory', !b.date && 'When is compulsory'].filter(Boolean));
  if (!form.dataset.id) Object.assign(b, { client_id: form.dataset.client, opp_id: form.dataset.opp });
  busy(el, true);
  try { const r = await API('POST', '/api/follow-ups' + (form.dataset.id ? '/' + form.dataset.id : ''), b); fuApply(r); EM.closeModal(); EM.toast(`Follow-up ${form.dataset.id ? 'saved' : 'added'}: <b>${esc(b.action)}</b> on ${ds(b.date)}${b.owner_id !== me().id ? ' · ' + esc(staffName(b.owner_id)) : ''}`); EM.rerender(); }
  catch (x) { busy(el, false); showErr('fu-err', x.errors || x.message); }
};
/* Done: what happened (one line) and the next follow-up, in one sheet; "No further follow-up" only on a closed record */
EM.ACTIONS['fu-done'] = el => {
  const f = FUS().find(x => x.id === el.dataset.id), x = fuOf(f), closed = fuClosed(f);
  EM.modal(`<h2>Done: ${esc(f.action)}</h2><p class="muted small">${esc(x.client)}${x.opp ? ' · ' + esc(x.opp) : ''} · due ${ds(f.due_date)}</p>
    <form id="fdf" class="stack" onsubmit="return false" style="margin-top:12px" data-id="${f.id}">
      <div class="field" data-field="source"><label for="fd-src">How it happened *</label><select class="input" id="fd-src" data-keep-order><option value="">Choose</option>${(D.lists.followup_sources || []).map(x => `<option ${x === fuGuessSource(f.action) ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="field" data-field="outcome"><label for="fd-out">What happened *</label><input class="input" id="fd-out" maxlength="300" placeholder="e.g. Wants Oak samples, call after Diwali" autocomplete="off"></div>
      <fieldset class="fs" id="fd-next"><legend>The next follow-up</legend><div class="fgrid">${fieldHtml(FU_ACTION, f.action, 'fd')}
        <div class="field" data-field="due_date"><label for="fd-date">When *</label><input class="input" type="date" id="fd-date">${dayChips('fd-date')}</div>
        <div class="field"><label for="fd-time">Time (if it matters)</label><input class="input" type="time" id="fd-time"></div></div></fieldset>
      ${closed ? `<label class="row small"><input type="checkbox" id="fd-stop"> No further follow-up (this ${x.o ? 'opportunity is closed' : f.plan_id ? 'plan item ends here' : 'client is ' + esc(CLIENT_CLOSED)})</label><div class="field" id="fd-why-wrap" hidden><label for="fd-why">Why not *</label><input class="input" id="fd-why" maxlength="300" placeholder="e.g. Bought from another brand"></div>` : ''}
      <details class="more"><summary>Screenshots, photos or PDFs (optional)</summary>${fuFilesBox(f.id)}</details>
      ${errBox('fd-err')}<div class="row sticky-actions"><button class="btn primary" data-act="fu-done-go">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
  const stop = qs('#fd-stop'); if (stop) stop.addEventListener('change', () => { qs('#fd-next').hidden = stop.checked; qs('#fd-why-wrap').hidden = !stop.checked; });
  setTimeout(() => { const i = qs('#fd-out'); if (i) i.focus(); }, 50);
};
EM.ACTIONS['fu-done-go'] = async el => {
  const id = qs('#fdf').dataset.id, stop = !!(qs('#fd-stop') && qs('#fd-stop').checked), outcome = qs('#fd-out').value.trim(), source = qs('#fd-src').value;
  const b = stop ? { source, outcome, stop: true, stop_reason: qs('#fd-why').value.trim() } : { source, outcome, next: { action: qs('#fd-action').value.trim(), date: qs('#fd-date').value, time: qs('#fd-time').value } };
  const errs = [!source && 'How it happened is compulsory', !outcome && 'What happened is compulsory', stop && !b.stop_reason && 'Why not is compulsory', !stop && !b.next.action && 'The next follow-up: what is compulsory', !stop && !b.next.date && 'The next follow-up: when is compulsory'].filter(Boolean);
  if (errs.length) return showErr('fd-err', errs);
  busy(el, true);
  try { const r = await API('POST', `/api/follow-ups/${id}/done`, b); fuApply(r); EM.closeModal(); EM.toast(stop ? 'Done. No further follow-up.' : `Done. Next: <b>${esc(b.next.action)}</b> on ${ds(b.next.date)}`); EM.rerender(); }
  catch (x) { busy(el, false); showErr('fd-err', x.errors || x.message); }
};

/* ---------------------------------------------------------------- activity (13 Oct)
   One timeline per client (and per opportunity) made of what is ALREADY saved: stage moves, follow-ups
   done with what happened, files, approvals, payments and fulfilment steps, plus calls, visits, messages,
   meetings and notes logged here or written by a connection (named with its API key). */
const ACT_ICON = { call: 'Call', visit: 'Visit', whatsapp: 'WhatsApp', email: 'Email', meeting: 'Meeting', lead: 'Lead', note: 'Note', system: 'System' };
/* a plain date (a payment's day, a follow-up's due date) is that day in India; a stored time without a zone is UTC */
const dateTs = d => /^\d{4}-\d\d-\d\d$/.test(String(d || '')) ? d + 'T00:00:00+05:30' : d;
const tsMs = ts => { if (!ts) return NaN; ts = dateTs(String(ts)); return Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(ts) ? ts : ts.replace(' ', 'T') + 'Z'); };
const isoOf = ts => { const n = tsMs(ts); return isNaN(n) ? '' : new Date(n).toISOString(); };
function timelineFor(clientId, oppId) {
  const O = OPSD(), P = D.access.prices, items = [], push = (at, group, title, detail, who, extra = {}) => { if (at) items.push({ at: isoOf(at), group, title, detail: detail || '', who: who || '', ...extra }); };
  const opps = D.opportunities.filter(o => oppId ? o.id === oppId : o.client_id === clientId), oppIds = new Set(opps.map(o => o.id)), oppName = id => (opps.find(o => o.id === id) || {}).title || '';
  for (const a of ACTS().filter(a => a.client_id === clientId && (!oppId || a.opp_id === oppId)))
    push(a.at, 'talk', `${ACT_ICON[a.kind] || a.kind}${a.direction === 'in' ? ' in' : a.direction === 'out' ? ' out' : ''}${a.opp_id && !oppId ? ' · ' + oppName(a.opp_id) : ''}`, a.summary, a.via_key ? `via API key ${a.via_key}` : staffName(a.by_staff), { source: a.source, kind: a.kind });
  for (const h of D.history.filter(h => oppIds.has(h.opp_id))) push(h.at, 'stage', `${h.from_stage ? 'Moved to' : 'Opened at'} ${h.to_stage}${oppId ? '' : ' · ' + oppName(h.opp_id)}`, `${h.from_stage ? 'from ' + h.from_stage : ''}${h.note ? (h.from_stage ? ' · ' : '') + h.note : ''}`, staffName(h.by_staff));
  for (const f of FUS().filter(f => f.client_id === clientId && f.status !== 'open' && (!oppId || f.opp_id === oppId))) push(f.done_at, 'followup', `Follow-up done: ${f.action}${f.source ? ' (' + f.source + ')' : ''}${f.opp_id && !oppId ? ' · ' + oppName(f.opp_id) : ''}`, f.outcome + (f.stop_reason ? ` · No further follow-up: ${f.stop_reason}` : ''), staffName(f.done_by));
  for (const d of D.documents.filter(d => d.client_id === clientId && (!oppId || d.opp_id === oppId))) push(d.created_at, 'file', `File added: ${d.name}`, d.followup_id ? `${d.type} · with a follow-up` : d.type, staffName(d.uploaded_by), { doc: d.id });
  for (const a of (O.approvals || []).filter(a => a.client_id === clientId && (!oppId || a.record_id === oppId))) {
    push(a.created_at, 'approval', `Approval asked: ${a.kind}`, a.reason, staffName(a.requested_by));
    if (a.decided_at) push(a.decided_at, 'approval', `${a.status}: ${a.kind}`, a.decision_note || a.reason, staffName(a.decided_by));
  }
  for (const o of allOrders().filter(o => o.client_id === clientId && (!oppId || o.opp_id === oppId))) {
    for (const l of (O.logs || []).filter(l => l.record_id === o.id)) push(l.at, 'order', `${o.ref}: ${l.to_stage}`, l.note, staffName(l.by_staff));
    if (P) for (const pm of (o.extra.payments || [])) push(pm.at || pm.on, 'order', `${o.ref}: payment received ${inr0(pm.amount)}`, pm.note, staffName(pm.by));
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}
EM.actF = { show: '', period: 'all', from: '', to: '', field: '', fq: '' };
const ACT_SHOW = [['', 'Everything'], ['talk', 'Calls, visits and messages'], ['followup', 'Follow-ups done'], ['stage', 'Stage moves'], ['file', 'Files'], ['approval', 'Approvals'], ['order', 'Orders and payments']];
const ACT_FIELDS = [['title', 'What'], ['detail', 'Details'], ['who', 'Who']];
DF_STATE.act = () => EM.actF;
function activityPanel({ clientId, oppId }) {
  const f = EM.actF, fq = f.fq.trim().toLowerCase(), all = timelineFor(clientId, oppId);
  const rows = all.filter(i => (!f.show || i.group === f.show) && inPeriod(i.at, f.period, f.from, f.to) && (!fq || (f.field ? [i[f.field]] : ACT_FIELDS.map(([k]) => i[k])).some(v => String(v || '').toLowerCase().includes(fq))));
  const open = FUS().filter(x => x.client_id === clientId && x.status === 'open' && (oppId ? x.opp_id === oppId : true)).sort(fuSort);
  const sel = (k, label, opts) => `<label class="field" style="min-width:150px"><span class="small muted">${label}</span><select class="input" data-af="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const logs = ACT_MANUAL.map(k => `<button class="btn sm" data-act="act-log" data-kind="${k}" data-client="${esc(clientId)}" data-opp="${esc(oppId || '')}">${k === 'note' ? '+ Note' : 'Log ' + (k === 'whatsapp' ? 'WhatsApp' : k === 'email' ? 'email' : 'a ' + k)}</button>`).join('');
  return `<div class="stack" data-activity>
    <section class="card stack-s" data-open-fu><div class="row between"><h3>Open follow-ups${open.length ? ` (${open.length})` : ''}</h3><button class="btn sm primary" data-act="fu-add" data-client="${esc(clientId)}" data-opp="${esc(oppId || '')}">+ Follow-up</button></div>
      ${open.length ? fuTable(open, { where: !oppId }) : `<p class="small muted">No follow-up booked${oppId ? ' for this opportunity' : ''}. Add one so it is not forgotten.</p>`}</section>
    <section class="card stack-s"><div class="row between" style="flex-wrap:wrap"><h3>Activity</h3><div class="row" style="gap:6px;flex-wrap:wrap">${logs}</div></div>
      <div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-act-filters>${sel('show', 'Show', ACT_SHOW)}${dateFilter(f, 'act', 'When')}${sel('field', 'Any field', [['', 'Any field'], ...ACT_FIELDS])}<label class="field" style="min-width:150px"><span class="small muted">contains</span><input class="input" id="act-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
      ${rows.length ? `<div class="timeline" data-timeline>${rows.slice(0, 300).map(i => `<div class="on" data-tl="${i.group}"><b>${esc(i.title)}</b>${i.detail ? `<div class="small">${esc(i.detail)}</div>` : ''}<div class="small muted">${esc(whenIST(i.at))}${i.who ? ' · ' + esc(i.who) : ''}${i.source && i.source !== 'manual' ? ' · from ' + esc(i.source) : ''}</div>${i.doc ? `<div class="row" style="gap:6px" data-file-acts><button class="btn sm" data-act="fu-view" data-id="${i.doc}">View</button><button class="btn sm ghost" data-act="fu-dl" data-id="${i.doc}">Download</button><button class="btn sm ghost" data-act="fu-share" data-id="${i.doc}">Share</button></div>` : ''}</div>`).join('')}</div>${rows.length > 300 ? `<p class="small muted">Showing 300 of ${rows.length}. Use the filters.</p>` : ''}`
        : `<p class="small muted">${all.length ? 'Nothing for this filter.' : 'Nothing yet. Calls, visits, messages, stage moves, files, approvals and payments for this record all show here.'}</p>`}</section></div>`;
}
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.af; if (k) { EM.actF[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'act-fq') { EM.actF.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#act-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
EM.ACTIONS['act-log'] = el => {
  const k = el.dataset.kind, c = CL()[el.dataset.client], o = el.dataset.opp && D.opportunities.find(x => x.id === el.dataset.opp), dir = ['call', 'whatsapp', 'email'].includes(k);
  EM.modal(`<h2>${k === 'note' ? 'Add a note' : 'Log ' + esc(ACT_ICON[k].toLowerCase() === 'whatsapp' ? 'a WhatsApp' : 'a ' + ACT_ICON[k].toLowerCase())}</h2><p class="muted small">${esc(c ? c.name : '')}${o ? ' · ' + esc(o.title) : ''}</p>
    <form id="acf" class="stack" onsubmit="return false" style="margin-top:12px" data-kind="${k}" data-client="${esc(el.dataset.client)}" data-opp="${esc(el.dataset.opp || '')}">
      ${dir ? `<div class="field"><label for="ac-dir">Who reached out</label><select class="input" id="ac-dir"><option value="out">We did</option><option value="in">They did</option></select></div>` : ''}
      <div class="field" data-field="summary"><label for="ac-sum">${k === 'note' ? 'Note' : 'What happened'} *</label><textarea class="input" id="ac-sum" rows="3" maxlength="1000" placeholder="${k === 'note' ? 'Anything worth remembering' : 'e.g. Spoke to Ramesh: wants Oak samples, will order after Diwali'}"></textarea></div>
      ${errBox('ac-err')}<div class="row sticky-actions"><button class="btn primary" data-act="act-save">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
  setTimeout(() => { const i = qs('#ac-sum'); if (i) i.focus(); }, 50);
};
EM.ACTIONS['act-save'] = async el => {
  const form = qs('#acf'), b = { client_id: form.dataset.client, opp_id: form.dataset.opp || undefined, kind: form.dataset.kind, direction: qs('#ac-dir') ? qs('#ac-dir').value : '', summary: qs('#ac-sum').value.trim() };
  if (!b.summary) return showErr('ac-err', 'What happened is compulsory');
  busy(el, true);
  try { const r = await API('POST', '/api/activities', b); D.activities = ACTS().concat([r.activity]); EM.closeModal(); EM.toast(`${esc(ACT_ICON[b.kind])} saved to the activity.`); EM.rerender(); }
  catch (x) { busy(el, false); showErr('ac-err', x.errors || x.message); }
};

/* how it happened, guessed from what was planned (Call -> Call, Site visit -> Visit); the person can change it */
const fuGuessSource = action => { const a = String(action || '').toLowerCase(), L = D.lists.followup_sources || [];
  return L.find(x => a.includes(x.toLowerCase())) || (/visit/.test(a) ? L.find(x => /visit/i.test(x)) : '') || ''; };
/* the shared file component, for the files that go with one follow-up */
const fuFilesBox = id => { const f = FUS().find(x => x.id === id) || {};
  return filesBox({ id: 'fd', client: f.client_id, followup: id, types: ['Screenshot', 'Photo', 'PDF', 'Other'], docs: D.documents.filter(d => d.followup_id === id), title: 'Add screenshots, photos or PDFs', canAdd: true, emptyTitle: 'No files with this follow-up yet', emptyText: 'A WhatsApp screenshot, a site photo or a quotation PDF can go here.' }); };
/* founders and management: the day's roll-up. Overdue by person, due today, done today, missed yesterday */
function fuRollup() {
  const all = FUS().filter(fuInDiv), open = all.filter(f => f.status === 'open'), y = dayPlus(-1), t = today();
  const late = open.filter(f => f.due_date < t), dueT = open.filter(f => f.due_date === t), doneT = all.filter(f => f.status !== 'open' && dayIST(f.done_at) === t);
  const missed = all.filter(f => f.due_date === y && (f.status === 'open' || dayIST(f.done_at) > y));
  const ppl = [...new Set([...late, ...dueT, ...doneT].map(f => f.owner_id))].map(id => ({ id, late: late.filter(f => f.owner_id === id).length, today: dueT.filter(f => f.owner_id === id).length, done: doneT.filter(f => f.done_by === id || f.owner_id === id).length }))
    .sort((a, b) => b.late - a.late || b.today - a.today);
  return `<section class="card stack-s" data-dash-fucount data-fu-rollup><div class="row between"><h3>Follow-ups across the business today</h3><a class="btn sm" href="#/followups/overdue">See them</a></div>
    <p class="small"><b class="${late.length ? 'err' : ''}">${num(late.length)} overdue</b> · ${num(dueT.length)} due today · ${num(doneT.length)} done today · ${num(missed.length)} missed yesterday · ${num(open.length)} open</p>
    ${ppl.length ? table(['Person', 'Overdue', 'Due today', 'Done today'], ppl.slice(0, 12).map(x => [`<b>${esc(staffName(x.id))}</b>`, x.late ? `<span class="badge bad">${x.late}</span>` : '0', num(x.today), num(x.done)])) : '<p class="small muted">Nobody has a follow-up due or done today.</p>'}</section>`;
}

/* ---------------------------------------------------------------- targets and analysis (13 Oct, batch 3)
   Every figure below is counted from saved records and can be clicked: it opens the records behind it and
   the calculation. EGO Premium's sales are orders that reached Invoiced, by invoice date, before GST (the
   same rule as dealer schemes); Big E's are won retail opportunities, by the date they were won. When Tally
   is connected it fills the invoices in by itself; the counting stays the same. */
const TGS = () => D.targets || [];
const canSetT = () => !!D.access.can_targets && !!D.access.prices && !ownReadonly();
const tgDivName = d => d === 'retail' ? 'Big E' : 'EGO Premium';
const tgName = t => t.level === 'company' ? tgDivName(t.division) : t.level === 'role' ? roleName(t.subject) : `${t.level === 'team' ? 'Team of ' : ''}${staffName(t.subject)}`;
/* the people a target counts: a person; a manager and everyone under them; everyone in a role; the company is everyone */
const tgPeople = t => t.level === 'person' ? [t.subject] : t.level === 'team' ? [t.subject, ...under(t.subject)] : t.level === 'role' ? D.staff.filter(s => s.role === t.subject).map(s => s.id) : null;
const dayTs = d => d + 'T00:00:00+05:30';   // a plain date as that day in India, for the shared date filter
/* the first and last day a date filter covers, so a target's period can be tested for overlap */
function periodBounds(p, from, to) {
  const t = today(), [y, m] = t.slice(0, 7).split('-').map(Number), fy = m >= 4 ? y : y - 1, ym = (yy, mm) => `${yy}-${String(mm).padStart(2, '0')}`;
  const month = k => [k + '-01', k + '-31'], prev = m === 1 ? ym(y - 1, 12) : ym(y, m - 1);
  return { all: ['0000-00-00', '9999-12-31'], today: [t, t], month: month(t.slice(0, 7)), last: month(prev), year: [`${fy}-04-01`, `${fy + 1}-03-31`], lastyear: [`${fy - 1}-04-01`, `${fy}-03-31`], custom: [from || '0000-00-00', to || '9999-12-31'] }[p] || ['0000-00-00', '9999-12-31'];
}
const tgRunsIn = (t, f) => { const [a, b] = periodBounds(f.period, f.from, f.to); return t.start_on <= b && t.end_on >= a; };
/* figures you can click: EM.whyK holds, for each one on screen, the records behind it and how it was worked out */
EM.whyK = {}; let whyN = 0;
const whyReset = () => { EM.whyK = {}; whyN = 0; };
const fig = (text, why) => { const k = 'w' + (++whyN); EM.whyK[k] = why; return `<button type="button" class="fig" data-act="why" data-k="${k}" title="${esc(why.calc)}">${text}</button>`; };
EM.ACTIONS.why = el => {
  const w = EM.whyK[el.dataset.k]; if (!w) return;
  const rows = w.rows || [];
  EM.modal(`<div data-why><h2>${esc(w.title)}</h2><p class="muted small" style="max-width:640px"><b>How it is worked out:</b> ${esc(w.calc)}</p>
    ${rows.length ? table(w.head, rows.slice(0, 300).map(r => ({ href: r.href, cells: r.cells }))) + (rows.length > 300 ? `<p class="small muted">Showing 300 of ${rows.length}.</p>` : '') : '<p class="small muted">No records: nothing saved matches yet.</p>'}
    <div class="row sticky-actions"><button class="btn" data-act="close-modal">Close</button></div></div>`);
};
window.addEventListener('hashchange', () => { if (qs('#overlay [data-why]')) EM.closeModal(); });
/* ---- the sales, as one list: an invoiced order (EGO Premium) or a won retail sale (Big E) */
function salesList() {
  const O = OPSD(), out = [], P = D.access.prices;
  for (const o of O.orders) {
    if (!o.invoiced_at) continue;
    const lines = O.lines.filter(l => l.order_id === o.id).map(l => { const p = INVD().products.find(x => x.id === l.product_id) || {}, c = colOf(p); return { product: p.name || 'Design', category: c.category || 'Not set', collection: c.name || 'Not set', boxes: l.boxes || 0, amount: Number(l.amount) || 0, sqft: Number(l.sqft) || sqftFor(p, l.boxes || 0) || 0 }; });   // R4: sq ft supplied from the line (lines saved before R4: from the box size)
    out.push({ div: 'wholesale', id: o.id, ref: o.ref, at: dayIST(o.invoiced_at), owner: o.owner_id, client_id: o.client_id, region: o.region || (CL()[o.client_id] || {}).region || '', value: P ? Number(o.subtotal) || 0 : 0, lines, href: '#/order/' + o.id });
  }
  for (const p of Object.keys(PIPELINES).filter(k => PIPELINES[k].division === 'retail')) for (const o of D.opportunities.filter(x => x.pipeline === p && x.stage === wonStage(p, D.lists))) {
    const h = D.history.filter(x => x.opp_id === o.id && x.to_stage === o.stage).pop(), at = (h && h.at) || o.closed_at || o.updated_at;
    out.push({ div: 'retail', id: o.id, ref: o.ref, title: o.title, at: dayIST(at), owner: o.owner_id, client_id: o.client_id, region: o.region || '', value: P ? Number(o.value) || 0 : 0, cats: (o.extra || {}).products || [], area: Number((o.extra || {}).area_sqft) || 0, href: '#/opp/' + o.id,
      lines: (OPSD().oppLines || []).filter(l => l.opp_id === o.id).map(l => { const p = lineProd(l.product_id) || {}; return { category: colOf(p).category || 'Not set', boxes: Number(l.boxes) || 0, sqft: Number(l.sqft) || 0, amount: Number(l.amount) || 0 }; }) });
  }
  return out;
}
/* what one sale adds up to, all of it or one category of it */
const saleMeasure = (s, cat) => {
  if (s.div === 'retail' && !s.lines.length) return !cat || s.cats.includes(cat) ? { value: s.value, boxes: 0, sqft: s.area } : null;
  if (s.div === 'retail' && cat && !s.lines.some(l => l.category === cat)) return null;   // R4: a Big E sale with lines counts its boxes and sq ft supplied
  const ls = cat ? s.lines.filter(l => l.category === cat) : s.lines;
  if (cat && !ls.length) return null;
  return { value: cat ? ls.reduce((a, l) => a + l.amount, 0) : s.value, boxes: ls.reduce((a, l) => a + l.boxes, 0), sqft: ls.reduce((a, l) => a + l.sqft, 0) };
};
/* dealers whose first invoice (in your view) falls inside the dates */
const firstInvoices = () => { const m = {}; for (const s of salesList()) if (s.div === 'wholesale' && DEALER_KINDS.includes((CL()[s.client_id] || {}).kind) && (!m[s.client_id] || s.at < m[s.client_id].at)) m[s.client_id] = s; return m; };
const saleRow = (s, m) => ({ href: s.href, cells: [`<b>${esc(s.ref || '')}</b>${s.title ? `<div class="small">${esc(s.title)}</div>` : ''}`, ds(s.at), esc(clientName(s.client_id)), esc(staffName(s.owner)), ...(D.access.prices ? [inr0(m ? m.value : s.value)] : []), m && m.boxes ? num(m.boxes) : '', m && m.sqft ? num(Math.round(m.sqft)) : ''] });
const SALE_HEAD = () => ['Sale', 'Date', 'Client', 'Person', ...(D.access.prices ? ['Value before GST'] : []), 'Boxes', 'Sq ft'];
/* ---- one target's achievement, counted from the sales */
function tgAchieved(t) {
  const ppl = tgPeople(t), inSet = id => !ppl || ppl.includes(id), cat = t.category || '';
  const sales = salesList().filter(s => s.div === t.division && s.at >= t.start_on && s.at <= t.end_on && inSet(s.owner)).map(s => [s, saleMeasure(s, cat)]).filter(([, m]) => m);
  const sum = k => sales.reduce((a, [, m]) => a + m[k], 0);
  const fi = firstInvoices(), nd = t.division === 'wholesale' ? Object.values(fi).filter(s => s.at >= t.start_on && s.at <= t.end_on && inSet(s.owner)) : [];
  const day = today(), total = Math.round((Date.parse(t.end_on) - Date.parse(t.start_on)) / 864e5) + 1;
  const gone = day < t.start_on ? 0 : day > t.end_on ? total : Math.round((Date.parse(day) - Date.parse(t.start_on)) / 864e5) + 1, left = day > t.end_on ? 0 : day < t.start_on ? total : total - gone + 1;   // days left, today included
  return { sales, value: sum('value'), boxes: sum('boxes'), sqft: sum('sqft'), newDealers: nd, total, gone, left, frac: gone / total };
}
const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;
const tgWho = t => t.level === 'company' ? 'everyone' : t.level === 'role' ? `everyone whose role is ${roleName(t.subject)}` : t.level === 'team' ? `${staffName(t.subject)} and everyone who reports to them` : staffName(t.subject);
const tgRule = t => t.division === 'wholesale' ? `EGO Premium orders that reached Invoiced between ${ds(t.start_on)} and ${ds(t.end_on)}, by invoice date, before GST${t.category ? `, counting only the ${t.category} designs on each order (their line amounts; other charges are left out)` : ' (the order\'s value before GST)'}` : `Big E retail sales won between ${ds(t.start_on)} and ${ds(t.end_on)}, at the value on the opportunity${t.category ? `, counting a sale in full when its products include ${t.category}` : ''}`;
/* one measure of a target: target, achieved, remaining, %, where a straight line says it should be today, and the daily rate still needed */
function tgMeasure(t, a, key, label, fmt) {
  const goal = t[key] || 0; if (!goal) return null;
  const got = key === 'value' ? a.value : key === 'boxes' ? a.boxes : key === 'sqft' ? Math.round(a.sqft) : a.newDealers.length;
  const rem = Math.max(0, goal - got), should = Math.round(goal * a.frac), perDay = a.left > 0 ? rem / a.left : 0;
  const head = key === 'new_dealers' ? ['Dealer', 'First invoice', 'Order', 'Person', ...(D.access.prices ? ['Value before GST'] : [])] : SALE_HEAD();
  const rows = key === 'new_dealers' ? a.newDealers.map(s => ({ href: '#/client/' + s.client_id, cells: [`<b>${esc(clientName(s.client_id))}</b>`, ds(s.at), esc(s.ref || ''), esc(staffName(s.owner)), ...(D.access.prices ? [inr0(s.value)] : [])] })) : a.sales.map(([s, m]) => saleRow(s, m));
  const calc = key === 'new_dealers' ? `Dealers whose first invoiced order in EGO Master is dated inside the period, where that order belongs to ${tgWho(t)}.` : `The sum of ${label.toLowerCase()} on ${tgRule(t)}, for ${tgWho(t)}.`;
  return { key, label, goal, got, rem, should, perDay, ended: a.left === 0 && a.gone > 0, notStarted: a.gone === 0, p: pct(got, goal), fmt,
    gotFig: fig(fmt(got), { title: `${tgName(t)}: ${label.toLowerCase()} achieved, ${periodLabel(t.period_type, t.period)}`, calc, head, rows }) };
}
const TG_MEASURES = () => [...(D.access.prices ? [['value', 'Value', inr0]] : []), ['boxes', 'Boxes', num], ['sqft', 'Sq ft', n => num(Math.round(n))], ['new_dealers', 'New dealers', num]];
const tgMeasures = t => { const a = tgAchieved(t); return TG_MEASURES().map(([k, l, f]) => tgMeasure(t, a, k, l, f)).filter(Boolean); };
const bar = p => `<span class="tg-bar" aria-hidden="true"><span style="width:${Math.min(100, p)}%" class="${p >= 100 ? 'ok' : ''}"></span></span>`;
/* the target table, used by Targets and by Analysis › Targets */
function tgTable(list, actions) {
  if (!list.length) return '';
  const rows = list.flatMap(t => { const ms = tgMeasures(t);
    const first = `<b>${esc(tgName(t))}</b><div class="small muted">${esc(TARGET_LEVELS[t.level])} · ${esc(tgDivName(t.division))}</div>`;
    if (!ms.length) return [[first, esc(periodLabel(t.period_type, t.period)), esc(t.category || 'Every category'), '<span class="muted">Value only: your role does not see money</span>', '', '', '', '', '', actions ? actions(t) : '']];
    return ms.map((m, i) => [i ? '' : first, i ? '' : esc(periodLabel(t.period_type, t.period)), i ? '' : esc(t.category || 'Every category'), `${esc(m.label)}: <b>${m.fmt(m.goal)}</b>`, m.gotFig, m.fmt(m.rem), `${bar(m.p)} <b>${m.p}%</b>`,
      m.notStarted ? '<span class="muted">Not started</span>' : m.fmt(m.should) + (m.got >= m.should ? ' <span class="badge ok">ahead</span>' : ' <span class="badge warn">behind</span>'),
      m.ended ? '<span class="muted">Ended</span>' : m.rem ? m.fmt(m.key === 'value' ? Math.ceil(m.perDay) : Math.ceil(m.perDay * 10) / 10) + '<span class="small muted"> a day</span>' : '<span class="badge ok">Reached</span>', i || !actions ? '' : actions(t)]); });
  return `<div data-tg-table>${table(['Target for', 'Period', 'Category', 'Target', 'Achieved', 'Remaining', '%', 'Should be at today', 'Needed per day', ''], rows)}</div>`;
}
/* ---- Targets: set them, see them */
EM.tgF = { period: 'month', from: '', to: '', seg: '', level: '', who: '', cat: '', field: '', fq: '' };
DF_STATE.tg = () => EM.tgF;
const TG_FIELDS = [['name', 'Target for'], ['level', 'Kind'], ['period', 'Period'], ['category', 'Category'], ['notes', 'Notes']];
const tgText = t => ({ name: tgName(t), level: TARGET_LEVELS[t.level], period: periodLabel(t.period_type, t.period), category: t.category || 'Every category', notes: t.notes || '' });
function tgFiltered() {
  const f = EM.tgF, fq = f.fq.trim().toLowerCase();
  return TGS().filter(t => (EM.div === 'both' || t.division === EM.div) && (!f.seg || t.division === f.seg) && (!f.level || t.level === f.level) && (!f.who || t.subject === f.who) && (!f.cat || (t.category || '') === f.cat)
    && tgRunsIn(t, f)
    && (!fq || (f.field ? [tgText(t)[f.field]] : Object.values(tgText(t))).some(v => String(v).toLowerCase().includes(fq)))
    && matches(Object.values(tgText(t)).join(' '), []))
    .sort((a, b) => ['company', 'role', 'team', 'person'].indexOf(a.level) - ['company', 'role', 'team', 'person'].indexOf(b.level) || a.start_on.localeCompare(b.start_on) || tgName(a).localeCompare(tgName(b)));
}
EM.VIEWS.targets = () => {
  if (!allowedTab('targets')) return EM.noAccess('Targets belong to roles that hold business records.');
  whyReset();
  const f = EM.tgF, all = TGS().filter(t => EM.div === 'both' || t.division === EM.div), rows = tgFiltered(), set = canSetT();
  const sel = (k, label, opts) => `<label class="field" style="min-width:160px"><span class="small muted">${label}</span><select class="input" data-tgf="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const whos = [...new Set(all.map(t => t.subject).filter(Boolean))].map(id => [id, D.staff.some(s => s.id === id) ? staffName(id) : roleName(id)]).sort((a, b) => a[1].localeCompare(b[1]));
  const acts = t => set ? `<div class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn sm ghost" data-act="tg-edit" data-id="${t.id}">Edit</button><button class="btn sm ghost" data-act="tg-del" data-id="${t.id}">Remove</button></div>` : '';
  return `<div class="stack">${crumbs(['Analysis', '#/analysis/targets'], ['Targets'])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">${esc(scopeLabel())}</div><h1>Targets</h1>
      <p class="muted" style="max-width:820px">A target per person, per team (a manager and everyone who reports to them), per department or role, or for the company, by month, quarter or financial year. Achievement is counted only from what is saved: EGO Premium from orders that reached Invoiced, by invoice date, before GST; Big E from retail sales won, by the date they were won. Click any achieved figure to see the sales behind it. When Tally is connected it will fill in the invoices by itself.</p></div>
      <div class="row" style="flex-wrap:wrap">${set ? `<button class="btn primary" data-act="tg-add">+ Set a target</button><button class="btn" data-act="tg-sample">Sample Excel</button><label class="btn" style="cursor:pointer" data-list-only>Upload Excel<input type="file" data-sheet="targets" accept=".xlsx" hidden></label>` : ''}</div></div>
    ${EM.tgImp ? tgImportPreview() : ''}
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-tg-filters>${dateFilter(f, 'tg', 'Targets running in')}
      ${EM.div === 'both' ? sel('seg', 'Company', [['', 'EGO Premium and Big E'], ['wholesale', 'EGO Premium'], ['retail', 'Big E']]) : ''}${sel('level', 'Target for', [['', 'Every kind'], ...Object.entries(TARGET_LEVELS)])}
      ${sel('who', 'Who', [['', 'Everyone'], ...whos])}${sel('cat', 'Category', [['', 'Any category'], ...D.lists.categories.map(c => [c, c])])}
      ${sel('field', 'Any field', [['', 'Any field'], ...TG_FIELDS])}<label class="field" style="min-width:160px"><span class="small muted">contains</span><input class="input" id="tg-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
    ${searchBox('Person, team, role, period or category')}
    ${rows.length ? tgTable(rows, acts) + '<p class="small muted">Should be at today: the target spread evenly over every day of its period, up to today. Needed per day: what is still to reach, divided by the days left (today included).</p>'
      : empty(all.length ? 'No target for this filter' : 'No targets yet', all.length ? 'Change or clear the filters above (the period filter shows targets running in it).' : set ? 'Set a target for a person, a team, a department or the company, or fill the sample Excel and upload it.' : 'Your manager sets targets; yours will show here with how far you have got.', set && !all.length ? '<button class="btn primary" data-act="tg-add">+ Set a target</button>' : '')}</div>`;
};
EM.VIEWS.targets.tab = 'analysis';
EM.VIEWS.targets.title = () => 'Targets';
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.tgf; if (k) { EM.tgF[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'tg-fq') { EM.tgF.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#tg-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
/* who a target can be for, from this login: the Owner and founders anyone; anyone else the people who report to them */
const tgSettablePeople = () => { const all = isOwner() || D.access.scope === 'all'; return D.staff.filter(s => s.active && (all || under(me().id).includes(s.id))); };
const tgLevels = () => isOwner() || D.access.scope === 'all' ? Object.entries(TARGET_LEVELS) : Object.entries(TARGET_LEVELS).filter(([k]) => ['person', 'team'].includes(k));
function openTargetForm(t) {
  const v = t || { division: EM.div === 'retail' ? 'retail' : 'wholesale', level: 'person', period_type: 'month', period: today().slice(0, 7), category: '' };
  const opts = periodOptions(today()), ppl = tgSettablePeople(), heads = ppl.filter(s => D.staff.some(x => x.reports_to === s.id && x.active));
  const divs = D.user.division === 'both' ? [['wholesale', 'EGO Premium'], ['retail', 'Big E']] : [[D.user.division, tgDivName(D.user.division)]];
  const o = (list, cur) => list.map(([k, l]) => `<option value="${esc(k)}" ${k === cur ? 'selected' : ''}>${esc(l)}</option>`).join('');
  if (t && !opts.some(x => x.type === t.period_type && x.key === t.period)) opts.unshift({ type: t.period_type, key: t.period, label: periodLabel(t.period_type, t.period) });
  EM.modal(`<h2>${t ? 'Change the target' : 'Set a target'}</h2><p class="muted small">Value before GST is compulsory; boxes, sq ft and new dealers are optional (new dealers are for EGO Premium). Boxes and sq ft are the whole boxes and sq ft supplied on each sale. Achievement fills itself from invoiced sales.</p>
    <form id="tgf" class="stack" onsubmit="return false" style="margin-top:14px"><div class="fgrid">
      <div class="field"><label for="tgf-div">Company *</label><select class="input" id="tgf-div">${o(divs, v.division)}</select></div>
      <div class="field"><label for="tgf-level">Target for *</label><select class="input" id="tgf-level" data-tgf-level>${o(tgLevels(), v.level)}</select></div>
      <div class="field" data-tgf-part="person"><label for="tgf-person">Person *</label><select class="input" id="tgf-person"><option value="">Choose</option>${o(ppl.map(s => [s.id, `${s.name} · ${roleName(s.role)}`]), v.level === 'person' ? v.subject : '')}</select></div>
      <div class="field" data-tgf-part="team"><label for="tgf-team">Team of *</label><select class="input" id="tgf-team"><option value="">Choose the manager</option>${o(heads.map(s => [s.id, `${s.name} and ${under(s.id).length} under them`]), v.level === 'team' ? v.subject : '')}</select></div>
      <div class="field" data-tgf-part="role"><label for="tgf-role">Department or role *</label><select class="input" id="tgf-role"><option value="">Choose</option>${o(D.roles.filter(r => r.scope !== 'none').map(r => [r.id, r.name]), v.level === 'role' ? v.subject : '')}</select></div>
      <div class="field"><label for="tgf-ptype">Period *</label><select class="input" id="tgf-ptype" data-tgf-ptype>${o(Object.entries(TARGET_PERIODS), v.period_type)}</select></div>
      <div class="field"><label for="tgf-period">Which *</label><select class="input" id="tgf-period">${opts.map(x => `<option value="${esc(x.key)}" data-pt="${x.type}" ${x.type === v.period_type && x.key === v.period ? 'selected' : ''} ${x.type === v.period_type ? '' : 'hidden disabled'}>${esc(x.label)}</option>`).join('')}</select></div>
      <div class="field"><label for="tgf-cat">Category</label><select class="input" id="tgf-cat"><option value="">Every category</option>${o(D.lists.categories.map(c => [c, c]), v.category)}</select></div>
      <div class="field"><label for="tgf-value">Value before GST *</label>${G.adorn({ type: 'money', key: 'value' }, `<input class="input" type="number" min="0" step="1" id="tgf-value" value="${esc(v.value || '')}">`)}</div>
      <div class="field"><label for="tgf-boxes">Boxes</label><input class="input" type="number" min="0" step="1" id="tgf-boxes" value="${esc(v.boxes || '')}"></div>
      <div class="field"><label for="tgf-sqft">Sq ft</label><input class="input" type="number" min="0" step="1" id="tgf-sqft" value="${esc(v.sqft || '')}"></div>
      <div class="field" data-tgf-ws><label for="tgf-nd">New dealers</label><input class="input" type="number" min="0" step="1" id="tgf-nd" value="${esc(v.new_dealers || '')}"></div>
      <div class="field span2"><label for="tgf-notes">Notes</label><textarea class="input" id="tgf-notes" rows="2">${esc(v.notes || '')}</textarea></div></div>
      ${errBox('tgf-err')}<div class="row sticky-actions"><button class="btn primary" data-act="tg-save" data-id="${t ? t.id : ''}">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
  tgFormSync();
}
const tgFormSync = () => { const lv = qs('#tgf-level'), pt = qs('#tgf-ptype'), dv = qs('#tgf-div'); if (!lv) return;
  document.querySelectorAll('[data-tgf-part]').forEach(x => { x.hidden = x.dataset.tgfPart !== lv.value; });
  document.querySelectorAll('[data-tgf-ws]').forEach(x => { x.hidden = dv.value === 'retail'; });
  const sel = qs('#tgf-period'); let keep = false;
  [...sel.options].forEach(op => { const on = op.dataset.pt === pt.value; op.hidden = !on; op.disabled = !on; if (on && op.selected) keep = true; });
  if (!keep) { const first = [...sel.options].find(op => op.dataset.pt === pt.value && (pt.value !== 'month' || op.value === today().slice(0, 7))) || [...sel.options].find(op => op.dataset.pt === pt.value); if (first) sel.value = first.value; } };
document.addEventListener('change', e => { if (e.target.matches('#tgf-level, #tgf-ptype, #tgf-div')) tgFormSync(); });
EM.ACTIONS['tg-add'] = () => openTargetForm(null);
EM.ACTIONS['tg-edit'] = el => openTargetForm(TGS().find(t => t.id === el.dataset.id));
EM.ACTIONS['tg-save'] = async el => {
  const level = qs('#tgf-level').value;
  const b = { division: qs('#tgf-div').value, level, subject: level === 'company' ? '' : (qs('#tgf-' + level) || {}).value || '', period_type: qs('#tgf-ptype').value, period: qs('#tgf-period').value, category: qs('#tgf-cat').value,
    value: qs('#tgf-value').value, boxes: qs('#tgf-div').value === 'retail' ? '' : qs('#tgf-boxes').value, sqft: qs('#tgf-sqft').value, new_dealers: qs('#tgf-div').value === 'retail' ? '' : qs('#tgf-nd').value, notes: qs('#tgf-notes').value };
  if (el.dataset.id) b.id = el.dataset.id;
  busy(el, true);
  try { await API('POST', '/api/targets', b); window.EGOLIVE.refresh(await API('GET', '/api/bootstrap')); EM.closeModal(); EM.toast(`<b>Target saved</b><ul><li>${esc(periodLabel(b.period_type, b.period))}</li></ul>`); }
  catch (x) { busy(el, false); showErr('tgf-err', x.errors || x.message); }
};
EM.ACTIONS['tg-del'] = async el => {
  const t = TGS().find(x => x.id === el.dataset.id); if (!t) return;
  busy(el, true);
  try { const r = await API('DELETE', '/api/targets/' + t.id); window.EGOLIVE.refresh(await API('GET', '/api/bootstrap'));
    EM.toast(`<b>Target removed</b>: ${esc(tgName(t))}, ${esc(periodLabel(t.period_type, t.period))}. In the Recycle bin for 30 days. ${r.bin_id ? `<button class="btn sm" data-act="tg-undo" data-id="${r.bin_id}">Undo</button>` : ''}`, 9000); }
  catch (x) { busy(el, false); bubbleNear(el, x.message); }
};
EM.ACTIONS['tg-undo'] = async el => { busy(el, true); try { await API('POST', `/api/bin/${el.dataset.id}/restore`, {}); window.EGOLIVE.refresh(await API('GET', '/api/bootstrap')); EM.toast('<b>Target put back</b>'); } catch (x) { busy(el, false); bubbleNear(el, x.message); } };
/* ---- the Excel file for targets: built at download from today's team, roles, categories and periods, with real dropdowns */
const EXCELJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
const TG_SHEET = [['Company', 'company', true, 'EGO Premium or Big E.'], ['Target for', 'level', true, 'A person, A team (the manager and everyone who reports to them), A department or role, or The company.'],
  ['Who', 'who', false, 'The person (or the manager, for a team) as named in Team & access, or the role. Leave empty for The company.'], ['Period', 'period', true, 'A month (Oct 2026), a quarter (Q3 2026-27) or a financial year (2026-27).'],
  ['Category', 'category', false, 'Leave empty for every category.'], ['Value before GST (Rs)', 'value', true, 'Rupees, before GST. A number above 0.'], ['Boxes', 'boxes', false, 'EGO Premium only. Optional.'],
  ['Sq ft', 'sqft', false, 'Optional.'], ['New dealers', 'new_dealers', false, 'EGO Premium only. Optional.'], ['Notes', 'notes', false, 'Optional.']];
EM.ACTIONS['tg-sample'] = async el => {
  busy(el, true);
  try {
    await loadJs(EXCELJS_URL, () => window.ExcelJS);
    const wb = new window.ExcelJS.Workbook(), fill = wb.addWorksheet('Fill this'), how = wb.addWorksheet('How to fill'), ex = wb.addWorksheet('Examples'), lists = wb.addWorksheet('Lists');
    const ppl = tgSettablePeople(), roles = isOwner() || D.access.scope === 'all' ? D.roles.filter(r => r.scope !== 'none').map(r => r.name) : [];
    const L = { company: D.user.division === 'both' ? ['EGO Premium', 'Big E'] : [tgDivName(D.user.division)], level: tgLevels().map(([, l]) => l), who: [...ppl.map(s => s.name), ...roles], period: periodOptions(today()).map(x => x.label), category: D.lists.categories };
    Object.entries(L).forEach(([k, vals], i) => { lists.getCell(1, i + 1).value = k; vals.forEach((v, r) => { lists.getCell(r + 2, i + 1).value = v; }); });
    lists.state = 'hidden';
    fill.columns = TG_SHEET.map(([h, , req]) => ({ header: h + (req ? ' *' : ''), width: Math.max(16, h.length + 6) }));
    fill.getRow(1).font = { bold: true }; fill.views = [{ state: 'frozen', ySplit: 1 }];
    TG_SHEET.forEach(([, k, req], i) => { const letter = fill.getColumn(i + 1).letter, li = Object.keys(L).indexOf(k);
      for (let r = 2; r <= 301; r++) { const cell = fill.getCell(letter + r);
        if (li >= 0) { const col = lists.getColumn(li + 1).letter; cell.dataValidation = { type: 'list', allowBlank: !req, formulae: [`Lists!$${col}$2:$${col}$${Math.max(2, L[k].length + 1)}`], showErrorMessage: true, errorTitle: 'Pick from the list', error: 'Choose a value from the dropdown.' }; }
        else if (k !== 'notes') cell.dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: !req, formulae: [0], showErrorMessage: true, error: 'A number, 0 or more.' }; } });
    how.getCell('A1').value = 'EGO Master: targets'; how.getCell('A1').font = { bold: true, size: 14 };
    how.getCell('A2').value = 'Fill the "Fill this" tab, one target per row. Columns with * are compulsory. The dropdowns hold today\'s team, roles, categories and periods.';
    how.getCell('A3').value = `Made on ${today()} by ${me().name}. Upload it on the Targets screen: every row is checked and shown as new, update or a mistake before anything is saved. A target already set for the same person, period and category is updated.`;
    how.getCell('A5').value = 'Column'; how.getCell('B5').value = 'Compulsory'; how.getCell('C5').value = 'What goes in it'; how.getRow(5).font = { bold: true };
    TG_SHEET.forEach(([h, , req, note], i) => { how.getCell('A' + (6 + i)).value = h; how.getCell('B' + (6 + i)).value = req ? 'Yes' : 'No'; how.getCell('C' + (6 + i)).value = note; });
    how.getColumn(1).width = 26; how.getColumn(3).width = 90;
    ex.addRow(TG_SHEET.map(x => x[0])).font = { bold: true };
    const p0 = periodOptions(today()), m = p0.find(x => x.key === today().slice(0, 7)) || p0[0], q = p0.find(x => x.type === 'quarter' && periodRange('quarter', x.key).end >= today()) || p0[12];
    ex.addRow([L.company[0], 'A person', ppl[0] ? ppl[0].name : 'Name as in Team & access', m.label, '', 500000, 400, '', 2, 'Example only']);
    ex.addRow([L.company[0], 'The company', '', q.label, D.lists.categories[0] || '', 2500000, '', '', '', 'Example only']);
    const buf = await wb.xlsx.writeBuffer(), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.download = `EGO Master targets ${today()}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    EM.toast('The targets file is downloading, with today\'s team, roles, categories and periods in its dropdowns.');
  } catch (x) { bubbleNear(el, x.message); }
  busy(el, false);
};
EM.tgImp = null;
document.addEventListener('change', async e => {
  if (!e.target.matches('input[data-sheet="targets"]')) return;
  const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
  try {
    await loadJs(EXCELJS_URL, () => window.ExcelJS);
    const wb = new window.ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.getWorksheet('Fill this') || wb.worksheets[0], heads = [], rows = [];
    const txt = v => v == null ? '' : typeof v === 'object' ? (v.text || v.result || (v.richText ? v.richText.map(x => x.text).join('') : '')) : String(v);
    ws.getRow(1).eachCell((c, i) => { heads[i] = txt(c.value).replace(/\s*\*$/, '').trim(); });
    ws.eachRow((r, n) => { if (n === 1) return; const x = { row: n }; let any = false;
      TG_SHEET.forEach(([h, k]) => { const i = heads.indexOf(h); const v = i > 0 ? txt(r.getCell(i).value).trim() : ''; if (v) any = true; x[k] = v; });
      if (any) rows.push(x); });
    if (!rows.length) throw new Error('No filled rows in the "Fill this" tab.');
    const res = await API('POST', '/api/targets/import', { rows, save: false });
    EM.tgImp = { file: file.name, rows, res: res.rows }; EM.rerender();
  } catch (x) { EM.tgImp = { file: file.name, error: x.message, rows: [], res: [] }; EM.rerender(); }
});
function tgImportPreview() {
  const I = EM.tgImp, cnt = s => I.res.filter(r => r.status === s).length;
  return `<section class="card stack-s" data-tg-import><div class="row between"><h3>Read: ${esc(I.file)}</h3><button class="btn sm ghost" data-act="tg-imp-close">Close</button></div>
    ${I.error ? `<div class="callout warn">${esc(I.error)}</div>` : `<p class="small">${num(cnt('new'))} new · ${num(cnt('update'))} update · <b>${num(cnt('error'))} with a mistake</b>. ${I.saved ? 'Saved.' : 'Nothing is saved until you press Save.'}</p>
    ${table(['Row', 'Status', 'Target', 'Mistake'], I.res.map(r => [String(r.row), `<span class="badge ${r.status === 'error' ? 'bad' : r.status === 'new' ? 'ok' : 'info'}">${r.status === 'error' ? 'Mistake' : r.status === 'new' ? 'New' : 'Update'}</span>`, esc(r.label), esc(r.error)]))}
    ${!I.saved && (cnt('new') + cnt('update')) ? `<div class="row"><button class="btn primary" data-act="tg-imp-save">Save the ${num(cnt('new') + cnt('update'))} good rows${cnt('error') ? ' (rows with a mistake are skipped)' : ''}</button></div>` : ''}`}</section>`;
}
EM.ACTIONS['tg-imp-close'] = () => { EM.tgImp = null; EM.rerender(); };
EM.ACTIONS['tg-imp-save'] = async el => {
  busy(el, true);
  try { const r = await API('POST', '/api/targets/import', { rows: EM.tgImp.rows, save: true }); EM.tgImp = { ...EM.tgImp, res: r.rows, saved: true }; window.EGOLIVE.refresh(await API('GET', '/api/bootstrap')); EM.toast(`<b>${r.rows.filter(x => x.status !== 'error').length} targets saved</b>`); }
  catch (x) { busy(el, false); bubbleNear(el, x.message); }
};
/* ---- the headline target for a Home: mine, my team's, or the company's, this month */
function homeTarget(level) {
  const month = today().slice(0, 7), divs = EM.div === 'both' ? ['wholesale', 'retail'] : [EM.div];
  const list = TGS().filter(t => t.period_type === 'month' && t.period === month && !t.category && divs.includes(t.division) && t.level === level && (level === 'company' || t.subject === me().id));
  const href = '#/targets', label = level === 'company' ? 'Company target this month' : level === 'team' ? 'Team target this month' : 'My target this month';
  if (!list.length) return tile(label, 'Not set', D.access.can_targets ? 'Set one on Targets' : 'Targets are set by your manager', href);
  const ms = list.map(t => [t, tgAchieved(t)]), P = D.access.prices;
  const goal = ms.reduce((a, [t]) => a + (P ? t.value : t.boxes || 0), 0), got = ms.reduce((a, [, x]) => a + (P ? x.value : x.boxes), 0);
  if (!goal) return tile(label, 'Value only', 'your role does not see money', href);
  return tile(label, `${pct(got, goal)}%`, P ? `${inr0(got)} of ${inr0(goal)} before GST` : `${num(got)} of ${num(goal)} boxes`, href);
}

/* ---------------------------------------------------------------- Analysis: five tabs, every figure from saved records */
EM.anF = { co: '', period: 'month', from: '', to: '', who: '', region: '' };
DF_STATE.an = () => EM.anF;
const AN_TABS = [['sales', 'Sales'], ['pipeline', 'Pipeline'], ['followups', 'Follow-ups'], ['fulfilment', 'Fulfilment'], ['targets', 'Targets']];
const anCo = () => EM.anF.co || EM.div;
const anPeople = () => { const w = EM.anF.who; if (!w) return null; const [k, id] = w.split(':'); return k === 't' ? [id, ...under(id)] : [id]; };
const anWhoOk = id => { const p = anPeople(); return !p || p.includes(id); };
const anRegionOk = r => !EM.anF.region || r === EM.anF.region;
const anIn = d => inPeriod(dayTs(d), EM.anF.period, EM.anF.from, EM.anF.to);
const anPeriodTxt = () => EM.anF.period === 'custom' ? `${EM.anF.from ? ds(EM.anF.from) : 'the start'} to ${EM.anF.to ? ds(EM.anF.to) : 'today'}` : (PERIODS.find(x => x[0] === EM.anF.period) || ['', ''])[1].toLowerCase();
const anFilterTxt = () => [`dates: ${anPeriodTxt()}`, EM.anF.who ? `person: ${EM.anF.who.startsWith('t:') ? 'team of ' : ''}${staffName(EM.anF.who.slice(2))}` : '', EM.anF.region ? `region: ${EM.anF.region}` : '', `company: ${SEG[anCo()]}`].filter(Boolean).join(', ');
EM.anCsv = [];
const anSec = (title, head, rows, note, attr) => { EM.anCsv.push([title, head, rows]); return `<section class="card stack-s" ${attr || ''}><h3>${esc(title)}</h3>${note ? `<p class="small muted">${note}</p>` : ''}${rows.length ? table(head, rows) : '<p class="small muted">Nothing for this filter.</p>'}</section>`; };
const groupBy = (list, key) => { const m = new Map(); for (const x of list) { const k = key(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return [...m.entries()]; };
/* ---- Sales */
function anSales() {
  const P = D.access.prices, co = anCo(), list = salesList().filter(s => (co === 'both' || s.div === co) && anIn(s.at) && anWhoOk(s.owner) && anRegionOk(s.region)).map(s => [s, saleMeasure(s, '')]);
  const rule = 'EGO Premium: orders that reached Invoiced, by invoice date, value before GST. Big E: retail sales won, by the date won, at the value on the opportunity.';
  const sum = (a, k) => a.reduce((t, [, m]) => t + m[k], 0), f = EM.anF;
  const figs = (a, title) => [...(P ? [fig(inr0(sum(a, 'value')), { title, calc: `The sum of the value before GST of these sales. ${rule} Filter: ${anFilterTxt()}.`, head: SALE_HEAD(), rows: a.map(([s, m]) => saleRow(s, m)) })] : []), fig(num(a.length), { title, calc: `The number of sales. ${rule} Filter: ${anFilterTxt()}.`, head: SALE_HEAD(), rows: a.map(([s, m]) => saleRow(s, m)) }), num(sum(a, 'boxes'))];
  const head = first => [first, ...(P ? ['Value before GST'] : []), 'Sales', 'Boxes'];
  const byMonth = groupBy(list, ([s]) => s.at.slice(0, 7)).sort((a, b) => b[0].localeCompare(a[0])).map(([k, a]) => [esc(periodLabel('month', k)), ...figs(a, `Sales in ${periodLabel('month', k)}`)]);
  const byPerson = groupBy(list, ([s]) => s.owner).map(([k, a]) => [[esc(staffName(k)), ...figs(a, `Sales by ${staffName(k)}`)], sum(a, 'value') || a.length]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const byRegion = groupBy(list, ([s]) => s.region || 'Not set').map(([k, a]) => [esc(k), ...figs(a, `Sales in the ${k} region`)]);
  /* categories and collections: the design lines of invoiced orders (Big E sales carry products, not designs) */
  const lines = list.filter(([s]) => s.div === 'wholesale').flatMap(([s]) => s.lines.map(l => ({ s, l })));
  const lineFigs = (a, title) => [...(P ? [fig(inr0(a.reduce((t, x) => t + x.l.amount, 0)), { title, calc: `The sum of the line amounts (sq ft supplied x rate per sq ft, or pieces or rft x rate for accessories; before GST) of these designs on invoiced EGO Premium orders. Other charges on an order are not in any category. Filter: ${anFilterTxt()}.`, head: ['Order', 'Date', 'Design', 'Boxes', 'Sq ft supplied', ...(P ? ['Line amount'] : [])], rows: a.map(x => ({ href: x.s.href, cells: [esc(x.s.ref), ds(x.s.at), esc(x.l.product), num(x.l.boxes), num(Math.round(x.l.sqft)), ...(P ? [inr0(x.l.amount)] : [])] })) })] : []), num(a.reduce((t, x) => t + x.l.boxes, 0)), num(Math.round(a.reduce((t, x) => t + x.l.sqft, 0)))];
  const lhead = first => [first, ...(P ? ['Value before GST'] : []), 'Boxes', 'Sq ft'];
  const byCat = groupBy(lines, x => x.l.category).map(([k, a]) => [esc(k), ...lineFigs(a, `${k}: designs invoiced`)]);
  const byCol = groupBy(lines, x => `${x.l.category} · ${x.l.collection}`).map(([k, a]) => [esc(k), ...lineFigs(a, `${k}: designs invoiced`)]);
  const byDealer = groupBy(list, ([s]) => s.client_id).map(([k, a]) => [k, a, sum(a, 'value'), a.map(([s]) => s.at).sort().pop()]).sort((a, b) => b[2] - a[2] || b[1].length - a[1].length);
  const dealerRows = byDealer.slice(0, 25).map(([k, a, , last]) => [`<a href="#/client/${k}"><b>${esc(clientName(k))}</b></a>`, ...figs(a, `Sales to ${clientName(k)}`), ds(last)]);
  /* dormant: dealers who bought before and have no invoice in the last 90 days (the date filter does not apply) */
  const fi = salesList().filter(s => s.div === 'wholesale' && co !== 'retail' && anWhoOk(s.owner) && anRegionOk(s.region));
  const lastBy = {}; for (const s of fi) if (!lastBy[s.client_id] || s.at > lastBy[s.client_id].at) lastBy[s.client_id] = s;
  const cut = new Date(Date.parse(today()) - 90 * 864e5).toISOString().slice(0, 10);
  const dormant = Object.values(lastBy).filter(s => s.at < cut && DEALER_KINDS.includes((CL()[s.client_id] || {}).kind)).sort((a, b) => a.at.localeCompare(b.at));
  const nd = Object.values(firstInvoices()).filter(s => anIn(s.at) && anWhoOk(s.owner) && anRegionOk(s.region) && co !== 'retail');
  const tiles = `<div class="grid g4">${P ? tile('Invoiced and won', fig(inr0(sum(list, 'value')), { title: 'All sales', calc: `The sum of the value before GST of every sale. ${rule} Filter: ${anFilterTxt()}.`, head: SALE_HEAD(), rows: list.map(([s, m]) => saleRow(s, m)) }), 'before GST') : ''}${tile('Sales', fig(num(list.length), { title: 'All sales', calc: `${rule} Filter: ${anFilterTxt()}.`, head: SALE_HEAD(), rows: list.map(([s, m]) => saleRow(s, m)) }))}${tile('Boxes invoiced', num(sum(list, 'boxes')))}${tile('New dealers', fig(num(nd.length), { title: 'New dealers', calc: `Dealers whose first invoiced order in EGO Master is dated inside the filter. Filter: ${anFilterTxt()}.`, head: ['Dealer', 'First invoice', 'Order', 'Person'], rows: nd.map(s => ({ href: '#/client/' + s.client_id, cells: [`<b>${esc(clientName(s.client_id))}</b>`, ds(s.at), esc(s.ref), esc(staffName(s.owner))] })) }), 'first invoice in the dates')}</div>`;
  return `${tiles}<p class="small muted">${esc(rule)} Click a figure to see the sales behind it.</p>
    <div class="grid g2">${anSec('By month', head('Month'), byMonth)}${anSec('By person', head('Person'), byPerson)}</div>
    <div class="grid g2">${anSec('By region', head('Region'), byRegion)}${anSec('By category', lhead('Category'), byCat, 'From the designs on invoiced EGO Premium orders.')}</div>
    ${anSec('By collection', lhead('Category · collection'), byCol)}
    ${anSec('Top dealers and clients', [...head('Client'), 'Last sale'], dealerRows, byDealer.length > 25 ? `The 25 highest of ${byDealer.length}.` : '', 'data-an-top')}
    ${co !== 'retail' ? anSec('Dormant dealers', ['Dealer', 'Last invoice', 'Order', 'Person', 'Days since'], dormant.map(s => ({ href: '#/client/' + s.client_id, cells: [`<b>${esc(clientName(s.client_id))}</b>`, ds(s.at), esc(s.ref), esc(staffName(s.owner)), num(Math.round((Date.parse(today()) - Date.parse(s.at)) / 864e5))] })), 'Dealers who have bought before and have no invoice in the last 90 days. The date filter does not apply here.', 'data-an-dormant') : ''}`;
}
/* ---- Pipeline */
function anPipeline() {
  const P = D.access.prices, co = anCo(), t = today(), pipes = Object.keys(PIPELINES).filter(p => co === 'both' || PIPELINES[p].division === co);
  const os = D.opportunities.filter(o => pipes.includes(o.pipeline) && anWhoOk(o.owner_id) && anRegionOk(o.region || ''));
  const oppRow = o => ({ href: '#/opp/' + o.id, cells: [`<b>${esc(o.title)}</b><div class="small muted">${esc(o.ref || '')}</div>`, esc(clientName(o.client_id)), esc(o.stage), esc(staffName(o.owner_id)), ...(P ? [o.value ? inr0(o.value) : ''] : [])] });
  const OH = () => ['Opportunity', 'Client', 'Stage', 'Owner', ...(P ? ['Value'] : [])];
  let out = '';
  for (const p of pipes) {
    const S = (D.lists.stages[p] || []).filter(s => s !== lostStage(p, D.lists)), mine = os.filter(o => o.pipeline === p);
    const open = mine.filter(isOpen);
    const openRows = S.filter(s => !isClosed(p, s, D.lists)).map(s => { const a = open.filter(o => o.stage === s); return [esc(s), fig(num(a.length), { title: `Open at ${s}`, calc: `Opportunities of this pipeline at ${s} right now (the date filter does not apply). Filter: person and region.`, head: OH(), rows: a.map(oppRow) }), ...(P ? [fig(inr0(sumV(a)), { title: `Open value at ${s}`, calc: 'The sum of the values entered on these opportunities.', head: OH(), rows: a.map(oppRow) })] : [])]; });
    /* the funnel: opportunities created in the dates, and the furthest stage each reached (from its stage history) */
    const born = mine.filter(o => anIn(dayIST(o.created_at)));
    const reach = o => { const idx = [o.stage, ...D.history.filter(h => h.opp_id === o.id).flatMap(h => [h.from_stage, h.to_stage])].map(s => S.indexOf(s)); return Math.max(...idx); };
    const conv = S.map((s, i) => { const a = born.filter(o => reach(o) >= i), b = born.filter(o => reach(o) >= i + 1);
      return [esc(s), fig(num(a.length), { title: `Reached ${s}`, calc: `Opportunities created in the dates whose stage history reaches ${s} or a later stage.`, head: OH(), rows: a.map(oppRow) }), i < S.length - 1 ? num(b.length) : '', i < S.length - 1 ? (a.length ? `${pct(b.length, a.length)}%` : '') : '']; });
    /* days in each stage: every stage left in the dates, from the move in to the move out */
    const spans = []; for (const o of mine) { const h = D.history.filter(x => x.opp_id === o.id).sort((a, b) => String(a.at).localeCompare(String(b.at))); const start = [{ to_stage: (h[0] && h[0].from_stage) || null, at: o.created_at }, ...h];
      for (let i = 0; i < start.length - 1; i++) if (start[i].to_stage && anIn(dayIST(start[i + 1].at))) spans.push({ o, stage: start[i].to_stage, days: (Date.parse(String(start[i + 1].at).replace(' ', 'T') + (/Z|\+/.test(start[i + 1].at) ? '' : 'Z')) - Date.parse(String(start[i].at).replace(' ', 'T') + (/Z|\+/.test(start[i].at) ? '' : 'Z'))) / 864e5 }); }
    const days = S.map(s => { const a = spans.filter(x => x.stage === s); return [esc(s), num(a.length), a.length ? fig((a.reduce((t2, x) => t2 + x.days, 0) / a.length).toFixed(1), { title: `Days at ${s}`, calc: `The average number of days between moving into ${s} and moving out of it, over every move out made in the dates (from the stage history).`, head: ['Opportunity', 'Days at this stage'], rows: a.map(x => ({ href: '#/opp/' + x.o.id, cells: [esc(x.o.title), x.days.toFixed(1)] })) }) : '', num(open.filter(o => o.stage === s).length)]; });
    const closed = mine.filter(o => isClosed(p, o.stage, D.lists) && anIn(dayIST(o.closed_at || o.updated_at))), won = closed.filter(isWon), lost = closed.filter(o => o.stage === lostStage(p, D.lists));
    out += `<section class="stack-s" data-an-pipe="${p}"><h2>${esc(PIPELINES[p].plural)}</h2>
      <div class="grid g4">${tile('Open now', fig(num(open.length), { title: 'Open now', calc: 'Opportunities not won or lost, right now.', head: OH(), rows: open.map(oppRow) }), P ? inr0(sumV(open)) : '')}${tile(`Won (${wonStage(p, D.lists)})`, fig(num(won.length), { title: 'Won in the dates', calc: `Opportunities moved to ${wonStage(p, D.lists)} in the dates.`, head: OH(), rows: won.map(oppRow) }), P ? inr0(sumV(won)) : '')}${tile('Lost', fig(num(lost.length), { title: 'Lost in the dates', calc: 'Opportunities moved to Lost in the dates.', head: OH(), rows: lost.map(oppRow) }), P ? inr0(sumV(lost)) : '')}${tile('Won to lost', lost.length ? `${(won.length / lost.length).toFixed(1)} : 1` : won.length ? `${won.length} : 0` : '0 : 0', closed.length ? `${pct(won.length, closed.length)}% of those closed were won` : 'none closed in the dates')}</div>
      <div class="grid g2">${anSec(`${PIPELINES[p].label}: open value by stage`, ['Stage', 'Open', ...(P ? ['Value'] : [])], openRows)}${anSec(`${PIPELINES[p].label}: conversion between stages`, ['Stage', 'Reached it', 'Went on to the next', 'Conversion'], conv, 'Opportunities created in the dates, by the furthest stage their history reached.')}</div>
      ${anSec(`${PIPELINES[p].label}: average days in each stage`, ['Stage', 'Moves out', 'Average days', 'In it now'], days, 'From the stage history: the time between moving into a stage and moving out of it, for moves out made in the dates.')}</section>`;
  }
  const lostAll = os.filter(o => o.stage === lostStage(o.pipeline, D.lists) && anIn(dayIST(o.closed_at || o.updated_at)));
  const reasons = groupBy(lostAll, o => o.lost_reason || 'Not given').sort((a, b) => b[1].length - a[1].length).map(([k, a]) => [esc(k), fig(num(a.length), { title: `Lost: ${k}`, calc: 'Opportunities lost in the dates with this reason.', head: OH(), rows: a.map(oppRow) }), ...(P ? [inr0(sumV(a))] : [])]);
  return out + anSec('Lost by reason', ['Reason', 'Lost', ...(P ? ['Value'] : [])], reasons, 'The full list, with details and the stage each was lost from, is in <a href="#/lost">Lost sales</a>.', 'data-an-lost');
}
/* ---- Follow-ups */
function anFollowups() {
  const t = today(), co = anCo(), cOk = f => { const c = CL()[f.client_id]; return (!c || co === 'both' || c.division === 'both' || c.division === co) && anRegionOk(c ? c.region || '' : ''); };
  const fus = FUS().filter(f => cOk(f) && anWhoOk(f.owner_id)), due = fus.filter(f => anIn(f.due_date));
  const onTime = f => f.status === 'done' && dayIST(f.done_at) <= f.due_date, late = f => f.status === 'done' && dayIST(f.done_at) > f.due_date, missed = f => f.status !== 'done' && f.due_date < t;
  const fuRow = f => ({ href: f.opp_id ? '#/opp/' + f.opp_id : '#/client/' + f.client_id, cells: [`<b>${esc(f.action)}</b>`, esc(clientName(f.client_id)), ds(f.due_date), esc(staffName(f.owner_id)), f.status === 'done' ? `Done ${ds(dayIST(f.done_at))}${f.outcome ? ': ' + esc(f.outcome) : ''}` : f.due_date < t ? '<span class="badge bad">Missed, still open</span>' : 'Open'] });
  const FH = ['Follow-up', 'Client', 'Due', 'Person', 'What happened'];
  const ff = (a, title, calc) => fig(num(a.length), { title, calc: calc + ` Filter: ${anFilterTxt()}.`, head: FH, rows: a.map(fuRow) });
  const byPerson = groupBy(due, f => f.owner_id).map(([k, a]) => [esc(staffName(k)), ff(a, `Due for ${staffName(k)}`, 'Follow-ups due in the dates.'), ff(a.filter(onTime), 'Done on time', 'Done on or before the day it was due.'), ff(a.filter(late), 'Done late', 'Done after the day it was due.'), ff(a.filter(missed), 'Missed', 'Past its day and still not done.'), a.length ? `${pct(a.filter(onTime).length, a.length)}%` : '']);
  const open = fus.filter(f => f.status !== 'done' && f.due_date < t), age = f => Math.round((Date.parse(t) - Date.parse(f.due_date)) / 864e5);
  const buckets = [['1 to 3 days', 1, 3], ['4 to 7 days', 4, 7], ['8 to 14 days', 8, 14], ['15 to 30 days', 15, 30], ['More than 30 days', 31, 1e9]].map(([l, a, b]) => { const x = open.filter(f => age(f) >= a && age(f) <= b); return [esc(l), ff(x, `Overdue ${l}`, 'Open follow-ups past their day by this many days, right now (the date filter does not apply).')]; });
  /* response to new leads: from the opportunity being created to its first follow-up marked done */
  const pipes = Object.keys(PIPELINES).filter(p => co === 'both' || PIPELINES[p].division === co);
  const leads = D.opportunities.filter(o => pipes.includes(o.pipeline) && anIn(dayIST(o.created_at)) && anWhoOk(o.owner_id) && anRegionOk(o.region || '')).map(o => {
    const first = FUS().filter(f => f.opp_id === o.id && f.status === 'done' && f.done_at).sort((a, b) => String(a.done_at).localeCompare(String(b.done_at)))[0];
    const ms = s => Date.parse(String(s).replace(' ', 'T') + (/Z|\+/.test(s) ? '' : 'Z'));
    return { o, first, hours: first ? Math.max(0, (ms(first.done_at) - ms(o.created_at)) / 36e5) : null };
  });
  const LH = ['Opportunity', 'Source', 'Created', 'First follow-up done', 'Hours'];
  const lrow = x => ({ href: '#/opp/' + x.o.id, cells: [`<b>${esc(x.o.title)}</b>`, esc(x.o.source || 'Not filled'), whenTxt(x.o.created_at), x.first ? whenTxt(x.first.done_at) : '<span class="badge warn">Not yet</span>', x.hours == null ? '' : x.hours.toFixed(1)] });
  const avgH = a => { const d = a.filter(x => x.hours != null); return d.length ? fig((d.reduce((s, x) => s + x.hours, 0) / d.length).toFixed(1) + ' h', { title: 'Average response time', calc: `From the opportunity being created to its first follow-up marked done, averaged over the new leads that have one. Filter: ${anFilterTxt()}.`, head: LH, rows: a.map(lrow) }) : 'None yet'; };
  const bySource = groupBy(leads, x => x.o.source || 'Not filled').map(([k, a]) => [esc(k), num(a.length), num(a.filter(x => x.first).length), avgH(a), num(a.filter(x => !x.first).length)]);
  return `<div class="grid g4">${tile('Done', ff(fus.filter(f => f.status === 'done' && anIn(dayIST(f.done_at))), 'Done in the dates', 'Follow-ups marked done in the dates.'))}${tile('Missed', ff(due.filter(missed), 'Missed', 'Due in the dates, past their day and still not done.'))}${tile('Overdue now', ff(open, 'Overdue now', 'Every open follow-up past its day, right now.'))}${tile('Average response to new leads', avgH(leads))}</div>
    ${anSec('Done and missed, by person', ['Person', 'Due in the dates', 'Done on time', 'Done late', 'Missed', 'On time'], byPerson, '', 'data-an-fu-person')}
    <div class="grid g2">${anSec('Overdue, by how long', ['Overdue by', 'Follow-ups'], buckets, 'Open follow-ups past their day, right now.')}${anSec('Response to new leads, by source', ['Source', 'New leads', 'Followed up', 'Average time', 'Not followed up yet'], bySource, 'From the opportunity being created to its first follow-up marked done.', 'data-an-response')}</div>`;
}
/* ---- Fulfilment (EGO Premium) */
function anFulfilment() {
  if (anCo() === 'retail') return '<div class="callout">Fulfilment is EGO Premium\'s order road (stock, PI, payment, invoice, dispatch). Big E\'s won sales go to Installation.</div>';
  const O = OPSD(), FS = OS_('fulfilment_stages'), t = today(), P = D.access.prices;
  const orders = O.orders.filter(o => anWhoOk(o.owner_id) && anRegionOk(o.region || ''));
  const boxesOf = o => O.lines.filter(l => l.order_id === o.id).reduce((a, l) => a + l.boxes, 0);
  const orow = o => ({ href: '#/order/' + o.id, cells: [`<b>${esc(o.ref)}</b>`, esc(clientName(o.client_id)), esc(o.ful_stage), esc(staffName(o.owner_id)), num(boxesOf(o))] });
  const OHd = ['Order', 'Dealer', 'Stage', 'Person', 'Boxes'];
  const byStage = FS.map(s => { const a = orders.filter(o => o.ful_stage === s); return [esc(s), fig(num(a.length), { title: `Orders at ${s}`, calc: 'Orders at this fulfilment stage right now.', head: OHd, rows: a.map(orow) }), num(a.reduce((x, o) => x + boxesOf(o), 0))]; });
  const ms = s => Date.parse(String(s).replace(' ', 'T') + (/Z|\+/.test(s) ? '' : 'Z'));
  const sent = orders.map(o => ({ o, paid: stageAt(o.id, FN('Payment received')), out: stageAt(o.id, FN('Dispatched')) })).filter(x => x.paid && x.out && anIn(dayIST(x.out))).map(x => ({ ...x, days: (ms(x.out) - ms(x.paid)) / 864e5 }));
  const short = orders.filter(o => [FN('Stock check'), FN('Waiting on production')].includes(o.ful_stage) && missingOf(o.id) > 0);
  const PS = OS_('production_stages'), recI = PS.indexOf(PNn('Received at warehouse'));
  const late = O.production.filter(p => p.eta && p.eta < t && PS.indexOf(p.stage) < recI);
  return `<div class="grid g4">${tile('Orders in fulfilment', fig(num(orders.filter(o => o.ful_stage !== lastOf(FS)).length), { title: 'Orders in fulfilment', calc: `Orders not yet at ${lastOf(FS)}, right now.`, head: OHd, rows: orders.filter(o => o.ful_stage !== lastOf(FS)).map(orow) }))}${tile('Payment to dispatch', sent.length ? fig((sent.reduce((a, x) => a + x.days, 0) / sent.length).toFixed(1) + ' days', { title: 'Payment received to Dispatched', calc: `For each order dispatched in the dates: the days from its move to ${FN('Payment received')} to its move to ${FN('Dispatched')} (from the fulfilment history), averaged.`, head: ['Order', 'Payment received', 'Dispatched', 'Days'], rows: sent.map(x => ({ href: '#/order/' + x.o.id, cells: [esc(x.o.ref), whenTxt(x.paid), whenTxt(x.out), x.days.toFixed(1)] })) }) : 'None yet', 'average, dispatched in the dates')}${tile('Boxes short', fig(num(short.reduce((a, o) => a + missingOf(o.id), 0)), { title: 'Boxes waiting on production', calc: 'For each order at Stock check or Waiting on production: the boxes not covered by free stock, added up.', head: ['Order', 'Dealer', 'Boxes short'], rows: short.map(o => ({ href: '#/order/' + o.id, cells: [esc(o.ref), esc(clientName(o.client_id)), num(missingOf(o.id))] })) }), `${num(short.length)} orders`)}${tile('Late production', fig(num(late.length), { title: 'Late production orders', calc: 'Production orders past their expected date and not yet received at the warehouse.', head: ['Production order', 'Design', 'Boxes', 'Expected'], rows: late.map(p => ({ href: '#/po/' + p.id, cells: [esc(p.ref), esc(prodName(p.product_id)), num(p.boxes), ds(p.eta)] })) }))}</div>
    <div class="grid g2">${anSec('Orders by stage', ['Stage', 'Orders', 'Boxes'], byStage, 'Right now.')}${anSec('Boxes waiting on production', ['Order', 'Dealer', 'Boxes short'], short.map(o => ({ href: '#/order/' + o.id, cells: [`<b>${esc(o.ref)}</b>`, esc(clientName(o.client_id)), `<span class="badge bad">${num(missingOf(o.id))}</span>`] })), '', 'data-an-short')}</div>
    <div class="grid g2">${anSec('Payment received to dispatched', ['Order', 'Days'], sent.map(x => ({ href: '#/order/' + x.o.id, cells: [esc(x.o.ref), x.days.toFixed(1)] })), 'Orders dispatched in the dates.')}${anSec('Late production orders', ['Production order', 'Design', 'Boxes', 'Expected', 'Days late'], late.map(p => ({ href: '#/po/' + p.id, cells: [`<b>${esc(p.ref)}</b>`, esc(prodName(p.product_id)), num(p.boxes), ds(p.eta), num(Math.round((Date.parse(t) - Date.parse(p.eta)) / 864e5))] })), '', 'data-an-late')}</div>`;
}
/* ---- Targets */
function anTargets() {
  const co = anCo(), list = TGS().filter(t => (co === 'both' || t.division === co) && (!EM.anF.who || anPeople().includes(t.subject) || t.level === 'company' || t.level === 'role') && tgRunsIn(t, EM.anF));
  const grp = lv => list.filter(t => t.level === lv);
  const part = (lv, title) => grp(lv).length ? `<section class="card stack-s" data-an-tg="${lv}"><h3>${title}</h3>${tgTable(grp(lv))}</section>` : '';
  return `<div class="row between"><p class="small muted" style="max-width:760px">Targets running in the dates, with how far each has got. Achievement is counted from invoiced orders (EGO Premium) and won sales (Big E). Click an achieved figure to see the sales behind it.</p><a class="btn" href="#/targets">${canSetT() ? 'Set and change targets' : 'All targets'}</a></div>
    ${list.length ? part('company', 'The company') + part('role', 'Departments and roles') + part('team', 'Teams') + part('person', 'People') : empty('No target in these dates', canSetT() ? 'Set targets on the Targets screen, one at a time or from Excel.' : 'Targets are set by the Owner, a Director or your manager.', '<a class="btn" href="#/targets">Targets</a>')}`;
}
EM.VIEWS.analysis = arg => {
  if (!allowedTab('analysis')) return EM.noAccess('Analysis belongs to roles that hold business records.');
  whyReset(); EM.anCsv = [];
  const tab = AN_TABS.some(([k]) => k === arg) ? arg : 'sales', f = EM.anF;
  const sel = (k, label, opts) => `<label class="field" style="min-width:170px"><span class="small muted">${label}</span><select class="input" data-anf="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const ppl = D.staff.filter(s => s.active && (D.access.scope === 'all' || D.access.scope === 'division' || D.access.scope === 'region' || [me().id, ...under(me().id)].includes(s.id)));
  const heads = ppl.filter(s => D.staff.some(x => x.reports_to === s.id && x.active));
  const regions = [...new Set((D.lists.cities || []).map(c => c.region).filter(Boolean))].sort();
  const body = { sales: anSales, pipeline: anPipeline, followups: anFollowups, fulfilment: anFulfilment, targets: anTargets, leads: anLeads }[tab]();
  return `<div class="stack"><div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">${esc(scopeLabel())}</div><h1>Analysis</h1>
      <p class="muted" style="max-width:820px">Counted only from what is saved in EGO Master, within what you may see. Click any figure to see the records behind it and how it is worked out.</p></div>
      <button class="btn" data-act="an-csv">Download for Excel</button></div>
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-an-filters>
      ${D.user.division === 'both' ? sel('co', 'Company', [['', `As the top switch (${SEG[EM.div]})`], ['both', 'Both companies'], ['wholesale', 'EGO Premium'], ['retail', 'Big E']]) : `<div class="field"><span class="small muted">Company</span>${segBadge(D.user.division)}</div>`}
      ${dateFilter(f, 'an', 'Dates')}${sel('who', 'Person or team', [['', 'Everyone you see'], ...ppl.map(s => ['p:' + s.id, s.name]), ...heads.map(s => ['t:' + s.id, `Team of ${s.name}`])])}${sel('region', 'Region', [['', 'Every region'], ...regions.map(r => [r, r])])}</div>
    ${subtabs('#/analysis', tab, AN_TABS)}<div class="stack" data-an-tab="${tab}">${body}</div></div>`;
};
EM.VIEWS.analysis.title = () => 'Analysis';
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.anf; if (k) { EM.anF[k] = e.target.value; EM.rerender(); } });
/* the tab as shown, as a CSV file Excel opens: every table, with its title (rupees only for roles that see money) */
EM.ACTIONS['an-csv'] = () => {
  const div = document.createElement('div'), txt = h => { div.innerHTML = String(h == null ? '' : h); return div.textContent.trim(); }, cell = v => `"${String(v).replace(/"/g, '""')}"`;
  const out = [['EGO Master analysis', (AN_TABS.find(([k]) => k === (EM.route().arg || 'sales')) || AN_TABS[0])[1], anFilterTxt(), `made ${today()} by ${me().name}`]];
  for (const [title, head, rows] of EM.anCsv) { out.push([], [title], head.map(txt)); for (const r of rows) out.push((Array.isArray(r) ? r : r.cells).map(txt)); }
  const csv = '﻿' + out.map(l => l.map(cell).join(',')).join('\r\n');
  const u = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
  a.href = u; a.download = `EGO analysis ${EM.route().arg || 'sales'} ${today()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000);
  EM.toast(`<b>${EM.anCsv.length}</b> tables downloaded.`);
};

/* ---------------------------------------------------------------- History on every window (13 Oct)
   A History button beside every screen's title opens what happened there: added, changed, deleted, by whom
   and when, old to new where the change kept it. On a record page it is that record's own history. */
const HIST_AREA = { dealers: 'dealers', architects: 'architects', design500: 'design500', people: 'people', clients: 'people', opps: 'opps', lost: 'opps', followups: 'followups', orders: 'orders', orderbook: 'orderbook', installation: 'installation', complaints: 'complaints',
  approvals: 'approvals', schemes: 'schemes', p200: 'p200', handover: 'opps', projects: 'projects', analysis: 'analysis', targets: 'targets', inventory: 'inventory', stock: 'inventory', import: 'import', lists: 'lists', team: 'team', integrations: 'integrations', bin: 'bin', attendance: 'attendance', roadmap: 'roadmap' };
const HIST_RECORD = ['client', 'opp', 'order', 'po', 'site', 'scheme', 'product', 'collection', 'project'];
function histButton() {
  const { r, arg } = EM.route(), h1 = qs('#view h1'); if (!h1 || qs('#view [data-hist-open]')) return;
  const rec = HIST_RECORD.includes(r) ? arg.split('/')[0] : '', area = rec ? '' : HIST_AREA[r];
  if (!rec && !area) return;
  h1.insertAdjacentHTML('afterend', `<div class="row" style="gap:6px"><button class="btn sm ghost" data-act="hist-open" data-hist-open data-area="${esc(area || '')}" data-record="${esc(rec)}" data-title="${esc(h1.textContent)}">History</button></div>`);
}
EM.histF = { rows: [], title: '', who: '', kind: '', period: 'all', from: '', to: '', field: '', fq: '', q: '' };
const HIST_KIND = r => /delete|remove|revoke|purge/.test(r.action) ? 'deleted' : /restore/.test(r.action) ? 'restored' : /_add$|^staff_add|^order_add|^api_key_add|^complaint_add|^site_add|^snag_add|followup_add|activity_add|doc_add|stock_/.test(r.action) ? 'added' : 'changed';
const HIST_KINDS = [['', 'Everything'], ['added', 'Added'], ['changed', 'Changed or moved'], ['deleted', 'Deleted'], ['restored', 'Put back']];
const HIST_FIELDS = [['summary', 'What happened'], ['by_name', 'Who'], ['client_name', 'Client']];
const fieldWord = k => { const f = (typeof ALL_FIELDS === 'function' ? ALL_FIELDS() : []).find(x => x.key === k); return f ? f.label : k.replace(/_id$/, '').replace(/_/g, ' '); };
const diffVal = v => v === '' || v == null ? 'empty' : typeof v === 'object' ? JSON.stringify(v) : (ST()[v] ? ST()[v].name : String(v));
function histList() {
  const H = EM.histF, fq = H.fq.trim().toLowerCase(), q = H.q.trim().toLowerCase();
  return H.rows.filter(r => (!H.who || r.by === H.who) && (!H.kind || HIST_KIND(r) === H.kind) && inPeriod(r.at, H.period, H.from, H.to)
    && (!fq || (H.field ? [r[H.field]] : HIST_FIELDS.map(([k]) => r[k])).some(v => String(v || '').toLowerCase().includes(fq)))
    && (!q || `${r.summary} ${r.by_name} ${r.client_name} ${JSON.stringify(r.diff || '')}`.toLowerCase().includes(q)));
}
function histBody() {
  const H = EM.histF, rows = histList(), who = [...new Set(H.rows.map(r => r.by).filter(Boolean))].map(id => [id, staffName(id)]).sort((a, b) => a[1].localeCompare(b[1]));
  const sel = (k, label, opts) => `<label class="field" style="min-width:140px"><span class="small muted">${label}</span><select class="input" data-hf="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${H[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  return `<div class="row" style="gap:10px;flex-wrap:wrap;align-items:flex-end" data-hist-filters>${sel('who', 'Who', [['', 'Everyone'], ...who])}${sel('kind', 'What', HIST_KINDS)}${dateFilter(H, 'hist', 'When')}${sel('field', 'Any field', [['', 'Any field'], ...HIST_FIELDS])}
      <label class="field" style="min-width:140px"><span class="small muted">contains</span><input class="input" id="hist-fq" value="${esc(H.fq)}" placeholder="Type to filter"></label><label class="field" style="min-width:160px"><span class="small muted">Search</span><input class="input" id="hist-q" value="${esc(H.q)}" placeholder="Anything"></label></div>
    <p class="small muted">${num(rows.length)} of ${num(H.rows.length)} entries${H.rows.length >= 1000 ? ' (the latest 1,000)' : ''}</p>
    <div class="timeline" data-hist-list>${rows.slice(0, 400).map(r => `<div class="on" data-hk="${HIST_KIND(r)}"><b>${esc(r.summary)}</b>${r.diff && Object.keys(r.diff).length ? `<div class="small">${Object.entries(r.diff).map(([k, [a, b]]) => `${esc(fieldWord(k))}: ${esc(diffVal(a))} to ${esc(diffVal(b))}`).join('<br>')}</div>` : ''}<div class="small muted">${esc(whenIST(isoOf(r.at)))} · ${esc(r.by_name || staffName(r.by))}${r.client_name ? ' · ' + esc(r.client_name) : ''}</div></div>`).join('') || '<p class="small muted">Nothing for this filter.</p>'}</div>`;
}
const histRedraw = () => { const b = qs('#hist-body'); if (b) { const a = document.activeElement && document.activeElement.id, pos = a && document.activeElement.selectionStart; b.innerHTML = histBody(); if (a && qs('#' + a)) { qs('#' + a).focus(); try { qs('#' + a).setSelectionRange(pos, pos); } catch (e) { } } } };
DF_STATE.hist = () => EM.histF;
EM.ACTIONS['hist-open'] = async el => {
  Object.assign(EM.histF, { rows: [], title: el.dataset.title, who: '', kind: '', period: 'all', from: '', to: '', field: '', fq: '', q: '' });
  EM.modal(`<h2>History: ${esc(el.dataset.title)}</h2><p class="muted small">Who added, changed or deleted what, and when. Deleted things wait in the Recycle bin for 30 days.</p><div id="hist-body" class="stack-s" style="margin-top:10px"><p class="muted">Loading…</p></div><div class="row" style="margin-top:12px"><button class="btn" data-act="close-modal">Close</button></div>`);
  try { EM.histF.rows = (await API('GET', '/api/audit?' + (el.dataset.record ? 'record=' + encodeURIComponent(el.dataset.record) : 'area=' + encodeURIComponent(el.dataset.area)))).history; histRedraw(); }
  catch (x) { const b = qs('#hist-body'); if (b) b.innerHTML = `<p class="err">${esc(x.message)}</p>`; }
};
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.hf; if (k) { EM.histF[k] = e.target.value; histRedraw(); } if (e.target.dataset && e.target.dataset.df === 'hist') setTimeout(histRedraw, 0); });
document.addEventListener('input', e => { if (e.target.id === 'hist-fq') { EM.histF.fq = e.target.value; histRedraw(); } if (e.target.id === 'hist-q') { EM.histF.q = e.target.value; histRedraw(); } });

/* ---------------------------------------------------------------- Recycle bin (13 Oct)
   Every delete waits here 30 days with what it belonged to, who deleted it and when; Put back restores it
   with its links, or says plainly why it cannot. The daily run empties what is past its date, files included. */
EM.BIN = null;
EM.binF = { kind: '', who: '', state: 'in', period: 'all', from: '', to: '', field: '', fq: '' };
const BIN_FIELDS = [['label', 'What'], ['belonged', 'Belonged to'], ['who', 'Deleted by']];
const binLoad = async () => { try { EM.BIN = await API('GET', '/api/bin'); } catch (x) { EM.BIN = { error: x.message }; } EM.rerender(); };
EM.VIEWS.bin = () => {
  if (!allowedTab('bin')) return EM.noAccess('The Recycle bin is for an Owner, and for roles that may delete.');
  if (!EM.BIN) { binLoad(); return '<div class="stack"><h1>Recycle bin</h1><p class="muted">Loading…</p></div>'; }
  if (EM.BIN.error) return `<div class="stack"><h1>Recycle bin</h1><div class="callout warn">${esc(EM.BIN.error)}</div></div>`;
  const f = EM.binF, fq = f.fq.trim().toLowerCase(), all = EM.BIN.bin.map(e => ({ ...e, who: staffName(e.deleted_by) }));
  const rows = all.filter(e => (!f.kind || e.kind === f.kind) && (!f.who || e.deleted_by === f.who) && (f.state === 'all' || (f.state === 'in' ? !e.restored_at : !!e.restored_at)) && inPeriod(e.deleted_at, f.period, f.from, f.to)
    && (!fq || (f.field ? [e[f.field]] : BIN_FIELDS.map(([k]) => e[k])).some(v => String(v || '').toLowerCase().includes(fq))) && matches(`${e.label} ${e.belonged} ${e.who}`, []));
  const sel = (k, label, opts) => `<label class="field" style="min-width:150px"><span class="small muted">${label}</span><select class="input" data-bf="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const kinds = [...new Set(all.map(e => e.kind))].map(k => [k, all.find(e => e.kind === k).kind_label]);
  return `<div class="stack" data-bin><div class="stack-s"><h1>Recycle bin</h1><p class="muted" style="max-width:780px">Everything deleted waits here for ${EM.BIN.days} days, with what it belonged to, who deleted it and when. <b>Put back</b> restores it with its links. After ${EM.BIN.days} days it is emptied for good, files included. ${isOwner() ? 'As an Owner you see everything deleted.' : 'You see what you deleted.'}</p></div>
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end">${sel('state', 'Show', [['in', 'In the bin'], ['back', 'Put back'], ['all', 'Both']])}${sel('kind', 'What', [['', 'Everything'], ...kinds])}${sel('who', 'Deleted by', [['', 'Everyone'], ...[...new Set(all.map(e => e.deleted_by))].map(id => [id, staffName(id)])])}
      ${dateFilter(f, 'bin', 'When it was deleted')}${sel('field', 'Any field', [['', 'Any field'], ...BIN_FIELDS])}<label class="field" style="min-width:150px"><span class="small muted">contains</span><input class="input" id="bin-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
    ${searchBox('What, what it belonged to, or who deleted it')}
    ${rows.length ? table(['What', 'Belonged to', 'Deleted', 'In the bin until', ''], rows.map(e => [`<b>${esc(e.label)}</b><div class="small muted">${esc(e.kind_label)}${e.files ? ` · ${e.files} file${e.files === 1 ? '' : 's'} kept` : ''}</div>`, esc(e.belonged), `${esc(whenIST(e.deleted_at))}<div class="small muted">by ${esc(e.who)}</div>`,
      e.restored_at ? `<span class="badge ok">Put back ${esc(ds(dayIST(e.restored_at)))}</span><div class="small muted">by ${esc(staffName(e.restored_by))}</div>` : esc(ds(dayIST(e.purge_after))), e.restored_at ? '' : `<button class="btn sm" data-act="bin-restore" data-id="${e.id}">Put back</button>`]))
      : empty(all.length ? 'Nothing for this filter' : 'The bin is empty', all.length ? 'Change the filters above.' : 'Whatever is deleted waits here for 30 days.')}</div>`;
};
EM.VIEWS.bin.title = () => 'Recycle bin';
DF_STATE.bin = () => EM.binF;
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.bf; if (k) { EM.binF[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'bin-fq') { EM.binF.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#bin-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
EM.ACTIONS['bin-restore'] = async el => {
  busy(el, true);
  try { const r = await API('POST', `/api/bin/${el.dataset.id}/restore`, {}); window.EGOLIVE.refresh(await API('GET', '/api/bootstrap')); EM.toast(`Put back: <b>${esc(r.restored.label)}</b>${(r.renumbered || []).length ? '<br>' + esc(r.renumbered.join(', ')) : ''}`); binLoad(); }
  catch (x) { busy(el, false); bubbleNear(el, x.message); }
};

/* Every API key in one place, for an Owner. EGO Master's own keys let other tools read and add
   records here; other tools' keys (voice agent, WhatsApp, IndiaMART...) are kept sealed on the
   server and only their last 4 characters ever come back. */
EM.INT = null;
const intLoad = async () => { try { EM.INT = await API('GET', '/api/integrations'); } catch (x) { EM.INT = { error: x.message }; } EM.rerender(); };
const whenIST = ts => ts ? `${ds(dayIST(ts))}, ${new Date(Date.parse(ts)).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })}` : '';
EM.VIEWS.integrations = () => {
  if (!allowedTab('integrations')) return EM.noAccess('Integrations and API keys are managed by an Owner.');
  if (!EM.INT) { intLoad(); return '<div class="stack"><h1>Integrations</h1><p class="muted">Loading…</p></div>'; }
  if (EM.INT.error) return `<div class="stack"><h1>Integrations</h1><div class="callout warn">${esc(EM.INT.error)}</div></div>`;
  const { keys, tools, vault } = EM.INT, base = window.EGOAPI.base;
  return `<div class="stack" data-integrations><div class="stack-s"><h1>Integrations</h1><p class="muted" style="max-width:780px">Every API key in one place. <b>EGO Master API keys</b> let other tools (the voice agent, a website form, Zapier or n8n) read and add records here. <b>Other tools' keys</b> are the keys EGO Master uses to reach them. Only an Owner sees this screen.</p></div>
    <section class="stack-s" data-connections><h3>Connections</h3><p class="small muted">Each outside system and where it stands. <b>Keys saved</b>: its keys are below and switched on. <b>Live</b>: a real event from it has arrived; keys alone never make it Live.</p>
      ${table(['Connection', 'Status', 'Last event', 'Waits for'], (EM.INT.connections || []).map(c => [`<b>${esc(c.name)}</b>`, `<span class="badge ${c.status === 'live' ? 'ok' : c.status === 'keys' ? 'info' : 'warn'}" data-conn="${esc(c.id)}">${esc(c.label)}</span>`, c.last_event_at ? `${esc(whenIST(c.last_event_at))}<div class="small muted">${num(c.events)} event${c.events === 1 ? '' : 's'}</div>` : '<span class="muted">None yet</span>', `<span class="small">${esc(c.waits)}</span>`]))}</section>
    <section class="stack-s"><div class="row between"><h3>EGO Master API keys</h3><button class="btn primary" data-act="int-key-add">+ New API key</button></div>
      <p class="small muted">A key acts as the person it is made for: it sees and changes only what their role allows. A key is shown once, when it is made; EGO Master keeps only a fingerprint of it. Revoke a key and it stops at once.</p>
      ${keys.length ? table(['Name', 'Key', 'Acts as', 'Access', 'Made', 'Last used', 'Status', ''], keys.map(k => [`<b>${esc(k.name)}</b>`, `<code>${esc(k.prefix)}…</code>`, esc(staffName(k.staff_id)), k.access === 'write' ? 'Read and add' : 'Read only', `${whenIST(k.created_at)}<div class="small muted">${esc(staffName(k.created_by))}</div>`, k.last_used_at ? whenIST(k.last_used_at) : '<span class="muted">Never</span>',
        k.revoked_at ? `<span class="badge plain">Revoked ${ds(dayIST(k.revoked_at))}</span>` : '<span class="badge ok">Active</span>', k.revoked_at ? '' : `<button class="btn sm ghost" data-act="int-key-revoke" data-id="${k.id}">Revoke</button>`])) : '<div class="callout">No EGO Master API keys yet.</div>'}</section>
    <section class="stack-s"><div class="row between"><h3>Other tools' keys</h3><button class="btn primary" data-act="int-tool-add"${vault ? '' : ' disabled'}>+ Add a tool</button></div>
      ${vault ? '<p class="small muted">Kept sealed on the server. After saving, a value is never shown again, only its last 4 characters; to change one, type the new value over it.</p>' : '<div class="callout warn" role="note"><b>The key vault is not set up on the server yet.</b> Tool keys cannot be saved until it is.</div>'}
      ${tools.length ? table(['Tool', 'Values', 'Notes', 'Status', 'Changed', ''], tools.map(t => [`<b>${esc(t.provider)}</b>${t.label ? `<div class="small muted">${esc(t.label)}</div>` : ''}`, t.hints.map(([n, h]) => `<div class="small">${esc(n)}: <code>${esc(h)}</code></div>`).join(''), `<span class="small">${esc(t.notes)}</span>`,
        t.active ? '<span class="badge ok">On</span>' : '<span class="badge plain">Off</span>', `${whenIST(t.updated_at)}<div class="small muted">${esc(staffName(t.updated_by))}</div>`, `<button class="btn sm ghost" data-act="int-tool-edit" data-id="${t.id}">Edit</button><button class="btn sm ghost" data-act="int-tool-del" data-id="${t.id}">Remove</button>`])) : '<div class="callout">No tool keys saved yet.</div>'}</section>
    <section class="stack-s"><h3>How another tool calls EGO Master</h3>
      <div class="card stack-s"><div class="small">Address: <code>${esc(base)}</code></div>
      <div class="small">Send the key in a header: <code>Authorization: Bearer egm_…</code> (or <code>X-API-Key: egm_…</code>)</div>
      <table class="tbl"><tbody>${[['GET', '/api/bootstrap', 'Everything the key\'s person can see: clients, people, opportunities, lists'], ['POST', '/api/clients', 'Add or change a client (dealer, architect, person)'], ['POST', '/api/contacts', 'Add or change a contact in a company'], ['POST', '/api/opportunities', 'Add or change an opportunity'], ['GET', '/api/notifications', 'The bell']].map(([mth, pth, what]) => `<tr><td><code>${mth}</code></td><td><code>${pth}</code></td><td class="small">${what}</td></tr>`).join('')}</tbody></table>
      <p class="small muted">The same rules apply as on screen: required fields, no duplicate mobile or GST, and only the records the key's person may see.</p></div></section></div>`;
};
EM.VIEWS.integrations.title = () => 'Integrations';
EM.ACTIONS['int-key-add'] = () => {
  const people = D.staff.filter(s => s.active).sort((a, b) => a.name.localeCompare(b.name));
  EM.modal(`<h2>New EGO Master API key</h2><p class="muted">For one tool. Name it after the tool, so you know what to revoke later.</p>
    <form id="ikf" class="stack" style="margin-top:12px" onsubmit="return false">
      <div class="field"><label for="ik-name">Name</label><input class="input" id="ik-name" placeholder="Bolna voice agent" maxlength="80"></div>
      <div class="field"><label for="ik-who">Acts as</label><select class="input" id="ik-who">${people.map(s => `<option value="${s.id}"${s.id === me().id ? ' selected' : ''}>${esc(s.name)} · ${esc(roleName(s.role))}</option>`).join('')}</select><span class="small muted">The key sees and changes only what this person's role allows.</span></div>
      <div class="field"><label for="ik-acc">Access</label><select class="input" id="ik-acc"><option value="read">Read only</option><option value="write">Read and add</option></select></div>
      ${errBox('ik-err')}<div class="row"><button class="btn primary" data-act="int-key-go">Make the key</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
};
EM.ACTIONS['int-key-go'] = async el => {
  busy(el, true);
  try {
    const r = await API('POST', '/api/integrations/keys', { name: qs('#ik-name').value, staff_id: qs('#ik-who').value, access: qs('#ik-acc').value });
    EM.INT.keys.unshift(r.api_key);
    EM.modal(`<h2>${esc(r.api_key.name)}: your new key</h2><div class="callout warn" role="note"><b>Copy it now.</b> It is shown only this once. If it is lost, revoke it and make a new one.</div>
      <div class="row" style="margin-top:12px"><code data-new-key style="word-break:break-all;flex:1">${esc(r.key)}</code><button class="btn sm" data-act="int-copy" data-v="${esc(r.key)}">Copy</button></div>
      <div class="row" style="margin-top:14px"><button class="btn primary" data-act="close-modal">Done</button></div>`);
    EM.rerender();
  } catch (x) { busy(el, false); showErr('ik-err', x.message); }
};
EM.ACTIONS['int-copy'] = el => { navigator.clipboard && navigator.clipboard.writeText(el.dataset.v).catch(() => {}); EM.toast('Copied'); };
EM.ACTIONS['int-key-revoke'] = el => {
  const k = EM.INT.keys.find(x => x.id === el.dataset.id);
  EM.modal(`<h2>Revoke "${esc(k.name)}"</h2><p class="muted">Any tool using <code>${esc(k.prefix)}…</code> stops working at once. This cannot be undone; make a new key if it is needed again.</p>
    ${errBox('ikr-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="int-key-revoke-go" data-id="${k.id}">Revoke</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['int-key-revoke-go'] = async el => {
  busy(el, true);
  try { await API('POST', `/api/integrations/keys/${el.dataset.id}/revoke`, {}); EM.closeModal(); EM.toast('Key revoked.'); intLoad(); } catch (x) { busy(el, false); showErr('ikr-err', x.message); }
};
const intRow = (name, hint) => `<div class="row" data-int-row><input class="input" style="flex:1" data-int-name value="${esc(name)}" placeholder="Name, such as API key" maxlength="40" aria-label="Value name"><input class="input" style="flex:2" data-int-val type="password" autocomplete="new-password" placeholder="${hint ? esc(hint) + ' saved; type to replace' : 'Paste the value'}" aria-label="${esc(name || 'Value')}"><button class="btn sm ghost" data-act="int-row-del" aria-label="Remove this value">×</button></div>`;
const intToolForm = t => {
  const presets = EM.INT.presets, rows = t ? t.hints : (presets[0][2].map(n => [n, '']));
  EM.modal(`<h2>${t ? 'Edit ' + esc(t.provider) + ' keys' : 'Add a tool\'s keys'}</h2><p class="muted">Pick the tool, or Other for any tool not listed. The names fill in; change or add names as that tool needs.</p>
    <form id="itf" class="stack" style="margin-top:12px" onsubmit="return false">
      <div class="field"><label for="it-prov">Tool</label><select class="input" id="it-prov" data-keep-order>${presets.map(([n, what]) => `<option value="${esc(n)}"${t && t.provider === n ? ' selected' : ''}>${esc(n)} · ${esc(what)}</option>`).join('')}${t && !presets.some(p => p[0] === t.provider) ? `<option selected value="${esc(t.provider)}">${esc(t.provider)}</option>` : ''}</select></div>
      <div class="field" id="it-other-wrap"${!t || presets.some(p => p[0] === t.provider) && t.provider !== 'Other' ? ' hidden' : ''}><label for="it-other">Tool name</label><input class="input" id="it-other" maxlength="60" value="${t && !presets.some(p => p[0] === t.provider) ? esc(t.provider) : ''}" placeholder="Such as Zapier"></div>
      <div class="field"><label for="it-label">Label (optional)</label><input class="input" id="it-label" maxlength="80" value="${esc(t ? t.label : '')}" placeholder="Such as Sales line 1"></div>
      <div class="stack-s"><label>Values</label><div class="stack-s" id="it-rows">${rows.map(([n, h]) => intRow(n, h)).join('')}</div><button class="btn sm ghost" data-act="int-row-add" style="align-self:flex-start">+ Add a value</button></div>
      <div class="field"><label for="it-notes">Notes (optional)</label><input class="input" id="it-notes" maxlength="500" value="${esc(t ? t.notes : '')}" placeholder="Who gave it, what it is for"></div>
      <label class="row small"><input type="checkbox" id="it-on"${!t || t.active ? ' checked' : ''}> On (EGO Master may use these keys)</label>
      ${errBox('it-err')}<div class="row"><button class="btn primary" data-act="int-tool-save" data-id="${t ? t.id : ''}">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
  const prov = qs('#it-prov');
  prov.addEventListener('change', () => {
    const p = presets.find(x => x[0] === prov.value);
    qs('#it-other-wrap').hidden = prov.value !== 'Other';
    if (!t && p) qs('#it-rows').innerHTML = p[2].map(n => intRow(n, '')).join('');
  });
};
EM.ACTIONS['int-tool-add'] = () => intToolForm(null);
EM.ACTIONS['int-tool-edit'] = el => intToolForm(EM.INT.tools.find(x => x.id === el.dataset.id));
EM.ACTIONS['int-row-add'] = () => qs('#it-rows').insertAdjacentHTML('beforeend', intRow('', ''));
EM.ACTIONS['int-row-del'] = el => el.closest('[data-int-row]').remove();
EM.ACTIONS['int-tool-save'] = async el => {
  const prov = qs('#it-prov').value, provider = prov === 'Other' || !EM.INT.presets.some(p => p[0] === prov) ? (qs('#it-other').value.trim() || prov) : prov;
  const values = [...document.querySelectorAll('#it-rows [data-int-row]')].map(r => ({ name: r.querySelector('[data-int-name]').value, value: r.querySelector('[data-int-val]').value }));
  busy(el, true);
  try {
    await API('POST', '/api/integrations/tools', { id: el.dataset.id || undefined, provider, label: qs('#it-label').value, notes: qs('#it-notes').value, active: qs('#it-on').checked, values });
    EM.closeModal(); EM.toast(`<b>${esc(provider)}</b> keys saved.`); intLoad();
  } catch (x) { busy(el, false); showErr('it-err', x.message); }
};
EM.ACTIONS['int-tool-del'] = el => {
  const t = EM.INT.tools.find(x => x.id === el.dataset.id);
  EM.modal(`<h2>Remove the ${esc(t.provider)} keys</h2><p class="muted">EGO Master can no longer use them. The tool itself is not affected.</p>
    ${errBox('itd-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="int-tool-del-go" data-id="${t.id}">Remove</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['int-tool-del-go'] = async el => {
  busy(el, true);
  try { await API('DELETE', '/api/integrations/tools/' + el.dataset.id); EM.closeModal(); EM.toast('Removed, in the Recycle bin for 30 days.'); intLoad(); } catch (x) { busy(el, false); showErr('itd-err', x.message); }
};
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

/* ================================================================ batch 4 (13 Oct): leads for dealers, development plans, portal logins
   Bhargav: "building a tool is not the agenda for Cockpit. The agenda is the functionality and making sure that this
   is easy to use". So: one screen for the leads handed to dealers (opened from Opportunities, like Lost sales), a
   Development plan tab on each dealer, the plans and interventions under Priority 200, and the dealer's portal
   logins on the dealer's page for the Owner. Every figure is counted from saved records. */
/* R3a (17 Oct): Leads for dealers folded into EGO's Retail pipeline. A lead IS a Retail opportunity with a dealer allocated;
   this shapes it for the dealer page, the ageing and Analysis › Dealer leads. Nothing is kept twice. */
const RETAIL = 'ego_retail';
const leadOfOpp = o => { const c = CL()[o.client_id] || {}, x = o.extra || {}, h = D.history.filter(y => y.opp_id === o.id).pop();
  return { id: o.id, opp: o, ref: o.ref || '', name: c.name || o.c_name || 'Outside your view', mobile: c.mobile || o.c_mobile || '', city: c.city || o.c_city || '', area: (c.extra || {}).locality || '', need: x.products || [], sqft: x.area_sqft, source: o.source || '', notes: x.notes || '',
    dealer_id: o.dealer_id, status: o.stage, lost_reason: o.lost_reason || '', status_note: h ? h.note || '' : '', won_value: x.won_value, handed_by: x.allocated_by || o.owner_id, handed_at: x.allocated_at || o.created_at, status_at: h ? h.at : o.created_at, status_by_dealer: !!x.stage_by_dealer }; };
const LEADS = () => D.opportunities.filter(o => o.pipeline === RETAIL && o.dealer_id).map(leadOfOpp), DDIR = () => D.dealer_dir || [], PLANS = () => D.plans || [];
const PJS = () => D.projects || [];
const reload4 = async () => { Object.assign(D, await API('GET', '/api/bootstrap')); };
const leadDealer = l => DDIR().find(d => d.id === l.dealer_id) || CL()[l.dealer_id] || { id: l.dealer_id, name: 'A dealer outside your view', owner_id: '', city: '' };
const leadOpen = l => !isClosed(RETAIL, l.status, D.lists);
const escDays = () => Number(D.lists.rules.lead_escalate_days) || 2;
const leadAge = l => Math.max(0, Math.floor((Date.now() - tsMs(l.status_at)) / 864e5));
const leadStale = l => leadOpen(l) && (Date.now() - tsMs(l.status_at)) >= escDays() * 864e5;
const leadBadge = l => `<span class="badge ${l.status === wonStage(RETAIL, D.lists) ? 'ok' : l.status === lostStage(RETAIL, D.lists) ? 'bad' : leadStale(l) ? 'warn' : 'info'}">${esc(l.status)}</span>`;
/* who to hand a lead to: dealers in that city first, then those covering it, then the same region; fewer open leads first */
function dealerSuggest(city, not) {
  const c = String(city || '').toLowerCase(), region = (D.lists.cities.find(x => x.city.toLowerCase() === c) || {}).region;
  return DDIR().filter(d => d.id !== not && d.status !== CLIENT_CLOSED && d.division !== 'retail').map(d => {
    const why = String(d.city || '').toLowerCase() === c ? [3, `In ${d.city}`] : (d.areas || []).some(a => String(a).toLowerCase() === c) ? [2, `Covers ${city}`] : region && d.region === region ? [1, `${region} region`] : [0, ''];
    return { d, rank: why[0], why: why[1], open: LEADS().filter(l => l.dealer_id === d.id && leadOpen(l)).length };
  }).filter(x => x.rank > 0).sort((a, b) => b.rank - a.rank || a.open - b.open || a.d.name.localeCompare(b.d.name)).slice(0, 5);
}
const dealerPickHtml = (city, cur, not) => {
  const sug = dealerSuggest(city, not), others = DDIR().filter(d => d.id !== not && d.division !== 'retail').sort((a, b) => a.name.localeCompare(b.name));
  return `<fieldset class="fs" id="ld-dealers"><legend>Hand it to *</legend>${city ? '' : '<p class="small muted">Pick the city first: the dealers there are suggested here.</p>'}
    ${sug.length ? `<div class="stack-s" data-suggest-dealers>${sug.map((x, i) => `<label class="row small" style="gap:8px"><input type="radio" name="ld-dealer" value="${x.d.id}" ${(cur ? cur === x.d.id : i === 0) ? 'checked' : ''}> <b>${esc(x.d.name)}</b> <span class="muted">${esc(kindLabel(x.d.kind))} · ${esc(x.why)} · ${x.open} open lead${x.open === 1 ? '' : 's'} · field sales ${esc(staffName(x.d.owner_id))}</span></label>`).join('')}</div>` : city ? `<p class="small muted">No dealer is in ${esc(city)}, covers it, or is in its region. Choose one below.</p>` : ''}
    <label class="row small" style="gap:8px;align-items:center"><input type="radio" name="ld-dealer" value="" ${sug.length && !(cur && !sug.some(x => x.d.id === cur)) ? '' : 'checked'}> Another dealer:</label>
    <select class="input" id="ld-other" aria-label="Another dealer"><option value="">Choose</option>${others.map(d => `<option value="${d.id}" ${cur === d.id && !sug.some(x => x.d.id === cur) ? 'selected' : ''}>${esc(d.name)} · ${esc(d.city || '')}</option>`).join('')}</select></fieldset>`;
};
const pickedDealer = () => { const r = document.querySelector('input[name="ld-dealer"]:checked'); return (r && r.value) || (qs('#ld-other') || { value: '' }).value; };
/* allocate a consumer lead to a dealer, or move it to another one: it is the opportunity's Allocated dealer */
EM.ACTIONS['ld-move'] = el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id), l = leadOfOpp(o), alloc = nm(D.lists, 'stages.' + RETAIL, 'Dealer allocated');
  EM.modal(`<h2>${o.dealer_id ? `Give lead ${esc(l.ref)} to another dealer` : `Allocate lead ${esc(l.ref)} to a dealer`}</h2><p class="muted small">${esc(l.name)}, ${esc(l.city)}. ${o.dealer_id ? `Now with ${esc(leadDealer(l).name)} (${esc(l.status)} for ${leadAge(l)} days). It starts again at ${esc(alloc)}; both dealers' histories keep the move.` : `It moves to ${esc(alloc)}; the dealer and their field sales owner are told in the bell.`}</p>
    <form id="lmf" class="stack" onsubmit="return false" style="margin-top:12px">${dealerPickHtml(l.city, '', o.dealer_id)}
      <div class="field"><label for="lm-note">Why (optional)</label><input class="input" id="lm-note" maxlength="300" placeholder="e.g. No call back in 3 days"></div>
      ${errBox('lm-err')}<div class="row sticky-actions"><button class="btn primary" data-act="ld-move-go" data-id="${l.id}">Move it</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
};
EM.ACTIONS['ld-move-go'] = async el => {
  busy(el, true);
  const o = D.opportunities.find(x => x.id === el.dataset.id), d = pickedDealer();
  if (!d) { busy(el, false); return showErr('lm-err', 'Choose the dealer.'); }
  const r = await saveOpp({ ...oppInput(o), dealer_id: d, stage_note: qs('#lm-note').value }, el, 'lm-err');
  if (r) { EM.closeModal(); EM.toast(`<b>Lead allocated to ${esc((DDIR().find(x => x.id === d) || {}).name || 'the dealer')}.</b> They have it in the dealer portal and the bell.`); EM.rerender(); }
};
const leadBtns = l => isBothView() || !leadOpen(l) ? '' : `<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm ghost" data-act="ld-move" data-id="${l.id}">Move</button></div>`;
const leadRow = (l, dealerCol = true) => { const d = leadDealer(l);
  return { href: `#/opp/${l.id}`, cells: [`<b>${esc(l.ref)} · ${esc(l.name)}</b><div class="small muted">${esc(fmtMobile(l.mobile))}${l.mobile ? ' · ' : ''}${esc(l.city)}${l.area ? ', ' + esc(l.area) : ''}</div>${l.need.length ? `<div class="small">${esc(l.need.join(', '))}${l.sqft ? ` · ${num(l.sqft)} sq ft` : ''}</div>` : ''}`,
    ...(dealerCol ? [`${esc(d.name)}<div class="small muted">field sales ${esc(staffName(d.owner_id))}</div>`] : []),
    `${leadBadge(l)}${l.status === lostStage(RETAIL, D.lists) && l.lost_reason ? `<div class="small muted">${esc(l.lost_reason)}</div>` : ''}${l.status_note ? `<div class="small muted">${esc(l.status_note)}</div>` : ''}<div class="small muted">${l.status_by_dealer ? 'by the dealer' : 'by EGO'}</div>`,
    `<span class="${leadStale(l) ? 'err' : ''}">${leadAge(l)} d since the last update</span><div class="small muted">handed ${ds(dayIST(l.handed_at))}</div>`,
    `${esc(staffName(l.handed_by))}<div class="small muted">${esc(l.source)}</div>`, leadBtns(l)] }; };
const LEAD_HEAD = (dealerCol = true) => ['Lead', ...(dealerCol ? ['Dealer'] : []), 'Stage', 'Ageing', 'Handed by', ''];
/* ---- the old "Leads for dealers" address opens the Retail pipeline, where the leads now live (R3a) */
EM.VIEWS.handover = () => EM.VIEWS.opps(RETAIL);
EM.VIEWS.handover.tab = 'opps';
EM.VIEWS.handover.title = () => 'Opportunities';
const csvDownload = (name, head, lines) => {
  const cell = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`, csv = '\ufeff' + [head, ...lines].map(l => l.map(cell).join(',')).join('\r\n');
  const u = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
  a.href = u; a.download = `${name} ${today()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000);
};
/* ---- on the dealer's page */
function dealerTabs(c) {
  if (c.division === 'retail') return [['plan', 'Development plan']];   // R3b: a Big E dealer; EGO's consumer leads and dealer portal are EGO Premium's
  return [['leads', `Leads (${LEADS().filter(l => l.dealer_id === c.id).length})`], ['plan', 'Development plan'], ...(isOwner() ? [['portal', 'Dealer portal']] : [])];
}
const DEALER_TAB_BODY = {
  leads: c => { const ls = LEADS().filter(l => l.dealer_id === c.id);
    return `<div class="stack" data-dealer-leads><div class="row between"><p class="small muted" style="max-width:720px">Consumer leads (Retail pipeline) allocated to ${esc(c.name)}. ${ls.filter(leadOpen).length} open, ${ls.filter(leadStale).length} with no update for ${escDays()}+ days, ${ls.filter(l => l.status === wonStage(RETAIL, D.lists)).length} won of ${ls.length}.</p>${allowedTab('opps') ? `<button class="btn primary" data-act="opp-add" data-pipeline="${RETAIL}" data-dealer="${c.id}">+ Consumer lead for ${esc(c.name)}</button>` : ''}</div>
      ${ls.length ? table(LEAD_HEAD(false), ls.map(l => leadRow(l, false))) : empty('No lead allocated to this dealer yet', 'Consumer leads allocated to this dealer in the Retail pipeline appear here, with where each has got to.')}</div>`; },
  plan: c => clientPlan(c),
  portal: c => clientPortal(c),
};
/* an order request raised in the dealer portal says so on its opportunity */
const portalRequestNote = o => { const x = o.extra || {}; return `<div class="callout" data-portal-request><b>Raised in the dealer portal</b> by ${esc(x.portal_user || 'the dealer')}: ${esc(x.request || '')}${x.boxes ? ` · ${num(x.boxes)} boxes` : ''}${(x.categories || []).length ? ` · ${esc(x.categories.join(', '))}` : ''}${x.need_by ? ` · needed by ${ds(x.need_by)}` : ''}</div>`; };

/* ---------------------------------------------------------------- Priority 200: development plans and interventions */
const catOfP = pid => colOf(INVD().products.find(p => p.id === pid) || {}).category;
const planProg = p => planProgress(p, OPSD().orders, OPSD().lines, catOfP);
const planIvs = p => FUS().filter(f => f.plan_id === p.id);
const ivState = f => f.status === 'open' ? (f.due_date < today() ? 'Overdue' : f.iv_status || 'Planned') : f.iv_status || 'Done';
const ivBadge = f => { const s = ivState(f); return `<span class="badge ${s === 'Done' ? 'ok' : s === 'Overdue' ? 'bad' : s === 'Cancelled' ? 'plain' : 'info'}">${esc(s)}</span>`; };
const planPct = p => { const pr = planProg(p), parts = [...(p.goal_value ? [pr.value / p.goal_value] : []), ...(p.goal_boxes ? [pr.boxes / p.goal_boxes] : []), ...(p.goal_cats.length ? [pr.catsHit.length / p.goal_cats.length] : [])]; return parts.length ? Math.round(Math.min(1, parts.reduce((a, x) => a + Math.min(1, x), 0) / parts.length) * 100) : null; };
const PLAN_F = () => [{ key: 'title', label: 'Plan name', type: 'text', req: true }, { key: 'owner_id', label: 'Who drives it', type: 'owner', req: true }, { key: 'start_on', label: 'From', type: 'date', req: true }, { key: 'end_on', label: 'To', type: 'date', req: true },
  ...(D.access.prices ? [{ key: 'goal_value', label: 'Sales goal before GST (₹)', type: 'money' }] : []), { key: 'goal_boxes', label: 'Boxes goal', type: 'number' }, { key: 'goal_cats', label: 'Categories to start buying', type: 'cats' },
  { key: 'goal_display', label: 'Display goal', type: 'text' }, { key: 'goal_training', label: 'Training goal', type: 'text' }, { key: 'review_every', label: 'Review every', type: 'select', opts: Object.keys(REVIEW_EVERY), req: true },
  { key: 'status', label: 'Status', type: 'select', opts: ['Active', 'Closed'], req: true }, { key: 'notes', label: 'Notes', type: 'textarea' }];
function openPlanForm(c, p) {
  const v = p || { owner_id: c.owner_id, start_on: today(), end_on: addMonths(today(), 6), review_every: 'Monthly', status: 'Active', goal_cats: [] };
  EM.modal(`<h2>${p ? 'Change the plan' : 'Start a development plan'}: ${esc(c.name)}</h2><p class="muted small">Goals over a period. Progress is counted from orders invoiced in it (before GST). Each review is booked as a follow-up for whoever drives the plan.</p>
    <form id="plf" class="stack" onsubmit="return false" style="margin-top:12px"><div class="fgrid">${PLAN_F().map(f => fieldHtml(f, v[f.key], 'pl')).join('')}</div>
      ${isOwner() ? `<label class="row small"><input type="checkbox" id="pl-show" ${v.show_dealer ? 'checked' : ''}> Show its progress to ${esc(c.name)} in the dealer portal</label>` : ''}
      ${errBox('pl-err')}<div class="row sticky-actions"><button class="btn primary" data-act="pl-save" data-client="${c.id}" data-id="${p ? p.id : ''}">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
EM.ACTIONS['pl-add'] = el => openPlanForm(CL()[el.dataset.client]);
EM.ACTIONS['pl-edit'] = el => { const p = PLANS().find(x => x.id === el.dataset.id); openPlanForm(CL()[p.client_id], p); };
EM.ACTIONS['pl-save'] = async el => {
  const v = readForm(qs('#plf'), PLAN_F()), id = el.dataset.id;
  if (qs('#pl-show')) v.show_dealer = qs('#pl-show').checked;
  busy(el, true);
  try { await API('POST', id ? '/api/plans/' + id : '/api/plans', { ...v, client_id: el.dataset.client }); await reload4(); EM.closeModal(); EM.toast('<b>Development plan saved.</b> Its reviews are in Follow-ups.'); EM.rerender(); }
  catch (x) { busy(el, false); showErr('pl-err', x.errors || x.message); }
};
EM.ACTIONS['pl-del'] = async el => {
  const p = PLANS().find(x => x.id === el.dataset.id);
  if (!confirm(`Delete the plan "${p.title}" with its interventions and files? It stays in the Recycle bin for 30 days.`)) return;
  try { await API('DELETE', '/api/plans/' + p.id); await reload4(); EM.toast('Plan deleted, in the Recycle bin for 30 days.'); EM.rerender(); } catch (x) { bubbleNear(el, x.message); }
};
/* not key 'kind': optLabel reads any field keyed kind as a client type (KINDS) */
const IV_F = [{ key: 'iv_kind', label: 'Kind', type: 'select', opts: IV_KINDS, req: true }, { key: 'what', label: 'What will be done', type: 'text', req: true }, { key: 'owner_id', label: 'Who does it', type: 'owner', req: true }, { key: 'date', label: 'By when', type: 'date', req: true }, { key: 'note', label: 'Note', type: 'textarea' }];
EM.ACTIONS['iv-add'] = el => { const p = PLANS().find(x => x.id === el.dataset.plan);
  EM.modal(`<h2>Plan an intervention</h2><p class="muted small">${esc(clientName(p.client_id))} · ${esc(p.title)}. It becomes a follow-up: the doer is reminded, their manager sees it when late, and it is in the founders' roll-up.</p>
    <form id="ivf" class="stack" onsubmit="return false" style="margin-top:12px"><div class="fgrid">${IV_F.map(f => fieldHtml(f, f.key === 'owner_id' ? p.owner_id : f.key === 'date' ? dayPlus(7) : '', 'iv')).join('')}</div>
      ${errBox('iv-err')}<div class="row sticky-actions"><button class="btn primary" data-act="iv-save" data-plan="${p.id}">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`); };
EM.ACTIONS['iv-save'] = async el => {
  busy(el, true);
  try { const v = readForm(qs('#ivf'), IV_F), r = await API('POST', `/api/plans/${el.dataset.plan}/interventions`, { ...v, kind: v.iv_kind }); D.followups = FUS().filter(f => f.client_id !== r.client.id).concat(r.followups); upsertLocal(D.clients, r.client); EM.closeModal(); EM.toast('<b>Intervention planned.</b> It is in Follow-ups too.'); EM.rerender(); }
  catch (x) { busy(el, false); showErr('iv-err', x.errors || x.message); }
};
const ivPost = async (el, id, b, okMsg, errId) => { busy(el, true);
  try { const r = await API('POST', '/api/interventions/' + id, b); D.followups = FUS().filter(f => f.client_id !== r.client.id).concat(r.followups); upsertLocal(D.clients, r.client); EM.closeModal(); EM.toast(okMsg); EM.rerender(); }
  catch (x) { busy(el, false); if (errId) showErr(errId, x.errors || x.message); else bubbleNear(el, x.message); } };
EM.ACTIONS['iv-start'] = el => ivPost(el, el.dataset.id, { status: 'In progress' }, '<b>In progress</b>');
EM.ACTIONS['iv-done'] = el => { const f = FUS().find(x => x.id === el.dataset.id);
  EM.modal(`<h2>Done: ${esc(f.action)}</h2><p class="muted small">${esc(clientName(f.client_id))} · due ${ds(f.due_date)}</p><form class="stack" onsubmit="return false" style="margin-top:12px">
    <div class="field"><label for="ivd-out">What came of it *</label><input class="input" id="ivd-out" maxlength="300" placeholder="e.g. 4 staff trained on SPC installation" autocomplete="off"></div>
    <div class="field"><label for="ivd-src">How it happened (optional)</label><select class="input" id="ivd-src" data-keep-order><option value="">Choose</option>${(D.lists.followup_sources || []).map(x => `<option>${esc(x)}</option>`).join('')}</select></div>
    <details class="more"><summary>Photos, attendance sheet or PDFs (optional)</summary>${fuFilesBox(f.id)}</details>
    ${errBox('ivd-err')}<div class="row sticky-actions"><button class="btn primary" data-act="iv-done-go" data-id="${f.id}">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`); };
EM.ACTIONS['iv-done-go'] = el => ivPost(el, el.dataset.id, { status: 'Done', outcome: qs('#ivd-out').value, source: qs('#ivd-src').value }, '<b>Done.</b> It counts on the plan.', 'ivd-err');
EM.ACTIONS['iv-cancel'] = el => { const why = prompt('Why is it cancelled?'); if (why == null) return; ivPost(el, el.dataset.id, { status: 'Cancelled', reason: why }, '<b>Cancelled</b>'); };
EM.ACTIONS['iv-files'] = el => EM.modal(`<h2>Files</h2><p class="muted small">${esc((FUS().find(x => x.id === el.dataset.id) || {}).action || '')}</p>${fuFilesBox(el.dataset.id)}<div class="row" style="margin-top:12px"><button class="btn" data-act="close-modal">Close</button></div>`);
const ivBtns = f => isBothView() ? '' : `<div class="row" style="gap:6px;flex-wrap:nowrap">${f.status === 'open' ? `${f.iv_status !== 'In progress' && f.iv_kind !== 'Review' ? `<button class="btn sm ghost" data-act="iv-start" data-id="${f.id}">Start</button>` : ''}<button class="btn sm primary" data-act="iv-done" data-id="${f.id}">Done</button><button class="btn sm ghost" data-act="fu-edit" data-id="${f.id}">Change</button><button class="btn sm ghost" data-act="iv-cancel" data-id="${f.id}">Cancel</button>` : ''}<button class="btn sm ghost" data-act="iv-files" data-id="${f.id}">Files${(n => n ? ' (' + n + ')' : '')(D.documents.filter(d => d.followup_id === f.id).length)}</button></div>`;
const ivRow = (f, dealerCol) => ({ cells: [`${ds(f.due_date)}${f.done_at ? `<div class="small muted">${f.iv_status === 'Cancelled' ? 'cancelled' : 'done'} ${ds(dayIST(f.done_at))}</div>` : ''}`, ...(dealerCol ? [`<a href="#/client/${f.client_id}/plan">${esc(clientName(f.client_id))}</a>`] : []), `<b>${esc(f.action)}</b>${f.note ? `<div class="small muted">${esc(f.note)}</div>` : ''}`, esc(staffName(f.owner_id)), ivBadge(f), esc(f.outcome || ''), ivBtns(f)] });
const IV_HEAD = dealerCol => ['Due', ...(dealerCol ? ['Dealer'] : []), 'Intervention', 'Who', 'Status', 'What came of it', ''];
function planCard(c, p) {
  const P = D.access.prices, pr = planProg(p), ivs = planIvs(p).sort((a, b) => (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || a.due_date.localeCompare(b.due_date)), review = ivs.find(f => f.iv_kind === 'Review' && f.status === 'open');
  const oRows = pr.orders.map(o => ({ href: '#/order/' + o.id, cells: [`<b>${esc(o.ref)}</b>`, ds(dayIST(o.invoiced_at)), ...(P ? [inr0(o.subtotal)] : []), num(OPSD().lines.filter(l => l.order_id === o.id).reduce((a, l) => a + l.boxes, 0))] }));
  const why = title => ({ title, calc: `Orders of ${c.name} invoiced between ${ds(p.start_on)} and ${ds(p.end_on)} (Fulfilment, at Invoiced): value before GST, and the boxes on their lines.`, head: ['Order', 'Invoiced', ...(P ? ['Value before GST'] : []), 'Boxes'], rows: oRows });
  const done = k => ivs.filter(f => f.iv_kind === k && f.iv_status === 'Done').length;
  const goal = (label, got, want, fmt, w) => want ? [esc(label), `${fig(fmt(got), w)} of ${fmt(want)}`, `${bar(pct(got, want))} ${pct(got, want)}%`] : null;
  const rowsG = [P ? goal('Sales before GST', pr.value, p.goal_value, inr0, why('Sales on the plan')) : null, goal('Boxes', pr.boxes, p.goal_boxes, num, why('Boxes on the plan')),
    p.goal_cats.length ? ['Categories to start buying', `${pr.catsHit.length} of ${p.goal_cats.length}: ${p.goal_cats.map(x => pr.catsHit.includes(x) ? `<b>${esc(x)}</b> bought` : esc(x)).join(', ')}`, `${bar(pct(pr.catsHit.length, p.goal_cats.length))} ${pct(pr.catsHit.length, p.goal_cats.length)}%`] : null,
    p.goal_display ? ['Display', esc(p.goal_display), `${done('Display')} display intervention${done('Display') === 1 ? '' : 's'} done`] : null,
    p.goal_training ? ['Training', esc(p.goal_training), `${done('Training')} training${done('Training') === 1 ? '' : 's'} done`] : null].filter(Boolean);
  return `<section class="card stack" data-plan="${p.id}"><div class="row between" style="align-items:flex-start"><div class="stack-s"><h3>${esc(p.title)} <span class="badge ${p.status === 'Active' ? 'info' : 'plain'}">${esc(p.status)}</span>${p.show_dealer ? ' <span class="badge plain">Shown in the dealer portal</span>' : ''}</h3>
      <p class="small muted">${ds(p.start_on)} to ${ds(p.end_on)} · driven by ${esc(staffName(p.owner_id))} · reviewed ${esc(p.review_every.toLowerCase())}${review ? ` · next review ${ds(review.due_date)}` : ''}</p>${p.notes ? `<p class="small">${esc(p.notes)}</p>` : ''}</div>
      ${isBothView() ? '' : `<div class="row"><button class="btn sm" data-act="pl-edit" data-id="${p.id}">Change</button>${D.access.can_delete ? `<button class="btn sm ghost" data-act="pl-del" data-id="${p.id}">Delete</button>` : ''}</div>`}</div>
    ${rowsG.length ? table(['Goal', 'Got to', 'Progress'], rowsG) : '<p class="small muted">No goal set yet. Change the plan to add sales, boxes, categories, display or training goals.</p>'}
    <div class="row between"><h4>Interventions and reviews</h4>${isBothView() || p.status !== 'Active' ? '' : `<button class="btn sm primary" data-act="iv-add" data-plan="${p.id}">+ Intervention</button>`}</div>
    ${ivs.length ? table(IV_HEAD(false), ivs.map(f => ivRow(f, false))) : '<p class="small muted">No intervention yet: visits, training, display, a scheme, joint marketing or a credit review.</p>'}
    <details class="more"><summary>Files on this plan (${D.documents.filter(d => d.plan_id === p.id).length})</summary>${filesBox({ id: 'pl' + p.id, client: c.id, plan: p.id, types: ['Plan', 'Display photo', 'Training', 'Agreement', 'Other'], docs: D.documents.filter(d => d.plan_id === p.id), canAdd: !isBothView(), title: 'Add files to the plan', emptyTitle: 'No files on this plan yet' })}</details></section>`;
}
function clientPlan(c) {
  whyReset();
  const ps = PLANS().filter(p => p.client_id === c.id).sort((a, b) => (a.status === 'Active' ? 0 : 1) - (b.status === 'Active' ? 0 : 1) || b.start_on.localeCompare(a.start_on));
  return `<div class="stack"><div class="row between"><p class="small muted" style="max-width:760px">${(c.extra || {}).priority200 ? `${esc(c.name)} is in Priority 200.` : `${esc(c.name)} is not in Priority 200 yet (set it on the dealer's page); a plan can still be made.`} Progress is counted from orders invoiced between the plan's dates; nothing is typed.</p>${isBothView() ? '' : `<button class="btn primary" data-act="pl-add" data-client="${c.id}">Start a development plan</button>`}</div>
    ${ps.length ? ps.map(p => planCard(c, p)).join('') : empty('No development plan yet', 'A plan sets goals (sales, boxes, categories, display, training) over a period, with interventions that get there and a review cadence.')}</div>`;
}
/* Priority 200 › Plans and interventions: every plan and every intervention in your view */
EM.ivF = { status: '', kind: '', who: '', period: 'all', from: '', to: '', field: '', fq: '' };
DF_STATE.iv = () => EM.ivF;
const IVF_FIELDS = [['action', 'Intervention'], ['dealer', 'Dealer'], ['who', 'Who'], ['outcome', 'What came of it'], ['note', 'Note']];
const ivVal = (f, k) => k === 'dealer' ? clientName(f.client_id) : k === 'who' ? staffName(f.owner_id) : String(f[k] || '');
function ivRows() {
  const f = EM.ivF, fq = f.fq.trim().toLowerCase();
  return FUS().filter(x => x.plan_id && fuInDiv(x) && (!f.status || ivState(x) === f.status) && (!f.kind || x.iv_kind === f.kind) && (!f.who || x.owner_id === f.who) && inPeriod(dayTs(x.due_date), f.period, f.from, f.to)
    && (!fq || (f.field ? [ivVal(x, f.field)] : IVF_FIELDS.map(([k]) => ivVal(x, k))).some(v => v.toLowerCase().includes(fq)))
    && matches(`${x.action} ${clientName(x.client_id)} ${staffName(x.owner_id)} ${x.outcome || ''}`, [])).sort((a, b) => a.due_date.localeCompare(b.due_date));
}
function p200Plans() {
  whyReset();
  const P = D.access.prices, R = D.lists.rules, f = EM.ivF, ps = PLANS().filter(p => { const c = CL()[p.client_id]; return c && inDiv(c); }), rows = ivRows(), all = FUS().filter(x => x.plan_id);
  const dealers = D.clients.filter(c => DEALER_KINDS.includes(c.kind) && inDiv(c) && c.division !== 'retail'), inList = dealers.filter(c => (c.extra || {}).priority200);
  const sel = (k, label, opts) => `<label class="field" style="min-width:150px"><span class="small muted">${label}</span><select class="input" data-ivf="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const planRow = p => { const pr = planProg(p), pc = planPct(p), rv = planIvs(p).find(x => x.iv_kind === 'Review' && x.status === 'open');
    return { href: `#/client/${p.client_id}/plan`, cells: [`<b>${esc(clientName(p.client_id))}</b><div class="small muted">${esc(p.title)}</div>`, `${ds(p.start_on)} to ${ds(p.end_on)}`, esc(staffName(p.owner_id)), ...(P ? [p.goal_value ? `${inr0(pr.value)} of ${inr0(p.goal_value)}` : ''] : []), p.goal_boxes ? `${num(pr.boxes)} of ${num(p.goal_boxes)}` : '', pc == null ? '<span class="muted">no goal</span>' : `${bar(pc)} ${pc}%`, `${planIvs(p).filter(x => x.status === 'open' && x.iv_kind !== 'Review').length} open`, rv ? ds(rv.due_date) : '', `<span class="badge ${p.status === 'Active' ? 'info' : 'plain'}">${esc(p.status)}</span>`] }; };
  return `<div class="stack"><div class="stack-s"><div class="kicker">EGO Premium · the dealers developed first</div><h1>Priority 200</h1>
      <p class="muted" style="max-width:800px">Each dealer's development plan: goals over a period, the interventions that get there (visits, training, display, schemes, joint marketing, credit reviews) and a review cadence. Every intervention and review is also a follow-up, so it reminds the doer, shows to their manager when late and is in the founders' roll-up. Progress is counted from invoiced orders.</p></div>
    ${subtabs('#/p200', 'plans', [['list', `In Priority 200 <span class="muted">${inList.length}</span>`], ['candidates', `Other dealers <span class="muted">${dealers.length - inList.length}</span>`], ['plans', `Plans and interventions <span class="muted">${ps.filter(p => p.status === 'Active').length}</span>`]])}
    <div class="grid g4">${tile('Active plans', num(ps.filter(p => p.status === 'Active').length), `${inList.filter(c => !ps.some(p => p.client_id === c.id && p.status === 'Active')).length} Priority 200 dealers without one`)}${tile('Interventions open', num(all.filter(x => x.status === 'open' && x.iv_kind !== 'Review' && fuInDiv(x)).length))}${tile('Overdue', num(all.filter(x => ivState(x) === 'Overdue' && fuInDiv(x)).length), 'interventions and reviews')}${tile('Done this month', num(all.filter(x => x.iv_status === 'Done' && thisMonthD(x.done_at) && fuInDiv(x)).length))}</div>
    <section class="card stack-s" data-p200-plans><h3>Plans</h3>${ps.length ? table(['Dealer', 'Period', 'Driven by', ...(P ? ['Sales'] : []), 'Boxes', 'Progress', 'Interventions', 'Next review', 'Status'], ps.map(planRow)) : '<p class="small muted">No plan yet. Open a dealer, then Development plan, then Start a development plan.</p>'}
      <p class="small muted">Progress is the average of the goals set (sales, boxes, categories), each capped at 100%. Display and training goals are followed through their interventions.</p></section>
    <section class="card stack-s"><div class="row between"><h3>Interventions and reviews</h3><button class="btn sm" data-act="iv-csv">Download for Excel</button></div>
      <div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-iv-filters>${dateFilter(f, 'iv', 'Due')}${sel('status', 'Status', [['', 'Every status'], ...['Planned', 'In progress', 'Overdue', 'Done', 'Cancelled'].map(s => [s, s])])}${sel('kind', 'Kind', [['', 'Every kind'], ...[...IV_KINDS, 'Review'].map(k => [k, k])])}${sel('who', 'Who', [['', 'Everyone'], ...[...new Set(all.map(x => x.owner_id))].map(id => [id, staffName(id)]).sort((a, b) => a[1].localeCompare(b[1]))])}
        ${sel('field', 'Any field', [['', 'Any field'], ...IVF_FIELDS])}<label class="field" style="min-width:150px"><span class="small muted">contains</span><input class="input" id="iv-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
      ${searchBox('Intervention, dealer, person or outcome')}
      ${rows.length ? table(IV_HEAD(true), rows.slice(0, 500).map(x => ivRow(x, true))) : '<p class="small muted">Nothing for this filter.</p>'}</section></div>`;
}
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.ivf; if (k) { EM.ivF[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'iv-fq') { EM.ivF.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#iv-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
EM.ACTIONS['iv-csv'] = () => { const rows = ivRows();
  csvDownload('EGO interventions', ['Due', 'Dealer', 'Kind', 'Intervention', 'Who', 'Status', 'Done or cancelled on', 'What came of it', 'How it happened', 'Note'], rows.map(x => [x.due_date, clientName(x.client_id), x.iv_kind, x.action, staffName(x.owner_id), ivState(x), x.done_at ? dayIST(x.done_at) : '', x.outcome || '', x.source || '', x.note || '']));
  EM.toast(`<b>${rows.length}</b> intervention${rows.length === 1 ? '' : 's'} downloaded.`); };

/* ---------------------------------------------------------------- the dealer portal logins, on the dealer's page (Owner) */
const PUS = () => D.portal_users || [];
function clientPortal(c) {
  if (!isOwner()) return EM.noAccess('Only an Owner gives dealers a portal login.');
  const us = PUS().filter(u => u.client_id === c.id), ps = PLANS().filter(p => p.client_id === c.id && p.status === 'Active');
  return `<div class="stack"><p class="small muted" style="max-width:780px">A portal login lets someone at ${esc(c.name)} sign in on their phone at the same address as EGO Master and see only their own orders and where each is, their PI, invoices and payment proofs, their schemes, the leads EGO handed them (which they update there), and raise an order request or a complaint.${ps.length ? ` Their plan's progress shows only when "Show its progress in the dealer portal" is ticked on the plan (${ps.filter(p => p.show_dealer).length ? 'it is' : 'it is not'}).` : ''} Nothing about any other dealer is ever sent to it.</p>
    ${us.length ? table(['Name', 'Username', 'Mobile', 'Status', 'Last sign-in', ''], us.map(u => [`<b>${esc(u.name)}</b>`, esc(u.login), esc(fmtMobile(u.mobile)), u.active ? (u.must_change ? '<span class="badge warn">Temporary password</span>' : '<span class="badge ok">On</span>') : '<span class="badge plain">Switched off</span>', u.last_login_at ? whenTxt(u.last_login_at) : '<span class="muted">Not yet</span>',
      `<div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm ghost" data-act="pu-pass" data-id="${u.id}">New password</button><button class="btn sm ghost" data-act="pu-toggle" data-id="${u.id}">${u.active ? 'Switch off' : 'Switch on'}</button></div>`])) : empty('No portal login yet', `Give someone at ${esc(c.name)} a login: they choose their own password the first time they sign in.`)}
    <div class="row"><button class="btn primary" data-act="pu-add" data-client="${c.id}">+ Portal login</button></div></div>`;
}
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 30);
EM.ACTIONS['pu-add'] = el => { const c = CL()[el.dataset.client], pw = genPass();
  EM.modal(`<h2>Portal login for ${esc(c.name)}</h2><p class="muted small">Write the username and temporary password down now and give them to the dealer: the password is not shown again. They choose their own the first time they sign in.</p>
    <form id="puf" class="stack" onsubmit="return false" style="margin-top:12px"><div class="fgrid">${fieldHtml({ key: 'name', label: 'Who signs in', type: 'text', req: true }, '', 'pu')}${fieldHtml(STAFF_MOBILE, '', 'pu')}${fieldHtml({ key: 'login', label: 'Username', type: 'text', req: true }, slug(c.name), 'pu')}${fieldHtml({ key: 'password', label: 'Temporary password', type: 'text', req: true }, pw, 'pu')}</div>
      ${errBox('pu-err')}<div class="row sticky-actions"><button class="btn primary" data-act="pu-go" data-client="${c.id}">Create the login</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`); };
EM.ACTIONS['pu-go'] = async el => {
  const F = [{ key: 'name', type: 'text' }, STAFF_MOBILE, { key: 'login', type: 'text' }, { key: 'password', type: 'text' }], v = withDials(readForm(qs('#puf'), F), F);
  busy(el, true);
  try { const r = await API('POST', '/api/portal-users', { ...v, client_id: el.dataset.client }); D.portal_users = [...PUS(), r.portal_user]; EM.closeModal();
    EM.modal(`<h2>Login created</h2><p>Give these to ${esc(r.portal_user.name)}:</p>${kv([['Address', esc(location.origin + location.pathname)], ['Username', `<b>${esc(r.portal_user.login)}</b>`], ['Temporary password', `<b>${esc(v.password)}</b>`]])}<p class="small muted">They choose their own password the first time they sign in.</p><div class="row"><button class="btn primary" data-act="close-modal">Done</button></div>`); EM.rerender(); }
  catch (x) { busy(el, false); showErr('pu-err', x.message); }
};
EM.ACTIONS['pu-pass'] = async el => { const u = PUS().find(x => x.id === el.dataset.id), pw = genPass();
  if (!confirm(`Give ${u.name} a new temporary password? They are signed out everywhere.`)) return;
  try { const r = await API('POST', `/api/portal-users/${u.id}/password`, { password: pw }); upsertLocal(D.portal_users, r.portal_user); EM.modal(`<h2>New temporary password</h2>${kv([['Username', `<b>${esc(u.login)}</b>`], ['Temporary password', `<b>${esc(pw)}</b>`]])}<p class="small muted">Not shown again. They choose their own when they sign in.</p><div class="row"><button class="btn primary" data-act="close-modal">Done</button></div>`); EM.rerender(); }
  catch (x) { bubbleNear(el, x.message); } };
EM.ACTIONS['pu-toggle'] = async el => { const u = PUS().find(x => x.id === el.dataset.id);
  try { const r = await API('POST', '/api/portal-users/' + u.id, { active: !u.active }); upsertLocal(D.portal_users, r.portal_user); EM.toast(`${esc(u.name)}: portal login ${r.portal_user.active ? 'switched on' : 'switched off'}.`); EM.rerender(); } catch (x) { bubbleNear(el, x.message); } };

/* ---------------------------------------------------------------- Analysis › Dealer leads: does each dealer act on the leads it is given? */
AN_TABS.push(['leads', 'Dealer leads']);
function anLeads() {
  if (anCo() === 'retail') return '<div class="callout">Leads are handed to EGO Premium dealers. Switch the company to EGO Premium.</div>';
  const N = escDays(), ls = LEADS().filter(l => anIn(dayIST(l.handed_at)) && anWhoOk(leadDealer(l).owner_id) && anRegionOk(leadDealer(l).region || ''));
  const LH = LEAD_HEAD(), lrow = l => leadRow(l);
  /* by stage role, whatever the stages are called now: accepted or further, site visit or further (Lost is never further) */
  const S = D.lists.stages[RETAIL] || [], W = wonStage(RETAIL, D.lists), LO = lostStage(RETAIL, D.lists), at = (l, role) => l.status !== LO && S.indexOf(l.status) >= S.indexOf(role);
  const ACC = nm(D.lists, 'stages.' + RETAIL, 'Dealer accepted'), SV = S.find((x, k) => k > S.indexOf(ACC) && x !== LO) || W;
  const reached = l => at(l, ACC), visited = l => at(l, SV);
  const lf = (a, title, calc) => fig(num(a.length), { title, calc: `${calc} Leads handed over in the dates. Filter: ${anFilterTxt()}.`, head: LH, rows: a.map(lrow) });
  const cols = (a, who) => [lf(a, `Handed to ${who}`, 'Every lead handed over.'), lf(a.filter(reached), `Accepted or further: ${who}`, `Leads now at ${ACC} or a later stage.`), lf(a.filter(visited), `${SV} or further: ${who}`, `Leads now at ${SV} or a later stage.`),
    lf(a.filter(l => l.status === W), `Won: ${who}`, `Leads now at ${W}.`), lf(a.filter(l => l.status === LO), `Lost: ${who}`, `Leads now at ${LO}.`), lf(a.filter(leadStale), `No update for ${N}+ days: ${who}`, `Open leads whose last update is ${N} or more days old.`), a.length ? `${pct(a.filter(l => l.status === W).length, a.length)}%` : ''];
  const HEAD = first => [first, 'Handed', 'Accepted or further', `${SV} or further`, 'Won', 'Lost', `No update ${N}+ days`, 'Won of handed'];
  const byDealer = groupBy(ls, l => l.dealer_id).map(([k, a]) => [[`<b>${esc(leadDealer({ dealer_id: k }).name)}</b><div class="small muted">field sales ${esc(staffName(leadDealer({ dealer_id: k }).owner_id))}</div>`, ...cols(a, leadDealer({ dealer_id: k }).name)], a.length]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const bySource = groupBy(ls, l => l.source || 'Not given').map(([k, a]) => [esc(k), ...cols(a, k)]);
  const byHander = groupBy(ls, l => l.handed_by).map(([k, a]) => [esc(staffName(k)), ...cols(a, staffName(k))]);
  /* ageing: open leads by the days since their last update, right now */
  const open = ls.filter(leadOpen), buckets = [[`Under ${N} days`, 0, N - 1], [`${N} to 7 days`, N, 7], ['8 to 14 days', 8, 14], ['More than 14 days', 15, 1e9]].filter(([, a, b]) => b >= a).map(([l, a, b]) => { const x = open.filter(z => leadAge(z) >= a && leadAge(z) <= b); return [esc(l), lf(x, `Open, last update ${l} ago`, 'Open leads by the days since their last update, right now.')]; });
  return `<div class="grid g4">${tile('Handed', lf(ls, 'All leads handed', 'Every lead handed over.'))}${tile('Won', lf(ls.filter(l => l.status === W), 'Won', `Leads now at ${W}.`), ls.length ? `${pct(ls.filter(l => l.status === W).length, ls.length)}% of handed` : '')}${tile(`No update ${N}+ days`, lf(ls.filter(leadStale), 'No update', `Open leads whose last update is ${N} or more days old.`))}${tile('Open', lf(open, 'Open', 'Leads not won or lost.'))}</div>
    <p class="small muted">Counted from the consumer leads allocated to dealers (Opportunities › Retail), by the date each was allocated, at the stage each is at now. Click a figure to see the leads.</p>
    ${anSec('Conversion by dealer', HEAD('Dealer'), byDealer, '', 'data-an-leads-dealer')}
    <div class="grid g2">${anSec('By source', HEAD('Source'), bySource)}${anSec('Open leads, by days since the last update', ['Last update', 'Open leads'], buckets)}</div>
    ${anSec('By who handed them over', HEAD('Handed by'), byHander)}`;
}

/* ================================================================ R3a (17 Oct): Projects, in both companies
   A Project is one building or site (spec section 13): its opportunities per tower, phase or product, its contacts by role,
   its Project Partner dealer (only Yes or Potential dealers are offered), its installation sites and its files.
   The list has the filter bar, the Date filter with Custom dates, the search, the Excel sample and upload. */
const pjDiv = () => EM.div === 'both' ? '' : EM.div;
const pjCo = d => d === 'retail' ? 'Big E' : 'EGO Premium';
const pjOpps = p => D.opportunities.filter(o => o.project_id === p.id);
const pjPartner = p => p.partner_id ? (DDIR().find(d => d.id === p.partner_id) || CL()[p.partner_id] || { name: 'Outside your view' }) : null;
const pjSites = p => (OPSD().sites || []).filter(x => x.project_id === p.id);
EM.pjF = { type: '', stage: '', owner: '', city: '', partner: '', period: 'all', from: '', to: '', field: '', fq: '' };
DF_STATE.pj = () => EM.pjF;
const PJ_FILTER_FIELDS = [['name', 'Project name'], ['ref', 'Number'], ['type', 'Project type'], ['city', 'City'], ['address', 'Site address'], ['stage', 'Stage'], ['owner', 'Owner at EGO'], ['partner', 'Project Partner'], ['contacts', 'Contacts'], ['notes', 'Notes']];
const pjVal = (p, k) => k === 'owner' ? staffName(p.owner_id) : k === 'partner' ? (pjPartner(p) || {}).name || '' : k === 'contacts' ? (p.contacts || []).map(c => `${c.role} ${c.name} ${c.mobile}`).join(' ') : String(p[k] ?? '');
function pjRows() {
  const f = EM.pjF, fq = f.fq.trim().toLowerCase();
  return PJS().filter(p => inDiv(p) && (!f.type || p.type === f.type) && (!f.stage || p.stage === f.stage) && (!f.owner || p.owner_id === f.owner) && (!f.city || p.city === f.city) && (!f.partner || p.partner_id === f.partner)
    && inPeriod(p.created_at, f.period, f.from, f.to) && (!fq || (f.field ? [pjVal(p, f.field)] : PJ_FILTER_FIELDS.map(([k]) => pjVal(p, k))).some(v => v.toLowerCase().includes(fq)))
    && matches(`${p.name} ${p.ref || ''} ${p.city} ${p.address} ${p.type} ${pjVal(p, 'partner')} ${pjVal(p, 'contacts')}`, (p.contacts || []).map(c => c.mobile)));
}
EM.VIEWS.projects = () => {
  const f = EM.pjF, all = PJS().filter(inDiv), rows = pjRows(), P = D.access.prices;
  const sel = (k, label, opts) => `<label class="field" style="min-width:150px"><span class="small muted">${label}</span><select class="input" data-pjf="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const uniq = (vals, name) => [...new Set(vals.filter(Boolean))].map(v => [v, name(v)]).sort((a, b) => a[1].localeCompare(b[1]));
  return `<div class="stack">
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">${EM.div === 'both' ? 'EGO Premium and Big E' : pjCo(EM.div)} · one building or site each</div><h1>Projects</h1><p class="muted">${rows.length} of ${all.length} · ${esc(scopeLabel())}</p></div>
      <div class="row" style="flex-wrap:wrap"><button class="btn" data-act="pj-sample">Sample Excel</button><label class="btn" style="cursor:pointer" data-list-only>Upload Excel<input type="file" data-sheet="projects" accept=".xlsx" hidden></label><button class="btn primary" data-act="pj-add">+ Add project</button></div></div>
    ${EM.pjImp ? pjImportPreview() : ''}
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-pj-filters>${dateFilter(f, 'pj', 'When it was added')}
      ${sel('type', 'Project type', [['', 'Every type'], ...optsOf(PROJECT_FIELDS.find(x => x.key === 'type'), D.lists).map(t => [t, t])])}${sel('stage', 'Stage', [['', 'Every stage'], ...optsOf(PROJECT_FIELDS.find(x => x.key === 'stage'), D.lists).map(t => [t, t])])}
      ${sel('owner', 'Owner at EGO', [['', 'Everyone'], ...uniq(all.map(p => p.owner_id), staffName)])}${sel('city', 'City', [['', 'Every city'], ...uniq(all.map(p => p.city), c => c)])}
      ${sel('partner', 'Project Partner', [['', 'Every partner'], ...uniq(all.map(p => p.partner_id), id => (pjPartner({ partner_id: id }) || {}).name || id)])}
      ${sel('field', 'Any field', [['', 'Any field'], ...PJ_FILTER_FIELDS])}<label class="field" style="min-width:150px"><span class="small muted">contains</span><input class="input" id="pj-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
    ${searchBox('Projects: name, city, address or contact')}
    ${rows.length ? table(['Project', 'Type', 'City', 'Stage', 'Owner at EGO', 'Project Partner', 'Opportunities', ...(P ? ['Expected value'] : []), 'Added'], rows.slice(0, 500).map(p => ({ href: `#/project/${p.id}`,
      cells: [`<b>${esc(p.name)}</b><div class="small muted">${esc(p.ref || '')}</div>${EM.div === 'both' ? segBadge(p.division) : ''}`, esc(p.type), esc(p.city), `<span class="badge info">${esc(p.stage)}</span>`, esc(staffName(p.owner_id)), esc((pjPartner(p) || {}).name || ''),
        String(pjOpps(p).length), ...(P ? [money(p.value)] : []), ds(dayIST(p.created_at))] })))
      : empty(all.length ? 'Nothing for this filter' : 'No projects yet', all.length ? 'Change or clear the filters above.' : 'A project is one building or site: a builder\'s tower, a hotel, an office fit-out. Add it, then its opportunities, its contacts and its Project Partner dealer.', all.length ? '' : '<button class="btn primary" data-act="pj-add">+ Add project</button>')}</div>`;
};
EM.VIEWS.projects.title = () => 'Projects';
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.pjf; if (k) { EM.pjF[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'pj-fq') { EM.pjF.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#pj-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });

/* ---- the project page */
EM.VIEWS.project = arg => {
  const [id] = String(arg || '').split('/'), p = PJS().find(x => x.id === id);
  if (!p) return `<div class="stack"><h1>Project not found</h1><p class="muted">It may have been deleted, or it is outside your view.</p><a class="btn" href="#/projects">Projects</a></div>`;
  const ops = pjOpps(p), pipe = PROJECT_PIPE[p.division], partner = pjPartner(p), sites = pjSites(p), P = D.access.prices;
  const free = (OPSD().sites || []).filter(x => x.division === p.division && !x.project_id);
  const fields = showFields(PROJECT_FIELDS).filter(f => !['name', 'partner_id', 'notes'].includes(f.key));
  return `<div class="stack">${crumbs(['Projects', '#/projects'], [p.name])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(p.name)}</h1>
      <div class="row"><span class="badge info plain">${esc(p.type)}</span><span class="badge plain">${esc(p.stage)}</span><span class="badge plain">${esc(pjCo(p.division))}</span><span class="small muted">${esc(p.ref || '')}</span></div>
      <p class="muted">${esc(p.city)}${p.address ? ' · ' + esc(p.address) : ''} · owner ${esc(staffName(p.owner_id))}</p></div>
      <div class="row"><button class="btn" data-act="pj-edit" data-id="${p.id}">Edit</button><button class="btn primary" data-act="opp-add" data-pipeline="${pipe}" data-project="${p.id}">+ New opportunity</button>${D.access.can_delete ? `<button class="btn ghost" data-act="pj-del" data-id="${p.id}">Delete</button>` : ''}</div></div>
    <div class="grid g2"><section class="card stack-s"><h3>Details</h3>${kv(fields.map(f => [esc(f.label), showVal(f, p[f.key])]))}${p.notes ? `<p class="small" style="white-space:pre-line">${esc(p.notes)}</p>` : ''}${p.prices_hidden ? '<p class="small muted">Money is hidden for your role.</p>' : ''}</section>
      <section class="card stack-s" data-pj-partner><h3>Project Partner</h3>${partner ? kv([['Dealer', CL()[partner.id] ? `<a href="#/client/${partner.id}">${esc(partner.name)}</a>` : esc(partner.name)], ['Project Partner', esc(partner.project_partner || ((CL()[partner.id] || {}).extra || {}).project_partner || '')], ['Capability', esc(partner.partner_capability || ((CL()[partner.id] || {}).extra || {}).partner_capability || '') || NOTSET], ['City', esc(partner.city || '')]])
        : `<p class="muted small">No Project Partner yet. Only dealers marked Yes or Potential as Project Partner (on the dealer's page) are offered.</p><div class="row"><button class="btn sm" data-act="pj-edit" data-id="${p.id}">Choose the Project Partner</button></div>`}</section></div>
    <section class="card stack-s" data-pj-opps><div class="row between"><h3>Opportunities (${ops.length})</h3><button class="btn sm primary" data-act="opp-add" data-pipeline="${pipe}" data-project="${p.id}">+ New opportunity</button></div>
      <p class="small muted">One per tower, phase or product, in the ${esc(PIPELINES[pipe].label.toLowerCase())} pipeline. "New opportunity" fills in this project.</p>
      ${ops.length ? table(['Opportunity', 'Client', 'Stage', ...(P ? ['Value'] : []), 'Owner'], ops.map(o => ({ href: `#/opp/${o.id}`, cells: [`<b>${esc(o.title)}</b><div class="small muted">${esc(o.ref || '')}</div>`, esc(clientName(o.client_id)), stageBadge(o.stage), ...(P ? [money(o.value)] : []), esc(staffName(o.owner_id))] }))) : '<p class="muted small">No opportunity linked yet.</p>'}</section>
    <section class="card stack-s" data-pj-contacts><div class="row between"><h3>Contacts by role (${(p.contacts || []).length})</h3><button class="btn sm" data-act="pj-edit" data-id="${p.id}">Add or change contacts</button></div>
      ${(p.contacts || []).length ? table(['Role', 'Name', 'Mobile', 'Email'], p.contacts.map(c => [esc(c.role), `<b>${esc(c.name)}</b>`, esc(fmtMobile(c.mobile)), esc(c.email || '')])) : '<p class="muted small">No contact yet: add the owner, purchase manager, project manager, architect and contractor.</p>'}</section>
    <section class="card stack-s" data-pj-sites><div class="row between"><h3>Installation sites (${sites.length})</h3>${isBothView() ? '' : `<button class="btn sm primary" data-act="site-add" data-project="${p.id}">+ New installation site</button>`}</div>
      ${sites.length ? table(['Site', 'Step', 'Installed by', 'Address', ''], sites.map(x => [`<a href="#/site/${x.id}"><b>${esc(x.name)}</b></a><div class="small muted">${esc(x.ref || '')}</div>`, esc(x.step), esc(installedByTxt(x)), esc(x.address || ''), isBothView() ? '' : `<button class="btn sm ghost" data-act="pj-site" data-id="${p.id}" data-site="${x.id}" data-unlink="1">Unlink</button>`])) : '<p class="muted small">No installation site linked yet.</p>'}
      ${free.length ? `<div class="row" style="align-items:flex-end"><label class="field" style="min-width:260px"><span class="small muted">Link a site already added</span><select class="input" id="pj-site-pick"><option value="">Choose</option>${free.map(x => `<option value="${x.id}">${esc(x.name)} · ${esc(x.step)}</option>`).join('')}</select></label><button class="btn sm" data-act="pj-site" data-id="${p.id}">Link it</button></div>` : ''}</section>
    <section class="stack-s"><h3>Files</h3>${filesBox({ id: 'pj', project: p.id, types: ['Drawing', 'BOQ', 'Quotation', 'Site photo', 'Agreement', 'Other'], docs: D.documents.filter(d => d.project_id === p.id), canAdd: !isBothView(), title: 'Add files to this project', note: 'Drawings, BOQ, quotations, site photos: one or many at a time. Each opens in the browser, downloads and shares.', emptyTitle: 'No files on this project yet' })}</section></div>`;
};
EM.VIEWS.project.tab = 'projects';
EM.VIEWS.project.title = id => (PJS().find(x => x.id === String(id).split('/')[0]) || { name: 'Project' }).name;

/* ---- add or edit: the fields, the company (when both are yours), and the contacts by role */
const pjContactLine = (i, c = {}) => `<div class="row" data-pj-contact style="gap:8px;align-items:flex-end;flex-wrap:wrap">
  <label class="field" style="min-width:150px"><span class="small muted">Role</span><select class="input" data-k="role">${(D.lists.project_roles || PROJECT_ROLES).map(r => `<option ${r === c.role ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
  <label class="field" style="min-width:160px"><span class="small muted">Name</span><input class="input" data-k="name" value="${esc(c.name || '')}"></label>
  <label class="field" style="min-width:140px"><span class="small muted">Mobile</span><input class="input" data-k="mobile" inputmode="tel" value="${esc(c.mobile || '')}"></label>
  <label class="field" style="min-width:160px"><span class="small muted">Email</span><input class="input" data-k="email" type="email" value="${esc(c.email || '')}"></label>
  <button type="button" class="btn sm ghost" data-act="pj-c-del">Remove</button></div>`;
function openProjectForm(p) {
  const v = p ? { ...p } : { owner_id: me().id, stage: optsOf(PROJECT_FIELDS.find(f => f.key === 'stage'), D.lists)[0] };
  const co = p ? '' : !pjDiv() ? `<div class="field"><label for="pj-division">Company *</label><select class="input" id="pj-division">${['wholesale', 'retail'].filter(canDiv).map(d => `<option value="${d}">${pjCo(d)}</option>`).join('')}</select></div>` : '';
  EM.modal(`<h2>${p ? 'Edit project ' + esc(p.ref || '') : 'Add a project'}</h2><p class="muted small">${p ? esc(pjCo(p.division)) : pjDiv() ? esc(pjCo(pjDiv())) : 'Choose the company'}. One building or site; its opportunities, sites and files go under it.</p>
    <form id="pjf" class="stack" onsubmit="return false" style="margin-top:12px" data-id="${p ? p.id : ''}"><div class="fgrid">${co}${showFields(PROJECT_FIELDS).map(f => fieldHtml(f, v[f.key], 'pj', { division: p ? p.division : pjDiv() || '' })).join('')}</div>
      ${fsHtml('Contacts by role', `<p class="small muted">Owner, purchase manager, project manager, architect, contractor (the roles are in Lists &amp; stages).</p><div id="pj-contacts" class="stack-s">${(v.contacts || []).map((c, i) => pjContactLine(i, c)).join('')}</div><div class="row"><button type="button" class="btn sm" data-act="pj-c-add">+ Add a contact</button></div>`)}
      ${errBox('pj-err')}<div class="row sticky-actions"><button class="btn primary" data-act="pj-save">${p ? 'Save changes' : 'Add project'}</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
EM.ACTIONS['pj-add'] = () => openProjectForm(null);
EM.ACTIONS['pj-edit'] = el => openProjectForm(PJS().find(x => x.id === el.dataset.id));
EM.ACTIONS['pj-c-add'] = () => { qs('#pj-contacts').insertAdjacentHTML('beforeend', pjContactLine(qs('#pj-contacts').children.length)); };
EM.ACTIONS['pj-c-del'] = el => el.closest('[data-pj-contact]').remove();
EM.ACTIONS['pj-save'] = async el => {
  const form = qs('#pjf'), id = form.dataset.id, v = readForm(form, PROJECT_FIELDS);
  v.contacts = [...form.querySelectorAll('[data-pj-contact]')].map(r => Object.fromEntries([...r.querySelectorAll('[data-k]')].map(x => [x.dataset.k, x.value.trim()])));
  if (!id) v.division = pjDiv() || (qs('#pj-division') || { value: '' }).value;
  busy(el, true);
  try {
    const r = await API('POST', id ? '/api/projects/' + id : '/api/projects', v);
    D.projects = PJS(); upsertLocal(D.projects, r.project); EM.closeModal();
    EM.toast(`<b>${esc(r.project.name)}</b> ${r.created ? 'added' : 'saved'} · ${esc(r.project.ref || '')}`);
    location.hash = '#/project/' + r.project.id; EM.rerender();
  } catch (x) { busy(el, false); showErr('pj-err', x.errors || x.message); }
};
EM.ACTIONS['pj-del'] = async el => {
  const p = PJS().find(x => x.id === el.dataset.id), n = pjOpps(p).length;
  if (!confirm(`Delete the project ${p.name}?${n ? ` Its ${n} opportunit${n === 1 ? 'y stays' : 'ies stay'}, unlinked.` : ''} It stays in the Recycle bin for 30 days.`)) return;
  try { await API('DELETE', '/api/projects/' + p.id); D.projects = PJS().filter(x => x.id !== p.id); D.opportunities.forEach(o => { if (o.project_id === p.id) o.project_id = ''; }); EM.toast('Project deleted, in the Recycle bin for 30 days.'); location.hash = '#/projects'; } catch (x) { bubbleNear(el, x.message); }
};
EM.ACTIONS['pj-site'] = async el => {
  const site = el.dataset.site || (qs('#pj-site-pick') || { value: '' }).value;
  if (!site) return bubbleNear(el, 'Choose the site first.');
  busy(el, true);
  try { await API('POST', `/api/projects/${el.dataset.id}/sites`, { site_id: site, unlink: !!el.dataset.unlink }); await reload4(); EM.toast(el.dataset.unlink ? 'Site unlinked.' : 'Site linked to the project.'); EM.rerender(); } catch (x) { busy(el, false); bubbleNear(el, x.message); }
};

/* ---- the Projects Excel: built at download from today's lists (types, stages, cities, team, Project Partners), with real dropdowns */
const PJ_SHEET = [['Company', 'company', true, 'EGO Premium or Big E.'], ['Project name', 'name', true, 'The building or site.'], ['Project type', 'type', true, 'From the list.'], ['City', 'city', true, 'From the city list.'],
  ['Site address', 'address', false, 'Optional.'], ['Stage', 'stage', true, 'From the list.'], ['Owner at EGO', 'owner', true, 'As named in Team & access.'], ['Expected value (Rs)', 'value', false, 'Rupees. Optional.'],
  ['Project Partner', 'partner', false, 'A dealer marked Yes or Potential as Project Partner. Optional.'], ['Notes', 'notes', false, 'Optional.']];
EM.ACTIONS['pj-sample'] = async el => {
  busy(el, true);
  try {
    await loadJs(EXCELJS_URL, () => window.ExcelJS);
    const wb = new window.ExcelJS.Workbook(), fill = wb.addWorksheet('Fill this'), how = wb.addWorksheet('How to fill'), lists = wb.addWorksheet('Lists');
    const L = { company: ['wholesale', 'retail'].filter(canDiv).map(pjCo), type: optsOf(PROJECT_FIELDS.find(f => f.key === 'type'), D.lists), city: D.lists.cities.map(c => c.city), stage: optsOf(PROJECT_FIELDS.find(f => f.key === 'stage'), D.lists),
      owner: D.staff.filter(s => s.active).map(s => s.name), partner: DDIR().filter(d => PARTNER_OK.includes(d.project_partner)).map(d => d.name) };
    Object.entries(L).forEach(([k, vals], i) => { lists.getCell(1, i + 1).value = k; vals.forEach((v, r) => { lists.getCell(r + 2, i + 1).value = v; }); });
    lists.state = 'hidden';
    fill.columns = PJ_SHEET.map(([h, , req]) => ({ header: h + (req ? ' *' : ''), width: Math.max(16, h.length + 6) }));
    fill.getRow(1).font = { bold: true }; fill.views = [{ state: 'frozen', ySplit: 1 }];
    PJ_SHEET.forEach(([, k, req], i) => { const letter = fill.getColumn(i + 1).letter, li = Object.keys(L).indexOf(k);
      for (let r = 2; r <= 501; r++) { const cell = fill.getCell(letter + r);
        if (li >= 0 && L[k].length) { const col = lists.getColumn(li + 1).letter; cell.dataValidation = { type: 'list', allowBlank: !req, formulae: [`Lists!$${col}$2:$${col}$${L[k].length + 1}`], showErrorMessage: true, errorTitle: 'Pick from the list', error: 'Choose a value from the dropdown.' }; }
        else if (k === 'value') cell.dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: true, formulae: [0], showErrorMessage: true, error: 'A number, 0 or more.' }; } });
    how.getCell('A1').value = 'EGO Master: projects'; how.getCell('A1').font = { bold: true, size: 14 };
    how.getCell('A2').value = 'Fill the "Fill this" tab, one project per row. Columns with * are compulsory. The dropdowns hold today\'s lists, team and Project Partners.';
    how.getCell('A3').value = `Made on ${today()} by ${me().name}. Upload it on the Projects screen: every row is checked and shown as new, update or a mistake before anything is saved. The same project name in the same city and company is updated.`;
    PJ_SHEET.forEach(([h, , req, note], i) => { how.getCell('A' + (5 + i)).value = h; how.getCell('B' + (5 + i)).value = req ? 'Compulsory' : 'Optional'; how.getCell('C' + (5 + i)).value = note; });
    how.getColumn(1).width = 24; how.getColumn(3).width = 80;
    const buf = await wb.xlsx.writeBuffer(), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.download = `EGO Master projects ${today()}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    EM.toast('The projects file is downloading, with today\'s lists in its dropdowns.');
  } catch (x) { bubbleNear(el, x.message); }
  busy(el, false);
};
EM.pjImp = null;
document.addEventListener('change', async e => {
  if (!e.target.matches('input[data-sheet="projects"]')) return;
  const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
  try {
    await loadJs(EXCELJS_URL, () => window.ExcelJS);
    const wb = new window.ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.getWorksheet('Fill this') || wb.worksheets[0], heads = [], rows = [];
    const txt = v => v == null ? '' : typeof v === 'object' ? (v.text || v.result || (v.richText ? v.richText.map(x => x.text).join('') : '')) : String(v);
    ws.getRow(1).eachCell((c, i) => { heads[i] = txt(c.value).replace(/\s*\*$/, '').trim(); });
    ws.eachRow((r, n) => { if (n === 1) return; const x = { row: n }; let any = false;
      PJ_SHEET.forEach(([h, k]) => { const i = heads.indexOf(h); const v = i > 0 ? txt(r.getCell(i).value).trim() : ''; if (v) any = true; x[k] = v; });
      if (any) rows.push(x); });
    if (!rows.length) throw new Error('No filled rows in the "Fill this" tab.');
    const res = await API('POST', '/api/projects/import', { rows, save: false });
    EM.pjImp = { file: file.name, rows, res: res.rows }; EM.rerender();
  } catch (x) { EM.pjImp = { file: file.name, error: x.message, rows: [], res: [] }; EM.rerender(); }
});
function pjImportPreview() {
  const I = EM.pjImp, cnt = s => I.res.filter(r => r.status === s).length;
  return `<section class="card stack-s" data-pj-import><div class="row between"><h3>Read: ${esc(I.file)}</h3><button class="btn sm ghost" data-act="pj-imp-close">Close</button></div>
    ${I.error ? `<div class="callout warn">${esc(I.error)}</div>` : `<p class="small">${num(cnt('new'))} new · ${num(cnt('update'))} update · <b>${num(cnt('error'))} with a mistake</b>. ${I.saved ? 'Saved.' : 'Nothing is saved until you press Save.'}</p>
    ${table(['Row', 'Status', 'Project', 'Mistake'], I.res.map(r => [String(r.row), `<span class="badge ${r.status === 'error' ? 'bad' : r.status === 'new' ? 'ok' : 'info'}">${r.status === 'error' ? 'Mistake' : r.status === 'new' ? 'New' : 'Update'}</span>`, esc(r.label), esc(r.error || '')]))}
    ${!I.saved && (cnt('new') + cnt('update')) ? `<div class="row"><button class="btn primary" data-act="pj-imp-save">Save the ${num(cnt('new') + cnt('update'))} good rows${cnt('error') ? ' (rows with a mistake are skipped)' : ''}</button></div>` : ''}`}</section>`;
}
EM.ACTIONS['pj-imp-close'] = () => { EM.pjImp = null; EM.rerender(); };
EM.ACTIONS['pj-imp-save'] = async el => {
  busy(el, true);
  try { const r = await API('POST', '/api/projects/import', { rows: EM.pjImp.rows, save: true }); EM.pjImp = { ...EM.pjImp, res: r.rows, saved: true }; await reload4(); EM.toast(`<b>${r.rows.filter(x => x.status !== 'error').length} projects saved</b>`); EM.rerender(); }
  catch (x) { busy(el, false); bubbleNear(el, x.message); }
};

/* ================================================================ R2a (17 Oct): Attendance and the Roadmap planner (desktop)
   The field team's day, for managers, Owners and telesales (FIELD_TABS in schema.js; a role with a fixed screen list sees them
   when ticked in Roles & access). Read from /api/field/board for the dates asked, in the viewer's scope; the patterns are
   Picasso's design/field.css (.fb-*) as they are. */
const fic = (n, cls) => `<svg class="${cls == null ? 'fd-ic' : cls}" aria-hidden="true"><use href="icons.svg#i-${n}"/></svg>`;
Object.assign(ICON, { attendance: fic('user-check', 'ic'), roadmap: fic('route', 'ic') });
EM.FB = null;   // the last board read: { key, data }
const fbRange = f => { const t = today(), ym = t.slice(0, 7), [y, m] = ym.split('-').map(Number), fy = m >= 4 ? y : y - 1, prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`, end = s => { const [a, b] = s.split('-').map(Number); return `${s}-${String(new Date(Date.UTC(a, b, 0)).getUTCDate()).padStart(2, '0')}`; };
  return f.period === 'today' ? [t, t] : f.period === 'month' ? [ym + '-01', t] : f.period === 'last' ? [prev + '-01', end(prev)] : f.period === 'year' ? [`${fy}-04-01`, t] : f.period === 'lastyear' ? [`${fy - 1}-04-01`, `${fy}-03-31`]
    : f.period === 'custom' ? [f.from || t, f.to || f.from || t] : ['2026-01-01', t]; };
function fbLoad(from, to) {
  const key = from + '|' + to;
  if (EM.FB && EM.FB.key === key) return EM.FB.data;
  if (!EM.FB || EM.FB.loading !== key) { EM.FB = { key: null, loading: key, data: EM.FB && EM.FB.data };
    API('GET', `/api/field/board?from=${from}&to=${to}`).then(r => { EM.FB = { key, data: r }; for (const d of r.documents) upsertLocal(D.documents, d); EM.rerender(); })
      .catch(x => { EM.FB = { key, data: { error: x.message, people: [], attendance: [], visits: [], documents: [], beats: [] } }; EM.rerender(); }); }
  return null;
}
const fbHm = ts => ts ? new Date(Date.parse(ts)).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }) : '';
const fbLen = (a, b) => { const n = Math.round((Date.parse(b) - Date.parse(a)) / 6e4); return n >= 60 ? `${Math.floor(n / 60)} h ${n % 60} min` : `${n} min`; };
const fbPlace = (lat, lng, acc, noloc) => noloc || lat == null ? '' : `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}${acc != null ? ` · within ${acc} m` : ''}`;
const fbWhere = (lat, lng, acc, noloc) => noloc || lat == null ? '<span class="muted">Location not shared</span>' : `<a class="fb-where" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}">${fic('map-pin', '')}${esc(fbPlace(lat, lng, acc, noloc))}</a>`;
const fbIni = n => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
const fbFace = (p, docId) => docId ? `<span class="fb-face" role="button" tabindex="0" data-act="fb-photo" data-id="${docId}" title="See the photo">${esc(fbIni(p.name))}<img data-fb-img="${docId}" alt="" hidden></span>` : `<span class="fb-face none">${esc(fbIni(p.name))}</span>`;
/* photos are read with the session, never by a public address; each is fetched once */
EM.fbImg = {};
function fbPaintImgs() { document.querySelectorAll('img[data-fb-img]').forEach(im => { const id = im.dataset.fbImg, show = u => { im.src = u; im.hidden = false; };
  if (EM.fbImg[id]) return show(EM.fbImg[id]);
  fetch(window.EGOAPI.file(id), { headers: { authorization: 'Bearer ' + docTok() } }).then(r => r.ok ? r.blob() : null).then(b => { if (b) { EM.fbImg[id] = URL.createObjectURL(b); show(EM.fbImg[id]); } }).catch(() => {}); }); }
const baseRenderFB = EM.render;
EM.render = (...a) => { baseRenderFB(...a); if (['attendance', 'roadmap'].includes(EM.route().r)) fbPaintImgs(); };
EM.ACTIONS['fb-photo'] = el => { const d = D.documents.find(x => x.id === el.dataset.id); if (!d) return;
  EM.modal(`<h2>${esc(d.type)}</h2><p class="muted small">${esc(staffName(d.uploaded_by))} · ${esc(whenIST(d.created_at))}</p><div style="margin:12px 0"><img data-fb-img="${d.id}" alt="${esc(d.type)}" style="max-width:100%;max-height:60vh;border-radius:12px" hidden></div>
    <div class="row" data-file-acts><button class="btn sm" data-act="fu-view" data-id="${d.id}">View</button><button class="btn sm ghost" data-act="fu-dl" data-id="${d.id}">Download</button><button class="btn sm ghost" data-act="fu-share" data-id="${d.id}">Share</button><button class="btn sm ghost" data-act="close-modal">Close</button></div>`); fbPaintImgs(); };
NAV_ACTS.add('fb-photo'); LOOK_ACTS.add('fb-photo'); NAV_ACTS.add('fb-csv'); LOOK_ACTS.add('fb-csv'); NAV_ACTS.add('fb-count'); LOOK_ACTS.add('fb-count'); for (const k of ['rm-pick', 'att-person']) { NAV_ACTS.add(k); LOOK_ACTS.add(k); }   // looking at a person's days changes nothing; planning waits for one company, like every change

/* ---- Attendance */
EM.attF = { period: 'today', from: '', to: '', q: '', count: '', person: '', field: '', fq: '' };
DF_STATE.att = () => EM.attF;
const ATT_FIELDS = [['person', 'Person'], ['region', 'Area'], ['late', 'Late mark'], ['where', 'Where']];
EM.VIEWS.attendance = () => {
  const f = EM.attF, [from, to] = fbRange(f), B = fbLoad(from, to), one = from === to;
  const sel = (k, label, opts) => `<label class="field" style="min-width:150px"><span class="small muted">${label}</span><select class="input" data-attf="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const head = `<div class="fb-head"><div><h1>Attendance</h1><div class="fb-sub">Field team · start time ${esc((B && B.start) || D.lists.field_start || '10:00')}${isOwner() && !isBothView() ? ' · <button class="btn sm ghost" data-act="att-start">Field app settings</button>' : ''} · ${one ? esc(ds(from)) : `${esc(ds(from))} to ${esc(ds(to))}`}</div></div>
    <div class="fb-tools"><button class="btn sm" data-act="fb-csv">Download for Excel</button></div></div>`;
  const people = B ? B.people : [], P = byIdL(people);
  const filters = `<div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-att-filters>${dateFilter(f, 'att', 'Date filter')}${sel('person', 'Person', [['', 'Everyone'], ...people.map(p => [p.id, p.name])])}
    ${sel('field', 'Any field', [['', 'Any field'], ...ATT_FIELDS])}<label class="field" style="min-width:150px"><span class="small muted">contains</span><input class="input" id="att-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label>
    <label class="field" style="min-width:220px"><span class="small muted">Search</span><input class="input" id="att-q" value="${esc(f.q)}" placeholder="Attendance: person or area"></label></div>`;
  if (!B) return `<div class="fb stack">${head}${filters}<p class="muted">Reading the field team…</p></div>`;
  if (B.error) return `<div class="fb stack">${head}${filters}<div class="callout warn">${esc(B.error)}</div></div>`;
  const vis = (sid, day) => B.visits.filter(v => v.staff_id === sid && v.day === day), road = (sid, day) => { const v = vis(sid, day); return v.length ? `${v.filter(x => x.status === 'done' || x.status === 'in').length} of ${v.length}${v.some(x => x.status === 'missed') ? ` · <span class="badge bad">${v.filter(x => x.status === 'missed').length} missed</span>` : ''}` : '<span class="muted">No Roadmap</span>'; };
  const val = (r, k) => k === 'person' ? (P[r.staff_id] || {}).name || '' : k === 'region' ? (P[r.staff_id] || {}).region || '' : k === 'late' ? (r.late_min ? `Late ${r.late_min} min` : r.start_at ? 'On time' : 'Not started') : k === 'where' ? fbPlace(r.start_lat, r.start_lng, r.start_acc, r.start_noloc) || 'Location not shared' : '';
  const fq = f.fq.trim().toLowerCase(), q = f.q.trim().toLowerCase();
  const keep = r => (!f.person || r.staff_id === f.person) && (!fq || (f.field ? [val(r, f.field)] : ATT_FIELDS.map(([k]) => val(r, k))).some(v => v.toLowerCase().includes(fq))) && (!q || `${val(r, 'person')} ${val(r, 'region')}`.toLowerCase().includes(q));
  const rows = B.attendance.filter(keep);
  /* who has not started: only for one day, and only today or a day already over */
  const notStarted = one && from <= B.today ? people.filter(p => !B.attendance.some(a => a.staff_id === p.id && a.day === from)).map(p => ({ staff_id: p.id, day: from })).filter(keep) : [];
  const cnt = { started: rows.length, late: rows.filter(r => r.late_min > 0).length, not: notStarted.length, ended: rows.filter(r => r.end_at).length };
  const shown = f.count === 'late' ? rows.filter(r => r.late_min > 0) : f.count === 'ended' ? rows.filter(r => r.end_at) : f.count === 'not' ? [] : rows;
  const showNot = !f.count || f.count === 'not';
  EM.attRows = { rows: shown, notStarted: showNot ? notStarted : [], P, vis };
  const countBtn = (k, n, l, cls) => `<button class="fb-count ${cls}${f.count === k ? ' on' : ''}" data-act="fb-count" data-k="${k}" aria-pressed="${f.count === k}"><span class="fb-n">${n}</span><span class="fb-l">${l}</span></button>`;
  const who = (p, docId) => `<div class="fb-who">${fbFace(p, docId)}<div><b><a href="#/attendance" data-act="att-person" data-id="${p.id}" title="This person's days">${esc(p.name)}</a></b><span>${esc(p.region || '')}</span></div></div>`;
  const tr = r => { const p = P[r.staff_id] || { name: staffName(r.staff_id) };
    return `<tr data-att="${r.staff_id}|${r.day}"><td>${who(p, r.start_photo)}</td><td>${one ? '' : esc(ds(r.day)) + ' · '}${esc(fbHm(r.start_at))}</td><td>${fbWhere(r.start_lat, r.start_lng, r.start_acc, r.start_noloc)}</td>
      <td>${r.late_min ? `<span class="badge warn">Late ${r.late_min} min</span>` : '<span class="badge ok">On time</span>'}</td><td>${road(r.staff_id, r.day)}</td>
      <td>${r.end_at ? `${esc(fbHm(r.end_at))} · ${esc(fbLen(r.start_at, r.end_at))}${r.end_noloc ? '<div class="small muted">Location not shared</div>' : ''}` : '<span class="muted">Not yet</span>'}</td>
      <td class="r">${r.end_photo ? `<button class="btn sm ghost" data-act="fb-photo" data-id="${r.end_photo}">End photo</button>` : ''}${r.start_photo ? '' : '<span class="small muted">No photo</span>'}</td></tr>`; };
  const trNot = r => { const p = P[r.staff_id];
    return `<tr data-att-not="${p.id}"><td>${who(p, '')}</td><td><span class="badge bad">Not started</span></td><td class="muted">No location yet</td><td class="muted">After ${esc(B.start)}</td><td>${road(p.id, r.day)}</td><td class="muted">Not yet</td>
      <td class="r">${p.mobile ? `<a class="btn sm" href="tel:${esc(p.mobile)}">${fic('phone')}Call</a>` : ''}</td></tr>`; };
  const body = shown.length || (showNot && notStarted.length) ? `<div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Person</th><th>Start my day</th><th>Where</th><th>Late mark</th><th>Roadmap</th><th>End my day</th><th></th></tr></thead><tbody>
      ${showNot && notStarted.length ? `<tr class="fb-group"><td colspan="7">Not started yet · ${notStarted.length}</td></tr>${notStarted.map(trNot).join('')}` : ''}
      ${shown.length ? `<tr class="fb-group"><td colspan="7">Started · ${shown.length}</td></tr>${shown.map(tr).join('')}` : ''}</tbody></table></div><p class="small muted">Click a face to see the photo full size, with the time it was taken; View, Download and Share are there. Where is the GPS fix from the phone.</p>`
    : empty(people.length ? 'Nothing for this filter' : 'No field team yet', people.length ? 'Change the Date filter or clear the filters above.' : 'People whose role is Field Sales show here once they are added in Team & access.');
  return `<div class="fb stack">${head}${filters}<div class="fb-counts">${countBtn('started', cnt.started, 'Started', '')}${countBtn('late', cnt.late, 'Late', 'warn')}${countBtn('not', one && from <= B.today ? cnt.not : 0, 'Not started yet', 'bad')}${countBtn('ended', cnt.ended, 'Ended the day', '')}</div>${body}</div>`;
};
EM.VIEWS.attendance.title = () => 'Attendance';
EM.ACTIONS['fb-count'] = el => { const k = el.dataset.k, f = EM.route().r === 'roadmap' ? EM.rmF : EM.attF; f.count = f.count === k ? '' : k; EM.rerender(); };
EM.ACTIONS['att-person'] = el => { Object.assign(EM.attF, { person: el.dataset.id, period: 'month', count: '' }); EM.rerender(); };
EM.ACTIONS['fb-csv'] = () => { const R = EM.attRows; if (!R) return;
  csvDownload('EGO attendance', ['Day', 'Person', 'Area', 'Start my day', 'Where (start)', 'Late (min)', 'End my day', 'Where (end)', 'Day length (min)', 'Visits done', 'Visits planned', 'Missed'],
    [...R.notStarted.map(r => [r.day, (R.P[r.staff_id] || {}).name, (R.P[r.staff_id] || {}).region, 'Not started', '', '', '', '', '', 0, R.vis(r.staff_id, r.day).length, 0]),
      ...R.rows.map(r => { const v = R.vis(r.staff_id, r.day); return [r.day, (R.P[r.staff_id] || {}).name, (R.P[r.staff_id] || {}).region, fbHm(r.start_at), fbPlace(r.start_lat, r.start_lng, r.start_acc, r.start_noloc) || 'location not shared', r.late_min, fbHm(r.end_at), r.end_at ? fbPlace(r.end_lat, r.end_lng, r.end_acc, r.end_noloc) || 'location not shared' : '', r.end_at ? Math.round((Date.parse(r.end_at) - Date.parse(r.start_at)) / 6e4) : '', v.filter(x => x.status === 'done' || x.status === 'in').length, v.length, v.filter(x => x.status === 'missed').length]; })]); };
/* R2b: who a Requirement from field sales goes to, per company: a person picked here, or telesales in turn */
const reqOwnerSel = dv => { const cur = (D.lists.field_req_owner || {})[dv] || '', ppl = D.staff.filter(s => s.active && (s.division === dv || s.division === 'both') && s.role !== 'ws_field').sort((a, b) => a.name.localeCompare(b.name));
  return `<div class="field"><label for="att-ro-${dv}">A Requirement from field sales in ${dv === 'retail' ? 'Big E' : 'EGO Premium'} goes to</label><select class="input" id="att-ro-${dv}"><option value="">Telesales in turn (the one who had one longest ago)</option>${ppl.map(s => `<option value="${s.id}" ${cur === s.id ? 'selected' : ''}>${esc(s.name)} · ${esc(roleName(s.role))}</option>`).join('')}</select></div>`; };
EM.ACTIONS['att-start'] = () => EM.modal(`<h2>Field app settings</h2><p class="muted small">Starting the day after the start time shows a late mark on the phone and on this board. Today it is ${esc(D.lists.field_start || '10:00')}.</p>
  <form class="stack" onsubmit="return false" style="margin-top:12px"><div class="field"><label for="att-st">Start time</label><input class="input" id="att-st" type="time" value="${esc(D.lists.field_start || '10:00')}" required></div>
  ${reqOwnerSel('wholesale')}${reqOwnerSel('retail')}<p class="small muted">A dealer with its own Telesales owner always goes to that person. With nobody in telesales, it goes to the Owner.</p>${errBox('att-st-err')}
  <div class="row"><button class="btn primary" data-act="att-start-go">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
EM.ACTIONS['att-start-go'] = async el => { busy(el, true); try { const r = await API('POST', '/api/field/settings', { start: qs('#att-st').value, req_owner: { wholesale: qs('#att-ro-wholesale').value, retail: qs('#att-ro-retail').value } }); D.lists.field_start = r.start; D.lists.field_req_owner = r.req_owner; EM.FB = null; EM.closeModal(); EM.toast(`<b>Saved.</b> Start time ${esc(r.start)}; Requirements go where you chose.`); EM.rerender(); } catch (x) { busy(el, false); showErr('att-st-err', x.message); } };
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.attf; if (k) { EM.attF[k] = e.target.value; EM.rerender(); } });
const fbType = (id, set) => document.addEventListener('input', e => { if (e.target.id !== id) return; set(e.target.value); const pos = e.target.selectionStart; EM.rerender(); const el = qs('#' + id); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (x) {} } });
fbType('att-q', v => { EM.attF.q = v; }); fbType('att-fq', v => { EM.attF.fq = v; });

/* ---- the Roadmap planner: one person's day, in order; the field team's progress beside it */
EM.rmF = { person: '', day: '', q: '', team: '', add: '', prospect: false, wd: [] };
const RM_KIND = { distributor: 'building-warehouse', dealer: 'building-store', sub_dealer: 'building-community', retailer: 'shopping-bag', architect: 'ruler-measure', project: 'building-skyscraper', prospect: 'user-plus' };
const RM_ST = { planned: ['Planned', ''], in: ['Checked in', 'info'], done: ['Done', 'ok'], missed: ['Missed', 'bad'] };
const rmSteps = vs => `<div class="fd-steps">${vs.map(v => `<i class="${v.status === 'done' || v.status === 'in' ? 'done' : v.status === 'missed' ? 'missed' : ''}"></i>`).join('')}</div>`;
const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], WDN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const wdOf = d => ((new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7) + 1;
EM.VIEWS.roadmap = () => {
  const f = EM.rmF; if (!f.day) f.day = today();
  const B = fbLoad(f.day, f.day), people = B ? B.people : [];
  if (B && !f.person && people.length) f.person = people[0].id;
  const P = byIdL(people), p = P[f.person], can = B && B.can_plan && !isBothView() && f.day >= (B.today || today());
  const head = `<div class="fb-head"><div><h1>Roadmap</h1><div class="fb-sub">Plan each person's day. Managers, Owners and telesales can all add visits; the person sees them at once on the phone.</div></div>
    <div class="fb-tools"><select class="input" data-rmf="person" aria-label="Person">${people.map(x => `<option value="${x.id}" ${x.id === f.person ? 'selected' : ''}>${esc(x.name)}</option>`).join('') || '<option value="">No field team yet</option>'}</select>
      <input class="input" type="date" data-rmf="day" value="${esc(f.day)}" aria-label="Date">${can && p ? `<button class="btn sm primary" data-act="rm-focus">${fic('plus')}Add visit</button>` : ''}</div></div>`;
  if (!B) return `<div class="fb stack">${head}<p class="muted">Reading the field team…</p></div>`;
  if (B.error) return `<div class="fb stack">${head}<div class="callout warn">${esc(B.error)}</div></div>`;
  if (!p) return `<div class="fb stack">${head}${empty('No field team yet', 'People whose role is Field Sales show here once they are added in Team & access.')}</div>`;
  const vs = B.visits.filter(v => v.staff_id === p.id), done = vs.filter(v => v.status === 'done' || v.status === 'in').length, missed = vs.filter(v => v.status === 'missed').length;
  const row = (v, i) => { const st = RM_ST[v.status] || RM_ST.planned, mov = can && v.status === 'planned';
    return `<li class="fb-visit is-${v.status === 'planned' ? 'pending' : v.status}" data-rm-visit="${v.id}" ${mov ? 'draggable="true"' : ''}>${fic('grip-vertical', 'fb-grip')}<span class="fb-no">${i + 1}</span>
      <span><b>${esc(v.name)}</b><span class="fb-k"> · ${esc(VISIT_KINDS[v.kind] || v.kind)}${v.area ? ' · ' + esc(v.area) : ''}${v.beat_id ? ' · weekly beat' : ''}</span>${v.outcome ? `<div class="small">${esc(v.outcome)}${v.extra && v.extra.boxes != null ? `, ${num(v.extra.boxes)} boxes` : ''}${v.note ? ' · ' + esc(v.note) : ''}</div>` : ''}${v.checkin_at ? `<div class="small muted">Checked in ${esc(fbHm(v.checkin_at))} · ${fbWhere(v.checkin_lat, v.checkin_lng, v.checkin_acc, v.checkin_noloc)}${v.checkin_photo ? ` · <a href="#/roadmap" data-act="fb-photo" data-id="${v.checkin_photo}">Photo</a>` : ''}</div>` : ''}</span>
      <span class="badge ${st[1]}">${st[0]}</span><span class="row" style="gap:0;flex-wrap:nowrap">${mov ? `<button class="fb-x" data-act="rm-move" data-id="${v.id}" data-dir="-1" aria-label="Move up" ${i ? '' : 'disabled'}>${fic('chevron-down', '')}</button><button class="fb-x" data-act="rm-move" data-id="${v.id}" data-dir="1" aria-label="Move down">${fic('chevron-down', '')}</button><button class="fb-x" data-act="rm-del" data-id="${v.id}" aria-label="Remove visit">${fic('x', '')}</button>` : ''}</span></li>`; };
  const q = f.add.trim().toLowerCase();
  const hits = q.length < 2 ? [] : [...D.clients.filter(c => inDiv(c) && `${c.name} ${c.city || ''} ${c.mobile || ''}`.toLowerCase().includes(q)).slice(0, 8).map(c => ({ id: c.id, t: 'client', name: c.name, k: visitKindOf(c.kind), area: c.city || '' })),
    ...PJS().filter(x => inDiv(x) && `${x.name} ${x.city || ''} ${x.ref || ''}`.toLowerCase().includes(q)).slice(0, 4).map(x => ({ id: x.id, t: 'project', name: x.name, k: 'project', area: x.city || '' }))];
  const wdSel = f.wd.length ? f.wd : [wdOf(f.day)], beats = B.beats.filter(b => b.staff_id === p.id);
  const plan = `<div class="card stack-s" data-rm-plan><div class="row between"><h3>${esc(p.name)} · ${esc(ds(f.day))}</h3><span class="badge">${done} of ${vs.length} done${missed ? ` · ${missed} missed` : ''}</span></div>
    ${vs.length ? rmSteps(vs) : ''}${vs.length ? `<ol class="fb-visits" data-rm-list>${vs.map(row).join('')}</ol>` : '<p class="muted small">No visits on this day yet.</p>'}
    ${can ? `<div class="cb stack-s" data-rm-add><input class="input" id="rm-add" value="${esc(f.add)}" placeholder="Add a visit: search dealer, distributor, sub-dealer, architect or project site" autocomplete="off">
      ${hits.length ? `<div class="stack-s" data-rm-hits>${hits.map(h => `<button class="btn sm ghost" style="justify-content:flex-start" data-act="rm-add" data-t="${h.t}" data-id="${h.id}">${fic(RM_KIND[h.k])}<b>${esc(h.name)}</b> <span class="muted">· ${esc(VISIT_KINDS[h.k])}${h.area ? ' · ' + esc(h.area) : ''}</span></button>`).join('')}</div>` : q.length >= 2 ? '<p class="small muted">Nothing in your view by that name.</p>' : ''}
      <div class="row"><button class="btn sm ghost" data-act="rm-prospect">${fic('user-plus')}New prospect</button></div>
      ${f.prospect ? `<form class="row" style="gap:8px;align-items:flex-end;flex-wrap:wrap" onsubmit="return false" data-rm-prospect><label class="field" style="min-width:160px"><span class="small muted">Name *</span><input class="input" id="rm-pn"></label><label class="field" style="min-width:140px"><span class="small muted">Area *</span><input class="input" id="rm-pa"></label><label class="field" style="min-width:140px"><span class="small muted">Mobile</span><input class="input" id="rm-pm" inputmode="tel"></label><button class="btn sm primary" data-act="rm-add" data-t="prospect">Add</button></form>${errBox('rm-p-err')}` : ''}</div>
      ${vs.length ? `<label class="fb-repeat"><input type="checkbox" id="rm-rep" ${f.rep ? 'checked' : ''}><span><b>Repeat weekly beat</b><span class="small muted" style="display:block">This list comes back every ${wdSel.map(n => WDN[n - 1]).join(', ')} for the next 8 weeks</span></span><span class="fb-days">${WD.map((l, i) => `<span role="checkbox" tabindex="0" aria-checked="${wdSel.includes(i + 1)}" aria-label="${WDN[i]}" data-act="rm-wd" data-n="${i + 1}" class="${wdSel.includes(i + 1) ? 'on' : ''}" style="cursor:pointer">${l}</span>`).join('')}</span></label>
        ${f.rep ? `<div class="row"><button class="btn sm primary" data-act="rm-beat">Repeat this list</button></div>` : ''}` : ''}` : B.can_plan ? '<p class="small muted">This day is over: its Roadmap is kept as a record.</p>' : '<p class="small muted">Only a manager, an Owner or telesales plans a Roadmap.</p>'}
    ${beats.length ? `<div class="stack-s"><b class="small">Weekly beats of ${esc(p.name)}</b>${beats.map(b => `<div class="row between small" data-rm-beat="${b.id}"><span>${b.weekdays.map(n => WDN[n - 1]).join(', ')}: ${b.items.map(x => esc(x.name)).join(', ')}</span>${can ? `<button class="btn sm ghost" data-act="rm-beat-stop" data-id="${b.id}">Stop repeating</button>` : ''}</div>`).join('')}</div>` : ''}</div>`;
  const tq = f.q.trim().toLowerCase(), team = people.filter(x => (!tq || `${x.name} ${x.region || ''}`.toLowerCase().includes(tq)) && (!f.team || (f.team === 'missed' ? B.visits.some(v => v.staff_id === x.id && v.status === 'missed') : f.team === 'none' ? !B.visits.some(v => v.staff_id === x.id) : B.visits.some(v => v.staff_id === x.id))));
  const side = `<div class="card stack-s"><div class="row between"><h3>Field team, ${esc(ds(f.day))}</h3><span class="small muted">Click a person to plan</span></div>
    <div class="row" style="gap:8px;flex-wrap:wrap"><input class="input" id="rm-q" value="${esc(f.q)}" placeholder="Roadmap: person or area" style="flex:1;min-width:140px"><select class="input" data-rmf="team" aria-label="Show" style="width:auto">${[['', 'Everyone'], ['planned', 'With visits'], ['missed', 'With a missed visit'], ['none', 'No visits yet']].map(([v, l]) => `<option value="${v}" ${f.team === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="fb-team">${team.map(x => { const xv = B.visits.filter(v => v.staff_id === x.id); return `<div class="fb-person${x.id === p.id ? ' on' : ''}" role="button" tabindex="0" data-act="rm-pick" data-id="${x.id}"><span><b>${esc(x.name)}</b></span>${rmSteps(xv)}<span class="fb-r">${xv.filter(v => v.status === 'done' || v.status === 'in').length}/${xv.length}</span></div>`; }).join('') || '<p class="small muted">Nobody for this filter.</p>'}</div>
    <p class="small muted">A visit not checked in by the end of its day turns Missed and rings the manager's bell.</p></div>`;
  return `<div class="fb stack">${head}<div class="fb-plan">${plan}${side}</div></div>`;
};
EM.VIEWS.roadmap.title = () => 'Roadmap';
const rmRead = () => { EM.FB = null; EM.rerender(); };
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.rmf; if (k) { EM.rmF[k] = e.target.value; if (k === 'day') { EM.rmF.wd = []; EM.rmF.rep = false; } if (k === 'person') EM.rmF.add = ''; EM.rerender(); } if (e.target.id === 'rm-rep') { EM.rmF.rep = e.target.checked; EM.rerender(); } });
fbType('rm-add', v => { EM.rmF.add = v; }); fbType('rm-q', v => { EM.rmF.q = v; });
EM.ACTIONS['rm-pick'] = el => { Object.assign(EM.rmF, { person: el.dataset.id, add: '', prospect: false, wd: [], rep: false }); EM.rerender(); };
EM.ACTIONS['rm-focus'] = () => { const i = qs('#rm-add'); if (i) i.focus(); };
EM.ACTIONS['rm-prospect'] = () => { EM.rmF.prospect = !EM.rmF.prospect; EM.rerender(); };
EM.ACTIONS['rm-add'] = async el => { const f = EM.rmF, b = { staff_id: f.person, day: f.day };
  if (el.dataset.t === 'client') b.client_id = el.dataset.id; else if (el.dataset.t === 'project') b.project_id = el.dataset.id; else Object.assign(b, { name: qs('#rm-pn').value, area: qs('#rm-pa').value, mobile: qs('#rm-pm').value });
  busy(el, true);
  try { const r = await API('POST', '/api/field/visits', b); Object.assign(f, { add: '', prospect: false }); EM.toast(`<b>${esc(r.visit.name)}</b> added to the Roadmap.`); rmRead(); }
  catch (x) { busy(el, false); if (el.dataset.t === 'prospect') showErr('rm-p-err', x.errors || x.message); else bubbleNear(el, x.message); } };
async function rmOrder(ids) {
  try { await API('POST', '/api/field/order', { staff_id: EM.rmF.person, day: EM.rmF.day, ids }); EM.toast('Order saved.'); } catch (x) { EM.toast(esc(x.message)); }
  rmRead();
}
const rmIds = () => [...document.querySelectorAll('[data-rm-list] [data-rm-visit]')].map(x => x.dataset.rmVisit);
EM.ACTIONS['rm-move'] = el => { const ids = rmIds(), i = ids.indexOf(el.dataset.id), j = i + Number(el.dataset.dir); if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; rmOrder(ids); };
EM.ACTIONS['rm-del'] = async el => { const v = (EM.FB.data.visits || []).find(x => x.id === el.dataset.id);
  if (!confirm(`Remove the visit to ${v.name}? It stays in the Recycle bin for 30 days.`)) return;
  try { await API('DELETE', '/api/field/visits/' + v.id); EM.toast('Visit removed, in the Recycle bin for 30 days.'); rmRead(); } catch (x) { bubbleNear(el, x.message); } };
EM.ACTIONS['rm-wd'] = el => { const f = EM.rmF, n = Number(el.dataset.n), cur = f.wd.length ? f.wd : [wdOf(f.day)]; f.wd = cur.includes(n) ? cur.filter(x => x !== n) : [...cur, n].sort(); if (!f.wd.length) f.wd = [n]; EM.rerender(); };
EM.ACTIONS['rm-beat'] = async el => { const f = EM.rmF; busy(el, true);
  try { const r = await API('POST', '/api/field/beats', { staff_id: f.person, day: f.day, weekdays: f.wd.length ? f.wd : [wdOf(f.day)] }); Object.assign(f, { rep: false, wd: [] }); EM.toast(`<b>Weekly beat saved.</b> ${r.days.length} day${r.days.length === 1 ? '' : 's'} ahead now carry this list.`); rmRead(); }
  catch (x) { busy(el, false); bubbleNear(el, x.message); } };
EM.ACTIONS['rm-beat-stop'] = async el => { if (!confirm('Stop this weekly beat? The days ahead that nobody has checked in go to the Recycle bin for 30 days.')) return;
  try { const r = await API('DELETE', '/api/field/beats/' + el.dataset.id); EM.toast(`Stopped. ${r.removed} visit${r.removed === 1 ? '' : 's'} ahead removed.`); rmRead(); } catch (x) { bubbleNear(el, x.message); } };
/* keyboard: Enter or Space on a weekday or a person; drag a visit to reorder (the buttons do the same without a mouse) */
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-act="rm-wd"], [data-act="rm-pick"], .fb-face[data-act]')) { e.preventDefault(); e.target.click(); } });
let rmDrag = null;
document.addEventListener('dragstart', e => { const li = e.target.closest && e.target.closest('[data-rm-visit][draggable]'); if (li) { rmDrag = li.dataset.rmVisit; e.dataTransfer.effectAllowed = 'move'; } });
document.addEventListener('dragover', e => { if (rmDrag && e.target.closest && e.target.closest('[data-rm-list]')) e.preventDefault(); });
document.addEventListener('drop', e => { const li = rmDrag && e.target.closest && e.target.closest('[data-rm-visit]'); if (!li) return; e.preventDefault(); const ids = rmIds().filter(x => x !== rmDrag); ids.splice(ids.indexOf(li.dataset.rmVisit), 0, rmDrag); rmDrag = null; rmOrder(ids); });


/* ================================================================ R3b (17 Oct): Design 500, both companies
   The members are the Architects records marked Design 500 (Yes) with the date they joined. Every column is counted from
   saved records: owner, last interaction (activities, follow-ups done), next action (the open follow-up), connected dealers
   (typed on the architect, the dealers on their opportunities, the Project Partner of their projects), active projects
   (projects they are on, not Completed or Lost), samples given (a count of samples: 0 until the Samples register, R6, exists),
   business brought (won value of the opportunities they are on, theirs or in their projects). */
const last10 = m => String(m || '').replace(/\D/g, '').slice(-10);
const d5Members = () => D.clients.filter(c => ARCH_KINDS.includes(c.kind) && inDiv(c) && (c.extra || {}).design500 === 'Yes');
const d5Ids = c => new Set([c.id, ...(c.kind === 'design_firm' ? D.clients.filter(x => x.firm_id === c.id).map(x => x.id) : [])]);
function d5Of(c) {
  const ids = d5Ids(c), mobs = new Set([c.mobile, ...D.contacts.filter(k => ids.has(k.client_id)).map(k => k.mobile)].map(last10).filter(m => m.length === 10));
  const ownOpps = D.opportunities.filter(o => ids.has(o.client_id) || ids.has((CL()[o.client_id] || {}).architect_id));
  const pjIds = new Set(ownOpps.map(o => o.project_id).filter(Boolean));
  const projects = PJS().filter(p => pjIds.has(p.id) || (p.contacts || []).some(k => mobs.has(last10(k.mobile))));
  const opps = [...new Map([...ownOpps, ...D.opportunities.filter(o => projects.some(p => p.id === o.project_id))].map(o => [o.id, o])).values()];
  const won = opps.filter(o => o.stage === wonStage(o.pipeline, D.lists));
  const dealerIds = new Set([...opps.map(o => o.dealer_id), ...projects.map(p => p.partner_id)].filter(Boolean));
  const dealers = [...[...dealerIds].map(id => (DDIR().find(d => d.id === id) || CL()[id] || {}).name).filter(Boolean), ...String((c.extra || {}).connected_dealers || '').split(/[,;\n]/).map(x => x.trim()).filter(Boolean)];
  const acts = ACTS().filter(a => ids.has(a.client_id)).map(a => a.at), done = FUS().filter(f => ids.has(f.client_id) && f.status !== 'open' && f.done_at).map(f => f.done_at);
  const next = FUS().filter(f => ids.has(f.client_id) && f.status === 'open').sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  return { projects, active: projects.filter(p => !['Completed', 'Lost'].includes(p.stage)), won, business: won.reduce((a, o) => a + (Number(o.value) || 0), 0), dealers: [...new Set(dealers)], last: [...acts, ...done].sort().pop() || '', next, samples: 0 };
}
EM.d5F = { period: 'all', from: '', to: '', owner: '', city: '', kind: '', field: '', fq: '' };
DF_STATE.d5 = () => EM.d5F;
const D5_FIELDS = [['name', 'Name'], ['city', 'City'], ['owner', 'Owner'], ['dealers', 'Connected dealers'], ['projects', 'Projects'], ['next', 'Next action'], ['mobile', 'Mobile']];
const d5Val = (c, k, x) => k === 'owner' ? staffName(c.owner_id) : k === 'dealers' ? x.dealers.join(' ') : k === 'projects' ? x.projects.map(p => p.name).join(' ') : k === 'next' ? (x.next ? x.next.action : '') : String(c[k] || '');
EM.VIEWS.design500 = () => {
  const f = EM.d5F, fq = f.fq.trim().toLowerCase(), all = d5Members(), P = D.access.prices, X = Object.fromEntries(all.map(c => [c.id, d5Of(c)]));
  const rows = all.filter(c => (!f.owner || c.owner_id === f.owner) && (!f.city || c.city === f.city) && (!f.kind || c.kind === f.kind) && inPeriod((c.extra || {}).design500_since || '', f.period, f.from, f.to)
    && (!fq || (f.field ? [d5Val(c, f.field, X[c.id])] : D5_FIELDS.map(([k]) => d5Val(c, k, X[c.id]))).some(v => v.toLowerCase().includes(fq))) && matches(`${c.name} ${c.city} ${c.ref || ''} ${X[c.id].dealers.join(' ')} ${X[c.id].projects.map(p => p.name).join(' ')}`, [c.mobile]))
    .sort((a, b) => X[b.id].business - X[a.id].business || a.name.localeCompare(b.name));
  const sel = (k, label, opts) => `<label class="field" style="min-width:150px"><span class="small muted">${label}</span><select class="input" data-d5f="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  const uniq = (vals, name) => [...new Set(vals.filter(Boolean))].map(v => [v, name(v)]).sort((a, b) => a[1].localeCompare(b[1]));
  return `<div class="stack" data-d5>
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">${EM.div === 'both' ? 'EGO Premium and Big E' : esc(DIVS[EM.div].co)} · the architects and interior designers who specify us</div><h1>Design 500</h1><p class="muted">${rows.length} of ${all.length} members · ${esc(scopeLabel())}</p></div>
      <div class="row" style="flex-wrap:wrap"><button class="btn" data-act="d5-sample">Sample Excel</button><label class="btn" style="cursor:pointer" data-list-only>Upload Excel<input type="file" data-sheet="design500" accept=".xlsx" hidden></label><button class="btn primary" data-act="d5-add">+ Add a member</button></div></div>
    ${EM.d5Imp ? d5ImportPreview() : ''}
    <div class="card row" style="gap:12px;flex-wrap:wrap;align-items:flex-end" data-d5-filters>${dateFilter(f, 'd5', 'Member since')}
      ${sel('owner', 'Owner', [['', 'Everyone'], ...uniq(all.map(c => c.owner_id), staffName)])}${sel('city', 'City', [['', 'Every city'], ...uniq(all.map(c => c.city), x => x)])}
      ${sel('kind', 'Firm or solo', [['', 'Both'], ['design_firm', 'Architect firms'], ['architect', 'Solo architects']])}${sel('field', 'Any field', [['', 'Any field'], ...D5_FIELDS])}
      <label class="field" style="min-width:150px"><span class="small muted">contains</span><input class="input" id="d5-fq" value="${esc(f.fq)}" placeholder="Type to filter"></label></div>
    ${searchBox('Design 500 members: name, city, mobile, dealer or project')}
    ${rows.length ? '<div class="d5-tbl" data-d5-table>' + table(['Member', 'Owner', 'Last interaction', 'Next action', 'Connected dealers', 'Active projects', 'Samples given', ...(P ? ['Business brought'] : [])], rows.slice(0, 500).map(c => { const x = X[c.id];
      return { href: `#/client/${c.id}`, cells: [`<b>${esc(c.name)}</b><div class="small muted">${esc(kindLabel(c.kind))} · ${esc(c.city || '')}${(c.extra || {}).design500_since ? ' · since ' + ds(c.extra.design500_since) : ''}</div>${EM.div === 'both' ? segBadge(c.division) : ''}`,
        esc(staffName(c.owner_id)), x.last ? ds(dayIST(x.last)) : '<span class="muted">None yet</span>', x.next ? `${esc(x.next.action)} <div class="small muted">${ds(x.next.due_date)}</div>` : '<span class="muted">None booked</span>',
        esc(x.dealers.join(', ')), x.active.length ? `${num(x.active.length)}<div class="small muted">${esc(x.active.map(p => p.name).slice(0, 3).join(', '))}</div>` : '0', '0', ...(P ? [money(x.business)] : [])] }; })) + '</div>'
      : empty(all.length ? 'Nothing for this filter' : 'No Design 500 member yet', all.length ? 'Change or clear the filters above.' : 'Mark an architect or a firm as a Design 500 member (here, on their page, or with the Excel file); their projects and the business they bring are counted from what is saved.', all.length ? '' : '<button class="btn primary" data-act="d5-add">+ Add a member</button>')}</div>`;
};
EM.VIEWS.design500.title = () => 'Design 500';
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.d5f; if (k) { EM.d5F[k] = e.target.value; EM.rerender(); } });
document.addEventListener('input', e => { if (e.target.id === 'd5-fq') { EM.d5F.fq = e.target.value; const pos = e.target.selectionStart; EM.rerender(); const el = qs('#d5-fq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } } });
const d5Co = c => c.division === 'retail' ? 'Big E' : 'EGO Premium';
EM.ACTIONS['d5-add'] = () => {
  const cands = D.clients.filter(c => ARCH_KINDS.includes(c.kind) && inDiv(c) && (c.extra || {}).design500 !== 'Yes').sort((a, b) => a.name.localeCompare(b.name));
  if (!cands.length) return EM.modal('<h2>Add a Design 500 member</h2><p class="muted">Every architect and firm in view is already a member, or none is added yet. Add the architect in Architects first.</p><div class="row" style="margin-top:12px"><a class="btn primary" href="#/architects">Architects</a><button class="btn" data-act="close-modal">Close</button></div>');
  EM.modal(`<h2>Add a Design 500 member</h2><p class="muted small">An architect or firm already on the Architects list.</p><div class="fgrid" style="margin-top:12px">
    ${G.select({ key: 'who', label: 'Architect or firm', req: true }, '', 'd5', cands.map(c => [c.id, `${c.name} · ${kindLabel(c.kind)} · ${c.city || ''}`]))}
    <div class="field"><label for="d5-since">Member since</label><input class="input" type="date" id="d5-since" value="${today()}"></div></div>${errBox('d5-err')}
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="d5-add-go">Add member</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['d5-add-go'] = async el => {
  const c = CL()[qs('#d5-who').value]; if (!c) return showErr('d5-err', 'Choose the architect or firm.');
  busy(el, true);
  try { const r = await API('POST', '/api/design500/import', { rows: [{ row: 1, company: d5Co(c), name: c.name, mobile: c.mobile, member: 'Yes', since: qs('#d5-since').value }], save: true });
    if (r.rows[0].status === 'error') throw new Error(r.rows[0].error);
    await reload4(); EM.closeModal(); EM.toast(`<b>${esc(c.name)}</b> is a Design 500 member.`); EM.rerender(); }
  catch (x) { busy(el, false); showErr('d5-err', x.message); }
};
/* the Design 500 Excel: built at download from today's architects of each company, with real dropdowns */
const D5_SHEET = [['Company', 'company', true, 'EGO Premium or Big E.'], ['Architect or firm name', 'name', true, 'As on the Architects list (the dropdown holds them).'], ['Mobile', 'mobile', false, 'Optional: finds the right one when two share a name.'],
  ['Design 500 member', 'member', true, 'Yes or No.'], ['Member since', 'since', false, 'A date, e.g. 2026-10-17. Left empty for Yes: today.']];
EM.ACTIONS['d5-sample'] = async el => {
  busy(el, true);
  try {
    await loadJs(EXCELJS_URL, () => window.ExcelJS);
    const wb = new window.ExcelJS.Workbook(), fill = wb.addWorksheet('Fill this'), how = wb.addWorksheet('How to fill'), lists = wb.addWorksheet('Lists');
    const arch = D.clients.filter(c => ARCH_KINDS.includes(c.kind) && inDiv(c)).sort((a, b) => a.name.localeCompare(b.name));
    const L = { company: ['wholesale', 'retail'].filter(canDiv).map(d => DIVS[d].co), name: [...new Set(arch.map(c => c.name))], member: ['Yes', 'No'] };
    Object.entries(L).forEach(([k, vals], i) => { lists.getCell(1, i + 1).value = k; vals.forEach((v, r) => { lists.getCell(r + 2, i + 1).value = v; }); });
    lists.state = 'hidden';
    fill.columns = D5_SHEET.map(([h, , req]) => ({ header: h + (req ? ' *' : ''), width: Math.max(18, h.length + 6) }));
    fill.getRow(1).font = { bold: true }; fill.views = [{ state: 'frozen', ySplit: 1 }];
    arch.filter(c => (c.extra || {}).design500 === 'Yes').forEach((c, i) => { fill.getRow(i + 2).values = [d5Co(c), c.name, c.mobile || '', 'Yes', (c.extra || {}).design500_since || '']; });
    D5_SHEET.forEach(([, k, req], i) => { const letter = fill.getColumn(i + 1).letter, li = Object.keys(L).indexOf(k);
      for (let r = 2; r <= 501; r++) { const cell = fill.getCell(letter + r);
        if (li >= 0 && L[k].length) { const col = lists.getColumn(li + 1).letter; cell.dataValidation = { type: 'list', allowBlank: !req, formulae: [`Lists!$${col}$2:$${col}$${L[k].length + 1}`], showErrorMessage: true, errorTitle: 'Pick from the list', error: 'Choose a value from the dropdown.' }; }
        else if (k === 'since') cell.dataValidation = { type: 'date', operator: 'greaterThan', allowBlank: true, formulae: [new Date(2000, 0, 1)], showErrorMessage: true, error: 'A date.' }; } });
    how.getCell('A1').value = 'EGO Master: Design 500 members'; how.getCell('A1').font = { bold: true, size: 14 };
    how.getCell('A2').value = 'One architect or firm per row, already on the Architects list. Today\'s members are filled in; change Yes to No to end a membership.';
    how.getCell('A3').value = `Made on ${today()} by ${me().name}. Upload it on the Design 500 screen: every row is checked and shown before anything is saved.`;
    D5_SHEET.forEach(([h, , req, note], i) => { how.getCell('A' + (5 + i)).value = h; how.getCell('B' + (5 + i)).value = req ? 'Compulsory' : 'Optional'; how.getCell('C' + (5 + i)).value = note; });
    how.getColumn(1).width = 26; how.getColumn(3).width = 80;
    const buf = await wb.xlsx.writeBuffer(), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.download = `EGO Master Design 500 ${today()}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    EM.toast('The Design 500 file is downloading, with today\'s architects in its dropdowns.');
  } catch (x) { bubbleNear(el, x.message); }
  busy(el, false);
};
EM.d5Imp = null;
document.addEventListener('change', async e => {
  if (!e.target.matches('input[data-sheet="design500"]')) return;
  const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
  try {
    await loadJs(EXCELJS_URL, () => window.ExcelJS);
    const wb = new window.ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.getWorksheet('Fill this') || wb.worksheets[0], heads = [], rows = [];
    const txt = v => v == null ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === 'object' ? (v.text || v.result || (v.richText ? v.richText.map(x => x.text).join('') : '')) : String(v);
    ws.getRow(1).eachCell((c, i) => { heads[i] = txt(c.value).replace(/\s*\*$/, '').trim(); });
    ws.eachRow((r, n) => { if (n === 1) return; const x = { row: n }; let any = false;
      D5_SHEET.forEach(([h, k]) => { const i = heads.indexOf(h); const v = i > 0 ? txt(r.getCell(i).value).trim() : ''; if (v) any = true; x[k] = v; });
      if (any) rows.push(x); });
    if (!rows.length) throw new Error('No filled rows in the "Fill this" tab.');
    const res = await API('POST', '/api/design500/import', { rows, save: false });
    EM.d5Imp = { file: file.name, rows, res: res.rows }; EM.rerender();
  } catch (x) { EM.d5Imp = { file: file.name, error: x.message, rows: [], res: [] }; EM.rerender(); }
});
function d5ImportPreview() {
  const I = EM.d5Imp, cnt = st => I.res.filter(r => r.status === st).length;
  return `<section class="card stack-s" data-d5-import><div class="row between"><h3>Read: ${esc(I.file)}</h3><button class="btn sm ghost" data-act="d5-imp-close">Close</button></div>
    ${I.error ? `<div class="callout warn">${esc(I.error)}</div>` : `<p class="small">${num(cnt('update'))} to update · <b>${num(cnt('error'))} with a mistake</b>. ${I.saved ? 'Saved.' : 'Nothing is saved until you press Save.'}</p>
    ${table(['Row', 'Status', 'Architect or firm', 'Mistake'], I.res.map(r => [String(r.row), `<span class="badge ${r.status === 'error' ? 'bad' : 'info'}">${r.status === 'error' ? 'Mistake' : 'Update'}</span>`, esc(r.label), esc(r.error || '')]))}
    ${!I.saved && cnt('update') ? `<div class="row"><button class="btn primary" data-act="d5-imp-save">Save the ${num(cnt('update'))} good rows${cnt('error') ? ' (rows with a mistake are skipped)' : ''}</button></div>` : ''}`}</section>`;
}
EM.ACTIONS['d5-imp-close'] = () => { EM.d5Imp = null; EM.rerender(); };
EM.ACTIONS['d5-imp-save'] = async el => {
  busy(el, true);
  try { const r = await API('POST', '/api/design500/import', { rows: EM.d5Imp.rows, save: true }); EM.d5Imp = { ...EM.d5Imp, res: r.rows, saved: true }; await reload4(); EM.toast(`<b>${r.rows.filter(x => x.status !== 'error').length} Design 500 rows saved</b>`); EM.rerender(); }
  catch (x) { busy(el, false); bubbleNear(el, x.message); }
};

/* R3b: the Date filters of Big E fulfilment and Installation (DF_STATE is declared further down than those screens) */
DF_STATE.rf = () => EM.rfF;
DF_STATE.inst = () => EM.inF;

/* ================================================================ R4 (17 Oct): design lines from Excel, on the opportunity form
   The sample is built at download from today's designs (dropdown), each design's unit and box size; the upload is read row by
   row through THE quantity rule (qtyLine). Boxes are always worked out; a boxes figure typed in the file that disagrees is
   flagged on its row, and the worked-out figure is what goes in. */
const OL_SHEET = [['Design', 'design', true], ['Sq ft needed', 'sqft_need'], ['Wastage %', 'wastage_pct'], ['Unit', 'unit'], ['Pieces or rft', 'qty'], ['Boxes (worked out, leave blank)', 'boxes'], ['Rate', 'rate']];
const olDesigns = () => INVD().products.filter(p => p.status !== 'Discontinued').map(p => ({ p, label: `${p.name}${p.code ? ' · ' + p.code : ''}`, unit: lineUnit(p.id), box: lineBox(p.id) }));
EM.ACTIONS['ol-sample'] = async el => {
  busy(el, true);
  try {
    await loadJs(EXCELJS_URL, () => window.ExcelJS);
    const wb = new window.ExcelJS.Workbook(), fill = wb.addWorksheet('Fill this'), how = wb.addWorksheet('How to fill'), lists = wb.addWorksheet('Lists'), ds0 = olDesigns();
    lists.getCell('A1').value = 'Design'; lists.getCell('B1').value = 'Unit'; lists.getCell('C1').value = 'Sq ft per box'; lists.getCell('E1').value = 'Sold by';
    ds0.forEach((d, i) => { lists.getCell(i + 2, 1).value = d.label; lists.getCell(i + 2, 2).value = QTY_UNITS[d.unit]; lists.getCell(i + 2, 3).value = d.box || ''; });
    Object.values(QTY_UNITS).forEach((u, i) => { lists.getCell(i + 2, 5).value = u; });
    lists.state = 'hidden';
    fill.columns = OL_SHEET.map(([h, , req]) => ({ header: h + (req ? ' *' : ''), width: Math.max(16, h.length + 4) }));
    fill.getRow(1).font = { bold: true }; fill.views = [{ state: 'frozen', ySplit: 1 }];
    for (let r = 2; r <= 201; r++) {
      fill.getCell('A' + r).dataValidation = { type: 'list', allowBlank: true, formulae: [`Lists!$A$2:$A$${Math.max(2, ds0.length + 1)}`], showErrorMessage: true, errorTitle: 'Pick from the list', error: 'Choose a design from the dropdown.' };
      fill.getCell('D' + r).dataValidation = { type: 'list', allowBlank: true, formulae: ['Lists!$E$2:$E$4'], showErrorMessage: true, error: 'sq ft, piece or rft.' };
      for (const c of ['B', 'C', 'E', 'F', 'G']) fill.getCell(c + r).dataValidation = { type: 'decimal', operator: 'greaterThanOrEqual', allowBlank: true, formulae: [0], showErrorMessage: true, error: 'A number, 0 or more.' };
    }
    const ex = ds0.find(d => d.unit === 'sqft' && d.box);
    if (ex) fill.addRow([ex.label, 1000, wastageDefault(D.lists.rules), 'sq ft', '', '', listRate(ex.p.id) || '']);
    how.getCell('A1').value = 'EGO Master: design lines for one opportunity'; how.getCell('A1').font = { bold: true, size: 14 };
    how.getCell('A2').value = `One design per row. Flooring and cladding: type the sq ft needed and the wastage % (${wastageDefault(D.lists.rules)}% if left blank); the boxes are worked out, rounded up to whole boxes, and the amount is the sq ft supplied x the rate per sq ft.`;
    how.getCell('A3').value = 'Accessories (skirting, profiles, underlay foam, film, installation): type the pieces or rft in "Pieces or rft" and the rate per piece or rft. Unit comes from the design\'s category; a different unit typed here is flagged.';
    how.getCell('A4').value = `Leave "Boxes" blank. A boxes figure typed in the file is checked against the rule and flagged on its row when it disagrees. Made on ${today()} by ${me().name}.`;
    how.getColumn(1).width = 140;
    const buf = await wb.xlsx.writeBuffer(), a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); a.download = `EGO Master design lines ${today()}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    EM.toast('The design lines file is downloading, with today\'s designs in its dropdown.');
  } catch (x) { bubbleNear(el, x.message); }
  busy(el, false);
};
/* one row of the file, read through the rule: what goes in, and what is flagged */
const olRow = (x, n) => {
  const low = s => String(s || '').trim().toLowerCase(), d = olDesigns().find(y => low(y.label) === low(x.design) || low(y.p.name) === low(x.design) || (y.p.code && low(y.p.code) === low(x.design)));
  const numOf = v => v === '' || v == null ? '' : Number(String(v).replace(/[,\s]/g, ''));
  if (!d) return { row: n, status: 'error', note: x.design ? `"${x.design}" is not a design in the inventory` : 'Design is compulsory' };
  const flags = [], typedUnit = low(x.unit), unitKey = Object.keys(QTY_UNITS).find(k => low(QTY_UNITS[k]) === typedUnit || k === typedUnit);
  if (typedUnit && unitKey !== d.unit) flags.push(`Unit typed "${x.unit}", but ${colOf(d.p).category} is sold ${QTY_UNIT_LONG[d.unit]}`);
  const line = { product_id: d.p.id, rate: numOf(x.rate) || 0, ...(d.unit === 'sqft' ? { sqft_need: numOf(x.sqft_need), wastage_pct: numOf(x.wastage_pct) === '' ? wastageDefault(D.lists.rules) : numOf(x.wastage_pct) } : { qty: numOf(x.qty) }) };
  const q = lineCalc(line);
  if (q.error) return { row: n, status: 'error', note: `${d.label}: ${q.error}` };
  const typedBoxes = numOf(x.boxes);
  if (typedBoxes !== '' && typedBoxes !== q.boxes) flags.push(`Boxes typed ${num(typedBoxes)}, the rule gives ${num(q.boxes)}${q.unit === 'sqft' ? ` (${num(q.supply)} sq ft / ${num(q.per_box)} sq ft per box, rounded up)` : ' (accessories carry no boxes)'}`);
  return { row: n, status: flags.length ? 'flag' : 'ok', line, label: d.label, q, note: flags.join('. ') };
};
EM.olImp = null;
document.addEventListener('change', async e => {
  if (!e.target.matches('input[data-sheet="olines"]')) return;
  const file = e.target.files && e.target.files[0]; e.target.value = ''; if (!file) return;
  const box = qs('#ol-imp');
  try {
    await loadJs(EXCELJS_URL, () => window.ExcelJS);
    const wb = new window.ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.getWorksheet('Fill this') || wb.worksheets[0], heads = [], rows = [];
    const txt = v => v == null ? '' : typeof v === 'object' ? (v.text || v.result || (v.richText ? v.richText.map(x => x.text).join('') : '')) : String(v);
    ws.getRow(1).eachCell((c, i) => { heads[i] = txt(c.value).replace(/\s*\*$/, '').trim(); });
    ws.eachRow((r, n) => { if (n === 1) return; const x = {}; let any = false;
      OL_SHEET.forEach(([h, k]) => { const i = heads.indexOf(h); const v = i > 0 ? txt(r.getCell(i).value).trim() : ''; if (v) any = true; x[k] = v; });
      if (any) rows.push(olRow(x, n)); });
    if (!rows.length) throw new Error('No filled rows in the "Fill this" tab.');
    EM.olImp = { file: file.name, rows };
  } catch (x) { EM.olImp = { file: file.name, rows: [], error: x.message }; }
  if (box) box.innerHTML = olImpHtml();
});
const olImpHtml = () => { const I = EM.olImp; if (!I) return ''; const c = s => I.rows.filter(r => r.status === s).length;
  return `<div class="callout stack-s" data-ol-import><b>Read: ${esc(I.file)}</b>${I.error ? `<span>${esc(I.error)}</span>` : `<span class="small">${num(c('ok'))} fine · <b>${num(c('flag'))} flagged</b> · ${num(c('error'))} with a mistake (left out)</span>
    ${table(['Row', 'Status', 'Design', 'Works out to', 'Flag or mistake'], I.rows.map(r => [String(r.row), `<span class="badge ${r.status === 'error' ? 'bad' : r.status === 'flag' ? 'warn' : 'ok'}">${r.status === 'error' ? 'Mistake' : r.status === 'flag' ? 'Flagged' : 'Fine'}</span>`, esc(r.label || ''), r.q ? calcTxt(r.q) : '', esc(r.note || '')]))}
    ${I.rows.some(r => r.line) ? '<div class="row"><button class="btn sm primary" data-act="ol-imp-use">Put these lines in</button><button class="btn sm ghost" data-act="ol-imp-close">Close</button></div>' : ''}`}</div>`; };
EM.ACTIONS['ol-imp-use'] = () => { const box = qs('#olines'), ls = EM.olImp.rows.filter(r => r.line).map(r => r.line); box.innerHTML = ls.map((l, i) => ordLine(i, l)).join(''); EM.olImp = null; qs('#ol-imp').innerHTML = ''; qs('#of').dispatchEvent(new Event('input', { bubbles: true })); EM.toast(`<b>${ls.length} design line${ls.length === 1 ? '' : 's'}</b> put in from the file. Check them, then save.`); };
EM.ACTIONS['ol-imp-close'] = () => { EM.olImp = null; qs('#ol-imp').innerHTML = ''; };
