import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { waitForPageStable } from './helpers/visual';

// Pages to compare, from visual-pages.json:
//   path      URL path, relative to TEST_BASE_URL
//   name      screenshot file name, unique and URL-safe
//   mask      optional CSS selectors painted over before comparing (dates, rotating banners)
//   fullPage  optional, false = viewport only (default true)
// Viewports (desktop + mobile) are the visual-* projects in playwright.config.ts.
type VisualPage = { path: string; name: string; mask?: string[]; fullPage?: boolean };

const PAGES: VisualPage[] = JSON.parse(
  readFileSync(new URL('./visual-pages.json', import.meta.url), 'utf8'),
);

const names = PAGES.map(({ name }) => name);
for (const name of names) {
  if (!/^[a-z0-9-]+$/.test(name) || names.indexOf(name) !== names.lastIndexOf(name)) {
    throw new Error(`visual-pages.json: "${name}" must be unique and use only a-z, 0-9 and "-".`);
  }
}

test.describe('Visual regression', { tag: '@visual' }, () => {
  for (const { path, name, mask = [], fullPage = true } of PAGES) {
    test(name, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'networkidle' });

      // Never screenshot (and later accept as baseline) an error, login or
      // maintenance page.
      expect(response?.status(), `${path} must not answer with an error`).toBeLessThan(400);
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();

      await waitForPageStable(page);
      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage,
        mask: mask.map((selector) => page.locator(selector)),
      });
    });
  }
});
