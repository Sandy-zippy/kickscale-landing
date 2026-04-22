import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: 'Hyderabad and Bangalore corporate travel agencies (₹1.5-10Cr revenue) serving 40-120 corporate accounts, bleeding deals to faster competitors and losing 8 days/month to vendor reconciliation',
    whatBroke: 'Shared bookings@ inbox with 87 unread, 3 agents replying separately to the same RFQ, 30 min per quote across GDS + hotel + Word + email, 12-hour delays on RFQ response, 8-hour Tally reconciliation monthly, vendor rebates never chased, P&L arrives day 8, Friday partner reports done manually',
    whatWeBuilt: 'GHL quote pipeline with auto round-robin assignment + n8n IMAP parser on shared inbox + branded Puppeteer-rendered quote PDF generator + WABA delivery to corporate admin + Tally connector via ODBC nightly + vendor portal scrapers in n8n + per-account P&L generator + Monday upstream-partner digest',
    whatChanged: 'Target: quote turnaround from 36 hours to 4 hours, P&L visible day 2 not day 8, Tally reconciliation from 8 hrs/month to 90 minutes, vendor rebates auto-chased, no two agents ever quote the same RFQ',
  },
  icpSnapshot: {
    revenue: '₹1.5Cr - ₹10Cr (corporate travel, MICE, leisure with corporate desk)',
    team: 'Founder + 2 senior agents + 3-5 junior agents + 1 accountant',
    geography: 'Hyderabad, Bangalore, Chennai, Pune, Mumbai',
    currentStack: [
      'Shared Gmail (bookings@, ops@)',
      'Tally ERP 9 (occasionally Tally Prime)',
      'Amadeus, Sabre, or Galileo GDS',
      'Excel for quotes + P&L',
      'Vendor portals: IndiGo Corporate, Marriott, Accor, Vistara Connect',
    ],
  },
  painNarrative: `Monday 9 AM. The shared bookings@ inbox shows 87 unread emails. Three agents log in. Each starts replying to whatever they see first. Two agents reply to the same RFQ (a Hyderabad pharma client wanting a Mumbai-Bangalore-Chennai triangle for 4 execs). Different fares, slightly different hotels. Client wobbles. Both agents lose face.

Each quote takes 30 minutes: pull GDS fares, check hotel rates on 2 portals, calculate margin, paste into Word, email. Negotiation: 4-6 emails per booking. By the time the quote goes out, 12 hours have passed. The faster competitor sent theirs in 90 minutes.

Month-end. Accountant pulls invoices from 5 vendor portals (IndiGo, Marriott, Accor, Vistara, Yatra Corporate), 4 hours. Tally reconciliation: 8 hours, manual entry of every invoice plus margin entries. Per-account P&L: 12 hours of pivot tables. By day 8 of the next month the founder finally sees who his profitable customers were last month.

Friday afternoons: the upstream airline-partner reporting (IndiGo Corporate, Vistara Connect) demands a manual Excel upload of the week\'s bookings for partner-rebate calculation. 90 minutes weekly. Sometimes the agent forgets and the rebate never comes.

The founder does not need a Travelopro CRM. He tried, the team rebelled. He needs the predictable 80% (RFQ assignment, quote PDF generation, Tally bridge, vendor invoice scraping, P&L automation) handled so his agents focus on the 20% that wins deals: the negotiation and the relationship.`,
  painQuotes: [
    { quote: 'Two of my agents replied to the same RFQ with different fares. Client lost trust.', attribution: 'Travel agency founder, Hyderabad' },
    { quote: 'P&L by day 8 of next month. Decisions get made on stale data.', attribution: 'Corporate travel owner, Bangalore' },
    { quote: 'My agent forgot the IndiGo weekly upload. We lost the rebate. ₹40K. Per quarter.', attribution: 'Travel agency founder on partner reporting, Chennai' },
  ],
  beforeStateSteps: [
    { step: 'Shared bookings@ inbox accumulates RFQs across 3 agents with no assignment', timeCost: 'Two agents quote same RFQ ~1x/week' },
    { step: 'Each agent pulls GDS fares + hotel rates manually', timeCost: '~20 min per quote' },
    { step: 'Quote built in Word with margin calculation, emailed', timeCost: '~10 min per quote' },
    { step: 'Negotiation by email thread, no version control on terms', timeCost: '4-6 emails per booking' },
    { step: 'Total quote turnaround time', timeCost: '12-36 hrs' },
    { step: 'Vendor invoices pulled from 5 portals at month-end', timeCost: '4 hrs at month-end' },
    { step: 'Tally reconciliation: invoice entry + margin entry, manual', timeCost: '8 hrs at month-end' },
    { step: 'Per-account P&L pivot in Excel', timeCost: '12 hrs at month-end' },
    { step: 'Friday upstream airline-partner reports manual', timeCost: '90 min weekly, sometimes skipped' },
    { step: 'Vendor rebates not chased, claim window expires', timeCost: '₹40K+/quarter unclaimed' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'Travel-tagged sub-account. Each RFQ carries corporate account, contract type, RFQ value, margin %, vendor partner, GDS PNR, and ticket number. Pipeline: New RFQ → Quoted → Negotiation → Confirmed → Ticketed → Travelled → Invoiced → Paid → Closed.',
    },
    {
      name: 'WhatsApp Business API + Email parser',
      role: 'Messaging',
      description: 'WABA on agency number for direct corporate-admin chat. n8n IMAP parser on shared bookings@ inbox auto-creates GHL opportunity per RFQ, auto-assigns to next agent in round-robin. Locks the RFQ to one agent so two agents never quote same client.',
    },
    {
      name: 'AI quote drafter',
      role: 'AI',
      description: 'Reads RFQ email, parses dates + cities + class + corporate-rate-card, queries GDS via API for top 3 fares, queries hotel partner APIs for top 3 stays, applies your margin matrix, drafts a branded quote PDF in 5 minutes. Agent reviews, sends in 4 hours total instead of 36.',
    },
    {
      name: 'Branded quote PDF generator',
      role: 'Automation',
      description: 'Puppeteer-rendered PDF with agency logo, T&C, service-level commitments. Versioned in GHL. Sent via WABA to corporate admin. Replaces the Word document email-attachment workflow.',
    },
    {
      name: 'Tally bridge',
      role: 'ERP',
      description: 'n8n + ODBC nightly sync to Tally ERP 9 or Tally Prime. Confirmed bookings push as draft sales invoices with vendor-cost + margin entries. Accountant approves in his existing Tally screen. Cuts month-end reconciliation from 8 hours to 90 minutes.',
    },
    {
      name: 'Vendor portal scrapers',
      role: 'Automation',
      description: 'Playwright in n8n. Logs into IndiGo Corporate, Vistara Connect, Marriott Bonvoy, Accor partner portal nightly with your credentials. Downloads invoices, posts to GHL booking record + Drive folder, sets reminder for vendor rebate claim.',
    },
    {
      name: 'Per-account P&L generator',
      role: 'Analytics',
      description: 'Daily roll-up by corporate account: revenue, vendor cost, margin, attached deliverables. Founder sees P&L by day 2, not day 8 of next month. Looker Studio dashboard for trend view across accounts.',
    },
    {
      name: 'Monday upstream-partner digest',
      role: 'Automation',
      description: 'Auto-generates the weekly IndiGo + Vistara + Marriott rebate-claim Excel from confirmed bookings. Agent reviews and one-tap-uploads via portal. No more forgotten Friday afternoon uploads.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + GDS + Tally Audit',
      deliverables: [
        'Half-day shadow at agent desks + accountant desk',
        'Corporate account master with rate cards + contracted margins',
        'GDS API access audit (Amadeus, Sabre, or Galileo)',
        'Vendor portal credentials inventory (IndiGo, Vistara, Marriott, Accor)',
        'Provision GHL sub-account + WABA on agency number',
        'Draft 8 WhatsApp templates and submit to Meta',
      ],
    },
    {
      week: 2,
      title: 'RFQ Capture + Quote Drafter',
      deliverables: [
        'n8n IMAP parser on shared bookings@ inbox with round-robin assignment',
        'AI quote drafter live with GDS + hotel API integration',
        'Branded quote PDF generator (Puppeteer)',
        'WABA delivery to corporate admin',
      ],
    },
    {
      week: 3,
      title: 'Tally Bridge + Vendor Portals',
      deliverables: [
        'n8n + ODBC bridge to Tally ERP 9 or Tally Prime',
        'Vendor portal scrapers (Playwright in n8n) for IndiGo, Vistara, Marriott, Accor',
        'Auto vendor-rebate reminder per booking',
        'Per-account daily P&L roll-up',
      ],
    },
    {
      week: 4,
      title: 'Partner Reports + Dashboard + Handover',
      deliverables: [
        'Monday upstream-partner digest auto-Excel for rebate claims',
        'Founder daily 9 AM WhatsApp digest: pipeline, today closures, top 5 corporates by margin',
        'Looker Studio dashboard: per-account P&L, vendor margin, agent productivity',
        'Documented SOPs',
        '90-min team training (agents + accountant + founder)',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Quote turnaround', before: '12-36 hours', after: 'Under 4 hours', caveat: 'Target range, AI drafter + agent review' },
    { metric: 'Two-agents-quote-same-RFQ incidents', before: '~1/week', after: 'Eliminated', caveat: 'Auto round-robin + lock' },
    { metric: 'Tally reconciliation time', before: '8 hrs/month', after: '90 min/month', caveat: 'Nightly ODBC sync' },
    { metric: 'P&L availability', before: 'Day 8 of next month', after: 'Day 2', caveat: 'Daily roll-up' },
    { metric: 'Vendor rebate claim rate', before: '60-70%', after: '95%+', caveat: 'Auto-reminder + Monday digest' },
    { metric: 'Friday partner-report time', before: '90 min, sometimes skipped', after: '5 min, never skipped', caveat: 'Auto-Excel + one-tap upload' },
    { metric: 'Lost-deal rate to faster competitors', before: 'Status quo', after: 'Down 30-50%', caveat: 'Via 4-hour quote turnaround' },
  ],
  objections: [
    {
      objection: 'My agents will refuse to give up shared bookings@.',
      rebuttal: 'They keep the inbox. The system runs on top, parses incoming emails, locks each RFQ to one agent. Agents see their assigned RFQs in their personal queue plus any escalations. Inbox stays as the audit trail.',
    },
    {
      objection: 'AI cannot handle complex MICE or multi-leg corporate itineraries.',
      rebuttal: 'It does not finalise. It produces a draft quote in 5 minutes from GDS + hotel + your margin matrix. The agent reviews and adjusts in another 30 minutes for complex itineraries. Net: 4 hours vs 36, with agent still owning the final price and routing.',
    },
    {
      objection: 'Tally is sacred. My accountant will not accept changes.',
      rebuttal: 'He never logs into anything new. n8n connects to Tally via ODBC on the same Windows machine. The bridge pushes draft sales invoices into Tally for him to approve in his existing screen. He gains a clean ledger and his month-end shrinks from 8 hours to 90 minutes.',
    },
    {
      objection: 'Vendor portal scraping might break when portals update.',
      rebuttal: 'Playwright scrapers in n8n are easy to repair. We monitor scraper health daily, auto-page on failure, fix within 24 hours. 30-day hypercare in the sprint covers initial portal-update bumps. Recurring covers ongoing maintenance.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: '6.5 hrs/month accountant time saved + 12 hrs/month P&L time + ₹40K/quarter recovered rebates = ₹1.5L+/year on the operations side alone. Cut quote turnaround from 36 to 4 hours, win 1 extra deal/month at ₹50K margin = ₹6L/year. Sprint payback inside 2-3 months. We split 50/50 (Week 0 / Week 4) if cash is tight.',
    },
  ],
  faqs: [
    {
      question: 'Will this work with Amadeus, Sabre, Galileo?',
      answer: 'All three. The AI quote drafter queries the GDS via the API your agency already uses. Most agencies have API access bundled with their GDS contract. We confirm in Week 1 of the sprint before committing to the build.',
    },
    {
      question: 'What about hotel partner portals like Marriott Bonvoy or Accor?',
      answer: 'We integrate the partner-rate APIs where available, fall back to nightly Playwright scraping for invoice + rebate data where APIs are not. Most major chains expose at least invoice download, which is enough to automate vendor-side reconciliation.',
    },
    {
      question: 'How does the round-robin RFQ assignment work?',
      answer: 'n8n parses incoming emails to bookings@, identifies it as an RFQ vs follow-up vs cc, assigns to next agent in rotation (skipping leave + workload-balanced). The RFQ locks to that agent in GHL. Other agents see it as "Mr X assigned" so no one accidentally double-quotes.',
    },
    {
      question: 'Can the quote PDF be branded with our logo and T&C?',
      answer: 'Yes. Puppeteer renders the PDF from a HTML template that uses your logo, colours, fonts, and full T&C. We design the template in Week 1 of the sprint based on your existing Word quote format.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all WABA template approvals, AI quote drafter with GDS + hotel integration, branded PDF generator, Tally bridge, vendor portal scrapers for 4 portals, per-account P&L, owner dashboard, team training, and 30-day hypercare. Recurring is ₹16K/month for WABA hosting, GHL, AI inference, n8n hosting (including scrapers), and email infra.',
    },
    {
      question: 'Have you done this for a corporate travel agency before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in services, distribution, and travel. The travel-specific pieces (GDS API, hotel partner integration, vendor portal scrapers, per-account P&L) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR agency before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of 87-unread shared bookings@ inbox vs auto-assigned GHL pipeline',
    'Visual of the 9-stage corporate travel pipeline from new RFQ to closed',
    'WhatsApp template gallery: RFQ ack, quote-ready, ticketed, travelled, invoiced',
    'Branded Puppeteer-rendered quote PDF sample',
    'n8n workflow: vendor portal scraper for IndiGo Corporate',
    'Sample founder daily 9 AM digest with pipeline, closures, top corporates by margin',
  ],
  downloads: [
    {
      label: 'Corporate travel WABA template pack (8 templates)',
      href: '/case-studies/downloads/corporate-travel-quotes-reconciliation/waba-templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n vendor portal scraper bundle JSON',
      href: '/case-studies/downloads/corporate-travel-quotes-reconciliation/n8n-vendor-scrapers.json',
      filetype: 'json',
    },
    {
      label: 'Corporate account master with rate-card template',
      href: '/case-studies/downloads/corporate-travel-quotes-reconciliation/corporate-master.csv',
      filetype: 'csv',
    },
  ],
}
