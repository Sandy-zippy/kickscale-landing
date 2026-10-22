/**
 * The two scenes that carry the argument.
 *
 * `TangleScene`  — five disconnected apps, and one exhausted human walking the same
 *                  record between them by hand. One parcel gets dropped every lap,
 *                  which is the whole pitch in one image.
 * `CockpitScene` — the same five sources feeding one record, with agents orbiting it.
 *
 * Both are pure SVG + framer-motion, sized by viewBox so they scale without a
 * media query, and both stop entirely under prefers-reduced-motion — the static
 * frame still reads correctly, which is the test for whether the motion was
 * decoration or meaning.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { LIME } from '../growth/kinetic'
import { Agent } from './Agent'

const APPS = [
  { n: 'Tally',    x: 60,  y: 52 },
  { n: 'Excel',    x: 250, y: 34 },
  { n: 'WhatsApp', x: 430, y: 62 },
  { n: 'POS',      x: 168, y: 176 },
  { n: 'CRM',      x: 380, y: 192 },
]

/** ink = the scene sits on a dark band, bone = on a light one */
type Tone = 'ink' | 'bone'

const INK_ON = {
  fill: 'rgba(255,255,255,0.07)', fillDim: 'rgba(255,255,255,0.05)',
  stroke: 'rgba(255,255,255,0.14)', text: 'rgba(255,255,255,0.78)',
  hair: 'rgba(255,255,255,0.16)', caption: 'rgba(255,255,255,0.4)',
}
const BONE_ON = {
  fill: 'rgba(10,10,12,0.05)', fillDim: 'rgba(10,10,12,0.035)',
  stroke: 'rgba(10,10,12,0.16)', text: 'rgba(10,10,12,0.78)',
  hair: 'rgba(10,10,12,0.18)', caption: 'rgba(10,10,12,0.45)',
}
const palette = (t: Tone) => (t === 'bone' ? BONE_ON : INK_ON)

function AppNode({ n, x, y, dim = false, delay = 0, tone = 'ink' }: {
  n: string; x: number; y: number; dim?: boolean; delay?: number; tone?: Tone
}) {
  const c = palette(tone)
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <rect
        x={x} y={y} width="104" height="42" rx="10"
        fill={dim ? c.fillDim : c.fill}
        stroke={c.stroke}
      />
      <text
        x={x + 52} y={y + 26} textAnchor="middle"
        fontSize="19" fontWeight="600" fill={c.text}
        fontFamily="'Space Grotesk', system-ui, sans-serif"
      >
        {n}
      </text>
    </motion.g>
  )
}

/** the "before": nothing is joined, so a person is the integration */
export function TangleScene({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()

  /* the walker's circuit, through all five apps and back */
  const route = 'M112,94 L302,76 L482,104 L220,218 L432,234 Z'

  return (
    <svg viewBox="0 0 560 270" className={className} role="img"
         aria-label="Five business apps that are not connected, with a person carrying data between them by hand">
      {/* the hand-drawn, going-nowhere connections */}
      {[
        'M112,73 C180,20 220,120 250,55',
        'M354,55 C400,10 420,110 430,83',
        'M112,94 C120,170 160,150 168,197',
        'M272,76 C300,190 340,150 380,213',
        'M482,104 C500,200 440,190 432,213',
      ].map((d, i) => (
        <motion.path
          key={d} d={d} fill="none"
          stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" strokeDasharray="5 6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, delay: 0.3 + i * 0.09, ease: 'easeOut' }}
        />
      ))}

      {APPS.map((a, i) => <AppNode key={a.n} {...a} delay={i * 0.08} />)}

      {/* the walker: a person doing the integration with their legs */}
      {!reduce && (
        <>
          <motion.g
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            style={{ offsetPath: `path("${route}")`, offsetRotate: '0deg' } as React.CSSProperties}
          >
            <foreignObject x="-22" y="-24" width="44" height="48">
              <Agent skin="bone" size={40} mood="carrying" />
            </foreignObject>
          </motion.g>

          {/* a parcel dropped on every circuit — the record that never made it */}
          <motion.rect
            width="9" height="9" rx="2" fill={LIME}
            animate={{
              x: [300, 300, 300], y: [150, 205, 205],
              opacity: [0, 1, 1, 0], rotate: [0, 40, 40],
            }}
            transition={{ duration: 16, repeat: Infinity, times: [0.42, 0.52, 0.9, 1], ease: 'easeIn' }}
          />
        </>
      )}

      {/* The still frame has to make the same point the loop does: somebody is walking
          this data around by hand, and dropping some of it. */}
      {reduce && (
        <>
          <foreignObject x="248" y="96" width="44" height="48">
            <Agent skin="bone" size={40} mood="carrying" />
          </foreignObject>
          <rect x="296" y="200" width="9" height="9" rx="2" fill={LIME} transform="rotate(40 300 204)" />
        </>
      )}

      <text x="280" y="262" textAnchor="middle" fontSize="16"
            fill={palette('ink').caption} fontFamily="'JetBrains Mono', monospace"
            letterSpacing="0.1em">
        THE INTEGRATION IS A PERSON
      </text>
    </svg>
  )
}

/** the "after": one record in the middle, everything feeding it, agents tending it */
export function CockpitScene({ className = '', tone = 'ink' }: {
  className?: string; tone?: Tone
}) {
  const reduce = useReducedMotion()
  const cx = 280, cy = 128
  /* Lime on bone is too pale to read as a line, so the light version draws the feeds
     in ink and keeps lime for the record in the middle, where it still has a dark
     label sitting on it. */
  const feedStroke = tone === 'bone' ? '#0A0A0C' : LIME
  const dotFill = tone === 'bone' ? '#0A0A0C' : LIME

  const feeds = [
    { n: 'Website',  x: 40,  y: 30 },
    { n: 'WhatsApp', x: 40,  y: 196 },
    { n: 'Walk-in',  x: 416, y: 30 },
    { n: 'Instagram',x: 416, y: 196 },
  ]

  return (
    <svg viewBox="0 0 560 270" className={className} role="img"
         aria-label="Four channels feeding one customer record, with agents working around it">
      {/* feeds into the middle */}
      {feeds.map((f, i) => {
        const sx = f.x < cx ? f.x + 104 : f.x
        const sy = f.y + 21
        return (
          <motion.path
            key={f.n}
            d={`M${sx},${sy} Q${(sx + cx) / 2},${(sy + cy) / 2} ${cx + (f.x < cx ? -80 : 80)},${cy}`}
            fill="none" stroke={feedStroke} strokeWidth="1.4" strokeOpacity={tone === 'bone' ? 0.3 : 0.4}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.25 + i * 0.1, ease: 'easeOut' }}
          />
        )
      })}

      {/* travelling data, so the feed reads as live rather than drawn. Under reduced
          motion the dots sit still on the paths instead of vanishing. */}
      {feeds.map((f, i) => {
        const sx = f.x < cx ? f.x + 104 : f.x
        const sy = f.y + 21
        const d = `M${sx},${sy} Q${(sx + cx) / 2},${(sy + cy) / 2} ${cx + (f.x < cx ? -80 : 80)},${cy}`
        return (
          <motion.circle
            key={`p-${f.n}`} r="3.2" fill={dotFill}
            animate={reduce
              ? { offsetDistance: '55%', opacity: 0.85 }
              : { offsetDistance: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
            transition={reduce
              ? { duration: 0 }
              : { duration: 2.6, repeat: Infinity, delay: i * 0.65, ease: 'easeInOut' }}
            style={{ offsetPath: `path("${d}")` } as React.CSSProperties}
          />
        )
      })}

      {feeds.map((f, i) => <AppNode key={f.n} {...f} dim delay={i * 0.08} tone={tone} />)}

      {/* the one record */}
      <motion.g
        initial={{ scale: 0.86, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {!reduce && (
          <motion.circle
            cx={cx} cy={cy} r="74" fill="none" stroke={feedStroke} strokeOpacity={tone === 'bone' ? 0.22 : 0.28}
            animate={{ r: [70, 86, 70], strokeOpacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <rect x={cx - 78} y={cy - 36} width="156" height="72" rx="18"
              fill={LIME} stroke={tone === 'bone' ? 'rgba(10,10,12,0.18)' : 'none'} />
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="19" fontWeight="700"
              fill="#0A0A0C" fontFamily="'Space Grotesk', system-ui, sans-serif">
          ONE RECORD
        </text>
        <text x={cx} y={cy + 17} textAnchor="middle" fontSize="14"
              fill="rgba(10,10,12,0.62)" fontFamily="'JetBrains Mono', monospace">
          one shared truth
        </text>
      </motion.g>

      {/* agents orbiting, doing the tending */}
      {!reduce && [0, 1, 2].map(i => (
        <motion.g
          key={i}
          animate={{ rotate: 360 }}
          transition={{ duration: 22 + i * 5, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <foreignObject
            x={cx - 16 + Math.cos((i * 2 * Math.PI) / 3) * 108}
            y={cy - 16 + Math.sin((i * 2 * Math.PI) / 3) * 64}
            width="34" height="38"
          >
            <Agent skin={(['ink', 'violet', 'sky'] as const)[i]} size={32} mood="working" phase={i * 0.4} />
          </foreignObject>
        </motion.g>
      ))}
    </svg>
  )
}
