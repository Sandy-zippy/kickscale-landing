/**
 * Each agent, doing its job, inside its own tile.
 *
 * A row of robots that only blink says "ten mascots". A row where the Curator is
 * shuffling options and Compliance is ticking a checklist says "ten workers", which
 * is the point of the section. Every scene is a short loop of a few small shapes
 * beside the agent, kept inside the tile.
 *
 * Every shape's resting style IS the finished frame, and the loop only animates away
 * from it. So under reduced motion (no `animate`) each tile still shows the job done:
 * a ticked checklist, a ranked list, a sent message.
 */
import { motion, type TargetAndTransition, type Transition } from 'framer-motion'
import type { ReactNode } from 'react'
import { Agent, type AgentMood } from './Agent'
import { useCalmMotion } from './useCalmMotion'

const INK = '#0A0A0C'
const PAPER = '#FFFFFF'
const RED = '#E5484D'
const D = 4.2 // one loop, seconds

type Loop = (kf: TargetAndTransition, times?: number[], extra?: Transition) => {
  animate?: TargetAndTransition; transition?: Transition
}

/* the props sit in a 120x64 box centred on the tile; the agent is at its middle */
function Stage({ children }: { children: ReactNode }) {
  return <div aria-hidden className="pointer-events-none absolute inset-0">{children}</div>
}
const at = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ position: 'absolute', left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, ...extra })

const line = (w: number, bg = INK, h = 3): React.CSSProperties =>
  ({ width: w, height: h, borderRadius: 2, background: bg, transformOrigin: 'left center' })

function scene(job: string, L: Loop): { mood: AgentMood; props: ReactNode } {
  switch (job) {
    /* turns a message into a requirement, then asks what is missing */
    case 'Brief':
      return {
        mood: 'happy',
        props: (
          <Stage>
            <div style={at(26, -20, { width: 40, padding: '6px 6px', background: PAPER, borderRadius: 6, display: 'grid', gap: 4 })}>
              {[28, 22, 16].map((w, i) => (
                <motion.span key={w} style={line(w)} {...L({ scaleX: [0, 0, 1, 1, 0] }, [0, 0.1 + i * 0.12, 0.22 + i * 0.12, 0.9, 1])} />
              ))}
            </div>
            <motion.span
              style={at(56, -34, { fontWeight: 800, fontSize: 15, color: INK })}
              {...L({ scale: [0, 0, 1.3, 1, 1, 0], opacity: [0, 0, 1, 1, 1, 0] }, [0, 0.55, 0.62, 0.68, 0.9, 1])}
            >?</motion.span>
          </Stage>
        ),
      }

    /* ranks options on fit, margin, stock and lead time */
    case 'Curator':
      return {
        mood: 'working',
        props: (
          <Stage>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                style={at(28, -22 + i * 13, { width: 34, height: 10, borderRadius: 3, background: i === 0 ? INK : PAPER, display: 'flex', alignItems: 'center', paddingLeft: 3 })}
                {...L({ y: [[0, 26, 13, 0], [0, -13, 13, 0], [0, -13, -26, 0]][i] }, [0, 0.3, 0.6, 1], { ease: 'easeInOut' })}
              >
                <span style={line(i === 0 ? 14 : 18, i === 0 ? '#D5EB4B' : 'rgba(10,10,12,0.35)', 2)} />
              </motion.div>
            ))}
            <motion.span style={at(64, -26, { fontSize: 12, color: INK })} {...L({ rotate: [0, 0, 20, 0], scale: [1, 1, 1.4, 1] }, [0, 0.82, 0.9, 1])}>★</motion.span>
          </Stage>
        ),
      }

    /* builds the quote: lines, then the total */
    case 'Proposal':
      return {
        mood: 'working',
        props: (
          <Stage>
            <motion.div
              style={at(26, -26, { width: 36, height: 46, background: PAPER, borderRadius: 4, padding: 5, display: 'grid', gap: 4, alignContent: 'start', boxShadow: '0 4px 10px -4px rgba(10,10,12,0.35)' })}
              {...L({ y: [0, 0, 0, -3, 0] }, [0, 0.7, 0.8, 0.88, 1])}
            >
              {[24, 18, 22].map((w, i) => (
                <motion.span key={i} style={line(w, 'rgba(10,10,12,0.4)', 2.5)} {...L({ scaleX: [0, 0, 1, 1] }, [0, 0.08 + i * 0.12, 0.2 + i * 0.12, 1])} />
              ))}
              <motion.span
                style={{ marginTop: 2, fontSize: 9, fontWeight: 800, color: INK, lineHeight: 1 }}
                {...L({ opacity: [0, 0, 1, 1], scale: [0.6, 0.6, 1.2, 1] }, [0, 0.55, 0.65, 1])}
              >₹ total</motion.span>
            </motion.div>
          </Stage>
        ),
      }

    /* checks the rules before anything goes out */
    case 'Compliance':
      return {
        mood: 'idle',
        props: (
          <Stage>
            {[0, 1, 2].map(i => (
              <div key={i} style={at(28, -22 + i * 13, { display: 'flex', alignItems: 'center', gap: 4 })}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: PAPER, display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 900, color: INK }}>
                  <motion.span {...L({ scale: [0, 0, 1.3, 1, 1] }, [0, 0.12 + i * 0.16, 0.2 + i * 0.16, 0.26 + i * 0.16, 1])}>✓</motion.span>
                </span>
                <span style={line(20, 'rgba(10,10,12,0.35)', 2)} />
              </div>
            ))}
            <motion.span
              style={at(-62, -6, { fontSize: 8, fontWeight: 900, letterSpacing: '0.08em', color: INK, border: `1.5px solid ${INK}`, borderRadius: 4, padding: '1px 3px', rotate: '-12deg' })}
              {...L({ opacity: [0, 0, 1, 1, 0], scale: [2, 2, 1, 1, 1] }, [0, 0.62, 0.7, 0.92, 1])}
            >PASS</motion.span>
          </Stage>
        ),
      }

    /* compares vendor bids and recommends a winner */
    case 'Sourcing':
      return {
        mood: 'working',
        props: (
          <Stage>
            {[22, 34, 16].map((h, i) => (
              <motion.span
                key={i}
                style={at(26 + i * 11, 16 - h, { width: 8, height: h, borderRadius: 2, background: i === 2 ? INK : PAPER, transformOrigin: 'bottom' })}
                {...L({ scaleY: [0, 0, 1, 1, 0] }, [0, 0.05 + i * 0.12, 0.25 + i * 0.12, 0.92, 1])}
              />
            ))}
            {/* the lowest bid wins: a tick badge lands on top of it */}
            <motion.span
              style={at(45, -18, { width: 14, height: 14, borderRadius: 7, background: INK, color: '#D5EB4B', fontSize: 9, fontWeight: 900, display: 'grid', placeItems: 'center' })}
              {...L({ opacity: [0, 0, 1, 1, 0], y: [6, 6, 0, 0, 0], scale: [0.5, 0.5, 1.2, 1, 1] }, [0, 0.6, 0.7, 0.92, 1])}
            >✓</motion.span>
          </Stage>
        ),
      }

    /* reads a messy price list, lines the columns up, drops the duplicate */
    case 'Intake':
      return {
        mood: 'working',
        props: (
          <Stage>
            {[[0, 0], [16, 0], [0, 9], [16, 9], [0, 18], [16, 18]].map(([x, y], i) => {
              const sx = [8, -6, 10, -9, 5, -4][i], sy = [-6, 7, -3, 5, -8, 3][i]
              return (
                <motion.span
                  key={i}
                  style={at(-66 + x, -14 + y, { width: 13, height: 5, borderRadius: 1.5, background: i === 5 ? RED : PAPER })}
                  {...L(i === 5
                    ? { x: [sx, sx, 0, 0, sx], y: [sy, sy, 0, 0, sy], opacity: [1, 1, 1, 0, 1] }
                    : { x: [sx, sx, 0, 0, sx], y: [sy, sy, 0, 0, sy] },
                    [0, 0.2, 0.45, 0.75, 1], { ease: 'easeInOut' })}
                />
              )
            })}
          </Stage>
        ),
      }

    /* drafts the nudge, and escalates after two misses */
    case 'Follow-up':
      return {
        mood: 'carrying',
        props: (
          <Stage>
            {[0, 1].map(i => (
              <motion.span
                key={i}
                style={at(22, -10, { width: 14, height: 10, borderRadius: 2, background: PAPER })}
                {...L({ x: [0, 0, 44], y: [0, 0, -14], opacity: [0, 1, 0] }, [0, 0.05 + i * 0.3, 0.28 + i * 0.3], { ease: 'easeIn' })}
              />
            ))}
            <motion.span
              style={at(40, -32, { width: 14, height: 14, borderRadius: 7, background: RED, color: PAPER, fontSize: 10, fontWeight: 900, display: 'grid', placeItems: 'center' })}
              {...L({ scale: [0, 0, 1.3, 1, 1, 0] }, [0, 0.66, 0.72, 0.78, 0.94, 1])}
            >!</motion.span>
          </Stage>
        ),
      }

    /* catches a slipped date */
    case 'Order watch':
      return {
        mood: 'idle',
        props: (
          <Stage>
            <span style={at(-58, 20, { width: 116, height: 2, background: 'rgba(10,10,12,0.25)', borderRadius: 1 })} />
            {[-50, -22, 26, 50].map((x, i) => (
              <motion.span
                key={x}
                style={at(x, 17, { width: 8, height: 8, borderRadius: 4, background: i === 2 ? RED : INK })}
                {...(i === 2 ? L({ background: [INK, INK, RED, RED, INK], scale: [1, 1, 1.5, 1.2, 1] }, [0, 0.55, 0.62, 0.9, 1]) : {})}
              />
            ))}
            <motion.span
              style={at(24, 4, { width: 14, height: 14, borderRadius: 7, border: `2px solid ${INK}` })}
              {...L({ x: [-76, 0, 0, -76] }, [0, 0.55, 0.9, 1], { ease: 'easeInOut' })}
            />
          </Stage>
        ),
      }

    /* finds the customers due on last year's date */
    case 'Reorder':
      return {
        mood: 'working',
        props: (
          <Stage>
            <div style={at(26, -24, { width: 30, height: 32, borderRadius: 4, background: PAPER, overflow: 'hidden', textAlign: 'center' })}>
              <span style={{ display: 'block', height: 8, background: INK }} />
              <span className="relative block" style={{ height: 24 }}>
                {['14', '15', '16'].map((d, i) => (
                  <motion.span
                    key={d}
                    className="absolute inset-0 grid place-items-center"
                    style={{ fontSize: 12, fontWeight: 800, color: INK, opacity: i === 2 ? 1 : 0 }}
                    {...L(
                      [
                        { opacity: [1, 1, 0, 0, 1], y: [0, 0, -6, -6, 0] },
                        { opacity: [0, 0, 1, 1, 0, 0], y: [6, 6, 0, 0, -6, -6] },
                        { opacity: [0, 0, 1, 1, 0], y: [6, 6, 0, 0, -6] },
                      ][i],
                      [[0, 0.3, 0.34, 0.97, 1], [0, 0.3, 0.34, 0.63, 0.67, 1], [0, 0.63, 0.67, 0.97, 1]][i],
                      { ease: 'linear' },
                    )}
                  >{d}</motion.span>
                ))}
              </span>
            </div>
            <motion.span
              style={at(-58, -18, { fontSize: 18, fontWeight: 900, color: INK, lineHeight: 1 })}
              {...L({ rotate: [0, 360] }, undefined, { duration: 2.4, ease: 'linear' })}
            >↻</motion.span>
          </Stage>
        ),
      }

    /* pipeline, risks, approvals and the one thing to do today */
    case 'Morning brief':
      return {
        mood: 'happy',
        props: (
          <Stage>
            <motion.span
              style={at(-62, -22, { width: 20, height: 20, borderRadius: 10, background: PAPER, boxShadow: '0 0 14px rgba(255,255,255,0.9)' })}
              {...L({ y: [22, 0, 0, 22], opacity: [0, 1, 1, 0] }, [0, 0.25, 0.85, 1], { ease: 'easeOut' })}
            />
            <div style={at(28, -18, { display: 'grid', gap: 5 })}>
              {[22, 16, 26].map((w, i) => (
                <div key={i} className="flex items-center gap-1">
                  <motion.span style={{ width: 4, height: 4, borderRadius: 2, background: i === 2 ? RED : INK }} {...L({ scale: [0, 0, 1, 1, 0] }, [0, 0.3 + i * 0.12, 0.36 + i * 0.12, 0.9, 1])} />
                  <motion.span style={line(w, 'rgba(10,10,12,0.45)', 2.5)} {...L({ scaleX: [0, 0, 1, 1, 0] }, [0, 0.32 + i * 0.12, 0.44 + i * 0.12, 0.9, 1])} />
                </div>
              ))}
            </div>
          </Stage>
        ),
      }

    default:
      return { mood: 'idle', props: null }
  }
}

export default function JobScene({ job, skin, phase }: { job: string; skin: Parameters<typeof Agent>[0]['skin']; phase: number }) {
  const calm = useCalmMotion()
  /* calm: no animate at all, so each shape rests on its finished frame */
  const L: Loop = (kf, times, extra) => calm ? {} : {
    animate: kf,
    transition: { duration: D, repeat: Infinity, ease: 'easeOut', delay: phase, ...(times ? { times } : {}), ...extra },
  }
  const { mood, props } = scene(job, L)
  return (
    <div className="relative h-[68px] w-full">
      {props}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Agent skin={skin} size={40} mood={mood} phase={phase} />
      </div>
    </div>
  )
}
