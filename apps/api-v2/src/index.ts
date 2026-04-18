import { Hono } from 'hono';
import type { Env } from './types';
import { audioRouter } from './routes/v1/audio';
import { embeddingsRouter } from './routes/v1/embeddings';
import { chatRouter } from './routes/v1/chat';
import { imagesRouter } from './routes/v1/images';
import { videoRouter } from './routes/v1/video';
import { jobsRouter } from './routes/v1/jobs';
import { providersRouter } from './routes/v1/providers';

const app = new Hono<{ Bindings: Env }>();

// Health
app.get('/healthz', (c) => c.json({ ok: true, service: 'api-v2' }));

// OpenAI-compatible v1 surface
app.route('/v1/audio', audioRouter);
app.route('/v1/embeddings', embeddingsRouter);
app.route('/v1/chat', chatRouter);
app.route('/v1/images', imagesRouter);
app.route('/v1/video', videoRouter);
app.route('/v1/jobs', jobsRouter);
app.route('/v1/providers', providersRouter);

// Cron: sweep expired leases (triggered by Cloudflare Cron via scheduled handler).
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await env.ROUTER.fetch('http://router/internal/sweep', { method: 'POST' });
  },
};
