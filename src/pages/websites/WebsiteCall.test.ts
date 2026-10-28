/* The /websites payloads and the assistant's menu, checked without a network.
 * Nothing here posts to the live booking endpoint. */
import { describe, it, expect, vi } from 'vitest'
import { buildWebsitePayload, stillOpen } from './WebsiteCall'
import { step, botLeadPayload, sendBotLead, journeySummary, notePick, resetJourney } from '../../lib/siteBot'
import { PACKAGES, FAQ, HERO } from '../../data/websites'

const a = { package: 'Growth', timeline: 'This month', need: 'Need it before Diwali', company: 'Acme', website: 'acme.in', category: 'Manufacturing', name: 'Ravi Kumar', email: 'r@acme.in', phone: '98765 43210', state: 'Telangana', city: 'Hyderabad' }
const o = { needs: ['Website', 'Landing page'], sells: ['B2B', 'D2C'], slot: null, country: 'India', dial: '+91', journey: 'Read: packages 12s' }

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
    const p = botLeadPayload({ name: 'Ravi', phone: '+91 98765 43210', email: 'r@acme.in' }, journeySummary())
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
