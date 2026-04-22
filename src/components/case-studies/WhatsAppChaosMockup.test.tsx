import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import WhatsAppChaosMockup from './WhatsAppChaosMockup'

const messages = [
  { sender: 'Patient A', body: 'Doctor available tomorrow?', time: '9:14 PM' },
  { sender: 'Patient B', body: 'Refill Bryonia 30', time: '9:15 PM' },
]

describe('WhatsAppChaosMockup', () => {
  it('renders phone frame', () => {
    render(<WhatsAppChaosMockup beforeMessages={messages} afterMessages={[]} />)
    expect(screen.getByTestId('phone-frame')).toBeInTheDocument()
  })
  it('renders unread counter element', () => {
    render(<WhatsAppChaosMockup beforeMessages={messages} afterMessages={[]} />)
    expect(screen.getByTestId('unread-counter')).toBeInTheDocument()
  })
  it('renders message text from beforeMessages by default', () => {
    render(<WhatsAppChaosMockup beforeMessages={messages} afterMessages={[]} />)
    expect(screen.getByText('Doctor available tomorrow?')).toBeInTheDocument()
  })
})
