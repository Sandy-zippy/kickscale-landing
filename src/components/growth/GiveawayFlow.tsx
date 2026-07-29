/**
 * Hero motion graphic for /giveaways — ZippyScale handing tools out to the
 * businesses that run on them.
 *
 * Deliberately NOT another orbit: /growth's hero already uses a ring, and a
 * second one would read as the same illustration twice. This is a left-to-right
 * hand-off instead — a source block on the left, three lanes, and business-owner
 * tiles on the right that light as each tool lands.
 *
 * The cards carry abstract document glyphs, not product names. We ship one
 * giveaway today; naming four would imply a library that doesn't exist.
 *
 * All CSS keyframes (see .zs-handoff / .zs-catch / .zs-lane / .zs-emit in
 * globals.css) — nothing animates on the main thread, and reduced motion parks
 * the cards mid-lane so it still reads as a diagram.
 */
import type { CSSProperties, ReactElement } from 'react'
import { motion } from 'framer-motion'
import { LIME } from './kinetic'

const CYCLE = 4.6 // seconds for one card to cross a lane

const LANES = [
  { label: 'Clinics', delay: 0 },
  { label: 'Retail', delay: CYCLE / 3 },
  { label: 'Schools', delay: (CYCLE / 3) * 2 },
]

/* ── recipient glyphs: one stroke weight, drawn on currentColor ── */
const GLYPH: Record<string, ReactElement> = {
  Clinics: (
    <>
      <rect x="3.2" y="7" width="17.6" height="12.5" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M12 11v4.5M9.75 13.25h4.5" />
    </>
  ),
  Retail: (
    <>
      <path d="M4 9h16l-1 11H5L4 9Z" />
      <path d="M8.5 9V6.6a3.5 3.5 0 0 1 7 0V9" />
    </>
  ),
  Schools: (
    <>
      <path d="M12 4 2.5 9 12 14l9.5-5L12 4Z" />
      <path d="M6.5 11.2V16c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4.8" />
    </>
  ),
}

/** a tool card in flight — a document, a calculator readout, a checklist */
function ToolCard({ kind }: { kind: 0 | 1 | 2 }) {
  return (
    <span
      className="flex h-[62px] w-[50px] flex-col justify-center gap-[5px] rounded-[9px] border px-2.5"
      style={{
        background: 'linear-gradient(160deg, #1A1A24, #0E0E16)',
        borderColor: 'rgba(213,235,75,0.35)',
        boxShadow: '0 10px 26px -14px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {kind === 0 && (
        <>
          <i className="block h-[2px] w-full rounded-full" style={{ background: LIME, opacity: 0.85 }} />
          <i className="block h-[2px] w-4/5 rounded-full bg-white/25" />
          <i className="block h-[2px] w-full rounded-full bg-white/25" />
          <i className="block h-[2px] w-3/5 rounded-full bg-white/25" />
        </>
      )}
      {kind === 1 && (
        <span className="flex items-end gap-[3px]" style={{ height: 26 }}>
          <i className="block w-[6px] rounded-sm bg-white/25" style={{ height: '38%' }} />
          <i className="block w-[6px] rounded-sm bg-white/25" style={{ height: '62%' }} />
          <i className="block w-[6px] rounded-sm" style={{ height: '100%', background: LIME }} />
        </span>
      )}
      {kind === 2 && (
        <>
          {[0, 1, 2].map(i => (
            <span key={i} className="flex items-center gap-[4px]">
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none" aria-hidden>
                <path d="M1.4 4.2 3 5.8 6.6 2.2" stroke={LIME} strokeWidth="1.6" strokeLinecap="round" />
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
      aria-label="ZippyScale hands free tools and documents out to business owners — clinics, retail and schools."
    >
      <div aria-hidden className="relative h-[400px] w-full">
        {/* ── source: where the tools come from ── */}
        <div className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-3">
          <span
            className="zs-emit flex h-[74px] w-[74px] items-center justify-center rounded-[20px] border"
            style={{
              background: 'linear-gradient(150deg, #16161F, #0A0A10)',
              borderColor: 'rgba(213,235,75,0.4)',
            }}
          >
            <img src="/logos/icon-64.png" alt="" className="h-8 w-8" />
          </span>
          <span className="font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
            ZippyScale
          </span>
        </div>

        {/* fan: without these the top and bottom lanes look like they start in
            mid-air, because the source block sits on the middle lane's axis */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path d="M14 50 C 20 50, 20 16, 26 16" fill="none" stroke="#FFFFFF" strokeOpacity="0.10" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M14 50 C 20 50, 20 84, 26 84" fill="none" stroke="#FFFFFF" strokeOpacity="0.10" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* ── lanes ── */}
        {LANES.map((lane, i) => {
          const top = `${16 + i * 34}%`
          return (
            <div key={lane.label} className="absolute inset-x-0" style={{ top }}>
              {/* the track */}
              <svg
                className="absolute left-[86px] right-[132px] top-1/2 h-[2px] w-[calc(100%-218px)] -translate-y-1/2 overflow-visible"
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

              {/* the card in flight */}
              <span
                className="zs-handoff absolute left-[86px] top-1/2 block -translate-y-1/2"
                style={
                  {
                    // 218px = source + tile gutters, 50px = the card's own width, so the card's
                    // RIGHT edge lands at the tile rather than sliding under it
                    width: 'calc(100% - 268px)',
                    animationDuration: `${CYCLE}s`,
                    animationDelay: `-${lane.delay}s`,
                  } as CSSProperties
                }
              >
                <ToolCard kind={i as 0 | 1 | 2} />
              </span>

              {/* the recipient */}
              <span
                className="zs-catch absolute right-0 top-1/2 flex w-[122px] -translate-y-1/2 items-center gap-2.5 rounded-[14px] border px-3 py-2.5"
                style={
                  {
                    animationDuration: `${CYCLE}s`,
                    animationDelay: `-${lane.delay}s`,
                  } as CSSProperties
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={LIME}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[18px] w-[18px] shrink-0"
                >
                  {GLYPH[lane.label]}
                </svg>
                <span className="font-['JetBrains_Mono'] text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/70">
                  {lane.label}
                </span>
              </span>
            </div>
          )
        })}

        <span className="absolute right-0 top-[2%] flex w-[122px] justify-center font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.16em] text-white/25">
          Business owners
        </span>
      </div>
    </motion.div>
  )
}
