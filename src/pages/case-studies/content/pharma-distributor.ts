import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: 'Pharma C&F distributors (₹3-10Cr revenue) supplying 30-120 retail pharmacies via 4-8 medical reps, with month-end pulled together by a single overworked accountant',
    whatBroke: 'MR field orders captured on paper or WhatsApp voice notes (5-8% SKU error), credit limit checks skipped under pressure, no delivery confirmation back to system, 5-day month-end with GSTR-2A mismatches, near-expiry stock written off',
    whatWeBuilt: 'GHL retailer CRM + WhatsApp ordering with interactive list (MR sends a structured order, no typing) + AI invoice and photo parser for handwritten orders + Zoho or Tally bridge via n8n + GSTR-2A reconciliation workflow + AI voice agent for D+1 overdue calls + Razorpay UPI collect',
    whatChanged: 'Target: month-end close from 5 days to 1, MR SKU error rate under 1%, GSTR mismatches resolved before filing, near-expiry surfaced 90 days out, MR self-service for credit-limit and outstanding queries',
  },
  icpSnapshot: {
    revenue: '₹3Cr - ₹10Cr (pharma C&F or stockist supplying 30-120 retail pharmacies)',
    team: '10-30 (2nd-gen founder + admin + 4-8 MRs in field + warehouse + 1-2 accountants)',
    geography: 'Hyderabad, Vijayawada, Vizag, Pune, Coimbatore, Lucknow, Bhopal',
    currentStack: [
      'Tally Prime + Zoho Inventory trial',
      'Shared Gmail for orders',
      'WhatsApp groups (one per MR)',
      'Excel for MR ride sheets',
      'GSTR-2A downloaded monthly, reconciled in Excel',
    ],
  },
  painNarrative: `Daily, every MR visits 30-50 retail pharmacies. Orders captured on a paper notepad, sometimes WhatsApped as voice notes, sometimes photographed. By 7 PM the MR sends the day\'s sheet to the admin via WhatsApp. The admin spends two hours sorting, identifying SKUs, typing into Tally. Five to eight percent of SKUs come out wrong because handwriting, brand vs molecule, or strength ambiguity.

Credit limits get skipped when MRs are under pressure to close month. The retailer who is two months overdue gets ₹40K of new stock and the founder finds out at month-end. Dispatch happens, no delivery confirmation flows back to the system, and the retailer disputes the receipt three weeks later when the admin chases payment.

Month-end is 5 days. Three days reconciling primary (factory invoices in) versus secondary (stockist sales out). One day reconciling GSTR-2A mismatches. Another day chasing missing delivery confirmations. Near-expiry stock surfaces at 30-60 days from expiry, way past the window when it could have been pushed via a promo.

The accountant handles all of this and quits every two years. The founder, a second-gen owner who has tried Marg pharma ERP twice and abandoned both times, wants the predictable 80% (MR order capture, credit-limit guardrails, GSTR matching, near-expiry surfacing) handled so the accountant can focus on the 20% that needs judgment.`,
  painQuotes: [
    { quote: 'My MR sends me a voice note. I have to listen, identify SKU, and type. I get it wrong every fifth order.', attribution: 'Pharma admin, Hyderabad' },
    { quote: 'Five days for month-end. My accountant cried last month.', attribution: 'Pharma C&F founder, Vijayawada' },
    { quote: 'Near-expiry stock writes off ₹80K every quarter. I see it 30 days from expiry.', attribution: 'Stockist owner, Pune' },
  ],
  beforeStateSteps: [
    { step: 'MR visits 40 retailers, captures orders on paper, voice note, or WhatsApp photo', timeCost: 'Order capture format inconsistent' },
    { step: 'Admin receives MR daily sheet at 7 PM via WhatsApp', timeCost: '~10 min sorting per MR' },
    { step: 'Admin manually identifies SKU (brand vs molecule vs strength), types into Tally', timeCost: '5-8% error, 2 hrs/day' },
    { step: 'Credit limit checked manually, often skipped under month-end pressure', timeCost: 'Bad debt surfaces month-end' },
    { step: 'Dispatch happens, paper challan, no system confirmation back', timeCost: 'Disputes 3 weeks later' },
    { step: 'Payment chased on D+5, D+15, D+30 manually', timeCost: '4-6 chase calls per overdue retailer' },
    { step: 'GSTR-2A downloaded monthly, reconciled in Excel against Tally purchases', timeCost: '~10% mismatches every month' },
    { step: 'Near-expiry stock identified at 30-60 days from expiry', timeCost: '₹80K quarterly write-off' },
    { step: 'Month-end close: primary vs secondary reconciliation, GSTR, dispatch confirms', timeCost: '5 days minimum' },
    { step: 'Founder Sunday session for credit decisions, MR commission calculation', timeCost: '4 hrs every Sunday' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'Pharma-tagged sub-account. Each retailer record carries drug-licence number, credit limit, outstanding balance, payment terms, assigned MR, and near-expiry stock value. Pipeline: MR Field Order → Admin Confirmed → Credit Approved → Dispatched → Delivered → Invoiced → Paid → Statement Sent.',
    },
    {
      name: 'WhatsApp Business API',
      role: 'Messaging',
      description: 'Single inbound retailer-facing WABA number plus an MR WhatsApp ordering interface (interactive list buttons, one-tap SKU + quantity). 9 templates: order ack, credit-block warning, dispatched, delivery confirm, statement, GSTR ready, near-expiry alert, festival promo, payment receipt.',
    },
    {
      name: 'AI invoice + photo parser',
      role: 'AI',
      description: 'Reads MR field photos of handwritten retailer orders. Maps brand or molecule + strength + pack size to your exact Tally SKU. Flags ambiguity for one-tap MR confirmation. Cuts SKU error from 5-8% to under 1%.',
    },
    {
      name: 'Zoho or Tally bridge',
      role: 'ERP',
      description: 'n8n + ODBC to Tally (or Zoho Inventory API where in use). Confirmed orders push as draft sales invoices. Outstanding sync nightly so credit limits stay live for the MR in the field. Accountant approves in his existing Tally screen.',
    },
    {
      name: 'GSTR-2A reconciliation',
      role: 'Automation',
      description: 'Monthly auto-download of GSTR-2A, automated 3-way match against Tally purchase register and supplier invoices. Flags mismatches in 3 buckets: under ₹1K (auto-clear), ₹1K-50K (admin review), over ₹50K (founder alert). Cuts GSTR reconciliation from 1 day to 1 hour.',
    },
    {
      name: 'AI voice agent',
      role: 'AI',
      description: 'D+1 overdue payment calls in Hindi, Telugu, Tamil, Marathi. Reads the retailer\'s outstanding, requests UPI payment, sends Razorpay link. Escalates to MR or admin if retailer disputes. Replaces 4-6 chase calls per overdue retailer.',
    },
    {
      name: 'Razorpay UPI collect',
      role: 'Payment',
      description: 'Dynamic UPI QR per invoice. Retailer pays from WhatsApp. Auto-marks paid in GHL and Tally. Cuts admin reconciliation time and accelerates collections by 5-8 days on average.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + Tally + GSTR Audit',
      deliverables: [
        'Half-day shadow at admin desk + ride-along with one MR',
        'SKU master extract from Tally with brand-molecule-strength-pack mapping',
        'Retailer master with drug licence + credit limit + payment terms',
        'Provision GHL sub-account + WABA on retailer-facing number',
        'Draft 9 WhatsApp templates and submit to Meta',
      ],
    },
    {
      week: 2,
      title: 'MR Capture + AI Parser',
      deliverables: [
        'MR WhatsApp interactive-list ordering interface',
        'AI photo parser for handwritten orders, trained on top 500 SKUs',
        'Order ack with credit-limit check WhatsApp template',
        'MR field mobile inbox for order status visibility',
      ],
    },
    {
      week: 3,
      title: 'Tally Bridge + GSTR + Collections',
      deliverables: [
        'n8n + ODBC bridge to Tally Prime (or Zoho Inventory API)',
        'GSTR-2A auto-reconciliation workflow',
        'Razorpay UPI collect with auto-mark-paid',
        'AI voice agent for D+1 overdue payment calls',
      ],
    },
    {
      week: 4,
      title: 'Near-Expiry + Owner Dashboard + Handover',
      deliverables: [
        'Near-expiry alert at 90 / 60 / 30 days with auto-promo suggestion',
        'Founder daily 8 AM WhatsApp digest: orders, dispatches, collections, GSTR status',
        'Looker Studio dashboard: pipeline, MR-wise sales, outstanding aged buckets, near-expiry value',
        'Documented SOPs',
        '90-min team training (admin + MRs + accountant + founder)',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Month-end close', before: '5 days', after: '1 day', caveat: 'Target range, automated GSTR + reconciliation' },
    { metric: 'MR SKU error rate', before: '5-8%', after: 'Under 1%', caveat: 'AI photo parser + confirmation' },
    { metric: 'Credit-limit breach incidents', before: '5-10/month', after: 'Under 1/month', caveat: 'Live limit check at order capture' },
    { metric: 'GSTR-2A reconciliation time', before: '1 day', after: '1 hour', caveat: 'Auto 3-way match' },
    { metric: 'Collections lag', before: 'D+30 average', after: 'D+22 average', caveat: 'AI voice agent + UPI auto-collect' },
    { metric: 'Near-expiry write-off', before: '₹80K/quarter', after: 'Under ₹20K/quarter', caveat: '90-day forward alert' },
    { metric: 'Admin manual order entry', before: '2 hrs/day', after: 'Under 20 min/day', caveat: 'AI parser + interactive list' },
  ],
  objections: [
    {
      objection: 'My MRs will not adopt a new app in the field.',
      rebuttal: 'They do not. They use the same WhatsApp they already have. The interactive list buttons appear inside WhatsApp itself, no install. Photos of handwritten orders still work as fallback. We pilot with one MR in Week 2 and roll out only after he says it is faster than the old way.',
    },
    {
      objection: 'I tried Marg pharma ERP. Twice. Abandoned twice.',
      rebuttal: 'Marg replaces Tally and forces your accountant into a new tool. Our stack sits on top of Tally (or Zoho Inventory if you have moved). The accountant keeps his exact daily workflow. The bridge pushes draft vouchers, he approves. Adoption is automatic because nothing changes for him.',
    },
    {
      objection: 'Pharma data is sensitive. GSTR + retailer credit data cannot leak.',
      rebuttal: 'WABA is Meta-encrypted end-to-end. GHL stores retailer contact + credit + outstanding only. GSTR data stays in your Tally and the GST portal, the reconciliation workflow runs on your machine via ODBC. We sign NDA + DPA and walk through the data-flow diagram for your auditor.',
    },
    {
      objection: 'AI voice agent will sound robotic and annoy retailers.',
      rebuttal: 'Modern voice agents are indistinguishable from junior collection executives. They speak in the retailer\'s preferred language, escalate to a human on dispute, and only handle the polite D+1 first reminder. Retailers pay sooner because UPI is one tap from the call. We pilot on 5 retailers in Week 4 before scaling.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: 'You shave 4 days off month-end, cut SKU errors, recover ₹60K/quarter of near-expiry write-offs, accelerate collections by 8 days. On a ₹5Cr revenue base that is ₹1.5L+ of net annual benefit before counting accountant retention. Sprint payback inside 4-6 months. We split 50/50 (Week 0 / Week 4) if cash is tight.',
    },
  ],
  faqs: [
    {
      question: 'Will the AI parser handle handwritten MR orders accurately?',
      answer: 'Yes. The parser is trained on your top 500 SKUs with brand, molecule, strength, and pack-size variants mapped. Handwritten photos are OCR-read. If a SKU is ambiguous, the parser sends one confirmation WhatsApp to the MR before order acceptance. Accuracy hits 99%+ within 2 weeks of deployment.',
    },
    {
      question: 'Does this work with Tally Prime, Zoho Inventory, or both?',
      answer: 'Both. n8n connects to Tally via ODBC on the same Windows machine where Tally runs, and to Zoho Inventory via REST API. We test the bridge in Week 1 of the sprint before committing to the build.',
    },
    {
      question: 'How does GSTR-2A reconciliation work without human review?',
      answer: 'Auto-download GSTR-2A monthly, 3-way match against Tally purchase register and supplier invoices. Mismatches under ₹1K auto-clear, ₹1K-50K go to admin review queue, over ₹50K alert the founder. Net: GSTR reconciliation drops from 1 day to 1 hour with the same accuracy.',
    },
    {
      question: 'What about MR commission calculation?',
      answer: 'Auto-calculated daily from confirmed orders, factoring in retailer-wise margin and any spiff structures. Founder sees the running tally in the daily 8 AM digest. Replaces the Sunday session.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all WABA template approvals, AI photo parser training, MR interactive-list interface, Tally or Zoho bridge, GSTR reconciliation, AI voice agent, UPI collect, near-expiry alerts, owner dashboard, team training, and 30-day hypercare. Recurring is ₹16K/month for WABA hosting, GHL, AI inference, voice agent minutes, and email infra.',
    },
    {
      question: 'Have you done this for a pharma distributor before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in pharma, distribution, and manufacturing. The pharma-specific pieces (drug-licence-aware retailer master, GSTR-2A reconciliation, near-expiry alerts, MR interactive-list ordering) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR business before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of MR voice-note + photo chaos vs structured WhatsApp interactive-list orders',
    'Visual of the 8-stage retailer pipeline from MR field order to paid',
    'WhatsApp template gallery: order ack, credit-block, dispatched, GSTR ready, near-expiry alert',
    'n8n workflow for Tally bridge + GSTR-2A 3-way match',
    'AI parser sample: handwritten retailer order photo to structured SKU + quantity',
    'AI voice agent transcript: D+1 overdue call in Telugu',
  ],
  downloads: [
    {
      label: 'Pharma distributor WABA template pack (9 templates)',
      href: '/case-studies/downloads/pharma-distributor-field-orders/waba-templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n GSTR-2A reconciliation workflow JSON',
      href: '/case-studies/downloads/pharma-distributor-field-orders/n8n-gstr-recon.json',
      filetype: 'json',
    },
    {
      label: 'Retailer master with drug licence template',
      href: '/case-studies/downloads/pharma-distributor-field-orders/retailer-master.csv',
      filetype: 'csv',
    },
  ],
}
