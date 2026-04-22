import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'
import Toast from '../ui/Toast'
import { getUTMParams, getFbcParam, getFbpParam } from '../../lib/analytics'
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

const teamSizeOptions = [
  { label: '1 to 3 people', sub: 'Small team, big ambitions' },
  { label: '4 to 10 people', sub: 'Growing fast, need systems' },
  { label: '10+ people', sub: 'Scale without more headcount' },
]

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
  { label: '₹50L - 1Cr', sub: 'Early stage' },
  { label: '₹1Cr - 3Cr', sub: 'Building momentum' },
  { label: '₹3Cr - 5Cr', sub: 'Ready to scale' },
  { label: '₹5Cr - 10Cr', sub: 'Growth mode' },
  { label: '₹10Cr+', sub: 'Enterprise scale' },
]

/* ── helpers ──────────────────────────────────────── */

function validatePhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-+]/g, '').replace(/^91/, '')
  return /^[6-9]\d{9}$/.test(cleaned)
}

function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-+]/g, '').replace(/^91/, '')
}

async function getWaitlistNumber(): Promise<number> {
  try {
    const key = 'zippy_waitlist_counter'
    const current = parseInt(localStorage.getItem(key) || '11', 10)
    const next = current + 1
    localStorage.setItem(key, String(next))
    return next
  } catch {
    return 12
  }
}

/* ── slide variants ───────────────────────────────── */

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 }),
}

/* ── sub-components ───────────────────────────────── */

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
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

/* Step 1: What to automate — multi-select tappable cards */
function Step1Tasks({
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

/* Step 2: Team size — single select, auto-advance */
function Step2Team({
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
          const active = teamSize === opt.label
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onSelect(opt.label)}
              className={`flex items-center gap-4 text-left rounded-xl p-5 border cursor-pointer transition-all duration-200 ${
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
              <div>
                <span className="text-sm font-medium text-white">{opt.label}</span>
                <span className="block text-xs text-[#6B7280] mt-0.5">{opt.sub}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* Step 3: Industry + Revenue — tappable cards, no dropdowns */
function Step3Business({
  industry,
  revenueRange,
  onIndustryChange,
  onRevenueChange,
}: {
  industry: string
  revenueRange: string
  onIndustryChange: (val: string) => void
  onRevenueChange: (val: string) => void
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">
        Tell us about your business
      </h3>
      <p className="text-sm text-[#9CA3AF] mb-6">Helps us tailor your audit.</p>

      <div className="flex flex-col gap-6">
        {/* Industry — tappable card grid */}
        <div>
          <label className="block text-sm text-[#9CA3AF] mb-3">What's your industry?</label>
          <div className="grid grid-cols-2 gap-2">
            {industryOptions.map((opt) => {
              const active = industry === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onIndustryChange(opt)}
                  className={`text-left rounded-xl p-3 border cursor-pointer transition-all duration-200 ${
                    active
                      ? 'border-[#D5EB4B] bg-[rgba(213,235,75,0.05)]'
                      : 'border-[#3E3E48] bg-[#33333F] hover:border-[#3E3E46]'
                  }`}
                >
                  <span className="text-sm text-white">{opt}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Revenue — tappable cards */}
        <div>
          <label className="block text-sm text-[#9CA3AF] mb-3">Monthly revenue range</label>
          <div className="flex flex-col gap-2">
            {revenueOptions.map((opt) => {
              const active = revenueRange === opt.label
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onRevenueChange(opt.label)}
                  className={`flex items-center justify-between text-left rounded-xl p-3 border cursor-pointer transition-all duration-200 ${
                    active
                      ? 'border-[#D5EB4B] bg-[rgba(213,235,75,0.05)]'
                      : 'border-[#3E3E48] bg-[#33333F] hover:border-[#3E3E46]'
                  }`}
                >
                  <span className="text-sm font-medium text-white">{opt.label}</span>
                  <span className="text-xs text-[#6B7280]">{opt.sub}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Step 4: Contact — name, email, WhatsApp, business name, consent */
function Step4Contact({
  name,
  email,
  phone,
  businessName,
  whatsappConsent,
  formError,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onBusinessNameChange,
  onConsentChange,
}: {
  name: string
  email: string
  phone: string
  businessName: string
  whatsappConsent: boolean
  formError: string
  onNameChange: (val: string) => void
  onEmailChange: (val: string) => void
  onPhoneChange: (val: string) => void
  onBusinessNameChange: (val: string) => void
  onConsentChange: (val: boolean) => void
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-1">
        Almost done. Where should we send your audit?
      </h3>
      <p className="text-sm text-[#9CA3AF] mb-6">We'll WhatsApp your custom automation roadmap.</p>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-[#9CA3AF] mb-1">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Full name"
            className="w-full bg-[#33333F] border border-[#3E3E48] rounded-lg p-4 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-[#9CA3AF] mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@company.com"
            required
            className="w-full bg-[#33333F] border border-[#3E3E48] rounded-lg p-4 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-[#9CA3AF] mb-1">WhatsApp Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="98765 43210"
            className="w-full bg-[#33333F] border border-[#3E3E48] rounded-lg p-4 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-[#9CA3AF] mb-1">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => onBusinessNameChange(e.target.value)}
            placeholder="Your company name"
            className="w-full bg-[#33333F] border border-[#3E3E48] rounded-lg p-4 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
          />
        </div>

        {/* WhatsApp consent */}
        <button
          type="button"
          onClick={() => onConsentChange(!whatsappConsent)}
          className="flex items-start gap-3 text-left mt-1 cursor-pointer bg-transparent border-none p-0"
        >
          <span
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              whatsappConsent ? 'border-[#D5EB4B] bg-[#D5EB4B]' : 'border-[#4E4E56]'
            }`}
          >
            {whatsappConsent && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0c0c10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="text-sm text-[#9CA3AF]">
            Send me my automation roadmap on WhatsApp
          </span>
        </button>
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
      <h3 className="text-2xl font-bold text-white mb-2">You're In!</h3>
      <p className="text-4xl font-bold text-[#D5EB4B] mb-3">#{waitlistNum}</p>
      <p className="text-sm text-[#9CA3AF] mb-6">
        Check your WhatsApp. Your automation roadmap is on its way.
      </p>

      <div className="bg-[rgba(213,235,75,0.05)] border border-[#3E3E48] rounded-2xl p-6 text-left">
        <h4 className="text-lg font-bold text-white mb-4">What happens next?</h4>
        <div className="space-y-4">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D5EB4B] text-[#0c0c10] font-bold flex items-center justify-center text-sm">1</span>
            <div>
              <p className="text-sm font-medium text-white">WhatsApp confirmation</p>
              <p className="text-xs text-[#9CA3AF]">You'll get a message within minutes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D5EB4B] text-[#0c0c10] font-bold flex items-center justify-center text-sm">2</span>
            <div>
              <p className="text-sm font-medium text-white">We audit your operations</p>
              <p className="text-xs text-[#9CA3AF]">Manual review by our team within 24 hours</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#D5EB4B] text-[#0c0c10] font-bold flex items-center justify-center text-sm">3</span>
            <div>
              <p className="text-sm font-medium text-white">Custom roadmap on WhatsApp</p>
              <p className="text-xs text-[#9CA3AF]">Exactly what to automate, how much it saves, and how fast</p>
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

  // step 4
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [whatsappConsent, setWhatsappConsent] = useState(true)
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

  /* step 2 auto-advance on tap */
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
        showToast('Pick your industry')
        return
      }
      if (!revenueRange) {
        showToast('Pick your revenue range')
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
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter a valid email address'); return
    }
    if (!phone.trim() || !validatePhone(phone)) { setFormError('Enter a valid 10-digit Indian mobile number'); return }
    if (!businessName.trim()) { setFormError('Business name is required'); return }

    setSubmitting(true)

    const areas = selected.map((s) => (s === 'Others' ? `Others: ${othersText}` : s))
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: cleanPhone(phone),
      business_name: businessName.trim(),
      automate_areas: areas.join(', '),
      team_size: teamSize,
      industry,
      revenue_range: revenueRange,
      whatsapp_consent: whatsappConsent,
      source: 'automation-lp-v6',
      event_id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      client_user_agent: navigator.userAgent,
      page_url: window.location.href,
      fbp: getFbpParam(),
      fbc: getFbcParam(),
      visit_count: parseInt(localStorage.getItem('zippy_visit_count') || '1', 10),
      time_on_page: Math.round((Date.now() - ((window as any).__pageLoadTime || Date.now())) / 1000),
      ...getUTMParams(),
    }

    // localStorage backup
    try {
      localStorage.setItem(
        `zippy_automation_lead_${Date.now()}`,
        JSON.stringify(payload),
      )
    } catch { /* silent */ }

    // webhook — Apps Script doesn't answer CORS preflight, so use text/plain
    // (no preflight) + no-cors mode. sendBeacon is also text/plain by default.
    const url = 'https://script.google.com/macros/s/AKfycbzzacqtwW_Wfk3EB-4WmCQrNFK92yeT2ziRNJvV4Ujy_468HHwCRHiGN0OkxTMLZyKJKQ/exec'
    const body = JSON.stringify(payload)
    let delivered = false
    try {
      delivered = navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=UTF-8' }))
    } catch { /* fall through */ }
    if (!delivered) {
      try {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body,
          keepalive: true,
        })
      } catch { /* silent */ }
    }

    trackQuizSubmit({ lead_source: 'automation-lp-v6', event_id: payload.event_id })
    const num = await getWaitlistNumber()
    setWaitlistNum(num)
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Find Out What You Can Automate
          </h2>
          <p className="text-[#9CA3AF]">
            4 quick taps. Get a custom automation audit for your business.
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
                    <Step1Tasks
                      selected={selected}
                      othersText={othersText}
                      onToggle={toggleOption}
                      onOthersChange={setOthersText}
                    />
                  )}
                  {step === 2 && (
                    <Step2Team
                      teamSize={teamSize}
                      onSelect={setTeamSize}
                    />
                  )}
                  {step === 3 && (
                    <Step3Business
                      industry={industry}
                      revenueRange={revenueRange}
                      onIndustryChange={setIndustry}
                      onRevenueChange={setRevenueRange}
                    />
                  )}
                  {step === 4 && (
                    <Step4Contact
                      name={name}
                      email={email}
                      phone={phone}
                      businessName={businessName}
                      whatsappConsent={whatsappConsent}
                      formError={formError}
                      onNameChange={setName}
                      onEmailChange={setEmail}
                      onPhoneChange={setPhone}
                      onBusinessNameChange={setBusinessName}
                      onConsentChange={setWhatsappConsent}
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

                {step < 4 && step !== 2 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="bg-[#D5EB4B] text-[#0c0c10] font-bold px-8 py-3 rounded-xl hover:brightness-110 transition-all cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                ) : step === 4 ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 ml-4 bg-[#D5EB4B] text-[#0c0c10] font-bold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Get My Free Audit'}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </ScrollReveal>

      <Toast message={toast.message} visible={toast.visible} onDismiss={hideToast} />
    </section>
  )
}
