/* Agentic Cockpit homepage — copy and evidence.
 *
 * EVERY statistic here carries its publisher, year and URL, and says whether it is
 * independent or published by someone selling the cure. If a number cannot survive a
 * prospect clicking through to the source, it does not belong on the page.
 *
 * Numbers deliberately NOT used, because research could not trace them to a primary
 * source — do not add them back:
 *   · any manual data-entry error rate (1–4%) — 1990s studies recycled by automation vendors
 *   · "$10–$100 to fix each error" — the 1-10-100 rule, a heuristic, not a finding
 *   · "$3.1 trillion a year in poor data quality" — IBM marketing c.2016, now sourceless
 *   · "391% lift from replying in one minute" — Velocify; the publisher no longer exists
 *   · "SMBs run 25–55 SaaS apps" — SEO listicles citing each other
 *   · any Tally market-share percentage — no independent measurement exists
 *   · "Tally has no API" — factually WRONG. It documents XML over HTTP on port 9000 and ODBC.
 *   · "MIT found 95% of AI pilots return nothing" — the figure is asserted once with no
 *     derivation, "failure" is not defined as zero return, and the primary PDF was pulled
 *     from MIT's servers within hours of going viral. The URL now redirects to an unrelated
 *     page. Use S&P Global's 46% instead: n=1,006, method published, margin of error stated.
 *   · "Fragmented data is the biggest blocker to AI" — refuted. The US Census Bureau's
 *     survey of ~164,500 firms puts "lack of required data" at 2.2%, third from last.
 *   · any Indian MSME software-spend figure in rupees — no credible source exists. Checked
 *     IDC, Capterra, SIDBI, ICRIER, WEF, NITI Aayog and India SME Forum. Price from our
 *     own deals or say nothing.
 */

export type Source = {
  publisher: string;
  year: string;
  url: string;
  /** independent = no commercial interest in the answer. vendor = sells the cure. */
  kind: 'independent' | 'vendor';
  /** shown on hover so a sceptic can check us */
  method?: string;
};

export type Stat = {
  figure: string;
  claim: string;
  source: Source;
};

/* ---------------------------------------------------------------- the problem */

export const HERO = {
  kicker: 'Agentic Cockpit · by ZippyScale',
  headline: 'Your business runs on five apps that don’t talk to each other.',
  sub:
    'Tally here. Excel there. WhatsApp on somebody’s phone. A POS at the counter. ' +
    'Every one of them holds a piece of the truth, and nobody holds all of it. ' +
    'We replace that with one system built only for your business.',
  cta: 'Book a discovery call',
  ctaSub: 'From $730 to build. No obligation on the call.',
};

/** The words real owners use. Quoting people beats describing them. */
export const VOICES = [
  {
    quote: 'they were overwhelmed with juggling 5 different apps/platforms that don’t talk to each other.',
    where: 'Business owner, public forum',
    url: 'https://news.ycombinator.com/item?id=47867635',
  },
  {
    quote: 'most of them have only gotten to double data entry (from triple data entry before)',
    where: 'Business owner, public forum',
    url: 'https://news.ycombinator.com/item?id=37030319',
  },
  {
    quote: 'everyone has different systems and none of them talk to each other.',
    where: 'Business owner, public forum',
    url: 'https://news.ycombinator.com/item?id=23298639',
  },
  {
    quote:
      'you don’t get a bill for unhappy employees context-switching all day, so... ' +
      'Not every cost is charged directly to your credit card',
    where: 'Business owner, public forum',
    url: 'https://news.ycombinator.com/item?id=22411975',
  },
  {
    quote: 'leads falling through the cracks, misformatted emails, crossed lines of communication, forgetting to follow up',
    where: 'Business owner, public forum',
    url: 'https://news.ycombinator.com/item?id=12021736',
  },
];

/** The five that survive a click-through. Ordered by how hard they hit. */
export const EVIDENCE: Stat[] = [
  {
    figure: '4 hours a week',
    claim: 'lost per person to switching between applications. About 9% of the working week.',
    source: {
      publisher: 'Harvard Business Review',
      year: '2022',
      url: 'https://hbr.org/2022/08/how-much-time-and-energy-do-we-waste-toggling-between-applications',
      kind: 'vendor',
      method: '20 teams, 137 users, three Fortune 500 companies, observed up to five weeks. Note: the lead author founded Soroco, which sells both the telemetry that produced this data and the remedy',
    },
  },
  {
    /* Replaced the India SME Forum "harder than finding customers" figure on 2026-09-28.
       That report describes its own sampling as "convenience-based, voluntary… indicative
       rather than statistically representative", prints three different values for one age
       variable, and cites two documents that do not exist as described. It was the weakest
       number on this page. This one is a government census by comparison. */
    figure: '39.4%',
    claim:
      'of India’s 7.92 crore small establishments use the internet for business at all. ' +
      'Most of the rest run on paper, which is a harder starting point than any software problem.',
    source: {
      publisher: 'Ministry of Statistics, Government of India',
      year: 'ASUSE 2025',
      url: 'https://www.mospi.gov.in/uploads/latestReleases/latest_release_1774347321466_c16ddf22-bfff-4097-88a7-b3134e464d51_Press_Note_ASUSE_2025_English.pdf',
      kind: 'independent',
      method: '670,289 establishments across 24,153 sampling units, surveyed Jan to Dec 2025',
    },
  },
  {
    figure: '71%',
    claim:
      'of Indian businesses still run spreadsheets alongside their CRM. Reported by the largest ' +
      'all-in-one software vendor in India, about its own market.',
    source: {
      publisher: 'Zoho',
      year: '2024',
      url: 'https://prezohoweb.zoho.com/news/zoho-survey-reveals-that-high-cost-of-software-a-top-hurdle.html',
      kind: 'vendor',
      method: '5,149 Indian MSMEs surveyed April–June 2024',
    },
  },
  {
    figure: 'About 60%',
    claim: 'of small and mid-sized businesses regret a software purchase made in the last 18 months.',
    source: {
      publisher: 'Capterra (Gartner)',
      year: '2025',
      url: 'https://www.capterra.com/resources/tech-trends-smb-enterprise-software-purchase-tips/',
      kind: 'independent',
      method: '3,500 businesses globally, including 350 in India',
    },
  },
  {
    figure: '65 million / 5 million',
    claim: 'small businesses in India. About five million of them sell online.',
    source: {
      publisher: 'Meta & Bain',
      year: '2024',
      url: 'https://about.fb.com/wp-content/uploads/2024/05/Win-With-Conversations-Report_2024.pdf',
      kind: 'vendor',
      method: '7,800 users and 150 businesses surveyed in India',
    },
  },
];

/* ---------------------------------------------------------------- the answer */

export const WHAT_IT_IS = {
  title: 'One system. One record. Everyone sees their slice of it.',
  body:
    'An Agentic Cockpit is not software you configure. It is a system built for one business, ' +
    'yours, around the way you already sell. Your stock, your stages, your people, your words. ' +
    'Everyone signs in to the same thing and sees exactly what their job needs, and nothing else.',
  pillars: [
    {
      t: 'Everything they sell, in one record',
      d: 'Every car, piece, property or treatment with its own record: photographs, specification, history, price. A completeness score shows what a buyer is still not being told.',
    },
    {
      t: 'Every customer, however they arrive',
      d: 'A walk-in, a WhatsApp enquiry and a website form from the same phone number become one person, not three records. Their whole history sits on one screen.',
    },
    {
      t: 'Every deal, on one board',
      d: 'From first enquiry to delivered, with the stages named the way your floor already names them. Nothing sits in someone’s head.',
    },
    {
      t: 'Every conversation, written down',
      d: 'What was said, when you go back, and what the customer actually wants. Follow-ups are scored, so a manager can see who is having real conversations.',
    },
    {
      t: 'Roles that actually restrict',
      d: 'The owner decides who sees cost and margin, who sees whose customers, who can change a price. Changed in a click, not a support ticket.',
    },
    {
      t: 'A record of every change',
      d: 'Who edited what, when, and what it was before. One screen, filterable by person and date.',
    },
  ],
};

/* ---------------------------------------------------------------- the agents */

export const AGENTS_INTRO = {
  title: 'Ten specialists that do the work nobody gets round to.',
  body:
    'Not a chatbot. Ten narrow workers, each doing one job well, each explaining its reasoning ' +
    'step by step. They propose; a person approves. Anything that would reach a customer always ' +
    'waits for a human, whatever its settings say.',
  /* HONESTY: this roster is built and tested. It is not deployed with a client, and these are
     deterministic rule engines rather than language models. Do not write "AI agents",
     "deployed" or "autonomous" anywhere on this page. */
  honesty:
    'Built and tested as a working prototype for a corporate-gifting firm. Each agent explains ' +
    'every step it took, so you can see why it proposed what it did.',
  roster: [
    { n: 'Brief',        d: 'Turns a message into a structured requirement, and asks what is missing.' },
    { n: 'Curator',      d: 'Ranks options on fit, margin, stock and lead time.' },
    { n: 'Proposal',     d: 'Builds the quote with quantity bands, tax and a cover note.' },
    { n: 'Compliance',   d: 'Checks the rules before anything goes out: limits, tax codes, margin floor.' },
    { n: 'Sourcing',     d: 'Runs the RFQ, compares vendor bids, recommends a winner.' },
    { n: 'Intake',       d: 'Reads a messy vendor price list, maps the columns, removes duplicates.' },
    { n: 'Follow-up',    d: 'Drafts the nudge with the context, and escalates after two misses.' },
    { n: 'Order watch',  d: 'Catches a slipped date, stuck artwork or a failed check.' },
    { n: 'Reorder',      d: 'Finds the customers due on last year’s date and drafts the approach.' },
    { n: 'Morning brief',d: 'Pipeline, risks, approvals, and the one thing to do today.' },
  ],
  safety: [
    'Off, Suggest or Auto, set per agent, by the owner.',
    'Anything client-facing queues for approval, whatever the setting.',
    'Every run keeps its reasoning, so you can see why.',
    'A rejected suggestion is not re-proposed on the next sweep.',
  ],
};

/* ---------------------------------------------------------------- comparison */

/** A one-sided table reads as advertising. Name what the alternatives genuinely do better. */
export const COMPARISON = {
  title: 'What a cockpit does that the big platforms do not',
  /* Wins only, by Bhargav's call on 2026-10-01. Every row describes something that is
     built in the cockpit today (see ~/agentic-cockpit/zippyscale): keep it that way. */
  rows: [
    { q: 'Built around how you already sell',        us: true, them: false, note: 'Your stages, your words, your fields, not a template you bend into shape.' },
    { q: 'One customer record across every channel', us: true, them: false, note: 'Most stacks hold the same person three times.' },
    { q: 'Live in weeks, not quarters',              us: true, them: false, note: 'Small scope, one business, no systems integrator.' },
    { q: 'Priced for a 10–30 person business',       us: true, them: false, note: 'No per-seat licence that punishes you for hiring.' },
    { q: 'Agents that wait for your yes',            us: true, them: false, note: 'Anything that would reach a customer queues for a person to approve, whatever the settings say.' },
    { q: 'WhatsApp and Instagram on the same record', us: true, them: false, note: 'Every conversation lands on the customer it belongs to, assigned to one person. Elsewhere that is usually a higher tier or a paid connector.' },
    { q: 'Your data, mirrored to a sheet you own',   us: true, them: false, note: 'Every client and deal is copied to your own Google Sheet as it changes. Deletions are marked, never wiped.' },
    { q: 'Nothing deleted for good',                 us: true, them: false, note: 'Anything removed sits in a bin for 30 days and comes back in one click. Only the owner can delete.' },
    { q: 'Changed by the people who built it',       us: true, them: false, note: 'Ask for a new field, stage or report and it is done in days, not a ticket to a partner network.' },
  ],
};

/* ---------------------------------------------------------------- pricing */

export const PRICING = {
  /* Priced in USD because clients are in India, the Gulf and beyond, and one
     currency means one number to defend. Everything else on the page is a
     conversion, labelled as one. */
  setupUsd: 730,
  setupLead: 'Starts from',
  setupNote: 'one-time, to build and deploy your cockpit. Final price follows the scope we agree in discovery.',
  monthlyFrom: 73,
  monthlyTo: 100,
  monthlyNote: 'per month. Unlimited users, unlimited roles, technical support',
  annualUsd: 630,
  annualNote: 'per year if you pay annually, instead of monthly',
  /** ASSUMPTION — confirm before this goes live.
   *  Bhargav gave "$73–$100/month" and "yearly maintenance and technical support
   *  starting at $630/year". Those overlap (both include support), so this page
   *  presents the annual figure as the ALTERNATIVE to paying monthly, not an extra
   *  charge on top. $630/yr ≈ $52.50/mo, a sensible discount on $73. If it is
   *  actually an AMC charged in addition, change `annualIsAlternative` to false. */
  annualIsAlternative: true,
  includes: [
    'Discovery first, then a system built to what we find',
    'Your real data in it before you ever see a demo',
    'Unlimited users and unlimited roles, so hiring costs you nothing',
    'The agent roster that fits your trade',
    'Training your team on their own screens',
    'Changes as you learn what you actually need',
  ],
  /* Only figures the research could verify on the vendor's own pricing page.
     Zoho and Salesforce India pricing came back from partner blogs, not official
     sources, so they are deliberately absent. Get written quotes before adding them. */
  against: [
    {
      name: 'HubSpot Sales Professional',
      cost: '$90 per seat / month, plus a mandatory $1,500 onboarding fee',
      note: 'The onboarding fee alone is more than twice our entire build.',
      verified: true,
      url: 'https://www.hubspot.com/pricing/sales',
      /** what 10 people costs for a year, for the honest comparison */
      yearTen: 10 * 90 * 12 + 1500,
    },
    {
      name: 'Odoo',
      cost: '$7–$20 per user / month',
      note: 'Cheapest licence here, but a small-business implementation runs $1,000 to $3,200, and every integration is quoted on top.',
      verified: true,
      url: 'https://www.odoo.com/pricing',
      yearTen: 10 * 14 * 12 + 2000,
    },
    {
      name: 'GoHighLevel',
      cost: '$97–$497 per month',
      note: 'Plus per-message charges. And you still build the whole thing yourself.',
      verified: true,
      url: 'https://www.gohighlevel.com/pricing',
      yearTen: 297 * 12,
    },
    {
      name: 'A custom build',
      cost: '$2,400–$6,000 for a first version',
      note: 'Then you own the maintenance of something nobody else understands.',
      verified: false,
      url: '',
      yearTen: 4000,
    },
  ],
  /** ours, for 10 people, first year — setup + twelve months at the entry tier */
  ourYearTen: 730 + 73 * 12,
  honesty:
    'HubSpot, Odoo and GoHighLevel figures come from each vendor’s own published ' +
    'pricing page. The links are live, go and check. Zoho and Salesforce India ' +
    'pricing is left out because we could not verify it at source, and we would ' +
    'rather show nothing than a number we cannot stand behind.',
};

/* ---------------------------------------------------------------- proof */

/** Anonymised by choice: sector and real figures, no client names. */
export const PROOF = {
  title: 'Built, running, and carrying real data',
  note:
    'Clients are not named here. The figures are theirs and they are real, taken from the ' +
    'systems as built, not rounded up for a website.',
  cases: [
    {
      sector: 'Pre-owned luxury car dealer, Hyderabad',
      figures: ['37 cars', '₹16.78 Cr of stock', '546 photographs'],
      built:
        'Public catalogue plus a five-role console: editable 56-field car records with a live ' +
        'completeness score, a floor that is the pipeline, follow-ups scored out of ten, targets, ' +
        'reports and an activity log.',
    },
    {
      sector: 'Corporate gifting firm, Mumbai',
      figures: ['~1 lakh SKUs', '300–400 vendors'],
      built:
        'A product discovery portal over their full catalogue, live behind their client portal. ' +
        'A ten-agent operating layer, from brief intake through to reorder, built and tested as a prototype.',
    },
    {
      sector: 'Saree house, six branches, Hyderabad',
      figures: ['6 branches', '261 products'],
      built:
        'Walk-in floor with allocation, consultant and billing desks, a client profile that follows ' +
        'the customer between branches, and an automation layer with 19 triggers.',
    },
  ],
};

/* ---------------------------------------------------------------- objections */

export const OBJECTIONS = [
  {
    q: 'We have years of history in Tally. We are not throwing that away.',
    a:
      'You are not. Tally stays the book of record. It is the accounting standard here for good ' +
      'reason, and your auditor will keep asking for it. We own everything upstream: the enquiry, ' +
      'the customer, the deal, the follow-up. Tally keeps the money. The honest caveat is that ' +
      'Tally integrates over XML on a specific machine on your network, not over the cloud, so any ' +
      'sync is scheduled rather than instant. Anyone who tells you otherwise has not built one.',
  },
  {
    q: 'Jack of all trades, master of none.',
    a:
      'Fair, and partly true. Salesforce will out-feature us at enterprise CRM. But a business with ' +
      'fifteen staff does not need enterprise CRM. It needs one customer record the showroom, the ' +
      'workshop and the accounts desk all see. Best-in-class at the wrong problem is still the ' +
      'wrong problem.',
  },
  {
    q: 'What if ZippyScale disappears?',
    a:
      'A fair question to ask a Hyderabad agency and not a listed company. So: the database is ' +
      'yours, the schema is documented, and you can export everything on demand, any time, without ' +
      'asking us. Put it in the contract. A system you cannot leave is not a system you should buy.',
  },
  {
    q: 'We have been burned by an implementation before.',
    a:
      'Most people have. About 60% of businesses your size regret a software purchase from the ' +
      'last eighteen months, and they blame the implementation more than the software. So we do it ' +
      'backwards: your real data goes in first, you see your own business on screen before you ' +
      'commit to anything, and the scope is one business rather than a platform rollout.',
  },
  {
    q: 'My team will not use it.',
    a:
      'They will not, if it is extra work. So the stages are named what your floor already calls ' +
      'them, the screens show one person one job, and anything that used to be a WhatsApp message ' +
      'stays a WhatsApp message. If your team is not already tracking anything on paper or a sheet, ' +
      'we will tell you to start there first, for free, before you spend on software.',
  },
];

export const CTA = {
  title: 'Start with a conversation, not a demo.',
  body:
    'Tell us what your business does and where it leaks. We will look at what you already run, ' +
    'and if a cockpit is the wrong answer we will say so. Sometimes the honest answer is a ' +
    'spreadsheet, or the software you already pay for.',
  button: 'Book a discovery call',
};
