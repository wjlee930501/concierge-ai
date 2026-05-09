import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, "../../..");

const children = [
  spawn("npm", ["run", "dev:widget"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      VITE_CONCIERGE_ALLOWED_ORIGINS: "http://localhost:5180",
      VITE_CONCIERGE_EMBED_BASE: "http://localhost:5173",
      VITE_CONCIERGE_ENVIRONMENT: "development"
    },
    stdio: "inherit"
  }),
  spawn("npm", ["run", "dev:auto", "--workspace=@conciergeai/host-preview"], {
    cwd: repoRoot,
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
