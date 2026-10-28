import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { captureUTM } from './lib/analytics'
import { ExportModeProvider } from './contexts/ExportModeContext'
import DeckLoader from './components/discovery/DeckLoader'
import WhatsAppFloat from './components/layout/WhatsAppFloat'

const AutomationHome = lazy(() => import('./pages/AutomationHome'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
/* decorative only, so it arrives after the page instead of inside the entry bundle */
const AgentAmbience = lazy(() => import('./components/cockpit/Ambience').then(m => ({ default: m.AgentAmbience })))
const GrowthOffer = lazy(() => import('./pages/GrowthOffer'))
const Growth = lazy(() => import('./pages/Growth'))
const AgenticCockpit = lazy(() => import('./pages/AgenticCockpit'))
const Websites = lazy(() => import('./pages/Websites'))
const Giveaways = lazy(() => import('./pages/Giveaways'))
const CaseStudyIndex = lazy(() => import('./pages/CaseStudyIndex'))
const CaseStudyRouter = lazy(() => import('./pages/case-studies/CaseStudyRouter'))
const Discovery = lazy(() => import('./pages/Discovery'))
const DiscoverySetup = lazy(() => import('./pages/DiscoverySetup'))
const IVF = lazy(() => import('./pages/IVF'))
const CosmeticDental = lazy(() => import('./pages/CosmeticDental'))
const HairTransplant = lazy(() => import('./pages/HairTransplant'))
const EyeSurgery = lazy(() => import('./pages/EyeSurgery'))

/* Routes where the drifting agents would be noise rather than atmosphere:
   /growth-offer is a full-bleed iframe, and /discovery is a working form. */
const NO_AMBIENCE = ['/growth-offer', '/discovery']

function Ambience() {
  const { pathname } = useLocation()
  if (NO_AMBIENCE.some(p => pathname.startsWith(p))) return null
  /* The homepage has its own agents since 2026-10-01 (Zippy, per-section drift behind
     the content, and each agent working in its tile). This layer floats ABOVE content,
     so there it drew faint robots across those tiles. Every other route keeps it. */
  if (pathname === '/') return null
  return <Suspense fallback={null}><AgentAmbience /></Suspense>
}

export default function App() {
  useEffect(() => { captureUTM() }, [])

  return (
    <BrowserRouter>
      <ExportModeProvider>
        <Ambience />
        <WhatsAppFloat />
        <Suspense fallback={<DeckLoader />}>
          <Routes>
            {/* Agentic Cockpit became the front door on 2026-09-26 — it is the
                product now, and the agency is a service underneath it. The growth
                marketing page moved to /agency and keeps selling.
                /growth carries live ad traffic: it MUST point at /agency, not at
                /, or paid clicks land on the product page instead of the offer
                they were promised. */}
            <Route path="/" element={<AgenticCockpit />} />
            <Route path="/agentic-cockpit" element={<AgenticCockpit />} />
            <Route path="/agency" element={<Growth />} />
            <Route path="/ai-automation" element={<AutomationHome />} />
            <Route path="/websites" element={<Websites />} />
            <Route path="/growth" element={<Navigate to="/agency" replace />} />
            <Route path="/marketing" element={<Navigate to="/agency" replace />} />
            <Route path="/growth-offer" element={<GrowthOffer />} />
            <Route path="/giveaways" element={<Giveaways />} />
            <Route path="/case-studies" element={<CaseStudyIndex />} />
            <Route path="/case-studies/:slug" element={<CaseStudyRouter />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/discovery/setup" element={<DiscoverySetup />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/ivf" element={<IVF />} />
            <Route path="/cosmetic-dental" element={<CosmeticDental />} />
            <Route path="/hair-transplant" element={<HairTransplant />} />
            <Route path="/eye-surgery" element={<EyeSurgery />} />
          </Routes>
        </Suspense>
      </ExportModeProvider>
    </BrowserRouter>
  )
}
