import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import ClientWall from '../components/growth/ClientWall'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import VideoWall from '../components/growth/VideoWall'
import SmoothScroll from '../components/growth/SmoothScroll'
import { FrostGrid, Eyebrow, Display, Panel, Check, PANEL_SHADOW, HUD_SHADOW } from '../components/growth/linea'
import { METRICS, PILLARS, VERTICALS, CLIENTS, VERTICAL_OPTIONS, SPEND_BANDS } from '../data/growth'

const ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzzacqtwW_Wfk3EB-4WmCQrNFK92yeT2ziRNJvV4Ujy_468HHwCRHiGN0OkxTMLZyKJKQ/exec'

const ROTATING = [
  'luxury & bespoke retail',
  'international schools',
  'networking groups',
  'PR agencies',
  'commercial real estate',
]

/* ─────────────────────────  Hero  ───────────────────────── */

function GrowthHero() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(v => (v + 1) % ROTATING.length), 2600)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="relative isolate flex min-h-[94vh] items-center overflow-hidden bg-[#0B0B14] text-white">
      {/* ── the engine diagram, full-bleed ──
          object-cover + a very slow drift so it reads as the room the copy sits in,
          not a picture placed on the page. Every edge is dissolved into the page
          colour by the gradient stack below, so there is no visible frame. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.img
          src="/growth-flow.webp"
          alt=""
          aria-hidden
          width={1672}
          height={941}
          className="h-full w-full scale-[1.18] object-cover object-center opacity-[0.58] sm:scale-105"
          initial={{ scale: 1.22 }}
          animate={{ scale: [1.18, 1.24, 1.18] }}
          transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* dissolve the rectangle: vignette + all four edges into #0B0B14 */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 105% 85% at 50% 52%, transparent 12%, rgba(11,11,20,0.55) 62%, #0B0B14 96%)' }}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0B0B14] via-[#0B0B14]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#0B0B14] via-[#0B0B14]/85 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#0B0B14] to-transparent" />
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#0B0B14] to-transparent" />
        {/* legibility scrim directly behind the copy — a soft dark ellipse in the middle
            only, so the funnel keeps its glow out at the edges */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 62% 48% at 50% 46%, rgba(11,11,20,0.78), rgba(11,11,20,0.25) 62%, transparent 78%)' }}
        />
        <div className="absolute inset-0 bg-[#0B0B14]/40 sm:bg-[#0B0B14]/25" />
      </div>

      <div className="relative mx-auto w-full max-w-4xl px-5 py-28 text-center sm:py-32">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center rounded-full border border-[#D5EB4B]/40 bg-[#D5EB4B]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#D5EB4B] backdrop-blur-sm"
        >
          Growth Marketing Agency
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mt-8 font-['Space_Grotesk'] font-bold leading-[1.02] tracking-[-0.035em] text-[2.75rem] sm:text-[4.5rem] lg:text-[5.25rem] [text-shadow:0_2px_40px_rgba(11,11,20,0.85)]"
        >
          We are your
          <br />
          growth partners
          <span className="mt-1 block bg-gradient-to-r from-[#D5EB4B] via-[#E4F57A] to-[#B8CF2E] bg-clip-text text-transparent">
            not just another agency.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.22 }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl [text-shadow:0_1px_20px_rgba(11,11,20,0.9)]"
        >
          Ads, landing pages, CRM, qualification, closing and sales training —
          one team owning every step between a stranger and a signed client.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-6 flex flex-wrap items-baseline justify-center gap-x-2 text-base text-white/50"
        >
          <span>Built for</span>
          {/* grid-stack so every option occupies the same cell — no reflow as it cycles */}
          <span className="grid">
            <span aria-hidden className="col-start-1 row-start-1 invisible font-semibold">
              {ROTATING.reduce((a, b) => (b.length > a.length ? b : a))}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.32 }}
                className="col-start-1 row-start-1 font-semibold text-[#D5EB4B]"
              >
                {ROTATING[i]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38 }}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          <a
            href="#enquire"
            className="inline-flex items-center rounded-lg bg-[#D5EB4B] px-8 py-4 text-sm font-bold text-[#0c0c10] shadow-[0_10px_40px_-12px_rgba(213,235,75,0.6)] transition-colors hover:bg-[#E4F57A]"
          >
            Book a growth audit
          </a>
          <a
            href="#conversations"
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            Hear from our clients
          </a>
        </motion.div>

        {/* screen-reader description of the backdrop, which is decorative for sighted users */}
        <p className="sr-only">
          Our growth engine: Google Ads, Meta Ads, WhatsApp marketing, email marketing and manual
          outreach feed into lead capture and CRM integration, then lead qualification, sales and
          deal closure, and finally client retention and growth.
        </p>
      </div>
    </section>
  )
}

/* ─────────────────────────  Results  ───────────────────────── */

function ResultsBar() {
  return (
    <section className="relative overflow-hidden bg-[#EDF2F7]">
      <FrostGrid />
      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <Eyebrow>By the numbers</Eyebrow>
        <div
          className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-white/80 bg-[#D6E2EC] md:grid-cols-5"
          style={{ boxShadow: HUD_SHADOW }}
        >
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/85 p-6 backdrop-blur-xl"
            >
              <AnimatedCounter
                target={m.value}
                prefix={m.prefix}
                suffix={m.suffix}
                duration={1.8}
                className="block font-['Space_Grotesk'] text-[2.15rem] font-bold tracking-[-0.03em] text-[#1A1A2E] tabular-nums"
              />
              <div className="mt-1.5 text-sm leading-snug text-[#4B5563]">{m.label}</div>
              {m.note && <div className="mt-0.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.12em] text-[#9CA3AF]">{m.note}</div>}
            </motion.div>
          ))}
        </div>
        <p className="mt-7 max-w-3xl text-sm text-[#6B7280]">
          We report on <span className="font-semibold text-[#1A1A2E]">CAC — cost to acquire a
          client</span>, not cost per lead. Cheap leads that never close are the most expensive
          thing in marketing.
        </p>
      </div>
    </section>
  )
}

/* ─────────────────────────  Pillars  ───────────────────────── */

function WhatWeDo() {
  return (
    <section className="relative overflow-hidden bg-[#F4F7FA]">
      <FrostGrid />
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <Eyebrow>What we do</Eyebrow>
        <Display className="mt-7 max-w-3xl text-[#1A1A2E]">
          A one-stop solution for everything
          <br className="hidden sm:block" /> in front of your customer.
        </Display>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#4B5563]">
          Most agencies hand you leads and leave. We build the whole front end — and stay
          hands-on through structuring, training and closing.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Panel key={p.num} delay={i * 0.09} className="p-7">
              <span className="font-['JetBrains_Mono'] text-xs font-bold tracking-[0.16em] text-[#B8CF2E]">
                {p.num}
              </span>
              <h3 className="mt-2.5 font-['Space_Grotesk'] text-2xl font-bold tracking-[-0.02em] text-[#1A1A2E]">
                {p.title}
              </h3>
              <p className="mt-2 text-[#4B5563]">{p.lead}</p>
              <ul className="mt-6 space-y-3">
                {p.items.map(it => <Check key={it}>{it}</Check>)}
              </ul>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────  Clients  ───────────────────────── */

function ClientsSection() {
  return (
    <section className="relative overflow-hidden bg-[#EDF2F7]">
      <FrostGrid />
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <Eyebrow>Client roster</Eyebrow>
        <Display className="mt-7 text-[#1A1A2E]">The brands we build for</Display>
        <p className="mt-6 max-w-2xl text-lg text-[#4B5563]">
          Across couture, education, membership, media, commercial real estate and technology.
        </p>
        <div className="mt-12">
          <ClientWall />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────  Verticals  ───────────────────────── */

function VerticalsSection() {
  const [active, setActive] = useState(0)
  return (
    <section className="relative overflow-hidden bg-[#F4F7FA]">
      <FrostGrid />
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <Eyebrow>Segments</Eyebrow>
        <Display className="mt-7 text-[#1A1A2E]">Five segments we know deeply</Display>
        <p className="mt-6 max-w-2xl text-lg text-[#4B5563]">
          We do not take every brief. These are the businesses whose funnels, objections and
          sales cycles we have already built for.
        </p>

        <div className="mt-12 flex flex-wrap gap-2">
          {VERTICALS.map((v, idx) => (
            <button
              key={v.slug}
              onClick={() => setActive(idx)}
              aria-pressed={active === idx}
              className={`relative rounded-full px-5 py-2.5 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                active === idx ? 'text-[#0c0c10]' : 'text-[#6B7280] hover:text-[#1A1A2E]'
              }`}
            >
              {active === idx && (
                <motion.span
                  layoutId="vertical-pill"
                  className="absolute inset-0 rounded-full bg-[#D5EB4B]"
                  style={{ boxShadow: '0 10px 26px -14px rgba(184,207,46,0.9)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative">{v.name}</span>
            </button>
          ))}
        </div>

        <div
          className="mt-6 min-h-[200px] rounded-[14px] border border-white/80 bg-white/70 p-7 backdrop-blur-xl sm:p-9"
          style={{ boxShadow: PANEL_SHADOW }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={VERTICALS[active].slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="font-['Space_Grotesk'] text-2xl font-bold tracking-[-0.02em] text-[#1A1A2E]">
                {VERTICALS[active].name}
              </h3>
              <p className="mt-3 max-w-2xl leading-relaxed text-[#4B5563]">
                {VERTICALS[active].blurb}
              </p>
              {VERTICALS[active].clients.length > 0 && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9CA3AF]">
                    Who we do this for
                  </span>
                  {VERTICALS[active].clients.map(slug => {
                    const c = CLIENTS.find(x => x.slug === slug)!
                    return (
                      <span
                        key={slug}
                        className="rounded-full border border-[#DDE5EC] bg-white/80 px-3 py-1 text-xs font-medium text-[#4B5563]"
                      >
                        {c.name}
                      </span>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────  Enquiry form  ───────────────────────── */

function EnquiryForm() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') || '').trim()
    const rawPhone = String(f.get('phone') || '').trim()
    const phone = rawPhone.replace(/[\s\-+]/g, '').replace(/^91/, '')
    const business = String(f.get('business') || '').trim()

    if (!name) return setErr('Please enter your name.')
    if (!/^[6-9]\d{9}$/.test(phone)) return setErr('Please enter a valid 10-digit mobile number.')
    if (!business) return setErr('Please enter your business name.')
    setErr('')
    setBusy(true)

    // Key names below are the ones the Apps Script backend reads (see apps-script/Code.gs).
    // It pushes to GHL first, then mirrors the row into the Sheet — don't rename these.
    const vertical = String(f.get('vertical') || '')
    const payload = {
      name,
      phone,
      email: String(f.get('email') || ''),
      business_name: business,
      industry: vertical,
      marketing_spend: String(f.get('spend') || ''),
      automate_areas: String(f.get('challenge') || ''),
      source: 'growth-page-enquiry',
      page: '/growth',
      submittedAt: new Date().toISOString(),
    }

    // Apps Script doesn't answer a CORS preflight, so this is fire-and-forget:
    // sendBeacon (text/plain, no preflight) with a no-cors fetch as fallback.
    // The response is unreadable cross-origin either way — never gate the UI on it.
    const body = JSON.stringify(payload)
    let delivered = false
    try {
      delivered = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }))
    } catch { /* fall through */ }
    if (!delivered) {
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body,
          keepalive: true,
        })
      } catch { /* silent — request still leaves the browser */ }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    w.dataLayer?.push({ event: 'growth_form_submit', vertical })
    w.fbq?.('track', 'Lead', { content_name: 'growth-enquiry' })

    setBusy(false)
    setSent(true)
  }

  const field =
    'w-full rounded-[10px] border border-white/15 bg-white/[0.06] px-4 py-3.5 text-white placeholder-white/40 backdrop-blur-sm transition focus:border-[#D5EB4B]/60 focus:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-[#D5EB4B]/25'

  return (
    <section id="enquire" className="relative overflow-hidden bg-[#12121C] text-white scroll-mt-24">
      <div className="max-w-3xl mx-auto px-5 py-20 sm:py-24">
        <Eyebrow tone="dark">Start here</Eyebrow>
        <Display className="mt-7 text-white">Tell us what needs fixing.</Display>
        <p className="mt-6 text-lg text-white/70">
          We will look at your funnel and come back with where the leak is. No deck, no pitch
          theatre.
        </p>

        {sent ? (
          <div className="mt-10 rounded-2xl border border-[#D5EB4B]/40 bg-[#D5EB4B]/10 p-8">
            <h3 className="font-['Space_Grotesk'] font-bold text-2xl text-[#D5EB4B]">
              Got it — we will be in touch.
            </h3>
            <p className="mt-3 text-white/75">
              Your details are with our team. Expect a message shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-10 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input name="name" placeholder="Your name" className={field} autoComplete="name" />
              <input name="phone" placeholder="Mobile number" inputMode="numeric" className={field} autoComplete="tel" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <input name="business" placeholder="Business name" className={field} />
              <input name="email" type="email" placeholder="Email (optional)" className={field} autoComplete="email" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <select name="vertical" className={field} defaultValue="">
                <option value="" disabled>Your segment</option>
                {VERTICAL_OPTIONS.map(v => <option key={v} value={v} className="text-[#1A1A2E]">{v}</option>)}
              </select>
              <select name="spend" className={field} defaultValue="">
                <option value="" disabled>Current monthly ad spend</option>
                {SPEND_BANDS.map(s => <option key={s} value={s} className="text-[#1A1A2E]">{s}</option>)}
              </select>
            </div>
            <textarea
              name="challenge"
              rows={3}
              placeholder="What do you want to fix? (optional)"
              className={field}
            />
            {err && <p className="text-sm text-[#FCA5A5]">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#D5EB4B] px-7 py-4 font-bold text-[#0c0c10] hover:bg-[#E4F57A] disabled:opacity-60 transition-colors"
            >
              {busy ? 'Sending…' : 'Request my growth audit'}
            </button>
            <p className="text-xs text-white/40 text-center">
              We use your details only to contact you about this enquiry.{' '}
              <a href="/privacy" className="underline hover:text-white/70">Privacy policy</a>.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────  Page  ───────────────────────── */

export default function Growth() {
  useEffect(() => {
    document.title = 'ZippyScale Growth | Growth Marketing Agency for High-Ticket Businesses'
  }, [])

  return (
    <>
      <SmoothScroll />
      <Nav noBanner floating ctaHref="#enquire" />
      <main>
        <GrowthHero />
        <ResultsBar />
        <WhatWeDo />
        <ClientsSection />
        <VideoWall />
        <VerticalsSection />
        <EnquiryForm />
      </main>
      <Footer />
    </>
  )
}
