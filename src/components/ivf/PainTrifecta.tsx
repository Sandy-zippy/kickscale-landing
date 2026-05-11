import { motion } from 'framer-motion'

export default function PainTrifecta() {
  return (
    <section className="bg-[#FFFDF7] py-24 sm:py-36 px-6 border-t border-[#2A2A35]/10">
      <div className="max-w-6xl mx-auto">
        {/* Editorial intro */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20 items-baseline"
        >
          <div className="md:col-span-3 text-xs tracking-[0.18em] uppercase font-bold text-[#2A2A35]/60 font-mono">
            01 / The leak
          </div>
          <h2 className="md:col-span-9 text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2A2A35] leading-[1.02] tracking-tight">
            Your ad spend isn&apos;t the problem.<br />
            <span className="text-[#2A2A35]/55">Three leaks downstream are.</span>
          </h2>
        </motion.div>

        {/* Lead pain. pulled-quote editorial */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-24 items-start"
        >
          <div className="md:col-span-4 md:sticky md:top-32">
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#2A2A35]/50 mb-3">
              Leak no. 01
            </div>
            <div className="text-7xl sm:text-8xl font-bold text-[#2A2A35] font-mono leading-[0.9] mb-4">
              5–10×
            </div>
            <p className="text-sm font-mono uppercase tracking-wider text-[#2A2A35]/55">
              cost-per-cycle vs the CPL you see
            </p>
          </div>
          <blockquote className="md:col-span-8 text-2xl sm:text-3xl lg:text-4xl text-[#2A2A35] leading-[1.25] font-medium tracking-tight">
            &ldquo;Cost per consultation looks fine. But cost per IVF cycle booked is{' '}
            <span className="bg-[#D5EB4B] px-1.5 -mx-1.5 box-decoration-clone">
              5–10× what we project.
            </span>
            &rdquo;
            <footer className="mt-6 text-sm font-mono uppercase tracking-wider text-[#2A2A35]/55 not-italic">
              Pattern, Indian fertility clinic owners
            </footer>
            <p className="mt-8 text-base text-[#5A5A66] font-normal leading-relaxed not-italic">
              You stop paying for form-fills. Every rupee tied to a booked cycle, traced from creative through to consult to procedure.
            </p>
          </blockquote>
        </motion.div>

        {/* Two satellite leaks, asymmetric pair */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="md:col-span-7 md:pr-12 md:border-r border-[#2A2A35]/15"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#2A2A35]/50 mb-3">
              Leak no. 02
            </div>
            <div className="flex items-baseline gap-4 mb-5">
              <span className="text-6xl sm:text-7xl font-bold text-[#2A2A35] font-mono leading-none">
                60%
              </span>
              <span className="text-sm font-mono uppercase tracking-wider text-[#2A2A35]/55">
                of leads vanish before consult
              </span>
            </div>
            <blockquote className="text-xl text-[#2A2A35] leading-snug font-medium mb-4">
              &ldquo;Hired 2 agencies in 18 months. Both reported leads. Both disappeared when cycles didn&apos;t scale.&rdquo;
            </blockquote>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#2A2A35]/55 mb-6">
              Solo clinic owners, Practo + Quora
            </div>
            <p className="text-base text-[#5A5A66] leading-relaxed">
              Your front desk stops fumbling. WhatsApp drip, SMS reminders, AI consult-prep video. Every couple stays on the calendar.
            </p>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-5"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#2A2A35]/50 mb-3">
              Leak no. 03
            </div>
            <div className="flex items-baseline gap-4 mb-5">
              <span className="text-6xl sm:text-7xl font-bold text-[#2A2A35] font-mono leading-none">
                40%
              </span>
              <span className="text-sm font-mono uppercase tracking-wider text-[#2A2A35]/55">
                YoY CPL inflation
              </span>
            </div>
            <blockquote className="text-xl text-[#2A2A35] leading-snug font-medium mb-4">
              &ldquo;Most general agencies don&apos;t know the difference between selling a product and a medical service.&rdquo;
            </blockquote>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#2A2A35]/55 mb-6">
              GrowMyBiz, Indian fertility marketing 2026
            </div>
            <p className="text-base text-[#5A5A66] leading-relaxed">
              Zero ad-account bans. Your brand stays clean while every campaign keeps shipping.
            </p>
          </motion.article>
        </div>
      </div>
    </section>
  )
}
