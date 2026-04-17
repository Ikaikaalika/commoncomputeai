import { type Context, Hono } from "hono";
import { z } from "zod";
import { JobSpecSchema } from "@commoncompute/contracts";
import { parseJson } from "../lib/http";
import { requireAuth } from "../lib/auth-middleware";
import { listArtifactUrls, decodeArtifactKey, verifyArtifactSignature } from "../lib/artifacts";
import { writeAuditLog } from "../lib/audit";
import type { AppContext } from "../types/app";

const CreateJobSchema = z.object({
  job_spec: JobSpecSchema
});

type AppRouteContext = Context<AppContext>;

interface JobRecord {
  id: string;
  user_id: string;
  status: string;
  workload_type: string;
  spec_json: string;
  assigned_provider_id: string | null;
  standby_provider_id: string | null;
  budget_cap_usd: number;
  workflow_instance_id: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
}

async function loadJob(c: AppRouteContext, jobId: string): Promise<JobRecord | null> {
  return c.env.DB.prepare(
    `SELECT
      id,
      user_id,
      status,
      workload_type,
      spec_json,
      assigned_provider_id,
      standby_provider_id,
      budget_cap_usd,
      workflow_instance_id,
      created_at,
      updated_at,
      started_at,
      completed_at,
      failure_reason
    FROM jobs
    WHERE id = ?1`
  )
    .bind(jobId)
    .first<JobRecord>();
}

function canAccessJob(auth: { role: string; sub: string; provider_id?: string }, job: { user_id: string; assigned_provider_id: string | null }): boolean {
  if (auth.role === "admin") return true;
  if (auth.role === "customer" && auth.sub === job.user_id) return true;
  if ((auth.role === "provider" || auth.role === "agent") && auth.provider_id && auth.provider_id === job.assigned_provider_id) return true;
  return false;
}

export function registerJobRoutes(app: Hono<AppContext>): void {
  app.post("/v1/jobs", requireAuth(["customer", "admin"]), async (c) => {
    const parsed = await parseJson(c.req.raw, CreateJobSchema);
    if (!parsed.ok) return parsed.response;

    const auth = c.get("auth");
    const jobId = crypto.randomUUID();

    await c.env.DB.prepare(
      `INSERT INTO jobs (
        id,
        user_id,
        status,
        workload_type,
        spec_json,
        budget_cap_usd,
        sla_tier,
        created_at,
        updated_at
      ) VALUES (?1, ?2, 'queued', ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))`
    )
      .bind(
        jobId,
        auth.sub,
        parsed.data.job_spec.workload_type,
        JSON.stringify(parsed.data.job_spec),
        parsed.data.job_spec.budget_cap_usd,
        parsed.data.job_spec.sla_tier
      )
      .run();

    if (parsed.data.job_spec.workload_type === "training") {
      const instance = await c.env.TRAINING_WORKFLOW.create({
        id: `training-${jobId}`,
        params: {
          job_id: jobId
        }
      });

      await c.env.DB.prepare("UPDATE jobs SET workflow_instance_id = ?2 WHERE id = ?1").bind(jobId, instance.id).run();
    }

    await c.env.JOB_EVENTS.send({
      channel: "job-events",
      type: "job_created",
      job_id: jobId
    });

    await writeAuditLog(c.env, "customer", auth.sub, "job.create", "job", jobId, {
      workload_type: parsed.data.job_spec.workload_type,
      sla_tier: parsed.data.job_spec.sla_tier
    });

    return c.json({
      job_id: jobId,
      status: "queued"
    }, 201);
  });

  app.get("/v1/jobs/:job_id", requireAuth(["customer", "provider", "agent", "admin"]), async (c) => {
    const auth = c.get("auth");
    const jobId = c.req.param("job_id");
    const job = await loadJob(c, jobId);
    if (!job) {
      return c.json({ error: "Job not found", code: "JOB_NOT_FOUND" }, 404);
    }

    if (!canAccessJob(auth, job)) {
      return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
    }

    return c.json({
      ...job,
      spec: JSON.parse(job.spec_json)
    });
  });

  app.post("/v1/jobs/:job_id/cancel", requireAuth(["customer", "admin"]), async (c) => {
    const auth = c.get("auth");
    const jobId = c.req.param("job_id");
    const job = await loadJob(c, jobId);

    if (!job) {
      return c.json({ error: "Job not found", code: "JOB_NOT_FOUND" }, 404);
    }

    if (auth.role !== "admin" && job.user_id !== auth.sub) {
      return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
    }

    await c.env.DB.prepare(
      `UPDATE jobs
      SET status = 'cancelled',
          updated_at = datetime('now')
      WHERE id = ?1 AND status IN ('queued', 'reserved', 'running')`
    )
      .bind(jobId)
      .run();

    await c.env.JOB_EVENTS.send({
      channel: "job-events",
      type: "job_cancelled",
      job_id: jobId
    });

    await writeAuditLog(c.env, auth.role, auth.sub, "job.cancel", "job", jobId, {});

    return c.json({ job_id: jobId, status: "cancelled" });
  });

  app.get("/v1/jobs/:job_id/logs", requireAuth(["customer", "provider", "agent", "admin"]), async (c) => {
    const auth = c.get("auth");
    const jobId = c.req.param("job_id");
    const job = await loadJob(c, jobId);

    if (!job) {
      return c.json({ error: "Job not found", code: "JOB_NOT_FOUND" }, 404);
    }

    if (!canAccessJob(auth, job)) {
      return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
    }

    const events = await c.env.DB.prepare(
      `SELECT id, event_type, event_json, created_at
       FROM job_events
       WHERE job_id = ?1
       ORDER BY created_at DESC
       LIMIT 200`
    )
      .bind(jobId)
      .all<{ id: string; event_type: string; event_json: string; created_at: string }>();

    const logObject = await c.env.ARTIFACTS.get(`jobs/${jobId}/logs/latest.log`);
    const logText = logObject ? await logObject.text() : null;

    return c.json({
      job_id: jobId,
      events: events.results.map((event) => ({
        id: event.id,
        event_type: event.event_type,
        event: JSON.parse(event.event_json),
        created_at: event.created_at
      })),
      latest_log: logText
    });
  });

  app.get("/v1/jobs/:job_id/artifacts", requireAuth(["customer", "provider", "agent", "admin"]), async (c) => {
    const auth = c.get("auth");
    const jobId = c.req.param("job_id");
    const job = await loadJob(c, jobId);

    if (!job) {
      return c.json({ error: "Job not found", code: "JOB_NOT_FOUND" }, 404);
    }

    if (!canAccessJob(auth, job)) {
      return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
    }

    const artifacts = await listArtifactUrls(c.env, jobId);
    return c.json({ job_id: jobId, artifacts });
  });

  app.get("/v1/jobs/:job_id/artifacts/:artifact_id/download", requireAuth(["customer", "provider", "agent", "admin"]), async (c) => {
    const auth = c.get("auth");
    const jobId = c.req.param("job_id");
    const artifactId = c.req.param("artifact_id");

    const job = await loadJob(c, jobId);
    if (!job) {
      return c.json({ error: "Job not found", code: "JOB_NOT_FOUND" }, 404);
    }

    if (!canAccessJob(auth, job)) {
      return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
    }

    const exp = c.req.query("exp");
    const sig = c.req.query("sig");

    if (!exp || !sig) {
      return c.json({ error: "Missing signature query params", code: "MISSING_SIGNATURE" }, 400);
    }

    const valid = await verifyArtifactSignature(jobId, artifactId, exp, sig, c.env.JWT_SECRET);
    if (!valid) {
      return c.json({ error: "Invalid artifact signature", code: "INVALID_SIGNATURE" }, 403);
    }

    const key = decodeArtifactKey(artifactId);
    if (!key || !key.startsWith(`jobs/${jobId}/artifacts/`)) {
      return c.json({ error: "Invalid artifact key", code: "INVALID_ARTIFACT" }, 400);
    }

    const object = await c.env.ARTIFACTS.get(key);
    if (!object) {
      return c.json({ error: "Artifact not found", code: "ARTIFACT_NOT_FOUND" }, 404);
    }

    const headers = new Headers();
    if (object.httpEtag) headers.set("etag", object.httpEtag);
    headers.set("content-type", object.httpMetadata?.contentType ?? "application/octet-stream");

    return new Response(object.body, { headers });
  });
}
