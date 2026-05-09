import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const hostDir = resolve(currentDir, "../../../hosts/motionlabs-kr");

const child = spawn("npm", ["run", "dev", "--", "--port", "5180"], {
  cwd: hostDir,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal !== null) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
