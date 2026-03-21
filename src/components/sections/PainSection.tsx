import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import ScrollReveal from '../ui/ScrollReveal'

const pains = [
  {
    stat: '₹18L/yr',
    title: 'Average cost of manual tasks that AI can handle',
    description: 'Your team is doing work that software should be doing. That salary spend adds up fast.',
  },
  {
    stat: '40 hrs/wk',
    title: 'Time your team spends on repeatable work',
    description: 'Data entry, follow-ups, report generation. Repetitive tasks that drain your best people.',
  },
  {
    stat: '3-5 days',
    title: 'Delay in reports and updates due to manual processing',
    description: 'By the time you see the numbers, the opportunity has already passed.',
  },
  {
    stat: '23%',
    title: 'Revenue lost from slow follow-ups and missed leads',
    description: 'Every hour of delay in responding to a lead drops conversion rates dramatically.',
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
              Your Team Is Busy. But Not Productive.
            </h2>
            <p className="font-sans text-base text-[#4B5563] max-w-xl mx-auto">
              Here's what manual work actually costs your business.
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
