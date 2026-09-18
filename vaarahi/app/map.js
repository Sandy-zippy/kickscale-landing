'use strict';
/* System map (D30) — one picture of the whole system for Vaarahi Silks, every box clickable.
   Same honesty rule as the EGO map: a box says what is in this demo, what still needs Vaarahi's
   input, and what has to be checked with the vendor. Nothing here claims to be live. */

const STATUS = {
  demo: ['ok', 'Working in this demo'],
  input: ['gold', "Needs Vaarahi's input"],
  confirm: ['warn', 'Integration to confirm'],
  p2: ['muted', 'Phase 2 / 3'],
};
const sdot = st => `<span class="sdot ${STATUS[st][0]}" title="${STATUS[st][1]}"></span>`;
const statusBadge = st => `<span class="chip ${st === 'demo' ? 'good' : st === 'confirm' ? 'warn' : ''}">${sdot(st)} ${STATUS[st][1]}</span>`;

const COMP = {
  // ---- where clients come from
  wa_in: { title: 'WhatsApp — the brand number', group: 'Where clients come from', status: 'demo',
    what: 'One number for all six branches (+91 90004 54411, the number on vaarahisilks.com). Every message lands in one inbox, is read by AI first, and belongs to that client\'s Sales staff — anyone allowed can reply, and it always goes out from the brand number.',
    connects: [['Direction', 'Two-way'], ['Who owns a chat', "The client's Sales staff; a manager can reassign inside the chat"], ['Meta\'s 24-hour rule', 'Free typing for 24 hours after the client writes; after that only a pre-approved template'], ['Coexistence', 'The WhatsApp Business app on the phone keeps working alongside the Cloud API']],
    fields: [['WhatsApp', 'phone number', 'client.mobile', 'Last 10 digits — the one key that links everything'], ['WhatsApp', 'message text', 'communication.body', 'Read by AI, never auto-sent'], ['WhatsApp', 'message time', 'the 24-hour window', 'Decides free text vs template']],
    failure: ['A number nobody recognises creates a client marked Unassigned, so nothing is lost', 'If a message waits over 24 hours, the apology template is suggested automatically'],
    need: ['Meta Business verification for Vaarahi', 'The brand number moved to the Cloud API (the shop keeps using the Business app)'],
    screens: [['WhatsApp inbox', '#/inbox'], ['Template library', '#/settings/templates']] },
  google: { title: 'Google reviews', group: 'Where clients come from', status: 'confirm',
    what: 'A 1-star review is a complaint that happens to be public. Reviews for every branch come into the same Grievance Cell as WhatsApp complaints, are matched to the client where possible, and are replied to from here.',
    connects: [['Direction', 'Two-way (read reviews, post replies)'], ['API', 'Google Business Profile API'], ['Unmatched reviews', 'Go to a "match me" queue instead of being dropped']],
    fields: [['Google', 'review text + stars', 'grievance.touchpoint', ''], ['Google', 'reviewer name', 'match to client', 'Manual match when unsure']],
    failure: ['A public reply is short and moves the conversation private — the full fix happens on WhatsApp or the phone'],
    need: ['Access to the Google Business Profile that owns all six branches', 'Google API access (needs a verified profile 60+ days old, a privacy policy and a matching email domain)'],
    screens: [['A complaint from two channels', '#/grievances']] },
  meta: { title: 'Instagram & Facebook', group: 'Where clients come from', status: 'confirm',
    what: 'Comments, mentions and direct messages on Vaarahi\'s pages arrive as enquiries or complaints, alongside WhatsApp — so a bride who asks in an Instagram DM is the same client as the one who walks in.',
    connects: [['Direction', 'Two-way'], ['API', 'Meta Graph API — needs app review for page/IG messaging'], ['Phase', 'Comments and DMs in Phase 1; ad comments later']],
    fields: [['Instagram', 'DM / comment', 'communication', ''], ['Meta', 'ad + campaign name', 'client.source', 'So you can see which campaign brought a buyer']],
    failure: ['Nothing is auto-replied in public — a person approves every reply'],
    need: ['Admin access to the Instagram and Facebook pages', 'Meta app review (a screen recording of the app is required)'],
    screens: [['Complaint intake from any channel', '#/grievances']] },
  web: { title: 'Website & catalogue', group: 'Where clients come from', status: 'confirm',
    what: 'vaarahisilks.com runs on Shopify, and its catalogue is already readable — the 261 designs in this demo came from it. Enquiry forms create a client; the catalogue keeps designs, photos and prices in step without anyone retyping them.',
    connects: [['Direction', 'Catalogue in, enquiries in'], ['Read', 'Shopify products and collections'], ['Timing', 'Website enquiry → client in seconds; catalogue on a schedule']],
    fields: [['Shopify', 'product, collection, price, photos', 'product', 'Designs shown to staff and matched to WhatsApp enquiries'], ['Website form', 'name, mobile, message', 'client + enquiry', '']],
    failure: ['A design that exists in the shop but not on the website can always be added by hand (New design)'],
    need: ['Confirm who runs the website, and whether counter stock should follow the website or the POS'],
    screens: [['Catalogue', '#/inventory/catalogue']] },
  walkin: { title: 'Walk-in at the door', group: 'Where clients come from', status: 'demo',
    what: 'The biggest source of all, and the one nobody records today. Allocation staff take the mobile number first — a returning client fills herself in — note what she is looking for, her budget and occasion, and hand her to a consultant.',
    connects: [['Who', 'Allocation staff, on a phone or tablet at the door'], ['Then', 'Consultant → billing desk'], ['Repeat visit', 'Her earlier visits, likes and the pieces she said no to are already on the screen']],
    fields: [['At the door', 'mobile', 'client.mobile', 'Finds the returning client'], ['At the door', 'looking for, budget, occasion, party size', 'visit', 'What the consultant sees before showing anything']],
    failure: ['A client already on the floor cannot be logged twice', 'A brand-new walk-in with no Sales staff yet goes to the store manager to assign'],
    need: ['Whether the current billing software stores the customer\'s mobile number — that decides how much history can be moved across'],
    screens: [['Walk-ins today', '#/home'], ['A client on the floor', () => `#/visit/${D.story.visit_consultant_id}`]] },
  call: { title: 'Phone call & in-store note', group: 'Where clients come from', status: 'demo',
    what: 'What is said on a call or at the counter is logged in under 30 seconds — by voice if hands are full — so it survives the day. Complaints heard on the phone open a case in the same queue.',
    connects: [['Who', 'Anyone with the app'], ['Speed', 'Under 30 seconds is the design rule'], ['Phase 3', 'Call recording and transcription']],
    fields: [['Quick update', 'interests, occasion, budget, next step', 'preferences + follow-up', '']],
    failure: ['If nothing is picked, nothing is saved — no half-filled records'],
    need: [], screens: [['Quick update on a client', '#/customers']] },

  // ---- core
  core: { title: 'Growth Engine core', group: 'Core', status: 'demo',
    what: 'One database for all six branches: people, families, what they own, what they want, what they were shown, what they bought, and every conversation. This is the layer the Frankenstein stack (Tally + Excel + WhatsApp + POS + memory) cannot give you, because none of those systems knows the person.',
    connects: [['Shape', 'Client → Family → Preferences → Owned pieces → Visits & shortlists → Orders → Next action'], ['Branches', 'Six branches, one client book; a sale at Jubilee Hills is on her profile at Kukatpally seconds later'],
      ['Roles', 'Every role sees a different slice — cost and margins are hidden from the roles that should not see them'], ['History', 'Who changed what, and when']],
    fields: [['Client', 'mobile', 'the one key', 'Duplicates blocked'], ['Family', 'members + relation', 'household', "A family's spend shown together"], ['Piece', 'Silk Mark tag', 'asset', 'Each pure-silk saree keeps its own history — owner, warranty, repairs']],
    failure: ['Daily backups; a separate test copy — nothing is tried on live data', 'Every automatic message is drafted for a person to approve'],
    need: ['The client list as it is today (Excel, POS export, or paper)', 'The staff list with who reports to whom'],
    screens: [['A client profile', () => `#/customer/${D.story.two_pm_customer_id}`], ['Roles & access', '#/settings']] },
  clients: { title: 'Clients & families', group: 'Core', status: 'demo',
    what: 'Every client, with her family beside her. Tiers move by themselves on last-12-month spend (VIP from ₹10L, Premium from ₹2.5L), and a manager can set one by hand with a reason.',
    connects: [['Family', 'Link a mother, daughter or sister — the whole household\'s purchases and likes show together'], ['Tiers', 'Automatic, recalculated as sales come in'], ['Scope', 'Sales staff see their own clients; a manager sees the branch; a director sees everything']],
    fields: [['Client', 'name, mobile, branch, Sales staff, tier', 'client', ''], ['Client', 'birthday, anniversary, family events', 'important_date', 'Reminders before the date']],
    failure: ['The same mobile cannot belong to two clients'],
    need: ['Existing client data to import'],
    screens: [['Clients', '#/customers'], ['A VIP profile', () => `#/customer/${D.story.two_pm_customer_id}`]] },
  floor: { title: 'Visits & shortlists (shop floor)', group: 'Core', status: 'demo',
    what: 'The walk-in journey: allocation staff create the visit, the consultant shortlists pieces and marks each one Liked · Owns it · Buying · Said no, and billing charges only what is marked Buying. The pieces she liked but did not buy are the most valuable thing in the system.',
    connects: [['Teams', 'Allocation staff → consultant → billing desk'], ['To the profile', 'Every visit and every mark lands on the client\'s In store tab'], ['To Sales staff', 'A follow-up the same day: liked 4, bought 2 — follow up on the rest'], ['To campaigns', 'The "liked in store, not bought" audience']],
    fields: [['Visit', 'looking for, budget, occasion, party', 'visit', ''], ['Each piece shown', 'liked / owns it / buying / said no', 'visit_item', 'Said no = don\'t show again next visit']],
    failure: ['Billing can only charge pieces the consultant marked Buying', 'A piece dropped at the till goes back to Liked, not lost'],
    need: ['How many consultants per branch, and who allocates at the door'],
    screens: [['Walk-ins today', '#/home'], ['A visit', () => `#/visit/${D.story.visit_consultant_id}`]] },
  pipeline: { title: 'Pipeline & follow-ups', group: 'Core', status: 'demo',
    what: 'What each client is likely to buy next, when, and who is on it — with follow-ups that appear on the right person\'s screen today, not in a diary nobody opens. Missed ones escalate to the manager after 24 hours.',
    connects: [['Views', 'Due today · this week · this month, for Sales staff and for the manager'], ['Sources', 'A WhatsApp enquiry, a shop-floor visit, an appointment, or added by hand'], ['Every item', 'Says why it exists']],
    fields: [['Opportunity', 'what it is for, value, expected date, stage', 'opportunity', ''], ['Follow-up', 'reason, action, due, owner', 'follow_up', 'Escalates when missed']],
    failure: ['Reassigning a client moves her open follow-ups with her'],
    need: ['Your stage names, if they differ from Enquiry → Shortlisted → Trial → Negotiation → Won / Lost'],
    screens: [['Pipeline', '#/pipeline'], ['Appointments', '#/appointments']] },
  grievance: { title: 'Grievance Cell', group: 'Core', status: 'demo',
    what: 'Complaints from every channel — WhatsApp, a Google review, Instagram, the phone, the counter — become one case with one deadline, one owner and one escalation ladder. While a case is open, marketing to that client stops by itself and starts again when it is resolved.',
    connects: [['Intake', 'Every channel lands in the same queue; the same issue reported twice merges into one case'], ['Deadlines', 'By severity, set by the director'], ['Ladder', 'Store manager → regional head → business head'], ['The only pause', 'An open complaint is the only thing that pauses marketing; service messages keep going']],
    fields: [['Complaint', 'category, severity, channel(s), deadline', 'grievance', ''], ['Each message', 'channel, time, text', 'touchpoint', 'Replies go back on the same channel']],
    failure: ['A public review gets a short public reply and then moves private', 'A VIP complaint is always answered by a person'],
    need: ['Your complaint categories and the deadline per severity'],
    screens: [['Complaints', '#/grievances'], ['One complaint, two channels', () => `#/grievances/${D.story.grievance_id}`]] },
  stock: { title: 'Catalogue, stock & waiting list', group: 'Core', status: 'demo',
    what: 'Every design with its photos and price, pieces per branch, and the clients waiting for something that is out of stock. When the parcel arrives, the people who waited are the first to know.',
    connects: [['Stock from', 'The POS, or added here for new arrivals'], ['Pure silk', 'Tracked piece by piece on its Silk Mark tag'], ['Waiting list', 'Out of stock + a client who wants it = a demand record, not a lost sale']],
    fields: [['Design', 'name, collection, price, photos', 'product', ''], ['Piece', 'Silk Mark number, branch, owner', 'asset', 'Warranty and repairs follow the piece'], ['Waiting', 'client + design', 'demand', 'Alerts her Sales staff when stock lands']],
    failure: ['Receiving a shipment counts, tags and confirms — stock cannot quietly go wrong'],
    need: ['Which POS holds stock today, and whether it can send us changes'],
    screens: [['Inventory', '#/inventory/JBH'], ['Catalogue', '#/inventory/catalogue']] },
  targets: { title: 'Targets & campaigns', group: 'Core', status: 'demo',
    what: 'Targets set by the director for branches and by each store manager for their Sales staff, rolling up automatically — and the audiences that come out of the data, like every client who liked a Paithani in store and has not bought it.',
    connects: [['Levels', 'Brand → region → branch → Sales staff, with the daily pace needed'], ['Audiences', 'Built from real behaviour, not a list someone typed'], ['Guardrails', 'Marketing only reaches clients who agreed and have no open complaint']],
    fields: [['Target', 'level, month, value, set by', 'target', ''], ['Audience', 'liked in store, not bought', 'from visits', 'By collection']],
    failure: ['Allocating more than the branch target is allowed, but shown as a stretch'],
    need: ['This year\'s branch targets'],
    screens: [['Targets', '#/targets'], ['Campaign audience', '#/customers']] },

  // ---- connected systems
  whatsapp: { title: 'WhatsApp Cloud API', group: 'Connected systems', status: 'confirm',
    what: 'The pipe behind the brand number. Meta charges per conversation and only allows pre-approved templates outside the 24-hour window, so the system keeps a library of approved templates and picks the right one.',
    connects: [['Direction', 'Two-way'], ['Templates', '22 pre-installed — 13 service, 9 marketing'], ['Meta\'s rule', 'A service template must be about the client\'s own request; anything promotional is treated as marketing'], ['Coexistence', 'Staff can keep the WhatsApp Business app on the phone']],
    fields: [['Template', 'name, category, language, body', 'message_template', 'Approved by Meta before use'], ['Variables', '{{1}}, {{2}}…', 'filled from the client profile', 'Name, branch, order, date']],
    failure: ['A marketing template is blocked while a complaint is open or consent is missing', 'A template Meta re-categorises is flagged in the library'],
    need: ['Meta Business verification', 'The number ported to the Cloud API', 'Template approvals (usually minutes, up to 48 hours)'],
    screens: [['Template library', '#/settings/templates'], ['Connections', '#/settings/connections']] },
  pos: { title: 'Your POS / billing counter', group: 'Connected systems', status: 'input',
    what: 'We never replace the billing counter. The POS keeps billing; it tells us the moment a sale happens so the client\'s spend, tier, owned pieces and stock update in seconds — no end-of-day upload.',
    connects: [['Direction', 'Sales in, stock in'], ['Timing', 'Real time (webhooks or a small bridge). A nightly batch is a rejection criterion'], ['On the shop floor', 'The billing desk screen in this demo shows what the counter would bill']],
    fields: [['POS', 'bill number, amount, items, branch', 'order', ''], ['POS', 'customer mobile', 'links the sale to the client', 'Without it a sale is anonymous'], ['POS', 'stock movement', 'stock', '']],
    failure: ['A sale with no mobile number still counts for the branch, but cannot build the client\'s profile'],
    need: ['Which POS Vaarahi runs, its version, and whether it stores the customer mobile', 'Whether the vendor allows an API key or webhooks'],
    screens: [['Billing desk', '#/home'], ['Connections', '#/settings/connections']] },
  tally: { title: 'Tally bridge → TallyPrime', group: 'Connected systems', status: 'input',
    what: 'Tally stays the financial truth. A small program on the computer where Tally runs posts invoices and reads receipts and outstanding, so nobody types a bill twice.',
    connects: [['Why a bridge', 'Tally has no cloud API. It answers XML on port 9000 on the machine where it runs, and it is Windows-only'], ['Direction', 'Invoices out, receipts and outstanding in'], ['Timing', 'Every couple of minutes while Tally is open; a heartbeat says when it is closed'], ['Branches', 'One company file per branch, each mapped separately']],
    fields: [['Growth Engine', 'sale', 'Tally sales voucher', 'Written, queued if Tally is closed'], ['Tally', 'receipts, outstanding', 'client account', 'Read'], ['Tally', 'ledger name', 'client.tally_ledger', 'Mapping screen']],
    failure: ['Vouchers queue while Tally is closed and post when it reopens', 'A rejected voucher is shown with its reason, never silently dropped', 'Daily reconciliation: our totals and Tally must agree'],
    need: ['Tally edition and version, and which computer it runs on', 'The company name for each branch', 'Whether counter sales book to one "Cash Sales" ledger today'],
    screens: [['Connections', '#/settings/connections']] },
  gbp: { title: 'Google Business Profile', group: 'Connected systems', status: 'confirm',
    what: 'Reads reviews for all six branches and posts replies. The review is treated as a complaint channel, not a marketing metric.',
    connects: [['Direction', 'Two-way'], ['Scope', 'All six branch listings under one profile']],
    fields: [['Google', 'review, stars, time', 'grievance touchpoint', ''], ['Us', 'reply text', 'posted as the business', 'A person writes it']],
    failure: ['If access lapses, reviews still arrive by email alert and can be logged by hand'],
    need: ['Owner access to the Google Business Profile', 'API access approval from Google'],
    screens: [['Complaints', '#/grievances']] },
  meta_api: { title: 'Instagram & Facebook (Meta)', group: 'Connected systems', status: 'confirm',
    what: 'Page and Instagram messaging plus comments, so social enquiries and complaints sit in the same queues as WhatsApp.',
    connects: [['Direction', 'Two-way'], ['Needs', 'Meta app review with a screen recording']],
    fields: [['Instagram', 'DM, comment, mention', 'communication', '']],
    failure: ['Public comments are answered by a person, never automatically'],
    need: ['Page admin access', 'Meta app review'],
    screens: [['Complaints', '#/grievances']] },

  // ---- people & AI
  capture: { title: 'AI capture & approve', group: 'People & AI', status: 'demo',
    what: 'The only AI in Phase 1, and it never talks to a client on its own. It reads an incoming message, pulls out what she wants — colour, weave, occasion, budget, appointment — matches it to the catalogue and live stock, drafts a reply, and hands it to a person to approve.',
    connects: [['Input', 'WhatsApp, Instagram, a voice note, a quick update'], ['Output', 'Preferences, occasion, budget, a draft reply, a follow-up, a waiting-list entry'], ['Rule', 'Copilot, not autopilot — a human sends'], ['Complaints', 'A complaint detected inside a sales chat opens a case']],
    fields: [['Message', 'text', 'preferences, occasion, budget', 'Shown as chips you can untick'], ['Message', 'products mentioned', 'matched designs + stock', 'Real stock across six branches']],
    failure: ['Nothing reaches a client without approval', 'Low confidence still shows the message — a person decides'],
    need: ['An AI key on Vaarahi\'s own account (or run on ours in the pilot)'],
    screens: [['A captured message', () => `#/inbox/${D.story.capture_customer_id}`]] },
  floor_app: { title: 'Shop floor app', group: 'People & AI', status: 'demo',
    what: 'The phone layout used by allocation staff, consultants and the billing desk — one-handed, big targets, made for people standing with their hands full of sarees.',
    connects: [['Who', 'Allocation staff · consultants · billing'], ['Layout', 'App or Web, switched in the top bar — it is one web app either way'], ['Design rule', 'Any update must be finishable in under 30 seconds']],
    fields: [], failure: ['Consultants cannot create clients — that is the door\'s job, so the count of walk-ins stays true'],
    need: ['How many phones/tablets per branch'],
    screens: [['Walk-ins today', '#/home']] },
  sales_app: { title: 'Sales staff app', group: 'People & AI', status: 'demo',
    what: 'The back-office team on their phones: WhatsApp chats they own, today\'s follow-ups with the reason, appointments, their clients and their target.',
    connects: [['Who', 'Sales staff (the team you called the back office)'], ['Chat ownership', 'Each client\'s chat belongs to her Sales staff; others can reply and they are told']],
    fields: [], failure: ['A follow-up not done in 24 hours escalates to the manager'],
    need: [], screens: [['Sales staff home', '#/home'], ['WhatsApp', '#/inbox']] },
  portal: { title: 'Manager & director web', group: 'People & AI', status: 'demo',
    what: 'The bigger screen for the people who run the business: the store today, branch and Sales staff targets, complaints, inventory, the team chart and settings — roles, tiers, deadlines, templates, brand.',
    connects: [['Who', 'Store managers, regional heads, the two directors'], ['Same data', 'Nothing is a separate report — every number opens the records behind it'], ['Layout', 'Web or App, switched in the top bar']],
    fields: [], failure: ['Changing what a role can see applies immediately, everywhere'],
    need: ['The list of people and who reports to whom'],
    screens: [['The business today', '#/home'], ['Settings', '#/settings'], ['Team', '#/team']] },
  insights: { title: 'AI insights & next best action', group: 'Later phases', status: 'p2',
    what: 'Phase 2 and 3: who is likely to buy next and when, who is drifting away, which design to move to which branch, what to say to whom — each with the reason and the records behind it, plus copilots for each role.',
    connects: [['Builds on', 'The same data, nothing rebuilt'], ['Starts', 'After Phase 1 is signed off']],
    fields: [], failure: [], need: ['A year of sales history at go-live makes the first insights useful on day one'],
    screens: [] },
};

// ---------------------------------------------------------------- map geometry (viewBox 1240 × 800)
const N = {
  wa_in: [16, 96, 196, 44, 'WhatsApp', 'the brand number'], google: [16, 150, 196, 44, 'Google reviews', 'six branch listings'],
  meta: [16, 204, 196, 44, 'Instagram & Facebook', 'comments · DMs'], web: [16, 258, 196, 44, 'Website & catalogue', 'vaarahisilks.com'],
  walkin: [16, 312, 196, 44, 'Walk-in at the door', 'allocation staff'], call: [16, 366, 196, 44, 'Phone & counter', 'quick note · voice'],
  capture: [272, 212, 164, 64, 'AI capture', 'reads · matches · drafts'],
  core: [496, 104, 306, 470, 'Growth Engine core', ''],
  whatsapp: [944, 120, 280, 58, 'WhatsApp Cloud API', 'templates · 24-hour rule'], pos: [944, 208, 280, 58, 'Your POS / counter', 'sales · stock, in real time'],
  tally: [944, 296, 280, 58, 'Tally bridge → TallyPrime', 'agent on the Tally computer'], gbp: [944, 384, 280, 58, 'Google Business Profile', 'reviews ⇄ replies'],
  meta_api: [944, 472, 280, 58, 'Meta (IG / Facebook)', 'messages · comments'],
  floor_app: [496, 652, 228, 58, 'Shop floor app', 'allocation · consultant · billing'],
  sales_app: [752, 652, 208, 58, 'Sales staff app', 'chats · follow-ups'],
  portal: [988, 652, 236, 58, 'Manager & director web', 'targets · complaints · settings'],
  insights: [752, 744, 472, 48, 'Phase 2 · AI insights, next best action, copilots', ''],
};
// [id, path, label, lx, ly, twoWay, dashed, anchor]
const EDGES = [
  ['src', 'M212,118 H244 M212,172 H244 M212,226 H244 M212,280 H244 M212,334 H244 M212,388 H244 M244,118 V388 M244,244 H272', 'every channel, one front door', 244, 424],
  ['capture-core', 'M436,244 H496', 'a person approves', 444, 232, false, false, 'start'],
  ['core-whatsapp', 'M802,149 H944', 'messages ⇄ replies', 873, 139, true],
  ['core-pos', 'M802,237 H944', 'sales ⇄ stock', 873, 227, true],
  ['core-tally', 'M802,325 H944', 'invoices ⇄ receipts', 873, 315, true],
  ['core-gbp', 'M802,413 H944', 'reviews ⇄ replies', 873, 403, true],
  ['core-meta', 'M802,501 H944', 'comments ⇄ replies', 873, 491, true],
  ['core-floor', 'M560,574 V652', 'visits · shortlists', 566, 616, true, false, 'start'],
  ['core-sales', 'M700,574 V614 H856 V652', 'follow-ups · chats', 790, 606, true],
  ['core-portal', 'M802,556 H1106 V652', 'targets · reports', 960, 546, true],
  ['ai-p2', 'M988,710 V744', 'Phase 2 builds on it', 996, 732, false, true, 'start'],
];
const JOURNEYS = {
  none: { label: 'Whole system' },
  walkin: { label: 'Walk-in journey', nodes: ['walkin', 'core', 'floor', 'clients', 'pos', 'tally', 'floor_app', 'sales_app', 'targets'], edges: ['src', 'core-floor', 'core-pos', 'core-tally', 'core-sales'],
    steps: ['Allocation staff take her mobile at the door — a returning client fills herself in, with her family and what she liked last time',
      'She is handed to a consultant: whoever served her last time, then whoever is free',
      'The consultant shows pieces and marks each one Liked · Owns it · Buying · Said no',
      'Billing charges only the Buying pieces; the invoice goes to Tally and her collection, tier and the branch target update',
      'The pieces she liked but did not buy become a follow-up for her Sales staff today, and a campaign audience tomorrow'] },
  whatsapp: { label: 'WhatsApp enquiry', nodes: ['wa_in', 'capture', 'core', 'clients', 'pipeline', 'stock', 'whatsapp', 'sales_app'], edges: ['src', 'capture-core', 'core-whatsapp', 'core-sales'],
    steps: ['A client asks for a peacock-blue Kanchi pattu on the brand number',
      'AI reads it, pulls out colour, weave, occasion and budget, matches real designs and live stock across six branches, and drafts the reply',
      'Her Sales staff tap Approve — the reply goes from the brand number and everything is logged with no forms',
      'Out-of-stock pieces put her on the waiting list; a follow-up is set for tomorrow',
      'After 24 hours, WhatsApp only allows an approved template — the right one is offered automatically'] },
  complaint: { label: 'Complaint', nodes: ['wa_in', 'google', 'meta', 'core', 'grievance', 'gbp', 'whatsapp', 'portal'], edges: ['src', 'core-whatsapp', 'core-gbp', 'core-meta', 'core-portal'],
    steps: ['She complains on WhatsApp and leaves a 1-star Google review — both become one case, not two',
      'A deadline starts by severity; the store manager owns it, and it climbs to the regional head if the deadline passes',
      'Marketing to her stops automatically; service messages still go out',
      'Replies go back on each channel from inside the case — the public reply is short and moves it private',
      'Mark it resolved and her campaigns resume by themselves'] },
  sale: { label: 'One sale → many updates', nodes: ['pos', 'core', 'clients', 'stock', 'targets', 'tally', 'whatsapp', 'portal'], edges: ['core-pos', 'core-tally', 'core-whatsapp', 'core-portal'],
    steps: ['A sale is billed at the counter — at the till or on the billing desk screen',
      'Stock drops by one and the piece joins her collection with its Silk Mark tag and warranty',
      'Her 12-month spend and tier update; the branch and Sales staff targets move',
      'The invoice is queued to Tally; receipts and outstanding come back',
      'The manager is notified and a thank-you with the silk-care guide is drafted for approval'] },
};

function mapSVG(j) {
  const J = JOURNEYS[j] || JOURNEYS.none;
  const onN = id => J.nodes && J.nodes.includes(id), onE = id => J.edges && J.edges.includes(id);
  const sub = (x, w, label, yy, mods) => `<text class="grp" x="${x + 16}" y="${yy}">${label}</text>` +
    mods.map(([mid, mt, ms], i) => { const by = yy + 10 + i * 48;
      return `<a href="#/c/${mid}" class="nd sub ${onN(mid) ? 'on' : ''}" aria-label="${esc(mt)} — open details"><rect class="box" x="${x + 12}" y="${by}" width="${w - 24}" height="42" rx="10"/>
        <text class="t" x="${x + 24}" y="${by + 18}" style="font-size:12.5px">${esc(mt)}</text><text class="s" x="${x + 24}" y="${by + 33}" style="font-size:10.5px">${esc(ms)}</text></a>`; }).join('');
  const node = id => {
    const [x, y, w, h, t, s] = N[id], st = COMP[id].status;
    if (id === 'core') return `<g class="nd core ${onN(id) ? 'on' : ''}"><rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>
      <a href="#/c/core" aria-label="Growth Engine core — open details"><text class="t" x="${x + 16}" y="${y + 28}" style="font-size:15px">${esc(t)} ›</text></a>
      <text class="s" x="${x + 16}" y="${y + 45}">one client book · six branches · roles &amp; history</text>
      ${sub(x, w, 'THE CLIENT', y + 70, [['clients', 'Clients & families', 'tiers · birthdays · households'], ['floor', 'Visits & shortlists', 'liked · owns it · buying · said no'], ['pipeline', 'Pipeline & follow-ups', 'due today · this week · escalations']])}
      ${sub(x, w, 'RUNNING THE SHOP', y + 244, [['grievance', 'Grievance Cell', 'every channel · one case · pauses marketing'], ['stock', 'Catalogue, stock & waiting list', 'designs · pieces · Silk Mark'], ['targets', 'Targets & campaigns', 'brand → branch → person · audiences']])}</g>`;
    return `<a href="#/c/${id}" class="nd ${id === 'insights' ? 'p2' : ''} ${onN(id) ? 'on' : ''}" aria-label="${esc(t)} — open details">
      <rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>
      <text class="t" x="${x + 14}" y="${y + (h > 50 ? 25 : 19)}">${esc(t)}</text>${s ? `<text class="s" x="${x + 14}" y="${y + (h > 50 ? 43 : 35)}">${esc(s)}</text>` : ''}
      <circle class="dot ${STATUS[st][0]}" cx="${x + w - 13}" cy="${y + 13}" r="5"><title>${STATUS[st][1]}</title></circle></a>`;
  };
  const edge = ([id, d, label, lx, ly, two, dash, anchor]) => {
    const w = label.length * 5.5 + 10, x0 = anchor === 'start' ? lx - 4 : lx - w / 2;
    return `<g class="ed ${dash ? 'dash' : ''} ${onE(id) ? 'on' : ''}"><path d="${d}" marker-end="url(#ah)" ${two ? 'marker-start="url(#ahs)"' : ''}/>
      ${label ? `<rect class="lbl-bg" x="${x0}" y="${ly - 10}" width="${w}" height="14" rx="4"/><text x="${lx}" y="${ly}" text-anchor="${anchor || 'middle'}">${esc(label)}</text>` : ''}</g>`;
  };
  return `<svg viewBox="0 0 1240 800" class="mapsvg ${J.nodes ? 'hl' : ''}" role="img" aria-label="Vaarahi Silks system map: WhatsApp, Google reviews, Instagram, the website, walk-ins and phone calls all arrive through AI capture into the Growth Engine core, which syncs two-way with the WhatsApp Cloud API, the POS, Tally, Google Business Profile and Meta, and serves the shop floor app, the Sales staff app and the manager and director web.">
    <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L9,5 L0,9 z" fill="currentColor" opacity=".6"/></marker>
    <marker id="ahs" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10,1 L1,5 L10,9 z" fill="currentColor" opacity=".6"/></marker></defs>
    <text class="grp" x="16" y="78">WHERE CLIENTS COME FROM</text><text class="grp" x="944" y="102">CONNECTED SYSTEMS</text><text class="grp" x="496" y="636">WHO USES IT</text>
    ${EDGES.map(edge).join('')}${Object.keys(N).map(node).join('')}</svg>`;
}

const GROUPS = ['Where clients come from', 'Core', 'Connected systems', 'People & AI', 'Later phases'];
VIEWS.map = arg => {
  const j = JOURNEYS[arg] ? arg : 'none', J = JOURNEYS[j];
  return `<div class="stack">
    <div><div class="kicker">Vaarahi Silks · how the system fits together</div><h1>System map</h1>
      <p class="help" style="max-width:820px;margin-top:6px">Everything that feeds the client book, everything it feeds back, and who uses it. Tap any box to see what it does, what data moves, what can go wrong, what we still need from you — and to open the real screen in this demo.</p></div>
    <div class="row-flex" style="justify-content:space-between">
      <div class="tabs-inline" style="margin:0" role="tablist" aria-label="Highlight a journey">${Object.entries(JOURNEYS).map(([k, v]) => `<button role="tab" aria-selected="${k === j}" class="${k === j ? 'on' : ''}" data-act="journey" data-id="${k}">${esc(v.label)}</button>`).join('')}</div>
      <div class="chips">${['demo', 'input', 'confirm', 'p2'].map(k => `<span class="chip small">${sdot(k)} ${STATUS[k][1]}</span>`).join('')}</div>
    </div>
    <figure style="margin:0"><div class="card map-wrap">${mapSVG(j)}</div>
      <figcaption class="help" style="margin-top:8px">Arrows show which way the data moves; two heads mean it goes both ways. The dot on each box says how real it is today. On a phone, scroll the map sideways — or use the list below.</figcaption></figure>
    ${J.steps ? `<section class="card"><h3>${esc(J.label)}, step by step</h3><ol class="steps">${J.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>` : ''}
    ${GROUPS.map(g => `<section><h3 style="margin-bottom:12px">${g}</h3><div class="grid g3">${Object.entries(COMP).filter(([, c]) => c.group === g).map(([id, c]) =>
      `<a class="card comp" href="#/c/${id}"><b>${esc(c.title)}</b><div style="margin:8px 0">${statusBadge(c.status)}</div><div class="why">${esc(c.what.slice(0, 150))}…</div></a>`).join('')}</div></section>`).join('')}
  </div>`;
};
VIEWS.c = id => {
  const c = COMP[id];
  if (!c) return '<div class="empty">Not part of the map. <a href="#/map"><u>Back to the system map</u></a></div>';
  const href = h => typeof h === 'function' ? h() : h;
  return `<div class="stack">
    <a class="small muted" href="#/map">← System map</a>
    <div class="page-h" style="margin:0"><div><div class="kicker">${esc(c.group)}</div><h1>${esc(c.title)}</h1><div style="margin-top:8px">${statusBadge(c.status)}</div></div>
      <div class="row-flex">${c.screens.map(([l, h], i) => `<a class="btn ${i ? '' : 'primary'}" href="${href(h)}">Open: ${esc(l)} →</a>`).join('')}</div></div>
    <p style="font-size:15.5px;max-width:880px;margin:0">${esc(c.what)}</p>
    <div class="grid g2">
      <section class="card"><h3>How it connects</h3><dl class="kvl">${c.connects.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl></section>
      <div class="stack">
        ${c.need.length ? `<section class="card gold"><h3>What we need from Vaarahi</h3><ul class="clean">${c.need.map(n => `<li>${esc(n)}</li>`).join('')}</ul></section>` : ''}
        ${c.failure.length ? `<section class="card"><h3>When something goes wrong</h3><ul class="clean">${c.failure.map(n => `<li>${esc(n)}</li>`).join('')}</ul></section>` : ''}
      </div>
    </div>
    ${c.fields.length ? `<section class="card"><h3>What data moves</h3><div style="overflow-x:auto"><table class="t" style="margin-top:10px"><tr><th>From</th><th>Their field</th><th>Here it becomes</th><th>Note</th></tr>
      ${c.fields.map(r => `<tr>${r.map((x, i) => `<td>${i === 1 || i === 2 ? `<code>${esc(x)}</code>` : esc(x)}</td>`).join('')}</tr>`).join('')}</table></div></section>` : ''}
  </div>`;
};
ACTIONS.journey = k => { location.hash = k === 'none' ? '#/map' : `#/map/${k}`; };
render();
