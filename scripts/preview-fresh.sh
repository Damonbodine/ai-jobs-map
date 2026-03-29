#!/bin/zsh
set -euo pipefail

PORT="${1:-3050}"

# Stop any existing production preview on this port so the new build and the
# running server always point at the same .next output.
if lsof -tiTCP:"$PORT" >/dev/null 2>&1; then
  lsof -tiTCP:"$PORT" | xargs kill
  sleep 1
fi

npm run build
exec ./node_modules/.bin/next start -p "$PORT"
