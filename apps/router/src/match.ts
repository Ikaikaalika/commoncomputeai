import type { CapabilityProfile, Task } from './types';

// Returns true if a device's capabilities satisfy a task's requirements.
export function deviceMatchesTask(caps: CapabilityProfile, task: Task): boolean {
  const req = task.requirements;

  // Runtime must be advertised.
  if (!caps.runtimes.includes(req.runtime)) return false;

  // Reliability threshold.
  // (reliability is checked by the caller against the device row, not here)

  // ANE preference: require ANE available when task prefers it.
  if (req.prefers_ane && !caps.ane.available) return false;

  // Minimum VRAM (expressed as unified memory for Apple Silicon).
  if (req.min_vram_gb !== undefined && caps.memory_gb < req.min_vram_gb) return false;

  return true;
}

// Returns a reliability-weighted score for routing decisions (higher = preferred).
export function deviceScore(reliability: number, caps: CapabilityProfile, task: Task): number {
  let score = reliability * 1000;

  // Prefer ANE-capable devices for ANE tasks.
  if (task.requirements.prefers_ane && caps.ane.available) {
    score += caps.ane.tops * 10;
  }

  // Prefer more GPU cores for GPU tasks.
  if (['mlx_llm', 'mlx_image'].includes(task.type)) {
    score += caps.gpu.cores;
  }

  return score;
}
