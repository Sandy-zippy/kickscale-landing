import { useState, useEffect } from 'react'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import ClientMarquee from '../components/growth/ClientMarquee'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import VideoWall from '../components/growth/VideoWall'
import SmoothScroll from '../components/growth/SmoothScroll'
import SegmentChips from '../components/growth/SegmentChips'
import OrbitField from '../components/growth/OrbitField'
import SegmentCards from '../components/growth/SegmentCards'
import SegmentInsight from '../components/growth/SegmentInsight'
import EngineTimeline from '../components/growth/EngineTimeline'
import SpinBadge from '../components/growth/SpinBadge'
import {
  Band,
  Kicker,
  Pill,
  Reveal,
  SignalField,
  Split,
  DISPLAY,
  DISPLAY_SM,
  LIME,
} from '../components/growth/kinetic'
import { METRICS, PILLARS, VERTICAL_OPTIONS, SPEND_BANDS } from '../data/growth'

const ENDPOINT =
  'https://script.google.com/macros/s/AKfycbzzacqtwW_Wfk3EB-4WmCQrNFK92yeT2ziRNJvV4Ujy_468HHwCRHiGN0OkxTMLZyKJKQ/exec'

/* ─────────────────────────  Hero  ───────────────────────── */

function GrowthHero() {
  return (
    <section
      className="relative isolate flex min-h-[94vh] items-center overflow-hidden bg-[#050507] pt-28 pb-16 text-white sm:pt-32"
      // outlined display text needs an explicit colour; this section is not a
      // <Band>, so it declares its own (see .zs-stroke in globals.css)
      style={{ ['--zs-stroke-color' as string]: '#FFFFFF' }}
    >
      <SignalField count={54} />
      {/* radial lift behind the copy so the black has depth without an image */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 30% 42%, #16161F 0%, #0B0B12 45%, #050507 76%)',
        }}
      />

      {/* Copy column stays the wider one: the two hero CTAs sit side by side in
          ~545px and wrap to two rows below that. */}
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8">
        <div>
          <Kicker>Growth marketing agency · Hyderabad</Kicker>

          <Split
            as="h1"
            className={`mt-7 ${DISPLAY}`}
            lines={[
              [{ text: 'We are your', as: 'stroke-serif' }],
              [{ text: 'Growth', as: 'lime' }],
              [{ text: 'Partners.' }],
            ]}
          />

          <p className="mt-7 max-w-xl text-[1.05rem] leading-relaxed text-white/60 sm:text-lg">
            Not just another agency. Ads, landing pages, CRM, qualification, closing and sales
            training — one team owning every step between a stranger and a signed client.
          </p>

          <SegmentChips />

          <div className="mt-10 flex flex-wrap gap-3">
            <Pill href="#enquire">Book a growth audit</Pill>
            <Pill href="#conversations" variant="ghost">
              Hear from our clients
            </Pill>
          </div>
        </div>

        <div className="hidden lg:block">
          <OrbitField />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────  Positioning + pillars  ───────────────────────── */

function WhoWeAre() {
  return (
    <Band tone="bone" className="py-20 sm:py-28">
      <Kicker tone="bone">More than an agency</Kicker>

      <div className="mt-7 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <Split
          className={`${DISPLAY} text-[#111214]`}
          lines={[
            [{ text: 'We run ' }, { text: 'marketing', as: 'lime' }],
            [{ text: 'and ' }, { text: 'sales', as: 'stroke' }, { text: '.' }],
          ]}
        />
        <Reveal delay={0.12}>
          <p className="text-[1.05rem] leading-relaxed text-[#4B5563]">
            Most agencies hand you leads and leave. We build the whole front end — and stay
            hands-on through structuring, training and closing. One team, one number to answer
            for.
          </p>
          <div className="mt-6">
            <Pill href="#enquire" variant="ink">
              Book a growth audit
            </Pill>
          </div>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal key={p.num} delay={i * 0.09}>
            <div className="h-full rounded-[24px] border border-[#E2E2D8] bg-white p-7">
              <span className="font-['JetBrains_Mono'] text-xs font-bold tracking-[0.16em] text-[#8CA31B]">
                {p.num}
              </span>
              <h3 className="mt-2.5 font-['Space_Grotesk'] text-[1.6rem] font-bold uppercase tracking-[-0.02em] text-[#111214]">
                {p.title}
              </h3>
              <p className="mt-2 text-[#4B5563]">{p.lead}</p>
              <ul className="mt-6 space-y-3">
                {p.items.map(it => (
                  <li key={it} className="flex gap-3 text-[14.5px] leading-relaxed text-[#374151]">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                      className="mt-1 shrink-0"
                    >
                      <path
                        d="M3 8.4l3.2 3.2L13 4.8"
                        stroke="#7E9B12"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Band>
  )
}

/* ─────────────────────────  Clients  ───────────────────────── */

function ClientsSection() {
  return (
    <Band tone="bone" className="pb-20 sm:pb-24">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Kicker tone="bone">Client roster</Kicker>
          <h2 className={`mt-6 ${DISPLAY_SM} text-[#111214]`}>The brands we build for</h2>
        </div>
        <p className="max-w-sm text-[#4B5563] md:text-right">
          Across couture, education, membership, media, commercial real estate and technology.
        </p>
      </div>
      <div className="mt-10">
        <ClientMarquee />
      </div>
    </Band>
  )
}

/* ─────────────────────────  Metrics  ───────────────────────── */

function MetricBand() {
  return (
    <Band tone="lime" className="py-14 sm:py-16">
      <div className="grid grid-cols-2 gap-y-10 md:grid-cols-5">
        {METRICS.map((m, i) => (
          <Reveal
            key={m.label}
            delay={i * 0.07}
            className={`px-2 sm:px-4 ${i > 0 ? 'md:border-l md:border-[#0A0A0C]/15' : ''}`}
          >
            <AnimatedCounter
              target={m.value}
              prefix={m.prefix}
              suffix={m.suffix}
              duration={1.8}
              className="block font-['Space_Grotesk'] text-[2.6rem] font-bold leading-none tracking-[-0.04em] text-[#0A0A0C] tabular-nums sm:text-[3rem]"
            />
            <div className="mt-2.5 text-[13.5px] font-semibold leading-snug text-[#0A0A0C]">
              {m.label}
            </div>
            {m.note && (
              <div className="mt-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.12em] text-[#0A0A0C]/55">
                {m.note}
              </div>
            )}
          </Reveal>
        ))}
      </div>
      <p className="mt-10 max-w-3xl text-sm text-[#0A0A0C]/70">
        We report on <span className="font-bold text-[#0A0A0C]">CAC — cost to acquire a client</span>,
        not cost per lead. Cheap leads that never close are the most expensive thing in marketing.
      </p>
    </Band>
  )
}

/* ─────────────────────────  Segments  ───────────────────────── */

function SegmentsSection() {
  return (
    <Band tone="ink" className="py-20 sm:py-28">
      <SignalField count={28} grid={false} />
      <Kicker>Segments</Kicker>
      <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Split
          className={DISPLAY}
          lines={[[{ text: 'Six segments' }], [{ text: 'we know ' }, { text: 'deeply', as: 'stroke-serif' }]]}
        />
        <p className="max-w-sm text-white/55">
          We do not take every brief. These are the businesses whose funnels, objections and sales
          cycles we have already built for.
        </p>
      </div>
      <SegmentCards />
    </Band>
  )
}

/* ─────────────────────────  Playbooks  ───────────────────────── */

function UnderstandSection() {
  return (
    <Band tone="ink" className="py-20 sm:py-24">
      <Kicker>What we understand</Kicker>
      <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Split
          className={DISPLAY}
          lines={[[{ text: 'We already know' }], [{ text: "what's broken.", as: 'stroke-serif' }]]}
        />
        <p className="max-w-md text-white/55">
          Six segments, and the same conversations in each of them. If you recognise your own
          business below, we have built this before.
        </p>
      </div>
      <div className="mt-12">
        <SegmentInsight />
      </div>
    </Band>
  )
}

/* ─────────────────────────  Engine  ───────────────────────── */

function EngineSection() {
  return (
    <Band tone="ink" className="py-20 sm:py-28">
      <SignalField count={34} />
      <Kicker>The growth engine</Kicker>
      <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <Split
          className={DISPLAY}
          lines={[[{ text: 'What makes' }], [{ text: 'us ' }, { text: 'different?', as: 'stroke' }]]}
        />
        <p className="max-w-sm text-white/55">
          Five stages, built once and then running without anyone remembering to run them.
        </p>
      </div>
      <EngineTimeline />
    </Band>
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
    'w-full rounded-[14px] border border-white/12 bg-white/[0.04] px-4 py-3.5 text-white placeholder-white/35 backdrop-blur-sm transition focus:border-[#D5EB4B]/60 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-[#D5EB4B]/25'

  return (
    <Band tone="ink" id="enquire" className="py-20 sm:py-28" inner="max-w-3xl">
      <SignalField count={30} />

      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <Kicker>Start here</Kicker>
          <Split
            className={`mt-7 ${DISPLAY}`}
            lines={[[{ text: "Let's build" }], [{ text: 'something.', as: 'lime' }]]}
          />
        </div>
        <SpinBadge />
      </div>

      <p className="mt-7 text-lg text-white/60">
        Tell us what needs fixing. We will look at your funnel and come back with where the leak
        is. No deck, no pitch theatre.
      </p>

      {sent ? (
        <div
          className="mt-10 rounded-[24px] border p-8"
          style={{ borderColor: `${LIME}55`, background: 'rgba(213,235,75,0.08)' }}
        >
          <h3 className="font-['Space_Grotesk'] text-2xl font-bold" style={{ color: LIME }}>
            Got it — we will be in touch.
          </h3>
          <p className="mt-3 text-white/70">
            Your details are with our team. Expect a message shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="name" placeholder="Your name" className={field} autoComplete="name" />
            <input
              name="phone"
              placeholder="Mobile number"
              inputMode="numeric"
              className={field}
              autoComplete="tel"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="business" placeholder="Business name" className={field} />
            <input
              name="email"
              type="email"
              placeholder="Email (optional)"
              className={field}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <select name="vertical" className={field} defaultValue="">
              <option value="" disabled>
                Your segment
              </option>
              {VERTICAL_OPTIONS.map(v => (
                <option key={v} value={v} className="text-[#111214]">
                  {v}
                </option>
              ))}
            </select>
            <select name="spend" className={field} defaultValue="">
              <option value="" disabled>
                Current monthly ad spend
              </option>
              {SPEND_BANDS.map(s => (
                <option key={s} value={s} className="text-[#111214]">
                  {s}
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="challenge"
            rows={3}
            placeholder="What do you want to fix? (optional)"
            className={field}
          />
          {err && (
            <p role="alert" className="text-sm text-[#FCA5A5]">
              {err}
            </p>
          )}
          <Pill type="submit" className="w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Request my growth audit'}
          </Pill>
          <p className="text-center text-xs text-white/35">
            We use your details only to contact you about this enquiry.{' '}
            <a href="/privacy" className="underline hover:text-white/70">
              Privacy policy
            </a>
            .
          </p>
        </form>
      )}
    </Band>
  )
}

/* ─────────────────────────  Page  ───────────────────────── */

export default function Growth() {
  useEffect(() => {
    document.title = 'ZippyScale Growth | Growth Marketing Agency for High-Ticket Businesses'
  }, [])

  // The global body background is cream (#FFFDF7). Without this the ink page
  // shows cream gutters when iOS rubber-bands past the top or bottom.
  useEffect(() => {
    const el = document.documentElement
    const prev = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'ink')
    return () => {
      if (prev === null) el.removeAttribute('data-theme')
      else el.setAttribute('data-theme', prev)
    }
  }, [])

  return (
    <>
      <SmoothScroll />
      <Nav noBanner floating dark ctaHref="#enquire" />
      <main>
        <GrowthHero />
        <WhoWeAre />
        <ClientsSection />
        <MetricBand />
        <SegmentsSection />
        <UnderstandSection />
        <VideoWall />
        <EngineSection />
        <EnquiryForm />
      </main>
      <Footer />
    </>
  )
}
