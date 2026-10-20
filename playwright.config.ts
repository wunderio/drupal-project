import { defineConfig, devices } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/* Visual regression spec, only run by the visual-* projects. */
const visualSpec = /.*visual-regression\.spec\.ts/;

/* Visual regression projects are enabled by `npm run test:visual*` (VISUAL_REGRESSION=1). */
const visualProjects = process.env.VISUAL_REGRESSION
  ? [
      {
        name: 'visual-desktop',
        testMatch: visualSpec,
        use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      },
      {
        name: 'visual-mobile',
        testMatch: visualSpec,
        use: { ...devices['Pixel 7'] },
      },
    ]
  : [];

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
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { open: 'never' }]],
  /* Visual regression baselines (git-ignored, machine-specific). */
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: { maxDiffPixels: 100, animations: 'disabled' },
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: process.env.TEST_BASE_URL,
    ignoreHTTPSErrors: true,

    /* HTTP basic auth for Silta environments. */
    ...(process.env.TEST_HTTP_USER
      ? {
          httpCredentials: {
            username: process.env.TEST_HTTP_USER,
            password: process.env.TEST_HTTP_PASS || '',
          },
        }
      : {}),

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on test failure. See https://playwright.dev/docs/screenshots */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.setup\.ts/, visualSpec],
    },

    {
      name: 'firefox',
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
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.setup\.ts/, visualSpec],
    },

    /* Visual regression (desktop + mobile), see tests/visual-regression.spec.ts. */
    ...visualProjects,

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
