/**
 * /websites hero. Text left, a live illustration right of one of our sites at work:
 * a visitor arrives from an ad, scrolls (heat dots, a section timer ticking), asks the
 * bot, fills the form, and the lead lands in a mini pipeline with its source and reply
 * time. It is labelled as an illustration; every name and time in it is an example.
 *
 * LCP: the headline renders with no hidden first frame. Only the graphic animates in.
 * Reduced motion: the loop does not run; the graphic shows its finished frame.
 * The loop also pauses while the hero is off screen.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import CockpitStyles from '../cockpit/CockpitStyles'
import { useCalmMotion, useCanHover } from '../cockpit/useCalmMotion'
import { BONE, EASE_OUT, INK, LIME, MONO } from './tokens'

type Props = {
  onPrimary: () => void
  onSecondary: () => void
  eyebrow: string
  headline: string
  sub: string
  primaryLabel: string
  secondaryLabel: string
}

export default function HeroAgentic({ onPrimary, onSecondary, eyebrow, headline, sub, primaryLabel, secondaryLabel }: Props) {
  return (
    <section className="relative overflow-hidden bg-[#111111] text-white">
      <CockpitStyles />
      <div aria-hidden className="zs-grain" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:px-8 lg:pb-24 lg:pt-36">
        <div>
          <p className={`${MONO} flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60`}>
            <span aria-hidden className="inline-block h-px w-8 bg-[#D9EA66]" />
            {eyebrow}
          </p>
          <h1 className="mt-6 font-['Space_Grotesk'] text-[2.35rem] font-bold uppercase leading-[0.92] tracking-[-0.03em] sm:text-[3.5rem] lg:text-[4.1rem] xl:text-[4.6rem]">
            {headline}
          </h1>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-white/70">{sub}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <HeroButton onClick={onPrimary} primary>{primaryLabel}</HeroButton>
            <HeroButton onClick={onSecondary}>{secondaryLabel}</HeroButton>
          </div>
        </div>
        <AgentSite />
      </div>
    </section>
  )
}

function HeroButton({ onClick, primary = false, children }: { onClick: () => void; primary?: boolean; children: string }) {
  const hover = useCanHover()
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className={`group relative inline-flex min-h-[52px] items-center justify-center gap-2.5 overflow-hidden rounded-full px-7 font-['Space_Grotesk'] text-[14px] font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9EA66] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111] ${
        primary
          ? 'bg-[#D9EA66] text-[#111111] shadow-[0_0_48px_-12px_rgba(217,234,102,0.75)]'
          : 'border border-white/25 text-white hover:border-white/50 hover:bg-white/[0.05]'
      }`}
    >
      {primary && <span aria-hidden className="zs-shine pointer-events-none absolute inset-0" />}
      <span className="relative">{children}</span>
      <span aria-hidden className="relative transition-transform duration-300 group-hover:translate-x-1">→</span>
    </motion.button>
  )
}

/* ───────────── the illustration ───────────── */

/* arrive, scroll, bot typing, bot answers, form fills, lead lands, lead replied */
const DUR = [1500, 2300, 1000, 1500, 1900, 1300, 3000]
const FINAL = DUR.length - 1

function AgentSite() {
  const calm = useCalmMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (calm || !inView) return
    const id = setTimeout(() => setStep(s => (s + 1) % DUR.length), DUR[step])
    return () => clearTimeout(id)
  }, [step, calm, inView])

  const s = calm ? FINAL : step
  const fade = { duration: 0.45, ease: EASE_OUT }

  return (
    <motion.figure
      ref={ref}
      aria-label="Illustration: a visitor from a Meta ad reads the page, asks the site's bot, fills the form, and arrives in the pipeline as a lead with a reply in 42 seconds."
      initial={{ opacity: 0, y: calm ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: EASE_OUT }}
      className="relative mx-auto w-full max-w-[580px]"
    >
      <div aria-hidden className="pointer-events-none absolute -inset-10 rounded-full opacity-40 blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(217,234,102,0.28), transparent)' }} />

      {/* browser frame */}
      <div aria-hidden className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#1A1A1D] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <span className="flex gap-1.5">{[0, 1, 2].map(i => <span key={i} className="h-2.5 w-2.5 rounded-full bg-white/15" />)}</span>
          <span className={`${MONO} ml-2 truncate rounded-full bg-white/[0.06] px-3 py-1 text-[10.5px] text-white/50`}>yourbusiness.com</span>
          <motion.span
            className={`${MONO} ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider`}
            style={{ background: LIME, color: INK }}
            initial={false}
            animate={{ opacity: s >= 0 ? 1 : 0, scale: step === 0 && !calm ? [0.6, 1.08, 1] : 1 }}
            transition={fade}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" /> Visitor · Meta ad
          </motion.span>
        </div>

        {/* the site inside */}
        <div className="relative h-[270px] overflow-hidden sm:h-[330px]" style={{ background: BONE }}>
          <motion.div
            className="absolute inset-x-0 top-0 px-4 pt-4 sm:px-5"
            initial={false}
            animate={{ y: s >= 1 ? -140 : 0 }}
            transition={{ duration: calm ? 0 : 1.6, ease: [0.65, 0, 0.35, 1] }}
          >
            <MockSite />
          </motion.div>

          {/* heat dots */}
          {[[22, 34, 54], [62, 48, 70], [40, 62, 44], [74, 26, 38], [30, 80, 34]].map(([x, y, r], i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute rounded-full"
              style={{ left: `${x}%`, top: `${y}%`, width: r, height: r, marginLeft: -r / 2, marginTop: -r / 2, background: 'radial-gradient(closest-side, rgba(17,17,17,0.55), rgba(217,234,102,0.55) 45%, rgba(217,234,102,0))' }}
              initial={false}
              animate={{ opacity: s >= 1 ? 0.9 : 0, scale: s >= 1 ? 1 : 0.4 }}
              transition={{ ...fade, delay: s === 1 && !calm ? 0.5 + i * 0.22 : 0 }}
            />
          ))}

          {/* section timer */}
          <motion.div
            className={`${MONO} absolute left-3 top-3 flex items-center gap-2 rounded-full bg-[#111111] px-2.5 py-1 text-[10px] text-white`}
            initial={false}
            animate={{ opacity: s >= 1 ? 1 : 0 }}
            transition={fade}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D9EA66]" />
            Pricing section <SectionTimer running={!calm && s >= 1} fixed={calm ? 14 : undefined} />
          </motion.div>

          {/* cursor */}
          {!calm && (
            <motion.svg
              width="16" height="20" viewBox="0 0 16 20" className="absolute left-0 top-0"
              animate={{ x: [60, 230, 260, 300, 120, 130][Math.min(s, 5)], y: [60, 140, 120, 200, 170, 205][Math.min(s, 5)], opacity: s >= 5 ? 0 : 1 }}
              transition={{ duration: 0.9, ease: EASE_OUT }}
            >
              <path d="M1 1l13 8-6 1.4L5 18z" fill={INK} stroke="#fff" strokeWidth="1.2" />
            </motion.svg>
          )}

          {/* the bot */}
          <div className="absolute bottom-3 right-3 flex w-[64%] max-w-[260px] flex-col items-end gap-1.5">
            <AnimatePresence>
              {s >= 2 && (
                <motion.p key="q" {...bubbleIn(calm)} className="rounded-2xl rounded-br-md bg-white px-3 py-2 text-[11.5px] leading-snug text-[#111111] shadow-sm">
                  Is Saturday open for a visit?
                </motion.p>
              )}
              {s === 2 && (
                <motion.span key="dots" {...bubbleIn(calm)} className="self-start rounded-2xl bg-[#111111] px-3 py-2.5"><TypingDots /></motion.span>
              )}
              {s >= 3 && (
                <motion.p key="a" {...bubbleIn(calm)} className="self-start rounded-2xl rounded-bl-md bg-[#111111] px-3 py-2 text-[11.5px] leading-snug text-white">
                  Yes. 11 am or 4 pm? Leave your number and I will book it.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* the form */}
          <motion.div
            className="absolute left-3 top-11 w-[33%] min-w-[118px] rounded-xl sm:bottom-3 sm:top-auto bg-white p-2.5 shadow-[0_10px_30px_-12px_rgba(17,17,17,0.35)]"
            initial={false}
            animate={{ opacity: s >= 4 ? 1 : 0, y: s >= 4 || calm ? 0 : 10 }}
            transition={fade}
          >
            {['Priya', '+91 98xxx 21x'].map((v, i) => (
              <div key={v} className="mb-1.5 rounded-md border border-[#111111]/15 px-2 py-1">
                <motion.span
                  className="block whitespace-nowrap text-[10.5px] text-[#111111]"
                  initial={false}
                  animate={{ clipPath: s >= 4 ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
                  transition={{ duration: calm ? 0 : 0.6, delay: s === 4 ? 0.3 + i * 0.6 : 0, ease: 'linear' }}
                >{v}</motion.span>
              </div>
            ))}
            <motion.span
              className="block rounded-md py-1 text-center text-[10px] font-bold uppercase tracking-wider text-[#111111]"
              style={{ background: LIME }}
              initial={false}
              animate={{ scale: s === 5 && !calm ? [1, 0.9, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >Book visit</motion.span>
          </motion.div>
        </div>
      </div>

      {/* mini pipeline */}
      <div aria-hidden className="relative mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
        {['New lead', 'Replied', 'Booked'].map((col, ci) => (
          <div key={col} className="min-h-[96px] rounded-xl bg-white/[0.04] p-2">
            <p className={`${MONO} mb-1.5 text-[9.5px] uppercase tracking-[0.16em] text-white/45`}>{col}</p>
            {s >= 5 && ci === (s >= 6 ? 1 : 0) && (
              <motion.div
                layoutId="zs-hero-lead"
                initial={calm ? false : { opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                className="rounded-lg bg-white p-1.5 text-[#111111]"
              >
                <p className="truncate text-[10.5px] font-semibold">Priya · Meta ad</p>
                <p className="truncate text-[9.5px] text-[#111111]/60">Sat 11 am visit</p>
                <span className={`${MONO} mt-1 inline-block whitespace-nowrap rounded px-1 text-[8.5px] font-bold sm:text-[9px]`} style={{ background: s >= 6 ? LIME : 'rgba(17,17,17,0.08)' }}>
                  {s >= 6 ? 'replied in 42s' : 'new · 0s'}
                </span>
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <figcaption className={`${MONO} mt-3 text-[10.5px] tracking-wide text-white/45`}>Illustration. Names and timings are examples.</figcaption>
    </motion.figure>
  )
}

const bubbleIn = (calm: boolean) => ({
  initial: { opacity: 0, y: calm ? 0 : 8, scale: calm ? 1 : 0.94 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, transition: { duration: 0.2 } },
  transition: { duration: 0.35, ease: EASE_OUT },
})

export function TypingDots({ tone = '#FFFFFF' }: { tone?: string }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: tone }}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  )
}

function SectionTimer({ running, fixed }: { running: boolean; fixed?: number }) {
  const [sec, setSec] = useState(3)
  useEffect(() => {
    if (!running) { setSec(3); return }
    const id = setInterval(() => setSec(v => v + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  const v = fixed ?? sec
  return <span className="tabular-nums text-[#D9EA66]">00:{String(v).padStart(2, '0')}</span>
}

/* a believable small-business page in shapes and a few words */
function MockSite() {
  const bar = (w: string, o = 0.18) => <span className="block h-2 rounded-full" style={{ width: w, background: `rgba(17,17,17,${o})` }} />
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <span className="font-['Space_Grotesk'] text-[12px] font-bold text-[#111111]">Your business</span>
        <span className="flex gap-2">{bar('24px')}{bar('24px')}{bar('24px')}</span>
      </div>
      <div className="rounded-xl bg-[#111111] p-4">
        <p className="font-['Space_Grotesk'] text-[15px] font-bold uppercase leading-tight text-white sm:text-[17px]">Homes ready to<br />move into</p>
        <span className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase text-[#111111]" style={{ background: LIME }}>Book a site visit</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="grid gap-1.5 rounded-lg bg-white p-2">
            <span className="block h-10 rounded-md bg-[#111111]/[0.08]" />{bar('80%')}{bar('55%', 0.1)}
          </div>
        ))}
      </div>
      <div className="grid gap-1.5 rounded-lg bg-white p-3">
        <span className="font-['Space_Grotesk'] text-[11px] font-bold uppercase text-[#111111]">Pricing</span>
        {bar('90%', 0.12)}{bar('70%', 0.12)}{bar('82%', 0.12)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map(i => <div key={i} className="grid gap-1.5 rounded-lg bg-white p-2">{bar('60%')}{bar('85%', 0.1)}{bar('40%', 0.1)}</div>)}
      </div>
    </div>
  )
}
