# Wunder template for Drupal projects

This project template is an opinionated fork of the popular [Drupal-composer template](https://github.com/drupal-composer/drupal-project), configured to automatically deploy code to a [Kubernetes](https://kubernetes.io/) cluster using [CircleCI](https://circleci.com/). Everything that works with the Drupal-composer project template will work with this repository, so we won't duplicate the documentation here.

## Getting started

- Click "[Use this template](https://github.com/wunderio/drupal-project/generate)" to generate a new project,
  - select the correct owner,
  - name the project as `client-COUNTRYCODE-CLIENT-PROJECT`,
  - make the repository private (unless the project is public).
- Clone the new project locally and modify its details:
  - `composer.json` name,
  - `silta/silta.yml` [values](https://github.com/wunderio/charts/blob/master/drupal/values.yaml),
  - `grumphp.yml` tasks, including the project name in `git_commit_message` regex.
- Log in to [CircleCI](https://app.circleci.com/) using your Github account and add the new project using existing config.
- Configure [automatic autolinks](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls#custom-autolinks-to-external-resources) for the project's JIRA environment.

For additional instructions, please see the [Silta documentation](https://github.com/wunderio/silta).

## Main environment

- URL: <https://main.drupal-project.dev.wdr.io>
- Drush alias: `drush @main st`
- SSH: `ssh www-admin@main-shell.drupal-project -J www-admin@ssh.dev.wdr.io`

Drush alias for the **current** Silta feature branch deployment is `drush @current st`.

### Environment variables for silta_dev context

The following secret variables are defined in the file `silta/silta.secret` for the context `silta_dev`:

- `TEST_KEY` - secret key for testing purposes.

## Local environment

- Appserver: <https://drupal-project.lndo.site>
- Adminer: <http://adminer.drupal-project.lndo.site>
- Elasticsearch: <http://localhost:9200>, <http://elasticsearch.lndo.site>
- Kibana: <http://localhost:5601>, <http://kibana.lndo.site>
- Mailhog: <http://mail.lndo.site>
- Varnish: <https://varnish.drupal-project.lndo.site>
- Drush alias: `lando drush @local st`
- SSH: `lando ssh (-s <service>)`

### [Setup](https://docs.lando.dev/getting-started/installation.html)

1. Install the latest [Lando](https://github.com/lando/lando/releases) and read the [documentation](https://docs.lando.dev/).
2. Update your project name and other Lando [Drupal 10 recipe](https://docs.lando.dev/drupal/)'s parameters at `.lando.yml`.
3. Run `lando start`.

### [Services](https://docs.lando.dev/core/v3/services.html)

- `adminer` - uses [Adminer database management tool](https://github.com/dehy/docker-adminer).
- `chrome` - uses [selenium/standalone-chrome](https://hub.docker.com/r/selenium/standalone-chrome/) image, uncomment the service definition at `.lando.yml` to enable.
- `elasticsearch` - uses official [Elasticsearch image](https://hub.docker.com/r/elastic/elasticsearch), uncomment the service definition at `.lando.yml` to enable. Requires [at least 4GiB of memory](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html).
- `kibana`  - uses official [Kibana image](https://hub.docker.com/r/elastic/kibana), uncomment the service definition at `.lando.yml` to enable.
- `mailhog` - uses Lando [MailHog service](https://docs.lando.dev/mailhog/).
- `node` - uses Lando [Node service](https://docs.lando.dev/node/).
- `varnish` - uses Lando [Varnish service](https://docs.lando.dev/varnish/), uncomment the service definition at `.lando.yml` to enable.

### [Tools](https://docs.lando.dev/core/v3/tooling.html)

- `lando` - tools / commands overview.
- `lando grumphp <commands>` - run [GrumPHP](https://github.com/phpro/grumphp) code quality checks. Modified or new files are checked on git commit, see more at `lando grumphp -h` or [wunderio/code-quality](https://github.com/wunderio/code-quality).
- `lando npm <commands>` - run [npm](https://www.npmjs.com/) commands.
- `lando phpunit <commands>` - run [PHPUnit](https://phpunit.de/) commands.
- `lando varnishadm <commands>` - run [varnishadm](https://varnish-cache.org/docs/6.0/reference/varnishadm.html) commands.
- `lando xdebug <mode>` - load [Xdebug](https://xdebug.org/) in the selected [mode(s)](https://xdebug.org/docs/all_settings#mode).

## Development advices

### Drupal core tips

- [Updating Drupal core](https://www.drupal.org/docs/updating-drupal/updating-drupal-core-via-composer).
- [Altering scaffold files](https://www.drupal.org/docs/develop/using-composer/using-drupals-composer-scaffold#toc_4) (`robots.txt`, `.htaccess` etc.).

### Varnish and Purge configuration

- Enable [Varnish](https://varnish-cache.org) by uncommenting Lando Varnish configuration in `.lando.yml`: (`services` → `varnish` and `proxy` → `varnish`) and run `lando rebuild -y`.
- Purge and Varnish Purge settings configuration is set in the `basic` installation profile that can be installed via `lando drush si basic -y`. This configuration should work out of the box.
- For sites that have already been installed:
  - Install Purge and related modules: `lando drush en purge purge_drush purge_processor_lateruntime purge_queuer_coretags purge_tokens purge_ui varnish_purger varnish_purge_tags -y`.
  - Make sure that a value is set for **Browser and proxy cache maximum age** at `admin/config/development/performance` to make Varnish act on pages.
  - Navigate to Purge administration page (`/admin/config/development/performance/purge`), click "Add purger" → "Varnish Purger" and configure it:
    - Name: "Varnish Purger"
    - Headers: `Cache-Tags`: `[invalidation:expression]`
    - Save
  - Export the created configuration: `lando drush cex -y`.
  - Note the ID on the created `varnish_purger.settings.<PURGER_ID>.yml` file.
  - Open `web/sites/default/settings.php`, find all the `varnish_purger.settings.f94540554c` values and replace the ID with the one from the newly exported configuration.
  - Run `lando drush cr`.
  - Varnish should now be available in its own host and purged when content is updated.

Note: Default Purge setup is using `purge_processor_lateruntime` module that'll empty the queue on page requests. This should work well enough for most sites that need immediate clearing of purge queues when content is being saved.

### Running tests

The [PHPUnit](https://phpunit.de/) test framework is predefined in this project, see `phpunit.xml` for details. Also, there is a minified `web/modules/custom/phpunit_example` module included from [examples module](https://www.drupal.org/project/examples) for learning purposes.

#### Testing examples

Use `lando phpunit` to run the PHPUnit commands.

- run one test class: `lando phpunit path/to/your/class/file.php`,
- list groups: `lando phpunit --list-groups`,
- run all the tests in a particular group: `lando phpunit --group Groupname`.

### Secrets handling

[Silta CLI](https://github.com/wunderio/silta-cli) is a command-line tool that helps you manage secrets and configurations for your Silta projects. You can use Silta CLI to encrypt and decrypt files with the following commands:

- `silta secrets encrypt --file silta/silta.secret --secret-key=$SECRET_KEY` to encrypt a file.
- `silta secrets decrypt --file silta/silta.secret --secret-key=$SECRET_KEY` to decrypt a file.
- `silta secrets --help` for help.

To use these commands, you need a secret key that is used to encrypt and decrypt the data. It can be specified with the `--secret-key` flag (defaults to the `SECRET_KEY` environment variable). It is strongly advised to use a custom key for each project to ensure security and avoid conflicts. See Silta's documentation on [how to use a custom decryption key in a CircleCI configuration](https://wunderio.github.io/silta/docs/encrypting-sensitive-configuration/#using-a-custom-encryption-key).

You should use the following naming convention for your custom keys: `SEC_{PROJECT_NAME}_{CONTEXT}` where `CONTEXT` refers to the environment you are working on, such as `silta_dev` (development context) or `silta_finland` (production context). For example, if you are working on the `drupal-project` project in the `silta_dev` environment, you should use the `SEC_DRUPAL_PROJECT_SILTA_DEV` key.

The `silta/silta.secret` file is a YAML file that contains the encrypted secrets for your project in the default `silta-dev` context. You can add more files for other contexts, such as `silta/silta-prod.secret` for the production context.

## Contributing

This project is maintained by [Wunder](https://wunder.io/). We welcome contributions from the community.

### Commit message validation and ticketing system integration

Our project uses both JIRA and GitHub Issues for tracking and managing tasks. We use [Autolinked references](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls) to convert ticket IDs into links for easy navigation. To ensure traceability, commit messages must include a valid ticket ID from either system, except for merge commits. Additionally, provide a clear description of the change.

The format is as follows:

- JIRA: `[PROJECTKEY-123]: Description`
- GitHub: `[GH-123]: Description`

Validation rules are implemented via GrumPHP `git_commit_message` component. Please see `grumphp.yml` for details.

Following these guidelines ensures our project remains organized and changes are traceable. Thank you for adhering to these standards.
