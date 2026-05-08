import { OriginPolicyError, parseOriginAllowlist } from "./origin";

export const CONCIERGE_ALLOWED_ORIGINS_ENV_KEY =
  "CONCIERGE_ALLOWED_ORIGINS" as const;

export type OriginEnvironment =
  | "development"
  | "test"
  | "staging"
  | "preview"
  | "production";

export function parseOriginAllowlistFromEnv(
  env: Readonly<Record<string, string | undefined>>
): string[] {
  const raw = env[CONCIERGE_ALLOWED_ORIGINS_ENV_KEY];

  if (raw === undefined || raw.trim().length === 0) {
    return [];
  }

  return parseOriginAllowlist(raw);
}

export function validateOriginsForEnvironment(
  origins: readonly string[],
  environment: OriginEnvironment
): readonly string[] {
  for (const origin of origins) {
    if (isLocalEnvironment(environment)) {
      assertLocalOrigin(origin, environment);
    } else {
      assertHttpsOrigin(origin, environment);
    }
  }

  return origins;
}

function isLocalEnvironment(env: OriginEnvironment): boolean {
  return env === "development" || env === "test";
}

function assertLocalOrigin(origin: string, environment: string): void {
  let url: URL;

  try {
    url = new URL(origin);
  } catch {
    throw new OriginPolicyError(
      `${environment} origin is not a valid URL: ${origin}`
    );
  }

  const isLocalhost =
    url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const isTestTld = url.hostname.endsWith(".test");

  if (!isLocalhost && !isTestTld) {
    throw new OriginPolicyError(
      `${environment} environment only allows localhost or .test origins`
    );
  }
}

function assertHttpsOrigin(origin: string, environment: string): void {
  let url: URL;

  try {
    url = new URL(origin);
  } catch {
    throw new OriginPolicyError(
      `${environment} origin is not a valid URL: ${origin}`
    );
  }

  if (url.protocol !== "https:") {
    throw new OriginPolicyError(
      `${environment} environment requires https origins`
    );
  }
}
