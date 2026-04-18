import { Hono } from 'hono';
import type { Env } from '../../types';
import { verifyKey } from '../../auth/apiKeys';
import { r2InputKey } from '../../r2/presign';
import { enqueueTask } from '../taskQueue';

export const videoRouter = new Hono<{ Bindings: Env }>();

// POST /v1/video/transcode — custom endpoint.
// Accepts multipart: file (video), codec (h264|hevc|prores), bitrate_kbps, preset.
videoRouter.post('/transcode', async (c) => {
  const apiKey = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return c.json({ error: 'file required' }, 400);

  const codec = (formData.get('codec') as string) ?? 'hevc';
  const bitrateKbps = parseInt((formData.get('bitrate_kbps') as string) ?? '8000', 10);
  const preset = (formData.get('preset') as string) ?? 'medium';
  const idempotencyKey = c.req.header('Idempotency-Key') ?? undefined;

  const taskId = crypto.randomUUID();
  const r2Key = r2InputKey(taskId, file.name || 'input.mp4');
  await c.env.ARTIFACTS.put(r2Key, file.stream(), { httpMetadata: { contentType: file.type || 'video/mp4' } });

  await enqueueTask(c.env, {
    id: taskId,
    type: 'vt_transcode',
    requirements: { runtime: 'vt_transcode' },
    priority: 'standard',
    input_uri: `r2://commoncompute-artifacts/${r2Key}`,
    customer_id: keyRecord.user_id,
    idempotency_key: idempotencyKey,
    metadata: { codec, bitrate_kbps: bitrateKbps, preset },
  });

  const result = await pollUntilComplete(c.env, taskId, 300_000);
  if (!result) return c.json({ id: taskId, status: 'processing' }, 202);

  const obj = await c.env.ARTIFACTS.get(result.replace(/^r2:\/\/[^/]+\//, ''));
  if (!obj) return c.json({ error: 'Result missing' }, 500);
  return new Response(obj.body, {
    headers: { 'Content-Type': 'video/mp4', 'Content-Disposition': `attachment; filename="output.mp4"` },
  });
});

async function pollUntilComplete(env: Env, taskId: string, timeoutMs: number): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const task = await env.DB.prepare(`SELECT state, result_uri FROM tasks WHERE id = ?`)
      .bind(taskId)
      .first<{ state: string; result_uri: string | null }>();
    if (task?.state === 'completed' && task.result_uri) return task.result_uri;
    if (task?.state === 'failed' || task?.state === 'dead_letter') return null;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}
