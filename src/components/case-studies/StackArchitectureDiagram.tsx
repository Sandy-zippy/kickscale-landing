import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef } from 'react'

interface Node {
  id: string
  label: string
  sublabel?: string
  x: number      // 0-100 percentage
  y: number      // 0-100 percentage
  variant?: 'source' | 'middle' | 'sink' | 'human'
}

interface Edge {
  from: string
  to: string
  delay?: number   // animation delay multiplier 0-1
}

interface Props {
  nodes: Node[]
  edges: Edge[]
  ariaLabel: string
}

const variantColors: Record<NonNullable<Node['variant']>, { bg: string; border: string; text: string }> = {
  source: { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },        // red — chaos source
  middle: { bg: '#1A1A2E', border: '#1A1A2E', text: '#D5EB4B' },        // charcoal — automation layer
  sink: { bg: '#DCFCE7', border: '#22C55E', text: '#166534' },          // green — clean outcome
  human: { bg: '#FFFDF7', border: '#D5EB4B', text: '#1A1A2E' },         // cream/lime — human in loop
}

export default function StackArchitectureDiagram({ nodes, edges, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.15, once: true })
  const reduce = useReducedMotion()
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return (
    <div
      ref={ref}
      className="relative w-full bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-10 overflow-hidden"
      style={{ aspectRatio: '16/10' }}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #E5E7EB 1px, transparent 1px), linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      {/* SVG layer for edges + traveling packets */}
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
        {edges.map((edge, i) => {
          const from = nodeMap.get(edge.from)
          const to = nodeMap.get(edge.to)
          if (!from || !to) return null
          const x1 = from.x
          const y1 = from.y
          const x2 = to.x
          const y2 = to.y
          const delay = edge.delay ?? i * 0.15

          return (
            <g key={`${edge.from}-${edge.to}-${i}`}>
              {/* Static dashed edge — always visible so the architecture reads as a graph even before animations finish */}
              <line
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                opacity="0.7"
              />
              {/* Traveling packet (dot) */}
              {!reduce && inView && (
                <motion.circle
                  r="5"
                  fill="#D5EB4B"
                  filter="drop-shadow(0 0 4px rgba(213,235,75,0.8))"
                  initial={{ cx: `${x1}%`, cy: `${y1}%`, opacity: 0 }}
                  animate={{
                    cx: [`${x1}%`, `${x2}%`],
                    cy: [`${y1}%`, `${y2}%`],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 1.6,
                    delay: delay + 0.4,
                    repeat: Infinity,
                    repeatDelay: 2.5,
                    ease: 'easeInOut',
                    times: [0, 0.1, 0.9, 1],
                  }}
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((n, i) => {
        const colors = variantColors[n.variant ?? 'middle']
        return (
          <motion.div
            key={n.id}
            initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={reduce ? { duration: 0 } : { duration: 0.35, delay: Math.min(i * 0.05, 0.3), ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-2 rounded-lg text-center shadow-md"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              background: colors.bg,
              border: `2px solid ${colors.border}`,
              color: colors.text,
              minWidth: '90px',
              maxWidth: '160px',
            }}
          >
            <div className="font-bold text-xs leading-tight">{n.label}</div>
            {n.sublabel && (
              <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{n.sublabel}</div>
            )}
          </motion.div>
        )
      })}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[#6B7280]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border-2 border-red-600 bg-red-100" aria-hidden="true" />
          chaos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border-2 border-[#1A1A2E] bg-[#1A1A2E]" aria-hidden="true" />
          automation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border-2 border-[#D5EB4B] bg-[#FFFDF7]" aria-hidden="true" />
          human
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border-2 border-[#22C55E] bg-green-100" aria-hidden="true" />
          outcome
        </span>
      </div>
    </div>
  )
}
