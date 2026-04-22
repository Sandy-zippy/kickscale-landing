import { useState } from 'react'
import { motion } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'

const cards = [
  {
    title: 'Complete Lead Flow',
    before: 'Leads sit in a spreadsheet. Someone checks it twice a day. Half go cold.',
    after: 'Ad click → CRM → auto-qualify → WhatsApp follow-up. All in under 2 seconds.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'Invoice & Payments',
    before: '45 min per invoice. Chase payments over WhatsApp. Forget half of them.',
    after: 'Auto-generate, send, track, and remind. 30 seconds. Zero follow-up needed.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Auto Reports',
    before: 'Monday to Wednesday compiling last week\'s numbers. Data is already stale.',
    after: 'Daily, weekly, monthly. Auto-generated. Delivered to your inbox on schedule.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    title: 'WhatsApp Follow-ups',
    before: 'Someone has to remember to text back. They don\'t. Lead goes to your competitor.',
    after: 'Triggered by customer actions. Right message, right time. Every single time.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Customer Retention',
    before: 'You find out a customer churned 3 months after they stopped buying.',
    after: 'Auto win-back flows, loyalty triggers, churn alerts before they leave.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
  },
  {
    title: 'AI Voice + Chat + Booking',
    before: 'Missed calls = missed revenue. Nobody picks up after 6 PM.',
    after: 'AI handles calls, responds on WhatsApp, books appointments. 24/7.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    title: 'Inventory & Orders',
    before: 'Stock-outs discovered when a customer complains. Reorders are guesswork.',
    after: 'Real-time tracking, auto-reorder points, fulfillment workflows.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    title: 'HR & Payroll',
    before: 'Leave tracking in Excel. Payroll takes 2 days. Compliance is a prayer.',
    after: 'Onboarding, attendance, payroll, compliance. All automated.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
]

function FlipCard({ card, index }: { card: typeof cards[number]; index: number }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <ScrollReveal delay={index * 0.05} className="h-full">
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="w-full h-full text-left cursor-pointer"
      >
        <div className="relative h-full min-h-[200px]" style={{ perspective: 1000 }}>
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-full h-full"
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-2xl border border-[#3E3E48] bg-[#33333F] p-7 flex flex-col hover:border-[rgba(213,235,75,0.2)] hover:shadow-lg hover:shadow-[rgba(213,235,75,0.05)] transition-all"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="mb-3 block">{card.icon}</span>
              <h3 className="mb-2 text-base font-semibold text-[#D5EB4B]">{card.title}</h3>
              <p className="text-sm leading-relaxed text-[#EF4444]/70 mb-3">{card.before}</p>
              <p className="text-xs text-[#6B7280] mt-auto">Tap to see the fix</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl border border-[#D5EB4B]/30 bg-[rgba(213,235,75,0.05)] p-7 flex flex-col"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="mb-3 block">{card.icon}</span>
              <h3 className="mb-2 text-base font-semibold text-[#D5EB4B]">{card.title}</h3>
              <p className="text-sm leading-relaxed text-[#22C55E] mb-3">{card.after}</p>
              <p className="text-xs text-[#6B7280] mt-auto">Tap to flip back</p>
            </div>
          </motion.div>
        </div>
      </button>
    </ScrollReveal>
  )
}

export default function AutomationGrid() {
  return (
    <section id="automation-grid" className="bg-[#2A2A35] py-20 px-4">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <p className="text-center font-mono text-xs uppercase tracking-widest mb-4 text-[#D5EB4B]">
            BEFORE → AFTER
          </p>
          <h2 className="mx-auto mb-4 max-w-2xl text-center text-3xl font-bold text-white sm:text-4xl">
            Tap Any Card to See What Changes
          </h2>
          <p className="text-center text-sm text-[#9CA3AF] mb-12">
            8 things your team does manually. 8 things AI handles instantly.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <FlipCard key={card.title} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
