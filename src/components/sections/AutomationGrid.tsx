import ScrollReveal from '../ui/ScrollReveal'

const cards = [
  {
    icon: '🔄',
    title: 'Complete Lead Flow',
    desc: 'Ad click to sales-ready lead. Capture, qualify, assign, and CRM sync without anyone lifting a finger.',
  },
  {
    icon: '💳',
    title: 'Invoice & Payment Processing',
    desc: 'Auto-generate invoices, track payments, send reminders. Zero manual data entry.',
  },
  {
    icon: '📊',
    title: 'Auto-Generated Reports',
    desc: 'Daily, weekly, monthly. Delivered on schedule. No spreadsheet wrangling, no waiting 3 days.',
  },
  {
    icon: '💬',
    title: 'Email & WhatsApp Follow-ups',
    desc: 'Automated sequences triggered by customer actions. Right message, right time, every time.',
  },
  {
    icon: '🤝',
    title: 'Customer Retention & Win-Back',
    desc: 'Re-engagement flows, loyalty triggers, churn prevention. Your customers stay active without manual outreach.',
  },
  {
    icon: '🤖',
    title: 'AI Voice + Messaging + Scheduling',
    desc: 'AI handles calls, responds on WhatsApp, and books appointments. 24/7, no human required.',
  },
  {
    icon: '📦',
    title: 'Inventory & Order Management',
    desc: 'Real-time stock tracking, auto-reorder points, order fulfillment workflows.',
  },
  {
    icon: '👥',
    title: 'HR & Payroll Processing',
    desc: 'Automate onboarding, leave tracking, payroll calculations, and compliance.',
  },
]

export default function AutomationGrid() {
  return (
    <section className="bg-[#141418] py-20 px-4">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <p className="text-center font-mono text-xs uppercase tracking-widest mb-4 text-[#D5EB4B]">
            WHAT WE AUTOMATE
          </p>
          <h2 className="mx-auto mb-12 max-w-2xl text-center text-3xl font-bold text-white sm:text-4xl">
            8 Things Your Team Should Stop Doing Manually
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 0.05}>
              <div className="group h-full rounded-2xl border border-[#2E2E36] bg-[#1E1E24] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(213,235,75,0.2)] hover:shadow-lg hover:shadow-[rgba(213,235,75,0.05)]">
                <span className="mb-3 block text-3xl">{card.icon}</span>
                <h3 className="mb-2 text-base font-semibold text-[#D5EB4B]">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#9CA3AF]">
                  {card.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
