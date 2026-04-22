import { motion, useReducedMotion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface Step { step: string; timeCost: string }

interface Props {
  steps: Step[]
  totalSummary?: { value: string; label: string }
}

export default function BeforeStateMap({ steps, totalSummary }: Props) {
  const ref = useRef<HTMLOListElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const reduce = useReducedMotion()

  return (
    <div>
      {totalSummary && (
        <motion.div
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
          className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-5 flex items-baseline gap-4 flex-wrap"
        >
          <span className="text-4xl md:text-5xl font-mono font-bold text-red-600 leading-none">
            {totalSummary.value}
          </span>
          <span className="text-[#1A1A2E] font-semibold">{totalSummary.label}</span>
        </motion.div>
      )}
      <ol ref={ref} className="space-y-3">
      {steps.map((s, i) => (
        <motion.li
          key={i}
          initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={reduce ? { duration: 0 } : { duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
          className="flex items-start gap-4 bg-white border border-[#E5E7EB] rounded-xl p-5"
        >
          <span className="shrink-0 w-10 h-10 rounded-lg bg-red-50 text-red-600 font-mono font-bold flex items-center justify-center text-sm">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="flex-1">
            <p className="text-[#1A1A2E] font-medium">{s.step}</p>
            <p className="text-xs font-mono text-red-600 mt-1">{s.timeCost}</p>
          </div>
        </motion.li>
      ))}
      </ol>
    </div>
  )
}
