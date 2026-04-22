import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
  },
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    timeout: 60 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
