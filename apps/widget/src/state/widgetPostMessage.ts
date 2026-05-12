import {
  POST_MESSAGE_WIDGET_SOURCE,
  createPostMessageEnvelope,
  type PostMessageKnownType
} from "@conciergeai/shared";

export function resolveWidgetParentTargetOrigin(input: {
  readonly parentOrigin: string | null;
  readonly opaqueOrigin: boolean;
  readonly allowWildcardTarget?: boolean;
}): string | null {
  if (input.parentOrigin !== null) {
    return input.parentOrigin;
  }
  // Wildcard targetOrigin is only allowed when the widget runs under an opaque
  // sandbox AND the caller explicitly opts in via allowWildcardTarget. Default
  // is fail-closed (null) per FINAL_ALIGNMENT §D-4.
  if (input.opaqueOrigin && input.allowWildcardTarget === true) {
    return "*";
  }
  return null;
}

export function postWidgetMessageToParent<TPayload>(input: {
  readonly targetWindow: Pick<Window, "postMessage">;
  readonly parentOrigin: string | null;
  readonly opaqueOrigin?: boolean;
  readonly allowWildcardTarget?: boolean;
  readonly type: PostMessageKnownType;
  readonly payload: TPayload;
  readonly nonce?: string;
}): void {
  const targetOrigin = resolveWidgetParentTargetOrigin({
    parentOrigin: input.parentOrigin,
    opaqueOrigin: input.opaqueOrigin ?? isCurrentWindowOpaqueOrigin(),
    ...(input.allowWildcardTarget !== undefined
      ? { allowWildcardTarget: input.allowWildcardTarget }
      : {})
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
