/* The /websites assistant and the visitor journey it keeps.
 *
 * House rule (from the cockpit's chatbot.js): a bot is a MENU, not a free-text LLM.
 * Every line below is written beforehand from the approved copy in data/websites.ts,
 * at most three options per step, and it never invents a price, timeline or promise.
 * Prices are USD text only, straight from PACKAGES.
 *
 * The journey is the Growth package's "tracking bot", shown live: which sections the
 * visitor read and for how long, how far they scrolled, what they picked in the bot and
 * the ad that brought them. It is kept in memory only and attached as `journey` to a
 * bot lead and a booking, so the team does not ask twice.
 */
import { BUILD, FAQ, FORM, PACKAGES, PACKAGES_COPY, PROOF, WORK_COPY } from '../data/websites'
import { BOOKING_ENDPOINT } from '../data/discovery'
import { getUTMParams, getFbcParam, getFbpParam } from './analytics'

/* ── journey ──────────────────────────────────────────────────────────────── */

type Journey = { secs: Map<string, number>; since: Map<string, number>; depth: number; picks: string[] }
const J: Journey = { secs: new Map(), since: new Map(), depth: 0, picks: [] }

/** Watch every `section[id]` on the page. Returns a stop function. */
export function startJourney(root: Document = document): () => void {
  const io = new IntersectionObserver(entries => {
    const now = Date.now()
    entries.forEach(e => {
      const id = (e.target as HTMLElement).id
      if (e.isIntersecting) J.since.set(id, now)
      else if (J.since.has(id)) {
        J.secs.set(id, (J.secs.get(id) ?? 0) + (now - J.since.get(id)!) / 1000)
        J.since.delete(id)
      }
    })
  }, { threshold: 0.35 })
  root.querySelectorAll('section[id], [data-journey][id]').forEach(s => io.observe(s))
  const onScroll = () => {
    const max = root.documentElement.scrollHeight - window.innerHeight
    const pct = max > 0 ? Math.round(((window.scrollY + 2) / max) * 100) : 100
    if (pct > J.depth) J.depth = Math.min(100, pct)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
}

export function notePick(label: string) { J.picks.push(label) }

/** One short line, readable in a Sheet cell or a WhatsApp thread. */
export function journeySummary(): string {
  const now = Date.now()
  const secs = new Map(J.secs)
  J.since.forEach((t, id) => secs.set(id, (secs.get(id) ?? 0) + (now - t) / 1000))
  const read = [...secs].filter(([, s]) => s >= 2).sort((a, b) => b[1] - a[1])
    .map(([id, s]) => `${id} ${Math.round(s)}s`).join(', ')
  const u = getUTMParams()
  const src = [u.utm_source, u.utm_medium, u.utm_campaign].filter(Boolean).join('/') || 'direct'
  return [
    `Read: ${read || 'none yet'}`,
    `Scroll: ${J.depth}%`,
    J.picks.length ? `Bot: ${J.picks.join(' > ')}` : '',
    `Source: ${src}`,
  ].filter(Boolean).join(' | ')
}

/** Test hook. */
export function resetJourney() { J.secs.clear(); J.since.clear(); J.depth = 0; J.picks.length = 0 }

/* ── the menu ─────────────────────────────────────────────────────────────── */

export type Opt = { id: string; label: string }
export type Step = {
  says: string[]
  options: Opt[]
  /** what the page should do when this step is reached */
  act?: 'scroll-work' | 'scroll-packages' | 'open-booking'
  /** ask for one value, then go to `next` */
  ask?: { key: 'name' | 'phone' | 'email'; label: string; type: 'text' | 'tel' | 'email'; next: string }
}

export const GREETING = 'Hi, I am the ZippyScale website assistant. What brings you here?'
export const JOURNEY_NOTE = 'I keep a note of what you looked at so the team does not ask you twice.'

const NEXT: Opt[] = [
  { id: 'book', label: 'Book a call' },
  { id: 'number', label: 'Leave my number' },
  { id: 'start', label: 'Back to start' },
]

const usd = (n: number) => `$${n.toLocaleString('en-US')}`
const faqPage = (p: number): Step => {
  const two = FAQ.items.slice(p * 2, p * 2 + 2)
  const more = (p + 1) * 2 < FAQ.items.length
  return {
    says: ['Pick a question.'],
    options: [
      ...two.map((f, i) => ({ id: `faq-${p * 2 + i}`, label: f.q })),
      more ? { id: `faqs-${p + 1}`, label: 'More questions' } : { id: 'start', label: 'Back to start' },
    ],
  }
}

export function step(id: string): Step {
  if (id === 'start') return {
    says: [GREETING, JOURNEY_NOTE],
    options: [
      { id: 'packages', label: 'See packages' },
      { id: 'book', label: 'Book a call' },
      { id: 'else', label: 'Something else' },
    ],
  }
  if (id === 'else') return {
    says: ['Sure. What would help?'],
    options: [
      { id: 'need', label: 'What do you need?' },
      { id: 'work', label: 'See our work' },
      { id: 'faqs-0', label: 'Ask something else' },
    ],
  }
  if (id === 'need') return {
    says: [BUILD.title],
    options: [
      { id: 'need-0', label: 'A website' },
      { id: 'need-1', label: 'A landing page' },
      { id: 'need-more', label: 'Funnel, store or video' },
    ],
  }
  if (id === 'need-more') return {
    says: ['Which one?'],
    options: [
      { id: 'need-2', label: 'VSL page or funnel' },
      { id: 'need-3', label: 'Online store' },
      { id: 'need-4', label: 'Motion and video' },
    ],
  }
  const need = id.match(/^need-(\d)$/)
  if (need) {
    const b = BUILD.items[+need[1]]
    return { says: [`${b.t} ${b.d}`], options: NEXT }
  }
  if (id === 'packages') return {
    says: [
      ...PACKAGES.map(p => `${p.id}: ${p.from ? 'from ' : ''}${usd(p.usd)}. ${p.for}`),
      PACKAGES_LINE,
    ],
    options: NEXT,
    act: 'scroll-packages',
  }
  if (id === 'work') return { says: [WORK_COPY.title, PROOF.line], options: NEXT, act: 'scroll-work' }
  const faqs = id.match(/^faqs-(\d+)$/)
  if (faqs) return faqPage(+faqs[1])
  const faq = id.match(/^faq-(\d+)$/)
  if (faq) return { says: [FAQ.items[+faq[1]].a], options: NEXT }
  if (id === 'book') return {
    says: [FORM.sub],
    options: [{ id: 'number', label: 'Leave my number instead' }, { id: 'start', label: 'Back to start' }],
    act: 'open-booking',
  }
  if (id === 'number') return { says: ['What is your name?'], options: [], ask: { key: 'name', label: 'Your name', type: 'text', next: 'ask-phone' } }
  if (id === 'ask-phone') return { says: ['Your mobile, with the country code?'], options: [], ask: { key: 'phone', label: 'Mobile with country code', type: 'tel', next: 'ask-email' } }
  if (id === 'ask-email') return { says: ['And your email?'], options: [], ask: { key: 'email', label: 'Email', type: 'email', next: 'send' } }
  return step('start')
}

const PACKAGES_LINE = `Prices are in US dollars. ${PACKAGES_COPY.notSure}`

export function validAnswer(key: 'name' | 'phone' | 'email', v: string): boolean {
  if (key === 'email') return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())
  if (key === 'phone') return v.replace(/\D/g, '').length >= 7
  return v.trim().length >= 2
}

/** The lead the bot sends. Pure, so it can be checked without a network. */
export function botLeadPayload(c: { name: string; phone: string; email: string }, summary: string) {
  return {
    action: 'lead' as const,
    service: 'website',
    name: c.name.trim(),
    phone: c.phone.trim(),
    email: c.email.trim(),
    /* the backend requires a company on every lead; the bot does not ask for one */
    company: 'Not given (website assistant)',
    need: `Website assistant chat. ${summary}`,
    journey: summary,
    ...getUTMParams(),
    utm_content: 'site-bot',
    fbc: getFbcParam(),
    fbp: getFbpParam(),
    landed: typeof document !== 'undefined' ? (document.referrer || 'direct') : 'direct',
  }
}

export async function sendBotLead(payload: ReturnType<typeof botLeadPayload>, f: typeof fetch = fetch) {
  const r = await f(BOOKING_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify(payload),
  })
  return r.json() as Promise<{ ok?: boolean; error?: string }>
}
