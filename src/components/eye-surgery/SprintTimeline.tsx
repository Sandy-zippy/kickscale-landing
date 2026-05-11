import { motion } from 'framer-motion'

const PHASES = [
  { range: 'Days 1–14', title: 'Your campaigns + eligibility quiz go live', intro: 'Tracking turned on. 60-second eligibility quiz deployed. First fresh creative shipping.', items: ['Procedure-attribution tracking turned on','60-second AI eligibility quiz deployed','WhatsApp + SMS reminders saving leads on autopilot','First surgeon-led + tech-storytelling creative in ad accounts','Day 14: campaigns LIVE, first weekly report'] },
  { range: 'Days 15–45', title: 'Your procedure-CAC starts dropping', intro: 'Variants tested daily. Your numbers vs Day-0 baseline. Money-back checkpoint at Day 30.', items: ['8 to 12 fresh ad variants every week','Tuesday call: what worked, what we cut','Day 30 checkpoint: full refund if no lift','Front-desk call analysis, top blockers fixed','Mid-sprint scorecard: your numbers vs Day 0'] },
  { range: 'Days 46–90', title: 'Your OT volume scales', intro: 'Winners get scaled. Losers killed. Your 30 to 50 percent lift, locked.', items: ['Winners scaled 3 to 5×, losers killed','Optional geo expansion (Vijayawada, Vizag)','Day 75 final scorecard begins','Day 90 review: your 30 to 50 percent lift','Continue at founding rate, or pause'] },
]

export default function SprintTimeline() {
  return (
    <section className="bg-[#FFFDF7] py-24 sm:py-32 px-6 border-t border-[#2A2A35]/10">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20 items-baseline">
          <div className="md:col-span-3 text-xs tracking-[0.18em] uppercase font-bold text-[#2A2A35]/60 font-mono">03 / The 90-day sprint</div>
          <h2 className="md:col-span-9 text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2A2A35] leading-[1.02] tracking-tight">
            Your first 90 days, <span className="text-[#2A2A35]/55">phase by phase.</span>
          </h2>
        </motion.div>
        <div className="relative">
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-[#2A2A35]/15 -translate-x-px" />
          {PHASES.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, delay: i * 0.08 }} className={`relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16 last:mb-0 items-start ${i % 2 === 1 ? 'lg:[direction:rtl]' : ''}`} style={{ direction: 'ltr' }}>
              <div className="hidden lg:block absolute left-1/2 top-2 -translate-x-1/2 z-10">
                <div className="h-3 w-3 rounded-full bg-[#D5EB4B] ring-4 ring-[#FFFDF7]" />
              </div>
              <div className={i % 2 === 1 ? 'lg:[direction:ltr] lg:text-right lg:pl-12' : 'lg:pr-12'} style={{ direction: 'ltr' }}>
                <div className="text-xs uppercase tracking-[0.2em] font-mono text-[#2A2A35]/55 mb-3">{p.range}</div>
                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2A2A35] leading-[1.05] tracking-tight mb-4" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>{p.title}</h3>
                <p className="text-base text-[#5A5A66] leading-relaxed">{p.intro}</p>
              </div>
              <div className={i % 2 === 1 ? 'lg:[direction:ltr] lg:pr-12' : 'lg:pl-12'} style={{ direction: 'ltr' }}>
                <ol className="space-y-4">
                  {p.items.map((item, j) => (
                    <li key={item} className="flex items-baseline gap-4 text-[#2A2A35]">
                      <span className="text-xs font-mono text-[#2A2A35]/40 flex-shrink-0 w-6">{String(j + 1).padStart(2, '0')}</span>
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
