import { Hono } from 'hono';
import type { Env } from '../../types';
import { verifyKey } from '../../auth/apiKeys';
import { r2InputKey } from '../../r2/presign';
import { enqueueTask } from '../taskQueue';

export const imagesRouter = new Hono<{ Bindings: Env }>();

// POST /v1/images/generations — OpenAI-compatible.
imagesRouter.post('/generations', async (c) => {
  const apiKey = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    prompt: string;
    model?: string;
    n?: number;
    size?: string;
  }>();
  if (!body?.prompt) return c.json({ error: 'prompt required' }, 400);

  const model = body.model ?? 'sdxl-base';
  const taskId = crypto.randomUUID();
  const r2Key = r2InputKey(taskId, 'params.json');

  await c.env.ARTIFACTS.put(r2Key, JSON.stringify(body), {
    httpMetadata: { contentType: 'application/json' },
  });

  await enqueueTask(c.env, {
    id: taskId,
    type: 'mlx_image',
    requirements: { runtime: 'mlx_image', min_vram_gb: 24 },
    priority: 'standard',
    input_uri: `r2://commoncompute-artifacts/${r2Key}`,
    customer_id: keyRecord.user_id,
    metadata: { model },
  });

  const result = await pollUntilComplete(c.env, taskId, 120_000);
  if (!result) return c.json({ id: taskId, status: 'processing' }, 202);

  return c.json({ created: Math.floor(Date.now() / 1000), data: [{ url: `/v1/jobs/${taskId}/result` }] });
});

// POST /v1/images/classifications — custom (no OpenAI equivalent).
imagesRouter.post('/classifications', async (c) => {
  const apiKey = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return c.json({ error: 'file required' }, 400);

  const taskId = crypto.randomUUID();
  const r2Key = r2InputKey(taskId, file.name || 'image.jpg');
  await c.env.ARTIFACTS.put(r2Key, file.stream(), { httpMetadata: { contentType: file.type } });

  await enqueueTask(c.env, {
    id: taskId,
    type: 'coreml_vision',
    requirements: { runtime: 'coreml_vision', prefers_ane: true },
    priority: 'standard',
    input_uri: `r2://commoncompute-artifacts/${r2Key}`,
    customer_id: keyRecord.user_id,
  });

  const result = await pollUntilComplete(c.env, taskId, 30_000);
  if (!result) return c.json({ id: taskId, status: 'processing' }, 202);

  const obj = await c.env.ARTIFACTS.get(result.replace(/^r2:\/\/[^/]+\//, ''));
  if (!obj) return c.json({ error: 'Result missing' }, 500);
  return new Response(obj.body, { headers: { 'Content-Type': 'application/json' } });
});

async function pollUntilComplete(env: Env, taskId: string, timeoutMs: number): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const task = await env.DB.prepare(`SELECT state, result_uri FROM tasks WHERE id = ?`)
      .bind(taskId)
      .first<{ state: string; result_uri: string | null }>();
    if (task?.state === 'completed' && task.result_uri) return task.result_uri;
    if (task?.state === 'failed' || task?.state === 'dead_letter') return null;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}
