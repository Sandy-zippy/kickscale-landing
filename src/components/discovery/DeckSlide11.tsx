export default function DeckSlide11() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-16">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        Investment
      </p>
      <h2 className="font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        &#8377;1.5 lakh, fixed
      </h2>
      <p className="max-w-2xl text-center" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-sub)" }}>
        4 weeks. Fixed scope. No hidden fees. No surprises.
      </p>
      <div className="max-w-3xl rounded-lg border border-[var(--zs-card-border)] bg-white p-6" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        <p className="mb-2 font-bold">What&rsquo;s included</p>
        <ul className="mb-4 list-disc pl-6">
          <li>Full 4-week delivery per scope above</li>
          <li>Daily communications + weekly review</li>
          <li>30 days of post-sprint support</li>
        </ul>
        <p className="mb-2 font-bold">What comes next</p>
        <p className="text-[var(--zs-text-secondary)]">
          Most clients continue on a &#8377;1-2 lakh/month retainer to keep building. We&rsquo;ll talk about that in Week 4.
        </p>
      </div>
    </section>
  );
}
