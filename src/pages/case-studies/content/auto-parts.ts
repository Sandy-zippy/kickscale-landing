import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: 'Tyre and auto-parts distributors (₹2-10Cr revenue) running on dealer WhatsApp groups, Excel order sheets, and Tally Prime',
    whatBroke: '60+ daily dealer messages across 3 WhatsApp groups, sales execs re-typing into Excel for 12 hrs/week, Tally re-typed for invoicing, 30%+ collections overdue, wrong SKU dispatched 3x/week',
    whatWeBuilt: 'GHL pipeline + WABA on the dealer-facing number + AI parser that reads "Bhaisaab 4 set MRF 175/70" into a structured order + Tally bridge via n8n + auto credit-control + UPI collect + owner Looker dashboard',
    whatChanged: 'Target: 12 hrs/week of manual order entry to zero, ₹40K/month of admin cost replaced with ₹16K/month, collections under 10% overdue at D+15, owner sees live order book on phone',
  },
  icpSnapshot: {
    revenue: '₹2Cr - ₹10Cr (tyres, auto spares, lubricants, batteries to retail and workshop network)',
    team: '15-40 (founder + 2-4 sales execs + 1-2 accountants + warehouse + delivery)',
    geography: 'Hyderabad, Vijayawada, Vizag, Tier-2 AP-TS, parts of MP, Maharashtra, Karnataka',
    currentStack: [
      'WhatsApp Business + 3-5 dealer broadcast groups',
      'Excel order sheets (one per sales exec)',
      'Tally Prime or Tally 9 ERP',
      'Manual UPI collections',
      'Paper delivery challans',
    ],
  },
  painNarrative: `8 AM. Sixty dealer messages already across three WhatsApp groups. "Bhai 4 set MRF 175 70 13", "5 piece JK 145/80 R12 zaroor bhejna", "MRF tube 90/90 stock hai kya?" Some are voice notes. Some are blurry photos of old invoices. Two dealers want a credit limit check.

By 11 AM the senior sales exec has scrolled through every group, copied each order into a different sheet of his master Excel, and called 8 dealers to confirm SKU and quantity. He typed the same data 3 times: WhatsApp to Excel, Excel to picking note, and again into Tally for the invoice. Every Wednesday he discovers 2 wrong SKUs were dispatched because the sheet got copy-pasted wrong.

Accounts spends 16 hours each month-end reconciling sales registers against Tally, chasing collections, and untangling sister-concern transfers. 30% of receivables sit past D+15 because nobody sent the dealer a polite UPI nudge on time.

The owner does not need a new ERP. Marg, Vyapar, Tally with extensions all exist, his accountant rejects every one. He needs the WhatsApp-to-Excel-to-Tally pipeline to disappear so his sales execs sell instead of type.`,
  painQuotes: [
    { quote: 'My sales exec is a typist on Tuesdays and a salesman on Saturdays.', attribution: 'Auto-parts distributor, Vijayawada' },
    { quote: 'I lose ₹50K a month to manpower I should not need.', attribution: 'Tyre wholesaler, Hyderabad' },
    { quote: 'My accountant cried when I suggested replacing Tally.', attribution: 'Auto distributor on ERP migration, Warangal' },
  ],
  beforeStateSteps: [
    { step: 'Dealer messages SKU + quantity in 1 of 3 WhatsApp groups (text, voice note, or photo of old invoice)', timeCost: 'No structured capture' },
    { step: 'Sales exec scrolls every group every 2 hours, manually copies each order', timeCost: '2 hrs/day per exec' },
    { step: 'Calls dealer to confirm SKU, quantity, credit limit', timeCost: '~6 min per order' },
    { step: 'Types order into a personal Excel master sheet', timeCost: '~3 min per order' },
    { step: 'Excel emailed to warehouse, picker pulls stock', timeCost: 'Wrong SKU 3x/week from copy-paste errors' },
    { step: 'Accounts re-types same order into Tally for the invoice', timeCost: '~4 min per invoice' },
    { step: 'Delivery challan printed, sometimes mismatches Tally invoice', timeCost: 'Returns or short-supply complaints' },
    { step: 'UPI collection chased manually on D+5, D+10, D+20', timeCost: '30%+ overdue at D+15' },
    { step: 'Month-end reconciliation: sales register vs Tally vs WhatsApp', timeCost: '16 hrs at month-end' },
    { step: 'Owner Sunday accounts session for credit decisions', timeCost: 'Half a Sunday gone' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'Distribution-tagged sub-account. Each dealer record carries dealer code, credit limit, outstanding balance, last-order date, and SKU preference. Pipeline: New Order → Confirmed → Picked → Dispatched → Invoiced → Paid → Closed.',
    },
    {
      name: 'WhatsApp Business API',
      role: 'Messaging',
      description: 'Single inbound dealer-facing WABA number. Replaces 3 broadcast groups. 9 templates: order ack, SKU-confirm, dispatched, payment receipt, credit-block warning, statement of account, festival promo, new-stock arrival, monthly outstanding.',
    },
    {
      name: 'AI order parser',
      role: 'AI',
      description: 'Reads dealer messages in any format (text, voice note transcribed, photo OCR). Maps "MRF 175/70 R13" to your exact SKU code. Confirms quantity. Asks once for missing fields. Hands off to a human exec on price negotiation or credit dispute.',
    },
    {
      name: 'Tally bridge',
      role: 'ERP',
      description: 'n8n workflow + ODBC connector. Pushes confirmed GHL orders into Tally as draft sales invoices. Pulls Tally outstanding back into GHL nightly so credit limits stay live. Accountant still owns Tally, never asked to touch a new tool.',
    },
    {
      name: 'Auto credit-control',
      role: 'Automation',
      description: 'Watches dealer outstanding vs credit limit in real time. Blocks new order acceptance once breached, auto-WhatsApps dealer with statement, copies sales exec. Eliminates the awkward owner-call about overdue balances.',
    },
    {
      name: 'UPI collect',
      role: 'Payment',
      description: 'Razorpay or UPI dynamic QR linked to invoice. Dealer pays from WhatsApp. Auto-marks paid in GHL and Tally. Cuts D+5, D+10, D+20 chase calls to one D+3 auto-reminder.',
    },
    {
      name: 'Owner Looker dashboard',
      role: 'Analytics',
      description: 'Live order book on phone: today by sales exec, top 10 dealers, outstanding aged buckets, SKU-wise stock alert. Replaces the Sunday accounts session.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + Tally Audit',
      deliverables: [
        'Half-day shadow at sales desk + accounts desk',
        'SKU master extract from Tally (top 200 SKUs covering 80% of orders)',
        'Provision GHL sub-account + WABA on dealer number',
        'Dealer master import with credit limits and outstanding',
        'Draft 9 WhatsApp templates and submit to Meta',
      ],
    },
    {
      week: 2,
      title: 'Order Capture + Parser',
      deliverables: [
        'AI order parser live on WABA, trained on top 200 SKUs',
        'Voice note transcription + photo OCR fallback',
        'Order acknowledgement WhatsApp with SKU and quantity confirmation',
        'Sales exec mobile inbox in GHL',
      ],
    },
    {
      week: 3,
      title: 'Tally Bridge + Credit Control',
      deliverables: [
        'n8n + ODBC connector to Tally Prime',
        'Confirmed orders push as draft sales invoices',
        'Outstanding sync from Tally back to GHL nightly',
        'Auto credit-block + dealer statement WhatsApp',
        'UPI collect with Razorpay dynamic QR',
      ],
    },
    {
      week: 4,
      title: 'Owner Dashboard + Handover',
      deliverables: [
        'Looker Studio dashboard on owner phone',
        'Sales exec daily 7 AM WhatsApp digest',
        'Documented SOPs',
        '90-min team training (sales exec + accountant + warehouse)',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Manual order entry hours', before: '12 hrs/week', after: 'Under 1 hr/week', caveat: 'Target range' },
    { metric: 'Wrong SKU dispatch incidents', before: '3 per week', after: 'Under 1 per month', caveat: 'Via parser confirmation' },
    { metric: 'Collections overdue at D+15', before: '30%', after: 'Under 10%', caveat: 'Via UPI auto-collect' },
    { metric: 'Tally re-entry hours', before: '4 hrs/week', after: 'Under 30 min/week', caveat: 'n8n + ODBC bridge' },
    { metric: 'Month-end reconciliation', before: '16 hrs', after: 'Under 4 hrs', caveat: 'Live ledger sync' },
    { metric: 'First response time to dealer', before: '20-90 min', after: 'Under 60 sec', caveat: 'AI parser 24/7' },
    { metric: 'Manpower cost replaced', before: '₹40K/month', after: '₹16K/month', caveat: 'Net of recurring stack cost' },
  ],
  objections: [
    {
      objection: 'My accountant will refuse to use anything other than Tally.',
      rebuttal: 'He never logs into anything new. The bridge runs on his Tally machine via ODBC, pushes draft invoices into Tally for him to approve in his existing screen. He gains a clean ledger, loses zero workflow.',
    },
    {
      objection: 'Dealers will not stop using their own informal language.',
      rebuttal: 'They do not need to. The AI parser is trained on the actual sloppy way your dealers message. "Bhaisaab 4 set MRF 175 70 13", voice note in Telugu, photo of an old invoice all map to the same SKU. The parser confirms once before order acceptance.',
    },
    {
      objection: 'I tried Vyapar / Marg / Khatabook. None stuck.',
      rebuttal: 'Those are mobile billing apps. They ask the dealer to install something, or they ask your team to enter data twice. Our stack adds zero apps for the dealer (still WhatsApp) and zero new tool for accounts (Tally stays). Adoption is automatic because nothing changes for the user.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: 'You replace 12 hrs/week of one sales exec\'s time and 4 hrs/week of accounts time. At ₹500/hr blended cost that is ₹32K/month of recovered capacity. Sprint payback inside 5 months. We split 50/50 (Week 0 / Week 4) if cash is tight.',
    },
    {
      objection: 'My sales execs will stop talking to dealers.',
      rebuttal: 'They will start. Today they spend 70% of the day typing. The system removes the typing. The freed-up 8 hours/week go into actual relationship calls, upsell on lubricants and accessories, and dealer credit conversations. We position it as commission-friendly to the team.',
    },
  ],
  faqs: [
    {
      question: 'Will dealers need to install a new app?',
      answer: 'No. Dealers continue messaging the same WhatsApp number you already use. Behind the scenes the AI parser reads their messages and pushes structured orders into your CRM. Zero behaviour change for the dealer.',
    },
    {
      question: 'Does the Tally bridge work with Tally Prime, Tally 9, or both?',
      answer: 'Both. n8n connects via ODBC on the same Windows machine where Tally runs. Tally Prime is the smoother integration. We test the bridge in Week 1 of the sprint before committing to the build.',
    },
    {
      question: 'What if my SKU master in Tally is messy?',
      answer: 'It usually is. Week 1 includes an SKU clean-up pass on the top 200 SKUs that cover 80% of your orders. We map dealer language ("MRF 175 70 13", "MRF One Tube") to the exact Tally SKU code so the parser is reliable from day one.',
    },
    {
      question: 'Can the AI handle voice notes and photos?',
      answer: 'Yes. Voice notes are transcribed (works well in Hindi, Telugu, Tamil, Marathi, English). Photos of old invoices or part numbers are OCR-read. If the parser is uncertain, it sends a single confirmation WhatsApp to the dealer before order acceptance.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all WABA template approvals, AI parser training, Tally bridge, credit-control automation, UPI collect, owner dashboard, team training, and 30-day hypercare. Recurring is ₹16K/month for WABA hosting, GHL, AI inference, n8n hosting, and email infra.',
    },
    {
      question: 'Have you done this for an auto-parts or tyre distributor before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in distribution, manufacturing, and services. The distribution-specific pieces (multi-group dealer WhatsApp consolidation, Tally bridge, auto credit-control) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR business before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of 3 chaotic dealer WhatsApp groups vs 1 GHL conversation inbox with structured orders',
    'Visual of the 7-stage order pipeline from new order to paid',
    'WhatsApp template gallery: order ack, SKU confirm, dispatched, statement of account',
    'n8n workflow for Tally bridge with ODBC connector',
    'Sample owner Looker dashboard with live order book',
    'AI parser sample: voice note + photo + text mapped to same SKU',
  ],
  downloads: [
    {
      label: 'Auto-parts distributor WABA template pack (9 templates)',
      href: '/case-studies/downloads/auto-parts-distribution-order-automation/waba-templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n Tally bridge workflow JSON',
      href: '/case-studies/downloads/auto-parts-distribution-order-automation/n8n-tally-bridge.json',
      filetype: 'json',
    },
    {
      label: 'Dealer master with credit limit template',
      href: '/case-studies/downloads/auto-parts-distribution-order-automation/dealer-master.csv',
      filetype: 'csv',
    },
  ],
}
