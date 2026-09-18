'use strict';
/* Leads, roles, phone app, AI Analysis, Tech & ops — mock product screens on sample data. */

const B2C = ['New', 'Contacted', 'Qualified', 'Dealer Allocated', 'Dealer Accepted', 'Appointment / E-Showroom', 'Site Visit', 'Sample', 'Quote', 'Won'];
const demo = '<span class="badge plain">DEMO</span>';
const flow = (stages, cur) => { const i = stages.indexOf(cur); return `<div class="flow">${stages.map((s, k) => `<span class="${k === i ? 'cur' : k < i ? 'done' : ''}">${esc(s)}</span>`).join('<i>›</i>')}</div>`; };
const gradeBadge = g => `<span class="badge ${g === 'Platinum' ? 'info' : g === 'A' ? 'ok' : 'plain'}">${g}${g.length === 1 ? ' grade' : ''}</span>`;

// ---------------------------------------------------------------- leads
EM.VIEWS.leads = () => {
  const by = st => D.lead.filter(seeLead).filter(l => l.stage === st);
  const src = Object.entries(D.lead.reduce((m, l) => (m[l.source] = (m[l.source] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);
  return `<div class="stack">${crumbs(['System map', '#/map'], ['Consumer leads'])}
    <div class="row between"><div class="stack-s"><h1>Consumer Lead Engine</h1><p class="muted">${D.lead.length} leads · last 75 days · Big E ${demo}</p></div></div>
    <div class="row">${src.map(([s, n]) => `<span class="chip">${s} · ${n}</span>`).join('')}</div>
    ${frame('Leads › Pipeline', `<div class="board">${[...B2C, 'Lost'].map(st => { const ls = by(st); return `<div class="lane"><h4><span>${st}</span><span class="muted">${ls.length}</span></h4>
      ${ls.slice(0, 4).map(l => `<div class="mini" data-href="#/lead/${l.id}" tabindex="0"><b>${esc(l.name)}</b><div class="muted">${esc(l.category)} · ${l.area_sqft} sq ft · ${esc(MK[l.market].name)}</div><div class="muted">${esc(l.source)}${l.ai_score ? ` · AI ${l.ai_score}` : ''}</div></div>`).join('')}
      ${ls.length > 4 ? `<div class="small muted" style="margin-top:6px">+ ${ls.length - 4} more</div>` : ''}</div>`; }).join('')}</div>`)}
    <p class="small muted">Scroll sideways to see every stage. Lost always needs a reason; every stage change is timestamped for SLA and ageing reports.</p></div>`;
};
EM.VIEWS.leads.tab = 'leads';

const NEXT = {
  New: ['Contacted', 'AI voice agent', 'Called within 4 min in Hindi; customer answered'],
  Contacted: ['Qualified', 'AI voice agent', 'Area, budget, room and timeline captured → qualified'],
  Qualified: ['Dealer Allocated', 'Routing rule', 'Nearest Platinum/A dealer for this area + category; WhatsApp offer sent with Accept button'],
  'Dealer Allocated': ['Dealer Accepted', 'WhatsApp', 'Dealer tapped “Accept” — SLA timer stopped'],
  'Dealer Accepted': ['Appointment / E-Showroom', 'Runo', 'Telecaller call (3m 12s, Connected – interested) → appointment booked'],
  'Appointment / E-Showroom': ['Site Visit', 'Phone app', 'Dealer’s visit logged with photos and measurement'],
  'Site Visit': ['Sample', 'Phone app', 'Samples given: 2 SPC, 1 LVT — follow-up in 3 days'],
  Sample: ['Quote', 'Portal', 'Quotation v1 uploaded; value updated'],
  Quote: ['Won', 'Tally', 'Order confirmed; posted to Tally; customer gets WhatsApp confirmation'],
};
const scoreWhy = l => [l.area_sqft >= 900 ? `large area (${l.area_sqft} sq ft)` : `small area (${l.area_sqft} sq ft)`, /10L|5–10/.test(l.budget) ? `budget ${l.budget}` : `budget only ${l.budget}`,
  l.with_architect ? 'architect involved' : 'no architect', ['Meta Ads', 'Google Ads', 'Website'].includes(l.source) ? `came from ${l.source}` : `source ${l.source}`].map(esc).join(' · ');
EM.VIEWS.lead = id => {
  const l = LEAD[id];
  if (!l) return '<p>Lead not found.</p>';
  if (!seeLead(l)) return EM.noAccess('This lead belongs to another telecaller.');
  const calls = D.call.filter(c => c.lead === id);
  const events = [...l.history.map(([s, at]) => ({ at, t: `Stage → <b>${esc(s)}</b>`, sys: s === 'New' ? `Intake · source ${esc(l.source)}` : '' })),
    ...calls.map(c => ({ at: c.at, t: `Runo call · ${esc(emp(c.user))} · ${c.duration_s ? Math.round(c.duration_s / 60) + ' min' : 'no answer'} · ${esc(c.disposition)}`, sys: 'Runo' })),
    ...(l.log || [])].sort((a, b) => b.at.localeCompare(a.at));
  const nx = NEXT[l.stage], d = l.dealer && DL[l.dealer];
  return `<div class="stack">${crumbs(['Consumer leads', '#/leads'], [l.name])}
    <div class="row between"><div class="stack-s"><h1>${esc(l.name)} ${demo}</h1><p class="muted">${esc(l.phone)} · ${esc(market(l.market))} · via ${esc(l.source)}</p></div>
      ${nx ? `<button class="btn primary" data-act="lead-next" data-l="${id}">Simulate next step: ${esc(nx[0])}</button>` : ''}</div>
    <div style="overflow-x:auto">${flow(B2C, l.stage === 'Lost' ? '' : l.stage)}</div>
    <div class="grid g2">
      <section class="card stack-s"><h3>Requirement</h3>${kv([['Category', esc(l.category)], ['Room / application', esc(l.application)], ['Area', `${l.area_sqft} sq ft`], ['Budget', esc(l.budget)], ['With architect?', l.with_architect ? 'Yes' : 'No'], ['Estimated value', inr(l.value)], ['AI score', l.ai_score ? `${l.ai_score} / 100 — <span class="muted small">why: ${scoreWhy(l)}</span>` : '—'], ['Lost reason', esc(l.lost_reason || '—')]])}</section>
      <section class="card stack-s"><h3>Owners</h3>${kv([['Telecaller (Runo)', esc(emp(l.owner))], ['Dealer', d ? `<a href="#/dealer/${d.id}">${esc(d.name)}</a> ${gradeBadge(d.grade)}` : '— not allocated yet'], ['Company', 'Big E']])}
        <h3 style="margin-top:12px">Timeline</h3><div class="timeline">${events.map((e, i) => `<div class="${i === 0 ? 'on' : ''} ${e.fresh ? 'new' : ''}"><div>${e.t}</div><div class="small muted">${dFmt(e.at)} ${tFmt(e.at)}${e.sys ? ' · ' + e.sys : ''}</div></div>`).join('')}</div></section>
    </div></div>`;
};
EM.VIEWS.lead.tab = 'leads';
EM.VIEWS.lead.title = id => LEAD[id] ? LEAD[id].name : 'Lead';
EM.ACTIONS['lead-next'] = el => {
  const l = LEAD[el.dataset.l], [to, sys, what] = NEXT[l.stage], at = stamp();
  if (to === 'Dealer Allocated' && !l.dealer) l.dealer = (D.dealer.find(x => MK[x.market].city === MK[l.market].city && x.grade === 'Platinum') || D.dealer[0]).id;
  l.stage = to; l.history.push([to, at]);
  (l.log ||= []).push({ at, t: esc(what), sys, fresh: true });
  EM.toast(`<b>${esc(sys)} → ${esc(to)}</b><br>${esc(what)}`);
  EM.rerender();
};

// ---------------------------------------------------------------- roles
EM.VIEWS.roles = () => { location.hash = '#/team/roles'; return ''; };
EM.VIEWS.rolesOld = () => {
  const R = [['Founder / Director', 'Both companies', '✓', '✓', '✓', '✓'], ['Sales Head', 'Both companies', '✓', 'Up to ₹5L', '✓', '—'], ['Regional Manager', 'Own region', '✓', 'Up to ₹1L', '—', '—'],
    ['Field Sales', 'Own dealers', '—', '—', '—', '—'], ['Telecaller', 'Own leads', '—', '—', '—', '—'], ['Project Head', 'Projects', '✓ (projects)', 'Project pricing', '—', '—'],
    ['Finance', 'Both companies', '✓', 'Credit limits', '✓', '—'], ['Marketing', 'Leads & campaigns', '— (spend only)', '—', '✓', '—'], ['CRM Administrator', 'Settings only', '—', '—', '—', '✓']];
  return `<div class="stack">${crumbs(['Tech & ops', '#/tech'], ['Roles & permissions'])}<div class="stack-s"><h1>Roles &amp; permissions</h1><p class="muted" style="max-width:760px">Starting proposal — EGO’s admin can change every row. The same rules apply to screens, exports, the API and the AI: if a role can’t see gross profit, the AI won’t tell them either.</p></div>
    ${frame('Settings › Roles', table(['Role', 'Sees data of', 'Cost & GP', 'Approves', 'Export', 'Settings & integrations'], R))}
    <div class="callout">EGO and Big E are separated at company level: a Big E telecaller never sees EGO dealer pricing; founders see both in one view.</div></div>`;
};
EM.VIEWS.roles.tab = 'tech';

// ---------------------------------------------------------------- phone app
EM.VIEWS.app = arg => arg === 'updates' ? appUpdates() : phoneApp();
EM.VIEWS.app.title = a => a === 'updates' ? 'App updates' : 'Phone app';
function phoneApp() {
  const ph = EM.phone ||= { offline: true, outbox: 1, checkedIn: false };
  const rep = D.employee.find(e => e.role === 'ws_field'), plan = D.dealer.filter(d => d.field_owner === rep.id).slice(0, 3);
  const hot = D.lead.filter(l => ['Qualified', 'Contacted'].includes(l.stage) && l.ai_score).sort((a, b) => b.ai_score - a.ai_score).slice(0, 5);
  return `<div class="stack">${crumbs(['System map', '#/map'], ['Phone app'])}
    <div class="row between"><div class="stack-s"><h1>Phone app</h1><p class="muted" style="max-width:720px">One app for field sales, telecallers and site teams. Shown for two roles. It works without network — changes wait in the outbox and sync when the phone is back online.</p></div><a class="btn" href="#/app/updates">How updates keep data →</a></div>
    <div class="phones">
      <div class="stack-s"><div class="kicker" style="text-align:center">Field sales · ${esc(rep.name)}</div><div class="phone"><div class="ph-head">${LOGO(14)}<span>${ph.offline ? 'No network' : '4G'} · 11:30</span></div>
        <div class="ph-body">${ph.offline ? `<div class="offline">Offline · ${ph.outbox} change${ph.outbox === 1 ? '' : 's'} waiting to sync</div>` : `<div class="callout ok small">Online · everything synced</div>`}
          <h3>Today’s visits</h3>
          ${plan.map((d, i) => `<div class="card" style="padding:12px"><div class="row between"><b>${esc(d.name)}</b>${gradeBadge(d.grade)}</div>
            <div class="small muted">Outstanding ${inr(d.outstanding)} · last order ${d.days_since_order} d ago</div>
            ${i === 0 ? `<div class="small" style="margin-top:6px">Buys: <b>${esc(d.categories.slice(0, 3).join(', '))}</b></div>
            <div class="grid" style="grid-template-columns:1fr 1fr;gap:6px;margin-top:8px"><button class="btn ${ph.checkedIn ? '' : 'primary'}" style="min-height:44px" data-act="ph-checkin">${ph.checkedIn ? '✓ Checked in' : 'Check in'}</button><button class="btn" style="min-height:44px" data-act="ph-order">Take order</button></div>` : ''}</div>`).join('')}
          <button class="btn" style="min-height:44px" data-act="ph-net">${ph.offline ? 'Simulate: network is back' : 'Simulate: lose network'}</button>
        </div><div class="ph-tabs"><span class="on">Today</span><span>Dealers</span><span>Orders</span><span>More</span></div></div></div>
      <div class="stack-s"><div class="kicker" style="text-align:center">Telecaller · ${esc(emp(D.employee.find(e => e.role === 'rt_tele').id))}</div><div class="phone"><div class="ph-head">${LOGO(14)}<span>Call queue · 11:30</span></div>
        <div class="ph-body"><h3>Call next</h3><p class="small muted">Ranked by AI score — highest chance of buying first.</p>
          ${hot.map((l, i) => `<div class="card" style="padding:12px"><div class="row between"><b>${esc(l.name)}</b><span class="badge ok">${l.ai_score}</span></div>
            <div class="small muted">${esc(l.category)} · ${l.area_sqft} sq ft · ${esc(MK[l.market].name)} · ${esc(l.source)}</div>
            <button class="btn ${i ? '' : 'primary'}" style="min-height:44px;width:100%;margin-top:8px" data-act="ph-call" data-l="${l.id}">Call via Runo</button></div>`).join('')}
        </div><div class="ph-tabs"><span class="on">Queue</span><span>Leads</span><span>Follow-ups</span><span>More</span></div></div></div>
    </div></div>`;
}
EM.ACTIONS['ph-checkin'] = () => { EM.phone.checkedIn = true; if (EM.phone.offline) EM.phone.outbox++; EM.toast(EM.phone.offline ? 'Checked in with GPS (±12 m). Saved on the phone — will sync when online.' : 'Checked in with GPS (±12 m) and synced.'); EM.rerender(); };
EM.ACTIONS['ph-order'] = () => { if (EM.phone.offline) EM.phone.outbox++; EM.toast(EM.phone.offline ? 'Order with 3 SKU lines saved offline — it goes to EGO Master and Tally when the network returns.' : 'Order saved and posted to Tally.'); EM.rerender(); };
EM.ACTIONS['ph-net'] = () => {
  const ph = EM.phone;
  if (ph.offline) { const n = ph.outbox; ph.offline = false; ph.outbox = 0; EM.toast(`<b>Back online · ${n} change${n === 1 ? '' : 's'} synced</b><ul><li>Original times kept</li><li>Orders posted to Tally</li><li>Nothing typed twice</li></ul>`); }
  else { ph.offline = true; EM.toast('Network lost — the app keeps working offline.'); }
  EM.rerender();
};
EM.ACTIONS['ph-call'] = el => EM.toast(`Opens the Runo dialler for ${esc(LEAD[el.dataset.l].name)}. When the call ends, duration and outcome sync back to the lead in real time.`);

function appUpdates() {
  const dv = EM.device ||= { ver: '1.2.0', build: 12, dealers: 150, visits: 230, orders: 754, outbox: 2, note: '' };
  return `<div class="stack">${crumbs(['Phone app', '#/app'], ['Updates & data'])}
    <div class="stack-s"><h1>New versions never wipe data</h1><p class="muted" style="max-width:780px">The app is shared as a file (APK for Android, .ipa for iPhone), not through the Play Store or App Store. Here is how updates work and why users’ data stays.</p></div>
    <div class="grid g2">
      <section class="card stack-s"><h3>Why the data is safe</h3><ol class="steps">
        <li><span><b>The data lives on EGO’s server.</b> The phone only keeps a copy for offline use. Even a lost phone or a fresh install gets everything back after login.</span></li>
        <li><span><b>Unsent changes sit in an outbox</b> and are removed only after the server confirms them. The app warns before logout if anything is unsent.</span></li>
        <li><span><b>Android updates install over the old app</b> when the package name stays <code>com.egopremium.master</code>, it is signed with the <b>same key</b>, and the version number goes up. Android then keeps the app’s data, like a Play Store update.</span></li>
        <li><span><b>Most updates need no new file:</b> screens and features download inside the app when it opens (over-the-air). A new APK is only for deeper changes such as new permissions — the app shows “New version available” with a download button.</span></li>
      </ol></section>
      <section class="card stack">${frame('Test phone', `<div class="stack-s">
        ${kv([['Installed', `EGO Master <b>v${dv.ver}</b> (build ${dv.build})`], ['Package', '<code>com.egopremium.master</code>'], ['Signing key', '<code>SHA-256 4F:9C:…:A1</code> (EGO Master release key)'], ['On the phone', `${dv.dealers} dealers · ${dv.visits} visits · ${dv.orders} orders`], ['Outbox', dv.outbox ? `<b>${dv.outbox} unsent change${dv.outbox === 1 ? '' : 's'}</b>` : 'empty']])}
        ${dv.note}
        <div class="row"><button class="btn" data-act="upd-ota">Over-the-air update</button><button class="btn primary" data-act="upd-apk">Install new APK v1.3.0</button><button class="btn" data-act="upd-badkey">What if the key is lost?</button></div></div>`)}</section>
    </div>
    <div class="grid g2">
      <section class="card stack-s"><h3>Android (APK)</h3><ul class="clean"><li>Shared by a private download link or WhatsApp; users allow “install from this source” once.</li><li>Release key backed up in two separate secure places — losing it is the one thing that would force a reinstall.</li>
        <li>Google will require sideloaded apps to come from a verified developer — starting 30 Sep 2026 in four countries, worldwide in 2027 (India not in this year’s rollout). We register the developer account as verified and register the app; the app still stays off the Play Store.</li></ul></section>
      <section class="card stack-s"><h3>iPhone (.ipa)</h3><ul class="clean"><li>Apple has no free sideloading. For an internal team we use <b>Ad Hoc</b> distribution: each iPhone’s device ID is registered, then it installs from a private link.</li><li>Limit: 100 iPhones a year; the build is re-signed yearly (we schedule it).</li><li>If EGO grows past 100 iPhones: an unlisted App Store link (not searchable, one Apple review).</li><li>Updates keep data the same way: same app ID, higher version.</li></ul></section>
    </div></div>`;
}
EM.VIEWS.app.tab = 'app';
EM.ACTIONS['upd-ota'] = () => { const dv = EM.device; dv.ver = dv.ver === '1.2.0' ? '1.2.1' : dv.ver; dv.note = `<div class="callout ok small">Updated over the air to v${dv.ver} when the app opened — no file, no reinstall. Data unchanged.</div>`; EM.rerender(); };
EM.ACTIONS['upd-apk'] = () => {
  const dv = EM.device, before = `${dv.dealers} dealers · ${dv.visits} visits · ${dv.orders} orders`, sent = dv.outbox;
  Object.assign(dv, { ver: '1.3.0', build: 13, outbox: 0 });
  dv.note = `<div class="callout ok small"><b>v1.3.0 installed over v1.2.</b> Same package + same key → Android kept the data: ${before}. ${sent ? `The ${sent} unsent change${sent === 1 ? '' : 's'} synced right after.` : ''}</div>`;
  EM.rerender();
};
EM.ACTIONS['upd-badkey'] = () => { EM.device.note = `<div class="callout warn small"><b>Android refuses:</b> “App not installed — package conflicts with an existing package.” A build signed with a different key cannot replace the old app, so the user would have to uninstall first (server data comes back after login, but unsent offline changes would be lost). That is why the release key is backed up twice.</div>`; EM.rerender(); };

// ---------------------------------------------------------------- AI Analysis
EM.VIEWS.ai = () => {
  const ds = D.dealer.filter(seeDealer), rev = ds.reduce((a, d) => a + d.ltv_12m, 0), gp = ds.reduce((a, d) => a + d.gp_12m, 0);
  const dormant = ds.filter(d => d.at_risk).sort((a, b) => b.ltv_12m - a.ltv_12m);
  const top = ds.slice().sort((a, b) => b.ltv_12m - a.ltv_12m).slice(0, 8);
  const hot = D.lead.filter(l => l.stage === 'Qualified' && l.ai_score >= 85).length;
  const cy = d => d.cycle_days, W = canDiv('wholesale') && EM.div !== 'retail', R = canDiv('retail') && EM.div !== 'wholesale';
  return `<div class="stack">${crumbs(['System map', '#/map'], ['AI Analysis'])}
    <div class="row between"><div class="stack-s"><h1>AI Analysis</h1><div class="kicker">${W && R ? 'Both divisions' : W ? 'Wholesale · EGO Premium' : 'Retail · Big E'}</div><p class="muted">As of last night’s run (2:00 am) · numbers computed from CRM + Tally; the AI explains them and links every figure to its records.</p></div><span class="badge info">Phase 1</span></div>
    <div class="grid g4">
      ${W ? `<div class="card stat"><div class="kicker">Dealer sales · 12 months</div><div class="num">${inr(rev)}</div><span class="small muted">GP ${inr(gp)} (${Math.round(gp / rev * 100)}%)</span></div>
      <div class="card stat"><div class="kicker">Dealers at risk</div><div class="num">${dormant.length}</div><span class="small muted">no order for 2× their usual gap (min 45 days)</span></div>
      ` : ''}
      ${R ? `<div class="card stat"><div class="kicker">Hot leads today</div><div class="num">${hot}</div><span class="small muted">qualified, AI score 85+</span></div>
      ` : ''}
      <div class="card stat"><div class="kicker">Tasks pushed</div><div class="num">46</div><span class="small muted">to 14 people · 9 WhatsApp alerts</span></div>
    </div>
    ${W ? `<section class="stack-s"><h2>Dealers slipping — and why</h2>
      ${dormant.slice(0, 6).map(d => `<details class="card"><summary class="row between" style="cursor:pointer"><span><b>${esc(d.name)}</b> ${gradeBadge(d.grade)}</span><span class="small">${d.days_since_order} days since last order · usually every ${cy(d)} days</span></summary>
        <div class="stack-s" style="margin-top:10px"><p><b>Why flagged:</b> last order ${d.days_since_order} days ago against a usual cycle of ${cy(d)} days (${d.orders_12m} orders in 12 months, ${inr(d.ltv_12m)}). ${d.overdue ? `${inr(d.overdue)} is overdue in Tally — a payment issue may be holding orders.` : 'No overdue payments, so the gap is not credit-related.'}</p>
        <p><b>Suggested action:</b> ${esc(emp(d.field_owner))} to visit this week with the current scheme; ${d.categories.includes('SPC') ? 'offer the new LVT range' : 'introduce SPC (not bought yet)'}.</p>
        <p class="small muted">Records: <a href="#/dealer/${d.id}">dealer 360</a> · ${d.orders_12m} orders · Tally ledger</p></div></details>`).join('')}</section>
    <div class="grid g2">
      <section class="stack-s"><h3>Dealer lifetime value (12 months)</h3>${table(['Dealer', 'Grade', 'Sales', 'GP', 'Orders'], top.map(d => ({ href: `#/dealer/${d.id}`, cells: [esc(d.name), gradeBadge(d.grade), inr(d.ltv_12m), inr(d.gp_12m), d.orders_12m] })))}</section>
      <section class="stack-s"><h3>Product performance</h3>${table(['Category', 'Sales', 'GP', 'Dealers', 'Zero-stock SKUs'], D.categories.map(c => [c.name, inr(c.revenue), inr(c.gp), c.dealers, c.stockouts ? `<span class="badge warn">${c.stockouts}</span>` : '0']))}</section>
    </div>
    ` : ''}
    ${R ? `    <section class="stack-s"><h3>Marketing ROI by source</h3>${table(['Source', 'Leads', 'Won', 'Won value', 'Spend (month)', 'Cost per won lead'], D.sources.map(s => [s.name, s.leads, s.won, inr(s.won_value), s.spend ? inr(s.spend) : '—', s.spend && s.won ? inr(s.spend / s.won) : '—']))}
      <p class="small muted">Spend figures are sample values; live figures come from the Meta and Google Ads APIs nightly.</p></section>` : ''}
    <div class="callout"><b>Phase 2 (AI Strategy)</b> adds targets by Dealer × Product and Area × Product, schemes, Priority 200 plans, approvals and the CEO cockpit (“why are we behind Mission ₹25 cr?”) on this same engine.</div>
  </div>`;
};

// ---------------------------------------------------------------- Tech & ops
EM.VIEWS.tech = () => `<div class="stack">${crumbs(['System map', '#/map'], ['Tech & ops'])}
  <div class="stack-s"><h1>Tech &amp; operations</h1><p class="muted" style="max-width:760px">What it is built with, where it runs, how it is kept safe, what it costs to run, and the order we build it in.</p></div>
  <div class="grid g2">
    <section class="card stack-s"><h3>Stack</h3>${table(['Part', 'Built with'], [['Web portal', 'Next.js (TypeScript)'], ['API + jobs', 'Node.js · Redis queue for webhooks, retries and nightly jobs'], ['Database', 'PostgreSQL + pgvector (AI knowledge base in the same database)'], ['Files & photos', 'S3-compatible storage'], ['Phone app', 'React Native (Expo) → APK + .ipa, over-the-air updates, offline SQLite + outbox'], ['Tally bridge', 'Small Windows service on EGO’s Tally PC'], ['Hosting', 'AWS Mumbai region (data stays in India)']])}</section>
    <section class="card stack-s"><h3>Safety</h3><ul class="clean"><li>Separate test and live environments</li><li>Daily encrypted backups + point-in-time restore</li><li>Audit log: who changed what, when (spec §35)</li><li>Role permissions enforced in screens, exports, API and AI</li><li>Login with OTP / MFA for sensitive roles</li><li>API keys stored encrypted; webhook signatures checked</li><li>Every integration: retries, dead-letter queue, admin alert, daily reconciliation</li><li>EGO owns its data: full export + documented data dictionary</li></ul></section>
  </div>
  <section class="stack-s"><h3>Running costs (paid by EGO at actuals)</h3>${table(['Item', 'Basis', 'Estimate'], [['Hosting (AWS Mumbai)', 'Servers, database, storage, backups', '₹10–20k / month — estimate'], ['WhatsApp (Meta)', 'Per delivered template message', 'Marketing ≈ ₹0.86 · utility ≈ ₹0.115 · replies in 24 h free (+GST)'],
    ['AI voice agent', 'Per minute: Bolna ~4–6¢ or Sarvam + Plivo (₹0.38/min calls)', 'Depends on volume — test first'], ['AI model (LLM)', 'Per token, batch pricing at night', 'A few US dollars a month at EGO’s volume'], ['Runo, Sales Diary, Tally', 'EGO’s existing licences', 'No change'], ['Apple developer account', 'Needed for iPhone builds', '$99 / year']])}
    <p class="small muted">Estimates are for planning only and are confirmed during setup. GoHighLevel is no longer needed.</p></section>
  <section class="stack-s"><h3>Build order (Phase 1 ≈ 14–16 weeks)</h3><div class="grid g3">
    <div class="card"><div class="kicker">Weeks 1–6 · Drop 1</div><h3 style="margin:6px 0">CRM on the web</h3><ul class="clean small"><li>Dealers, consumers, architects, products</li><li>3 pipelines + multi-SKU orders</li><li>All lead sources into intake</li><li>Runo two-way · WhatsApp + dealer Accept</li><li>Roles & permissions</li></ul></div>
    <div class="card"><div class="kicker">Weeks 7–10 · Drop 2</div><h3 style="margin:6px 0">Phone app + Tally</h3><ul class="clean small"><li>Phone app (APK + iPhone), offline</li><li>Installations, samples, displays, quotes</li><li>Tally bridge: read outstanding, receipts, stock</li><li>Sales Diary (once docs arrive)</li><li>Escalations + AM/PM digests</li></ul></div>
    <div class="card"><div class="kicker">Weeks 11–16 · Drop 3</div><h3 style="margin:6px 0">AI</h3><ul class="clean small"><li>AI Analysis dashboards</li><li>AI voice agent</li><li>Website chatbot</li><li>Orders posting into Tally</li><li>Historical data import + go-live</li></ul></div>
  </div></section>
  <section class="card stack-s"><h3>Open items before we build</h3>${table(['Item', 'From', 'Why it matters'], [['Tally edition, version, where it runs, who looks after it', 'EGO', 'Decides how the bridge connects — longest lead time'], ['Sales Diary: exact app + API docs', 'EGO + vendor', 'Or decide to move reps to the EGO Master app'],
    ['Runo API key + user list', 'EGO', 'Two-way call sync'], ['Meta Business Verification, App Review; Google brand verification', 'Implementation team + EGO', 'Lead ads, WhatsApp limits, ad spend'], ['Which company is which (EGO vs Big E, B2B vs B2C)', 'EGO', 'Data separation + roles'],
    ['Number of Android vs iPhone users', 'EGO', 'iPhones need device IDs registered'], ['Product & price master, dealer list, historical sales', 'EGO', 'Day-one data for orders and AI']])}</section>
</div>`;
