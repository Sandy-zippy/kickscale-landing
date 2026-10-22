/**
 * The hero scene: "the untangle".
 *
 * Five apps float around Zippy, joined by lines that go nowhere. As you scroll the
 * hero, Zippy pulls them in and they snap together into one glowing record. That is
 * the whole pitch, played by the scrollbar instead of explained in a paragraph.
 *
 * Each app sits in a full-size wrapper and the WRAPPER is translated, so a percentage
 * moves it a fraction of the stage rather than of the chip: one transform per app, no
 * layout work, smooth on a phone.
 *
 * Calm (reduced motion): nothing flies. The apps fade out as the record fades in, so
 * the same story still plays, as a crossfade.
 */
import { useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion'
import { Agent } from './Agent'
import { Bubble, HINTS, useGaze } from './Zippy'
import { useCalmMotion, useWide } from './useCalmMotion'

/* where each app floats in the tangle, as % of the stage (centre of the chip) */
const APPS = [
  { n: 'Tally',    x: 16, y: 18, tint: '#F6785B' },
  { n: 'Excel',    x: 80, y: 14, tint: '#5BC2F6' },
  { n: 'WhatsApp', x: 88, y: 56, tint: '#D5EB4B' },
  { n: 'POS',      x: 12, y: 60, tint: '#8B7CF6' },
  { n: 'CRM',      x: 50, y: 92, tint: '#F5F5F0' },
]
const HOME = { x: 50, y: 78 }   // where the record lands

function AppChip({ a, i, p, calm }: {
  a: typeof APPS[number]; i: number; p: MotionValue<number>; calm: boolean
}) {
  const start = 0.04 + i * 0.03
  const end = 0.42 + i * 0.03
  const x = useTransform(p, [start, end], ['0%', `${calm ? 0 : HOME.x - a.x}%`])
  const y = useTransform(p, [start, end], ['0%', `${calm ? 0 : HOME.y - a.y}%`])
  const scale = useTransform(p, [start, end], [1, calm ? 1 : 0.45])
  const opacity = useTransform(p, calm ? [0.1, 0.4] : [end - 0.06, end + 0.02], [1, 0])

  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ x, y }}>
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${a.x}%`, top: `${a.y}%`, scale, opacity }}
      >
        <motion.div
          animate={calm ? {} : { y: [0, -8, 0], rotate: [0, i % 2 ? 2 : -2, 0] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md sm:px-3.5 sm:py-2.5"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: a.tint, boxShadow: `0 0 12px ${a.tint}` }} />
          <span className="font-['Space_Grotesk'] text-[13px] font-bold text-white/90 sm:text-[15px]">{a.n}</span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default function Untangle({ progress }: { progress: MotionValue<number> }) {
  const calm = useCalmMotion()
  const wide = useWide()
  const botRef = useRef<HTMLDivElement>(null)
  const eyes = useGaze(botRef, calm)
  const [merged, setMerged] = useState(false)
  /* Relay the scroll value through a plain motion value. Fed directly, framer 12
     tries to run these transforms on a native scroll timeline, and on this sticky
     hero that timeline drifted from the real progress (the card stayed hidden on
     phones). Five chips and a card are cheap to drive from JS. */
  const p = useMotionValue(progress.get())
  useMotionValueEvent(progress, 'change', v => { p.set(v); setMerged(v > 0.5) })

  const lines = useTransform(p, [0.05, 0.35], [1, 0])
  const card = useTransform(p, [0.42, 0.62], [0, 1])
  const cardScale = useTransform(p, [0.42, 0.62], [calm ? 1 : 0.7, 1])
  const glow = useTransform(p, [0.5, 0.75], [0, 1])

  return (
    <div
      className="relative mx-auto aspect-[1/0.92] w-full max-w-[560px]"
      role="img"
      aria-label="Five business apps that do not talk to each other, pulled together into one shared record as you scroll"
    >
      {/* the tangle: hand-drawn lines between the apps that lead nowhere */}
      <motion.svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" style={{ opacity: lines }} aria-hidden>
        {[
          'M16,18 C40,0 60,40 80,14', 'M80,14 C100,30 70,50 88,56', 'M88,56 C70,90 60,70 50,92',
          'M50,92 C30,80 30,70 12,60', 'M12,60 C0,40 30,30 16,18', 'M16,18 C50,50 60,30 88,56',
        ].map((d, i) => (
          <motion.path
            key={d} d={d} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4"
            strokeDasharray="1.2 1.6" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
          />
        ))}
      </motion.svg>

      {APPS.map((a, i) => <AppChip key={a.n} a={a} i={i} p={p} calm={calm} />)}

      {/* Zippy in the middle, doing the pulling */}
      <div ref={botRef} className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.5 }}
          className="relative"
        >
          <span aria-hidden className="absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgba(213,235,75,0.28),transparent)]" />
          <Agent skin="lime" size={wide ? 132 : 96} mood={merged ? 'happy' : 'working'} eyes={eyes} />
          {/* Phone: under Zippy and centred, the one gap the five chips leave, and gone
              once the record forms (the guide says the next line). Desktop: up and to
              the right, where there is room. */}
          <motion.div
            className={`absolute left-1/2 top-[108%] -translate-x-1/2 lg:bottom-[88%] lg:left-[62%] lg:top-auto lg:translate-x-0 ${merged && !wide ? 'hidden' : ''}`}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* on a phone the guide takes over with the next hint, so the hero never says it twice */}
            <Bubble side="right">{merged && wide ? HINTS.fix.hint : HINTS.hero.hint}</Bubble>
          </motion.div>
        </motion.div>
      </div>

      {/* the one record the five become */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${HOME.x}%`, top: `${HOME.y}%`, opacity: card, scale: cardScale }}
      >
        <motion.div
          className="absolute inset-[-40%] rounded-full bg-[radial-gradient(closest-side,rgba(213,235,75,0.45),transparent)]"
          style={{ opacity: glow }}
          aria-hidden
        />
        <div className="relative rounded-2xl bg-[#D5EB4B] px-6 py-3.5 text-center shadow-[0_20px_60px_-20px_rgba(213,235,75,0.9)] sm:px-8 sm:py-4">
          <p className="font-['Space_Grotesk'] text-[17px] font-bold tracking-tight text-[#0A0A0C] sm:text-[20px]">ONE RECORD</p>
          <p className="font-['JetBrains_Mono'] text-[11px] text-[rgba(10,10,12,0.65)] sm:text-[12.5px]">one shared truth</p>
        </div>
      </motion.div>
    </div>
  )
}
