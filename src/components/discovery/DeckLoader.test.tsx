import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DeckLoader from "./DeckLoader";

describe("DeckLoader", () => {
  it("renders branded loading state", () => {
    render(<DeckLoader />);
    expect(screen.getByText(/Loading ZippyScale/i)).toBeDefined();
  });

  it("has role=status for accessibility", () => {
    render(<DeckLoader />);
    expect(screen.getByRole("status")).toBeDefined();
  });
});
