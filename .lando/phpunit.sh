#!/bin/sh
set -exu

# Configure PHPUnit tests for the Lando environment.
# @see: https://agile.coop/blog/drupal-phpunit-tests-lando/

cp -n web/core/phpunit.xml.dist phpunit.xml
sed -i 's|tests\/bootstrap\.php|/app/web/core/tests/bootstrap.php|g' phpunit.xml

# Update SQLIte version for PHPUnit.
# @see: https://www.drupal.org/project/drupal/issues/3107155#comment-13523654.
# @see: https://www.drupal.org/node/3119118
echo "deb http://archive.ubuntu.com/ubuntu focal main restricted universe multiverse" >> /etc/apt/sources.list
apt-get update
apt-get -y install sqlite3/focal --allow-unauthenticated
