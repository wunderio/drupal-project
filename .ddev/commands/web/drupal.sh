#!/bin/bash

## Description: run the Drupal core script with provided arguments
## Usage: drupal <arguments>
## Example: ddev drupal generate-theme my-theme

cd ${DDEV_APPROOT}/${DDEV_DOCROOT}

php core/scripts/drupal "$@"
