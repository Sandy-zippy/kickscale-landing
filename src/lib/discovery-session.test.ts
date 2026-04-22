import { describe, it, expect, beforeEach,  } from "vitest";
import {
  STORAGE_KEY,
  DRAFT_MAX_AGE_MS,
  SESSION_MAX_AGE_MS,
  readSession,
  writeSession,
  clearSession,
  saveDraftBottleneck,
  readDraftBottlenecks,
  isSessionStale,
  type DiscoverySession,
} from "./discovery-session";

function validSession(overrides: Partial<DiscoverySession> = {}): DiscoverySession {
  return {
    company: "Acme Inc",
    name: "Priya Rao",
    cs1: "professional-services-lead-to-cash",
    cs2: "auto-parts-distribution-order-automation",
    kickoffDate: "2026-04-27",
    contactId: "ghl_123",
    phoneE164: "+919876543210",
    sessionStartedAt: new Date().toISOString(),
    draftBottlenecks: { b1: "", b2: "", b3: "", savedAt: "" },
    ...overrides,
  };
}

describe("discovery-session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("STORAGE_KEY is versioned to avoid collisions", () => {
    expect(STORAGE_KEY).toBe("zippy_discovery_session_v1");
  });

  it("writeSession + readSession round-trips", () => {
    const s = validSession();
    writeSession(s);
    expect(readSession()).toEqual(s);
  });

  it("readSession returns null when key missing", () => {
    expect(readSession()).toBeNull();
  });

  it("readSession returns null on malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(readSession()).toBeNull();
  });

  it("clearSession removes the key", () => {
    writeSession(validSession());
    clearSession();
    expect(readSession()).toBeNull();
  });

  it("isSessionStale is false within 24h", () => {
    const fresh = validSession({
      sessionStartedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h ago
    });
    expect(isSessionStale(fresh)).toBe(false);
  });

  it("isSessionStale is true past 24h", () => {
    const old = validSession({
      sessionStartedAt: new Date(Date.now() - SESSION_MAX_AGE_MS - 1000).toISOString(),
    });
    expect(isSessionStale(old)).toBe(true);
  });

  it("saveDraftBottleneck writes bottleneck + updates savedAt", () => {
    writeSession(validSession());
    saveDraftBottleneck("b2", "whatsapp chaos");
    const drafts = readDraftBottlenecks();
    expect(drafts?.b2).toBe("whatsapp chaos");
    expect(drafts?.savedAt).toBeTruthy();
  });

  it("readDraftBottlenecks returns null if draft older than 2h", () => {
    const s = validSession({
      draftBottlenecks: {
        b1: "old draft",
        b2: "",
        b3: "",
        savedAt: new Date(Date.now() - DRAFT_MAX_AGE_MS - 1000).toISOString(),
      },
    });
    writeSession(s);
    expect(readDraftBottlenecks()).toBeNull();
  });
});
