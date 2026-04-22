import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

interface Msg { sender: string; body: string; time: string }
interface Profile { name: string; initials: string; chaosLabel?: string }
interface Props { beforeMessages: Msg[]; afterMessages: Msg[]; profile?: Profile }

type Phase = 'chaos' | 'ai-takeover' | 'calm'

const CYCLE_MS = 12000      // total loop length
const CHAOS_END = 6000       // 0-6s: messages stream in fast, counter ticks 0→47
const TAKEOVER_END = 8000    // 6-8s: AI activation visual + messages get green check
// 8-12s: calm/resolved, then loop

const DEFAULT_PROFILE: Profile = { name: 'Dr Clinic', initials: 'Dr' }

export default function WhatsAppChaosMockup({ beforeMessages, afterMessages, profile = DEFAULT_PROFILE }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.2 })
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('chaos')
  const [unread, setUnread] = useState(0)
  const [visibleCount, setVisibleCount] = useState(0)
  const [resolvedIdx, setResolvedIdx] = useState(-1)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setPhase('chaos')
      setUnread(47)
      setVisibleCount(beforeMessages.length)
      setResolvedIdx(-1)
      return
    }

    const start = Date.now()
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) % CYCLE_MS

      if (elapsed < CHAOS_END) {
        // CHAOS: messages stream in one every 200ms (full set visible by ~1.5s),
        // then unread counter keeps ticking 0→47 over the 6-second chaos window.
        setPhase('chaos')
        const progress = elapsed / CHAOS_END
        setVisibleCount(Math.min(beforeMessages.length, Math.floor(elapsed / 200) + 1))
        setUnread(Math.round(progress * 47))
        setResolvedIdx(-1)
      } else if (elapsed < TAKEOVER_END) {
        // AI TAKEOVER: each message gets a green check, one by one
        setPhase('ai-takeover')
        setUnread(47)
        setVisibleCount(beforeMessages.length)
        const takeoverProgress = (elapsed - CHAOS_END) / (TAKEOVER_END - CHAOS_END)
        setResolvedIdx(Math.floor(takeoverProgress * beforeMessages.length))
      } else {
        // CALM: AI replies visible, 0 unread
        setPhase('calm')
        setUnread(0)
        setVisibleCount(beforeMessages.length)
        setResolvedIdx(beforeMessages.length)
      }
    }, 60)
    return () => clearInterval(id)
  }, [inView, reduce, beforeMessages.length])

  const headerName = phase === 'calm' ? 'ZippyScale AI · auto-reply' : profile.name
  const headerSub = phase === 'calm'
    ? 'online · 0 unread'
    : phase === 'ai-takeover'
      ? `AI taking over · ${unread} unread`
      : `${unread} unread · ${unread > 30 ? 'overwhelmed' : 'building up'}`

  return (
    <div
      ref={ref}
      data-testid="phone-frame"
      className="mx-auto w-[300px] aspect-[9/19.5] bg-[#1a1a1a] rounded-[36px] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
    >
      <div className="relative w-full h-full bg-[#0b141a] rounded-[28px] overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-b-2xl z-30" aria-hidden="true" />

        {/* Header */}
        <motion.div
          animate={{
            background:
              phase === 'calm'
                ? 'linear-gradient(135deg, #005c4b 0%, #047857 100%)'
                : phase === 'ai-takeover'
                  ? 'linear-gradient(135deg, #064e3b 0%, #1A1A2E 100%)'
                  : 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
          }}
          transition={{ duration: 0.6 }}
          className="text-white px-4 pt-8 pb-3 flex items-center gap-3 z-20 relative"
        >
          <motion.div
            animate={
              reduce
                ? {}
                : phase === 'chaos'
                  ? { scale: [1, 1.06, 1] }
                  : { scale: 1 }
            }
            transition={reduce ? {} : phase === 'chaos' ? { duration: 1, repeat: Infinity } : { duration: 0.3 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              phase === 'calm' ? 'bg-[#D5EB4B] text-[#1A1A2E]' : 'bg-white/15'
            }`}
          >
            {phase === 'calm' ? 'ZS' : profile.initials}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{headerName}</p>
            <p className="text-[10px] text-white/70 truncate">{headerSub}</p>
          </div>
          <motion.span
            data-testid="unread-counter"
            animate={
              reduce
                ? {}
                : phase === 'chaos'
                  ? { scale: [1, 1.15, 1] }
                  : { scale: 1 }
            }
            transition={reduce ? {} : phase === 'chaos' ? { duration: 0.6, repeat: Infinity } : { duration: 0.3 }}
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full tabular-nums ${
              unread === 0 ? 'bg-[#25d366] text-white' : 'bg-red-500 text-white'
            }`}
          >
            {unread === 0 ? '✓' : unread}
          </motion.span>
        </motion.div>

        {/* AI activation sweep (between chaos and calm) */}
        <AnimatePresence>
          {phase === 'ai-takeover' && !reduce && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              className="absolute inset-y-12 w-1/2 bg-gradient-to-r from-transparent via-[#D5EB4B]/30 to-transparent skew-x-12 z-10 pointer-events-none"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="px-3 py-3 space-y-2 h-[calc(100%-78px)] overflow-hidden relative">
          {/* CHAOS phase: stream messages in */}
          {(phase === 'chaos' || phase === 'ai-takeover') &&
            beforeMessages.slice(0, visibleCount).map((m, i) => (
              <motion.div
                key={`chaos-${i}`}
                initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative max-w-[80%] rounded-lg px-3 py-2 text-xs bg-[#202c33] text-white"
              >
                <p className="font-semibold text-[10px] mb-1 opacity-70">{m.sender}</p>
                <p>{m.body}</p>
                <p className="text-[9px] opacity-60 text-right mt-1">{m.time}</p>
                {/* Green check overlay during AI takeover */}
                {phase === 'ai-takeover' && i < resolvedIdx && (
                  <motion.div
                    initial={reduce ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.3, type: 'spring', stiffness: 220, damping: 15 }}
                    className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-[10px] font-bold shadow-md"
                    aria-hidden="true"
                  >
                    ✓
                  </motion.div>
                )}
              </motion.div>
            ))}

          {/* CALM phase: AI responses */}
          {phase === 'calm' &&
            afterMessages.slice(0, 4).map((m, i) => (
              <motion.div
                key={`calm-${i}`}
                initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.4, delay: i * 0.2, ease: 'easeOut' }}
                className="max-w-[80%] rounded-lg px-3 py-2 text-xs bg-[#005c4b] text-white ml-auto"
              >
                <p className="font-semibold text-[10px] mb-1 opacity-80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D5EB4B]" aria-hidden="true" />
                  {m.sender}
                </p>
                <p>{m.body}</p>
                <p className="text-[9px] opacity-70 text-right mt-1">{m.time} ✓✓</p>
              </motion.div>
            ))}

          {/* "AI typing" indicator during takeover */}
          {phase === 'ai-takeover' && !reduce && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-3 left-3 right-3 bg-[#D5EB4B] text-[#1A1A2E] rounded-lg px-3 py-2 text-[11px] font-bold flex items-center gap-2 shadow-lg"
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-[#1A1A2E]"
                aria-hidden="true"
              />
              ZippyScale AI is auto-replying...
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
