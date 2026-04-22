import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import ObjectionAccordion from './ObjectionAccordion'

const items = [
  { objection: 'Patient data is sensitive', rebuttal: 'WABA is end-to-end encrypted...' },
  { objection: 'Bot feels cold', rebuttal: 'AI only handles the 80% predictable...' },
]

describe('ObjectionAccordion', () => {
  it('renders all objection headers', () => {
    render(<ObjectionAccordion items={items} />)
    expect(screen.getByRole('button', { name: /Patient data is sensitive/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bot feels cold/ })).toBeInTheDocument()
  })
  it('starts collapsed (aria-expanded=false)', () => {
    render(<ObjectionAccordion items={items} />)
    expect(screen.getByRole('button', { name: /Patient data is sensitive/ })).toHaveAttribute('aria-expanded', 'false')
  })
  it('expands on click and sets aria-expanded=true', async () => {
    const user = userEvent.setup()
    render(<ObjectionAccordion items={items} />)
    const btn = screen.getByRole('button', { name: /Patient data is sensitive/ })
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })
  it('is keyboard accessible via Enter', async () => {
    const user = userEvent.setup()
    render(<ObjectionAccordion items={items} />)
    const btn = screen.getByRole('button', { name: /Bot feels cold/ })
    btn.focus()
    await user.keyboard('{Enter}')
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })
})
