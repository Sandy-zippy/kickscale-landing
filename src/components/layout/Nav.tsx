import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(
    () => sessionStorage.getItem('scarcity_dismissed') !== 'true'
  )

  useEffect(() => {
    const check = () => setBannerVisible(sessionStorage.getItem('scarcity_dismissed') !== 'true')
    window.addEventListener('storage', check)
    window.addEventListener('scarcity-dismissed', check)
    return () => {
      window.removeEventListener('storage', check)
      window.removeEventListener('scarcity-dismissed', check)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed ${bannerVisible ? 'top-12' : 'top-0'} left-0 right-0 z-50 bg-[rgba(12,12,16,0.9)] backdrop-blur-xl border-b border-[#2E2E36] transition-all duration-300 ${scrolled ? 'shadow-lg shadow-black/40' : ''}`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logos/icon-64.png" alt="ZippyScale" className="w-7 h-7" />
          <span className="font-['Space_Grotesk'] font-bold text-lg text-[#FAFAFA]">
            ZippyScale
          </span>
        </a>

        {/* Desktop CTA */}
        <a
          href="#quiz"
          className="hidden md:inline-flex items-center rounded-lg bg-[#D5EB4B] px-5 py-2 text-sm font-semibold text-[#0c0c10] hover:bg-[#E4F57A] transition-colors"
        >
          Get Your Free Audit
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

      {/* Mobile slide-down sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden border-t border-[#2E2E36] bg-[rgba(12,12,16,0.95)]"
          >
            <div className="max-w-6xl mx-auto px-5 py-4">
              <a
                href="#quiz"
                className="block w-full text-center rounded-lg bg-[#D5EB4B] px-5 py-3 text-sm font-semibold text-[#0c0c10] hover:bg-[#E4F57A] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Get Your Free Audit
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
