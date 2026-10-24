import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4272);
const fixturePort = Number(process.env.FIXTURE_PORT ?? 4273);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node tests/fixture-api.mjs",
      url: `http://127.0.0.1:${fixturePort}/health/ready`,
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: `pnpm start --port ${port} --hostname 127.0.0.1`,
      url: `http://127.0.0.1:${port}`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
      env: {
        INKBYTE_API_URL: `http://127.0.0.1:${fixturePort}`,
        SITE_URL: `http://127.0.0.1:${port}`,
      },
    },
  ],
});
