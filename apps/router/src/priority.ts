import type { Task, TaskPriority } from './types';

// Priority-tier FIFO queues within each RouterShard.
// Priority tasks dispatch to 2 devices; first complete wins, other gets cancel.
// Batch tasks drain only when priority + standard are empty.

export function compareTasks(a: Task, b: Task): number {
  const order: Record<TaskPriority, number> = { priority: 0, standard: 1, batch: 2 };
  const diff = order[a.priority] - order[b.priority];
  if (diff !== 0) return diff;
  return a.created_at - b.created_at;
}

export function shouldDispatchBatch(
  priorityCount: number,
  standardCount: number
): boolean {
  return priorityCount === 0 && standardCount === 0;
}

// For priority-tier tasks, we send to 2 devices and take the first result.
export function replicationFactor(priority: TaskPriority): number {
  return priority === 'priority' ? 2 : 1;
}
