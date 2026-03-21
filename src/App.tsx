import { BrowserRouter, Routes, Route } from 'react-router-dom'

function AutomationHome() {
  return <div>Automation Home - Coming Soon</div>
}

function GrowthOffer() {
  return <div>Growth Offer - Coming Soon</div>
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
