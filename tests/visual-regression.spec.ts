import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { waitForPageStable } from './helpers/visual';

// See README "Visual regression tests" for what to put here.
const PAGES: { path: string; name: string; mask?: string[] }[] = [
  { path: '/', name: 'homepage' },
  // { path: '/user/login', name: 'user-login', mask: ['[data-drupal-messages]'] },
  // { path: '/search', name: 'search' },
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
      const baseline = testInfo.snapshotPath(`${name}.png`, { kind: 'screenshot' });

      // Locally skip a missing baseline with a hint, in CI fail, so no page goes uncompared.
      const missing = !existsSync(baseline) && testInfo.config.updateSnapshots === 'missing';
      if (missing && !process.env.CI) {
        console.log(`[${testInfo.project.name}] ${NO_BASELINE}`);
        test.skip(true, NO_BASELINE);
      }

      await page.goto(path, { waitUntil: 'networkidle' });
      await waitForPageStable(page);

      expect.soft(missing, NEW_PAGE).toBe(false);
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        mask: mask.map((selector) => page.locator(selector)),
      });

      // Passed: show what was compared (first page only, keeps the report small).
      if (index === 0) {
        await testInfo.attach(`compared against baseline: ${name}`, {
          path: baseline,
          contentType: 'image/png',
        });
      }
    });
  }
});
