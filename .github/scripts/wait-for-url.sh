#!/usr/bin/env bash
# Wait until a URL responds with HTTP 2xx/3xx.
#
# Usage: wait-for-url.sh <url> [attempts]
# Uses basic auth when TEST_HTTP_USER is set (TEST_HTTP_PASS optional).
set -euo pipefail

URL="$1"
ATTEMPTS="${2:-30}"

AUTH=()
if [ -n "${TEST_HTTP_USER:-}" ]; then
  AUTH=(-u "$TEST_HTTP_USER:${TEST_HTTP_PASS:-}")
fi

for i in $(seq 1 "$ATTEMPTS"); do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${AUTH[@]+"${AUTH[@]}"} "$URL" || true)
  if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 400 ]; then
    echo "$URL reachable (HTTP $HTTP_STATUS)."
    exit 0
  fi
  # The site is up but refuses access; retrying won't help.
  if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo "::error::$URL returned HTTP $HTTP_STATUS: basic auth rejected. Check the TEST_HTTP_USER / TEST_HTTP_PASS credentials."
    exit 1
  fi
  echo "Attempt $i/$ATTEMPTS: HTTP $HTTP_STATUS, retrying in 10s..."
  sleep 10
done

echo "::error::$URL not reachable."
exit 1
