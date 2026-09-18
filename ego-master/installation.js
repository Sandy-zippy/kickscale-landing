'use strict';
/* Installation & site execution (spec §22.1–22.14) + complaints (§23). Mock screens on sample data. */

const SITE_STEPS = ['Site identified', 'Survey scheduled', 'Survey completed', 'Measurement & BOQ', 'Commercial approval', 'Installer allocated', 'Material confirmed',
  'Material dispatched', 'Material received', 'Site readiness', 'Installation scheduled', 'Installation started', 'Work in progress', 'Snagging',
  'Installation completed', 'Sign-off & handover', 'Billing & installer payment', 'Warranty / service'];
const READY_ITEMS = ['Civil & electrical work complete', 'Subfloor level (±3 mm / 2 m)', 'Moisture below limit', 'Painting / false ceiling done', 'Secure storage for material', 'Lift / access for material', 'Site contact available'];
const DELAYS = ['Customer / site not ready', 'Material shortage', 'Installer unavailable', 'Transport', 'Design / measurement change'];
const SNAGS = ['Uneven joint', 'Gap at skirting', 'Scratch / chip', 'Squeaking', 'Colour variation', 'Swelling near wet area'];
const INSTALL_NAV = [['dashboard', 'Dashboard', '#/installation'], ['schedule', 'Crew schedule', '#/schedule'], ['installers', 'Installers', '#/installers'], ['complaints', 'Complaints', '#/complaints'], ['siteapp', 'Site-team app', '#/siteapp']];
const inav = cur => subnav(INSTALL_NAV, cur);
const S_ = id => D.site.find(s => s.id === id);
const pctOf = s => sitePlanned(s) ? Math.min(100, Math.round(siteDone(s) / sitePlanned(s) * 100)) : 0;
const openSnags = s => s.snags.filter(x => x.status === 'Open');
const notReady = s => s.readiness.some(r => r.ok === false);
const dayStr = d => d.toISOString().slice(0, 10);
const TODAY = D.now.slice(0, 10);
const expectedEnd = s => {
  if (!s.schedule) return '—';
  if (s.schedule.actual_end) return ds(s.schedule.actual_end);
  const left = sitePlanned(s) - siteDone(s), rate = s.progress.length ? siteDone(s) / s.progress.length : (s.installer ? INST[s.installer].capacity_sqft_day : 0);
  if (!s.progress.length || !rate) return ds(s.schedule.planned_end);
  return ds(dayStr(new Date(NOW.getTime() + Math.ceil(left / rate) * 864e5)));
};

// dashboard buckets (§22.11) — one definition, used by tiles, lists and checks
const BUCKETS = [
  ['survey', 'Pending survey', s => s.step <= 1],
  ['boq', 'Waiting BOQ / approval', s => s.step === 3 || s.step === 4],
  ['material', 'Waiting for material', s => s.step >= 6 && s.step <= 8],
  ['notready', 'Site not ready', s => notReady(s) && s.step <= 10],
  ['week', 'Starting this week', s => s.step === 10 && s.schedule && s.schedule.planned_start >= TODAY && s.schedule.planned_start <= dayStr(new Date(NOW.getTime() + 7 * 864e5))],
  ['progress', 'In progress', s => s.step >= 11 && s.step <= 12],
  ['delayed', 'Delayed', s => s.delays.length && s.step < 14],
  ['snags', 'Open snags', s => openSnags(s).length && s.step <= 14],
  ['signoff', 'Sign-off pending', s => s.step === 14],
  ['billing', 'Billing / installer payment', s => s.step === 15 || s.step === 16],
];

// ---------------------------------------------------------------- dashboard + KPIs
EM.VIEWS.installation = arg => {
  const sites = D.site.filter(seeSite), bucket = BUCKETS.find(b => b[0] === arg);
  const list = bucket ? sites.filter(bucket[2]) : sites.filter(s => s.step >= 9 && s.step <= 14).sort((a, b) => b.delays.length - a.delays.length);
  const started = sites.filter(s => s.schedule && s.schedule.actual_start);
  const onTime = started.filter(s => s.schedule.actual_start <= s.schedule.planned_start).length;
  const finished = sites.filter(s => s.schedule && s.schedule.actual_end && s.cost && s.cost.actual);
  const installed = sites.reduce((a, s) => a + siteDone(s), 0), snagCount = sites.reduce((a, s) => a + s.snags.length, 0);
  const costVar = finished.length ? Math.round(finished.reduce((a, s) => a + s.cost.actual / s.cost.budget, 0) / finished.length * 100 - 100) : 0;
  const byInst = D.installer.filter(i => i.jobs).sort((a, b) => b.installed_sqft - a.installed_sqft);
  const byCity = Object.values(sites.reduce((m, s) => { const c = MK[s.market].city; (m[c] ||= { c, n: 0, sq: 0, del: 0, snag: 0 }); m[c].n++; m[c].sq += siteDone(s); m[c].del += s.delays.length ? 1 : 0; m[c].snag += openSnags(s).length; return m; }, {})).sort((a, b) => b.n - a.n);
  const byCat = Object.values(sites.reduce((m, s) => { const c = SKU[s.sku].category; (m[c] ||= { c, sq: 0, snags: 0 }); m[c].sq += siteDone(s); m[c].snags += s.snags.length; return m; }, {}));
  return `<div class="stack">${inav('dashboard')}
    <div class="stack-s"><h1>Installation</h1><p class="muted">${sites.length} site jobs across ${new Set(sites.map(s => s.project)).size} projects · click a tile to see the sites behind it</p></div>
    <div class="tiles">${BUCKETS.map(([k, label, f]) => { const n = k === 'snags' ? sites.filter(f).reduce((a, s) => a + openSnags(s).length, 0) : sites.filter(f).length; return `<a class="tile ${arg === k ? 'on' : ''}" href="#/installation/${k}" data-bucket="${k}"><span class="kicker">${label}</span><div class="num">${n}</div></a>`; }).join('')}</div>
    <section class="stack-s"><h3>${bucket ? bucket[1] : 'Active sites (readiness → completion)'}</h3>
      ${list.length ? table(['Site', 'Project', 'Step', 'Installer', 'Progress', 'Issue', 'Owner'], list.slice(0, 30).map(s => ({ href: `#/site/${s.id}`, cells: [esc(s.name), esc(PROJ[s.project].name.replace(' (sample)', '')), `${s.step + 1}. ${esc(SITE_STEPS[s.step])}`,
        s.installer ? esc(INST[s.installer].name) : '<span class="badge warn">Unassigned</span>', `<div class="bar ok" style="width:90px"><b style="width:${pctOf(s)}%"></b></div><span class="small muted">${pctOf(s)}%</span>`,
        s.delays.length ? `<span class="badge warn">${esc(s.delays[s.delays.length - 1].reason)}</span>` : notReady(s) ? '<span class="badge bad">Not ready</span>' : openSnags(s).length ? `<span class="badge warn">${openSnags(s).length} snag${openSnags(s).length > 1 ? 's' : ''}</span>` : '—',
        s.delays.length ? esc(EMP[s.delays[s.delays.length - 1].owner].name) : '—'] }))) : '<p class="muted">No sites here right now.</p>'}</section>
    <section class="stack-s"><h3>KPIs</h3><div class="grid g4">
      <div class="card stat"><div class="kicker">On-time start</div><div class="num">${started.length ? Math.round(onTime / started.length * 100) : 0}%</div><span class="small muted">${onTime} of ${started.length} sites</span></div>
      <div class="card stat"><div class="kicker">Installed</div><div class="num">${numFmt(Math.round(installed / 1000))}k</div><span class="small muted">sq ft to date</span></div>
      <div class="card stat"><div class="kicker">Snag rate</div><div class="num">${(snagCount / Math.max(1, installed / 10000)).toFixed(1)}</div><span class="small muted">snags per 10,000 sq ft</span></div>
      <div class="card stat"><div class="kicker">Cost vs budget</div><div class="num">${costVar > 0 ? '+' : ''}${costVar}%</div><span class="small muted">${finished.length} completed sites</span></div></div></section>
    <div class="grid g2">
      <section class="stack-s"><h3>By installer</h3>${table(['Installer', 'Jobs', 'Active', 'On-time', 'Quality', 'Open snags'], byInst.map(i => ({ href: `#/installer/${i.id}`, cells: [esc(i.name), i.jobs, i.active, i.on_time_pct == null ? '—' : i.on_time_pct + '%', `${i.quality} ★`, D.site.filter(s => s.installer === i.id).reduce((a, s) => a + openSnags(s).length, 0)] })))}</section>
      <section class="stack-s"><h3>By city</h3>${table(['City', 'Sites', 'Installed sq ft', 'Delayed', 'Open snags'], byCity.map(c => [c.c, c.n, numFmt(c.sq), c.del, c.snag]))}
        <h3 style="margin-top:12px">By product</h3>${table(['Category', 'Installed sq ft', 'Snags / 10k sq ft'], byCat.map(c => [c.c, numFmt(c.sq), c.sq ? (c.snags / (c.sq / 10000)).toFixed(1) : '—']))}</section></div>
    <div class="phase2"><b>Phase 2 · installation AI:</b> predict likely delays from material and readiness, recommend crews from past performance, summarise daily site reports into management exceptions.</div></div>`;
};
EM.VIEWS.installation.title = () => 'Installation';

// ---------------------------------------------------------------- site job
const SITE_TABS = [['survey', 'Survey & BOQ'], ['crew', 'Crew & schedule'], ['material', 'Material & readiness'], ['progress', 'Daily progress'], ['snags', 'Snags'], ['signoff', 'Sign-off & closure']];
EM.VIEWS.site = arg => {
  const [id, tabArg] = arg.split('/'), s = S_(id);
  if (!s) return '<p>Site not found.</p>';
  if (!seeSite(s)) return EM.noAccess('This site is not assigned to you.');
  const tab = tabArg || (s.step <= 4 ? 'survey' : s.step <= 10 ? 'material' : s.step <= 13 ? 'progress' : 'signoff');
  const p = PROJ[s.project], sku = SKU[s.sku];
  return `<div class="stack">${inav('dashboard')}${crumbs(['Installation', '#/installation'], [p.name.replace(' (sample)', ''), `#/project/${p.id}/sites`], [s.name])}
    <div class="row between" style="align-items:flex-start"><div class="row" style="flex-wrap:nowrap;align-items:flex-start">${thumb(sku)}<div class="stack-s"><h1>${esc(s.name)}</h1>
      <p class="muted">${esc(sku.collection)} · ${esc(sku.design)} · ${numFmt(sitePlanned(s) || s.imported_area || 0)} sq ft · ${s.installer ? esc(INST[s.installer].name) : 'crew not allocated'}</p></div></div>
      ${s.step < 17 ? `<button class="btn primary" data-act="site-next" data-s="${id}">Complete step ${s.step + 1}: ${esc(SITE_STEPS[s.step])}</button>` : '<span class="badge ok">Under warranty</span>'}</div>
    <div class="stepper" aria-label="Workflow">${SITE_STEPS.map((x, i) => `<span class="${i < s.step ? 'done' : i === s.step ? 'cur' : ''}">${i + 1}. ${x}</span>`).join('')}</div>
    <div id="site-err"></div>
    ${subtabs(`#/site/${id}`, tab, SITE_TABS)}
    ${(SITE_TAB[tab] || SITE_TAB.survey)(s)}</div>`;
};
EM.VIEWS.site.tab = 'installation';
EM.VIEWS.site.title = a => (S_(a.split('/')[0]) || { name: 'Site' }).name;

const SITE_TAB = {
  survey: s => `<div class="grid g2">
    <section class="card stack-s"><h3>Site survey</h3>${s.survey ? kv([['Date · surveyor', `${ds(s.survey.date)} · ${esc(EMP[s.survey.surveyor].name)}`], ['Site contact', esc(s.survey.site_contact)], ['Measured area', `${numFmt(s.survey.area_sqft)} sq ft · ${s.survey.rooms} rooms`],
      ['Subfloor', s.survey.subfloor === 'Level' ? 'Level' : `<span class="badge warn">${esc(s.survey.subfloor)}</span>`], ['Moisture', `${s.survey.moisture_pct}% ${s.survey.moisture_pct > 4.5 ? '<span class="badge warn">high</span>' : '<span class="badge ok">OK</span>'}`], ['Photos', `${s.survey.photos} from the phone`]])
      : '<p class="muted">Survey not done yet. Completing step 2–3 captures measurements, subfloor and moisture checks with photos.</p>'}</section>
    <section class="card stack-s"><div class="row between"><h3>BOQ</h3>${s.boq.length ? `<button class="btn sm" data-act="boq-rev" data-s="${s.id}">New BOQ version</button>` : ''}</div>
      ${s.boq.length ? table(['Ver', 'Date', 'Floor', 'Wastage', 'Skirting', 'Underlay', 'Status'], s.boq.slice().reverse().map(b => [`v${b.v}`, ds(b.at), `${numFmt(b.qty_sqft)} sq ft`, `${b.wastage_pct}%`, `${numFmt(b.skirting_rft)} rft`, `${numFmt(b.underlay_sqft)} sq ft`,
        `<span class="badge ${b.status === 'approved' ? 'ok' : b.status === 'draft' ? 'info' : 'plain'}">${b.status}</span>`]))
        + s.boq.filter(b => b.change).map(b => `<p class="small muted">v${b.v}: ${esc(b.change)}${b.approved_by ? ` · approved by ${esc(EMP[b.approved_by].name)}` : ''}</p>`).join('') : '<p class="muted">BOQ is prepared after the survey.</p>'}</section></div>`,

  crew: s => {
    const cands = D.installer.map(i => {
      const why = [], city = MK[s.market].city, cat = SKU[s.sku].category;
      let sc = 0; const add = (n, t) => { sc += n; why.push(`${n > 0 ? '+' : ''}${n} ${t}`); };
      if (i.coverage.includes(city)) add(30, `covers ${city}`);
      if (i.skills.includes(cat)) add(25, `skilled in ${cat}`);
      if (i.certs.some(c => c.valid_to >= TODAY)) add(15, 'valid certificate'); else add(-20, 'certificate expired');
      add(Math.round((i.quality - 4) * 20), `quality ${i.quality}★`);
      if (i.active >= 2) add(-15, `${i.active} active jobs`);
      return { i, sc, why };
    }).sort((a, b) => b.sc - a.sc).slice(0, 3);
    const sch = s.schedule;
    return `<div class="grid g2">
      <section class="card stack-s"><h3>Schedule</h3>${sch ? kv([['Planned', `${ds(sch.planned_start)} → ${ds(sch.planned_end)}`], ['Actual', sch.actual_start ? `${ds(sch.actual_start)} → ${sch.actual_end ? ds(sch.actual_end) : 'in progress'}` : '—'],
        ['Manpower', `${sch.manpower_deployed ?? '—'} deployed / ${sch.manpower_planned ?? '—'} planned`]]) : '<p class="muted">Scheduled once the crew is allocated.</p>'}
        <h3 style="margin-top:12px">Delays</h3>${s.delays.length ? table(['Logged', 'Reason', 'Owner', 'Days'], s.delays.map(d => [dFmt(d.at), esc(d.reason), esc(EMP[d.owner].name), d.days])) : '<p class="muted">No delays.</p>'}
        <div class="row"><select class="input" id="delay-r" aria-label="Delay reason" style="width:auto">${DELAYS.map(r => `<option>${r}</option>`).join('')}</select><button class="btn sm" data-act="delay-add" data-s="${s.id}">Log delay</button></div></section>
      <section class="card stack-s"><h3>Suggested crews</h3><p class="small muted">Ranked by coverage, skill, certificates, quality and current load — reasons shown.</p>
        ${cands.map(({ i, sc, why }, k) => `<div class="card flat stack-s"><div class="row between"><a href="#/installer/${i.id}"><b>${esc(i.name)}</b></a><span class="badge ${k ? 'plain' : 'ok'}">${sc}</span></div><div class="small muted">${why.map(esc).join(' · ')}</div>
          ${s.installer === i.id ? '<span class="badge ok">Allocated</span>' : `<button class="btn sm" data-act="alloc" data-s="${s.id}" data-i="${i.id}">Allocate</button>`}</div>`).join('')}</section></div>`;
  },

  material: s => {
    const m = s.material, bal = m.received - m.consumed, short = m.planned && m.received < m.planned && s.step >= 8;
    const rows = s.readiness.length ? s.readiness : READY_ITEMS.map(item => ({ item, ok: null, reason: null, evidence: null }));
    return `<div class="stack">
      <section class="stack-s"><h3>Material · sq ft</h3><div class="pipe">${[['Planned', m.planned], ['Ordered', m.ordered], ['Dispatched', m.dispatched], ['Received', m.received], ['Consumed', m.consumed]].map(([l, v]) => `<div class="${short && l === 'Received' ? 'short' : ''}"><span class="small muted">${l}</span><b>${numFmt(v)}</b></div>`).join('')}
        <div><span class="small muted">Balance / return</span><b>${numFmt(Math.max(0, bal))}</b></div></div>
        ${short ? `<div class="callout warn">Short by ${numFmt(m.planned - m.received)} sq ft — linked to Tally stock; lost-order risk flagged to purchasing.</div>` : ''}</section>
      <section class="card stack-s"><div class="row between"><h3>Site readiness checklist</h3>${notReady(s) ? '<span class="badge bad">Not ready</span>' : s.readiness.length ? '<span class="badge ok">Ready</span>' : ''}</div>
        <p class="small muted">Before mobilising the crew. “Not ready” needs a reason and a photo.</p>
        ${rows.map((r, k) => `<div class="check-row"><div><div>${esc(r.item)}</div>${r.ok === false ? `<div class="small" style="color:var(--bad)">${esc(r.reason)} · evidence: ${esc(r.evidence || 'none')}</div>` : ''}</div>
          <div class="toggle"><button class="${r.ok === true ? 'yes' : ''}" data-act="ready" data-s="${s.id}" data-k="${k}" data-v="1">Ready</button><button class="${r.ok === false ? 'no' : ''}" data-act="ready" data-s="${s.id}" data-k="${k}" data-v="0">Not ready</button></div></div>`).join('')}
        <div id="nr-form"></div></section></div>`;
  },

  progress: s => {
    const planned = sitePlanned(s), done = siteDone(s);
    return `<div class="stack"><div class="grid g4"><div class="card stat"><div class="kicker">Installed</div><div class="num" id="site-pct">${pctOf(s)}%</div><div class="bar ok" style="margin-top:8px"><b style="width:${pctOf(s)}%"></b></div><span class="small muted">${numFmt(done)} of ${numFmt(planned)} sq ft</span></div>
      <div class="card stat"><div class="kicker">Reports</div><div class="num">${s.progress.length}</div></div><div class="card stat"><div class="kicker">Manpower today</div><div class="num">${s.progress.length ? s.progress[s.progress.length - 1].manpower : '—'}</div></div>
      <div class="card stat"><div class="kicker">Expected completion</div><div class="num" style="font-size:28px">${expectedEnd(s)}</div>${s.schedule && s.step < 14 && s.schedule.planned_end < TODAY ? `<span class="badge warn">planned ${ds(s.schedule.planned_end)}</span>` : ''}</div></div>
      <section class="card stack-s"><h3>Add today’s report</h3><div class="row" style="align-items:flex-end">
        <label class="field"><span class="small muted">Installed today (sq ft)</span><input class="input" id="pr-qty" type="number" min="0" value="450" style="width:140px"></label>
        <label class="field"><span class="small muted">Manpower</span><input class="input" id="pr-men" type="number" min="1" value="${s.schedule && s.schedule.manpower_planned || 6}" style="width:100px"></label>
        <label class="field grow"><span class="small muted">Blockers / next-day plan</span><input class="input" id="pr-note" placeholder="e.g. Skirting short by 40 rft"></label>
        <button class="btn primary" data-act="progress-add" data-s="${s.id}">Save report + 4 photos</button></div></section>
      <section class="stack-s"><h3>Reports</h3>${s.progress.length ? table(['Date', 'Installed', 'Manpower', 'Photos', 'Blockers', 'Next'], s.progress.slice().reverse().map(r => [ds(r.date), `${numFmt(r.installed_sqft)} sq ft`, r.manpower, r.photos, esc(r.blockers || '—'), esc(r.next)])) : '<p class="muted">No reports yet.</p>'}</section></div>`;
  },

  snags: s => `<div class="stack">
    <section class="card stack-s"><h3>Raise a snag</h3><div class="row" style="align-items:flex-end">
      <label class="field"><span class="small muted">Category</span><select class="input" id="sn-cat">${SNAGS.map(c => `<option>${c}</option>`).join('')}</select></label>
      <label class="field"><span class="small muted">Severity</span><select class="input" id="sn-sev"><option>Low</option><option selected>Medium</option><option>High</option></select></label>
      <button class="btn primary" data-act="snag-add" data-s="${s.id}">Raise with photo</button></div></section>
    ${s.snags.length ? table(['Snag', 'Severity', 'Owner', 'Due', 'Rework cost', 'Status', ''], s.snags.map(x => [esc(x.category), x.severity === 'High' ? '<span class="badge bad">High</span>' : x.severity, x.owner ? esc(INST[x.owner].name) : '—',
      x.status === 'Open' && x.due < TODAY ? `<span class="badge bad">${ds(x.due)}</span>` : ds(x.due), x.rework_cost ? inr(x.rework_cost) : '—', x.status === 'Open' ? '<span class="badge warn">Open</span>' : `<span class="badge ok">Closed</span> <span class="small muted">${esc(x.closed_evidence)}</span>`,
      x.status === 'Open' ? `<button class="btn sm" data-act="snag-close" data-s="${s.id}" data-x="${x.id}">Close</button>` : ''])) : '<p class="muted">No snags raised.</p>'}
    <div id="snag-form"></div></div>`,

  signoff: s => {
    const inst = s.installer && INST[s.installer], planned = sitePlanned(s), payable = inst ? planned * inst.rate_sqft : 0;
    return `<div class="grid g2">
      <section class="card stack-s"><h3>Client sign-off &amp; handover</h3>${s.signoff ? kv([['Signed', `${ds(s.signoff.date)} · ${esc(s.signoff.by)}`], ['Completion certificate', s.signoff.certificate ? '✓ uploaded' : '—'], ['Handover notes', esc(s.signoff.handover_notes)],
        ['Warranty starts', `<b id="warranty">${ds(s.signoff.warranty_start)}</b>`]]) : s.step >= 14 ? `<p>Installation complete. Capture the client’s sign-off on the phone or upload the signed certificate.</p>
          <div class="field"><label for="so-name">Signed by (client)</label><input class="input" id="so-name" placeholder="Name and designation"></div>
          <div class="sig" data-act="sign" role="button" tabindex="0">${EM.signed ? '<svg viewBox="0 0 200 60"><path d="M5 45 C 30 5, 45 55, 70 30 S 110 10, 125 40 S 170 50, 195 15" fill="none" stroke="currentColor" stroke-width="2"/></svg>' : 'Tap to sign'}</div>
          <div id="so-err" class="small" style="color:var(--bad)"></div><button class="btn primary" data-act="signoff" data-s="${s.id}">Save sign-off</button>`
        : `<p class="muted">Available after installation is completed (step 15). ${openSnags(s).length ? `${openSnags(s).length} open snag(s) must be closed first.` : ''}</p>`}</section>
      <section class="card stack-s"><h3>Commercial closure</h3>${kv([['Installation billing', s.billing ? (s.billing.install_billed ? '<span class="badge ok">Billed</span>' : 'Pending') : '—'],
        ['Installer payable', inst ? `${inr(payable)} <span class="small muted">(${numFmt(planned)} sq ft × ₹${inst.rate_sqft})</span> ${s.billing && s.billing.installer_paid ? '<span class="badge ok">Paid</span>' : ''}` : '—'],
        ['Budget', s.cost ? masked(inr(s.cost.budget)) : '—'], ['Actual cost', s.cost && s.cost.actual ? `${inr(s.cost.actual)} <span class="badge ${s.cost.actual > s.cost.budget ? 'bad' : 'ok'}">${s.cost.actual > s.cost.budget ? '+' : ''}${Math.round((s.cost.actual / s.cost.budget - 1) * 100)}%</span>` : '—'],
        ['Effect on project GP', s.cost && s.cost.actual ? `${s.cost.actual > s.cost.budget ? '−' : '+'}${inr(Math.abs(s.cost.actual - s.cost.budget))} <span class="small muted">· Owner, Director, Finance</span>` : '—'],
        ['Rework cost (snags)', inr(s.snags.reduce((a, x) => a + x.rework_cost, 0))]])}</section></div>`;
  },
};

// guards: the workflow can't skip what the spec makes mandatory
const stepGuard = s => {
  if (s.step === 5 && !s.installer) return 'Allocate a crew first (Crew & schedule tab).';
  if (s.step === 9 && s.readiness.length < READY_ITEMS.length) return 'Complete the readiness checklist first (Material & readiness tab).';
  if (s.step === 9 && notReady(s)) return 'Site is marked Not ready — resolve it before scheduling the crew.';
  if (s.step === 14 && openSnags(s).length) return `Close ${openSnags(s).length} open snag(s) before sign-off.`;
  if (s.step === 15 && !s.signoff) return 'Capture the client’s sign-off first (Sign-off & closure tab).';
  return null;
};
EM.ACTIONS['site-next'] = el => {
  const s = S_(el.dataset.s), err = stepGuard(s);
  if (err) { qs('#site-err').innerHTML = `<div class="callout warn">${err}</div>`; return; }
  s.step++;
  if (s.step === 12 && s.schedule && !s.schedule.actual_start) s.schedule.actual_start = TODAY;
  if (s.step === 15 && s.schedule) s.schedule.actual_end = TODAY;
  if (s.step === 16) s.billing = { install_billed: true, installer_payable: sitePlanned(s) * INST[s.installer].rate_sqft, installer_paid: false };
  EM.toast(`<b>${esc(SITE_STEPS[s.step - 1])} ✓</b><ul><li>Next: ${esc(SITE_STEPS[s.step])}</li><li>Client gets a WhatsApp progress update</li></ul>`);
  EM.rerender();
};
EM.ACTIONS['boq-rev'] = el => {
  const s = S_(el.dataset.s), last = s.boq[s.boq.length - 1];
  s.boq.forEach(b => { if (b.status !== 'superseded') b.status = 'superseded'; });
  s.boq.push({ ...last, v: last.v + 1, at: TODAY, qty_sqft: Math.round(last.qty_sqft * 1.04), status: 'draft', change: 'Balcony added after site walk (sample)', approved_by: null });
  EM.toast(`BOQ v${last.v + 1} created — change recorded, needs commercial approval.`); EM.rerender();
};
EM.ACTIONS.delay = null;
EM.ACTIONS['delay-add'] = el => { const s = S_(el.dataset.s); s.delays.push({ at: stamp(), reason: qs('#delay-r').value, owner: 'emp_0010', days: 1 }); EM.toast(`Delay logged · “${esc(qs('#delay-r').value)}” · owner alerted, dashboard updated.`); EM.rerender(); };
EM.ACTIONS.alloc = el => {
  const s = S_(el.dataset.s), i = INST[el.dataset.i];
  s.installer = i.id;
  s.schedule ||= { planned_start: dayStr(new Date(NOW.getTime() + 5 * 864e5)), planned_end: dayStr(new Date(NOW.getTime() + 9 * 864e5)), actual_start: null, actual_end: null, manpower_planned: i.crew_size, manpower_deployed: null };
  EM.toast(`<b>${esc(i.name)} allocated</b><ul><li>Crew lead gets the job on the site-team app</li><li>Schedule checked for clashes</li></ul>`); EM.rerender();
};
EM.ACTIONS.ready = el => {
  const s = S_(el.dataset.s), k = +el.dataset.k;
  if (!s.readiness.length) s.readiness = READY_ITEMS.map(item => ({ item, ok: null, reason: null, evidence: null }));
  if (el.dataset.v === '1') { Object.assign(s.readiness[k], { ok: true, reason: null, evidence: 'photo' }); EM.rerender(); return; }
  qs('#nr-form').innerHTML = `<div class="callout warn stack-s"><b>Not ready: ${esc(s.readiness[k].item)}</b>
    <div class="row" style="align-items:flex-end"><label class="field grow"><span class="small muted">Reason (required)</span><input class="input" id="nr-reason" placeholder="e.g. Painting still in progress"></label>
    <label class="chip" style="padding:8px"><input type="checkbox" id="nr-photo"> Photo attached</label><button class="btn primary" data-act="nr-save" data-s="${s.id}" data-k="${k}">Save</button></div><div id="nr-err" class="small" style="color:var(--bad)"></div></div>`;
};
EM.ACTIONS['nr-save'] = el => {
  const s = S_(el.dataset.s), reason = qs('#nr-reason').value.trim(), photo = qs('#nr-photo').checked;
  if (!reason || !photo) { qs('#nr-err').textContent = 'A reason and a photo are required to mark the site not ready.'; return; }
  Object.assign(s.readiness[+el.dataset.k], { ok: false, reason, evidence: 'photo' });
  s.delays.push({ at: stamp(), reason: 'Customer / site not ready', owner: 'emp_0010', days: 2 });
  EM.toast('<b>Site marked not ready</b><ul><li>Crew mobilisation held</li><li>Client and project owner notified with the photo</li></ul>'); EM.rerender();
};
EM.ACTIONS['progress-add'] = el => {
  const s = S_(el.dataset.s), q = Math.max(0, +qs('#pr-qty').value || 0);
  const before = pctOf(s);
  s.progress.push({ date: TODAY, installed_sqft: q, manpower: +qs('#pr-men').value || 1, photos: 4, blockers: qs('#pr-note').value.trim() || null, next: 'Continue' });
  s.material.consumed += Math.round(q * 1.05);
  EM.toast(`<b>Report saved</b><ul><li>Progress ${before}% → ${pctOf(s)}%</li><li>Project roll-up and dashboard updated</li><li>Client WhatsApp: today’s photos</li></ul>`); EM.rerender();
};
EM.ACTIONS['snag-add'] = el => {
  const s = S_(el.dataset.s);
  s.snags.push({ id: 'sng_new' + EM.tick++, category: qs('#sn-cat').value, severity: qs('#sn-sev').value, owner: s.installer, due: dayStr(new Date(NOW.getTime() + 3 * 864e5)), status: 'Open', photo: true, rework_cost: 0, closed_evidence: null });
  EM.toast('Snag raised with photo · crew lead notified · due in 3 days.'); EM.rerender();
};
EM.ACTIONS['snag-close'] = el => {
  qs('#snag-form').innerHTML = `<div class="callout stack-s"><b>Close snag</b><div class="row" style="align-items:flex-end"><label class="chip" style="padding:8px"><input type="checkbox" id="sc-photo"> “After” photo attached</label>
    <label class="field"><span class="small muted">Rework cost ₹</span><input class="input" id="sc-cost" type="number" min="0" value="0" style="width:120px"></label>
    <button class="btn primary" data-act="snag-close-save" data-s="${el.dataset.s}" data-x="${el.dataset.x}">Close snag</button></div><div id="sc-err" class="small" style="color:var(--bad)"></div></div>`;
};
EM.ACTIONS['snag-close-save'] = el => {
  if (!qs('#sc-photo').checked) { qs('#sc-err').textContent = 'Closing a snag needs an “after” photo as evidence.'; return; }
  const x = S_(el.dataset.s).snags.find(y => y.id === el.dataset.x);
  Object.assign(x, { status: 'Closed', closed_evidence: 'after photo', rework_cost: +qs('#sc-cost').value || 0 });
  EM.toast('Snag closed with evidence.'); EM.rerender();
};
EM.ACTIONS.sign = el => { EM.signed = true; el.innerHTML = '<svg viewBox="0 0 200 60"><path d="M5 45 C 30 5, 45 55, 70 30 S 110 10, 125 40 S 170 50, 195 15" fill="none" stroke="currentColor" stroke-width="2"/></svg>'; };
EM.ACTIONS.signoff = el => {
  const s = S_(el.dataset.s), name = qs('#so-name').value.trim();
  if (!name || !EM.signed) { qs('#so-err').textContent = 'Client name and signature are required.'; return; }
  s.signoff = { date: TODAY, by: name, certificate: true, handover_notes: 'Care guide + spare boxes handed over', warranty_start: TODAY };
  EM.signed = false;
  EM.toast(`<b>Signed off by ${esc(name)}</b><ul><li>Completion certificate PDF created</li><li>Warranty starts ${ds(TODAY)}</li><li>Consumer profile + service schedule created</li></ul>`, 6000); EM.rerender();
};

// ---------------------------------------------------------------- crew schedule (§22.4)
EM.VIEWS.schedule = () => {
  const mon = new Date(NOW); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const days = [...Array(7)].map((_, k) => dayStr(new Date(mon.getTime() + k * 864e5)));
  const jobs = D.site.filter(seeSite).filter(s => s.schedule && s.installer && s.step >= 5 && s.step <= 14);
  const endOf = s => {
    if (s.schedule.actual_end) return s.schedule.actual_end;
    if (s.step < 11) return s.schedule.planned_end;
    if (s.schedule.planned_end >= TODAY) return s.schedule.planned_end;
    const left = sitePlanned(s) - siteDone(s);
    return dayStr(new Date(NOW.getTime() + Math.max(1, Math.ceil(left / INST[s.installer].capacity_sqft_day)) * 864e5));
  };
  const on = (s, d) => { const st = s.schedule.actual_start || s.schedule.planned_start; return st <= d && d <= endOf(s); };
  const clashCrews = new Set();
  const cells = D.installer.map(i => [`<div class="hd" style="background:var(--ge-surface)"><a href="#/installer/${i.id}"><b>${esc(i.name)}</b></a><div class="muted">crew ${i.crew_size}</div></div>`,
    ...days.map(d => { const js = jobs.filter(s => s.installer === i.id && on(s, d)); const need = js.reduce((a, s) => a + (s.schedule.manpower_planned || 0), 0); const clash = js.length > 1 && need > i.crew_size; if (clash) clashCrews.add(i.id);  // two sites can share a crew only if the people add up
      return `<div>${js.map(s => `<a class="job ${clash ? 'clash' : ''}" href="#/site/${s.id}" title="${esc(s.name)}">${esc(s.name)}</a>`).join('')}${clash ? '<span class="badge bad">Clash</span>' : ''}</div>`; })].join('')).join('');
  const unassigned = D.site.filter(s => s.step >= 4 && s.step <= 9 && !s.installer);
  return `<div class="stack">${inav('schedule')}
    <div class="row between"><div class="stack-s"><h1>Crew schedule</h1><p class="muted">Week of ${dFmt(days[0] + 'T12:00:00+05:30')} · ${jobs.length} scheduled jobs · <b style="color:${clashCrews.size ? 'var(--bad)' : 'inherit'}">${clashCrews.size} crew${clashCrews.size === 1 ? '' : 's'} double-booked</b></p></div></div>
    <div class="cal-wrap"><div class="cal" style="grid-template-columns:180px repeat(7,1fr)"><div class="hd">Crew</div>${days.map(d => `<div class="hd">${new Date(d + 'T12:00:00+05:30').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}</div>`).join('')}${cells}</div></div>
    <p class="small muted">A clash = the same crew on overlapping sites needing more people than it has.</p>
    <section class="stack-s"><h3>Waiting for a crew</h3>${unassigned.length ? table(['Site', 'Project', 'City', 'Step'], unassigned.map(s => ({ href: `#/site/${s.id}/crew`, cells: [esc(s.name), esc(PROJ[s.project].name.replace(' (sample)', '')), esc(MK[s.market].city), esc(SITE_STEPS[s.step])] }))) : '<p class="muted">Every approved site has a crew.</p>'}</section></div>`;
};
EM.VIEWS.schedule.tab = 'installation';

// ---------------------------------------------------------------- installers (§22.10)
EM.VIEWS.installers = () => `<div class="stack">${inav('installers')}
  <div class="stack-s"><h1>Installers</h1><p class="muted">Crews and contractors — where they work, what they're certified for, and how well they deliver.</p></div>
  ${table(['Installer', 'Coverage', 'Skills', 'Crew', 'Capacity/day', 'Jobs', 'On-time', 'Quality', 'Complaints', 'Certificates'], D.installer.map(i => ({ href: `#/installer/${i.id}`,
    cells: [`<b>${esc(i.name)}</b>`, esc(i.coverage.join(', ')), i.skills.map(x => `<span class="chip">${esc(x)}</span>`).join(''), i.crew_size, `${numFmt(i.capacity_sqft_day)} sq ft`, i.jobs, i.on_time_pct == null ? '—' : i.on_time_pct + '%', `${i.quality} ★`, i.complaints,
      i.certs.some(c => c.valid_to < TODAY) ? '<span class="badge bad">Expired</span>' : '<span class="badge ok">Valid</span>'] })))}</div>`;
EM.VIEWS.installers.tab = 'installation';
EM.VIEWS.installer = id => {
  const i = INST[id];
  if (!i) return '<p>Installer not found.</p>';
  const jobs = D.site.filter(s => s.installer === id), cmp = D.complaint.filter(c => c.installer === id);
  return `<div class="stack">${inav('installers')}${crumbs(['Installers', '#/installers'], [i.name])}
    <div class="stack-s"><h1>${esc(i.name)}</h1><p class="muted">Lead: ${esc(i.lead)} · ${esc(i.phone)} ${demo}</p></div>
    <div class="grid g4"><div class="card stat"><div class="kicker">On-time start</div><div class="num">${i.on_time_pct == null ? '—' : i.on_time_pct + '%'}</div></div><div class="card stat"><div class="kicker">Quality</div><div class="num">${i.quality} ★</div></div>
      <div class="card stat"><div class="kicker">Installed</div><div class="num">${numFmt(i.installed_sqft)}</div><span class="small muted">sq ft</span></div><div class="card stat"><div class="kicker">Rework cost</div><div class="num">${inr(i.rework_cost)}</div><span class="small muted">${i.snags} snags · ${i.complaints} complaints</span></div></div>
    <div class="grid g2"><section class="card stack-s"><h3>Profile</h3>${kv([['Coverage', esc(i.coverage.join(', '))], ['Skills', i.skills.map(x => `<span class="chip">${esc(x)}</span>`).join('')], ['Crew · capacity', `${i.crew_size} people · ${numFmt(i.capacity_sqft_day)} sq ft/day`],
      ['Rate', masked(`₹${i.rate_sqft}/sq ft <span class="small muted">· Owner, Director, Project Head, Finance</span>`)], ['Dealer affiliation', i.dealer ? `<a href="#/dealer/${i.dealer}">${esc(DL[i.dealer].name)}</a>` : 'Independent'],
      ['Agreement', i.docs.agreement ? '✓ on file' : '<span class="badge warn">Missing</span>'], ['Insurance valid to', i.docs.insurance_valid_to < TODAY ? `<span class="badge bad">${ds(i.docs.insurance_valid_to)}</span>` : ds(i.docs.insurance_valid_to)]])}</section>
      <section class="card stack-s"><h3>Certificates</h3>${table(['Course', 'Valid to'], i.certs.map(c => [esc(c.course), c.valid_to < TODAY ? `<span class="badge bad">Expired ${ds(c.valid_to)}</span>` : ds(c.valid_to)]))}</section></div>
    <section class="stack-s"><h3>Jobs</h3>${jobs.length ? table(['Site', 'Step', 'Progress', 'Open snags'], jobs.map(s => ({ href: `#/site/${s.id}`, cells: [esc(s.name), esc(SITE_STEPS[s.step]), `${pctOf(s)}%`, openSnags(s).length || '—'] }))) : '<p class="muted">No jobs yet.</p>'}</section>
    ${cmp.length ? `<section class="stack-s"><h3>Complaints</h3>${table(['No.', 'Type', 'Status'], cmp.map(c => [c.no, esc(c.type), esc(c.status)]))}</section>` : ''}</div>`;
};
EM.VIEWS.installer.tab = 'installation';

// ---------------------------------------------------------------- site-team phone app (§22.12)
EM.VIEWS.siteapp = () => {
  const s = (me().role === 'rt_site' && D.site.find(x => x.supervisor === EM.meId && x.step >= 11 && x.step <= 13)) || S_(D.story.hero_site), st = EM.siteapp ||= { offline: true, outbox: 0, qty: 0, signed: false };
  return `<div class="stack">${inav('siteapp')}
    <div class="stack-s"><h1>Site-team app</h1><p class="muted" style="max-width:720px">What the crew lead sees on the phone at the site. Minimal steps, big buttons, works without network — everything syncs when the phone is back online.</p></div>
    <div class="phones"><div class="phone"><div class="ph-head">${LOGO(14)}<span>${st.offline ? 'No network' : '4G'} · ${esc(INST[s.installer].name)}</span></div>
      <div class="ph-body">${st.offline ? `<div class="offline">Offline · ${st.outbox} update${st.outbox === 1 ? '' : 's'} waiting</div>` : '<div class="callout ok small">Online · synced</div>'}
        <div class="card" style="padding:12px"><b>${esc(s.name)}</b><div class="small muted">${esc(SKU[s.sku].collection)} · ${esc(SKU[s.sku].design)} · ${numFmt(sitePlanned(s))} sq ft</div>
          <div class="bar ok" style="margin-top:8px"><b style="width:${pctOf(s)}%"></b></div><div class="small">${pctOf(s)}% installed</div></div>
        <h3>Today’s update</h3>
        <label class="field"><span class="small muted">Installed today (sq ft)</span><input class="input" id="sa-qty" type="number" value="380" style="min-height:48px"></label>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:6px"><button class="btn" style="min-height:48px" data-act="sa-photo">📷 Photos</button><button class="btn" style="min-height:48px" data-act="sa-snag">⚠ Snag</button></div>
        <button class="btn primary" style="min-height:48px" data-act="sa-save">Save update</button>
        <h3>Client sign-off</h3><div class="sig" data-act="sa-sign" role="button" tabindex="0" style="height:90px">${st.signed ? '<svg viewBox="0 0 200 60"><path d="M5 45 C 30 5, 45 55, 70 30 S 110 10, 125 40 S 170 50, 195 15" fill="none" stroke="currentColor" stroke-width="2"/></svg>' : 'Client signs here'}</div>
        <button class="btn" style="min-height:48px" data-act="sa-net">${st.offline ? 'Simulate: network is back' : 'Simulate: lose network'}</button>
      </div><div class="ph-tabs"><span class="on">Site</span><span>Checklist</span><span>Snags</span><span>More</span></div></div></div></div>`;
};
EM.VIEWS.siteapp.tab = 'installation';
EM.ACTIONS['sa-photo'] = () => { const st = EM.siteapp; if (st.offline) st.outbox++; EM.toast('4 photos captured with time and GPS stamp.'); EM.rerender(); };
EM.ACTIONS['sa-snag'] = () => { const st = EM.siteapp; if (st.offline) st.outbox++; EM.toast('Snag “Gap at skirting” raised with photo.'); EM.rerender(); };
EM.ACTIONS['sa-save'] = () => { const st = EM.siteapp, q = +qs('#sa-qty').value || 0; st.qty += q; if (st.offline) st.outbox++; else S_(D.story.hero_site).progress.push({ date: TODAY, installed_sqft: q, manpower: 6, photos: 4, blockers: null, next: 'Continue' }); EM.toast(st.offline ? `${q} sq ft saved on the phone — syncs when online.` : `${q} sq ft saved and synced.`); EM.rerender(); };
EM.ACTIONS['sa-sign'] = () => { const st = EM.siteapp; st.signed = true; if (st.offline) st.outbox++; EM.toast(st.offline ? 'Client signed on the phone — stored offline, uploads when online.' : 'Client signed — synced.'); EM.rerender(); };
EM.ACTIONS['sa-net'] = () => {
  const st = EM.siteapp;
  if (st.offline) {
    const n = st.outbox;
    if (st.qty) S_(D.story.hero_site).progress.push({ date: TODAY, installed_sqft: st.qty, manpower: 6, photos: 4, blockers: null, next: 'Continue' });
    Object.assign(st, { offline: false, outbox: 0, qty: 0 });
    EM.toast(`<b>Back online · ${n} update${n === 1 ? '' : 's'} synced</b><ul><li>Original times kept</li><li>Site progress, photos${EM.siteapp.signed ? ', signature' : ''} now in EGO Master</li></ul>`);
  } else { st.offline = true; EM.toast('Network lost — the app keeps working.'); }
  EM.rerender();
};

// ---------------------------------------------------------------- complaints (§23)
EM.VIEWS.complaints = () => {
  const cs = D.complaint.filter(c => canDiv(c.division) && (EM.div === 'both' || c.division === EM.div)), open = cs.filter(c => c.status !== 'Resolved'), res = cs.filter(c => c.status === 'Resolved');
  const avgDays = res.length ? Math.round(res.reduce((a, c) => a + (dt(c.closed_at) - dt(c.at)) / 864e5, 0) / res.length) : 0;
  const group = f => Object.entries(cs.reduce((m, c) => { const k = f(c); if (k) { m[k] ||= { n: 0, open: 0, cost: 0 }; m[k].n++; m[k].open += c.status !== 'Resolved'; m[k].cost += c.cost || 0; } return m; }, {})).sort((a, b) => b[1].n - a[1].n).slice(0, 6);
  const gt = (title, rows) => `<section class="stack-s"><h3>${title}</h3>${table(['', 'Complaints', 'Open', 'Cost'], rows.map(([k, v]) => [k, v.n, v.open, inr(v.cost)]))}</section>`;
  return `<div class="stack">${EM.div === 'wholesale' ? '' : inav('complaints')}
    <div class="row between"><div class="stack-s"><h1>Complaints</h1><p class="muted">Every complaint linked to its product and batch, dealer, invoice, installer and supplier — so the pattern shows, not just the ticket.</p></div>
      <button class="btn primary" data-act="cmp-new">Log complaint</button></div>
    <div class="grid g4"><div class="card stat"><div class="kicker">Open</div><div class="num" id="cmp-open">${open.length}</div></div><div class="card stat"><div class="kicker">High severity open</div><div class="num">${open.filter(c => c.severity === 'High').length}</div></div>
      <div class="card stat"><div class="kicker">Avg time to close</div><div class="num">${avgDays} d</div></div><div class="card stat"><div class="kicker">Cost of resolution</div><div class="num">${inr(res.reduce((a, c) => a + (c.cost || 0), 0))}</div></div></div>
    <div class="grid g2">${gt('By product', group(c => `${SKU[c.sku].collection} · ${SKU[c.sku].design}`))}${gt('By installer', group(c => c.installer && INST[c.installer].name))}${gt('By dealer', group(c => DL[c.dealer].name))}${gt('By type', group(c => c.type))}</div>
    <section class="stack-s"><h3>All complaints</h3>${table(['No.', 'Date', 'Type', 'Severity', 'Product · batch', 'Dealer', 'Installer', 'Owner', 'Status'], cs.slice().sort((a, b) => b.at.localeCompare(a.at)).map(c => [c.no, dFmt(c.at), esc(c.type),
      c.severity === 'High' ? '<span class="badge bad">High</span>' : c.severity, `${esc(SKU[c.sku].design)} · <code>${c.batch}</code>`, `<a href="#/dealer/${c.dealer}">${esc(DL[c.dealer].name)}</a>`,
      c.installer ? `<a href="#/installer/${c.installer}">${esc(INST[c.installer].name)}</a>` : '—', esc(EMP[c.owner].name), c.status === 'Resolved' ? `<span class="badge ok">Resolved</span> <span class="small muted">${esc(c.resolution)}</span>` : `<span class="badge warn">${c.status}</span>`]))}</section></div>`;
};
EM.VIEWS.complaints.tab = 'installation';
EM.ACTIONS['cmp-new'] = () => EM.modal(`<h2>Log complaint</h2><div class="stack" style="margin-top:12px">
  <div class="field"><label for="cn-type">Type</label><select id="cn-type" class="input">${['Product · swelling', 'Product · colour variation', 'Installation · gaps / uneven', 'Installation · squeaking', 'Delivery · damaged boxes'].map(t => `<option>${t}</option>`).join('')}</select></div>
  <div class="field"><label for="cn-site">Site (for installation complaints)</label><select id="cn-site" class="input">${D.site.filter(s => s.installer && s.step >= 12).slice(0, 20).map(s => `<option value="${s.id}">${esc(s.name)} · ${esc(INST[s.installer].name)}</option>`).join('')}</select></div>
  <div class="field"><label for="cn-sev">Severity</label><select id="cn-sev" class="input"><option>Low</option><option selected>Medium</option><option>High</option></select></div>
  <div class="row"><button class="btn primary" data-act="cmp-save">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></div>`);
EM.ACTIONS['cmp-save'] = () => {
  const s = S_(qs('#cn-site').value), type = qs('#cn-type').value;
  D.complaint.push({ id: 'com_new' + EM.tick, no: `CMP-${2700 + EM.tick++}`, at: stamp(), channel: 'Phone', type, kind: type.split(' ')[0].toLowerCase(), severity: qs('#cn-sev').value,
    dealer: PROJ[s.project].partner_dealer, consumer: null, sku: s.sku, batch: 'B2536-11', invoice: 'EGO/INV/77120', installer: type.startsWith('Installation') ? s.installer : null, site: s.id, supplier: 'EGO Bhiwandi', owner: 'emp_0010', status: 'Open', resolution: null, cost: null, closed_at: null });
  EM.closeModal(); EM.toast('<b>Complaint logged</b><ul><li>Linked to product, batch, dealer, site and installer</li><li>Owner assigned; escalates if not acknowledged in 24 h</li></ul>'); EM.rerender();
};
