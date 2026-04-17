import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { writeAuditLog } from "../lib/audit";
import type { AppContext } from "../types/app";

const RequeueSchema = z.object({
  reason: z.string().min(3).default("manual_admin_requeue")
});

const ReputationAdjustSchema = z.object({
  reliability_delta: z.number().min(-0.5).max(0.5).default(0),
  uptime_delta: z.number().min(-0.5).max(0.5).default(0),
  latency_delta: z.number().min(-0.5).max(0.5).default(0),
  reason: z.string().min(5)
});

const PayoutReleaseSchema = z.object({
  provider_id: z.string().uuid().optional(),
  limit: z.number().int().positive().max(500).default(200),
  dry_run: z.boolean().default(false)
});

const AuditQuerySchema = z.object({
  actor_type: z.string().optional(),
  resource_type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100)
});

interface PayoutRow {
  id: string;
  provider_id: string;
  amount_usd: number;
}

export function registerAdminRoutes(app: Hono<AppContext>): void {
  app.get("/v1/admin/overview", requireAuth(["admin"]), async (c) => {
    const [jobAgg, providerAgg, payoutAgg] = await c.env.DB.batch([
      c.env.DB.prepare(
        `SELECT
          SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued,
          SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) AS reserved,
          SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM jobs`
      ),
      c.env.DB.prepare(
        `SELECT
          SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) AS online,
          SUM(CASE WHEN status = 'draining' THEN 1 ELSE 0 END) AS draining,
          SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) AS offline,
          SUM(CASE WHEN kyc_status = 'verified' THEN 1 ELSE 0 END) AS verified_kyc
        FROM providers`
      ),
      c.env.DB.prepare(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'held' THEN amount_usd ELSE 0 END), 0) AS held,
          COALESCE(SUM(CASE WHEN status = 'available' THEN amount_usd ELSE 0 END), 0) AS available,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_usd ELSE 0 END), 0) AS paid
        FROM payout_ledger`
      )
    ]);

    return c.json({
      jobs: jobAgg.results[0] ?? {},
      providers: providerAgg.results[0] ?? {},
      payouts: payoutAgg.results[0] ?? {}
    });
  });

  app.get("/v1/admin/audit", requireAuth(["admin"]), async (c) => {
    const parsed = AuditQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", code: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    let sql = `SELECT id, actor_type, actor_id, action, resource_type, resource_id, metadata, created_at
               FROM audit_logs
               WHERE 1=1`;
    const binds: Array<string | number> = [];

    if (parsed.data.actor_type) {
      binds.push(parsed.data.actor_type);
      sql += ` AND actor_type = ?${binds.length}`;
    }

    if (parsed.data.resource_type) {
      binds.push(parsed.data.resource_type);
      sql += ` AND resource_type = ?${binds.length}`;
    }

    binds.push(parsed.data.limit);
    sql += ` ORDER BY created_at DESC LIMIT ?${binds.length}`;

    const result = await c.env.DB.prepare(sql).bind(...binds).all<{
      id: string;
      actor_type: string;
      actor_id: string;
      action: string;
      resource_type: string;
      resource_id: string;
      metadata: string;
      created_at: string;
    }>();

    return c.json({
      logs: result.results.map((log) => ({
        ...log,
        metadata: JSON.parse(log.metadata)
      }))
    });
  });

  app.post("/v1/admin/jobs/:job_id/requeue", requireAuth(["admin"]), async (c) => {
    let payload: z.infer<typeof RequeueSchema>;
    try {
      payload = RequeueSchema.parse(await c.req.json());
    } catch {
      payload = RequeueSchema.parse({});
    }

    const jobId = c.req.param("job_id");

    const job = await c.env.DB.prepare("SELECT id FROM jobs WHERE id = ?1").bind(jobId).first<{ id: string }>();
    if (!job) {
      return c.json({ error: "Job not found", code: "JOB_NOT_FOUND" }, 404);
    }

    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE jobs
         SET status = 'queued',
             assigned_provider_id = NULL,
             standby_provider_id = NULL,
             reservation_expires_at = NULL,
             failure_reason = NULL,
             updated_at = datetime('now')
         WHERE id = ?1`
      ).bind(jobId),
      c.env.DB.prepare(
        "INSERT INTO job_events (id, job_id, event_type, event_json, created_at) VALUES (?1, ?2, 'admin_requeue', ?3, datetime('now'))"
      ).bind(crypto.randomUUID(), jobId, JSON.stringify(payload))
    ]);

    await c.env.JOB_EVENTS.send({
      channel: "job-events",
      type: "requeue_job",
      job_id: jobId,
      reason: payload.reason
    });

    const admin = c.get("auth");
    await writeAuditLog(c.env, "admin", admin.sub, "admin.job.requeue", "job", jobId, payload);

    return c.json({ job_id: jobId, status: "queued", reason: payload.reason });
  });

  app.post("/v1/admin/providers/:provider_id/reputation/adjust", requireAuth(["admin"]), async (c) => {
    const parsed = ReputationAdjustSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: "Invalid payload", code: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const providerId = c.req.param("provider_id");

    const result = await c.env.DB.prepare(
      `UPDATE providers
       SET reliability_score = MIN(1, MAX(0, reliability_score + ?2)),
           uptime_score = MIN(1, MAX(0, uptime_score + ?3)),
           latency_score = MIN(1, MAX(0, latency_score + ?4)),
           updated_at = datetime('now')
       WHERE id = ?1`
    )
      .bind(providerId, parsed.data.reliability_delta, parsed.data.uptime_delta, parsed.data.latency_delta)
      .run();

    if (!result.success || (result.meta.changes ?? 0) === 0) {
      return c.json({ error: "Provider not found", code: "PROVIDER_NOT_FOUND" }, 404);
    }

    await c.env.DB.prepare(
      `INSERT INTO compliance_events (id, provider_id, event_type, event_json, created_at)
       VALUES (?1, ?2, 'admin_reputation_adjustment', ?3, datetime('now'))`
    )
      .bind(crypto.randomUUID(), providerId, JSON.stringify(parsed.data))
      .run();

    const admin = c.get("auth");
    await writeAuditLog(c.env, "admin", admin.sub, "admin.provider.reputation.adjust", "provider", providerId, parsed.data);

    return c.json({ provider_id: providerId, adjusted: true });
  });

  app.post("/v1/admin/payouts/release", requireAuth(["admin"]), async (c) => {
    const parsed = PayoutReleaseSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: "Invalid payload", code: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const listSql = parsed.data.provider_id
      ? `SELECT id, provider_id, amount_usd
         FROM payout_ledger
         WHERE status = 'available' AND provider_id = ?1
         ORDER BY created_at ASC
         LIMIT ?2`
      : `SELECT id, provider_id, amount_usd
         FROM payout_ledger
         WHERE status = 'available'
         ORDER BY created_at ASC
         LIMIT ?1`;

    const listStmt = parsed.data.provider_id
      ? c.env.DB.prepare(listSql).bind(parsed.data.provider_id, parsed.data.limit)
      : c.env.DB.prepare(listSql).bind(parsed.data.limit);

    const rows = await listStmt.all<PayoutRow>();
    const payoutIds = rows.results.map((row) => row.id);
    const totalAmount = rows.results.reduce((sum, row) => sum + Number(row.amount_usd), 0);

    if (parsed.data.dry_run) {
      return c.json({
        candidate_count: rows.results.length,
        total_amount_usd: Number(totalAmount.toFixed(6)),
        payout_ids: payoutIds
      });
    }

    for (const payoutId of payoutIds) {
      await c.env.DB.prepare(
        `UPDATE payout_ledger
         SET status = 'paid',
             updated_at = datetime('now')
         WHERE id = ?1`
      )
        .bind(payoutId)
        .run();
    }

    const admin = c.get("auth");
    await writeAuditLog(c.env, "admin", admin.sub, "admin.payout.release", "payout_ledger", payoutIds.join(","), {
      provider_id: parsed.data.provider_id ?? null,
      payout_count: payoutIds.length,
      total_amount_usd: Number(totalAmount.toFixed(6))
    });

    return c.json({
      released_count: payoutIds.length,
      total_amount_usd: Number(totalAmount.toFixed(6)),
      payout_ids: payoutIds
    });
  });
}
