import { useEffect } from "react";
import { POST_MESSAGE_IFRAME_HITBOX_TYPE } from "@conciergeai/shared";
import { postWidgetMessageToParent } from "./widgetPostMessage";

export type UseIframeHitboxInput = {
  readonly enabled: boolean;
  readonly targetOrigin: string | null;
  readonly signal: string;
};

const HITBOX_SELECTOR = '[data-concierge-hitbox="true"]';
const HITBOX_PADDING_PX = 16;

export function useIframeHitbox(input: UseIframeHitboxInput): void {
  useEffect(() => {
    if (
      !input.enabled ||
      typeof window === "undefined" ||
      window.parent === window ||
      typeof window.parent.postMessage !== "function"
    ) {
      return undefined;
    }

    let cancelled = false;
    let rafId: number | null = null;
    let frameBudget = 24;

    const postHitbox = () => {
      if (cancelled) return;
      const payload = {
        rect: readHitboxRect(),
        viewport: {
          w: window.innerWidth,
          h: window.innerHeight
        },
        padding: HITBOX_PADDING_PX
      };
      postWidgetMessageToParent({
        targetWindow: window.parent,
        parentOrigin: input.targetOrigin,
        type: POST_MESSAGE_IFRAME_HITBOX_TYPE,
        payload
      });
    };

    const schedule = () => {
      if (cancelled) return;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        postHitbox();
        if (frameBudget > 0) {
          frameBudget -= 1;
          schedule();
        }
      });
    };

    const onChange = () => {
      frameBudget = 8;
      schedule();
    };

    postHitbox();
    schedule();
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, { passive: true });

    return () => {
      cancelled = true;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange);
    };
  }, [input.enabled, input.targetOrigin, input.signal]);
}

function readHitboxRect(): {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
} | null {
  const rects = Array.from(
    document.querySelectorAll<HTMLElement>(HITBOX_SELECTOR)
  )
    .filter((node) => isVisible(node))
    .map((node) => node.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  if (rects.length === 0) return null;

  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

function isVisible(node: HTMLElement): boolean {
  const style = window.getComputedStyle(node);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}
