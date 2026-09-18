'use strict';
/* Wholesale · EGO Premium — order flow with two paths, warehouses, MOQ production + allocation, and the vendor module
   (one vendor firm → many salespeople who raise requirements with EGO). Mock screens on sample data. */

const WS_STOCK = ['Requirement received', 'Stock checked', 'Allocated', 'Dispatched', 'Delivered', 'Invoiced', 'Collected'];
const WS_MOQ = ['Requirement received', 'MOQ / production order', 'In production', 'In transit', 'Received at warehouse', 'Allocated', 'Dispatched', 'Delivered', 'Invoiced', 'Collected'];
const PO_STAGES = ['Design & MOQ agreed', 'Production order placed', 'In production', 'Quality check', 'Shipped', 'In transit', 'Received at warehouse', 'Allocated & closed'];
const WH = byId(D.warehouse), PO = byId(D.production_order), DEMP_ = byId(D.dealer_employee);
const WH_FOR = { West: 'wh_bhw', South: 'wh_blr', North: 'wh_ncr' };
const ORD = id => D.order.find(o => o.id === id);
const stagesOf = o => o.path === 'moq' ? WS_MOQ : WS_STOCK;
const ws = (sku, wh) => D.wstock.find(x => x.sku === sku && x.wh === wh);
const free = (sku, wh) => { const r = ws(sku, wh); return r ? Math.max(0, r.on_hand - r.allocated) : 0; };
const allocated = l => l.alloc.reduce((a, x) => a + x.qty, 0);
const price = v => masked(v, canPrice());
const wnav = cur => subnav([['orders', 'Order flow', '#/orders'], ['stock', 'Stock by warehouse', '#/stock'], ['production', 'Production & allocation', '#/production']], cur);
const pathBadge = o => o.path === 'moq' ? '<span class="badge warn">MOQ / production</span>' : '<span class="badge ok">From stock</span>';

// ---------------------------------------------------------------- orders: two paths
EM.wsf ||= { path: '' };
EM.VIEWS.orders = () => {
  const os = D.order.filter(seeOrder), open = os.filter(o => !['Collected'].includes(o.stage) && (NOW - dt(o.at)) / 864e5 < 60);
  const lane = (path, stages) => {
    const list = open.filter(o => o.path === path);
    return `<section class="path-lane"><h3>${path === 'moq' ? 'MOQ path — produce, receive, allocate' : 'Stock path — allocate from a warehouse'} <span class="badge plain">${list.length} open</span></h3>
      <div class="board" style="grid-auto-columns:minmax(170px,1fr)">${stages.map(st => { const ls = list.filter(o => o.stage === st); return `<div class="lane"><h4><span>${st}</span><span class="muted">${ls.length}</span></h4>
        ${ls.slice(0, 5).map(o => `<div class="mini" data-href="#/worder/${o.id}" tabindex="0"><b>${esc(DL[o.dealer].name)}</b><div class="muted">${esc(o.no)} · ${o.lines.length} designs</div><div class="muted">${price(inr(o.total))}</div></div>`).join('')}
        ${ls.length > 5 ? `<div class="small muted" style="margin-top:6px">+ ${ls.length - 5} more</div>` : ''}</div>`; }).join('')}</div></section>`;
  };
  return `<div class="stack">${wnav('orders')}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><div class="kicker">Wholesale · EGO Premium</div><h1>Order flow</h1><p class="muted" style="max-width:780px">Two paths. If the design is in a warehouse, the order is allocated and dispatched. If it is short or custom, it joins a production order at the MOQ, arrives in a container, and the received stock is allocated across the dealers who are waiting.</p></div>
      <button class="btn primary" data-act="order-new">+ New order</button></div>
    ${lane('stock', WS_STOCK)}${lane('moq', WS_MOQ)}</div>`;
};
EM.VIEWS.orders.title = () => 'Order flow';

// ---------------------------------------------------------------- one wholesale order: allocation by warehouse
EM.VIEWS.worder = id => {
  const o = ORD(id);
  if (!o) return '<p>Order not found.</p>';
  if (!seeOrder(o)) return EM.noAccess('This vendor is outside your data scope.');
  const d = DL[o.dealer], stages = stagesOf(o), k = stages.indexOf(o.stage), canAlloc = ['Requirement received', 'Stock checked', 'Received at warehouse'].includes(o.stage);
  const whs = D.warehouse, home = WH_FOR[MK[d.market].region];
  const rows = o.lines.map((l, i) => {
    const s = SKU[l.sku], short = l.qty - allocated(l), po = l.po && PO[l.po];
    const cells = whs.map(w => { const a = l.alloc.find(x => x.wh === w.id); const f = free(l.sku, w.id);
      return canAlloc ? `<div class="small muted">${numFmt(f)} free</div><input class="input alloc-in" type="number" min="0" value="${a ? a.qty : 0}" data-alloc="${i}|${w.id}" aria-label="Allocate ${esc(s.design)} from ${esc(w.name)}">`
        : a ? `<b>${numFmt(a.qty)}</b>` : '<span class="muted">—</span>'; });
    return [`<div class="row" style="flex-wrap:nowrap">${thumb(s)}<div>${esc(s.collection)} · ${esc(s.design)}<div class="small muted">${s.code}</div></div></div>`, `${numFmt(l.qty)} ${esc(s.unit)}`, price(inrFull(l.rate)), ...cells,
      short > 0 ? (po ? `<a class="badge warn" href="#/po/${po.id}">${numFmt(short)} on ${esc(po.no)} · ${esc(po.stage)}</a>` : `<span class="badge bad">Short ${numFmt(short)}</span>`) : '<span class="badge ok">Allocated</span>'];
  });
  const nextStage = stages[k + 1];
  const stepBtn = !canAlloc && nextStage && !['Received at warehouse', 'In production', 'In transit', 'MOQ / production order'].includes(o.stage) ? `<button class="btn primary" data-act="wo-next" data-o="${id}">Mark ${esc(nextStage)}</button>` : '';
  return `<div class="stack">${wnav('orders')}${crumbs(['Order flow', '#/orders'], [o.no])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(o.no)}</h1><div class="row">${pathBadge(o)}<span class="badge plain">${esc(o.stage)}</span><span class="small muted">${dFmt(o.at)} · ${price(inrFull(o.total + o.gst))} incl. GST</span></div>
      <p class="muted"><a href="#/dealer/${d.id}">${esc(d.name)}</a> · ${d.type} · ${esc(MK[d.market].region)} region → nearest warehouse ${esc(WH[home].name)}</p></div>${stepBtn}</div>
    <div style="overflow-x:auto">${flow(stages, o.stage)}</div>
    ${frame('Orders › Allocation by warehouse', `<div class="stack">
      ${table(['Design', 'Ordered', 'Rate', ...whs.map(w => `${esc(w.name)}${w.real ? '' : ' (sample)'}`), 'Status'], rows)}
      ${canAlloc ? `<div class="row"><button class="btn" data-act="wo-suggest" data-o="${id}">Suggest: nearest warehouse first</button><button class="btn primary" data-act="wo-alloc" data-o="${id}">Save allocation</button>
        ${o.lines.some(l => l.qty > allocated(l) && !l.po) ? `<button class="btn" data-act="wo-short" data-o="${id}">Add shortfall to a production order</button>` : ''}</div><div id="wo-err"></div>` : ''}
    </div>`)}
    <section class="stack-s"><h3>History</h3><div class="timeline">${o.history.slice().reverse().map(([st, at], i) => `<div class="${i ? '' : 'on'}"><div>${esc(st)}</div><div class="small muted">${dFmt(at)} ${tFmt(at)}</div></div>`).join('')}</div></section></div>`;
};
EM.VIEWS.worder.title = id => (ORD(id) || { no: 'Order' }).no;

const readAlloc = o => o.lines.map((l, i) => D.warehouse.map(w => ({ wh: w.id, qty: Math.max(0, +(qs(`[data-alloc="${i}|${w.id}"]`) || { value: 0 }).value || 0) })).filter(x => x.qty));
EM.ACTIONS['wo-suggest'] = el => {
  const o = ORD(el.dataset.o), home = WH_FOR[MK[DL[o.dealer].market].region], order = [home, ...D.warehouse.map(w => w.id).filter(w => w !== home)];
  o.lines.forEach((l, i) => { let need = l.qty; order.forEach(w => { const inp = qs(`[data-alloc="${i}|${w}"]`); const take = Math.min(need, free(l.sku, w) + ((l.alloc.find(x => x.wh === w) || {}).qty || 0)); if (inp) inp.value = take; need -= take; }); });
  EM.toast('Suggested: nearest warehouse first, then the others. Adjust any number before saving.');
};
EM.ACTIONS['wo-alloc'] = el => {
  const o = ORD(el.dataset.o), next = readAlloc(o);
  for (let i = 0; i < o.lines.length; i++) {
    const l = o.lines[i], s = SKU[l.sku], tot = next[i].reduce((a, x) => a + x.qty, 0);
    if (tot > l.qty) return (qs('#wo-err').innerHTML = `<div class="callout warn">${esc(s.design)}: allocating ${numFmt(tot)} but only ${numFmt(l.qty)} ordered.</div>`);
    for (const x of next[i]) {
      const had = (l.alloc.find(a => a.wh === x.wh) || {}).qty || 0;
      if (x.qty - had > free(l.sku, x.wh)) return (qs('#wo-err').innerHTML = `<div class="callout warn">${esc(s.design)}: only ${numFmt(free(l.sku, x.wh) + had)} ${esc(s.unit)} free at ${esc(WH[x.wh].name)}.</div>`);
    }
  }
  o.lines.forEach((l, i) => {
    l.alloc.forEach(a => { ws(l.sku, a.wh).allocated -= a.qty; });
    l.alloc = next[i]; l.alloc.forEach(a => { ws(l.sku, a.wh).allocated += a.qty; });
  });
  const full = o.lines.every(l => allocated(l) >= l.qty), at = stamp();
  if (o.stage === 'Requirement received') { o.stage = 'Stock checked'; o.history.push(['Stock checked', at]); }
  if (full) { o.stage = 'Allocated'; o.history.push(['Allocated', at]); }
  o.status = o.stage;
  EM.toast(full ? `<b>Fully allocated</b><ul><li>Stock reserved at ${[...new Set(o.lines.flatMap(l => l.alloc.map(a => WH[a.wh].name)))].join(' + ')}</li><li>Pick list sent to Warehouse & Dispatch</li></ul>` : 'Partly allocated — add the shortfall to a production order or allocate more.');
  EM.rerender();
};
EM.ACTIONS['wo-short'] = el => {
  const o = ORD(el.dataset.o), at = stamp(), made = [];
  o.lines.forEach((l, i) => {
    const short = l.qty - allocated(l);
    if (short <= 0 || l.po) return;
    let po = D.production_order.find(p => p.sku === l.sku && PO_STAGES.indexOf(p.stage) <= PO_STAGES.indexOf('In transit'));
    if (!po) {
      const s = SKU[l.sku];
      po = { id: 'po_new' + EM.tick, no: `PO/EGO/26/${300 + EM.tick++}`, sku: l.sku, custom: null, factory: 'Factory A · Vietnam (sample)', moq: s.unit === 'sq ft' ? 5000 : 1500, qty: Math.max(s.unit === 'sq ft' ? 5000 : 1500, Math.ceil(short / 500) * 500),
        stage: 'Production order placed', history: [['Design & MOQ agreed', at], ['Production order placed', at]], placed: at, eta: dayStr(new Date(NOW.getTime() + 45 * 864e5)), container: null, warehouse: 'wh_bhw', received: 0, division: 'wholesale', waiting: [] };
      D.production_order.push(po); PO[po.id] = po;
    }
    po.waiting.push({ order: o.id, line: i, qty: short }); l.po = po.id; made.push(`${SKU[l.sku].design}: ${numFmt(short)} on ${po.no} (${po.stage})`);
  });
  if (o.path === 'stock') { o.path = 'moq'; o.stage = 'MOQ / production order'; o.history.push(['MOQ / production order', at]); o.status = o.stage; }
  EM.toast(`<b>Moved to the MOQ path</b><ul>${made.map(m => `<li>${esc(m)}</li>`).join('')}<li>Dealer gets a WhatsApp with the expected date</li></ul>`, 6500);
  EM.rerender();
};
EM.ACTIONS['wo-next'] = el => {
  const o = ORD(el.dataset.o), stages = stagesOf(o), next = stages[stages.indexOf(o.stage) + 1];
  if (next === 'Dispatched' && o.lines.some(l => allocated(l) < l.qty)) { EM.toast('Every line must be allocated before dispatch.'); return; }
  o.stage = next; o.status = next; o.history.push([next, stamp()]);
  if (next === 'Dispatched') o.lines.forEach(l => l.alloc.forEach(a => { const r = ws(l.sku, a.wh); r.on_hand -= a.qty; r.allocated -= a.qty; }));
  EM.toast({ Dispatched: '<b>Dispatched</b><ul><li>Stock leaves the warehouse (Tally delivery note)</li><li>Dealer gets vehicle + LR number on WhatsApp</li></ul>', Delivered: 'Delivered — proof of delivery photo saved.', Invoiced: 'Invoice posted to Tally.', Collected: 'Payment received in Tally — order closed.' }[next] || next);
  EM.rerender();
};

// ---------------------------------------------------------------- stock by warehouse
EM.stockf ||= { cat: '' };
EM.VIEWS.stock = () => {
  const skus = D.sku.filter(s => !EM.stockf.cat || s.category === EM.stockf.cat);
  const whTot = w => { const rows = D.wstock.filter(x => x.wh === w.id); return { on: rows.reduce((a, x) => a + x.on_hand, 0), al: rows.reduce((a, x) => a + x.allocated, 0), val: rows.reduce((a, x) => a + x.on_hand * SKU[x.sku].dealer_price, 0) }; };
  const incoming = sku => D.production_order.filter(p => p.sku === sku && PO_STAGES.indexOf(p.stage) < 6).reduce((a, p) => a + p.qty, 0);
  return `<div class="stack">${wnav('stock')}
    <div class="stack-s"><div class="kicker">Wholesale · EGO Premium</div><h1>Stock by warehouse</h1><p class="muted">Read from Tally godowns every 2 minutes. Allocated stock is reserved for dealer orders; free stock can be promised.</p></div>
    <div class="wh-cards">${D.warehouse.map(w => { const t = whTot(w); return `<div class="card stack-s"><div class="row between"><h3>${esc(w.name)}</h3>${w.real ? '<span class="badge ok plain">EGO warehouse</span>' : '<span class="badge plain">sample hub</span>'}</div>
      <p class="small muted">${esc(w.address)} · Tally godown “${esc(w.tally_godown)}”</p>${kv([['On hand', `${numFmt(t.on)} units`], ['Allocated', `${numFmt(t.al)}`], ['Free', `<b>${numFmt(t.on - t.al)}</b>`], ['Value', price(inr(t.val))]])}</div>`; }).join('')}</div>
    <div class="row"><label class="field"><span class="small muted">Category</span><select class="input" data-stockf="cat"><option value="">All</option>${CATS.map(c => `<option ${EM.stockf.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
    ${table(['Design', ...D.warehouse.map(w => `${esc(w.name)} free / on hand`), 'Incoming (production)', 'Status'], skus.map(s => {
      const tot = D.warehouse.reduce((a, w) => a + free(s.id, w.id), 0), inc = incoming(s.id);
      return [`<div class="row" style="flex-wrap:nowrap">${thumb(s)}<div>${esc(s.collection)} · ${esc(s.design)}<div class="small muted">${s.code} · ${esc(s.unit)}</div></div></div>`,
        ...D.warehouse.map(w => { const r = ws(s.id, w.id); return r && r.on_hand ? `${numFmt(free(s.id, w.id))} <span class="muted">/ ${numFmt(r.on_hand)}</span>` : '<span class="muted">—</span>'; }),
        inc ? `<a href="#/production">${numFmt(inc)}</a>` : '—', tot === 0 ? '<span class="badge bad">Out of stock</span>' : tot < 1000 ? '<span class="badge warn">Low</span>' : '<span class="badge ok">OK</span>'];
    }))}</div>`;
};
document.addEventListener('change', e => { const el = e.target.closest('[data-stockf]'); if (el) { EM.stockf[el.dataset.stockf] = el.value; EM.rerender(); } });

// ---------------------------------------------------------------- production orders (MOQ) + allocation of received stock
EM.VIEWS.production = () => `<div class="stack">${wnav('production')}
  <div class="stack-s"><div class="kicker">Wholesale · EGO Premium</div><h1>Production &amp; allocation</h1><p class="muted" style="max-width:780px">Production orders at the factory's MOQ — for short stock or dealer-exclusive designs. When the container reaches a warehouse, the received quantity is allocated across the dealers who are waiting.</p></div>
  <div class="board" style="grid-auto-columns:minmax(190px,1fr)">${PO_STAGES.map(st => { const ps = D.production_order.filter(p => p.stage === st); return `<div class="lane"><h4><span>${st}</span><span class="muted">${ps.length}</span></h4>
    ${ps.map(p => `<div class="mini" data-href="#/po/${p.id}" tabindex="0"><b>${esc(p.no)}</b><div class="muted">${esc(SKU[p.sku].collection)} · ${esc(SKU[p.sku].design)}</div><div class="muted">${numFmt(p.qty)} ${esc(SKU[p.sku].unit)} · ${p.waiting.length} dealer${p.waiting.length === 1 ? '' : 's'} waiting</div>${p.custom ? '<span class="badge info">Custom design</span>' : ''}</div>`).join('')}</div>`; }).join('')}</div></div>`;
EM.VIEWS.production.title = () => 'Production & allocation';

EM.VIEWS.po = id => {
  const p = PO[id];
  if (!p) return '<p>Production order not found.</p>';
  const s = SKU[p.sku], k = PO_STAGES.indexOf(p.stage), waitQty = p.waiting.reduce((a, w) => a + w.qty, 0);
  const received = k >= 6, allocatable = p.stage === 'Received at warehouse';
  const sug = suggestAlloc(p);
  return `<div class="stack">${wnav('production')}${crumbs(['Production & allocation', '#/production'], [p.no])}
    <div class="row between" style="align-items:flex-start"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${thumb(s)}<div class="stack-s"><h1>${esc(p.no)}</h1>
      <p class="muted">${esc(s.collection)} · ${esc(s.design)} · ${esc(p.factory)}</p>${p.custom ? `<div class="callout">${esc(p.custom)}</div>` : ''}</div></div>
      ${k < 6 ? `<button class="btn primary" data-act="po-next" data-p="${id}">Mark ${esc(PO_STAGES[k + 1])}</button>` : ''}</div>
    <div style="overflow-x:auto">${flow(PO_STAGES, p.stage)}</div>
    <div class="grid g4">${stat('MOQ', `${numFmt(p.moq)}`, s.unit)}${stat('Ordered', numFmt(p.qty), s.unit)}${stat(received ? 'Received' : 'ETA', received ? numFmt(p.received) : ds(p.eta), received ? `at ${esc(WH[p.warehouse].name)}` : p.container ? `container ${p.container}` : `to ${esc(WH[p.warehouse].name)}`)}${stat('Dealers waiting', p.waiting.length, `${numFmt(waitQty)} ${esc(s.unit)} requested`)}</div>
    ${allocatable ? `${frame('Production › Allocate received stock', `<div class="stack">
      <div class="callout ${waitQty > p.received ? 'warn' : 'ok'}">${numFmt(p.received)} ${esc(s.unit)} received · ${numFmt(waitQty)} requested by ${p.waiting.length} dealers${waitQty > p.received ? ` — <b>${numFmt(waitQty - p.received)} short</b>, so decide who gets what` : ' — enough for everyone'}. Suggested split: oldest order first, Platinum before others; change any number.</div>
      ${table(['Dealer', 'Grade', 'Order date', 'Requested', 'Allocate'], p.waiting.map((w, i) => { const o = ORD(w.order), d = DL[o.dealer]; return [`<a href="#/worder/${o.id}">${esc(d.name)}</a><div class="small muted">${esc(o.no)}</div>`, gradeBadge(d.grade), dFmt(o.at), numFmt(w.qty), `<input class="input alloc-in" type="number" min="0" max="${w.qty}" value="${sug[i]}" data-poalloc="${i}" aria-label="Allocate to ${esc(d.name)}">`]; }))}
      <div class="row"><span class="small muted">Balance after allocation goes to free stock at ${esc(WH[p.warehouse].name)}.</span><span class="grow"></span><button class="btn primary" data-act="po-alloc" data-p="${id}">Allocate &amp; release for dispatch</button></div><div id="po-err"></div></div>`)}` : ''}
    ${!allocatable ? `<section class="stack-s"><h3>Dealers waiting</h3>${p.waiting.length ? table(['Dealer', 'Order', 'Requested', 'Allocated'], p.waiting.map(w => { const o = ORD(w.order); const l = o.lines[w.line]; return [`<a href="#/dealer/${o.dealer}">${esc(DL[o.dealer].name)}</a>`, `<a href="#/worder/${o.id}">${esc(o.no)}</a>`, numFmt(w.qty), (l.alloc.find(a => a.wh === p.warehouse) || {}).qty ? numFmt(l.alloc.find(a => a.wh === p.warehouse).qty) : '—']; })) : '<p class="muted">Replenishment — no dealer waiting; all of it goes to free stock.</p>'}</section>` : ''}
    <section class="stack-s"><h3>History</h3><div class="timeline">${p.history.slice().reverse().map(([st, at], i) => `<div class="${i ? '' : 'on'}"><div>${esc(st)}</div><div class="small muted">${dFmt(at)}</div></div>`).join('')}</div></section></div>`;
};
EM.VIEWS.po.title = id => (PO[id] || { no: 'Production order' }).no;
function suggestAlloc(p) {
  let left = p.received;
  const rank = { Platinum: 0, A: 1, B: 2, C: 3 };
  const order = p.waiting.map((w, i) => ({ i, w, o: ORD(w.order) })).sort((a, b) => a.o.at.localeCompare(b.o.at) || rank[DL[a.o.dealer].grade] - rank[DL[b.o.dealer].grade]);
  const out = p.waiting.map(() => 0);
  order.forEach(({ i, w }) => { const take = Math.min(w.qty, left); out[i] = take; left -= take; });
  return out;
}
EM.ACTIONS['po-next'] = el => {
  const p = PO[el.dataset.p], k = PO_STAGES.indexOf(p.stage), next = PO_STAGES[k + 1], at = stamp();
  p.stage = next; p.history.push([next, at]);
  if (next === 'Shipped') p.container ||= `MSKU${4000000 + EM.tick}`;
  if (next === 'Received at warehouse') {
    p.received = p.qty;
    const r = ws(p.sku, p.warehouse); r.on_hand += p.qty;
    p.waiting.forEach(w => { const o = ORD(w.order); if (o.stage !== 'Received at warehouse') { o.stage = 'Received at warehouse'; o.status = o.stage; o.history.push([o.stage, at]); } });
  } else p.waiting.forEach(w => { const o = ORD(w.order); const map = { 'In production': 'In production', 'In transit': 'In transit' }; if (map[next] && o.stage !== map[next]) { o.stage = map[next]; o.status = o.stage; o.history.push([o.stage, at]); } });
  EM.toast(next === 'Received at warehouse' ? `<b>Container received at ${esc(WH[p.warehouse].name)}</b><ul><li>${numFmt(p.qty)} ${esc(SKU[p.sku].unit)} added to stock (Tally receipt note)</li><li>${p.waiting.length} dealer orders ready to allocate</li></ul>` : `${esc(p.no)} → ${esc(next)}${p.waiting.length ? ' · waiting dealers updated on WhatsApp' : ''}`);
  EM.rerender();
};
EM.ACTIONS['po-alloc'] = el => {
  const p = PO[el.dataset.p], vals = p.waiting.map((w, i) => Math.max(0, +qs(`[data-poalloc="${i}"]`).value || 0));
  const tot = vals.reduce((a, v) => a + v, 0);
  const over = p.waiting.findIndex((w, i) => vals[i] > w.qty);
  if (over >= 0) return (qs('#po-err').innerHTML = `<div class="callout warn">${esc(DL[ORD(p.waiting[over].order).dealer].name)} asked for ${numFmt(p.waiting[over].qty)} — can't allocate more than requested.</div>`);
  if (tot > p.received) return (qs('#po-err').innerHTML = `<div class="callout warn">Allocating ${numFmt(tot)} but only ${numFmt(p.received)} received.</div>`);
  const at = stamp(), r = ws(p.sku, p.warehouse);
  p.waiting.forEach((w, i) => {
    const o = ORD(w.order), l = o.lines[w.line];
    if (vals[i]) { l.alloc.push({ wh: p.warehouse, qty: vals[i] }); r.allocated += vals[i]; }
    if (vals[i] >= w.qty && o.lines.every(x => allocated(x) >= x.qty)) { o.stage = 'Allocated'; o.status = o.stage; o.history.push(['Allocated', at]); }
  });
  const shortDealers = p.waiting.filter((w, i) => vals[i] < w.qty).length;
  p.stage = 'Allocated & closed'; p.history.push([p.stage, at]);
  EM.toast(`<b>${numFmt(tot)} allocated to ${vals.filter(Boolean).length} dealers</b><ul><li>${numFmt(p.received - tot)} left as free stock at ${esc(WH[p.warehouse].name)}</li>${shortDealers ? `<li>${shortDealers} dealer${shortDealers > 1 ? 's' : ''} partly filled — balance stays open on their order</li>` : ''}<li>Dispatch list sent to the warehouse</li></ul>`, 6500);
  EM.rerender();
};

// ---------------------------------------------------------------- vendor module: firm → salespeople → requirements
D360.splice(D360.findIndex(t => t[0] === 'people'), 1, ['salespeople', 'Salespeople'], ['requirements', 'Requirements']);
DEALER_TABS.salespeople = d => {
  const ppl = D.dealer_employee.filter(e => e.dealer === d.id), reqs = D.requirement.filter(r => r.dealer === d.id);
  const subs = D.dealer.filter(x => x.parent === d.id);
  return `<div class="stack">
    <div class="grid g4">${stat('Salespeople', ppl.length)}${stat('Requirements raised', reqs.length, `${reqs.filter(r => r.status === 'Converted').length} converted`)}${stat('Open requirements', reqs.filter(r => ['New', 'Quoted'].includes(r.status)).length)}${stat('Champions', ppl.filter(e => e.champion).length)}</div>
    <section class="card stack-s"><div class="row between"><h3>People at ${esc(d.name)}</h3><button class="btn primary" data-act="sp-add" data-d="${d.id}">+ Add salesperson</button></div>
      <p class="small muted">Everyone at this vendor who talks to EGO for requirements — like a family under one client, but a sales team under one vendor.</p>
      ${ppl.length ? ppl.map(e => { const rs = reqs.filter(r => r.salesperson === e.id); return `<div class="member"><span class="avatar">${esc(e.name.split(' ').map(w => w[0]).join('').slice(0, 2))}</span>
        <div><b>${esc(e.name)}</b> ${demo}<div class="small muted">${esc(e.role)} · ${esc(e.phone)} · last contact ${dFmt(e.last_interaction)}</div></div>
        <div class="row" style="gap:6px;justify-content:flex-end">${e.champion ? '<span class="badge ok">Champion</span>' : ''}<span class="badge plain">${rs.length} requirement${rs.length === 1 ? '' : 's'}</span></div></div>`; }).join('') : '<p class="muted">No salespeople recorded yet.</p>'}</section>
    ${d.type === 'Distributor' ? `<section class="stack-s"><h3>Sub-dealers under this distributor</h3>${subs.length ? table(['Sub-dealer', 'City', 'Sales (12 m)'], subs.map(x => ({ href: `#/dealer/${x.id}`, cells: [esc(x.name), esc(MK[x.market].city), inr(x.ltv_12m)] }))) : '<p class="muted">None linked.</p>'}</section>` : ''}</div>`;
};
DEALER_TABS.requirements = d => {
  const reqs = D.requirement.filter(r => r.dealer === d.id).sort((a, b) => b.raised.localeCompare(a.raised));
  return `<section class="stack-s"><h3>Requirements from ${esc(d.name)}’s salespeople</h3>
    ${reqs.length ? table(['Raised', 'By', 'Design', 'Qty', 'For', 'Status', ''], reqs.map(r => [dFmt(r.raised), esc(DEMP_[r.salesperson] ? DEMP_[r.salesperson].name : '—'), `<div class="row" style="flex-wrap:nowrap">${thumb(SKU[r.sku])}<span>${esc(SKU[r.sku].collection)} · ${esc(SKU[r.sku].design)}</span></div>`,
      `${numFmt(r.qty)} ${esc(SKU[r.sku].unit)}`, esc(r.site), r.status === 'Converted' && r.order ? `<a class="badge ok" href="#/worder/${r.order}">Order</a>` : r.status === 'Lost' ? `<span class="badge bad">Lost</span> <span class="small muted">${esc(r.lost_reason)}</span>` : `<span class="badge ${r.status === 'New' ? 'info' : 'warn'}">${r.status}</span>`,
      ['New', 'Quoted'].includes(r.status) ? `<button class="btn sm primary" data-act="req-convert" data-r="${r.id}">Convert to order</button>` : ''])) : '<p class="muted">No requirements yet.</p>'}</section>`;
};
EM.ACTIONS['sp-add'] = el => EM.modal(`<h2>Add salesperson</h2><p class="muted">${esc(DL[el.dataset.d].name)}</p><form id="spf" class="stack" style="margin-top:12px" onsubmit="return false">
  <div class="grid g2"><div class="field"><label for="sp-name">Name *</label><input class="input" id="sp-name"></div><div class="field"><label for="sp-phone">Mobile *</label><input class="input" id="sp-phone" inputmode="numeric" placeholder="10-digit mobile"></div></div>
  <div class="field"><label for="sp-role">Role</label><select class="input" id="sp-role"><option>Counter salesperson</option><option>Store manager</option><option>Site supervisor</option><option>Purchase</option></select></div>
  <label class="chip" style="padding:8px"><input type="checkbox" id="sp-champ"> Enrol as EGO Champion</label><div id="sp-err" class="small" style="color:var(--bad)"></div>
  <div class="row"><button class="btn primary" data-act="sp-save" data-d="${el.dataset.d}">Add</button><button class="btn" data-act="close-modal">Cancel</button></div></form>`);
EM.ACTIONS['sp-save'] = el => {
  const name = qs('#sp-name').value.trim(), d10 = qs('#sp-phone').value.replace(/\D/g, '').slice(-10);
  if (!name || d10.length !== 10) { qs('#sp-err').textContent = 'Enter a name and a 10-digit mobile number.'; return; }
  const clash = D.dealer_employee.find(e => e.phone.replace(/\D/g, '').slice(-10) === d10);
  if (clash) { qs('#sp-err').textContent = `${clash.name} at ${DL[clash.dealer].name} already uses this number.`; return; }
  const d = DL[el.dataset.d], e = { id: 'dem_new' + EM.tick++, name, dealer: d.id, role: qs('#sp-role').value, city: MK[d.market].city, phone: '+91 ' + d10.slice(0, 5) + ' ' + d10.slice(5), champion: qs('#sp-champ').checked, points: 0, last_interaction: stamp(), demo: true, division: 'wholesale', trainings: [] };
  D.dealer_employee.push(e); DEMP_[e.id] = e; d.salespeople++;
  EM.closeModal(); EM.toast(`<b>${esc(name)} added to ${esc(d.name)}</b><ul><li>Welcome message on WhatsApp with the EGO catalogue</li>${e.champion ? '<li>Enrolled as EGO Champion</li>' : ''}</ul>`); EM.rerender();
};
EM.ACTIONS['req-convert'] = el => {
  const r = D.requirement.find(x => x.id === el.dataset.r), d = DL[r.dealer], s = SKU[r.sku], at = stamp();
  const home = WH_FOR[MK[d.market].region], freeAll = D.warehouse.reduce((a, w) => a + free(r.sku, w.id), 0);
  const o = { id: 'ord_req' + EM.tick, no: `SO/2609/${String(700 + EM.tick++).padStart(4, '0')}`, dealer: d.id, at, lines: [{ sku: r.sku, qty: r.qty, rate: s.dealer_price, amount: r.qty * s.dealer_price, alloc: [], po: null }],
    total: r.qty * s.dealer_price, gst: Math.round(r.qty * s.dealer_price * 0.18), path: 'stock', stage: 'Requirement received', status: 'Requirement received', history: [['Requirement received', at]], division: 'wholesale', tally: { state: 'queued', voucher: null } };
  D.order.push(o); r.status = 'Converted'; r.order = o.id; d.req_open = Math.max(0, d.req_open - 1);
  EM.toast(`<b>Order ${o.no} created from ${esc(DEMP_[r.salesperson].name)}’s requirement</b><ul><li>${freeAll >= r.qty ? `${numFmt(freeAll)} free across warehouses (${esc(WH[home].name)} nearest) — allocate next` : `Only ${numFmt(freeAll)} free — the shortfall can join a production order`}</li></ul>`, 6000);
  location.hash = `#/worder/${o.id}`;
};
