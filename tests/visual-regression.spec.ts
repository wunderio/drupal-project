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

test.describe('Visual regression', () => {
  for (const { path, name } of PAGES) {
    test(name, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      await waitForPageStable(page);
      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }
});
