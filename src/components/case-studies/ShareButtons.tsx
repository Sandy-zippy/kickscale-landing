interface Props { title: string; url: string }

export default function ShareButtons({ title, url }: Props) {
  const text = encodeURIComponent(`${title} — ${url}`)
  const wa = `https://wa.me/?text=${text}`
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  const copyUrl = `${url}?utm_source=share-copy`

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyUrl)
    } catch {
      // clipboard blocked — silent
    }
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className="px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#128C7E] transition-colors"
      >
        WhatsApp
      </a>
      <a
        href={li}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="px-4 py-2 rounded-lg bg-[#0A66C2] text-white text-sm font-semibold hover:bg-[#004182] transition-colors"
      >
        LinkedIn
      </a>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy link to case study"
        className="px-4 py-2 rounded-lg bg-[#1A1A2E] text-white text-sm font-semibold hover:bg-[#2A2A35] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D5EB4B] focus-visible:outline-none"
      >
        Copy link
      </button>
    </div>
  )
}
