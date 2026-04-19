// POST /v1/bench/:engine — lightweight hardware-verification tasks for e2e testing.
// Supported engines: cpu, gpu, ane
// Each creates a task of the corresponding bench type and polls synchronously.

import { Hono } from 'hono';
import { verifyKey } from '../../auth/apiKeys';
import { enqueueTask } from '../taskQueue';
import type { Env } from '../../types';

export const benchRouter = new Hono<{ Bindings: Env }>();

const BENCH_TYPES: Record<string, { taskType: string; engine: string }> = {
  cpu: { taskType: 'cpu_bench', engine: 'cpu' },
  gpu: { taskType: 'mlx_llm',   engine: 'gpu' },
  ane: { taskType: 'coreml_embed', engine: 'ane' },
};

benchRouter.post('/:engine', async (c) => {
  const engine = c.req.param('engine');
  const bench = BENCH_TYPES[engine];
  if (!bench) {
    return c.json({ error: `Unknown engine: ${engine}. Use cpu, gpu, or ane.` }, 400);
  }

  const authHeader = c.req.header('Authorization') ?? '';
  const apiKey = authHeader.replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ iterations?: number }>().catch(() => ({}));
  const taskId = crypto.randomUUID();

  const requirements: Record<string, unknown> = { runtime: bench.taskType };
  if (engine === 'ane') requirements.prefers_ane = true;
  if (engine === 'gpu') {
    // Minimal GPU bench: single short completion
    requirements.min_vram_gb = 0;
  }

  await enqueueTask(c.env, {
    id: taskId,
    type: bench.taskType,
    requirements,
    priority: 'standard',
    customer_id: keyRecord.user_id,
    metadata: { bench: engine, iterations: body.iterations ?? 10 },
    max_attempts: 1,
  });

  // Poll D1 up to 60 s for completion.
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1000));
    const row = await c.env.DB.prepare(
      `SELECT state, result_uri, completed_at FROM tasks WHERE id = ?`
    )
      .bind(taskId)
      .first<{ state: string; result_uri: string | null; completed_at: number | null }>();

    if (!row) continue;
    if (row.state === 'completed') {
      return c.json({
        ok: true,
        task_id: taskId,
        engine,
        task_type: bench.taskType,
        state: 'completed',
        result_uri: row.result_uri,
        completed_at: row.completed_at,
      });
    }
    if (row.state === 'failed' || row.state === 'dead_letter') {
      return c.json({ ok: false, task_id: taskId, engine, state: row.state }, 500);
    }
  }

  // Return 202 if the task hasn't completed within 60 s.
  return c.json({ ok: false, task_id: taskId, engine, state: 'timeout' }, 202);
});
