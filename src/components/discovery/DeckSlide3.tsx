export default function DeckSlide3() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-6 p-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        Phase 1
      </p>
      <h2 className="font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        Live audit
      </h2>
      <p className="max-w-3xl" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-sub)" }}>
        Switch to the prospect's screen. Walk through their website, analytics, CRM. Narrate what you see.
      </p>
      <p data-role="presenter-chrome" data-bhargav-only className="mt-8 max-w-xl rounded border border-[var(--zs-card-border)] bg-white p-4 text-sm text-[var(--zs-text-secondary)]">
        Reminder: capture 3 bottleneck bullets (3-5 words each) into slide 4 as you find them.
      </p>
    </section>
  );
}
