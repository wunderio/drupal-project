# Dockerfile for the Drupal container.
FROM wunderio/drupal-php-fpm:v0.1

COPY --chown=www-data:www-data . /var/www/html

