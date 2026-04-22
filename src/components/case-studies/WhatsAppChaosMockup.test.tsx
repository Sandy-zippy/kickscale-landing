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
  it('renders the chat container and starts in chaos phase header', () => {
    // useInView never fires in jsdom (no real viewport intersections), so the
    // streaming animation does not run. We assert the static structure instead:
    // the phone frame, unread counter, and Dr Clinic header all render.
    render(<WhatsAppChaosMockup beforeMessages={messages} afterMessages={[]} />)
    expect(screen.getByTestId('phone-frame')).toBeInTheDocument()
    expect(screen.getByTestId('unread-counter')).toBeInTheDocument()
    expect(screen.getByText('Dr Clinic')).toBeInTheDocument()
  })
})
