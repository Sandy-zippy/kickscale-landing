import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

const PAINS = [
  { text: '30% no-shows / mo', x: 8, y: 18 },
  { text: '47 unread @ 11pm', x: 56, y: 14 },
  { text: 'Refill chase: 8h/wk', x: 12, y: 38 },
  { text: 'Sunday Tally: 3hrs gone', x: 50, y: 34 },
  { text: '60% follow-ups missed', x: 6, y: 60 },
  { text: 'D+14 calls forgotten', x: 54, y: 56 },
  { text: 'Cash recon @ 9pm', x: 18, y: 80 },
  { text: 'Lapsed in 45 days', x: 50, y: 78 },
]

// Cycle: 0-3.5s chaos building, 3.5-5s peak chaos, 5-6s AI takeover, 6-9s resolution, repeat
const CYCLE_MS = 9000

export default function HeroHomeopathic() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.2 })
  const reduce = useReducedMotion()
  const [tick, setTick] = useState(0)
  const [counter, setCounter] = useState(0)
  const [phase, setPhase] = useState<'chaos' | 'resolve'>('chaos')

  // Continuous loop counter that drives the cycle, runs whenever in view
  useEffect(() => {
    if (!inView || reduce) return
    const start = Date.now()
    let frame = 0
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) % CYCLE_MS
      const newPhase: 'chaos' | 'resolve' = elapsed < 5000 ? 'chaos' : 'resolve'
      setPhase(newPhase)

      // Counter ramps 0→47 over first 5s, then drops 47→0 over 1.5s, stays at 0
      if (elapsed < 5000) {
        setCounter(Math.round((elapsed / 5000) * 47))
      } else if (elapsed < 6500) {
        setCounter(Math.round(47 - ((elapsed - 5000) / 1500) * 47))
      } else {
        setCounter(0)
      }
      frame++
      setTick(frame)
    }, 80)
    return () => clearInterval(id)
  }, [inView, reduce])

  const isResolved = phase === 'resolve' && counter === 0

  return (
    <div
      ref={ref}
      className="relative w-full aspect-square bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#F5F0E8] rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-[0_10px_40px_rgba(26,26,46,0.06)]"
      role="img"
      aria-label="A clinic owner's WhatsApp inbox transitions from 47 unread chaos messages at 11pm to zero unread, all auto-handled by ZippyScale AI."
    >
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(42,42,53,0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />

      {/* Top status bar — clinic phone OS chrome feel */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-[#6B7280] z-30">
        <span className="flex items-center gap-1.5">
          <motion.span
            animate={reduce ? {} : { opacity: [1, 0.3, 1] }}
            transition={reduce ? {} : { duration: 1.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-red-500"
            aria-hidden="true"
          />
          Dr's phone · {isResolved ? '7:00 AM' : '11:47 PM'}
        </span>
        <span className="opacity-70">{isResolved ? 'Quiet night' : `${counter} unread`}</span>
      </div>

      {/* Pain bubbles — drift continuously, fade out on resolve */}
      {PAINS.map((p, i) => {
        const baseDelay = i * 0.12
        // Each bubble drifts in a small random orbit
        const driftX = Math.sin((tick / 30) + i) * 4
        const driftY = Math.cos((tick / 30) + i * 0.7) * 4
        const isVisible = phase === 'chaos'
        return (
          <motion.div
            key={i}
            initial={reduce ? { opacity: 0.92, scale: 1 } : { opacity: 0, scale: 0.5, rotate: i % 2 === 0 ? -6 : 6 }}
            animate={
              reduce
                ? { opacity: isVisible ? 0.92 : 0 }
                : isVisible
                  ? { opacity: 0.95, scale: 1, rotate: i % 2 === 0 ? -1.5 : 1.5, x: driftX, y: driftY }
                  : { opacity: 0, scale: 0.7, y: -20 }
            }
            transition={
              reduce
                ? { duration: 0 }
                : isVisible
                  ? { duration: 0.5, delay: baseDelay, ease: [0.34, 1.56, 0.64, 1] }
                  : { duration: 0.4, delay: i * 0.04, ease: 'easeIn' }
            }
            className="absolute bg-white rounded-xl px-2.5 py-1.5 text-[11px] shadow-md max-w-[150px] font-mono font-semibold text-[#1A1A2E] border border-red-200 whitespace-nowrap"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {p.text}
          </motion.div>
        )
      })}

      {/* Big counter badge — center-right area, dominates */}
      <motion.div
        animate={
          reduce
            ? {}
            : phase === 'chaos'
              ? { scale: [1, 1.05, 1], boxShadow: ['0 10px 25px rgba(239,68,68,0.4)', '0 14px 40px rgba(239,68,68,0.6)', '0 10px 25px rgba(239,68,68,0.4)'] }
              : { scale: 0, opacity: 0 }
        }
        transition={reduce ? {} : phase === 'chaos' ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5, ease: 'easeOut' }}
        className="absolute top-12 right-5 w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white flex flex-col items-center justify-center font-mono shadow-2xl z-20"
        aria-hidden="true"
      >
        <span className="text-[9px] uppercase tracking-widest opacity-80 leading-none mb-0.5">Unread</span>
        <span className="text-4xl font-bold leading-none tabular-nums">{counter}</span>
      </motion.div>

      {/* AI Activation sweep (between chaos and resolve) */}
      {phase === 'resolve' && !reduce && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '100%', opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.9, ease: 'easeInOut' }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#D5EB4B]/40 to-transparent skew-x-12 z-10"
          aria-hidden="true"
        />
      )}

      {/* Resolved state: green checks float in for each pain */}
      {phase === 'resolve' && PAINS.map((p, i) => (
        <motion.div
          key={`check-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0.5] }}
          transition={reduce ? { duration: 0 } : { duration: 1.6, delay: 0.3 + i * 0.06, ease: 'easeOut' }}
          className="absolute w-7 h-7 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-sm font-bold shadow-lg"
          style={{ left: `${p.x + 4}%`, top: `${p.y - 1}%` }}
          aria-hidden="true"
        >
          ✓
        </motion.div>
      ))}

      {/* Resolution banner — slides up when resolve phase begins */}
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
            <p className="font-bold text-sm leading-tight">25 hrs/week back. No-shows halved.</p>
            <p className="text-[11px] text-[#1A1A2E]/70 leading-tight mt-0.5">4-week sprint · live in 28 days</p>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#1A1A2E]/70">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" aria-hidden="true" />
            Live
          </span>
        </div>
      </motion.div>
    </div>
  )
}
