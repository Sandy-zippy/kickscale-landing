import { motion } from 'framer-motion'
import AnimatedCounter from '../ui/AnimatedCounter'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: {
    transition: { staggerChildren: 0.15 },
  },
}

const stats = [
  { target: 18, prefix: '₹', suffix: ' Lakhs/Year', label: 'Saved' },
  { target: 40, suffix: ' Hrs/Week', label: 'Freed' },
  { target: 10, suffix: 'x Output', label: 'Same Team' },
]

export default function Hero() {
  const scrollToQuiz = () => {
    document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #111116 0%, #0c0c10 100%)' }}
    >
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #D5EB4B 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Animated gradient orbs */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6 py-20 max-w-5xl mx-auto"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(213,235,75,0.08)',
              border: '1px solid rgba(213,235,75,0.3)',
              color: '#D5EB4B',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            For ₹5Cr+ Indian Businesses
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-8 text-5xl md:text-7xl font-bold max-w-4xl mx-auto leading-[1.1]"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, #FFFFFF 30%, #D5EB4B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Your Team Is Doing ₹18 Lakh Worth of Work That AI Can Handle
        </motion.h1>

        {/* Stats row */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex items-baseline gap-1.5">
              {stat.label && (
                <span className="text-sm text-[#9CA3AF]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {stat.label}
                </span>
              )}
              <AnimatedCounter
                target={stat.target}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="text-2xl md:text-3xl font-bold text-[#D5EB4B]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          ))}
        </motion.div>

        {/* Primary CTA */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-12">
          <motion.a
            href="#quiz"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
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
            See What You Can Automate (Free Audit)
          </motion.a>
        </motion.div>

        {/* Secondary CTA */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-4">
          <button
            onClick={scrollToQuiz}
            className="text-sm text-[#9CA3AF] hover:underline hover:text-[#D5EB4B] transition-colors cursor-pointer bg-transparent border-none"
          >
            Only 10 spots left. Check availability.
          </button>
        </motion.div>
      </motion.div>

      {/* Orb keyframes injected via style tag */}
      <style>{`
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
          pointer-events: none;
          will-change: transform;
        }
        .hero-orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(213,235,75,0.25), transparent 70%);
          top: -10%;
          left: -5%;
          animation: float1 8s ease-in-out infinite;
        }
        .hero-orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(213,235,75,0.18), transparent 70%);
          bottom: -5%;
          right: -5%;
          animation: float2 10s ease-in-out infinite;
        }
        .hero-orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(213,235,75,0.15), transparent 70%);
          top: 40%;
          left: 50%;
          animation: float3 12s ease-in-out infinite;
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, 30px) scale(1.05); }
          66% { transform: translate(-20px, -15px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, -20px) scale(1.08); }
          66% { transform: translate(25px, 15px) scale(0.92); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, -30px) scale(1.1); }
        }
      `}</style>
    </section>
  )
}
