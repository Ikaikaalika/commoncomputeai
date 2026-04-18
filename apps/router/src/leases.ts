import type { Env } from './types';

export const LEASE_DURATION_MS = 60_000;
export const HEARTBEAT_EXTENSION_MS = 10_000;
export const HEARTBEAT_DEAD_THRESHOLD_MS = 30_000;

export async function createLease(
  db: D1Database,
  taskId: string,
  deviceId: string,
  attempt: number
): Promise<void> {
  const now = Date.now();
  await db
    .prepare(
      `INSERT OR REPLACE INTO task_leases
       (task_id, device_id, leased_at, expires_at, heartbeat_at, attempt)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(taskId, deviceId, now, now + LEASE_DURATION_MS, now, attempt)
    .run();

  await db
    .prepare(`UPDATE tasks SET state = 'leased', attempts = attempts + 1 WHERE id = ?`)
    .bind(taskId)
    .run();
}

export async function extendLease(db: D1Database, taskId: string, deviceId: string): Promise<boolean> {
  const now = Date.now();
  const result = await db
    .prepare(
      `UPDATE task_leases
       SET expires_at = ?, heartbeat_at = ?
       WHERE task_id = ? AND device_id = ?`
    )
    .bind(now + LEASE_DURATION_MS, now, taskId, deviceId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function releaseLease(db: D1Database, taskId: string): Promise<void> {
  const lease = await db
    .prepare(`SELECT * FROM task_leases WHERE task_id = ?`)
    .bind(taskId)
    .first<{ attempt: number; device_id: string }>();

  if (!lease) return;

  await db.prepare(`DELETE FROM task_leases WHERE task_id = ?`).bind(taskId).run();

  const task = await db
    .prepare(`SELECT attempts, max_attempts FROM tasks WHERE id = ?`)
    .bind(taskId)
    .first<{ attempts: number; max_attempts: number }>();

  if (!task) return;

  const newState = task.attempts >= task.max_attempts ? 'dead_letter' : 'queued';
  await db
    .prepare(`UPDATE tasks SET state = ? WHERE id = ?`)
    .bind(newState, taskId)
    .run();
}

export async function sweepExpiredLeases(db: D1Database): Promise<string[]> {
  const now = Date.now();
  const expired = await db
    .prepare(`SELECT task_id FROM task_leases WHERE expires_at < ?`)
    .bind(now)
    .all<{ task_id: string }>();

  const ids = expired.results.map((r) => r.task_id);
  for (const taskId of ids) {
    await releaseLease(db, taskId);
  }
  return ids;
}
