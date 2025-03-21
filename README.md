# Wunder template for Drupal projects

This project is a tailored fork of the popular [drupal-composer template](https://github.com/drupal-composer/drupal-project). It is designed for deploying to [Kubernetes](https://kubernetes.io/) clusters via [CircleCI](https://circleci.com/).

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
   - Modify the `silta/silta*` files [values](https://github.com/wunderio/charts/blob/master/drupal/values.yaml)
   - Adjust `grumphp.yml` tasks, including updating the project name in the `git_commit_message` regex
   - Configure local development environment:
     - For DDEV: Update project settings in `.ddev/config.yaml`
     - For Lando: Update project settings in `.lando.yml`
   - Update project name in `scripts/syncdb.sh` for database synchronization
   - Adjust `web/sites/default/settings.php` settings (`stage_file_proxy` etc)
   - Adjust `config_split` settings for silta (default), production, main, local environments

3. **Set up CircleCI**
   - Log in to [CircleCI](https://app.circleci.com/) using your GitHub account.
   - Add the new project to CircleCI using the existing configuration.

4. **Configure encryption keys and secrets**
   - Define encryption keys for `silta_dev` and `silta_finland` contexts in the CircleCI project settings and backup the keys in LastPass. Use the following naming convention: `SEC_{PROJECT_NAME}_{CONTEXT}` where `CONTEXT` is the environment, such as `silta_dev` or `silta_finland`.
   - Update the `.circleci/config.yml` file with the corresponding `secret_key_env` values.
   - Define the secret environment variables in the `silta/silta*.secrets` YAML files for the `silta_dev` and `silta_finland` contexts.
   - Encrypt the `silta/silta*.secrets` files using the encryption keys and commit the encrypted files to the repository.
   - See the relevant [Silta's documentation](https://wunderio.github.io/silta/docs/encrypting-sensitive-configuration/#using-a-custom-encryption-key) for details.

5. **Enable JIRA integration**
   - Configure [automatic autolinks](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls#custom-autolinks-to-external-resources) for the project's JIRA environment to link ticket IDs to JIRA issues seamlessly.

For additional instructions, please refer to the [Silta documentation](https://github.com/wunderio/silta).

## Production environment

- **URL**: <https://production.drupal-project.finland.wdr.io>
- **Drush alias**: `drush @prod st`
- **SSH**: `ssh www-admin@production-shell.drupal-project -J www-admin@ssh.finland.wdr.io`

### Environment variables for `silta_finland` context

The following secret variables are defined in the `silta/silta-prod.secrets` file for the `silta_finland` context:

- `TEST_KEY_PROD` - Secret key for testing purposes.

## Main environment

- **URL**: <https://main.drupal-project.dev.wdr.io>
- **Drush alias**: `drush @main st`
- **SSH**: `ssh www-admin@main-shell.drupal-project -J www-admin@ssh.dev.wdr.io`

The Drush alias for the **current** Silta feature branch deployment is `drush @current st`.

### Environment variables for `silta_dev` context

The following secret variables are defined in the `silta/silta.secrets` file for the `silta_dev` context:

- `TEST_KEY` - Secret key for testing purposes.

## Local development

This project supports two local development environments: DDEV (preferred) and Lando. Choose the one that best fits your workflow.

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
  # See `scripts/syncdb.sh` for options
  ddev syncdb

  # Apply configuration changes
  ddev drush deploy

  # Get a one-time login link for admin access
  ddev drush uli
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
- `ddev grumphp <commands>` - Run code quality checks
- `ddev mailpit` - Open Mailpit email testing interface
- `ddev npm <commands>` - Execute npm commands
- `ddev phpunit <commands>` - Run test suites
- `ddev varnishadm <commands>` - Manage Varnish cache
- `ddev xdebug <mode>` - Configure Xdebug debugging modes
- `ddev syncdb [environment]` - Sync database from remote environment (requires VPN and `ddev auth ssh`, see `scripts/syncdb.sh` for details)

<details>
<summary>DDEV Elasticsearch configuration</summary>

#### DDEV Elasticsearch configuration

This project includes Elasticsearch with the `analysis-icu` plugin for Unicode/multilingual text processing support.

**Configuration and customization:**

Plugins are defined in `.ddev/docker-compose.elasticsearch8.yaml` as environment variables. You can install multiple plugins by adding them as space-separated values:

```yaml
services:
  elasticsearch:
    environment:
      - ELASTICSEARCH_PLUGINS=analysis-icu analysis-ukrainian
```

The installation process:
1. Plugin names are defined as space-separated values
2. A post-start hook installs missing plugins and sets permissions
3. Elasticsearch restarts automatically if needed

**Useful commands:**

```bash
# List installed plugins
ddev exec -s elasticsearch "bin/elasticsearch-plugin list"

# View detailed plugin information
ddev exec -s elasticsearch "curl -s localhost:9200/_nodes/plugins?pretty"
```

</details>

<details>
<summary>Lando environment</summary>

### Lando environment

[Lando](https://docs.lando.dev/) offers another containerized development option with a focus on simplicity and flexibility.

#### Lando services and access points

| Service | Description | Access |
|---------|-------------|---------|
| Web server | Primary web service | <https://drupal-project.lndo.site> |
| Adminer | Database management via [docker-adminer](https://github.com/dehy/docker-adminer) | <http://adminer.drupal-project.lndo.site> |
| Elasticsearch | Search functionality via Elasticsearch (uncomment in `.lando.yml` to enable) | <http://localhost:9200> or <http://elasticsearch.lndo.site> |
| Kibana | Elasticsearch visualization (uncomment in `.lando.yml` to enable) | <http://localhost:5601> or <http://kibana.lndo.site> |
| Mailpit | Email testing via [Mailpit](https://mailpit.axllent.org/) | <http://mail.lndo.site> |
| Varnish | Caching via Varnish | <https://varnish.drupal-project.lndo.site> |
| Drush | Drupal CLI tool | `lando drush @local st` |
| SSH | Container shell access | `lando ssh (-s <service>)` |
| Node | JavaScript tooling | Included in web container |
| Chrome | Browser testing via [selenium/standalone-chrome](https://hub.docker.com/r/selenium/standalone-chrome/) | Available in web container |

#### Lando setup instructions

1. Install [Lando](https://github.com/lando/lando/releases)
2. Start the environment:

  ```bash
  lando start
  ```

#### Lando common commands

- `lando` - Display available commands
- `lando drupal <arguments>` - Run Drupal core scripts
- `lando grumphp <commands>` - Run code quality checks
- `lando npm <commands>` - Execute npm commands
- `lando phpunit <commands>` - Run test suites
- `lando varnishadm <commands>` - Manage Varnish cache
- `lando xdebug <mode>` - Configure Xdebug debugging modes
- `lando syncdb [environment]` - Sync database from remote environment (requires VPN, see `scripts/syncdb.sh` for details)

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
<summary>Cursor AI Code Editor</summary>

### Cursor AI Code Editor

This project uses [Cursor](https://docs.cursor.com/) as the recommended AI-powered IDE. Cursor enhances development productivity through AI-assisted coding features while maintaining compatibility with VSCode extensions and settings.

#### Project-specific AI Rules

- Rules are stored in `@.cursor/rules/` directory
- Main configuration file: `@.cursor/rules/common.mdc`
- Rules provide AI with project-specific context about:
  - File organization and key project files
  - Development environment setup
  - Code standards and technology stack
  - Git workflow and commit message formatting

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

Note: Drush commands in this section should be run with the appropriate environment prefix (`ddev` or `lando`).

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

##### Lando

1. **Enable Varnish**:
   - Varnish configuration is already enabled in `.lando.yml` & `.lando/varnish.vcl`.

2. **Testing Configuration**:

   ```bash
   lando drush cr
   lando ssh -c "curl -X BAN -H 'Cache-Tags: config:system.performance' http://varnish"
   ```

### Important Notes

- **BAN vs PURGE Method:** Always use the "BAN" method in the Varnish purger configuration instead of "PURGE". The Silta Varnish configuration is set up to handle BAN requests but may reject PURGE requests with "405 Method Not Allowed" errors.

- **Processors:** The default Purge setup uses the `purge_processor_lateruntime` module, which empties the purge queue during page requests. This works well for most sites needing immediate cache clearing. Ensure all required processors are enabled.

- **Cache Tags:** The Varnish configuration is set up to handle cache tag invalidation with the `Cache-Tags` header.
</details>

<details>
<summary>Running tests</summary>

### Running tests

The [PHPUnit](https://phpunit.de/) test framework is predefined in this project. See `phpunit.xml` for details. A minified `web/modules/custom/phpunit_example` module from the [examples module](https://www.drupal.org/project/examples) is included for learning purposes.

#### Testing examples

Note: Run these commands with the appropriate environment prefix (`ddev phpunit` or `lando phpunit`).

- Run one test class: `phpunit path/to/your/class/file.php`
- List groups: `phpunit --list-groups`
- Run all tests in a particular group: `phpunit --group Groupname`
</details>

### Secrets handling

[Silta CLI](https://github.com/wunderio/silta-cli) is a command-line tool to manage secrets and configurations for Silta projects. Use the following commands:

- Encrypt a file: `silta secrets encrypt --file silta/silta.secrets --secret-key=<secret_key_env>`
- Decrypt a file: `silta secrets decrypt --file silta/silta.secrets --secret-key=<secret_key_env>`
- Display help: `silta secrets --help`

See the corresponding `secret_key_env` values in the `.circleci/config.yml` file for the `silta_dev` and `silta_finland` contexts. Refer to the Getting Started section for details.

## Contributing

This project is maintained by [Wunder](https://wunder.io/). Contributions from the community are welcome.

<details>
<summary>Commit message validation and ticketing system integration</summary>

### Commit message validation and ticketing system integration

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages, with an additional requirement for ticket IDs. Each commit message must include a valid ticket ID (except for merge commits) and follow the conventional commits format:

```bash
[PROJECTKEY-123]: (feat) Add new feature description

- Detailed change description
- Another relevant detail

Refs: file1.ext, file2.ext
```

Types include (used within parentheses):

- feat: New feature (correlates with MINOR in semantic versioning)
- fix: Bug fix (correlates with PATCH in semantic versioning)
- docs: Documentation changes
- style: Changes not affecting code meaning
- refactor: Code changes neither fixing bugs nor adding features
- perf: Performance improvements
- test: Adding or correcting tests
- build: Build system or dependency changes
- ci: CI configuration changes
- chore: Other changes not modifying src or test files

Breaking changes must be indicated by appending a ! after the type/scope or including "BREAKING CHANGE:" in the footer.

Ticket ID formats:

- JIRA: `[PROJECTKEY-123]: (type) Description`
- GitHub: `GH-123: (type) Description`

We leverage [autolinked references](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls) to automatically convert ticket IDs into clickable links for easy navigation. This enhances traceability and accessibility across platforms.

Validation rules are implemented via the GrumPHP `git_commit_message` component. See `grumphp.yml` for configuration details.
</details>

### Git workflow

Refer to the [WunderFlow repository](https://github.com/wunderio/WunderFlow) for Git workflow details.

### Deployments

Deployments are managed with CircleCI. Configurations are in `.circleci/config.yml`.

- Feature branches require manual approval for deployment by default.
- Other branches deploy automatically but can be configured for manual approval.

Manual approvals are managed through the `approve-deployment` job in the CircleCI UI by clicking the "approve-deployment" job label when marked as "Needs Approval."
