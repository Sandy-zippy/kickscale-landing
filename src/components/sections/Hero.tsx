import { useEffect } from 'react'
import { motion } from 'framer-motion'
import AnimatedCounter from '../ui/AnimatedCounter'
import { trackEvent, trackCTAClick } from '../../lib/tracking'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: {
    transition: { staggerChildren: 0.15 },
  },
}

const stats = [
  { target: 40, prefix: '₹', suffix: 'L+/yr', label: 'Money Saved' },
  { target: 3, suffix: 'x', label: 'Revenue Growth' },
  { target: 10, suffix: 'x Output', label: 'Same Team' },
]

function getHeadline(): { main: string; sub: string } {
  const utmContent = new URLSearchParams(window.location.search).get('utm_content')
  switch (utmContent) {
    case 'unaware':
      return {
        main: 'Your Leads Are Dying in WhatsApp Groups and Excel Sheets.',
        sub: 'We find every rupee your manual processes are wasting.',
      }
    case 'problem-aware':
      return {
        main: 'Freelancers Didn\u2019t Fix It. In-House Tools Didn\u2019t Fix It. Systems Will.',
        sub: 'Same team. 10x output. No new headcount.',
      }
    case 'solution-aware':
      return {
        main: 'Free AI Automation Audit. We Map Your Entire Lead Flow in 24 Hours.',
        sub: 'Custom roadmap. Zero cost. Zero obligation.',
      }
    default:
      return {
        main: 'Still Running Your Business on WhatsApp Groups and Excel?',
        sub: 'We build AI automations that handle leads, follow-ups, reports, and ops. Same team, 10x output.',
      }
  }
}

export default function Hero() {
  useEffect(() => {
    const utmContent = new URLSearchParams(window.location.search).get('utm_content') || 'brand-aware'
    trackEvent('hero_view', { awareness_level: utmContent })
  }, [])

  const scrollToQuiz = () => {
    document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })
  }

  const { main, sub } = getHeadline()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FFFDF7]">
      {/* Subtle dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle, #9CA3AF 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-4 py-20 max-w-5xl mx-auto"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[#B8CF2E] text-[#B8CF2E] bg-[rgba(184,207,46,0.08)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            For ₹5Cr+ Indian Businesses
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-8 text-5xl md:text-7xl font-bold max-w-4xl mx-auto leading-[1.1] text-[#1A1A2E]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {main}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-6 text-lg md:text-xl text-[#4A5568] max-w-2xl mx-auto"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {sub}
        </motion.p>

        {/* Stats row */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex items-baseline gap-1.5">
              {stat.label && (
                <span className="text-sm text-[#4A5568]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {stat.label}
                </span>
              )}
              <AnimatedCounter
                target={stat.target}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="text-2xl md:text-3xl font-bold text-[#B8CF2E]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          ))}
        </motion.div>

        {/* Primary CTA */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-12">
          <motion.a
            href="#quiz"
            onClick={() => trackCTAClick('hero-cta', 'Get Your Free Audit')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block font-bold rounded-xl px-10 py-5 text-lg bg-[#D5EB4B] text-[#0c0c10] shadow-[0_4px_20px_rgba(213,235,75,0.3)] hover:shadow-[0_6px_30px_rgba(213,235,75,0.45)] transition-shadow"
          >
            Get Your Free Audit
          </motion.a>
        </motion.div>

        {/* Secondary CTA */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-4">
          <button
            onClick={scrollToQuiz}
            className="text-sm text-[#4A5568] hover:underline hover:text-[#B8CF2E] transition-colors cursor-pointer bg-transparent border-none"
          >
            Only 10 businesses selected this quarter. Zero cost. Zero obligation.
          </button>
        </motion.div>
      </motion.div>

    </section>
  )
}
