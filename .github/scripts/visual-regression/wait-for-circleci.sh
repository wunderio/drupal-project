#!/usr/bin/env bash
# Wait until the CircleCI workflow of a commit has finished successfully.
#
# CircleCI (GitHub App) reports the whole workflow as one check run named
# "commit". Deploy is its last job, so success means the commit is deployed.
# Afterwards <deploy-job> must read as "success", otherwise capture-baseline
# can no longer tell when a deploy starts (only a warning).
#
# Usage: wait-for-circleci.sh <owner/repo> <sha> <deploy-job> [timeout-seconds]
# Requires: gh (authenticated via GH_TOKEN).
set -euo pipefail

USAGE="Usage: wait-for-circleci.sh <owner/repo> <sha> <deploy-job> [timeout-seconds]"
REPO="${1:?$USAGE}"
SHA="${2:?$USAGE}"
DEPLOY_JOB="${3:?$USAGE}"
TIMEOUT="${4:-3600}"

DEADLINE=$((SECONDS + TIMEOUT))
while :; do
  read -r STATUS CONCLUSION < <(
    gh api "repos/$REPO/commits/$SHA/check-runs?check_name=commit" --jq '
      [.check_runs[] | select(.app.slug == "circleci-checks")]
      | sort_by(.started_at) | last // {}
      | "\(.status // "missing") \(.conclusion // "-")"'
  )

  if [ "$STATUS" = "completed" ]; then
    if [ "$CONCLUSION" != "success" ]; then
      echo "::error::CircleCI finished with '$CONCLUSION', nothing was deployed, so nothing was compared. After a successful deploy, use \"Re-run failed jobs\"."
      exit 1
    fi
    echo "CircleCI finished."
    break
  fi

  if [ "$SECONDS" -ge "$DEADLINE" ]; then
    echo "::error::CircleCI not finished after ${TIMEOUT}s (status: $STATUS). Deploy not approved in CircleCI? After it deploys, use \"Re-run failed jobs\"."
    exit 1
  fi

  echo "CircleCI status: $STATUS, checking again in 30s..."
  sleep 30
done

# "unknown" already wrote its own warning.
DEPLOY=$("$(dirname "$0")/circleci-job-state.sh" "$REPO" "$SHA" "$DEPLOY_JOB")
if [ "$DEPLOY" != "success" ] && [ "$DEPLOY" != "unknown" ]; then
  echo "::warning::CircleCI passed but job '$DEPLOY_JOB' is '$DEPLOY'. Check DEPLOY_JOB in visual-regression.yml."
fi
