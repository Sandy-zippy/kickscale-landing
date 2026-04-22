export default function DeckSlide2() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-16">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        60 minutes &middot; 3 phases &middot; decision today
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        Today's agenda
      </h2>
      <div className="grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3" style={{ fontFamily: "var(--zs-font-body)" }}>
        {[
          ["Diagnose", "Live audit of your website, analytics, CRM. 20 minutes."],
          ["Pitch", "What we'd build for you in 4 weeks. Case studies. Team."],
          ["Decide", "Scope, price, reservation. You walk out with a sprint locked in."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-[var(--zs-card-border)] bg-white p-6">
            <p className="mb-2 font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-sub)" }}>
              {title}
            </p>
            <p style={{ fontSize: "var(--zs-deck-body)" }}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
