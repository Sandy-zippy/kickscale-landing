/* Wires the menu in lib/siteBot.ts into Picasso's SiteBotShell. Lazy-loaded by
 * Websites.tsx after the browser is idle, so it costs nothing on LCP or INP. */
import { useEffect, useRef, useState } from 'react'
import { step, notePick, journeySummary, botLeadPayload, sendBotLead, validAnswer, type Step } from '../../lib/siteBot'
import { trackEvent, trackDiscovery } from '../../lib/tracking'
import SiteBotShell from '../../components/websites/SiteBotShell'

type Msg = { from: 'bot' | 'you'; text: string }
type Act = NonNullable<Step['act']>

export function useSiteBot(onAct: (a: Act) => void) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>(() => step('start').says.map(text => ({ from: 'bot' as const, text })))
  const [cur, setCur] = useState<Step>(() => step('start'))
  const [nudged, setNudged] = useState(false)
  const contact = useRef({ name: '', phone: '', email: '' })

  /* One soft nudge, after 20 s or half the page, whichever comes first. Never a popup. */
  useEffect(() => {
    if (nudged) return
    const fire = () => setNudged(true)
    const t = window.setTimeout(fire, 20_000)
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 0 && window.scrollY / max >= 0.5) fire()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.clearTimeout(t); window.removeEventListener('scroll', onScroll) }
  }, [nudged])

  function go(id: string, label?: string) {
    const s = step(id)
    setMsgs(m => [...m, ...(label ? [{ from: 'you' as const, text: label }] : []), ...s.says.map(text => ({ from: 'bot' as const, text }))])
    setCur(s)
    if (s.act) onAct(s.act)
    /* the calendar must not sit under the panel */
    if (s.act === 'open-booking') setOpen(false)
  }

  function pick(id: string) {
    const label = cur.options.find(o => o.id === id)?.label ?? id
    notePick(label)
    trackEvent('bot_option', { option: id, label, content_name: 'websites' })
    go(id, label)
  }

  async function answer(v: string) {
    const ask = cur.ask
    if (!ask) return
    if (!validAnswer(ask.key, v)) {
      setMsgs(m => [...m, { from: 'bot', text: ask.key === 'email' ? 'That email does not look complete. Please check it.' : ask.key === 'phone' ? 'Please add the full mobile number with the country code.' : 'Please type your name.' }])
      return
    }
    contact.current[ask.key] = v.trim()
    if (ask.next !== 'send') { go(ask.next, v.trim()); return }
    setMsgs(m => [...m, { from: 'you', text: v.trim() }, { from: 'bot', text: 'Sending…' }])
    setCur({ says: [], options: [] })
    try {
      const j = await sendBotLead(botLeadPayload(contact.current, journeySummary()))
      if (!j.ok) throw new Error(j.error)
      trackEvent('bot_lead', { content_name: 'websites' })
      trackDiscovery('lead', { content_name: 'websites', content_category: 'website', via: 'site-bot' })
      const first = contact.current.name.split(/\s+/)[0]
      setMsgs(m => [...m.slice(0, -1), { from: 'bot', text: `Thank you, ${first}. The ZippyScale team will reply within one working day.` }])
      setCur({ says: [], options: [{ id: 'start', label: 'Back to start' }] })
    } catch {
      setMsgs(m => [...m.slice(0, -1), { from: 'bot', text: 'That did not go through. Please try again, or book a call below.' }])
      setCur({ says: [], options: [{ id: 'number', label: 'Try again' }, { id: 'book', label: 'Book a call' }] })
    }
  }

  return {
    open,
    toggle: () => setOpen(o => { if (!o) trackEvent('bot_open', { content_name: 'websites' }); return !o }),
    messages: msgs,
    options: cur.options,
    pick,
    input: cur.ask ? { label: cur.ask.label, type: cur.ask.type, onSubmit: answer } : null,
    status: nudged && !open ? 'Questions about your website? Ask me.' : 'Answers from our own pages, never made up',
  }
}

export default function SiteBot({ onAct }: { onAct: (a: Act) => void }) {
  const b = useSiteBot(onAct)
  return (
    <SiteBotShell open={b.open} onToggle={b.toggle} messages={b.messages} options={b.options}
      onPick={b.pick} input={b.input} title="ZippyScale website assistant" status={b.status} />
  )
}
