import { useState, useEffect, useMemo } from "react";
import { readSession, patchCOI } from "../../lib/discovery-session";

function inrLakh(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function COICalculator() {
  const session = readSession();
  const [inputs, setInputs] = useState(
    session?.coi ?? {
      leadsPerMonth: 50,
      closeRatePct: 15,
      avgDealInr: 50000,
      followUpDelayPct: 50,
    }
  );

  useEffect(() => {
    patchCOI(inputs);
  }, [inputs]);

  // Cost of Inaction: leads * (closeRate/100) * avgDeal * (followUpDelay/100)
  // = revenue forgone because of follow-up breakage
  const monthlyLoss = useMemo(() => {
    return (
      inputs.leadsPerMonth *
      (inputs.closeRatePct / 100) *
      inputs.avgDealInr *
      (inputs.followUpDelayPct / 100)
    );
  }, [inputs]);

  const annualLoss = monthlyLoss * 12;

  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-12">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        Cost of inaction · min 30-35
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        Let's put a number on it
      </h2>
      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-2" style={{ fontFamily: "var(--zs-font-body)" }}>
        <div className="flex flex-col gap-4">
          <Input label="Leads per month" value={inputs.leadsPerMonth} onChange={(v) => setInputs({ ...inputs, leadsPerMonth: v })} suffix="leads" />
          <Input label="Close rate %" value={inputs.closeRatePct} onChange={(v) => setInputs({ ...inputs, closeRatePct: v })} suffix="%" />
          <Input label="Average deal size" value={inputs.avgDealInr} onChange={(v) => setInputs({ ...inputs, avgDealInr: v })} suffix="₹" />
          <Input label="% of leads with stale / late follow-up" value={inputs.followUpDelayPct} onChange={(v) => setInputs({ ...inputs, followUpDelayPct: v })} suffix="%" />
        </div>
        <div className="flex flex-col gap-4 rounded-lg bg-[var(--zs-dark-bg)] p-6 text-[var(--zs-dark-text)]">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime)" }}>
            What this is costing you
          </p>
          <div>
            <p className="text-sm text-[var(--zs-text-muted)]">Monthly revenue forgone</p>
            <p className="font-bold" style={{ fontFamily: "var(--zs-font-mono)", fontSize: "var(--zs-deck-heading)", color: "var(--zs-lime)" }}>
              {inrLakh(monthlyLoss)}
            </p>
          </div>
          <div>
            <p className="text-sm text-[var(--zs-text-muted)]">Annual leakage</p>
            <p className="font-bold" style={{ fontFamily: "var(--zs-font-mono)", fontSize: "var(--zs-deck-sub)" }}>
              {inrLakh(annualLoss)}
            </p>
          </div>
          <div className="mt-2 rounded border border-[var(--zs-lime)] p-3 text-sm">
            <p className="text-[var(--zs-dark-text)]">
              The ₹1.5L sprint pays back in{" "}
              <strong style={{ color: "var(--zs-lime)" }}>
                {monthlyLoss > 0 ? (150000 / monthlyLoss).toFixed(1) : "—"}
              </strong>{" "}
              months even if we recover half of the above.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--zs-card-border)] bg-white p-4">
      <label className="mb-2 block text-sm font-bold text-[var(--zs-text-muted)]">{label}</label>
      <div className="flex items-center gap-2">
        {suffix === "₹" && <span className="font-bold">₹</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="flex-1 rounded border border-[var(--zs-card-border)] bg-[var(--zs-cream-bg)] px-3 py-2 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[var(--zs-lime)]"
        />
        {suffix && suffix !== "₹" && <span className="text-sm text-[var(--zs-text-muted)]">{suffix}</span>}
      </div>
    </div>
  );
}
