import type { CaseStudySlug } from '../../pages/case-studies/types'

export interface MotifConfig {
  Icon: React.ComponentType<{ className?: string }>
  bgGradient: string  // tailwind classes for the hero card background gradient
  accentTint: string  // hex color for industry accent
}

// Heroicons-style outline icons, sized for use as both small badge + large bg watermark
const HealthcareIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M19 6h10v8h8v10h-8v8H19v-8h-8V14h8V6z" />
    <circle cx="24" cy="36" r="3" />
  </svg>
)

const EducationIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 18l20-9 20 9-20 9-20-9z" />
    <path d="M12 22v10c0 3 6 6 12 6s12-3 12-6V22" />
    <path d="M44 18v12" />
  </svg>
)

const ManufacturingIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="24" cy="24" r="6" />
    <path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.86 9.86l4.24 4.24M33.9 33.9l4.24 4.24M9.86 38.14l4.24-4.24M33.9 14.1l4.24-4.24" />
  </svg>
)

const PharmaIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="6" y="18" width="36" height="14" rx="7" />
    <line x1="24" y1="18" x2="24" y2="32" />
  </svg>
)

const D2cIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M10 18h28l-2 22a3 3 0 01-3 3H15a3 3 0 01-3-3L10 18z" />
    <path d="M16 18a8 8 0 0116 0" />
  </svg>
)

const ServicesIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="6" y="14" width="36" height="28" rx="3" />
    <path d="M18 14V8a2 2 0 012-2h8a2 2 0 012 2v6" />
    <line x1="6" y1="26" x2="42" y2="26" />
  </svg>
)

const HospitalityIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M10 14h24v14a10 10 0 01-10 10h-4a10 10 0 01-10-10V14z" />
    <path d="M34 18h4a4 4 0 010 8h-4" />
    <line x1="14" y1="6" x2="14" y2="10" />
    <line x1="22" y1="6" x2="22" y2="10" />
    <line x1="30" y1="6" x2="30" y2="10" />
  </svg>
)

const TravelIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M44 26L4 30l4-6 22-2 8-14h4l-4 14 8 4-2 0z" />
    <line x1="14" y1="38" x2="20" y2="34" />
  </svg>
)

const MOTIFS: Record<CaseStudySlug, MotifConfig> = {
  'homeopathic-clinic-patient-flow': {
    Icon: HealthcareIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#F5F9F2] to-[#E8F5E9]',
    accentTint: '#22C55E',
  },
  'coaching-institute-admission-to-enrollment': {
    Icon: EducationIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#F0F4FF] to-[#E0EAFF]',
    accentTint: '#6366F1',
  },
  'auto-parts-distribution-order-automation': {
    Icon: ManufacturingIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#FFF7E6] to-[#FFEED1]',
    accentTint: '#F59E0B',
  },
  'hvac-manufacturing-po-to-production-automation': {
    Icon: ManufacturingIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#F0F4F8] to-[#DDE4ED]',
    accentTint: '#475569',
  },
  'rice-mill-fmcg-production-distributor-automation': {
    Icon: ManufacturingIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#FAF7EE] to-[#F2EBD3]',
    accentTint: '#A16207',
  },
  'pharma-distributor-field-orders': {
    Icon: PharmaIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#F0FDFA] to-[#CCFBF1]',
    accentTint: '#0D9488',
  },
  'd2c-apparel-beauty-retention-automation': {
    Icon: D2cIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#FFF1F5] to-[#FCE4EC]',
    accentTint: '#EC4899',
  },
  'professional-services-lead-to-cash': {
    Icon: ServicesIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#F8FAFC] to-[#E2E8F0]',
    accentTint: '#64748B',
  },
  'hospitality-fnb-reservations-loyalty-stack': {
    Icon: HospitalityIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#FFF8E6] to-[#FFE8B8]',
    accentTint: '#D97706',
  },
  'corporate-travel-quotes-reconciliation': {
    Icon: TravelIcon,
    bgGradient: 'bg-gradient-to-br from-[#FFFDF7] via-[#EFF6FF] to-[#BFDBFE]',
    accentTint: '#3B82F6',
  },
}

export function getMotif(slug: CaseStudySlug): MotifConfig {
  return MOTIFS[slug]
}

interface IconProps { slug: CaseStudySlug; className?: string }
export function IndustryIcon({ slug, className }: IconProps) {
  const { Icon } = MOTIFS[slug]
  return <Icon className={className} />
}
