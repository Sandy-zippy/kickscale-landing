import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface Week {
  week: 1 | 2 | 3 | 4
  title: string
  deliverables: string[]
}

export default function WeekTimeline({ weeks }: { weeks: Week[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const reduce = useReducedMotion()

  return (
    <div ref={ref} className="space-y-4">
      {weeks.map((w, i) => (
        <div key={w.week} className="relative bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <motion.div
            initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={reduce ? { duration: 0 } : { duration: 0.5, delay: i * 0.2, ease: 'easeOut' }}
            className="absolute left-0 top-0 bottom-0 w-full bg-[#D5EB4B]/15 origin-left"
            aria-hidden="true"
          />
          <div className="relative p-6 flex items-start gap-5">
            <div className="shrink-0 w-16 h-16 rounded-lg bg-[#1A1A2E] text-[#D5EB4B] flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] uppercase tracking-wider">Week</span>
              <span className="font-bold text-2xl leading-none">{w.week}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg text-[#1A1A2E] mb-2">{w.title}</h4>
              <ul className="space-y-1 text-[#4B5563] text-sm">
                {w.deliverables.map((d, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-[#B8CF2E] font-bold" aria-hidden="true">→</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
