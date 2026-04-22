import { readSession } from "../../lib/discovery-session";

export default function DeckSlide1() {
  const session = readSession();
  const company = session?.company || "Your Company";
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <section
      className="flex w-full flex-col items-center justify-center gap-6 p-16 text-center"
      style={{ color: "var(--zs-charcoal)" }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        AI Automation Sprint
      </p>
      <h1 className="font-bold leading-tight" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        for {company}
      </h1>
      <p className="max-w-2xl" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-sub)" }}>
        Hosted by Bhargav, ZippyScale &middot; {today}
      </p>
      <p className="mt-8 text-sm text-[var(--zs-text-muted)]">
        Recorded for internal coaching only. Flag anything sensitive.
      </p>
      {!session && (
        <p data-role="presenter-chrome" data-bhargav-only className="mt-4 rounded border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700">
          &#9888; Session not loaded &mdash; run /discovery/setup before sharing screen.
        </p>
      )}
    </section>
  );
}
