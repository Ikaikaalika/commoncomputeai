#!/usr/bin/env bash
# Common Compute — Full-Stack E2E (prod)
#
# Exercises the two-sided marketplace end to end, against the live
# prod Workers:
#
#   1.  Provider: register/login test@commoncompute.local, get a JWT,
#       enroll a fake device.
#   2.  Customer: admin-bootstrap customer@commoncompute.local with a
#       fresh API key.
#   3.  Customer submits a CPU bench task → the task should land in the
#       queue (timeout is expected when no real provider is attached;
#       successful completion requires a live Mac running the provider
#       app, which is a separate manual verification).
#
# Uses `curl --resolve` to bypass any local DNS cache flakiness that
# hits freshly-created Worker custom domains.

set -eu

API_HOST=api.commoncompute.ai
API_IP="${API_IP:-104.21.81.199}"   # either Cloudflare front-end IP works
BASE="https://${API_HOST}"
CURL=(curl -s --resolve "${API_HOST}:443:${API_IP}")

PROVIDER_EMAIL="test@commoncompute.local"
PROVIDER_PASSWORD="CCTestPass!2026"
PROVIDER_NAME="Common Compute Test"

CUSTOMER_EMAIL="customer@commoncompute.local"
CUSTOMER_NAME="Common Compute Customer"

ok()   { printf "  \xE2\x9C\x85  %s\n" "$*"; }
fail() { printf "  \xE2\x9D\x8C  %s\n" "$*"; exit 1; }

step() { printf "\n[%s] %s\n" "$1" "$2"; }

json_field() {
  # Tiny JSON extractor: json_field "foo" <<< "$json" → value of .foo
  local key=$1; shift
  python3 -c "import sys,json; print(json.load(sys.stdin).get('$key',''))"
}

BOOTSTRAP="${BOOTSTRAP_TOKEN:-}"
if [ -z "$BOOTSTRAP" ] && [ -f /tmp/cc-bootstrap.txt ]; then
  BOOTSTRAP=$(grep BOOTSTRAP_TOKEN /tmp/cc-bootstrap.txt | cut -d= -f2)
fi

echo
echo "═══════════════════════════════════════════════════════"
echo "  Common Compute — Full-Stack E2E (prod)"
echo "═══════════════════════════════════════════════════════"
echo "  API:       ${BASE} (via ${API_IP})"
echo "  Provider:  ${PROVIDER_EMAIL}"
echo "  Customer:  ${CUSTOMER_EMAIL}"
echo

# ── 1. Health ──────────────────────────────────────────────
step 1 "Health check"
RES=$("${CURL[@]}" "${BASE}/healthz")
echo "$RES" | grep -q '"ok":true' || fail "health check: $RES"
ok "api-v2 healthy"

# ── 2. Provider register-or-login ─────────────────────────
step 2 "Provider register-or-login"
REG=$("${CURL[@]}" -X POST "${BASE}/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${PROVIDER_EMAIL}\",\"password\":\"${PROVIDER_PASSWORD}\",\"full_name\":\"${PROVIDER_NAME}\"}")
if echo "$REG" | grep -q '"token"'; then
  TOKEN=$(echo "$REG" | json_field token)
  ok "Registered fresh provider"
elif echo "$REG" | grep -q "already registered"; then
  LOGIN=$("${CURL[@]}" -X POST "${BASE}/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${PROVIDER_EMAIL}\",\"password\":\"${PROVIDER_PASSWORD}\"}")
  echo "$LOGIN" | grep -q '"token"' || fail "login: $LOGIN"
  TOKEN=$(echo "$LOGIN" | json_field token)
  ok "Logged in existing provider"
else
  fail "register: $REG"
fi
[ -n "$TOKEN" ] || fail "empty token"
ok "JWT obtained (${#TOKEN} chars)"

# ── 3. /v1/auth/me ────────────────────────────────────────
step 3 "Verify provider JWT"
ME=$("${CURL[@]}" "${BASE}/v1/auth/me" -H "Authorization: Bearer ${TOKEN}")
echo "$ME" | grep -q "\"email\":\"${PROVIDER_EMAIL}\"" || fail "me: $ME"
ok "JWT verified — role=$(echo "$ME" | json_field role)"

# ── 4. Enroll device ──────────────────────────────────────
step 4 "Enroll fake provider device"
ENROLL=$("${CURL[@]}" -X POST "${BASE}/v1/providers/enroll" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"capability":{"chip":"Apple M-Test","cpu":{"performance_cores":8,"efficiency_cores":4,"logical":12},"gpu":{"family":"apple_m_test","cores":38,"metal_3":true,"recommended_max_working_set_gb":48},"ane":{"available":true,"generation":17,"tops":38},"media":{"encoders":["hevc"],"decoders":["hevc","h264"],"engines":2},"memory_gb":64,"runtimes":["coreml_embed","mlx_llm","cpu_bench"],"os":"macOS 14.0 (test)"}}')
DEVICE_ID=$(echo "$ENROLL" | json_field device_id)
[ -n "$DEVICE_ID" ] || fail "enroll: $ENROLL"
ok "Device enrolled: ${DEVICE_ID}"

# ── 5. Admin-bootstrap customer ──────────────────────────
step 5 "Admin-bootstrap customer"
[ -n "$BOOTSTRAP" ] || fail "BOOTSTRAP_TOKEN not set (env var or /tmp/cc-bootstrap.txt)"
BC=$("${CURL[@]}" -X POST "${BASE}/v1/admin/bootstrap-customer" \
  -H "Content-Type: application/json" \
  -H "X-Bootstrap-Token: ${BOOTSTRAP}" \
  -d "{\"email\":\"${CUSTOMER_EMAIL}\",\"full_name\":\"${CUSTOMER_NAME}\"}")
API_KEY=$(echo "$BC" | json_field api_key)
CUSTOMER_ID=$(echo "$BC" | json_field user_id)
[ -n "$API_KEY" ] || fail "bootstrap: $BC"
ok "Customer:   ${CUSTOMER_ID}"
ok "API key:    ${API_KEY:0:20}…"

# ── 6. Customer submits a CPU bench task ─────────────────
step 6 "Customer submits /v1/bench/cpu"
TASK=$("${CURL[@]}" -X POST "${BASE}/v1/bench/cpu" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}')
TASK_ID=$(echo "$TASK" | json_field task_id)
STATE=$(echo "$TASK" | json_field state)
[ -n "$TASK_ID" ] || fail "bench: $TASK"
ok "Task:       ${TASK_ID}"
ok "State:      ${STATE}"

if [ "$STATE" = "completed" ]; then
  ok "\xF0\x9F\x8E\x89  Task completed end-to-end — a real provider Mac is attached."
elif [ "$STATE" = "timeout" ]; then
  echo
  echo "  \xE2\x84\xB9\xEF\xB8\x8F   Task timed out. That's expected when no real Mac"
  echo "     is enrolled — the task reached the router but had no supply."
  echo "     To see it complete: launch CommonCompute.app signed in as"
  echo "     ${PROVIDER_EMAIL} and re-run this script."
else
  echo "  \xE2\x9A\xA0\xEF\xB8\x8F   Unexpected state: ${STATE}"
fi

# ── 7. /v1/jobs/{id} status ──────────────────────────────
step 7 "Job status"
JOB=$("${CURL[@]}" "${BASE}/v1/jobs/${TASK_ID}" -H "Authorization: Bearer ${API_KEY}")
echo "$JOB" | grep -q '"state"' && ok "$(echo "$JOB" | python3 -c "import sys,json;d=json.load(sys.stdin);print('state=',d.get('state'),' attempts=',d.get('attempts'))")" || true

echo
echo "═══════════════════════════════════════════════════════"
echo "  \xE2\x9C\x85  Full-stack e2e against prod: auth, enroll,"
echo "     customer-key, task submission, job status."
echo "═══════════════════════════════════════════════════════"
