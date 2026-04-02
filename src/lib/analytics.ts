export function captureUTM() {
  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  keys.forEach(key => {
    const val = params.get(key)
    if (val) sessionStorage.setItem(key, val)
  })

  // Capture fbclid and construct fbc for Meta CAPI event matching
  const fbclid = params.get('fbclid')
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`
    localStorage.setItem('zippy_fbc', fbc)
  }

  // Persist fbp cookie to localStorage as fallback
  const fbpCookie = document.cookie.match(/_fbp=([^;]+)/)?.[1]
  if (fbpCookie) localStorage.setItem('zippy_fbp', fbpCookie)
}

export function trackEvent(event: string) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', event)
  }
}

export function getFbcParam(): string {
  // Priority: cookie > localStorage (from fbclid capture)
  return document.cookie.match(/_fbc=([^;]+)/)?.[1]
    || localStorage.getItem('zippy_fbc')
    || ''
}

export function getFbpParam(): string {
  return document.cookie.match(/_fbp=([^;]+)/)?.[1]
    || localStorage.getItem('zippy_fbp')
    || ''
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
