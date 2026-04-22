import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import AnimatedCounter from '../components/ui/AnimatedCounter'
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
      <Nav noBanner ctaHref="/#quiz" />
      <main className="bg-[#FFFDF7] text-[#1A1A2E] pt-[60px]">
        {/* Hero */}
        <section className="py-16 lg:py-20 px-4 text-center">
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#B8CF2E] mb-3">
            Case Studies
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Real work. Indian SMBs. 4-week sprints.
          </h1>
          <p className="max-w-2xl mx-auto text-[#4B5563] mb-10 leading-relaxed">
            How we automate lead flow, reconciliation, reporting, and customer retention for ₹50L-10Cr businesses across 10 industries.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-center">
            <div>
              <AnimatedCounter target={20} suffix="+" className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] font-mono" />
              <p className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mt-1">businesses</p>
            </div>
            <div>
              <AnimatedCounter target={8000} suffix="+" className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] font-mono" />
              <p className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mt-1">hours eliminated</p>
            </div>
            <div>
              <AnimatedCounter target={1.6} prefix="₹" suffix="Cr+" decimals={1} className="text-3xl lg:text-4xl font-bold text-[#1A1A2E] font-mono" />
              <p className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mt-1">saved</p>
            </div>
          </div>
        </section>

        {/* Filter chips */}
        <section className="sticky top-[60px] bg-[#FFFDF7]/95 backdrop-blur border-y border-[#E5E7EB] py-4 px-4 z-40">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-2 justify-center">
            {INDUSTRIES.map((ind) => {
              const active = filter === ind
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setFilter(ind)}
                  aria-pressed={active}
                  className={`px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:outline-none ${
                    active
                      ? 'bg-[#1A1A2E] text-white'
                      : 'bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-[#D5EB4B] hover:text-[#1A1A2E]'
                  }`}
                >
                  {ind}
                </button>
              )
            })}
          </div>
        </section>

        {/* Grid */}
        <section className="py-12 lg:py-16 px-4">
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
                    className="block bg-white border border-[#E5E7EB] rounded-2xl p-6 hover:border-[#D5EB4B] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(213,235,75,0.15)] transition-all cursor-pointer h-full focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:outline-none"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono uppercase tracking-widest text-[#B8CF2E]">
                        {m.industry}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] bg-[#FFFDF7] border border-[#E5E7EB] px-2 py-0.5 rounded">
                        {m.primaryPain}
                      </span>
                    </div>
                    <h3 className="font-bold text-[18px] text-[#1A1A2E] mb-4 leading-tight line-clamp-3">
                      {m.shortTitle || m.title}
                    </h3>
                    <div className="flex items-baseline gap-2 font-mono mb-1">
                      <span className="text-lg text-red-600 font-bold">{m.heroStatBefore}</span>
                      <span className="text-[#6B7280]" aria-hidden="true">→</span>
                      <span className="text-lg text-[#B8CF2E] font-bold">{m.heroStatAfter}</span>
                    </div>
                    <p className="text-xs text-[#6B7280] font-mono uppercase tracking-wider mb-5">{m.heroStatLabel}</p>
                    <span className="text-sm font-semibold text-[#B8CF2E] inline-flex items-center gap-1">
                      Read case study <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Mid-CTA dark strip */}
        <section className="bg-[#2A2A35] py-14 px-4 text-center">
          <p className="text-white text-lg lg:text-xl mb-2 font-semibold max-w-2xl mx-auto">
            Don't see your industry?
          </p>
          <p className="text-white/70 mb-6 max-w-2xl mx-auto">
            Book a 15-min audit. We map your stack and flag the 3 biggest leaks. No deck, no pressure.
          </p>
          <a
            href="/#quiz"
            className="inline-block bg-[#D5EB4B] text-[#0c0c10] font-bold px-8 py-4 rounded-xl hover:bg-[#E4F57A] transition-colors shadow-[0_4px_20px_rgba(213,235,75,0.25)]"
          >
            Book my free 48h audit →
          </a>
        </section>
      </main>
      <Footer />
    </>
  )
}
