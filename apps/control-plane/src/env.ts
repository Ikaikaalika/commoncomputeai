import type { AllocationDecisionV1, JobSpecV1, ProviderCapabilityV1, UsageRecordV1 } from "@commoncompute/contracts";

export type AppRole = "customer" | "provider" | "agent" | "admin";

export interface AuthClaims {
  sub: string;
  role: AppRole;
  provider_id?: string;
  iat: number;
  exp: number;
  iss: string;
}

export interface JobEventMessage {
  channel: "job-events";
  type: "job_created" | "job_failed" | "job_cancelled" | "requeue_job";
  job_id: string;
  reason?: string;
}

export interface ProviderEventMessage {
  channel: "provider-events";
  type: "provider_heartbeat" | "provider_offline" | "provider_registered" | "provider_allocated";
  provider_id: string;
  job_id?: string;
}

export interface BillingEventMessage {
  channel: "billing-events";
  type: "usage_recorded" | "invoice_settle" | "payout_ready";
  job_id?: string;
  provider_id?: string;
  usage?: UsageRecordV1;
}

export interface ProviderSnapshot {
  provider_id: string;
  display_name?: string;
  kyc_status: "pending" | "verified" | "rejected";
  jurisdiction: string;
  status: "online" | "offline" | "draining";
  last_heartbeat_at: string | null;
  reliability_score: number;
  uptime_score: number;
  latency_score: number;
  price_per_gpu_hour_usd: number;
  capability: ProviderCapabilityV1;
}

export interface CandidateScore {
  provider: ProviderSnapshot;
  reliability: number;
  benchmark_fit: number;
  price: number;
  latency: number;
  uptime: number;
  total: number;
}

export interface AllocationRequest {
  job_id: string;
  job_spec: JobSpecV1;
  candidates: ProviderSnapshot[];
}

export interface AllocationResult {
  accepted: boolean;
  decision?: AllocationDecisionV1;
  reason?: string;
}

export interface TrainingWorkflowParams {
  job_id: string;
}

export interface AppBindings {
  APP_ENV: string;
  JWT_ISSUER: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  DB: D1Database;
  SESSION_CACHE: KVNamespace;
  ARTIFACTS: R2Bucket;
  EVIDENCE: R2Bucket;
  JOB_EVENTS: Queue<JobEventMessage>;
  PROVIDER_EVENTS: Queue<ProviderEventMessage>;
  BILLING_EVENTS: Queue<BillingEventMessage>;
  MARKET_DO: DurableObjectNamespace;
  PROVIDER_DO: DurableObjectNamespace;
  TRAINING_WORKFLOW: Workflow<TrainingWorkflowParams>;
}

export type WorkerEnv = AppBindings;
