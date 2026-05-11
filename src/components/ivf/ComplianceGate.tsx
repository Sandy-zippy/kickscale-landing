import { motion } from 'framer-motion'

const POINTS = [
  'ART (Reg.) Act 2021',
  'PCPNDT Act',
  'ASCI guidelines',
  'Meta Health-Restricted',
  'Google Healthcare Ad',
  'DPDP Act 2023',
  'No "guaranteed pregnancy"',
  'No gender-selection',
  'No misspell circumvention',
  'Price-claim honesty',
  'Doctor-credential checks',
  'Clinical-claim sourcing',
  'Photo consent',
  'WhatsApp opt-in',
]

export default function ComplianceGate() {
  return (
    <section className="bg-[#FFFDF7] py-24 sm:py-32 px-6 border-t border-[#2A2A35]/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 mb-14 items-end"
        >
          <div>
            <div className="text-xs tracking-[0.18em] uppercase font-bold text-[#2A2A35]/60 mb-3">
              Compliance gate
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#2A2A35] leading-[1.05] tracking-tight">
              Every creative passes a 14-point gate.
            </h2>
          </div>
          <div className="rounded-2xl border-2 border-[#2A2A35] bg-[#2A2A35] text-[#FFFDF7] p-6 text-center">
            <div className="text-6xl sm:text-7xl font-bold text-[#D5EB4B] font-mono mb-1">1,000+</div>
            <div className="font-semibold">creatives shipped across regulated verticals</div>
            <div className="text-xs text-[#FFFDF7]/60 mt-1">Zero Meta health-policy bans · Zero ART Act flags</div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {POINTS.map((p, i) => (
            <motion.div
              key={p}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[#2A2A35]/15 bg-[#FFFDF7] hover:border-[#D5EB4B] transition-colors"
            >
              <motion.span
                initial={{ background: '#E5E7EB', color: '#9CA3AF' }}
                whileInView={{ background: '#D5EB4B', color: '#2A2A35' }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.04 }}
                className="h-5 w-5 rounded flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
              >
                ✓
              </motion.span>
              <span className="text-xs sm:text-sm font-medium text-[#2A2A35] leading-tight">{p}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
