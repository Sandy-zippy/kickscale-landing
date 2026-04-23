import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { initSession, writeSession } from "../lib/discovery-session";
import { generateAudit, type Industry, type AutomationArea } from "../lib/audit-generator";

const VALID_INDUSTRIES: Industry[] = [
  "manufacturing",
  "professional-services",
  "retail",
  "healthcare",
  "hospitality",
  "education",
  "construction",
  "it-software",
  "real-estate",
  "other",
];

const VALID_AREAS: AutomationArea[] = [
  "lead-flow",
  "invoice-payment",
  "reports",
  "whatsapp-followups",
  "retention",
  "ai-voice-chat",
  "inventory-orders",
  "hr-payroll",
  "special-internal",
  "other",
];

function nextMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
}

function parseIndustry(raw: string | null): Industry {
  if (!raw) return "other";
  const normalized = raw.toLowerCase().trim().replace(/\s+/g, "-");
  return (VALID_INDUSTRIES.includes(normalized as Industry)
    ? (normalized as Industry)
    : "other");
}

function parseTickedAreas(raw: string | null): AutomationArea[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter((s) => VALID_AREAS.includes(s as AutomationArea)) as AutomationArea[];
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

    const industry = parseIndustry(params.get("industry"));
    const tickedAreas = parseTickedAreas(params.get("ticked"));

    const audit = generateAudit({
      industry,
      company,
      tickedAreas,
      revenueBand: params.get("revenue") ?? undefined,
    });

    const session = initSession({
      company,
      name,
      industry,
      tickedAreas,
      contactId: params.get("contactId") ?? "",
      phoneE164: params.get("phone") ?? "",
      kickoffDate: params.get("kickoff") ?? nextMonday(),
      sessionStartedAt: new Date().toISOString(),
      audit,
      coi: audit.coiDefaults,
      sprintCount: Math.min(3, Math.max(1, tickedAreas.length <= 4 ? 1 : tickedAreas.length <= 8 ? 2 : 3)) as 1 | 2 | 3,
    });
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
