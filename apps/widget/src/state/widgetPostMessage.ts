import {
  POST_MESSAGE_WIDGET_SOURCE,
  createPostMessageEnvelope,
  type PostMessageKnownType
} from "@conciergeai/shared";

export function resolveWidgetParentTargetOrigin(input: {
  readonly parentOrigin: string | null;
  readonly opaqueOrigin: boolean;
}): string | null {
  if (input.parentOrigin !== null) {
    return input.parentOrigin;
  }
  return input.opaqueOrigin ? "*" : null;
}

export function postWidgetMessageToParent<TPayload>(input: {
  readonly targetWindow: Pick<Window, "postMessage">;
  readonly parentOrigin: string | null;
  readonly opaqueOrigin?: boolean;
  readonly type: PostMessageKnownType;
  readonly payload: TPayload;
  readonly nonce?: string;
}): void {
  const targetOrigin = resolveWidgetParentTargetOrigin({
    parentOrigin: input.parentOrigin,
    opaqueOrigin: input.opaqueOrigin ?? isCurrentWindowOpaqueOrigin()
  });

  if (targetOrigin === null) {
    return;
  }

  input.targetWindow.postMessage(
    createPostMessageEnvelope({
      type: input.type,
      nonce: input.nonce ?? generateNonce(),
      source: POST_MESSAGE_WIDGET_SOURCE,
      payload: input.payload
    }),
    targetOrigin
  );
}

export function isCurrentWindowOpaqueOrigin(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.origin === "null";
}

function generateNonce(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `widget-message-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
