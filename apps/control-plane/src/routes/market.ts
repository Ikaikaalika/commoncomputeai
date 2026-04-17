import { Hono } from "hono";
import { z } from "zod";
import type { JobSpecV1 } from "@commoncompute/contracts";
import { listCandidateProviders } from "../lib/db";
import { hardFilterProviders, rankProviders } from "../lib/scoring";
import type { AppContext } from "../types/app";

const ProvidersQuerySchema = z.object({
  runtime: z.enum(["cuda", "rocm", "metal"]).optional(),
  min_vram_gb: z.coerce.number().positive().optional(),
  min_gpu_count: z.coerce.number().int().positive().optional(),
  jurisdiction: z.string().min(2).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(25)
});

const EstimateQuerySchema = z.object({
  workload_type: z.enum(["inference", "training"]),
  runtime: z.enum(["cuda", "rocm", "metal"]),
  min_vram_gb: z.coerce.number().positive(),
  min_gpu_count: z.coerce.number().int().positive().default(1),
  jurisdiction: z.string().min(2).default("US")
});

function buildEstimateSpec(params: z.infer<typeof EstimateQuerySchema>): JobSpecV1 {
  return {
    workload_type: params.workload_type,
    image: "ghcr.io/commoncompute/placeholder:latest",
    command: ["/bin/true"],
    gpu_constraints: {
      runtime: params.runtime,
      min_vram_gb: params.min_vram_gb,
      min_gpu_count: params.min_gpu_count,
      model_allowlist: [],
      jurisdiction_allowlist: [params.jurisdiction]
    },
    network_policy: {
      egress_default_deny: true,
      allowlist_domains: [],
      allowlist_cidrs: [],
      dns_policy: "platform"
    },
    mounts: [],
    budget_cap_usd: 100,
    sla_tier: "standard"
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

export function registerMarketRoutes(app: Hono<AppContext>): void {
  app.get("/v1/market/providers", async (c) => {
    const parsed = ProvidersQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", code: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const providers = await listCandidateProviders(c.env);

    const filtered = providers
      .filter((provider) => provider.kyc_status === "verified" && provider.status === "online")
      .filter((provider) => (parsed.data.runtime ? provider.capability.adapter === parsed.data.runtime : true))
      .filter((provider) => (parsed.data.min_vram_gb ? provider.capability.vram_gb >= parsed.data.min_vram_gb : true))
      .filter((provider) => (parsed.data.min_gpu_count ? provider.capability.gpu_count >= parsed.data.min_gpu_count : true))
      .filter((provider) => (parsed.data.jurisdiction ? provider.jurisdiction === parsed.data.jurisdiction : true))
      .sort((a, b) => {
        if (b.reliability_score !== a.reliability_score) return b.reliability_score - a.reliability_score;
        if (a.price_per_gpu_hour_usd !== b.price_per_gpu_hour_usd) return a.price_per_gpu_hour_usd - b.price_per_gpu_hour_usd;
        return b.capability.benchmark_score - a.capability.benchmark_score;
      })
      .slice(0, parsed.data.limit);

    return c.json({
      providers: filtered.map((provider) => ({
        provider_id: provider.provider_id,
        display_name: provider.display_name ?? provider.provider_id,
        jurisdiction: provider.jurisdiction,
        reliability_score: provider.reliability_score,
        uptime_score: provider.uptime_score,
        latency_score: provider.latency_score,
        price_per_gpu_hour_usd: provider.price_per_gpu_hour_usd,
        capability: provider.capability
      }))
    });
  });

  app.get("/v1/market/stats", async (c) => {
    const providerAgg = await c.env.DB.prepare(
      `SELECT
        COUNT(*) AS total_providers,
        SUM(CASE WHEN kyc_status = 'verified' AND status = 'online' THEN 1 ELSE 0 END) AS verified_online_providers,
        AVG(price_per_gpu_hour_usd) AS avg_price_per_gpu_hour_usd
      FROM providers`
    ).first<{ total_providers: number; verified_online_providers: number; avg_price_per_gpu_hour_usd: number }>();

    const jobAgg = await c.env.DB.prepare(
      `SELECT
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) AS queued,
        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) AS reserved,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS running,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM jobs`
    ).first<{ queued: number; reserved: number; running: number; completed: number; failed: number; cancelled: number }>();

    return c.json({
      providers: {
        total: Number(providerAgg?.total_providers ?? 0),
        verified_online: Number(providerAgg?.verified_online_providers ?? 0),
        avg_price_per_gpu_hour_usd: Number(providerAgg?.avg_price_per_gpu_hour_usd ?? 0)
      },
      jobs: {
        queued: Number(jobAgg?.queued ?? 0),
        reserved: Number(jobAgg?.reserved ?? 0),
        running: Number(jobAgg?.running ?? 0),
        completed: Number(jobAgg?.completed ?? 0),
        failed: Number(jobAgg?.failed ?? 0),
        cancelled: Number(jobAgg?.cancelled ?? 0)
      }
    });
  });

  app.get("/v1/market/pricing/estimate", async (c) => {
    const parsed = EstimateQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: "Invalid query params", code: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const spec = buildEstimateSpec(parsed.data);
    const candidates = await listCandidateProviders(c.env);
    const compatible = hardFilterProviders(spec, candidates);
    const ranked = rankProviders(spec, compatible);

    if (ranked.length === 0) {
      return c.json({
        compatible_provider_count: 0,
        estimate: null,
        message: "No compatible providers currently online"
      });
    }

    const prices = ranked.map((candidate) => candidate.provider.price_per_gpu_hour_usd);
    const lowestHourly = Math.min(...prices);
    const medianHourly = median(prices);
    const top = ranked.slice(0, 3);

    return c.json({
      compatible_provider_count: ranked.length,
      estimate: {
        lowest_price_per_gpu_hour_usd: Number(lowestHourly.toFixed(4)),
        median_price_per_gpu_hour_usd: Number(medianHourly.toFixed(4)),
        estimated_price_per_minute_usd: Number((lowestHourly / 60).toFixed(6)),
        estimated_start_window_seconds: ranked.length >= 3 ? 15 : ranked.length === 2 ? 30 : 45
      },
      top_options: top.map((candidate) => ({
        provider_id: candidate.provider.provider_id,
        display_name: candidate.provider.display_name ?? candidate.provider.provider_id,
        price_per_gpu_hour_usd: candidate.provider.price_per_gpu_hour_usd,
        score: Number(candidate.total.toFixed(4)),
        score_breakdown: {
          reliability: Number(candidate.reliability.toFixed(4)),
          benchmark_fit: Number(candidate.benchmark_fit.toFixed(4)),
          price: Number(candidate.price.toFixed(4)),
          latency: Number(candidate.latency.toFixed(4)),
          uptime: Number(candidate.uptime.toFixed(4))
        }
      }))
    });
  });
}
