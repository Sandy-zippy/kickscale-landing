import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: 'Rice mills, edible oil units, packaged food and small-format FMCG (₹3-15Cr revenue) running on Tally Prime + plant whiteboards + 1 chaotic distributor WhatsApp group',
    whatBroke: 'Plant data lives on a whiteboard photographed at 8 PM, 40 distributors share one WhatsApp group, 8 hrs/week typing orders into Tally, 3-day month-end close, weighbridge data lost, distributor statements manual',
    whatWeBuilt: 'GHL distributor CRM + WABA + n8n workflows (whiteboard photo to OCR to JSON to Tally voucher draft, distributor message to AI parser, weighbridge CSV to Tally) + AI reconciliation assistant + distributor self-serve WhatsApp bot + owner 8 PM digest',
    whatChanged: 'Target: month-end close from 3 days to 1, plant data digitised without replacing the whiteboard, distributor self-service for statements, 8 hrs/week of Tally typing eliminated',
  },
  icpSnapshot: {
    revenue: '₹3Cr - ₹15Cr (rice, edible oil, atta, pulses, masalas, packaged snacks, dairy)',
    team: '25-70 (founder + son or daughter in operations + plant foreman + 30-50 shop floor + 2-3 accounts + dispatch)',
    geography: 'Nizamabad, Karimnagar, Warangal, Guntur, Nellore, peri-urban Hyderabad, Vijayawada, Anand, Kanpur',
    currentStack: [
      'Tally Prime for accounts',
      'Whiteboards on the plant floor for production tracking',
      '1 WhatsApp group with 40 distributors',
      'Weighbridge with paper notes (sometimes a basic Windows app)',
      'Excel for sister-concern transfers',
    ],
  },
  painNarrative: `Morning shift. The plant foreman walks the floor every two hours, updates the whiteboard in marker: 9 AM batch 12T paddy in, 11 AM batch 9.5T rice out, 12 noon packing 4 pallets done. The owner is in town for distributor meetings. He has no idea what is happening at the plant in real time.

8 PM. The owner photographs the whiteboard. WhatsApps it to his son. Son squints, types into Excel. Or does not, because he is at a wedding. Tomorrow morning the data may or may not exist.

40 distributors share one WhatsApp group. "Sir 50 bags Sona Masuri Vijayawada". "Saab kal ka payment hua kya?" "Statement bhejo please". Orders, payment queries, statement requests, festival promo asks all collide. The accountant scrolls the group every morning, types orders into Excel, then re-types into Tally for the invoice. Eight hours every week.

Weighbridge: paper notes. Sometimes the operator types into the basic Windows weighbridge app. Sometimes he forgets. Reconciliation against the dispatch register catches the gaps two weeks later.

Month-end. Three to five days reconciling Tally + Excel + WhatsApp + weighbridge + sister-concern transfers. The distributor outstanding sheet is wrong by ₹40K-60K every month before the accountant tracks the missing entries. The owner spends one Sunday a month untangling sister-concern transfers between the rice mill and the dal unit.

He does not want to throw out the whiteboard. The foreman uses it for 8-hour shift handover, that ritual stays. He wants the whiteboard, the WhatsApp group, the weighbridge, and Tally to all flow into a single ledger so month-end is a press of a button and distributors self-serve for the predictable 80%.`,
  painQuotes: [
    { quote: 'My son squints at a whiteboard photo at 9 PM. That is my MIS.', attribution: 'Rice mill founder, Nizamabad' },
    { quote: '40 distributors in one WhatsApp group. Orders and payment chases and statements all in one stream.', attribution: 'Edible oil distributor, Guntur' },
    { quote: 'Three days for month-end. Sometimes five. The accountant does it every quarter and quits every two years.', attribution: 'FMCG plant owner, Karimnagar' },
  ],
  beforeStateSteps: [
    { step: 'Plant foreman updates whiteboard every 2 hours during shift', timeCost: 'Data invisible until 8 PM' },
    { step: 'Owner photographs whiteboard, WhatsApps to son or accountant', timeCost: '~15 min daily' },
    { step: 'Son or accountant manually types whiteboard data into Excel (if remembered)', timeCost: '20-30 min daily' },
    { step: 'Distributor messages flood one WhatsApp group: orders, payments, statements, complaints', timeCost: 'No structured capture' },
    { step: 'Accountant scrolls group, types orders into Excel, re-types into Tally', timeCost: '8 hrs/week' },
    { step: 'Weighbridge data on paper, sometimes typed into basic app, sometimes forgotten', timeCost: 'Reconciliation gaps caught 2 weeks late' },
    { step: 'Distributor asks for statement, accountant manually pulls from Tally and emails', timeCost: '~10 min per request, ~6 per day' },
    { step: 'Sister-concern transfers tracked in a separate Excel by the owner', timeCost: 'Half a Sunday monthly' },
    { step: 'Month-end reconciliation: Tally + Excel + WhatsApp + weighbridge', timeCost: '3-5 days at month-end' },
    { step: 'Distributor outstanding always wrong by ₹40K-60K until accountant chases gaps', timeCost: 'Cash flow planning blind' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'Sub-account with FMCG / Distribution tag. Custom fields: distributor_code, beat, credit_limit, outstanding_balance, sku_preference, last_order_date. Pipeline: New Order → Confirmed → Dispatched → Invoiced → Paid → Statement Sent.',
    },
    {
      name: 'WhatsApp Business API',
      role: 'Messaging',
      description: 'Single inbound distributor-facing WABA number. The 40-distributor group is replaced by a 1-to-1 conversation per distributor with shared visibility for owner + son + accountant. 9 templates: order ack, dispatched, statement, payment receipt, festival promo, new SKU launch, credit warning, weighbridge confirm, monthly summary.',
    },
    {
      name: 'AI distributor parser',
      role: 'AI',
      description: 'Reads distributor messages in any format, including Hindi-Telugu mixed Hinglish. Maps "50 bags Sona Masuri" to your exact SKU code and packing variant. Confirms quantity. Flags credit-limit issues before order acceptance.',
    },
    {
      name: 'Whiteboard OCR workflow',
      role: 'Automation',
      description: 'Owner WhatsApps the daily whiteboard photo. n8n + Google Vision OCR + LLM parser extract paddy in, rice out, packing units. Pushes to a Google Sheet daily MIS and a draft production voucher in Tally for the accountant\'s review.',
    },
    {
      name: 'Tally bridge',
      role: 'ERP',
      description: 'n8n + ODBC connector to Tally Prime. Confirmed distributor orders push as draft sales invoices. Weighbridge CSV imports daily. Sister-concern transfers raised as inter-unit journals. Accountant approves in Tally, never asked to touch a new tool.',
    },
    {
      name: 'AI reconciliation assistant',
      role: 'AI',
      description: 'Daily compares Tally sales register vs WhatsApp orders vs weighbridge dispatched quantity. Flags variances under ₹2K (auto-clear), ₹2K-20K (accountant review), over ₹20K (owner alert). Cuts month-end reconciliation from 3-5 days to under 1.',
    },
    {
      name: 'Distributor self-serve WhatsApp bot',
      role: 'Messaging',
      description: 'Distributor types "statement", gets a PDF. "Outstanding", gets the ageing summary. "Last 5 invoices", gets the list. Cuts 6 statement-pull requests/day from the accountant.',
    },
    {
      name: 'Owner 8 PM digest',
      role: 'Analytics',
      description: 'Single WhatsApp at 8 PM: today\'s production, today\'s dispatches, today\'s collections, top 5 distributor outstanding, tomorrow\'s expected orders. One screen, three minutes.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + Tally + Plant Audit',
      deliverables: [
        'Half-day shadow at plant + accounts desk',
        'SKU master + distributor master extract from Tally',
        'Whiteboard format + weighbridge data audit',
        'Provision GHL sub-account + WABA on distributor-facing number',
        'Draft 9 WhatsApp templates and submit to Meta',
      ],
    },
    {
      week: 2,
      title: 'Distributor Capture + Self-Serve',
      deliverables: [
        'AI distributor parser live, trained on top SKUs and Hinglish messaging style',
        'Distributor self-serve bot for statement, outstanding, last invoices',
        'Order ack with credit-limit check WhatsApp template',
        'Weighbridge CSV nightly import to Tally',
      ],
    },
    {
      week: 3,
      title: 'Whiteboard OCR + Tally Bridge',
      deliverables: [
        'Whiteboard photo to OCR to JSON to draft Tally production voucher',
        'n8n + ODBC bridge to Tally Prime',
        'Sister-concern transfer auto-journal workflow',
        'AI reconciliation assistant flagging daily variances',
      ],
    },
    {
      week: 4,
      title: 'Owner Digest + Handover',
      deliverables: [
        'Owner 8 PM WhatsApp digest with production + dispatches + collections + outstanding',
        'Looker Studio dashboard for monthly trend view',
        'Documented SOPs',
        '90-min team training (foreman + accountant + owner + son)',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Month-end close', before: '3-5 days', after: '1 day', caveat: 'Target range, AI reconciliation' },
    { metric: 'Tally typing hours', before: '8 hrs/week', after: 'Under 1 hr/week', caveat: 'Tally bridge + parser' },
    { metric: 'Whiteboard data latency', before: '8 PM next-day', after: 'Real-time same day', caveat: 'OCR workflow' },
    { metric: 'Distributor statement requests on accountant', before: '6/day', after: 'Under 1/day', caveat: 'Self-serve bot' },
    { metric: 'Distributor outstanding accuracy', before: '₹40-60K off monthly', after: 'Live to ₹2K tolerance', caveat: 'AI reconciliation' },
    { metric: 'Owner Sunday accounts session', before: 'Half a Sunday', after: 'Eliminated', caveat: 'Auto sister-concern journals' },
    { metric: 'Weighbridge data capture', before: '60-70%', after: '100%', caveat: 'Nightly CSV import' },
  ],
  objections: [
    {
      objection: 'My foreman will not stop using the whiteboard.',
      rebuttal: 'He should not. The whiteboard is his shift handover ritual. We just photograph it once a day, run OCR, and feed the data into Tally. He keeps the whiteboard, the marker, and the muscle memory. The ledger gets clean numbers without him changing a thing.',
    },
    {
      objection: 'My distributors will not stop using the WhatsApp group.',
      rebuttal: 'They do not need to stop using WhatsApp. They keep messaging the same number. Behind the scenes the AI parses each message into orders, payment queries, statement requests, and routes them appropriately. The 1-to-1 conversation feels more personal than the noisy group, distributors prefer it within a week.',
    },
    {
      objection: 'I tried Marg ERP. The accountant rejected it.',
      rebuttal: 'Most plant accountants reject ERP because it asks them to switch their daily workflow. Our stack leaves Tally Prime exactly as it is. The bridge pushes draft vouchers into Tally for the accountant to approve in his existing screen. He gains a clean ledger, loses zero workflow.',
    },
    {
      objection: 'My data is messy. AI cannot handle Hinglish + voice notes + photos.',
      rebuttal: 'That is exactly what the parser is built for. We test on your actual messy data in Week 1. If a message is ambiguous, the parser sends a single confirmation WhatsApp before order acceptance. Accuracy hits 90%+ within 2 weeks of training on your data.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: 'You replace 8 hrs/week of accounts typing and shave 2-4 days off month-end. At ₹500/hr blended cost that is ₹16-20K/month of recovered capacity, plus the accountant retention benefit. Sprint payback inside 6-8 months. We split 50/50 (Week 0 / Week 4) if cash is tight.',
    },
  ],
  faqs: [
    {
      question: 'Will I have to throw out the whiteboard or change shop-floor habits?',
      answer: 'No. The whiteboard stays. The foreman keeps marking it the way he does today. The only addition is one daily photograph that gets OCR-read and pushed into a digital MIS. Zero behaviour change on the shop floor.',
    },
    {
      question: 'How does the Tally bridge work without bothering my accountant?',
      answer: 'n8n connects to Tally Prime via ODBC on the same Windows machine where Tally runs. The bridge pushes draft vouchers (sales invoices, weighbridge dispatches, sister-concern journals) into Tally for the accountant to approve in his existing screen. He never logs into anything new.',
    },
    {
      question: 'Will distributors lose their group access for festival promos?',
      answer: 'No. We replace the chaotic 40-person group with 1-to-1 WABA conversations, but you can still broadcast festival promos via WABA template messages to all 40 in one click. Better deliverability, no accidental "reply all" chaos, full read-receipt analytics.',
    },
    {
      question: 'Can the AI handle Hindi, Telugu, Hinglish, voice notes?',
      answer: 'Yes. Voice notes are transcribed (Hindi, Telugu, Tamil, Marathi, Bengali tested). Mixed-language Hinglish is the parser\'s default mode. Photos of paper orders are OCR-read. If uncertain, the parser confirms once before order acceptance.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all WABA template approvals, AI parser training, whiteboard OCR workflow, Tally bridge, weighbridge import, AI reconciliation assistant, distributor self-serve bot, owner digest, team training, and 30-day hypercare. Recurring is ₹16K/month for WABA hosting, GHL, AI inference, n8n hosting, and email infra.',
    },
    {
      question: 'Have you done this for a rice mill or FMCG plant before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in manufacturing, distribution, and FMCG. The plant-specific pieces (whiteboard OCR, weighbridge import, sister-concern journals, distributor self-serve) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR plant before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of chaotic 40-distributor WhatsApp group vs 1-to-1 GHL conversations',
    'Visual of the 6-stage distributor pipeline from new order to statement sent',
    'WhatsApp template gallery: order ack, dispatched, statement, festival promo',
    'n8n workflow: whiteboard photo to OCR to JSON to Tally draft voucher',
    'Sample owner 8 PM digest with production, dispatches, collections, outstanding',
    'Distributor self-serve bot screenshots: statement command to PDF response',
  ],
  downloads: [
    {
      label: 'FMCG distributor WABA template pack (9 templates)',
      href: '/case-studies/downloads/rice-mill-fmcg-production-distributor-automation/waba-templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n whiteboard OCR + Tally bridge workflow JSON',
      href: '/case-studies/downloads/rice-mill-fmcg-production-distributor-automation/n8n-plant-bridge.json',
      filetype: 'json',
    },
    {
      label: 'Distributor master with credit limit template',
      href: '/case-studies/downloads/rice-mill-fmcg-production-distributor-automation/distributor-master.csv',
      filetype: 'csv',
    },
  ],
}
