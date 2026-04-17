import type { WorkerEnv } from "../env";

const DEFAULT_HEARTBEAT_STALE_SECONDS = 120;

interface StaleProviderRow {
  id: string;
}

interface ExpiredJobRow {
  id: string;
}

export interface MaintenanceSummary {
  stale_provider_events_enqueued: number;
  expired_reservations_requeued: number;
  held_payouts_released_to_available: number;
}

export async function runMaintenance(env: WorkerEnv, heartbeatStaleSeconds = DEFAULT_HEARTBEAT_STALE_SECONDS): Promise<MaintenanceSummary> {
  const staleProviders = await env.DB.prepare(
    `SELECT id
     FROM providers
     WHERE status IN ('online', 'draining')
       AND last_heartbeat_at IS NOT NULL
       AND strftime('%s', last_heartbeat_at) <= strftime('%s', 'now') - ?1`
  )
    .bind(heartbeatStaleSeconds)
    .all<StaleProviderRow>();

  for (const provider of staleProviders.results) {
    await env.PROVIDER_EVENTS.send({
      channel: "provider-events",
      type: "provider_offline",
      provider_id: provider.id
    });
  }

  const expiredReservations = await env.DB.prepare(
    `SELECT id
     FROM jobs
     WHERE status = 'reserved'
       AND reservation_expires_at IS NOT NULL
       AND reservation_expires_at <= datetime('now')`
  ).all<ExpiredJobRow>();

  for (const job of expiredReservations.results) {
    await env.DB.prepare(
      `UPDATE jobs
       SET status = 'queued',
           assigned_provider_id = NULL,
           standby_provider_id = NULL,
           reservation_expires_at = NULL,
           updated_at = datetime('now')
       WHERE id = ?1`
    )
      .bind(job.id)
      .run();

    await env.JOB_EVENTS.send({
      channel: "job-events",
      type: "requeue_job",
      job_id: job.id,
      reason: "reservation_expired"
    });

    await env.DB.prepare(
      "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'reservation_expired', ?3, datetime('now'))"
    )
      .bind(crypto.randomUUID(), job.id, JSON.stringify({ reason: "reservation_expired" }))
      .run();
  }

  const payoutResult = await env.DB.prepare(
    `UPDATE payout_ledger
     SET status = 'available',
         updated_at = datetime('now')
     WHERE status = 'held'
       AND hold_release_at <= datetime('now')`
  ).run();

  return {
    stale_provider_events_enqueued: staleProviders.results.length,
    expired_reservations_requeued: expiredReservations.results.length,
    held_payouts_released_to_available: Number(payoutResult.meta.changes ?? 0)
  };
}
