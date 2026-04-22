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
import { content } from './content/professional-services'

const SLUG = 'professional-services-lead-to-cash' as const
const meta = registry[SLUG]

const beforeMessages = [
  { sender: 'LinkedIn lead', body: 'Need help with ESG compliance', time: '9:14 AM' },
  { sender: 'Email RFQ', body: 'Tax restructuring for FY26', time: '9:18 AM' },
  { sender: 'WA referral', body: 'Friend recommended you for branding', time: '9:22 AM' },
  { sender: 'Existing client', body: 'Where is the Friday status?', time: '9:30 AM' },
  { sender: 'D+45 dunning', body: '2 invoices overdue, action?', time: '9:42 AM' },
]
const afterMessages = [
  { sender: 'AI', body: '✓ Lead qualified, brief captured, proposal drafted to partner.', time: 'Just now' },
  { sender: 'AI', body: '✓ Friday status digest auto-generated. Awaiting partner approval.', time: 'Just now' },
  { sender: 'AI', body: '⚠ D+20 dunning sequence triggered for the 2 invoices.', time: 'Just now' },
]

export default function ProfessionalServices() {
  return (
    <CaseStudyLayout metadata={meta}>
      <CaseStudyHero
        variant={SLUG}
        industryBadge="Case Study · Services"
        headline={meta.title}
        subhead="For 10-20 person consulting, tax, legal, branding, ESG, and engineering advisory firms where the senior partner IS the bottleneck."
        statBefore={meta.heroStatBefore}
        statAfter={meta.heroStatAfter}
        statLabel={meta.heroStatLabel}
        benefits={[
          'AI proposal drafter cuts a week to a day',
          'DSO drops from 60+ days to under 35',
          'Pipeline visible Monday 9 AM, not Friday',
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
              <h2 className="text-3xl font-bold text-[#1A1A2E] mb-3">A week as a senior partner. Bottleneck on every deal.</h2>
              <p className="text-[#4B5563] leading-relaxed mb-6">Lead in email. Proposal in Word. Invoice in Excel. Dunning by phone. Every workflow runs through your head.</p>
              <ul className="space-y-3 mb-6">
                {[
                  { time: 'Monday', label: 'Lead lands across email/LinkedIn/WA, no central inbox.' },
                  { time: 'Scoping', label: '3-4 days pulling old proposals, rewriting.' },
                  { time: 'Proposal', label: 'Built from scratch in Excel/Word every time.' },
                  { time: 'Won deal', label: '90 min manual project setup.' },
                  { time: 'Invoicing', label: 'Monthly batch in Zoho, partner reviews each.' },
                  { time: 'Dunning', label: 'D+15/30/45 calls, 1 always skipped.' },
                ].map((row, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-red-600 font-bold w-20 shrink-0 text-right">{row.time}</span>
                    <span className="text-[#1A1A2E]">{row.label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#1A1A2E] font-semibold leading-snug border-l-4 border-[#D5EB4B] pl-4">
                The owner-partner does not want a CRM that demands data entry. She wants the predictable 80% (lead capture, proposal drafting, invoice + dunning, project kickoff, client status) handled so partners stay senior on the 20% that needs them.
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
          context="From a discovery call with a Bangalore advisory partner, March 2026"
        />
      </section>

      <section id="before" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Here's what the partner's week looks like today</h2>
            <p className="text-[#6B7280] mb-6">The 10 manual steps a partnership does (or skips) every single week.</p>
          </ScrollReveal>
          <BeforeStateMap
            steps={content.beforeStateSteps}
            totalSummary={{ value: '~24 hrs/week', label: 'lost across the partnership to scoping, proposal building, invoice review, dunning, and Friday status writing. Per firm. Every week.' }}
          />
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto bg-[#FFFDF7] border-l-4 border-[#D5EB4B] rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="font-semibold text-[#1A1A2E]">Want this stack for your firm? Book your audit.</p>
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
                ariaLabel="Email, LinkedIn, and WhatsApp inbound flow into the unified GHL inbox. AI proposal drafter generates Google Docs from service-line templates. Razorpay + Zoho Books handle invoicing and dunning. Won deals auto-provision project kickoff."
                nodes={[
                  { id: 'lead', label: 'Email + LI + WA', sublabel: 'lead', x: 8, y: 50, variant: 'source' },
                  { id: 'inbox', label: 'Unified inbox', sublabel: 'GHL + Unipile', x: 28, y: 50, variant: 'middle' },
                  { id: 'ghl', label: 'GHL CRM', sublabel: '10-stage pipeline', x: 50, y: 50, variant: 'middle' },
                  { id: 'ai', label: 'AI proposal', sublabel: 'service templates', x: 72, y: 22, variant: 'middle' },
                  { id: 'invoice', label: 'Invoice + dunning', sublabel: 'Razorpay + Zoho', x: 72, y: 50, variant: 'middle' },
                  { id: 'kickoff', label: 'Auto kickoff', sublabel: 'Drive + Slack + Notion', x: 72, y: 78, variant: 'middle' },
                  { id: 'partner', label: 'Partner', sublabel: 'Mon 9 AM brief', x: 92, y: 30, variant: 'human' },
                  { id: 'closed', label: 'Engagement won', sublabel: 'paid · delivered · referred', x: 92, y: 70, variant: 'sink' },
                ]}
                edges={[
                  { from: 'lead', to: 'inbox', delay: 0 },
                  { from: 'inbox', to: 'ghl', delay: 0.15 },
                  { from: 'ghl', to: 'ai', delay: 0.3 },
                  { from: 'ghl', to: 'invoice', delay: 0.4 },
                  { from: 'ghl', to: 'kickoff', delay: 0.5 },
                  { from: 'ai', to: 'partner', delay: 0.65 },
                  { from: 'kickoff', to: 'closed', delay: 0.75 },
                  { from: 'invoice', to: 'closed', delay: 0.85 },
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
                { included: true, label: 'Half-day shadow with senior partner + associate', detail: 'We sit through your morning inbox, scoping call, and a kickoff. Map every leak.' },
                { included: true, label: 'GHL sub-account fully configured', detail: 'Pipeline (10 stages), service-line templates, conversation inbox, partner-wise routing.' },
                { included: true, label: 'Unified inbox: email + WhatsApp + LinkedIn', detail: 'Gmail/Outlook OAuth + WABA + LinkedIn via Unipile. Single inbox for partners and associates.' },
                { included: true, label: '8 WhatsApp + 6 email templates approved', detail: 'Lead ack, proposal sent, kickoff, status digest, invoice, dunning D+3/D+10/D+20, closing.' },
                { included: true, label: 'AI proposal drafter trained on top 6-10 service-line templates', detail: 'Reads brief, pulls template, applies fee matrix, drafts Google Doc in 30 minutes.' },
                { included: true, label: 'Razorpay + Zoho Books bridge with auto-dunning', detail: 'Auto-invoices from won deal terms. D+3, D+10, D+20 dunning under partner signature.' },
                { included: true, label: 'Project kickoff auto-provision', detail: 'Won deal triggers Drive + Slack/Notion + kickoff email. 90 min becomes 8 min.' },
                { included: true, label: 'Documented SOPs + 90-min team training', detail: 'Hand-over docs partners + associates + ops can actually follow.' },
                { included: true, label: '30 days of hypercare after handover', detail: 'We monitor, fix, and tweak. You message us. We respond same-day.' },
              ],
            }}
            recurring={{
              price: '₹16K',
              subtitle: 'Per month, billed monthly. Cancel anytime with 30 days notice.',
              items: [
                { included: true, label: 'WhatsApp Business API hosting', detail: 'BSP costs, message conversations, template approvals.' },
                { included: true, label: 'GHL CRM seat + storage + Unipile LinkedIn', detail: 'Full sub-account, unlimited contacts, unlimited team logins.' },
                { included: true, label: 'AI proposal drafter inference + tuning', detail: 'Monthly retraining as your service-line templates evolve.' },
                { included: true, label: 'n8n + kickoff automation hosting + monitoring', detail: 'We watch the queue. We get paged when something breaks.' },
                { included: true, label: 'Email infrastructure', detail: 'Client status, invoice, dunning, kickoff comms.' },
                { included: true, label: 'Quarterly review + performance tuning', detail: 'We pull numbers, propose tweaks, you approve.' },
                { included: false, label: 'Major customizations', detail: 'New service lines, new offices, deep integrations are quoted separately as mini-sprints.' },
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
              { name: 'Zoho One', badge: '₹1.5L/yr' },
              { name: 'HubSpot Pro', badge: 'CRM' },
              { name: 'Hire ops manager', badge: '1 hire' },
              { name: 'ZippyScale', badge: 'Done-for-you', isUs: true },
            ]}
            rows={[
              {
                feature: 'AI proposal drafter on your templates',
                values: [
                  { check: 'no', text: 'Manual' },
                  { check: 'no', text: 'Manual' },
                  { check: 'partial', text: 'They learn over months' },
                  { check: 'yes', text: 'Trained Week 1' },
                ],
              },
              {
                feature: 'Unified email + LinkedIn + WA inbox',
                values: [
                  { check: 'partial', text: 'Email + WA, no LI' },
                  { check: 'partial', text: 'Email only' },
                  { check: 'no', text: 'Manual' },
                  { check: 'yes', text: 'All three, Unipile' },
                ],
              },
              {
                feature: 'Auto-dunning under partner signature',
                values: [
                  { check: 'partial', text: 'You build flow' },
                  { check: 'partial', text: 'You build flow' },
                  { check: 'partial', text: 'They forget D+15' },
                  { check: 'yes', text: 'D+3/D+10/D+20 auto' },
                ],
              },
              {
                feature: 'Project kickoff auto-provision',
                values: [
                  { check: 'no', text: 'Out of scope' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'partial', text: 'They do it' },
                  { check: 'yes', text: 'Drive + Slack + Notion in 8 min' },
                ],
              },
              {
                feature: 'Live in 4 weeks',
                values: [
                  '3-6 months DIY',
                  '2-3 months DIY',
                  '6-month ramp',
                  { check: 'yes', text: '28 days, fixed' },
                ],
              },
              {
                feature: 'Total monthly cost',
                values: [
                  '₹12K + your time',
                  '₹40K-80K + your time',
                  '₹50K-90K salary',
                  '₹16K, fully managed',
                ],
              },
              {
                feature: 'Knowledge persists if ops leaves',
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
              <p className="text-[#6B7280] mb-8">The questions every partner asks before signing the audit. No fluff.</p>
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
                title: 'We map your lead-to-cash flow',
                description: 'Walkthrough of senior partner inbox, last 3 proposals, last 3 invoices, current dunning practice. We screenshot every leak with permission.',
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
