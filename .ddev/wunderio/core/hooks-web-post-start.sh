#!/bin/bash

#
# Helper script to run web post-start commands.
#

set -eu
if [[ -n "${WUNDERIO_DEBUG:-}" ]]; then
    set -x
fi
export PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/var/www/html/vendor/bin

source .ddev/wunderio/core/_helpers.sh

# Function to check if Drupal is working.
is_drupal_working() {
    # Drush 11 and older.
    status=$(drush status bootstrap 2>&1)
    if echo "$status" | grep -q "Successful"; then
        # "Successful" found, Drupal is working.
        return 0
    fi

    # Drush 12 and newer.
    status=$(drush status --field=bootstrap 2>&1)
    if echo "$status" | grep -q "Successful"; then
        # "Successful" found, Drupal is working.
        return 0
    fi

    return 1
}

# Commands to run if Drupal is working.
if is_drupal_working; then
    uli_link=$(drush uli)
    display_status_message "Drupal is working, running drush uli: $uli_link"
fi
