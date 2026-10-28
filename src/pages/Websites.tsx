/* zippyscale.in/websites: the Web Services portal.
 *
 * Copy: src/data/websites.ts (approved draft 2, 28 Oct 2026). Design: Picasso's
 * components in src/components/websites/. Assembly, booking form and the assistant's
 * logic: Webby. No price and no currency symbol in the hero; prices only in Packages.
 */
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import HeroAgentic from '../components/websites/HeroAgentic'
import AgenticFlow from '../components/websites/AgenticFlow'
import SectionReveal from '../components/websites/SectionReveal'
import PortfolioCard from '../components/websites/PortfolioCard'
import { LIME, MONO } from '../components/websites/tokens'
import { useRates, guessPlace, Price, CurrencyPicker } from '../components/cockpit/Money'
import { useCalmMotion } from '../components/cockpit/useCalmMotion'
import WebsiteCall from './websites/WebsiteCall'
import { startLandingFunnel, trackFunnel } from '../lib/tracking'
import { startJourney } from '../lib/siteBot'
import {
  META, HERO, PROOF, PROBLEM, AGENTIC, BUILD, WORK, WORK_COPY, HOW,
  PACKAGES, PACKAGES_COPY, COMPARE, FAQ, FORM, type Kind,
} from '../data/websites'

const SiteBot = lazy(() => import('./websites/SiteBot'))

const H2 = "font-['Space_Grotesk'] text-[2rem] font-bold uppercase leading-[0.95] tracking-[-0.02em] sm:text-[2.8rem]"

function Section({ id, tone = 'bone', children, className = '' }: { id: string; tone?: 'bone' | 'ink' | 'white' | 'lime'; children: ReactNode; className?: string }) {
  const bg = { bone: 'bg-[#F5F5F0] text-[#111111]', ink: 'bg-[#111111] text-white', white: 'bg-white text-[#111111]', lime: 'bg-[#D9EA66] text-[#111111]' }[tone]
  return (
    <section id={id} className={`scroll-mt-28 py-16 sm:py-24 ${bg} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  )
}

function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`${MONO} flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] ${dark ? 'text-white/60' : 'text-[#111111]/60'}`}>
      <span aria-hidden className="inline-block h-px w-8" style={{ background: dark ? LIME : '#111111' }} />
      {children}
    </p>
  )
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function Websites() {
  const [openSignal, setOpenSignal] = useState(0)
  const [bot, setBot] = useState(false)

  useEffect(() => {
    const prevTitle = document.title
    document.title = META.title
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const prevDesc = tag?.content
    if (!tag) { tag = document.createElement('meta'); tag.name = 'description'; document.head.appendChild(tag) }
    tag.content = META.description
    return () => { document.title = prevTitle; if (tag && prevDesc !== undefined) tag.content = prevDesc }
  }, [])
  useEffect(() => startLandingFunnel('book'), [])
  useEffect(() => startJourney(), [])
  /* The assistant loads when the browser is idle, never in the way of the first paint. */
  useEffect(() => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (ric) { ric(() => setBot(true), { timeout: 4000 }); return }
    const t = window.setTimeout(() => setBot(true), 2500)
    return () => window.clearTimeout(t)
  }, [])

  const openBooking = () => { setOpenSignal(n => n + 1); scrollTo('book') }

  return (
    <>
      <Nav noBanner floating dark cockpit ctaHref="#book" ctaLabel="Book a call" ctaLabelMobile="Book a call" />

      <main>
        <div id="hero" data-journey>
          <HeroAgentic
            eyebrow={HERO.eyebrow} headline={HERO.headline} sub={HERO.sub}
            primaryLabel={HERO.primary} secondaryLabel={HERO.secondary}
            onPrimary={() => { trackFunnel('CTA_Click', { location: 'hero', text: HERO.primary }); scrollTo('packages') }}
            onSecondary={() => { trackFunnel('CTA_Click', { location: 'hero', text: HERO.secondary }); openBooking() }}
          />
        </div>

        <Proof />

        <Section id="problem" tone="white">
          <SectionReveal>
            <h2 className={`${H2} max-w-[22ch]`}>{PROBLEM.title}</h2>
          </SectionReveal>
          <ul className="mt-10 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {PROBLEM.items.map((p, i) => (
              <li key={p.t}>
                <SectionReveal className="flex gap-4 border-t border-[#111111]/10 pt-5">
                  <span className={`${MONO} text-[12px] text-[#111111]/60`}>{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-[16px] leading-relaxed text-slate-700"><strong className="font-semibold text-[#111111]">{p.t}</strong> {p.d}</p>
                </SectionReveal>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="agentic">
          <SectionReveal>
            <Eyebrow>What makes our websites agentic</Eyebrow>
            <h2 className={`${H2} mt-5 max-w-[20ch]`}>{AGENTIC.title}</h2>
          </SectionReveal>
          <div className="mt-10"><AgenticFlow blocks={AGENTIC.blocks} /></div>
        </Section>

        <Section id="build" tone="ink">
          <SectionReveal>
            <Eyebrow dark>What we build</Eyebrow>
            <h2 className={`${H2} mt-5 max-w-[20ch]`}>{BUILD.title}</h2>
          </SectionReveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BUILD.items.map(b => (
              <SectionReveal key={b.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="font-['Space_Grotesk'] text-[1.2rem] font-bold">{b.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/70">{b.d}</p>
              </SectionReveal>
            ))}
          </div>
          <h3 className="mt-14 font-['Space_Grotesk'] text-[1.2rem] font-bold">{BUILD.sellsTitle}</h3>
          <dl className="mt-5 grid gap-4 md:grid-cols-3">
            {BUILD.sells.map(s => (
              <div key={s.t} className="rounded-2xl p-6" style={{ background: 'rgba(217,234,102,0.08)', border: '1px solid rgba(217,234,102,0.25)' }}>
                <dt className="font-['Space_Grotesk'] text-[1.6rem] font-bold" style={{ color: LIME }}>{s.t}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-white/75">{s.d}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Work />

        <Section id="how" tone="white">
          <SectionReveal>
            <Eyebrow>How we work</Eyebrow>
            <h2 className={`${H2} mt-5 max-w-[20ch]`}>{HOW.title}</h2>
          </SectionReveal>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {HOW.steps.map((s, i) => (
              <li key={s.t}>
                <SectionReveal className="h-full rounded-2xl border border-[#111111]/10 bg-[#F5F5F0] p-5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#111111] font-['Space_Grotesk'] text-[13px] font-bold" style={{ color: LIME }}>{i + 1}</span>
                  <h3 className="mt-4 font-['Space_Grotesk'] text-[1.1rem] font-bold">{s.t}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-slate-700">{s.d}</p>
                </SectionReveal>
              </li>
            ))}
          </ol>
        </Section>

        <Packages onBook={openBooking} />

        <Section id="compare" tone="white">
          <SectionReveal><h2 className={`${H2} max-w-[22ch]`}>{COMPARE.title}</h2></SectionReveal>
          <Compare />
        </Section>

        <Section id="faq">
          <SectionReveal><h2 className={H2}>{FAQ.title}</h2></SectionReveal>
          <div className="mt-10 divide-y divide-[#111111]/10 border-y border-[#111111]/10">
            {FAQ.items.map(f => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-['Space_Grotesk'] text-[1.1rem] font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#111111] text-white transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-[70ch] text-[15.5px] leading-relaxed text-slate-700">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section id="talk" tone="lime">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 className={H2}>{FORM.title}</h2>
              <p className="mt-5 max-w-[34ch] text-[16px] leading-relaxed text-[#111111]/80">{FORM.sub}</p>
            </div>
            <WebsiteCall openSignal={openSignal} />
          </div>
        </Section>
      </main>

      <Footer />

      {bot && (
        <Suspense fallback={null}>
          <SiteBot onAct={a => {
            if (a === 'scroll-work') scrollTo('work')
            if (a === 'scroll-packages') scrollTo('packages')
            if (a === 'open-booking') openBooking()
          }} />
        </Suspense>
      )}
    </>
  )
}

function Proof() {
  return (
    <section id="proof" className="border-b border-[#111111]/10 bg-[#F5F5F0] py-10 text-[#111111]">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <p className="text-[15.5px] font-semibold leading-relaxed">{PROOF.line}</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[14px] text-slate-600">
            {PROOF.names.map((n, i) => (
              <li key={n} className="flex items-center gap-4">{i > 0 && <span aria-hidden className="text-[#111111]/30">·</span>}{n}</li>
            ))}
          </ul>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          {PROOF.numbers.map(x => (
            <div key={x.l} className="rounded-2xl bg-[#111111] p-4 text-white">
              <dt className="sr-only">{x.l}</dt>
              <dd>
                <span className="block font-['Space_Grotesk'] text-[2rem] font-bold leading-none" style={{ color: LIME }}>{x.n}</span>
                <span className="mt-1.5 block text-[13px] leading-snug text-white/70">{x.l}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Work() {
  const [market, setMarket] = useState<string>('All')
  const [kind, setKind] = useState<string>('All')
  const calm = useCalmMotion()
  const shown = useMemo(() => WORK.filter(w =>
    (market === 'All' || w.market === market) && (kind === 'All' || w.kinds.includes(kind as Kind))), [market, kind])

  const chip = (on: boolean) => `min-h-[40px] rounded-full border px-4 py-1.5 text-[13.5px] font-semibold transition-colors ${on ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#111111]/20 bg-white text-[#111111] hover:border-[#111111]/60'}`

  return (
    <Section id="work">
      <SectionReveal>
        <Eyebrow>Our work</Eyebrow>
        <h2 className={`${H2} mt-5 max-w-[20ch]`}>{WORK_COPY.title}</h2>
      </SectionReveal>
      <div className="mt-8 flex flex-col gap-3">
        <div role="group" aria-label="Filter by how they sell" className="flex flex-wrap gap-2">
          {WORK_COPY.markets.map(m => <button key={m} type="button" aria-pressed={market === m} onClick={() => setMarket(m)} className={chip(market === m)}>{m}</button>)}
        </div>
        <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2">
          {WORK_COPY.kinds.map(k => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={chip(kind === k)}>{k === 'All' ? 'All' : WORK_COPY.kindLabel[k as Kind]}</button>)}
        </div>
        <p className="text-[13px] text-slate-600" role="status">{shown.length} of {WORK.length} shown</p>
      </div>
      <LayoutGroup>
        <motion.ul layout={!calm} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {shown.map(w => (
              <motion.li key={w.slug} layout={!calm}
                initial={{ opacity: 0, scale: calm ? 1 : 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: calm ? 1 : 0.96 }}
                transition={{ duration: 0.3 }}>
                <PortfolioCard
                  client={w.client}
                  sector={w.sector}
                  country={w.where || w.market}
                  tags={[w.market, ...w.kinds, ...(w.own ? ['ZippyScale brand'] : []), ...(w.demo ? ['Demo website'] : [])]}
                  metric={null}
                  /* Demo websites sit behind a client login: no link, so no href */
                  href={(w.links[0] ?? undefined) as string}
                  image={`/websites/portfolio/${w.slug}.webp`}
                  imageAlt={`${w.client}: ${w.built}`}
                />
                <p className="mt-2 px-3 text-[13.5px] leading-snug text-slate-600">{w.built}</p>
                {w.links.length > 1 && (
                  <p className="mt-1 px-3 text-[13px]">
                    {w.links.slice(1).map(l => (
                      <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#111111] underline underline-offset-4">
                        Also live: {l.replace(/^https?:\/\//, '')}
                      </a>
                    ))}
                  </p>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </LayoutGroup>
    </Section>
  )
}

function Packages({ onBook }: { onBook: () => void }) {
  const rates = useRates()
  const [place] = useState(() => guessPlace())
  const [ccy, setCcy] = useState(place.ccy)
  const rate = rates.table[ccy] ?? 1
  return (
    <Section id="packages" tone="ink">
      <SectionReveal>
        <Eyebrow dark>Packages</Eyebrow>
        <h2 className={`${H2} mt-5 max-w-[20ch]`}>{PACKAGES_COPY.title}</h2>
      </SectionReveal>
      <div className="mt-8"><CurrencyPicker ccy={ccy} setCcy={setCcy} rates={rates} tone="dark" where={place.where} /></div>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PACKAGES.map(p => (
          <SectionReveal key={p.id}
            className={`relative flex flex-col rounded-3xl p-7 ${p.popular ? 'bg-[#D9EA66] text-[#111111]' : 'border border-white/12 bg-white/[0.04] text-white'}`}>
            {p.popular && <span className={`${MONO} absolute right-5 top-5 rounded-full bg-[#111111] px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white`}>Most popular</span>}
            <h3 className="font-['Space_Grotesk'] text-[1.4rem] font-bold">{p.id}</h3>
            <p className="mt-3 flex items-baseline gap-2">
              {p.from && <span className="text-[14px] font-semibold opacity-70">from</span>}
              <Price usd={p.usd} ccy={ccy} rate={rate} className="font-['Space_Grotesk'] text-[2.4rem] font-bold leading-none" />
            </p>
            {ccy !== 'USD' && <p className="mt-1 text-[12.5px] opacity-60">Billed in USD: ${p.usd.toLocaleString('en-US')}</p>}
            <p className={`mt-4 text-[15px] leading-relaxed ${p.popular ? 'text-[#111111]/80' : 'text-white/70'}`}>{p.for}</p>
            <ul className={`mt-5 grid gap-2.5 border-t pt-5 ${p.popular ? 'border-[#111111]/15' : 'border-white/10'}`}>
              {p.items.map(x => (
                <li key={x} className={`flex gap-3 text-[14.5px] leading-relaxed ${p.popular ? 'text-[#111111]' : 'text-white/80'}`}>
                  <span aria-hidden style={{ color: p.popular ? '#111111' : LIME }}>✓</span>{x}
                </li>
              ))}
            </ul>
            <button type="button" onClick={onBook}
              className={`mt-7 min-h-[48px] rounded-full px-6 font-['Space_Grotesk'] text-[14px] font-bold uppercase tracking-[0.06em] ${p.popular ? 'bg-[#111111] text-white' : 'text-[#111111]'}`}
              style={p.popular ? undefined : { background: LIME }}>
              Book a call about {p.id}
            </button>
          </SectionReveal>
        ))}
      </div>
      <p className="mt-8 text-[14.5px] text-white/70"><strong className="text-white">Add-ons:</strong> {PACKAGES_COPY.addOns.join(' · ')}</p>
      <p className="mt-3 text-[15px] text-white/80">{PACKAGES_COPY.notSure}</p>
    </Section>
  )
}

function Compare() {
  return (
    <>
      {/* wide screens: a real table */}
      <div className="mt-10 hidden overflow-hidden rounded-3xl border border-[#111111]/10 md:block">
        <table className="w-full border-collapse text-left text-[14.5px]">
          <thead>
            <tr className="bg-[#F5F5F0]">
              <th scope="col" className="p-4"><span className="sr-only">Feature</span></th>
              {COMPARE.cols.map((c, i) => (
                <th key={c} scope="col" className={`p-4 font-['Space_Grotesk'] font-bold ${i === 2 ? 'bg-[#111111] text-white' : ''}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE.rows.map(r => (
              <tr key={r[0]} className="border-t border-[#111111]/10">
                <th scope="row" className="p-4 font-semibold">{r[0]}</th>
                <td className="p-4 text-slate-600">{r[1]}</td>
                <td className="p-4 text-slate-600">{r[2]}</td>
                <td className="bg-[#111111] p-4 font-semibold text-white"><span aria-hidden className="mr-2" style={{ color: LIME }}>✓</span>{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* phones: one card per row, nothing to scroll sideways */}
      <dl className="mt-8 grid gap-3 md:hidden">
        {COMPARE.rows.map(r => (
          <div key={r[0]} className="rounded-2xl border border-[#111111]/10 p-4">
            <dt className="font-['Space_Grotesk'] font-bold">{r[0]}</dt>
            <dd className="mt-3 grid gap-1.5 text-[14px]">
              <span className="flex justify-between gap-3 text-slate-600"><span>{COMPARE.cols[0]}</span><span className="text-right">{r[1]}</span></span>
              <span className="flex justify-between gap-3 text-slate-600"><span>{COMPARE.cols[1]}</span><span className="text-right">{r[2]}</span></span>
              <span className="flex justify-between gap-3 rounded-lg bg-[#111111] px-3 py-2 font-semibold text-white"><span style={{ color: LIME }}>{COMPARE.cols[2]}</span><span className="text-right">{r[3]}</span></span>
            </dd>
          </div>
        ))}
      </dl>
    </>
  )
}
