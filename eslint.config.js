import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/storybook-static/',
      '**/*.min.js',
      '**/*.bundle.js',
    ],
  },
  js.configs.recommended,
  {
    // Parse as modules with JSX so themes' Storybook stories and Vite entries
    // work. Drupal behaviors in IIFEs parse fine as modules too.
    files: ['web/modules/custom/**/*.js', 'web/themes/custom/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        Drupal: 'readonly',
        drupalSettings: 'readonly',
        once: 'readonly',
        jQuery: 'readonly',
      },
    },
  },
  {
    // Build tool config files run in Node.
    files: ['**/*.config.js', '**/webpack/**/*.js', '**/.storybook/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  eslintPluginPrettierRecommended,
];
