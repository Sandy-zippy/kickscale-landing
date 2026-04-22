import { useEffect } from 'react'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'

const LAST_UPDATED = '22 April 2026'
const EFFECTIVE_DATE = '22 April 2026'

type Section = { id: string; title: string }

const SECTIONS: Section[] = [
  { id: 'who-we-are', title: '1. Who We Are' },
  { id: 'data-we-collect', title: '2. Data We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Data' },
  { id: 'legal-basis', title: '4. Legal Basis for Processing' },
  { id: 'data-sharing', title: '5. Sharing Your Data' },
  { id: 'retention', title: '6. Data Retention' },
  { id: 'your-rights', title: '7. Your Rights as a Data Principal' },
  { id: 'withdraw-consent', title: '8. Withdrawing Consent' },
  { id: 'cookies', title: '9. Cookies and Tracking' },
  { id: 'security', title: '10. Security Measures' },
  { id: 'cross-border', title: '11. Cross-Border Data Transfers' },
  { id: 'children', title: '12. Children’s Data' },
  { id: 'changes', title: '13. Changes to This Policy' },
  { id: 'grievance', title: '14. Grievance Officer' },
]

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy | ZippyScale'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) {
      meta.setAttribute(
        'content',
        'ZippyScale privacy policy and DPDP Act 2023 compliance. How we collect, use, store, and protect your data.'
      )
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#1A1A2E]">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
        <header className="mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#B8CF2E]">
            Legal
          </p>
          <h1
            className="mb-4 text-4xl font-bold leading-tight md:text-5xl"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Privacy Policy
          </h1>
          <p className="text-base text-[#4B5563]">
            Last updated: {LAST_UPDATED} &nbsp;&middot;&nbsp; Effective: {EFFECTIVE_DATE}
          </p>
          <p className="mt-4 text-base leading-relaxed text-[#4B5563]">
            This policy explains how ZippyScale collects, uses, and protects your personal
            data when you interact with our website, quiz, discovery calls, and services.
            It is written to comply with India&rsquo;s Digital Personal Data Protection Act
            2023 (DPDP Act) and the Information Technology Act 2000.
          </p>
        </header>

        <nav
          aria-label="Table of contents"
          className="mb-12 rounded-lg border border-[#E5E7EB] bg-white p-6"
        >
          <p
            className="mb-3 text-xs font-bold uppercase tracking-widest text-[#6B7280]"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Contents
          </p>
          <ol className="space-y-1.5 text-sm text-[#1A1A2E]">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="hover:text-[#B8CF2E] hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="space-y-12 text-base leading-relaxed text-[#1A1A2E]">
          <Section id="who-we-are" title="1. Who We Are">
            <p>
              ZippyScale is a marketing and automation agency based in Hyderabad, India.
              We serve Indian small and mid-sized businesses with AI automation, paid
              advertising, CRM setup, and growth services. For the purposes of the DPDP
              Act 2023, ZippyScale is a <strong>Data Fiduciary</strong>: we decide the
              purpose and means of processing personal data submitted through our
              website, quiz, and services.
            </p>
            <p>
              If you want to contact us about this policy or your data, see &sect;14
              Grievance Officer below.
            </p>
          </Section>

          <Section id="data-we-collect" title="2. Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>Quiz responses &amp; booking data:</strong> your name, business
                name, email, phone number, company website, industry, revenue band, team
                size, current tools, automation interests, urgency, and any other fields
                you complete in the zippyscale.in quiz.
              </li>
              <li>
                <strong>Discovery call data:</strong> audio/video recording of the call
                (with your explicit on-record consent), transcript, Bhargav&rsquo;s
                diagnostic notes about your business, bottlenecks you describe, tools you
                demonstrate, metrics you share, and the verbatim language you use to
                describe your goals.
              </li>
              <li>
                <strong>Screen-share content:</strong> when you share access to your
                website analytics, ad accounts, or CRM during the discovery call, we
                observe and take notes on what we see. We do not download or store
                screenshots unless you explicitly ask us to.
              </li>
              <li>
                <strong>Commercial data:</strong> payment method metadata via Razorpay
                (we do not store card numbers), GSTIN (if provided), billing address,
                signed agreements, invoices, and receipts.
              </li>
              <li>
                <strong>Usage and device data:</strong> IP address, browser type, pages
                viewed, time on page, referrer, UTM parameters, and click events. We use
                Meta Pixel, Microsoft Clarity, and Google Analytics 4 (see &sect;9
                Cookies).
              </li>
              <li>
                <strong>Service delivery data:</strong> any data you share with us during
                a paid sprint or retainer, including access tokens, content, creative
                briefs, customer data you ask us to process, and any other material
                necessary to deliver the work.
              </li>
            </ul>
            <p>
              We do not intentionally collect sensitive personal data (financial account
              numbers, health information, biometrics). If you share such data
              accidentally during a discovery call or screen-share, flag it to Bhargav or
              write to our Grievance Officer and we will delete it.
            </p>
          </Section>

          <Section id="how-we-use" title="3. How We Use Your Data">
            <p>We process personal data for these specific purposes:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>To respond to your quiz submission and book a discovery call.</strong>
              </li>
              <li>
                <strong>To conduct the discovery call and prepare a proposal</strong>{' '}
                matched to your business.
              </li>
              <li>
                <strong>To deliver services you have paid for</strong> under a signed
                agreement (sprint, retainer, or project work).
              </li>
              <li>
                <strong>To send transactional messages</strong> over email and WhatsApp
                about your booking, invoice, or sprint progress.
              </li>
              <li>
                <strong>To improve our services internally</strong> by reviewing
                anonymized call recordings with our own team for coaching.
              </li>
              <li>
                <strong>To comply with legal obligations</strong> including GST filings,
                income tax filings, and any regulatory requests.
              </li>
              <li>
                <strong>To prevent fraud and secure our systems.</strong>
              </li>
            </ul>
            <p>
              We do <strong>not</strong> sell your data to third parties. We do not use
              your discovery call data or business data to train public AI models. We do
              not share your data with other ZippyScale prospects or clients.
            </p>
          </Section>

          <Section id="legal-basis" title="4. Legal Basis for Processing">
            <p>
              Under the DPDP Act 2023, we rely on two legal bases:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>Consent (DPDP &sect;6):</strong> when you submit the quiz, book a
                call, or say &ldquo;yes&rdquo; on record at the start of a discovery call
                to recording, you are providing free, specific, informed, and unambiguous
                consent. You can withdraw this consent at any time (see &sect;8).
              </li>
              <li>
                <strong>Legitimate uses (DPDP &sect;7):</strong> where processing is
                necessary to deliver a service you have explicitly asked for, respond to
                an emergency, comply with a legal obligation, or fulfill a contract with
                you.
              </li>
            </ul>
          </Section>

          <Section id="data-sharing" title="5. Sharing Your Data">
            <p>
              We share your data with the following categories of third parties, only to
              the extent necessary to deliver services to you:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>Infrastructure &amp; storage:</strong> Google Workspace (Gmail,
                Drive, Docs, Sheets, Meet), GoHighLevel (CRM), n8n (workflow automation
                on sandyautomations.app.n8n.cloud), Microsoft Clarity (session
                recording), Meta (conversion tracking), Google Analytics 4.
              </li>
              <li>
                <strong>Payment processing:</strong> Razorpay (cards, UPI, netbanking).
                We do not store card numbers; Razorpay does, under RBI and PCI-DSS rules.
              </li>
              <li>
                <strong>Electronic signatures:</strong> DocuSign for MOU signing, with
                SMS-OTP authentication.
              </li>
              <li>
                <strong>AI processing:</strong> Anthropic&rsquo;s Claude API for
                generating your First Sprint Plan from discovery notes. Claude does not
                train on API inputs. We use prompt caching for efficiency.
              </li>
              <li>
                <strong>Messaging:</strong> WhatsApp Business API via GoHighLevel for
                transactional messages (booking confirmations, reminders, payment
                reminders).
              </li>
              <li>
                <strong>Professional advisors:</strong> our chartered accountant and
                lawyer, for GST and contract work.
              </li>
              <li>
                <strong>Law enforcement or regulatory bodies:</strong> only when legally
                required, and only the minimum data required.
              </li>
            </ul>
            <p>
              Every third-party processor we use is under a data processing agreement or
              equivalent commitment to confidentiality and security. We review this list
              at least annually.
            </p>
          </Section>

          <Section id="retention" title="6. Data Retention">
            <p>We retain personal data only as long as necessary:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>Quiz responses:</strong> 24 months from submission, then deleted
                unless you become a client.
              </li>
              <li>
                <strong>Discovery call recordings:</strong> 90 days from the call, then
                auto-deleted from Google Drive.
              </li>
              <li>
                <strong>Discovery notes and sprint plans:</strong> 180 days from call (if
                not converted) or for the duration of engagement + 36 months (if you
                become a client, for service continuity and tax records).
              </li>
              <li>
                <strong>Signed agreements, invoices, and payment records:</strong> 8
                years from the end of the financial year (as required by Indian tax and
                GST law).
              </li>
              <li>
                <strong>Website analytics and tracking:</strong> 14 months (Google
                Analytics default), 30 days (Microsoft Clarity), 180 days (Meta Pixel).
              </li>
              <li>
                <strong>Support conversations (email, WhatsApp):</strong> 24 months from
                last contact.
              </li>
            </ul>
            <p>
              If you ask us to erase your data earlier, we will do so within 30 days
              unless we are legally required to retain it (e.g., tax records).
            </p>
          </Section>

          <Section id="your-rights" title="7. Your Rights as a Data Principal">
            <p>Under the DPDP Act 2023, you have the right to:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>Access</strong> the personal data we hold about you and get a
                summary of how we use it.
              </li>
              <li>
                <strong>Correct</strong> or update inaccurate, incomplete, or outdated
                personal data.
              </li>
              <li>
                <strong>Erase</strong> personal data that is no longer necessary for the
                purpose it was collected (subject to legal retention obligations).
              </li>
              <li>
                <strong>Withdraw consent</strong> at any time, for any processing based
                on consent.
              </li>
              <li>
                <strong>Nominate</strong> another person to exercise your rights on your
                behalf in case of incapacity or death.
              </li>
              <li>
                <strong>Grievance redressal</strong> by writing to our Grievance Officer
                (see &sect;14). If not resolved within 30 days, you may escalate to the
                Data Protection Board of India.
              </li>
            </ul>
            <p>
              To exercise any of these rights, email{' '}
              <a
                href="mailto:sandy@zippyscale.com?subject=Data%20Rights%20Request"
                className="text-[#B8CF2E] underline hover:text-[#1A1A2E]"
              >
                sandy@zippyscale.com
              </a>{' '}
              with the subject line &ldquo;Data Rights Request&rdquo; and include your
              full name, registered email, and the specific request. We respond within 7
              business days and fulfill within 30 days.
            </p>
          </Section>

          <Section id="withdraw-consent" title="8. Withdrawing Consent">
            <p>
              Withdrawal of consent is as easy as giving it. You can:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                Reply &ldquo;STOP&rdquo; to any WhatsApp message from us &mdash; we will
                remove you from that sequence within 24 hours.
              </li>
              <li>
                Click the &ldquo;unsubscribe&rdquo; link in any email &mdash; we will
                remove you from email marketing immediately.
              </li>
              <li>
                Email{' '}
                <a
                  href="mailto:sandy@zippyscale.com?subject=Withdraw%20Consent"
                  className="text-[#B8CF2E] underline hover:text-[#1A1A2E]"
                >
                  sandy@zippyscale.com
                </a>{' '}
                with &ldquo;Withdraw Consent&rdquo; in the subject line to delete your
                account and all associated data within 30 days, subject to legal
                retention.
              </li>
            </ul>
            <p>
              Withdrawing consent does not affect the lawfulness of processing done
              before the withdrawal. If you withdraw consent to call recording mid-call,
              we stop and delete the recording.
            </p>
          </Section>

          <Section id="cookies" title="9. Cookies and Tracking">
            <p>
              zippyscale.in uses cookies and similar technologies to understand how
              visitors use the site, track conversions from our ads, and remember your
              preferences. Specifically:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>Meta Pixel (ID 961643772929674):</strong> tracks conversions from
                our Facebook and Instagram ads, and powers retargeting audiences.
              </li>
              <li>
                <strong>Google Analytics 4:</strong> aggregate page views, session
                duration, traffic sources.
              </li>
              <li>
                <strong>Microsoft Clarity:</strong> session heatmaps and replays of site
                usage (anonymized, no form fields recorded).
              </li>
              <li>
                <strong>First-party cookies and localStorage:</strong> we store a
                visitor ID, UTM parameters, and feature preferences in your browser to
                maintain state. None of this is sold or shared externally.
              </li>
            </ul>
            <p>
              Most browsers let you block or delete cookies in settings. Blocking may
              limit some features (e.g., form auto-fill, remembered preferences).
            </p>
          </Section>

          <Section id="security" title="10. Security Measures">
            <p>
              We protect your data with the following measures:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>HTTPS/TLS for all data transit across zippyscale.in and internal systems.</li>
              <li>
                Access control: production systems (GHL, Razorpay, DocuSign, Google
                Workspace, n8n) are restricted to named ZippyScale team members only,
                with 2FA mandatory.
              </li>
              <li>
                Least-privilege: team members have access only to the data needed for
                their role (e.g., Sara handles ops, Bhargav handles discovery).
              </li>
              <li>
                Audit logs: every critical system logs access events. Recordings and
                discovery sheets are stored in per-contact files, not master sheets, to
                limit blast radius if a file is accidentally over-shared.
              </li>
              <li>
                Dedicated browser profile for client work, to prevent cross-client data
                leaks during screen sharing.
              </li>
              <li>
                Webhook authentication (HMAC verification) for all incoming events from
                Razorpay, DocuSign, and Google Forms.
              </li>
              <li>
                Annual review of third-party processors and revocation of access for
                departed team members within 24 hours.
              </li>
            </ul>
            <p>
              No system is perfectly secure. If a breach affecting your personal data
              occurs, we will notify you and the Data Protection Board of India within
              72 hours of becoming aware of the breach, as required by DPDP &sect;8(6).
            </p>
          </Section>

          <Section id="cross-border" title="11. Cross-Border Data Transfers">
            <p>
              Some of our third-party processors (Google Workspace, Meta, Microsoft
              Clarity, Anthropic, DocuSign) store and process data outside India, in the
              United States and the European Economic Area. Transfers comply with
              Section 16 of the DPDP Act 2023 and the receiving country&rsquo;s standards
              of protection. If the Indian government restricts specific countries in
              future, we will update our vendor mix to comply.
            </p>
            <p>
              For clients outside India (UK, US, EU), we also observe applicable
              regulations (GDPR, CCPA) where they apply, in addition to Indian law.
            </p>
          </Section>

          <Section id="children" title="12. Children’s Data">
            <p>
              Our services are directed at business owners, founders, and decision-makers
              aged 18 and above. We do not knowingly collect data from anyone under 18.
              If you believe a child has submitted data, write to our Grievance Officer
              and we will delete it within 30 days. Where we unavoidably process a
              child&rsquo;s data (e.g., lead for a business where the founder&rsquo;s
              child is named), we comply with DPDP &sect;9 (verifiable parental consent
              required).
            </p>
          </Section>

          <Section id="changes" title="13. Changes to This Policy">
            <p>
              We may update this policy to reflect changes in our services, technology,
              legal requirements, or industry practices. When we do:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>The &ldquo;Last updated&rdquo; date at the top will change.</li>
              <li>
                Material changes will be notified by email to active clients and via a
                banner on the site for 30 days.
              </li>
              <li>
                A changelog of past versions is maintained internally and available on
                request.
              </li>
            </ul>
          </Section>

          <Section id="grievance" title="14. Grievance Officer">
            <p>
              Under Section 8(9) of the DPDP Act 2023, every Data Fiduciary must publish
              a Grievance Officer contact. Our Grievance Officer is:
            </p>
            <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-white p-6">
              <p>
                <strong>Name:</strong> Sandy, Founder, ZippyScale
              </p>
              <p className="mt-2">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:sandy@zippyscale.com?subject=Grievance%20%E2%80%93%20Privacy%20Policy"
                  className="text-[#B8CF2E] underline hover:text-[#1A1A2E]"
                >
                  sandy@zippyscale.com
                </a>
              </p>
              <p className="mt-2">
                <strong>Response time:</strong> we acknowledge grievances within 72 hours
                and resolve within 30 days as required by DPDP &sect;13(3).
              </p>
              <p className="mt-2">
                <strong>Escalation:</strong> if not resolved within 30 days, you may
                escalate to the Data Protection Board of India once notified by the
                central government, or the appropriate consumer forum in the meantime.
              </p>
            </div>
            <p className="mt-4 text-sm text-[#6B7280]">
              For urgent data deletion requests, please mark the email subject with
              &ldquo;URGENT &ndash; Data Deletion.&rdquo; We prioritize these requests
              within 48 hours.
            </p>
          </Section>
        </article>

        <footer className="mt-16 border-t border-[#E5E7EB] pt-8 text-sm text-[#6B7280]">
          <p>
            This policy is written in plain English. If anything is unclear, email
            Sandy directly and he will explain it in conversation.
          </p>
          <p className="mt-2">
            &copy; {new Date().getFullYear()} ZippyScale. All rights reserved.
          </p>
        </footer>
      </main>
      <Footer />
    </div>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2
        className="mb-4 text-2xl font-bold text-[#1A1A2E] md:text-3xl"
        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
