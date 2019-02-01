<?php

// Database settings.
$databases['default']['default'] = [
  'database' => getenv('DB_NAME'),
  'username' => getenv('DB_USER'),
  'password' => getenv('DB_PASS'),
  'host' => getenv('DB_HOST'),
  'port' => '3306',
  'driver' => 'mysql',
  'prefix' => '',
  'collation' => 'utf8mb4_general_ci',
];

// Salt for one-time login links, cancel links, form tokens, etc.
$settings['hash_salt'] = getenv('HASH_SALT');

/**
 * If a volume has been set for private files, tell Drupal about it.
 */
if (getenv('PRIVATE_FILES_PATH')) {
  $settings['file_private_path'] = getenv('PRIVATE_FILES_PATH');
}

/**
 * Set the memcache server hostname when a memcached server is available
 */
if (getenv('MEMCACHED_HOST')) {
  $settings['memcache']['servers'] = [getenv('MEMCACHED_HOST') . ':11211' => 'default'];
}

/**
 * Generated twig files should not be on shared storage.
 */
$settings['php_storage']['twig']['directory'] = '/tmp';
