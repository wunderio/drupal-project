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

Results are written to `playwright-report/` (open `playwright-report/index.html` in a browser). Failure screenshots, diffs and traces are in `test-results/`.

## End-to-end tests

```bash
ddev npx playwright test --project=chromium               # one browser (chromium, firefox, webkit)
ddev npx playwright test tests/example.spec.ts            # one file
ddev npx playwright test --grep @crud                     # tests with a tag
```

The `setup` project logs in as admin first (`tests/auth.setup.ts`), so tests start logged in. Import `test` from `tests/helpers/drupal-test.ts` (not from `@playwright/test`) to get the `drupal` helper, e.g. `drupal.loginAsAdmin()`.

## Files

| Path                              | Purpose                                                               |
| --------------------------------- | --------------------------------------------------------------------- |
| `playwright.config.ts`            | Browsers/viewports (projects), base URL, basic auth, screenshot rules |
| `tests/auth.setup.ts`             | Logs in as admin once and stores the session for end-to-end tests     |
| `tests/example.spec.ts`           | Example end-to-end tests (create a basic page and an article)         |
| `tests/helpers/drupal-test.ts`    | Test base with the `drupal` helper (via `@drupal/playwright`)         |
| `tests/visual-regression.spec.ts` | Visual regression: list of pages to screenshot                        |
| `tests/helpers/visual.ts`         | Visual helpers, e.g. `waitForPageStable()` (lazy images, fonts)       |
| `tests/__screenshots__/`          | Visual baselines (git-ignored, created by `test:visual:update`)       |
| `.github/workflows/`              | `playwright.yml` (end-to-end in CI), `visual-regression.yml`          |
| `.github/scripts/`                | `wait-for-circleci.sh`, `wait-for-url.sh` used by the visual workflow |

## Visual regression

Each page in the `PAGES` list is captured as a full-page screenshot at two sizes: `visual-desktop` (1440×900) and `visual-mobile` (Pixel 7). A test fails when more than 100 pixels differ from the baseline.

Baselines are never committed, because screenshots differ between machines. Locally you record your own; CI keeps its own as a GitHub artifact.

### Local workflow

Runs against your DDEV site:

1. Before your change: `ddev npm run test:visual:update`
2. Make the change (theme, CSS, config...).
3. After: `ddev npm run test:visual`. On failure, open the HTML report to see expected / actual / diff side by side.
4. If the change is intended, record a new baseline with `test:visual:update`.

### CI workflow

GitHub Actions, [`.github/workflows/visual-regression.yml`](../.github/workflows/visual-regression.yml):

1. A push to the configured branch starts the workflow.
2. It waits until CircleCI has deployed that commit to Silta, and the site responds.
3. No baseline yet: it captures one, result ⚠️ (commit status `visual-regression` is pending).
4. Baseline exists: it compares, result ✅ (no changes) or ❌ (changes, see the `visual-regression-report` artifact).

The baseline stays until you replace it: run the workflow manually ("Run workflow", mode `baseline`) or wait for it to expire after 90 days. Manual runs are only offered once the workflow file is on `main`.

## Configuring visual regression

### Pages to test

Edit `PAGES` in [`visual-regression.spec.ts`](visual-regression.spec.ts). Only the front page is tested by default:

```ts
const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/about-us', name: 'about-us' },
  { path: '/node/1', name: 'article' },
];
```

- `path` is relative to `TEST_BASE_URL`. Pick pages that exist in every environment you test (local, Silta).
- `name` becomes the screenshot file name, so keep it unique and URL-safe.
- Pages are loaded as an anonymous user. Record a new baseline after adding pages.
- Prefer one page per template (landing page, article, listing, form) over many similar pages.

### Environment tested in CI

Set in the `env` and `on.push.branches` blocks at the top of the workflow file. The default target is the `main` environment:

```yaml
on:
  push:
    branches:
      - main

env:
  TEST_BASE_URL: "https://main.drupal-project.dev.wdr.io"
  BASELINE_NAME: "visual-regression-baseline-main"
```

To test a feature environment instead (e.g. while developing the tests), set the branch, its Silta URL and its own baseline name:

```yaml
on:
  push:
    branches:
      - feature/MID-73-playwright-visual

env:
  TEST_BASE_URL: "https://feature-mid-73-playwright-visual.drupal-project.dev.wdr.io"
  BASELINE_NAME: "visual-regression-baseline-feature-mid-73"
```

- The Silta URL is the branch name lowercased with `/` and other special characters replaced by `-`. The exact URL is in the CircleCI `deploy` job output.
- Use a separate `BASELINE_NAME` per environment, so screenshots of different environments are never compared with each other.
- Feature deploys wait for the manual `approve-deployment` in CircleCI. The workflow waits up to 60 minutes.

CI needs the `SILTA_BASICAUTH_USER` and `SILTA_BASICAUTH_PASS` repository secrets in GitHub (Settings → Secrets and variables → Actions).

### Testing a remote environment locally

Point `TEST_BASE_URL` to it. Silta environments need basic auth:

```bash
ddev exec "TEST_BASE_URL=https://main.drupal-project.dev.wdr.io TEST_HTTP_USER=<user> TEST_HTTP_PASS=<pass> npm run test:visual:update"
```

Baselines are stored by page name only, so this overwrites your local DDEV baseline.

### Other settings

In [`playwright.config.ts`](../playwright.config.ts):

| What               | Where                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| Screen sizes       | `visualProjects` (add a project, e.g. a tablet, named `visual-<name>`) |
| Allowed difference | `expect.toHaveScreenshot.maxDiffPixels` (default 100 pixels)           |
| Basic auth         | `TEST_HTTP_USER` / `TEST_HTTP_PASS` environment variables              |
| Baseline location  | `snapshotPathTemplate` (`tests/__screenshots__/<project>/<name>.png`)  |

## Troubleshooting visual tests

- **Fails without visible changes:** dynamic content (dates, random teasers, carousels, cookie banners) changes between runs. Hide or mask it, e.g. `toHaveScreenshot(name, { mask: [page.locator('.carousel')] })`.
- **Lazy images missing:** `waitForPageStable()` in `tests/helpers/visual.ts` scrolls the page to load them. Extend it if a component loads content later.
- **CI ⚠️ every run:** the baseline is not found. Check that `BASELINE_NAME` did not change and the artifact has not expired.
- **CI ❌ "Workflow error":** usually CircleCI failed, the deploy was not approved within 60 minutes, or the basic auth secrets are missing. See the `visual-regression` job log.
