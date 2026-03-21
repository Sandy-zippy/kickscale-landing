import ScrollReveal from '../ui/ScrollReveal'

const cards = [
  { icon: '🏢', text: 'You do ₹5Cr+ revenue with 10+ employees' },
  { icon: '📱', text: 'Your team runs on WhatsApp groups and shared Excel sheets' },
  { icon: '🚀', text: 'You want to 3x output without hiring 5 more people' },
  { icon: '⏰', text: 'Your salary bill keeps climbing but output stays flat' },
]

export default function WhoIsThisFor() {
  return (
    <section className="bg-[#F8F9FA] py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <ScrollReveal>
          <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-[#B8CF2E]">
            IS THIS FOR YOU?
          </p>
          <h2 className="mx-auto mb-3 max-w-xl text-center text-3xl font-bold text-[#111827] sm:text-4xl">
            This Is Built for You If...
          </h2>
          <p className="mx-auto mb-12 max-w-md text-center text-sm text-[#6B7280]">
            If you recognise yourself here, take the quiz below.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cards.map((card, i) => (
            <ScrollReveal key={card.text} delay={i * 0.1}>
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#B8CF2E]">
                <div className="mb-4 text-4xl">{card.icon}</div>
                <p className="text-base font-medium text-[#111827]">{card.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
