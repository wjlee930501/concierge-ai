import { injectConciergeWidget } from "./inject";
import type { ConciergeInjectionHandle } from "./inject";

declare global {
  interface Window {
    Concierge?: {
      readonly inject: typeof injectConciergeWidget;
      readonly injectConciergeWidget: typeof injectConciergeWidget;
      readonly handle?: ConciergeInjectionHandle;
    };
  }
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

  const inject = () => {
    if (document.getElementById("concierge-ai-widget") !== null) return;

    const handle = injectConciergeWidget({
      widgetSrc: new URL("/", widgetOrigin).toString(),
      allowedParentOrigins: [hostOrigin],
      frameAncestors: [hostOrigin],
      environment: "development"
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
