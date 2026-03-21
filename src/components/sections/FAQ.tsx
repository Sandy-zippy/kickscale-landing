import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'

const faqs = [
  {
    q: 'What tools do you use?',
    a: 'n8n, Make, Zapier, custom Python and Node.js scripts, AI models (Claude, GPT), and WhatsApp Business API. We pick the right tool for each job.',
  },
  {
    q: 'How long does setup take?',
    a: '2 to 4 weeks for most businesses. Simple automations can be live in under a week.',
  },
  {
    q: 'Will this replace my team?',
    a: 'No. It frees them to do high-value work. Your team becomes more productive, not redundant.',
  },
  {
    q: 'What if something breaks?',
    a: 'We monitor 24/7 and fix issues within 4 hours. Every automation has error handling built in.',
  },
  {
    q: 'Can I try one automation first?',
    a: 'Yes. Start with one process, see the ROI, then scale.',
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
          <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-[#D5EB4B]">
            COMMON QUESTIONS
          </p>
          <h2 className="mx-auto mb-12 max-w-xl text-center font-heading text-3xl font-bold text-[#111827] sm:text-4xl">
            You're Probably Wondering...
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
