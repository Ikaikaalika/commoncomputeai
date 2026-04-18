import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import type { Env } from '../../types';
import { verifyKey } from '../../auth/apiKeys';
import { r2InputKey } from '../../r2/presign';
import { enqueueTask } from '../taskQueue';

export const chatRouter = new Hono<{ Bindings: Env }>();

// POST /v1/chat/completions — OpenAI-compatible, supports stream=true (SSE).
chatRouter.post('/completions', async (c) => {
  const apiKey = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{
    model?: string;
    messages: Array<{ role: string; content: string }>;
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
  }>();

  if (!body?.messages?.length) return c.json({ error: 'messages required' }, 400);

  const model = body.model ?? 'llama-3.1-8b';
  const doStream = body.stream ?? false;
  const idempotencyKey = c.req.header('Idempotency-Key') ?? undefined;

  // Models requiring >= 24 GB unified memory get min_vram_gb filter.
  const largeModels = ['llama-3.1-70b', 'llama-3.1-405b', 'qwen-2.5-72b'];
  const minVRAMGB = largeModels.includes(model) ? 48 : 16;

  if (minVRAMGB > 100) {
    return c.json({ error: 'Model requires cluster support (Phase 2)', code: 'cluster_required' }, 413);
  }

  const taskId = crypto.randomUUID();
  const r2Key = r2InputKey(taskId, 'messages.json');

  await c.env.ARTIFACTS.put(r2Key, JSON.stringify(body.messages), {
    httpMetadata: { contentType: 'application/json' },
  });

  await enqueueTask(c.env, {
    id: taskId,
    type: 'mlx_llm',
    requirements: { runtime: 'mlx_llm', min_vram_gb: minVRAMGB },
    priority: 'standard',
    input_uri: `r2://commoncompute-artifacts/${r2Key}`,
    customer_id: keyRecord.user_id,
    idempotency_key: idempotencyKey,
    metadata: { model, stream: doStream, max_tokens: body.max_tokens, temperature: body.temperature },
  });

  if (doStream) {
    // SSE streaming: poll for result and stream back OpenAI-format chunks.
    return stream(c, async (s) => {
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        const task = await c.env.DB.prepare(`SELECT state, result_uri FROM tasks WHERE id = ?`)
          .bind(taskId)
          .first<{ state: string; result_uri: string | null }>();

        if (task?.state === 'completed' && task.result_uri) {
          const obj = await c.env.ARTIFACTS.get(task.result_uri.replace(/^r2:\/\/[^/]+\//, ''));
          if (obj) {
            const result = await new Response(obj.body).json<{ choices: unknown[] }>();
            const chunk = JSON.stringify({ id: taskId, object: 'chat.completion.chunk', choices: result.choices });
            await s.write(`data: ${chunk}\n\n`);
            await s.write('data: [DONE]\n\n');
            return;
          }
        }
        if (task?.state === 'failed') {
          await s.write(`data: ${JSON.stringify({ error: 'Task failed' })}\n\n`);
          return;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      await s.write(`data: ${JSON.stringify({ error: 'Timeout' })}\n\n`);
    }, { headers: { 'Content-Type': 'text/event-stream' } });
  }

  // Non-streaming: poll up to 120s.
  const result = await pollUntilComplete(c.env, taskId, 120_000);
  if (!result) return c.json({ error: 'Timeout or task failed', id: taskId }, 202);

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
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}
