import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import { GIVEAWAYS } from '../data/giveaways'

export default function Giveaways() {
  useEffect(() => {
    document.title = 'Giveaways | Free growth tools by ZippyScale'
  }, [])

  return (
    <>
      <Nav noBanner ctaHref="/growth#enquire" />
      <main>
        <section className="bg-[#1A1A2E] text-white">
          <div className="max-w-6xl mx-auto px-5 pt-28 pb-16 sm:pt-32 sm:pb-20">
            <p className="inline-flex items-center rounded-full bg-[#D5EB4B] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0c0c10]">
              Giveaways
            </p>
            <h1 className="mt-6 font-['Space_Grotesk'] font-bold text-[2.25rem] sm:text-[3.5rem] leading-[1.05] tracking-[-0.03em]">
              Free tools you can actually use.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/70 leading-relaxed">
              Working models and calculators we built for our own clients. Use them free — put in
              your numbers, get a plan back. No call required.
            </p>
          </div>
        </section>

        <section className="bg-[#FFFDF7]">
          <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20">
            <div className="grid gap-6 md:grid-cols-2">
              {GIVEAWAYS.map((g, i) => (
                <motion.a
                  key={g.slug}
                  href={g.href}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="group flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-8 hover:border-[#D5EB4B] hover:shadow-[0_18px_40px_-28px_rgba(20,20,30,0.4)] transition-all"
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <h2 className="mt-4 font-['Space_Grotesk'] font-bold text-2xl text-[#1A1A2E]">
                    {g.title}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[#B8CF2E]">{g.forWho}</p>
                  <p className="mt-4 text-[#4B5563] leading-relaxed flex-1">{g.blurb}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#1A1A2E] group-hover:gap-2.5 transition-all">
                    Open the tool <span aria-hidden>→</span>
                  </span>
                </motion.a>
              ))}

              <div className="flex flex-col justify-center rounded-2xl border border-dashed border-[#D1D5DB] bg-transparent p-8">
                <h2 className="font-['Space_Grotesk'] font-bold text-xl text-[#6B7280]">
                  More on the way
                </h2>
                <p className="mt-3 text-[#6B7280] leading-relaxed">
                  We ship a new free tool regularly — calculators, audits and models pulled
                  straight out of live client work.
                </p>
                <a
                  href="/growth#enquire"
                  className="mt-6 inline-flex w-fit items-center rounded-lg bg-[#1A1A2E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2A2A35] transition-colors"
                >
                  Tell us what to build next
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
