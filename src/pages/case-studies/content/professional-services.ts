import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: '10-20 person consulting, tax, legal, branding, ESG, and engineering advisory firms (₹1-5Cr revenue) where 1-3 senior partners are the bottleneck on every proposal, every invoice, every dunning call',
    whatBroke: 'Leads scattered across email, LinkedIn, WhatsApp, website with no central inbox. Proposals take 7 days because they are rebuilt from scratch every time. Pipeline invisible until Friday. DSO drifts to 60+ days. Project knowledge locked in partner heads.',
    whatWeBuilt: 'GHL unified inbox (email + WhatsApp + LinkedIn via Unipile) + AI proposal drafter (client brief + service-line template + fee matrix to first-draft Google Doc) + Razorpay or Zoho Books invoice + dunning automation + auto-provisioned project rooms + Friday client digest + Partner Monday morning brief',
    whatChanged: 'Target: proposal turnaround from 7 days to 1, pipeline visible Monday morning, DSO from 60+ days to under 35, project kickoff from 90 minutes to 8 minutes, partner reclaims 8-12 hrs/week from ops',
  },
  icpSnapshot: {
    revenue: '₹1Cr - ₹5Cr (consulting, tax / CA, legal, branding, ESG advisory, engineering advisory)',
    team: '1-3 senior partners + 6-15 associates + 1 ops or finance',
    geography: 'Hyderabad, Bangalore, Mumbai, Delhi NCR, Pune, Chennai, Ahmedabad',
    currentStack: [
      'Gmail or Outlook for everything',
      'Notion or Google Docs for proposals',
      'Excel for invoicing or Zoho Books or Tally',
      'LinkedIn for inbound (no CRM connection)',
      'WhatsApp for ad-hoc client comms',
      'Calendly for scheduling',
    ],
  },
  painNarrative: `Monday morning. A senior partner sits down to her inbox: 47 emails, 12 LinkedIn messages, 8 WhatsApps. Three are from past clients with new asks. Two are warm referral introductions. None are tracked anywhere. She replies whenever she can. Half the leads get a reply by Wednesday, the other half slip.

Scoping a new engagement: 3-4 days of pulling old proposals from a "Proposals" Google Drive folder, copy-pasting fee tables, rewriting context, sending to the second partner for review. Final proposal goes out Day 7. Two competitors have already responded.

Negotiation: long email thread, no version control, both sides eventually agree on a verbal figure that nobody captures cleanly. Won deal: 90 minutes of partner time setting up the project (Drive folder, Slack channel, Notion workspace, kickoff email, fee schedule, accounts entry). The partner skips the kickoff email half the time. The associate scrambles a week later.

Invoicing: monthly batch in Zoho Books or Excel. Each invoice reviewed by the partner before sending. Dunning at D+15, D+30, D+45 falls to the ops person who skips one in three. DSO drifts to 60+ days. The senior partner spends Friday afternoons sending personal "just checking in" notes that should have been automated D+15.

Pipeline: invisible until the Friday partner sync. By then, Monday\'s urgent ask is forgotten. The firm runs on partner heroics and tribal memory. The owner-partner does not want a CRM that demands data entry. She wants the predictable 80% (lead capture, proposal drafting, invoice + dunning, project kickoff, client status) handled so partners stay senior on the 20% that actually needs them.`,
  painQuotes: [
    { quote: 'I am the bottleneck on every proposal. I know it. I cannot find the time to fix it.', attribution: 'Senior partner, ESG advisory, Bangalore' },
    { quote: 'Pipeline visibility on Friday afternoon is too late.', attribution: 'Founding partner, tax firm, Hyderabad' },
    { quote: 'Our DSO is 67 days. The fix is dunning we never set up.', attribution: 'Managing partner, branding consultancy, Mumbai' },
  ],
  beforeStateSteps: [
    { step: 'Lead lands across email, LinkedIn, WhatsApp, website with no unified capture', timeCost: 'No source attribution' },
    { step: 'Senior partner replies whenever, no CRM stage tagged', timeCost: 'Half of leads slip past 48h' },
    { step: 'Scoping: 3-4 days pulling old proposals from Drive folder', timeCost: '~16 hrs partner time per scoping' },
    { step: 'Manual proposal in Google Docs from reference, fee table copy-pasted', timeCost: '6+ hrs per proposal' },
    { step: 'Negotiation by email thread, no version control', timeCost: 'Confused on final terms ~1x/quarter' },
    { step: 'Won deal: 90 min manual project setup (Drive + Slack + Notion + kickoff)', timeCost: '~6 hrs/month on setup' },
    { step: 'Invoicing: monthly batch, each invoice reviewed by partner', timeCost: '~4 hrs partner time monthly' },
    { step: 'Dunning at D+15, D+30, D+45 manual, ~1 in 3 skipped', timeCost: 'DSO drifts to 60+ days' },
    { step: 'Friday client status update written from scratch', timeCost: '~6 hrs across associates weekly' },
    { step: 'Pipeline review only on Friday partner sync', timeCost: 'Monday-to-Thursday opportunities lost' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'Services-tagged sub-account. Each engagement carries service line, scoping status, proposal value, retainer-or-project flag, partner owner, billing cadence, and client health score. Pipeline: New Lead → Qualifying → Scoping → Proposal Sent → Negotiation → Won → Active Engagement → Invoiced → Paid → Closed.',
    },
    {
      name: 'Unified inbox',
      role: 'Messaging',
      description: 'GHL inbox unifies email (via Gmail/Outlook OAuth) + WhatsApp Business API + LinkedIn (via Unipile). Single inbox for the partners and associates, with smart routing by service line and assigned partner. Replies sync back to the source channel.',
    },
    {
      name: 'AI proposal drafter',
      role: 'AI',
      description: 'Reads client brief (intake form or email), pulls the right service-line template from your library, applies the current fee matrix, drafts a first-draft Google Doc proposal in 30 minutes. Senior partner reviews and adjusts in another 30 minutes. Net: 1 hour vs 7 days.',
    },
    {
      name: 'Razorpay + Zoho Books bridge',
      role: 'Payment',
      description: 'Auto-generates invoices from won deal terms, applies the right billing cadence (one-shot, milestone, monthly retainer), sends via Razorpay payment link. Auto-marks paid in GHL and Zoho Books. Replaces partner Excel-and-Outlook invoicing.',
    },
    {
      name: 'Dunning automation',
      role: 'Automation',
      description: 'D+3 polite reminder, D+10 firmer nudge with statement, D+20 escalation to assigned partner with one-tap "send dunning email" template. Cuts DSO from 60+ days to under 35 without partner having to remember.',
    },
    {
      name: 'Project kickoff auto-provision',
      role: 'Automation',
      description: 'Won deal triggers: Drive folder created with project folder structure, Slack channel or WhatsApp Connect group, Notion workspace from template, kickoff email from template, partner intro to associates, billing schedule entered into Zoho. 90 minutes of partner time becomes 8 minutes.',
    },
    {
      name: 'Friday client status digest',
      role: 'Automation',
      description: 'Auto-generated Friday afternoon: this week\'s deliverables shipped, next week\'s milestones, asks pending from client, hours logged. Partner reviews and one-tap-approves before send. Cuts ~6 hrs/week of associate writing time.',
    },
    {
      name: 'Partner Monday morning brief',
      role: 'Analytics',
      description: 'Single WhatsApp at 9 AM Monday: pipeline by stage, deals expected to close this week, overdue invoices, client-health alerts. Partner walks into Monday with the full picture instead of discovering things on Friday.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + Service-Line Template Audit',
      deliverables: [
        'Half-day shadow with senior partner + associate handoff',
        'Service-line template extract: top 6-10 engagement types with fee matrix',
        'Inbox audit: Gmail, LinkedIn, WhatsApp setup',
        'Provision GHL sub-account + WABA on firm number + LinkedIn via Unipile',
        'Draft 8 WhatsApp + 6 email templates and submit for approval',
      ],
    },
    {
      week: 2,
      title: 'Unified Inbox + Proposal Drafter',
      deliverables: [
        'Email + WhatsApp + LinkedIn unified inbox live',
        'AI proposal drafter trained on top 6 service-line templates',
        'Lead capture from website + LinkedIn intake form',
        'Partner mobile inbox for on-the-go reply',
      ],
    },
    {
      week: 3,
      title: 'Invoicing + Dunning + Project Kickoff',
      deliverables: [
        'Razorpay + Zoho Books invoice automation',
        'Dunning workflow at D+3, D+10, D+20',
        'Won-deal auto-provision: Drive + Slack + Notion + kickoff email',
        'Friday client status digest template',
      ],
    },
    {
      week: 4,
      title: 'Partner Brief + Dashboard + Handover',
      deliverables: [
        'Partner Monday 9 AM WhatsApp brief',
        'Looker Studio dashboard: pipeline by stage + value, DSO trend, partner-wise revenue, client health',
        'Documented SOPs',
        '90-min team training (partners + associates + ops)',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Proposal turnaround', before: '7 days', after: '1 day', caveat: 'Target range, AI drafter + partner review' },
    { metric: 'Pipeline visibility', before: 'Friday only', after: 'Monday 9 AM', caveat: 'Auto Monday brief' },
    { metric: 'DSO (days sales outstanding)', before: '60+ days', after: 'Under 35 days', caveat: 'Via auto-dunning' },
    { metric: 'Project kickoff time', before: '90 min partner time', after: '8 min', caveat: 'Auto-provision' },
    { metric: 'Lead-to-first-touch', before: '24-72 hrs', after: 'Under 5 min', caveat: 'AI ack + smart routing' },
    { metric: 'Friday status update writing', before: '~6 hrs/week associates', after: 'Under 1 hr', caveat: 'Auto-generated, partner approves' },
    { metric: 'Partner hours reclaimed', before: 'Status quo', after: '8-12 hrs/week', caveat: 'Across the partnership' },
  ],
  objections: [
    {
      objection: 'My partners will not enter data into a CRM.',
      rebuttal: 'They never enter data. The CRM populates from the inbox. Email comes in, lead created. WhatsApp lands, contact updated. Won deal in the inbox triggers the project setup. Partners only ever click "approve" on auto-drafted proposals, invoices, and status digests.',
    },
    {
      objection: 'Our service is bespoke. AI cannot draft a proposal.',
      rebuttal: 'It does not finalise. It produces a first-draft Google Doc in 30 minutes from your service-line template + fee matrix + the client brief. The senior partner reviews and adjusts in another 30 minutes. Net: 1 hour vs 7 days, with the partner still owning the final scope and price.',
    },
    {
      objection: 'I tried Zoho One. The team would not adopt it.',
      rebuttal: 'Zoho One is 50 modules, all DIY. Most professional services firms abandon it because nobody owns the implementation. We are done-for-you. The 4-week sprint delivers working flows live, not a login. We sit on top of your existing email and Zoho Books, no rip-and-replace.',
    },
    {
      objection: 'My clients trust me personally. They will not like a system.',
      rebuttal: 'They never see a system. They email or WhatsApp the same partner they always have. The auto-status digest sounds like the partner because we train it on her writing style. The dunning email goes out under her name and signature. The client experience improves because nothing slips, the partner stays in the loop.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: 'Cut DSO from 60 to 35 days on a ₹3Cr revenue base = ₹2L+ of working capital freed annually. Reclaim 8 hrs/week of partner time at ₹3-5K/hr blended = ₹1L+/month of partner capacity unlocked. Sprint payback inside 1-2 months on most professional-services firms. We split 50/50 (Week 0 / Week 4) if cash is tight.',
    },
  ],
  faqs: [
    {
      question: 'Will this work with Gmail, Outlook, both?',
      answer: 'Both. We connect via OAuth so emails sync bidirectionally. Sent emails from GHL appear in your Gmail Sent folder. Inbound emails update CRM stages automatically.',
    },
    {
      question: 'How does the AI proposal drafter understand my firm\'s style?',
      answer: 'Week 1 includes extracting your top 6-10 service-line templates with their fee structures and tone. The drafter pulls from these for every new proposal. Senior partner reviews each draft in Week 2-3, the drafter learns from edits, by Week 4 most drafts need minor adjustment only.',
    },
    {
      question: 'What about LinkedIn inbound? My firm gets most leads there.',
      answer: 'We connect LinkedIn via Unipile so messages, connection requests, and InMail all flow into the unified inbox. Partners reply from one screen. The CRM tags every LinkedIn lead with source so you finally know your channel ROI.',
    },
    {
      question: 'Will the dunning emails sound robotic and damage relationships?',
      answer: 'No. The dunning sequence is written in your firm\'s tone, sent under the assigned partner\'s name and signature. D+3 is gentle, D+10 includes a polite statement, D+20 escalates to the partner who reviews before sending. Net: clients pay sooner, partners stop being the bad cop.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all template approvals (WhatsApp, email, proposal, dunning), AI proposal drafter training, Razorpay + Zoho Books bridge, auto project kickoff, Friday digest, partner Monday brief, dashboard, team training, and 30-day hypercare. Recurring is ₹16K/month for WABA hosting, GHL, AI inference, n8n hosting, and email infra.',
    },
    {
      question: 'Have you done this for a professional services firm before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in services, healthcare, and D2C. The professional-services-specific pieces (unified email + LinkedIn inbox, AI proposal drafter, dunning automation, auto project kickoff) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR firm before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of fragmented Gmail + LinkedIn + WhatsApp vs unified GHL inbox',
    'Visual of the 10-stage professional services pipeline from new lead to closed',
    'WhatsApp + email template gallery: lead ack, proposal sent, dunning, status digest',
    'AI proposal drafter sample: client brief in, first-draft Google Doc out',
    'Sample partner Monday 9 AM brief WhatsApp',
    'Project kickoff auto-provision diagram: won deal to Drive + Slack + Notion + kickoff in 8 minutes',
  ],
  downloads: [
    {
      label: 'Professional services WABA + email template pack',
      href: '/case-studies/downloads/professional-services-lead-to-cash/templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n project kickoff auto-provision workflow JSON',
      href: '/case-studies/downloads/professional-services-lead-to-cash/n8n-kickoff.json',
      filetype: 'json',
    },
    {
      label: 'Service-line fee matrix template',
      href: '/case-studies/downloads/professional-services-lead-to-cash/fee-matrix.csv',
      filetype: 'csv',
    },
  ],
}
