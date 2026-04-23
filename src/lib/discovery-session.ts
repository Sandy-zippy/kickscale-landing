import type {
  AuditPackage,
  AutomationArea,
  Industry,
} from "./audit-generator";

export const STORAGE_KEY = "zippy_discovery_session_v2";
export const LEGACY_KEY_V1 = "zippy_discovery_session_v1";
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const DRAFT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export type QualifyState = {
  decisionMaker: "yes" | "no" | "partial" | null; // "partial" = needs partner
  budgetOk: "yes" | "no" | "unsure" | null;
  timing: "now" | "1-3mo" | "later" | null;
  trigger: string; // "what made you fill the quiz?"
};

export type COIInputs = {
  leadsPerMonth: number;
  closeRatePct: number;
  avgDealInr: number;
  followUpDelayPct: number;
};

export type SessionFindings = {
  f1: { keep: boolean; override: string }; // Bhargav may edit finding text live
  f2: { keep: boolean; override: string };
  f3: { keep: boolean; override: string };
  confirmedAt: string; // ISO8601 when Bhargav locks findings
};

export type DiscoverySession = {
  // Prefilled on /discovery/setup
  company: string;
  name: string;
  industry: Industry;
  tickedAreas: AutomationArea[];
  contactId: string;
  phoneE164: string;
  kickoffDate: string; // YYYY-MM-DD
  sessionStartedAt: string;

  // Generated on first load from audit-generator
  audit: AuditPackage | null;

  // Captured live on call
  qualify: QualifyState;
  findings: SessionFindings;
  coi: COIInputs;
  triedBefore: string; // free-text "what have you tried"
  sprintCount: 1 | 2 | 3;

  // Final stage
  depositRequestedAt: string; // ISO when LockIn button clicked
};

function defaultSession(partial: Partial<DiscoverySession>): DiscoverySession {
  return {
    company: "",
    name: "",
    industry: "other",
    tickedAreas: [],
    contactId: "",
    phoneE164: "",
    kickoffDate: "",
    sessionStartedAt: new Date().toISOString(),
    audit: null,
    qualify: {
      decisionMaker: null,
      budgetOk: null,
      timing: null,
      trigger: "",
    },
    findings: {
      f1: { keep: true, override: "" },
      f2: { keep: true, override: "" },
      f3: { keep: true, override: "" },
      confirmedAt: "",
    },
    coi: { leadsPerMonth: 0, closeRatePct: 0, avgDealInr: 0, followUpDelayPct: 0 },
    triedBefore: "",
    sprintCount: 1,
    depositRequestedAt: "",
    ...partial,
  };
}

function safeParse(raw: string | null): DiscoverySession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as DiscoverySession;
  } catch {
    return null;
  }
}

export function readSession(): DiscoverySession | null {
  if (typeof localStorage === "undefined") return null;
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function writeSession(session: DiscoverySession): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_KEY_V1);
}

export function isSessionStale(session: DiscoverySession): boolean {
  const started = Date.parse(session.sessionStartedAt);
  if (Number.isNaN(started)) return true;
  return Date.now() - started > SESSION_MAX_AGE_MS;
}

export function initSession(partial: Partial<DiscoverySession>): DiscoverySession {
  return defaultSession(partial);
}

export function patchSession(patch: Partial<DiscoverySession>): DiscoverySession | null {
  const current = readSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  writeSession(next);
  return next;
}

// Deep-patch helper for nested fields (qualify, findings, coi)
export function patchQualify(patch: Partial<QualifyState>): void {
  const s = readSession();
  if (!s) return;
  writeSession({ ...s, qualify: { ...s.qualify, ...patch } });
}

export function patchCOI(patch: Partial<COIInputs>): void {
  const s = readSession();
  if (!s) return;
  writeSession({ ...s, coi: { ...s.coi, ...patch } });
}

export function setFindings(findings: SessionFindings): void {
  const s = readSession();
  if (!s) return;
  writeSession({ ...s, findings });
}

export function setSprintCount(n: 1 | 2 | 3): void {
  const s = readSession();
  if (!s) return;
  writeSession({ ...s, sprintCount: n });
}

// Legacy v1 compatibility — only readSession used to return v1 shape
// The old test file may still exist; we keep just enough types exported
// under legacy names so deleting the old test doesn't break a mid-commit.
export type DraftBottlenecks = {
  b1: string;
  b2: string;
  b3: string;
  savedAt: string;
};

/** @deprecated v1 API — kept to avoid breaking old tests mid-transition */
export function saveDraftBottleneck(): void {
  /* no-op in v2; old slide 4 is being removed */
}

/** @deprecated v1 API */
export function readDraftBottlenecks(): DraftBottlenecks | null {
  return null;
}
