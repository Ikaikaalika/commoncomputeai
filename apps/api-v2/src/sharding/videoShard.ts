// Video sharding: splits long video at GOP boundaries; reassembles with concat demuxer.
//
// TODO Phase M4 full implementation:
// - Use ffmpeg WASM (GOP-aware segment command) to produce N segment files
// - Each segment stored as R2 object; each mapped to a vt_transcode sub-task
// - Aggregator: ffmpeg concat demuxer; remux audio from original track
//
// For MVP: single task per submission; no sharding.

import type { Env } from '../types';
import { enqueueTask } from '../routes/taskQueue';

export async function shardVideo(
  env: Env,
  parentJobId: string,
  videoR2Key: string,
  codec: string,
  bitrateKbps: number,
  customerId: string
): Promise<string[]> {
  const taskId = crypto.randomUUID();
  await enqueueTask(env, {
    id: taskId,
    type: 'vt_transcode',
    requirements: { runtime: 'vt_transcode' },
    priority: 'standard',
    input_uri: `r2://commoncompute-artifacts/${videoR2Key}`,
    customer_id: customerId,
    metadata: { parent_job_id: parentJobId, codec, bitrate_kbps: bitrateKbps },
  });
  return [taskId];
}
