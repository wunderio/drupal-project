# Drupal 10 theme

A Drupal theme based on single directory components (SDC).

### Getting started

1. Copy the theme files into `PROJECT_ROOT/web/themes/custom/`
2. Add Drupal dependencies:
```
composer require drupal/sdc drupal/storybook drupal/twig_field_value drupal/twig_tweak
drush en sdc storybook twig_field_value twig_tweak -y
```

3. Make it the main theme:
```
drush then THEME_NAME -y && drush config-set system.theme default THEME_NAME -y
```

4. Navigate to the theme directory and install node dependencies:
```
npm install
```

5. Start watching for files and start up Storybook:
```
npm run develop
```

6. The stories written in Twig needs to be generated to JSON files for Storybook. To do this and watch new changes in the stories, you might need to enter the ddev/lando container. Run
```
watch --color drush storybook:generate-all-stories
```
- If you want only to compile the JSON files without watching, run `drush strorybook:generate-all-stories`.
- TODO: Include this into the theme build and run processes.


### Silta setup

1. Add a Silta configuration file `PROJECT_ROOT/silta/silta-storybook.yml`:

```yaml

projectName: 'Wunder project'

nginx:
  basicauth:
    enabled: true
    credentials:
      username: wunder
      password: set-password-here
  noauthips:
    wunder-vpn: 11.11.11.11/32 # Get and set IPs from Intra or other project repos
```

2. Then add a build step to CircleCI's config in `PROJECT_ROOT/.circleci/config.yml`:

```yaml

      # Storybook deployment to development cluster.
      - silta/simple-build-deploy: &build-deploy
          name: Storybook build & deploy
          context: silta_dev
          silta_config: silta/silta-storybook.yml
          release-suffix: storybook
          codebase-build:
            - silta/npm-install-build:
                build-command: npm run build && npm run build-storybook
                path: web/themes/custom/drupal-theme
          build_folder: web/themes/custom/drupal-theme/storybook-static
          filters:
            branches:
              ignore: production
```
