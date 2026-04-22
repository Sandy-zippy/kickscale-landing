import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeckSlide4 from "./DeckSlide4";
import { writeSession, readSession } from "../../lib/discovery-session";

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

describe("DeckSlide4", () => {
  beforeEach(() => {
    localStorage.clear();
    seed();
  });

  it("shows three bottleneck input fields", () => {
    render(<DeckSlide4 onSubmit={() => {}} />);
    expect(screen.getAllByRole("textbox").length).toBe(3);
  });

  it("persists keystrokes to localStorage (debounced 500ms)", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<DeckSlide4 onSubmit={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "whatsapp");
    // before debounce elapses, localStorage not yet updated
    expect(readSession()?.draftBottlenecks.b1).toBe("");
    vi.advanceTimersByTime(600);
    await waitFor(() => {
      expect(readSession()?.draftBottlenecks.b1).toBe("whatsapp");
    });
    vi.useRealTimers();
  });

  it("restores drafts on remount", async () => {
    const s = readSession()!;
    s.draftBottlenecks = {
      b1: "stale",
      b2: "",
      b3: "",
      savedAt: new Date().toISOString(),
    };
    writeSession(s);
    render(<DeckSlide4 onSubmit={() => {}} />);
    const first = screen.getAllByRole("textbox")[0] as HTMLInputElement;
    expect(first.value).toBe("stale");
  });

  it("calls onSubmit with finalized bullets when Lock & Submit clicked", async () => {
    const onSubmit = vi.fn();
    render(<DeckSlide4 onSubmit={onSubmit} />);
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0], "bottleneck one");
    await userEvent.type(inputs[1], "bottleneck two");
    await userEvent.type(inputs[2], "bottleneck three");
    await userEvent.click(screen.getByRole("button", { name: /lock & submit/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      b1: "bottleneck one",
      b2: "bottleneck two",
      b3: "bottleneck three",
    });
  });

  it("disables Lock button if any field empty", () => {
    render(<DeckSlide4 onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: /lock & submit/i })).toHaveProperty(
      "disabled",
      true
    );
  });
});
