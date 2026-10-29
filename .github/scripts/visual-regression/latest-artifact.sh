#!/usr/bin/env bash
# Print "<created_at> <run_id>" of the newest non-expired artifact with the
# given name, or nothing when there is none. Searches all pages.
#
# Usage: latest-artifact.sh <owner/repo> <artifact-name>
# Requires: gh (authenticated via GH_TOKEN), jq.
set -euo pipefail

REPO="${1:?Usage: latest-artifact.sh <owner/repo> <artifact-name>}"
NAME="${2:?Usage: latest-artifact.sh <owner/repo> <artifact-name>}"

gh api --paginate "repos/$REPO/actions/artifacts?name=$NAME&per_page=100" \
  | jq -rs '[.[].artifacts[] | select(.expired | not)] | max_by(.created_at)
      | if . then "\(.created_at) \(.workflow_run.id)" else empty end'
