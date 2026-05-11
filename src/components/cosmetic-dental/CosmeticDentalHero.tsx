import { motion } from 'framer-motion'
import HeroFunnelPlayer from './HeroFunnelPlayer'
import HeroForm from './HeroForm'

const STACK_LOGOS = ['Stape', 'Meta Ads', 'Google Ads', 'GHL', 'n8n', 'Higgsfield', 'Nano Banana', 'Claude AI']

export default function IVFHero() {
  return (
    <section className="relative bg-[#FFFDF7] overflow-hidden">
      {/* Subtle dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #2A2A35 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top scarcity ribbon */}
      <div className="relative bg-[#2A2A35] text-[#FFFDF7] py-2 px-6 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D5EB4B] animate-pulse" />
            <span className="font-mono tracking-wider">
              <span className="text-[#D5EB4B] font-bold">2 of 5</span> founding slots remaining
            </span>
          </div>
          <div className="hidden sm:block font-mono text-[#FFFDF7]/60">
            ₹2L/mo locked before step-up to ₹3L/mo · Hyderabad only
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-12 sm:pt-16 pb-20">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[0.18em] uppercase font-bold text-[#2A2A35]/60 mb-6"
        >
          For Hyderabad IVF clinic owners · ZippyScale Growth Sprint
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.02] tracking-tight text-[#2A2A35] mb-6 max-w-5xl"
        >
          From 5 cycles a month to{' '}
          <span className="relative inline-block">
            <span className="relative z-10">47, in 90 days.</span>
            <span className="absolute inset-x-0 bottom-1 h-3 sm:h-4 bg-[#D5EB4B] -z-0 -skew-x-3"></span>
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg sm:text-xl text-[#5A5A66] mb-10 max-w-3xl leading-relaxed"
        >
          More qualified IVF couples to your clinic. Cycle-CAC down, no-shows cut, doctor calendar booked weeks out.{' '}
          <span className="font-semibold text-[#2A2A35]">Same ad spend. Hyderabad-only.</span> If you don&apos;t see 30%+ lift by Day 90, you get a refund.
        </motion.p>

        {/* 2-col: Video + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <HeroFunnelPlayer />
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#5A5A66]">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[#D5EB4B] font-bold font-mono">→</span>
                <span><span className="text-[#2A2A35] font-bold">30–50%</span> lift in cycles</span>
              </span>
              <span className="text-[#9CA3AF]">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[#D5EB4B] font-bold font-mono">→</span>
                <span><span className="text-[#2A2A35] font-bold">25–40%</span> CAC drop</span>
              </span>
              <span className="text-[#9CA3AF]">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[#D5EB4B] font-bold font-mono">→</span>
                <span>30-day refund guarantee</span>
              </span>
            </div>
          </motion.div>

          <HeroForm />
        </div>

        {/* Stack logo proof bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 sm:mt-20 pt-10 border-t border-[#2A2A35]/10"
        >
          <div className="text-xs uppercase tracking-[0.18em] font-bold text-[#2A2A35]/50 mb-5 text-center">
            The growth stack we deploy in your accounts
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
            {STACK_LOGOS.map((logo) => (
              <div
                key={logo}
                className="text-base sm:text-lg font-semibold text-[#2A2A35]/70 hover:text-[#2A2A35] transition-colors"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {logo}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
