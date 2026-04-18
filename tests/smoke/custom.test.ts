// Smoke test 2: Custom endpoints (VideoToolbox transcode, CoreML Vision classification)

import * as fs from 'fs';
import * as path from 'path';
import { BASE_URL, API_KEY, pollJob, assert, assertShape } from './helpers';

export async function testCustomEndpoints(): Promise<void> {
  const fixtures = path.resolve(__dirname, '../fixtures');

  console.log('  [2a] VideoToolbox transcode (1-min 4K → HEVC)…');
  const videoPath = path.join(fixtures, 'sample-1min-4k.mov');
  if (!fs.existsSync(videoPath)) {
    console.warn('      SKIP: fixtures/sample-1min-4k.mov not found');
  } else {
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(videoPath)], { type: 'video/quicktime' }), 'input.mov');
    form.append('codec', 'hevc');
    form.append('bitrate_kbps', '8000');

    const res = await fetch(`${BASE_URL}/video/transcode`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: form,
    });

    if (res.status === 202) {
      const { id } = await res.json<{ id: string }>();
      const result = await pollJob(id, 180_000, 5000);
      assert(result.state === 'completed', 'Transcode completed');
      console.log('      ✓ Transcode job completed:', id.slice(0, 8));
    } else {
      assert(res.ok, `Transcode returned ${res.status}`);
      assert(res.headers.get('Content-Type')?.includes('video/') ?? false, 'Returns video content type');
      console.log('      ✓ Transcode returned video synchronously');
    }
  }

  console.log('  [2b] CoreML Vision classification…');
  const imagePath = path.join(fixtures, 'sample-image.jpg');
  if (!fs.existsSync(imagePath)) {
    console.warn('      SKIP: fixtures/sample-image.jpg not found');
  } else {
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(imagePath)], { type: 'image/jpeg' }), 'image.jpg');

    const res = await fetch(`${BASE_URL}/images/classifications`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: form,
    });

    if (res.status === 202) {
      const { id } = await res.json<{ id: string }>();
      const result = await pollJob(id, 30_000, 1000);
      assert(result.state === 'completed', 'Classification completed');
      console.log('      ✓ Classification job completed:', id.slice(0, 8));
    } else {
      assert(res.ok, `Classification returned ${res.status}`);
      const classification = await res.json<{ labels: Array<{ label: string; confidence: number }> }>();
      assertShape(classification, ['labels'], 'classification response');
      assert(classification.labels.length > 0, 'At least one label returned');
      console.log('      ✓ Top label:', classification.labels[0].label, `(${(classification.labels[0].confidence * 100).toFixed(1)}%)`);
    }
  }
}
