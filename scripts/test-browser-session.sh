#!/usr/bin/env bash
set -euo pipefail
: "${PYTHON_REPO_PATH:?Set PYTHON_REPO_PATH to the checkout containing the consolidated Python PR}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
test_root="$(mktemp -d)"
fixture_pid=""
cleanup() {
  if [[ -n "$fixture_pid" ]]; then kill "$fixture_pid" 2>/dev/null || true; fi
  rm -rf "$test_root"
}
trap cleanup EXIT
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$test_root/key.pem" \
  -out "$test_root/cert.pem" -days 1 -subj /CN=localhost \
  -addext subjectAltName=DNS:localhost,IP:127.0.0.1 > "$test_root/cert.log" 2>&1
VITE_API_URL=https://localhost:8443 VITE_JAVA_API_URL=https://localhost:8443/java \
  VITE_AI_API_URL=https://localhost:8443/ai npm run build -- --outDir "$test_root/dist" > "$test_root/build.log" 2>&1 || {
    cat "$test_root/build.log"; exit 1;
  }
ENV=prod SECRET_KEY=synthetic-local-fixture-secret-not-for-production-123 \
  DATABASE_URL=sqlite:// CORS_ORIGINS=https://localhost:8443 \
  TDB_TEST_FRONTEND_DIST="$test_root/dist" PYTHONPATH="$PYTHON_REPO_PATH" \
  "$PYTHON_BIN" -m uvicorn browser_fixture:app --app-dir "$PYTHON_REPO_PATH/tests" \
  --host 127.0.0.1 --port 8443 --ssl-keyfile "$test_root/key.pem" \
  --ssl-certfile "$test_root/cert.pem" > "$test_root/server.log" 2>&1 &
fixture_pid=$!
for attempt in $(seq 1 30); do
  if curl --noproxy '*' -skf https://localhost:8443/admin/login > /dev/null; then break; fi
  if ! kill -0 "$fixture_pid" 2>/dev/null; then cat "$test_root/server.log"; exit 1; fi
  sleep 0.5
done
node tests/browser-session.e2e.mjs || { cat "$test_root/server.log"; exit 1; }
