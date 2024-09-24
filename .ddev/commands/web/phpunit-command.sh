#!/usr/bin/env bash

## Description: Run PHPUnit commands.
## Usage: phpunit
## Example: "ddev phpunit"

php /var/www/html/vendor/bin/phpunit -c /var/www/html/phpunit.xml --testdox
