import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'

const WEBHOOK_URL = import.meta.env.VITE_EYE_WEBHOOK_URL || 'https://sandyautomations.app.n8n.cloud/webhook/eye-lp'

const VOLUME_OPTIONS = [
  '<10 procedures / mo (early-stage)',
  '10–30 procedures / mo (growing)',
  '30–60 procedures / mo (established)',
  '60+ procedures / mo (chain / hospital)',
]
const URGENCY_OPTIONS = ['🔥 Urgent, starting within 30 days', '📅 This quarter', '🤔 Just exploring']
const CONTACT_TIME_OPTIONS = ['Morning (9am–12pm)', 'Afternoon (12–4pm)', 'Evening (4–8pm)', 'Anytime, WhatsApp first']
const PROCEDURE_FOCUS = ['LASIK / refractive primarily', 'Cataracts primarily', 'Both equally']

export default function HeroForm() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const fd = new FormData(e.currentTarget)
    const payload = {
      vertical: 'eye-surgery', source: 'hero_form', city: 'Hyderabad',
      clinic_name: fd.get('clinic_name'), whatsapp: fd.get('whatsapp'),
      monthly_volume: fd.get('monthly_volume'), procedure_focus: fd.get('procedure_focus'),
      urgency: fd.get('urgency'), preferred_contact_time: fd.get('preferred_contact_time'),
      utm: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      submitted_at: new Date().toISOString(),
    }
    try {
      const sent = navigator.sendBeacon ? navigator.sendBeacon(WEBHOOK_URL, new Blob([JSON.stringify(payload)], { type: 'application/json' })) : false
      if (!sent) {
        await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), mode: 'no-cors', keepalive: true })
      }
      setSubmitted(true)
    } catch (err) {
      console.error('Eye form submit error', err)
      setError('Could not submit. WhatsApp us at +1 777 233 2996.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border-2 border-[#D5EB4B] bg-[#FFFDF7] p-8 text-center shadow-[0_20px_60px_rgba(42,42,53,0.08)]">
        <div className="text-3xl font-bold text-[#2A2A35] mb-3">Locked in.</div>
        <p className="text-[#5A5A66] mb-5 leading-relaxed">We&apos;ll WhatsApp you within 30 min. If urgent:</p>
        <a href="https://wa.me/17772332996" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#2A2A35] text-[#D5EB4B] font-semibold hover:bg-[#1A1A22] transition-colors">+1 777 233 2996</a>
      </motion.div>
    )
  }

  const fieldClass = 'w-full px-4 py-3 rounded-lg bg-[#FFFDF7] border border-[#2A2A35]/15 text-[#2A2A35] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2A2A35] focus:ring-2 focus:ring-[#D5EB4B]/40 transition-all'
  const labelClass = 'block text-sm font-semibold text-[#2A2A35] mb-1.5'

  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} onSubmit={handleSubmit} className="rounded-2xl border-2 border-[#2A2A35] bg-[#FFFDF7] p-5 sm:p-6 space-y-3.5 shadow-[0_20px_60px_rgba(42,42,53,0.12)]">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D5EB4B] text-[#2A2A35] text-xs font-bold uppercase tracking-wider mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2A2A35] animate-pulse" />
          3 founding slots left. ₹2L locked
        </div>
        <h3 className="text-2xl font-bold text-[#2A2A35] leading-tight">See your 90-day procedure target.</h3>
        <p className="text-sm text-[#5A5A66] mt-1.5 leading-relaxed">Free free OT audit + a custom growth target for your clinic. Reply in 4 hours.</p>
      </div>
      <div>
        <label htmlFor="clinic_name" className={labelClass}>Your clinic</label>
        <input id="clinic_name" name="clinic_name" required className={fieldClass} placeholder="e.g., Envision LASIK, Jubilee Hills" />
      </div>
      <div>
        <label htmlFor="whatsapp" className={labelClass}>WhatsApp number</label>
        <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" required className={fieldClass} placeholder="+91 9XXXX XXXXX" />
      </div>
      <div>
        <label htmlFor="procedure_focus" className={labelClass}>Procedure focus</label>
        <select id="procedure_focus" name="procedure_focus" required className={fieldClass}>
          <option value="">Pick one…</option>
          {PROCEDURE_FOCUS.map((v) => (<option key={v} value={v}>{v}</option>))}
        </select>
      </div>
      <div>
        <label htmlFor="monthly_volume" className={labelClass}>Procedures booked each month today</label>
        <select id="monthly_volume" name="monthly_volume" required className={fieldClass}>
          <option value="">Pick one…</option>
          {VOLUME_OPTIONS.map((v) => (<option key={v} value={v}>{v}</option>))}
        </select>
      </div>
      <div>
        <label htmlFor="urgency" className={labelClass}>How fast do you want to scale?</label>
        <select id="urgency" name="urgency" required className={fieldClass}>
          <option value="">Pick one…</option>
          {URGENCY_OPTIONS.map((u) => (<option key={u} value={u}>{u}</option>))}
        </select>
      </div>
      <div>
        <label htmlFor="preferred_contact_time" className={labelClass}>Best time to reach you</label>
        <select id="preferred_contact_time" name="preferred_contact_time" required className={fieldClass}>
          <option value="">Pick one…</option>
          {CONTACT_TIME_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={submitting} className="w-full px-6 py-3.5 rounded-lg bg-[#2A2A35] text-[#FFFDF7] font-bold hover:bg-[#1A1A22] disabled:opacity-50 transition-colors cursor-pointer">
        {submitting ? 'Submitting…' : 'Get free ₹40K free OT audit + 90-day OT plan →'}
      </button>
      <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">DPDP-compliant. We don&apos;t pitch your competitors. Reply within 30 min on WhatsApp · audit by EOD.</p>
    </motion.form>
  )
}
