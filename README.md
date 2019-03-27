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

Quick start: install [Lando](https://docs.devwithlando.io/), add your project's name to `.lando.yml` and run `lando start`.

### Useful commands

- `lando` - Complete list of available Lando [commands](https://docs.devwithlando.io/cli/usage.html).
- `lando info` - Info about running [services](https://docs.devwithlando.io/config/services.html). More details are available using `--deep` flag.
- `lando logs -s <service>` - Show service's [logs](https://docs.devwithlando.io/cli/logs.html).
- `lando drush si --existing-config` - Install Drupal 8 site from [existing configuration](https://www.drupal.org/node/2897299).
- `lando yarn <command>` - Use Yarn.
