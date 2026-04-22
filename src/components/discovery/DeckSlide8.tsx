const DELIVERABLES = [
  "Audit doc (Week 1) — your current stack + where it's bleeding",
  "3 automations built against your real tools",
  "Live dashboard tracking what the automations do",
  "Training video for your team (30 min)",
  "30 days of support post-sprint",
  "Source-of-truth SOPs in your Drive",
];

export default function DeckSlide8() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-16">
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        What you get
      </h2>
      <ul className="w-full max-w-4xl space-y-3" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        {DELIVERABLES.map((d) => (
          <li key={d} className="rounded-lg border border-[var(--zs-card-border)] bg-white px-5 py-4">
            &#10003; {d}
          </li>
        ))}
      </ul>
    </section>
  );
}
