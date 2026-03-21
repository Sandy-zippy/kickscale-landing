import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'
import Toast from '../ui/Toast'

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

function getUtm() {
  try {
    return {
      utm_source: sessionStorage.getItem('utm_source') || '',
      utm_medium: sessionStorage.getItem('utm_medium') || '',
      utm_campaign: sessionStorage.getItem('utm_campaign') || '',
      utm_content: sessionStorage.getItem('utm_content') || '',
      utm_term: sessionStorage.getItem('utm_term') || '',
    }
  } catch {
    return { utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '' }
  }
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

/* ── component ────────────────────────────────────── */

export default function QuizForm() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  // step 1
  const [selected, setSelected] = useState<string[]>([])
  const [othersText, setOthersText] = useState('')

  // step 2
  const [teamSize, setTeamSize] = useState('')

  // step 3
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

  /* toggle automation option */
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
      source: 'automation-lp-v2',
      ...getUtm(),
    }

    // localStorage backup
    try {
      localStorage.setItem(
        `zippy_automation_lead_${Date.now()}`,
        JSON.stringify(payload),
      )
    } catch { /* silent */ }

    // webhook
    const url = 'https://sandyautomations.app.n8n.cloud/webhook/zippyscale-quiz'
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch { /* silent */ }

    // sendBeacon backup
    try {
      navigator.sendBeacon(url, JSON.stringify(payload))
    } catch { /* silent */ }

    setWaitlistNum(getWaitlistNumber())
    window.dispatchEvent(new Event('waitlist-updated'))
    setSubmitting(false)
    setDone(true)
  }

  /* ── progress bar ───────────────────────────────── */
  function ProgressBar() {
    return (
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              s <= step ? 'bg-[#D5EB4B]' : 'bg-[#2E2E36]'
            }`}
          />
        ))}
      </div>
    )
  }

  /* ── step 1 ─────────────────────────────────────── */
  function Step1() {
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
                onClick={() => toggleOption(opt)}
                className={`flex items-start gap-3 text-left rounded-xl p-4 border cursor-pointer transition-all duration-200 ${
                  active
                    ? 'border-[#D5EB4B] bg-[rgba(213,235,75,0.05)]'
                    : 'border-[#2E2E36] bg-[#1E1E24] hover:border-[#3E3E46]'
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
              onChange={(e) => setOthersText(e.target.value)}
              placeholder="Describe what you want to automate..."
              className="w-full bg-[#1E1E24] border border-[#2E2E36] rounded-lg p-4 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
            />
          </motion.div>
        )}
      </div>
    )
  }

  /* ── step 2 ─────────────────────────────────────── */
  function Step2() {
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
                onClick={() => setTeamSize(opt)}
                className={`flex items-center gap-3 text-left rounded-xl p-4 border cursor-pointer transition-all duration-200 ${
                  active
                    ? 'border-[#D5EB4B] bg-[rgba(213,235,75,0.05)]'
                    : 'border-[#2E2E36] bg-[#1E1E24] hover:border-[#3E3E46]'
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

  /* ── step 3 ─────────────────────────────────────── */
  function Step3() {
    return (
      <div>
        <h3 className="text-lg font-semibold text-white mb-6">
          Last step. Where should we send your roadmap?
        </h3>
        <div className="flex flex-col gap-4">
          {([
            { label: 'Name', value: name, set: setName, type: 'text', placeholder: 'Your full name' },
            { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'you@company.com' },
            { label: 'Phone', value: phone, set: setPhone, type: 'tel', placeholder: '98765 43210' },
            { label: 'Business Name', value: businessName, set: setBusinessName, type: 'text', placeholder: 'Your company name' },
          ] as const).map((f) => (
            <div key={f.label}>
              <label className="block text-sm text-[#9CA3AF] mb-1">{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-[#1E1E24] border border-[#2E2E36] rounded-lg p-4 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
              />
            </div>
          ))}
        </div>

        {formError && (
          <p className="mt-3 text-sm text-[#EF4444]">{formError}</p>
        )}

        <p className="mt-6 text-xs text-[#9CA3AF] text-center">
          7 of 10 slots taken for April. No payment needed to apply.
        </p>
      </div>
    )
  }

  /* ── thank you ──────────────────────────────────── */
  function ThankYou() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Block A: Waitlist Confirmation */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#D5EB4B] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 16L14 22L24 10" stroke="#0c0c10" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">You're on the Waitlist!</h3>
        <p className="text-4xl font-bold text-[#D5EB4B] mb-3">#{waitlistNum}</p>
        <p className="text-sm text-[#9CA3AF] mb-10">
          We review every submission. If there's a fit, we'll reach out before 31st March.
        </p>

        {/* Block B: Priority Audit Upsell */}
        <div className="bg-[rgba(213,235,75,0.05)] border border-[#D5EB4B] rounded-2xl p-8 text-left">
          <h4 className="text-lg font-bold text-white mb-3">
            Skip the Wait. Get a Priority Audit in 48 Hours.
          </h4>
          <p className="text-sm text-[#9CA3AF] mb-6">
            We manually review your business, map every automation opportunity, and deliver a custom audit report within 48 hours.
          </p>
          <div className="mb-6">
            <span className="text-sm text-[#9CA3AF] line-through mr-2">&#8377;9,999</span>
            <span className="text-3xl font-bold text-white">&#8377;4,999</span>
          </div>
          <a
            href="#"
            className="block w-full text-center bg-[#D5EB4B] text-[#0c0c10] font-bold py-4 rounded-xl hover:brightness-110 transition-all"
          >
            Get Priority Audit in 48 Hours
          </a>
        </div>
      </motion.div>
    )
  }

  /* ── main render ────────────────────────────────── */
  return (
    <section id="quiz" className="bg-[#141418] py-20 px-4">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <ScrollReveal>
          <span className="text-center font-mono text-xs uppercase tracking-widest mb-4 text-[#D5EB4B] inline-block">
            Start Here
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Find Out What You Can Automate (2 Min)
          </h2>
          <p className="text-[#9CA3AF]">
            Answer 3 quick questions. Get a custom automation roadmap for your business.
          </p>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <div className="max-w-2xl mx-auto bg-[#1E1E24] border border-[#2E2E36] rounded-2xl p-6 sm:p-8">
          {done ? (
            <ThankYou />
          ) : (
            <>
              <ProgressBar />

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
                  {step === 1 && <Step1 />}
                  {step === 2 && <Step2 />}
                  {step === 3 && <Step3 />}
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

                {step < 3 ? (
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
                    {submitting ? 'Submitting...' : 'Get My Automation Roadmap'}
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
