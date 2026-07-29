/**
 * Hero artwork for /growth — the full service circle.
 *
 * The reference (helloupdigital.com) fills this space with planets in a
 * starfield. We use the thing that actually describes ZippyScale: the eight
 * stages of the engagement, laid out as a closed loop, because the last stage
 * (reviews and referrals) feeds the first (leads). A ring is the honest shape
 * for that — a funnel would imply it ends at the sale.
 *
 * Everything is SVG + CSS. No canvas, no image, no animation library — so it
 * costs nothing on first paint and dies cleanly under prefers-reduced-motion.
 */
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { LIME } from './kinetic'

/** clockwise from the top; `a` is the angle on the ring in degrees */
const STAGES = [
  { a: -90, name: 'Ads & outreach', sub: 'Consolidated in CRM' },
  { a: -45, name: 'Qualification', sub: 'Scored & routed' },
  { a: 0, name: 'Closing', sub: 'Hands-on support' },
  { a: 45, name: 'Sales training', sub: 'Your team' },
  { a: 90, name: 'Objection handling', sub: 'Scripts that work' },
  { a: 135, name: 'Upsell & cross-sell', sub: 'More per client' },
  { a: 180, name: 'Retention', sub: 'Built to repeat' },
  { a: -135, name: 'Reviews & referrals', sub: 'The loop closes' },
]

/* The ring, in the SVG's own coordinate space. The viewBox is sized to the
   ink the artwork actually uses — left labels need ~145px, right ~115px, and
   the top/bottom labels ~50px — so no scale is wasted on empty margin. */
const CX = 296
const CY = 208
const R = 150
const PERIMETER = 2 * Math.PI * R

function at(angleDeg: number) {
  const r = (angleDeg * Math.PI) / 180
  return { x: CX + R * Math.cos(r), y: CY + R * Math.sin(r) }
}

/** where a stage's label sits relative to its node */
function place(a: number) {
  if (a === -90) return { anchor: 'middle' as const, dx: 0, dy: -34 }
  if (a === 90) return { anchor: 'middle' as const, dx: 0, dy: 30 }
  const right = Math.cos((a * Math.PI) / 180) > 0.01
  return { anchor: right ? ('start' as const) : ('end' as const), dx: right ? 22 : -22, dy: -2 }
}

export default function OrbitField() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none relative mx-auto w-full max-w-[600px]"
      role="img"
      aria-label={
        'The ZippyScale service circle, a closed loop: ' +
        STAGES.map(s => s.name).join(', ') +
        ' — and referrals feed the next round of leads.'
      }
    >
      <svg viewBox="0 0 600 430" className="h-auto w-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id="zs-core" cx="50%" cy="50%">
            <stop offset="0%" stopColor={LIME} stopOpacity="0.5" />
            <stop offset="55%" stopColor={LIME} stopOpacity="0.09" />
            <stop offset="100%" stopColor={LIME} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="zs-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="50%" stopColor={LIME} stopOpacity="0.42" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* glow at the hub */}
        <circle cx={CX} cy={CY} r={132} fill="url(#zs-core)" />

        {/* the ring itself */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#zs-ring)" strokeWidth="1.2" />
        <circle
          cx={CX}
          cy={CY}
          r={R * 0.6}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.09"
          strokeWidth="1"
          strokeDasharray="3 7"
        />

        {/* spokes: every stage reports into the same hub */}
        {STAGES.map(s => {
          const p = at(s.a)
          return (
            <line
              key={`spoke-${s.a}`}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke="#FFFFFF"
              strokeOpacity="0.07"
              strokeWidth="1"
            />
          )
        })}

        {/* the pulse travelling the loop — one short dash on a ring-length gap,
            so exactly one lit segment goes round. Length is passed to CSS so the
            keyframe can never drift out of sync with R. */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={LIME}
          strokeWidth="2.4"
          strokeLinecap="round"
          className="zs-orbit-pulse"
          style={
            {
              strokeDasharray: `7 ${PERIMETER - 7}`,
              '--zs-orbit-len': `${PERIMETER}px`,
            } as CSSProperties
          }
        />

        {/* hub */}
        <circle cx={CX} cy={CY} r={6} fill={LIME} />
        <circle cx={CX} cy={CY} r={14} fill="none" stroke={LIME} strokeOpacity="0.32" strokeWidth="1" />

        {/* stages */}
        {STAGES.map((s, i) => {
          const p = at(s.a)
          const l = place(s.a)
          return (
            <g key={s.name} className="zs-particle" style={drift(i)}>
              <circle cx={p.x} cy={p.y} r={12} fill="#0B0B12" stroke={LIME} strokeOpacity="0.45" strokeWidth="1" />
              <text
                x={p.x}
                y={p.y + 3.4}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fontWeight="700"
                fill={LIME}
              >
                {String(i + 1).padStart(2, '0')}
              </text>

              <text
                x={p.x + l.dx}
                y={p.y + l.dy}
                textAnchor={l.anchor}
                fontFamily="Space Grotesk, sans-serif"
                fontSize="13"
                fontWeight="700"
                fill="#FFFFFF"
                fillOpacity="0.88"
              >
                {s.name}
              </text>
              <text
                x={p.x + l.dx}
                y={p.y + l.dy + 14}
                textAnchor={l.anchor}
                fontFamily="JetBrains Mono, monospace"
                fontSize="8.5"
                letterSpacing="1.2"
                fill="#FFFFFF"
                fillOpacity="0.34"
              >
                {s.sub.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
    </motion.div>
  )
}

/** each node breathes on its own clock so the ring never pulses in unison.
 *  Amplitude is deliberately small — eight labels sit close together and a
 *  bigger drift would let neighbours collide. */
function drift(i: number): CSSProperties {
  const durs = [5.4, 6.8, 4.9, 7.6, 5.9, 6.2, 7.1, 5.1]
  return {
    '--zs-dx': `${i % 2 ? 2.5 : -2.5}px`,
    '--zs-dy': `${-3 - (i % 3) * 1.5}px`,
    '--zs-lo': 0.78,
    '--zs-hi': 1,
    animationDuration: `${durs[i]}s, ${durs[i] * 0.7}s`,
    animationDelay: `-${i * 1.1}s, -${i * 0.7}s`,
  } as CSSProperties
}
