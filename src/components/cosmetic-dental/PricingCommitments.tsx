import { motion } from 'framer-motion'
import Icon from './Icon'

export default function PricingCommitments() {
  return (
    <section id="pricing" className="bg-[#FFFDF7] py-20 sm:py-28 px-6 border-t border-[#2A2A35]/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mb-12"
        >
          <div className="text-xs tracking-[0.18em] uppercase font-bold text-[#2A2A35]/60 mb-3">
            Pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#2A2A35] leading-[1.05] tracking-tight">
            Founding rate locked. <span className="text-[#5A5A66]">Forever.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl border-2 border-[#2A2A35] bg-[#2A2A35] text-[#FFFDF7] p-8"
          >
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[#D5EB4B] text-[#2A2A35] text-xs font-bold uppercase tracking-wider font-mono">
              Founding · 2 of 5 left
            </div>
            <div className="text-xs uppercase tracking-[0.18em] font-bold text-[#D5EB4B] mb-3 mt-3 font-mono">
              Founding clinic
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <div className="text-6xl font-bold text-[#FFFDF7] font-mono">₹2L</div>
              <div className="text-[#FFFDF7]/60">/ month</div>
            </div>
            <div className="text-sm text-[#FFFDF7]/60 mb-7">3-month sprint · ₹6L total</div>
            <ul className="space-y-3 text-[#FFFDF7]/85">
              {[
                'Founding rate locked forever (sprint AND alumni retainer)',
                '12-month Hyderabad city-exclusivity',
                'Named case-study rights',
                '30-day baseline-beat money-back',
                'Same team running our Bombay fertility playbook',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Icon name="check" className="text-[#D5EB4B] mt-0.5 flex-shrink-0" size={18} />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-2xl border-2 border-[#2A2A35]/15 bg-[#FFFDF7] p-8"
          >
            <div className="text-xs uppercase tracking-[0.18em] font-bold text-[#9CA3AF] mb-3 mt-3 font-mono">
              Standard (after slots fill)
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <div className="text-6xl font-bold text-[#9CA3AF] font-mono">₹3L</div>
              <div className="text-[#9CA3AF]">/ month</div>
            </div>
            <div className="text-sm text-[#9CA3AF] mb-7">3-month sprint · ₹9L total</div>
            <ul className="space-y-3 text-[#9CA3AF]">
              {[
                'Sprint pricing only, no alumni rate lock',
                'No city-exclusivity',
                'Anonymised case-study only',
                '30-day baseline-beat money-back',
                'Same team, same deliverables',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Icon name="check" className="text-[#D1D5DB] mt-0.5 flex-shrink-0" size={18} />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
