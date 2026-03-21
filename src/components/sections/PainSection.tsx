import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'

const pains = [
  {
    stat: '₹18L/yr',
    title: 'Burned on work AI can do for free',
    description: 'You are paying salaries for data entry, follow-ups, and report generation. That money should fund growth.',
  },
  {
    stat: '40 hrs/wk',
    title: 'Lost to copy-paste and spreadsheet juggling',
    description: 'Your best people are stuck in Excel, WhatsApp, and manual CRM updates instead of closing deals.',
  },
  {
    stat: '3-5 days',
    title: 'Before you see your own numbers',
    description: 'By the time your team compiles last week\'s report, the opportunity is already gone.',
  },
  {
    stat: '23%',
    title: 'Revenue leaking from slow follow-ups',
    description: 'Every hour your team delays a lead response, your competitor closes that deal instead.',
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
    <section className="bg-[#F8F9FA] py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="font-mono text-xs uppercase tracking-widest text-[#B8CF2E] mb-4">
              The Real Cost
            </p>
            <h2 className="font-bold text-3xl md:text-4xl text-[#111827] mb-3">
              You're Bleeding Money on Busywork
            </h2>
            <p className="font-sans text-base text-[#4B5563] max-w-xl mx-auto">
              Every day you delay, these numbers get worse.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pains.map((pain, i) => (
            <ScrollReveal key={pain.stat} delay={i * 0.1}>
              <TiltCard className="bg-white border border-[#E5E7EB] rounded-2xl p-8 transition-all duration-300 hover:border-[#EF4444]/30 hover:shadow-lg hover:-translate-y-1 cursor-default">
                <p className="font-mono font-bold text-3xl text-[#EF4444] mb-2">{pain.stat}</p>
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
