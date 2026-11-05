# Playwright tests

[Playwright](https://playwright.dev/) is used for two kinds of browser tests:

- **End-to-end tests** check that features work (e.g. an editor can create a page).
- **Visual regression tests** compare screenshots to catch unintended visual changes (desktop + mobile).

Tests live in this folder and are configured in [`playwright.config.ts`](../playwright.config.ts). Everything runs inside DDEV, no Node or browsers are needed on the host. Paths below are relative to the project root.

## Quick start

`ddev start` installs Node dependencies and the Playwright browsers. `TEST_BASE_URL` (the site under test) is preset to the DDEV site in `.ddev/config.yaml`.

```bash
ddev npx playwright test                 # end-to-end tests (all browsers)
ddev npm run test:visual:update          # visual: record a baseline
ddev npm run test:visual                 # visual: compare against the baseline
```

All output goes under `playwright/` (git-ignored): the HTML report in `playwright/report/` (open `playwright/report/index.html` in a browser), failure screenshots, diffs and traces in `playwright/test-results/`, visual baselines in `playwright/screenshots/`.

## Files

| Path                                 | Purpose                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `playwright.config.ts`               | Browsers/viewports (projects), base URL, basic auth, screenshot rules          |
| `tests/auth.setup.ts`                | Logs in as admin once and stores the session for end-to-end tests              |
| `tests/example.spec.ts`              | Example end-to-end tests (create a basic page and an article)                  |
| `tests/helpers/drupal-test.ts`       | Test base with the `drupal` helper (via `@drupal/playwright`)                  |
| `tests/visual-regression.spec.ts`    | Visual regression spec, reads the pages from `visual-pages.json`               |
| `tests/visual-pages.json`            | Pages to screenshot (`path`, `name`, optional `mask`, `fullPage`)              |
| `tests/helpers/visual.ts`, `.css`    | `waitForPageStable()` (lazy images, fonts) and styles applied while screenshotting |
| `playwright/screenshots/`            | Visual baselines (git-ignored, created by `test:visual:update`)                |
| `.github/workflows/`                 | `playwright.yml` (end-to-end in CI), `visual-regression.yml`                   |
| `.github/scripts/`                   | `playwright-report-html.mjs` (+ test): one-file HTML report, used by both workflows |
| `.github/scripts/visual-regression/` | Shell scripts of the visual workflow (wait for CircleCI, wait for URL, find baseline) |
| `.github/actions/`                   | `setup-visual` (secrets, Node) and `run-visual` (Playwright in Docker)         |

## End-to-end tests

```bash
ddev npx playwright test --project=chromium               # one browser (chromium, firefox, webkit)
ddev npx playwright test tests/example.spec.ts            # one file
ddev npx playwright test --grep @crud                     # tests with a tag
```

The `setup` project logs in as admin first (`tests/auth.setup.ts`), so tests start logged in. Import `test` from `tests/helpers/drupal-test.ts` (not from `@playwright/test`) to get the `drupal` helper, e.g. `drupal.loginAsAdmin()`.

## CI (GitHub Actions)

Each test type has its own workflow, so a run only contains the jobs for its event:

| Workflow                            | File                                                                  | Jobs                                                   | Runs on                                      |
| ----------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| Playwright: End-to-end tests        | [`playwright.yml`](../.github/workflows/playwright.yml)               | `playwright_e2e` (chromium, Drupal installed in DDEV)  | pull requests and pushes to `main`           |
| Playwright: Visual regression tests | [`visual-regression.yml`](../.github/workflows/visual-regression.yml) | `visual` (wait for deploy → baseline or compare) | pushes to the configured branch, manual runs |

The visual workflow is explained in [Visual regression → CI workflow](#ci-workflow).

### Reports in CI

Both workflows link the Playwright HTML report from the run page, packed into one file that opens straight in the browser. It looks the same as `npx playwright show-report`, including Diff / Actual / Expected / Side by side / Slider for screenshots.

| Workflow          | Where to find the link                                                                                                               | Zipped artifact (also has the traces) |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| End-to-end        | **Open the Playwright report** in the `playwright_e2e` job summary                                                                   | `playwright-report`                   |
| Visual regression | **Open the visual regression report** in the `visual` job summary, or "Details" of the `visual-regression` check on the commit or PR | `visual-regression-report`            |

Anyone with read access to the repository can open the reports (GitHub login required).

## Visual regression

Each page in `visual-pages.json` is captured as a full-page screenshot at two sizes: `visual-desktop` (1440×900) and `visual-mobile` (Pixel 7). A test fails when more than 0.1% of the pixels differ from the baseline.

Baselines are never committed, because screenshots differ between machines. Locally you record your own; CI keeps its own as a GitHub artifact.

### Local workflow

Runs against your DDEV site:

1. Before your change: `ddev npm run test:visual:update`
2. Make the change (theme, CSS, config...).
3. After: `ddev npm run test:visual`. On failure, open the HTML report to see expected / actual / diff side by side.
4. If the change is intended, record a new baseline with `test:visual:update`.

### CI workflow

The visual regression workflow runs once per push, after CircleCI has deployed it. It screenshots the real Silta environment (with its real content) in a Playwright Docker image pinned to the `@playwright/test` version, so rendering does not change with runner updates.

1. It waits until the CircleCI workflow of the commit has succeeded (only the check run's status is read) and the site responds.
2. It finds the newest kept baseline (artifact `BASELINE_NAME`, 90 days):
   - ⚠️ none (first run, expired, or manual mode `baseline`): the screenshots become the baseline, nothing is compared.
   - ✅ found and nothing changed: the new screenshots replace it as the baseline.
   - ❌ found and pages changed: the baseline is kept, see the report ([Reports in CI](#reports-in-ci)). Every following run fails against the same baseline until the change is reverted or accepted.
   - ⚠️ pages changed, but a newer push exists, so the result is not reliable; the newer push's run compares instead.
3. The last step sets the commit status `visual-regression` (⚠️ is pending/yellow) and links the report.

To accept an intended change, run the workflow manually (**Run workflow**, mode `baseline`). Mode `compare` runs comparisons without waiting for a deploy.

> **Note:** The **Run workflow** button in the GitHub Actions UI is only available once the workflow file is merged into `main`.

To run it manually before merge, use the GitHub CLI:

```bash
gh workflow run visual-regression.yml --ref <your-branch> -f mode=baseline
```

Content edits made in the environment also show up as changes. Mask changing elements with `mask` in `visual-pages.json`.

## Configuring visual regression

### Pages to test

Edit [`visual-pages.json`](visual-pages.json), no test code needed. Only the front page is tested by default:

```json
[
  { "path": "/", "name": "homepage" },
  { "path": "/about-us", "name": "about-us", "mask": [".cookie-banner", "time"] },
  { "path": "/node/1", "name": "article", "fullPage": false }
]
```

- `path` is relative to `TEST_BASE_URL`. Pick pages that exist in every environment you test (local, Silta).
- `name` becomes the screenshot file name: unique, only `a-z`, `0-9` and `-`.
- `mask` (optional) lists CSS selectors painted over before comparing, for dates, rotating banners, cookie notices.
- `fullPage` (optional, default `true`): `false` screenshots only the first screen.
- Pages are loaded as an anonymous user and must answer below HTTP 400 and contain a `main` element, otherwise the test fails instead of screenshotting an error page.
- Record a new baseline after adding pages. Prefer one page per template (landing page, article, listing, form) over many similar pages.

### Environment tested in CI

Set in the `on.push.branches` and `env` blocks at the top of `visual-regression.yml`. Another workflow can also call it (`workflow_call`) with `base-url` and `baseline-name`. The default target is the `main` environment:

```yaml
on:
  push:
    branches:
      - main

env:
  TEST_BASE_URL: 'https://main.drupal-project.dev.wdr.io'
  BASELINE_NAME: 'visual-regression-baseline-main'
```

To test a feature environment instead (e.g. while developing the tests), set the branch, its Silta URL and its own baseline name (the lines marked `[FEATURE BRANCH]`):

```yaml
on:
  push:
    branches:
      - feature/MID-73-playwright-visual

env:
  TEST_BASE_URL: 'https://feature-mid-73-playwright-visual.drupal-project.dev.wdr.io'
  BASELINE_NAME: 'visual-regression-baseline-feature-mid-73'
```

- The Silta URL is the branch name lowercased with `/` and other special characters replaced by `-`. The exact URL is in the CircleCI `deploy` job output.
- Use a separate `BASELINE_NAME` per environment, so screenshots of different environments are never compared with each other.
- Feature deploys wait for the manual `approve-deployment` in CircleCI. The workflow waits up to 60 minutes.
- Visual runs of a branch never overlap: a new push waits until the previous one has finished.

CI needs the `SILTA_BASICAUTH_USER` and `SILTA_BASICAUTH_PASS` repository secrets in GitHub (Settings → Secrets and variables → Actions).

### Testing a remote environment locally

Point `TEST_BASE_URL` to it. Silta environments need basic auth:

```bash
ddev exec "TEST_BASE_URL=https://main.drupal-project.dev.wdr.io TEST_HTTP_USER=<user> TEST_HTTP_PASS=<pass> npm run test:visual:update"
```

Baselines are stored by page name only, so this overwrites your local DDEV baseline.

### Other settings

In [`playwright.config.ts`](../playwright.config.ts):

| What               | Where                                                                          |
| ------------------ | ------------------------------------------------------------------------------ |
| Screen sizes       | `visualProjects` (add a project, e.g. a tablet, named `visual-<name>`)         |
| Allowed difference | `expect.toHaveScreenshot.maxDiffPixelRatio` (default 0.1% of the pixels)       |
| Basic auth         | `TEST_HTTP_USER` / `TEST_HTTP_PASS` environment variables                      |
| Retries            | `visual`: none, also in CI (a screenshot change fails the same way every time) |
| Baseline location  | `snapshotDir` + `snapshotPathTemplate` (`playwright/screenshots/<project>/<name>.png`) |

## Troubleshooting visual tests

- **Fails without visible changes:** dynamic content (dates, random teasers, carousels, cookie banners) changes between runs. Hide or mask it, e.g. `toHaveScreenshot(name, { mask: [page.locator('.carousel')] })`.
- **Lazy images missing:** `waitForPageStable()` in `tests/helpers/visual.ts` scrolls until the page stops growing and waits for images and fonts. Extend it if a component loads content later.
- **Video or iframe area differs:** `tests/helpers/visual.css` already hides `video` and `iframe` while screenshotting; add other selectors there.
- **CI ⚠️ "Baseline captured" every run:** the baseline is not found. Check that `BASELINE_NAME` did not change and the artifact has not expired.
- **CI ❌ keeps failing after the change was intended:** accept it with a manual run of the visual regression workflow in mode `baseline`.
- **CI warning "baseline was recorded with Playwright X":** Playwright was upgraded. If the pages look right, accept the new rendering with mode `baseline`.
- **CI fails with "secrets are not set" or HTTP 401/403:** the Silta basic auth credentials are missing or wrong. Add or fix the `SILTA_BASICAUTH_USER` and `SILTA_BASICAUTH_PASS` repository secrets (Settings → Secrets and variables → Actions), then re-run the workflow.
- **CI ❌ "Workflow error":** usually CircleCI failed, the deploy was not approved within 60 minutes, or the basic auth secrets are missing. See the failing step in the `visual` job log. Once the deploy has succeeded, use "Re-run failed jobs".
- **One-file report step fails:** it is optional (`continue-on-error`). Use the zipped `visual-regression-report` artifact and check `.github/scripts/playwright-report-html.mjs` after a Playwright upgrade (`node --test .github/scripts/`).

## Using this in another project

Each test type can be copied on its own. Copy the files, then adjust the marked settings.

**End-to-end tests:**

- `playwright.config.ts`: drop the `visualProjects` part if you don't want visual tests
- `tests/auth.setup.ts`, `tests/helpers/drupal-test.ts` and your `*.spec.ts` files
- `package.json`: the `@playwright/test` and `@drupal/playwright` dev dependencies
- `.ddev/config.yaml`: `TEST_BASE_URL=http://web:80` in `web_environment` and the `npx playwright install --with-deps` post-start hook
- `.gitignore`: the `# Playwright` block
- CI: `.github/workflows/playwright.yml` and `.github/scripts/playwright-report-html.mjs` (the one-click report; remove its steps from the workflow if you don't want it)

**Visual regression tests** (on top of the Playwright setup above):

- `playwright.config.ts`: `visualSpec`, `visualProjects`, `snapshotDir`, `snapshotPathTemplate` and the `toHaveScreenshot` options; pin `@playwright/test` to an exact version in `package.json` (the CI Docker image tag is taken from it)
- `package.json`: the `test:visual` and `test:visual:update` scripts
- `tests/visual-regression.spec.ts`, `tests/visual-pages.json`, `tests/helpers/visual.ts` and `tests/helpers/visual.css`
- CI (Silta + CircleCI only):
  - `.github/workflows/visual-regression.yml`: set the branch and `env` block at the top (see [Environment tested in CI](#environment-tested-in-ci))
  - `.github/actions/setup-visual/` and `.github/actions/run-visual/`
  - `.github/scripts/visual-regression/`
  - `.github/scripts/playwright-report-html.mjs`
  - repository secrets `SILTA_BASICAUTH_USER` and `SILTA_BASICAUTH_PASS`
