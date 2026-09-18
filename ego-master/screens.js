'use strict';
/* Integrations admin — mock product screens on sample data. Every action is simulated in memory. */

const HOOK = 'https://master.egopremium.com/hooks';   // example domain, to be confirmed (P1-34)
const frame = (path, body) => `<div class="screen"><div class="screen-bar"><i></i><i></i><i></i><span>EGO Master › ${path}</span></div><div class="screen-body">${body}</div></div>`;
const secretInput = (id, label, saved, hint = '') => `<div class="field"><label for="${id}">${label}</label>
  <div class="copyrow"><input class="input mono" id="${id}" type="password" autocomplete="off" placeholder="${saved ? '•••••••••••••••• (saved, encrypted)' : 'Paste key'}">
  <button class="btn" data-act="test-conn" data-for="${id}">Save &amp; test</button></div>${hint ? `<span class="small muted">${hint}</span>` : ''}</div>`;
const copyField = (label, value) => `<div class="field"><label>${label}</label><div class="copyrow"><input class="input mono" readonly value="${esc(value)}"><button class="btn" data-act="copy" data-v="${esc(value)}">Copy</button></div></div>`;
const LOG = {};   // connector id → log lines (newest first)
const log = (id, cls, text, at = stamp()) => { (LOG[id] ||= []).push([cls, `${tFmt(at)}  ${text}`, at]); };
const logBox = id => `<div class="log" id="log-${id}">${(LOG[id] || []).slice().sort((a, b) => b[2].localeCompare(a[2])).map(([c, t]) => `<div class="${c}">${esc(t)}</div>`).join('') || '<div class="muted">No events yet</div>'}</div>`;
const emp = id => EMP[id] ? EMP[id].name : '—';
const leadName = id => LEAD[id] ? LEAD[id].name : '—';

// seed logs so each screen looks alive
(() => {
  const t = m => new Date(NOW.getTime() - m * 60e3).toISOString();
  D.call.slice(0, 5).forEach((c, i) => log('runo', 'ok', `webhook post-call ${c.runo_call_id} · ${c.disposition} · ${c.duration_s}s → lead ${c.lead}`, t(2 + i * 7)));
  log('runo', '', 'nightly backfill GET /call/logs (yesterday) · 214 calls · 0 new', t(560));
  log('tally', 'ok', 'heartbeat · TallyPrime running · companies: EGO Premium Products Pvt. Ltd., The Big E Retail', t(1));
  log('tally', 'ok', 'read outstanding · 150 ledgers · 3 changed', t(3));
  log('tally', 'bad', `post Sales Order ${D.order.find(o => o.id === D.story.failed_order).no} → rejected: ledger not found`, t(26));
  log('tally', 'ok', 'read stock items · 106 · 6 at zero', t(5));
  log('whatsapp', 'ok', 'template dealer_lead_offer delivered · read', t(1));
  log('whatsapp', 'warn', 'message to +91 90000 4xxxx failed · 131026 receiver not on WhatsApp', t(44));
  log('meta', 'ok', 'leadgen webhook · form "Floor quote — Mumbai" · dedupe ✓ · AI call queued', t(14));
  log('indiamart', 'ok', 'push lead UNIQUE_QUERY_ID 2984… · SPC flooring · Thane', t(38));
  log('voice', 'ok', 'call completed · Hindi · 2m 41s · outcome Qualified', t(55));
  log('llm', 'ok', 'nightly analysis run · 11 jobs · 1.9M tokens (batch) · $0.61', t(330));
  log('website', 'ok', 'chatbot lead · Andheri · Engineered · hand-off to human (price question)', t(22));
})();

const CONNS = [
  ['runo', 'Runo', 'Telecalling · two-way'], ['salesdiary', 'Sales Diary', 'Field visits & orders'], ['tally', 'Tally bridge', 'Accounts & stock'],
  ['whatsapp', 'WhatsApp Cloud API', 'Messages · dealer Accept'], ['meta', 'Meta lead ads', 'Lead source'], ['google', 'Google Ads lead forms', 'Lead source'],
  ['indiamart', 'IndiaMART', 'Lead source'], ['justdial', 'JustDial', 'Lead source'], ['website', 'Website + chatbot', 'Lead source · AI'],
  ['voice', 'AI voice agent', 'Qualification calls'], ['llm', 'AI model (LLM)', 'Analysis engine'],
];

EM.VIEWS.integrations = arg => arg ? connPage(arg) : `<div class="stack">
  ${crumbs(['System map', '#/map'], ['Integrations'])}
  <div class="stack-s"><h1>Integrations</h1><p class="muted" style="max-width:780px">This is the real admin screen EGO’s CRM administrator will use. Keys are stored encrypted and never shown again after saving. Every connector shows its health, last event and errors — nothing fails silently.</p>
  <div class="callout">Shown as it will look after go-live. Anything still waiting on EGO, a vendor or a platform approval is marked amber.</div></div>
  ${frame('Settings › Integrations', `<div class="grid g3">${CONNS.map(([id, name, sub]) => {
    const c = CONN[id];
    return `<a class="card conn" href="#/integrations/${id}"><div class="row between"><h3>${name}</h3>${connBadge(c.status)}</div><span class="muted small">${sub}</span>
      <div class="meta"><span>Last event: ${agoMin(c.last)}</span><span>24 h: ${c.events24} events</span><span>${c.errors24 ? `<b style="color:var(--bad)">${c.errors24} error${c.errors24 > 1 ? 's' : ''}</b>` : '0 errors'}</span></div></a>`;
  }).join('')}</div>`)}
</div>`;
EM.VIEWS.integrations.tab = 'integrations';
EM.VIEWS.integrations.title = a => a ? (CONNS.find(c => c[0] === a) || [0, 'Integration'])[1] : 'Integrations';

function connPage(id) {
  const meta = CONNS.find(c => c[0] === id);
  if (!meta) return `<p>Unknown connector. <a href="#/integrations">Back</a></p>`;
  const c = CONN[id], compId = id === 'llm' ? 'ai' : id;
  const body = (PANELS[id] || PANELS.source)(id);
  return `<div class="stack">
    ${crumbs(['System map', '#/map'], ['Integrations', '#/integrations'], [meta[1]])}
    <div class="row between"><div class="stack-s"><h1>${meta[1]}</h1><div class="row">${connBadge(c.status)}<span class="small muted">Last event ${agoMin(c.last)} · ${c.events24} events in 24 h · ${c.errors24} error${c.errors24 === 1 ? '' : 's'}</span></div></div>
      ${COMP[compId] ? `<a class="btn" href="#/c/${compId}">How this works →</a>` : ''}</div>
    ${body}
    <section class="stack-s"><h3>Event log</h3>${logBox(id)}</section>
  </div>`;
}

const PANELS = {
  runo: () => {
    const calls = D.call.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
    return `<div class="grid g2">
      <section class="card stack">${frame('Settings › Runo › Connection', `<div class="stack">
        ${secretInput('k-runo', 'Runo API key', true, 'From Runo admin → API config. Sent as the <code>Auth-Key</code> header.')}
        ${copyField('Webhook URL — paste in Runo → Integrations → Webhooks', `${HOOK}/runo/ego-7f3a`)}
        <div class="field"><label>Events we listen to</label><div>${['Post-call', 'Pre-call', 'AI call summary', 'Interaction'].map((e, i) => `<label class="chip"><input type="checkbox" ${i !== 1 ? 'checked' : ''}> ${e}</label>`).join('')}</div></div>
        <div class="field"><label>Send new leads to Runo</label><select class="input"><option>Qualified leads → telecaller by product specialty</option><option>All auto-source leads → common pool</option><option>Off</option></select></div>
      </div>`)}</section>
      <section class="card stack-s"><h3>Telecallers: Runo user ↔ EGO Master user</h3>
        ${table(['Runo user', 'EGO Master user', 'Specialty'], D.employee.filter(e => e.runo_user).map(e => [`<code>${e.runo_user}</code>`, `${esc(e.name)} <span class="badge plain">DEMO</span>`, e.specialty]))}
        <h3 style="margin-top:16px">Call outcome → lead stage</h3>
        ${table(['Runo disposition', 'Moves lead to'], [['Connected – interested', 'Contacted → Qualified (if questions answered)'], ['Connected – call back', 'Contacted + follow-up task'], ['Not picked / Busy', 'Stays · retry in 2 h (max 5)'], ['Connected – not interested', 'Lost (reason required)'], ['Wrong number', 'Lost · reason “Invalid contact”'], ['Converted', 'Dealer Allocated']].map(r => r.map(esc)))}
      </section></div>
      <section class="stack-s"><div class="row between"><h3>Calls synced from Runo</h3><button class="btn primary" data-act="sim-runo">Simulate: telecaller finishes a call</button></div>
        <div id="runo-calls">${table(['Time', 'Telecaller', 'Lead', 'Duration', 'Disposition', 'Recording'], calls.map(k => ({ href: `#/lead/${k.lead}`, cells: [`${dFmt(k.at)} ${tFmt(k.at)}`, esc(emp(k.user)), esc(leadName(k.lead)), k.duration_s ? `${Math.floor(k.duration_s / 60)}m ${k.duration_s % 60}s` : '—', esc(k.disposition), k.recording ? '✓' : '—'] })))}</div></section>`;
  },

  salesdiary: () => {
    const visits = D.visit.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
    return `<div class="callout warn"><b>Status: waiting for vendor API documentation.</b> Sales Diary (most likely Appobile Labs) advertises REST APIs + OAuth2 but publishes no docs. Until we have them, visits and orders come in through a scheduled Excel export. The feed below shows how they will look once connected.</div>
    <div class="grid g2">
      <section class="card">${frame('Settings › Sales Diary › Connection', `<div class="stack">
        <div class="field"><label>OAuth client ID</label><input class="input mono" placeholder="from Appobile Labs"></div>
        ${secretInput('k-sd', 'OAuth client secret / API key', false, 'Test will confirm which endpoints the key can use.')}
        ${copyField('Webhook URL (if Sales Diary supports push)', `${HOOK}/salesdiary/ego-51c2`)}
        <div class="field"><label>Fallback</label><div class="row"><button class="btn" data-act="sd-import">Import visits &amp; orders from Excel</button><span class="small muted">Scheduled daily until the API is live</span></div></div>
      </div>`)}</section>
      <section class="card stack-s"><h3>Decision for EGO</h3>
        <p>EGO Master’s own phone app already covers check-in, visits and orders. Two ways forward:</p>
        <div class="grid g2" style="margin-top:8px"><div class="card flat"><h4>Keep Sales Diary</h4><p class="small muted">Reps change nothing. Needs the vendor API; data arrives via sync.</p></div>
        <div class="card flat"><h4>Move reps to EGO Master app</h4><p class="small muted">One app, no sync to break, saves the Sales Diary licence. Needs a short training.</p></div></div>
        <h3 style="margin-top:12px">Rep mapping</h3>${table(['Sales Diary user', 'EGO Master user', 'Region'], D.employee.filter(e => e.salesdiary_user).map(e => [`<code>${e.salesdiary_user}</code>`, esc(e.name), e.region]))}
      </section></div>
    <section class="stack-s"><h3>Visits (sample of how they sync)</h3>${table(['Time', 'Rep', 'Dealer', 'Check-in (GPS)', 'Purpose', 'Outcome', 'Note'], visits.map(v => ({ href: `#/dealer/${v.dealer}`, cells: [`${dFmt(v.at)} ${tFmt(v.at)}`, esc(emp(v.user)), esc(DL[v.dealer].name), `<code>${v.checkin.lat}, ${v.checkin.lng}</code> <span class="muted small">±${v.checkin.accuracy_m} m</span>`, esc(v.purpose), esc(v.outcome), esc(v.notes)] })))}</section>`;
  },

  tally: () => {
    const q = D.order.slice(-9).reverse();
    const out = D.dealer.reduce((s, d) => s + d.outstanding, 0), over = D.dealer.reduce((s, d) => s + d.overdue, 0);
    const zero = D.stock.filter(s => s.on_hand === 0).length;
    const tclosed = EM.tallyClosed;
    const st = o => o.tally.state === 'posted' ? '<span class="badge ok">Posted</span>' : o.tally.state === 'queued' ? '<span class="badge info">Queued</span>' : '<span class="badge bad">Rejected</span>';
    return `<div class="grid g2">
      <section class="card stack">${frame('Settings › Tally › Bridge', `<div class="stack">
        <div class="row between"><div><h3>Bridge agent</h3><span class="small muted">Runs on EGO’s Tally computer · outbound HTTPS only</span></div>${tclosed ? '<span class="badge warn">Tally closed — orders queue</span>' : '<span class="badge ok">Online · heartbeat 1 min ago</span>'}</div>
        ${kv([['Computer', '<code>ACCOUNTS-PC-01</code> (sample)'], ['Tally', 'TallyPrime — edition &amp; version to confirm (P1-24)'], ['Talks to Tally via', 'XML over <code>localhost:9000</code> (JSON if TallyPrime 7.0+)'], ['Sync', 'Every 2 minutes while Tally is open'], ['Bridge version', '1.0.3 · auto-updates']])}
        <div class="row"><button class="btn" data-act="tally-install">Download bridge installer</button><button class="btn" data-act="tally-toggle">${tclosed ? 'Simulate: Tally reopened' : 'Simulate: Tally closed'}</button></div>
        <h4>Company mapping</h4>${table(['Tally company', 'EGO Master company'], [['EGO Premium Products Pvt. Ltd.', 'EGO Premium'], ['The Big E Retail', 'Big E']])}
      </div>`)}</section>
      <section class="stack">
        <div class="grid g2">
          <div class="card stat"><div class="kicker">Outstanding (read)</div><div class="num">${inr(out)}</div><span class="small muted">${inr(over)} overdue · 150 dealer ledgers</span></div>
          <div class="card stat"><div class="kicker">Receipts, last 20 days</div><div class="num">${inr(D.receipt.reduce((s, r) => s + r.amount, 0))}</div><span class="small muted">${D.receipt.length} vouchers</span></div>
          <div class="card stat"><div class="kicker">Stock items (read)</div><div class="num">${D.stock.length}</div><span class="small muted">${zero} at zero stock</span></div>
          <div class="card stat"><div class="kicker">Reconciliation this month</div><div class="num">0.3%</div><span class="small muted">EGO Master vs Tally sales · target ±1% <span class="badge ok">OK</span></span></div>
        </div>
        <div class="card stack-s"><h3>Who owns which field</h3>${table(['Data', 'Owner', 'Direction'], [['Invoices, receipts, credit notes', 'Tally', 'Tally → EGO Master'], ['Outstanding, credit limit', 'Tally', 'Tally → EGO Master'], ['Stock on hand', 'Tally', 'Tally → EGO Master'], ['Sales orders (won)', 'EGO Master', 'EGO Master → Tally'], ['Dealer contacts, grade, owners', 'EGO Master', 'stays in EGO Master']])}</div>
      </section></div>
    <section class="stack-s"><div class="row between"><h3>Orders posting to Tally</h3><button class="btn primary" data-act="tally-new">Simulate: order won in EGO Master</button></div>
      ${table(['Order', 'Dealer', 'Lines', 'Value (incl. GST)', 'Tally', 'Voucher / reason', ''], q.map(o => [esc(o.no), esc(DL[o.dealer].name), o.lines.length, inrFull(o.total + o.gst), st(o),
        o.tally.state === 'failed' ? `<span class="small" style="color:var(--bad)">${esc(o.tally.error)}</span>` : `<code>${o.tally.voucher || '—'}</code>`,
        o.tally.state === 'failed' ? `<button class="btn sm" data-act="tally-fix" data-o="${o.id}">Create ledger &amp; retry</button>` : '']))}
    </section>
    <details class="card"><summary><b>What the bridge sends to Tally</b> (sample Sales Order request)</summary><pre class="log" style="margin-top:10px">${esc(`<ENVELOPE>
 <HEADER><VERSION>1</VERSION><TALLYREQUEST>Import</TALLYREQUEST><TYPE>Data</TYPE><ID>Vouchers</ID></HEADER>
 <BODY><DESC><STATICVARIABLES><SVCURRENTCOMPANY>EGO Premium Products Pvt. Ltd.</SVCURRENTCOMPANY></STATICVARIABLES></DESC>
  <DATA><TALLYMESSAGE>
   <VOUCHER VCHTYPE="Sales Order" ACTION="Create">
    <DATE>20260917</DATE><VOUCHERNUMBER>SO/2609/0755</VOUCHERNUMBER>
    <PARTYLEDGERNAME>Shree Floors, Andheri</PARTYLEDGERNAME>
    <ALLINVENTORYENTRIES.LIST><STOCKITEMNAME>EGO-SPC-4821</STOCKITEMNAME><ACTUALQTY>640 sq ft</ACTUALQTY><RATE>86/sq ft</RATE></ALLINVENTORYENTRIES.LIST>
   </VOUCHER>
  </TALLYMESSAGE></DATA></BODY>
</ENVELOPE>`)}</pre></details>`;
  },

  whatsapp: () => {
    const lead = D.lead.find(l => l.stage === 'Dealer Allocated' && l.dealer);
    EM.waLead = lead.id;
    const d = DL[lead.dealer], accepted = lead.stage === 'Dealer Accepted';
    return `<div class="grid g2">
      <section class="card">${frame('Settings › WhatsApp', `<div class="stack">
        ${kv([['Business number', '+91 90000 00000 <span class="badge plain">sample</span>'], ['Provider', 'Meta WhatsApp Cloud API (direct, no reseller)'], ['Business verification', '<span class="badge ok">Verified</span> — before verification the limit is 250 messages/day'], ['Billing', 'INR · marketing ≈ ₹0.86, utility ≈ ₹0.115 per message + GST']])}
        ${secretInput('k-wa', 'System user access token', true)}
        ${copyField('Webhook URL (Meta app → WhatsApp → Configuration)', `${HOOK}/whatsapp`)}
        <h4>Templates</h4>${table(['Template', 'Category', 'Status'], [['dealer_lead_offer · buttons Accept / Decline', 'Utility', '<span class="badge ok">Approved</span>'], ['order_status_update', 'Utility', '<span class="badge ok">Approved</span>'], ['consumer_stage_update', 'Utility', '<span class="badge ok">Approved</span>'], ['installation_progress', 'Utility', '<span class="badge ok">Approved</span>'], ['festive_scheme_launch', 'Marketing', '<span class="badge warn">In review</span>']])}
      </div>`)}</section>
      <section class="card stack-s"><h3>Dealer “Accept lead” — try it</h3>
        <p class="muted small">A qualified consumer lead is allocated to the nearest Platinum/A dealer. The dealer gets this message; one tap updates EGO Master.</p>
        <div class="phones" style="margin-top:8px"><div class="phone" style="height:520px"><div class="ph-head"><span>${esc(d.name)}</span><span>WhatsApp</span></div>
          <div class="ph-body" style="background:color-mix(in srgb,var(--ge-success) 6%,var(--ge-bg))">
            <div class="card" style="padding:12px"><b>New customer enquiry — EGO</b><p class="small" style="margin-top:6px">Customer in ${esc(MK[lead.market].name)} wants <b>${esc(lead.category)}</b> for ${esc(lead.application.toLowerCase())}, about <b>${lead.area_sqft} sq ft</b>, budget ${esc(lead.budget)}. Can you take it within 2 hours?</p>
              <div class="grid" style="grid-template-columns:1fr 1fr;gap:6px;margin-top:10px"><button class="btn ${accepted ? '' : 'primary'}" data-act="wa-accept" ${accepted ? 'disabled' : ''}>✓ Accept</button><button class="btn" data-act="wa-decline" ${accepted ? 'disabled' : ''}>Decline</button></div></div>
            ${accepted ? `<div class="card" style="padding:12px;margin-left:30px"><p class="small">Thank you. Customer details: ${esc(lead.name)} · ${esc(lead.phone)} (DEMO). EGO will check in tomorrow.</p></div>` : ''}
          </div></div></div>
        <p class="small muted">If nobody taps within the SLA, the lead is offered to the next dealer and the RM is alerted.</p>
        <a class="btn sm" href="#/lead/${lead.id}">Open this lead →</a>
      </section></div>`;
  },

  source: id => {
    const name = { meta: 'Meta Ads', google: 'Google Ads', indiamart: 'IndiaMART', justdial: 'JustDial', website: 'Website' }[id];
    const leads = D.lead.filter(l => l.source === name).slice(0, 10);
    const setup = {
      meta: [['Business Manager admin access', 'ok'], ['Meta App Review (leads_retrieval, pages_manage_metadata …)', 'ok'], ['Page subscribed to leadgen webhook', 'ok'], ['Form fields mapped', 'ok'], ['Nightly ad-spend pull (Marketing API)', 'ok']],
      google: [['Google Ads customer ID + access', 'ok'], ['Webhook URL + key added to the lead form', 'ok'], ['Brand verification for Google Ads API (spend)', 'warn']],
      indiamart: [['Paid seller account', 'ok'], ['CRM key from Lead Manager', 'ok'], ['Push API URL registered', 'ok'], ['Pull API safety net every 15 min', 'ok']],
      justdial: [['Account manager contacted', 'ok'], ['Webhook URL registered by JustDial', 'warn'], ['First lead logged → fields mapped', 'warn']],
      website: [['Website admin / DNS access', 'warn'], ['Form + chatbot script added', 'ok'], ['Knowledge base loaded (catalogue, specs, FAQ, warranty)', 'warn'], ['Hand-off rules: price, complaint, high value → human', 'ok']],
    }[id];
    const key = { meta: ['Page access token', true], google: ['Webhook key (google_key)', true], indiamart: ['IndiaMART CRM key', true], justdial: ['Shared secret in URL', true], website: ['Site key', true] }[id];
    return `<div class="grid g2">
      <section class="card">${frame(`Settings › Lead sources › ${name}`, `<div class="stack">
        <div class="field"><label>Setup checklist</label>${setup.map(([t, s]) => `<div class="row" style="gap:8px"><span class="badge ${s}">${s === 'ok' ? 'Done' : 'Waiting'}</span><span>${t}</span></div>`).join('')}</div>
        ${secretInput('k-' + id, key[0], key[1])}
        ${copyField('Webhook URL', `${HOOK}/leads/${id}`)}
        <div class="field"><label>When a lead arrives</label><select class="input"><option>AI voice agent calls within 5 min (auto source)</option><option>Straight to telecaller queue</option></select></div>
      </div>`)}</section>
      <section class="card stack-s"><div class="row between"><h3>Try it</h3><button class="btn primary" data-act="test-lead" data-src="${id}">Send a test lead</button></div>
        <p class="small muted">Sends a sample ${name} lead through intake: duplicate check, source tag, routing.</p>
        <div id="lead-result"></div>
        <h3 style="margin-top:12px">Latest ${name} leads</h3>
        ${table(['Received', 'Name', 'Area', 'Category', 'Stage'], leads.map(l => ({ href: `#/lead/${l.id}`, cells: [`${dFmt(l.created)} ${tFmt(l.created)}`, `${esc(l.name)} <span class="badge plain">DEMO</span>`, esc(MK[l.market].name), esc(l.category), esc(l.stage)] })))}
      </section></div>`;
  },

  voice: () => `<div class="grid g2">
    <section class="card">${frame('Settings › AI voice agent', `<div class="stack">
      <div class="field"><label>Provider</label><select class="input"><option>Bolna (Indian languages) — shortlisted</option><option>Sarvam speech + Plivo numbers — shortlisted</option></select><span class="small muted">Final choice after a Marathi call-quality test with EGO’s team.</span></div>
      ${secretInput('k-voice', 'Provider API key', false)}
      <div class="field"><label>Languages</label><div>${['English', 'Hindi', 'Marathi', 'Telugu (optional)'].map((l, i) => `<label class="chip"><input type="checkbox" ${i < 3 ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>
      ${kv([['Calls', 'Inbound + call-back to auto-source leads only (never walk-in / field)'], ['Calling hours', '9 am – 9 pm IST'], ['Attempts', 'Up to 3, then a WhatsApp message'], ['Numbers', 'Indian numbers, company KYC (incorporation certificate + GST)'], ['Rules', 'Consent recorded; no cold promotional AI calls (would need 140-series + DLT)']])}
    </div>`)}</section>
    <section class="card stack-s"><h3>Recent AI calls</h3>
      ${table(['Lead', 'Language', 'Length', 'Outcome', ''], D.lead.filter(l => l.ai_score && ['Qualified', 'Contacted', 'Lost'].includes(l.stage)).slice(0, 8).map((l, i) => [esc(l.name), ['Hindi', 'English', 'Marathi'][i % 3], `${1 + i % 3}m ${10 + (i * 13) % 50}s`, l.stage === 'Lost' ? 'Lost' : l.stage === 'Qualified' ? 'Qualified' : 'Nurture', `<button class="btn sm" data-act="transcript" data-l="${l.id}">Transcript</button>`]))}
    </section></div>`,

  llm: () => `<div class="grid g2">
    <section class="card">${frame('Settings › AI model', `<div class="stack">
      <div class="field"><label>Model provider</label><select class="input"><option>Google Gemini (EGO’s own account)</option><option>Anthropic Claude (EGO’s own account)</option></select></div>
      ${secretInput('k-llm', 'API key', true, 'Billed to EGO’s account. Usage shown below.')}
      ${kv([['Nightly run', '2:00 am IST, batch pricing (about half price)'], ['On demand', 'Management can re-run any insight'], ['Knowledge base', 'Postgres + pgvector (same database)'], ['Guardrails', 'Numbers are computed in the database; the model explains them and cites records. Role permissions apply to the AI too.']])}
    </div>`)}</section>
    <section class="card stack-s"><h3>Usage this month</h3>
      <div class="grid g2"><div class="card stat"><div class="kicker">Tokens</div><div class="num">31.4M</div></div><div class="card stat"><div class="kicker">Cost so far</div><div class="num">$9.80</div><span class="small muted">sample figure</span></div></div>
      <h3 style="margin-top:12px">Last night’s jobs</h3>${table(['Job', 'Result'], [['Dealer LTV + dormancy', '11 dealers flagged'], ['Product performance', '2 slow collections'], ['Source ROI', 'Google cost per won lead ↑ 18%'], ['Hot leads for telesales', '23 leads queued'], ['Cross-sell', '17 dealers missing SPC'], ['Tasks pushed to people', '46 tasks · 9 WhatsApp alerts']])}
      <a class="btn sm" href="#/ai">Open AI Analysis →</a>
    </section></div>`,
};

// ---------------------------------------------------------------- actions
EM.ACTIONS.copy = el => { navigator.clipboard && navigator.clipboard.writeText(el.dataset.v).catch(() => {}); EM.toast('Copied'); };
EM.ACTIONS['test-conn'] = el => {
  const input = qs('#' + el.dataset.for), id = el.dataset.for.slice(2);
  const v = input.value.trim();
  if (id === 'sd') { EM.toast('<b>Can’t verify yet.</b> The key was saved, but Sales Diary’s endpoint list is still pending from the vendor — test runs again once docs arrive.'); return; }
  if (v && v.length < 12) { EM.toast('<b>✗ Rejected.</b> That key looks too short — check you copied the whole key.'); log(id, 'bad', 'test connection failed · 401 unauthorised'); return; }
  const what = { runo: 'GET /user → 5 users found · GET /process → 2 processes', tally: 'bridge reachable', wa: 'phone number + templates readable', voice: 'account reachable · 0 numbers yet', llm: 'model list readable' }[id] || 'endpoint reachable';
  log({ wa: 'whatsapp' }[id] || id, 'ok', `test connection ✓ · ${what}`);
  input.value = '';
  EM.toast(`<b>✓ Connected.</b> ${what}. Key stored encrypted.`);
  EM.rerender();
};
EM.ACTIONS['sim-runo'] = () => {
  const lead = D.lead.find(l => l.stage === 'Contacted' && !l._sim) || D.lead.find(l => l.stage === 'Contacted');
  lead._sim = true;
  const tc = D.employee.find(e => e.id === lead.owner), at = stamp();
  const call = { id: 'cal_sim' + EM.tick, runo_call_id: `RC${8000000 + EM.tick}`, lead: lead.id, user: tc.id, at, duration_s: 184, disposition: 'Connected – interested', type: 'outgoing', recording: true };
  D.call.unshift(call);
  lead.stage = 'Qualified'; lead.history.push(['Qualified', at]);
  log('runo', 'ok', `webhook post-call ${call.runo_call_id} · Connected – interested · 184s → ${lead.id} moved to Qualified`, at);
  EM.toast(`<b>Call synced from Runo in real time</b><ul><li>${esc(tc.name)} → ${esc(lead.name)}, 3m 4s, recording saved</li><li>Disposition “Connected – interested” → stage Qualified</li><li>Next: nearest Platinum/A dealer gets the WhatsApp offer</li></ul>`, 6000);
  EM.rerender();
};
EM.ACTIONS['sd-import'] = () => { log('salesdiary', 'ok', 'Excel import · 38 visits · 6 orders · 0 duplicates'); EM.toast('<b>Imported from Excel</b><ul><li>38 visits matched to dealers by phone / GST</li><li>6 orders created and queued for Tally</li><li>0 duplicates</li></ul>'); EM.rerender(); };
EM.ACTIONS['tally-install'] = () => EM.modal(`<h2>Install the Tally bridge</h2><ol class="steps" style="margin:16px 0">
  <li><span>On the computer where Tally runs, open the installer link we send (Windows).</span></li><li><span>Enter this pairing code: <code>EGO-4F7K-92QD</code></span></li>
  <li><span>In TallyPrime: F1 Help → Settings → Connectivity → enable “TallyPrime acts as Server”, port 9000.</span></li><li><span>The bridge finds the companies and shows them here for mapping. Done — nothing to open on EGO’s firewall.</span></li></ol>
  <button class="btn primary" data-act="close-modal">Got it</button>`);
EM.ACTIONS['tally-toggle'] = () => {
  EM.tallyClosed = !EM.tallyClosed;
  log('tally', EM.tallyClosed ? 'warn' : 'ok', EM.tallyClosed ? 'heartbeat missed · Tally closed on ACCOUNTS-PC-01 · new orders will queue' : 'Tally reopened · posting 1 queued order');
  if (!EM.tallyClosed) D.order.filter(o => o.tally.state === 'queued').forEach(o => { o.tally = { state: 'posted', voucher: `EGO/SO/${70000 + EM.tick++}` }; });
  EM.toast(EM.tallyClosed ? 'Tally is closed. Orders keep saving in EGO Master and wait in the queue — nothing is lost.' : '<b>Tally is back.</b> Every queued order was posted.');
  EM.rerender();
};
EM.ACTIONS['tally-new'] = () => {
  const dealer = DL[D.story.hero_dealer], s = D.sku.filter(x => dealer.categories.includes(x.category)).slice(0, 3);
  const lines = s.map((x, i) => ({ sku: x.id, qty: [600, 320, 180][i], rate: x.dealer_price, amount: [600, 320, 180][i] * x.dealer_price }));
  const total = lines.reduce((a, l) => a + l.amount, 0), at = stamp();
  const o = { id: 'ord_sim' + EM.tick, no: `SO/2609/${String(900 + EM.tick).padStart(4, '0')}`, dealer: dealer.id, at, lines, total, gst: Math.round(total * 0.18), status: 'confirmed',
    tally: EM.tallyClosed ? { state: 'queued', voucher: null } : { state: 'posted', voucher: `EGO/SO/${80000 + EM.tick}` } };
  D.order.push(o);
  log('tally', EM.tallyClosed ? 'warn' : 'ok', EM.tallyClosed ? `queued Sales Order ${o.no} (Tally closed)` : `posted Sales Order ${o.no} → voucher ${o.tally.voucher}`, at);
  EM.toast(`<b>Order ${o.no} · ${inrFull(o.total + o.gst)}</b><ul><li>${lines.length} SKU lines priced and totalled</li><li>${EM.tallyClosed ? 'Tally closed → queued, posts automatically when it opens' : `Posted to Tally as voucher ${o.tally.voucher}`}</li><li>Stock committed · dealer gets WhatsApp order confirmation</li></ul>`, 6000);
  EM.rerender();
};
EM.ACTIONS['tally-fix'] = el => {
  const o = D.order.find(x => x.id === el.dataset.o);
  o.tally = { state: 'posted', voucher: `EGO/SO/${90000 + EM.tick}` };
  log('tally', 'ok', `ledger created for ${DL[o.dealer].name} · retried ${o.no} → voucher ${o.tally.voucher}`);
  EM.toast('<b>Fixed.</b> Ledger created in Tally (EGO books) and the order posted. The admin alert is closed.');
  EM.rerender();
};
EM.ACTIONS['wa-accept'] = () => {
  const l = LEAD[EM.waLead], at = stamp();
  l.stage = 'Dealer Accepted'; l.history.push(['Dealer Accepted', at]);
  log('whatsapp', 'ok', `button reply “Accept” from ${DL[l.dealer].name} → ${l.id} Dealer Accepted`, at);
  EM.toast(`<b>Dealer accepted in one tap</b><ul><li>Webhook received the button payload for ${l.id}</li><li>Lead → Dealer Accepted, SLA timer stopped</li><li>Customer gets “${esc(DL[l.dealer].name)} will call you” on WhatsApp</li></ul>`, 6000);
  EM.rerender();
};
EM.ACTIONS['wa-decline'] = () => EM.toast('Declined → offered to the next nearest Platinum/A dealer; RM notified.');
EM.ACTIONS['test-lead'] = el => {
  const id = el.dataset.src, name = { meta: 'Meta Ads', google: 'Google Ads', indiamart: 'IndiaMART', justdial: 'JustDial', website: 'Website' }[id];
  const at = stamp(), m = D.market[0];
  const l = { id: 'lea_sim' + EM.tick, name: 'Test Lead ' + EM.tick, phone: '+91 90000 00' + String(100 + EM.tick).slice(-3), source: name, market: m.id, created: at, stage: 'New', history: [['New', at]],
    category: 'SPC', application: 'Living room', area_sqft: 900, budget: '₹2–5L', with_architect: false, company: 'co_bige', dealer: null, owner: D.employee.find(e => e.role === 'rt_tele').id, ai_score: null, value: 126000, lost_reason: null, demo: true };
  D.lead.unshift(l); LEAD[l.id] = l;
  log(id, 'ok', `test lead ${l.id} · dedupe ✓ new contact · AI call queued`, at);
  qs('#lead-result').innerHTML = `<div class="callout ok"><b>In the CRM in 1.2 s</b><ul class="clean" style="margin-top:6px"><li>Duplicate check on phone + email: new contact</li><li>Tagged source “${name}”${id === 'meta' || id === 'google' ? ' + campaign' : ''}</li><li>Auto source → AI voice agent call queued (within 5 min)</li><li><a href="#/lead/${l.id}">Open the lead →</a></li></ul></div>`;
};
EM.ACTIONS.transcript = el => {
  const l = LEAD[el.dataset.l];
  EM.modal(`<h2>AI call · ${esc(l.name)}</h2><p class="muted small">Sample transcript · recording kept on the lead</p><div class="log" style="margin:14px 0;max-height:none">
  <div><b>AI:</b> Namaste, main EGO Flooring se bol rahi hoon. Aapne ${esc(l.category)} flooring ke baare mein enquiry ki thi — kya abhi 2 minute baat kar sakte hain?</div>
  <div><b>Customer:</b> Haan, boliye.</div><div><b>AI:</b> Kis room ke liye chahiye, aur area lagbhag kitna hai?</div>
  <div><b>Customer:</b> ${esc(l.application)}, around ${l.area_sqft} square feet.</div><div><b>AI:</b> Budget roughly ${esc(l.budget)} theek rahega? Aur kya aap kisi architect ke saath kaam kar rahe hain?</div>
  <div><b>Customer:</b> ${l.with_architect ? 'Haan, architect hai.' : 'Nahi, khud hi kar rahe hain.'} Next month tak chahiye.</div>
  <div><b>AI:</b> Dhanyavaad. Aapke area ke EGO dealer aapko aaj call karenge, aur samples WhatsApp pe bhej rahe hain.</div></div>
  ${kv([['Captured', `Room: ${esc(l.application)} · ${l.area_sqft} sq ft · ${esc(l.budget)} · architect: ${l.with_architect ? 'yes' : 'no'} · timeline: next month`], ['Outcome', 'Qualified → dealer allocation']])}
  <div style="margin-top:14px"><button class="btn primary" data-act="close-modal">Close</button></div>`);
};
