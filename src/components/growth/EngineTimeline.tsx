/**
 * The growth engine as a scroll-driven timeline.
 *
 * This is the reference's "what makes us different" section — a spine down the
 * middle, cards alternating left and right, and a marker that travels the
 * spine as you scroll, lighting each stage as it passes. Their marker is a
 * rocket (space theme); ours is a signal pulse, because the story here is
 * ZippyScale's funnel, not a launch.
 *
 * It also puts the growth-engine narrative back on the page without needing
 * public/growth-flow.webp, the diagram Sandy asked to have removed.
 *
 * Motion is framer's useScroll on a container ref — progress is a plain
 * transform, so nothing here reads layout during scroll.
 */
import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ENGINE_STAGES } from '../../data/growth'
import { EASE_OUT } from './kinetic'

function Stage({
  stage,
  index,
  progress,
}: {
  stage: (typeof ENGINE_STAGES)[number]
  index: number
  progress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const total = ENGINE_STAGES.length
  // the window of scroll progress during which this stage is "reached"
  const at = (index + 0.55) / total
  // hooks hoisted out of JSX so their call order is obvious and stable
  const lit = useTransform(progress, [at - 0.14, at], [0, 1])
  const nodeOpacity = useTransform(lit, [0, 1], [0.25, 1])
  const nodeScale = useTransform(lit, [0, 1], [0.7, 1])
  const cardOpacity = useTransform(lit, [0, 1], [0.42, 1])
  const left = index % 2 === 0

  return (
    <div
      className={`relative flex ${left ? 'md:justify-start md:pr-[54%]' : 'md:justify-end md:pl-[54%]'} pl-14 md:pl-0`}
    >
      {/* node on the spine */}
      <motion.span
        aria-hidden
        style={{ opacity: nodeOpacity, scale: nodeScale }}
        className="absolute left-[22px] top-8 z-10 -translate-x-1/2 md:left-1/2"
      >
        <span
          className="block h-3.5 w-3.5 rounded-full ring-4 ring-[#050507]"
          style={{ background: stage.accent, boxShadow: `0 0 18px ${stage.accent}` }}
        />
      </motion.span>

      {/* horizontal tick joining node to card, desktop only */}
      <span
        aria-hidden
        className={`absolute top-[42px] hidden h-px w-[5%] md:block ${left ? 'right-1/2' : 'left-1/2'}`}
        style={{
          background: `linear-gradient(${left ? 'to left' : 'to right'}, ${stage.accent}66, transparent)`,
        }}
      />

      <motion.div
        // only y is animated here — opacity is owned by the scroll-linked
        // MotionValue below, and a style MotionValue beats whileInView
        initial={{ y: 26 }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        style={{ opacity: cardOpacity }}
        className="w-full max-w-[430px] rounded-[24px] border border-white/10 bg-[#0B0B12] p-6 sm:p-7"
      >
        <div className="flex items-baseline gap-3">
          <span
            className="font-['Space_Grotesk'] text-[2.1rem] font-bold leading-none tracking-[-0.03em]"
            style={{ color: stage.accent }}
          >
            {stage.num}
          </span>
          <h3 className="font-['Space_Grotesk'] text-[1.5rem] font-bold uppercase tracking-[-0.02em] text-white">
            {stage.title}
          </h3>
        </div>
        <p className="mt-3 font-['Space_Grotesk'] text-[1.02rem] font-bold text-white/85">{stage.lead}</p>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/55">{stage.detail}</p>
      </motion.div>
    </div>
  )
}

export default function EngineTimeline() {
  const wrap = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: wrap,
    offset: ['start 0.8', 'end 0.55'],
  })
  // with reduced motion every stage is simply lit — no travelling marker
  const fill = useTransform(scrollYProgress, v => `${(reduced ? 1 : v) * 100}%`)

  return (
    <div ref={wrap} className="relative mt-14">
      {/* the spine: a dim full-height rail with a lit portion that grows */}
      <div
        aria-hidden
        className="absolute bottom-0 left-[22px] top-0 w-px -translate-x-1/2 bg-white/10 md:left-1/2"
      />
      <motion.div
        aria-hidden
        style={{ height: fill }}
        className="absolute left-[22px] top-0 w-px -translate-x-1/2 md:left-1/2"
      >
        <span className="block h-full w-full bg-gradient-to-b from-[#D5EB4B]/10 via-[#D5EB4B]/70 to-[#D5EB4B]" />
        {/* the travelling head */}
        {!reduced && (
          <span
            className="absolute -bottom-1 left-1/2 block h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#D5EB4B]"
            style={{ boxShadow: '0 0 20px 4px rgba(213,235,75,0.75)' }}
          />
        )}
      </motion.div>

      <div className="space-y-10 md:space-y-4">
        {ENGINE_STAGES.map((s, i) => (
          <Stage key={s.num} stage={s} index={i} progress={scrollYProgress} />
        ))}
      </div>
    </div>
  )
}
