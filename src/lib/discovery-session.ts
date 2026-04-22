export const STORAGE_KEY = "zippy_discovery_session_v1";
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const DRAFT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export type DraftBottlenecks = {
  b1: string;
  b2: string;
  b3: string;
  savedAt: string; // ISO8601
};

export type DiscoverySession = {
  company: string;
  name: string;
  cs1: string;
  cs2: string;
  kickoffDate: string; // ISO date YYYY-MM-DD
  contactId: string;
  phoneE164: string;
  sessionStartedAt: string; // ISO8601
  draftBottlenecks: DraftBottlenecks;
};

function safeParse(raw: string | null): DiscoverySession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DiscoverySession;
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed;
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
}

export function isSessionStale(session: DiscoverySession): boolean {
  const started = Date.parse(session.sessionStartedAt);
  if (Number.isNaN(started)) return true;
  return Date.now() - started > SESSION_MAX_AGE_MS;
}

export function saveDraftBottleneck(
  which: "b1" | "b2" | "b3",
  value: string
): void {
  const session = readSession();
  if (!session) return;
  session.draftBottlenecks = {
    ...session.draftBottlenecks,
    [which]: value,
    savedAt: new Date().toISOString(),
  };
  writeSession(session);
}

export function readDraftBottlenecks(): DraftBottlenecks | null {
  const session = readSession();
  if (!session) return null;
  const { savedAt } = session.draftBottlenecks;
  if (!savedAt) return null;
  const age = Date.now() - Date.parse(savedAt);
  if (Number.isNaN(age) || age > DRAFT_MAX_AGE_MS) return null;
  return session.draftBottlenecks;
}
