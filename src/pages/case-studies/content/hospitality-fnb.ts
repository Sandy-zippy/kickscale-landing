import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: 'Independent cafes and 2-5 outlet restaurant groups (₹60L-8Cr revenue) drowning in Instagram DMs, WhatsApp reservation requests, paper diaries, and Zomato + Swiggy reconciliation',
    whatBroke: '47 unread Instagram DMs each Wednesday morning, 11 of them reservation requests. Friday tables double-booked at the table. Daily stock check across 3 WhatsApp groups eats 45 min. Month-end Zomato + Swiggy + POS reconciliation eats 2 days. Repeat customers detected only by owner memory. Birthdays never captured.',
    whatWeBuilt: 'GHL central reservation inbox (IG + WhatsApp + phone consolidated) + WABA + n8n workflows (IG Graph API webhook, stock-group classifier, Zomato + Swiggy nightly CSV ingest with variance flag) + POS webhook (Petpooja or Posist) for repeat detection and CLV + Google Business Profile auto-reply + Weekly Monday digest',
    whatChanged: 'Target: Zomato reconciliation from 2 days to 90 minutes, double-bookings eliminated, repeat customers automatically detected with CLV scoring, birthdays captured and celebrated, IG DM response under 5 min, marketing ROI finally visible',
  },
  icpSnapshot: {
    revenue: '₹60L - ₹8Cr (independent cafes, casual-dining restaurants, 2-5 outlet groups)',
    team: 'Founder + 1-2 floor managers + 18-55 service staff + chef + accountant',
    geography: 'Hyderabad (Jubilee Hills, Banjara Hills, Madhapur), Bangalore (Indiranagar, Koramangala), Pune (Koregaon Park, Kalyani Nagar)',
    currentStack: [
      'Instagram DMs as primary discovery channel',
      '2-3 WhatsApp groups (kitchen, floor, ops)',
      'Petpooja or Posist POS',
      'Zomato + Swiggy aggregator dashboards',
      'Paper reservation diary at hostess desk',
      'Tally for accounts (entered by an external CA monthly)',
    ],
  },
  painNarrative: `Wednesday 8 AM. Owner opens Instagram. 47 unread DMs. 11 are reservation requests. 8 are "do you take walk-ins for 6 on Friday?" 6 are influencer pitches. The rest are stories shared back, fan messages, and a complaint about cold pasta last weekend. She replies to the urgent ones. The other 30+ wait until Saturday.

Hostess desk runs on a leather-bound paper diary, two WhatsApp Business numbers, and a landline that still rings. Reservations come in via all three. Friday night: a couple shows up at 8:15 for a 4-top, the table was given to a corporate group at 8 because nobody cross-checked the WhatsApp number against the paper diary.

Daily stock: the chef WhatsApps the sous-chef about chicken count, the floor manager WhatsApps the bar about gin stock, the ops manager WhatsApps the kitchen about tomato. 45 minutes of scrolling 3 different group chats every morning to figure out what is short.

Month-end. Zomato dashboard exports CSV. Swiggy dashboard exports CSV. POS exports CSV. Bank statement comes from accounts. Reconciliation: 2 full days, sometimes 3 if a Zomato adjustment happened. The accountant flags a ₹40K variance that he eventually traces to a discount campaign nobody told him about.

Repeat customers: detected only by the owner\'s memory and floor manager\'s knack. "That couple who comes every Saturday" is real, but if they skip 3 weeks nobody flags it. Birthdays mentioned in passing on the table never get captured. Marketing spends ₹45K/month on Meta + Instagram with zero attribution back to actual table revenue.

The owner does not need a Dineout-style aggregator. She tried, the platform shut down. She wants the predictable 80% (reservations from one inbox, stock alerts in one place, Zomato + Swiggy reconciliation auto, repeat customer detection, birthday capture) handled so the floor manager can run the floor instead of scrolling DMs.`,
  painQuotes: [
    { quote: 'My 4-top got given away to a corporate party because nobody cross-checked the WhatsApp.', attribution: 'Restaurant owner, Banjara Hills' },
    { quote: 'Two days every month-end. Sometimes three. For Zomato reconciliation alone.', attribution: 'Cafe founder, Indiranagar' },
    { quote: 'I spend ₹45K/month on Meta. Zero idea if any of it shows up at a table.', attribution: 'F&B founder on attribution, Koregaon Park' },
  ],
  beforeStateSteps: [
    { step: 'Reservation requests land across IG DM, 2 WhatsApp numbers, landline, paper diary', timeCost: 'No central capture' },
    { step: 'Hostess manually checks each channel against paper diary every hour', timeCost: '~1 hr/shift' },
    { step: 'Double-booking caught at the table on busy nights', timeCost: '2-4 incidents/month' },
    { step: 'Daily stock check across 3 WhatsApp groups by ops/chef/floor', timeCost: '45 min daily' },
    { step: 'Zomato + Swiggy + POS reconciliation at month-end via CSV exports', timeCost: '2-3 days at month-end' },
    { step: 'Aggregator discount campaigns not communicated to accountant', timeCost: '₹30-50K variance per month' },
    { step: 'Repeat customers detected by owner memory and floor manager knack', timeCost: 'Lapsed regulars never reactivated' },
    { step: 'Birthdays mentioned at table never captured', timeCost: 'Zero birthday touch revenue' },
    { step: 'IG DM response time slips to 24-72 hours on busy weekends', timeCost: 'Lost reservation conversion' },
    { step: 'Meta + IG ad spend has zero attribution back to actual table revenue', timeCost: '₹45K/month flying blind' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'Sub-account with Hospitality tag. Custom fields: party_size, occasion, dietary_pref, last_visit_date, total_visits, CLV, birthday, anniversary, preferred_table. Pipeline: Inquiry → Reservation Confirmed → Seated → Visited → Repeat → VIP → Lapsed.',
    },
    {
      name: 'WhatsApp Business API + IG inbox',
      role: 'Messaging',
      description: 'Single inbound brand WABA + Instagram DM via Graph API webhook. All reservation requests land in one GHL inbox. 8 templates: reservation ack, T-24h confirm, T-2h see-you-tonight, post-visit thank you + review ask, birthday touch, lapsed reactivation, walk-in waitlist, special-event invite.',
    },
    {
      name: 'AI reservation agent',
      role: 'AI',
      description: 'First-touch on IG and WhatsApp within 60 seconds. Captures party size, date, time, dietary preferences, occasion. Holds slot, confirms with hostess, sends T-24h and T-2h reminders. Hands off on group bookings or special requests.',
    },
    {
      name: 'Stock-group classifier',
      role: 'Automation',
      description: 'n8n watches all 3 ops WhatsApp groups. Auto-classifies messages by SKU category (kitchen, bar, dry stock). Pushes to a single shared stock dashboard. Flags low-stock alerts to the right person automatically. Cuts the 45-min morning scroll to a 3-min digest.',
    },
    {
      name: 'Zomato + Swiggy nightly ingest',
      role: 'Automation',
      description: 'n8n logs into Zomato + Swiggy partner portals nightly, downloads sales + payout reports, matches against POS (Petpooja or Posist) order log, flags variances over ₹500 per day. Cuts month-end aggregator reconciliation from 2 days to 90 minutes.',
    },
    {
      name: 'POS webhook (Petpooja / Posist)',
      role: 'Automation',
      description: 'Every closed bill webhooks to GHL with phone number, total, items, table number. Auto-updates customer record with last visit + total visits + CLV. Repeat customer detection happens silently in the background, no manual entry by hostess or floor manager.',
    },
    {
      name: 'Google Business Profile auto-reply',
      role: 'Messaging',
      description: 'Auto-respond to GBP reviews and questions in your tone. Flag negative reviews to owner for personal reply within 1 hour. Cuts the "saw a 1-star review on Sunday morning" panic.',
    },
    {
      name: 'Owner Monday digest',
      role: 'Analytics',
      description: 'Single WhatsApp at 10 AM Monday: last week\'s covers + revenue, top 5 dishes, repeat customer count, lapsed VIPs to reactivate, birthdays this week, Zomato + Swiggy variance flags, Meta + IG ad spend vs attributed bookings.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + POS + Aggregator Audit',
      deliverables: [
        'Half-day shadow at hostess desk + ops manager + chef',
        'POS export audit (Petpooja or Posist customer + sales data)',
        'Zomato + Swiggy partner portal access + CSV format check',
        'Provision GHL sub-account + WABA on brand number + IG Graph API connection',
        'Draft 8 WhatsApp templates and submit to Meta',
      ],
    },
    {
      week: 2,
      title: 'Unified Inbox + Reservation Agent',
      deliverables: [
        'IG DM + WhatsApp + landline (call log) unified inbox',
        'AI reservation agent live with party-size and occasion capture',
        'T-24h and T-2h confirmation WhatsApp templates approved and live',
        'Hostess shared inbox training',
      ],
    },
    {
      week: 3,
      title: 'POS Bridge + Stock + Aggregator Recon',
      deliverables: [
        'Petpooja or Posist webhook to GHL for repeat detection + CLV',
        'Stock-group classifier across 3 ops WhatsApp groups',
        'Zomato + Swiggy nightly ingest + variance flag',
        'Birthday and anniversary capture from POS table notes',
      ],
    },
    {
      week: 4,
      title: 'GBP + Marketing Attribution + Handover',
      deliverables: [
        'Google Business Profile auto-reply with negative-review escalation',
        'Meta + IG ad attribution to table bookings via UTM + phone match',
        'Owner Monday 10 AM WhatsApp digest',
        'Looker dashboard: covers, revenue, repeat rate, CLV, marketing ROI',
        'Documented SOPs',
        '90-min team training (hostess + floor manager + chef + ops + owner)',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Zomato + Swiggy reconciliation', before: '2 days', after: '90 minutes', caveat: 'Target range, nightly ingest + variance' },
    { metric: 'Double-booking incidents', before: '2-4/month', after: 'Under 1/quarter', caveat: 'Single inbox + auto hold' },
    { metric: 'IG DM response time', before: '24-72 hrs', after: 'Under 5 min', caveat: 'AI reservation agent' },
    { metric: 'Daily stock check', before: '45 min scroll', after: '3 min digest', caveat: 'Stock-group classifier' },
    { metric: 'Repeat customer detection', before: 'Owner memory only', after: '100% via POS webhook', caveat: 'Silent capture' },
    { metric: 'Birthday touch revenue', before: '₹0', after: '₹15-30K/month', caveat: 'Birthday capture + auto-touch' },
    { metric: 'Marketing attribution', before: 'Blind', after: 'Booking-level visible', caveat: 'UTM + phone match' },
  ],
  objections: [
    {
      objection: 'My hostess will resist anything that is not the paper diary.',
      rebuttal: 'The paper diary stays as her personal backup. The shared inbox runs in parallel. Within 2 weeks she sees that the inbox auto-confirms reservations, sends T-24h reminders, and never loses a booking. She converts on her own. We do not force the change.',
    },
    {
      objection: 'I tried Dineout. Eatigo. Both shut down.',
      rebuttal: 'Those were aggregator platforms that owned your customer. We are infrastructure that you own, integrated with your existing POS and aggregator portals. If we ever shut down, you keep your customer database, your CRM, your automations. Zero platform-risk.',
    },
    {
      objection: 'My floor staff cannot adopt new tech.',
      rebuttal: 'Nothing changes for waiters or cooks. The shared inbox is for the hostess and floor manager only. The POS webhook is invisible (Petpooja or Posist do all the work). Stock-group classifier reads the WhatsApp groups your team already uses. Floor adoption is automatic because nobody on the floor changes their workflow.',
    },
    {
      objection: 'Petpooja CRM addon already exists. Why not that?',
      rebuttal: 'Petpooja CRM gives you a customer database, not workflows. It does not unify IG DMs, it does not auto-reconcile Zomato + Swiggy, it does not run birthday touches. We sit on top of Petpooja via webhook. You keep Petpooja for billing and inventory, you gain the marketing + reservation + reconciliation layer Petpooja does not solve.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: 'Save 2 days/month of accountant + owner time on aggregator reconciliation = ₹20-30K. Capture ₹15-30K/month of birthday and lapsed reactivation revenue. Cut 2 double-bookings/month at ₹3-5K each. Sprint payback inside 3-4 months on most cafes. We split 50/50 (Week 0 / Week 4) if cash is tight.',
    },
  ],
  faqs: [
    {
      question: 'Will this work with Petpooja, Posist, or both?',
      answer: 'Both, plus most major Indian F&B POS systems. We integrate via webhook so closed bills push to GHL with customer phone, total, items, table. Customer record updates with last visit + total visits + CLV silently in the background.',
    },
    {
      question: 'My Instagram is the main reservation channel. How does the IG integration work?',
      answer: 'Via Instagram Graph API. We need your IG account connected to a Facebook Business Page. Then DMs flow into the unified GHL inbox in real time. AI agent first-touches in 60 seconds. Hostess only sees the asks that need a human. Existing chat history is preserved.',
    },
    {
      question: 'Can the AI reservation agent handle group bookings or special occasions?',
      answer: 'It captures the request and confirms party size, date, time. For groups over 8 or special-occasion asks (anniversary, surprise, dietary), it hands off to the hostess with full context already captured. The hostess just confirms or negotiates the slot.',
    },
    {
      question: 'How do you handle Zomato + Swiggy reconciliation reliably?',
      answer: 'n8n logs into both partner portals nightly via Playwright (your credentials, your session), downloads sales + payout reports, matches each line against the POS order log. Variances over ₹500/day get flagged. Most months you go from 2-day reconciliation to 90 minutes of reviewing flagged items.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all WABA + IG template approvals, AI reservation agent, POS webhook integration, stock-group classifier, Zomato + Swiggy nightly ingest, GBP auto-reply, Meta + IG attribution, owner dashboard, team training, and 30-day hypercare. Recurring is ₹16K/month for WABA hosting, GHL, AI inference, n8n hosting, and email infra.',
    },
    {
      question: 'Have you done this for a cafe or restaurant before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in hospitality, D2C, and services. The F&B-specific pieces (POS webhook, Zomato + Swiggy reconciliation, stock-group classifier, IG reservation agent) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR outlet before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of 47 unread IG DMs vs unified GHL inbox at zero unread',
    'Visual of the 7-stage reservation pipeline from inquiry to lapsed',
    'WhatsApp + IG template gallery: reservation ack, T-24h, post-visit, birthday, lapsed reactivation',
    'n8n workflow: Zomato + Swiggy partner portal nightly ingest with variance flag',
    'POS webhook flow: Petpooja closed bill to GHL customer record',
    'Sample owner Monday 10 AM digest with covers, revenue, attribution',
  ],
  downloads: [
    {
      label: 'F&B WABA + IG template pack (8 templates)',
      href: '/case-studies/downloads/hospitality-fnb-reservations-loyalty-stack/templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n Zomato + Swiggy reconciliation workflow JSON',
      href: '/case-studies/downloads/hospitality-fnb-reservations-loyalty-stack/n8n-aggregator-recon.json',
      filetype: 'json',
    },
    {
      label: 'Customer master with CLV + birthday template',
      href: '/case-studies/downloads/hospitality-fnb-reservations-loyalty-stack/customer-master.csv',
      filetype: 'csv',
    },
  ],
}
