import type { AllocationDecisionV1, JobSpecV1 } from "@commoncompute/contracts";
import type { ProviderSnapshot, WorkerEnv } from "../env";
import { listCandidateProviders } from "./db";
import { hardFilterProviders, rankProviders } from "./scoring";

async function reserveProvider(env: WorkerEnv, providerId: string, jobId: string): Promise<boolean> {
  const providerStub = env.PROVIDER_DO.get(env.PROVIDER_DO.idFromName(providerId));
  const res = await providerStub.fetch("https://provider-do/reserve", {
    method: "POST",
    body: JSON.stringify({ job_id: jobId, ttl_seconds: 30 })
  });

  if (!res.ok) return false;
  const body = (await res.json()) as { accepted: boolean };
  return body.accepted;
}

export async function allocateJob(env: WorkerEnv, jobId: string): Promise<AllocationDecisionV1 | null> {
  const row = await env.DB.prepare("SELECT spec_json FROM jobs WHERE id = ?1").bind(jobId).first<{ spec_json: string }>();
  if (!row) return null;

  const jobSpec = JSON.parse(row.spec_json) as JobSpecV1;
  const candidates = await listCandidateProviders(env);
  const filtered = hardFilterProviders(jobSpec, candidates as ProviderSnapshot[]);
  const ranked = rankProviders(jobSpec, filtered);
  if (ranked.length === 0) return null;

  const primary = ranked[0];
  const standby = ranked[1] ?? null;

  const reserved = await reserveProvider(env, primary.provider.provider_id, jobId);
  if (!reserved) {
    return null;
  }

  const decision: AllocationDecisionV1 = {
    job_id: jobId,
    selected_provider_id: primary.provider.provider_id,
    standby_provider_id: standby?.provider.provider_id ?? null,
    reservation_ttl_seconds: 30,
    score_breakdown: {
      reliability: primary.reliability,
      benchmark_fit: primary.benchmark_fit,
      price: primary.price,
      latency: primary.latency,
      uptime: primary.uptime,
      total: primary.total
    },
    price_per_gpu_hour_usd: primary.provider.price_per_gpu_hour_usd
  };

  await env.DB.prepare(
    `INSERT INTO allocations (
      id,
      job_id,
      provider_id,
      standby_provider_id,
      reservation_ttl_seconds,
      score_breakdown_json,
      price_per_gpu_hour_usd,
      created_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'))`
  )
    .bind(
      crypto.randomUUID(),
      decision.job_id,
      decision.selected_provider_id,
      decision.standby_provider_id,
      decision.reservation_ttl_seconds,
      JSON.stringify(decision.score_breakdown),
      decision.price_per_gpu_hour_usd
    )
    .run();

  await env.DB.prepare(
    `UPDATE jobs
      SET status = 'reserved',
          assigned_provider_id = ?2,
          standby_provider_id = ?3,
          reservation_expires_at = datetime('now', '+30 seconds'),
          updated_at = datetime('now')
      WHERE id = ?1`
  )
    .bind(jobId, decision.selected_provider_id, decision.standby_provider_id)
    .run();

  return decision;
}

export async function markProviderOffline(env: WorkerEnv, providerId: string, reason: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE providers
      SET status = 'offline',
          updated_at = datetime('now')
      WHERE id = ?1`
  )
    .bind(providerId)
    .run();

  const stub = env.MARKET_DO.get(env.MARKET_DO.idFromName("global"));
  await stub.fetch("https://market-do/providers/offline", {
    method: "POST",
    body: JSON.stringify({ provider_id: providerId, reason })
  });

  await env.DB.prepare(
    `INSERT INTO compliance_events (id, provider_id, event_type, event_json, created_at)
     VALUES (?1, ?2, 'provider_offline', ?3, datetime('now'))`
  )
    .bind(crypto.randomUUID(), providerId, JSON.stringify({ reason }))
    .run();
}
