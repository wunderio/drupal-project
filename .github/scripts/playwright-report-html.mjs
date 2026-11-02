#!/usr/bin/env node
// Turn a Playwright HTML report (playwright-report/: index.html + data/) into
// one self-contained file, so it can be uploaded as an unzipped artifact and
// opened straight in the browser, looking the same as
// `npx playwright show-report`.
//
// index.html already embeds the test data as a base64 zip of JSON files; only
// the attachments (screenshots, error context) live in data/. This rewrites
// every "data/<file>" reference in that zip to a data: URI. Traces are not
// inlined (several MB each); they stay in the zipped report artifact.
//
// Also lists the failed tests in $GITHUB_STEP_SUMMARY when set.
//
// Usage: node playwright-report-html.mjs <report-dir> <out.html>
import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { extname, join } from 'node:path';
import { crc32, deflateRawSync, inflateRawSync } from 'node:zlib';

const [dir = 'playwright-report', out = 'playwright-report.html'] =
  process.argv.slice(2);
const DATA = join(dir, 'data');
// Attachment types to inline; anything else (trace zips) keeps its path.
const TYPES = {
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.webm': 'video/webm',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.json': 'application/json',
};
const MARKER =
  /(<template id="playwrightReportBase64">data:application\/zip;base64,)([^<]*)(<\/template>)/;

// Minimal zip reader/writer (central directory, deflate), enough for the
// report's own zip.
const unzip = (zip) => {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = zip.readUInt16LE(end + 10);
  let pos = zip.readUInt32LE(end + 16);
  const entries = [];
  for (let i = 0; i < count; i++) {
    const method = zip.readUInt16LE(pos + 10);
    const size = zip.readUInt32LE(pos + 20);
    const nameLength = zip.readUInt16LE(pos + 28);
    const name = zip.toString('utf8', pos + 46, pos + 46 + nameLength);
    const local = zip.readUInt32LE(pos + 42);
    const start =
      local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const raw = zip.subarray(start, start + size);
    entries.push({ name, data: method === 8 ? inflateRawSync(raw) : raw });
    pos +=
      46 + nameLength + zip.readUInt16LE(pos + 30) + zip.readUInt16LE(pos + 32);
  }
  return entries;
};

const zip = (entries) => {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const file = Buffer.from(name);
    const packed = deflateRawSync(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6); // UTF-8 names
    header.writeUInt16LE(8, 8); // deflate
    header.writeUInt32LE(crc32(data), 14);
    header.writeUInt32LE(packed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(file.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    header.copy(central, 6, 4, 30); // same fields from version to name length
    central.writeUInt32LE(offset, 42);
    locals.push(header, file, packed);
    centrals.push(central, file);
    offset += header.length + file.length + packed.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
};

const html = readFileSync(join(dir, 'index.html'), 'utf8');
const match = html.match(MARKER);
if (!match) {
  console.error(
    `No embedded report data in ${dir}/index.html; did the Playwright HTML report format change?`,
  );
  process.exit(1);
}

// "data/<file>" -> data: URI, for every attachment of a known type.
const uris = new Map(
  (existsSync(DATA) ? readdirSync(DATA) : [])
    .filter((file) => TYPES[extname(file)])
    .map((file) => [
      `data/${file}`,
      `data:${TYPES[extname(file)]};base64,${readFileSync(
        join(DATA, file),
      ).toString('base64')}`,
    ]),
);

// Rewrite the attachment paths in the report's JSON files and collect the
// failed tests (a screenshot diff means the page looks different).
const failed = [];
const entries = unzip(Buffer.from(match[2], 'base64')).map(({ name, data }) => {
  if (!name.endsWith('.json')) return { name, data };
  const json = JSON.parse(data.toString('utf8'), (key, value) =>
    key === 'path' && uris.has(value) ? uris.get(value) : value,
  );
  for (const test of json.tests ?? []) {
    if (test.outcome !== 'unexpected') continue;
    const changed = test.results
      ?.at(-1)
      ?.attachments?.some((a) => a.name.endsWith('-diff.png'));
    failed.push(
      `- ${test.title} (${test.projectName})${
        changed ? ' – screenshot changed' : ''
      }`,
    );
  }
  return { name, data: Buffer.from(JSON.stringify(json)) };
});

writeFileSync(
  out,
  html.replace(
    MARKER,
    (_, open, __, close) => open + zip(entries).toString('base64') + close,
  ),
);

if (process.env.GITHUB_STEP_SUMMARY && failed.length) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `Failed tests:\n${failed.join('\n')}\n`,
  );
}
console.log(
  `Wrote ${out}: ${uris.size} attachment(s) inlined, ${failed.length} failed test(s).`,
);
