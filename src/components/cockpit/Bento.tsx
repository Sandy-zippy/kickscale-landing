/**
 * "What we build", as a bento grid instead of six equal cards.
 *
 * Unequal sizes give the eye somewhere to start. On a real pointer each card carries
 * a lime spotlight that follows the cursor and tilts a few degrees toward it; on a
 * phone the cards rise in one after another and press in when tapped. Layout after
 * the MIT Kokonut UI "Bento Grid" on 21st.dev (reference only, built by hand).
 */
import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { EASE_OUT } from '../growth/kinetic'
import { useCalmMotion, useCanHover } from './useCalmMotion'

/* six pillars: 4+2 / 2+2+2 / 6 on desktop, so the last one closes the grid */
const SPAN = ['lg:col-span-4', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-2', 'lg:col-span-6']

function Card({ t, d, i }: { t: string; d: string; i: number }) {
  const calm = useCalmMotion()
  const hover = useCanHover()
  const ref = useRef<HTMLDivElement>(null)
  const rx = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 })
  const ry = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 })
  const tilt = hover && !calm

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: calm ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: EASE_OUT }}
      whileTap={{ scale: 0.98 }}
      onPointerMove={e => {
        const el = ref.current
        if (!el || !hover) return
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${e.clientX - r.left}px`)
        el.style.setProperty('--my', `${e.clientY - r.top}px`)
        if (tilt) {
          rx.set(((e.clientY - r.top) / r.height - 0.5) * -6)
          ry.set(((e.clientX - r.left) / r.width - 0.5) * 6)
        }
      }}
      onPointerLeave={() => { rx.set(0); ry.set(0) }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition-[border-color,box-shadow] duration-300 hover:border-slate-400 hover:shadow-[0_24px_60px_-30px_rgba(10,10,12,0.35)] max-sm:p-5 ${SLIDE} sm:p-8 ${SPAN[i] ?? 'lg:col-span-2'} ${i === 0 ? 'lg:min-h-[13rem]' : ''}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), rgba(213,235,75,0.28), transparent 60%)' }}
      />
      <div className="relative">
        <span className="font-['JetBrains_Mono'] text-[11px] font-medium tracking-[0.18em] text-slate-400">
          {String(i + 1).padStart(2, '0')}
        </span>
        <h3 className={`mt-3 font-['Space_Grotesk'] font-bold leading-snug text-slate-900 ${i === 0 ? 'text-[22px] sm:text-[26px]' : 'text-[17px]'}`}>
          {t}
        </h3>
        <p className={`mt-3 leading-relaxed text-slate-600 ${i === 0 ? 'max-w-[46ch] text-[15.5px]' : 'text-[14.5px]'}`}>{d}</p>
      </div>
    </motion.div>
  )
}

import { SWIPE_5, SLIDE } from '../websites/tokens'
import SwipeHint from '../websites/SwipeHint'

export default function Bento({ pillars }: { pillars: { t: string; d: string }[] }) {
  return (
    <>
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-6 ${SWIPE_5}`}>
      {pillars.map((p, i) => <Card key={p.t} t={p.t} d={p.d} i={i} />)}
    </div>
    <SwipeHint count={pillars.length} />
    </>
  )
}
