# Dockerfile for the Drupal container.
FROM wunderio/drupal-shell:v0.1

COPY --chown=www-data:www-data . /var/www/html
