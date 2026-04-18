import OpenAI from 'openai';

export const BASE_URL = process.env.API_BASE ?? 'https://api-staging.commoncompute.ai/v1';
export const API_KEY = process.env.CC_TEST_KEY ?? '';

if (!API_KEY) {
  console.error('CC_TEST_KEY env var required');
  process.exit(1);
}

export const openai = new OpenAI({
  apiKey: API_KEY,
  baseURL: BASE_URL,
});

export async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function pollJob(
  jobId: string,
  timeoutMs = 120_000,
  intervalMs = 2000
): Promise<{ state: string; result_uri?: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const job = await res.json<{ state: string; result_uri?: string }>();
    if (job.state === 'completed') return job;
    if (job.state === 'failed' || job.state === 'dead_letter') {
      throw new Error(`Job ${jobId} failed with state ${job.state}`);
    }
    await sleep(intervalMs);
  }
  throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
}

export function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

export function assertShape(obj: unknown, fields: string[], label: string): void {
  for (const field of fields) {
    assert(field in (obj as Record<string, unknown>), `${label} missing field: ${field}`);
  }
}
