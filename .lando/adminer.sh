#!/bin/sh
set -exu

# Link custom adminer.php from .lando folder to webroot.
ln -sf /app/.lando/adminer.php /var/www/html/

# Copy & rename versioned Adminer library file.
cd /var/www/html
find . -type f -name 'adminer-*' -print0 | xargs -0 -I{} cp -f {} adminer_library.php

chown -R www-data:www-data /var/www/html
chmod -R +x /var/www/html

#
# Allow PHP-FPM to read environment variables.
#
allow_env_variables_in_php() {
  # Enable the clear_env option in PHP-FPM configuration.
  sed -i "s/;clear_env = no/clear_env = no/" "/etc/php8/php-fpm.d/www.conf"

  # Restart the PHP-FPM master process.
  php_fpm_pid=$(pgrep -o php-fpm)
  if [ -n "$php_fpm_pid" ]; then
      # Send USR2 signal to gracefully restart PHP-FPM
      kill -USR2 "$php_fpm_pid"
      echo "PHP-FPM master process (PID $php_fpm_pid) restarted."
  else
      echo "PHP-FPM master process not found."
  fi
}

allow_env_variables_in_php
