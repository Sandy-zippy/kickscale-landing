const OUTCOMES = [
  ["Proposal turnaround", "5 days → 24h", "target"],
  ["Partner hours saved", "12/week", "target"],
  ["DSO", "60 → 35 days", "target"],
];

export default function FallbackCaseStudyCardB() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-6 p-16">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        Scenario &middot; Professional services
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        From proposal bottleneck to cash in hand
      </h2>
      <p className="max-w-3xl text-center" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        Pattern we see repeatedly in professional services firms: partner-led sales, manual proposal drafting, week-long follow-up loops. Target ranges typical for the archetype.
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
