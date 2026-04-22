import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface Faq { question: string; answer: string }

export default function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]))
  const reduce = useReducedMotion()

  const toggle = (i: number) => {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
      {items.map((item, i) => {
        const isOpen = open.has(i)
        return (
          <div key={i}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              onClick={() => toggle(i)}
              className="w-full text-left py-5 flex items-center justify-between gap-4 cursor-pointer hover:text-[#B8CF2E] transition-colors focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="font-semibold text-[#1A1A2E] text-base lg:text-lg">{item.question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                className="shrink-0 w-7 h-7 rounded-full bg-[#FFFDF7] border border-[#E5E7EB] flex items-center justify-center text-[#1A1A2E] font-bold text-lg"
                aria-hidden="true"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-${i}`}
                  initial={reduce ? { height: 'auto' } : { height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={reduce ? { height: 'auto' } : { height: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 pr-12 text-[#4B5563] leading-relaxed">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
