import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScarcityBanner from './components/layout/ScarcityBanner'
import Nav from './components/layout/Nav'
import Footer from './components/layout/Footer'
import StickyCTA from './components/layout/StickyCTA'

function AutomationHome() {
  return (
    <>
      <ScarcityBanner />
      <Nav />
      <main className="pt-32">
        <div className="text-center py-40">
          <h1 className="text-4xl font-bold">Automation Home — Building...</h1>
        </div>
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
