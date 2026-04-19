#!/usr/bin/env tsx
// Seed the local wrangler dev D1 with everything needed for testing:
//   1. The global email/password test account (via /v1/auth/register),
//      usable from the Mac app's Sign-in screen.
//   2. A customer API key for the legacy inference flow, saved to
//      .local-test-key so `pnpm e2e` picks it up automatically.
//
// Both paths are idempotent: re-running the script leaves the DB in
// the same state and just prints the current credentials.
//
// Usage: pnpm seed:local
//
// Prereqs:
//   - pnpm migrate:local            (apply D1 migrations)
//   - wrangler dev running on :8787 for api-v2 (for the register call)
//   - wrangler dev running on :8788 for router (for provider websocket)
//
// Prints the API key and reminds the user of the email/password.

import { execSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { TEST_ACCOUNT } from '../tests/fixtures/test-account';

const PEPPER = 'cc_local_dev_pepper_not_for_production';
const API_BASE = process.env.API_BASE ?? 'http://127.0.0.1:8787';

function buildKey(env: 'test'): { key: string; prefix: string } {
  const random = randomBytes(24).toString('hex');
  const key = `cc_${env}_${random}`;
  return { key, prefix: key.slice(0, 12) };
}

function hashKey(key: string, pepper: string): string {
  return createHmac('sha256', pepper).update(key).digest('hex');
}

function d1(sql: string) {
  const { writeFileSync, unlinkSync } = require('node:fs');
  const { join } = require('node:path');
  const tmp = join(require('node:os').tmpdir(), `cc_seed_${Date.now()}.sql`);
  writeFileSync(tmp, sql, 'utf8');
  try {
    execSync(
      `npx wrangler d1 execute commoncompute --local --file=${tmp}`,
      { cwd: new URL('../apps/router', import.meta.url).pathname, stdio: 'inherit' }
    );
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
}

// Ensure the email/password account exists via the real API so the
// password hash is computed the same way production login expects it.
// Treats 409 (already exists) as success.
async function ensureTestAccount(): Promise<void> {
  console.log(`\n🔐  Ensuring test account exists at ${API_BASE}...`);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_ACCOUNT.email,
        password: TEST_ACCOUNT.password,
        full_name: TEST_ACCOUNT.fullName,
      }),
    });
  } catch (err) {
    console.warn(`   ⚠️  ${API_BASE} unreachable — start api-v2 with \`pnpm dev:api-v2\` then re-run.`);
    console.warn(`       (Skipping account creation for now.)`);
    return;
  }
  if (res.status === 200 || res.status === 201) {
    console.log('   ✅  Registered fresh.');
  } else if (res.status === 409) {
    console.log('   ✅  Already exists.');
  } else {
    const text = await res.text();
    throw new Error(`register → ${res.status}: ${text}`);
  }
}

async function seedCustomerApiKey(): Promise<string> {
  const userId = randomBytes(16).toString('hex');
  const { key, prefix } = buildKey('test');
  const keyId = randomBytes(16).toString('hex');
  const hash = hashKey(key, PEPPER);
  const now = Date.now();
  const scopes = JSON.stringify(['inference', 'provider']);

  d1(
    `INSERT OR IGNORE INTO users (id, email, password_hash, role, created_at)
     VALUES ('${userId}', 'customer@local.dev', 'not_used', 'customer', ${now});`
  );
  d1(
    `INSERT OR IGNORE INTO api_keys (id, user_id, prefix, hash, scopes, created_at)
     VALUES ('${keyId}', '${userId}', '${prefix}', '${hash}', '${scopes}', ${now});`
  );

  const fs = await import('node:fs/promises');
  await fs.writeFile(
    new URL('../.local-test-key', import.meta.url).pathname,
    key,
    'utf8'
  );
  return key;
}

async function main() {
  console.log('\n🌱  Seeding local D1 database...');

  await ensureTestAccount();

  console.log('\n🗝   Issuing customer API key for legacy e2e...');
  const apiKey = await seedCustomerApiKey();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  GLOBAL TEST ACCOUNT (Mac app sign-in)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Email:    ${TEST_ACCOUNT.email}`);
  console.log(`  Password: ${TEST_ACCOUNT.password}`);
  console.log(`  Name:     ${TEST_ACCOUNT.fullName}`);
  console.log();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CUSTOMER API KEY (legacy inference tests)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ${apiKey}`);
  console.log();
  console.log('  Saved to .local-test-key · used by `pnpm e2e`.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log();
  console.log('  Next:');
  console.log('    pnpm test:mac-app   # hits /v1/auth + /v1/providers/enroll');
  console.log('    pnpm e2e            # legacy workload test (requires live Mac provider)');
  console.log();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
