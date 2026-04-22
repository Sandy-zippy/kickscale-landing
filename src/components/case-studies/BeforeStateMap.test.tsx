import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BeforeStateMap from './BeforeStateMap'

const steps = [
  { step: 'Sales checks WhatsApp group', timeCost: '8-12 hrs/week' },
  { step: 'Copies into Excel', timeCost: '6 hrs/week' },
]

describe('BeforeStateMap', () => {
  it('renders all step descriptions', () => {
    render(<BeforeStateMap steps={steps} />)
    expect(screen.getByText(/Sales checks WhatsApp/)).toBeInTheDocument()
    expect(screen.getByText(/Copies into Excel/)).toBeInTheDocument()
  })
  it('renders zero-padded numbered indicators', () => {
    render(<BeforeStateMap steps={steps} />)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
  })
  it('renders time cost per step', () => {
    render(<BeforeStateMap steps={steps} />)
    expect(screen.getByText('8-12 hrs/week')).toBeInTheDocument()
    expect(screen.getByText('6 hrs/week')).toBeInTheDocument()
  })
})
