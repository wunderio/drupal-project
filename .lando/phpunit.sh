#!/bin/sh
set -exu

# Configure PHPUnit tests for the Lando environment.
# @see: https://agile.coop/blog/drupal-phpunit-tests-lando/

PHPUNIT_CONFIG=/app/phpunit.xml

# Copy and edit the phpunit.xml.dist only once.
if [ ! -f "$PHPUNIT_CONFIG" ]; then
    cd /app
    cp -n web/core/phpunit.xml.dist phpunit.xml
    sed -i 's|tests\/bootstrap\.php|./web/core/tests/bootstrap.php|g' phpunit.xml
    sed -i 's|\.\/tests\/|./web/core/tests/|g' phpunit.xml
    sed -i 's|directory>\.\/|directory>./web/core/|g' phpunit.xml
    sed -i 's|directory>\.\.\/|directory>./web/core/|g' phpunit.xml
    sed -i 's|<env name="SIMPLETEST_BASE_URL" value=""\/>|<env name="SIMPLETEST_BASE_URL" value="http://appserver_nginx" force="true"/>|g' phpunit.xml
    sed -i 's|<env name="SIMPLETEST_DB" value=""\/>|<env name="SIMPLETEST_DB" value="sqlite://localhost/tmp/db.sqlite"/>|g' phpunit.xml
    vendor/bin/phpunit --migrate-configuration
    rm phpunit.xml.bak
fi
