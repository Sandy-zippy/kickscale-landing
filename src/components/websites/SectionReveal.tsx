/**
 * The one scroll reveal every /websites section uses: a 28px rise and fade, once.
 * Reduced motion (useCalmMotion): no rise, the fade stays.
 */
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useCalmMotion } from '../cockpit/useCalmMotion'
import { EASE_OUT } from './tokens'

export default function SectionReveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const calm = useCalmMotion()
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: calm ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: calm ? 0.3 : 0.8, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}
