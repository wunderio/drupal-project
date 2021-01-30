#!/bin/bash

if [ "$#" -ne 1 ]; then
  docker-php-ext-enable xdebug
  pkill -o -USR2 php-fpm
  echo "Xdebug is loaded in the mode defined in the .lando/php.ini file."
  echo "Valid modes: https://xdebug.org/docs/all_settings#mode."
else
  rm -rf /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
  pkill -o -USR2 php-fpm
  echo "Xdebug is turned off."
fi
