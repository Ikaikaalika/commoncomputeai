// Smoke test 3: Capability detection accuracy
// Requires a real Apple Silicon Mac running the provider daemon.
// Verifies that the D1 device row contains correct hardware fields.

import { BASE_URL, API_KEY, assert } from './helpers';

export async function testCapabilityDetection(): Promise<void> {
  console.log('  [3] Capability detection accuracy…');

  // Query the device row for our test device.
  const res = await fetch(`${BASE_URL}/providers/me/device`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  assert(res.ok, `GET /v1/providers/me/device returned ${res.status}`);

  const device = await res.json<{
    capabilities: {
      chip: string;
      cpu: { performance_cores: number; efficiency_cores: number };
      gpu: { cores: number; family: string };
      ane: { available: boolean; generation: number; tops: number };
      media: { encoders: string[]; decoders: string[]; engines: number };
      memory_gb: number;
      runtimes: string[];
    };
  }>();

  const cap = device.capabilities;

  assert(cap.chip.startsWith('Apple'), `chip name starts with Apple: got ${cap.chip}`);
  assert(cap.cpu.performance_cores > 0, 'P-cores > 0');
  assert(cap.cpu.efficiency_cores > 0, 'E-cores > 0');
  assert(cap.gpu.cores > 0, 'GPU cores > 0');
  assert(cap.gpu.family.startsWith('apple'), `GPU family starts with apple: ${cap.gpu.family}`);
  assert(cap.ane.available, 'ANE available');
  assert(cap.ane.generation > 0, 'ANE generation > 0');
  assert(cap.ane.tops > 0, 'ANE TOPS > 0');
  assert(cap.media.engines > 0, 'media engines > 0');
  assert(cap.media.encoders.includes('hevc'), 'HEVC encoder present');
  assert(cap.media.decoders.includes('h264'), 'H.264 decoder present');
  assert(cap.memory_gb >= 8, 'memory >= 8 GB');
  assert(cap.runtimes.includes('whisper_ane'), 'whisper_ane runtime advertised');
  assert(cap.runtimes.includes('coreml_embed'), 'coreml_embed runtime advertised');

  console.log('      ✓ chip:', cap.chip);
  console.log('      ✓ CPU:', cap.cpu.performance_cores + 'P/' + cap.cpu.efficiency_cores + 'E');
  console.log('      ✓ GPU:', cap.gpu.cores, 'cores', cap.gpu.family);
  console.log('      ✓ ANE gen', cap.ane.generation, cap.ane.tops, 'TOPS');
  console.log('      ✓ media engines:', cap.media.engines);
  console.log('      ✓ runtimes:', cap.runtimes.join(', '));
}
