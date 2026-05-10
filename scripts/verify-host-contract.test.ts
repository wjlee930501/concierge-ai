import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REQUIRED_SECTIONS = [
  "hero",
  "social-proof",
  "customer-review",
  "auto-reminder",
  "reminder-content",
  "specialty-tabs",
  "data-analysis",
  "crm-demo",
  "feature-summary",
  "case-data",
  "advisors",
  "security",
  "faq",
  "footer-cta"
] as const;

const REQUIRED_TABS = ["orthopedics", "internal-medicine"] as const;
const REQUIRED_CARDS = ["ortho-revisit-12", "im-revenue-19"] as const;
const REQUIRED_GROUPS = ["ortho-advisors"] as const;

const HOST_DIR = "hosts/motionlabs-kr";
const SOURCE_EXTENSIONS = new Set([".html", ".tsx", ".jsx", ".vue", ".svelte"]);
const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  "dist",
  "build",
  "node_modules"
]);

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return IGNORED_DIRS.has(entry) ? [] : listSourceFiles(path);
    }

    const extension = path.slice(path.lastIndexOf("."));
    return SOURCE_EXTENSIONS.has(extension) ? [path] : [];
  });
}

function readHostSource(): string {
  return listSourceFiles(HOST_DIR)
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");
}

describe("host contract verification", () => {
  if (!existsSync(HOST_DIR)) {
    it.skip("hosts/motionlabs-kr not present; skipping local host contract verification", () => {});
    return;
  }

  const allSource = readHostSource();

  REQUIRED_SECTIONS.forEach((section) => {
    it(`declares data-mc-section="${section}"`, () => {
      expect(allSource.includes(`data-mc-section="${section}"`)).toBe(true);
    });
  });

  REQUIRED_TABS.forEach((tab) => {
    it(`declares data-mc-tab="${tab}"`, () => {
      expect(allSource.includes(`data-mc-tab="${tab}"`)).toBe(true);
    });
  });

  REQUIRED_CARDS.forEach((card) => {
    it(`declares data-mc-card="${card}"`, () => {
      expect(allSource.includes(`data-mc-card="${card}"`)).toBe(true);
    });
  });

  REQUIRED_GROUPS.forEach((group) => {
    it(`declares data-mc-group="${group}"`, () => {
      expect(allSource.includes(`data-mc-group="${group}"`)).toBe(true);
    });
  });
});
