<?php

/**
 * @file
 * Settings for Lando environment.
 */

/**
 * Load database credentials from Lando app environment.
 */
$lando_info = json_decode(getenv('LANDO_INFO'), TRUE);
$databases['default']['default'] = [
  'driver' => 'mysql',
  'database' => $lando_info['database']['creds']['database'],
  'username' => $lando_info['database']['creds']['user'],
  'password' => $lando_info['database']['creds']['password'],
  'host' => $lando_info['database']['internal_connection']['host'],
  'port' => $lando_info['database']['internal_connection']['port'],
];

// Use the hash_salt setting from Lando.
$settings['hash_salt'] = getenv('HASH_SALT');

// Skip file system permissions hardening in local development with Lando.
$settings['skip_permissions_hardening'] = TRUE;

// Skip trusted host pattern when using Lando.
$settings['trusted_host_patterns'] = ['.*'];
