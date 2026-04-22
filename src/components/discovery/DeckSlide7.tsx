const WEEKS = [
  ["Week 1", "Audit", "Diagnose your stack + map the 3 automations we'll build."],
  ["Week 2", "Build", "Assemble automations against your real tools. Daily updates."],
  ["Week 3", "Deploy", "Ship live. Migrate legacy data. Switch on monitoring."],
  ["Week 4", "Train", "Train your team. Hand over SOPs. 30-day support begins."],
];

export default function DeckSlide7() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-16">
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        The 4-week sprint
      </h2>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-4">
        {WEEKS.map(([w, title, body]) => (
          <div key={w} className="rounded-lg border border-[var(--zs-card-border)] bg-white p-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
              {w}
            </p>
            <p className="mb-3 font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-sub)" }}>
              {title}
            </p>
            <p style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
