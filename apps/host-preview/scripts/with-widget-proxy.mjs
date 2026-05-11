import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../..");

const widgetOrigin = "http://localhost:5173";
const hostUpstreamOrigin = "http://127.0.0.1:5180";
const hostPreviewOrigin = "http://127.0.0.1:5181";

const children = [
  spawn("npm", ["run", "dev:widget"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      VITE_CONCIERGE_ALLOWED_ORIGINS: [
        hostPreviewOrigin,
        "http://localhost:5181"
      ].join(","),
      VITE_CONCIERGE_EMBED_BASE: widgetOrigin,
      VITE_CONCIERGE_ENVIRONMENT: "development"
    },
    stdio: "inherit"
  }),
  spawn("npm", ["run", "dev:auto", "--workspace=@conciergeai/host-preview"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: "5180"
    },
    stdio: "inherit"
  }),
  spawn("npm", ["run", "dev:proxy", "--workspace=@conciergeai/host-preview"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      HOST_PREVIEW_UPSTREAM_ORIGIN: hostUpstreamOrigin,
      HOST_PREVIEW_WIDGET_ORIGIN: widgetOrigin,
      HOST_PREVIEW_PUBLIC_ORIGIN: hostPreviewOrigin,
      HOST_PREVIEW_PROXY_HOST: "127.0.0.1",
      HOST_PREVIEW_PROXY_PORT: "5181"
    },
    stdio: "inherit"
  })
];

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

for (const child of children) {
  child.on("exit", (code) => {
    shutdown(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
