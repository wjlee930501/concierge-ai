// Shared markdown target path guard + report sanitizer for the Week 1
// PR-body/PR-template validators (`scripts/validate-pr-evidence.mjs` and
// `scripts/validate-pr-template.mjs`). Centralizes the path safety/output
// boundary so both validators reject identical inputs with identical
// error wording. This module does not read any environment values, secrets,
// or external APIs; it only inspects the supplied path string and the
// supplied real-path string against the workspace cwd.

import path from "node:path";

export const TARGET_PATH_ECHO_MAX_LENGTH = 240;

export function sanitizeForReport(
  value,
  maxLength = TARGET_PATH_ECHO_MAX_LENGTH
) {
  if (typeof value !== "string") {
    return "<non-string>";
  }
  let cleaned = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      cleaned += "?";
    } else {
      cleaned += char;
    }
  }
  if (cleaned.length > maxLength) {
    cleaned = `${cleaned.slice(0, maxLength)}…`;
  }
  return cleaned;
}

export function assertSafeMarkdownTargetPath(targetPath, cwd = process.cwd()) {
  if (typeof targetPath !== "string" || targetPath.length === 0) {
    throw new Error("target path must be a non-empty string");
  }

  const resolvedCwd = path.resolve(cwd);
  const resolvedTarget = path.resolve(resolvedCwd, targetPath);
  const relativeTarget = path.relative(resolvedCwd, resolvedTarget);

  if (
    relativeTarget.length === 0 ||
    relativeTarget.startsWith("..") ||
    path.isAbsolute(relativeTarget)
  ) {
    throw new Error("target path must stay inside the repo workspace");
  }

  const segments = relativeTarget.split(path.sep);
  if (
    segments.some((segment) => segment === ".." || segment.startsWith(".env"))
  ) {
    throw new Error(
      "target path must not reference .env* or traversal segments"
    );
  }

  if (path.extname(relativeTarget) !== ".md") {
    throw new Error("target path must be a markdown file");
  }

  return resolvedTarget;
}

export function assertPathStaysInsideWorkspace(resolvedTarget, resolvedCwd) {
  const realRelativeTarget = path.relative(resolvedCwd, resolvedTarget);
  if (
    realRelativeTarget.length === 0 ||
    realRelativeTarget.startsWith("..") ||
    path.isAbsolute(realRelativeTarget)
  ) {
    throw new Error("target real path must stay inside the repo workspace");
  }

  const realSegments = realRelativeTarget.split(path.sep);
  if (
    realSegments.some(
      (segment) => segment === ".." || segment.startsWith(".env")
    )
  ) {
    throw new Error(
      "target real path must not reference .env* or traversal segments"
    );
  }
}
