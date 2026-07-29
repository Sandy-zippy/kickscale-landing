import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import { GIVEAWAYS } from '../data/giveaways'
import { Band, Kicker, Pill, Reveal, SignalField, Split, DISPLAY, EASE_OUT, LIME } from '../components/growth/kinetic'

export default function Giveaways() {
  useEffect(() => {
    document.title = 'Giveaways | Free growth tools by ZippyScale'
  }, [])

  // Same ink-ground opt-in /growth uses: the global body background is cream,
  // which would show as gutters when iOS rubber-bands past a near-black page.
  useEffect(() => {
    const el = document.documentElement
    const prev = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'ink')
    return () => {
      if (prev === null) el.removeAttribute('data-theme')
      else el.setAttribute('data-theme', prev)
    }
  }, [])

  return (
    <>
      <Nav noBanner floating dark ctaHref="/growth#enquire" />
      <main>
        <section
          className="relative isolate overflow-hidden bg-[#050507] pt-32 pb-20 text-white sm:pt-36 sm:pb-24"
          style={{ ['--zs-stroke-color' as string]: '#FFFFFF' }}
        >
          <SignalField count={44} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 75% 60% at 30% 40%, #16161F 0%, #0B0B12 46%, #050507 78%)',
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5">
            <Kicker>Giveaways · free, no call required</Kicker>
            <Split
              as="h1"
              className={`mt-7 ${DISPLAY}`}
              lines={[[{ text: 'Free tools you' }], [{ text: 'can actually', as: 'lime' }], [{ text: 'use.', as: 'stroke-serif' }]]}
            />
            <p className="mt-7 max-w-2xl text-[1.05rem] leading-relaxed text-white/60 sm:text-lg">
              Working models and calculators we built for our own clients. Put your numbers in,
              get a plan back. Nothing gated behind a sales call.
            </p>
          </div>
        </section>

        <Band tone="bone" className="py-20 sm:py-24">
          <Kicker tone="bone">The tools</Kicker>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {GIVEAWAYS.map((g, i) => (
              <motion.a
                key={g.slug}
                href={g.href}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: EASE_OUT }}
                className="group relative flex flex-col overflow-hidden rounded-[24px] border border-[#E2E2D8] bg-white p-8 transition-all duration-[300ms] hover:-translate-y-1 hover:border-[#B8CF2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8CF2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F5F0]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: LIME }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-4 -top-8 font-['Space_Grotesk'] text-[7.5rem] font-bold leading-none text-[#111214] opacity-[0.05]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span className="relative text-2xl">{g.emoji}</span>
                <h2 className="relative mt-4 font-['Space_Grotesk'] text-[1.7rem] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-[#111214]">
                  {g.title}
                </h2>
                <p className="relative mt-2 font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-[0.16em] text-[#8CA31B]">
                  {g.forWho}
                </p>
                <p className="relative mt-4 flex-1 leading-relaxed text-[#4B5563]">{g.blurb}</p>
                <span className="relative mt-7 inline-flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-[0.16em] text-[#111214]">
                  Open the tool
                  <span
                    aria-hidden
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-bold text-[#0A0A0C] transition-transform duration-[250ms] group-hover:translate-x-1"
                    style={{ background: LIME }}
                  >
                    →
                  </span>
                </span>
              </motion.a>
            ))}

            <Reveal delay={GIVEAWAYS.length * 0.08}>
              <div className="flex h-full flex-col justify-center rounded-[24px] border border-dashed border-[#C9C9BE] p-8">
                <h2 className="font-['Space_Grotesk'] text-[1.3rem] font-bold uppercase tracking-[-0.02em] text-[#6B7280]">
                  More on the way
                </h2>
                <p className="mt-3 leading-relaxed text-[#6B7280]">
                  We ship a new free tool regularly — calculators, audits and models pulled
                  straight out of live client work.
                </p>
                <div className="mt-7">
                  <Pill href="/growth#enquire" variant="ink">
                    Tell us what to build next
                  </Pill>
                </div>
              </div>
            </Reveal>
          </div>
        </Band>
      </main>
      <Footer />
    </>
  )
}
