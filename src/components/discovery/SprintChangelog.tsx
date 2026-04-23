import { useMemo } from "react";
import { readSession, setSprintCount } from "../../lib/discovery-session";
import type { SprintScope } from "../../lib/audit-generator";

export default function SprintChangelog() {
  const session = readSession();
  const audit = session?.audit;

  const tickedCount = session?.tickedAreas.length ?? 0;
  const recommended = useMemo<1 | 2 | 3>(() => {
    if (tickedCount <= 4) return 1;
    if (tickedCount <= 8) return 2;
    return 3;
  }, [tickedCount]);
  const selected = session?.sprintCount ?? recommended;

  if (!audit) {
    return (
      <section className="flex w-full flex-col items-center justify-center p-16 text-center">
        <p className="text-[var(--zs-text-muted)]">Sprint plan unavailable. Run /discovery/setup first.</p>
      </section>
    );
  }

  const sprints: SprintScope[] = [audit.sprint1];
  if (audit.sprint2Preview) sprints.push(audit.sprint2Preview);
  if (audit.sprint3Preview) sprints.push(audit.sprint3Preview);

  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-12">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        What we'd build · min 40-48
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        Your sprint, fixed scope, 4 weeks each
      </h2>
      <div className="flex items-center gap-3 rounded-lg bg-[var(--zs-cream-bg)] p-3 text-sm" data-role="presenter-chrome">
        <span className="text-[var(--zs-text-muted)]">Recommended:</span>
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => setSprintCount(n as 1 | 2 | 3)}
            className={`rounded px-3 py-1 font-bold transition ${
              selected === n
                ? "bg-[var(--zs-lime)] text-[var(--zs-charcoal)]"
                : "bg-white text-[var(--zs-text-muted)] hover:bg-[var(--zs-lime-glow)]"
            }`}
          >
            {n} sprint{n > 1 ? "s" : ""}
          </button>
        ))}
        <span className="text-xs text-[var(--zs-text-muted)]">
          ({tickedCount} ticked areas → auto-suggest {recommended})
        </span>
      </div>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-3" style={{ fontFamily: "var(--zs-font-body)" }}>
        {sprints.map((s, idx) => (
          <div
            key={s.sprintNumber}
            className={`flex flex-col gap-3 rounded-lg border-2 bg-white p-5 ${
              idx < selected ? "border-[var(--zs-lime)]" : "border-[var(--zs-card-border)] opacity-50"
            }`}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
                Sprint {s.sprintNumber}
                {idx < selected ? " · locked" : " · preview"}
              </p>
              <p className="mt-1 font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-sub)" }}>
                {s.title}
              </p>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-[var(--zs-deck-body)]">
              {s.automations.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="mt-2 border-t border-[var(--zs-card-border)] pt-2 text-xs text-[var(--zs-text-muted)]">
              <p className="mb-1 font-bold">Week-by-week</p>
              <ol className="list-decimal space-y-0.5 pl-4">
                {s.weekByWeek.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
