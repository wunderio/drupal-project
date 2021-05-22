#!/bin/sh
set -exu

# Configure PHPUnit tests for the Lando environment.
# @see: https://agile.coop/blog/drupal-phpunit-tests-lando/
#
# Initially this was part of lando build process but we decided
# to commit the phpunit.xml. Still the functionality of this
# script could be useful as it always gets the latest distributed
# configuration from core. From time to time it wouldn't hurt
# try and update the file with 'lando regenerate-phpunit-config'.

PHPUNIT_CONFIG=/app/phpunit.xml

if [ -f "$PHPUNIT_CONFIG" ]; then
  rm "$PHPUNIT_CONFIG"
fi

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
