import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface Tool {
  name: string
  description: string
}

interface Category {
  label: string
  tools: Tool[]
}

const CATEGORIES: Category[] = [
  {
    label: 'Workflow orchestration',
    tools: [
      { name: 'n8n', description: 'self-hosted, India region' },
      { name: 'Make.com', description: 'fallback for SaaS-only flows' },
    ],
  },
  {
    label: 'CRM + conversations',
    tools: [
      { name: 'GoHighLevel', description: 'sub-account per client' },
      { name: 'WhatsApp Business API', description: 'Meta-approved templates' },
    ],
  },
  {
    label: 'AI layer',
    tools: [
      { name: 'Claude (Anthropic)', description: 'agent reasoning + drafting' },
      { name: 'OpenAI', description: 'OCR fallback + embeddings' },
      { name: 'Whisper', description: 'voice note transcription' },
    ],
  },
  {
    label: 'Indian integrations',
    tools: [
      { name: 'Tally Connector', description: 'TDL + ODBC bridge' },
      { name: 'Zoho APIs', description: 'Books, Inventory, Desk' },
      { name: 'Razorpay', description: 'UPI, cards, subscriptions' },
      { name: 'GSTN', description: 'GSTR-2A reconciliation via authorised utility' },
    ],
  },
  {
    label: 'Reporting + dashboards',
    tools: [
      { name: 'Looker Studio', description: 'owner-facing dashboards' },
      { name: 'Metabase', description: 'self-hosted alt for sensitive data' },
    ],
  },
  {
    label: 'Code + hosting + ops',
    tools: [
      { name: 'TypeScript', description: 'custom integrations' },
      { name: 'Python', description: 'data scripts, OCR pipelines' },
      { name: 'Vercel + Cloudflare', description: 'edge deployment' },
      { name: 'Supabase', description: 'when a database is genuinely needed' },
      { name: 'GitHub', description: 'source of truth, you can fork it' },
      { name: 'Sentry', description: 'error monitoring with WhatsApp paging' },
    ],
  },
]

export default function TechStackBadges() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.15 })
  const reduce = useReducedMotion()

  return (
    <div ref={ref}>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={reduce ? { duration: 0 } : { duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
            className="bg-white border border-[#E5E7EB] rounded-xl p-5"
          >
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#B8CF2E] mb-3">
              {cat.label}
            </p>
            <ul className="space-y-2.5">
              {cat.tools.map((t) => (
                <li key={t.name}>
                  <p className="font-bold text-sm text-[#1A1A2E] leading-tight">{t.name}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">{t.description}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 grid md:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#FFFDF7] border-l-4 border-[#D5EB4B] rounded-r-lg p-4">
          <p className="font-semibold text-[#1A1A2E] mb-1">India-hosted by default</p>
          <p className="text-[#6B7280]">Workflows + CRM live on India region infra. Patient + customer data stays in India unless you tell us otherwise.</p>
        </div>
        <div className="bg-[#FFFDF7] border-l-4 border-[#D5EB4B] rounded-r-lg p-4">
          <p className="font-semibold text-[#1A1A2E] mb-1">Source you can take with you</p>
          <p className="text-[#6B7280]">Custom code lives in a GitHub repo we set up. If you ever leave us, you keep the workflows, the templates, the docs.</p>
        </div>
        <div className="bg-[#FFFDF7] border-l-4 border-[#D5EB4B] rounded-r-lg p-4">
          <p className="font-semibold text-[#1A1A2E] mb-1">NDA + DPA before we touch anything</p>
          <p className="text-[#6B7280]">Signed before the audit. We do not screenshot your customer data. We mock real samples for demos.</p>
        </div>
      </div>
    </div>
  )
}
