// Global test accounts — shared by every test surface (seed scripts,
// e2e tests, manual Mac-app verification). Two accounts: one on each
// side of the marketplace.
//
// Safe to commit — these are test-only credentials in a test user row.
// The customer API key is minted out-of-band via the admin endpoint
// and is NOT stored in git (rotates on each bootstrap).

export const PROVIDER_ACCOUNT = {
  email: 'test@commoncompute.local',
  password: 'CCTestPass!2026',
  fullName: 'Common Compute Test',
  role: 'provider',
} as const;

export const CUSTOMER_ACCOUNT = {
  email: 'customer@commoncompute.local',
  fullName: 'Common Compute Customer',
  role: 'customer',
  // API key comes from `/v1/admin/bootstrap-customer` (alpha endpoint).
  // For CI, set CC_TEST_CUSTOMER_KEY env var.
} as const;

// Backwards-compat alias — earlier commits imported TEST_ACCOUNT (provider).
export const TEST_ACCOUNT = PROVIDER_ACCOUNT;

// Fake capability profile shaped like what the Mac app sends on enroll.
// Used by e2e tests that need to register a device without running the
// real Swift `CapabilityProber`.
export const TEST_CAPABILITY = {
  chip: 'Apple M-Test',
  cpu: { performance_cores: 8, efficiency_cores: 4, logical: 12 },
  gpu: { family: 'apple_m_test', cores: 38, metal_3: true, recommended_max_working_set_gb: 48 },
  ane: { available: true, generation: 17, tops: 38 },
  media: { encoders: ['hevc'], decoders: ['hevc', 'h264'], engines: 2 },
  memory_gb: 64,
  runtimes: ['coreml_embed', 'mlx_llm', 'cpu_bench'],
  os: 'macOS 14.0 (test)',
} as const;
