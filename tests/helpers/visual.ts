import type { Page } from '@playwright/test';

/**
 * Scroll to load lazy content (at most `maxScreens` viewports, so infinite
 * scroll cannot loop), then wait for network and fonts.
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
