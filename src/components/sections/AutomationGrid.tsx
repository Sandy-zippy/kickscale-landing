import ScrollReveal from '../ui/ScrollReveal'

const iconMap: Record<string, React.ReactNode> = {
  'Complete Lead Flow': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  'Invoice & Payment Processing': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  'Auto-Generated Reports': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  'Email & WhatsApp Follow-ups': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  'Customer Retention & Win-Back': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  'AI Voice + Messaging + Scheduling': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  'Inventory & Order Management': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  'HR & Payroll Processing': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D5EB4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
}

const cards = [
  {
    title: 'Complete Lead Flow',
    desc: 'Ad click to sales-ready lead. Capture, qualify, assign, and CRM sync without anyone lifting a finger.',
  },
  {
    title: 'Invoice & Payment Processing',
    desc: 'Auto-generate invoices, track payments, send reminders. Zero manual data entry.',
  },
  {
    title: 'Auto-Generated Reports',
    desc: 'Daily, weekly, monthly. Delivered on schedule. No spreadsheet wrangling, no waiting 3 days.',
  },
  {
    title: 'Email & WhatsApp Follow-ups',
    desc: 'Automated sequences triggered by customer actions. Right message, right time, every time.',
  },
  {
    title: 'Customer Retention & Win-Back',
    desc: 'Re-engagement flows, loyalty triggers, churn prevention. Your customers stay active without manual outreach.',
  },
  {
    title: 'AI Voice + Messaging + Scheduling',
    desc: 'AI handles calls, responds on WhatsApp, and books appointments. 24/7, no human required.',
  },
  {
    title: 'Inventory & Order Management',
    desc: 'Real-time stock tracking, auto-reorder points, order fulfillment workflows.',
  },
  {
    title: 'HR & Payroll Processing',
    desc: 'Automate onboarding, leave tracking, payroll calculations, and compliance.',
  },
]

export default function AutomationGrid() {
  return (
    <section id="automation-grid" className="bg-[#2A2A35] py-20 px-4">
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
            <ScrollReveal key={card.title} delay={i * 0.05} className="h-full">
              <div className="group h-full rounded-2xl border border-[#3E3E48] bg-[#33333F] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(213,235,75,0.2)] hover:shadow-lg hover:shadow-[rgba(213,235,75,0.05)] flex flex-col">
                <span className="mb-3 block">{iconMap[card.title]}</span>
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
