import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StickyTOC from './StickyTOC'

const sections = [
  { id: 'hero', label: 'Overview' },
  { id: 'pain', label: 'The Pain' },
  { id: 'stack', label: 'The Stack' },
]

describe('StickyTOC', () => {
  it('renders all section labels as links with hash hrefs', () => {
    render(<StickyTOC sections={sections} />)
    sections.forEach(s => {
      expect(screen.getByRole('link', { name: s.label })).toHaveAttribute('href', `#${s.id}`)
    })
  })
  it('is hidden on mobile, visible on desktop', () => {
    render(<StickyTOC sections={sections} />)
    const toc = screen.getByTestId('sticky-toc')
    expect(toc).toHaveClass('hidden', 'lg:block')
  })
  it('exposes nav landmark with aria-label', () => {
    render(<StickyTOC sections={sections} />)
    expect(screen.getByRole('navigation', { name: /Case study sections/ })).toBeInTheDocument()
  })
})
