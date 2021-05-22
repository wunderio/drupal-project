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

PHPUNIT_CONFIG_DEFAULT=/app/phpunit.xml
PHPUNIT_CONFIG_GRUMPHP=/app/phpunit.grumphp.xml

if [ -f "$PHPUNIT_CONFIG_DEFAULT" ]; then
  rm "$PHPUNIT_CONFIG_DEFAULT"
  rm "$PHPUNIT_CONFIG_GRUMPHP"
fi

cd /app
cp -n web/core/phpunit.xml.dist "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|tests\/bootstrap\.php|./web/core/tests/bootstrap.php|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|\.\/tests\/|./web/core/tests/|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|directory>\.\/|directory>./web/core/|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|directory>\.\.\/|directory>./web/core/|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|<env name="SIMPLETEST_BASE_URL" value=""\/>|<env name="SIMPLETEST_BASE_URL" value="http://appserver_nginx" force="true"/>|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|<env name="SIMPLETEST_DB" value=""\/>|<env name="SIMPLETEST_DB" value="sqlite://localhost/tmp/db.sqlite"/>|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|<file>.\/web\/core\/tests\/TestSuites\/UnitTestSuite.php<\/file>|<directory>.\/web\/modules\/custom\/*\/tests\/src\/Unit<\/directory>|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|<file>.\/web\/core\/tests\/TestSuites\/KernelTestSuite.php<\/file>|<directory>.\/web\/modules\/custom\/*\/tests\/src\/Kernel<\/directory>|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|<file>.\/web\/core\/tests\/TestSuites\/FunctionalTestSuite.php<\/file>|<directory>.\/web\/modules\/custom\/*\/tests\/src\/Functional<\/directory>|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i 's|<file>.\/web\/core\/tests\/TestSuites\/FunctionalJavascriptTestSuite.php<\/file>|<directory>.\/web\/modules\/custom\/*\/tests\/src\/FunctionalJavascript<\/directory>|g' "$PHPUNIT_CONFIG_DEFAULT"
sed -i '/<file>.\/web\/core\/tests\/TestSuites\/BuildTestSuite.php<\/file>/d' "$PHPUNIT_CONFIG_DEFAULT"
vendor/bin/phpunit --migrate-configuration

# Generate similar config for Lando but keep only unit
# test otherwise it would take too much time to run.
cp "$PHPUNIT_CONFIG_DEFAULT" "$PHPUNIT_CONFIG_GRUMPHP"
sed -i '/<directory>.\/web\/modules\/custom\/\*\/tests\/src\/Kernel<\/directory>/d' "$PHPUNIT_CONFIG_GRUMPHP"
sed -i '/<directory>.\/web\/modules\/custom\/\*\/tests\/src\/Functional<\/directory>/d' "$PHPUNIT_CONFIG_GRUMPHP"
sed -i '/<directory>.\/web\/modules\/custom\/\*\/tests\/src\/FunctionalJavascript<\/directory>/d' "$PHPUNIT_CONFIG_GRUMPHP"

rm phpunit.xml.bak
