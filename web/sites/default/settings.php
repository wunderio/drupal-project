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
$settings['container_yamls'][] = $app_root . '/' . $site_path . '/services.yml';

/**
 * The default list of directories that will be ignored by Drupal's file API.
 *
 * By default ignore node_modules and bower_components folders to avoid issues
 * with common frontend tools and recursive scanning of directories looking for
 * extensions.
 *
 * @see file_scan_directory()
 * @see \Drupal\Core\Extension\ExtensionDiscovery::scanDirectory()
 */
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
    break;

  default:
    $settings['simple_environment_indicator'] = '#2F2942 Test';
    break;
}

/**
 * Load local development override configuration, if available.
 *
 * Use settings.local.php to override variables on secondary (staging,
 * development, etc) installations of this site. Typically used to disable
 * caching, JavaScript/CSS compression, re-routing of outgoing emails, and
 * other things that should not happen on development and testing sites.
 */
if (file_exists($app_root . '/' . $site_path . '/settings.local.php')) {
  include $app_root . '/' . $site_path . '/settings.local.php';
}

// Silta cluster configuration overrides.
if (getenv('SILTA_CLUSTER') && file_exists($app_root . '/' . $site_path . '/settings.silta.php')) {
  include $app_root . '/' . $site_path . '/settings.silta.php';
}
