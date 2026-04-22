import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FallbackCaseStudyCardA from "./FallbackCaseStudyCardA";
import FallbackCaseStudyCardB from "./FallbackCaseStudyCardB";

describe("Fallback case study cards", () => {
  it("Card A shows manufacturing distributor scenario", () => {
    render(<FallbackCaseStudyCardA />);
    expect(screen.getByText(/manufacturing distribution/i)).toBeDefined();
  });

  it("Card A does NOT show a zippyscale.in/case-studies URL", () => {
    render(<FallbackCaseStudyCardA />);
    expect(screen.queryByText(/zippyscale\.in\/case-studies/)).toBeNull();
  });

  it("Card A shows target ranges (not fake client wins)", () => {
    render(<FallbackCaseStudyCardA />);
    expect(screen.getAllByText(/target/i).length).toBeGreaterThan(0);
  });

  it("Card B shows professional services scenario", () => {
    render(<FallbackCaseStudyCardB />);
    expect(screen.getAllByText(/professional services/i).length).toBeGreaterThan(0);
  });

  it("Card B does NOT show a zippyscale.in/case-studies URL", () => {
    render(<FallbackCaseStudyCardB />);
    expect(screen.queryByText(/zippyscale\.in\/case-studies/)).toBeNull();
  });
});
