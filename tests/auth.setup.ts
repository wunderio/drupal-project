import { test as setup } from './helpers/drupal-test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as admin', async ({ drupal, page }) => {
  await drupal.loginAsAdmin();
  await page.context().storageState({ path: authFile });
});
