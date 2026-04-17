import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import type { AppContext } from "../types/app";

const JobsQuerySchema = z.object({
  status: z.enum(["queued", "reserved", "running", "completed", "failed", "cancelled"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

interface JobListRow {
  id: string;
  status: string;
  workload_type: string;
  budget_cap_usd: number;
  assigned_provider_id: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
}

export function registerAccountRoutes(app: Hono<AppContext>): void {
  app.get("/v1/account/me", requireAuth(["customer", "provider", "agent", "admin"]), async (c) => {
    const auth = c.get("auth");

    const [userRows, providerRows] = await c.env.DB.batch([
      c.env.DB.prepare("SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?1").bind(auth.sub),
      c.env.DB.prepare(
        `SELECT
          id,
          user_id,
          display_name,
          jurisdiction,
          status,
          kyc_status,
          reliability_score,
          uptime_score,
          latency_score,
          price_per_gpu_hour_usd,
          last_heartbeat_at,
          created_at,
          updated_at
        FROM providers
        WHERE user_id = ?1`
      ).bind(auth.sub)
    ]);

    const user = userRows.results[0];
    if (!user) {
      return c.json({ error: "User not found", code: "USER_NOT_FOUND" }, 404);
    }

    const provider = providerRows.results[0] ?? null;

    return c.json({
      user,
      provider
    });
  });

  app.get("/v1/account/jobs", requireAuth(["customer", "provider", "agent", "admin"]), async (c) => {
    const auth = c.get("auth");
    const parsed = JobsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", code: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const statusClause = parsed.data.status ? "AND status = ?2" : "";

    if (auth.role === "customer") {
      const stmt = parsed.data.status
        ? c.env.DB.prepare(
            `SELECT id, status, workload_type, budget_cap_usd, assigned_provider_id, created_at, updated_at, started_at, completed_at, failure_reason
             FROM jobs
             WHERE user_id = ?1 ${statusClause}
             ORDER BY created_at DESC
             LIMIT ?3`
          ).bind(auth.sub, parsed.data.status, parsed.data.limit)
        : c.env.DB.prepare(
            `SELECT id, status, workload_type, budget_cap_usd, assigned_provider_id, created_at, updated_at, started_at, completed_at, failure_reason
             FROM jobs
             WHERE user_id = ?1
             ORDER BY created_at DESC
             LIMIT ?2`
          ).bind(auth.sub, parsed.data.limit);

      const jobs = await stmt.all<JobListRow>();
      return c.json({ jobs: jobs.results, scope: "customer" });
    }

    if (auth.role === "provider" || auth.role === "agent") {
      if (!auth.provider_id) {
        return c.json({ error: "Provider not linked", code: "PROVIDER_NOT_LINKED" }, 409);
      }

      const stmt = parsed.data.status
        ? c.env.DB.prepare(
            `SELECT id, status, workload_type, budget_cap_usd, assigned_provider_id, created_at, updated_at, started_at, completed_at, failure_reason
             FROM jobs
             WHERE assigned_provider_id = ?1 ${statusClause}
             ORDER BY created_at DESC
             LIMIT ?3`
          ).bind(auth.provider_id, parsed.data.status, parsed.data.limit)
        : c.env.DB.prepare(
            `SELECT id, status, workload_type, budget_cap_usd, assigned_provider_id, created_at, updated_at, started_at, completed_at, failure_reason
             FROM jobs
             WHERE assigned_provider_id = ?1
             ORDER BY created_at DESC
             LIMIT ?2`
          ).bind(auth.provider_id, parsed.data.limit);

      const jobs = await stmt.all<JobListRow>();
      return c.json({ jobs: jobs.results, scope: "provider" });
    }

    const stmt = parsed.data.status
      ? c.env.DB.prepare(
          `SELECT id, status, workload_type, budget_cap_usd, assigned_provider_id, created_at, updated_at, started_at, completed_at, failure_reason
           FROM jobs
           WHERE status = ?1
           ORDER BY created_at DESC
           LIMIT ?2`
        ).bind(parsed.data.status, parsed.data.limit)
      : c.env.DB.prepare(
          `SELECT id, status, workload_type, budget_cap_usd, assigned_provider_id, created_at, updated_at, started_at, completed_at, failure_reason
           FROM jobs
           ORDER BY created_at DESC
           LIMIT ?1`
        ).bind(parsed.data.limit);

    const jobs = await stmt.all<JobListRow>();
    return c.json({ jobs: jobs.results, scope: "admin" });
  });
}
