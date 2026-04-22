import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { CaseStudySlug } from '../../pages/case-studies/types'

interface SliderConfig {
  label: string
  min: number
  max: number
  step: number
  default: number
  format?: (v: number) => string
}

interface ROIConfig {
  // Three sliders
  volume: SliderConfig    // monthly transactions (consults, orders, leads, reservations, etc.)
  ticket: SliderConfig    // average value per transaction (₹)
  hoursLost: SliderConfig // hrs/week your team loses to manual work
  // Recovery model — % of volume recovered (e.g. 0.15 means 15% no-show recovery on consults)
  recoveryRate: number
  recoveryLabel: string   // explains what the recovery is
  // Cycle lift model — % of volume that becomes a second touch + lift on that touch
  cycleEligible: number
  cycleLift: number
  cycleLabel: string
  // Industry-specific intro line
  intro: string
}

const formatINR = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${Math.round(n)}`
}

const ROI_CONFIGS: Partial<Record<CaseStudySlug, ROIConfig>> = {
  'homeopathic-clinic-patient-flow': {
    intro: 'Move 3 sliders. We compute recovered no-shows, refill cycle lift, and hours back at ₹500/hr blended cost.',
    volume: { label: 'Booked consults per month', min: 50, max: 1500, step: 25, default: 300 },
    ticket: { label: 'Average consult fee', min: 300, max: 5000, step: 100, default: 1000, format: (v) => `₹${v}` },
    hoursLost: { label: 'Hours/week your team spends on triage + reminders', min: 5, max: 60, step: 1, default: 25, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.15,
    recoveryLabel: 'Recovered no-shows (30% to <15%)',
    cycleEligible: 0.2,
    cycleLift: 0.3,
    cycleLabel: 'Refill + follow-up cycle lift',
  },
  'coaching-institute-admission-to-enrollment': {
    intro: 'Move the sliders. We compute extra enrollments from faster lead routing, fee collection lift, and counsellor hours back.',
    volume: { label: 'Admission inquiries / month', min: 50, max: 2000, step: 50, default: 400 },
    ticket: { label: 'Average programme fee', min: 5000, max: 200000, step: 1000, default: 30000, format: (v) => `₹${(v/1000).toFixed(0)}K` },
    hoursLost: { label: 'Counsellor hrs/wk on follow-up + reminders', min: 10, max: 120, step: 2, default: 40, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.08,
    recoveryLabel: 'Extra enrollments (faster routing + reminders)',
    cycleEligible: 0.15,
    cycleLift: 0.4,
    cycleLabel: 'Fee collection lift + dropout prevention',
  },
  'auto-parts-distribution-order-automation': {
    intro: 'Move the sliders. We compute saved order entry hours, recovered missed orders, and faster collections.',
    volume: { label: 'Dealer orders / month', min: 100, max: 3000, step: 50, default: 800 },
    ticket: { label: 'Average order value', min: 1000, max: 50000, step: 500, default: 8000, format: (v) => `₹${(v/1000).toFixed(0)}K` },
    hoursLost: { label: 'Sales + accounts hrs/wk on Excel→Tally', min: 10, max: 80, step: 2, default: 30, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.08,
    recoveryLabel: 'Recovered missed orders (parser + auto-confirm)',
    cycleEligible: 0.4,
    cycleLift: 0.1,
    cycleLabel: 'Faster collections (auto credit-control)',
  },
  'hvac-manufacturing-po-to-production-automation': {
    intro: 'Move the sliders. We compute won deals from faster quotes, sales head hours back, and PO-to-production lag eliminated.',
    volume: { label: 'Quote requests / month', min: 10, max: 200, step: 5, default: 40 },
    ticket: { label: 'Average project value', min: 50000, max: 2000000, step: 25000, default: 250000, format: (v) => `₹${(v/100000).toFixed(1)}L` },
    hoursLost: { label: 'Sales head hrs/wk on quotes + relays', min: 10, max: 60, step: 2, default: 25, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.04,
    recoveryLabel: 'Extra deals won (4hr quotes vs 2-day)',
    cycleEligible: 0.2,
    cycleLift: 0.15,
    cycleLabel: 'Repeat orders (cleaner customer relationships)',
  },
  'rice-mill-fmcg-production-distributor-automation': {
    intro: 'Move the sliders. We compute working capital unlocked from faster month-end, distributor collection acceleration, and admin hours back.',
    volume: { label: 'Distributor orders / month', min: 50, max: 1500, step: 50, default: 400 },
    ticket: { label: 'Average order value', min: 5000, max: 100000, step: 1000, default: 25000, format: (v) => `₹${(v/1000).toFixed(0)}K` },
    hoursLost: { label: 'Admin hrs/wk on Excel→Tally + reconciliation', min: 10, max: 80, step: 2, default: 35, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.06,
    recoveryLabel: 'Missed orders recovered (auto-confirm + parser)',
    cycleEligible: 0.5,
    cycleLift: 0.08,
    cycleLabel: 'DSO improvement (auto distributor statements)',
  },
  'pharma-distributor-field-orders': {
    intro: 'Move the sliders. We compute SKU error reduction, near-expiry savings, and field MR hours back.',
    volume: { label: 'Retail orders / month', min: 100, max: 3000, step: 50, default: 1000 },
    ticket: { label: 'Average order value', min: 2000, max: 50000, step: 500, default: 12000, format: (v) => `₹${(v/1000).toFixed(0)}K` },
    hoursLost: { label: 'MR + admin hrs/wk on photo→Tally', min: 15, max: 100, step: 5, default: 50, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.05,
    recoveryLabel: 'SKU error eliminated (5-8% baseline)',
    cycleEligible: 0.1,
    cycleLift: 0.2,
    cycleLabel: 'Near-expiry write-off prevention (90-day alerts)',
  },
  'd2c-apparel-beauty-retention-automation': {
    intro: 'Move the sliders. We compute cart recovery revenue, founder hours back, and replenishment cycle lift.',
    volume: { label: 'Monthly orders (Shopify)', min: 100, max: 5000, step: 50, default: 800 },
    ticket: { label: 'Average order value (AOV)', min: 500, max: 10000, step: 100, default: 1800, format: (v) => `₹${v}` },
    hoursLost: { label: 'Founder + CX hrs/wk on DMs + cart chase', min: 5, max: 50, step: 1, default: 18, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.15,
    recoveryLabel: 'Cart recovery (12-18% of abandoned)',
    cycleEligible: 0.25,
    cycleLift: 0.3,
    cycleLabel: 'Replenishment + repeat lift (D+25 nudge)',
  },
  'professional-services-lead-to-cash': {
    intro: 'Move the sliders. We compute closed deals from faster proposals, partner hours back, and DSO improvement.',
    volume: { label: 'Qualified leads / month', min: 5, max: 80, step: 1, default: 18 },
    ticket: { label: 'Average engagement value', min: 25000, max: 1000000, step: 25000, default: 200000, format: (v) => `₹${(v/100000).toFixed(1)}L` },
    hoursLost: { label: 'Partner + ops hrs/wk on lead admin', min: 5, max: 50, step: 1, default: 15, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.12,
    recoveryLabel: 'Extra deals won (proposal in 1 day vs 7)',
    cycleEligible: 0.4,
    cycleLift: 0.1,
    cycleLabel: 'DSO improvement (10-15 days)',
  },
  'hospitality-fnb-reservations-loyalty-stack': {
    intro: 'Move the sliders. We compute recovered tables, repeat customer revenue lift, and hostess hours back.',
    volume: { label: 'Covers / month (across outlets)', min: 500, max: 15000, step: 100, default: 3000 },
    ticket: { label: 'Average ticket per cover', min: 200, max: 3000, step: 50, default: 800, format: (v) => `₹${v}` },
    hoursLost: { label: 'Hostess + manager hrs/wk on triage + recon', min: 10, max: 80, step: 2, default: 30, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.05,
    recoveryLabel: 'Recovered tables (Wed DM caught Friday)',
    cycleEligible: 0.3,
    cycleLift: 0.2,
    cycleLabel: 'Repeat visit lift (loyalty + birthdays)',
  },
  'corporate-travel-quotes-reconciliation': {
    intro: 'Move the sliders. We compute won deals from faster quotes, agent hours back, and vendor rebate recovery.',
    volume: { label: 'RFQs / month', min: 20, max: 500, step: 10, default: 120 },
    ticket: { label: 'Average booking value', min: 5000, max: 200000, step: 1000, default: 35000, format: (v) => `₹${(v/1000).toFixed(0)}K` },
    hoursLost: { label: 'Agent + accountant hrs/wk on quotes + recon', min: 10, max: 100, step: 5, default: 40, format: (v) => `${v} hrs/wk` },
    recoveryRate: 0.1,
    recoveryLabel: 'Won deals recovered (4hr vs 36hr quote turnaround)',
    cycleEligible: 0.6,
    cycleLift: 0.05,
    cycleLabel: 'Vendor rebates auto-claimed (3-6% margin recovery)',
  },
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (v: number) => string
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 gap-3">
        <label className="text-sm font-semibold text-[#1A1A2E] leading-tight">{label}</label>
        <span className="font-mono font-bold text-[#1A1A2E] text-base shrink-0 tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[#E5E7EB] rounded-full appearance-none cursor-pointer accent-[#D5EB4B]"
        aria-label={label}
      />
    </div>
  )
}

export default function IndustryROICalculator({ slug }: { slug: CaseStudySlug }) {
  const config = ROI_CONFIGS[slug]
  const [volume, setVolume] = useState(config?.volume.default ?? 300)
  const [ticket, setTicket] = useState(config?.ticket.default ?? 1000)
  const [hoursLost, setHoursLost] = useState(config?.hoursLost.default ?? 25)

  const result = useMemo(() => {
    if (!config) return { recoveryRevenue: 0, cycleRevenue: 0, hoursValue: 0, monthlyValue: 0, monthlyNet: 0, paybackMonths: Infinity }
    const recoveryRevenue = volume * ticket * config.recoveryRate
    const cycleRevenue = volume * config.cycleEligible * ticket * config.cycleLift
    const hoursValue = hoursLost * 4 * 500
    const monthlyValue = recoveryRevenue + cycleRevenue + hoursValue
    const recurring = 16000
    const sprint = 150000
    const monthlyNet = monthlyValue - recurring
    const paybackMonths = monthlyNet > 0 ? sprint / monthlyNet : Infinity
    return { recoveryRevenue, cycleRevenue, hoursValue, monthlyValue, monthlyNet, paybackMonths }
  }, [volume, ticket, hoursLost, config])

  if (!config) return null

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-10 grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-[#1A1A2E] mb-2">Do the math for your business</h2>
        <p className="text-sm text-[#6B7280] mb-6">{config.intro} We do not store your inputs.</p>
        <div className="space-y-6">
          <Slider {...config.volume} value={volume} onChange={setVolume} />
          <Slider {...config.ticket} value={ticket} onChange={setTicket} />
          <Slider {...config.hoursLost} value={hoursLost} onChange={setHoursLost} />
        </div>
      </div>
      <div className="bg-[#FFFDF7] rounded-xl p-6 lg:p-8 flex flex-col">
        <p className="text-xs font-mono uppercase tracking-wider text-[#B8CF2E] mb-4">
          Your monthly recovered value
        </p>
        <motion.p
          key={Math.round(result.monthlyValue)}
          initial={{ opacity: 0.5, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="text-5xl lg:text-6xl font-mono font-bold text-[#1A1A2E] mb-6 leading-none tabular-nums"
        >
          {formatINR(result.monthlyValue)}
        </motion.p>
        <ul className="space-y-3 text-sm text-[#4B5563] mb-6">
          <li className="flex justify-between gap-4">
            <span>{config.recoveryLabel}</span>
            <span className="font-mono font-semibold text-[#1A1A2E] tabular-nums">{formatINR(result.recoveryRevenue)}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>{config.cycleLabel}</span>
            <span className="font-mono font-semibold text-[#1A1A2E] tabular-nums">{formatINR(result.cycleRevenue)}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Hours back at ₹500/hr blended cost</span>
            <span className="font-mono font-semibold text-[#1A1A2E] tabular-nums">{formatINR(result.hoursValue)}</span>
          </li>
        </ul>
        <div className="mt-auto pt-6 border-t border-[#E5E7EB] space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Recurring cost</span>
            <span className="font-mono text-[#6B7280]">₹16K/mo</span>
          </div>
          <div className="flex justify-between font-bold text-[#1A1A2E]">
            <span>Net monthly value</span>
            <span className="font-mono tabular-nums">{formatINR(result.monthlyNet)}</span>
          </div>
          <div className="flex justify-between text-[#B8CF2E] font-bold">
            <span>One-time sprint pays back in</span>
            <span className="font-mono">
              {result.paybackMonths === Infinity || result.paybackMonths > 24
                ? '24+ months'
                : `${result.paybackMonths.toFixed(1)} months`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
