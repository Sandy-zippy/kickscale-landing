import { motion } from 'framer-motion'
import Icon from './Icon'

const PIPELINE = [
  { stage: 'Acquisition', tools: ['Stape', 'Meta + Google Ads'], benefit: 'Bid on OT bookings, not free screenings. Recover the 25 to 40 percent of conversions Meta misses post-iOS14.' },
  { stage: 'Conversion', tools: ['GHL', 'n8n', '60-sec eligibility quiz'], benefit: '60-second AI eligibility quiz qualifies LASIK + cataract candidates. WhatsApp follow-up to OT booking.' },
  { stage: 'Creative', tools: ['Higgsfield', 'Nano Banana', 'Claude AI'], benefit: '8 to 12 fresh surgeon-led, tech-storytelling creatives weekly. ASCI + NMC-compliant. Call analysis every week.' },
]

export default function StackDiagram() {
  return (
    <section className="bg-[#2A2A35] text-[#FFFDF7] py-32 sm:py-40 px-6 relative overflow-hidden">
      <div aria-hidden className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none" style={{ background: '#D5EB4B', filter: 'blur(100px)' }} />
      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20 items-baseline">
          <div className="md:col-span-3 text-xs tracking-[0.18em] uppercase font-bold text-[#D5EB4B] font-mono">02 / The mechanism</div>
          <h2 className="md:col-span-9 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.02] tracking-tight">
            Three stages. <span className="text-[#FFFDF7]/50">From ad rupee to a booked LASIK or cataract OT.</span>
          </h2>
        </motion.div>
        <div className="space-y-px relative">
          <div className="hidden md:block absolute left-[36px] top-12 bottom-12 w-px bg-gradient-to-b from-[#D5EB4B] via-[#D5EB4B]/50 to-[#D5EB4B]" />
          {PIPELINE.map((stage, i) => (
            <motion.div key={stage.stage} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5, delay: i * 0.12 }} className="grid grid-cols-1 md:grid-cols-[80px_1fr_1.5fr] gap-6 sm:gap-10 py-10 sm:py-12 border-t border-[#FFFDF7]/15 first:border-t-0 group">
              <div className="flex md:justify-start items-center md:items-start">
                <div className="relative h-[72px] w-[72px] rounded-full border border-[#FFFDF7]/15 bg-[#2A2A35] flex items-center justify-center group-hover:border-[#D5EB4B] transition-colors z-10">
                  <span className="text-2xl font-bold font-mono text-[#D5EB4B]">{String(i + 1).padStart(2, '0')}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#FFFDF7]/50 mb-3">Stage</div>
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{stage.stage}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {stage.tools.map((t) => (<span key={t} className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#FFFDF7]/8 border border-[#FFFDF7]/15 text-[#FFFDF7]/85">{t}</span>))}
                </div>
              </div>
              <div className="md:pt-8"><p className="text-lg sm:text-xl text-[#FFFDF7] leading-snug font-medium">{stage.benefit}</p></div>
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-6 sm:gap-10 py-10 border-t border-[#FFFDF7]/15">
            <div className="flex items-center md:items-start">
              <div className="h-[72px] w-[72px] rounded-full bg-[#D5EB4B] flex items-center justify-center text-[#2A2A35] z-10"><Icon name="check" size={28} /></div>
            </div>
            <div className="md:pt-3">
              <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#D5EB4B] mb-3">Outcome</div>
              <p className="text-2xl sm:text-3xl font-bold leading-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                Booked LASIK + cataract procedures. Predictably. <span className="text-[#D5EB4B]">Every month.</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
