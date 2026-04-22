import { useState } from 'react'

interface Props {
  beforeSrc: string
  afterSrc: string
  beforeAlt: string
  afterAlt: string
  beforeLabel?: string
  afterLabel?: string
}

export default function ComparisonSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: Props) {
  const [pos, setPos] = useState(50)

  return (
    <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl border border-[#E5E7EB] select-none bg-white">
      <img src={afterSrc} alt={afterAlt} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={beforeSrc} alt={beforeAlt} className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <span className="absolute top-3 left-3 text-xs font-mono bg-red-500/90 text-white px-2 py-1 rounded">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 text-xs font-mono bg-[#22C55E]/90 text-white px-2 py-1 rounded">
        {afterLabel}
      </span>
      <div
        className="absolute inset-y-0 w-1 bg-white shadow-lg pointer-events-none"
        style={{ left: `${pos}%` }}
        aria-hidden="true"
      />
      <input
        type="range"
        min="0"
        max="100"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare before and after"
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />
    </div>
  )
}
