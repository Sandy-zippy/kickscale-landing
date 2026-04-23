import { useState, useEffect } from "react";
import { readSession, patchQualify } from "../../lib/discovery-session";
import type { QualifyState } from "../../lib/discovery-session";

type Choice<T extends string> = { value: T; label: string };

const DECISION_CHOICES: Choice<NonNullable<QualifyState["decisionMaker"]>>[] = [
  { value: "yes", label: "Yes, I decide" },
  { value: "partial", label: "With partner/spouse" },
  { value: "no", label: "Someone else signs" },
];

const BUDGET_CHOICES: Choice<NonNullable<QualifyState["budgetOk"]>>[] = [
  { value: "yes", label: "₹1.5L is workable" },
  { value: "unsure", label: "Need to check cash" },
  { value: "no", label: "That's too high" },
];

const TIMING_CHOICES: Choice<NonNullable<QualifyState["timing"]>>[] = [
  { value: "now", label: "Now / this month" },
  { value: "1-3mo", label: "1-3 months" },
  { value: "later", label: "Just exploring" },
];

export default function QualifyGrid() {
  const session = readSession();
  const [qualify, setQualify] = useState<QualifyState>(
    session?.qualify ?? {
      decisionMaker: null,
      budgetOk: null,
      timing: null,
      trigger: "",
    }
  );

  useEffect(() => {
    patchQualify(qualify);
  }, [qualify]);

  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-16">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        Quick qualification (min 10-15)
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        Before we diagnose
      </h2>
      <div
        className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3"
        style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}
      >
        <QualifyCard label="Who decides?" choices={DECISION_CHOICES} value={qualify.decisionMaker}
          onChange={(v) => setQualify((q) => ({ ...q, decisionMaker: v }))} />
        <QualifyCard label="Is ₹1.5L workable?" choices={BUDGET_CHOICES} value={qualify.budgetOk}
          onChange={(v) => setQualify((q) => ({ ...q, budgetOk: v }))} />
        <QualifyCard label="Timing?" choices={TIMING_CHOICES} value={qualify.timing}
          onChange={(v) => setQualify((q) => ({ ...q, timing: v }))} />
      </div>
      <div className="w-full max-w-5xl">
        <label className="mb-2 block text-sm font-bold text-[var(--zs-text-muted)]">
          What made you fill the quiz today? (capture verbatim)
        </label>
        <textarea
          value={qualify.trigger}
          onChange={(e) => setQualify((q) => ({ ...q, trigger: e.target.value }))}
          rows={2}
          placeholder="e.g. 'orders bleeding through whatsapp groups'"
          className="w-full rounded-lg border border-[var(--zs-card-border)] bg-white px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--zs-lime)]"
          style={{ fontFamily: "var(--zs-font-body)" }}
        />
      </div>
    </section>
  );
}

function QualifyCard<T extends string>({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: Choice<T>[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--zs-card-border)] bg-white p-5">
      <p className="mb-3 text-sm font-bold text-[var(--zs-text-muted)]">{label}</p>
      <div className="flex flex-col gap-2">
        {choices.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={`rounded-lg border px-4 py-3 text-left transition ${
              value === c.value
                ? "border-[var(--zs-lime)] bg-[var(--zs-lime-glow)] font-bold"
                : "border-[var(--zs-card-border)] hover:bg-[var(--zs-cream-bg)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
