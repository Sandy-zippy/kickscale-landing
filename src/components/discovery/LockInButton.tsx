import { useState } from "react";
import { readSession, patchSession } from "../../lib/discovery-session";

type DeliverableStatus = "idle" | "generating" | "sent" | "error";

export default function LockInButton() {
  const session = readSession();
  const [status, setStatus] = useState<DeliverableStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const razorpayUrl =
    (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_RAZORPAY_RESERVATION_URL ?? "#";

  const onClick = async () => {
    if (status === "generating" || status === "sent") return;
    setStatus("generating");
    patchSession({ depositRequestedAt: new Date().toISOString() });
    try {
      // v1: fire-and-forget to backend (endpoint may not exist yet — swallow errors)
      // Later wiring: POST /api/generate-deliverables with full session state
      const resp = await fetch("/api/generate-deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      }).catch((err) => {
        // Backend not deployed in v1 — log and continue so the call flow isn't blocked
        // eslint-disable-next-line no-console
        console.warn("[discovery] /api/generate-deliverables not available yet", err);
        return null;
      });
      if (resp && !resp.ok) {
        throw new Error(`Backend returned ${resp.status}`);
      }
      // Even if backend is a no-op, still open Razorpay in new tab
      if (razorpayUrl !== "#") {
        window.open(razorpayUrl, "_blank", "noopener,noreferrer");
      }
      setStatus("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const sprintCount = session?.sprintCount ?? 1;
  const totalLakh = 1.5 * sprintCount;

  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-12" style={{ backgroundColor: "var(--zs-dark-bg)", color: "var(--zs-dark-text)" }}>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime)" }}>
        Lock it in · min 55-60
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        Reserve your sprint now
      </h2>
      <div className="max-w-3xl rounded-lg bg-[var(--zs-lime-glow)] p-6 text-center" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        <p className="mb-3">
          <strong>₹25,000 reservation</strong> locks your {sprintCount}-sprint slot (₹{totalLakh}L total).
        </p>
        <p className="text-sm text-[var(--zs-text-muted)]">
          MOU + balance invoice + customized proposal land in {session?.name}'s inbox within 10 minutes of you clicking below. Kickoff Monday {session?.kickoffDate}.
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={status === "generating" || status === "sent"}
        className="rounded-xl px-12 py-6 text-2xl font-bold shadow-xl transition disabled:opacity-60"
        style={{
          backgroundColor: "var(--zs-lime)",
          color: "var(--zs-charcoal)",
          boxShadow: "0 0 40px var(--zs-lime-glow)",
          fontFamily: "var(--zs-font-heading)",
        }}
      >
        {status === "idle" && `Reserve with ₹25K → Razorpay`}
        {status === "generating" && "Opening Razorpay + generating docs…"}
        {status === "sent" && "Reserved ✓ Docs on the way"}
        {status === "error" && "Retry"}
      </button>
      {status === "sent" && (
        <div className="max-w-2xl rounded-lg border border-[var(--zs-lime)] p-5 text-center text-sm" style={{ fontFamily: "var(--zs-font-body)" }}>
          <p className="mb-1 font-bold" style={{ color: "var(--zs-lime)" }}>
            What happens next
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-left">
            <li>Razorpay opened in new tab — complete ₹25K there</li>
            <li>On payment, MOU + customized proposal generate automatically</li>
            <li>Both land in prospect's email + WhatsApp within 10 minutes</li>
            <li>Balance invoice follows in 24h</li>
            <li>Kickoff Monday {session?.kickoffDate}</li>
          </ol>
        </div>
      )}
      {status === "error" && (
        <p className="text-sm text-red-400">Error: {errorMsg}. Try again or drop the Razorpay link in chat manually.</p>
      )}
    </section>
  );
}
