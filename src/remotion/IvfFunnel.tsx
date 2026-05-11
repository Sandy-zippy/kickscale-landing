import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const STEPS = [
  { label: 'Ad spend', value: 5_00_000, prefix: '₹', display: '5L' },
  { label: 'Form-fills', value: 200, display: '200' },
  { label: 'Consults booked', value: 80, display: '80' },
  { label: 'Consults attended', value: 50, display: '50' },
  { label: 'Cycles started', value: 12, display: '12' },
  { label: 'Cycles completed', value: 11, display: '11' },
]

const CREAM = '#FFFDF7'
const CHARCOAL = '#2A2A35'
const LIME = '#D5EB4B'
const MUTED = '#9CA3AF'

export const IvfFunnel = () => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const headerOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })

  const stepProgress = STEPS.map((_, i) => {
    const startFrame = 18 + i * 14
    return spring({ frame: frame - startFrame, fps, config: { damping: 18, stiffness: 80 } })
  })

  const lineProgress = interpolate(frame, [18, 18 + STEPS.length * 14 + 8], [0, 1], {
    extrapolateRight: 'clamp',
  })

  const bottomReveal = spring({
    frame: frame - (18 + STEPS.length * 14 + 12),
    fps,
    config: { damping: 14, stiffness: 70 },
  })

  // Loop - last 24 frames fade out, then restart
  const loopOpacity = frame > durationInFrames - 18 ? interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0]) : 1

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        fontFamily: 'Inter, -apple-system, sans-serif',
        opacity: loopOpacity,
        padding: '60px 80px',
      }}
    >
      {/* Header */}
      <div style={{ opacity: headerOpacity, marginBottom: 48 }}>
        <div
          style={{
            fontSize: 14,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: LIME,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          Cycle-Attribution Funnel
        </div>
        <div
          style={{
            fontSize: 36,
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            color: CHARCOAL,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          ₹5L spent. 11 cycles booked.
          <br />
          <span style={{ color: LIME }}>Every step measured.</span>
        </div>
      </div>

      {/* Funnel nodes */}
      <div style={{ position: 'relative', flex: 1 }}>
        {/* Connecting line */}
        <div
          style={{
            position: 'absolute',
            top: 50,
            left: 50,
            right: 50,
            height: 2,
            background: `linear-gradient(to right, ${LIME} 0%, ${LIME} ${lineProgress * 100}%, ${MUTED} ${lineProgress * 100}%, ${MUTED} 100%)`,
            opacity: 0.5,
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 16,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {STEPS.map((step, i) => {
            const p = stepProgress[i]
            const numericProgress = interpolate(p, [0, 1], [0, 1])
            const numToShow = Math.round(step.value * numericProgress)
            const formatted =
              step.prefix === '₹' && numToShow >= 100000
                ? `₹${(numToShow / 100000).toFixed(1)}L`
                : step.prefix === '₹'
                ? `₹${numToShow.toLocaleString('en-IN')}`
                : numToShow.toLocaleString('en-IN')

            return (
              <div
                key={step.label}
                style={{
                  textAlign: 'center',
                  opacity: p,
                  transform: `translateY(${(1 - p) * 12}px) scale(${0.85 + p * 0.15})`,
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    backgroundColor: CREAM,
                    border: `3px solid ${i === STEPS.length - 1 ? LIME : CHARCOAL}`,
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: p > 0.7 ? `0 0 0 6px ${LIME}33` : 'none',
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 22,
                      fontWeight: 700,
                      color: i === STEPS.length - 1 ? LIME : CHARCOAL,
                    }}
                  >
                    {p < 0.05 ? '—' : formatted}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: CHARCOAL,
                    lineHeight: 1.3,
                  }}
                >
                  {step.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom callout */}
      <div
        style={{
          opacity: bottomReveal,
          transform: `translateY(${(1 - bottomReveal) * 16}px)`,
          padding: '20px 28px',
          borderRadius: 12,
          border: `2px solid ${CHARCOAL}`,
          backgroundColor: CHARCOAL,
          marginTop: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: LIME,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          →
        </div>
        <div style={{ color: CREAM, fontSize: 18, lineHeight: 1.4, fontWeight: 500 }}>
          Cost per cycle booked: <span style={{ color: LIME, fontWeight: 700 }}>₹45,455</span>{' '}
          <span style={{ opacity: 0.6, fontWeight: 400 }}>· Not cost per form-fill. The only number your CFO cares about.</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
