<?php

/**
 * @file
 * Page related functions to support theming.
 */

/**
 * Implements hook_theme_suggestions_page_alter().
 */
function wunderful_theme_suggestions_page_alter(array &$suggestions, array $variables) {
  if ($node = \Drupal::routeMatch()->getParameter('node')) {
    // Add content type suggestions.
    $suggestions[] = 'page__node__' . $node->bundle();
  }
}

/**
 * Implements template_preprocess_page().
 */
function wunderful_theme_preprocess_page(&$variables) {
  $variables['site_name'] = \Drupal::config('system.site')->get('name');
}
