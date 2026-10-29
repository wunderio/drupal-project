#!/usr/bin/env bash
# Print the SHA of a commit pushed to <branch> after <sha> whose CircleCI
# deploy job has started, or nothing when there is none.
#
# The environment is shared between pushes, so once a newer push starts
# deploying, screenshots may show that push instead of <sha>.
#
# Usage: newer-deploy.sh <owner/repo> <sha> <branch> <deploy-job>
# Requires: gh (authenticated via GH_TOKEN).
set -euo pipefail

USAGE="Usage: newer-deploy.sh <owner/repo> <sha> <branch> <deploy-job>"
REPO="${1:?$USAGE}"
SHA="${2:?$USAGE}"
BRANCH="${3:?$USAGE}"
DEPLOY_JOB="${4:?$USAGE}"

for NEWER in $(gh api "repos/$REPO/compare/$SHA...$BRANCH" --jq '.commits[].sha'); do
  DEPLOY=$("$(dirname "$0")/circleci-job-state.sh" "$REPO" "$NEWER" "$DEPLOY_JOB")
  if [ "$DEPLOY" != "missing" ] && [ "$DEPLOY" != "pending" ]; then
    echo "::warning::Newer commit $NEWER started deploying (status: $DEPLOY) during the comparison, its own run compares instead." >&2
    echo "$NEWER"
    exit 0
  fi
done
