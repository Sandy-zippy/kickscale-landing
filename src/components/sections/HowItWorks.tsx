import ScrollReveal from '../ui/ScrollReveal'

const stepIcons: React.ReactNode[] = [
  // Step 1: clipboard/checklist
  <svg key="s1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8CF2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>,
  // Step 2: magnifying glass
  <svg key="s2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8CF2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>,
  // Step 3: rocket/chart-up
  <svg key="s3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8CF2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>,
]

const steps = [
  {
    num: 1,
    title: 'Take the 2-Minute Quiz',
    desc: 'Tell us what your team spends time on. We\'ll identify every automation opportunity.',
  },
  {
    num: 2,
    title: 'Get Your Free Audit',
    desc: 'We manually review your business and deliver a custom automation roadmap within 48 hours.',
  },
  {
    num: 3,
    title: 'We Build. You Scale.',
    desc: 'If selected, we build and deploy your automations. Live in 2 to 4 weeks. Your team does 10x the work.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#FFFDF7] py-20 px-4">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <p className="text-center font-mono text-xs uppercase tracking-widest mb-4 text-[#B8CF2E]">
            THE PROCESS
          </p>
          <h2 className="mx-auto mb-12 max-w-xl text-center text-3xl font-bold text-[#1A1A2E] sm:text-4xl">
            Live in 2 Weeks, Not 2 Quarters
          </h2>
        </ScrollReveal>

        <div className="relative grid grid-cols-1 gap-5 md:gap-6 md:grid-cols-3">
          {/* Connection lines (desktop only) */}
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
            <div className="absolute left-[33.33%] top-[3.5rem] h-px w-[calc(33.33%-3rem)] -translate-x-1/2 border-t border-dashed border-[#B8CF2E]/40" style={{ marginLeft: '1.5rem' }} />
            <div className="absolute left-[66.66%] top-[3.5rem] h-px w-[calc(33.33%-3rem)] -translate-x-1/2 border-t border-dashed border-[#B8CF2E]/40" style={{ marginLeft: '1.5rem' }} />
          </div>

          {steps.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 0.12}>
              <div className="relative flex flex-col items-center rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#D5EB4B] text-xl font-bold text-[#0c0c10]">
                  {step.num}
                </div>
                <div className="mb-4">
                  {stepIcons[i]}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#1A1A2E]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#4A5568]">
                  {step.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
