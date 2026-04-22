import DeckShell from "../components/discovery/DeckShell";
import DeckSummaryCopyButton from "../components/discovery/DeckSummaryCopyButton";
import DeckSlide1 from "../components/discovery/DeckSlide1";
import DeckSlide2 from "../components/discovery/DeckSlide2";
import DeckSlide3 from "../components/discovery/DeckSlide3";
import DeckSlide4 from "../components/discovery/DeckSlide4";
import DeckSlide5 from "../components/discovery/DeckSlide5";
import DeckSlide6 from "../components/discovery/DeckSlide6";
import DeckSlide7 from "../components/discovery/DeckSlide7";
import DeckSlide8 from "../components/discovery/DeckSlide8";
import DeckSlide9 from "../components/discovery/DeckSlide9";
import DeckSlide10 from "../components/discovery/DeckSlide10";
import DeckSlide11 from "../components/discovery/DeckSlide11";
import DeckSlide12 from "../components/discovery/DeckSlide12";
import { useExportMode } from "../contexts/ExportModeContext";

export default function Discovery() {
  const { mode } = useExportMode();
  const bottlenecksSubmit = (bullets: { b1: string; b2: string; b3: string }) => {
    // v1: just log. Real submission to Google Form webhook comes in the
    // sheet-integration plan; for now the draft auto-save persists bullets.
    // eslint-disable-next-line no-console
    console.log("[discovery] bottlenecks locked", bullets);
  };
  const slides = [
    <DeckSlide1 key="1" />,
    <DeckSlide2 key="2" />,
    <DeckSlide3 key="3" />,
    <DeckSlide4 key="4" onSubmit={bottlenecksSubmit} />,
    <DeckSlide5 key="5" />,
    <DeckSlide6 key="6" />,
    <DeckSlide7 key="7" />,
    <DeckSlide8 key="8" />,
    <DeckSlide9 key="9" />,
    <DeckSlide10 key="10" />,
    <DeckSlide11 key="11" />,
    <DeckSlide12 key="12" />,
  ];
  return (
    <>
      <DeckShell slides={slides} />
      {mode === "presenter" && <DeckSummaryCopyButton />}
    </>
  );
}
