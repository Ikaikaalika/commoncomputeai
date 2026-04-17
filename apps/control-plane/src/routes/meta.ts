import { Hono } from "hono";
import { buildOpenApiDocument } from "../meta/openapi";
import type { AppContext } from "../types/app";

export function registerMetaRoutes(app: Hono<AppContext>): void {
  app.get("/v1/meta/openapi", (c) => {
    const url = new URL(c.req.url);
    const doc = buildOpenApiDocument({
      title: "CommonCompute Control Plane API",
      version: "0.2.0",
      baseUrl: `${url.protocol}//${url.host}`
    });

    return c.json(doc);
  });

  app.get("/v1/meta/system", async (c) => {
    const jobs = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM jobs").first<{ count: number }>();
    const providers = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM providers").first<{ count: number }>();

    return c.json({
      service: "commoncompute-control-plane",
      app_env: c.env.APP_ENV,
      jwt_issuer: c.env.JWT_ISSUER,
      capabilities: {
        workloads: ["inference", "training"],
        runtimes: ["cuda", "rocm", "metal"],
        queues: ["job-events", "provider-events", "billing-events"],
        workflows: ["training-lifecycle"],
        storage: ["d1", "r2", "kv", "durable-objects"]
      },
      stats: {
        jobs: Number(jobs?.count ?? 0),
        providers: Number(providers?.count ?? 0)
      }
    });
  });
}
