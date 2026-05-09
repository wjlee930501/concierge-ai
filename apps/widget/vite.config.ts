import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  root,
  resolve: {
    alias: {
      "@conciergeai/shared": resolve(root, "../../packages/shared/src/index.ts"),
      "@conciergeai/kb": resolve(root, "../../packages/kb/src/index.ts")
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true
  }
});
