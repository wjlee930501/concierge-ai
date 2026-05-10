import {
  POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE,
  POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE,
  POST_MESSAGE_HOST_RECT_QUERY_TYPE,
  POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
  POST_MESSAGE_HOST_SCROLL_TO_TYPE,
  POST_MESSAGE_HOST_CONTROL_TYPES,
  POST_MESSAGE_IFRAME_HITBOX_TYPE,
  POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
  POST_MESSAGE_PARENT_SOURCE,
  createPostMessageEnvelope,
  validateKnownPostMessageEnvelope,
  type HostDriverHighlightMessagePayload,
  type IframeHitboxPayload,
  type HostRectQueryMessagePayload,
  type HostRectResponsePayload,
  type HostScrollToMessagePayload,
  type HostSectionNotFoundPayload,
  type PostMessageKnownType
} from "@conciergeai/shared";

const DRIVER_HIGHLIGHT_CLASS = "concierge-driver-highlight";
const DRIVER_STYLE_ID = "concierge-driver-highlight-style";

const HOST_DRIVER_TYPES: readonly PostMessageKnownType[] =
  POST_MESSAGE_HOST_CONTROL_TYPES;

type WidgetHostResponse =
  | {
      readonly type: typeof POST_MESSAGE_HOST_RECT_RESPONSE_TYPE;
      readonly payload: HostRectResponsePayload;
    }
  | {
      readonly type: typeof POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE;
      readonly payload: HostSectionNotFoundPayload;
    };

export function attachConciergeHostDriver(input: {
  readonly iframe: HTMLIFrameElement;
  readonly widgetOrigin: string;
  readonly doc?: Document;
  readonly win?: Window;
}): () => void {
  const win = input.win ?? window;
  const doc = input.doc ?? document;

  const onMessage = (event: MessageEvent) => {
    if (event.source !== input.iframe.contentWindow) return;

    for (const expectedType of HOST_DRIVER_TYPES) {
      try {
        const envelope = validateWidgetMessage({
          event,
          iframe: input.iframe,
          widgetOrigin: input.widgetOrigin,
          expectedType
        });

        switch (envelope.type) {
          case POST_MESSAGE_HOST_SCROLL_TO_TYPE:
            scrollToSelector(
              input.iframe,
              input.widgetOrigin,
              doc,
              envelope.payload
            );
            return;
          case POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE:
            highlightSelector(doc, envelope.payload);
            return;
          case POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE:
            clearHighlight(doc);
            return;
          case POST_MESSAGE_HOST_RECT_QUERY_TYPE:
            respondToRectQuery(
              input.iframe,
              input.widgetOrigin,
              doc,
              win,
              envelope.payload
            );
            return;
          case POST_MESSAGE_IFRAME_HITBOX_TYPE:
            applyIframeHitbox(input.iframe, envelope.payload);
            return;
        }
      } catch {
        // Try the next known host-driver type, then fail closed.
      }
    }
  };

  win.addEventListener("message", onMessage);
  return () => {
    win.removeEventListener("message", onMessage);
    clearHighlight(doc);
  };
}

function applyIframeHitbox(
  iframe: HTMLIFrameElement,
  payload: IframeHitboxPayload
): void {
  if (
    payload.rect === null ||
    payload.rect.width <= 0 ||
    payload.rect.height <= 0
  ) {
    iframe.style.pointerEvents = "none";
    iframe.style.clipPath = "inset(100% 0px 0px 0px)";
    return;
  }

  const padding = payload.padding;
  const top = Math.max(0, Math.round(payload.rect.top - padding));
  const left = Math.max(0, Math.round(payload.rect.left - padding));
  const right = Math.max(
    0,
    Math.round(
      payload.viewport.w - (payload.rect.left + payload.rect.width + padding)
    )
  );
  const bottom = Math.max(
    0,
    Math.round(
      payload.viewport.h - (payload.rect.top + payload.rect.height + padding)
    )
  );

  iframe.style.pointerEvents = "auto";
  iframe.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round 28px)`;
}

function scrollToSelector(
  iframe: HTMLIFrameElement,
  widgetOrigin: string,
  doc: Document,
  payload: HostScrollToMessagePayload
): void {
  const node = doc.querySelector<HTMLElement>(payload.selector);
  if (node === null) {
    postToWidget(iframe, widgetOrigin, {
      type: POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
      payload: { selector: payload.selector }
    });
    return;
  }
  node.scrollIntoView({
    block: payload.block,
    behavior: payload.behavior === "instant" ? "auto" : "smooth"
  });
}

function highlightSelector(
  doc: Document,
  payload: HostDriverHighlightMessagePayload
): void {
  clearHighlight(doc);
  ensureDriverStyle(doc);
  const node = doc.querySelector<HTMLElement>(payload.selector);
  if (node === null) return;
  node.classList.add(DRIVER_HIGHLIGHT_CLASS);
  node.style.setProperty(
    "--concierge-highlight-padding",
    `${payload.padding}px`
  );
  node.style.setProperty("--concierge-highlight-radius", `${payload.radius}px`);
  node.style.setProperty("--concierge-highlight-color", payload.color);
}

function respondToRectQuery(
  iframe: HTMLIFrameElement,
  widgetOrigin: string,
  doc: Document,
  win: Window,
  payload: HostRectQueryMessagePayload
): void {
  const node = doc.querySelector<HTMLElement>(payload.selector);
  const rect = node?.getBoundingClientRect();
  postToWidget(iframe, widgetOrigin, {
    type: POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
    payload: {
      request_id: payload.request_id,
      rect:
        rect === undefined
          ? null
          : {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height
            },
      viewport: {
        w: win.innerWidth,
        h: win.innerHeight
      }
    }
  });
}

function postToWidget(
  iframe: HTMLIFrameElement,
  widgetOrigin: string,
  input: WidgetHostResponse
): void {
  iframe.contentWindow?.postMessage(
    createPostMessageEnvelope({
      type: input.type,
      nonce: generateNonce(),
      source: POST_MESSAGE_PARENT_SOURCE,
      payload: input.payload
    }),
    targetOriginForWidget(iframe, widgetOrigin)
  );
}

function validateWidgetMessage(input: {
  readonly event: MessageEvent;
  readonly iframe: HTMLIFrameElement;
  readonly widgetOrigin: string;
  readonly expectedType: PostMessageKnownType;
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

function targetOriginForWidget(
  iframe: HTMLIFrameElement,
  widgetOrigin: string
): string {
  return usesOpaqueSandbox(iframe) ? "*" : widgetOrigin;
}

function usesOpaqueSandbox(iframe: HTMLIFrameElement): boolean {
  const sandbox = iframe.getAttribute("sandbox");
  if (sandbox === null) return false;
  const tokens = sandbox.split(/\s+/u).filter((token) => token.length > 0);
  return !tokens.includes("allow-same-origin");
}

function ensureDriverStyle(doc: Document): void {
  const existing = doc.querySelector(
    `style[data-concierge-driver-style="${DRIVER_STYLE_ID}"]`
  );
  if (existing !== null) {
    return;
  }
  const style = doc.createElement("style");
  style.dataset.conciergeDriverStyle = DRIVER_STYLE_ID;
  style.textContent = `
.${DRIVER_HIGHLIGHT_CLASS} {
  outline: 4px solid var(--concierge-highlight-color, rgba(26, 86, 219, 0.25));
  outline-offset: var(--concierge-highlight-padding, 12px);
  border-radius: var(--concierge-highlight-radius, 8px);
  box-shadow:
    0 0 0 9999px rgba(7, 20, 39, 0.18),
    0 0 40px var(--concierge-highlight-color, rgba(26, 86, 219, 0.25));
  position: relative;
  z-index: 2147483639;
  transition:
    outline-color 380ms cubic-bezier(0.2, 0.8, 0.2, 1),
    outline-offset 380ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 380ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
  .${DRIVER_HIGHLIGHT_CLASS} {
    transition: none;
  }
}`;
  (doc.head ?? doc.documentElement).appendChild(style);
}

function clearHighlight(doc: Document): void {
  const nodes = Array.from(
    doc.querySelectorAll<HTMLElement>(`.${DRIVER_HIGHLIGHT_CLASS}`)
  );
  for (const node of nodes) {
    node.classList.remove(DRIVER_HIGHLIGHT_CLASS);
    node.style.removeProperty("--concierge-highlight-padding");
    node.style.removeProperty("--concierge-highlight-radius");
    node.style.removeProperty("--concierge-highlight-color");
  }
}

function generateNonce(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `host-driver-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
