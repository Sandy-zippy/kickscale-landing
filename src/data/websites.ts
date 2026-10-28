/* zippyscale.in/websites: every word on the page.
 *
 * Copy is draft 2, approved by Bhargav Naidu on 28 Oct 2026
 * (~/agentic-cockpit/zippyscale/web-services/copy/page-copy.html), word for word.
 * The two unmeasured proof numbers are left out on purpose: a slot we cannot fill
 * with a real number is removed, never guessed. No em dashes anywhere.
 */

export const META = {
  title: 'Agentic, Converting Websites and Landing Pages | ZippyScale',
  description:
    'New-gen websites, landing pages, VSL funnels and online stores that capture enquiries, track every visit and answer with AI. From $1,000.',
}

/* No price, and no currency symbol, in the hero. Ever. */
export const HERO = {
  eyebrow: 'ZippyScale Web Services',
  headline: 'Websites that work as hard as your sales team.',
  sub: 'New-gen agentic websites and landing pages. Built to turn visitors into enquiries, tracked down to the second, and answered by AI when nobody is at the desk.',
  primary: 'See packages and prices',
  secondary: 'Book a 15-minute call',
}

export const PROOF = {
  line: 'Live today for builders, clinics, schools, D2C brands and service businesses in India and Canada.',
  names: ['Riarh Group', 'NuBuild Co', 'LUME', 'Sunrise Drivers', 'Medico Construction', 'PawMe', 'Swathi Veldandi Studio', 'Iyra eThames'],
  numbers: [
    { n: '13', l: 'sites live' },
    { n: '4', l: 'types: websites, landing pages, funnels, D2C' },
  ],
}

export const PROBLEM = {
  title: 'Most websites are brochures. Yours should be bringing in business.',
  items: [
    { t: 'Built from a template.', d: 'The same layout as a thousand other businesses, with your logo swapped in.' },
    { t: 'No way to enquire.', d: 'A contact page buried at the bottom, and an email address nobody checks.' },
    { t: 'Nobody knows what is happening.', d: 'No idea who visited, where they came from, what they read or where they left.' },
    { t: 'Slow on a phone.', d: 'Most of your visitors are on mobile, and a slow page loses them before it loads.' },
    { t: 'Invisible on Google and AI search.', d: 'Not set up for search, so the people looking for you find a competitor.' },
  ],
}

export const AGENTIC = {
  title: 'Six things every ZippyScale website does from day one.',
  blocks: [
    { title: 'It converts.', body: 'Enquiry forms that fit the question, quiz forms that qualify, WhatsApp chat with one tap and calendar booking built in. Every page has one clear next step.' },
    { title: 'It tracks.', body: 'Every visit, the source and ad that brought it, how far people scroll, how long they spend on each section, heatmaps and screen recordings of real visits. You see what works and what does not.' },
    { title: 'It answers.', body: 'A custom AI agent trained on your business (Pro) answers questions, qualifies the visitor and takes their number, day and night. It never makes up a price or a promise.' },
    { title: 'It follows up.', body: 'Every lead lands in your sheet or CRM with where it came from, and gets a reply on WhatsApp or email in under a minute.' },
    { title: 'It ranks.', body: "Set up for Google from the first line of code: speed, structure, local search, and ready for AI search such as ChatGPT and Google's AI answers." },
    { title: 'It moves.', body: "Motion and video where they help people understand and act, never slowing the page down. We pass Google's speed tests on mobile and show you the score." },
  ],
}

export const BUILD = {
  title: 'One team for every page that has to sell.',
  items: [
    { t: 'Websites.', d: 'Your full company site, designed for your business and your buyers, not a template.' },
    { t: 'Landing pages.', d: 'One page, one offer, one action. Built for your ads, matched to the ad that brought the visitor.' },
    { t: 'VSL pages and funnels.', d: 'A video that sells, with the button right where people decide, and every step from opt-in to booking tracked.' },
    { t: 'E-commerce.', d: 'Online stores on Shopify or a fast custom build, with Razorpay in India and Stripe or local gateways abroad.' },
    { t: 'Motion graphics and video formats.', d: 'Animated product stories, explainer sections and video made for the page it lives on.' },
  ],
  sellsTitle: 'Built for how you sell:',
  sells: [
    { t: 'B2B', d: 'fewer, bigger buyers. We build trust, case studies and a booking path to a real conversation.' },
    { t: 'B2C', d: 'many buyers, quick decisions. We build speed, WhatsApp, offers and reviews.' },
    { t: 'D2C', d: 'your own brand, your own store. We build product stories, quizzes that find the right product and a checkout that does not leak.' },
  ],
}

export type Market = 'B2B' | 'B2C' | 'D2C'
export type Kind = 'Website' | 'Landing page' | 'Funnel' | 'E-commerce'
export type Work = {
  slug: string
  client: string
  sector: string
  where: string
  built: string
  market: Market
  kinds: Kind[]
  links: string[]
  own?: boolean
  demo?: boolean
}

/* Links for NuBuild, LUME, Swathi and OpenPaw are the live URLs in
   ~/.claude/agent-memory/webby/portfolio.md (all HTTP 200 on 28 Oct 2026).
   Car Cart and Royale sit behind a client login: screenshots only, no link. */
export const WORK: Work[] = [
  { slug: 'riarh', client: 'Riarh Group', sector: 'Commercial construction', where: 'Surrey, Canada', built: 'Company website + ads landing page for commercial projects', market: 'B2B', kinds: ['Website', 'Landing page'], links: ['https://riarhgroup.com', 'https://build.riarhgroup.com'] },
  { slug: 'medico', client: 'Medico Construction', sector: 'Medical clinic design-build', where: 'BC and Alberta, Canada', built: 'Ads landing page', market: 'B2B', kinds: ['Landing page'], links: ['https://build.medicoconstruction.com'] },
  { slug: 'nubuild', client: 'NuBuild Co', sector: 'Premium construction and interiors', where: 'Hyderabad', built: 'Company website', market: 'B2C', kinds: ['Website'], links: ['https://sandy-zippy.github.io/nubuildco/'] },
  { slug: 'sunrise', client: 'Sunrise Drivers', sector: 'Verified professional drivers', where: 'Hyderabad and Bangalore', built: 'Website with lead form into their CRM', market: 'B2C', kinds: ['Website'], links: ['https://caresunrisedrivers.com'] },
  { slug: 'lume', client: 'LUME', sector: 'Events and membership', where: '', built: 'Landing pages', market: 'B2C', kinds: ['Landing page'], links: ['https://sandy-zippy.github.io/lume-landing-pages/'] },
  { slug: 'swathi', client: 'Swathi Veldandi Studio', sector: 'Bridal couture', where: 'Banjara Hills, Hyderabad', built: 'Wedding wardrobe landing page, WhatsApp-first', market: 'B2C', kinds: ['Landing page'], links: ['https://sandy-zippy.github.io/swathi-veldandi-lp/'] },
  { slug: 'ethames', client: 'Iyra eThames Business School', sector: 'BBA and BCA admissions', where: '', built: 'Admissions landing page', market: 'B2C', kinds: ['Landing page'], links: ['https://ethames.iyrahub.com'] },
  { slug: 'pawme', client: 'PawMe', sector: 'AI pet camera', where: '', built: 'Product website', market: 'D2C', kinds: ['Website', 'E-commerce'], links: ['https://pawmebot.com'] },
  { slug: 'openpaw', client: 'OpenPaw', sector: 'Open-source pet companion robot', where: '', built: 'Kickstarter launch page', market: 'D2C', kinds: ['Landing page', 'Funnel'], links: ['https://sandy-zippy.github.io/openpaw-landing/'] },
  { slug: 'zswest', client: 'ZippyScale West', sector: 'Marketing for realtors', where: 'Vancouver', built: 'Website', market: 'B2B', kinds: ['Website'], links: ['https://zippyscale.com'], own: true },
  { slug: 'coaches', client: 'ZippyScale for Coaches', sector: 'Lead generation offer for coaches', where: '', built: 'Funnel landing page', market: 'B2B', kinds: ['Funnel', 'Landing page'], links: ['https://coaches.zippyscale.com'], own: true },
  { slug: 'aiml', client: 'AI Marketing Lab', sector: 'AI agents for business, playbook site', where: '', built: 'Website', market: 'B2B', kinds: ['Website'], links: ['https://aimarketinglabs.in'], own: true },
  { slug: 'carcart', client: 'Car Cart', sector: 'Pre-owned luxury cars', where: 'Hyderabad', built: 'Showroom website with search and filters by make, model, budget and year', market: 'B2C', kinds: ['Website'], links: [], demo: true },
  { slug: 'royale', client: 'Royale Collections', sector: 'Corporate gifting', where: 'Mumbai', built: 'AI product discovery portal across their full catalogue', market: 'B2B', kinds: ['Website'], links: [], demo: true },
]

export const WORK_COPY = {
  title: 'Websites and landing pages we have built.',
  markets: ['All', 'B2B', 'B2C', 'D2C'] as const,
  kinds: ['All', 'Website', 'Landing page', 'Funnel', 'E-commerce'] as const,
  kindLabel: { Website: 'Websites', 'Landing page': 'Landing pages', Funnel: 'Funnels', 'E-commerce': 'E-commerce' } as Record<Kind, string>,
}

export const HOW = {
  title: 'Your requirement first. Then the best design for it.',
  steps: [
    { t: 'Understand.', d: 'A short call on your business, your buyers and what the site must achieve. We write it down and you approve it.' },
    { t: 'Design.', d: 'A design made for your brand and your trade, shown to you before we build.' },
    { t: 'Build.', d: 'Forms, tracking, AI assistant, speed and search set-up, built in, not bolted on.' },
    { t: 'Launch with proof.', d: "Before we hand over, we send a real test enquiry, check every tracking event and run Google's speed test. You get the screenshots." },
    { t: 'Improve.', d: 'At 30 days (and 60 on Pro) we show you what visitors did and make the changes that matter.' },
  ],
}

/* USD is the price. Numbers are Bhargav's: never change them. */
export const PACKAGES = [
  {
    id: 'Starter', usd: 1000, from: false, popular: false,
    for: 'For one high-converting landing page or a 1 to 3 page site.',
    items: [
      'Custom design for your brand, mobile first',
      'Enquiry form and one-tap WhatsApp',
      'Full tracking: visits, sources, scroll, time on each section, heatmaps, recordings',
      'Google set-up and passing speed score on mobile',
      'Instant reply to every lead, leads into your sheet or CRM',
      'Hosting set-up, privacy banner and a launch report with proof',
    ],
  },
  {
    id: 'Growth', usd: 2000, from: true, popular: true,
    for: 'For a 5 to 8 page website, or a landing page plus a VSL page.',
    items: [
      'Everything in Starter',
      'Tracking bot that records every visitor: pages, time, clicks and where they came from',
      'Calendar booking and hot-lead alerts',
      'Advanced ad tracking for Meta and Google, so your ads learn from real leads',
      'VSL page with video tracking',
      'Local search set-up and a report on how AI search sees you',
      '30-day report with three improvements made',
    ],
  },
  {
    id: 'Pro', usd: 3000, from: false, popular: false,
    for: 'For a full VSL funnel, a 10 to 15 page website or an online store.',
    items: [
      'Everything in Growth',
      'Full funnel (opt-in, video, booking, thank-you) or Shopify store with payments',
      'Custom AI agent trained on your business: answers, qualifies, captures leads and books calls',
      'Headlines matched to each ad',
      'Up to 10 city or service pages for search',
      '60-day results report',
    ],
  },
] as const

export const PACKAGES_COPY = {
  title: 'Clear prices. Fixed scope. Shown in your currency.',
  addOns: ['AI voice agent', 'Arabic version', 'extra pages', 'monthly growth care'],
  notSure: 'Not sure which fits? Tell us what you need and we will recommend one on a 15-minute call.',
}

export const COMPARE = {
  title: 'Why not a template builder or a typical agency?',
  cols: ['Template builder', 'Typical agency', 'ZippyScale'],
  rows: [
    ['Design made for your business', 'No', 'Sometimes', 'Yes'],
    ['Built to collect enquiries', 'Basic form', 'Basic form', 'Forms, quiz, WhatsApp, booking, AI assistant'],
    ['Know where every lead came from', 'No', 'Rarely', 'Yes, on every lead'],
    ['Heatmaps and visit recordings', 'No', 'Extra cost', 'Included'],
    ["Passes Google's speed test on mobile", 'Often fails', 'Not promised', 'Promised, score shown'],
    ['Ready for Google and AI search', 'Basic', 'Extra cost', 'Included'],
    ['Reply to leads in under a minute', 'No', 'No', 'Yes'],
    ['Price', 'Monthly fees forever', 'Often quoted after weeks', '$1,000 to $3,000, fixed'],
  ],
}

export const FAQ = {
  title: 'Questions people ask',
  items: [
    { q: 'How long does it take?', a: 'Starter in about 2 weeks, Growth about 3 weeks, Pro about 4 to 5 weeks, from the day you approve the design.' },
    { q: 'Who owns the website?', a: 'You do. Domain, content, code and accounts are in your name.' },
    { q: 'Where is it hosted?', a: 'On a fast global network. We set it up in your account; hosting is usually free or a few dollars a month.' },
    { q: 'Can I make changes later?', a: 'Yes. Small text and image changes are easy; larger changes are quoted or covered by monthly growth care.' },
    { q: 'Does the AI agent come with every package?', a: 'The custom AI agent is part of Pro. Growth includes a tracking bot that records every visitor. It can be added to any package on request.' },
    { q: 'Do you run the ads too?', a: 'Yes, through our Agency team, and your website is already set up to track them.' },
    { q: 'Does the AI assistant say things I have not approved?', a: 'No. It answers only from your own content and hands over to your team when it is not sure.' },
    { q: 'Do you only work in India?', a: 'No. We build for clients in India, the Gulf, Canada and the US.' },
  ],
}

export const FORM = {
  title: 'Tell us about the website you need.',
  sub: 'Tell us who you are and what you need, then pick a time.',
  steps: ['Your details', 'Your business', 'What you need', 'Pick a time'],
  needs: ['Website', 'Landing page', 'VSL page or funnel', 'Online store', 'Not sure'],
  sells: ['B2B', 'B2C', 'D2C'],
  packages: ['Starter', 'Growth', 'Pro', 'Not sure'],
  button: 'Book my call',
  consent: 'We use your details only to reply about your website. You can ask us to delete them at any time.',
}

export const WHATSAPP = '919989990419'
