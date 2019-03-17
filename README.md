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

## Local development

Install [Lando](https://docs.devwithlando.io/). Add your project's name and other project-specific settings to `.lando.yml` and run `lando start`. Useful helper commands:

- `lando cre` runs `composer require`
- `lando cup` runs `composer update`
- `lando cupdc` runs `composer update drupal/core webflo/drupal-core-require-dev --with-dependencies`

Run `lando` for for complete list of available Lando commands.

### Testing

Supported testing tools:

#### [PHP_CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer) with Drupal, DrupalPractice standards

Usage: `lando phpcs <path>`

Examples:

- `lando phpcs web/modules/custom`
- `lando phpcbf web/modules/custom`

#### [Codeception](https://github.com/Codeception/Codeception)

Usage: `lando codeception <command>`

Create Codeception tests folder by running `lando codeception bootstrap`.

#### [PHPStan](https://github.com/phpstan/phpstan) with [phpstan-drupal](https://github.com/mglaman/phpstan-drupal) extension

Usage: `lando phpstan <command>`

Example: analyze contrib modules for depreciation by running `lando phpstan analyse web/modules/contrib/`.

#### [PHPUnit](https://github.com/sebastianbergmann/phpunit/)

Usage: `lando phpunit <command>`
