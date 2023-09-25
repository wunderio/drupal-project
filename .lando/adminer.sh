#!/bin/sh
set -exu

# Copy custom adminer.php from .lando folder to webroot.
cp -f /app/.lando/adminer.php /var/www/html/adminer.php

# Copy & rename versioned Adminer library file.
cd /var/www/html
find . -type f -name 'adminer-*' -print0 | xargs -0 -I{} cp -f {} adminer_library.php

chown -R www-data:www-data /var/www/html
chmod -R +x /var/www/html
