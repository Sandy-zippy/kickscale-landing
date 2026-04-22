export default function DeckSlide10() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-16">
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        Timeline &mdash; 28 days
      </h2>
      <div className="grid w-full max-w-5xl grid-cols-4 gap-4">
        {["Audit", "Build", "Deploy", "Train"].map((label, i) => (
          <div key={label} className="flex flex-col gap-2">
            <div className="h-3 w-full rounded" style={{ backgroundColor: "var(--zs-lime)", opacity: 0.2 + i * 0.2 }} />
            <p className="text-center text-sm font-bold" style={{ fontFamily: "var(--zs-font-heading)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>
      <p className="max-w-3xl text-center text-[var(--zs-text-secondary)]" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        Day 1 kickoff call. Daily standup via WhatsApp. Weekly 30-min review. At the end, you own a working automation stack.
      </p>
    </section>
  );
}
