import { injectConciergeWidget } from "./inject";
import type { ConciergeInjectionHandle } from "./inject";
import type { OriginPolicyEnvironment } from "@conciergeai/shared";

declare global {
  interface Window {
    Concierge?: {
      readonly inject: typeof injectConciergeWidget;
      readonly injectConciergeWidget: typeof injectConciergeWidget;
      readonly handle?: ConciergeInjectionHandle;
    };
  }
}

const SUPPORTED_EMBED_ENVIRONMENTS: readonly OriginPolicyEnvironment[] = [
  "development",
  "test",
  "staging",
  "preview",
  "production"
];

export function resolveEmbedEnvironment(
  raw: string | undefined
): OriginPolicyEnvironment {
  if (typeof raw !== "string") {
    return "production";
  }
  const candidate = raw.trim().toLowerCase();
  for (const env of SUPPORTED_EMBED_ENVIRONMENTS) {
    if (env === candidate) return env;
  }
  return "production";
}

if (typeof window !== "undefined") {
  window.Concierge = Object.freeze({
    inject: injectConciergeWidget,
    injectConciergeWidget
  });
  autoInjectFromCurrentScript();
}

export { injectConciergeWidget };

function autoInjectFromCurrentScript(): void {
  const currentScript = document.currentScript;
  if (!(currentScript instanceof HTMLScriptElement)) return;

  const widgetOrigin = currentScript.dataset.conciergeWidgetOrigin;
  const hostOrigin = currentScript.dataset.conciergeHostOrigin;
  if (widgetOrigin === undefined || hostOrigin === undefined) return;

  const environment = resolveEmbedEnvironment(
    currentScript.dataset.conciergeEnvironment
  );

  const inject = () => {
    if (document.getElementById("concierge-ai-widget") !== null) return;

    const handle = injectConciergeWidget({
      widgetSrc: new URL("/", widgetOrigin).toString(),
      allowedParentOrigins: [hostOrigin],
      frameAncestors: [hostOrigin],
      environment
    });

    window.Concierge = Object.freeze({
      inject: injectConciergeWidget,
      injectConciergeWidget,
      handle
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once: true });
    return;
  }

  inject();
}
