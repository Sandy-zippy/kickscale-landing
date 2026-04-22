import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

interface Msg { sender: string; body: string; time: string }
interface Props { beforeMessages: Msg[]; afterMessages: Msg[] }

export default function WhatsAppChaosMockup({ beforeMessages, afterMessages }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<'idle' | 'chaos' | 'calm'>('idle')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!inView || reduce || phase !== 'idle') return
    setPhase('chaos')
    let count = 0
    const target = Math.max(beforeMessages.length, 7) + 40
    const interval = setInterval(() => {
      count++
      setUnread(count)
      if (count >= target) {
        clearInterval(interval)
        setTimeout(() => {
          setPhase('calm')
          setUnread(0)
        }, 1500)
      }
    }, 180)
    return () => clearInterval(interval)
  }, [inView, reduce, phase, beforeMessages.length])

  const visible = phase === 'calm' ? afterMessages : beforeMessages

  return (
    <div
      ref={ref}
      data-testid="phone-frame"
      className="mx-auto w-[300px] aspect-[9/19.5] bg-[#1a1a1a] rounded-[36px] p-2 shadow-2xl"
    >
      <div className="relative w-full h-full bg-[#0b141a] rounded-[28px] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-b-2xl z-10" aria-hidden="true" />
        <div className="bg-[#005c4b] text-white px-4 pt-8 pb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
            {phase === 'calm' ? 'ZS' : 'Dr'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{phase === 'calm' ? 'ZippyScale AI' : 'Dr Clinic'}</p>
            <p className="text-[10px] text-white/60">
              {phase === 'calm' ? 'online · auto-reply' : `${unread} unread`}
            </p>
          </div>
          <span
            data-testid="unread-counter"
            className={`text-xs font-mono px-2 py-0.5 rounded-full ${unread > 0 ? 'bg-red-500' : 'bg-[#25d366]'}`}
          >
            {unread || '✓'}
          </span>
        </div>
        <div className="px-3 py-3 space-y-2 h-[calc(100%-70px)] overflow-hidden">
          <AnimatePresence mode="popLayout">
            {visible.slice(0, 5).map((m, i) => (
              <motion.div
                key={`${phase}-${i}`}
                initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={reduce ? { duration: 0 } : { duration: 0.3, delay: i * 0.15, ease: 'easeOut' }}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                  phase === 'calm' ? 'bg-[#005c4b] text-white ml-auto' : 'bg-[#202c33] text-white'
                }`}
              >
                <p className="font-semibold text-[10px] mb-1 opacity-70">{m.sender}</p>
                <p>{m.body}</p>
                <p className="text-[9px] opacity-60 text-right mt-1">{m.time}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
