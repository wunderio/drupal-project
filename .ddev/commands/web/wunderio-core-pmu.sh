#!/usr/bin/env bash

## Description: Runs drush pmu commands but also creates dummy module folder if it does not exist.
## Usage: pmu
## Example: "ddev pmu module1 module2 ..."

/var/www/html/.ddev/wunderio/core/_run-scripts.sh tooling-pmu.sh "$@"
