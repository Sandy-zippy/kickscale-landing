import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import TabbedStack from './TabbedStack'

const tabs = [
  { id: 'ghl', label: 'GHL', content: <div>GHL pipeline</div> },
  { id: 'n8n', label: 'n8n', content: <div>n8n workflow</div> },
  { id: 'waba', label: 'WABA', content: <div>WhatsApp templates</div> },
]

describe('TabbedStack', () => {
  it('renders all tabs with role=tab', () => {
    render(<TabbedStack tabs={tabs} />)
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })
  it('shows first tab content by default', () => {
    render(<TabbedStack tabs={tabs} />)
    expect(screen.getByText('GHL pipeline')).toBeInTheDocument()
  })
  it('switches to second tab on click', async () => {
    const user = userEvent.setup()
    render(<TabbedStack tabs={tabs} />)
    await user.click(screen.getByRole('tab', { name: 'n8n' }))
    // AnimatePresence mode="wait" awaits exit before mount — use findByText to retry
    expect(await screen.findByText('n8n workflow')).toBeInTheDocument()
  })
  it('supports ArrowRight keyboard nav', async () => {
    const user = userEvent.setup()
    render(<TabbedStack tabs={tabs} />)
    screen.getByRole('tab', { name: 'GHL' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'n8n' })).toHaveFocus()
  })
})
