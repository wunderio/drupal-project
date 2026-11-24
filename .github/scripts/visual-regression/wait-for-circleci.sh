#!/usr/bin/env bash
# Wait until the CircleCI workflow of a commit has finished successfully.
#
# CircleCI (GitHub App) reports the whole workflow as one check run named
# "commit". Deploy is its last job, so success means the commit is deployed.
# Only status and conclusion decide the result; the title is only printed.
#
# Usage: wait-for-circleci.sh <owner/repo> <sha> [timeout-seconds]
# Requires: gh (authenticated via GH_TOKEN).
set -euo pipefail

USAGE="Usage: wait-for-circleci.sh <owner/repo> <sha> [timeout-seconds]"
REPO="${1:?$USAGE}"
SHA="${2:?$USAGE}"
TIMEOUT="${3:-3600}"

DEADLINE=$((SECONDS + TIMEOUT))
while :; do
  IFS='|' read -r STATUS CONCLUSION TITLE < <(
    gh api "repos/$REPO/commits/$SHA/check-runs?check_name=commit" --jq '
      [.check_runs[] | select(.app.slug == "circleci-checks")]
      | sort_by(.started_at) | last // {}
      | "\(.status // "missing")|\(.conclusion // "-")|\(.output.title // "")"'
  )

  if [ "$STATUS" = "completed" ]; then
    if [ "$CONCLUSION" != "success" ]; then
      echo "::error::CircleCI finished with '$CONCLUSION', nothing was deployed, so nothing was compared. After a successful deploy, use \"Re-run failed jobs\"."
      exit 1
    fi
    echo "CircleCI finished."
    exit 0
  fi

  if [ "$SECONDS" -ge "$DEADLINE" ]; then
    echo "::error::CircleCI not finished after ${TIMEOUT}s (status: $STATUS). Deploy not approved in CircleCI? After it deploys, use \"Re-run failed jobs\"."
    exit 1
  fi

  echo "CircleCI status: $STATUS ($TITLE), checking again in 30s..."
  sleep 30
done
