import { motion } from 'framer-motion'
import AnimatedCounter from '../ui/AnimatedCounter'
import Icon from './Icon'

const OUTCOMES = [
  { metric: 45, suffix: '%', headline: 'Procedures up', body: 'Within 90 days vs your trailing baseline. Booked OT, not free screening signups.' },
  { metric: 30, suffix: '%', headline: 'Procedure cost down', body: 'Server-side attribution recovers what iOS 14 + DPDP killed in your pixel.' },
  { metric: 55, suffix: '%', headline: 'Trust objections killed', body: 'Surgeon-volume + dry-eye care creative + tech storytelling. Hospital-vs-standalone bias flips.' },
]

export default function AfterSprint() {
  return (
    <section className="bg-[#FFFDF7] py-20 sm:py-28 px-6 border-t border-[#2A2A35]/10">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 mb-12 items-end">
          <div>
            <div className="text-xs tracking-[0.18em] uppercase font-bold text-[#D5EB4B] mb-3 inline-block bg-[#2A2A35] px-3 py-1 rounded-full">Day 90 outcome</div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#2A2A35] leading-[1.05] tracking-tight mt-3">What changes by the time the sprint ends.</h2>
          </div>
          <p className="text-lg text-[#5A5A66] leading-relaxed">
            Three guarantees go on your MOU. Each tied to a number we measure against your own baseline. Miss any of them by Day 90, you get a refund. <span className="text-[#2A2A35] font-semibold">You don&apos;t pay us to try. You pay us to deliver.</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-8 items-center mb-6">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="relative rounded-2xl overflow-hidden border-2 border-[#2A2A35] bg-[#FFFDF7] shadow-[0_24px_60px_rgba(42,42,53,0.12)]">
            <img src="/ivf-dashboard-hero.png" alt="ZippyScale growth dashboard with procedure-attribution funnel and rising bookings chart" className="w-full h-auto block" loading="lazy" />
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFDF7] border border-[#2A2A35]/15 backdrop-blur-sm shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#D5EB4B] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-mono text-[#2A2A35] tracking-wider uppercase font-bold">Your live dashboard</span>
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2A2A35] text-[#FFFDF7] text-xs font-mono">
              <Icon name="arrow-right" size={12} className="text-[#D5EB4B]" />Procedure cost, not call cost
            </div>
          </motion.div>
          <div className="grid grid-cols-1 gap-3">
            {OUTCOMES.map((o, i) => (
              <motion.div key={o.headline} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5, delay: i * 0.1 }} className="rounded-2xl bg-[#D5EB4B] p-5 sm:p-6 border-2 border-[#2A2A35] flex items-center gap-5 relative overflow-hidden">
                <Icon name="arrow-right" className="absolute top-4 right-4 text-[#2A2A35] -rotate-45" size={20} />
                <div className="text-5xl font-bold text-[#2A2A35] font-mono leading-none flex-shrink-0 min-w-[100px]">
                  <AnimatedCounter target={o.metric} suffix={o.suffix} duration={1.4} />
                </div>
                <div>
                  <div className="text-base font-bold text-[#2A2A35] mb-0.5 leading-tight">{o.headline}</div>
                  <p className="text-xs text-[#2A2A35]/75 leading-snug">{o.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
