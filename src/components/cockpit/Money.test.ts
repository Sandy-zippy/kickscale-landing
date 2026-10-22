/**
 * The money path, checked.
 *
 * A wrong price on a homepage is the one bug that costs a deal before anyone gets to
 * talk. These tests cover the two ways that happens: a conversion that silently comes
 * out wrong, and the comparison bars claiming we are cheaper than we are.
 */
import { describe, it, expect } from 'vitest'
import { format, PINNED } from './Money'
import { PRICING } from '../../data/cockpit'

describe('format', () => {
  it('leaves USD alone at rate 1', () => {
    expect(format(730, 'USD', 1)).toBe('$730')
  })

  it('converts, and drops paise on rupees', () => {
    const out = format(730, 'INR', 88.4)
    expect(out).toContain('64,532')
    expect(out).not.toContain('.')
  })

  it('survives a currency Intl does not know rather than throwing', () => {
    expect(() => format(730, 'ZZZ', 2)).not.toThrow()
    expect(format(730, 'ZZZ', 2)).toContain('1,460')
  })
})

describe('pinned rates', () => {
  it('has USD as the base, so a failed fetch still shows the real price', () => {
    expect(PINNED.USD).toBe(1)
  })

  it('quotes every currency the picker offers above zero', () => {
    Object.entries(PINNED).forEach(([c, r]) => {
      expect(r, c).toBeGreaterThan(0)
    })
  })
})

describe('the first-year comparison', () => {
  it('states our own year honestly — setup plus twelve entry-tier months', () => {
    expect(PRICING.ourYearTen).toBe(PRICING.setupUsd + PRICING.monthlyFrom * 12)
  })

  it('never lets the annual option cost more than paying monthly all year', () => {
    if (PRICING.annualIsAlternative) {
      expect(PRICING.annualUsd).toBeLessThan(PRICING.monthlyFrom * 12)
    }
  })

  it('gives every alternative a year figure, or the bars mis-scale', () => {
    PRICING.against.forEach(a => {
      expect(a.yearTen, a.name).toBeGreaterThan(0)
    })
  })
})
