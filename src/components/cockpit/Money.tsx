/**
 * Prices in dollars, checkable in the visitor's own currency.
 *
 * Three rules this follows, because a wrong price is worse than no price:
 *   1. USD is the price. Everything else is a *conversion*, labelled as one.
 *   2. A live rate is fetched once and its date is shown. If the fetch fails we fall
 *      back to a pinned table and say so — a stale rate presented as live is the kind
 *      of small dishonesty that costs a deal when someone checks.
 *   3. The visitor's likely currency is preselected from their locale, but never
 *      silently — the selector shows what was chosen so they can change it.
 *
 * The digits roll when the currency changes. That is the "fancy" part, and it is
 * doing a job: it makes it obvious the number recalculated rather than the page
 * quietly swapping a string.
 */
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

/** Pinned fallback, refreshed when this file is touched. Shown as approximate. */
const PINNED_AT = '2026-09-26'
const PINNED: Record<string, number> = {
  USD: 1, INR: 88.4, AED: 3.67, GBP: 0.79, EUR: 0.92, SGD: 1.34,
  AUD: 1.52, CAD: 1.39, SAR: 3.75, MYR: 4.45, ZAR: 18.1, QAR: 3.64,
}

const META: Record<string, { name: string; flag: string }> = {
  USD: { name: 'US Dollar',        flag: '🇺🇸' },
  INR: { name: 'Indian Rupee',     flag: '🇮🇳' },
  AED: { name: 'UAE Dirham',       flag: '🇦🇪' },
  GBP: { name: 'Pound Sterling',   flag: '🇬🇧' },
  EUR: { name: 'Euro',             flag: '🇪🇺' },
  SGD: { name: 'Singapore Dollar', flag: '🇸🇬' },
  AUD: { name: 'Australian Dollar',flag: '🇦🇺' },
  CAD: { name: 'Canadian Dollar',  flag: '🇨🇦' },
  SAR: { name: 'Saudi Riyal',      flag: '🇸🇦' },
  MYR: { name: 'Malaysian Ringgit',flag: '🇲🇾' },
  ZAR: { name: 'South African Rand',flag: '🇿🇦' },
  QAR: { name: 'Qatari Riyal',     flag: '🇶🇦' },
}

/**
 * Best guess at where the visitor actually is.
 *
 * Timezone first, language second, and that order matters: plenty of people in India,
 * the Gulf and Singapore run an en-US browser, so `navigator.language` would quietly
 * price them in dollars. The IANA timezone comes from the operating system clock and
 * tracks where the machine really is, which is the thing we are trying to know.
 *
 * No IP lookup. It would be marginally more accurate and it would mean shipping every
 * visitor's address to a third party to decide which symbol to draw.
 */
const BY_REGION: Record<string, string> = {
  IN: 'INR', AE: 'AED', GB: 'GBP', SG: 'SGD', AU: 'AUD', CA: 'CAD',
  SA: 'SAR', MY: 'MYR', ZA: 'ZAR', QA: 'QAR',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR',
  AT: 'EUR', BE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR',
}

/* Only the zones that map to a currency we quote. Anything else falls through to USD. */
const BY_ZONE: Record<string, string> = {
  'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR',
  'Asia/Dubai': 'AED', 'Asia/Qatar': 'QAR', 'Asia/Riyadh': 'SAR',
  'Asia/Singapore': 'SGD', 'Asia/Kuala_Lumpur': 'MYR',
  'Europe/London': 'GBP', 'Africa/Johannesburg': 'ZAR',
  'Europe/Berlin': 'EUR', 'Europe/Paris': 'EUR', 'Europe/Madrid': 'EUR',
  'Europe/Rome': 'EUR', 'Europe/Amsterdam': 'EUR', 'Europe/Dublin': 'EUR',
  'Europe/Lisbon': 'EUR', 'Europe/Vienna': 'EUR', 'Europe/Brussels': 'EUR',
}

/** Where we think they are, in words, so the page can say why it chose a currency. */
export function guessPlace(): { ccy: string; where: string } {
  let zone = ''
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch { /* older engine */ }
  if (BY_ZONE[zone]) return { ccy: BY_ZONE[zone], where: zone.split('/')[1].replace(/_/g, ' ') }

  if (typeof navigator !== 'undefined') {
    try {
      const region = (new Intl.Locale(navigator.language).maximize().region ?? '').toUpperCase()
      if (BY_REGION[region]) return { ccy: BY_REGION[region], where: region }
    } catch { /* unparseable language tag */ }
  }
  return { ccy: 'USD', where: '' }
}

function guessCurrency(): string { return guessPlace().ccy }

export type Rates = {
  table: Record<string, number>
  /** 'live' once a fetch has succeeded, otherwise the pinned table */
  status: 'live' | 'pinned'
  date: string
}

export function useRates(): Rates {
  const [rates, setRates] = useState<Rates>({
    table: PINNED, status: 'pinned', date: PINNED_AT,
  })

  useEffect(() => {
    let alive = true
    const ac = new AbortController()
    /* open.er-api.com needs no key and sets permissive CORS. If it is down or
       blocked, the pinned table stands and the UI says "approximate". */
    fetch('https://open.er-api.com/v6/latest/USD', { signal: ac.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { result?: string; rates?: Record<string, number>; time_last_update_utc?: string }) => {
        if (!alive || j.result !== 'success' || !j.rates?.INR) return
        const table: Record<string, number> = { USD: 1 }
        Object.keys(PINNED).forEach(c => { if (j.rates![c]) table[c] = j.rates![c] })
        setRates({
          table,
          status: 'live',
          date: (j.time_last_update_utc ?? '').slice(5, 16) || PINNED_AT,
        })
      })
      .catch(() => { /* pinned table already in state */ })
    return () => { alive = false; ac.abort() }
  }, [])

  return rates
}

export function format(usd: number, ccy: string, rate: number): string {
  const v = usd * rate
  /* no decimals on currencies where a fractional unit is noise at these amounts */
  const whole = ['INR', 'ZAR', 'MYR'].includes(ccy) || v >= 1000
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: ccy,
      maximumFractionDigits: whole ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(v)
  } catch {
    return `${ccy} ${Math.round(v).toLocaleString()}`
  }
}

/**
 * A rounded, shortened amount, for range labels like "₹65L to ₹5.3Cr".
 *
 * Full precision is noise on a band: nobody chooses between ₹66,300 and ₹66,350. Intl's
 * compact notation also knows that Indian English shortens to lakh and crore rather
 * than to K and M, which a hand-rolled version would get wrong.
 */
export function formatCompact(usd: number, ccy: string, rate: number): string {
  const v = usd * rate
  try {
    return new Intl.NumberFormat(ccy === 'INR' ? 'en-IN' : undefined, {
      style: 'currency', currency: ccy, notation: 'compact',
      maximumFractionDigits: v >= 1000 ? 1 : 0,
    }).format(v)
  } catch {
    return `${ccy} ${Math.round(v).toLocaleString()}`
  }
}

/** "Under X", "X to Y" or "Over X", in the visitor's currency. */
export function band(
  from: number, to: number | null, ccy: string, rate: number,
): string {
  if (!from && to) return `Under ${formatCompact(to, ccy, rate)}`
  if (to === null) return `Over ${formatCompact(from, ccy, rate)}`
  return `${formatCompact(from, ccy, rate)} to ${formatCompact(to, ccy, rate)}`
}

/** A price that rolls when the currency changes. */
export function Price({
  usd, ccy, rate, className = '', sub,
}: {
  usd: number; ccy: string; rate: number; className?: string; sub?: string
}) {
  const reduce = useReducedMotion()
  const text = format(usd, ccy, rate)
  return (
    <span className="inline-flex flex-col">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          initial={reduce ? false : { y: '55%', opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={reduce ? undefined : { y: '-55%', opacity: 0, filter: 'blur(4px)', position: 'absolute' }}
          transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className={className}
        >
          {text}
        </motion.span>
      </AnimatePresence>
      {sub && <span className="mt-1 text-[13px] opacity-55">{sub}</span>}
    </span>
  )
}

/** The currency selector. Shows what it guessed, and where the rate came from. */
export function CurrencyPicker({
  ccy, setCcy, rates, tone = 'dark', where = '',
}: {
  ccy: string
  setCcy: (c: string) => void
  rates: Rates
  tone?: 'dark' | 'light'
  /** where we think they are, so the page can explain its own guess */
  where?: string
}) {
  const codes = useMemo(() => Object.keys(PINNED), [])
  const dark = tone === 'dark'
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <label
        htmlFor="ccy"
        className={`font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.18em] ${
          dark ? 'text-white/45' : 'text-slate-400'}`}
      >
        Show me in
      </label>
      <div className="relative">
        <select
          id="ccy"
          value={ccy}
          onChange={e => setCcy(e.target.value)}
          className={`appearance-none rounded-full border py-1.5 pl-3 pr-9 text-[14px] font-semibold outline-none transition-colors ${
            dark
              ? 'border-white/20 bg-white/5 text-white hover:border-white/45 focus:border-white/60'
              : 'border-slate-300 bg-white text-slate-900 hover:border-slate-500 focus:border-slate-700'
          }`}
        >
          {codes.map(c => (
            <option key={c} value={c} className="text-slate-900">
              {META[c].flag} {c} — {META[c].name}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${
            dark ? 'text-white/50' : 'text-slate-500'}`}
        >
          ▼
        </span>
      </div>
      <span className={`text-[12px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>
        {ccy === 'USD'
          ? 'Billed in US dollars.'
          : rates.status === 'live'
            ? `Today's rate, ${rates.date}. Billed in USD.`
            : `Approximate, rates pinned ${rates.date}. Billed in USD.`}
        {where && ccy !== 'USD' && (
          <span className={dark ? 'text-white/30' : 'text-slate-300'}> · picked for {where}</span>
        )}
      </span>
    </div>
  )
}

export { guessCurrency, PINNED }
