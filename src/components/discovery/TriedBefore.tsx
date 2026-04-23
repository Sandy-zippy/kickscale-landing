import { useState, useEffect } from "react";
import { readSession, patchSession } from "../../lib/discovery-session";

export default function TriedBefore() {
  const session = readSession();
  const [text, setText] = useState(session?.triedBefore ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      patchSession({ triedBefore: text });
    }, 500);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-12">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        Min 35-40 · The contrast
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        What have you tried before?
      </h2>
      <p className="max-w-3xl text-center text-[var(--zs-text-secondary)]" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        Hired more people? Freelancer? Agency? In-house tools? Each answer tells us why it didn't stick — and where we slot in differently.
      </p>
      <div className="w-full max-w-4xl">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Capture verbatim: what they tried, what stuck, what didn't..."
          className="w-full rounded-lg border border-[var(--zs-card-border)] bg-white px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--zs-lime)]"
          style={{ fontFamily: "var(--zs-font-body)" }}
        />
      </div>
      <div className="max-w-3xl rounded-lg bg-[var(--zs-cream-bg)] p-4 text-sm text-[var(--zs-text-secondary)]" data-role="presenter-chrome">
        <strong>Bhargav prompts:</strong> &quot;What specifically didn't stick?&quot; The answer IS the scope-differentiator for our sprint. Use it to contrast in the next slide.
      </div>
    </section>
  );
}
