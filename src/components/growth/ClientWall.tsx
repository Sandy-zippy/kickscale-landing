import { motion } from 'framer-motion'
import { CLIENTS } from '../../data/growth'

interface Props {
  /** Restrict the wall to these client slugs. Omit to show everyone. */
  only?: string[]
  compact?: boolean
}

export default function ClientWall({ only, compact = false }: Props) {
  const list = only ? CLIENTS.filter(c => only.includes(c.slug)) : CLIENTS

  return (
    <div
      className={`grid gap-3 sm:gap-4 ${
        compact
          ? 'grid-cols-2 sm:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
      }`}
    >
      {list.map((c, i) => (
        <motion.div
          key={c.slug}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
          className={`flex items-center justify-center rounded-xl border px-5 py-6 transition-colors ${
            c.darkTile
              ? 'bg-[#14181A] border-[#14181A]'
              : 'bg-white border-[#E5E7EB] hover:border-[#D5EB4B]'
          }`}
        >
          <img
            src={`/logos/clients/${c.slug}.png`}
            alt={c.name}
            title={`${c.name} — ${c.vertical}`}
            loading="lazy"
            decoding="async"
            className="max-h-12 sm:max-h-14 w-auto object-contain"
          />
        </motion.div>
      ))}
    </div>
  )
}
