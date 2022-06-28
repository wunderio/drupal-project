# Dockerfile for the Nginx container.
FROM eu.gcr.io/silta-images/nginx:latest

COPY . /app/web

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]

