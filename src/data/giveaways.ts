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
]
