import { readSession } from "../../lib/discovery-session";

function formatKickoff(iso: string): string {
  if (!iso) return "Next Monday";
  try {
    return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function getRazorpayUrl(): string {
  if (typeof process !== "undefined" && process.env.VITE_RAZORPAY_RESERVATION_URL) {
    return process.env.VITE_RAZORPAY_RESERVATION_URL;
  }
  return import.meta.env.VITE_RAZORPAY_RESERVATION_URL ?? "#";
}

export default function DeckSlide12() {
  const session = readSession();
  const kickoff = formatKickoff(session?.kickoffDate ?? "");
  const rzpUrl = getRazorpayUrl();
  return (
    <section
      className="flex w-full flex-col items-center justify-center gap-8 p-16"
      style={{ backgroundColor: "var(--zs-dark-bg)", color: "var(--zs-dark-text)" }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime)" }}>
        Next 24 hours
      </p>
      <h2 className="font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        Lock in your sprint
      </h2>
      <ol className="max-w-3xl list-decimal space-y-2 pl-8" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        <li>&#8377;25K reservation today (Razorpay link below)</li>
        <li>MOU in 2 hours to your WhatsApp + email</li>
        <li>Balance &#8377;1.25L within 24 hours</li>
        <li>Kickoff on {kickoff}</li>
      </ol>
      <a
        href={rzpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl px-10 py-5 text-lg font-bold shadow"
        style={{
          backgroundColor: "var(--zs-lime)",
          color: "var(--zs-charcoal)",
          boxShadow: "0 0 30px var(--zs-lime-glow)",
        }}
      >
        Reserve &#8377;25K &mdash; Lock your slot
      </a>
    </section>
  );
}
