#!/usr/bin/env bash
# Print the state of one CircleCI job of a commit.
#
# CircleCI (GitHub App) reports the whole workflow as one check run named
# "commit". Its summary lists each job and its state, either as a list
# ("* [deploy](url) - Success", "* deploy - Blocked") or as a table
# ("| ✅ Success | [deploy](url) | 5m |", "| ○ Blocked | deploy | - |").
# Jobs that have not started have no link.
#
# Prints one of:
#   missing  no CircleCI workflow for the commit yet
#   pending  job not started (blocked, queued, on hold)
#   running | success | failed
#   unknown  job or state not found in the summary, most likely because
#            CircleCI changed the summary format; a warning is written so
#            it does not go unnoticed.
#
# Usage: circleci-job-state.sh <owner/repo> <sha> <job>
# Requires: gh (authenticated via GH_TOKEN).
set -euo pipefail

REPO="${1:?Usage: circleci-job-state.sh <owner/repo> <sha> <job>}"
SHA="${2:?Usage: circleci-job-state.sh <owner/repo> <sha> <job>}"
JOB="${3:?Usage: circleci-job-state.sh <owner/repo> <sha> <job>}"

SUMMARY=$(
  gh api "repos/$REPO/commits/$SHA/check-runs?check_name=commit" --jq '
    [.check_runs[] | select(.app.slug == "circleci-checks")]
    | if length == 0 then "MISSING" else (sort_by(.started_at) | last | .output.summary // "") end'
)

if [ "$SUMMARY" = "MISSING" ]; then
  echo "missing"
  exit 0
fi

# The job's line, without link targets so URLs can't match a state word.
LINE=$(grep -F -e "[$JOB]" -e "* $JOB -" -e "| $JOB |" <<<"$SUMMARY" | head -n 1 | sed 's/([^)]*)//g' || true)
WORD=$(grep -o -i -E 'not running|not run|on hold|blocked|queued|running|success|failed|cancell?ed|skipped|error' <<<"$LINE" | head -n 1 | tr '[:upper:]' '[:lower:]' || true)

case "$WORD" in
  "not running" | "not run" | "on hold" | blocked | queued) echo "pending" ;;
  running) echo "running" ;;
  success) echo "success" ;;
  failed | canceled | cancelled | skipped | error) echo "failed" ;;
  *)
    MESSAGE="Could not read the state of CircleCI job '$JOB' for $SHA. Either the job name is wrong or CircleCI changed its check run summary format; update .github/scripts/visual-regression/circleci-job-state.sh. Until then the pre-deploy baseline check can't tell when the deploy starts."
    echo "::warning::$MESSAGE" >&2
    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
      printf '⚠️ %s\n\n<details><summary>CircleCI check run summary</summary>\n\n%s\n\n</details>\n' \
        "$MESSAGE" "${SUMMARY:-(empty)}" >>"$GITHUB_STEP_SUMMARY"
    fi
    echo "unknown"
    ;;
esac
