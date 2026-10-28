import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/h01/e2e",
  fullyParallel: false,
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
