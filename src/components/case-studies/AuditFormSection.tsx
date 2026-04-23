import { useState, type FormEvent } from 'react'
import ScrollReveal from '../ui/ScrollReveal'
import { getUTMParams, getFbcParam, getFbpParam } from '../../lib/analytics'
import { trackQuizSubmit, trackCTAClick } from '../../lib/tracking'

const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzzacqtwW_Wfk3EB-4WmCQrNFK92yeT2ziRNJvV4Ujy_468HHwCRHiGN0OkxTMLZyKJKQ/exec'

function validatePhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-+]/g, '').replace(/^91/, '')
  return /^[6-9]\d{9}$/.test(cleaned)
}

function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-+]/g, '').replace(/^91/, '')
}

interface Props {
  source?: string
  industryHint?: string
  primaryPainHint?: string
  headline?: string
  subhead?: string
}

export default function AuditFormSection({
  source = 'case-study-form',
  industryHint = '',
  primaryPainHint = '',
  headline = 'Book your free 48-hour audit',
  subhead = "We map your workflows, find the 3 biggest leaks, and price the sprint scope. No deck. No upsell.",
}: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required'); return }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address'); return
    }
    if (!phone.trim() || !validatePhone(phone)) {
      setError('Enter a valid 10-digit Indian mobile number'); return
    }
    if (!businessName.trim()) { setError('Business name is required'); return }

    setSubmitting(true)
    trackCTAClick(source, 'Book My Free 48h Audit (form)')

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: cleanPhone(phone),
      business_name: businessName.trim(),
      automate_areas: primaryPainHint || 'Workflow Automation',
      team_size: '',
      industry: industryHint,
      revenue_range: '',
      whatsapp_consent: true,
      source,
      event_id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      client_user_agent: navigator.userAgent,
      page_url: window.location.href,
      fbp: getFbpParam(),
      fbc: getFbcParam(),
      visit_count: parseInt(localStorage.getItem('zippy_visit_count') || '1', 10),
      time_on_page: Math.round((Date.now() - ((window as unknown as { __pageLoadTime?: number }).__pageLoadTime || Date.now())) / 1000),
      ...getUTMParams(),
    }

    try {
      localStorage.setItem(`zippy_case_study_lead_${Date.now()}`, JSON.stringify(payload))
    } catch { /* silent */ }

    const body = JSON.stringify(payload)
    let delivered = false
    try {
      delivered = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }))
    } catch { /* fall through */ }
    if (!delivered) {
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body,
          keepalive: true,
        })
      } catch { /* silent */ }
    }

    trackQuizSubmit({ lead_source: source, event_id: payload.event_id })
    setSubmitting(false)
    setDone(true)
    window.dispatchEvent(new Event('waitlist-updated'))
  }

  return (
    <section id="audit-form" className="relative py-16 md:py-20 px-4 bg-[#2A2A35] text-white overflow-hidden scroll-mt-20">
      <div className="cta-orb cta-orb-1" />
      <div className="cta-orb cta-orb-2" />
      <div className="relative z-10 max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-8 md:mb-10">
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#D5EB4B] mb-3">
              Free 48h audit · No payment · No deck
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {headline}
            </h2>
            <p className="text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">{subhead}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="bg-[#33333F] border border-[#3E3E48] rounded-2xl p-6 sm:p-8">
            {done ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-[#D5EB4B] flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                      <path d="M8 16L14 22L24 10" stroke="#0c0c10" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">You're booked.</h3>
                <p className="text-sm text-[#9CA3AF] mb-1">We'll WhatsApp you in the next 60 minutes to lock the slot.</p>
                <p className="text-sm text-[#9CA3AF]">In 48 hours: a 1-page audit PDF with the 3 biggest leaks + a sprint scope priced at ₹2L.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">Your name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    className="w-full bg-[#1A1A2E] border border-[#3E3E48] rounded-lg p-3.5 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="w-full bg-[#1A1A2E] border border-[#3E3E48] rounded-lg p-3.5 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">WhatsApp</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    autoComplete="tel"
                    className="w-full bg-[#1A1A2E] border border-[#3E3E48] rounded-lg p-3.5 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                    Business name {industryHint && <span className="text-[#6B7280] normal-case tracking-normal font-sans">· {industryHint}</span>}
                  </span>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your company name"
                    autoComplete="organization"
                    className="w-full bg-[#1A1A2E] border border-[#3E3E48] rounded-lg p-3.5 text-white text-sm placeholder:text-[#6B7280] focus:border-[#D5EB4B] focus:ring-1 focus:ring-[#D5EB4B] outline-none transition-colors"
                  />
                </label>

                {error && (
                  <p role="alert" className="sm:col-span-2 text-sm text-[#EF4444]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="sm:col-span-2 mt-2 w-full bg-[#D5EB4B] text-[#0c0c10] font-bold py-4 rounded-xl hover:bg-[#E4F57A] transition-colors shadow-[0_4px_20px_rgba(213,235,75,0.25)] disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Booking…' : 'Book my free 48h audit →'}
                </button>
                <p className="sm:col-span-2 text-center text-xs text-[#6B7280] mt-1">
                  No payment. No deck. We respond within 60 minutes.
                </p>
              </form>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
