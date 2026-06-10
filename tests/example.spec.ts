import { expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { test } from './helpers/drupal-test';

test.describe('Basic page', { tag: '@crud' }, () => {
  test('Can create a basic page', async ({ drupal, page }) => {
    const title = faker.lorem.sentence({ min: 3, max: 4 });
    const alias = `/${faker.lorem.slug()}`;

    await drupal.loginAsAdmin();
    await page.goto('/node/add/page');

    // Fill in the title
    await page.locator('input[name="title[0][value]"]').fill(title);

    // Fill in the body (CKEditor 5)
    await page.locator('.ck-editor__editable').click();
    await page.locator('.ck-editor__editable').fill('This is the body content.');

    // Expand URL alias details panel
    await page.locator('summary').filter({ hasText: 'URL alias' }).click();
    await page.locator('input[name="path[0][alias]"]').fill(alias);

    // Save the page
    await page.getByRole('button', { name: 'Save' }).click();

    // Wait for navigation to the created node page
    await page.waitForURL(new RegExp(alias));

    // Assert we are on the node page
    await expect(page.locator('h1')).toHaveText(title);
  });
});

test.describe('Article', { tag: '@crud' }, () => {
  test('Can create an article', async ({ drupal, page }) => {
    const title = faker.lorem.sentence({ min: 3, max: 4 });
    const alias = `/${faker.lorem.slug()}`;

    await drupal.loginAsAdmin();
    await page.goto('/node/add/article');

    // Fill in the title
    await page.locator('input[name="title[0][value]"]').fill(title);

    // Fill in the body (CKEditor 5)
    await page.locator('.ck-editor__editable').click();
    await page.locator('.ck-editor__editable').fill('This is the body content.');

    // Expand URL alias details panel
    await page.locator('summary').filter({ hasText: 'URL alias' }).click();
    await page.locator('input[name="path[0][alias]"]').fill(alias);

    // Save the page
    await page.getByRole('button', { name: 'Save' }).click();

    // Wait for navigation to the created node page
    await page.waitForURL(new RegExp(alias));

    // Assert we are on the node page
    await expect(page.locator('h1')).toHaveText(title);
  });
});

