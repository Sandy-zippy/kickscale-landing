/* The /websites payloads and the assistant's menu, checked without a network.
 * Nothing here posts to the live booking endpoint. */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import WebsiteCall, { buildWebsitePayload, stillOpen } from './WebsiteCall'
import { step, botLeadPayload, sendBotLead, journeySummary, notePick, resetJourney, GREETING, BOT_NAME } from '../../lib/siteBot'
import { leadId, finishLead, saveStep, afterSaves } from '../../lib/leadSave'
import { PACKAGES, FAQ, HERO, FORM } from '../../data/websites'

const a = { package: 'Growth', timeline: 'This month', need: 'Need it before Diwali', company: 'Acme', website: 'acme.in', category: 'Manufacturing', name: 'Ravi Kumar', email: 'r@acme.in', phone: '98765 43210', state: 'Telangana', city: 'Hyderabad' }
const o = { needs: ['Website', 'Landing page'], sells: ['B2B', 'D2C'], slot: null, country: 'India', dial: '+91', journey: 'Read: packages 12s', lead_id: 'L-1', stage: 'final' as const }

describe('website booking payload', () => {
  it('joins the multi-selects and tags the service', () => {
    const p = buildWebsitePayload(a, o)
    expect(p.service).toBe('website')
    expect(p.needs).toBe('Website, Landing page')
    expect(p.sells).toBe('B2B, D2C')
    expect(p).toMatchObject({ package: 'Growth', timeline: 'This month', need: 'Need it before Diwali', company: 'Acme', website: 'acme.in', category: 'Manufacturing', phone: '+91 98765 43210', region: 'Hyderabad, Telangana, India', journey: 'Read: packages 12s' })
  })
  it('books with a slot, sends a lead without one', () => {
    expect(buildWebsitePayload(a, o).action).toBe('lead')
    const slot = { start: '2026-11-02T05:30:00.000Z', end: '2026-11-02T06:30:00.000Z' }
    const p = buildWebsitePayload(a, { ...o, slot })
    expect(p.action).toBe('book')
    expect(p.start).toBe(slot.start)
  })
  it('notices when the picked slot vanished on refresh', () => {
    const s = { start: 'x', end: 'y' }
    expect(stillOpen(s, [{ start: 'z', end: 'w' }])).toBe(false)
    expect(stillOpen(s, [s])).toBe(true)
    expect(stillOpen(null, [])).toBe(true)
  })
})

describe('website assistant', () => {
  it('never offers more than three options', () => {
    const ids = ['start', 'else', 'need', 'need-more', 'need-0', 'packages', 'work', 'book', ...FAQ.items.map((_, i) => `faq-${i}`), 'faqs-0', 'faqs-1', 'faqs-2', 'faqs-3']
    ids.forEach(id => expect(step(id).options.length, id).toBeLessThanOrEqual(3))
  })
  it('quotes package prices only from PACKAGES, in USD', () => {
    const says = step('packages').says.join(' ')
    PACKAGES.forEach(p => expect(says).toContain(`$${p.usd.toLocaleString('en-US')}`))
    expect(says).not.toMatch(/₹|AED|INR/)
  })
  it('answers FAQs verbatim', () => {
    FAQ.items.forEach((f, i) => expect(step(`faq-${i}`).says).toEqual([f.a]))
  })
  it('bot lead carries service, site-bot source and the journey', async () => {
    resetJourney(); notePick('See packages')
    const p = botLeadPayload({ name: 'Ravi', phone: '+91 98765 43210', email: 'r@acme.in' }, journeySummary(), 'L-1')
    expect(p).toMatchObject({ action: 'lead', service: 'website', utm_content: 'site-bot' })
    expect(p.journey).toContain('Bot: See packages')
    expect(p.company).toBeTruthy()
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: true })))
    await sendBotLead(p, f as unknown as typeof fetch)
    expect(JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).service).toBe('website')
  })
  it('the hero has no price or currency symbol', () => {
    expect(Object.values(HERO).join(' ')).not.toMatch(/[$₹€£]|\bUSD\b|\bINR\b|\bAED\b|\d,\d{3}/)
  })
})

/* ── save at every Continue (28 Oct 2026) ─────────────────────────────────── */

const SLOT = { start: '2026-11-02T05:30:00.000Z', end: '2026-11-02T06:30:00.000Z' }
type Call = [string, RequestInit]
const posted = (f: ReturnType<typeof vi.fn>) =>
  (f.mock.calls as unknown as Call[]).map(c => JSON.parse(c[1].body as string)).filter(b => b.action !== 'slots')

function fakeFetch() {
  return vi.fn(async (_u: string, init: RequestInit) => {
    const b = JSON.parse(init.body as string)
    return new Response(JSON.stringify(b.action === 'slots' ? { ok: true, slots: [SLOT] } : { ok: true }))
  })
}

beforeEach(() => { sessionStorage.clear(); Element.prototype.scrollIntoView = vi.fn() })

describe('website form order and saves', () => {
  it('steps are details, business, then needs, then a time last', () => {
    expect(FORM.steps).toEqual(['Your details', 'Your business', 'What you need', 'Pick a time'])
  })

  it('a save is action save, partial, with the stage and no slot even if one is picked', () => {
    const d = buildWebsitePayload(a, { ...o, slot: SLOT, stage: 'details' })
    expect(d).toMatchObject({ action: 'save', lead_id: 'L-1', partial: true, stage: 'details' })
    expect(d.start).toBeUndefined()
    expect(buildWebsitePayload(a, { ...o, stage: 'needs' })).toMatchObject({ action: 'save', partial: true, stage: 'needs' })
  })

  it('the final payload carries the same lead_id, partial false, stage final', () => {
    expect(buildWebsitePayload(a, { ...o, slot: SLOT })).toMatchObject({ action: 'book', lead_id: 'L-1', partial: false, stage: 'final', start: SLOT.start })
    expect(buildWebsitePayload(a, o)).toMatchObject({ action: 'lead', lead_id: 'L-1', partial: false, stage: 'final' })
  })

  it('renders, saves at each Continue under one lead_id, and the final send carries it', async () => {
    const f = fakeFetch(); vi.stubGlobal('fetch', f)
    const { container } = render(createElement(WebsiteCall, { openSignal: 1 }))
    const $ = (sel: string) => container.querySelector(sel) as HTMLInputElement
    /* step 1 is the details */
    expect(screen.getByText('Your name')).toBeTruthy()
    expect(screen.queryByText('What do you need?')).toBeNull()
    fireEvent.change($('input[autocomplete=name]'), { target: { value: 'Ravi Kumar' } })
    fireEvent.change($('input[autocomplete=organization]'), { target: { value: 'Acme' } })
    fireEvent.change($('input[aria-label="Mobile number"]'), { target: { value: '98765 43210' } })
    fireEvent.change($('input[type=email]'), { target: { value: 'r@acme.in' } })
    fireEvent.click(screen.getByText('Continue'))

    /* saved the moment step one is done: name + mobile are already a lead */
    await waitFor(() => expect(posted(f)).toHaveLength(1))
    const s1 = posted(f)[0]
    expect(s1).toMatchObject({ action: 'save', partial: true, stage: 'details', name: 'Ravi Kumar', company: 'Acme', email: 'r@acme.in', phone: '+91 98765 43210', service: 'website' })
    expect(s1.lead_id).toMatch(/^[0-9a-f-]{36}$/)
    expect(s1).toHaveProperty('journey'); expect(s1).toHaveProperty('landed')

    /* step 2 is the business and where it is */
    fireEvent.change(await screen.findByLabelText('Industry'), { target: { value: 'Manufacturing' } })
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'Telangana' } })
    const city = (screen.getByLabelText('City') as HTMLSelectElement)
    fireEvent.change(city, { target: { value: city.options[1].value } })
    fireEvent.change(screen.getByLabelText('When do you need it?'), { target: { value: 'This month' } })
    fireEvent.click(screen.getByText('Continue'))
    await waitFor(() => expect(posted(f)).toHaveLength(2))
    expect(posted(f)[1]).toMatchObject({ action: 'save', partial: true, stage: 'details', lead_id: s1.lead_id, category: 'Manufacturing', name: 'Ravi Kumar' })

    /* step 3 is the needs */
    await screen.findByText('What do you need?')
    fireEvent.click(screen.getByRole('button', { name: 'Website' }))
    fireEvent.click(screen.getByRole('button', { name: 'B2B' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Growth' }))
    fireEvent.click(screen.getByText('Continue'))
    await waitFor(() => expect(posted(f)).toHaveLength(3))
    expect(posted(f)[2]).toMatchObject({ action: 'save', partial: true, stage: 'needs', lead_id: s1.lead_id, needs: 'Website', name: 'Ravi Kumar', timeline: 'This month' })

    /* step 4 is the time, LAST, and it can be skipped */
    fireEvent.click(await screen.findByText(/Send without a time/))
    await waitFor(() => expect(posted(f)).toHaveLength(4))
    expect(posted(f)[3]).toMatchObject({ action: 'lead', partial: false, stage: 'final', lead_id: s1.lead_id, package: 'Growth' })
    /* a finished submission frees the id: the next enquiry is a new record */
    await waitFor(() => expect(leadId('website')).not.toBe(s1.lead_id))
  })

  it('will not save or advance with step one blank', () => {
    const f = fakeFetch(); vi.stubGlobal('fetch', f)
    render(createElement(WebsiteCall))
    fireEvent.click(screen.getByText('Continue'))
    expect(posted(f)).toHaveLength(0)
    expect(screen.getByText('Your name')).toBeTruthy()
  })
})

describe('lead id and the background save', () => {
  it('one id per session, kept across calls, fresh after a finished submission', () => {
    const id = leadId('website')
    expect(leadId('website')).toBe(id)
    expect(sessionStorage.getItem('zs_lead_id_website')).toBe(id)
    expect(leadId('cockpit')).not.toBe(id)
    finishLead('website')
    expect(leadId('website')).not.toBe(id)
  })

  it('fires and forgets: a failed save never throws', async () => {
    const f = vi.fn(() => Promise.reject(new Error('offline')))
    expect(() => saveStep({ action: 'save' }, f as unknown as typeof fetch)).not.toThrow()
    await afterSaves()
    expect((f.mock.calls[0] as unknown as Call)[1].keepalive).toBe(true)
  })

  it('saves go one after another, never in parallel', async () => {
    let release!: () => void
    const f = vi.fn()
      .mockImplementationOnce(() => new Promise<Response>(r => { release = () => r(new Response('{}')) }))
      .mockImplementation(async () => new Response('{}'))
    saveStep({ n: 1 }, f as unknown as typeof fetch)
    saveStep({ n: 2 }, f as unknown as typeof fetch)
    await new Promise(r => setTimeout(r, 20))
    expect(f).toHaveBeenCalledTimes(1)          // the second waits for the first
    release(); await afterSaves()
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('the bot lead waits for an in-flight save before it posts', async () => {
    let release!: () => void
    const slow = vi.fn(() => new Promise<Response>(r => { release = () => r(new Response('{}')) }))
    saveStep({ action: 'save' }, slow as unknown as typeof fetch)
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: true })))
    const p = sendBotLead(botLeadPayload({ name: 'R', phone: '+91 98765 43210', email: 'r@a.in' }, 'x', 'L-1'), f as unknown as typeof fetch)
    await new Promise(r => setTimeout(r, 20))
    expect(f).not.toHaveBeenCalled()
    release(); await p
    expect(f).toHaveBeenCalledTimes(1)
  })
})

describe('Zippy', () => {
  it('is named Zippy and greets without an em dash', () => {
    expect(BOT_NAME).toBe('Zippy')
    expect(GREETING).toBe("Hi, I'm Zippy. How may I help you?")
    expect(step('start').says[0]).toBe(GREETING)
    expect(GREETING).not.toMatch(/\u2014/)
  })

  it('saves name + mobile under the form\'s lead id, then the lead lands on the same record', () => {
    const id = leadId('website')
    const c = { name: 'Ravi', phone: '+91 98765 43210', email: '' }
    expect(botLeadPayload(c, 'x', id, 'details')).toMatchObject({ action: 'save', lead_id: id, partial: true, stage: 'details', service: 'website' })
    expect(botLeadPayload({ ...c, email: 'r@acme.in' }, 'x', id)).toMatchObject({ action: 'lead', lead_id: id, partial: false, stage: 'final' })
  })
})
