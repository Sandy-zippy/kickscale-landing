import { useState } from 'react'

interface Props { markdown: string; label?: string }

export default function CopyAsMarkdownButton({ markdown, label = 'Copy as Markdown' }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied to clipboard' : label}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] text-sm font-semibold text-[#1A1A2E] hover:border-[#D5EB4B] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:outline-none"
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}
