-- Common Compute D1 schema — MVP

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- argon2id
  role TEXT NOT NULL DEFAULT 'customer',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  prefix TEXT NOT NULL,         -- 'cc_live_xxxx' display-only
  hash TEXT NOT NULL,           -- argon2id
  scopes TEXT NOT NULL,         -- JSON array
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  capabilities TEXT NOT NULL,   -- JSON CapabilityProfile
  reliability REAL DEFAULT 1.0,
  attestation_pubkey TEXT,      -- Ed25519 public key (hex)
  last_heartbeat_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_devices_heartbeat ON devices(last_heartbeat_at);
CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'whisper_ane' | 'coreml_embed' | etc.
  requirements TEXT NOT NULL,   -- JSON TaskRequirements
  priority TEXT NOT NULL,       -- 'batch' | 'standard' | 'priority'
  state TEXT NOT NULL,          -- 'queued' | 'leased' | 'completed' | 'failed' | 'dead_letter'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  idempotency_key TEXT UNIQUE,
  input_uri TEXT,               -- R2 key or external URL
  result_uri TEXT,
  parent_job_id TEXT,           -- for sharded sub-tasks
  customer_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_tasks_match ON tasks(type, state, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_job_id);
CREATE INDEX IF NOT EXISTS idx_tasks_customer ON tasks(customer_id);

CREATE TABLE IF NOT EXISTS task_leases (
  task_id TEXT PRIMARY KEY REFERENCES tasks(id),
  device_id TEXT NOT NULL REFERENCES devices(id),
  leased_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  heartbeat_at INTEGER,
  attempt INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_leases_expiry ON task_leases(expires_at);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  entry_type TEXT NOT NULL,     -- 'charge' | 'provider_earning' | 'platform_fee'
  amount_cents INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  CHECK (amount_cents != 0)
);
CREATE INDEX IF NOT EXISTS idx_ledger_transaction ON ledger_entries(transaction_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  ip TEXT,
  metadata TEXT,               -- JSON
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
