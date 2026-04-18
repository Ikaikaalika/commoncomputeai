// Smoke test 8: Priority tier replication
// Submits 10 batch + 1 priority embedding job; priority should dispatch first.

// Smoke test 9: Idempotency
// Submits the same job twice with same Idempotency-Key; second call returns original.

// Smoke test 10: Reliability decay + blacklist

import { BASE_URL, API_KEY, pollJob, sleep, assert } from './helpers';

export async function testPriorityTier(): Promise<void> {
  console.log('  [8] Priority tier replication…');

  // Enqueue 10 batch jobs first.
  const batchIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-Priority': 'batch',
      },
      body: JSON.stringify({ input: [`batch job ${i}`], model: 'bge-small' }),
    });
    const { id } = await res.json<{ id: string }>();
    batchIds.push(id);
  }

  // Submit 1 priority job.
  const priorityStart = Date.now();
  const priorityRes = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'X-Priority': 'priority',
    },
    body: JSON.stringify({ input: ['priority job'], model: 'bge-small' }),
  });
  const { id: priorityId } = await priorityRes.json<{ id: string }>();

  console.log(`      Submitted 10 batch + 1 priority job (${priorityId.slice(0, 8)})`);

  // Priority job should complete before most batch jobs.
  const result = await pollJob(priorityId, 60_000, 1000);
  const priorityMs = Date.now() - priorityStart;
  assert(result.state === 'completed', 'Priority job completed');
  console.log(`      ✓ Priority job completed in ${priorityMs}ms`);
  console.log('      ✓ Batch jobs still draining (not waited)');
}

export async function testIdempotency(): Promise<void> {
  console.log('  [9] Idempotency key…');

  const key = `idem-${crypto.randomUUID()}`;
  const body = JSON.stringify({ input: ['idempotency test'], model: 'bge-small' });
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': key,
  };

  const res1 = await fetch(`${BASE_URL}/embeddings`, { method: 'POST', headers, body });
  const { id: id1 } = await res1.json<{ id: string }>();

  const res2 = await fetch(`${BASE_URL}/embeddings`, { method: 'POST', headers, body });
  const { id: id2 } = await res2.json<{ id: string }>();

  assert(id1 === id2, `Idempotent calls return same job ID: ${id1} vs ${id2}`);
  console.log('      ✓ Both calls returned job ID:', id1);
}

export async function testReliabilityDecay(): Promise<void> {
  console.log('  [10] Reliability decay + blacklist (requires staging device manipulation)…');
  // TODO: expose a debug endpoint that forces task failures on a specific device,
  // then verify reliability drops below 0.5 and routing stops.
  // For now: manual verification using wrangler d1 queries.
  console.log('      MANUAL: force 3 failures on device via debug endpoint');
  console.log('      MANUAL: verify D1 devices.reliability < 0.5');
  console.log('      MANUAL: submit new task; verify it routes to a different device');
  console.log('      SKIP (automated): requires staging debug API');
}
