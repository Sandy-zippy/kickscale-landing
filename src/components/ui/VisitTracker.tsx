import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { trackEvent } from '../../lib/tracking'

function getVisitorId(): string {
  let id = localStorage.getItem('zippy_visitor_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('zippy_visitor_id', id)
  }
  return id
}

function getVisitCount(): number {
  getVisitorId()

  let count = parseInt(localStorage.getItem('zippy_visit_count') || '0', 10)

  if (!sessionStorage.getItem('zippy_current_session')) {
    count += 1
    localStorage.setItem('zippy_visit_count', String(count))
    sessionStorage.setItem('zippy_current_session', 'true')
    trackEvent('visitor_return', { visit_count: count })
  }

  return count
}

function getMessage(n: number): string {
  if (n <= 1) {
    return 'We just identified 3 automation opportunities for businesses like yours.'
  }
  if (n === 2) {
    return "We track everything, so your competitors can't hide."
  }
  return "Still thinking? Your competitors aren't waiting."
}

export default function VisitTracker() {
  const [visitCount, setVisitCount] = useState(0)

  useEffect(() => {
    setVisitCount(getVisitCount())
  }, [])

  if (visitCount === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="max-w-3xl mx-auto px-4 -mt-4 mb-8 relative z-10"
    >
      <div className="bg-white shadow-sm border border-[#E5E7EB] border-l-4 border-l-[#D5EB4B] rounded-lg px-5 py-3 flex items-center justify-between gap-4">
        <p className="text-sm text-[#4A5568]">
          {getMessage(visitCount)}
        </p>
        <span className="flex items-center gap-1.5 flex-shrink-0 bg-[#D5EB4B]/10 border border-[#D5EB4B]/30 rounded-full px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D5EB4B] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D5EB4B]" />
          </span>
          <span className="text-xs font-bold text-[#1A1A2E] font-mono">Visit #{visitCount}</span>
        </span>
      </div>
    </motion.div>
  )
}
