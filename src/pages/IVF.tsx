import { useEffect } from 'react'
import IVFHero from '../components/ivf/IVFHero'
import HyderabadProof from '../components/ivf/HyderabadProof'
import PainTrifecta from '../components/ivf/PainTrifecta'
import AfterSprint from '../components/ivf/AfterSprint'
import StackDiagram from '../components/ivf/StackDiagram'
import SprintTimeline from '../components/ivf/SprintTimeline'
import PricingCommitments from '../components/ivf/PricingCommitments'
import FoundingClinic from '../components/ivf/FoundingClinic'
import ComplianceGate from '../components/ivf/ComplianceGate'
import IVFFAQ from '../components/ivf/IVFFAQ'
import IVFFinalCTA from '../components/ivf/IVFFinalCTA'
import StickyBottomCTA from '../components/ivf/StickyBottomCTA'
import ScrollProgress from '../components/ivf/ScrollProgress'

export default function IVF() {
  useEffect(() => {
    document.title = 'IVF Growth Sprint for Hyderabad Clinics — ZippyScale'
    document.documentElement.style.background = '#FFFDF7'
    return () => {
      document.documentElement.style.background = ''
    }
  }, [])

  return (
    <main className="bg-[#FFFDF7] text-[#2A2A35] min-h-screen antialiased">
      <ScrollProgress />
      <div id="hero-form">
        <IVFHero />
      </div>
      <HyderabadProof />
      <PainTrifecta />
      <AfterSprint />
      <StackDiagram />
      <SprintTimeline />
      <PricingCommitments />
      <FoundingClinic />
      <ComplianceGate />
      <IVFFAQ />
      <IVFFinalCTA />
      <StickyBottomCTA />
    </main>
  )
}
