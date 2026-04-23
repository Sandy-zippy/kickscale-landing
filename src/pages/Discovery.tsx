import DeckShell from "../components/discovery/DeckShell";
import DeckSlide1 from "../components/discovery/DeckSlide1";
import DeckSlide2 from "../components/discovery/DeckSlide2";
import QualifyGrid from "../components/discovery/QualifyGrid";
import PreCallAudit from "../components/discovery/PreCallAudit";
import Reframe from "../components/discovery/Reframe";
import COICalculator from "../components/discovery/COICalculator";
import TriedBefore from "../components/discovery/TriedBefore";
import SprintChangelog from "../components/discovery/SprintChangelog";
import InvestmentScarcity from "../components/discovery/InvestmentScarcity";
import LockInButton from "../components/discovery/LockInButton";

export default function Discovery() {
  const slides = [
    <DeckSlide1 key="1" />,
    <DeckSlide2 key="2" />,
    <QualifyGrid key="3" />,
    <PreCallAudit key="4" />,
    <Reframe key="5" />,
    <COICalculator key="6" />,
    <TriedBefore key="7" />,
    <SprintChangelog key="8" />,
    <InvestmentScarcity key="9" />,
    <LockInButton key="10" />,
  ];
  return <DeckShell slides={slides} />;
}
