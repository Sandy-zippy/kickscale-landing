import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface Item {
  label: string
  detail: string
  included: boolean
}

interface Props {
  oneTime: { price: string; subtitle: string; items: Item[] }
  recurring: { price: string; subtitle: string; items: Item[] }
}

export default function WhatYouGetTable({ oneTime, recurring }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })
  const reduce = useReducedMotion()

  const cards = [
    { ...oneTime, accent: 'lime' as const, label: 'One-time sprint' },
    { ...recurring, accent: 'charcoal' as const, label: 'Then monthly' },
  ]

  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={reduce ? { duration: 0 } : { duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
          className={`rounded-2xl p-6 lg:p-8 ${
            card.accent === 'lime'
              ? 'bg-[#1A1A2E] text-white border-2 border-[#D5EB4B]'
              : 'bg-white border border-[#E5E7EB] text-[#1A1A2E]'
          }`}
        >
          <p className={`text-xs font-mono uppercase tracking-widest mb-2 ${card.accent === 'lime' ? 'text-[#D5EB4B]' : 'text-[#B8CF2E]'}`}>
            {card.label}
          </p>
          <p className={`text-5xl font-mono font-bold leading-none mb-1 ${card.accent === 'lime' ? 'text-[#D5EB4B]' : 'text-[#1A1A2E]'}`}>
            {card.price}
          </p>
          <p className={`text-sm mb-6 ${card.accent === 'lime' ? 'text-white/70' : 'text-[#6B7280]'}`}>
            {card.subtitle}
          </p>
          <ul className="space-y-3">
            {card.items.map((item, j) => (
              <li key={j} className="flex items-start gap-3">
                <span
                  className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                    item.included
                      ? card.accent === 'lime'
                        ? 'bg-[#D5EB4B] text-[#1A1A2E]'
                        : 'bg-[#22C55E] text-white'
                      : card.accent === 'lime'
                        ? 'bg-white/10 text-white/40'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                  aria-hidden="true"
                >
                  {item.included ? '✓' : '×'}
                </span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${card.accent === 'lime' ? 'text-white' : 'text-[#1A1A2E]'}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${card.accent === 'lime' ? 'text-white/60' : 'text-[#6B7280]'}`}>
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  )
}
