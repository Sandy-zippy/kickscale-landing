import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CLIENT_VIDEOS, drivePoster, driveEmbed } from '../../data/videos'
import type { ClientVideo } from '../../data/videos'

function PlayGlyph({ big = false }: { big?: boolean }) {
  return (
    <span
      className={`grid place-items-center rounded-full bg-[#D5EB4B] text-[#0c0c10] shadow-lg ${
        big ? 'h-16 w-16' : 'h-12 w-12'
      }`}
    >
      <svg width={big ? 22 : 17} height={big ? 24 : 19} viewBox="0 0 17 19" fill="currentColor" aria-hidden>
        <path d="M16.2 8.7 1.9.3A.9.9 0 0 0 .5 1v16.8a.9.9 0 0 0 1.4.8l14.3-8.4a.9.9 0 0 0 0-1.5Z" />
      </svg>
    </span>
  )
}

function Card({ v, onOpen, i }: { v: ClientVideo; onOpen: () => void; i: number }) {
  const [posterFailed, setPosterFailed] = useState(false)
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: Math.min(i * 0.07, 0.5) }}
      whileHover={{ y: -4 }}
      className="group relative block w-full overflow-hidden rounded-[24px] border border-[#E2E2D8] bg-white text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8CF2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F5F0]"
      aria-label={`Play ${v.title} — ${v.who}, ${v.meta}`}
    >
      <div className="relative aspect-video overflow-hidden bg-[#0B0B14]">
        {!posterFailed ? (
          <img
            src={drivePoster(v.driveId)}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setPosterFailed(true)}
            className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(213,235,75,0.16), #0B0B14 70%)' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B14]/85 via-transparent to-transparent" />
        <div className="absolute inset-0 grid place-items-center">
          <motion.span whileHover={{ scale: 1.08 }} className="transition-transform">
            <PlayGlyph />
          </motion.span>
        </div>
      </div>
      <div className="p-5">
        <p className="font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-[0.16em] text-[#8CA31B]">{v.who}</p>
        <h3 className="mt-1.5 font-['Space_Grotesk'] text-lg font-bold text-[#111214]">{v.title}</h3>
        <p className="mt-0.5 text-sm text-[#6B7280]">{v.meta}</p>
      </div>
    </motion.button>
  )
}

export default function VideoWall() {
  const [open, setOpen] = useState<ClientVideo | null>(null)

  const close = useCallback(() => setOpen(null), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, close])

  return (
    <section id="conversations" className="scroll-mt-28 bg-[#F5F5F0]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <p className="flex items-center gap-3 font-['JetBrains_Mono'] text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B7280]">
          <span aria-hidden className="inline-block h-px w-8 shrink-0 bg-[#D5EB4B]" />
          Conversations
        </p>
        <h2 className="mt-6 font-['Space_Grotesk'] text-[2rem] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[#111214] sm:text-[2.9rem] lg:text-[3.4rem]">
          In their words
        </h2>
        <p className="mt-5 max-w-2xl leading-relaxed text-[#4B5563]">
          Real sessions with the people we work for — unscripted, unedited.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CLIENT_VIDEOS.map((v, i) => (
            <Card key={v.driveId} v={v} i={i} onOpen={() => setOpen(v)} />
          ))}
        </div>
      </div>

      {/* lightbox — the player only mounts once something is opened */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={open.title}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-5xl"
            >
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#B8CF2E]">
                    {open.who}
                  </p>
                  <h3 className="font-['Space_Grotesk'] text-xl font-bold text-white">
                    {open.title} <span className="font-normal text-white/40">· {open.meta}</span>
                  </h3>
                </div>
                <button
                  onClick={close}
                  className="shrink-0 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
                <iframe
                  src={driveEmbed(open.driveId)}
                  title={open.title}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  className="block aspect-video w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
