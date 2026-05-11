import http from "node:http";
import net from "node:net";

const upstreamOrigin = readUrlEnv(
  "HOST_PREVIEW_UPSTREAM_ORIGIN",
  "http://127.0.0.1:5180"
);
const widgetOrigin = readUrlEnv(
  "HOST_PREVIEW_WIDGET_ORIGIN",
  "http://localhost:5173"
);
const publicOrigin = readUrlEnv(
  "HOST_PREVIEW_PUBLIC_ORIGIN",
  "http://127.0.0.1:5181"
);
const listenPort = Number.parseInt(
  process.env.HOST_PREVIEW_PROXY_PORT ?? publicOrigin.port ?? "5181",
  10
);
const listenHost = process.env.HOST_PREVIEW_PROXY_HOST ?? "127.0.0.1";

if (!Number.isInteger(listenPort) || listenPort <= 0) {
  throw new Error("HOST_PREVIEW_PROXY_PORT must be a positive integer");
}

export function buildInjectionSnippet(input) {
  const widgetOriginValue = escapeHtmlAttribute(input.widgetOrigin);
  const publicOriginValue = escapeHtmlAttribute(input.publicOrigin);
  return [
    '<script id="concierge-ai-local-preview"',
    ` src="${widgetOriginValue}/embed.js"`,
    ` data-concierge-widget-origin="${widgetOriginValue}"`,
    ` data-concierge-host-origin="${publicOriginValue}"`,
    ' data-concierge-preview="motionlabs-local-proxy"',
    "></script>"
  ].join("");
}

export function buildAnchorAnnotationSnippet() {
  return `<script id="concierge-ai-local-anchor-map" data-concierge-preview="motionlabs-local-proxy">
(function () {
  var rules = [
    { key: "hero", selectors: [".hero-static"], phrases: ["어렵게 유치한 신규 환자"] },
    { key: "revisit", phrases: ["맞춤형 리마인드로", "환자 노쇼를 방지"] },
    { key: "newvisit", phrases: ["뉴비짓(New-visit)", "신환 유치"] },
    { key: "px-intelligence", phrases: ["환자 데이터 분석"] },
    { key: "contact", phrases: ["어렵게 유치한 신규환자", "상담 신청하기"] }
  ];

  function isUsableElement(node) {
    if (!(node instanceof HTMLElement)) return false;
    if (node.closest("#concierge-ai-widget")) return false;
    var rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function targetFor(node) {
    if (!(node instanceof HTMLElement)) return null;
    if (node.matches("button,a")) return node;
    return node.closest("section") || node;
  }

  function findBySelector(selectors) {
    for (var i = 0; i < selectors.length; i += 1) {
      var node = document.querySelector(selectors[i]);
      if (isUsableElement(node)) return node;
    }
    return null;
  }

  function findByPhrase(phrases) {
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll("section, main section, main div, header button, a, button, h1, h2, h3, p")
    );
    for (var p = 0; p < phrases.length; p += 1) {
      for (var i = 0; i < nodes.length; i += 1) {
        var node = nodes[i];
        var text = (node.textContent || "").replace(/\\s+/g, " ").trim();
        if (text.indexOf(phrases[p]) !== -1 && isUsableElement(node)) {
          return targetFor(node);
        }
      }
    }
    return null;
  }

  function annotate() {
    rules.forEach(function (rule) {
      if (document.querySelector('[data-concierge-section="' + rule.key + '"]')) {
        return;
      }
      var node = findBySelector(rule.selectors || []) || findByPhrase(rule.phrases || []);
      if (node) node.setAttribute("data-concierge-section", rule.key);
    });
  }

  annotate();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", annotate, { once: true });
  }
  var attempts = 0;
  var timer = window.setInterval(function () {
    annotate();
    attempts += 1;
    if (attempts >= 20) window.clearInterval(timer);
  }, 500);
})();
</script>`;
}

export function buildLocalPreviewChromeSnippet() {
  return `<style id="concierge-ai-local-preview-chrome" data-concierge-preview="motionlabs-local-proxy">
nextjs-portal,
#nextjs-portal,
[data-nextjs-dev-tools-button],
[data-nextjs-dev-tools-panel],
[data-nextjs-toast],
[data-nextjs-dialog-overlay] {
  display: none !important;
}
</style>`;
}

export function injectIntoHtml(html, snippet) {
  if (html.includes('id="concierge-ai-local-preview"')) return html;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${snippet}</body>`);
  }
  if (html.includes("</head>")) {
    return html.replace("</head>", `${snippet}</head>`);
  }
  return `${html}${snippet}`;
}

export function stripContentSecurityHeaders(headers) {
  const nextHeaders = { ...headers };
  delete nextHeaders["content-security-policy"];
  delete nextHeaders["content-security-policy-report-only"];
  return nextHeaders;
}

export function prepareRewrittenHtmlHeaders(headers, contentLength) {
  const nextHeaders = stripContentSecurityHeaders(headers);
  delete nextHeaders["content-encoding"];
  delete nextHeaders["content-length"];
  delete nextHeaders["transfer-encoding"];
  return {
    ...nextHeaders,
    "content-length": contentLength
  };
}

export function rewriteUpstreamRequestHeaders(headers, input) {
  const nextHeaders = {
    ...headers,
    host: input.upstreamOrigin.host,
    "accept-encoding": "identity"
  };

  if (typeof nextHeaders.origin === "string") {
    nextHeaders.origin = rewritePublicUrlForUpstream(nextHeaders.origin, input);
  }

  if (typeof nextHeaders.referer === "string") {
    nextHeaders.referer = rewritePublicUrlForUpstream(
      nextHeaders.referer,
      input
    );
  }

  return nextHeaders;
}

if (isMainModule()) {
  startProxy();
}

function startProxy() {
  const server = http.createServer((req, res) => {
    void proxyHttpRequest(req, res);
  });

  server.on("upgrade", (req, socket, head) => {
    proxyUpgradeRequest(req, socket, head);
  });

  server.listen(listenPort, listenHost, () => {
    console.log(
      `[host-preview] proxy ${publicOrigin.href} -> ${upstreamOrigin.href}`
    );
    console.log(
      `[host-preview] injecting Concierge embed from ${widgetOrigin.href}`
    );
  });
}

async function proxyHttpRequest(req, res) {
  const targetUrl = new URL(req.url ?? "/", upstreamOrigin);
  const proxyReq = http.request(
    targetUrl,
    {
      method: req.method,
      headers: rewriteUpstreamRequestHeaders(req.headers, {
        publicOrigin,
        upstreamOrigin
      })
    },
    (proxyRes) => {
      const contentType = proxyRes.headers["content-type"] ?? "";
      const isHtml =
        typeof contentType === "string" && contentType.includes("text/html");

      if (!isHtml) {
        res.writeHead(
          proxyRes.statusCode ?? 502,
          stripContentSecurityHeaders(proxyRes.headers)
        );
        proxyRes.pipe(res);
        return;
      }

      const chunks = [];
      proxyRes.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      proxyRes.on("end", () => {
        const html = Buffer.concat(chunks).toString("utf8");
        const snippet = buildInjectionSnippet({
          widgetOrigin: withoutTrailingSlash(widgetOrigin.href),
          publicOrigin: withoutTrailingSlash(publicOrigin.href)
        });
        const body = injectIntoHtml(
          html,
          `${buildLocalPreviewChromeSnippet()}${buildAnchorAnnotationSnippet()}${snippet}`
        );
        const headers = prepareRewrittenHtmlHeaders(
          proxyRes.headers,
          Buffer.byteLength(body)
        );
        res.writeHead(proxyRes.statusCode ?? 200, headers);
        res.end(body);
      });
    }
  );

  proxyReq.on("error", (error) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`host-preview upstream error: ${error.message}`);
  });

  req.pipe(proxyReq);
}

function proxyUpgradeRequest(req, socket, head) {
  const headers = rewriteUpstreamRequestHeaders(req.headers, {
    publicOrigin,
    upstreamOrigin
  });
  const upstreamSocket = net.connect(
    Number.parseInt(upstreamOrigin.port || "80", 10),
    upstreamOrigin.hostname,
    () => {
      upstreamSocket.write(
        `${req.method ?? "GET"} ${req.url ?? "/"} HTTP/${req.httpVersion}\r\n`
      );
      for (const [key, value] of Object.entries(headers)) {
        if (value === undefined) continue;
        const headerValue = Array.isArray(value) ? value.join(", ") : value;
        upstreamSocket.write(`${key}: ${headerValue}\r\n`);
      }
      upstreamSocket.write("\r\n");
      if (head.length > 0) upstreamSocket.write(head);
      socket.pipe(upstreamSocket);
      upstreamSocket.pipe(socket);
    }
  );

  upstreamSocket.on("error", () => {
    socket.destroy();
  });
}

function readUrlEnv(name, fallback) {
  const raw = process.env[name] ?? fallback;
  try {
    return new URL(raw);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

function withoutTrailingSlash(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function rewritePublicUrlForUpstream(value, input) {
  try {
    const url = new URL(value);
    if (url.origin !== input.publicOrigin.origin) return value;
    if (value === input.publicOrigin.origin) return input.upstreamOrigin.origin;
    url.protocol = input.upstreamOrigin.protocol;
    url.host = input.upstreamOrigin.host;
    return url.href;
  } catch {
    return value;
  }
}

function escapeHtmlAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function isMainModule() {
  return import.meta.url === `file://${process.argv[1]}`;
}
