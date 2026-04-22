import { useState } from "react";
import { readSession } from "../../lib/discovery-session";

function buildRecap(): string {
  const s = readSession();
  if (!s) return "Session not loaded.";
  const b = s.draftBottlenecks;
  const rzp =
    (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_RAZORPAY_RESERVATION_URL ?? "";
  return [
    `Hi ${s.name},`,
    ``,
    `Great call. Quick recap for ${s.company}:`,
    ``,
    `Top 3 bottlenecks:`,
    `1. ${b.b1}`,
    `2. ${b.b2}`,
    `3. ${b.b3}`,
    ``,
    `Sprint: 4 weeks, ₹1.5L flat. Kickoff Monday ${s.kickoffDate}.`,
    ``,
    `Reservation link: ${rzp}`,
    ``,
    `MOU + balance invoice land within 2 hours.`,
    ``,
    `— Bhargav`,
  ].join("\n");
}

export default function DeckSummaryCopyButton() {
  const [copied, setCopied] = useState(false);
  async function onClick() {
    const text = buildRecap();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard permission denied; no-op (Bhargav can read from UI)
    }
  }
  return (
    <button
      type="button"
      data-role="presenter-chrome"
      onClick={onClick}
      className="fixed right-4 top-4 rounded-lg border border-[var(--zs-card-border)] bg-white px-4 py-2 text-sm font-bold shadow hover:bg-[var(--zs-cream-bg)]"
    >
      {copied ? "Copied ✓" : "Copy recap"}
    </button>
  );
}
