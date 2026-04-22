import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface Step {
  hour: string
  title: string
  description: string
}

interface Props {
  steps: Step[]
  ctaHref?: string
  ctaText?: string
}

export default function AuditTimeline({
  steps,
  ctaHref = '/#quiz',
  ctaText = 'Book my free audit',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const reduce = useReducedMotion()

  return (
    <div ref={ref} className="relative">
      {/* Vertical timeline line */}
      <motion.div
        initial={reduce ? { scaleY: 1 } : { scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : {}}
        transition={reduce ? { duration: 0 } : { duration: 1, ease: 'easeOut' }}
        className="absolute left-[27px] md:left-[31px] top-2 bottom-16 w-0.5 bg-gradient-to-b from-[#D5EB4B] via-[#D5EB4B] to-transparent origin-top"
        aria-hidden="true"
      />
      <ol className="space-y-6">
        {steps.map((step, i) => (
          <motion.li
            key={i}
            initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
            className="relative pl-16 md:pl-20"
          >
            <div className="absolute left-0 top-0 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#1A1A2E] border-4 border-[#D5EB4B] flex flex-col items-center justify-center text-center shadow-lg">
              <span className="text-[8px] md:text-[9px] font-mono uppercase tracking-wider text-[#D5EB4B] leading-none">
                Hour
              </span>
              <span className="font-bold text-sm md:text-base text-white leading-none mt-0.5">
                {step.hour}
              </span>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <h4 className="font-bold text-[#1A1A2E] text-base md:text-lg mb-1">{step.title}</h4>
              <p className="text-sm text-[#4B5563] leading-relaxed">{step.description}</p>
            </div>
          </motion.li>
        ))}
      </ol>
      <motion.div
        initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 0.3 + steps.length * 0.15, ease: 'easeOut' }}
        className="mt-8 pl-16 md:pl-20"
      >
        <a
          href={ctaHref}
          className="inline-flex items-center gap-2 bg-[#D5EB4B] text-[#0c0c10] font-bold px-6 py-3 rounded-xl hover:bg-[#E4F57A] transition-colors shadow-[0_4px_20px_rgba(213,235,75,0.25)]"
        >
          {ctaText} →
        </a>
      </motion.div>
    </div>
  )
}
