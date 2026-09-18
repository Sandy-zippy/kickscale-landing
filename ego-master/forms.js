'use strict';
/* EGO Master — the create forms that were missing: a new order from anywhere (not just
   inside one dealer), a new dealer/distributor, and a new retail client.
   The order BUILDER itself already exists in dealers.js at #/order/<dealerId> — this only
   adds the doorway to it. Everything is in memory; a reload resets it.
   Vendors (the suppliers EGO buys from) are deliberately not managed here. */

const formErr = (id, t) => { const el = qs(id); if (el) el.textContent = t; };
const errLine = id => `<div class="small" id="${id.slice(1)}" style="color:var(--bad);min-height:18px"></div>`;
const phone10 = v => String(v || '').replace(/\D/g, '').slice(-10);
const fmtPhone = d10 => `+91 ${d10.slice(0, 5)} ${d10.slice(5)}`;

// ---------------------------------------------------------------- + New order (dealer picker)
const dealerNote = id => {
  const d = DL[id];
  if (!d) return '';
  const head = `${esc(d.type)} · ${esc(MK[d.market].city)} · ${esc(d.owner)}`;
  const credit = `outstanding ${inr(d.outstanding)} of ${inr(d.credit_limit)} limit`;
  return `${head}<br>${credit}${d.overdue ? ` · <b style="color:var(--bad)">${inr(d.overdue)} overdue</b>` : ''}`;
};
EM.ACTIONS['order-new'] = () => {
  const list = D.dealer.filter(seeDealer).slice().sort((a, b) => a.name.localeCompare(b.name));
  if (!list.length) return EM.toast('<b>No dealers in your scope</b><ul><li>You can only raise an order for a dealer you own.</li></ul>');
  EM.modal(`<h2>New order</h2>
    <p class="muted">Pick who the order is for. The builder opens with their categories, dealer prices and live stock.</p>
    <form id="nf" class="form" onsubmit="return false" style="margin-top:16px">
      <label class="field"><span class="small muted">Dealer or distributor</span>
        <select class="input" id="nf-dealer">${list.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></label>
      <div class="small muted" id="nf-note">${dealerNote(list[0].id)}</div>
      <div class="row" style="margin-top:4px"><button class="btn primary" data-act="order-go">Open order builder</button>
        <button class="btn" data-act="close-modal">Cancel</button></div>
    </form>`);
};
EM.ACTIONS['order-go'] = () => { const id = qs('#nf-dealer').value; EM.closeModal(); location.hash = `#/order/${id}`; };
document.addEventListener('change', e => { if (e.target.id === 'nf-dealer') qs('#nf-note').innerHTML = dealerNote(e.target.value); });

// ---------------------------------------------------------------- + Add dealer / distributor
EM.ACTIONS['dealer-add'] = () => {
  const markets = D.market.slice().sort((a, b) => (a.city + a.name).localeCompare(b.city + b.name));
  EM.modal(`<h2>Add a dealer or distributor</h2>
    <p class="muted">Wholesale · EGO Premium — the people who sell EGO. Distributors buy direct; dealers and sub-dealers buy for wholesale.</p>
    <form id="df" class="form" onsubmit="return false" style="margin-top:16px">
      <div class="grid g2">
        <label class="field"><span class="small muted">Business name *</span><input class="input" name="name" placeholder="e.g. Shree Build Mart, Vashi"></label>
        <label class="field"><span class="small muted">Owner / contact *</span><input class="input" name="owner"></label>
        <label class="field"><span class="small muted">Mobile *</span><input class="input" name="phone" placeholder="10 digits"></label>
        <label class="field"><span class="small muted">Type *</span><select class="input" name="type"><option>Distributor</option><option selected>Dealer</option><option>Sub-dealer</option></select></label>
        <label class="field"><span class="small muted">City / market</span><select class="input" name="market">${markets.map(m => `<option value="${m.id}">${esc(m.city)} · ${esc(m.name)}</option>`).join('')}</select></label>
        <label class="field"><span class="small muted">Grade</span><select class="input" name="grade"><option>Platinum</option><option>A</option><option selected>B</option><option>C</option></select></label>
        <label class="field"><span class="small muted">GST number</span><input class="input" name="gst" placeholder="optional"></label>
        <label class="field"><span class="small muted">Credit limit (₹)</span><input class="input" name="credit" type="number" value="500000"></label>
      </div>
      ${errLine('#df-err')}
      <div class="row"><button class="btn primary" data-act="dealer-save">Add dealer</button><button class="btn" data-act="close-modal">Cancel</button></div>
    </form>`);
};
EM.ACTIONS['dealer-save'] = () => {
  const f = new FormData(qs('#df'));
  const name = String(f.get('name') || '').trim(), owner = String(f.get('owner') || '').trim(), d10 = phone10(f.get('phone'));
  if (!name || !owner || d10.length !== 10) return formErr('#df-err', 'Business name, owner and a 10-digit mobile are all needed.');
  const clash = D.dealer.find(x => phone10(x.phone) === d10);
  if (clash) return formErr('#df-err', `That mobile already belongs to ${clash.name}.`);
  const id = 'dea_new' + EM.tick, at = stamp();
  const d = {
    id, name, owner, phone: fmtPhone(d10), gst: String(f.get('gst') || '').trim().toUpperCase(),
    market: f.get('market'), grade: f.get('grade'), type: f.get('type'), company: 'co_ego', division: 'wholesale',
    priority200: false, p200_tier: '', field_owner: EM.meId, telesales_owner: null, specialist_owner: null, mgmt_owner: null,
    fy_sales: 0, ly_sales: 0, ltv_12m: 0, target_12m: 0, potential_3y: 0, potential_note: 'new — potential not assessed yet',
    categories: [], brands_sold: [], customer_types: [], competitors: [], contacts: [], parent: null,
    showroom: false, project_partner: 'No', warehouse_sqft: 0, display_area_sqft: 0, dealer_salespeople: 0,
    salespeople: 0, req_open: 0, own_installers: 0, service_capable: false,
    since: at.slice(0, 10), contact_every_days: 30, last_order: null, days_since_order: 0, orders_12m: 0,
    outstanding: 0, overdue: 0, credit_limit: Number(f.get('credit')) || 0, at_risk: false, demo: true,
  };
  D.dealer.push(d); DL[id] = d;
  EM.closeModal();
  EM.toast(`<b>${esc(name)} added</b><ul><li>${esc(d.type)} · ${esc(MK[d.market].city)} · assigned to ${esc(me().name)}</li>
    <li>Credit limit ${inr(d.credit_limit)} — ready to take an order</li><li>Appears in Dealers, and in the dealer picker on a new order</li></ul>`);
  location.hash = `#/dealer/${id}`;
};

// ---------------------------------------------------------------- + Add retail client
EM.ACTIONS['client-add'] = () => {
  const markets = D.market.slice().sort((a, b) => (a.city + a.name).localeCompare(b.city + b.name));
  const firms = D.design_firm.slice().sort((a, b) => a.name.localeCompare(b.name));
  const sources = [...new Set(D.client.map(c => c.source))].sort();
  EM.modal(`<h2>Add a retail client</h2>
    <p class="muted">Retail · Big E — homeowners, builders, hotels and corporates who buy directly.</p>
    <form id="cf" class="form" onsubmit="return false" style="margin-top:16px">
      <div class="grid g2">
        <label class="field"><span class="small muted">Name *</span><input class="input" name="name" placeholder="e.g. Rohit Malhotra"></label>
        <label class="field"><span class="small muted">Mobile *</span><input class="input" name="phone" placeholder="10 digits"></label>
        <label class="field"><span class="small muted">Type *</span><select class="input" name="type">${['Homeowner', 'Builder', 'Hotel', 'Corporate', 'Retail chain', 'Institution'].map(t => `<option>${t}</option>`).join('')}</select></label>
        <label class="field"><span class="small muted">City / market</span><select class="input" name="market">${markets.map(m => `<option value="${m.id}">${esc(m.city)} · ${esc(m.name)}</option>`).join('')}</select></label>
        <label class="field"><span class="small muted">Came from</span><select class="input" name="source">${sources.map(s => `<option ${s === 'Referral' ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
        <label class="field"><span class="small muted">Architect firm (optional)</span><select class="input" name="firm"><option value="">None</option>${firms.map(x => `<option value="${x.id}">${esc(x.name.replace(' (sample)', ''))}</option>`).join('')}</select></label>
      </div>
      ${errLine('#cf-err')}
      <div class="row"><button class="btn primary" data-act="client-save">Add client</button><button class="btn" data-act="close-modal">Cancel</button></div>
    </form>`);
};
EM.ACTIONS['client-save'] = () => {
  const f = new FormData(qs('#cf'));
  const name = String(f.get('name') || '').trim(), d10 = phone10(f.get('phone'));
  if (!name || d10.length !== 10) return formErr('#cf-err', 'A name and a 10-digit mobile are both needed.');
  const clash = D.client.find(x => phone10(x.phone) === d10);
  if (clash) return formErr('#cf-err', `That mobile already belongs to ${clash.name}.`);
  // status is an enum owned by the seed — reuse the most common value so the badge renders
  const status = Object.entries(D.client.reduce((m, c) => (m[c.status] = (m[c.status] || 0) + 1, m), {}))
    .sort((a, b) => b[1] - a[1])[0][0];
  const id = 'cli_new' + EM.tick;
  const c = {
    id, name, phone: fmtPhone(d10), type: f.get('type'), market: f.get('market'), source: f.get('source'),
    firm: f.get('firm') || null, architect: null, status, value: 0, projects: [], lead: null,
    created: stamp(), division: 'retail', demo: true,
  };
  D.client.push(c); CLIENT[id] = c;  // CLIENT is the byId map retail.js resolves #/client/<id> against
  EM.closeModal();
  EM.toast(`<b>${esc(name)} added</b><ul><li>${esc(c.type)} · ${esc(MK[c.market].city)} · from ${esc(c.source)}</li>
    <li>Shows in Retail clients under the Type filter</li></ul>`);
  location.hash = `#/client/${id}`;
};
