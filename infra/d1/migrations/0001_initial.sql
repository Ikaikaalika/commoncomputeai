PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'provider', 'agent', 'admin')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'draining')),
  kyc_status TEXT NOT NULL CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  kyc_verified_at TEXT,
  last_heartbeat_at TEXT,
  reliability_score REAL NOT NULL DEFAULT 0.75,
  uptime_score REAL NOT NULL DEFAULT 0.8,
  latency_score REAL NOT NULL DEFAULT 0.8,
  price_per_gpu_hour_usd REAL NOT NULL DEFAULT 1.5,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS provider_capabilities (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL UNIQUE,
  os TEXT NOT NULL CHECK (os IN ('linux', 'windows', 'macos')),
  adapter TEXT NOT NULL CHECK (adapter IN ('cuda', 'rocm', 'metal')),
  gpu_count INTEGER NOT NULL,
  gpu_model TEXT NOT NULL,
  vram_gb REAL NOT NULL,
  driver_version TEXT NOT NULL,
  runtime_version TEXT NOT NULL,
  benchmark_score REAL NOT NULL,
  attestation_hash TEXT NOT NULL,
  reliability_score REAL NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'reserved', 'running', 'completed', 'failed', 'cancelled')),
  workload_type TEXT NOT NULL CHECK (workload_type IN ('inference', 'training')),
  spec_json TEXT NOT NULL,
  budget_cap_usd REAL NOT NULL,
  sla_tier TEXT NOT NULL CHECK (sla_tier IN ('best_effort', 'standard', 'critical')),
  assigned_provider_id TEXT,
  standby_provider_id TEXT,
  reservation_expires_at TEXT,
  workflow_instance_id TEXT,
  failure_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_provider_id) REFERENCES providers(id),
  FOREIGN KEY (standby_provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS allocations (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  standby_provider_id TEXT,
  reservation_ttl_seconds INTEGER NOT NULL,
  score_breakdown_json TEXT NOT NULL,
  price_per_gpu_hour_usd REAL NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (standby_provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS job_events (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  gpu_seconds REAL NOT NULL,
  storage_gb_hours REAL NOT NULL DEFAULT 0,
  egress_bytes INTEGER NOT NULL DEFAULT 0,
  billable_amount_usd REAL NOT NULL,
  payout_amount_usd REAL NOT NULL,
  hold_release_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  customer_user_id TEXT,
  status TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  external_ref TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payout_ledger (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  job_id TEXT,
  amount_usd REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('held', 'available', 'paid', 'void')),
  hold_release_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS compliance_events (
  id TEXT PRIMARY KEY,
  provider_id TEXT,
  event_type TEXT NOT NULL,
  event_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_provider ON jobs(assigned_provider_id, status);
CREATE INDEX IF NOT EXISTS idx_job_events_job_created_at ON job_events(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payout_ledger_provider_status ON payout_ledger(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_providers_status_kyc ON providers(status, kyc_status);
