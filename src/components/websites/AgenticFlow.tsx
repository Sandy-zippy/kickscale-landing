/**
 * "Six things every ZippyScale website does": converts, tracks, answers, follows up,
 * ranks, moves. Each block has its own small loop showing that job being done, in an
 * ink panel, laid out as alternating wide and narrow cards rather than six equal tiles.
 *
 * Pattern from cockpit/JobScene: every shape's resting style IS the finished frame and
 * the loop only animates away from it, so under reduced motion (or off screen) each
 * panel still shows the job done. A lime rule above the grid draws with the scroll.
 */
import { useRef, type ReactNode } from 'react'
import { motion, useInView, useScroll, useSpring, type TargetAndTransition, type Transition } from 'framer-motion'
import { useCalmMotion } from '../cockpit/useCalmMotion'
import { EASE_OUT, INK, LIME, MONO, SWIPE, SLIDE } from './tokens'
import SwipeHint from './SwipeHint'

type Block = { title: string; body: string }
type Loop = (kf: TargetAndTransition, times?: number[], extra?: Transition) => { animate?: TargetAndTransition; transition?: Transition }

const D = 4.8
const KEYS = [/convert/i, /track/i, /answer/i, /follow/i, /rank/i, /move/i]
/* lg spans per row: wide+narrow, narrow+wide, half+half */
const SPAN = ['lg:col-span-4', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-4', 'lg:col-span-3', 'lg:col-span-3']

export default function AgenticFlow({ blocks }: { blocks: Block[] }) {
  const calm = useCalmMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.6'] })
  const draw = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  return (
    <div ref={ref} className="relative">
      <div aria-hidden className="mb-8 h-[2px] overflow-hidden rounded-full bg-[#111111]/10 max-sm:hidden">
        <motion.div className="h-full origin-left bg-[#111111]" style={{ scaleX: calm ? 1 : draw }} />
      </div>
      <ol className={`grid gap-4 md:grid-cols-2 lg:grid-cols-6 ${SWIPE}`}>
        {blocks.map((b, i) => {
          const k = KEYS.findIndex(r => r.test(b.title))
          const kind = k >= 0 ? k : i % 6
          const wide = SPAN[i % 6] === 'lg:col-span-4'
          return (
            <motion.li
              key={b.title}
              initial={{ opacity: 0, y: calm ? 0 : 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.8, delay: (i % 2) * 0.08, ease: EASE_OUT }}
              className={`group flex flex-col overflow-hidden rounded-3xl border border-[#111111]/10 bg-white ${SLIDE} ${SPAN[i % 6]} ${wide ? 'lg:flex-row' : ''}`}
            >
              <Panel kind={kind} wide={wide} />
              <div className={`flex flex-1 flex-col p-6 sm:p-7 ${wide ? 'lg:justify-center' : ''}`}>
                <span className={`${MONO} text-[11px] font-bold tracking-[0.18em] text-[#111111]/45`}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 font-['Space_Grotesk'] text-[1.45rem] font-bold leading-[1.05] tracking-tight text-[#111111] sm:text-[1.6rem]">{b.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{b.body}</p>
              </div>
            </motion.li>
          )
        })}
      </ol>
      <SwipeHint count={blocks.length} />
    </div>
  )
}

function Panel({ kind, wide }: { kind: number; wide: boolean }) {
  const calm = useCalmMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const live = inView && !calm
  const L: Loop = (kf, times, extra) =>
    live ? { animate: kf, transition: { duration: D, times, repeat: Infinity, ease: 'easeInOut', ...extra } } : {}
  const scenes = [Converts, Tracks, Answers, FollowsUp, Ranks, Moves]
  const Scene = scenes[kind]
  return (
    <div
      ref={ref}
      aria-hidden
      className={`relative m-2 flex min-h-[176px] items-center justify-center overflow-hidden rounded-[20px] bg-[#111111] p-5 ${wide ? 'lg:m-2.5 lg:w-[46%] lg:shrink-0' : ''}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
      <div className={`relative w-full max-w-[260px] ${wide ? 'lg:scale-[1.22]' : ''}`}><Scene L={L} /></div>
    </div>
  )
}

const chip = 'rounded-lg px-2.5 py-1.5 text-[11.5px]'
const Tag = ({ children }: { children: ReactNode }) => <span className={`${MONO} text-[9.5px] uppercase tracking-[0.16em] text-white/45`}>{children}</span>

/* 01 a tap-card question gets answered, the progress fills, the enquiry goes */
function Converts({ L }: { L: Loop }) {
  return (
    <div className="grid gap-2">
      <Tag>Step 1 of 3 · What do you need?</Tag>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full origin-left" style={{ background: LIME, scaleX: 1 }} {...L({ scaleX: [0.33, 0.33, 0.66, 1, 1] }, [0, 0.3, 0.45, 0.6, 1])} />
      </div>
      {['A new website', 'A landing page', 'Just looking'].map((t, i) => (
        <motion.span
          key={t}
          className={`${chip} border border-white/12`}
          style={{ background: i === 1 ? LIME : 'rgba(255,255,255,0.05)', color: i === 1 ? INK : '#fff' }}
          {...(i === 1 ? L({ background: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)', LIME, LIME], color: ['#ffffff', '#ffffff', INK, INK], scale: [1, 1, 0.96, 1] }, [0, 0.25, 0.3, 1]) : {})}
        >{t}</motion.span>
      ))}
      <motion.span className={`${MONO} justify-self-start rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#111111]`} {...L({ opacity: [0, 0, 1, 1, 0], y: [6, 6, 0, 0, 0] }, [0, 0.6, 0.68, 0.94, 1])}>
        ✓ Enquiry sent
      </motion.span>
    </div>
  )
}

/* 02 scroll depth runs down the page, time per section grows beside it */
function Tracks({ L }: { L: Loop }) {
  const rows = [['Hero', 0.55], ['Work', 0.9], ['Pricing', 1], ['Form', 0.4]] as const
  return (
    <div className="flex items-stretch gap-4">
      <div className="relative w-12 shrink-0 overflow-hidden rounded-md bg-white/[0.07]">
        {[0, 1, 2, 3].map(i => <span key={i} className="block h-[25%] border-b border-white/10" />)}
        <motion.span className="absolute inset-x-0 top-0 h-[2px]" style={{ background: LIME, y: 104 }} {...L({ y: [0, 104, 104, 0] }, [0, 0.7, 0.9, 1])} />
      </div>
      <div className="grid flex-1 gap-2">
        <Tag>Google visit · time per section</Tag>
        {rows.map(([n, w], i) => (
          <div key={n} className="grid grid-cols-[52px_1fr] items-center gap-2">
            <span className="text-[11px] text-white/70">{n}</span>
            <motion.span className="block h-2 origin-left rounded-full" style={{ width: `${w * 100}%`, background: i === 2 ? LIME : 'rgba(255,255,255,0.35)' }} {...L({ scaleX: [0, 0, 1, 1] }, [0, 0.1 + i * 0.12, 0.3 + i * 0.12, 1])} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* 03 a visitor asks, the bot types, then answers */
function Answers({ L }: { L: Loop }) {
  return (
    <div className="grid gap-2">
      <motion.p className="justify-self-end rounded-2xl rounded-br-md bg-white px-3 py-2 text-[12px] text-[#111111]" {...L({ opacity: [0, 1, 1, 1, 0], y: [8, 0, 0, 0, 0] }, [0, 0.08, 0.5, 0.94, 1])}>
        Do you build landing pages?
      </motion.p>
      <div className="relative min-h-[54px]">
        <motion.span className="absolute left-0 top-0 flex gap-1 rounded-2xl bg-white/10 px-3 py-3" style={{ opacity: 0 }} {...L({ opacity: [0, 0, 1, 1, 0, 0] }, [0, 0.14, 0.18, 0.36, 0.4, 1])}>
          {[0, 1, 2].map(i => <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/80" />)}
        </motion.span>
        <motion.p className="rounded-2xl rounded-bl-md px-3 py-2 text-[12px] text-[#111111]" style={{ background: LIME }} {...L({ opacity: [0, 0, 1, 1, 0], y: [8, 8, 0, 0, 0] }, [0, 0.4, 0.46, 0.94, 1])}>
          Yes, built for your ads. Want a 15-minute call?
        </motion.p>
      </div>
      <Tag>Trained on your business · day and night</Tag>
    </div>
  )
}

/* 04 the lead travels form → sheet → WhatsApp and each step ticks */
function FollowsUp({ L }: { L: Loop }) {
  const nodes = ['Form', 'Sheet / CRM', 'WhatsApp']
  return (
    <div className="grid gap-4">
      <div className="relative mx-3 h-[2px] bg-white/15">
        <motion.div className="absolute inset-0" style={{ x: '100%' }} {...L({ x: ['0%', '50%', '50%', '100%', '100%'] }, [0, 0.25, 0.4, 0.65, 1])}>
          <span className="absolute -left-[6px] -top-[5px] h-3 w-3 rounded-full shadow-[0_0_14px_rgba(217,234,102,0.8)]" style={{ background: LIME }} />
        </motion.div>
      </div>
      <div className="flex justify-between">
        {nodes.map((n, i) => (
          <div key={n} className="flex flex-col items-center gap-1.5">
            <motion.span
              className="grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold text-[#111111]"
              style={{ background: LIME }}
              {...L({ background: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)', LIME, LIME], scale: [1, 1, 1.15, 1] }, [0, [0.02, 0.26, 0.66][i], [0.05, 0.3, 0.7][i], 1])}
            >✓</motion.span>
            <span className="text-[10.5px] text-white/70">{n}</span>
          </div>
        ))}
      </div>
      <motion.span className={`${MONO} justify-self-center rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#111111]`} {...L({ opacity: [0, 0, 1, 1] }, [0, 0.7, 0.76, 1])}>
        Reply sent · under a minute
      </motion.span>
    </div>
  )
}

/* 05 three results, and ours climbs to the top */
function Ranks({ L }: { L: Loop }) {
  const rows = [
    { n: 'Your business', y: 0, kf: [80, 80, 40, 0, 0], you: true },
    { n: 'A competitor', y: 40, kf: [0, 0, 0, 40, 40] },
    { n: 'Another one', y: 80, kf: [40, 40, 80, 80, 80] },
  ]
  return (
    <div className="grid gap-2">
      <Tag>Search · near me</Tag>
      <div className="relative h-[114px]">
        {rows.map(r => (
          <motion.div
            key={r.n}
            className="absolute inset-x-0 top-0 flex h-[34px] items-center gap-2 rounded-lg px-2.5"
            style={{ y: r.y, background: r.you ? LIME : 'rgba(255,255,255,0.06)', zIndex: r.you ? 2 : 1 }}
            {...L({ y: r.kf }, [0, 0.2, 0.45, 0.65, 1])}
          >
            <span className="h-3 w-3 rounded-sm" style={{ background: r.you ? INK : 'rgba(255,255,255,0.25)' }} />
            <span className={`text-[11.5px] font-medium ${r.you ? 'text-[#111111]' : 'text-white/75'}`}>{r.n}</span>
            <span className="ml-auto block h-1.5 w-10 rounded-full" style={{ background: r.you ? 'rgba(17,17,17,0.3)' : 'rgba(255,255,255,0.15)' }} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* 06 the mobile speed ring fills into the pass zone, the three checks tick */
function Moves({ L }: { L: Loop }) {
  return (
    <div className="flex items-center gap-5">
      <svg width="86" height="86" viewBox="0 0 86 86" className="shrink-0 -rotate-90">
        <circle cx="43" cy="43" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <motion.circle cx="43" cy="43" r="36" fill="none" stroke={LIME} strokeWidth="7" strokeLinecap="round" style={{ pathLength: 0.92 }} {...L({ pathLength: [0, 0, 0.92, 0.92] }, [0, 0.08, 0.5, 1], { ease: [0.16, 1, 0.3, 1] })} />
      </svg>
      <div className="grid gap-1.5">
        <Tag>Google speed · mobile</Tag>
        {['LCP', 'INP', 'CLS'].map((m, i) => (
          <div key={m} className="flex items-center gap-2">
            <motion.span className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-[#111111]" style={{ background: LIME }} {...L({ scale: [0, 0, 1.2, 1, 1] }, [0, 0.5 + i * 0.08, 0.56 + i * 0.08, 0.6 + i * 0.08, 1])}>✓</motion.span>
            <span className={`${MONO} text-[11px] text-white/80`}>{m}</span>
          </div>
        ))}
        <span className={`${MONO} mt-1 justify-self-start rounded px-1.5 text-[10px] font-bold text-[#111111]`} style={{ background: LIME }}>PASS</span>
      </div>
    </div>
  )
}
