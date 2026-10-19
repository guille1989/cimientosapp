import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "**/*.spec.ts", fullyParallel: false, workers: 1,
  timeout: 60000, expect: { timeout: 12000 },
  use: { baseURL: "http://127.0.0.1:3000", channel: "chrome", ...devices["Desktop Chrome"], trace: "retain-on-failure", screenshot: "only-on-failure" },
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: process.env.CIMIENTO_START_SERVER === "true" ? { command: "npm run dev", url: "http://127.0.0.1:3000/api/state", reuseExistingServer: true, timeout: 120000 } : undefined
});
