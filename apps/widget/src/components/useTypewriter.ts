import { useEffect, useMemo, useRef, useState } from "react";

// Variable-speed Korean typewriter. Each grapheme appears with a base delay,
// and a longer pause follows punctuation so cadence reads like real speech.
//
// Spec ref: CONCIERGE_DESIGN_POLISH_SPEC §3.3.3.

export type UseTypewriterOptions = {
  readonly reducedMotion?: boolean;
  readonly baseDelayMs?: number;
  readonly fastDelayMs?: number;
  readonly punctuationDelayMs?: number;
};

export type UseTypewriterResult = {
  readonly displayed: string;
  readonly isComplete: boolean;
};

const DEFAULT_BASE_DELAY_MS = 45;
const DEFAULT_FAST_DELAY_MS = 30;
const DEFAULT_PUNCTUATION_DELAY_MS = 180;
const PUNCTUATION_CHARS = new Set([".", "?", "!", ",", "…", "。", "、"]);
const FAST_PATTERN = /[A-Za-z0-9\s]/u;

export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterResult {
  const reduced = options.reducedMotion === true;
  const baseDelay = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const fastDelay = options.fastDelayMs ?? DEFAULT_FAST_DELAY_MS;
  const punctuationDelay =
    options.punctuationDelayMs ?? DEFAULT_PUNCTUATION_DELAY_MS;

  const graphemes = useMemo(() => segmentText(text), [text]);
  const [index, setIndex] = useState<number>(reduced ? graphemes.length : 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIndex(reduced ? graphemes.length : 0);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [graphemes, reduced]);

  useEffect(() => {
    if (reduced) return undefined;
    if (index >= graphemes.length) return undefined;

    const currentChar = graphemes[index] ?? "";
    const previousChar = index > 0 ? (graphemes[index - 1] ?? "") : "";

    const isFast = FAST_PATTERN.test(currentChar);
    const isAfterPunctuation =
      index > 0 && PUNCTUATION_CHARS.has(previousChar.trim());
    const delay =
      (isFast ? fastDelay : baseDelay) +
      (isAfterPunctuation ? punctuationDelay : 0);

    timerRef.current = setTimeout(() => {
      setIndex((current) => current + 1);
    }, delay);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [index, graphemes, reduced, baseDelay, fastDelay, punctuationDelay]);

  const safeIndex = Math.min(index, graphemes.length);
  const displayed = graphemes.slice(0, safeIndex).join("");
  const isComplete = safeIndex >= graphemes.length;

  return { displayed, isComplete };
}

type SegmenterCtor = new (
  locale?: string,
  options?: { granularity?: "grapheme" | "word" | "sentence" }
) => { segment: (input: string) => Iterable<{ segment: string }> };

function segmentText(text: string): readonly string[] {
  if (text.length === 0) return [];
  const Segmenter = (globalThis as { Intl?: { Segmenter?: SegmenterCtor } })
    .Intl?.Segmenter;
  if (typeof Segmenter === "function") {
    try {
      const segmenter = new Segmenter("ko", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (entry) => entry.segment);
    } catch {
      // fall through to codepoint split
    }
  }
  return Array.from(text);
}
