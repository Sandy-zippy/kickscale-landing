import { Suspense } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { CaseStudySlug } from '../../pages/case-studies/types'
import { heroVariants } from './hero-variants'

interface Props {
  variant: CaseStudySlug
  statBefore: string
  statAfter: string
  statLabel: string
  headline: string
  ctaHref?: string
}

export default function CaseStudyHero({
  variant,
  statBefore,
  statAfter,
  statLabel,
  headline,
  ctaHref = '/#quiz',
}: Props) {
  const reduce = useReducedMotion()
  const Variant = heroVariants[variant]

  return (
    <section id="hero" className="relative py-16 lg:py-24 px-4 bg-[#FFFDF7] overflow-hidden">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#B8CF2E] mb-4">
            Case Study
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-[#1A1A2E] mb-6">
            {headline}
          </h1>
          <div className="flex items-baseline gap-4 mb-8 flex-wrap">
            <motion.span
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
              className="text-4xl font-mono font-bold text-red-600"
            >
              {statBefore}
            </motion.span>
            <span className="text-[#6B7280]" aria-hidden="true">→</span>
            <motion.span
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="text-4xl font-mono font-bold text-[#B8CF2E]"
            >
              {statAfter}
            </motion.span>
            <span className="text-sm text-[#6B7280] ml-2">{statLabel}</span>
          </div>
          <a
            href={ctaHref}
            className="inline-block bg-[#D5EB4B] text-[#0c0c10] font-bold px-6 py-3 rounded-xl hover:bg-[#E4F57A] transition-colors"
          >
            See your own before/after →
          </a>
        </div>
        <div className="relative">
          <Suspense fallback={<div className="w-full aspect-square bg-gray-100 rounded-2xl animate-pulse" aria-label="Loading hero animation" />}>
            <Variant />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
