#!/bin/sh
set -exu

# Configure PHPUnit tests for the Lando environment.
# @see: https://agile.coop/blog/drupal-phpunit-tests-lando/

cp -n web/core/phpunit.xml.dist phpunit.xml
sed -i 's|tests\/bootstrap\.php|/app/web/core/tests/bootstrap.php|g' phpunit.xml
