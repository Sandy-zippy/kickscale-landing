import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AgentAmbience } from './components/cockpit/Ambience'
import { captureUTM } from './lib/analytics'
import { trackSectionView, trackSectionScroll } from './lib/tracking'
import ScarcityBanner from './components/layout/ScarcityBanner'
import Nav from './components/layout/Nav'
import Footer from './components/layout/Footer'
import StickyCTA from './components/layout/StickyCTA'
import Divider from './components/ui/Divider'
import VisitTracker from './components/ui/VisitTracker'
import Hero from './components/sections/Hero'
import AwarenessBlocks from './components/sections/AwarenessBlocks'
import ProofOfWork from './components/sections/ProofOfWork'
import PainSection from './components/sections/PainSection'
import AutomationGrid from './components/sections/AutomationGrid'
import HowItWorks from './components/sections/HowItWorks'
import ROICalculator from './components/sections/ROICalculator'
import WhoIsThisFor from './components/sections/WhoIsThisFor'
import FAQ from './components/sections/FAQ'
import InstagramFeed from './components/sections/InstagramFeed'
import QuizForm from './components/sections/QuizForm'
import FinalCTA from './components/sections/FinalCTA'
import MidPageCTA from './components/sections/MidPageCTA'
import CaseStudiesPreview from './components/sections/CaseStudiesPreview'
import PrivacyPolicy from './pages/PrivacyPolicy'
import { ExportModeProvider } from './contexts/ExportModeContext'
import DeckLoader from './components/discovery/DeckLoader'

const GrowthOffer = lazy(() => import('./pages/GrowthOffer'))
const Growth = lazy(() => import('./pages/Growth'))
const AgenticCockpit = lazy(() => import('./pages/AgenticCockpit'))
const Giveaways = lazy(() => import('./pages/Giveaways'))
const CaseStudyIndex = lazy(() => import('./pages/CaseStudyIndex'))
const CaseStudyRouter = lazy(() => import('./pages/case-studies/CaseStudyRouter'))
const Discovery = lazy(() => import('./pages/Discovery'))
const DiscoverySetup = lazy(() => import('./pages/DiscoverySetup'))
const IVF = lazy(() => import('./pages/IVF'))
const CosmeticDental = lazy(() => import('./pages/CosmeticDental'))
const HairTransplant = lazy(() => import('./pages/HairTransplant'))
const EyeSurgery = lazy(() => import('./pages/EyeSurgery'))

function AutomationHome() {
  const [isQuizVisible, setIsQuizVisible] = useState(false)

  // This page used to be "/" and inherited the static title from index.html.
  // That shell now describes the growth homepage, so it sets its own.
  useEffect(() => {
    document.title = 'ZippyScale | AI Automations That Run Your Business While You Scale'
  }, [])

  useEffect(() => {
    const quizEl = document.getElementById('quiz')
    if (!quizEl) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => setIsQuizVisible(e.isIntersecting)),
      { threshold: 0.1 }
    )
    observer.observe(quizEl)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    ['pain', 'automation-grid', 'roi', 'how-it-works', 'quiz'].forEach((id) => {
      trackSectionView(id)
      trackSectionScroll(id)
    })
  }, [])

  return (
    <>
      <ScarcityBanner />
      <Nav />
      <main>
        <Hero />
        <VisitTracker />
        <AwarenessBlocks />
        <Divider />
        <PainSection />
        <Divider />
        <QuizForm />
        <Divider />
        <ProofOfWork />
        <Divider />
        <CaseStudiesPreview />
        <Divider />
        <AutomationGrid />
        <MidPageCTA />
        <Divider />
        <ROICalculator />
        <Divider />
        <HowItWorks />
        <MidPageCTA />
        <Divider />
        <WhoIsThisFor />
        <Divider />
        <InstagramFeed />
        <Divider />
        <FAQ />
        <Divider />
        <FinalCTA />
      </main>
      <Footer />
      <StickyCTA isQuizVisible={isQuizVisible} />
    </>
  )
}

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
  return <AgentAmbience />
}

export default function App() {
  useEffect(() => { captureUTM() }, [])

  return (
    <BrowserRouter>
      <ExportModeProvider>
        <Ambience />
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
