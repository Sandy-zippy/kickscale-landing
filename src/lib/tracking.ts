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
  trackEvent('quiz_submit', { lead_source: 'automation-lp-v3', ...data })
  window.fbq?.('track', 'Lead', {
    content_name: 'AI Automation Audit',
    content_category: 'quiz_submission',
    ...data,
  })
}

/**
 * Track section scroll depth — Meta Pixel custom event
 */
export function trackSectionScroll(sectionId: string) {
  window.fbq?.('trackCustom', 'SectionView', { section: sectionId })
}
