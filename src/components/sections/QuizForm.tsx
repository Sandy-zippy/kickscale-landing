import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'
import Toast from '../ui/Toast'
import { getUTMParams } from '../../lib/analytics'
import { trackQuizProgress, trackQuizStart, trackQuizSubmit } from '../../lib/tracking'

/* ── data ─────────────────────────────────────────── */

const automationOptions = [
  'Complete Lead Flow',
  'Invoice & Payment Processing',
  'Daily, Weekly & Monthly Report Generation',
  'Email & WhatsApp Follow-ups',
  'Customer Engagement & Retention Automation',
  'AI Voice Agent + AI Messaging Agent + Appointment Scheduling',
  'Inventory & Order Management',
  'HR & Payroll Processing',
  'Special Internal Operations',
  'Others',
]

const teamSizeOptions = ['1 to 3 people', '4 to 10 people', '10+ people']

const industryOptions = [
  'Manufacturing',
  'IT/Software',
  'Healthcare',
  'Education',
  'Real Estate',
  'Retail/E-commerce',
  'Professional Services',
  'Construction',
  'Hospitality',
  'Other',
]

const revenueOptions = [
  '₹50L - 1Cr',
  '₹1Cr - 3Cr',
  '₹3Cr - 5Cr',
  '₹5Cr - 10Cr',
  '₹10Cr+',
]

const marketingSpendOptions = [
  '₹0 (No marketing spend)',
  'Under ₹50K',
  '₹50K - 2L',
  '₹2L - 5L',
  '₹5L+',
]

const toolOptions = [
  'Excel/Google Sheets',
  'Tally/Zoho',
  'WhatsApp Groups',
  'CRM (HubSpot/Salesforce/etc)',
  'ERP System',
  'None of these',
]

const triedOptions = [
  'Hired more people',
  'Tried a freelancer/consultant',
  'Tried an agency',
  'Tried building in-house tools',
  'Nothing yet',
]

/* ── helpers ──────────────────────────────────────── */

function validatePhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-+]/g, '').replace(/^91/, '')
  return /^[6-9]\d{9}$/.test(cleaned)
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-+]/g, '').replace(/^91/, '')
}

function getWaitlistNumber(): number {
  try {
    const key = 'zippy_waitlist_counter'
    const current = parseInt(localStorage.getItem(key) || '47', 10)
    const next = current + 1
    localStorage.setItem(key, String(next))
    return next
  } catch {
    return 48
  }
}

/* ── slide variants ───────────────────────────────── */

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 }),
}

/* ── extracted sub-components ────────────────────── */

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            s <= step ? 'bg-[#D5EB4B]' : 'bg-[#3E3E48]'
          }`}
        />
      ))}
    </div>
  )
}

function Step1({
  selected,
  othersText,
  onToggle,
  onOthersChange,
}: {
  selected: string[]
  othersText: string
  onToggle: (opt: string) => void
  onOthersChange: (val: string) => void
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">
        Which tasks eat the most time?
      </h3>
      <p className="text-sm text-[#9CA3AF] mb-6">Pick all that apply. No wrong answers.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {automationOptions.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`flex items-start gap-3 text-left rounded-xl p-4 border cursor-pointer transition-all duration-200 ${
                active
                  ? 'border-[#D5EB4B] bg-[rgba(213,235,75,0.05)]'
                  : 'border-[#3E3E48] bg-[#33333F] hover:border-[#3E3E46]'
              }`}
            >
              <span
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  active ? 'border-[#D5EB4B] bg-[#D5EB4B]' : 'border-[#4E4E56]'
                }`}
              >
                {active && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0c0c10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-white">{opt}</span>
            </button>
          )
        })}
      </div>
      {selected.includes('Others') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3"
        >
          <input
            type="text"
            value={othersText}
            onChange={(e) => onOthersChange(e.target.value)}
            placeholder="Describe what you want to automate..."
            className="w-full bg-[#33333F] border border-[#3E3E48] rounded-lg p-4 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
          />
        </motion.div>
      )}
    </div>
  )
}

function Step2({
  teamSize,
  onSelect,
}: {
  teamSize: string
  onSelect: (opt: string) => void
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">
        How big is the team doing this work?
      </h3>
      <p className="text-sm text-[#9CA3AF] mb-6">Tap one to continue</p>
      <div className="flex flex-col gap-3">
        {teamSizeOptions.map((opt) => {
          const active = teamSize === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={`flex items-center gap-3 text-left rounded-xl p-4 border cursor-pointer transition-all duration-200 ${
                active
                  ? 'border-[#D5EB4B] bg-[rgba(213,235,75,0.05)]'
                  : 'border-[#3E3E48] bg-[#33333F] hover:border-[#3E3E46]'
              }`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  active ? 'border-[#D5EB4B]' : 'border-[#4E4E56]'
                }`}
              >
                {active && <span className="w-2.5 h-2.5 rounded-full bg-[#D5EB4B]" />}
              </span>
              <span className="text-sm text-white">{opt}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Radio button helper (reused in Step 3) ────── */
function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div>
      <label className="block text-sm text-[#9CA3AF] mb-2">{label}</label>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const active = value === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`flex items-center gap-3 text-left rounded-xl p-3 border cursor-pointer transition-all duration-200 ${
                active
                  ? 'border-[#D5EB4B] bg-[rgba(213,235,75,0.05)]'
                  : 'border-[#3E3E48] bg-[#33333F] hover:border-[#3E3E46]'
              }`}
            >
              <span
                className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  active ? 'border-[#D5EB4B]' : 'border-[#4E4E56]'
                }`}
              >
                {active && <span className="w-2 h-2 rounded-full bg-[#D5EB4B]" />}
              </span>
              <span className="text-sm text-white">{opt}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Checkbox group helper (reused in Step 4) ──── */
function CheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (opt: string) => void
}) {
  return (
    <div>
      <label className="block text-sm text-[#9CA3AF] mb-2">{label}</label>
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`flex items-center gap-3 text-left rounded-xl p-3 border cursor-pointer transition-all duration-200 ${
                active
                  ? 'border-[#D5EB4B] bg-[rgba(213,235,75,0.05)]'
                  : 'border-[#3E3E48] bg-[#33333F] hover:border-[#3E3E46]'
              }`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  active ? 'border-[#D5EB4B] bg-[#D5EB4B]' : 'border-[#4E4E56]'
                }`}
              >
                {active && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0c0c10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-white">{opt}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step3Business({
  industry,
  revenueRange,
  marketingSpend,
  onIndustryChange,
  onRevenueChange,
  onSpendChange,
}: {
  industry: string
  revenueRange: string
  marketingSpend: string
  onIndustryChange: (val: string) => void
  onRevenueChange: (val: string) => void
  onSpendChange: (val: string) => void
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">
        Tell us about your business
      </h3>
      <p className="text-sm text-[#9CA3AF] mb-6">Helps us tailor your audit.</p>

      <div className="flex flex-col gap-5">
        {/* Industry dropdown */}
        <div>
          <label className="block text-sm text-[#9CA3AF] mb-2">Industry</label>
          <select
            value={industry}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="w-full bg-[#33333F] border border-[#3E3E48] rounded-lg p-4 text-white text-sm focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%239CA3AF' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
          >
            <option value="" disabled className="bg-[#33333F] text-[#6B7280]">Select your industry</option>
            {industryOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-[#33333F] text-white">{opt}</option>
            ))}
          </select>
        </div>

        {/* Revenue Range */}
        <RadioGroup
          label="Monthly Revenue Range"
          options={revenueOptions}
          value={revenueRange}
          onChange={onRevenueChange}
        />

        {/* Marketing Spend */}
        <RadioGroup
          label="Current Marketing Spend/Month"
          options={marketingSpendOptions}
          value={marketingSpend}
          onChange={onSpendChange}
        />
      </div>
    </div>
  )
}

function Step4Tools({
  toolsUsed,
  triedBefore,
  urgency,
  onToggleTool,
  onToggleTried,
  onUrgencyChange,
}: {
  toolsUsed: string[]
  triedBefore: string[]
  urgency: number
  onToggleTool: (opt: string) => void
  onToggleTried: (opt: string) => void
  onUrgencyChange: (val: number) => void
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">
        What have you tried so far?
      </h3>
      <p className="text-sm text-[#9CA3AF] mb-6">No judgement. We just need context.</p>

      <div className="flex flex-col gap-5">
        <CheckboxGroup
          label="Current Tools"
          options={toolOptions}
          selected={toolsUsed}
          onToggle={onToggleTool}
        />

        <CheckboxGroup
          label="Previous Attempts"
          options={triedOptions}
          selected={triedBefore}
          onToggle={onToggleTried}
        />

        {/* Urgency slider */}
        <div>
          <label className="block text-sm text-[#9CA3AF] mb-2">
            How urgent is fixing this?
          </label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#6B7280] whitespace-nowrap">Not urgent</span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={urgency}
              onChange={(e) => onUrgencyChange(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#D5EB4B] bg-[#3E3E48]"
            />
            <span className="text-xs text-[#6B7280] whitespace-nowrap">Critical</span>
            <span className="text-lg font-bold text-[#D5EB4B] min-w-[2ch] text-center">{urgency}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Step5Props {
  name: string
  email: string
  phone: string
  businessName: string
  formError: string
  onNameChange: (val: string) => void
  onEmailChange: (val: string) => void
  onPhoneChange: (val: string) => void
  onBusinessNameChange: (val: string) => void
}

function Step5Contact({
  name,
  email,
  phone,
  businessName,
  formError,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onBusinessNameChange,
}: Step5Props) {
  const fields = [
    { label: 'Name', value: name, set: onNameChange, type: 'text', placeholder: 'Your full name' },
    { label: 'Email', value: email, set: onEmailChange, type: 'email', placeholder: 'you@company.com' },
    { label: 'Phone', value: phone, set: onPhoneChange, type: 'tel', placeholder: '98765 43210' },
    { label: 'Business Name', value: businessName, set: onBusinessNameChange, type: 'text', placeholder: 'Your company name' },
  ] as const

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-6">
        Last step. Where should we send your audit?
      </h3>
      <div className="flex flex-col gap-4">
        {fields.map((f) => (
          <div key={f.label}>
            <label className="block text-sm text-[#9CA3AF] mb-1">{f.label}</label>
            <input
              type={f.type}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              className="w-full bg-[#33333F] border border-[#3E3E48] rounded-lg p-4 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
            />
          </div>
        ))}
      </div>

      {formError && (
        <p className="mt-3 text-sm text-[#EF4444]">{formError}</p>
      )}

      <p className="mt-6 text-xs text-[#9CA3AF] text-center">
        10 spots this quarter. No payment needed. Free audit.
      </p>
    </div>
  )
}

function ThankYou({ waitlistNum }: { waitlistNum: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#D5EB4B] flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 16L14 22L24 10" stroke="#0c0c10" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">You're on the Waitlist!</h3>
      <p className="text-4xl font-bold text-[#D5EB4B] mb-3">#{waitlistNum}</p>
      <p className="text-sm text-[#9CA3AF] mb-6">
        We'll review your submission and WhatsApp you within 24 hours.
      </p>

      {/* What happens next */}
      <div className="bg-[rgba(213,235,75,0.05)] border border-[#3E3E48] rounded-2xl p-6 text-left">
        <h4 className="text-lg font-bold text-white mb-4">What happens next?</h4>
        <div className="space-y-4">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D5EB4B] text-[#0c0c10] font-bold flex items-center justify-center text-sm">1</span>
            <div>
              <p className="text-sm font-medium text-white">WhatsApp confirmation</p>
              <p className="text-xs text-[#9CA3AF]">You'll receive a message within minutes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D5EB4B] text-[#0c0c10] font-bold flex items-center justify-center text-sm">2</span>
            <div>
              <p className="text-sm font-medium text-white">We review your business</p>
              <p className="text-xs text-[#9CA3AF]">Our team manually audits your operations within 24 hours</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D5EB4B] text-[#0c0c10] font-bold flex items-center justify-center text-sm">3</span>
            <div>
              <p className="text-sm font-medium text-white">You get your audit report</p>
              <p className="text-xs text-[#9CA3AF]">Custom automation roadmap delivered to your WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── main component ──────────────────────────────── */

export default function QuizForm() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  // step 1
  const [selected, setSelected] = useState<string[]>([])
  const [othersText, setOthersText] = useState('')

  // step 2
  const [teamSize, setTeamSize] = useState('')

  // step 3
  const [industry, setIndustry] = useState('')
  const [revenueRange, setRevenueRange] = useState('')
  const [marketingSpend, setMarketingSpend] = useState('')

  // step 4
  const [toolsUsed, setToolsUsed] = useState<string[]>([])
  const [triedBefore, setTriedBefore] = useState<string[]>([])
  const [urgency, setUrgency] = useState(5)

  // step 5
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [formError, setFormError] = useState('')

  // states
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [waitlistNum, setWaitlistNum] = useState(0)

  // toast
  const [toast, setToast] = useState({ visible: false, message: '' })
  const showToast = useCallback((msg: string) => setToast({ visible: true, message: msg }), [])
  const hideToast = useCallback(() => setToast({ visible: false, message: '' }), [])

  // track quiz start (once)
  const quizStarted = useRef(false)
  useEffect(() => {
    if (!quizStarted.current) {
      quizStarted.current = true
      trackQuizStart()
    }
  }, [])

  /* step 2 auto-advance */
  useEffect(() => {
    if (step === 2 && teamSize) {
      const t = setTimeout(() => {
        setDirection(1)
        setStep(3)
      }, 400)
      return () => clearTimeout(t)
    }
  }, [step, teamSize])

  /* toggle helpers */
  function toggleOption(opt: string) {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt],
    )
  }

  function toggleTool(opt: string) {
    setToolsUsed((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt],
    )
  }

  function toggleTried(opt: string) {
    setTriedBefore((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt],
    )
  }

  /* navigation */
  function goNext() {
    if (step === 1) {
      if (selected.length === 0) {
        showToast('Select at least one option')
        return
      }
      if (selected.includes('Others') && !othersText.trim()) {
        showToast('Please describe what you want to automate')
        return
      }
    }
    if (step === 3) {
      if (!industry) {
        showToast('Please select your industry')
        return
      }
      if (!revenueRange) {
        showToast('Please select your revenue range')
        return
      }
      if (!marketingSpend) {
        showToast('Please select your marketing spend')
        return
      }
    }
    if (step === 4) {
      if (toolsUsed.length === 0) {
        showToast('Select at least one tool (or "None of these")')
        return
      }
      if (triedBefore.length === 0) {
        showToast('Select at least one previous attempt')
        return
      }
    }
    trackQuizProgress(step, { selected_count: step === 1 ? selected.length : undefined })
    setDirection(1)
    setStep((s) => s + 1)
  }

  function goBack() {
    setDirection(-1)
    setStep((s) => s - 1)
  }

  /* submit */
  async function handleSubmit() {
    setFormError('')
    if (!name.trim()) { setFormError('Name is required'); return }
    if (!email.trim() || !validateEmail(email)) { setFormError('Enter a valid email address'); return }
    if (!phone.trim() || !validatePhone(phone)) { setFormError('Enter a valid 10-digit Indian mobile number'); return }
    if (!businessName.trim()) { setFormError('Business name is required'); return }

    setSubmitting(true)

    const areas = selected.map((s) => (s === 'Others' ? `Others: ${othersText}` : s))
    const payload = {
      name: name.trim(),
      phone: cleanPhone(phone),
      email: email.trim(),
      business_name: businessName.trim(),
      automate_areas: areas.join(', '),
      team_size: teamSize,
      industry,
      revenue_range: revenueRange,
      marketing_spend: marketingSpend,
      tools_used: toolsUsed.join(', '),
      tried_before: triedBefore.join(', '),
      urgency,
      source: 'automation-lp-v3',
      ...getUTMParams(),
    }

    // localStorage backup
    try {
      localStorage.setItem(
        `zippy_automation_lead_${Date.now()}`,
        JSON.stringify(payload),
      )
    } catch { /* silent */ }

    // webhook (fetch first, sendBeacon as fallback)
    const url = 'https://sandyautomations.app.n8n.cloud/webhook/zippyscale-quiz'
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      try {
        navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      } catch { /* silent */ }
    }

    trackQuizSubmit({ lead_source: 'automation-lp-v3' })
    setWaitlistNum(getWaitlistNumber())
    window.dispatchEvent(new Event('waitlist-updated'))
    setSubmitting(false)
    setDone(true)
  }

  /* ── main render ────────────────────────────────── */
  return (
    <section id="quiz" className="bg-[#2A2A35] py-20 px-4">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <ScrollReveal>
          <span className="text-center font-mono text-xs uppercase tracking-widest mb-4 text-[#D5EB4B] inline-block">
            Start Here
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 whitespace-nowrap">
            Find Out What You Can Automate&nbsp;(2&nbsp;Min)
          </h2>
          <p className="text-[#9CA3AF]">
            Answer 5 quick questions. Get a custom automation audit for your business.
          </p>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <div className="max-w-2xl mx-auto bg-[#33333F] border border-[#3E3E48] rounded-2xl p-6 sm:p-8">
          {done ? (
            <ThankYou waitlistNum={waitlistNum} />
          ) : (
            <>
              <ProgressBar step={step} />

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {step === 1 && (
                    <Step1
                      selected={selected}
                      othersText={othersText}
                      onToggle={toggleOption}
                      onOthersChange={setOthersText}
                    />
                  )}
                  {step === 2 && (
                    <Step2
                      teamSize={teamSize}
                      onSelect={setTeamSize}
                    />
                  )}
                  {step === 3 && (
                    <Step3Business
                      industry={industry}
                      revenueRange={revenueRange}
                      marketingSpend={marketingSpend}
                      onIndustryChange={setIndustry}
                      onRevenueChange={setRevenueRange}
                      onSpendChange={setMarketingSpend}
                    />
                  )}
                  {step === 4 && (
                    <Step4Tools
                      toolsUsed={toolsUsed}
                      triedBefore={triedBefore}
                      urgency={urgency}
                      onToggleTool={toggleTool}
                      onToggleTried={toggleTried}
                      onUrgencyChange={setUrgency}
                    />
                  )}
                  {step === 5 && (
                    <Step5Contact
                      name={name}
                      email={email}
                      phone={phone}
                      businessName={businessName}
                      formError={formError}
                      onNameChange={setName}
                      onEmailChange={setEmail}
                      onPhoneChange={setPhone}
                      onBusinessNameChange={setBusinessName}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-sm text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
                  >
                    &larr; Back
                  </button>
                ) : (
                  <span />
                )}

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="bg-[#D5EB4B] text-[#0c0c10] font-bold px-8 py-3 rounded-xl hover:brightness-110 transition-all cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 ml-4 bg-[#D5EB4B] text-[#0c0c10] font-bold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Get My Free Audit'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollReveal>

      <Toast message={toast.message} visible={toast.visible} onDismiss={hideToast} />
    </section>
  )
}
