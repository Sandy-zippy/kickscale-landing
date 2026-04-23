import { useState } from "react";
import { readSession, setFindings } from "../../lib/discovery-session";

export default function PreCallAudit() {
  const session = readSession();
  const [locked, setLocked] = useState(!!session?.findings.confirmedAt);
  const [overrides, setOverrides] = useState({
    f1: session?.findings.f1.override ?? "",
    f2: session?.findings.f2.override ?? "",
    f3: session?.findings.f3.override ?? "",
  });
  const [keep, setKeep] = useState({
    f1: session?.findings.f1.keep ?? true,
    f2: session?.findings.f2.keep ?? true,
    f3: session?.findings.f3.keep ?? true,
  });

  if (!session?.audit) {
    return (
      <section className="flex w-full flex-col items-center justify-center p-16 text-center">
        <p className="text-[var(--zs-text-muted)]">Audit not generated. Re-run /discovery/setup with ticked=... params.</p>
      </section>
    );
  }

  const { findings } = session.audit;

  const save = () => {
    setFindings({
      f1: { keep: keep.f1, override: overrides.f1 },
      f2: { keep: keep.f2, override: overrides.f2 },
      f3: { keep: keep.f3, override: overrides.f3 },
      confirmedAt: new Date().toISOString(),
    });
    setLocked(true);
  };

  return (
    <section className="flex w-full flex-col items-center justify-center gap-6 p-12">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        Pre-call audit · 3 things bleeding you
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        What we saw before we got on
      </h2>
      <p className="max-w-3xl text-center text-[var(--zs-text-secondary)]" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        Based on your quiz + what we see in {session.company}'s stack archetype. Walk through, edit live, lock when the prospect confirms.
      </p>
      <div className="grid w-full max-w-5xl grid-cols-1 gap-4" style={{ fontFamily: "var(--zs-font-body)" }}>
        {([0, 1, 2] as const).map((i) => {
          const finding = findings[i];
          const k = (`f${i + 1}`) as "f1" | "f2" | "f3";
          return (
            <div
              key={i}
              className={`rounded-lg border bg-white p-5 ${
                keep[k] ? "border-[var(--zs-card-border)]" : "border-red-300 opacity-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
                    Finding {i + 1}
                  </p>
                  <p className="mb-2 font-bold" style={{ fontSize: "var(--zs-deck-sub)" }}>
                    {finding.title}
                  </p>
                  <p className="mb-2 text-[var(--zs-text-secondary)]">{finding.evidence}</p>
                  <p className="mb-3 text-sm font-bold" style={{ color: "var(--zs-charcoal)" }}>
                    💰 {finding.impact}
                  </p>
                  {!locked && (
                    <textarea
                      value={overrides[k]}
                      onChange={(e) => setOverrides((o) => ({ ...o, [k]: e.target.value }))}
                      rows={2}
                      placeholder="Optional: sharpen the finding using their words..."
                      className="w-full rounded border border-[var(--zs-card-border)] bg-[var(--zs-cream-bg)] px-3 py-2 text-sm"
                    />
                  )}
                  {locked && overrides[k] && (
                    <p className="mt-2 rounded bg-[var(--zs-cream-bg)] px-3 py-2 text-sm italic">
                      Override: {overrides[k]}
                    </p>
                  )}
                </div>
                {!locked && (
                  <button
                    type="button"
                    onClick={() => setKeep((kk) => ({ ...kk, [k]: !kk[k] }))}
                    className={`rounded-lg px-3 py-1 text-xs font-bold ${
                      keep[k] ? "bg-[var(--zs-lime)] text-[var(--zs-charcoal)]" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {keep[k] ? "Keep" : "Skip"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!locked && (
        <button
          type="button"
          onClick={save}
          data-role="presenter-chrome"
          className="rounded-xl bg-[var(--zs-lime)] px-8 py-4 text-lg font-bold text-[var(--zs-charcoal)] shadow"
        >
          Lock findings &amp; move on
        </button>
      )}
      {locked && (
        <p className="text-sm text-[var(--zs-green)]">✓ Findings locked at {new Date(session.findings.confirmedAt).toLocaleTimeString()}</p>
      )}
    </section>
  );
}
