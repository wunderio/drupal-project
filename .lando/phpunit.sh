#!/bin/sh
set -exu

# Configure PHPUnit tests for the Lando environment.
# @see: https://agile.coop/blog/drupal-phpunit-tests-lando/

PHPUNIT_CONFIG=/app/phpunit.xml

# Copy and edit the phpunit.xml.dist only once.
if [ ! -f "$PHPUNIT_CONFIG" ]; then
    cd /app
    cp -n web/core/phpunit.xml.dist phpunit.xml
    sed -i 's|tests\/bootstrap\.php|/app/web/core/tests/bootstrap.php|g' phpunit.xml
fi
