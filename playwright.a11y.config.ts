import { defineConfig, devices } from '@playwright/test';

const testBaseUrl =
  process.env.TEST_BASE_URL ||
  process.env.DDEV_PRIMARY_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  'http://127.0.0.1';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*accessibility.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: testBaseUrl,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
