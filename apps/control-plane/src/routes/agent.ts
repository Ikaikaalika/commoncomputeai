import { type Context, Hono } from "hono";
import { z } from "zod";
import { parseJson } from "../lib/http";
import { requireAuth } from "../lib/auth-middleware";
import { writeAuditLog } from "../lib/audit";
import type { AppContext } from "../types/app";

const PollSchema = z.object({
  provider_id: z.string().uuid().optional()
});

const StartSchema = z.object({
  provider_id: z.string().uuid().optional(),
  started_at: z.string().optional()
});

const ProgressSchema = z.object({
  provider_id: z.string().uuid().optional(),
  message: z.string().min(1),
  progress: z.number().min(0).max(100).optional(),
  metrics: z.record(z.string(), z.number()).optional()
});

const CompleteSchema = z.object({
  provider_id: z.string().uuid().optional(),
  gpu_seconds: z.number().nonnegative(),
  storage_gb_hours: z.number().nonnegative().default(0),
  egress_bytes: z.number().nonnegative().default(0),
  artifact_keys: z.array(z.string()).default([])
});

const FailSchema = z.object({
  provider_id: z.string().uuid().optional(),
  reason: z.string().min(1),
  retryable: z.boolean().default(true)
});

type AppRouteContext = Context<AppContext>;

async function resolveProviderId(c: AppRouteContext, explicitProviderId?: string): Promise<string | null> {
  if (explicitProviderId) return explicitProviderId;
  const auth = c.get("auth");
  if (auth.provider_id) return auth.provider_id;

  const row = await c.env.DB.prepare("SELECT id FROM providers WHERE user_id = ?1").bind(auth.sub).first<{ id: string }>();
  return row?.id ?? null;
}

async function ensureProviderEligibility(c: AppRouteContext, providerId: string): Promise<{ ok: true } | { ok: false; response: Response }> {
  const row = await c.env.DB.prepare("SELECT kyc_status, status FROM providers WHERE id = ?1").bind(providerId).first<{ kyc_status: string; status: string }>();

  if (!row) {
    return { ok: false, response: c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404) };
  }

  if (row.kyc_status !== "verified") {
    return { ok: false, response: c.json({ error: "Provider KYC must be verified", code: "KYC_REQUIRED" }, 403) };
  }

  if (row.status === "offline") {
    return { ok: false, response: c.json({ error: "Provider is offline", code: "PROVIDER_OFFLINE" }, 409) };
  }

  return { ok: true };
}

export function registerAgentRoutes(app: Hono<AppContext>): void {
  app.post("/v1/agent/poll", requireAuth(["provider", "agent", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, PollSchema);
    if (!parsed.ok) return parsed.response;

    const providerId = await resolveProviderId(c, parsed.data.provider_id);
    if (!providerId) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    const eligible = await ensureProviderEligibility(c, providerId);
    if (!eligible.ok) return eligible.response;

    const row = await c.env.DB.prepare(
      `SELECT id, spec_json
       FROM jobs
       WHERE assigned_provider_id = ?1
         AND status = 'reserved'
         AND reservation_expires_at > datetime('now')
       ORDER BY created_at ASC
       LIMIT 1`
    )
      .bind(providerId)
      .first<{ id: string; spec_json: string }>();

    if (!row) {
      return c.json({ assigned: false, job_id: null, job_spec: null });
    }

    return c.json({
      assigned: true,
      job_id: row.id,
      job_spec: JSON.parse(row.spec_json)
    });
  });

  app.post("/v1/agent/job/:job_id/start", requireAuth(["provider", "agent", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, StartSchema);
    if (!parsed.ok) return parsed.response;

    const providerId = await resolveProviderId(c, parsed.data.provider_id);
    if (!providerId) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    const jobId = c.req.param("job_id");

    const result = await c.env.DB.prepare(
      `UPDATE jobs
       SET status = 'running',
           started_at = COALESCE(?3, datetime('now')),
           updated_at = datetime('now')
       WHERE id = ?1 AND assigned_provider_id = ?2 AND status IN ('reserved', 'queued')`
    )
      .bind(jobId, providerId, parsed.data.started_at ?? null)
      .run();

    if (!result.success || (result.meta?.changes ?? 0) === 0) {
      return c.json({ error: "Job not reservable for provider", code: "JOB_NOT_ASSIGNABLE" }, 409);
    }

    await c.env.DB.prepare(
      "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'job_started', ?3, datetime('now'))"
    )
      .bind(crypto.randomUUID(), jobId, JSON.stringify({ provider_id: providerId }))
      .run();

    await writeAuditLog(c.env, "provider", providerId, "agent.job.start", "job", jobId, {});

    return c.json({ job_id: jobId, status: "running" });
  });

  app.post("/v1/agent/job/:job_id/progress", requireAuth(["provider", "agent", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, ProgressSchema);
    if (!parsed.ok) return parsed.response;

    const providerId = await resolveProviderId(c, parsed.data.provider_id);
    if (!providerId) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    const jobId = c.req.param("job_id");

    await c.env.DB.prepare(
      "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'job_progress', ?3, datetime('now'))"
    )
      .bind(
        crypto.randomUUID(),
        jobId,
        JSON.stringify({
          provider_id: providerId,
          message: parsed.data.message,
          progress: parsed.data.progress ?? null,
          metrics: parsed.data.metrics ?? {}
        })
      )
      .run();

    return c.json({ job_id: jobId, accepted: true });
  });

  app.post("/v1/agent/job/:job_id/complete", requireAuth(["provider", "agent", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, CompleteSchema);
    if (!parsed.ok) return parsed.response;

    const providerId = await resolveProviderId(c, parsed.data.provider_id);
    if (!providerId) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    const jobId = c.req.param("job_id");
    const job = await c.env.DB.prepare(
      `SELECT
        j.id,
        j.status,
        j.assigned_provider_id,
        COALESCE(a.price_per_gpu_hour_usd, p.price_per_gpu_hour_usd, 1.0) AS price_per_gpu_hour_usd
       FROM jobs j
       LEFT JOIN allocations a ON a.job_id = j.id
       LEFT JOIN providers p ON p.id = j.assigned_provider_id
       WHERE j.id = ?1`
    )
      .bind(jobId)
      .first<{ id: string; status: string; assigned_provider_id: string; price_per_gpu_hour_usd: number }>();

    if (!job || job.assigned_provider_id !== providerId) {
      return c.json({ error: "Job not assigned to provider", code: "JOB_NOT_ASSIGNED" }, 409);
    }

    const billableAmountUsd = Number(((parsed.data.gpu_seconds / 3600) * Number(job.price_per_gpu_hour_usd)).toFixed(6));
    const payoutAmountUsd = Number((billableAmountUsd * 0.8).toFixed(6));
    const holdReleaseAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE jobs
         SET status = 'completed',
             completed_at = datetime('now'),
             updated_at = datetime('now')
         WHERE id = ?1`
      ).bind(jobId),
      c.env.DB.prepare(
        `INSERT INTO usage_records (
          id,
          job_id,
          provider_id,
          gpu_seconds,
          storage_gb_hours,
          egress_bytes,
          billable_amount_usd,
          payout_amount_usd,
          hold_release_at,
          created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'))`
      ).bind(
        crypto.randomUUID(),
        jobId,
        providerId,
        parsed.data.gpu_seconds,
        parsed.data.storage_gb_hours,
        parsed.data.egress_bytes,
        billableAmountUsd,
        payoutAmountUsd,
        holdReleaseAt
      ),
      c.env.DB.prepare(
        `INSERT INTO payout_ledger (
          id,
          provider_id,
          job_id,
          amount_usd,
          status,
          hold_release_at,
          created_at,
          updated_at
        ) VALUES (?1, ?2, ?3, ?4, 'held', ?5, datetime('now'), datetime('now'))`
      ).bind(crypto.randomUUID(), providerId, jobId, payoutAmountUsd, holdReleaseAt),
      c.env.DB.prepare(
        "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'job_completed', ?3, datetime('now'))"
      ).bind(
        crypto.randomUUID(),
        jobId,
        JSON.stringify({
          provider_id: providerId,
          gpu_seconds: parsed.data.gpu_seconds,
          storage_gb_hours: parsed.data.storage_gb_hours,
          egress_bytes: parsed.data.egress_bytes,
          artifact_keys: parsed.data.artifact_keys,
          billable_amount_usd: billableAmountUsd,
          payout_amount_usd: payoutAmountUsd,
          hold_release_at: holdReleaseAt
        })
      )
    ]);

    await c.env.BILLING_EVENTS.send({
      channel: "billing-events",
      type: "usage_recorded",
      job_id: jobId,
      provider_id: providerId,
      usage: {
        job_id: jobId,
        provider_id: providerId,
        gpu_seconds: parsed.data.gpu_seconds,
        storage_gb_hours: parsed.data.storage_gb_hours,
        egress_bytes: parsed.data.egress_bytes,
        billable_amount_usd: billableAmountUsd,
        payout_amount_usd: payoutAmountUsd,
        hold_release_at: holdReleaseAt
      }
    });

    const providerStub = c.env.PROVIDER_DO.get(c.env.PROVIDER_DO.idFromName(providerId));
    await providerStub.fetch("https://provider-do/release", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId })
    });

    await writeAuditLog(c.env, "provider", providerId, "agent.job.complete", "job", jobId, {
      gpu_seconds: parsed.data.gpu_seconds,
      payout_amount_usd: payoutAmountUsd
    });

    return c.json({ job_id: jobId, status: "completed", billable_amount_usd: billableAmountUsd, payout_amount_usd: payoutAmountUsd });
  });

  app.post("/v1/agent/job/:job_id/fail", requireAuth(["provider", "agent", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, FailSchema);
    if (!parsed.ok) return parsed.response;

    const providerId = await resolveProviderId(c, parsed.data.provider_id);
    if (!providerId) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    const jobId = c.req.param("job_id");

    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE jobs
         SET status = 'failed',
             failure_reason = ?2,
             updated_at = datetime('now')
         WHERE id = ?1 AND assigned_provider_id = ?3`
      ).bind(jobId, parsed.data.reason, providerId),
      c.env.DB.prepare(
        "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'job_failed', ?3, datetime('now'))"
      ).bind(
        crypto.randomUUID(),
        jobId,
        JSON.stringify({ provider_id: providerId, reason: parsed.data.reason, retryable: parsed.data.retryable })
      )
    ]);

    if (parsed.data.retryable) {
      await c.env.JOB_EVENTS.send({
        channel: "job-events",
        type: "requeue_job",
        job_id: jobId,
        reason: parsed.data.reason
      });
    }

    const providerStub = c.env.PROVIDER_DO.get(c.env.PROVIDER_DO.idFromName(providerId));
    await providerStub.fetch("https://provider-do/release", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId })
    });

    await writeAuditLog(c.env, "provider", providerId, "agent.job.fail", "job", jobId, {
      reason: parsed.data.reason,
      retryable: parsed.data.retryable
    });

    return c.json({ job_id: jobId, status: "failed", retryable: parsed.data.retryable });
  });
}
