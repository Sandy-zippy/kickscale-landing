import { lazy } from 'react'
import type { CaseStudySlug } from '../../../pages/case-studies/types'

export const heroVariants: Record<CaseStudySlug, React.LazyExoticComponent<React.ComponentType>> = {
  'homeopathic-clinic-patient-flow': lazy(() => import('./homeopathic')),
  'coaching-institute-admission-to-enrollment': lazy(() => import('./coaching')),
  'auto-parts-distribution-order-automation': lazy(() => import('./auto-parts')),
  'hvac-manufacturing-po-to-production-automation': lazy(() => import('./hvac')),
  'rice-mill-fmcg-production-distributor-automation': lazy(() => import('./rice-mill')),
  'pharma-distributor-field-orders': lazy(() => import('./pharma')),
  'd2c-apparel-beauty-retention-automation': lazy(() => import('./d2c')),
  'professional-services-lead-to-cash': lazy(() => import('./prof-services')),
  'hospitality-fnb-reservations-loyalty-stack': lazy(() => import('./hospitality')),
  'corporate-travel-quotes-reconciliation': lazy(() => import('./corporate-travel')),
}
