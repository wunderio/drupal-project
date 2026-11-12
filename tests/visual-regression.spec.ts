import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { waitForPageStable } from './helpers/visual';

// See tests/docs/visual-regression.md for what to put here.
const PAGES: { path: string; name: string; mask?: string[] }[] = [
  { path: '/', name: 'homepage' },
  // { path: '/user/login', name: 'user-login', mask: ['[data-drupal-messages]'] },
  // { path: '/search', name: 'search' },
  // { path: 'https://staging.example.com/about', name: 'staging-about' },
];

const NO_BASELINE ='Visual regression: no baseline yet, nothing to compare. Run `ddev npm run test:visual:update` to record one.';

const NEW_PAGE_PR ='has no baseline yet, so it was not compared. It is checked once the page is accepted on the baseline branch.';

const NEW_PAGE =
  "No baseline for this page: it is not in the baseline branch's screenshots yet, so it was not compared. " +
  'Check its screenshot in the report, then accept it with a manual workflow run on the baseline branch.';

test.describe('Visual regression', () => {
  for (const [index, { path, name, mask = [] }] of PAGES.entries()) {
    test(name, async ({ page }, testInfo) => {
      const baseline = testInfo.snapshotPath(`${name}.png`, { kind: 'screenshot' });

      // Skip a missing baseline locally (hint) and in pull requests (warning); fail on the baseline branch.
      const missing = !existsSync(baseline) && testInfo.config.updateSnapshots === 'missing';
      if (missing && process.env.VISUAL_SKIP_NEW_PAGES === 'true') {
        console.log(`\n::warning title=Visual regression: NEW PAGE::${name} (${testInfo.project.name}) ${NEW_PAGE_PR}`);
        test.skip(true, NEW_PAGE_PR);
      }
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
