import { Drupal, DrupalSite } from '@drupal/playwright';
import { test as base } from '@playwright/test';

export const test = base.extend<
  { drupal: Drupal },
  { drupalSite: DrupalSite }
>({
  drupalSite: [
    async ({}, use) => {
      const drupalSite: DrupalSite = {
        dbPrefix: '',
        userAgent: 'Playwright',
        sitePath: 'sites/default',
        url: process.env.TEST_BASE_URL || '',
        teardown: async () => {
          return 'Teardown complete';
        }
      }
      await use(drupalSite);
    },
    { scope: 'worker', auto: true },
  ],
  drupal: [
    async ({ page, drupalSite }, use) => {
      const drupal = new Drupal({ page, drupalSite });
      await drupal.setTestCookie();
      await use(drupal);
    },
    { auto: true },
  ],
});
