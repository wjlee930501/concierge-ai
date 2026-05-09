import { injectConciergeWidget } from "./inject";

declare global {
  interface Window {
    Concierge?: {
      readonly inject: typeof injectConciergeWidget;
    };
  }
}

if (typeof window !== "undefined") {
  window.Concierge = Object.freeze({ inject: injectConciergeWidget });
}

export { injectConciergeWidget };
