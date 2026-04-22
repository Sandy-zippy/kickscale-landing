import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: 'HVAC and air-solutions manufacturers (₹5-25Cr revenue) running Siemens NX or SAP B1 for production, but sales, quoting, and customer status updates still on email + WhatsApp',
    whatBroke: 'Quotes take 2 days because BOM is rebuilt from scratch every time, ERP NX disconnected from sales, customer asks status and nobody knows, foreman refuses to log into NX so production runs on a WhatsApp group, ₹8L ERP under-used',
    whatWeBuilt: 'GHL CRM bridging the sales-to-production gap + WABA on the sales head\'s ported number + n8n middleware to ERP NX (REST or CSV-drop fallback) + AI quote drafter that reads enquiry PDF and produces a draft quote from BOM library + production WhatsApp bot pulling work-order status from NX',
    whatChanged: 'Target: quote turnaround from 2 days to 4 hours, customer status query answered in 60 seconds, sales head\'s 800 personal chats migrated into trackable CRM, ERP under-utilisation problem solved without ripping out NX',
  },
  icpSnapshot: {
    revenue: '₹5Cr - ₹25Cr (industrial HVAC, AHUs, air washers, dust collectors, ducting, project + service)',
    team: '40-80 (founder + sales head + 2-4 sales engineers + AutoCAD designer + production foreman + 25-50 shop floor + accounts)',
    geography: 'Hyderabad (Jeedimetla, Patancheru), Pune, Chennai, Coimbatore, Faridabad, Ahmedabad',
    currentStack: [
      'Siemens NX or SAP Business One for design + production',
      'Tally Prime for accounts',
      'Email + WhatsApp for sales',
      'AutoCAD for shop drawings',
      'Manual PO PDFs and Excel quote templates',
    ],
  },
  painNarrative: `9 AM. The sales head\'s personal WhatsApp shows enquiries from a Pune builder, a Hyderabad pharma facility, and a UAE EPC contractor. The Pune one wants a 30 TR AHU quote yesterday. He pulls up an old quote from January, opens Excel, copies the BOM, asks the AutoCAD designer to confirm dimensions, waits 3 hours.

By Day 2 the quote is sent. By Day 3 the customer comes back wanting a small change. The exchange happens on email, the new quote rebuilt from scratch in Excel, version control nonexistent.

PO arrives Day 7. The sales head forwards the PDF to a production WhatsApp group. The foreman reads it, asks 4 clarifications via voice notes. Sales relays. Three days later production starts. Nobody updated NX yet because the foreman refuses to log into "the screen". By Week 3 the customer chases status on WhatsApp, the sales head walks to the shop floor to ask, and answers personally.

The owner spent ₹8L on Siemens NX two years ago. NX touches design and BOM beautifully. NX touches sales workflow nowhere. The disconnect costs the company two days per quote, three days of production lag per PO, and customer-side perception that the company is slower than the global brand it competes with.`,
  painQuotes: [
    { quote: 'My ERP cost ₹8L. My sales still runs on WhatsApp.', attribution: 'HVAC manufacturer, Hyderabad' },
    { quote: 'The customer asks production status. I have to walk to the shop floor.', attribution: 'Sales head, air-solutions company, Pune' },
    { quote: 'My foreman will not log into NX. He has 30 years of pencil-and-paper habit.', attribution: 'HVAC founder on shop-floor adoption, Chennai' },
  ],
  beforeStateSteps: [
    { step: 'Enquiry lands on sales head\'s personal WhatsApp + email + sometimes a missed call', timeCost: 'No central capture' },
    { step: 'Sales engineer reads, finds a similar past quote in old emails or shared drive', timeCost: '~30 min hunt' },
    { step: 'Manual quote built in Excel from reference BOM, fee-band guessed', timeCost: '6 hrs per quote' },
    { step: 'AutoCAD designer pulled in for shop drawing reference', timeCost: 'Adds 1 day to quote turnaround' },
    { step: 'Quote PDF emailed, version control by file naming convention', timeCost: 'Lost or wrong-version sent ~1x/week' },
    { step: 'PO arrives email, forwarded to production WhatsApp group as PDF', timeCost: 'Production lag 3 days while clarifications happen' },
    { step: 'Foreman asks SKU + dimension clarifications via WhatsApp voice notes', timeCost: '~6 voice notes per PO' },
    { step: 'NX work order created days late, sometimes never matches the WhatsApp version', timeCost: 'ERP data integrity broken' },
    { step: 'Customer asks dispatch status, sales head physically walks to shop floor', timeCost: 'Sales head loses 4 hrs/week to status calls' },
    { step: 'Dispatch advice sent ad hoc, sometimes after the truck has left', timeCost: 'Customer perception of delay' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'Manufacturing-tagged sub-account. Each enquiry carries source, project value, BOM reference, quote version, PO number, NX work-order ID, and dispatch ETA. Pipeline: Enquiry → Quoted → Negotiation → PO Received → In Production → Dispatched → Invoiced → Paid.',
    },
    {
      name: 'WhatsApp Business API',
      role: 'Messaging',
      description: 'WABA on the sales head\'s ported number so all 800 customer chats migrate without losing history. 8 templates: enquiry ack, quote-ready, quote-revised, PO-acknowledged, in-production, dispatched, invoice-shared, payment receipt.',
    },
    {
      name: 'AI quote drafter',
      role: 'AI',
      description: 'Reads enquiry PDF or RFQ email, matches to closest historical BOM, applies the current fee matrix and steel-cost adjustment, produces a draft quote PDF for the sales engineer to review in 30 minutes instead of 6 hours.',
    },
    {
      name: 'n8n middleware to ERP NX',
      role: 'Automation',
      description: 'Bidirectional bridge to Siemens NX (REST API where available, CSV drop with watcher script as fallback). Pushes confirmed POs into NX as work orders, pulls work-order status back into GHL every 30 minutes. ERP becomes the source of truth without anyone outside production touching NX.',
    },
    {
      name: 'Production WhatsApp bot',
      role: 'Messaging',
      description: 'Foreman gets a WhatsApp bot, not a screen. He marks "started", "done", "blocked-need-bracket" via single-tap WhatsApp buttons. The bot translates to NX work-order status. Foreman keeps his pencil-and-paper habit, NX gets clean data.',
    },
    {
      name: 'Document automation',
      role: 'Automation',
      description: 'PO acknowledgement PDF, dispatch advice, invoice copy auto-generated and WhatsApped to the customer at each stage transition. Customer always knows where their order is. Sales head stops walking to the shop floor.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + ERP Audit',
      deliverables: [
        'Half-day shadow at sales desk + production floor',
        'NX integration audit (REST API access vs CSV drop fallback)',
        'BOM library extract (top 30 product variants covering 80% of enquiries)',
        'Provision GHL sub-account + WABA on sales head\'s number (port)',
        'Draft 8 WhatsApp templates and submit to Meta',
      ],
    },
    {
      week: 2,
      title: 'Sales + Quote Drafter',
      deliverables: [
        'AI quote drafter live, reads enquiry PDF and produces draft in 30 min',
        'Quote version control inside GHL',
        'Sales engineer mobile inbox',
        'Customer enquiry ack WhatsApp template approved and live',
      ],
    },
    {
      week: 3,
      title: 'NX Bridge + Production Bot',
      deliverables: [
        'n8n bridge to NX (REST or CSV drop)',
        'PO pushed as draft work order on owner approval',
        'Production foreman WhatsApp bot for start / done / blocked',
        'Work-order status sync from NX to GHL every 30 minutes',
      ],
    },
    {
      week: 4,
      title: 'Customer Status + Handover',
      deliverables: [
        'Customer status WhatsApp on every stage transition',
        'Dispatch advice + invoice automation',
        'Owner Looker Studio dashboard: pipeline value, win rate, production WIP',
        'Documented SOPs',
        '90-min team training (sales + production + accounts)',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Quote turnaround', before: '2 days', after: '4 hours', caveat: 'Target range, AI drafter + reviewer' },
    { metric: 'Customer status query', before: 'Sales head walks shop floor', after: 'Under 60 sec auto-reply', caveat: 'NX-synced status' },
    { metric: 'Sales head\'s personal chat lock-in', before: '800 chats on his phone', after: 'Zero, all in CRM', caveat: 'WABA port' },
    { metric: 'Production lag from PO', before: '3 days', after: 'Under 1 day', caveat: 'Auto-PO-to-NX bridge' },
    { metric: 'Wrong-version quote sent', before: '~1 per week', after: 'Under 1 per quarter', caveat: 'CRM version control' },
    { metric: 'NX data integrity', before: 'Foreman never logs in', after: '100% via WhatsApp bot', caveat: 'Foreman keeps habit' },
    { metric: 'Customer perception score', before: 'Slower than global brand', after: 'On par or better', caveat: 'Auto-status comms' },
  ],
  objections: [
    {
      objection: 'My foreman will refuse to use anything on a screen.',
      rebuttal: 'He never sees a screen. He uses WhatsApp the same way he already does on his existing phone. The buttons are "Started", "Done", "Blocked". The system translates to NX. He keeps his pencil and paper for personal notes if he wants.',
    },
    {
      objection: 'I do not want to rip out Siemens NX after spending ₹8L.',
      rebuttal: 'You do not. We sit on top of NX, not replace it. The bridge pushes data into NX so it finally becomes the source of truth your investment promised. Design + BOM + production stay in NX. Sales + customer comms move out of WhatsApp into a CRM that talks to NX.',
    },
    {
      objection: 'Customers are used to talking to me directly. They will not like a system.',
      rebuttal: 'They never know there is a system. They WhatsApp the same number you already use. The auto-status replies sound like you because we train them on your last 100 customer messages. You stay in the loop on every message and intervene whenever you choose.',
    },
    {
      objection: 'AI cannot price an HVAC quote correctly.',
      rebuttal: 'It does not finalise the price. It produces a draft quote in 30 minutes from your historical BOM library and current fee matrix. Your sales engineer reviews and adjusts in another 30 minutes. Net: 1 hour instead of 2 days, with the engineer still owning the final number.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: 'A 2-day quote becomes 4 hours. If you currently lose 1 in 5 deals to a faster competitor, on a ₹15L average project value with 18% margin that is ₹54K of recovered margin per won deal. Sprint payback usually inside 2-3 won deals. We split 50/50 (Week 0 / Week 4) if cash is tight.',
    },
  ],
  faqs: [
    {
      question: 'Will this work with Siemens NX, SAP Business One, or both?',
      answer: 'Both, plus most mid-market manufacturing ERPs. NX exposes a REST API for work orders that we use directly. SAP B1 we integrate via DI API or Service Layer. If neither is available we fall back to a watched CSV drop. Week 1 of the sprint includes the integration audit before we commit to the bridge.',
    },
    {
      question: 'My sales head has 800 customer chats on his personal WhatsApp. Will those migrate?',
      answer: 'Yes. We port his existing number to WABA. All 800 chats transfer. Customers see no change. The team gains shared visibility, the sales head stops being a single point of failure, his personal phone is no longer the company\'s sales database.',
    },
    {
      question: 'What if the customer wants a quote revision?',
      answer: 'The AI drafter rebuilds the quote in 15 minutes from the new requirements, version-controls it in GHL, and the sales engineer reviews + sends. Customer always sees the latest version. No more "you sent me v3 but I was working off v2" fiascos.',
    },
    {
      question: 'Will my AutoCAD designer\'s workflow change?',
      answer: 'No. He keeps using AutoCAD. The drawings get attached to the GHL opportunity automatically when he saves to the shared folder. Sales engineers and customers always have the latest drawing without anyone forwarding files.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all WABA template approvals, AI quote drafter training on your BOM library, n8n NX bridge, production WhatsApp bot, document automation, owner dashboard, team training, and 30-day hypercare. Recurring is ₹16K/month for WABA hosting, GHL, AI inference, n8n hosting, and email infra.',
    },
    {
      question: 'Have you done this for an HVAC or industrial manufacturer before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in manufacturing and distribution. The HVAC-specific pieces (NX bridge, BOM library AI drafter, foreman WhatsApp bot) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR factory before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of sales head\'s personal WhatsApp vs unified GHL conversation inbox',
    'Visual of the 8-stage manufacturing pipeline from enquiry to paid',
    'WhatsApp template gallery: enquiry ack, quote-ready, in-production, dispatched',
    'n8n workflow for NX bridge with REST + CSV drop fallback',
    'AI quote drafter sample: enquiry PDF in, draft quote PDF out',
    'Foreman WhatsApp bot screenshots showing single-tap status updates',
  ],
  downloads: [
    {
      label: 'HVAC manufacturer WABA template pack (8 templates)',
      href: '/case-studies/downloads/hvac-manufacturing-po-to-production-automation/waba-templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n NX bridge workflow JSON (REST + CSV fallback)',
      href: '/case-studies/downloads/hvac-manufacturing-po-to-production-automation/n8n-nx-bridge.json',
      filetype: 'json',
    },
    {
      label: 'BOM library template for AI quote drafter',
      href: '/case-studies/downloads/hvac-manufacturing-po-to-production-automation/bom-library.csv',
      filetype: 'csv',
    },
  ],
}
