import type { Page } from '@playwright/test';

/**
 * Scroll through the page to trigger lazy-loaded content, return to the top
 * and wait until network and web fonts have settled. Scrolling stops after
 * `maxScreens` viewports, so an infinite-scroll page cannot loop until timeout.
 */
export async function waitForPageStable(page: Page, maxScreens = 30): Promise<void> {
  await page.evaluate(async (max) => {
    const end = () => Math.min(document.body.scrollHeight, window.innerHeight * max);
    for (let y = 0; y < end(); y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    window.scrollTo(0, 0);
  }, maxScreens);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}
