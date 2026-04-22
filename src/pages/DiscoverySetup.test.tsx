import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DiscoverySetup from "./DiscoverySetup";
import { readSession } from "../lib/discovery-session";

function renderAt(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/discovery/setup" element={<DiscoverySetup />} />
        <Route path="/discovery" element={<div>DECK</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("DiscoverySetup", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes session from query params and redirects to /discovery", async () => {
    renderAt(
      "/discovery/setup?company=Acme&name=Priya&cs1=professional-services-lead-to-cash&cs2=auto-parts-distribution-order-automation&kickoff=2026-04-27&contactId=ghl_abc&phone=%2B919876543210"
    );
    const session = readSession();
    expect(session?.company).toBe("Acme");
    expect(session?.name).toBe("Priya");
    expect(session?.cs1).toBe("professional-services-lead-to-cash");
    expect(session?.phoneE164).toBe("+919876543210");
    expect(await screen.findByText("DECK")).toBeDefined();
  });

  it("auto-computes kickoffDate to next Monday if missing", () => {
    renderAt("/discovery/setup?company=Acme&name=Priya");
    const session = readSession();
    expect(session?.kickoffDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d = new Date(session!.kickoffDate + "T00:00:00Z");
    expect(d.getUTCDay()).toBe(1);
  });

  it("shows error banner if required params missing", () => {
    renderAt("/discovery/setup");
    expect(screen.getByText(/missing/i)).toBeDefined();
    expect(readSession()).toBeNull();
  });
});
