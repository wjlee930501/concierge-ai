export const DEFAULT_IFRAME_SANDBOX_TOKENS = ["allow-scripts"] as const;

export const FORBIDDEN_IFRAME_SANDBOX_TOKENS = [
  "allow-same-origin",
  "allow-top-navigation",
  "allow-top-navigation-by-user-activation",
  "allow-top-navigation-to-custom-protocols"
] as const;

export type ForbiddenIframeSandboxToken =
  (typeof FORBIDDEN_IFRAME_SANDBOX_TOKENS)[number];

export type EmbedIframePolicy = {
  readonly sandbox: string;
};

export function createEmbedIframePolicy(input: {
  readonly sandboxTokens?: readonly string[];
} = {}): EmbedIframePolicy {
  return {
    sandbox: buildIframeSandbox(input.sandboxTokens)
  };
}

export function buildIframeSandbox(
  tokens: readonly string[] = DEFAULT_IFRAME_SANDBOX_TOKENS
): string {
  const normalizedTokens = tokens
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  const forbiddenToken = normalizedTokens.find(isForbiddenSandboxToken);

  if (forbiddenToken !== undefined) {
    throw new Error(`Forbidden iframe sandbox token: ${forbiddenToken}`);
  }

  return Array.from(new Set(normalizedTokens)).join(" ");
}

function isForbiddenSandboxToken(
  token: string
): token is ForbiddenIframeSandboxToken {
  return FORBIDDEN_IFRAME_SANDBOX_TOKENS.includes(
    token as ForbiddenIframeSandboxToken
  );
}
