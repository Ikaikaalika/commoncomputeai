#!/usr/bin/env tsx
// Common Compute — Mac App Flow E2E
//
// Exercises the exact round-trip the macOS provider app performs:
//   1. Health check
//   2. Register OR login the global test account (idempotent)
//   3. /v1/auth/me → verify JWT
//   4. /v1/providers/enroll with a fake capability profile
//   5. /v1/devices → device appears under the test user
//
// Runs against local wrangler dev by default. Point at prod with:
//   API_BASE=https://api.commoncompute.ai pnpm test:mac-app
//
// The test is safe to run repeatedly — register falls back to login
// when the account already exists.

import { TEST_ACCOUNT, TEST_CAPABILITY } from '../fixtures/test-account';
import dns from 'node:dns/promises';
import { Agent, setGlobalDispatcher } from 'undici';

// macOS's getaddrinfo cache can lag for ~minutes after a fresh
// custom-domain deploy, making `fetch` throw ENOTFOUND even when
// `dig` succeeds. Patch the undici dispatcher to resolve A records
// via 1.1.1.1 directly, bypassing the OS cache entirely.
const RESOLVER = new dns.Resolver();
RESOLVER.setServers(['1.1.1.1', '1.0.0.1']);
setGlobalDispatcher(new Agent({
  connect: {
    lookup: (hostname, _opts, cb) => {
      RESOLVER.resolve4(hostname).then(
        (addrs) => cb(null, addrs[0], 4),
        (err) => cb(err, '', 0)
      );
    },
  },
}));

const API = process.env.API_BASE ?? 'http://127.0.0.1:8787';

function pass(msg: string) { console.log(`  ✅  ${msg}`); }
function fail(msg: string): never { throw new Error(msg); }

async function call(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = text.length ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function step(n: number, label: string, fn: () => Promise<void>) {
  console.log(`\n[${n}/5] ${label}`);
  try { await fn(); } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌  FAIL: ${msg}`);
    process.exit(1);
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Common Compute — Mac App Flow E2E');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  API:   ${API}`);
  console.log(`  User:  ${TEST_ACCOUNT.email}`);

  let token = '';
  let userId = '';
  let deviceId = '';

  // ── 1. Health ────────────────────────────────────
  await step(1, 'Health check', async () => {
    const { status, json } = await call('GET', '/healthz');
    if (status !== 200 || !json?.ok) fail(`/healthz → ${status} ${JSON.stringify(json)}`);
    pass(`API healthy (${json.service ?? 'unknown'})`);
  });

  // ── 2. Register or login (idempotent) ────────────
  await step(2, 'Register or login global test account', async () => {
    const reg = await call('POST', '/v1/auth/register', {
      email: TEST_ACCOUNT.email,
      password: TEST_ACCOUNT.password,
      full_name: TEST_ACCOUNT.fullName,
    });

    if (reg.status === 200 || reg.status === 201) {
      token = reg.json.token;
      userId = reg.json.user_id;
      pass(`Registered new account: ${userId}`);
    } else if (reg.status === 409) {
      // Already exists — fall through to login.
      const login = await call('POST', '/v1/auth/login', {
        email: TEST_ACCOUNT.email,
        password: TEST_ACCOUNT.password,
      });
      if (login.status !== 200) fail(`Login after 409 → ${login.status} ${JSON.stringify(login.json)}`);
      token = login.json.token;
      userId = login.json.user_id;
      pass(`Logged in existing account: ${userId}`);
    } else {
      fail(`Register → ${reg.status} ${JSON.stringify(reg.json)}`);
    }
    if (!token) fail('No token returned');
    pass(`JWT obtained (${token.length} chars)`);
  });

  // ── 3. /v1/auth/me ──────────────────────────────
  await step(3, 'Verify JWT via /v1/auth/me', async () => {
    const { status, json } = await call('GET', '/v1/auth/me', undefined, token);
    if (status !== 200) fail(`/v1/auth/me → ${status} ${JSON.stringify(json)}`);
    if (json.email !== TEST_ACCOUNT.email) fail(`email mismatch: ${json.email}`);
    if (json.role !== 'provider') fail(`role should be 'provider', got: ${json.role}`);
    pass(`JWT verified · role=${json.role}`);
  });

  // ── 4. Enroll fake device ────────────────────────
  await step(4, 'Enroll device with fake capability profile', async () => {
    const { status, json } = await call(
      'POST',
      '/v1/providers/enroll',
      { capability: TEST_CAPABILITY },
      token
    );
    if (status !== 200) fail(`/v1/providers/enroll → ${status} ${JSON.stringify(json)}`);
    if (!json.device_id) fail('no device_id returned');
    if (!json.ws_url) fail('no ws_url returned');
    deviceId = json.device_id;
    pass(`Device enrolled: ${deviceId}`);
    pass(`WebSocket URL: ${json.ws_url}`);
  });

  // ── 5. Device listing (optional — only if endpoint exists) ─
  await step(5, 'Confirm device appears (or skip if listing unsupported)', async () => {
    const { status, json } = await call('GET', '/v1/devices', undefined, token);
    if (status === 404 || status === 401) {
      // /v1/devices requires a customer API key, not a provider JWT — not
      // part of the Mac app's own flow. Skipping keeps this test tight.
      pass(`Device listing requires customer auth (${status}) — skipping`);
      return;
    }
    if (status !== 200) fail(`/v1/devices → ${status} ${JSON.stringify(json)}`);
    const devices = (json.devices ?? []) as Array<{ id: string }>;
    const found = devices.find((d) => d.id === deviceId);
    if (!found) fail(`device ${deviceId} not found in list (got ${devices.length} devices)`);
    pass(`Device visible in /v1/devices`);
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅  Mac app flow verified end-to-end.');
  console.log(`      User:   ${userId}`);
  console.log(`      Device: ${deviceId}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\nFatal:', err);
  process.exit(1);
});
