import { useState, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface Tab { id: string; label: string; content: ReactNode }

export default function TabbedStack({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const reduce = useReducedMotion()

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = tabs.findIndex(t => t.id === active)
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = tabs[(idx + 1) % tabs.length]
      setActive(next.id)
      tabRefs.current[next.id]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length]
      setActive(prev.id)
      tabRefs.current[prev.id]?.focus()
    }
  }

  return (
    <div>
      <div role="tablist" onKeyDown={handleKey} className="flex gap-2 border-b-2 border-[#E5E7EB] mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[t.id] = el }}
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            className={`px-5 py-3 -mb-[2px] border-b-2 font-semibold text-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:outline-none whitespace-nowrap ${
              active === t.id
                ? 'border-[#D5EB4B] text-[#1A1A2E]'
                : 'border-transparent text-[#6B7280] hover:text-[#1A1A2E]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tabs
          .filter(t => t.id === active)
          .map(t => (
            <motion.div
              key={t.id}
              role="tabpanel"
              id={`panel-${t.id}`}
              aria-labelledby={`tab-${t.id}`}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0, y: -10 }}
              transition={reduce ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            >
              {t.content}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}
