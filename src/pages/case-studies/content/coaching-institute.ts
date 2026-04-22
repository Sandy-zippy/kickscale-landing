import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: '480-1500 seat coaching institutes (NEET, JEE, CA, BBA-prep, IIT foundation) running on 5 counsellor WhatsApps + Excel master sheet + Razorpay',
    whatBroke: 'Leads land in 5 counsellor WhatsApps with no routing, 30-50% inquiries die in first-touch gap, demo classes ghost when counsellor on leave, fee instalments forgotten, dropouts caught at month 3',
    whatWeBuilt: 'GHL with WABA on a single inbound number + smart counsellor routing + AI counsellor that qualifies in 30 seconds + batch matcher + Razorpay subscription with auto-instalment reminders + attendance to dropout alert + parent weekly digest',
    whatChanged: 'Target: counsellor WhatsApps unified from 5 to 1, inquiry-to-enrol conversion +30% in 28 days, demo no-show under 15%, fee dunning automated, parent NPS up via weekly digest',
  },
  icpSnapshot: {
    revenue: '₹1Cr - ₹8Cr (admission fee ₹40K-2.5L per seat, 480-1500 seats per academic year)',
    team: '1-2 owners + 3-6 counsellors + 6-15 faculty + 1 ops',
    geography: 'Tier 1-2 India. Heavy in Kota, Hyderabad, Pune, Chennai, Indore, Lucknow, Vijayawada',
    currentStack: [
      '5 counsellor WhatsApp Business numbers',
      'Razorpay or Instamojo for fees',
      'Excel master sheet (one per counsellor)',
      'Meta and Google ads agency on retainer',
      'Tally for accounting',
    ],
  },
  painNarrative: `Monday 9 AM. Meta ads have been firing since 6 AM. Leads land in 5 different counsellor WhatsApp Business numbers. Counsellor 1 is in a 10 AM parent meeting. Counsellor 2 is offline (her phone died). Counsellor 3 starts at 11. Counsellor 4 is replying to yesterday's leads. Counsellor 5 is on leave.

By 10:42 AM a parent who messaged at 9:14 has waited 88 minutes. She has already messaged the competing institute next door. The competing institute replied in 4 minutes.

Wednesday. A demo class is booked for Saturday. The counsellor who booked it goes on leave Friday. No one calls the parent. Saturday: the parent shows up, the counsellor is missing, the AC is off in the demo classroom, the parent leaves and ghosts.

Friday. Three students owe instalment 2 of 4. Nobody sent the reminder. By Tuesday the parents have moved kids out, the dropout starts brewing, and by month 3 the institute owner finds out via a parent complaint.

Across the funnel: 30 to 50% of paid-ad inquiries die between the first WhatsApp message and a confirmed counsellor call. The owner does not need a new LMS. He needs the predictable 80% (lead routing, demo confirmation, fee dunning, attendance alerts, parent communication) handled so his counsellors can focus on the 20% that actually converts.`,
  painQuotes: [
    { quote: 'I have five counsellors and zero visibility into which one dropped which lead.', attribution: 'Coaching institute owner, Hyderabad' },
    { quote: 'The lead messaged us at 9. We replied at 11. The competitor replied at 9:04.', attribution: 'NEET coaching founder, Vijayawada' },
    { quote: 'I find out about a dropout when the parent complains. By then it is too late.', attribution: 'JEE coaching director, Pune' },
  ],
  beforeStateSteps: [
    { step: 'Meta or Google ad fires, lead form submits, lands in 1 of 5 counsellor WhatsApp Business numbers', timeCost: 'No source attribution' },
    { step: 'Counsellor reads message whenever they next pick up the phone (could be 30 min, could be 4 hours)', timeCost: '30-50% lead drop in first hour' },
    { step: 'Counsellor types details into a personal Excel sheet (each counsellor has their own format)', timeCost: '~12 min per lead' },
    { step: 'Demo class booking happens via voice call, written on a Post-it', timeCost: 'No reminder, no calendar' },
    { step: 'Day-before demo reminder skipped if counsellor busy or on leave', timeCost: '20-35% demo no-show' },
    { step: 'Fee instalment reminder forgotten (no auto-dunning on Razorpay)', timeCost: 'D+30 collections drift' },
    { step: 'Attendance taken on paper, not synced to anything', timeCost: 'Dropout flag missed by 4-6 weeks' },
    { step: 'Parent communication is ad-hoc, only on complaints', timeCost: 'Zero retention loop' },
    { step: 'Owner has no single dashboard, asks counsellors for Excel updates every Friday', timeCost: '3-5 hrs/week reconciliation' },
    { step: 'Lapsed inquiries never get re-engaged before the next admission cycle', timeCost: 'Zero reactivation funnel' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'Sub-account with Education tag. Custom fields: programme_interest, target_exam, batch_preference, fee_quoted, parent_phone, dropout_risk_score. Pipeline: New Inquiry → Counselled → Demo Booked → Demo Done → Fee Quoted → Enrolled → Active → At Risk → Dropped.',
    },
    {
      name: 'WhatsApp Business API',
      role: 'Messaging',
      description: 'Single inbound institute WABA number. Ports 5 counsellor numbers behind the scenes. Smart routing: round-robin within programme expertise, escalate to next counsellor if no reply in 5 minutes, parent gets the same counsellor across the funnel.',
    },
    {
      name: 'AI counsellor',
      role: 'AI',
      description: 'First-touch in 30 seconds. Qualifies on programme, target exam, batch timing preference, fee band. Sends institute brochure PDF. Books demo class slot. Hands off to a human counsellor on price negotiation, parent objection, or scholarship request.',
    },
    {
      name: 'Batch matcher',
      role: 'Automation',
      description: 'Reads programme + timing preference + seat availability. Suggests 3 best-fit batches with a one-tap WhatsApp button. Reduces counsellor back-and-forth from 6 messages to 1.',
    },
    {
      name: 'Razorpay subscription',
      role: 'Payment',
      description: 'Auto-generates instalment links per fee plan. Sends D-3 reminders, D-day reminder, D+1 escalation. Marks paid in GHL, fires WhatsApp receipt. Cuts D+15 collections from 30% to under 8%.',
    },
    {
      name: 'Attendance to dropout alert',
      role: 'Automation',
      description: 'Faculty marks attendance on a simple WhatsApp bot. n8n watches for 3 consecutive absences within 10 days. Triggers parent WhatsApp + counsellor task to call same day. Catches dropouts at week 2 instead of month 3.',
    },
    {
      name: 'Parent weekly digest',
      role: 'Automation',
      description: 'Every Sunday 8 PM: child attendance, top 3 test scores, upcoming PTM, fee due if any. Branded WhatsApp with institute logo. Cuts parent WhatsApp queries to counsellors by 40-60%.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + Foundation',
      deliverables: [
        'Half-day institute shadow at admission desk + a counsellor ride-along',
        'Programme + batch + fee matrix mapping',
        'Provision GHL sub-account + WABA on a single institute number',
        'Port 5 counsellor numbers, set up smart routing rules',
        'Draft 9 WhatsApp templates and submit to Meta',
      ],
    },
    {
      week: 2,
      title: 'Inbound + Demo Booking',
      deliverables: [
        'AI counsellor live, qualifies leads in 30 seconds',
        'Batch matcher integrated with seat-availability sheet',
        'Demo booking calendar, T-24h + T-2h reminders',
        'Counsellor handoff trained on top 50 parent objections',
      ],
    },
    {
      week: 3,
      title: 'Enrolment + Retention',
      deliverables: [
        'Razorpay subscription with auto-instalment dunning',
        'Attendance bot for faculty + 3-absence dropout alert',
        'Parent weekly digest WhatsApp template approved and live',
        'Lapsed inquiry reactivation sequence (D+30 and D+60)',
      ],
    },
    {
      week: 4,
      title: 'Owner Dashboard + Handover',
      deliverables: [
        'Owner daily 9 AM WhatsApp digest with counsellor performance',
        'Looker Studio dashboard: inquiries, demo conversion, fee collection, dropout risk',
        'Documented SOPs',
        '90-min team training (counsellors + faculty + owner)',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Counsellor WhatsApps unified', before: '5 numbers', after: '1 inbound', caveat: 'Target setup' },
    { metric: 'Inquiry-to-enrol conversion', before: 'Baseline', after: '+30%', caveat: 'Target range, in 28 days' },
    { metric: 'First response time', before: '40 min - 4 hrs', after: 'Under 60 sec', caveat: 'AI counsellor 24/7' },
    { metric: 'Demo no-show', before: '20-35%', after: 'Under 15%', caveat: 'Via dual reminder' },
    { metric: 'Fee instalment overdue at D+15', before: '30%', after: 'Under 8%', caveat: 'Via auto-dunning' },
    { metric: 'Dropout flag latency', before: '4-6 weeks', after: 'Under 10 days', caveat: 'Via attendance alert' },
    { metric: 'Owner reconciliation hours', before: '3-5 hrs/week', after: 'Under 30 min/week', caveat: 'Via daily digest' },
  ],
  objections: [
    {
      objection: 'My counsellors will lose ownership of their leads.',
      rebuttal: 'They keep their leads. The system just makes sure no lead drops while they are in a parent meeting or on leave. Round-robin only kicks in after 5 minutes of no reply. We position it to the team in Week 1 onboarding as backup, not replacement.',
    },
    {
      objection: 'Parents want to talk to a human, not a bot.',
      rebuttal: 'The AI handles only the first 30 seconds (programme questions, fee band, batch timing, brochure). The moment a parent asks about scholarship, payment plans, or expresses objection, it hands off to your best counsellor. Most parents prefer instant brochure delivery at 11 PM over waiting until 10 AM next day.',
    },
    {
      objection: 'We tried LeadSquared. It did not stick.',
      rebuttal: 'Most institutes abandon LMS software because counsellors refuse to enter data. Our stack is WhatsApp-first. Counsellors do not log into anything. The data captures itself from the conversation. The system works around the counsellor, not the other way round.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: 'A 30% conversion lift on 100 inquiries/month at ₹50K average fee is ₹15L of incremental revenue per cohort. The sprint pays back inside 4-6 weeks typically. We split 50/50 (Week 0 / Week 4) if cash is tight.',
    },
    {
      objection: 'My institute is not big enough for this.',
      rebuttal: 'If you are spending ₹50K+/month on Meta or Google ads and have 3+ counsellors, the leak is real and the math works. Below that, the manual workflow is still cheaper. The 48-hour audit tells you honestly which side you are on.',
    },
  ],
  faqs: [
    {
      question: 'How fast can my institute be live on this stack?',
      answer: 'Week 1 is discovery + WABA provisioning + counsellor number porting. By the end of Week 2, the AI counsellor is live and demo bookings are flowing. The full stack (fees, attendance, parent digest, dashboard) is operational by Day 28. We include 30 days of hypercare after handover.',
    },
    {
      question: 'Will my counsellors lose their personal WhatsApp leads?',
      answer: 'No. We port their existing numbers behind the scenes. Each parent still talks to the same counsellor by name. The only change is leads now flow through a routing layer that escalates if a counsellor is offline for 5+ minutes. Counsellors keep all their old conversations.',
    },
    {
      question: 'What if we already use LeadSquared, Meritto or NoPaperForms?',
      answer: 'We can sit on top of any of those via API. The WABA, AI counsellor, and parent digest layers add the WhatsApp-first conversion + retention layer that those LMS tools do not solve. We do not force a rip-and-replace.',
    },
    {
      question: 'Can the AI handle Hindi, Telugu, Tamil?',
      answer: 'Yes. The AI counsellor responds in the language the parent messages in. Hindi, Telugu, Tamil, Marathi, Bengali, Gujarati, Kannada are tested. English is the default fallback.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all WABA template approvals, AI counsellor training, batch matcher, fee dunning, attendance alerts, parent digest, owner dashboard, team training, and 30-day hypercare. Recurring is ₹16K/month for WABA hosting, GHL CRM, AI inference, and email infra.',
    },
    {
      question: 'Have you done this for a coaching institute before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in education, healthcare, and services. The education-specific pieces (counsellor routing, batch matcher, fee dunning, attendance to dropout alert) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR institute before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of 5 chaotic counsellor WhatsApps vs 1 unified GHL conversation inbox',
    'Visual of the 9-stage admissions pipeline from inquiry to enrolled',
    'WhatsApp template gallery: AI counsellor first-touch, demo booking, fee dunning, parent digest',
    'n8n workflow for batch matcher: programme + timing preference to 3 best-fit batches',
    'Sample owner daily 9 AM WhatsApp digest',
    'Sample parent Sunday 8 PM weekly digest',
  ],
  downloads: [
    {
      label: 'Coaching institute WABA template pack (9 templates)',
      href: '/case-studies/downloads/coaching-institute-admission-to-enrollment/waba-templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n batch matcher workflow JSON',
      href: '/case-studies/downloads/coaching-institute-admission-to-enrollment/n8n-batch-matcher.json',
      filetype: 'json',
    },
    {
      label: 'Counsellor performance dashboard schema',
      href: '/case-studies/downloads/coaching-institute-admission-to-enrollment/counsellor-dashboard.csv',
      filetype: 'csv',
    },
  ],
}
