import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'

const savePains = [
  {
    stat: '₹40L+/yr',
    title: 'Burned on work AI can handle',
    description: 'You\'re paying 3 FTEs ₹12-15L each to do data entry, follow-ups, and report generation. That money should fund growth.',
  },
  {
    stat: '40 hrs/wk',
    title: 'Lost to copy-paste and spreadsheet juggling',
    description: 'Your best people are stuck in Excel, WhatsApp groups, and manual CRM updates instead of closing deals.',
  },
  {
    stat: '3-5 days',
    title: 'Before you see your own numbers',
    description: 'By the time your team compiles last week\'s report, the opportunity is already gone.',
  },
]

const makePains = [
  {
    stat: '23%',
    title: 'Revenue lost from slow follow-ups',
    description: 'Every hour your team delays a lead response, your competitor closes that deal instead.',
  },
  {
    stat: '₹0',
    title: 'From channels your competitors dominate',
    description: 'Meta, Google, WhatsApp marketing. Your competitors are winning customers there. You\'re not even playing.',
  },
  {
    stat: '60%',
    title: 'Leads die without 5-minute follow-up',
    description: 'If nobody calls back within 5 minutes, 6 out of 10 leads go to your competitor. AI responds in seconds.',
  },
]

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), { stiffness: 300, damping: 30 })

  function handleMouse(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left) / rect.width)
    y.set((e.clientY - rect.top) / rect.height)
  }

  function handleLeave() {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function PainSection() {
  return (
    <section id="pain" className="bg-[#FFFDF7] py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-[#B8CF2E] mb-4">
              The Real Cost
            </p>
            <h2 className="font-bold text-3xl md:text-4xl text-[#111827] mb-4">
              The Real Cost of Manual Operations
            </h2>
            <p className="font-sans text-base text-[#4B5563] max-w-xl mx-auto">
              Every day you delay, both sides of this equation get worse.
            </p>
          </div>
        </ScrollReveal>

        {/* Save Money */}
        <ScrollReveal>
          <h3 className="font-semibold text-xl text-[#111827] mb-5 flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
            You're Bleeding Money
          </h3>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-12">
          {savePains.map((pain, i) => (
            <ScrollReveal key={pain.stat} delay={i * 0.1}>
              <TiltCard className="h-full bg-white border border-[#E5E7EB] rounded-2xl p-8 transition-all duration-300 hover:border-[#EF4444]/30 hover:shadow-lg hover:-translate-y-1 cursor-default">
                <p className="font-mono font-bold text-3xl text-[#EF4444] mb-2">{pain.stat}</p>
                <h3 className="font-semibold text-lg text-[#111827] mb-1">{pain.title}</h3>
                <p className="font-sans text-sm text-[#4B5563]">{pain.description}</p>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>

        {/* Make Money */}
        <ScrollReveal>
          <h3 className="font-semibold text-xl text-[#111827] mb-5 flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 6 10.5 15.5 15.5 10.5 23 18" />
              <line x1="17" y1="6" x2="23" y2="6" />
              <line x1="23" y1="6" x2="23" y2="12" />
              <line x1="16" y1="16" x2="20" y2="20" stroke="#F59E0B" strokeWidth="2.5" />
              <line x1="20" y1="16" x2="16" y2="20" stroke="#F59E0B" strokeWidth="2.5" />
            </svg>
            You're Leaving Money on the Table
          </h3>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {makePains.map((pain, i) => (
            <ScrollReveal key={pain.stat} delay={i * 0.1}>
              <TiltCard className="h-full bg-white border border-[#E5E7EB] rounded-2xl p-8 transition-all duration-300 hover:border-[#F59E0B]/30 hover:shadow-lg hover:-translate-y-1 cursor-default">
                <p className="font-mono font-bold text-3xl text-[#F59E0B] mb-2">{pain.stat}</p>
                <h3 className="font-semibold text-lg text-[#111827] mb-1">{pain.title}</h3>
                <p className="font-sans text-sm text-[#4B5563]">{pain.description}</p>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
