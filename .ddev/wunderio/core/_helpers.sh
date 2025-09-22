#!/bin/bash

#
# Helper functions.
#

set -eu
if [[ -n "${WUNDERIO_DEBUG:-}" ]]; then
    set -x
fi
export PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/var/www/html/vendor/bin

# Function to display status message
display_status_message() {
    local color_green="\033[38;5;70m"
    local color_reset="\033[0m"
    local message="$1"

    printf "${color_green}${message}${color_reset}\n"
}
