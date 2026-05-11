// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("App choreography wiring", () => {
  it("maps free-input and choreography states to avatar expressions", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    mockReducedMotion(false);

    render(<App />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    fireEvent.click(screen.getByText("직접 물어보기"));
    expect(
      screen
        .getByTestId("concierge-avatar")
        .getAttribute("data-avatar-expression")
    ).toBe("listening");

    fireEvent.change(screen.getByPlaceholderText("무엇이 궁금하세요?"), {
      target: { value: "가격이 궁금해요" }
    });
    fireEvent.click(screen.getByText("보내기"));
    expect(
      screen
        .getByTestId("concierge-avatar")
        .getAttribute("data-avatar-expression")
    ).toBe("thinking");
  });

  it("uses a smile expression once choreography points at a host section", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    mockReducedMotion(false);

    render(<App />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByText("기존 환자 재방문을 높이고 싶어요"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(
      screen
        .getByTestId("concierge-avatar")
        .getAttribute("data-avatar-expression")
    ).toBe("smile");
  });

  it("exposes the breathing bubble and 120ms chip feedback polish contract", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    mockReducedMotion(false);

    render(<App />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(
      screen.getByTestId("speech-pill").getAttribute("data-polish-breathing")
    ).toBe("true");
    expect(
      screen.getByTestId("speech-pill").getAttribute("data-floating-loop")
    ).toBe("loop");
    expect(
      screen
        .getByTestId("speech-pill")
        .getAttribute("data-floating-amplitude-px")
    ).toBe("1.6");
    expect(
      screen.getByTestId("concierge-avatar").getAttribute("data-avatar-asset")
    ).toBe("smile");
    const concierge = screen.getByLabelText("MotionLabs Concierge AI");
    expect(concierge.getAttribute("data-motion-profile")).toBe("short");
    expect(concierge.getAttribute("data-motion-positioning")).toBe("transform");
    expect(concierge.getAttribute("data-path-control")).toMatch(/^\d+,\d+$/);
    expect(
      document
        .querySelector('[data-concierge-hitbox="true"]')
        ?.className.toString()
    ).toContain("w-[min(560px,calc(100vw-32px))]");
    expect(
      screen
        .getByText("기존 환자 재방문을 높이고 싶어요")
        .getAttribute("data-feedback-window-ms")
    ).toBe("120");
  });

  it("hides step choices until executeStep reveals them and exposes the current anchor", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    mockReducedMotion(false);

    render(<App />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByText("기존 환자 재방문을 높이고 싶어요"));

    expect(screen.queryByRole("button", { name: "상담 신청하기" })).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });

    expect(
      screen.queryByRole("button", { name: "상담 신청하기" })
    ).not.toBeNull();
    const concierge = screen.getByLabelText("MotionLabs Concierge AI");
    expect(concierge.getAttribute("data-current-anchor")).toBe(
      "right_section_top"
    );
  });

  it("opens the guided lead form with hospital, interest, and consent controls", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    mockReducedMotion(false);

    render(<App />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByText("상담을 받고 싶어요"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });
    fireEvent.click(screen.getByRole("button", { name: "상담 신청하기" }));

    expect(screen.getByLabelText(/병원명/u)).not.toBeNull();
    expect(screen.getByLabelText(/관심 분야/u)).not.toBeNull();
    expect(screen.getByText("상담 신청 보내기")).toHaveProperty(
      "disabled",
      true
    );
  });

  it("uses the local host preview only in standalone widget preview mode", () => {
    mockReducedMotion(false);

    render(<App />);

    expect(screen.queryByTestId("host-page-preview")).not.toBeNull();
  });

  it("hides the local host preview when embedded in a real host page", () => {
    mockReducedMotion(false);
    const originalParent = window.parent;
    Object.defineProperty(window, "parent", {
      configurable: true,
      value: {}
    });

    render(<App />);

    expect(screen.queryByTestId("host-page-preview")).toBeNull();

    Object.defineProperty(window, "parent", {
      configurable: true,
      value: originalParent
    });
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
