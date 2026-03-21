import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'

const faqs = [
  {
    q: 'What exactly is the AI Automation Audit?',
    a: 'We manually review your entire business operations: lead flow, invoicing, reporting, follow-ups, HR, inventory. We map every process that can be automated, calculate your exact savings (in rupees and hours), and deliver a custom roadmap showing what to automate first, what tools to use, and what ROI to expect. This is not a generic PDF. It is a detailed, business-specific audit done by our team.',
  },
  {
    q: 'What tools do you use to build automations?',
    a: 'We use n8n, Make, custom scripts, AI models (Claude, GPT), WhatsApp Business API, and direct API integrations with your existing tools like Tally, Zoho, HubSpot, or ERPs. We pick what fits your stack and budget. No vendor lock-in. You own everything we build.',
  },
  {
    q: 'How long until I see results?',
    a: 'First automations go live in 1 to 2 weeks. Most clients see measurable time savings within the first week itself. Full rollout across all identified processes takes 4 to 6 weeks depending on complexity. We prioritize the highest-ROI automations first so you see results early.',
  },
  {
    q: 'Will this replace my team?',
    a: 'No. The goal is to make your existing team 10x more productive. Your salespeople stop doing data entry and start closing deals. Your operations team stops compiling reports and starts making decisions. Think of it as removing the busywork so your team can do the work you actually hired them for.',
  },
  {
    q: 'What if something breaks after you build it?',
    a: 'Every automation we build includes error handling, fallback logic, and monitoring. We provide a maintenance SLA with 4-hour response time. If something breaks at 2 AM, our monitoring catches it before your team even wakes up. Most issues are auto-resolved without human intervention.',
  },
  {
    q: 'Can I start with just one process?',
    a: 'Absolutely. Most clients start with lead follow-up or invoice processing because those have the fastest ROI. Once you see the results, you can expand to other processes. There is no minimum commitment beyond the single process you choose.',
  },
  {
    q: 'What does execution cost after the free audit?',
    a: 'The audit is completely free with no strings attached. If you want us to execute, pricing depends on the scope and complexity of automations. It is a one-time build cost plus a small monthly maintenance fee. Most clients save 5 to 8x what they invest within the first 90 days. The audit report includes exact pricing for your specific case.',
  },
  {
    q: 'Why is the audit free?',
    a: 'We are selecting 10 businesses this quarter to build deep case studies that prove our automation systems work. You get a comprehensive audit at zero cost. We get documented proof of results. This is a limited offer. Once we have our 10 case studies, the audit goes back to being a paid service.',
  },
  {
    q: 'I have tried agencies before and they did not deliver. How are you different?',
    a: 'Most agencies sell retainers and generic strategies. We build actual systems that run without you. Every automation is measurable: you can see exactly how many hours it saved, how many leads it followed up, how many invoices it processed. If it does not deliver ROI, you will know within 30 days.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section className="bg-[#FFFDF7] py-20 px-4">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <p className="text-center font-mono text-xs uppercase tracking-widest mb-4 text-[#B8CF2E]">
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
