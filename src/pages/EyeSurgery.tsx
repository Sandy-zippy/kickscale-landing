import { useEffect } from 'react'
import EyeSurgeryHero from '../components/eye-surgery/EyeSurgeryHero'
import HyderabadProof from '../components/eye-surgery/HyderabadProof'
import PainTrifecta from '../components/eye-surgery/PainTrifecta'
import AfterSprint from '../components/eye-surgery/AfterSprint'
import StackDiagram from '../components/eye-surgery/StackDiagram'
import SprintTimeline from '../components/eye-surgery/SprintTimeline'
import PricingCommitments from '../components/eye-surgery/PricingCommitments'
import FoundingClinic from '../components/eye-surgery/FoundingClinic'
import ComplianceGate from '../components/eye-surgery/ComplianceGate'
import EyeSurgeryFAQ from '../components/eye-surgery/EyeSurgeryFAQ'
import EyeSurgeryFinalCTA from '../components/eye-surgery/EyeSurgeryFinalCTA'
import StickyBottomCTA from '../components/eye-surgery/StickyBottomCTA'
import ScrollProgress from '../components/eye-surgery/ScrollProgress'

export default function EyeSurgery() {
  useEffect(() => {
    document.title = 'Eye Surgery Growth Sprint for Hyderabad Clinics — ZippyScale'
    document.documentElement.style.background = '#FFFDF7'
    return () => { document.documentElement.style.background = '' }
  }, [])

  return (
    <main className="bg-[#FFFDF7] text-[#2A2A35] min-h-screen antialiased">
      <ScrollProgress />
      <div id="hero-form"><EyeSurgeryHero /></div>
      <HyderabadProof />
      <PainTrifecta />
      <AfterSprint />
      <StackDiagram />
      <SprintTimeline />
      <PricingCommitments />
      <FoundingClinic />
      <ComplianceGate />
      <EyeSurgeryFAQ />
      <EyeSurgeryFinalCTA />
      <StickyBottomCTA />
    </main>
  )
}
