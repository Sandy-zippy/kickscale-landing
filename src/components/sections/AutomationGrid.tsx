import ScrollReveal from '../ui/ScrollReveal'

const cards = [
  {
    icon: '🔄',
    title: 'Complete Lead Flow',
    desc: 'End-to-end lead capture, qualification, assignment, and CRM sync. From ad click to sales-ready lead, fully automated.',
  },
  {
    icon: '💳',
    title: 'Invoice & Payment Processing',
    desc: 'Auto-generate invoices, track payments, send reminders. Zero manual data entry.',
  },
  {
    icon: '📊',
    title: 'Daily, Weekly & Monthly Report Generation',
    desc: 'Automated reports delivered on schedule. No spreadsheet wrangling. Real-time data, zero manual effort.',
  },
  {
    icon: '💬',
    title: 'Email & WhatsApp Follow-ups',
    desc: 'Automated sequences triggered by customer actions. Right message, right time, every time.',
  },
  {
    icon: '🤝',
    title: 'Customer Engagement & Retention Automation',
    desc: 'Automated re-engagement flows, loyalty triggers, churn prevention, and win-back campaigns. Keep customers active without manual outreach.',
  },
  {
    icon: '🤖',
    title: 'AI Voice Agent + AI Messaging Agent + Appointment Scheduling',
    desc: 'AI handles calls, responds to messages, and books appointments. 24/7 availability without a human on the line.',
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
    <section className="bg-[#141418] py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-[#D5EB4B]">
            WHAT WE AUTOMATE
          </p>
          <h2 className="mx-auto mb-12 max-w-2xl text-center font-heading text-3xl font-bold text-white sm:text-4xl">
            8 Areas Where AI Replaces Busywork
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
