import { Hono } from 'hono';
import type { Env } from '../../types';
import { verifyKey } from '../../auth/apiKeys';
import { r2InputKey, signR2PutToken } from '../../r2/presign';
import { enqueueTask } from '../taskQueue';

export const audioRouter = new Hono<{ Bindings: Env }>();

// POST /v1/audio/transcriptions — OpenAI-compatible multipart upload.
// Accepts: file (audio), model, language, response_format, temperature.
audioRouter.post('/transcriptions', async (c) => {
  const apiKey = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const model = (formData.get('model') as string) ?? 'whisper-large-v3';
  const language = (formData.get('language') as string) ?? undefined;
  const idempotencyKey = c.req.header('Idempotency-Key') ?? undefined;

  if (!file) return c.json({ error: 'file required' }, 400);

  const taskId = crypto.randomUUID();
  const r2Key = r2InputKey(taskId, file.name || 'audio.mp3');

  // Upload file to R2.
  await c.env.ARTIFACTS.put(r2Key, file.stream(), {
    httpMetadata: { contentType: file.type || 'audio/mpeg' },
  });

  // Enqueue Whisper ANE task.
  const task = await enqueueTask(c.env, {
    id: taskId,
    type: 'whisper_ane',
    requirements: { runtime: 'whisper_ane', prefers_ane: true },
    priority: 'standard',
    input_uri: `r2://commoncompute-artifacts/${r2Key}`,
    customer_id: keyRecord.user_id,
    idempotency_key: idempotencyKey,
    metadata: { model, language },
  });

  // OpenAI-compatible response: return job ID for async polling,
  // or block until complete for small files (< 10 MB).
  if (file.size < 10 * 1024 * 1024) {
    // For small files, poll up to 60s synchronously.
    const result = await pollUntilComplete(c.env, taskId, 60_000);
    if (result) {
      const obj = await c.env.ARTIFACTS.get(result.replace(/^r2:\/\/[^/]+\//, ''));
      if (obj) {
        const json = await new Response(obj.body).json<{ text: string }>();
        return c.json({ text: json.text ?? '' });
      }
    }
  }

  return c.json({ id: taskId, status: 'processing' }, 202);
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
