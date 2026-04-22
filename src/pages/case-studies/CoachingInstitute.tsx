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
import { content } from './content/coaching-institute'

const SLUG = 'coaching-institute-admission-to-enrollment' as const
const meta = registry[SLUG]

const beforeMessages = [
  { sender: 'Parent A', body: 'NEET fee for class 12?', time: '9:14 AM' },
  { sender: 'Parent B', body: 'Demo class Saturday available?', time: '9:15 AM' },
  { sender: 'Parent C', body: 'JEE batch timing options?', time: '9:16 AM' },
  { sender: 'Parent D', body: 'Counsellor not picking up call', time: '9:17 AM' },
  { sender: 'Parent E', body: 'Need to reschedule Saturday demo', time: '9:18 AM' },
]
const afterMessages = [
  { sender: 'AI', body: '✓ NEET 12th: ₹1.2L total, 3 instalments. Brochure sent.', time: 'Just now' },
  { sender: 'AI', body: '✓ Demo confirmed Sat 11 AM. Counsellor Priya assigned.', time: 'Just now' },
  { sender: 'AI', body: '⚠ Routed to senior counsellor: scholarship ask detected.', time: 'Just now' },
]

export default function CoachingInstitute() {
  return (
    <CaseStudyLayout metadata={meta}>
      <CaseStudyHero
        variant={SLUG}
        industryBadge="Case Study · Education"
        headline={meta.title}
        subhead="The 4-week stack for 480-seat coaching institutes drowning in admission inquiries across counsellor numbers."
        statBefore={meta.heroStatBefore}
        statAfter={meta.heroStatAfter}
        statLabel={meta.heroStatLabel}
        benefits={[
          'Lead reply in 30 seconds, 24/7',
          'Demo no-show under 15% via dual reminder',
          'Owner sees pipeline live, not on Friday',
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
              <h2 className="text-3xl font-bold text-[#1A1A2E] mb-3">A week in admissions. Monday to Sunday.</h2>
              <p className="text-[#4B5563] leading-relaxed mb-6">Five counsellors, no routing. The leads slip while everyone is busy with someone else.</p>
              <ul className="space-y-3 mb-6">
                {[
                  { time: 'Mon 9 AM', label: 'Meta ads firing, leads land in 5 different counsellor WhatsApps.' },
                  { time: '10:42 AM', label: 'Counsellor offline, lead waited 40 min, parent moved to competitor.' },
                  { time: 'Wed', label: 'Demo class booked but counsellor on leave, parent ghosts.' },
                  { time: 'Friday', label: 'Fee instalment reminder forgotten, dropout starts brewing.' },
                  { time: 'Month 3', label: 'Parent complaint about absence (no attendance system caught it).' },
                  { time: '30-50%', label: 'of inquiries die in the first-touch gap.' },
                ].map((row, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-red-600 font-bold w-20 shrink-0 text-right">{row.time}</span>
                    <span className="text-[#1A1A2E]">{row.label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[#1A1A2E] font-semibold leading-snug border-l-4 border-[#D5EB4B] pl-4">
                The owner does not need a new LMS. He needs the predictable 80% (lead routing, demo confirmation, fee dunning, attendance alerts, parent communication) handled so counsellors focus on the 20% that actually converts.
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
          context="From a discovery call with a Hyderabad coaching founder, March 2026"
        />
      </section>

      <section id="before" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Here's what the funnel looks like today</h2>
            <p className="text-[#6B7280] mb-6">The 10 manual steps an institute owner does (or skips) every single day.</p>
          </ScrollReveal>
          <BeforeStateMap
            steps={content.beforeStateSteps}
            totalSummary={{ value: '~30 hrs/week', label: 'lost across 5 counsellors to manual routing, follow-ups, fee chases, and parent comms. Per institute. Every week.' }}
          />
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto bg-[#FFFDF7] border-l-4 border-[#D5EB4B] rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="font-semibold text-[#1A1A2E]">Want this stack for your institute? Book your audit.</p>
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
                ariaLabel="A new lead from Meta or Google ads flows through the AI counsellor on WhatsApp into GHL CRM, which routes the parent to the right counsellor. Demo booking, fee dunning, attendance alerts, and the parent weekly digest all run from n8n with the owner's daily 9 AM digest as the single screen."
                nodes={[
                  { id: 'lead', label: 'Parent', sublabel: 'WhatsApp', x: 8, y: 50, variant: 'source' },
                  { id: 'ai', label: 'AI Counsellor', sublabel: '<30 sec', x: 28, y: 50, variant: 'middle' },
                  { id: 'ghl', label: 'GHL CRM', sublabel: 'pipeline + routing', x: 50, y: 50, variant: 'middle' },
                  { id: 'razorpay', label: 'Razorpay', sublabel: 'fee instalments', x: 72, y: 22, variant: 'middle' },
                  { id: 'batch', label: 'Batch matcher', sublabel: 'demo booking', x: 72, y: 50, variant: 'middle' },
                  { id: 'attendance', label: 'Attendance bot', sublabel: 'dropout alert', x: 72, y: 78, variant: 'middle' },
                  { id: 'owner', label: 'Owner', sublabel: '9 AM digest', x: 92, y: 30, variant: 'human' },
                  { id: 'enrolled', label: 'Enrolled', sublabel: 'fee paid · demo done · attending', x: 92, y: 70, variant: 'sink' },
                ]}
                edges={[
                  { from: 'lead', to: 'ai', delay: 0 },
                  { from: 'ai', to: 'ghl', delay: 0.15 },
                  { from: 'ghl', to: 'razorpay', delay: 0.3 },
                  { from: 'ghl', to: 'batch', delay: 0.4 },
                  { from: 'ghl', to: 'attendance', delay: 0.5 },
                  { from: 'batch', to: 'owner', delay: 0.65 },
                  { from: 'attendance', to: 'enrolled', delay: 0.75 },
                  { from: 'razorpay', to: 'enrolled', delay: 0.85 },
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
                { included: true, label: 'Half-day institute shadow + counsellor ride-along', detail: 'We sit at your admission desk for half a day. Map every WhatsApp, every demo booking, every fee chase.' },
                { included: true, label: 'GHL sub-account fully configured', detail: 'Pipeline (9 stages), custom fields, batch matcher rules, conversation inbox.' },
                { included: true, label: 'WhatsApp Business API on a single inbound number', detail: 'Port your 5 counsellor numbers behind smart routing. Parents see the same counsellor by name.' },
                { included: true, label: '9 Meta-approved WhatsApp templates', detail: 'Lead ack, demo confirm, T-24h, T-2h, fee instalment reminder, attendance alert, parent weekly digest, lapsed reactivation, payment receipt.' },
                { included: true, label: 'AI counsellor trained on your top 50 parent FAQs', detail: 'Qualifies in 30 seconds, hands off to your counsellor on price negotiation, scholarship, or objection.' },
                { included: true, label: 'Razorpay subscription + auto-instalment dunning', detail: 'Fee instalment links, D-3 reminder, D+1 escalation. Cuts D+15 collections from 30% to under 8%.' },
                { included: true, label: 'Attendance bot + dropout alert workflow', detail: 'Faculty marks via WhatsApp. 3 absences in 10 days triggers parent + counsellor alert same-day.' },
                { included: true, label: 'Documented SOPs + 90-min team training', detail: 'Hand-over docs your counsellors and faculty can actually follow.' },
                { included: true, label: '30 days of hypercare after handover', detail: 'We monitor, fix, and tweak. You message us. We respond same-day.' },
              ],
            }}
            recurring={{
              price: '₹16K',
              subtitle: 'Per month, billed monthly. Cancel anytime with 30 days notice.',
              items: [
                { included: true, label: 'WhatsApp Business API hosting', detail: 'BSP costs, message conversations, template approvals.' },
                { included: true, label: 'GHL CRM seat + storage', detail: 'Full sub-account, unlimited contacts, unlimited team logins.' },
                { included: true, label: 'AI counsellor inference + tuning', detail: 'Monthly retraining as your FAQ patterns evolve.' },
                { included: true, label: 'n8n workflow hosting + monitoring', detail: 'We watch the queue. We get paged when something breaks.' },
                { included: true, label: 'Email infrastructure', detail: 'Parent receipts, monthly reports, escalations.' },
                { included: true, label: 'Quarterly review + performance tuning', detail: 'We pull numbers, propose tweaks, you approve.' },
                { included: false, label: 'Major customizations', detail: 'New programmes, new branches, deep integrations are quoted separately as mini-sprints.' },
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
              { name: 'LeadSquared', badge: 'LMS' },
              { name: 'Bitespeed / Interakt', badge: 'WABA SaaS' },
              { name: 'Hire 2 more counsellors', badge: '2 hires' },
              { name: 'ZippyScale', badge: 'Done-for-you', isUs: true },
            ]}
            rows={[
              {
                feature: 'WhatsApp routing on autopilot',
                values: [
                  { check: 'partial', text: 'Web LMS, weak on WA' },
                  { check: 'partial', text: 'Templates only, you set up' },
                  { check: 'partial', text: 'Manual, depends on the people' },
                  { check: 'yes', text: 'AI counsellor + smart escalation' },
                ],
              },
              {
                feature: 'Fee instalment auto-dunning',
                values: [
                  { check: 'partial', text: 'Manual reminders' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'no', text: 'They forget' },
                  { check: 'yes', text: 'Wired in Week 3' },
                ],
              },
              {
                feature: 'Attendance to dropout alert',
                values: [
                  { check: 'no', text: 'Out of scope' },
                  { check: 'no', text: 'Out of scope' },
                  { check: 'partial', text: 'They notice eventually' },
                  { check: 'yes', text: 'WhatsApp bot + n8n alert' },
                ],
              },
              {
                feature: 'Parent weekly digest',
                values: [
                  { check: 'no', text: 'Manual' },
                  { check: 'partial', text: 'You design + maintain' },
                  { check: 'partial', text: 'On their best days' },
                  { check: 'yes', text: 'Auto Sunday 8 PM, branded' },
                ],
              },
              {
                feature: 'Live in 4 weeks',
                values: [
                  '8-12 weeks onboarding',
                  '2-3 months DIY',
                  '3-month ramp + comp',
                  { check: 'yes', text: '28 days, fixed' },
                ],
              },
              {
                feature: 'Total monthly cost',
                values: [
                  '₹15K-30K + your time',
                  '₹5K-15K + your time',
                  '₹50K-1L combined salary',
                  '₹16K, fully managed',
                ],
              },
              {
                feature: 'Knowledge persists if counsellor leaves',
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
              <p className="text-[#6B7280] mb-8">The questions every institute owner asks before signing the audit. No fluff.</p>
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
                title: 'We map your current admissions process',
                description: 'Half-day shadow at your institute if you are in Hyderabad / Pune / Bangalore, remote walkthrough otherwise. We screenshot all 5 counsellor WhatsApps, your fee structure, your demo booking flow.',
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
