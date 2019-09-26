# Wunder template for Drupal projects

[![CircleCI](https://circleci.com/gh/wunderio/drupal-project/tree/master.svg?style=svg)](https://circleci.com/gh/wunderio/drupal-project/tree/master)

This project template is an opinionated fork of the popular [Drupal-composer template](https://github.com/drupal-composer/drupal-project), configured to automatically deploy code to a [Kubernetes](https://kubernetes.io/) cluster using [CircleCI](https://circleci.com/). Everything that works with the Drupal-composer project template will work with this repository, so we won't duplicate the documentation here.

## Usage

- Copy this repository and push it to our organization.
- Log in to CircleCI using your Github account and add the new project.

## How it works

Each pushed commit is processed according to the instructions in `.circleci/config.yml` in the repository.
Have a look at the file for details, but in short this is how it works:

- Run the CircleCI jobs using a [custom docker image](https://github.com/wunderio/circleci-builder) that has all the tools we need.  
- Validate the codebase with phpcs and other static code analysis tools.
- Build the codebase by downloading vendor code using `composer` and `yarn`.
- Create a custom docker image for Drupal and nginx, and push those to a docker registry (typically that of your cloud provider).
- Install or update our helm chart while passing our custom images as parameters.
- The helm chart executes the usual drush deployment commands.

### Secrets

Project can override values and do file encryption using openssl.
Encryption key has to be identical to the one in circleci context.

Decrypting secrets file:

```sh
openssl enc -d -aes-256-cbc -pbkdf2 -in silta/secrets -out silta/secrets.dec
```

Encrypting secrets file:

```sh
openssl aes-256-cbc -pbkdf2 -in silta/secrets.dec -out silta/secrets
```

Secret values can be attached to circleci `drupal-build-deploy` job like this

```sh
decrypt_files: silta/secrets
silta_config: silta/silta.yml,silta/secrets
```

## Local development

### [Setup](https://docs.lando.dev/basics/installation.html)

1. Install the latest [Lando](https://github.com/lando/lando/releases) and read the [documentation](https://docs.lando.dev/).
2. Update your project name and other Lando [Drupal 8 recipe](https://docs.lando.dev/config/drupal8.html)'s parameters at `.lando.yml`.
3. Run `lando start`.

### [Services](https://docs.lando.dev/config/services.html)

- `chrome` - uses [selenium/standalone-chrome](https://hub.docker.com/r/selenium/standalone-chrome/) image, uncomment the service definition at `.lando.yml` to enable.
- `elasticsearch` - uses [blacktop/elasticsearch:7](https://github.com/blacktop/docker-elasticsearch-alpine) image, uncomment the service and proxy definitions at `.lando.yml` to enable.
- `kibana`  - uses [blacktop/kibana:7](https://github.com/blacktop/docker-kibana-alpine) image, uncomment the service and proxy definitions at `.lando.yml` to enable.
- `mailhog` - uses Lando [MailHog service](https://docs.lando.dev/config/mailhog.html).
- `node` - uses Lando [Node service](https://docs.lando.dev/config/node.html).

### [Tools](https://docs.lando.dev/config/tooling.html)

- `lando` - tools / commands overview.
- `lando codecept <commands>` - run [Codeception](https://codeception.com/) tests.
- `lando grumphp <commands>` - run [GrumPHP](https://github.com/phpro/grumphp) code quality checks. Modified or new files are checked on git commit, see more at `lando grumphp -h` or [wunderio/code-quality](https://github.com/wunderio/code-quality).
- `lando npm <commands>` - run npm commands.
