import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@conciergeai/shared": resolve(__dirname, "packages/shared/src/index.ts"),
      "@conciergeai/kb": resolve(__dirname, "packages/kb/src/index.ts")
    }
  },
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "tests/e2e/**",
      "hosts/**"
    ]
  }
});
