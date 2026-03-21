// Extend window type for dataLayer
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

/**
 * Push a custom event to GTM dataLayer
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: eventName,
    ...params,
  })
}

/**
 * Track section visibility using Intersection Observer
 * Call once per section on mount
 */
export function trackSectionView(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (!el) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          trackEvent('section_view', { section_id: sectionId })
          observer.unobserve(el) // fire once
        }
      })
    },
    { threshold: 0.3 }
  )
  observer.observe(el)
}

/**
 * Track quiz funnel progress
 */
export function trackQuizProgress(step: number, data?: Record<string, unknown>) {
  trackEvent('quiz_step_complete', { quiz_step: step, ...data })
}

/**
 * Track CTA clicks
 */
export function trackCTAClick(ctaId: string, ctaText: string) {
  trackEvent('cta_click', { cta_id: ctaId, cta_text: ctaText })
}

/**
 * Track ROI calculator usage (debounced externally)
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
