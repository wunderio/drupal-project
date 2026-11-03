// Smoke test for playwright-report-html.mjs: node --test .github/scripts/
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { unzip, zip } from './playwright-report-html.mjs';

const SCRIPT = fileURLToPath(new URL('./playwright-report-html.mjs', import.meta.url));
const json = (value) => Buffer.from(JSON.stringify(value));

// A minimal report in Playwright's layout: index.html embedding a zip, data/ for attachments.
const makeReport = (entries) => {
  const dir = mkdtempSync(join(tmpdir(), 'pw-report-'));
  mkdirSync(join(dir, 'data'));
  writeFileSync(join(dir, 'data', 'a.png'), 'PNG');
  const embedded = zip(entries).toString('base64');
  writeFileSync(
    join(dir, 'index.html'),
    `<html><template id="playwrightReportBase64">data:application/zip;base64,${embedded}</template></html>`,
  );
  return dir;
};

const run = (dir, out) =>
  spawnSync('node', [SCRIPT, dir, out], { encoding: 'utf8', env: { ...process.env, GITHUB_STEP_SUMMARY: '' } });

test('zip and unzip round-trip', () => {
  const entries = [{ name: 'x.json', data: json({ a: 1 }) }];
  assert.deepEqual(unzip(zip(entries)).map((e) => [e.name, e.data.toString()]), [['x.json', '{"a":1}']]);
});

test('inlines attachments as data URIs', () => {
  const dir = makeReport([
    { name: 'report.json', data: json({}) },
    { name: 'f.json', data: json({ tests: [{ title: 't', outcome: 'expected', results: [{ attachments: [{ name: 'x-diff.png', path: 'data/a.png' }] }] }] }) },
  ]);
  const out = join(dir, 'out.html');
  const result = run(dir, out);
  assert.equal(result.status, 0, result.stderr);
  const html = readFileSync(out, 'utf8');
  const embedded = html.match(/base64,([^<]*)<\/template>/)[1];
  const files = unzip(Buffer.from(embedded, 'base64'));
  const f = files.find((e) => e.name === 'f.json').data.toString();
  assert.match(f, /data:image\/png;base64,/);
  assert.doesNotMatch(f, /"data\/a\.png"/);
});

test('fails with a clear message on an unknown report format', () => {
  const dir = makeReport([{ name: 'other.json', data: json({}) }]);
  const result = run(dir, join(dir, 'out.html'));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /report\.json missing/);
});
