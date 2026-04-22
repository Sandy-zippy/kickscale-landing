import type { CaseStudyContent } from '../types'

export const content: CaseStudyContent = {
  sixtySecondSummary: {
    who: 'D2C apparel and beauty founders (₹1-10Cr revenue) on Shopify with personal-DM bottleneck, ₹1.5L/mo Meta spend, abandoned carts, no replenishment sequence',
    whatBroke: 'Founder replies to Meta leads on personal WhatsApp 3-6 hours late, cart abandons recover only via generic Shopify email, IG DMs eat 10-15 hrs/week, COD confirmed manually, post-purchase has no replenishment sequence, attribution broken since iOS 14, top 500 VIPs nudged from founder\'s personal phone',
    whatWeBuilt: 'GHL + Shopify native (full customer graph: orders, LTV, segments) + WABA replacing or running in parallel with founder\'s personal number + Meta CAPI for post-iOS attribution + AI content drafter trained on founder\'s 50 best DMs + n8n flows for cart recovery / replenishment / VIP founder-voice + returns pipeline + Looker attribution dashboard',
    whatChanged: 'Target: lead-to-first-touch from 6 hours to 5 minutes, cart abandon recovery rate +35-55%, founder\'s personal-DM bottleneck eliminated, replenishment sequence captures 25-40% of repeat revenue, post-iOS attribution restored',
  },
  icpSnapshot: {
    revenue: '₹50L - ₹10Cr (D2C apparel, footwear, beauty, jewellery, home decor, gourmet food)',
    team: '8-25 (founder + 1-2 CX + 2-3 marketing + 1-2 ops + occasional video freelancer)',
    geography: 'Bangalore, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai',
    currentStack: [
      'Shopify (Plus or Standard)',
      'Meta Ads + Google Ads',
      'Founder\'s personal WhatsApp',
      'Failed trials of Bitespeed / Wigzo / Interakt / Klaviyo',
      'Mailchimp for occasional newsletter',
    ],
  },
  painNarrative: `Meta lead form fires at 11 AM. Lands in the founder\'s personal WhatsApp. She is in a fabric meeting until 2 PM. The lead waits 3 hours. By the time she replies the prospect has bought from Mamaearth or Wakefit instead.

Cart abandons trickle through Shopify\'s built-in email sequence. Generic, timed wrong, recovery rate around 4%. The founder loses ₹2K worth of carts per day, ₹60K/month in unrecovered cart value. She has tried Bitespeed twice, the flows broke, the team gave up.

Instagram DMs: the brand voice IS the founder. She personally replies to 80-150 DMs per week, takes 10-15 hours of her week. The CX intern she hired sounds like a different brand. She fired the intern. She is back to replying personally.

COD orders: 30-40% RTO rate because no manual confirmation call happened. Post-purchase: a generic thank-you email, then nothing. No replenishment sequence triggered when the moisturiser she sold should be running out at Day 35. Top 500 VIPs (40% of revenue) are nudged from her personal phone, with no system tracking.

iOS 14 broke Meta attribution 18 months ago. She is flying blind on which audience cohorts are actually converting. The agency tells her ROAS is 2.4. Her bank account says revenue is flat. She does not need a new tool. She has tried six. She needs a stack that wires the predictable 80% (cart recovery, lead response, replenishment, VIP touch, attribution) so she stays the brand voice on the 20% that needs her.`,
  painQuotes: [
    { quote: 'Bitespeed worked for two weeks. Then the flows broke. We gave up.', attribution: 'D2C beauty founder, Bangalore' },
    { quote: 'I am the brand voice. I cannot delegate the DMs. I also cannot keep doing them.', attribution: 'D2C apparel founder, Mumbai' },
    { quote: 'My agency says ROAS is 2.4. My bank account says flat. iOS killed my numbers.', attribution: 'D2C founder on attribution, Delhi NCR' },
  ],
  beforeStateSteps: [
    { step: 'Meta lead form fires, lands in founder\'s personal WhatsApp', timeCost: '3-6 hr response gap' },
    { step: 'Cart abandons trigger only Shopify\'s default email sequence', timeCost: '~4% recovery (vs ~15% achievable)' },
    { step: 'IG DMs personally answered by founder', timeCost: '10-15 hrs/week founder time' },
    { step: 'COD orders dispatched without confirmation call', timeCost: '30-40% RTO rate' },
    { step: 'Post-purchase: generic thank-you email, nothing else', timeCost: 'Zero replenishment lift' },
    { step: 'Returns tracked in a CX Excel sheet', timeCost: 'Disputes 2-3 weeks late' },
    { step: 'Top 500 VIPs nudged from founder\'s personal phone with no system', timeCost: 'Knowledge locked in her head' },
    { step: 'Meta attribution broken since iOS 14, no Conversions API', timeCost: 'Cannot identify winning cohorts' },
    { step: 'Mailchimp newsletter sent twice a quarter, no segmentation', timeCost: 'Open rate under 12%' },
    { step: 'Replenishment by SKU never triggers', timeCost: '25-40% of repeat revenue lost' },
  ],
  stackTools: [
    {
      name: 'GHL',
      role: 'CRM',
      description: 'D2C-tagged sub-account. Native Shopify integration syncs orders, customers, LTV, and products. Each customer record carries AOV, last-order date, next replenishment date, VIP tier, and first-touch channel. Pipeline: Lead → First-Touch → Cart Active → Cart Abandoned → Recovered → Customer → Repeat → VIP → At-Risk.',
    },
    {
      name: 'WhatsApp Business API',
      role: 'Messaging',
      description: 'WABA on the founder\'s ported personal number (or a parallel brand number, founder\'s choice). Shared inbox so founder + CX see every chat. 9 templates: lead ack, cart recovery 15-min / 1-hr / 24-hr / 3-day, COD confirm, replenishment nudge, VIP early access, post-purchase review, returns acknowledgement.',
    },
    {
      name: 'AI content drafter',
      role: 'AI',
      description: 'Trained on founder\'s 50 best DMs to capture her voice. Drafts replies for CX team to send with one tap. Learns over time. Cuts founder\'s DM hours from 10-15 to 2-3, while CX-sent replies still sound like the brand.',
    },
    {
      name: 'n8n cart recovery flows',
      role: 'Automation',
      description: 'Triggered on Shopify cart abandon webhook. WhatsApp at 15 min (gentle nudge), 1 hr (image of the cart), 24 hr (limited-time discount), 3 day (founder-voice personal note). Recovery rate target 12-18% vs Shopify-default 4%.',
    },
    {
      name: 'Replenishment by SKU',
      role: 'Automation',
      description: 'Per-SKU replenishment cycle (moisturiser 35 days, hair oil 60 days, perfume 90 days). Auto-WhatsApp nudge at SKU-cycle - 5 days with one-tap reorder. Captures 25-40% of repeat revenue that would otherwise leak.',
    },
    {
      name: 'VIP founder-voice sequence',
      role: 'Automation',
      description: 'Top 500 VIPs (highest LTV) get founder-voice early-access drops, birthday touch, drop-by-drop personal previews. Founder approves with one tap from a daily VIP digest. Knowledge moves from her phone to the system.',
    },
    {
      name: 'Meta CAPI + GHL attribution',
      role: 'Analytics',
      description: 'Meta Conversions API server-side events. GHL stitches Shopify orders back to Meta lead source even after iOS 14. Cohort-level ROAS visible in a Looker Studio dashboard. Founder finally sees which audiences actually convert.',
    },
    {
      name: 'Returns + refund pipeline',
      role: 'Automation',
      description: 'Returns request via WhatsApp, courier pickup auto-scheduled, refund issued within 48h of warehouse receipt. CX intervenes only on dispute. Cuts CX returns workload by 60%.',
    },
  ],
  sprintPlan: [
    {
      week: 1,
      title: 'Discovery + Shopify + Meta Audit',
      deliverables: [
        'Founder DM voice extraction (top 50 DMs with patterns identified)',
        'Shopify product + customer + order export',
        'Meta CAPI setup audit + pixel health check',
        'Provision GHL sub-account + WABA on founder\'s number (port) or brand number',
        'Draft 9 WhatsApp templates and submit to Meta',
      ],
    },
    {
      week: 2,
      title: 'Lead + Cart Recovery',
      deliverables: [
        'Meta lead form to WABA in 5 minutes (auto-ack + qualify)',
        'Cart recovery 4-step WhatsApp flow live',
        'COD confirmation flow before dispatch',
        'AI content drafter trained on founder\'s 50 best DMs',
      ],
    },
    {
      week: 3,
      title: 'Retention + Replenishment',
      deliverables: [
        'Per-SKU replenishment cycle with auto-WhatsApp nudge',
        'VIP founder-voice sequence + daily approval digest',
        'Post-purchase review request + UGC ask',
        'Returns + refund automation pipeline',
      ],
    },
    {
      week: 4,
      title: 'Attribution + Dashboard + Handover',
      deliverables: [
        'Meta CAPI server-side events live',
        'Looker Studio attribution dashboard: cohort ROAS, channel split, LTV by source',
        'Founder daily 9 AM digest: yesterday revenue, top sellers, VIP asks, attention items',
        'Documented SOPs',
        '90-min team training (CX + marketing + founder)',
        '30-day hypercare period included',
      ],
    },
  ],
  targetOutcomes: [
    { metric: 'Lead-to-first-touch', before: '3-6 hours', after: '5 minutes', caveat: 'Target range, AI ack + CX handoff' },
    { metric: 'Cart abandon recovery rate', before: '4%', after: '12-18%', caveat: 'Via 4-step WhatsApp flow' },
    { metric: 'Founder DM hours', before: '10-15 hrs/week', after: '2-3 hrs/week', caveat: 'AI drafter + CX one-tap send' },
    { metric: 'COD RTO rate', before: '30-40%', after: 'Under 18%', caveat: 'Pre-dispatch confirmation' },
    { metric: 'Replenishment-driven repeat revenue', before: '5-10% of revenue', after: '25-40%', caveat: 'Per-SKU auto-nudge' },
    { metric: 'Attribution clarity post-iOS', before: 'Blind', after: 'Cohort-level ROAS visible', caveat: 'Meta CAPI + GHL stitch' },
    { metric: 'CX returns workload', before: 'Status quo', after: '-60%', caveat: 'Auto pipeline + dispute-only escalation' },
  ],
  objections: [
    {
      objection: 'I tried Bitespeed / Wigzo / Interakt. They did not stick.',
      rebuttal: 'Those are SaaS platforms with templates and "you build it yourself" workflows. Most D2C founders never finish the build. We are done-for-you. The 4-week sprint delivers working flows live on your store, not a login to a tool you have to learn. If they did not stick, it is because nobody owned the implementation. We do.',
    },
    {
      objection: 'I am the brand voice. AI cannot replace me on DMs.',
      rebuttal: 'It does not. The AI drafts replies trained on your last 50 DMs and your CX team sends with one tap (or edits if needed). Your voice goes out, your hand does not have to. You stay personal on VIP and high-stakes asks while the predictable 80% of "what is the shipping time" gets handled.',
    },
    {
      objection: 'Meta attribution is dead since iOS 14. Why bother?',
      rebuttal: 'Server-side via Meta Conversions API restores most of what iOS broke. Add GHL\'s order-back-to-source stitching and you see cohort-level ROAS again. Most D2C brands operating without CAPI are leaving 20-40% of Meta\'s optimisation lift on the table.',
    },
    {
      objection: 'My catalogue is changing every month. Replenishment cycles will break.',
      rebuttal: 'Per-SKU cycles auto-update from your Shopify product data. New SKU added, you set the cycle once at SKU creation, every customer who buys it gets the right nudge at the right day. No manual maintenance needed.',
    },
    {
      objection: 'We cannot afford ₹1.5L upfront.',
      rebuttal: 'Recovering 12% more carts on ₹2K/day of abandons is ₹240/day = ₹7.2K/month. Add replenishment lift on a ₹3-5L/month base = ₹40-80K/month. Cut COD RTO from 35% to 18% on 100 orders/month = ₹30-50K/month savings. Sprint payback inside 2-3 months on most D2C revenue bands. We split 50/50 (Week 0 / Week 4) if cash is tight.',
    },
  ],
  faqs: [
    {
      question: 'Will this work with my Shopify Standard plan, or do I need Plus?',
      answer: 'Both work. Standard exposes the order, customer, cart-abandon, and product webhooks we need. Shopify Plus adds finer audience segments and faster checkout customisation but is not required.',
    },
    {
      question: 'Can the AI drafter actually capture my voice?',
      answer: 'Yes, if you give us 50 of your best historical DMs. We extract the tone, sentence-length, emoji habit, sign-off pattern, and brand vocabulary. The CX team reviews drafts before sending in Week 2-3, then approves auto-send for the highest-confidence reply types in Week 4. Your voice goes out, your hand does not have to.',
    },
    {
      question: 'My founder DMs are on her personal WhatsApp number. Will history transfer?',
      answer: 'Yes. We port her number to WABA. All chat history transfers. Customers see no change. Or we set up a parallel brand number while keeping her personal one for friends + family. Founder picks.',
    },
    {
      question: 'How do you handle iOS 14 attribution?',
      answer: 'Meta Conversions API server-side events plus GHL\'s order-back-to-source stitching. We deduplicate browser pixel + server events to avoid double-counting. The Looker Studio dashboard shows you cohort-level ROAS by Meta audience, Google campaign, and organic source.',
    },
    {
      question: 'What does ₹1.5L include and what is recurring?',
      answer: 'One-time ₹1.5L sprint covers the full 4-week build, all WABA template approvals, AI content drafter trained on your DMs, cart recovery flows, replenishment cycles, VIP sequence, returns pipeline, Meta CAPI setup, attribution dashboard, team training, and 30-day hypercare. Recurring is ₹16K/month for WABA hosting, GHL, AI inference, n8n hosting, and email infra.',
    },
    {
      question: 'Have you done this for a D2C brand before?',
      answer: 'We have deployed the same stack pattern across 20+ Indian SMBs in D2C, services, and healthcare. The D2C-specific pieces (Shopify native, cart recovery flows, replenishment cycles, post-iOS attribution) are proven. We run a 48-hour audit before any sprint so you see exactly what we will build for YOUR brand before paying anything.',
    },
  ],
  proofElements: [
    'Before/after of founder\'s personal WhatsApp chaos vs unified GHL + WABA shared inbox',
    'Visual of the 9-stage D2C lifecycle pipeline from lead to VIP',
    'WhatsApp template gallery: cart recovery 15-min / 1-hr / 24-hr / 3-day, COD confirm, replenishment',
    'n8n workflow for per-SKU replenishment cycle',
    'AI content drafter sample: founder DM voice replicated by CX',
    'Looker Studio attribution dashboard with cohort ROAS by source',
  ],
  downloads: [
    {
      label: 'D2C WABA template pack (9 templates)',
      href: '/case-studies/downloads/d2c-apparel-beauty-retention-automation/waba-templates.pdf',
      filetype: 'pdf',
    },
    {
      label: 'n8n cart recovery workflow JSON (4-step flow)',
      href: '/case-studies/downloads/d2c-apparel-beauty-retention-automation/n8n-cart-recovery.json',
      filetype: 'json',
    },
    {
      label: 'Per-SKU replenishment cycle template',
      href: '/case-studies/downloads/d2c-apparel-beauty-retention-automation/replenishment-cycles.csv',
      filetype: 'csv',
    },
  ],
}
