#!/usr/bin/env bash
# Print "true" when screenshots taken before the deploy of a push can be kept
# as the new baseline, otherwise "false" (the reason goes to stderr).
#
# Not usable when:
# - the CircleCI deploy job already started: the screenshots may show this
#   push instead of the state before it;
# - the previous run failed: the environment still shows a change nobody
#   accepted (the result job records each outcome as artifact
#   <baseline-name>-passed / -failed).
#
# Usage: baseline-usable.sh <owner/repo> <sha> <deploy-job> <baseline-name>
# Requires: gh (authenticated via GH_TOKEN), jq.
set -euo pipefail

USAGE="Usage: baseline-usable.sh <owner/repo> <sha> <deploy-job> <baseline-name>"
REPO="${1:?$USAGE}"
SHA="${2:?$USAGE}"
DEPLOY_JOB="${3:?$USAGE}"
BASELINE_NAME="${4:?$USAGE}"
DIR=$(dirname "$0")

DEPLOY=$("$DIR/circleci-job-state.sh" "$REPO" "$SHA" "$DEPLOY_JOB")
if [ "$DEPLOY" != "missing" ] && [ "$DEPLOY" != "pending" ]; then
  echo "::notice::CircleCI job '$DEPLOY_JOB' is '$DEPLOY', so the screenshots may already show this push. The comparison uses the previous baseline." >&2
  echo "false"
  exit 0
fi

read -r FAILED_AT _ <<<"$("$DIR/latest-artifact.sh" "$REPO" "$BASELINE_NAME-failed")"
read -r PASSED_AT _ <<<"$("$DIR/latest-artifact.sh" "$REPO" "$BASELINE_NAME-passed")"
# ISO 8601 timestamps compare correctly as strings; no result yet counts as passed.
if [[ "${FAILED_AT:-}" > "${PASSED_AT:-}" ]]; then
  echo "::notice::The previous run failed, so the comparison uses the last kept baseline. To accept the current look, run this workflow with mode \"baseline\"." >&2
  echo "false"
  exit 0
fi

echo "true"
