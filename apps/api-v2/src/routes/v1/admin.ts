import { Hono } from 'hono';
import type { Env } from '../../types';
import { createKey } from '../../auth/apiKeys';
import { hashPassword } from '../../auth/password';

// Alpha-only admin endpoints gated by a secret bootstrap token.
// Intended for one-off operations during alpha rollout — creating
// customer accounts with credits, minting API keys out-of-band. Remove
// the BOOTSTRAP_TOKEN secret to disable the whole router.
//
// All endpoints here require `X-Bootstrap-Token` header matching
// env.BOOTSTRAP_TOKEN. Missing or wrong → 404 so the endpoints are
// invisible to probers.

export const adminRouter = new Hono<{ Bindings: Env; Variables: { log: any } }>();

adminRouter.use('*', async (c, next) => {
  const token = c.req.header('X-Bootstrap-Token');
  if (!token || !c.env.BOOTSTRAP_TOKEN || token !== c.env.BOOTSTRAP_TOKEN) {
    return c.notFound();
  }
  await next();
});

/**
 * POST /v1/admin/bootstrap-customer
 * Body: { email, password?, full_name, credit_cents?: number }
 *
 * Creates (or reuses) a customer user and mints a fresh test API key
 * for them. Idempotent on email: if the user already exists, the
 * existing user_id is reused and a NEW key is appended (old keys stay
 * valid unless you explicitly revoke them).
 */
adminRouter.post('/bootstrap-customer', async (c) => {
  const body = await c.req.json<{
    email?: string;
    password?: string;
    full_name?: string;
    credit_cents?: number;
  }>();
  const email = (body.email ?? '').trim().toLowerCase();
  const fullName = (body.full_name ?? 'Customer').trim();
  if (!email) return c.json({ error: 'email required' }, 400);

  // Upsert user (customer).
  let user = await c.env.DB
    .prepare('SELECT id, email, role FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; email: string; role: string }>();

  if (!user) {
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(body.password ?? crypto.randomUUID());
    await c.env.DB
      .prepare(
        `INSERT INTO users (id, email, full_name, password_hash, role, created_at)
         VALUES (?, ?, ?, ?, 'customer', ?)`
      )
      .bind(userId, email, fullName, passwordHash, Date.now())
      .run();
    user = { id: userId, email, role: 'customer' };
  }

  // Mint a fresh test API key with inference + provider scopes.
  const { key, prefix } = await createKey(
    c.env.DB,
    c.env.ARGON2_PEPPER,
    user.id,
    'test',
    ['inference', 'provider']
  );

  c.var.log?.info('admin.bootstrap_customer', {
    user_id: user.id, email, prefix,
  });

  return c.json({
    user_id: user.id,
    email,
    role: user.role,
    api_key: key,
    prefix,
  });
});
