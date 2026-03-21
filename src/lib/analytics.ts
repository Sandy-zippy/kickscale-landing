export function captureUTM() {
  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  keys.forEach(key => {
    const val = params.get(key)
    if (val) sessionStorage.setItem(key, val)
  })
}

export function trackEvent(event: string) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', event)
  }
}

export function getUTMParams(): Record<string, string> {
  const params: Record<string, string> = {}
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  keys.forEach(key => {
    const val = sessionStorage.getItem(key)
    if (val) params[key] = val
  })
  return params
}
