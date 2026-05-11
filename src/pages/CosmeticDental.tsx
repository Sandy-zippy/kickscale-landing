import { useEffect } from 'react'
import CosmeticDentalHero from '../components/cosmetic-dental/CosmeticDentalHero'
import HyderabadProof from '../components/cosmetic-dental/HyderabadProof'
import PainTrifecta from '../components/cosmetic-dental/PainTrifecta'
import AfterSprint from '../components/cosmetic-dental/AfterSprint'
import StackDiagram from '../components/cosmetic-dental/StackDiagram'
import SprintTimeline from '../components/cosmetic-dental/SprintTimeline'
import PricingCommitments from '../components/cosmetic-dental/PricingCommitments'
import FoundingClinic from '../components/cosmetic-dental/FoundingClinic'
import ComplianceGate from '../components/cosmetic-dental/ComplianceGate'
import CosmeticDentalFAQ from '../components/cosmetic-dental/CosmeticDentalFAQ'
import CosmeticDentalFinalCTA from '../components/cosmetic-dental/CosmeticDentalFinalCTA'
import StickyBottomCTA from '../components/cosmetic-dental/StickyBottomCTA'
import ScrollProgress from '../components/cosmetic-dental/ScrollProgress'

export default function CosmeticDental() {
  useEffect(() => {
    document.title = 'Cosmetic Dental Growth Sprint for Hyderabad Clinics — ZippyScale'
    document.documentElement.style.background = '#FFFDF7'
    return () => {
      document.documentElement.style.background = ''
    }
  }, [])

  return (
    <main className="bg-[#FFFDF7] text-[#2A2A35] min-h-screen antialiased">
      <ScrollProgress />
      <div id="hero-form">
        <CosmeticDentalHero />
      </div>
      <HyderabadProof />
      <PainTrifecta />
      <AfterSprint />
      <StackDiagram />
      <SprintTimeline />
      <PricingCommitments />
      <FoundingClinic />
      <ComplianceGate />
      <CosmeticDentalFAQ />
      <CosmeticDentalFinalCTA />
      <StickyBottomCTA />
    </main>
  )
}
