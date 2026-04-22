import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

const bubbles = [
  { text: '30% no-shows / mo', x: 16, y: 24, delay: 0 },
  { text: '47 unread @ 11pm', x: 58, y: 18, delay: 0.2 },
  { text: 'Refill chase: 8h/wk', x: 18, y: 56, delay: 0.4 },
  { text: 'Sunday Tally: 3hrs gone', x: 56, y: 46, delay: 0.6 },
  { text: '60% follow-ups missed', x: 26, y: 84, delay: 0.8 },
]

export default function HeroHomeopathic() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduce = useReducedMotion()

  return (
    <div
      ref={ref}
      className="relative w-full aspect-square bg-gradient-to-br from-[#FFFDF7] to-[#F5F0E8] rounded-2xl border border-[#E5E7EB] overflow-hidden"
      role="img"
      aria-label="Homeopathic clinic WhatsApp inbox transitioning from chaos (47 unread messages) to calm (zero unread, automated replies)"
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(rgba(42,42,53,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          initial={reduce ? { opacity: 0.85, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.4, rotate: -8 }}
          animate={inView ? { opacity: 0.92, scale: 1, rotate: i % 2 === 0 ? -2 : 2 } : {}}
          transition={reduce ? { duration: 0 } : { duration: 0.45, delay: b.delay, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute bg-white rounded-xl px-3 py-2 text-xs shadow-md max-w-[150px] font-mono font-semibold text-[#1A1A2E] border border-red-200"
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
        >
          {b.text}
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0, rotate: 12 }}
        animate={inView ? { scale: 1, rotate: 0 } : {}}
        transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 1.4, type: 'spring', stiffness: 200, damping: 15 }}
        className="absolute top-5 right-5 w-16 h-16 rounded-full bg-red-500 text-white font-mono font-bold flex flex-col items-center justify-center shadow-xl"
        aria-hidden="true"
      >
        <span className="text-[9px] uppercase tracking-wider opacity-70 leading-none mb-0.5">Hrs/wk</span>
        <span className="text-2xl leading-none">25</span>
      </motion.div>

      <motion.div
        initial={{ y: '100%' }}
        animate={inView ? { y: 0 } : {}}
        transition={reduce ? { duration: 0 } : { duration: 0.55, delay: 2.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 right-0 bg-[#D5EB4B] text-[#1A1A2E] py-4 px-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1A1A2E] text-[#D5EB4B] flex items-center justify-center font-bold text-xs shrink-0">
            ZS
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">25 hrs/week back. No-shows halved.</p>
            <p className="text-xs text-[#1A1A2E]/70">4-week sprint · live in 28 days</p>
          </div>
          <motion.span
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={reduce ? { duration: 0 } : { duration: 0.3, delay: 2.7, type: 'spring' }}
            className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center font-bold shrink-0"
            aria-hidden="true"
          >
            ✓
          </motion.span>
        </div>
      </motion.div>
    </div>
  )
}
