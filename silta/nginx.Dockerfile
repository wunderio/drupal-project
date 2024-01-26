# Dockerfile for the Nginx container.
# Test 1.
FROM wunderio/silta-nginx:1.17-v1

COPY . /app/web
