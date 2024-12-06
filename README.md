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
   - Update `README.md` with the project details.
   - Update `composer.json` with the project name.
   - Modify the `silta/silta*` files [values](https://github.com/wunderio/charts/blob/master/drupal/values.yaml).
   - Adjust `grumphp.yml` tasks, including updating the project name in the `git_commit_message` regex.
   - Adjust the `lando` configuration in `.lando.yml`.

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

## Local environment

- **Appserver**: <https://drupal-project.lndo.site>
- **Adminer**: <http://adminer.drupal-project.lndo.site>
- **Elasticsearch**:
  - <http://localhost:9200>
  - <http://elasticsearch.lndo.site>
- **Kibana**:
  - <http://localhost:5601>
  - <http://kibana.lndo.site>
- **Mailpit**: <http://mail.lndo.site>
- **Varnish**: <https://varnish.drupal-project.lndo.site>
- **Drush alias**: `lando drush @local st`
- **SSH**: `lando ssh (-s <service>)`

### [Setup](https://docs.lando.dev/getting-started/installation.html)

1. Install the latest [Lando](https://github.com/lando/lando/releases) and read the [documentation](https://docs.lando.dev/).
2. Update your project name and other Lando [Drupal 10 recipe](https://docs.lando.dev/drupal/) parameters in `.lando.yml`.
3. Run `lando start`.

### [Services](https://docs.lando.dev/core/v3/services.html)

- **Adminer**: Uses [Adminer database management tool](https://github.com/dehy/docker-adminer).
- **Chrome**: Uses the [selenium/standalone-chrome](https://hub.docker.com/r/selenium/standalone-chrome/) image. Uncomment the service definition in `.lando.yml` to enable.
- **Elasticsearch**: Uses the official [Elasticsearch image](https://hub.docker.com/r/elastic/elasticsearch). Uncomment the service definition in `.lando.yml` to enable. Requires [at least 4 GiB of memory](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html).
- **Kibana**: Uses the official [Kibana image](https://hub.docker.com/r/elastic/kibana). Uncomment the service definition in `.lando.yml` to enable.
- **Mailpit**: Uses the custom [Mailpit service](https://mailpit.axllent.org/).
- **Node**: Uses Lando's [Node service](https://docs.lando.dev/node/).
- **Varnish**: Uses Lando's [Varnish service](https://docs.lando.dev/varnish/). Uncomment the service definition in `.lando.yml` to enable.

### [Tools](https://docs.lando.dev/core/v3/tooling.html)

- **`lando`**: Lists available tools and commands.
- **`lando drupal <arguments>`**: Run Drupal core scripts with arguments.
- **`lando grumphp <commands>`**: Run [GrumPHP](https://github.com/phpro/grumphp) code quality checks.
- **`lando npm <commands>`**: Run [npm](https://www.npmjs.com/) commands.
- **`lando phpunit <commands>`**: Run [PHPUnit](https://phpunit.de/) commands.
- **`lando varnishadm <commands>`**: Run [varnishadm](https://varnish-cache.org/docs/6.0/reference/varnishadm.html) commands.
- **`lando xdebug <mode>`**: Load [Xdebug](https://xdebug.org/) in the selected [mode(s)](https://xdebug.org/docs/all_settings#mode).

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

We use JIRA and GitHub issues for tracking tasks. Commit messages must include a valid ticket ID except for merge commits. Use the following format:

- JIRA: `[PROJECTKEY-123]: Description`
- GitHub: `[GH-123]: Description`

We leverage [autolinked references](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls) to automatically convert ticket IDs into clickable links for easy navigation. This enhances traceability and accessibility across platforms.

Validation rules are implemented via the GrumPHP `git_commit_message` component. See `grumphp.yml` for configuration details.

### Git workflow

Refer to the [WunderFlow repository](https://github.com/wunderio/WunderFlow) for Git workflow details.

### Deployments

Deployments are managed with CircleCI. Configurations are in `.circleci/config.yml`.

- Feature branches require manual approval for deployment by default.
- Other branches deploy automatically but can be configured for manual approval.

Manual approvals are managed through the `approve-deployment` job in the CircleCI UI by clicking the "approve-deployment" job label when marked as "Needs Approval."
