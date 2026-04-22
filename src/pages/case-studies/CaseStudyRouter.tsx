import { useParams, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { registry } from './registry'
import type { CaseStudySlug } from './types'

const pageMap: Record<CaseStudySlug, React.LazyExoticComponent<React.ComponentType>> = {
  'homeopathic-clinic-patient-flow': lazy(() => import('./HomeopathicClinic')),
  'coaching-institute-admission-to-enrollment': lazy(() => import('./CoachingInstitute')),
  'auto-parts-distribution-order-automation': lazy(() => import('./AutoPartsDistribution')),
  'hvac-manufacturing-po-to-production-automation': lazy(() => import('./HvacManufacturing')),
  'rice-mill-fmcg-production-distributor-automation': lazy(() => import('./RiceMillFmcg')),
  'pharma-distributor-field-orders': lazy(() => import('./PharmaDistributor')),
  'd2c-apparel-beauty-retention-automation': lazy(() => import('./D2cApparelBeauty')),
  'professional-services-lead-to-cash': lazy(() => import('./ProfessionalServices')),
  'hospitality-fnb-reservations-loyalty-stack': lazy(() => import('./HospitalityFnb')),
  'corporate-travel-quotes-reconciliation': lazy(() => import('./CorporateTravel')),
}

export default function CaseStudyRouter() {
  const { slug } = useParams<{ slug: string }>()
  if (!slug || !(slug in registry)) return <Navigate to="/case-studies" replace />
  const Page = pageMap[slug as CaseStudySlug]
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFDF7]" />}>
      <Page />
    </Suspense>
  )
}
