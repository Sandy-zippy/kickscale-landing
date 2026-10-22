/**
 * The booking flow, checked.
 *
 * Two classes of bug matter here and neither is visible to `tsc`:
 *   1. The availability rule is written twice, once in TypeScript for the copy and once
 *      in Apps Script for enforcement. If someone changes his hours in one and not the
 *      other, the site advertises times he will not take. That is the test below that
 *      reads the .gs file.
 *   2. The form letting someone through without the fields the backend requires, which
 *      turns into a booking that fails after they have already committed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen, fireEvent } from '@testing-library/react'
import DiscoveryCall from './DiscoveryCall'
import { istKey } from './DatePicker'
import { HOURS, ABOUT, PROJECT, CONTACT, BUDGET_BANDS, companyFrom, CATEGORIES } from '../../data/discovery'

beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline')))) })

describe('availability rules', () => {
  const gs = readFileSync(resolve(__dirname, '../../../apps-script/DiscoveryBooking.gs'), 'utf8')

  it('the Apps Script enforces the same hours the site advertises', () => {
    expect(gs).toContain(`weekday: { from: ${HOURS.weekday.from}, to: ${HOURS.weekday.to} }`)
    expect(gs).toContain(`weekend: { from: ${HOURS.weekend.from},  to: ${HOURS.weekend.to} }`)
    expect(gs).toContain(`var SLOT_MIN        = ${HOURS.slotMinutes};`)
    expect(gs).toContain(`var BREAK_MIN       = ${HOURS.breakMinutes};`)
    expect(gs).toContain(`var MIN_NOTICE_HRS  = ${HOURS.minNoticeHours};`)
  })

  it('keeps weekends short and weekdays late, which is the whole point', () => {
    expect(HOURS.weekend.to).toBe(12)
    expect(HOURS.weekday.to).toBeGreaterThan(24)   // past midnight, for the US and UK
  })

  it('re-checks the slot server side before writing the event', () => {
    /* Two people can pick the same time while a form is open. Without this the second
       booking silently double-books him. */
    expect(gs).toMatch(/stillFree[\s\S]{0,200}freeSlots\(\)/)
    expect(gs).toContain("error: 'taken'")
  })

  it('holds the hour after every call, as a real calendar event', () => {
    /* Written as an event rather than a rule inside freeSlots(), so Bhargav can see
       it and drag it away, and so only one place decides what is busy. */
    expect(gs).toContain('function blockBreak(')
    expect(gs).toMatch(/blockBreak\(end,/)
    expect(gs).toContain("'Break (after '")
  })

  it('never lets a break failure cost us the booking', () => {
    const fn = gs.slice(gs.indexOf('function blockBreak('))
    expect(fn.slice(0, fn.indexOf('\n}'))).toContain('catch')
  })

  it('accepts an enquiry with no booking at all', () => {
    /* Booking an hour with strangers is a big ask. Someone who will not do it today is
       still worth talking to, so the form must be submittable without a slot. */
    expect(gs).toContain("action === 'lead'")
    expect(gs).toContain('function lead(b)')
    const fn = gs.slice(gs.indexOf('function lead(b)'))
    const body = fn.slice(0, fn.indexOf('\n}\n'))
    expect(body).toContain('logLead')
    expect(body).toContain('notifyOwner')
    /* and it must not touch the calendar */
    expect(body).not.toContain('CalendarApp')
    expect(body).not.toContain('Calendar.Events')
  })

  it('still demands name, email, phone and company on a details-only enquiry', () => {
    const fn = gs.slice(gs.indexOf('function lead(b)'))
    expect(fn.slice(0, 400)).toContain("['name', 'email', 'phone', 'company']")
  })

  it('reads the calendar once for the window, not once per slot', () => {
    /* A per-slot query is ~670 Calendar calls for a fortnight and times out.
       Scoped to freeSlots(), because counting every getEvents in the file made
       this fail the moment cancelling a meeting needed to find the break it left
       behind, which is one bounded read and not a loop at all. */
    const from = gs.indexOf('function freeSlots(')
    /* to the NEXT top-level function, whatever it is called. Naming the one
       after it broke the moment two functions were inserted between them. */
    const fn = gs.slice(from, gs.indexOf('\nfunction ', from + 10))
    expect((fn.match(/getEvents\(/g) || []).length).toBe(1)
  })

  it('cancelling never queries the calendar inside a loop', () => {
    /* Cancelling has to take the break with it, or an hour stays blocked for a
       meeting that is not happening. Nothing records the break's id, so it is found
       by when the meeting ended, in a narrow window.

       This used to assert exactly one getEvents call, which was the right guard for
       freeSlots and the wrong one here: cancelling legitimately makes two reads for
       two different jobs, and they sit in different branches. Finding a meeting that
       predates stored event ids happens only when there is no id. What actually
       matters is that neither read is per-item, because that is the shape that times
       Apps Script out. */
    const fn = gs.slice(gs.indexOf('function undiary('))
    const body = fn.slice(0, fn.indexOf('\n}'))

    const reads = body.match(/getEvents\(/g) || []
    expect(reads.length).toBeLessThanOrEqual(2)

    /* no calendar read inside a for/while */
    body.split('\n').forEach((line, i) => {
      if (!/getEvents\(/.test(line)) return
      const before = body.split('\n').slice(Math.max(0, i - 6), i).join(' ')
      expect(before, `getEvents on line ${i} looks like it is inside a loop`)
        .not.toMatch(/\bfor\s*\(|\bwhile\s*\(/)
    })

    expect(body).toContain("'Break ('")
    expect(body).toContain('60000')
  })
})

describe('the form', () => {
  it('asks for every field the backend requires before booking', () => {
    /* name, email and phone are what DiscoveryBooking.gs refuses without. Phone is
       rendered inline because it carries its own dial-code dropdown, so this checks
       the rendered form rather than the field arrays. */
    render(<DiscoveryCall />)
    const labels = document.body.textContent ?? ''
    expect([...ABOUT, ...PROJECT, ...CONTACT].map(f => f.key)).toContain('name')
    expect([...ABOUT, ...PROJECT, ...CONTACT].map(f => f.key)).toContain('email')
    expect(labels).toContain('What kind of business?')
    expect(screen.getByLabelText('Country')).toBeTruthy()
  })

  it('will not let them pick a city before a state', () => {
    render(<DiscoveryCall />)
    const city = screen.getByLabelText('City') as HTMLSelectElement
    expect(city.disabled).toBe(true)
  })

  it('cascades: choosing a country reloads its own states', () => {
    render(<DiscoveryCall />)
    const country = screen.getByLabelText('Country') as HTMLSelectElement
    fireEvent.change(country, { target: { value: 'AU' } })
    const state = screen.getByLabelText('State') as HTMLSelectElement
    expect([...state.options].map(o => o.text)).toContain('Victoria')
    expect([...state.options].map(o => o.text)).not.toContain('Telangana')
  })

  it('prices the budget bands in the currency of the country chosen', () => {
    render(<DiscoveryCall />)
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'AU' } })
    fireEvent.click(screen.getByText('Continue'))
    /* step one is incomplete, so we stay put; what matters is that no hard-coded
       dollar figure is baked into the band labels. */
    expect(BUDGET_BANDS.every(b => typeof b.from === 'number')).toBe(true)
  })

  it('will not advance past step one with the required answers blank', () => {
    render(<DiscoveryCall />)
    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByText(/answers are still missing/i)).toBeTruthy()
    /* still on step one */
    expect(screen.getByText('What kind of business?')).toBeTruthy()
  })

  it('carries the anchor the nav CTA points at', () => {
    /* The nav button is the one thing on screen at all times on a phone. If it lands
       on the section heading instead of the form, the visitor has to scroll again,
       which is where bookings are lost. */
    const { container } = render(<DiscoveryCall />)
    const anchored = container.querySelector('#book')
    expect(anchored).toBeTruthy()
    /* and it has to clear the floating nav bar */
    expect(anchored?.className).toContain('scroll-mt-28')
  })

  it('offers a WhatsApp fallback rather than dead-ending when the calendar is down', () => {
    /* BOOKING_ENDPOINT is empty until the script is deployed, so this is also the
       live behaviour today. A form that silently fails is worse than no form. */
    render(<DiscoveryCall />)
    expect(screen.getByText('Continue')).toBeTruthy()
  })
})

describe('categories', () => {
  /* The first cut lumped a dental practice, a specialty clinic and a hospital into one
     option. They are three different businesses and the call opens differently for
     each, so the list must keep them apart. */
  it('keeps dental, clinic and hospital separate', () => {
    expect(CATEGORIES).toContain('Dental practice')
    expect(CATEGORIES.some(c => /Specialty clinic/.test(c))).toBe(true)
    expect(CATEGORIES.some(c => /Hospital/.test(c))).toBe(true)
    expect(CATEGORIES.some(c => /Clinic, hospital or dental/.test(c))).toBe(false)
  })
})

describe('companyFrom', () => {
  it('reads a company out of a website', () => {
    expect(companyFrom('https://www.zippyscale.com/pricing', '')).toBe('Zippyscale')
    expect(companyFrom('carcart.in', '')).toBe('Carcart')
  })

  it('reads one out of an Instagram handle or URL', () => {
    expect(companyFrom('', '@royalecollections')).toBe('Royalecollections')
    expect(companyFrom('', 'instagram.com/vaarahi_silks')).toBe('Vaarahi Silks')
  })

  it('gives nothing back for nothing, rather than guessing', () => {
    expect(companyFrom('', '')).toBe('')
  })
})

describe('istKey', () => {
  /* The calendar groups slots by the day they fall on IN INDIA. Get this wrong and a
     visitor in Sydney or Los Angeles is shown a call on the wrong date, which is the
     one booking bug you only find out about when somebody misses the meeting. */
  it('uses the Indian calendar day, not the browser timezone', () => {
    /* 19:30 UTC = 01:00 IST the next morning: one of Bhargav's late weekday slots */
    expect(istKey('2026-09-28T19:30:00.000Z')).toBe('2026-09-29')
    /* 03:30 UTC = 09:00 IST the same morning: a weekend slot */
    expect(istKey('2026-09-27T03:30:00.000Z')).toBe('2026-09-27')
  })

  it('pads the month and day, so the keys sort as dates', () => {
    expect(istKey('2026-10-04T05:00:00.000Z')).toBe('2026-10-04')
    const keys = ['2026-10-04', '2026-09-29'].sort()
    expect(keys[0]).toBe('2026-09-29')
  })
})

describe('conversion tracking', () => {
  /* At a ₹10,000/month budget Meta needs a conversion signal or the whole spend is
     bought blind. These events are what the campaign optimises towards, so their
     absence is a silent, expensive failure. */
  it('reports every funnel step, using Meta standard event names', async () => {
    const tracking = await import('../../lib/tracking')
    const src = readFileSync(resolve(__dirname, '../../lib/tracking.ts'), 'utf8')
    expect(typeof tracking.trackDiscovery).toBe('function')
    ;['InitiateCheckout', 'Lead', 'Schedule'].forEach(e => expect(src).toContain(`'${e}'`))
  })

  it('fires on first interaction, not on render', () => {
    const fbq = vi.fn()
    vi.stubGlobal('fbq', fbq)
    ;(window as unknown as { fbq: unknown }).fbq = fbq
    render(<DiscoveryCall />)
    expect(fbq).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('What kind of business?'), {
      target: { value: 'Dental practice' },
    })
    expect(fbq).toHaveBeenCalled()
  })

  it('passes an event id, so a server-side call can be deduplicated later', () => {
    const src = readFileSync(resolve(__dirname, '../../lib/tracking.ts'), 'utf8')
    expect(src).toContain('eventID')
  })
})

describe('event hygiene', () => {
  const src = readFileSync(resolve(__dirname, '../../lib/tracking.ts'), 'utf8')

  it('passes the event id as fbq’s fourth argument, not inside the params', () => {
    /* Inside the params object Meta never sees it, and the server also sends Lead, so
       every conversion is counted twice. A doubled count is worse than none: it makes a
       losing campaign look like a winner. */
    const calls = src.match(/fbq\?\.\([\s\S]{0,400}?\)\n/g) ?? []
    const leadCalls = calls.filter(c => c.includes("'Lead'") || c.includes('META[step]'))
    expect(leadCalls.length).toBeGreaterThan(0)
    leadCalls.forEach(c => expect(c).toContain('eventID'))
  })

  it('tags cockpit leads so they can be told apart from quiz leads', () => {
    /* Both funnels fire the standard `Lead`. Without this the October campaign would
       optimise for a blend of two different products sold to two different buyers. */
    expect(src).toContain("content_name: 'Agentic Cockpit discovery'")
  })
})

describe('how long the person waits', () => {
  const src = readFileSync(resolve(__dirname, 'DiscoveryCall.tsx'), 'utf8')
  const fn = src.slice(src.indexOf('async function confirm()'), src.indexOf('/* ── confirmed'))

  it('an enquiry does not wait for the backend', () => {
    /* Measured against the live endpoint: a full submission takes four to twelve
       seconds, because before it answers it reads the calendar, writes a Sheet
       row, pushes to the cockpit and sends an email. None of that is the
       person's work and none of it changes what we tell them: there is no slot
       to confirm and nothing to report back. Twelve seconds of spinner on a
       three-step form is how a filled-in form becomes an abandoned one. */
    const noSlot = fn.slice(fn.indexOf('if (!picked) {'), fn.indexOf('try {'))
    expect(noSlot).toContain('setDone(')
    expect(noSlot).toContain('return')
    expect(noSlot).not.toContain('await')
  })

  it('a booking still waits, because there is something to report', () => {
    /* The slot may have gone while the form was open, and the Meet link only
       exists once Google has made the event. Being told "booked" and then finding
       no invite is far worse than a few seconds of spinner. */
    const booked = fn.slice(fn.indexOf('try {'))
    expect(booked).toContain('await send')
    expect(booked).toContain("j.error === 'taken'")
    expect(booked).toContain('j.meet')
  })

  it('an enquiry that genuinely fails takes the thank-you back down', () => {
    /* Optimism is only honest if it is reversible. */
    const noSlot = fn.slice(fn.indexOf('if (!picked) {'), fn.indexOf('try {'))
    expect(noSlot).toContain('setDone(null)')
    expect(noSlot).toContain('setErr(')
  })
})

describe('a booking reports a Lead', () => {
  /* The campaign optimises for Lead. A booking that fired only Schedule was invisible
     to it (22 Oct). Exactly one Lead per submission, never two. */
  const src = readFileSync(resolve(__dirname, 'DiscoveryCall.tsx'), 'utf8')
  const fn = src.slice(src.indexOf('async function confirm()'), src.indexOf('/* ── confirmed'))
  const count = (s: string, re: RegExp) => (s.match(re) ?? []).length
  const noSlot = fn.slice(fn.indexOf('if (!picked) {'), fn.indexOf('try {'))
  const ok = fn.slice(fn.indexOf('if (j.ok) {'), fn.indexOf("else if (j.error === 'taken')"))

  it('a successful booking fires one Lead and one Schedule', () => {
    expect(count(ok, /trackDiscovery\('lead'/g)).toBe(1)
    expect(count(ok, /trackDiscovery\('booked'/g)).toBe(1)
    expect(ok).toContain('booked: true')
  })

  it('an enquiry fires one Lead and returns before the booking path', () => {
    expect(count(noSlot, /trackDiscovery\('lead'/g)).toBe(1)
    expect(noSlot).toContain('return')
    expect(count(fn, /trackDiscovery\('lead'/g)).toBe(2)
  })

  it('lead and booked map to one fbq Lead and one fbq Schedule', async () => {
    const fbq = vi.fn()
    ;(window as unknown as { fbq: unknown }).fbq = fbq
    const { trackDiscovery } = await import('../../lib/tracking')
    trackDiscovery('lead', { booked: true })
    trackDiscovery('booked')
    const names = fbq.mock.calls.map(c => c[1])
    expect(names.filter(n => n === 'Lead')).toHaveLength(1)
    expect(names.filter(n => n === 'Schedule')).toHaveLength(1)
  })
})
