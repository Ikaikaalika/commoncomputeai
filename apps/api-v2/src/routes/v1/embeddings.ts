import { Hono } from 'hono';
import type { Env } from '../../types';
import { verifyKey } from '../../auth/apiKeys';
import { r2InputKey } from '../../r2/presign';
import { enqueueTask } from '../taskQueue';

export const embeddingsRouter = new Hono<{ Bindings: Env }>();

// POST /v1/embeddings — OpenAI-compatible.
// Accepts: input (string | string[]), model, encoding_format.
embeddingsRouter.post('/', async (c) => {
  const apiKey = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    input: string | string[];
    model?: string;
    encoding_format?: string;
  }>();

  if (!body?.input) return c.json({ error: 'input required' }, 400);

  const inputs = Array.isArray(body.input) ? body.input : [body.input];
  const model = body.model ?? 'bge-small';
  const idempotencyKey = c.req.header('Idempotency-Key') ?? undefined;

  const taskId = crypto.randomUUID();
  const r2Key = r2InputKey(taskId, 'inputs.json');

  // Write inputs to R2.
  await c.env.ARTIFACTS.put(r2Key, JSON.stringify(inputs), {
    httpMetadata: { contentType: 'application/json' },
  });

  await enqueueTask(c.env, {
    id: taskId,
    type: 'coreml_embed',
    requirements: { runtime: 'coreml_embed', prefers_ane: true },
    priority: inputs.length > 256 ? 'batch' : 'standard',
    input_uri: `r2://commoncompute-artifacts/${r2Key}`,
    customer_id: keyRecord.user_id,
    idempotency_key: idempotencyKey,
    metadata: { model, count: inputs.length },
  });

  // For small batches, poll synchronously.
  if (inputs.length <= 256) {
    const result = await pollUntilComplete(c.env, taskId, 30_000);
    if (result) {
      const obj = await c.env.ARTIFACTS.get(result.replace(/^r2:\/\/[^/]+\//, ''));
      if (obj) {
        return new Response(obj.body, { headers: { 'Content-Type': 'application/json' } });
      }
    }
  }

  return c.json({ id: taskId, status: 'processing', count: inputs.length }, 202);
});

async function pollUntilComplete(env: Env, taskId: string, timeoutMs: number): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const task = await env.DB.prepare(`SELECT state, result_uri FROM tasks WHERE id = ?`)
      .bind(taskId)
      .first<{ state: string; result_uri: string | null }>();
    if (task?.state === 'completed' && task.result_uri) return task.result_uri;
    if (task?.state === 'failed' || task?.state === 'dead_letter') return null;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}
