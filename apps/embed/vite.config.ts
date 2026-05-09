import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@conciergeai/shared": resolve(root, "../../packages/shared/src/index.ts")
    }
  },
  build: {
    lib: {
      entry: resolve(root, "src/embed-bundle.ts"),
      formats: ["iife"],
      name: "Concierge",
      fileName: () => "embed.js"
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true
  }
});
