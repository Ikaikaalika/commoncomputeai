import type { WorkerEnv } from "../env";

export async function writeAuditLog(env: WorkerEnv, actorType: string, actorId: string, action: string, resourceType: string, resourceId: string, metadata: Record<string, unknown> = {}): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO audit_logs (
      id,
      actor_type,
      actor_id,
      action,
      resource_type,
      resource_id,
      metadata,
      created_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))`
  )
    .bind(crypto.randomUUID(), actorType, actorId, action, resourceType, resourceId, JSON.stringify(metadata))
    .run();
}
