import { describe, expect, it } from "vitest";
import type { JobSpecV1 } from "@commoncompute/contracts";
import { hardFilterProviders, rankProviders } from "../lib/scoring";
import type { ProviderSnapshot } from "../env";

function provider(overrides: Partial<ProviderSnapshot>): ProviderSnapshot {
  return {
    provider_id: "provider-1",
    kyc_status: "verified",
    jurisdiction: "US",
    status: "online",
    last_heartbeat_at: new Date().toISOString(),
    reliability_score: 0.9,
    uptime_score: 0.95,
    latency_score: 0.9,
    price_per_gpu_hour_usd: 1.2,
    capability: {
      provider_id: "provider-1",
      os: "linux",
      adapter: "cuda",
      gpu_count: 2,
      gpu_model: "NVIDIA A100",
      vram_gb: 80,
      driver_version: "550.0",
      runtime_version: "12.4",
      benchmark_score: 940,
      attestation_hash: "abc",
      reliability_score: 0.9
    },
    ...overrides
  };
}

describe("scoring", () => {
  it("filters providers by runtime and KYC", () => {
    const spec: JobSpecV1 = {
      workload_type: "inference",
      image: "ghcr.io/test:latest",
      command: ["python", "serve.py"],
      gpu_constraints: {
        runtime: "cuda",
        min_vram_gb: 24,
        min_gpu_count: 1,
        model_allowlist: [],
        jurisdiction_allowlist: ["US"]
      },
      network_policy: {
        egress_default_deny: true,
        allowlist_domains: [],
        allowlist_cidrs: [],
        dns_policy: "platform"
      },
      mounts: [],
      budget_cap_usd: 50,
      sla_tier: "standard"
    };

    const results = hardFilterProviders(spec, [
      provider({ provider_id: "good" }),
      provider({ provider_id: "bad-runtime", capability: { ...provider({}).capability, adapter: "rocm" } }),
      provider({ provider_id: "bad-kyc", kyc_status: "pending" })
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].provider_id).toBe("good");
  });

  it("ranks by weighted score", () => {
    const spec: JobSpecV1 = {
      workload_type: "training",
      image: "ghcr.io/test:latest",
      command: ["python", "train.py"],
      gpu_constraints: {
        runtime: "cuda",
        min_vram_gb: 48,
        min_gpu_count: 1,
        model_allowlist: [],
        jurisdiction_allowlist: ["US"]
      },
      network_policy: {
        egress_default_deny: true,
        allowlist_domains: [],
        allowlist_cidrs: [],
        dns_policy: "platform"
      },
      mounts: [],
      budget_cap_usd: 200,
      sla_tier: "critical"
    };

    const ranked = rankProviders(spec, [
      provider({ provider_id: "expensive", price_per_gpu_hour_usd: 4.5, reliability_score: 0.95 }),
      provider({ provider_id: "balanced", price_per_gpu_hour_usd: 1.5, reliability_score: 0.9 })
    ]);

    expect(ranked[0].provider.provider_id).toBe("balanced");
    expect(ranked[0].total).toBeGreaterThan(ranked[1].total);
  });
});
