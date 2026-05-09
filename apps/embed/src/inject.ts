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
  createPostMessageEnvelope,
  validateKnownPostMessageEnvelope,
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
      const envelope = validateKnownPostMessageEnvelope(event.data, {
        origin: event.origin,
        allowedOrigins: [widgetOrigin],
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
      /* swallow invalid envelopes per security policy */
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
  iframe.setAttribute("loading", "lazy");
  iframe.style.position = "fixed";
  iframe.style.inset = "0";
  iframe.style.width = options.width ?? "100%";
  iframe.style.height = options.height ?? "100%";
  iframe.style.border = "0";
  iframe.style.background = "transparent";
  iframe.style.zIndex = "2147483640";
  iframe.style.pointerEvents = "auto";
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
