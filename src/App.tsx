import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScarcityBanner from './components/layout/ScarcityBanner'
import Nav from './components/layout/Nav'
import Footer from './components/layout/Footer'
import StickyCTA from './components/layout/StickyCTA'
import Hero from './components/sections/Hero'
import ProofOfWork from './components/sections/ProofOfWork'
import PainSection from './components/sections/PainSection'
import AutomationGrid from './components/sections/AutomationGrid'
import HowItWorks from './components/sections/HowItWorks'
import ROIComparison from './components/sections/ROIComparison'
import WhoIsThisFor from './components/sections/WhoIsThisFor'
import FAQ from './components/sections/FAQ'
import QuizForm from './components/sections/QuizForm'
import FinalCTA from './components/sections/FinalCTA'
import GrowthOffer from './pages/GrowthOffer'

function AutomationHome() {
  const [isQuizVisible, setIsQuizVisible] = useState(false)

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

  return (
    <>
      <ScarcityBanner />
      <Nav />
      <main>
        <Hero />
        <ProofOfWork />
        <PainSection />
        <AutomationGrid />
        <HowItWorks />
        <ROIComparison />
        <WhoIsThisFor />
        <QuizForm />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <StickyCTA isQuizVisible={isQuizVisible} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AutomationHome />} />
        <Route path="/growth-offer" element={<GrowthOffer />} />
      </Routes>
    </BrowserRouter>
  )
}
