import { Hono } from 'hono';
import type { Env } from './types';
import { requestLogger } from '@commoncompute/logger';

export { RouterShard } from './RouterShard';
export { DeviceSession } from './DeviceSession';

const app = new Hono<{ Bindings: Env; Variables: { log: any } }>();

// Structured JSON request logging → Cloudflare Logpush → Axiom.
app.use('*', (c, next) =>
  requestLogger({ service: 'router', environment: c.env.ENVIRONMENT ?? 'unknown' })(c, next)
);

// Health check
app.get('/healthz', (c) => c.json({ ok: true, service: 'router' }));

// Provider WebSocket connect — proxied to DeviceSession DO.
// The actual WebSocket upgrade is handled inside the DO.
app.get('/v1/providers/connect', async (c) => {
  const deviceId = c.req.header('X-Device-Id');
  if (!deviceId) return c.json({ error: 'X-Device-Id required' }, 400);

  const sessionId = c.env.DEVICE_SESSION.idFromName(deviceId);
  const session = c.env.DEVICE_SESSION.get(sessionId);
  return session.fetch(c.req.raw);
});

// Internal: enqueue a task into a RouterShard (called by api-v2).
app.post('/internal/tasks', async (c) => {
  const task = await c.req.json();
  if (!task?.type) return c.json({ error: 'task.type required' }, 400);

  const shardId = c.env.ROUTER_SHARD.idFromName(task.type);
  const shard = c.env.ROUTER_SHARD.get(shardId);
  const result = await shard.fetch('http://internal/enqueue', {
    method: 'POST',
    body: JSON.stringify(task),
    headers: { 'Content-Type': 'application/json' },
  });
  return new Response(result.body, { status: result.status });
});

// Internal: sweep expired leases across all task types (called by Cron trigger).
app.post('/internal/sweep', async (c) => {
  const taskTypes = ['whisper_ane', 'coreml_embed', 'coreml_vision', 'vt_transcode', 'mlx_llm', 'mlx_image', 'cpu_bench'];
  let total = 0;
  for (const type of taskTypes) {
    const shardId = c.env.ROUTER_SHARD.idFromName(type);
    const shard = c.env.ROUTER_SHARD.get(shardId);
    const res = await shard.fetch('http://internal/sweep');
    const data = await res.json<{ swept: number }>();
    total += data.swept;
  }
  return c.json({ swept: total });
});

export default app;
