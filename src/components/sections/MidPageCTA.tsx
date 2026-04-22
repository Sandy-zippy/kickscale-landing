import { trackCTAClick } from '../../lib/tracking'

interface MidPageCTAProps {
  variant?: 'pain' | 'process' | 'roi'
}

export default function MidPageCTA({ variant = 'pain' }: MidPageCTAProps) {
  const copy = {
    pain: {
      headline: 'Every day you wait, manual work costs you money.',
      cta: 'See What You Can Save',
      sub: 'Free audit. No payment. No obligation.',
    },
    process: {
      headline: '2 weeks to live automations. Yours starts here.',
      cta: 'Start My Audit',
      sub: 'Custom roadmap delivered in 48 hours.',
    },
    roi: {
      headline: 'Those savings are waiting. Are you?',
      cta: 'Claim My Savings Report',
      sub: 'Free for 10 businesses this quarter.',
    },
  }
  const { headline, cta, sub } = copy[variant]

  return (
    <div className="bg-[#2A2A35] py-10 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-white font-semibold text-lg mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {headline}
        </p>
        <a
          href="#quiz"
          onClick={() => trackCTAClick('mid-page-cta', cta)}
          className="inline-block font-bold rounded-xl px-8 py-4 text-base bg-[#D5EB4B] text-[#0c0c10] hover:brightness-110 transition-all"
        >
          {cta}
        </a>
        <p className="text-[#6B7280] text-xs mt-3">{sub}</p>
      </div>
    </div>
  )
}
