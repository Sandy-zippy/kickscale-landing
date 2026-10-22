/**
 * The homepage's one reduced-motion policy.
 *
 * `prefers-reduced-motion` used to switch the page off: every loop stopped and the
 * drifting agents rendered nothing, so on a phone with Reduce Motion (or a browser
 * that maps battery saving onto it) the page looked dead. Reduced motion is about
 * things that TRAVEL across the screen, not about things that change. So:
 *
 *   calm = true  → no travel, bobbing, parallax or flight.
 *                  Fades, glows, blinks, shimmers and crossfades stay.
 *
 * `hover` is separate: spotlight, tilt and magnetic pull only make sense with a
 * real pointer, so phones get press feedback instead.
 */
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export function useCalmMotion() {
  return !!useReducedMotion()
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

export const useCanHover = () => useMedia('(hover: hover) and (pointer: fine)')
export const useWide = () => useMedia('(min-width: 1024px)')

/** Where the pointer is relative to a point, as (-1..1, -1..1), soft-saturated so it
 *  never slams into a stop. From the MIT "Mascot Portfolio Hero" on 21st.dev
 *  (@kedhareswer), the one piece of it we use. */
export function aim(px: number, py: number, cx: number, cy: number, rx: number, ry: number) {
  const sat = (v: number) => v / Math.sqrt(1 + v * v)
  return [sat((px - cx) / rx), sat((py - cy) / ry)] as const
}
