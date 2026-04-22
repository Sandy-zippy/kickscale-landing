import { describe, it, expect } from 'vitest'
import { registry, getMetadata } from './registry'

describe('case study registry', () => {
  it('contains all 10 case studies', () => {
    expect(Object.keys(registry)).toHaveLength(10)
  })

  it('returns metadata for a valid slug', () => {
    const meta = getMetadata('homeopathic-clinic-patient-flow')
    expect(meta).toBeDefined()
    expect(meta?.industry).toBe('Healthcare')
  })

  it('returns undefined for unknown slug', () => {
    const meta = getMetadata('does-not-exist')
    expect(meta).toBeUndefined()
  })
})
