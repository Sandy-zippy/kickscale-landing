/**
 * The agent character.
 *
 * A cockpit is sold on the idea that small specialists do work for you, so the page
 * should show small specialists doing work. These are deliberately *characters* —
 * they blink, they look where they are going, they carry things and put them down —
 * because a diagram of boxes and arrows does not make anyone feel anything.
 *
 * Built as inline SVG rather than Lottie or video: it is a few kilobytes, it inherits
 * brand colour, it stays crisp at any size, and it can be driven by the same
 * framer-motion the rest of the site already loads.
 *
 * Motion is suppressed under prefers-reduced-motion — not by branching on matchMedia
 * in JS (which risks a hydration mismatch) but by handing the CSS a class the global
 * stylesheet already neutralises, plus framer's own reduced-motion handling.
 */
import { motion, useReducedMotion, type MotionValue } from 'framer-motion'
import type { CSSProperties } from 'react'
import { LIME } from '../growth/kinetic'

export type AgentMood = 'idle' | 'working' | 'carrying' | 'happy' | 'stuck'

export type AgentSkin = {
  /** body fill */
  body: string
  /** antenna tip + accents */
  accent: string
  /** eye colour */
  eye: string
}

export const SKINS: Record<string, AgentSkin> = {
  lime:   { body: '#D5EB4B', accent: '#0A0A0C', eye: '#0A0A0C' },
  ink:    { body: '#14141C', accent: LIME,      eye: '#F5F5F0' },
  bone:   { body: '#F5F5F0', accent: '#0A0A0C', eye: '#0A0A0C' },
  violet: { body: '#8B7CF6', accent: '#0A0A0C', eye: '#0A0A0C' },
  sky:    { body: '#5BC2F6', accent: '#0A0A0C', eye: '#0A0A0C' },
  coral:  { body: '#F6785B', accent: '#0A0A0C', eye: '#F5F5F0' },
}

/** the little cube an agent carries — one piece of your data, in transit */
export function Parcel({ size = 10, tone = '#0A0A0C', style }: {
  size?: number; tone?: string; style?: CSSProperties
}) {
  return (
    <span
      aria-hidden
      style={{
        width: size, height: size, background: tone, display: 'inline-block',
        borderRadius: 2, ...style,
      }}
    />
  )
}

export function Agent({
  skin = 'lime',
  size = 44,
  mood = 'idle',
  label,
  /** stagger the idle loop so a row of them does not breathe in unison */
  phase = 0,
  className = '',
  eyes,
}: {
  skin?: keyof typeof SKINS
  size?: number
  mood?: AgentMood
  /** accessible name — these are decorative unless you give them one */
  label?: string
  phase?: number
  className?: string
  /** where the eyes look, in viewBox units (about ±3). Zippy drives these from the
   *  pointer; every other agent leaves them alone and looks straight ahead. */
  eyes?: { x: MotionValue<number>; y: MotionValue<number> }
}) {
  const s = SKINS[skin] ?? SKINS.lime
  const reduce = useReducedMotion()

  /* Where the reduced-motion line is drawn, and why.
     iOS sets prefers-reduced-motion the moment Low Power Mode is on, which has nothing
     to do with anyone's vestibular system, and the first version of this froze the
     agents solid for every visitor on a low battery. So: travel, bobbing and scaling
     are dropped, because those are what cause discomfort. A blink and an antenna pulse
     stay, because they are two pixels of opacity in a fixed spot and they are the
     difference between a character and a sticker. */

  /* one loop per mood, so a single component covers every state the page needs */
  const bob = reduce
    ? {}
    : mood === 'working'
      ? { y: [0, -1.5, 0], rotate: [0, 1.5, 0, -1.5, 0] }
      : mood === 'stuck'
        ? { x: [0, -1.5, 1.5, -1.5, 0] }
        : mood === 'happy'
          ? { y: [0, -5, 0] }
          : { y: [0, -2.5, 0] }

  const dur = mood === 'working' ? 1.1 : mood === 'stuck' ? 0.5 : mood === 'happy' ? 0.9 : 2.6

  return (
    <motion.span
      className={`relative inline-block align-middle ${className}`}
      style={{ width: size, height: size }}
      animate={bob}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay: phase }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 44 44" width={size} height={size} fill="none">
        {/* antenna */}
        <path d="M22 7V3.5" stroke={s.body} strokeWidth="2" strokeLinecap="round" />
        <motion.circle
          cx="22" cy="2.6" r="2.2" fill={s.accent}
          /* an explicit start: mounting inside AnimatePresence, framer could read r
             before the attribute existed and logged "r: undefined" */
          initial={reduce ? undefined : { r: 2.2 }}
          animate={reduce ? { opacity: [1, 0.45, 1] } : { opacity: [1, 0.35, 1], r: [2.2, 2.7, 2.2] }}
          transition={{ duration: mood === 'working' ? 0.8 : 2.2, repeat: Infinity, ease: 'easeInOut', delay: phase }}
        />

        {/* body */}
        <rect x="5" y="7" width="34" height="28" rx="10" fill={s.body} />

        {/* visor */}
        <rect x="9.5" y="12" width="25" height="15" rx="7.5" fill={s.eye} opacity="0.1" />

        {/* eyes — blink by squashing, which reads better than opacity */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
          transition={{ duration: 4.4, repeat: Infinity, times: [0, 0.82, 0.86, 0.9, 1], delay: phase + 0.4 }}
          style={{ transformOrigin: '22px 19px' }}
        >
          <motion.g style={eyes ? { x: eyes.x, y: eyes.y } : undefined}>
            <circle cx="16.5" cy="19" r="2.9" fill={s.eye} />
            <circle cx="27.5" cy="19" r="2.9" fill={s.eye} />
          </motion.g>
        </motion.g>

        {/* mouth — only when pleased, so the default face stays neutral and calm */}
        {mood === 'happy' && (
          <path d="M18 26q4 3.4 8 0" stroke={s.eye} strokeWidth="1.8" strokeLinecap="round" />
        )}
        {mood === 'stuck' && (
          <path d="M18 27q4-3 8 0" stroke={s.eye} strokeWidth="1.8" strokeLinecap="round" />
        )}

        {/* feet */}
        <rect x="13" y="35" width="7" height="4.5" rx="2.2" fill={s.body} opacity="0.85" />
        <rect x="24" y="35" width="7" height="4.5" rx="2.2" fill={s.body} opacity="0.85" />
      </svg>

      {/* the thing it is carrying, held out in front */}
      {mood === 'carrying' && (
        <motion.span
          aria-hidden
          className="absolute"
          style={{
            left: '50%', bottom: -2, marginLeft: -size * 0.12,
            width: size * 0.24, height: size * 0.24,
            background: s.accent, borderRadius: 2,
          }}
          animate={reduce ? {} : { y: [0, -2, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: phase }}
        />
      )}
    </motion.span>
  )
}

/** a speech chip — an agent telling you what it just did */
export function Says({
  children, tone = 'ink', delay = 0, className = '',
}: {
  children: React.ReactNode
  tone?: 'ink' | 'lime' | 'bone'
  delay?: number
  className?: string
}) {
  const bg = tone === 'lime' ? '#0A0A0C' : tone === 'bone' ? '#111214' : '#F5F5F0'
  const fg = tone === 'lime' ? '#D5EB4B' : tone === 'bone' ? '#F5F5F0' : '#111214'
  return (
    <motion.span
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-block rounded-xl px-3 py-1.5 text-[12.5px] font-medium leading-snug ${className}`}
      style={{ background: bg, color: fg }}
    >
      {children}
    </motion.span>
  )
}
