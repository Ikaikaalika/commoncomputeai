import type { Env } from '../types';
import { verifyJWT } from './jwt';
import { verifyKey } from './apiKeys';

export async function verifyAuth(
  authHeader: string,
  env: Env
): Promise<{ user_id: string } | null> {
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  // JWT (provider app login)
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (payload) return { user_id: payload.sub };

  // API key (customer API access)
  const keyRecord = await verifyKey(token, env.DB, env.ARGON2_PEPPER);
  if (keyRecord) return { user_id: keyRecord.user_id };

  return null;
}
