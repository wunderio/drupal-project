import { test } from './helpers/drupal-test';
import { expectNoA11yViolations } from './helpers/a11y';

test.describe('Accessibility', { tag: '@a11y' }, () => {
  test('Front page has no detectable WCAG violations', async ({ page }, testInfo) => {
    await page.goto('/');

    await expectNoA11yViolations(page, testInfo);
  });

  test('Add basic page form has no detectable WCAG violations', async ({ drupal, page }, testInfo) => {
    await drupal.loginAsAdmin();
    await page.goto('/node/add/page');

    // Wait for CKEditor 5 to initialise so the editor markup is scanned.
    await page.locator('.ck-editor__editable').waitFor();

    await expectNoA11yViolations(page, testInfo);
  });
});