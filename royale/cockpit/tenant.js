/* The tenant profile. EVERYTHING that makes this cockpit Royale's rather than
   another gifting company's lives here — name, colours, people, stage names,
   lost reasons, compliance switches, agent defaults. A second client is a
   second copy of this file; nothing else changes. Settings -> Business profile
   overrides any of it at runtime, stored in the console's own store. */
(function (root) {
  'use strict';

  var T = {
    slug: 'royale',
    name: 'Royale Collections',
    tagline: 'Corporate gifting since 2004',
    city: 'Malad (W), Mumbai',
    gstin: '27AAAPJ0000A1Z5',              // illustrative — replaced at onboarding
    whatsapp: '90220 00000',
    email: 'sales@royalecollections.in',     // illustrative
    brand: '#3D2F86',                        // the purple the discovery portal already runs on
    accent: '#C6F432',
    logoText: 'Royale',
    currency: 'INR',

    /* Sales board. Seven rungs, gifting vocabulary. Stages from "Options sent"
       on are about specific products, so they need something in play. */
    stages: ['Enquiry', 'Brief captured', 'Options sent', 'Sampling', 'Quote sent', 'Negotiating', 'PO received'],
    stageHelp: {
      'Enquiry':        'Just arrived. Nobody has read it properly yet.',
      'Brief captured': 'We know the occasion, quantity, budget and deadline.',
      'Options sent':   'A curated shortlist has gone to the client.',
      'Sampling':       'Physical samples requested, sent or with the client.',
      'Quote sent':     'A priced, GST-inclusive quote is with the client.',
      'Negotiating':    'Talking price, quantity or branding on specific products.',
      'PO received':    'Purchase order in hand. Close it as won to open the order.',
      'Won':            'Order opened. It lives on the Orders board now.',
      'Lost':           'Gone elsewhere, or gone quiet for good.'
    },
    needsItem: ['Options sent', 'Sampling', 'Quote sent', 'Negotiating', 'PO received'],
    lostReasons: ['Price too high', 'Timeline could not be met', 'Went with another vendor',
                  'Budget cut or event cancelled', 'No response from client', 'Product not available'],

    /* The second board. Different people do this work, after the money. */
    orderStages: ['PO received', 'Vendor POs placed', 'Goods in & QC', 'Branding', 'Kitting & packing',
                  'Dispatched', 'Delivered', 'Invoiced', 'Paid'],
    orderHelp: {
      'PO received':       'Client PO logged. Nothing ordered from vendors yet.',
      'Vendor POs placed': 'Every line has a vendor PO with a promised date.',
      'Goods in & QC':     'Stock arriving at the warehouse and being checked.',
      'Branding':          'Logo printing, engraving or embroidery under way. Needs approved artwork.',
      'Kitting & packing': 'Assembling kits, gift wrap, cards, per-recipient packing.',
      'Dispatched':        'On its way — one or many delivery locations.',
      'Delivered':         'Every location has received its consignment.',
      'Invoiced':          'Tax invoice raised.',
      'Paid':              'Money received. Order complete.'
    },

    /* Most enquiries arrive by phone, so it comes first everywhere a source is picked. */
    sources: { phone: 'Phone call', whatsapp: 'WhatsApp', email: 'Email', walkin: 'Walk-in', website: 'Website form', indiamart: 'IndiaMART',
               tradeindia: 'TradeIndia', referral: 'Referral', expo: 'Gifts World Expo', repeat: 'Repeat client',
               linkedin: 'LinkedIn' },

    /* ONE word per thing, in the words this business uses. Applied to every
       rendered screen (text only, never attributes or what someone is typing),
       so internal and engineering words never reach the staff. Longest first.
       Each entry: [what the code says, what the person reads]. */
    words: [
      ['Curator agent', 'Product finder'], ['Order-watch agent', 'Delivery checker'], ['Proposal agent', 'Quote writer'],
      ['New requirement', 'New enquiry'], ['Open requirement', 'Save enquiry'],
      ['requirements', 'enquiries'], ['requirement', 'enquiry'], ['opportunities', 'enquiries'], ['opportunity', 'enquiry'],
      ['Open reqs', 'Open enquiries'], ['reqs', 'enquiries'],
      ['Deals with nothing booked', 'Enquiries with nothing booked'], ['deals', 'enquiries'], ['deal', 'enquiry'],
      ['the Agent Desk', 'Assistants'], ['Agent Desk', 'Assistants'], ['The team of agents', 'Your assistants'],
      ['agent proposals', 'drafts for your OK'], ['agent proposal', 'draft for your OK'], ['proposals', 'drafts'], ['proposal', 'draft'],
      ['Waiting for your approval', 'Needs your OK'], ['Waiting for you', 'Needs your OK'],
      ['agents', 'assistants'], ['agent', 'assistant'],
      ['Ask the Curator', 'Find products'], ['the Curator', 'the product finder'], ['Curator', 'Product finder'],
      ['Run Order watch', 'Check deliveries'], ['Order-watch', 'Delivery checker'], ['Order watch', 'Delivery checker'],
      ['Run the sweep now', 'Check everything now'], ['sweep', 'check'],
      ['Agent runs', 'Assistant work'],
      ['Autonomy', 'Works alone?'], ['dry run', 'test'], ['Confidence', 'How sure'],
      ['Price-list intake', 'Read a price list'], ['Vendor intake agent', 'Price-list reader'], ['Vendor intake', 'Price-list reader'],
      ['Sealed RFQs', 'Sealed price requests'], ['Sealed RFQ', 'Sealed price request'], ['Open RFQs', 'Open price requests'], ['RFQs', 'price requests'], ['RFQ', 'price request'],
      ['Reverse auction', 'Live bidding'], ['R1 low', 'Round 1 lowest'],
      ['GRN', 'goods received'], ['Goods in & QC', 'Goods in and quality check'], ['QC passed', 'quality check passed'], ['QC', 'quality check'],
      ['AWB', 'tracking number'], ['UCPMP-safe', 'safe for doctors'], ['UCPMP', 'doctor gift rule'],
      ['window too short', 'date range too short'], ['in window', 'in this date range'], ['window', 'date range'],
      ['Pipeline value', 'Enquiry value'], ['the Pipeline', 'Enquiries'], ['Pipelines', 'Stages'], ['Pipeline', 'Enquiries'],
      ['Log a conversation', 'Log follow-up'], ['Log a call', 'Log follow-up'], ['Conversations', 'Conversation'],
      ['Note score', 'Note quality'], [' — ', ', '], ['tenant', 'business'], ['in play', 'chosen'], ['Discover', 'Products']
    ],

    roles: {
      owner:    { label: 'Owner / COO',          short: 'Owner' },
      head:     { label: 'Sales Head',           short: 'Sales Head' },
      am:       { label: 'Account Manager',      short: 'Account Mgr' },
      sourcing: { label: 'Sourcing',             short: 'Sourcing' },
      ops:      { label: 'Production & Dispatch', short: 'Ops' },
      accounts: { label: 'Accounts',             short: 'Accounts' }
    },

    /* Sample people. The owner is the real contact; everyone else is fictional
       and labelled as sample data in the UI. */
    staff: [
      { id: 'u1', login: 'sagar',    pass: 'royale26', name: 'Sagar Jaisinghani', role: 'owner',    branch: 'b1', mobile: '90220 •••••', email: 'owner@royalecollections.in', joined: '2012-04-01' },
      { id: 'u2', login: 'priya',    pass: 'royale26', name: 'Priya Mehta',       role: 'head',     branch: 'b1', mobile: '9820011223', email: 'priya@example.in',  joined: '2019-06-10' },
      { id: 'u3', login: 'rohan',    pass: 'royale26', name: 'Rohan Shah',        role: 'am',       branch: 'b1', mobile: '9819022334', email: 'rohan@example.in',  joined: '2022-01-17' },
      { id: 'u4', login: 'neha',     pass: 'royale26', name: 'Neha Kapoor',       role: 'am',       branch: 'b2', mobile: '9833044556', email: 'neha@example.in',   joined: '2023-08-01' },
      { id: 'u5', login: 'imran',    pass: 'royale26', name: 'Imran Qureshi',     role: 'sourcing', branch: 'b1', mobile: '9867055667', email: 'imran@example.in',  joined: '2020-11-02' },
      { id: 'u6', login: 'deepak',   pass: 'royale26', name: 'Deepak Patil',      role: 'ops',      branch: 'b1', mobile: '9892066778', email: 'deepak@example.in', joined: '2018-03-12' },
      { id: 'u7', login: 'kavita',   pass: 'royale26', name: 'Kavita Rao',        role: 'accounts', branch: 'b1', mobile: '9870077889', email: 'kavita@example.in', joined: '2021-05-24' }
    ],
    branches: [
      { id: 'b1', name: 'Malad (W) — HQ', address: 'Malad Industrial Estate, Malad (W), Mumbai 400064', target: { orders: 14, value: 4500000 } },
      { id: 'b2', name: 'Pune desk',      address: 'Baner, Pune 411045 (illustrative)',                 target: { orders: 5,  value: 1500000 } }
    ],
    warehouses: [
      { id: 'w1', name: 'Malad sample room', kind: 'samples' },
      { id: 'w2', name: 'Bhiwandi warehouse', kind: 'stock' }
    ],

    /* Compliance and money rules. Every one is editable in Settings. */
    rules: {
      ucpmpCap: 1000,          // UCPMP 2024: max value of a gift to a healthcare professional
      marginFloor: 18,         // % — a quote below this needs the owner
      quoteStaleDays: 5,       // "quote unanswered" after this many days
      reorderLeadDays: 45,     // how early the reorder agent wakes before last year's date
      bufferDays: 3,           // a vendor date inside this many days of the client deadline is "at risk"
      vipApproval: true        // anything to a Strategic account waits for a person
    },
    tiers: { strategic: 2500000, key: 800000 },   // 12-month spend, ₹

    /* Agents: off | suggest | auto. Client-facing steps ALWAYS wait for a
       person, whatever this says — auto only covers internal steps. */
    agents: { brief: 'auto', curator: 'suggest', proposal: 'suggest', sourcing: 'suggest', intake: 'suggest',
              followup: 'suggest', orderwatch: 'auto', compliance: 'auto', reorder: 'suggest', morning: 'auto' },

    targets: { u3: { orders: 5, value: 1800000 }, u4: { orders: 4, value: 1200000 }, u2: { orders: 3, value: 1500000 } }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = T;
  else root.TENANT = T;
})(typeof self !== 'undefined' ? self : this);
