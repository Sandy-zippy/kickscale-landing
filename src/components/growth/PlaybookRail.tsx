/**
 * Horizontal drag rail of playbook cards — the reference's "Selected Work"
 * carousel, rebuilt on content ZippyScale actually has.
 *
 * IMPORTANT FRAMING: the source is CASE_STUDIES, which are modelled ICP
 * playbooks with *target* outcomes, not delivered client results (the HVAC
 * content literally reads "Target: quote turnaround from 2 days to 4 hours").
 * So the cards say "VIEW PLAYBOOK", and the number is shown as an explicit
 * before → after pair rather than a bare trophy figure. Do not reframe these
 * as shipped results without real numbers from the client.
 *
 * Interaction: native horizontal scroll (so trackpad, shift-wheel, touch and
 * keyboard all work for free) plus pointer-drag on top for mouse users.
 * `touch-action: pan-y` on .zs-rail keeps vertical scroll and the browser's
 * back-swipe intact, and stops it fighting Lenis.
 */
import { useRef, useState, useCallback } from 'react'
import { registry } from '../../pages/case-studies/registry'
import { LIME } from './kinetic'

/** the registry is keyed by slug; the rail wants a stable ordered list */
const CASE_STUDIES = Object.values(registry)

/** a hue per card so the rail reads as a set of distinct pieces of work */
const WASH = [
  '#D5EB4B',
  '#7DD3FC',
  '#F9A8D4',
  '#6EE7B7',
  '#FDBA74',
  '#C4B5FD',
  '#FCA5A5',
  '#A5B4FC',
  '#5EEAD4',
  '#FDE68A',
]

export default function PlaybookRail() {
  const rail = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  // kept in a ref, not state — these change on every pointermove and must not
  // trigger a re-render of ten cards mid-drag
  const start = useRef({ x: 0, left: 0, moved: 0 })

  const onDown = useCallback((e: React.PointerEvent) => {
    // let touch use native momentum scrolling; only take over for mouse/pen
    if (e.pointerType === 'touch' || !rail.current) return
    setDragging(true)
    start.current = { x: e.clientX, left: rail.current.scrollLeft, moved: 0 }
    rail.current.setPointerCapture(e.pointerId)
  }, [])

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !rail.current) return
      const dx = e.clientX - start.current.x
      start.current.moved = Math.max(start.current.moved, Math.abs(dx))
      rail.current.scrollLeft = start.current.left - dx
    },
    [dragging]
  )

  const onUp = useCallback((e: React.PointerEvent) => {
    if (!rail.current) return
    setDragging(false)
    if (rail.current.hasPointerCapture(e.pointerId)) rail.current.releasePointerCapture(e.pointerId)
  }, [])

  return (
    <div className="relative">
      <div
        ref={rail}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={`zs-rail -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 ${
          dragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
        role="region"
        aria-label="Playbooks — scroll horizontally to explore"
        tabIndex={0}
      >
        {CASE_STUDIES.map((cs, i) => {
          const accent = WASH[i % WASH.length]
          return (
            <a
              key={cs.slug}
              href={`/case-studies/${cs.slug}`}
              // a drag that travelled more than a few pixels is a scroll, not a
              // click — without this every drag ends on a navigation
              onClick={e => {
                if (start.current.moved > 6) e.preventDefault()
              }}
              draggable={false}
              className="group/card relative flex h-[430px] w-[280px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[24px] border border-white/10 p-6 transition-transform duration-[400ms] hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507] sm:w-[310px]"
              style={{ background: '#0B0B12' }}
            >
              {/* colour wash standing in for project art — the reference uses a
                  duotone photo here; we have no per-client imagery cleared */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.22] transition-opacity duration-[400ms] group-hover/card:opacity-40"
                style={{
                  background: `radial-gradient(ellipse 120% 80% at 50% 0%, ${accent} 0%, transparent 62%)`,
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                style={{ background: accent }}
              />

              <div className="relative flex items-start justify-between">
                <span className="font-['JetBrains_Mono'] text-xs font-bold tracking-[0.16em] text-white/35">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="rounded-full border px-2.5 py-1 font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: accent, borderColor: `${accent}55` }}
                >
                  {cs.industry}
                </span>
              </div>

              <div className="relative mt-auto">
                {/* before → after, not a bare number: these are targets */}
                <div className="flex items-baseline gap-2">
                  <span className="font-['Space_Grotesk'] text-[1.1rem] font-bold text-white/35 line-through decoration-white/25">
                    {cs.heroStatBefore}
                  </span>
                  <span aria-hidden className="text-white/30">
                    →
                  </span>
                </div>
                <div
                  className="font-['Space_Grotesk'] text-[2.7rem] font-bold leading-[0.95] tracking-[-0.03em]"
                  style={{ color: accent }}
                >
                  {cs.heroStatAfter}
                </div>
                <div className="mt-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-white/45">
                  {cs.heroStatLabel}
                </div>

                <h3 className="mt-4 font-['Space_Grotesk'] text-[1.05rem] font-bold leading-snug text-white">
                  {cs.shortTitle}
                </h3>

                <span className="mt-4 inline-flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-[0.16em] text-white/55 transition-colors group-hover/card:text-white">
                  View playbook
                  <span aria-hidden className="transition-transform group-hover/card:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </a>
          )
        })}

        {/* tail card — the rail should end on an invitation, not a hard stop */}
        <a
          href="/case-studies"
          className="group/end flex h-[430px] w-[240px] shrink-0 snap-start flex-col items-start justify-end rounded-[24px] border border-dashed border-white/15 p-6 transition-colors hover:border-[#D5EB4B]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5EB4B]"
        >
          <span className="font-['Space_Grotesk'] text-[1.4rem] font-bold leading-tight text-white/80">
            All playbooks
          </span>
          <span className="mt-2 text-sm text-white/45">Ten industries, fully written up.</span>
          <span
            className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-[17px] font-bold text-[#0A0A0C] transition-transform group-hover/end:translate-x-1"
            style={{ background: LIME }}
            aria-hidden
          >
            →
          </span>
        </a>
      </div>

      <p className="mt-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-white/30">
        ← Drag or scroll to explore →
      </p>
    </div>
  )
}
