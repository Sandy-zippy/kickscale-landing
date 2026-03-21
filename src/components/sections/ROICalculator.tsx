import { useState, useRef, useCallback, useEffect } from 'react'
import ScrollReveal from '../ui/ScrollReveal'
import AnimatedCounter from '../ui/AnimatedCounter'
import { trackROICalculator } from '../../lib/tracking'

/* -- comparison table data -------------------------------- */

const rows = [
  { task: 'Lead follow-up', manual: '2-4 hours/day', ai: 'Instant, 24/7', saved: 'Save 3.5 hrs/day' },
  { task: 'Monthly reports', manual: '3 days to compile', ai: 'Auto-generated daily', saved: 'Save 3 days/month' },
  { task: 'Invoice processing', manual: '45 min per invoice', ai: '30 seconds', saved: 'Save 44 min each' },
  { task: 'Data entry', manual: '8 hours/week', ai: 'Zero', saved: 'Save 8 hrs/week' },
  { task: 'CRM updates', manual: 'Manual after calls', ai: 'Auto-synced real-time', saved: 'Save 1+ hr/day' },
]

/* -- slider input component ------------------------------- */

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  suffix,
  prefix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  prefix?: string
  onChange: (val: number) => void
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm text-[#9CA3AF]">{label}</label>
        <span className="text-lg font-bold text-[#D5EB4B]">
          {prefix}{value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#D5EB4B]"
        style={{ background: `linear-gradient(to right, #D5EB4B ${((value - min) / (max - min)) * 100}%, #3E3E48 ${((value - min) / (max - min)) * 100}%)` }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[#6B7280]">{prefix}{min}{suffix}</span>
        <span className="text-xs text-[#6B7280]">{prefix}{max}{suffix}</span>
      </div>
    </div>
  )
}

/* -- stat card -------------------------------------------- */

function StatCard({
  value,
  prefix,
  suffix,
  label,
  sublabel,
  color,
}: {
  value: number
  prefix?: string
  suffix?: string
  label: string
  sublabel: string
  color: string
}) {
  return (
    <div className="bg-[#33333F] border border-[#3E3E48] rounded-2xl p-6 text-center">
      <p className="text-xs font-mono uppercase tracking-wider text-[#6B7280] mb-2">{sublabel}</p>
      <AnimatedCounter
        target={value}
        prefix={prefix}
        suffix={suffix}
        className={`text-4xl font-bold ${color}`}
        duration={1}
      />
      <p className="text-sm text-[#9CA3AF] mt-2">{label}</p>
    </div>
  )
}

/* -- main component --------------------------------------- */

export default function ROICalculator() {
  const [employees, setEmployees] = useState(5)
  const [avgSalary, setAvgSalary] = useState(15)
  const [manualHours, setManualHours] = useState(20)

  // calculations
  const annualSavings = Math.round(employees * avgSalary * (manualHours / 40) * 0.7)
  const hoursSavedPerMonth = Math.round(employees * manualHours * 4 * 0.7)
  const revenueBoost = Math.round(annualSavings * 1.5)

  // debounced dataLayer push
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pushDataLayer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      trackROICalculator({
        employees,
        avgSalary,
        manualHours,
        annualSavings,
      })
    }, 2000)
  }, [employees, avgSalary, manualHours, annualSavings])

  useEffect(() => {
    pushDataLayer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [pushDataLayer])

  return (
    <section id="roi" className="bg-[#2A2A35] py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <p className="text-center font-mono text-xs uppercase tracking-widest mb-4 text-[#D5EB4B]">
            THE ROI
          </p>
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl mb-4">
            Calculate Your Automation Savings
          </h2>
          <p className="text-center text-sm text-[#9CA3AF] mb-12">
            Move the sliders. See what you're leaving on the table.
          </p>
        </ScrollReveal>

        {/* Calculator grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left: Inputs */}
          <ScrollReveal delay={0.1}>
            <div className="bg-[#33333F] border border-[#3E3E48] rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-white mb-6">Your Numbers</h3>
              <SliderInput
                label="Team Size"
                value={employees}
                min={1}
                max={50}
                step={1}
                suffix=" people"
                onChange={setEmployees}
              />
              <SliderInput
                label="Avg Salary"
                value={avgSalary}
                min={3}
                max={30}
                step={1}
                prefix="₹"
                suffix="L/yr"
                onChange={setAvgSalary}
              />
              <SliderInput
                label="Manual Hours/Week"
                value={manualHours}
                min={5}
                max={40}
                step={5}
                suffix=" hrs/wk"
                onChange={setManualHours}
              />
            </div>
          </ScrollReveal>

          {/* Right: Results */}
          <ScrollReveal delay={0.2}>
            <div className="flex flex-col gap-4">
              <StatCard
                value={annualSavings}
                prefix="₹"
                suffix="L/yr"
                label="Annual Savings"
                sublabel="Cost you eliminate"
                color="text-[#22C55E]"
              />
              <StatCard
                value={hoursSavedPerMonth}
                suffix=" hrs/mo"
                label="Hours Freed"
                sublabel="Team capacity unlocked"
                color="text-[#D5EB4B]"
              />
              <StatCard
                value={revenueBoost}
                prefix="₹"
                suffix="L"
                label="Potential Revenue Growth"
                sublabel="Reinvested productivity"
                color="text-[#F59E0B]"
              />
            </div>
          </ScrollReveal>
        </div>

        {/* Divider */}
        <div className="border-t border-[#3E3E48] mb-12" />

        {/* Comparison table */}
        <ScrollReveal delay={0.15}>
          <h3 className="text-xl font-bold text-white text-center mb-8">Your Team Today vs. With AI</h3>
          <div className="overflow-x-auto">
            <table className="w-full overflow-hidden rounded-2xl border border-[#3E3E48] bg-[#33333F]">
              <thead>
                <tr className="bg-[#3E3E48]">
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    Task
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-[#EF4444]">
                    Manual
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-[#D5EB4B]">
                    With AI
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider text-[#22C55E]">
                    Time Saved
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.task}
                    className={i < rows.length - 1 ? 'border-b border-[#3E3E48]' : ''}
                  >
                    <td className="px-6 py-5 text-sm font-medium text-white">
                      {row.task}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#EF4444]/70">
                      {row.manual}
                    </td>
                    <td className="px-6 py-5 text-sm text-[#D5EB4B]/80">
                      {row.ai}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-[#22C55E]">
                      {row.saved}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
