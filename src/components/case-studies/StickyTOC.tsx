import { useEffect, useState } from 'react'

interface Section { id: string; label: string }

export default function StickyTOC({ sections }: { sections: Section[] }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    )
    sections.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav
      data-testid="sticky-toc"
      className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 w-56 z-40"
      aria-label="Case study sections"
    >
      <ul className="space-y-2 text-sm">
        {sections.map(s => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`block px-3 py-2 border-l-2 transition-all ${
                activeId === s.id
                  ? 'border-[#D5EB4B] text-[#1A1A2E] font-semibold bg-[#D5EB4B]/10'
                  : 'border-gray-200 text-[#6B7280] hover:text-[#1A1A2E] hover:border-[#B8CF2E]'
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
