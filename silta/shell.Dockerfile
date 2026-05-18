# Dockerfile for the Shell container.
FROM wunderio/silta-php-shell:php8.3-v1

COPY --chown=www-data:www-data . /app

# Patch upstream entrypoint: add chown for .ssh/ so OpenSSH reads the
# environment file for www-admin sessions.
RUN sed -i '/^exec \/usr\/sbin\/sshd/i chown -R www-admin:www-data /app/.ssh/ 2>/dev/null || true' /entrypoint.sh
