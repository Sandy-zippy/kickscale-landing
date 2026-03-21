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

function AutomationHome() {
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
      </main>
      <Footer />
      <StickyCTA isQuizVisible={false} />
    </>
  )
}

function GrowthOffer() {
  return <div className="p-8 text-center text-xl">Growth Offer — Coming Soon</div>
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
