#!/usr/bin/env node
// Build a single-file HTML report of a visual regression run: expected /
// actual / diff for each changed page (from test-results/), plus the baseline
// screenshots (from tests/__screenshots__/). Images are embedded, so the file
// can be uploaded as an unzipped artifact and opened straight in the browser.
// Also lists the changed pages in $GITHUB_STEP_SUMMARY when set.
//
// Usage: node visual-report.mjs <title> <out.html>
import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const [title = 'Visual regression', out = 'visual-regression-report.html'] =
  process.argv.slice(2);
const RESULTS = 'test-results';
const BASELINES = 'tests/__screenshots__';
const {
  GITHUB_SERVER_URL,
  GITHUB_REPOSITORY,
  GITHUB_RUN_ID,
  GITHUB_REF_NAME,
  GITHUB_SHA,
  GITHUB_STEP_SUMMARY,
} = process.env;

const dirs = (path) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    : [];
const pngs = (path) =>
  readdirSync(path)
    .filter((f) => f.endsWith('.png'))
    .sort();
const img = (path) =>
  `data:image/png;base64,${readFileSync(path).toString('base64')}`;
const escape = (text) =>
  String(text).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// Changed pages, one per test folder; with retries only the last attempt counts.
// Folder names end with the project, e.g. "...-homepage-visual-desktop-retry2".
const attempts = new Map();
for (const dir of dirs(RESULTS)) {
  const [, base, retry = 0] = dir.match(/^(.*?)(?:-retry(\d+))?$/);
  if (!attempts.has(base) || Number(retry) > attempts.get(base).retry) {
    attempts.set(base, { dir, retry: Number(retry) });
  }
}
const changes = [...attempts.values()].flatMap(({ dir }) => {
  const project = dir.match(/(visual-[a-z0-9]+)(?:-retry\d+)?$/)?.[1] ?? dir;
  return pngs(join(RESULTS, dir))
    .filter((f) => f.endsWith('-diff.png'))
    .map((diff) => {
      const name = diff.replace(/-diff\.png$/, '');
      const file = (kind) => join(RESULTS, dir, `${name}-${kind}.png`);
      return {
        name,
        project,
        expected: file('expected'),
        actual: file('actual'),
        diff: file('diff'),
      };
    });
});

const figure = (label, path) =>
  existsSync(path)
    ? `<figure><figcaption>${label}</figcaption><img src="${img(
        path,
      )}" alt="${label}"></figure>`
    : '';

const changeCards = changes
  .map(
    (c, i) => `
  <section class="card">
    <input type="checkbox" id="wide-${i}" class="wide">
    <h3>${escape(c.name)} <span>${escape(
      c.project,
    )}</span> <label for="wide-${i}">Toggle full width</label></h3>
    <div class="images">${figure('Expected', c.expected)}${figure(
      'Actual',
      c.actual,
    )}${figure('Diff', c.diff)}</div>
  </section>`,
  )
  .join('');

const baselines = dirs(BASELINES)
  .flatMap((project) =>
    pngs(join(BASELINES, project)).map((f) => ({
      project,
      file: join(BASELINES, project, f),
    })),
  )
  .map((b) =>
    figure(
      `${escape(
        b.file
          .split('/')
          .pop()
          .replace(/\.png$/, ''),
      )} · ${escape(b.project)}`,
      b.file,
    ),
  )
  .join('');

const runUrl = GITHUB_RUN_ID
  ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`
  : '';
const meta = [
  GITHUB_REF_NAME && `Branch <code>${escape(GITHUB_REF_NAME)}</code>`,
  GITHUB_SHA && `commit <code>${escape(GITHUB_SHA.slice(0, 7))}</code>`,
  runUrl && `<a href="${runUrl}">workflow run</a>`,
]
  .filter(Boolean)
  .join(' · ');

writeFileSync(
  out,
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Visual regression report</title>
<style>
  :root { color-scheme: light dark; --bg: #fff; --fg: #1f2328; --muted: #59636e; --line: #d1d9e0; --card: #f6f8fa; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0d1117; --fg: #e6edf3; --muted: #9198a1; --line: #3d444d; --card: #151b23; } }
  body { margin: 0; padding: 24px 16px; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 1600px; margin: 0 auto; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  h2 { margin: 32px 0 12px; font-size: 18px; }
  .meta, h3 span, figcaption { color: var(--muted); font-size: 13px; }
  a { color: #4493f8; }
  .card { margin: 0 0 16px; padding: 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); }
  h3 { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; margin: 0 0 12px; font-size: 16px; }
  h3 label { margin-left: auto; color: #4493f8; font-size: 13px; font-weight: normal; cursor: pointer; }
  .wide { display: none; }
  .images { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; align-items: start; }
  .wide:checked ~ .images { grid-template-columns: minmax(0, 1fr); }
  .baselines { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-top: 12px; }
  figure { margin: 0; }
  img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 4px; }
  summary { cursor: pointer; font-weight: 600; }
  @media (max-width: 720px) { .images { grid-template-columns: minmax(0, 1fr); } }
</style>
</head>
<body>
<main>
  <h1>${escape(title)}</h1>
  <p class="meta">${meta}</p>
  <h2>Changed pages (${changes.length})</h2>
  ${changeCards || '<p>No visual changes.</p>'}
  <details>
    <summary>Baseline screenshots</summary>
    <div class="baselines">${
      baselines || '<p>No baseline screenshots.</p>'
    }</div>
  </details>
</main>
</body>
</html>
`,
);

if (GITHUB_STEP_SUMMARY && changes.length) {
  appendFileSync(
    GITHUB_STEP_SUMMARY,
    `Changed pages:\n${changes
      .map((c) => `- ${c.name} (${c.project})`)
      .join('\n')}\n`,
  );
}
console.log(`Wrote ${out}: ${changes.length} changed page(s).`);
