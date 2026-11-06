import { expect, Page } from '@playwright/test';

/**
 * Creates an article promoted to the front page and returns its system path (/node/N).
 *
 * Content isn't promoted by default, so the box is ticked explicitly. A promoted
 * node replaces the empty front page placeholder with a teaser listing.
 */
export async function createPromotedArticle(page: Page, title: string, body: string) {
  await page.goto('/node/add/article');
  await page.locator('input[name="title[0][value]"]').fill(title);
  await page.locator('.ck-editor__editable').fill(body);
  await page.locator('summary').filter({ hasText: 'Promotion options' }).click();
  await page.getByLabel('Promoted to front page').check();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('h1')).toHaveText(title);

  // Read the path from the shortlink, so it works when URL aliases are enabled.
  const shortlink = await page.locator('link[rel="shortlink"]').getAttribute('href');
  return new URL(shortlink ?? '', page.url()).pathname;
}

/**
 * Deletes a node through its delete form.
 */
export async function deleteNode(page: Page, path: string) {
  await page.goto(`${path}/delete`);
  await page.getByRole('button', { name: 'Delete' }).click();
  // Wait for the redirect rather than the status message: workers share the admin
  // session, so other workers' "has been deleted" messages can show here too.
  await page.waitForURL((url) => !url.pathname.endsWith('/delete'));
}
