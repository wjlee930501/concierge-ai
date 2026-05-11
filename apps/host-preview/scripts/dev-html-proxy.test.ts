import { describe, expect, test } from "vitest";

const proxyModule = await import("./dev-html-proxy.mjs");

describe("host preview html proxy", () => {
  test("injects the local Concierge embed before closing body", () => {
    const snippet = proxyModule.buildInjectionSnippet({
      widgetOrigin: "http://localhost:5173",
      publicOrigin: "http://127.0.0.1:5181"
    });

    const html = proxyModule.injectIntoHtml(
      "<html><body><main>MotionLabs</main></body></html>",
      snippet
    );

    expect(html).toContain('id="concierge-ai-local-preview"');
    expect(html).toContain('src="http://localhost:5173/embed.js"');
    expect(html).toContain(
      'data-concierge-host-origin="http://127.0.0.1:5181"'
    );
    expect(html.indexOf("concierge-ai-local-preview")).toBeLessThan(
      html.indexOf("</body>")
    );
  });

  test("does not duplicate an existing local preview embed", () => {
    const html =
      '<html><body><script id="concierge-ai-local-preview"></script></body></html>';

    expect(proxyModule.injectIntoHtml(html, "<script></script>")).toBe(html);
  });

  test("injects a local-only anchor annotation script before the embed", () => {
    const snippet = [
      proxyModule.buildLocalPreviewChromeSnippet(),
      proxyModule.buildAnchorAnnotationSnippet(),
      proxyModule.buildInjectionSnippet({
        widgetOrigin: "http://localhost:5173",
        publicOrigin: "http://127.0.0.1:5181"
      })
    ].join("");
    const html = proxyModule.injectIntoHtml("<body></body>", snippet);

    expect(html).toContain('id="concierge-ai-local-preview-chrome"');
    expect(html).toContain("nextjs-portal");
    expect(html).toContain('id="concierge-ai-local-anchor-map"');
    expect(html).toContain('data-concierge-section", rule.key');
    expect(html.indexOf("concierge-ai-local-preview-chrome")).toBeLessThan(
      html.indexOf("concierge-ai-local-anchor-map")
    );
    expect(html.indexOf("concierge-ai-local-anchor-map")).toBeLessThan(
      html.indexOf('id="concierge-ai-local-preview"')
    );
  });

  test("does not duplicate when preview embed already exists", () => {
    const html =
      '<body><script id="concierge-ai-local-preview"></script></body>';

    expect(
      proxyModule.injectIntoHtml(
        html,
        `${proxyModule.buildAnchorAnnotationSnippet()}<script></script>`
      )
    ).toBe(html);
  });

  test("removes upstream CSP headers so local dev script can load", () => {
    expect(
      proxyModule.stripContentSecurityHeaders({
        "content-security-policy": "script-src 'self'",
        "content-security-policy-report-only": "default-src 'self'",
        "cache-control": "no-store"
      })
    ).toEqual({ "cache-control": "no-store" });
  });

  test("normalizes rewritten HTML headers after buffering", () => {
    expect(
      proxyModule.prepareRewrittenHtmlHeaders(
        {
          "content-security-policy": "script-src 'self'",
          "content-encoding": "gzip",
          "content-length": "11",
          "transfer-encoding": "chunked",
          "content-type": "text/html; charset=utf-8"
        },
        123
      )
    ).toEqual({
      "content-type": "text/html; charset=utf-8",
      "content-length": 123
    });
  });

  test("keeps local preview script attributes escaped", () => {
    const snippet = proxyModule.buildInjectionSnippet({
      widgetOrigin: 'http://localhost:5173/?q="<bad>"',
      publicOrigin: "http://127.0.0.1:5181"
    });

    expect(snippet).toContain("&quot;&lt;bad&gt;&quot;");
    expect(snippet).not.toContain('q="<bad>"');
  });

  test("rewrites public preview origin headers before proxying to Next dev", () => {
    const headers = proxyModule.rewriteUpstreamRequestHeaders(
      {
        host: "127.0.0.1:5181",
        origin: "http://127.0.0.1:5181",
        referer: "http://127.0.0.1:5181/revisit",
        "accept-encoding": "gzip, deflate"
      },
      {
        publicOrigin: new URL("http://127.0.0.1:5181"),
        upstreamOrigin: new URL("http://127.0.0.1:5180")
      }
    );

    expect(headers).toMatchObject({
      host: "127.0.0.1:5180",
      origin: "http://127.0.0.1:5180",
      referer: "http://127.0.0.1:5180/revisit",
      "accept-encoding": "identity"
    });
  });
});
