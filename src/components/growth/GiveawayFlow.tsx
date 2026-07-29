/**
 * Hero motion graphic for /giveaways — ZippyScale handing tools out to the
 * businesses that run on them.
 *
 * Deliberately NOT another orbit: /growth's hero already uses a ring, and a
 * second one would read as the same illustration twice. This is a left-to-right
 * hand-off instead — a source block on the left, six lanes fanning out, and a
 * segment tile on the right that lights in its own accent as each tool lands.
 *
 * The six lanes and their accents come straight from SEGMENT_ACCENTS, so this
 * and /growth's segment cards can never drift out of sync.
 *
 * The cards carry abstract document glyphs, not product names. We ship one
 * giveaway today; naming six would imply a library that doesn't exist.
 *
 * All CSS keyframes (see .zs-handoff / .zs-catch / .zs-lane / .zs-emit in
 * globals.css) — nothing animates on the main thread, and reduced motion parks
 * the cards mid-lane so it still reads as a diagram.
 */
import type { CSSProperties, ReactElement } from 'react'
import { motion } from 'framer-motion'
import { SEGMENT_ACCENTS } from '../../data/growth'
import { LIME } from './kinetic'

const CYCLE = 5.4 // seconds for one card to cross a lane

/** Short labels — the tile is ~144px, so the full segment names won't fit.
 *  Slugs match src/data/growth.ts. */
const LANES: { slug: string; label: string }[] = [
  { slug: 'luxury-bespoke-retail', label: 'Luxury Retail' },
  { slug: 'education', label: 'Schools' },
  { slug: 'networking-groups', label: 'Networking' },
  { slug: 'pr-agencies', label: 'PR Agencies' },
  { slug: 'speciality-hospitals-clinics', label: 'Clinics' },
  { slug: 'commercial-real-estate', label: 'Real Estate' },
]

/** lane centres, as a percentage of the panel height */
const Y = [7, 23.6, 40.2, 56.8, 73.4, 90]

/* ── recipient glyphs — the same set /growth's segment cards use ── */
const GLYPH: Record<string, ReactElement> = {
  'luxury-bespoke-retail': (
    <>
      <path d="M4 9h16l-1 11H5L4 9Z" />
      <path d="M8.5 9V6.6a3.5 3.5 0 0 1 7 0V9" />
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

/** a tool in flight — a document, a chart readout, a checklist */
function ToolCard({ kind, accent }: { kind: number; accent: string }) {
  return (
    <span
      className="flex h-[50px] w-[40px] flex-col justify-center gap-[4px] rounded-[8px] border px-2"
      style={{
        background: 'linear-gradient(160deg, #1A1A24, #0E0E16)',
        borderColor: `${accent}59`,
        boxShadow: '0 10px 24px -14px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {kind === 0 && (
        <>
          <i className="block h-[2px] w-full rounded-full" style={{ background: accent, opacity: 0.9 }} />
          <i className="block h-[2px] w-4/5 rounded-full bg-white/25" />
          <i className="block h-[2px] w-full rounded-full bg-white/25" />
        </>
      )}
      {kind === 1 && (
        <span className="flex items-end gap-[3px]" style={{ height: 22 }}>
          <i className="block w-[5px] rounded-sm bg-white/25" style={{ height: '38%' }} />
          <i className="block w-[5px] rounded-sm bg-white/25" style={{ height: '62%' }} />
          <i className="block w-[5px] rounded-sm" style={{ height: '100%', background: accent }} />
        </span>
      )}
      {kind === 2 && (
        <>
          {[0, 1].map(i => (
            <span key={i} className="flex items-center gap-[3px]">
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none" aria-hidden className="shrink-0">
                <path d="M1.4 4.2 3 5.8 6.6 2.2" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <i className="block h-[2px] flex-1 rounded-full bg-white/25" />
            </span>
          ))}
        </>
      )}
    </span>
  )
}

export default function GiveawayFlow() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[560px]"
      role="img"
      aria-label={
        'ZippyScale hands free tools and documents out to business owners across all six segments: ' +
        LANES.map(l => l.label).join(', ') +
        '.'
      }
    >
      <div aria-hidden className="relative h-[460px] w-full">
        {/* ── source ── */}
        <div className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-3">
          <span
            className="zs-emit flex h-[70px] w-[70px] items-center justify-center rounded-[19px] border"
            style={{
              background: 'linear-gradient(150deg, #16161F, #0A0A10)',
              borderColor: 'rgba(213,235,75,0.4)',
            }}
          >
            <img src="/logos/icon-64.png" alt="" className="h-7 w-7" />
          </span>
          <span className="font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
            ZippyScale
          </span>
        </div>

        {/* fan: the source sits on the centre line, so every lane needs a
            connector or it looks like it begins in mid-air */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {Y.map(y => (
            <path
              key={y}
              d={`M13 50 C 19 50, 19 ${y}, 25 ${y}`}
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.10"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* ── lanes ── */}
        {LANES.map((lane, i) => {
          const accent = SEGMENT_ACCENTS[lane.slug] ?? LIME
          const delay = (CYCLE / LANES.length) * i
          return (
            <div
              key={lane.slug}
              className="absolute inset-x-0 -translate-y-1/2"
              style={{ top: `${Y[i]}%` }}
            >
              {/* the track */}
              <svg
                className="absolute left-[82px] top-1/2 h-[2px] w-[calc(100%-236px)] -translate-y-1/2 overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 100 2"
              >
                <line
                  x1="0"
                  y1="1"
                  x2="100"
                  y2="1"
                  stroke="#FFFFFF"
                  strokeOpacity="0.10"
                  strokeWidth="2"
                  strokeDasharray="4 8"
                  className="zs-lane"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* the tool in flight. 236px = source gutter + tile + gap; the extra
                  40px is the card's own width, so it lands BESIDE the tile rather
                  than sliding underneath it. */}
              <span
                className="zs-handoff absolute left-[82px] top-1/2 block -translate-y-1/2"
                style={
                  {
                    width: 'calc(100% - 276px)',
                    animationDuration: `${CYCLE}s`,
                    animationDelay: `-${delay}s`,
                  } as CSSProperties
                }
              >
                <ToolCard kind={i % 3} accent={accent} />
              </span>

              {/* the recipient, flashing in its own segment accent */}
              <span
                className="zs-catch absolute right-0 top-1/2 flex w-[144px] -translate-y-1/2 items-center gap-2 rounded-[12px] border px-2.5 py-2"
                style={
                  {
                    animationDuration: `${CYCLE}s`,
                    animationDelay: `-${delay}s`,
                    '--zs-catch-border': `${accent}D9`,
                    '--zs-catch-bg': `${accent}24`,
                  } as CSSProperties
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={accent}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[16px] w-[16px] shrink-0"
                >
                  {GLYPH[lane.slug]}
                </svg>
                <span className="font-['JetBrains_Mono'] text-[8.5px] font-bold uppercase tracking-[0.1em] text-white/70">
                  {lane.label}
                </span>
              </span>
            </div>
          )
        })}
      </div>

      <p
        aria-hidden
        className="mt-2 text-right font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.16em] text-white/25"
      >
        Six segments · business owners
      </p>
    </motion.div>
  )
}
