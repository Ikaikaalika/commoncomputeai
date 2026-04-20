import { Hono } from 'hono';
import type { Env } from '../../types';
import { signJWT, verifyJWT } from '../../auth/jwt';
import { hashPassword, verifyPassword } from '../../auth/password';

export const authRouter = new Hono<{ Bindings: Env }>();

// POST /v1/auth/register
authRouter.post('/register', async (c) => {
  // Rate limit by IP: 5 / minute. Protects D1 from spray signups.
  // CF-Connecting-IP is set by Cloudflare's edge on every request.
  const log = (c as any).var?.log;
  if (c.env.RL_REGISTER) {
    const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('x-forwarded-for') ?? 'unknown';
    try {
      const res = await c.env.RL_REGISTER.limit({ key: ip });
      log?.info('auth.register.ratelimit', { ip, success: res.success });
      if (!res.success) {
        return c.json(
          { error: 'Too many sign-up attempts from this network. Try again in a minute.' },
          429
        );
      }
    } catch (err) {
      log?.warn('auth.register.ratelimit_error', {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    log?.warn('auth.register.ratelimit_missing', {});
  }

  const body = await c.req.json<{ email?: string; password?: string; full_name?: string }>();
  const { email, password, full_name } = body;
  if (!email || !password || !full_name) {
    return c.json({ error: 'email, password, and full_name are required' }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: 'password must be at least 8 characters' }, 400);
  }

  const normalEmail = email.trim().toLowerCase();
  const existing = await c.env.DB
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(normalEmail)
    .first<{ id: string }>();
  if (existing) return c.json({ error: 'Email already registered' }, 409);

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  await c.env.DB
    .prepare(
      `INSERT INTO users (id, email, full_name, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, 'provider', ?)`
    )
    .bind(userId, normalEmail, full_name.trim(), passwordHash, Date.now())
    .run();

  const token = await signJWT({ sub: userId, email: normalEmail, role: 'provider' }, c.env.JWT_SECRET);
  return c.json({
    token,
    user_id: userId,
    email: normalEmail,
    full_name: full_name.trim(),
    expires_in: 30 * 24 * 60 * 60,
  });
});

// POST /v1/auth/login
authRouter.post('/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>();
  const { email, password } = body;
  if (!email || !password) return c.json({ error: 'email and password are required' }, 400);

  const normalEmail = email.trim().toLowerCase();
  const user = await c.env.DB
    .prepare('SELECT id, email, full_name, password_hash, role FROM users WHERE email = ?')
    .bind(normalEmail)
    .first<{ id: string; email: string; full_name: string; password_hash: string; role: string }>();

  if (!user) return c.json({ error: 'Invalid email or password' }, 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return c.json({ error: 'Invalid email or password' }, 401);

  const token = await signJWT({ sub: user.id, email: user.email, role: user.role }, c.env.JWT_SECRET);
  return c.json({
    token,
    user_id: user.id,
    email: user.email,
    full_name: user.full_name,
    expires_in: 30 * 24 * 60 * 60,
  });
});

// GET /v1/auth/me
authRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  const user = await c.env.DB
    .prepare('SELECT id, email, full_name, role FROM users WHERE id = ?')
    .bind(payload.sub)
    .first<{ id: string; email: string; full_name: string; role: string }>();

  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ user_id: user.id, email: user.email, full_name: user.full_name, role: user.role });
});
