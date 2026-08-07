/**
 * The Giveaways library — free tools/portals where a visitor enters
 * information and gets something useful back.
 *
 * `href` points at a static page under /public/giveaways/<slug>/index.html,
 * so each tool is plain HTML and stays independent of the React app.
 */

export interface Giveaway {
  slug: string
  title: string
  forWho: string
  blurb: string
  emoji: string
  href: string
}

export const GIVEAWAYS: Giveaway[] = [
  {
    slug: 'clinic-retention-os',
    title: 'Client Retention OS',
    forWho: 'For clinics & healthcare practices',
    blurb:
      'Pick your speciality and get a complete retention playbook — where patients quietly drop off, the WhatsApp and call cadence that brings them back, and a plan you can download and hand to your front desk.',
    emoji: '🩺',
    href: '/giveaways/clinic-retention-os/',
  },
  {
    slug: 'luxury-retail-masterclass',
    title: 'Luxury Bespoke & Retail Master Class',
    forWho: 'For luxury retail & bespoke brand owners',
    blurb:
      'Every growth playbook we’ve built for luxury and bespoke retail — CRAFT, VALUE, REACH, FILTER, SIGNAL and more as we publish them. One login, addressed to your brand, with a self-audit that scores as you go.',
    emoji: '\u{1F48E}',
    href: '/giveaways/luxury-retail-masterclass/',
  },
]
