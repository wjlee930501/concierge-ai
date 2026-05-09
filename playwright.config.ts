import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5181",
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command:
        "npm --workspace=@conciergeai/embed run build && npx vite apps/embed/dist --host 127.0.0.1 --port 5174 --strictPort",
      url: "http://127.0.0.1:5174/embed.js",
      timeout: 120_000,
      reuseExistingServer: false
    },
    {
      command:
        "VITE_CONCIERGE_ENVIRONMENT=development VITE_CONCIERGE_ALLOWED_ORIGINS=http://127.0.0.1:5181 VITE_CONCIERGE_EMBED_BASE=http://127.0.0.1:5173 npm --workspace=@conciergeai/widget run dev -- --host 127.0.0.1 --port 5173 --strictPort",
      url: "http://127.0.0.1:5173/",
      timeout: 120_000,
      reuseExistingServer: false
    },
    {
      command:
        "npx vite tests/e2e/fixtures --host 127.0.0.1 --port 5181 --strictPort",
      url: "http://127.0.0.1:5181/",
      timeout: 120_000,
      reuseExistingServer: false
    }
  ]
});

