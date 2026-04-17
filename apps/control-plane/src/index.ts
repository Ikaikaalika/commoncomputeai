import { Hono } from "hono";
import type { AppContext } from "./types/app";
import { registerAuthRoutes } from "./routes/auth";
import { registerProviderRoutes } from "./routes/providers";
import { registerJobRoutes } from "./routes/jobs";
import { registerAgentRoutes } from "./routes/agent";
import { registerBillingRoutes } from "./routes/billing";
import { registerMarketRoutes } from "./routes/market";
import { registerAccountRoutes } from "./routes/account";
import { registerAdminRoutes } from "./routes/admin";
import { registerMetaRoutes } from "./routes/meta";
import { handleQueueBatch } from "./queues";
import { MarketDurableObject } from "./durable/market";
import { ProviderDurableObject } from "./durable/provider";
import { TrainingLifecycleWorkflow } from "./workflows/training";
import { renderHomepage } from "./site/homepage";
import { renderCustomerApp } from "./site/customer-app";
import { runMaintenance } from "./lib/maintenance";

const app = new Hono<AppContext>();

app.get("/healthz", (c) => {
  return c.json({ status: "ok", now: new Date().toISOString() });
});

registerAuthRoutes(app);
registerProviderRoutes(app);
registerJobRoutes(app);
registerAgentRoutes(app);
registerBillingRoutes(app);
registerMarketRoutes(app);
registerAccountRoutes(app);
registerAdminRoutes(app);
registerMetaRoutes(app);

app.notFound((c) => c.json({ error: "Not Found", code: "NOT_FOUND" }, 404));

app.onError((error, c) => {
  console.error("Unhandled error", error);
  return c.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    },
    500
  );
});

export default {
  async fetch(request: Request, env: AppContext["Bindings"], ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    const method = request.method.toUpperCase();
    const isApiPath = url.pathname === "/healthz" || url.pathname.startsWith("/v1/");
    const isWebHost = host === "commoncompute.ai" || host.endsWith(".workers.dev");

    if (host === "www.commoncompute.ai") {
      return Response.redirect(`https://commoncompute.ai${url.pathname}${url.search}`, 308);
    }

    if (isWebHost) {
      if (isApiPath) {
        return app.fetch(request, env, ctx);
      }

      if (method !== "GET" && method !== "HEAD") {
        return Response.json({ error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" }, { status: 405 });
      }

      if (url.pathname === "/favicon.ico") {
        const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#de6b35\"/><stop offset=\"50%\" stop-color=\"#f2b84b\"/><stop offset=\"100%\" stop-color=\"#0f766e\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"14\" fill=\"url(#g)\"/><path d=\"M16 34c0-10 8-18 18-18 8 0 15 5 17 12l-7 2c-2-5-6-8-11-8-6 0-11 5-11 12 0 6 5 11 11 11 5 0 9-3 11-8l7 2c-2 7-9 12-17 12-10 0-18-8-18-17z\" fill=\"#fff\"/></svg>`;
        return new Response(method === "HEAD" ? null : svg, {
          headers: {
            "content-type": "image/svg+xml",
            "cache-control": "public, max-age=86400"
          }
        });
      }

      if (url.pathname === "/app" || url.pathname === "/app/") {
        return new Response(method === "HEAD" ? null : renderCustomerApp(), {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store"
          }
        });
      }

      if (url.pathname === "/" || url.pathname === "") {
        return new Response(method === "HEAD" ? null : renderHomepage(), {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=300"
          }
        });
      }

      return new Response("Not Found", { status: 404 });
    }

    return app.fetch(request, env, ctx);
  },
  async queue(batch: MessageBatch<unknown>, env: AppContext["Bindings"]): Promise<void> {
    await handleQueueBatch(batch, env);
  },
  async scheduled(_event: ScheduledEvent, env: AppContext["Bindings"], ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runMaintenance(env)
        .then((summary) => {
          console.log("maintenance_summary", summary);
        })
        .catch((error) => {
          console.error("maintenance_failed", error);
        })
    );
  }
};

export { MarketDurableObject, ProviderDurableObject, TrainingLifecycleWorkflow };
