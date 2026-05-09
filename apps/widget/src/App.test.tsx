// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("App choreography wiring", () => {
  it("hides step choices until executeStep reveals them and exposes the current anchor", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    mockReducedMotion(false);

    render(<App />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByText("핵심 기능 보기"));

    expect(screen.queryByText("다음: 성과 보기")).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(screen.queryByText("다음: 성과 보기")).not.toBeNull();
    const concierge = screen.getByLabelText("MotionLabs Concierge AI");
    expect(concierge.getAttribute("data-current-anchor")).toBe(
      "right_section_top"
    );
  });
});

function mockReducedMotion(matches: boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: () => true
  }));
}
