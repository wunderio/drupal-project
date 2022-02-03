# Dockerfile for the PHP container.
FROM eu.gcr.io/silta-images/php:8.0-fpm-v0.1

COPY --chown=www-data:www-data . /app
