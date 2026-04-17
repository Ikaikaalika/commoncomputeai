import type { CandidateScore, ProviderSnapshot } from "../env";
import type { JobSpecV1 } from "@commoncompute/contracts";

export function hardFilterProviders(jobSpec: JobSpecV1, providers: ProviderSnapshot[]): ProviderSnapshot[] {
  return providers.filter((provider) => {
    if (provider.kyc_status !== "verified") return false;
    if (provider.status !== "online") return false;
    if (provider.capability.adapter !== jobSpec.gpu_constraints.runtime) return false;
    if (provider.capability.vram_gb < jobSpec.gpu_constraints.min_vram_gb) return false;
    if (provider.capability.gpu_count < jobSpec.gpu_constraints.min_gpu_count) return false;

    const allowedJurisdictions = jobSpec.gpu_constraints.jurisdiction_allowlist;
    if (allowedJurisdictions.length > 0 && !allowedJurisdictions.includes(provider.jurisdiction)) return false;

    if (jobSpec.gpu_constraints.model_allowlist.length > 0 && !jobSpec.gpu_constraints.model_allowlist.includes(provider.capability.gpu_model)) {
      return false;
    }

    return true;
  });
}

function normalizePrice(pricePerGpuHourUsd: number): number {
  // Lower price should produce higher score.
  const bounded = Math.max(0.2, Math.min(8.0, pricePerGpuHourUsd));
  return 1 - (bounded - 0.2) / (8.0 - 0.2);
}

function benchmarkFit(providerBenchmark: number, workload: JobSpecV1["workload_type"]): number {
  const normalized = Math.min(1, providerBenchmark / 1000);
  if (workload === "training") return Math.min(1, normalized * 1.05);
  return normalized;
}

export function scoreProvider(jobSpec: JobSpecV1, provider: ProviderSnapshot): CandidateScore {
  const reliability = provider.reliability_score;
  const benchmark_fit = benchmarkFit(provider.capability.benchmark_score, jobSpec.workload_type);
  const price = normalizePrice(provider.price_per_gpu_hour_usd);
  const latency = provider.latency_score;
  const uptime = provider.uptime_score;

  const total = 0.35 * reliability + 0.25 * benchmark_fit + 0.2 * price + 0.1 * latency + 0.1 * uptime;

  return {
    provider,
    reliability,
    benchmark_fit,
    price,
    latency,
    uptime,
    total
  };
}

export function rankProviders(jobSpec: JobSpecV1, providers: ProviderSnapshot[]): CandidateScore[] {
  return providers
    .map((provider) => scoreProvider(jobSpec, provider))
    .sort((a, b) => b.total - a.total);
}
