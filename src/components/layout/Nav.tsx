import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl"
    >
      <div className="flex items-center justify-between rounded-full border border-[#2E2E36] bg-[rgba(20,20,24,0.85)] backdrop-blur-xl px-4 py-2.5 shadow-lg shadow-black/30">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logos/icon-64.png" alt="ZippyScale" className="w-7 h-7" />
          <span className="font-['Space_Grotesk'] font-bold text-lg text-[#FAFAFA] hidden sm:inline">
            Zippyscale
          </span>
        </a>

        {/* Desktop CTA */}
        <a
          href="#quiz"
          className="hidden md:inline-flex items-center rounded-full bg-[#D5EB4B] px-5 py-2 text-sm font-semibold text-[#0c0c10] hover:bg-[#E4F57A] transition-colors"
        >
          Book Your Free Automation Audit
        </a>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-[#FAFAFA] transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#FAFAFA] transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#FAFAFA] transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 rounded-2xl border border-[#2E2E36] bg-[rgba(20,20,24,0.95)] backdrop-blur-xl p-4"
          >
            <a
              href="#quiz"
              className="block w-full text-center rounded-full bg-[#D5EB4B] px-5 py-3 text-sm font-semibold text-[#0c0c10] hover:bg-[#E4F57A] transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Book Your Free Automation Audit
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
