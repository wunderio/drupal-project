import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { waitForPageStable } from './helpers/visual';

// Pages to compare, as an anonymous user. Add more pages here.
// - `path`: relative to TEST_BASE_URL. Locally that is your DDEV site with its
//   own content; in GitHub Actions it is a fresh install from config/sync with
//   no content, so use pages that exist there too (front page, user login,
//   search...), not e.g. /node/1.
//   An absolute URL also works (it ignores TEST_BASE_URL), but GitHub Actions
//   would then screenshot a remote site that can change at any time. To test
//   another environment such as staging, change TEST_BASE_URL instead of the
//   paths, and record a baseline for it first: baselines are stored per
//   project and name, not per host.
// - `name`: the screenshot file name, unique and URL-safe.
// Viewports (desktop + mobile) are the visual-* projects in playwright.config.ts.
const PAGES = [
  { path: '/', name: 'homepage' },
  // { path: '/user/login', name: 'user-login' },
  // { path: '/search', name: 'search' },
  // Absolute URL, local runs only (see above):
  // { path: 'https://staging.example.com/about', name: 'staging-about' },
];

const NO_BASELINE =
  'Visual regression: no baseline yet, nothing to compare. Run `ddev npm run test:visual:update` to record one.';

test.describe('Visual regression', () => {
  for (const [index, { path, name }] of PAGES.entries()) {
    test(name, async ({ page }, testInfo) => {
      // Same path toHaveScreenshot uses, also if a screenshot-specific pathTemplate is set.
      const baseline = testInfo.snapshotPath(`${name}.png`, { kind: 'screenshot' });

      // Without a baseline `toHaveScreenshot` would fail. Locally, skip with a hint instead,
      // unless baselines are being recorded (--update-snapshots). In CI a missing screenshot
      // fails, so a page added to PAGES is not silently left uncompared.
      const missing = !existsSync(baseline);
      if (missing && testInfo.config.updateSnapshots === 'missing' && !process.env.CI) {
        console.log(`[${testInfo.project.name}] ${NO_BASELINE}`);
        test.skip(true, NO_BASELINE);
      }

      await page.goto(path, { waitUntil: 'networkidle' });
      await waitForPageStable(page);
      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });

      // Only reached when the comparison passed (a failure already shows expected / actual / diff).
      // Attach the baseline of the first page, so the report shows what was compared without growing much.
      if (index === 0) {
        await testInfo.attach(`compared against baseline: ${name}`, {
          path: baseline,
          contentType: 'image/png',
        });
      }
    });
  }
});
