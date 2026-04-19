// Global test account — one user, reused by every test surface.
//
// Import this from seed scripts, e2e tests, manual Mac-app testing,
// and any future smoke/integration runs. Keeping credentials in one
// place means: (a) no duplicate rows in D1, (b) one password to type
// during manual verification, (c) test data is easy to grep for and
// delete later.
//
// Safe to commit: this is a test-only account in the test DB. It has
// no real compute, no payouts, and the password is intentionally weak
// enough that nobody confuses it with production credentials.

export const TEST_ACCOUNT = {
  email: 'test@commoncompute.local',
  password: 'CCTestPass!2026',
  fullName: 'Common Compute Test',
} as const;

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
