'use strict';
/* Dealer network (spec §5 Dealer 360 · §7 dealer employees / EGO Champions · §14 Project Partner · §19 samples · §20 displays · §21 training).
   Mock product screens on sample data; every action is simulated in memory. */

const CATS = [...new Set(D.sku.map(s => s.category))];
const DEMP = byId(D.dealer_employee), TRN = D.training, FIRM = byId(D.design_firm), SITE = byId(D.site);
const DEALER_NAV = [['champions', 'EGO Champions', '#/champions'], ['displays', 'Displays', '#/displays'], ['samples', 'Samples', '#/samples'], ['training', 'Training & certification', '#/training']];
const dnav = cur => subnav(DEALER_NAV, cur);
const tierBadge = t => t ? `<span class="badge info">Priority 200 · ${t}</span>` : '';
const catSales = id => D.order.filter(o => o.dealer === id).flatMap(o => o.lines).reduce((m, l) => (m[SKU[l.sku].category] = (m[SKU[l.sku].category] || 0) + l.amount, m), {});
const due = (date, days = 0) => (dt(date + 'T12:00:00+05:30') - NOW) / 864e5 <= days;
const whoName = id => (EMP[id] || DEMP[id] || INST[id] || ARCH[id] || {}).name || '—';

// ---------------------------------------------------------------- dealer list
EM.dealerFilter ||= { grade: '', tier: '', region: '', risk: '', type: '', q: '' };
EM.VIEWS.dealers = () => {
  const f = EM.dealerFilter;
  const qn = f.q.toLowerCase();
  const rows = D.dealer.filter(seeDealer).filter(d => (!qn || (d.name + ' ' + d.owner + ' ' + d.phone + ' ' + MK[d.market].city).toLowerCase().includes(qn)) && (!f.type || d.type === f.type) && (!f.grade || d.grade === f.grade) && (!f.tier || d.p200_tier === f.tier) && (!f.region || MK[d.market].region === f.region) && (!f.risk || d.at_risk))
    .sort((a, b) => b.ltv_12m - a.ltv_12m);
  const byCity = Object.values(rows.reduce((m, d) => { const c = MK[d.market].city; (m[c] ||= { city: c, n: 0, p200: 0, sales: 0, out: 0, risk: 0 }); const x = m[c]; x.n++; x.p200 += !!d.p200_tier; x.sales += d.ltv_12m; x.out += d.outstanding; x.risk += d.at_risk; return m; }, {})).sort((a, b) => b.sales - a.sales);
  const sel = (key, label, opts) => `<label class="field" style="min-width:150px"><span class="small muted">${label}</span><select class="input" data-filter="${key}"><option value="">All</option>${opts.map(o => `<option ${f[key] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  const mine = D.dealer.filter(seeDealer);
  return `<div class="stack">
    <div class="row between"><div class="stack-s"><div class="kicker">Wholesale · EGO Premium</div><h1>Dealers &amp; distributors</h1><p class="muted">Everyone who sells EGO — distributors, dealers and sub-dealers · ${rows.length} of ${mine.length} · ${esc(scopeLabel())} ${demo}</p></div>
      <button class="btn primary" data-act="dealer-add">+ Add dealer</button></div>
    <div class="grid g4">${['Distributor', 'Dealer', 'Sub-dealer'].map(t => `<div class="card stat"><div class="kicker">${t}s</div><div class="num">${mine.filter(d => d.type === t).length}</div><span class="small muted">${inr(mine.filter(d => d.type === t).reduce((a, d) => a + d.fy_sales, 0))} this FY</span></div>`).join('')}<div class="card stat"><div class="kicker">Dealer salespeople</div><div class="num">${mine.reduce((a, d) => a + d.salespeople, 0)}</div><span class="small muted">${mine.reduce((a, d) => a + d.req_open, 0)} open requirements</span></div></div>
    <div class="row" style="align-items:flex-end"><label class="field grow" style="min-width:220px"><span class="small muted">Search</span><input class="input" id="vq" value="${esc(f.q)}" placeholder="Name, owner, phone or city"></label>${sel('type', 'Type', ['Distributor', 'Dealer', 'Sub-dealer'])}${sel('grade', 'Grade', ['Platinum', 'A', 'B', 'C'])}${sel('tier', 'Priority 200 tier', ['A', 'B', 'C', 'Watchlist'])}${sel('region', 'Region', ['West', 'South', 'North'])}
      <label class="chip" style="padding:8px 10px"><input type="checkbox" data-filter="risk" ${f.risk ? 'checked' : ''}> At risk only</label></div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">
      <section class="stack-s">${table(['Dealer', 'Type', 'Grade', 'Salespeople', 'City', 'Sales (12 m)', 'Outstanding', 'Days since order'], rows.slice(0, 60).map(d => ({ href: `#/dealer/${d.id}`,
        cells: [`<b>${esc(d.name)}</b>${d.parent ? `<div class="small muted">under ${esc(DL[d.parent].name)}</div>` : ''}`, d.type, gradeBadge(d.grade), d.salespeople || '—', esc(MK[d.market].city), inr(d.ltv_12m), inr(d.outstanding), d.at_risk ? `<span class="badge bad">${d.days_since_order} · at risk</span>` : d.days_since_order] })))}
        ${rows.length > 60 ? `<p class="small muted">Showing 60 of ${rows.length}.</p>` : ''}</section>
      <section class="stack-s"><h3>By city</h3>${table(['City', '#', 'P200', 'Sales', 'Outstanding'], byCity.map(c => [c.city + (c.risk ? ` <span class="badge bad plain">${c.risk} at risk</span>` : ''), c.n, c.p200, inr(c.sales), inr(c.out)]))}</section>
    </div></div>`;
};
EM.VIEWS.dealers.title = () => 'Dealers';
document.addEventListener('change', e => {
  const el = e.target.closest('[data-filter]');
  if (!el) return;
  EM.dealerFilter[el.dataset.filter] = el.type === 'checkbox' ? (el.checked ? '1' : '') : el.value;
  EM.rerender();
});

// ---------------------------------------------------------------- Dealer 360
const D360 = [['overview', 'Overview'], ['products', 'Products'], ['relationship', 'Relationship'], ['infra', 'Infrastructure & market'],
  ['people', 'People & Champions'], ['samples', 'Samples & displays'], ['projects', 'Projects'], ['orders', 'Orders']];
EM.VIEWS.dealer = arg => {
  const [id, tab = 'overview'] = arg.split('/'), d = DL[id];
  if (!d) return '<p>Dealer not found.</p>';
  if (!seeDealer(d)) return EM.noAccess('This dealer is outside your data scope.');
  const pct = Math.min(100, Math.round(d.fy_sales / d.target_12m * 100));
  const lastTouch = [...D.visit.filter(v => v.dealer === id).map(v => v.at), d.last_order].filter(Boolean).sort().pop();
  const touchDays = lastTouch ? Math.round((NOW - dt(lastTouch)) / 864e5) : null;
  const body = (DEALER_TABS[tab] || DEALER_TABS.overview)(d);
  return `<div class="stack">${crumbs(['Dealers', '#/dealers'], [d.name])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(d.name)}</h1>
      <div class="row"><span class="badge info plain">${d.type}</span>${d.parent ? `<a class="badge plain" href="#/dealer/${d.parent}">under ${esc(DL[d.parent].name)}</a>` : ''}${gradeBadge(d.grade)}${tierBadge(d.p200_tier)}<span class="badge plain">Project partner: ${d.project_partner}</span>${d.at_risk ? '<span class="badge bad">At risk</span>' : ''}${demo}</div>
      <p class="muted">${esc(d.owner)} · ${esc(d.phone)} · ${esc(market(d.market))} · dealer since ${new Date(d.since).getFullYear()}</p></div>
      <div class="row"><a class="btn" href="#/orders">Orders →</a><a class="btn primary" href="#/order/${id}">+ New order</a></div></div>
    <div class="grid g4">
      <div class="card stat"><div class="kicker">Sales this FY</div><div class="num">${inr(d.fy_sales)}</div><div class="bar" style="margin-top:10px"><b style="width:${pct}%"></b></div><span class="small muted">${pct}% of target ${inr(d.target_12m)} · LY ${inr(d.ly_sales)}</span></div>
      <div class="card stat"><div class="kicker">Outstanding · from Tally</div><div class="num">${inr(d.outstanding)}</div><span class="small muted">${d.overdue ? `<b style="color:var(--bad)">${inr(d.overdue)} overdue</b>` : 'nothing overdue'} · limit ${inr(d.credit_limit)}</span></div>
      <div class="card stat"><div class="kicker">Last contact</div><div class="num">${touchDays ?? '—'} d</div><span class="small muted">agreed every ${d.contact_every_days} days ${touchDays > d.contact_every_days ? '<span class="badge warn">overdue</span>' : '<span class="badge ok">on track</span>'}</span></div>
      <div class="card stat"><div class="kicker">3-year potential</div><div class="num">${inr(d.potential_3y)}</div><span class="small muted">${esc(d.potential_note)}</span></div>
    </div>
    ${subtabs(`#/dealer/${id}`, tab, D360)}
    ${body}</div>`;
};
EM.VIEWS.dealer.tab = 'dealers';
EM.VIEWS.dealer.title = a => (DL[a.split('/')[0]] || { name: 'Dealer' }).name;

const DEALER_TABS = {
  overview: d => `<div class="grid g2">
    <section class="card stack-s"><h3>Identity</h3>${kv([['Trade name', esc(d.name)], ['GST', `<code>${esc(d.gst)}</code>`], ['Geography', esc(`${MK[d.market].region} → ${MK[d.market].state} → ${MK[d.market].city} → ${MK[d.market].name}`)],
      ['Contacts', d.contacts.map(c => `${esc(c.name)} · ${esc(c.role)} · ${esc(c.phone)}`).join('<br>')]])}</section>
    <section class="card stack-s"><h3>Commercial</h3>${kv([['FY sales / LY', `${inr(d.fy_sales)} / ${inr(d.ly_sales)} <span class="badge ${d.fy_sales >= d.ly_sales ? 'ok' : 'bad'}">${d.fy_sales >= d.ly_sales ? '+' : ''}${Math.round((d.fy_sales / d.ly_sales - 1) * 100)}%</span>`],
      ['Gross profit (12 m)', masked(`${inr(d.gp_12m)} <span class="small muted">· Owner, Director, Wholesale Head, Finance</span>`)], ['Outstanding / overdue', `${inr(d.outstanding)} / ${inr(d.overdue)}`], ['Credit limit', inr(d.credit_limit)],
      ['Payment behaviour', d.overdue ? 'Pays late on ~1 in 3 invoices' : 'Pays on time'], ['Orders (12 m)', `${d.orders_12m} · usually every ${d.cycle_days} days`]])}</section>
    <section class="card stack-s"><h3>Potential</h3>${kv([['Current business', inr(d.ltv_12m)], ['12-month target', inr(d.target_12m)], ['3-year potential', inr(d.potential_3y)], ['Opportunity note', esc(d.potential_note)]])}</section>
    <section class="card stack-s"><h3>Priority 200</h3>${kv([['Status', d.p200_tier ? `In programme · tier ${d.p200_tier}` : 'Not in programme'], ['League movement', d.p200_tier ? 'Promoted from B → A in July (sample)' : '—']])}
      <div class="phase2"><b>Phase 2:</b> the Dealer Development Plan — gap by product, the 20–26 interventions with owner, cost, expected and actual result, and investment vs incremental GP.</div></section>
  </div>`,

  products: d => {
    const cs = catSales(d.id), bought = D.order.filter(o => o.dealer === d.id).flatMap(o => o.lines)
      .reduce((m, l) => (m[l.sku] = (m[l.sku] || { qty: 0, amount: 0 }), m[l.sku].qty += l.qty, m[l.sku].amount += l.amount, m), {});
    const top = Object.entries(bought).sort((a, b) => b[1].amount - a[1].amount).slice(0, 8);
    return `<div class="stack">
      <section class="stack-s"><h3>By category</h3>${table(['Category', 'Sales (12 m)', 'Status'], CATS.map(c => [c, cs[c] ? inr(cs[c]) : '—', cs[c] ? '<span class="badge ok">Buying</span>' : `<span class="badge warn">Not buying</span> <span class="small muted">cross-sell: ${esc(D.sku.find(s => s.category === c).collection)}</span>`]))}</section>
      <section class="stack-s"><h3>Top designs bought</h3><div class="grid g4">${top.map(([sid, v]) => { const s = SKU[sid]; return `<div class="card prod">${thumb(s, 'lg')}<div><h4>${esc(s.collection)} · ${esc(s.design)}</h4>
        <span class="small muted">${esc(s.category)} · ${s.code}</span><div class="small">${numFmt(v.qty)} ${esc(s.unit)} · ${inr(v.amount)}</div></div></div>`; }).join('')}</div></section></div>`;
  },

  relationship: d => {
    const ev = [...D.visit.filter(v => v.dealer === d.id).map(v => ({ at: v.at, t: `Visit · ${esc(v.purpose)} → ${esc(v.outcome)}`, s: `${esc(whoName(v.user))} · “${esc(v.notes)}” · Sales Diary` })),
      ...D.order.filter(o => o.dealer === d.id).slice(-5).map(o => ({ at: o.at, t: `Order ${esc(o.no)} · ${inr(o.total)}`, s: `${o.lines.length} SKU lines · Tally ${o.tally.state}` })),
      ...D.sample.filter(x => x.recipient === d.id).map(x => ({ at: x.at, t: `Samples · ${esc(SKU[x.sku].collection)} ${esc(SKU[x.sku].design)}`, s: `${x.qty} pcs · ${esc(x.result)}` }))]
      .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
    return `<div class="grid g2">
      <section class="card stack-s"><h3>Owners</h3>${kv([['Field sales', esc(whoName(d.field_owner))], ['Telesales', esc(whoName(d.telesales_owner))], ['Product specialist', esc(whoName(d.specialist_owner))],
        ['Management', d.mgmt_owner ? esc(whoName(d.mgmt_owner)) : '—'], ['Relationship since', ds(d.since)], ['Contact cadence', `Every ${d.contact_every_days} days`]])}
        <p class="small muted">Territories and portfolios can be reassigned without losing this history.</p></section>
      <section class="card stack-s"><h3>Interaction timeline</h3>${ev.length ? `<div class="timeline">${ev.map((e, i) => `<div class="${i ? '' : 'on'}"><div>${e.t}</div><div class="small muted">${dFmt(e.at)} · ${e.s}</div></div>`).join('')}</div>` : '<p class="muted">No interactions yet.</p>'}</section></div>`;
  },

  infra: d => {
    const archs = D.architect.filter(a => a.connected_dealers.includes(d.id));
    return `<div class="grid g2">
      <section class="card stack-s"><h3>Infrastructure</h3>${kv([['Showroom', d.showroom ? `Yes · ${d.display_area_sqft} sq ft display area` : 'No'], ['Warehouse', d.warehouse_sqft ? `${numFmt(d.warehouse_sqft)} sq ft` : 'None'],
        ['Dealer salespeople', d.dealer_salespeople], ['Own installers', d.own_installers], ['Service capability', d.service_capable ? 'Yes' : 'No'], ['EGO displays', D.display.filter(x => x.dealer === d.id).length]])}</section>
      <section class="card stack-s"><h3>Market profile</h3>${kv([['Customer types', d.customer_types.map(c => `<span class="chip">${esc(c)}</span>`).join('')], ['Brands also sold', esc(d.brands_sold.join(', '))],
        ['Main competitors', esc(d.competitors.join(', '))], ['Designer relationships', archs.map(a => `<a href="#/architect/${a.id}">${esc(a.name)}</a>`).join(', ') || '—'],
        ['Project capability', `Partner status: ${d.project_partner}`]])}</section></div>`;
  },

  people: d => {
    const ppl = D.dealer_employee.filter(e => e.dealer === d.id);
    return `<section class="stack-s"><div class="row between"><h3>Dealer employees</h3><button class="btn" data-act="invite-dealer" data-d="${d.id}">Invite to next EGO training</button></div>
      ${ppl.length ? table(['Name', 'Role', 'EGO Champion', 'Points', 'Trainings', 'Last interaction'], ppl.map(e => [`${esc(e.name)} ${demo}`, esc(e.role), e.champion ? '<span class="badge ok">Champion</span>' : '—', e.points,
        e.trainings.map(t => esc(TRN.find(x => x.id === t).course)).join('<br>') || '—', dFmt(e.last_interaction)])) : '<p class="muted">No employees recorded yet — add them from the phone app during a visit.</p>'}</section>`;
  },

  samples: d => {
    const smp = D.sample.filter(x => x.recipient === d.id), dis = D.display.filter(x => x.dealer === d.id);
    return `<div class="stack">
      <section class="stack-s"><h3>Displays at this dealer</h3>${dis.length ? table(['Category', 'Type', 'Installed', 'Condition', 'Last inspection', 'Replace by', ''], dis.map(x => [esc(x.category), esc(x.type), ds(x.installed), esc(x.condition), ds(x.last_inspection),
        due(x.replacement_due, 60) ? `<span class="badge ${due(x.replacement_due) ? 'bad' : 'warn'}">${ds(x.replacement_due)}</span>` : ds(x.replacement_due), `<button class="btn sm" data-act="inspect" data-x="${x.id}">Log inspection</button>`])) : '<p class="muted">No EGO displays.</p>'}</section>
      <section class="stack-s"><h3>Samples given</h3>${smp.length ? table(['Date', 'Design', 'Qty', 'Cost', 'Reason', 'Follow-up', 'Result'], smp.map(x => [dFmt(x.at), `${thumb(SKU[x.sku])} ${esc(SKU[x.sku].collection)} · ${esc(SKU[x.sku].design)}`, x.qty, inr(x.cost), esc(x.reason), ds(x.follow_up), esc(x.result)])) : '<p class="muted">No samples in the last 90 days.</p>'}</section></div>`;
  },

  projects: d => {
    const ps = D.project.filter(p => p.partner_dealer === d.id);
    return `<section class="stack-s"><h3>Projects as partner dealer</h3>${ps.length ? table(['Project', 'Type', 'Stage', 'Value', 'Sites'], ps.map(p => ({ href: `#/project/${p.id}`, cells: [esc(p.name), p.type, esc(p.stage), inr(p.value), p.sites.length || '—'] }))) : '<p class="muted">Not a partner on any project yet.</p>'}</section>`;
  },

  orders: d => {
    const os = D.order.filter(o => o.dealer === d.id).slice(-10).reverse();
    const st = o => o.tally.state === 'posted' ? '<span class="badge ok">Posted</span>' : o.tally.state === 'queued' ? '<span class="badge info">Queued</span>' : '<span class="badge bad">Rejected</span>';
    return `<section class="stack-s"><div class="row between"><h3>Orders</h3><a class="btn primary" href="#/order/${d.id}">+ New order</a></div>${table(['Order', 'Date', 'SKU lines', 'Value', 'Status', 'Tally'], os.map(o => [esc(o.no), dFmt(o.at), o.lines.length, inrFull(o.total), esc(o.status), st(o)]))}</section>`;
  },
};

EM.ACTIONS['invite-dealer'] = el => {
  const n = D.dealer_employee.filter(e => e.dealer === el.dataset.d).length;
  EM.toast(`<b>Training invite sent on WhatsApp</b><ul><li>${n} employee${n === 1 ? '' : 's'} · template <code>training_invite</code></li><li>RSVPs land on their records; attendance + score after the session</li></ul>`);
};
EM.ACTIONS.inspect = el => {
  const x = D.display.find(y => y.id === el.dataset.x);
  EM.modal(`<h2>Log display inspection</h2><p class="muted">${esc(DL[x.dealer].name)} · ${esc(x.category)} ${esc(x.type)}</p>
    <div class="stack" style="margin-top:14px"><div class="field"><label for="insp-c">Condition</label><select id="insp-c" class="input">${['Good', 'Worn', 'Damaged'].map(c => `<option ${c === x.condition ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <label class="chip" style="padding:8px"><input type="checkbox" id="insp-p" checked> 3 photos attached from the phone</label>
    <div class="row"><button class="btn primary" data-act="inspect-save" data-x="${x.id}">Save inspection</button><button class="btn" data-act="close-modal">Cancel</button></div></div>`);
};
EM.ACTIONS['inspect-save'] = el => {
  const x = D.display.find(y => y.id === el.dataset.x);
  x.condition = qs('#insp-c').value; x.last_inspection = NOW.toISOString().slice(0, 10); x.photos += qs('#insp-p').checked ? 3 : 0;
  EM.closeModal();
  EM.toast(x.condition === 'Good' ? 'Inspection saved.' : `<b>Inspection saved — ${esc(x.condition)}</b><ul><li>Replacement request raised for the display owner</li><li>Due date stays ${ds(x.replacement_due)} if not replaced sooner</li></ul>`);
  EM.rerender();
};

// ---------------------------------------------------------------- multi-SKU order builder (with photos)
EM.VIEWS.order = id => {
  const d = DL[id];
  if (!d) return '<p>Dealer not found.</p>';
  const dr = EM.draft && EM.draft.dealer === id ? EM.draft : (EM.draft = { dealer: id, lines: D.sku.filter(s => d.categories.includes(s.category)).slice(0, 2).map((s, i) => ({ sku: s.id, qty: [500, 240][i] })) });
  let sub = 0;
  const rows = dr.lines.map((ln, i) => {
    const s = SKU[ln.sku], st = STOCK[ln.sku], avail = st.on_hand - st.committed, amt = ln.qty * s.dealer_price; sub += amt;
    const short = ln.qty > avail;
    return [`<div class="row" style="flex-wrap:nowrap">${thumb(s)}<select class="input" data-act-change="ob-sku" data-i="${i}" aria-label="Design line ${i + 1}">${CATS.map(c => `<optgroup label="${c}">${D.sku.filter(x => x.category === c).map(x => `<option value="${x.id}" ${x.id === ln.sku ? 'selected' : ''}>${esc(x.collection)} · ${esc(x.design)} (${x.code})</option>`).join('')}</optgroup>`).join('')}</select></div>`,
      `<input class="input" type="number" min="1" value="${ln.qty}" data-act-change="ob-qty" data-i="${i}" style="width:100px" aria-label="Quantity line ${i + 1}">`, esc(s.unit), inrFull(s.dealer_price), `<span class="ob-amt">${inrFull(amt)}</span>`,
      short ? `<span class="badge warn">Short ${numFmt(ln.qty - Math.max(0, avail))}</span><div class="small muted">incoming ${numFmt(st.incoming)} · ETA ${st.eta}</div>` : '<span class="badge ok">In stock</span>',
      `<button class="btn sm ghost" data-act="ob-del" data-i="${i}" aria-label="Remove line">✕</button>`];
  });
  const gst = Math.round(sub * 0.18), total = sub + gst, over = d.outstanding + total > d.credit_limit;
  return `<div class="stack">${crumbs(['Vendors', '#/dealers'], [d.name, `#/dealer/${id}`], ['New order'])}
    <div class="stack-s"><h1>New order</h1><p class="muted">${esc(d.name)} · add as many designs as the order needs. Rate comes from the dealer price list, stock from Tally, and the total adds itself up.</p></div>
    ${frame('Orders › New', `<div class="stack">${table(['Design', 'Qty', 'Unit', 'Rate', 'Amount', 'Stock', ''], rows)}
      <button class="btn" data-act="ob-add">+ Add design</button>
      <div class="grid g2"><div>${over ? `<div class="callout warn"><b>Needs approval:</b> outstanding ${inr(d.outstanding)} + this order ${inr(total)} is above the credit limit ${inr(d.credit_limit)}. Saving sends it to the Wholesale Head.</div>` : `<div class="callout ok">Within credit limit (${inr(d.credit_limit)}).</div>`}</div>
      <div class="card flat">${kv([['Lines', dr.lines.length], ['Subtotal', `<span id="ob-sub">${inrFull(sub)}</span>`], ['GST 18%', inrFull(gst)], ['<b>Order value</b>', `<b id="ob-total" style="font:600 26px var(--serif)">${inrFull(total)}</b>`]])}</div></div>
      <div class="row"><button class="btn primary" data-act="ob-save">Save order &amp; post to Tally</button><a class="btn" href="#/dealer/${id}/orders">Cancel</a></div></div>`)}
  </div>`;
};
EM.VIEWS.order.tab = 'dealers';
document.addEventListener('change', e => {
  const el = e.target.closest('[data-act-change^="ob-"]');
  if (!el || !EM.draft) return;
  const ln = EM.draft.lines[+el.dataset.i];
  if (el.dataset.actChange === 'ob-sku') ln.sku = el.value;
  if (el.dataset.actChange === 'ob-qty') ln.qty = Math.max(1, parseInt(el.value, 10) || 1);
  EM.rerender();
});
EM.ACTIONS['ob-add'] = () => { const d = DL[EM.draft.dealer]; const used = EM.draft.lines.map(l => l.sku); EM.draft.lines.push({ sku: (D.sku.find(s => !used.includes(s.id) && d.categories.includes(s.category)) || D.sku.find(s => !used.includes(s.id))).id, qty: 100 }); EM.rerender(); };
EM.ACTIONS['ob-del'] = el => { if (EM.draft.lines.length > 1) { EM.draft.lines.splice(+el.dataset.i, 1); EM.rerender(); } };
EM.ACTIONS['ob-save'] = () => {
  const dr = EM.draft, d = DL[dr.dealer], at = stamp();
  const lines = dr.lines.map(l => ({ sku: l.sku, qty: l.qty, rate: SKU[l.sku].dealer_price, amount: l.qty * SKU[l.sku].dealer_price }));
  const total = lines.reduce((a, l) => a + l.amount, 0), gst = Math.round(total * 0.18), over = d.outstanding + total + gst > d.credit_limit;
  const o = { id: 'ord_new' + EM.tick, no: `SO/2609/${String(800 + EM.tick).padStart(4, '0')}`, dealer: d.id, at, lines, total, gst, status: over ? 'awaiting approval' : 'confirmed',
    tally: over || EM.tallyClosed ? { state: 'queued', voucher: null } : { state: 'posted', voucher: `EGO/SO/${60000 + EM.tick}` } };
  D.order.push(o); d.orders_12m++; d.days_since_order = 0; d.last_order = at;
  lines.forEach(l => { STOCK[l.sku].committed += l.qty; });
  EM.draft = null;
  EM.toast(`<b>Order ${o.no} saved · ${inrFull(total + gst)}</b><ul><li>${lines.length} designs, stock committed</li><li>${over ? 'Above credit limit → sent to the Wholesale Head; posts to Tally once approved' : o.tally.state === 'posted' ? `Posted to Tally · voucher ${o.tally.voucher}` : 'Tally closed → queued'}</li><li>Dealer gets a WhatsApp order confirmation</li></ul>`, 6500);
  location.hash = `#/dealer/${d.id}/orders`;
};

// ---------------------------------------------------------------- EGO Champions (§7)
EM.champ ||= { city: '', cat: '' };
EM.VIEWS.champions = () => {
  const f = EM.champ, all = D.dealer_employee.filter(e => seeDealer(DL[e.dealer]));
  const rows = all.filter(e => (!f.city || e.city === f.city) && (!f.cat || e.trainings.some(t => TRN.find(x => x.id === t).category === f.cat)));
  const cities = [...new Set(all.map(e => e.city))].sort();
  const certified = all.filter(e => TRN.some(t => t.attendees.some(a => a.who === e.id && a.certified))).length;
  return `<div class="stack">${dnav('champions')}
    <div class="stack-s"><h1>EGO Champions</h1><p class="muted" style="max-width:760px">Counter salespeople and site supervisors at dealers — the people who actually recommend a floor. Each has their own record, linked to the dealer.</p></div>
    <div class="grid g4"><div class="card stat"><div class="kicker">Dealer employees</div><div class="num">${all.length}</div></div><div class="card stat"><div class="kicker">Champions</div><div class="num">${all.filter(e => e.champion).length}</div></div>
      <div class="card stat"><div class="kicker">Certified</div><div class="num">${certified}</div></div><div class="card stat"><div class="kicker">Points issued</div><div class="num">${numFmt(all.reduce((a, e) => a + e.points, 0))}</div></div></div>
    <div class="card row" style="align-items:flex-end">
      <label class="field"><span class="small muted">City</span><select class="input" data-champ="city"><option value="">All cities</option>${cities.map(c => `<option ${f.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="field"><span class="small muted">Trained on</span><select class="input" data-champ="cat"><option value="">Any product</option>${CATS.map(c => `<option ${f.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <div class="grow"></div><button class="btn primary" data-act="champ-send">Send WhatsApp to these ${rows.length}</button></div>
    ${table(['Name', 'Dealer', 'City', 'Role', 'Champion', 'Points', 'Trainings'], rows.slice(0, 40).map(e => ({ href: `#/dealer/${e.dealer}/people`, cells: [`${esc(e.name)} ${demo}`, esc(DL[e.dealer].name), esc(e.city), esc(e.role), e.champion ? '<span class="badge ok">Yes</span>' : '—', e.points, e.trainings.length] })))}
    <div class="phase2"><b>Phase 2:</b> points → rewards catalogue, league tables and Champion performance in AI Analysis.</div></div>`;
};
EM.VIEWS.champions.tab = 'dealers';
document.addEventListener('change', e => { const el = e.target.closest('[data-champ]'); if (el) { EM.champ[el.dataset.champ] = el.value; EM.rerender(); } });
EM.ACTIONS['champ-send'] = () => {
  const f = EM.champ, n = D.dealer_employee.filter(e => (!f.city || e.city === f.city) && (!f.cat || e.trainings.some(t => TRN.find(x => x.id === t).category === f.cat))).length;
  EM.toast(`<b>Sent to ${n} dealer employees</b><ul><li>Segment: ${f.city || 'all cities'} · ${f.cat ? 'trained on ' + f.cat : 'any product'}</li><li>Template <code>champion_product_update</code> (utility) with the new ${f.cat || 'range'} launch video</li><li>Opt-outs respected automatically</li></ul>`);
};

// ---------------------------------------------------------------- displays (§20)
EM.VIEWS.displays = () => {
  const rows = D.display.filter(x => seeDealer(DL[x.dealer])).sort((a, b) => a.replacement_due.localeCompare(b.replacement_due));
  const overdue = rows.filter(x => due(x.replacement_due)), soon = rows.filter(x => !due(x.replacement_due) && due(x.replacement_due, 60));
  return `<div class="stack">${dnav('displays')}
    <div class="stack-s"><h1>Displays</h1><p class="muted">Every EGO display at every dealer — what it cost, its condition, photos and when it must be replaced.</p></div>
    <div class="grid g4"><div class="card stat"><div class="kicker">Displays</div><div class="num">${rows.length}</div><span class="small muted">${inr(rows.reduce((a, x) => a + x.cost, 0))} invested</span></div>
      <div class="card stat"><div class="kicker">Replacement overdue</div><div class="num" style="color:var(--bad)">${overdue.length}</div></div>
      <div class="card stat"><div class="kicker">Due in 60 days</div><div class="num">${soon.length}</div></div>
      <div class="card stat"><div class="kicker">Worn or damaged</div><div class="num">${rows.filter(x => x.condition !== 'Good').length}</div></div></div>
    ${table(['Dealer', 'Category', 'Type', 'Cost', 'Condition', 'Photos', 'Last inspection', 'Replace by', ''], rows.slice(0, 40).map(x => [`<a href="#/dealer/${x.dealer}/samples">${esc(DL[x.dealer].name)}</a>`, esc(x.category), esc(x.type), inr(x.cost),
      x.condition === 'Good' ? 'Good' : `<span class="badge warn">${x.condition}</span>`, x.photos, ds(x.last_inspection), due(x.replacement_due, 60) ? `<span class="badge ${due(x.replacement_due) ? 'bad' : 'warn'}">${ds(x.replacement_due)}</span>` : ds(x.replacement_due),
      `<button class="btn sm" data-act="inspect" data-x="${x.id}">Log inspection</button>`]))}
    <p class="small muted">Sales before vs after a new display is compared automatically once 90 days of orders exist.</p></div>`;
};
EM.VIEWS.displays.tab = 'dealers';

// ---------------------------------------------------------------- samples (§19)
EM.VIEWS.samples = () => {
  const types = ['dealer'].concat(canDiv('retail') && EM.div === 'both' ? ['architect', 'consumer', 'project'] : []);
  const sum = types.map(t => { const xs = D.sample.filter(x => x.recipient_type === t); const conv = xs.filter(x => x.result === 'Converted'); return { t, n: xs.length, cost: xs.reduce((a, x) => a + x.cost, 0), conv: conv.length, value: conv.reduce((a, x) => a + x.order_value, 0) }; });
  const recip = x => ({ dealer: () => `<a href="#/dealer/${x.recipient}">${esc(DL[x.recipient].name)}</a>`, architect: () => `<a href="#/architect/${x.recipient}">${esc(ARCH[x.recipient].name)}</a>`,
    consumer: () => `<a href="#/lead/${x.recipient}">${esc(LEAD[x.recipient].name)}</a>`, project: () => `<a href="#/project/${x.recipient}">${esc(PROJ[x.recipient].name)}</a>` })[x.recipient_type]();
  return `<div class="stack">${dnav('samples')}
    <div class="stack-s"><h1>Samples</h1><p class="muted">Who got samples, what they cost, and what they turned into.</p></div>
    ${table(['Given to', 'Samples', 'Cost', 'Converted', 'Orders after', 'Return on sample spend'], sum.map(s => [s.t[0].toUpperCase() + s.t.slice(1) + 's', s.n, inr(s.cost), `${s.conv} (${Math.round(s.conv / s.n * 100)}%)`, inr(s.value), `${Math.round(s.value / s.cost)}×`]))}
    <section class="stack-s"><h3>Recent samples</h3>${table(['Date', 'Design', 'Recipient', 'Qty', 'Cost', 'Follow-up', 'Result'], D.sample.filter(x => types.includes(x.recipient_type) && (x.recipient_type !== 'dealer' || seeDealer(DL[x.recipient]))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25).map(x => [dFmt(x.at),
      `<div class="row" style="flex-wrap:nowrap">${thumb(SKU[x.sku])}<span>${esc(SKU[x.sku].collection)}<br><span class="small muted">${esc(SKU[x.sku].design)}</span></span></div>`, recip(x), x.qty, inr(x.cost),
      x.result === 'Follow-up due' && due(x.follow_up) ? `<span class="badge warn">${ds(x.follow_up)}</span>` : ds(x.follow_up), esc(x.result)]))}</section></div>`;
};
EM.VIEWS.samples.tab = 'dealers';

// ---------------------------------------------------------------- training & certification (§21)
EM.VIEWS.training = () => {
  const aud = { dealer_employee: 'Dealer employees', installer: 'Installers', architect: 'Architects' };
  const expiring = TRN.filter(t => t.division === 'wholesale').flatMap(t => t.attendees.filter(a => a.certified && due(a.expires, 60)).map(a => ({ ...a, course: t.course, audience: t.audience }))).sort((a, b) => a.expires.localeCompare(b.expires));
  return `<div class="stack">${dnav('training')}
    <div class="stack-s"><h1>Training &amp; certification</h1><p class="muted">Courses for dealer staff, installers and architects — scores, certificates and retraining when they expire.</p></div>
    <section class="stack-s"><h3>Sessions</h3>${table(['Course', 'Audience', 'Date', 'City', 'Trainer', 'Attended', 'Certified', 'Avg score'], TRN.filter(t => t.division === 'wholesale').sort((a, b) => b.at.localeCompare(a.at)).map(t => [esc(t.course), aud[t.audience], dFmt(t.at), t.city, esc(t.trainer),
      t.attendees.length, t.attendees.filter(a => a.certified).length, Math.round(t.attendees.reduce((s, a) => s + a.score, 0) / t.attendees.length)]))}</section>
    <section class="stack-s"><div class="row between"><h3>Certificates expired or expiring in 60 days</h3><button class="btn" data-act="retrain">Schedule retraining for all ${expiring.length}</button></div>
      ${expiring.length ? table(['Person', 'Audience', 'Course', 'Expires'], expiring.map(a => [esc(whoName(a.who)), aud[a.audience], esc(a.course), `<span class="badge ${due(a.expires) ? 'bad' : 'warn'}">${ds(a.expires)}</span>`])) : '<p class="muted">Nothing expiring.</p>'}</section></div>`;
};
EM.VIEWS.training.tab = 'dealers';
EM.ACTIONS.retrain = () => EM.toast('<b>Retraining scheduled</b><ul><li>Invites sent on WhatsApp with 3 date options</li><li>Installers with expired certificates are flagged in crew allocation until retrained</li></ul>');

// ---------------------------------------------------------------- Project Partner finder (§14)
EM.partner ||= { project: '', city: '', cat: 'SPC' };
const partnerScore = (d, city, cat) => {
  const why = [], m = MK[d.market]; let s = 0;
  const add = (pts, txt) => { s += pts; why.push([pts, txt]); };
  if (m.city === city) add(35, `Same city (${city})`); else if (D.market.find(x => x.city === city && x.region === m.region)) add(12, `Same region (${m.region})`);
  if (d.project_partner === 'Yes') add(20, 'Approved project partner'); else if (d.project_partner === 'Potential') add(8, 'Potential project partner');
  if (d.categories.includes(cat)) add(15, `Already sells ${cat}`);
  if (d.own_installers >= 3) add(10, `${d.own_installers} own installers`);
  if (d.warehouse_sqft >= 3000) add(6, `${numFmt(d.warehouse_sqft)} sq ft warehouse`);
  add({ Platinum: 10, A: 6, B: 2, C: 0 }[d.grade], `${d.grade} grade`);
  const past = D.project.filter(p => p.partner_dealer === d.id && ['Completed', 'Collection'].includes(p.stage)).length;
  if (past) add(8 * Math.min(past, 2), `${past} completed project${past > 1 ? 's' : ''}`);
  if (d.overdue) add(-12, `${inr(d.overdue)} overdue in Tally`);
  return { d, s, why };
};
EM.VIEWS.partner = arg => {
  const f = EM.partner;
  if (arg && DL[arg]) { f.city = MK[DL[arg].market].city; f.focus = arg; }
  const open = D.project.filter(p => p.stage_idx < 8 && p.stage !== 'Lost');
  if (f.project && PROJ[f.project]) { f.city = MK[PROJ[f.project].market].city; f.cat = SKU[PROJ[f.project].spec[0].sku].category; }
  f.city ||= 'Mumbai';
  const ranked = D.dealer.map(d => partnerScore(d, f.city, f.cat)).sort((a, b) => b.s - a.s).slice(0, 5);
  return `<div class="stack">${pnav('partner')}
    <div class="stack-s"><h1>Project Partner finder</h1><p class="muted" style="max-width:760px">Project + city + product → the dealers best placed to supply, install and collect. Every ranking shows its reasons; nothing is a black box.</p></div>
    <div class="card row" style="align-items:flex-end">
      <label class="field grow"><span class="small muted">Project (optional)</span><select class="input" data-partner="project"><option value="">— choose a project —</option>${open.map(p => `<option value="${p.id}" ${f.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
      <label class="field"><span class="small muted">City</span><select class="input" data-partner="city">${[...new Set(D.market.map(m => m.city))].sort().map(c => `<option ${f.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="field"><span class="small muted">Product</span><select class="input" data-partner="cat">${CATS.map(c => `<option ${f.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
    <ol class="steps" id="partner-results">${ranked.map((r, i) => `<li><div class="card stack-s ${r.d.id === f.focus ? '' : ''}"><div class="row between"><a href="#/dealer/${r.d.id}"><b>${esc(r.d.name)}</b></a><span class="badge ${i ? 'plain' : 'ok'}">Score ${r.s}</span></div>
      <div>${r.why.map(([p, t]) => `<span class="chip">${p > 0 ? '+' : ''}${p} · ${esc(t)}</span>`).join('')}</div></div></li>`).join('')}</ol>
    <p class="small muted">Rule-based today (weights editable by the admin). Once enough projects close, AI Analysis learns which factors actually predict on-time, profitable delivery.</p></div>`;
};
EM.VIEWS.partner.tab = 'dealers';
document.addEventListener('change', e => { const el = e.target.closest('[data-partner]'); if (el) { if (el.dataset.partner !== 'project') EM.partner.project = ''; EM.partner[el.dataset.partner] = el.value; location.hash = '#/partner'; EM.rerender(); } });

document.addEventListener('input', e => {
  if (e.target.id !== 'vq') return;
  EM.dealerFilter.q = e.target.value; EM.rerender();
  const el = qs('#vq'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
});
