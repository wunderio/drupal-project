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

## Files

| Path                                 | Purpose                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `playwright.config.ts`               | Browsers/viewports (projects), base URL, basic auth, screenshot rules          |
| `tests/auth.setup.ts`                | Logs in as admin once and stores the session for end-to-end tests              |
| `tests/example.spec.ts`              | Example end-to-end tests (create a basic page and an article)                  |
| `tests/helpers/drupal-test.ts`       | Test base with the `drupal` helper (via `@drupal/playwright`)                  |
| `tests/visual-regression.spec.ts`    | Visual regression: list of pages to screenshot                                 |
| `tests/helpers/visual.ts`            | Visual helpers, e.g. `waitForPageStable()` (lazy images, fonts)                |
| `tests/__screenshots__/`             | Visual baselines (git-ignored, created by `test:visual:update`)                |
| `.github/workflows/`                 | `playwright.yml` (end-to-end in CI), `visual-regression.yml`                   |
| `.github/scripts/`                   | `playwright-report-html.mjs`: one-file HTML report, used by both workflows     |
| `.github/scripts/visual-regression/` | Shell scripts of the visual workflow (CircleCI and URL waits, baseline checks) |
| `.github/actions/setup-visual/`      | Shared setup of the visual workflow jobs (secrets, npm, Chromium)              |

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
| Playwright: Visual regression tests | [`visual-regression.yml`](../.github/workflows/visual-regression.yml) | `capture-baseline` → `compare-after-deploy` → `Result` | pushes to the configured branch, manual runs |

The visual workflow is explained in [Visual regression → CI workflow](#ci-workflow).

### Reports in CI

Both workflows link the Playwright HTML report from the run page, packed into one file that opens straight in the browser. It looks the same as `npx playwright show-report`, including Diff / Actual / Expected / Side by side / Slider for screenshots.

| Workflow          | Where to find the link                                                                                                               | Zipped artifact (also has the traces) |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| End-to-end        | **Open the Playwright report** in the `playwright_e2e` job summary                                                                   | `playwright-report`                   |
| Visual regression | **Open the visual regression report** in the `Result` job summary, or "Details" of the `visual-regression` check on the commit or PR | `visual-regression-report`            |

Anyone with read access to the repository can open the reports (GitHub login required).

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

The visual regression workflow screenshots the Silta environment before and after CircleCI deploys the push, so only changes made by the deploy are reported, not content edits made in the meantime.

1. **`capture-baseline`** screenshots the environment while CircleCI is still building. The screenshots are kept as the baseline (artifact `BASELINE_NAME`, 90 days) only when:

   - the CircleCI deploy job had not started yet when the capture finished, and
   - the previous visual run for that environment did not fail (`Result` records each outcome as artifact `BASELINE_NAME-passed` / `-failed`).

   Otherwise, or when the environment is not reachable, the run uses the previous baseline. The job log says why.

2. **`compare-after-deploy`** waits until CircleCI has deployed the commit and the site responds, then compares against the newest kept baseline:
   - ✅ no changes.
   - ❌ changes, see the report ([Reports in CI](#reports-in-ci)). The next runs keep failing against the same baseline until the change is reverted or accepted.
   - ⚠️ changes, but a newer push started deploying during the comparison, so the result is not reliable; the newer push's run compares instead.
   - ⚠️ no baseline at all (first run, or expired): it captures one, nothing is compared.
3. **`Result`** shows the outcome in its name and sets the commit status `visual-regression` (⚠️ is pending/yellow). Its summary links the report, see [Reports in CI](#reports-in-ci).

To accept an intended change, run the visual regression workflow manually ("Run workflow", mode `baseline`): it captures the current look as the new baseline. Mode `compare` compares without waiting for a deploy. Manual runs are only offered once the workflow file is on `main`.

The deploy start is read from the CircleCI `commit` check run (`.github/scripts/visual-regression/circleci-job-state.sh`). Every run checks that it can still read the deploy job there and shows a warning if CircleCI changed that format.

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

Set in the `on.push.branches` and `env` blocks at the top of `visual-regression.yml`. The default target is the `main` environment:

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
- The CircleCI deploy job follows the branch (`deploy-main` on `main`, `deploy` elsewhere, as in `.circleci/config.yml`).
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
| Allowed difference | `expect.toHaveScreenshot.maxDiffPixels` (default 100 pixels)                   |
| Basic auth         | `TEST_HTTP_USER` / `TEST_HTTP_PASS` environment variables                      |
| Retries            | `visual`: none, also in CI (a screenshot change fails the same way every time) |
| Baseline location  | `snapshotPathTemplate` (`tests/__screenshots__/<project>/<name>.png`)          |

## Troubleshooting visual tests

- **Fails without visible changes:** dynamic content (dates, random teasers, carousels, cookie banners) changes between runs. Hide or mask it, e.g. `toHaveScreenshot(name, { mask: [page.locator('.carousel')] })`.
- **Lazy images missing:** `waitForPageStable()` in `tests/helpers/visual.ts` scrolls the page to load them. Extend it if a component loads content later.
- **CI ⚠️ "Baseline captured" every run:** the baseline is not found. Check that `BASELINE_NAME` did not change and the artifact has not expired.
- **CI ❌ keeps failing after the change was intended:** accept it with a manual run of the visual regression workflow in mode `baseline`.
- **CI warning "Could not read the state of CircleCI job":** CircleCI changed its check run summary, or `DEPLOY_JOB` in `visual-regression.yml` does not match `.circleci/config.yml`.
  Update `.github/scripts/visual-regression/circleci-job-state.sh`. Until then pre-deploy screenshots are discarded and runs compare against the previous baseline.
- **CI fails with "secrets are not set" or HTTP 401/403:** the Silta basic auth credentials are missing or wrong. Add or fix the `SILTA_BASICAUTH_USER` and `SILTA_BASICAUTH_PASS` repository secrets (Settings → Secrets and variables → Actions), then re-run the workflow.
- **CI ❌ "Workflow error":** usually CircleCI failed, the deploy was not approved within 60 minutes, or the basic auth secrets are missing. See the `compare-after-deploy` job log. Once the deploy has succeeded, use "Re-run failed jobs": the baseline captured by the run is kept.

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

- `playwright.config.ts`: `visualSpec`, `visualProjects`, `snapshotPathTemplate` and the `toHaveScreenshot` options
- `package.json`: the `test:visual` and `test:visual:update` scripts
- `tests/visual-regression.spec.ts` and `tests/helpers/visual.ts`
- CI (Silta + CircleCI only):
  - `.github/workflows/visual-regression.yml`: set the branch and `env` block at the top (see [Environment tested in CI](#environment-tested-in-ci))
  - `.github/actions/setup-visual/`
  - `.github/scripts/visual-regression/`
  - `.github/scripts/playwright-report-html.mjs`
  - repository secrets `SILTA_BASICAUTH_USER` and `SILTA_BASICAUTH_PASS`
