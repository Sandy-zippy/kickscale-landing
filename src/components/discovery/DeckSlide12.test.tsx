import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DeckSlide12 from "./DeckSlide12";
import { writeSession } from "../../lib/discovery-session";

function seed(kickoffDate: string) {
  writeSession({
    company: "Acme",
    name: "Priya",
    cs1: "", cs2: "",
    kickoffDate,
    contactId: "ghl_123",
    phoneE164: "+919876543210",
    sessionStartedAt: new Date().toISOString(),
    draftBottlenecks: { b1: "", b2: "", b3: "", savedAt: "" },
  });
}

describe("DeckSlide12", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    delete process.env.VITE_RAZORPAY_RESERVATION_URL;
  });

  it("renders the kickoff date from session", () => {
    seed("2026-04-27");
    render(<DeckSlide12 />);
    expect(screen.getByText(/27 April 2026|April 27, 2026|2026-04-27/i)).toBeDefined();
  });

  it("renders a Razorpay CTA link with env URL", () => {
    process.env.VITE_RAZORPAY_RESERVATION_URL = "https://rzp.io/l/sprint-reservation";
    seed("2026-04-27");
    render(<DeckSlide12 />);
    const link = screen.getByRole("link", { name: /reserve/i });
    expect(link.getAttribute("href")).toBe("https://rzp.io/l/sprint-reservation");
  });

  it("falls back to '#' href when env missing", () => {
    delete process.env.VITE_RAZORPAY_RESERVATION_URL;
    seed("2026-04-27");
    render(<DeckSlide12 />);
    const link = screen.getByRole("link", { name: /reserve/i });
    expect(link.getAttribute("href")).toBe("#");
  });
});
