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
  if (['clients', 'people', 'opps', 'import', 'inventory'].includes(t)) return holds();
  if (t === 'dealers') return holds() && canDiv('wholesale');
  if (t === 'architects') return holds();
  if (t === 'orders' || t === 'p200') return holds() && canDiv('wholesale');
  if (t === 'installation') return holds() && canDiv('retail');
  if (t === 'complaints' || t === 'approvals') return holds();
  if (t === 'team') return D.access.users;
  if (t === 'lists') return isOwner();
  return false;
}
EM.div = D.user.division === 'both' ? 'both' : D.user.division;
EM.navTabs = () => ({
  main: [['home', 'Home'], ['dealers', 'Dealers'], ['architects', 'Architects'], ['people', 'People'], ['opps', 'Opportunities'], ['orders', 'Fulfilment'], ['installation', 'Installation'], ['complaints', 'Complaints'], ['approvals', 'Approvals'], ['p200', 'Priority 200'], ['inventory', 'Inventory'], ['import', 'Import from Excel']]
    .filter(([k]) => allowedTab(k) && !(['dealers', 'orders', 'p200'].includes(k) && EM.div === 'retail') && !(k === 'installation' && EM.div === 'wholesale')),
  shared: [['team', 'Team & access'], ['lists', 'Lists & stages'], ['account', 'My account']].filter(([k]) => allowedTab(k)),
});
Object.assign(ICON, {
  opps: ICON.leads, architects: ICON.firms, people: ICON.clients, inventory: ICON.stock, p200: ICON.targets, import: _i('<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/><path d="M4 15.5v3A2 2 0 0 0 6 20.5h12a2 2 0 0 0 2-2v-3"/>'),
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
/* a unit shown beside the box replaces the "(₹)" or "(sq ft)" in the label, so it is said once */
const unitOf = f => f.type === 'money' ? 'money' : UNITS[f.key] || '';
const formLabel = f => unitOf(f) ? f.label.replace(/\s*\((₹|sq ft|days|kg|years|boxes)[^)]*\)\s*$/, '') : f.label;
const G = {
  wrap: (f, p, inner, wide) => `<div class="field${wide ? ' span2' : ''}" data-field="${f.key}"><label for="${p}-${f.key}">${esc(formLabel(f))}${f.req ? ' *' : ''}</label>${inner}</div>`,
  /* ₹ … /- around money, the unit after an area, a size or a count */
  adorn: (f, input) => { const u = unitOf(f); return u ? `<div class="adorn" data-unit="${esc(u)}">${u === 'money' ? '<span class="pre">₹</span>' : ''}${input}<span class="suf">${u === 'money' ? '/-' : esc(u)}</span></div>` : input; },
  /* several values: a dropdown with ticks and a search, not a wall of chips */
  multi: (f, v, p, opts) => { const sel = Array.isArray(v) ? v : [];
    return G.wrap(f, p, `<div class="ms" data-ms="${f.key}"><button type="button" class="input ms-btn" id="${p}-${f.key}" aria-expanded="false">${sel.length ? esc(sel.join(', ')) : '<span class="muted">Choose…</span>'}</button>
      <div class="ms-pop" hidden><input class="input ms-q" placeholder="Search" aria-label="Search ${esc(f.label)}">${opts.map(o => `<label class="ms-opt"><input type="checkbox" name="${f.key}" value="${esc(o)}" ${sel.includes(o) ? 'checked' : ''}> ${esc(o)}</label>`).join('')}
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
    case 'cats': return fieldHtml({ ...f, type: 'multi', opts: D.lists.categories }, v, p);
    case 'cat': return G.select(f, v, p, D.lists.categories.map(c => [c, c]));
    case 'decimal': return G.wrap(f, p, G.adorn(f, `<input class="input" type="number" min="0" step="any" inputmode="decimal" id="${p}-${f.key}" name="${f.key}" value="${esc(v)}">`));
    case 'collection': return G.select(f, v, p, INVD().collections.map(c => [c.id, `${c.name} · ${c.category}`]));
    case 'cities': return fieldHtml({ ...f, type: 'multi', opts: D.lists.cities.map(c => c.city) }, v, p);
    case 'multi': return G.multi(f, v, p, optsOf(f, D.lists));
    case 'stage': return G.select(f, v, p, ((D.lists.stages || {})[opt.pipeline] || []).map(s => [s, s]), false);
    case 'lost': return G.select(f, v, p, D.lists.lost_reasons.map(s => [s, s]));
    case 'contact': return G.select(f, v, p, D.contacts.filter(k => k.client_id === opt.client).map(k => [k.id, `${k.name}${k.designation ? ' · ' + k.designation : ''}`]));
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
  const sel = [...ms.querySelectorAll('input[type=checkbox]:checked')].map(x => x.value);
  ms.querySelector('.ms-btn').innerHTML = sel.length ? esc(sel.join(', ')) : '<span class="muted">Choose…</span>';
  ms.querySelector('.ms-n').textContent = sel.length + ' chosen';
});
document.addEventListener('input', e => { if (e.target.classList && e.target.classList.contains('ms-q')) { const q = e.target.value.toLowerCase(); e.target.parentElement.querySelectorAll('.ms-opt').forEach(l => { l.hidden = q && !l.textContent.toLowerCase().includes(q); }); } });
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
  const open = os.filter(o => !isClosed(o.pipeline, o.stage, D.lists));
  const due = [...open.filter(o => o.next_date && o.next_date <= t)];
  const won = os.filter(o => o.stage === wonStage(o.pipeline, D.lists) && (o.closed_at || '').slice(0, 7) === month);
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
  sales: ['Invoices, outstanding and ledgers', 'Tally. Orders are taken here; invoices, payments and outstanding will be read from Tally.'],
  calls: ['Calls and telecalling', 'Runo, through its API key.'],
  visits: ['Field visits', 'Sales Diary, once the vendor shares its API documentation.'],
  whatsapp: ['WhatsApp messages', 'The WhatsApp Business number and Meta approval.'],
  ads: ['Ad and portal leads', 'Meta, Google, IndiaMART and JustDial lead feeds.'],
  ai: ['AI lead screening and the call agent', 'The leads feed above, a telephony number and DLT registration.'],
  targets: ['Targets, schemes and Priority 200 scores', 'Sales from Tally, so achievement is never typed by hand.'],
  stock: ['Fulfilment and production', 'Tally. Stock itself is kept in Inventory until Tally is connected.'],
};
const notConnectedCard = () => `<section class="card stack-s"><h3>Not connected yet</h3><p class="small muted">These parts of EGO Master show no figures until the system that feeds them is connected. Nothing here is estimated.</p>
  ${table(['Part', 'Waits for', ''], Object.values(SOON).map(([a, b]) => [esc(a), esc(b), '<span class="badge warn">Not connected yet</span>']))}</section>`;
/* the demo's screens, if a bookmark or an old link reaches them */
const DEMO_ROUTES = { worder: 'sales', fulfil: 'stock', targets: 'targets', schemes: 'targets', champions: 'targets', leads: 'ads', lead: 'ads', projects: 'sales', project: 'sales', inbox: 'whatsapp', cockpit: 'targets', automations: 'whatsapp', ai: 'ai', integrations: 'ai', app: 'visits', map: 'ai', tech: 'ai' };
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
  const team = id => D.contacts.filter(k => k.client_id === id).length, open = id => D.opportunities.filter(o => o.client_id === id && !isClosed(o.pipeline, o.stage, D.lists)).length;
  const title = org === 'dealer' ? 'Dealers' : 'Architects', base = '#/' + (org === 'dealer' ? 'dealers' : 'architects');
  const rating = c => org === 'dealer' ? c.grade : (c.extra || {}).rating;
  return `<div class="stack">
    <div class="row between"><div class="stack-s"><div class="kicker">${org === 'dealer' ? 'Distributors, dealers and sub-dealers, each with its team' : 'Architect firms and solo architects, each with its team'}</div><h1>${title}</h1><p class="muted">${rows.length} of ${all.length} · ${esc(scopeLabel())}</p></div>
      <div class="row" style="flex-wrap:wrap"><a class="btn" href="#/import">Import from Excel</a>${(org === 'dealer' ? DEALER_KINDS : ARCH_KINDS).map((k, i) => `<button class="btn ${(tab[2].length === 1 ? tab[2][0] === k : i === (org === 'dealer' ? 1 : 0)) ? 'primary' : ''}" data-act="org-add" data-kind="${k}">+ Add ${esc(kindName(k).toLowerCase())}</button>`).join('')}</div></div>
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
  ['Address', ['address', 'locality', 'city', 'pincode']],
  ['Area details', ['areas_covered', 'other_offices']],
  ['Business details', ['owner_id', 'grade', 'rating', 'parent_id', 'source', 'status', 'since', 'credit_limit', 'priority200', 'relationship', 'connected_dealers']],
];
const POC_FIELDS = CONTACT_FIELDS.filter(f => f.key !== 'is_primary');
const personRow = (i, v = {}) => `<form class="card stack-s pf-row" data-scope data-i="${i}" onsubmit="return false"><div class="row between"><b>Another person</b><button class="btn sm ghost" data-act="ppl-del" data-i="${i}">Remove</button></div>
  <div class="fgrid">${POC_FIELDS.map(f => fieldHtml(f, v[f.key], 'pp' + i)).join('')}</div></form>`;
const fsHtml = (title, inner) => `<fieldset class="fs"><legend>${esc(title)}</legend>${inner}</fieldset>`;
function openClientForm(c, kind, keep, only, people, poc) {
  const fam = c ? FAMILIES.find(f => f.includes(c.kind)) : null;
  const kinds = c ? fam.filter(k => canDiv(KINDS[k].division)) : (only || kindsAllowed()).filter(k => kindsAllowed().includes(k));
  kind = kinds.includes(kind) ? kind : (c ? c.kind : kinds[0]);
  const v = keep || (c ? { ...c, ...c.extra } : { owner_id: me().id, status: 'Active' });
  const all = showFields(fieldsFor(kind)).filter(f => f.key !== 'kind');
  const org = DEALER_KINDS.includes(kind) ? 'dealer' : ARCH_KINDS.includes(kind) ? 'architect' : null;
  const noun = org ? kindName(kind).toLowerCase() : 'person';
  const fh = f => fieldHtml(f, v[f.key], 'cf', { self: c && c.id });
  const kindPick = `<div class="field span2"><span class="small muted">${org ? 'What are you adding?' : 'Type'}</span><div class="seg-kind" role="radiogroup" aria-label="Type">${kinds.map(k => `<label><input type="radio" name="kind" value="${k}" data-kind-pick ${k === kind ? 'checked' : ''}> ${esc(kindName(k))}</label>`).join('')}</div></div>
    ${KINDS[kind].division === 'both' && D.user.division === 'both' ? G.select({ key: 'division', label: 'Which company keeps this record' }, v.division || (EM.div === 'both' ? 'both' : EM.div), 'cf', [['wholesale', 'EGO Premium'], ['retail', 'Big E'], ['both', 'Both companies']], false) : ''}`;
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
      + secs.slice(1).filter(([, fs]) => fs.length).map(([t, fs]) => fsHtml(t, `<div class="fgrid">${fs.map(fh).join('')}</div>`)).join('')
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
  const ops = D.opportunities.filter(o => o.client_id === c.id), won = ops.filter(o => o.stage === wonStage(o.pipeline, D.lists)), open = ops.filter(o => !isClosed(o.pipeline, o.stage, D.lists));
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
const stageBadge = s => `<span class="badge ${Object.keys(PIPELINES).some(p => wonStage(p, D.lists) === s) ? 'ok' : Object.keys(PIPELINES).some(p => lostStage(p, D.lists) === s) ? 'bad' : 'info'}">${esc(s)}</span>`;
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
  const stages = D.lists.stages[p] || [];
  const t = today();
  const card = o => `<div class="mini" data-href="#/opp/${o.id}" tabindex="0"><b>${esc(o.title)}</b><div class="small muted">${esc((CL()[o.client_id] || {}).name || '')}</div>
    <div class="small">${D.access.prices && o.value != null ? money(o.value) + ' · ' : ''}${esc(staffName(o.owner_id))}</div>${o.next_date ? `<div class="small ${o.next_date < t && !isClosed(o.pipeline, o.stage, D.lists) ? 'err' : 'muted'}">${esc(o.next_action || 'Next action')} · ${ds(o.next_date)}</div>` : ''}</div>`;
  return `<div class="stack">
    <div class="row between"><div class="stack-s"><div class="kicker">Each one linked to a dealer, an architect firm or a person</div><h1>Opportunities</h1><p class="muted">${all.length} ${esc(PIPELINES[p].plural.toLowerCase())} · ${esc(scopeLabel())}</p></div>
      <div class="row"><label class="chip" style="padding:8px 10px"><input type="checkbox" id="opp-mine" ${EM.oppMine ? 'checked' : ''}> Only mine</label><button class="btn primary" data-act="opp-add" data-pipeline="${p}">+ Add opportunity</button></div></div>
    ${subtabs('#/opps', p, ps.map(k => [k, `${PIPELINES[k].plural} <span class="muted">${D.opportunities.filter(o => o.pipeline === k).length}</span>`]))}
    ${all.length ? '' : `<p class="small muted">No ${esc(PIPELINES[p].plural.toLowerCase())} yet. Add one from here, or from a dealer, an architect firm or a person. The stages below come from Lists & stages.</p>`}
    ${stageBoard(stages, all, o => o.stage, card, ls => D.access.prices && ls.some(o => o.value) ? `<div class="small muted">${inr(ls.reduce((a, o) => a + (Number(o.value) || 0), 0))}</div>` : '')}</div>`;
};
EM.VIEWS.opps.title = () => 'Opportunities';
document.addEventListener('change', e => { if (e.target.id === 'opp-mine') { EM.oppMine = e.target.checked; EM.rerender(); } });

EM.VIEWS.opp = id => {
  const o = D.opportunities.find(x => x.id === id);
  if (!o) return `<div class="stack"><h1>Opportunity not found</h1><a class="btn" href="#/opps">Opportunities</a></div>`;
  const c = CL()[o.client_id] || { name: 'Client outside your view' }, v = { ...o, ...o.extra };
  const stages = D.lists.stages[o.pipeline] || [], hist = D.history.filter(h => h.opp_id === id);
  const at = stages.indexOf(o.stage);
  const fields = showFields(OPP_FIELDS).filter(f => !['pipeline', 'title', 'stage', 'contact_id'].includes(f.key) && (f.key !== 'lost_reason' || o.stage === lostStage(o.pipeline, D.lists)));
  const contact = D.contacts.find(k => k.id === o.contact_id);
  return `<div class="stack">${crumbs(['Opportunities', `#/opps/${o.pipeline}`], [o.title])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(o.title)}</h1>
      <div class="row"><span class="badge info plain">${esc(PIPELINES[o.pipeline].label)}</span>${stageBadge(o.stage)}<span class="small muted">${esc(o.ref || '')}</span></div>
      <p class="muted"><a href="#/client/${o.client_id}">${esc(c.name)}</a>${contact ? ` · ${esc(contact.name)} ${esc(fmtMobile(contact.mobile))}` : ''}</p></div>
      <div class="row">${o.stage === wonStage(o.pipeline, D.lists) && o.pipeline !== 'wholesale' && allowedTab('installation') ? `<button class="btn primary" data-act="site-add" data-client="${o.client_id}" data-opp="${id}">Add installation site</button>` : ''}<button class="btn" data-act="opp-edit" data-id="${id}">Edit</button>${isOwner() ? `<button class="btn ghost" data-act="opp-del" data-id="${id}">Delete</button>` : ''}</div></div>
    <section class="card stack-s"><h3>Stage</h3><div class="flow">${stages.map((s, i) => `<span class="${s === o.stage ? 'cur' : i < at && o.stage !== lostStage(o.pipeline, D.lists) ? 'done' : ''}">${esc(s)}</span>`).join('<i>›</i>')}</div>
      <div class="row"><select class="input" id="move-stage" aria-label="Move to stage" style="width:auto">${stages.map(s => `<option ${s === o.stage ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><button class="btn primary" data-act="opp-move" data-id="${id}">Move stage</button></div></section>
    ${PIPELINES[o.pipeline].lines ? oppLinesCard(o) : ''}
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
  const withLines = PIPELINES[pipeline].lines, fields = showFields(OPP_FIELDS).filter(f => f.key !== 'pipeline' && !(withLines && f.key === 'value'));
  const lines0 = (v.lines || (o ? (OPSD().oppLines || []).filter(l => l.opp_id === o.id) : [])), inFul = o && OPSD().orders.some(x => x.opp_id === o.id);
  EM.modal(`<h2>${o ? 'Edit opportunity' : 'Add an opportunity'}</h2>
    <form id="of" class="stack" onsubmit="return false" style="margin-top:14px" data-id="${o ? o.id : ''}"><div class="fgrid">
      ${o ? `<div class="field"><label>Client</label><input class="input" value="${esc(client.name)}" disabled><input type="hidden" name="client_id" value="${client.id}"></div>`
    : `<div class="field"><label for="of-client_id">Client *</label><select class="input" id="of-client_id" name="client_id" data-opp-redraw>${clients.map(c => `<option value="${c.id}" ${c.id === client.id ? 'selected' : ''}>${esc(c.name)} · ${esc(kindLabel(c.kind))}</option>`).join('')}</select></div>`}
      ${G.select(OPP_FIELDS[0], pipeline, 'of', pipes.map(p => [p, PIPELINES[p].label]), false).replace('<select', '<select data-opp-redraw')}
      ${fields.map(f => fieldHtml(f, v[f.key], 'of', { pipeline, client: client.id })).join('')}</div>
      ${withLines && !inFul ? `<fieldset class="fs"><legend>Designs, boxes and rate</legend><p class="small muted">Type the boxes and the rate per box; the amount, GST (${D.lists.rules.gst_pct}%) and total are worked out. The total is the opportunity's value.</p>
        <div id="olines" class="stack-s">${(lines0.length ? lines0 : [{}]).map((l, i) => ordLine(i, l)).join('')}</div><div class="row"><button class="btn sm" data-act="ol-add">+ Another design</button></div>
        ${D.access.prices ? `<div class="fgrid"><div class="field"><label for="ord-disc">Discount</label><div class="adorn" data-unit="%"><input class="input" type="number" min="0" max="100" step="0.1" id="ord-disc" value="${esc(v.discount_pct ?? 0)}"><span class="suf">%</span></div></div></div>` : ''}<div id="ord-total" class="small"></div></fieldset>` : ''}
      ${errBox('of-err')}<div class="row sticky-actions"><button class="btn primary" data-act="opp-save">${o ? 'Save changes' : 'Add opportunity'}</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
}
document.addEventListener('change', e => {
  if (!e.target.matches('[data-opp-redraw]')) return;
  const form = qs('#of'), o = form.dataset.id ? D.opportunities.find(x => x.id === form.dataset.id) : null;
  const keep = withDials(readForm(form, OPP_FIELDS), OPP_FIELDS);
  keep.client_id = form.querySelector('[name=client_id]').value;
  if (qs('#olines')) { keep.lines = readOrder(); keep.discount_pct = Number((qs('#ord-disc') || { value: 0 }).value || 0); }
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
    /* a wholesale sale also changes its designs, approvals and (at payment) its fulfilment: read them again */
    if (PIPELINES[r.opportunity.pipeline].lines) { const fresh = await API('GET', '/api/bootstrap'); Object.assign(D, fresh); }
    return r;
  } catch (x) {
    busy(el, false); showErr(errId, x.errors || x.message);
    if (PIPELINES[input.pipeline] && PIPELINES[input.pipeline].lines) { try { Object.assign(D, await API('GET', '/api/bootstrap')); } catch (e) { } }   // a refused move may still have raised an approval
    return null;
  }
}
EM.ACTIONS['opp-save'] = async el => {
  const form = qs('#of'), input = readForm(form, OPP_FIELDS);
  input.client_id = form.querySelector('[name=client_id]').value;
  if (form.dataset.id) input.id = form.dataset.id;
  if (qs('#olines')) {
    input.lines = readOrder(); input.discount_pct = Number((qs('#ord-disc') || { value: 0 }).value || 0);
    if (input.lines.some(l => !l.product_id || !Number.isInteger(l.boxes) || l.boxes <= 0)) return showErr('of-err', 'Every design line needs a design and a whole number of boxes (or remove the line).');
  }
  const r = await saveOpp(input, el, 'of-err');
  if (!r) return;
  EM.closeModal(); EM.toast(`<b>${esc(r.opportunity.title)}</b> ${r.created ? 'added' : 'saved'} · ${esc(r.opportunity.stage)}`);
  location.hash = `#/opp/${r.opportunity.id}`; EM.rerender();
};
const oppInput = o => ({ ...o.extra, id: o.id, client_id: o.client_id, pipeline: o.pipeline, title: o.title, stage: o.stage, value: o.value ?? '', owner_id: o.owner_id, contact_id: o.contact_id, source: o.source, next_action: o.next_action, next_date: o.next_date, lost_reason: o.lost_reason });
EM.ACTIONS['opp-move'] = async el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id), to = qs('#move-stage').value;
  if (to === o.stage) return;
  if (to === lostStage(o.pipeline, D.lists)) return EM.modal(`<h2>Why was it lost?</h2><p class="muted">A lost reason is compulsory.</p><div class="field" style="margin-top:12px"><label for="lost-pick">Lost reason *</label><select class="input" id="lost-pick"><option value="">Choose</option>${D.lists.lost_reasons.map(r => `<option>${esc(r)}</option>`).join('')}</select></div>${errBox('lost-err')}<div class="row" style="margin-top:14px"><button class="btn primary" data-act="opp-lost" data-id="${o.id}">Mark as lost</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
  const r = await saveOpp({ ...oppInput(o), stage: to }, el, 'move-err');
  if (r) { EM.toast(`Moved to <b>${esc(to)}</b>.`); EM.rerender(); } else EM.toast('Could not move it. ' + esc((qs('#move-err') || {}).textContent || ''));
};
EM.ACTIONS['opp-lost'] = async el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id), why = qs('#lost-pick').value;
  if (!why) return showErr('lost-err', 'Choose the reason.');
  const r = await saveOpp({ ...oppInput(o), stage: lostStage(o.pipeline, D.lists), lost_reason: why }, el, 'lost-err');
  if (r) { EM.closeModal(); EM.toast('Marked as lost: ' + esc(why)); EM.rerender(); }
};
EM.ACTIONS['opp-del'] = async el => {
  const o = D.opportunities.find(x => x.id === el.dataset.id);
  if (!confirm(`Delete ${o.title}? Its stage history goes with it.`)) return;
  try { await API('DELETE', '/api/opportunities/' + o.id); D.opportunities = D.opportunities.filter(x => x.id !== o.id); D.history = D.history.filter(h => h.opp_id !== o.id); location.hash = '#/opps/' + o.pipeline; } catch (x) { EM.toast(esc(x.message)); }
};

/* ---------------------------------------------------------------- inventory
   One inventory for EGO Premium and Big E: category > collection > design, and each
   design's boxes in each warehouse. Stock changes only through a stock move (or the
   boxes typed when a design is added), so every figure has who, when and why.
   The filter bar at the top (warehouse, category, collection, design) narrows every tab. */
const INVD = () => D.inventory || { collections: [], products: [], warehouses: [], stock: [] };
const canStockUI = () => STOCK_ROLES.includes(me().role);
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
      ${tile('Boxes in stock', num(all.reduce((a, [, b]) => a + b, 0)), '', '#/inventory/stock')}${tile('Square feet in stock', num(totalSqft(all)), noBox ? `${noBox} collection${noBox === 1 ? '' : 's'} without a box size` : '', '#/inventory/stock')}${tile('Below their warning level', low.length, '', '#/inventory/designs')}</div>
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
  return `${filtNote()}<div class="grid g4">${tile('Lines in stock', lines.length)}${tile('Boxes', num(sum))}${tile('Square feet', num(sq))}${tile('Designs in stock', new Set(lines.map(([p]) => p.id)).size)}</div>
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

const specRows = (c, sections) => COLLECTION_FIELDS.filter(f => !['category', 'name'].includes(f.key) && (!sections || sections.includes(f.section)) && (D.access.prices || f.type !== 'money')).map(f => [esc(f.label), showVal(f, c.extra[f.key])]);
const BOX = 'Box size and packing';
EM.VIEWS.product = id => {
  const p = INVD().products.find(x => x.id === id);
  if (!p) return `<div class="stack"><h1>Design not found</h1><a class="btn" href="#/inventory/designs">Designs</a></div>`;
  const c = colOf(p), I = INVD(), total = boxesOf(p.id, null);
  const allB = I.stock.filter(x => x.product_id === p.id).reduce((a, x) => a + x.boxes, 0);
  return `<div class="stack">${crumbs(['Inventory', '#/inventory/designs'], [c.category, '#/inventory/categories'], [c.name, '#/collection/' + c.id], [p.name])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(p.name)}</h1><div class="row"><a class="badge info plain" href="#/collection/${c.id}">${esc(c.name)}</a><span class="badge plain">${esc(c.category)}</span>${p.sub_type ? `<span class="badge plain">${esc(p.sub_type)}</span>` : ''}${p.code ? `<span class="small muted">${esc(p.code)}</span>` : ''}${p.status === 'Discontinued' ? '<span class="badge warn">Discontinued</span>' : ''}</div>
      <p class="muted">${num(allB)} boxes in stock · ${sqftTxt(p, allB)} sq ft</p></div>
      ${canStockUI() ? `<div class="row"><button class="btn" data-act="prod-edit" data-id="${p.id}">Edit</button><button class="btn primary" data-act="move-add" data-product="${p.id}">Stock in / out</button>${isOwner() ? `<button class="btn ghost" data-act="prod-del" data-id="${p.id}">Delete</button>` : ''}</div>` : ''}</div>
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
  const note = step === 2 ? stepNote(2, `Add a collection${v.category ? ' in ' + esc(v.category) : ''}. The box size matters most: stock is counted in boxes, and square feet are worked out from it. Fill square feet OR square metres.`)
    : step === 3 ? stepNote(3, 'Add a design in this collection, and the warehouses it is in with the boxes there today.')
      : table === 'collections' && !rec ? '<p class="small muted">Box size in square feet or square metres: fill either, the other is worked out.</p>' : '';
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
  try { await API('DELETE', '/api/products/' + p.id); D.inventory.products = D.inventory.products.filter(x => x.id !== p.id); location.hash = '#/inventory/designs'; } catch (x) { EM.toast(esc(x.message)); }
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
const OPSD = () => D.ops || { orders: [], lines: [], allocations: [], production: [], waits: [], sites: [], snags: [], complaints: [], approvals: [] };
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
  catch (x) { busy(el, false); if (errId && qs('#' + errId)) showErr(errId, x.message); else EM.toast(`<b>Not done</b><ul><li>${esc(x.message)}</li></ul>`); await refreshOps(); return null; }
};
async function showLog(entity, id, box) {
  try { const r = await API('GET', `/api/ops/log?entity=${entity}&id=${encodeURIComponent(id)}`), el = qs(box); if (el) el.innerHTML = r.log.length ? table(['When', 'From', 'To', 'By', 'Note'], r.log.map(l => [ds(l.at.slice(0, 10)), esc(l.from_stage || ''), `<b>${esc(l.to_stage)}</b>`, esc(l.by_name || ''), esc(l.note || '')])) : '<p class="small muted">Nothing yet.</p>'; } catch (x) { }
}

/* ---- fulfilment (wholesale): the sale is the opportunity; at Payment collected it comes here */
const ORD_TABS = [['fulfilment', 'Fulfilment'], ['production', 'Production']];
const waitsOf = (pred) => OPSD().waits.filter(pred);
const poRef = id => (OPSD().production.find(p => p.id === id) || { ref: 'PO' }).ref;
const oppOf = o => D.opportunities.find(x => x.id === o.opp_id);
/* the whole road, from the first contact to the dealer's door, said once at the top */
const flowStrip = () => { const W = D.lists.stages.wholesale || [], FS = OS_('fulfilment_stages'), PS = OS_('production_stages'), won = wonStage('wholesale', D.lists);
  const chip = (t, cls) => `<span class="badge ${cls || 'plain'}">${esc(t)}</span>`, arrow = '<span class="muted">→</span>';
  return `<section class="card stack-s" data-flow><h3>How a wholesale sale moves</h3>
    <div class="row" style="flex-wrap:wrap;gap:6px;align-items:center"><b class="small">1. Opportunities (the sale)</b>${W.filter(x => ![lostStage('wholesale', D.lists), nm(D.lists, 'stages.wholesale', 'Nurturing')].includes(x)).map(x => chip(x, x === creditStage('wholesale', D.lists) ? 'warn' : x === won ? 'ok' : '')).join(arrow)}</div>
    <p class="small muted">The designs, boxes and rate are typed on the opportunity; the money is worked out. At <b>${esc(creditStage('wholesale', D.lists))}</b> the credit limit is checked. At <b>${esc(won)}</b> the sale comes here by itself. ${esc(lostStage('wholesale', D.lists))} and ${esc(nm(D.lists, 'stages.wholesale', 'Nurturing'))} stay in Opportunities.</p>
    <div class="row" style="flex-wrap:wrap;gap:6px;align-items:center"><b class="small">2. Fulfilment</b>${FS.map(x => chip(x, x === FN('Stock check') ? 'warn' : x === FN('Dispatched') ? 'info' : '')).join(arrow)}</div>
    <p class="small muted">At <b>${esc(FN('Stock check'))}</b> each design is compared with what is free in every warehouse; you choose how many boxes to take from each. What you do not take goes to production. <b>${esc(FN('Dispatched'))}</b> takes the boxes out of the inventory.</p>
    <div class="row" style="flex-wrap:wrap;gap:6px;align-items:center"><b class="small">3. Production (only for what was short)</b>${PS.map(x => chip(x, x === PNn('Received at warehouse') ? 'warn' : '')).join(arrow)}</div>
    <p class="small muted">One production order can serve several sales of the same design. <b>${esc(PNn('Received at warehouse'))}</b> adds the boxes to stock; <b>${esc(PNn('Allocated & closed'))}</b> gives each waiting sale its share, oldest first, and they move on by themselves.</p></section>`; };
EM.VIEWS.orders = arg => {
  const tab = ORD_TABS.find(t => t[0] === arg) ? arg : 'fulfilment', O = OPSD();
  const lineSum = id => O.lines.filter(l => l.order_id === id);
  const head = `<div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">EGO Premium · after the payment, to the dealer's door</div><h1>Fulfilment</h1></div>
    <div class="row">${tab === 'production' && canStockUI() ? '<button class="btn" data-act="po-add">+ Production order</button>' : ''}<a class="btn" href="#/opps/wholesale">Wholesale opportunities</a></div></div>
    ${flowStrip()}
    ${subtabs('#/orders', tab, ORD_TABS.map(([k, l]) => [k, `${l} <span class="muted">${k === 'fulfilment' ? O.orders.length : O.production.length}</span>`]))}`;
  let body;
  if (tab === 'fulfilment') {
    body = `${O.orders.length ? '' : `<p class="small muted">Nothing in fulfilment yet. A wholesale opportunity comes here when it reaches ${esc(wonStage('wholesale', D.lists))}.</p>`}${stageBoard(OS_('fulfilment_stages'), O.orders, o => o.ful_stage, ordCard)}
      ${O.orders.length ? table(['Fulfilment', 'Opportunity', 'Dealer', 'Boxes', ...(D.access.prices ? ['Value'] : []), 'Stage', 'Production orders'], O.orders.map(o => ({ href: '#/order/' + o.id,
        cells: [`<b>${esc(o.ref)}</b><div class="small muted">${ds(o.created_at.slice(0, 10))}</div>`, esc((oppOf(o) || { title: '' }).title), esc(clientName(o.client_id)), num(lineSum(o.id).reduce((a, l) => a + l.boxes, 0)), ...(D.access.prices ? [inr0(o.total)] : []),
          `<span class="badge info">${esc(o.ful_stage)}</span>`, esc([...new Set(waitsOf(w => w.order_id === o.id).map(w => poRef(w.po_id)))].join(', '))] }))) : ''}`;
  } else {
    const nSales = p => new Set(waitsOf(w => w.po_id === p.id).map(w => w.order_id)).size;
    body = stageBoard(OS_('production_stages'), O.production, p => p.stage, p => `<a class="card stack-s" style="text-decoration:none" href="#/po/${p.id}"><b>${esc(p.ref)}</b><span class="small">${esc(prodName(p.product_id))}</span><span class="small muted">${num(p.boxes)} boxes · for ${nSales(p)} sale${nSales(p) === 1 ? '' : 's'}</span></a>`)
      + (O.production.length ? table(['Production order', 'Design', 'Boxes', 'For sales', 'Stage', 'Expected', 'Warehouse'], O.production.map(p => ({ href: '#/po/' + p.id,
        cells: [`<b>${esc(p.ref)}</b>${p.container ? `<div class="small muted">${esc(p.container)}</div>` : ''}`, esc(prodName(p.product_id)), num(p.boxes), esc([...new Set(waitsOf(w => w.po_id === p.id).map(w => (O.orders.find(o => o.id === w.order_id) || {}).ref))].join(', ')), `<span class="badge info">${esc(p.stage)}</span>`, p.eta ? ds(p.eta) : '', esc((INVD().warehouses.find(w => w.id === p.warehouse_id) || {}).name || '')] })))
        : '<p class="small muted">No production orders yet. One is made at Stock check for what a sale cannot take from the warehouses, or placed directly.</p>');
  }
  return `<div class="stack">${head}${body}</div>`;
};
EM.VIEWS.orders.title = () => 'Fulfilment';
const ordCard = o => `<a class="card stack-s" style="text-decoration:none" href="#/order/${o.id}"><b>${esc(o.ref)}</b><span class="small">${esc(clientName(o.client_id))}</span><span class="small muted">${num(OPSD().lines.filter(l => l.order_id === o.id).reduce((a, l) => a + l.boxes, 0))} boxes</span></a>`;
/* the designs on a wholesale opportunity, with the money worked out */
function oppLinesCard(o) {
  const ls = (OPSD().oppLines || []).filter(l => l.opp_id === o.id), ex = o.extra || {}, ord = OPSD().orders.find(x => x.opp_id === o.id), pend = pendingFor('opp', o.id), apprs = OPSD().approvals.filter(a => a.entity === 'opp' && a.record_id === o.id);
  return `<section class="card stack-s" data-opp-lines><div class="row between"><h3>Designs, boxes and rate</h3>${ord ? `<a class="btn sm primary" href="#/order/${ord.id}">In fulfilment: ${esc(ord.ref)} · ${esc(ord.ful_stage)}</a>` : ''}</div>
    ${ls.length ? table(['Design', 'Boxes', ...(D.access.prices ? ['Rate per box', 'Amount'] : []), 'Free in the warehouses now'], ls.map(l => [`<b>${esc(prodName(l.product_id))}</b>`, num(l.boxes), ...(D.access.prices ? [inr0(l.rate), inr0(l.amount)] : []), num(INVD().warehouses.reduce((a, w) => a + Math.max(0, freeAt(l.product_id, w.id)), 0))]))
      + (D.access.prices ? `<p class="small">${ex.discount_pct ? `Discount ${ex.discount_pct}% · ` : ''}Subtotal ${inr0(ex.subtotal)} + GST ${ex.gst_pct ?? D.lists.rules.gst_pct}% = <b>${inr0(o.value)}</b></p>` : '')
      : `<p class="small muted">No designs yet. Edit the opportunity to add the designs, boxes and rate; they are needed before ${esc(creditStage(o.pipeline, D.lists))}.</p>`}
    ${pend.length ? `<div class="callout warn"><b>Waiting for approval.</b> ${pend.map(a => esc(a.reason)).join(' · ')} <a href="#/approvals">Approvals</a></div>` : ''}
    ${apprs.filter(a => a.status !== 'Pending').map(a => `<p class="small muted">${esc((D.lists.rules.approvals[a.kind] || { label: a.kind }).label)}: <b>${esc(a.status)}</b> by ${esc(staffName(a.decided_by))}${a.decision_note ? ' · ' + esc(a.decision_note) : ''}</p>`).join('')}</section>`;
}

/* the order form: a dealer, its designs with boxes and rate, an optional discount */
const ordLine = (i, v = {}) => { const I = INVD(), byCol = I.collections.map(c => [c, I.products.filter(p => p.collection_id === c.id && p.status !== 'Discontinued')]).filter(([, ps]) => ps.length);
  return `<div class="fgrid ordline" data-i="${i}" style="align-items:end"><div class="field span2"><label for="ol-p-${i}">Design</label><select class="input" id="ol-p-${i}" data-ol="p"><option value="">Choose</option>${byCol.map(([c, ps]) => `<optgroup label="${esc(c.category + ' · ' + c.name)}">${ps.map(p => `<option value="${p.id}" ${p.id === v.product_id ? 'selected' : ''}>${esc(p.name)}${p.code ? ' · ' + esc(p.code) : ''}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <div class="field"><label for="ol-b-${i}">Boxes</label>${G.adorn({ key: 'low_stock' }, `<input class="input" type="number" min="1" step="1" id="ol-b-${i}" data-ol="b" value="${esc(v.boxes || '')}">`)}</div>
    ${D.access.prices ? `<div class="field"><label for="ol-r-${i}">Rate per box</label>${G.adorn({ type: 'money', key: 'rate' }, `<input class="input" type="number" min="0" step="0.01" id="ol-r-${i}" data-ol="r" value="${esc(v.rate || '')}">`)}</div>` : ''}
    <div class="field"><button class="btn sm ghost" data-act="ol-del">Remove</button></div></div>`; };
const readOrder = () => [...document.querySelectorAll('#olines .ordline')].map(l => ({ product_id: l.querySelector('[data-ol="p"]').value, boxes: Number(l.querySelector('[data-ol="b"]').value), rate: Number((l.querySelector('[data-ol="r"]') || { value: 0 }).value || 0) })).filter(l => l.product_id || l.boxes);
document.addEventListener('input', e => {
  if (!e.target.closest || !e.target.closest('#ordf, #of')) return;
  const ls = readOrder(), gross = ls.reduce((a, l) => a + (l.boxes || 0) * (l.rate || 0), 0), disc = Number((qs('#ord-disc') || { value: 0 }).value || 0), sub = gross * (1 - disc / 100), t = qs('#ord-total');
  if (t && D.access.prices) t.textContent = `${ls.reduce((a, l) => a + (l.boxes || 0), 0)} boxes · ${inr0(sub)} + GST ${D.lists.rules.gst_pct}% = ${inr0(sub * (1 + D.lists.rules.gst_pct / 100))}`;
});
EM.ACTIONS['ol-add'] = () => { const box = qs('#olines'); box.insertAdjacentHTML('beforeend', ordLine(box.children.length)); };
EM.ACTIONS['ol-del'] = el => { const l = el.closest('.ordline'); if (document.querySelectorAll('#olines .ordline').length > 1) l.remove(); };
/* one fulfilment: the sale it came from, each design against the warehouses, and the production orders serving it */
EM.VIEWS.order = id => {
  const O = OPSD(), o = O.orders.find(x => x.id === id);
  if (!o) return `<div class="stack"><h1>Fulfilment not found</h1><a class="btn" href="#/orders">Fulfilment</a></div>`;
  const FS = OS_('fulfilment_stages'), lines = O.lines.filter(l => l.order_id === id), WH = INVD().warehouses, opp = oppOf(o);
  const al = l => O.allocations.filter(a => a.line_id === l.id), got = l => al(l).reduce((a, x) => a + x.boxes, 0);
  const wl = l => O.waits.filter(w => w.line_id === l.id), waiting = l => wl(l).filter(w => !w.done).reduce((a, w) => a + w.boxes, 0);
  const atCheck = [FN('Stock check'), FN('Waiting on production')].includes(o.ful_stage);
  const mineAt = (l, w) => al(l).filter(a => a.warehouse_id === w.id && !a.dispatched).reduce((a, x) => a + x.boxes, 0);
  return `<div class="stack">${crumbs(['Fulfilment', '#/orders'], [o.ref])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(o.ref)}</h1><p class="muted">From ${opp ? `<a href="#/opp/${opp.id}">${esc(opp.title)}</a>` : 'an opportunity'} · <a href="#/client/${o.client_id}">${esc(clientName(o.client_id))}</a> · payment collected ${ds(o.created_at.slice(0, 10))}${D.access.prices ? ` · <b>${inr0(o.total)}</b>` : ''}</p></div>
      ${o.ful_stage !== lastOf(FS) ? `<button class="btn primary" data-act="ful-next" data-id="${id}">Move fulfilment on</button>` : ''}</div>
    <section class="card stack-s">${stageChips(FS, o.ful_stage)}</section>
    <section class="card stack-s" data-stockcheck><div class="row between"><h3>Stock check: each design against the warehouses</h3>${atCheck ? `<button class="btn" data-act="alloc-open" data-id="${id}">Set boxes aside</button>` : ''}</div>
      <p class="small muted">Free = in the warehouse and not set aside for another sale. Still to cover = ordered − set aside − on a production order; it must be 0 before the sale moves past Stock check.</p>
      ${table(['Design', 'Ordered', ...WH.map(w => esc(w.name) + ' <span class="muted">free</span>'), 'Set aside', 'On production', 'Still to cover'], lines.map(l => { const left = l.boxes - got(l) - waiting(l);
        return [`<b>${esc(prodName(l.product_id))}</b>`, num(l.boxes), ...WH.map(w => `${num(Math.max(0, freeAt(l.product_id, w.id) + mineAt(l, w)))}${mineAt(l, w) ? ` <span class="badge ok">${mineAt(l, w)} set aside</span>` : ''}`), num(got(l)), waiting(l) ? num(waiting(l)) : '', left > 0 ? `<span class="badge bad">${left}</span>` : '<span class="badge ok">0</span>']; }))}</section>
    <section class="card stack-s" data-sources><h3>Where each design's boxes come from</h3>
      ${table(['Design', 'From a warehouse', 'From production', ...(D.access.prices ? ['Rate', 'Amount'] : [])], lines.map(l => [`<b>${esc(prodName(l.product_id))}</b>`,
        esc(al(l).filter(a => !a.po_id).map(a => `${(WH.find(w => w.id === a.warehouse_id) || {}).name}: ${a.boxes}${a.dispatched ? ' (dispatched)' : ''}`).join(', ')) || '<span class="muted">None</span>',
        wl(l).length ? wl(l).map(w => `<a href="#/po/${w.po_id}">${esc(poRef(w.po_id))}</a>: ${w.boxes} ${w.done ? '<span class="badge ok">arrived, set aside</span>' : '<span class="badge warn">waiting</span>'}`).join('<br>') : '<span class="muted">None</span>',
        ...(D.access.prices ? [inr0(l.rate), inr0(l.amount)] : [])]))}</section>
    <section class="stack-s"><h3>Fulfilment history</h3><div id="log-f"><p class="muted">Loading…</p></div></section></div>`;
};
EM.VIEWS.order.tab = 'orders';
EM.VIEWS.order.title = id => (OPSD().orders.find(x => x.id === id) || { ref: 'Fulfilment' }).ref;
EM.VIEWS.order.after = id => showLog('fulfilment', id, '#log-f');
EM.ACTIONS['ful-next'] = el => opsAct(el, `orders/${el.dataset.id}/ful-next`, {}, '<b>Fulfilment moved on</b>');
/* setting boxes aside: per line, per warehouse, never more than is free */
const freeAt = (pid, wid) => INVD().stock.filter(x => x.product_id === pid && x.warehouse_id === wid).reduce((a, x) => a + x.boxes, 0) - OPSD().allocations.filter(a => a.product_id === pid && a.warehouse_id === wid && !a.dispatched).reduce((a, x) => a + x.boxes, 0);
EM.ACTIONS['alloc-open'] = el => {
  const id = el.dataset.id, O = OPSD(), lines = O.lines.filter(l => l.order_id === id), WH = INVD().warehouses;
  const mine = (l, w) => O.allocations.filter(a => a.line_id === l.id && a.warehouse_id === w.id && !a.dispatched).reduce((a, x) => a + x.boxes, 0);
  EM.modal(`<h2>Set boxes aside</h2><p class="muted small">For each design, how many boxes to take from each warehouse. "Free" is what is there and not set aside for another order. Whatever cannot be covered can go to production.</p>
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
  return opsAct(el, `orders/${el.dataset.id}/allocate`, { allocs }, '<b>Boxes set aside</b>', 'al-err');
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
      ${waits.length ? table(['Fulfilment', 'Opportunity', 'Dealer', 'Boxes for it', 'Status'], waits.map(w => { const o = OPSD().orders.find(x => x.id === w.order_id) || {}; return { href: '#/order/' + w.order_id, cells: [`<b>${esc(o.ref || '')}</b>`, esc((oppOf(o) || { title: '' }).title), esc(clientName(o.client_id)), num(w.boxes), w.done ? '<span class="badge ok">Arrived, set aside</span>' : '<span class="badge warn">Waiting</span>'] }; })) : '<p class="small muted">No sale is waiting for it; everything it brings goes into stock.</p>'}</section>
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

/* ---- installation sites (Big E) */
EM.VIEWS.installation = () => {
  const S = OPSD().sites.filter(inDiv), SS = OS_('site_steps');
  return `<div class="stack"><div class="row between"><div class="stack-s"><div class="kicker">Big E · from survey to handover</div><h1>Installation</h1><p class="muted">Each site moves through the installation steps. Some steps check before they let you on: a crew, the readiness checklist, no open snag, the client's sign-off.</p></div><button class="btn primary" data-act="site-add">+ Site</button></div>
    ${stageBoard(SS, S, x => x.step, x => `<a class="card stack-s" style="text-decoration:none" href="#/site/${x.id}"><b>${esc(x.ref)}</b><span class="small">${esc(x.name)}</span><span class="small muted">${esc(clientName(x.client_id))}</span></a>`)}
    ${S.length ? table(['Site', 'Client', 'Area', 'Step', 'Crew', 'Open snags', 'Planned start'], S.map(x => ({ href: '#/site/' + x.id, cells: [`<b>${esc(x.ref)}</b> ${esc(x.name)}`, esc(clientName(x.client_id)), x.sqft ? num(x.sqft) + ' sq ft' : '', `<span class="badge info">${esc(x.step)}</span> <span class="small muted">${SS.indexOf(x.step) + 1}/${SS.length}</span>`, esc(x.crew || ''), OPSD().snags.filter(n => n.site_id === x.id && n.status === 'Open').length || '', x.planned_start ? ds(x.planned_start) : ''] })))
      : '<p class="small muted">No installation sites yet. Add a site for a client: a flat, a floor, a project. A won retail project can become a site too.</p>'}</div>`;
};
EM.VIEWS.installation.title = () => 'Installation';
EM.ACTIONS['site-add'] = el => {
  const cs = D.clients.filter(c => inDiv(c) && canDiv('retail') && (c.division === 'retail' || c.division === 'both')).sort((a, b) => a.name.localeCompare(b.name));
  EM.modal(`<h2>Add an installation site</h2><div class="fgrid" style="margin-top:12px">
    ${G.select({ key: 'client', label: 'Client', req: true }, el.dataset.client || '', 'sa', cs.map(c => [c.id, `${c.name} · ${kindLabel(c.kind)}`]))}
    <div class="field"><label for="sa-name">Site name *</label><input class="input" id="sa-name" placeholder="e.g. Flat 1202, Lodha Park"></div>
    <div class="field"><label for="sa-sqft">Area</label>${G.adorn({ key: 'area_sqft' }, '<input class="input" id="sa-sqft" type="number" min="0" step="1">')}</div>
    <div class="field"><label for="sa-ps">Planned start</label><input class="input" id="sa-ps" type="date"></div>
    <div class="field span2"><label for="sa-ad">Address</label><input class="input" id="sa-ad"></div></div>${errBox('sa-err')}
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="site-save" data-opp="${esc(el.dataset.opp || '')}">Add site</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['site-save'] = async el => { const r = await opsAct(el, 'sites', { client_id: qs('#sa-client').value, name: qs('#sa-name').value, sqft: qs('#sa-sqft').value, planned_start: qs('#sa-ps').value, address: qs('#sa-ad').value, opp_id: el.dataset.opp }, null, 'sa-err'); if (r) location.hash = '#/site/' + r.id; };
EM.VIEWS.site = id => {
  const x = OPSD().sites.find(s => s.id === id);
  if (!x) return `<div class="stack"><h1>Site not found</h1><a class="btn" href="#/installation">Installation</a></div>`;
  const SS = OS_('site_steps'), nextS = SS[SS.indexOf(x.step) + 1], snags = OPSD().snags.filter(n => n.site_id === id), ready = x.extra.ready || {};
  return `<div class="stack">${crumbs(['Installation', '#/installation'], [x.ref])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(x.ref)} · ${esc(x.name)}</h1><p class="muted"><a href="#/client/${x.client_id}">${esc(clientName(x.client_id))}</a>${x.sqft ? ' · ' + num(x.sqft) + ' sq ft' : ''}${x.address ? ' · ' + esc(x.address) : ''}${x.actual_start ? ' · started ' + ds(x.actual_start) : ''}${x.actual_end ? ' · completed ' + ds(x.actual_end) : ''}</p></div>
      ${nextS ? `<button class="btn primary" data-act="site-next" data-id="${id}">Move to ${esc(nextS)}</button>` : ''}</div>
    <section class="card stack-s">${stageChips(SS, x.step)}</section>
    <div class="grid g2"><section class="card stack-s"><h3>Crew and dates</h3><div class="fgrid">
        <div class="field"><label for="se-crew">Installer or crew</label><input class="input" id="se-crew" value="${esc(x.crew || '')}"></div>
        <div class="field"><label for="se-ps">Planned start</label><input class="input" id="se-ps" type="date" value="${esc(x.planned_start || '')}"></div>
        <label class="row" style="gap:8px;align-items:center"><input type="checkbox" id="se-so" ${x.signed_off ? 'checked' : ''}> The client has signed off</label></div>
        <div class="row"><button class="btn sm" data-act="site-upd" data-id="${id}">Save</button></div></section>
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
EM.ACTIONS['site-upd'] = el => opsAct(el, `sites/${el.dataset.id}/update`, { crew: qs('#se-crew').value, planned_start: qs('#se-ps').value, signed_off: qs('#se-so').checked, ready: Object.fromEntries([...document.querySelectorAll('[data-ready]')].map(s => [s.dataset.ready, s.value])) }, '<b>Site saved</b>');
EM.ACTIONS['snag-add'] = el => EM.modal(`<h2>Add a snag</h2><div class="fgrid" style="margin-top:12px">
  ${G.select({ key: 'cat', label: 'Kind of snag', req: true }, '', 'sn', D.lists.snag_types.map(v => [v, v]))}${G.select({ key: 'sev', label: 'Severity', req: true }, 'Medium', 'sn', D.lists.severities.map(v => [v, v]))}
  <div class="field span2"><label for="sn-note">Where and what</label><input class="input" id="sn-note"></div><div class="field"><label for="sn-due">Put right by</label><input class="input" id="sn-due" type="date"></div></div>${errBox('sn-err')}
  <div class="row" style="margin-top:12px"><button class="btn primary" data-act="snag-save" data-id="${el.dataset.id}">Add snag</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
EM.ACTIONS['snag-save'] = el => opsAct(el, 'snags', { site_id: el.dataset.id, category: qs('#sn-cat').value, severity: qs('#sn-sev').value, note: qs('#sn-note').value, due: qs('#sn-due').value }, '<b>Snag added</b>', 'sn-err');
EM.ACTIONS['snag-close'] = el => EM.modal(`<h2>Close the snag</h2><div class="field" style="margin-top:12px"><label for="sc-note">How it was put right *</label><input class="input" id="sc-note"></div>${errBox('sc-err')}<div class="row" style="margin-top:12px"><button class="btn primary" data-act="snag-close-go" data-id="${el.dataset.id}">Close it</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
EM.ACTIONS['snag-close-go'] = el => opsAct(el, `snags/${el.dataset.id}/close`, { note: qs('#sc-note').value }, '<b>Snag closed</b>', 'sc-err');

/* ---- complaints */
EM.VIEWS.complaints = arg => {
  const CS = OS_('complaint_statuses'), all = OPSD().complaints.filter(inDiv), tab = CS.includes(arg) ? arg : 'all', rows = all.filter(c => tab === 'all' || c.status === tab);
  return `<div class="stack"><div class="row between"><div class="stack-s"><div class="kicker">${EM.div === 'both' ? 'EGO Premium and Big E' : DIVS[EM.div].co}</div><h1>Complaints</h1><p class="muted">Logged, handled and resolved with what was done. A settlement of <span data-rule>${inr0(D.lists.rules.complaint_settle_from)}</span> or more needs approval.</p></div><button class="btn primary" data-act="cmp-add">+ Complaint</button></div>
    ${stageBoard(CS, all, c => c.status, c => `<a class="card stack-s" style="text-decoration:none" href="#/complaint/${c.id}"><b>${esc(c.ref)}</b><span class="small">${esc(c.type)}</span><span class="small muted">${esc(clientName(c.client_id))}</span></a>`)}
    ${subtabs('#/complaints', tab, [['all', `All <span class="muted">${all.length}</span>`], ...CS.map(s => [s, `${esc(s)} <span class="muted">${all.filter(c => c.status === s).length}</span>`])])}
    ${rows.length ? table(['Complaint', 'From', 'Kind', 'Severity', 'Status', 'Handled by', 'Logged'], rows.map(c => ({ href: '#/complaint/' + c.id, cells: [`<b>${esc(c.ref)}</b>`, esc(clientName(c.client_id)), esc(c.type), esc(c.severity), `<span class="badge ${c.status === lastOf(CS) ? 'ok' : 'warn'}">${esc(c.status)}</span>`, esc(staffName(c.owner_id)), ds(c.created_at.slice(0, 10))] })))
      : '<p class="small muted">No complaints here.</p>'}</div>`;
};
EM.VIEWS.complaints.title = () => 'Complaints';
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
const myLimit = kind => { const R = D.lists.rules, l = APPROVER_LEVEL[me().role]; return l === 'owner' ? Infinity : l && R.approvals[kind] ? R.approvals[kind].levels[l] || 0 : 0; };
const apAmt = a => (D.lists.rules.approvals[a.kind] || {}).unit === '%' ? a.amount + '%' : inr0(a.amount);
EM.VIEWS.approvals = arg => {
  const all = OPSD().approvals, tab = ['Pending', 'Approved', 'Rejected'].includes(arg) ? arg : 'Pending', rows = all.filter(a => a.status === tab);
  const href = a => a.entity === 'opp' ? '#/opp/' + a.record_id : a.entity === 'order' ? '#/order/' + a.record_id : a.entity === 'complaint' ? '#/complaint/' + a.record_id : '#/approvals';
  return `<div class="stack"><div class="stack-s"><div class="kicker">Credit, discounts, complaint settlements</div><h1>Approvals</h1><p class="muted">A request goes to whoever's limit covers it (limits in Lists & stages › Rules and numbers). The Owner has no limit.</p></div>
    ${subtabs('#/approvals', tab, ['Pending', 'Approved', 'Rejected'].map(s => [s, `${s} <span class="muted">${all.filter(a => a.status === s).length}</span>`]))}
    ${rows.length ? table(['What', 'Amount', 'Asked by', 'When', ''], rows.map(a => [`<a href="${href(a)}"><b>${esc((D.lists.rules.approvals[a.kind] || { label: a.kind }).label)}</b></a><div class="small muted">${esc(a.reason)}</div>`, apAmt(a), esc(staffName(a.requested_by)), ds(a.created_at.slice(0, 10)),
      a.status === 'Pending' ? (myLimit(a.kind) >= a.amount ? `<button class="btn sm primary" data-act="ap-yes" data-id="${a.id}">Approve</button><button class="btn sm ghost" data-act="ap-no" data-id="${a.id}">Reject</button>` : '<span class="small muted">Above your limit</span>') : `${esc(staffName(a.decided_by))}${a.decision_note ? ' · ' + esc(a.decision_note) : ''}`]))
      : empty(`Nothing ${tab.toLowerCase()}`, 'Requests appear here when an order goes over a credit limit, a discount is above someone\'s limit, or a complaint settlement is large.')}</div>`;
};
EM.VIEWS.approvals.title = () => 'Approvals';
EM.navBadge = Object.assign(EM.navBadge || {}, { approvals: () => OPSD().approvals.filter(a => a.status === 'Pending' && myLimit(a.kind) >= a.amount).length });
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
  const unpaidOld = D.opportunities.some(o => o.client_id === c.id && o.pipeline === 'wholesale' && o.stage === creditStage('wholesale', D.lists) && (Date.now() - Date.parse((o.updated_at || o.created_at) + 'Z')) / 864e5 > R.payment_days);
  const recent = orders.some(o => (Date.now() - Date.parse(o.created_at + 'Z')) / 864e5 <= 90) || D.opportunities.some(o => o.client_id === c.id && (Date.now() - Date.parse((o.updated_at || o.created_at) + 'Z')) / 864e5 <= 90);
  const parts = { sales: ytdTarget ? Math.min(1, actual / ytdTarget) * W.sales : 0, breadth: D.lists.categories.length ? Math.min(1, cats.size / D.lists.categories.length) * W.breadth : 0,
    payments: unpaidOld ? W.payments / 3 : W.payments, display: ex.showroom ? W.display : 0, activity: recent ? W.activity : 0 };
  const score = Math.round(Object.values(parts).reduce((a, x) => a + x, 0));
  const tier = (R.p200.tiers.find(t => score >= t.min) || lastOf(R.p200.tiers)).name;
  return { score, tier, parts, actual, ytdTarget, cats: cats.size, noTarget: !ex.target_12m };
}
EM.VIEWS.p200 = arg => {
  const R = D.lists.rules, dealers = D.clients.filter(c => DEALER_KINDS.includes(c.kind) && inDiv(c)), inList = dealers.filter(c => (c.extra || {}).priority200);
  const scored = (arg === 'candidates' ? dealers.filter(c => !(c.extra || {}).priority200) : inList).map(c => [c, p200Score(c)]).sort((a, b) => R.p200.tiers.findIndex(t => t.name === a[1].tier) - R.p200.tiers.findIndex(t => t.name === b[1].tier) || b[1].score - a[1].score);
  const W = R.p200.weights;
  return `<div class="stack"><div class="stack-s"><div class="kicker">EGO Premium · the dealers developed first</div><h1>Priority 200</h1>
      <p class="muted" style="max-width:780px">A dealer is in Priority 200 when "Priority 200" is Yes on its page. The score out of 100 is worked out from what is saved: sales against the year-to-date target (${W.sales}), product breadth (${W.breadth}), nothing invoiced and unpaid for more than ${R.payment_days} days (${W.payments}), a showroom (${W.display}), activity in the last 90 days (${W.activity}). The levels and weights are in Lists & stages › Rules and numbers.</p></div>
    <div class="grid g4">${R.p200.tiers.map(t => tile(t.name, scored.filter(([, x]) => x.tier === t.name).length, `score ${t.min}+`)).join('')}</div>
    ${subtabs('#/p200', arg === 'candidates' ? 'candidates' : 'list', [['list', `In Priority 200 <span class="muted">${inList.length}</span>`], ['candidates', `Other dealers <span class="muted">${dealers.length - inList.length}</span>`]])}
    ${scored.length ? table(['Dealer', 'Level', 'Score', ...(D.access.prices ? ['Sales this year', 'Year-to-date target'] : []), 'Categories bought', 'Showroom'], scored.map(([c, x]) => ({ href: '#/client/' + c.id,
      cells: [`<b>${esc(c.name)}</b><div class="small muted">${esc(c.city)} · rating ${esc(c.grade || 'not set')}</div>`, `<span class="badge info">${esc(x.tier)}</span>`, `<b>${x.score}</b>`, ...(D.access.prices ? [inr0(x.actual), x.noTarget ? '<span class="muted">no target set</span>' : inr0(x.ytdTarget)] : []), `${x.cats} of ${D.lists.categories.length}`, (c.extra || {}).showroom ? 'Yes' : 'No'] })))
      : empty(arg === 'candidates' ? 'No other dealers' : 'No dealer is in Priority 200 yet', 'Set "Priority 200" to Yes on a dealer\'s page (Business details), or in the Excel file.')}</div>`;
};
EM.VIEWS.p200.title = () => 'Priority 200';

/* ---- Lists & stages: the operations stage sets and the rules */
const OPS_LIST_GROUP = () => ['Operations stages', 'The stages of the processing side. Any item can be locked or unlocked. ⚙ marks the stages that run the processing: unlock one to rename it (the processing follows the new name); they cannot be removed, and they keep their order.', Object.entries(OPS).map(([k, v]) => ['ops.' + k, v.label])];
EM.ACTIONS['rules-open'] = () => {
  const R = D.lists.rules, n = (id, label, v, unit) => `<div class="field"><label for="ru-${id}">${label}</label>${G.adorn(unit === '₹' ? { type: 'money', key: id } : { key: 'x' }, `<input class="input" type="number" min="0" step="any" id="ru-${id}" value="${v}">`).replace('class="suf">undefined<', `class="suf">${unit || ''}<`).replace('<span class="suf"></span>', '')}</div>`;
  EM.modal(`<h2>Rules and numbers</h2><p class="muted small">The numbers the processing uses. Changes apply from the next order, approval or score.</p>
    <div class="stack" style="margin-top:12px"><fieldset class="fs"><legend>Orders and production</legend><div class="fgrid">${n('gst', 'GST', R.gst_pct, '%')}${n('moq', 'Minimum production order', R.moq_boxes, 'boxes')}${n('round', 'Round production up to', R.production_round_boxes, 'boxes')}${n('eta', 'Production takes', R.production_eta_days, 'days')}${n('pay', 'An order is overdue after', R.payment_days, 'days')}${n('cset', 'Complaint settlements need approval from', R.complaint_settle_from, '₹')}</div></fieldset>
    <fieldset class="fs"><legend>Approval limits (the Owner has none)</legend>${table(['Approval', 'Regional manager / Project head', 'Head', 'Director'], Object.entries(R.approvals).map(([k, a]) => [esc(a.label) + ` <span class="muted">(${a.unit})</span>`, ...['manager', 'head', 'director'].map(l => `<input class="input" type="number" min="0" step="any" data-ap="${k}" data-lv="${l}" value="${a.levels[l]}" aria-label="${esc(a.label)} ${l}" style="max-width:140px">`)]))}</fieldset>
    <fieldset class="fs"><legend>Priority 200 levels (a dealer gets the first level whose score it reaches)</legend><div id="p2t" class="stack-s">${R.p200.tiers.map(t => `<div class="row p2t"><input class="input" data-t="name" value="${esc(t.name)}" style="max-width:180px" aria-label="Level name"><input class="input" type="number" min="0" max="100" data-t="min" value="${t.min}" style="max-width:120px" aria-label="From score"><button class="btn sm ghost" data-act="p2t-del">✕</button></div>`).join('')}</div><div class="row"><button class="btn sm" data-act="p2t-add">+ Level</button></div></fieldset>
    <fieldset class="fs"><legend>Priority 200 weights (they add up to 100)</legend><div class="fgrid">${Object.entries({ sales: 'Sales against target', breadth: 'Product breadth', payments: 'Payments on time', display: 'Showroom', activity: 'Activity in 90 days' }).map(([k, l]) => n('w-' + k, l, R.p200.weights[k], 'points')).join('')}</div></fieldset></div>
    ${errBox('ru-err')}<div class="row sticky-actions" style="margin-top:12px"><button class="btn primary" data-act="rules-save">Save</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['p2t-add'] = () => qs('#p2t').insertAdjacentHTML('beforeend', '<div class="row p2t"><input class="input" data-t="name" style="max-width:180px" aria-label="Level name"><input class="input" type="number" min="0" max="100" data-t="min" style="max-width:120px" aria-label="From score"><button class="btn sm ghost" data-act="p2t-del">✕</button></div>');
EM.ACTIONS['p2t-del'] = el => el.closest('.p2t').remove();
EM.ACTIONS['rules-save'] = async el => {
  const v = id => Number(qs('#ru-' + id).value), R = D.lists.rules;
  const rules = { ...R, gst_pct: v('gst'), moq_boxes: v('moq'), production_round_boxes: v('round'), production_eta_days: v('eta'), payment_days: v('pay'), complaint_settle_from: v('cset'),
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
const tplsHere = () => Object.values(TEMPLATES).filter(t => t.id === 'inv' ? STOCK_ROLES.includes(me().role) : canDiv(t.division));
const SHEET_NOTE = {
  dealers: 'Each dealer, distributor and sub-dealer company: where it is, the areas it covers, its rating, then the rest.',
  dealer_people: 'Everyone who works at those companies: role, what they handle, name, mobile, email.',
  architects: 'Each architect firm, or solo architect: where it is, its rating, then the rest.',
  architect_people: 'Everyone who works at those firms: role, what they handle, name, mobile, email.',
  clients: 'People with no company: individuals, or a firm on its own.',
  categories: 'Every kind of floor: LVT, SPC, Laminate, Engineered, Deck...',
  collections: 'Each collection with its category, box size (sq ft or m²) and specifications.',
  warehouses: 'Every warehouse: name, city, address.',
  stock: 'Every design, and how many boxes are in each warehouse today (one row per design per warehouse). Square feet are worked out in the sheet.',
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
  if (!isOwner()) return EM.noAccess('Only an Owner edits the lists and stages.');
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
  busy(el, true);
  try {
    const r = await API('POST', '/api/lists/' + encodeURIComponent(key), { items });
    D.lists = r.lists; EM.closeModal(); EM.toast(`<b>${esc(listLabel(key))} saved</b>${r.renamed ? `<ul><li>${r.renamed} renamed, ${r.records} record${r.records === 1 ? '' : 's'} updated</li></ul>` : ''}`);
    if (r.records) { const fresh = await API('GET', '/api/bootstrap'); window.EGOLIVE.refresh(fresh); } else EM.rerender();
  } catch (x) { busy(el, false); showErr('l-err', x.message); }
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
