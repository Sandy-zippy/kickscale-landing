import { useLocation } from 'react-router-dom'

const HREF = `https://wa.me/919989990419?text=${encodeURIComponent('Hi, I found ZippyScale on your website and would like to talk.')}`

/* Routes that already pin a bar to the bottom of a phone screen. The bubble rides
   above it there instead of sitting on top of it. */
const HAS_BOTTOM_BAR = ['/ai-automation', '/ivf', '/cosmetic-dental', '/hair-transplant', '/eye-surgery', '/discovery']

/** Always-on WhatsApp button, every page. Icon-only on phones, labelled from sm up. */
export default function WhatsAppFloat() {
  const { pathname } = useLocation()
  const lift = HAS_BOTTOM_BAR.some(p => pathname.startsWith(p))
  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get in touch with us on WhatsApp"
      data-tracking="wa_float"
      className={`float-aside fixed right-4 z-[45] inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 text-[14px] font-bold text-[#0A0A0C] shadow-[0_8px_28px_rgba(0,0,0,0.28)] transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A0A0C] motion-reduce:transition-none sm:right-6 sm:px-4 ${lift ? 'bottom-[6.5rem] md:bottom-6' : 'bottom-4 sm:bottom-6'}`}
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
      <span className="hidden sm:inline">Get in touch with us</span>
    </a>
  )
}
