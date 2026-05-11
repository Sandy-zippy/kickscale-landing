import { motion } from 'framer-motion'

export default function HyderabadProof() {
  return (
    <section className="bg-[#FFFDF7] py-20 sm:py-28 px-6 border-t border-[#2A2A35]/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden border-2 border-[#2A2A35] shadow-[0_30px_80px_rgba(42,42,53,0.15)]"
        >
          <img
            src="/healthcare-ivf-hero.png"
            alt="Modern Hyderabad IVF clinic: doctor reviewing cycle-attribution data on tablet, embryologist at microscope, IVF incubator visible"
            className="w-full h-auto block aspect-[16/9] object-cover"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#2A2A35]/85 via-[#2A2A35]/20 to-transparent" />

          <div className="absolute top-5 left-5 sm:top-7 sm:left-7 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D5EB4B] text-[#2A2A35] text-xs font-bold uppercase tracking-wider font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2A2A35] animate-pulse" />
            ZippyScale × Hyderabad fertility
          </div>

          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 lg:p-14">
            <div className="max-w-3xl">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#FFFDF7] leading-[1.05] tracking-tight mb-4" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                Built for IVF clinics.{' '}
                <span className="text-[#D5EB4B]">Like yours, in Hyderabad.</span>
              </h2>
              <p className="text-base sm:text-lg text-[#FFFDF7]/85 leading-relaxed max-w-2xl">
                Cycle-attribution stack, named-clinician creative templates, WhatsApp drip + AI consult-prep — already shipped to fertility clinics in Bombay. ZippyScale&apos;s Hyderabad team (Kothaguda HQ) now opening 3 founding-clinic slots.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-[#5A5A66]"
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D5EB4B]" />
            Hyderabad HQ · Kothaguda
          </span>
          <span className="text-[#9CA3AF]">·</span>
          <span>Fastest-growing AI-based growth marketing agency in India · Visionary Achievers Awards 2026</span>
          <span className="text-[#9CA3AF]">·</span>
          <a href="https://instagram.com/zippy.scale" target="_blank" rel="noopener noreferrer" className="text-[#2A2A35] font-semibold hover:text-[#D5EB4B] transition-colors">@zippy.scale →</a>
        </motion.div>
      </div>
    </section>
  )
}
