// Common Compute MVP smoke test runner
// All 10 scenarios must pass before Stripe integration begins.
//
// Usage:
//   CC_TEST_KEY=cc_test_... API_BASE=https://api-staging.commoncompute.ai/v1 pnpm smoke
//
// Requires:
//   - At least 1 Mac provider running the daemon and enrolled in staging
//   - For tests 4/6/7: at least 2 Mac providers
//   - Test fixtures in tests/fixtures/: sample-1min.mp3, sample-1min-4k.mov, sample-image.jpg

import { testOpenAISDKDropIn } from './openai-sdk.test';
import { testCustomEndpoints } from './custom.test';
import { testCapabilityDetection } from './capability.test';
import { testDurableRouting, testThermalGating } from './durability.test';
import { testConcurrentEngines, testPerEngineQueueCaps } from './concurrency.test';
import { testPriorityTier, testIdempotency, testReliabilityDecay } from './priority.test';

const tests: Array<{ name: string; fn: () => Promise<void> }> = [
  { name: '1. OpenAI SDK drop-in', fn: testOpenAISDKDropIn },
  { name: '2. Custom endpoints', fn: testCustomEndpoints },
  { name: '3. Capability detection accuracy', fn: testCapabilityDetection },
  { name: '4. Durable routing on device loss', fn: testDurableRouting },
  { name: '5. Thermal gating', fn: testThermalGating },
  { name: '6. Concurrent engines on one Mac', fn: testConcurrentEngines },
  { name: '7. Per-engine queue caps', fn: testPerEngineQueueCaps },
  { name: '8. Priority tier replication', fn: testPriorityTier },
  { name: '9. Idempotency', fn: testIdempotency },
  { name: '10. Reliability decay + blacklist', fn: testReliabilityDecay },
];

async function main() {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  console.log('═══════════════════════════════════════════════════════');
  console.log(' Common Compute MVP Smoke Tests');
  console.log(`═══════════════════════════════════════════════════════`);

  for (const test of tests) {
    console.log(`\n▶ ${test.name}`);
    try {
      await test.fn();
      console.log(`  ✅ PASS`);
      passed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ FAIL: ${msg}`);
      failures.push(`${test.name}: ${msg}`);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(` Results: ${passed}/${tests.length} passed`);
  if (failures.length > 0) {
    console.log('\n Failures:');
    failures.forEach((f) => console.log(`  - ${f}`));
    console.log('\n ⛔ Stripe integration blocked until all tests pass.');
    process.exit(1);
  } else {
    console.log('\n ✅ All smoke tests passed. Stripe integration can proceed.');
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
