import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExportModeProvider } from "../contexts/ExportModeContext";
import Discovery from "./Discovery";
import { writeSession } from "../lib/discovery-session";

function seed() {
  writeSession({
    company: "Acme",
    name: "Priya",
    cs1: "", cs2: "",
    kickoffDate: "2026-04-27",
    contactId: "ghl_123",
    phoneE164: "+919876543210",
    sessionStartedAt: new Date().toISOString(),
    draftBottlenecks: { b1: "", b2: "", b3: "", savedAt: "" },
  });
}

describe("Discovery page", () => {
  beforeEach(() => localStorage.clear());

  it("renders the deck shell + slide 1 by default", () => {
    seed();
    render(
      <MemoryRouter initialEntries={["/discovery"]}>
        <ExportModeProvider>
          <Discovery />
        </ExportModeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Acme/)).toBeDefined();
  });

  it("still renders without session (uses 'Your Company' fallback)", () => {
    render(
      <MemoryRouter initialEntries={["/discovery"]}>
        <ExportModeProvider>
          <Discovery />
        </ExportModeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/Your Company/)).toBeDefined();
  });
});
