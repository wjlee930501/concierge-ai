import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceDir = resolve(currentDir, "..");
const repoRoot = resolve(workspaceDir, "../..");
const hostDir = resolve(repoRoot, "hosts/motionlabs-kr");

function detectCase() {
  if (
    existsSync(resolve(hostDir, "next.config.js")) ||
    existsSync(resolve(hostDir, "next.config.mjs")) ||
    existsSync(resolve(hostDir, "next.config.ts"))
  ) {
    return "next";
  }

  if (
    existsSync(resolve(hostDir, "vite.config.js")) ||
    existsSync(resolve(hostDir, "vite.config.ts"))
  ) {
    return "vite";
  }

  if (existsSync(resolve(hostDir, "index.html"))) {
    return "static";
  }

  return "unknown";
}

const detected = detectCase();
console.log(`[host-preview] motionlabs host case detected: ${detected}`);

const scriptMap = { static: "dev:static", next: "dev:next", vite: "dev:vite" };
const script = scriptMap[detected];

if (script === undefined) {
  console.error(
    "[host-preview] unsupported host case. Use dev:static / dev:next / dev:vite manually."
  );
  process.exit(1);
}

const child = spawn(
  "npm",
  ["run", script, "--workspace=@conciergeai/host-preview"],
  {
    cwd: repoRoot,
    stdio: "inherit"
  }
);

child.on("exit", (code, signal) => {
  if (signal !== null) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
