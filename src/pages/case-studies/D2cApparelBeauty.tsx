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
import { content } from './content/d2c-apparel'

const SLUG = 'd2c-apparel-beauty-retention-automation' as const
const meta = registry[SLUG]

const beforeMessages = [
  { sender: 'Meta lead', body: 'Saw your face serum ad', time: '11:14 AM' },
  { sender: 'IG DM', body: 'Sizing Q on the linen kurta?', time: '11:18 AM' },
  { sender: 'Cart abandon', body: 'Customer left ₹2,400 cart', time: '11:22 AM' },
  { sender: 'COD order', body: '₹1,899 needs confirmation call', time: '11:27 AM' },
  { sender: 'VIP', body: 'When is the next drop?', time: '11:33 AM' },
]
const afterMessages = [
  { sender: 'AI', body: '✓ Lead replied in 3 min. Brand-voice DM with serum routine + offer.', time: 'Just now' },
  { sender: 'AI', body: '✓ Cart recovered: 1-hour follow-up + 24-hr offer worked.', time: 'Just now' },
  { sender: 'AI', body: '⚠ VIP routed to founder for personal early-access ping.', time: 'Just now' },
]

export default function D2cApparelBeauty() {
  return (
    <CaseStudyLayout metadata={meta}>
      <CaseStudyHero
        variant={SLUG}
        industryBadge="Case Study · D2C"
        headline={meta.title}
        subhead="For ₹1Cr-10Cr D2C founders bottlenecked on personal DMs, abandoned carts, and ₹1.5L/mo Meta spend with no attribution."
        statBefore={meta.heroStatBefore}
        statAfter={meta.heroStatAfter}
        statLabel={meta.heroStatLabel}
        benefits={[
          'Cart recovery 12-18% via 4-step WA flow',
          'Founder DMs from 15 hrs/wk to 3',
          'Meta CAPI restores post-iOS attribution',
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
              <h2 className="text-3xl font-bold text-[#1A1A2E] mb-3">A week as the brand voice. And the bottleneck.</h2>
              <p className="text-[#4B5563] leading-relaxed mb-6">Bitespeed, Wigzo, Interakt did not stick. The founder is back to personal DMs. The carts keep abandoning.</p>
              <ul className="space-y-3 mb-6">
                {[
                  { time: 'Meta lead', label: 'Founder replies on personal WhatsApp 3-6h later.' },
                  { time: 'Cart abandon', label: 'Generic Shopify email only, no recovery.' },
                  { time: 'IG DMs', label: 'Founder personally answers (10-15h/wk).' },
                  { time: 'COD', label: 'Manual confirmation calls or RTO.' },
                  { time: 'Post-purchase', label: 'Thank-you email auto, no replenishment sequence.' },
                  { time: 'Top 500 VIPs', label: 'Founder\'s personal phone, no system.' },
                ].map((row, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-red-600 font-bold w-20 shrink-0 text-right">{row.time}</span>
                    <span className="text-[#1A1A2E]">{row.label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#1A1A2E] font-semibold leading-snug border-l-4 border-[#D5EB4B] pl-4">
                She does not need a new tool. She has tried six. She needs a stack that wires the predictable 80% (cart recovery, lead response, replenishment, VIP touch, attribution) so she stays the brand voice on the 20% that needs her.
              </p>
            </ScrollReveal>
          </div>
          <div>
            <WhatsAppChaosMockup beforeMessages={beforeMessages} afterMessages={afterMessages} profile={{ name: 'Customer Care', initials: 'CC' }} />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#FFFDF7]">
        <FeaturedQuote
          quote={content.painQuotes[0].quote}
          attribution={content.painQuotes[0].attribution}
          context="From a discovery call with a Bangalore D2C founder, March 2026"
        />
      </section>

      <section id="before" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Here's what the lifecycle looks like today</h2>
            <p className="text-[#6B7280] mb-6">The 10 manual steps a D2C founder does (or skips) every single day.</p>
          </ScrollReveal>
          <BeforeStateMap
            steps={content.beforeStateSteps}
            totalSummary={{ value: '~22 hrs/week', label: 'lost across founder DMs, manual COD calls, missing attribution work, and VIP nudges from her personal phone. Per brand. Every week.' }}
          />
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto bg-[#FFFDF7] border-l-4 border-[#D5EB4B] rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="font-semibold text-[#1A1A2E]">Want this stack for your D2C brand? Book your audit.</p>
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
                ariaLabel="Shopify orders, Meta leads, Instagram DMs, and cart abandons all flow into GHL through native integrations. AI content drafter handles brand-voice replies. Cart recovery, replenishment, and VIP sequences run from n8n. Meta CAPI restores attribution."
                nodes={[
                  { id: 'meta', label: 'Meta + IG + Shopify', sublabel: 'lead + cart + DM', x: 8, y: 50, variant: 'source' },
                  { id: 'ai', label: 'AI Drafter', sublabel: 'brand voice', x: 28, y: 50, variant: 'middle' },
                  { id: 'ghl', label: 'GHL CRM', sublabel: 'D2C lifecycle', x: 50, y: 50, variant: 'middle' },
                  { id: 'cart', label: 'Cart recovery', sublabel: '4-step WA flow', x: 72, y: 22, variant: 'middle' },
                  { id: 'replen', label: 'Replenishment', sublabel: 'per-SKU cycle', x: 72, y: 50, variant: 'middle' },
                  { id: 'capi', label: 'Meta CAPI', sublabel: 'attribution', x: 72, y: 78, variant: 'middle' },
                  { id: 'founder', label: 'Founder', sublabel: 'VIP one-tap', x: 92, y: 30, variant: 'human' },
                  { id: 'repeat', label: 'Repeat customer', sublabel: 'higher LTV · better ROAS', x: 92, y: 70, variant: 'sink' },
                ]}
                edges={[
                  { from: 'meta', to: 'ai', delay: 0 },
                  { from: 'ai', to: 'ghl', delay: 0.15 },
                  { from: 'ghl', to: 'cart', delay: 0.3 },
                  { from: 'ghl', to: 'replen', delay: 0.4 },
                  { from: 'ghl', to: 'capi', delay: 0.5 },
                  { from: 'cart', to: 'founder', delay: 0.65 },
                  { from: 'replen', to: 'repeat', delay: 0.75 },
                  { from: 'capi', to: 'repeat', delay: 0.85 },
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
                { included: true, label: 'Founder DM voice extraction (top 50 DMs)', detail: 'We extract tone, pacing, sign-off, brand vocabulary so AI drafts sound like you.' },
                { included: true, label: 'GHL sub-account + Shopify native integration', detail: 'Pipeline (9 stages), customer LTV + segments, conversation inbox.' },
                { included: true, label: 'WhatsApp Business API on founder number (or parallel brand)', detail: 'Founder picks. Either ports her existing number or runs alongside it.' },
                { included: true, label: '9 Meta-approved WhatsApp templates', detail: 'Lead ack, cart recovery 15-min / 1-hr / 24-hr / 3-day, COD confirm, replenishment, VIP early access, post-purchase, returns.' },
                { included: true, label: 'AI content drafter trained on founder voice', detail: 'CX team sends one-tap, voice goes out, founder hand stays free.' },
                { included: true, label: 'Cart recovery 4-step + replenishment by SKU', detail: 'Per-SKU cycle nudges (moisturiser 35d, hair oil 60d, perfume 90d).' },
                { included: true, label: 'Meta CAPI + attribution dashboard', detail: 'Server-side events restore post-iOS clarity. Cohort ROAS visible in Looker.' },
                { included: true, label: 'Documented SOPs + 90-min team training', detail: 'Hand-over docs your CX, marketing, ops can actually follow.' },
                { included: true, label: '30 days of hypercare after handover', detail: 'We monitor, fix, and tweak. You message us. We respond same-day.' },
              ],
            }}
            recurring={{
              price: '₹16K',
              subtitle: 'Per month, billed monthly. Cancel anytime with 30 days notice.',
              items: [
                { included: true, label: 'WhatsApp Business API hosting', detail: 'BSP costs, message conversations, template approvals.' },
                { included: true, label: 'GHL CRM seat + storage', detail: 'Full sub-account, unlimited contacts, unlimited team logins.' },
                { included: true, label: 'AI drafter + replenishment inference', detail: 'Monthly retraining as your catalogue and DM patterns evolve.' },
                { included: true, label: 'n8n workflow hosting + monitoring', detail: 'We watch the queue. We get paged when something breaks.' },
                { included: true, label: 'Email infrastructure', detail: 'Order receipts, nurture, returns notifications.' },
                { included: true, label: 'Quarterly review + performance tuning', detail: 'We pull numbers, propose tweaks, you approve.' },
                { included: false, label: 'Major customizations', detail: 'New marketplaces, new categories, deep integrations are quoted separately as mini-sprints.' },
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
              { name: 'Bitespeed / Interakt', badge: 'WABA SaaS' },
              { name: 'Klaviyo + Wigzo', badge: 'Multi-tool' },
              { name: 'Hire CX manager', badge: '1 hire' },
              { name: 'ZippyScale', badge: 'Done-for-you', isUs: true },
            ]}
            rows={[
              {
                feature: 'AI brand-voice drafter',
                values: [
                  { check: 'no', text: 'Templates only' },
                  { check: 'no', text: 'Templates only' },
                  { check: 'partial', text: 'Trained over months' },
                  { check: 'yes', text: 'Trained on your DMs Week 1' },
                ],
              },
              {
                feature: 'Cart recovery 4-step WA flow',
                values: [
                  { check: 'partial', text: 'You build it' },
                  { check: 'partial', text: 'Email-first' },
                  { check: 'partial', text: 'Manual messaging' },
                  { check: 'yes', text: 'Live in Week 2' },
                ],
              },
              {
                feature: 'Per-SKU replenishment cycle',
                values: [
                  { check: 'no', text: 'Out of scope' },
                  { check: 'partial', text: 'Manual setup per SKU' },
                  { check: 'no', text: 'They forget' },
                  { check: 'yes', text: 'Auto by SKU cycle' },
                ],
              },
              {
                feature: 'Meta CAPI + post-iOS attribution',
                values: [
                  { check: 'no', text: 'Out of scope' },
                  { check: 'partial', text: 'Klaviyo email events only' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'yes', text: 'Server-side + Looker dashboard' },
                ],
              },
              {
                feature: 'Live in 4 weeks',
                values: [
                  '2-3 months DIY',
                  '3-6 months DIY',
                  '6-month ramp',
                  { check: 'yes', text: '28 days, fixed' },
                ],
              },
              {
                feature: 'Total monthly cost',
                values: [
                  '₹5K-15K + your time',
                  '₹15K-40K combined',
                  '₹50K-90K salary',
                  '₹16K, fully managed',
                ],
              },
              {
                feature: 'Knowledge persists if CX leaves',
                values: [
                  { check: 'partial', text: 'Software stays' },
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
              <p className="text-[#6B7280] mb-8">The questions every D2C founder asks before signing the audit. No fluff.</p>
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
                title: 'We map your D2C lifecycle',
                description: 'Remote walkthrough of Shopify dashboard, Meta + IG ad accounts, founder DMs (with permission), Bitespeed or any failed tool. We screenshot every leak.',
              },
              {
                hour: '48',
                title: 'You get the audit deliverable',
                description: 'A short PDF: the 3 biggest funnel leaks we found, target outcomes per leak, and the exact 4-week sprint scope priced at ₹1.5L. No fluff, no upsell.',
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
