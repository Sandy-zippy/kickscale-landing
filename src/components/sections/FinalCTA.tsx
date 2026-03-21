import ScrollReveal from '../ui/ScrollReveal'

export default function FinalCTA() {
  const scrollToQuiz = () => {
    document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative py-20 px-4 overflow-hidden" style={{ background: '#0c0c10' }}>
      {/* Animated gradient orbs */}
      <div className="cta-orb cta-orb-1" />
      <div className="cta-orb cta-orb-2" />
      <div className="cta-orb cta-orb-3" />

      <ScrollReveal>
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <h2
            className="text-4xl md:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Every Week You Wait, You Burn Another ₹35,000 on Busywork
          </h2>

          <p className="mt-4 text-lg text-[#9CA3AF]">
            3 spots left this quarter. First automations live in 2 weeks.
          </p>

          <div className="mt-10">
            <a
              href="#quiz"
              className="inline-block font-bold rounded-xl px-10 py-5 text-lg bg-[#D5EB4B] text-[#0c0c10] shadow-[0_0_30px_rgba(213,235,75,0.2)] hover:shadow-[0_0_50px_rgba(213,235,75,0.35)] transition-shadow"
            >
              Get Your Free Automation Roadmap
            </a>
          </div>

          <div className="mt-4">
            <button
              onClick={scrollToQuiz}
              className="text-sm text-[#9CA3AF] hover:underline hover:text-[#D5EB4B] transition-colors cursor-pointer bg-transparent border-none"
            >
              Takes 2 minutes. No commitment.
            </button>
          </div>

          <p className="mt-6 text-sm text-[#6B7280]">
            Free audit. Custom roadmap. Zero obligation.
          </p>
        </div>
      </ScrollReveal>

    </section>
  )
}
