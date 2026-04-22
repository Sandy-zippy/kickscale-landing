const OUTCOMES = [
  ["Order intake", "4h → 30min", "target"],
  ["Month-end close", "5 days → 2 days", "target"],
  ["DSO", "45 → 30 days", "target"],
];

export default function FallbackCaseStudyCardA() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-6 p-16">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        Scenario &middot; Manufacturing distribution
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        From WhatsApp chaos to a clean order pipeline
      </h2>
      <p className="max-w-3xl text-center" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        Pattern we see repeatedly in ₹3-5 Cr distributors: 200+ dealer chats, manual Tally re-entry, a 5-day month-end close. These are target ranges typical for the archetype.
      </p>
      <div className="grid w-full max-w-4xl grid-cols-3 gap-4">
        {OUTCOMES.map(([label, value, tag]) => (
          <div key={label} className="rounded-lg border border-[var(--zs-card-border)] bg-white p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-[var(--zs-text-muted)]">{tag}</p>
            <p className="my-2 font-bold" style={{ fontFamily: "var(--zs-font-mono)", fontSize: "var(--zs-deck-sub)", color: "var(--zs-charcoal)" }}>
              {value}
            </p>
            <p className="text-sm" style={{ fontFamily: "var(--zs-font-body)" }}>{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
