#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# All state belongs to this run. Never accepts an existing database or production DSN.
mkdir -p artifacts
run=$(mktemp -d "$PWD/artifacts/fanbbs-client-e2e.XXXXXX")
api_pid=''
cleanup() {
  if [[ -n "$api_pid" ]]; then kill "$api_pid" 2>/dev/null || true; wait "$api_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT
python3 - <<'PY'
import socket
for port in [8080, 4173]:
    with socket.socket() as s:
        s.bind(('127.0.0.1',port))
PY
api_dir=${FANBBS_E2E_API_DIR:-"$PWD/../fanbbs"}
printf 'API commit: %s\n' "$(git -C "$api_dir" rev-parse HEAD)" | tee "$run/provenance.txt"
if [[ -n "${FANBBS_E2E_API_BIN:-}" ]]; then
  api_bin="$FANBBS_E2E_API_BIN"
else
  api_bin="$run/api"
  (cd "$api_dir" && "${GO:-go}" build -o "$api_bin" ./cmd/api)
fi
FANBBS_DATABASE_DRIVER=sqlite FANBBS_DATABASE_URL="$run/test.db" FANBBS_DB="$run/test.db" FANBBS_BLOB_DIR="$run/blobs" FANBBS_ADDR=127.0.0.1:8080 FANBBS_SEED_DEMO=true "$api_bin" > "$run/api.log" 2>&1 &
api_pid=$!
for i in $(seq 1 100); do
  if curl -fsS http://127.0.0.1:8080/api/v1/categories > /dev/null 2>&1; then break; fi
  if ! kill -0 "$api_pid" 2>/dev/null; then cat "$run/api.log"; exit 1; fi
  sleep .2
done
# Promote only the known seeded demo identity in the newly generated fixture.
python3 - "$run/test.db" <<'PY'
import sqlite3,sys
with sqlite3.connect(sys.argv[1]) as db:
    cursor=db.execute("UPDATE users SET role='moderator' WHERE id='usr_demo' AND handle='demo'")
    assert cursor.rowcount == 1
PY
if [[ "${1:-}" == "--api-contract" ]]; then
  FANBBS_E2E_REVIEW_FIXTURE=1 node --test test/live-api.test.js
  exit
fi
FANBBS_E2E_REVIEW_FIXTURE=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="${PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH:-/usr/bin/chromium}" npm run test:e2e -- "$@"
