import { readSession } from "../../lib/discovery-session";

export default function Reframe() {
  const session = readSession();
  const reframe = session?.audit?.reframe;

  if (!reframe) {
    return (
      <section className="flex w-full flex-col items-center justify-center p-16 text-center">
        <p className="text-[var(--zs-text-muted)]">Reframe not available. Run /discovery/setup first.</p>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-12">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        The reframe · min 25-30
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        The problem you're solving isn't the problem
      </h2>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2" style={{ fontFamily: "var(--zs-font-body)" }}>
        <div className="rounded-lg border border-[var(--zs-card-border)] bg-white p-6 opacity-60">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--zs-text-muted)]">
            You think
          </p>
          <p className="font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-sub)" }}>
            {reframe.prospectThinks}
          </p>
        </div>
        <div className="rounded-lg border-2 p-6 shadow-lg" style={{ borderColor: "var(--zs-lime)", backgroundColor: "var(--zs-lime-glow)" }}>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
            Actually
          </p>
          <p className="font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-sub)" }}>
            {reframe.actualRoot}
          </p>
        </div>
      </div>
      <div className="max-w-4xl rounded-lg bg-[var(--zs-dark-bg)] p-6 text-[var(--zs-dark-text)]" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime)" }}>
          Why we see it this way
        </p>
        <p>{reframe.evidence}</p>
      </div>
    </section>
  );
}
