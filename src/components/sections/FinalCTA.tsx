import ScrollReveal from '../ui/ScrollReveal'

export default function FinalCTA() {
  const scrollToQuiz = () => {
    document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative py-24 overflow-hidden" style={{ background: '#0c0c10' }}>
      {/* Animated gradient orbs */}
      <div className="cta-orb cta-orb-1" />
      <div className="cta-orb cta-orb-2" />
      <div className="cta-orb cta-orb-3" />

      <ScrollReveal>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2
            className="text-4xl md:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Every Week You Wait, You Burn Another ₹35,000 on Busywork
          </h2>

          <p className="mt-4 text-lg text-[#9CA3AF]">
            3 spots left for April. First automations live in 2 weeks.
          </p>

          <div className="mt-10">
            <a
              href="#quiz"
              className="inline-block font-bold rounded-xl px-10 py-5 text-lg transition-shadow"
              style={{
                background: '#D5EB4B',
                color: '#0c0c10',
                boxShadow: '0 0 30px rgba(213,235,75,0.2)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 50px rgba(213,235,75,0.35)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(213,235,75,0.2)'
              }}
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

      <style>{`
        .cta-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
          pointer-events: none;
          will-change: transform;
        }
        .cta-orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(213,235,75,0.25), transparent 70%);
          top: -15%;
          right: -5%;
          animation: ctaFloat1 8s ease-in-out infinite;
        }
        .cta-orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(213,235,75,0.18), transparent 70%);
          bottom: -10%;
          left: -5%;
          animation: ctaFloat2 10s ease-in-out infinite;
        }
        .cta-orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(213,235,75,0.15), transparent 70%);
          top: 50%;
          left: 50%;
          animation: ctaFloat3 12s ease-in-out infinite;
        }
        @keyframes ctaFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.05); }
          66% { transform: translate(20px, -15px) scale(0.95); }
        }
        @keyframes ctaFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.08); }
          66% { transform: translate(-25px, 15px) scale(0.92); }
        }
        @keyframes ctaFloat3 {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, -30px) scale(1.1); }
        }
      `}</style>
    </section>
  )
}
