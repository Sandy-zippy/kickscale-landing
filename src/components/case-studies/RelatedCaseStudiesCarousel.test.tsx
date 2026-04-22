import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import RelatedCaseStudiesCarousel from './RelatedCaseStudiesCarousel'

describe('RelatedCaseStudiesCarousel', () => {
  it('renders nothing when no slugs are passed', () => {
    const { container } = render(
      <BrowserRouter>
        <RelatedCaseStudiesCarousel slugs={[]} />
      </BrowserRouter>
    )
    // Empty slug array should render null
    expect(container.firstChild).toBeNull()
  })
  it('renders a card when slug has populated metadata (homeopathic)', () => {
    render(
      <BrowserRouter>
        <RelatedCaseStudiesCarousel slugs={['homeopathic-clinic-patient-flow']} />
      </BrowserRouter>
    )
    expect(screen.getByText(/Homeopathic clinic/i)).toBeInTheDocument()
  })
  it('links each card to the correct case study route', () => {
    render(
      <BrowserRouter>
        <RelatedCaseStudiesCarousel slugs={['homeopathic-clinic-patient-flow']} />
      </BrowserRouter>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/case-studies/homeopathic-clinic-patient-flow')
  })
})
