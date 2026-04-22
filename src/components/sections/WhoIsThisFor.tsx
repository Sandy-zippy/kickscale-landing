import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'
import { trackCTAClick } from '../../lib/tracking'

const cards = [
  {
    id: 'revenue',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    text: 'You do ₹50L+ revenue with a growing team',
  },
  {
    id: 'whatsapp',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    text: 'Your team runs on WhatsApp groups and Excel sheets',
  },
  {
    id: 'scale',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    text: 'You want 3x output without hiring 5 more people',
  },
  {
    id: 'salary',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    text: 'Your salary bill keeps climbing but output stays flat',
  },
]

export default function WhoIsThisFor() {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const qualifies = selected.size >= 3

  return (
    <section className="bg-[#FFFDF7] py-20 px-4">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <p className="text-center font-mono text-xs uppercase tracking-widest mb-4 text-[#B8CF2E]">
            IS THIS FOR YOU?
          </p>
          <h2 className="mx-auto mb-4 max-w-xl text-center text-3xl font-bold text-[#111827] sm:text-4xl">
            Tap Everything That Sounds Like You
          </h2>
          <p className="mx-auto mb-12 max-w-md text-center text-sm text-[#6B7280]">
            Match 3 or more? You're exactly who we built this for.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card, i) => {
            const active = selected.has(card.id)
            return (
              <ScrollReveal key={card.id} delay={i * 0.1}>
                <button
                  type="button"
                  onClick={() => toggle(card.id)}
                  className={`w-full rounded-2xl border-2 p-8 transition-all duration-300 cursor-pointer text-left flex items-start gap-4 ${
                    active
                      ? 'border-[#B8CF2E] bg-[rgba(184,207,46,0.08)] -translate-y-1 shadow-lg'
                      : 'border-[#E5E7EB] bg-white hover:-translate-y-0.5 hover:border-[#B8CF2E]/40 hover:shadow-md'
                  }`}
                >
                  <span className={`flex-shrink-0 mt-0.5 transition-colors ${active ? 'text-[#B8CF2E]' : 'text-[#9CA3AF]'}`}>
                    {card.icon}
                  </span>
                  <div className="flex-1">
                    <p className={`text-base font-medium ${active ? 'text-[#111827]' : 'text-[#111827]'}`}>
                      {card.text}
                    </p>
                    {active && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block mt-2 text-xs font-bold text-[#B8CF2E] bg-[#B8CF2E]/10 px-3 py-1 rounded-full"
                      >
                        That's you
                      </motion.span>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors mt-1 ${
                      active ? 'border-[#B8CF2E] bg-[#B8CF2E]' : 'border-[#D1D5DB]'
                    }`}
                  >
                    {active && (
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#0c0c10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              </ScrollReveal>
            )
          })}
        </div>

        <AnimatePresence>
          {qualifies && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center mt-10"
            >
              <div className="inline-block bg-[#B8CF2E]/10 border-2 border-[#B8CF2E] rounded-2xl px-8 py-6">
                <p className="font-bold text-lg text-[#111827] mb-1">
                  You qualify. {selected.size}/4 matched.
                </p>
                <p className="text-sm text-[#4B5563] mb-4">
                  We built ZippyScale for businesses exactly like yours.
                </p>
                <a
                  href="#quiz"
                  onClick={() => trackCTAClick('who-is-this-for', 'Get Your Free Audit')}
                  className="inline-block font-bold rounded-xl px-8 py-3 text-sm bg-[#D5EB4B] text-[#0c0c10] hover:brightness-110 transition-all"
                >
                  Get Your Free Audit
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
