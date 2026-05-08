# Embed Scaffold

This package is a Week 1 non-networked scaffold for the future `embed.js`
surface.

- Default parent-page access is disabled: no parent DOM scrape, cookie read,
  localStorage read, sessionStorage read, or parent DOM write.
- The iframe sandbox helper keeps `allow-same-origin` off by default.
- Top-navigation sandbox tokens are forbidden.
- The runtime factory only composes pure config helpers: parent-access assertion,
  iframe sandbox policy, origin allowlist/`targetOrigin`, and CSP
  `frame-ancestors`.
- The ready envelope uses `type: "concierge.embed.ready"` and
  `source: "concierge.embed"`. Its payload contains scaffold metadata only:
  sandbox policy, `frame-ancestors`, and parent-access flags. It must not carry
  identifiers, user data, referrer, user agent, session IDs, or other PII.
- `allowedParentOrigins` controls the postMessage `targetOrigin` allowlist.
  `frameAncestors` controls only the CSP framing policy. When omitted,
  `frameAncestors` defaults to `allowedParentOrigins`; an explicit empty list
  emits `frame-ancestors 'none'` without changing postMessage target-origin
  validation.
- Runtime `environment` can tighten the allowlist: `staging`, `preview`, and
  `production` origins must be `https`; `development` and `test` origins are
  limited to localhost, loopback, and `.example.test` fixtures.
- `null`/opaque postMessage origins are not supported and must fail closed
  before handshake handling.
- CSP output always includes a `frame-ancestors` directive. The default uses
  `.example.test` placeholder origins only.
- No production origin, webhook, API key, scenario JSON, or user-facing final copy
  belongs in this package.
