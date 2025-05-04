#!/bin/bash

#
# Helper script to run posb-import db hook.
#

set -eu
if [[ -n "${WUNDERIO_DEBUG:-}" ]]; then
    set -x
fi
export PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/var/www/html/vendor/bin

source /var/www/html/.ddev/wunderio/core/_helpers.sh

cd $DDEV_COMPOSER_ROOT && drush cache:rebuild -y && drush sqlsan -y

uli_link=$(drush uli)
display_status_message "Drupal is working, running drush uli: $uli_link"
