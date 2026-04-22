import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ComparisonSlider from './ComparisonSlider'

describe('ComparisonSlider', () => {
  it('renders before + after images with alt text', () => {
    render(<ComparisonSlider beforeSrc="/b.png" afterSrc="/a.png" beforeAlt="Chaos" afterAlt="Calm" />)
    expect(screen.getByAltText('Chaos')).toBeInTheDocument()
    expect(screen.getByAltText('Calm')).toBeInTheDocument()
  })
  it('renders accessible slider', () => {
    render(<ComparisonSlider beforeSrc="/b.png" afterSrc="/a.png" beforeAlt="Chaos" afterAlt="Calm" />)
    expect(screen.getByRole('slider', { name: /Drag to compare/ })).toBeInTheDocument()
  })
  it('updates position on slider change', () => {
    render(<ComparisonSlider beforeSrc="/b.png" afterSrc="/a.png" beforeAlt="Chaos" afterAlt="Calm" />)
    const s = screen.getByRole('slider')
    fireEvent.change(s, { target: { value: '75' } })
    expect(s).toHaveValue('75')
  })
})
