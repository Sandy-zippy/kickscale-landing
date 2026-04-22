import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface Item { objection: string; rebuttal: string }

export default function ObjectionAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set())
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
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open.has(i)
        return (
          <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`rebuttal-${i}`}
              onClick={() => toggle(i)}
              className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#FFFDF7] cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="font-semibold text-[#1A1A2E]">"{item.objection}"</span>
              <motion.svg
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
                className="w-5 h-5 shrink-0 text-[#B8CF2E]"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
              </motion.svg>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`rebuttal-${i}`}
                  initial={reduce ? { height: 'auto' } : { height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={reduce ? { height: 'auto' } : { height: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-[#4B5563] leading-relaxed">{item.rebuttal}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
