import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ExportModeProvider } from "../../contexts/ExportModeContext";
import DeckShell from "./DeckShell";

const slides = [
  <div key="1" data-testid="slide-1">Slide 1</div>,
  <div key="2" data-testid="slide-2">Slide 2</div>,
  <div key="3" data-testid="slide-3">Slide 3</div>,
];

function renderShell(exportQuery = "") {
  return render(
    <MemoryRouter initialEntries={[`/discovery${exportQuery}`]}>
      <ExportModeProvider>
        <DeckShell slides={slides} />
      </ExportModeProvider>
    </MemoryRouter>
  );
}

describe("DeckShell", () => {
  it("renders slide 1 by default", () => {
    renderShell();
    expect(screen.getByTestId("slide-1")).toBeDefined();
  });

  it("advances to slide 2 on ArrowRight", async () => {
    renderShell();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByTestId("slide-2")).toBeDefined();
  });

  it("does not advance past last slide", async () => {
    renderShell();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(screen.getByTestId("slide-3")).toBeDefined();
  });

  it("goes back on ArrowLeft", async () => {
    renderShell();
    await userEvent.keyboard("{ArrowRight}{ArrowLeft}");
    expect(screen.getByTestId("slide-1")).toBeDefined();
  });

  it("arrow keys do not fire when an INPUT is focused", async () => {
    renderShell();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(screen.getByTestId("slide-1")).toBeDefined();
    input.remove();
  });

  it("shows presenter chrome in presenter mode", () => {
    renderShell();
    expect(screen.getByRole("navigation", { name: /deck nav/i })).toBeDefined();
  });

  it("hides presenter chrome when export=true", () => {
    renderShell("?export=true");
    expect(screen.queryByRole("navigation", { name: /deck nav/i })).toBeNull();
  });
});
