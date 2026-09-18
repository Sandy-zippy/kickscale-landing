'use strict';
/* EGO Master — clickable architecture on sample data. Plain JS, no build step.
   data.js → window.EGO (ego/build_bundle.py). Every change is in memory; reload resets it.
   Files: app.js (shell, router, brand) · arch.js (map + component pages) · screens.js (integrations) · crm.js (leads, phone app, AI, tech)
   · division.js (users, roles, scope, homes, team) · dealers.js (vendors) · wholesale.js (orders, stock, production)
   · projects.js · installation.js · retail.js (clients, architect firms, screen → division map).
   URL options: #/route/arg  ?theme=light|dark */
const D = window.EGO;
const NOW = new Date(D.now);
const byId = a => Object.fromEntries(a.map(x => [x.id, x]));
const DL = byId(D.dealer), MK = byId(D.market), EMP = byId(D.employee), SKU = byId(D.sku), LEAD = byId(D.lead),
  PROJ = byId(D.project), ARCH = byId(D.architect), INST = byId(D.installer), CONN = byId(D.connection), STOCK = byId(D.stock);

const params = new URLSearchParams(location.search);
if (params.get('theme')) document.documentElement.dataset.theme = params.get('theme');

// ---------------------------------------------------------------- format
const TZ = { timeZone: 'Asia/Kolkata' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const inr = n => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${Math.round(n).toLocaleString('en-IN')}`;
const inrFull = n => `₹${Math.round(n).toLocaleString('en-IN')}`;
const numFmt = n => Math.round(n).toLocaleString('en-IN');
const dt = s => new Date(s);
const dFmt = s => dt(s).toLocaleDateString('en-IN', { ...TZ, day: 'numeric', month: 'short' });
const tFmt = s => dt(s).toLocaleTimeString('en-IN', { ...TZ, hour: 'numeric', minute: '2-digit' }).toLowerCase();
const ds = d => { if (!d) return '—'; const x = new Date(d.slice(0, 10) + 'T12:00:00+05:30'); return x.toLocaleDateString('en-IN', { ...TZ, day: 'numeric', month: 'short', ...(x.getFullYear() !== NOW.getFullYear() ? { year: 'numeric' } : {}) }); };
const ago = s => { const m = Math.round((NOW - dt(s)) / 6e4); return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const agoMin = m => m == null ? '—' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
const stamp = () => new Date(NOW.getTime() + (EM.tick++) * 60e3).toISOString();
const market = id => MK[id] ? `${MK[id].name}, ${MK[id].city}` : '';
const qs = s => document.querySelector(s);

// ---------------------------------------------------------------- brand
// EGO wordmark traced from egopremium.com's ego-logo.png (geometry in source pixels, 557 × 201)
const LOGO_PATH = 'M0 0H194V85H27V117H194V144H0Z M27 29V59H167V29Z M204 0H374V201H204V174H347V144H204Z M231 29V117H347V29Z M386 0H557V144H386Z M411 29V117H530V29Z';
const LOGO = (h = 28, tagline = false) => `<svg class="logo" viewBox="0 0 557 ${tagline ? 290 : 201}" height="${tagline ? Math.round(h * 290 / 201) : h}" role="img" aria-label="ego — Wood &amp; Vinyl Floor">
  <path d="${LOGO_PATH}" fill="#FB0B18" fill-rule="evenodd"/>${tagline ? '<text x="278" y="278" text-anchor="middle" fill="#FB0B18" style="font:600 64px Poppins,Jost,sans-serif">Wood &amp; Vinyl Floor</text>' : ''}</svg>`;
const thumb = (sku, cls = '') => sku && sku.photo ? `<img class="thumb ${cls}" src="${sku.photo}" alt="${esc(sku.collection + ' ' + sku.design)}" loading="lazy">` : `<span class="thumb ph ${cls}" aria-hidden="true">${esc((sku ? sku.category : '?').slice(0, 3))}</span>`;
// sidebar icons — 20px stroke glyphs, one per section (keys match EM.TABS + home)
const _i = d => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  home: _i('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
  map: _i('<circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="19" r="2.4"/><circle cx="19" cy="19" r="2.4"/><path d="M12 7.4v4.2M10.3 13.2 6.6 16.8M13.7 13.2l3.7 3.6"/>'),
  dealers: _i('<path d="m3.5 7.5 8.5-4 8.5 4v9l-8.5 4-8.5-4z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>'),
  projects: _i('<path d="m12 3 9 4.5-9 4.5-9-4.5z"/><path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>'),
  installation: _i('<path d="M3 17h11M3 17a3 3 0 0 0 6 0M14 17h2.5M14 17V7h3l3.5 4.5V17h-1.5M17 17a3 3 0 0 0 3 0"/>'),
  leads: _i('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M18 7v6M21 10h-6"/>'),
  integrations: _i('<path d="M9 3v6M15 3v6M7 9h10v3a5 5 0 0 1-10 0zM12 17v4"/>'),
  app: _i('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
  ai: _i('<path d="m12 3 1.9 4.9L19 9.8l-5.1 1.9L12 16.6l-1.9-4.9L5 9.8l5.1-1.9z"/><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
  tech: _i('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3"/>'),
  orders: _i('<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 8.5h6M9 12.5h6M9 16.5h4"/>'),
  stock: _i('<rect x="3" y="12.5" width="8" height="7.5" rx="1.6"/><rect x="13" y="12.5" width="8" height="7.5" rx="1.6"/><rect x="8" y="4" width="8" height="7.5" rx="1.6"/>'),
  production: _i('<path d="M3 20.5V10l5.5 3.2V10L14 13.2V10l5.5 3.2v7.3z"/><path d="M19.5 7.5v-4M10 17h4"/>'),
  champions: _i('<path d="M8 3.5h8V9a4 4 0 0 1-8 0z"/><path d="M8 5H5.5v1A3.2 3.2 0 0 0 8.6 9.2M16 5h2.5v1a3.2 3.2 0 0 1-3.1 3.2M10.2 13.2h3.6M9.5 20.5h5l-.8-3.4h-3.4z"/>'),
  complaints: _i('<path d="M20.5 12a8.5 8.5 0 1 1-3.7-7"/><path d="M12 7.5v5M12 16.2h.01"/>'),
  clients: _i('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16.2 5.3a3.2 3.2 0 0 1 0 5.4M18 19.5a5.6 5.6 0 0 0-2.2-4.4"/>'),
  firms: _i('<path d="M4 20.5V6.8l7-3.3v17M11 20.5h9v-9.2h-9"/><path d="M14.4 14.4h2.2M14.4 17.4h2.2M7 9.5h1M7 12.5h1M7 15.5h1"/>'),
  team: _i('<circle cx="12" cy="7" r="3"/><path d="M6.2 20a5.8 5.8 0 0 1 11.6 0"/><path d="M4.6 12.6a2.6 2.6 0 1 1 2.1-4.5M19.4 12.6a2.6 2.6 0 1 0-2.1-4.5"/>'),
  automations: _i('<path d="M13.2 2.8 5.4 13.1a.6.6 0 0 0 .5 1h4.4l-1.5 7.1 7.8-10.3a.6.6 0 0 0-.5-1h-4.4z"/>'),
};
const subnav = (items, cur) => `<nav class="subnav" aria-label="Section">${items.map(([k, l, h]) => `<a href="${h}" class="${k === cur ? 'on' : ''}">${l}</a>`).join('')}</nav>`;
const subtabs = (base, cur, items) => `<nav class="subtabs" aria-label="Tabs">${items.map(([k, l]) => `<a href="${base}/${k}" class="${k === cur ? 'on' : ''}" aria-current="${k === cur ? 'page' : 'false'}">${l}</a>`).join('')}</nav>`;

// ---------------------------------------------------------------- app
const EM = {
  tick: 1, VIEWS: {}, ACTIONS: {},
  TABS: [['map', 'System map'], ['dealers', 'Dealers'], ['projects', 'Projects'], ['installation', 'Installation'], ['leads', 'Leads'], ['integrations', 'Integrations'], ['app', 'Phone app'], ['ai', 'AI Analysis'], ['tech', 'Tech & ops']],
  route() { const [r = 'home', ...rest] = location.hash.replace(/^#\/?/, '').split('/'); return { r, arg: rest.join('/') }; },
  start() {
    addEventListener('hashchange', () => EM.render());
    document.addEventListener('click', e => {
      const el = e.target.closest('[data-act]');
      if (el && EM.ACTIONS[el.dataset.act]) { e.preventDefault(); EM.ACTIONS[el.dataset.act](el, e); }
      const row = !el && e.target.closest('[data-href]');
      if (row) location.hash = row.dataset.href;
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') EM.closeModal();
      const n = e.target.closest && e.target.closest('[data-href]');
      if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); location.hash = n.dataset.href; }
    });
    EM.render();
  },
  render() {
    const { r, arg } = EM.route();
    const view = EM.VIEWS[r] || EM.VIEWS.home;
    const tab = view.tab || r;
    // division: follow the screen you opened (if you may see it); block what your role may not see
    let body;
    if (view.div && !canDiv(view.div)) body = EM.noAccess(`This screen belongs to ${DIVS[view.div].name} (${DIVS[view.div].co}).`);
    else if (!allowedTab(tab)) body = EM.noAccess('This area is not part of your role.');
    else { if (view.div && EM.div !== view.div) EM.div = view.div; body = view(arg); }
    const nav = EM.navTabs();
    const link = ([k, l]) => `<a href="#/${k}" class="${k === tab ? 'on' : ''}">${l}</a>`;
    const items = [...nav.main, ...nav.shared];
    const card = ([k, l]) => `<a href="#/${k}" class="navcard ${k === tab ? 'on' : ''}" aria-current="${k === tab ? 'page' : 'false'}">${ICON[k] || ICON.home}<span>${l}</span></a>`;
    const active = items.find(([k]) => k === tab), rest = items.filter(([k]) => k !== tab);
    qs('#side').innerHTML = `
      <a class="brand" href="#/home" aria-label="EGO Master home">${LOGO(24)}<span class="brand-name">Master</span></a>
      <div class="side-user">
        <span class="avatar">${esc((me().name || '?').split(' ').map(w => w[0]).slice(0, 2).join(''))}</span>
        <span class="grow"><b>${esc(me().name)}</b><span class="small muted">${esc(acc().name)}</span></span>
      </div>
      ${EM.topExtras()}
      <nav class="sidenav" aria-label="Sections">
        ${active ? card(active) : ''}
        <div class="navgrid">${rest.map(card).join('')}</div>
      </nav>
      <div class="side-note"><span class="dot"></span>Sample data — every name and number here is invented.</div>`;
    qs('#top').innerHTML = `<div class="tb">
      <span class="grow"></span>
      <span class="pill" title="All names and numbers are sample data">● Sample data</span>
      <button class="iconbtn" data-act="theme" aria-label="Switch light / dark">◐</button></div>`;
    qs('#view').innerHTML = body;
    document.title = (view.title ? view.title(arg) + ' · ' : '') + 'EGO Master';
    if (view.after) view.after(arg);
    const on = qs('.tabs a.on'); if (on) { const nav = on.parentNode; if (on.offsetLeft + on.offsetWidth > nav.scrollLeft + nav.clientWidth || on.offsetLeft < nav.scrollLeft) nav.scrollLeft = on.offsetLeft - 16; }
    if (!EM.keepScroll) scrollTo(0, 0);
    EM.keepScroll = false;
  },
  rerender() { EM.keepScroll = true; EM.render(); },
  toast(html, ms = 4200) {
    const t = qs('#toast'); t.innerHTML = html; t.classList.add('on');
    clearTimeout(EM._t); EM._t = setTimeout(() => t.classList.remove('on'), ms);
  },
  modal(html) { const o = qs('#overlay'); o.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`; o.classList.add('on'); },
  closeModal() { qs('#overlay').classList.remove('on'); },
};
EM.ACTIONS.theme = () => {
  const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = cur === 'dark' ? 'light' : 'dark';
};
EM.ACTIONS['close-modal'] = () => EM.closeModal();
qs('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') EM.closeModal(); });

// shared UI bits
const STATUS = {
  verified: ['ok', 'API verified'], docs: ['warn', 'Needs vendor docs'], input: ['info', 'Needs EGO input / access'],
  build: ['plain', 'We build it'], review: ['warn', 'Needs platform approval'], p2: ['plain', 'Phase 2'],
};
const statusBadge = k => `<span class="badge ${STATUS[k][0]}">${STATUS[k][1]}</span>`;
const CONN_STATE = {
  connected: ['ok', 'Connected'], pending_docs: ['warn', 'Waiting for vendor API docs'], review: ['warn', 'In Google review'],
  waiting: ['warn', 'Waiting for JustDial to register webhook'], testing: ['info', 'Testing'], failed: ['bad', 'Failed'], off: ['plain', 'Not connected'],
};
const connBadge = s => `<span class="badge ${CONN_STATE[s][0]}">${CONN_STATE[s][1]}</span>`;
const crumbs = (...parts) => `<div class="crumbs">${parts.map(([l, h]) => h ? `<a href="${h}">${esc(l)}</a>` : esc(l)).join(' › ')}</div>`;
const table = (head, rows, opts = {}) => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th class="${/^(₹|#|Qty|Rate|Amount|Value|Sales|GP|Leads|Won|Spend|Outstanding|Overdue|Days)/.test(h) ? 'r' : ''}">${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr${r.href ? ` class="clickable" data-href="${r.href}" tabindex="0"` : ''}>${(r.cells || r).map((c, i) => `<td class="${/^(₹|#|Qty|Rate|Amount|Value|Sales|GP|Leads|Won|Spend|Outstanding|Overdue|Days)/.test(head[i]) ? 'r' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const kv = pairs => `<dl class="kv">${pairs.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
window.EM = EM;
