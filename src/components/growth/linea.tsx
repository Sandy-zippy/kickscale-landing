/**
 * Shared design-language primitives for /growth.
 *
 * Studied from lineaprompt.com and rebuilt on ZippyScale's own palette.
 * What we took is the *craft*, not the colours:
 *   - frost base with a faint blueprint grid
 *   - monospace eyebrow pills, uppercase + wide tracking
 *   - glass panels: translucent white, one big soft ambient shadow,
 *     plus a 1px inset top highlight (this is what makes them read as material)
 *   - 14px panel radius, 999px pills
 *   - very large, very tight display type (line-height ~0.96)
 *   - checklist bullets rather than dot bullets
 * Their indigo stays theirs; ours stays lime.
 */
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/** signature elevation: broad soft ambient + inset top highlight */
export const PANEL_SHADOW =
  '0 26px 70px -46px rgba(52,69,92,0.46), inset 0 1px 0 rgba(255,255,255,0.86)'
export const HUD_SHADOW =
  '0 34px 96px -48px rgba(58,74,100,0.55), inset 0 1px 0 rgba(255,255,255,0.82)'

/** faint blueprint grid — the texture under every light section */
export function FrostGrid({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(26,26,46,0.045) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(26,26,46,0.045) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 78%)',
      }}
    />
  )
}

/** monospace eyebrow pill — the section label pattern */
export function Eyebrow({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.18em] ${
        tone === 'dark'
          ? 'border-[#D5EB4B]/35 bg-[#D5EB4B]/10 text-[#D5EB4B]'
          : 'border-[#B8CF2E]/35 bg-[#D5EB4B]/18 text-[#5C6B10]'
      }`}
    >
      {children}
    </motion.span>
  )
}

/** display heading — big, tight, negative-tracked */
export function Display({
  children,
  className = '',
  as: Tag = 'h2',
}: {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <Tag
        className={`font-['Space_Grotesk'] font-bold leading-[0.98] tracking-[-0.035em] text-[2.25rem] sm:text-[3.25rem] lg:text-[3.75rem] ${className}`}
      >
        {children}
      </Tag>
    </motion.div>
  )
}

/** glass panel */
export function Panel({
  children,
  className = '',
  delay = 0,
  hover = true,
}: {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -4 } : undefined}
      style={{ boxShadow: PANEL_SHADOW }}
      className={`rounded-[14px] border border-white/80 bg-white/70 backdrop-blur-xl transition-shadow ${className}`}
    >
      {children}
    </motion.div>
  )
}

/** checklist row with a lime tick */
export function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] leading-relaxed text-[#374151]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-1 shrink-0">
        <path d="M3 8.4l3.2 3.2L13 4.8" stroke="#7E9B12" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </li>
  )
}
