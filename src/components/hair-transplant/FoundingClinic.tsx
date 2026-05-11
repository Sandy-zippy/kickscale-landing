import { motion } from 'framer-motion'
import WhatsAppCTA from './WhatsAppCTA'

const BENEFITS = [
  {
    num: '01',
    title: 'Founding rate locked forever',
    body: '₹2L/mo for the sprint AND any ongoing retainer. Standard rate after slots fill is ₹3L/mo. 33% saving, locked the day you sign.',
  },
  {
    num: '02',
    title: '12-month city-exclusivity',
    body: 'For one year, we don’t pitch your IVF competitors anywhere in Hyderabad. Your stack, your wedge.',
  },
  {
    num: '03',
    title: 'Named case-study rights',
    body: 'You decide whether we publish. Say yes, you’re the named Hyderabad reference. Say no, your data stays internal forever.',
  },
]

export default function FoundingClinic() {
  return (
    <section id="apply" className="bg-[#2A2A35] text-[#FFFDF7] py-24 sm:py-32 px-6 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-15"
        style={{ background: '#D5EB4B', filter: 'blur(80px)' }}
      />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 mb-14 items-end"
        >
          <div>
            <div className="text-xs tracking-[0.18em] uppercase font-bold text-[#D5EB4B] mb-3">
              Founding clinic offer
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold leading-[1.02] tracking-tight">
              Three slots.
              <br />
              Hyderabad only.
              <br />
              <span className="text-[#D5EB4B]">₹2L locked forever.</span>
            </h2>
          </div>
          <div className="rounded-2xl border-2 border-[#D5EB4B] bg-[#D5EB4B]/10 p-6 text-center">
            <div className="text-xs uppercase tracking-wider font-mono text-[#D5EB4B] mb-2">
              Slots remaining
            </div>
            <div className="text-7xl font-bold text-[#FFFDF7] font-mono leading-none">2<span className="text-3xl text-[#FFFDF7]/40 font-normal"> / 5</span></div>
            <div className="text-sm text-[#FFFDF7]/70 mt-3 leading-relaxed">
              When slots close, sprint price moves to <span className="text-[#FFFDF7] font-semibold">₹3L/mo</span>. The price never goes back down.
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-[#FFFDF7]/15 bg-[#FFFDF7]/5 p-6 hover:bg-[#FFFDF7]/10 transition-colors"
            >
              <div className="text-3xl font-bold text-[#D5EB4B] font-mono mb-3">{b.num}</div>
              <h3 className="text-xl font-bold mb-2">{b.title}</h3>
              <p className="text-[#FFFDF7]/70 leading-relaxed">{b.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap gap-4 items-center"
        >
          <WhatsAppCTA variant="primary" label="WhatsApp us → 30-min reply" trackingLabel="founding_wa" />
          <a
            href="#hero-form"
            data-tracking="founding_apply"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium border border-[#FFFDF7]/30 text-[#FFFDF7] hover:border-[#D5EB4B] hover:text-[#D5EB4B] transition-colors"
          >
            ↑ Lock my slot — hero form
          </a>
        </motion.div>
      </div>
    </section>
  )
}
