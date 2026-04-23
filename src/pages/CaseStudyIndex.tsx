import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import AuditFormSection from '../components/case-studies/AuditFormSection'
import { registry } from './case-studies/registry'
import type { CaseStudyIndustry, CaseStudyMetadata } from './case-studies/types'

const INDUSTRIES: Array<'All' | CaseStudyIndustry> = [
  'All',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Pharma',
  'D2C',
  'Services',
  'Hospitality',
  'Travel',
]

const SEO_TITLE = 'Case Studies | ZippyScale — Automation for Indian SMBs'
const SEO_DESC =
  'Real 4-week automation sprints for Indian businesses at ₹50L-10Cr revenue. Healthcare, education, manufacturing, pharma, D2C, services, hospitality, travel.'

function setMetaTag(name: string, value: string, prop = false) {
  const attr = prop ? 'property' : 'name'
  let tag = document.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', value)
}

export default function CaseStudyIndex() {
  const [filter, setFilter] = useState<'All' | CaseStudyIndustry>('All')

  useEffect(() => {
    document.title = SEO_TITLE
    setMetaTag('description', SEO_DESC)
    setMetaTag('og:title', SEO_TITLE, true)
    setMetaTag('og:description', SEO_DESC, true)
    setMetaTag('og:url', 'https://zippyscale.in/case-studies', true)
    setMetaTag('og:type', 'website', true)
  }, [])

  const cards = useMemo<CaseStudyMetadata[]>(() => {
    return Object.values(registry).filter(
      (m) => m.title && (filter === 'All' || m.industry === filter)
    )
  }, [filter])

  return (
    <>
      <Nav noBanner ctaHref="#audit-form" />
      <main className="bg-[#FFFDF7] text-[#1A1A2E] pt-[60px]">
        {/* Hero — dark + dramatic */}
        <section className="relative py-20 lg:py-28 px-4 text-center bg-[#0c0c10] overflow-hidden">
          {/* Ambient radial glows */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 50% 30%, rgba(213,235,75,0.12) 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, rgba(213,235,75,0.06) 0%, transparent 40%), radial-gradient(ellipse at 90% 90%, rgba(213,235,75,0.06) 0%, transparent 40%)',
            }}
            aria-hidden="true"
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(213,235,75,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(213,235,75,0.04) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 max-w-4xl mx-auto">
            <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#D5EB4B] mb-5 bg-[#D5EB4B]/10 border border-[#D5EB4B]/25 px-3 py-1.5 rounded-full">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#D5EB4B] opacity-75 animate-ping" aria-hidden="true" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D5EB4B]" />
              </span>
              Case Studies
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-[72px] font-bold leading-[1.02] tracking-[-0.02em] text-white mb-5">
              Real work.{' '}
              <span className="text-[#D5EB4B]" style={{ textShadow: '0 0 40px rgba(213,235,75,0.4)' }}>
                Indian SMBs.
              </span>
              <br className="hidden md:block" />
              {' '}4-week sprints.
            </h1>
            <p className="max-w-2xl mx-auto text-base md:text-lg text-white/65 mb-12 leading-relaxed">
              How we automate lead flow, reconciliation, reporting, and customer retention for ₹50L-10Cr businesses across 10 industries.
            </p>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-6 text-center">
              <div>
                <AnimatedCounter
                  target={20}
                  suffix="+"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-mono leading-none tabular-nums"
                />
                <p className="text-[10px] md:text-xs font-mono text-white/50 uppercase tracking-[0.18em] mt-2">businesses</p>
              </div>
              <div>
                <AnimatedCounter
                  target={8000}
                  suffix="+"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#D5EB4B] font-mono leading-none tabular-nums"
                />
                <p className="text-[10px] md:text-xs font-mono text-white/50 uppercase tracking-[0.18em] mt-2">hours eliminated</p>
              </div>
              <div>
                <AnimatedCounter
                  target={1.6}
                  prefix="₹"
                  suffix="Cr+"
                  decimals={1}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-mono leading-none tabular-nums"
                />
                <p className="text-[10px] md:text-xs font-mono text-white/50 uppercase tracking-[0.18em] mt-2">saved</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filter chips */}
        <section className="sticky top-[60px] bg-[#FFFDF7]/95 backdrop-blur border-b border-[#E5E7EB] py-4 px-4 z-40">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-2 justify-center">
            {INDUSTRIES.map((ind) => {
              const active = filter === ind
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setFilter(ind)}
                  aria-pressed={active}
                  className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:outline-none ${
                    active
                      ? 'bg-[#1A1A2E] text-white shadow-md'
                      : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#D5EB4B] hover:text-[#1A1A2E] hover:bg-[#FFFDF7]'
                  }`}
                >
                  {ind}
                </button>
              )
            })}
          </div>
        </section>

        {/* Grid */}
        <section className="py-14 lg:py-20 px-4">
          {cards.length === 0 ? (
            <p className="text-center text-[#6B7280] py-16">No case studies in this industry yet. Try another filter.</p>
          ) : (
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cards.map((m, i) => (
                <motion.div
                  key={m.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: 'easeOut' }}
                >
                  <Link
                    to={`/case-studies/${m.slug}`}
                    className="group relative block bg-white border border-[#E5E7EB] rounded-2xl p-6 hover:border-[#D5EB4B] hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(213,235,75,0.35)] transition-all cursor-pointer h-full focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:outline-none overflow-hidden"
                  >
                    {/* Corner lime glow on hover */}
                    <div
                      className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(213,235,75,0.25) 0%, transparent 70%)',
                      }}
                      aria-hidden="true"
                    />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#B8CF2E]">
                          {m.industry}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] bg-[#FFFDF7] border border-[#E5E7EB] px-2 py-0.5 rounded">
                          {m.primaryPain}
                        </span>
                      </div>
                      <h3 className="font-bold text-[19px] text-[#1A1A2E] mb-5 leading-tight line-clamp-3">
                        {m.shortTitle || m.title}
                      </h3>
                      <div className="flex items-baseline gap-2 font-mono mb-1">
                        <span className="text-xl text-red-500/90 font-bold line-through decoration-red-500/40">
                          {m.heroStatBefore}
                        </span>
                        <span className="text-[#6B7280]" aria-hidden="true">→</span>
                        <span className="text-2xl text-[#1A1A2E] font-bold">
                          {m.heroStatAfter}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-[0.18em] mb-6">{m.heroStatLabel}</p>
                      <span className="text-sm font-bold text-[#1A1A2E] inline-flex items-center gap-1.5 group-hover:text-[#B8CF2E] transition-colors">
                        Read case study
                        <span
                          aria-hidden="true"
                          className="inline-block transition-transform group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Bridge strip — leads into the form */}
        <section className="relative bg-[#1A1A2E] py-14 lg:py-16 px-4 text-center overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 50% 50%, rgba(213,235,75,0.08) 0%, transparent 60%)',
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <p className="text-white text-xl lg:text-2xl mb-3 font-bold max-w-2xl mx-auto tracking-tight">
              Don't see your exact industry? Same playbook.
            </p>
            <p className="text-white/70 mb-7 max-w-2xl mx-auto leading-relaxed">
              We map your stack and flag the 3 biggest leaks in 48 hours. No deck. No pressure.
            </p>
            <a
              href="#audit-form"
              className="inline-flex items-center gap-2 bg-[#D5EB4B] text-[#0c0c10] font-bold px-8 py-4 rounded-xl hover:bg-[#E4F57A] transition-all shadow-[0_0_40px_rgba(213,235,75,0.4)] hover:shadow-[0_0_60px_rgba(213,235,75,0.6)]"
            >
              Book my free 48h audit <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        {/* The actual form */}
        <AuditFormSection
          source="case-study-hub"
          industryHint=""
          headline="Book your free 48-hour audit"
          subhead="Pick any of the 10 industries above for a deeper read, or just fill this in. We respond in under 60 minutes."
        />
      </main>
      <Footer />
    </>
  )
}
