#!/usr/bin/sh
#ddev-generated

#######################################
# Check green status
# Arguments:
#   status name
# Returns:
#   0 if thing was correct status, non-zero on error.
#######################################
checkGreenStatus()
{
    if [ "$status" = "green" ]; then
        printf "%s is green \n" "$1";
    else
        printf "%s is not green, status is %2\n" "$1" "$status";
        exit 1;
    fi
}

#######################################
# Check available status
# Arguments:
#   status name
# Returns:
#   0 if thing was correct status, non-zero on error.
#######################################
checkAvailableStatus()
{
  if [ "$status" = "available" ]; then
        printf "All plugins are %s \n" "$1";
    else
        printf "%s is not available, status is %2 \n" "$1" "$status";
        exit 1;
    fi
}

#######################################
# Set globally status from curl response
# Arguments:
#   address, json dot notation to check status
# Returns:
#   non-zero on error.
#######################################
setStatusFromAddress()
{
  status=$(curl -s --location "$1" --header 'Content-Type: application/json' | jq --raw-output "$2");
}

#######################################
# Check version of elastic search
# Arguments:
#   -
# Returns:
#   void
#######################################
checkVersion()
{
  case ${KIBANA_VERSION} in
    7.*|8.0.0)
      setStatusFromAddress "http://elasticsearch:9200/_cluster/health" ".status";
      checkGreenStatus "elastic";

      setStatusFromAddress "http://kibana:5601/api/status" ".status.overall.state";
      checkGreenStatus 'kibana';
      ;;
    8.*|9.0.0)
      setStatusFromAddress "http://elasticsearch:9200/_cluster/health" ".status";
      checkGreenStatus "elastic";

      setStatusFromAddress "http://kibana:5601/api/status" ".status.overall.level";
      checkAvailableStatus 'available';
      ;;
  esac
}

#######################################
# Main
#######################################
printf "HealthCheck \n" 3>&1;

if command -v curl >/dev/null 2>&1 && command -v jq >/dev/null 2>&1
  then
    printf "Check Status for kibana: \n" 3>&1;
    checkVersion;

    exit 0;
else
    printf "Not found curl and/or jq \n" 3>&1;
    exit 1;
fi

exit 0;