/**
 * Shared design-language primitives for /growth.
 *
 * Studied from helloupdigital.com with Playwright — real computed styles, not
 * eyeballed. What we took is the craft, not the concept:
 *   - three-register display type: solid / lime / outlined in one headline
 *   - warm bone light bands (#F5F5F0), near-black ink grounds, a full-bleed
 *     lime band as the loudest moment on the page
 *   - per-character headline landing, drifting particle fields
 *   - 24px card radius, 999px pills, mono eyebrows with a lime rule
 * Their neon #BFFF00 and their space metaphor stay theirs; our lime (#D5EB4B)
 * and our growth-engine story are the brand assets we keep.
 *
 * Replaces the previous linea.tsx (frost/glass) primitives.
 */
import { motion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

export const INK = '#050507'
export const INK_2 = '#0B0B12'
export const INK_3 = '#14141C'
export const BONE = '#F5F5F0'
export const LIME = '#D5EB4B'
export const LIME_DARK = '#B8CF2E'

/** the reference's two easing curves, reused verbatim */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const
export const EASE_STD = [0.4, 0, 0.2, 1] as const

export type Tone = 'ink' | 'bone' | 'lime'

/** `stroke` is the colour outlined display text is drawn in on this ground —
 *  it must be set explicitly, see the .zs-stroke note in globals.css. */
const TONE: Record<Tone, { bg: string; fg: string; sub: string; stroke: string }> = {
  ink: { bg: INK, fg: '#FAFAFA', sub: 'rgba(255,255,255,0.62)', stroke: '#FFFFFF' },
  bone: { bg: BONE, fg: '#111214', sub: '#4B5563', stroke: '#111214' },
  lime: { bg: LIME, fg: '#0A0A0C', sub: 'rgba(10,10,12,0.68)', stroke: '#0A0A0C' },
}

/* ─────────────────────────  Band  ───────────────────────── */

/**
 * Section wrapper. Owns the ink → bone → lime rhythm so no section has to
 * remember its own palette.
 */
export function Band({
  tone = 'ink',
  id,
  className = '',
  inner = 'max-w-6xl',
  children,
}: {
  tone?: Tone
  id?: string
  className?: string
  /** width class for the inner container; pass '' to opt out entirely (full-bleed) */
  inner?: string
  children: ReactNode
}) {
  const t = TONE[tone]
  return (
    <section
      id={id}
      className={`relative isolate overflow-hidden ${id ? 'scroll-mt-28' : ''} ${className}`}
      style={{ background: t.bg, color: t.fg, ['--zs-stroke-color' as string]: t.stroke }}
    >
      {inner ? <div className={`relative mx-auto w-full px-5 ${inner}`}>{children}</div> : children}
    </section>
  )
}

/* ─────────────────────────  Stroke  ───────────────────────── */

/**
 * Outlined display text. The CSS class guards `color: transparent` behind an
 * @supports check, so a browser without -webkit-text-stroke shows solid text
 * rather than nothing at all.
 */
export function Stroke({
  children,
  serif = false,
  className = '',
}: {
  children: ReactNode
  /** render in Fraunces italic — the serif counterpoint, used sparingly */
  serif?: boolean
  className?: string
}) {
  return (
    <span
      className={`zs-stroke ${className}`}
      style={serif ? { fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontWeight: 300 } : undefined}
    >
      {children}
    </span>
  )
}

/* ─────────────────────────  Split  ───────────────────────── */

let splitSeq = 0

/** the three registers a headline word can be set in — mixing them is the
 *  reference's signature move, and the reason Split takes segments not a string */
export type Register = 'solid' | 'lime' | 'stroke' | 'stroke-serif'

export interface Seg {
  text: string
  as?: Register
}

/** one line of a headline: either a plain string, or segments in mixed registers */
export type Line = string | Seg[]

function segStyle(reg: Register): CSSProperties | undefined {
  if (reg === 'lime') return { color: LIME }
  if (reg === 'stroke-serif')
    return { fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic', fontWeight: 300 }
  return undefined
}

/**
 * Headline whose characters land in sequence.
 *
 * Reduced motion is handled in CSS (`.zs-land > span { animation: none }`)
 * rather than here, so the markup is identical either way — no branch on
 * matchMedia, no hydration mismatch, and the text is always present for
 * screen readers and for crawlers.
 *
 * Because every character becomes its own inline-block span, the accessible
 * name would otherwise be read letter-by-letter — so the real text is exposed
 * once via aria-label and the split spans are hidden from the a11y tree.
 */
export function Split({
  lines,
  as: Tag = 'h2',
  className = '',
  charDelay = 32,
  lineDelay = 90,
}: {
  lines: Line[]
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  charDelay?: number
  lineDelay?: number
}) {
  // running character index across the whole headline, so the stagger keeps
  // travelling instead of restarting on every line
  let i = 0
  const uid = `split-${splitSeq++}`

  const plain = lines
    .map(l => (typeof l === 'string' ? l : l.map(s => s.text).join('')))
    .join(' ')

  return (
    <Tag className={className} aria-label={plain}>
      {lines.map((line, li) => {
        const segments: Seg[] = typeof line === 'string' ? [{ text: line }] : line
        return (
        <span key={`${uid}-l${li}`} aria-hidden className="block">
          {segments.map((seg, si) => {
            const reg = seg.as ?? 'solid'
            const text = seg.text
            return (
              <span
                key={`${uid}-l${li}s${si}`}
                className={reg === 'stroke' || reg === 'stroke-serif' ? 'zs-land zs-stroke' : 'zs-land'}
                style={segStyle(reg)}
              >
                {/* Characters are inline-block so they can be transformed, which
                    means the browser would happily break a line mid-word. Words
                    are therefore wrapped in their own inline-block, and the
                    separating spaces left as ordinary breakable text. */}
                {text.split(/(\s+)/).map((chunk, wi) => {
                  if (chunk === '') return null
                  // a bare text node, NOT a span: .zs-land children are
                  // inline-block, and an inline-block holding only a space
                  // collapses to zero width, welding the words together
                  if (/^\s+$/.test(chunk)) return ' '
                  return (
                    <span key={`${uid}-l${li}s${si}w${wi}`} className="inline-block whitespace-nowrap">
                      {Array.from(chunk).map((ch, ci) => (
                        <span
                          key={`${uid}-l${li}s${si}w${wi}c${ci}`}
                          className="zs-ch"
                          // inline delay beats the stylesheet's --zs-i calc, which
                          // keeps charDelay/lineDelay configurable per headline
                          style={{ animationDelay: `${i++ * charDelay + li * lineDelay}ms` }}
                        >
                          {ch}
                        </span>
                      ))}
                    </span>
                  )
                })}
              </span>
            )
          })}
        </span>
        )
      })}
    </Tag>
  )
}

/** the display type scale used across the page */
export const DISPLAY =
  "font-['Space_Grotesk'] font-bold uppercase leading-[0.88] tracking-[-0.03em] " +
  'text-[2.6rem] sm:text-[4rem] lg:text-[5rem]'

export const DISPLAY_SM =
  "font-['Space_Grotesk'] font-bold uppercase leading-[0.9] tracking-[-0.03em] " +
  'text-[2rem] sm:text-[2.9rem] lg:text-[3.4rem]'

/* ─────────────────────────  Kicker  ───────────────────────── */

/** mono section label: a short lime rule then wide-tracked uppercase */
export function Kicker({
  children,
  tone = 'ink',
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  const fg = tone === 'lime' ? 'rgba(10,10,12,0.72)' : tone === 'bone' ? '#6B7280' : 'rgba(255,255,255,0.55)'
  const rule = tone === 'lime' ? 'rgba(10,10,12,0.5)' : LIME
  return (
    <motion.p
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className={`flex items-center gap-3 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.2em] ${className}`}
      style={{ color: fg }}
    >
      <span aria-hidden className="inline-block h-px w-8 shrink-0" style={{ background: rule }} />
      {children}
    </motion.p>
  )
}

/* ─────────────────────────  Pill  ───────────────────────── */

export function Pill({
  href,
  children,
  variant = 'lime',
  className = '',
  onClick,
  type,
  disabled = false,
}: {
  href?: string
  children: ReactNode
  variant?: 'lime' | 'ghost' | 'ink'
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  // Colours go through inline style, not interpolated Tailwind classes —
  // Tailwind only generates arbitrary values it can see as literal strings in
  // the source, so `bg-[${LIME}]` would silently produce no CSS.
  const base =
    "group/pill inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full px-8 py-4 " +
    "font-['Space_Grotesk'] text-sm font-bold uppercase tracking-[0.06em] transition-all duration-[250ms] " +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const skin =
    variant === 'lime'
      ? 'hover:brightness-110 focus-visible:ring-[#D5EB4B]'
      : variant === 'ink'
        ? 'hover:brightness-125 focus-visible:ring-[#0A0A0C]'
        : 'border border-white/25 backdrop-blur-sm hover:border-white/50 focus-visible:ring-white'

  const skinStyle: CSSProperties =
    variant === 'lime'
      ? { background: LIME, color: '#0A0A0C', boxShadow: '0 0 44px -10px rgba(213,235,75,0.75)' }
      : variant === 'ink'
        ? { background: '#0A0A0C', color: '#FFFFFF' }
        : { background: 'rgba(255,255,255,0.04)', color: '#FFFFFF' }

  const inner = (
    <>
      {children}
      <span aria-hidden className="transition-transform duration-[250ms] group-hover/pill:translate-x-1">
        →
      </span>
    </>
  )

  if (href) {
    return (
      <a href={href} style={skinStyle} className={`${base} ${skin} ${className}`}>
        {inner}
      </a>
    )
  }
  return (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      style={skinStyle}
      className={`${base} ${skin} ${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {inner}
    </button>
  )
}

/* ─────────────────────────  SignalField  ───────────────────────── */

/**
 * Drifting particle + faint grid backdrop for ink sections — our answer to the
 * reference's starfield, without borrowing the space metaphor.
 *
 * Positions are derived from a fixed integer hash rather than Math.random so
 * the field is stable across renders (and identical between server and client
 * if this page is ever prerendered).
 */
function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function SignalField({
  count = 46,
  grid = true,
  className = '',
}: {
  count?: number
  grid?: boolean
  className?: string
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      {grid && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px),' +
              'linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse 78% 66% at 50% 42%, #000 20%, transparent 76%)',
            WebkitMaskImage: 'radial-gradient(ellipse 78% 66% at 50% 42%, #000 20%, transparent 76%)',
          }}
        />
      )}
      {Array.from({ length: count }, (_, i) => {
        const left = hash(i + 1) * 100
        const top = hash(i + 101) * 100
        const size = 1 + Math.round(hash(i + 201) * 2)
        const lime = hash(i + 301) > 0.82
        return (
          <span
            key={i}
            className="zs-particle absolute rounded-full"
            style={
              {
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                background: lime ? LIME : '#FFFFFF',
                '--zs-dx': `${(hash(i + 401) - 0.5) * 26}px`,
                '--zs-dy': `${-6 - hash(i + 501) * 22}px`,
                '--zs-lo': lime ? 0.2 : 0.08,
                '--zs-hi': lime ? 0.85 : 0.45,
                animationDuration: `${9 + hash(i + 601) * 13}s, ${2.2 + hash(i + 701) * 2.6}s`,
                animationDelay: `-${hash(i + 801) * 9}s, -${hash(i + 901) * 4}s`,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

/* ─────────────────────────  Reveal  ───────────────────────── */

/** standard scroll-into-view entrance, so every section shares one cadence */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className = '',
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
