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
import { content } from './content/corporate-travel'

const SLUG = 'corporate-travel-quotes-reconciliation' as const
const meta = registry[SLUG]

const beforeMessages = [
  { sender: 'Pharma corp', body: 'RFQ: 4 execs Hyd-Mum-Bglr', time: '9:14 AM' },
  { sender: 'Same RFQ', body: 'Sales agent A reply: ₹86K', time: '9:42 AM' },
  { sender: 'Same RFQ', body: 'Sales agent B reply: ₹91K', time: '10:08 AM' },
  { sender: 'Manufacturing', body: 'Following up on quote #4471', time: '11:18 AM' },
  { sender: 'Founder', body: 'P&L for last month please', time: '12:30 PM' },
]
const afterMessages = [
  { sender: 'AI', body: '✓ RFQ auto-assigned to Agent A. Lock in place. Quote drafted in 5 min.', time: 'Just now' },
  { sender: 'AI', body: '✓ Per-account P&L: ₹14.2L revenue, ₹2.1L margin, day 2 closed.', time: 'Just now' },
  { sender: 'AI', body: '⚠ Vendor rebate window closing in 7 days for IndiGo Q1.', time: 'Just now' },
]

export default function CorporateTravel() {
  return (
    <CaseStudyLayout metadata={meta}>
      <CaseStudyHero
        variant={SLUG}
        industryBadge="Case Study · Travel"
        headline={meta.title}
        subhead="For Hyderabad and Bangalore corporate travel agencies bleeding deals to faster competitors and losing 8 days a month to vendor reconciliation."
        statBefore={meta.heroStatBefore}
        statAfter={meta.heroStatAfter}
        statLabel={meta.heroStatLabel}
        benefits={[
          'RFQ auto-assigned, never quoted twice',
          'Quote PDF drafted in 5 min, sent in 4 hours',
          'Vendor rebates auto-claimed, never missed',
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
              <h2 className="text-3xl font-bold text-[#1A1A2E] mb-3">A month from RFQ to P&L. Day 1 to day 8.</h2>
              <p className="text-[#4B5563] leading-relaxed mb-6">Shared inbox, no routing. Two agents quote the same RFQ. P&L arrives a week late. Rebates expire unclaimed.</p>
              <ul className="space-y-3 mb-6">
                {[
                  { time: 'Mon 9 AM', label: '87 unread bookings@, 3 agents replying separately.' },
                  { time: 'Same RFQ', label: 'Two quotes go out, client wobbles.' },
                  { time: 'Per quote', label: '30 min: GDS + hotel + margin + Word + send.' },
                  { time: 'Month-end', label: '4h vendor portals + 8h Tally rec + 12h P&L.' },
                  { time: 'Fridays', label: '90 min upstream airline-partner reporting.' },
                  { time: 'Rebates', label: 'Nobody chases them, ₹40K/quarter unclaimed.' },
                ].map((row, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-red-600 font-bold w-20 shrink-0 text-right">{row.time}</span>
                    <span className="text-[#1A1A2E]">{row.label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#1A1A2E] font-semibold leading-snug border-l-4 border-[#D5EB4B] pl-4">
                The founder does not need a Travelopro CRM. He needs the predictable 80% (RFQ assignment, quote PDF generation, Tally bridge, vendor invoice scraping, P&L automation) handled.
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
          context="From a discovery call with a Hyderabad travel agency founder, March 2026"
        />
      </section>

      <section id="before" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Here's what the agent's day looks like today</h2>
            <p className="text-[#6B7280] mb-6">The 10 manual steps a corporate travel team does (or skips) every single week.</p>
          </ScrollReveal>
          <BeforeStateMap
            steps={content.beforeStateSteps}
            totalSummary={{ value: '~30 hrs/week', label: 'lost across agents and accounts to RFQ chaos, manual quoting, vendor portal scraping, Tally rec, and Friday partner reports. Per agency. Every week.' }}
          />
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto bg-[#FFFDF7] border-l-4 border-[#D5EB4B] rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="font-semibold text-[#1A1A2E]">Want this stack for your travel agency? Book your audit.</p>
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
                ariaLabel="Shared bookings@ inbox is auto-parsed by n8n IMAP, RFQs round-robin to agents, AI drafts a branded quote PDF in 5 minutes. Tally bridge nightly. Vendor portal scrapers pull invoices and rebate data. Per-account P&L visible day 2."
                nodes={[
                  { id: 'corp', label: 'Corporate', sublabel: 'bookings@ inbox', x: 8, y: 50, variant: 'source' },
                  { id: 'parser', label: 'IMAP parser', sublabel: 'n8n round-robin', x: 28, y: 50, variant: 'middle' },
                  { id: 'ghl', label: 'GHL pipeline', sublabel: '9-stage RFQ', x: 50, y: 50, variant: 'middle' },
                  { id: 'ai', label: 'AI quote', sublabel: 'GDS + hotel API', x: 72, y: 22, variant: 'middle' },
                  { id: 'tally', label: 'Tally bridge', sublabel: 'ODBC nightly', x: 72, y: 50, variant: 'middle' },
                  { id: 'vendor', label: 'Vendor scrapers', sublabel: 'Playwright', x: 72, y: 78, variant: 'middle' },
                  { id: 'founder', label: 'Founder', sublabel: 'Mon 9 AM digest', x: 92, y: 30, variant: 'human' },
                  { id: 'closed', label: 'Booked + paid', sublabel: 'P&L day 2 · rebate claimed', x: 92, y: 70, variant: 'sink' },
                ]}
                edges={[
                  { from: 'corp', to: 'parser', delay: 0 },
                  { from: 'parser', to: 'ghl', delay: 0.15 },
                  { from: 'ghl', to: 'ai', delay: 0.3 },
                  { from: 'ghl', to: 'tally', delay: 0.4 },
                  { from: 'ghl', to: 'vendor', delay: 0.5 },
                  { from: 'ai', to: 'founder', delay: 0.65 },
                  { from: 'vendor', to: 'closed', delay: 0.75 },
                  { from: 'tally', to: 'closed', delay: 0.85 },
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
                { included: true, label: 'Half-day shadow at agent + accountant desk', detail: 'We sit through a Monday morning rush, an RFQ-to-quote, a vendor portal scrape, a month-end recon.' },
                { included: true, label: 'GHL sub-account fully configured', detail: 'Pipeline (9 stages), corporate account master with rate cards, conversation inbox.' },
                { included: true, label: 'WhatsApp Business API on agency number', detail: 'For corporate-admin direct chat. Replaces phone-tag with traceable WA conversations.' },
                { included: true, label: '8 Meta-approved WhatsApp templates', detail: 'RFQ ack, quote-ready, ticketed, travelled, invoiced, payment receipt, rebate claim, monthly P&L.' },
                { included: true, label: 'AI quote drafter with GDS + hotel APIs', detail: 'Reads RFQ, queries GDS + hotel partners, applies margin matrix. 36-hour quote becomes 4 hours.' },
                { included: true, label: 'Branded Puppeteer-rendered quote PDF', detail: 'Versioned in GHL, sent via WABA. Replaces Word + email attachment workflow.' },
                { included: true, label: 'Tally bridge + vendor portal scrapers', detail: 'n8n + ODBC nightly. Playwright scrapers for IndiGo, Vistara, Marriott, Accor invoices + rebates.' },
                { included: true, label: 'Documented SOPs + 90-min team training', detail: 'Hand-over docs agents + accountant + founder can actually follow.' },
                { included: true, label: '30 days of hypercare after handover', detail: 'We monitor, fix, and tweak. You message us. We respond same-day.' },
              ],
            }}
            recurring={{
              price: '₹16K',
              subtitle: 'Per month, billed monthly. Cancel anytime with 30 days notice.',
              items: [
                { included: true, label: 'WhatsApp Business API hosting', detail: 'BSP costs, message conversations, template approvals.' },
                { included: true, label: 'GHL CRM seat + storage', detail: 'Full sub-account, unlimited contacts, unlimited team logins.' },
                { included: true, label: 'AI quote drafter inference + tuning', detail: 'Monthly retraining as your corporate base and rate cards evolve.' },
                { included: true, label: 'n8n + vendor scraper hosting + monitoring', detail: 'We watch the queue. We get paged when something breaks.' },
                { included: true, label: 'Email infrastructure', detail: 'Quote PDFs, invoices, rebate notifications, P&L summaries.' },
                { included: true, label: 'Quarterly review + performance tuning', detail: 'We pull numbers, propose tweaks, you approve.' },
                { included: false, label: 'Major customizations', detail: 'New GDS, new vendor portals, new offices, deep integrations are quoted separately as mini-sprints.' },
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
              { name: 'Travelopro CRM', badge: 'Sector CRM' },
              { name: 'Bitespeed / Interakt', badge: 'WABA SaaS' },
              { name: 'Hire CRM ops lead', badge: '1 hire' },
              { name: 'ZippyScale', badge: 'Done-for-you', isUs: true },
            ]}
            rows={[
              {
                feature: 'AI quote drafter (GDS + hotel)',
                values: [
                  { check: 'no', text: 'Manual quoting' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'partial', text: 'They build over time' },
                  { check: 'yes', text: '5-min draft, 4-hr send' },
                ],
              },
              {
                feature: 'Auto-RFQ assignment + lock',
                values: [
                  { check: 'partial', text: 'Manual assignment' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'partial', text: 'They route manually' },
                  { check: 'yes', text: 'n8n round-robin lock' },
                ],
              },
              {
                feature: 'Vendor portal auto-scrape',
                values: [
                  { check: 'no', text: 'Out of scope' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'partial', text: 'They do it manually' },
                  { check: 'yes', text: 'Playwright nightly' },
                ],
              },
              {
                feature: 'Per-account P&L day 2',
                values: [
                  { check: 'partial', text: 'Within Travelopro' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'partial', text: 'Pivot tables' },
                  { check: 'yes', text: 'Daily auto-roll-up' },
                ],
              },
              {
                feature: 'Live in 4 weeks',
                values: [
                  '6-12 weeks setup',
                  '2-3 months DIY',
                  '6-month ramp',
                  { check: 'yes', text: '28 days, fixed' },
                ],
              },
              {
                feature: 'Total monthly cost',
                values: [
                  '₹15K-30K + your time',
                  '₹5K-15K + your time',
                  '₹50K-90K salary',
                  '₹16K, fully managed',
                ],
              },
              {
                feature: 'Knowledge persists if agent leaves',
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
              <p className="text-[#6B7280] mb-8">The questions every agency founder asks before signing the audit. No fluff.</p>
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
                title: 'We map your RFQ-to-P&L flow',
                description: 'Walkthrough of the shared bookings@ inbox, your last 5 quotes, your last month-end Tally + vendor portal sequence. We screenshot every leak with permission.',
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
