import { readSession } from "../../lib/discovery-session";

const SLOTS_LEFT_THIS_MONTH: number = 2; // Hard-coded for v1; source from Sara's ops capacity later
const MONTH_LABEL = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

export default function InvestmentScarcity() {
  const session = readSession();
  const count = session?.sprintCount ?? 1;
  const totalLakh = 1.5 * count;

  const paymentPlan = count === 1
    ? "₹25K now + ₹1.25L in 24h"
    : count === 2
    ? "₹25K now + ₹1.25L in 24h. Sprint 2 starts month 2, ₹1.5L billed at kickoff."
    : "₹25K now + ₹1.25L in 24h. Sprint 2 + 3 billed ₹1.5L each at their kickoff.";

  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-12" style={{ backgroundColor: "var(--zs-dark-bg)", color: "var(--zs-dark-text)" }}>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime)" }}>
        Investment · min 48-55
      </p>
      <h2 className="font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        ₹{totalLakh} lakh
      </h2>
      <p className="max-w-2xl text-center" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-sub)" }}>
        {count === 1 ? "One sprint. 4 weeks. Fixed scope." : `${count} sprints. ${count * 4} weeks total. Each sprint fixed scope, no overruns.`}
      </p>
      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        <div className="rounded-lg border border-[var(--zs-lime)] p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime)" }}>
            Payment
          </p>
          <p>{paymentPlan}</p>
          <p className="mt-3 text-sm text-[var(--zs-text-muted)]">
            Razorpay (card / UPI / netbanking). No surprise fees. TDS deductible per Section 194J.
          </p>
        </div>
        <div className="rounded-lg bg-[var(--zs-lime)] p-5 text-[var(--zs-charcoal)]">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-charcoal)" }}>
            Capacity · {MONTH_LABEL}
          </p>
          <p className="font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-sub)" }}>
            {SLOTS_LEFT_THIS_MONTH} slot{SLOTS_LEFT_THIS_MONTH === 1 ? "" : "s"} left this month
          </p>
          <p className="mt-2 text-sm">
            We cap at 3 sprints per month so the specialist isn't spread thin. If {MONTH_LABEL} fills, next kickoff is the first Monday of the following month.
          </p>
        </div>
      </div>
      <div className="max-w-3xl rounded-lg border border-[var(--zs-lime)] bg-[var(--zs-dark-bg)] p-5 text-sm" style={{ fontFamily: "var(--zs-font-body)" }}>
        <p className="mb-1 font-bold" style={{ color: "var(--zs-lime)" }}>
          If you close today
        </p>
        <p>Week-0 audit thrown in free (₹40K standalone value). Expires when the call ends.</p>
      </div>
    </section>
  );
}
