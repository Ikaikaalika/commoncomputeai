import { Hono } from 'hono';
import type { Env } from '../../types';
import { verifyKey } from '../../auth/apiKeys';

export const providersRouter = new Hono<{ Bindings: Env }>();

// POST /v1/providers/enroll — Mac app first-run registration.
// Returns device_id + ws_url for the DeviceSession Durable Object.
providersRouter.post('/enroll', async (c) => {
  const authHeader = c.req.header('Authorization') ?? '';
  const apiKey = authHeader.replace(/^Bearer\s+/, '');

  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Invalid API key' }, 401);

  const body = await c.req.json<{ capability: unknown }>();
  if (!body?.capability) return c.json({ error: 'capability required' }, 400);

  const deviceId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO devices (id, user_id, capabilities, reliability, last_heartbeat_at, created_at)
     VALUES (?, ?, ?, 1.0, ?, ?)`
  )
    .bind(deviceId, keyRecord.user_id, JSON.stringify(body.capability), Date.now(), Date.now())
    .run();

  const wsBase = c.env.ENVIRONMENT === 'production'
    ? 'wss://router.commoncompute.ai'
    : 'wss://router-staging.commoncompute.ai';

  return c.json({
    device_id: deviceId,
    ws_url: `${wsBase}/v1/providers/connect`,
  });
});

// GET /v1/providers/connect — WebSocket upgrade to DeviceSession DO.
// Proxied through the router Worker.
providersRouter.get('/connect', async (c) => {
  const authHeader = c.req.header('Authorization') ?? '';
  const apiKey = authHeader.replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Invalid API key' }, 401);

  return c.env.ROUTER.fetch(c.req.raw);
});
