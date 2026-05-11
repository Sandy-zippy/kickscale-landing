import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'

const WEBHOOK_URL =
  import.meta.env.VITE_IVF_WEBHOOK_URL ||
  'https://sandyautomations.app.n8n.cloud/webhook/ivf-lp'

const VOLUME_OPTIONS = [
  '<10 cycles / mo (early-stage)',
  '10–30 cycles / mo (growing)',
  '30–60 cycles / mo (established)',
  '60+ cycles / mo (chain / large clinic)',
]

const URGENCY_OPTIONS = [
  '🔥 Urgent, starting within 30 days',
  '📅 This quarter',
  '🤔 Just exploring',
]

const CONTACT_TIME_OPTIONS = [
  'Morning (9am–12pm)',
  'Afternoon (12–4pm)',
  'Evening (4–8pm)',
  'Anytime. WhatsApp first',
]

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
      vertical: 'ivf',
      source: 'hero_form',
      city: 'Hyderabad',
      clinic_name: fd.get('clinic_name'),
      whatsapp: fd.get('whatsapp'),
      monthly_cycle_volume: fd.get('monthly_cycle_volume'),
      urgency: fd.get('urgency'),
      preferred_contact_time: fd.get('preferred_contact_time'),
      utm: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
      submitted_at: new Date().toISOString(),
    }

    try {
      const sent = navigator.sendBeacon
        ? navigator.sendBeacon(WEBHOOK_URL, new Blob([JSON.stringify(payload)], { type: 'application/json' }))
        : false
      if (!sent) {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors',
          keepalive: true,
        })
      }
      setSubmitted(true)
    } catch (err) {
      console.error('IVF hero form submit error', err)
      setError('Could not submit. WhatsApp us instead at +1 777 233 2996.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 border-[#D5EB4B] bg-[#FFFDF7] p-8 text-center shadow-[0_20px_60px_rgba(42,42,53,0.08)]"
      >
        <div className="text-3xl font-bold text-[#2A2A35] mb-3">Locked in.</div>
        <p className="text-[#5A5A66] mb-5 leading-relaxed">
          We&apos;ll WhatsApp you within 30 min. If urgent:
        </p>
        <a
          href="https://wa.me/17772332996"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#2A2A35] text-[#D5EB4B] font-semibold hover:bg-[#1A1A22] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
          +1 777 233 2996
        </a>
      </motion.div>
    )
  }

  const fieldClass =
    'w-full px-4 py-3 rounded-lg bg-[#FFFDF7] border border-[#2A2A35]/15 text-[#2A2A35] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2A2A35] focus:ring-2 focus:ring-[#D5EB4B]/40 transition-all'
  const labelClass = 'block text-sm font-semibold text-[#2A2A35] mb-1.5'

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 border-[#2A2A35] bg-[#FFFDF7] p-5 sm:p-6 space-y-3.5 shadow-[0_20px_60px_rgba(42,42,53,0.12)]"
    >
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D5EB4B] text-[#2A2A35] text-xs font-bold uppercase tracking-wider mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2A2A35] animate-pulse" />
          2 founding slots left · ₹2L locked
        </div>
        <h3 className="text-2xl font-bold text-[#2A2A35] leading-tight">
          See your 90-day cycle target.
        </h3>
        <p className="text-sm text-[#5A5A66] mt-1.5 leading-relaxed">
          Free cycle-CAC audit + a custom growth target for your clinic. Reply in 4 hours.
        </p>
      </div>

      <div>
        <label htmlFor="clinic_name" className={labelClass}>Your clinic</label>
        <input
          id="clinic_name"
          name="clinic_name"
          required
          className={fieldClass}
          placeholder="e.g., Hegde Fertility, Banjara Hills"
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className={labelClass}>WhatsApp number</label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          required
          className={fieldClass}
          placeholder="+91 9XXXX XXXXX"
        />
      </div>

      <div>
        <label htmlFor="monthly_cycle_volume" className={labelClass}>Cycles you book each month today</label>
        <select id="monthly_cycle_volume" name="monthly_cycle_volume" required className={fieldClass}>
          <option value="">Pick one…</option>
          {VOLUME_OPTIONS.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="urgency" className={labelClass}>How fast do you want to scale?</label>
        <select id="urgency" name="urgency" required className={fieldClass}>
          <option value="">Pick one…</option>
          {URGENCY_OPTIONS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="preferred_contact_time" className={labelClass}>Best time to reach you</label>
        <select id="preferred_contact_time" name="preferred_contact_time" required className={fieldClass}>
          <option value="">Pick one…</option>
          {CONTACT_TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3.5 rounded-lg bg-[#2A2A35] text-[#FFFDF7] font-bold hover:bg-[#1A1A22] disabled:opacity-50 transition-colors cursor-pointer"
      >
        {submitting ? 'Submitting…' : 'Get free ₹40K cycle-CAC audit + 90-day cycle plan →'}
      </button>

      <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">
        DPDP-compliant. We don&apos;t pitch your competitors. Reply within 30 min on WhatsApp · audit by EOD.
      </p>
    </motion.form>
  )
}
