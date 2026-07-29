/**
 * Content for the Growth Marketing Agency section (/growth).
 * Single source of truth — edit here, not in the components.
 */

export interface Client {
  slug: string
  name: string
  vertical: string
}

/** Dark grounds are baked into the artwork for marks designed light-on-dark
 *  (Groom2B, Business Mint, Seslong, Sunrise) — every tile is a plain white card. */
export const CLIENTS: Client[] = [
  { slug: 'my-perfect-fit', name: 'My Perfect Fit', vertical: 'Luxury & Bespoke Retail' },
  { slug: 'blutailor', name: 'BluTailor', vertical: 'Luxury & Bespoke Retail' },
  { slug: 'groom2b', name: 'Groom2B', vertical: 'Luxury & Bespoke Retail' },
  { slug: 'swathi-veldandi', name: 'Swathi Veldandi', vertical: 'Luxury & Bespoke Retail' },
  { slug: 'iyra', name: 'IYRA School of Business & Technology', vertical: 'Education' },
  { slug: 'ebs-ethames', name: 'EBS — Ethames Business School', vertical: 'Education' },
  { slug: 'lume', name: 'LUME', vertical: 'Networking Groups' },
  { slug: 'business-mint', name: 'Business Mint', vertical: 'PR & Media' },
  { slug: 'vyva', name: 'VyVA', vertical: 'Technology' },
  { slug: 'mywiz-ai', name: 'myWiz.ai', vertical: 'Technology' },
  { slug: 'seslong', name: 'Seslong', vertical: 'Technology' },
  { slug: 'iqra', name: 'IQRA', vertical: 'Manufacturing & Quality' },
  { slug: 'sunrise-drivers', name: 'Sunrise Drivers', vertical: 'Services' },
]

export interface Metric {
  /** numeric target the counter animates to */
  value: number
  prefix?: string
  suffix?: string
  label: string
  note?: string
}

export const METRICS: Metric[] = [
  { value: 48, prefix: '₹', suffix: 'L+', label: 'annual ad spend managed', note: 'across client accounts' },
  { value: 12, suffix: '+', label: 'clients partnered' },
  { value: 15, suffix: '+', label: 'websites & landing pages built' },
  { value: 10, suffix: '+', label: 'CRMs designed and deployed' },
  { value: 100, suffix: '+', label: 'sales staff trained' },
]

export interface Vertical {
  slug: string
  name: string
  blurb: string
  clients: string[]
  /** existing pages on the site that prove this vertical — shown when we have
   *  work to point at but no client logo cleared for the roster */
  links?: { label: string; href: string }[]
}

export const VERTICALS: Vertical[] = [
  {
    slug: 'luxury-bespoke-retail',
    name: 'Luxury & Bespoke Retail',
    blurb:
      'Made-to-measure, bridal and premium retail — where one customer is worth lakhs and the appointment matters more than the click.',
    clients: ['my-perfect-fit', 'blutailor', 'groom2b', 'swathi-veldandi'],
  },
  {
    slug: 'education',
    name: 'International Schools & Colleges',
    blurb:
      'Admissions funnels with long consideration windows — parent and student journeys that need nurture, not a hard close.',
    clients: ['iyra', 'ebs-ethames'],
  },
  {
    slug: 'networking-groups',
    name: 'Networking Groups',
    blurb:
      'Membership and community businesses — filling rooms, qualifying applicants, and keeping renewals healthy.',
    clients: ['lume'],
  },
  {
    slug: 'pr-agencies',
    name: 'PR Agencies',
    blurb:
      'Media and publishing businesses selling retainers — building the inbound engine and the qualification layer behind it.',
    clients: ['business-mint'],
  },
  {
    slug: 'speciality-hospitals-clinics',
    name: 'Speciality Hospitals & Clinics',
    blurb:
      'Consult-driven healthcare — IVF, dental, hair, ophthalmology, dermatology. Booked consults that show up, and the retention loop that brings patients back for the full course.',
    clients: [],
    links: [
      { label: 'IVF', href: '/ivf' },
      { label: 'Cosmetic dental', href: '/cosmetic-dental' },
      { label: 'Hair transplant', href: '/hair-transplant' },
      { label: 'Eye surgery', href: '/eye-surgery' },
      { label: 'Clinic Retention OS', href: '/giveaways/clinic-retention-os/' },
    ],
  },
  {
    slug: 'commercial-real-estate',
    name: 'Commercial Real Estate',
    blurb:
      'High-ticket, long-cycle deals where the metric that matters is a site visit that actually shows up.',
    clients: [],
  },
]

/** The three pillars — how the services are grouped on the page. */
export const PILLARS = [
  {
    num: '01',
    title: 'Structure',
    lead: 'We build the front end you sell through.',
    items: [
      'Websites and landing pages built to convert, not to look busy',
      'Paid media on Meta, Google and YouTube',
      'Creative and messaging matched to the segment',
      'CRM designed and deployed — pipelines, stages, automations',
    ],
  },
  {
    num: '02',
    title: 'Convert',
    lead: 'We make sure the enquiry becomes a conversation.',
    items: [
      'Enquiries routed into the CRM the moment they land',
      'Lead qualification so your team works the right ones',
      'WhatsApp and call follow-up sequences that actually fire',
      'Hands-on support closing the qualified leads',
    ],
  },
  {
    num: '03',
    title: 'Retain',
    lead: 'We train your people and keep the customer.',
    items: [
      'Sales team training, with the emphasis on closing',
      'Client retention models built for your business',
      'Reporting tied to CAC — not vanity metrics',
      'Ongoing hands-on support, not a monthly deck',
    ],
  },
]

/**
 * Accent colour per segment. Used for the flip-card top rule, the numeral and
 * the circular arrow — the reference gives each card its own hue so a grid of
 * six doesn't read as one grey block. Ordered to match VERTICALS.
 */
export const SEGMENT_ACCENTS: Record<string, string> = {
  'luxury-bespoke-retail': '#D5EB4B',
  education: '#7DD3FC',
  'networking-groups': '#C4B5FD',
  'pr-agencies': '#F9A8D4',
  'speciality-hospitals-clinics': '#6EE7B7',
  'commercial-real-estate': '#FDBA74',
}

export interface EngineStage {
  num: string
  title: string
  lead: string
  detail: string
  accent: string
}

/**
 * The five stages of ZippyScale's growth engine — the same flow as Sandy's
 * funnel diagram (public/growth-flow.webp), rebuilt as a scroll-driven
 * timeline so the story survives without the image he asked to remove.
 */
export const ENGINE_STAGES: EngineStage[] = [
  {
    num: '01',
    title: 'Capture',
    lead: 'Every channel lands in one place.',
    detail:
      'Meta, Google, YouTube, WhatsApp, the website form and the manual walk-in all write into a single CRM record. Nothing sits in a personal inbox waiting to be forgotten.',
    accent: '#D5EB4B',
  },
  {
    num: '02',
    title: 'Qualify',
    lead: 'Your team only works the real ones.',
    detail:
      'Enquiries are scored and routed the moment they arrive. Budget, timeline and intent captured before a salesperson spends an hour on someone who was never going to buy.',
    accent: '#7DD3FC',
  },
  {
    num: '03',
    title: 'Close',
    lead: 'We sit in the sales seat with you.',
    detail:
      'WhatsApp and call sequences that actually fire, scripts your team will use, and hands-on support on live deals. This is the step most agencies hand back to you.',
    accent: '#C4B5FD',
  },
  {
    num: '04',
    title: 'Retain',
    lead: 'The second sale costs a fraction of the first.',
    detail:
      'Retention models built around your repeat cycle — recall, re-order, renewal, referral. Built once, then running without anyone remembering to run it.',
    accent: '#6EE7B7',
  },
  {
    num: '05',
    title: 'Scale',
    lead: 'We report on CAC, then bring it down.',
    detail:
      'Cost to acquire a client, not cost per lead. Once the number is honest and stable, spend goes up against a known return instead of a hopeful one.',
    accent: '#FDBA74',
  },
]

export const VERTICAL_OPTIONS = [
  'Luxury & Bespoke Retail',
  'International School / College',
  'Networking Group',
  'PR Agency',
  'Speciality Hospital / Clinic',
  'Commercial Real Estate',
  'Other',
]

export const SPEND_BANDS = [
  'Not running ads yet',
  'Under ₹50,000 / month',
  '₹50,000 – ₹2,00,000 / month',
  '₹2,00,000 – ₹5,00,000 / month',
  'Above ₹5,00,000 / month',
]
