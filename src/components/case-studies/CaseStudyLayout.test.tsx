import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import CaseStudyLayout from './CaseStudyLayout'
import type { CaseStudyMetadata } from '../../pages/case-studies/types'

const meta: CaseStudyMetadata = {
  slug: 'homeopathic-clinic-patient-flow',
  title: 'Test title',
  shortTitle: 'Short',
  industry: 'Healthcare',
  primaryPain: 'WhatsApp backlog',
  heroStatBefore: '30%',
  heroStatAfter: '<15%',
  heroStatLabel: 'no-show rate',
  seoTitle: 'SEO title',
  seoDescription: 'SEO description',
  ogImage: '/og.png',
  publishedAt: '2026-04-22',
  related: [],
  hookVariants: { A: 'A', B: 'B' },
}

describe('CaseStudyLayout', () => {
  it('renders children inside main', () => {
    render(
      <BrowserRouter>
        <CaseStudyLayout metadata={meta}>
          <div>Page content</div>
        </CaseStudyLayout>
      </BrowserRouter>
    )
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
  it('renders scroll progress bar', () => {
    render(
      <BrowserRouter>
        <CaseStudyLayout metadata={meta}><div /></CaseStudyLayout>
      </BrowserRouter>
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
  it('sets document title from metadata.seoTitle', () => {
    render(
      <BrowserRouter>
        <CaseStudyLayout metadata={meta}><div /></CaseStudyLayout>
      </BrowserRouter>
    )
    expect(document.title).toBe('SEO title')
  })
  it('injects JSON-LD structured data', () => {
    render(
      <BrowserRouter>
        <CaseStudyLayout metadata={meta}><div /></CaseStudyLayout>
      </BrowserRouter>
    )
    const ld = document.getElementById('ld-case-study')
    expect(ld).not.toBeNull()
    expect(ld?.textContent).toContain('"@type":"Article"')
    expect(ld?.textContent).toContain('Healthcare')
  })
})
