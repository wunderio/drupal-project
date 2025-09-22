#!/bin/bash

#
# Helper script to run GrumPHP.
#

set -eu
if [[ -n "${WUNDERIO_DEBUG:-}" ]]; then
    set -x
fi
export PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/var/www/html/vendor/bin

php /var/www/html/vendor/bin/grumphp "$@"
