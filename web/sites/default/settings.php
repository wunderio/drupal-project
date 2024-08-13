<?php

// phpcs:ignoreFile

/**
 * @file
 * Drupal site-specific configuration file.
 */

// Database settings, overridden per environment.
$databases['default']['default'] = [
  'database' => getenv('DB_NAME'),
  'username' => getenv('DB_USER'),
  'password' => getenv('DB_PASS'),
  'prefix' => '',
  'host' => getenv('DB_HOST'),
  'port' => '3306',
  'driver' => 'mysql',
];

// Salt for one-time login links, cancel links, form tokens, etc.
$settings['hash_salt'] = getenv('HASH_SALT');

// Public files path.
$settings['file_public_path']  = 'sites/default/files';

// Location of the site configuration files.
$settings['config_sync_directory'] = '../config/sync';

// Load services definition file.
$settings['container_yamls'][] = DRUPAL_ROOT . '/sites/services.yml';

// The default list of directories that will be ignored by Drupal's file API.
$settings['file_scan_ignore_directories'] = [
  'node_modules',
  'bower_components',
];

// Varnish Purge configuration.
if (getenv('VARNISH_ADMIN_HOST')) {
  $config['varnish_purger.settings.f94540554c']['hostname'] = trim(getenv('VARNISH_ADMIN_HOST'));
  $config['varnish_purger.settings.f94540554c']['port'] = '80';
}

// Environment-specific settings.
$env = getenv('ENVIRONMENT_NAME');
switch ($env) {
  case 'production':
    $settings['simple_environment_indicator'] = 'DarkRed Production';
    // Warden settings.
    $config['warden.settings']['warden_token'] = getenv('WARDEN_TOKEN');
    break;

  case 'main':
    $settings['simple_environment_indicator'] = 'DarkBlue Stage';
    break;

  case 'ddev':
  case 'local':
  case 'lando':
    $settings['simple_environment_indicator'] = 'DarkGreen Local';
    // Skip file system permissions hardening.
    $settings['skip_permissions_hardening'] = TRUE;
    // Skip trusted host pattern.
    $settings['trusted_host_patterns'] = ['.*'];

    // Enable debug mode in local environment, disable caching.
    // @see https://www.drupal.org/node/2598914.
    $settings['container_yamls'][] = DRUPAL_ROOT . '/sites/development.services.yml';
    $config['system.performance']['css']['preprocess'] = FALSE;
    $config['system.performance']['js']['preprocess'] = FALSE;
    $settings['cache']['bins']['render'] = 'cache.backend.null';
    $settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
    $settings['cache']['bins']['page'] = 'cache.backend.null';
    $settings['extension_discovery_scan_tests'] = FALSE;

    // Override drupal/symfony_mailer default config to use Mailpit.
    if ($env === 'ddev') {
      $config['symfony_mailer.settings']['default_transport'] = 'sendmail';
      $config['symfony_mailer.mailer_transport.sendmail']['plugin'] = 'smtp';
      $config['symfony_mailer.mailer_transport.sendmail']['configuration']['user'] = '';
      $config['symfony_mailer.mailer_transport.sendmail']['configuration']['pass'] = '';
      $config['symfony_mailer.mailer_transport.sendmail']['configuration']['host'] = 'localhost';
      $config['symfony_mailer.mailer_transport.sendmail']['configuration']['port'] = '1025';
    }
    break;

  default:
    $settings['simple_environment_indicator'] = '#2F2942 Test';
    break;
}

// Local environment configuration overrides.
if (file_exists(DRUPAL_ROOT . '/sites/default/settings.local.php')) {
  include DRUPAL_ROOT . '/sites/default/settings.local.php';
}

// Silta cluster configuration overrides.
if (getenv('SILTA_CLUSTER') && file_exists(DRUPAL_ROOT . '/sites/default/settings.silta.php')) {
  include DRUPAL_ROOT . '/sites/default/settings.silta.php';
}
