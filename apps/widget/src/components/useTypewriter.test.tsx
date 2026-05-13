// @vitest-environment jsdom
import { cleanup, render, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JSX } from "react";
import { useTypewriter } from "./useTypewriter";

function Harness(props: {
  readonly text: string;
  readonly reducedMotion?: boolean;
}): JSX.Element {
  const { displayed, isComplete } = useTypewriter(props.text, {
    reducedMotion: props.reducedMotion === true,
    baseDelayMs: 40,
    fastDelayMs: 25,
    punctuationDelayMs: 180
  });
  return (
    <div
      data-testid="tw-output"
      data-tw-complete={isComplete ? "true" : "false"}
    >
      {displayed}
    </div>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("useTypewriter", () => {
  it("emits the full text immediately when reducedMotion is true", () => {
    const { getByTestId } = render(
      <Harness text="안녕하세요. 반갑습니다." reducedMotion={true} />
    );
    const node = getByTestId("tw-output");
    expect(node.textContent).toBe("안녕하세요. 반갑습니다.");
    expect(node.getAttribute("data-tw-complete")).toBe("true");
  });

  function flush(ms: number, steps = 6): void {
    // Drive React + fake timers together: each iteration advances a slice,
    // flushes React state updates, then loops so new timers scheduled by
    // freshly-fired effects can also mature.
    const slice = Math.max(1, Math.ceil(ms / steps));
    for (let i = 0; i < steps; i++) {
      act(() => {
        vi.advanceTimersByTime(slice);
      });
    }
  }

  it("progresses one grapheme at a time across timer ticks", () => {
    const { getByTestId } = render(<Harness text="안녕" />);
    const node = getByTestId("tw-output");

    // Before any timer fires, nothing is rendered yet.
    expect(node.textContent).toBe("");
    expect(node.getAttribute("data-tw-complete")).toBe("false");

    // First tick reveals 1 grapheme.
    act(() => {
      vi.advanceTimersByTime(45);
    });
    expect(node.textContent).toBe("안");

    // Drive the loop forward — the full string fills in.
    flush(200);
    expect(node.textContent).toBe("안녕");
    expect(node.getAttribute("data-tw-complete")).toBe("true");
  });

  it("pauses an extra punctuation beat after a period", () => {
    const { getByTestId } = render(<Harness text="가. 나" />);
    const node = getByTestId("tw-output");

    // Walk past "가" and "." with the chunked flush.
    flush(120);
    expect(node.textContent).toBe("가.");

    // The next grapheme is " " (fast=25ms) + punctuation pause (180ms) ≈ 205ms.
    // Below that threshold, the output must NOT have advanced yet.
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(node.textContent).toBe("가.");

    // After the full punctuation pause + remaining graphemes resolve.
    flush(500);
    expect(node.textContent).toBe("가. 나");
    expect(node.getAttribute("data-tw-complete")).toBe("true");
  });

  it("resets and re-runs when the text prop changes", () => {
    const { getByTestId, rerender } = render(<Harness text="가나" />);
    const node = getByTestId("tw-output");

    flush(200);
    expect(node.textContent).toBe("가나");
    expect(node.getAttribute("data-tw-complete")).toBe("true");

    rerender(<Harness text="다라" />);
    // Reset: nothing yet, and not complete.
    expect(node.textContent).toBe("");
    expect(node.getAttribute("data-tw-complete")).toBe("false");

    act(() => {
      vi.advanceTimersByTime(45);
    });
    expect(node.textContent).toBe("다");
  });
});
