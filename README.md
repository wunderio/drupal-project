# Wunder template for Drupal projects

This project template is an opinionated fork of the popular [Drupal-composer template](https://github.com/drupal-composer/drupal-project), configured to automatically deploy code to a [Kubernetes](https://kubernetes.io/) cluster using [CircleCI](https://circleci.com/). Everything that works with the Drupal-composer project template will work with this repository, so we won't duplicate the documentation here.

## Getting started

- Click "[Use this template](https://github.com/wunderio/drupal-project/generate)" to generate a new project
  - Select correct owner
  - Name the project as `client-COUNTRYCODE-CLIENT-PROJECT`
  - Make the repository private (unless the project is public)
- Clone project and modify project details
  - `composer.json` name
  - `silta/silta.yml`
    - See [values](https://github.com/wunderio/charts/blob/master/drupal/values.yaml) options to override.
- Log in to CircleCI using your Github account and add the new project using existing config.

For additional instructions, please see the [Silta documentation](https://github.com/wunderio/silta).

## Local development

### [Setup](https://docs.lando.dev/basics/installation.html)

1. Install the latest [Lando](https://github.com/lando/lando/releases) and read the [documentation](https://docs.lando.dev/).
2. Update your project name and other Lando [Drupal 9 recipe](https://docs.lando.dev/config/drupal9.html)'s parameters at `.lando.yml`.
3. Run `lando start`.

### [Services](https://docs.lando.dev/config/services.html)

- `chrome` - uses [selenium/standalone-chrome](https://hub.docker.com/r/selenium/standalone-chrome/) image, uncomment the service definition at `.lando.yml` to enable.
- `elasticsearch` - uses [blacktop/elasticsearch:7](https://github.com/blacktop/docker-elasticsearch-alpine) image. Uncomment the service and proxy definitions at `.lando.yml` to enable. You can change default ES settings at `.lando/elasticsearch.yml`.
- `kibana`  - uses [blacktop/kibana:7](https://github.com/blacktop/docker-kibana-alpine) image, uncomment the service and proxy definitions at `.lando.yml` to enable.
- `mailhog` - uses Lando [MailHog service](https://docs.lando.dev/config/mailhog.html).
- `node` - uses Lando [Node service](https://docs.lando.dev/config/node.html).

### [Tools](https://docs.lando.dev/config/tooling.html)

- `lando` - tools / commands overview.
- `lando grumphp <commands>` - run [GrumPHP](https://github.com/phpro/grumphp) code quality checks. Modified or new files are checked on git commit, see more at `lando grumphp -h` or [wunderio/code-quality](https://github.com/wunderio/code-quality).
- `lando npm <commands>` - run [npm](https://www.npmjs.com/) commands.
- `lando xdebug-on`, `lando xdebug-off` - enable / disable [Xdebug](https://xdebug.org/) for [nginx](https://nginx.org/en/).
- `lando xdebug-profiler-on`, `lando xdebug-profiler-off` - enable/disable the [Xdebug profiler](https://xdebug.org/docs/profiler). This requires `xdebug-on` to be executed first.

### Drupal development hints

- [Updating Drupal core](https://www.drupal.org/docs/8/update/update-core-via-composer).
- [Altering scaffold files](https://www.drupal.org/docs/develop/using-composer/using-drupals-composer-scaffold#toc_4) (`robots.txt`, `.htaccess` etc.).
