/**
 * Portfolio card: a device frame whose page scrolls slowly top to bottom and back
 * (a tall full-page screenshot, transform only), then client, sector + country, scope
 * tags, ONE real metric or a marked empty slot, and the live link.
 *
 * The scroll runs on hover/focus with a real pointer, and always while in view on
 * touch. Reduced motion: the screenshot rests at the top.
 */
import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useCalmMotion, useCanHover } from '../cockpit/useCalmMotion'
import { MONO } from './tokens'

export type PortfolioCardProps = {
  client: string
  sector: string
  country: string
  tags: string[]
  /** one real number about our work, e.g. "PageSpeed 96 mobile". null shows a marked slot. */
  metric?: string | null
  href: string
  /** a full-page screenshot (webp) at the frame's width: a tall one scrolls, a 16:10 poster gets a slow push-in */
  image: string
  imageAlt: string
  device?: 'desktop' | 'phone'
}

export default function PortfolioCard({ client, sector, country, tags, metric = null, href, image, imageAlt, device = 'desktop' }: PortfolioCardProps) {
  const calm = useCalmMotion()
  const hover = useCanHover()
  const ref = useRef<HTMLDivElement>(null)
  /* no href = a demo behind a client login: a card, not a link */
  const Card = (href ? motion.a : motion.div) as typeof motion.div
  const linkProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {}
  const inView = useInView(ref, { amount: 0.5 })
  const phone = device === 'phone'
  const scroll = !calm && (hover ? 'hover' : inView)
  /* px the shot can travel inside the frame; 0 for a poster that already fits, which gets a slow push-in instead */
  const [travel, setTravel] = useState(0)
  const measure = (img: HTMLImageElement) => {
    const frame = img.parentElement
    if (frame && img.naturalWidth) setTravel(Math.max(0, Math.round(img.naturalHeight * frame.offsetWidth / img.naturalWidth - frame.offsetHeight)))
  }

  return (
    <Card
      ref={ref}
      {...linkProps}
      initial="rest"
      whileHover={hover ? 'play' : undefined}
      whileFocus="play"
      animate={scroll === true ? 'play' : 'rest'}
      className="group block rounded-3xl border border-[#111111]/10 bg-white p-3 transition-shadow hover:shadow-[0_30px_70px_-40px_rgba(17,17,17,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
    >
      <div className={`relative overflow-hidden bg-[#111111] ${phone ? 'mx-auto w-[56%] rounded-[28px] p-2' : 'rounded-2xl p-1.5 pt-6'}`}>
        {!phone && <span aria-hidden className="absolute left-3 top-2.5 flex gap-1.5">{[0, 1, 2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-white/20" />)}</span>}
        <div className={`relative overflow-hidden bg-[#F5F5F0] ${phone ? 'aspect-[9/19] rounded-[20px]' : 'aspect-[16/10] rounded-xl'}`}>
          <motion.img
            src={image}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            onLoad={e => measure(e.currentTarget)}
            className={`absolute inset-x-0 top-0 w-full ${travel ? '' : 'h-full object-cover object-top'}`}
            variants={calm ? undefined : {
              rest: { y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
              play: travel
                ? { y: [0, -travel, -travel, 0], transition: { duration: Math.min(18, 4 + travel / 120), times: [0, 0.45, 0.55, 1], ease: 'easeInOut', repeat: Infinity } }
                : { scale: 1.06, transition: { duration: 6, ease: 'easeOut' } },
            }}
          />
        </div>
      </div>
      <div className="px-2 pb-2 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-['Space_Grotesk'] text-[1.25rem] font-bold leading-tight text-[#111111]">{client}</h3>
          {href && <span aria-hidden className="text-[#111111]/40 transition-transform group-hover:translate-x-1">↗</span>}
        </div>
        <p className="mt-0.5 text-[13.5px] text-slate-600">{sector} · {country}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {tags.map(t => <li key={t} className={`${MONO} rounded-full border border-[#111111]/15 px-2.5 py-1 text-[10.5px] uppercase tracking-wider text-[#111111]/70`}>{t}</li>)}
        </ul>
        {/* only a real, measured result is ever shown; none = nothing (approved copy) */}
        {metric && (
          <p className="mt-3 inline-block rounded-lg bg-[#D9EA66] px-2.5 py-1 text-[13px] font-semibold text-[#111111]">{metric}</p>
        )}
        {href && <span className="sr-only"> (opens the live site in a new tab)</span>}
      </div>
    </Card>
  )
}
