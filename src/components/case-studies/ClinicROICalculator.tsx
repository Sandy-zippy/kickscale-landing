import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

const formatINR = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${Math.round(n)}`
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
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-semibold text-[#1A1A2E]">{label}</label>
        <span className="font-mono font-bold text-[#1A1A2E] text-base">
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

export default function ClinicROICalculator() {
  const [patients, setPatients] = useState(300)
  const [fee, setFee] = useState(1000)
  const [hoursLost, setHoursLost] = useState(25)

  const result = useMemo(() => {
    // Recovered no-shows: 30% baseline → 15% target = 15% recovery on booked slots
    const noShowRecoveryPct = 0.15
    const recoveredNoShowRevenue = patients * fee * noShowRecoveryPct

    // Refill / follow-up cycle revenue: ~30% lift on second-visit conversion
    // Conservative: 20% of patients become refill / second-consult, lifted by 30%
    const refillCycleLift = patients * 0.2 * fee * 0.3

    // Hours back × ₹500/hr opportunity cost (front desk + doctor blended)
    const hoursValue = hoursLost * 4 * 500

    const monthlyValue = recoveredNoShowRevenue + refillCycleLift + hoursValue
    const recurringCost = 16000
    const sprintCost = 150000
    const monthlyNet = monthlyValue - recurringCost
    const paybackMonths = monthlyNet > 0 ? sprintCost / monthlyNet : Infinity

    return {
      recoveredNoShowRevenue,
      refillCycleLift,
      hoursValue,
      monthlyValue,
      monthlyNet,
      paybackMonths,
    }
  }, [patients, fee, hoursLost])

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 lg:p-10 grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div>
        <h3 className="text-2xl font-bold text-[#1A1A2E] mb-1">Do the math for your clinic</h3>
        <p className="text-sm text-[#6B7280] mb-6">Move the sliders. We do not store your inputs.</p>
        <div className="space-y-6">
          <Slider
            label="Booked consults per month"
            value={patients}
            min={50}
            max={1500}
            step={25}
            onChange={setPatients}
          />
          <Slider
            label="Average consult fee"
            value={fee}
            min={300}
            max={5000}
            step={100}
            format={(v) => `₹${v}`}
            onChange={setFee}
          />
          <Slider
            label="Hours/week your team spends on triage, reminders, follow-ups"
            value={hoursLost}
            min={5}
            max={60}
            step={1}
            format={(v) => `${v} hrs/wk`}
            onChange={setHoursLost}
          />
        </div>
      </div>
      <div className="bg-[#FFFDF7] rounded-xl p-6 lg:p-8 flex flex-col">
        <p className="text-xs font-mono uppercase tracking-wider text-[#B8CF2E] mb-4">
          Your monthly recovered value
        </p>
        <motion.p
          key={result.monthlyValue}
          initial={{ opacity: 0.5, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="text-5xl lg:text-6xl font-mono font-bold text-[#1A1A2E] mb-6 leading-none"
        >
          {formatINR(result.monthlyValue)}
        </motion.p>
        <ul className="space-y-3 text-sm text-[#4B5563] mb-6">
          <li className="flex justify-between gap-4">
            <span>Recovered no-shows (30% to under 15%)</span>
            <span className="font-mono font-semibold text-[#1A1A2E]">{formatINR(result.recoveredNoShowRevenue)}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Refill + follow-up cycle lift</span>
            <span className="font-mono font-semibold text-[#1A1A2E]">{formatINR(result.refillCycleLift)}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Hours back at ₹500/hr blended cost</span>
            <span className="font-mono font-semibold text-[#1A1A2E]">{formatINR(result.hoursValue)}</span>
          </li>
        </ul>
        <div className="mt-auto pt-6 border-t border-[#E5E7EB] space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">Recurring cost</span>
            <span className="font-mono text-[#6B7280]">₹16K/mo</span>
          </div>
          <div className="flex justify-between font-bold text-[#1A1A2E]">
            <span>Net monthly value</span>
            <span className="font-mono">{formatINR(result.monthlyNet)}</span>
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
