/**
 * "We already know what's broken" — the six segments, each as what hurts today
 * versus what changes.
 *
 * This replaces the earlier PlaybookRail, which dressed the AI-automation case
 * studies up as "playbooks" and linked to pages that read as something we sell.
 * Sandy's instruction: don't put anything on the page we don't actually have.
 * So there are no links and no numbers here — only the problem, stated well
 * enough that the reader recognises their own business in it.
 *
 * Interaction: native horizontal scroll (trackpad, shift-wheel, touch and
 * keyboard all work for free) with pointer-drag layered on for mouse users.
 * Nothing is a link, so a drag can never end on an accidental navigation —
 * which is the bug the previous version had.
 */
import { useRef, useState, useCallback } from 'react'
import { VERTICALS, SEGMENT_ACCENTS } from '../../data/growth'

function Cross() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden className="mt-[5px] shrink-0">
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="#8A8A96" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function Tick({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden className="mt-[5px] shrink-0">
      <path d="M2.6 7.4l2.8 2.8L11.4 4.2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SegmentInsight() {
  const rail = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  // a ref, not state — these change on every pointermove and must not re-render
  // six cards mid-drag
  const start = useRef({ x: 0, left: 0 })

  const onDown = useCallback((e: React.PointerEvent) => {
    // let touch keep native momentum scrolling; only take over for mouse/pen
    if (e.pointerType === 'touch' || !rail.current) return
    setDragging(true)
    start.current = { x: e.clientX, left: rail.current.scrollLeft }
    rail.current.setPointerCapture(e.pointerId)
  }, [])

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !rail.current) return
      rail.current.scrollLeft = start.current.left - (e.clientX - start.current.x)
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
        aria-label="What we understand about each segment — scroll horizontally"
        tabIndex={0}
      >
        {VERTICALS.map((v, i) => {
          const accent = SEGMENT_ACCENTS[v.slug] ?? '#D5EB4B'
          return (
            <article
              key={v.slug}
              className="relative flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border border-white/10 p-6 sm:w-[340px] sm:p-7"
              style={{ background: '#0B0B12' }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                style={{ background: accent }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.13]"
                style={{ background: `radial-gradient(ellipse 130% 55% at 50% 0%, ${accent} 0%, transparent 60%)` }}
              />

              <div className="relative flex items-start justify-between gap-3">
                <h3 className="font-['Space_Grotesk'] text-[1.2rem] font-bold leading-[1.15] tracking-[-0.02em] text-white">
                  {v.name}
                </h3>
                <span
                  className="font-['JetBrains_Mono'] text-xs font-bold tracking-[0.16em]"
                  style={{ color: accent }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="relative mt-6">
                <span className="font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.18em] text-white/32">
                  What hurts today
                </span>
                <ul className="mt-3 space-y-2.5">
                  {v.pains.map(t => (
                    <li key={t} className="flex gap-2.5 text-[13.5px] leading-snug text-white/48">
                      <Cross />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                aria-hidden
                className="relative my-6 h-px w-full"
                style={{ background: `linear-gradient(to right, ${accent}55, transparent)` }}
              />

              <div className="relative">
                <span
                  className="font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: accent }}
                >
                  What changes with us
                </span>
                <ul className="mt-3 space-y-2.5">
                  {v.gains.map(t => (
                    <li key={t} className="flex gap-2.5 text-[13.5px] leading-snug text-white/78">
                      <Tick color={accent} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          )
        })}
      </div>

      <p className="mt-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-white/30">
        ← Drag or scroll to explore →
      </p>
    </div>
  )
}
