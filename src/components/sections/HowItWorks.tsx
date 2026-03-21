import ScrollReveal from '../ui/ScrollReveal'

const steps = [
  {
    num: 1,
    title: 'Tell Us What to Automate',
    desc: 'Take the 2-minute quiz below. Pick the processes eating your team\'s time.',
  },
  {
    num: 2,
    title: 'We Build Your Automations',
    desc: 'Custom workflows designed, built, and tested. Live in 2 to 4 weeks.',
  },
  {
    num: 3,
    title: 'You Scale Without Hiring',
    desc: 'Your team does 10x the work. We monitor and optimize everything, 24/7.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-[#0c0c10] py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <ScrollReveal>
          <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-[#D5EB4B]">
            THE PROCESS
          </p>
          <h2 className="mx-auto mb-14 max-w-xl text-center text-3xl font-bold text-white sm:text-4xl">
            Live in 2 Weeks, Not 2 Quarters
          </h2>
        </ScrollReveal>

        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Connection lines (desktop only) */}
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
            {/* Line between step 1 and 2 */}
            <div className="absolute left-[33.33%] top-[3.5rem] h-px w-[calc(33.33%-3rem)] -translate-x-1/2 border-t border-dashed border-[#D5EB4B]/40" style={{ marginLeft: '1.5rem' }} />
            {/* Line between step 2 and 3 */}
            <div className="absolute left-[66.66%] top-[3.5rem] h-px w-[calc(33.33%-3rem)] -translate-x-1/2 border-t border-dashed border-[#D5EB4B]/40" style={{ marginLeft: '1.5rem' }} />
          </div>

          {steps.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 0.12}>
              <div className="relative flex flex-col items-center rounded-2xl border border-[#2E2E36] bg-[#1E1E24] p-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D5EB4B] text-xl font-bold text-[#0c0c10]">
                  {step.num}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#9CA3AF]">
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
