import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import AnimatedCounter from '../ui/AnimatedCounter'
import Icon from './Icon'

const MONTHS = [
  { label: 'Today', cycles: 8, status: 'baseline' as const },
  { label: 'Month 1', cycles: 15, status: 'in-progress' as const },
  { label: 'Month 2', cycles: 23, status: 'in-progress' as const },
  { label: 'Month 3', cycles: 32, status: 'goal' as const },
]
const MAX = 32

export default function HeroFunnelPlayer() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: false, amount: 0.4 })

  return (
    <div ref={ref} className="relative w-full rounded-2xl overflow-hidden border-2 border-[#2A2A35] bg-[#FFFDF7] shadow-[0_20px_60px_rgba(42,42,53,0.12)]">
      <div className="aspect-[4/3] w-full p-6 sm:p-8 flex flex-col">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0 }} transition={{ duration: 0.4 }} className="mb-6">
          <div className="flex items-baseline gap-2 mb-1.5">
            <div className="text-[10px] sm:text-xs tracking-[0.18em] uppercase font-bold text-[#2A2A35]/60">Your transplant trajectory</div>
            <div className="ml-auto inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-[#2A2A35]/60">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D5EB4B] animate-pulse" />
              <span className="hidden sm:inline">Live target</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.05] text-[#2A2A35]" style={{ fontFamily: '"Space Grotesk", sans-serif', letterSpacing: '-0.02em' }}>
            <span className="font-mono">8</span>{' '}
            <Icon name="arrow-right" className="inline-block text-[#2A2A35]/40 -mb-0.5" size={20} />{' '}
            <span className="text-[#D5EB4B]"><AnimatedCounter target={32} /></span>{' '}
            <span className="text-base sm:text-lg font-normal text-[#5A5A66]">transplants / month</span>
          </div>
          <div className="text-sm text-[#5A5A66] mt-1">
            +24 transplants booked by Day 90. <span className="text-[#2A2A35] font-semibold">Same ad spend.</span>
          </div>
        </motion.div>
        <div className="flex-1 grid grid-cols-4 gap-2 sm:gap-3 items-end mb-4">
          {MONTHS.map((m, i) => {
            const pct = (m.cycles / MAX) * 100
            const isGoal = m.status === 'goal'
            return (
              <motion.div key={m.label} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.3, delay: 0.4 + i * 0.18 }} className="flex flex-col items-center justify-end h-full">
                <div className="text-[10px] sm:text-xs font-mono font-bold mb-1.5 text-[#2A2A35]">{m.cycles}</div>
                <motion.div initial={{ height: 0 }} animate={inView ? { height: `${pct}%` } : { height: 0 }} transition={{ duration: 0.7, delay: 0.5 + i * 0.18, ease: 'easeOut' }} className={`w-full rounded-t-lg relative ${isGoal ? 'bg-[#D5EB4B] border-2 border-[#2A2A35]' : m.status === 'baseline' ? 'bg-[#2A2A35]/15 border border-[#2A2A35]/30' : 'bg-[#2A2A35]'}`} style={{ minHeight: '12%' }}>
                  {isGoal && (
                    <motion.div initial={{ scale: 0 }} animate={inView ? { scale: 1 } : { scale: 0 }} transition={{ duration: 0.4, delay: 1.4 }} className="absolute -top-3 -right-2 h-7 w-7 rounded-full bg-[#2A2A35] text-[#D5EB4B] flex items-center justify-center">
                      <Icon name="check" size={14} />
                    </motion.div>
                  )}
                </motion.div>
                <div className="text-[10px] sm:text-xs font-mono text-[#5A5A66] mt-2 text-center">{m.label}</div>
              </motion.div>
            )
          })}
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0 }} transition={{ duration: 0.5, delay: 1.8 }} className="px-4 py-3 rounded-lg bg-[#2A2A35] text-[#FFFDF7] flex items-center gap-3">
          <Icon name="arrow-right" size={18} className="text-[#D5EB4B] flex-shrink-0" />
          <div className="text-xs sm:text-sm leading-tight">
            <span className="text-[#D5EB4B] font-bold font-mono">+₹29L revenue</span>{' '}
            <span className="text-[#FFFDF7]/70">at avg ₹1.2L per transplant · paid for 14× over by sprint end</span>
          </div>
        </motion.div>
      </div>
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFDF7] border border-[#2A2A35]/15 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-[#D5EB4B] animate-pulse" />
        <span className="text-[10px] sm:text-xs font-mono text-[#2A2A35] tracking-wider uppercase font-bold">Your trajectory</span>
      </div>
    </div>
  )
}
