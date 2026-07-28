import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import ClientWall from '../components/growth/ClientWall'
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
    <section className="relative overflow-hidden bg-[#1A1A2E] text-white">
      {/* slow gradient field */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.55]">
        <motion.div
          className="absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(213,235,75,0.22), transparent 65%)' }}
          animate={{ x: [0, 70, 0], y: [0, 45, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-48 -right-24 h-[34rem] w-[34rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(120,140,255,0.20), transparent 65%)' }}
          animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 pt-28 pb-20 sm:pt-36 sm:pb-28">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center rounded-full bg-[#D5EB4B] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0c0c10]"
        >
          Growth Marketing Agency
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="mt-6 font-['Space_Grotesk'] font-bold leading-[1.04] tracking-[-0.03em] text-[2.5rem] sm:text-[4rem]"
        >
          We are your growth partners
          <span className="block text-[#D5EB4B]">— not just another agency.</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-7 max-w-2xl text-lg sm:text-xl text-white/75 leading-relaxed"
        >
          <p>
            One partner for your entire front end — website, ads, CRM, lead qualification,
            closing support and sales training. We build the structure, then we work inside it
            with you.
          </p>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-base text-white/55">
            <span>Built for</span>
            {/* grid-stack so every option occupies the same cell — no reflow as it cycles */}
            <span className="grid">
              {/* invisible sizer: reserves the width of the longest option */}
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
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-12 flex flex-wrap gap-3"
        >
          <a
            href="#enquire"
            className="inline-flex items-center rounded-lg bg-[#D5EB4B] px-7 py-3.5 text-sm font-bold text-[#0c0c10] hover:bg-[#E4F57A] transition-colors"
          >
            Book a growth audit
          </a>
          <a
            href="/case-studies"
            className="inline-flex items-center rounded-lg border border-white/25 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            See our work
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────────────  Results  ───────────────────────── */

function ResultsBar() {
  return (
    <section className="bg-[#14141F] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {METRICS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <div className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl text-[#D5EB4B]">
                {m.value}
              </div>
              <div className="mt-1.5 text-sm text-white/70 leading-snug">{m.label}</div>
              {m.note && <div className="text-xs text-white/40 mt-0.5">{m.note}</div>}
            </motion.div>
          ))}
        </div>
        <p className="mt-9 text-sm text-white/45 border-t border-white/10 pt-6">
          We report on <span className="text-white/80 font-semibold">CAC — cost to acquire a
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
    <section className="bg-[#FFFDF7]">
      <div className="max-w-6xl mx-auto px-5 py-20 sm:py-24">
        <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-[2.75rem] leading-tight tracking-[-0.02em] text-[#1A1A2E] max-w-3xl">
          A one-stop solution for everything in front of your customer.
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-[#4B5563] leading-relaxed">
          Most agencies hand you leads and leave. We build the whole front end — and stay
          hands-on through structuring, training and closing.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-7"
            >
              <div className="font-['Space_Grotesk'] text-sm font-bold text-[#B8CF2E]">{p.num}</div>
              <h3 className="mt-2 font-['Space_Grotesk'] font-bold text-2xl text-[#1A1A2E]">
                {p.title}
              </h3>
              <p className="mt-2 text-[#4B5563]">{p.lead}</p>
              <ul className="mt-5 space-y-2.5">
                {p.items.map(it => (
                  <li key={it} className="flex gap-2.5 text-sm text-[#374151] leading-relaxed">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#D5EB4B]" />
                    {it}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────  Clients  ───────────────────────── */

function ClientsSection() {
  return (
    <section className="bg-white border-y border-[#E5E7EB]">
      <div className="max-w-6xl mx-auto px-5 py-20 sm:py-24">
        <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl tracking-[-0.02em] text-[#1A1A2E]">
          The brands we build for
        </h2>
        <p className="mt-4 max-w-2xl text-[#4B5563]">
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
  return (
    <section className="bg-[#FFFDF7]">
      <div className="max-w-6xl mx-auto px-5 py-20 sm:py-24">
        <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl tracking-[-0.02em] text-[#1A1A2E]">
          Five segments we know deeply
        </h2>
        <p className="mt-4 max-w-2xl text-[#4B5563]">
          We do not take every brief. These are the businesses whose funnels, objections and
          sales cycles we have already built for.
        </p>

        <div className="mt-12 space-y-4">
          {VERTICALS.map((v, i) => (
            <motion.div
              key={v.slug}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="grid md:grid-cols-[1fr_auto] gap-6 items-center rounded-2xl border border-[#E5E7EB] bg-white p-7"
            >
              <div>
                <h3 className="font-['Space_Grotesk'] font-bold text-xl text-[#1A1A2E]">
                  {v.name}
                </h3>
                <p className="mt-2 text-[#4B5563] leading-relaxed max-w-2xl">{v.blurb}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {v.clients.map(slug => {
                  const c = CLIENTS.find(x => x.slug === slug)!
                  return (
                    <span
                      key={slug}
                      className="rounded-full border border-[#E5E7EB] bg-[#FAFAF7] px-3 py-1 text-xs font-medium text-[#4B5563]"
                    >
                      {c.name}
                    </span>
                  )
                })}
              </div>
            </motion.div>
          ))}
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
    'w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#D5EB4B] focus:outline-none focus:ring-2 focus:ring-[#D5EB4B]/30 transition'

  return (
    <section id="enquire" className="bg-[#1A1A2E] text-white scroll-mt-24">
      <div className="max-w-3xl mx-auto px-5 py-20 sm:py-24">
        <h2 className="font-['Space_Grotesk'] font-bold text-3xl sm:text-4xl tracking-[-0.02em]">
          Tell us what needs fixing.
        </h2>
        <p className="mt-4 text-white/70">
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
                {VERTICAL_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select name="spend" className={field} defaultValue="">
                <option value="" disabled>Current monthly ad spend</option>
                {SPEND_BANDS.map(s => <option key={s} value={s}>{s}</option>)}
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
      <Nav noBanner ctaHref="#enquire" />
      <main>
        <GrowthHero />
        <ResultsBar />
        <WhatWeDo />
        <ClientsSection />
        <VerticalsSection />
        <EnquiryForm />
      </main>
      <Footer />
    </>
  )
}
