'use strict';
/* Growth programmes & AI Strategy (client spec §6, 26, 27, 30, 31.3, 32, 38): Target Engine, Scheme Engine,
   Priority 200 development, Approval & Authority Matrix, CEO cockpit, lost sales and the dealer portal.
   Sample data; every action is in memory. Roll-ups are computed here so a revised target reflows everywhere. */

// ---------------------------------------------------------------- targets: Mission ₹25 cr and its season
const MISSION = 25e7;
const SEASON = [7, 7, 7, 7, 8, 8, 9, 9, 9, 9, 10, 10];   // % of the FY target per month, Apr → Mar (sample, Q-45)
const FY_START = new Date('2026-04-01T00:00:00+05:30'), FY_END = new Date('2027-04-01T00:00:00+05:30');
const ytdShare = SEASON.reduce((s, w, m) => {
  const a = new Date(FY_START); a.setMonth(a.getMonth() + m); const b = new Date(a); b.setMonth(b.getMonth() + 1);
  return s + (NOW >= b ? w : NOW > a ? w * (NOW - a) / (b - a) : 0);
}, 0) / 100;
const monthsLeft = (FY_END - NOW) / (30.44 * 864e5), monthsGone = (NOW - FY_START) / (30.44 * 864e5);
const DTG = D.dealer_target;
const gnav = cur => subnav([['targets', 'Targets', '#/targets'], ['schemes', 'Schemes', '#/schemes'], ['p200', 'Priority 200', '#/p200'], ['approvals', 'Approvals', '#/approvals']].filter(([k]) => allowedTab(k)), cur);
const myTargets = () => DTG.filter(t => seeDealer(DL[t.dealer]));
const roll = (rows, key) => Object.values(rows.reduce((m, t) => { const k = key(t); if (k == null) return m; const x = (m[k] ||= { k, fy: 0, act: 0 }); x.fy += t.fy_target; x.act += t.ytd_actual; return m; }, {}))
  .map(x => ({ ...x, ytd: x.fy * ytdShare, gap: x.act - x.fy * ytdShare }));
const total = rows => roll(rows, () => 'all')[0] || { fy: 0, act: 0, ytd: 0, gap: 0 };
const pctB = (act, ytd) => { const p = ytd ? Math.round(act / ytd * 100) : 0; return `<span class="badge ${p >= 100 ? 'ok' : p >= 90 ? 'warn' : 'bad'}">${p}%</span>`; };
const gapTxt = g => `<span style="color:${g < 0 ? 'var(--bad)' : 'var(--ok)'}">${g < 0 ? '-' : '+'}${inr(Math.abs(g))}</span>`;
const T_LEVELS = {
  company: ['Company', () => 'EGO Premium'], category: ['Product', t => t.category], area: ['Area', t => MK[DL[t.dealer].market].city],
  salesperson: ['Salesperson', t => DL[t.dealer].field_owner], dealer: ['Dealer', t => t.dealer], p200: ['Priority 200', t => DL[t.dealer].p200_tier ? `Tier ${DL[t.dealer].p200_tier}` : 'Not in Priority 200'],
};
const levelLabel = (lv, k) => lv === 'dealer' ? `<a href="#/dealer/${k}">${esc(DL[k].name)}</a>` : lv === 'salesperson' ? esc(emp(k)) : esc(k);
const missionHead = rows => {
  const t = total(rows), all = rows.length === DTG.length, fy = all ? MISSION : t.fy;
  return `<div class="grid g4">${stat(all ? 'Mission · FY 2026-27' : 'Your FY target', inr(fy), all ? 'EGO Premium dealer sales (sample reading, Q-44)' : `${new Set(rows.map(r => r.dealer)).size} dealers`)}
    ${stat('YTD target', inr(fy * ytdShare), `${Math.round(ytdShare * 100)}% of the year by season`)}${stat('YTD actual', inr(t.act), `${pctB(t.act, fy * ytdShare)} of YTD target · from Tally`)}
    ${stat('Required run-rate', `${inr((fy - t.act) / monthsLeft)}/mo`, `now ${inr(t.act / monthsGone)}/mo · gap ${inr(Math.max(0, fy * ytdShare - t.act))}`)}</div>`;
};

EM.VIEWS.targets = arg => {
  const lv = arg || 'category', rows = myTargets();
  const body = T_LEVELS[lv] ? (() => {
    const rs = roll(rows, T_LEVELS[lv][1]).sort((a, b) => a.gap - b.gap);
    return table([T_LEVELS[lv][0], 'FY target', 'YTD target', 'Actual', 'Achieved', 'Gap', 'Needed / month', ...(lv === 'dealer' ? [''] : [])], rs.slice(0, 60).map(x => [levelLabel(lv, x.k), inr(x.fy), inr(x.ytd), inr(x.act), pctB(x.act, x.ytd), gapTxt(x.gap), inr(Math.max(0, x.fy - x.act) / monthsLeft),
      ...(lv === 'dealer' ? [`<button class="btn sm" data-act="tgt-revise" data-d="${x.k}">Revise</button>`] : [])]));
  })() : lv === 'dxp' || lv === 'axp' ? (() => {
    const key = lv === 'dxp' ? t => t.dealer : t => MK[DL[t.dealer].market].city;
    const heads = roll(rows, key).sort((a, b) => b.fy - a.fy).slice(0, lv === 'dxp' ? 25 : 40);
    const cell = (k, c) => { const x = roll(rows.filter(t => key(t) === k && t.category === c), () => c)[0]; return x ? `${pctB(x.act, x.ytd)}<div class="small muted">${inr(x.act)} of ${inr(x.ytd)}</div>` : ''; };
    return `${table([lv === 'dxp' ? 'Dealer' : 'Area', ...CATS], heads.map(h => [lv === 'dxp' ? `<a href="#/dealer/${h.k}">${esc(DL[h.k].name)}</a>` : esc(h.k), ...CATS.map(c => cell(h.k, c))]))}
      <p class="small muted">Each cell: achieved against the YTD target for that ${lv === 'dxp' ? 'dealer' : 'area'} and product. A 0% cell is a product gap: a target on a product not bought yet.</p>`;
  })() : (() => {
    const rv = D.target_revision.filter(r => seeDealer(DL[r.dealer])).sort((a, b) => b.at.localeCompare(a.at));
    return rv.length ? table(['Date', 'Dealer', 'Original', 'Revised to', 'Reason', 'By', 'Approved by'], rv.map(r => [dFmt(r.at), `<a href="#/dealer/${r.dealer}">${esc(DL[r.dealer].name)}</a>`, inr(r.from), inr(r.to), esc(r.reason), esc(emp(r.by)),
      r.approved_by ? esc(emp(r.approved_by)) : '<span class="badge warn">Waiting</span>'])) : '<p class="muted">No revisions.</p>';
  })();
  return `<div class="stack">${gnav('targets')}
    <div class="stack-s"><div class="kicker">Wholesale · EGO Premium · ${esc(scopeLabel())}</div><h1>Target Engine</h1><p class="muted" style="max-width:780px">Mission ₹25 cr broken down by product, area, salesperson, dealer and Priority 200. Actuals come from Tally; the YTD target follows the season (${SEASON.join(' · ')}% a month, April to March). ${demo}</p></div>
    ${missionHead(rows)}
    ${subtabs('#/targets', lv, [['category', 'Product'], ['area', 'Area'], ['salesperson', 'Salesperson'], ['dealer', 'Dealer'], ['p200', 'Priority 200'], ['company', 'Company'], ['dxp', 'Dealer × Product'], ['axp', 'Area × Product'], ['revisions', `Revisions (${D.target_revision.length})`]])}
    ${body}</div>`;
};
EM.VIEWS.targets.title = () => 'Targets';
EM.ACTIONS['tgt-revise'] = el => {
  const d = DL[el.dataset.d];
  EM.modal(`<h2>Revise target</h2><p class="muted">${esc(d.name)} · FY target now ${inrFull(d.target_12m)}. The original stays in the history.</p>
    <div class="stack" style="margin-top:12px"><div class="field"><label for="tr-to">New FY target (₹)</label><input class="input" id="tr-to" type="number" min="0" value="${Math.round(d.target_12m * 1.1)}"></div>
    <div class="field"><label for="tr-why">Reason (required)</label><input class="input" id="tr-why" placeholder="e.g. New showroom opened"></div>
    <div id="tr-err" class="small" style="color:var(--bad)"></div><div class="row"><button class="btn primary" data-act="tgt-save" data-d="${d.id}">Save revision</button><button class="btn" data-act="close-modal">Cancel</button></div></div>`);
};
EM.ACTIONS['tgt-save'] = el => {
  const d = DL[el.dataset.d], to = Math.round(+qs('#tr-to').value || 0), why = qs('#tr-why').value.trim();
  if (!why || to <= 0) { qs('#tr-err').textContent = 'Enter the new target and a reason.'; return; }
  const from = d.target_12m, f = to / from;
  DTG.filter(t => t.dealer === d.id).forEach(t => { t.fy_target = Math.round(t.fy_target * f); });
  d.target_12m = DTG.filter(t => t.dealer === d.id).reduce((a, t) => a + t.fy_target, 0);
  D.target_revision.push({ id: 'trv_new' + EM.tick++, dealer: d.id, at: stamp(), from, to: d.target_12m, by: EM.meId, approved_by: acc().approve ? EM.meId : null, reason: why });
  EM.closeModal(); EM.toast(`<b>Target revised: ${inr(from)} → ${inr(d.target_12m)}</b><ul><li>Original kept in the revision history</li><li>${acc().approve ? 'Approved by you' : 'Sent for approval'}</li><li>Product, area and salesperson roll-ups updated</li></ul>`);
  location.hash = '#/targets/revisions'; EM.rerender();
};

// ---------------------------------------------------------------- schemes: slabs, progress, settlement, effectiveness
const SCH = byId(D.scheme);
// highest slab reached (edges inclusive) → reward on the whole achieved value at that slab's %
const slabOf = (sc, v) => sc.slabs.reduce((k, s, i) => v >= s.from ? i : k, -1);
const reward = (sc, v) => { const k = slabOf(sc, v); return k < 0 ? 0 : Math.round(v * sc.slabs[k].pct / 100); };
const slabTxt = (sc, k) => k < 0 ? 'Below first slab' : `Slab ${k + 1} · ${sc.slabs[k].pct}%`;
const schemeRows = sc => D.scheme_progress.filter(x => x.scheme === sc.id && seeDealer(DL[x.dealer]));
const effect = sc => {
  const rs = D.scheme_progress.filter(x => x.scheme === sc.id), sales = rs.reduce((a, x) => a + x.achieved, 0), ly = rs.reduce((a, x) => a + x.ly, 0);
  const gIn = sales / ly - 1, gCtl = sc.control_sales / sc.control_ly - 1, extra = ly * (gIn - gCtl);
  const skus = D.sku.filter(s => sc.categories.includes(s.category)), gp = skus.reduce((a, s) => a + s.gp_pct, 0) / skus.length;
  const cost = rs.reduce((a, x) => a + reward(sc, x.achieved), 0);
  return { sales, gIn, gCtl, extra, extraGp: extra * gp, cost, ret: cost ? extra * gp / cost : 0 };
};
EM.VIEWS.schemes = arg => {
  const sc = SCH[arg];
  if (sc) {
    const rs = schemeRows(sc).sort((a, b) => b.achieved - a.achieved), e = effect(sc);
    return `<div class="stack">${gnav('schemes')}${crumbs(['Schemes', '#/schemes'], [sc.name])}
      <div class="stack-s"><h1>${esc(sc.name)}</h1><div class="row"><span class="badge ${sc.status === 'Live' ? 'ok' : 'plain'}">${sc.status}</span><span class="small muted">${ds(sc.from)} to ${ds(sc.to)} · ${esc(sc.categories.join(', '))} · approved by ${esc(emp(sc.approved_by))}</span>${demo}</div>
        <div>${sc.slabs.map((s, i) => `<span class="chip">Slab ${i + 1}: from ${inr(s.from)} · ${s.pct}% credit note</span>`).join('')}</div></div>
      <div class="grid g4">${stat('Eligible dealers', rs.length)}${stat('Sales in the scheme', inr(e.sales), `${Math.round(e.gIn * 100)}% vs last year`)}${stat('Rewards earned', inr(e.cost), sc.status === 'Live' ? 'so far' : 'to settle')}
        ${stat('Return on rewards', `${e.ret.toFixed(1)}×`, `extra GP ${inr(Math.max(0, e.extraGp))} against dealers outside the scheme (${Math.round(e.gCtl * 100)}%)`)}</div>
      ${table(['Dealer', 'Achieved', 'Slab reached', 'Next slab', 'To go', 'Reward', 'Settlement'], rs.map(x => { const k = slabOf(sc, x.achieved), nx = sc.slabs[k + 1];
        return { href: `#/dealer/${x.dealer}`, cells: [esc(DL[x.dealer].name), inrFull(x.achieved), slabTxt(sc, k), nx ? `${inr(nx.from)} · ${nx.pct}%` : 'Top slab', nx ? inr(nx.from - x.achieved) : '', `<span data-scp="${x.id}">${inrFull(reward(sc, x.achieved))}</span>`,
          `<span class="badge ${/Credit/.test(x.settlement) ? 'ok' : /Pending/.test(x.settlement) ? 'warn' : 'plain'}">${esc(x.settlement)}</span>`] }; }))}
      <p class="small muted">The reward is the slab’s % on the whole achieved value. Reaching a slab amount exactly earns that slab. Settlement posts a credit note in Tally after approval (Q-50).</p></div>`;
  }
  return `<div class="stack">${gnav('schemes')}
    <div class="stack-s"><div class="kicker">Wholesale · EGO Premium</div><h1>Scheme Engine</h1><p class="muted" style="max-width:780px">Each scheme with its period, products and slabs, every eligible dealer’s progress to the next slab, settlement, and whether it worked: growth of scheme dealers against similar dealers outside it. ${demo}</p></div>
    <div class="grid g3">${D.scheme.map(sc => { const e = effect(sc), rs = schemeRows(sc); return `<a class="card comp stack-s" href="#/schemes/${sc.id}" style="text-decoration:none"><div class="row between"><h3>${esc(sc.name)}</h3><span class="badge ${sc.status === 'Live' ? 'ok' : 'plain'}">${sc.status}</span></div>
      <span class="small muted">${ds(sc.from)} to ${ds(sc.to)} · ${esc(sc.categories.join(', '))} · ${rs.length} dealers</span>
      ${kv([['Slabs', sc.slabs.map(s => `${inr(s.from)}: ${s.pct}%`).join(' · ')], ['Reached a slab', `${rs.filter(x => slabOf(sc, x.achieved) >= 0).length} of ${rs.length}`], ['Rewards', inr(e.cost)], ['Extra GP', `${inr(Math.max(0, e.extraGp))} · ${e.ret.toFixed(1)}× rewards`]])}</a>`; }).join('')}</div>
    <p class="small muted">Sample schemes. Your running schemes and slabs come from Q-49.</p></div>`;
};
EM.VIEWS.schemes.title = a => SCH[a] ? SCH[a].name : 'Schemes';

// ---------------------------------------------------------------- Priority 200: league, plans, interventions
const TIER_ORDER = ['A', 'B', 'C', 'Watchlist'];
const INT_TYPES = ['Schemes and annual targets', 'Sampling', 'Displays', 'Product training', 'Dealer certification', 'Gifts / relationship activities', 'Area-wise growth planning', 'Digital leads',
  'Dealer-local digital marketing / linked pages', 'Designer & architect promotion', 'Dealer salesperson influence / EGO Champions', 'Business consulting / videos / Zoom', 'Continuous field visits',
  'Dealer competitions / games', 'Installation support', 'Trips / get-togethers', 'End-user feedback', 'Installer training', 'Management involvement', 'Priority service', 'Product stories',
  'Site images / references', 'Monthly feedback on figures', 'Continuous product/process updates', 'Additional marketing activities', 'Testimonials / endorsements when used'];
const dealerTot = id => total(DTG.filter(t => t.dealer === id));
const productGaps = id => DTG.filter(t => t.dealer === id && t.fy_target && !t.ytd_actual).map(t => t.category);
const ints = id => D.intervention.filter(x => x.dealer === id);
const p200Score = d => {
  const t = dealerTot(d.id), champs = D.dealer_employee.filter(e => e.dealer === d.id && e.champion).length;
  const parts = [['Sales vs target', Math.min(40, Math.round(40 * t.act / Math.max(1, t.ytd))), 40], ['Product breadth', Math.round(20 * d.categories.length / CATS.length), 20],
    ['Payments', d.overdue ? 5 : 15, 15], ['Display', D.display.some(x => x.dealer === d.id) ? 10 : 0, 10], ['Champions', Math.min(15, 5 * champs), 15]];
  return { total: parts.reduce((a, p) => a + p[1], 0), parts };
};
const moveBadge = d => d.p200_prev == null ? '<span class="badge info">New entrant</span>' : d.p200_prev === d.p200_tier ? '<span class="small muted">No change</span>'
  : TIER_ORDER.indexOf(d.p200_tier) < TIER_ORDER.indexOf(d.p200_prev) ? `<span class="badge ok">Up from ${d.p200_prev}</span>` : `<span class="badge bad">Down from ${d.p200_prev}</span>`;
EM.VIEWS.p200 = arg => {
  const ds_ = D.dealer.filter(d => d.p200_tier && seeDealer(d));
  const d = DL[arg];
  if (d) {
    if (!seeDealer(d)) return EM.noAccess('This dealer is outside your data scope.');
    if (!d.p200_tier) return `<div class="stack">${gnav('p200')}<p class="muted">${esc(d.name)} is not in Priority 200.</p></div>`;
    const t = dealerTot(d.id), sc = p200Score(d), xs = ints(d.id).sort((a, b) => b.at.localeCompare(a.at)), inv = xs.reduce((a, x) => a + x.cost, 0), got = xs.reduce((a, x) => a + (x.actual_gp || 0), 0);
    return `<div class="stack">${gnav('p200')}${crumbs(['Priority 200', '#/p200'], [d.name])}
      <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>${esc(d.name)}</h1><div class="row">${tierBadge(d.p200_tier)}${moveBadge(d)}${gradeBadge(d.grade)}${demo}</div></div>
        <div class="row"><a class="btn" href="#/dealer/${d.id}">Dealer 360 →</a><button class="btn primary" data-act="int-add" data-d="${d.id}">+ Log intervention</button></div></div>
      <section class="card stack-s"><h3>Development plan</h3>${kv([['Current business', `${inr(t.act)} this FY · running at ${inr(t.act / monthsGone * 12)} a year`], ['Target', `${inr(t.fy)} FY · ${inr(t.ytd)} by today`], ['Gap', gapTxt(t.gap)],
        ['Product gaps', productGaps(d.id).map(c => `<span class="chip">${esc(c)}</span>`).join('') || 'None'], ['Area', esc(market(d.market))], ['Focus', esc(d.p200_plan.focus)], ['Owner', esc(emp(d.field_owner))],
        ['Deadline', ds(d.p200_plan.deadline)], ['Investment', inr(inv)], ['Result', `${inr(got)} extra GP measured so far ${got >= inv ? '<span class="badge ok">Paying back</span>' : '<span class="badge warn">Not yet</span>'}`]])}</section>
      <div class="grid g2"><section class="card stack-s"><h3>Monthly scorecard · ${sc.total} / 100</h3>${table(['Item', 'Score', 'Out of'], sc.parts.map(p => [p[0], p[1], p[2]]))}<p class="small muted">Weights are a sample until Q-57 is answered.</p></section>
        <section class="card stack-s"><h3>Interventions</h3><div id="int-err"></div>${xs.length ? table(['Date', 'Type', 'Owner', 'Cost', 'Expected GP', 'Actual GP'], xs.map(x => [dFmt(x.at), esc(x.type), esc(emp(x.owner)), inr(x.cost), inr(x.expected_gp),
          x.actual_gp == null ? `<span class="small muted">due ${ds(x.follow_up)}</span>` : inr(x.actual_gp)])) : '<p class="muted">None logged yet.</p>'}</section></div></div>`;
  }
  const rows = ds_.map(d => ({ d, sc: p200Score(d).total, t: dealerTot(d.id) })).sort((a, b) => TIER_ORDER.indexOf(a.d.p200_tier) - TIER_ORDER.indexOf(b.d.p200_tier) || b.sc - a.sc);
  const all = D.intervention.filter(x => seeDealer(DL[x.dealer])), measured = all.filter(x => x.actual_gp != null);
  const byType = Object.values(all.reduce((m, x) => { const r = (m[x.type] ||= { t: x.type, n: 0, cost: 0, gp: 0 }); r.n++; r.cost += x.cost; r.gp += x.actual_gp || 0; return m; }, {})).sort((a, b) => b.cost - a.cost);
  return `<div class="stack">${gnav('p200')}
    <div class="stack-s"><div class="kicker">Wholesale · EGO Premium</div><h1>Priority 200 development</h1><p class="muted" style="max-width:780px">A development programme to March 2027, not a tag. Dealers move between tiers at each monthly review; every rupee EGO invests is set against the extra GP it brings. ${demo}</p></div>
    <div class="grid g4">${TIER_ORDER.map(t => stat(`Tier ${t}`, ds_.filter(d => d.p200_tier === t).length, `${ds_.filter(d => d.p200_tier === t && d.p200_prev && TIER_ORDER.indexOf(t) < TIER_ORDER.indexOf(d.p200_prev)).length} promoted · ${ds_.filter(d => d.p200_tier === t && d.p200_prev && TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(d.p200_prev)).length} demoted`)).join('')}</div>
    <div class="grid g4">${stat('Invested', inr(all.reduce((a, x) => a + x.cost, 0)), `${all.length} interventions`)}${stat('Extra GP measured', inr(measured.reduce((a, x) => a + x.actual_gp, 0)), `${measured.length} with a result after 45 days`)}
      ${stat('Expected GP', inr(all.reduce((a, x) => a + x.expected_gp, 0)))}${stat('Plans behind target', rows.filter(r => r.t.gap < 0).length, `of ${rows.length} dealers`)}</div>
    <section class="stack-s"><h3>League table</h3>${table(['Dealer', 'Tier', 'Movement', 'Score', 'Achieved', 'Product gaps', 'Invested'], rows.map(({ d, sc, t }) => ({ href: `#/p200/${d.id}`,
      cells: [esc(d.name), `Tier ${d.p200_tier}`, moveBadge(d), sc, pctB(t.act, t.ytd), productGaps(d.id).length || '', inr(ints(d.id).reduce((a, x) => a + x.cost, 0))] })))}</section>
    <section class="stack-s"><h3>Investment vs extra GP by intervention type</h3>${table(['Intervention', 'Times', 'Invested', 'Extra GP measured'], byType.map(r => [esc(r.t), r.n, inr(r.cost), inr(r.gp)]))}
      <p class="small muted">All 26 intervention types from your spec are available; which you use and their usual costs are Q-55 and Q-56.</p></section></div>`;
};
EM.VIEWS.p200.title = a => DL[a] ? DL[a].name : 'Priority 200';
EM.ACTIONS['int-add'] = el => EM.modal(`<h2>Log intervention</h2><p class="muted">${esc(DL[el.dataset.d].name)}</p><div class="stack" style="margin-top:12px">
  <div class="field"><label for="in-type">Type</label><select class="input" id="in-type">${INT_TYPES.map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
  <div class="grid g2"><div class="field"><label for="in-cost">Cost ₹</label><input class="input" id="in-cost" type="number" min="0" value="15000"></div><div class="field"><label for="in-exp">Expected GP ₹</label><input class="input" id="in-exp" type="number" min="0" value="60000"></div></div>
  <div class="field"><label for="in-fu">Follow-up date (required)</label><input class="input" id="in-fu" type="date"></div>
  <div id="in-err" class="small" style="color:var(--bad)"></div><div class="row"><button class="btn primary" data-act="int-save" data-d="${el.dataset.d}">Save</button><button class="btn" data-act="close-modal">Cancel</button></div></div>`);
EM.ACTIONS['int-save'] = el => {
  const fu = qs('#in-fu').value;
  if (!fu) { qs('#in-err').textContent = 'Set a follow-up date: the actual outcome is asked for then.'; return; }
  const d = DL[el.dataset.d];
  D.intervention.push({ id: 'int_new' + EM.tick++, dealer: d.id, type: qs('#in-type').value, at: stamp(), owner: EM.meId, cost: +qs('#in-cost').value || 0, product: null, expected_gp: +qs('#in-exp').value || 0, follow_up: fu, actual_gp: null });
  EM.closeModal(); EM.toast(`<b>Intervention logged</b><ul><li>Owner: ${esc(me().name)} · follow-up ${ds(fu)}</li><li>Investment added to the plan</li></ul>`); EM.rerender();
};

// ---------------------------------------------------------------- Approval & Authority Matrix
const RULES = Object.fromEntries(D.approval_rule.map(r => [r.type, r]));
const LEVELS = ['rm', 'head', 'director', 'owner'];
const levelName = (lv, div) => ({ rm: div === 'retail' ? 'Project Head' : 'Regional Manager', head: div === 'retail' ? 'Retail Head' : 'Wholesale Head', director: 'Director', owner: 'Owner' })[lv];
const levelWho = (lv, div) => D.employee.find(u => u.status === 'active' && u.role === { rm: div === 'retail' ? 'rt_project' : 'ws_rm', head: div === 'retail' ? 'rt_head' : 'ws_head', director: 'director', owner: 'owner' }[lv]);
const limitOf = (type, lv) => lv === 'owner' ? Infinity : RULES[type].limits[lv];
const amt = (type, v) => v === Infinity ? 'no limit' : RULES[type].unit === '%' ? `${v}%` : inr(v);
// first person who can decide, skipping anyone whose limit adds nothing over the level below
const routeFor = (type, amount) => { const out = []; let prev = 0; for (const lv of LEVELS) { const l = limitOf(type, lv); if (l > prev) { out.push(lv); prev = l; if (l >= amount) break; } } return out; };
const routeText = a => a.route.map(lv => levelName(lv, a.div)).join(', then ');
const APV = byId(D.approval);
const apAt = a => a.trail[a.trail.length - 1].at;
const slaTick = a => {   // no decision within the time allowed → next level, automatically
  const h = RULES[a.type].sla_hours;
  while (a.status === 'Pending' && a.level < a.route.length - 1 && (NOW - dt(apAt(a))) / 36e5 > h) {
    a.level++; a.trail.push({ at: new Date(dt(apAt(a)).getTime() + h * 36e5).toISOString(), who: null, note: `No decision in ${h} h. Escalated to ${levelName(a.route[a.level], a.div)}.` });
  }
};
D.approval.forEach(a => { a.route ||= routeFor(a.type, a.amount); a.level ??= 0; slaTick(a); });
D.project.forEach(p => { const a = D.approval.find(x => x.ref.kind === 'project' && x.ref.id === p.id && x.status === 'Pending'); if (a && p.special_price) p.special_price.approval = a.id; });
const refOf = a => ({ dealer: () => [DL[a.ref.id].name, `#/dealer/${a.ref.id}`], project: () => [PROJ[a.ref.id].name, `#/project/${a.ref.id}/quotes`], order: () => [`${D.order.find(o => o.id === a.ref.id).no} · ${DL[D.order.find(o => o.id === a.ref.id).dealer].name}`, `#/worder/${a.ref.id}`],
  complaint: () => { const c = D.complaint.find(x => x.id === a.ref.id); return [`${c.no} · ${DL[c.dealer].name}`, '#/complaints']; } })[a.ref.kind]();
const apSee = a => canDiv(a.div) && (a.ref.kind !== 'dealer' || seeDealer(DL[a.ref.id])) && acc().scope !== 'none';
const requestApproval = (type, amount, div, ref, reason, by) => {
  const at = stamp(), a = { id: 'apv_new' + EM.tick++, type, div, ref, amount, reason, requested_by: by, at, status: 'Pending', route: routeFor(type, amount), level: 0, trail: [{ at, who: by, note: 'Requested' }] };
  D.approval.push(a); APV[a.id] = a; return a;
};
const decide = (a, ok) => {
  const lv = a.route[a.level], who = levelWho(lv, a.div), at = stamp();
  if (!ok) { a.status = 'Rejected'; a.trail.push({ at, who: who.id, note: `Rejected by ${levelName(lv, a.div)}` }); }
  else if (limitOf(a.type, lv) >= a.amount) { a.status = 'Approved'; a.trail.push({ at, who: who.id, note: `Approved by ${levelName(lv, a.div)}` }); }
  else {   // above this person's limit: they recommend, it moves up
    if (!a.route[a.level + 1]) a.route.push(LEVELS[LEVELS.indexOf(lv) + 1]);
    a.level++; a.trail.push({ at, who: who.id, note: `Recommended. Above the ${levelName(lv, a.div)} limit of ${amt(a.type, limitOf(a.type, lv))}, sent to ${levelName(a.route[a.level], a.div)}.` });
  }
  if (a.ref.kind === 'order' && a.status !== 'Pending') { const o = D.order.find(x => x.id === a.ref.id); if (o) o.status = a.status === 'Approved' ? o.stage : 'credit declined'; }   // approved: the order can now be marked Confirmed
  if (a.ref.kind === 'project' && PROJ[a.ref.id].special_price && a.status !== 'Pending') Object.assign(PROJ[a.ref.id].special_price, a.status === 'Approved' ? { status: 'approved', approver: who.id } : { status: 'rejected' });
  return a;
};
const canMatrix = () => ['owner', 'director', 'admin'].includes(me().role);
const timer = a => { const left = RULES[a.type].sla_hours - (NOW - dt(apAt(a))) / 36e5, last = a.level >= a.route.length - 1;
  return left >= 0 ? `<span class="small">${last ? 'Due' : 'Escalates'} in ${Math.ceil(left)} h</span>` : `<span class="badge bad">Overdue ${Math.round(-left)} h</span>`; };
EM.VIEWS.approvals = arg => {
  const matrix = `<section class="stack-s"><div class="row between"><h3>Approval matrix</h3><span class="small muted">${canMatrix() ? 'Edit any limit; new requests route by it at once.' : 'Set by the Owner, Director or CRM admin.'}</span></div>
    ${table(['Approval type', 'Regional Manager / Project Head', 'Wholesale / Retail Head', 'Director', 'Owner', 'Time allowed'], D.approval_rule.map(r => [`<b>${esc(r.type)}</b> <span class="small muted">${r.unit}</span>`,
      ...['rm', 'head', 'director'].map(lv => canMatrix() ? `<input class="input" type="number" min="0" style="width:110px" value="${r.limits[lv]}" data-rule="${r.id}|${lv}" aria-label="${esc(r.type)} limit for ${lv}">` : amt(r.type, r.limits[lv])), 'No limit', `${r.sla_hours} h`]))}
    <p class="small muted">Sample limits until Q-67 is answered. A 0 limit means that role cannot approve this type.</p></section>`;
  if (me().role === 'admin') return `<div class="stack"><div class="stack-s"><h1>Approvals</h1><p class="muted">As CRM admin you set the matrix; the requests themselves are business records and stay hidden for your role.</p></div>${matrix}</div>`;
  const mine = D.approval.filter(apSee), pend = mine.filter(a => a.status === 'Pending').sort((a, b) => a.at.localeCompare(b.at)), sel = APV[arg];
  const detail = sel && apSee(sel) ? (() => { const [nm, href] = refOf(sel); return `<section class="card stack-s" id="ap-detail"><div class="row between"><h3>${esc(sel.type)} · ${amt(sel.type, sel.amount)}</h3><span class="badge ${sel.status === 'Approved' ? 'ok' : sel.status === 'Rejected' ? 'bad' : 'warn'}">${sel.status}</span></div>
    ${kv([['Record', `<a href="${href}">${esc(nm)}</a>`], ['Reason', esc(sel.reason)], ['Route', esc(routeText(sel))], ['Now with', sel.status === 'Pending' ? `${esc(levelName(sel.route[sel.level], sel.div))} · ${timer(sel)}` : '']])}
    <div class="timeline">${sel.trail.slice().reverse().map((t, i) => `<div class="${i ? '' : 'on'}"><div>${esc(t.note)}</div><div class="small muted">${dFmt(t.at)} ${tFmt(t.at)}${t.who ? ' · ' + esc(emp(t.who)) : ' · system'}</div></div>`).join('')}</div>
    ${sel.status === 'Pending' ? `<div class="row"><button class="btn primary" data-act="ap-ok" data-a="${sel.id}">Approve as ${esc(levelName(sel.route[sel.level], sel.div))}</button><button class="btn" data-act="ap-no" data-a="${sel.id}">Reject</button></div>` : ''}</section>`; })() : '';
  const trail = mine.flatMap(a => a.trail.map(t => ({ a, t }))).sort((x, y) => y.t.at.localeCompare(x.t.at)).slice(0, 20);
  return `<div class="stack">${gnav('approvals')}
    <div class="row between" style="align-items:flex-start"><div class="stack-s"><h1>Approvals</h1><p class="muted" style="max-width:760px">Every request goes to the first person who can decide. Above their limit they recommend it and it moves up; no decision in the time allowed escalates on its own. ${demo}</p></div>
      <button class="btn primary" data-act="ap-new">+ New request</button></div>
    ${detail}
    <div class="grid g4">${stat('Waiting', pend.length)}${stat('Overdue', pend.filter(a => (NOW - dt(apAt(a))) / 36e5 > RULES[a.type].sla_hours).length)}${stat('With the Owner', pend.filter(a => a.route[a.level] === 'owner').length, 'the matrix keeps routine decisions below')}${stat('Decided', mine.filter(a => a.status !== 'Pending').length)}</div>
    <section class="stack-s"><h3>Queue</h3>${pend.length ? table(['Type', 'Record', 'Amount', 'Route', 'Now with', 'Timer'], pend.map(a => { const [nm] = refOf(a); return { href: `#/approvals/${a.id}`,
      cells: [esc(a.type), esc(nm), amt(a.type, a.amount), esc(routeText(a)), esc(levelName(a.route[a.level], a.div)), timer(a)] }; })) : '<p class="muted">Nothing waiting.</p>'}</section>
    ${matrix}
    <section class="stack-s"><h3>Audit trail</h3>${table(['When', 'Request', 'Step', 'By'], trail.map(({ a, t }) => [`${dFmt(t.at)} ${tFmt(t.at)}`, `<a href="#/approvals/${a.id}">${esc(a.type)} · ${esc(refOf(a)[0])}</a>`, esc(t.note), t.who ? esc(emp(t.who)) : 'System']))}</section></div>`;
};
EM.VIEWS.approvals.title = () => 'Approvals';
EM.ACTIONS['ap-ok'] = el => { const a = decide(APV[el.dataset.a], true); EM.toast(`<b>${esc(a.trail[a.trail.length - 1].note)}</b>`); EM.rerender(); };
EM.ACTIONS['ap-no'] = el => { decide(APV[el.dataset.a], false); EM.toast('Rejected. The requester is told why on WhatsApp.'); EM.rerender(); };
document.addEventListener('change', e => {
  const el = e.target.closest('[data-rule]'); if (!el) return;
  const [id, lv] = el.dataset.rule.split('|'), r = D.approval_rule.find(x => x.id === id);
  r.limits[lv] = Math.max(0, +el.value || 0); EM.toast(`${esc(r.type)}: ${esc(levelName(lv, 'wholesale'))} limit now ${amt(r.type, r.limits[lv])}. New requests route by it.`);
});
EM.ACTIONS['ap-new'] = () => {
  const ds_ = D.dealer.filter(seeDealer).sort((a, b) => a.name.localeCompare(b.name)), types = D.approval_rule.filter(r => !['Project pricing', 'Complaint settlements'].includes(r.type));
  if (!ds_.length) return EM.toast('No dealers in your scope to raise a request for.');
  EM.modal(`<h2>New approval request</h2><div class="stack" style="margin-top:12px">
    <div class="field"><label for="an-type">Type</label><select class="input" id="an-type">${types.map(r => `<option>${esc(r.type)}</option>`).join('')}</select></div>
    <div class="field"><label for="an-dealer">Dealer</label><select class="input" id="an-dealer">${ds_.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></div>
    <div class="grid g2"><div class="field"><label for="an-amt">Amount (₹, or % for a discount)</label><input class="input" id="an-amt" type="number" min="1" value="250000"></div><div class="field"><label for="an-why">Reason</label><input class="input" id="an-why" value="Festive stocking"></div></div>
    <div id="an-err" class="small" style="color:var(--bad)"></div><div class="row"><button class="btn primary" data-act="ap-save">Send</button><button class="btn" data-act="close-modal">Cancel</button></div></div>`);
};
EM.ACTIONS['ap-save'] = () => {
  const v = +qs('#an-amt').value, why = qs('#an-why').value.trim();
  if (!(v > 0) || !why) { qs('#an-err').textContent = 'Enter an amount and a reason.'; return; }
  const a = requestApproval(qs('#an-type').value, v, 'wholesale', { kind: 'dealer', id: qs('#an-dealer').value }, why, EM.meId);
  EM.closeModal(); EM.toast(`<b>Sent: ${esc(a.type)} · ${amt(a.type, v)}</b><ul><li>Route: ${esc(routeText(a))}</li><li>${esc(levelName(a.route[0], a.div))} gets a WhatsApp + task</li></ul>`);
  location.hash = `#/approvals/${a.id}`;
};

// ---------------------------------------------------------------- lost sales (stock-outs)
const lostSee = x => x.division === 'retail' ? canDiv('retail') : seeDealer(DL[x.dealer]);
const lostBySku = () => Object.values(D.lost_sale.filter(lostSee).reduce((m, x) => { const r = (m[x.sku] ||= { sku: x.sku, n: 0, qty: 0, value: 0 }); r.n++; r.qty += x.qty; r.value += x.value; return m; }, {})).sort((a, b) => b.value - a.value);
const skuName = id => `${SKU[id].collection} · ${SKU[id].design}`;
EM.VIEWS.lostsales = arg => {
  const s = SKU[arg], all = D.lost_sale.filter(lostSee), rows = all.filter(x => !s || x.sku === arg).sort((a, b) => b.at.localeCompare(a.at)), top = lostBySku();
  const free = id => D.warehouse.reduce((a, w) => a + Math.max(0, ((D.wstock.find(x => x.sku === id && x.wh === w.id) || {}).on_hand || 0) - ((D.wstock.find(x => x.sku === id && x.wh === w.id) || {}).allocated || 0)), 0);
  return `<div class="stack">${wnav('stock')}${s ? crumbs(['Lost sales', '#/lostsales'], [skuName(arg)]) : ''}
    <div class="stack-s"><div class="kicker">Wholesale · EGO Premium</div><h1>${s ? esc(skuName(arg)) : 'Lost sales'}</h1><p class="muted" style="max-width:760px">Orders lost because the design was out of stock or arrived too late. Every row names the SKU, quantity, value and who lost it, so purchasing sees the real cost of a stock-out. ${demo}</p></div>
    <div class="grid g4">${stat('Lost orders', rows.length)}${stat('Value lost', inr(rows.reduce((a, x) => a + x.value, 0)))}${stat('Designs affected', new Set(rows.map(x => x.sku)).size)}${stat(s ? 'Free stock now' : 'Out of stock now', s ? numFmt(free(arg)) : D.sku.filter(k => free(k.id) === 0).length, s ? s.unit : 'designs')}</div>
    ${s ? '' : `<section class="stack-s"><h3>Most lost designs</h3>${table(['Design', 'Lost orders', 'Qty', 'Value', 'Free stock now'], top.slice(0, 10).map(r => ({ href: `#/lostsales/${r.sku}`, cells: [`<div class="row" style="flex-wrap:nowrap">${thumb(SKU[r.sku])}<span>${esc(skuName(r.sku))}</span></div>`, r.n, `${numFmt(r.qty)} ${esc(SKU[r.sku].unit)}`, inr(r.value), numFmt(free(r.sku))] })))}</section>`}
    <section class="stack-s"><h3>Log</h3>${table(['Date', 'Design', 'Qty', 'Value', 'Lost by', 'Reason', 'Recorded by'], rows.map(x => [dFmt(x.at), esc(skuName(x.sku)), `${numFmt(x.qty)} ${esc(SKU[x.sku].unit)}`, inr(x.value),
      x.dealer ? `<a href="#/dealer/${x.dealer}">${esc(DL[x.dealer].name)}</a>` : `<a href="#/project/${x.project}">${esc(PROJ[x.project].name)}</a>`, esc(x.reason), esc(emp(x.recorded_by))]))}</section></div>`;
};
EM.VIEWS.lostsales.title = a => SKU[a] ? skuName(a) : 'Lost sales';

// ---------------------------------------------------------------- CEO cockpit / AI Strategy
const exceptions = () => {
  const out = [], seen = new Set(), push = x => { if (!seen.has(x.href)) { seen.add(x.href); out.push(x); } };
  const byDealer = roll(DTG, t => t.dealer).sort((a, b) => a.gap - b.gap);
  byDealer.slice(0, 3).forEach(x => push({ sev: 'High', name: DL[x.k].name, href: `#/dealer/${x.k}`, what: `${inr(-x.gap)} behind YTD target`, act: `${emp(DL[x.k].field_owner)} to visit with the live scheme and the cross-sell plan` }));
  byDealer.filter(x => DL[x.k].p200_tier === 'A').slice(0, 2).forEach(x => push({ sev: 'High', name: DL[x.k].name, href: `#/p200/${x.k}`, what: `Priority 200 tier A, ${pctOfTxt(x)} of plan`, act: 'Review the development plan this week' }));
  D.dealer.filter(d => d.at_risk).sort((a, b) => b.ltv_12m - a.ltv_12m).slice(0, 2).forEach(d => push({ sev: 'Medium', name: d.name, href: `#/dealer/${d.id}/relationship`, what: `No order in ${d.days_since_order} days (usually every ${d.cycle_days})`, act: `${emp(d.field_owner)} to call today` }));
  const od = D.dealer.slice().sort((a, b) => b.overdue - a.overdue)[0];
  push({ sev: 'High', name: od.name, href: `#/dealer/${od.id}/overview`, what: `${inr(od.overdue)} overdue in Tally`, act: 'Hold new credit until a payment date is agreed' });
  D.approval.filter(a => a.status === 'Pending').sort((a, b) => apAt(a).localeCompare(apAt(b))).slice(0, 2).forEach(a => push({ sev: 'Medium', name: refOf(a)[0], href: `#/approvals/${a.id}`, what: `${a.type} ${amt(a.type, a.amount)} waiting with ${levelName(a.route[a.level], a.div)}`, act: 'Decide, or change the limit so it stops reaching you' }));
  const ls = lostBySku()[0];
  if (ls) push({ sev: 'Medium', name: skuName(ls.sku), href: `#/lostsales/${ls.sku}`, what: `${ls.n} orders lost to stock-outs · ${inr(ls.value)}`, act: 'Place a production order at MOQ' });
  D.site.filter(s => s.delays.length && s.step < 14).sort((a, b) => b.delays.reduce((x, y) => x + y.days, 0) - a.delays.reduce((x, y) => x + y.days, 0)).slice(0, 2)
    .forEach(s => push({ sev: 'Medium', name: s.name, href: `#/site/${s.id}`, what: `Delayed: ${s.delays[s.delays.length - 1].reason}`, act: 'Project Head to clear the blocker with the client' }));
  const near = D.scheme.filter(sc => sc.status === 'Live').flatMap(sc => D.scheme_progress.filter(x => x.scheme === sc.id).map(x => { const nx = sc.slabs[slabOf(sc, x.achieved) + 1]; return { sc, x, left: nx ? nx.from - x.achieved : Infinity }; })).sort((a, b) => a.left - b.left)[0];
  if (near) push({ sev: 'Low', name: DL[near.x.dealer].name, href: `#/schemes/${near.sc.id}`, what: `${inr(near.left)} from the next slab of ${near.sc.name}`, act: 'Tell the dealer on WhatsApp; one more order earns the slab' });
  return out.slice(0, 15);
};
const pctOfTxt = x => `${Math.round(x.act / Math.max(1, x.ytd) * 100)}%`;
const gapBars = (title, rows, label) => { const worst = rows.filter(x => x.gap < 0).sort((a, b) => a.gap - b.gap).slice(0, 4), max = Math.max(1, ...worst.map(x => -x.gap));
  return `<section class="card stack-s"><h3>${title}</h3>${worst.length ? worst.map(x => `<div><div class="row between"><span>${label(x.k)}</span><span class="small">${gapTxt(x.gap)} · ${pctOfTxt(x)}</span></div><div class="bar"><b style="width:${Math.round(-x.gap / max * 100)}%;background:var(--bad)"></b></div></div>`).join('') : '<p class="muted small">Nothing behind.</p>'}</section>`; };
const QA = [
  ['behind', 'Why are we behind Mission ₹25 cr?', () => { const c = roll(DTG, t => t.category).sort((a, b) => a.gap - b.gap), t = total(DTG);
    return [`We are ${inr(t.ytd - t.act)} behind the YTD target (${pctOfTxt(t)}). The biggest gaps are ${c.slice(0, 2).map(x => `${x.k} (${inr(-x.gap)})`).join(' and ')}, and orders lost to stock-outs add ${inr(D.lost_sale.reduce((a, x) => a + x.value, 0))}.`,
      table(['Product', 'YTD target', 'Actual', 'Gap'], c.slice(0, 5).map(x => [esc(x.k), inr(x.ytd), inr(x.act), gapTxt(x.gap)]))]; }],
  ['p200', 'Which Priority 200 dealers are furthest behind plan?', () => { const r = roll(DTG.filter(t => DL[t.dealer].p200_tier), t => t.dealer).sort((a, b) => a.gap - b.gap).slice(0, 5);
    return [`${r.length} dealers with the largest gaps; each plan shows its product gaps and what EGO has invested.`, table(['Dealer', 'Tier', 'Achieved', 'Gap'], r.map(x => ({ href: `#/p200/${x.k}`, cells: [esc(DL[x.k].name), DL[x.k].p200_tier, pctOfTxt(x), gapTxt(x.gap)] })))]; }],
  ['stock', 'Which designs lost us the most orders to stock-outs?', () => { const r = lostBySku().slice(0, 5);
    return [`${skuName(r[0].sku)} lost the most: ${r[0].n} orders worth ${inr(r[0].value)}.`, table(['Design', 'Lost orders', 'Value'], r.map(x => ({ href: `#/lostsales/${x.sku}`, cells: [esc(skuName(x.sku)), x.n, inr(x.value)] })))]; }],
  ['scheme', 'Which scheme gave the best return?', () => { const r = D.scheme.map(sc => ({ sc, e: effect(sc) })).sort((a, b) => b.e.ret - a.e.ret);
    return [`${r[0].sc.name}: ${r[0].e.ret.toFixed(1)}× its rewards in extra GP, measured against dealers outside the scheme.`, table(['Scheme', 'Rewards', 'Extra GP', 'Return'], r.map(({ sc, e }) => ({ href: `#/schemes/${sc.id}`, cells: [esc(sc.name), inr(e.cost), inr(Math.max(0, e.extraGp)), `${e.ret.toFixed(1)}×`] })))]; }],
  ['people', 'Which salesperson has the biggest gap to target?', () => { const r = roll(DTG, t => DL[t.dealer].field_owner).sort((a, b) => a.gap - b.gap).slice(0, 5);
    return [`${emp(r[0].k)} is furthest behind: ${inr(-r[0].gap)} (${pctOfTxt(r[0])} of YTD target).`, table(['Salesperson', 'Dealers', 'Achieved', 'Gap'], r.map(x => [esc(emp(x.k)), D.dealer.filter(d => d.field_owner === x.k).length, pctOfTxt(x), gapTxt(x.gap)]))]; }],
  ['approvals', 'Which approvals are waiting longest?', () => { const r = D.approval.filter(a => a.status === 'Pending').sort((a, b) => apAt(a).localeCompare(apAt(b))).slice(0, 5);
    return [`${r.length} requests have waited longest; ${r.filter(a => a.route[a.level] === 'owner').length} of them are with the Owner.`, table(['Request', 'Record', 'With', 'Waiting since'], r.map(a => ({ href: `#/approvals/${a.id}`, cells: [`${esc(a.type)} · ${amt(a.type, a.amount)}`, esc(refOf(a)[0]), esc(levelName(a.route[a.level], a.div)), `${dFmt(apAt(a))} ${tFmt(apAt(a))}`] })))]; }],
];
EM.VIEWS.cockpit = () => {
  const cats = roll(DTG, t => t.category), areas = roll(DTG, t => MK[DL[t.dealer].market].city), dls = roll(DTG, t => t.dealer), ppl = roll(DTG, t => DL[t.dealer].field_owner);
  const lostFy = D.lost_sale.filter(x => dt(x.at) >= FY_START), openOrd = D.order.filter(o => o.stage !== 'Payment collected' || (o.ful && o.ful.stage !== 'Delivered')), moq = D.order.filter(o => o.ful && o.ful.stage === 'Waiting on production');
  const exc = exceptions();
  return `<div class="stack">
    <div class="stack-s"><div class="kicker">Owner &amp; Director · AI Strategy</div><h1>CEO cockpit</h1><p class="muted" style="max-width:780px">Review the company in ten minutes, then work by exception. Every number opens its records. ${demo}</p></div>
    ${missionHead(DTG)}
    <section class="stack-s"><h2>Why we are behind</h2><div class="grid g3">
      ${gapBars('By product', cats, k => esc(k))}${gapBars('By area', areas, k => esc(k))}${gapBars('By dealer', dls, k => `<a href="#/dealer/${k}">${esc(DL[k].name)}</a>`)}${gapBars('By salesperson', ppl, k => esc(emp(k)))}
      <section class="card stack-s"><h3>Stock</h3>${kv([['Lost to stock-outs', `<a href="#/lostsales">${inr(lostFy.reduce((a, x) => a + x.value, 0))}</a> this FY · ${lostFy.length} orders`], ['Most lost', lostBySku()[0] ? `<a href="#/lostsales/${lostBySku()[0].sku}">${esc(skuName(lostBySku()[0].sku))}</a>` : '']])}</section>
      <section class="card stack-s"><h3>Pipeline</h3>${kv([['Open dealer orders', `<a href="#/orders">${inr(openOrd.reduce((a, o) => a + o.total, 0))}</a> · ${openOrd.length}`], ['Waiting on production', `${inr(moq.reduce((a, o) => a + o.total, 0))} · ${moq.length} orders`],
        ['Project pipeline', `<a href="#/projects">${inr(D.project.filter(p => p.stage_idx < 7 && p.stage !== 'Lost').reduce((a, p) => a + p.value, 0))}</a>`]])}</section></div></section>
    <section class="stack-s"><h2>Top exceptions</h2><p class="small muted">Ranked by impact. Each opens the record behind it, with the next best action.</p>
      ${table(['', 'Exception', 'Why', 'Next best action'], exc.map(x => [`<span class="badge ${x.sev === 'High' ? 'bad' : x.sev === 'Medium' ? 'warn' : 'plain'}">${x.sev}</span>`, `<a href="${x.href}" data-exc="${esc(x.name)}">${esc(x.name)}</a>`, esc(x.what), esc(x.act)]))}</section>
    <section class="card stack-s"><h2>Ask</h2><p class="small muted">Sample: six questions answered from the sample records. In the build the AI answers any question in plain words, only from records you may see, and shows the records behind the answer.</p>
      <div class="row"><input class="input grow" id="ask-q" placeholder="e.g. why are we behind?" style="min-width:200px"><button class="btn primary" data-act="ask">Ask</button></div>
      <div>${QA.map(([k, q]) => `<button class="chip" data-act="ask" data-q="${k}" style="cursor:pointer">${esc(q)}</button>`).join('')}</div><div id="qa"></div></section></div>`;
};
EM.VIEWS.cockpit.title = () => 'CEO cockpit';
EM.ACTIONS.ask = el => {
  const typed = (qs('#ask-q').value || '').toLowerCase(), words = { behind: ['behind', 'mission', 'gap'], p200: ['priority', 'p200', 'plan'], stock: ['stock', 'lost', 'design'], scheme: ['scheme', 'return'], people: ['salesperson', 'sales person', 'rep', 'who'], approvals: ['approval', 'waiting'] };
  const k = el.dataset.q || Object.keys(words).find(w => words[w].some(x => typed.includes(x)));
  const hit = QA.find(q => q[0] === k);
  qs('#qa').innerHTML = hit ? (([txt, recs]) => `<div class="stack-s" style="margin-top:10px"><b>${esc(hit[1])}</b><p>${esc(txt)}</p><div class="small muted">Records behind this answer:</div>${recs}</div>`)(hit[2]())
    : '<p class="muted" style="margin-top:10px">In this sample only the six questions above are answered.</p>';
};

// ---------------------------------------------------------------- dealer portal (role: dealer, bound to one dealer)
const MATERIAL = ['EGO catalogue 2026 (PDF)', 'Monsoon SPC Booster poster', 'WhatsApp creatives: Engineered range', 'Installation guide: SPC click-lock', 'Warranty terms by product'];
function dealerHome() {
  const d = DL[me().dealer], t = dealerTot(d.id), orders = D.order.filter(seeOrder).slice(-8).reverse(), openO = D.order.filter(o => seeOrder(o) && (o.stage !== 'Payment collected' || (o.ful && o.ful.stage !== 'Delivered')));
  const staff = D.dealer_employee.filter(e => e.dealer === d.id), certs = D.training.flatMap(tr => tr.attendees.filter(a => a.certified && staff.some(e => e.id === a.who)).map(a => ({ ...a, course: tr.course })));
  const tks = D.ticket.filter(x => x.dealer === d.id), ex = D.exclusive_stock.filter(x => x.dealer === d.id), fo = EMP[d.field_owner];
  const age = x => Math.round((NOW - dt(x.received + 'T12:00:00+05:30')) / 864e5);
  return `<div class="stack">
    <div class="stack-s"><div class="kicker">Dealer portal · ${esc(d.name)}</div><h1>Welcome, ${esc(d.owner.split(' ')[0])}</h1><p class="muted">Your business with EGO in one place. Your EGO contact: ${esc(fo.name)} · ${esc(fo.phone)} ${demo}</p></div>
    <div class="grid g4">${stat('Target achieved', pctB(t.act, t.ytd), `${inr(t.act)} of ${inr(t.ytd)} due by today · FY ${inr(t.fy)}`)}${stat('Outstanding', inr(d.outstanding), d.overdue ? `${inr(d.overdue)} overdue` : 'nothing overdue')}
      ${stat('Open orders', openO.length)}${stat('Open tickets', tks.filter(x => x.status !== 'Closed').length)}</div>
    <div class="grid g2">
      <section class="card stack-s"><h3>Target by product</h3>${table(['Product', 'FY target', 'Due by today', 'Achieved', ''], DTG.filter(x => x.dealer === d.id).map(x => [esc(x.category), inr(x.fy_target), inr(x.fy_target * ytdShare), inr(x.ytd_actual), pctB(x.ytd_actual, x.fy_target * ytdShare)]))}</section>
      <section class="card stack-s"><h3>Scheme progress</h3>${D.scheme_progress.filter(x => x.dealer === d.id).map(x => { const sc = SCH[x.scheme], k = slabOf(sc, x.achieved), nx = sc.slabs[k + 1];
        return `<div class="stack-s"><div class="row between"><b>${esc(sc.name)}</b><span class="small muted">to ${ds(sc.to)}</span></div><div class="bar"><b style="width:${Math.min(100, Math.round(x.achieved / sc.slabs[sc.slabs.length - 1].from * 100))}%"></b></div>
          <span class="small">${inr(x.achieved)} · ${slabTxt(sc, k)} · reward so far ${inr(reward(sc, x.achieved))}${nx ? ` · ${inr(nx.from - x.achieved)} to slab ${k + 2} (${nx.pct}%)` : ' · top slab reached'}</span></div>`; }).join('') || '<p class="muted">No scheme running for you right now.</p>'}</section></div>
    <section class="stack-s"><h3>Orders</h3>${table(['Order', 'Date', 'Designs', 'Value', 'Status'], orders.map(o => [esc(o.no), dFmt(o.at), o.lines.length, inr(o.total + o.gst), esc(o.ful ? o.ful.stage : o.stage)]))}</section>
    <div class="grid g2">
      <section class="card stack-s"><h3>Outstanding · from Tally</h3>${kv([['Outstanding', inr(d.outstanding)], ['Overdue', d.overdue ? `<b style="color:var(--bad)">${inr(d.overdue)}</b>` : 'None'], ['Credit limit', inr(d.credit_limit)],
        ['Last payments', D.receipt.filter(r => r.dealer === d.id).map(r => `${dFmt(r.at)} · ${inr(r.amount)} · ${esc(r.mode)}`).join('<br>') || 'None in the last 20 days']])}</section>
      <section class="card stack-s"><h3>EGO Exclusive stock</h3>${ex.length ? table(['Design', 'Colour', 'Qty', 'Received', 'Ageing'], ex.map(x => [esc(SKU[x.sku].collection), esc(SKU[x.sku].colour), `${numFmt(x.qty)} ${esc(SKU[x.sku].unit)}`, ds(x.received),
        `<span class="badge ${age(x) > 90 ? 'bad' : age(x) > 60 ? 'warn' : 'ok'}">${age(x)} days</span>`])) : '<p class="muted">No EGO Exclusive stock with you.</p>'}</section></div>
    <div class="grid g2">
      <section class="card stack-s"><h3>Certificates</h3>${certs.length ? table(['Person', 'Course', 'Expires'], certs.map(a => [esc(DEMP[a.who].name), esc(a.course), a.expires < TODAY ? `<span class="badge bad">${ds(a.expires)}</span>` : ds(a.expires)])) : '<p class="muted">No certificates yet. Ask your EGO contact for the next training.</p>'}</section>
      <section class="card stack-s"><h3>Marketing material</h3>${MATERIAL.map(m => `<div class="row between"><span>${esc(m)}</span><button class="btn sm" data-act="dl-material">Download</button></div>`).join('')}</section></div>
    <section class="stack-s"><div class="row between"><h3>Support tickets</h3><button class="btn primary" data-act="tk-new">+ Raise a ticket</button></div>
      ${table(['Ticket', 'Raised', 'Type', 'Subject', 'Status'], tks.slice().sort((a, b) => b.at.localeCompare(a.at)).map(x => [x.no, dFmt(x.at), esc(x.type), esc(x.subject), `<span class="badge ${x.status === 'Closed' ? 'ok' : x.status === 'Open' ? 'warn' : 'info'}">${x.status}</span>`]))}</section></div>`;
}
EM.ACTIONS['dl-material'] = () => EM.toast('Sample: the file downloads here in the build.');
EM.ACTIONS['tk-new'] = () => EM.modal(`<h2>Raise a ticket</h2><div class="stack" style="margin-top:12px">
  <div class="field"><label for="tk-type">Type</label><select class="input" id="tk-type">${['Order / dispatch', 'Scheme query', 'Product complaint', 'Samples & displays', 'Payment / ledger'].map(x => `<option>${x}</option>`).join('')}</select></div>
  <div class="field"><label for="tk-sub">What do you need?</label><input class="input" id="tk-sub"></div><div id="tk-err" class="small" style="color:var(--bad)"></div>
  <div class="row"><button class="btn primary" data-act="tk-save">Send</button><button class="btn" data-act="close-modal">Cancel</button></div></div>`);
EM.ACTIONS['tk-save'] = () => {
  const sub = qs('#tk-sub').value.trim();
  if (!sub) { qs('#tk-err').textContent = 'Tell us what you need.'; return; }
  const d = DL[me().dealer], no = `TKT-${3200 + EM.tick++}`;
  D.ticket.push({ id: 'tic_new' + EM.tick, no, dealer: d.id, at: stamp(), type: qs('#tk-type').value, subject: sub, status: 'Open', owner: d.telesales_owner });
  EM.closeModal(); EM.toast(`<b>${no} raised</b><ul><li>${esc(emp(d.telesales_owner))} at EGO has it</li><li>Updates come on WhatsApp</li></ul>`); EM.rerender();
};
