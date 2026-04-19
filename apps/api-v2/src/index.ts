import { Hono } from 'hono';
import type { Env } from './types';
import { audioRouter } from './routes/v1/audio';
import { embeddingsRouter } from './routes/v1/embeddings';
import { chatRouter } from './routes/v1/chat';
import { imagesRouter } from './routes/v1/images';
import { videoRouter } from './routes/v1/video';
import { jobsRouter } from './routes/v1/jobs';
import { providersRouter } from './routes/v1/providers';
import { benchRouter } from './routes/v1/bench';
import { authRouter } from './routes/v1/auth';
import { diagRouter } from './routes/v1/diag';
import { verifyKey } from './auth/apiKeys';
import { requestLogger } from '@commoncompute/logger';

const app = new Hono<{ Bindings: Env; Variables: { log: any } }>();

// Structured JSON request logging → Cloudflare Logpush → Axiom.
app.use('*', (c, next) =>
  requestLogger({ service: 'api-v2', environment: c.env.ENVIRONMENT ?? 'unknown' })(c, next)
);

// Health
app.get('/healthz', (c) => c.json({ ok: true, service: 'api-v2' }));

// Provider auth (login, register, me)
app.route('/v1/auth', authRouter);

// OpenAI-compatible v1 surface
app.route('/v1/audio', audioRouter);
app.route('/v1/embeddings', embeddingsRouter);
app.route('/v1/chat', chatRouter);
app.route('/v1/images', imagesRouter);
app.route('/v1/video', videoRouter);
app.route('/v1/jobs', jobsRouter);
app.route('/v1/providers', providersRouter);

// Hardware bench (e2e testing)
app.route('/v1/bench', benchRouter);

// Crash + metric diagnostics from the Mac app (MetricKit payloads)
app.route('/v1/diag', diagRouter);

// Active devices — for test health checks (requires API key)
app.get('/v1/devices', async (c) => {
  const authHeader = c.req.header('Authorization') ?? '';
  const apiKey = authHeader.replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const cutoff = Date.now() - 30_000; // 30 s dead threshold
  const rows = await c.env.DB.prepare(
    `SELECT id, capabilities, reliability, last_heartbeat_at
     FROM devices WHERE last_heartbeat_at > ? AND user_id = ?`
  )
    .bind(cutoff, keyRecord.user_id)
    .all<{ id: string; capabilities: string; reliability: number; last_heartbeat_at: number }>();

  return c.json({
    devices: rows.results.map((d) => ({
      id: d.id,
      capabilities: JSON.parse(d.capabilities),
      reliability: d.reliability,
      last_heartbeat_ms_ago: Date.now() - d.last_heartbeat_at,
    })),
  });
});

// Cron: sweep expired leases (triggered by Cloudflare Cron via scheduled handler).
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await env.ROUTER.fetch('http://router/internal/sweep', { method: 'POST' });
  },
};
