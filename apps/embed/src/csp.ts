import {
  parseOriginAllowlist,
  type OriginAllowlistInput
} from "@conciergeai/shared";

export const FRAME_ANCESTORS_DIRECTIVE = "frame-ancestors" as const;

export const DEFAULT_EMBED_FRAME_ANCESTORS = [
  "https://host.example.test"
] as const;

export type EmbedCspPolicy = {
  readonly frameAncestors: readonly string[];
  readonly frameAncestorsDirective: string;
  readonly headerValue: string;
};

export function createEmbedCspPolicy(input: {
  readonly frameAncestors?: OriginAllowlistInput;
} = {}): EmbedCspPolicy {
  const frameAncestors = parseFrameAncestors(
    input.frameAncestors ?? DEFAULT_EMBED_FRAME_ANCESTORS
  );
  const frameAncestorsDirective =
    buildFrameAncestorsDirectiveFromOrigins(frameAncestors);

  return Object.freeze({
    frameAncestors,
    frameAncestorsDirective,
    headerValue: frameAncestorsDirective
  });
}

export function buildFrameAncestorsDirective(
  frameAncestors: OriginAllowlistInput
): string {
  return buildFrameAncestorsDirectiveFromOrigins(
    parseFrameAncestors(frameAncestors)
  );
}

export function parseFrameAncestors(
  frameAncestors: OriginAllowlistInput
): readonly string[] {
  return parseOriginAllowlist(frameAncestors);
}

function buildFrameAncestorsDirectiveFromOrigins(
  frameAncestors: readonly string[]
): string {
  const sources =
    frameAncestors.length > 0 ? frameAncestors.join(" ") : "'none'";

  return `${FRAME_ANCESTORS_DIRECTIVE} ${sources}`;
}
