import { Hono } from 'hono';
import type { Env } from '../../types';
import { verifyAuth } from '../../auth/verifyAuth';

export const providersRouter = new Hono<{ Bindings: Env }>();

// POST /v1/providers/enroll — Mac app first-run registration.
// Accepts either JWT (provider login) or API key (legacy).
providersRouter.post('/enroll', async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization') ?? '', c.env);
  if (!authResult) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ capability: unknown }>();
  if (!body?.capability) return c.json({ error: 'capability required' }, 400);

  const deviceId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO devices (id, user_id, capabilities, reliability, last_heartbeat_at, created_at)
     VALUES (?, ?, ?, 1.0, ?, ?)`
  )
    .bind(deviceId, authResult.user_id, JSON.stringify(body.capability), Date.now(), Date.now())
    .run();

  const reqURL = new URL(c.req.url);
  const wsProto = reqURL.protocol === 'http:' ? 'ws:' : 'wss:';
  const wsURL = `${wsProto}//${reqURL.host}/v1/providers/connect`;

  return c.json({ device_id: deviceId, ws_url: wsURL });
});

// GET /v1/providers/connect — WebSocket upgrade to DeviceSession DO.
providersRouter.get('/connect', async (c) => {
  const authResult = await verifyAuth(c.req.header('Authorization') ?? '', c.env);
  if (!authResult) return c.json({ error: 'Unauthorized' }, 401);
  return c.env.ROUTER.fetch(c.req.raw);
});
