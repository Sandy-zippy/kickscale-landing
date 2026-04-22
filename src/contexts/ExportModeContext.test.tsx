import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExportModeProvider, useExportMode } from "./ExportModeContext";
import { MemoryRouter } from "react-router-dom";

function Probe() {
  const { mode } = useExportMode();
  return <span>mode:{mode}</span>;
}

describe("ExportModeContext", () => {
  it("defaults to 'presenter' mode without query param", () => {
    render(
      <MemoryRouter initialEntries={["/discovery"]}>
        <ExportModeProvider>
          <Probe />
        </ExportModeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText("mode:presenter")).toBeDefined();
  });

  it("switches to 'client-pdf' mode when ?export=true", () => {
    render(
      <MemoryRouter initialEntries={["/discovery?export=true"]}>
        <ExportModeProvider>
          <Probe />
        </ExportModeProvider>
      </MemoryRouter>
    );
    expect(screen.getByText("mode:client-pdf")).toBeDefined();
  });
});
