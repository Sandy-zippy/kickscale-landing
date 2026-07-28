import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * The six segments, shown all at once in the hero.
 * (Replaced a rotating single-word treatment — a visitor should be able to
 * find themselves in the list immediately rather than wait for their turn.)
 *
 * Icons are inline 1.6px-stroke SVGs on currentColor so they inherit the chip
 * colour and stay crisp at any size.
 */

const s = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** hanger — bespoke / made-to-measure retail */
const Hanger = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden {...s}>
    <path d="M10 6.5V8" />
    <path d="M10 6.5a1.75 1.75 0 1 1 1.75-1.75" />
    <path d="M10 8 3 13.2a1 1 0 0 0 .6 1.8h12.8a1 1 0 0 0 .6-1.8L10 8Z" />
  </svg>
)

/** mortarboard — schools & colleges */
const Cap = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden {...s}>
    <path d="M10 3.5 18 7.5l-8 4-8-4 8-4Z" />
    <path d="M5.5 9.4v3.9c0 1.2 2 2.2 4.5 2.2s4.5-1 4.5-2.2V9.4" />
    <path d="M18 7.5v4.2" />
  </svg>
)

/** connected nodes — networking groups */
const Network = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden {...s}>
    <circle cx="10" cy="4.2" r="1.9" />
    <circle cx="4.4" cy="14.6" r="1.9" />
    <circle cx="15.6" cy="14.6" r="1.9" />
    <path d="M8.6 5.9 5.7 12.8M11.4 5.9l2.9 6.9M6.3 14.6h7.4" />
  </svg>
)

/** megaphone — PR agencies */
const Megaphone = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden {...s}>
    <path d="M16.5 4.2v11.6L7.4 13V7l9.1-2.8Z" />
    <path d="M7.4 7H4.9a1.6 1.6 0 0 0-1.6 1.6v2.8A1.6 1.6 0 0 0 4.9 13h2.5" />
    <path d="M6.6 13.2 8 17" />
  </svg>
)

/** tower — commercial real estate */
const Building = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden {...s}>
    <path d="M3.6 16.6V6.2a1 1 0 0 1 1-1h5.1a1 1 0 0 1 1 1v10.4" />
    <path d="M10.7 16.6V9.4h4.7a1 1 0 0 1 1 1v6.2" />
    <path d="M2.4 16.6h15.2" />
    <path d="M6 8.2h1.6M6 11.2h1.6M13 12.2h1.2" />
  </svg>
)

/** medical case with a cross — speciality hospitals & clinics.
    The universal healthcare mark. The case outline plus the handle keeps it
    clearly distinct from the real-estate tower two chips along, which a bare
    cross would not. */
const Medical = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden {...s}>
    <rect x="2.6" y="5.6" width="14.8" height="11.2" rx="2.2" />
    <path d="M7.2 5.6V4.3a1.2 1.2 0 0 1 1.2-1.2h3.2a1.2 1.2 0 0 1 1.2 1.2v1.3" />
    <path d="M10 8.6v5.2M7.4 11.2h5.2" />
  </svg>
)

const SEGMENTS: { label: string; icon: ReactNode }[] = [
  { label: 'Luxury & Bespoke Retail', icon: <Hanger /> },
  { label: 'Schools & Colleges', icon: <Cap /> },
  { label: 'Networking Groups', icon: <Network /> },
  { label: 'PR Agencies', icon: <Megaphone /> },
  { label: 'Speciality Hospitals & Clinics', icon: <Medical /> },
  { label: 'Commercial Real Estate', icon: <Building /> },
]

export default function SegmentChips() {
  return (
    <div className="mt-9">
      <p className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
        Built for
      </p>
      <ul className="mt-4 flex flex-wrap justify-center gap-2.5">
        {SEGMENTS.map((seg, idx) => (
          <motion.li
            key={seg.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.34 + idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[13px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-[#D5EB4B]/50 hover:bg-white/[0.12] hover:text-white"
          >
            <span className="text-[#D5EB4B]">{seg.icon}</span>
            {seg.label}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
