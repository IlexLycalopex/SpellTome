import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:4321',
    // CI/dev containers pre-install Chromium outside Playwright's cache
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : undefined,
  },
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321/next/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
