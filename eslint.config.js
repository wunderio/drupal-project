import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  {
    ignores: ['**/node_modules/', '**/dist/', '**/*.min.js', '**/*.bundle.js'],
  },
  js.configs.recommended,
  {
    // Drupal libraries are classic browser scripts, not modules.
    files: ['web/modules/custom/**/*.js', 'web/themes/custom/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        Drupal: 'readonly',
        drupalSettings: 'readonly',
        once: 'readonly',
        jQuery: 'readonly',
      },
    },
  },
  eslintPluginPrettierRecommended,
];
