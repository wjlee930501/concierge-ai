import {
  createOriginPolicy,
  createPostMessageEnvelope,
  isSupportedPostMessageOrigin,
  type OriginAllowlistInput,
  type OriginPolicy,
  type PostMessageEnvelope
} from "@conciergeai/shared";
import {
  DEFAULT_PARENT_PAGE_ACCESS_POLICY,
  assertNoParentPageAccess,
  type ParentPageAccessPolicy
} from "./parent-access";
import {
  createEmbedIframePolicy,
  type EmbedIframePolicy
} from "./sandbox";
import {
  createEmbedCspPolicy,
  type EmbedCspPolicy
} from "./csp";

export const EMBED_RUNTIME_SOURCE = "concierge.embed" as const;
export const EMBED_READY_MESSAGE_TYPE = "concierge.embed.ready" as const;

export const TEST_ONLY_EMBED_PARENT_ORIGINS = [
  "https://host.example.test"
] as const;

export type EmbedRuntimeFactoryInput = {
  readonly allowedParentOrigins?: OriginAllowlistInput;
  readonly frameAncestors?: OriginAllowlistInput;
  readonly sandboxTokens?: readonly string[];
  readonly parentAccessPolicy?: ParentPageAccessPolicy;
  readonly source?: string;
};

export type EmbedReadyPayload = {
  readonly sandbox: string;
  readonly frameAncestors: readonly string[];
  readonly parentAccessPolicy: ParentPageAccessPolicy;
};

export type EmbedRuntime = {
  readonly source: string;
  readonly parentAccessPolicy: ParentPageAccessPolicy;
  readonly iframePolicy: EmbedIframePolicy;
  readonly originPolicy: OriginPolicy;
  readonly cspPolicy: EmbedCspPolicy;
  readonly isAllowedParentOrigin: (origin: string) => boolean;
  readonly targetOriginFor: (origin: string) => string;
  readonly createReadyEnvelope: (input: {
    readonly nonce: string;
    readonly timestamp?: number;
  }) => PostMessageEnvelope<EmbedReadyPayload, typeof EMBED_READY_MESSAGE_TYPE>;
};

export function createEmbedRuntime(
  input: EmbedRuntimeFactoryInput = {}
): EmbedRuntime {
  const parentAccessPolicy = assertNoParentPageAccess(
    input.parentAccessPolicy ?? DEFAULT_PARENT_PAGE_ACCESS_POLICY
  );
  const iframePolicy =
    input.sandboxTokens === undefined
      ? createEmbedIframePolicy()
      : createEmbedIframePolicy({ sandboxTokens: input.sandboxTokens });
  const allowedParentOrigins =
    input.allowedParentOrigins ?? TEST_ONLY_EMBED_PARENT_ORIGINS;
  const originPolicy = createOriginPolicy({
    allowedOrigins: allowedParentOrigins
  });
  const cspPolicy = createEmbedCspPolicy({
    frameAncestors: input.frameAncestors ?? allowedParentOrigins
  });
  const source = input.source ?? EMBED_RUNTIME_SOURCE;

  return Object.freeze({
    source,
    parentAccessPolicy,
    iframePolicy,
    originPolicy,
    cspPolicy,
    isAllowedParentOrigin(origin: string): boolean {
      return (
        isSupportedPostMessageOrigin(origin) && originPolicy.isAllowed(origin)
      );
    },
    targetOriginFor(origin: string): string {
      return originPolicy.targetOriginFor(origin);
    },
    createReadyEnvelope(readyInput: {
      readonly nonce: string;
      readonly timestamp?: number;
    }): PostMessageEnvelope<
      EmbedReadyPayload,
      typeof EMBED_READY_MESSAGE_TYPE
    > {
      const envelopeInput = {
        type: EMBED_READY_MESSAGE_TYPE,
        nonce: readyInput.nonce,
        source,
        payload: {
          sandbox: iframePolicy.sandbox,
          frameAncestors: cspPolicy.frameAncestors,
          parentAccessPolicy
        }
      };

      if (readyInput.timestamp === undefined) {
        return createPostMessageEnvelope(envelopeInput);
      }

      return createPostMessageEnvelope({
        ...envelopeInput,
        timestamp: readyInput.timestamp,
      });
    }
  });
}
