const TEAM = [
  ["Sandy", "Founder, strategy. On call for ₹2L+/mo opportunities."],
  ["Bhargav", "Your account lead. Daily comms, sprint owner."],
  ["Specialist", "Builder matched to your stack. Rotates by industry."],
];

export default function DeckSlide9() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-16">
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        The team
      </h2>
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {TEAM.map(([name, body]) => (
          <div key={name} className="rounded-lg border border-[var(--zs-card-border)] bg-white p-6">
            <p className="mb-2 font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-sub)" }}>
              {name}
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
