import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StackArchitectureDiagram from './StackArchitectureDiagram'

const nodes = [
  { id: 'patient', label: 'Patient', x: 10, y: 50, variant: 'source' as const },
  { id: 'ai', label: 'AI Triage', x: 50, y: 50, variant: 'middle' as const },
  { id: 'doctor', label: 'Doctor', x: 90, y: 50, variant: 'sink' as const },
]
const edges = [
  { from: 'patient', to: 'ai' },
  { from: 'ai', to: 'doctor' },
]

describe('StackArchitectureDiagram', () => {
  it('renders all node labels', () => {
    render(<StackArchitectureDiagram nodes={nodes} edges={edges} ariaLabel="Test architecture" />)
    expect(screen.getByText('Patient')).toBeInTheDocument()
    expect(screen.getByText('AI Triage')).toBeInTheDocument()
    expect(screen.getByText('Doctor')).toBeInTheDocument()
  })
  it('exposes the diagram with aria-label', () => {
    render(<StackArchitectureDiagram nodes={nodes} edges={edges} ariaLabel="Test architecture description" />)
    expect(screen.getByLabelText('Test architecture description')).toBeInTheDocument()
  })
  it('renders the legend', () => {
    render(<StackArchitectureDiagram nodes={nodes} edges={edges} ariaLabel="Test" />)
    expect(screen.getByText('chaos')).toBeInTheDocument()
    expect(screen.getByText('automation')).toBeInTheDocument()
    expect(screen.getByText('outcome')).toBeInTheDocument()
  })
})
