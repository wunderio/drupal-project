import AxeBuilder from '@axe-core/playwright';
import { expect, Page, TestInfo } from '@playwright/test';
import type { Result } from 'axe-core';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// How many failing elements to list per violation in the report.
const MAX_ELEMENTS = 5;
const MAX_HTML_LENGTH = 100;

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatViolation(v: Result, index: number) {
  const wcag = v.tags.filter((t) => t.startsWith('wcag')).join(', ');
  const elements = v.nodes
    .slice(0, MAX_ELEMENTS)
    .map((n) => `     • ${truncate(n.html.replace(/\s+/g, ' '), MAX_HTML_LENGTH)}`);
  if (v.nodes.length > MAX_ELEMENTS) {
    elements.push(`     … and ${v.nodes.length - MAX_ELEMENTS} more`);
  }
  // Every node of one rule usually fails for the same reason, so show it once.
  const howToFix = (v.nodes[0]?.failureSummary ?? '')
    .split('\n')
    .map((line) => `     ${line.trim()}`)
    .join('\n');

  return [
    `${index + 1}. [${v.impact}] ${v.id}: ${v.help}`,
    `   WCAG: ${wcag}`,
    `   Elements (${v.nodes.length}):`,
    ...elements,
    `   How to fix:`,
    howToFix,
    `   More info: ${v.helpUrl}`,
  ].join('\n');
}

export async function expectNoA11yViolations(page: Page, testInfo: TestInfo) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  if (results.violations.length > 0) {
    // Full axe output stays available in the HTML report and CI artifacts.
    await testInfo.attach('accessibility-violations', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });
  }

  const report = [
    `Found ${results.violations.length} accessibility violation(s) on ${page.url()}`,
    '',
    ...results.violations.map((v, i) => `${formatViolation(v, i)}\n`),
  ].join('\n');

  expect(results.violations.length, report).toBe(0);
}
