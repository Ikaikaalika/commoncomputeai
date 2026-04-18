import type { Env, Task, CapabilityProfile } from './types';
import { deviceMatchesTask, deviceScore } from './match';
import { createLease, extendLease, releaseLease, sweepExpiredLeases, HEARTBEAT_DEAD_THRESHOLD_MS } from './leases';
import { compareTasks, replicationFactor, shouldDispatchBatch } from './priority';

// One RouterShard Durable Object instance per task type.
// Serializes queue access and dispatch decisions.
export class RouterShard implements DurableObject {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/enqueue' && request.method === 'POST') {
      return this.handleEnqueue(request);
    }
    if (path === '/dispatch') {
      return this.handleDispatch();
    }
    if (path === '/heartbeat' && request.method === 'POST') {
      return this.handleHeartbeat(request);
    }
    if (path === '/complete' && request.method === 'POST') {
      return this.handleComplete(request);
    }
    if (path === '/fail' && request.method === 'POST') {
      return this.handleFail(request);
    }
    if (path === '/sweep') {
      return this.handleSweep();
    }
    return new Response('Not found', { status: 404 });
  }

  // MARK: - Enqueue

  private async handleEnqueue(request: Request): Promise<Response> {
    const task = await request.json<Task>();
    await this.env.DB.prepare(
      `INSERT INTO tasks (id, type, requirements, priority, state, attempts, max_attempts,
       idempotency_key, input_uri, parent_job_id, customer_id, created_at)
       VALUES (?, ?, ?, ?, 'queued', 0, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        task.id,
        task.type,
        JSON.stringify(task.requirements),
        task.priority,
        task.max_attempts ?? 3,
        task.idempotency_key ?? null,
        task.input_uri ?? null,
        task.parent_job_id ?? null,
        task.customer_id,
        Date.now()
      )
      .run();

    // Schedule immediate dispatch attempt.
    this.state.waitUntil(this.dispatch());
    return Response.json({ ok: true });
  }

  // MARK: - Dispatch loop

  private async handleDispatch(): Promise<Response> {
    const dispatched = await this.dispatch();
    return Response.json({ dispatched });
  }

  private async dispatch(): Promise<number> {
    const now = Date.now();
    const deadThreshold = now - HEARTBEAT_DEAD_THRESHOLD_MS;

    // Load queued tasks ordered by priority + creation time.
    const tasks = await this.env.DB.prepare(
      `SELECT * FROM tasks WHERE state = 'queued' ORDER BY
       CASE priority WHEN 'priority' THEN 0 WHEN 'standard' THEN 1 ELSE 2 END,
       created_at ASC LIMIT 50`
    ).all<Task>();

    if (!tasks.results.length) return 0;

    // Batch suppression: skip batch tasks if priority/standard are waiting.
    const priorityCount = tasks.results.filter((t) => t.priority === 'priority').length;
    const standardCount = tasks.results.filter((t) => t.priority === 'standard').length;

    const eligible = tasks.results.filter(
      (t) => t.priority !== 'batch' || shouldDispatchBatch(priorityCount - 1, standardCount)
    );

    let dispatched = 0;
    for (const task of eligible) {
      const count = await this.dispatchTask(task, deadThreshold);
      dispatched += count;
    }
    return dispatched;
  }

  private async dispatchTask(task: Task, deadThreshold: number): Promise<number> {
    const requirements = typeof task.requirements === 'string'
      ? JSON.parse(task.requirements as unknown as string)
      : task.requirements;

    // Find eligible devices: alive heartbeat, matching capabilities, sufficient reliability.
    const devices = await this.env.DB.prepare(
      `SELECT id, capabilities, reliability FROM devices
       WHERE last_heartbeat_at > ? AND reliability >= ?
       ORDER BY reliability DESC LIMIT 20`
    )
      .bind(deadThreshold, requirements.min_reliability ?? 0.2)
      .all<{ id: string; capabilities: string; reliability: number }>();

    const matched = devices.results
      .map((d) => ({
        id: d.id,
        caps: JSON.parse(d.capabilities) as CapabilityProfile,
        reliability: d.reliability,
      }))
      .filter((d) => deviceMatchesTask(d.caps, { ...task, requirements }))
      .sort((a, b) => deviceScore(b.reliability, b.caps, task) - deviceScore(a.reliability, a.caps, task));

    if (!matched.length) return 0;

    const factor = replicationFactor(task.requirements?.priority as any ?? task.priority);
    const targets = matched.slice(0, factor);

    for (const device of targets) {
      await createLease(this.env.DB, task.id, device.id, (task.attempts ?? 0) + 1);
      await this.pushToDevice(device.id, { type: 'assign', payload: task });
    }

    // Schedule lease expiry sweep alarm (1s).
    await this.state.storage.setAlarm(Date.now() + 1000);

    return targets.length;
  }

  // MARK: - Heartbeat

  private async handleHeartbeat(request: Request): Promise<Response> {
    const { device_id, active_task_ids, telemetry } = await request.json<{
      device_id: string;
      active_task_ids: string[];
      telemetry?: unknown;
    }>();

    const now = Date.now();
    await this.env.DB.prepare(`UPDATE devices SET last_heartbeat_at = ? WHERE id = ?`)
      .bind(now, device_id)
      .run();

    // Extend leases for active tasks.
    for (const taskId of active_task_ids ?? []) {
      await extendLease(this.env.DB, taskId, device_id);
    }

    return Response.json({ ok: true });
  }

  // MARK: - Complete

  private async handleComplete(request: Request): Promise<Response> {
    const { task_id, device_id, result_uri } = await request.json<{
      task_id: string;
      device_id: string;
      result_uri: string;
    }>();

    await this.env.DB.prepare(`DELETE FROM task_leases WHERE task_id = ?`).bind(task_id).run();
    await this.env.DB.prepare(
      `UPDATE tasks SET state = 'completed', result_uri = ?, completed_at = ? WHERE id = ?`
    )
      .bind(result_uri, Date.now(), task_id)
      .run();

    // If this was a priority task with replication, cancel duplicates.
    await this.cancelDuplicateLeases(task_id, device_id);

    // Update parent job progress.
    await this.advanceParentJob(task_id);

    // Trigger next dispatch.
    this.state.waitUntil(this.dispatch());

    return Response.json({ ok: true });
  }

  // MARK: - Fail

  private async handleFail(request: Request): Promise<Response> {
    const { task_id } = await request.json<{ task_id: string }>();
    await releaseLease(this.env.DB, task_id);
    this.state.waitUntil(this.dispatch());
    return Response.json({ ok: true });
  }

  // MARK: - Alarm (lease sweep)

  async alarm(): Promise<void> {
    const expired = await sweepExpiredLeases(this.env.DB);
    if (expired.length > 0) {
      await this.dispatch();
    }
  }

  // MARK: - Sweep (explicit)

  private async handleSweep(): Promise<Response> {
    const expired = await sweepExpiredLeases(this.env.DB);
    return Response.json({ swept: expired.length });
  }

  // MARK: - Helpers

  private async cancelDuplicateLeases(winnerTaskId: string, winnerDeviceId: string): Promise<void> {
    const duplicates = await this.env.DB.prepare(
      `SELECT device_id FROM task_leases WHERE task_id = ? AND device_id != ?`
    )
      .bind(winnerTaskId, winnerDeviceId)
      .all<{ device_id: string }>();

    for (const { device_id } of duplicates.results) {
      await this.pushToDevice(device_id, { type: 'cancel', payload: { task_id: winnerTaskId } });
    }
    await this.env.DB.prepare(
      `DELETE FROM task_leases WHERE task_id = ? AND device_id != ?`
    )
      .bind(winnerTaskId, winnerDeviceId)
      .run();
  }

  private async advanceParentJob(taskId: string): Promise<void> {
    const task = await this.env.DB.prepare(`SELECT parent_job_id FROM tasks WHERE id = ?`)
      .bind(taskId)
      .first<{ parent_job_id: string | null }>();
    if (!task?.parent_job_id) return;

    const { total, completed } = await this.env.DB.prepare(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN state = 'completed' THEN 1 ELSE 0 END) as completed
       FROM tasks WHERE parent_job_id = ?`
    )
      .bind(task.parent_job_id)
      .first<{ total: number; completed: number }>() ?? { total: 0, completed: 0 };

    if (total > 0 && completed >= total) {
      // TODO: trigger aggregation job (Phase M4 sharding module)
    }
  }

  private async pushToDevice(deviceId: string, message: unknown): Promise<void> {
    const sessionId = this.env.DEVICE_SESSION.idFromName(deviceId);
    const session = this.env.DEVICE_SESSION.get(sessionId);
    await session.fetch('http://internal/push', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, message }),
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
