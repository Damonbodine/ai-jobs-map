import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:3070",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --port 3070",
    url: "http://127.0.0.1:3070",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
