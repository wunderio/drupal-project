import type { Page } from '@playwright/test';

// Upper bound for the scroll loop, so an infinite-scroll page can't hang the test.
const MAX_SCROLL_STEPS = 50;

/**
 * Make the page look the same on every run: scroll until it stops growing
 * (lazy-loaded content), wait for images, web fonts and the network, then
 * return to the top.
 */
export async function waitForPageStable(page: Page): Promise<void> {
  await page.evaluate(async (maxSteps) => {
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    let y = 0;
    let lastHeight = -1;
    for (let step = 0; step < maxSteps; step++) {
      window.scrollTo(0, y);
      await pause(150);
      const height = document.documentElement.scrollHeight;
      if (y + window.innerHeight >= height) {
        if (height === lastHeight) break;
        lastHeight = height;
      }
      y += window.innerHeight;
    }
    await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)));
    window.scrollTo(0, 0);
  }, MAX_SCROLL_STEPS);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}
