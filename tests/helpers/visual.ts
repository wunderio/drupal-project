import type { Page } from '@playwright/test';

/**
 * Scroll through the page to trigger lazy-loaded content, return to the top
 * and wait until network and web fonts have settled.
 */
export async function waitForPageStable(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}
