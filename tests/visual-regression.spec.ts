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
// - `mask` (optional): CSS selectors of content that changes between runs (dates,
//   status messages, rotating banners). Those areas are painted over in both the
//   baseline and the new screenshot. To hide something on every page, use
//   tests/css/visual.css instead.
// Viewports (desktop + mobile) are the visual-* projects in playwright.config.ts.
// Locally, visual and e2e tests share your DDEV site: pages that list content
// (front page with promoted nodes, views) change after e2e runs create content.
const PAGES: { path: string; name: string; mask?: string[] }[] = [
  { path: '/', name: 'homepage' },
  // { path: '/user/login', name: 'user-login', mask: ['[data-drupal-messages]'] },
  // { path: '/search', name: 'search' },
  // Absolute URL, local runs only (see above):
  // { path: 'https://staging.example.com/about', name: 'staging-about' },
];

const NO_BASELINE =
  'Visual regression: no baseline yet, nothing to compare. Run `ddev npm run test:visual:update` to record one.';

const NEW_PAGE =
  "No baseline for this page: it is not in the baseline branch's screenshots yet, so it was not compared. " +
  'Expected for a pull request that adds a page: check its screenshot in the report, ' +
  'the baseline branch records it after merge.';

test.describe('Visual regression', () => {
  for (const [index, { path, name, mask = [] }] of PAGES.entries()) {
    test(name, async ({ page }, testInfo) => {
      // Same path toHaveScreenshot uses, also if a screenshot-specific pathTemplate is set.
      const baseline = testInfo.snapshotPath(`${name}.png`, { kind: 'screenshot' });

      // Without a baseline `toHaveScreenshot` would fail. Locally, skip with a hint instead,
      // unless baselines are being recorded (--update-snapshots). In CI a missing screenshot
      // fails, so a page added to PAGES is not silently left uncompared.
      const missing = !existsSync(baseline) && testInfo.config.updateSnapshots === 'missing';
      if (missing && !process.env.CI) {
        console.log(`[${testInfo.project.name}] ${NO_BASELINE}`);
        test.skip(true, NO_BASELINE);
      }

      await page.goto(path, { waitUntil: 'networkidle' });
      await waitForPageStable(page);
      // CI only (locally the test was skipped): say why it fails on the pull request's checks page.
      // Soft, so toHaveScreenshot still runs and puts the new screenshot in the report.
      expect.soft(missing, NEW_PAGE).toBe(false);
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        mask: mask.map((selector) => page.locator(selector)),
      });

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
