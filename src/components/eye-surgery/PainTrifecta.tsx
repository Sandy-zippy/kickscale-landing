import { motion } from 'framer-motion'

export default function PainTrifecta() {
  return (
    <section className="bg-[#FFFDF7] py-24 sm:py-36 px-6 border-t border-[#2A2A35]/10">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20 items-baseline">
          <div className="md:col-span-3 text-xs tracking-[0.18em] uppercase font-bold text-[#2A2A35]/60 font-mono">01 / The leak</div>
          <h2 className="md:col-span-9 text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2A2A35] leading-[1.02] tracking-tight">
            Your screening calls aren&apos;t the problem.<br />
            <span className="text-[#2A2A35]/55">Three trust leaks between consult and OT are.</span>
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }} className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-24 items-start">
          <div className="md:col-span-4 md:sticky md:top-32">
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#2A2A35]/50 mb-3">Leak no. 01</div>
            <div className="text-7xl sm:text-8xl font-bold text-[#2A2A35] font-mono leading-[0.9] mb-4">5–10×</div>
            <p className="text-sm font-mono uppercase tracking-wider text-[#2A2A35]/55">cost-per-procedure vs the CPL you see</p>
          </div>
          <blockquote className="md:col-span-8 text-2xl sm:text-3xl lg:text-4xl text-[#2A2A35] leading-[1.25] font-medium tracking-tight">
            &ldquo;200 free-screening leads in. 15 surgeries booked. The other 185{' '}
            <span className="bg-[#D5EB4B] px-1.5 -mx-1.5 box-decoration-clone">went to hospital chains for cataract camps.</span>
            &rdquo;
            <footer className="mt-6 text-sm font-mono uppercase tracking-wider text-[#2A2A35]/55 not-italic">
              Pattern, Hyderabad standalone eye clinics
            </footer>
            <p className="mt-8 text-base text-[#5A5A66] font-normal leading-relaxed not-italic">
              You stop paying for free-screening signups. Every rupee tied to a procedure actually scheduled. 60-second eligibility quiz qualifies before the consult.
            </p>
          </blockquote>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5 }} className="md:col-span-7 md:pr-12 md:border-r border-[#2A2A35]/15">
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#2A2A35]/50 mb-3">Leak no. 02</div>
            <div className="flex items-baseline gap-4 mb-5">
              <span className="text-6xl sm:text-7xl font-bold text-[#2A2A35] font-mono leading-none">95%</span>
              <span className="text-sm font-mono uppercase tracking-wider text-[#2A2A35]/55">of LASIK leads obsess over dry-eye risk</span>
            </div>
            <blockquote className="text-xl text-[#2A2A35] leading-snug font-medium mb-4">
              &ldquo;Will I have dry eyes forever? Halos at night? Should I just stick with glasses?&rdquo;
            </blockquote>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#2A2A35]/55 mb-6">Quora, Reddit, patient forums</div>
            <p className="text-base text-[#5A5A66] leading-relaxed">
              Surgeon-volume creative + post-op 90-day dry-eye care visible upfront + named-doctor testimonial video. Trust holds, consult-to-OT conversion climbs.
            </p>
          </motion.article>

          <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5, delay: 0.1 }} className="md:col-span-5">
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#2A2A35]/50 mb-3">Leak no. 03</div>
            <div className="flex items-baseline gap-4 mb-5">
              <span className="text-6xl sm:text-7xl font-bold text-[#2A2A35] font-mono leading-none">70%</span>
              <span className="text-sm font-mono uppercase tracking-wider text-[#2A2A35]/55">choose hospital over standalone</span>
            </div>
            <blockquote className="text-xl text-[#2A2A35] leading-snug font-medium mb-4">
              &ldquo;Apollo&apos;s name = trust. Why would I pick a standalone eye centre I&apos;ve never heard of?&rdquo;
            </blockquote>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#2A2A35]/55 mb-6">Indian patient-research pattern</div>
            <p className="text-base text-[#5A5A66] leading-relaxed">
              Volume + tech storytelling (SMILE Pro, WaveLight, robotic phaco) + transparent surgeon-volume. You become the smarter standalone choice.
            </p>
          </motion.article>
        </div>
      </div>
    </section>
  )
}
