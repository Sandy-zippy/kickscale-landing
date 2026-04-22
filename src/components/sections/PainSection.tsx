import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'
import { trackCTAClick } from '../../lib/tracking'

const pains = [
  {
    id: 'leads',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Leads die in WhatsApp groups',
    cost: 8,
    costLabel: '₹8L/yr lost revenue',
    detail: '60% of leads go cold without 5-minute follow-up. Your team takes hours.',
  },
  {
    id: 'reports',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Reports take 3 days to compile',
    cost: 5,
    costLabel: '₹5L/yr in wasted salary',
    detail: 'Your best people spend Monday to Wednesday in Excel instead of selling.',
  },
  {
    id: 'followups',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Follow-ups are manual and forgotten',
    cost: 12,
    costLabel: '₹12L/yr in lost deals',
    detail: '23% revenue lost from slow follow-ups. Your competitor closes while you forget.',
  },
  {
    id: 'data',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    title: 'CRM updates are copy-paste chaos',
    cost: 6,
    costLabel: '₹6L/yr in data entry salary',
    detail: '8+ hours/week of manual data entry that AI handles in real-time.',
  },
  {
    id: 'invoices',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: 'Invoices sit in someone\'s inbox',
    cost: 4,
    costLabel: '₹4L/yr in delayed payments',
    detail: '45 min per invoice manually. Auto-generate and send in 30 seconds.',
  },
  {
    id: 'hiring',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    title: 'You hire to scale instead of systemise',
    cost: 15,
    costLabel: '₹15L/yr per unnecessary hire',
    detail: 'Every person you hire for automatable work is ₹12-15L/yr burned.',
  },
]

export default function PainSection() {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalCost = pains
    .filter(p => selected.has(p.id))
    .reduce((sum, p) => sum + p.cost, 0)

  return (
    <section id="pain" className="bg-[#FFFDF7] py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-[#B8CF2E] mb-4">
              The Real Cost
            </p>
            <h2 className="font-bold text-3xl md:text-4xl text-[#111827] mb-4">
              Tap Every Problem You Recognise
            </h2>
            <p className="font-sans text-base text-[#4B5563] max-w-xl mx-auto">
              We'll show you what it's actually costing you.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {pains.map((pain, i) => {
            const active = selected.has(pain.id)
            return (
              <ScrollReveal key={pain.id} delay={i * 0.05}>
                <button
                  type="button"
                  onClick={() => toggle(pain.id)}
                  className={`w-full text-left rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer ${
                    active
                      ? 'border-[#EF4444] bg-[#FEF2F2] shadow-lg -translate-y-1'
                      : 'border-[#E5E7EB] bg-white hover:border-[#EF4444]/30 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`flex-shrink-0 transition-colors ${active ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>
                      {pain.icon}
                    </span>
                    <span className={`font-semibold text-base ${active ? 'text-[#991B1B]' : 'text-[#111827]'}`}>
                      {pain.title}
                    </span>
                  </div>
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="text-sm text-[#4B5563] mb-2">{pain.detail}</p>
                        <p className="font-mono font-bold text-[#EF4444] text-lg">{pain.costLabel}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!active && (
                    <p className="text-xs text-[#9CA3AF] mt-1">Tap to reveal the cost</p>
                  )}
                </button>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Running total */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center"
            >
              <div className="inline-block bg-[#991B1B] rounded-2xl px-8 py-6 text-center">
                <p className="text-sm text-white/80 mb-1">
                  You selected {selected.size} problem{selected.size > 1 ? 's' : ''}. Estimated annual cost:
                </p>
                <p className="font-mono font-bold text-4xl text-white">
                  ₹{totalCost}L/year
                </p>
                <p className="text-sm text-white/70 mt-2 mb-4">
                  That's ₹{Math.round(totalCost / 12)}L every month walking out the door.
                </p>
                <a
                  href="#quiz"
                  onClick={() => trackCTAClick('pain-calculator', 'Get Your Free Audit')}
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
