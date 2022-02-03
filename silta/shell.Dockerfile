# Dockerfile for the Shell container.
FROM eu.gcr.io/silta-images/shell:php8.0-v0.1

COPY --chown=www-data:www-data . /app
