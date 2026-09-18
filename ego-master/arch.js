'use strict';
/* System map + one page per component. Facts here come from the 17 Sep 2026 research
   (Runo OpenAPI v1.9.0 checked directly; others from vendor docs) — keep them honest when editing. */

const COMP = {
  production: {
    title: 'Production & allocation (Wholesale)', group: 'EGO modules', status: 'build',
    what: 'When a design is short or custom, EGO places a production order at the factory’s MOQ. The container is tracked to a warehouse, and the received quantity is allocated across the dealers who are waiting — oldest order and best grade first, editable, never more than received.',
    connects: [['Division', 'Wholesale · EGO Premium'], ['Flow', 'Design & MOQ agreed → production order placed → in production → quality check → shipped → in transit → received at warehouse → allocated & closed'],
      ['Warehouses', 'Bhiwandi (EGO) + regional hubs — the same godowns as in Tally'], ['Who', 'Wholesale Head (orders), Warehouse & Dispatch (receive, allocate, dispatch — no prices)']],
    fields: [['Production order', 'design · MOQ · qty · factory · container · ETA · warehouse', 'production_order', ''], ['Waiting', 'dealer order · line · qty requested', 'po_waiting', 'Allocation screen'], ['Stock', 'on hand · allocated · free per warehouse', 'warehouse_stock', 'From Tally godowns']],
    failure: ['Allocation can’t exceed what was received or what a dealer asked for', 'Partly filled dealers keep an open balance on their order'], need: ['Warehouse list + Tally godown names', 'Factories, MOQs and lead times per collection'],
    screens: [['Production & allocation', '#/production'], ['A received container', `#/po/${D.story.received_po}`], ['Stock by warehouse', '#/stock']],
  },
  clients: {
    title: 'Clients & architect firms (Retail)', group: 'EGO modules', status: 'build',
    what: 'Every Big E client in one place — homeowners, builders, hotels, corporates — each linked to the architect who brought them. Architects sit under their firm, so a firm with 18 architects shows all of their clients and projects together.',
    connects: [['Division', 'Retail · Big E'], ['Module', 'Firm → architects → clients → projects → sites'], ['Who', 'Retail Head (all), Architect Relations (their firms), Consumer Telecallers (their leads’ clients)']],
    fields: [['Client', 'type · city · source · architect · value · status', 'client', ''], ['Firm', 'name · city · focus · EGO owner', 'design_firm', ''], ['Architect', 'firm · position · Design 500 · owner', 'architect', 'Rolls up to firm']],
    failure: ['Duplicate clients blocked on mobile'], need: ['Existing architect/firm list', 'Client list export (if any)'],
    screens: [['All retail clients', '#/clients'], ['A firm with its architects', `#/firm/${D.story.hero_firm}`]],
  },
  orders_retail: {
    title: 'Consumer leads (Retail)', group: 'EGO modules', status: 'build',
    what: 'Big E’s consumer lead engine — every source, AI qualification call, dealer allocation with one-tap Accept, telecaller follow-up.',
    connects: [['Division', 'Retail · Big E (dealer name visible, never dealer pricing)'], ['Stages', 'New → Contacted → Qualified → Dealer Allocated → Dealer Accepted → Appointment → Site Visit → Sample → Quote → Won / Lost']],
    fields: [['Lead', 'source · campaign · stage timestamps · lost reason', 'lead', '']], failure: ['Lost needs a reason'], need: ['Lost reasons (P1-08)'],
    screens: [['Consumer leads', '#/leads']],
  },
  dealers: {
    title: 'Vendors & salespeople (Wholesale)', group: 'EGO modules', status: 'build',
    what: 'Everything EGO knows about each dealer in one place — sales vs target, Tally outstanding, what they buy and don’t, owners, visits, their salespeople (EGO Champions), displays, samples, training and projects — so the team manages the network, not a contact list.',
    connects: [['Spec', '§5 Dealer 360 · §7 dealer employees / Champions · §14 Project Partner · §19 samples · §20 displays · §21 training'], ['Data from', 'Tally (sales, outstanding, credit) · Sales Diary / phone app (visits, orders) · WhatsApp (Champion updates)'],
      ['Screens', 'Dealer list with area totals · Dealer 360 (8 tabs) · multi-SKU orders · Champions · Displays · Samples · Training · Project Partner finder'], ['Phase 2', 'Priority 200 development plans, schemes and targets build on these records']],
    fields: [['Dealer', 'grade · Priority 200 tier · owners (field, telesales, specialist, management)', 'dealer', 'Territories reassignable without losing history'], ['Dealer employee', 'role · Champion · points · trainings', 'dealer_employee', ''],
      ['Display', 'type · cost · condition · photos · replace-by', 'display', 'Reminder before due'], ['Sample', 'recipient · design · cost · follow-up · result', 'sample', 'Spend vs orders after'], ['Training', 'course · audience · score · certificate expiry', 'training', 'Retraining alerts']],
    failure: ['Tally-owned fields are read-only in EGO Master (no two versions of outstanding)', 'Duplicate dealers blocked on GST + phone'],
    need: ['Dealer list with grades (P1-04)', 'Priority 200 list and tiers', 'Dealer employee lists (can start empty — filled from the phone app)'],
    screens: [['Dealer network', '#/dealers'], ['Dealer 360', `#/dealer/${D.story.hero_dealer}`], ['EGO Champions', '#/champions'], ['Project Partner finder', '#/partner']],
  },
  projects: {
    title: 'Projects & installation (Retail)', group: 'EGO modules', status: 'build',
    what: 'Builder, hotel, corporate and retail projects from first identification to collection — with the architect, the partner dealer, the products specified, every quotation version and special-price approvals.',
    connects: [['Spec', '§12 Designer & Architect · §13 Project CRM · §14 Project Partner'], ['Stages', 'Identified → Qualified → Sample → Specification → Approval → Quotation → Negotiation → Won/Lost → Execution → Installation → Collection → Completed (configurable)'],
      ['Rules', 'Lost needs a reason · special price routes Sales Head (≤5%) → Founder · Won creates installation sites'], ['Data to', 'Tally (orders, invoices) · Installation module (one job per site)']],
    fields: [['Project', 'type · value · probability · close date · expected GP · payment terms', 'project', ''], ['Project', 'owner · purchase manager · PM · architect · contractor', 'project_contact', ''],
      ['Quotation', 'version · value · discount · file · status', 'quotation', 'History kept'], ['Special price', 'requested % · reason · route · approver', 'approval', 'Audit trail']],
    failure: ['Every stage change and approval is logged with who and when'], need: ['Project types and stage names (P1-09)', 'Approval limits for special prices (P2-02 — simple version now)'],
    screens: [['Project pipeline', '#/projects'], ['A project', `#/project/${D.story.hero_project}/quotes`], ['Architects', '#/architects']],
  },
  installation: {
    title: 'Installation & site execution', group: 'EGO modules', status: 'build',
    what: 'Installation as a full workflow, not a service note: survey → BOQ → crew → material → readiness → daily progress → snags → sign-off → billing → warranty, for one site or a rollout of hundreds.',
    connects: [['Spec', '§22.1–22.14 · §23 complaints'], ['Workflow', '18 steps; the system blocks skipping what matters (no crew → no schedule, not ready → no mobilisation, open snags → no sign-off)'],
      ['People', 'Project team on the web · crew leads on the site-team phone app (offline, photos, client signature)'], ['Data to', 'WhatsApp (client progress updates) · Tally (installation billing, installer payable) · AI Analysis (delays, rework)']],
    fields: [['Site job', 'survey · BOQ versions · crew · planned vs actual · manpower', 'site', 'One per site'], ['Material', 'planned → ordered → dispatched → received → consumed', 'site_material', 'Shortage flags'],
      ['Readiness', 'checklist item · ready / not ready · reason · photo', 'site_readiness', 'Reason + photo required'], ['Progress', 'date · sq ft · manpower · photos · blockers', 'site_progress', ''],
      ['Snag', 'category · severity · owner · due · rework cost · evidence', 'snag', 'Close needs after-photo'], ['Installer', 'coverage · skills · certificates · capacity · rate', 'installer', 'Scorecard from jobs']],
    failure: ['Offline updates keep their original time and sync later', 'Delay reasons are mandatory so the dashboard shows why, not just late'],
    need: ['Installation stages + readiness checklist (P1-11)', 'Delay reasons (P1-12)', 'Installer list with rates and certificates'],
    screens: [['Installation dashboard', '#/installation'], ['A site job', `#/site/${D.story.hero_site}`], ['Crew schedule', '#/schedule'], ['Site-team app', '#/siteapp']],
  },
  orders: {
    title: 'Orders & stock (Wholesale)', group: 'EGO modules', status: 'build',
    what: 'Dealer orders follow one of two paths. Stock path: allocate from the nearest warehouse with free stock, then dispatch. MOQ path: the shortfall joins a production order and is allocated when the container arrives.',
    connects: [['Division', 'Wholesale · EGO Premium'], ['Stock path', 'Requirement received → stock checked → allocated → dispatched → delivered → invoiced → collected'],
      ['MOQ path', 'Requirement received → MOQ / production order → in production → in transit → received at warehouse → allocated → dispatched → delivered → invoiced → collected'], ['Tally', 'Orders, delivery notes, invoices and receipts post to / read from Tally']],
    fields: [['Order line', 'design · qty · rate · allocations [warehouse, qty] · production order', 'order_line', ''], ['Requirement', 'vendor salesperson · design · qty · site · status', 'requirement', 'Converts to an order']],
    failure: ['Can’t allocate more than free stock or more than ordered', 'Dispatch blocked until every line is allocated'], need: ['Dealer price list', 'Warehouse ↔ region rules'],
    screens: [['Order flow', '#/orders'], ['Allocate an order', `#/worder/${D.story.alloc_order}`], ['Stock by warehouse', '#/stock']],
  },
  intake: {
    title: 'Lead intake service', group: 'Core', status: 'build',
    what: 'One front door for every lead. Receives webhooks and push feeds, cleans the phone number, checks for an existing contact, tags the source + campaign, and decides whether the AI voice agent should call.',
    connects: [['Direction', 'Inbound only (sources → intake → core)'], ['Protocol', 'HTTPS webhooks (Meta, Google, IndiaMART push, JustDial), website form POST, WhatsApp webhook, manual entry from portal / app'],
      ['Timing', 'Real time — a lead is in the CRM seconds after it is submitted'], ['Auth', 'Per-source secret / signature check (Meta X-Hub-Signature, Google google_key, shared secret for IndiaMART & JustDial)']],
    fields: [['Any source', 'phone (last 10 digits)', 'contact.phone', 'Dedupe key #1'], ['Any source', 'email', 'contact.email', 'Dedupe key #2'],
      ['Meta / Google', 'campaign, ad set, form', 'lead.campaign', 'Kept through to the sale (ROI)'], ['All', 'source', 'lead.source', 'Meta Ads, Google Ads, IndiaMART, JustDial, Website, WhatsApp, QR, Walk-in, Referral']],
    failure: ['Every event stored raw before processing, with its external id → replaying never creates duplicates', 'Processing failure → dead-letter queue + admin alert; nothing is silently dropped', 'Duplicate phone → attaches a new enquiry to the existing contact instead of a second contact'],
    need: ['Confirm the lead-source list and which sources count as "auto" (AI calls them) vs manual (AI never calls)'],
    screens: [['Consumer lead pipeline', '#/leads'], ['A lead’s journey', `#/lead/${D.story.hero_lead}`]],
  },
  core: {
    title: 'EGO Master core (CRM)', group: 'Core', status: 'build',
    what: 'The single system of record for EGO and Big E: dealers, consumers, architects, projects, products, orders, tasks and approvals. Replaces GoHighLevel entirely — no second system to keep in sync.',
    connects: [['Holds', 'Masters: Dealer · Dealer employee / Champion · Consumer · Architect & firm · Project & sites · Product (Category → Collection → SKU) · Geography (Region → State → City → Micro-market) · Installer · Salesperson'],
      ['Pipelines', 'Consumer Lead Engine (B2C) · Dealer / Project · Installation (per site)'], ['Companies', 'EGO and Big E share one system with company-level data separation and a founder view across both'],
      ['Every record', 'Owner + next action + due date; created / modified by; full change history (audit log)'], ['Built on', 'Postgres database, Node API, Next.js web portal']],
    fields: [['Order', 'lines[] (SKU, qty, unit, rate)', 'order_line', 'Unlimited SKU lines — value calculated automatically'], ['Dealer', 'FY sales, outstanding, credit', 'dealer (read from Tally)', 'Tally is the source of truth'],
      ['Lead', 'stage + timestamp per stage', 'lead_stage_history', 'Stage ageing & SLA reports'], ['Any record', 'who changed what, when', 'audit_log', 'Spec §35']],
    failure: ['Daily encrypted backups + point-in-time restore', 'Separate test environment — nothing is tried on live data', 'Role-based access: cost and GP hidden from roles that should not see them'],
    need: ['P1-01: which company runs which business (EGO vs Big E, B2B vs B2C)', 'P1-02: user list and roles', 'Product & price master (Excel is fine)'],
    screens: [['Dealer 360 + multi-SKU order', `#/dealer/${D.story.hero_dealer}`], ['Project with installation sites', `#/project/${D.story.rollout_project}`], ['Roles & permissions', '#/roles']],
  },
  portal: {
    title: 'Web portal', group: 'People', status: 'build',
    what: 'The browser app for office staff, telecallers, managers and the founders. Same data as the phone app, bigger screens: pipelines, dealer 360, orders, reports, settings.',
    connects: [['Users', 'Management · Sales head · Regional managers · Telesales · Project team · Finance · Marketing · CRM admin'], ['Access', 'Login with password + optional OTP / MFA for sensitive roles'], ['Protocol', 'HTTPS to the EGO Master API']],
    fields: [], failure: ['Session timeout + device list; admin can sign a user out everywhere'],
    need: ['Where it lives: e.g. master.egopremium.com (needs DNS access)'],
    screens: [['Integrations settings', '#/integrations'], ['Consumer lead pipeline', '#/leads']],
  },
  runo: {
    title: 'Runo (telecalling)', group: 'Connected systems', status: 'verified',
    what: 'Telecallers keep dialling from Runo. EGO Master sends them the leads; every call, its duration and disposition flow back onto the lead and can move its stage automatically.',
    connects: [['Direction', 'Two-way'], ['API', 'Runo REST API v1.9.0 — base https://api.runo.in/v1, header <code>Auth-Key</code> (key from Runo admin → API config). API use is free.'],
      ['Out (us → Runo)', '<code>POST /crm/allocation</code> assigns a lead to a telecaller or the common pool (bulk: <code>/crm/allocations</code>, 10 per call) · <code>POST /crm/interaction</code> creates / updates the customer'],
      ['In (Runo → us)', 'Webhooks: pre-call, post-call, AI call summary, interaction (Runo admin → Integrations → Webhooks). Backfill with <code>GET /call/logs</code> (previous days only) and <code>GET /crm/interactions</code>'],
      ['Timing', 'Real time via webhooks; nightly backfill to catch anything missed']],
    fields: [['Runo', 'callId', 'call.runo_call_id', 'Dedupe key'], ['Runo', 'duration (s), startTime, type', 'call.duration_s, at, direction', ''], ['Runo', 'status (disposition), tag', 'call.disposition → lead stage rule', 'e.g. "Connected – interested" → Contacted'],
      ['Runo', 'user', 'employee.runo_user', 'User mapping screen'], ['EGO Master', 'lead name, phone, category, source', 'Runo customer fields', 'So the telecaller sees context']],
    failure: ['Webhook signature/secret checked; unknown callId → stored and matched by phone', 'API errors retried with back-off; after 5 failures → admin alert', 'Nightly <code>/call/logs</code> reconciliation fills gaps'],
    need: ['Runo API key (admin)', 'List of Runo users → matched to EGO Master users', 'Disposition → stage rules', 'Unconfirmed: whether the post-call webhook carries the recording URL (test with their key)'],
    screens: [['Runo settings & call sync', '#/integrations/runo']],
  },
  salesdiary: {
    title: 'Sales Diary (field sales)', group: 'Connected systems', status: 'docs',
    what: 'Field reps check in at dealers, log visits and take orders in Sales Diary. Those visits and orders appear on the dealer’s record in EGO Master; new dealers and targets can flow back.',
    connects: [['Vendor', 'Most likely SalesDiary by Appobile Labs, Bengaluru (salesdiary.com) — confirm with EGO from the app on a rep’s phone'],
      ['Direction', 'Two-way planned: visits, orders, attendance in; dealers & products out'], ['API', 'Vendor states REST APIs + OAuth2 and ERP integrations, but no public docs — must be requested (info@appslab.in)'],
      ['Fallback', 'Scheduled Excel/CSV export → import. Or EGO Master’s own phone app replaces Sales Diary for visits and orders (saves the per-user licence)']],
    fields: [['Sales Diary', 'visit id, rep, dealer, time', 'visit', ''], ['Sales Diary', 'check-in lat/lng + accuracy', 'visit.checkin', 'Map & geo-verification'], ['Sales Diary', 'order lines', 'order (source = Sales Diary)', 'Then posted to Tally'], ['Sales Diary', 'rep user', 'employee.salesdiary_user', '']],
    failure: ['Same rules as every connector: raw event stored, retries, dead-letter queue, admin alert'],
    need: ['Confirm the exact app + plan', 'Vendor API documentation + a full-access key', 'Decide: keep Sales Diary, or move reps to the EGO Master app'],
    screens: [['Sales Diary settings & visit feed', '#/integrations/salesdiary']],
  },
  tally: {
    title: 'Tally bridge → TallyPrime', group: 'Connected systems', status: 'input',
    what: 'Tally stays the financial source of truth. A small bridge program on EGO’s Tally computer reads outstanding, receipts and stock, and posts sales orders won in EGO Master — so nobody types an invoice twice.',
    connects: [['Why a bridge', 'Tally has no cloud API or webhooks. It answers XML requests on port 9000 on the machine where it runs (JSON only from TallyPrime 7.0).'],
      ['Bridge', 'Installed on EGO’s Tally PC / server. Talks to Tally locally, pushes to EGO Master over HTTPS (outbound only — no ports opened on EGO’s network)'],
      ['Timing', 'Every 2 minutes while Tally is open; heartbeat so we know when Tally is closed'], ['Companies', 'EGO books and Big E books mapped separately — every request names the Tally company']],
    fields: [['Tally', 'Ledger (party)', 'dealer.tally_ledger', 'Mapping screen'], ['Tally', 'Sales vouchers, credit notes', 'invoice', 'Read'], ['Tally', 'Receipts', 'receipt', 'Read → outstanding'],
      ['Tally', 'Bills outstanding, credit limit', 'dealer.outstanding', 'Read'], ['Tally', 'Stock items: closing, committed', 'stock', 'Read → stock-outs'], ['EGO Master', 'Won order lines', 'Sales Order voucher', 'Write (queued)']],
    failure: ['Orders queue when Tally is closed and post when it reopens', 'Rejected voucher (e.g. missing ledger) → shown on screen with the reason + admin alert', 'Daily reconciliation: EGO Master vs Tally totals must match within ±1%'],
    need: ['Tally edition + version (P1-24)', 'Where Tally runs and who looks after it (P1-25, P1-27)', 'Company names for EGO and Big E (P1-26)', 'Which fields Tally owns vs EGO Master owns'],
    screens: [['Tally bridge status & order queue', '#/integrations/tally']],
  },
  whatsapp: {
    title: 'WhatsApp Cloud API', group: 'Connected systems', status: 'review',
    what: 'Direct from Meta, no reseller. Stage updates to consumers, order status to dealers, and a one-tap “Accept lead” button for dealers. Replies land in the shared inbox.',
    connects: [['Direction', 'Two-way'], ['Out', 'Approved templates (marketing / utility) + free replies inside the 24-hour window'], ['In', 'Webhook: incoming messages, delivery / read status, button taps'],
      ['Dealer accept', 'Utility template with a quick-reply button; the tap arrives on our webhook with the lead id → lead moves to Dealer Accepted'],
      ['Cost (India, 2026)', 'Marketing ≈ ₹0.86 / message, utility ≈ ₹0.115, replies inside 24 h free; + 18% GST; INR billing required by 31 Dec 2026']],
    fields: [['WhatsApp', 'wa_id / phone', 'contact.phone', ''], ['WhatsApp', 'button payload', 'lead.id + action', 'Accept / Decline'], ['WhatsApp', 'status (sent, delivered, read, failed)', 'message.status', '']],
    failure: ['Failed sends retried; template rejected → admin alert', 'Marketing messages blocked for contacts without consent', 'Unverified business = 250 messages/day → finish Meta Business Verification first'],
    need: ['Meta Business Verification (you are arranging)', 'The WhatsApp number (not active on another WhatsApp Business account)', 'Template wording sign-off'],
    screens: [['WhatsApp settings + dealer Accept flow', '#/integrations/whatsapp']],
  },
  meta: {
    title: 'Meta lead ads', group: 'Lead sources', status: 'review',
    what: 'Facebook / Instagram lead forms land in EGO Master within seconds, with campaign and ad set kept for ROI.',
    connects: [['How', 'Page subscribed to the leadgen webhook → we receive a lead id → fetch the answers with the Page token'], ['Permissions', 'leads_retrieval, pages_manage_metadata, pages_show_list, pages_read_engagement, ads_management — needs Meta App Review'],
      ['Spend', 'Nightly pull of ad spend (Marketing API insights) for Marketing ROI'], ['Watch-outs', 'Meta keeps lead data 90 days; Graph API versions expire (v20 on 24 Sep 2026) — we pin and upgrade']],
    fields: [['Meta', 'leadgen_id', 'lead.external_id', 'Dedupe'], ['Meta', 'form answers', 'lead fields', 'Mapping per form'], ['Meta', 'campaign / ad set / ad', 'lead.campaign', ''], ['Meta', 'spend by campaign', 'marketing_spend', 'Nightly']],
    failure: ['Missed webhook → hourly poll of recent leads per form'], need: ['Admin access on EGO’s Business Manager + Page', 'App Review (you are arranging)'],
    screens: [['Lead sources settings', '#/integrations/meta']],
  },
  google: {
    title: 'Google Ads lead forms', group: 'Lead sources', status: 'review',
    what: 'Google lead-form extensions post each lead to our webhook; ad spend is pulled nightly.',
    connects: [['How', 'Lead form webhook → JSON POST with google_key we validate; dedupe on lead_id'], ['Spend', 'Google Ads API — since 9 Sep 2026 access is tied to the Google Cloud project; new access needs brand verification']],
    fields: [['Google', 'lead_id', 'lead.external_id', ''], ['Google', 'user_column_data', 'lead fields', ''], ['Google', 'campaign_id, cost', 'marketing_spend', 'Nightly']],
    failure: ['Webhook test lead on setup; non-200 responses are retried by Google'], need: ['Google Ads customer ID + access', 'Brand verification (you are arranging)'],
    screens: [['Lead sources settings', '#/integrations/google']],
  },
  indiamart: {
    title: 'IndiaMART', group: 'Lead sources', status: 'verified',
    what: 'Buy-leads from IndiaMART arrive in real time and go through the same intake as every other lead.',
    connects: [['Primary', 'Push API — IndiaMART POSTs JSON to our HTTPS URL; we must answer 200 (retried, disabled after 48 h of failures)'], ['Backup', 'Pull API (crmListing v2) — at most every 5 minutes, max 7-day window'], ['Direction', 'Inbound only'], ['Needs', 'Paid IndiaMART seller account']],
    fields: [['IndiaMART', 'UNIQUE_QUERY_ID', 'lead.external_id', ''], ['IndiaMART', 'SENDER_NAME, MOBILE, CITY', 'contact', ''], ['IndiaMART', 'QUERY_PRODUCT_NAME, MESSAGE', 'lead.category, notes', '']],
    failure: ['Pull API runs every 15 min as a safety net'], need: ['IndiaMART CRM key (Lead Manager → CRM integration)'],
    screens: [['Lead sources settings', '#/integrations/indiamart']],
  },
  justdial: {
    title: 'JustDial', group: 'Lead sources', status: 'input',
    what: 'JustDial enquiries forwarded to EGO Master in real time.',
    connects: [['How', 'No self-serve API: EGO’s JustDial account manager registers our webhook URL; leads arrive as a GET request with query parameters'], ['Direction', 'Inbound only'], ['Unknown', 'Exact field list — we log the first real lead and map it']],
    fields: [['JustDial', 'leadid', 'lead.external_id', ''], ['JustDial', 'name, mobile, city, category', 'contact + lead', 'Confirmed on first lead']],
    failure: ['Shared secret in the URL; unknown fields stored raw until mapped'], need: ['JustDial account manager contact', 'Confirm the plan includes lead push'],
    screens: [['Lead sources settings', '#/integrations/justdial']],
  },
  website: {
    title: 'Website form + AI chatbot', group: 'Lead sources', status: 'build',
    what: 'Enquiry form and a chatbot on egopremium.com that answers from EGO’s own catalogue, qualifies, suggests floors/colours from a room photo, and hands over to a person.',
    connects: [['How', 'Small script tag on the website → EGO Master API'], ['AI', 'LLM answers only from EGO’s knowledge base (catalogue, specs, price bands, warranty, FAQs) stored in the same database (pgvector)'],
      ['Hand-off', 'Price negotiation, complaint or high-value enquiry → human, instantly']],
    fields: [['Chat', 'name, phone, city, requirement', 'lead', 'source = Website'], ['Chat', 'transcript', 'lead.timeline', '']],
    failure: ['If the AI is unsure → “Let me connect you to our team” + task to a person'], need: ['Website admin access (P1-34)', 'Knowledge-base documents (P1-18)'],
    screens: [['Website & chatbot settings', '#/integrations/website']],
  },
  voice: {
    title: 'AI voice agent', group: 'AI', status: 'input',
    what: 'Answers inbound calls and calls back new auto-source leads within minutes, asks the qualification questions in English, Hindi or Marathi, and routes: Qualified → telecaller in Runo, Nurture, or Lost.',
    connects: [['Platform', 'Bolna (Indian, ~4–6¢/min) or Sarvam speech models + Plivo India numbers (~₹0.38/min) — chosen after a hands-on Marathi test'],
      ['Rules (TRAI)', 'Call-backs to people who enquired = service calls with recorded consent. Cold promotional AI calls need 140-series numbers + DLT registration — not planned'],
      ['Never calls', 'Field, walk-in or manual leads (the team is already in touch)']],
    fields: [['Call', 'answers to qualification questions', 'lead fields (area, budget, timeline, architect?)', ''], ['Call', 'outcome', 'lead.stage', 'Qualified / Nurture / Lost'], ['Call', 'recording + summary', 'lead.timeline', '']],
    failure: ['No answer → up to N attempts, then a WhatsApp message', 'Low confidence → human call task'], need: ['Languages + question set (P1-16)', 'Routing matrix (P1-17)', 'Company KYC for phone numbers (certificate of incorporation, GST)'],
    screens: [['Voice agent & LLM settings', '#/integrations/voice']],
  },
  app: {
    title: 'Phone app (Android APK + iPhone)', group: 'People', status: 'build',
    what: 'For field sales, telecallers, site teams and managers. Works offline, captures visits, orders, photos and site progress, and syncs when the network returns. Delivered as files — not on the Play Store / App Store.',
    connects: [['Android', 'Signed APK. Updates install over the old version and keep all data (same package name + same signing key + higher version)'], ['iPhone', 'Ad Hoc .ipa for up to 100 registered iPhones a year (re-signed yearly)'],
      ['Updates', 'Most updates arrive over the air when the app opens; a new file is only needed for deeper changes (new permissions)'], ['Data', 'Server is the source of truth; the phone keeps an offline copy + an outbox of unsent changes']],
    fields: [], failure: ['Outbox never deleted until the server confirms', 'App warns before logout / reinstall if unsent changes exist', 'Signing key backed up in two places'],
    need: ['Number of Android vs iPhone users (iPhones need their device IDs registered)'],
    screens: [['Phone app screens', '#/app'], ['How updates keep data', '#/app/updates']],
  },
  ai: {
    title: 'AI Analysis engine', group: 'AI', status: 'build',
    what: 'Runs every night (and on demand) over the CRM + Tally data: LTV, dealer dormancy, product performance, area and source ROI. Explains why, and pushes the top actions back as tasks and WhatsApp alerts.',
    connects: [['Pipeline', '1 · data from core + Tally + ad spend → 2 · scheduled jobs → 3 · LLM (Gemini / Claude, batch pricing) reasons over numbers + knowledge base → 4 · dashboards refresh → 5 · tasks / alerts to the right person'],
      ['Explainable', 'Every insight links to the records behind it'], ['Permissions', 'The AI only sees what the viewer’s role may see'], ['Cost', 'At EGO’s volume, a few US dollars a month of LLM usage']],
    fields: [['Orders + Tally', 'invoices, receipts, GP', 'dealer_ltv, category_perf', ''], ['Leads', 'stage history, source, spend', 'funnel, source_roi', ''], ['Stock', 'on hand, committed', 'stockout_impact', '']],
    failure: ['A failed night run keeps yesterday’s numbers and shows “as of” time', 'Numbers are computed in the database; the LLM only explains them (no invented figures)'],
    need: ['Gemini / Claude API key on EGO’s account (P1-21)', 'Historical sales export from Tally for day-one analysis'],
    screens: [['AI Analysis dashboard', '#/ai']],
  },
  dash: {
    title: 'Dashboards & digests', group: 'AI', status: 'build',
    what: 'Role dashboards (founder, sales head, RM, telesales, projects, finance, marketing) plus the 10 am / 8 pm WhatsApp & email digests.',
    connects: [['Refresh', 'Live counts; AI insights nightly'], ['Drill-down', 'Every number opens the records behind it']], fields: [], failure: [], need: ['KPIs Roshan checks every day'],
    screens: [['AI Analysis dashboard', '#/ai']],
  },
  p2: {
    title: 'Phase 2 · AI Strategy', group: 'Phase 2', status: 'p2',
    what: 'Target engine (Dealer × Product, Area × Product), Scheme engine, Priority 200 development programme, approval & authority matrix, and the CEO cockpit for Mission ₹25 cr with “why are we behind?” answers.',
    connects: [['Builds on', 'The same core and AI engine — nothing rebuilt'], ['Starts', 'After Phase 1 sign-off']], fields: [], failure: [], need: ['P2-01 Priority 200 intervention types', 'P2-02 approval limits'],
    screens: [],
  },
};

// ---------------------------------------------------------------- map geometry (viewBox 1240 × 760)
const N = {
  meta: [20, 92, 184, 44, 'Meta lead ads', 'FB · Instagram forms'], google: [20, 146, 184, 44, 'Google Ads', 'lead forms'],
  website: [20, 200, 184, 44, 'Website + AI chatbot', 'egopremium.com'], wa_in: [20, 254, 184, 44, 'WhatsApp', 'incoming chats', 'whatsapp'],
  indiamart: [20, 308, 184, 44, 'IndiaMART', 'push API'], justdial: [20, 362, 184, 44, 'JustDial', 'webhook via account mgr'],
  manual: [20, 416, 184, 44, 'Walk-in · phone · QR', 'entered in app / portal', 'intake'],
  intake: [264, 206, 160, 60, 'Lead intake', 'dedupe · tag source'], voice: [264, 336, 160, 60, 'AI voice agent', 'EN · HI · MR'],
  portal: [530, 30, 250, 52, 'Web portal', 'office · telecallers · founders'],
  core: [520, 140, 270, 400, 'EGO Master core', ''],
  runo: [950, 122, 270, 60, 'Runo', 'telecalling · two-way'], salesdiary: [950, 212, 270, 60, 'Sales Diary', 'field visits & orders'],
  tally: [950, 302, 270, 60, 'Tally bridge → TallyPrime', 'agent on EGO’s Tally PC'], whatsapp: [950, 392, 270, 60, 'WhatsApp Cloud API', 'templates · dealer Accept'],
  app: [520, 626, 220, 60, 'Phone app', 'APK · iPhone · offline'], ai: [780, 626, 214, 60, 'AI Analysis engine', 'nightly · LLM'],
  dash: [1060, 626, 160, 60, 'Dashboards', 'roles · digests'], p2: [780, 736, 440, 54, 'Phase 2 · AI Strategy', 'targets · schemes · Priority 200 · approvals · CEO cockpit'],
};
// [id, path, label, lx, ly, twoWay, dashed, anchor]
const E = [
  ['src', 'M204,114 H236 M204,168 H236 M204,222 H236 M204,276 H236 M204,330 H236 M204,384 H236 M204,438 H236 M236,114 V438 M236,236 H264', 'webhooks · push', 236, 478],
  ['intake-core', 'M424,236 H520', 'new lead', 472, 226],
  ['intake-voice', 'M344,266 V336', 'auto sources only', 350, 306, false, false, 'start'],
  ['voice-core', 'M424,366 H520', 'result', 472, 356, true],
  ['portal-core', 'M655,82 V140', 'HTTPS API', 662, 116, true, false, 'start'],
  ['core-runo', 'M790,152 H950', 'leads ⇄ calls', 870, 142, true],
  ['core-salesdiary', 'M790,242 H950', 'visits · orders', 870, 232, true],
  ['core-tally', 'M790,332 H950', 'orders ⇄ outstanding', 870, 322, true],
  ['core-whatsapp', 'M790,422 H950', 'messages ⇄ Accept', 870, 412, true],
  ['core-app', 'M630,540 V626', 'sync · offline outbox', 636, 586, true, false, 'start'],
  ['core-ai', 'M765,540 V580 H887 V626', 'nightly data ⇄ tasks', 826, 572, true],
  ['ai-dash', 'M994,656 H1060', '', 0, 0],
  ['ai-p2', 'M887,686 V736', 'Phase 2 builds on it', 894, 716, false, true, 'start'],
];
const JOURNEYS = {
  none: { label: 'Whole system' },
  lead: { label: 'Lead journey', nodes: ['meta', 'intake', 'voice', 'core', 'orders_retail', 'clients', 'runo', 'whatsapp', 'app'], edges: ['src', 'intake-core', 'intake-voice', 'voice-core', 'core-runo', 'core-whatsapp', 'core-app'],
    steps: ['Consumer fills a Meta lead form → intake removes duplicates and tags “Meta Ads · campaign”', 'Auto source → AI voice agent calls within minutes and qualifies in Hindi / Marathi / English',
      'Qualified → lead allocated to a Platinum/A dealer nearby and a telecaller in Runo', 'Dealer taps “Accept” on WhatsApp → stage moves to Dealer Accepted',
      'Telecaller’s Runo call + disposition sync back; field rep sees the visit in the phone app'] },
  order: { label: 'Wholesale order → warehouse', nodes: ['salesdiary', 'app', 'core', 'dealers', 'orders', 'production', 'tally', 'ai', 'dash', 'whatsapp'], edges: ['core-salesdiary', 'core-app', 'core-tally', 'core-ai', 'ai-dash', 'core-whatsapp'],
    steps: ['A vendor salesperson raises a requirement, or a field rep takes a multi-SKU order', 'Stock path: allocated from the nearest warehouse with free stock · MOQ path: the shortfall joins a production order', 'Container received at Bhiwandi → quantity allocated across waiting dealers → dispatched; posts to Tally',
      'Invoice, receipt and outstanding come back from Tally every 2 minutes', 'Dealer gets order-status WhatsApp updates; nightly AI updates LTV, dormancy and product performance'] },
  install: { label: 'Installation', nodes: ['core', 'projects', 'installation', 'app', 'whatsapp', 'tally', 'dash'], edges: ['core-app', 'core-whatsapp', 'core-tally', 'ai-dash'],
    steps: ['Won project creates one installation job per site (Site 1 … N)', 'Site team updates survey, BOQ, progress %, photos and snags from the phone — offline if needed', 'Each stage change sends the client a WhatsApp update',
      'Sign-off captured on the phone; billing flows to Tally', 'Dashboard shows sites pending survey, waiting for material, delayed, snagging, signed off'] },
};

function mapSVG(j) {
  const J = JOURNEYS[j] || JOURNEYS.none;
  const onN = id => J.nodes && J.nodes.includes(id), onE = id => J.edges && J.edges.includes(id);
  const node = id => {
    const [x, y, w, h, t, s, target] = N[id];
    const cid = target || id, st = COMP[cid].status, dot = STATUS[st][0];
    if (id === 'core') {
      const grp = (label, yy, mods) => `<text class="grp" x="${x + 16}" y="${yy}">${label}</text>` + mods.map(([mid, mt, ms], i) => { const by = yy + 8 + i * 48; return `<a href="#/c/${mid}" class="nd sub ${onN(mid) ? 'on' : ''}" aria-label="${mt} — open details"><rect class="box" x="${x + 12}" y="${by}" width="${w - 24}" height="42" rx="7"/>
          <text class="t" x="${x + 24}" y="${by + 18}" style="font-size:12.5px">${mt}</text><text class="s" x="${x + 24}" y="${by + 33}" style="font-size:10.5px">${ms}</text></a>`; }).join('');
      return `<g class="nd core ${onN(id) ? 'on' : ''}"><rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>
        <a href="#/c/core" aria-label="EGO Master core — open details"><text class="t" x="${x + 16}" y="${y + 26}" style="font-size:15px">${t} ›</text></a><text class="s" x="${x + 16}" y="${y + 42}">one database · two divisions · roles & audit</text>
        ${grp('WHOLESALE · EGO PREMIUM', y + 64, [['dealers', 'Vendors & salespeople', 'distributors · dealers · requirements'], ['orders', 'Orders & stock', 'stock path · MOQ path · warehouses'], ['production', 'Production & allocation', 'MOQ orders · containers · allocate']])}
        ${grp('RETAIL · BIG E', y + 226, [['clients', 'Clients & architect firms', 'all clients · firms → architects'], ['projects', 'Projects & installation', 'quotes · sites · crews · sign-off'], ['orders_retail', 'Consumer leads', 'every source → AI call → dealer']])}</g>`;
    }
    return `<a href="#/c/${cid}" class="nd ${id === 'p2' ? 'p2' : ''} ${onN(id) ? 'on' : ''}" aria-label="${esc(t)} — open details">
      <rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/>
      <text class="t" x="${x + 14}" y="${y + (h > 50 ? 26 : 19)}">${esc(t)}</text><text class="s" x="${x + 14}" y="${y + (h > 50 ? 44 : 35)}">${esc(s)}</text>
      <circle class="dot ${dot}" cx="${x + w - 13}" cy="${y + 13}" r="5"><title>${STATUS[st][1]}</title></circle></a>`;
  };
  const edge = ([id, d, label, lx, ly, two, dash, anchor]) => {
    const w = label.length * 5.6 + 8, x0 = anchor === 'start' ? lx - 3 : lx - w / 2;
    return `<g class="ed ${dash ? 'dash' : ''} ${onE(id) ? 'on' : ''}"><path d="${d}" marker-end="url(#ah)" ${two ? 'marker-start="url(#ahs)"' : ''}/>${label ? `
    <rect class="lbl-bg" x="${x0}" y="${ly - 10}" width="${w}" height="14" rx="3"/><text x="${lx}" y="${ly}" text-anchor="${anchor || 'middle'}">${esc(label)}</text>` : ''}</g>`;
  };
  return `<svg viewBox="0 0 1240 810" role="img" aria-label="EGO Master system map: lead sources flow through lead intake and the AI voice agent into the EGO Master core, which syncs two-way with Runo, Sales Diary, Tally and WhatsApp, serves the web portal and phone app, and feeds the AI Analysis engine and dashboards." class="${J.nodes ? 'hl' : ''}">
    <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9 z" fill="currentColor" opacity=".55"/></marker>
    <marker id="ahs" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10,1 L1,5 L10,9 z" fill="currentColor" opacity=".55"/></marker></defs>
    <text class="grp" x="20" y="74">LEAD SOURCES</text><text class="grp" x="950" y="104">CONNECTED SYSTEMS</text><text class="grp" x="520" y="612">PEOPLE &amp; AI</text>
    ${E.map(edge).join('')}${Object.keys(N).map(node).join('')}</svg>`;
}

EM.VIEWS.map = arg => {
  const j = JOURNEYS[arg] ? arg : 'none', J = JOURNEYS[j];
  const groups = ['EGO modules', 'Core', 'Connected systems', 'Lead sources', 'AI', 'People', 'Phase 2'];
  return `<div class="stack">
    <div class="row between" style="align-items:flex-end"><div class="stack-s"><div class="kicker">EGO Premium × Big E · system architecture</div>
      <h1>One system, built for EGO</h1><p class="muted" style="max-width:760px">One system, two divisions: Wholesale (EGO Premium — vendors, orders, warehouses, production) and Retail (Big E — clients, architect firms, projects, installation), each with its own team and access. Click any box to see how it works, what data moves, what can go wrong, and the real screen.</p></div></div>
    <div class="row between"><div class="seg" role="tablist" aria-label="Highlight a journey">${Object.entries(JOURNEYS).map(([k, v]) => `<button role="tab" aria-selected="${k === j}" class="${k === j ? 'on' : ''}" data-act="journey" data-j="${k}">${v.label}</button>`).join('')}</div>
      <div class="legend">${['verified', 'docs', 'input', 'review', 'build'].map(k => `<span class="badge ${STATUS[k][0]}">${STATUS[k][1]}</span>`).join('')}</div></div>
    <figure style="margin:0"><div class="map-wrap">${mapSVG(j)}</div>
      <figcaption class="small muted" style="margin-top:8px">Arrows show which way data moves; double-headed = two-way sync. The coloured dot on each box is its status. On a phone, scroll the map sideways or use the list below.</figcaption></figure>
    ${J.steps ? `<section class="card"><h3>${J.label}, step by step</h3><ol class="steps" style="margin-top:12px">${J.steps.map(s => `<li><span>${s}</span></li>`).join('')}</ol></section>` : ''}
    ${groups.map(g => `<section class="stack-s"><h2>${g}</h2><div class="grid g3">${Object.entries(COMP).filter(([, c]) => c.group === g).map(([id, c]) => `
      <a class="card comp" href="#/c/${id}"><h3><span>${c.title}</span></h3><div style="margin:6px 0">${statusBadge(c.status)}</div><p class="muted small">${c.what}</p></a>`).join('')}</div></section>`).join('')}
  </div>`;
};
EM.VIEWS.map.title = () => 'System map';
EM.ACTIONS.journey = el => { location.hash = el.dataset.j === 'none' ? '#/map' : `#/map/${el.dataset.j}`; };

EM.VIEWS.c = id => {
  const c = COMP[id];
  if (!c) return `<p>Unknown component. <a href="#/map">Back to the map</a></p>`;
  return `<div class="stack">
    ${crumbs(['System map', '#/map'], [c.group], [c.title])}
    <div class="row between"><div class="stack-s"><h1>${c.title}</h1><div class="row">${statusBadge(c.status)}</div></div>
      <div class="row">${c.screens.map(([l, h], i) => `<a class="btn ${i ? '' : 'primary'}" href="${h}">Open: ${l} →</a>`).join('')}</div></div>
    <p style="font-size:16px;max-width:860px">${c.what}</p>
    <div class="grid g2">
      <section class="card stack-s"><h3>How it connects</h3>${kv(c.connects)}</section>
      <section class="stack">
        ${c.need.length ? `<section class="card stack-s"><h3>What we need from EGO</h3><ul class="clean">${c.need.map(n => `<li>${n}</li>`).join('')}</ul></section>` : ''}
        ${c.failure.length ? `<section class="card stack-s"><h3>When something goes wrong</h3><ul class="clean">${c.failure.map(n => `<li>${n}</li>`).join('')}</ul></section>` : ''}
      </section>
    </div>
    ${c.fields.length ? `<section class="stack-s"><h3>Data mapping</h3>${table(['System', 'Their field', 'EGO Master field', 'Note'], c.fields.map(r => r.map((x, i) => i === 1 || i === 2 ? `<code>${esc(x)}</code>` : esc(x))))}</section>` : ''}
  </div>`;
};
EM.VIEWS.c.tab = 'map';
EM.VIEWS.c.title = id => COMP[id] ? COMP[id].title : 'Component';
