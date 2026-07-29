/**
 * Hero artwork for /growth.
 *
 * The reference (helloupdigital.com) fills this space with planets in a
 * starfield. We use the thing that actually describes ZippyScale: real client
 * names as nodes on an orbit, each sitting at a stage of the growth engine,
 * wired together with faint signal lines and a pulse that travels the ring.
 *
 * Everything is SVG + CSS. No canvas, no image, no animation library — so it
 * costs nothing on first paint and dies cleanly under prefers-reduced-motion.
 */
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { LIME } from './kinetic'

/** six clients whose logos are already cleared for the roster */
const NODES = [
  { name: 'Swathi Veldandi', tag: 'Couture', a: -78 },
  { name: 'IYRA', tag: 'Education', a: -22 },
  { name: 'LUME', tag: 'Membership', a: 34 },
  { name: 'Business Mint', tag: 'PR & Media', a: 92 },
  { name: 'myWiz.ai', tag: 'Technology', a: 152 },
  { name: 'Sunrise Drivers', tag: 'Services', a: 212 },
]

/** ellipse the nodes ride, in the SVG's own 460×460 coordinate space */
const CX = 230
const CY = 230
const RX = 172
const RY = 148

function at(angleDeg: number) {
  const r = (angleDeg * Math.PI) / 180
  return { x: CX + RX * Math.cos(r), y: CY + RY * Math.sin(r) }
}

export default function OrbitField() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none relative mx-auto w-full max-w-[520px]"
      aria-hidden
    >
      <svg viewBox="0 0 460 460" className="h-auto w-full overflow-visible">
        <defs>
          <radialGradient id="zs-core" cx="50%" cy="50%">
            <stop offset="0%" stopColor={LIME} stopOpacity="0.55" />
            <stop offset="55%" stopColor={LIME} stopOpacity="0.10" />
            <stop offset="100%" stopColor={LIME} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="zs-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.30" />
            <stop offset="50%" stopColor={LIME} stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* glow at the centre — the engine itself */}
        <circle cx={CX} cy={CY} r={130} fill="url(#zs-core)" />

        {/* two orbits, the outer one carrying the nodes */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="url(#zs-ring)" strokeWidth="1.2" />
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX * 0.62}
          ry={RY * 0.62}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.10"
          strokeWidth="1"
          strokeDasharray="3 7"
        />

        {/* signal lines: every node reports back to the centre */}
        {NODES.map(n => {
          const p = at(n.a)
          return (
            <line
              key={`l-${n.name}`}
              x1={CX}
              y1={CY}
              x2={p.x}
              y2={p.y}
              stroke="#FFFFFF"
              strokeOpacity="0.09"
              strokeWidth="1"
            />
          )
        })}

        {/* the pulse travelling the orbit — one dashed stroke whose offset animates */}
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX}
          ry={RY}
          fill="none"
          stroke={LIME}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="6 1000"
          className="zs-orbit-pulse"
        />

        {/* centre mark */}
        <circle cx={CX} cy={CY} r={7} fill={LIME} />
        <circle cx={CX} cy={CY} r={15} fill="none" stroke={LIME} strokeOpacity="0.35" strokeWidth="1" />

        {/* nodes */}
        {NODES.map((n, i) => {
          const p = at(n.a)
          const right = p.x > CX
          return (
            <g key={n.name} className="zs-particle" style={nodeDrift(i)}>
              <circle cx={p.x} cy={p.y} r={13} fill="#0B0B12" stroke={LIME} strokeOpacity="0.5" strokeWidth="1" />
              <circle cx={p.x} cy={p.y} r={4} fill={LIME} />
              <text
                x={right ? p.x + 22 : p.x - 22}
                y={p.y + 1}
                textAnchor={right ? 'start' : 'end'}
                fontFamily="Space Grotesk, sans-serif"
                fontSize="13"
                fontWeight="700"
                fill="#FFFFFF"
                fillOpacity="0.86"
              >
                {n.name}
              </text>
              <text
                x={right ? p.x + 22 : p.x - 22}
                y={p.y + 16}
                textAnchor={right ? 'start' : 'end'}
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                letterSpacing="1.4"
                fill="#FFFFFF"
                fillOpacity="0.38"
              >
                {n.tag.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
    </motion.div>
  )
}

/** each node breathes on its own clock so the ring never pulses in unison */
function nodeDrift(i: number): CSSProperties {
  const durs = [5.4, 6.8, 4.9, 7.6, 5.9, 6.2]
  return {
    '--zs-dx': `${i % 2 ? 4 : -4}px`,
    '--zs-dy': `${-5 - (i % 3) * 3}px`,
    '--zs-lo': 0.72,
    '--zs-hi': 1,
    animationDuration: `${durs[i]}s, ${durs[i] * 0.7}s`,
    animationDelay: `-${i * 1.3}s, -${i * 0.8}s`,
  } as CSSProperties
}
