# Visual regression tests

Visual regression tests catch unintended changes in how pages look.
`tests/visual-regression.spec.ts` opens each page in its `PAGES` list as an anonymous visitor and takes a full-page screenshot.
It compares the screenshot with an earlier, accepted screenshot of the same page: the **baseline**.
If they differ by more than the allowed tolerance, the test fails.
The report then shows the expected, actual and diff images.

Every page is screenshotted in two Playwright projects (named browser setups in `playwright.config.ts`): `visual-desktop` (1440×900) and `visual-mobile` (Pixel 7).

There are two separate baselines:

- **Local:** `playwright/screenshots/{project}/`, recorded from your own DDEV site. It is git-ignored and machine-specific (fonts, rendering and database content differ), so never commit it.
- **GitHub Actions:** the `visual-baseline` artifact (a zip file attached to a GitHub Actions run), recorded on `main` from a fresh install. Pull requests are compared with it, not with your local screenshots.

## Run locally

Record a baseline first, then compare against it after your changes:

```bash
ddev npx playwright test --project='visual-*' --update-snapshots=all   # record baseline
ddev npx playwright test --project='visual-*'                          # compare against baseline

# The same with npm scripts:
ddev npm run test:visual:update
ddev npm run test:visual
```

Record the baseline before you change anything, because it defines what "correct" looks like.
Without a baseline the tests are skipped with a hint to run `test:visual:update`; they do not fail.
A run never records a baseline by itself, so a broken page cannot silently become the reference (the same rule as in GitHub Actions).

To see what changed, open the HTML report with `ddev playwright-report` (see [Running tests](../../README.md#running-tests) in the README). A failed test shows the expected, actual and diff images.

To compare or re-record only one page, add `--grep` with the page's `name` (it is also the test name):

```bash
ddev npx playwright test --project='visual-*' --grep homepage
ddev npx playwright test --project='visual-*' --update-snapshots=all --grep homepage
```

With the npm scripts, pass options after `--`: `ddev npm run test:visual -- --grep homepage`.

Always run only the `visual-*` projects, not a full test run.
A plain `ddev npx playwright test` also runs them, but the a11y tests add a promoted article to `/` at the same time.
The front page can then differ from the baseline.

## Work with screenshots

### Add a page

Add an entry to `PAGES` in `tests/visual-regression.spec.ts`, for example:

```ts
{ path: '/user/login', name: 'user-login', mask: ['[data-drupal-messages]'] },
```

- `path`: relative to `TEST_BASE_URL`. GitHub Actions tests a fresh install with no content, so use pages that exist there too (front page, `/user/login`, `/search`), not `/node/1`.
  An absolute URL also works but ignores `TEST_BASE_URL`, so in GitHub Actions it would screenshot a remote site that can change at any time.
  To test another environment, change `TEST_BASE_URL` instead and record a baseline for it first (baselines are stored per project and name, not per host).
- `name`: the screenshot file name (`{name}.png`) and the test name. Unique and URL-safe.
- `mask` (optional): CSS selectors painted over in both screenshots.

Then record its local baseline with `ddev npx playwright test --project='visual-*' --update-snapshots=all --grep user-login`.
In GitHub Actions the new page is not in the baseline yet: the pull request skips it with a `NEW PAGE` warning, and it is added when you [accept the change](#accept-a-change-or-record-the-first-baseline) on `main` after merge.

### Hide dynamic content

To keep content that changes between runs (dates, videos, status messages, cookie banners) out of the comparison:

- on one page, add `mask: ['<css selector>']` to its entry in `PAGES`: the area is painted over in both screenshots;
- on every page, add a rule to `tests/css/visual.css` (for example `visibility: hidden !important`): it is applied only while screenshots are taken.

Re-record the baseline after either change (`ddev npm run test:visual:update` locally; in GitHub Actions, accept it on `main`).

### Diff tolerance

Tolerance is `maxDiffPixels: 100` in `playwright.config.ts` (`expect.toHaveScreenshot`), the same for every page and viewport.
If long full-page screenshots (mostly `visual-mobile`) fail on anti-aliasing noise rather than real changes, add `maxDiffPixelRatio` (for example `0.001`, 0.1% of the image) instead of raising `maxDiffPixels`.
When both are set, Playwright allows the smaller of the two, so add a ratio together with a higher `maxDiffPixels` or on its own.

## In GitHub Actions

The `visual regression` job of the "Playwright Tests" workflow runs the same tests in DDEV, against a fresh install from `config/sync`.
It is not CircleCI or a Silta environment: there is no deployed site and no real content, so it catches changes in markup, CSS and config, not in content.
It compares them with the newest `visual-baseline` artifact from `main` (`BASELINE_BRANCH` in `.github/workflows/playwright.yml`).
Every compared run shows which baseline it used in a `Visual baseline` notice.

- Pull requests and pushes to `main` only compare. A push never records a new baseline, so a visual change stays red until it is fixed or accepted.
- Only a manual run of the workflow on `main` records a new baseline.
- A passing push to `main` uploads the same baseline again, which restarts its 90-day expiry.
- A new page in `PAGES` does not block a pull request: it is skipped with a `NEW PAGE` warning and the other pages are compared. On `main` it fails until accepted.

To use another baseline branch, change `BASELINE_BRANCH` and `on.push.branches` in the workflow.

### Accept a change (or record the first baseline)

1. Check the diff in the run's `playwright-report-visual` artifact (see [When something fails](#when-something-fails)). If the change is not intended, fix it instead.
2. In a pull request: merge it. It stays red until then, and the push to `main` fails too, because the baseline still has the old screenshots.
3. Run the workflow manually on `main`. This records the current screenshots as the new baseline:
   - in GitHub: Actions > Playwright Tests > Run workflow, branch `main`;
   - or in a terminal: `gh workflow run playwright.yml --ref main`.

   A manual run on another branch uploads nothing.
4. When the manual run has finished, re-run the failed jobs of the push run on `main`. They now compare with the new baseline and turn green.

For a new project, start at step 3 after the first merge to `main`: the Run workflow button only appears once the workflow file is on `main`.

If the "visual regression" check is required for `main` in branch protection, step 2 is blocked; see [Running tests](../../README.md#running-tests) in the README.

## When something fails

### In a GitHub Actions run

A failing job shows an error annotation and a note in the run summary.
To see the screenshots, open the run in GitHub, download the `playwright-report-visual` artifact from the bottom of its Summary page, unzip it and open `index.html` in your browser.

- `NO BASELINE`: nothing from `main` to compare with (never recorded, or expired after 90 days without a passing push). Record one with a manual run on `main`, then re-run the job.
- `CHANGED`: screenshots differ; the diff images are in the `playwright-report-visual` artifact. Fix it, or [accept the change](#accept-a-change-or-record-the-first-baseline).
- `NEW PAGE NOT CHECKED` (on `main` only): a page in `PAGES` is not in the baseline yet. Check its screenshot in the report, then accept it with a manual run on `main`.
- `FAILED`: failed without a diff, for example an error or the 10-minute job timeout. The error is in the report.

In a pull request, a new page shows only a `NEW PAGE` warning, not an error.

### Locally

- **All tests skipped:** there is no local baseline yet. Record one with `ddev npx playwright test --project='visual-*' --update-snapshots=all`.
- **Pages differ but you changed no markup or CSS:** the local baseline depends on your database. After `ddev syncdb`, or after content or config changes, re-record it. `ddev drush cst` shows config that differs from `config/sync`.
- **The same page fails at random:** hide the changing part ([Hide dynamic content](#hide-dynamic-content)) or, for anti-aliasing noise, adjust the [diff tolerance](#diff-tolerance).
- **Failed without a diff:** read the page snapshot in `playwright/test-results/*/error-context.md` before changing the test.
