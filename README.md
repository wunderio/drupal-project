# Wunder template for Drupal projects

This project is a tailored fork of the popular [drupal-composer template](https://github.com/drupal-composer/drupal-project). It is designed for deploying to [Kubernetes](https://kubernetes.io/) clusters with ArgoCD, see [ArgoCD deployment](#argocd-deployment).

## Getting started

1. **Create a new project repository**
  Click "[Use this template](https://github.com/wunderio/drupal-project/generate)" to generate a new project:
   - Select the correct owner.
   - Name the project as `client-COUNTRYCODE-CLIENT-PROJECT`.
   - Set the repository to private (unless the project is public).

2. **Clone and customize the repository**
   Clone the new project locally and update its details:
   - Update `README.md` with the project details
   - Update `composer.json` with the project name
   - In real client projects, remove `/composer.lock` from `.gitignore` so the lockfile is committed and reproducible
   - Modify the `k8s/*/values/drupal.yaml` files [values](https://github.com/wunderio/charts/blob/master/drupal/values.yaml)
   - Adjust `grumphp.yml` tasks, including updating the project name in the `git_commit_message` regex
   - Configure local development environment:
     - For DDEV: Update project settings in `.ddev/config.yaml`
     - For rig: Set a unique `project_id` in `.rig/project.yaml`, for example the repository name. rig keys its state and policy by this ID, so a generated project must not keep the template's `drupal-project` ID
   - For AI-assisted development, follow the [rig workflow](#ai-workflow-rig--claude-code) to initialize rig with a unique project ID.
   - For database synchronization, see [ddev-wunderio-drupal](https://github.com/wunderio/ddev-wunderio-drupal)
   - Adjust `web/sites/default/settings.php` settings (`stage_file_proxy` etc)
   - Adjust `config_split` settings for silta (default), production, main, local environments

3. **Set up the ArgoCD deployment**
   - Follow [Setting up a new project](#setting-up-a-new-project) and [Secrets](#secrets) under ArgoCD deployment.

4. **Enable JIRA integration**
   - Configure [automatic autolinks](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls#custom-autolinks-to-external-resources) for the project's JIRA environment to link ticket IDs to JIRA issues seamlessly.

For additional instructions, please refer to the [Silta documentation](https://github.com/wunderio/silta).

## Local development

This project uses DDEV for local development.

### DDEV environment

[DDEV](https://ddev.com/get-started/) provides a containerized development environment with all necessary services preconfigured.

#### DDEV setup instructions

1. Install [DDEV](https://ddev.com/get-started/)
2. Ensure Docker is running on your system
3. Start the environment and set up your project:

  ```bash
  # Start the DDEV environment
  ddev start

  # Authenticate SSH for database syncing
  ddev auth ssh

  # Synchronize local database with a remote environment
  # Synchronization is provided by [ddev-wunderio-drupal](https://github.com/wunderio/ddev-wunderio-drupal)
  # drush deploy and drush uli are part of ddev syncdb command.
  ddev syncdb
  ```

Note: All commands in the DDEV section should be run within the DDEV environment using `ddev` prefix (e.g., `ddev drush uli`), or by using `ddev ssh` to access the container shell first.

#### DDEV services and access points

The project can be accessed at <https://drupal-project.ddev.site>

For a complete list of all available services, URLs, and ports, use:

  ```bash
  ddev describe
  ```

#### DDEV common commands

- `ddev` - Display available commands
- `ddev adminer` - Launch Adminer database management interface
- `ddev copilot [args]` - Run GitHub Copilot CLI inside the rig agents container (see [AI Workflow](#ai-workflow-rig--claude-code))
- `ddev claude [args]` - Run Claude Code inside the rig agents container (see [AI Workflow](#ai-workflow-rig--claude-code))
- `ddev grumphp <commands>` - Run code quality checks (command provided by [ddev-wunderio-drupal](https://github.com/wunderio/ddev-wunderio-drupal))
- `ddev mailpit` - Open Mailpit email testing interface
- `ddev npm <commands>` - Execute npm commands
- `ddev phpunit <commands>` - Run test suites (command provided by [ddev-wunderio-drupal](https://github.com/wunderio/ddev-wunderio-drupal))
- `ddev varnishadm <commands>` - Manage Varnish cache
- `ddev xdebug <mode>` - Configure Xdebug debugging modes
- `ddev syncdb [environment]` - Sync database from remote environment (requires VPN and `ddev auth ssh` (command provided by [ddev-wunderio-drupal](https://github.com/wunderio/ddev-wunderio-drupal))

<details>
<summary>DDEV Elasticsearch configuration</summary>

#### DDEV Elasticsearch configuration

This project includes Elasticsearch service for robust full-text search capabilities. It's automatically set up during DDEV initialization.

##### Plugins configuration

- Pre-configured with `analysis-icu` for Unicode/multilingual text processing
- Additional plugins can be defined in `.ddev/docker-compose.elasticsearch8.yaml`

```yaml
services:
  elasticsearch:
    environment:
      - ELASTICSEARCH_PLUGINS=analysis-icu  # Space-separated plugin list
```

##### Useful commands

```bash
# Check Elasticsearch status
ddev exec -s elasticsearch "curl -s localhost:9200"

# List installed plugins
ddev exec -s elasticsearch "bin/elasticsearch-plugin list"
```

##### Web interface

Elasticvue is included for visualization and management at <http://drupal-project.ddev.site:9005>

</details>

<details>
<summary>DDEV WunderIO Drupal</summary>

#### DDEV WunderIO Drupal addon

The Drupal template includes the Wunder-specific `ddev-wunderio-drupal` addon. This addon provides additional functionality and tools specifically designed for Drupal development, including custom commands, configurations, and automation scripts to enhance your workflow.

For more information about the addon, configuration options, and available custom commands, see:
<https://github.com/wunderio/ddev-wunderio-drupal/tree/main>

#### Automated installation

This addon is installed automatically when you run `ddev start`.

The automation is configured in `.ddev/config.wunderio.yaml` using a `pre-start` host hook:

```yaml
hooks:
  pre-start:
    - exec-host: 'if [ ! -f "${DDEV_GLOBAL_DIR}/wunderio/core/wdr-core.sh" ]; then ddev add-on get wunderio/ddev-wunderio-drupal; fi'
```

This means developers only need to clone the project and run `ddev start`; no manual addon installation step is required.

Common commands provided by the addon include:

- `ddev grumphp`
- `ddev phpunit`
- `ddev syncdb`

</details>

## Development tips

<details>
<summary>Code quality tools</summary>

### Code quality tools

This project includes several tools to maintain code quality and consistency across the codebase.

#### Markdown Linting

Markdown files can be checked and automatically fixed using the following npm scripts:

```bash
# Check markdown files for linting issues
ddev npm run lint:md

# Automatically fix markdown linting issues where possible
ddev npm run lint:md:fix
```

Markdown linting rules are configured in `.markdownlint.json` at the project root.

#### JavaScript and CSS Linting

The project also includes linting for JavaScript and CSS files:

```bash
# Check JavaScript files
ddev npm run lint:js

# Check CSS/SCSS files
ddev npm run lint:css

# Run all linting (JS, CSS, and Markdown)
ddev npm run lint
```

</details>

<details>
<summary>AI Workflow (rig + Claude Code)</summary>

### AI Workflow (rig + Claude Code)

AI-assisted development runs through [rig](https://github.com/wunderio/internal-wrigan), which starts Claude Code in an isolated agents container next to the DDEV project. Drush, Composer, PHPUnit, GrumPHP, npm and log reads are provided as `wdrmcp` MCP tools that execute in the project's web container.

#### Quick start

1. Install rig on the host (see the rig repository for instructions).

2. Start the project:

   ```bash
   rig up
   ```

3. Start Claude Code or GitHub Copilot in the agents container:

   ```bash
   ddev claude
   ddev copilot
   ```

#### Project AI configuration

- Project settings: `.rig/project.yaml` (project ID, enabled packs, Drupal docroot, Node paths). The `project_id` must be unique per project; see [Getting started](#getting-started). This file can only narrow the central rig policy; commit changes to it.
- Agent policy, MCP tools and Claude Code settings are managed centrally by rig and regenerated by `rig up`; they are not stored in this repository.

#### Security model

- The agents container has no Docker socket access and no sudo.
- The project is mounted read-write, while `.rig` and `.ddev` are mounted read-only inside the agents container.
- Secrets (`.env` files, keys, credentials, local settings) are kept out of the agent's reach.
- The agent can commit but never pushes; pushing is done from the host.

</details>

<details>
<summary>Drupal core updates</summary>

### Drupal core updates

- [Updating Drupal core](https://www.drupal.org/docs/updating-drupal/updating-drupal-core-via-composer).
- [Altering scaffold files](https://www.drupal.org/docs/develop/using-composer/using-drupals-composer-scaffold#toc_4) (e.g., `robots.txt`, `.htaccess`).

</details>

<details>
<summary>Varnish and Purge configuration</summary>

### Varnish and Purge configuration

This section describes how to set up Varnish caching and Purge functionality in your local development environment.

Note: Drush commands in this section should be run with the appropriate environment prefix (`ddev`).

#### Configuration Overview

The project includes ready-to-use Varnish configuration:

1. **Configuration Import (Recommended)**
   - For existing projects, simply import the configuration from `config/sync`:

      ```bash
      drush cim -y
      ```

   - This applies all Purge and Varnish settings, including processors and purgers

2. **Manual Configuration (for new sites)**
   - If config/sync is not available, follow these steps:

   a. **Install required modules**:

      ```bash
      drush en purge purge_drush purge_processor_lateruntime purge_queuer_coretags purge_tokens purge_ui varnish_purger varnish_purge_tags -y
      ```

   b. **Configure Varnish Purger**:
      - Set a value for **Browser and proxy cache maximum age** in `admin/config/development/performance`
      - Navigate to `/admin/config/development/performance/purge`
      - Click **Add purger** and select **Varnish Purger**:
        - **Name:** "Varnish Purger"
        - **Type:** "Tags"
        - **Request method:** "BAN" (important: use BAN instead of PURGE for compatibility with Silta)
        - **Headers:** `Cache-Tags`: `[invalidation:expression]`
        - Save the configuration

   c. **Configure processors**:
      - Go to `/admin/config/development/performance/purge/processors`
      - Ensure these processors are enabled:
        - `drush_purge_invalidate` (for manual invalidation via Drush)
        - `lateruntime` (for batching invalidations)
        - `purge_ui_block_processor` (for admin UI functionality)

   d. **Export the configuration**:

      ```bash
      drush cex -y
      ```

   e. **Update settings.php**:
      - Find the purger ID in `varnish_purger.settings.<PURGER_ID>.yml`
      - Update `web/sites/default/settings.php` with the correct purger ID:

        ```php
        if (getenv('VARNISH_ADMIN_HOST')) {
          $config['varnish_purger.settings.<PURGER_ID>']['hostname'] = trim(getenv('VARNISH_ADMIN_HOST'));
          $config['varnish_purger.settings.<PURGER_ID>']['port'] = getenv('VARNISH_ADMIN_PORT') ? trim(getenv('VARNISH_ADMIN_PORT')) : '80';
        }
        ```

#### Environment-Specific Setup

##### DDEV (Recommended)

1. **Varnish Configuration**: DDEV comes pre-configured with Varnish in `.ddev` folder.

2. **Testing Configuration**:

   ```bash
   ddev drush cr
   ddev exec curl -X BAN -H "Cache-Tags: config:system.performance" http://varnish
   ```

   If working correctly, you should receive a "200 Ban added" response

3. **Viewing Varnish logs**:

   ```bash
   ddev exec -s varnish varnishlog -i BAN -i Cache
   ```

### Important Notes

- **BAN vs PURGE Method:** Always use the "BAN" method in the Varnish purger configuration instead of "PURGE". The Silta Varnish configuration is set up to handle BAN requests but may reject PURGE requests with "405 Method Not Allowed" errors.

- **Processors:** The default Purge setup uses the `purge_processor_lateruntime` module, which empties the purge queue during page requests. This works well for most sites needing immediate cache clearing. Ensure all required processors are enabled.

- **Cache Tags:** The Varnish configuration is set up to handle cache tag invalidation with the `Cache-Tags` header.
</details>

<details>
<summary>Testing</summary>

### Testing

#### PHPUnit (unit & integration tests)

The [PHPUnit](https://phpunit.de/) test framework is predefined in this project. See `phpunit.xml` for details. A minified `web/modules/custom/phpunit_example` module from the [examples module](https://www.drupal.org/project/examples) is included for learning purposes.

Note: Run these commands with the appropriate environment prefix (`ddev phpunit`).

- Run one test class: `phpunit path/to/your/class/file.php`
- List groups: `phpunit --list-groups`
- Run all tests in a particular group: `phpunit --group Groupname`

#### Playwright (end-to-end tests)

[Playwright](https://playwright.dev/) is used for end-to-end browser testing. Tests are located in the `tests/` directory and configured via `playwright.config.ts`.

##### Setup

Install Node dependencies if you haven't already:

```bash
ddev npm install
```

Playwright browsers are automatically installed inside the DDEV container on `ddev start`.

##### Running tests

The `TEST_BASE_URL` environment variable is preconfigured in DDEV (see `.ddev/config.yaml`).

To run all tests:

```bash
ddev npx playwright test
```

Tests are split into Playwright projects named `<type>-<browser>`, shown in brackets in the test output (for example `[e2e-firefox]`):

- `e2e-chromium`, `e2e-firefox`, `e2e-webkit` — functional end-to-end tests in each browser (everything not tagged `@a11y`)
- `a11y-chromium` — accessibility scans (tests tagged `@a11y`), Chromium only

Run one project with `--project`, for example `ddev npx playwright test --project=e2e-firefox`, or all projects of one type with a wildcard: `ddev npx playwright test --project="e2e-*"`.
The GitHub Actions workflow runs `e2e-*` and `a11y-*` as separate jobs ("e2e" and "accessibility"), each with its own status check and report artifact.

Each run writes an HTML report to `playwright/report/` (git-ignored, like everything under `playwright/`). To view it, start the report server inside the web container:

```bash
ddev playwright-report
```

It prints the report URL for this project (`https://novarnish.<project>.ddev.site:9323`). Leave the command running while you browse the report; stop it with `Ctrl+C`.

- The URL uses the `novarnish.` hostname. The Varnish add-on serves the main `<project>.ddev.site` hostname and moves the web container to `novarnish.<project>.ddev.site`, and DDEV only exposes the web container's extra ports on that hostname.
  `https://<project>.ddev.site:9323` returns a 404. Without Varnish, the command prints the main hostname instead.
- Running `ddev npx playwright show-report playwright/report --host 0.0.0.0` directly also works. The explicit report directory selects the configured output, and `--host 0.0.0.0` lets DDEV's router reach the server. The `http://0.0.0.0:9323` address it prints is only valid inside the container.
- Port 9323 is exposed through `web_extra_exposed_ports` in `.ddev/config.yaml`. If the page doesn't load after you pull this change, run `ddev restart` so DDEV applies the new port.

You can also open `playwright/report/index.html` directly in your browser without a server. The report itself works, but traces don't open from a `file://` URL.

##### Accessibility tests

`tests/accessibility.spec.ts` uses [axe-core](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) (`@axe-core/playwright`) to scan pages against WCAG 2.0/2.1 A and AA rules.
Tests run as an anonymous visitor (front page, login form) and as admin (front page, "Add basic page" form). The `a11y-chromium` project loads the admin session from the setup step; the anonymous group clears it with `test.use({ storageState: { cookies: [], origins: [] } })`. Add new pages to the group that matches who sees them.
Before the scans, the suite creates an article promoted to the front page and deletes it afterwards (`tests/helpers/content.ts`), so the front page is scanned with content instead of the placeholder an empty site shows.
Any violations are attached as JSON to the test in the HTML report, and the test fails. Run only these tests with:

```bash
ddev npm run test:a11y
```

The script runs all `a11y-*` projects. Pass extra Playwright options after `--`, for example `ddev npm run test:a11y -- --grep "login"`.

##### Test structure

- `tests/helpers/drupal-test.ts` — Custom Playwright test base providing a `drupal` helper (via `@drupal/playwright`) for actions like `drupal.loginAsAdmin()`
- `tests/example.spec.ts` — Example end-to-end test demonstrating basic page creation
- `tests/accessibility.spec.ts` — Automated axe accessibility scans

</details>

## Contributing

This project is maintained by [Wunder](https://wunder.io/). Contributions from the community are welcome.

<details>
<summary>Commit message validation and ticketing system integration</summary>

### Commit message validation and ticketing system integration

Commit message validation is enforced by GrumPHP (`git_commit_message`) and requires a ticket ID in the subject. Use one of these formats:

```text
TICKET-123: Capitalized subject
type(TICKET-123): Capitalized subject
```

Examples:

```text
WNDR-446: Update composer dependencies
fix(WNDR-446): Add Drush 13 PRE_INITIALIZE hook
feat(GH-57): Add release automation command
```

Rules:

- Ticket format: `PROJECTKEY-123` (for example `WNDR-446`, `GH-57`).
- Subject must start with a capital letter after `:`.
- Allowed types in `type(...)`: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`, `build`, `revert`.
- Merge commits are excluded from this validation.

Type names follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

Recommended (not required by the matcher):

- Keep body lines as bullet points explaining what and why.
- Add a `Refs:` footer with key files.

Ticket IDs can be autolinked in GitHub using [custom autolinks](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls).
</details>

### Git workflow

Refer to the [WunderFlow repository](https://github.com/wunderio/WunderFlow) for Git workflow details.

### Deployments

Deployments are managed with ArgoCD, see [ArgoCD deployment](#argocd-deployment).

## ArgoCD deployment

Projects created from this template deploy with [ArgoCD](https://argo-cd.readthedocs.io/) from
`k8s/`; there is no CircleCI deployment. The ArgoCD platform reads `k8s/<overlay>/apps.yaml`,
deploys the [Silta `drupal` chart](https://github.com/wunderio/charts/tree/master/drupal) with the
values in `k8s/<overlay>/values/`, and adds the cluster's defaults (domain, TLS, storage).

- `k8s/staging/`: the `main`/`master` branch deploys to the `staging` environment.
- `k8s/feature/`: a pull request from `feature/*`, `hotfix/*` or `epic/*` gets a `pr-<N>`
  environment only while it carries the `preview` label (create the label in the repository if
  it does not exist yet). Removing the label or closing the pull request deletes the environment.
- `.github/workflows/build.yml` builds the images on each push to a branch with an overlay
  here with [wunderio/argocd-actions](https://github.com/wunderio/argocd-actions), pushes them
  to `<registry>/<project>/` and commits the new tags to
  `k8s/<overlay>/values/drupal.yaml`. ArgoCD deploys that commit. Other branches and pull
  requests are validated only.

Add `k8s/develop/` or `k8s/production/` (copies of `k8s/staging/`) to deploy the `develop` or
`production` branch too. CI updates the tags of `main`/`master`, `develop`, `production` and pull
request branches, so a release is a merge to `production`: CI builds the `production` images,
commits their tags to `k8s/production/values/` and ArgoCD deploys that commit. Until
`k8s/production/` exists, `production` builds no images. To set production tags by hand instead,
set `COMMIT_PRODUCTION_TAGS` to `"false"` in `build.yml`. Every project needs
`k8s/staging/apps.yaml` on `main`/`master`: the staging environment creates the project's ArgoCD
project.

**This template repository never deploys itself.** The ArgoCD platform deploys only the
repositories it is set up to discover, and the build workflow skips the image and tag jobs when
the repository is a template.

### Setting up a new project

1. Create the repository from this template and make it discoverable as your ArgoCD platform
   requires (for example its name and a repository topic; GitHub copies no topics from a
   template).
2. Replace the placeholders. Your platform team has the values:
   - `PROJECT_NAME`: the repository name in lowercase. It is the Kubernetes namespace and the
     project in the container registry.
   - `REGISTRY_HOST`: the [Harbor](https://goharbor.io/) registry the clusters pull images from.
   - `AGE_RECIPIENT`: the platform's age public key for the project's secrets.
   - `DEV_DOMAIN`, `PROD_DOMAIN`: the domains of the clusters that run staging and pull request
     previews, and production. The Drush aliases use them (see [Drush and SSH](#drush-and-ssh)).

   ```bash
   name=$(basename -s .git "$(git remote get-url origin)" | tr '[:upper:]' '[:lower:]')
   registry=registry.example.com        # container registry host
   age_recipient=age1...                # the platform's age public key
   dev_domain=dev.example.com           # domain of the cluster that runs staging and previews
   prod_domain=prod.example.com         # domain of the cluster that runs production
   git grep -lz -e PROJECT_NAME -e REGISTRY_HOST -e AGE_RECIPIENT -e DEV_DOMAIN -e PROD_DOMAIN -- ':!README.md' \
     | xargs -0 perl -pi -e "s/PROJECT_NAME/$name/g; s/REGISTRY_HOST/$registry/g; s/AGE_RECIPIENT/$age_recipient/g; s/DEV_DOMAIN/$dev_domain/g; s/PROD_DOMAIN/$prod_domain/g"
   ```

3. Give the database its own passwords. ArgoCD can't keep the MariaDB chart's generated ones, so
   they are pinned in the values files:

   ```bash
   for f in k8s/*/values/drupal.yaml; do
     perl -pi -e "s/DB_ROOT_PASSWORD/$(openssl rand -hex 16)/; s/DB_PASSWORD/$(openssl rand -hex 16)/" "$f"
   done
   ```

The build workflow needs these repository or organisation secrets:

- `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`: a registry account that can push, pull and list the
  project's images, and create the project on the first build.
- `ARGOCD_APP_ID`, `ARGOCD_APP_PRIVATE_KEY`: a GitHub App allowed to push to the deployed
  branches, so the tag commit passes branch protection.

### Drush and SSH

`drush/sites/self.site.yml` has aliases for the ArgoCD environments: `drush @main st` (staging)
and `drush @production st` (once `k8s/production/` exists). Change `main` to `master` there if
that is the staging branch. Each environment has a shell pod, reached through its cluster's SSH
jump host:

```bash
ssh www-admin@main-shell.<namespace> -J www-admin@ssh.<dev domain>
ssh www-admin@pr-<N>-shell.<namespace> -J www-admin@ssh.<dev domain>
ssh www-admin@production-shell.<namespace> -J www-admin@ssh.<prod domain>
```

`<namespace>` is the repository name in lowercase. Staging is at `https://main-<project>.<dev domain>`
and a pull request preview at `https://pr-<N>-<project>.<dev domain>`; the pull request gets a
comment with its URL.

### Secrets

Put Kubernetes Secrets in `k8s/<overlay>/secrets/<name>.sops.yaml`, encrypt them, and set
`secrets.enabled: true` in that overlay's `apps.yaml`. `.sops.yaml` encrypts them to the
platform's age key, which only ArgoCD can decrypt:

```bash
sops --encrypt --in-place k8s/staging/secrets/app.sops.yaml
```

A file may hold only `apiVersion: v1`, `kind: Secret` objects in the project's namespace;
anything else fails the deployment. Never commit a decrypted file.
