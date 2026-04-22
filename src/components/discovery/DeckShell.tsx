import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useExportMode } from "../../contexts/ExportModeContext";

type Props = {
  slides: ReactNode[];
};

export default function DeckShell({ slides }: Props) {
  const [idx, setIdx] = useState(0);
  const { mode } = useExportMode();
  const isExport = mode === "client-pdf";
  const total = slides.length;

  const next = useCallback(
    () => setIdx((i) => Math.min(i + 1, total - 1)),
    [total]
  );
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    let cancelled = false;
    const ready = () => {
      if (cancelled) return;
      // @ts-expect-error custom global
      window.__deckReady = true;
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(ready);
    } else {
      ready();
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ backgroundColor: "var(--zs-cream-bg)" }}
    >
      <div
        className="relative mx-auto flex min-h-screen w-full max-w-[1920px] items-center justify-center"
        data-deck-ready="true"
      >
        {slides[idx]}
      </div>
      {!isExport && (
        <nav
          aria-label="Deck nav"
          data-role="presenter-chrome"
          className="fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--zs-card-border)] bg-white px-5 py-2 text-sm shadow"
        >
          <button
            onClick={prev}
            disabled={idx === 0}
            aria-label="Previous slide"
            className="rounded px-2 py-1 hover:bg-[var(--zs-cream-bg)] disabled:opacity-30"
          >
            &larr;
          </button>
          <span
            className="font-mono text-xs text-[var(--zs-text-muted)]"
            aria-live="polite"
          >
            {idx + 1} / {total}
          </span>
          <button
            onClick={next}
            disabled={idx >= total - 1}
            aria-label="Next slide"
            className="rounded px-2 py-1 hover:bg-[var(--zs-cream-bg)] disabled:opacity-30"
          >
            &rarr;
          </button>
        </nav>
      )}
    </div>
  );
}
