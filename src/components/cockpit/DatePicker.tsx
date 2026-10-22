/**
 * A month calendar for picking the day of a call.
 *
 * A dropdown of dates works, but nobody thinks about their week as a list. They think
 * about it as a grid, and they already know what Tuesday the 29th means in a way that
 * "Tue 29 Sep · 15 free" never quite conveys.
 *
 * Two deliberate choices:
 *   · the grid opens as a popover, not inline, so the form card never changes height
 *     when it opens. A card that resizes under you is what made the first version of
 *     this feel unstable.
 *   · a day with no free slots is disabled and dimmed rather than hidden, because a
 *     gap in a calendar reads as "he is busy", which is true and is fine to show.
 *
 * Availability arrives keyed by IST date. The visitor may be anywhere, so the keys are
 * computed in Asia/Kolkata and never from the browser's own clock.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { LIME } from '../growth/kinetic'

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']

/** 'YYYY-MM-DD' for an instant, as it falls in India. en-CA gives that order natively. */
export function istKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso))
}

/** Monday-first weekday index for a 'YYYY-MM-DD' key. */
function dow(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
}

function keyOf(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function DatePicker({
  available, value, onChange, placeholder = 'Choose a day', label,
}: {
  /** IST date keys that have at least one free slot, mapped to how many */
  available: Record<string, number>
  value: string
  onChange: (key: string) => void
  placeholder?: string
  label?: string
}) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  const keys = useMemo(() => Object.keys(available).sort(), [available])
  const first = keys[0] ?? ''
  const last = keys[keys.length - 1] ?? ''

  /* Open on the month holding the selection, or the first month with anything free. */
  const [cursor, setCursor] = useState(() => {
    const seed = value || first
    if (!seed) { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() } }
    const [y, m] = seed.split('-').map(Number)
    return { y, m: m - 1 }
  })

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const canPrev = !!first && keyOf(cursor.y, cursor.m, 1) > first
  const canNext = !!last && keyOf(cursor.y, cursor.m, daysInMonth(cursor.y, cursor.m)) < last

  const cells: (string | null)[] = []
  const lead = dow(keyOf(cursor.y, cursor.m, 1))
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth(cursor.y, cursor.m); d++) cells.push(keyOf(cursor.y, cursor.m, d))

  const shown = value
    ? new Intl.DateTimeFormat('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
      }).format(new Date(value + 'T00:00:00Z'))
    : ''

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={`mt-2 flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-[15px] outline-none transition-colors ${
          open ? 'border-slate-900' : 'border-slate-300 hover:border-slate-500'
        } ${shown ? 'text-slate-900' : 'text-slate-400'}`}
      >
        <span className="truncate">{shown || placeholder}</span>
        <span aria-hidden className="ml-2 shrink-0 text-[14px] opacity-50">🗓</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_-12px_rgba(10,10,12,0.3)]"
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <button
                type="button" aria-label="Previous month" disabled={!canPrev}
                onClick={() => setCursor(c => (c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 }))}
                className="grid h-7 w-7 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent"
              >
                ‹
              </button>
              <span className="font-['Space_Grotesk'] text-[14px] font-bold text-slate-900">
                {MONTHS[cursor.m]} {cursor.y}
              </span>
              <button
                type="button" aria-label="Next month" disabled={!canNext}
                onClick={() => setCursor(c => (c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 }))}
                className="grid h-7 w-7 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-25 disabled:hover:bg-transparent"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 pb-1">
              {WEEK.map((w, i) => (
                <span key={i} className="grid h-6 place-items-center text-[10.5px] font-semibold uppercase text-slate-400">
                  {w}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((k, i) => {
                if (!k) return <span key={`x${i}`} />
                const free = available[k] ?? 0
                const on = k === value
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={!free}
                    onClick={() => { onChange(k); setOpen(false) }}
                    className={`grid h-9 place-items-center rounded-lg text-[13.5px] font-semibold transition-colors ${
                      on ? '' : free ? 'text-slate-900 hover:bg-slate-100' : 'cursor-not-allowed text-slate-300'
                    }`}
                    style={on ? { background: LIME, color: '#0A0A0C' } : undefined}
                    title={free ? `${free} free` : 'Nothing free'}
                  >
                    {Number(k.slice(-2))}
                  </button>
                )
              })}
            </div>

            <p className="mt-2 border-t border-slate-100 pt-2 text-center text-[11px] text-slate-400">
              Greyed days have nothing free
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
