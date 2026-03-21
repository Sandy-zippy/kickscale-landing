import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'

const faqs = [
  {
    q: 'What tools do you use?',
    a: 'n8n, Make, custom scripts, AI models (Claude, GPT), and WhatsApp Business API. We pick what fits your stack, not what is trendy.',
  },
  {
    q: 'How long until I see results?',
    a: 'First automations go live in 1 to 2 weeks. Full rollout in 4 weeks. You will see time savings from week one.',
  },
  {
    q: 'Will this replace my team?',
    a: 'No. It makes them 10x more productive. They stop doing data entry and start doing the work you actually hired them for.',
  },
  {
    q: 'What if something breaks?',
    a: '24/7 monitoring. 4-hour fix SLA. Every workflow has built-in error handling and fallback logic.',
  },
  {
    q: 'Can I start with just one process?',
    a: 'Absolutely. Most clients start with lead flow or invoicing, see the ROI, then expand.',
  },
  {
    q: 'What does it cost?',
    a: 'Depends on scope. The free audit gives you exact pricing. Most clients save 5 to 8x what they invest within 90 days.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section className="bg-[#F8F9FA] py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <ScrollReveal>
          <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-[#B8CF2E]">
            COMMON QUESTIONS
          </p>
          <h2 className="mx-auto mb-12 max-w-xl text-center text-3xl font-bold text-[#111827] sm:text-4xl">
            Before You Decide
          </h2>
        </ScrollReveal>

        <div className="mx-auto max-w-2xl">
          {faqs.map((faq, i) => (
            <ScrollReveal key={faq.q} delay={i * 0.08}>
              <div className="mb-3 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between p-6 text-left font-semibold text-[#111827]"
                >
                  <span>{faq.q}</span>
                  <motion.span
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-4 flex-shrink-0 text-xl text-[#9CA3AF]"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <p className="px-6 pb-6 text-sm leading-relaxed text-[#4B5563]">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
