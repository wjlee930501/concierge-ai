import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from "react";
import type { Scenario } from "@conciergeai/shared";
import { detectPageContext, type PageContext } from "./pageContext";
import { streamMockAiResponse } from "./llmMock";
import { createRunnerState, reduceRunner } from "./scenarioRunner";
import type { RunnerEvent, RunnerState } from "./types";

const HERO_DELAY_MIN_MS = 3000;
const HERO_DELAY_MAX_MS = 6000;

function pickHeroDelay(reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  const span = HERO_DELAY_MAX_MS - HERO_DELAY_MIN_MS;
  return HERO_DELAY_MIN_MS + Math.floor(Math.random() * span);
}

export function useScenarioRunner(scenario: Scenario): {
  readonly state: RunnerState;
  readonly dispatch: (event: RunnerEvent) => void;
} {
  const reducedMotion = usePrefersReducedMotion();
  const pageContext = useMemo<PageContext>(() => detectPageContext(), []);

  const [state, dispatch] = useReducer(
    reduceRunner,
    { scenario, reducedMotion, pageContext },
    createRunnerState
  );
  const initialDelay = useRef<number>(pickHeroDelay(reducedMotion));
  const lastStreamSeq = useRef<number>(0);

  useEffect(() => {
    dispatch({ type: "set-reduced-motion", value: reducedMotion });
  }, [reducedMotion]);

  useEffect(() => {
    if (state.phase.kind !== "idle") return undefined;
    const timer = window.setTimeout(() => {
      dispatch({ type: "show-hero" });
    }, initialDelay.current);
    return () => window.clearTimeout(timer);
  }, [state.phase.kind]);

  useEffect(() => {
    if (state.freeInput.mode !== "thinking") return undefined;
    const seq = state.freeInput.streamSeq;
    if (seq === lastStreamSeq.current) return undefined;
    lastStreamSeq.current = seq;
    const controller = new AbortController();
    const query = state.freeInput.draft;
    // Settled-flag prevents double dispatch when both .then/.catch and the
    // effect-cleanup abort path race. The first writer wins.
    let settled = false;
    const finishWithSafety = (reason: "out_of_scope" | "kb_unavailable") => {
      if (settled) return;
      settled = true;
      dispatch({
        type: "complete-ai-response",
        seq,
        suggestion: { kind: "safety", reason }
      });
    };
    streamMockAiResponse({
      query,
      scenario,
      signal: controller.signal,
      onEvent: (event) => {
        if (controller.signal.aborted) return;
        if (event.type === "chunk") {
          dispatch({ type: "stream-ai-chunk", seq, chunk: event.text });
        } else {
          if (event.aborted === true) return;
          if (settled) return;
          settled = true;
          dispatch({
            type: "complete-ai-response",
            seq,
            suggestion: event.suggestion
          });
        }
      }
    }).catch(() => {
      // Stream threw (e.g. mock provider crash or future real LLM error). Emit
      // a kb_unavailable safety_response so the user is not left in a ghost
      // thinking state. Skip if already cancelled by cleanup below.
      if (controller.signal.aborted) return;
      finishWithSafety("kb_unavailable");
    });
    return () => {
      controller.abort();
      // If the stream was aborted before reporting `done`, the UI would
      // otherwise stay in `thinking` mode (ghost-loading). Settle the slot
      // with an out_of_scope safety so the bubble closes cleanly.
      if (!settled) {
        settled = true;
        dispatch({ type: "dismiss-ai-response" });
      }
    };
  }, [
    scenario,
    state.freeInput.mode,
    state.freeInput.streamSeq,
    state.freeInput.draft
  ]);

  const wrappedDispatch = useCallback((event: RunnerEvent) => {
    dispatch(event);
  }, []);

  return { state, dispatch: wrappedDispatch };
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readPrefersReducedMotion);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return undefined;
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function readPrefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
