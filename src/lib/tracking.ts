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
