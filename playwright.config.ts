import { defineConfig, devices } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

const visualSpec = /.*visual-regression\.spec\.ts/;

/* No retries (a changed page fails every time), no failure screenshot (report shows the diff). */
const visual = { testMatch: visualSpec, retries: 0 };
const visualUse = { screenshot: 'off' as const };

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './playwright/test-results',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['html', { open: 'never', outputFolder: 'playwright/report' }],
        ['github'],
      ]
    : [
        ['html', { open: 'never', outputFolder: 'playwright/report' }],
        ['list'],
        ['./tests/reporters/ddev-report-hint.ts'],
      ],
  snapshotDir: './playwright/screenshots',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixels: 100, stylePath: './tests/css/visual.css' },
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.TEST_BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on test failure. See https://playwright.dev/docs/screenshots */
    screenshot: 'only-on-failure',
  },

  /* Names are <test type>-<browser or device>, so --project="e2e-*" runs one type. */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'e2e-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.setup\.ts/, visualSpec],
    },

    {
      name: 'e2e-firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: authFile,
        launchOptions: {
          firefoxUserPrefs: {
            // Disable speculative pre-connections to prevent Firefox from
            // consuming Drupal one-time login URLs before page.goto() navigates.
            'network.http.speculative-parallel-limit': 0,
          },
        },
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.setup\.ts/, visualSpec],
    },

    {
      name: 'e2e-webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.setup\.ts/, visualSpec],
    },

    {
      name: 'visual-desktop',
      ...visual,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...visualUse },
    },
    {
      name: 'visual-mobile',
      ...visual,
      use: { ...devices['Pixel 7'], ...visualUse },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
