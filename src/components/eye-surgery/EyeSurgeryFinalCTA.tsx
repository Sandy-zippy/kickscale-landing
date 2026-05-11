import { motion } from 'framer-motion'
import WhatsAppCTA from './WhatsAppCTA'

export default function EyeSurgeryFinalCTA() {
  return (
    <section className="bg-[#FFFDF7] relative overflow-hidden py-32 sm:py-40 px-6 border-t border-[#2A2A35]/10">
      <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-15 pointer-events-none" style={{ background: '#D5EB4B', filter: 'blur(120px)' }} />
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="relative max-w-4xl mx-auto text-center">
        <div className="text-xs tracking-[0.18em] uppercase font-bold text-[#2A2A35]/60 mb-6">Three founding slots remaining</div>
        <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#2A2A35] leading-[1.02] tracking-tight mb-6">
          See your 90-day procedure target,{' '}
          <span className="relative inline-block">
            <span className="relative z-10">before someone else does.</span>
            <span className="absolute inset-x-0 bottom-1 h-3 sm:h-4 bg-[#D5EB4B] -z-0 -skew-x-3"></span>
          </span>
        </h2>
        <p className="text-lg text-[#5A5A66] max-w-2xl mx-auto mb-10 leading-relaxed">
          Free audit. Custom OT-volume target. ₹2L locked forever for the first 3 Hyderabad eye-surgery clinics. <span className="text-[#2A2A35] font-semibold">We refund you if we don&apos;t deliver.</span>
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <WhatsAppCTA variant="primary" label="WhatsApp us → 30-min reply" trackingLabel="final_wa" />
          <a href="#hero-form" data-tracking="final_apply" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium border-2 border-[#2A2A35] text-[#2A2A35] hover:bg-[#2A2A35] hover:text-[#FFFDF7] transition-colors">
            ↑ Lock my slot — hero form
          </a>
        </div>
        <div className="mt-16 pt-8 border-t border-[#2A2A35]/15 text-sm text-[#9CA3AF] flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <span>ZippyScale · Hyderabad</span><span>·</span>
          <a href="https://zippyscale.in" className="hover:text-[#2A2A35]">zippyscale.in</a><span>·</span>
          <a href="/privacy" className="hover:text-[#2A2A35]">Privacy</a>
        </div>
      </motion.div>
    </section>
  )
}
