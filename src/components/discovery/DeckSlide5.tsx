import { readSession } from "../../lib/discovery-session";
import FallbackCaseStudyCardA from "./FallbackCaseStudyCardA";
import FallbackCaseStudyCardB from "./FallbackCaseStudyCardB";

export default function DeckSlide5() {
  const session = readSession();
  const slug = session?.cs1 ?? "";
  // Until microsite URLs are live, always render fallback cards.
  // Route based on matched industry slug so slides 5 and 6 differ.
  if (slug.startsWith("professional-services")) return <FallbackCaseStudyCardB />;
  return <FallbackCaseStudyCardA />;
}
