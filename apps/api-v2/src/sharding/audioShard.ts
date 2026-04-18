// Audio sharding: splits long audio into 60s chunks with 2s overlap for Whisper.
// VAD-based chunking happens at the Worker before enqueue; each chunk is a separate task.
//
// TODO Phase M4 full implementation:
// 1. VAD pass using bundled silero-VAD WASM CoreML model at the edge
// 2. Generate N sub-tasks with {job_id, chunk_index, total_chunks, overlap_start, overlap_end}
// 3. Aggregate: stitch transcripts by word-timestamp alignment, dedupe overlap regions
//
// For MVP, we rely on the Mac runner to handle files up to 2 hours; sharding kicks in for >2h.

import type { Env } from '../types';
import { enqueueTask } from '../routes/taskQueue';
import { r2InputKey } from '../r2/presign';

const MAX_CHUNK_BYTES = 50 * 1024 * 1024; // 50 MB per chunk

export async function shardAudio(
  env: Env,
  parentJobId: string,
  audioR2Key: string,
  customerId: string
): Promise<string[]> {
  // TODO: VAD-based chunking. For now: single task (no sharding) up to MAX_CHUNK_BYTES.
  const taskId = crypto.randomUUID();
  await enqueueTask(env, {
    id: taskId,
    type: 'whisper_ane',
    requirements: { runtime: 'whisper_ane', prefers_ane: true },
    priority: 'standard',
    input_uri: `r2://commoncompute-artifacts/${audioR2Key}`,
    customer_id: customerId,
    metadata: { parent_job_id: parentJobId, chunk_index: 0, total_chunks: 1 },
  });
  return [taskId];
}

export async function aggregateTranscript(
  env: Env,
  taskIds: string[]
): Promise<string> {
  const segments: string[] = [];
  for (const taskId of taskIds) {
    const task = await env.DB.prepare(`SELECT result_uri FROM tasks WHERE id = ?`)
      .bind(taskId)
      .first<{ result_uri: string | null }>();
    if (!task?.result_uri) continue;
    const obj = await env.ARTIFACTS.get(task.result_uri.replace(/^r2:\/\/[^/]+\//, ''));
    if (!obj) continue;
    const result = await new Response(obj.body).json<{ text: string }>();
    segments.push(result.text);
  }
  // TODO: overlap deduplication by word timestamps.
  return segments.join(' ');
}
