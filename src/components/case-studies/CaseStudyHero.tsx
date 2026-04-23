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
  ctaHref = '#audit-form',
}: Props) {
  const reduce = useReducedMotion()
  const Variant = heroVariants[variant]

  return (
    <section id="hero" className="relative py-14 lg:py-24 px-4 bg-[#0c0c10] overflow-hidden">
      {/* Ambient radial glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 15% 30%, rgba(213,235,75,0.08) 0%, transparent 45%), radial-gradient(ellipse at 85% 70%, rgba(213,235,75,0.06) 0%, transparent 45%)',
        }}
        aria-hidden="true"
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.5] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(213,235,75,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(213,235,75,0.04) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 75%)',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#D5EB4B] mb-5 bg-[#D5EB4B]/10 border border-[#D5EB4B]/25 px-3 py-1.5 rounded-full">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#D5EB4B] opacity-75 animate-ping" aria-hidden="true" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D5EB4B]" />
            </span>
            {industryBadge}
          </span>
          <h1 className="text-[34px] md:text-5xl lg:text-[64px] font-bold leading-[1.05] tracking-[-0.02em] text-white mb-5">
            {headline}
          </h1>
          {subhead && (
            <p className="text-base md:text-lg lg:text-xl text-white/65 mb-8 leading-relaxed max-w-xl">{subhead}</p>
          )}
          <div className="flex items-baseline gap-3 md:gap-4 mb-7 flex-wrap">
            <motion.span
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
              className="text-5xl md:text-6xl lg:text-7xl font-mono font-bold text-red-400 leading-none tabular-nums"
              style={{ textShadow: '0 0 30px rgba(248,113,113,0.25)' }}
            >
              {statBefore}
            </motion.span>
            <span className="text-2xl md:text-3xl text-white/30" aria-hidden="true">→</span>
            <motion.span
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="text-5xl md:text-6xl lg:text-7xl font-mono font-bold text-[#D5EB4B] leading-none tabular-nums"
              style={{ textShadow: '0 0 40px rgba(213,235,75,0.45)' }}
            >
              {statAfter}
            </motion.span>
            <span className="text-xs lg:text-sm font-mono uppercase tracking-[0.18em] text-white/45 basis-full md:basis-auto md:ml-2">{statLabel}</span>
          </div>
          {benefits && benefits.length > 0 && (
            <ul className="space-y-2.5 mb-8">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm md:text-base text-white/85">
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D5EB4B]/15 border border-[#D5EB4B]/30 text-[#D5EB4B] font-bold text-xs mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          <div>
            <a
              href={ctaHref}
              className="group inline-flex items-center gap-2 bg-[#D5EB4B] text-[#0c0c10] font-bold px-7 py-4 rounded-xl hover:bg-[#E4F57A] transition-all shadow-[0_0_40px_rgba(213,235,75,0.35)] hover:shadow-[0_0_60px_rgba(213,235,75,0.55)] text-base lg:text-lg"
            >
              {ctaText}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            {ctaSubtext && <p className="text-xs text-white/50 mt-3">{ctaSubtext}</p>}
          </div>
        </div>
        <div className="relative">
          {/* Glow halo behind the animation card */}
          <div
            className="absolute -inset-6 pointer-events-none rounded-[32px]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(213,235,75,0.18) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <Suspense
              fallback={
                <div
                  className="w-full aspect-square bg-white/5 border border-white/10 rounded-2xl animate-pulse"
                  aria-label="Loading hero animation"
                />
              }
            >
              <Variant />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  )
}
