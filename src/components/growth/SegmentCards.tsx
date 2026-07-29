/**
 * The six segments, as flip cards.
 *
 * Replaces the tab UI this section used to run — Sandy's note on that version
 * was "a lot of text, no dynamic elements". Front carries the name and icon;
 * the back carries the blurb, the clients and any linked work, all of which
 * already exist in src/data/growth.ts, so no new copy was invented.
 *
 * Flip is driven by :hover AND :focus-within (see .zs-flip in globals.css), and
 * the hidden face is `visibility: hidden` so its links stay out of the tab
 * order until it faces the viewer. That is the whole reason the card is a
 * <div> with focusable children rather than a <button> — a button cannot
 * legally contain the links on the back.
 */
import type { ReactElement } from 'react'
import { motion } from 'framer-motion'
import { VERTICALS, CLIENTS, SEGMENT_ACCENTS } from '../../data/growth'
import { EASE_OUT, INK_2 } from './kinetic'

/* ── icons: one stroke weight, drawn on currentColor ── */

const ICON: Record<string, ReactElement> = {
  'luxury-bespoke-retail': (
    <>
      <path d="M12 3.5 9 7l3 2 3-2-3-3.5Z" />
      <path d="M9 7 4 11.5V20h16v-8.5L15 7" />
    </>
  ),
  education: (
    <>
      <path d="M12 4 2.5 9 12 14l9.5-5L12 4Z" />
      <path d="M6.5 11.2V16c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4.8" />
    </>
  ),
  'networking-groups': (
    <>
      <circle cx="12" cy="6" r="2.6" />
      <circle cx="5.5" cy="17" r="2.6" />
      <circle cx="18.5" cy="17" r="2.6" />
      <path d="M10.4 8.2 7.1 14.6M13.6 8.2l3.3 6.4M8.1 17h7.8" />
    </>
  ),
  'pr-agencies': (
    <>
      <path d="M4 10v4a1 1 0 0 0 1 1h2.8l6.2 3.6V5.4L8 9H5a1 1 0 0 0-1 1Z" />
      <path d="M17.5 9.2a4 4 0 0 1 0 5.6" />
    </>
  ),
  'speciality-hospitals-clinics': (
    <>
      <rect x="3.2" y="7" width="17.6" height="12.5" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M12 11v4.5M9.75 13.25h4.5" />
    </>
  ),
  'commercial-real-estate': (
    <>
      <path d="M4 20V6.5L11 4v16" />
      <path d="M11 9.5 20 12v8H4" />
      <path d="M7 9h1M7 12.5h1M7 16h1M14.5 14.5h1M14.5 17.5h1" />
    </>
  ),
}

function Icon({ slug }: { slug: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden
    >
      {ICON[slug]}
    </svg>
  )
}

/* ── card ── */

function Card({ index, slug }: { index: number; slug: string }) {
  const v = VERTICALS.find(x => x.slug === slug)!
  const accent = SEGMENT_ACCENTS[slug] ?? '#D5EB4B'
  const names = v.clients.map(s => CLIENTS.find(c => c.slug === s)?.name).filter(Boolean) as string[]

  const face =
    'zs-flip-face absolute inset-0 flex flex-col rounded-[24px] border p-6 sm:p-7'

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.07, 0.42), ease: EASE_OUT }}
      // focusable so the card flips on keyboard focus and on a touch tap —
      // hover alone would leave the back face unreachable on phones
      tabIndex={0}
      role="group"
      aria-label={`${v.name} — focus to reveal details`}
      className="zs-flip h-[310px] rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]"
    >
      <div className="zs-flip-inner h-full w-full">
        {/* front */}
        <div
          className={`zs-flip-front zs-gloss overflow-hidden ${face} border-white/10`}
          style={{ background: INK_2, borderTopColor: accent, borderTopWidth: 3 }}
        >
          <div className="flex items-start justify-between">
            <span className="font-['JetBrains_Mono'] text-xs font-bold tracking-[0.16em]" style={{ color: accent }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">
              Flip ↻
            </span>
          </div>

          <span className="mt-7 block" style={{ color: accent }}>
            <Icon slug={slug} />
          </span>

          <h3 className="mt-auto font-['Space_Grotesk'] text-[1.6rem] font-bold leading-[1.05] tracking-[-0.02em] text-white">
            {v.name}
          </h3>

          <span
            className="mt-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold text-[#0A0A0C]"
            style={{ background: accent }}
            aria-hidden
          >
            →
          </span>
        </div>

        {/* back */}
        <div
          className={`zs-flip-back overflow-y-auto ${face} border-white/12`}
          style={{ background: '#171722' }}
        >
          <p className="text-[14.5px] leading-relaxed text-white/72">{v.blurb}</p>

          {names.length > 0 && (
            <div className="mt-5">
              <span className="font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">
                Who we do this for
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {names.map(n => (
                  <span
                    key={n}
                    className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-medium text-white/70"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {v.links && (
            <div className="mt-5">
              <span className="font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">
                Work in this segment
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {v.links.map(l => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-medium text-white/70 transition-colors hover:text-[#0A0A0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    style={{ ['--tw-ring-offset-color' as string]: INK_2 }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = accent
                      e.currentTarget.style.borderColor = accent
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = ''
                      e.currentTarget.style.borderColor = ''
                    }}
                  >
                    {l.label} →
                  </a>
                ))}
              </div>
            </div>
          )}

          {names.length === 0 && !v.links && (
            <p className="mt-5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-white/30">
              Open segment — taking briefs
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function SegmentCards() {
  return (
    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {VERTICALS.map((v, i) => (
        <Card key={v.slug} index={i} slug={v.slug} />
      ))}
    </div>
  )
}
