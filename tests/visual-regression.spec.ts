import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { waitForPageStable } from './helpers/visual';

// Pages to compare, as an anonymous user. Add more pages here.
// - `path`: relative to TEST_BASE_URL. Locally that is your DDEV site with its
//   own content; in GitHub Actions it is a fresh install from config/sync with
//   no content, so use pages that exist there too (front page, user login,
//   search...), not e.g. /node/1.
// - `name`: the screenshot file name, unique and URL-safe.
// Viewports (desktop + mobile) are the visual-* projects in playwright.config.ts.
const PAGES = [
  { path: '/', name: 'homepage' },
  // { path: '/user/login', name: 'user-login' },
  // { path: '/search', name: 'search' },
];

const NO_BASELINE =
  'Visual regression: no baseline yet, nothing to compare. Run `ddev npm run test:visual:update` to record one.';

test.describe('Visual regression', () => {
  for (const { path, name } of PAGES) {
    test(name, async ({ page }, testInfo) => {
      // Without a baseline `toHaveScreenshot` would fail. Skip with a hint instead,
      // unless baselines are being recorded (--update-snapshots).
      const missing = !existsSync(testInfo.snapshotPath(`${name}.png`));
      if (missing && testInfo.config.updateSnapshots === 'missing') {
        console.log(`[${testInfo.project.name}] ${NO_BASELINE}`);
        test.skip(true, NO_BASELINE);
      }

      await page.goto(path, { waitUntil: 'networkidle' });
      await waitForPageStable(page);
      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }
});
