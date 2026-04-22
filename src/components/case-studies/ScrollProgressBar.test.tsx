import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ScrollProgressBar from './ScrollProgressBar'

describe('ScrollProgressBar', () => {
  it('renders progressbar role', () => {
    render(<ScrollProgressBar />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
  it('has lime background color class', () => {
    render(<ScrollProgressBar />)
    expect(screen.getByRole('progressbar')).toHaveClass('bg-[#D5EB4B]')
  })
  it('positions at top of viewport above nav (z-60)', () => {
    render(<ScrollProgressBar />)
    const wrapper = screen.getByTestId('scroll-progress-wrapper')
    expect(wrapper).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-[60]')
  })
})
