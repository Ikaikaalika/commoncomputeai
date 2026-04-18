import { Hono } from 'hono';
import type { Env } from '../../types';
import { verifyKey } from '../../auth/apiKeys';
import { r2ResultKey } from '../../r2/presign';

export const jobsRouter = new Hono<{ Bindings: Env }>();

// GET /v1/jobs/:id — universal job status. Hides sharding from the customer.
jobsRouter.get('/:id', async (c) => {
  const { id } = c.req.param();
  const apiKey = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const task = await c.env.DB.prepare(
    `SELECT id, type, state, priority, attempts, input_uri, result_uri,
            parent_job_id, customer_id, created_at, completed_at
     FROM tasks WHERE id = ? AND customer_id = ?`
  )
    .bind(id, keyRecord.user_id)
    .first<{
      id: string;
      type: string;
      state: string;
      priority: string;
      attempts: number;
      result_uri: string | null;
      parent_job_id: string | null;
      customer_id: string;
      created_at: number;
      completed_at: number | null;
    }>();

  if (!task) return c.json({ error: 'Job not found' }, 404);

  // For sharded parent jobs, compute aggregate progress.
  let progress: number | null = null;
  if (task.state !== 'queued' && !task.parent_job_id) {
    const agg = await c.env.DB.prepare(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN state = 'completed' THEN 1 ELSE 0 END) as completed
       FROM tasks WHERE parent_job_id = ?`
    )
      .bind(id)
      .first<{ total: number; completed: number }>();
    if (agg && agg.total > 0) {
      progress = agg.completed / agg.total;
    }
  }

  return c.json({ ...task, progress });
});

// GET /v1/jobs/:id/result — redirect to R2 presigned GET URL.
jobsRouter.get('/:id/result', async (c) => {
  const { id } = c.req.param();
  const apiKey = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const task = await c.env.DB.prepare(
    `SELECT result_uri, state FROM tasks WHERE id = ? AND customer_id = ?`
  )
    .bind(id, keyRecord.user_id)
    .first<{ result_uri: string | null; state: string }>();

  if (!task) return c.json({ error: 'Job not found' }, 404);
  if (task.state !== 'completed' || !task.result_uri) {
    return c.json({ error: 'Result not ready', state: task.state }, 202);
  }

  // Serve directly from R2 (no egress fees).
  const obj = await c.env.ARTIFACTS.get(task.result_uri.replace(/^r2:\/\/[^/]+\//, ''));
  if (!obj) return c.json({ error: 'Result not found in storage' }, 404);
  return new Response(obj.body, {
    headers: { 'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream' },
  });
});

// POST /v1/jobs/:id/cancel
jobsRouter.post('/:id/cancel', async (c) => {
  const { id } = c.req.param();
  const apiKey = (c.req.header('Authorization') ?? '').replace(/^Bearer\s+/, '');
  const keyRecord = await verifyKey(apiKey, c.env.DB, c.env.ARGON2_PEPPER);
  if (!keyRecord) return c.json({ error: 'Unauthorized' }, 401);

  const result = await c.env.DB.prepare(
    `UPDATE tasks SET state = 'failed'
     WHERE id = ? AND customer_id = ? AND state IN ('queued', 'leased')`
  )
    .bind(id, keyRecord.user_id)
    .run();

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Job not found or already terminal' }, 404);
  }
  return c.json({ ok: true });
});
