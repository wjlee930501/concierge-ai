// Page-aware first contact. URL parameters + referrer로 hero greeting variant를 결정한다.
// 결과 분기는 placeholder 카피로만 작동하며 final 한국어 카피는 source data 도착 후 wire한다.

export type EntryVariant = "default" | "paid" | "referral" | "returning";

export type PageContext = {
  readonly variant: EntryVariant;
  readonly utmSource?: string;
  readonly utmMedium?: string;
  readonly utmCampaign?: string;
  readonly referrerHost?: string;
  readonly isReturningSession: boolean;
};

const RETURNING_STORAGE_KEY = "concierge.session.lastVisitAt";
const RETURNING_THRESHOLD_MS = 60 * 60 * 1000; // 1시간

export type DetectPageContextInput = {
  readonly url?: string;
  readonly referrer?: string;
  readonly storage?: Storage | null;
  readonly now?: number;
};

export function detectPageContext(input?: DetectPageContextInput): PageContext {
  const urlSource = input?.url ?? safeLocationHref();
  const url = parseUrl(urlSource);
  const referrerHost = parseReferrerHost(input?.referrer ?? safeReferrer());

  const utmSource = nonEmpty(url?.searchParams.get("utm_source") ?? undefined);
  const utmMedium = nonEmpty(url?.searchParams.get("utm_medium") ?? undefined);
  const utmCampaign = nonEmpty(
    url?.searchParams.get("utm_campaign") ?? undefined
  );

  const storage = input?.storage ?? safeStorage();
  const now = input?.now ?? Date.now();
  const isReturningSession = readReturningFlag(storage, now);
  if (storage !== null) {
    try {
      storage.setItem(RETURNING_STORAGE_KEY, String(now));
    } catch {
      /* storage may throw under sandbox; ignore */
    }
  }

  const variantInput: {
    isReturningSession: boolean;
    utmSource?: string;
    referrerHost?: string;
  } = { isReturningSession };
  if (utmSource !== undefined) variantInput.utmSource = utmSource;
  if (referrerHost !== undefined) variantInput.referrerHost = referrerHost;
  const variant = pickVariant(variantInput);

  return Object.freeze({
    variant,
    ...(utmSource !== undefined ? { utmSource } : {}),
    ...(utmMedium !== undefined ? { utmMedium } : {}),
    ...(utmCampaign !== undefined ? { utmCampaign } : {}),
    ...(referrerHost !== undefined ? { referrerHost } : {}),
    isReturningSession
  });
}

export function buildVariantGreetingSuffix(
  context: PageContext
): string | null {
  switch (context.variant) {
    case "paid":
      return `${context.utmSource ?? "광고"}에서 보신 흐름부터 짚어 드릴게요.`;
    case "referral":
      return `${context.referrerHost ?? "외부 링크"}에서 오신 흐름에 맞춰 안내드릴게요.`;
    case "returning":
      return "다시 방문해 주셨네요. 지난 흐름을 빠르게 이어 드릴게요.";
    case "default":
    default:
      return null;
  }
}

function pickVariant(input: {
  readonly isReturningSession: boolean;
  readonly utmSource?: string;
  readonly referrerHost?: string;
}): EntryVariant {
  if (input.utmSource !== undefined) return "paid";
  if (input.isReturningSession) return "returning";
  if (input.referrerHost !== undefined) return "referral";
  return "default";
}

function parseUrl(href: string | undefined): URL | null {
  if (typeof href !== "string" || href.length === 0) return null;
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

function parseReferrerHost(referrer: string | undefined): string | undefined {
  if (typeof referrer !== "string" || referrer.length === 0) return undefined;
  try {
    const url = new URL(referrer);
    if (url.host.length === 0) return undefined;
    if (isLocalPreviewHost(url.hostname)) return undefined;
    if (typeof window !== "undefined" && url.host === window.location.host) {
      return undefined;
    }
    return url.host;
  } catch {
    return undefined;
  }
}

function isLocalPreviewHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  );
}

function nonEmpty(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readReturningFlag(storage: Storage | null, now: number): boolean {
  if (storage === null) return false;
  try {
    const last = storage.getItem(RETURNING_STORAGE_KEY);
    if (last === null) return false;
    const lastMs = Number(last);
    if (!Number.isFinite(lastMs)) return false;
    return now - lastMs < RETURNING_THRESHOLD_MS;
  } catch {
    return false;
  }
}

function safeLocationHref(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.href;
}

function safeReferrer(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.referrer;
}

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
