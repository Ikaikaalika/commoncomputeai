import type { BillingEventMessage, JobEventMessage, ProviderEventMessage, WorkerEnv } from "./env";
import { getProviderSnapshot } from "./lib/db";
import { allocateJob, markProviderOffline } from "./lib/scheduler";

async function handleJobEvent(message: JobEventMessage, env: WorkerEnv): Promise<void> {
  if (message.type === "job_cancelled") {
    await env.DB.prepare("UPDATE jobs SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?1").bind(message.job_id).run();
    return;
  }

  if (message.type === "job_created" || message.type === "requeue_job") {
    const decision = await allocateJob(env, message.job_id);

    if (!decision) {
      await env.DB.prepare(
        "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'allocation_deferred', ?3, datetime('now'))"
      )
        .bind(crypto.randomUUID(), message.job_id, JSON.stringify({ reason: "No compatible provider available" }))
        .run();
      return;
    }

    await env.DB.prepare(
      "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'provider_reserved', ?3, datetime('now'))"
    )
      .bind(
        crypto.randomUUID(),
        message.job_id,
        JSON.stringify({
          selected_provider_id: decision.selected_provider_id,
          standby_provider_id: decision.standby_provider_id,
          score_breakdown: decision.score_breakdown,
          price_per_gpu_hour_usd: decision.price_per_gpu_hour_usd
        })
      )
      .run();

    await env.PROVIDER_EVENTS.send({
      channel: "provider-events",
      type: "provider_allocated",
      provider_id: decision.selected_provider_id,
      job_id: message.job_id
    });
  }
}

async function handleProviderEvent(message: ProviderEventMessage, env: WorkerEnv): Promise<void> {
  if (message.type === "provider_offline") {
    await markProviderOffline(env, message.provider_id, "heartbeat timeout or agent offline event");

    const impacted = await env.DB.prepare(
      `SELECT id
      FROM jobs
      WHERE assigned_provider_id = ?1
        AND status IN ('reserved', 'running')`
    )
      .bind(message.provider_id)
      .all<{ id: string }>();

    for (const job of impacted.results) {
      await env.JOB_EVENTS.send({
        channel: "job-events",
        type: "requeue_job",
        job_id: job.id,
        reason: "provider_offline"
      });
    }
    return;
  }

  if (message.type === "provider_registered" || message.type === "provider_heartbeat") {
    const snapshot = await getProviderSnapshot(env, message.provider_id);
    if (!snapshot) return;

    const marketStub = env.MARKET_DO.get(env.MARKET_DO.idFromName("global"));
    await marketStub.fetch("https://market-do/providers/register", {
      method: "POST",
      body: JSON.stringify({ provider: snapshot })
    });
    return;
  }

  if (message.type === "provider_allocated") {
    await env.DB.prepare(
      "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'provider_notified', ?3, datetime('now'))"
    )
      .bind(
        crypto.randomUUID(),
        message.job_id,
        JSON.stringify({ provider_id: message.provider_id })
      )
      .run();
  }
}

async function handleBillingEvent(message: BillingEventMessage, env: WorkerEnv): Promise<void> {
  if (message.type === "usage_recorded" && message.usage) {
    await env.DB.prepare(
      `INSERT INTO invoices (
        id,
        customer_user_id,
        status,
        amount_usd,
        external_ref,
        created_at,
        updated_at
      ) VALUES (?1, (SELECT user_id FROM jobs WHERE id = ?2), 'usage_pending', ?3, ?2, datetime('now'), datetime('now'))`
    )
      .bind(crypto.randomUUID(), message.usage.job_id, message.usage.billable_amount_usd)
      .run();
    return;
  }

  if (message.type === "invoice_settle") {
    await env.DB.prepare(
      `UPDATE payout_ledger
       SET status = CASE
         WHEN hold_release_at <= datetime('now') THEN 'available'
         ELSE status
       END,
       updated_at = datetime('now')
       WHERE status = 'held'`
    ).run();
    return;
  }

  if (message.type === "payout_ready" && message.provider_id) {
    await env.DB.prepare(
      `UPDATE payout_ledger
       SET status = 'paid',
           updated_at = datetime('now')
       WHERE provider_id = ?1
         AND status = 'available'`
    )
      .bind(message.provider_id)
      .run();
  }
}

export async function handleQueueBatch(batch: MessageBatch<unknown>, env: WorkerEnv): Promise<void> {
  for (const message of batch.messages) {
    try {
      const body = message.body as { channel?: string };
      if (!body.channel) {
        message.ack();
        continue;
      }

      if (body.channel === "job-events") {
        await handleJobEvent(message.body as JobEventMessage, env);
      } else if (body.channel === "provider-events") {
        await handleProviderEvent(message.body as ProviderEventMessage, env);
      } else if (body.channel === "billing-events") {
        await handleBillingEvent(message.body as BillingEventMessage, env);
      }

      message.ack();
    } catch {
      message.retry();
    }
  }
}
