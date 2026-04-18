import type { Env, ApiKey } from '../types';

// API key format: cc_live_<32 random chars> or cc_test_<32 random chars>
// The prefix (first 12 chars) is stored plaintext for display; the full key is argon2id-hashed.

export function generateKeyId(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildKeyString(env: 'live' | 'test'): { key: string; prefix: string } {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  const random = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  const key = `cc_${env}_${random}`;
  const prefix = key.slice(0, 12);
  return { key, prefix };
}

// Hash using HMAC-SHA256 as a fast substitute until argon2id WASM is bundled.
// TODO Phase M4 full: replace with argon2id WASM build.
export async function hashKey(key: string, pepper: string): Promise<string> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    'raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', material, enc.encode(key));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyKey(
  key: string,
  db: D1Database,
  pepper: string
): Promise<ApiKey | null> {
  if (!key.startsWith('cc_live_') && !key.startsWith('cc_test_')) return null;
  const prefix = key.slice(0, 12);

  const row = await db
    .prepare(`SELECT * FROM api_keys WHERE prefix = ? AND revoked_at IS NULL`)
    .bind(prefix)
    .first<{ id: string; user_id: string; prefix: string; hash: string; scopes: string; created_at: number; last_used_at?: number }>();

  if (!row) return null;

  const hash = await hashKey(key, pepper);
  if (hash !== row.hash) return null;

  // Update last_used_at.
  await db.prepare(`UPDATE api_keys SET last_used_at = ? WHERE id = ?`).bind(Date.now(), row.id).run();

  return { ...row, scopes: JSON.parse(row.scopes) };
}

export async function createKey(
  db: D1Database,
  pepper: string,
  userId: string,
  env: 'live' | 'test',
  scopes: string[]
): Promise<{ key: string; id: string; prefix: string }> {
  const { key, prefix } = buildKeyString(env);
  const id = generateKeyId();
  const hash = await hashKey(key, pepper);

  await db
    .prepare(
      `INSERT INTO api_keys (id, user_id, prefix, hash, scopes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, userId, prefix, hash, JSON.stringify(scopes), Date.now())
    .run();

  return { key, id, prefix };
}
