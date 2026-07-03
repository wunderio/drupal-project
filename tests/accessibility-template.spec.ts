import { expect, test, type Page } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

const PUBLIC_ROUTES = ['/', '/user/login'];
const AXE_SOURCE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js';

type AxeViolation = {
  id: string;
  impact: string | null;
};

type AxeRunResult = {
  violations: AxeViolation[];
};

async function getCriticalViolations(page: Page): Promise<AxeViolation[]> {
  await page.addScriptTag({ url: AXE_SOURCE_URL });

  const results = await page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: { run: (context: Document, options: unknown) => Promise<AxeRunResult> };
      }
    ).axe;

    return axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
    });
  });

  return results.violations.filter(({ impact }) => impact === 'critical');
}

test.describe('Accessibility template', { tag: '@a11y' }, () => {
  for (const route of PUBLIC_ROUTES) {
    test(`has no critical accessibility violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      const criticalViolations = await getCriticalViolations(page);

      expect(
        criticalViolations,
        `Critical accessibility violations found on ${route}: ${criticalViolations
          .map(({ id }) => id)
          .join(', ')}`,
      ).toEqual([]);
    });
  }

  test('has no critical accessibility violations for authenticated admin route', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    const criticalViolations = await getCriticalViolations(page);

    expect(
      criticalViolations,
      `Critical accessibility violations found on /admin: ${criticalViolations
        .map(({ id }) => id)
        .join(', ')}`,
    ).toEqual([]);
  });
});
