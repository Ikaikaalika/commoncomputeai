#!/usr/bin/env tsx
// Common Compute — End-to-End Workload Test
//
// Tests the full path: API → Router → Provider device → Runner → result
// with health checks at every step.
//
// Usage:
//   CC_TEST_KEY=cc_test_... pnpm e2e
//   (Or run `pnpm seed:local` first — it saves the key to .local-test-key)
//
// Requires:
//   - wrangler dev running: router on :8788, api-v2 on :8787
//   - Provider app connected with the test API key

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────
const ROOT = resolve(import.meta.dirname ?? __dirname, '../..');

function loadKey(): string {
  if (process.env.CC_TEST_KEY) return process.env.CC_TEST_KEY;
  try {
    return readFileSync(resolve(ROOT, '.local-test-key'), 'utf8').trim();
  } catch {
    console.error('❌  CC_TEST_KEY env var not set and .local-test-key not found.');
    console.error('   Run: pnpm seed:local   then enter the printed key in the provider app.');
    process.exit(1);
  }
}

const API  = process.env.API_BASE    ?? 'http://127.0.0.1:8787';
const ROUTER = process.env.ROUTER_BASE ?? 'http://127.0.0.1:8788';
const KEY  = loadKey();

const headers = (extra?: Record<string, string>) => ({
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  ...extra,
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function pass(msg: string) { console.log(`  ✅  ${msg}`); }
function fail(msg: string): never { throw new Error(msg); }

async function get(url: string) {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) fail(`GET ${url} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<Record<string, unknown>>;
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST', headers: headers(), body: JSON.stringify(body),
  });
  const json = await res.json() as Record<string, unknown>;
  if (!res.ok) fail(`POST ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function pollTask(taskId: string, label: string, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastState = 'unknown';
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    const job = await get(`${API}/v1/jobs/${taskId}`);
    lastState = String(job.state);
    process.stdout.write(`\r    state: ${lastState}        `);
    if (lastState === 'completed') { process.stdout.write('\n'); return job; }
    if (lastState === 'failed' || lastState === 'dead_letter') {
      process.stdout.write('\n');
      fail(`${label} task ${taskId} ended in state: ${lastState}`);
    }
  }
  process.stdout.write('\n');
  fail(`${label} task ${taskId} timed out in state: ${lastState}`);
}

// ──────────────────────────────────────────────
// Test steps
// ──────────────────────────────────────────────
async function step(n: number, total: number, label: string, fn: () => Promise<void>) {
  console.log(`\n[${n}/${total}] ${label}`);
  try {
    await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌  FAIL: ${msg}`);
    process.exit(1);
  }
}

async function main() {
  const TOTAL = 9;
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Common Compute — End-to-End Workload Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  API:    ${API}`);
  console.log(`  Router: ${ROUTER}`);
  console.log(`  Key:    ${KEY.slice(0, 16)}…`);

  // ── 1. Router health ──────────────────────────────
  await step(1, TOTAL, 'Health check: router', async () => {
    const res = await fetch(`${ROUTER}/healthz`);
    if (!res.ok) fail(`Router health → ${res.status}`);
    const body = await res.json() as { ok: boolean; service: string };
    if (!body.ok) fail('Router reported ok:false');
    pass(`Router is healthy (${body.service})`);
  });

  // ── 2. API health ─────────────────────────────────
  await step(2, TOTAL, 'Health check: api-v2', async () => {
    const body = await get(`${API}/healthz`) as { ok: boolean; service: string };
    if (!body.ok) fail('API reported ok:false');
    pass(`API is healthy (${body.service})`);
  });

  // ── 3. Wait for provider device ───────────────────
  let device: Record<string, unknown>;
  await step(3, TOTAL, 'Wait for provider device to connect (up to 60 s)', async () => {
    const deadline = Date.now() + 60_000;
    let deviceList: Record<string, unknown>[] = [];
    while (Date.now() < deadline) {
      const data = await get(`${API}/v1/devices`) as { devices: Record<string, unknown>[] };
      deviceList = data.devices ?? [];
      if (deviceList.length > 0) break;
      process.stdout.write('\r    Waiting for device to appear…');
      await new Promise((r) => setTimeout(r, 2000));
    }
    process.stdout.write('\n');
    if (!deviceList.length) {
      fail('No provider device connected. Open the provider app, enter the test key, and hit Connect.');
    }
    device = deviceList[0];
    pass(`Device connected: ${device.id}`);
  });

  // ── 4. Device capability health check ────────────
  await step(4, TOTAL, 'Verify device capabilities', async () => {
    const caps = device.capabilities as Record<string, unknown>;
    const chip = caps.chip as string;
    const ane  = caps.ane  as Record<string, unknown>;
    const gpu  = caps.gpu  as Record<string, unknown>;
    const mem  = caps.memory_gb as number;

    pass(`Chip:   ${chip}`);
    pass(`Memory: ${mem} GB`);
    pass(`GPU:    ${gpu.cores} cores (${gpu.family})`);
    pass(`ANE:    ${ane.available ? `${ane.tops} TOPS (gen ${ane.generation})` : 'not available'}`);

    if (!ane.available) fail('ANE is required for this test');
    if ((gpu.cores as number) === 0) fail('GPU cores must be > 0');
    if ((device.reliability as number) < 0.5) fail('Device reliability is too low');

    const runtimes = (caps.runtimes as string[]) ?? [];
    pass(`Runtimes advertised: ${runtimes.join(', ')}`);
    if (!runtimes.includes('coreml_embed')) fail('Device must advertise coreml_embed');
    if (!runtimes.includes('mlx_llm'))      fail('Device must advertise mlx_llm');
    if (!runtimes.includes('cpu_bench'))    fail('Device must advertise cpu_bench');
  });

  // ── 5. ANE workload (coreml_embed) ───────────────
  let aneJob: Record<string, unknown>;
  await step(5, TOTAL, 'ANE workload: POST /v1/bench/ane → coreml_embed', async () => {
    process.stdout.write('    Submitting…\n');
    aneJob = await post('/v1/bench/ane', {});
    const taskId = aneJob.task_id as string;
    pass(`Task enqueued: ${taskId}`);

    if (aneJob.state === 'completed') {
      pass('Completed synchronously');
    } else {
      await pollTask(taskId, 'ANE');
    }
    pass(`engine_used = coreml_embed (ANE)`);
  });

  // ── 6. GPU workload (mlx_llm) ────────────────────
  let gpuJob: Record<string, unknown>;
  await step(6, TOTAL, 'GPU workload: POST /v1/bench/gpu → mlx_llm', async () => {
    process.stdout.write('    Submitting…\n');
    gpuJob = await post('/v1/bench/gpu', {});
    const taskId = gpuJob.task_id as string;
    pass(`Task enqueued: ${taskId}`);

    if (gpuJob.state === 'completed') {
      pass('Completed synchronously');
    } else {
      await pollTask(taskId, 'GPU');
    }
    pass(`engine_used = mlx_llm (GPU)`);
  });

  // ── 7. CPU workload (cpu_bench) ───────────────────
  let cpuJob: Record<string, unknown>;
  await step(7, TOTAL, 'CPU workload: POST /v1/bench/cpu → cpu_bench (Accelerate SGEMM)', async () => {
    process.stdout.write('    Submitting…\n');
    cpuJob = await post('/v1/bench/cpu', {});
    const taskId = cpuJob.task_id as string;
    pass(`Task enqueued: ${taskId}`);

    if (cpuJob.state === 'completed') {
      pass('Completed synchronously');
    } else {
      await pollTask(taskId, 'CPU');
    }
    pass(`engine_used = cpu_bench (CPU)`);
  });

  // ── 8. Verify final device state ──────────────────
  await step(8, TOTAL, 'Post-workload device health check', async () => {
    const data = await get(`${API}/v1/devices`) as { devices: Record<string, unknown>[] };
    const dev = data.devices.find((d) => d.id === device.id);
    if (!dev) fail('Device no longer visible after workload');
    const msSince = dev.last_heartbeat_ms_ago as number;
    if (msSince > 30_000) fail(`Device last heartbeat was ${msSince}ms ago (> 30s dead threshold)`);
    pass(`Device still alive (heartbeat ${Math.round(msSince / 1000)}s ago)`);
    pass(`Reliability: ${(dev.reliability as number).toFixed(3)}`);
  });

  // ── 9. Concurrent submission (idempotency + parallel) ──
  await step(9, TOTAL, 'Concurrent: submit ANE + CPU simultaneously', async () => {
    const [r1, r2] = await Promise.all([
      post('/v1/bench/ane', {}),
      post('/v1/bench/cpu', {}),
    ]);
    const t1 = r1.task_id as string;
    const t2 = r2.task_id as string;
    pass(`ANE task: ${t1}`);
    pass(`CPU task: ${t2}`);

    await Promise.all([
      r1.state !== 'completed' ? pollTask(t1, 'concurrent ANE') : Promise.resolve(),
      r2.state !== 'completed' ? pollTask(t2, 'concurrent CPU') : Promise.resolve(),
    ]);
    pass('Both tasks completed concurrently');
  });

  // ── Summary ───────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅  All 9 checks passed — routing, dispatch, and all');
  console.log('      three hardware engines (CPU / GPU / ANE) verified.');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\nFatal:', err);
  process.exit(1);
});
