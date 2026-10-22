/**
 * The homepage's call-to-action button.
 *
 * Shimmer sweep adapted from the MIT "Shimmer Button" on 21st.dev (@Shatlyk1011,
 * emerald-ui), rebuilt on our tokens with no clsx/tailwind-merge dependency.
 * On top of it: a magnetic pull toward the cursor (real pointers only) and a press-in
 * spring everywhere, so a tap on a phone is felt.
 *
 * `Pill` in growth/kinetic is left alone: /agency and /giveaways use it.
 */
import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { LIME } from '../growth/kinetic'
import { useCalmMotion, useCanHover } from './useCalmMotion'

const SPRING = { stiffness: 260, damping: 18, mass: 0.6 }

export default function ShineButton({
  href, children, variant = 'lime', className = '',
}: {
  href: string
  children: ReactNode
  variant?: 'lime' | 'ink'
  className?: string
}) {
  const calm = useCalmMotion()
  const hover = useCanHover()
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useSpring(useMotionValue(0), SPRING)
  const y = useSpring(useMotionValue(0), SPRING)
  const magnetic = hover && !calm

  const skin = variant === 'lime'
    ? { background: LIME, color: '#0A0A0C', boxShadow: '0 0 48px -10px rgba(213,235,75,0.8), inset 0 1px 0 rgba(255,255,255,0.5)' }
    : { background: '#0A0A0C', color: '#FFFFFF', boxShadow: '0 16px 40px -18px rgba(10,10,12,0.8)' }

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ ...skin, x, y }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      onPointerMove={e => {
        if (!magnetic || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * 0.28)
        y.set((e.clientY - r.top - r.height / 2) * 0.35)
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
      className={`group/shine relative inline-flex min-h-[48px] items-center justify-center gap-2.5 overflow-hidden rounded-full px-8 py-4 font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variant === 'lime' ? 'focus-visible:ring-[#D5EB4B]' : 'focus-visible:ring-[#0A0A0C]'} ${className}`}
    >
      <span aria-hidden className={`zs-shine ${variant === 'ink' ? 'zs-shine-ink' : ''} pointer-events-none absolute inset-0`} />
      <span className="relative">{children}</span>
      <span aria-hidden className="relative transition-transform duration-300 group-hover/shine:translate-x-1">→</span>
    </motion.a>
  )
}
