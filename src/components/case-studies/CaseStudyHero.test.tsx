import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CaseStudyHero from './CaseStudyHero'

describe('CaseStudyHero', () => {
  it('renders the headline', () => {
    render(
      <CaseStudyHero
        variant="homeopathic-clinic-patient-flow"
        statBefore="30%"
        statAfter="<15%"
        statLabel="no-show rate"
        headline="Test headline"
      />
    )
    expect(screen.getByRole('heading', { name: 'Test headline' })).toBeInTheDocument()
  })
  it('renders before + after stats', () => {
    render(
      <CaseStudyHero
        variant="homeopathic-clinic-patient-flow"
        statBefore="30%"
        statAfter="<15%"
        statLabel="no-show rate"
        headline="Test"
      />
    )
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('<15%')).toBeInTheDocument()
    expect(screen.getByText('no-show rate')).toBeInTheDocument()
  })
  it('CTA points to /#quiz by default with default copy', () => {
    render(
      <CaseStudyHero
        variant="homeopathic-clinic-patient-flow"
        statBefore="30%"
        statAfter="<15%"
        statLabel="no-show rate"
        headline="Test"
      />
    )
    expect(screen.getByRole('link', { name: /Book my clinic audit/ })).toHaveAttribute('href', '/#quiz')
  })
  it('renders custom CTA text + subhead + benefits when provided', () => {
    render(
      <CaseStudyHero
        variant="homeopathic-clinic-patient-flow"
        statBefore="30%"
        statAfter="<15%"
        statLabel="no-show rate"
        headline="Test"
        subhead="A short subhead"
        benefits={['Benefit one', 'Benefit two']}
        ctaText="Custom CTA"
      />
    )
    expect(screen.getByText('A short subhead')).toBeInTheDocument()
    expect(screen.getByText('Benefit one')).toBeInTheDocument()
    expect(screen.getByText('Benefit two')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Custom CTA/ })).toBeInTheDocument()
  })
})
