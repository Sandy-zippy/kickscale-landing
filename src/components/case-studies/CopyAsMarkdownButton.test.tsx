import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CopyAsMarkdownButton from './CopyAsMarkdownButton'

describe('CopyAsMarkdownButton', () => {
  it('renders default label', () => {
    render(<CopyAsMarkdownButton markdown="# Hi" />)
    expect(screen.getByRole('button', { name: /Copy as Markdown/ })).toBeInTheDocument()
  })
  it('renders custom label', () => {
    render(<CopyAsMarkdownButton markdown="# Hi" label="Copy MD" />)
    expect(screen.getByRole('button', { name: /Copy MD/ })).toBeInTheDocument()
  })
})
