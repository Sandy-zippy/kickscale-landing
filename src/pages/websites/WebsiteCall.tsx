/* The /websites booking form: a website variant of cockpit/DiscoveryCall.
 *
 * Order (Bhargav, 28 Oct 2026 pm): your details, your business, then what you need, then
 * a time LAST (four short steps, so each fits one phone screen),
 * with "send without a time" still possible. Every Continue saves the lead in the
 * background (lib/leadSave.ts): someone who leaves after step one is still a lead.
 *
 * Calendar: 1-hour slots from the same Apps Script,
 * shown in the visitor's own time zone, re-fetched when the form comes into view, on
 * tab focus and every 60 s while it is on screen. A slot that vanishes is deselected
 * with a note, and book() re-checks it server side anyway. If the calendar cannot be
 * read, the form still sends as an enquiry without a slot.
 *
 * Same endpoint, UTM/fbc/fbp, places data, dial codes and tracking as DiscoveryCall,
 * plus service:'website' so the Sheet and the cockpit file it as a Website lead.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { BOOKING_ENDPOINT, CATEGORIES, PROJECT } from '../../data/discovery'
import { COUNTRIES, COUNTRIES_SHOWN, statesOf, byCode, DIAL_CODES } from '../../data/places'
import { guessPlace } from '../../components/cockpit/Money'
import DatePicker from '../../components/cockpit/DatePicker'
import { trackDiscovery } from '../../lib/tracking'
import { getUTMParams, getFbcParam, getFbpParam } from '../../lib/analytics'
import { journeySummary } from '../../lib/siteBot'
import { FORM, WHATSAPP } from '../../data/websites'
import { useFormOnScreen } from '../../lib/useFormOnScreen'
import { leadId, finishLead, saveStep, afterSaves, type Stage } from '../../lib/leadSave'

const LIME = '#D9EA66'
const TRACK = { content_name: 'websites', content_category: 'website' }
const TIMELINES = PROJECT.find(f => f.key === 'timeline')?.options ?? []

export type Slot = { start: string; end: string; istDay?: string; istTime?: string }
type Answers = Record<string, string>

/* ── pure helpers (tested in WebsiteCall.test.ts) ─────────────────────────── */

/** 'YYYY-MM-DD' in the visitor's own zone (en-CA gives that order). */
export const localKey = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
export const localDay = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso))
export const localTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
export const zoneName = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ') } catch { return 'your time zone' }
}

/** Is the picked slot still in a fresh list? */
export const stillOpen = (picked: Slot | null, fresh: Slot[]) =>
  !picked || fresh.some(s => s.start === picked.start)

export function buildWebsitePayload(
  a: Answers, o: { needs: string[]; sells: string[]; slot: Slot | null; country: string; dial: string; journey: string; lead_id: string; stage: Stage },
) {
  const final = o.stage === 'final'
  return {
    action: !final ? 'save' : o.slot ? 'book' : 'lead',
    lead_id: o.lead_id,
    partial: !final,
    stage: o.stage,
    start: final ? o.slot?.start : undefined,
    service: 'website',
    needs: o.needs.join(', '),
    sells: o.sells.join(', '),
    package: a.package || '',
    timeline: a.timeline || '',
    need: a.need || '',
    company: (a.company || '').trim(),
    website: (a.website || '').trim(),
    category: a.category || '',
    name: (a.name || '').trim(),
    email: (a.email || '').trim(),
    state: a.state || '',
    city: a.city || '',
    country: o.country,
    phone: `${o.dial} ${a.phone || ''}`.trim(),
    region: [a.city, a.state, o.country].filter(Boolean).join(', '),
    journey: o.journey,
    ...(typeof sessionStorage !== 'undefined' ? getUTMParams() : {}),
    fbc: getFbcParam(),
    fbp: getFbpParam(),
    landed: typeof document !== 'undefined' ? (document.referrer || 'direct') : 'direct',
  }
}

/* ── small fields ─────────────────────────────────────────────────────────── */

const inputBase = 'mt-2 w-full rounded-xl border bg-white px-4 py-3 text-[15px] max-sm:mt-1 max-sm:min-h-[44px] max-sm:px-3 max-sm:py-2 max-sm:text-[16px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 '
const ok = 'border-slate-300 hover:border-slate-500 focus:border-slate-900'
const bad = 'border-[#C2410C]'

function Label({ text, optional, hint, short, inlineHint }: { text: string; optional?: boolean; hint?: string; short?: string; inlineHint?: boolean }) {
  return (
    <>
      <span className="text-[14px] font-semibold text-[#111111] max-sm:text-[15px]">
        {short ? <><span className="sm:hidden">{short}</span><span className="max-sm:hidden">{text}</span></> : text}{optional && <span className="ml-2 text-[12px] font-normal text-slate-500">optional</span>}
        {inlineHint && hint && <span className="ml-2 text-[13px] font-normal text-slate-500 sm:hidden">{hint}</span>}
      </span>
      {hint && <span className={`mt-0.5 block text-[12.5px] leading-snug text-slate-500 ${inlineHint ? 'max-sm:hidden' : 'max-sm:text-[13px]'}`}>{hint}</span>}
    </>
  )
}

function Select({ value, onChange, options, invalid, placeholder = 'Choose one', disabled, label }: {
  value: string; onChange: (v: string) => void; options: { v: string; l: string }[] | string[]
  invalid?: boolean; placeholder?: string; disabled?: boolean; label: string
}) {
  return (
    <div className="relative">
      <select aria-label={label} value={value} disabled={disabled} onChange={e => onChange(e.target.value)}
        className={`${inputBase}${invalid ? bad : ok} appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}>
        <option value="">{placeholder}</option>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-[10px] max-sm:mt-0.5 text-slate-500">▼</span>
    </div>
  )
}

/** Tap cards. `multi` makes it a group of toggles, otherwise a radio group. */
function Chips({ label, hint, options, value, onChange, multi, invalid }: {
  label: string; hint?: string; options: string[]; value: string[]
  onChange: (v: string[]) => void; multi?: boolean; invalid?: boolean
}) {
  return (
    <fieldset className="max-sm:col-span-2 md:col-span-2">
      <legend><Label text={label} hint={hint} inlineHint /></legend>
      <div role={multi ? 'group' : 'radiogroup'} aria-label={label} className="mt-2 flex flex-wrap gap-2 max-sm:mt-1.5">
        {options.map(o => {
          const on = value.includes(o)
          return (
            <button key={o} type="button"
              {...(multi ? { 'aria-pressed': on } : { role: 'radio', 'aria-checked': on })}
              onClick={() => onChange(multi ? (on ? value.filter(x => x !== o) : [...value, o]) : [o])}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-[14px] font-semibold transition-colors max-sm:px-3.5 max-sm:py-1.5 max-sm:text-[15px] ${
                on ? 'border-[#111111] bg-[#111111] text-white' : invalid ? 'border-[#C2410C] bg-white text-slate-800' : 'border-slate-300 bg-white text-slate-800 hover:border-slate-600'}`}>
              {multi && <span aria-hidden className="mr-1.5">{on ? '✓' : '+'}</span>}{o}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/* ── the flow ─────────────────────────────────────────────────────────────── */

export default function WebsiteCall({ openSignal = 0 }: { openSignal?: number }) {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)
  const [a, setA] = useState<Answers>({})
  const [needs, setNeeds] = useState<string[]>([])
  const [sells, setSells] = useState<string[]>([])
  const [wrong, setWrong] = useState<string[]>([])
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsFailed, setSlotsFailed] = useState(false)
  const [picked, setPicked] = useState<Slot | null>(null)
  const [day, setDay] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ when: string } | null>(null)
  const [err, setErr] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  const pickedRef = useRef<Slot | null>(null)
  pickedRef.current = picked
  useFormOnScreen(box)

  const guessed = useMemo(() => guessPlace(), [])
  const [countryCode, setCountryCode] = useState(() => COUNTRIES.find(c => c.ccy === guessed.ccy)?.code ?? 'IN')
  const country = byCode(countryCode) ?? COUNTRIES[0]
  const [dial, setDial] = useState(country.dial)

  const begin = () => { if (!started.current) { started.current = true; trackDiscovery('start', TRACK) } }
  const set = (k: string) => (v: string) => { begin(); setA(p => ({ ...p, [k]: v })); setWrong(p => p.filter(x => x !== k)) }

  /* Availability. Read-only, so it is safe to call as often as this does. */
  const load = useCallback((why: string) => {
    if (!BOOKING_ENDPOINT) { setSlotsFailed(true); return }
    fetch(BOOKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ action: 'slots' }),
    })
      .then(r => r.json())
      .then((j: { ok?: boolean; slots?: Slot[] }) => {
        if (!j.ok || !Array.isArray(j.slots)) { setSlotsFailed(true); return }
        const fresh = j.slots
        console.info(`[websites] slots refreshed (${why}): ${fresh.length} open`)
        setSlotsFailed(false)
        setSlots(fresh)
        if (!stillOpen(pickedRef.current, fresh)) {
          setPicked(null)
          setNote('The time you picked has just been taken. Please choose another.')
        }
      })
      .catch(() => setSlotsFailed(true))
  }, [])

  /* Fetch when the form comes on screen (and when the bot or a CTA opens it), on tab
     focus, and every 60 s while it stays visible. Never on page load. */
  const visible = useRef(false)
  const loadRef = useRef(load); loadRef.current = load
  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      const was = visible.current
      visible.current = e.isIntersecting
      if (e.isIntersecting && !was) loadRef.current('opened')
    }, { threshold: 0.15 })
    io.observe(el)
    const onFocus = () => { if (visible.current && !document.hidden) loadRef.current('focus') }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    const t = window.setInterval(() => { if (visible.current && !document.hidden) loadRef.current('60s') }, 60_000)
    return () => { io.disconnect(); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); window.clearInterval(t) }
  }, [])
  useEffect(() => { if (openSignal) { setStep(0); loadRef.current('opened by assistant') } }, [openSignal])

  const byDate = useMemo(() => {
    const m: Record<string, Slot[]> = {}
    ;(slots ?? []).forEach(s => { (m[localKey(s.start)] ??= []).push(s) })
    return m
  }, [slots])
  const freeCount = useMemo(() => Object.fromEntries(Object.entries(byDate).map(([k, v]) => [k, v.length])), [byDate])
  const times = byDate[day] ?? []
  /* Open on the first day with free times, so the times are on screen at once. */
  useEffect(() => {
    const keys = Object.keys(byDate).sort()
    if (keys.length && !byDate[day]) setDay(keys[0])
  }, [byDate, day])

  function missing(s: number): string[] {
    const out: string[] = []
    if (s === 0) {
      if (!String(a.name || '').trim()) out.push('name')
      if (String(a.phone || '').replace(/\D/g, '').length < 7) out.push('phone')
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email || '')) out.push('email')
      if (!String(a.company || '').trim()) out.push('company')
    }
    if (s === 1) {
      ;['category', 'state', 'city', 'timeline'].forEach(k => { if (!String(a[k] || '').trim()) out.push(k) })
    }
    if (s === 2) {
      if (!needs.length) out.push('needs')
      if (!sells.length) out.push('sells')
      if (!a.package) out.push('package')
    }
    return out
  }

  const payload = (stage: Stage) => buildWebsitePayload(a, {
    needs, sells, slot: picked, country: country.name, dial, journey: journeySummary(), lead_id: leadId('website'), stage,
  })

  function go(to: number) {
    if (to > step) {
      const m = missing(step)
      setWrong(m)
      if (m.length) return
      begin()
      /* Save now, in the background. Never awaited: the visitor moves on at once. */
      saveStep(payload(step < 2 ? 'details' : 'needs'))
      if (step === 1) trackDiscovery('step_2', { ...TRACK, category: a.category, country: country.name })
      if (step === 2) trackDiscovery('step_3', { ...TRACK, needs: needs.join(', ') })
    }
    setStep(to)
    setNote('')
    box.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  async function send() {
    setBusy(true); setErr('')
    const body = JSON.stringify(payload('final'))
    /* after any save still in flight: one lead_id, one post at a time */
    const req = afterSaves().then(() => fetch(BOOKING_ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body,
    })).then(r => r.json())
    const p = { ...TRACK, category: a.category, country: country.name, package: a.package, needs: needs.join(', ') }

    /* An enquiry does not wait (the backend takes 4 to 12 s); a booking does, because
       it has something to report: whether the slot was still free. Same as DiscoveryCall. */
    if (!picked) {
      trackDiscovery('lead', p)
      setDone({ when: '' }); setBusy(false)
      req.then(j => { if (!j?.ok) { setDone(null); setErr(j?.error || 'That did not go through.') } else finishLead('website') })
        .catch(() => { setDone(null); setErr('That did not go through. Please try again or message us on WhatsApp.') })
      return
    }
    try {
      const j = await req
      if (j.ok) {
        trackDiscovery('lead', { ...p, booked: true })
        trackDiscovery('booked', p)
        finishLead('website')
        setDone({ when: `${localDay(picked.start)}, ${localTime(picked.start)}` })
      } else if (j.error === 'taken') {
        setPicked(null); setNote('That time was taken a moment ago. Here are the times still open.'); load('taken')
      } else setErr(j.error || 'That did not go through.')
    } catch {
      setErr('That did not go through. Please try again or message us on WhatsApp.')
    } finally { setBusy(false) }
  }

  const first = (a.name || '').trim().split(/\s+/)[0]
  const hello = `Hi, I am ${a.name || 'here'}${a.company ? ` from ${a.company}` : ''}. I just sent the website form on zippyscale.in/websites.`

  if (done) {
    return (
      <div id="book" ref={box} className="scroll-mt-28 rounded-3xl bg-[#111111] p-6 text-white sm:p-10" aria-live="polite">
        <h3 className="font-['Space_Grotesk'] text-[1.5rem] font-bold leading-tight">Thank you{first ? `, ${first}` : ''}.</h3>
        <p className="mt-3 max-w-[48ch] text-[15.5px] leading-relaxed text-white/75">
          {done.when && <>Your call is booked for {done.when} and the invite is in your email. </>}
          The ZippyScale team will reply within one working day. Want to speak sooner? Message us on WhatsApp.
        </p>
        <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(hello)}`} target="_blank" rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-[44px] items-center rounded-full px-5 py-2.5 font-['Space_Grotesk'] text-[14px] font-bold text-[#111111]" style={{ background: LIME }}>
          Message us on WhatsApp
        </a>
      </div>
    )
  }

  const cityList = a.state ? (country.states[a.state] ?? []) : []
  const noCalendar = slotsFailed && !slots

  return (
    <div id="book" ref={box} className="scroll-mt-28 rounded-3xl bg-[#111111] p-5 text-white max-sm:scroll-mt-20 max-sm:rounded-2xl max-sm:p-3.5 sm:p-8 lg:p-10">
      <div className="sm:hidden" aria-hidden>
        <p className="flex items-baseline justify-between text-[13px] text-white/60">
          {wrong.length > 0
            ? <span className="font-semibold" style={{ color: LIME }}>A few answers are missing</span>
            : <span className="font-semibold text-white">{FORM.steps[step]}</span>}
          <span>Step {step + 1} of {FORM.steps.length}</span>
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${((step + 1) / FORM.steps.length) * 100}%`, background: LIME }} />
        </div>
      </div>
      <ol className="flex flex-wrap gap-x-5 gap-y-2 max-sm:sr-only">
        {FORM.steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span className="grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold"
              style={{ background: i < step ? LIME : i === step ? 'rgba(217,234,102,0.18)' : 'rgba(255,255,255,0.07)', color: i < step ? '#111111' : i === step ? LIME : 'rgba(255,255,255,0.45)' }}>
              {i < step ? '✓' : i + 1}
            </span>
            <span className={`text-[13px] ${i === step ? 'font-semibold text-white' : 'text-white/45'}`}>{s}</span>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={reduce ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          <div className="mt-7 grid content-start gap-4 rounded-2xl bg-white p-5 text-slate-900 max-sm:mt-3 max-sm:grid-cols-2 max-sm:gap-x-2.5 max-sm:gap-y-3 max-sm:rounded-xl max-sm:p-3.5 md:min-h-[22rem] md:grid-cols-2 md:gap-5 md:p-7">
            {step === 0 && (
              <>
                <label className="block min-w-0"><Label text="Your name" />
                  <input className={inputBase + (wrong.includes('name') ? bad : ok)} value={a.name || ''} onChange={e => set('name')(e.target.value)} autoComplete="name" /></label>
                <label className="block min-w-0"><Label text="Business name" short="Business" />
                  <input className={inputBase + (wrong.includes('company') ? bad : ok)} value={a.company || ''} onChange={e => set('company')(e.target.value)} autoComplete="organization" /></label>
                <label className="block min-w-0 max-sm:col-span-2"><Label text="Mobile with country code" />
                  <div className="mt-2 flex gap-2 max-sm:mt-1">
                    <div className="relative w-[5.4rem] shrink-0">
                      <select aria-label="Country dialling code" value={dial} onChange={e => setDial(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-3 pr-5 text-[14.5px] max-sm:py-2.5 max-sm:text-[16px] text-slate-900 outline-none hover:border-slate-500 focus:border-slate-900">
                        {DIAL_CODES.map(d => <option key={d.code} value={d.dial}>{d.dial}</option>)}
                      </select>
                      <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">▼</span>
                    </div>
                    <input aria-label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210"
                      className={`min-w-0 flex-1 rounded-xl border bg-white px-4 py-3 text-[15px] outline-none max-sm:px-3 max-sm:py-2.5 max-sm:text-[16px] ${wrong.includes('phone') ? bad : ok}`}
                      value={a.phone || ''} onChange={e => set('phone')(e.target.value)} />
                  </div>
                </label>
                <label className="block min-w-0 max-sm:col-span-2"><Label text="Email" />
                  <input type="email" className={inputBase + (wrong.includes('email') ? bad : ok)} value={a.email || ''} onChange={e => set('email')(e.target.value)} autoComplete="email" /></label>
                <p className="text-[13px] leading-relaxed text-slate-500 max-sm:col-span-2 max-sm:text-[12px] max-sm:leading-snug md:col-span-2">{FORM.consent} <a href="/privacy" className="underline">Privacy policy</a>.</p>
              </>
            )}

            {step === 1 && (
              <>
                <label className="block min-w-0 max-sm:col-span-2"><Label text="Your current website (if any)" short="Website" optional />
                  <input className={inputBase + ok} value={a.website || ''} placeholder="yourcompany.com" onChange={e => set('website')(e.target.value)} inputMode="url" /></label>
                <label className="block min-w-0 max-sm:col-span-2"><Label text="Industry" />
                  <Select label="Industry" value={a.category || ''} onChange={set('category')} options={CATEGORIES} invalid={wrong.includes('category')} /></label>
                <label className="block min-w-0"><Label text="Country" />
                  <Select label="Country" value={countryCode} placeholder="Choose your country"
                    onChange={c => { setCountryCode(c); setA(p => ({ ...p, state: '', city: '' })); setDial(byCode(c)?.dial ?? '+') }}
                    options={COUNTRIES_SHOWN.map(c => ({ v: c.code, l: c.name }))} /></label>
                <label className="block min-w-0"><Label text={country.tier} />
                  <Select label={country.tier} value={a.state || ''} onChange={v => { set('state')(v); set('city')('') }} options={statesOf(country)}
                    invalid={wrong.includes('state')} placeholder={`Choose your ${country.tier.toLowerCase()}`} /></label>
                <label className="block min-w-0"><Label text="City" />
                  <Select label="City" value={a.city || ''} onChange={set('city')} options={cityList} invalid={wrong.includes('city')}
                    disabled={!a.state} placeholder={a.state ? 'Choose your city' : `Pick a ${country.tier.toLowerCase()} first`} /></label>
                <label className="block min-w-0"><Label text="When do you need it?" short="When" />
                  <Select label="When do you need it?" value={a.timeline || ''} onChange={set('timeline')} options={TIMELINES} invalid={wrong.includes('timeline')} /></label>
                <label className="block min-w-0 max-sm:col-span-2 md:col-span-2"><Label text="Anything else we should know?" short="Anything else?" optional />
                  <textarea className={`${inputBase}${ok} min-h-[5.5rem] resize-y max-sm:h-11 max-sm:min-h-[44px]`} value={a.need || ''} onChange={e => set('need')(e.target.value)} /></label>
              </>
            )}

            {step === 2 && (
              <>
                <Chips multi label="What do you need?" hint="Pick all that apply." options={FORM.needs} value={needs}
                  onChange={v => { begin(); setNeeds(v); setWrong(w => w.filter(x => x !== 'needs')) }} invalid={wrong.includes('needs')} />
                <Chips multi label="How do you sell?" hint="Pick all that apply." options={FORM.sells} value={sells}
                  onChange={v => { setSells(v); setWrong(w => w.filter(x => x !== 'sells')) }} invalid={wrong.includes('sells')} />
                <Chips label="Package in mind" options={FORM.packages} value={a.package ? [a.package] : []}
                  onChange={v => set('package')(v[0])} invalid={wrong.includes('package')} />
              </>
            )}

            {step === 3 && (
              <div className="max-sm:col-span-2 md:col-span-2">
                <Label text="Pick a time for your call" hint={`One hour on Google Meet. Times are shown in your time zone (${zoneName()}).`} />
                {slots === null && !slotsFailed && <p className="mt-4 text-[14px] text-slate-500" role="status">Checking the calendar for free times…</p>}
                {noCalendar && (
                  <p className="mt-4 text-[14px] leading-relaxed text-slate-600" role="status">
                    The calendar is not answering right now. Continue, send your details, and we will come back with times.
                  </p>
                )}
                {slots && (
                  <div className="mt-3 grid gap-4 max-sm:mt-2 max-sm:gap-3 md:grid-cols-2">
                    <DatePicker available={freeCount} value={day} onChange={d => { setDay(d); setPicked(null); setNote('') }}
                      placeholder="Choose a day" label="Call day" />
                    <div>
                      {day ? (
                        <div role="radiogroup" aria-label="Call time" className="grid grid-cols-2 gap-2 max-sm:grid-cols-3 sm:grid-cols-3">
                          {times.map(t => {
                            const on = picked?.start === t.start
                            return (
                              <button key={t.start} type="button" role="radio" aria-checked={on}
                                onClick={() => { begin(); setPicked(t); setNote('') }}
                                className={`min-h-[44px] rounded-xl border px-3 py-2 text-[14px] font-semibold max-sm:px-1 max-sm:text-[15px] ${on ? 'border-[#111111] bg-[#111111] text-white' : 'border-slate-300 hover:border-slate-700'}`}>
                                {localTime(t.start)}
                              </button>
                            )
                          })}
                        </div>
                      ) : <p className="pt-3 text-[13.5px] text-slate-500">Pick a day to see the open times.</p>}
                    </div>
                  </div>
                )}
                {note && <p className="mt-4 text-[13.5px] font-semibold text-[#C2410C]" role="alert">{note}</p>}
                {picked && <p className="mt-4 text-[14px] font-semibold">Your call: {localDay(picked.start)}, {localTime(picked.start)}</p>}
              </div>
            )}

          </div>
        </motion.div>
      </AnimatePresence>

      {wrong.length > 0 && <p className="mt-4 text-[13.5px] max-sm:sr-only font-semibold" style={{ color: LIME }} role="alert">A few answers are still missing above.</p>}
      {err && <p className="mt-4 text-[13.5px] font-semibold" style={{ color: LIME }} role="alert">{err}</p>}

      <div className="mt-7 flex flex-wrap items-center gap-3 max-sm:mt-3 max-sm:gap-x-2.5 max-sm:gap-y-2">
        {step > 0 && (
          <button type="button" onClick={() => go(step - 1)}
            className="min-h-[44px] rounded-full border border-white/25 px-5 py-3 text-[14px] font-semibold text-white/80 hover:border-white/60 hover:text-white">Back</button>
        )}
        {step < 3 ? (
          <button type="button" onClick={() => go(step + 1)}
            className="min-h-[44px] flex-1 rounded-full px-6 py-3 font-['Space_Grotesk'] text-[14.5px] font-bold text-[#111111] disabled:opacity-40 sm:flex-none" style={{ background: LIME }}>
            Continue
          </button>
        ) : (
          <button type="button" disabled={busy || (!picked && !noCalendar)} onClick={send}
            className="min-h-[44px] flex-1 rounded-full px-6 py-3 font-['Space_Grotesk'] text-[14.5px] font-bold text-[#111111] disabled:opacity-40 sm:flex-none" style={{ background: LIME }}>
            {busy ? (picked ? 'Booking…' : 'Sending…') : picked || !noCalendar ? FORM.button : 'Send my details'}
          </button>
        )}
        {step === 3 && slots && !picked && (
          <button type="button" disabled={busy} onClick={send} className="text-[13px] text-white/55 underline max-sm:min-h-[44px] max-sm:w-full max-sm:text-[14px] underline-offset-4 hover:text-white">
            None of these times work? Send without a time
          </button>
        )}
      </div>
    </div>
  )
}
