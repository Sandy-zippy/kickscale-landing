import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { trackAwarenessSelect } from '../../lib/tracking'

const blocks = [
  {
    emoji: '\u{1F914}',
    label: "I'm not sure if I have a problem",
    sublabel: 'Let us show you where the money goes',
    scrollTo: 'pain',
    utmMatch: 'unaware',
  },
  {
    emoji: '\u{1F624}',
    label: "I know we're wasting money, not sure how to fix it",
    sublabel: 'See what automation can replace',
    scrollTo: 'automation-grid',
    utmMatch: 'problem-aware',
  },
  {
    emoji: '\u{1F50D}',
    label: "I'm looking for an automation partner",
    sublabel: "Here's how we work",
    scrollTo: 'how-it-works',
    utmMatch: 'solution-aware',
  },
  {
    emoji: '\u{2705}',
    label: 'I already know ZippyScale',
    sublabel: 'Jump straight to the audit',
    scrollTo: 'quiz',
    utmMatch: 'brand-aware',
  },
]

export default function AwarenessBlocks() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const utmContent = new URLSearchParams(window.location.search).get('utm_content')
    if (!utmContent) return

    const matched = blocks.find(b => b.utmMatch === utmContent)
    if (matched) {
      setHidden(true)
      const timer = setTimeout(() => {
        document.getElementById(matched.scrollTo)?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (hidden) return null

  const handleClick = (block: typeof blocks[number]) => {
    trackAwarenessSelect(block.utmMatch)
    document.getElementById(block.scrollTo)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="bg-[#FFFDF7] py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[#B8CF2E] mb-4">
          START HERE
        </p>
        <h2 className="font-bold text-2xl md:text-3xl text-[#1A1A2E] mb-2">
          Where Are You Right Now?
        </h2>
        <p className="text-base text-[#4A5568] mb-10">
          Pick what sounds like you. We'll take it from there.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {blocks.map((block, i) => (
            <motion.button
              key={block.utmMatch}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ scale: 1.03, borderColor: '#B8CF2E' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(block)}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-shadow text-left"
            >
              <span className="text-3xl mb-3 block">{block.emoji}</span>
              <span className="text-[#1A1A2E] font-semibold text-base block">{block.label}</span>
              <span className="text-[#4A5568] text-sm block mt-1">{block.sublabel}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
