import {
  createEmbedRuntime,
  EMBED_READY_MESSAGE_TYPE,
  type EmbedReadyPayload,
  type EmbedRuntime,
  type EmbedRuntimeFactoryInput
} from "./runtime";
import {
  POST_MESSAGE_HANDSHAKE_TYPE,
  POST_MESSAGE_PARENT_SOURCE,
  POST_MESSAGE_EMBED_SOURCE,
  POST_MESSAGE_LEAD_SUBMITTED_TYPE,
  createPostMessageEnvelope,
  validateKnownPostMessageEnvelope,
  type LeadSubmittedPayload,
  type PostMessageEnvelope
} from "@conciergeai/shared";
import { attachConciergeHostDriver } from "./host-driver";

export type ConciergeInjectOptions = EmbedRuntimeFactoryInput & {
  readonly widgetSrc: string;
  readonly mountTarget?: HTMLElement | null;
  readonly title?: string;
  readonly width?: string;
  readonly height?: string;
  readonly idAttribute?: string;
  readonly onReady?: (payload: EmbedReadyPayload) => void;
  readonly onLeadSubmit?: (payload: LeadSubmittedPayload) => void;
};

export type ConciergeInjectionHandle = {
  readonly iframe: HTMLIFrameElement;
  readonly runtime: EmbedRuntime;
  readonly destroy: () => void;
};

export const CONCIERGE_DEFAULT_IFRAME_ID = "concierge-ai-widget" as const;

export function injectConciergeWidget(
  options: ConciergeInjectOptions
): ConciergeInjectionHandle {
  if (typeof document === "undefined" || typeof window === "undefined") {
    throw new Error("injectConciergeWidget requires a browser DOM environment");
  }

  if (typeof options.widgetSrc !== "string" || options.widgetSrc.length === 0) {
    throw new Error("injectConciergeWidget requires options.widgetSrc");
  }

  const runtime = createEmbedRuntime(options);
  const iframe = createIframe({ runtime, options });
  const target = options.mountTarget ?? document.body;
  target.appendChild(iframe);
  const widgetOrigin = new URL(options.widgetSrc, window.location.href).origin;
  const detachHostDriver = attachConciergeHostDriver({
    iframe,
    widgetOrigin
  });

  const handshakeNonce = generateNonce();
  const messageListener = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow) return;
    try {
      const envelope = validateWidgetEnvelope({
        event,
        iframe,
        widgetOrigin,
        expectedType: EMBED_READY_MESSAGE_TYPE
      });
      if (envelope.type !== EMBED_READY_MESSAGE_TYPE) return;
      const handshake = createPostMessageEnvelope({
        type: POST_MESSAGE_HANDSHAKE_TYPE,
        nonce: handshakeNonce,
        source: POST_MESSAGE_PARENT_SOURCE,
        payload: { targetSource: POST_MESSAGE_EMBED_SOURCE }
      });
      iframe.contentWindow?.postMessage(handshake, widgetOrigin);
      options.onReady?.(envelope.payload as EmbedReadyPayload);
    } catch {
      try {
        const envelope = validateWidgetEnvelope({
          event,
          iframe,
          widgetOrigin,
          expectedType: POST_MESSAGE_LEAD_SUBMITTED_TYPE
        });
        if (envelope.type !== POST_MESSAGE_LEAD_SUBMITTED_TYPE) return;
        options.onLeadSubmit?.(envelope.payload);
      } catch {
        /* swallow invalid envelopes per security policy */
      }
    }
  };

  window.addEventListener("message", messageListener);

  return {
    iframe,
    runtime,
    destroy(): void {
      window.removeEventListener("message", messageListener);
      detachHostDriver();
      iframe.remove();
    }
  };
}

function validateWidgetEnvelope(input: {
  readonly event: MessageEvent;
  readonly iframe: HTMLIFrameElement;
  readonly widgetOrigin: string;
  readonly expectedType:
    | typeof EMBED_READY_MESSAGE_TYPE
    | typeof POST_MESSAGE_LEAD_SUBMITTED_TYPE;
}) {
  return validateKnownPostMessageEnvelope(input.event.data, {
    origin: isSandboxOpaqueWidgetMessage(input.event, input.iframe)
      ? input.widgetOrigin
      : input.event.origin,
    allowedOrigins: [input.widgetOrigin],
    expectedType: input.expectedType
  });
}

function isSandboxOpaqueWidgetMessage(
  event: MessageEvent,
  iframe: HTMLIFrameElement
): boolean {
  return event.origin === "null" && usesOpaqueSandbox(iframe);
}

function usesOpaqueSandbox(iframe: HTMLIFrameElement): boolean {
  const sandbox = iframe.getAttribute("sandbox");
  if (sandbox === null) return false;
  const tokens = sandbox.split(/\s+/u).filter((token) => token.length > 0);
  return !tokens.includes("allow-same-origin");
}

function createIframe(input: {
  readonly runtime: EmbedRuntime;
  readonly options: ConciergeInjectOptions;
}): HTMLIFrameElement {
  const { runtime, options } = input;
  const iframe = document.createElement("iframe");
  iframe.id = options.idAttribute ?? CONCIERGE_DEFAULT_IFRAME_ID;
  iframe.title = options.title ?? "MotionLabs Concierge AI";
  iframe.src = options.widgetSrc;
  iframe.setAttribute("sandbox", runtime.iframePolicy.sandbox);
  iframe.setAttribute("loading", "eager");
  iframe.style.position = "fixed";
  iframe.style.inset = "0";
  iframe.style.width = options.width ?? "100%";
  iframe.style.height = options.height ?? "100%";
  iframe.style.border = "0";
  iframe.style.background = "transparent";
  iframe.style.zIndex = "2147483640";
  iframe.style.pointerEvents = "none";
  iframe.style.clipPath = "inset(100% 0px 0px 0px)";
  return iframe;
}

function generateNonce(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `nonce-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type { PostMessageEnvelope };
