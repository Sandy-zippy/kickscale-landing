import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GIVEAWAYS } from '../../data/giveaways'

interface NavProps {
  /** Set to true on pages that don't render the ScarcityBanner. Avoids the 48px top-12 gap. */
  noBanner?: boolean
  /** Override the CTA href. Defaults to the AI-automation quiz, which is where
   * that funnel lives now that / is the growth page. */
  ctaHref?: string
  /** Override the CTA wording. The free audit belongs to the AI-automation funnel,
   * so the cockpit homepage asks for a discovery call instead. */
  ctaLabel?: string
  /** What the CTA says on a phone, where it sits between the wordmark and the
   * hamburger and has maybe 7rem to play with. Defaults to `ctaLabel`, which is
   * fine for something short like "Free Audit" and not for anything longer. */
  ctaLabelMobile?: string
  /** Floating detached pill instead of a full-width bar (used on /growth). */
  floating?: boolean
  /**
   * Dark-glass skin for ink-grounded pages (/growth). Purely additive — every
   * existing caller omits it and renders exactly as before. Without it the
   * near-opaque white pill reads as a light island over a near-black hero.
   */
  dark?: boolean
  /**
   * Homepage-only button styling (2026-10-01): links draw a lime underline, the CTA
   * shimmers. Links, labels and destinations are identical; every other page omits
   * this and renders exactly as before.
   */
  cockpit?: boolean
}

/** Per-skin class tokens. Keeping them in one table is what makes it safe to
 *  claim the light path is unchanged: nothing below branches on `dark` inline. */
const SKIN = {
  light: {
    wordmark: 'text-[#1A1A2E]',
    link: 'text-[#1A1A2E] hover:text-[#B8CF2E]',
    bar: 'bg-[#1A1A2E]',
    panel: 'border-[#E5E7EB] bg-white',
    panelRow: 'hover:bg-[#FAFAF7]',
    panelTitle: 'text-[#1A1A2E]',
    panelSub: 'text-[#6B7280]',
    panelMore: 'text-[#B8CF2E] hover:bg-[#FAFAF7]',
    sheet: 'border-[#E5E7EB] bg-[rgba(255,253,247,0.98)]',
    sheetCard: 'border-[#E5E7EB] bg-white text-[#1A1A2E] hover:border-[#D5EB4B]',
    sheetPanel: 'border-[#E5E7EB] bg-[#FAFAF7]',
    sheetRow: 'text-[#1A1A2E] border-[#E5E7EB]',
  },
  dark: {
    wordmark: 'text-white',
    link: 'text-white/80 hover:text-[#D5EB4B]',
    bar: 'bg-white',
    panel: 'border-white/12 bg-[#0B0B12]',
    panelRow: 'hover:bg-white/[0.06]',
    panelTitle: 'text-white',
    panelSub: 'text-white/45',
    panelMore: 'text-[#D5EB4B] hover:bg-white/[0.06]',
    sheet: 'border-white/10 bg-[rgba(5,5,7,0.98)]',
    sheetCard: 'border-white/12 bg-white/[0.04] text-white hover:border-[#D5EB4B]',
    sheetPanel: 'border-white/10 bg-white/[0.03]',
    sheetRow: 'text-white/85 border-white/10',
  },
} as const

export default function Nav({ noBanner = false, ctaHref = '/ai-automation#quiz', ctaLabel = 'Get Your Free Audit', ctaLabelMobile, floating = false, dark = false, cockpit = false }: NavProps) {
  const c = dark ? SKIN.dark : SKIN.light
  /* homepage-only extras; empty strings elsewhere, so other pages' markup is unchanged */
  const lk = cockpit ? 'zs-navlink ' : ''
  const shine = cockpit ? <span aria-hidden className="zs-shine pointer-events-none absolute inset-0" /> : null
  const [menuOpen, setMenuOpen] = useState(false)
  const [giveawaysOpen, setGiveawaysOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(
    () => !noBanner && sessionStorage.getItem('scarcity_dismissed') !== 'true'
  )

  useEffect(() => {
    if (noBanner) return
    const check = () => setBannerVisible(sessionStorage.getItem('scarcity_dismissed') !== 'true')
    window.addEventListener('storage', check)
    window.addEventListener('scarcity-dismissed', check)
    return () => {
      window.removeEventListener('storage', check)
      window.removeEventListener('scarcity-dismissed', check)
    }
  }, [noBanner])

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
      className={
        floating
          // The dark pill is near-opaque on purpose. /growth alternates ink and
          // bone bands, and a translucent dark pill turns muddy grey the moment
          // it crosses a light section — the same trap the light pill hits over
          // a dark hero. Solid chrome reads as deliberate on both.
          ? `fixed ${bannerVisible ? 'top-14' : 'top-4'} left-1/2 z-50 w-[min(1100px,calc(100%-1.5rem))] -translate-x-1/2 rounded-full border ${dark ? 'border-white/12 bg-[rgba(8,8,11,0.96)]' : 'border-white/90 bg-[rgba(255,255,255,0.94)]'} backdrop-blur-xl transition-all duration-300`
          : `fixed ${bannerVisible ? 'top-12' : 'top-0'} left-0 right-0 z-50 ${dark ? 'bg-[rgba(5,5,7,0.9)] border-b border-white/10' : 'bg-[rgba(255,253,247,0.95)] border-b border-[#E5E7EB]'} backdrop-blur-xl transition-all duration-300 ${scrolled ? 'shadow-sm' : ''}`
      }
      style={
        floating
          ? {
              boxShadow: dark
                ? scrolled
                  ? '0 24px 64px -36px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.10)'
                  : '0 16px 48px -32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)'
                : scrolled
                  ? '0 22px 60px -34px rgba(52,69,92,0.55), inset 0 1px 0 rgba(255,255,255,0.9)'
                  : '0 14px 44px -30px rgba(52,69,92,0.45), inset 0 1px 0 rgba(255,255,255,0.9)',
            }
          : undefined
      }
    >
      <div className={`mx-auto flex items-center justify-between ${floating ? 'px-5 py-2.5' : 'max-w-6xl px-5 py-3'}`}>
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logos/icon-64.png" alt="ZippyScale" className="w-7 h-7" />
          {/* Below ~380px the wordmark and the CTA cannot both fit. The mark is the
              logo; the word is a nicety. */}
          <span className={`hidden min-[380px]:inline font-['Space_Grotesk'] font-bold text-lg ${c.wordmark}`}>
            ZippyScale
          </span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {/* The agency is a service under the product now (2026-09-26), so it
              sits in the nav rather than being the front door. */}
          <a
            href="/agency"
            className={`${lk}text-sm font-medium ${c.link} transition-colors`}
          >
            Marketing agency
          </a>
          <a
            href="/ai-automation"
            className={`${lk}text-sm font-medium ${c.link} transition-colors`}
          >
            AI Automation
          </a>
          <a
            href="/websites"
            className={`${lk}text-sm font-medium ${c.link} transition-colors`}
          >
            Websites
          </a>

          {/* Giveaways dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setGiveawaysOpen(true)}
            onMouseLeave={() => setGiveawaysOpen(false)}
          >
            <a
              href="/giveaways"
              className={`${lk}flex items-center gap-1 text-sm font-medium ${c.link} transition-colors`}
              aria-haspopup="true"
              aria-expanded={giveawaysOpen}
            >
              Giveaways
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden
                className={`transition-transform ${giveawaysOpen ? 'rotate-180' : ''}`}>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </a>
            <AnimatePresence>
              {giveawaysOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16 }}
                  className="absolute left-0 top-full pt-3 w-72"
                >
                  <div className={`rounded-xl border ${c.panel} p-2 shadow-[0_18px_40px_-24px_rgba(20,20,30,0.35)]`}>
                    {GIVEAWAYS.map(g => (
                      <a
                        key={g.slug}
                        href={g.href}
                        className={`block rounded-lg px-3 py-2.5 ${c.panelRow} transition-colors`}
                      >
                        <span className={`block text-sm font-semibold ${c.panelTitle}`}>
                          {g.emoji} {g.title}
                        </span>
                        <span className={`block text-xs mt-0.5 ${c.panelSub}`}>{g.forWho}</span>
                      </a>
                    ))}
                    <a
                      href="/giveaways"
                      className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${c.panelMore} transition-colors`}
                    >
                      See all giveaways →
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a
            href="/case-studies"
            className={`${lk}text-sm font-medium ${c.link} transition-colors`}
          >
            Case Studies
          </a>
          <a
            href="/client-login/"
            className={`${lk}text-sm font-medium ${c.link} transition-colors`}
          >
            Client Login
          </a>
          <a
            href={ctaHref}
            className={cockpit
              ? 'relative inline-flex items-center overflow-hidden rounded-full bg-[#D5EB4B] px-5 py-2 text-sm font-semibold text-[#0c0c10] shadow-[0_0_28px_-8px_rgba(213,235,75,0.8)] transition-transform hover:scale-[1.04] active:scale-95'
              : 'inline-flex items-center rounded-lg bg-[#D5EB4B] px-5 py-2 text-sm font-semibold text-[#0c0c10] hover:bg-[#E4F57A] transition-colors'}
          >
            {shine}
            {cockpit ? <span className="relative">{ctaLabel}</span> : ctaLabel}
          </a>
        </div>

        {/* Phone: the CTA lives in the bar, not behind the hamburger. The bar floats
            over every section, so this is the one thing on screen at all times, and
            burying the only ask behind a menu wastes it. */}
        <div className="md:hidden flex items-center gap-1.5">
          <a
            href={ctaHref}
            onClick={() => setMenuOpen(false)}
            className={`${cockpit ? 'relative overflow-hidden active:scale-95 ' : ''}inline-flex items-center whitespace-nowrap rounded-full bg-[#D5EB4B] px-3.5 py-2 text-[12.5px] font-bold text-[#0c0c10] transition-colors hover:bg-[#E4F57A]`}
          >
            {shine}
            {cockpit ? <span className="relative">{ctaLabelMobile ?? ctaLabel}</span> : (ctaLabelMobile ?? ctaLabel)}
          </a>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 ${c.bar} transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 ${c.bar} transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 ${c.bar} transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
        </div>
      </div>

      {/* Mobile slide-down sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className={`md:hidden overflow-hidden border-t ${c.sheet} ${floating ? "rounded-b-[26px]" : ""}`}
          >
            <div className="max-w-6xl mx-auto px-5 py-4 space-y-3">
                            <a
                href="/agency"
                className={cockpit
                  ? `block w-full text-center rounded-lg border ${c.sheetCard} px-5 py-3 text-sm font-semibold transition-colors`
                  : `text-lg font-medium ${c.link} transition-colors`}
                onClick={() => setMenuOpen(false)}
              >
                Marketing agency
              </a>
<a
                href="/ai-automation"
                className={`block w-full text-center rounded-lg border ${c.sheetCard} px-5 py-3 text-sm font-semibold transition-colors`}
                onClick={() => setMenuOpen(false)}
              >
                AI Automation
              </a>
              <a
                href="/websites"
                className={`block w-full text-center rounded-lg border ${c.sheetCard} px-5 py-3 text-sm font-semibold transition-colors`}
                onClick={() => setMenuOpen(false)}
              >
                Websites
              </a>

              {/* Giveaways accordion */}
              <div className={`rounded-lg border overflow-hidden ${c.sheetCard}`}>
                <button
                  onClick={() => setGiveawaysOpen(v => !v)}
                  className={`flex w-full items-center justify-center gap-1.5 px-5 py-3 text-sm font-semibold ${c.panelTitle}`}
                  aria-expanded={giveawaysOpen}
                >
                  Giveaways
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden
                    className={`transition-transform ${giveawaysOpen ? 'rotate-180' : ''}`}>
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <AnimatePresence>
                  {giveawaysOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`overflow-hidden border-t ${c.sheetPanel}`}
                    >
                      {GIVEAWAYS.map(g => (
                        <a
                          key={g.slug}
                          href={g.href}
                          className={`block px-5 py-3 text-sm border-b last:border-0 ${c.sheetRow}`}
                          onClick={() => setMenuOpen(false)}
                        >
                          {g.emoji} {g.title}
                        </a>
                      ))}
                      <a
                        href="/giveaways"
                        className={`block px-5 py-3 text-sm font-semibold ${dark ? 'text-[#D5EB4B]' : 'text-[#B8CF2E]'}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        See all giveaways →
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                href="/case-studies"
                className={`block w-full text-center rounded-lg border ${c.sheetCard} px-5 py-3 text-sm font-semibold transition-colors`}
                onClick={() => setMenuOpen(false)}
              >
                Case Studies
              </a>
              <a
                href="/client-login/"
                className={`block w-full text-center rounded-lg border ${c.sheetCard} px-5 py-3 text-sm font-semibold transition-colors`}
                onClick={() => setMenuOpen(false)}
              >
                Client Login
              </a>
              <a
                href={ctaHref}
                className={`${cockpit ? 'relative overflow-hidden ' : ''}block w-full text-center rounded-lg bg-[#D5EB4B] px-5 py-3 text-sm font-semibold text-[#0c0c10] hover:bg-[#E4F57A] transition-colors`}
                onClick={() => setMenuOpen(false)}
              >
                {shine}
                {cockpit ? <span className="relative">{ctaLabel}</span> : ctaLabel}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
