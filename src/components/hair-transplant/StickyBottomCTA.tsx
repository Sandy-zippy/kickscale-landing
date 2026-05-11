import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WA_HREF } from './WhatsAppCTA'

export default function StickyBottomCTA() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function onScroll() {
      const scrolled = window.scrollY
      const threshold = window.innerHeight * 0.6
      const nearBottom = scrolled + window.innerHeight > document.body.scrollHeight - 400
      setShow(scrolled > threshold && !nearBottom)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40"
        >
          <div className="rounded-2xl bg-[#2A2A35] text-[#FFFDF7] shadow-[0_20px_50px_rgba(42,42,53,0.35)] border border-[#FFFDF7]/10 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-3 sm:gap-5 max-w-[640px] mx-auto">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="h-2 w-2 rounded-full bg-[#D5EB4B] animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-mono text-[#FFFDF7] truncate">
                  <span className="text-[#D5EB4B] font-bold">2 of 5</span> founding slots
                </div>
                <div className="text-[10px] sm:text-xs text-[#FFFDF7]/60 hidden sm:block">
                  ₹2L/mo locked before step-up
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
              <a
                href={WA_HREF}
                target="_blank"
                rel="noopener noreferrer"
                data-tracking="sticky_wa"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-md bg-[#D5EB4B] text-[#2A2A35] font-bold text-sm hover:bg-[#c2d942] transition-colors whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                <span className="hidden sm:inline">WhatsApp us</span>
                <span className="sm:hidden">WA</span>
              </a>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                data-tracking="sticky_apply"
                className="text-xs sm:text-sm font-semibold text-[#FFFDF7]/80 hover:text-[#D5EB4B] transition-colors whitespace-nowrap"
              >
                ↑ Apply
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
