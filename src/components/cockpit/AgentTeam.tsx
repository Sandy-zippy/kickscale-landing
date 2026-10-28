/**
 * The ten agents, as a team you can watch work.
 *
 * Two pieces:
 *   `AgentTeam`  — the roster. Each agent idles on its own phase so the row feels
 *                  alive rather than mechanical, and one at a time steps forward,
 *                  works, and says what it just did. Hovering pins your attention
 *                  to one, because a wall of ten moving things is noise.
 *   `ApproveFlow`— the safety model as an animation: an agent proposes, the work
 *                  waits, a human approves, and only then does it go out. This is
 *                  the single most important idea on the page and a paragraph does
 *                  not land it the way a loop does.
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Agent, Says, SKINS } from './Agent'
import JobScene from './JobScene'
import { LIME } from '../growth/kinetic'

type Roster = { n: string; d: string }[]

/* No lime here: these sit on lime tiles, and a lime robot on a lime tile is invisible
   (Brief and Follow-up were, until 2026-10-01). */
const SKIN_CYCLE = ['ink', 'violet', 'sky', 'bone', 'coral'] as const

export function AgentTeam({ roster }: { roster: Roster }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [pinned, setPinned] = useState<number | null>(null)

  /* one agent at a time takes the floor, unless the visitor is pointing at one */
  useEffect(() => {
    if (reduce || pinned !== null) return
    const t = setInterval(() => setActive(a => (a + 1) % roster.length), 2600)
    return () => clearInterval(t)
  }, [reduce, pinned, roster.length])

  const shown = pinned ?? active

  return (
    <div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[rgba(10,10,12,0.14)] max-sm:grid-cols-3 sm:grid-cols-3 lg:grid-cols-5">
        {roster.map((a, i) => {
          const on = i === shown
          return (
            <button
              key={a.n}
              type="button"
              onMouseEnter={() => setPinned(i)}
              onMouseLeave={() => setPinned(null)}
              onFocus={() => setPinned(i)}
              onBlur={() => setPinned(null)}
              className="group relative flex flex-col items-center gap-1 overflow-hidden bg-[#D5EB4B] px-2 pb-4 pt-3 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0C]"
              style={{ background: on ? '#C9E132' : '#D5EB4B' }}
              aria-pressed={on}
            >
              {/* each agent acting out its own job, inside its own tile */}
              <JobScene job={a.n} skin={SKIN_CYCLE[i % SKIN_CYCLE.length]} phase={(i % 5) * 0.37} />
              <span className="font-['Space_Grotesk'] text-[13px] font-bold leading-tight text-[#0A0A0C]">
                {a.n}
              </span>
            </button>
          )
        })}
      </div>

      {/* what the one in focus is doing */}
      <div className="mt-5 flex min-h-[3.25rem] items-start gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={shown}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="flex items-start gap-3"
          >
            <Agent skin={SKIN_CYCLE[shown % SKIN_CYCLE.length]} size={34} mood="happy" />
            <Says tone="lime">
              <strong className="font-bold">{roster[shown].n}:</strong> {roster[shown].d}
            </Says>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── */

const STEPS = [
  { k: 'read',    t: 'Reads the enquiry',      who: 'agent' },
  { k: 'draft',   t: 'Drafts a reply',          who: 'agent' },
  { k: 'wait',    t: 'Waits for you',           who: 'gate'  },
  { k: 'approve', t: 'You approve',             who: 'human' },
  { k: 'send',    t: 'Now it goes out',         who: 'agent' },
] as const

export function ApproveFlow() {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setStep(s => (s + 1) % (STEPS.length + 1)), 1500)
    return () => clearInterval(t)
  }, [reduce])

  const at = reduce ? STEPS.length - 1 : step

  return (
    <div className="rounded-2xl border border-[rgba(10,10,12,0.2)] p-6 max-sm:w-[84%] max-sm:shrink-0 max-sm:snap-start max-sm:p-5 sm:p-7">
      <h3 className="font-['Space_Grotesk'] text-[15px] font-bold uppercase tracking-wide text-[#0A0A0C]">
        They propose. You approve.
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-[rgba(10,10,12,0.7)]">
        Nothing an agent writes reaches a customer until a person says yes. That is not a
        setting you can turn off by accident. Anything client-facing queues for approval
        whatever its mode.
      </p>

      <ol className="mt-6 flex flex-wrap items-stretch gap-2">
        {STEPS.map((s, i) => {
          const done = i < at
          const now = i === at
          return (
            <li key={s.k} className="flex flex-1 basis-[8.5rem] items-center gap-2">
              <motion.div
                animate={{
                  opacity: done || now ? 1 : 0.32,
                  scale: now ? 1 : 0.985,
                }}
                transition={{ duration: 0.3 }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{
                  background: s.who === 'gate'
                    ? 'rgba(10,10,12,0.08)'
                    : now ? '#0A0A0C' : 'rgba(10,10,12,0.05)',
                  color: s.who !== 'gate' && now ? LIME : '#0A0A0C',
                }}
              >
                <span aria-hidden className="shrink-0">
                  {s.who === 'human' ? (
                    <span className="text-[16px]">✋</span>
                  ) : s.who === 'gate' ? (
                    <span className="text-[16px]">⏸</span>
                  ) : (
                    <Agent skin={now ? 'lime' : 'ink'} size={24} mood={now ? 'working' : 'idle'} />
                  )}
                </span>
                <span className="text-[12.5px] font-semibold leading-tight">{s.t}</span>
              </motion.div>
            </li>
          )
        })}
      </ol>

      <AnimatePresence>
        {at === 2 && !reduce && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-[13px] font-semibold text-[#0A0A0C]"
          >
            ⏸ Stopped here until a human looks at it.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * A quiet drifting field of agents, for section backgrounds.
 *
 * It used to return null under reduced motion, which is why the robots vanished on
 * phones set to reduce motion. Now they stay, standing still where they would have
 * drifted. On a phone they are bigger and a little stronger, because 26px at 10%
 * opacity on a 390px screen reads as nothing at all.
 */
export function AgentDrift({ count = 6, tone = 'ink' }: { count?: number; tone?: 'ink' | 'bone' }) {
  const reduce = useReducedMotion()
  const skins = tone === 'ink'
    ? (['ink', 'violet', 'sky'] as const)
    : (['bone', 'lime', 'coral'] as const)
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const top = 8 + ((i * 37) % 80)
        const dur = 26 + (i % 5) * 7
        return (
          <motion.div
            key={i}
            className="absolute origin-top-left scale-[1.4] opacity-[0.18] sm:scale-100 sm:opacity-[0.12]"
            style={{ top: `${top}%`, left: reduce ? `${8 + ((i * 29) % 80)}%` : '-6%' }}
            animate={reduce ? undefined : { x: ['0vw', '112vw'] }}
            transition={{ duration: dur, repeat: Infinity, ease: 'linear', delay: -(i * dur) / count }}
          >
            <Agent skin={skins[i % skins.length]} size={26 + (i % 3) * 8} phase={i * 0.3} />
          </motion.div>
        )
      })}
    </div>
  )
}

export { SKINS }
