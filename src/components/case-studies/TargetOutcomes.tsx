import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface Outcome {
  metric: string
  before: string
  after: string
  caveat?: string
}

interface Props {
  outcomes: Outcome[]
  heading?: string
  subhead?: string
}

export default function TargetOutcomes({
  outcomes,
  heading = 'Target outcomes',
  subhead = 'Honest target ranges, not invented client numbers.',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const reduce = useReducedMotion()

  return (
    <section id="outcomes" className="relative py-20 lg:py-24 px-4 bg-[#0c0c10] overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(213,235,75,0.10) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(213,235,75,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(213,235,75,0.035) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-6xl mx-auto" ref={ref}>
        <div className="text-center mb-12 lg:mb-14">
          <motion.span
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
            className="inline-block text-[11px] font-mono uppercase tracking-[0.22em] text-[#D5EB4B] mb-4"
          >
            The Numbers
          </motion.span>
          <motion.h2
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={reduce ? { duration: 0 } : { duration: 0.45, delay: 0.1, ease: 'easeOut' }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight"
          >
            {heading}
          </motion.h2>
          <motion.p
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={reduce ? { duration: 0 } : { duration: 0.45, delay: 0.2, ease: 'easeOut' }}
            className="text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            {subhead}
          </motion.p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
          {outcomes.map((o, i) => (
            <motion.div
              key={i}
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={reduce ? { duration: 0 } : { duration: 0.5, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
              className="group relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 lg:p-7 hover:bg-white/[0.05] hover:border-[#D5EB4B]/30 transition-all overflow-hidden"
            >
              {/* Card glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at top, rgba(213,235,75,0.08) 0%, transparent 70%)',
                }}
                aria-hidden="true"
              />
              <div className="relative">
                <p className="text-[10px] font-mono text-white/45 uppercase tracking-[0.18em] mb-5">
                  {o.metric}
                </p>
                <div className="flex items-baseline gap-2 lg:gap-3 font-mono mb-3 flex-wrap">
                  <span className="text-xl lg:text-2xl text-red-400/90 line-through decoration-red-400/40">
                    {o.before}
                  </span>
                  <span className="text-white/25 text-lg" aria-hidden="true">→</span>
                  <span
                    className="text-3xl lg:text-4xl font-bold text-[#D5EB4B] leading-none tabular-nums"
                    style={{ textShadow: '0 0 24px rgba(213,235,75,0.4)' }}
                  >
                    {o.after}
                  </span>
                </div>
                {o.caveat && (
                  <p className="text-xs text-white/45 italic leading-relaxed">{o.caveat}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
