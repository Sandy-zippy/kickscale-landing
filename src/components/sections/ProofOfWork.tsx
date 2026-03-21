import ScrollReveal from '../ui/ScrollReveal'
import AnimatedCounter from '../ui/AnimatedCounter'

const stats = [
  { target: 1.6, prefix: '₹', suffix: ' Cr+', label: 'Saved across clients', decimals: 1 },
  { target: 8000, prefix: '', suffix: '+', label: 'Hours of manual work eliminated', decimals: 0 },
  { target: 20, prefix: '', suffix: '+', label: 'Businesses automated', decimals: 0 },
  { target: 10, prefix: '', suffix: 'x', label: 'Output, same team, zero new hires', decimals: 0 },
]

export default function ProofOfWork() {
  return (
    <section className="bg-[#0c0c10] py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <ScrollReveal>
          <p className="font-mono text-xs uppercase tracking-widest text-[#D5EB4B] mb-4">
            Proof of Work
          </p>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-12">
            What Our Automations Have Delivered
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1}>
              <div className="bg-[#1E1E24] border border-[#2E2E36] rounded-2xl p-6 md:p-8 text-center transition-all duration-300 hover:border-[#D5EB4B]/30 hover:-translate-y-1">
                <AnimatedCounter
                  target={stat.target}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  className="font-mono font-bold text-4xl md:text-5xl text-[#D5EB4B]"
                  duration={2}
                />
                <p className="font-sans text-sm text-[#9CA3AF] mt-2">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
