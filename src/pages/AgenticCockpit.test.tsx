/**
 * A render smoke test for the homepage.
 *
 * It exists because the page now has real logic in it — a currency guess from the
 * browser locale, a rates fetch, animated roster state, and a comparison chart scaled
 * off arithmetic. Any of those can throw at mount, and a homepage that throws at mount
 * is a blank site. `tsc` cannot see it and a build cannot see it; only mounting can.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AgenticCockpit from './AgenticCockpit'

/* The rates fetch must never be a reason the page fails to render, so the test asserts
   the pinned-fallback path explicitly by making the network fail. */
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
})

describe('AgenticCockpit', () => {
  it('mounts and shows the headline', () => {
    render(<MemoryRouter><AgenticCockpit /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('prices in dollars even with no network, and offers a converter', () => {
    render(<MemoryRouter><AgenticCockpit /></MemoryRouter>)
    expect(screen.getByLabelText('Show me in')).toBeTruthy()
    /* $730 must be on the page in some currency's rendering — the picker defaults to
       the visitor's locale, so assert the USD invoice note or the dollar figure. */
    expect(document.body.textContent).toMatch(/730|64,5|₹/)
  })

  it('never says the agents are deployed or autonomous', () => {
    render(<MemoryRouter><AgenticCockpit /></MemoryRouter>)
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/\bautonomous\b/i)
    expect(text).not.toMatch(/agents (are )?deployed\b/i)
  })
})
