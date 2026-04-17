import { z } from "zod";

export const WorkloadTypeSchema = z.enum(["inference", "training"]);
export type WorkloadType = z.infer<typeof WorkloadTypeSchema>;

export const RuntimeAdapterSchema = z.enum(["cuda", "rocm", "metal"]);
export type RuntimeAdapter = z.infer<typeof RuntimeAdapterSchema>;

export const OSTypeSchema = z.enum(["linux", "windows", "macos"]);
export type OSType = z.infer<typeof OSTypeSchema>;

export const KycStatusSchema = z.enum(["pending", "verified", "rejected"]);
export type KycStatus = z.infer<typeof KycStatusSchema>;

export const SlaTierSchema = z.enum(["best_effort", "standard", "critical"]);
export type SlaTier = z.infer<typeof SlaTierSchema>;

export const NetworkPolicySchema = z.object({
  egress_default_deny: z.boolean().default(true),
  allowlist_domains: z.array(z.string()).default([]),
  allowlist_cidrs: z.array(z.string()).default([]),
  dns_policy: z.enum(["platform", "provider"]).default("platform")
});
export type NetworkPolicyV1 = z.infer<typeof NetworkPolicySchema>;

export const GpuConstraintsSchema = z.object({
  runtime: RuntimeAdapterSchema,
  min_vram_gb: z.number().positive(),
  min_gpu_count: z.number().int().positive().default(1),
  model_allowlist: z.array(z.string()).default([]),
  jurisdiction_allowlist: z.array(z.string()).default(["US"])
});

export const JobSpecSchema = z.object({
  workload_type: WorkloadTypeSchema,
  image: z.string().min(1),
  command: z.array(z.string()).min(1),
  gpu_constraints: GpuConstraintsSchema,
  network_policy: NetworkPolicySchema.default({
    egress_default_deny: true,
    allowlist_domains: [],
    allowlist_cidrs: [],
    dns_policy: "platform"
  }),
  mounts: z.array(z.string()).default([]),
  budget_cap_usd: z.number().positive(),
  sla_tier: SlaTierSchema.default("standard")
});
export type JobSpecV1 = z.infer<typeof JobSpecSchema>;

export const ProviderCapabilitySchema = z.object({
  provider_id: z.string(),
  os: OSTypeSchema,
  adapter: RuntimeAdapterSchema,
  gpu_count: z.number().int().positive(),
  gpu_model: z.string().min(1),
  vram_gb: z.number().positive(),
  driver_version: z.string().min(1),
  runtime_version: z.string().min(1),
  benchmark_score: z.number().nonnegative(),
  attestation_hash: z.string().min(1),
  reliability_score: z.number().min(0).max(1)
});
export type ProviderCapabilityV1 = z.infer<typeof ProviderCapabilitySchema>;

export const AllocationDecisionSchema = z.object({
  job_id: z.string(),
  selected_provider_id: z.string(),
  standby_provider_id: z.string().nullable(),
  reservation_ttl_seconds: z.number().int().positive().default(30),
  score_breakdown: z.object({
    reliability: z.number(),
    benchmark_fit: z.number(),
    price: z.number(),
    latency: z.number(),
    uptime: z.number(),
    total: z.number()
  }),
  price_per_gpu_hour_usd: z.number().positive()
});
export type AllocationDecisionV1 = z.infer<typeof AllocationDecisionSchema>;

export const UsageRecordSchema = z.object({
  job_id: z.string(),
  provider_id: z.string(),
  gpu_seconds: z.number().nonnegative(),
  storage_gb_hours: z.number().nonnegative().default(0),
  egress_bytes: z.number().nonnegative().default(0),
  billable_amount_usd: z.number().nonnegative(),
  payout_amount_usd: z.number().nonnegative(),
  hold_release_at: z.string()
});
export type UsageRecordV1 = z.infer<typeof UsageRecordSchema>;

export const AgentPollResponseSchema = z.object({
  assigned: z.boolean(),
  job_id: z.string().nullable(),
  job_spec: JobSpecSchema.nullable()
});
export type AgentPollResponse = z.infer<typeof AgentPollResponseSchema>;

export const JobStatusSchema = z.enum([
  "queued",
  "reserved",
  "running",
  "completed",
  "failed",
  "cancelled"
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const ProviderStatusSchema = z.enum(["online", "offline", "draining"]);
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.unknown().optional()
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
