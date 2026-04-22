import type { CaseStudyMetadata, CaseStudySlug } from './types'

const empty = (slug: CaseStudySlug): CaseStudyMetadata => ({
  slug,
  title: '',
  shortTitle: '',
  industry: 'Manufacturing',
  primaryPain: '',
  heroStatBefore: '',
  heroStatAfter: '',
  heroStatLabel: '',
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  publishedAt: '2026-04-22',
  related: [],
  hookVariants: { A: '', B: '' },
})

export const registry: Record<CaseStudySlug, CaseStudyMetadata> = {
  'homeopathic-clinic-patient-flow': {
    slug: 'homeopathic-clinic-patient-flow',
    title: 'How a 3-Doctor Homeopathic Clinic Could Recover 22 Hours a Week and Cut No-Shows in Half',
    shortTitle: 'Homeopathic Clinic: Patient Flow',
    industry: 'Healthcare',
    primaryPain: 'Patient WhatsApp backlog',
    heroStatBefore: '30%',
    heroStatAfter: '<15%',
    heroStatLabel: 'no-show rate',
    seoTitle: 'Healthcare: How Homeopathic Clinics Automate Patient WhatsApp | ZippyScale Case Study',
    seoDescription: 'Patient WhatsApp backlog at midnight, 30% no-shows, zero refill reminders. 4-week sprint for Indian specialty clinics at ₹50L-3Cr revenue.',
    ogImage: '/case-studies/og/homeopathic-clinic-patient-flow.png',
    publishedAt: '2026-04-22',
    related: ['pharma-distributor-field-orders', 'coaching-institute-admission-to-enrollment'],
    hookVariants: {
      A: "How Dr. [Founder] Stopped Answering WhatsApp at Midnight",
      B: "The 30% No-Show Problem Every Indian Clinic Pretends Is Normal",
    },
  },
  'coaching-institute-admission-to-enrollment': empty('coaching-institute-admission-to-enrollment'),
  'auto-parts-distribution-order-automation': empty('auto-parts-distribution-order-automation'),
  'hvac-manufacturing-po-to-production-automation': empty('hvac-manufacturing-po-to-production-automation'),
  'rice-mill-fmcg-production-distributor-automation': empty('rice-mill-fmcg-production-distributor-automation'),
  'pharma-distributor-field-orders': empty('pharma-distributor-field-orders'),
  'd2c-apparel-beauty-retention-automation': empty('d2c-apparel-beauty-retention-automation'),
  'professional-services-lead-to-cash': empty('professional-services-lead-to-cash'),
  'hospitality-fnb-reservations-loyalty-stack': empty('hospitality-fnb-reservations-loyalty-stack'),
  'corporate-travel-quotes-reconciliation': empty('corporate-travel-quotes-reconciliation'),
}

export function getMetadata(slug: string): CaseStudyMetadata | undefined {
  if (slug in registry) return registry[slug as CaseStudySlug]
  return undefined
}
