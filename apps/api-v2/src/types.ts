export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  ROUTER: Fetcher;
  JWT_SECRET: string;
  ARGON2_PEPPER: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  ENVIRONMENT: string;
  BOOTSTRAP_TOKEN?: string;   // alpha-only; unset to disable admin routes
  MAX_INPUT_SIZE_MB?: string;
  // Cloudflare native rate-limiting binding (see wrangler.toml).
  // Missing at dev time if you don't run against a real worker.
  RL_REGISTER?: { limit: (opts: { key: string }) => Promise<{ success: boolean }> };
}

export interface User {
  id: string;
  email: string;
  role: string;
  created_at: number;
}

export interface ApiKey {
  id: string;
  user_id: string;
  prefix: string;
  hash: string;
  scopes: string[];
  created_at: number;
  last_used_at?: number;
  revoked_at?: number;
}
