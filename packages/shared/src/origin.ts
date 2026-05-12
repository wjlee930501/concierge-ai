export type OriginAllowlistInput = string | readonly string[];
export type OriginPolicyEnvironment =
  | "development"
  | "test"
  | "staging"
  | "preview"
  | "production";

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
  readonly environment?: OriginPolicyEnvironment;
}): OriginPolicy {
  const allowedOrigins = parseOriginAllowlist(input.allowedOrigins);
  assertOriginsAllowedForEnvironment(allowedOrigins, input.environment);

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

  if (trimmedOrigin === "*" || trimmedOrigin.includes("*")) {
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

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new OriginPolicyError("Only http and https origins are supported");
  }

  // IDN safety: the WHATWG URL parser converts Unicode hosts (e.g. 모션랩스.kr)
  // to ASCII punycode (xn--...) automatically. If a non-ASCII host slips
  // through anyway, attempt one normalization pass and otherwise reject so we
  // never feed mixed-script origins into the allowlist comparison.
  if (!isAsciiHost(url.host)) {
    const reparsed = tryReparseAsPunycodeHost(url);
    if (reparsed === null || !isAsciiHost(reparsed.host)) {
      throw new OriginPolicyError(
        "Origin host must be ASCII (punycode) after normalization"
      );
    }
    url = reparsed;
  }

  if (url.protocol === "http:" && isStagingPreviewOrProductionHost(url)) {
    throw new OriginPolicyError(
      "Staging, preview, and production origins must use https"
    );
  }

  return url.origin;
}

function isAsciiHost(host: string): boolean {
  for (let i = 0; i < host.length; i += 1) {
    if (host.charCodeAt(i) > 127) {
      return false;
    }
  }
  return true;
}

function tryReparseAsPunycodeHost(url: URL): URL | null {
  try {
    // Round-trip through new URL with just the host portion so the parser has
    // a fresh chance to apply IDN-to-ASCII. If the parser still returns a
    // non-ASCII host, the caller treats it as a hard failure.
    const reparsed = new URL(`${url.protocol}//${url.host}`);
    return reparsed;
  } catch {
    return null;
  }
}

export function assertOriginsAllowedForEnvironment(
  origins: readonly string[],
  environment: OriginPolicyEnvironment | undefined
): void {
  if (environment === undefined) {
    return;
  }

  for (const origin of origins) {
    assertOriginAllowedForEnvironment(origin, environment);
  }
}

export function assertOriginAllowedForEnvironment(
  origin: string,
  environment: OriginPolicyEnvironment
): void {
  const normalizedOrigin = normalizeOrigin(origin);
  const url = new URL(normalizedOrigin);

  if (isStagingPreviewOrProduction(environment) && url.protocol !== "https:") {
    throw new OriginPolicyError(
      "Staging, preview, and production origins must use https"
    );
  }

  if (environment === "development" || environment === "test") {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new OriginPolicyError(
        "Development and test origins must use http or https"
      );
    }

    if (!isLocalhostOrigin(url) && !isTestFixtureOrigin(url)) {
      throw new OriginPolicyError(
        "Development and test origins must be localhost, loopback, or .example.test fixtures"
      );
    }
  }
}

function isStagingPreviewOrProduction(
  environment: OriginPolicyEnvironment
): boolean {
  return (
    environment === "staging" ||
    environment === "preview" ||
    environment === "production"
  );
}

function isLocalhostOrigin(url: URL): boolean {
  return (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]" ||
    url.hostname === "::1"
  );
}

function isTestFixtureOrigin(url: URL): boolean {
  return (
    url.hostname === "example.test" || url.hostname.endsWith(".example.test")
  );
}

function isStagingPreviewOrProductionHost(url: URL): boolean {
  const labels = url.hostname.toLowerCase().split(".");
  return labels.some(
    (label) =>
      label === "staging" ||
      label === "preview" ||
      label === "prod" ||
      label === "production"
  );
}
