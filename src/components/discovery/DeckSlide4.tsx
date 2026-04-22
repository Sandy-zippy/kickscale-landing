import { useEffect, useRef, useState } from "react";
import { readSession, saveDraftBottleneck } from "../../lib/discovery-session";

type BottleneckKey = "b1" | "b2" | "b3";

type Props = {
  onSubmit: (bullets: Record<BottleneckKey, string>) => void;
};

const LABELS: Record<BottleneckKey, string> = {
  b1: "Bottleneck 1",
  b2: "Bottleneck 2",
  b3: "Bottleneck 3",
};

export default function DeckSlide4({ onSubmit }: Props) {
  const [bullets, setBullets] = useState<Record<BottleneckKey, string>>({
    b1: "",
    b2: "",
    b3: "",
  });
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const session = readSession();
    if (!session) return;
    const { draftBottlenecks } = session;
    if (draftBottlenecks.savedAt) {
      setBullets({
        b1: draftBottlenecks.b1 ?? "",
        b2: draftBottlenecks.b2 ?? "",
        b3: draftBottlenecks.b3 ?? "",
      });
    }
  }, []);

  function onChange(which: BottleneckKey, value: string) {
    if (locked) return;
    setBullets((b) => ({ ...b, [which]: value }));
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveDraftBottleneck(which, value);
    }, 500);
  }

  const canSubmit = bullets.b1.trim() && bullets.b2.trim() && bullets.b3.trim();

  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 p-16">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--zs-lime-dark)" }}>
        What I saw
      </p>
      <h2 className="text-center font-bold" style={{ fontFamily: "var(--zs-font-heading)", fontSize: "var(--zs-deck-heading)" }}>
        3 bottlenecks bleeding you right now
      </h2>
      <div className="grid w-full max-w-4xl grid-cols-1 gap-4" style={{ fontFamily: "var(--zs-font-body)", fontSize: "var(--zs-deck-body)" }}>
        {(["b1", "b2", "b3"] as BottleneckKey[]).map((k) => (
          <div key={k} className="rounded-lg border border-[var(--zs-card-border)] bg-white p-5">
            <label htmlFor={`bottleneck-${k}`} className="mb-2 block text-sm font-bold text-[var(--zs-text-muted)]">
              {LABELS[k]}
            </label>
            <input
              id={`bottleneck-${k}`}
              type="text"
              value={bullets[k]}
              maxLength={100}
              disabled={locked}
              onChange={(e) => onChange(k, e.target.value)}
              className="w-full rounded border border-[var(--zs-card-border)] px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--zs-lime)]"
              placeholder="3-5 keyword bullet"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        data-role="presenter-chrome"
        disabled={!canSubmit || locked}
        onClick={() => {
          setLocked(true);
          onSubmit(bullets);
        }}
        className="rounded-xl bg-[var(--zs-lime)] px-8 py-4 text-lg font-bold text-[var(--zs-charcoal)] shadow disabled:opacity-40"
      >
        Lock &amp; Submit
      </button>
    </section>
  );
}
