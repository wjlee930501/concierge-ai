export type OriginAllowlistInput = string | readonly string[];

export type OriginPolicy = {
  readonly allowedOrigins: readonly string[];
  readonly isAllowed: (origin: string) => boolean;
  readonly targetOriginFor: (origin: string) => string;
};

export class OriginPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OriginPolicyError";
  }
}

export function parseOriginAllowlist(input: OriginAllowlistInput): string[] {
  const rawOrigins: readonly string[] =
    typeof input === "string" ? input.split(/[\s,]+/u) : input;

  const normalizedOrigins = rawOrigins
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => normalizeOrigin(origin));

  return Array.from(new Set(normalizedOrigins));
}

export function createOriginPolicy(input: {
  readonly allowedOrigins: OriginAllowlistInput;
}): OriginPolicy {
  const allowedOrigins = parseOriginAllowlist(input.allowedOrigins);

  return Object.freeze({
    allowedOrigins,
    isAllowed(origin: string): boolean {
      const normalizedOrigin = tryNormalizeOrigin(origin);

      return (
        normalizedOrigin !== null && allowedOrigins.includes(normalizedOrigin)
      );
    },
    targetOriginFor(origin: string): string {
      const targetOrigin = toSafeTargetOrigin(origin);

      if (!allowedOrigins.includes(targetOrigin)) {
        throw new OriginPolicyError("Target origin is not allowlisted");
      }

      return targetOrigin;
    }
  });
}

export function isOriginAllowed(
  origin: string,
  allowedOrigins: OriginAllowlistInput
): boolean {
  const normalizedOrigin = tryNormalizeOrigin(origin);

  return (
    normalizedOrigin !== null &&
    parseOriginAllowlist(allowedOrigins).includes(normalizedOrigin)
  );
}

export function toSafeTargetOrigin(targetOrigin: string): string {
  return normalizeOrigin(targetOrigin);
}

export function isSupportedPostMessageOrigin(originLike: string): boolean {
  return tryNormalizeOrigin(originLike) !== null;
}

export function tryNormalizeOrigin(originLike: string): string | null {
  try {
    return normalizeOrigin(originLike);
  } catch {
    return null;
  }
}

export function normalizeOrigin(originLike: string): string {
  const trimmedOrigin = originLike.trim();

  if (trimmedOrigin.length === 0) {
    throw new OriginPolicyError("Origin must not be empty");
  }

  if (trimmedOrigin.toLowerCase() === "null") {
    throw new OriginPolicyError("Null/opaque origins are not supported");
  }

  if (trimmedOrigin === "*") {
    throw new OriginPolicyError("Wildcard targetOrigin is forbidden");
  }

  let url: URL;

  try {
    url = new URL(trimmedOrigin);
  } catch {
    throw new OriginPolicyError("Origin must be an absolute URL");
  }

  if (url.origin === "null") {
    throw new OriginPolicyError("Null/opaque origins are not supported");
  }

  return url.origin;
}
