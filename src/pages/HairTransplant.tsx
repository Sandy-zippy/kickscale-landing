import { useEffect } from 'react'
import HairTransplantHero from '../components/hair-transplant/HairTransplantHero'
import HyderabadProof from '../components/hair-transplant/HyderabadProof'
import PainTrifecta from '../components/hair-transplant/PainTrifecta'
import AfterSprint from '../components/hair-transplant/AfterSprint'
import StackDiagram from '../components/hair-transplant/StackDiagram'
import SprintTimeline from '../components/hair-transplant/SprintTimeline'
import PricingCommitments from '../components/hair-transplant/PricingCommitments'
import FoundingClinic from '../components/hair-transplant/FoundingClinic'
import ComplianceGate from '../components/hair-transplant/ComplianceGate'
import HairTransplantFAQ from '../components/hair-transplant/HairTransplantFAQ'
import HairTransplantFinalCTA from '../components/hair-transplant/HairTransplantFinalCTA'
import StickyBottomCTA from '../components/hair-transplant/StickyBottomCTA'
import ScrollProgress from '../components/hair-transplant/ScrollProgress'

export default function HairTransplant() {
  useEffect(() => {
    document.title = 'Hair Transplant Growth Sprint for Hyderabad Clinics — ZippyScale'
    document.documentElement.style.background = '#FFFDF7'
    return () => { document.documentElement.style.background = '' }
  }, [])

  return (
    <main className="bg-[#FFFDF7] text-[#2A2A35] min-h-screen antialiased">
      <ScrollProgress />
      <div id="hero-form"><HairTransplantHero /></div>
      <HyderabadProof />
      <PainTrifecta />
      <AfterSprint />
      <StackDiagram />
      <SprintTimeline />
      <PricingCommitments />
      <FoundingClinic />
      <ComplianceGate />
      <HairTransplantFAQ />
      <HairTransplantFinalCTA />
      <StickyBottomCTA />
    </main>
  )
}
