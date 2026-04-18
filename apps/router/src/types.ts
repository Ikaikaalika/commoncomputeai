export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  ROUTER_SHARD: DurableObjectNamespace;
  DEVICE_SESSION: DurableObjectNamespace;
  JWT_SECRET: string;
  ARGON2_PEPPER: string;
  ENVIRONMENT: string;
}

export type TaskType =
  | 'whisper_ane'
  | 'coreml_embed'
  | 'coreml_vision'
  | 'vt_transcode'
  | 'mlx_llm'
  | 'mlx_image';

export type TaskPriority = 'batch' | 'standard' | 'priority';
export type TaskState = 'queued' | 'leased' | 'completed' | 'failed' | 'dead_letter';

export interface TaskRequirements {
  runtime: string;
  prefers_ane?: boolean;
  min_reliability?: number;
  min_vram_gb?: number;
}

export interface Task {
  id: string;
  type: TaskType;
  requirements: TaskRequirements;
  priority: TaskPriority;
  state: TaskState;
  attempts: number;
  max_attempts: number;
  idempotency_key?: string;
  input_uri?: string;
  result_uri?: string;
  parent_job_id?: string;
  customer_id: string;
  created_at: number;
  completed_at?: number;
}

export interface TaskLease {
  task_id: string;
  device_id: string;
  leased_at: number;
  expires_at: number;
  heartbeat_at?: number;
  attempt: number;
}

export interface CapabilityProfile {
  chip: string;
  cpu: { performance_cores: number; efficiency_cores: number; logical: number };
  gpu: { family: string; cores: number; metal_3: boolean; recommended_max_working_set_gb: number };
  ane: { available: boolean; generation: number; tops: number };
  media: { encoders: string[]; decoders: string[]; engines: number };
  memory_gb: number;
  runtimes: string[];
  os: string;
  cluster?: {
    id: string;
    role: string;
    peers: string[];
    interconnect: string;
    aggregate_memory_gb: number;
    aggregate_gpu_cores: number;
    peer_bandwidth_gbps: number;
  };
}

export interface Device {
  id: string;
  user_id: string;
  capabilities: CapabilityProfile;
  reliability: number;
  attestation_pubkey?: string;
  last_heartbeat_at?: number;
  created_at: number;
}
