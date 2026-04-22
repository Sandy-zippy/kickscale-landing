import CaseStudyLayout from '../../components/case-studies/CaseStudyLayout'
import CaseStudyHero from '../../components/case-studies/CaseStudyHero'
import BeforeStateMap from '../../components/case-studies/BeforeStateMap'
import StackArchitectureDiagram from '../../components/case-studies/StackArchitectureDiagram'
import WhatsAppChaosMockup from '../../components/case-studies/WhatsAppChaosMockup'
import WeekTimeline from '../../components/case-studies/WeekTimeline'
import ObjectionAccordion from '../../components/case-studies/ObjectionAccordion'
import TabbedStack from '../../components/case-studies/TabbedStack'
import RelatedCaseStudiesCarousel from '../../components/case-studies/RelatedCaseStudiesCarousel'
import FeaturedQuote from '../../components/case-studies/FeaturedQuote'
import FaqAccordion from '../../components/case-studies/FaqAccordion'
import TechStackBadges from '../../components/case-studies/TechStackBadges'
import IndustryROICalculator from '../../components/case-studies/IndustryROICalculator'
import WhatYouGetTable from '../../components/case-studies/WhatYouGetTable'
import ComparisonTable from '../../components/case-studies/ComparisonTable'
import AuditTimeline from '../../components/case-studies/AuditTimeline'
import FinalCTA from '../../components/sections/FinalCTA'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { registry } from './registry'
import { content } from './content/hospitality-fnb'

const SLUG = 'hospitality-fnb-reservations-loyalty-stack' as const
const meta = registry[SLUG]

const beforeMessages = [
  { sender: 'IG DM', body: 'Table for 4 Friday 8 PM?', time: '8:14 AM' },
  { sender: 'WhatsApp', body: 'Anniversary booking, surprise dessert?', time: '8:18 AM' },
  { sender: 'Stock chat', body: 'Chicken count 14kg, gin 2 bottles', time: '8:22 AM' },
  { sender: 'Zomato', body: 'Variance ₹40K, what happened?', time: '8:30 AM' },
  { sender: 'Owner', body: 'Who confirmed the corporate 12-top?', time: '8:42 AM' },
]
const afterMessages = [
  { sender: 'AI', body: '✓ Friday 8 PM reservation confirmed. Anniversary noted.', time: 'Just now' },
  { sender: 'AI', body: '✓ Stock digest 9 AM: chicken 14kg, gin 2, low on tomato.', time: 'Just now' },
  { sender: 'AI', body: '⚠ Zomato variance flagged: ₹40K from Wednesday discount campaign.', time: 'Just now' },
]

export default function HospitalityFnb() {
  return (
    <CaseStudyLayout metadata={meta}>
      <CaseStudyHero
        variant={SLUG}
        industryBadge="Case Study · Hospitality"
        headline={meta.title}
        subhead="For independent cafes and 2-5 outlet restaurant groups drowning in Instagram DMs, WhatsApp reservations, and Zomato reconciliation."
        statBefore={meta.heroStatBefore}
        statAfter={meta.heroStatAfter}
        statLabel={meta.heroStatLabel}
        benefits={[
          'IG + WhatsApp + landline in one inbox',
          'Repeat customers detected via POS webhook',
          'Birthdays captured and celebrated automatically',
        ]}
        ctaText="Book free 48h audit"
        ctaSubtext="30-min Zoom. No deck. We flag the 3 biggest leaks."
      />

      <section className="py-5 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono uppercase tracking-wider text-[#6B7280]">
          <span>20+ Indian SMBs</span>
          <span aria-hidden="true" className="text-[#D5EB4B]">●</span>
          <span>8,000+ hours back</span>
          <span aria-hidden="true" className="text-[#D5EB4B]">●</span>
          <span>₹1.6 Cr+ saved</span>
          <span aria-hidden="true" className="text-[#D5EB4B]">●</span>
          <span>4-week sprint from ₹1.5L</span>
        </div>
      </section>

      <section id="summary" className="py-16 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-8">The 60-second summary</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Who', value: content.sixtySecondSummary.who, accent: 'neutral' as const },
              { label: 'What broke', value: content.sixtySecondSummary.whatBroke, accent: 'red' as const },
              { label: 'What we built', value: content.sixtySecondSummary.whatWeBuilt, accent: 'neutral' as const },
              { label: 'What changed', value: content.sixtySecondSummary.whatChanged, accent: 'lime' as const },
            ].map((card, i) => {
              const accentClass =
                card.accent === 'red'
                  ? 'border-l-4 border-l-red-500'
                  : card.accent === 'lime'
                    ? 'border-l-4 border-l-[#D5EB4B]'
                    : ''
              const labelColor =
                card.accent === 'red'
                  ? 'text-red-600'
                  : card.accent === 'lime'
                    ? 'text-[#B8CF2E]'
                    : 'text-[#6B7280]'
              return (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className={`bg-[#FFFDF7] border border-[#E5E7EB] rounded-xl p-5 h-full ${accentClass}`}>
                    <p className={`text-xs font-mono uppercase tracking-wider mb-2 ${labelColor}`}>{card.label}</p>
                    <p className="text-[#1A1A2E] leading-relaxed">{card.value}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      <section id="who" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-6">Who this is for</h2>
          </ScrollReveal>
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#B8CF2E] mb-2">Revenue</p>
              <p className="text-[#1A1A2E] text-sm">{content.icpSnapshot.revenue}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#B8CF2E] mb-2">Team</p>
              <p className="text-[#1A1A2E] text-sm">{content.icpSnapshot.team}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#B8CF2E] mb-2">Geography</p>
              <p className="text-[#1A1A2E] text-sm">{content.icpSnapshot.geography}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#B8CF2E] mb-2">Current stack</p>
              <ul className="text-[#1A1A2E] text-sm space-y-1">
                {content.icpSnapshot.currentStack.map((s, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-[#B8CF2E]">·</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="pain" className="py-16 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-[#1A1A2E] mb-3">A week behind the hostess desk.</h2>
              <p className="text-[#4B5563] leading-relaxed mb-6">Instagram, WhatsApp, paper diary, three stock groups, two aggregator dashboards. Friday tables get given to the wrong table.</p>
              <ul className="space-y-3 mb-6">
                {[
                  { time: 'Wed 8 AM', label: '47 unread IG DMs, 11 are reservations.' },
                  { time: 'Hostess', label: '2 WhatsApp numbers + landline + paper diary.' },
                  { time: 'Friday', label: 'Double-booking found at the table.' },
                  { time: 'Daily', label: 'Stock check across 3 WhatsApp groups (45 min).' },
                  { time: 'Month-end', label: '2 days Zomato + Swiggy + POS reconciliation.' },
                  { time: 'Birthdays', label: 'Mentioned at table, never captured.' },
                ].map((row, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-red-600 font-bold w-20 shrink-0 text-right">{row.time}</span>
                    <span className="text-[#1A1A2E]">{row.label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#1A1A2E] font-semibold leading-snug border-l-4 border-[#D5EB4B] pl-4">
                The owner does not need a Dineout-style aggregator. She wants the predictable 80% (reservations from one inbox, stock alerts in one place, Zomato reconciliation auto, repeat detection, birthday capture) handled.
              </p>
            </ScrollReveal>
          </div>
          <div>
            <WhatsAppChaosMockup beforeMessages={beforeMessages} afterMessages={afterMessages} profile={{ name: 'Reservations Desk', initials: 'RS' }} />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#FFFDF7]">
        <FeaturedQuote
          quote={content.painQuotes[0].quote}
          attribution={content.painQuotes[0].attribution}
          context="From a discovery call with a Banjara Hills restaurant owner, March 2026"
        />
      </section>

      <section id="before" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Here's what the F&B week looks like today</h2>
            <p className="text-[#6B7280] mb-6">The 10 manual steps a cafe team does (or skips) every single week.</p>
          </ScrollReveal>
          <BeforeStateMap
            steps={content.beforeStateSteps}
            totalSummary={{ value: '~20 hrs/week', label: 'lost across hostess, ops, chef, and accountant to fragmented inbox, stock chase, aggregator reconciliation, and missed VIP touches. Per outlet. Every week.' }}
          />
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto bg-[#FFFDF7] border-l-4 border-[#D5EB4B] rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="font-semibold text-[#1A1A2E]">Want this stack for your outlet? Book your audit.</p>
          <a
            href="/#quiz"
            className="bg-[#D5EB4B] text-[#0c0c10] font-bold px-6 py-3 rounded-xl hover:bg-[#E4F57A] transition-colors text-center whitespace-nowrap"
          >
            Book audit →
          </a>
        </div>
      </section>

      <section id="stack" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">The stack we deploy</h2>
            <p className="text-[#6B7280] mb-6">Eight tools, one workflow. Watch the data move.</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="mb-10">
              <StackArchitectureDiagram
                ariaLabel="IG DMs and WhatsApp reservations flow into the unified GHL inbox via the AI reservation agent. POS webhook (Petpooja or Posist) silently logs repeat customers and CLV. n8n nightly ingest reconciles Zomato + Swiggy. Owner sees Monday 10 AM digest."
                nodes={[
                  { id: 'guest', label: 'Guest', sublabel: 'IG + WA + landline', x: 8, y: 50, variant: 'source' },
                  { id: 'ai', label: 'AI reservation', sublabel: '<60 sec', x: 28, y: 50, variant: 'middle' },
                  { id: 'ghl', label: 'GHL CRM', sublabel: '7-stage pipeline', x: 50, y: 50, variant: 'middle' },
                  { id: 'pos', label: 'POS webhook', sublabel: 'Petpooja / Posist', x: 72, y: 22, variant: 'middle' },
                  { id: 'stock', label: 'Stock classifier', sublabel: '3 groups → digest', x: 72, y: 50, variant: 'middle' },
                  { id: 'recon', label: 'Aggregator recon', sublabel: 'Zomato + Swiggy', x: 72, y: 78, variant: 'middle' },
                  { id: 'owner', label: 'Owner', sublabel: 'Mon 10 AM digest', x: 92, y: 30, variant: 'human' },
                  { id: 'repeat', label: 'Repeat guest', sublabel: 'birthday captured · CLV tracked', x: 92, y: 70, variant: 'sink' },
                ]}
                edges={[
                  { from: 'guest', to: 'ai', delay: 0 },
                  { from: 'ai', to: 'ghl', delay: 0.15 },
                  { from: 'ghl', to: 'pos', delay: 0.3 },
                  { from: 'ghl', to: 'stock', delay: 0.4 },
                  { from: 'ghl', to: 'recon', delay: 0.5 },
                  { from: 'pos', to: 'owner', delay: 0.65 },
                  { from: 'recon', to: 'repeat', delay: 0.75 },
                  { from: 'stock', to: 'repeat', delay: 0.85 },
                ]}
              />
            </div>
          </ScrollReveal>
          <TabbedStack
            tabs={content.stackTools.map(t => ({
              id: t.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              label: t.name,
              content: (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#B8CF2E] mb-3 inline-block">
                    {t.role}
                  </span>
                  <p className="text-[#4B5563] leading-relaxed">{t.description}</p>
                </div>
              ),
            }))}
          />
        </div>
      </section>

      <section id="tech" className="py-16 px-4 bg-[#FFFDF7]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#B8CF2E] mb-3">
              Built with
            </span>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">The engineering stack behind every sprint</h2>
            <p className="text-[#6B7280] mb-8 max-w-2xl">No magic. Production-grade tools. We pick no-code where it makes sense and write code where it does not. India-hosted by default.</p>
          </ScrollReveal>
          <TechStackBadges />
        </div>
      </section>

      <section id="sprint" className="py-16 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">The 4-week sprint</h2>
            <p className="text-[#6B7280] mb-6">From kickoff to handover in 28 days.</p>
          </ScrollReveal>
          <WeekTimeline weeks={content.sprintPlan} />
        </div>
      </section>

      <section id="outcomes" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Target outcomes</h2>
            <p className="text-[#6B7280] mb-6">Honest target ranges, not invented client numbers.</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-4">
            {content.targetOutcomes.map((o, i) => (
              <ScrollReveal key={i} delay={i * 0.06}>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 h-full">
                  <p className="text-xs font-mono text-[#6B7280] uppercase tracking-wider mb-3">{o.metric}</p>
                  <div className="flex items-baseline gap-2 font-mono mb-2 flex-wrap">
                    <span className="text-sm text-red-600">{o.before}</span>
                    <span className="text-[#6B7280]" aria-hidden="true">→</span>
                    <span className="text-lg font-bold text-[#B8CF2E]">{o.after}</span>
                  </div>
                  {o.caveat && <p className="text-xs text-[#6B7280] italic">{o.caveat}</p>}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="roi" className="py-16 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto">
          <IndustryROICalculator slug={SLUG} />
        </div>
      </section>

      <section id="pricing" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">What ₹1.5L actually buys you</h2>
            <p className="text-[#6B7280] mb-8">No hidden setup fees. No "professional services" upsells. Everything below ships in 28 days.</p>
          </ScrollReveal>
          <WhatYouGetTable
            oneTime={{
              price: '₹1.5L',
              subtitle: '4-week sprint, paid 50% on Week 0 and 50% on Week 4',
              items: [
                { included: true, label: 'Half-day shadow at hostess + ops + chef desks', detail: 'We sit through a Wednesday morning rush, a Friday night, and a Monday morning recon.' },
                { included: true, label: 'GHL sub-account fully configured', detail: 'Pipeline (7 stages), customer master with CLV + birthday + dietary, conversation inbox.' },
                { included: true, label: 'WhatsApp Business API + Instagram Graph API', detail: 'Single brand WABA + IG DM in unified inbox. Hostess and floor manager share.' },
                { included: true, label: '8 Meta-approved templates', detail: 'Reservation ack, T-24h, T-2h see-you-tonight, post-visit, birthday, lapsed reactivation, walk-in waitlist, special-event invite.' },
                { included: true, label: 'AI reservation agent + party-size capture', detail: 'First-touch in 60 seconds. Hostess only sees the asks that need a human.' },
                { included: true, label: 'POS webhook (Petpooja or Posist)', detail: 'Closed bills update customer record with last visit, total visits, CLV. Repeat detection silent.' },
                { included: true, label: 'Stock classifier + Zomato/Swiggy nightly recon', detail: '3 ops WhatsApp groups → 3-min digest. Aggregator variance flagged.' },
                { included: true, label: 'Documented SOPs + 90-min team training', detail: 'Hand-over docs hostess + floor manager + chef + ops + owner can actually follow.' },
                { included: true, label: '30 days of hypercare after handover', detail: 'We monitor, fix, and tweak. You message us. We respond same-day.' },
              ],
            }}
            recurring={{
              price: '₹16K',
              subtitle: 'Per month, billed monthly. Cancel anytime with 30 days notice.',
              items: [
                { included: true, label: 'WhatsApp Business API hosting + IG Graph API', detail: 'BSP costs, message conversations, template approvals.' },
                { included: true, label: 'GHL CRM seat + storage', detail: 'Full sub-account, unlimited contacts, unlimited team logins.' },
                { included: true, label: 'AI reservation agent inference + tuning', detail: 'Monthly retraining as your menu and reservation patterns evolve.' },
                { included: true, label: 'n8n + aggregator scraper hosting + monitoring', detail: 'We watch the queue. We get paged when something breaks.' },
                { included: true, label: 'Email infrastructure', detail: 'Reservation receipts, monthly newsletter, escalations.' },
                { included: true, label: 'Quarterly review + performance tuning', detail: 'We pull numbers, propose tweaks, you approve.' },
                { included: false, label: 'Major customizations', detail: 'New outlets, new POS systems, deep integrations are quoted separately as mini-sprints.' },
              ],
            }}
          />
        </div>
      </section>

      <section id="vs" className="py-16 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Why this beats the alternatives</h2>
            <p className="text-[#6B7280] mb-8">An honest comparison. We are not the cheapest. We are the only one that ships a working system in 4 weeks.</p>
          </ScrollReveal>
          <ComparisonTable
            columns={[
              { name: 'Dineout / Eatigo', badge: 'Failed' },
              { name: 'Petpooja CRM addon', badge: 'POS addon' },
              { name: 'Hire marketing exec', badge: '1 hire' },
              { name: 'ZippyScale', badge: 'Done-for-you', isUs: true },
            ]}
            rows={[
              {
                feature: 'IG + WA + landline unified',
                values: [
                  { check: 'no', text: 'Aggregator only' },
                  { check: 'partial', text: 'WA only' },
                  { check: 'partial', text: 'Manual juggling' },
                  { check: 'yes', text: 'All three, one inbox' },
                ],
              },
              {
                feature: 'POS-driven repeat detection',
                values: [
                  { check: 'no', text: 'Aggregator-side only' },
                  { check: 'partial', text: 'Within Petpooja' },
                  { check: 'no', text: 'Memory-based' },
                  { check: 'yes', text: 'Webhook auto-CLV' },
                ],
              },
              {
                feature: 'Zomato + Swiggy auto-recon',
                values: [
                  { check: 'no', text: 'Out of scope' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'no', text: 'Manual' },
                  { check: 'yes', text: 'Nightly variance flag' },
                ],
              },
              {
                feature: 'Birthday capture + auto-touch',
                values: [
                  { check: 'partial', text: 'Aggregator collects' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'no', text: 'They forget' },
                  { check: 'yes', text: 'POS table-note capture + WA' },
                ],
              },
              {
                feature: 'Live in 4 weeks',
                values: [
                  'Platform shutdown',
                  '4-8 weeks setup',
                  '6-month ramp',
                  { check: 'yes', text: '28 days, fixed' },
                ],
              },
              {
                feature: 'Total monthly cost',
                values: [
                  '15-20% commission',
                  '₹3K-8K + your time',
                  '₹40K-70K salary',
                  '₹16K, fully managed',
                ],
              },
              {
                feature: 'Knowledge persists if hostess leaves',
                values: [
                  { check: 'partial', text: 'Aggregator owns data' },
                  { check: 'partial', text: 'Software stays' },
                  { check: 'no', text: 'Walks out' },
                  { check: 'yes', text: 'System + SOPs + us' },
                ],
              },
            ]}
          />
        </div>
      </section>

      <section id="objections" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Objections we hear</h2>
            <p className="text-[#6B7280] mb-6">Click each to see how we handle it.</p>
          </ScrollReveal>
          <ObjectionAccordion items={content.objections} />
        </div>
      </section>

      <section id="proof" className="py-16 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">What proof looks like</h2>
            <p className="text-[#6B7280] mb-6">Workflow diagrams, sanitized screenshots, and downloadable templates.</p>
          </ScrollReveal>
          <ul className="space-y-2 text-[#4B5563] mb-8">
            {content.proofElements.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#B8CF2E] font-bold mt-0.5" aria-hidden="true">·</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="mb-12 rounded-xl border border-[#E5E7EB] bg-[#FFFDF7] p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#B8CF2E] mb-1">Want the templates?</p>
              <p className="text-sm text-[#1A1A2E]">{content.downloads.length}+ workflow blueprints, sanitized screenshots and the GHL field map land in your inbox after the free 48-hour audit.</p>
            </div>
            <a
              href="#audit-timeline"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A1A2E] text-white rounded-lg text-sm font-semibold hover:bg-[#2A2A3E] transition-colors whitespace-nowrap"
            >
              See what the audit covers →
            </a>
          </div>
          <div className="pt-8 border-t border-[#E5E7EB] grid md:grid-cols-3 gap-4 text-center">
            <div>
              <AnimatedCounter target={20} suffix="+" className="text-3xl font-bold text-[#1A1A2E]" />
              <p className="text-xs text-[#6B7280] font-mono uppercase mt-1">Indian businesses automated</p>
            </div>
            <div>
              <AnimatedCounter target={8000} suffix="+" className="text-3xl font-bold text-[#1A1A2E]" />
              <p className="text-xs text-[#6B7280] font-mono uppercase mt-1">Manual hours eliminated</p>
            </div>
            <div>
              <AnimatedCounter target={1.6} prefix="₹" suffix="Cr+" decimals={1} className="text-3xl font-bold text-[#1A1A2E]" />
              <p className="text-xs text-[#6B7280] font-mono uppercase mt-1">Saved across clients</p>
            </div>
          </div>
        </div>
      </section>

      {content.faqs && content.faqs.length > 0 && (
        <section id="faq" className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Frequently asked, honestly answered</h2>
              <p className="text-[#6B7280] mb-8">The questions every cafe owner asks before signing the audit. No fluff.</p>
            </ScrollReveal>
            <FaqAccordion items={content.faqs} />
          </div>
        </section>
      )}

      <section id="audit-timeline" className="py-16 px-4 bg-[#1A1A2E] text-white">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#D5EB4B] mb-3">
              What happens after you book
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-2">Your free audit is 48 hours, end-to-end.</h2>
            <p className="text-white/70 mb-10">No deck. No sales theatre. We map your stack, find the 3 biggest leaks, and price the sprint scope. Then you decide.</p>
          </ScrollReveal>
          <AuditTimeline
            steps={[
              {
                hour: '0',
                title: 'You book a 30-minute Zoom',
                description: 'Pick any slot on the calendar. We confirm in 60 seconds. No deck, no presales call to "qualify" you.',
              },
              {
                hour: '24',
                title: 'We map your reservation + ops + recon flow',
                description: 'Half-day at your outlet if you are in Hyderabad / Bangalore / Pune, remote walkthrough otherwise. We screenshot your IG inbox, the paper diary, the ops WhatsApp groups, your last Zomato + Swiggy CSVs.',
              },
              {
                hour: '48',
                title: 'You get the audit deliverable',
                description: 'A short PDF: the 3 biggest leaks we found, target outcomes per leak, and the exact 4-week sprint scope priced at ₹1.5L. No fluff, no upsell.',
              },
              {
                hour: '∞',
                title: 'You decide. No pressure.',
                description: 'About half the audits we run never become sprints. That is fine. The audit is genuinely useful even if you do nothing with it.',
              },
            ]}
            ctaText="Book my free 48h audit"
          />
        </div>
      </section>

      <section id="cta">
        <FinalCTA />
      </section>

      {meta.related.some(slug => registry[slug]?.title) && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-[#1A1A2E] mb-6">Related case studies</h2>
            </ScrollReveal>
            <RelatedCaseStudiesCarousel slugs={meta.related} />
          </div>
        </section>
      )}

    </CaseStudyLayout>
  )
}
