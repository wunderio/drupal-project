#ddev-generated

ARG KIBANA_VERSION

FROM kibana:$KIBANA_VERSION

USER root

# installed jq for parse json curl response
RUN apt-get update
RUN apt-get -y install jq

# copy healthcheck.sh to container
RUN mkdir -p /tmp
COPY healthcheck.sh /tmp/healthcheck.sh
RUN chmod +x /tmp/healthcheck.sh

USER kibana