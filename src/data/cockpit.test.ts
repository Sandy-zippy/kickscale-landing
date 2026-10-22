/**
 * Copy guards.
 *
 * Both of these are rules a future edit will break by accident, and neither shows up
 * as a type error or a failed build. They are cheap to check and expensive to miss on
 * a page whose entire argument is that we are honest about what we built.
 */
import { describe, it, expect } from 'vitest'
import * as copy from './cockpit'

/** every user-visible string in the module, flattened */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v)
  else if (Array.isArray(v)) v.forEach(x => strings(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out))
  return out
}

const ALL = strings(copy)

describe('homepage copy', () => {
  /* An em dash reads as AI-written, and this page is selling the opposite. */
  it('contains no em dashes', () => {
    const bad = ALL.filter(s => s.includes('—'))
    expect(bad, `rewrite these with a full stop or colon:\n${bad.join('\n')}`).toEqual([])
  })

  it('never claims the agents are deployed or autonomous', () => {
    const bad = ALL.filter(s => /\bautonomous\b/i.test(s) || /agents (are )?deployed/i.test(s))
    expect(bad).toEqual([])
  })

  it('gives every statistic a publisher, a year and a live URL', () => {
    copy.EVIDENCE.forEach(s => {
      expect(s.source.publisher, s.figure).toBeTruthy()
      expect(s.source.year, s.figure).toBeTruthy()
      expect(s.source.url, s.figure).toMatch(/^https:\/\//)
    })
  })
})
