export type CaseStudySlug =
  | 'homeopathic-clinic-patient-flow'
  | 'coaching-institute-admission-to-enrollment'
  | 'auto-parts-distribution-order-automation'
  | 'hvac-manufacturing-po-to-production-automation'
  | 'rice-mill-fmcg-production-distributor-automation'
  | 'pharma-distributor-field-orders'
  | 'd2c-apparel-beauty-retention-automation'
  | 'professional-services-lead-to-cash'
  | 'hospitality-fnb-reservations-loyalty-stack'
  | 'corporate-travel-quotes-reconciliation'

export type CaseStudyIndustry =
  | 'Healthcare' | 'Education' | 'Manufacturing' | 'Pharma'
  | 'D2C' | 'Services' | 'Hospitality' | 'Travel'

export interface CaseStudyMetadata {
  slug: CaseStudySlug
  title: string
  shortTitle: string
  industry: CaseStudyIndustry
  primaryPain: string
  heroStatBefore: string
  heroStatAfter: string
  heroStatLabel: string
  seoTitle: string
  seoDescription: string
  ogImage: string
  publishedAt: string
  related: CaseStudySlug[]
  hookVariants: { A: string; B: string }
}

export interface CaseStudyContent {
  sixtySecondSummary: { who: string; whatBroke: string; whatWeBuilt: string; whatChanged: string }
  icpSnapshot: { revenue: string; team: string; geography: string; currentStack: string[] }
  painNarrative: string
  painQuotes: Array<{ quote: string; attribution: string }>
  beforeStateSteps: Array<{ step: string; timeCost: string }>
  stackTools: Array<{
    name: string
    role: 'CRM' | 'Automation' | 'Messaging' | 'ERP' | 'Payment' | 'Analytics' | 'AI'
    screenshot?: string
    description: string
  }>
  sprintPlan: Array<{ week: 1 | 2 | 3 | 4; title: string; deliverables: string[] }>
  targetOutcomes: Array<{ metric: string; before: string; after: string; caveat?: string }>
  objections: Array<{ objection: string; rebuttal: string }>
  faqs?: Array<{ question: string; answer: string }>
  proofElements: string[]
  downloads: Array<{ label: string; href: string; filetype: 'json' | 'csv' | 'pdf' }>
}
