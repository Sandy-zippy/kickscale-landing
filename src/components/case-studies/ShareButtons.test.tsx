import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ShareButtons from './ShareButtons'

describe('ShareButtons', () => {
  it('renders WhatsApp share with pre-filled title in URL', () => {
    render(<ShareButtons title="Test title" url="https://z.in/x" />)
    const wa = screen.getByLabelText('Share on WhatsApp')
    expect(wa).toHaveAttribute('href', expect.stringContaining('wa.me'))
    expect(wa).toHaveAttribute('href', expect.stringContaining('Test%20title'))
  })
  it('renders LinkedIn share with URL', () => {
    render(<ShareButtons title="Test" url="https://z.in/x" />)
    const li = screen.getByLabelText('Share on LinkedIn')
    expect(li).toHaveAttribute('href', expect.stringContaining('linkedin.com'))
    expect(li).toHaveAttribute('href', expect.stringContaining(encodeURIComponent('https://z.in/x')))
  })
  it('renders copy link button', () => {
    render(<ShareButtons title="Test" url="https://z.in/x" />)
    expect(screen.getByLabelText('Copy link to case study')).toBeInTheDocument()
  })
  it('opens external links in new tab with rel safety', () => {
    render(<ShareButtons title="Test" url="https://z.in/x" />)
    const wa = screen.getByLabelText('Share on WhatsApp')
    expect(wa).toHaveAttribute('target', '_blank')
    expect(wa).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
