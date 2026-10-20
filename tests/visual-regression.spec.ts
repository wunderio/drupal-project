import { expect, test } from '@playwright/test';
import { waitForPageStable } from './helpers/visual';

// Pages to compare. `name` is the screenshot file name, keep it URL-safe.
// Viewports (desktop + mobile) are the visual-* projects in playwright.config.ts.
const PAGES = [
  { path: '/', name: 'homepage' },
  // { path: '/user/login', name: 'user-login' },
];

test.describe('Visual regression', () => {
  for (const { path, name } of PAGES) {
    test(name, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      await waitForPageStable(page);
      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }
});
