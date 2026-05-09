import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { Scenario } from "@conciergeai/shared";
import { detectPageContext, type PageContext } from "./pageContext";
import { streamMockAiResponse } from "./llmMock";
import {
  createRunnerState,
  reduceRunner
} from "./scenarioRunner";
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
    void streamMockAiResponse({
      query,
      scenario,
      signal: controller.signal,
      onEvent: (event) => {
        if (controller.signal.aborted) return;
        if (event.type === "chunk") {
          dispatch({ type: "stream-ai-chunk", seq, chunk: event.text });
        } else {
          dispatch({
            type: "complete-ai-response",
            seq,
            suggestion: event.suggestion
          });
        }
      }
    });
    return () => controller.abort();
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
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
