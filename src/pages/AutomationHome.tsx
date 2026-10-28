import { useState, useEffect } from 'react'
import { trackSectionView, trackSectionScroll } from '../lib/tracking'
import ScarcityBanner from '../components/layout/ScarcityBanner'
import Nav from '../components/layout/Nav'
import Footer from '../components/layout/Footer'
import StickyCTA from '../components/layout/StickyCTA'
import Divider from '../components/ui/Divider'
import VisitTracker from '../components/ui/VisitTracker'
import Hero from '../components/sections/Hero'
import AwarenessBlocks from '../components/sections/AwarenessBlocks'
import ProofOfWork from '../components/sections/ProofOfWork'
import PainSection from '../components/sections/PainSection'
import AutomationGrid from '../components/sections/AutomationGrid'
import HowItWorks from '../components/sections/HowItWorks'
import ROICalculator from '../components/sections/ROICalculator'
import WhoIsThisFor from '../components/sections/WhoIsThisFor'
import FAQ from '../components/sections/FAQ'
import InstagramFeed from '../components/sections/InstagramFeed'
import QuizForm from '../components/sections/QuizForm'
import FinalCTA from '../components/sections/FinalCTA'
import MidPageCTA from '../components/sections/MidPageCTA'
import CaseStudiesPreview from '../components/sections/CaseStudiesPreview'

/* Split out of App.tsx on 2026-10-28 so its sections and framer-motion stop landing
   in the entry bundle every other route downloads. */
export default function AutomationHome() {
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
