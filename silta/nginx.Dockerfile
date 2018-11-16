# Dockerfile for building nginx.
FROM wunderio/drupal-nginx:v0.1

COPY . /var/www/html/web

