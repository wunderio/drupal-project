#!/bin/bash

## Description: run the Drupal core script with provided arguments
## Usage: drupal <arguments>
## Example: lando drupal generate-theme my-theme

cd ${LANDO_WEBROOT}

php core/scripts/drupal "$@"
