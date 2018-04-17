# Wunder template for Drupal projects

[![CircleCI](https://circleci.com/gh/wunderio/drupal-project/tree/master.svg?style=svg)](https://circleci.com/gh/wunderio/drupal-project/tree/master)

This project template is an opinionated fork of the popular [Drupal-composer template](https://github.com/drupal-composer/drupal-project), configured to automatically deploy code to a [Kontena](https://kontena.io/) cluster using [CircleCI](https://circleci.com/). Everything that works with the Drupal-composer project template will work with this repository, so we won't duplicate the documentation here.

## Usage

- Copy this repository and push it to our organization. 
- Log in to CircleCI using your Github account and add the new project.

 
## How it works

Each pushed commit is processed according to the instructions in `.circleci/config.yml` in the repository. 
Have a look at the file for details, but in short this is how it works:

- Run the CircleCI jobs using a [custom docker image](https://github.com/wunderio/circleci-builder) that has all the tools we need.  
- Validate the codebase with phpcs and other static code analysis tools.
- Build the codebase by downloading vendor code using `composer` and `yarn`.
- Create a custom docker image for Drupal and nginx, and push those to Kontena's docker registry.
- Install or update a stack based on the branch name, using the configuration in `kontena.yml`, which uses our custom docker images.
- Execute the usual drush deployment commands into the deployed containers.
