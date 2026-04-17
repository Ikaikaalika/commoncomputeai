import type { JobSpecV1, ProviderCapabilityV1 } from "@commoncompute/contracts";
import type { ProviderSnapshot, WorkerEnv } from "../env";

interface D1Row {
  [key: string]: unknown;
}

export async function getProviderSnapshot(env: WorkerEnv, providerId: string): Promise<ProviderSnapshot | null> {
  const row = await env.DB.prepare(
    `SELECT
      p.id AS provider_id,
      p.display_name,
      p.kyc_status,
      p.jurisdiction,
      p.status,
      p.last_heartbeat_at,
      p.reliability_score,
      p.uptime_score,
      p.latency_score,
      p.price_per_gpu_hour_usd,
      c.os,
      c.adapter,
      c.gpu_count,
      c.gpu_model,
      c.vram_gb,
      c.driver_version,
      c.runtime_version,
      c.benchmark_score,
      c.attestation_hash,
      c.reliability_score AS capability_reliability_score
    FROM providers p
    JOIN provider_capabilities c ON c.provider_id = p.id
    WHERE p.id = ?1`
  )
    .bind(providerId)
    .first<D1Row>();

  if (!row) return null;

  return {
    provider_id: String(row.provider_id),
    display_name: row.display_name ? String(row.display_name) : undefined,
    kyc_status: String(row.kyc_status) as ProviderSnapshot["kyc_status"],
    jurisdiction: String(row.jurisdiction),
    status: String(row.status) as ProviderSnapshot["status"],
    last_heartbeat_at: row.last_heartbeat_at ? String(row.last_heartbeat_at) : null,
    reliability_score: Number(row.reliability_score),
    uptime_score: Number(row.uptime_score),
    latency_score: Number(row.latency_score),
    price_per_gpu_hour_usd: Number(row.price_per_gpu_hour_usd),
    capability: {
      provider_id: String(row.provider_id),
      os: String(row.os) as ProviderCapabilityV1["os"],
      adapter: String(row.adapter) as ProviderCapabilityV1["adapter"],
      gpu_count: Number(row.gpu_count),
      gpu_model: String(row.gpu_model),
      vram_gb: Number(row.vram_gb),
      driver_version: String(row.driver_version),
      runtime_version: String(row.runtime_version),
      benchmark_score: Number(row.benchmark_score),
      attestation_hash: String(row.attestation_hash),
      reliability_score: Number(row.capability_reliability_score)
    }
  };
}

export async function listCandidateProviders(env: WorkerEnv): Promise<ProviderSnapshot[]> {
  const rows = await env.DB.prepare(
    `SELECT
      p.id AS provider_id,
      p.display_name,
      p.kyc_status,
      p.jurisdiction,
      p.status,
      p.last_heartbeat_at,
      p.reliability_score,
      p.uptime_score,
      p.latency_score,
      p.price_per_gpu_hour_usd,
      c.os,
      c.adapter,
      c.gpu_count,
      c.gpu_model,
      c.vram_gb,
      c.driver_version,
      c.runtime_version,
      c.benchmark_score,
      c.attestation_hash,
      c.reliability_score AS capability_reliability_score
    FROM providers p
    JOIN provider_capabilities c ON c.provider_id = p.id`
  ).all<D1Row>();

  return rows.results.map((row) => ({
    provider_id: String(row.provider_id),
    display_name: row.display_name ? String(row.display_name) : undefined,
    kyc_status: String(row.kyc_status) as ProviderSnapshot["kyc_status"],
    jurisdiction: String(row.jurisdiction),
    status: String(row.status) as ProviderSnapshot["status"],
    last_heartbeat_at: row.last_heartbeat_at ? String(row.last_heartbeat_at) : null,
    reliability_score: Number(row.reliability_score),
    uptime_score: Number(row.uptime_score),
    latency_score: Number(row.latency_score),
    price_per_gpu_hour_usd: Number(row.price_per_gpu_hour_usd),
    capability: {
      provider_id: String(row.provider_id),
      os: String(row.os) as ProviderCapabilityV1["os"],
      adapter: String(row.adapter) as ProviderCapabilityV1["adapter"],
      gpu_count: Number(row.gpu_count),
      gpu_model: String(row.gpu_model),
      vram_gb: Number(row.vram_gb),
      driver_version: String(row.driver_version),
      runtime_version: String(row.runtime_version),
      benchmark_score: Number(row.benchmark_score),
      attestation_hash: String(row.attestation_hash),
      reliability_score: Number(row.capability_reliability_score)
    }
  }));
}

export async function getJobSpec(env: WorkerEnv, jobId: string): Promise<JobSpecV1 | null> {
  const row = await env.DB.prepare("SELECT spec_json FROM jobs WHERE id = ?1").bind(jobId).first<{ spec_json: string }>();
  if (!row) return null;
  return JSON.parse(row.spec_json) as JobSpecV1;
}
