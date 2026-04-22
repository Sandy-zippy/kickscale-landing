import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { getMotif } from './IndustryMotif'
import type { CaseStudySlug } from '../../pages/case-studies/types'

interface Bubble {
  text: string
  x: number    // % from left
  y: number    // % from top (within chaos zone, not full card)
}

interface Props {
  slug: CaseStudySlug
  // Status bar
  statusLeft: string         // e.g., "Dr's phone"
  statusTime: string         // e.g., "11:47 PM"
  statusTimeResolved: string // e.g., "7:00 AM"
  // Chaos zone
  bubbles: Bubble[]          // 6-8 quantified pain statements
  // Counter
  counterMaxValue: number    // peak chaos value, e.g., 47
  counterUnit: string        // e.g., "Unread", "Hrs/wk", "Days"
  counterDanger: string      // e.g., "overwhelmed"
  // Resolution
  resolutionTitle: string    // e.g., "25 hrs/week back. No-shows halved."
  resolutionSubtitle: string // e.g., "4-week sprint · live in 28 days"
  ariaLabel: string
}

const CYCLE_MS = 9000  // chaos 0-5s, resolve 5-9s, repeat

export default function HeroAnimationFrame({
  slug,
  statusLeft,
  statusTime,
  statusTimeResolved,
  bubbles,
  counterMaxValue,
  counterUnit,
  counterDanger,
  resolutionTitle,
  resolutionSubtitle,
  ariaLabel,
}: Props) {
  const motif = getMotif(slug)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.2 })
  const reduce = useReducedMotion()
  const [counter, setCounter] = useState(0)
  const [phase, setPhase] = useState<'chaos' | 'resolve'>('chaos')

  useEffect(() => {
    if (!inView || reduce) return
    const start = Date.now()
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) % CYCLE_MS
      const newPhase = elapsed < 5000 ? 'chaos' : 'resolve'
      setPhase(newPhase)
      if (elapsed < 5000) {
        setCounter(Math.round((elapsed / 5000) * counterMaxValue))
      } else if (elapsed < 6500) {
        setCounter(Math.round(counterMaxValue - ((elapsed - 5000) / 1500) * counterMaxValue))
      } else {
        setCounter(0)
      }
    }, 80)
    return () => clearInterval(id)
  }, [inView, reduce, counterMaxValue])

  const isResolved = phase === 'resolve' && counter === 0

  return (
    <div
      ref={ref}
      className={`relative w-full aspect-square rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-[0_10px_40px_rgba(26,26,46,0.06)] ${motif.bgGradient}`}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Industry icon as huge subtle watermark */}
      <motif.Icon className="absolute -bottom-8 -right-8 w-72 h-72 text-[#1A1A2E] opacity-[0.04] pointer-events-none" />

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(42,42,53,0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />

      {/* TOP ZONE — Status bar with industry icon badge */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-[#6B7280] z-30">
        <span className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ backgroundColor: motif.accentTint, color: 'white' }}
          >
            <motif.Icon className="w-3 h-3" />
          </span>
          <motion.span
            animate={reduce ? {} : isResolved ? {} : { opacity: [1, 0.3, 1] }}
            transition={reduce ? {} : isResolved ? {} : { duration: 1.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-red-500"
            aria-hidden="true"
            style={isResolved ? { backgroundColor: '#22C55E' } : {}}
          />
          {statusLeft} · {isResolved ? statusTimeResolved : statusTime}
        </span>
        <span className="opacity-70">{isResolved ? 'Quiet' : `${counter} ${counterUnit.toLowerCase()}`}</span>
      </div>

      {/* "BEFORE" label */}
      <motion.div
        animate={{ opacity: phase === 'chaos' ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-12 left-3 z-20 pointer-events-none"
      >
        <span className="text-[9px] font-mono uppercase tracking-widest text-red-600 font-bold bg-red-50 border border-red-200 rounded px-2 py-0.5">
          Before
        </span>
      </motion.div>

      {/* CHAOS ZONE — bubbles in mid card */}
      <div className="absolute inset-x-0 top-20 bottom-24 overflow-hidden">
        {bubbles.map((b, i) => {
          const isVisible = phase === 'chaos'
          return (
            <motion.div
              key={i}
              initial={reduce ? { opacity: 0.92, scale: 1 } : { opacity: 0, scale: 0.5, rotate: i % 2 === 0 ? -6 : 6 }}
              animate={
                reduce
                  ? { opacity: isVisible ? 0.92 : 0 }
                  : isVisible
                    ? { opacity: 0.95, scale: 1, rotate: i % 2 === 0 ? -1.5 : 1.5 }
                    : { opacity: 0, scale: 0.7, y: -20 }
              }
              transition={
                reduce
                  ? { duration: 0 }
                  : isVisible
                    ? { duration: 0.4, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }
                    : { duration: 0.3, delay: i * 0.04, ease: 'easeIn' }
              }
              className="absolute bg-white rounded-xl px-2.5 py-1.5 text-[11px] shadow-md max-w-[150px] font-mono font-semibold text-[#1A1A2E] border whitespace-nowrap"
              style={{ left: `${b.x}%`, top: `${b.y}%`, borderColor: motif.accentTint + '30' }}
            >
              {b.text}
            </motion.div>
          )
        })}

        {/* Resolved checks */}
        {phase === 'resolve' && bubbles.map((b, i) => (
          <motion.div
            key={`check-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0.5] }}
            transition={reduce ? { duration: 0 } : { duration: 1.5, delay: 0.2 + i * 0.06 }}
            className="absolute w-7 h-7 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-sm font-bold shadow-lg"
            style={{ left: `${b.x + 4}%`, top: `${b.y - 1}%` }}
            aria-hidden="true"
          >
            ✓
          </motion.div>
        ))}
      </div>

      {/* COUNTER — top-right, dominant during chaos, hides during resolve */}
      <motion.div
        animate={
          reduce
            ? {}
            : phase === 'chaos'
              ? { scale: [1, 1.04, 1], boxShadow: ['0 8px 20px rgba(239,68,68,0.4)', '0 12px 30px rgba(239,68,68,0.6)', '0 8px 20px rgba(239,68,68,0.4)'] }
              : { scale: 0, opacity: 0 }
        }
        transition={reduce ? {} : phase === 'chaos' ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5, ease: 'easeOut' }}
        className="absolute top-10 right-4 w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white flex flex-col items-center justify-center font-mono shadow-2xl z-30"
        aria-hidden="true"
      >
        <span className="text-[8px] uppercase tracking-widest opacity-80 leading-none mb-0.5">{counterUnit}</span>
        <span className="text-3xl font-bold leading-none tabular-nums">{counter}</span>
      </motion.div>

      {/* AI activation sweep */}
      {phase === 'resolve' && !reduce && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '100%', opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#D5EB4B]/40 to-transparent skew-x-12 z-10 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* "AFTER" label (only on resolve) */}
      <motion.div
        animate={{ opacity: phase === 'resolve' ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-24 left-3 z-20 pointer-events-none"
      >
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#22C55E] font-bold bg-green-50 border border-green-200 rounded px-2 py-0.5">
          After ZippyScale
        </span>
      </motion.div>

      {/* RESOLUTION BANNER — bottom */}
      <motion.div
        animate={
          reduce
            ? { y: 0 }
            : phase === 'resolve' ? { y: 0 } : { y: '105%' }
        }
        transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 right-0 bg-[#D5EB4B] text-[#1A1A2E] py-3.5 px-4 z-30 shadow-[0_-4px_20px_rgba(213,235,75,0.3)]"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={reduce ? {} : { scale: [1, 1.08, 1] }}
            transition={reduce ? {} : { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-9 h-9 rounded-full bg-[#1A1A2E] text-[#D5EB4B] flex items-center justify-center font-bold text-xs shrink-0"
          >
            ZS
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">{resolutionTitle}</p>
            <p className="text-[11px] text-[#1A1A2E]/70 leading-tight mt-0.5">{resolutionSubtitle}</p>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#1A1A2E]/70">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" aria-hidden="true" />
            Live
          </span>
        </div>
      </motion.div>

      {/* Hidden but used for status text */}
      <span className="sr-only">{counterDanger}</span>
    </div>
  )
}
