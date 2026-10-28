import { useEffect, type RefObject } from 'react'

/* While a booking form is on a phone screen, the floating bot launcher and WhatsApp
   bubble step aside (globals.css hides `.float-aside` under 768px when <html> carries
   data-form-onscreen). Desktop never matches that media query, so it is untouched. */
export function useFormOnScreen(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const html = document.documentElement
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) html.setAttribute('data-form-onscreen', '')
      else html.removeAttribute('data-form-onscreen')
    }, { threshold: 0.05 })
    io.observe(el)
    return () => { io.disconnect(); html.removeAttribute('data-form-onscreen') }
  }, [ref])
}
