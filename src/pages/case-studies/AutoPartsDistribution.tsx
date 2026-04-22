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
import WhatYouGetTable from '../../components/case-studies/WhatYouGetTable'
import ComparisonTable from '../../components/case-studies/ComparisonTable'
import AuditTimeline from '../../components/case-studies/AuditTimeline'
import FinalCTA from '../../components/sections/FinalCTA'
import AnimatedCounter from '../../components/ui/AnimatedCounter'
import ScrollReveal from '../../components/ui/ScrollReveal'
import { registry } from './registry'
import { content } from './content/auto-parts'

const SLUG = 'auto-parts-distribution-order-automation' as const
const meta = registry[SLUG]

const beforeMessages = [
  { sender: 'Dealer A', body: 'Bhai 4 set MRF 175 70 R13', time: '8:14 AM' },
  { sender: 'Dealer B', body: '5 piece JK 145/80 R12 zaroor bhejna', time: '8:15 AM' },
  { sender: 'Dealer C', body: 'MRF tube 90/90 stock hai kya?', time: '8:16 AM' },
  { sender: 'Dealer D', body: 'Statement bhejo please', time: '8:17 AM' },
  { sender: 'Dealer E', body: 'Kal ka payment hua kya?', time: '8:18 AM' },
]
const afterMessages = [
  { sender: 'AI', body: '✓ Order: 4 sets MRF 175/70 R13 confirmed. Picking starts.', time: 'Just now' },
  { sender: 'AI', body: '✓ Statement PDF sent. Outstanding ₹42K.', time: 'Just now' },
  { sender: 'AI', body: '⚠ Credit limit breached: routed to sales exec.', time: 'Just now' },
]

export default function AutoPartsDistribution() {
  return (
    <CaseStudyLayout metadata={meta}>
      <CaseStudyHero
        variant={SLUG}
        industryBadge="Case Study · Manufacturing"
        headline={meta.title}
        subhead="The 4-week sprint for tyre and auto-parts distributors drowning in dealer WhatsApp groups, Excel order sheets, and overdue collections."
        statBefore={meta.heroStatBefore}
        statAfter={meta.heroStatAfter}
        statLabel={meta.heroStatLabel}
        benefits={[
          'Dealer order parsed in 60 seconds, 24/7',
          'Tally entry zero. Bridge handles draft invoices',
          'Owner sees live order book on phone',
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
              <h2 className="text-3xl font-bold text-[#1A1A2E] mb-3">A day in the life. 8 AM to month-end.</h2>
              <p className="text-[#4B5563] leading-relaxed mb-6">Sixty messages a day. Three groups. Two sales execs typing instead of selling.</p>
              <ul className="space-y-3 mb-6">
                {[
                  { time: 'Daily 8 AM', label: '60 dealer messages across 3 WhatsApp groups.' },
                  { time: '9-11 AM', label: 'Sales exec scrolls + types into Excel.' },
                  { time: 'Mid-day', label: 'Calls dealer to confirm SKU + qty + credit.' },
                  { time: '2 PM', label: 'Excel emailed to warehouse, picking starts.' },
                  { time: '4 PM', label: 'Accounts re-types into Tally for invoice.' },
                  { time: 'Month-end', label: '16 hrs reconciliation, 30%+ collections overdue.' },
                ].map((row, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-red-600 font-bold w-20 shrink-0 text-right">{row.time}</span>
                    <span className="text-[#1A1A2E]">{row.label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#1A1A2E] font-semibold leading-snug border-l-4 border-[#D5EB4B] pl-4">
                The owner does not need a new ERP. He needs the WhatsApp-to-Excel-to-Tally pipeline to disappear so his sales execs sell instead of type.
              </p>
            </ScrollReveal>
          </div>
          <div>
            <WhatsAppChaosMockup beforeMessages={beforeMessages} afterMessages={afterMessages} />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#FFFDF7]">
        <FeaturedQuote
          quote={content.painQuotes[0].quote}
          attribution={content.painQuotes[0].attribution}
          context="From a discovery call with a Vijayawada distributor, March 2026"
        />
      </section>

      <section id="before" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Here's what the day looks like today</h2>
            <p className="text-[#6B7280] mb-6">The 10 manual steps a distributor team does (or skips) every single day.</p>
          </ScrollReveal>
          <BeforeStateMap
            steps={content.beforeStateSteps}
            totalSummary={{ value: '~28 hrs/week', label: 'lost to manual order entry, Tally re-typing, collections chase, and reconciliation. Per distributor. Every week.' }}
          />
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto bg-[#FFFDF7] border-l-4 border-[#D5EB4B] rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="font-semibold text-[#1A1A2E]">Want this stack for your distribution business? Book your audit.</p>
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
            <p className="text-[#6B7280] mb-6">Seven tools, one workflow. Watch the data move.</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="mb-10">
              <StackArchitectureDiagram
                ariaLabel="A dealer message on WhatsApp flows through the AI parser into GHL pipeline, which pushes a draft invoice to Tally via the n8n bridge. Razorpay collects via UPI, credit-control auto-blocks if needed, and the owner sees the live order book on a Looker dashboard."
                nodes={[
                  { id: 'dealer', label: 'Dealer', sublabel: 'WhatsApp', x: 8, y: 50, variant: 'source' },
                  { id: 'ai', label: 'AI Parser', sublabel: 'voice + text + photo', x: 28, y: 50, variant: 'middle' },
                  { id: 'ghl', label: 'GHL Pipeline', sublabel: '7 stages', x: 50, y: 50, variant: 'middle' },
                  { id: 'tally', label: 'Tally bridge', sublabel: 'n8n + ODBC', x: 72, y: 22, variant: 'middle' },
                  { id: 'credit', label: 'Credit-control', sublabel: 'auto-block', x: 72, y: 50, variant: 'middle' },
                  { id: 'upi', label: 'Razorpay UPI', sublabel: 'collect + receipt', x: 72, y: 78, variant: 'middle' },
                  { id: 'owner', label: 'Owner', sublabel: 'Looker on phone', x: 92, y: 30, variant: 'human' },
                  { id: 'paid', label: 'Order paid', sublabel: 'invoiced · dispatched · settled', x: 92, y: 70, variant: 'sink' },
                ]}
                edges={[
                  { from: 'dealer', to: 'ai', delay: 0 },
                  { from: 'ai', to: 'ghl', delay: 0.15 },
                  { from: 'ghl', to: 'tally', delay: 0.3 },
                  { from: 'ghl', to: 'credit', delay: 0.4 },
                  { from: 'ghl', to: 'upi', delay: 0.5 },
                  { from: 'tally', to: 'owner', delay: 0.65 },
                  { from: 'upi', to: 'paid', delay: 0.75 },
                  { from: 'credit', to: 'paid', delay: 0.85 },
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
                { included: true, label: 'Half-day shadow at sales + accounts desk', detail: 'We sit at your sales exec\'s desk for half a day. Map every WhatsApp, every Excel, every Tally entry.' },
                { included: true, label: 'GHL sub-account fully configured', detail: 'Pipeline (7 stages), custom fields, dealer master with credit limits, conversation inbox.' },
                { included: true, label: 'WhatsApp Business API on dealer-facing number', detail: 'Replaces 3 broadcast groups with 1-to-1 dealer conversations. Dealers see no change.' },
                { included: true, label: '9 Meta-approved WhatsApp templates', detail: 'Order ack, SKU-confirm, dispatched, payment receipt, credit-block, statement, festival promo, new-stock, monthly outstanding.' },
                { included: true, label: 'AI parser trained on your top 200 SKUs', detail: 'Reads voice notes, text, photos. Maps to your exact Tally SKU code. <1% wrong-SKU rate.' },
                { included: true, label: 'Tally bridge via n8n + ODBC', detail: 'Confirmed orders push as draft sales invoices. Outstanding sync nightly. Accountant approves in his existing screen.' },
                { included: true, label: 'Auto credit-control + UPI collect', detail: 'Razorpay dynamic QR per invoice. Cuts D+5/10/20 chase calls to one D+3 auto-reminder.' },
                { included: true, label: 'Documented SOPs + 90-min team training', detail: 'Hand-over docs your sales exec, accountant, and warehouse can actually follow.' },
                { included: true, label: '30 days of hypercare after handover', detail: 'We monitor, fix, and tweak. You message us. We respond same-day.' },
              ],
            }}
            recurring={{
              price: '₹16K',
              subtitle: 'Per month, billed monthly. Cancel anytime with 30 days notice.',
              items: [
                { included: true, label: 'WhatsApp Business API hosting', detail: 'BSP costs, message conversations, template approvals.' },
                { included: true, label: 'GHL CRM seat + storage', detail: 'Full sub-account, unlimited contacts, unlimited team logins.' },
                { included: true, label: 'AI parser inference + tuning', detail: 'Monthly retraining as your SKU range expands.' },
                { included: true, label: 'n8n workflow hosting + monitoring', detail: 'We watch the queue. We get paged when something breaks.' },
                { included: true, label: 'Email infrastructure', detail: 'Dealer receipts, monthly statements, escalations.' },
                { included: true, label: 'Quarterly review + performance tuning', detail: 'We pull numbers, propose tweaks, you approve.' },
                { included: false, label: 'Major customizations', detail: 'New product lines, new branches, deep integrations are quoted separately as mini-sprints.' },
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
              { name: 'Vyapar', badge: 'Mobile billing' },
              { name: 'Bitespeed / Interakt', badge: 'WABA SaaS' },
              { name: 'Hire 2 sales execs', badge: '2 hires' },
              { name: 'ZippyScale', badge: 'Done-for-you', isUs: true },
            ]}
            rows={[
              {
                feature: 'AI dealer-message parsing',
                values: [
                  { check: 'no', text: 'Manual entry only' },
                  { check: 'partial', text: 'Templates only' },
                  { check: 'partial', text: 'Manual, prone to error' },
                  { check: 'yes', text: 'Voice + text + photo' },
                ],
              },
              {
                feature: 'Tally bridge (no double entry)',
                values: [
                  { check: 'no', text: 'Tally not in scope' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'no', text: 'Manual re-entry' },
                  { check: 'yes', text: 'n8n + ODBC included' },
                ],
              },
              {
                feature: 'Auto credit-control',
                values: [
                  { check: 'partial', text: 'Manual block' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'partial', text: 'They forget under pressure' },
                  { check: 'yes', text: 'Real-time, auto-block + WA' },
                ],
              },
              {
                feature: 'UPI auto-collect',
                values: [
                  { check: 'partial', text: 'Manual link' },
                  { check: 'partial', text: 'You build flow' },
                  { check: 'no', text: 'Manual chase calls' },
                  { check: 'yes', text: 'Razorpay QR per invoice' },
                ],
              },
              {
                feature: 'Live in 4 weeks',
                values: [
                  '4-8 weeks setup',
                  '2-3 months DIY',
                  '6-month ramp',
                  { check: 'yes', text: '28 days, fixed' },
                ],
              },
              {
                feature: 'Total monthly cost',
                values: [
                  '₹3K-7K + your time',
                  '₹5K-15K + your time',
                  '₹40K-60K combined salary',
                  '₹16K, fully managed',
                ],
              },
              {
                feature: 'Knowledge persists if exec leaves',
                values: [
                  { check: 'partial', text: 'Software stays' },
                  { check: 'partial', text: 'Software stays' },
                  { check: 'no', text: 'Walks out the door' },
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
          <div className="mb-12">
            <p className="text-xs font-mono uppercase tracking-wider text-[#6B7280] mb-3">Downloadable templates · coming soon</p>
            <div className="flex flex-wrap gap-3">
              {content.downloads.map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-dashed border-[#E5E7EB] text-sm opacity-60 cursor-not-allowed"
                  aria-disabled="true"
                  title="Available in next release"
                >
                  <span className="font-mono text-xs text-[#6B7280] uppercase">.{d.filetype}</span>
                  <span className="text-[#6B7280] font-semibold">{d.label}</span>
                </span>
              ))}
            </div>
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
              <p className="text-[#6B7280] mb-8">The questions every distributor owner asks before signing the audit. No fluff.</p>
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
                title: 'We map your current process',
                description: 'Half-day shadow at your office if you are in Hyderabad / Vijayawada, remote walkthrough otherwise. We screenshot all 3 dealer WhatsApp groups, your Excel master sheet, your Tally exports.',
              },
              {
                hour: '48',
                title: 'You get the audit deliverable',
                description: 'A short PDF: the 3 biggest workflow leaks we found, target outcomes per leak, and the exact 4-week sprint scope priced at ₹1.5L. No fluff, no upsell.',
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
