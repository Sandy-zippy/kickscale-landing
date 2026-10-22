// Extend window type for dataLayer, GA4 gtag, Meta Pixel
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * Push event to GA4 via gtag + dataLayer
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  // dataLayer push (for any future GTM use)
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event: eventName, ...params })

  // GA4 direct event
  window.gtag?.('event', eventName, params)
}

/**
 * Track section visibility using Intersection Observer
 */
export function trackSectionView(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (!el) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          trackEvent('section_view', { section_id: sectionId })
          observer.unobserve(el)
        }
      })
    },
    { threshold: 0.3 }
  )
  observer.observe(el)
}

/**
 * Track quiz funnel progress — GA4 + Meta Pixel
 */
export function trackQuizProgress(step: number, data?: Record<string, unknown>) {
  trackEvent('quiz_step_complete', { quiz_step: step, ...data })
}

/**
 * Track CTA clicks — GA4 + Meta Pixel ViewContent
 */
export function trackCTAClick(ctaId: string, ctaText: string) {
  trackEvent('cta_click', { cta_id: ctaId, cta_text: ctaText })
  window.fbq?.('track', 'ViewContent', { content_name: ctaText, content_category: ctaId })
}

/**
 * Track ROI calculator usage
 */
export function trackROICalculator(params: Record<string, unknown>) {
  trackEvent('roi_calculator_used', params)
}

/**
 * Track awareness self-selection
 */
export function trackAwarenessSelect(level: string) {
  trackEvent('awareness_self_select', { awareness_level: level })
}

/**
 * Track quiz start — GA4 + Meta Pixel InitiateCheckout
 */
export function trackQuizStart() {
  trackEvent('quiz_start')
  window.fbq?.('track', 'InitiateCheckout', { content_name: 'AI Automation Audit Quiz' })
}

/**
 * Track quiz submission — GA4 + Meta Pixel Lead
 */
export function trackQuizSubmit(data?: Record<string, unknown>) {
  /* The event id has to be the FOURTH argument to fbq. Passing it inside the params
     object, which is what this did, means Meta never sees it, and since the Apps Script
     backend also sends this Lead through the Conversions API every quiz submission was
     being counted twice. A doubled conversion count is worse than none: it makes a
     campaign look like it is working. */
  const eventId = `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  trackEvent('quiz_submit', { lead_source: 'automation-lp-v6', event_id: eventId, ...data })
  window.fbq?.('track', 'Lead', {
    content_name: 'AI Automation Audit',
    content_category: 'quiz_submission',
    ...data,
  }, { eventID: eventId })
}

/**
 * Track section scroll depth — Meta Pixel custom event
 */
export function trackSectionScroll(sectionId: string) {
  window.fbq?.('trackCustom', 'SectionView', { section: sectionId })
}

/**
 * The discovery funnel, reported to Meta and GA4.
 *
 * Without these the pixel records page views and nothing else, which means Meta has no
 * conversion to optimise towards and every rupee of ad spend is bought blind. That is
 * the difference between a campaign that learns and one that just spends.
 *
 * Event names are Meta's standard ones on purpose. `Lead` and `Schedule` are recognised
 * by the platform, so they can be chosen as the optimisation goal in Ads Manager
 * without setting up a custom conversion first.
 *
 * `eventId` lets a server-side Conversions API call be matched to the browser event and
 * deduplicated later, so adding CAPI does not mean double-counting every lead.
 */
export function trackDiscovery(
  step: 'start' | 'step_2' | 'step_3' | 'lead' | 'booked',
  params: Record<string, unknown> = {},
) {
  const eventId = `${step}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  /* GA4 and GTM get every step, because the drop-off between them is the only way to
     tell a bad ad from a bad form. */
  trackEvent(`discovery_${step}`, { ...params, event_id: eventId })

  const META: Record<string, string> = {
    start: 'InitiateCheckout',   // opened the form
    step_2: 'AddToCart',         // told us about their business
    step_3: 'AddPaymentInfo',    // reached the contact step
    lead: 'Lead',                // details submitted
    booked: 'Schedule',          // a call is in the calendar
  }
  /* content_name is what lets a Custom Conversion in Ads Manager separate a cockpit
     enquiry from an AI-automation quiz lead. Both fire the standard `Lead` event, and a
     campaign that optimises for raw `Lead` would chase a blend of two different products
     sold to two different people. */
  const name = META[step]
  if (name) {
    window.fbq?.('track', name, {
      content_name: 'Agentic Cockpit discovery',
      content_category: 'cockpit',
      ...params,
    }, { eventID: eventId })
  }

  return eventId
}

/**
 * Ad-landing funnel diagnostics (Meta custom events + GA4), for /agentic-cockpit.
 * Added 22 Oct 2026: 19 ad clicks, 0 form fills, no way to see where people dropped.
 * Custom events only; the standard funnel events above stay untouched.
 */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term'] as const
const UTM_STORE = 'zs_utm'

/* Read on load and keep for the session, so a hash jump or route change does not lose them. */
function utms(): Record<string, string> {
  let saved: Record<string, string> = {}
  try { saved = JSON.parse(sessionStorage.getItem(UTM_STORE) || '{}') } catch { /* private mode */ }
  const q = new URLSearchParams(window.location.search)
  const fresh: Record<string, string> = {}
  UTM_KEYS.forEach(k => { const v = q.get(k); if (v) fresh[k] = v })
  if (Object.keys(fresh).length) {
    saved = fresh
    try { sessionStorage.setItem(UTM_STORE, JSON.stringify(saved)) } catch { /* private mode */ }
  }
  return saved
}

export function trackFunnel(name: string, params: Record<string, unknown> = {}) {
  const p = { ...utms(), page_path: window.location.pathname, ...params }
  window.fbq?.('trackCustom', name, p)
  trackEvent(name, p)
}

/* Once per field per page load. Only the field name is sent, never what was typed. */
const answered = new Set<string>()
export function trackFieldAnswered(field: string) {
  if (answered.has(field)) return
  answered.add(field)
  trackFunnel('Field_Answered', { field })
}

/** Mounts CTA_Click, Form_Seen, Scroll_Depth and Time_On_Page. Returns the cleanup. */
export function startLandingFunnel(formId = 'book') {
  utms()
  const off: Array<() => void> = []

  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.(`a[href="#${formId}"]`)
    if (!a) return
    const top = a.getBoundingClientRect().top + window.scrollY
    const location = a.closest('nav, header') ? 'header'
      : a.closest('footer') ? 'footer'
      : a.closest('#price') || top > window.innerHeight * 2 ? 'mid' : 'hero'
    trackFunnel('CTA_Click', { location, text: (a.textContent || '').trim().slice(0, 60) })
  }
  document.addEventListener('click', onClick, true)
  off.push(() => document.removeEventListener('click', onClick, true))

  /* The form mounts with the page, but poll briefly in case it renders late. */
  let io: IntersectionObserver | undefined
  const watchForm = () => {
    const el = document.getElementById(formId)
    if (!el) return false
    io = new IntersectionObserver(entries => {
      if (entries.some(en => en.isIntersecting)) { trackFunnel('Form_Seen'); io?.disconnect() }
    }, { threshold: 0.3 })
    io.observe(el)
    return true
  }
  if (!watchForm()) {
    const t = window.setInterval(() => { if (watchForm()) window.clearInterval(t) }, 500)
    off.push(() => window.clearInterval(t))
  }
  off.push(() => io?.disconnect())

  const marks = [25, 50, 75, 100]
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const pct = max > 0 ? ((window.scrollY + 2) / max) * 100 : 100
    while (marks.length && pct >= marks[0]) trackFunnel('Scroll_Depth', { percent: marks.shift() })
    if (!marks.length) window.removeEventListener('scroll', onScroll)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  off.push(() => window.removeEventListener('scroll', onScroll))

  const timers = [15, 45, 90].map(s => window.setTimeout(() => trackFunnel('Time_On_Page', { seconds: s }), s * 1000))
  off.push(() => timers.forEach(t => window.clearTimeout(t)))

  return () => off.forEach(f => f())
}
