// Vite client-side env contract. Production secret/API은 본 모듈에 절대 들어오지 않는다.
// 실 값은 Vercel project env에 저장되고 Vite는 빌드 시 inline한다.

export type ConciergeEnvironment =
  | "development"
  | "test"
  | "preview"
  | "staging"
  | "production";

export type ConciergeRuntimeConfig = {
  readonly environment: ConciergeEnvironment;
  readonly allowedOrigins: readonly string[];
  readonly embedBase: string;
};

const DEFAULT_DEV_CONFIG: ConciergeRuntimeConfig = Object.freeze({
  environment: "development",
  allowedOrigins: Object.freeze([
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5181",
    "http://localhost:5181"
  ]) as readonly string[],
  embedBase: "http://127.0.0.1:5173"
});

export function readConciergeRuntimeConfig(
  env: Readonly<Record<string, string | undefined>> = readImportMetaEnv()
): ConciergeRuntimeConfig {
  const environment = parseEnvironment(env.VITE_CONCIERGE_ENVIRONMENT);
  if (environment === undefined) {
    return DEFAULT_DEV_CONFIG;
  }

  const origins = parseOrigins(env.VITE_CONCIERGE_ALLOWED_ORIGINS);
  const embedBase =
    typeof env.VITE_CONCIERGE_EMBED_BASE === "string" &&
    env.VITE_CONCIERGE_EMBED_BASE.length > 0
      ? env.VITE_CONCIERGE_EMBED_BASE
      : DEFAULT_DEV_CONFIG.embedBase;

  return Object.freeze({
    environment,
    allowedOrigins:
      origins.length > 0
        ? Object.freeze(origins)
        : DEFAULT_DEV_CONFIG.allowedOrigins,
    embedBase
  });
}

function readImportMetaEnv(): Readonly<Record<string, string | undefined>> {
  if (typeof import.meta === "undefined") return {};
  const env = (
    import.meta as { readonly env?: Record<string, string | undefined> }
  ).env;
  return env ?? {};
}

function parseEnvironment(
  value: string | undefined
): ConciergeEnvironment | undefined {
  switch (value) {
    case "development":
    case "test":
    case "preview":
    case "staging":
    case "production":
      return value;
    default:
      return undefined;
  }
}

function parseOrigins(raw: string | undefined): string[] {
  if (typeof raw !== "string" || raw.length === 0) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export const DEFAULT_CONCIERGE_RUNTIME_CONFIG = DEFAULT_DEV_CONFIG;
