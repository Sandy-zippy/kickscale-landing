/* The discovery call questionnaire.
 *
 * Almost every answer is a choice, because a prospect filling this in on a phone will
 * abandon a form that asks them to type. The one free-text box is the only question
 * whose answer we cannot anticipate, and it is the one worth reading.
 *
 * Money questions are stored as USD numbers rather than label strings, so the bands can
 * be printed in whatever currency the visitor is seeing. A dealer in Melbourne being
 * asked to pick between "$750 to $2,000" in a currency they do not use is being asked to
 * do arithmetic before they have even decided to talk to us.
 */

export type Field = {
  key: string
  label: string
  /** the one-line prompt under the label, where it earns its place */
  hint?: string
  kind: 'select' | 'text' | 'textarea'
  required: boolean
  options?: string[]
  placeholder?: string
}

/**
 * What they do.
 *
 * The first cut of this list lumped "clinic, hospital or dental" into one line, which
 * is three completely different businesses: a dental practice runs on recalls and
 * treatment plans, a specialty clinic on consultations and procedures, a hospital on
 * departments, beds and insurance. Getting this wrong at the form means getting the
 * first ten minutes of the call wrong.
 */
export const CATEGORIES = [
  'Car or vehicle dealership',
  'Jewellery or watches',
  'Bridal, couture or designer fashion',
  'Fashion or lifestyle retail',
  'Furniture, interiors or flooring',
  'Corporate gifting or B2B supply',
  'Real estate or property',
  'Dental practice',
  'Specialty clinic (skin, eye, fertility, physio)',
  'Hospital or multi-specialty',
  'Manufacturing',
  'Wholesale or distribution',
  'Education, coaching or training',
  'Hotels, resorts or travel',
  'Events, catering or banquets',
  'Fitness, salon or wellness',
  'Logistics or transport',
  'Professional services (legal, accounting, consulting)',
  'Marketing or creative agency',
  'E-commerce or D2C brand',
  'Something else',
]

/** Step 1, the non-geographic half. Country, state and city are their own component. */
export const ABOUT: Field[] = [
  { key: 'category', label: 'What kind of business?', kind: 'select', required: true, options: CATEGORIES },
  {
    key: 'team',
    label: 'How many people would use it?',
    hint: 'Everyone who would sign in, not just the office.',
    kind: 'select',
    required: true,
    options: ['Just me', '2 to 5', '6 to 15', '16 to 40', '41 to 100', 'More than 100'],
  },
]

/** Turnover bands, as USD floors. `null` is the open top end. */
export const REVENUE_BANDS: { from: number; to: number | null }[] = [
  { from: 0, to: 120_000 },
  { from: 120_000, to: 600_000 },
  { from: 600_000, to: 3_000_000 },
  { from: 3_000_000, to: 12_000_000 },
  { from: 12_000_000, to: null },
]
export const REVENUE_SKIP = 'I would rather say on the call'

/** Budget bands, same idea. The lowest one is deliberately below our own build fee. */
export const BUDGET_BANDS: { from: number; to: number | null }[] = [
  { from: 0, to: 750 },
  { from: 750, to: 2_000 },
  { from: 2_000, to: 5_000 },
  { from: 5_000, to: 15_000 },
  { from: 15_000, to: null },
]
export const BUDGET_SKIP = 'No idea yet, tell me what it should be'

/** Step 2: what they actually want. Money questions are built at render time. */
export const PROJECT: Field[] = [
  {
    key: 'need',
    label: 'What is going wrong today?',
    hint: 'The problem, in your words. This is the answer we read first.',
    kind: 'textarea',
    required: true,
    placeholder:
      'e.g. Enquiries come on WhatsApp, Instagram and the phone. Nobody knows which ones were followed up, and I find out a month later that a customer went elsewhere.',
  },
  {
    key: 'website',
    label: 'Your website',
    hint: 'So we can look at your catalogue before we speak, not during.',
    kind: 'text',
    required: false,
    placeholder: 'yourcompany.com',
  },
  {
    key: 'instagram',
    label: 'Your Instagram',
    hint: 'Often a better catalogue than the website, and always more current.',
    kind: 'text',
    required: false,
    placeholder: '@yourcompany',
  },
  {
    key: 'timeline',
    label: 'When do you want it running?',
    kind: 'select',
    required: true,
    options: ['This month', 'Within 3 months', 'This quarter, no fixed date', 'Later this year', 'Just looking for now'],
  },
]

/** Step 3: how to reach them. Name, email and phone are all the backend needs. */
export const CONTACT: Field[] = [
  { key: 'name', label: 'Your name', kind: 'text', required: true, placeholder: 'Full name' },
  {
    key: 'email', label: 'Email', kind: 'text', required: true,
    hint: 'The calendar invite goes here.', placeholder: 'you@company.com',
  },
]

/**
 * When Bhargav takes calls, in IST. The backend enforces this too, because a rule that
 * lives only in the browser is a rule anyone can post around.
 *
 *   Saturday and Sunday  09:00 to 12:00
 *   Monday to Friday     10:00 to 01:00 the next morning, which is what makes a call
 *                        with the Gulf, the UK or the US possible at all.
 */
export const HOURS = {
  weekday: { from: 10, to: 25 },   // 25 = 01:00 next day
  weekend: { from: 9, to: 12 },
  /** a discovery call is an hour */
  slotMinutes: 60,
  /** and the hour after it is held as a break, written into the calendar as a real
   *  event so it blocks itself out of the next availability read */
  breakMinutes: 60,
  /** nobody books a call starting in twenty minutes */
  minNoticeHours: 3,
  /** How far ahead the picker shows. Fourteen days sounds generous and is not:
   *  somebody planning a month out finds every date greyed and concludes we are
   *  fully booked. The backend uses the same number and enforces it. */
  horizonDays: 60,
  tz: 'Asia/Kolkata',
}

/**
 * Where the form posts: the Apps Script web app, deployed 26 Sep 2026 under
 * bhargav@zippyscale.com.
 *
 * Checked in rather than kept in an env file on purpose. The deployment is published
 * with "Anyone" access, so the URL is public by design, and Vite would inline it into
 * the bundle either way. Putting it here means a build works on any machine instead of
 * silently shipping a dead form because someone's .env was missing.
 *
 * VITE_BOOKING_ENDPOINT still overrides it, which is how you point a branch at a test
 * deployment without touching this file.
 */
export const BOOKING_ENDPOINT =
  import.meta.env.VITE_BOOKING_ENDPOINT ??
  'https://script.google.com/macros/s/AKfycbyDMiGETFWrOPu8MEJi6I9t9sukX58fEhZ3-n2o_45cLNZo4iNbtZ5dO4_89IkbZpLyvQ/exec'

/**
 * A company name out of whatever they gave us.
 *
 * They have already typed their website or Instagram by this point, so asking for the
 * company name again is asking twice. Pull it out, show it filled in, and let them
 * correct it: a guess they can see and fix beats an empty box.
 */
export function companyFrom(website: string, instagram: string): string {
  const src = (website || '').trim() || (instagram || '').trim()
  if (!src) return ''

  let host = src
    .replace(/^@/, '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0]

  /* instagram.com/zippyscale, or a bare @handle, both give the handle */
  if (/^instagram\.com$/i.test(host)) {
    host = src.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[1] || ''
  }
  const stem = host.split('.')[0].replace(/[_-]+/g, ' ').trim()
  if (!stem) return ''

  /* Title-case each word, and leave anything already mixed-case alone: "zippyscale"
     becomes "Zippyscale", but "iPhoneRepair" is left as its owner typed it. */
  return stem
    .split(' ')
    .map(w => (/[a-z]/.test(w) && /[A-Z]/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}
