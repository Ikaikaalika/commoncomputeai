import type { Env } from '../types';

interface TaskInput {
  id: string;
  type: string;
  requirements: Record<string, unknown>;
  priority: string;
  input_uri?: string;
  customer_id: string;
  idempotency_key?: string;
  metadata?: Record<string, unknown>;
  max_attempts?: number;
}

// Enqueue a task: write to D1, then push to RouterShard via service binding.
// Idempotency-key: if a task with the same key already exists, return it unchanged.
export async function enqueueTask(env: Env, input: TaskInput): Promise<{ id: string }> {
  if (input.idempotency_key) {
    const existing = await env.DB.prepare(
      `SELECT id FROM tasks WHERE idempotency_key = ?`
    )
      .bind(input.idempotency_key)
      .first<{ id: string }>();
    if (existing) return existing;
  }

  await env.DB.prepare(
    `INSERT INTO tasks (id, type, requirements, priority, state, attempts, max_attempts,
     idempotency_key, input_uri, customer_id, created_at)
     VALUES (?, ?, ?, ?, 'queued', 0, ?, ?, ?, ?, ?)`
  )
    .bind(
      input.id,
      input.type,
      JSON.stringify(input.requirements),
      input.priority,
      input.max_attempts ?? 3,
      input.idempotency_key ?? null,
      input.input_uri ?? null,
      input.customer_id,
      Date.now()
    )
    .run();

  // Notify RouterShard via service binding.
  await env.ROUTER.fetch('http://router/internal/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { 'Content-Type': 'application/json' },
  });

  return { id: input.id };
}
