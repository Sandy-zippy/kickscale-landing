/**
 * Agentic Cockpit — the homepage.
 *
 * Built on the /growth design language (kinetic.tsx primitives, brand tokens) so the
 * two pages read as one company. The copy and every statistic live in
 * src/data/cockpit.ts, where each number carries its publisher, year and URL.
 *
 * The honesty rules the rest of the work follows apply here too: no statistic we could
 * not trace to a primary source, no competitor price we could not read on their own
 * page, no claim that anything is deployed or autonomous when it is not.
 */
import { SWIPE_5, SLIDE } from '../components/websites/tokens'
import SwipeHint from '../components/websites/SwipeHint'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll } from 'framer-motion'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import {
  Band, Split, Kicker, Reveal, SignalField,
  DISPLAY_SM, LIME, EASE_OUT,
} from '../components/growth/kinetic'
import {
  HERO, VOICES, EVIDENCE, WHAT_IT_IS, AGENTS_INTRO,
  COMPARISON, PRICING, PROOF, OBJECTIONS, CTA,
} from '../data/cockpit'
import { Agent, Says } from '../components/cockpit/Agent'
import { CockpitScene } from '../components/cockpit/StackScene'
import { AgentTeam, ApproveFlow, AgentDrift } from '../components/cockpit/AgentTeam'
import DiscoveryCall from '../components/cockpit/DiscoveryCall'
import { useRates, guessPlace, Price, CurrencyPicker, format } from '../components/cockpit/Money'
import ZippyGuide from '../components/cockpit/Zippy'
import Untangle from '../components/cockpit/Untangle'
import Bento from '../components/cockpit/Bento'
import ShineButton from '../components/cockpit/ShineButton'
import CockpitStyles from '../components/cockpit/CockpitStyles'
import { startLandingFunnel } from '../lib/tracking'
import { useCalmMotion, useCanHover, useWide } from '../components/cockpit/useCalmMotion'

/* a small superscript link back to the source — the whole point is that it is clickable */
function Cite({ url, publisher, year, kind, method, tone = 'bone' }: {
  url: string; publisher: string; year: string
  kind: 'independent' | 'vendor'; method?: string
  /** the band it sits on. Ink text on an ink band is a source nobody can read, which
   *  is the same as having no source at all. */
  tone?: 'ink' | 'bone'
}) {
  const dark = tone === 'ink'
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${publisher}, ${year}${method ? `. ${method}` : ''}${
        kind === 'vendor' ? ' · published by a vendor in this market' : ''}`}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${
        dark
          ? 'bg-[#D5EB4B] text-[#0A0A0C] hover:bg-white'
          : 'bg-[#0A0A0C] text-white hover:bg-[#2A2A32]'}`}
    >
      <span aria-hidden className="text-[9px] opacity-60">▲</span>
      {publisher}, {year}
      {kind === 'vendor' && <span aria-hidden title="published by a vendor in this market">◦</span>}
    </a>
  )
}

export default function AgenticCockpit() {
  useEffect(() => {
    document.title = 'Agentic Cockpit · one system that runs your business | ZippyScale'
  }, [])
  // where ad visitors drop: CTA clicks, form seen, scroll depth, time on page
  useEffect(() => startLandingFunnel('book'), [])
  /* Phones show the first four comparison rows, the rest one tap away. */
  const [allRows, setAllRows] = useState(false)

  return (
    <>
      <CockpitStyles />
      <Nav noBanner floating dark cockpit ctaHref="#book" ctaLabel="Book a Discovery Call" ctaLabelMobile="Book a call" />
      <ZippyGuide />

      <Hero />

      {/* ───────────────────────── what a cockpit is ───────────────────────── */}
      {/* Second on the page, straight after the hero: the hero states the problem, so
          the answer belongs before the evidence, not after it. Light, because two ink
          bands in a row read as one very long band. */}
      <div data-zippy="fix">
      <Band tone="bone" className="py-16 max-sm:py-11 sm:py-24">
        <AgentDrift count={4} tone="bone" />
        <Kicker tone="bone">What we build instead</Kicker>
        <h2 className={`${DISPLAY_SM} mt-4 max-w-[22ch]`}>{WHAT_IT_IS.title}</h2>
        <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-slate-600">
          {WHAT_IT_IS.body}
        </p>

        {/* the same five sources, now feeding one record */}
        <Reveal delay={0.15}>
          <div className="mt-10 max-sm:mt-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_30px_80px_-50px_rgba(10,10,12,0.45)] sm:p-8">
            <CockpitScene className="w-full" tone="bone" />
            <div className="mt-4 flex items-start gap-3 sm:mt-2">
              <Agent skin="lime" size={34} mood="happy" />
              <Says tone="ink">
                Same enquiry, same phone number, same person. One record, not three.
              </Says>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 max-sm:mt-7">
          <Bento pillars={WHAT_IT_IS.pillars} />
        </div>
      </Band>
      </div>

      {/* ───────────────────────── the Frankenstein stack ───────────────────────── */}
      {/* Was a six-box grid above a five-card quote wall: two screens of very little.
          Now the argument sits still on the left while the evidence scrolls past it,
          and the quotes run as one moving line instead of a wall nobody reads. */}
      <div data-zippy="stack">
      <Band tone="ink" className="py-16 max-sm:py-11 sm:py-24">
        <AgentDrift count={5} tone="ink" />

        <div className="grid gap-10 max-sm:gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Kicker>The Frankenstein stack</Kicker>
            <h2 className={`${DISPLAY_SM} mt-4 max-w-[14ch]`}>Nobody chose it. It just grew.</h2>
            <p className="mt-5 max-w-[46ch] text-[15.5px] leading-relaxed text-white/65">
              Tally because the accountant asked. Excel because Tally could not do that one
              thing. WhatsApp because that is where customers already were. A POS because the
              counter needed one. Each was a reasonable decision. Together they are stitched
              together, barely alive, and held up by somebody re-typing the same customer into
              three places.
            </p>
            <p className="mt-5 max-w-[42ch] text-[13px] leading-relaxed text-white/40">
              Every figure here links to where it came from. A <span aria-hidden>◦</span> marks
              research published by a company that sells the cure. Worth knowing, still worth
              reading.
            </p>
          </div>

          {/* the evidence, as a list of figures rather than a wall of cards */}
          <ul className={`border-t border-white/12 max-sm:border-t-0 ${SWIPE_5}`}>
            {EVIDENCE.map((s2, i) => (
              <motion.li
                key={s2.figure}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: EASE_OUT }}
                className={`grid content-start gap-x-6 gap-y-1.5 border-b border-white/12 py-5 max-sm:rounded-2xl max-sm:border max-sm:border-white/12 max-sm:bg-white/[0.04] max-sm:p-5 sm:grid-cols-[minmax(7.5rem,auto)_1fr] ${SLIDE}`}
              >
                <div className="font-['Space_Grotesk'] text-[1.45rem] font-bold leading-[1.05] tracking-tight text-white sm:text-[1.6rem]">
                  {s2.figure}
                  {/* a lime rule draws in under each figure as it arrives */}
                  <motion.span
                    aria-hidden
                    className="mt-2 block h-[2px] w-10 origin-left rounded-full bg-[#D5EB4B]"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, delay: 0.2 + i * 0.05, ease: EASE_OUT }}
                  />
                </div>
                <div>
                  <p className="text-[14.5px] leading-relaxed text-white/65">{s2.claim}</p>
                  <div className="mt-2"><Cite {...s2.source} tone="ink" /></div>
                </div>
              </motion.li>
            ))}
          </ul>
          <SwipeHint dark count={EVIDENCE.length} />
        </div>

        {/* what people actually say, as one moving line */}
        <div className="mt-16 max-w-[52ch] max-sm:mt-10">
          <Kicker>Not our words</Kicker>
          <h2 className={`${DISPLAY_SM} mt-4`}>This is how owners describe it.</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/65">
            Every line below was posted in public by somebody running a business, on forums
            where people talk to each other rather than to a salesperson. Nothing is
            paraphrased and nothing is ours. Click any of them to read the original.
          </p>
        </div>
      </Band>
      </div>

      <div data-zippy="voices"><VoiceMarquee /></div>

      {/* ───────────────────────── the agents ───────────────────────── */}
      <div data-zippy="agents">
      <Band tone="lime" className="py-16 max-sm:py-11 sm:py-24">
        <Kicker tone="lime">The agents</Kicker>
        <h2 className={`${DISPLAY_SM} mt-4 max-w-[20ch]`}>{AGENTS_INTRO.title}</h2>
        <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-[rgba(10,10,12,0.72)]">
          {AGENTS_INTRO.body}
        </p>

        {/* the roster, one stepping forward at a time to say what it does */}
        <div className="mt-12 max-sm:mt-7">
          <AgentTeam roster={AGENTS_INTRO.roster} />
        </div>

        <div className={`mt-10 grid gap-5 max-sm:mt-7 lg:grid-cols-[1.05fr_0.95fr] ${SWIPE_5}`}>
          <ApproveFlow />
          <div className={`rounded-2xl border border-[rgba(10,10,12,0.2)] p-6 max-sm:p-5 sm:p-7 ${SLIDE}`}>
            <h3 className="font-['Space_Grotesk'] text-[15px] font-bold uppercase tracking-wide text-[#0A0A0C]">
              The rules they run under
            </h3>
            <ul className="mt-4 grid gap-2.5">
              {AGENTS_INTRO.safety.map(x => (
                <li key={x} className="flex gap-2.5 text-[14.5px] leading-relaxed text-[rgba(10,10,12,0.75)]">
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0A0A0C]" />
                  {x}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-[rgba(10,10,12,0.15)] pt-4 text-[13px] leading-relaxed text-[rgba(10,10,12,0.6)]">
              {AGENTS_INTRO.honesty}
            </p>
          </div>
        </div>
        <SwipeHint />
      </Band>
      </div>

      {/* ───────────────────────── honest comparison ───────────────────────── */}
      <div data-zippy="compare">
      <Band tone="bone" className="py-16 max-sm:py-11 sm:py-24">
        <Kicker tone="bone">Against what you already run</Kicker>
        <h2 className={`${DISPLAY_SM} mt-4 max-w-[20ch]`}>{COMPARISON.title}</h2>
        <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-slate-600">
          Salesforce, Zoho, HubSpot and the big ERPs are built for every business at once.
          A cockpit is built for yours, and that changes what you get on day one.
        </p>
        <div className="mt-6 flex items-start gap-3">
          <Agent skin="coral" size={32} mood="happy" />
          <Says tone="ink">
            Every row here is built, not on a roadmap.
          </Says>
        </div>
        <div className="mt-9 overflow-hidden rounded-2xl border border-slate-200 bg-white max-sm:mt-6">
          {/* column labels first, so a reader knows which tick is ours before the rows */}
          <div className="hidden grid-cols-[1fr_5.5rem_5.5rem] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:grid">
            <span />
            <span className="text-center">Cockpit</span>
            <span className="text-center">Platforms</span>
          </div>
          {COMPARISON.rows.map((r, i) => (
            <motion.div
              key={r.q}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.04, ease: EASE_OUT }}
              className={`grid grid-cols-[1fr_auto] items-start gap-4 border-b border-slate-100 p-5 transition-colors last:border-b-0 hover:bg-[#FAFAF5] max-sm:gap-3 max-sm:p-4 sm:grid-cols-[1fr_5.5rem_5.5rem] ${i >= 4 && !allRows ? 'max-sm:hidden' : ''}`}
            >
              <div>
                <p className="text-[15.5px] font-medium text-slate-900">{r.q}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">{r.note}</p>
              </div>
              <div className="flex items-center gap-2 sm:justify-center">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 sm:hidden">Cockpit</span>
                <Mark on={r.us} />
              </div>
              <div className="flex items-center gap-2 sm:justify-center">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 sm:hidden">Platforms</span>
                <Mark on={r.them} />
              </div>
            </motion.div>
          ))}
        </div>
        {/* outside the table box, so the last row keeps its last:border-b-0 on desktop */}
        {!allRows && COMPARISON.rows.length > 4 && (
          <button type="button" onClick={() => setAllRows(true)}
            className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-[15px] font-semibold text-slate-900 sm:hidden">
            Show all {COMPARISON.rows.length} rows <span aria-hidden>↓</span>
          </button>
        )}
      </Band>
      </div>

      {/* ───────────────────────── proof ───────────────────────── */}
      <div data-zippy="proof">
      <Band tone="ink" className="py-16 max-sm:py-11 sm:py-24">
        <AgentDrift count={5} tone="ink" />
        <Kicker>What is already built</Kicker>
        <h2 className={`${DISPLAY_SM} mt-4 max-w-[20ch]`}>{PROOF.title}</h2>
        <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-white/65">{PROOF.note}</p>
        <div className={`mt-10 grid gap-4 max-sm:mt-7 lg:grid-cols-3 ${SWIPE_5}`}>
          {PROOF.cases.map((c, i) => (
            <Reveal key={c.sector} delay={i * 0.08} className={SLIDE}>
              <motion.div
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7 max-sm:p-5 transition-colors hover:border-[#D5EB4B]/50 hover:bg-white/[0.05]"
              >
                <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.18em] text-white/45">
                  {c.sector}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.figures.map(f => (
                    <span
                      key={f}
                      className="rounded-full px-3 py-1 font-['Space_Grotesk'] text-[13px] font-bold"
                      style={{ background: 'rgba(213,235,75,0.12)', color: LIME }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-[14.5px] leading-relaxed text-white/70">{c.built}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
        <SwipeHint dark count={PROOF.cases.length} />
      </Band>
      </div>

      {/* ───────────────────────── pricing ───────────────────────── */}
      <div data-zippy="price"><Pricing /></div>

      {/* ───────────────────────── objections ───────────────────────── */}
      <div data-zippy="faq">
      <Band tone="ink" className="py-16 max-sm:py-11 sm:py-24">
        <AgentDrift count={4} tone="ink" />
        <Kicker>The fair questions</Kicker>
        <h2 className={`${DISPLAY_SM} mt-4 max-w-[20ch]`}>Reasons not to do this.</h2>
        <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-white/65">
          Every one of these has been put to us by someone who went on to buy, and by someone
          who did not. Both were right to ask.
        </p>
        <div className={`mt-9 grid gap-4 max-sm:mt-7 lg:grid-cols-2 ${SWIPE_5}`}>
          {OBJECTIONS.map((o, i) => (
            <Reveal key={o.q} delay={i * 0.05} className={SLIDE}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7 max-sm:p-5 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.05]">
                <h3 className="font-['Space_Grotesk'] text-[16px] font-bold leading-snug" style={{ color: LIME }}>
                  “{o.q}”
                </h3>
                <p className="mt-3.5 text-[14.5px] leading-relaxed text-white/70">{o.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <SwipeHint dark count={OBJECTIONS.length} />
      </Band>
      </div>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <div data-zippy="book">
      <Band tone="lime" className="py-16 max-sm:py-11 sm:py-24" id="talk">
        <div className="grid gap-10 max-sm:gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="mb-6 max-sm:mb-4 flex items-center gap-2" aria-hidden>
              <Agent skin="ink" size={38} mood="happy" phase={0} />
              <Agent skin="violet" size={38} mood="idle" phase={0.4} />
              <Agent skin="sky" size={38} mood="working" phase={0.8} />
            </div>
            <h2 className={DISPLAY_SM}>{CTA.title}</h2>
            <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-[rgba(10,10,12,0.75)]">
              {CTA.body}
            </p>
          </div>

          <DiscoveryCall />
        </div>
      </Band>
      </div>

      <div data-zippy="end"><Footer /></div>
    </>
  )
}

/**
 * The hero: the problem stated on the left, solved on the right as you scroll.
 *
 * On a desktop the hero is taller than the screen and its content sticks, so the
 * first stretch of scrolling plays the untangle instead of moving the page. On a
 * phone it is one normal screen and the untangle plays as the hero scrolls away;
 * a sticky screen on a short phone would cut the headline off.
 *
 * Not built on `Band`: Band clips with overflow-hidden, which stops position:sticky
 * from working. overflow-clip clips the same and lets sticky stick.
 */
function Hero() {
  const ref = useRef<HTMLElement>(null)
  const wide = useWide()
  const hover = useCanHover()
  const calm = useCalmMotion()
  const desk = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const phone = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const progress = wide ? desk.scrollYProgress : phone.scrollYProgress

  return (
    <section
      ref={ref}
      data-zippy="hero"
      onPointerMove={e => {
        if (!hover || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
        ref.current.style.setProperty('--my', `${e.clientY - r.top}px`)
      }}
      className="relative isolate overflow-clip bg-[#050507] text-[#FAFAFA] lg:min-h-[180svh]"
      style={{ ['--zs-stroke-color' as string]: '#FFFFFF' }}
    >
      <div className="relative flex min-h-[100svh] items-center lg:sticky lg:top-0">
        <SignalField />
        {/* a lime light that follows the cursor; parked top-right on a phone */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(640px circle at var(--mx, 78%) var(--my, 22%), rgba(213,235,75,0.13), transparent 60%)' }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><div className="zs-grain" /></div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-[#050507]" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-5 pb-14 pt-24 sm:pb-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-10 lg:pt-24">
          <div>
            <Kicker>{HERO.kicker}</Kicker>
            <Split
              as="h1"
              className="mt-4 max-w-[15ch] lg:max-w-[17ch] font-['Space_Grotesk'] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[2.15rem] sm:text-[3.1rem] lg:text-[3.5rem] xl:text-[3.9rem]"
              lines={[
                [{ text: 'Your business ' }, { text: 'runs on', as: 'stroke' }],
                [{ text: 'five apps ' }, { text: 'that don’t', as: 'lime' }],
                [{ text: 'talk to each other.' }],
              ]}
            />
            <Reveal delay={0.3}>
              <p className="mt-5 max-w-[50ch] text-[15px] leading-relaxed text-white/70 sm:text-[16.5px]">
                {HERO.sub}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <ShineButton href="#book">{HERO.cta}</ShineButton>
                <span className="text-[13.5px] text-white/45">{HERO.ctaSub}</span>
              </div>
            </Reveal>
            {/* the cue that scrolling does something here */}
            <motion.div
              aria-hidden
              className="mt-8 hidden items-center gap-3 font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/40 lg:flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              <span className="relative block h-8 w-5 rounded-full border border-white/30">
                <motion.span
                  className="absolute left-1/2 top-1.5 h-1.5 w-1 -translate-x-1/2 rounded-full bg-[#D5EB4B]"
                  animate={calm ? { opacity: [1, 0.3, 1] } : { y: [0, 10, 0], opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </span>
              Scroll to untangle
            </motion.div>
          </div>

          {/* keyed on the layout, so the scene re-wires to the right scroll range
              when the breakpoint is known (it starts as "phone" before measuring) */}
          <Untangle key={wide ? 'wide' : 'narrow'} progress={progress} />
        </div>
      </div>
    </section>
  )
}

/**
 * Pricing, in dollars, checkable in the visitor's own currency.
 *
 * Why dollars: clients are in India, the Gulf and beyond, and one currency means one
 * number to defend. The converter exists so a prospect in Dubai does not have to open
 * a calculator to decide whether to take the call — but the billing currency is stated
 * on the same line as the conversion, because a surprise at invoice time costs more
 * than the deal was worth.
 */
function Pricing() {
  const rates = useRates()
  /* Their timezone decides the currency, so a dealer in Hyderabad sees rupees without
     touching anything. The picker names the guess so they can correct it. */
  const [place] = useState(() => guessPlace())
  const [ccy, setCcy] = useState<string>(place.ccy)
  const [term, setTerm] = useState<'monthly' | 'annual'>('monthly')
  /* Phones: the per-vendor breakdown opens on a tap; the bars above already make the point. */
  const [vendors, setVendors] = useState(false)
  const rate = rates.table[ccy] ?? 1

  /* First-year cost for a ten-person team, so the comparison is like-for-like.
     Ours is setup + twelve entry-tier months; theirs come from their own pricing pages. */
  const ourYear = PRICING.ourYearTen
  const worst = Math.max(ourYear, ...PRICING.against.map(a => a.yearTen))

  return (
    <Band tone="bone" className="py-16 max-sm:py-11 sm:py-24" id="price">
      <AgentDrift count={4} tone="bone" />
      <Kicker tone="bone">What it costs</Kicker>
      <h2 className={`${DISPLAY_SM} mt-4 max-w-[18ch]`}>
        One build fee. One monthly. No per-seat tax on hiring.
      </h2>

      <div className="mt-8 max-sm:mt-5">
        <CurrencyPicker ccy={ccy} setCcy={setCcy} rates={rates} tone="light" where={place.where} />
      </div>

      <div className="mt-10 grid gap-5 max-sm:mt-6 lg:grid-cols-[1.1fr_1fr]">
        {/* our price */}
        <div className="relative overflow-hidden rounded-2xl bg-[#050507] p-7 text-white max-sm:p-5 sm:p-9">
          <div className="absolute inset-0" aria-hidden>
            <AgentDrift count={3} tone="ink" />
          </div>

          <div className="relative flex flex-wrap items-end gap-x-10 gap-y-6">
            <div>
              <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.18em] text-white/45">
                To build it · {PRICING.setupLead}
              </p>
              <Price
                usd={PRICING.setupUsd}
                ccy={ccy}
                rate={rate}
                className="mt-2 block font-['Space_Grotesk'] text-[2.6rem] font-bold leading-none sm:text-[3rem]"
                sub={PRICING.setupNote}
              />
            </div>
            <div className="h-14 w-px bg-white/15" aria-hidden />
            <div>
              <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.18em] text-white/45">
                To run it
              </p>
              {term === 'monthly' ? (
                <span className="mt-2 flex flex-wrap items-baseline gap-2">
                  <Price
                    usd={PRICING.monthlyFrom}
                    ccy={ccy}
                    rate={rate}
                    className="font-['Space_Grotesk'] text-[2rem] font-bold leading-none"
                  />
                  <span className="text-white/40">–</span>
                  <Price
                    usd={PRICING.monthlyTo}
                    ccy={ccy}
                    rate={rate}
                    className="font-['Space_Grotesk'] text-[2rem] font-bold leading-none"
                  />
                  <span className="text-[14px] text-white/55">/ month</span>
                </span>
              ) : (
                <span className="mt-2 flex flex-wrap items-baseline gap-2">
                  <Price
                    usd={PRICING.annualUsd}
                    ccy={ccy}
                    rate={rate}
                    className="font-['Space_Grotesk'] text-[2rem] font-bold leading-none"
                  />
                  <span className="text-[14px] text-white/55">/ year</span>
                </span>
              )}
              <p className="mt-2 max-w-[28ch] text-[13.5px] leading-relaxed text-white/55">
                {term === 'monthly' ? PRICING.monthlyNote : PRICING.annualNote}
              </p>
            </div>
          </div>

          {/* monthly / annual — the lime pill slides, so the switch is felt not read */}
          <div className="relative mt-7 inline-flex rounded-full border border-white/15 p-1">
            {(['monthly', 'annual'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTerm(t)}
                aria-pressed={term === t}
                className="relative rounded-full px-4 py-1.5 text-[13px] font-semibold capitalize transition-colors"
                style={{ color: term === t ? '#0A0A0C' : 'rgba(255,255,255,0.6)' }}
              >
                {term === t && (
                  <motion.span
                    layoutId="term-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: LIME }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{t === 'annual' ? 'pay yearly' : 'pay monthly'}</span>
              </button>
            ))}
          </div>

          <ul className="relative mt-8 grid gap-2.5 border-t border-white/10 pt-7 max-sm:mt-6 max-sm:gap-2 max-sm:pt-5">
            {PRICING.includes.map(x => (
              <li key={x} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
                <span aria-hidden style={{ color: LIME }}>→</span>
                {x}
              </li>
            ))}
          </ul>

          <div className="relative mt-8 flex flex-wrap items-center gap-4">
            <ShineButton href="#book">Book a discovery call</ShineButton>
            {ccy !== 'USD' && (
              <span className="text-[12.5px] text-white/45">
                Invoiced in USD ({format(PRICING.setupUsd, 'USD', 1)} to build).
              </span>
            )}
          </div>
        </div>

        {/* the alternatives */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 max-sm:p-5 sm:p-8">
          <h3 className="font-['Space_Grotesk'] text-[16px] font-bold uppercase tracking-wide text-slate-900">
            What the alternatives cost
          </h3>

          {/* first year, ten people — bars grow on scroll so the gap is obvious at a glance */}
          <div className="mt-5 grid gap-2.5">
            {[{ name: 'Agentic Cockpit', yearTen: ourYear, us: true }, ...PRICING.against].map(a => (
              <div key={a.name}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`text-[13.5px] ${'us' in a ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                    {a.name}
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[12.5px] text-slate-500">
                    {format(a.yearTen, ccy, rate)}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="relative h-full overflow-hidden rounded-full"
                    style={{ background: 'us' in a ? '#050507' : LIME }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(a.yearTen / worst) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: EASE_OUT }}
                  >
                    <span aria-hidden className={`zs-shine ${'us' in a ? 'zs-shine-ink' : ''} absolute inset-0`} />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
            First year, team of ten. Ours is the build fee plus twelve months at the entry tier.
            Theirs is licence × 10 plus the onboarding or implementation each vendor publishes.
          </p>

          {!vendors && (
            <button type="button" onClick={() => setVendors(true)}
              className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-slate-300 text-[15px] font-semibold text-slate-900 sm:hidden">
              See each vendor's pricing <span aria-hidden>↓</span>
            </button>
          )}
          <div className={`mt-7 grid gap-5 border-t border-slate-200 pt-6 ${vendors ? '' : 'max-sm:hidden'}`}>
            {PRICING.against.map(a => (
              <div key={a.name} className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[15px] font-semibold text-slate-900">{a.name}</p>
                  {a.verified && a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer"
                       className="text-[11px] text-slate-400 underline decoration-dotted underline-offset-4 hover:text-slate-700">
                      their pricing page
                    </a>
                  )}
                </div>
                <p className="mt-1 font-['JetBrains_Mono'] text-[13px] text-slate-600">{a.cost}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">{a.note}</p>
              </div>
            ))}
          </div>
          <p className={`mt-6 border-t border-slate-200 pt-4 text-[12.5px] leading-relaxed text-slate-400 ${vendors ? '' : 'max-sm:hidden'}`}>
            {PRICING.honesty}
          </p>
        </div>
      </div>
    </Band>
  )
}

/**
 * The quotes, as one moving line.
 *
 * They were a five-card wall that took a screen to scroll past and that nobody reads,
 * because a grid of testimonials looks like a grid of testimonials. A single band that
 * drifts reads as a room full of people saying the same thing, which is what it is.
 *
 * Built on the `.zs-marquee` belt the client-logo row on /agency already uses: the row
 * is rendered twice and the track travels exactly -50%, so the loop has no seam, hover
 * pauses it, and reduced motion drops the second copy and wraps. All of that is solved
 * in globals.css already and there was no reason to solve it again.
 */
function VoiceMarquee() {
  const row = (
    <div className="flex shrink-0 gap-4 pr-4">
      {VOICES.map(v => (
        <a
          key={v.url}
          href={v.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-[min(78vw,25rem)] shrink-0 flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 transition-colors hover:border-slate-500"
        >
          <p className="text-[14.5px] leading-relaxed text-slate-800">“{v.quote}”</p>
          <p className="font-['JetBrains_Mono'] text-[10.5px] uppercase tracking-[0.16em] text-slate-400">
            {v.where}
          </p>
        </a>
      ))}
    </div>
  )

  return (
    <section
      className="group relative isolate overflow-hidden border-y border-slate-200 bg-[#EDEDE6] py-6"
      aria-label="What business owners say about running several disconnected apps"
    >
      <div className="zs-marquee-mask">
        <div className="zs-marquee flex w-max" style={{ animationDuration: '72s' }}>
          {row}
          {row}
        </div>
      </div>
      <p className="mt-5 px-5 text-center text-[12px] text-slate-500">
        Hover to stop the line. Click any quote to read the original post.
      </p>
    </section>
  )
}

function Mark({ on }: { on: boolean }) {
  return on ? (
    <span
      aria-label="yes"
      className="inline-grid h-7 w-7 place-items-center rounded-full font-bold"
      style={{ background: LIME, color: '#0A0A0C' }}
    >
      ✓
    </span>
  ) : (
    <span
      aria-label="no"
      className="inline-grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-slate-400"
    >
      –
    </span>
  )
}
