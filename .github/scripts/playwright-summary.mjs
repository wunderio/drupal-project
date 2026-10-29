// Writes a GitHub job summary from Playwright's JSON report.
// Usage: node .github/scripts/playwright-summary.mjs [results.json]
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'playwright/test-results/results.json';
const out = process.env.GITHUB_STEP_SUMMARY;

if (!existsSync(file)) {
  console.log(`::warning::${file} not found, skipping the test summary.`);
  process.exit(0);
}

const { stats, suites } = JSON.parse(readFileSync(file, 'utf8'));

// Escape characters that would break a Markdown table cell.
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/</g, '&lt;');

// Walk the nested suites and collect failed and flaky tests.
const problems = [];
const walk = (suite, titles) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      if (test.status === 'unexpected' || test.status === 'flaky') {
        const status = test.status === 'flaky' ? '⚠️ Flaky' : '❌ Failed';
        const title = [...titles, spec.title].join(' › ');
        problems.push(`| ${status} | ${cell(title)} | ${cell(`${spec.file}:${spec.line}`)} | ${cell(test.projectName)} |`);
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child, [...titles, child.title]);
};
for (const suite of suites) walk(suite, []);

const lines = [
  '## Playwright test results',
  '',
  '| ✅ Passed | ❌ Failed | ⚠️ Flaky | ⏭️ Skipped | Duration |',
  '| --- | --- | --- | --- | --- |',
  `| ${stats.expected} | ${stats.unexpected} | ${stats.flaky} | ${stats.skipped} | ${(stats.duration / 1000).toFixed(1)} s |`,
  '',
];
if (problems.length) {
  lines.push('### Failed and flaky tests', '', '| Status | Test | File | Browser |', '| --- | --- | --- | --- |', ...problems, '');
}
lines.push('Full details are in the `playwright-report` artifact of this run.', '');

if (out) {
  appendFileSync(out, lines.join('\n'));
} else {
  console.log(lines.join('\n'));
}