/**
 * Zippy, the homepage's guide.
 *
 * One robot that comes with you down the page. On a desktop it rides the right edge,
 * its height tracking how far down the page you are, and leans into the scroll. On a
 * phone it sits bottom-left and hops each time you reach a new section. Either way it
 * says one line about the section you are in, and tapping it takes you to the next.
 *
 * Sections opt in with `data-zippy="<id>"`; the hint for each id lives in HINTS so
 * all of Zippy's words are in one place. In the hero Zippy is part of the scene
 * (Untangle), so the guide only appears once you leave it.
 */
import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  motion, AnimatePresence, useMotionValue, useScroll, useSpring, useTransform, useVelocity,
} from 'framer-motion'
import { Agent, type AgentMood } from './Agent'
import { aim, useCalmMotion, useWide } from './useCalmMotion'

export const HINTS: Record<string, { hint: string; mood: AgentMood }> = {
  hero:    { hint: 'Hi, I’m Zippy. Scroll, I’ll show you around.', mood: 'happy' },
  fix:     { hint: 'This is the fix: one record.', mood: 'happy' },
  stack:   { hint: 'Recognise this? Everyone does.', mood: 'stuck' },
  voices:  { hint: 'Real owners. Click any quote.', mood: 'idle' },
  agents:  { hint: 'Meet my team. You approve, we act.', mood: 'working' },
  compare: { hint: 'Why owners pick a cockpit.', mood: 'happy' },
  proof:   { hint: 'Already built and running.', mood: 'happy' },
  price:   { hint: 'One build fee. No per-seat tax.', mood: 'working' },
  faq:     { hint: 'Fair questions. Straight answers.', mood: 'idle' },
  book:    { hint: 'Pick a time. I’ll be on the call notes.', mood: 'happy' },
}
const ORDER = Object.keys(HINTS)

/**
 * Eyes that follow the pointer (or the finger, on a phone). When nobody has moved for
 * a few seconds Zippy looks around on its own. Gaze maths after the MIT "Mascot
 * Portfolio Hero" on 21st.dev (@kedhareswer): soft-saturated aim, eased per frame.
 */
export function useGaze(ref: RefObject<HTMLElement | null>, calm: boolean) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  useEffect(() => {
    let px = 0, py = 0, last = -1e9, gx = 0, gy = 0, prev = performance.now(), raf = 0
    const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; last = performance.now() }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onMove, { passive: true })
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight || r.width === 0) return
      let tx = 0, ty = 0
      if (now - last < 3500) {
        const reach = Math.max(window.innerWidth, window.innerHeight)
        ;[tx, ty] = aim(px, py, r.left + r.width / 2, r.top + r.height * 0.45, reach * 0.3, reach * 0.26)
      } else if (!calm) {
        const t = now / 1000
        tx = Math.sin(t * 0.45) * 0.6 + Math.sin(t * 1.1) * 0.1
        ty = Math.sin(t * 0.31 + 1) * 0.3
      }
      const k = Math.exp(-7 * dt)
      gx = tx + (gx - tx) * k
      gy = ty + (gy - ty) * k
      x.set(gx * 3.2)
      y.set(gy * 2.6)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
    }
  }, [ref, calm, x, y])
  return { x, y }
}

/** the speech bubble, shared by the guide and the hero */
export function Bubble({ children, side = 'left' }: { children: React.ReactNode; side?: 'left' | 'top' | 'right' }) {
  return (
    <span
      className={`relative block w-max max-w-[min(56vw,15rem)] rounded-2xl bg-[#F5F5F0] px-3 py-1.5 text-[12.5px] sm:px-3.5 sm:py-2 sm:text-[13px] font-semibold leading-snug text-[#0A0A0C] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.55)] ${
        side === 'left' ? 'rounded-br-md' : side === 'right' ? 'rounded-bl-md' : 'rounded-bl-md'}`}
    >
      {children}
    </span>
  )
}

export default function ZippyGuide() {
  const calm = useCalmMotion()
  const wide = useWide()
  const [active, setActive] = useState('hero')
  const [bubble, setBubble] = useState(true)
  const botRef = useRef<HTMLButtonElement>(null)
  const eyes = useGaze(botRef, calm)

  /* which section is under the middle of the screen */
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-zippy]')]
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.getAttribute('data-zippy') ?? 'hero')
    }, { rootMargin: '-45% 0px -50% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* A new section brings the bubble back, then it tucks away so it never sits on
     top of what you are reading (on a 1440px screen the margin is only 144px, so a
     sentence there always covers content). Hovering Zippy brings it back. */
  useEffect(() => {
    setBubble(true)
    const t = setTimeout(() => setBubble(false), wide ? 4000 : 3200)
    return () => clearTimeout(t)
  }, [active, wide])

  const { scrollY, scrollYProgress } = useScroll()
  const top = useTransform(scrollYProgress, [0, 1], ['18vh', '70vh'])
  const lean = useSpring(useTransform(useVelocity(scrollY), [-2400, 0, 2400], [12, 0, -12]), { stiffness: 180, damping: 18 })

  const info = HINTS[active]
  /* On a phone the form fills the screen, so after its wave and hint Zippy steps
     away rather than sit on a field someone needs to tap. */
  const shown = !!info && active !== 'hero' && !(active === 'book' && !wide && !bubble)

  const next = () => {
    const i = ORDER.indexOf(active)
    const target = document.querySelector(`[data-zippy="${ORDER[Math.min(i + 1, ORDER.length - 1)]}"]`)
    target?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key="zippy"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className={`fixed z-40 flex items-end gap-2 ${wide
            ? 'right-5 flex-row-reverse'
            : 'bottom-[calc(14px+env(safe-area-inset-bottom))] left-3 flex-row'}`}
          style={wide ? { top: calm ? '55vh' : top } : undefined}
          onMouseEnter={() => setBubble(true)}
          onMouseLeave={() => setBubble(false)}
        >
          <motion.button
            ref={botRef}
            type="button"
            onClick={next}
            aria-label={`Zippy: ${info.hint} Tap to go to the next section.`}
            className="relative grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-[#0A0A0C]/85 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7),0_0_0_1px_rgba(213,235,75,0.35)] backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5EB4B] lg:h-[72px] lg:w-[72px]"
            style={wide && !calm ? { rotate: lean } : undefined}
            whileTap={{ scale: 0.9 }}
          >
            {/* the hop on every new section; a wave when you reach the booking form */}
            <motion.span
              key={active}
              className="block"
              animate={calm ? {} : active === 'book'
                ? { rotate: [0, -16, 12, -10, 8, 0] }
                : { y: [0, -14, 0] }}
              transition={{ duration: active === 'book' ? 1.1 : 0.55, ease: 'easeOut' }}
            >
              <Agent skin="lime" size={wide ? 50 : 36} mood={info.mood} eyes={eyes} />
            </motion.span>
            {/* a lime ring breathing behind it, so it reads as alive even when still */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: '0 0 0 2px rgba(213,235,75,0.55)' }}
              animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.25, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
            />
          </motion.button>

          <AnimatePresence mode="wait">
            {bubble && (
              <motion.button
                key={active}
                type="button"
                onClick={next}
                initial={{ opacity: 0, y: 6, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8 text-left lg:mb-6"
                aria-hidden
                tabIndex={-1}
              >
                <Bubble side={wide ? 'left' : 'right'}>{info.hint}</Bubble>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
