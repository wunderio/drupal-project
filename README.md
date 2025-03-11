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

#### DDEV services and access points

| Service | Description | Access |
|---------|-------------|---------|
| Web server | Primary web service | <https://drupal-project.ddev.site> |
| Adminer | Database management via [ddev-adminer](https://github.com/ddev/ddev-adminer) | <https://drupal-project.ddev.site:9101> or `ddev adminer` |
| Elasticsearch | Search functionality via [ddev-elasticsearch](https://github.com/ddev/ddev-elasticsearch) | <https://drupal-project.ddev.site:9002> |
| Kibana | Elasticsearch visualization via [ddev-kibana](https://github.com/JanoPL/ddev-kibana/) | <https://drupal-project.ddev.site:5601> |
| Mailpit | Email testing via [built-in service](https://ddev.readthedocs.io/en/stable/users/usage/developer-tools/#email-capture-and-review-mailpit) | <https://drupal-project.ddev.site:8026> or `ddev mailpit` |
| Varnish | Caching via [ddev-varnish](https://github.com/ddev/ddev-varnish) | Default on web server. Direct: <https://novarnish.drupal-project.ddev.site> |
| Drush | Drupal CLI tool | `ddev drush @local st` |
| SSH | Container shell access | `ddev ssh (-s <service>)` |
| Node | JavaScript tooling | Included in web container |

#### DDEV setup instructions

1. Install [DDEV](https://ddev.com/get-started/)
   - DDEV recommends Orbstack, but Docker Desktop and [Rancher Desktop](https://rancherdesktop.io/) are also compatible
2. Start the environment and install dependencies:

   ```bash
   ddev start
   ddev composer install
   ```

#### DDEV common commands

- `ddev` - Display available commands
- `ddev grumphp <commands>` - Run code quality checks
- `ddev npm <commands>` - Execute npm commands
- `ddev phpunit <commands>` - Run test suites
- `ddev varnishadm <commands>` - Manage Varnish cache
- `ddev xdebug <mode>` - Configure Xdebug debugging modes
- `ddev syncdb [environment]` - Sync database from remote environment (requires VPN and `ddev auth ssh`, see `scripts/syncdb.sh` for details)

<details>
<summary>Lando environment (legacy)</summary>

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

### Drupal core updates

- [Updating Drupal core](https://www.drupal.org/docs/updating-drupal/updating-drupal-core-via-composer).
- [Altering scaffold files](https://www.drupal.org/docs/develop/using-composer/using-drupals-composer-scaffold#toc_4) (e.g., `robots.txt`, `.htaccess`).

### Varnish and Purge configuration

1. **Enable Varnish:**
   - Uncomment the Varnish configuration in `.lando.yml` under `services → varnish` and `proxy → varnish`.
   - Run `lando rebuild -y`.

2. **Basic installation profile configuration:**
   - Install the `basic` profile: `lando drush si basic -y`.
   - This sets up Purge and Varnish Purge out of the box.

3. **Configuration for installed sites:**
   - Enable the required modules:

     ```bash
     lando drush en purge purge_drush purge_processor_lateruntime purge_queuer_coretags purge_tokens purge_ui varnish_purger varnish_purge_tags -y
     ```

   - Set a value for **Browser and proxy cache maximum age** in `admin/config/development/performance`.
   - Navigate to `/admin/config/development/performance/purge`, click **Add purger**, and select **Varnish Purger**:
     - **Name:** "Varnish Purger"
     - **Headers:** `Cache-Tags`: `[invalidation:expression]`
     - Save the configuration.
   - Export the configuration:

     ```bash
     lando drush cex -y
     ```

   - Find the purger ID in the exported `varnish_purger.settings.<PURGER_ID>.yml` file.
   - Update `web/sites/default/settings.php`:
     - Replace all occurrences of `varnish_purger.settings.<OLD_ID>` with the new purger ID.
   - Clear the cache:

     ```bash
     lando drush cr
     ```

   Varnish should now be configured to handle caching and purging when content is updated.

**Note:** The default Purge setup uses the `purge_processor_lateruntime` module, which empties the purge queue during page requests. This works well for most sites needing immediate cache clearing.

### Running tests

The [PHPUnit](https://phpunit.de/) test framework is predefined in this project. See `phpunit.xml` for details. A minified `web/modules/custom/phpunit_example` module from the [examples module](https://www.drupal.org/project/examples) is included for learning purposes.

#### Testing examples

Use `lando phpunit` to run PHPUnit commands:

- Run one test class: `lando phpunit path/to/your/class/file.php`
- List groups: `lando phpunit --list-groups`
- Run all tests in a particular group: `lando phpunit --group Groupname`

### Secrets handling

[Silta CLI](https://github.com/wunderio/silta-cli) is a command-line tool to manage secrets and configurations for Silta projects. Use the following commands:

- Encrypt a file: `silta secrets encrypt --file silta/silta.secrets --secret-key=<secret_key_env>`
- Decrypt a file: `silta secrets decrypt --file silta/silta.secrets --secret-key=<secret_key_env>`
- Display help: `silta secrets --help`

See the corresponding `secret_key_env` values in the `.circleci/config.yml` file for the `silta_dev` and `silta_finland` contexts. Refer to the Getting Started section for details.

## Contributing

This project is maintained by [Wunder](https://wunder.io/). Contributions from the community are welcome.

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

### Git workflow

Refer to the [WunderFlow repository](https://github.com/wunderio/WunderFlow) for Git workflow details.

### Deployments

Deployments are managed with CircleCI. Configurations are in `.circleci/config.yml`.

- Feature branches require manual approval for deployment by default.
- Other branches deploy automatically but can be configured for manual approval.

Manual approvals are managed through the `approve-deployment` job in the CircleCI UI by clicking the "approve-deployment" job label when marked as "Needs Approval."
