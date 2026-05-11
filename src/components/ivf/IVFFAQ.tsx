import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from './Icon'

const FAQS = [
  {
    q: 'Where have you done this before?',
    a: 'ZippyScale has run cycle-attributed Meta + Google performance for fertility clinics in Bombay. Anonymized scorecards: ~67% cycle-bookings lift, 40% cycle-cost drop, 60%+ no-show reduction over a 6-month engagement. NDA-bound so we don’t name them. Hyderabad is the first city we’re opening with founding-clinic case-study rights, so your story replaces ours on this page if you say yes.',
  },
  {
    q: '₹2L/mo vs my current ₹50K retainer, too steep?',
    a: 'Different mechanics. A ₹50K retainer pays an account exec who reports CPL. ₹2L/mo runs a full growth team: server-side attribution via Stape, AI creative variants via Higgsfield + Nano Banana, GHL + WhatsApp drip, weekly cycle cost reviews, Claude call-analysis. A clinic doing ₹2L/mo on Meta with broken attribution wastes ~30% of spend (~₹7.2L/year). The recovered spend pays for the sprint inside 2 quarters.',
  },
  {
    q: 'Can your team avoid getting our ad account banned?',
    a: 'Every creative passes a 14-point compliance gate before it reaches Meta’s review queue: ART Act, PCPNDT, ASCI, Meta Health-Restricted, Google Healthcare, DPDP, "no guaranteed pregnancy" language, no gender-selection terms, no misspell-circumvention, price-claim honesty, doctor-credential accuracy, clinical-claim sourcing, photo-consent, WhatsApp opt-in. 1,000+ creatives shipped, zero account bans.',
  },
  {
    q: 'What happens after Day 90?',
    a: 'You see the scorecard. Continue at the founding rate (₹2L/mo locked forever vs ₹3L/mo standard) or pause. No long-term lock-in. Campaigns we built stay running on your ad accounts; we step back from active operations.',
  },
  {
    q: 'I already have an agency. Why switch mid-flight?',
    a: 'You don’t have to switch on Day 1. We do a 30-day shadow audit of your current agency for ₹40K, hand you the gap report (cycle-attribution leaks, creative compliance risks, no-show drag), then you decide. If you don’t switch, you keep the audit deliverables.',
  },
  {
    q: 'Hyderabad-only? My patients come from across South India.',
    a: 'Hyderabad-first because that’s where unit economics are highest and we city-lock founding clinics for 12 months. From Day 60+, we expand the same campaigns to Vijayawada, Vizag, Warangal, Bangalore, Coimbatore: your call when to add geos.',
  },
]

export default function IVFFAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-[#FFFDF7] py-20 sm:py-28 px-6 border-t border-[#2A2A35]/10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="text-xs tracking-[0.18em] uppercase font-bold text-[#2A2A35]/60 mb-3">
            Common questions
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#2A2A35] leading-[1.05] tracking-tight">
            Six questions every Hyderabad IVF clinic owner asks.
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-xl border-2 border-[#2A2A35]/15 bg-[#FFFDF7] overflow-hidden hover:border-[#2A2A35]/30 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full px-5 sm:px-6 py-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-semibold text-[#2A2A35]">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 h-8 w-8 rounded-full bg-[#D5EB4B] flex items-center justify-center text-[#2A2A35] font-bold"
                  >
                    <Icon name="plus" size={16} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 text-[#5A5A66] leading-relaxed">{f.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
