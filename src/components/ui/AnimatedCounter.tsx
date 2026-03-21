import { useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedCounterProps {
  target: number
  prefix?: string
  suffix?: string
  className?: string
  style?: CSSProperties
  duration?: number
  decimals?: number
}

export default function AnimatedCounter({ target, prefix = '', suffix = '', className = '', style, duration = 2, decimals = 0 }: AnimatedCounterProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v))
  const [display, setDisplay] = useState<number | string>(0)

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, target, { duration })
      return controls.stop
    }
  }, [isInView, target, count, duration])

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => setDisplay(v))
    return unsubscribe
  }, [rounded])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{display}{suffix}
    </span>
  )
}
