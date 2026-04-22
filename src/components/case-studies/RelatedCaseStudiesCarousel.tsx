import { Link } from 'react-router-dom'
import { registry } from '../../pages/case-studies/registry'
import type { CaseStudySlug } from '../../pages/case-studies/types'

export default function RelatedCaseStudiesCarousel({ slugs }: { slugs: CaseStudySlug[] }) {
  const cards = slugs.map(slug => registry[slug]).filter(m => m && m.title)

  if (cards.length === 0) return null

  return (
    <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory">
      {cards.map(m => (
        <li key={m.slug} className="snap-start">
          <Link
            to={`/case-studies/${m.slug}`}
            className="block bg-white border border-[#E5E7EB] rounded-xl p-6 hover:border-[#D5EB4B] hover:-translate-y-0.5 transition-all cursor-pointer h-full"
          >
            <span className="inline-block text-xs font-mono text-[#B8CF2E] uppercase tracking-wider mb-2">
              {m.industry}
            </span>
            <h4 className="font-bold text-[#1A1A2E] mb-3 line-clamp-2">{m.shortTitle}</h4>
            <p className="text-xs text-[#6B7280] font-mono">
              {m.heroStatBefore} → {m.heroStatAfter} {m.heroStatLabel}
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-[#B8CF2E]">Read →</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
