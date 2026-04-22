import { readSession } from "../../lib/discovery-session";
import FallbackCaseStudyCardA from "./FallbackCaseStudyCardA";
import FallbackCaseStudyCardB from "./FallbackCaseStudyCardB";

export default function DeckSlide6() {
  const session = readSession();
  const slug = session?.cs2 ?? "";
  if (slug.startsWith("auto-parts") || slug.startsWith("hvac") || slug.startsWith("rice-mill")) {
    return <FallbackCaseStudyCardA />;
  }
  return <FallbackCaseStudyCardB />;
}
