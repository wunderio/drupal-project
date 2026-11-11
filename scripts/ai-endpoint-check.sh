#!/usr/bin/env bash
# Checks an OpenAI-compatible API (e.g. MIRAI / Open WebUI) and prints the
# curl exit code, HTTP status and start of each response. The key is never printed.
#
# Usage:
#   export OPENAI_API_URL="https://<host>/api"
#   read -rs OPENAI_API_KEY && export OPENAI_API_KEY
#   ./scripts/ai-endpoint-check.sh [MODEL_ID]

if [ -z "${OPENAI_API_URL:-}" ] || [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "Set OPENAI_API_URL and OPENAI_API_KEY first (see the comments in $0)." >&2
  exit 1
fi

BASE="${OPENAI_API_URL%/}"
MODEL="${1:-}"

check() {
  local method=$1 path=$2 data=$3 body info rc
  body=$(mktemp)
  local args=(-s --max-time 60 -o "$body" -w '%{http_code} | %{content_type} | %{redirect_url}'
    -X "$method" -H "Authorization: Bearer ${OPENAI_API_KEY}" -H "Content-Type: application/json")
  [ -n "$data" ] && args+=(-d "$data")
  info=$(curl "${args[@]}" "$BASE$path"); rc=$?
  echo "== $method $BASE$path"
  echo "curl exit: $rc | HTTP code | content type | redirect: $info"
  if [ "$path" = /models ] && [ "${info%% *}" = 200 ]; then
    echo "Model IDs:"
    python3 -c 'import json,sys; [print("  " + m["id"]) for m in json.load(open(sys.argv[1]))["data"]]' "$body" 2>/dev/null \
      || grep -o '"id": *"[^"]*"' "$body" | sed 's/.*"\([^"]*\)"$/  \1/' | sort -u
  else
    head -c 400 "$body"
  fi
  echo; echo
  rm -f "$body"
}

check GET /models
if [ -z "$MODEL" ]; then
  echo "Pass one of the model IDs above to also send a test prompt: $0 MODEL_ID"
  exit 0
fi
check POST /chat/completions "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hello in one sentence.\"}]}"
