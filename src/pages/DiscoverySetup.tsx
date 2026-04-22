import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { writeSession, type DiscoverySession } from "../lib/discovery-session";

function nextMonday(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0 Sun .. 6 Sat
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
}

export default function DiscoverySetup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const company = params.get("company")?.trim() ?? "";
    const name = params.get("name")?.trim() ?? "";
    if (!company || !name) {
      setError(
        "Missing required setup params. Open from GHL workflow link (expects ?company=...&name=...)."
      );
      return;
    }
    const session: DiscoverySession = {
      company,
      name,
      cs1: params.get("cs1") ?? "",
      cs2: params.get("cs2") ?? "",
      kickoffDate: params.get("kickoff") ?? nextMonday(),
      contactId: params.get("contactId") ?? "",
      phoneE164: params.get("phone") ?? "",
      sessionStartedAt: new Date().toISOString(),
      draftBottlenecks: { b1: "", b2: "", b3: "", savedAt: "" },
    };
    writeSession(session);
    navigate("/discovery", { replace: true });
  }, [params, navigate]);

  if (error) {
    return (
      <main
        className="flex min-h-screen items-center justify-center p-8"
        style={{ backgroundColor: "var(--zs-cream-bg)" }}
      >
        <div className="max-w-lg rounded-lg border border-[var(--zs-card-border)] bg-white p-6">
          <h1
            className="mb-2 text-2xl font-bold"
            style={{ fontFamily: "var(--zs-font-heading)" }}
          >
            Setup incomplete
          </h1>
          <p className="text-[var(--zs-text-secondary)]">{error}</p>
        </div>
      </main>
    );
  }

  return null;
}
