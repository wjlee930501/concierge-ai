import { useEffect } from "react";
import { POST_MESSAGE_LEAD_SUBMITTED_TYPE } from "@conciergeai/shared";
import { postWidgetMessageToParent } from "./widgetPostMessage";
import type { RunnerState } from "./types";

declare global {
  interface Window {
    __CONCIERGE_LAST_MOCK_LEAD__?: unknown;
  }
}

/**
 * Side-effect hook that runs whenever a lead submission payload becomes
 * available. Stashes the payload on `window` for QA tooling, logs the mock
 * submit event, and forwards the lead to the parent host via
 * `postMessage` when the widget is iframed.
 *
 * The submission payload identity is the only dependency that should
 * re-trigger the effect — changing `parentOrigin` while a submission is
 * already settled should not re-fire the host notification.
 */
export function useLeadSubmissionEffect(input: {
  readonly submission: RunnerState["submission"];
  readonly parentOrigin: string | null;
}): void {
  const payload = input.submission?.payload;
  const parentOrigin = input.parentOrigin;

  useEffect(() => {
    if (payload === undefined) return;
    window.__CONCIERGE_LAST_MOCK_LEAD__ = payload;
    if (isDevBuild()) {
      console.info("[concierge-ai] mock lead submit", payload);
    }
    if (typeof window !== "undefined" && window.parent !== window) {
      postWidgetMessageToParent({
        targetWindow: window.parent,
        parentOrigin,
        type: POST_MESSAGE_LEAD_SUBMITTED_TYPE,
        payload: { lead: payload }
      });
    }
  }, [parentOrigin, payload]);
}

/**
 * Dev-mode detection — gates the mock-submit `console.info` so production
 * bundles ship without the log. Mirrors `choreographyBridge.isDevModeBuild`:
 * read `import.meta.env.DEV` first, then fall back to `NODE_ENV` for vitest
 * (which sets it to `"test"`). The flag must evaluate to `false` in
 * production builds.
 */
function isDevBuild(): boolean {
  try {
    const meta = import.meta as ImportMeta & {
      readonly env?: { readonly DEV?: unknown };
    };
    if (meta.env && meta.env.DEV === true) return true;
  } catch {
    // import.meta.env access can throw in some non-Vite runtimes — ignore.
  }
  const proc = (
    globalThis as {
      readonly process?: { readonly env?: Record<string, string | undefined> };
    }
  ).process;
  if (proc !== undefined && proc.env !== undefined) {
    const env = proc.env.NODE_ENV;
    if (env === "development" || env === "test") return true;
  }
  return false;
}
