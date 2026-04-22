import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: '1-3 doctor homeopathic / specialty clinics running on WhatsApp personal number + paper diary',
    whatBroke: 'WhatsApp triage at midnight, 30%+ no-show rate, refill adherence depends on patient memory, D+14 follow-ups missed 60% of the time',
    whatWeBuilt: 'GHL + WhatsApp Business API + AI triage bot + calendar + Razorpay pre-consult + refill reminders + D+14 review automation + lapsed reactivation',
    whatChanged: 'Target: front-desk triage from 60 min/day to under 10, no-show from 30% to under 15%, refill adherence +25-40%, 15-22 hrs/week recovered',
  },
  icpSnapshot: {
    revenue: '₹80L - ₹3Cr (consultation ₹500-2,500 + dispensed medicine and procedures)',
    team: '1-3 founder-doctors + 2-5 front desk and pharmacy staff',
    geography: 'Tier 1-2 India. Heavy in Hyderabad, Pune, Bangalore, Jaipur, Chandigarh',
    currentStack: [
      'WhatsApp Business personal number',
      'Paper appointment diary or shared Excel',
      'Tally for billing',
      'Handwritten or WhatsApp-photo prescriptions',
      'Occasional Practo or ClinicMaster trial',
    ],
  },
  painNarrative: `9:14 PM. The founder-doctor opens WhatsApp and sees 47 unread threads. Three are new parents asking "doctor available tomorrow?" Two are refill requests for Bryonia and Arsenicum, with medicine photos. One is from a parent whose child's eczema flared after Tuesday's consult. Sent six hours ago. Unread. Seven are asking the consult fee. The rest are forwarded home remedies, good-morning images, and follow-up calls the front desk was supposed to make last Tuesday but didn't.

She trained 12 years to read constitutions and prescribe. She did not train to triage WhatsApp at midnight because Vidya, her 19-year-old receptionist, goes offline at 7 PM. The Sunday Tally reconciliation alone eats three hours of her one day off. No-shows are running around 30% because nobody sends a day-before reminder consistently. Refill nudges happen only if the patient remembers. The 40% of her revenue that should come from the second and third consult cycle is leaking somewhere between "first visit" and "patient returns three weeks later."

She does not want a bot that sounds cold. Her patients trust her voice. She wants a system that handles the predictable 80% (the fee questions, the appointment booking, the day-before reminder, the refill nudge, the IMA-style record keeping) so she and Vidya can focus on the 20% that actually needs a human.`,
  painQuotes: [
    { quote: "I'm a clinician, not an operations manager.", attribution: 'Specialty clinic founder-doctor' },
    { quote: 'My receptionist goes offline at 7 PM.', attribution: 'Clinic owner on the WhatsApp gap' },
    { quote: 'The gap between one consult and the follow-up is where 40% of my revenue leaks.', attribution: 'Healthcare founder, Sandy discovery call' },
  ],
  beforeStateSteps: [
    { step: 'New WhatsApp inquiry lands on clinic personal number with no tagging or source capture', timeCost: '~15 min/day triage' },
    { step: 'Front desk copies name, phone, complaint into paper diary or shared Excel', timeCost: '~45 min/day' },
    { step: 'Appointment confirmation sent manually, often hours later', timeCost: '~20 min/day' },
    { step: 'No day-before reminder. Patient forgets. 30%+ no-show rate', timeCost: '30% lost revenue on booked slots' },
    { step: 'Consultation happens, handwritten Rx given, no digital record exists', timeCost: 'Zero data capture' },
    { step: 'Refill reminder happens only when patient remembers', timeCost: 'Churn at ~40% post-first-refill' },
    { step: 'D+14 follow-up call sits on a sticky-note. Front desk misses ~60% of them', timeCost: 'Lost retention revenue' },
    { step: 'Payment in cash or UPI. Reconciled into Tally on Sundays', timeCost: '2-3 hrs/week' },
    { step: 'Lapsed patients with no return in 45 days never get a reactivation nudge', timeCost: 'Zero reactivation funnel' },
    { step: 'Founder personally fields 10-15 after-hours messages every night', timeCost: '~1 hr/night' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'Sub-account with Healthcare tag. Custom fields: patient_complaint, case_opened_date, next_followup_due, rx_refill_due, last_visit_revenue. Pipeline: New Inquiry → Booked → Consulted → On Treatment → Due Refill → Due Review → Inactive.',
    },
    {
      name: 'WhatsApp Business API',
      role: 'Messaging',
      description: 'Official WABA via GHL native integration. 8 templates: inquiry ack, appointment confirm, T-24h reminder, T-2h reminder, refill-due nudge (D-3), post-consult review (D+14), lapsed reactivation (D+60), payment receipt.',
    },
    {
      name: 'AI triage agent',
      role: 'AI',
      description: 'First-touch on WhatsApp within 30 seconds. Handles FAQ (clinic hours, fee, directions, first-visit prep). Captures name, complaint, preferred slot. Hands off to human on trigger words (emergency, worse, severe pain). Trained on the clinic-specific top 40 patient questions.',
    },
    {
      name: 'n8n workflows',
      role: 'Automation',
      description: 'Inquiry → contact upsert → WhatsApp ack. Booking → dual reminder schedule (T-24h + T-2h). Consult done → schedule D+14 review and D-3 refill based on Rx duration. Daily 8 AM digest to doctor with today\'s appointments + flagged cases + refills due.',
    },
    {
      name: 'Razorpay or UPI collect',
      role: 'Payment',
      description: 'Pre-consult fee link sent with booking confirmation. Auto-marks paid in GHL. Cuts cash handling and reduces no-shows via the commitment effect (people show up for the slot they paid for).',
    },
    {
      name: 'Practice management bridge',
      role: 'CRM',
      description: 'Optional. If clinic uses Practo, ClinicMaster, or Cliniify, a thin n8n connector syncs patient master one-way to avoid double entry. We never replace the clinical workflow tool.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + Foundation',
      deliverables: [
        'Half-day clinic shadow to observe real workflow',
        'Extract top 40 patient FAQs + complaint taxonomy',
        'Provision GHL sub-account + WABA on clinic number (port if needed)',
        'Build pipeline + custom fields',
        'Draft 8 WhatsApp templates and submit to Meta for approval',
      ],
    },
    {
      week: 2,
      title: 'Inbound + Booking',
      deliverables: [
        'AI triage chatbot live on WhatsApp',
        'Calendar + online booking link',
        'Razorpay pre-consult payment flow',
        'Appointment confirm + T-24h + T-2h reminder sequences tested with 5 pilot patients',
      ],
    },
    {
      week: 3,
      title: 'Treatment Cycle',
      deliverables: [
        'Refill reminder workflow (Rx duration → D-3 nudge)',
        'D+14 review follow-up automation',
        'Lapsed-patient reactivation sequence (D+60)',
        'Doctor\'s daily 8 AM WhatsApp digest',
        'Front-desk training on GHL inbox + escalation triggers',
      ],
    },
    {
      week: 4,
      title: 'Voice + Reporting + Handover',
      deliverables: [
        'Inbound AI voice for after-hours (optional)',
        'Monthly revenue + no-show + refill-adherence dashboard',
        'Documented SOPs',
        '90-min team training',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Front-desk triage time', before: '60 min/day', after: '<10 min/day', caveat: 'Target range' },
    { metric: 'No-show rate', before: '30%', after: '<15%', caveat: 'Via dual reminder + pre-paid commitment' },
    { metric: 'Refill adherence', before: 'Baseline', after: '+25-40%', caveat: 'Via D-3 nudge' },
    { metric: 'Hours recovered', before: 'Status quo', after: '15-22 hrs/wk', caveat: 'Doctor + front desk combined' },
    { metric: 'First response time', before: '15 min - 6 hrs', after: '<60 sec', caveat: 'AI triage 24/7' },
    { metric: 'D+14 follow-up completion', before: '~40%', after: '>90%', caveat: 'Automated' },
    { metric: 'Lapsed reactivation', before: '0%', after: '8-15%', caveat: 'Within 60 days of launch' },
  ],
  objections: [
    {
      objection: 'Patient data is sensitive. Is this safe?',
      rebuttal: 'WhatsApp Business API is Meta-encrypted end-to-end. GHL stores patient contact and complaint tags, not clinical notes or Rx details (those stay in your practice management software). No data leaves India-hosted infrastructure on the paid tier. We sign NDA + DPA before onboarding.',
    },
    {
      objection: 'A bot will feel cold. My patients trust me personally.',
      rebuttal: 'The AI handles only the predictable admin layer (hours, fee, booking, reminders). It hands off on any emotional or clinical trigger word. Your patients still talk to you and your front desk for everything that matters. Most patients actively prefer self-service booking at 11 PM over waiting until morning.',
    },
    {
      objection: 'My receptionist will feel replaced.',
      rebuttal: 'This removes the 60 minutes a day of message-sorting she hates, not her job. She now has time to actually call the high-value follow-up patients, keep the waiting room warm, and upsell the pharmacy. We position it to the team in Week 1 onboarding.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: 'The sprint pays back inside 4 months typically. 10% fewer no-shows at ₹1,000 average consult × 300 patients/month = ₹30,000/month direct recovery, before refill adherence or reactivation revenue is counted. We can split 50/50 (Week 0 / Week 4).',
    },
    {
      objection: 'We tried Practo or some software before. It did not stick.',
      rebuttal: 'Most clinics abandon practice management software because it demands clinical data entry. We do not. We automate the demand side (WhatsApp, reminders, collections) and leave your clinical workflow untouched.',
    },
  ],
  faqs: [
    {
      question: 'How fast can my clinic be live on this stack?',
      answer: 'Week 1 is discovery + WABA provisioning. By the end of Week 2, your AI triage is replying to inbound WhatsApp inquiries and the calendar booking link is live. The full stack (refills, follow-ups, daily digest) is operational by Day 28. We include 30 days of hypercare after handover.',
    },
    {
      question: 'What if my clinic uses Practo, ClinicMaster or Cliniify already?',
      answer: 'We do not replace your practice management software. Our stack handles the patient demand side (WhatsApp, booking, reminders, refill nudges, payments). A thin n8n connector syncs patient master one-way so you avoid double entry. Your clinical workflow stays untouched.',
    },
    {
      question: 'Will my patients feel they are talking to a bot?',
      answer: 'The AI handles the predictable 80% (clinic hours, fee, directions, booking, reminders, refills) and hands off to your front desk on any clinical or emotional trigger word (severe, worse, emergency, pain). Most patients prefer self-service booking at 11 PM over waiting until morning. Your voice still shows up where it matters.',
    },
    {
      question: 'Is patient data safe? What about NABH / data residency?',
      answer: 'WhatsApp Business API is Meta-encrypted end-to-end. GHL stores patient contact + complaint tags only, not clinical notes or Rx details (those stay in your practice management software). Paid tier is India-hosted. We sign an NDA + DPA before onboarding and walk through a data-flow diagram for your auditor.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all WABA template approvals, AI agent training, n8n workflows, integrations, team training, and 30-day hypercare. Recurring is ₹15-16K/month for WhatsApp API hosting, GHL CRM, AI agent inference, and email infra. No setup fees inside the recurring.',
    },
    {
      question: 'What happens after the 4 weeks if something breaks?',
      answer: '30 days of hypercare is included in the sprint price. After that, the recurring covers monitoring, maintenance, template updates, and quarterly reviews. Major customizations (new programmes, new branches, new integrations) are quoted separately as mini-sprints.',
    },
    {
      question: 'Have you actually done this for a homeopathic / specialty clinic before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in healthcare, manufacturing, retail, and services. The healthcare-specific pieces (NABH-friendly data flows, refill cycle nudges, multi-doctor calendars) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR clinic before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of chaotic personal WhatsApp thread vs clean GHL conversation inbox with tags',
    'Visual of the 7-stage patient lifecycle pipeline',
    'WhatsApp template gallery rendered as phone mockups',
    'n8n workflow diagram for inquiry → booking → reminder',
    'Doctor\'s daily morning WhatsApp digest sample',
    'Sample 4-week Gantt of the sprint plan',
  ],
  downloads: [
    {
      label: 'Clinic-ready WhatsApp template pack (7 templates)',
      href: '/case-studies/downloads/homeopathic-clinic-patient-flow/waba-templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n inquiry-to-booking workflow JSON',
      href: '/case-studies/downloads/homeopathic-clinic-patient-flow/n8n-booking.json',
      filetype: 'json',
    },
    {
      label: 'Monthly clinic reconciliation sheet',
      href: '/case-studies/downloads/homeopathic-clinic-patient-flow/recon-sheet.csv',
      filetype: 'csv',
    },
  ],
}
