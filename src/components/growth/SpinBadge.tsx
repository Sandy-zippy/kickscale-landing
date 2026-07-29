/**
 * Rotating circular badge beside the closing CTA — SVG textPath on a circle,
 * spun by a CSS transform. Decorative, so it is aria-hidden and the arrow is
 * not a link; the real CTA sits next to it.
 */
import { LIME } from './kinetic'

export default function SpinBadge({ size = 108 }: { size?: number }) {
  const label = 'ZIPPYSCALE.IN · GROWTH PARTNERS · '
  return (
    <span
      aria-hidden
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" className="zs-spin absolute inset-0 h-full w-full">
        <defs>
          {/* start at 12 o'clock and run clockwise so the text reads naturally */}
          <path id="zs-badge-ring" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" fill="none" />
        </defs>
        <text
          fontFamily="JetBrains Mono, monospace"
          fontSize="10.5"
          fontWeight="700"
          letterSpacing="2.6"
          fill={LIME}
          fillOpacity="0.8"
        >
          <textPath href="#zs-badge-ring" startOffset="0">
            {label.repeat(2)}
          </textPath>
        </text>
      </svg>
      <span
        className="flex h-[46px] w-[46px] items-center justify-center rounded-full border text-[17px] font-bold"
        style={{ borderColor: `${LIME}55`, color: LIME }}
      >
        ↗
      </span>
    </span>
  )
}
