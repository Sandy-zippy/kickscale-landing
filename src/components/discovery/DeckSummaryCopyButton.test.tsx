import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeckSummaryCopyButton from "./DeckSummaryCopyButton";
import { writeSession } from "../../lib/discovery-session";

describe("DeckSummaryCopyButton", () => {
  beforeEach(() => {
    localStorage.clear();
    writeSession({
      company: "Acme",
      name: "Priya",
      cs1: "", cs2: "",
      kickoffDate: "2026-04-27",
      contactId: "ghl_123",
      phoneE164: "+919876543210",
      sessionStartedAt: new Date().toISOString(),
      draftBottlenecks: {
        b1: "whatsapp chaos",
        b2: "excel re-entry",
        b3: "no dashboard",
        savedAt: new Date().toISOString(),
      },
    });
  });

  it("copies a WhatsApp-ready recap to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<DeckSummaryCopyButton />);
    await userEvent.click(screen.getByRole("button", { name: /copy recap/i }));

    expect(writeText).toHaveBeenCalledOnce();
    const payload = writeText.mock.calls[0][0] as string;
    expect(payload).toContain("Acme");
    expect(payload).toContain("whatsapp chaos");
    expect(payload).toContain("2026-04-27");
  });
});
