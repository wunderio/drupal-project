#!/bin/bash

ALLOWED_XDEBUG_MODES=(
  "off"
  "develop"
  "coverage"
  "debug"
  "gcstats"
  "profile"
  "trace"
)

IS_VALID_COMMAND=false
for value in ${ALLOWED_XDEBUG_MODES[@]}; do
  if [ "${1-}" == "$value" ]; then
    IS_VALID_COMMAND=true
  fi
done

if [ "$#" -ne 1 ]; then
  echo "Xdebug has been turned off, please use the following syntax: 'lando xdebug <mode>'."
  echo "Valid modes: https://xdebug.org/docs/all_settings#mode."
  echo xdebug.mode = off > /usr/local/etc/php/conf.d/zzz-lando-xdebug.ini
  pkill -o -USR2 php-fpm
elif [ "$IS_VALID_COMMAND" == 'false' ]; then
  echo "'$1' is invalid mode for Xdebug. Valid modes are: https://xdebug.org/docs/all_settings#mode."
else
  mode="$1"
  echo xdebug.mode = "$mode" > /usr/local/etc/php/conf.d/zzz-lando-xdebug.ini
  pkill -o -USR2 php-fpm
  echo "Xdebug is loaded in "$mode" mode."
fi
