import type { Env } from '../types';
import { enqueueTask } from '../routes/taskQueue';
import { r2InputKey } from '../r2/presign';

const BATCH_SIZE = 256;

// Splits large embedding requests into BATCH_SIZE sub-tasks, returns parent job ID.
export async function shardEmbeddings(
  env: Env,
  parentJobId: string,
  inputs: string[],
  model: string,
  customerId: string
): Promise<string[]> {
  const taskIds: string[] = [];
  const batches = Math.ceil(inputs.length / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const chunk = inputs.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    const taskId = crypto.randomUUID();
    const r2Key = r2InputKey(taskId, 'inputs.json');

    await env.ARTIFACTS.put(r2Key, JSON.stringify(chunk), {
      httpMetadata: { contentType: 'application/json' },
    });

    await enqueueTask(env, {
      id: taskId,
      type: 'coreml_embed',
      requirements: { runtime: 'coreml_embed', prefers_ane: true },
      priority: 'batch',
      input_uri: `r2://commoncompute-artifacts/${r2Key}`,
      customer_id: customerId,
      metadata: { model, batch_index: i, total_batches: batches, parent_job_id: parentJobId },
    });
    taskIds.push(taskId);
  }

  return taskIds;
}

// Reassembles embedding vectors in original input order.
export async function aggregateEmbeddings(
  env: Env,
  taskIds: string[]
): Promise<number[][]> {
  const results: number[][] = [];
  for (const taskId of taskIds) {
    const task = await env.DB.prepare(`SELECT result_uri FROM tasks WHERE id = ?`)
      .bind(taskId)
      .first<{ result_uri: string | null }>();
    if (!task?.result_uri) continue;

    const obj = await env.ARTIFACTS.get(task.result_uri.replace(/^r2:\/\/[^/]+\//, ''));
    if (!obj) continue;

    const batch = await new Response(obj.body).json<{ data: Array<{ embedding: number[] }> }>();
    results.push(...batch.data.map((d) => d.embedding));
  }
  return results;
}
