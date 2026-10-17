'use strict';
/* EGO Master: the DEALER PORTAL (13 Oct 2026, batch 4). Loaded instead of the team's app when a dealer signs in.
   Phone first and simple: Home (at most 4 numbers), Orders (with their PI, invoices and payment proofs), Leads
   (the dealer moves each on), Schemes, Requests (an order request or a complaint). Everything here comes from
   /api/bootstrap and /api/portal/*, which the server keys on this login's one dealer; nothing about any other
   dealer is ever sent. */
(function () {
  const API = window.EGOAPI.api;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const qs = s => document.querySelector(s);
  let B = null, root = null;
  const S = { f: {}, hist: null };
  const inr = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  const num = n => Number(n || 0).toLocaleString('en-IN');
  const dayOf = ts => { if (!ts) return ''; const s = String(ts); if (/^\d{4}-\d\d-\d\d$/.test(s)) return s; const ms = Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(s) ? s : s.replace(' ', 'T') + 'Z'); return isNaN(ms) ? '' : new Date(ms + 5.5 * 36e5).toISOString().slice(0, 10); };
  const today = () => new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ds = d => { d = dayOf(d); return d ? `${+d.slice(8, 10)} ${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : ''; };
  const msOf = ts => Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(String(ts)) ? String(ts) : String(ts).replace(' ', 'T') + 'Z');
  const ageDays = ts => ts ? Math.max(0, Math.floor((Date.now() - msOf(ts)) / 864e5)) : 0;
  const LAST = () => (B.lists.fulfilment_stages || []).slice(-1)[0];
  const due = o => Math.max(0, (Number(o.total) || 0) - (Number(o.paid) || 0));
  /* the won and lost stages of EGO's Retail pipeline, by whatever name the Owner gave them (R3a) */
  const WON = () => (B.lists.lead_won || 'Won'), LOST = () => (B.lists.lead_lost || 'Lost'), closedL = l => [WON(), LOST()].includes(l.status);
  const openLeads = () => B.leads.filter(l => !closedL(l));
  const toast = h => { const t = qs('#toast'); if (!t) return; t.innerHTML = h; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3500); };
  const unread = () => B.notifications.filter(n => !B.seen_at || n.created_at > B.seen_at).length;

  /* ---- filters: search, status, dates with Custom, and a download, on every list */
  const PERIODS = [['all', 'All time'], ['month', 'This month'], ['last', 'Last month'], ['year', 'This financial year'], ['custom', 'Custom dates']];
  const F = k => (S.f[k] = S.f[k] || { q: '', st: '', period: 'all', from: '', to: '' });
  function inPeriod(d, f) {
    d = dayOf(d); if (f.period === 'all') return true; if (!d) return false;
    const t = today(), ym = t.slice(0, 7), y = +t.slice(0, 4), m = +t.slice(5, 7), fy = m >= 4 ? y : y - 1, prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
    if (f.period === 'month') return d.slice(0, 7) === ym; if (f.period === 'last') return d.slice(0, 7) === prev;
    if (f.period === 'year') return d >= `${fy}-04-01` && d <= `${fy + 1}-03-31`;
    return (!f.from || d >= f.from) && (!f.to || d <= f.to);
  }
  const has = (f, txt) => !f.q || txt.toLowerCase().includes(f.q.toLowerCase());
  const filterBar = (k, statuses, dateLabel) => { const f = F(k);
    return `<div class="pt-filters" data-pf="${k}"><input class="input" data-pk="q" value="${esc(f.q)}" placeholder="Search" aria-label="Search">
      ${statuses ? `<select class="input" data-pk="st" aria-label="Status"><option value="">Every status</option>${statuses.map(s => `<option ${f.st === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>` : ''}
      <select class="input" data-pk="period" aria-label="${esc(dateLabel)}">${PERIODS.map(([v, l]) => `<option value="${v}" ${f.period === v ? 'selected' : ''}>${esc(dateLabel)}: ${esc(l)}</option>`).join('')}</select>
      ${f.period === 'custom' ? `<input class="input" type="date" data-pk="from" value="${esc(f.from)}" aria-label="From date"><input class="input" type="date" data-pk="to" value="${esc(f.to)}" aria-label="To date">` : ''}
      <button class="btn sm ghost" data-pa="csv" data-k="${k}">Download for Excel</button></div>`; };
  function csv(name, head, rows) {
    const cell = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`, text = '﻿' + [head, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
    const u = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
    a.href = u; a.download = `${name} ${today()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000);
  }

  /* ---- the lists, filtered */
  const L = {
    orders: () => { const f = F('orders'); return B.orders.filter(o => (!f.st || o.ful_stage === f.st) && inPeriod(o.created_at, f) && has(f, `${o.ref} ${o.ful_stage} ${B.lines.filter(l => l.order_id === o.id).map(l => l.product).join(' ')}`)); },
    files: () => { const f = F('files'); return B.documents.filter(d => (!f.st || d.type === f.st) && inPeriod(d.doc_date || d.created_at, f) && has(f, `${d.name} ${d.doc_no} ${(B.orders.find(o => o.id === d.order_id) || {}).ref || ''}`)); },
    leads: () => { const f = F('leads'); return B.leads.filter(l => (!f.st || l.status === f.st) && inPeriod(l.handed_at, f) && has(f, `${l.ref} ${l.name} ${l.mobile} ${l.city} ${l.area} ${l.notes}`)); },
    schemes: () => { const f = F('schemes'); return B.schemes.filter(sc => (!f.st || schState(sc) === f.st) && inPeriod(sc.start_on, f) && has(f, `${sc.name} ${sc.reward}`)); },
    requests: () => { const f = F('requests'); return [...B.requests.map(r => ({ k: 'Order request', ref: r.ref, title: r.request || r.title, status: r.stage, at: r.created_at })), ...B.complaints.map(c => ({ k: 'Complaint', ref: c.ref, title: `${c.type}: ${c.description || ''}`, status: c.status, at: c.created_at, resolution: c.resolution }))]
      .filter(x => (!f.st || x.k === f.st) && inPeriod(x.at, f) && has(f, `${x.ref} ${x.title} ${x.status}`)).sort((a, b) => String(b.at).localeCompare(String(a.at))); },
    history: () => { const f = F('history'); return (S.hist || []).filter(h => (!f.st || histKind(h) === f.st) && inPeriod(h.at, f) && has(f, h.summary)); },
  };
  const schState = sc => sc.settled || sc.status === 'Settled' ? 'Settled' : today() < sc.start_on ? 'Starting soon' : today() > sc.end_on ? 'Ended' : 'Running';
  const histKind = h => h.action.startsWith('lead') ? 'Leads' : h.action === 'portal_password_own' ? 'Your account' : 'Requests and complaints';

  /* ---- screens */
  const tile = (label, value, sub, href) => `<a class="card pt-tile" href="${href}"><span class="small muted">${esc(label)}</span><b class="num">${value}</b>${sub ? `<span class="small muted">${sub}</span>` : ''}</a>`;
  const head = (title, sub, extra = '') => `<div class="pt-head"><div><h1>${esc(title)}</h1>${sub ? `<p class="small muted">${sub}</p>` : ''}</div><div class="row" style="gap:6px">${extra}<a class="btn sm ghost" href="#/history" data-hist-open>History</a></div></div>`;
  const empty = (t, b) => `<div class="card empty stack-s"><h3>${esc(t)}</h3><p class="muted small">${b}</p></div>`;
  const leadBadge = l => `<span class="badge ${l.status === WON() ? 'ok' : l.status === LOST() ? 'bad' : 'info'}">${esc(l.status)}</span>`;
  const leadCard = l => `<div class="card pt-item" data-lead="${l.id}"><div class="row between"><b>${esc(l.name)}</b>${leadBadge(l)}</div>
    <div class="small">${l.mobile ? `<a href="tel:${esc(l.mobile)}">${esc(l.mobile)}</a> · ` : ''}${esc(l.city)}${l.area ? ', ' + esc(l.area) : ''}</div>
    ${(l.need || []).length ? `<div class="small">${esc(l.need.join(', '))}${l.sqft ? ` · ${num(l.sqft)} sq ft` : ''}</div>` : ''}${l.notes ? `<div class="small muted">${esc(l.notes)}</div>` : ''}
    <div class="small muted">${esc(l.ref)} · from EGO on ${ds(l.handed_at)} · ${closedL(l) ? (l.status === LOST() && l.lost_reason ? esc(l.lost_reason) : '') : `${ageDays(l.status_at)} day${ageDays(l.status_at) === 1 ? '' : 's'} since the last update`}</div>
    ${closedL(l) ? '' : `<button class="btn sm primary" data-pa="lead" data-id="${l.id}">Update</button>`}</div>`;
  const stageLine = o => { const FS = B.lists.fulfilment_stages || [], i = FS.indexOf(o.ful_stage); return `<div class="pt-steps" aria-label="Stage ${i + 1} of ${FS.length}">${FS.map((s, j) => `<span class="${j < i ? 'done' : j === i ? 'cur' : ''}" title="${esc(s)}"></span>`).join('')}</div><div class="small"><b>${esc(o.ful_stage || 'Confirmed')}</b> <span class="muted">· step ${Math.max(1, i + 1)} of ${FS.length}</span></div>`; };
  const fileRow = d => `<div class="pt-file"><div><b>${esc(d.type)}</b> ${esc(d.doc_no || '')}<div class="small muted">${esc(d.name)}${d.doc_date ? ' · ' + ds(d.doc_date) : ''}${d.amount != null ? ' · ' + inr(d.amount) : ''}</div></div>
    <div class="row" style="gap:6px;flex-wrap:nowrap" data-file-acts><button class="btn sm" data-pa="view" data-id="${d.id}">View</button><button class="btn sm ghost" data-pa="dl" data-id="${d.id}">Download</button><button class="btn sm ghost" data-pa="share" data-id="${d.id}">Share</button></div></div>`;
  const orderCard = o => { const ls = B.lines.filter(l => l.order_id === o.id), fs = B.documents.filter(d => d.order_id === o.id);
    return `<div class="card pt-item" data-order="${o.id}"><div class="row between"><b>${esc(o.ref)}</b><span class="small muted">${ds(o.created_at)}</span></div>${stageLine(o)}
      ${ls.map(l => `<div class="small" data-p-line><b>${esc(l.product || 'Design')}</b>${l.code ? ' (' + esc(l.code) + ')' : ''}: <span data-p-boxes="${Number(l.boxes) || 0}">${esc(qtyText(l))}</span> · rate ${inr(l.rate)} / ${rateUnit(l)} · <span data-p-amt="${Number(l.amount) || 0}">${inr(l.amount)}</span> before GST</div>`).join('')}
      <div class="small">Total ${inr(o.total)} · paid ${inr(o.paid)}${due(o) > 0.5 ? ` · <b>due ${inr(due(o))}</b>` : ''}${o.invoiced_at ? ` · invoiced ${ds(o.invoiced_at)}` : ''}</div>
      ${fs.length ? fs.map(fileRow).join('') : '<p class="small muted">No PI or invoice on this order yet.</p>'}</div>`; };
  const planCard = p => { const bar = (got, want) => want ? `<div class="pt-bar"><span style="width:${Math.min(100, Math.round(got / want * 100))}%"></span></div>` : '';
    return `<div class="card stack-s" data-plan-progress><h3>${esc(p.title)}</h3><p class="small muted">${ds(p.start_on)} to ${ds(p.end_on)} · counted from orders invoiced in these dates</p>
      ${p.goal_value ? `<div class="small">Purchases before GST: <b>${inr(p.value)}</b> of ${inr(p.goal_value)}</div>${bar(p.value, p.goal_value)}` : ''}
      ${p.goal_boxes ? `<div class="small">Boxes: <b>${num(p.boxes)}</b> of ${num(p.goal_boxes)}</div>${bar(p.boxes, p.goal_boxes)}` : ''}
      ${p.goal_cats.length ? `<div class="small">New categories: <b>${p.cats_hit.length}</b> of ${p.goal_cats.length} (${p.goal_cats.map(c => p.cats_hit.includes(c) ? `<b>${esc(c)}</b>` : esc(c)).join(', ')})</div>` : ''}
      ${p.goal_display ? `<div class="small">Display: ${esc(p.goal_display)}</div>` : ''}${p.goal_training ? `<div class="small">Training: ${esc(p.goal_training)}</div>` : ''}</div>`; };
  const V = {
    home() {
      const open = B.orders.filter(o => o.ful_stage !== LAST()), owed = B.orders.filter(o => o.invoiced_at && due(o) > 0.5), run = B.schemes.filter(sc => schState(sc) === 'Running'), best = run.slice().sort((a, b) => b.pct - a.pct)[0], c = B.dealer.contact;
      return `<div class="stack"><div class="pt-head"><div><h1>Hello, ${esc(B.user.name.split(' ')[0])}</h1><p class="small muted">${esc(B.dealer.name)} · ${esc(B.dealer.city || '')}</p></div></div>
        <div class="pt-tiles">${tile('Orders on the way', num(open.length), open.length ? 'tap to see where each is' : 'nothing open', '#/orders')}${tile('To pay', inr(owed.reduce((a, o) => a + due(o), 0)), `${num(owed.length)} invoice${owed.length === 1 ? '' : 's'}`, '#/orders')}${tile('Leads to call', num(openLeads().length), 'from EGO, update each one', '#/leads')}${tile('Scheme progress', best ? best.pct + '%' : num(run.length), best ? esc(best.name) : 'no scheme running', '#/schemes')}</div>
        ${openLeads().length ? `<section class="stack-s"><h3>Leads waiting for you</h3>${openLeads().slice(0, 3).map(leadCard).join('')}${openLeads().length > 3 ? `<a class="small" href="#/leads">${openLeads().length - 3} more</a>` : ''}</section>` : ''}
        ${B.plans.map(planCard).join('')}
        <div class="pt-actions"><button class="btn primary" data-pa="request">Raise an order request</button><button class="btn" data-pa="complaint">Raise a complaint</button></div>
        ${c ? `<div class="card stack-s"><h3>Your contact at EGO Premium</h3><p><b>${esc(c.name)}</b>${c.mobile ? ` · <a href="tel:${esc(c.mobile)}">${esc(c.mobile)}</a>` : ''}</p></div>` : ''}</div>`;
    },
    orders(arg) {
      const tabs = `<nav class="subtabs" aria-label="Tabs"><a href="#/orders" ${arg === 'files' ? '' : 'class="on" aria-current="page"'}>Orders (${B.orders.length})</a><a href="#/orders/files" ${arg === 'files' ? 'class="on" aria-current="page"' : ''}>PI, invoices and payment proofs (${B.documents.length})</a></nav>`;
      if (arg === 'files') { const ds2 = L.files(); return `<div class="stack">${head('Your orders', 'Every PI, invoice and payment proof EGO has added to your orders.')}${tabs}${filterBar('files', [...new Set(B.documents.map(d => d.type))], 'Date')}
        ${ds2.length ? ds2.map(d => `<div class="card pt-item">${fileRow(d)}<div class="small muted">On order ${esc((B.orders.find(o => o.id === d.order_id) || {}).ref || '')}</div></div>`).join('') : empty(B.documents.length ? 'Nothing for this filter' : 'No files yet', 'When EGO adds a PI, an invoice or a payment proof to one of your orders, it is here to view, download and share.')}</div>`; }
      const os = L.orders();
      return `<div class="stack">${head('Your orders', 'Where each order is, what it holds, and what is still to pay.')}${tabs}${filterBar('orders', B.lists.fulfilment_stages, 'Ordered')}
        ${os.length ? os.map(orderCard).join('') : empty(B.orders.length ? 'Nothing for this filter' : 'No orders yet', 'Orders confirmed with EGO Premium appear here, with where each one is.')}</div>`;
    },
    leads() {
      const ls = L.leads();
      return `<div class="stack">${head('Leads from EGO', 'Customers near you who asked EGO about flooring. Call them, then press Update so EGO knows where each has got to.')}${filterBar('leads', B.lists.lead_statuses, 'Given')}
        ${ls.length ? ls.map(leadCard).join('') : empty(B.leads.length ? 'Nothing for this filter' : 'No leads yet', 'When EGO passes you an enquiry, it appears here and in the bell.')}</div>`;
    },
    schemes() {
      const ss = L.schemes();
      return `<div class="stack">${head('Your schemes', 'Each scheme counts your orders invoiced in its dates, before GST.')}${filterBar('schemes', ['Running', 'Starting soon', 'Ended', 'Settled'], 'Starts')}
        ${ss.length ? ss.map(sc => `<div class="card pt-item"><div class="row between"><b>${esc(sc.name)}</b><span class="badge ${schState(sc) === 'Running' ? 'info' : 'plain'}">${esc(schState(sc))}</span></div><div class="small muted">${ds(sc.start_on)} to ${ds(sc.end_on)}${sc.reward ? ' · reward: ' + esc(sc.reward) : ''}</div>
          <div class="small">${inr(sc.achieved)} of ${inr(sc.target)} · <b>${sc.pct}%</b></div><div class="pt-bar"><span style="width:${Math.min(100, sc.pct)}%"></span></div></div>`).join('') : empty(B.schemes.length ? 'Nothing for this filter' : 'No scheme yet', 'Schemes EGO Premium runs for you appear here with how far you have got.')}</div>`;
    },
    requests() {
      const rs = L.requests();
      return `<div class="stack">${head('Requests and complaints', 'Order requests go to your EGO contact as a new opportunity; complaints go to EGO\'s complaints desk.', '<button class="btn sm primary" data-pa="request">Order request</button><button class="btn sm" data-pa="complaint">Complaint</button>')}${filterBar('requests', ['Order request', 'Complaint'], 'Raised')}
        ${rs.length ? rs.map(x => `<div class="card pt-item"><div class="row between"><b>${esc(x.k)} ${esc(x.ref)}</b><span class="badge info">${esc(x.status)}</span></div><div class="small">${esc(x.title)}</div>${x.resolution ? `<div class="small muted">Resolution: ${esc(x.resolution)}</div>` : ''}<div class="small muted">${ds(x.at)}</div></div>`).join('') : empty(B.requests.length + B.complaints.length ? 'Nothing for this filter' : 'Nothing raised yet', 'Raise an order request or a complaint with the buttons above.')}</div>`;
    },
    history() {
      if (!S.hist) { API('GET', '/api/portal/history').then(r => { S.hist = r.history; render(); }).catch(e => toast(esc(e.message))); return '<p class="muted">Loading the history…</p>'; }
      const hs = L.history();
      return `<div class="stack"><div class="pt-head"><div><h1>History</h1><p class="small muted">What happened on your leads, requests, complaints and account, and when.</p></div></div>${filterBar('history', ['Leads', 'Requests and complaints', 'Your account'], 'When')}
        ${hs.length ? hs.map(h => `<div class="card pt-item"><div class="small muted">${ds(h.at)} ${new Date(msOf(h.at)).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</div><div class="small">${esc(h.summary)}</div></div>`).join('') : empty('Nothing yet', 'Updates to your leads, and the requests and complaints you raise, are listed here.')}</div>`;
    },
    bell() {
      if (unread()) API('POST', '/api/portal/seen', {}).then(() => { B.seen_at = new Date().toISOString(); paintTop(); }).catch(() => {});
      return `<div class="stack"><div class="pt-head"><div><h1>Notifications</h1></div></div>${B.notifications.length ? B.notifications.map(n => `<a class="card pt-item${!B.seen_at || n.created_at > B.seen_at ? ' is-new' : ''}" href="${esc(n.link && n.link.startsWith('#/') ? n.link : '#/home')}"><b>${esc(n.title)}</b><div class="small">${esc(n.body)}</div><div class="small muted">${ds(n.created_at)}</div></a>`).join('') : empty('Nothing yet', 'New leads from EGO and other news for you appear here.')}</div>`;
    },
  };
  const NAV = [['home', 'Home'], ['orders', 'Orders'], ['leads', 'Leads'], ['schemes', 'Schemes'], ['requests', 'Requests']];
  const route = () => { const [, r = 'home', arg = ''] = (location.hash || '#/home').split('/'); return { r: V[r] ? r : 'home', arg }; };
  function paintTop() {
    qs('#pt-top').innerHTML = `<div class="row" style="gap:8px;min-width:0"><svg viewBox="0 0 557 201" height="22" role="img" aria-label="EGO"><path d="M0 0H194V85H27V117H194V144H0Z M27 29V59H167V29Z M204 0H374V201H204V174H347V144H204Z M231 29V117H347V29Z M386 0H557V144H386Z M411 29V117H530V29Z" fill="#FB0B18" fill-rule="evenodd"/></svg><b class="pt-name">${esc(B.dealer.name)}</b></div>
      <div class="row" style="gap:6px"><a class="btn sm ghost pt-bell" href="#/bell" aria-label="Notifications">Bell${unread() ? ` <span class="badge bad">${unread()}</span>` : ''}</a><button class="btn sm ghost" data-pa="out">Sign out</button></div>`;
  }
  function render() {
    const { r, arg } = route();
    paintTop();
    qs('#pt-view').innerHTML = V[r](arg);
    qs('#pt-nav').innerHTML = NAV.map(([k, l]) => `<a href="#/${k}" ${k === r ? 'aria-current="page" class="on"' : ''}>${esc(l)}${k === 'leads' && openLeads().length ? ` <span class="badge info">${openLeads().length}</span>` : ''}</a>`).join('');
  }

  /* ---- modals */
  function modal(html) { const o = qs('#overlay'); o.innerHTML = `<div class="modal pt-modal" role="dialog" aria-modal="true">${html}</div>`; o.classList.add('on'); }
  const closeModal = () => { const o = qs('#overlay'); o.classList.remove('on'); o.innerHTML = ''; };
  const err = (id, e) => { const el = qs('#' + id); if (el) el.textContent = (e.errors && e.errors.length ? e.errors.join('. ') : e.message) || 'Something went wrong.'; };
  const sel = (id, label, opts, req) => `<div class="field"><label for="${id}">${esc(label)}${req ? ' *' : ''}</label><select class="input" id="${id}"><option value="">Choose</option>${opts.map(o => `<option>${esc(o)}</option>`).join('')}</select></div>`;
  const send = async (btn, path, body, ok, errId) => { btn.disabled = true; try { B = await API('POST', path, body); S.hist = null; closeModal(); toast(ok); render(); } catch (e) { btn.disabled = false; err(errId, e); } };
  const tok = () => { try { return localStorage.getItem('ego-live-token') || ''; } catch (e) { return window.__egoTok || ''; } };
  const A = {
    out: () => window.EGOAPI.signOut(),
    close: closeModal,
    csv: el => { const k = el.dataset.k;
      if (k === 'orders') csv('EGO my orders', ['Order', 'Ordered on', 'Where it is', 'Total (Rs)', 'Paid (Rs)', 'Due (Rs)', 'Invoiced on'], L.orders().map(o => [o.ref, dayOf(o.created_at), o.ful_stage, o.total, o.paid, due(o), dayOf(o.invoiced_at)]));
      if (k === 'files') csv('EGO my PI and invoices', ['What', 'Number', 'Date', 'Amount (Rs)', 'Order', 'File'], L.files().map(d => [d.type, d.doc_no, d.doc_date, d.amount ?? '', (B.orders.find(o => o.id === d.order_id) || {}).ref || '', d.name]));
      if (k === 'leads') csv('EGO my leads', ['Number', 'Given on', 'Name', 'Mobile', 'City', 'Area', 'Wants', 'Status', 'Lost reason', 'Last update'], L.leads().map(l => [l.ref, dayOf(l.handed_at), l.name, l.mobile, l.city, l.area, (l.need || []).join(', '), l.status, l.lost_reason, dayOf(l.status_at)]));
      if (k === 'schemes') csv('EGO my schemes', ['Scheme', 'From', 'To', 'Target (Rs)', 'Done (Rs)', '%', 'Reward', 'Status'], L.schemes().map(sc => [sc.name, sc.start_on, sc.end_on, sc.target, sc.achieved, sc.pct, sc.reward, schState(sc)]));
      if (k === 'requests') csv('EGO my requests', ['Kind', 'Number', 'What', 'Status', 'Raised on'], L.requests().map(x => [x.k, x.ref, x.title, x.status, dayOf(x.at)]));
      if (k === 'history') csv('EGO my history', ['When', 'What'], L.history().map(h => [h.at, h.summary]));
    },
    lead: el => { const l = B.leads.find(x => x.id === el.dataset.id);
      modal(`<h2>${esc(l.name)}</h2><p class="small muted">${esc(l.ref)} · now ${esc(l.status)}</p><form class="stack" onsubmit="return false">
        <div class="field"><label for="pl-st">Where it has got to *</label><select class="input" id="pl-st">${B.lists.lead_statuses.map(s => `<option ${s === l.status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
        <div id="pl-lost" hidden>${sel('pl-why', 'Why it was lost', B.lists.lost_reasons, true)}</div>
        <div class="field" id="pl-won" hidden><label for="pl-val">Sale value in ₹ (optional)</label><input class="input" id="pl-val" type="number" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="pl-note">Note (optional)</label><input class="input" id="pl-note" maxlength="500" placeholder="e.g. Visited, sent a quote for SPC"></div>
        <div class="small err" id="pl-err" role="alert"></div><div class="row"><button class="btn primary" data-pa="lead-go" data-id="${l.id}">Save</button><button class="btn" data-pa="close">Cancel</button></div></form>`);
      qs('#pl-st').addEventListener('change', e => { qs('#pl-lost').hidden = e.target.value !== LOST(); qs('#pl-won').hidden = e.target.value !== WON(); }); },
    'lead-go': el => send(el, '/api/portal/leads/' + el.dataset.id, { status: qs('#pl-st').value, lost_reason: qs('#pl-why').value, won_value: qs('#pl-val').value, note: qs('#pl-note').value }, '<b>Saved.</b> EGO can see it.', 'pl-err'),
    request: () => modal(`<h2>Order request</h2><p class="small muted">It goes to ${esc((B.dealer.contact || {}).name || 'your EGO contact')}, who confirms the designs, rates and dates with you.</p><form class="stack" onsubmit="return false">
      <div class="field"><label for="pr-what">What you would like to order *</label><textarea class="input" id="pr-what" rows="3" maxlength="500" placeholder="e.g. Oak SPC 6 mm, 120 boxes, for a villa in Baner"></textarea></div>
      <fieldset class="fs"><legend>Categories (optional)</legend><div class="pt-checks">${B.lists.categories.map(c => `<label class="small"><input type="checkbox" name="pr-cat" value="${esc(c)}"> ${esc(c)}</label>`).join('')}</div></fieldset>
      <div class="field"><label for="pr-boxes">Boxes (optional)</label><input class="input" id="pr-boxes" type="number" min="0" step="1" inputmode="numeric"></div>
      <div class="field"><label for="pr-by">Needed by (optional)</label><input class="input" id="pr-by" type="date"></div>
      <div class="small err" id="pr-err" role="alert"></div><div class="row"><button class="btn primary" data-pa="request-go">Send</button><button class="btn" data-pa="close">Cancel</button></div></form>`),
    'request-go': el => send(el, '/api/portal/requests', { what: qs('#pr-what').value, categories: [...document.querySelectorAll('input[name="pr-cat"]:checked')].map(x => x.value), boxes: qs('#pr-boxes').value, need_by: qs('#pr-by').value }, '<b>Order request sent.</b> Your EGO contact has it.', 'pr-err'),
    complaint: () => modal(`<h2>Complaint</h2><p class="small muted">It goes to EGO's complaints desk and to your EGO contact.</p><form class="stack" onsubmit="return false">
      ${sel('pc-type', 'What it is about', B.lists.complaint_types, true)}${sel('pc-sev', 'How serious', B.lists.severities, true)}
      <div class="field"><label for="pc-order">Order (optional)</label><select class="input" id="pc-order"><option value="">Not about one order</option>${B.orders.map(o => `<option value="${o.id}">${esc(o.ref)} · ${ds(o.created_at)}</option>`).join('')}</select></div>
      <div class="field"><label for="pc-desc">What happened *</label><textarea class="input" id="pc-desc" rows="3" maxlength="2000"></textarea></div>
      <div class="small err" id="pc-err" role="alert"></div><div class="row"><button class="btn primary" data-pa="complaint-go">Send</button><button class="btn" data-pa="close">Cancel</button></div></form>`),
    'complaint-go': el => send(el, '/api/portal/complaints', { type: qs('#pc-type').value, severity: qs('#pc-sev').value, order_id: qs('#pc-order').value, description: qs('#pc-desc').value }, '<b>Complaint sent.</b> EGO\'s complaints desk has it.', 'pc-err'),
    /* a file: View opens it in the browser (a link good for a day), Download saves it with its name, Share sends a 7-day link */
    view: async el => { const w = window.open('', '_blank'); try { const r = await API('POST', `/api/portal/files/${el.dataset.id}/share`, { view: true }); if (w) w.location = r.url; else location.href = r.url; } catch (e) { if (w) w.close(); toast(esc(e.message)); } },
    dl: async el => { const d = B.documents.find(x => x.id === el.dataset.id);
      try { const res = await fetch(`${window.EGOAPI.base}/api/portal/files/${d.id}?dl=1`, { headers: { authorization: 'Bearer ' + tok() } }); if (!res.ok) throw new Error('The file could not be downloaded.');
        const u = URL.createObjectURL(await res.blob()), a = document.createElement('a'); a.href = u; a.download = d.file_name || d.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000); } catch (e) { toast(esc(e.message)); } },
    share: el => { const d = B.documents.find(x => x.id === el.dataset.id);
      modal(`<h2>Share ${esc(d.type)} ${esc(d.doc_no || '')}</h2><p class="small muted">Anyone with the link can open this file until it expires.</p><div class="field"><label for="ps-days">Link works for</label><select class="input" id="ps-days">${[1, 3, 7, 14, 30].map(n => `<option value="${n}" ${n === 7 ? 'selected' : ''}>${n} day${n === 1 ? '' : 's'}</option>`).join('')}</select></div>
        <div class="row"><button class="btn primary" data-pa="share-go" data-id="${d.id}">Make the link</button><button class="btn" data-pa="close">Close</button></div><div id="ps-out" class="stack-s" style="margin-top:12px"></div>`); },
    'share-go': async el => { const d = B.documents.find(x => x.id === el.dataset.id);
      try { const r = await API('POST', `/api/portal/files/${d.id}/share`, { days: Number(qs('#ps-days').value) }), text = `${d.type} ${d.doc_no || ''} from EGO Premium: ${r.url}`;
        qs('#ps-out').innerHTML = `<input class="input" readonly value="${esc(r.url)}" aria-label="Link"><p class="small muted">Works until ${ds(r.expires)}.</p><div class="row" style="flex-wrap:wrap;gap:6px"><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text)}">WhatsApp</a><a class="btn sm" href="mailto:?subject=${encodeURIComponent(d.type + ' ' + (d.doc_no || ''))}&body=${encodeURIComponent(text)}">Email</a>${navigator.share ? '<button class="btn sm" data-pa="share-native">Other apps</button>' : ''}<button class="btn sm" data-pa="share-copy">Copy</button></div>`;
        A['share-native'] = () => navigator.share({ title: d.type, text, url: r.url }).catch(() => {});
        A['share-copy'] = () => { navigator.clipboard && navigator.clipboard.writeText(r.url).then(() => toast('Link copied.')); }; } catch (e) { toast(esc(e.message)); } },
  };

  function start(boot) {
    B = boot;
    document.body.classList.remove('gated'); document.body.classList.add('pt-on');
    qs('#gate').innerHTML = '';
    if (!root) {
      root = document.createElement('div'); root.id = 'portal'; root.className = 'pt';
      root.innerHTML = '<header id="pt-top" class="pt-top"></header><main id="pt-view" class="pt-view"></main><nav id="pt-nav" class="pt-nav" aria-label="Menu"></nav>';
      document.body.insertBefore(root, qs('#overlay'));
      document.addEventListener('click', e => { const el = e.target.closest('[data-pa]'); if (el && A[el.dataset.pa]) { e.preventDefault(); A[el.dataset.pa](el, e); } if (e.target.id === 'overlay') closeModal(); });
      const onF = e => { const box = e.target.closest && e.target.closest('[data-pf]'); if (!box || !e.target.dataset.pk) return; const f = F(box.dataset.pf); f[e.target.dataset.pk] = e.target.value;
        const pos = e.target.selectionStart, id = e.target.dataset.pk; render(); if (id === 'q') { const el = qs(`[data-pf="${box.dataset.pf}"] [data-pk="q"]`); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (x) {} } } };
      document.addEventListener('input', e => { if (e.target.dataset && e.target.dataset.pk === 'q') onF(e); });
      document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.pk && e.target.dataset.pk !== 'q') onF(e); });
      window.addEventListener('hashchange', () => { if (route().r === 'history') S.hist = null; render(); window.scrollTo(0, 0); });
    }
    render();
  }
  window.EGOPORTAL = { start, refresh: b => { B = b; render(); } };
})();
