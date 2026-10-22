/**
 * The discovery call booking flow.
 *
 * Three short steps, then a slot, then a confirmed Google Meet in both calendars. It is
 * split into steps rather than one long form because twelve fields on one screen reads
 * as work and four reads as a question. The qualifying answers come first and the
 * contact details last: someone who has already told us about their business is far
 * more likely to hand over a phone number than someone asked for it cold.
 *
 * Three things the form does so the visitor does not have to:
 *   · picks their country from the timezone, which sets the currency and the dial code
 *   · prices every money band in that currency, so nobody converts in their head
 *   · guesses the company name from the website or Instagram they already typed
 *
 * The backend is apps-script/DiscoveryBooking.gs. Until it is deployed, or if it is
 * unreachable, the flow hands the same answers to WhatsApp rather than dead-ending,
 * because a form that silently fails is worse than no form.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  ABOUT, PROJECT, CONTACT, BOOKING_ENDPOINT, companyFrom,
  REVENUE_BANDS, REVENUE_SKIP, BUDGET_BANDS, BUDGET_SKIP, type Field,
} from '../../data/discovery'
import { COUNTRIES, COUNTRIES_SHOWN, statesOf, byCode, DIAL_CODES } from '../../data/places'
import { useRates, guessPlace, band, formatCompact } from './Money'
import { Agent } from './Agent'
import { trackDiscovery } from '../../lib/tracking'
import { getUTMParams, getFbcParam, getFbpParam } from '../../lib/analytics'
import DatePicker, { istKey } from './DatePicker'
import { LIME } from '../growth/kinetic'

type Answers = Record<string, string>
type Slot = { start: string; end: string; istDay: string; istTime: string }

const WHATSAPP = '919989990419'
const STEPS = ['Your business', 'What you need', 'Book the call'] as const

/* ── one field ─────────────────────────────────────────────────────────────── */

const inputBase =
  'mt-2 w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 '
const ok = 'border-slate-300 hover:border-slate-500 focus:border-slate-900'
const bad = 'border-[#C2410C]'

function Label({ f }: { f: Field }) {
  return (
    <>
      <span className="text-[14px] font-semibold text-[#0A0A0C]">
        {f.label}
        {!f.required && <span className="ml-2 text-[12px] font-normal text-slate-500">optional</span>}
      </span>
      {f.hint && <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500">{f.hint}</span>}
    </>
  )
}

type Opt = string | { v: string; l: string }

function Select({ value, onChange, options, invalid, placeholder = 'Choose one', disabled, label }: {
  value: string; onChange: (v: string) => void; options: Opt[]
  invalid?: boolean; placeholder?: string; disabled?: boolean
  /** named explicitly rather than relying on the wrapping <label>, so a screen reader
   *  announces the right thing even when the field is disabled */
  label?: string
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        className={`${inputBase}${invalid ? bad : ok} appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(o => {
          const v = typeof o === 'string' ? o : o.v
          const l = typeof o === 'string' ? o : o.l
          return <option key={v} value={v}>{l}</option>
        })}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-[10px] text-slate-500">▼</span>
    </div>
  )
}

function Ask({ f, value, onChange, invalid, options }: {
  f: Field; value: string; onChange: (v: string) => void; invalid: boolean; options?: string[]
}) {
  return (
    <label className="block">
      <Label f={f} />
      {f.kind === 'select' ? (
        <Select value={value} onChange={onChange} options={options ?? f.options ?? []} invalid={invalid} label={f.label} />
      ) : f.kind === 'textarea' ? (
        <textarea
          className={`${inputBase}${invalid ? bad : ok} min-h-[6rem] resize-y leading-relaxed`}
          value={value} placeholder={f.placeholder} onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          className={`${inputBase}${invalid ? bad : ok}`}
          value={value} placeholder={f.placeholder}
          inputMode={f.key === 'email' ? 'email' : 'text'}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </label>
  )
}

/* ── the flow ──────────────────────────────────────────────────────────────── */

export default function DiscoveryCall() {
  const reduce = useReducedMotion()
  const rates = useRates()
  const [step, setStep] = useState(0)
  const [a, setA] = useState<Answers>({})
  const [wrong, setWrong] = useState<string[]>([])
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsFailed, setSlotsFailed] = useState(false)
  const [picked, setPicked] = useState<Slot | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ when: string; meet: string } | null>(null)
  const [err, setErr] = useState('')
  const [companyTouched, setCompanyTouched] = useState(false)
  const [day, setDay] = useState('')
  const top = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  /* Country comes from their clock, so most people never touch the first dropdown. */
  const guessed = useMemo(() => guessPlace(), [])
  const [countryCode, setCountryCode] = useState(
    () => COUNTRIES.find(c => c.ccy === guessed.ccy)?.code ?? 'IN',
  )
  const country = byCode(countryCode) ?? COUNTRIES[0]
  const [dial, setDial] = useState(country.dial)

  /* Their country decides the currency every money band is printed in. Picking
     Australia should not leave an Australian reading dollar amounts they have to
     convert before they can answer. */
  const ccy = country.ccy
  const rate = rates.table[ccy] ?? 1

  const set = (k: string) => (v: string) => {
    if (!started.current) { started.current = true; trackDiscovery('start') }
    setA(p => ({ ...p, [k]: v }))
    setWrong(p => p.filter(x => x !== k))
  }

  /* Changing country invalidates the state and city under it, and moves the dial code. */
  function pickCountry(code: string) {
    setCountryCode(code)
    setA(p => ({ ...p, state: '', city: '' }))
    setDial(byCode(code)?.dial ?? '+')
  }

  /* The company name is almost always sitting inside the website or the handle they
     just typed. Fill it in, and stop the moment they edit it themselves. */
  useEffect(() => {
    if (companyTouched) return
    const guess = companyFrom(a.website || '', a.instagram || '')
    if (guess && guess !== a.company) setA(p => ({ ...p, company: guess }))
  }, [a.website, a.instagram, a.company, companyTouched])

  /* Availability is fetched when they reach step three, not on page load: most
     visitors never get here and every read costs Bhargav's calendar quota. */
  useEffect(() => {
    if (step !== 2 || slots || slotsFailed || !BOOKING_ENDPOINT) return
    let alive = true
    fetch(BOOKING_ENDPOINT, {
      method: 'POST',
      /* text/plain keeps this a "simple" request, so the browser skips the preflight
         Apps Script cannot answer and the response stays readable. */
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ action: 'slots' }),
    })
      .then(r => r.json())
      .then(j => { if (!alive) return; j.ok ? setSlots(j.slots) : setSlotsFailed(true) })
      .catch(() => { if (alive) setSlotsFailed(true) })
    return () => { alive = false }
  }, [step, slots, slotsFailed])

  /* Availability keyed by IST calendar date. The visitor may be sitting anywhere, so
     the key is computed in Asia/Kolkata and never from their own clock. */
  const byDate = useMemo(() => {
    const m: Record<string, Slot[]> = {}
    ;(slots ?? []).forEach(s2 => { (m[istKey(s2.start)] ??= []).push(s2) })
    return m
  }, [slots])
  const freeCount = useMemo(
    () => Object.fromEntries(Object.entries(byDate).map(([k, v]) => [k, v.length])),
    [byDate],
  )
  const timeList = byDate[day] ?? []

  const revenueOptions = useMemo(
    () => [...REVENUE_BANDS.map(b => band(b.from, b.to, ccy, rate)), REVENUE_SKIP],
    [ccy, rate],
  )
  const budgetOptions = useMemo(
    () => [...BUDGET_BANDS.map(b => band(b.from, b.to, ccy, rate)), BUDGET_SKIP],
    [ccy, rate],
  )

  function missing(fields: Field[]): string[] {
    const out = fields.filter(f => f.required && !String(a[f.key] || '').trim()).map(f => f.key)
    if (fields === ABOUT) {
      if (!a.state) out.push('state')
      if (!a.city) out.push('city')
    }
    if (fields === CONTACT) {
      if (!String(a.company || '').trim()) out.push('company')
      if (a.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) out.push('email')
      if (String(a.phone || '').replace(/\D/g, '').length < 7) out.push('phone')
    }
    return out
  }

  function next(fields: Field[]) {
    const m = missing(fields)
    setWrong(m)
    if (m.length) return
    /* Each step is its own event. The drop-off between them is the only way to tell a
       bad ad from a bad form, and at a small budget that is the difference between
       fixing the right thing and guessing. */
    trackDiscovery(step === 0 ? 'step_2' : 'step_3', { category: a.category, country: country.name })
    setStep(s => s + 1)
    top.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  /** Everything they told us, laid out so it is readable in a WhatsApp thread. */
  function asText() {
    const where = [a.city, a.state, country.name].filter(Boolean).join(', ')
    const lines = [
      '*Discovery call request*',
      '',
      '*The business*',
      `Type: ${a.category || 'not given'}`,
      `Where: ${where || 'not given'}`,
      `Team size: ${a.team || 'not given'}`,
      `Turnover: ${a.revenue || 'not given'}`,
      '',
      '*What they need*',
      `Going wrong today:`,
      (a.need || 'not given'),
      '',
      `Website: ${a.website || 'not given'}`,
      `Instagram: ${a.instagram || 'not given'}`,
      `Budget: ${a.budget || 'not given'}`,
      `Timeline: ${a.timeline || 'not given'}`,
      '',
      '*Contact*',
      `Name: ${a.name || 'not given'}`,
      `Company: ${a.company || 'not given'}`,
      `Email: ${a.email || 'not given'}`,
      `Phone: ${dial} ${a.phone || ''}`.trim(),
    ]
    return lines.join('\n')
  }

  /**
   * Send. With a slot chosen it books the call; without one it just records the
   * enquiry, because most people are not ready to put an hour with strangers in their
   * diary and making them is how you lose the ones worth talking to.
   */
  async function confirm() {
    setBusy(true); setErr('')

    const payload = {
      action: picked ? 'book' : 'lead',
      start: picked?.start,
      ...a,
      country: country.name,
      phone: `${dial} ${a.phone || ''}`.trim(),
      region: [a.city, a.state, country.name].filter(Boolean).join(', '),
      /* Which ad produced this lead. Without it a test month tells you how many
         leads came in and nothing about which creative earned them, which is the
         only question a test month exists to answer. */
      ...getUTMParams(),
      fbc: getFbcParam(),
      fbp: getFbpParam(),
      landed: document.referrer || 'direct',
    }
    const send = fetch(BOOKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
    }).then((r) => r.json())

    /* ⚠️ AN ENQUIRY DOES NOT WAIT. Measured: the backend answers in four to
       twelve seconds, because before it replies it reads the calendar, writes a
       row to a Sheet, pushes to the cockpit and sends an email. None of that is
       the person's work, and none of it changes what we would tell them: there
       is no slot to confirm and nothing to report back. So the thank-you appears
       at once and the request finishes behind it.

       A BOOKING still waits, because there IS something to report: whether the
       slot was still free, when it is, and the Meet link. Being told "booked" and
       then finding no invite is far worse than a few seconds of spinner.

       If a lead genuinely fails, the thank-you is taken back down and the error
       shown, which is the honest version of optimism. */
    if (!picked) {
      trackDiscovery('lead', {
        category: a.category, country: country.name, budget: a.budget, team: a.team,
      })
      setDone({ when: '', meet: '' })
      setBusy(false)
      send
        .then((j) => { if (!j || !j.ok) { setDone(null); setErr(j?.error || 'That did not go through.') } })
        .catch(() => { setDone(null); setErr('offline') })
      return
    }

    try {
      const j = await send
      if (j.ok) {
        trackDiscovery('booked', {
          category: a.category, country: country.name, budget: a.budget, team: a.team,
        })
        setDone({ when: j.when || '', meet: j.meet || '' })
      }
      else if (j.error === 'taken') {
        /* Somebody booked it while this form was open. Refresh rather than argue. */
        setErr('That slot just went. Here are the times still open.')
        setPicked(null); setSlots(null)
      } else setErr(j.error || 'That did not go through.')
    } catch {
      setErr('offline')
    } finally {
      setBusy(false)
    }
  }

  /* ── confirmed ─────────────────────────────────────────────────────────── */
  if (done) {
    const booked = !!done.when
    /* No Mr./Ms.: the form has no title field, and a wrong guess is worse than none. */
    const first = (a.name || '').trim().split(/\s+/)[0]
    const told: [string, string | undefined][] = [
      ['Business', a.company],
      ['Sector', a.category],
      ['Team size', a.team],
      ['Country', country.name],
      [country.tier, a.state],
      ['City', a.city],
    ]
    const hello = `Hi, I am ${a.name || 'here'}${a.company ? ` from ${a.company}` : ''}. I just filled in the Agentic Cockpit form and wanted to talk sooner.`
    return (
      <div id="book" className="scroll-mt-28 rounded-3xl bg-[#050507] p-6 text-white sm:p-10">
        <div className="flex items-start gap-4">
          <Agent skin="lime" size={46} mood="happy" />
          <div className="min-w-0 flex-1">
            <h3 className="font-['Space_Grotesk'] text-[1.35rem] font-bold leading-tight sm:text-[1.6rem]">
              {booked ? `Booked. ${done.when}.` : first ? `Thank you, ${first}.` : 'Thank you.'}
            </h3>
            <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-white/70">
              {booked
                ? `The calendar invite is on its way to ${a.email}. It carries a Google Meet link, and it is in Bhargav's calendar too, so neither of you has to remember.`
                : 'Our team will get in touch with you in the next 24 hours.'}
            </p>
            {booked && done.meet && (
              <a href={done.meet} target="_blank" rel="noopener noreferrer"
                 className="mt-5 inline-block rounded-full px-5 py-2.5 font-['Space_Grotesk'] text-[14px] font-bold text-[#0A0A0C]"
                 style={{ background: LIME }}>
                Open the Meet link
              </a>
            )}

            <dl className="mt-6 grid max-w-[34rem] grid-cols-1 gap-x-6 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-2 sm:p-5">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/45 sm:col-span-2">What you told us</p>
              {told.filter(([, v]) => v && v.trim()).map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-[12px] text-white/50">{k}</dt>
                  <dd className="mt-0.5 break-words text-[14.5px] font-semibold text-white">{v}</dd>
                </div>
              ))}
            </dl>

            {!booked && (
              <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-white/70">
                We take on only five clients a month, nothing more. Demand is high right now, so we ask for a little patience.
              </p>
            )}

            <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(hello)}`}
               target="_blank" rel="noopener noreferrer"
               className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 font-['Space_Grotesk'] text-[14px] font-bold text-[#0A0A0C]"
               style={{ background: LIME }}>
              {booked ? 'Need to move it? WhatsApp us' : 'In a hurry? WhatsApp us now'}
            </a>
          </div>
        </div>
      </div>
    )
  }

  /* ── the form ──────────────────────────────────────────────────────────── */
  const cantBook = !BOOKING_ENDPOINT || slotsFailed || err === 'offline'
  const canBook = !cantBook
  const fields = [ABOUT, PROJECT, CONTACT][step]
  const cityList = a.state ? (country.states[a.state] ?? []) : []

  return (
    <div
      id="book"
      ref={top}
      /* The nav CTA points here rather than at the band, because landing on a heading
         and then having to scroll again to find the form is the whole reason people
         give up on a booking. 7rem clears the floating bar. */
      className="scroll-mt-28 rounded-3xl bg-[#050507] p-5 text-white sm:p-8 lg:p-10"
    >
      <ol className="flex flex-wrap gap-x-5 gap-y-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className="grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold"
              style={{
                background: i < step ? LIME : i === step ? 'rgba(213,235,75,0.18)' : 'rgba(255,255,255,0.07)',
                color: i < step ? '#0A0A0C' : i === step ? LIME : 'rgba(255,255,255,0.4)',
              }}
            >
              {i < step ? '✓' : i + 1}
            </span>
            <span className={`text-[13px] ${i === step ? 'font-semibold text-white' : 'text-white/40'}`}>{s}</span>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mt-7 grid content-start gap-4 rounded-2xl bg-white p-5 md:min-h-[25rem] md:grid-cols-2 md:gap-5 md:p-7">
            {step === 0 && (
              <>
                <Ask f={ABOUT[0]} value={a.category || ''} onChange={set('category')} invalid={wrong.includes('category')} />
                <Ask f={ABOUT[1]} value={a.team || ''} onChange={set('team')} invalid={wrong.includes('team')} />

                {/* country, then state, then city. Three taps, zero typing, and data
                    we can actually group by afterwards. */}
                <label className="block">
                  <Label f={{ key: 'country', label: 'Country', kind: 'select', required: true }} />
                  <Select
                    value={countryCode}
                    onChange={pickCountry}
                    options={COUNTRIES_SHOWN.map(c => ({ v: c.code, l: c.name }))}
                    placeholder="Choose your country"
                    label="Country"
                  />
                </label>

                <label className="block">
                  <Label f={{ key: 'state', label: country.tier, kind: 'select', required: true }} />
                  <Select
                    value={a.state || ''}
                    onChange={v => { set('state')(v); set('city')('') }}
                    options={statesOf(country)}
                    invalid={wrong.includes('state')}
                    placeholder={`Choose your ${country.tier.toLowerCase()}`}
                    label={country.tier}
                  />
                </label>

                <label className="block md:col-span-2">
                  <Label f={{
                    key: 'city', label: 'City', kind: 'select', required: true,
                    hint: a.state ? undefined : `Pick a ${country.tier.toLowerCase()} first.`,
                  }} />
                  <Select
                    value={a.city || ''}
                    onChange={set('city')}
                    options={cityList}
                    invalid={wrong.includes('city')}
                    disabled={!a.state}
                    placeholder={a.state ? 'Choose your city' : `Waiting on ${country.tier.toLowerCase()}`}
                    label="City"
                  />
                </label>

                <label className="block md:col-span-2">
                  <Label f={{
                    key: 'revenue', label: 'Roughly what does the business turn over a year?',
                    kind: 'select', required: false,
                    hint: 'A band is enough. It tells us what is worth building and what is not.',
                  }} />
                  <Select value={a.revenue || ''} onChange={set('revenue')} options={revenueOptions} label="Annual turnover" />
                </label>
              </>
            )}

            {step === 1 && (
              <>
                <div className="md:col-span-2">
                  <Ask f={PROJECT[0]} value={a.need || ''} onChange={set('need')} invalid={wrong.includes('need')} />
                </div>
                <Ask f={PROJECT[1]} value={a.website || ''} onChange={set('website')} invalid={false} />
                <Ask f={PROJECT[2]} value={a.instagram || ''} onChange={set('instagram')} invalid={false} />

                <label className="block">
                  <Label f={{
                    key: 'budget', label: 'What have you set aside for this?', kind: 'select', required: true,
                    hint: `Our builds start at ${formatCompact(730, ccy, rate)}. A band saves us both a meeting.`,
                  }} />
                  <Select value={a.budget || ''} onChange={set('budget')} options={budgetOptions} invalid={wrong.includes('budget')} label="Budget" />
                </label>

                <Ask f={PROJECT[3]} value={a.timeline || ''} onChange={set('timeline')} invalid={wrong.includes('timeline')} />
              </>
            )}

            {step === 2 && (
              <>
                <Ask f={CONTACT[0]} value={a.name || ''} onChange={set('name')} invalid={wrong.includes('name')} />
                <Ask f={CONTACT[1]} value={a.email || ''} onChange={set('email')} invalid={wrong.includes('email')} />

                {/* dial code is a dropdown, preset from the country they chose */}
                <label className="block">
                  <Label f={{ key: 'phone', label: 'Mobile', kind: 'text', required: true }} />
                  <div className="mt-2 flex gap-2">
                    <div className="relative w-[5.1rem] shrink-0">
                      <select
                        aria-label="Country dialling code"
                        className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-3 pr-5 text-[14.5px] text-slate-900 outline-none hover:border-slate-500 focus:border-slate-900"
                        value={dial}
                        onChange={e => setDial(e.target.value)}
                      >
                        {DIAL_CODES.map(d => (
                          <option key={d.code} value={d.dial}>{d.dial}</option>
                        ))}
                      </select>
                      <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">▼</span>
                    </div>
                    <input
                      className={`min-w-0 flex-1 rounded-xl border bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 ${wrong.includes('phone') ? bad : ok}`}
                      value={a.phone || ''} inputMode="tel" placeholder="98765 43210"
                      onChange={e => set('phone')(e.target.value)}
                    />
                  </div>
                </label>

                <label className="block">
                  <Label f={{
                    key: 'company', label: 'Company name', kind: 'text', required: true,
                    hint: a.company && !companyTouched ? 'Taken from your website. Change it if it is wrong.' : undefined,
                  }} />
                  <input
                    className={`${inputBase}${wrong.includes('company') ? bad : ok}`}
                    value={a.company || ''} placeholder="Company"
                    onChange={e => { setCompanyTouched(true); set('company')(e.target.value) }}
                  />
                </label>

                {/* The call slot is two more dropdowns, deliberately. A calendar strip
                    changed the width of this card every time the data changed, which is
                    exactly the kind of thing that makes a form feel unstable. */}
                {canBook && Object.keys(byDate).length > 0 && (
                  <>
                    <label className="block">
                      <Label f={{
                        key: 'day', label: 'Book a call · day', kind: 'select', required: false,
                        hint: 'One hour on Google Meet. Skip it and we will come back with times.',
                      }} />
                      <DatePicker
                        available={freeCount}
                        value={day}
                        onChange={d => { setDay(d); setPicked(null); setErr('') }}
                        placeholder="Pick a day, or skip this"
                        label="Book a call day"
                      />
                    </label>

                    <label className="block">
                      <Label f={{
                        key: 'time', label: 'Book a call · time', kind: 'select', required: false,
                        hint: day ? 'Times are IST.' : 'Pick a day first.',
                      }} />
                      <Select
                        value={picked?.start ?? ''}
                        onChange={v => { setPicked(timeList.find(t => t.start === v) ?? null); setErr('') }}
                        options={timeList.map(t => ({ v: t.start, l: t.istTime }))}
                        disabled={!day}
                        placeholder={day ? 'Choose a time' : 'Waiting on a day'}
                        label="Book a call time"
                      />
                    </label>
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {wrong.length > 0 && (
        <p className="mt-4 text-[13.5px] font-semibold" style={{ color: LIME }}>
          A few answers are still missing above.
        </p>
      )}

      {step === 2 && !canBook && (
        <p className="mt-5 flex items-start gap-3 text-[13.5px] leading-relaxed text-white/55">
          <Agent skin="sky" size={28} mood="stuck" />
          <span className="max-w-[46ch]">
            The calendar is not answering right now, so booking is off for the moment.
            Send your details and we will come back with two or three times today.
          </span>
        </p>
      )}

      {err && err !== 'offline' && (
        <p className="mt-4 text-[13.5px] font-semibold" style={{ color: LIME }}>{err}</p>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {step > 0 && (
          <button
            type="button" onClick={() => setStep(s => s - 1)}
            className="rounded-full border border-white/20 px-5 py-3 text-[14px] font-semibold text-white/70 transition-colors hover:border-white/50 hover:text-white"
          >
            Back
          </button>
        )}

        {step < 2 ? (
          <button
            type="button" onClick={() => next(fields)}
            className="flex-1 rounded-full px-6 py-3 font-['Space_Grotesk'] text-[14.5px] font-bold text-[#0A0A0C] sm:flex-none"
            style={{ background: LIME }}
          >
            Continue
          </button>
        ) : cantBook ? (
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(asText())}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => {
              const m = missing(CONTACT)
              if (m.length) setWrong(m)
              else trackDiscovery('lead', { via: 'whatsapp', category: a.category })
            }}
            className="rounded-full px-6 py-2.5 font-['Space_Grotesk'] text-[14.5px] font-bold text-[#0A0A0C]"
            style={{ background: LIME }}
          >
            Send this on WhatsApp
          </a>
        ) : (
          <button
            type="button" disabled={busy}
            onClick={() => { const m = missing(CONTACT); setWrong(m); if (!m.length) confirm() }}
            className="w-full rounded-full px-6 py-3 font-['Space_Grotesk'] text-[14.5px] font-bold text-[#0A0A0C] disabled:opacity-40 sm:w-auto"
            style={{ background: LIME }}
          >
            {busy
              ? (picked ? 'Booking…' : 'Sending…')
              : picked ? `Book ${picked.istDay}, ${picked.istTime}` : 'Send my details'}
          </button>
        )}

        <span className="text-[12.5px] text-white/35">
          {step < 2
            ? 'Takes under a minute.'
            : picked ? 'No obligation on the call.' : 'Booking a time is optional.'}
        </span>
      </div>
    </div>
  )
}
