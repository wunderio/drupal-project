import { faker } from '@faker-js/faker';
import { test } from './helpers/drupal-test';
import { expectNoA11yViolations } from './helpers/a11y';
import { createPromotedArticle, deleteNode } from './helpers/content';

const authFile = 'playwright/.auth/user.json';

test.describe('Accessibility', { tag: '@a11y' }, () => {
  // Promote an article so the front page isn't Drupal's "Welcome" page with inaccessible links.
  let articlePath: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage({ storageState: authFile });
    articlePath = await createPromotedArticle(
      page,
      faker.lorem.sentence({ min: 3, max: 4 }),
      faker.lorem.paragraph(),
    );
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage({ storageState: authFile });
    await deleteNode(page, articlePath);
    await page.close();
  });

  test.describe('as anonymous user', () => {
    // Drop the admin session the project loads from the setup step.
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Front page has no detectable WCAG violations', async ({ page }, testInfo) => {
      await page.goto('/');

      await expectNoA11yViolations(page, testInfo);
    });

    test('Login form has no detectable WCAG violations', async ({ page }, testInfo) => {
      await page.goto('/user/login');

      await expectNoA11yViolations(page, testInfo);
    });
  });

  test.describe('as admin', () => {
    test('Front page has no detectable WCAG violations', async ({ page }, testInfo) => {
      await page.goto('/');

      await expectNoA11yViolations(page, testInfo);
    });

    test('Add basic page form has no detectable WCAG violations', async ({ page }, testInfo) => {
      await page.goto('/node/add/page');

      // Wait for CKEditor 5 to initialise so the editor markup is scanned.
      await page.locator('.ck-editor__editable').waitFor();

      await expectNoA11yViolations(page, testInfo);
    });
  });
});
