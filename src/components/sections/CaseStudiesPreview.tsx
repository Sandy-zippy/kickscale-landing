import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'
import { registry } from '../../pages/case-studies/registry'
import type { CaseStudySlug } from '../../pages/case-studies/types'

// Curated 6 of 10 — highest conversion-signal industries first per GHL data
// (Healthcare 1 hot lead, Edtech matches Iyra validation, Manufacturing 44% of leads)
const FEATURED: CaseStudySlug[] = [
  'homeopathic-clinic-patient-flow',
  'coaching-institute-admission-to-enrollment',
  'auto-parts-distribution-order-automation',
  'd2c-apparel-beauty-retention-automation',
  'pharma-distributor-field-orders',
  'corporate-travel-quotes-reconciliation',
]

export default function CaseStudiesPreview() {
  return (
    <section id="case-studies-preview" className="py-20 lg:py-24 px-4 bg-[#FFFDF7]">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#B8CF2E] mb-3">
              Real work. Indian SMBs.
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1A1A2E] leading-tight mb-4">
              How we did it. Across 10 industries.
            </h2>
            <p className="text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
              4-week sprints. Honest target outcomes. No invented client names. Each case study shows the exact stack, the 4-week plan, what ₹1.5L buys, and why this beats Bitespeed, Zoho, or hiring more people.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {FEATURED.map((slug, i) => {
            const m = registry[slug]
            if (!m?.title) return null
            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: 'easeOut' }}
              >
                <Link
                  to={`/case-studies/${slug}`}
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
            )
          })}
        </div>

        <ScrollReveal>
          <div className="text-center">
            <Link
              to="/case-studies"
              className="inline-flex items-center gap-2 bg-[#1A1A2E] text-[#D5EB4B] font-bold px-8 py-4 rounded-xl hover:bg-[#2A2A35] transition-colors shadow-[0_4px_20px_rgba(26,26,46,0.15)]"
            >
              See all 10 case studies <span aria-hidden="true">→</span>
            </Link>
            <p className="text-xs text-[#6B7280] mt-3 font-mono uppercase tracking-wider">
              Healthcare · Education · Manufacturing · Pharma · D2C · Services · Hospitality · Travel
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
