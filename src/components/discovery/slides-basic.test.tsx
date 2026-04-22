import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DeckSlide1 from "./DeckSlide1";
import DeckSlide2 from "./DeckSlide2";
import DeckSlide3 from "./DeckSlide3";
import DeckSlide7 from "./DeckSlide7";
import DeckSlide8 from "./DeckSlide8";
import DeckSlide9 from "./DeckSlide9";
import DeckSlide10 from "./DeckSlide10";
import DeckSlide11 from "./DeckSlide11";
import { writeSession, STORAGE_KEY } from "../../lib/discovery-session";

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

describe("basic slides", () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });

  it("Slide 1 shows company name from session", () => {
    render(<DeckSlide1 />);
    expect(screen.getByText(/Acme/)).toBeDefined();
  });

  it("Slide 1 falls back to 'Your Company' if session missing", () => {
    localStorage.removeItem(STORAGE_KEY);
    render(<DeckSlide1 />);
    expect(screen.getByText(/Your Company/)).toBeDefined();
  });

  it("Slide 2 shows 'Today's agenda'", () => {
    render(<DeckSlide2 />);
    expect(screen.getByText(/agenda/i)).toBeDefined();
  });

  it("Slide 3 shows live-audit placeholder instructions", () => {
    render(<DeckSlide3 />);
    expect(screen.getByText(/live audit/i)).toBeDefined();
  });

  it("Slide 7 shows the 4-week sprint phases", () => {
    render(<DeckSlide7 />);
    expect(screen.getByText(/Week 1/i)).toBeDefined();
    expect(screen.getByText(/Week 4/i)).toBeDefined();
  });

  it("Slide 8 shows deliverables list", () => {
    render(<DeckSlide8 />);
    expect(screen.getByText(/audit doc/i)).toBeDefined();
  });

  it("Slide 9 shows team members", () => {
    render(<DeckSlide9 />);
    expect(screen.getByText(/Bhargav/)).toBeDefined();
  });

  it("Slide 10 shows the 28-day timeline", () => {
    render(<DeckSlide10 />);
    expect(screen.getByText(/28/)).toBeDefined();
  });

  it("Slide 11 shows ₹1.5L investment (no GST line per v4)", () => {
    render(<DeckSlide11 />);
    expect(screen.getByText(/1\.5/)).toBeDefined();
    expect(screen.queryByText(/GST/i)).toBeNull();
  });
});
