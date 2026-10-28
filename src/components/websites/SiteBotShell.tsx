/**
 * The /websites bot's visual shell. Webby owns the conversation logic; this only draws
 * it: a launcher stacked above the WhatsApp bubble (which sits at right-4/6, bottom-4/6,
 * 48px tall), and a panel with bubbles, typing dots before each new bot line, option
 * chips and an input row.
 *
 * Accessibility: role=dialog with a focus trap while open, Esc closes and returns focus
 * to the launcher, the message log is aria-live=polite, every control is a real button
 * or labelled input with a visible focus ring and a 44px target.
 */
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Agent } from '../cockpit/Agent'
import { useCalmMotion } from '../cockpit/useCalmMotion'
import { TypingDots } from './HeroAgentic'
import { EASE_OUT, MONO } from './tokens'

type Msg = { from: 'bot' | 'you'; text: string }
type Props = {
  open: boolean
  onToggle: () => void
  messages: Msg[]
  options: { id: string; label: string }[]
  onPick: (id: string) => void
  input?: { label: string; type: 'text' | 'email' | 'tel'; onSubmit: (v: string) => void } | null
  title: string
  status: string
}

const TYPING_MS = 650
const AUTOCOMPLETE = { text: 'name', email: 'email', tel: 'tel' } as const

export default function SiteBotShell({ open, onToggle, messages, options, onPick, input, title, status }: Props) {
  const calm = useCalmMotion()
  const launcher = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(open)

  /* a new bot line shows typing dots first; "you" lines appear at once */
  const [shown, setShown] = useState(messages.length)
  useEffect(() => {
    if (messages.length < shown) { setShown(messages.length); return }
    if (messages.length === shown) return
    const next = messages[shown]
    if (next.from === 'you' || !open) { setShown(shown + 1); return }
    const id = setTimeout(() => setShown(shown + 1), TYPING_MS)
    return () => clearTimeout(id)
  }, [messages, shown, open])
  const typing = shown < messages.length
  const visible = messages.slice(0, shown)

  useLayoutEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: calm ? 'auto' : 'smooth' })
  }, [shown, typing, calm])

  /* focus in on open, back to the launcher on close */
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        const p = panel.current
        const first = ['input', '[data-chip]', '[data-close]'].map(q => p?.querySelector<HTMLElement>(q)).find(Boolean)
        first?.focus()
      })
      return () => cancelAnimationFrame(id)
    }
    if (wasOpen.current) launcher.current?.focus()
  }, [open])
  useEffect(() => { wasOpen.current = open }, [open])

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.stopPropagation(); onToggle(); return }
    if (e.key !== 'Tab' || !panel.current) return
    const f = Array.from(panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'))
    if (!f.length) return
    const [a, z] = [f[0], f[f.length - 1]]
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
  }

  const [value, setValue] = useState('')
  useEffect(() => setValue(''), [input?.label])
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = value.trim()
    if (!v || !input) return
    input.onSubmit(v)
    setValue('')
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="zs-bot-title"
            onKeyDown={onKey}
            initial={{ opacity: 0, y: calm ? 0 : 16, scale: calm ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: calm ? 0 : 10, transition: { duration: 0.18 } }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
            style={{ transformOrigin: 'bottom right', marginBottom: 'env(safe-area-inset-bottom)' }}
            className="fixed bottom-[8.75rem] right-4 z-[46] flex max-h-[min(560px,calc(100dvh-10rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111111] text-white shadow-[0_30px_80px_-24px_rgba(0,0,0,0.7)] sm:bottom-[9.5rem] sm:right-6"
          >
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.06]"><Agent skin="lime" size={28} mood="happy" /></span>
              <div className="min-w-0 flex-1">
                <p id="zs-bot-title" className="truncate font-['Space_Grotesk'] text-[15px] font-bold">{title}</p>
                <p className={`${MONO} flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-white/55`}>
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#D9EA66]" />{status}
                </p>
              </div>
              <button
                type="button"
                data-close
                onClick={onToggle}
                aria-label="Close chat"
                className="grid h-11 w-11 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9EA66]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </header>

            <div ref={log} role="log" aria-live="polite" aria-relevant="additions" className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-4">
              {visible.map((m, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: calm ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className={`max-w-[85%] whitespace-pre-line px-3.5 py-2.5 text-[14px] leading-snug ${
                    m.from === 'bot' ? 'rounded-2xl rounded-bl-md bg-white/[0.08] text-white' : 'ml-auto rounded-2xl rounded-br-md bg-[#D9EA66] text-[#111111]'
                  }`}
                >
                  <span className="sr-only">{m.from === 'bot' ? `${title}: ` : 'You: '}</span>{m.text}
                </motion.p>
              ))}
              {typing && (
                <span className="inline-flex rounded-2xl rounded-bl-md bg-white/[0.08] px-3.5 py-3.5"><TypingDots /><span className="sr-only">{title} is typing</span></span>
              )}
            </div>

            {!typing && options.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-3">
                {options.map(o => (
                  <motion.button
                    key={o.id}
                    type="button"
                    data-chip
                    onClick={() => onPick(o.id)}
                    whileTap={{ scale: 0.95 }}
                    className="min-h-[44px] rounded-full border border-white/20 px-4 text-[13.5px] font-medium text-white hover:border-[#D9EA66] hover:bg-[#D9EA66] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9EA66]"
                  >
                    {o.label}
                  </motion.button>
                ))}
              </div>
            )}

            {input && !typing && (
              <form onSubmit={submit} className="border-t border-white/10 px-4 pb-4 pt-3">
                <label htmlFor="zs-bot-input" className={`${MONO} mb-1.5 block text-[10.5px] uppercase tracking-[0.14em] text-white/55`}>{input.label}</label>
                <div className="flex gap-2">
                  <input
                    id="zs-bot-input"
                    type={input.type}
                    required
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    autoComplete={AUTOCOMPLETE[input.type]}
                    inputMode={input.type === 'tel' ? 'tel' : input.type === 'email' ? 'email' : undefined}
                    className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-[16px] text-white placeholder:text-white/35 focus:border-[#D9EA66] focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Send"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#D9EA66] text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* launcher: one 12px gap above the WhatsApp bubble */}
      <motion.button
        ref={launcher}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? 'Close chat' : `Chat with ${title}`}
        whileTap={{ scale: 0.92 }}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        className="float-aside fixed bottom-[4.75rem] right-4 z-[46] grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-[#111111] shadow-[0_10px_30px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9EA66] focus-visible:ring-offset-2 sm:bottom-[5.25rem] sm:right-6"
      >
        {!open && !calm && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-[#D9EA66]"
            animate={{ opacity: [0.7, 0], scale: [1, 1.35] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg key="x" width="18" height="18" viewBox="0 0 16 16" aria-hidden initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ opacity: 0 }}>
              <path d="M3 3l10 10M13 3L3 13" stroke="#D9EA66" strokeWidth="2" strokeLinecap="round" />
            </motion.svg>
          ) : (
            <motion.span key="a" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Agent skin="lime" size={34} mood="happy" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
