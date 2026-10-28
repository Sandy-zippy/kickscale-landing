/**
 * Page-wide agent ambience.
 *
 * Kept apart from AgentTeam.tsx on purpose: this is mounted in App.tsx, so anything
 * it imports lands in the main bundle. It needs the character and nothing else.
 */
import { motion, useReducedMotion } from 'framer-motion'
import { Agent } from './Agent'

/**
 * A handful of agents drifting across the whole viewport.
 *
 * `AgentDrift` in AgentTeam.tsx is section-scoped — it needs a `relative` parent and
 * stops at that section's edges. This one is fixed, so one line in App.tsx gives every
 * route the same quiet sense that something is working in the background, which is the
 * product's whole claim.
 *
 * It sits at z-5: above section backgrounds, below the nav and any dialog. Opacity is
 * low enough that it never competes with text — if you notice it while reading, it is
 * too strong. Mid-tone skins are deliberate: they read on both the ink and bone bands
 * without needing to know which section they happen to be over.
 */
export function AgentAmbience({ count = 7 }: { count?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  const skins = ['lime', 'violet', 'sky', 'coral'] as const
  return (
    <div aria-hidden className="float-aside pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const top = 6 + ((i * 41) % 84)
        const dur = 34 + (i % 4) * 11
        const right = i % 2 === 1
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: `${top}%`, left: right ? undefined : '-8%', right: right ? '-8%' : undefined, opacity: 0.085 }}
            animate={{ x: right ? ['0vw', '-116vw'] : ['0vw', '116vw'] }}
            transition={{ duration: dur, repeat: Infinity, ease: 'linear', delay: -(i * dur) / count }}
          >
            <Agent skin={skins[i % skins.length]} size={24 + (i % 3) * 10} phase={i * 0.27} />
          </motion.div>
        )
      })}
    </div>
  )
}
