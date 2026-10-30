import { defineConfig, devices } from "@playwright/test"
try { process.loadEnvFile?.(".env"); } catch {}

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/e2e/**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    { command: "pnpm dev:api", port: 4100, reuseExistingServer: true },
    { command: "pnpm dev:web", port: 3100, reuseExistingServer: true },
  ],
})
