// Builds the embed.js IIFE bundle, copies it into apps/widget/public/embed.js,
// then runs the widget Vite production build.
//
// Order matters: widget Vite copies public/ to dist/ during build, so embed.js
// must be present in apps/widget/public/ before the widget build starts.

import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const widgetPublicDir = resolve(repoRoot, "apps/widget/public");
const widgetEmbedDest = resolve(widgetPublicDir, "embed.js");
const widgetEmbedSourceMapDest = resolve(widgetPublicDir, "embed.js.map");
const embedDist = resolve(repoRoot, "apps/embed/dist/embed.js");
const embedDistMap = resolve(repoRoot, "apps/embed/dist/embed.js.map");

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: "inherit", cwd: repoRoot });
}

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

run("npm run build:embed");

if (!existsSync(embedDist)) {
  throw new Error(
    `embed bundle missing at ${embedDist} after build:embed; aborting widget build`
  );
}

ensureDir(widgetPublicDir);
copyFileSync(embedDist, widgetEmbedDest);
if (existsSync(embedDistMap)) {
  copyFileSync(embedDistMap, widgetEmbedSourceMapDest);
}
console.log(`Copied embed.js → ${widgetEmbedDest}`);

run("npm run build:widget");
