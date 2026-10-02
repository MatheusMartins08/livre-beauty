import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.TEST_PORT || 3100);
const baseURL = `http://localhost:${port}`;
const serverCommand = process.env.TEST_PRODUCTION === "true" ? "start" : "dev";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 8000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    command: `npm.cmd run ${serverCommand} -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
