import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import WeekTimeline from './WeekTimeline'

const weeks = [
  { week: 1 as const, title: 'Foundation', deliverables: ['Set up GHL', 'Wire WABA'] },
  { week: 2 as const, title: 'Intake', deliverables: ['AI triage live'] },
  { week: 3 as const, title: 'Automation', deliverables: ['Refill flow'] },
  { week: 4 as const, title: 'Handover', deliverables: ['Train team'] },
]

describe('WeekTimeline', () => {
  it('renders all 4 week numbers', () => {
    render(<WeekTimeline weeks={weeks} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })
  it('shows week titles', () => {
    render(<WeekTimeline weeks={weeks} />)
    expect(screen.getByText('Foundation')).toBeInTheDocument()
    expect(screen.getByText('Handover')).toBeInTheDocument()
  })
  it('shows deliverables', () => {
    render(<WeekTimeline weeks={weeks} />)
    expect(screen.getByText('Set up GHL')).toBeInTheDocument()
    expect(screen.getByText('Wire WABA')).toBeInTheDocument()
  })
})
