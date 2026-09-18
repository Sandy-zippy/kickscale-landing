'use strict';
/* Projects (spec §12 Designer & Architect · §13 Project CRM · §22.9 multi-site rollout). Mock screens on sample data. */

const P_STAGES = ['Identified', 'Qualified', 'Sample', 'Specification', 'Approval', 'Quotation', 'Negotiation', 'Won', 'Execution', 'Installation', 'Collection', 'Completed'];
const P_TYPES = ['Builder', 'Hotel', 'Corporate', 'Retail', 'Other'];
const LOST_REASONS = ['Price', 'Competitor spec’d by architect', 'Project on hold', 'Delivery timeline', 'Credit terms'];
const PROJECT_NAV = [['pipeline', 'Project pipeline', '#/projects'], ['partner', 'Project Partner finder', '#/partner']];
const pnav = cur => subnav(PROJECT_NAV, cur);
const siteOf = id => D.site.find(s => s.id === id);
const siteDone = s => s.progress.reduce((a, p) => a + p.installed_sqft, 0);
const sitePlanned = s => (s.boq.length ? s.boq[s.boq.length - 1].qty_sqft : s.survey ? s.survey.area_sqft : 0);

// ---------------------------------------------------------------- pipeline board + list
EM.proj ||= { type: '' };
EM.VIEWS.projects = () => {
  const ps = D.project.filter(seeProject).filter(p => !EM.proj.type || p.type === EM.proj.type);
  const open = ps.filter(p => p.stage_idx < 7 && p.stage !== 'Lost');
  const weighted = open.reduce((a, p) => a + p.value * p.probability / 100, 0);
  return `<div class="stack">${pnav('pipeline')}
    <div class="row between"><div class="stack-s"><h1>Projects</h1><p class="muted">${ps.length} projects · stages are configurable ${demo}</p></div>
      <div class="seg">${['', ...P_TYPES].map(t => `<button class="${EM.proj.type === t ? 'on' : ''}" data-act="ptype" data-t="${t}">${t || 'All types'}</button>`).join('')}</div></div>
    <div class="grid g4"><div class="card stat"><div class="kicker">Open pipeline</div><div class="num">${inr(open.reduce((a, p) => a + p.value, 0))}</div><span class="small muted">${open.length} projects · weighted ${inr(weighted)}</span></div>
      <div class="card stat"><div class="kicker">Awaiting special price</div><div class="num">${ps.filter(p => p.special_price && p.special_price.status === 'pending').length}</div></div>
      <div class="card stat"><div class="kicker">In execution</div><div class="num">${ps.filter(p => p.stage_idx >= 8 && p.stage_idx < 11).length}</div><span class="small muted">${ps.reduce((a, p) => a + p.sites.length, 0)} installation sites</span></div>
      <div class="card stat"><div class="kicker">To collect</div><div class="num">${inr(ps.reduce((a, p) => a + p.billed - p.collected, 0))}</div></div></div>
    ${frame('Projects › Pipeline', `<div class="board">${[...P_STAGES, 'Lost'].map(st => { const ls = ps.filter(p => p.stage === st); return `<div class="lane"><h4><span>${st}</span><span class="muted">${ls.length}</span></h4>
      ${ls.slice(0, 4).map(p => `<div class="mini" data-href="#/project/${p.id}" tabindex="0"><b>${esc(p.name.replace(' (sample)', ''))}</b><div class="muted">${p.type} · ${inr(p.value)}</div><div class="muted">${esc(ARCH[p.org.architect].name)}</div></div>`).join('')}
      ${ls.length > 4 ? `<div class="small muted" style="margin-top:6px">+ ${ls.length - 4} more</div>` : ''}</div>`; }).join('')}</div>`)}
  </div>`;
};
EM.ACTIONS.ptype = el => { EM.proj.type = el.dataset.t; EM.rerender(); };

// ---------------------------------------------------------------- project page
const P_TABS = [['overview', 'Overview'], ['spec', 'Specification'], ['quotes', 'Quotations'], ['sites', 'Installation sites'], ['collections', 'Dispatch & collections']];
EM.VIEWS.project = arg => {
  const [id, tab = 'overview'] = arg.split('/'), p = PROJ[id];
  if (!p) return '<p>Project not found.</p>';
  if (!seeProject(p)) return EM.noAccess('This project is outside your data scope.');
  return `<div class="stack">${pnav('pipeline')}${crumbs(['Projects', '#/projects'], [p.name])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(p.name)}</h1>
      <div class="row"><span class="badge plain">${p.type}</span><span class="badge ${p.stage === 'Lost' ? 'bad' : 'ok'}">${p.stage}</span><span class="small muted">${inr(p.value)} · ${p.probability}% · ${esc(market(p.market))} · ${p.company === 'co_ego' ? 'EGO Premium' : 'Big E'}</span></div></div>
      <div class="row"><select class="input" id="move-stage" aria-label="Move to stage" style="width:auto">${[...P_STAGES, 'Lost'].map(s => `<option ${s === p.stage ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="btn primary" data-act="move-stage" data-p="${id}">Move stage</button></div></div>
    <div style="overflow-x:auto">${flow(P_STAGES, p.stage)}</div>
    ${p.stage === 'Lost' ? `<div class="callout warn"><b>Lost:</b> ${esc(p.lost_reason)}</div>` : ''}
    ${subtabs(`#/project/${id}`, tab, P_TABS)}
    ${(P_TAB[tab] || P_TAB.overview)(p)}</div>`;
};
EM.VIEWS.project.tab = 'projects';
EM.VIEWS.project.title = a => (PROJ[a.split('/')[0]] || { name: 'Project' }).name;

const P_TAB = {
  overview: p => `<div class="grid g2">
    <section class="card stack-s"><h3>Organisation &amp; contacts</h3>${kv([['Client', p.client ? `<a href="#/client/${p.client}">${esc(D.client.find(c => c.id === p.client).name)}</a>` : '—'], ['Client owner', esc(p.org.owner) + ' ' + demo], ['Purchase manager', esc(p.org.purchase_manager)], ['Project manager', esc(p.org.project_manager)],
      ['Architect / designer', `<a href="#/architect/${p.org.architect}">${esc(ARCH[p.org.architect].name)}</a> · <a href="#/firm/${ARCH[p.org.architect].firm}">${esc(FIRM[ARCH[p.org.architect].firm].name)}</a>`], ['Contractor', esc(p.org.contractor)]])}</section>
    <section class="card stack-s"><h3>Commercial</h3>${kv([['Potential value', inr(p.value)], ['Probability', `${p.probability}%`], ['Expected closing', ds(p.close)], ['Expected GP', masked(`${Math.round(p.expected_gp_pct * 100)}% <span class="small muted">· Owner, Director, Retail Head, Finance</span>`)],
      ['Payment terms', esc(p.payment_terms)], ['EGO owner', esc(EMP[p.owner].name)], ['Project partner dealer', `<a href="#/dealer/${p.partner_dealer}">${esc(DL[p.partner_dealer].name)}</a> · <a href="#/partner">compare partners</a>`],
      ['Supply', esc(p.supplier)]])}</section></div>`,

  spec: p => {
    const smp = D.sample.filter(x => x.recipient === p.id);
    return `<div class="stack"><section class="stack-s"><h3>Products specified</h3><div class="grid g3">${p.spec.map(l => { const s = SKU[l.sku], st = STOCK[l.sku]; return `<div class="card prod">${thumb(s, 'lg')}
      <div><h4>${esc(s.collection)} · ${esc(s.design)}</h4><span class="small muted">${esc(s.category)} · ${s.code}</span><div>${numFmt(l.sqft)} ${esc(s.unit)} · ${inr(l.sqft * s.dealer_price)}</div>
      <div class="small">${st.on_hand - st.committed >= l.sqft ? '<span class="badge ok">Stock available</span>' : `<span class="badge warn">Needs ${numFmt(l.sqft - Math.max(0, st.on_hand - st.committed))} more · incoming ${st.eta}</span>`}</div></div></div>`; }).join('')}</div></section>
      <div class="grid g2"><section class="card stack-s"><h3>Competition</h3><div>${p.competitors.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div></section>
      <section class="card stack-s"><h3>Samples to this project</h3>${smp.length ? smp.map(x => `<div class="row">${thumb(SKU[x.sku])}<span>${esc(SKU[x.sku].collection)} ${esc(SKU[x.sku].design)} · ${dFmt(x.at)} · ${esc(x.result)}</span></div>`).join('') : '<p class="muted">None logged.</p>'}</section></div></div>`;
  },

  quotes: p => {
    const sp = p.special_price;
    return `<div class="stack"><section class="stack-s"><div class="row between"><h3>Quotation history</h3><button class="btn" data-act="quote-rev" data-p="${p.id}">Upload revision</button></div>
      ${p.quotes.length ? table(['Version', 'Date', 'Value', 'Discount', 'Status', 'File'], p.quotes.map(q => [`v${q.v}`, dFmt(q.at), inrFull(q.value), `${q.discount_pct}%`, `<span class="badge ${q.status === 'accepted' ? 'ok' : q.status === 'sent' ? 'info' : 'plain'}">${q.status}</span>`, `<code>${esc(q.file)}</code>`])) : '<p class="muted">No quotation yet — first version is uploaded at the Quotation stage.</p>'}</section>
      <section class="card stack-s"><h3>Special-price approval</h3>
      ${sp ? kv([['Requested', `${sp.requested_pct}% extra discount`], ['Reason', esc(sp.reason)], ['Route', esc(sp.route)], ['Status', sp.status === 'approved' ? `<span class="badge ok">Approved by ${esc(EMP[sp.approver].name)}</span>` : `<span class="badge warn">Pending</span>`],
        ['GP after discount', `${Math.round((p.expected_gp_pct - sp.requested_pct / 100) * 100)}% <span class="small muted">(was ${Math.round(p.expected_gp_pct * 100)}%)</span>`]])
        + (sp.status === 'pending' ? `<div class="row"><button class="btn primary" data-act="sp-approve" data-p="${p.id}">Approve as Retail Head</button><button class="btn" data-act="sp-reject" data-p="${p.id}">Reject</button></div>` : '')
        : `<div class="stack-s"><div class="row" style="align-items:flex-end"><label class="field"><span class="small muted">Extra discount %</span><input class="input" id="sp-pct" type="number" min="1" max="20" value="4" style="width:110px"></label>
          <label class="field grow"><span class="small muted">Reason (required)</span><input class="input" id="sp-reason" placeholder="e.g. Competitor quoted 6% lower"></label>
          <button class="btn primary" data-act="sp-request" data-p="${p.id}">Request approval</button></div><div id="sp-err" class="small" style="color:var(--bad)"></div></div>`}
      <div class="phase2"><b>Phase 2:</b> the full Approval &amp; Authority Matrix (credit, samples, displays, marketing support, scheme exceptions) with configurable limits.</div></section></div>`;
  },

  sites: p => {
    const ss = p.sites.map(siteOf);
    if (!ss.length) return `<div class="callout">Sites are created when the project is won — one installation job per site. For store rollouts, import all sites at once.</div>
      <button class="btn" data-act="bulk-import" data-p="${p.id}">Bulk import sites (CSV)</button>`;
    const planned = ss.reduce((a, s) => a + sitePlanned(s), 0), done = ss.reduce((a, s) => a + siteDone(s), 0);
    const cnt = (f) => ss.filter(f).length;
    return `<div class="stack">
      <div class="row between"><h3>${ss.length} site${ss.length > 1 ? 's' : ''} · rolled up</h3><div class="row"><button class="btn" data-act="bulk-import" data-p="${p.id}">Bulk import sites (CSV)</button><a class="btn" href="#/installation">Installation dashboard →</a></div></div>
      <div class="tiles">
        <div class="tile"><span class="kicker">Installed</span><div class="num">${planned ? Math.round(done / planned * 100) : 0}%</div><span class="small muted">${numFmt(done)} / ${numFmt(planned)} sq ft</span></div>
        <div class="tile"><span class="kicker">Pending survey</span><div class="num">${cnt(s => s.step <= 1)}</div></div><div class="tile"><span class="kicker">Waiting material</span><div class="num">${cnt(s => s.step >= 6 && s.step <= 8)}</div></div>
        <div class="tile"><span class="kicker">In progress</span><div class="num">${cnt(s => s.step >= 11 && s.step <= 13)}</div></div><div class="tile"><span class="kicker">Open snags</span><div class="num">${ss.reduce((a, s) => a + s.snags.filter(x => x.status === 'Open').length, 0)}</div></div>
        <div class="tile"><span class="kicker">Signed off</span><div class="num">${cnt(s => s.step >= 15)}</div></div></div>
      ${table(['Site', 'Step', 'Installer', 'Progress', 'Snags', 'Delay'], ss.map(s => ({ href: `#/site/${s.id}`, cells: [esc(s.name), `${s.step + 1}/18 · ${esc(SITE_STEPS[s.step])}`, s.installer ? esc(INST[s.installer].name) : '<span class="badge warn">Unassigned</span>',
        `<div class="bar ok" style="width:110px"><b style="width:${sitePlanned(s) ? Math.round(siteDone(s) / sitePlanned(s) * 100) : 0}%"></b></div>`, s.snags.filter(x => x.status === 'Open').length || '—', s.delays.length ? `<span class="badge warn">${esc(s.delays[s.delays.length - 1].reason)}</span>` : '—'] })))}</div>`;
  },

  collections: p => {
    const ss = p.sites.map(siteOf);
    const disp = ss.reduce((a, s) => a + s.material.dispatched, 0), need = ss.reduce((a, s) => a + s.material.planned, 0);
    return `<div class="grid g2"><section class="card stack-s"><h3>Order &amp; dispatch</h3>${ss.length ? kv([['Material planned', `${numFmt(need)} sq ft`], ['Dispatched', `${numFmt(disp)} sq ft`], ['Supply from', esc(p.supplier)], ['Orders in Tally', `${Math.max(1, Math.ceil(ss.length / 3))} sales orders (sample)`]]) : '<p class="muted">Dispatch starts after the order is won.</p>'}</section>
      <section class="card stack-s"><h3>Collections</h3>${kv([['Terms', esc(p.payment_terms)], ['Billed', inr(p.billed)], ['Collected', inr(p.collected)], ['Outstanding', p.billed - p.collected ? `<b style="color:var(--bad)">${inr(p.billed - p.collected)}</b>` : '—']])}
        <p class="small muted">Invoices and receipts come from Tally; nobody types them twice.</p></section></div>`;
  },
};

EM.ACTIONS['move-stage'] = el => {
  const p = PROJ[el.dataset.p], to = qs('#move-stage').value;
  if (to === p.stage) return;
  if (to === 'Lost') {
    EM.modal(`<h2>Why was it lost?</h2><p class="muted">A lost reason is required — it feeds win/loss analysis.</p><div class="stack" style="margin-top:12px">
      <div class="reason">${LOST_REASONS.map(r => `<label class="chip" style="padding:8px"><input type="radio" name="lost" value="${esc(r)}"> ${esc(r)}</label>`).join('')}</div>
      <div id="lost-err" class="small" style="color:var(--bad)"></div><div class="row"><button class="btn primary" data-act="lost-save" data-p="${p.id}">Mark as lost</button><button class="btn" data-act="close-modal">Cancel</button></div></div>`);
    return;
  }
  p.stage = to; p.stage_idx = P_STAGES.indexOf(to); p.probability = Math.max(p.probability, [10, 20, 30, 40, 50, 60, 75, 100, 100, 100, 100, 100][p.stage_idx]);
  EM.toast(`Moved to <b>${esc(to)}</b>${p.stage_idx === 7 ? ' — installation sites can now be created' : ''}.`);
  EM.rerender();
};
EM.ACTIONS['lost-save'] = el => {
  const r = document.querySelector('input[name="lost"]:checked');
  if (!r) { qs('#lost-err').textContent = 'Choose a reason to continue.'; return; }
  const p = PROJ[el.dataset.p];
  Object.assign(p, { stage: 'Lost', lost_reason: r.value, probability: 0 });
  EM.closeModal(); EM.toast(`Marked lost · reason “${esc(r.value)}” recorded.`); EM.rerender();
};
EM.ACTIONS['quote-rev'] = el => {
  const p = PROJ[el.dataset.p], last = p.quotes[0];
  p.quotes.forEach(q => { if (q.status === 'sent') q.status = 'superseded'; });
  const v = last ? last.v + 1 : 1, value = last ? Math.round(last.value * 0.98) : Math.round(p.value * 1.08);
  p.quotes.unshift({ v, at: stamp(), value, discount_pct: last ? last.discount_pct + 2 : 0, status: 'sent', file: `EGO-QT-${4000 + EM.tick}-v${v}.xlsx` });
  EM.toast(`<b>Quotation v${v} uploaded</b><ul><li>Value ${inrFull(value)} — project value updated</li><li>Previous version kept as history</li></ul>`); EM.rerender();
};
EM.ACTIONS['sp-request'] = el => {
  const p = PROJ[el.dataset.p], pct = +qs('#sp-pct').value, reason = qs('#sp-reason').value.trim();
  if (!reason) { qs('#sp-err').textContent = 'A reason is required for a special price.'; return; }
  p.special_price = { requested_pct: pct, reason, status: 'pending', route: pct > 5 ? 'Retail Head → Owner (above 5%)' : 'Retail Head (up to 5%)', approver: null };
  EM.toast(`<b>Sent for approval</b><ul><li>Routed to ${pct > 5 ? 'Retail Head, then Owner' : 'Retail Head'} — WhatsApp + task</li><li>GP impact shown to the approver</li></ul>`); EM.rerender();
};
EM.ACTIONS['sp-approve'] = el => { const sp = PROJ[el.dataset.p].special_price; Object.assign(sp, { status: 'approved', approver: D.story.users.rt_head }); EM.toast('Approved — logged with approver, time and GP impact (audit trail).'); EM.rerender(); };
EM.ACTIONS['sp-reject'] = el => { PROJ[el.dataset.p].special_price = null; EM.toast('Rejected — the owner is notified with the reason.'); EM.rerender(); };
EM.ACTIONS['bulk-import'] = el => {
  const p = PROJ[el.dataset.p];
  EM.modal(`<h2>Bulk import sites</h2><p class="muted">Paste or upload a CSV — one row per site. Each row becomes an installation job using the “${p.type === 'Retail' ? 'Retail store standard' : 'Standard site'}” template.</p>
    <textarea id="csv" class="input mono" rows="7" style="margin:12px 0">site,city,area_sqft,planned_start
Store 101 Andheri,Mumbai,1800,2026-10-05
Store 102 Vashi,Navi Mumbai,1650,2026-10-07
Store 103 Baner,Pune,2100,2026-10-12
Store 104 Thane West,Thane,1750,2026-10-14
Store 105 Kharghar,Navi Mumbai,1600,2026-10-19</textarea>
    <div class="row"><button class="btn primary" data-act="bulk-save" data-p="${p.id}">Import sites</button><button class="btn" data-act="close-modal">Cancel</button></div>`);
};
EM.ACTIONS['bulk-save'] = el => {
  const p = PROJ[el.dataset.p], rows = qs('#csv').value.trim().split('\n').slice(1).map(r => r.split(',')).filter(r => r.length >= 4 && +r[2]);
  rows.forEach(([name, city, area, start]) => {
    const m = D.market.find(x => x.city === city.trim()) || D.market[0];
    const s = { id: 'sit_imp' + (EM.tick++), project: p.id, name: name.trim(), market: m.id, step: 0, sku: p.spec[0].sku, survey: null, boq: [], installer: null,
      schedule: { planned_start: start.trim(), planned_end: start.trim(), actual_start: null, actual_end: null, manpower_planned: null, manpower_deployed: null },
      material: { planned: 0, ordered: 0, dispatched: 0, received: 0, consumed: 0 }, readiness: [], progress: [], snags: [], signoff: null, billing: null, cost: null, delays: [], imported_area: +area };
    D.site.push(s); p.sites.push(s.id);
  });
  EM.closeModal();
  EM.toast(`<b>${rows.length} sites imported</b><ul><li>Each has its own survey, BOQ, crew, material, progress, snags and sign-off</li><li>Survey requests sent to the project team</li></ul>`);
  location.hash = `#/project/${p.id}/sites`; EM.rerender();
};

// ---------------------------------------------------------------- architects & design firms (§12)
EM.VIEWS.architects = () => {
  const rows = D.architect.map(a => ({ a, ps: D.project.filter(p => p.org.architect === a.id) })).sort((x, y) => y.ps.length - x.ps.length || (y.a.design500 - x.a.design500));
  return `<div class="stack">${pnav('architects')}
    <div class="stack-s"><h1>Architects &amp; design firms</h1><p class="muted">${D.architect.length} architects in ${D.design_firm.length} firms · ${D.architect.filter(a => a.design500).length} in Design 500</p></div>
    ${table(['Architect', 'Firm', 'City', 'Focus', 'Design 500', 'Potential', 'Projects', 'Next action'], rows.slice(0, 40).map(({ a, ps }) => ({ href: `#/architect/${a.id}`,
      cells: [`<b>${esc(a.name)}</b> ${demo}`, esc(FIRM[a.firm].name), esc(MK[a.market].city), esc(a.focus), a.design500 ? '<span class="badge ok">Yes</span>' : '—', a.potential, ps.length || '—', esc(a.next_action)] })))}</div>`;
};
EM.VIEWS.architects.tab = 'projects';
EM.VIEWS.architect = id => {
  const a = ARCH[id];
  if (!a) return '<p>Architect not found.</p>';
  const ps = D.project.filter(p => p.org.architect === id), smp = D.sample.filter(x => x.recipient === id);
  const skus = [...new Set(ps.flatMap(p => p.spec.map(l => l.sku)))];
  return `<div class="stack">${pnav('architects')}${crumbs(['Architects', '#/architects'], [a.name])}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(a.name)}</h1><div class="row">${a.design500 ? '<span class="badge ok">Design 500</span>' : '<span class="badge plain">Not in Design 500</span>'}<span class="badge plain">${a.potential} potential</span>${demo}</div>
      <p class="muted">${esc(FIRM[a.firm].name)} · ${esc(a.specialisation)} · ${esc(market(a.market))}</p></div><button class="btn primary" data-act="arch-meet" data-a="${id}">Log meeting</button></div>
    <div class="grid g2">
      <section class="card stack-s"><h3>Relationship</h3>${kv([['Owner', esc(EMP[a.owner].name)], ['Relationship', esc(a.relationship)], ['Connected dealers', a.connected_dealers.map(d => `<a href="#/dealer/${d}">${esc(DL[d].name)}</a>`).join('<br>')],
        ['Last contact', dFmt(a.last_contact)], ['Next action', `<b>${esc(a.next_action)}</b>`]])}</section>
      <section class="card stack-s"><h3>EGO products specified</h3>${skus.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">${skus.map(s => `<div class="prod">${thumb(SKU[s], 'lg')}<span class="small">${esc(SKU[s].collection)} · ${esc(SKU[s].design)}</span></div>`).join('')}</div>` : '<p class="muted">None yet.</p>'}</section></div>
    <section class="stack-s"><h3>Projects</h3>${ps.length ? table(['Project', 'Type', 'Stage', 'Value', 'Partner dealer'], ps.map(p => ({ href: `#/project/${p.id}`, cells: [esc(p.name), p.type, esc(p.stage), inr(p.value), esc(DL[p.partner_dealer].name)] }))) : '<p class="muted">No active projects.</p>'}</section>
    <section class="stack-s"><h3>Samples</h3>${smp.length ? table(['Date', 'Design', 'Result'], smp.map(x => [dFmt(x.at), `${thumb(SKU[x.sku])} ${esc(SKU[x.sku].collection)} · ${esc(SKU[x.sku].design)}`, esc(x.result)])) : '<p class="muted">No samples sent.</p>'}</section></div>`;
};
EM.VIEWS.architect.tab = 'projects';
EM.ACTIONS['arch-meet'] = el => { const a = ARCH[el.dataset.a]; a.last_contact = stamp(); EM.toast(`<b>Meeting logged</b><ul><li>Next action “${esc(a.next_action)}” set for 7 days with ${esc(EMP[a.owner].name)}</li><li>Voice note → summary from the phone app</li></ul>`); EM.rerender(); };
