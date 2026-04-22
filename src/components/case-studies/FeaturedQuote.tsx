import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface Props {
  quote: string
  attribution: string
  context?: string
}

export default function FeaturedQuote({ quote, attribution, context }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const reduce = useReducedMotion()

  return (
    <motion.figure
      ref={ref}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={reduce ? { duration: 0 } : { duration: 0.7, ease: 'easeOut' }}
      className="relative max-w-4xl mx-auto"
    >
      {/* Giant lime quote mark */}
      <span
        className="absolute -top-4 left-0 lg:-left-8 font-['Space_Grotesk'] text-[140px] lg:text-[180px] leading-none text-[#D5EB4B] opacity-90 select-none pointer-events-none"
        aria-hidden="true"
      >
        “
      </span>
      <blockquote className="relative pl-6 lg:pl-12 pt-12 lg:pt-16">
        <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A2E] leading-tight tracking-tight">
          {quote}
        </p>
        <figcaption className="mt-6 flex items-center gap-3">
          <span className="w-12 h-[2px] bg-[#D5EB4B]" aria-hidden="true" />
          <div>
            <p className="font-semibold text-[#1A1A2E] text-sm">{attribution}</p>
            {context && <p className="text-xs text-[#6B7280] mt-0.5">{context}</p>}
          </div>
        </figcaption>
      </blockquote>
    </motion.figure>
  )
}
