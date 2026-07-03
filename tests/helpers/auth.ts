import { expect, type Page } from '@playwright/test';

export async function loginAsAdmin(page: Page): Promise<void> {
  const username = process.env.PLAYWRIGHT_ADMIN_USER || 'admin';
  const password = process.env.PLAYWRIGHT_ADMIN_PASS || 'admin';

  await page.goto('/user/login');
  await page
    .locator('form[data-drupal-selector="user-login-form"] [data-drupal-selector="edit-name"]')
    .fill(username);
  await page
    .locator('form[data-drupal-selector="user-login-form"] [data-drupal-selector="edit-pass"]')
    .fill(password);
  await page
    .locator('form[data-drupal-selector="user-login-form"] [data-drupal-selector="edit-submit"]')
    .click();

  await expect(page).not.toHaveURL(/\/user\/login/);
}
