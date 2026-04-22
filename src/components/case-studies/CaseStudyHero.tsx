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
  subhead?: string
  benefits?: string[]
  ctaText?: string
  ctaSubtext?: string
  industryBadge?: string
  ctaHref?: string
}

export default function CaseStudyHero({
  variant,
  statBefore,
  statAfter,
  statLabel,
  headline,
  subhead,
  benefits,
  ctaText = 'Book my clinic audit (free, 48h)',
  ctaSubtext = 'No commitment. We map your processes for free.',
  industryBadge = 'Case Study',
  ctaHref = '/#quiz',
}: Props) {
  const reduce = useReducedMotion()
  const Variant = heroVariants[variant]

  return (
    <section id="hero" className="relative py-12 lg:py-16 px-4 bg-[#FFFDF7] overflow-hidden">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        <div>
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#B8CF2E] mb-4">
            {industryBadge}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-[#1A1A2E] mb-4">
            {headline}
          </h1>
          {subhead && (
            <p className="text-base lg:text-lg text-[#4B5563] mb-6 leading-relaxed">{subhead}</p>
          )}
          <div className="flex items-baseline gap-3 mb-6 flex-wrap">
            <motion.span
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
              className="text-3xl lg:text-4xl font-mono font-bold text-red-600"
            >
              {statBefore}
            </motion.span>
            <span className="text-[#6B7280]" aria-hidden="true">→</span>
            <motion.span
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="text-3xl lg:text-4xl font-mono font-bold text-[#B8CF2E]"
            >
              {statAfter}
            </motion.span>
            <span className="text-sm text-[#6B7280] ml-1">{statLabel}</span>
          </div>
          {benefits && benefits.length > 0 && (
            <ul className="space-y-2 mb-8">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A2E]">
                  <span className="text-[#22C55E] font-bold mt-0.5 shrink-0" aria-hidden="true">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          <div>
            <a
              href={ctaHref}
              className="inline-block bg-[#D5EB4B] text-[#0c0c10] font-bold px-6 py-3.5 rounded-xl hover:bg-[#E4F57A] transition-colors shadow-[0_4px_20px_rgba(213,235,75,0.25)]"
            >
              {ctaText} →
            </a>
            {ctaSubtext && <p className="text-xs text-[#6B7280] mt-2">{ctaSubtext}</p>}
          </div>
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
