export default function DeckLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--zs-cream-bg)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4"
          style={{
            borderColor: "var(--zs-card-border)",
            borderTopColor: "var(--zs-lime)",
          }}
        />
        <p
          className="text-lg font-bold"
          style={{
            fontFamily: "var(--zs-font-heading)",
            color: "var(--zs-charcoal)",
          }}
        >
          Loading ZippyScale&hellip;
        </p>
      </div>
    </div>
  );
}
