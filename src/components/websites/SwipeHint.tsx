/** Phones only: tells the reader a row scrolls sideways. Hidden from 640px up. */
export default function SwipeHint({ dark, count }: { dark?: boolean; count?: number }) {
  return (
    <p aria-hidden className={`mt-3 flex items-center gap-2 text-[13px] font-semibold sm:hidden ${dark ? 'text-white/60' : 'text-[#111111]/60'}`}>
      Swipe{count ? ` through all ${count}` : ' for more'}
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 5h13M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </p>
  )
}
